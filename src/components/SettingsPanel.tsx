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

        {/* <div className="settings-section">
          <label className="repeat-wrap voice-wrap">
            Voice
            <select
              value={selectedVoiceURI ?? ""}
              onChange={(e) => onChangeVoice(e.target.value)}
            >
              {voices.length === 0 && <option value="">Loading voices...</option>}
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang}){voice.default ? " • default" : ""}
                </option>
              ))}
            </select>
          </label>
        </div> */}

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
