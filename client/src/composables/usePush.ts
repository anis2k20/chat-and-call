import { ref } from "vue";
import { getMessaging, getToken } from "firebase/messaging";
import { app } from "../lib/firebase";
import { useSocket } from "./useSocket";

const { send } = useSocket();

const permission = ref<NotificationPermission>(
  "Notification" in window ? Notification.permission : "denied",
);

async function enable() {
  permission.value = await Notification.requestPermission();
  if (permission.value !== "granted") return;
  const registration = await navigator.serviceWorker.register(
    "/firebase-messageing-sw.js",
  );
  const fcmToken = await getToken(getMessaging(app), {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  send({ type: "register-device", fcmToken });
}

export function usePush() {
  return { permission, enable };
}
