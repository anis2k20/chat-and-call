<script setup lang="ts">
import { computed, ref } from "vue";
import { useAuth } from "../composables/useAuth";
import { useTheme } from "../composables/useTheme";

const { error, signUp, signIn, signInGoogle } = useAuth();
const { theme, toggleTheme } = useTheme();

const mode = ref<"signin" | "signup">("signin");
const isSignup = computed(() => mode.value === "signup");

const name = ref("");
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const busy = ref(false);

const messages: Record<string, string> = {
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/popup-closed-by-user": "",
  "auth/cancelled-popup-request": "",
};
const friendlyError = computed(() =>
  !error.value
    ? ""
    : (messages[error.value] ?? `Something went wrong (${error.value}).`),
);

function switchMode() {
  mode.value = isSignup.value ? "signin" : "signup";
  error.value = "";
  password.value = "";
  showPassword.value = false;
}

async function submit() {
  busy.value = true;
  try {
    if (isSignup.value) await signUp(email.value.trim(), password.value, name.value.trim());
    else await signIn(email.value.trim(), password.value);
  } finally {
    busy.value = false;
  }
}

async function google() {
  busy.value = true;
  try {
    await signInGoogle();
  } finally {
    busy.value = false;
  }
}

const input =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-950";
const label = "text-slate-700 dark:text-slate-300";
const link =
  "text-blue-700 underline decoration-dotted underline-offset-4 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300";
</script>

<template>
  <div
    class="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10 text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-200"
  >
    <!-- Theme toggle -->
    <button
      class="absolute right-4 top-4 rounded-md border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="toggleTheme()"
    >
      <svg v-if="theme === 'dark'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
      <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
      </svg>
    </button>

    <div class="w-full max-w-md">
      <!-- Heading -->
      <div class="mb-6 text-center">
        <h1 class="text-3xl font-medium text-slate-900 dark:text-white">
          {{ isSignup ? "Create your account" : "Welcome back" }}
        </h1>
        <p class="mt-3 text-base">
          {{ isSignup ? "Already have an account?" : "Don't have an account?" }}
          <button type="button" :class="link" @click="switchMode">
            {{ isSignup ? "Sign in" : "Sign up" }}
          </button>.
        </p>
      </div>

      <!-- Card -->
      <div
        class="rounded-xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:p-8"
      >
        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-2.5 font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-blue-300 dark:hover:bg-slate-800"
          :disabled="busy"
          @click="google"
        >
          <svg class="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Continue with Google
        </button>

        <div class="my-6 flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <span class="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <span class="text-sm">Or continue with email</span>
          <span class="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        <form class="space-y-5" @submit.prevent="submit">
          <div v-if="isSignup">
            <label for="name" :class="label">Display name</label>
            <input id="name" v-model="name" :class="input" class="mt-1.5" type="text" autocomplete="name" required maxlength="40" />
          </div>

          <div>
            <label for="email" :class="label">Email address</label>
            <input id="email" v-model="email" :class="input" class="mt-1.5" type="email" autocomplete="username" required />
          </div>

          <div>
            <div class="flex items-center justify-between">
              <label for="password" :class="label">Password</label>
              <button type="button" :class="link" @click="showPassword = !showPassword">
                {{ showPassword ? "Hide" : "Show" }}
              </button>
            </div>
            <input
              id="password"
              v-model="password"
              :class="input"
              class="mt-1.5"
              :type="showPassword ? 'text' : 'password'"
              :autocomplete="isSignup ? 'new-password' : 'current-password'"
              required
              minlength="6"
            />
          </div>

          <p
            v-if="friendlyError"
            class="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          >
            {{ friendlyError }}
          </p>

          <button
            class="w-full rounded-md bg-blue-600 px-4 py-2.5 text-base font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="busy"
          >
            {{ busy ? "Please wait..." : isSignup ? "Create account" : "Sign in" }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>