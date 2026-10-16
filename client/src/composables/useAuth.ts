import { ref } from "vue";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "../lib/firebase";

const user = ref<User | null>(null);
const ready = ref(false);
const error = ref("");

onAuthStateChanged(auth, (u) => {
  user.value = u;
  ready.value = true;
});

async function run(fn: () => Promise<unknown>) {
  error.value = "";
  try {
    await fn();
  } catch (e: any) {
    error.value = e.code ?? String(e);
  }
}

export function useAuth() {
  return {
    user,
    ready,
    error,
    signUp: (email: string, password: string, name: string) =>
      run(async () => {
        const c = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(c.user, { displayName: name });
        await c.user.getIdToken(true); // refresh so the token contains the new name
      }),
    signIn: (email: string, password: string) =>
      run(() => signInWithEmailAndPassword(auth, email, password)),
    signInGoogle: () =>
      run(() => signInWithPopup(auth, new GoogleAuthProvider())),
    logout: () => run(() => signOut(auth)),
    getIdToken: () => auth.currentUser?.getIdToken(),
  };
}
