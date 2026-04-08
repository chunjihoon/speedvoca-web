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
  onDelete: (sheet: SheetContent) => void;
  isLoggedIn: boolean;
  statsMap: Record<string, ChapterStat>;
  showDelete?: boolean;
};

export default function SheetList({
  sheets,
  onSelect,
  onDelete,
  isLoggedIn,
  statsMap,
  showDelete = true,
}: Props) {
  return (
    <div className="home-horizontal-rail">
      <div className="sheet-list">
        {sheets.map((sheet) => {
          const stats = statsMap[sheet.name] || {};
          const nextCount = stats.nextCount ?? 0;
          const replayCount = stats.replayCount ?? 0;

          return (
            <div key={sheet.name} className="sheet-card-wrap">
              <div
                className="sheet-card clickable my-sheet-card"
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
                <div className="sheet-card-header">
                  <div className="sheet-card-title-wrap">
                    <div className="sheet-card-title">{sheet.name}</div>
                  </div>

                  <div className="sheet-card-actions">
                    {showDelete && (
                      <button
                        type="button"
                        className="sheet-card-delete-btn"
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

                <div className="sheet-card-meta">
                  <span className="sheet-card-sentence-badge">
                    {sheet.rows.length} sentences
                  </span>

                  {!isLoggedIn && <span className="sheet-badge">Guest</span>}
                </div>

                <div className="sheet-card-stats-grid">
                  <div className="sheet-stat-box">
                    <span className="sheet-stat-label">Next</span>
                    <strong className="sheet-stat-value">{nextCount}</strong>
                  </div>

                  <div className="sheet-stat-box">
                    <span className="sheet-stat-label">Replay</span>
                    <strong className="sheet-stat-value">{replayCount}</strong>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}