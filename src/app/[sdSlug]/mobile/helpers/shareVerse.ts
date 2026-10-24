import type { DailyVerse } from "./dailyVerses";

// Share and download for any day's Verse of the Day, used by the app page, its past-day sheet and the website page.
export type ShareResult = "shared" | "copied" | "downloaded" | "failed" | "cancelled";

const isAbort = (e: unknown) => (e as Error)?.name === "AbortError";

export const verseShareText = (verse: DailyVerse | null) => (verse ? `"${verse.text}" — ${verse.reference}` : "Verse of the Day");

export const verseImageUrl = (day: number, shape: string) => `https://votd.org/v1/${day}/${shape}.jpg`;

// votd.org sends no CORS header, so the picture comes from the same-origin proxy.
const fetchVerseImage = async (day: number, shape: string, name: string) => {
  const res = await fetch(`/mobile/votd-image/${day}/${shape}`);
  if (!res.ok) throw new Error("Image unavailable");
  const blob = await res.blob();
  return new File([blob], name, { type: "image/jpeg" });
};

const saveFile = (file: File) => {
  const objectUrl = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

export const shareVerseText = async (verse: DailyVerse | null, day: number, shape: string): Promise<ShareResult> => {
  const text = verseShareText(verse);
  const url = verseImageUrl(day, shape);
  try {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      await (navigator as any).share({ title: "Verse of the Day", text, url });
      return "shared";
    }
  } catch (e) {
    if (isAbort(e)) return "cancelled";
  }
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      return "copied";
    }
  } catch {
    // fall through
  }
  return "failed";
};

// Shares the picture as a file; downloads it where file sharing isn't supported.
export const shareVerseImage = async (verse: DailyVerse | null, day: number, shape: string): Promise<ShareResult> => {
  try {
    const file = await fetchVerseImage(day, shape, "verse-of-the-day.jpg");
    const nav = navigator as any;
    if (nav.canShare?.({ files: [file] }) && nav.share) {
      await nav.share({ files: [file], text: verseShareText(verse) });
      return "shared";
    }
    saveFile(file);
    return "downloaded";
  } catch (e) {
    return isAbort(e) ? "cancelled" : "failed";
  }
};

export const downloadVerseImage = async (day: number, shape: string): Promise<ShareResult> => {
  try {
    saveFile(await fetchVerseImage(day, shape, `votd-${day}.jpg`));
    return "downloaded";
  } catch {
    return "failed";
  }
};

// Every day from January 1 of this year through yesterday, newest first. Only this year: the catalog is indexed by day of year.
export const pastDatesThisYear = (now: Date = new Date()) => {
  const dates: Date[] = [];
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  while (d.getFullYear() === now.getFullYear()) {
    dates.push(new Date(d));
    d.setDate(d.getDate() - 1);
  }
  return dates;
};

// Groups newest-first dates under their month.
export const groupByMonth = <T extends { date: Date }>(entries: T[]) => {
  const groups: { key: string; month: Date; entries: T[] }[] = [];
  for (const entry of entries) {
    const key = `${entry.date.getFullYear()}-${entry.date.getMonth()}`;
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = { key, month: new Date(entry.date.getFullYear(), entry.date.getMonth(), 1), entries: [] };
      groups.push(group);
    }
    group.entries.push(entry);
  }
  return groups;
};
