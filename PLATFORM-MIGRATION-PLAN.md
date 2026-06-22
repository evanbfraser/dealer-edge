# DealerEdge Marketing Site → Platform Tenant: Migration Plan v2

**Status:** Proposed direction (v2 supersedes the 2026-05-30 v1)
**Date:** 2026-06-11
**Author:** Claude (Fable 5) with Jason
**Scope:** Move the DealerEdge marketing site (`dealer-edge-website`) onto the DealerEdge platform (`dealerEdge-demo-generator`) as a first-class tenant — dog-fooding CRM, lead comms, attribution, and content — **without losing the cinematic UX and without freezing the fast static-site iteration loop.**

> **⚠️ Historical record (2026-06-11).** Phases 0–3 are largely executed: the DE tenant is live on staging (https://dealeredge.dealeredge.ai) and all 7 pages ship via `export-platform.mjs`. The **here.now preview this doc references is retired** — the platform tenant is now the only deploy target. For current state + the remaining launch punch-list, see [`PROJECT-STATUS.md`](PROJECT-STATUS.md); for the live deploy/build flow see [`CLAUDE.md`](CLAUDE.md). Kept here for the architecture rationale.

> Planning/meta doc. Not a runtime asset — do **not** deploy.

---

## 0. What changed since v1 (why this rewrite)

**The static site** (v1 covered 3 cinematic pages; there are now 6, on a shared engine):

| Then (2026-05-30) | Now (2026-06-11) |
|---|---|
| sales.html + index.html + features.html | + **marketing.html, inventory.html, analytics.html**; features.html fully reworked (flywheel) |
| Each page = bespoke JS | **Shared chassis**: `css/de-act.css` (.de- classes) + `js/de-core.js` (`DE.initActs`, snap, fade, nav, cursor). marketing/inventory/analytics/features all run `DE.initActs`; **only sales.js still has its own `createActController`** |
| Per-page CSS only | `style.css` (all-pages base) + de-act.css + page CSS; shared `.de-includes`/`.de-compare` sections |
| — | 9-page nav system with Platform dropdown; Pricing hidden on the live instance |

**The platform** (378 commits re-verified 2026-06-11, staging @ `1654862e`):

- ✅ **Still true:** explicit routes override the `[[...slug]]` catch-all; `(marketing)/layout.tsx` is force-dynamic (`headers()`); `requireMarketingTenant()`/`isTenantRequest()` live in `lib/tenant/context.ts:416/508`; CSP (`middleware.ts:675-676`) still has `'unsafe-inline' 'unsafe-eval'` — GSAP/Lenis run fine; `/api/leads` contract unchanged (`app/api/leads/route.ts`), honeypot `x-website-hp`, turnstile in body, tenant from Host; persistent `visitor_id` HttpOnly cookie + `/api/tracking` attribution unchanged; posts table free-text type, `PostFilters.type` union still lacks `case_study` (`lib/api/posts.ts:62`); **no `/api/appointments`** (still a build item); **gsap/lenis still not in package.json**.
- 🆕 **Provisioning is now automated:** Spec 134 tenant-ingestion pipeline (`tenant_ingestion_runs/steps`, Trigger.dev orchestrated) + **Spec 135 custom-domain automation (Vercel + Cloudflare attach, CNAME, verify-poll)**. The Sea Ray seed migration remains a valid manual template, but domains no longer need hand-work in the Vercel dashboard.
- 🆕 **Theming:** 6 base themes + `theme_customizations` overrides (v2 = 28 color tokens). Near-black `#000` background + `#ee3a39`/`#4ade80` accents are expressible per-tenant.
- ⚠️ **CSP blocks the CDN script tags.** Every static page loads GSAP/Lenis from cdnjs/jsdelivr; the platform's `script-src` allowlist is `'self'` + Vercel hosts. **The libs must be vendored and served same-origin** (no npm install even required — see §2).
- Spec 084 (tenant-aware lead pipeline) shipped: one `/api/leads` POST → dedup → rep routing → 90s-enrichment-then-AI-SMS (Touch 1) → email (Touch 2) → nurture. The dog-food payoff is real and live.

---

## 1. The decision (v2): vanilla-island routes + an export pipeline

**v1 said:** hand-port each page's JS into React client components (`sales.js` → `useGSAP` hooks, HTML → JSX).

**v2 says: don't port the experience to React at all.** The static site has converged on a self-contained component system (one chassis, per-page `BEAT_ANIMS`, vanilla DOM, zero build step). Treat each cinematic page as a **sealed experience bundle** the platform *hosts*, not source code the platform *rewrites*:

1. **The static repo stays the authoring environment.** The fast `edit → preview` loop survives — this kills v1's biggest accepted trade-off (iteration velocity coupling to the platform repo).
2. **An export script** in the static repo emits, per page: an HTML **fragment** (body content), a **meta.json** (title/description/OG), and copies `css/`, `js/`, `assets/`, and **vendored gsap/lenis/ScrollTrigger** into the platform repo (`public/de-site/` + `lib/de-site/fragments/`). Asset URLs rewritten to `/de-site/...`.
3. **Thin route shells** in the platform render the fragment server-side (`dangerouslySetInnerHTML` in a server component — the markup **is** SSR'd, so LCP/SEO get real HTML) behind the tenant gate, and a small client component boots/tears down the vanilla JS.
4. React never reaches inside the experience. Pixel fidelity is byte-identical because it's the same bytes.

**Why this beats the v1 hand-port:** ~280 KB of working vanilla JS (sales.js alone is 90 KB) and ~570 KB of CSS would have been converted by hand with high regression risk and zero user-visible benefit. The island approach reduces the platform-side work to a pattern built once, and reduces the static-repo work to a boot/destroy contract.

**What stays from v1:** the three-tier model (A code-owned / B CMS content / C forms→platform APIs), the tenant-gating approach, the CWV strategy, the deferred pricing decision, and the case-study CMS mapping.

### The boot/destroy contract (the one real code change in the static repo)

Today each page script runs as an IIFE on load. For Next.js soft navigation, each page must expose explicit lifecycle:

```js
// js/de-core.js gains:
DE.boot(pageKey)    // runs the page init (Lenis, initActs, page BEAT_ANIMS, fade, nav)
DE.destroy()        // ScrollTrigger.killAll() + lenis.destroy() + removes doc/window listeners + clears timers
```

Page scripts wrap their existing init in `DE.pages[key] = { boot, destroy }` instead of self-executing. On the static site, a one-line `DE.boot('sales')` at the bottom of each page preserves current behavior exactly. On the platform, the client loader calls boot on mount and destroy on unmount. Script `<script>` tags persist across soft navs (that's fine — `window.DE` is idempotent; boot/destroy handles re-entry).

---

## 2. Verified platform facts the plan relies on (re-checked 2026-06-11)

- **Routing precedence:** explicit folders beat `app/(marketing)/[[...slug]]`. Current explicit folders include `inventory`, `blog`, `resources`, `brands`, `locations`, `specials`, `events`, `about`, `contact`, `demo`, `legal/*`.
- **⚠️ Route collisions — the two hard ones:**
  - **`/inventory`** — the platform's dealer inventory browser already owns `app/(marketing)/inventory`. The DE deep-dive can't add a sibling. **Branch by tenant inside the existing route:** `if (tenant.id === DEALEREDGE_TENANT_ID) return <DeIslandPage page="inventory"/>` else existing behavior.
  - **`/` (homepage)** — served by the catch-all from the `pages` table. Same tenant-branch pattern (either in the catch-all or a small explicit `page.tsx` that defers to the catch-all renderer for non-DE tenants).
  - `/sales`, `/marketing`, `/analytics`, `/features` are free — new explicit routes, gated with `notFound()` for non-DE tenants. (Note: route folders are global across tenants; the gate is what scopes them.)
- **force-dynamic is unavoidable** (layout calls `headers()`). Accept SSR-per-request; the island pages fetch nothing, so TTFB cost is just render.
- **CSP** (`middleware.ts buildCSP()`): `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel.app …` — **no cdnjs/jsdelivr**. Vendor `lenis.min.js`, `gsap.min.js`, `ScrollTrigger.min.js` into `public/de-site/vendor/` (export script copies them). No `npm i gsap lenis` needed under the island model. **Verify `style-src`/`font-src` permit fonts.googleapis/gstatic** — if not, self-host Inter + JetBrains Mono in the export bundle.
- **Leads:** `POST /api/leads` `{ visitor_id, form_type, form_data{name,email,phone,message,boat_id?…}, page_url, turnstile_token? }` → `{ success, lead_id, is_new, visitor_linked }`. Tenant from Host (never in body). Honeypot header `x-website-hp` must stay unset. Post-submit: routing → 90s enrichment wait → AI SMS → email → nurture (spec 084, live).
- **Attribution:** persistent `visitor_id` is an **HttpOnly cookie** — the island JS can't read it. **Bridge: the server route shell reads the cookie and injects it** (`<div data-de-page="sales" data-visitor-id="…">`); island form code includes it in lead POSTs. (Don't use de-tracker's ephemeral session id for this.)
- **Appointments:** `POST /api/appointments` still does not exist; `createAppointment` is dashboard-only. Build it mirroring `/api/leads` security (tenant-from-Host, honeypot, rate-limit) → upsert lead → insert `appointments` row → stage `appointment`. *Stopgap:* `form_type:'schedule_visit'` to `/api/leads`.
- **Content:** posts type is free-text in the DB; extend the TS union (`lib/api/posts.ts:62` `'blog'|'event'|'promotion'|'resource'`) with `'case_study'`; clone `resources/` index+`[slug]` for `/case-studies`; sitemap + per-tenant RSS already exist as patterns.
- **Provisioning:** Spec 134 ingestion pipeline + Spec 135 domain automation exist. For a one-off internal tenant, **a hand seed migration cloned from `20260502010000_seed_searay_tenant.sql` is still the most controllable path**; use Spec 135's domain attach instead of manual Vercel work. No DealerEdge tenant or `DEALEREDGE_TENANT_ID` constant exists yet.
- **CMS blocks:** 40+ component types, **no raw-HTML/custom-code block** — confirms code-owned routes remain the only fidelity-preserving option. (Registering a `cinematic_act` block in the manifest is a possible *future* phase if acts should ever become editor-editable; out of scope.)

---

## 3. Decision points for Jason (need a call before Phase 2)

### D1 — Chrome: one code-owned DE nav/footer component, shared by islands AND CMS pages ✅ *refined 2026-06-11*

v1 decided "keep standard platform chrome"; an earlier v2 draft leaned "islands keep their baked-in nav." **Jason's CMS requirement settles it (2026-06-11): the site will also have CMS-driven surfaces — blog, resources, case studies, and marketing-engine-generated landing pages — and those are rendered by the platform, so a nav baked into static fragments can't reach them.** Two navs on one site is not acceptable.

**Decision shape: port the static site's nav + footer ONCE as a small code-owned React component pair (DE-tenant chrome), rendered by `(marketing)/layout.tsx` for the DE tenant in place of the dealer chrome (header/footer/announcement/compare components).** The nav is the one piece of the static site worth a real React port — it's small, stable, and rarely changes (scroll-blur, Platform dropdown, mobile nav ≈ a few hundred lines), unlike the act engine. Consequences:

- The export script **always strips nav/footer from fragments** (no double-nav; removes the conditional in Phase 1 step 3).
- CMS pages (blog/resources/landing pages) get the same DE chrome automatically — one brand across cinematic and content surfaces. Their interiors use platform blocks under DE theme tokens (`#000` bg, `#ee3a39`/`#4ade80`, Inter) — close-enough brand for machine-generated content pages.
- The island CSS globals (`body` bg, `cursor: none`, resets) still load on island pages only; verify in the probe that the DE chrome component tolerates them (it will be designed against them anyway). CMS pages don't load island CSS — their dark look comes from theme tokens.
- Nav edits move to the platform repo after cutover (rare; acceptable). The static site keeps its own baked nav for the here.now instance — export simply discards it.

This is also what unlocks the marketing-engine dog-food: campaign landing pages generated for the DE tenant land inside the brand chrome with forms already wired to `/api/leads`.

### D2 — Homepage: port Evan's POC as-is, or rebuild later?

`index.html` (104 KB, canvas hero, 192-frame image sequence ~14 MB, 18 MB dock video) is the heaviest, least-conventional page. Under the island model porting it is cheap (same pattern), so **default: port as-is, compress the media** (the 18 MB mp4 and frame sequence need an optimization pass regardless of host). Rebuilding the homepage on the chassis is a content decision for another day.

### D3 — Pricing: stays deferred

Unchanged from v1 §7: pricing tiers conflict with the locked Offer; the live nav already hides Pricing. Exclude `pricing.html` from the export set.

---

## 4. The phases

### Phase 0 — DE tenant on staging (platform repo)

1. Add `DEALEREDGE_TENANT_ID` (env-backed) + `DEALEREDGE_SLUG='dealeredge'` to `lib/tenant/constants.ts`.
2. Provision via seed migration cloned from the Sea Ray template: tenants row (+ profile trigger), locations → users/tenant_users/team_members for **Bob (Pontoons·Yamaha), Mike (Wake·Malibu·Axis), Sarah (Center consoles·Regulator)** with linked `user_id`s (routeLead drops null-user reps), `theme_customizations` (base `apex`; `#000` bg, `#ee3a39`, `#4ade80`), published `homepage` pages row + `site_config`, SMS-minimal (features.sms, tenant_phone_numbers, ToS v1, shared keys).
3. Domain: use the Spec 135 domain-attach automation for the staging host.
4. Smoke test: host resolves to DE tenant id; zero Premier leakage; test lead (Wakesetter inquiry) routes to Mike; notification recipient exists.

**Exit:** DE tenant reachable, isolated, lead-routes correctly.

### Phase 1 — Make the static repo export-ready (static repo)

1. **Finish the controller merge:** port sales.js's `createActController` onto `DE.initActs` (the long-pending chassis Phase-2 item). One engine across all five act pages before anything ships to the platform.
2. **Boot/destroy contract:** `DE.boot(page)` / `DE.destroy()` per §1; page scripts register `DE.pages[key]` instead of self-executing IIFEs. Verify the static site still behaves identically (it's the regression canary).
3. **Export script** (`scripts/export-platform.mjs`): per page emit `fragment.html` (body minus `<script>` tags, minus nav/footer — the platform renders the DE chrome component per D1) + `meta.json`; copy css/js/assets + vendored lenis/gsap/ScrollTrigger; rewrite asset paths to `/de-site/...`; write into the platform repo working tree. Idempotent — re-run = content update.
4. **Forms wiring (in the island JS):** demo modal / CTAs / Act-3 SMS demo POST to `/api/leads` (`form_type:'request_demo' / 'text_us'`), reading `data-visitor-id` off the page wrapper; newsletter → `/api/newsletter`; booking → `/api/appointments` once built. Keep these no-op (current behavior) when the bridge attrs are absent, so the static here.now instance keeps working.

**Exit:** one engine, lifecycle-clean pages, `export-platform` produces a bundle; static site unchanged in behavior.

### Phase 2 — Platform rails (platform repo)

1. **Island host pattern (build once):** `lib/de-site/` fragment reader; `<DeIslandPage page="…">` server component (tenant gate → fragment + meta → visitor-id bridge attr); `<DeExperienceLoader>` client component (injects `/de-site/vendor/*` + `/de-site/js/*` script/link tags once, `DE.boot(page)` on mount, `DE.destroy()` on unmount).
2. **Routes:** new gated `app/(marketing)/{sales,marketing,analytics,features}/page.tsx`; tenant branches inside the existing `/inventory` route and the homepage path; `generateMetadata` from meta.json.
3. **DE chrome components (per D1):** port the static nav + footer to React (`DeHeader`/`DeFooter` — scroll-blur, Platform dropdown, mobile nav); tenant check in `(marketing)/layout.tsx` swaps them in for the DE tenant on ALL routes (islands + CMS pages alike).
4. **`POST /api/appointments`** (the one backend build item).
5. **`case_study` content type:** TS union + `/case-studies` index/detail cloned from resources + sitemap entry.
6. **Probe page first:** ship **analytics or inventory** (the cleanest `DE.initActs` instances) end-to-end on staging before the rest — validates fragment SSR, CSP, fonts, Lenis-vs-platform interactions, soft-nav cleanup, and CWV with the least page-specific risk. *(v1 said sales-first; under the island model the risk is in the pattern, not the page, so probe cheap and iterate.)*

**Exit:** probe page pixel-true on the DE staging host; lead POST from the island creates a routed lead with attribution.

### Phase 3 — Page rollout

Order: probe page → **sales** (own hero, heaviest JS) → marketing → features → inventory/analytics (whichever wasn't the probe) → homepage (with media compression pass). Per-page acceptance: visual parity vs. static site (use the visual-QA harness in `C:\tmp\de-shots`), green CWV (SSR'd LCP, lazy-booted animation, reserved pin heights), forms → real leads, clean unmount across soft navigations, mobile pass (≤1100px pinned behavior).

### Phase 4 — Content + cutover

1. Seed case studies (`type:'case_study'`, mapping: headline→title, image→featured_image, body→blocks, dealer/stats/quote→metadata, SEO→seo jsonb) + initial blog/resources via `createPost({useServiceRole:true})` script.
2. Redirects table: `*.html` → clean routes; `case-study.html?id=` → `/case-studies/[slug]`.
3. Production tenant (repeat Phase 0 + Spec 135 prod domain), per-tenant sitemap/robots/OG/llms.txt verify, launch, monitor CWV field data + the 90s-SMS path end-to-end. Lawful production SMS still depends on Spec 094 (10DLC) — gate or demo-only if unbuilt at launch.

---

## 5. CWV strategy (unchanged guardrail, island-flavored)

- **LCP:** fragments are server-rendered HTML — the hero markup paints before any JS. Preload the hero image/video poster per page.
- **INP/TBT:** vendor libs + page JS load after hydration via the client loader (defer/idle); they never block first interaction.
- **CLS:** pinned-section heights are fixed by the `de-act--N` classes — already reserved.
- **TTFB:** force-dynamic per-request render; island pages fetch nothing, fragment reads are local-disk — keep the fragment reader `cache()`d per process.
- **Media:** compress `boat-trailer-dock-2.mp4` (18 MB) and the 192-frame sequence before homepage launch; serve via `public/` (plain `<img>`/`<video>` inside the island — `next/image` doesn't apply).
- **Budget:** green field CWV, not a 95 Lighthouse score — the cinema is heavy by design and would be anywhere.

---

## 6. Risk register (v2)

| Risk | Sev | Mitigation |
|---|---|---|
| CDN scripts blocked by CSP | **High (certain)** | Vendor gsap/lenis/ScrollTrigger same-origin in the export bundle |
| Route shadowing (`/inventory`, `/`) breaks dealer tenants | High | Tenant-branch inside existing routes; never replace them; smoke-test Premier after every route change |
| Island globals (body bg, `cursor:none`, resets) fight platform styles/Tailwind preflight or the DE chrome | Med | DE chrome components (D1) are designed against the island CSS; CMS pages never load island CSS; probe page validates |
| Soft-nav leaks (ScrollTrigger pins, Lenis RAF, doc listeners) | Med | `DE.destroy()` contract; test repeated navigation in the probe |
| Fonts blocked (style-src/font-src) | Med | Verify in probe; self-host Inter/JetBrains Mono in bundle if needed |
| Export drift (static repo edited, platform stale) | Med | Export script is idempotent + one command; add a repo-root note; later a CI hook |
| Wrong visitor id → attribution no-ops | Med | Server-side cookie bridge via data attr; never de-tracker's ephemeral id |
| No appointments endpoint | Med | Build in Phase 2; stopgap `schedule_visit` form_type |
| force-dynamic TTFB | Low | No data fetching on island pages |
| CSP hardened later (nonces) | Low/Med | Watch `buildCSP()`; island scripts are static files ('self'), inline-style writes are the exposure |
| 10DLC SMS unbuilt for prod | Med | Spec 094 dependency; gate at launch |
| Cross-repo coordination (platform discipline: staging-first, migrations, specs) | Med | Land platform changes as a spec'd branch; align with platform owners on the layout tenant-check and route branches |

---

## 7. Sequenced checklist

- [ ] **P0** `DEALEREDGE_TENANT_ID` + slug constants
- [ ] **P0** Seed migration (tenant, reps, theme, homepage row, SMS-min) + Spec-135 domain attach
- [ ] **P0** Isolation + lead-routes-to-Mike smoke test
- [ ] **P1** Merge sales controller into `DE.initActs`
- [ ] **P1** `DE.boot`/`DE.destroy` lifecycle on all pages (static site behavior unchanged)
- [ ] **P1** `scripts/export-platform.mjs` (fragments, meta, assets, vendored libs, path rewrite)
- [ ] **P1** Island form wiring (leads/newsletter/visitor-id bridge, no-op fallback on static host)
- [ ] **P2** `DeIslandPage` + `DeExperienceLoader` host pattern
- [ ] **P2** Routes: new gated 4 + tenant branches in `/` and `/inventory`; chrome per **D1**
- [ ] **P2** `POST /api/appointments`
- [ ] **P2** `case_study` union + `/case-studies` routes + sitemap
- [ ] **P2** Probe page (analytics or inventory) shipped + validated on staging
- [ ] **P3** Rollout: sales → marketing → features → remaining deep-dive → homepage (media compressed)
- [ ] **P4** Seed case studies/blog; redirects; prod tenant + domain; SEO verify; launch + monitor

---

*v2 written 2026-06-11 by Claude Code (Fable 5) after fast-forwarding the platform repo 378 commits (staging @ `1654862e`) and re-verifying v1's §3 facts. Core change: hand-port-to-React replaced by the export-pipeline + vanilla-island architecture; page inventory updated to the 6-page shared-chassis reality; CSP/CDN, route-collision, and visitor-id-bridge findings added. v1 (2026-05-30, Opus 4.8) is in git history.*
