/**
 * The wheel (plans/wheel-and-shimmer.md) on its demo page: the first line
 * shows at once; one strip (both lines start together on the same curve and
 * duration, one line apart, each fade on its glide); the hold (a change
 * 200ms after a roll waits the hold minus 200ms); a run of changes in one
 * task leaves one leaving line; a line replaced while it waited takes no
 * second hold; an interrupted entrance glides out from where it is; the
 * leaving line is aria-hidden and inert; the morph hooks (a new key rolls,
 * the same key is patched in place); the attribute path and the
 * controller's event; the ellipsis; nothing of its own in forced colours.
 * Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const URL = '/test/browser/fixtures/component.html?c=wheel';

async function open(page) {
  await page.goto(URL);
  await ready(page);
}

/** A fresh slot in the fixture, with a controller on window.wheel. */
async function slot(page, text = 'Thinking') {
  await page.evaluate((first) => {
    const host = document.createElement('p');
    host.id = 'probe';
    host.innerHTML = '<span class="ds-wheel" id="slot"></span>';
    document.querySelector('#fx-component').append(host);
    window.wheel = DS.wheel.create(document.querySelector('#slot'), { text: first });
  }, text);
}

/** The timing of every running animation of every line of the slot. */
const timings = (page) => page.$$eval('#slot > *', (lines) => lines.map((line) => ({
  text: line.textContent,
  hidden: line.getAttribute('aria-hidden'),
  inert: line.inert,
  animations: line.getAnimations().map((animation) => {
    const timing = animation.effect.getTiming();
    const frames = animation.effect.getKeyframes();
    return { duration: Math.round(Number(timing.duration)), delay: Math.round(Number(timing.delay)), easing: timing.easing, fill: timing.fill, from: frames[0], to: frames.at(-1) };
  }),
})));

test('the first line shows at once, with nothing to roll', async ({ page }) => {
  await open(page);
  await slot(page);
  const lines = await timings(page);
  expect(lines).toHaveLength(1);
  expect(lines[0].text).toBe('Thinking');
  expect(lines[0].animations).toEqual([]);
  await expect(page.locator('#slot > .ds-wheel__line')).toHaveAttribute('data-ds-keep', '');
});

test('one strip: both lines start together on --ds-dur-slow and --ds-ease-in-out, one line apart, each fade on its glide', async ({ page }) => {
  await open(page);
  await slot(page);
  // Past the first line's hold.
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.wheel.set('Running npm test'));
  const [old, next] = await timings(page);
  expect(old.text).toBe('Thinking');
  expect(next.text).toBe('Running npm test');
  for (const line of [old, next]) {
    expect(line.animations).toHaveLength(2);
    for (const animation of line.animations) {
      expect(animation.duration).toBe(350);
      expect(animation.delay).toBe(0);
      expect(animation.easing.replace(/\s/g, '')).toBe('cubic-bezier(0.2,0,0,1)');
    }
  }
  const glide = (line) => line.animations.find((animation) => 'transform' in animation.from);
  const fade = (line) => line.animations.find((animation) => 'opacity' in animation.from);
  expect(glide(next).from.transform).toBe('translateY(100%)');
  expect(glide(next).to.transform).toMatch(/^translateY\(0(px)?\)$/);
  expect(glide(old).to.transform.replace(/\s/g, '')).toMatch(/^translateY\(calc\(-(1\*)?100%\)\)$/);
  expect([Number(fade(next).from.opacity), Number(fade(next).to.opacity)]).toEqual([0, 1]);
  expect(Number(fade(old).to.opacity)).toBe(0);
  // The leaving line is out of the accessibility tree and takes no input.
  expect(old.hidden).toBe('true');
  expect(old.inert).toBe(true);
  expect(next.hidden).toBeNull();
  // It is gone once its glide ended.
  await expect(page.locator('#slot > *')).toHaveCount(1);
  await expect(page.locator('#slot')).toHaveText('Running npm test');
});

test('the strip halfway: the lines stand one line apart and nothing lies on another', async ({ page }) => {
  await open(page);
  await slot(page);
  await page.waitForTimeout(1000);
  const gap = await page.evaluate(() => {
    window.wheel.set('Writing the summary');
    const lines = [...document.querySelectorAll('#slot > *')];
    lines.forEach((line) => line.getAnimations().forEach((animation) => { animation.pause(); animation.currentTime = 175; }));
    const [old, next] = lines.map((line) => line.getBoundingClientRect());
    return { apart: next.top - old.top, height: old.height };
  });
  expect(gap.apart).toBeCloseTo(gap.height, 0);
});

