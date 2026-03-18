const SOUND_ENABLED_KEY = "speedvoca_sound_enabled";
const REPEAT_COUNT_KEY = "speedvoca_repeat_count";
const VOICE_URI_KEY = "speedvoca_voice_uri";


export function getSoundEnabled(): boolean {
  const raw = localStorage.getItem(SOUND_ENABLED_KEY);
  if (raw == null) return true;
  return raw === "true";
}

export function setSoundEnabled(value: boolean) {
  localStorage.setItem(SOUND_ENABLED_KEY, String(value));
}

export function getRepeatCount(): number {
  const raw = localStorage.getItem(REPEAT_COUNT_KEY);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return 3;
  return parsed;
}

export function setRepeatCount(value: number) {
  localStorage.setItem(REPEAT_COUNT_KEY, String(value));
}


// export function getVoiceURI(): string | null {
//   return localStorage.getItem(VOICE_URI_KEY);
// }

// export function setVoiceURI(value: string) {
//   localStorage.setItem(VOICE_URI_KEY, value);
// }

const VOICE_MAP_KEY = "speedvoca_voice_map";

type VoiceMap = Record<string, string | null>;

const DEFAULT_VOICE_MAP: VoiceMap = {
  "en-US": "Joanna",
  "fr-FR": "Celine",
  "cmn-CN": "Zhiyu",
};

export function getVoiceMap(): VoiceMap {
  const raw = localStorage.getItem(VOICE_MAP_KEY);
  if (!raw) return DEFAULT_VOICE_MAP;

  try {
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_VOICE_MAP,
      ...parsed,
    };
  } catch {
    return DEFAULT_VOICE_MAP;
  }
}

export function setVoiceMap(value: VoiceMap) {
  localStorage.setItem(VOICE_MAP_KEY, JSON.stringify(value));
}