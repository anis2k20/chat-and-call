<script setup lang="ts">
import { ref } from "vue";
import { useSocket } from "../composables/useSocket";
import { useChat } from "../composables/useChat";
import { useCall } from "../composables/useCall";
import { usePush } from "../composables/usePush";

const { status, me, online } = useSocket();
const { messagesWith, sendMessage } = useChat();
const { startCall, state, error, accept } = useCall();
const { enable, permission, enabled, error: pushError } = usePush();
const peer = ref(""),
  text = ref("");
function submit() {
  sendMessage(peer.value, text.value);
  text.value = "";
}
</script>

<template>
    <button :disabled="status !== 'open'" style="width: 200px" @click="enable()">
      {{ enabled ? "Push enabled" : "Enable Push notifications" }}
    </button>
    <p>Notification permission: {{ permission }}</p>
    <p v-if="pushError">Push error: {{ pushError }}</p>
  <p>
    Socket: {{ status }} | online:
    {{ online.map((u) => u.displayName).join(", ") }}
  </p>
  <select v-model="peer">
    <option value="">choose user</option>
    <option
      v-for="u in online.filter((u) => u.uid !== me?.uid)"
      :key="u.uid"
      :value="u.uid"
    >
      {{ u.displayName }}
    </option>
  </select>
  <div v-if="peer">
    <p v-for="m in messagesWith(peer)" :key="m.id">
      {{ m.senderUid === me?.uid ? "me" : "them" }}: {{ m.text }} ({{
        m.status
      }})
    </p>
    <input v-model="text" @keyup.enter="submit" />
    <button @click="startCall(peer)">Call</button>
    <button v-if="state === 'ringing'" @click="accept()">Accept</button>


    <p v-if="state !== 'idle'">Call state: {{ state }}</p>
    <p v-if="error">Error: {{ error }}</p>
  </div>
</template>
