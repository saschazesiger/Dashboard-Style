/**
 * The indicator on the options model (3.0): the pill on its item at every
 * size x density x touch, at once and without a glide; the shape through a
 * project class's copied border-radius (a live factor, again at each rest)
 * and never on a radius a class set itself; the declarative path
 * (data-ds-indicator, its options, DS.core.get); create() and its 2.x alias;
 * the handle (one controller, get, set, on, destroy after a replacement);
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

/**
 * Watches the pill from inside the page, since a glide at this speed can end
 * before a poll from outside sees it. `landed()` resolves with its radius when
 * the glide started, once it has landed.
 */
const watchGlide = (page, selector) => {
  const watching = page.$eval(selector, (pill) => {
    window.fxGlide = new Promise((resolve) => {
      let radius = null;
      const observer = new MutationObserver(() => {
        if (pill.hasAttribute('data-glide')) radius ??= getComputedStyle(pill).getPropertyValue('--ds-indicator-radius').trim();
        else if (radius !== null) {
          observer.disconnect();
          resolve(radius);
        }
      });
      observer.observe(pill, { attributes: true, attributeFilter: ['data-glide'] });
    });
  });
  return { watching, landed: () => page.evaluate(() => window.fxGlide) };
};

/** The computed radius of the pill of a track, once its transition ended. */
const radius = (page, selector) => page.$eval(`${selector} > .ds-indicator`, async (el) => {
  await Promise.all(el.getAnimations().map((animation) => animation.finished.catch(() => null)));
  return getComputedStyle(el).getPropertyValue('--ds-indicator-radius').trim();
});

test('the pill stays on its item at every size x density x touch, without a glide', async ({ page }) => {
  test.slow();
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

test('shape: a class that multiplies by the shape sets the radius itself, and it holds over every rest', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.fxShaped = DS.indicator.create(document.querySelector('#shaped-track'), { active: '[aria-pressed="true"]', className: 'fx-shaped' }); });
  await page.$eval('#options', (el) => { el.className = 'ds-shape-soft'; });
  await frames(page);
  const shaped = page.locator('#shaped-track > .ds-indicator');
  expect(await radius(page, '#shaped-track')).toBe('8px');
  const glide = watchGlide(page, '#shaped-track > .ds-indicator');
  await glide.watching;
  // A rest after a resize and one after a glide: nothing is copied, so the shape is applied once.
  await page.$eval('#options', (el) => { el.className = 'ds-shape-soft ds-lg'; });
  await frames(page);
  expect(await radius(page, '#shaped-track')).toBe('8px');
  await page.evaluate(() => {
    document.querySelector('#shaped-a').setAttribute('aria-pressed', 'false');
    document.querySelector('#shaped-b').setAttribute('aria-pressed', 'true');
  });
  await glide.landed();
  expect(await radius(page, '#shaped-track')).toBe('8px');
  expect(await shaped.evaluate((el) => el.style.getPropertyValue('--ds-indicator-radius'))).toBe('');
});

test('a radius springing to 0 never makes the clip invalid, also on its pass below zero', async ({ page }) => {
  await open(page);
  const clips = await page.evaluate(async () => {
    document.querySelector('#options').className = 'ds-shape-square';
    const pill = document.querySelector('#pill-track > .ds-indicator');
    const animation = pill.getAnimations().find((entry) => entry.transitionProperty === '--ds-indicator-radius');
    animation.pause();
    const out = [];
    const end = Number(animation.effect.getComputedTiming().endTime);
    for (let step = 0; step <= 40; step += 1) {
      animation.currentTime = (end * step) / 40;
      out.push(getComputedStyle(pill).clipPath);
    }
    animation.finish();
    return out;
  });
  expect(clips).toHaveLength(41);
  expect(clips.filter((clip) => clip === 'none')).toEqual([]);
});

