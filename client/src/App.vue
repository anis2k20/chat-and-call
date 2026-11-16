<script setup lang="ts">
import { useAuth } from "./composables/useAuth";
import Dashboard from "./components/Dashboard.vue";
import AuthForm from "./components/AuthForm.vue";
const { user, ready } = useAuth();
</script>

<template>
  <div
    v-if="!ready"
    class="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400"
  >
    <div class="relative h-16 w-16" role="status" aria-label="Loading">
      <div class="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-950" />
      <div
        class="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600 border-r-indigo-500"
      />
      <div
        class="absolute inset-3 animate-pulse rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30"
      />
    </div>

  </div>
  <AuthForm v-else-if="!user" />
  <Dashboard v-else />
</template>
