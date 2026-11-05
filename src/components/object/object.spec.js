/**
 * The object page (DS.object) on its demo: a section turns into its form
 * and back (focus, names, the announcement, ds:save with the values, Escape
 * cancels), the edit mode of the head (every section, Save all and Cancel),
 * validation keeps a form open, the band (the bar sticks under the head, a
 * jump lands below both), the anchors mark the section being read, a phone
 * width, forced colours. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

const URL = '/test/browser/fixtures/component.html?c=object';

async function open(page, width = 1280) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(URL);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

const article = (page) => page.getByRole('article', { name: 'LAPTOP-0042' });
const section = (page, name) => article(page).getByRole('region', { name });

test('a section turns into its form: the focus goes to its first field, a screen reader hears it, Save brings the view back with the values', async ({ page }) => {
  await open(page);
  const general = section(page, 'General');
  const edit = general.getByRole('button', { name: 'Edit' });
  await expect(edit).toHaveAccessibleDescription('General');
  await expect(general.locator('form')).toBeHidden();
  await focusByKeyboard(page, edit);
  await page.keyboard.press('Enter');
  await expect(general).toHaveAttribute('data-editing', '');
  await expect(general.locator('.ds-object__view')).toBeHidden();
  await expect(general.getByRole('textbox', { name: 'Name' })).toBeFocused();
  await expect(edit).toBeHidden();
  await expect(page.locator('[aria-live]').filter({ hasText: 'Editing General' })).toHaveCount(1);
  // The other sections stay as they are; the head's Edit stays.
  await expect(section(page, 'Owner')).not.toHaveAttribute('data-editing');
  await expect(article(page).locator('.ds-page-head [data-ds-object-edit]')).toBeVisible();

  await page.evaluate(() => {
    window.__saves = [];
    document.addEventListener('ds:save', (event) => window.__saves.push(event.detail.values));
  });
  await page.keyboard.press('Control+A');
  await page.keyboard.type('LAPTOP-0043');
  await page.keyboard.press('Enter');
  await expect(general.locator('.ds-object__view')).toBeVisible();
  await expect(general.locator('[data-field="name"]')).toHaveText('LAPTOP-0043');
  await expect(general).not.toHaveAttribute('data-editing');
  await expect(edit).toBeFocused();
  await expect(page.locator('[aria-live]').filter({ hasText: 'General saved' })).toHaveCount(1);
  expect(await page.evaluate(() => window.__saves)).toEqual([{ name: 'LAPTOP-0043', model: 'Laptop 14', serial: 'SN-7440-0042' }]);
});

test('Escape and Cancel give the form up: it resets, the view comes back, the focus returns to Edit; ds:cancel may keep it', async ({ page }) => {
  await open(page);
  const owner = section(page, 'Owner');
  const edit = owner.getByRole('button', { name: 'Edit' });
  await edit.click();
  const field = owner.getByRole('textbox', { name: 'Owner' });
  await expect(field).toBeFocused();
  await page.keyboard.type(' (changed)');
  await page.keyboard.press('Escape');
  await expect(owner.locator('.ds-object__view')).toBeVisible();
  await expect(edit).toBeFocused();
  await expect(owner.locator('[data-field="owner"]')).toHaveText('Ada Lovelace');
  await edit.click();
  await expect(field).toHaveValue('Ada Lovelace');
  // A listener that keeps the form (unsaved changes it wants confirmed).
  await page.evaluate(() => document.addEventListener('ds:cancel', (event) => event.preventDefault(), { once: true }));
  await owner.getByRole('button', { name: 'Cancel' }).click();
  await expect(owner).toHaveAttribute('data-editing', '');
  await owner.getByRole('button', { name: 'Cancel' }).click();
  await expect(owner).not.toHaveAttribute('data-editing');
});

test('a form that does not validate stays open; nothing is saved', async ({ page }) => {
  await open(page);
  const network = section(page, 'Network');
  await network.getByRole('button', { name: 'Edit' }).click();
  await page.evaluate(() => {
    window.__saves = 0;
    document.addEventListener('ds:save', () => { window.__saves += 1; });
  });
  const field = network.getByRole('textbox', { name: 'Network' });
  await field.fill('');
  // The demo's forms are novalidate: the page validates. Without novalidate, requestSubmit() stops at the browser.
  await network.locator('form').evaluate((form) => form.removeAttribute('novalidate'));
  await network.getByRole('button', { name: 'Save' }).click();
  expect(await page.evaluate(() => window.__saves)).toBe(0);
  await expect(network).toHaveAttribute('data-editing', '');
});

test('edit mode: Edit in the head turns every section into its form, Save all and Cancel take its place, Cancel brings all back', async ({ page }) => {
  await open(page);
  const head = article(page).locator('.ds-page-head');
  const edit = head.getByRole('button', { name: 'Edit' });
  const saveAll = head.getByRole('button', { name: 'Save all' });
  const cancel = head.getByRole('button', { name: 'Cancel' });
  await expect(saveAll).toBeHidden();
  await expect(cancel).toBeHidden();
  await edit.click();
  await expect(article(page)).toHaveAttribute('data-editing', '');
  for (const name of ['General', 'Owner', 'Network']) await expect(section(page, name)).toHaveAttribute('data-editing', '');
  await expect(edit).toBeHidden();
  await expect(saveAll).toBeVisible();
  await expect(cancel).toBeVisible();
  await expect(section(page, 'General').getByRole('textbox', { name: 'Name' })).toBeFocused();
  // Cancel: every section back, the head's Edit back with the focus.
  await cancel.click();
  for (const name of ['General', 'Owner', 'Network']) await expect(section(page, name)).not.toHaveAttribute('data-editing');
  await expect(edit).toBeVisible();
  await expect(edit).toBeFocused();
  // Save all submits every form; the page saves each one.
  await edit.click();
  await section(page, 'Owner').getByRole('textbox', { name: 'Site' }).fill('Building C');
  await saveAll.click();
  await expect(article(page)).not.toHaveAttribute('data-editing');
  await expect(section(page, 'Owner').locator('[data-field="site"]')).toHaveText('Building C');
  await expect(edit).toBeVisible();
});

test('the band: the bar sticks right under the head, a jump lands with the title clear of both, the anchors follow', async ({ page }) => {
  await open(page);
  const box = page.locator('[data-demo="box"]');
  const bar = article(page).getByRole('navigation', { name: 'Sections' });
  await bar.getByRole('link', { name: 'Network' }).click();
  await expect(bar.locator('[aria-current="location"]')).toHaveText('Network');
  await settle(page);
  await expect.poll(() => box.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await page.waitForTimeout(300);
  const geometry = await article(page).evaluate((el) => {
    const head = el.querySelector('.ds-page-head').getBoundingClientRect();
    const nav = el.querySelector('.ds-toc').getBoundingClientRect();
    const title = el.querySelector('.ds-object__section:last-of-type .ds-object__title').getBoundingClientRect();
    return { touching: Math.round(nav.top - head.bottom), clear: title.top >= nav.bottom - 0.5, head: el.style.getPropertyValue('--ds-object-head'), condensed: el.querySelector('.ds-page-head').hasAttribute('data-scrolled') };
  });
  expect(geometry.touching).toBe(0);
  expect(geometry.clear).toBe(true);
  expect(geometry.head).toMatch(/^\d+px$/);
  expect(geometry.condensed).toBe(true);
  // The head's hairline gives way to the bar's.
  expect(await article(page).locator('.ds-page-head').evaluate((el) => getComputedStyle(el, '::after').display)).toBe('none');
});

test('the controller: get, set, edit, cancel, done, events; destroy hands back what it owned', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const el = document.querySelector('.ds-object');
    const record = DS.get(el, 'object');
    const seen = [];
    const off = record.on('change', (detail) => seen.push(detail.editing.length));
    record.set(true);
    const all = record.get().length;
    record.set([el.querySelectorAll('.ds-object__section')[1]]);
    const one = record.get().length;
    record.set(false);
    const none = record.get().length;
    const id = el.querySelectorAll('.ds-object__section')[2].id;
    record.edit(id);
    const done = record.done(id);
    off();
    record.destroy();
    record.destroy();
    return { all, one, none, done, seen: seen.length > 0 };
  });
  expect(result).toEqual({ all: 3, one: 1, none: 0, done: true, seen: true });
});

test('a phone: the sections and their forms fit 360px, Edit and the form actions are fingers\' targets under touch', async ({ page }) => {
  await open(page, 390);
  await article(page).evaluate((el) => el.classList.add('ds-touch'));
  const general = section(page, 'General');
  await general.getByRole('button', { name: 'Edit' }).click();
  const fit = await article(page).evaluate((el) => {
    const width = el.getBoundingClientRect().right;
    return [...el.querySelectorAll('.ds-object__section, .ds-object__form .ds-btn, .ds-input')].filter((part) => part.offsetParent).every((part) => part.getBoundingClientRect().right <= width + 0.5);
  });
  expect(fit).toBe(true);
  const heights = await general.locator('.ds-form-actions .ds-btn').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
  for (const height of heights) expect(height).toBeGreaterThanOrEqual(48);
  const editHeight = await section(page, 'Owner').getByRole('button', { name: 'Edit' }).evaluate((el) => el.getBoundingClientRect().height);
  expect(editHeight).toBeGreaterThanOrEqual(48);
});

test('forced colours: the sections keep their edges', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const edge = await section(page, 'General').evaluate((el) => {
    const style = getComputedStyle(el);
    return style.borderTopStyle !== 'none' || style.outlineStyle !== 'none';
  });
  expect(edge).toBe(true);
});
