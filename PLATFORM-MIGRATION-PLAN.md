# DealerEdge Marketing Site → Platform Tenant: Migration Plan

**Status:** Approved direction, pre-execution
**Date:** 2026-05-30
**Author:** Claude (Opus 4.8) with Jason
**Scope:** Move the DealerEdge marketing-site POC (`dealer-edge-website`) onto the DealerEdge platform (`dealerEdge-demo-generator`) as a first-class tenant, so the site eats its own dog food — CRM, lead comms, marketing automation, attribution, blogs/resources — **without losing the bespoke cinematic UX that differentiates the brand.**

> This is a planning/meta doc. It is **not** a runtime asset — do **not** deploy it to here.now.

---

## 1. The decision (and why)

**Architecture:** The marketing site becomes a tenant of the platform. The bespoke, art-directed pages (sales pillar, homepage, features explorer) are built as **code-owned React routes gated to the DealerEdge tenant** — hand-crafted, GSAP/ScrollTrigger/Lenis ported into client components — **not** generic CMS blocks. The content-shaped surfaces (case studies, blog, knowledge resources, ordinary marketing sections) use the platform's CMS/content models. All forms POST into the platform's lead/CRM pipeline.

**Why this shape:**
- **Fidelity is preserved.** GSAP/ScrollTrigger/Lenis in React client components is a standard pattern; your `sales.js` ports nearly verbatim into a `useEffect`/`useGSAP` hook. Branding is just CSS and comes over wholesale (the `.s-` namespace already isolates it).
- **The "block-flattening" risk is avoided.** The danger of losing the look came from forcing the cinema through the CMS block model (fixed prop schemas, editor, the global block catalog). Code-owned routes skip all of that.
- **Full dog-food.** Because the pages are routes *inside the platform app*, lead/attribution calls are genuinely same-origin (the CORS/host constraint that would break a separate static origin doesn't apply), and you inherit per-tenant SEO, sitemap, theming, blog/resources for free.
- **The CWV cost is intrinsic to the animation, not the hosting.** A separate static site wouldn't make the cinema cheaper. On-platform you can SSR the LCP markup and lazy-load the animation — equal or better than the current pure-client POC.

**The real trade-off we accepted:** bespoke-page iteration now couples to the platform repo (Next.js, migrations, staging/master discipline, force-dynamic SSR) instead of the fast `edit → publish.sh` loop. That's the price of dog-fooding; fidelity is not.

---

## 2. The three ownership tiers

Every POC surface maps to exactly one of these. This is the core mental model.

| Tier | What it is | Where it lives | Editable by non-devs? |
|---|---|---|---|
| **A — Code-owned route** | Bespoke, animated, art-directed pages | Hand-written React routes gated to the DE tenant | No (code) |
| **B — CMS content** | Recurring, structured content | `posts` table rows + existing/cloned routes | Yes (dashboard) |
| **C — Form/widget** | Interactive surfaces that need a backend | Client widgets that POST to platform APIs | n/a |

### POC inventory → tier

| POC surface | Tier | Target |
|---|---|---|
| `sales.html` Acts/Beats + 600vh cohort hero | **A** | `app/(...)/sales/page.tsx` (code-owned, DE-gated) |
| `index.html` hero canvas, ripple canvas, fishing game, journey modals | **A** | `app/(...)/page.tsx` homepage (code-owned, DE-gated) |
| `features.html` nested explorer (GSAP/Lenis/SVG) | **A** | `app/(marketing)/features/page.tsx` (code-owned, DE-gated) — `DEPARTMENTS` becomes a typed TS constant |
| Case studies (`case-study.html?id=`) | **B** | `posts` `type='case_study'` + `/case-studies` + `/case-studies/[slug]` |
| Blog / knowledge resources (net-new) | **B** | `posts` `type='blog'` / `type='resource'` — index/detail/RSS/SEO already live |
| Pricing | **B** (content) | CMS content — **but resolve the Offer conflict first (§7)** |
| Multi-step booking modal (calendar/time picker) | **C** | New `POST /api/appointments` (**build item**) |
| Newsletter footer form | **C** | `POST /api/newsletter` `{email}` |
| Lead/contact forms | **C** | `POST /api/leads` |
| Act 3 "try-it-yourself SMS demo" | **C** | `POST /api/leads` (`form_type:'text_us'`) → real 90s AI SMS |
| ROI calculator, scripted AI chat | **A** (client-only) | Stay client-side; can read tenant defaults later |
| Custom cursor, Lenis smooth-scroll | **A** | Part of the code-owned routes |

---

## 3. Key platform facts the plan relies on (verified)

All confirmed by reading the platform source:

**Routing & rendering**
- An explicit route folder **overrides** the catch-all: `app/(marketing)/sales/page.tsx` wins over `app/(marketing)/[[...slug]]/page.tsx` for `/sales`. (The repo already does this with `blog/`, `brands/`, `inventory/`, `compare/`.)
- **Tenant gate:** `requireMarketingTenant()` (from `lib/tenant/context.ts`) reads the middleware-set `x-tenant-id` header and 404s if missing; you add `if (tenant.id !== DEALEREDGE_TENANT_ID) notFound();`. Helper `isTenantRequest(slug)` also exists.
- **No DealerEdge tenant identity exists in code yet** — `DEFAULT_TENANT_ID` is Premier (`f47ac10b-…`). Must add `DEALEREDGE_TENANT_ID`/slug to `lib/tenant/constants.ts`.
- **Chrome — DECIDED: keep standard chrome.** Cinematic pages stay under `app/(marketing)/` and keep the platform's nav/footer; **no `(de-marketing)` sibling route group.** (`(marketing)/layout.tsx` wraps all descendants and can't be opted out from within — which is fine, because we want it.) **Implication for the port:** Lenis smooth-scroll and ScrollTrigger pins must cooperate with the marketing chrome's fixed bars (announcement / compare / mobile-CTA) — verify pins don't fight the sticky header and that `lenis` doesn't double-hijack scroll.
- **force-dynamic is unavoidable** for these pages: root layout, `(marketing)/layout.tsx`, and the catch-all all set `export const dynamic = 'force-dynamic'` (they call `headers()` for tenant resolution). A child cannot revert to static/ISR; `export const revalidate` throws. Accept SSR-per-request; cache heavy data with `unstable_cache`. **CWV implication: TTFB is per-request, so the LCP/INP strategy in §6 matters.**

