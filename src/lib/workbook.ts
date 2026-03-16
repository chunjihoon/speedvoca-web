import * as XLSX from "xlsx";
import type { SentenceRow, SheetContent } from "../types/content";

const DEFAULT_WORKBOOK_PATH = "/data/speedvoca_data.xlsx";

function normalizeCell(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function parseWorkbookFromArrayBuffer(buffer: ArrayBuffer): SheetContent[] {
  const workbook = XLSX.read(buffer, { type: "array" });

  const sheets: SheetContent[] = workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    const rows: SentenceRow[] = json
      .map((row) => ({
        sentence: normalizeCell(row.sentence),
        translation: normalizeCell(row.translation),
      }))
      .filter((row) => row.sentence.length > 0);

    return {
      name: sheetName,
      rows,
    };
  }).filter((sheet) => sheet.rows.length > 0);

  return sheets;
}

export async function loadWorkbook(path = DEFAULT_WORKBOOK_PATH): Promise<SheetContent[]> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`엑셀 파일을 불러오지 못했습니다. (${res.status})`);
  }

  const buffer = await res.arrayBuffer();
  return parseWorkbookFromArrayBuffer(buffer);
}

export async function parseWorkbookFile(file: File): Promise<SheetContent[]> {
  const buffer = await file.arrayBuffer();
  return parseWorkbookFromArrayBuffer(buffer);
}
