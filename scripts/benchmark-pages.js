const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 4173);
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}/`;
const RUNS = Number(process.env.RUNS || 3);
const WAIT_AFTER_LOAD_MS = Number(process.env.WAIT_AFTER_LOAD_MS || 800);
const VIEWPORTS = {
  desktop: { width: 1365, height: 900, isMobile: false },
  mobile: { width: 390, height: 844, isMobile: true },
};
const VIEWPORT_FILTER = process.env.VIEWPORT || 'all';
const PAGES = [
  'index.html',
  'sales.html',
  'marketing.html',
  'inventory.html',
  'analytics.html',
  'features.html',
  'pricing.html',
  'case-studies.html',
  'case-study.html',
  'roi.html',
];

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? null;
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value) : null;
}

function activeViewports() {
  if (VIEWPORT_FILTER === 'all') return Object.entries(VIEWPORTS);
  const viewport = VIEWPORTS[VIEWPORT_FILTER];
  if (!viewport) {
    throw new Error(`Unknown VIEWPORT "${VIEWPORT_FILTER}". Use one of: all, ${Object.keys(VIEWPORTS).join(', ')}`);
  }
  return [[VIEWPORT_FILTER, viewport]];
}

function pageUrl(pageName, runIndex, viewportName) {
  const pathPart = pageName === 'index.html' ? '' : pageName;
  return `${BASE_URL}${pathPart}?bench=${Date.now()}-${viewportName}-${runIndex}`;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function startServerIfNeeded() {
  if (process.env.BASE_URL) return null;
  return spawn(
    'python',
    ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
    { cwd: ROOT, stdio: 'ignore', windowsHide: true }
  );
}

async function waitForServer() {
  for (let i = 0; i < 50; i += 1) {
    try {
      const res = await fetch(BASE_URL);
      if (res.ok) return;
    } catch (_) {
      // keep trying
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Server did not respond at ${BASE_URL}`);
}

async function measurePage(browser, pageName, runIndex, viewportName, viewport, artifactDir) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.isMobile,
    hasTouch: viewport.isMobile,
    deviceScaleFactor: viewport.isMobile ? 2 : 1,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const requests = [];
  const failedRequests = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  page.on('requestfailed', (request) => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure()?.errorText || 'request failed',
    });
  });

  await page.addInitScript(() => {
    window.__benchVitals = { lcp: 0, cls: 0 };
    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) window.__benchVitals.lcp = lastEntry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) window.__benchVitals.cls += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (_) {
      // Older browser engines may not expose every Web Vital entry type.
    }
  });

  await page.goto(pageUrl(pageName, runIndex, viewportName), { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(WAIT_AFTER_LOAD_MS);

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paints = Object.fromEntries(performance.getEntriesByType('paint').map((paint) => [paint.name, paint.startTime]));
    const resources = performance.getEntriesByType('resource');
    return {
      ttfb: nav.responseStart,
      domContentLoaded: nav.domContentLoadedEventEnd,
      load: nav.loadEventEnd,
      fcp: paints['first-contentful-paint'] || null,
      lcp: window.__benchVitals?.lcp || null,
      cls: window.__benchVitals?.cls || 0,
      transferBytes: (nav.transferSize || 0) + resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0),
      decodedBytes: (nav.decodedBodySize || 0) + resources.reduce((sum, resource) => sum + (resource.decodedBodySize || 0), 0),
      resourceCount: resources.length + 1,
    };
  });

  if (runIndex === 0) {
    await page.screenshot({
      path: path.join(artifactDir, `${viewportName}-${pageName.replace('.html', '')}.png`),
      fullPage: false,
    });
  }

  await context.close();

  return {
    ...metrics,
    requestCount: requests.length,
    failedRequests,
    consoleErrors,
    pageErrors,
  };
}

