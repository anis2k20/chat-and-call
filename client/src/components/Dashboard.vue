<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useAuth } from "../composables/useAuth";
import { useSocket } from "../composables/useSocket";
import { useChat } from "../composables/useChat";
import { useCall } from "../composables/useCall";
import { usePush } from "../composables/usePush";
import { useTheme } from "../composables/useTheme";

const { logout } = useAuth();
const { status, me, online, users } = useSocket();
const { messagesWith, sendMessage, loadHistory } = useChat();
const { startCall, accept, reject, hangUp, toggleMute, state, muted, peerName, error } =
  useCall();
const { enable, permission, enabled, error: pushError } = usePush();
const { theme, toggleTheme } = useTheme();

const peer = ref("");
const text = ref("");
const list = ref<HTMLElement | null>(null);

const contacts = computed(() => {
  const map = new Map<string, { uid: string; displayName: string }>();
  [...users.value, ...online.value].forEach((u) => map.set(u.uid, u));
  map.delete(me.value?.uid ?? "");
  const onlineIds = new Set(online.value.map((u) => u.uid));
  return [...map.values()]
    .map((u) => ({ ...u, isOnline: onlineIds.has(u.uid) }))
    .sort((a, b) => Number(b.isOnline) - Number(a.isOnline));
});

const peerInfo = computed(() => contacts.value.find((c) => c.uid === peer.value));
const messages = computed(() => (peer.value ? messagesWith(peer.value) : []));
const inCall = computed(() => ["calling", "connecting", "connected"].includes(state.value));

watch(peer, (uid) => uid && loadHistory(uid));
watch(
  () => messages.value.length,
  async () => {
    await nextTick();
    if (list.value) list.value.scrollTop = list.value.scrollHeight;
  },
);

function submit() {
  if (!peer.value || !text.value.trim()) return;
  sendMessage(peer.value, text.value);
  text.value = "";
}

// Hang up first so the other side is not left ringing, then reload for a clean state
async function signOut() {
  if (state.value !== "idle") hangUp();
  await logout();
  location.reload();
}

const time = (ms: number) =>
  new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const initial = (name?: string) => (name?.trim()[0] ?? "?").toUpperCase();

// Shared class sets
const btnGhost =
  "rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";
const btnGreen =
  "rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700";
const btnRed =
  "rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700";
const alertBar =
  "border-b border-red-100 bg-red-50 px-5 py-1.5 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300";
</script>

