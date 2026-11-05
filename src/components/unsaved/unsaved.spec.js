/**
 * Unsaved-changes guard (DS.unsaved): dirty tracking with the count and the
 * changed dots, the save bar shown and hidden, save through ds:save with
 * waitUntil (success and failure), Ctrl or Command+S, discard,
 * beforeunload only while dirty, navigate() and [data-ds-unsaved-link],
 * the options and forced colours. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=unsaved');
  await ready(page);
  await page.mouse.move(1, 1);
}

/** A guarded form in a small view, with its bar; ds: events land on window.events. */
async function make(page, { attributes = '', around = '' } = {}) {
  await page.evaluate(({ attributes, around }) => {
    document.querySelector('[data-test-region]')?.remove();
    const region = document.createElement('div');
    region.setAttribute('data-test-region', '');
    region.className = around;
    region.innerHTML = `<div class="ds-view" style="block-size: 360px; view-transition-name: none; scroll-timeline: none;"><div class="ds-content">
      <form class="ds-form" data-ds-unsaved data-test-form aria-label="Device" ${attributes}>
        <div class="ds-field"><label class="ds-field__label" for="t-name">Device name</label><input class="ds-input" id="t-name" name="name" value="LAPTOP-0042"></div>
        <div class="ds-field"><label class="ds-field__label" for="t-room">Room</label><select class="ds-input" id="t-room" name="room"><option>Lab</option><option>Store room</option></select></div>
        <fieldset class="ds-field"><legend class="ds-field__label">Status</legend>
          <label class="ds-check"><input type="radio" name="status" value="active" checked><span>Active</span></label>
          <label class="ds-check"><input type="radio" name="status" value="repair"><span>In repair</span></label></fieldset>
        <div class="ds-field"><label class="ds-field__label" for="t-skip">Search</label><input class="ds-input" id="t-skip" name="q" data-ds-unsaved-ignore></div>
      </form></div>
      <div class="ds-savebar"><div class="ds-savebar__bar ds-presence" role="region" aria-label="Unsaved changes" hidden>
        <p class="ds-savebar__text ds-unsaved__count" data-ds-unsaved-count></p><div class="ds-savebar__actions">
        <button class="ds-btn ds-btn--text" type="button" data-ds-unsaved-discard>Discard</button>
        <button class="ds-btn ds-btn--filled" type="button" data-ds-unsaved-save>Save</button></div></div></div></div>
      <nav data-ds-unsaved-link><a href="#left" data-test-link>Devices</a></nav>`;
    document.querySelector('#fx-component').prepend(region);
    window.events = [];
    const form = region.querySelector('form');
    for (const type of ['change', 'save', 'saved', 'discard', 'error']) form.addEventListener(`ds:${type}`, (event) => window.events.push([type, event.detail?.count ?? null]));
    form.addEventListener('submit', (event) => event.preventDefault());
  }, { attributes, around });
  await page.waitForFunction(() => DS.get(document.querySelector('[data-test-form]'), 'unsaved'));
  return page.locator('[data-test-form]');
}

const guard = (page, method, ...args) => page.evaluate(({ method, args }) => {
  const api = DS.get(document.querySelector('[data-test-form]'), 'unsaved');
  const result = api[method](...args);
  return result && typeof result.then === 'function' ? result : JSON.parse(JSON.stringify(result ?? null));
}, { method, args });

test('a change shows the bar with the count and the field\'s dot; undoing it by hand hides both', async ({ page }) => {
  await open(page);
  const form = await make(page);
  const bar = page.getByRole('region', { name: 'Unsaved changes' });
  await expect(bar).toBeHidden();
  const name = form.getByRole('textbox', { name: 'Device name' });
  await name.fill('LAPTOP-0043');
  await expect(bar).toBeVisible();
  await expect(bar.locator('[data-ds-unsaved-count]')).toHaveText('1 unsaved change');
  await expect(form.locator('.ds-field').first()).toHaveClass(/ds-field--changed/);
  await expect(name).toHaveAccessibleName('Device name (changed)');
  await expect(form).toHaveAttribute('data-ds-dirty', '');
  await form.getByRole('radio', { name: 'In repair' }).check();
  await form.getByRole('combobox', { name: 'Room' }).selectOption('Store room');
  await expect(bar.locator('[data-ds-unsaved-count]')).toHaveText('3 unsaved changes');
  await expect(form.locator('fieldset.ds-field')).toHaveClass(/ds-field--changed/);
  // An ignored field never counts.
  await form.getByRole('textbox', { name: 'Search' }).fill('printer');
  expect(await guard(page, 'get')).toEqual({ dirty: true, count: 3, changed: ['name[0]', 'room[0]', 'status'] });
  await name.fill('LAPTOP-0042');
  await form.getByRole('radio', { name: 'Active' }).check();
  await form.getByRole('combobox', { name: 'Room' }).selectOption('Lab');
  await expect(bar).toBeHidden();
  await expect(form.locator('.ds-field--changed')).toHaveCount(0);
  await expect(form).not.toHaveAttribute('data-ds-dirty', '');
  expect(await page.evaluate(() => window.events.filter(([type]) => type === 'change').map(([, count]) => count))).toEqual([1, 2, 3, 2, 1, 0]);
});

