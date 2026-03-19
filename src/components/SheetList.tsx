import type { SheetContent } from "../types/content";

type ChapterStat = {
  completedSentenceCount?: number;
  nextCount?: number;
  replayCount?: number;
  favoriteCount?: number;
};

type Props = {
  sheets: SheetContent[];
  onSelect: (sheet: SheetContent) => void;
  onEditTitle: (sheet: SheetContent) => void;
  onDelete: (sheet: SheetContent) => void;
  isLoggedIn: boolean;
  statsMap: Record<string, ChapterStat>;
  showDelete?: boolean;
};

function getProgressPercent(stats: ChapterStat, totalRows: number) {
  if (!totalRows) return 0;
  const raw = Math.round(((stats.completedSentenceCount ?? 0) / totalRows) * 100);
  return Math.max(0, Math.min(100, raw));
}

export default function SheetList({
  sheets,
  onSelect,
  onEditTitle,
  onDelete,
  isLoggedIn,
  statsMap,
  showDelete = true,
}: Props) {
  return (
    <div className="sheet-list">
      {sheets.map((sheet) => {
        const stats = statsMap[sheet.name] || {};
        const progressPercent = getProgressPercent(stats, sheet.rows.length);

        return (
          <div key={sheet.name} className="sheet-card-wrap">
            <div className="sheet-card">
            <div className="sheet-card-head">
              <div className="sheet-title">{sheet.name}</div>
              {sheet.difficulty && <div className="difficulty-badge">{sheet.difficulty}</div>}
            </div>
            <div className="sheet-sub">{sheet.rows.length} sentences</div>
            <div className="progress-block">
              <div className="progress-meta">
                <span>Progress</span>
                <strong>{progressPercent}%</strong>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
              <div className="sheet-stats">
                {/* <span>Tap {stats.completedSentenceCount ?? 0}</span> */}
                <span>Next {stats.nextCount ?? 0} |</span>
                <span>Replay {stats.replayCount ?? 0} |</span>
                <span>Fav {stats.favoriteCount ?? 0}</span>
              </div>

              {!isLoggedIn && <div className="sheet-badge">Guest</div>}
            </div>

            <div className="card-actions">
              <button className="card-action primary" onClick={() => onSelect(sheet)}>
                Study
              </button>
              <button className="card-action" onClick={() => onEditTitle(sheet)}>
                Edit
              </button>
              {showDelete && (
                <button className="card-action danger" onClick={() => onDelete(sheet)}>
                  Delete
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
