/**
 * The ripple on the options model (3.0): a button at every size x density x
 * touch x shape fills its box and is clipped by its radius, and the press
 * morph never rounds a corner past its rest value (shape 0 stays square);
 * every other host presses at the default shape and at shape 0; the tab's
 * ripple box follows the shape; tone and the hook; keyboard; names; forced
 * colours; and the cascade: ripple.css played in a later layer than every
 * component, as sublayers will do, changes nothing (blocked hosts stay
 * unpressed, hosts keep their own position, a cell its own overflow). The
 * 2.x behaviour stays with test/browser/ripple.spec.js. Runs in `fallback`.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const SHAPES = [['ds-shape-square', 0], ['ds-shape-soft', 0.5], ['', 1], ['ds-shape-round', 1.5]];

async function open(page, { attach = true } = {}) {
  await page.goto('/src/components/ripple/ripple.fixture.html');
  await ready(page);
  await page.mouse.move(1, 1);
  // Tenfold faster: a test presses dozens of hosts. Only the tokens' durations change.
  await page.addStyleTag({ content: '.ds-theme { --ds-time-scale: 0.1; }' });
  if (attach) await page.evaluate(() => { window.fxRipples = DS.ripple.attach(document); });
}

/** Styles apply at once: what a test reads is the end of a state, not a frame of its way there. */
const noTransitions = (page) => page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });

/** Waits for every transition of the element (and its layer), so a radius read is its end value. */
const settled = (locator) => locator.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).filter((animation) => animation.transitionProperty).map((animation) => animation.finished.catch(() => null))).then(() => undefined));

test('a button at every size x density x touch x shape: the ripple fills its box, the clip is its radius', async ({ page }) => {
  await open(page);
  await noTransitions(page);
  const measured = await page.evaluate(({ sizes, densities, shapes }) => {
    const grid = document.querySelector('#grid');
    const out = [];
    const press = (el) => {
      const rect = el.getBoundingClientRect();
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, isPrimary: true, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1, clientX: rect.left + 3, clientY: rect.top + 3 }));
    };
    for (const touch of [false, true]) {
      for (const [shape, factor] of shapes) {
        for (const [density, level] of densities) {
          for (const [size, step] of sizes) {
            const region = document.createElement('div');
            region.className = `fx-row ${density} ${shape} ${touch ? 'ds-touch' : ''}`;
            region.innerHTML = `<button class="ds-btn ${size}" type="button">Save</button><button class="ds-btn ds-btn--quiet ds-btn--icon ${size}" type="button" aria-label="Edit">${DS.icons.icon(DS.icons.pencil, 20)}</button>`;
            grid.replaceChildren(region);
            for (const el of region.children) {
              const rest = parseFloat(getComputedStyle(el).borderTopLeftRadius);
              const rect = el.getBoundingClientRect();
              press(el);
              const span = el.querySelector('.ds-press-ripple');
              const style = getComputedStyle(el);
              out.push({
                name: `${size} ${density} ${shape || 'default'} ${touch ? 'touch ' : ''}${el.classList.contains('ds-btn--icon') ? 'icon' : 'label'}`,
                factor,
                rest,
                pressed: parseFloat(style.borderTopLeftRadius),
                // What the rule computes (--_box): 40px, 8px per size step, 4px per density step on a labelled
                // button only, at least the touch minimum. The radius follows it, not a taller line of text.
                half: Math.max(touch ? 48 : 0, 40 + step * 8 + (el.classList.contains('ds-btn--icon') ? 0 : level * 4)) / 2,
                overflow: style.overflowX,
                isolation: style.isolation,
                touch,
                height: rect.height,
                x: parseFloat(span.style.getPropertyValue('--ds-ripple-x')),
                y: parseFloat(span.style.getPropertyValue('--ds-ripple-y')),
                r: parseFloat(span.style.getPropertyValue('--ds-ripple-r')),
                width: el.clientWidth,
                inner: el.clientHeight,
              });
              window.fxRipples.release(el);
            }
          }
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES, shapes: SHAPES });
  expect(measured).toHaveLength(SIZES.length * DENSITIES.length * SHAPES.length * 2 * 2);
  for (const entry of measured) {
    // The rest radius: the pill times the shape, never over half the box.
    expect(entry.rest, `${entry.name} at rest`).toBeCloseTo(Math.min(entry.half * entry.factor, entry.half), 0);
    // The morph: the pressed role times the shape, never rounder than at rest.
    expect(entry.pressed, `${entry.name} pressed`).toBeCloseTo(Math.min(12 * entry.factor, entry.rest), 0);
    if (entry.factor === 0) expect(entry.pressed, `${entry.name}: shape 0 stays square`).toBe(0);
    // Clipped and isolated while pressed; the circle reaches the farthest corner of whatever box this is.
    expect(entry.overflow, entry.name).toBe('clip');
    expect(entry.isolation, entry.name).toBe('isolate');
    expect(entry.r, entry.name).toBeCloseTo(Math.hypot(Math.max(entry.x, entry.width - entry.x), Math.max(entry.y, entry.inner - entry.y)), 1);
    if (entry.touch) expect(entry.height, `${entry.name}: touch wins`).toBeGreaterThanOrEqual(48);
  }
});

