# DealerEdge Site — Project Status & Launch Handoff

**Living doc.** Keep it current — it's the single place that answers "where are we and what's left to go live." Planning/meta only; **not a runtime asset, don't deploy it.**

_Last updated: 2026-06-21 by Claude Code (Opus 4.8)._

---

## The goal

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

- **2026-06-21** — Created this doc; consolidated cross-repo + perf notes into CLAUDE.md; deleted the stale `MORNING-REVIEW.md` (2026-06-12). Triaged live QA run `075a889e` into the punch-list above. Confirmed: fixes will be driven across **both** repos.
