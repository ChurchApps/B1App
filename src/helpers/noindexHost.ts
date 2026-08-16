// B1App serves church tenants at {slug}.b1.church (prod), {slug}.staging.b1.church, and {slug}.demosite.b1.church.
// Apex staging.b1.church and demo.b1.church are other apps (ChurchApps marketing / B1Admin) and never hit this code.
const NOINDEX_SUFFIXES = [".staging.b1.church", ".demosite.b1.church"];

export function isNoindexHost(hostHeader: string | null | undefined): boolean {
  const host = (hostHeader || "").split(",")[0].split(":")[0].trim().toLowerCase();
  return NOINDEX_SUFFIXES.some((suffix) => host.endsWith(suffix));
}
