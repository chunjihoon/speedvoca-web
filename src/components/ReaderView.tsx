import { useEffect, useMemo, useState } from "react";
import type { SheetContent } from "../types/content";
import { speakText, stopSpeech } from "../lib/tts";
import {
    isFavorite,
    recordCompletedTap,
    recordNext,
    recordReplay,
    saveChapterSettings,
    toggleFavorite,
  } from "../lib/firestore";
  

type Props = {
  sheet: SheetContent;
  soundEnabled: boolean;
  repeatCount: number;
  onExit: () => void;
  voiceURI: string | null;
  isLoggedIn: boolean;
  onRequireLogin: () => Promise<boolean>;
  userId?: string;
  onStatsChanged?: () => Promise<void> | void;
  chapterSettings?: {
    randomEnabled?: boolean;
    fontScale?: number;
  };
  
};

export default function ReaderView({
    sheet,
    soundEnabled,
    repeatCount,
    onExit,
    voiceURI,
    isLoggedIn,
    onRequireLogin,
    userId,
    onStatsChanged,
    chapterSettings,
  }: Props) {

  const [currentIndex, setCurrentIndex] = useState(0);
  const [spokenCount, setSpokenCount] = useState(0);
  const [randomEnabled, setRandomEnabled] = useState(chapterSettings?.randomEnabled ?? false);
  const [fontScale, setFontScale] = useState(chapterSettings?.fontScale ?? 1);  
  const [favoriteActive, setFavoriteActive] = useState(false);

  const isFavoritesSheet = sheet.name === "Favorites";

  const displayRows = useMemo(() => {
    if (isFavoritesSheet || !randomEnabled) return sheet.rows;

    const copied = [...sheet.rows];
    for (let i = copied.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copied[i], copied[j]] = [copied[j], copied[i]];
    }
    return copied;
  }, [sheet.rows, randomEnabled, isFavoritesSheet]);

  const current = useMemo(() => displayRows[currentIndex], [displayRows, currentIndex]);

  useEffect(() => {
    setCurrentIndex(0);
    setSpokenCount(0);
  }, [sheet.name, randomEnabled]);

  useEffect(() => {
    async function loadFavoriteState() {
      if (!current) {
        setFavoriteActive(false);
        return;
      }

      if (isFavoritesSheet) {
        setFavoriteActive(true);
        return;
      }

      if (!isLoggedIn || !userId) {
        setFavoriteActive(false);
        return;
      }

      const exists = await isFavorite(userId, sheet.name, current.sentence);
      setFavoriteActive(exists);
    }

    loadFavoriteState();
  }, [isLoggedIn, userId, sheet.name, current?.sentence, current, isFavoritesSheet]);

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

  useEffect(() => {
    setRandomEnabled(chapterSettings?.randomEnabled ?? false);
    setFontScale(chapterSettings?.fontScale ?? 1);
  }, [sheet.name, chapterSettings?.randomEnabled, chapterSettings?.fontScale]);
  

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
  const statSheetName = isFavoritesSheet ? "Favorites" : sheet.name;
  const favoriteTargetSheetName = current.sourceSheetName || sheet.name;

  const replayOrNext = async () => {
    if (canAutoNext) {
      if (!isLast) {
        if (isLoggedIn && userId) {
          await Promise.all([
            recordNext(userId, statSheetName),
            recordCompletedTap(userId, statSheetName),
          ]);
          await onStatsChanged?.();
        }

        setCurrentIndex((prev) => prev + 1);
        setSpokenCount(0);
      }
      return;
    }

    if (isLoggedIn && userId) {
      await Promise.all([
        recordReplay(userId, statSheetName),
        recordCompletedTap(userId, statSheetName),
      ]);
      await onStatsChanged?.();
    }

    await speakText(current.sentence, soundEnabled, 1, voiceURI);
    setSpokenCount((prev) => Math.min(prev + 1, repeatCount));
  };

  const goPrev = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((prev) => prev - 1);
    setSpokenCount(0);
  };

  const forceNext = async () => {
    if (isLast) return;

    if (isLoggedIn && userId) {
      await Promise.all([
        recordNext(userId, statSheetName),
        recordCompletedTap(userId, statSheetName),
      ]);
      await onStatsChanged?.();
    }

    setCurrentIndex((prev) => prev + 1);
    setSpokenCount(0);
  };

  const handleFavorite = async () => {
    if (!isLoggedIn || !userId) {
      await onRequireLogin();
      return;
    }

    const result = await toggleFavorite({
      uid: userId,
      sheetName: favoriteTargetSheetName,
      sentence: current.sentence,
      translation: current.translation,
    });

    await onStatsChanged?.();

    if (isFavoritesSheet) {
      if (!result.active) {
        if (displayRows.length === 1) {
          onExit();
          return;
        }

        if (currentIndex >= displayRows.length - 1) {
          setCurrentIndex((prev) => Math.max(0, prev - 1));
        }
      }
      return;
    }

    setFavoriteActive(result.active);
  };

  const handleToggleRandom = async () => {
    if (isFavoritesSheet) return;
  
    if (!isLoggedIn || !userId) {
      await onRequireLogin();
      return;
    }
  
    const next = !randomEnabled;
    setRandomEnabled(next);
  
    await saveChapterSettings({
      uid: userId,
      sheetName: sheet.name,
      randomEnabled: next,
      fontScale,
    });
  
    await onStatsChanged?.();
  };
  

  const handleFontScale = async (delta: number) => {
    if (!isLoggedIn || !userId) {
        await onRequireLogin();
        return;
    }    

    const next = Math.max(0.7, Math.min(1.6, +(fontScale + delta).toFixed(2)));
    setFontScale(next);    

    await saveChapterSettings({
        uid: userId,
        sheetName: sheet.name,
        randomEnabled,
        fontScale: next,
    });    
    
    await onStatsChanged?.();
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
          <button className="control-btn" onClick={handleFavorite}>
            {favoriteActive ? "⭐ Favorited" : "☆ Favorite"}
          </button>
          <button className="control-btn" onClick={handleToggleRandom} disabled={isFavoritesSheet}>
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
