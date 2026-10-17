<script setup lang="ts">
import { useAuth } from "./composables/useAuth";
import Dashboard from "./components/Dashboard.vue";
import AuthForm from "./components/AuthForm.vue";
const { user } = useAuth();
</script>

<template>
  <AuthForm v-if="!user" />
  <Dashboard v-if="user" />
</template>
