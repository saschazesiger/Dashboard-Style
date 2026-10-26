/**
 * Paint cost of the Expressive loaders (D10; risk "main-thread paint" of
 * plans/motion-2.md) on fixtures/perf.html: a table of 50 rows with a wavy
 * progress bar each, four shape loaders and a skeleton surface, looping at
 * once. Chromium at 4x CPU throttling (CDP Emulation.setCPUThrottlingRate):
 * after a 1s warm-up the rAF intervals of 3s are recorded and their p95
 * goes into the test's annotations (and test/browser/README.md).
 *
 * The budget is 33ms: two frames at 60Hz. rAF times come in whole frames
 * (16.7ms steps, a few tenths of jitter), so two frames read 33.2-33.5ms;
 * the check allows two frames plus 1ms of that jitter (34.3ms), nothing
 * between two and three frames. It is never raised. The whole fixture is over it: the skeleton wave
 * (background-attachment: fixed) is painted on the main thread and stalls
 * a frame for three about every half second, so docs/components.md limits
 * it ("Paint cost": a skeleton waits alone, no other loops beside it). The
 * test asserts the budget on what those limits allow, the table and the
 * loaders, and records the whole fixture and the skeleton alone.
 *
 * It runs in the `perf` project, and measures only when that project runs
 * alone (npm run test:browser -- --project=perf; CI gives it a job of its
 * own): other workers on the same CPU would make any frame time noise.
 *
 * The same holds for the cost of a style recalc: review.spec.js ("style
 * scope") counts the elements a text change inside a card restyles, in the
 * shared run; the test below times those changes, alone, also while the
 * styleguide's save bar shows (its view and content rules apply then).
 */
import { test, expect } from '@playwright/test';
import { ready, settle } from './helpers/motion.js';

/** One frame at 60Hz; the budget is two of them (33ms), plus the jitter of a rAF time. */
const FRAME = 1000 / 60;
const BUDGET = 2;
const JITTER = 1;

/** Opens the fixture with `parts`, throttles the CPU 4x and returns the p95, median and count of 3s of rAF intervals. */
async function measure(page, parts) {
  await page.goto(`/test/browser/fixtures/perf.html${parts ? `?parts=${parts}` : ''}`);
  await ready(page);
  await page.mouse.move(1, 1);
  const loops = await page.evaluate(() => document.getAnimations().filter((animation) => animation.effect.getComputedTiming().iterations === Infinity).length);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  try {
    const intervals = await page.evaluate(() => new Promise((resolve) => {
      const out = [];
      let start = 0;
      let last = 0;
      const frame = (time) => {
        if (!start) start = time;
        if (time - start >= 1000 && last) out.push(time - last);
        last = time;
        if (time - start < 4000) requestAnimationFrame(frame);
        else resolve(out);
      };
      requestAnimationFrame(frame);
    }));
    const sorted = [...intervals].sort((a, b) => a - b);
    return {
      loops,
      frames: intervals.length,
      p95: sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)],
      median: sorted[Math.floor(sorted.length / 2)],
      long: intervals.filter((interval) => Math.round(interval / FRAME) > BUDGET).length,
    };
  } finally {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await cdp.detach();
  }
}

const describe = (name, result) => `${name}: p95 ${result.p95.toFixed(1)}ms, median ${result.median.toFixed(1)}ms, ${result.frames} frames in 3s, ${result.long} of three or more frames, ${result.loops} loops`;

