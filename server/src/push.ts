import { getMessaging } from "firebase-admin/messaging";
import { db } from "./auth";

export async function pushToUser(
  uid: string,
  title: string,
  body: string,
  tag: string,
) {
  const snap = await db.collection(`users/${uid}/devices`).get();

  if (snap.empty) return;

  const tokens = snap.docs.map((d) => d.data().fcmToken as string);
  const res = await getMessaging().sendEachForMulticast({
    tokens,
    data: { title, body, tag },
  });

  await Promise.all(
    res.responses.map((r, i) => {
      const code = r.error?.code;
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token"
      ) {
        return snap.docs[i].ref.delete();
      }
    }),
  );
}

export async function saveDevice(uid: string, fcmToken: string) {
  if (typeof fcmToken !== "string" || !fcmToken) return;
  await db
    .doc(`users/${uid}/devices/${fcmToken}`)
    .set({ fcmToken, platform: "web", updatedAt: new Date() });
}
