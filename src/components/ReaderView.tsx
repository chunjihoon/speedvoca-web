import { useEffect, useMemo, useState } from "react";
import type { SheetContent } from "../types/content";
import { speakText, stopSpeech } from "../lib/tts";

type Props = {
  sheet: SheetContent;
  soundEnabled: boolean;
  repeatCount: number;
  onExit: () => void;
  voiceURI: string | null;
  isLoggedIn: boolean;
  onRequireLogin: () => Promise<boolean>;
};

export default function ReaderView({
  sheet,
  soundEnabled,
  repeatCount,
  onExit,
  voiceURI,
  isLoggedIn,
  onRequireLogin,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spokenCount, setSpokenCount] = useState(0);
  const [randomEnabled, setRandomEnabled] = useState(false);
  const [fontScale, setFontScale] = useState(1);

  const displayRows = useMemo(() => {
    if (!randomEnabled) return sheet.rows;

    const copied = [...sheet.rows];
    for (let i = copied.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copied[i], copied[j]] = [copied[j], copied[i]];
    }
    return copied;
  }, [sheet.rows, randomEnabled]);

  const current = useMemo(() => displayRows[currentIndex], [displayRows, currentIndex]);

  useEffect(() => {
    setCurrentIndex(0);
    setSpokenCount(0);
  }, [sheet.name, randomEnabled]);

  useEffect(() => {
    if (!current) return;
    if (!soundEnabled) {
      stopSpeech();
      return;
    }

    let cancelled = false;

    async function run() {
      await speakText(current.sentence, soundEnabled, 1, voiceURI);
      if (!cancelled) {
        setSpokenCount((prev) => Math.min(prev + 1, repeatCount));
      }
    }

    run();

    return () => {
      cancelled = true;
      stopSpeech();
    };
  }, [currentIndex, current?.sentence, repeatCount, soundEnabled, voiceURI]);

  if (!current) {
    return (
      <main className="page">
        <section className="reader-wrap">
          <h2>{sheet.name}</h2>
          <p>학습할 문장이 없습니다.</p>
          <button className="primary-btn" onClick={onExit}>
            Exit
          </button>
        </section>
      </main>
    );
  }

  const isLast = currentIndex === displayRows.length - 1;
  const canAutoNext = spokenCount >= repeatCount;

  const replayOrNext = async () => {
    if (canAutoNext) {
      if (!isLast) {
        setCurrentIndex((prev) => prev + 1);
        setSpokenCount(0);
      }
      return;
    }

    await speakText(current.sentence, soundEnabled, 1, voiceURI);
    setSpokenCount((prev) => Math.min(prev + 1, repeatCount));
  };

  const goPrev = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((prev) => prev - 1);
    setSpokenCount(0);
  };

  const forceNext = () => {
    if (isLast) return;
    setCurrentIndex((prev) => prev + 1);
    setSpokenCount(0);
  };

  const handleFavorite = async () => {
    if (!isLoggedIn) {
      await onRequireLogin();
      return;
    }
    alert("다음 단계에서 즐겨찾기 저장을 붙입니다.");
  };

  const handleToggleRandom = async () => {
    if (!isLoggedIn) {
      await onRequireLogin();
      return;
    }
    setRandomEnabled((prev) => !prev);
  };

  const handleFontScale = async (delta: number) => {
    if (!isLoggedIn) {
      await onRequireLogin();
      return;
    }
    setFontScale((prev) => Math.max(0.7, Math.min(1.6, +(prev + delta).toFixed(2))));
  };

  return (
    <main className="page">
      <section className="reader-wrap">
        <div className="progress">
          <div className="sheet-name">{sheet.name}</div>
          <div className="progress-count">
            {currentIndex + 1} / {displayRows.length}
          </div>
        </div>

        <div className="reader-toolbar">
          <button className="control-btn" onClick={handleFavorite}>⭐ Favorite</button>
          <button className="control-btn" onClick={handleToggleRandom}>
            {randomEnabled ? "🔀 Random On" : "➡️ Random Off"}
          </button>
          <button className="control-btn" onClick={() => handleFontScale(-0.1)}>-A</button>
          <button className="control-btn" onClick={() => handleFontScale(0.1)}>+A</button>
        </div>

        <div className="sentence-box">
          <div
            className="sentence"
            style={{ fontSize: `calc(clamp(28px, 5vw, 48px) * ${fontScale})` }}
          >
            {current.sentence}
          </div>
        </div>

        <div className="translation-box">
          <div
            className="translation"
            style={{ fontSize: `calc(clamp(16px, 2.6vw, 22px) * ${fontScale})` }}
          >
            {current.translation}
          </div>
        </div>

        <div className="speak-wrap">
          <button className="speak-btn" onClick={replayOrNext}>
            {canAutoNext ? "Next" : "🔊 Replay"}
          </button>
          <div className="repeat-counter">
            {spokenCount} / {repeatCount}
          </div>
        </div>

        <div className="nav-row">
          <button className="secondary-btn" onClick={goPrev} disabled={currentIndex === 0}>
            Prior
          </button>
          <button className="secondary-btn" onClick={forceNext} disabled={isLast}>
            Force Next
          </button>
        </div>

        <button className="primary-btn exit-btn" onClick={onExit}>
          Exit
        </button>
      </section>
    </main>
  );
}
