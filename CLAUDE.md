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
- "System" > "platform" in most contexts. Platform appears in The Edge Platform name and that's mostly where it stops.
- Stats are CONCRETE. "78%" not "most." "59h 25m" not "over a day." "\$162,900" not "around \$160K."
- 4-beat story structure per topic (the pattern in Dustin's Business Outcomes Calendar): *Where they are today → What changes → What it means in dollars/time/deals → How they think differently after.*
- One number per topic. Each section should have a single anchor stat the reader could repeat the next day.
- Things we never give away: internal tool names, AI vendor names, prompt-engineering details, syndication partner names, autonomy-level configuration, the content engine pipeline. The "secret sauce guardrails" from the Business Outcomes Calendar apply to all copy here.

---

## Page architecture (sales.html is the canonical pattern)

A "deep-dive page" is structured as: **Hero → Stats Section → Marine Reality → N Acts → CTA**.

The current `sales.html` order is:

1. **Hero** (`s-hero`) — static (no scroll-pin), full-viewport. The "78% of buyers go with whoever answers first/answers" strike-through headline. Parallaxes off as the user scrolls. Sets up the story; doesn't carry the cascade.
2. **Stats Section** (`s-stats-section`, `id="stats"`) — scroll-pinned 600vh physics cascade. 6 beats; see "Stats Section" below for the full mechanic. Each scroll release opens the next filter's gate. Beat 06 is the reverse cascade.
3. **Marine Reality** (`s-marine`) — two-column section: NMMA citation on left (with the official NMMA logo on a white attribution card so brand colors stay intact against the dark theme), Lead Black Hole + TCO Friction frustration cards on the right + green bridge callout that explicitly ties to the Act 4 Beat 6 foreshadow ("Coming: deal flow, licensing, registration, service").
4. **Act 1** (`s-act--without`) — Without DealerEdge, 4 beats
5. **Pivot** (`s-pivot`) — transition
6. **Act 2** (`s-act--with`) — With DealerEdge, 4 beats
7. **Act 3** (`s-try`) — Try it yourself (interactive SMS demo)
8. **Pivot 2** (`s-pivot--alt`) — transition
9. **Act 4** (`s-act--team`) — Sales-team-side, 6 beats including ROI calc and philosophy close
10. **CTA** (`cta-section`) — The Offer (currently static; planned for upgrade)

An **Act** is a scroll-pinned scene that holds the viewport while the user scrolls through **Beats**. Each Beat is one moment in the act's story.

```
<section class="s-act s-act--with" id="actN">
  <div class="s-act-watermark s-act-watermark--with">ACT NAME · LABEL</div>
  <div class="s-act-inner">
    <div class="s-act-copy">             <!-- LEFT: progressive copy -->
      <div class="s-act-copy-sticky">
        <span class="s-act-tag s-act-tag--good">Tag line</span>
        <h2 class="s-act-headline">…</h2>
        <div class="s-act-beats">
          <div class="s-act-beat" data-beat="1">…</div>
          <div class="s-act-beat" data-beat="2">…</div>
          …
        </div>
      </div>
    </div>
    <div class="s-act-stage">            <!-- RIGHT: media that morphs -->
      <div class="s-act-stage-sticky">
        <div class="s-beat s-beat--1 is-active" data-beat="1" data-anim="actN-beat1">…</div>
        <div class="s-beat s-beat--2"           data-beat="2" data-anim="actN-beat2">…</div>
        …
      </div>
    </div>
  </div>
</section>
```

### Critical sizing rule

The act's height = N beats × 100vh.

```css
.s-act { height: 400vh; }              /* 4 beats */
.s-act--team { height: 600vh; }        /* 6 beats */
```

If you change the number of beats, change the height. If you forget, the last beat will be unreachable.

### Mobile breakpoint

At ≤1100px wide, the scroll-pin is disabled and beats stack vertically. JS detects this and switches from `ScrollTrigger.onUpdate` to per-beat `IntersectionObserver`. Don't break this fallback when adding beats.

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
- `data-stats-section`, `data-cascade-copy`, `data-cascade-stage`, `data-canvas-wrap`, `data-cascade-canvas` — Stats Section root hooks
- `data-cbeat`, `data-jump-to-beat` — Stats Section beat buttons (left column); the latter enables scroll-jump nav
- `data-stage-label` — Stats Section filter labels overlaid on canvas
- `data-tally`, `data-tally-row`, `data-tally-num`, `data-tally-active` — Stats Section per-filter loss tally column (top-right)
- `data-compare`, `data-compare-active`, `data-compare-after` — Stats Section Beat 06 before/after overlay
- `data-mode="fix"` on `.s-cascade-canvas-wrap` — Stats Section Beat 06 reverse-cascade reskin
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

---

## Stats Section (the 6-beat physics cascade, `sales.html` only)

The second section of `sales.html` is a [matter.js](https://brm.io/matter-js/) physics simulation that walks the Killer Proof Chain beat by beat. 1,000 buyer-balls sit static at the top. Each scroll release opens the next filter's gate, balls drop, and red trash piles accumulate against the walls as visual proof of every loss. Beat 06 dissolves the gates and runs a green wave that mostly survives — the "with DealerEdge" reversal.

The section is `600vh` (six beats × 100vh) and is scroll-pinned via CSS sticky on `.s-stats-pin`.

### 6-beat structure

| Beat | Left caption | Physics action | Tally row |
|---|---|---|---|
| 01 | "1,000 buyers arrive…" | Spawn 1,000 white balls at top, **isStatic: true** (hovering) | none |
| 02 | "78% bounce on CWV" | `setStatic(false)` → balls drop. 78% bounce off Filter 1's wall (red trash), 22% pile above Gate 1. | row 2: `780 lost` |
| 03 | "57% never get a response" | `World.remove(gate[0])` → survivors fall through. 57% bounce off Filter 2 wall, 43% pile above Gate 2. | row 3: `125 lost` |
| 04 | "80% hit voicemail" | `World.remove(gate[1])` → survivors fall. 80% bounce off Filter 3 wall, 19 pile above Gate 3. | row 4: `76 lost` |
| 05 | "19 of every 1,000" | `World.remove(gate[2])` → 19 survivors land in BOOKED sensor zone (bright green). | row 5 (final): `19 booked` |
| 06 | "DealerEdge dissolves every gate" | Filter wall segments turn green, red trash piles fade then are removed from world, filter walls rebuilt with WIDE green gaps, second 1,000-ball wave drops. `compareEl` overlay reveals "Without 19 → With ~786" comparison live. | compare overlay |

The actual counts are organic — physics is chaotic, so the displayed numbers are whatever the simulation produces, not pre-computed totals.

### The gated-filter mechanic

This is the unlock that makes the wave-on-scroll work. Each filter has THREE bodies:

1. **Left wall segment** — solid, fills `[0, gapLeft]` at the filter's Y position
2. **Right wall segment** — solid, fills `[gapRight, w]` at the filter's Y position
3. **Gate** — solid, fills `[gapLeft, gapRight]` at the filter's Y position, **removable**

Together they form a complete wall. Balls pile above. When the user scrolls into the next beat, `World.remove(world, filter.gate)` opens the gap. Balls flow through naturally. No teleporting, no fake pouring, no fighting gravity.

```js
function buildBrokenFilters() {
  FILTER_Y.forEach((yPct, i) => {
    const rate = [BROKEN_RATES.f1, BROKEN_RATES.f2, BROKEN_RATES.f3][i];
    const gapW = Math.max(44, w * rate * 0.85);
    const gapLeft = (w - gapW) / 2;
    const gapRight = gapLeft + gapW;
    const yPx = h * yPct;
    const leftSeg  = Bodies.rectangle(/*…*/, makeFilterStyle());
    const rightSeg = Bodies.rectangle(/*…*/, makeFilterStyle());
    const gate     = Bodies.rectangle(/*…*/, makeGateStyle());
    Composite.add(world, [leftSeg, rightSeg, gate]);
    filters.push({ /*…*/, gate, idx: i, open: false });
  });
}
function openGate(i) {
  const f = filters[i];
  if (!f || f.open) return;
  f.open = true;
  Composite.remove(world, f.gate);
}
```

### Forward-only beat advancement (no rewind reset)

`enterBeat(beat)` is **monotonically progressive**. Jumping forward (1 → 5) cascades all intermediate state changes (release balls, open gates 0/1/2, reveal tally rows). Jumping backward (5 → 2) only updates the active caption / completed dots — the canvas keeps its accumulated state (red trash piles, counters frozen at their current values).

This is by design. A "true reset" would require wiping and replaying the matter.js world on every backward jump, which is expensive and visually jarring. Reviewing past beats with the canvas in its "story so far" state is the simpler read.

The scroll-jump nav (`[data-jump-to-beat]` buttons in the left column) uses `lenis.scrollTo` so the smooth-scroll engine handles the animation.

### Reverse cascade (Beat 06)

`runReverseCascade()` fires once when the user crosses into Beat 06:

1. Set `[data-mode="fix"]` on `.s-cascade-canvas-wrap` — CSS swaps the tint from red to green.
2. Color all old filter wall segments green (visual cue: "AI dissolves the obstacles").
3. Fade red trash balls' alpha from 1 → 0 over ~0.9s, then `Composite.remove` them and splice from the `balls[]` array.
4. After fade, remove the old red filter wall segments and rebuild filters with WIDE green gaps (using `FIXED_RATES` instead of `BROKEN_RATES`).
5. Spawn a second 1,000-ball wave tagged with `b.fixed = true`, dropping immediately (not static-and-released).
6. Reveal `.s-compare` overlay. The "With DealerEdge" counter ticks up live as `b.fixed` balls land in the BOOKED sensor zone.

The pass rate flips from `0.22 * 0.43 * 0.20 ≈ 1.9%` to `0.94 * 0.91 * 0.92 ≈ 78.7%`. Same canvas, same gravity, dissolved gates. ~786 booked vs 19.

### Ball color progression

```
spawn        → white #ffffff   (potential buyer)
past filter 1→ yellow #fbbf24  (survived CWV)
past filter 2→ orange #fb923c  (also got a response)
past filter 3→ light green #86efac (also got a human at the phone)
booked       → bright green #4ade80 (showing booked)
rejected     → red #ee3a39     (hit a filter wall = lost)
```

Colors are mutated by setting `body.render.fillStyle` and matter.js's `Render` picks them up on the next frame.

### Performance gates

- **`visObs` IntersectionObserver** — pauses the matter.js `Runner` when the section is off-screen, resumes when back on-screen. Without this, the physics keeps running while the user is scrolled to Act 4 — pointless CPU.
- **Mobile / reduced-motion fallback** — `if (isSmallViewport || !window.Matter || prefersReducedMotion) initStatsSectionFallback();` short-circuits the entire physics stack. The fallback animates the four tallies to their target counts and reveals the compare overlay statically. The scroll-jump nav still works for both paths.
- **Static initial wave** — the initial 1,000 balls spawn as `isStatic: true`. Matter.js doesn't simulate static bodies. Only on Beat 02 entry do we `setStatic(false)` and pay the per-frame cost.
- **Trash cleanup at Beat 06** — when the reverse cascade fires, ~981 red trash balls are removed from the world after their fade-out so the green wave isn't simulated alongside the dead pile.

### Tuning the cascade math

```js
const BROKEN_RATES = { f1: 0.22, f2: 0.43, f3: 0.20 };   // narrow gaps  → ~19 booked
const FIXED_RATES  = { f1: 0.94, f2: 0.91, f3: 0.92 };   // wide gaps    → ~786 booked
```

Filter gap widths are calibrated with `gapW = w * rate * 0.85` for the broken pass and `* 0.92` for the fixed pass. The multiplier compensates for balls bouncing back through gaps. If the displayed counts drift far from target, adjust the gap-width multiplier, not the rates themselves.

### When to NOT add ball physics to other beats

The physics cascade is intentionally the ONLY matter.js usage on the page. Reasons:

- Performance — running multiple physics worlds compounds CPU cost.
- Visual restraint — if every section had falling balls, the cascade would lose its punch.
- The 80KB matter.js download is justified by one big moment, not many small ones.

For "particles flowing" elsewhere (e.g., the Act 4 Beat 1 funnel dots), use simple `setTimeout`-driven `<div>` particles with CSS transitions. Matter.js is reserved for the cascade.

### Restoring/changing the hero

The hero (`s-hero`) above the cascade is the original 78% strike-through block: "78% of buyers go with whoever ~~answers first~~ answers." The strike-through animates ~1.2s after page load via `heroHeadline.classList.add('is-revealed')` in [`js/sales.js`](js/sales.js). Keep this section simple — the heavy lifting is in the Stats Section below.

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

When building other pages with the same act/beat pattern, **change the prefix** to match the page (`.h-` for hero, `.f-` for features, etc.) so styles don't leak across pages.

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
- [**matter-js**](https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.20.0/matter.min.js) 0.20.0 — 2D rigid-body physics. **Only used by the Stats Section on `sales.html`.** Don't load on other pages unless you also need a physics simulation.
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

1. **HTML**: Add a new `<div class="s-act-beat" data-beat="N">…</div>` to the left copy and a matching `<div class="s-beat s-beat--N" data-beat="N" data-anim="actX-beatN">…</div>` to the right stage.
2. **CSS**: Adjust the act's height to `height: <N*100>vh;`.
3. **JS**: Write `playActXBeatN(beatEl, stillCurrent)` following the conventions above. Register it in `BEAT_ANIMS`.
4. **Reset on entry**: First thing the function does is reset any animation state, so re-entry replays cleanly.
5. **Test mobile**: Verify it works under 1100px viewport (where the scroll-pin is disabled).

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
- **Don't break the scroll-pinned act sizing** (`height: N*100vh` rule). Last beat goes unreachable.
- **Don't deploy the full source folder** to here.now — the `.git` folder is too big for Windows Git Bash to chew. Use the preview-folder pattern.
- **Don't push to remote without committing cleanly.** Don't force-push to main.
- **Don't add new CDN dependencies** without explicit permission. Keep the dependency list lean: Lenis, GSAP, ScrollTrigger, matter-js (sales.html only), fonts. That's it.
- **Don't load matter.js on pages other than sales.html** — it's a 80KB cost for one specific feature (the Stats Section cascade). Other pages shouldn't pay for it.
- **Don't make the Stats Section's `enterBeat` rewind-aware** — it's intentionally forward-only. Adding a hard reset on backward scroll-jumps is expensive and visually jarring. Captions update, canvas stays in its accumulated state. If users complain, address it in v2 with a snapshot/restore approach, not by tearing down the world on every backward tick.
- **Don't replace the cascade with multiple physics simulations** scattered across the page. One big physics moment > many small ones (performance AND visual impact reasons).
- **Don't delete the `.s-` CSS prefix.** It's the namespace boundary; styles will leak across pages without it.
- **Don't commit the preview folder** (`c:\Users\jason\repos\dealer-edge-preview`) into this repo.
- **Don't reuse a `data-anim` key** across two different beats. Each key resolves to exactly one handler.
- **Don't put live API keys, customer phone numbers, or PII** anywhere in this repo. Even in demo data — use the `+1 (615) 555-XXXX` style fake numbers.

---

## Open questions for future iterations

- **CTA / The Offer**: currently four lines of text. Next iteration likely becomes a 3-beat sequence: vendor swap → mechanic → tier cards.
- **Other pillars**: Marketing and Operations need the same act/beat treatment Sales got. The sales.html structure is the template.
- **Real backends for Act 3**: SMS demo is fake-scripted. Real Twilio wiring planned later.
- **Stats Section calibration**: the displayed BOOKED count is whatever the physics actually produces. If broken-pass drifts much from ~19 or fixed-pass drifts much from ~786, tune the `gapW * 0.85` / `gapW * 0.92` multipliers or seed `BROKEN_RATES` / `FIXED_RATES`.

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

*Last updated: by the agent that built Act 4. When you add to this file, add a date stamp and your tool name so we can see how this doc evolves.*
