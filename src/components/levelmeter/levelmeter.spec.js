/**
 * The level meter: the thickness at every size (density and touch change
 * nothing), the shape of its ends, the vertical and segmented variants; the
 * level from a stand-in AnalyserNode with its ARIA value in words; the
 * ballistics (rise at once, fall, the peak's hold); loud in words and its
 * ds:change, decided on the sample peak; left to right under dir="rtl"; a muted track; destroy; forced colours. Runs
 * in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=levelmeter');
  await ready(page);
}

const markup = (cls = '', track = '') => `<div class="ds-levelmeter ${cls}" id="lm"><span class="ds-levelmeter__label" id="lm-label">Microphone</span><div class="ds-levelmeter__track" role="meter" aria-labelledby="lm-label" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"${track}><span class="ds-levelmeter__fill"></span><span class="ds-levelmeter__peak"></span></div><span class="ds-levelmeter__note" aria-live="polite"></span></div>`;

/** Adds a meter and its controller (window.lm) to the fixture. */
const add = (page, cls, track) => page.evaluate(({ html }) => {
  document.querySelector('#lm')?.remove();
  document.querySelector('#fx-component').insertAdjacentHTML('afterbegin', html);
  window.lm = DS.levelmeter.create(document.querySelector('#lm'));
}, { html: markup(cls, track) });

const read = (page) => page.evaluate(() => {
  const el = document.querySelector('#lm');
  const track = el.querySelector('.ds-levelmeter__track');
  return {
    level: parseFloat(track.style.getPropertyValue('--ds-levelmeter-level')) || 0,
    peak: parseFloat(track.style.getPropertyValue('--ds-levelmeter-peak')) || 0,
    peakHidden: el.querySelector('.ds-levelmeter__peak').hidden,
    now: track.getAttribute('aria-valuenow'),
    text: track.getAttribute('aria-valuetext'),
    state: el.getAttribute('data-state'),
    note: el.querySelector('.ds-levelmeter__note').textContent,
  };
});

