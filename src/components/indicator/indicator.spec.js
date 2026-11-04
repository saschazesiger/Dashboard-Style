/**
 * The indicator on the options model (3.0): the pill on its item at every
 * size x density x touch, at once and without a glide; the shape through a
 * project class's copied border-radius (a live factor, again at each rest)
 * and never on a radius a class set itself; the declarative path
 * (data-ds-indicator, its options, DS.core.get); create() and its 2.x alias;
 * keyboard; names; forced colours. The glide itself stays with
 * test/browser/indicator.spec.js. Runs in `fallback`.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = ['ds-xs', 'ds-sm', 'ds-md', 'ds-lg', 'ds-xl'];
const DENSITIES = ['ds-density-comfortable', 'ds-density-compact', 'ds-density-dense', 'ds-density-tight'];

async function open(page) {
  await page.goto('/src/components/indicator/indicator.fixture.html');
  await ready(page);
  await page.mouse.move(1, 1);
  // Tenfold faster: only the tokens' durations change.
  await page.addStyleTag({ content: '.ds-theme { --ds-time-scale: 0.1; }' });
  await page.evaluate(() => {
    window.fxPill = DS.indicator.create(document.querySelector('#pill-track'), { active: '[aria-pressed="true"]', className: 'fx-pill' });
    window.fxOwn = DS.indicator.create(document.querySelector('#own-track'), { active: '[aria-pressed="true"]', className: 'fx-own' });
  });
}

const frames = (page) => page.evaluate(() => new Promise((resolve) => { requestAnimationFrame(() => requestAnimationFrame(resolve)); }));

/** The computed radius of the pill of a track, once its transition ended. */
const radius = (page, selector) => page.$eval(`${selector} > .ds-indicator`, async (el) => {
  await Promise.all(el.getAnimations().map((animation) => animation.finished.catch(() => null)));
  return getComputedStyle(el).getPropertyValue('--ds-indicator-radius').trim();
});

