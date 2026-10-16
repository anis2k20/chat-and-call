import type { WebSocket } from "ws";
import type { ServerMsg, UserInfo } from "../../shared/types";
//some, set, map study
type Entry = { user: UserInfo; sockets: Map<WebSocket, { visible: boolean }> };
const registry = new Map<string, Entry>();

export function send(ws: WebSocket, msg: ServerMsg) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

export function addSocket(user: UserInfo, ws: WebSocket) {
  const e = registry.get(user.uid) ?? { user, sockets: new Map() };
  e.sockets.set(ws, { visible: true });
  registry.set(user.uid, e);
}

export function removeSocket(user: UserInfo, ws: WebSocket) {
  const e = registry.get(user.uid);
  if (!e) return;
  e.sockets.delete(ws);
  if (!e.sockets.size) registry.delete(user.uid);
}

export function setVisible(uid: string, ws: WebSocket, visible: boolean) {
  const s = registry.get(uid)?.sockets.get(ws);
  if (s) s.visible = visible;
}

export function isViewing(uid: string) {
  const e = registry.get(uid);
  return !!e && [...e.sockets.values()].some((s) => s.visible);
}

export function sendToUser(uid: string, msg: ServerMsg) {
  const e = registry.get(uid);
  if (!e) return;
  for (const ws of e.sockets.keys()) send(ws, msg);
  return true;
}

export function braodcastPresence() {
  const msg: ServerMsg = {
    type: "presence",
    online: [...registry.values()].map((e) => e.user),
  };
  for (const e of registry.values()) {
    for (const ws of e.sockets.keys()) send(ws, msg);
  }
}
