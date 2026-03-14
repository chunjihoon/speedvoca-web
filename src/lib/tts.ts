let currentUtterance: SpeechSynthesisUtterance | null = null;

export function stopSpeech() {
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

export function speakText(text: string, enabled: boolean, rate = 1): Promise<void> {
  return new Promise((resolve) => {
    if (!enabled || !text.trim()) {
      resolve();
      return;
    }

    stopSpeech();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      if (currentUtterance === utterance) currentUtterance = null;
      resolve();
    };

    utterance.onerror = () => {
      if (currentUtterance === utterance) currentUtterance = null;
      resolve();
    };

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  });
}
