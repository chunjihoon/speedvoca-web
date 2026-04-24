import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { ChapterLanguage, LanguageCode, SheetContent, TtsVoiceOption } from "../types/content";
import { speakText, stopSpeech } from "../lib/tts";
import { trackEvent } from "../lib/analytics";
import goNextImage from "../assets/goNext.png";
import goPriorImage from "../assets/goPrior.png";
import forceNextImage from "../assets/forceNext.png";
import replayImage from "../assets/replay.png";
import shuffleOnImage from "../assets/shuffleOn.png";
import shuffleOffImage from "../assets/shuffleOff.png";
import shareImage from "../assets/share.png";
import guideImage from "../assets/guide.png";
import settingIcon from "../assets/setting.png";
import { FAVORITES_SHEET_NAME, type AppUiText } from "../constants/i18n";

import {
  isFavoriteByLanguage,
  loadReaderGuideSeen,
  recordCompletedTap,
  recordNext,
  recordReplay,
  saveReaderGuideSeen,
  saveChapterSettings,
  toggleFavorite,
} from "../lib/firestore";

type Props = {
  sheet: SheetContent;
  sheetSessionKey?: string;
  soundEnabled: boolean;
  repeatCount: number;
  voiceURI: string | null;
  voiceMap: Record<ChapterLanguage, string | null>;
  isLoggedIn: boolean;
  onRequireLogin: (triggerFeature?: string) => Promise<boolean>;
  readerSessionId: string;
  sheetId: string;
  sheetType: "recommended" | "my" | "favorite" | "imported" | "sample";
  userId?: string;
  onStatsChanged?: () => Promise<void> | void;
  chapterSettings?: {
    randomEnabled?: boolean;
    fontScale?: number;
  };
  voices: TtsVoiceOption[];
  selectedVoiceURI: string | null;
  onChangeVoice: (voiceURI: string, languageOverride?: ChapterLanguage) => void;
  exitConfirmOpen: boolean;
  onRequestExit: () => void;
  onConfirmExit: () => void;
  onCancelExit: () => void;
  onGuideHighlightSettingsChange?: (active: boolean) => void;
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

function getRowStableKey(row: SheetContent["rows"][number]) {
  return [
    row.sourceSheetName ?? "",
    row.sourceLanguage ?? "",
    row.sentence,
    row.translation,
  ].join("::");
}

export default function ReaderView({
  sheet,
  sheetSessionKey,
  soundEnabled,
  repeatCount,
  voiceURI,
  voiceMap,
  isLoggedIn,
  onRequireLogin,
  readerSessionId,
  sheetId,
  sheetType,
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
  onGuideHighlightSettingsChange,
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
  const [lastSentenceConfirmOpen, setLastSentenceConfirmOpen] = useState(false);
  const [favoriteRemoveConfirmOpen, setFavoriteRemoveConfirmOpen] = useState(false);
  const [randomEnabled, setRandomEnabled] = useState(chapterSettings?.randomEnabled ?? false);
  const [fontScale, setFontScale] = useState(chapterSettings?.fontScale ?? 1);
  const [favoriteActive, setFavoriteActive] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const sessionStartedAtRef = useRef<number>(Date.now());
  const sessionCountsRef = useRef({
    replay: 0,
    next: 0,
    prior: 0,
    forceNext: 0,
    translationChange: 0,
    randomToggle: 0,
    favoriteToggle: 0,
    fontScaleChange: 0,
  });

  const isFavoritesSheet = sheet.name === FAVORITES_SHEET_NAME;
  const targetLanguageCode = useMemo(() => getTargetLanguageCode(sheet.language), [sheet.language]);

  const visibleTranslationOptions = useMemo(() => {
    if (!translationOptions || translationOptions.length === 0) return [];
    return translationOptions.filter((lang) => lang !== targetLanguageCode);
  }, [translationOptions, targetLanguageCode]);

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
  const pendingTranslationPinnedSentenceRef = useRef<string | null>(null);
  const pendingRowPinnedKeyRef = useRef<string | null>(null);
  const initialEntrySpokenSheetRef = useRef<string | null>(null);
  const trackReaderEvent = (
    name: string,
    params?: Record<string, string | number | boolean | null | undefined>
  ) => {
    trackEvent(name, {
      is_logged_in: isLoggedIn,
      reader_session_id: readerSessionId,
      sheet_name: sheet.name,
      sheet_id: sheetId,
      sheet_type: sheetType,
      language: sheet.language,
      sheet_session_key: activeSheetSessionKey,
      current_index: currentIndex,
      total_rows: displayRows.length,
      random_enabled: randomEnabled,
      repeat_count: repeatCount,
      ...params,
    });
  };

  useEffect(() => {
    setCurrentIndex(0);
    setSpokenCount(initialSpokenCount);
    sessionStartedAtRef.current = Date.now();
    sessionCountsRef.current = {
      replay: 0,
      next: 0,
      prior: 0,
      forceNext: 0,
      translationChange: 0,
      randomToggle: 0,
      favoriteToggle: 0,
      fontScaleChange: 0,
    };
  }, [activeSheetSessionKey, randomEnabled, initialSpokenCount]);

  useEffect(() => {
    return () => {
      const elapsedSec = Math.max(1, Math.round((Date.now() - sessionStartedAtRef.current) / 1000));
      trackEvent("reader_session_summary", {
        is_logged_in: isLoggedIn,
        sheet_name: sheet.name,
        sheet_session_key: activeSheetSessionKey,
        total_rows: displayRows.length,
        duration_sec: elapsedSec,
        replay_count: sessionCountsRef.current.replay,
        next_count: sessionCountsRef.current.next,
        prior_count: sessionCountsRef.current.prior,
        force_next_count: sessionCountsRef.current.forceNext,
        translation_change_count: sessionCountsRef.current.translationChange,
        random_toggle_count: sessionCountsRef.current.randomToggle,
        favorite_toggle_count: sessionCountsRef.current.favoriteToggle,
        font_scale_change_count: sessionCountsRef.current.fontScaleChange,
      });
    };
  }, [activeSheetSessionKey, isLoggedIn, sheet.name, displayRows.length]);

  useEffect(() => {
    const pinnedSentence = pendingTranslationPinnedSentenceRef.current;
    if (!pinnedSentence || displayRows.length === 0) return;

    const matchedIndex = displayRows.findIndex((row) => row.sentence === pinnedSentence);
    pendingTranslationPinnedSentenceRef.current = null;
    if (matchedIndex === -1 || matchedIndex === currentIndex) return;

    setCurrentIndex(matchedIndex);
  }, [displayRows, currentIndex]);

  useEffect(() => {
    const pinnedRowKey = pendingRowPinnedKeyRef.current;
    if (!pinnedRowKey || displayRows.length === 0) return;

    const matchedIndex = displayRows.findIndex((row) => getRowStableKey(row) === pinnedRowKey);
    pendingRowPinnedKeyRef.current = null;

    if (matchedIndex >= 0) {
      setCurrentIndex(matchedIndex);
      setSpokenCount(initialSpokenCount);
      return;
    }

    setCurrentIndex((prev) => Math.min(prev, displayRows.length - 1));
    setSpokenCount(initialSpokenCount);
  }, [displayRows, initialSpokenCount]);

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

      const exists = await isFavoriteByLanguage(
        userId,
        sheet.name,
        current.sourceLanguage ?? sheet.language,
        current.sentence
      );
      setFavoriteActive(exists);
    }

    void loadFavoriteState();
  }, [isLoggedIn, userId, sheet.name, current?.sentence, current, isFavoritesSheet, sheet.language]);

  useEffect(() => {
    if (!current) return;
    if (initialEntrySpokenSheetRef.current === activeSheetSessionKey) return;
    initialEntrySpokenSheetRef.current = activeSheetSessionKey;
    if (!soundEnabled) return;

    const currentLanguage = current.sourceLanguage ?? sheet.language;
    const currentVoice = isFavoritesSheet ? voiceMap[currentLanguage] ?? null : voiceURI;
    void speakText(current.sentence, true, 1, currentVoice, currentLanguage).catch(() => {
      // Initial auto playback should fail silently.
    });
  }, [activeSheetSessionKey, current, soundEnabled, voiceURI, sheet.language, isFavoritesSheet, voiceMap]);

  useEffect(() => {
    setRandomEnabled(chapterSettings?.randomEnabled ?? false);
    setFontScale(chapterSettings?.fontScale ?? 1);
  }, [activeSheetSessionKey, chapterSettings?.randomEnabled, chapterSettings?.fontScale]);

  const finishGuide = () => {
    setGuideOpen(false);
    if (isLoggedIn && userId) {
      void saveReaderGuideSeen(userId);
    }
  };

  const handleGuideNext = () => {
    if (guideStep >= 2) {
      finishGuide();
      return;
    }
    setGuideStep((prev) => prev + 1);
  };

  const reopenGuide = () => {
    setGuideStep(0);
    setGuideOpen(true);
  };

  useEffect(() => {
    if (!isLoggedIn || !userId) {
      setGuideOpen(true);
      setGuideStep(0);
      return;
    }

    let cancelled = false;
    void loadReaderGuideSeen(userId)
      .then((seen) => {
        if (cancelled) return;
        if (!seen) {
          setGuideOpen(true);
          setGuideStep(0);
        } else {
          setGuideOpen(false);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setGuideOpen(true);
        setGuideStep(0);
      });

    return () => {
      cancelled = true;
    };
  }, [activeSheetSessionKey, isLoggedIn, userId]);

  useEffect(() => {
    const shouldHighlightSettings = guideOpen && guideStep === 2;
    onGuideHighlightSettingsChange?.(shouldHighlightSettings);
    return () => {
      onGuideHighlightSettingsChange?.(false);
    };
  }, [guideOpen, guideStep, onGuideHighlightSettingsChange]);

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
              <h3 className="sangju-gotgam">{ui.reader.exitTitle}</h3>
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
  const currentRowLanguage = current.sourceLanguage ?? sheet.language;
  const currentVoiceURI = isFavoritesSheet
    ? voiceMap[currentRowLanguage] ?? null
    : voiceURI;
  const selectableVoices = isFavoritesSheet
    ? voices.filter((voice) => voice.lang === currentRowLanguage)
    : voices;
  const playSentenceIfEnabled = (sentence: string) => {
    if (!soundEnabled) return;
    window.requestAnimationFrame(() => {
      void speakText(sentence, true, 1, currentVoiceURI, currentRowLanguage).catch(() => {
        // User action should not fail the flow when playback fails.
      });
    });
  };
  const firstReplayTrackedSessionIdRef = useRef<string | null>(null);
  const firstNextTrackedSessionIdRef = useRef<string | null>(null);

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
    sessionCountsRef.current.prior += 1;
    trackReaderEvent("reader_action_prior");
  };

  const goNext = async (source: "next" | "force_next" = "force_next") => {
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
    if (source === "force_next") {
      sessionCountsRef.current.forceNext += 1;
      trackReaderEvent("reader_action_force_next");
    } else {
      if (firstNextTrackedSessionIdRef.current !== readerSessionId) {
        firstNextTrackedSessionIdRef.current = readerSessionId;
        trackReaderEvent("reader_first_next", { language: currentRowLanguage });
      }
      sessionCountsRef.current.next += 1;
      trackReaderEvent("reader_action_next", { language: currentRowLanguage });
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
    if (isReadyForNext && isLast) {
      setLastSentenceConfirmOpen(true);
      return;
    }

    if (isReadyForNext) {
      await goNext("next");
      return;
    }

    if (actionLocked) return;
    startActionCooldown();

    flushSync(() => {
      setSpokenCount((prev) => Math.min(prev + 1, repeatCount));
    });

    if (soundEnabled) {
      window.requestAnimationFrame(() => {
        void speakText(current.sentence, true, 1, currentVoiceURI, currentRowLanguage).catch(() => {
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
    if (firstReplayTrackedSessionIdRef.current !== readerSessionId) {
      firstReplayTrackedSessionIdRef.current = readerSessionId;
      trackReaderEvent("reader_first_replay", { language: currentRowLanguage });
    }
    sessionCountsRef.current.replay += 1;
    trackReaderEvent("reader_action_replay", { language: currentRowLanguage });
  };

  const executeFavoriteToggle = async () => {
    if (!isLoggedIn || !userId) {
      await onRequireLogin("favorite");
      return;
    }

    let fallbackPinnedRowKey: string | null = null;
    if (isFavoritesSheet) {
      const nextCandidate = displayRows[currentIndex + 1];
      const prevCandidate = displayRows[currentIndex - 1];
      fallbackPinnedRowKey = nextCandidate
        ? getRowStableKey(nextCandidate)
        : prevCandidate
          ? getRowStableKey(prevCandidate)
          : null;
    }

    const result = await toggleFavorite({
      uid: userId,
      sheetName: favoriteTargetSheetName,
      language: current.sourceLanguage ?? sheet.language,
      sentence: current.sentence,
      translation: current.translation,
    });

    if (isFavoritesSheet && !result.active) {
      pendingRowPinnedKeyRef.current = fallbackPinnedRowKey;
    }

    await onStatsChanged?.();
    sessionCountsRef.current.favoriteToggle += 1;
    trackReaderEvent("reader_favorite_toggle", { favorite_active: result.active });

    if (isFavoritesSheet) {
      if (!result.active) {
        if (!fallbackPinnedRowKey) {
          onRequestExit();
          return;
        }
      }
      return;
    }

    setFavoriteActive(result.active);
  };

  const handleFavorite = async () => {
    if (isFavoritesSheet && favoriteActive) {
      setFavoriteRemoveConfirmOpen(true);
      return;
    }
    await executeFavoriteToggle();
  };

  const handleToggleRandom = async () => {
    if (!isLoggedIn || !userId) {
      await onRequireLogin("random");
      return;
    }

    const next = !randomEnabled;
    setRandomEnabled(next);
    stopSpeech();
    sessionCountsRef.current.randomToggle += 1;
    trackReaderEvent("reader_toggle_random", { random_enabled_next: next });

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
      await onRequireLogin("font_scale");
      return;
    }

    const next = Math.max(0.7, Math.min(1.6, +(fontScale + delta).toFixed(2)));
    setFontScale(next);
    sessionCountsRef.current.fontScaleChange += 1;
    trackReaderEvent("reader_change_font_scale", { font_scale: next });

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
    sessionCountsRef.current.translationChange += 1;
    trackReaderEvent("reader_change_translation_language", { translation_language: lang });
    onChangeTranslationLanguage?.(lang);
  };

  const handleVoiceChange = (nextVoiceUri: string) => {
    trackReaderEvent("reader_change_voice");
    onChangeVoice(nextVoiceUri, isFavoritesSheet ? currentRowLanguage : undefined);
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
                  type="button"
                >
                  <img src={shuffleImage} alt="" className="reader-random-toggle-icon" />
                  {randomEnabled ? ui.reader.randomOn : ui.reader.randomOff}
                </button>

                <select
                  className="control-btn reader-inline-select"
                  value={isFavoritesSheet ? voiceMap[currentRowLanguage] ?? "" : selectedVoiceURI ?? ""}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                >
                  {selectableVoices.map((voice) => (
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

                <button
                  className="control-btn reader-inline-guide"
                  onClick={reopenGuide}
                  type="button"
                  aria-label={ui.reader.guideReopenAria}
                  title={ui.reader.guideReopenAria}
                >
                  <img src={guideImage} alt="" className="reader-inline-guide-icon" />
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
              className={`icon-action-btn main-action-btn ${actionLocked ? "cooldown" : ""} ${
                guideOpen && guideStep === 0 ? "reader-guide-target" : ""
              }`}
              onClick={handleReplayAction}
              disabled={actionLocked}
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
              className={`icon-action-btn ${actionLocked ? "cooldown" : ""} ${
                guideOpen && guideStep === 1 ? "reader-guide-target" : ""
              }`}
              onClick={() => {
                void goNext("force_next");
              }}
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

      {guideOpen && (
        <div className="reader-guide-overlay" onClick={(e) => e.stopPropagation()}>
          <div className={`reader-guide-card step-${guideStep}`}>
            <div className="reader-guide-progress">{guideStep + 1} / 3</div>
            <h3 className="sangju-gotgam">{ui.reader.guideTitle}</h3>
            {guideStep === 0 ? (
              <p className="reader-guide-inline-text">
                {ui.reader.guideReplayBefore}
                <span className="reader-guide-inline-icon-wrap replay" aria-hidden="true">
                  <img src={replayImage} alt="" className="reader-guide-inline-icon" />
                </span>
                {ui.reader.guideReplayAfter}
              </p>
            ) : guideStep === 1 ? (
              <p className="reader-guide-inline-text">
                {ui.reader.guideForceNextBefore}
                <span className="reader-guide-inline-icon-wrap force-next" aria-hidden="true">
                  <img src={forceNextImage} alt="" className="reader-guide-inline-icon" />
                </span>
                {ui.reader.guideForceNextAfter}
              </p>
            ) : (
              <p className="reader-guide-inline-text">
                {ui.reader.guideSettingsBefore}
                <span className="reader-guide-inline-icon-wrap settings" aria-hidden="true">
                  <img src={settingIcon} alt="" className="reader-guide-inline-icon" />
                </span>
                {ui.reader.guideSettingsAfter}
              </p>
            )}
            <div className="reader-guide-actions">
              <button className="secondary-btn" onClick={finishGuide} type="button">
                {ui.reader.guideSkip}
              </button>
              <button className="primary-btn" onClick={handleGuideNext} type="button">
                {guideStep === 2 ? ui.reader.guideDone : ui.reader.guideNext}
              </button>
            </div>
          </div>
        </div>
      )}

      {exitConfirmOpen && (
        <div className="confirm-overlay" onClick={onCancelExit}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="sangju-gotgam">{ui.reader.exitTitle}</h3>
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

      {lastSentenceConfirmOpen && (
        <div className="confirm-overlay" onClick={() => setLastSentenceConfirmOpen(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="sangju-gotgam">{ui.reader.lastSentenceTitle}</h3>
            <p>{ui.reader.lastSentenceDescription}</p>
            <div className="confirm-actions">
              <button className="secondary-btn" onClick={() => setLastSentenceConfirmOpen(false)}>
                {ui.common.cancel}
              </button>
              <button
                className="primary-btn"
                onClick={() => {
                  setLastSentenceConfirmOpen(false);
                  onConfirmExit();
                }}
              >
                {ui.reader.goHome}
              </button>
            </div>
          </div>
        </div>
      )}

      {favoriteRemoveConfirmOpen && (
        <div className="confirm-overlay" onClick={() => setFavoriteRemoveConfirmOpen(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="sangju-gotgam">{ui.reader.favoriteRemoveTitle}</h3>
            <p>{ui.reader.favoriteRemoveDescription}</p>
            <div className="confirm-actions">
              <button className="secondary-btn" onClick={() => setFavoriteRemoveConfirmOpen(false)}>
                {ui.common.cancel}
              </button>
              <button
                className="primary-btn"
                onClick={() => {
                  setFavoriteRemoveConfirmOpen(false);
                  void executeFavoriteToggle();
                }}
              >
                {ui.reader.favoriteRemoveConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
