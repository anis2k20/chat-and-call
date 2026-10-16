<script setup lang='ts'>
import { ref } from 'vue'
import { useSocket } from '../composables/useSocket'
import { useChat } from '../composables/useChat'
const { status, me, online } = useSocket()
const { messagesWith, sendMessage } = useChat()
const peer = ref(''), text = ref('')
function submit() { sendMessage(peer.value, text.value); text.value = '' }
</script>

<template>
    <p>Socket: {{ status }} | online: {{online.map(u => u.displayName).join(', ')}}</p>
    <select v-model='peer'>
        <option value=''>choose user</option>
        <option v-for='u in online.filter(u => u.uid !== me?.uid)' :key='u.uid' :value='u.uid'>{{ u.displayName }}
        </option>
    </select>
    <div v-if='peer'>
        <p v-for='m in messagesWith(peer)' :key='m.id'>{{ m.senderUid === me?.uid ? 'me' : 'them' }}: {{ m.text }} ({{
            m.status }})</p>
        <input v-model='text' @keyup.enter='submit' />
    </div>
</template>