test('the hold: a change 200ms after a roll waits --ds-hold-status minus 200ms, and its line stays hidden meanwhile', async ({ page }) => {
  await open(page);
  await slot(page);
  await page.waitForTimeout(1000);
  const delay = await page.evaluate(async () => {
    window.wheel.set('Running npm test');
    const started = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 200));
    window.wheel.set('Writing the summary');
    const elapsed = performance.now() - started;
    const line = [...document.querySelectorAll('#slot > *')].at(-1);
    const animation = line.getAnimations()[0];
    return { delay: Number(animation.effect.getTiming().delay), elapsed, opacity: getComputedStyle(line).opacity };
  });
  expect(delay.delay + delay.elapsed).toBeGreaterThan(850);
  expect(delay.delay + delay.elapsed).toBeLessThan(950);
  expect(delay.opacity).toBe('0');
});

test('a quick run of changes in one task rolls once, to the last: one leaving line, never two', async ({ page }) => {
  await open(page);
  await slot(page);
  await page.waitForTimeout(1000);
  await page.evaluate(() => ['Listing devices', 'Reading LAPTOP-0042', 'Reading LAPTOP-0043', 'Comparing versions'].forEach((text) => window.wheel.set(text)));
  const lines = await timings(page);
  expect(lines.map((line) => line.text)).toEqual(['Thinking', 'Comparing versions']);
  expect(lines[0].hidden).toBe('true');
  await expect(page.locator('#slot > *')).toHaveCount(1);
  expect(await page.evaluate(() => window.wheel.get())).toBe('Comparing versions');
});

test('a line replaced while it waited out a hold goes at once, and the next takes its time: no second hold', async ({ page }) => {
  await open(page);
  await slot(page);
  await page.waitForTimeout(1000);
  const result = await page.evaluate(async () => {
    window.wheel.set('Running npm test');
    // Its entrance under way (a timer alone does not promise that under load), so it has shown.
    const entrance = [...document.querySelectorAll('#slot > *')].at(-1).getAnimations()[0];
    await entrance.ready;
    while (!(Number(entrance.currentTime) > 0)) await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => setTimeout(resolve, 100));
    window.wheel.set('Writing the summary');
    const waiting = performance.now() + Number([...document.querySelectorAll('#slot > *')].at(-1).getAnimations()[0].effect.getTiming().delay);
    await new Promise((resolve) => setTimeout(resolve, 100));
    window.wheel.set('Done');
    const lines = [...document.querySelectorAll('#slot > *')];
    const start = performance.now() + Number(lines.at(-1).getAnimations()[0].effect.getTiming().delay);
    return { texts: lines.map((line) => line.textContent), drift: start - waiting };
  });
  // "Writing the summary" never showed: gone at once; "Done" starts when it would have.
  expect(result.texts).toEqual(['Thinking', 'Running npm test', 'Done']);
  expect(Math.abs(result.drift)).toBeLessThan(30);
});

test('an interrupted entrance glides out from where it is, never from the start', async ({ page }) => {
  await open(page);
  await slot(page);
  await page.waitForTimeout(1000);
  // Removed in the turn that brought it in (no delay), halfway through its entrance.
  const mid = await page.evaluate(() => {
    window.wheel.set('Checking ticket 4211');
    const line = [...document.querySelectorAll('#slot > *')].at(-1);
    line.getAnimations().forEach((animation) => { animation.pause(); animation.currentTime = 175; });
    const style = getComputedStyle(line);
    const at = { transform: style.transform, opacity: Number(style.opacity) };
    const out = DS.wheel.hooks.onRemove(line);
    const animations = line.getAnimations();
    return { at, frames: animations.map((animation) => animation.effect.getKeyframes()[0]), fill: animations.map((animation) => animation.effect.getTiming().fill), promise: out instanceof Promise };
  });
  expect(mid.promise).toBe(true);
  expect(mid.frames.find((frame) => 'transform' in frame).transform).toBe(mid.at.transform);
  expect(Number(mid.frames.find((frame) => 'opacity' in frame).opacity)).toBeCloseTo(mid.at.opacity, 2);
  expect(mid.at.opacity).toBeGreaterThan(0.05);
  expect(mid.at.opacity).toBeLessThan(0.95);
  expect(mid.fill).toEqual(['both', 'both']);
});

