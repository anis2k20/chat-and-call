import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { UserInfo } from "../../shared/types";

const app = initializeApp({
  credential: applicationDefault(),
});
const adminAuth = getAuth(app);
export const db = getFirestore(app);

export async function verifyToken(
  token: string,
): Promise<UserInfo & { email: string }> {
  const d = await adminAuth.verifyIdToken(token);
  return {
    uid: d.uid,
    displayName: d.name ?? d.email ?? d.uid,
    email: d.email ?? "",
  };
}

export async function ensureUserDoc(u: UserInfo & { email: string }) {
  const ref = db.doc(`users/${u.uid}`);
  if (!(await ref.get()).exists) {
    await ref.set({
      uid: u.uid,
      displayName: u.displayName,
      email: u.email,
      createdAt: Date.now(),
    });
  }
}
