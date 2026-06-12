# Morning Review — Overnight Migration Setup (2026-06-12)

**TL;DR:** Both halves of the migration are built. The static site got its lifecycle + export pipeline (live on here.now, behavior unchanged, all verified headless). The platform got the full island host — tenant constants, seed migration, DE chrome, 6 routes, appointments API, case studies — on branch **`feat/dealeredge-tenant-site`**, validated by typecheck + production build. Nothing touched `staging`/`master`, no database was modified, no deploys happened.

> This file is a session artifact — read it, then feel free to delete it. Not a runtime asset; don't deploy it.

---

## What shipped

### Static repo (`dealer-edge-website`, pushed to `main`)

| Commit | What |
|---|---|
| `1af4397` | **DE.boot/DE.destroy lifecycle** — all 5 deep-dive pages + demo-modal register with the engine; long-lived listeners/intervals/rAF loops route through `DE.on/DE.interval/DE.rafLoop` so an SPA host can tear a page down cleanly. **Export script** (`scripts/export-platform.mjs`) packages the 5 pages into the platform repo. **Demo modal** POSTs a real `/api/leads` lead when platform-hosted (no-op on here.now). |
| `4107673` | Export also emits `de-chrome.css` (nav/footer/buttons extracted from style.css by section) + ships the nav logo; `initMobileNav()` guarded (mobile-nav.js doesn't ship to the platform). |

**Verified headless:** all 5 pages boot with zero JS errors; sales destroy→re-boot is symmetric (8→0→8 ScrollTriggers, listeners detached, beats + replay gate work after the cycle). Live here.now spot-checked clean.

### Platform repo (`dealerEdge-demo-generator`, branch `feat/dealeredge-tenant-site` — 3 commits, NOT merged)

| Commit | What |
|---|---|
| `104e92d9` | `DEALEREDGE_TENANT_ID`/slug constants + `isDealerEdgeTenant()`; **seed migration** `20260611100000_seed_dealeredge_tenant.sql` (tenant, HQ location, Bob/Mike/Sarah with canon brand assignments, apex/near-black theme, homepage row, site_config, staging domain) — **written, NOT applied**; first export bundle. |
| `640ea880` | **Island host** (`lib/de-site/fragments.ts`, `DeIslandPage` + `DeExperienceLoader`), **DE chrome** (`DeHeader`/`DeFooter` + tenant swap in the marketing layout), **routes** (`/sales /marketing /analytics /features` new + tenant branches in `/inventory`), **`POST /api/appointments`**, **case studies** (`case_study` type + `/case-studies` index/detail + sitemap). |

**Validated:** `tsc --noEmit` — zero errors in touched files (64 pre-existing error lines in `.next/types`/e2e/test mocks, untouched). Production `next build` — see the build-verdict line at the bottom of this doc. Note: local `node_modules` was stale after the 378-commit pull; I ran `npm install` (a `bcryptjs`/`zipcodes` "module not found" on build means someone needs to `npm install`).

---

## How the island works (30-second version)

The static repo stays your authoring environment. `node scripts/export-platform.mjs` packages each page as an HTML fragment + metadata + assets into the platform repo. A platform route checks the tenant: DealerEdge gets the fragment server-rendered (real HTML for SEO) plus a tiny client loader that boots/destroys the page's vanilla JS; every other tenant falls through to exactly what they had before. Forms inside the islands POST real leads because the route shell injects the visitor cookie via a `data-` attribute bridge.

---

## How to test (when you're ready)

1. **Static site (already live):** browse https://mantra-harbor-8vkd.here.now/ — should be pixel-identical to yesterday.
2. **Platform branch locally:**
   ```
   git checkout feat/dealeredge-tenant-site && npm install
   # apply the seed migration to your LOCAL db only (scripts/reset-local.ts path),
   # set DEFAULT_TENANT_ID=36304ab1-6682-4dbc-8854-d101c6964483 in .env.local,
   npm run dev   # then visit /sales /marketing /inventory /analytics /features
   ```
3. **Check a dealer tenant is unharmed:** with default env (Premier), `/inventory` must show the boat browser, `/sales` must 404 (no CMS page) — the fall-through pattern.
4. **Lead flow:** submit the demo modal on `/sales` → lead should appear in the dashboard, routed to Mike for a Wakesetter inquiry **after** you link Bob/Mike/Sarah to real users (see below).

---

## Needs your call (deliberate gaps, not oversights)

1. **Rep user-linking is a post-deploy step.** The seed creates Bob/Mike/Sarah with `user_id = NULL` (the Premier-seed pattern — migrations don't create auth users). Lead routing skips NULL-user reps, so until you link them in the dashboard, leads land unassigned.
2. **Homepage isn't exported yet.** Evan's `app.js` (index, also used by pricing.html) has no boot/destroy lifecycle — it's multiple IIFEs + DOMContentLoaded + canvas/frame-sequence code. Port it when homepage rollout comes up (mechanical, ~1–2h, pattern established). Until then the DE tenant's `/` falls to the CMS homepage row (seeded empty — renders blank on purpose). Option: redirect `/` → `/sales` on the DE tenant in the meantime.
3. **The Act-3 "try-it" SMS demo isn't wired to `/api/leads`.** It collects no real contact info — a junk-lead generator if wired as-is. Product call: add a phone-capture step, or leave it scripted.
4. **Asset weight:** the bundle ships ~37 MB (mostly `boat-trailer-dock-2.mp4` at 18 MB). Fine for staging; compress before production (planned anyway).
5. **Google Fonts on platform CSP:** the chrome + islands load Inter/JetBrains Mono from fonts.googleapis.com. The CSP's `style-src` needs verifying on a running instance — if blocked, self-host the fonts in the export bundle (small change).
6. **`features.js` anims never set `.is-playing`** (pre-existing, unrelated to tonight) — that page may quietly restart animations during in-beat scrolling. Worth an audit pass someday.
7. **The migration is unapplied everywhere.** Applying it to staging's DB is your call + the platform team's process.

---

## Suggested next steps (in order)

1. Review the platform branch; PR it to `staging` when you're comfortable (it's additive — the only shared files touched are the marketing layout, inventory page, posts.ts union, sitemap).
2. Apply the seed migration to staging; attach a staging host via the spec-135 domain automation; link the three reps.
3. Probe-test one island page on the staging host (analytics or inventory), check fonts/CSP, soft-nav cleanup, CWV.
4. Then the rollout order from the plan: sales → marketing → features → homepage (after the app.js lifecycle port).

---

**Build verdict:** ✅ `next build` passes on the branch (after `npm install` — local node_modules was stale from the 378-commit pull, and after switching the DeHeader demo CTAs to `next/link` for the lint gate). All 7 new routes in the manifest as dynamic: `/sales /marketing /analytics /features /case-studies /case-studies/[slug] /api/appointments`. Two intentional lint *warnings* remain on the marketing layout (manual `<link>` stylesheet + page-level Google Fonts) — that's the island architecture serving unbundled CSS from `public/de-site/`; call it out in the PR description. Branch pushed: `feat/dealeredge-tenant-site` (4 commits, PR link on GitHub).
