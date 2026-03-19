type Props = {
  currentLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
  currentLevelXp: number;
  xpRequiredForNextLevel: number;
  onOpenSettings: () => void;
  compact?: boolean;
};

export default function StatsBar({
  currentLevel,
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

      <button className="settings-btn compact stats-settings" onClick={onOpenSettings}>
        ⚙ Settings
      </button>
    </section>
  );
}