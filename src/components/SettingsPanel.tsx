import type { AppLanguage, AppUiText } from "../constants/i18n";
import shareImage from "../assets/share.png";

type Props = {
  open: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  levelUpSoundEnabled: boolean;
  onToggleLevelUpSound: () => void;
  repeatCount: number;
  onChangeRepeatCount: (value: number) => void;
  // voices: TtsVoiceOption[];
  // selectedVoiceURI: string | null;
  // onChangeVoice: (voiceURI: string) => void;
  isLoggedIn: boolean;
  userName: string;
  onLogin: () => void;
  onLogout: () => void;
  onShare: () => void;
  onOpenIssueReport: () => void;
  totalNext: number;
  totalReplay: number;
  dailySentenceRemaining: number;
  dailySentenceLimit: number;
  isDeveloperAccount: boolean;
  developerModeEnabled: boolean;
  onToggleDeveloperMode: () => void;
  onTestLevelUpEffect: () => void;
  appLanguage: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  ui: AppUiText;
};

export default function SettingsPanel({
  open,
  onClose,
  soundEnabled,
  onToggleSound,
  levelUpSoundEnabled,
  onToggleLevelUpSound,
  repeatCount,
  onChangeRepeatCount,
  // voices,
  // selectedVoiceURI,
  // onChangeVoice,
  isLoggedIn,
  userName,
  onLogin,
  onLogout,
  onShare,
  onOpenIssueReport,
  totalNext,
  totalReplay,
  dailySentenceRemaining,
  dailySentenceLimit,
  isDeveloperAccount,
  developerModeEnabled,
  onToggleDeveloperMode,
  onTestLevelUpEffect,
  appLanguage,
  onChangeLanguage,
  ui,
}: Props) {
  if (!open) return null;

  const handleOverlayPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="settings-overlay" onPointerDown={handleOverlayPointerDown}>
      <div
        className="settings-panel"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="settings-header sangju-gotgam">
          <div className="settings-header-left">
            <button className="settings-close-btn settings-back-btn" onClick={onClose} type="button">
              &lt;
            </button>
            <h3 className="sangju-gotgam">{ui.settings.title}</h3>
          </div>
        </div>

        <div className="settings-section settings-inline-row">
          <button className="control-btn" onClick={onToggleSound}>
            {soundEnabled ? ui.settings.soundOn : ui.settings.soundOff}
          </button>

          <label className="repeat-wrap">
            {ui.settings.repeat}
            <select
              value={repeatCount}
              onChange={(e) => onChangeRepeatCount(Number(e.target.value))}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </label>
        </div>

        <div className="settings-section">
          <button
            className="control-btn settings-levelup-sound-btn"
            onClick={onToggleLevelUpSound}
          >
            {levelUpSoundEnabled
              ? ui.settings.levelUpSoundOn
              : ui.settings.levelUpSoundOff}
          </button>
        </div>

        <div className="settings-section">
          <div className="settings-subtitle">{ui.settings.language}</div>
          <div className="settings-stats">
            <button
              className="control-btn"
              type="button"
              onClick={() => onChangeLanguage("en")}
              disabled={appLanguage === "en"}
            >
              {ui.settings.english}
            </button>
            <button
              className="control-btn"
              type="button"
              onClick={() => onChangeLanguage("ko")}
              disabled={appLanguage === "ko"}
            >
              {ui.settings.korean}
            </button>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-subtitle">
            {ui.settings.dailyNewSentenceRemaining}
          </div>
          <div className="settings-stats">
            <div>
              {dailySentenceRemaining}/{dailySentenceLimit}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-subtitle">{ui.settings.studyStats}</div>
          <div className="settings-stats">
            <div>{ui.settings.next}: {totalNext}</div>
            <div>{ui.settings.replay}: {totalReplay}</div>
          </div>
          <div className="settings-description">{ui.settings.studyStatsDescription}</div>
        </div>

        {isDeveloperAccount && (
          <div className="settings-section">
            <div className="settings-subtitle">{ui.settings.developer}</div>

            <label className="developer-toggle-row">
              <span>{ui.settings.developerMode}</span>
              <input
                type="checkbox"
                checked={developerModeEnabled}
                onChange={onToggleDeveloperMode}
              />
            </label>

            {developerModeEnabled && (
              <div className="developer-tools">
                <button className="control-btn" onClick={onTestLevelUpEffect}>
                  {ui.settings.levelEffectTest}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="settings-section account-block">
          <button className="control-btn settings-issue-report-btn" onClick={onOpenIssueReport} type="button">
            {ui.settings.issueReportButton}
          </button>

          <button className="settings-share-cta" onClick={onShare} type="button">
            <img src={shareImage} alt="" className="settings-share-icon" />
            <span>{ui.settings.shareCta}</span>
          </button>

          {isLoggedIn ? (
            <div className="account-row">
              <div className="user-chip">{userName}</div>
              <button className="control-btn account-logout-btn" onClick={onLogout}>
                {ui.settings.logout}
              </button>
            </div>
          ) : (
            <button className="control-btn" onClick={onLogin}>
              {ui.settings.loginGoogle}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