test('Save hands the work to waitUntil: busy, then the new baseline and "Changes saved."', async ({ page }) => {
  await open(page);
  const form = await make(page);
  await page.evaluate(() => {
    document.querySelector('[data-test-form]').addEventListener('ds:save', (event) => {
      event.detail.waitUntil(new Promise((resolve) => { window.finish = resolve; }));
    });
  });
  await form.getByRole('textbox', { name: 'Device name' }).fill('LAPTOP-0043');
  const save = page.getByRole('button', { name: 'Save' });
  await save.click();
  await expect(save).toHaveAttribute('aria-busy', 'true');
  await page.evaluate(() => window.finish());
  await expect(page.getByRole('region', { name: 'Unsaved changes' })).toBeHidden();
  await expect.poll(() => page.evaluate(() => document.body.textContent.includes('Changes saved.'))).toBe(true);
  expect(await guard(page, 'get')).toEqual({ dirty: false, count: 0, changed: [] });
  // The saved value is the new baseline.
  await form.getByRole('textbox', { name: 'Device name' }).fill('LAPTOP-0042');
  expect(await guard(page, 'get')).toMatchObject({ dirty: true, count: 1 });
  expect(await page.evaluate(() => window.events.map(([type]) => type))).toContain('saved');
});

test('a failed save keeps the changes and says so; ds:save can refuse', async ({ page }) => {
  await open(page);
  const form = await make(page);
  await page.evaluate(() => {
    window.refuse = false;
    document.querySelector('[data-test-form]').addEventListener('ds:save', (event) => {
      if (window.refuse) event.preventDefault();
      else event.detail.waitUntil(Promise.reject(new Error('offline')));
    });
  });
  await form.getByRole('textbox', { name: 'Device name' }).fill('LAPTOP-0043');
  expect(await guard(page, 'save')).toBe(false);
  await expect.poll(() => page.evaluate(() => document.body.textContent.includes('Not saved. Your changes are still here.'))).toBe(true);
  expect(await guard(page, 'get')).toMatchObject({ dirty: true, count: 1 });
  await expect(page.getByRole('region', { name: 'Unsaved changes' })).toBeVisible();
  expect(await page.evaluate(() => window.events.map(([type]) => type))).toContain('error');
  await page.evaluate(() => { window.refuse = true; });
  expect(await guard(page, 'save')).toBe(false);
});

test('Ctrl or Command+S saves from a field; without waitUntil the form is submitted', async ({ page }) => {
  await open(page);
  const form = await make(page);
  await page.evaluate(() => {
    window.submits = 0;
    document.querySelector('[data-test-form]').addEventListener('submit', () => { window.submits += 1; });
  });
  const name = form.getByRole('textbox', { name: 'Device name' });
  await name.fill('LAPTOP-0043');
  await name.press('ControlOrMeta+s');
  await expect.poll(() => page.evaluate(() => window.submits)).toBe(1);
  expect(await page.evaluate(() => window.events.filter(([type]) => type === 'save').length)).toBe(1);
  // Still dirty: the page commits once it saved.
  await guard(page, 'commit');
  expect(await guard(page, 'get')).toMatchObject({ dirty: false });
  // Nothing to save: the key is taken, nothing is sent.
  await name.press('ControlOrMeta+s');
  expect(await page.evaluate(() => window.events.filter(([type]) => type === 'save').length)).toBe(1);
  expect(await page.evaluate(() => DS.hotkeys.list().flatMap((group) => group.items.map((item) => item.description)))).toContain('Save changes');
});

