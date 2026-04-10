import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { LanguageCode, SheetContent, TtsVoiceOption } from "../types/content";
import { speakText, stopSpeech } from "../lib/tts";
import goNextImage from "../assets/goNext.png";
import goPriorImage from "../assets/goPrior.png";
import forceNextImage from "../assets/forceNext.png";
import replayImage from "../assets/replay.png";
import shuffleOnImage from "../assets/shuffleOn.png";
import shuffleOffImage from "../assets/shuffleOff.png";
import shareImage from "../assets/share.png";
import { FAVORITES_SHEET_NAME, type AppUiText } from "../constants/i18n";

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
  sheetSessionKey?: string;
  soundEnabled: boolean;
  repeatCount: number;
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
  exitConfirmOpen: boolean;
  onRequestExit: () => void;
  onConfirmExit: () => void;
  onCancelExit: () => void;
  translationLanguage?: LanguageCode | null;
  translationOptions?: LanguageCode[];
  onChangeTranslationLanguage?: (lang: LanguageCode) => void;
  onGuestStatsDelta?: (updates: {
    totalCompletedSentenceCount?: number;
    totalNextCount?: number;
    totalReplayCount?: number;
  }) => void;
  onShare: () => void;
  ui: AppUiText;
};

function getTargetLanguageCode(sheetLanguage: string): LanguageCode {
  if (sheetLanguage.startsWith("en")) return "en";
  if (sheetLanguage.startsWith("zh") || sheetLanguage.startsWith("cmn")) return "zh";
  if (sheetLanguage.startsWith("fr")) return "fr";
  if (sheetLanguage.startsWith("ja")) return "ja";
  return "ko";
}

function getLanguageFlag(lang: LanguageCode): string {
  switch (lang) {
    case "en":
      return "🇺🇸";
    case "zh":
      return "🇨🇳";
    case "fr":
      return "🇫🇷";
    case "ja":
      return "🇯🇵";
    case "ko":
      return "🇰🇷";
    default:
      return "🏳️";
  }
}

function getLanguageLabel(lang: LanguageCode, ui: AppUiText): string {
  switch (lang) {
    case "en":
      return ui.reader.languageName.en;
    case "zh":
      return ui.reader.languageName.zh;
    case "fr":
      return ui.reader.languageName.fr;
    case "ja":
      return ui.reader.languageName.ja;
    case "ko":
      return ui.reader.languageName.ko;
    default:
      return lang;
  }
}