test('at shape 0 a glide keeps square corners and lands on the item', async ({ page }) => {
  await open(page);
  await page.$eval('#options', (el) => { el.className = 'ds-shape-square'; });
  await frames(page);
  const glide = watchGlide(page, '#pill-track > .ds-indicator');
  await glide.watching;
  await page.evaluate(() => {
    document.querySelector('#pill-a').setAttribute('aria-pressed', 'false');
    document.querySelector('#pill-c').setAttribute('aria-pressed', 'true');
  });
  expect(await glide.landed()).toBe('0px');
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
  const glide = watchGlide(page, '#links > .ds-indicator');
  await glide.watching;
  await page.evaluate(() => {
    const links = [...document.querySelectorAll('#links a')];
    links[0].removeAttribute('aria-current');
    links[1].setAttribute('aria-current', 'true');
  });
  await glide.landed();
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

test('the attribute path and create() share one controller, and it stays valid when the pill is replaced', async ({ page }) => {
  await open(page);
  const state = await page.evaluate(async () => {
    const track = document.querySelector('#links');
    const controller = DS.core.get(track, 'indicator');
    const shape = ['get', 'set', 'on', 'update', 'destroy'].map((name) => typeof controller[name]);
    const same = DS.indicator.create(track, { active: '[aria-current="true"]', className: 'ds-segmented__indicator' }) === controller;
    const pills = () => track.querySelectorAll(':scope > .ds-indicator');
    // A changed option attribute replaces the pill inside it.
    track.setAttribute('data-ds-indicator-class', 'fx-own');
    await new Promise((resolve) => { setTimeout(resolve, 0); });
    const attribute = { same: DS.core.get(track, 'indicator') === controller, pills: pills().length, own: pills()[0].classList.contains('fx-own') };
    // So does a call with other options: the same handle, and it moves and removes the page's pill.
    const replaced = DS.indicator.create(track, { active: '[aria-current="true"]', className: 'fx-pill', observe: false });
    const page = { same: replaced === controller, core: DS.core.get(track, 'indicator') === controller, pills: pills().length, pill: pills()[0].classList.contains('fx-pill') };
    const links = [...track.querySelectorAll('a')];
    links[0].removeAttribute('aria-current');
    links[1].setAttribute('aria-current', 'true');
    const before = pills()[0].style.getPropertyValue('--ds-indicator-r');
    controller.update();
    const moved = pills()[0].hasAttribute('data-glide') || pills()[0].style.getPropertyValue('--ds-indicator-r') !== before;
    controller.destroy();
    controller.destroy();
    return { shape, same, attribute, page, moved, pills: pills().length, cls: track.classList.contains('ds-has-indicator') };
  });
  expect(state).toEqual({
    shape: ['function', 'function', 'function', 'function', 'function'],
    same: true,
    attribute: { same: true, pills: 1, own: true },
    page: { same: true, core: true, pills: 1, pill: true },
    moved: true,
    pills: 0,
    cls: false,
  });
});

test('a page\'s own handle keeps the 2.x contract: other options make a new one, the old one is spent', async ({ page }) => {
  await open(page);
  const state = await page.evaluate(() => {
    const track = document.querySelector('#pill-track');
    const other = DS.indicator.create(track, { active: '[aria-pressed="true"]', className: 'fx-own' });
    window.fxPill.destroy();
    return { fresh: other !== window.fxPill, pills: track.querySelectorAll(':scope > .ds-indicator').length, own: track.querySelector(':scope > .ds-indicator').classList.contains('fx-own') };
  });
  expect(state).toEqual({ fresh: true, pills: 1, own: true });
});

test('the handle: get() is the active item, set() moves its attribute, on() hears ds:change', async ({ page }) => {
  await open(page);
  const state = await page.evaluate(async () => {
    const frame = () => new Promise((resolve) => { requestAnimationFrame(() => requestAnimationFrame(resolve)); });
    const pressed = (el) => el.getAttribute('aria-pressed');
    const [a, b, c] = ['#pill-a', '#pill-b', '#pill-c'].map((id) => document.querySelector(id));
    const events = [];
    const bubbled = [];
    document.addEventListener('ds:change', (event) => bubbled.push(event.target.id));
    const off = window.fxPill.on('change', (event) => events.push(event.detail.item?.id ?? null));
    const start = window.fxPill.get() === a;
    // An element: the attribute moves, the pill glides there, at once.
    window.fxPill.set(b);
    const element = [pressed(a), pressed(b), window.fxPill.get() === b, document.querySelector('#pill-track > .ds-indicator').hasAttribute('data-glide')];
    await frame();
    // Nothing happens for what is no choice: the active item again, a selector without a match, a foreign element.
    window.fxPill.set(b);
    window.fxPill.set('#nothing');
    window.fxPill.set(document.querySelector('#own-track button'));
    const ignored = window.fxPill.get() === b;
    // A selector; then the page moves the attribute itself: the same event.
    window.fxPill.set('#pill-c');
    const selector = [pressed(b), pressed(c)];
    await frame();
    c.setAttribute('aria-pressed', 'false');
    a.setAttribute('aria-pressed', 'true');
    await frame();
    await frame();
    // null clears; an aria-current selector removes the attribute instead of writing "false".
    window.fxPill.set(null);
    const cleared = [window.fxPill.get(), pressed(a)];
    off();
    window.fxPill.set(b);
    const links = DS.core.get(document.querySelector('#links'), 'indicator');
    const [live, admin] = document.querySelectorAll('#links a');
    links.set(admin);
    const current = [live.hasAttribute('aria-current'), admin.getAttribute('aria-current')];
    // A selector that names no attribute: that state is the page's.
    const free = document.querySelector('#own-track');
    const handle = DS.indicator.create(free, { active: 'button:nth-of-type(1)', className: 'fx-own' });
    const [one, two] = free.querySelectorAll('button');
    handle.set(two);
    return { start, element, ignored, selector, cleared, events, bubbled: bubbled.includes('pill-track'), current, free: handle.get() === one && pressed(two) === 'false' };
  });
  expect(state).toEqual({
    start: true,
    element: ['false', 'true', true, true],
    ignored: true,
    selector: ['false', 'true'],
    cleared: [null, 'false'],
    events: ['pill-b', 'pill-c', 'pill-a', null],
    bubbled: true,
    current: [false, 'true'],
    free: true,
  });
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
