/**
 * The spacing utilities on probes and on their demo: every .ds-gap-* step
 * sets the row and column gap to its --ds-space-<n> (on flex and grid),
 * every .ds-mt-* the top margin, .ds-mt-auto sends a block to the foot of
 * a column; they win over a component's own gap (the stack, the cluster)
 * and stay exact whatever the density; they follow the writing mode
 * (margin-block-start); forced colours draw nothing. Runs in the
 * `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=spacing');
  await ready(page);
}

const add = (page, html) => page.evaluate((markup) => {
  document.getElementById('probe')?.remove();
  const region = document.createElement('div');
  region.id = 'probe';
  region.insertAdjacentHTML('beforeend', markup);
  document.getElementById('fx-component').prepend(region);
}, html);

const STEPS = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 };

test('every gap step: row and column gap on the space scale, on flex and grid', async ({ page }) => {
  await open(page);
  const probes = Object.keys(STEPS).map((step) => `<div class="ds-gap-${step}" style="display: grid; grid-template-columns: 1fr 1fr" data-step="${step}"><span>A</span><span>B</span><span>C</span></div>`).join('');
  await add(page, probes);
  const gaps = await page.$$eval('#probe [data-step]', (items) => items.map((item) => {
    const [a, b, c] = item.children;
    return [item.dataset.step, Math.round(b.getBoundingClientRect().left - a.getBoundingClientRect().right), Math.round(c.getBoundingClientRect().top - a.getBoundingClientRect().bottom)];
  }));
  for (const [step, column, row] of gaps) {
    expect(column, `.ds-gap-${step} across`).toBe(STEPS[step]);
    expect(row, `.ds-gap-${step} down`).toBe(STEPS[step]);
  }
});

test('every top margin step, and .ds-mt-auto sends a block to the foot of a column', async ({ page }) => {
  await open(page);
  const probes = Object.keys(STEPS).map((step) => `<p class="ds-mt-${step}" data-step="${step}">Synced</p>`).join('');
  await add(page, `<div style="display: flow-root">${probes}</div>
    <div style="display: flex; flex-direction: column; block-size: 200px" id="column"><p style="margin: 0">Ticket 1042</p><div class="ds-mt-auto" id="foot" style="block-size: 20px">Open</div></div>`);
  const margins = await page.$$eval('#probe [data-step]', (items) => items.map((item) => [item.dataset.step, getComputedStyle(item).marginTop]));
  for (const [step, margin] of margins) expect(margin, `.ds-mt-${step}`).toBe(`${STEPS[step]}px`);
  const foot = await page.evaluate(() => Math.round(document.getElementById('column').getBoundingClientRect().bottom - document.getElementById('foot').getBoundingClientRect().bottom));
  expect(foot).toBe(0);
});

test('a gap class wins over a component\'s own gap and stays exact at every density', async ({ page }) => {
  await open(page);
  await add(page, ['', 'ds-density-compact', 'ds-density-tight'].map((density) => `<div class="${density}">
    <div class="ds-stack ds-gap-2" data-probe><span>A</span><span>B</span></div>
    <div class="ds-cluster ds-gap-6" data-probe><span>A</span><span>B</span></div>
    <div class="ds-grid ds-gap-0" data-probe><span>A</span><span>B</span></div></div>`).join(''));
  const gaps = await page.$$eval('#probe [data-probe]', (items) => items.map((item) => getComputedStyle(item).rowGap));
  expect(gaps).toEqual(['8px', '24px', '0px', '8px', '24px', '0px', '8px', '24px', '0px']);
});

test('the top margin follows the writing mode', async ({ page }) => {
  await open(page);
  await add(page, '<div style="writing-mode: vertical-rl"><p class="ds-mt-4" id="m">Text</p></div>');
  expect(await page.$eval('#m', (el) => [getComputedStyle(el).marginRight, getComputedStyle(el).marginTop])).toEqual(['16px', '0px']);
});

test('the demo: every gap step shows its distance; the card action sits at its foot; 360px without sideways scroll', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  const gaps = await page.$$eval('[data-demo="gap"]', (items) => items.map((item) => [item.dataset.step, getComputedStyle(item).columnGap]));
  expect(gaps.map(([step, gap]) => gap === `${STEPS[step]}px`).every(Boolean)).toBe(true);
  const foot = await page.evaluate(() => {
    const card = document.querySelector('[data-demo="auto-card"]');
    const action = document.querySelector('[data-demo="mt-auto"]');
    return Math.round(card.getBoundingClientRect().bottom - parseFloat(getComputedStyle(card).paddingBottom) - parseFloat(getComputedStyle(card).borderBottomWidth) - action.getBoundingClientRect().bottom);
  });
  expect(foot).toBe(0);
  // The letters are decoration: the readout is the class name beside them.
  await expect(page.locator('[data-demo="gap"] .ds-kbd').first()).toHaveAttribute('aria-hidden', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('forced colours: the classes draw nothing', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const drawn = await page.$$eval('[class*="ds-gap-"], [class*="ds-mt-"]', (items) => items.filter((item) => !item.classList.contains('ds-card') && !item.classList.contains('ds-btn') && (getComputedStyle(item).borderTopStyle !== 'none' || getComputedStyle(item).outlineStyle !== 'none')).length);
  expect(drawn).toBe(0);
});
