// Shares a link with the device share sheet, copying the text to the clipboard where there is none.
export type ShareResult = "shared" | "copied" | "failed" | "cancelled";

const isAbort = (e: unknown) => (e as Error)?.name === "AbortError";

export const shareLink = async ({ title, text, url }: { title: string; text: string; url: string }): Promise<ShareResult> => {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({ title, text, url });
      return "shared";
    }
  } catch (e) {
    if (isAbort(e)) return "cancelled";
  }
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return "copied";
    }
  } catch {
    // fall through
  }
  return "failed";
};