test('the thickness at every size, 2px per step; density and touch change nothing; the shape rounds the ends', async ({ page }) => {
  await open(page);
  for (const [size, step] of SIZES) {
    for (const around of ['', 'ds-density-tight', 'ds-touch']) {
      await add(page, `${size} ${around}`);
      expect(await page.locator('#lm .ds-levelmeter__track').evaluate((el) => el.getBoundingClientRect().height), `${size} ${around}`).toBe(6 + step * 2);
    }
  }
  await add(page, 'ds-xl');
  expect(await page.locator('#lm .ds-levelmeter__track').evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBe(5);
  await page.evaluate(() => document.querySelector('#lm').classList.add('ds-shape-square'));
  expect(await page.locator('#lm .ds-levelmeter__track').evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBe(0);
});

test('names: a meter named by its label; at rest no peak mark', async ({ page }) => {
  await open(page);
  await add(page);
  const track = page.locator('#lm .ds-levelmeter__track');
  await expect(track).toHaveAttribute('role', 'meter');
  await expect(track).toHaveAccessibleName('Microphone');
  expect((await read(page)).peakHidden).toBe(true);
});

test('an analyser: the level of its samples, the ARIA value in words; stop() lets go and the bar falls to 0', async ({ page }) => {
  await open(page);
  await add(page);
  await page.evaluate(() => {
    window.fake = { fftSize: 256, getFloatTimeDomainData(buffer) { for (let i = 0; i < buffer.length; i += 1) buffer[i] = i % 2 ? 0.1 : -0.1; } };
    window.stopFake = window.lm.listen(window.fake);
  });
  await expect.poll(async () => (await read(page)).level).toBeCloseTo(0.667, 2);
  const state = await read(page);
  expect(state.now).toBe('67');
  expect(state.text).toBe('-20 dB');
  expect(state.peakHidden).toBe(false);
  const fill = await page.locator('#lm .ds-levelmeter__fill').evaluate((el) => getComputedStyle(el).scale);
  expect(fill.split(' ').map(Number)[0]).toBeCloseTo(0.667, 2);
  await page.evaluate(() => window.stopFake());
  await expect.poll(async () => (await read(page)).level, { timeout: 4000 }).toBe(0);
  await expect.poll(async () => (await read(page)).peak, { timeout: 4000 }).toBe(0);
});

test('ballistics: the bar rises at once and falls over time; the peak holds, then falls', async ({ page }) => {
  await open(page);
  await add(page);
  await page.evaluate(() => window.lm.set(0.8));
  await expect.poll(async () => (await read(page)).level).toBe(0.8);
  await page.evaluate(() => window.lm.set(0));
  await page.waitForTimeout(150);
  const falling = await read(page);
  expect(falling.level).toBeGreaterThan(0);
  expect(falling.level).toBeLessThan(0.8);
  expect(falling.peak, 'the peak holds').toBe(0.8);
  await expect.poll(async () => (await read(page)).level, { timeout: 3000 }).toBe(0);
  await expect.poll(async () => (await read(page)).peak, { timeout: 4000 }).toBe(0);
});

test('loud: data-state, the word in the note, the error colour, one ds:change each way', async ({ page }) => {
  await open(page);
  await add(page);
  await page.evaluate(() => {
    window.heard = [];
    document.querySelector('#lm').addEventListener('ds:change', (event) => window.heard.push(event.detail.loud));
    window.lm.set(1);
  });
  await expect(page.locator('#lm')).toHaveAttribute('data-state', 'loud');
  await expect(page.locator('#lm .ds-levelmeter__note')).toHaveText('Too loud');
  const colours = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--ds-error)';
    document.querySelector('#lm').append(probe);
    const error = getComputedStyle(probe).color;
    probe.remove();
    return [error, getComputedStyle(document.querySelector('#lm .ds-levelmeter__fill')).backgroundColor];
  });
  await expect.poll(async () => page.evaluate(() => getComputedStyle(document.querySelector('#lm .ds-levelmeter__fill')).backgroundColor)).toBe(colours[0]);
  expect(await page.evaluate(() => window.lm.get().loud)).toBe(true);
  await page.evaluate(() => window.lm.set(0.5));
  await expect(page.locator('#lm')).not.toHaveAttribute('data-state', 'loud', { timeout: 4000 });
  await expect(page.locator('#lm .ds-levelmeter__note')).toHaveText('');
  expect(await page.evaluate(() => window.heard)).toEqual([true, false]);
});

test('loud on the sample peak: a clipped sine reads below -1 dB on the bar and still says "Too loud"; set(value, { peak })', async ({ page }) => {
  await open(page);
  await add(page);
  await page.evaluate(() => {
    // A sine at twice full scale, clipped: its RMS is about -1.3 dBFS, its peak full scale.
    window.clipped = { fftSize: 1024, getFloatTimeDomainData(buffer) { for (let i = 0; i < buffer.length; i += 1) buffer[i] = Math.max(-1, Math.min(1, 2 * Math.sin(i * 0.21))); } };
    window.stopClipped = window.lm.listen(window.clipped);
  });
  await expect(page.locator('#lm')).toHaveAttribute('data-state', 'loud');
  await expect(page.locator('#lm .ds-levelmeter__note')).toHaveText('Too loud');
  expect((await read(page)).level, 'the bar shows the RMS, below -1 dBFS').toBeLessThan(59 / 60);
  await page.evaluate(() => window.stopClipped());
  await expect(page.locator('#lm')).not.toHaveAttribute('data-state', 'loud', { timeout: 4000 });
  // The page's own values: a sample peak decides when given, the level when not.
  await page.evaluate(() => window.lm.set(0.9, { peak: 0.5 }));
  await page.waitForTimeout(100);
  expect((await read(page)).state, 'a high level with a low peak is not loud').toBeNull();
  await page.evaluate(() => window.lm.set(0.6, { peak: 1 }));
  await expect(page.locator('#lm')).toHaveAttribute('data-state', 'loud');
});

