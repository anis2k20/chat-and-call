export interface UserInfo {
  uid: string;
  displayName: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  senderUid: string;
  text: string;
  createdAt: number;
}

// Own minimal shapes so the server needs no DOM types
export type Sdp = { type: "offer" | "answer"; sdp?: string };
export type Ice = {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
};

export type ClientMsg =
  | { type: "auth"; token: string }
  | { type: "users" }
  | { type: "chat"; id: string; to: string; text: string }
  | { type: "history"; withUid: string; before?: number }
  | { type: "visibility"; visible: boolean }
  | { type: "register-device"; fcmToken: string }
  | { type: "call-offer"; to: string; sdp: Sdp }
  | { type: "call-answer"; to: string; sdp: Sdp }
  | { type: "ice-candidate"; to: string; candidate: Ice }
  | { type: "call-reject"; to: string }
  | { type: "call-end"; to: string };

export type ServerMsg =
  | { type: "auth-ok"; user: UserInfo }
  | { type: "error"; message: string }
  | { type: "presence"; online: UserInfo[] }
  | { type: "users"; users: UserInfo[] }
  | { type: "chat"; message: ChatMessage }
  | { type: "chat-ack"; message: ChatMessage }
  | { type: "history"; withUid: string; messages: ChatMessage[] }
  | { type: "call-offer"; from: string; fromName: string; sdp: Sdp }
  | { type: "call-answer"; from: string; sdp: Sdp }
  | { type: "ice-candidate"; from: string; candidate: Ice }
  | { type: "call-reject"; from: string; reason?: string }
  | { type: "call-end"; from: string };
