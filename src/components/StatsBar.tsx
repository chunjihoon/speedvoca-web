type Props = {
  currentLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
  currentLevelXp: number;
  xpRequiredForNextLevel: number;
  compact?: boolean;
};

export default function StatsBar({
  currentLevel,
  progressPercent,
  currentLevelXp,
  xpRequiredForNextLevel,
  compact = false,
}: Props) {
  if (!compact) return null;

  return (
    <section className="stats-inline-bar">
      <div className="stats-inline-top">
        <span className="stats-level-inline">Lv.{currentLevel}</span>
        <span className="stats-divider">|</span>
        <span className="stats-progress-text">
          경험치 {currentLevelXp}/{xpRequiredForNextLevel}
        </span>
      </div>

      <div className="stats-progress-track">
        <div
          className="stats-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </section>
  );
}