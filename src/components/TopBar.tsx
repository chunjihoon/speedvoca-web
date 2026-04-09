import type { TtsVoiceOption } from "../types/content";
import type { AppUiText } from "../constants/i18n";

type Props = {
  soundEnabled: boolean;
  onToggleSound: () => void;
  repeatCount: number;
  onChangeRepeatCount: (value: number) => void;
  onBackToList: () => void;
  inReader: boolean;
  voices: TtsVoiceOption[];
  selectedVoiceURI: string | null;
  onChangeVoice: (voiceURI: string) => void;
  isLoggedIn: boolean;
  userName: string;
  onLogin: () => void;
  onLogout: () => void;
  onImport: () => void;
  ui: AppUiText;
};

export default function TopBar({
  soundEnabled,
  onToggleSound,
  repeatCount,
  onChangeRepeatCount,
  onBackToList,
  inReader,
  voices,
  selectedVoiceURI,
  onChangeVoice,
  isLoggedIn,
  userName,
  onLogin,
  onLogout,
  onImport,
  ui,
}: Props) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>Speed Voca Web</h1>
      </div>

      <div className="topbar-right">
        <button className="control-btn" onClick={onImport}>
          ＋ {ui.manualImport.importExcel}
        </button>

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

        <label className="repeat-wrap voice-wrap">
          {ui.manualImport.language}
          <select
            value={selectedVoiceURI ?? ""}
            onChange={(e) => onChangeVoice(e.target.value)}
          >
            {voices.length === 0 && <option value="">{ui.app.loading}</option>}
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang}){voice.default ? " • default" : ""}
              </option>
            ))}
          </select>
        </label>

        {inReader && (
          <button className="control-btn" onClick={onBackToList}>
            ← {ui.common.back}
          </button>
        )}

        {isLoggedIn ? (
          <>
            <span className="user-chip">{userName}</span>
            <button className="control-btn" onClick={onLogout}>
              {ui.settings.logout}
            </button>
          </>
        ) : (
          <button className="control-btn" onClick={onLogin}>
            {ui.settings.loginGoogle}
          </button>
        )}
      </div>
    </header>
  );
}
