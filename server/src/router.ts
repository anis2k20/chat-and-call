import type { WebSocket } from "ws";
import type { ClientMsg, UserInfo } from "../../shared/types";
import { verifyToken, ensureUserDoc, db } from "./auth.js";
import {
  send,
  addSocket,
  removeSocket,
  braodcastPresence,
} from "./connections.js";
import { handleChat, handleHistory, handleUsers } from "./chat.js";
import { handleSignal } from "./signaling.js";

export async function handleConnection(ws: WebSocket) {
  let user: UserInfo | null = null;
  const timer = setTimeout(() => {
    if (!user) {
      ws.close(4001, "Auth timeout");
    }
  }, 5000);

  ws.on("message", async (raw) => {
    let msg: ClientMsg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return send(ws, { type: "error", message: "Invalid JSON" });
    }

    if (!user) {
      if (msg.type !== "auth") {
        return ws.close(4001, "Auth required");
      }
      try {
        const varified = await verifyToken(msg.token);
        await ensureUserDoc(varified);
        user = { uid: varified.uid, displayName: varified.displayName };
      } catch {
        return ws.close(4003, "Invalid token");
      }
      clearTimeout(timer);
      send(ws, { type: "auth-ok", user });
      addSocket(user, ws);
      braodcastPresence();
      return;
    }
    route(user, ws, msg);
  });

  ws.on("close", () => {
    clearTimeout(timer);
    if (user) {
      removeSocket(user.uid, ws);
      braodcastPresence();
    }
  });
}

function route(user: UserInfo, ws: WebSocket, msg: ClientMsg) {
  switch (msg.type) {
    case "chat":
      return void handleChat(user, ws, msg);

    case "history":
      return void handleHistory(user, ws, msg);

    case "users":
      return void handleUsers(ws);

    case "call-offer":
    case "call-answer":
    case "ice-candidate":
    case "call-reject":
    case "call-end":
      return void handleSignal(user, ws, msg);
  }
}
