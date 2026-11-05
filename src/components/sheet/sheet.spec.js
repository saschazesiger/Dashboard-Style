/**
 * The side sheet on the options model (3.0): density on its padding and head,
 * shape on its radius, what size and touch reach, the declarative trigger, the
 * keyboard, names and forced colours. The 2.x behaviour stays in
 * test/browser/overlay.spec.js. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/test/browser/fixtures/component.html?c=sheet');
  await ready(page);
  await page.mouse.move(1, 1);
}

/** The panel of a sheet made for the test, inside a region of `around`. */
const measure = (page, around = '', wide = false) => page.evaluate(async ({ around, wide }) => {
  const region = document.createElement('div');
  region.className = around;
  region.innerHTML = `<dialog class="ds-sheet" aria-label="Probe"><div class="ds-sheet__backdrop"></div><section class="ds-sheet__panel${wide ? ' ds-sheet__panel--wide' : ''}"><div class="ds-sheet__head"><h2 class="ds-sheet__title">Probe</h2><button class="ds-btn" type="button">Close</button></div><div class="ds-sheet__body" tabindex="0">Text</div><div class="ds-sheet__foot"><button class="ds-btn" type="button">OK</button></div></section></dialog>`;
  document.querySelector('#fx-component').append(region);
  const sheet = region.querySelector('dialog');
  await DS.overlay.open(sheet);
  const part = (selector) => sheet.querySelector(selector);
  const out = {
    width: part('.ds-sheet__panel').getBoundingClientRect().width,
    radius: parseFloat(getComputedStyle(part('.ds-sheet__panel')).borderTopLeftRadius),
    head: part('.ds-sheet__head').getBoundingClientRect().height,
    body: parseFloat(getComputedStyle(part('.ds-sheet__body')).paddingLeft),
    foot: parseFloat(getComputedStyle(part('.ds-sheet__foot')).paddingLeft),
    footTop: parseFloat(getComputedStyle(part('.ds-sheet__foot')).paddingTop),
    button: part('.ds-sheet__foot .ds-btn').getBoundingClientRect().height,
  };
  await DS.overlay.close(sheet);
  region.remove();
  return out;
}, { around, wide });

test('its width, 560px and 720px; density changes padding and head, not the width', async ({ page }) => {
  await open(page);
  const plain = await measure(page);
  expect(plain.width).toBeCloseTo(560, 0);
  expect((await measure(page, '', true)).width).toBeCloseTo(720, 0);
  expect(plain.head).toBeCloseTo(64, 0);
  expect(plain.body).toBeCloseTo(24, 0);
  expect(plain.foot).toBeCloseTo(24, 0);
  const compact = await measure(page, 'ds-density-compact');
  expect(compact.width).toBeCloseTo(560, 0);
  expect(compact.body).toBeCloseTo(22, 0);
  expect(compact.foot).toBeCloseTo(22, 0);
  expect(compact.footTop).toBeCloseTo(plain.footTop - 2, 0);
  expect(compact.head).toBeLessThan(plain.head);
  const tight = await measure(page, 'ds-density-tight');
  expect(tight.body).toBeCloseTo(18, 0);
});

test('the shape multiplies the leading radius; size and touch reach only the controls inside', async ({ page }) => {
  await open(page);
  const plain = await measure(page);
  expect(plain.radius).toBeGreaterThan(0);
  expect((await measure(page, 'ds-shape-square')).radius).toBe(0);
  expect((await measure(page, 'ds-shape-round')).radius).toBeCloseTo(plain.radius * 1.5, 1);
  const small = await measure(page, 'ds-sm');
  expect(small.width).toBeCloseTo(560, 0);
  expect(small.button).toBeCloseTo(plain.button - 8, 0);
  expect((await measure(page, 'ds-touch ds-density-tight')).button).toBeGreaterThanOrEqual(48);
});

test('the phone: the whole width, square, from the bottom', async ({ page }) => {
  await open(page);
  await page.setViewportSize({ width: 390, height: 800 });
  const phone = await measure(page);
  expect(phone.width).toBeCloseTo(390, 0);
  expect(phone.radius).toBe(0);
});

