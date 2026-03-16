import { useEffect, useMemo, useState, useRef } from "react";
import type { SheetContent, TtsVoiceOption } from "./types/content";
import { loadWorkbook, parseWorkbookFile } from "./lib/workbook";
import TopBar from "./components/TopBar";
import SheetList from "./components/SheetList";
import ReaderView from "./components/ReaderView";
import {
  getRepeatCount,
  getSoundEnabled,
  getVoiceURI,
  setRepeatCount,
  setSoundEnabled,
  setVoiceURI,
} from "./lib/storage";
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
  loadUserStats,
  saveChapterTitle,
  saveImportedChapter,
} from "./lib/firestore";

type VisibleChapterStat = {
  completedSentenceCount?: number;
  nextCount?: number;
  replayCount?: number;
  favoriteCount?: number;
};

export default function App() {
  const { user, authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sheets, setSheets] = useState<SheetContent[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<SheetContent | null>(null);
  const [soundEnabled, setSoundEnabledState] = useState(getSoundEnabled());
  const [repeatCount, setRepeatCountState] = useState(getRepeatCount());
  const [voices, setVoices] = useState<TtsVoiceOption[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURIState] = useState<string | null>(getVoiceURI());
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



  useEffect(() => {
    async function init() {
      try {
        const [data, loadedVoices] = await Promise.all([
          loadWorkbook(),
          waitForVoices(),
        ]);

        setSheets(data);
        setVoices(loadedVoices);

        const savedVoice = getVoiceURI();
        const validSavedVoice = loadedVoices.some((v) => v.voiceURI === savedVoice);

        if (validSavedVoice && savedVoice) {
          setSelectedVoiceURIState(savedVoice);
        } else {
          const fallback = getDefaultEnglishVoiceURI();
          if (fallback) {
            setSelectedVoiceURIState(fallback);
            setVoiceURI(fallback);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const reloadUserData = async () => {
    if (!user) {
      setTitleMap({});
      setStatsMap({});
      setFavoriteRows([]);
      setImportedSheets([]);
      setSettingsMap({});
      setTotalStats({
        totalCompletedSentenceCount: 0,
        totalNextCount: 0,
        totalReplayCount: 0,
      });
      return;
    }

    const [meta, stats, favorites, imported] = await Promise.all([
      loadUserChapterMeta(user.uid),
      loadUserStats(user.uid),
      loadFavorites(user.uid),
      loadImportedChapters(user.uid),
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
    setTotalStats(stats);
    setImportedSheets(
      imported.map((chapter) => ({
        name: chapter.title,
        rows: chapter.rows,
      }))
    );
    setSettingsMap(mappedSettings);

  };

  useEffect(() => {
    reloadUserData();
  }, [user]);

  const visibleSheets = useMemo(() => {
    const base = user ? [...sheets, ...importedSheets] : sheets.slice(0, 1);
  
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
        rows: favoriteRows.map((row) => ({
          sentence: row.sentence,
          translation: row.translation,
          sourceSheetName: row.sourceSheetName,
        })),
      });
    }
  
    return mapped;
  }, [sheets, importedSheets, titleMap, user, favoriteRows]);
  

  const rawSheetMap = useMemo(() => {
    const result: Record<string, SheetContent> = {};
  
    [...sheets, ...importedSheets].forEach((sheet) => {
      result[sheet.name] = sheet;
      const customTitle = titleMap[sheet.name];
      if (customTitle) {
        result[customTitle] = sheet;
      }
    });
  
    if (favoriteRows.length > 0) {
      result["Favorites"] = {
        name: "Favorites",
        rows: favoriteRows.map((row) => ({
          sentence: row.sentence,
          translation: row.translation,
          sourceSheetName: row.sourceSheetName,
        })),
      };
    }
  
    return result;
  }, [sheets, importedSheets, titleMap, favoriteRows]);
  

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

  const handleExitReader = () => {
    stopSpeech();
    setSelectedSheet(null);
  };

  const handleChangeVoice = (voiceURI: string) => {
    setSelectedVoiceURIState(voiceURI);
    setVoiceURI(voiceURI);
    stopSpeech();
  };

  const requireLogin = async () => {
    if (user) return true;
    await loginWithGoogle();
    return false;
  };

  const handleImport = async () => {
    if (!user) {
      await loginWithGoogle();
      return;
    }
  
    fileInputRef.current?.click();
  };
  

  const handleEditTitle = async (sheet: SheetContent) => {
    if (!user) {
      await loginWithGoogle();
      return;
    }

    if (sheet.name === "Favorites") {
      alert("Favorites 챕터는 이름을 수정할 수 없습니다.");
      return;
    }

    const originalSheet = rawSheetMap[sheet.name] ?? sheets.find((s) => s.name === sheet.name);
    const sourceSheetName = originalSheet?.name ?? sheet.name;
    const currentTitle = titleMap[sourceSheetName] || sourceSheetName;
    const nextTitle = window.prompt("새 챕터 제목을 입력하세요.", currentTitle);

    if (!nextTitle) return;

    await saveChapterTitle(user.uid, sourceSheetName, nextTitle.trim());
    await reloadUserData();
  };

  const handleLogin = async () => {
    await loginWithGoogle();
  };

  const handleLogout = async () => {
    stopSpeech();
    await logout();
    setSelectedSheet(null);
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
          rows: sheet.rows.map((row) => ({
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
  

  return (
    <div className="app-shell">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        style={{ display: "none" }}
        onChange={handleImportFileChange}
      />
      <TopBar
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        repeatCount={repeatCount}
        onChangeRepeatCount={handleChangeRepeatCount}
        onBackToList={handleExitReader}
        inReader={!!selectedSheet}
        voices={voices}
        selectedVoiceURI={selectedVoiceURI}
        onChangeVoice={handleChangeVoice}
        isLoggedIn={!!user}
        userName={user?.displayName || user?.email || "User"}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onImport={handleImport}
      />

      {(loading || authLoading) && <div className="status">로딩 중...</div>}

      {!loading && !authLoading && error && <div className="status error">{error}</div>}

      {!loading && !authLoading && !error && !selectedSheet && (
        <>
          {!user && (
            <div className="guest-notice">
              게스트는 기본 챕터 1개만 학습할 수 있습니다. 더 많은 기능은 로그인 후 사용 가능합니다.
            </div>
          )}

          {!!user && (
            <div className="global-stats">
              <span>Total Tap {totalStats.totalCompletedSentenceCount}</span>
              <span>Total Next {totalStats.totalNextCount}</span>
              <span>Total Replay {totalStats.totalReplayCount}</span>
            </div>
          )}

          <SheetList
            sheets={visibleSheets}
            onSelect={setSelectedSheet}
            onEditTitle={handleEditTitle}
            isLoggedIn={!!user}
            statsMap={visibleStatsMap}
          />
        </>
      )}

      {!loading && !authLoading && !error && selectedSheet && (
        <ReaderView
          sheet={rawSheetMap[selectedSheet.name] ?? selectedSheet}
          soundEnabled={soundEnabled}
          repeatCount={repeatCount}
          onExit={handleExitReader}
          voiceURI={selectedVoiceURI}
          isLoggedIn={!!user}
          onRequireLogin={requireLogin}
          userId={user?.uid}
          onStatsChanged={reloadUserData}
          chapterSettings={settingsMap[rawSheetMap[selectedSheet.name]?.name ?? selectedSheet.name]}
        />
      )}
    </div>
  );
}
