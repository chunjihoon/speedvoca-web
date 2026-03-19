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
            <div
              className="sheet-card clickable"
              onClick={() => onSelect(sheet)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(sheet);
                }
              }}
            >
            <div className="sheet-card-head">
              <div className="sheet-title-row">
                <div className="sheet-title">{sheet.name}</div>

                {isLoggedIn && sheet.name !== "Favorites" && (
                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTitle(sheet);
                    }}
                    aria-label="Edit title"
                  >
                    ✏️
                  </button>
                )}
              </div>

              <div className="sheet-head-right">
                {sheet.difficulty && <div className="difficulty-badge">{sheet.difficulty}</div>}

                {showDelete && (
                  <button
                    className="icon-btn danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(sheet);
                    }}
                    aria-label="Delete chapter"
                  >
                    🗑️
                  </button>
                )}
              </div>
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
          </div>
        );
      })}
    </div>
  );
}