test('data-ds-open and data-ds-close; the keyboard; Escape gives focus back; names and roles', async ({ page }) => {
  await open(page);
  const trigger = page.getByRole('button', { name: 'Open a sheet' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const sheet = page.getByRole('dialog', { name: 'LAPTOP-0042' }).first();
  await expect(sheet).toBeVisible();
  await settle(page);
  const inside = () => page.evaluate(() => Boolean(document.activeElement?.closest('dialog[open]')));
  expect(await inside(), 'focus is in the sheet').toBe(true);
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await settle(page);
  await sheet.getByRole('button', { name: 'Close' }).click();
  await settle(page);
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('busy: data-ds-busy keeps it open; DS.sheet holds open, close and the controller', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(async () => {
    const sheet = document.querySelector('.ds-sheet');
    const control = DS.sheet.create(sheet);
    const before = control.get();
    await DS.sheet.open(sheet);
    const opened = control.get();
    sheet.setAttribute('data-ds-busy', '');
    sheet.dispatchEvent(new Event('cancel', { cancelable: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    const busy = control.get();
    sheet.removeAttribute('data-ds-busy');
    await DS.sheet.close(sheet);
    return { before, opened, busy, after: control.get() };
  });
  expect(seen).toEqual({ before: false, opened: true, busy: true, after: false });
});

test('forced colours: the panel keeps its edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await page.getByRole('button', { name: 'Open a sheet' }).click();
  await settle(page);
  const edge = await page.locator('dialog[open] .ds-sheet__panel').evaluate((el) => getComputedStyle(el).outlineColor);
  expect(edge).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
  await page.keyboard.press('Escape');
});

test('push: the content narrows while the panel opens beside it, nothing is inert, focus moves in and back', async ({ page }) => {
  await open(page);
  const layout = page.locator('[data-demo="push-layout"]');
  const main = layout.locator('.ds-sheet__main');
  const before = (await main.boundingBox()).width;
  const trigger = page.getByRole('button', { name: 'Filters' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const panel = layout.locator('.ds-sheet__panel--push');
  await expect(panel).toHaveAttribute('data-state', 'open');
  await settle(page);
  const after = (await main.boundingBox()).width;
  const width = (await panel.boundingBox()).width;
  expect(width).toBeCloseTo(400, 0);
  expect(after).toBeCloseTo(before - 400, 0);
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(panel.getByRole('button', { name: 'Close' }), 'focus moved into the panel').toBeFocused();
  expect(await page.evaluate(() => document.querySelectorAll('[inert]').length), 'non-modal: nothing inert').toBe(0);
  await expect(page.getByRole('region', { name: 'Filters' }), 'a named region').toBeVisible();
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect((await main.boundingBox()).width).toBeCloseTo(before, 0);
});

test('inspector: a row shows its detail beside the list; focus stays on the row; another row swaps the content', async ({ page }) => {
  await open(page);
  const list = page.locator('[data-demo="inspector-list"]');
  const inspector = page.locator('[data-demo="inspector"]');
  const first = list.getByRole('button', { name: 'LAPTOP-0042' });
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(inspector).toHaveAttribute('data-state', 'open');
  await expect(first, 'focus stays in the list').toBeFocused();
  await expect(inspector.getByRole('heading', { name: 'LAPTOP-0042' })).toBeVisible();
  const second = list.getByRole('button', { name: 'LAPTOP-0043' });
  await second.click();
  await expect(inspector.getByRole('heading', { name: 'LAPTOP-0043' })).toBeVisible();
  await expect(inspector.locator('dd').first()).toHaveText('Alan Turing');
  await expect(inspector).toHaveAttribute('data-state', 'open');
  expect(await page.evaluate(() => document.querySelectorAll('[inert]').length)).toBe(0);
  await expect(page.locator('[data-ds-key="laptop-0043"]')).toHaveAttribute('aria-current', 'true');
});

test('resizing: a separator with its values; the keys and a drag change the width; it is remembered; a double click resets', async ({ page }) => {
  await open(page);
  await page.evaluate(() => localStorage.removeItem('ds:sheet:sg-test-inspector'));
  await page.evaluate(() => {
    const inspector = document.querySelector('[data-demo="inspector"]');
    DS.core.destroy(inspector);
    inspector.setAttribute('data-ds-sheet-remember', 'sg-test-inspector');
    DS.sheet.resizable(inspector);
  });
  await page.locator('[data-demo="inspector-list"]').getByRole('button', { name: 'LAPTOP-0042' }).click();
  const inspector = page.locator('[data-demo="inspector"]');
  await settle(page);
  const handle = inspector.getByRole('separator', { name: 'Resize the details' });
  await expect(handle).toHaveAttribute('aria-orientation', 'vertical');
  await expect(handle).toHaveAttribute('aria-controls', await inspector.getAttribute('id'));
  await expect(handle).toHaveAttribute('aria-valuemin', '280');
  await expect(handle).toHaveAttribute('aria-valuenow', '400');
  const width = async () => Math.round((await inspector.boundingBox()).width);
  await handle.focus();
  await page.keyboard.press('ArrowLeft');
  expect(await width(), 'ArrowLeft moves the edge left: wider').toBe(416);
  await page.keyboard.press('Shift+ArrowRight');
  expect(await width()).toBe(352);
  await page.keyboard.press('Home');
  expect(await width()).toBe(280);
  await expect(handle).toHaveAttribute('aria-valuenow', '280');
  const box = await handle.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2, { steps: 6 });
  await page.mouse.up();
  expect(await width()).toBeCloseTo(400, -1);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ds:sheet:sg-test-inspector')));
  expect(stored).toBeCloseTo(400, -1);
  // Remembered: a new controller (a reload) takes the width back.
  const again = await page.evaluate(() => {
    const inspector = document.querySelector('[data-demo="inspector"]');
    DS.sheet.resizable(inspector).destroy();
    inspector.style.removeProperty('--ds-sheet-size');
    return DS.sheet.resizable(inspector).get();
  });
  expect(again).toBeCloseTo(400, -1);
  await handle.dblclick();
  expect(await width()).toBe(400);
  expect(await page.evaluate(() => localStorage.getItem('ds:sheet:sg-test-inspector'))).toBe(null);
});

test('the modal sheet resizes from its left edge; no separator on a phone', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Open a resizable sheet' }).click();
  await settle(page);
  const panel = page.locator('dialog[open] .ds-sheet__panel');
  const handle = panel.getByRole('separator', { name: 'Resize the sheet' });
  await expect(handle).toHaveAttribute('aria-valuenow', '560');
  await handle.focus();
  await page.keyboard.press('ArrowLeft');
  expect(Math.round((await panel.boundingBox()).width)).toBe(576);
  const box = await handle.boundingBox();
  expect(box.x + box.width / 2).toBeCloseTo(1280 - 576, 0);
  await page.keyboard.press('Escape');
  await settle(page);
  await page.setViewportSize({ width: 390, height: 800 });
  await page.getByRole('button', { name: 'Open a resizable sheet' }).click();
  await settle(page);
  await expect(page.locator('dialog[open] .ds-sheet__resize')).toBeHidden();
  expect(Math.round((await page.locator('dialog[open] .ds-sheet__panel').boundingBox()).width)).toBe(390);
});

test('a docked panel lies over the content in a narrow layout, the whole width at 480px and below', async ({ page }) => {
  await open(page);
  const layout = page.locator('[data-demo="push-layout"]');
  await layout.evaluate((el) => { el.style.inlineSize = '600px'; });
  await page.getByRole('button', { name: 'Filters' }).click();
  await settle(page);
  const panel = layout.locator('.ds-sheet__panel--push');
  expect(await panel.evaluate((el) => getComputedStyle(el).position)).toBe('absolute');
  expect(Math.round((await layout.locator('.ds-sheet__main').boundingBox()).width), 'the list keeps its width').toBe(598);
  await page.keyboard.press('Escape');
  await settle(page);
  await layout.evaluate((el) => { el.style.inlineSize = '360px'; });
  await page.getByRole('button', { name: 'Filters' }).click();
  await settle(page);
  expect(Math.round((await panel.boundingBox()).width)).toBe(358);
});

test('forced colours: the separator\'s pill in system colours', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await page.locator('[data-demo="inspector-list"]').getByRole('button', { name: 'LAPTOP-0042' }).click();
  await settle(page);
  const pill = await page.locator('[data-demo="inspector"] .ds-sheet__resize').evaluate((el) => ({ bg: getComputedStyle(el, '::before').backgroundColor, opacity: getComputedStyle(el, '::before').opacity }));
  expect(pill.opacity).toBe('1');
  expect(pill.bg).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
});
