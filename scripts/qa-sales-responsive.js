const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const sales = fs.readFileSync(path.join(root, 'sales.html'), 'utf8');
const salesCss = fs.readFileSync(path.join(root, 'css/sales.css'), 'utf8');
const styleCss = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const salesJs = fs.readFileSync(path.join(root, 'js/sales.js'), 'utf8');
const css = salesCss + styleCss;

const checks = [
  ['sales-page body class', sales.includes('class="sales-page"')],
  ['mobile nav toggle', sales.includes('id="nav-toggle"')],
  ['demo modal', sales.includes('id="modal-backdrop"')],
  ['boat section', sales.includes('id="boat-section"')],
  ['video section', sales.includes('id="video-section"')],
  ['bp tokens', css.includes('--bp-tablet')],
  ['boat responsive', css.includes('.boat-sticky') && css.includes('@media (max-width: 960px)')],
  ['footer responsive', css.includes('.footer-inner') && css.includes('grid-template-columns: 1fr')],
  ['fine pointer cursor', css.includes('@media (hover: hover) and (pointer: fine)')],
  ['safe area padding', css.includes('safe-area-inset-top')],
  ['overflow clip', css.includes('.sales-page') && css.includes('overflow-x: clip')],
  ['mobile act pin height', salesCss.includes('.s-act') && salesCss.includes('height: 300vh')],
  ['mobile act team height', salesCss.includes('.s-act--team') && salesCss.includes('height: 450vh')],
  ['mobile act sticky inner', salesCss.includes('position: sticky') && salesCss.includes('grid-template-rows: auto max-content minmax(0, 1fr)')],
  ['mobile hero compressed', salesCss.includes('.s-hero.s-stats-section { height: 450vh; }')],
  ['mobile watermark hidden', salesCss.includes('.s-act-watermark') && salesCss.includes('display: none')],
  ['unified act scrolltrigger', !salesJs.includes('beatObs.push') && salesJs.includes('cleanup.scrollTrigger = ScrollTrigger.create')],
  ['mobile boat height', styleCss.includes('.boat-section') && styleCss.includes('height: 200vh')],
  ['nav z-index', styleCss.includes('z-index: 1000') && styleCss.includes('z-index: 1001')],
  ['cohort grid full width', salesCss.includes('width: 100%') && salesCss.includes('aspect-ratio: 1') && !salesCss.includes('min(58vw, 200px)')],
  ['cohort card grid layout', salesCss.includes('display: contents') && salesCss.includes('cohort-caption cohort-caption')],
  ['baseline dot no min-size', !salesCss.includes('.s-cohort-dot.is-baseline {\n    position: relative;\n    min-width: 44px') && !salesCss.match(/\.is-baseline[^}]*min-width:\s*44px/s)],
  ['beat6 scene-next in flow', salesCss.includes('[data-active-beat="6"] .s-cohort-card .s-scene-next') && salesCss.includes('position: relative')],
  ['mobile act padding reduced', salesCss.includes('padding: calc(var(--nav-height) + 10px) 16px 12px') && salesCss.includes('padding: calc(var(--nav-height) + 24px) 12px 12px')],
  ['mobile popup anchor js', salesJs.includes("matchMedia('(max-width: 640px)').matches") && salesJs.includes("popupEl.style.left = '50%'")],
  ['hero sticky not broken by section overflow', salesCss.includes('.s-hero.s-stats-section') && salesCss.includes('overflow: visible') && salesCss.includes('.s-stats-bg')],
  ['mobile try stage width constrained', salesCss.includes('.s-try-stage') && salesCss.includes('min-width: 0') && salesCss.includes('.s-try-input-row input')],
  ['mobile act visual fit scaling', salesCss.includes('--s-beat-fit-scale') && salesJs.includes('fitActiveBeatToStage') && salesJs.includes('bottomBuffer')],
];

let failed = 0;
checks.forEach(([name, ok]) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`);
  if (!ok) failed += 1;
});

process.exit(failed ? 1 : 0);