<template>
  <div
    class="flex h-screen flex-col bg-slate-50 text-sm text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-200"
  >
    <!-- Header -->
    <header class="flex items-center gap-3 border-b bg-white px-5 py-3 dark:bg-slate-900">
      <div
        class="flex h-8 w-8  items-center justify-center rounded-full bg-slate-900 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900"
      >
        {{ initial(me?.displayName) }}
      </div>
      <div class="leading-tight">
        <p class="font-medium">{{ me?.displayName ?? "Connecting..." }}</p>
        <p class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span
            class="h-1.5 w-1.5 rounded-full"
            :class="status === 'open' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'"
          />
          {{ status === "open" ? "Connected" : status }}
        </p>
      </div>

      <div class="ml-auto flex items-center gap-2">
        <span class="hidden text-xs text-slate-400 sm:inline">Notifications: {{ permission }}</span>
        <button :class="btnGhost" :disabled="status !== 'open' || enabled" @click="enable()">
          {{ enabled ? "Push enabled" : "Enable push" }}
        </button>

        <!-- Theme toggle -->
        <button
          :class="btnGhost"
          class="!px-2"
          :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleTheme()"
        >
          <svg
            v-if="theme === 'dark'"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
            />
          </svg>
          <svg
            v-else
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
            />
          </svg>
        </button>

        <button :class="btnGhost" @click="signOut()">Sign out</button>
      </div>
    </header>

    <p v-if="pushError" :class="alertBar">Push error: {{ pushError }}</p>

    <!-- Incoming call -->
    <div
      v-if="state === 'ringing'"
      class="flex items-center gap-3 border-b border-amber-100 bg-amber-50 px-5 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/40"
    >
      <span class="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
      <span class="font-medium text-amber-900 dark:text-amber-200">
        Incoming call from {{ peerName || "someone" }}
      </span>
      <div class="ml-auto flex gap-2">
        <button :class="btnGreen" @click="accept()">Accept</button>
        <button :class="btnGhost" @click="reject()">Decline</button>
      </div>
    </div>

    <!-- Active call -->
    <div
      v-if="inCall"
      class="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50 px-5 py-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/40"
    >
      <span
        class="h-2 w-2 rounded-full bg-emerald-500"
        :class="state !== 'connected' && 'animate-pulse'"
      />
      <span class="font-medium text-emerald-900 dark:text-emerald-200">
        {{ state === "calling" ? "Calling" : state === "connecting" ? "Connecting to" : "In call with" }}
        {{ peerName }}
      </span>
      <div class="ml-auto flex gap-2">
        <button v-if="state === 'connected'" :class="btnGhost" @click="toggleMute()">
          {{ muted ? "Unmute" : "Mute" }}
        </button>
        <button :class="btnRed" @click="hangUp()">
          {{ state === "calling" ? "Cancel" : "Hang up" }}
        </button>
      </div>
    </div>

    <p v-if="error" :class="alertBar">{{ error }}</p>

    <div class="flex min-h-0 flex-1">
      <!-- Contacts -->
      <aside class="w-60 shrink-0 overflow-y-auto border-r bg-white dark:bg-slate-900">
        <p class="px-4 pb-1 pt-4 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          People
        </p>
        <p v-if="!contacts.length" class="px-4 py-2 text-xs text-slate-400">No other users yet</p>
        <button
          v-for="c in contacts"
          :key="c.uid"
          class="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
          :class="peer === c.uid && 'bg-slate-100 dark:bg-slate-800'"
          @click="peer = c.uid"
        >
          <div class="relative">
            <div
              class="flex h-8 w-8 border border-slate-300 dark:border-slate-600 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              {{ initial(c.displayName) }}
            </div>
            <span
              class="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900"
              :class="c.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'"
            />
          </div>
          <span class="truncate" :class="peer === c.uid && 'font-medium'">{{ c.displayName }}</span>
        </button>
      </aside>

      <!-- Chat -->
      <main class="flex min-w-0 flex-1 flex-col bg-white dark:bg-slate-900">
        <div v-if="!peer" class="m-auto text-slate-400">
            <!-- <img src="../assets/chat.png" alt="Chat" class="mx-auto mb-2 max-w-[50px]" /> -->
             <p class="mx-auto w-12 h-12 flex items-center justify-center  text-center ">
                 <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-messages-circle preview-icon"><path d="M19.95 10.05a7 7 0 011.412 7.872 1 1 0 00-.058.787l.675 2.089a1 1 0 01-1.236 1.168l-2.155-.631a1 1 0 00-.745.06 7 7 0 01-7.793-1.445"/><path d="M2.696 12.708a1 1 0 00-.058-.785 7 7 0 113.518 3.473 1 1 0 00-.744-.061l-2.155.63a1 1 0 01-1.236-1.167z"/></svg>
                </p>
            Select a person to start chatting
        </div>

        <template v-else>
          <div class="flex items-center gap-3 border-b px-5 py-3">
            <div>
              <p class="font-medium leading-tight">{{ peerInfo?.displayName }}</p>
              <p class="text-xs text-slate-400">{{ peerInfo?.isOnline ? "Online" : "Offline" }}</p>
            </div>
            <button
              :class="btnGhost"
              class="ml-auto"
              :disabled="state !== 'idle' || status !== 'open'"
              @click="startCall(peer)"
            >
              Voice call
            </button>
          </div>

          <div
            ref="list"
            class="flex-1 space-y-1.5 overflow-y-auto bg-slate-50/60 px-5 py-4 dark:bg-slate-950/40"
          >
            <div
              v-for="m in messages"
              :key="m.id"
              class="flex"
              :class="m.senderUid === me?.uid ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[70%] rounded-2xl px-3.5 py-2"
                :class="
                  m.senderUid === me?.uid
                    ? 'rounded-br-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'rounded-bl-md border bg-white dark:bg-slate-800'
                "
              >
                <p class="whitespace-pre-wrap break-words">{{ m.text }}</p>
                <p class="mt-0.5 text-right text-[10px] text-slate-400 dark:text-slate-500">
                  {{ time(m.createdAt) }}<span v-if="m.status === 'sending'"> · sending</span>
                </p>
              </div>
            </div>
          </div>

          <form class="flex items-center gap-2 border-t px-4 py-3" @submit.prevent="submit">
            <input
              v-model="text"
              class="flex-1 rounded-lg border bg-white px-3.5 py-2 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 dark:bg-slate-900 dark:focus:border-slate-500 dark:focus:ring-slate-800"
              placeholder="Write a message..."
              maxlength="2000"
            />
            <button
              class="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              :disabled="!text.trim() || status !== 'open'"
            >
              Send
            </button>
          </form>
        </template>
      </main>
    </div>
  </div>
</template>