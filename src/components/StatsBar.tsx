import type { AppUiText } from "../constants/i18n";

type Props = {
  currentLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
  currentLevelXp: number;
  xpRequiredForNextLevel: number;
  compact?: boolean;
  ui: AppUiText;
};

export default function StatsBar({
  currentLevel,
  progressPercent,
  currentLevelXp,
  xpRequiredForNextLevel,
  compact = false,
  ui,
}: Props) {
  if (!compact) return null;

  return (
    <section className="stats-inline-bar">
      <span className="stats-level-inline">
        {ui.level.short}
        {currentLevel}
      </span>

      <div className="stats-progress-track">
        <div
          className="stats-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <span className="stats-progress-text">
        {ui.level.xp} {currentLevelXp}/{xpRequiredForNextLevel}
      </span>
    </section>
  );
}
