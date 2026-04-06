export type SentenceRow = {
    sentence: string;
    translation: string;
    sourceSheetName?: string;
  };
  
  export type SheetContent = {
    name: string;
    language: ChapterLanguage;
    rows: {
      sentence: string;
      translation: string;
      sourceSheetName?: string;
    }[];
    difficulty?: string;
  };
  
  export type TtsVoiceOption = {
    name: string;
    lang: string;
    voiceURI: string;
    default: boolean;
  };
  
  export type ChapterLanguage = "en-US" | "fr-FR" | "cmn-CN";

  export type SheetRow = {
    sentence: string;
    translation: string;
  };
  
  export type RemoteSheetContent = {
    id: string;
    title: string;
    language: string;
    rows: SheetRow[];
  };