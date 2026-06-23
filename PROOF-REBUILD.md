# DealerEdge — Proof & Conversion Rebuild

*Source: secret-shopper conviction audit of the live de.de.ai funnel (3 dealer personas + synthesis, 2026-06-22) + the pre-launch QA. This doc is the shareable brief **and** the build spec for fixing the #1 conversion blocker: proof.*

---

## TL;DR

Three dealers walked the whole funnel. **All three landed on "maybe — book the demo." None bounced. None were sold.** The argument is the strongest pitch any of them had seen in years (the funnel-leak math, "count boats not clicks," the ROI calculator's sourced reasoning). The wall they all hit is **proof** — and the cruel part: **the loudest "proof" on the site is the fakest-looking, and it poisons the real proof.**

The fix is **not** "go get 100 dealers." It's: **stop faking dealer proof, and start using the real proof you already have** — 20 years of OEM/enterprise pedigree, one deep flagship dealer (Premier), and a risk-reversal guarantee. Honestly framed, that's a *stronger* hand than a competitor with 50 generic dealer logos and no guarantee.

---

## Part 1 — The audit (the brief)

### Verdict & conviction map (1–10 per page)

| Page | Rick (vendor-burned skeptic) | Dana (growth GM) | Mike (non-technical operator) |
|---|---|---|---|
| Homepage | 4 | 5 | 6 |
| Features | 6 | 5 | **4** |
| Sales | 7 | 8 | 8 |
| Marketing | 5 | 6 | 7 |
| Analytics | 6 | 6 | 6 |
| Inventory | 6 | 7 | 7 |
| ROI | **7** | **8** | **9** |
| Case Studies | 4 | 8\* | **3** |
| **Overall** | 5 — maybe | 7 — maybe | 6 — maybe |

\* Dana scored Case Studies an **8** because she reached the *full* Premier detail (named GM Zach Hommerding, 13.8s→2.3s, 16→636 submissions, BDPI 79). Rick & Mike scored **3–4** because they hit the **teaser whose detail link 404s.** Your single best proof asset is *inconsistently reachable.*

**Shape:** ROI calculator + Sales funnel-math are the peaks; Homepage, Features, and Case Studies are the valleys. The funnel front-loads the weakest pages and buries the two that convert.

### What's actively hurting you (proof problem)
- **Homepage stat band renders `0+ Dealerships / 0% Sales Increase / 0× / 0%`** (counters animate from 0 with no static fallback) — reads as a dead/placeholder site in 5 seconds. Even animated, **"200% Average Sales Increase"** is uncited and reads as invented.
- **"500+ dealers"** contradicts the one case study (all three caught it instantly).
- **Blank "Real Results" dealer logos** (dealer-logo-1..4) with empty quote slots — visibly fabricated.
- Net effect (Rick): the fake numbers **"poisoned"** even the genuinely real Premier story.

### What's working — protect it
- **Trifecta tagline** "More leads in. Faster response out. Nothing lost in between." — all three: clearest line on the site, understood in <5s. Mike: *"the one line I'd repeat to my owner."*
- **Sales 1,000→19→60 funnel-leak math** — highest-conviction narrative; believable *because* it's framed conservatively (3×, not an absurd multiple).
- **ROI calculator + "How we got this"** — dollars rest only on the verified +50% Pied Piper stat, deliberately not the dramatic 3.2×. Rick: *"the single most credible sentence on the site."* This restraint is the trust engine — replicate it.
- **"They count clicks. You count boats" / "One platform, from DMS record to sold boat"** — strongest framing, currently buried on inner pages.
- **The real Premier Watersports case** — your one true credibility anchor.

---

## Part 2 — The proof architecture

### The principle: bridge the vertical-proof gap (a solved B2B problem)
Entering a new vertical without a roster of vertical-specific case studies is bridged with four things. **DealerEdge has all four; the site uses none of them well:**

1. **Tier-up / adjacent proof** — OEM & enterprise work (Supra, Moomba, Regulator, Entegra, + 20 yrs Bonsai enterprise). *Harder* than a dealership.
2. **Founder/operator credibility** — 20 years, $1M+ engagements. The *person* has the track record even where the *product* is new to dealers.
3. **Flagship reference** — Premier Watersports, done deep.
4. **Risk reversal** — the 20%-or-you-don't-pay guarantee. This *is* the answer to "they're early in dealers": the dealer bets with zero downside.

**Positioning moat:** competitors are dealer-origin tech that grew *up* from the dealer floor at $5k/mo. DealerEdge comes *down* from OEM/enterprise. → *"Your last seven vendors learned on dealers. We learned on the manufacturers whose boats are on your lot."*

### The tiered structure (the rule: never blur OEM as "dealer results")
A skeptic instantly catches "Supra" presented as a dealership outcome. So tier it honestly:

- **Tier A — Pedigree: "Who we've built for."** 20 years of OEM & enterprise growth systems → Supra, Moomba, Regulator, Entegra, [enterprise clients]. Framing: *not* dealer results — proof of caliber. ("This is who trusts us to build this.")
- **Tier B — Dealer results.** Premier Watersports, deep and named, + honest "our first — be the next." Add the **boats-sold / revenue** outcome (the number GMs actually buy on — currently missing; it's all leads/SEO).
- **Tier C — Risk reversal.** The guarantee, with mechanics (baseline, what moves 20%, who measures, what activates) so it reads as a *contract*, not a slogan.

### The bridge line (proposed copy — for your edit)
> "We spent two decades building this for the manufacturers whose boats sit on your lot — and for enterprise clients far more demanding than a dealership. Premier Watersports is our first dealer. We're not learning on you; we're bringing OEM-grade systems to the dealer floor. **And we guarantee it.**"

### Homepage fix (replace the fabricated band)
Kill: `500+ Dealerships / 200% Avg Sales Increase / 5× / 98%` + blank logos.
Replace with an **honest credibility band**, e.g.:
> **20 years** building growth systems · **OEM & enterprise** pedigree · **Premier Watersports**: 16 → 636 monthly leads · **Guaranteed**: beat your results 20% in 90 days or you don't pay.

(Final numbers/claims = your call — placeholders above. The point: every number must be real and sourced. Real beats inflated — the skeptic *trusts the honest version more.*)

### Case-studies page layout
1. **Premier (flagship), expanded** — GM quote + photo, before/after incl. a boats-sold/revenue figure, "call this reference" if possible. **Fix the 404 detail link** (cross-repo routing blocker, PROJECT-STATUS.md).
2. **Pedigree row** — OEM/enterprise logos + one-line outcomes, clearly labeled "OEM & enterprise — the pedigree behind the platform."
3. **The early-adopter honesty play** — "We're early in the dealer world by design. That's why the guarantee."

### OEM case-study page template (what I build vs what you fill)
I stand up a reusable case-study page structure (matching the existing design system) per brand:
`[Brand] · [engagement type] · [hero before/after] · [3 metric tiles] · [quote] · [scope] · CTA`
**You supply, per brand:** the real metrics, a quote/attribution (or "results-only, NDA"), logo asset, and confirmation each is a referenceable/namable client.

---

## Part 3 — What I need from you to execute

**Decisions / data (I will not fabricate any of these):**
1. **OEM brands + real outcomes** — for each of Supra / Moomba / Regulator / Entegra (and any enterprise names you can show): the engagement, 1–3 real metrics, and whether the name can be shown (vs "results-only").
2. **Honest dealer-count statement** — replace "500+." Options: "our first dealer," "a growing roster," or a real number. Your call.
3. **Premier deepening** — the boats-sold / revenue outcome to add, and whether we can use the GM quote/photo + a reference offer.
4. **Founder/pedigree copy** — how much of the 20-yr Bonsai / $1M+ / enterprise story to put on-site, and in your voice.
5. **Sign-off on the bridge line + honest band** above (edit freely).

**Execution sequence (on your go):**
1. **Kill the fabricated band + blank logos** → wire in the honest credibility band. *(Highest-leverage, stops active damage. Needs #2 + #5.)*
2. **Build the tiered case-studies page** + the OEM page template. *(Needs #1.)*
3. **Deepen Premier + fix the 404 detail route.** *(Needs #3; the 404 fix spans the platform repo.)*
4. **Promote the winners up-funnel** — "count boats not clicks" into the homepage hero; surface ROI + the 1,000→19→60 stat above the fold.
5. Add the guarantee-mechanics block (Tier C). *(Needs the locked Offer mechanics — already in canon.)*

---

## Guardrails (non-negotiable)
- **No fabricated proof.** Real, sourced numbers only — the audit proves fake proof is worse than honest scarcity.
- **OEM ≠ dealer results** — always labeled as pedigree.
- **The Offer language stays locked** (the 20%/3-month/tiered-activation phrasing).
- **Never name** the under-the-hood syndication vendor or the image pipeline; destination marketplaces are fine.
