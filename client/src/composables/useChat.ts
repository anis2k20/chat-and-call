import { reactive } from "vue";
import type { ChatMessage } from "@shared/types";
import { chatIdFor } from "@shared/chat";
import { useSocket } from "./useSocket";

export type LocalMessage = ChatMessage & { status: "sending" | "sent" };

const { me, send, onMessage } = useSocket();

const threads = reactive<Record<string, LocalMessage[]>>({});

function upsert(m: LocalMessage) {
  const t = (threads[m.chatId] ??= []);
  const i = t.findIndex((x) => x.id === m.id);
  if (i >= 0) t[i] = m;
  else t.push(m);
  t.sort((a, b) => a.createdAt - b.createdAt);
}

onMessage((m) => {
  if (m.type === "chat" || m.type === "chat-ack")
    upsert({ ...m.message, status: "sent" });
  if (m.type === "history")
    m.messages.forEach((x) => upsert({ ...x, status: "sent" }));
});

export function useChat() {
  return {
    messagesWith: (uid: string): LocalMessage[] =>
      me.value ? (threads[chatIdFor(me.value.uid, uid)] ?? []) : [],
    sendMessage(to: string, text: string) {
      if (!me.value || !text.trim()) return;
      const id = crypto.randomUUID();
      upsert({
        id,
        chatId: chatIdFor(me.value.uid, to),
        senderUid: me.value.uid,
        text,
        createdAt: Date.now(),
        status: "sending",
      });
      send({ type: "chat", id, to, text });
    },
    loadHistory(withUid: string, before?: number) {
      send({ type: "history", withUid, before });
    },
  };
}