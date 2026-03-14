type Props = {
    soundEnabled: boolean;
    onToggleSound: () => void;
    repeatCount: number;
    onChangeRepeatCount: (value: number) => void;
    onBackToList: () => void;
    inReader: boolean;
  };
  
  export default function TopBar({
    soundEnabled,
    onToggleSound,
    repeatCount,
    onChangeRepeatCount,
    onBackToList,
    inReader,
  }: Props) {
    return (
      <header className="topbar">
        <div className="topbar-left">
          <h1>Speed Voca Web</h1>
        </div>
  
        <div className="topbar-right">
          <button className="control-btn" onClick={onToggleSound}>
            {soundEnabled ? "🔊 Sound On" : "🔇 Sound Off"}
          </button>
  
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
  
          {inReader && (
            <button className="control-btn" onClick={onBackToList}>
              ← Back
            </button>
          )}
        </div>
      </header>
    );
  }
  