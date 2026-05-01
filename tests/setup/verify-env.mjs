const DEFAULT_BASE_URL = "http://grace.localtest.me:3301";
const API_BASE = "http://localhost:8084";
// Tests work against either ENVIRONMENT=demo (stage demo deployments) or
// ENVIRONMENT=dev pointed at localhost — same set reset-demo accepts.
const ALLOWED_ENVIRONMENTS = ["demo", "dev"];
const REQUIRED_MODULES = ["membership", "attendance", "content", "giving", "messaging", "doing"];

class VerifyEnvError extends Error {
  constructor(message) {
    super(message);
    this.name = "VerifyEnvError";
  }
}

function refuse(lines) {
  const body = Array.isArray(lines) ? lines.join("\n  ") : lines;
  throw new VerifyEnvError(
    [
      "",
      "========================================",
      "B1App tests refused to run.",
      `  ${body}`,
      "========================================",
      "",
    ].join("\n")
  );
}

function checkBaseUrl() {
  const raw = process.env.BASE_URL || DEFAULT_BASE_URL;
  let url;
  try {
    url = new URL(raw);
  } catch {
    refuse(`BASE_URL "${raw}" is not a valid URL.`);
  }
  // Allow loopback hosts plus the *.localtest.me / *.localhost subdomain shapes
  // we use to drive B1App's host-header-based subdomain routing.
  const isLocal =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname.endsWith(".localhost") ||
    url.hostname.endsWith(".localtest.me");
  if (!isLocal) {
    refuse([
      `BASE_URL "${raw}" is not local.`,
      "Tests only run against http://grace.localtest.me:3301 (or another loopback host).",
      "Unset BASE_URL or point it at a local host.",
    ]);
  }
}

async function checkApiHealth() {
  let health;
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) refuse(`GET ${API_BASE}/health returned HTTP ${res.status}.`);
    health = await res.json();
  } catch (err) {
    if (err instanceof VerifyEnvError) throw err;
    refuse([
      `Could not reach Api at ${API_BASE}/health.`,
      `Error: ${err instanceof Error ? err.message : String(err)}`,
      "The Api dev server should already be running (Playwright webServer starts it).",
    ]);
  }
  if (!ALLOWED_ENVIRONMENTS.includes(health.environment)) {
    refuse([
      `Api reports environment="${health.environment}" but must be one of: ${ALLOWED_ENVIRONMENTS.join(", ")}.`,
      "Set ENVIRONMENT=demo or ENVIRONMENT=dev (against localhost) in Api/.env and restart the Api.",
    ]);
  }
}

async function checkDbConnections() {
  let body;
  try {
    const res = await fetch(`${API_BASE}/health/database-connections`);
    body = await res.json();
    if (!res.ok && res.status !== 503) {
      refuse(`GET ${API_BASE}/health/database-connections returned HTTP ${res.status}.`);
    }
  } catch (err) {
    if (err instanceof VerifyEnvError) throw err;
    refuse(`Could not reach ${API_BASE}/health/database-connections: ${err instanceof Error ? err.message : String(err)}`);
  }
  const loaded = body?.modules?.loaded ?? [];
  const missing = REQUIRED_MODULES.filter((m) => !loaded.includes(m));
  if (missing.length > 0) {
    refuse([
      `Api is missing database connections for: ${missing.join(", ")}.`,
      "Check API_DATABASE_URL in Api/.env.",
    ]);
  }
}

async function checkSubdomainResolves() {
  const raw = process.env.BASE_URL || DEFAULT_BASE_URL;
  const url = new URL(raw);
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return;
  // Use Node's DNS lookup directly — fetch() can fail for many reasons besides
  // DNS, but dns.lookup is unambiguous.
  const { lookup } = await import("node:dns/promises");
  try {
    await lookup(url.hostname);
  } catch (err) {
    refuse([
      `Host "${url.hostname}" did not resolve.`,
      `*.localtest.me is a public DNS service that maps every subdomain to 127.0.0.1 —`,
      `it should work on every machine without configuration. If your network blocks DNS`,
      `lookups for it, add this line to your hosts file:  127.0.0.1 ${url.hostname}`,
    ]);
  }
}

export async function verifyEnv({ fullCheck } = {}) {
  checkBaseUrl();
  if (fullCheck) {
    await checkApiHealth();
    await checkDbConnections();
    await checkSubdomainResolves();
  }
}

export { VerifyEnvError };