test('Discard puts every field back, hides the bar and keeps the focus in the form', async ({ page }) => {
  await open(page);
  const form = await make(page);
  await form.getByRole('textbox', { name: 'Device name' }).fill('LAPTOP-0043');
  await form.getByRole('radio', { name: 'In repair' }).check();
  await page.getByRole('button', { name: 'Discard' }).focus();
  await page.keyboard.press('Enter');
  await expect(form.getByRole('textbox', { name: 'Device name' })).toHaveValue('LAPTOP-0042');
  await expect(form.getByRole('radio', { name: 'Active' })).toBeChecked();
  await expect(page.getByRole('region', { name: 'Unsaved changes' })).toBeHidden();
  await expect(form.getByRole('textbox', { name: 'Device name' })).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.body.textContent.includes('Changes discarded.'))).toBe(true);
  expect(await page.evaluate(() => window.events.map(([type]) => type))).toContain('discard');
});

test('beforeunload asks only while something is unsaved', async ({ page }) => {
  await open(page);
  const form = await make(page);
  const asks = () => page.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(await asks()).toBe(false);
  await form.getByRole('textbox', { name: 'Device name' }).fill('LAPTOP-0043');
  expect(await asks()).toBe(true);
  await guard(page, 'set', false);
  expect(await asks()).toBe(false);
  await guard(page, 'set', true);
  expect(await asks()).toBe(true);
  expect(await page.evaluate(() => DS.unsaved.isDirty())).toBe(true);
});

test('navigate() and a guarded link ask first; Keep editing stays, Discard changes goes', async ({ page }) => {
  await open(page);
  const form = await make(page);
  expect(await page.evaluate(() => DS.unsaved.navigate(() => { window.went = 'clean'; }))).toBe(true);
  expect(await page.evaluate(() => window.went)).toBe('clean');
  await form.getByRole('textbox', { name: 'Device name' }).fill('LAPTOP-0043');
  await page.locator('[data-test-link]').click();
  const dialog = page.getByRole('alertdialog', { name: 'Leave without saving?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Keep editing' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => location.hash)).toBe('');
  await expect(page.locator('[data-test-link]')).toBeFocused();
  const went = page.evaluate(() => DS.unsaved.navigate(() => { window.went = 'dirty'; }));
  await dialog.getByRole('button', { name: 'Discard changes' }).click();
  expect(await went).toBe(true);
  expect(await page.evaluate(() => window.went)).toBe('dirty');
  // Once it went, the page may unload without the browser's question.
  expect(await page.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  })).toBe(false);
});

test('options: data-ds-unsaved-marks="off" leaves the fields alone; hotkey off takes no key', async ({ page }) => {
  await open(page);
  const form = await make(page, { attributes: 'data-ds-unsaved-marks="off" data-ds-unsaved-hotkey="off"' });
  const name = form.getByRole('textbox', { name: 'Device name' });
  await name.fill('LAPTOP-0043');
  await expect(page.getByRole('region', { name: 'Unsaved changes' })).toBeVisible();
  await expect(form.locator('.ds-field--changed')).toHaveCount(0);
  await name.press('ControlOrMeta+s');
  expect(await page.evaluate(() => window.events.filter(([type]) => type === 'save').length)).toBe(0);
});

test('touch: the bar\'s buttons take 48px; at 360px nothing overflows', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await open(page);
  const form = await make(page, { around: 'ds-touch' });
  await form.getByRole('textbox', { name: 'Device name' }).fill('LAPTOP-0043');
  const save = page.getByRole('button', { name: 'Save' });
  const bar = page.getByRole('region', { name: 'Unsaved changes' });
  await expect(save).toBeVisible();
  await bar.evaluate((node) => DS.motion.settled(node, { transitions: true }));
  expect((await save.boundingBox()).height).toBeGreaterThanOrEqual(48);
  const box = await bar.boundingBox();
  expect(box.x + box.width).toBeLessThanOrEqual(360);
});

test('forced colours: the changed dot stays visible', async ({ page }) => {
  await open(page);
  await page.emulateMedia({ forcedColors: 'active' });
  const form = await make(page);
  await form.getByRole('textbox', { name: 'Device name' }).fill('LAPTOP-0043');
  const dot = await form.locator('.ds-field--changed > .ds-field__label').evaluate((label) => getComputedStyle(label, '::after').backgroundColor);
  expect(dot).not.toBe('rgba(0, 0, 0, 0)');
});

test('the demo renders without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page);
  await expect(page.locator('[data-demo="form"]')).toHaveAttribute('data-ds-unsaved', '');
  await page.locator('[data-demo="form"] input[name="owner"]').fill('Grace Hopper');
  await expect(page.locator('[data-demo="view"] [data-ds-unsaved-count]')).toHaveText('1 unsaved change');
  expect(errors).toEqual([]);
});
