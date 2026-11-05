/**
 * Label group: the tags that fit and the "+N" button, its names and states,
 * the popup through DS.overlay (focus in, Escape, focus back, Tab and a
 * pointerdown outside close it), the maximum, measuring again after a
 * re-render and a resize, the button per size, touch and shape, the
 * controller and forced colours. Runs in `fallback` too (the script's
 * placement).
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs'], ['ds-sm'], ['ds-md'], ['ds-lg'], ['ds-xl']];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=labelgroup');
  await ready(page);
}

const card = (page) => page.locator('#fx-component [data-demo="card"] .ds-label-group');

test('the tags that fit stay, the rest wait behind "+N", named with how many in all', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await open(page);
  const group = card(page);
  const more = group.locator('.ds-label-group__more');
  await expect(more).toBeVisible();
  const state = await group.evaluate((el) => {
    const items = [...el.querySelectorAll('.ds-label-group__list > li')];
    const shown = items.filter((li) => !li.hidden);
    const button = el.querySelector('.ds-label-group__more');
    const last = shown.at(-1).getBoundingClientRect();
    return {
      total: items.length,
      shown: shown.length,
      // The shown ones come first and none is cut by the button.
      first: items.slice(0, shown.length).every((li) => !li.hidden),
      fits: last.right <= button.getBoundingClientRect().left + 0.5 && button.getBoundingClientRect().right <= el.getBoundingClientRect().right + 0.5,
      text: button.textContent,
      controller: window.DS.get(el, 'labelgroup').get(),
    };
  });
  expect(state.total).toBe(6);
  expect(state.shown).toBeGreaterThan(0);
  expect(state.shown).toBeLessThan(6);
  expect(state.first).toBe(true);
  expect(state.fits).toBe(true);
  expect(state.text).toBe(`+${6 - state.shown}`);
  expect(state.controller).toEqual({ total: 6, hidden: 6 - state.shown, open: false });
  await expect(more).toHaveAccessibleName(`+${6 - state.shown} more, show all 6`);
  await expect(more).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  // The list is named; the hidden tags are out of the accessibility tree.
  const list = page.locator('#fx-component [data-demo="card"]').getByRole('list', { name: 'Labels of ticket 41' });
  await expect(list.getByRole('listitem')).toHaveCount(state.shown);
  // One tag only: no button.
  await expect(page.locator('#fx-component [data-demo="table"] tr:last-child .ds-label-group__more')).toBeHidden();
});

test('the button opens every tag in a named dialog; Escape closes it and focus goes back', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await open(page);
  const more = card(page).locator('.ds-label-group__more');
  await more.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Labels of ticket 41' });
  await expect(dialog).toBeVisible();
  await expect(more).toHaveAttribute('aria-expanded', 'true');
  await expect(dialog).toBeFocused();
  await expect(dialog.getByRole('listitem')).toHaveCount(6);
  await expect(dialog.locator('.ds-tag').nth(1)).toHaveText('Waiting for parts');
  await settle(page);
  // Placed at the button, inside the window.
  const box = await dialog.boundingBox();
  const at = await more.boundingBox();
  expect(Math.abs(box.y - (at.y + at.height)) <= 8 || Math.abs(box.y + box.height - at.y) <= 8).toBe(true);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390.5);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(more).toBeFocused();
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  // Space opens it too, and a second press of the button closes it.
  await page.keyboard.press('Space');
  await expect(dialog).toBeVisible();
  await more.click();
  await expect(dialog).toBeHidden();
});

test('Tab on from the popup and a pointerdown outside close it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await open(page);
  const more = card(page).locator('.ds-label-group__more');
  const dialog = page.getByRole('dialog', { name: 'Labels of ticket 41' });
  await more.click();
  await expect(dialog).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog).toBeHidden();
  await more.click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(dialog).toBeHidden();
  await expect(more).toHaveAttribute('aria-expanded', 'false');
});

test('data-ds-label-group-max keeps the first n whatever the room', async ({ page }) => {
  await open(page);
  const group = page.locator('#fx-component [data-demo="max"] .ds-label-group');
  await expect(group.locator('.ds-label-group__list > li:not([hidden])')).toHaveCount(2);
  await expect(group.locator('.ds-label-group__more')).toHaveText('+6');
});

test('it counts again after a re-render and when the width changes; ds:change tells', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await open(page);
  const live = page.locator('#fx-component [data-demo="live"]');
  const group = live.locator('.ds-label-group');
  await expect(group.locator('.ds-label-group__more')).toBeHidden();
  const events = page.evaluate(() => new Promise((done) => {
    document.querySelector('[data-demo="live"] .ds-label-group').addEventListener('ds:change', (event) => done(event.detail), { once: true });
  }));
  for (let i = 0; i < 5; i += 1) await live.locator('[data-demo="add"]').click();
  expect((await events).total).toBeGreaterThan(2);
  await expect(group.locator('.ds-label-group__more')).toBeVisible();
  await expect(group.locator('.ds-label-group__list > li')).toHaveCount(7);
  await live.locator('[data-demo="reset"]').click();
  await expect(group.locator('.ds-label-group__more')).toBeHidden();
  await expect(group.locator('.ds-label-group__list > li:not([hidden])')).toHaveCount(2);
  // Wider: more fit.
  const before = await card(page).locator('.ds-label-group__list > li:not([hidden])').count();
  await card(page).evaluate((el) => { el.closest('.ds-card').style.maxInlineSize = 'none'; });
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect.poll(() => card(page).locator('.ds-label-group__list > li:not([hidden])').count()).toBeGreaterThan(before);
});

test('the button as high as a tag per size, at least the touch target, its pill times the shape', async ({ page }) => {
  await open(page);
  const measure = (cls) => page.evaluate((cls) => {
    const holder = document.createElement('div');
    holder.className = cls;
    holder.style.inlineSize = '120px';
    holder.innerHTML = '<div class="ds-label-group"><ul class="ds-label-group__list" aria-label="Probe"><li><span class="ds-tag">Printer</span></li><li><span class="ds-tag">Hardware</span></li><li><span class="ds-tag">Vendor</span></li></ul></div>';
    document.querySelector('#fx-component').append(holder);
    const group = holder.firstElementChild;
    const handle = window.DS.labelgroup.create(group);
    const button = group.querySelector('.ds-label-group__more');
    const tag = group.querySelector('.ds-tag');
    const out = [Math.round(button.getBoundingClientRect().height), Math.round(tag.getBoundingClientRect().height), parseFloat(getComputedStyle(button).borderTopLeftRadius), button.hidden];
    handle.destroy();
    holder.remove();
    return out;
  }, cls);
  let last = 0;
  for (const [size] of SIZES) {
    const [button, tag, , hidden] = await measure(size);
    expect(hidden, size).toBe(false);
    expect(button, size).toBe(tag);
    expect(button, size).toBeGreaterThan(last);
    last = button;
  }
  expect((await measure('ds-md'))[0]).toBe(24);
  expect((await measure('ds-touch'))[0]).toBe(48);
  expect((await measure('ds-shape-square'))[2]).toBe(0);
  expect((await measure(''))[2]).toBe(12);
});

test('the controller: set() opens and closes, on() and destroy() put the list back', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await open(page);
  const out = await page.evaluate(async () => {
    const holder = document.createElement('div');
    holder.style.inlineSize = '140px';
    holder.innerHTML = '<div class="ds-label-group"><ul class="ds-label-group__list" aria-label="Groups"><li id="first"><span class="ds-tag">Printer</span></li><li><span class="ds-tag">Hardware</span></li><li><span class="ds-tag">Vendor</span></li><li><span class="ds-tag">Product</span></li></ul></div>';
    document.querySelector('#fx-component').append(holder);
    const group = holder.firstElementChild;
    const handle = window.DS.labelgroup.create(group, { max: 1 });
    const seen = [];
    const off = handle.on('change', (detail) => seen.push(detail.open));
    handle.set(true);
    const popup = group.querySelector('.ds-label-group__popup');
    const opened = [handle.get(), !popup.hidden, popup.querySelectorAll('[id]').length, popup.getAttribute('aria-label')];
    handle.set(false);
    await window.DS.motion.settled(popup);
    await new Promise((r) => setTimeout(r, 400));
    off();
    handle.set(true);
    handle.destroy();
    const after = [group.querySelectorAll('[hidden]').length, group.querySelector('.ds-label-group__more'), group.querySelector('.ds-label-group__popup')];
    holder.remove();
    return { opened, seen, after };
  });
  expect(out.opened).toEqual([{ total: 4, hidden: 3, open: true }, true, 0, 'Groups']);
  expect(out.seen).toEqual([true, false]);
  expect(out.after).toEqual([0, null, null]);
});

test('forced colours: the popup keeps an edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await page.setViewportSize({ width: 390, height: 900 });
  await open(page);
  await card(page).locator('.ds-label-group__more').click();
  const dialog = page.getByRole('dialog', { name: 'Labels of ticket 41' });
  await expect(dialog).toBeVisible();
  const edge = await dialog.evaluate((el) => [getComputedStyle(el).outlineStyle, getComputedStyle(el).outlineColor]);
  expect(edge[0]).toBe('solid');
  expect(edge[1]).not.toBe('rgba(0, 0, 0, 0)');
});
