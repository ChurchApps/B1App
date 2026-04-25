const DEFAULT_BASE_URL = "http://grace.localhost:3301";
const API_BASE = "http://localhost:8084";
const REQUIRED_ENVIRONMENT = "demo";
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
  // Allow any *.localhost host (subdomain routing) plus bare localhost / 127.0.0.1.
  const isLocal =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname.endsWith(".localhost");
  if (!isLocal) {
    refuse([
      `BASE_URL "${raw}" is not local.`,
      "Tests only run against http://grace.localhost:3301 (or another *.localhost host).",
      "Unset BASE_URL or point it at a localhost subdomain.",
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
  if (health.environment !== REQUIRED_ENVIRONMENT) {
    refuse([
      `Api reports environment="${health.environment}" but must be "${REQUIRED_ENVIRONMENT}".`,
      "Set ENVIRONMENT=demo in Api/.env and restart the Api.",
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
      "Check the *_CONNECTION_STRING env vars in Api/.env.",
    ]);
  }
}

async function checkSubdomainResolves() {
  const raw = process.env.BASE_URL || DEFAULT_BASE_URL;
  const url = new URL(raw);
  if (!url.hostname.endsWith(".localhost")) return;
  try {
    // We don't care about the response status — just that the host resolves.
    await fetch(raw, { method: "HEAD" }).catch((err) => {
      if (err && err.cause && err.cause.code === "ENOTFOUND") {
        refuse([
          `Host "${url.hostname}" did not resolve.`,
          `Most platforms resolve *.localhost to 127.0.0.1 automatically; if yours doesn't,`,
          `add this line to your hosts file: 127.0.0.1 ${url.hostname}`,
        ]);
      }
    });
  } catch (err) {
    if (err instanceof VerifyEnvError) throw err;
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
