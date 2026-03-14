import { useEffect, useState } from "react";
import type { SheetContent } from "./types/content";
import { loadWorkbook } from "./lib/workbook";
import TopBar from "./components/TopBar";
import SheetList from "./components/SheetList";
import ReaderView from "./components/ReaderView";
import {
  getRepeatCount,
  getSoundEnabled,
  setRepeatCount,
  setSoundEnabled,
} from "./lib/storage";
import { stopSpeech } from "./lib/tts";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sheets, setSheets] = useState<SheetContent[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<SheetContent | null>(null);
  const [soundEnabled, setSoundEnabledState] = useState(getSoundEnabled());
  const [repeatCount, setRepeatCountState] = useState(getRepeatCount());

  useEffect(() => {
    async function init() {
      try {
        const data = await loadWorkbook();
        setSheets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

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

  return (
    <div className="app-shell">
      <TopBar
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        repeatCount={repeatCount}
        onChangeRepeatCount={handleChangeRepeatCount}
        onBackToList={handleExitReader}
        inReader={!!selectedSheet}
      />

      {loading && <div className="status">엑셀 파일 로딩 중...</div>}

      {!loading && error && <div className="status error">{error}</div>}

      {!loading && !error && !selectedSheet && (
        <SheetList sheets={sheets} onSelect={setSelectedSheet} />
      )}

      {!loading && !error && selectedSheet && (
        <ReaderView
          sheet={selectedSheet}
          soundEnabled={soundEnabled}
          repeatCount={repeatCount}
          onExit={handleExitReader}
        />
      )}
    </div>
  );
}
