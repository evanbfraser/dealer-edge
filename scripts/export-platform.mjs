#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   export-platform.mjs — package the cinematic pages for the
   DealerEdge platform (vanilla-island architecture, see
   PLATFORM-MIGRATION-PLAN.md v2 §1).

   For each page it emits:
     lib/de-site/fragments/<page>.html       body content, nav/footer/scripts stripped,
                                             asset paths rewritten to /de-site/...
     lib/de-site/fragments/<page>.meta.json  title/description/og + bodyClass +
                                             ordered css/js lists for the island loader
   and copies into public/de-site/:
     css/  js/  assets/ (only assets actually referenced)  vendor/ (lenis+gsap+ScrollTrigger,
     downloaded once into this repo's vendor/ then copied — the platform CSP
     only allows same-origin scripts, so the CDN tags can't be used there)

   Usage:  node scripts/export-platform.mjs [platform-repo-path]
   Default target: C:\Users\jason\repos\dealerEdge-demo-generator
   Re-running is a full refresh: the de-site output dirs are owned by this
   script and rebuilt from scratch every time.
   ═══════════════════════════════════════════════════════════════ */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = path.resolve(process.argv[2] || 'C:\\Users\\jason\\repos\\dealerEdge-demo-generator');

const PAGES = ['sales', 'marketing', 'inventory', 'analytics', 'features'];
// index.html (homepage) is deferred: app.js has no DE.boot/DE.destroy lifecycle yet.
// mobile-nav.js is excluded everywhere: the platform renders DeHeader instead.
const EXCLUDED_SCRIPTS = new Set(['js/mobile-nav.js']);

const VENDOR = [
  { file: 'lenis.min.js', url: 'https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js' },
  { file: 'gsap.min.js', url: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js' },
  { file: 'ScrollTrigger.min.js', url: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js' },
];

// Referenced only by the stripped nav/footer (now the platform's DeHeader/DeFooter
// components) — must ship even though no fragment references them.
const ALWAYS_INCLUDE_ASSETS = ['dealer-edge-logo-horiz.svg'];

// style.css sections (by `/* ─── NAME ─── */` header) that make up the DE
// chrome stylesheet consumed by the platform's DeHeader/DeFooter on BOTH
// island and CMS pages. Section-based so line drift in style.css is harmless.
const CHROME_SECTIONS = [
  'VARIABLES',
  'NAVBAR',
  'PLATFORM DROPDOWN (desktop)',
  'BUTTONS',
  'FOOTER',
  'MOBILE NAV',
  'PLATFORM GROUP (mobile accordion)',
  'FOOTER RESPONSIVE',
];
const CHROME_ADDENDUM = `
/* ─── DE-CHROME ADDENDUM (export-platform.mjs) ─── */
/* the one chrome rule that lives in style.css's general RESPONSIVE section */
@media (max-width: 960px) { .nav-links { display: none; } }
/* CMS pages don't load the island reset — pin the chrome's own typography */
.navbar, .nav-mobile-panel, .footer { font-family: var(--font); }
`;

function extractChromeCss(styleCss) {
  const parts = styleCss.split(/(?=\/\* ─── [^─]+ ─── \*\/)/);
  const picked = [];
  for (const name of CHROME_SECTIONS) {
    const section = parts.find((p) => p.startsWith(`/* ─── ${name} ─── */`));
    if (!section) { warn.push(`de-chrome: style.css section not found: ${name}`); continue; }
    picked.push(section.trimEnd());
  }
  return picked.join('\n\n') + '\n' + CHROME_ADDENDUM;
}

const FRAGMENTS_DIR = path.join(TARGET, 'lib', 'de-site', 'fragments');
const PUBLIC_DIR = path.join(TARGET, 'public', 'de-site');

const warn = [];

function stripBlock(html, openRe, closeTag, label) {
  const open = html.match(openRe);
  if (!open) { warn.push(`${label}: open tag not found`); return html; }
  const start = open.index;
  const end = html.indexOf(closeTag, start);
  if (end === -1) { warn.push(`${label}: close tag not found`); return html; }
  return html.slice(0, start) + html.slice(end + closeTag.length);
}

function rewriteAssetPaths(s) {
  // src/href/srcset/poster attributes + inline style url() pointing at assets/
  return s
    .replace(/(src|href|poster)="assets\//g, '$1="/de-site/assets/')
    .replace(/srcset="([^"]*)"/g, (m, v) => `srcset="${v.replace(/(^|,\s*)assets\//g, '$1/de-site/assets/')}"`)
    .replace(/url\((['"]?)assets\//g, 'url($1/de-site/assets/');
}

function collectAssetRefs(s, refs) {
  for (const m of s.matchAll(/(?:src|href|poster)="assets\/([^"]+)"/g)) refs.add(m[1]);
  for (const m of s.matchAll(/url\((['"]?)(?:\.\.\/)?assets\/([^'")]+)\1\)/g)) refs.add(m[2]);
  for (const m of s.matchAll(/srcset="([^"]*)"/g)) {
    for (const part of m[1].split(',')) {
      const u = part.trim().split(/\s+/)[0];
      if (u.startsWith('assets/')) refs.add(u.slice('assets/'.length));
    }
  }
}

async function ensureVendor() {
  const vendorSrc = path.join(SITE_ROOT, 'vendor');
  await fs.mkdir(vendorSrc, { recursive: true });
  for (const v of VENDOR) {
    const dest = path.join(vendorSrc, v.file);
    try { await fs.access(dest); continue; } catch { /* download */ }
    process.stdout.write(`vendoring ${v.file} from ${v.url}\n`);
    const res = await fetch(v.url);
    if (!res.ok) throw new Error(`vendor download failed: ${v.url} -> ${res.status}`);
    await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
  }
  return vendorSrc;
}

async function main() {
  // target sanity: refuse to write into a non-platform-looking directory
  try { await fs.access(path.join(TARGET, 'package.json')); }
  catch { throw new Error(`target does not look like the platform repo: ${TARGET}`); }

  const vendorSrc = await ensureVendor();

  // fresh output dirs (fully owned by this script)
  await fs.rm(FRAGMENTS_DIR, { recursive: true, force: true });
  await fs.rm(PUBLIC_DIR, { recursive: true, force: true });
  await fs.mkdir(FRAGMENTS_DIR, { recursive: true });
  for (const d of ['css', 'js', 'assets', 'vendor']) await fs.mkdir(path.join(PUBLIC_DIR, d), { recursive: true });

  const assetRefs = new Set();
  const cssToCopy = new Set();
  const jsToCopy = new Set();

  for (const page of PAGES) {
    const html = await fs.readFile(path.join(SITE_ROOT, `${page}.html`), 'utf8');

    // ── meta from <head> + <body> ──
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ?? '';
    const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/)?.[1] ?? '';
    const og = {};
    for (const m of html.matchAll(/<meta\s+property="og:(\w+)"\s+content="([^"]*)"/g)) og[m[1]] = m[2];
    const bodyClass = html.match(/<body\s+class="([^"]*)"/)?.[1] ?? '';
    const css = [...html.matchAll(/<link\s+rel="stylesheet"\s+href="(css\/[^"?]+)(?:\?[^"]*)?"/g)].map((m) => m[1]);
    const fonts = [...html.matchAll(/<link[^>]+href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"[^>]*>/g)].map((m) => m[1]);
    const js = [...html.matchAll(/<script\s+src="(js\/[^"?]+)(?:\?[^"]*)?"><\/script>/g)]
      .map((m) => m[1])
      .filter((s) => !EXCLUDED_SCRIPTS.has(s));
    css.forEach((c) => cssToCopy.add(c));
    js.forEach((j) => jsToCopy.add(j));

    // ── fragment: body inner, minus nav/footer/scripts ──
    const bodyInner = html.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1];
    if (!bodyInner) throw new Error(`${page}: no <body> found`);
    let frag = bodyInner;
    frag = stripBlock(frag, /<nav\s+class="navbar"[^>]*>/, '</nav>', `${page}: navbar`);
    frag = stripBlock(frag, /<footer\s+class="footer"[^>]*>/, '</footer>', `${page}: footer`);
    frag = frag.replace(/\s*<script\s+src="[^"]*"><\/script>/g, '');
    if (/<script[\s>]/.test(frag)) warn.push(`${page}: inline <script> left in fragment — review`);
    collectAssetRefs(frag, assetRefs);
    frag = rewriteAssetPaths(frag).trim();

    await fs.writeFile(path.join(FRAGMENTS_DIR, `${page}.html`), frag + '\n');
    await fs.writeFile(
      path.join(FRAGMENTS_DIR, `${page}.meta.json`),
      JSON.stringify({
        page, title, description, og, bodyClass, fonts,
        css: css.map((c) => `/de-site/${c}`),
        js: [...VENDOR.map((v) => `/de-site/vendor/${v.file}`), ...js.map((j) => `/de-site/${j}`)],
      }, null, 2) + '\n'
    );
    process.stdout.write(`fragment: ${page} (${(frag.length / 1024).toFixed(1)} KB, ${js.length} scripts, ${css.length} css)\n`);
  }

  // ── css (scan for asset refs, rewrite nothing — ../assets resolves under /de-site/css/) ──
  let styleCssText = null;
  for (const c of cssToCopy) {
    const text = await fs.readFile(path.join(SITE_ROOT, c), 'utf8');
    if (c === 'css/style.css') styleCssText = text;
    collectAssetRefs(text, assetRefs);
    await fs.writeFile(path.join(PUBLIC_DIR, c.replace(/^css\//, 'css/')), text);
  }
  // ── de-chrome.css for the platform's DeHeader/DeFooter ──
  if (styleCssText) {
    const chrome = extractChromeCss(styleCssText);
    collectAssetRefs(chrome, assetRefs);
    await fs.writeFile(path.join(PUBLIC_DIR, 'css', 'de-chrome.css'), chrome);
    process.stdout.write(`de-chrome.css: ${(chrome.length / 1024).toFixed(1)} KB (${CHROME_SECTIONS.length} sections)\n`);
  } else {
    warn.push('de-chrome: css/style.css not among page stylesheets — chrome css not emitted');
  }
  ALWAYS_INCLUDE_ASSETS.forEach((a) => assetRefs.add(a));
  // ── js ──
  for (const j of jsToCopy) {
    await fs.copyFile(path.join(SITE_ROOT, j), path.join(PUBLIC_DIR, j));
  }
  // ── vendor ──
  for (const v of VENDOR) {
    await fs.copyFile(path.join(vendorSrc, v.file), path.join(PUBLIC_DIR, 'vendor', v.file));
  }
  // ── referenced assets only (the full assets/ dir is ~90 MB; frames/ is homepage-only) ──
  let copied = 0, missing = 0, bytes = 0;
  for (const rel of [...assetRefs].sort()) {
    const src = path.join(SITE_ROOT, 'assets', rel);
    const dest = path.join(PUBLIC_DIR, 'assets', rel);
    try {
      const st = await fs.stat(src);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(src, dest);
      copied += 1; bytes += st.size;
    } catch {
      missing += 1;
      warn.push(`asset referenced but not found: assets/${rel}`);
    }
  }

  process.stdout.write(`assets: ${copied} copied (${(bytes / 1048576).toFixed(1)} MB), ${missing} missing\n`);
  if (warn.length) {
    process.stdout.write(`\nWARNINGS (${warn.length}):\n` + warn.map((w) => `  - ${w}`).join('\n') + '\n');
  }
  process.stdout.write(`\nexported ${PAGES.length} pages -> ${TARGET}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
