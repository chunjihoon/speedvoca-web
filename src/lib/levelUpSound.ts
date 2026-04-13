import { stopSpeech } from "./tts";
import { beginLevelUpPriority } from "./audioPriority";

let audio: HTMLAudioElement | null = null;
const LEVEL_UP_SOUND_VOLUME = 0.25;

export function playLevelUpSound() {
  try {
    if (!audio) {
      audio = new Audio("/sounds/level-up.wav");
      audio.preload = "auto";
      audio.volume = LEVEL_UP_SOUND_VOLUME;
    }
    audio.volume = LEVEL_UP_SOUND_VOLUME;

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
