import type { RemoteSheetContent, SheetRow } from "../types/content";
import type { RecommendedContentMeta } from "../data/recommendContents";

const SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

function mapRows(values: string[][]): SheetRow[] {
  return values
    .filter((row) => row[0]?.trim() && row[1]?.trim())
    .map((row) => ({
      sentence: row[0].trim(),
      translation: row[1].trim(),
    }));
}

export async function fetchRecommendedSheet(
  meta: RecommendedContentMeta
): Promise<RemoteSheetContent> {
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
    id: meta.id,
    title: meta.title,
    language: meta.language,
    rows: mapRows(values),
  };
}