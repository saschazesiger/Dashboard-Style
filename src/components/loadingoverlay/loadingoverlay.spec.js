/**
 * The loading overlay: it blocks its region only (inert, aria-busy, the
 * pointer), keeps focus, says its message, shows after the loader delay and
 * holds, builds itself, cancels, takes the options, and keeps its edge in
 * forced colours. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

async function open(page, width = 1280) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto('/test/browser/fixtures/component.html?c=loadingoverlay');
  await ready(page);
  await page.mouse.move(1, 1);
}

test('Save blocks the card only: inert, aria-busy, the veil takes the pointer; focus moves in and comes back', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.release = null;
    const card = document.querySelector('[data-demo="save-card"]');
    window.veil = DS.loadingoverlay.create(card.querySelector('.ds-loadingoverlay'));
  });
  const card = page.locator('[data-demo="save-card"]');
  const owner = card.getByLabel('Owner');
  await owner.focus();
  await page.evaluate(() => {
    const card = document.querySelector('[data-demo="save-card"]');
    DS.loadingoverlay.wait(card, new Promise((resolve) => { window.release = resolve; }), { done: 'Saved' });
  });
  const overlay = card.locator('.ds-loadingoverlay');
  await expect(overlay).toHaveAttribute('data-state', 'open');
  await expect(card).toHaveAttribute('aria-busy', 'true');
  expect(await owner.evaluate((el) => el.closest('[inert]') !== null), 'the content is inert').toBe(true);
  await expect(card.locator('.ds-loadingoverlay__box'), 'focus left the inert field for the box').toBeFocused();
  // The other card stays usable: not inert, and the pointer reaches it.
  const other = await page.evaluate(() => {
    const button = document.querySelector('[data-demo="other"]');
    const box = button.getBoundingClientRect();
    return { inert: button.closest('[inert]') !== null, hit: document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)?.closest('[data-demo="other"]') === button };
  });
  expect(other).toEqual({ inert: false, hit: true });
  // The veil covers the card and takes a click meant for the field.
  const hit = await page.evaluate(() => {
    const field = document.querySelector('[data-demo="save-card"] input');
    const box = field.getBoundingClientRect();
    return document.elementFromPoint(box.left + 4, box.top + 4)?.closest('.ds-loadingoverlay') !== null;
  });
  expect(hit).toBe(true);
  await page.evaluate(() => window.release());
  await expect(overlay).toBeHidden();
  await expect(card).not.toHaveAttribute('aria-busy', 'true');
  expect(await owner.evaluate((el) => el.closest('[inert]') === null)).toBe(true);
  await expect(owner, 'focus back where it was').toBeFocused();
});

test('no flash: invisible during --ds-delay-loader, then held for --ds-hold-loader; the message is said once seen', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const card = document.querySelector('[data-demo="save-card"]');
    const overlay = card.querySelector('.ds-loadingoverlay');
    const delay = DS.motion.motionDuration(overlay, '--ds-delay-loader');
    const hold = DS.motion.motionDuration(overlay, '--ds-hold-loader');
    const veil = DS.loadingoverlay.show(card, { message: 'Saving LAPTOP-0042 ...' });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const early = Number(getComputedStyle(overlay).opacity);
    await new Promise((resolve) => setTimeout(resolve, delay + DS.motion.motionDuration(overlay, '--ds-dur-fast') + 100));
    const shown = Number(getComputedStyle(overlay).opacity);
    const spoken = [...document.querySelectorAll('[aria-live]')].some((region) => region.textContent.includes('Saving LAPTOP-0042'));
    const started = performance.now();
    await veil.set(false);
    const held = performance.now() - started;
    return { early, shown, spoken, held, hold, delay };
  });
  expect(result.early).toBeLessThan(0.05);
  expect(result.shown).toBeCloseTo(1, 1);
  expect(result.spoken).toBe(true);
  expect(result.held, 'held until it was visible for --ds-hold-loader').toBeGreaterThan(result.hold - result.delay - 150);
});

test('a quick job shows nothing; show() builds an overlay in a region without one; cancel and Escape', async ({ page }) => {
  await open(page);
  const quick = await page.evaluate(async () => {
    const card = document.querySelector('[data-demo="save-card"]');
    const overlay = card.querySelector('.ds-loadingoverlay');
    let peak = 0;
    const watch = setInterval(() => { peak = Math.max(peak, Number(getComputedStyle(overlay).opacity)); }, 10);
    await DS.loadingoverlay.wait(card, new Promise((resolve) => setTimeout(resolve, 30)));
    clearInterval(watch);
    return { peak, hidden: overlay.hidden };
  });
  expect(quick.peak).toBeLessThan(0.05);
  expect(quick.hidden).toBe(true);
  const built = await page.evaluate(() => {
    const region = document.createElement('section');
    region.className = 'ds-card';
    region.setAttribute('aria-label', 'Built');
    region.innerHTML = '<button class="ds-btn" type="button">Inside</button>';
    document.querySelector('#fx-component').prepend(region);
    region.querySelector('button').focus();
    window.cancelled = 0;
    const veil = DS.loadingoverlay.show(region, { message: 'Loading tickets ...', cancel: true });
    region.addEventListener('ds:cancel', () => { window.cancelled += 1; });
    const overlay = region.querySelector('.ds-loadingoverlay');
    return {
      position: getComputedStyle(region).position,
      role: overlay.querySelector('.ds-loadingoverlay__box').getAttribute('role'),
      cancel: overlay.querySelector('[data-ds-loadingoverlay-cancel]').textContent,
      focused: document.activeElement === overlay.querySelector('[data-ds-loadingoverlay-cancel]'),
      shown: veil.get().shown,
    };
  });
  expect(built).toEqual({ position: 'relative', role: 'status', cancel: 'Cancel', focused: true, shown: true });
  await page.keyboard.press('Escape');
  await expect(page.locator('[aria-label="Built"] .ds-loadingoverlay')).toBeHidden();
  expect(await page.evaluate(() => [window.cancelled, getComputedStyle(document.querySelector('[aria-label="Built"]')).position])).toEqual([1, 'static']);
  await expect(page.getByRole('button', { name: 'Inside' })).toBeFocused();
});

test('destroy() while it shows gives the region back at once, and a pending hide does nothing', async ({ page }) => {
  await open(page);
  const after = await page.evaluate(async () => {
    const region = document.createElement('section');
    region.className = 'ds-card';
    region.setAttribute('aria-label', 'Destroyed');
    region.innerHTML = '<button class="ds-btn" type="button">Inside</button>';
    document.querySelector('#fx-component').prepend(region);
    const veil = DS.loadingoverlay.show(region, { message: 'Loading ...' });
    await new Promise((resolve) => setTimeout(resolve, DS.motion.motionDuration(region, '--ds-delay-loader') + 50));
    const pending = veil.set(false);
    veil.destroy();
    await pending;
    await new Promise((resolve) => setTimeout(resolve, DS.motion.motionDuration(region, '--ds-hold-loader') + 50));
    const overlay = region.querySelector('.ds-loadingoverlay');
    return {
      busy: region.getAttribute('aria-busy'),
      position: region.style.position,
      hidden: overlay.hidden,
      state: overlay.getAttribute('data-state'),
      inert: region.querySelectorAll('[inert]').length,
    };
  });
  expect(after).toEqual({ busy: null, position: '', hidden: true, state: null, inert: 0 });
});

test('the demo: progress, detail and cancel; the ring and its value follow', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Import devices' }).click();
  const overlay = page.locator('[data-demo="import-overlay"]');
  await expect(overlay).toHaveAttribute('data-state', 'open');
  await expect(overlay.locator('.ds-loadingoverlay__detail')).not.toHaveText('0 of 2,030 rows');
  const now = Number(await overlay.getByRole('progressbar').getAttribute('aria-valuenow'));
  expect(now).toBeGreaterThan(0);
  await overlay.getByRole('button', { name: 'Cancel' }).click();
  await expect(overlay).toBeHidden();
});

test('options: size steps the spinner, density the padding, shape the radius; opaque veil', async ({ page }) => {
  await open(page);
  const measure = (around) => page.evaluate((around) => {
    const region = document.createElement('div');
    region.className = around;
    region.innerHTML = '<section class="ds-card" style="position:relative;min-block-size:200px"><div class="ds-loadingoverlay"><div class="ds-loadingoverlay__box" role="status"><span class="ds-spinner" aria-hidden="true"></span><p class="ds-loadingoverlay__message">Loading</p></div></div></section>';
    document.querySelector('#fx-component').append(region);
    const box = region.querySelector('.ds-loadingoverlay__box');
    const out = {
      spinner: region.querySelector('.ds-spinner').getBoundingClientRect().width,
      pad: parseFloat(getComputedStyle(box).paddingTop),
      radius: parseFloat(getComputedStyle(box).borderTopLeftRadius),
    };
    region.remove();
    return out;
  }, around);
  const md = await measure('');
  expect(md.spinner).toBeCloseTo(32, 0);
  expect((await measure('ds-lg')).spinner).toBeCloseTo(36, 0);
  expect((await measure('ds-density-compact')).pad).toBeCloseTo(md.pad - 2, 0);
  expect((await measure('ds-shape-square')).radius).toBe(0);
  expect((await measure('ds-shape-round')).radius).toBeCloseTo(md.radius * 1.5, 1);
});

test('forced colours: the box keeps its edge, the veil is the canvas', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const seen = await page.evaluate(() => {
    const overlay = [...document.querySelectorAll('.ds-loadingoverlay')].find((el) => !el.hidden);
    return { edge: getComputedStyle(overlay.querySelector('.ds-loadingoverlay__box')).borderTopColor, veil: getComputedStyle(overlay).backgroundColor };
  });
  expect(seen.edge).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
  expect(seen.veil).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
});