**Animation host**
- **CSP is permissive and safe for GSAP/Lenis today:** `buildCSP()` in `middleware.ts` emits `script-src 'self' 'unsafe-inline' 'unsafe-eval'`, `style-src 'self' 'unsafe-inline'`, `worker-src 'self' blob:`, **no nonce**. GSAP's inline `element.style` writes, `requestAnimationFrame`, and any plugin `eval` are all allowed. *(Watch item: if the platform later hardens CSP to nonces, this needs revisiting — it's a single-file change in `middleware.ts`.)*
- **GSAP and Lenis are not dependencies** → `npm i gsap lenis`. Keep them strictly client-side.
- **Heavy-client pattern already exists:** `'use client'` wrapper + `next/dynamic(() => import('./sales-experience'), { ssr: false })`. Copy `components/demo/theme-switcher-lazy.tsx` or `components/compare/compare-bar-wrapper.tsx`.
- **Cleanup is mandatory** on unmount (soft navigation leaks pinned spacers + RAF loops otherwise): `gsap.context()`/`ctx.revert()`, `ScrollTrigger.killAll()`, `lenis.destroy()`.

**Lead/CRM APIs**
- `POST /api/leads` — body `{ visitor_id, form_type, form_data:{ name|first_name, email, phone, message, boat_id?, inquiry_type?, … }, page_url, turnstile_token? }`. Honeypot header `x-website-hp` (leave unset). **Turnstile token goes in the body, not a header.** Tenant resolved from Host — you cannot pass `tenant_id` (mismatch → 403). Success: `{ success, lead_id, is_new, visitor_linked }`. One POST fires dedup/merge → rep routing → TCPA consent → scoring → **90s AI SMS + follow-up email + nurture**.
- `POST /api/newsletter` — `{ email }`.
- `POST /api/contact` — deprecated flat wrapper; prefer `/api/leads`.
- **`POST /api/appointments` does NOT exist — BUILD ITEM.** `createAppointment()` is an auth-gated dashboard server action only. Build a public route mirroring `/api/leads` (tenant-from-Host, honeypot, optional turnstile, rate-limit) that upserts a lead via `processLeadSubmission` then inserts an `appointments` row (`tenant_id, lead_id, scheduled_at, duration_minutes, timezone, status, boats_to_show[], assigned_*`) and sets lead stage `appointment`. *Stopgap:* `form_type:'schedule_visit'` to `/api/leads` (captures intent, no appointments row).
- **Attribution:** two visitor-id systems — don't confuse them. `de-tracker.js` → `/api/analytics/event` uses an **ephemeral** id (not for attribution). Lead attribution uses the **persistent `visitor_id` HttpOnly cookie** surfaced via `useTracking().visitorId` (from `TrackingProvider`) and `/api/tracking`. **Forward the persistent UUID into the lead's `visitor_id`** to stitch first-touch UTM/referrer/landing onto the lead.
- **CORS:** same-origin required. Because the site is a route inside the platform app, all calls are same-origin — this Just Works. (It would break only for a separate-host static fallback.)