test('an entrance that ends before its exit starts (the exit waits out a hold) runs to its end: the line never jumps', async ({ page }) => {
  await open(page);
  await slot(page);
  await page.waitForTimeout(1000);
  const samples = await page.evaluate(async () => {
    window.wheel.set('Running npm test');
    const line = [...document.querySelectorAll('#slot > *')].at(-1);
    await new Promise((resolve) => setTimeout(resolve, 100));
    window.wheel.set('Writing the summary');
    const out = [];
    const start = performance.now();
    while (performance.now() - start < 1300 && line.isConnected) {
      out.push(new DOMMatrixReadOnly(getComputedStyle(line).transform === 'none' ? undefined : getComputedStyle(line).transform).m42);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    return out;
  });
  // Up, rest, up and out: the offset never grows again (no jump back down).
  for (let i = 1; i < samples.length; i += 1) expect(samples[i]).toBeLessThanOrEqual(samples[i - 1] + 0.5);
});

test('the morph hooks: a new key rolls, the same key with another figure is patched in place', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const host = document.createElement('p');
    document.querySelector('#fx-component').append(host);
    const draw = (key, text) => DS.dom.morphHtml(host, `<span class="ds-wheel"><span class="ds-wheel__line" data-ds-key="${key}">${text}</span></span>`, DS.wheel.hooks);
    draw('Connecting', 'Connecting');
    const first = host.querySelector('.ds-wheel__line');
    const firstAnimations = first.getAnimations().length;
    await new Promise((resolve) => setTimeout(resolve, 1000));
    draw('Syncing', 'Syncing 1 of 40');
    const lines = [...host.querySelectorAll('.ds-wheel__line')];
    const rolled = lines.length;
    const leaving = host.querySelector('[data-ds-leaving]')?.getAttribute('aria-hidden');
    const syncing = host.querySelector('[data-ds-key="Syncing"]');
    await new Promise((resolve) => setTimeout(resolve, 500));
    draw('Syncing', 'Syncing 2 of 40');
    const patched = host.querySelector('.ds-wheel__line[data-ds-key="Syncing"]');
    return { firstAnimations, rolled, leaving, same: patched === syncing, text: patched.textContent, count: host.querySelectorAll('.ds-wheel__line').length };
  });
  expect(result.firstAnimations).toBe(0);
  expect(result.rolled).toBe(2);
  expect(result.leaving).toBe('true');
  expect(result.same).toBe(true);
  expect(result.text).toBe('Syncing 2 of 40');
  expect(result.count).toBe(1);
});

test('the attribute path: data-ds-wheel rolls on change, data-ds-wheel-shimmer makes the line a shimmer, ds:change bubbles', async ({ page }) => {
  await open(page);
  const slotEl = page.locator('[data-demo="slot"]');
  await expect(slotEl.locator('.ds-wheel__line')).toHaveText('Thinking');
  await expect(slotEl.locator('.ds-wheel__line')).toHaveClass(/ds-shimmer/);
  await expect(slotEl.locator('.ds-wheel__line')).toHaveAttribute('data-shimmer', 'Thinking');
  const events = await page.evaluate(() => {
    const el = document.querySelector('[data-demo="slot"]');
    window.events = [];
    el.addEventListener('ds:change', (event) => window.events.push(event.detail.text));
    el.setAttribute('data-ds-wheel', 'Reading the device list');
  });
  void events;
  await expect.poll(() => page.evaluate(() => window.events)).toEqual(['Reading the device list']);
  await expect(slotEl.locator('.ds-wheel__line:not([aria-hidden])')).toHaveText('Reading the device list');
  await expect(slotEl.locator('.ds-wheel__line')).toHaveCount(1, { timeout: 3000 });
  // The slot sits in the page's polite live region; the line takes no focus.
  await expect(page.locator('[aria-live="polite"]').filter({ has: slotEl })).toHaveCount(1);
  expect(await page.evaluate(() => DS.core.get(document.querySelector('[data-demo="slot"]'), 'wheel').get())).toBe('Reading the device list');
});

test('the same text again changes nothing; the buttons of the demo roll by keyboard', async ({ page }) => {
  await open(page);
  await slot(page);
  await page.evaluate(() => window.wheel.set('Thinking'));
  expect((await timings(page)).length).toBe(1);
  await page.locator('[data-demo="next"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-demo="slot"] .ds-wheel__line:not([aria-hidden])')).toHaveText('Reading the device list', { timeout: 3000 });
});

test('a narrow slot cuts its line with an ellipsis and keeps the soft edge inside its own box', async ({ page }) => {
  await open(page);
  const narrow = page.locator('[data-demo="narrow"]');
  const look = await narrow.evaluate((el) => {
    const line = el.querySelector('.ds-wheel__line');
    const style = getComputedStyle(el);
    return {
      overflow: getComputedStyle(line).textOverflow,
      cut: line.scrollWidth > line.clientWidth,
      width: line.getBoundingClientRect().width,
      mask: style.maskImage || style.webkitMaskImage,
      padding: parseFloat(style.paddingTop),
      margin: parseFloat(style.marginTop),
    };
  });
  expect(look.overflow).toBe('ellipsis');
  expect(look.cut).toBe(true);
  expect(look.width).toBeLessThanOrEqual(160);
  expect(look.mask).toContain('linear-gradient');
  expect(look.padding).toBe(12);
  expect(look.margin).toBe(-12);
});

test('forced colours: the slot keeps its mask and its text', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const look = await page.locator('[data-demo="narrow"]').evaluate((el) => ({ mask: getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage, text: el.textContent }));
  expect(look.mask).toContain('linear-gradient');
  expect(look.text).toContain('LAPTOP-0042');
});
