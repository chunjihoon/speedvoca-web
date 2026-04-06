import type { LanguageCode, RecommendedContentAccess } from "../types/content";
export type TargetLanguageCode = Exclude<LanguageCode, "ja">;

export type RecommendedContentMeta = {
    id: string;
    title: string;
    spreadsheetId: string;
    range: string;
    sourceSheetId: string;
    defaultTargetLanguage: TargetLanguageCode;
    imageSrc: string;
    sentenceCount: number;
    access: RecommendedContentAccess;
    category: "daily" | "work" | "travel";
  };

const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;

export const recommendedContentMetas: RecommendedContentMeta[] = [
    // Daily - common sheet: cm-daily
    {
      id: "daily-en",
      title: "English Daily Conversation",
      spreadsheetId: SPREADSHEET_ID,
      range: "cm-daily!A:F",
      sourceSheetId: "cm-daily",
      defaultTargetLanguage: "en",
      imageSrc: "/src/assets/recommendData/en-daily.png",
      sentenceCount: 30,
      access: "guest",
      category: "daily",
    },
    {
      id: "daily-zh",
      title: "Chinese Daily Conversation",
      spreadsheetId: SPREADSHEET_ID,
      range: "cm-daily!A:F",
      sourceSheetId: "cm-daily",
      defaultTargetLanguage: "zh",
      imageSrc: "/src/assets/recommendData/zh-daily.png",
      sentenceCount: 30,
      access: "login",
      category: "daily",
    },
    {
      id: "daily-fr",
      title: "French Daily Conversation",
      spreadsheetId: SPREADSHEET_ID,
      range: "cm-daily!A:F",
      sourceSheetId: "cm-daily",
      defaultTargetLanguage: "fr",
      imageSrc: "/src/assets/recommendData/fr-daily.png",
      sentenceCount: 30,
      access: "login",
      category: "daily",
    },
    {
      id: "daily-ko",
      title: "Korean Daily Conversation",
      spreadsheetId: SPREADSHEET_ID,
      range: "cm-daily!A:F",
      sourceSheetId: "cm-daily",
      defaultTargetLanguage: "ko",
      imageSrc: "/src/assets/recommendData/kr-daily.png",
      sentenceCount: 30,
      access: "login",
      category: "daily",
    },
  
    // Travel - separate sheets
    {
      id: "travel-en",
      title: "English Travel Expressions",
      spreadsheetId: SPREADSHEET_ID,
      range: "en-travel!A:F",
      sourceSheetId: "en-travel",
      defaultTargetLanguage: "en",
      imageSrc: "/src/assets/recommendData/en-travel.png",
      sentenceCount: 30,
      access: "login",
      category: "travel",
    },
    {
      id: "travel-zh",
      title: "Chinese Travel Expressions",
      spreadsheetId: SPREADSHEET_ID,
      range: "zh-travel!A:F",
      sourceSheetId: "zh-travel",
      defaultTargetLanguage: "zh",
      imageSrc: "/src/assets/recommendData/zh-travel.png",
      sentenceCount: 30,
      access: "login",
      category: "travel",
    },
    {
      id: "travel-fr",
      title: "French Travel Expressions",
      spreadsheetId: SPREADSHEET_ID,
      range: "fr-travel!A:F",
      sourceSheetId: "fr-travel",
      defaultTargetLanguage: "fr",
      imageSrc: "/src/assets/recommendData/fr-travel.png",
      sentenceCount: 30,
      access: "login",
      category: "travel",
    },
    {
      id: "travel-ko",
      title: "Korean Travel Expressions",
      spreadsheetId: SPREADSHEET_ID,
      range: "kr-travel!A:F",
      sourceSheetId: "kr-travel",
      defaultTargetLanguage: "ko",
      imageSrc: "/src/assets/recommendData/kr-travel.png",
      sentenceCount: 30,
      access: "login",
      category: "travel",
    },

    // Work - common sheet: cm-work
    {
        id: "work-en",
        title: "English Work Expressions",
        spreadsheetId: SPREADSHEET_ID,
        range: "cm-work!A:F",
        sourceSheetId: "cm-work",
        defaultTargetLanguage: "en",
        imageSrc: "/src/assets/recommendData/en-work.png",
        sentenceCount: 30,
        access: "login",
        category: "work",
      },
      {
        id: "work-zh",
        title: "Chinese Work Expressions",
        spreadsheetId: SPREADSHEET_ID,
        range: "cm-work!A:F",
        sourceSheetId: "cm-work",
        defaultTargetLanguage: "zh",
        imageSrc: "/src/assets/recommendData/zh-work.png",
        sentenceCount: 30,
        access: "login",
        category: "work",
      },
      {
        id: "work-fr",
        title: "French Work Expressions",
        spreadsheetId: SPREADSHEET_ID,
        range: "cm-work!A:F",
        sourceSheetId: "cm-work",
        defaultTargetLanguage: "fr",
        imageSrc: "/src/assets/recommendData/fr-work.png",
        sentenceCount: 30,
        access: "login",
        category: "work",
      },
      {
        id: "work-ko",
        title: "Korean Work Expressions",
        spreadsheetId: SPREADSHEET_ID,
        range: "cm-work!A:F",
        sourceSheetId: "cm-work",
        defaultTargetLanguage: "ko",
        imageSrc: "/src/assets/recommendData/kr-work.png",
        sentenceCount: 30,
        access: "login",
        category: "work",
      },
  ];