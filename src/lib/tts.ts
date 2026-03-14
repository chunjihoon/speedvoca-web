import type { TtsVoiceOption } from "../types/content";

let currentUtterance: SpeechSynthesisUtterance | null = null;

function getSynth() {
  return window.speechSynthesis;
}

export function stopSpeech() {
  getSynth().cancel();
  currentUtterance = null;
}

export function getVoiceOptions(): TtsVoiceOption[] {
  return getSynth()
    .getVoices()
    .map((voice) => ({
      name: voice.name,
      lang: voice.lang,
      voiceURI: voice.voiceURI,
      default: voice.default,
    }));
}

export function findVoiceByURI(voiceURI: string | null): SpeechSynthesisVoice | null {
  if (!voiceURI) return null;

  const voices = getSynth().getVoices();
  return voices.find((voice) => voice.voiceURI === voiceURI) ?? null;
}

export function waitForVoices(): Promise<TtsVoiceOption[]> {
  return new Promise((resolve) => {
    const synth = getSynth();
    const voicesNow = getVoiceOptions();

    if (voicesNow.length > 0) {
      resolve(voicesNow);
      return;
    }

    const handleVoicesChanged = () => {
      const loaded = getVoiceOptions();
      if (loaded.length > 0) {
        synth.removeEventListener("voiceschanged", handleVoicesChanged);
        resolve(loaded);
      }
    };

    synth.addEventListener("voiceschanged", handleVoicesChanged);

    // 안전장치: 일부 환경에서 이벤트가 안 와도 한번 더 체크
    setTimeout(() => {
      const loaded = getVoiceOptions();
      if (loaded.length > 0) {
        synth.removeEventListener("voiceschanged", handleVoicesChanged);
        resolve(loaded);
      }
    }, 500);
  });
}

export function getDefaultEnglishVoiceURI(): string | null {
  const voices = getSynth().getVoices();

  const englishDefault =
    voices.find((voice) => voice.default && voice.lang.toLowerCase().startsWith("en")) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ??
    voices[0];

  return englishDefault?.voiceURI ?? null;
}

export function speakText(
  text: string,
  enabled: boolean,
  rate = 1,
  voiceURI: string | null = null
): Promise<void> {
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

    const voice = findVoiceByURI(voiceURI);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.onend = () => {
      if (currentUtterance === utterance) currentUtterance = null;
      resolve();
    };

    utterance.onerror = () => {
      if (currentUtterance === utterance) currentUtterance = null;
      resolve();
    };

    currentUtterance = utterance;
    getSynth().speak(utterance);
  });
}