**Content**
- All content = `posts` table, **free-text `type`** (no DB CHECK), `unique(tenant_id, type, slug)`. Case studies = new `type='case_study'`, **zero migration**.
- Clone `app/(marketing)/resources/page.tsx` (index) and `resources/[slug]/page.tsx` (detail). Fetch via `getPostBySlugAndType(tenantId, slug, 'case_study')`. **force-dynamic + `revalidate=7200`, NO `generateStaticParams`** (the multi-tenant header forbids build-time static gen; the catch-all returns `[]` deliberately).
- **Extend the TS `PostFilters.type` union** (`lib/api/posts.ts`: blog/event/promotion/resource) to include `case_study`, plus `ResourceType` and `fetchFilteredResources` analogs — otherwise typed helpers won't surface case studies (the DB is permissive, the types aren't).
- **POC case-study field mapping:** `headline→title`, `image→featured_image`, `body→blocks` (rich_content), `dealer/logo/subheadline/stats[]/quote/attribution→metadata.*`, SEO→`seo` jsonb. (Numeric `id` dropped; posts use uuid + slug.)
- **Animated index→detail transition:** `lib/view-transitions.ts` + `components/ui/animated-link.tsx` + view-transition CSS in `globals.css` (shared `view-transition-name` on card image/title ↔ detail hero). View Transitions API is Chromium-only with graceful fallback; for a richer GSAP morph, gate it inside the DE-only client route.
- **Blog/Resources:** fully turnkey — just seed rows via `createPost` (`useServiceRole:true`). Index/detail/RSS/SEO/sitemap already exist and are tenant-scoped.

**Provisioning reality — UPDATED & VERIFIED on `origin/staging` (2026-05-30)**
- **The dangerous Premier hardcodes are already fixed on staging** (the original audit is stale). Verified: `lib/auth/dashboard.ts` returns `null` for a Bonsai user with no tenant context (explicit "Do NOT silently fall back to Premier" + env-aware QA path); `lib/tenant/constants.ts` `DEFAULT_TENANT_ID` is documented as localhost/build-only, not a prod fallback; `lib/config/metadata.ts` `getBaseUrl()` is `@deprecated` and the live path uses tenant-aware `getBaseUrlForSEO()` + `getTenantName()`. **No hardcode-closing sprint needed.** Residual = env-overridable defaults (`cors.ts`, `metadata.ts` → `premierwatersports.net` when `NEXT_PUBLIC_SITE_URL` unset) + dev stubs (`theme-tenant.ts`); spot-check that nothing live calls the deprecated `getBaseUrl()` for tenant pages.
- **A real 2nd tenant exists and is the template:** `supabase/migrations/20260502010000_seed_searay_tenant.sql` (Sea Ray). Provision DE by cloning this into `seed_dealeredge_tenant.sql`. Multi-tenancy is proven in production-staging.
- **Onboarding has progressed:** `app/(dashboard)/dashboard/onboarding-actions.ts` exists (Spec 121 partially built); Spec 120 marketing-hub work is active. Still: hand-provision via the Sea Ray migration pattern + Vercel dashboard for the domain (Spec 111 custom-domain automation not required to launch).
- **SMS:** `tenant_phone_numbers` + `sms_terms_of_service` exist + `app/api/admin/sms/provision/route.ts`, but lawful US 10DLC (Spec 094 Trust Hub) is **not built** — staging reuses shared BMG Twilio/Resend/Bland keys; production-lawful SMS is a separate dependency.
- **⚠️ Local platform-repo checkout is 163 commits behind `origin/staging`** — `git pull` before any platform work; treat `origin/staging` as canonical.

