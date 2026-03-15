import type { TtsVoiceOption } from "../types/content";

let currentUtterance: SpeechSynthesisUtterance | null = null;

function getSynth() {
  return window.speechSynthesis;
}

export function stopSpeech() {
  const synth = getSynth();
  synth.cancel();
  currentUtterance = null;
}

export function getVoiceOptions(): TtsVoiceOption[] {
  return getSynth()
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith("en"))
    .map((voice) => ({
      name: voice.name,
      lang: voice.lang,
      voiceURI: voice.voiceURI,
      default: voice.default,
    }));
}

export function findVoiceByURI(voiceURI: string | null): SpeechSynthesisVoice | null {
  if (!voiceURI) return null;
  return getSynth().getVoices().find((voice) => voice.voiceURI === voiceURI) ?? null;
}

export function waitForVoices(): Promise<TtsVoiceOption[]> {
  return new Promise((resolve) => {
    const synth = getSynth();

    const resolveVoices = () => {
      const voices = getVoiceOptions();
      if (voices.length > 0) {
        resolve(voices);
        return true;
      }
      return false;
    };

    if (resolveVoices()) return;

    const handleVoicesChanged = () => {
      if (resolveVoices()) {
        synth.removeEventListener("voiceschanged", handleVoicesChanged);
      }
    };

    synth.addEventListener("voiceschanged", handleVoicesChanged);

    setTimeout(() => {
      if (resolveVoices()) {
        synth.removeEventListener("voiceschanged", handleVoicesChanged);
      }
    }, 1000);
  });
}

export function getDefaultEnglishVoiceURI(): string | null {
  const voices = getSynth().getVoices();

  const preferred =
    voices.find((v) => v.lang.startsWith("en-US") && /Alex|Daniel|David|Google/.test(v.name)) ??
    voices.find((v) => v.lang.startsWith("en-US")) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    voices[0];

  return preferred?.voiceURI ?? null;
}

export async function speakText(
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

    const synth = getSynth();

    try {
      synth.cancel();
      synth.resume(); // Chrome 꼬임 방지
    } catch {
      // ignore
    }

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

    utterance.onerror = (event) => {
      console.error("TTS error:", event);
      if (currentUtterance === utterance) currentUtterance = null;
      resolve();
    };

    currentUtterance = utterance;

    // 약간 늦춰서 speak
    setTimeout(() => {
      try {
        synth.speak(utterance);
      } catch (e) {
        console.error("speak failed:", e);
        resolve();
      }
    }, 30);
  });
}
