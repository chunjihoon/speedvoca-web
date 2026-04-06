export type ChapterLanguage = "en-US" | "fr-FR" | "cmn-CN" | "ko-KR";

export type LanguageCode = "en" | "zh" | "fr" | "ja" | "ko";

export type SentenceRow = {
  sentence: string;
  translation: string;
  sourceSheetName?: string;
};

export type SheetRow = SentenceRow;

export type SheetContent = {
  name: string;
  language: ChapterLanguage;
  rows: SentenceRow[];
};

export type RemoteSheetContent = {
  id: string;
  title: string;
  language: ChapterLanguage;
  rows: SheetRow[];
};

export type MultilingualRow = {
  id: string;
  texts: Record<LanguageCode, string>;
};

export type MultilingualRemoteSheetContent = {
  id: string;
  title: string;
  rows: MultilingualRow[];
};

export type RecommendedStudySession = {
  id: string;
  title: string;
  sourceSheetId: string;
  rows: MultilingualRow[];
  targetLanguage: Exclude<LanguageCode, "ja">;
  translationLanguage: LanguageCode;
};

export type TtsVoiceOption = {
  voiceURI: string;
  name: string;
  lang: ChapterLanguage;
};

export type RecommendedContentAccess = "guest" | "login";