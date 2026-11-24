# Wake & Water — static demo snapshot

A static copy of the Wake & Water (Lake Norman) dealer site as it runs locally on the
DealerEdge platform. Built by crawling a local production build (`next start`) and
saving every page plus its images, video, CSS and JS.

- Deployed on Netlify as its own site, publishing this folder.
- Pages, navigation, galleries and inventory listings work. Anything that needs the
  server (lead forms, chat, search, favorites, analytics) does not.
- `_headers` sets `noindex` so this copy stays out of search results.

Regenerate: start the local site (see `wake-water-seed/README.md`), run
`npm run build && npx next start -p 3001` in `dealeredge-demo-generator`, then
`python3 _tools/snapshot.py http://localhost:3001 <out>` and copy
`.next/static/` into `<out>/_next/static/`.
