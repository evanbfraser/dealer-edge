# DealerEdge Site Performance Playbook

Use this playbook when optimizing the DealerEdge marketing experience in this repo.

## Scope

Owned pages:

- `index.html`
- `sales.html`
- `marketing.html`
- `inventory.html`
- `analytics.html`
- `features.html`
- `pricing.html`
- `roi.html`

Do not optimize this repo's case-study pages unless Jason explicitly asks. Live case studies are run by the DealerEdge platform/CMS.

## Principle

Maximize page-load performance without flattening the sales experience. These are cinematic, sales-focused pages; a small, intentional load cost is acceptable when it preserves:

- Lenis smooth scroll
- pinned story sections
- beat animations
- late-loaded act content
- premium interaction details

Avoid chasing a raw sub-50ms load target when the next change would visibly degrade the experience or mostly improve a synthetic number.

## Current Benchmark Baseline

Last known good local benchmark after the Lenis and inventory animation fixes:

- Report: `perf-reports/2026-06-20T20-14-12-131Z`
- Command: `npm run benchmark`
- Conditions: local static server, Playwright, desktop `1365x900`, mobile `390x844`, 3 runs per page.

Owned-page results were clean:

- no console errors
- no failed owned-asset requests
- CLS at or near `0`
- FCP/LCP generally under `150ms` locally
- inventory and analytics initial transfer restored to roughly `142-146KB` after backing late content out of first-load

## Reasonable Goals

Use these as guardrails, not a mandate to over-optimize:

- No owned-page console errors.
- No failed `/de-site`, `assets`, `css`, `js`, or `partials` requests.
- CLS <= `0.02`.
- FCP/LCP <= `150ms` locally for owned pages, unless a known platform or browser timing artifact explains the miss.
- Desktop/mobile initial transfer should stay close to the current page class:
  - inventory/analytics: about `145KB`
  - marketing/features/sales: acceptable to be heavier when prewarming scroll/story engines
  - pricing/roi: should remain lightweight
- Preserve smooth first scroll. No `scrollY` drop back to `0`/`1` during the first wheel gesture.

## Optimization Pattern

1. Run `npm run benchmark`.
2. Identify the largest outlier by page and cause: image, script, CSS, lazy-load timing, route/platform issue.
3. Make one meaningful change.
4. Run a focused smoke check for the affected page.
5. Run `npm run benchmark` again before considering the change done.
6. Stop when the next likely improvement would reduce visual quality or add fragile complexity.

## Lazy-Load Rules

- Above-the-fold scroll/story engines may prewarm shortly after boot if first-scroll quality depends on them.
- Below-the-fold act content should lazy-load by proximity, click, or intent.
- Do not load late act bundles synchronously inside the first wheel handler. That can make Lenis feel broken.
- On inventory and analytics, the late-section unlock intentionally waits until after the first hero scroll settles.

## Validation Commands

```powershell
npm run benchmark
npm run smoke:live -- --base https://dealeredge.dealeredge.ai
```

For quick local first-scroll checks, use Playwright against `http://127.0.0.1:8000/` while the local server is running.

