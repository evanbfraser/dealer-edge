# DealerEdge Site — Project Status & Launch Handoff

**Living doc.** Keep it current — it's the single place that answers "where are we and what's left to go live." Planning/meta only; **not a runtime asset, don't deploy it.**

_Last updated: 2026-07-02 by Claude Code (Fable 5)._

---

## 🚀 LAUNCHED — the site is LIVE at https://www.dealeredge.ai (verified 2026-07-02)

`dealeredge.ai` serves the platform tenant in production (apex 308→www). Prod and staging serve the same build (`20260702d` verified on both), so staging pushes are reaching prod. The doc below is now the **post-launch** punch-list; the original launch goal is met.

### Verified in production, 2026-07-02 (curl + WebKit iPhone emulation)

- ✅ Today's mobile scroll fixes are live (refresh-loop kill, native touch scroll, hero per-beat fit, marine stack) — sales all 6 hero beats fit, zero at-rest churn; marketing/inventory/analytics acts lock + animate on mobile, zero overflow, zero churn.
- ✅ F1 partially verified fixed: `/sales` body has **no** `.html` cross-links.
- ✅ F2 fixed: unknown URLs return real **HTTP 404** (was soft-200).
- ✅ S1 largely fixed: homepage has `meta description` + `og:image` (308→200 resolves).
- ✅ C1 resolved by seeding: `/blog`, `/events`, `/specials` no longer show empty states.
- ✅ Fabricated homepage proof band (500+/200%/98%) is gone from prod.

### Lighthouse-mobile optimization pass (2026-07-03, Claude Fable 5)

