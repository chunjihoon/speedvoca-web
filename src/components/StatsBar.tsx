type Props = {
    totalTap: number;
    totalNext: number;
    totalReplay: number;
    onOpenSettings: () => void;
  };
  
  export default function StatsBar({
    totalTap,
    totalNext,
    totalReplay,
    onOpenSettings,
  }: Props) {
    return (
      <section className="stats-topbar">
        <div className="stats-group">
          <div className="stat-card">
            <div className="stat-value">{totalTap}</div>
            <div className="stat-label">Taps</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalNext}</div>
            <div className="stat-label">Next</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalReplay}</div>
            <div className="stat-label">Replay</div>
          </div>
        </div>
  
        <button className="settings-btn" onClick={onOpenSettings}>
          ⚙ Settings
        </button>
      </section>
    );
  }
  