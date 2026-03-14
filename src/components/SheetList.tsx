import type { SheetContent } from "../types/content";

type Props = {
  sheets: SheetContent[];
  onSelect: (sheet: SheetContent) => void;
};

export default function SheetList({ sheets, onSelect }: Props) {
  return (
    <main className="page">
      <section className="sheet-list">
        {sheets.map((sheet) => (
          <button
            key={sheet.name}
            className="sheet-card"
            onClick={() => onSelect(sheet)}
          >
            <div className="sheet-title">{sheet.name}</div>
            <div className="sheet-sub">{sheet.rows.length} sentences</div>
          </button>
        ))}
      </section>
    </main>
  );
}
