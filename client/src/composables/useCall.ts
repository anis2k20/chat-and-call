import { ref, shallowRef, watch } from "vue";
import type { Ice, Sdp } from "@shared/types";
import { useSocket } from "./useSocket";
import { useSounds } from "./useSounds";

export type CallState = "idle" | "calling" | "ringing" | "connecting" | "connected";

const { send, onMessage, online, users } = useSocket();
const { startRing, stopRing } = useSounds();

const state = ref<CallState>("idle");
const peerUid = ref<string | null>(null);
const peerName = ref("");
const muted = ref(false);
const error = ref("");
const isVideo = ref(false);
const camOff = ref(false);
const localStream = shallowRef<MediaStream | null>(null);
const remoteStream = shallowRef<MediaStream | null>(null);

watch(state, (s) => (s === "ringing" ? startRing() : stopRing()));

let pc: RTCPeerConnection | null = null;
let pendingOffer: Sdp | null = null;
let queuedIce: Ice[] = [];
let ringTimer: ReturnType<typeof setTimeout> | undefined;
const audio = new Audio(); // voice chalay; video element muted thakbe, tai double audio hobe na
audio.autoplay = true;

function createPc(peer: string) {
  pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
  pc.onicecandidate = (e) => {
    if (e.candidate) send({ type: "ice-candidate", to: peer, candidate: e.candidate.toJSON() });
  };
  pc.ontrack = (e) => {
    remoteStream.value = e.streams[0];
    audio.srcObject = e.streams[0];
  };
  pc.onconnectionstatechange = () => {
    const s = pc?.connectionState;
    if (s === "connected") state.value = "connected";
    if (s === "failed" || s === "closed") cleanup();
  };
  const stream = localStream.value!;
  stream.getTracks().forEach((t) => pc!.addTrack(t, stream));
}

async function getMedia(video: boolean) {
  try {
    localStream.value = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: video ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } : false,
    });
    return true;
  } catch {
    error.value = video ? "Camera or microphone blocked" : "Microphone blocked or missing";
    return false;
  }
}

async function flushIce() {
  for (const c of queuedIce) await pc!.addIceCandidate(c);
  queuedIce = [];
}

function cleanup() {
  clearTimeout(ringTimer);
  pc?.close();
  pc = null;
  localStream.value?.getTracks().forEach((t) => t.stop());
  localStream.value = null;
  remoteStream.value = null;
  audio.srcObject = null;
  pendingOffer = null;
  queuedIce = [];
  peerUid.value = null;
  peerName.value = "";
  muted.value = false;
  camOff.value = false;
  isVideo.value = false;
  state.value = "idle";
}

async function startCall(to: string, withVideo = false) {
  if (state.value !== "idle" || !(await getMedia(withVideo))) return;
  error.value = "";
  isVideo.value = withVideo;
  peerUid.value = to;
  peerName.value = [...online.value, ...users.value].find((u) => u.uid === to)?.displayName ?? "";
  state.value = "calling";
  ringTimer = setTimeout(() => { if (state.value === "calling") hangUp(); }, 30000);
  createPc(to);
  const offer = await pc!.createOffer();
  await pc!.setLocalDescription(offer);
  send({ type: "call-offer", to, sdp: { type: "offer", sdp: offer.sdp }, video: withVideo });
}

async function accept() {
  if (state.value !== "ringing" || !pendingOffer || !peerUid.value) return;
  if (!(await getMedia(isVideo.value))) return reject();
  createPc(peerUid.value);
  await pc!.setRemoteDescription(pendingOffer as RTCSessionDescriptionInit);
  await flushIce();
  const answer = await pc!.createAnswer();
  await pc!.setLocalDescription(answer);
  send({ type: "call-answer", to: peerUid.value, sdp: { type: "answer", sdp: answer.sdp } });
  state.value = "connecting";
}

function reject() {
  if (state.value === "ringing" && peerUid.value) send({ type: "call-reject", to: peerUid.value });
  cleanup();
}

function hangUp() {
  if (peerUid.value) send({ type: "call-end", to: peerUid.value });
  cleanup();
}

function toggleMute() {
  muted.value = !muted.value;
  localStream.value?.getAudioTracks().forEach((t) => (t.enabled = !muted.value));
}

function toggleCamera() {
  camOff.value = !camOff.value;
  localStream.value?.getVideoTracks().forEach((t) => (t.enabled = !camOff.value));
}

onMessage(async (m) => {
  if (m.type === "call-offer") {
    if (state.value !== "idle") return send({ type: "call-reject", to: m.from }); // busy
    peerUid.value = m.from;
    peerName.value = m.fromName;
    isVideo.value = m.video === true;
    pendingOffer = m.sdp;
    state.value = "ringing";
  }
  if (m.type === "call-answer" && pc && m.from === peerUid.value) {
    await pc.setRemoteDescription(m.sdp as RTCSessionDescriptionInit);
    await flushIce();
    state.value = "connecting";
  }
  if (m.type === "ice-candidate" && m.from === peerUid.value) {
    if (pc?.remoteDescription) await pc.addIceCandidate(m.candidate);
    else queuedIce.push(m.candidate);
  }
  if ((m.type === "call-reject" || m.type === "call-end") && m.from === peerUid.value) {
    if (m.type === "call-reject") error.value = m.reason === "offline" ? "User is offline" : "Call declined";
    cleanup();
  }
});

export function useCall() {
  return {
    state, peerUid, peerName, muted, error,
    isVideo, camOff, localStream, remoteStream,
    startCall, accept, reject, hangUp, toggleMute, toggleCamera,
  };
}