import { useEffect, useMemo, useState, useRef } from "react";
import type { SheetContent, TtsVoiceOption } from "./types/content";
import { loadWorkbook, parseWorkbookFile } from "./lib/workbook";
//import TopBar from "./components/TopBar";
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
  deleteImportedChapter,

} from "./lib/firestore";
import StatsBar from "./components/StatsBar";
import SettingsPanel from "./components/SettingsPanel";
import SectionBlock from "./components/SectionBlock";
import LoginPromptModal from "./components/LoginPromptModal";

type VisibleChapterStat = {
  completedSentenceCount?: number;
  nextCount?: number;
  replayCount?: number;
  favoriteCount?: number;
};
const FREE_DATA_PATH = "/data/speedvoca-free-data.xlsx";
const DIFFICULTY_BY_INDEX = ["하", "중하", "중", "중상", "상"];

export default function App() {
  const { user, authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recommendedSheets, setRecommendedSheets] = useState<SheetContent[]>([]);
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  //const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [loginPromptTitle, setLoginPromptTitle] = useState("로그인이 필요합니다");
  const [loginPromptDescription, setLoginPromptDescription] = useState(
    "이 기능은 로그인 후 사용할 수 있습니다."
  );

  //const [manualTitle, setManualTitle] = useState("");
  //const [manualContent, setManualContent] = useState("");
  //const [manualImportLoading, setManualImportLoading] = useState(false);
  
  useEffect(() => {
    async function init() {
      try {
        const [recommendedData, loadedVoices] = await Promise.all([
          loadWorkbook(FREE_DATA_PATH),
          waitForVoices(),
        ]);
        
        setRecommendedSheets(
          recommendedData.map((sheet, index) => ({
            ...sheet,
            difficulty: DIFFICULTY_BY_INDEX[index] ?? "기타",
          }))
        );
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

  const showLoginPrompt = (
    title = "로그인이 필요합니다",
    description = "이 기능은 로그인 후 사용할 수 있습니다."
  ) => {
    setLoginPromptTitle(title);
    setLoginPromptDescription(description);
    setLoginPromptOpen(true);
  };

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
    const base = user ? [...importedSheets] : recommendedSheets.slice(0, 1);  
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
  }, [recommendedSheets, importedSheets, titleMap, user, favoriteRows]);
  

  const rawSheetMap = useMemo(() => {
    const result: Record<string, SheetContent> = {};
  
    [...recommendedSheets, ...importedSheets].forEach((sheet) => {
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
  }, [recommendedSheets, importedSheets, titleMap, favoriteRows]);
  

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
  

  const handleEditTitle = async (sheet: SheetContent) => {
    const okay = await requireLogin(
      "챕터 이름 변경은 로그인 후 사용 가능합니다",
      "개인 학습 세트의 제목을 바꾸려면 로그인하세요."
    );
    if (!okay || !user) return;

    if (sheet.name === "Favorites") {
      alert("Favorites 챕터는 이름을 수정할 수 없습니다.");
      return;
    }

    const originalSheet = rawSheetMap[sheet.name] ?? recommendedSheets.find((s) => s.name === sheet.name);
    const sourceSheetName = originalSheet?.name ?? sheet.name;
    const currentTitle = titleMap[sourceSheetName] || sourceSheetName;
    const nextTitle = window.prompt("새 챕터 제목을 입력하세요.", currentTitle);

    if (!nextTitle?.trim()) return;

    await saveChapterTitle(user.uid, sourceSheetName, nextTitle.trim());
    await reloadUserData();
  };

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

  const handleAddRecommended = async (sheet: SheetContent) => {
    const okay = await requireLogin(
      "추천 학습 세트를 추가하려면 로그인하세요",
      "로그인하면 원하는 기본 제공 자료를 My Learning Sets에 추가할 수 있습니다."
    );
    if (!okay || !user) return;
  
    const alreadyExists = importedSheets.some((item) => item.name === sheet.name);
    if (alreadyExists) {
      alert(`"${sheet.name}"는 이미 내 학습 세트에 추가되어 있습니다.`);
      return;
    }
  
    await saveImportedChapter({
      uid: user.uid,
      title: sheet.name,
      rows: sheet.rows.map((row) => ({
        sentence: row.sentence,
        translation: row.translation,
      })),
    });
  
    await reloadUserData();
    alert(`"${sheet.name}"가 내 학습 세트에 추가되었습니다.`);
  };

  const handleLogin = async () => {
    setLoginPromptOpen(false);
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

      <header className="topbar simple-topbar">
        <div className="topbar-left">
          <h1>Speed Voca Web</h1>
        </div>
      </header>

      {!loading && !authLoading && !error && (
        <>
          <StatsBar
            totalTap={totalStats.totalCompletedSentenceCount}
            totalNext={totalStats.totalNextCount}
            totalReplay={totalStats.totalReplayCount}
            onOpenSettings={() => setSettingsOpen(true)}
          />

          <SettingsPanel
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            repeatCount={repeatCount}
            onChangeRepeatCount={handleChangeRepeatCount}
            voices={voices}
            selectedVoiceURI={selectedVoiceURI}
            onChangeVoice={handleChangeVoice}
            isLoggedIn={!!user}
            userName={user?.displayName || user?.email || "User"}
            onLogin={() => showLoginPrompt("로그인", "Google 계정으로 바로 시작할 수 있습니다.")}
            onLogout={handleLogout}
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


      {(loading || authLoading) && <div className="status">로딩 중...</div>}

      {!loading && !authLoading && error && <div className="status error">{error}</div>}

      {!loading && !authLoading && !error && !selectedSheet && (
        <main className="home-layout">
          <SectionBlock
            title={user ? "📚 My Learning Sets" : "📚 Sample Learning Set"}
            description={
              user
                ? "당신이 추가하거나 학습 중인 챕터입니다."
                : "게스트는 기본 샘플 1개만 학습할 수 있습니다."
            }
            variant="primary"
          >
            <SheetList
              sheets={visibleSheets}
              onSelect={setSelectedSheet}
              onEditTitle={handleEditTitle}
              onDelete={handleDeleteChapter}
              isLoggedIn={!!user}
              statsMap={visibleStatsMap}
            />
          </SectionBlock>

          <SectionBlock
            title="✨ Recommended Learning Sets"
            description="기본 제공 학습 자료입니다. 로그인하면 원하는 세트를 내 학습 목록에 추가할 수 있습니다."
            variant="secondary"
          >
            <div className="recommended-grid">
              {recommendedSheets.map((sheet, index) => {
                const guestOnlyVisible = index === 0;
                const locked = !user && !guestOnlyVisible;
                const alreadyAdded = importedSheets.some((item) => item.name === sheet.name);
                const progressPercent = Math.max(
                  0,
                  Math.min(
                    100,
                    Math.round(
                      ((visibleStatsMap[sheet.name]?.completedSentenceCount ?? 0) / Math.max(sheet.rows.length, 1)) * 100
                    )
                  )
                );

                return (
                  <div key={sheet.name} className={`recommended-card ${locked ? "locked" : ""}`}>
                    <div className="sheet-card-head">
                      <div className="sheet-title">{sheet.name}</div>
                      {sheet.difficulty && <div className="difficulty-badge">{sheet.difficulty}</div>}
                    </div>
                    <div className="sheet-sub">{sheet.rows.length} sentences</div>

                    <div className="progress-block">
                      <div className="progress-meta">
                        <span>Progress</span>
                        <strong>{progressPercent}%</strong>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                      </div>
                    </div>

                    <div className="recommended-actions">
                      {guestOnlyVisible ? (
                        <button className="card-action primary" onClick={() => setSelectedSheet(sheet)}>
                          Try Sample
                        </button>
                      ) : user ? (
                        <button
                          className={`card-action primary ${alreadyAdded ? "added" : ""}`}
                          onClick={() => handleAddRecommended(sheet)}
                          disabled={alreadyAdded}
                        >
                          {alreadyAdded ? "Added" : "Add to My Learning"}
                        </button>
                      ) : (
                        <button
                          className="card-action"
                          onClick={() =>
                            showLoginPrompt(
                              "로그인 후 더 많은 샘플을 사용할 수 있습니다",
                              "지금은 첫 번째 샘플만 체험할 수 있습니다. 로그인하면 나머지 자료를 추가할 수 있습니다."
                            )
                          }
                        >
                          Login to Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionBlock>

          <SectionBlock
            title="📂 Import Your Own Study Material"
            description="나만의 문장 자료를 엑셀 파일로 불러와서 공부해보세요. 형식은 sentence / translation 두 컬럼입니다."
            variant="import"
          >
            <div className="import-box">
              <button className="import-main-btn" onClick={handleImport}>
                Import Excel File
              </button>
              <div className="import-format-hint">
                Example columns: <strong>sentence</strong> | <strong>translation</strong>
              </div>
            </div>
          </SectionBlock>
        </main>
      )}


      {!loading && !authLoading && !error && selectedSheet && (
        <ReaderView
          sheet={rawSheetMap[selectedSheet.name] ?? selectedSheet}
          soundEnabled={soundEnabled}
          repeatCount={repeatCount}
          onExit={handleExitReader}
          voiceURI={selectedVoiceURI}
          isLoggedIn={!!user}
          onRequireLogin={() =>
            requireLogin(
              "로그인이 필요한 기능입니다",
              "즐겨찾기, 랜덤, 글자 크기 저장 같은 개인화 기능은 로그인 후 사용할 수 있습니다."
            )
          }
          userId={user?.uid}
          onStatsChanged={reloadUserData}
          chapterSettings={settingsMap[rawSheetMap[selectedSheet.name]?.name ?? selectedSheet.name]}
        />
      )}
    </div>
  );
}