Perf/a11y/BP/SEO before → after (staging, LH 13.4 mobile, clean runs): home **63→87**/96/96/100, sales 77→78/96/100/**92→100**, marketing **71→86**/96/100/**92→100**, inventory 89→90/96/100/**92→100**, analytics 89/96/100/**92→100**, features 77→79/96/100/100, roi 85→87/96/100/100, case-studies **74→80** (**LCP 13 s→4.8 s**)/96/100/100. Shipped (static `dd54455`, platform `6fd538c99` + `d86c530b5`; also unbroke the staging build — #996 shipped a missing `createServiceClientOrThrow` import in `lib/api/inventory.ts`, every deploy since had failed):

> ⚠️ Lighthouse-harness gotcha for future runs: headless-Chrome runs on this machine intermittently report a phantom **CLS of exactly 0.5180348102620734** (no attributed element; roams between pages/runs; NOT reproducible with a real PerformanceObserver on an emulated mobile device). If a page suddenly shows CLS 0.518, re-roll before believing it. Home's "CLS 0.518" in the baseline was this artifact too.

Also this pass: the premier case-study card was a **1.16 MB PNG** (the case-studies LCP image) — re-encoded to a 117 KB JPEG at identical 1536×1024 resolution, uploaded alongside (`premier-watersports-card.jpg`), post `7c3a6914` repointed via MCP. The old PNG still serves the post's `og_image`.

**Contrast pass (same day, Jason-approved — A8/A9 CLOSED):** brand red `#ee3a39` → **`#e02f2e`** (4.55:1 white-on-red) across all static-repo CSS + demo-modal, AND the DE tenant's custom CMS theme (`theme_customizations` row `fc815fd6` — primary/accent/ring/error, direct DB update; surfaces after the 1h `unstable_cache` TTL). `--text-dim`/`--de-dim`/direct 0.45-alpha whites → **0.48** (~4.8–5.0:1); home's `cs-detail-attribution` 0.4 → 0.48. The logo SVG keeps the original red (contrast-exempt). **Result: sales AND case-studies measured a11y 100 / contrast PASS** (case-studies needed one follow-up — darkening primary flipped the DE CTA-card kickers below 4.5 as red-text-on-dark-card, since no single red passes both directions; those two DE-only kickers now use a lighter `#ff6b6a` tint, platform `d3f52132f`). Remaining sub-100 causes, both flaky-by-design: (1) fold-boundary `data-fade` entrance animations get snapshotted mid-fade on some runs (resting states all pass now); (2) ~~the `.de-scroll-hint` "Scroll" cue~~ **CLOSED (Jason-approved, same day):** the hint's `.is-visible` opacity went 0.55 → 1 (label now ~5:1 via `--text-dim` alone, still a quiet cue; he wanted it more visible anyway) — static `86f43f2`, platform `85d4dd502`; roi re-measured **a11y 100 / contrast PASS**. Static `e8d6e8c`+`5a921d0`; platform `fd0e5f471`+`af0c46d29` (cherry-picked via temp worktrees — a concurrent session was working `_stg-phase0b` in the same checkout). Known quirk: Git-Bash `sed -i` strips CRLF and `build-sales-css.js` markers hardcode `\r\n` — restore CRLF on swept CSS before `npm run minify`.

- **Perf:** removed the redundant Google Fonts CDN stylesheet from the DE layout branch (~780 ms render-blocking on every page; de-chrome.css already self-hosts the same variable fonts — woff2 preloads added); explicit dimensions on nav/footer logos + video-thumb + analytics hero shot (the unsized footer logo was the homepage's entire **CLS 0.518**); case-studies first card image eager + `fetchpriority=high` (was lazy → 13 s LCP); de-chrome.css ships minified (20.7 → 13.4 KB).
- **SEO:** meta descriptions added to the 4 deep-dive islands (92 → 100); **DE-tenant sitemap** — it was advertising dealer routes (`/inventory/new`, `/financing`, demo boat listings) on dealeredge.ai; now island pages + `/demo` + CMS content. Canonical/OG/robots verified correct.
- **BP:** home's console error (React #418) — **CORRECTION (same day):** the initial GTM attribution was falsified on prod (www.dealeredge.ai fires GTM; the error occurred there even with googletagmanager fully blocked, and skipped runs with GTM on). It's a **flaky, timing-dependent hydration race on the homepage** (~50% of loads), most likely the island CSS-load race in the DeExperienceLoader reveal path. Cosmetic console noise; costs 4 BP points only on runs that catch it. FYI: DE's GTM is `GTM-W2KGVGTN` (site_config.seo), fires only on allowlisted hosts (prod domain, not staging).
- **A11y (96 everywhere):** the ONLY failing audit is color-contrast = the A8/A9 decisions below (visual, needs Jason). Precise data: white-on-`#ee3a39` = 3.96:1 (all `.btn-primary`/boat-CTA surfaces, every page); minimal passing brand red ≈ `#e02f2e` (4.55:1). `--text-dim` 0.45 → 4.42:1 on black / 4.48:1 on `#0a0a0a`; bump to **0.47–0.48** passes (4.8–5.0:1). Also: roi `.de-scroll-hint__label` (#474747, 2.13:1) and home `#cs-detail-attribution` (#6e6e6e, 3.81:1). Home's sub-2.0 ratios (stat-number/stat-label/span.dim) are entrance-animation snapshots, not resting states.
- **New finding (route-level) — CLOSED 2026-07-03 (platform `96c37f6c3`):** eleven dealer-shaped routes rendered live dealer UI on dealeredge.ai (three Premier-branded: `/inventory/new`, `/inventory/used`, `/reviews`, `/brands` via the legacy `getSiteConfig()` fallback; plus demo-boat detail pages, trade-in, locations, compare, faqs, favorites). Fixed in middleware: the DE tenant rewrites all of them to the `/not-found-404` shim (real HTTP 404, DE chrome), placed before the inventory brand/category rewrites; `/inventory` root stays (the product island). **The seeded demo boats are FUNCTIONAL, keep them:** the sales-page live SMS demo (`/api/de-demo/start`) grounds the AI on a real inventory row. **2026-07-03 (Jason-approved): the canon 2022 Malibu Wakesetter 23 LSV is now seeded** (`2022-malibu-wakesetter-23-lsv-demo`, $162,900, Knoxville) — the endpoint prefers it by name (its `DEFAULT_BOAT`), so the SMS demo now matches the John Castillo story instead of falling back to the Moomba Tykon. **All 9 demo boats got full specs/features/descriptions** (engines, surf systems, seating, capacities — brand-accurate, demo-grade) so the AI can answer real product questions; the Spec 142 gate only lets it state grounded facts. The demo reads the DB, not the route, so the 404 gate doesn't affect it and no SMS contains links. ⚠️ Forward risk: the prospect chat's inventory cards link `/inventory/${slug}` (`components/chat/inventory-card.tsx`) — if the DE site ever gets the chat widget, those links will 404 on this tenant; render cards unlinked for DE or exempt detail routes then. Also removed `'about'` from `RESERVED_TOP_LEVEL` — `app/(marketing)/about/` has no page.tsx, so `/about` now goes through the top-level CMS shim (real 404 when unseeded; tenants with an about page, e.g. Premier, render unchanged — verified live on premierwatersports.net). All 12 gated paths verified 404 on DE; all 14 kept paths verified 200.

### Open post-launch items (re-triaged 2026-07-02)

1. ~~**Lead notifications**~~ **CLOSED — verified 2026-07-03:** Jason's DE team-member prefs now read `email_digest: daily`, `sms_notifications: true`, `pwa_push: true`, user linked, phone set. (This item was stale — prefs were flipped on after the 07-02 triage.)
2. **Real-iPhone confirmation** of the sales-page scroll feel (the whole 2026-07-02 fix set was verified in emulation; the reporter's device should re-test).
3. **A11y set (A1–A9) not re-verified** — chrome landmarks/labels/skip-link/tab-order live in the platform repo; contrast decisions (A8 red, A9 `--text-dim`) still need Jason. Re-run the autonomous QA against prod to re-triage.
4. **S2/S3 (per-page OG/canonical/sitemap) not re-verified** across all island routes — worth one QA pass now that it's public.
5. **Platform script error on every page (minor):** `navigator.storage.persisted` throws a TypeError in WebKit contexts where `navigator.storage` is undefined (headless; possibly iOS private browsing) — add a guard in the platform repo.
6. **Cascade-inversion hazard (architectural, latent):** on the platform the island loader injects `<page>-critical.min.css` at the END of `<head>`, AFTER the runtime-loaded late CSS — late-only rules lose specificity ties they win on the static site. Sales is fixed (narrow cohort blocks marker-extracted into critical); marketing/inventory/analytics screenshots look clean today, but any future "works static, broken on platform" CSS bug → check `document.styleSheets` order first (memory: `reference_de-critical-late-cascade-inversion.md`).
7. **10DLC / live SMS demo** (Spec 094 check) — unverified; the sales Act 3 live-text mode needs a compliant number in prod.

---

## The goal *(met 2026-07-02 — kept for context)*

Get the DealerEdge marketing site **fully live at `dealeredge.ai`**. It already runs as a platform tenant on staging — **https://dealeredge.dealeredge.ai** — inside the `dealerEdge-demo-generator` Next.js app (vanilla-island architecture; see `PLATFORM-MIGRATION-PLAN.md` and CLAUDE.md → *Cross-repo*). "Launch" = production tenant + the `dealeredge.ai` domain attached + the punch-list below cleared.

### The two gates

1. **Quality gate (this effort):** clear the autonomous-QA punch-list (SEO, a11y, broken links, empty pages). Fixes split across **two repos** — see CLAUDE.md → *Cross-repo*. ~half live in the platform repo, not here.
2. **Launch gate (separate, not QA-visible):** Phase 4 of the migration plan — **production tenant** (clone the staging seed) + **`dealeredge.ai` domain attach** (Spec 135 automation) + link reps Bob/Mike/Sarah + 10DLC SMS check (Spec 094). QA can be all-green and the site still isn't "live at dealeredge.ai" until this is done.

---

## Status snapshot

| Area | State |
|---|---|
| Static site (this repo) | ✅ Self-contained authoring source + regression canary; preview locally (`npm run benchmark`, :4173). here.now preview (`mantra-harbor-8vkd`) **retired**. |
| Platform tenant (staging) | ✅ Live + smoke-tested — https://dealeredge.dealeredge.ai (PRs #721 + #724 merged) |
| Performance pass | ✅ Done 2026-06-20 — all pages LCP ~150–340 ms, CLS ~0, transfer mostly <500 KB; homepage 6.8 MB→337 KB. See CLAUDE.md → *Performance & build pipeline* |
| Pages exported to platform | ✅ sales, marketing, inventory, analytics, features, **index**, roi |
| Autonomous QA | 🔄 In-depth audit running (sample run `075a889e` triaged below) |
| Quality punch-list | 🔴 Open — see below |
| Production tenant + `dealeredge.ai` domain | ⬜ Not started (launch gate) |
| Reps linked for lead routing | ⬜ Bob/Mike/Sarah `user_id` NULL → leads land unassigned |

---

## Launch punch-list

Triaged from the live QA run `075a889e` (2026-06-20, against staging) + crawl `SITE-INVENTORY.md`. **Repo** = where the fix lives. Update **Status** as we go.

### 🔴 Functional (highest priority — conversion/navigation broken)

| # | Issue | Repo | Status |
|---|---|---|---|
| F1 | **Internal cross-links broken on platform.** Page-body links still use `.html` (`/sales.html` → soft-404) and hero/CTA `href`s render as `/null` (analytics "Show me my numbers", inventory "Show me my inventory", sales "Submit inquiry", resources "All"/"Guide"). Buyers click → dead end. | both (export path rewrite + clean-route redirects) | ☐ open |
| F2 | Soft 404 — unknown URLs return **HTTP 200** with a "Page Not Found" body. SEO + the `.html` links above land here looking "successful." | platform (`not-found`) | ☐ open |
| F3 | Sales "Submit inquiry" flagged as a dead stub. **False positive** — it's the Act 1 form *animation*, not a real CTA. Fix = mark it `inert`/`aria-hidden` so QA + AT stop treating it as actionable. | this repo (`sales.html`) | ☐ open |

### 🟠 Content / CMS surfaces

| # | Issue | Repo | Status |
|---|---|---|---|
| C1 | **Blog / Events / Specials / Resources are empty** ("No posts found", "No upcoming events") but exposed in the utility nav. Visitors hit "check back soon" pages. **Decision needed:** hide from nav for launch, or seed real content (Premier Watersports). | platform (nav config / CMS seed) | ☐ needs decision |
| C2 | Blog `og:image` → `https://dealeredge.ai/images/og/blog.jpg` returns 404 (twitter:image too). | platform | ☐ open |

### 🟠 SEO / meta

| # | Issue | Repo | Status |
|---|---|---|---|
| S1 | Homepage `/` missing `<meta name="description">`, `og:url`, `og:image`, `og:description`, `og:type`, `twitter:description`, canonical. | platform (homepage route metadata) | ☐ open |
| S2 | Verify per-page OG/canonical/sitemap/robots across all island routes once homepage is fixed (deep-dive `meta.json` is exported from this repo's `<head>`). | both | ☐ open |
| S3 | **OG images don't ship.** `export-platform.mjs` only copies *relatively*-referenced assets, so absolute OG URLs (`features.html` → `system-loop-og.png`, the here.now domain now swapped to `dealeredge.ai`) aren't copied → they 404 (same class as the blog OG, C2). Fix by referencing them relatively, copying manually into the export, or setting OG images via platform route metadata. | both | ☐ open |

### 🟠 Accessibility (WCAG — mostly chrome, site-wide)

| # | Issue (WCAG) | Repo | Status |
|---|---|---|---|
| A1 | No `<header>`/`role=banner` around the nav (1.3.1) | platform (`DeHeader`) | ☐ open |
| A2 | Navs lack `aria-label` — primary + footer both announce "navigation" (1.3.1) | platform (`DeHeader`/`DeFooter`) | ☐ open |
| A3 | Skip link is `display:none`, never focusable (2.4.1) | platform (layout) | ☐ open |
| A4 | Navbar **tab order** wrong — utility links tab before logo (2.1.1) | platform (`DeHeader` DOM order) | ☐ open |
| A5 | Platform dropdown button has no focus ring (2.4.7) | this repo CSS (`.nav-dropdown-trigger:focus-visible`) → re-export | ☐ open |
| A6 | Footer newsletter / chatbot inputs unlabeled (3.3.2) | platform (`DeFooter`) + this repo (chatbot) | ☐ open |
| A7 | Demo-modal inputs `#ms-name/#ms-email/#ms-phone` unlabeled (1.3.1) | this repo (`index.html` / `demo-modal.js`) | ☐ open |
| A8 | **Contrast — red nav/CTA** white-on-`#ee3a39` = 3.96:1 (need ≥4.5:1). Brand-sensitive: darkening `--accent` recolors the whole "without DealerEdge / pain" semantic. Decide nav-only vs global. | this repo (`style.css`) → re-export | ☐ needs decision |
| A9 | **Contrast — secondary text** `--text-dim: rgba(255,255,255,0.45)` = 4.41:1 (need ≥4.5:1). Bump to ~0.47. Used site-wide. | this repo (`style.css`) → re-export | ☐ open |

> Severity counts from run `075a889e`: 0 critical, ~14 major, ~4 minor. Full detail: `.bonsai-qa/runs/live-smoke/QA_FIX_REQUEST.md`. A deeper run is in progress — re-triage when it lands.

---

## Open decisions (need Jason)

1. **Empty CMS pages (C1):** hide Blog/Events/Specials/Resources from nav for launch, or seed content? (Recommend: hide for launch, re-add as content ships.)
2. **Red contrast (A8):** the 3.96:1 red is the brand `--accent`. Darken globally (cleanest a11y, shifts the whole pain/red palette) or only the chrome nav/CTA surfaces (keeps in-page red, scopes the fix)? (Recommend: darken only the small white-on-red text surfaces — nav bar + CTA pill — leave large in-page red untouched.)
3. **Launch sequencing:** clear the full QA punch-list on staging first, then stand up the prod tenant + `dealeredge.ai` — or provision prod in parallel? (Recommend: fixes on staging → re-QA green → then prod cutover.)

---

## How to work this (pointers, not duplication)

- **Repo routing, export flow, tenant IDs, platform discipline** → CLAUDE.md → *Cross-repo: static site → platform tenant*.
- **Build before deploy/export** → `npm run minify` (mandatory) → CLAUDE.md → *Performance & build pipeline*.
- **Get a page-body change live on staging:** edit here → `npm run minify` → `node scripts/export-platform.mjs` → commit/push `dealerEdge-demo-generator` (staging-first).
- **Platform runbook (IDs, Vercel scope, gotchas):** memory `project_de-site-platform-migration.md`.
- **Visual parity check:** `C:\tmp\de-shots` harness (memory `reference_visual-qa-harness.md`).

---

## Changelog

- **2026-07-02** — **Site is LIVE at dealeredge.ai.** Marked launched; re-triaged the punch-list against prod (see top). Same day: fixed the mobile scroll death spiral (late-loaders ran `ScrollTrigger.refresh()` on every scroll event — self-sustaining loop; plus Lenis→native-scroll shim on touch, snap back to fine-pointer-only, `ignoreMobileResize`, `visibility:hidden` inactive beats, mobile backdrop-filter cuts), the hero cohort per-beat fit (`100svh` pin + `fitCohortViz()` grid cap), the marine callout mobile stack + button-font fix, and the platform **cascade inversion** (critical CSS loads LAST on the tenant → all mobile cohort rules now duplicated into sales-critical). Static `8ad1d83`+`b430a53`+`20dab4d`; platform `47eccce69`+`375a45e9a`+`288976d2a`.
- **2026-06-21** — Created this doc; consolidated cross-repo + perf notes into CLAUDE.md; deleted the stale `MORNING-REVIEW.md` (2026-06-12). Triaged live QA run `075a889e` into the punch-list above. Confirmed: fixes will be driven across **both** repos.
