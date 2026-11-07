// Mirrors Packages/apphelper/src/components/notes/formatSelection.ts (applyFormat). B1App compiles
// against the published apphelper, so the chat screens carry this copy until a bump can import it.

export type FormatKind = "bold" | "italic" | "bullets" | "numbered";

export interface FormatResult {
  value: string;
  start: number;
  end: number;
}

const BULLET = /^- /;
const NUMBERED = /^\d+\. /;

function wrap(value: string, start: number, end: number, marker: string): FormatResult {
  const before = value.slice(0, start);
  const selected = value.slice(start, end);
  const after = value.slice(end);
  // Already wrapped right outside the selection: unwrap.
  if (before.endsWith(marker) && after.startsWith(marker)) {
    return {
      value: before.slice(0, before.length - marker.length) + selected + after.slice(marker.length),
      start: start - marker.length,
      end: end - marker.length
    };
  }
  return { value: before + marker + selected + marker + after, start: start + marker.length, end: end + marker.length };
}

function prefixLines(value: string, start: number, end: number, kind: "bullets" | "numbered"): FormatResult {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  // A selection ending right after a newline does not touch the next line.
  const lastChar = end > start && value[end - 1] === "\n" ? end - 1 : end;
  const nextBreak = value.indexOf("\n", lastChar);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  const lines = value.slice(lineStart, lineEnd).split("\n");
  const pattern = kind === "bullets" ? BULLET : NUMBERED;
  const remove = lines.every((l) => pattern.test(l));
  const updated = lines.map((l, i) => {
    if (remove) return l.replace(pattern, "");
    const stripped = l.replace(BULLET, "").replace(NUMBERED, "");
    return (kind === "bullets" ? "- " : `${i + 1}. `) + stripped;
  });
  const block = updated.join("\n");
  const newValue = value.slice(0, lineStart) + block + value.slice(lineEnd);
  if (start === end) {
    const caret = lineStart + updated[0].length;
    return { value: newValue, start: caret, end: caret };
  }
  return { value: newValue, start: lineStart, end: lineStart + block.length };
}

// Applies one formatting action to a plain-text selection using the markdown
// that MarkdownPreviewLight renders: **bold**, _italic_, "- " and "1. " lists.
export function applyFormat(value: string, start: number, end: number, kind: FormatKind): FormatResult {
  const text = value || "";
  const s = Math.max(0, Math.min(start, end, text.length));
  const e = Math.min(Math.max(start, end), text.length);
  if (kind === "bold") return wrap(text, s, e, "**");
  if (kind === "italic") return wrap(text, s, e, "_");
  return prefixLines(text, s, e, kind);
}

// The published MarkdownPreviewLight collapses a single newline into a space.
// Chat relies on line breaks, so turn each lone "\n" into a markdown hard break.
export function withHardBreaks(text: string): string {
  return (text || "").replace(/\r\n/g, "\n").replace(/([^\n])\n(?!\n)/g, "$1  \n");
}