for (const [shape, factor] of [['', 1], ['ds-shape-square', 0]]) {
  test(`every host presses at ${shape || 'the default shape'}: the ripple goes in, the morph never rounds a corner`, async ({ page, browserName }) => {
    await open(page);
    if (shape) await page.evaluate((name) => document.querySelector('#hosts').classList.add(name), shape);
    const ids = await page.$$eval('#hosts [data-host]', (hosts) => hosts.map((host) => host.id));
    expect(ids.length).toBeGreaterThan(20);
    for (const id of ids) {
      const host = page.locator(`#${id}`);
      await host.scrollIntoViewIfNeeded();
      const facts = await host.evaluate((el) => {
        const surface = el.dataset.surface ? el.querySelector(el.dataset.surface) : el;
        return { row: 'row' in el.dataset, radius: parseFloat(getComputedStyle(surface).borderTopLeftRadius), position: getComputedStyle(surface).position, transform: getComputedStyle(surface).transform };
      });
      // The defensive guard of the script: a host must be positioned by itself (WebKit: a row by its transform).
      if (!(facts.row && browserName === 'webkit')) expect(facts.position, `${id} is positioned`).not.toBe('static');
      const box = await host.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await expect(host.locator('.ds-press-ripple').first(), `${id} ripples`).toBeAttached();
      await settled(host);
      const pressed = await host.evaluate((el) => {
        const surface = el.dataset.surface ? el.querySelector(el.dataset.surface) : el;
        return { pressed: el.classList.contains('ds-pressed'), radius: parseFloat(getComputedStyle(surface).borderTopLeftRadius) };
      });
      expect(pressed.pressed, `${id} holds .ds-pressed`).toBe(true);
      expect(pressed.radius, `${id}: never rounder than at rest`).toBeLessThanOrEqual(facts.radius + 0.01);
      if (factor === 0 && id.startsWith('h-') && ['h-btn', 'h-filled', 'h-icon', 'h-disc'].includes(id)) expect(pressed.radius, `${id} stays square`).toBe(0);
      await page.mouse.up();
      await expect.poll(() => host.locator('.ds-press-ripple').count(), { message: `${id} ripple goes`, timeout: 3000 }).toBe(0);
      // A link or a toggle reacted to the click: back to the start for the next host.
      await page.evaluate(() => { if (location.hash) history.replaceState(null, '', location.pathname); });
    }
  });
}

test('the tab\'s ripple box takes the radius of the tab\'s layer, by the shape and the height', async ({ page }) => {
  await open(page);
  const tab = page.locator('#h-tab');
  const boxRadius = async (classes) => {
    await page.evaluate((names) => { document.querySelector('#hosts').className = `fx-section ${names}`; }, classes);
    await tab.scrollIntoViewIfNeeded();
    const box = await tab.boundingBox();
    await page.mouse.move(box.x + 8, box.y + box.height / 2);
    await page.mouse.down();
    const radius = await tab.locator('.ds-press-ripple').first().evaluate((el) => ({ value: parseFloat(getComputedStyle(el).borderTopLeftRadius), clip: getComputedStyle(el).overflowX }));
    await page.mouse.up();
    await expect.poll(() => tab.locator('.ds-press-ripple').count(), { timeout: 3000 }).toBe(0);
    expect(radius.clip).toBe('clip');
    return radius.value;
  };
  // Half of the 40px layer of a 48px tab (the 4px inset on each side).
  expect(await boxRadius('')).toBe(20);
  expect(await tab.evaluate((el) => parseFloat(getComputedStyle(el, '::before').borderTopLeftRadius))).toBe(20);
  expect(await boxRadius('ds-shape-square')).toBe(0);
  expect(await boxRadius('ds-shape-soft')).toBe(10);
  expect(await boxRadius('ds-shape-round')).toBe(20);
  // The formula of a tab's height: 8px per size step, 4px per density step, at least the touch minimum.
  expect(await boxRadius('ds-lg')).toBe(24);
  expect(await boxRadius('ds-density-compact')).toBe(18);
  expect(await boxRadius('ds-xs ds-touch')).toBe(20);
});

