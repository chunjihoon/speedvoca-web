import type { MultilingualRemoteSheetContent, MultilingualRow } from "../types/content";
import type { RecommendedContentMeta } from "../data/recommendContents";

const SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

function normalizeCell(value?: string): string {
  return (value ?? "").trim();
}

function mapMultilingualRows(values: string[][]): MultilingualRow[] {
  if (!values.length) return [];

  const [headerRow, ...bodyRows] = values;

  const headerMap = new Map(
    headerRow.map((header, index) => [header.trim().toLowerCase(), index])
  );

  const getCell = (row: string[], columnName: string) => {
    const index = headerMap.get(columnName);
    if (index == null) return "";
    return normalizeCell(row[index]);
  };

  return bodyRows
    .map((row, index) => {
      const id = getCell(row, "key") || `row_${index + 1}`;

      const en = getCell(row, "en");
      const zh = getCell(row, "zh");
      const fr = getCell(row, "fr");
      const ja = getCell(row, "ja");
      const ko = getCell(row, "ko");

      const hasAnyText = [en, zh, fr, ja, ko].some(Boolean);
      if (!hasAnyText) return null;

      return {
        id,
        texts: {
          en,
          zh,
          fr,
          ja,
          ko,
        },
      };
    })
    .filter((row): row is MultilingualRow => row !== null);
}

export async function fetchRecommendedSheet(
  meta: RecommendedContentMeta
): Promise<MultilingualRemoteSheetContent> {
  const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GOOGLE_SHEETS_API_KEY is missing.");
  }

  const url = new URL(
    `${SHEETS_API_BASE}/${meta.spreadsheetId}/values/${encodeURIComponent(meta.range)}`
  );
  url.searchParams.set("key", apiKey);
  url.searchParams.set("majorDimension", "ROWS");

  const response = await fetch(url.toString());
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch sheet (${response.status}): ${text}`);
  }

  const data = await response.json();
  const values: string[][] = Array.isArray(data.values) ? data.values : [];

  return {
    id: meta.sourceSheetId,
    title: meta.title,
    rows: mapMultilingualRows(values),
  };
}