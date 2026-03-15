import type { SheetContent } from "../types/content";

type Props = {
  sheets: SheetContent[];
  onSelect: (sheet: SheetContent) => void;
  onEditTitle: (sheet: SheetContent) => void;
  isLoggedIn: boolean;
};

export default function SheetList({ sheets, onSelect, onEditTitle, isLoggedIn }: Props) {
  return (
    <main className="page">
      <section className="sheet-list">
        {sheets.map((sheet) => (
          <div key={sheet.name} className="sheet-card-wrap">
            <button className="sheet-card" onClick={() => onSelect(sheet)}>
              <div className="sheet-title">{sheet.name}</div>
              <div className="sheet-sub">{sheet.rows.length} sentences</div>
              {!isLoggedIn && (
                <div className="sheet-badge">Guest</div>
              )}
            </button>

            <button
              className="edit-btn"
              onClick={() => onEditTitle(sheet)}
              type="button"
            >
              ✏️ Edit
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}