test('the ink is the host\'s content colour, so a tone comes along; the hook takes over', async ({ page }) => {
  await open(page);
  await noTransitions(page);
  const ink = async (selector) => {
    const button = page.locator(selector);
    await button.scrollIntoViewIfNeeded();
    const box = await button.boundingBox();
    await page.mouse.move(box.x + 8, box.y + 8);
    await page.mouse.down();
    const colours = await button.evaluate((el) => ({ span: getComputedStyle(el.querySelector('.ds-press-ripple')).backgroundColor, text: getComputedStyle(el).color }));
    await page.mouse.up();
    return colours;
  };
  const tone = await ink('#tone-error');
  expect(tone.span).toBe(tone.text);
  expect((await ink('#hook')).span).toBe('rgb(1, 2, 3)');
});

test('keyboard: Enter and Space ripple from the centre, a link only on Enter; nothing on a blocked or opted-out host', async ({ page }) => {
  await open(page);
  const centred = async (locator) => {
    const [span, centre] = await locator.evaluate((el) => {
      const ripple = el.querySelector('.ds-press-ripple');
      return [[parseFloat(ripple.style.getPropertyValue('--ds-ripple-x')), parseFloat(ripple.style.getPropertyValue('--ds-ripple-y'))], [el.clientWidth / 2, el.clientHeight / 2]];
    });
    expect(span[0]).toBeCloseTo(centre[0], 1);
    expect(span[1]).toBeCloseTo(centre[1], 1);
  };
  const button = page.locator('#h-btn');
  for (const key of ['Enter', 'Space']) {
    await button.focus();
    await page.keyboard.down(key);
    await centred(button);
    await page.keyboard.up(key);
    await expect.poll(() => button.locator('.ds-press-ripple').count(), { timeout: 3000 }).toBe(0);
  }
  // A link stands for its row: Enter ripples the row, and an <a> never takes Space.
  const action = page.locator('#h-list .ds-list__action');
  await action.focus();
  await page.keyboard.down('Enter');
  expect(await page.locator('#h-list > .ds-press-ripple').count()).toBe(1);
  await page.keyboard.up('Enter');
  await expect.poll(() => page.locator('#h-list > .ds-press-ripple').count(), { timeout: 3000 }).toBe(0);
  await page.evaluate(() => { if (location.hash) history.replaceState(null, '', location.pathname); });
  const link = page.locator('#link');
  await link.focus();
  await page.keyboard.down('Space');
  expect(await link.locator('.ds-press-ripple').count()).toBe(0);
  await page.keyboard.up('Space');
  for (const id of ['#b-btn-aria', '#b-pressable', '#off']) {
    await page.locator(id).focus();
    await page.keyboard.down('Enter');
    expect(await page.locator(`${id} .ds-press-ripple`).count(), id).toBe(0);
    await page.keyboard.up('Enter');
  }
});

test('names: the span adds nothing to the host\'s name and no stop to the tab order', async ({ page }) => {
  await open(page);
  const button = page.getByRole('button', { name: 'Export', exact: true });
  await button.focus();
  await page.keyboard.down('Enter');
  await expect(button).toHaveAccessibleName('Export');
  const span = await button.evaluate((el) => {
    const ripple = el.querySelector('.ds-press-ripple');
    return { hidden: ripple.getAttribute('aria-hidden'), keep: ripple.hasAttribute('data-ds-keep'), tag: ripple.tagName, tabindex: ripple.getAttribute('tabindex') };
  });
  expect(span).toEqual({ hidden: 'true', keep: true, tag: 'SPAN', tabindex: null });
  await page.keyboard.up('Enter');
});

