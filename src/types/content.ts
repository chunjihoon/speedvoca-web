export type SentenceRow = {
    sentence: string;
    translation: string;
};
  
export type SheetContent = {
    name: string;
    rows: SentenceRow[];
};

export type TtsVoiceOption = {
    name: string;
    lang: string;
    voiceURI: string;
    default: boolean;
};
  
  