// Same defaults and parsing as B1Admin's PersonConstants, for the church's public titleOptions setting.
export const DEFAULT_TITLES = [
  "Mr", "Mrs", "Miss", "Ms", "Dr", "Prof", "Rev", "Pastor"
];
const TITLE_MAX_LENGTH = 10;

// Cleans a stored title list; falls back to DEFAULT_TITLES when missing, malformed or empty.
export function parseTitleOptions(raw: unknown): string[] {
  let list: unknown = raw;
  if (typeof raw === "string") {
    try { list = JSON.parse(raw); } catch { list = null; }
  }
  if (!Array.isArray(list)) return [...DEFAULT_TITLES];
  const seen = new Set<string>();
  const result: string[] = [];
  list.forEach((item) => {
    if (typeof item !== "string") return;
    const title = item.trim().slice(0, TITLE_MAX_LENGTH).trim();
    if (!title || seen.has(title.toLowerCase())) return;
    seen.add(title.toLowerCase());
    result.push(title);
  });
  return result.length > 0 ? result : [...DEFAULT_TITLES];
}
