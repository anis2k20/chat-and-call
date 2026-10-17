// Use the same major version as your installed firebase package (npm ls firebase)
importScripts(
  "https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyC7RKclv8QoOOlfcwNqD1hsLEFOLZ-DS68",
  projectId: "chat-and-call-5388c",
  messagingSenderId: "465528895571",
  appId: "1:465528895571:web:60c1fa442fccd876306ea6",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const d = payload.data;
  self.registration.showNotification(d.title, {
    body: d.body,
    tag: d.tag,
  });
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  e.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const c of list) if ("focus" in c) return c.focus();
        return clients.openWindow("/");
      }),
  );
});
