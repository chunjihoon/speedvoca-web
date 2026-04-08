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
import "./styles/home-sections.css";
import myLearningIcon from "./assets/mylearning.png";
import recommendIcon from "./assets/recommend.png";
import importIcon from "./assets/import.png";

type TargetLanguageCode = Exclude<LanguageCode, "ja">;

type VisibleChapterStat = {
  completedSentenceCount?: number;
  nextCount?: number;
  replayCount?: number;
  favoriteCount?: number;
};

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
  const [favoriteRows, setFavoriteRows] = useState<{ sentence: string; translation: string; sourceSheetName: string }[]>([]);
  const [importedSheets, setImportedSheets] = useState<SheetContent[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [settingsMap, setSettingsMap] = useState<Record<string, { randomEnabled?: boolean; fontScale?: number }>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  //const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [loginPromptTitle, setLoginPromptTitle] = useState("로그인이 필요합니다");
  const [loginPromptDescription, setLoginPromptDescription] = useState(
    "이 기능은 로그인 후 사용할 수 있습니다."
  );

  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [manualImportLoading, setManualImportLoading] = useState(false);

  const [loadedStatsUid, setLoadedStatsUid] = useState<string | null>(null);
  const [userDataLoading, setUserDataLoading] = useState(false);

  const DEVELOPER_EMAILS = [import.meta.env.VITE_DEVELOPER_EMAILS];
  const isDeveloperAccount = !!user?.email && DEVELOPER_EMAILS.includes(user.email);

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
    if (!activeReaderOpen) return;
  
    window.history.pushState({ speedvocaReader: true }, "", window.location.href);
  }, [activeReaderOpen]);

  useEffect(() => {
    const handlePopState = () => {
      if (!selectedSheetRef.current) return;
  
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
        setError(err instanceof Error ? err.message : "알 수 없는 오류");
      } finally {
        setLoading(false);
      }
    }
  
    init();
  }, []);

  const showLoginPrompt = (
    title = "로그인이 필요합니다",
    description = "이 기능은 로그인 후 사용할 수 있습니다."
  ) => {
    setLoginPromptTitle(title);
    setLoginPromptDescription(description);
    setLoginPromptOpen(true);
  };

  const EMPTY_TOTAL_STATS = {
    totalCompletedSentenceCount: 0,
    totalNextCount: 0,
    totalReplayCount: 0,
  };

  const reloadUserData = async (targetUser = user) => {
    if (!targetUser) {
      setTitleMap({});
      setStatsMap({});
      setFavoriteRows([]);
      setImportedSheets([]);
      setSettingsMap({});
      setTotalStats(EMPTY_TOTAL_STATS);
      setLoadedStatsUid(null);
      setUserDataLoading(false);
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
      setUserDataLoading(false);
    }
  };

  useEffect(() => {
    void reloadUserData();
  }, [user]);

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
        name: "Favorites",
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
      result["Favorites"] = {
        name: "Favorites",
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
      result["Favorites"] = {
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
      totalStats.totalNextCount,
      totalStats.totalReplayCount
    );
  
    return getLevelSummary(totalXp);
  }, [totalStats.totalNextCount, totalStats.totalReplayCount]);

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
  const prevLevelRef = useRef(levelSummary.currentLevel);
  const hasInitializedLevelRef = useRef(false);
  useEffect(() => {
    if (user && loadedStatsUid !== user.uid) return;
  
    const nextLevel = levelSummary.currentLevel;
  
    if (!hasInitializedLevelRef.current) {
      prevLevelRef.current = nextLevel;
      hasInitializedLevelRef.current = true;
      return;
    }
  
    const prevLevel = prevLevelRef.current;
  
    if (nextLevel > prevLevel) {
      setShowLevelUpEffect(true);
      playLevelUpSound();
  
      window.setTimeout(() => {
        setShowLevelUpEffect(false);
      }, 2200);
    }
  
    prevLevelRef.current = nextLevel;
  }, [levelSummary.currentLevel, loadedStatsUid, user]);


  const handleSelectSheet = (sheet: SheetContent) => {
    const raw = rawSheetMap[sheet.name] ?? sheet;
  
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



  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    setSoundEnabled(next);
    if (!next) stopSpeech();
  };

  const handleChangeRepeatCount = (value: number) => {
    setRepeatCountState(value);
    setRepeatCount(value);
  };

  // const handleExitReader = () => {
  //   setExitConfirmOpen(true);
  // };
  
  const confirmExitReader = () => {
    setExitConfirmOpen(false);
    stopSpeech();
    setSelectedSheet(null);
    setSelectedRecommendedSession(null);
  };
  
  const cancelExitReader = () => {
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
    title = "로그인이 필요합니다",
    description = "이 기능은 로그인 후 사용할 수 있습니다."
  ) => {
    if (user) return true;
    showLoginPrompt(title, description);
    return false;
  };

  const handleImport = async () => {
    const okay = await requireLogin(
      "학습 자료를 가져오려면 로그인하세요",
      "엑셀 파일을 가져오고 저장하려면 먼저 로그인해야 합니다."
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
          throw new Error(`${index + 1}번째 줄 형식이 올바르지 않습니다. "sentence | translation" 형식으로 입력하세요.`);
        }
  
        const sentence = parts[0].trim();
        const translation = parts.slice(1).join("|").trim();
  
        if (!sentence || !translation) {
          throw new Error(`${index + 1}번째 줄에 sentence 또는 translation이 비어 있습니다.`);
        }
  
        return { sentence, translation };
      });
  };

  const handleManualImport = async () => {
    const okay = await requireLogin(
      "학습 자료를 저장하려면 로그인하세요",
      "직접 입력한 학습 자료를 저장하고 계속 사용하려면 로그인해야 합니다."
    );
    if (!okay || !user) return;
  
    const title = manualTitle.trim();
    if (!title) {
      alert("챕터 제목을 입력하세요.");
      return;
    }
  
    if (!manualContent.trim()) {
      alert('학습 내용을 입력하세요. 각 줄은 "sentence | translation" 형식이어야 합니다.');
      return;
    }
  
    try {
      setManualImportLoading(true);
  
      const rows = parseManualRows(manualContent);
  
      if (!rows.length) {
        alert("저장할 문장이 없습니다.");
        return;
      }
  
      await saveImportedChapter({
        uid: user.uid,
        title,
        language: manualLanguage,
        rows,
      });
  
      await reloadUserData();
  
      setManualTitle("");
      setManualContent("");
  
      alert(`"${title}" 챕터가 추가되었습니다. (${rows.length}문장)`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "입력한 학습 자료를 저장하는 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setManualImportLoading(false);
    }
  };
  

  // const handleEditTitle = async (sheet: SheetContent) => {
  //   const okay = await requireLogin(
  //     "챕터 이름 변경은 로그인 후 사용 가능합니다",
  //     "개인 학습 세트의 제목을 바꾸려면 로그인하세요."
  //   );
  //   if (!okay || !user) return;

  //   if (sheet.name === "Favorites") {
  //     alert("Favorites 챕터는 이름을 수정할 수 없습니다.");
  //     return;
  //   }

  //   const originalSheet = rawSheetMap[sheet.name] ?? sheet;
  //   const sourceSheetName = originalSheet?.name ?? sheet.name;
  //   const currentTitle = titleMap[sourceSheetName] || sourceSheetName;
  //   const nextTitle = window.prompt("새 챕터 제목을 입력하세요.", currentTitle);

  //   if (!nextTitle?.trim()) return;

  //   await saveChapterTitle(user.uid, sourceSheetName, nextTitle.trim());
  //   await reloadUserData();
  // };

const handleDeleteChapter = async (sheet: SheetContent) => {
  const okay = await requireLogin(
    "챕터 삭제는 로그인 후 사용 가능합니다",
    "내 학습 세트에서 챕터를 삭제하려면 로그인하세요."
  );
  
  if (!okay || !user) return;
  
    if (sheet.name === "Favorites") {
      alert("Favorites 챕터는 삭제할 수 없습니다.");
      return;
    }
  
    const isImported = importedSheets.some((item) => item.name === sheet.name);
  
    if (!isImported) {
      alert("기본 제공 챕터는 아직 삭제 대상이 아닙니다. 현재는 import한 챕터만 삭제할 수 있습니다.");
      return;
    }
  
    const confirmed = window.confirm(`"${sheet.name}" 챕터를 삭제하시겠습니까?`);
    if (!confirmed) return;
  
    await deleteImportedChapter(user.uid, sheet.name);
    await reloadUserData();
  
    if (selectedSheet?.name === sheet.name) {
      setSelectedSheet(null);
    }
  };

  // const handleAddRecommended = async (sheet: SheetContent) => {
  //   const okay = await requireLogin(
  //     "추천 학습 세트를 추가하려면 로그인하세요",
  //     "로그인하면 원하는 기본 제공 자료를 My Learning Sets에 추가할 수 있습니다."
  //   );
  //   if (!okay || !user) return;
  
  //   const alreadyExists = importedSheets.some((item) => item.name === sheet.name);
  //   if (alreadyExists) {
  //     alert(`"${sheet.name}"는 이미 내 학습 세트에 추가되어 있습니다.`);
  //     return;
  //   }
  
  //   await saveImportedChapter({
  //     uid: user.uid,
  //     title: sheet.name,
  //     language: sheet.language,
  //     rows: sheet.rows.map((row) => ({
  //       sentence: row.sentence,
  //       translation: row.translation,
  //     })),
  //   });
  
  //   await reloadUserData();
  //   alert(`"${sheet.name}"가 내 학습 세트에 추가되었습니다.`);
  // };

  const handleLogin = async () => {
    setLoginPromptOpen(false);
    await loginWithGoogle();
  };

  const handleLogout = async () => {
    stopSpeech();
    await logout();
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
        alert("가져올 수 있는 시트가 없습니다. sentence / translation 형식을 확인하세요.");
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
  
      await reloadUserData();
      alert(`${parsedSheets.length}개 챕터를 가져왔습니다.`);
    } catch (error) {
      console.error(error);
      alert("엑셀 import 중 오류가 발생했습니다.");
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
        title: meta.title,
        sourceSheetId: meta.sourceSheetId,
        rows: remoteSheet.rows,
        targetLanguage: meta.defaultTargetLanguage,
        translationLanguage: getFallbackTranslationLanguage(meta.defaultTargetLanguage),
      });
  
      window.history.pushState({ speedvocaReader: true }, "");
    } catch (error) {
      console.error(error);
      setRecommendedLoadError(
        error instanceof Error ? error.message : "학습 자료를 불러오지 못했습니다."
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
            alt="Loopeak Language Training Web"
            className="topbar-logo"
          />
        </div>

        <button
          className="settings-icon-btn"
          onClick={() => setSettingsOpen(true)}
          aria-label="Open settings"
          type="button"
        >
          ⚙
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
          />
        </div>
      )}
    </header>

      {!loading && !authLoading && !userDataLoading && !error && (
        <>

          <SettingsPanel
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            repeatCount={repeatCount}
            onChangeRepeatCount={handleChangeRepeatCount}
            isLoggedIn={!!user}
            userName={user?.displayName || user?.email || "User"}
            onLogin={() => showLoginPrompt("로그인", "Google 계정으로 바로 시작할 수 있습니다.")}
            onLogout={handleLogout}
            totalNext={totalStats.totalNextCount}
            totalReplay={totalStats.totalReplayCount}
            isDeveloperAccount={isDeveloperAccount}
            developerModeEnabled={developerModeEnabled}
            onToggleDeveloperMode={() => setDeveloperModeEnabled((prev) => !prev)}
            onTestLevelUpEffect={handleTestLevelUpEffect}
          />

          <LoginPromptModal
            open={loginPromptOpen}
            title={loginPromptTitle}
            description={loginPromptDescription}
            onClose={() => setLoginPromptOpen(false)}
            onLoginWithGoogle={handleLogin}
          />
        </>
      )}


      {showGlobalLoading && (
        <div className="status-overlay">
          <div className="status-panel">
            <div className="status-bar-track">
              <div className="status-bar-fill" />
            </div>
            <div className="status-text">Loading...</div>
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
                  <span>My Learning Sets</span>
                </span>
              }
              description="당신이 추가하거나 학습 중인 챕터입니다."
              variant="primary"
            >
              <SheetList
                sheets={visibleSheets}
                onSelect={handleSelectSheet}
                onDelete={handleDeleteChapter}
                isLoggedIn={!!user}
                statsMap={visibleStatsMap}
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
                <span>Recommended Learning Sets</span>
              </span>
            }
            description="기본 제공 학습 자료입니다. 로그인하면 원하는 세트를 내 학습 목록에 추가할 수 있습니다."
            variant="secondary"
          >
            <div className="recommended-rail home-horizontal-rail">
              <div className="recommended-grid">
                {recommendedContentMetas.map((item) => {
                  const guestOnlyVisible = item.access === "guest";
                  const locked = !user && !guestOnlyVisible;
                  const isLoading = loadingRecommendedId === item.id;

                  const handleRecommendedClick = () => {
                    if (isLoading) return;

                    if (locked) {
                      showLoginPrompt(
                        "로그인 후 더 많은 샘플을 사용할 수 있습니다",
                        "지금은 첫 번째 샘플만 체험할 수 있습니다. 로그인하면 나머지 자료를 사용할 수 있습니다."
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
                          alt={item.title}
                          className="recommended-card-image"
                          loading="lazy"
                        />
                      </div>

                      <div className="recommended-card-body recommended-tile-body">
                        <div className="recommended-card-title recommended-tile-title">
                          {isLoading ? "Loading..." : item.title}
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
              <span className="section-title-with-icon">
                <img
                  src={importIcon}
                  alt=""
                  className="section-title-icon"
                  aria-hidden="true"
                />
                <span>Import Your Own Study Material</span>
              </span>
            }
            description="문장과 해석을 직접 입력해서 나만의 학습 챕터를 만들 수 있습니다. 각 줄은 sentence | translation 형식으로 입력하세요."
            variant="import"
          >
            <div className="manual-import-panel">
              {/* <div className="manual-import-header">
                <h3>Create Your Own Study Material</h3>
                <p>
                  문장과 해석을 직접 입력해서 나만의 학습 챕터를 만들 수 있습니다.
                  <br />
                  각 줄은 <strong>sentence | translation</strong> 형식으로 입력하세요.
                </p>
              </div> */}

              <div className="manual-import-form">
                <label className="manual-label">Chapter Title</label>
                <input
                  className="manual-input"
                  type="text"
                  placeholder="예: Daily Conversation Practice"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                />

                <label className="manual-label">Study Content</label>
                <textarea
                  className="manual-textarea"
                  placeholder={`How are you? | 잘 지내?\nI’m on my way. | 가는 중이야\nLet’s get started. | 시작하자`}
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  rows={10}
                />

                <label className="manual-label">Language</label>
                <select
                  className="manual-input"
                  value={manualLanguage}
                  onChange={(e) => setManualLanguage(e.target.value as ChapterLanguage)}
                >
                  <option value="en-US">English</option>
                  <option value="fr-FR">French</option>
                  <option value="cmn-CN">Chinese</option>
                  <option value="ko-KR">Korean</option>
                </select>

                <div className="manual-import-help">
                  <div>입력 규칙</div>
                  <ul>
                    <li>한 줄 = 한 문장</li>
                    <li>형식: sentence | translation</li>
                    <li>예: I’m exhausted. | 나 너무 지쳤어.</li>
                  </ul>
                </div>

                <div className="manual-import-actions">
                  <button
                    className="card-action primary"
                    onClick={handleManualImport}
                    disabled={manualImportLoading}
                  >
                    {manualImportLoading ? "Saving..." : "Save Chapter"}
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
                    Clear
                  </button>
                </div>
              </div>

              <div className="manual-import-suboption">
                <p>나만의 문장 자료를 엑셀 파일로 불러와서 공부해보세요. (형식: 1열-sentence, 2열-translation)</p>
                <button className="card-action" onClick={handleImport}>
                  Import Excel File
                </button>
              </div>
            </div>
          </SectionBlock>
        </main>
      )}

      {!loading && !authLoading && !error && activeDisplaySheet && (
        <ReaderView
          sheet={activeDisplaySheet}
          soundEnabled={soundEnabled}
          repeatCount={repeatCount}
          voiceURI={selectedVoiceMap[activeDisplaySheet.language] ?? null}
          voices={voices.filter((voice) => voice.lang === activeDisplaySheet.language)}
          selectedVoiceURI={selectedVoiceMap[activeDisplaySheet.language] ?? null}
          onChangeVoice={handleChangeVoice}
          isLoggedIn={!!user}
          onRequireLogin={() =>
            requireLogin(
              "로그인이 필요한 기능입니다",
              "즐겨찾기, 랜덤, 글자 크기 저장 같은 개인화 기능은 로그인 후 사용할 수 있습니다."
            )
          }
          userId={user?.uid}
          onStatsChanged={reloadUserData}
          chapterSettings={settingsMap[activeDisplaySheet.name]}
          exitConfirmOpen={exitConfirmOpen}
          onRequestExit={() => setExitConfirmOpen(true)}
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

