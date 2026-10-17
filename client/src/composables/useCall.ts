import { ref, watch } from "vue";
import type { Ice, Sdp } from "@shared/types";
import { useSocket } from "./useSocket";
import { useSounds } from "./useSounds";

const { startRing, stopRing } = useSounds();

export type CallState =
  | "idle"
  | "calling"
  | "ringing"
  | "connecting"
  | "connected";

const { send, onMessage, online, users } = useSocket();

const state = ref<CallState>("idle");
const peerUid = ref<string | null>(null);
const peerName = ref("");
const muted = ref(false);
const error = ref("");

let pc: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;
let pendingOffer: Sdp | null = null;
let queuedIce: Ice[] = []; // candidates that arrive before the remote description is set
const audio = new Audio(); // plays the remote voice; no component needed
audio.autoplay = true;

watch(state, (s)=>(s === "ringing" ? startRing() : stopRing()));

function createPc(peer: string) {
  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });
  pc.onicecandidate = (e) => {
    if (e.candidate)
      send({
        type: "ice-candidate",
        to: peer,
        candidate: e.candidate.toJSON(),
      });
  };
  pc.ontrack = (e) => {
    audio.srcObject = e.streams[0];
  };
  pc.onconnectionstatechange = () => {
    const s = pc?.connectionState;
    if (s === "connected") state.value = "connected";
    if (s === "failed" || s === "closed") cleanup();
  };
  localStream!.getTracks().forEach((t) => pc!.addTrack(t, localStream!));
}

async function getMic() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch {
    error.value = "Microphone blocked or missing";
    return false;
  }
}

async function flushIce() {
  for (const c of queuedIce) await pc!.addIceCandidate(c);
  queuedIce = [];
}

function cleanup() {
  pc?.close();
  pc = null;
  localStream?.getTracks().forEach((t) => t.stop());
  localStream = null;
  audio.srcObject = null;
  pendingOffer = null;
  queuedIce = [];
  peerUid.value = null;
  peerName.value = "";
  muted.value = false;
  state.value = "idle";
}

async function startCall(to: string) {
  if (state.value !== "idle" || !(await getMic())) return;
  error.value = "";
  peerUid.value = to;
  peerName.value =
    [...online.value, ...users.value].find((u) => u.uid === to)?.displayName ??
    "";
  state.value = "calling";
  ringTimer = setTimeout(() => {
    if (state.value === "calling") hangUp();
  }, 30000);
  createPc(to);
  const offer = await pc!.createOffer();
  await pc!.setLocalDescription(offer);
  send({ type: "call-offer", to, sdp: { type: "offer", sdp: offer.sdp } });
}

async function accept() {
  if (state.value !== "ringing" || !pendingOffer || !peerUid.value) return;
  if (!(await getMic())) return reject();
  createPc(peerUid.value);
  await pc!.setRemoteDescription(pendingOffer as RTCSessionDescriptionInit);
  await flushIce();
  const answer = await pc!.createAnswer();
  await pc!.setLocalDescription(answer);
  send({
    type: "call-answer",
    to: peerUid.value,
    sdp: { type: "answer", sdp: answer.sdp },
  });
  state.value = "connecting";
}

onMessage(async (m) => {
  if (m.type === "call-offer") {
    // if (state.value !== "idle") return; // Step 9 replies 'busy'
    if (state.value !== "idle")
      return send({ type: "call-reject", to: m.from });
    peerUid.value = m.from;
    peerName.value = m.fromName;
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

  if (
    (m.type === "call-reject" || m.type === "call-end") &&
    m.from === peerUid.value
  ) {
    if (m.type === "call-reject")
      error.value =
        m.reason === "offline" ? "User is offline" : "Call declined";
    cleanup();
  }
});

export function useCall() {
  return { state, peerUid, peerName, muted, error, startCall, accept, reject, hangUp, toggleMute };
}

let ringTimer: ReturnType<typeof setTimeout> | undefined;

function reject() {
  if (state.value === "ringing" && peerUid.value)
    send({ type: "call-reject", to: peerUid.value });
  cleanup();
}

function hangUp() {
  if (peerUid.value) send({ type: "call-end", to: peerUid.value });
  cleanup();
}

function toggleMute() {
  muted.value = !muted.value;
  localStream?.getAudioTracks().forEach((t) => (t.enabled = !muted.value));
}

