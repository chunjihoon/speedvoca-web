import { useEffect, useMemo, useState, useRef } from "react";
import type {
  ChapterLanguage,
  SheetContent,
  TtsVoiceOption,
  LanguageCode,
  MultilingualRemoteSheetContent,
  RecommendedStudySession,
} from "./types/content";import { parseWorkbookFile } from "./lib/workbook";
//import TopBar from "./components/TopBar";
import SheetList from "./components/SheetList";
import ReaderView from "./components/ReaderView";
import {
  getRepeatCount,
  getSoundEnabled,
  getVoiceMap,
  setRepeatCount,
  setSoundEnabled,
  setVoiceMap,
} from "./lib/storage";
import type { VoiceMap } from "./lib/storage";
import {
  getDefaultEnglishVoiceURI,
  stopSpeech,
  waitForVoices,
} from "./lib/tts";
import { useAuth } from "./hooks/useAuth";
import { loginWithGoogle, logout } from "./lib/auth";
import {
  applyUserStatsDelta,
  loadFavorites,
  loadImportedChapters,
  loadUserChapterMeta,
  //loadUserStats,
  loadUserStatsWithFallback,
  //saveChapterTitle,
  saveImportedChapter,
  deleteImportedChapter,

} from "./lib/firestore";
import StatsBar from "./components/StatsBar";
import SettingsPanel from "./components/SettingsPanel";
import SectionBlock from "./components/SectionBlock";
import LoginPromptModal from "./components/LoginPromptModal";
import LevelUpEffect from "./components/LevelUpEffect";
import { calculateTotalXp, getLevelSummary } from "./lib/level";
import { playLevelUpSound } from "./lib/levelUpSound";

import { recommendedContentMetas, type RecommendedContentMeta } from "./data/recommendContents";
import { fetchRecommendedSheet } from "./lib/googleSheets";
import { auth } from "./lib/firebase";
import { identifyUser, setAnalyticsProps, trackEvent } from "./lib/analytics";
import myLearningIcon from "./assets/mylearning.png";
import recommendIcon from "./assets/recommend.png";
import importIcon from "./assets/import.png";
import settingIcon from "./assets/setting.png";
import {
  APP_LANGUAGE_STORAGE_KEY,
  FAVORITES_SHEET_NAME,
  UI_TEXT,
  type AppLanguage,
} from "./constants/i18n";

type TargetLanguageCode = Exclude<LanguageCode, "ja">;

type VisibleChapterStat = {
  completedSentenceCount?: number;
  nextCount?: number;
  replayCount?: number;
  favoriteCount?: number;
};

type TotalStats = {
  totalCompletedSentenceCount: number;
  totalNextCount: number;
  totalReplayCount: number;
};

const EMPTY_TOTAL_STATS: TotalStats = {
  totalCompletedSentenceCount: 0,
  totalNextCount: 0,
  totalReplayCount: 0,
};

const GUEST_PENDING_STATS_KEY = "speedvoca_guest_pending_stats";

function sanitizeStats(value: Partial<TotalStats> | null | undefined): TotalStats {
  return {
    totalCompletedSentenceCount: Math.max(0, value?.totalCompletedSentenceCount ?? 0),
    totalNextCount: Math.max(0, value?.totalNextCount ?? 0),
    totalReplayCount: Math.max(0, value?.totalReplayCount ?? 0),
  };
}

function loadGuestPendingStats(): TotalStats {
  try {
    const raw = localStorage.getItem(GUEST_PENDING_STATS_KEY);
    if (!raw) return EMPTY_TOTAL_STATS;
    const parsed = JSON.parse(raw) as Partial<TotalStats>;
    return sanitizeStats(parsed);
  } catch {
    return EMPTY_TOTAL_STATS;
  }
}

function saveGuestPendingStats(stats: TotalStats) {
  const next = sanitizeStats(stats);
  const hasValue =
    next.totalCompletedSentenceCount > 0 ||
    next.totalNextCount > 0 ||
    next.totalReplayCount > 0;

  if (!hasValue) {
    localStorage.removeItem(GUEST_PENDING_STATS_KEY);
    return;
  }

  localStorage.setItem(GUEST_PENDING_STATS_KEY, JSON.stringify(next));
}

function hasAnyStats(stats: TotalStats): boolean {
  return (
    stats.totalCompletedSentenceCount > 0 ||
    stats.totalNextCount > 0 ||
    stats.totalReplayCount > 0
  );
}

function toChapterLanguage(lang: TargetLanguageCode): ChapterLanguage {
  switch (lang) {
    case "en":
      return "en-US";
    case "zh":
      return "cmn-CN";
    case "fr":
      return "fr-FR";
    case "ko":
      return "ko-KR";
  }
}

function getFallbackTranslationLanguage(target: TargetLanguageCode): LanguageCode {
  return target === "ko" ? "en" : "ko";
}