---

## 4. Cross-repo coordination ⚠️

**This plan spans two repos.** Tiers A/B/C all require changes inside `dealerEdge-demo-generator` (the platform), which follows its own discipline: develop on `staging`, `master` is production-only, DB changes are migrations, and there's a `NEVER REIMPLEMENT — ALWAYS WRAP` CMS convention. Specifically, the platform-repo work is:
- New code-owned routes + a possible `(de-marketing)` route group
- New `DEALEREDGE_TENANT_ID` constant + closing the Premier hardcodes
- New `gsap`/`lenis` dependencies
- New `POST /api/appointments` endpoint
- `case_study` type-union extensions + new case-study routes + sitemap entry
- Tenant provisioning (SQL/MCP + Vercel)

**Action:** align with the platform owner(s) before landing these — especially adding animation deps, a new route group, and the hardcode fixes. The local dev DB is also fragile (`supabase db reset` broken at #022; use `scripts/reset-local.ts` / `sync-from-staging.sh`); budget setup time.

---

## 5. The phases

### Phase 0 — Platform readiness + DE tenant (staging)
*Pure platform/ops work. No marketing rewrite. Unblocks everything.*

1. ~~Close the Premier hardcodes~~ — **already done on `origin/staging` (verified 2026-05-30).** Only spot-check: confirm nothing live calls the deprecated `getBaseUrl()` for tenant pages, and set deployment env (`DEFAULT_TENANT_ID`, `NEXT_PUBLIC_SITE_URL`) so the `cors.ts`/`metadata.ts` defaults never resolve to Premier.
2. **Add DE identity:** `DEALEREDGE_TENANT_ID` (env-backed) + `DEALEREDGE_SLUG='dealeredge'` in `lib/tenant/constants.ts`.
3. **Provision the tenant — clone `supabase/migrations/20260502010000_seed_searay_tenant.sql` → `seed_dealeredge_tenant.sql`:**
   - `INSERT tenants` (slug `dealeredge`, status `demo`/`active`, `config`/`features`/`integrations` JSONB). Confirm the `after_tenant_insert_create_profile` trigger created `tenant_profile`. (The Sea Ray migration already encodes the correct column set — adapt its values.)
   - `INSERT tenant_custom_domains` (`is_primary`, `verified`) for the staging host; add the domain in the **Vercel dashboard** and to `next.config.ts` `remotePatterns` (CB-6/CG-1); redeploy.
   - Seed **locations → users + tenant_users → team_members** for Bob/Mike/Sarah (`crm_role:salesperson`, `is_active`, linked `user_id`; **Mike = Malibu/Axis/wake** so the canon "route Wakesetter → Mike" works). `routeLead` drops reps with null `user_id`.
   - `INSERT theme_customizations` (base `apex`; overrides `#000` bg / `#ee3a39` / `#4ade80`); set `site_config.active_theme`.
   - `INSERT` a published `homepage` `pages` row + `site_config` (else marketing routes 404).
   - SMS-minimal: `features.sms`, `tenant_phone_numbers`, `sms_terms_of_service` v1, shared Twilio/Resend/Bland keys.
4. **Smoke test:** DE host resolves `x-tenant-id` = DE uuid; branding is DealerEdge (not Premier); a test lead routes to Mike; a notification recipient exists (seed CG-5).

**Exit criteria:** DE tenant reachable on a staging host, isolated from Premier, with working lead routing.

---

### Phase 1 — Lay the rails (shared capabilities the rebuild needs)
*Build once, used by every page.*

1. **Add deps:** `npm i gsap lenis`.
2. **Establish the code-owned route pattern:** a thin reference route (`app/(marketing)/_de-cinematic-probe/` or the first real one) that demonstrates: tenant gate → `'use client'` + `next/dynamic({ssr:false})` → GSAP/ScrollTrigger/Lenis with full unmount cleanup → `generateMetadata`. **Decided: cinematic pages stay under `app/(marketing)/` with standard nav/footer** (no `(de-marketing)` group). Validate here that Lenis + ScrollTrigger pins cooperate with the marketing chrome's fixed bars.
3. **Build `POST /api/appointments`** (the one real backend build item) — mirror `/api/leads` security, upsert lead + insert `appointments` row, set stage `appointment`.
4. **Case-study content type:** extend `PostFilters.type` (+ `ResourceType`, `fetchFilteredResources` analog) to include `case_study`; clone `resources/` → `case-studies/` index + `[slug]` detail; add `caseStudyPages` to `app/sitemap.ts`; (optional) clone `feed.xml`.
5. **Seed content (DE tenant):** migrate POC case studies into `posts` (`type:case_study`, field mapping per §3); create initial blog + resource rows. Write a `scripts/seed-dealeredge-content.ts` using `createPost({ useServiceRole:true })`.
6. ~~Resolve the pricing/Offer conflict~~ — **deferred (§7), out of scope for now.**

**Exit criteria:** appointment API live; `/case-studies/[slug]` renders seeded data with SEO + sitemap; blog/resources populated; a probe cinematic route proves GSAP works under the platform's CSP/dynamic constraints.

---

### Phase 2 — Port the pages (responsive rewrite, page by page)
*The bulk of the work. Front-load the riskiest page to validate fidelity + CWV early.*

1. **Sales pillar first — `app/(marketing)/sales/page.tsx`.** Port `sales.js` → a `'use client'` `SalesExperience` component (BEAT_ANIMS dispatch, `stillCurrent` guards, IntersectionObserver gate, 100-dot cohort builder move into `useGSAP`/`useEffect`). Bring `sales.css` over (`.s-` namespace intact). **Start with the 600vh cohort hero** (the hardest scene) and measure fidelity + CWV before continuing — this is the de-risking checkpoint. Wire its forms: Act-3 SMS demo → real `/api/leads` (`form_type:'text_us'`), any inline lead form → `/api/leads`. Do the full responsive pass here.
2. **Homepage — `app/(marketing)/page.tsx`** (or override). Port hero canvas, ripple canvas, fishing game, journey modals. Wire booking modal → `/api/appointments`, newsletter → `/api/newsletter`.
3. **Features — `app/(marketing)/features/page.tsx`.** `DEPARTMENTS` → typed TS constant; code-owned, DE-gated.
4. **Case-studies index polish:** wire the animated index→detail transition (`view-transitions.ts` + `AnimatedLink`; richer GSAP morph inside the DE client route).
5. ~~Pricing~~ — **deferred (§7); skip for now.**
6. **Attribution everywhere:** embed the platform tracker and forward `useTracking().visitorId` into every lead/appointment payload so UTM stitches.
7. **Responsive rewrite** is done as each page is ported (the POC's mobile coverage is thin; this is required regardless).

**Per-page acceptance:** pixel-fidelity vs. POC on desktop; green CWV (LCP via SSR'd markup, INP/TBT via lazy-loaded animation, CLS via reserved heights); forms create real leads/appointments that route correctly; unmount cleanup verified across soft navigations.

---

### Phase 3 — Production cutover & launch
1. Provision the DE tenant in **production** (repeat Phase 0 provisioning; Vercel prod domain + SSL).
2. Map old→new URLs via the `redirects` table (honored by middleware, excluded from sitemap). Resolve the pricing-page URL and the `case-study.html?id=` → `/case-studies/[slug]` migration.
3. Verify per-tenant `sitemap.xml`, `robots.txt`, JSON-LD, OG, `llms.txt`.
4. If lawful production SMS is required at launch, that depends on Spec 094 (10DLC) — otherwise gate SMS or keep it demo-only.
5. Launch; monitor CWV (field data), lead flow, and the 90s-SMS path end-to-end.

---

## 6. Core Web Vitals strategy (the priority guardrail)

The cinematic pages are JS-heavy *wherever* they live; here's how we keep CWV green on-platform:
- **LCP:** SSR the above-the-fold hero markup (it's HTML/CSS, not JS-gated). The animation enhances it after paint.
- **INP/TBT:** GSAP/ScrollTrigger/Lenis + beat logic load via `next/dynamic({ssr:false})` after first paint / on idle — they never block initial interaction.
- **CLS:** reserve heights on pinned/600vh sections so the scroll-pin never reflows.
- **TTFB:** force-dynamic adds per-request server time; mitigate with `unstable_cache` (tenant-scoped tags) for any data the pages fetch. The cinematic pages are largely static-content + client animation, so data fetching is minimal.
- **Budget:** target green field-data CWV, not necessarily a 95 Lighthouse score (the platform's blanket 95+ is for lightweight block pages; a 600vh GSAP cinema is heavier by nature — and would be on a static host too).

---

## 7. Deferred: pricing vs. the Offer ⏸️

**Deferred by Jason (2026-05-30) — do not block on this.** The POC `pricing.html` shows SaaS tiers (`$1,497 / $1,347 / $1,247`), which contradict the locked Offer in `CLAUDE.md`: *"$0 until we beat your current results by 20%, then tiered activation."* Pricing is **out of scope for now** — skip the pricing page in the page-port sequence (Phase 2 step 5) and revisit the messaging call later. Everything else proceeds without it.

---

## 8. Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| Premier hardcode leak (DE inherits Premier data/branding) | ~~High~~ **Low** | Dangerous fallbacks already fixed on staging (verified); just set deployment env + spot-check deprecated `getBaseUrl()`; smoke-test isolation |
| CWV regression on cinematic pages | Med | §6 strategy; validate on the sales hero first (Phase 2 step 1) |
| Animation cleanup leaks on soft nav | Med | Mandatory `ctx.revert()` + `ScrollTrigger.killAll()` + `lenis.destroy()` on unmount |
| CSP later hardened (nonces / no `unsafe-eval`) | Low/Med | Currently safe; watch `middleware.ts buildCSP()`; avoid GSAP plugins needing `eval` |
| No appointment endpoint | Med | Build `POST /api/appointments` in Phase 1 (or stopgap `schedule_visit`) |
| force-dynamic TTFB | Low/Med | `unstable_cache`; minimal data fetching on cinematic pages |
| Wrong visitor-id used → attribution silently no-ops | Med | Forward the **persistent** `visitor_id` (cookie/`useTracking`), not the `de-tracker` ephemeral id |
| Specs 111/121 unbuilt | Med | Hand-provision via SQL + Vercel; don't block on them |
| Lawful production SMS (10DLC) | Med | Depends on Spec 094; staging uses shared keys; gate at launch if needed |
| Iteration velocity drop (platform coupling) | Med | Accepted trade-off; lean on staging + the established route pattern |
| Local dev DB fragility | Low | Use `scripts/reset-local.ts` / `sync-from-staging.sh`, not `supabase db reset` |

---

## 9. Sequenced checklist (condensed)

- [x] ~~**P0** Close Premier hardcodes~~ — already done on staging (verified); spot-check deprecated `getBaseUrl()` + set env
- [ ] **P0** Add `DEALEREDGE_TENANT_ID`/slug constant
- [ ] **P0** Provision DE tenant by cloning `seed_searay_tenant.sql` (tenants, domain+Vercel, reps/locations, theme, homepage row, SMS-min)
- [ ] **P0** Smoke-test isolation + lead-routes-to-Mike
- [ ] **P1** `npm i gsap lenis`; establish code-owned route + dynamic-import + cleanup pattern (standard chrome, under `(marketing)`)
- [ ] **P1** Build `POST /api/appointments`
- [ ] **P1** `case_study` type-union + `/case-studies` index/detail + sitemap; seed case studies
- [ ] **P1** Seed blog + resources; write `seed-dealeredge-content.ts`
- [x] ~~**P1** Resolve pricing/Offer conflict~~ — deferred (§7)
- [ ] **P2** Port `sales` (cohort hero first → measure fidelity + CWV) + wire its forms
- [ ] **P2** Port homepage + wire booking/newsletter
- [ ] **P2** Port features
- [ ] **P2** Case-study transition; tracker + visitor_id everywhere (pricing deferred)
- [ ] **P2** Responsive pass per page
- [ ] **P3** Production tenant + domain; redirects; SEO verify; launch + monitor

---

*Generated from a two-pass code survey of both repos (file:line-level verification of routing precedence, CSP, API contracts, content-type mapping, and the multi-tenant readiness audit). Update this doc as phases complete; add a date stamp + tool name per the repo convention.*
