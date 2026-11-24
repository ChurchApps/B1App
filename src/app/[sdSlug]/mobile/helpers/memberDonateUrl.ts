// Signed-in members who open a giving link (/donate?fundId=…&amount=…&recurring=1) are sent to the app's
// donate screen. Keep the link's params and open the Give view so the donation form can read them.
const GIVING_LINK_PARAMS = ["fundId", "amount", "recurring"];

export function memberDonateUrl(search?: string | null): string {
  const params = new URLSearchParams(search || "");
  if (!params.has("view") && GIVING_LINK_PARAMS.some((key) => params.has(key))) params.set("view", "give");
  const query = params.toString();
  return "/mobile/donate" + (query ? "?" + query : "");
}
