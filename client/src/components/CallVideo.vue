<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { useCall } from "../composables/useCall";

const { isVideo, state, camOff, localStream, remoteStream } = useCall();
const localEl = ref<HTMLVideoElement | null>(null);
const remoteEl = ref<HTMLVideoElement | null>(null);

watchEffect(() => { if (localEl.value) localEl.value.srcObject = localStream.value; });
watchEffect(() => { if (remoteEl.value) remoteEl.value.srcObject = remoteStream.value; });
</script>

<template>
  <div
    v-if="isVideo && state !== 'idle' && state !== 'ringing'"
    class="relative h-[40vh] shrink-0 overflow-hidden bg-slate-900"
  >
    <!-- remote: muted, karon audio alada Audio element-e chole -->
    <video ref="remoteEl" autoplay playsinline muted class="h-full w-full object-contain" />
    <p
      v-if="state !== 'connected'"
      class="absolute inset-0 flex items-center justify-center text-sm text-slate-300"
    >
      Connecting...
    </p>

    <!-- nijer preview: muted + mirror -->
    <video
      ref="localEl"
      autoplay
      playsinline
      muted
      class="absolute bottom-3 right-3 h-28 w-20 -scale-x-100 rounded-lg border border-white/20 bg-slate-800 object-cover shadow-lg sm:h-32 sm:w-44"
      :class="camOff && 'opacity-30'"
    />
  </div>
</template>