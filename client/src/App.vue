<script setup lang='ts'>
import { ref } from 'vue'
import { useAuth } from './composables/useAuth'
import DebugPanel from './components/DebugPanel.vue';
const { user, ready, error, signUp, signIn, signInGoogle, logout } = useAuth()
const email = ref(''), password = ref(''), name = ref('')
</script>

<template>
  <p v-if='!ready'>Loading...</p>
  <div v-else-if='!user'>
    <input v-model='name' placeholder='display name' />
    <input v-model='email' placeholder='email' />
    <input v-model='password' type='password' placeholder='password' />
    <button @click='signUp(email, password, name)'>Sign up</button>
    <button @click='signIn(email, password)'>Sign in</button>
    <button @click='signInGoogle()'>Google</button>
    <p>{{ error }}</p>
  </div>
  <div v-else>
    <p>Hello {{ user.displayName }}</p>
    <button @click='logout()'>Sign out</button>
  </div>
  <DebugPanel />
</template>
