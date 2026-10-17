import type { WebSocket } from "ws";
import type { ClientMsg, ChatMessage, UserInfo } from "../../shared/types";
import { chatIdFor } from "../../shared/chat";
import { send, sendToUser, isViewing } from "./connections.js";
import { db } from "./auth.js";
import { pushToUser } from "./push.js";

export async function handleChat(
  user: UserInfo,
  ws: WebSocket,
  msg: Extract<ClientMsg, { type: "chat" }>,
) {
  const text = typeof msg.text === "string" ? msg.text.trim() : "";
  if (
    !text ||
    text.length > 2000 ||
    typeof msg.to !== "string" ||
    typeof msg.id !== "string"
  )
    return;

  const message: ChatMessage = {
    id: msg.id,
    chatId: chatIdFor(user.uid, msg.to),
    senderUid: user.uid,
    text: text,
    createdAt: Date.now(),
  };

  const chatRef = db.doc(`chats/${message.chatId}`);
  await chatRef.set(
    {
      chatId: message.chatId,
      perticipants: [user.uid, msg.to],
      createdAt: Date.now(),
    },
    { merge: true },
  );
  await chatRef.collection("messages").doc(message.id).set(message);

  send(ws, { type: "chat-ack", message });
  sendToUser(msg.to, { type: "chat", message });
  if (!isViewing(msg.to))
    pushToUser(
      msg.to,
      user.displayName,
      text.slice(0, 100),
      "chat-" + user.uid,
    ).catch(console.error);
}
// history
export async function handleHistory(
  user: UserInfo,
  ws: WebSocket,
  msg: Extract<ClientMsg, { type: "history" }>,
) {
  if (typeof msg.withUid !== "string") return;
  // chatId is built from the caller's own uid, so nobody can read other people's chats
  const chatId = chatIdFor(user.uid, msg.withUid);
  let q = db
    .collection(`chats/${chatId}/messages`)
    .orderBy("createdAt", "desc")
    .limit(30);
  if (typeof msg.before === "number") q = q.startAfter(msg.before);
  const snap = await q.get();
  send(ws, {
    type: "history",
    withUid: msg.withUid,
    messages: snap.docs.map((d) => d.data() as ChatMessage).reverse(),
  });
}

// list all users so you can chat with offline people
export async function handleUsers(ws: WebSocket) {
  const snap = await db.collection("users").get();
  send(ws, {
    type: "users",
    users: snap.docs.map((d) => ({
      uid: d.id,
      displayName: d.data().displayName,
    })),
  });
}