export default function App() {
  const { user, authLoading } = useAuth();
  const [appLanguage, setAppLanguage] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
    return saved === "en" ? "en" : "ko";
  });
  const ui = UI_TEXT[appLanguage];
  const getCommonAnalyticsParams = () => ({
    is_logged_in: !!user,
    app_language: appLanguage,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [soundEnabled, setSoundEnabledState] = useState(getSoundEnabled());
  const [repeatCount, setRepeatCountState] = useState(getRepeatCount());
  const [voices, setVoices] = useState<TtsVoiceOption[]>([]);
  const [selectedVoiceMap, setSelectedVoiceMap] = useState<VoiceMap>(getVoiceMap());  
  const [manualLanguage, setManualLanguage] = useState<ChapterLanguage>("en-US");
  const [titleMap, setTitleMap] = useState<Record<string, string>>({});
  const [statsMap, setStatsMap] = useState<Record<string, VisibleChapterStat>>({});
  const [totalStats, setTotalStats] = useState({
    totalCompletedSentenceCount: 0,
    totalNextCount: 0,
    totalReplayCount: 0,
  });
  const [guestPendingStats, setGuestPendingStats] = useState<TotalStats>(() =>
    loadGuestPendingStats()
  );
  const [favoriteRows, setFavoriteRows] = useState<{ sentence: string; translation: string; sourceSheetName: string }[]>([]);
  const [importedSheets, setImportedSheets] = useState<SheetContent[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [settingsMap, setSettingsMap] = useState<Record<string, { randomEnabled?: boolean; fontScale?: number }>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  //const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [loginPromptTitle, setLoginPromptTitle] = useState(ui.loginPrompt.requiredTitle);
  const [loginPromptDescription, setLoginPromptDescription] = useState(
    ui.loginPrompt.requiredDescription
  );

  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [manualImportLoading, setManualImportLoading] = useState(false);

  const [loadedStatsUid, setLoadedStatsUid] = useState<string | null>(null);
  const [userDataLoading, setUserDataLoading] = useState(false);

  const DEVELOPER_EMAILS = String(
    import.meta.env.VITE_DEVELOPER_EMAILS ?? import.meta.env.VITE_DEVELOPER_EMAIL ?? ""
  )
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const isDeveloperAccount =
    !!user?.email && DEVELOPER_EMAILS.includes(user.email.trim().toLowerCase());

  const [developerModeEnabled, setDeveloperModeEnabled] = useState(() => {
    return localStorage.getItem("speedvoca_developer_mode") === "true";
  });

  /** 기본제공학습자료 */
  const [selectedSheet, setSelectedSheet] = useState<SheetContent | null>(null);
  const [selectedRecommendedSession, setSelectedRecommendedSession] =
    useState<RecommendedStudySession | null>(null);
  
  const [recommendedLoadError, setRecommendedLoadError] = useState<string | null>(null);
  const [recommendedRemoteMap, setRecommendedRemoteMap] = useState<
    Record<string, MultilingualRemoteSheetContent>
  >({});
  const [loadingRecommendedId, setLoadingRecommendedId] = useState<string | null>(null);

  

  useEffect(() => {
    localStorage.setItem("speedvoca_developer_mode", String(developerModeEnabled));
  }, [developerModeEnabled]);

  useEffect(() => {
    localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, appLanguage);
  }, [appLanguage]);

  useEffect(() => {
    if (!settingsOpen) return;

    const { body, documentElement } = document;
    const scrollY = window.scrollY;

    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyLeft = body.style.left;
    const prevBodyRight = body.style.right;
    const prevBodyWidth = body.style.width;
    const prevBodyOverflow = body.style.overflow;

    body.classList.add("settings-open");
    documentElement.classList.add("settings-open");

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";

    const preventBackgroundTouchMove = (event: TouchEvent) => {
      const target = event.target as Element | null;
      if (target?.closest(".settings-panel")) return;
      event.preventDefault();
    };

    document.addEventListener("touchmove", preventBackgroundTouchMove, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventBackgroundTouchMove);
      body.classList.remove("settings-open");
      documentElement.classList.remove("settings-open");

      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.left = prevBodyLeft;
      body.style.right = prevBodyRight;
      body.style.width = prevBodyWidth;
      body.style.overflow = prevBodyOverflow;

      window.scrollTo(0, scrollY);
    };
  }, [settingsOpen]);

  useEffect(() => {
    if (loginPromptOpen) return;
    setLoginPromptTitle(ui.loginPrompt.requiredTitle);
    setLoginPromptDescription(ui.loginPrompt.requiredDescription);
  }, [appLanguage, loginPromptOpen, ui.loginPrompt.requiredTitle, ui.loginPrompt.requiredDescription]);

  const handleTestLevelUpEffect = () => {
    setShowLevelUpEffect(true);
    playLevelUpSound();
  
    window.setTimeout(() => {
      setShowLevelUpEffect(false);
    }, 2200);
  };

  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const activeReaderOpen = !!selectedSheet || !!selectedRecommendedSession;

  const selectedSheetRef = useRef<boolean>(false);
  useEffect(() => {
    selectedSheetRef.current = activeReaderOpen;
  }, [activeReaderOpen]);
  
  const showGlobalLoading =
    !activeReaderOpen && (loading || authLoading || userDataLoading);

  useEffect(() => {
    identifyUser(user?.uid ?? null);
    setAnalyticsProps({
      user_type: user ? "member" : "guest",
      preferred_app_language: appLanguage,
    });
  }, [user?.uid, !!user, appLanguage]);

  const trackedReaderSessionKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (showGlobalLoading || error) return;

    if (!activeReaderOpen) {
      trackEvent("home_view", getCommonAnalyticsParams());
      trackedReaderSessionKeyRef.current = null;
      return;
    }

    const sessionKey = selectedRecommendedSession?.id ?? selectedSheet?.name ?? null;
    if (!sessionKey || trackedReaderSessionKeyRef.current === sessionKey) return;

    trackedReaderSessionKeyRef.current = sessionKey;
    trackEvent("reader_enter", {
      ...getCommonAnalyticsParams(),
      sheet_type: selectedRecommendedSession ? "recommended" : "my",
      sheet_name: selectedRecommendedSession?.title ?? selectedSheet?.name ?? sessionKey,
    });
  }, [
    showGlobalLoading,
    error,
    activeReaderOpen,
    selectedRecommendedSession,
    selectedSheet?.name,
  ]);
  
  useEffect(() => {
    if (!activeReaderOpen) return;
  
    window.history.pushState({ speedvocaReader: true }, "", window.location.href);
  }, [activeReaderOpen]);

  useEffect(() => {
    const handlePopState = () => {
      if (!selectedSheetRef.current) return;
  
      trackEvent("reader_exit_confirm_open", {
        ...getCommonAnalyticsParams(),
        trigger: "browser_back",
      });
      setExitConfirmOpen(true);
  
      // 실제 이탈 막고 현재 상태 복구
      window.history.pushState({ speedvocaReader: true }, "", window.location.href);
    };
  
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  
  useEffect(() => {
    async function init() {
      try {
        const loadedVoices = await waitForVoices();
        setVoices(loadedVoices);
  
        const savedVoiceMap = getVoiceMap();
  
        const validVoiceMap: VoiceMap = {
          "en-US": loadedVoices.some((v) => v.voiceURI === savedVoiceMap["en-US"])
            ? savedVoiceMap["en-US"]
            : getDefaultEnglishVoiceURI(),
          "fr-FR": loadedVoices.some((v) => v.voiceURI === savedVoiceMap["fr-FR"])
            ? savedVoiceMap["fr-FR"]
            : "Celine",
          "cmn-CN": loadedVoices.some((v) => v.voiceURI === savedVoiceMap["cmn-CN"])
            ? savedVoiceMap["cmn-CN"]
            : "Zhiyu",
          "ko-KR": loadedVoices.some((v) => v.voiceURI === savedVoiceMap["ko-KR"])
            ? savedVoiceMap["ko-KR"]
            : "Seoyeon",
        };
  
        setSelectedVoiceMap(validVoiceMap);
        setVoiceMap(validVoiceMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : ui.app.unknownError);
      } finally {
        setLoading(false);
      }
    }
  
    init();
  }, []);

  const showLoginPrompt = (
    title = ui.loginPrompt.requiredTitle,
    description = ui.loginPrompt.requiredDescription
  ) => {
    trackEvent("login_prompt_open", {
      ...getCommonAnalyticsParams(),
      prompt_title: title,
    });
    setLoginPromptTitle(title);
    setLoginPromptDescription(description);
    setLoginPromptOpen(true);
  };

  useEffect(() => {
    saveGuestPendingStats(guestPendingStats);
  }, [guestPendingStats]);

  const reloadRequestIdRef = useRef(0);
  const reloadUserData = async (targetUser: typeof user) => {
    const requestId = ++reloadRequestIdRef.current;
    const targetUid = targetUser?.uid ?? null;

    if (!targetUser) {
      if (auth.currentUser) {
        return;
      }

      setTitleMap({});
      setStatsMap({});
      setFavoriteRows([]);
      setImportedSheets([]);
      setSettingsMap({});
      setTotalStats(EMPTY_TOTAL_STATS);
      setLoadedStatsUid(null);
      if (requestId === reloadRequestIdRef.current) {
        setUserDataLoading(false);
      }
      return;
    }

    try {
      setUserDataLoading(true);

      const [meta, stats, favorites, imported] = await Promise.all([
        loadUserChapterMeta(targetUser.uid),
        loadUserStatsWithFallback(targetUser.uid),
        loadFavorites(targetUser.uid),
        loadImportedChapters(targetUser.uid),
      ]);

      const mappedTitles: Record<string, string> = {};
      const mappedStats: Record<string, VisibleChapterStat> = {};
      const mappedSettings: Record<string, { randomEnabled?: boolean; fontScale?: number }> = {};

      Object.entries(meta).forEach(([sheetName, value]) => {
        if (value.customTitle?.trim()) {
          mappedTitles[sheetName] = value.customTitle.trim();
        }

        mappedStats[sheetName] = {
          completedSentenceCount: value.completedSentenceCount ?? 0,
          nextCount: value.nextCount ?? 0,
          replayCount: value.replayCount ?? 0,
          favoriteCount: value.favoriteCount ?? 0,
        };

        mappedSettings[sheetName] = {
          randomEnabled: value.randomEnabled ?? false,
          fontScale: value.fontScale ?? 1,
        };
      });

      if (requestId !== reloadRequestIdRef.current) return;
      if (auth.currentUser?.uid !== targetUid) return;

      setTitleMap(mappedTitles);
      setStatsMap(mappedStats);
      setFavoriteRows(
        favorites.map((item) => ({
          sentence: item.sentence,
          translation: item.translation,
          sourceSheetName: item.sheetName,
        }))
      );
      setImportedSheets(
        imported.map((chapter) => ({
          name: chapter.title,
          language: chapter.language ?? "en-US",
          rows: chapter.rows,
        }))
      );
      setSettingsMap(mappedSettings);
      setTotalStats(stats);
      setLoadedStatsUid(targetUser.uid);
    } finally {
      if (requestId === reloadRequestIdRef.current) {
        setUserDataLoading(false);
      }
    }
  };

  useEffect(() => {
    if (authLoading) return;
    void reloadUserData(user);
  }, [user, authLoading]);

  const syncGuestStatsInFlightUidRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user) {
      syncGuestStatsInFlightUidRef.current = null;
      return;
    }

    if (syncGuestStatsInFlightUidRef.current === user.uid) return;
    syncGuestStatsInFlightUidRef.current = user.uid;

    const createdAt = user.metadata.creationTime ? Date.parse(user.metadata.creationTime) : NaN;
    const lastSignInAt = user.metadata.lastSignInTime ? Date.parse(user.metadata.lastSignInTime) : NaN;
    const isNewUser =
      Number.isFinite(createdAt) &&
      Number.isFinite(lastSignInAt) &&
      Math.abs(createdAt - lastSignInAt) < 5000;

    const pendingSnapshot = guestPendingStats;
    const shouldApplyGuestStats = isNewUser && hasAnyStats(pendingSnapshot);

    const run = async () => {
      try {
        if (shouldApplyGuestStats) {
          await applyUserStatsDelta(user.uid, pendingSnapshot);
          await reloadUserData(user);
        }
      } finally {
        // After any login, guest stats are fully discarded.
        setGuestPendingStats(EMPTY_TOTAL_STATS);
        localStorage.removeItem(GUEST_PENDING_STATS_KEY);
      }
    };

    void run();
  }, [user, guestPendingStats]);

  const handleGuestStatsDelta = (updates: Partial<TotalStats>) => {
    setGuestPendingStats((prev) => ({
      totalCompletedSentenceCount:
        prev.totalCompletedSentenceCount + (updates.totalCompletedSentenceCount ?? 0),
      totalNextCount: prev.totalNextCount + (updates.totalNextCount ?? 0),
      totalReplayCount: prev.totalReplayCount + (updates.totalReplayCount ?? 0),
    }));
  };

  const effectiveTotalStats: TotalStats = user
    ? totalStats
    : guestPendingStats;

  const visibleSheets = useMemo(() => {
    const base = user ? [...importedSheets] : [];
    const mapped = base.map((sheet) => {
      const originalName = sheet.name;
      return {
        ...sheet,
        name: titleMap[originalName] || originalName,
      };
    });
  
    if (user && favoriteRows.length > 0) {
      mapped.unshift({
        name: FAVORITES_SHEET_NAME,
        language: "en-US",
        rows: favoriteRows.map((row) => ({
          sentence: row.sentence,
          translation: row.translation,
          sourceSheetName: row.sourceSheetName,
        })),
      });
    }
  
    return mapped;
  }, [importedSheets, titleMap, user, favoriteRows]);
  

  const rawSheetMap = useMemo(() => {
    const result: Record<string, SheetContent> = {};
  
    [...importedSheets].forEach((sheet) => {
      result[sheet.name] = sheet;
      const customTitle = titleMap[sheet.name];
      if (customTitle) {
        result[customTitle] = sheet;
      }
    });
  
    if (favoriteRows.length > 0) {
      result[FAVORITES_SHEET_NAME] = {
        name: FAVORITES_SHEET_NAME,
        language: "en-US",
        rows: favoriteRows.map((row) => ({
          sentence: row.sentence,
          translation: row.translation,
          sourceSheetName: row.sourceSheetName,
        })),
      };
    }
  
    return result;
  }, [importedSheets, titleMap, favoriteRows]);
  

  const visibleStatsMap = useMemo(() => {
    const result: Record<string, VisibleChapterStat> = {};

    Object.entries(statsMap).forEach(([sheetName, value]) => {
      result[sheetName] = value;
      const customTitle = titleMap[sheetName];
      if (customTitle) {
        result[customTitle] = value;
      }
    });

    if (favoriteRows.length > 0) {
      result[FAVORITES_SHEET_NAME] = {
        completedSentenceCount: favoriteRows.length,
        nextCount: 0,
        replayCount: 0,
        favoriteCount: favoriteRows.length,
      };
    }

    return result;
  }, [statsMap, titleMap, favoriteRows]);

  const levelSummary = useMemo(() => {
    const totalXp = calculateTotalXp(
      effectiveTotalStats.totalNextCount,
      effectiveTotalStats.totalReplayCount
    );
  
    return getLevelSummary(totalXp);
  }, [effectiveTotalStats.totalNextCount, effectiveTotalStats.totalReplayCount]);

  const activeDisplaySheet = useMemo<SheetContent | null>(() => {
    if (selectedRecommendedSession) {
      return {
        name: selectedRecommendedSession.title,
        language: toChapterLanguage(selectedRecommendedSession.targetLanguage),
        rows: selectedRecommendedSession.rows
          .map((row) => ({
            sentence: row.texts[selectedRecommendedSession.targetLanguage]?.trim() ?? "",
            translation: row.texts[selectedRecommendedSession.translationLanguage]?.trim() ?? "",
          }))
          .filter((row) => row.sentence.length > 0),
      };
    }
  
    return selectedSheet;
  }, [selectedRecommendedSession, selectedSheet]);

  /** 레벨업 관련 */
  const [showLevelUpEffect, setShowLevelUpEffect] = useState(false);
  const levelEffectOwner = user ? `user:${user.uid}` : "guest";
  const levelEffectReady = !user || loadedStatsUid === user.uid;
  const levelEffectBaselineRef = useRef<{ owner: string; level: number } | null>(null);

  useEffect(() => {
    if (!levelEffectReady) return;

    const nextLevel = levelSummary.currentLevel;
    const baseline = levelEffectBaselineRef.current;

    // Reset baseline when viewer context changes (guest <-> user or different uid).
    if (!baseline || baseline.owner !== levelEffectOwner) {
      levelEffectBaselineRef.current = {
        owner: levelEffectOwner,
        level: nextLevel,
      };
      return;
    }

    if (nextLevel > baseline.level) {
      setShowLevelUpEffect(true);
      playLevelUpSound();

      window.setTimeout(() => {
        setShowLevelUpEffect(false);
      }, 2200);
    }

    levelEffectBaselineRef.current = {
      owner: levelEffectOwner,
      level: nextLevel,
    };
  }, [levelSummary.currentLevel, levelEffectOwner, levelEffectReady]);


  const handleSelectSheet = (sheet: SheetContent) => {
    const raw = rawSheetMap[sheet.name] ?? sheet;
    trackEvent("sheet_open_my", {
      ...getCommonAnalyticsParams(),
      sheet_name: raw.name,
      sheet_type: raw.name === FAVORITES_SHEET_NAME ? "favorites" : "my",
    });
  
    window.history.pushState({ speedvocaReader: true }, "");
  
    setSelectedRecommendedSession(null);
    setSelectedSheet({
      ...raw,
      rows: [...raw.rows],
    });
  };

  
  const handleChangeRecommendedTranslationLanguage = (nextTranslation: LanguageCode) => {
    setSelectedRecommendedSession((prev) => {
      if (!prev) return prev;
      if (prev.targetLanguage === nextTranslation) return prev;
  
      return {
        ...prev,
        translationLanguage: nextTranslation,
      };
    });
  };

  useEffect(() => {
    setSelectedRecommendedSession((prev) => {
      if (!prev) return prev;
      const localizedTitle = ui.recommendedTitles[prev.id] ?? prev.title;
      if (localizedTitle === prev.title) return prev;
      return { ...prev, title: localizedTitle };
    });
  }, [appLanguage, ui.recommendedTitles]);



  const handleToggleSound = () => {
    const next = !soundEnabled;
    trackEvent("settings_toggle_sound", {
      ...getCommonAnalyticsParams(),
      sound_enabled: next,
    });
    setSoundEnabledState(next);
    setSoundEnabled(next);
    if (!next) stopSpeech();
  };

  const handleChangeRepeatCount = (value: number) => {
    trackEvent("settings_change_repeat_count", {
      ...getCommonAnalyticsParams(),
      repeat_count: value,
    });
    setRepeatCountState(value);
    setRepeatCount(value);
  };

  const handleShareApp = async () => {
    trackEvent("share_click", getCommonAnalyticsParams());
    const title = "Loopeak";
    const text =
      appLanguage === "ko"
        ? "더 많은 친구들과 Loopeak으로 문장 학습을 시작해보세요!"
        : "Start sentence learning with more friends on Loopeak!";
    const url = window.location.origin;
    const sharePayload = { title, text, url };

    try {
      if (window.isSecureContext && navigator.share) {
        await navigator.share(sharePayload);
        trackEvent("share_native_success", getCommonAnalyticsParams());
        return;
      }
    } catch (error) {
      // User explicitly closed native share sheet; do not open fallback.
      if (error instanceof DOMException && error.name === "AbortError") {
        trackEvent("share_native_cancel", getCommonAnalyticsParams());
        return;
      }
    }

    trackEvent("share_fallback_open", getCommonAnalyticsParams());
    setShareSheetOpen(true);
  };

  const handleCopyShareLink = async () => {
    const url = window.location.origin;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const temp = document.createElement("textarea");
        temp.value = url;
        temp.style.position = "fixed";
        temp.style.opacity = "0";
        document.body.appendChild(temp);
        temp.focus();
        temp.select();
        document.execCommand("copy");
        document.body.removeChild(temp);
      }
      alert(ui.settings.shareCopied);
      trackEvent("share_copy_link", getCommonAnalyticsParams());
    } finally {
      setShareSheetOpen(false);
    }
  };

  const handleShareByMessage = () => {
    const url = window.location.origin;
    const text =
      appLanguage === "ko"
        ? `Loopeak 같이 써봐요! ${url}`
        : `Try Loopeak with me! ${url}`;
    trackEvent("share_channel_message", getCommonAnalyticsParams());
    window.location.href = `sms:?&body=${encodeURIComponent(text)}`;
    setShareSheetOpen(false);
  };

  const handleShareByMail = () => {
    const url = window.location.origin;
    const subject = appLanguage === "ko" ? "Loopeak 공유" : "Share Loopeak";
    const body =
      appLanguage === "ko"
        ? `Loopeak 링크를 공유합니다.\n${url}`
        : `Sharing Loopeak link:\n${url}`;
    trackEvent("share_channel_mail", getCommonAnalyticsParams());
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setShareSheetOpen(false);
  };

  const handleOpenSettings = () => {
    trackEvent("settings_open", getCommonAnalyticsParams());
    setSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    trackEvent("settings_close", getCommonAnalyticsParams());
    setSettingsOpen(false);
  };

  const handleChangeAppLanguage = (lang: AppLanguage) => {
    trackEvent("settings_change_app_language", {
      ...getCommonAnalyticsParams(),
      next_language: lang,
    });
    setAppLanguage(lang);
  };

  const handleRequestExitReader = () => {
    trackEvent("reader_exit_confirm_open", {
      ...getCommonAnalyticsParams(),
      trigger: "reader_back_button",
    });
    setExitConfirmOpen(true);
  };

  // const handleExitReader = () => {
  //   setExitConfirmOpen(true);
  // };
  
  const confirmExitReader = () => {
    trackEvent("reader_exit_confirmed", getCommonAnalyticsParams());
    setExitConfirmOpen(false);
    stopSpeech();
    setSelectedSheet(null);
    setSelectedRecommendedSession(null);
  };
  
  const cancelExitReader = () => {
    trackEvent("reader_exit_cancelled", getCommonAnalyticsParams());
    setExitConfirmOpen(false);
  };

  const handleChangeVoice = (voiceURI: string) => {
    if (!activeDisplaySheet) return;
  
    const next: VoiceMap = {
      ...selectedVoiceMap,
      [activeDisplaySheet.language]: voiceURI,
    };
  
    setSelectedVoiceMap(next);
    setVoiceMap(next);
    stopSpeech();
  };

  const requireLogin = async (
    title = ui.loginPrompt.requiredTitle,
    description = ui.loginPrompt.requiredDescription
  ) => {
    if (user) return true;
    showLoginPrompt(title, description);
    return false;
  };

  const handleImport = async () => {
    const okay = await requireLogin(
      ui.loginPrompt.importTitle,
      ui.loginPrompt.importDescription
    );
    if (!okay) return;
  
    fileInputRef.current?.click();
  };

  const parseManualRows = (raw: string) => {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const parts = line.split("|");
        if (parts.length < 2) {
          throw new Error(ui.alerts.parseFormatLineError(index + 1));
        }
  
        const sentence = parts[0].trim();
        const translation = parts.slice(1).join("|").trim();
  
        if (!sentence || !translation) {
          throw new Error(ui.alerts.parseMissingValueLineError(index + 1));
        }
  
        return { sentence, translation };
      });
  };

  const handleManualImport = async () => {
    const okay = await requireLogin(
      ui.loginPrompt.manualSaveTitle,
      ui.loginPrompt.manualSaveDescription
    );
    if (!okay || !user) return;
  
    const title = manualTitle.trim();
    if (!title) {
      alert(ui.alerts.manualTitleRequired);
      return;
    }
  
    if (!manualContent.trim()) {
      alert(ui.alerts.manualContentRequired);
      return;
    }
  
    try {
      setManualImportLoading(true);
  
      const rows = parseManualRows(manualContent);
  
      if (!rows.length) {
        alert(ui.alerts.manualEmptyRows);
        return;
      }
  
      await saveImportedChapter({
        uid: user.uid,
        title,
        language: manualLanguage,
        rows,
      });
  
      await reloadUserData(user);
  
      setManualTitle("");
      setManualContent("");
  
      alert(ui.alerts.manualSaved(title, rows.length));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : ui.alerts.manualSaveFailed;
      alert(message);
    } finally {
      setManualImportLoading(false);
    }
  };
  