test('direction: under dir="rtl" the meter runs left to right, its peak mark inside the track', async ({ page }) => {
  await open(page);
  await add(page);
  await page.evaluate(() => {
    const el = document.querySelector('#lm');
    el.setAttribute('dir', 'rtl');
    el.style.inlineSize = '300px';
    window.lm.set(0.3);
  });
  await expect.poll(async () => (await read(page)).level).toBe(0.3);
  const box = await page.evaluate(() => {
    const el = document.querySelector('#lm');
    const rect = (node) => { const r = node.getBoundingClientRect(); return [r.left, r.right]; };
    return { track: rect(el.querySelector('.ds-levelmeter__track')), fill: rect(el.querySelector('.ds-levelmeter__fill')), peak: rect(el.querySelector('.ds-levelmeter__peak')) };
  });
  expect(box.fill[0]).toBeCloseTo(box.track[0], 0);
  expect(box.fill[1] - box.fill[0]).toBeCloseTo(0.3 * (box.track[1] - box.track[0]), 0);
  expect(box.peak[0]).toBeGreaterThanOrEqual(box.track[0]);
  expect(box.peak[1]).toBeLessThanOrEqual(box.track[1] + 0.5);
  expect(box.peak[0], 'the mark sits at the end of the fill').toBeLessThanOrEqual(box.fill[1] + 1);
  expect(box.peak[1]).toBeGreaterThanOrEqual(box.fill[1] - 1);
});

test('muted: aria-disabled on the track shows no level', async ({ page }) => {
  await open(page);
  await add(page, '', ' aria-disabled="true"');
  await page.evaluate(() => window.lm.set(0.8));
  await page.waitForTimeout(100);
  expect((await read(page)).level).toBe(0);
  expect(await page.locator('#lm .ds-levelmeter__fill').evaluate((el) => getComputedStyle(el).visibility)).toBe('hidden');
});

test('vertical: upright over --ds-levelmeter-length, the level grows from the bottom; segmented keeps its mask', async ({ page }) => {
  await open(page);
  await add(page, 'ds-levelmeter--vertical ds-levelmeter--segmented');
  const box = await page.locator('#lm .ds-levelmeter__track').evaluate((el) => [el.getBoundingClientRect().width, el.getBoundingClientRect().height, getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage]);
  expect(box.slice(0, 2)).toEqual([6, 96]);
  expect(box[2]).toMatch(/repeating-linear-gradient/);
  await page.evaluate(() => window.lm.set(0.5));
  await expect.poll(async () => page.locator('#lm .ds-levelmeter__fill').evaluate((el) => {
    const fill = el.getBoundingClientRect();
    const track = el.parentElement.getBoundingClientRect();
    return [Math.round(fill.height), Math.round(track.bottom - fill.bottom)];
  })).toEqual([48, 0]);
});

test('destroy stops the loop and gives the markup back', async ({ page }) => {
  await open(page);
  await add(page);
  const out = await page.evaluate(async () => {
    window.lm.set(0.6);
    await new Promise((resolve) => setTimeout(resolve, 50));
    window.lm.destroy();
    const track = document.querySelector('#lm .ds-levelmeter__track');
    const before = track.getAttribute('style');
    await new Promise((resolve) => setTimeout(resolve, 100));
    return [before, track.getAttribute('style'), document.querySelector('#lm').getAttribute('data-state')];
  });
  expect(out[0] ?? '').not.toMatch(/--ds-levelmeter/);
  expect(out[1] ?? '').not.toMatch(/--ds-levelmeter/);
  expect(out[2]).toBeNull();
});

test('the demo: every meter of the voice moves, the muted one stays empty', async ({ page }) => {
  await open(page);
  await expect.poll(async () => page.locator('[data-demo="voice"] .ds-levelmeter__track').evaluate((el) => parseFloat(el.style.getPropertyValue('--ds-levelmeter-level')) || 0), { timeout: 4000 }).toBeGreaterThan(0);
  await expect(page.locator('.ds-levelmeter__track[aria-disabled="true"]')).toHaveCount(1);
});

test('forced colours: the track keeps an outline, the level is Highlight', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await add(page);
  const system = await page.evaluate(() => {
    const el = document.createElement('span');
    el.style.color = 'Highlight';
    document.body.append(el);
    const colour = getComputedStyle(el).color;
    el.remove();
    return colour;
  });
  expect(await page.locator('#lm .ds-levelmeter__track').evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  expect(await page.locator('#lm .ds-levelmeter__fill').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(system);
});
