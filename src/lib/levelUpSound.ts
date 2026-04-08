let audio: HTMLAudioElement | null = null;

export function playLevelUpSound() {
  try {
    if (!audio) {
      audio = new Audio("/public/sounds/level-up.wav");
      audio.preload = "auto";
    }

    audio.currentTime = 0;
    void audio.play();
  } catch (error) {
    console.error("Failed to play level-up sound:", error);
  }
}