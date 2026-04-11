import type { SheetContent } from "../types/content";
import { FAVORITES_SHEET_NAME, type AppUiText } from "../constants/i18n";
import trashIcon from "../assets/trash.png";

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
  ui: AppUiText;
};

export default function SheetList({
  sheets,
  onSelect,
  onDelete,
  isLoggedIn,
  statsMap,
  showDelete = true,
  ui,
}: Props) {
  const rowLayoutClass = sheets.length <= 3 ? "sheet-list-single-row" : "sheet-list-two-rows";

  return (
    <div className="home-horizontal-rail">
      <div className={`sheet-list ${rowLayoutClass}`}>
        {sheets.map((sheet) => {
          const stats = statsMap[sheet.name] || {};
          const nextCount = stats.nextCount ?? 0;
          const replayCount = stats.replayCount ?? 0;
          const displayTitle =
            sheet.name === FAVORITES_SHEET_NAME ? ui.common.favoritesLabel : sheet.name;

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
                    <div className="sheet-card-title">{displayTitle}</div>
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
                        aria-label={ui.sheet.deleteChapterAria}
                      >
                        <img src={trashIcon} alt="" className="sheet-card-delete-icon" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="sheet-card-meta">
                  <span className="sheet-card-sentence-badge">
                    {sheet.rows.length} {ui.sheet.sentences}
                  </span>

                  {!isLoggedIn && <span className="sheet-badge">{ui.sheet.guest}</span>}
                </div>

                <div className="sheet-card-stats-grid">
                  <div className="sheet-stat-box">
                    <span className="sheet-stat-label">{ui.sheet.next}</span>
                    <strong className="sheet-stat-value">{nextCount}</strong>
                  </div>

                  <div className="sheet-stat-box">
                    <span className="sheet-stat-label">{ui.sheet.replay}</span>
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
