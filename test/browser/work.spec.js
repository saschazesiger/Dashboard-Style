/**
 * Style work budgets (Chromium, CDP tracing): how many elements the engine
 * restyles while a page loads or an interaction runs, and how many times it
 * restyles the whole page. Counts, not times, so they hold on a busy machine
 * and in the shared run; perf.spec.js times what only a quiet machine can.
 *
 * Each budget comes from the performance audit of 3.0 (phones at 4x CPU):
 * - the Motion Lab set up its ~200 demos one after the other, each forcing a
 *   style flush of the whole page: about 1,000 recalcs and 450,000 element
 *   restyles, a 10s freeze on a phone. It now sets a demo up as its card
 *   comes near, in idle time, and cards far away skip rendering;
 * - a modal (a dialog, the modal drawer) makes the rest of the page inert,
 *   which restyles it once; nothing may restyle it a second time;
 * - changing a styleguide page restyles the new page about once.
 */
import { test, expect } from '@playwright/test';
import { ready, settle } from './helpers/motion.js';

test.skip(({ browserName }) => browserName !== 'chromium', 'CDP tracing is Chromium only');

/** Runs `action` under a trace and returns the style passes: element counts, and whether script forced them. */
async function styleWork(page, action) {
  const cdp = await page.context().newCDPSession(page);
  const events = [];
  cdp.on('Tracing.dataCollected', (event) => events.push(...event.value));
  await cdp.send('Tracing.start', { traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline'] }, transferMode: 'ReportEvents' });
  try {
    await action();
  } finally {
    await new Promise((resolve) => { cdp.once('Tracing.tracingComplete', resolve); cdp.send('Tracing.end'); });
    await cdp.detach();
  }
  return events.filter((event) => event.name === 'UpdateLayoutTree' && event.ph === 'X').map((event) => event.args?.elementCount ?? 0);
}

const elements = (page) => page.evaluate(() => document.getElementsByTagName('*').length);
const sum = (list) => list.reduce((total, count) => total + count, 0);

test('the Motion Lab restyles each element about once while it loads and sets up every demo', async ({ page }) => {
  test.setTimeout(180000);
  const passes = await styleWork(page, async () => {
    await page.goto('/styleguide/motion.html');
    await ready(page, { timeout: 60000 });
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-lab-complete'), null, { timeout: 120000 });
  });
  const total = await elements(page);
  test.info().annotations.push({ type: 'work', description: `${passes.length} style passes, ${sum(passes)} element restyles, ${total} elements` });
  expect(sum(passes), `element restyles while ${total} elements load`).toBeLessThan(total * 3);
});

test('changing a styleguide page restyles the new page about once', async ({ page }) => {
  await page.goto('/styleguide/index.html#/components/button');
  await ready(page);
  await settle(page, { timeout: 20000 });
  const passes = await styleWork(page, async () => {
    await page.evaluate(() => { location.hash = '#/components/dialog'; });
    await page.waitForFunction(() => document.documentElement.getAttribute('data-sg-route') === 'components/dialog');
    await settle(page, { timeout: 20000 });
  });
  const total = await elements(page);
  test.info().annotations.push({ type: 'work', description: `${passes.length} style passes, ${sum(passes)} element restyles, ${total} elements` });
  expect(sum(passes), `element restyles for a page of ${total} elements`).toBeLessThan(total * 3);
});

for (const [name, open] of [
  ['a dialog', async (page) => page.locator('#sg-stage button.ds-btn').first().click()],
  ['the modal drawer at 390px', async (page) => page.locator('.ds-topbar [aria-controls]').first().click()],
]) {
  test(`opening ${name} restyles the page behind it once`, async ({ page }) => {
    if (name.includes('drawer')) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(name.includes('drawer') ? '/styleguide/index.html#/components/button' : '/styleguide/index.html#/components/dialog');
    await ready(page);
    await settle(page, { timeout: 20000 });
    const total = await elements(page);
    const passes = await styleWork(page, async () => {
      await open(page);
      await settle(page, { timeout: 20000 });
    });
    const whole = passes.filter((count) => count > total * 0.5).length;
    test.info().annotations.push({ type: 'work', description: `${passes.length} style passes, ${whole} of the whole page, ${sum(passes)} element restyles, ${total} elements` });
    expect(whole, 'whole-page restyles').toBeLessThanOrEqual(1);
    // The engine counts pseudo-elements too: the one pass behind a modal reads about twice the element count.
    expect(sum(passes), 'element restyles').toBeLessThan(total * 3);
  });
}
