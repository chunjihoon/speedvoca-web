type Props = {
  currentLevel: number;
  xpToNextLevel: number;
  totalNext: number;
  totalReplay: number;
  progressPercent: number;
  currentLevelXp: number;
  xpRequiredForNextLevel: number;
  onOpenSettings: () => void;
  compact?: boolean;
};

export default function StatsBar({
  currentLevel,
  //xpToNextLevel,
  totalNext,
  totalReplay,
  progressPercent,
  currentLevelXp,
  xpRequiredForNextLevel,
  onOpenSettings,
  compact = false,
}: Props) {
  if (compact) {
    return (
      <section className="stats-inline-bar">
        <div className="mini-stat">Lv.{currentLevel}</div>
        <div className="mini-stat">
          경험치 {xpRequiredForNextLevel === 0 ? "MAX" : `${currentLevelXp}/${xpRequiredForNextLevel}`}
          <div className="mini-progress-horizontal">
            <span className="mini-progress-text">
              
            </span>
            <div className="mini-progress-track">
              <div
                className="mini-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>



        <div className="mini-stat">Next {totalNext}</div>
        <div className="mini-stat">Replay {totalReplay}</div>

        <button className="settings-btn compact" onClick={onOpenSettings}>
          ⚙ Settings
        </button>
      </section>
    );
  }

  return null;
}