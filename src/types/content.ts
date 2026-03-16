export type SentenceRow = {
    sentence: string;
    translation: string;
    sourceSheetName?: string;
  };
  
  export type SheetContent = {
    name: string;
    rows: SentenceRow[];
    difficulty?: string;
  };
  
  export type TtsVoiceOption = {
    name: string;
    lang: string;
    voiceURI: string;
    default: boolean;
  };
  