const handleDeleteChapter = async (sheet: SheetContent) => {
  const okay = await requireLogin(
    ui.loginPrompt.deleteTitle,
    ui.loginPrompt.deleteDescription
  );
  
  if (!okay || !user) return;
  
    if (sheet.name === FAVORITES_SHEET_NAME) {
      alert(ui.alerts.deleteFavoritesForbidden);
      return;
    }
  
    const isImported = importedSheets.some((item) => item.name === sheet.name);
  
    if (!isImported) {
      alert(ui.alerts.deleteDefaultForbidden);
      return;
    }
  
    const confirmed = window.confirm(ui.alerts.deleteConfirm(sheet.name));
    if (!confirmed) return;
  
    await deleteImportedChapter(user.uid, sheet.name);
    await reloadUserData(user);
  
    if (selectedSheet?.name === sheet.name) {
      setSelectedSheet(null);
    }
  };

  const handleLogin = async () => {
    setLoginPromptOpen(false);
    trackEvent("login_start", getCommonAnalyticsParams());
    try {
      await loginWithGoogle();
      trackEvent("login_success", getCommonAnalyticsParams());
    } catch {
      trackEvent("login_fail", getCommonAnalyticsParams());
    }
  };

  const handleRequestLogout = () => {
    setLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutConfirmOpen(false);
    stopSpeech();
    await logout();
    trackEvent("logout_confirmed", getCommonAnalyticsParams());
    setSelectedSheet(null);
    setSelectedRecommendedSession(null);
    setDeveloperModeEnabled(false);
    localStorage.removeItem("speedvoca_developer_mode");
  };

  const handleImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
  
    try {
      const parsedSheets = await parseWorkbookFile(file);
  
      if (parsedSheets.length === 0) {
        alert(ui.alerts.importNoSheets);
        return;
      }
  
      for (const sheet of parsedSheets) {
        await saveImportedChapter({
          uid: user.uid,
          title: sheet.name,
          language: sheet.language,
          rows: sheet.rows.map((row:any) => ({
            sentence: row.sentence,
            translation: row.translation,
          })),
        });
      }
  
      await reloadUserData(user);
      alert(ui.alerts.importDone(parsedSheets.length));
    } catch (error) {
      console.error(error);
      alert(ui.alerts.importFailed);
    } finally {
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const isStatsReady = !user || loadedStatsUid === user.uid;

  async function handleOpenRecommended(meta: RecommendedContentMeta) {
    try {
      setRecommendedLoadError(null);
      setLoadingRecommendedId(meta.id);
  
      let remoteSheet = recommendedRemoteMap[meta.sourceSheetId];
      if (!remoteSheet) {
        remoteSheet = await fetchRecommendedSheet(meta);
        setRecommendedRemoteMap((prev) => ({
          ...prev,
          [meta.sourceSheetId]: remoteSheet!,
        }));
      }
  
      setSelectedSheet(null);
      setSelectedRecommendedSession({
        id: meta.id,
        title: ui.recommendedTitles[meta.id] ?? meta.title,
        sourceSheetId: meta.sourceSheetId,
        rows: remoteSheet.rows,
        targetLanguage: meta.defaultTargetLanguage,
        translationLanguage: getFallbackTranslationLanguage(meta.defaultTargetLanguage),
      });
      trackEvent("sheet_open_recommended", {
        ...getCommonAnalyticsParams(),
        sheet_type: "recommended",
        sheet_name: meta.id,
      });
  
      window.history.pushState({ speedvocaReader: true }, "");
    } catch (error) {
      console.error(error);
      setRecommendedLoadError(
        error instanceof Error ? error.message : ui.home.recommendedLoadFailed
      );
    } finally {
      setLoadingRecommendedId(null);
    }
  }

  return (
    <>
    <LevelUpEffect
      visible={showLevelUpEffect}
      level={levelSummary.currentLevel}
      label={ui.level.levelUp}
      levelPrefix={ui.level.short}
    />
    <div className="app-shell">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        style={{ display: "none" }}
        onChange={handleImportFileChange}
      />

    <header className="topbar simple-topbar">
      <div className="topbar-head-row">
        <div className="topbar-left">
          <img
            src="/logo.png"
            alt={ui.app.logoAlt}
            className="topbar-logo"
          />
        </div>

        <button
          className="settings-icon-btn"
          onClick={handleOpenSettings}
          aria-label={ui.app.settingsAria}
          type="button"
        >
          <img src={settingIcon} alt="" className="settings-icon-image" />
        </button>
      </div>

      {!loading && !authLoading && !error && isStatsReady && (
        <div className="topbar-stats-row">
          <StatsBar
            currentLevel={levelSummary.currentLevel}
            xpToNextLevel={levelSummary.xpToNextLevel}
            progressPercent={levelSummary.progressPercent}
            currentLevelXp={levelSummary.currentLevelXp}
            xpRequiredForNextLevel={levelSummary.xpRequiredForNextLevel}
            compact
            ui={ui}
          />
        </div>
      )}
    </header>

      {!loading && !authLoading && !userDataLoading && !error && (
        <>

          <SettingsPanel
            open={settingsOpen}
            onClose={handleCloseSettings}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            repeatCount={repeatCount}
            onChangeRepeatCount={handleChangeRepeatCount}
            isLoggedIn={!!user}
            userName={user?.displayName || user?.email || ui.app.userFallbackName}
            onLogin={() =>
              showLoginPrompt(ui.loginPrompt.quickLoginTitle, ui.loginPrompt.quickLoginDescription)
            }
            onLogout={handleRequestLogout}
            onShare={handleShareApp}
            isDeveloperAccount={isDeveloperAccount}
            developerModeEnabled={developerModeEnabled}
            onToggleDeveloperMode={() => setDeveloperModeEnabled((prev) => !prev)}
            onTestLevelUpEffect={handleTestLevelUpEffect}
            totalNext={effectiveTotalStats.totalNextCount}
            totalReplay={effectiveTotalStats.totalReplayCount}
            appLanguage={appLanguage}
            onChangeLanguage={handleChangeAppLanguage}
            ui={ui}
          />

          <LoginPromptModal
            open={loginPromptOpen}
            title={loginPromptTitle}
            description={loginPromptDescription}
            onClose={() => setLoginPromptOpen(false)}
            onLoginWithGoogle={handleLogin}
            ui={ui}
          />

          {shareSheetOpen && (
            <div className="share-sheet-overlay" onClick={() => setShareSheetOpen(false)}>
              <div className="share-sheet" onClick={(e) => e.stopPropagation()}>
                <h3>{ui.settings.shareSheetTitle}</h3>
                <div className="share-sheet-actions">
                  <button className="control-btn" type="button" onClick={handleShareByMessage}>
                    {ui.settings.shareByMessage}
                  </button>
                  <button className="control-btn" type="button" onClick={handleShareByMail}>
                    {ui.settings.shareByMail}
                  </button>
                  <button className="control-btn" type="button" onClick={handleCopyShareLink}>
                    {ui.settings.shareCopyLink}
                  </button>
                </div>
              </div>
            </div>
          )}

          {logoutConfirmOpen && (
            <div className="confirm-overlay" onClick={() => setLogoutConfirmOpen(false)}>
              <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                <h3 className="sangju-gotgam">{ui.settings.logoutConfirmTitle}</h3>
                <p>{ui.settings.logoutConfirmDescription}</p>
                <div className="confirm-actions">
                  <button className="secondary-btn" onClick={() => setLogoutConfirmOpen(false)}>
                    {ui.common.cancel}
                  </button>
                  <button className="primary-btn" onClick={handleConfirmLogout}>
                    {ui.settings.logout}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}


      {showGlobalLoading && (
        <div className="status-overlay">
          <div className="status-panel">
            <div className="status-bar-track">
              <div className="status-bar-fill" />
            </div>
            <div className="status-text">{ui.app.loading}</div>
          </div>
        </div>
      )}

      {!loading && !authLoading && error && <div className="status error">{error}</div>}

      {!loading && !authLoading && !error && !activeReaderOpen && (        
        <main className="home-layout">
          {user && visibleSheets.length > 0 && (
            <SectionBlock
              title={
                <span className="section-title-with-icon">
                  <img
                    src={myLearningIcon}
                    alt=""
                  className="section-title-icon"
                  aria-hidden="true"
                />
                  <span className="sangju-gotgam">{ui.home.myLearningSetsTitle}</span>
                </span>
              }
              description={ui.home.myLearningSetsDescription}
              variant="primary"
            >
              <SheetList
                sheets={visibleSheets}
                onSelect={handleSelectSheet}
                onDelete={handleDeleteChapter}
                isLoggedIn={!!user}
                statsMap={visibleStatsMap}
                ui={ui}
              />
            </SectionBlock>
          )}

          <SectionBlock
            title={
              <span className="section-title-with-icon">
                <img
                  src={recommendIcon}
                  alt=""
                  className="section-title-icon"
                  aria-hidden="true"
                />
                <span className="sangju-gotgam">{ui.home.recommendedTitle}</span>
              </span>
            }
            description={ui.home.recommendedDescription}
            variant="secondary"
          >
            <div className="recommended-rail home-horizontal-rail">
              <div className="recommended-grid">
                {recommendedContentMetas.map((item) => {
                  const guestOnlyVisible = item.access === "guest";
                  const locked = !user && !guestOnlyVisible;
                  const isLoading = loadingRecommendedId === item.id;
                  const localizedTitle = ui.recommendedTitles[item.id] ?? item.title;

                  const handleRecommendedClick = () => {
                    if (isLoading) return;

                    if (locked) {
                      showLoginPrompt(
                        ui.loginPrompt.moreSamplesTitle,
                        ui.loginPrompt.moreSamplesDescription
                      );
                      return;
                    }

                    handleOpenRecommended(item);
                  };

                  return (
                    <div
                      key={item.id}
                      className={`recommended-card recommended-tile clickable ${
                        locked ? "locked" : ""
                      } ${isLoading ? "loading" : ""}`}
                      onClick={handleRecommendedClick}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleRecommendedClick();
                        }
                      }}
                    >
                      <div className="recommended-card-image-wrap recommended-tile-image-wrap">
                        <img
                          src={item.imageSrc}
                          alt={localizedTitle}
                          className="recommended-card-image"
                          loading="lazy"
                        />
                      </div>

                      <div className="recommended-card-body recommended-tile-body">
                        <div className="recommended-card-title recommended-tile-title">
                          {isLoading ? ui.home.loadingCard : localizedTitle}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {recommendedLoadError && (
                <div className="section-error-text">{recommendedLoadError}</div>
              )}
            </div>
          </SectionBlock>

          <SectionBlock
            title={
              <span className="section-title-with-icon sangju-gotgam">
                <img
                  src={importIcon}
                  alt=""
                  className="section-title-icon"
                  aria-hidden="true"
                />
                <span>{ui.home.importTitle}</span>
              </span>
            }
            description={ui.home.importDescription}
            variant="import"
          >
            <div className="manual-import-panel">
              <div className="manual-import-form">
                <label className="manual-label">{ui.manualImport.chapterTitle}</label>
                <input
                  className="manual-input"
                  type="text"
                  placeholder={ui.manualImport.chapterTitlePlaceholder}
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                />

                <label className="manual-label">{ui.manualImport.studyContent}</label>
                <textarea
                  className="manual-textarea"
                  placeholder={ui.manualImport.studyContentPlaceholder}
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  rows={10}
                />

                <label className="manual-label">{ui.manualImport.language}</label>
                <select
                  className="manual-input"
                  value={manualLanguage}
                  onChange={(e) => setManualLanguage(e.target.value as ChapterLanguage)}
                >
                  <option value="en-US">{ui.reader.languageName.en}</option>
                  <option value="fr-FR">{ui.reader.languageName.fr}</option>
                  <option value="cmn-CN">{ui.reader.languageName.zh}</option>
                  <option value="ko-KR">{ui.reader.languageName.ko}</option>
                </select>

                <div className="manual-import-help">
                  <div>{ui.manualImport.inputRules}</div>
                  <ul>
                    <li>{ui.manualImport.ruleOneLine}</li>
                    <li>{ui.manualImport.ruleFormat}</li>
                    <li>{ui.manualImport.ruleExample}</li>
                  </ul>
                </div>

                <div className="manual-import-actions">
                  <button
                    className="card-action primary"
                    onClick={handleManualImport}
                    disabled={manualImportLoading}
                  >
                    {manualImportLoading ? ui.manualImport.savingChapter : ui.manualImport.saveChapter}
                  </button>

                  <button
                    className="card-action"
                    type="button"
                    onClick={() => {
                      setManualTitle("");
                      setManualContent("");
                    }}
                    disabled={manualImportLoading}
                  >
                    {ui.manualImport.clear}
                  </button>
                </div>
              </div>

              <div className="manual-import-suboption">
                <p>{ui.manualImport.suboption}</p>
                <button className="card-action" onClick={handleImport}>
                  {ui.manualImport.importExcel}
                </button>
              </div>
            </div>
          </SectionBlock>
        </main>
      )}

      {!loading && !authLoading && !error && activeDisplaySheet && (
        <ReaderView
          sheet={activeDisplaySheet}
          sheetSessionKey={selectedRecommendedSession?.id ?? activeDisplaySheet.name}
          soundEnabled={soundEnabled}
          repeatCount={repeatCount}
          voiceURI={selectedVoiceMap[activeDisplaySheet.language] ?? null}
          voices={voices.filter((voice) => voice.lang === activeDisplaySheet.language)}
          selectedVoiceURI={selectedVoiceMap[activeDisplaySheet.language] ?? null}
          onChangeVoice={handleChangeVoice}
          isLoggedIn={!!user}
          onRequireLogin={() =>
            requireLogin(
              ui.loginPrompt.readerFeatureTitle,
              ui.loginPrompt.readerFeatureDescription
            )
          }
          userId={user?.uid}
          onStatsChanged={() => reloadUserData(user)}
          onGuestStatsDelta={handleGuestStatsDelta}
          chapterSettings={settingsMap[activeDisplaySheet.name]}
          exitConfirmOpen={exitConfirmOpen}
          onRequestExit={handleRequestExitReader}
          onConfirmExit={confirmExitReader}
          onCancelExit={cancelExitReader}
          translationLanguage={selectedRecommendedSession?.translationLanguage ?? null}
          translationOptions={
            selectedRecommendedSession
              ? (["en", "zh", "fr", "ja", "ko"] as LanguageCode[])
                  .filter((lang) => lang !== selectedRecommendedSession.targetLanguage)
              : []
          }
          onChangeTranslationLanguage={
            selectedRecommendedSession
              ? handleChangeRecommendedTranslationLanguage
              : undefined
          }
          onShare={handleShareApp}
          ui={ui}
        />
      )}
    </div>
    {/* <LevelUpEffect
      visible={showLevelUpEffect}
      level={levelSummary.currentLevel}
    /> */}
    </>

  );
}
