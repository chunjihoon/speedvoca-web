import { useEffect, useMemo, useState } from "react";
import type { SheetContent, TtsVoiceOption } from "./types/content";
import { loadWorkbook } from "./lib/workbook";
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
import { loadUserChapterMeta, saveChapterTitle } from "./lib/firestore";

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

  useEffect(() => {
    async function loadMeta() {
      if (!user) {
        setTitleMap({});
        return;
      }

      const meta = await loadUserChapterMeta(user.uid);
      const mapped: Record<string, string> = {};
      Object.entries(meta).forEach(([sheetName, value]) => {
        if (value.customTitle?.trim()) {
          mapped[sheetName] = value.customTitle.trim();
        }
      });
      setTitleMap(mapped);
    }

    loadMeta();
  }, [user]);

  const visibleSheets = useMemo(() => {
    const base = user ? sheets : sheets.slice(0, 1);

    return base.map((sheet) => ({
      ...sheet,
      name: titleMap[sheet.name] || sheet.name,
    }));
  }, [sheets, titleMap, user]);

  const rawSheetMap = useMemo(() => {
    return Object.fromEntries(sheets.map((sheet) => [sheet.name, sheet]));
  }, [sheets]);

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

    alert("다음 단계에서 업로드(import) 기능을 붙입니다.");
  };

  const handleEditTitle = async (sheet: SheetContent) => {
    if (!user) {
      await loginWithGoogle();
      return;
    }

    const originalSheet = rawSheetMap[sheet.name] ?? sheets.find((s) => s.name === sheet.name);
    const sourceSheetName = originalSheet?.name ?? sheet.name;
    const currentTitle = titleMap[sourceSheetName] || sourceSheetName;
    const nextTitle = window.prompt("새 챕터 제목을 입력하세요.", currentTitle);

    if (!nextTitle) return;

    await saveChapterTitle(user.uid, sourceSheetName, nextTitle.trim());
    setTitleMap((prev) => ({
      ...prev,
      [sourceSheetName]: nextTitle.trim(),
    }));
  };

  const handleLogin = async () => {
    await loginWithGoogle();
  };

  const handleLogout = async () => {
    stopSpeech();
    await logout();
    setSelectedSheet(null);
  };

  return (
    <div className="app-shell">
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

          <SheetList
            sheets={visibleSheets}
            onSelect={setSelectedSheet}
            onEditTitle={handleEditTitle}
            isLoggedIn={!!user}
          />
        </>
      )}

      {!loading && !authLoading && !error && selectedSheet && (
        <ReaderView
          sheet={selectedSheet}
          soundEnabled={soundEnabled}
          repeatCount={repeatCount}
          onExit={handleExitReader}
          voiceURI={selectedVoiceURI}
          isLoggedIn={!!user}
          onRequireLogin={requireLogin}
        />
      )}
    </div>
  );
}
