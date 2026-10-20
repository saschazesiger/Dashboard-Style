/**
 * DS.motion.countUp() in real engines (D7): a key figure counts frame by
 * frame without turning back, a new target continues from the figure on
 * screen, and a figure lands together with its progress bar (both on
 * --ds-ease-value over --ds-dur-glide).
 */
import { test, expect } from './base-test.js';
import { ready, settle, expectMonotonic } from './helpers/motion.js';

/** Loads the data fixture (optionally slowed down) at rest. */
async function open(page, { speed } = {}) {
  await page.goto(`/test/browser/fixtures/data.html${speed ? `?speed=${speed}` : ''}`);
  await ready(page);
  await settle(page);
}

test('a rising count never turns back and lands on its value', async ({ page }) => {
  await open(page);
  const result = await page.locator('#figure').evaluate(async (el) => {
    const values = [];
    let counting = true;
    const frame = () => {
      values.push(Number(el.textContent));
      if (counting) requestAnimationFrame(frame);
    };
    const handle = DS.motion.countUp(el, 1284);
    requestAnimationFrame(frame);
    await handle.finished;
    counting = false;
    return { values, last: el.textContent, busy: el.getAttribute('aria-busy') };
  });
  expect(result.values.length).toBeGreaterThan(10);
  expectMonotonic(result.values, { direction: 'up' });
  expect(result.last).toBe('1284');
  expect(result.busy).toBeNull();
});

test('a new target mid-count continues from the figure on screen', async ({ page }) => {
  await open(page);
  const result = await page.locator('#figure').evaluate(async (el) => {
    DS.motion.countUp(el, 1000);
    await new Promise((resolve) => setTimeout(resolve, 200));
    const shown = Number(el.textContent);
    const handle = DS.motion.countUp(el, 200);
    const atOnce = Number(el.textContent);
    const values = [atOnce];
    let counting = true;
    const frame = () => {
      values.push(Number(el.textContent));
      if (counting) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    await handle.finished;
    counting = false;
    values.push(Number(el.textContent));
    return { shown, atOnce, values, busy: el.getAttribute('aria-busy') };
  });
  expect(result.shown).toBeGreaterThan(200);
  expect(result.shown).toBeLessThan(1000);
  expect(result.atOnce).toBe(result.shown);
  expectMonotonic(result.values, { direction: 'down' });
  expect(result.values.at(-1)).toBe(200);
  expect(result.busy).toBeNull();
});

test('a figure and its bar set in the same frame land together', async ({ page }) => {
  // Ten times slower, so one frame is a small share of the glide.
  await open(page, { speed: 0.1 });
  const result = await page.evaluate(async () => {
    const figure = document.getElementById('figure');
    const progress = document.getElementById('progress');
    const bar = document.getElementById('bar');
    // The page's update: one task sets both.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    progress.style.setProperty('--ds-progress', '1');
    const handle = DS.motion.countUp(figure, 1, { format: String });
    const transition = bar.getAnimations().find((animation) => animation.transitionProperty === 'transform');
    // Sampled after the count's own frame callback, so each sample sees the frame's figure.
    const samples = [];
    let running = true;
    const tick = () => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(bar).transform);
      samples.push({ figure: parseFloat(figure.textContent), bar: matrix.a });
      if (running) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    await Promise.all([handle.finished, transition.finished]);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    running = false;
    return {
      samples,
      // Landed: within 0.01 % of the target (a computed matrix rounds to six digits).
      landed: { figure: samples.findIndex((entry) => entry.figure >= 0.9999), bar: samples.findIndex((entry) => entry.bar >= 0.9999) },
      duration: DS.motion.motionDuration(figure, '--ds-dur-glide'),
    };
  });
  expect(result.duration).toBe(6000);
  // The frame in which each first shows its target.
  expect(result.landed.figure).toBeGreaterThan(100);
  expect(result.landed.bar).toBeGreaterThan(100);
  expect(Math.abs(result.landed.figure - result.landed.bar), JSON.stringify(result.landed)).toBeLessThanOrEqual(1);
  const middle = result.samples.filter((entry) => entry.figure > 0.05 && entry.figure < 0.95);
  expect(middle.length).toBeGreaterThan(50);
  for (const entry of middle) expect(Math.abs(entry.figure - entry.bar), JSON.stringify(entry)).toBeLessThanOrEqual(0.02);
});