function summarize(pageName, viewportName, viewport, samples) {
  const errors = samples.flatMap((sample) => [
    ...sample.consoleErrors.map((message) => ({ type: 'console', message })),
    ...sample.pageErrors.map((message) => ({ type: 'page', message })),
  ]);
  const failedRequests = samples.flatMap((sample) => sample.failedRequests);
  return {
    page: pageName,
    viewport: viewportName,
    viewport_size: `${viewport.width}x${viewport.height}`,
    runs: samples.length,
    fcp_ms: round(median(samples.map((sample) => sample.fcp))),
    lcp_ms: round(median(samples.map((sample) => sample.lcp))),
    cls: Math.round((median(samples.map((sample) => sample.cls)) || 0) * 1000) / 1000,
    load_ms: round(median(samples.map((sample) => sample.load))),
    dcl_ms: round(median(samples.map((sample) => sample.domContentLoaded))),
    ttfb_ms: round(median(samples.map((sample) => sample.ttfb))),
    transfer_kb: round(median(samples.map((sample) => sample.transferBytes)) / 1024),
    decoded_kb: round(median(samples.map((sample) => sample.decodedBytes)) / 1024),
    requests: round(median(samples.map((sample) => sample.requestCount))),
    failed_requests: failedRequests,
    errors,
  };
}

function renderMarkdown(rows, artifactDir) {
  const lines = [
    '# DealerEdge Page Benchmark',
    '',
    `- Date: ${new Date().toISOString()}`,
    `- Base URL: ${BASE_URL}`,
    `- Runs per page: ${RUNS}`,
    `- Viewports: ${activeViewports().map(([name, viewport]) => `${name} ${viewport.width}x${viewport.height}`).join(', ')}`,
    `- Wait after load: ${WAIT_AFTER_LOAD_MS}ms`,
  ];

  const grouped = rows.reduce((acc, row) => {
    if (!acc.has(row.viewport)) acc.set(row.viewport, []);
    acc.get(row.viewport).push(row);
    return acc;
  }, new Map());

  grouped.forEach((viewportRows, viewportName) => {
    lines.push(
      '',
      `## ${viewportName}`,
      '',
      '| Page | FCP | LCP | CLS | Load | Transfer | Requests | Errors |',
      '|---|---:|---:|---:|---:|---:|---:|---:|',
    );
    viewportRows.forEach((row) => {
      lines.push(`| ${row.page} | ${row.fcp_ms} ms | ${row.lcp_ms} ms | ${row.cls} | ${row.load_ms} ms | ${row.transfer_kb} KB | ${row.requests} | ${row.errors.length + row.failed_requests.length} |`);
    });
  });

  const problemRows = rows.filter((row) => row.errors.length || row.failed_requests.length);
  if (problemRows.length) {
    lines.push('', '## Errors');
    problemRows.forEach((row) => {
      lines.push('', `### ${row.page}`);
      row.errors.forEach((error) => lines.push(`- ${error.type}: ${error.message}`));
      row.failed_requests.forEach((request) => lines.push(`- request: ${request.url} (${request.failure})`));
    });
  }

  fs.writeFileSync(path.join(artifactDir, 'summary.md'), `${lines.join('\n')}\n`);
}

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const artifactDir = path.join(ROOT, 'perf-reports', timestamp);
  ensureDir(artifactDir);

  const server = startServerIfNeeded();
  try {
    await waitForServer();
    const browser = await chromium.launch();
    const rows = [];
    const raw = {};

    for (const [viewportName, viewport] of activeViewports()) {
      raw[viewportName] = {};
      for (const pageName of PAGES) {
        const samples = [];
        for (let runIndex = 0; runIndex < RUNS; runIndex += 1) {
          samples.push(await measurePage(browser, pageName, runIndex, viewportName, viewport, artifactDir));
        }
        raw[viewportName][pageName] = samples;
        const row = summarize(pageName, viewportName, viewport, samples);
        rows.push(row);
        console.log(JSON.stringify(row));
      }
    }

    await browser.close();
    fs.writeFileSync(path.join(artifactDir, 'raw.json'), JSON.stringify(raw, null, 2));
    fs.writeFileSync(path.join(artifactDir, 'summary.json'), JSON.stringify(rows, null, 2));
    renderMarkdown(rows, artifactDir);
    console.log(`\nReport written to ${artifactDir}`);
  } finally {
    if (server && !server.killed) server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
