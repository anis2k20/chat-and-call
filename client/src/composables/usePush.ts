import { ref } from "vue";
import { getMessaging, getToken } from "firebase/messaging";
import { app } from "../lib/firebase";
import { useSocket } from "./useSocket";

const { send } = useSocket();

const permission = ref<NotificationPermission>(
  "Notification" in window ? Notification.permission : "denied",
);
const error = ref("");
const enabled = ref(false);

async function enable() {
  error.value = "";
  try {
    permission.value = await Notification.requestPermission();
    if (permission.value !== "granted") return;
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    );
    await navigator.serviceWorker.ready;
    const fcmToken = await getToken(getMessaging(app), {
      vapidKey: import.meta.env.VITE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    if (!fcmToken) throw new Error("Firebase did not return an FCM token");
    send({ type: "register-device", fcmToken });
    enabled.value = true;
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
    console.error("FCM setup failed", e);
  }
}

export function usePush() {
  return { permission, enabled, error, enable };
}
