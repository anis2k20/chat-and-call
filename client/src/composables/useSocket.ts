import { ref, watch } from "vue";
import type { ClientMsg, ServerMsg, UserInfo } from "@shared/types";
import { useAuth } from "./useAuth";

const { user, getIdToken } = useAuth();

const status = ref<"closed" | "connecting" | "open">("closed");
const me = ref<UserInfo | null>(null);
const online = ref<UserInfo[]>([]);
const users = ref<UserInfo[]>([]);
const listeners = new Set<(m: ServerMsg) => void>();
let ws: WebSocket | null = null;

async function connect() {
  const token = await getIdToken();
  if (!token || ws) return;
  status.value = "connecting";
  ws = new WebSocket(import.meta.env.VITE_WS_URL);
  ws.onopen = () => send({ type: "auth", token }, true);
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data) as ServerMsg;
    if (m.type === "auth-ok") {
      me.value = m.user;
      status.value = "open";
    }
    if (m.type === "presence") online.value = m.online;
    if (m.type === "users") users.value = m.users;
    listeners.forEach((fn) => fn(m));
  };
  ws.onclose = () => {
    ws = null;
    status.value = "closed";
    me.value = null;
    online.value = [];
  };
}

function disconnect() {
  ws?.close();
}

function send(m: ClientMsg, force = false) {
  if (ws?.readyState === WebSocket.OPEN && (force || status.value === "open"))
    ws.send(JSON.stringify(m));
}

function onMessage(fn: (m: ServerMsg) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Connect automatically when logged in, disconnect on logout
watch(user, (u) => (u ? connect() : disconnect()), { immediate: true });

export function useSocket() {
  return { status, me, online, users, send, onMessage };
}
