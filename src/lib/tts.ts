import type { TtsVoiceOption } from "../types/content";

let currentAudio: HTMLAudioElement | null = null;

const API_BASE = import.meta.env.VITE_TTS_API_BASE;

function getDefaultVoiceIdByLanguage(language: string): string | null {
  const normalized = language.toLowerCase();

  if (normalized.startsWith("en")) return "Joanna";
  if (normalized.startsWith("fr")) return "Celine";
  if (normalized.startsWith("cmn") || normalized.startsWith("zh")) return "Zhiyu";
  if (normalized.startsWith("ko")) return "Seoyeon";

  return "Joanna";
}

export function stopSpeech() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

export async function getVoiceOptions(language?: string): Promise<TtsVoiceOption[]> {
  const url = language
    ? `${API_BASE}/api/tts/voices?language=${encodeURIComponent(language)}`
    : `${API_BASE}/api/tts/voices`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch voice options.");
  }

  const data = await res.json();

  if (language) {
    return (data.voices ?? []).map((voice: any) => ({
      name: voice.label,
      lang: voice.language,
      voiceURI: voice.id,
      default: false,
    }));
  }

  const allVoices = Object.values(data.voicesByLanguage ?? {}).flat() as any[];

  return allVoices.map((voice) => ({
    name: voice.label,
    lang: voice.language,
    voiceURI: voice.id,
    default: false,
  }));
}

export async function waitForVoices(language?: string): Promise<TtsVoiceOption[]> {
  return getVoiceOptions(language);
}

export function getDefaultEnglishVoiceURI(): string | null {
  return "Joanna";
}

export function getDefaultKoreanVoiceURI(): string | null {
  return "Seoyeon";
}

export function findVoiceByURI(voiceURI: string | null): { voiceURI: string } | null {
  if (!voiceURI) return null;
  return { voiceURI };
}

export async function speakText(
  text: string,
  enabled: boolean,
  rate = 1,
  voiceURI: string | null = null,
  language = "en-US"
): Promise<void> {
  if (!enabled || !text.trim()) return;

  stopSpeech();

  const voiceId = voiceURI || getDefaultVoiceIdByLanguage(language);

  const res = await fetch(`${API_BASE}/api/tts/speak`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      language,
      voiceId,
      engine: "standard",
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`TTS request failed: ${errorText}`);
  }

  const data = await res.json();

  return new Promise((resolve, reject) => {
    const audio = new Audio(data.audioUrl);
    currentAudio = audio;

    audio.playbackRate = rate;

    audio.onended = () => {
      if (currentAudio === audio) {
        currentAudio = null;
      }
      resolve();
    };

    audio.onerror = () => {
      if (currentAudio === audio) {
        currentAudio = null;
      }
      reject(new Error("Audio playback failed."));
    };

    audio.play().catch((error) => {
      if (currentAudio === audio) {
        currentAudio = null;
      }
      reject(error);
    });
  });
}