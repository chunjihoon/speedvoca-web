// import type { TtsVoiceOption } from "../types/content";

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
  totalNext: number;
  totalReplay: number;
  isDeveloperAccount: boolean;
  developerModeEnabled: boolean;
  onToggleDeveloperMode: () => void;
  onTestLevelUpEffect: () => void;
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
  totalNext,
  totalReplay,
  isDeveloperAccount,
  developerModeEnabled,
  onToggleDeveloperMode,
  onTestLevelUpEffect,
}: Props) {
  if (!open) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h3>Settings</h3>
          <button className="control-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-section">
          <button className="control-btn" onClick={onToggleSound}>
            {soundEnabled ? "🔊 Sound On" : "🔇 Sound Off"}
          </button>
        </div>

        <div className="settings-section">
          <label className="repeat-wrap">
            Repeat
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
          <div className="settings-subtitle">Study Stats</div>
          <div className="settings-stats">
            <div>Next: {totalNext}</div>
            <div>Replay: {totalReplay}</div>
          </div>
        </div>

        {isDeveloperAccount && (
          <div className="settings-section">
            <div className="settings-subtitle">Developer</div>

            <label className="developer-toggle-row">
              <span>Developer Mode</span>
              <input
                type="checkbox"
                checked={developerModeEnabled}
                onChange={onToggleDeveloperMode}
              />
            </label>

            {developerModeEnabled && (
              <div className="developer-tools">
                <button className="control-btn" onClick={onTestLevelUpEffect}>
                  레벨업 이펙트 테스트
                </button>
              </div>
            )}
          </div>
        )}

        <div className="settings-section account-block">
          {isLoggedIn ? (
            <>
              <div className="user-chip">{userName}</div>
              <button className="control-btn" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <button className="control-btn" onClick={onLogin}>
              Google Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