test('50 rows of wavy progress and four shape loaders keep the p95 frame at 4x CPU throttling within 33ms; the skeleton is recorded', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'CPU throttling is a CDP command: Chromium only');
  test.skip(!process.env.DS_PERF_ALONE, 'frame times need the CPU alone: run npm run test:browser -- --project=perf');
  test.setTimeout(60000);
  const limited = await measure(page, 'loaders,table');
  const whole = await measure(page, '');
  const skeleton = await measure(page, 'skeleton');
  testInfo.annotations.push(
    { type: 'perf', description: describe('table and loaders (asserted)', limited) },
    { type: 'perf', description: describe('whole fixture (recorded)', whole) },
    { type: 'perf', description: describe('skeleton alone (recorded)', skeleton) },
  );
  expect(limited.loops, 'every wave and loader loops').toBeGreaterThanOrEqual(54);
  expect(limited.frames, 'frames were recorded').toBeGreaterThan(20);
  // Two frames read 33.2-33.5ms; three are 50ms. Nothing between passes.
  expect(limited.p95, `p95 rAF interval ${limited.p95.toFixed(1)}ms (budget ${BUDGET} frames, 33ms, plus ${JITTER}ms of jitter)`).toBeLessThanOrEqual(BUDGET * FRAME + JITTER);
});

/**
 * The ceiling of a style recalc after one text change, in ms, for the
 * lower quartile of 21 changes. In the Playwright container a change costs
 * 3-4.5ms on either page with the CPU alone (the :has() rules of ds.css are
 * most of it; without any it is 0.4ms); the facts rule of list.css with a
 * per-fact subject (`.ds-card:has(.ds-tiles) > .ds-facts >
 * div:nth-child(2)`) took it to 8-12ms. Shared with other workers the same
 * change read 8-27ms, which is why this is timed here and only here. Even
 * alone a stray process only adds time, so the lower quartile, not the
 * median, is what is asserted.
 */
const STYLE_CEILING = 7.5;

/** Where each page gets its text change: an element inside a card (the targets of review.spec.js, "style scope"). */
const STYLE_TARGETS = {
  '/styleguide/index.html': '.ds-card p',
  '/styleguide/motion.html': '[data-lab-demo="progress"] .ds-progress__label',
  '/styleguide/index.html?savebar': '.ds-card p',
};

/** What a page shows before its text changes: the styleguide's save bar (sticky, and the view and content rules of data-ds-savebar). */
const STYLE_SETUP = {
  '/styleguide/index.html?savebar': async (page) => {
    await page.fill('#sg-sb-name', 'LAPTOP-0043');
    await expect(page.locator('#main')).toHaveAttribute('data-ds-savebar', '');
  },
};

for (const [path, selector] of Object.entries(STYLE_TARGETS)) {
  test(`${path}: the style recalc of a text change inside a card stays under ${STYLE_CEILING}ms (lower quartile of 21)`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'RecalcStyleDuration is a CDP metric: Chromium only');
    test.skip(!process.env.DS_PERF_ALONE, 'recalc times need the CPU alone: run npm run test:browser -- --project=perf');
    await page.goto(path);
    await ready(page);
    await page.mouse.move(1, 1);
    if (STYLE_SETUP[path]) await STYLE_SETUP[path](page);
    await settle(page, { timeout: 20000 });
    // Every loop paused: the metrics then hold the recalc of the change alone.
    await page.evaluate(() => {
      for (const animation of document.getAnimations()) animation.pause();
    });
    const change = (n) => page.evaluate(([target, text]) => {
      const element = document.querySelector(target);
      element.textContent = text;
      void getComputedStyle(element).color;
    }, [selector, `${n}%`]);
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');
    const recalc = async () => (await client.send('Performance.getMetrics')).metrics.find((metric) => metric.name === 'RecalcStyleDuration').value;
    const costs = [];
    for (let n = 0; n < 21; n += 1) {
      const before = await recalc();
      await change(n);
      costs.push((await recalc() - before) * 1000);
    }
    await client.detach();
    costs.sort((a, b) => a - b);
    const [quartile, median] = [costs[5], costs[10]];
    test.info().annotations.push({ type: 'style recalc', description: `${path}: lower quartile ${quartile.toFixed(2)}ms, median ${median.toFixed(2)}ms of ${costs.length} changes` });
    expect(quartile, `lower quartile of the style recalc of a text change in ${selector} (median ${median.toFixed(2)}ms)`).toBeLessThan(STYLE_CEILING);
  });
}
