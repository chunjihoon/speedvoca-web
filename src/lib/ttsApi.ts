export type VoiceItem = {
    id: string;
    label: string;
    language: string;
    gender: "male" | "female";
    engine: "standard";
  };
  
  const API_BASE = import.meta.env.VITE_TTS_API_BASE;
  
  export async function fetchVoices(language?: string) {
    const url = language
      ? `${API_BASE}/api/tts/voices?language=${encodeURIComponent(language)}`
      : `${API_BASE}/api/tts/voices`;
  
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Failed to fetch voices");
    }
    return res.json();
  }
  
  export async function fetchSpeechAudioUrl(params: {
    text: string;
    language: string;
    voiceId: string;
    engine?: "standard";
  }) {
    const res = await fetch(`${API_BASE}/api/tts/speak`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...params,
        engine: params.engine ?? "standard",
      }),
    });
  
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`TTS request failed: ${text}`);
    }
  
    return res.json();
  }