import { useEffect, useMemo, useState } from "react";
import type { SheetContent } from "../types/content";
import { speakText, stopSpeech } from "../lib/tts";

type Props = {
  sheet: SheetContent;
  soundEnabled: boolean;
  repeatCount: number;
  onExit: () => void;
  voiceURI: string | null;
};

export default function ReaderView({
  sheet,
  soundEnabled,
  repeatCount,
  onExit,
  voiceURI,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spokenCount, setSpokenCount] = useState(0);

  const current = useMemo(() => sheet.rows[currentIndex], [sheet.rows, currentIndex]);

  useEffect(() => {
    setCurrentIndex(0);
    setSpokenCount(0);
  }, [sheet.name]);

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

  const isLast = currentIndex === sheet.rows.length - 1;
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

  return (
    <main className="page">
      <section className="reader-wrap">
        <div className="progress">
          <div className="sheet-name">{sheet.name}</div>
          <div className="progress-count">
            {currentIndex + 1} / {sheet.rows.length}
          </div>
        </div>

        <div className="sentence-box">
          <div className="sentence">{current.sentence}</div>
        </div>

        <div className="translation-box">
          <div className="translation">{current.translation}</div>
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
