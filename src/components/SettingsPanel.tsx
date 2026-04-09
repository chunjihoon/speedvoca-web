import type { AppLanguage, AppUiText } from "../constants/i18n";
import shareImage from "../assets/share.png";

type Props = {
  open: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
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
  totalNext: number;
  totalReplay: number;
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
  totalNext,
  totalReplay,
  isDeveloperAccount,
  developerModeEnabled,
  onToggleDeveloperMode,
  onTestLevelUpEffect,
  appLanguage,
  onChangeLanguage,
  ui,
}: Props) {
  if (!open) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header sangju-gotgam">
          <h3>{ui.settings.title}</h3>
          <button className="settings-close-btn" onClick={onClose} type="button">
            ✕
          </button>
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
          <button className="settings-share-cta" onClick={onShare} type="button">
            <img src={shareImage} alt="" className="settings-share-icon" />
            <span>{ui.settings.shareCta}</span>
          </button>

          {isLoggedIn ? (
            <div className="account-row">
              <div className="user-chip">{userName}</div>
              <button className="control-btn" onClick={onLogout}>
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
