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
    <div className="home-horizontal-rail">
      <div className="sheet-list">
        {sheets.map((sheet) => {
          const stats = statsMap[sheet.name] || {};

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
                <div className="sheet-card-head">
                  <div className="sheet-title-row">
                    <div className="sheet-title">{sheet.name}</div>
                  </div>

                  <div className="sheet-head-right">
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

                <div className="sheet-stats my-sheet-stats">
                  <span>Next {stats.nextCount ?? 0}</span>
                  <span>|</span>
                  <span>Replay {stats.replayCount ?? 0}</span>
                </div>

                {!isLoggedIn && <div className="sheet-badge">Guest</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}