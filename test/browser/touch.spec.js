/**
 * Touch density (CT-5): .ds-touch on the theme root sets every target hook
 * to --ds-touch-target (48px). The controls fixture rendered under it: every
 * interactive box is at least 48px: buttons, chips, switches, checks,
 * drawer items, fields, menu items, combobox options, the snackbar close
 * button, disclosure summaries, tabs (menu, list and snackbar opened
 * through DS.overlay) and the top bar's brand link (the shell fixture).
 */
import { test, expect } from './base-test.js';
import { ready, settle } from './helpers/motion.js';

const TARGET = 48;

async function open(page, { touch = true } = {}) {
  await page.goto('/test/browser/fixtures/controls.html');
  await ready(page);
  if (touch) await page.evaluate(() => document.querySelector('.ds-theme').classList.add('ds-touch'));
  await page.mouse.move(1, 1);
  await settle(page);
}

/** Like boxes(), but at least one must be rendered. */
async function present(page, selector) {
  const found = await boxes(page, selector);
  expect(found.length, `${selector}: add it to controls.html`).toBeGreaterThan(0);
  return found;
}

/** Width and height of every element matching `selector` (rendered ones only), with a label. */
const boxes = (page, selector) => page.$$eval(selector, (elements) => elements
  .filter((el) => el.getClientRects().length)
  .map((el) => {
    const rect = el.getBoundingClientRect();
    return { name: `${el.className} ${el.id || el.textContent.trim().slice(0, 24)}`, width: rect.width, height: rect.height };
  }));

