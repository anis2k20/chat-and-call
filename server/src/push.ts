import { getMessaging } from "firebase-admin/messaging";
import { db } from "./auth";

export async function pushToUser(
  uid: string,
  title: string,
  body: string,
  tag: string,
) {
  const snap = await db.collection(`users/${uid}/devices`).get();

  if (snap.empty) {
    console.warn(`No FCM device token stored for user ${uid}`);
    return;
  }

  const tokens = snap.docs.map((d) => d.data().fcmToken as string);
  const res = await getMessaging().sendEachForMulticast({
    tokens,
    data: { title, body, tag },
  });

  console.log(`FCM call/chat push sent to ${uid}: ${res.successCount} succeeded, ${res.failureCount} failed`);

  await Promise.all(
    res.responses.map(async (r, i) => {
      if (r.success) return;

      const code = r.error?.code ?? "unknown";
      const message = r.error?.message ?? "unknown FCM error";
      console.error(`FCM token ${i} failed: ${code}: ${message}`);

      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token" ||
        code === "messaging/invalid-argument"
      ) {
        await snap.docs[i].ref.delete();
      }
    }),
  );
}

export async function saveDevice(uid: string, fcmToken: string) {
  if (typeof fcmToken !== "string" || !fcmToken) return;
  await db
    .doc(`users/${uid}/devices/${fcmToken}`)
    .set({ fcmToken, platform: "web", updatedAt: new Date() });
  console.log(`FCM device token saved for user ${uid}`);
}
