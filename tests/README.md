# Tests

Three tiers, picked by when they run:

| Tier | When | Command |
|---|---|---|
| Smoke | After every Vercel demo deployment (`.github/workflows/smoke.yml`) | `SMOKE_BASE_URL=https://grace.demosite.b1.church SMOKE_EMAIL=demo@b1.church SMOKE_PASSWORD=password yarn test:smoke` |
| Affected | Before pushing a PR branch | `yarn test:affected` |
| Full | Nightly | `yarn test` |

**Smoke** (`tests/smoke/`, `playwright.smoke.config.ts`) runs against the demo church site and only reads. The church comes from the subdomain, so `SMOKE_BASE_URL` must be a church host such as `https://grace.demosite.b1.church`, never the `*.vercel.app` deployment URL. The public checks load the home page, the login form and the built-in Sermons, Donate and Groups pages, each waiting for the API request that loads the church's data. Checks stay church-neutral (no names or service times), so the suite works on any subdomain. With `SMOKE_EMAIL`/`SMOKE_PASSWORD` it also signs in and opens the main member-app screens (`/mobile/dashboard`, groups, community, messages, me); the account needs directory access for the community check. Every check fails on an uncaught page error or a 5xx from our API or the site. Without credentials only the public checks run; set `SMOKE_REQUIRE_AUTH=1` to make that an error. `smoke.yml` runs when Vercel reports a successful `demo` deployment of main (or by hand from the Actions tab) and signs in as the demo user. Smoke never runs against production: `playwright.smoke.config.ts` refuses any host that is not a demo or local host.

**Affected** runs the specs for the areas your branch changed, from `tests/areas.json`, plus any spec you edited and `always` (mobile shell, public navigation). A changed source file in no area is treated as shared code and runs the whole suite. Files under `.pr-screenshots/` and image files are ignored. `yarn test:affected --list` shows the selection; anything after `--` goes to Playwright (`yarn test:affected -- --workers=1`). It needs the local demo stack like `yarn test`.

**Naming.** Name specs after the area and behavior (`mobile-groups-attendance-leaders-only.spec.ts`), not the issue number, and add new files to an area in `tests/areas.json`. `yarn test:areas` (also a PR check) fails if a spec is in no area.
