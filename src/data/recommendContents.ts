import type { LanguageCode, RecommendedContentAccess } from "../types/content";

import enDailyImg from "../assets/recommendData/en-daily.png";
import zhDailyImg from "../assets/recommendData/zh-daily.png";
import frDailyImg from "../assets/recommendData/fr-daily.png";
import krDailyImg from "../assets/recommendData/kr-daily.png";

import enTravelImg from "../assets/recommendData/en-travel.png";
import zhTravelImg from "../assets/recommendData/zh-travel.png";
import frTravelImg from "../assets/recommendData/fr-travel.png";
import krTravelImg from "../assets/recommendData/kr-travel.png";

import enWorkImg from "../assets/recommendData/en-work.png";
import zhWorkImg from "../assets/recommendData/zh-work.png";
import frWorkImg from "../assets/recommendData/fr-work.png";
import krWorkImg from "../assets/recommendData/kr-work.png";


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
      imageSrc: enDailyImg,
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
      imageSrc: zhDailyImg,
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
      imageSrc: frDailyImg,
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
      imageSrc: krDailyImg,
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
      imageSrc: enTravelImg,
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
      imageSrc: zhTravelImg,
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
      imageSrc: frTravelImg,
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
      imageSrc: krTravelImg,
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
        imageSrc: enWorkImg,
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
        imageSrc: zhWorkImg,
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
        imageSrc: frWorkImg,
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
        imageSrc: krWorkImg,
        sentenceCount: 30,
        access: "login",
        category: "work",
      },
  ];