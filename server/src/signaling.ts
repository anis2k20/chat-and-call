import type { WebSocket } from "ws";
import type { ClientMsg, ServerMsg, UserInfo } from "../../shared/types";
import { send, sendToUser } from "./connections";

type SignalMsg = Extract<
  ClientMsg,
  {
    type:
      | "call-offer"
      | "call-answer"
      | "ice-candidate"
      | "call-reject"
      | "call-end";
  }
>;

export function handleSignal(user: UserInfo, ws: WebSocket, msg: SignalMsg) {
  if (typeof msg.to !== "string" || msg.to === user.uid) return;
  const from = user.uid;

  let out: ServerMsg;
  switch (msg.type) {
    case "call-offer":
      out = {
        type: "call-offer",
        from,
        fromName: user.displayName,
        sdp: msg.sdp,
      };
      break;

    case "call-answer":
      out = { type: "call-answer", from, sdp: msg.sdp };
      break;

    case "ice-candidate":
      out = { type: "ice-candidate", from, candidate: msg.candidate };
      break;

    case "call-reject":
      out = { type: "call-reject", from };
      break;

    case "call-end":
      out = { type: "call-end", from };
      break;
  }

  const deleivered = sendToUser(msg.to, out);
  if (msg.type === "call-offer" && !deleivered) {
    send(ws, { type: "call-reject", from: msg.to, reason: "offline" });
  }
}
