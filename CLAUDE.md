# DealerEdge Marketing Site — Agent Guide

This file is the persistent context for any AI agent (Claude Code, Cursor, Codex, etc.) working in this repo. Read it first. The conventions below were earned over real iteration with Jason — please don't re-derive them or rewrite locked language without explicit permission.

---

## What this project is

`evanbfraser/dealer-edge` is the marketing site for **DealerEdge**, one of three product lines under **The Edge Platform** (Bonsai Media Group's AI Competitive Edge platform — see Notion). Static HTML/CSS/JS, no build step. Hosted publicly at **https://mantra-harbor-8vkd.here.now/** via [here.now](https://here.now). The git remote (`evanbfraser/dealer-edge`) is Evan's repo; Jason has push access.

Pages:

- `index.html` — Homepage (Evan's original POC; mostly untouched, still uses CDN GSAP + Lenis + custom canvas hero)
- `features.html` — Features explorer (data-driven side-nav, populated by `js/features.js`)
- `pricing.html`, `case-studies.html`, `case-study.html` — Lighter pages, less iteration
- **`sales.html`** — The Sales pillar deep-dive prototype. This is the file we've been actively iterating on. Most of the conventions in this guide were established here. **Read [`sales.html`](sales.html), [`css/sales.css`](css/sales.css), and [`js/sales.js`](js/sales.js) before making changes to ANY page.** The pattern is meant to spread.
- **`marketing.html`** — The Marketing pillar deep-dive (hero machine + proof showcase + 3 couplet acts). Page prefix `.m-`.
- **`inventory.html`** — The Inventory deep-dive (added 2026-06-04, reworked 2026-06-07): static hero with auto-wiping before/after, shared `#includes`/`#compare`, 2 couplet acts (`#living-listing` 7 scenes, `#found-everywhere` 6 scenes), boat CTA close. Page prefix `.i-`; runs on `DE.initActs`. The page is organized around **Pull → Build → Publish** (includes kickers, compare row prefixes, act tags). **Pricing claim scope (Jason, 2026-06-07): the platform supports MAP compliance by brand (new boats only) — Act 2 beat 6 (`inv-map`, `.i-map`) dramatizes a below-MAP price being held before publish. Do NOT claim "smart pricing" or price *suggestions* — territory pricing is in development, not shipped.** Real before/after photo assets live in `assets/inventory/` (Supra/Moomba raw lot shots + studio outputs + soft-focused pipeline node-graph screenshots). **Never name the image-pipeline tool (ComfyUI) in page copy or filenames — "proprietary image pipeline" only**; destination marketplaces (Boat Trader, YachtWorld, Facebook Marketplace) are fine to name, the under-the-hood syndication vendor is not.

Sibling products under The Edge Platform: **OEM Edge** (manufacturers) and **Real Edge** (real estate brokerages, greenfield). All three share the AI foundation, the offer mechanic, the "What Wasn't Humanly Possible" framework, and the founder/team credibility. Most of the strategic source-of-truth docs live in Notion under the **[Edge Platform GTM](https://www.notion.so/367c8999b11481e7a9dde5ee3c66f79f)** front door page (Asset Map database + per-product Spine docs + Team page).

---

## Voice & messaging spine (LOCKED — don't rewrite)

These come from the Notion strategy docs (DealerEdge Spine, Core Messaging & Philosophy, Sales Playbook). Treat them like API contracts.

### The Positioning Statement

> Your customer's journey is run by **seven vendors that have never met.** DealerEdge replaces all of them. One AI system across marketing, sales, and operations — driving more traffic, converting more leads, and never letting a single one fall through the cracks. We guarantee it. None of your current vendors ever would.

### The Tagline (Trifecta)

> **More leads in. Faster response out. Nothing lost in between.**

Three phrases. Each maps to a pillar:
1. **More leads in** → Marketing (99-score sites, AI content, AI ads, SEO)
2. **Faster response out** → Sales (90-second AI response, every call answered, 24/7)
3. **Nothing lost in between** → Operations (unified CRM, AI nurture, full attribution)

### The Offer (the locked one)

> "Tell us what you spend across all your current vendors. We replace every single one of them. You pay **\$0 until we beat your current results by 20%.** When we do, pricing activates at the tier you chose before we started."

**Phase 1** — Prove It (up to 6 mo): \$0. We run everything. Measured against prior-year traffic + leads.
**Phase 2** — Partner (after 20% trigger): Tier picked upfront — **A** Flat Rate \$5K–\$15K/mo, **B** Base + Performance \$3K–\$4K + 10–15% of gross margin, **C** Pure Performance % of gross margin only.

**Do not** soften this to "free trial." **Do not** change "20%" to a different number. **Do not** rebrand it as a discount.

### The Killer Proof Chain

The 4-stat cascade that opens any cold pitch:

> 78% of dealer websites fail Core Web Vitals → 57% of dealers never respond in 24 hours → 80% of callers who hit voicemail call your competitor → only 19% of boat dealers ever schedule an appointment.

**The close stat:** *"Dealers who fix their response — same leads, 50% more boats sold."* (Pied Piper ILE Study — the killer stat. Cite this source when stating the 50%.)

### Demo story canon (use these specifics, don't invent new ones)

| Element | Value |
|---|---|
| Buyer | **John Castillo** |
| Buyer's email | `j.castillo@gmail.com` |
| Buyer's phone | `+1 (615) 555-0142` |
| Buyer's employer | Senior Engineer, Vivint Smart Home, Franklin TN |
| Boat | **2022 Malibu Wakesetter 23 LSV** |
| Boat price | **\$162,900** |
| Inquiry submitted | **Saturday 11:17 PM** (consistent everywhere) |
| AI response time | within 47 seconds (the "Speed to Lead <90s" claim) |
| Showing booked for | **Tuesday at 10 AM** (NOT Saturday — too far away, feels weak) |
| Lost-deal call attempt | Monday 9:42 AM, **59h 25m** after inquiry |
| Lost-deal competitor | North Lake Marine |
| Margin per deal | ~\$14,000 |
| Reps | **Bob** (Pontoons · Yamaha), **Mike** (Wake boats · Malibu · Axis), **Sarah** (Center consoles · Regulator) |
| Lead routes to | **Mike** (because John wants a Wakesetter) |

### Voice rules

- **"Bullshit" is intentional and on-brand** in copy (see "The bullshit, off your desk" on the sales page). Don't sanitize it without asking.
- "We" not "DealerEdge" in most prose. The brand name does the work in headings.
- **Product identity noun: "AI platform" / "the platform."** (Decided 2026-06-04 from Dustin Talley's feedback — pick ONE term so visitors aren't confused about whether DealerEdge is an AI tool, a marketing team, or a platform. Matches the homepage hero "The AI Growth Platform.") Don't alternate with "system," "operation," "machine," "engine," or "agency" as identity nouns. "Team" appears only as the thing DealerEdge replaces ("a whole marketing team — without the payroll"), never as what DealerEdge *is*. marketing.html and sales.html are both converted — the sales `<title>` says "The AI sales platform that never sleeps." **"AI Sales Captain"** survives in-page on sales as the persona name for the sales agent itself (pivot, Act 2 headline, Try-It demo) — it's a feature of the platform, not the product identity noun (Jason's call, 2026-06-04). (This supersedes the earlier "system > platform" rule.)
- Stats are CONCRETE. "78%" not "most." "59h 25m" not "over a day." "\$162,900" not "around \$160K."
- 4-beat story structure per topic (the pattern in Dustin's Business Outcomes Calendar): *Where they are today → What changes → What it means in dollars/time/deals → How they think differently after.*
- One number per topic. Each section should have a single anchor stat the reader could repeat the next day.
- Things we never give away: internal tool names, AI vendor names, prompt-engineering details, syndication partner names, autonomy-level configuration, the content engine pipeline. The "secret sauce guardrails" from the Business Outcomes Calendar apply to all copy here.

---

## The shared layer (`.de-` = DealerEdge chassis) — added 2026-06-04

The deep-dive pages (marketing + sales) share one component system so CMS integration gets one act component, not two:

- **`css/de-act.css`** — the act chassis under `.de-` classes (tokens are self-contained `--de-*`). Anatomy, scene math, and phase mechanics are documented at the top of that file. Load order in both pages: `style.css → de-act.css → <page>.css`. Also holds the shared static sections (added 2026-06-04 later the same day): **`.de-section-label`**, **`.de-includes`** ("Everything included" 3-column checklist) and **`.de-compare`** (row-per-offering before/after table; red/green cells; mobile stacked-card labels come from string custom properties `--de-compare-label-old/-new` set inline on the section — defaults match marketing's "THE COMPETITION"/"DEALEREDGE", sales sets "WITHOUT DEALEREDGE"/"WITH DEALEREDGE"). Both are static `data-fade` sections — `DE.initFade` adds `.is-visible`, which drives the per-item `--i` stagger. Both pages have `#includes` + `#compare` instances; sales' sit between the hero and Act 1 ("From 19 bookings to 60. Here's everything that does it." → "Same leads. Same phones." 7-row table).
- **`js/de-core.js`** — `window.DE = { reduceMotion, isSafari, createLenis, initCursorGlow, initNavScroll, initFade, attachSceneSnap, initActs }`. Loaded after the CDN libs, before the page script. The snap tuning lives ONLY here now. **`DE.initActs(lenis, { anims: BEAT_ANIMS, cleanups: weakMap })`** (promoted from marketing.js 2026-06-04) is the shared act controller — per-beat `data-phase` couplets, `data-anim` dispatch, intro-scene engage, IntersectionObserver entered-gate, snap attach. ALL five act pages call it — marketing, inventory, analytics, features, and (since 2026-06-11) sales; the page-local `createActController` in sales.js is gone. Each page keeps its own `BEAT_ANIMS` + animation functions; call `DE.initActs` AFTER the `BEAT_ANIMS` declaration/assignment (calling from the top init block throws a TDZ ReferenceError). **Engine contract: every anim fn adds `.is-playing` to its beat as its first statement** — that class is the replay gate; without it the engine force-replays the anim on every scroll update inside the beat. Two merge-era options: `fitBeats: true` (sales) enables the mobile beat-fit pass (≤1100px, scales an overflowing active beat via `--de-beat-fit-scale`, consumed by de-act.css), and beats without their own `data-phase` fall back to the act's static `data-phase` from the HTML (how sales keeps Act 1 red / Acts 2 & 4 green) before defaulting to `good`.
- **`css/style.css`** — all-pages base (nav incl. `.is-scrolled` gradient blur, buttons incl. the enlarged `.boat-cta`, footer, modal, cursor, `[data-fade]`).

**Prefix rule:** `.de-` classes are the shared chassis and are owned by de-act.css — never restyle them from a page stylesheet directly. `.m-`/`.s-` prefixes are ONLY for page-unique stage content (`.m-roster`, `.s-browser`…) and page override hooks (`.s-act--team`). Page overrides of chassis elements hang off a page class: `.s-act--team .de-act-stage-sticky { … }`.

**Phase mechanics:** an act's `data-phase="bad|good"` recolors line `<b>` accents + the headline accent and crossfades a `--bad`/`--good` watermark pair. Sales sets it statically per act (Act 1 bad, Acts 2/4 good); marketing.js rewrites it per beat (red→green couplets). Both pages use the exact same CSS.

**Don't duplicate into page files what de-core/de-act own.** If both pages need a change, change the shared file.

---

## Page architecture (sales.html is the canonical pattern)

A "deep-dive page" is structured as: **Pinned Hero (Killer Proof Chain) → Marine Reality → N Acts → closing CTA**.

The current `sales.html` order is:

1. **Hero + Stats** (`s-hero.s-stats-section`, `id="stats"`) — **one** scroll-pinned 480vh cohort story (6 stages × 80vh desktop). The same 1,000 buyers enter once, then the 100-dot visualization shows cumulative attrition: slow site → no 24-hour reply → voicemail → only 19 booked. Beat 06 flips green and recovers the cohort to **60 bookings instead of 19. Same 1,000 buyers.** Keep the "Scroll to see how" handoff. Avoid returning to the old 41X framing.
2. **Everything included** (`.de-includes`, `id="includes"`) + **Without/With table** (`.de-compare`, `id="compare"`) — two static shared-chassis sections cashing in the hero's 19→60 ("here's everything that does it") before the acts dramatize the same rows. Added 2026-06-04.
3. **Act 1** (`s-act--without`, `data-act-intro`) — Without DealerEdge, intro + 4 beats
4. **Marine Proof** (`s-marine-proof`) — compact post-Act-1 context card with NMMA modal. Keep this light so the John Castillo scenario remains the main path.
5. **Pivot** (`s-pivot`) — transition
6. **Act 2** (`s-act--with`, `data-act-intro`) — With DealerEdge, intro + 4 beats
7. **Act 3** (`s-try`) — Try it yourself (interactive SMS demo)
8. **Pivot 2** (`s-pivot--alt`) — transition
9. **Act 4** (`s-act--team`, `data-act-intro`) — Sales-team-side, intro + 6 beats including ROI calc and philosophy close
10. **Video** (`#video-section`) → **Boat CTA** (`#boat-section`, "Get The Boat Off Your Lot" + `js-modal` demo button) → footer. (The old static Offer `cta-section` was retired; both marketing and sales now close with the boat CTA.)

### Act intro scenes (`data-act-intro`)

Acts carry `data-act-intro`: scene 0 shows the `s-act-scene` headline at display size (`clamp(2.7rem, 5.6vw, 5rem)`) with copy/stage/watermark hidden; when the user scrolls into beat 1 the JS adds **`.is-engaged`** and the headline shrinks to its docked label while the watermark and beat rail fade in. Scrolling back above the act removes `.is-engaged` so the intro replays. Same pattern as marketing's `data-act-intro` — keep them visually in sync.

An **Act** is a scroll-pinned scene that holds the viewport while the user scrolls through **Beats**. Each Beat is one moment in the act's story.

```
<section class="de-act de-act--5 de-act--bad" id="actN" data-act data-act-intro data-phase="bad">
  <div class="de-act-inner">
    <div class="de-act-watermark de-act-watermark--bad">ACT NAME · LABEL</div>
    <!-- couplet acts (marketing) add a second watermark: --good; data-phase crossfades them -->
    <header class="de-act-head">         <!-- intro scene 0: big; docks + mutes on .is-engaged -->
      <span class="de-act-tag de-act-tag--bad">Tag line</span>
      <h2 class="de-act-headline">… <span class="de-act-headline-faded">…</span></h2>
    </header>
    <div class="de-act-copy">            <!-- LEFT: one big morphing line per beat -->
      <div class="de-act-lines">
        <p class="de-act-line" data-beat="1">… <b>accent</b> …</p>
        <p class="de-act-line" data-beat="2">…</p>
        …
      </div>
    </div>
    <div class="de-act-stage">           <!-- RIGHT: media that morphs -->
      <div class="de-act-stage-sticky">
        <div class="de-beat de-beat--1 is-active" data-beat="1" data-anim="actN-beat1">…</div>
        <div class="de-beat de-beat--2"           data-beat="2" data-anim="actN-beat2">…</div>
        …
      </div>
    </div>
  </div>
</section>
```

This element tree is **identical on marketing and sales** (one shared chassis, `css/de-act.css`) so the act becomes one component when the site moves into the CMS (2026-06-04). `de-act--<scenes>` sets the height (scenes = beats + 1 intro), `de-act--bad/--good` the background tint, `data-phase` the accent/watermark phase. Line copy: one `<p class="de-act-line">` per beat, ≤ ~25 words, exactly one `<b>` accent phrase — red under `data-phase="bad"`, green under `"good"`. The old numbered beat rail is retired; both controllers still fall back to `.de-act-beat` if a page reintroduces one.

### Critical sizing rule

Desktop scenes are **80vh each** (tightened 2026-06-04 — 100vh felt like too much scroll per beat). An act with `data-act-intro` has **scenes = beats + 1** (the intro is scene 0). Heights come from the scene-count class in de-act.css — never hand-write an act height:

```css
/* css/de-act.css */
.de-act--4 { height: 320vh; }  /* desktop: scenes × 80vh  */
.de-act--5 { height: 400vh; }  /* mobile (≤1100px): scenes × 115vh */
.de-act--6 { height: 480vh; }
.de-act--7 { height: 560vh; }
```

Sales' pinned hero stays page-owned: `.s-hero.s-stats-section { height: 480vh; }` (6 stages × 80vh, no intro). If you change the number of beats, change the act's `de-act--N` class. If you forget, the last beat will be unreachable.

### Mobile breakpoint

At ≤1100px wide, the stats section keeps its scroll-pin at **600vh** (the later media-query block wins over the earlier 450vh declaration). Acts **also stay scroll-pinned** — same ScrollTrigger scene progression as desktop, with a single-column layout inside the sticky pin (scene header → active beat copy → stage visual). Mobile scenes are **115vh each**: act heights **575vh** (5 scenes) and **805vh** (7 scenes for Act 4) — same per-scene value as marketing mobile. Hide `.s-act-watermark` on mobile; keep `.s-act-tag` only. Inactive beat rows collapse to `display: none` — only the active beat shows in the rail.

**Mobile content width:** `.s-act-inner` uses **16px** horizontal padding at ≤1100px and **12px** at ≤640px. Beat visuals should use `width: 100%` — avoid `transform: scale()` shrink hacks unless a component still overflows after the width bump.

**Mobile cohort card:** The 100-dot grid spans **full card width** (10×10, `aspect-ratio: 1`, capped at `min(100%, 34vh)` so the full card fits the pin). On ≤1100px the card uses **CSS Grid + `display: contents` on `.s-cohort-row`** so zones cannot flex-collapse: label → grid → counters → caption → (beat 6) fix stack → scene-next. Baseline dots (98–99) must **not** get forced `min-width` — they stay grid-cell sized; green glow only on beat 6. On beat 6 mobile: hide `.s-hero-pulse` and in-pin `.s-hero-story-handoff`; put `.s-scene-next` in document flow (not absolute); anchor popups as a banner above the grid.

---

## Animation system

This is the system that gives the page its premium feel. Read this section carefully before adding/changing any animations.

### Per-beat animation registration

Each `<div class="s-beat">` that wants an animation declares it via `data-anim`:

```html
<div class="s-beat s-beat--1" data-beat="1" data-anim="act4-beat1">…</div>
```

The string in `data-anim` is a **dispatch key**. Add a matching entry to `BEAT_ANIMS` in [`js/sales.js`](js/sales.js):

```js
BEAT_ANIMS = {
  'act4-beat1': playAct4Beat1OneFunnel,
  'act4-beat2': playAct4Beat2Garbage,
  // …
};
```

### Animation function signature

Every animation function takes `(beatEl, stillCurrent)`:

```js
function playMyBeat(beatEl, stillCurrent) {
  // 1. Read DOM hooks via [data-something] attrs
  const el = beatEl.querySelector('[data-thing]');
  if (!el) return;                                  // graceful no-op if HTML missing

  // 2. RESET state at the top — animations must replay cleanly on re-entry
  el.classList.remove('is-in', 'is-pulse');

  // 3. Schedule timeline via setTimeout chains, each guarded by `tick`
  setTimeout(() => tick(stillCurrent, () => {
    el.classList.add('is-in');
  }), 300);
}
```

### Why `stillCurrent`?

When a user scrolls back into a beat that's already animating, we want the new run to win and the old run to bail. The helper does that:

```js
function tick(stillCurrent, fn) {
  if (typeof stillCurrent === 'function' && !stillCurrent()) return;
  fn();
}
```

Every async step (setTimeout, requestAnimationFrame loops, interval callbacks) MUST check `stillCurrent()` before mutating the DOM. Otherwise a stale animation can override a fresh one.

### The IntersectionObserver gate (don't remove this)

There's a per-act `actEntered` flag set by an IntersectionObserver. **Animations don't fire until the act first becomes visible.** Without this gate, ScrollTrigger fires `onUpdate` on initial page refresh for ALL acts (including off-screen ones), causing Act 2 and Act 4 to pre-play their animations while the user is still looking at Act 1. By the time they scroll there, animations have already completed and any re-entry triggers a confusing reset+replay.

The pattern lives in the `acts.forEach((act) => {...})` block. If you ever see animations playing off-screen, this gate is what got broken.

### Element data-attribute conventions

Use `data-*` attrs as DOM hooks instead of class selectors. CSS classes are for styling state; data attrs are for JS plumbing.

- `data-anim="actN-beatM"` — registers a beat with the dispatch
- `data-stats-section`, `data-stage`, `data-cohort-label`, `data-cohort-alive-label`, `data-cohort-alive`, `data-cohort-lost-label`, `data-cohort-lost`, `data-cohort-grid`, `data-cohort-popup`, `data-cohort-caption`, `data-cohort-fix-stack`, `data-scene-next` — pinned hero + cohort hooks
- `data-form`, `data-field`, `data-typed`, `data-submit-btn`, `data-confirm` — Act 1 Beat 1 form anim
- `data-inbox-list`, `data-inbox-silence` — Act 1 Beat 2 inbox
- `data-timeline-events` — Act 1 Beat 3 timeline
- `data-lost-convo`, `data-lost-stamp`, `data-age` — Act 1 Beat 4 lost-deal
- `data-stack-step`, `data-reveal-step`, `data-row` — Act 2 sequential reveals
- `data-dash-tabs`, `data-dash-panels`, `data-tab`, `data-panel` — Act 2 Beat 4 dashboard
- `data-funnel-particles`, `data-funnel-trash`, `data-funnel-team`, `data-funnel-node` — Act 4 Beat 1 funnel
- `data-bounce-scene`, `data-bs-feed`, `data-bs-rep`, `data-bs-shield`, `data-bs-caption`, `data-validator` — Act 4 Beat 2 rep-bounce
- `data-fr-reveal`, `data-fr-judge` — Act 4 Beat 3 forensic reveals
- `data-routing-lead`, `data-routing-router`, `data-routing-tag`, `data-routing-result`, `data-rep` — Act 4 Beat 4 routing
- `data-roi-hint`, `data-roi-cursor` — Act 4 Beat 5 ROI demo
- `data-cl-reveal`, `data-counter`, `data-counter-prefix`, `data-counter-zero`, `data-roadmap-item` — Act 4 Beat 6 philosophy

When adding new animations, follow this prefix convention so future readers can grep their way around.

### Snap-to-scene (marketing + sales — keep the tuned values in sync)

Both pages ease the scroll to the nearest scene center once scrolling settles inside a fully-pinned section — **one implementation: `DE.attachSceneSnap(lenis, section, sceneCount)` in js/de-core.js**. The values were tuned with headless wheel-event tests — **don't re-derive them or fork the function**:

- Settle timer **150ms**; if `|lenis.velocity| > 0.1` the snap re-queues (still coasting).
- **Directional**: a push **>28% past the current scene's center** advances to the adjacent scene (`frac > 0.78` scrolling down / `frac < 0.22` up) instead of recoiling backward.
- Direction comes from **scroll-position deltas** (`lastY` tracking), **never `lenis.velocity`** — velocity reads 0 inside Lenis scroll callbacks, which silently breaks the directional advance (flicks recoil instead of advancing).
- Target = `(scene + 0.5) / sceneCount` of the pin travel; 4px deadband; `lenis.scrollTo` duration 0.5 with cubic ease-out; 850ms safety reset of the `snapping` guard.
- Gated by `canSnap()`: desktop ≥1101px + fine pointer only, disabled on **Safari** (momentum fights programmatic scrolls — colleague-reported "stick then zoom past") and for `prefers-reduced-motion`.
- Attach **once per section** — never inside `setupActs()`/re-init paths, or duplicate `lenis.on('scroll')` listeners stack up.

---

## Pinned hero (Killer Proof Chain, `sales.html` only)

The opening section of `sales.html` is a **single merged** scroll-pinned block: `section.s-hero.s-stats-section` at `480vh` (six beats × 80vh), sticky on `.s-hero-pin`. There is no separate static hero above it.

**Layout (top → bottom inside the pin):** `[data-cohort-headlines]` headline stack → `[data-cohort-card]` with left/right counters and a persistent 100-dot cohort grid → scroll pulse → Beat 06-only story handoff.

The 100 dots represent the same 1,000 buyers from start to finish. Each dot equals 10 buyers. Red dots are cumulative attrition, not a fresh sample per beat. Beat 06 turns selected lost dots green again and counts from 19 to 60 bookings. The recovery copy may say **roughly 3X more bookings from buyers you already paid to attract**. Do not present that as 41X, and do not lead with `+41` as the primary promise.

### 6-beat structure

| Beat | Stat | Headline | Cohort state |
|---|---|---|---|
| 01 · Baseline | 1,000 | buyers came to your site this month. | 1,000 still here / 0 lost |
| 02 · Site speed | 17.3s | to load. 700 left before it finished. | 300 still here / 700 lost |
| 03 · Response | 57% | of the 300 who stayed never heard back in 24 hours. | 129 still engaged / 871 lost |
| 04 · Voicemail | 80% | of callers hit voicemail and never called back. | 49 still engaged / 951 lost |
| 05 · Truth | 19 | of 1,000 ever booked a showing. | 19 booked / 981 paid for, gone |
| 06 · DealerEdge | 60 | bookings instead of 19. Same 1,000 buyers. | 60 booked / +41 deals recovered |

Beat 02 subhead cites the 200-site audit: average mobile load **17.3s**. Beat 06 reveals the `Scroll to see how.` prompt after the recovery animation.

### Scene state per beat

`initCohortStatsSection()` owns the hero. It builds 100 `.s-cohort-dot` nodes, maps ScrollTrigger progress to the six cohort stages, updates counters, and uses a generation token (`cohortGen`) so stale final-beat timeouts do not mutate the DOM after the user scrolls away.

### Final recovery beat

Beat 06 sequence:

1. Preserve the 981 lost baseline so the reader remembers the problem.
2. Restore a few previously red dots with green pulses.
3. Count bookings from 19 to 60 using four bounded fix cards: instant page load, AI replies in 60 seconds, automated follow-up, smart voicemail capture.
4. Reveal `[data-scene-next]` with **Scroll to see how.**

### Performance gates

- **ScrollTrigger progress only** — no physics and no Matter.js.
- **`cohortGen`** — stale recovery timeouts bail when the user jumps stages mid-animation.
- **`prefers-reduced-motion`** — number tweens and recovery delays collapse to near-instant.
- **100 DOM dots** — still lightweight and easier to understand than moving physics particles.

### When to NOT add physics to other beats

For "particles flowing" elsewhere (e.g., Act 4 Beat 1 funnel dots), use simple `setTimeout`-driven `<div>` particles with CSS transitions or GSAP. Do not add Matter.js back.

---

## Design system

### Color tokens (defined in [`css/sales.css`](css/sales.css))

```css
--bg: #000;                         /* page background */
--panel: #0a0a0a;                   /* card backgrounds */
--panel-2: #111;                    /* nested cards */
--accent: #ee3a39;                  /* red — "without DealerEdge" / negative / pain */
--accent-dim: rgba(238,58,57,0.12);
--good: #4ade80;                    /* green — "with DealerEdge" / positive / win */
--good-dim: rgba(74,222,128,0.12);
--text: #fff;
--text-mid: rgba(255,255,255,0.75);
--text-dim: rgba(255,255,255,0.45);
--line: rgba(255,255,255,0.08);
--line-strong: rgba(255,255,255,0.16);
--font: 'Inter', sans-serif;
--mono: 'JetBrains Mono', 'SF Mono', Menlo, monospace;
```

### Color narrative (important)

**Red = "the old way," "without DealerEdge," "pain."** Green = "the new way," "with DealerEdge," "win." Use them as semantic signals, not decoration. If a stat is bad news, it's red. If it's a benefit, it's green. The Act 1 vs Act 2 watermarks, vrow tags, bubble strokes, and beat caps all follow this — keep it consistent.

### Type

- **Inter** for everything UI (300–900 weights loaded)
- **JetBrains Mono** for timestamps, technical metadata, code-like content, eyebrow labels, mono-font captions
- Headlines: clamp(2rem, 4vw, 3.4rem), weight 700–800, letter-spacing -0.02em
- Body: 1rem, line-height 1.5–1.6, color var(--text-mid)
- Mono captions: 0.62–0.74rem, letter-spacing 0.12–0.22em, uppercase

### CSS naming

`.s-` prefix for everything on the sales page (`.s-act`, `.s-beat`, `.s-validator`, `.s-bs-rep`, etc.). BEM-ish (`.s-thing--variant`, `.s-thing-part`). State classes use `is-*` (`.is-active`, `.is-in`, `.is-pulse`, `.is-pressed`).

When building other pages with the act/beat pattern, **reuse the `.de-` chassis as-is** (it's the shared component) and give page-unique stage content its own page prefix (`.o-` for an operations page, etc.) so page styles don't leak.

### Spacing

- Card radius: 14px (large cards), 10px (medium), 6px (small)
- Card padding: 18–22px inside; 8–14px between cards
- Section padding: 80–140px vertical, 24–32px horizontal

### Cursor

There's a custom cursor system inherited from Evan's POC (`.cursor-glow`, `.custom-cursor`). The HTML cursor is hidden (`cursor: none !important` globally) and replaced with a JS-driven white dot. Don't remove this unless you also reset the global `cursor` rule.

---

## External libraries (CDN, no build step)

All loaded via CDN in each page's `<head>`. Don't add new libraries casually — keep this list lean.

- [**Lenis**](https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js) v1 — smooth scroll
- [**GSAP**](https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js) 3.12.5 — animations
- [**ScrollTrigger**](https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js) 3.12.5 — scroll-driven triggers
- Google Fonts: Inter + JetBrains Mono

---

## Deploy workflow (here.now)

### Live URL (don't change the slug)

**https://mantra-harbor-8vkd.here.now/** — owned by Jason's here.now account, authenticated, permanent.

### Why we use a separate "preview" folder

The source repo (`c:\Users\jason\repos\dealer-edge-website`) has a **~70 MB `.git` directory** that breaks the here.now upload on Windows Git Bash (the script hashes every file through subshells, which on Windows is glacial). We mirror only the runtime files into `c:\Users\jason\repos\dealer-edge-preview` and publish from there.

The preview folder is excluded from the .git tree. Don't commit it; don't run `git init` inside it.

### Deploy steps

```powershell
# 1. Sync only the files you changed into the preview folder
$src = "C:\Users\jason\repos\dealer-edge-website"
$dst = "C:\Users\jason\repos\dealer-edge-preview"
Copy-Item "$src\sales.html"      "$dst\"     -Force
Copy-Item "$src\css\sales.css"   "$dst\css\" -Force
Copy-Item "$src\js\sales.js"     "$dst\js\"  -Force
# shared-layer files when touched:
Copy-Item "$src\css\de-act.css"  "$dst\css\" -Force
Copy-Item "$src\js\de-core.js"   "$dst\js\"  -Force
# (and any other changed runtime files — never .git, never node_modules)

# 2. Publish via the existing wrapper (uses Git Bash + here.now/publish.sh)
& "C:\Program Files\Git\bin\bash.exe" "C:/Users/jason/repos/dealer-edge-preview/.run-publish.sh"

# 3. Check the result
Get-Content C:\Users\jason\repos\dealer-edge-preview\publish-out.log -Tail 12
```

The wrapper script `.run-publish.sh` calls `~/.agents/skills/here-now/scripts/publish.sh . --slug mantra-harbor-8vkd ...` which auto-updates the existing site (delta upload — only changed files re-upload).

### When NOT to redeploy

CLAUDE.md, README, .git/*, plan files, scratch files — none of these are runtime assets. Don't redeploy when only meta files change.

---

## Git workflow

```powershell
# Stage + commit (use a temp file for multi-line messages — PowerShell doesn't handle heredoc well)
git -C C:\Users\jason\repos\dealer-edge-website add -A
git -C C:\Users\jason\repos\dealer-edge-website commit -F .git/COMMIT_MSG.tmp
Remove-Item C:\Users\jason\repos\dealer-edge-website\.git\COMMIT_MSG.tmp
git -C C:\Users\jason\repos\dealer-edge-website push origin main
```

Don't use `git commit -m "$(cat <<'EOF' …)"` heredoc syntax — PowerShell parses it as positional args and the commit fails with a path-spec error. Always write the message to a temp file and use `-F`.

---

## Common tasks

### Add a new Beat to an existing Act

1. **HTML**: Add a new `<p class="de-act-line" data-beat="N">… <b>accent</b> …</p>` to `.de-act-lines` and a matching `<div class="de-beat" data-beat="N" data-anim="actX-beatN">…</div>` to the right stage.
2. **CSS**: Bump the act's scene-count class (`de-act--5` → `de-act--6` etc.) — heights for desktop AND mobile come with it from de-act.css.
3. **JS**: Write `playActXBeatN(beatEl, stillCurrent)` following the conventions above. Register it in `BEAT_ANIMS`.
4. **Reset on entry**: First thing the function does is reset any animation state, so re-entry replays cleanly.
5. **Test mobile**: Verify beat progression under 1100px (115vh/scene pin, single-column layout inside sticky pin).

### Add a new Act

1. Copy the structure of an existing Act in `sales.html`.
2. Decide the watermark text, headline, beat copy.
3. Decide N beats; set `height: <N*100>vh` on the act.
4. Wire each beat with `data-anim` and a JS handler.
5. Add a pivot section before it for transition.

### Edit copy without breaking the canon

- Demo story specifics live in the "Demo story canon" table above. If you need to change one (e.g. swap the boat model), update the table here AND grep-replace across `sales.html` + `js/sales.js` AND check Notion's DealerEdge Spine doc.
- The Offer language is locked. Don't soften it.
- Stats are concrete. Don't generalize them.

---

## What NOT to do

- **Don't rewrite The Offer.** "Match-spend + prove-it + tiered activation" is the locked language. Soft variants ("free trial," "money back guarantee," "no risk") undermine the actual mechanic.
- **Don't change demo story specifics** without updating the canon table above. Mixing "Saturday at 10 AM" and "Tuesday at 10 AM" in different beats has happened — caused a Jason callout because the timing made no sense.
- **Don't add CSS keyframe animations to beat content that ignore the IntersectionObserver gate.** Use JS-driven animations that read `stillCurrent` so they don't pre-play off-screen.
- **Don't break the scroll-pinned act sizing** — heights come from the `de-act--N` scene-count classes in de-act.css (scenes × 80vh desktop / × 115vh mobile, intro counts as a scene). Wrong N = last beat unreachable.
- **Don't deploy the full source folder** to here.now — the `.git` folder is too big for Windows Git Bash to chew. Use the preview-folder pattern.
- **Don't push to remote without committing cleanly.** Don't force-push to main.
- **Don't add new CDN dependencies** without explicit permission. Keep the dependency list lean: Lenis, GSAP, ScrollTrigger, fonts. That's it.
- **Don't add matter.js back** without explicit permission — the Stats Section now uses GSAP + DOM sprites.
- **Don't restyle `.de-` chassis classes from a page stylesheet.** de-act.css owns them; page overrides hang off a page hook class (`.s-act--team .de-act-stage-sticky`). Page-unique components keep their page prefix (`.m-`/`.s-`) so styles don't leak.
- **Don't commit the preview folder** (`c:\Users\jason\repos\dealer-edge-preview`) into this repo.
- **Don't reuse a `data-anim` key** across two different beats. Each key resolves to exactly one handler.
- **Don't put live API keys, customer phone numbers, or PII** anywhere in this repo. Even in demo data — use the `+1 (615) 555-XXXX` style fake numbers.

---

## Open questions for future iterations

- **CTA / The Offer**: currently four lines of text. Next iteration likely becomes a 3-beat sequence: vendor swap → mechanic → tier cards.
- **Other pillars**: Marketing and Operations need the same act/beat treatment Sales got. The sales.html structure is the template.
- **Real backends for Act 3**: SMS demo is fake-scripted. Real Twilio wiring planned later.
- **Stats Section cohort math**: tune the `stages` and `recoverySteps` arrays in `initCohortStatsSection()` in [`js/sales.js`](js/sales.js). Keep the through-line as one 1,000-buyer cohort and keep the final claim grounded as 60 bookings instead of 19, roughly 3X.

---

## Source-of-truth links

- **The Edge Platform GTM (Notion front door)** — https://www.notion.so/367c8999b11481e7a9dde5ee3c66f79f
- **DealerEdge Spine** — https://www.notion.so/367c8999b1148100b365de9153d3b61a
- **OEM Edge Spine** — https://www.notion.so/367c8999b1148128ba05d6e352acdcc5
- **Real Edge Spine (v0.1)** — https://www.notion.so/367c8999b114819986cde5ed95e955e9
- **The Team page** — https://www.notion.so/367c8999b11481bba838dc072c0e3164
- **Master Asset Map (database)** — https://www.notion.so/e1d590a857604a5782e8dca07c7533b6
- **DealerEdge Core Messaging & Philosophy** — https://www.notion.so/31dc8999b114812895ccf2c448533a88
- **Sales Messaging & Positioning Playbook** — https://www.notion.so/31ac8999b1148191bcb7f62a8d983f4e
- **GTM Strategy One-Pager** — https://www.notion.so/31dc8999b11481c0ab77d8ea5b49ea8a
- **Two Lenses (Customer Journey & M/S/O)** — https://www.notion.so/31dc8999b11481fda5acf2917cfa6a78
- **DealerEdge Deck v2 outline** — https://www.notion.so/31ac8999b114811f9ed4fc56750547f0
- **Dustin's Business Outcomes Calendar** — https://github.com/BonsaiMediaGroup/dealeredge-demo-generator/blob/staging/docs/marketing/dealeredge-business-outcomes-calendar.md
- **Video Production Calendar (12-week plan)** — https://www.notion.so/31ac8999b114816fae1cf63e77a32bc6

---

*Last updated: 2026-06-11 by Claude Code (Fable 5) — sales.js controller merge: deleted the page-local `createActController`/`setupActs`, sales now runs the shared `DE.initActs` (one act engine across all five pages); engine gained `fitBeats` (mobile beat-fit, sales-only opt-in) and the static-act-phase fallback; all 14 sales anims now set `.is-playing` (the replay gate); verified with a headless act-by-act harness (phases, exclusive activation, intro replay, replay gate under scroll nudges, mobile fit). Also: PLATFORM-MIGRATION-PLAN.md rewritten as v2 (export-pipeline + vanilla-island architecture). Previously: 2026-06-04 by Claude Code (Opus 4.8) for inventory.html — the third deep-dive instance (static before/after hero, shared includes/compare, 2 couplet acts incl. the proprietary-pipeline beat with real Supra/Moomba before/afters, territory pricing engine; `assets/inventory/`; Inventory nav link on all 8 pages) and the `DE.initActs` promotion (marketing's act controller moved into de-core.js, used by marketing + inventory; sales controller merge still pending). Earlier the same day: the shared static sections (`.de-includes` + `.de-compare` + `.de-section-label` promoted into de-act.css; sales gained both under its hero — "From 19 bookings to 60" checklist + 7-row Without/With table). Earlier the same day: the shared layer (css/de-act.css + js/de-core.js — one `.de-` act chassis and one scroll-engine for marketing + sales, boat CTA/nav/fade promoted to style.css). Earlier the same day: the sales.html port of the marketing patterns (intro scenes, 80vh pacing, snap, line-mode copy, "AI sales platform" title) and the "AI platform" identity-noun rule (Dustin Talley feedback). Previously: 2026-05-27 by Codex GPT-5 for the continuous 1,000-buyer cohort hero. When you add to this file, add a date stamp and your tool name so we can see how this doc evolves.*
