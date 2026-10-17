const message = new Audio("/sounds/message-tone.wav");
const ring = new Audio("/sounds/ring-tone.wav");

ring.loop = true;
message.preload = "auto";

function play(a: HTMLAudioElement) {
  a.currentTime = 0;
  a.play().catch((e) => console.warn("Failed to play sound", e));
}

export function useSounds() {
  return {
    playMessage: () => play(message),
    startRing: () => play(ring),
    stopRing: () => {
      ring.pause();
      ring.currentTime = 0;
    },
  };
}
