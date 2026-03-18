import { useEffect, useMemo, useState } from "react";
import type { SheetContent, TtsVoiceOption } from "../types/content";
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
  voices: TtsVoiceOption[];
  selectedVoiceURI: string | null;
  onChangeVoice: (voiceURI: string) => void;
  
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
    voices,
    selectedVoiceURI,
    onChangeVoice
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
      await speakText(current.sentence, soundEnabled, 1, voiceURI, sheet.language);
      if (!cancelled) {
        setSpokenCount((prev) => Math.min(prev + 1, repeatCount));
      }
    }

    run();

    return () => {
      cancelled = true;
      stopSpeech();
    };
  }, [currentIndex, current?.sentence, repeatCount, soundEnabled, voiceURI, sheet.language]);

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
    if (actionLocked) return;
    startActionCooldown();
  
    const sentenceToSpeak = current.sentence;
  
    if (canAutoNext) {
      if (isLast) return;
  
      // 화면 상태를 먼저 바꾼다
      setCurrentIndex((prev) => prev + 1);
      setSpokenCount(0);
  
      // 서버 저장은 뒤에서 비동기로 돌린다
      if (isLoggedIn && userId) {
        void Promise.all([
          recordNext(userId, statSheetName),
          recordCompletedTap(userId, statSheetName),
        ]).then(() => {
          void onStatsChanged?.();
        });
      }
  
      return;
    }
  
    // replay도 먼저 현재 문장을 다시 재생
    await speakText(sentenceToSpeak, soundEnabled, 1, voiceURI, sheet.language);
    setSpokenCount((prev) => Math.min(prev + 1, repeatCount));
  
    // 서버 저장은 뒤에서 비동기로
    if (isLoggedIn && userId) {
      void Promise.all([
        recordReplay(userId, statSheetName),
        recordCompletedTap(userId, statSheetName),
      ]).then(() => {
        void onStatsChanged?.();
      });
    }
  };

  const goPrev = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((prev) => prev - 1);
    setSpokenCount(0);
  };

  const forceNext = async () => {
    if (actionLocked) return;
    startActionCooldown();

    if (isLast) return;
  
    setCurrentIndex((prev) => prev + 1);
    setSpokenCount(0);
  
    if (isLoggedIn && userId) {
      void Promise.all([
        recordNext(userId, statSheetName),
        recordCompletedTap(userId, statSheetName),
      ]).then(() => {
        void onStatsChanged?.();
      });
    }
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
  
  const ACTION_COOLDOWN_MS = 2000;
  const [actionLocked, setActionLocked] = useState(false);
  const [cooldownProgress, setCooldownProgress] = useState(0);

  const startActionCooldown = () => {
    setActionLocked(true);
    setCooldownProgress(100);
  
    const startedAt = Date.now();
  
    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remainingRatio = Math.max(0, 1 - elapsed / ACTION_COOLDOWN_MS);
      setCooldownProgress(remainingRatio * 100);
    }, 50);
  
    window.setTimeout(() => {
      window.clearInterval(intervalId);
      setCooldownProgress(0);
      setActionLocked(false);
    }, ACTION_COOLDOWN_MS);
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
          <select
            className="control-btn"
            value={selectedVoiceURI ?? ""}
            onChange={(e) => onChangeVoice(e.target.value)}
          >
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name}
              </option>
            ))}
          </select>
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
          <button
            className={`speak-btn ${actionLocked ? "cooldown" : ""}`}
            onClick={replayOrNext}
            disabled={actionLocked}
          >
            <span className="speak-btn-label">
              {actionLocked
                ? "Please wait..."
                : canAutoNext
                ? "Next"
                : "🔊 Replay"}
            </span>
            {actionLocked && (
              <span
                className="speak-btn-cooldown-bar"
                style={{ width: `${cooldownProgress}%` }}
              />
            )}
          </button>
          <div className="repeat-counter">
            {spokenCount} / {repeatCount}
          </div>
        </div>

        <div className="nav-row">
          <button className="secondary-btn" onClick={goPrev} disabled={currentIndex === 0}>
            Prior
          </button>
          <button
            className={`secondary-btn ${actionLocked ? "cooldown" : ""}`}
            onClick={forceNext}
            disabled={isLast || actionLocked}
          >
            {actionLocked ? "Cooling down..." : "Force Next"}
          </button>
        </div>

        <button className="primary-btn exit-btn" onClick={onExit}>
          Exit
        </button>
      </section>
    </main>
  );
}