test('the handle: attach() is idempotent, destroy() takes the class back, detach() is its alias until 3.0 ships', async ({ page }) => {
  await open(page, { attach: false });
  const state = await page.evaluate(() => {
    const root = document.documentElement;
    const first = DS.ripple.attach(document);
    const same = DS.ripple.attach(document) === first;
    const on = root.classList.contains('ds-ripples');
    first.detach();
    const off = root.classList.contains('ds-ripples');
    const second = DS.ripple.attach(document);
    const fresh = second !== first;
    second.destroy();
    return { same, on, off, fresh, end: root.classList.contains('ds-ripples') };
  });
  expect(state).toEqual({ same: true, on: true, off: false, fresh: true, end: false });
});

test.describe('the cascade: ripple.css in a later layer than every component', () => {
  /** What the cascade decides for each host, pressed (.ds-pressed, no ripple needed), and with a ripple inside. */
  const read = (page) => page.evaluate(() => [...document.querySelectorAll('[data-host]')].map((host) => {
    const surface = host.dataset.surface ? host.querySelector(host.dataset.surface) : host;
    host.classList.add('ds-pressed');
    const layer = 'noLayer' in host.dataset ? null : getComputedStyle(surface, '::before').opacity;
    const rowLayer = 'row' in host.dataset ? getComputedStyle(host).getPropertyValue('--ds-table-row-layer') : null;
    host.classList.remove('ds-pressed');
    return { id: host.id, layer, rowLayer, position: getComputedStyle(surface).position };
  }));

  /** The file as dist/ ships it, in ds.utilities: after every component, whatever the specificity. */
  const later = async (page) => {
    const css = await page.evaluate(() => fetch('/dist/css/components/ripple.css').then((response) => response.text()));
    expect(css).toContain('@layer ds.components {');
    await page.addStyleTag({ content: css.replace('@layer ds.components {', '@layer ds.utilities {') });
  };

  test('every host keeps its pressed layer and its own position; blocked hosts stay unpressed', async ({ page }) => {
    await open(page);
    await noTransitions(page);
    const before = await read(page);
    await later(page);
    expect(await read(page)).toEqual(before);
    // A blocked host's layer is 0 either way, and the combobox toggle is still absolute.
    const byId = Object.fromEntries(before.map((entry) => [entry.id, entry]));
    for (const id of Object.keys(byId).filter((name) => name.startsWith('b-'))) expect(Number(byId[id].layer), id).toBe(0);
    expect(byId['h-combo'].position).toBe('absolute');
  });

  test('a cell that holds its row\'s ripple keeps its own overflow, in either cascade', async ({ page }) => {
    await open(page);
    const row = page.locator('#h-row');
    const cell = page.locator('#h-cell');
    const pressAndRead = async () => {
      await row.scrollIntoViewIfNeeded();
      const box = await row.locator('td').last().boundingBox();
      await page.mouse.move(box.x + 8, box.y + 8);
      await page.mouse.down();
      const state = await cell.evaluate((el) => ({ overflow: getComputedStyle(el).overflowX, ripple: Boolean(el.parentElement.querySelector('.ds-press-ripple')), isolation: getComputedStyle(el.parentElement).isolation }));
      await page.mouse.up();
      await expect.poll(() => row.locator('.ds-press-ripple').count(), { timeout: 3000 }).toBe(0);
      await page.evaluate(() => { if (location.hash) history.replaceState(null, '', location.pathname); });
      return state;
    };
    expect(await cell.evaluate((el) => getComputedStyle(el).overflowX)).toBe('hidden');
    expect(await pressAndRead()).toEqual({ overflow: 'hidden', ripple: true, isolation: 'isolate' });
    await later(page);
    expect(await pressAndRead()).toEqual({ overflow: 'hidden', ripple: true, isolation: 'isolate' });
  });
});

test('forced colours: no ripple, on any host', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  for (const id of ['#h-btn', '#h-row']) {
    const host = page.locator(id);
    await host.scrollIntoViewIfNeeded();
    const box = await (id === '#h-row' ? host.locator('td').last() : host).boundingBox();
    await page.mouse.move(box.x + 8, box.y + 8);
    await page.mouse.down();
    const spans = host.locator('.ds-press-ripple');
    await expect(spans.first()).toBeAttached();
    expect(await spans.first().evaluate((span) => getComputedStyle(span).display), id).toBe('none');
    await page.mouse.up();
    await expect.poll(() => spans.count(), { timeout: 3000 }).toBe(0);
    await page.evaluate(() => { if (location.hash) history.replaceState(null, '', location.pathname); });
  }
});
