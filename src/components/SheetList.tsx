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
  isLoggedIn: boolean;
  statsMap: Record<string, ChapterStat>;
};

export default function SheetList({
  sheets,
  onSelect,
  onEditTitle,
  isLoggedIn,
  statsMap,
}: Props) {
  return (
    <main className="page">
      <section className="sheet-list">
        {sheets.map((sheet) => {
          const stats = statsMap[sheet.name] || {};

          return (
            <div key={sheet.name} className="sheet-card-wrap">
              <button className="sheet-card" onClick={() => onSelect(sheet)}>
                <div className="sheet-title">{sheet.name}</div>
                <div className="sheet-sub">{sheet.rows.length} sentences</div>

                <div className="sheet-stats">
                  <span>Tap {stats.completedSentenceCount ?? 0}</span>
                  <span>Next {stats.nextCount ?? 0}</span>
                  <span>Replay {stats.replayCount ?? 0}</span>
                  <span>Fav {stats.favoriteCount ?? 0}</span>
                </div>

                {!isLoggedIn && <div className="sheet-badge">Guest</div>}
              </button>

              <button
                className="edit-btn"
                onClick={() => onEditTitle(sheet)}
                type="button"
              >
                ✏️ Edit
              </button>
            </div>
          );
        })}
      </section>
    </main>
  );
}
