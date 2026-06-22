#!/usr/bin/env node
/* Live smoke test for the platform-hosted DealerEdge marketing island. */
const { chromium, request } = require('playwright');

const args = process.argv.slice(2);
function argValue(name, fallback) {
  const prefix = `--${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const idx = args.indexOf(`--${name}`);
  if (idx >= 0 && args[idx + 1]) return args[idx + 1];
  return fallback;
}

const base = (argValue('base', process.env.BASE_URL || 'https://dealeredge.dealeredge.ai')).replace(/\/+$/, '');
const routes = (argValue('routes', process.env.ROUTES || '/,/sales,/marketing,/inventory,/analytics,/features,/roi'))
  .split(',')
  .map((route) => route.trim())
  .filter(Boolean);

const assetChecks = [
  ['/de-site/css/de-chrome.css', /^text\/css\b/],
  ['/de-site/js/de-core.min.js', /^(application|text)\/javascript\b/],
  ['/de-site/js/inventory-late.min.js', /^(application|text)\/javascript\b/],
  ['/de-site/css/inventory-late.min.css', /^text\/css\b/],
  ['/de-site/partials/inventory-late-content.html', /^text\/html\b/],
];

function isIgnorableConsoleError(text) {
  return text.includes('Minified React error #418') || text.includes('Failed to load resource');
}

function isIgnorableFailedRequest(url) {
  return url.includes('_rsc=') || url.endsWith('.mp4');
}

async function checkAssets(requestContext) {
  const results = [];
  for (const [path, typeRe] of assetChecks) {
    const url = `${base}${path}`;
    const response = await requestContext.head(url, { timeout: 30000 });
    const type = response.headers()['content-type'] || '';
    const ok = response.ok() && typeRe.test(type);
    results.push({ path, status: response.status(), type, ok });
  }
  return results;
}

async function checkRoute(browser, route) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  const failed = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !isIgnorableConsoleError(msg.text())) errors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    if (!isIgnorableConsoleError(err.message)) errors.push(err.message);
  });
  page.on('requestfailed', (req) => {
    if (!isIgnorableFailedRequest(req.url())) failed.push(req.url());
  });

  const response = await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(900);
  const title = await page.title();
  const h1 = await page.locator('h1').first().textContent().catch(() => '');

  let inventory = null;
  if (route === '/inventory') {
    await page.mouse.wheel(0, 600);
    const samples = [];
    for (const ms of [0, 50, 150, 300, 600, 1000, 1600]) {
      if (ms) await page.waitForTimeout(ms - (samples.at(-1)?.ms || 0));
      samples.push({
        ms,
        y: await page.evaluate(() => window.scrollY),
        loaded: await page.evaluate(() => document.querySelector('[data-inventory-late-root]')?.dataset.loaded || null),
      });
    }
    const drops = samples.some((sample, i) => i && sample.y + 2 < samples[i - 1].y);

    for (let i = 0; i < 6; i += 1) {
      await page.mouse.wheel(0, 700);
      await page.waitForTimeout(350);
    }
    await page.waitForTimeout(2200);

    const state = await page.evaluate(() => ({
      lateLoaded: document.querySelector('[data-inventory-late-root]')?.dataset.loaded || null,
      actCount: document.querySelectorAll('[data-act]').length,
      activeBeats: [...document.querySelectorAll('.de-beat.is-active')].map((beat) => ({
        anim: beat.dataset.anim,
        inCount: beat.querySelectorAll('.is-in').length,
        playing: beat.classList.contains('is-playing'),
      })),
    }));
    inventory = { samples, drops, ...state };
  }

  await page.close();
  return {
    route,
    status: response?.status() || 0,
    title,
    h1: (h1 || '').trim().slice(0, 90),
    errors,
    failed,
    inventory,
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const requestContext = await request.newContext();
  const assetResults = await checkAssets(requestContext);
  const routeResults = [];
  for (const route of routes) routeResults.push(await checkRoute(browser, route));
  await requestContext.dispose();
  await browser.close();

  const failures = [];
  for (const asset of assetResults) {
    if (!asset.ok) failures.push(`asset ${asset.path} returned ${asset.status} ${asset.type}`);
  }
  for (const route of routeResults) {
    if (route.status !== 200) failures.push(`${route.route} returned ${route.status}`);
    if (route.errors.length) failures.push(`${route.route} console/page errors: ${route.errors.join(' | ')}`);
    if (route.failed.length) failures.push(`${route.route} failed requests: ${route.failed.join(' | ')}`);
  }
  const inventory = routeResults.find((route) => route.route === '/inventory')?.inventory;
  if (inventory) {
    if (inventory.drops) failures.push('/inventory first scroll dropped backward');
    if (!inventory.actCount) failures.push('/inventory did not render late acts');
    if (inventory.lateLoaded !== 'true' && !inventory.actCount) failures.push('/inventory late content did not load');
    if (!inventory.activeBeats.some((beat) => beat.inCount > 0)) failures.push('/inventory no active animated beat reached .is-in state');
  }

  console.log(JSON.stringify({ base, assets: assetResults, routes: routeResults, failures }, null, 2));
  if (failures.length) process.exit(1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