test('every button is at least 48px tall, icon buttons 48px round', async ({ page }) => {
  await open(page);
  const buttons = await boxes(page, '.ds-btn');
  expect(buttons.length).toBeGreaterThan(8);
  for (const box of buttons) expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
  for (const box of await present(page, '.ds-btn--icon')) expect(box.width, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('chips, switches and drawer items take the touch target', async ({ page }) => {
  await open(page);
  const groups = [['.ds-chip__body', 'height'], ['.ds-switch', 'height'], ['.ds-drawer__item', 'height']];
  for (const [selector, side] of groups) {
    const found = await boxes(page, selector);
    expect(found.length, selector).toBeGreaterThan(0);
    for (const box of found) expect(box[side], box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
  }
  // The switch halo and the halo of checkboxes and radios span the target.
  const halo = await page.$eval('.ds-switch__track', (el) => parseFloat(getComputedStyle(el, '::before').width));
  expect(halo).toBe(TARGET);
  const spread = await page.$eval('.ds-check input', (el) => {
    const parts = getComputedStyle(el).boxShadow.match(/(-?\d*\.?\d+)px/g) || [];
    return { spread: parseFloat(parts[3]), size: el.getBoundingClientRect().width };
  });
  expect(spread.size + 2 * spread.spread).toBeCloseTo(TARGET, 0);
});

test('fields take the input type role under .ds-touch (no zoom on focus in iOS)', async ({ page }) => {
  await open(page);
  const size = await page.$eval('.ds-input', (el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeGreaterThanOrEqual(16);
});

test('without .ds-touch nothing changes (opt-in, never automatic)', async ({ page }) => {
  await open(page, { touch: false });
  const height = await page.$eval('#btn-outlined', (el) => el.getBoundingClientRect().height);
  expect(height).toBe(36);
  expect(await page.$eval('#btn-sm', (el) => el.getBoundingClientRect().height)).toBe(32);
});

test('fields are 48px tall (--ds-input-height)', async ({ page }) => {
  await open(page);
  for (const box of await present(page, '.ds-input')) expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('check and radio rows are 48px tall (--ds-check-height)', async ({ page }) => {
  await open(page);
  for (const box of await present(page, '.ds-check')) expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('combobox options are 48px tall (--ds-combo-option-height)', async ({ page }) => {
  await open(page);
  await page.evaluate(() => DS.overlay.open(document.querySelector('#combo-popup'), { opener: document.querySelector('#combo-input') }));
  await settle(page);
  for (const box of await present(page, '.ds-combo__option')) expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('menu items are 48px tall (--ds-menu-item-height)', async ({ page }) => {
  await open(page);
  await page.evaluate(() => DS.overlay.open(document.querySelector('#menu'), { opener: document.querySelector('#menu-trigger') }));
  await settle(page);
  for (const box of await present(page, '.ds-menu__item')) expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('the snackbar close button is 48px (--ds-toast-close-size)', async ({ page }) => {
  await open(page);
  await page.evaluate(() => DS.overlay.toast(document.querySelector('#toasts'), 'Sync failed.', { kind: 'error', persistent: true }));
  await settle(page);
  for (const box of await present(page, '.ds-toast__close')) {
    expect(box.width, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
    expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
  }
});

test('disclosure summaries are 48px tall (--ds-disclosure-height)', async ({ page }) => {
  await open(page);
  for (const box of await present(page, '.ds-disclosure > summary')) expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('tabs are 48px tall (--ds-tabs-height)', async ({ page }) => {
  await open(page);
  for (const box of await present(page, '.ds-tabs [role="tab"]')) expect(box.height, box.name).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('the brand link is a 48px target under .ds-touch, and only there', async ({ page }) => {
  await page.goto('/test/browser/fixtures/shell.html');
  await ready(page);
  const brand = () => page.$eval('.ds-topbar .ds-brand', (el) => { const rect = el.getBoundingClientRect(); return { width: rect.width, height: rect.height }; });
  expect((await brand()).height).toBeLessThan(TARGET);
  await page.evaluate(() => document.querySelector('.ds-theme').classList.add('ds-touch'));
  const box = await brand();
  expect(box.height).toBeGreaterThanOrEqual(TARGET - 0.5);
  expect(box.width).toBeGreaterThanOrEqual(TARGET - 0.5);
});

test('the controls fixture under .ds-touch (settled shot)', async ({ page }) => {
  await open(page);
  await expect(page).toHaveScreenshot('controls-touch.png', { fullPage: true });
});

test('followViewport: a field focused inside a same-origin iframe brings data-ds-keyboard', async ({ page }) => {
  await page.goto('/test/browser/fixtures/controls.html');
  await ready(page);
  const keyboard = await page.evaluate(async () => {
    const frame = document.createElement('iframe');
    frame.srcdoc = '<!doctype html><input type="text" aria-label="Embedded editor">';
    const loaded = new Promise((resolve) => frame.addEventListener('load', resolve, { once: true }));
    document.querySelector('.ds-theme').append(frame);
    await loaded;
    const handle = DS.dom.followViewport(document);
    const frames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await frames();
    // The keyboard: the visual viewport 300px shorter than its tallest height at this width.
    const height = visualViewport.height - 300;
    Object.defineProperty(visualViewport, 'height', { configurable: true, get: () => height });
    frame.contentDocument.querySelector('input').focus();
    visualViewport.dispatchEvent(new Event('resize'));
    await frames();
    const result = {
      focus: document.activeElement === frame,
      attr: document.documentElement.hasAttribute('data-ds-keyboard'),
      inset: document.documentElement.style.getPropertyValue('--ds-keyboard-inset'),
    };
    handle.destroy();
    return result;
  });
  expect(keyboard.focus).toBe(true);
  expect(keyboard.attr).toBe(true);
  expect(keyboard.inset).not.toBe('0px');
});

test('followViewport: a hidden probe reads the bottom inset, a morph keeps it; a panned viewport pans back (2.1.2)', async ({ page }) => {
  await page.goto('/test/browser/fixtures/controls.html');
  await ready(page);
  const result = await page.evaluate(async () => {
    const frames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const before = document.documentElement.scrollHeight;
    const handle = DS.dom.followViewport(document);
    await frames();
    const probes = () => [...document.body.children].filter((child) => child.hasAttribute('data-ds-keep') && child.style.height.startsWith('env('));
    const [probe] = probes();
    const style = getComputedStyle(probe);
    const placed = { count: probes().length, position: style.position, visibility: style.visibility, height: probe.getBoundingClientRect().height, scrollHeight: document.documentElement.scrollHeight === before };
    // A re-render of the body by a morph leaves it in place.
    DS.dom.morphHtml(document.body, document.body.innerHTML.replace(/<div[^>]*data-ds-keep[^>]*><\/div>/g, ''));
    const kept = probes()[0] === probe;
    // The keyboard is up for a field and the browser panned the visual viewport down: the page pans back.
    const field = document.querySelector('input[type="text"], input:not([type])');
    const height = visualViewport.height - 300;
    let offset = 120;
    Object.defineProperty(visualViewport, 'height', { configurable: true, get: () => height });
    Object.defineProperty(visualViewport, 'offsetTop', { configurable: true, get: () => offset });
    const calls = [];
    const pan = Element.prototype.scrollIntoView;
    document.documentElement.scrollIntoView = function (options) {
      calls.push(options);
      pan.call(this, options);
      offset = 0;
    };
    // The window itself has not scrolled (Chrome on Android): scrolling it would move nothing.
    field.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    visualViewport.dispatchEvent(new Event('scroll'));
    await frames();
    handle.destroy();
    delete document.documentElement.scrollIntoView;
    return { placed, kept, calls, gone: probes().length };
  });
  expect(result.placed).toEqual({ count: 1, position: 'fixed', visibility: 'hidden', height: 0, scrollHeight: true });
  expect(result.kept).toBe(true);
  expect(result.calls).toEqual([{ block: 'start', inline: 'nearest', behavior: 'instant' }]);
  expect(result.gone).toBe(0);
});
