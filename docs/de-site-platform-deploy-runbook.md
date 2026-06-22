# DealerEdge Platform Deploy Runbook

Use this when deploying the optimized static DealerEdge marketing site to the platform-hosted custom domain:

https://dealeredge.dealeredge.ai/

## Repos

Static site source:

```text
C:\Users\jason\repos\dealer-edge-website
```

Clean platform deploy worktree:

```text
C:\Users\jason\repos\dealerEdge-demo-generator-deploy-de-site
```

Avoid deploying from a dirty main platform repo. Use the clean deploy worktree.

## Export

From the static repo:

```powershell
node scripts/export-platform.mjs C:\Users\jason\repos\dealerEdge-demo-generator-deploy-de-site
```

The exporter writes:

- `lib/de-site/fragments/*.html`
- `lib/de-site/fragments/*.meta.json`
- `public/de-site/css`
- `public/de-site/js`
- `public/de-site/assets`
- `public/de-site/partials`
- `public/de-site/vendor`

Expected warning:

- `sales: footer: open tag not found`

This is acceptable because the platform renders its own header/footer chrome.

## Export Gotchas

- Dynamic JS/CSS refs inside page scripts must be copied and rewritten to absolute `/de-site/...` URLs.
- Late partial fetches must use `/de-site/partials/...`.
- `de-chrome.css` must be emitted even when optimized pages no longer load `css/style.css` directly. The platform layout links it for the header/footer.
- Do not reintroduce CDN runtime dependencies for platform pages. Platform CSP expects same-origin vendored runtime scripts.

## Platform Middleware Gotcha

The platform middleware must not intercept static `/de-site` runtime assets. The middleware matcher should exclude runtime/static extensions such as:

```text
css, js, mjs, map, html, txt, svg, png, jpg, jpeg, gif, webp, avif, ico, mp4, webm, woff, woff2
```

If this is wrong, `/de-site/js/*.js`, `/de-site/css/*.css`, or `/de-site/partials/*.html` can fall through to `/[[...slug]]` and return HTML with status `200`.

Verify with:

```powershell
Invoke-WebRequest -Uri https://dealeredge.dealeredge.ai/de-site/js/inventory-late.min.js -Method Head
Invoke-WebRequest -Uri https://dealeredge.dealeredge.ai/de-site/css/de-chrome.css -Method Head
```

The content types must be JavaScript/CSS, not `text/html`.

## Commit Before Vercel Deploy

The Vercel file collector can skip untracked exported files from the deploy worktree. After export, commit the platform output in the deploy worktree before deploying.

```powershell
git add -A lib/de-site public/de-site middleware.ts
@'
Deploy DealerEdge marketing site export

Export optimized DealerEdge static fragments, runtime assets, lazy partials, and platform routing fixes.
'@ | Set-Content -Path COMMIT_MSG.tmp
git commit -F COMMIT_MSG.tmp
Remove-Item COMMIT_MSG.tmp
```

Do not push this deploy worktree commit unless Jason asks.

## Deploy And Alias

From the platform deploy worktree:

```powershell
npx vercel deploy --prod --yes
```

The CLI may alias the deployment to another production domain by default. Always explicitly alias DealerEdge afterward:

```powershell
npx vercel alias set https://<deployment-url> dealeredge.dealeredge.ai --scope social-bee
```

## Post-Deploy Checks

Run:

```powershell
npm run smoke:live -- --base https://dealeredge.dealeredge.ai
```

Minimum manual checks:

- `/inventory` returns `200`.
- First wheel scroll does not snap back to top.
- Inventory late content loads after the first hero scroll settles.
- First inventory act locks and a beat gets `.is-in` animated content.
- `/de-site/js/inventory-late.min.js` serves JavaScript.
- `/de-site/css/de-chrome.css` serves CSS.

Known non-blocking noise:

- Platform RSC prefetches may return `401` for some CMS/platform-managed routes.
- Homepage may emit React hydration warning `#418` from the platform shell. The deep DealerEdge island pages should be clean.