export default function ReaderView({
  sheet,
  sheetSessionKey,
  soundEnabled,
  repeatCount,
  voiceURI,
  isLoggedIn,
  onRequireLogin,
  userId,
  onStatsChanged,
  chapterSettings,
  voices,
  selectedVoiceURI,
  onChangeVoice,
  exitConfirmOpen,
  onRequestExit,
  onConfirmExit,
  onCancelExit,
  translationLanguage,
  translationOptions,
  onChangeTranslationLanguage,
  onGuestStatsDelta,
  onShare,
  ui,
}: Props) {
  const activeSheetSessionKey = sheetSessionKey ?? sheet.name;
  const initialSpokenCount = Math.min(1, Math.max(repeatCount, 1));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spokenCount, setSpokenCount] = useState(initialSpokenCount);
  const [randomEnabled, setRandomEnabled] = useState(chapterSettings?.randomEnabled ?? false);
  const [fontScale, setFontScale] = useState(chapterSettings?.fontScale ?? 1);
  const [favoriteActive, setFavoriteActive] = useState(false);

  const isFavoritesSheet = sheet.name === FAVORITES_SHEET_NAME;
  const targetLanguageCode = useMemo(() => getTargetLanguageCode(sheet.language), [sheet.language]);

  const visibleTranslationOptions = useMemo(() => {
    if (!translationOptions || translationOptions.length === 0) return [];
    return translationOptions.filter((lang) => lang !== targetLanguageCode);
  }, [translationOptions, targetLanguageCode]);

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
  const pendingTranslationPinnedSentenceRef = useRef<string | null>(null);
  const initialEntrySpokenSheetRef = useRef<string | null>(null);

  useEffect(() => {
    setCurrentIndex(0);
    setSpokenCount(initialSpokenCount);
  }, [activeSheetSessionKey, randomEnabled, initialSpokenCount]);

  useEffect(() => {
    const pinnedSentence = pendingTranslationPinnedSentenceRef.current;
    if (!pinnedSentence || displayRows.length === 0) return;

    const matchedIndex = displayRows.findIndex((row) => row.sentence === pinnedSentence);
    pendingTranslationPinnedSentenceRef.current = null;
    if (matchedIndex === -1 || matchedIndex === currentIndex) return;

    setCurrentIndex(matchedIndex);
  }, [displayRows, currentIndex]);

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

    void loadFavoriteState();
  }, [isLoggedIn, userId, sheet.name, current?.sentence, current, isFavoritesSheet]);

  useEffect(() => {
    if (!current) return;
    if (initialEntrySpokenSheetRef.current === activeSheetSessionKey) return;
    initialEntrySpokenSheetRef.current = activeSheetSessionKey;
    if (!soundEnabled) return;

    void speakText(current.sentence, true, 1, voiceURI, sheet.language).catch(() => {
      // Initial auto playback should fail silently.
    });
  }, [activeSheetSessionKey, current, soundEnabled, voiceURI, sheet.language]);

  useEffect(() => {
    setRandomEnabled(chapterSettings?.randomEnabled ?? false);
    setFontScale(chapterSettings?.fontScale ?? 1);
  }, [activeSheetSessionKey, chapterSettings?.randomEnabled, chapterSettings?.fontScale]);

  const ACTION_COOLDOWN_MS = 2000;
  const [actionLocked, setActionLocked] = useState(false);
  const [cooldownToken, setCooldownToken] = useState(0);
  const cooldownTimeoutRef = useRef<number | null>(null);

  const startActionCooldown = () => {
    if (actionLocked) return;

    setActionLocked(true);
    setCooldownToken((prev) => prev + 1);

    if (cooldownTimeoutRef.current) {
      window.clearTimeout(cooldownTimeoutRef.current);
    }

    cooldownTimeoutRef.current = window.setTimeout(() => {
      setActionLocked(false);
      cooldownTimeoutRef.current = null;
    }, ACTION_COOLDOWN_MS);
  };

  useEffect(() => {
    return () => {
      if (cooldownTimeoutRef.current) {
        window.clearTimeout(cooldownTimeoutRef.current);
      }
    };
  }, []);

  if (!current) {
    return (
      <main className="page reader-page">
        <section className="reader-wrap reader-layout">
          <div className="reader-scroll-content">
            <div className="reader-header-bar">
              <button className="control-btn reader-back-btn" onClick={onRequestExit}>
                ←
              </button>
              <div className="reader-header-title">{sheet.name}</div>
              <div className="reader-header-progress">0 / 0</div>
            </div>

            <div className="sentence-box reader-sentence-box">
              <div className="sentence-box-body">
                <div className="sentence">{ui.reader.emptySentence}</div>
              </div>
            </div>
          </div>
        </section>

        {exitConfirmOpen && (
          <div className="confirm-overlay" onClick={onCancelExit}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
              <h3>{ui.reader.exitTitle}</h3>
              <p>{ui.reader.exitDescription}</p>
              <div className="confirm-actions">
                <button className="secondary-btn" onClick={onCancelExit}>
                  {ui.common.cancel}
                </button>
                <button className="primary-btn" onClick={onConfirmExit}>
                  {ui.common.exit}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  const isLast = currentIndex === displayRows.length - 1;
  const isReadyForNext = spokenCount >= repeatCount;
  const shuffleImage = randomEnabled ? shuffleOnImage : shuffleOffImage;
  const replayActionImage = isReadyForNext ? goNextImage : replayImage;
  const replayActionLabel = isReadyForNext ? ui.reader.goNextAria : ui.reader.replayAria;
  const statSheetName = isFavoritesSheet ? FAVORITES_SHEET_NAME : sheet.name;
  const favoriteTargetSheetName = current.sourceSheetName || sheet.name;
  const playSentenceIfEnabled = (sentence: string) => {
    if (!soundEnabled) return;
    window.requestAnimationFrame(() => {
      void speakText(sentence, true, 1, voiceURI, sheet.language).catch(() => {
        // User action should not fail the flow when playback fails.
      });
    });
  };

  const goPrev = () => {
    if (actionLocked || currentIndex === 0) return;
    startActionCooldown();
    stopSpeech();
    const prevIndex = currentIndex - 1;
    const prevRow = displayRows[prevIndex];

    setCurrentIndex(prevIndex);
    setSpokenCount(initialSpokenCount);
    if (prevRow) {
      playSentenceIfEnabled(prevRow.sentence);
    }
  };

  const goNext = async () => {
    if (actionLocked) return;
    startActionCooldown();
    stopSpeech();

    if (isLast) return;

    const nextIndex = currentIndex + 1;
    const nextRow = displayRows[nextIndex];

    setCurrentIndex(nextIndex);
    setSpokenCount(initialSpokenCount);
    if (nextRow) {
      playSentenceIfEnabled(nextRow.sentence);
    }

    if (isLoggedIn && userId) {
      void Promise.all([
        recordNext(userId, statSheetName),
        recordCompletedTap(userId, statSheetName),
      ]).then(() => {
        void onStatsChanged?.();
      });
    } else {
      onGuestStatsDelta?.({
        totalNextCount: 1,
        totalCompletedSentenceCount: 1,
      });
    }
  };

  const handleReplayAction = async () => {
    if (isReadyForNext) {
      await goNext();
      return;
    }

    if (actionLocked) return;
    startActionCooldown();

    flushSync(() => {
      setSpokenCount((prev) => Math.min(prev + 1, repeatCount));
    });

    if (soundEnabled) {
      window.requestAnimationFrame(() => {
        void speakText(current.sentence, true, 1, voiceURI, sheet.language).catch(() => {
          // Keep count progression based on user taps even if playback fails.
        });
      });
    }

    if (isLoggedIn && userId) {
      void Promise.all([
        recordReplay(userId, statSheetName),
        recordCompletedTap(userId, statSheetName),
      ]).then(() => {
        void onStatsChanged?.();
      });
    } else {
      onGuestStatsDelta?.({
        totalReplayCount: 1,
        totalCompletedSentenceCount: 1,
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
          onRequestExit();
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
    stopSpeech();

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

  const handleTranslationLanguageClick = (lang: LanguageCode) => {
    pendingTranslationPinnedSentenceRef.current = current.sentence;
    stopSpeech();
    onChangeTranslationLanguage?.(lang);
  };

  return (
    <main className="page reader-page">
      <section className="reader-wrap reader-layout">
        <div className="reader-scroll-content">
          <div className="reader-header-bar">
            <button
              className="control-btn reader-back-btn"
              onClick={onRequestExit}
              aria-label={ui.reader.backAria}
              type="button"
            >
              ←
            </button>

            <div className="reader-header-title">
              {isFavoritesSheet ? ui.common.favoritesLabel : sheet.name}
            </div>

            <div className="reader-header-progress">
              {currentIndex + 1} / {displayRows.length}
            </div>
          </div>

          <div className="sentence-box reader-sentence-box">
            <div className="sentence-box-top">
              <div className="sentence-controls-left">
                <button
                  className="control-btn reader-random-toggle-btn"
                  onClick={handleToggleRandom}
                  disabled={isFavoritesSheet}
                  type="button"
                >
                  <img src={shuffleImage} alt="" className="reader-random-toggle-icon" />
                  {randomEnabled ? ui.reader.randomOn : ui.reader.randomOff}
                </button>

                <select
                  className="control-btn reader-inline-select"
                  value={selectedVoiceURI ?? ""}
                  onChange={(e) => onChangeVoice(e.target.value)}
                >
                  {voices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name}
                    </option>
                  ))}
                </select>

                <button
                  className="control-btn reader-inline-share"
                  onClick={onShare}
                  type="button"
                  aria-label={ui.settings.shareAria}
                >
                  <img src={shareImage} alt="" className="reader-inline-share-icon" />
                </button>
              </div>

              <button
                className={`favorite-star-btn reader-inline-favorite ${favoriteActive ? "active" : ""}`}
                onClick={handleFavorite}
                aria-label={ui.reader.favoriteAria}
                type="button"
              >
                {favoriteActive ? "★" : "☆"}
              </button>
            </div>

            <div className="sentence-box-body">
              <div
                className="sentence"
                style={{ fontSize: `calc(clamp(28px, 5vw, 48px) * ${fontScale})` }}
              >
                {current.sentence}
              </div>
              <div className="reader-font-scale-controls">
                <button
                  className="control-btn"
                  onClick={() => handleFontScale(-0.1)}
                  type="button"
                >
                  -A
                </button>

                <button
                  className="control-btn"
                  onClick={() => handleFontScale(0.1)}
                  type="button"
                >
                  +A
                </button>
              </div>
            </div>
          </div>

          <div className="translation-box reader-translation-box">
            {translationLanguage &&
            onChangeTranslationLanguage &&
            visibleTranslationOptions.length > 0 ? (
              <div className="translation-language-flags">
                {visibleTranslationOptions.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    className={`language-flag-btn ${
                      translationLanguage === lang ? "active" : ""
                    }`}
                    onClick={() => handleTranslationLanguageClick(lang)}
                    aria-label={getLanguageLabel(lang, ui)}
                    title={getLanguageLabel(lang, ui)}
                  >
                    <span className="language-flag-emoji">{getLanguageFlag(lang)}</span>
                  </button>
                ))}
              </div>
            ) : null}

            <div
              className="translation"
              style={{ fontSize: `calc(clamp(16px, 2.6vw, 22px) * ${fontScale})` }}
            >
              {current.translation}
            </div>
          </div>
        </div>

        <div className="reader-bottom-dock">
          <div className="reader-bottom-actions">
            <button
              className={`icon-action-btn ${actionLocked ? "cooldown" : ""}`}
              onClick={goPrev}
              disabled={currentIndex === 0 || actionLocked}
              aria-label={ui.reader.goPriorAria}
              type="button"
            >
              <img src={goPriorImage} alt="" className="icon-action-image" />
              {actionLocked && (
                <span
                  key={`prior-${cooldownToken}`}
                  className="icon-action-cooldown-bar"
                  style={{ animationDuration: `${ACTION_COOLDOWN_MS}ms` }}
                />
              )}
            </button>

            <button
              className={`icon-action-btn main-action-btn ${actionLocked ? "cooldown" : ""}`}
              onClick={handleReplayAction}
              disabled={actionLocked || (isReadyForNext && isLast)}
              aria-label={replayActionLabel}
              type="button"
            >
              <span className="replay-action-stack">
                <img
                  src={replayActionImage}
                  alt=""
                  className={`icon-action-image ${isReadyForNext ? "go-next-ready" : ""}`}
                />
                <span className="replay-action-count-inline">
                  {spokenCount} / {repeatCount}
                </span>
              </span>
              {actionLocked && (
                <span
                  key={`replay-${cooldownToken}`}
                  className="icon-action-cooldown-bar"
                  style={{ animationDuration: `${ACTION_COOLDOWN_MS}ms` }}
                />
              )}
            </button>

            <button
              className={`icon-action-btn ${actionLocked ? "cooldown" : ""}`}
              onClick={goNext}
              disabled={isLast || actionLocked}
              aria-label={ui.reader.forceNextAria}
              type="button"
            >
              <img src={forceNextImage} alt="" className="icon-action-image" />
              {actionLocked && (
                <span
                  key={`force-next-${cooldownToken}`}
                  className="icon-action-cooldown-bar"
                  style={{ animationDuration: `${ACTION_COOLDOWN_MS}ms` }}
                />
              )}
            </button>
          </div>
        </div>
      </section>

      {exitConfirmOpen && (
        <div className="confirm-overlay" onClick={onCancelExit}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{ui.reader.exitTitle}</h3>
            <p>{ui.reader.exitDescription}</p>
            <div className="confirm-actions">
              <button className="secondary-btn" onClick={onCancelExit}>
                {ui.common.cancel}
              </button>
              <button className="primary-btn" onClick={onConfirmExit}>
                {ui.common.exit}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