test('the pill stays on its item at every size x density x touch, without a glide', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(async ({ sizes, densities }) => {
    const options = document.querySelector('#options');
    const pill = document.querySelector('#pill-track > .ds-indicator');
    const item = document.querySelector('#pill-a');
    const out = [];
    const frame = () => new Promise((resolve) => { requestAnimationFrame(() => requestAnimationFrame(resolve)); });
    for (const touch of [false, true]) {
      for (const density of densities) {
        for (const size of sizes) {
          options.className = `${size} ${density} ${touch ? 'ds-touch' : ''}`;
          await frame();
          const [a, b] = [pill.getBoundingClientRect(), item.getBoundingClientRect()];
          out.push({ name: options.className, touch, glide: pill.hasAttribute('data-glide'), delta: [a.left - b.left, a.top - b.top, a.width - b.width, a.height - b.height], height: b.height });
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES });
  expect(measured).toHaveLength(SIZES.length * DENSITIES.length * 2);
  expect(new Set(measured.map((entry) => entry.height)).size).toBeGreaterThan(5);
  for (const entry of measured) {
    expect(entry.glide, entry.name).toBe(false);
    for (const delta of entry.delta) expect(Math.abs(delta), entry.name).toBeLessThan(0.5);
    if (entry.touch) expect(entry.height, entry.name).toBeGreaterThanOrEqual(48);
  }
});

test('shape: a project class\'s border-radius is copied with the shape as a live factor', async ({ page }) => {
  await open(page);
  // The pill's 9999px, capped at half the 40px item.
  expect(await page.$eval('#pill-track > .ds-indicator', (el) => el.style.getPropertyValue('--ds-indicator-radius'))).toBe('calc(20px * var(--ds-shape, 1))');
  expect(await radius(page, '#pill-track')).toBe('20px');
  const expected = [['ds-shape-square', '0px'], ['ds-shape-soft', '10px'], ['ds-shape-round', '30px'], ['', '20px']];
  for (const [name, value] of expected) {
    // No placement runs: nothing changes size, only the class of an ancestor.
    await page.$eval('#options', (el, cls) => { el.className = cls; }, name);
    await frames(page);
    expect(await radius(page, '#pill-track'), name || 'default').toBe(value);
  }
  // A later rest copies again: the larger item keeps its pill, and a square stays square.
  await page.$eval('#options', (el) => { el.className = 'ds-lg'; });
  await frames(page);
  expect(await radius(page, '#pill-track')).toBe('24px');
  await page.$eval('#options', (el) => { el.className = 'ds-lg ds-shape-square'; });
  await frames(page);
  expect(await radius(page, '#pill-track')).toBe('0px');
  // A class that sets --ds-indicator-radius keeps it, and nothing is copied.
  expect(await page.$eval('#own-track > .ds-indicator', (el) => el.style.getPropertyValue('--ds-indicator-radius'))).toBe('');
  expect(await radius(page, '#own-track')).toBe('6px');
});

test('at shape 0 a glide keeps square corners and lands on the item', async ({ page }) => {
  await open(page);
  await page.$eval('#options', (el) => { el.className = 'ds-shape-square'; });
  await frames(page);
  await page.evaluate(() => {
    document.querySelector('#pill-a').setAttribute('aria-pressed', 'false');
    document.querySelector('#pill-c').setAttribute('aria-pressed', 'true');
  });
  const pill = page.locator('#pill-track > .ds-indicator');
  await expect(pill).toHaveAttribute('data-glide', '');
  expect(await pill.evaluate((el) => getComputedStyle(el).getPropertyValue('--ds-indicator-radius').trim())).toBe('0px');
  await expect(pill).not.toHaveAttribute('data-glide', '', { timeout: 3000 });
  const [a, b] = await page.evaluate(() => [document.querySelector('#pill-track > .ds-indicator'), document.querySelector('#pill-c')].map((el) => {
    const rect = el.getBoundingClientRect();
    return [rect.left, rect.top, rect.width, rect.height];
  }));
  a.forEach((value, index) => expect(Math.abs(value - b[index])).toBeLessThan(0.5));
});

test('declarative: DS.init() makes the pill from data-ds-indicator and its options', async ({ page }) => {
  await open(page);
  const pill = page.locator('#links > .ds-indicator');
  await expect(pill).toHaveClass(/ds-segmented__indicator/);
  await expect(page.locator('#links')).toHaveClass(/ds-has-indicator/);
  // The controller.
  expect(await page.evaluate(() => {
    const controller = DS.core.get(document.querySelector('#links'), 'indicator');
    return [typeof controller.update, typeof controller.destroy];
  })).toEqual(['function', 'function']);
  // Empty value: any item that says it is the current one.
  const [a, b] = await page.evaluate(() => [document.querySelector('#radios > .ds-indicator'), document.querySelector('#radios [aria-checked="true"]')].map((el) => el.getBoundingClientRect().width));
  expect(Math.abs(a - b)).toBeLessThan(0.5);
  // The page moves the attribute; the pill follows.
  await page.evaluate(() => {
    const links = [...document.querySelectorAll('#links a')];
    links[0].removeAttribute('aria-current');
    links[1].setAttribute('aria-current', 'true');
  });
  await expect(pill).toHaveAttribute('data-glide', '');
  await expect(pill).not.toHaveAttribute('data-glide', '', { timeout: 3000 });
  // A changed option replaces the pill; an attribute taken away destroys it.
  await page.$eval('#links', (el) => el.setAttribute('data-ds-indicator-class', 'fx-pill'));
  await expect(page.locator('#links > .ds-indicator')).toHaveClass(/fx-pill/);
  expect(await page.locator('#links > .ds-indicator').count()).toBe(1);
  await page.$eval('#links', (el) => el.removeAttribute('data-ds-indicator'));
  await expect(page.locator('#links > .ds-indicator')).toHaveCount(0);
  await expect(page.locator('#links')).not.toHaveClass(/ds-has-indicator/);
});

test('create() and its 2.x alias: one pill per track, the live handle for the same options', async ({ page }) => {
  await open(page);
  const state = await page.evaluate(() => {
    const track = document.querySelector('#pill-track');
    const options = { active: '[aria-pressed="true"]', className: 'fx-pill' };
    const same = DS.indicator.create(track, options) === window.fxPill;
    const alias = DS.indicator.createIndicator(track, options) === window.fxPill;
    const other = DS.indicator.create(track, { active: '[aria-pressed="true"]', className: 'fx-own' });
    return { same, alias, replaced: other !== window.fxPill, pills: track.querySelectorAll('.ds-indicator').length };
  });
  expect(state).toEqual({ same: true, alias: true, replaced: true, pills: 1 });
});

test('keyboard and names: the arrow keys move the choice and the pill follows; the pill is no stop and no name', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const track = document.querySelector('#radios');
    DS.dom.roving(track, { items: '.ds-segmented__option' });
    track.addEventListener('click', (event) => {
      const item = event.target.closest('.ds-segmented__option');
      if (item) track.querySelectorAll('.ds-segmented__option').forEach((other) => other.setAttribute('aria-checked', String(other === item)));
    });
  });
  const first = page.getByRole('radio', { name: 'List' });
  await first.focus();
  await page.keyboard.press('ArrowRight');
  const cards = page.getByRole('radio', { name: 'Cards' });
  await expect(cards).toHaveAttribute('aria-checked', 'true');
  await expect(cards).toBeFocused();
  await expect.poll(() => page.evaluate(() => {
    const pill = document.querySelector('#radios > .ds-indicator');
    const item = document.querySelector('#radios [aria-checked="true"]');
    return !pill.hasAttribute('data-glide') && Math.abs(pill.getBoundingClientRect().left - item.getBoundingClientRect().left) < 0.5;
  }), { timeout: 3000 }).toBe(true);
  await page.keyboard.press('End');
  await expect(page.getByRole('radio', { name: 'Map' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('radiogroup', { name: 'View' }).getByRole('radio')).toHaveCount(3);
  const span = await page.$eval('#radios > .ds-indicator', (el) => ({ hidden: el.getAttribute('aria-hidden'), keep: el.hasAttribute('data-ds-keep'), tabindex: el.getAttribute('tabindex'), events: getComputedStyle(el).pointerEvents }));
  expect(span).toEqual({ hidden: 'true', keep: true, tabindex: null, events: 'none' });
});

test('forced colours: no pill for any class, the item shows the choice; placing still works', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  for (const track of ['#pill-track', '#own-track', '#links', '#radios', '#tabs']) {
    expect(await page.$eval(`${track} > .ds-indicator`, (el) => getComputedStyle(el).display), track).toBe('none');
  }
  const system = await page.evaluate(() => {
    const el = document.createElement('span');
    el.style.forcedColorAdjust = 'none';
    el.style.backgroundColor = 'SelectedItem';
    document.querySelector('.ds-theme').append(el);
    const colour = getComputedStyle(el).backgroundColor;
    el.remove();
    return colour;
  });
  expect(await page.$eval('#links [aria-current="true"]', (el) => getComputedStyle(el).backgroundColor)).toBe(system);
  // A glide has nothing to run: the pill rests on the new item at once.
  await page.evaluate(() => {
    document.querySelector('#pill-a').setAttribute('aria-pressed', 'false');
    document.querySelector('#pill-b').setAttribute('aria-pressed', 'true');
  });
  await expect.poll(() => page.$eval('#pill-track > .ds-indicator', (el) => !el.hasAttribute('data-glide') && el.style.getPropertyValue('--ds-indicator-x') !== '0px'), { timeout: 3000 }).toBe(true);
});
