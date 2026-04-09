import { stopSpeech } from "./tts";
import { beginLevelUpPriority } from "./audioPriority";

let audio: HTMLAudioElement | null = null;

export function playLevelUpSound() {
  try {
    if (!audio) {
      audio = new Audio("/sounds/level-up.wav");
      audio.preload = "auto";
    }

    stopSpeech();
    const endPriority = beginLevelUpPriority();

    audio.onended = () => {
      endPriority();
    };
    audio.onerror = () => {
      endPriority();
    };

    audio.currentTime = 0;
    void audio.play().catch(() => {
      endPriority();
    });
  } catch (error) {
    console.error("Failed to play level-up sound:", error);
  }
}
