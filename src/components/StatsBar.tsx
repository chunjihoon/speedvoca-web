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
  if (!compact) return null;

  return (
    <section className="stats-inline-bar">
      <div className="stats-item stats-level">Lv.{currentLevel}</div>

      <div className="stats-progress">
        <span className="stats-progress-text">
          경험치 {currentLevelXp}/{xpRequiredForNextLevel}
        </span>
        <div className="stats-progress-track">
          <div
            className="stats-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="stats-item stats-next">Next {totalNext}</div>
      <div className="stats-item stats-replay">Replay {totalReplay}</div>

      <button className="settings-btn compact stats-settings" onClick={onOpenSettings}>
        ⚙ Settings
      </button>
    </section>
  );
}