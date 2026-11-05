/**
 * The inline edit: open from the button and the value, Enter saves, Escape
 * cancels (a dialog around it stays open), focus back to the edit button,
 * an unchanged value only closes, the field's own validation, an async save
 * (busy, read-only, then the value and "Saved"), a failed save (the error in
 * words, linked and announced, gone on typing), preventDefault, a textarea's
 * Ctrl+Enter, blur modes, names, the view's height at every option and
 * touch, the demo. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=inlineedit');
  await ready(page);
}

async function add(page, { attrs = '', control = '<input class="ds-input ds-inlineedit__input" id="ie-input" aria-label="Device name" required>', name = ' aria-label="Edit device name"' } = {}) {
  await page.evaluate(({ attrs, control, name }) => {
    document.querySelector('#fx-component').insertAdjacentHTML('afterbegin',
      `<div class="ds-inlineedit" id="ie" data-ds-inlineedit ${attrs}>` +
      `<div class="ds-inlineedit__view"><span class="ds-inlineedit__value" id="ie-value">LAPTOP-0042</span><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm ds-inlineedit__edit" id="ie-edit" type="button"${name}>${window.DS.icons.icon(window.DS.icons.pencil, 18)}</button></div>` +
      `<div class="ds-inlineedit__form">${control}<span class="ds-inlineedit__actions"><button class="ds-btn ds-btn--tonal ds-sm ds-inlineedit__save" id="ie-save" type="button">Save</button>` +
      '<button class="ds-btn ds-btn--text ds-sm ds-inlineedit__cancel" id="ie-cancel" type="button">Cancel</button></span></div>' +
      '<small class="ds-field__hint ds-field__hint--error ds-inlineedit__error" id="ie-error" hidden></small></div><button type="button" id="ie-after">After</button>');
    window.sgEvents = [];
    const root = document.getElementById('ie');
    for (const type of ['edit', 'save', 'cancel']) root.addEventListener(`ds:${type}`, (event) => window.sgEvents.push([type, event.detail.value]));
  }, { attrs, control, name });
  await page.waitForFunction(() => document.getElementById('ie')?.getAttribute('data-state') === 'view');
  return page.locator('#ie');
}

const visible = (page) => page.evaluate(() => ['view', 'form'].filter((part) => document.querySelector(`#ie .ds-inlineedit__${part}`).getClientRects().length > 0));
const said = (page, text) => page.waitForFunction((text) => [...document.querySelectorAll('[aria-live]')].some((el) => el.textContent.includes(text)), text, { timeout: 3000 });

test('open by keyboard, Enter saves, focus back on the edit button, "Saved" said', async ({ page }) => {
  await open(page);
  const root = await add(page);
  expect(await visible(page)).toEqual(['view']);
  await page.locator('#ie-edit').focus();
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-state', 'edit');
  expect(await visible(page)).toEqual(['form']);
  const input = page.locator('#ie-input');
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('LAPTOP-0042');
  expect(await input.evaluate((el) => [el.selectionStart, el.selectionEnd])).toEqual([0, 11]);
  await page.keyboard.type('LAPTOP-0043');
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-state', 'view');
  await expect(page.locator('#ie-value')).toHaveText('LAPTOP-0043');
  await expect(page.locator('#ie-edit')).toBeFocused();
  await said(page, 'Saved');
  expect(await page.evaluate(() => window.sgEvents)).toEqual([['edit', 'LAPTOP-0042'], ['save', 'LAPTOP-0043']]);
});

test('Escape and Cancel leave the value; an unchanged value only closes; a click on the value opens', async ({ page }) => {
  await open(page);
  const root = await add(page);
  await page.locator('#ie-value').click();
  await expect(root).toHaveAttribute('data-state', 'edit');
  await page.keyboard.type('Something else');
  await page.keyboard.press('Escape');
  await expect(root).toHaveAttribute('data-state', 'view');
  await expect(page.locator('#ie-value')).toHaveText('LAPTOP-0042');
  await expect(page.locator('#ie-edit')).toBeFocused();
  await page.locator('#ie-edit').click();
  await page.locator('#ie-cancel').click();
  await expect(root).toHaveAttribute('data-state', 'view');
  await page.locator('#ie-edit').click();
  await page.locator('#ie-save').click();
  await expect(root).toHaveAttribute('data-state', 'view');
  expect((await page.evaluate(() => window.sgEvents)).map((e) => e[0])).toEqual(['edit', 'cancel', 'edit', 'cancel', 'edit']);
});

test('the field\'s own validation: an empty required name stays open with its message', async ({ page }) => {
  await open(page);
  const root = await add(page);
  await page.locator('#ie-edit').click();
  await page.locator('#ie-input').fill('');
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-state', 'edit');
  await expect(page.locator('#ie-input')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#ie-error')).toBeVisible();
  await expect(page.locator('#ie-error')).not.toHaveText('');
  await expect(page.locator('#ie-input')).toHaveAccessibleDescription(await page.locator('#ie-error').textContent());
  await page.keyboard.type('x');
  await expect(page.locator('#ie-error')).toBeHidden();
  await expect(page.locator('#ie-input')).not.toHaveAttribute('aria-invalid', /./);
});

test('an async save: busy and read-only until it settles, then the value', async ({ page }) => {
  await open(page);
  const root = await add(page);
  await page.evaluate(() => {
    document.getElementById('ie').addEventListener('ds:save', (event) => {
      event.detail.wait(new Promise((resolve) => { window.sgResolve = resolve; }));
    });
  });
  await page.locator('#ie-edit').click();
  await page.locator('#ie-input').fill('LAPTOP-0099');
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#ie-save')).toHaveAttribute('aria-busy', 'true');
  expect(await page.locator('#ie-input').evaluate((el) => el.readOnly)).toBe(true);
  // Escape does nothing while it saves.
  await page.keyboard.press('Escape');
  await expect(root).toHaveAttribute('data-state', 'edit');
  await page.evaluate(() => window.sgResolve());
  await expect(root).toHaveAttribute('data-state', 'view');
  await expect(root).not.toHaveAttribute('aria-busy', /./);
  await expect(page.locator('#ie-value')).toHaveText('LAPTOP-0099');
});

test('a failed save keeps the field with the reason in words, announced, focused', async ({ page }) => {
  await open(page);
  const root = await add(page);
  await page.evaluate(() => {
    document.getElementById('ie').addEventListener('ds:save', (event) => event.detail.wait(Promise.reject(new Error('The directory did not answer.'))));
  });
  await page.locator('#ie-edit').click();
  await page.locator('#ie-input').fill('LAPTOP-0100');
  await page.locator('#ie-save').click();
  await expect(page.locator('#ie-error')).toHaveText('The directory did not answer.');
  await expect(root).toHaveAttribute('data-state', 'edit');
  await expect(page.locator('#ie-input')).toBeFocused();
  await expect(page.locator('#ie-input')).toHaveValue('LAPTOP-0100');
  await expect(page.locator('#ie-value')).toHaveText('LAPTOP-0042');
  await said(page, 'The directory did not answer.');
});

test('preventDefault keeps the field open without an error; a controller listener may return the promise', async ({ page }) => {
  await open(page);
  const root = await add(page);
  await page.evaluate(() => {
    const handler = (event) => event.preventDefault();
    document.getElementById('ie').addEventListener('ds:save', handler, { once: true });
  });
  await page.locator('#ie-edit').click();
  await page.locator('#ie-input').fill('LAPTOP-0101');
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-state', 'edit');
  await expect(page.locator('#ie-error')).toBeHidden();
  await page.evaluate(() => window.DS.core.get(document.getElementById('ie'), 'inlineedit').on('save', () => Promise.reject(new Error(''))));
  await page.keyboard.press('Enter');
  await expect(page.locator('#ie-error')).toHaveText('That did not work. Try again.');
});

test('a textarea saves with Ctrl+Enter and takes Enter as a new line', async ({ page }) => {
  await open(page);
  const root = await add(page, { control: '<textarea class="ds-input ds-inlineedit__input" id="ie-input" aria-label="Note" rows="3"></textarea>' });
  await page.locator('#ie-edit').click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.type('second line');
  await expect(root).toHaveAttribute('data-state', 'edit');
  await page.keyboard.press('ControlOrMeta+Enter');
  await expect(root).toHaveAttribute('data-state', 'view');
  await expect(page.locator('#ie-value')).toHaveText('LAPTOP-0042\nsecond line');
});

test('blur: kept by default, saved or cancelled by the option', async ({ page }) => {
  await open(page);
  const root = await add(page);
  await page.locator('#ie-edit').click();
  await page.locator('#ie-input').fill('LAPTOP-0200');
  await page.locator('#ie-after').focus();
  await expect(root).toHaveAttribute('data-state', 'edit');
  await page.evaluate(() => document.getElementById('ie').setAttribute('data-ds-inlineedit-blur', 'save'));
  await page.locator('#ie-input').focus();
  await page.locator('#ie-after').focus();
  await expect(root).toHaveAttribute('data-state', 'view');
  await expect(page.locator('#ie-value')).toHaveText('LAPTOP-0200');
  await expect(page.locator('#ie-after')).toBeFocused();
  await page.evaluate(() => document.getElementById('ie').setAttribute('data-ds-inlineedit-blur', 'cancel'));
  await page.locator('#ie-edit').click();
  await page.locator('#ie-input').fill('LAPTOP-0300');
  await page.locator('#ie-after').focus();
  await expect(root).toHaveAttribute('data-state', 'view');
  await expect(page.locator('#ie-value')).toHaveText('LAPTOP-0200');
});

test('Escape in a dialog leaves the field and keeps the dialog open', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    document.querySelector('#fx-component').insertAdjacentHTML('beforeend', '<div class="ds-dialog" id="ie-dialog" hidden><div class="ds-dialog__box" role="dialog" aria-modal="true" aria-label="Device"><div class="ds-dialog__body" id="ie-body"></div></div></div>');
  });
  const root = await add(page);
  await page.evaluate(() => {
    document.getElementById('ie-body').append(document.getElementById('ie'));
    window.DS.overlay.open(document.getElementById('ie-dialog'));
  });
  await page.locator('#ie-edit').click();
  await page.keyboard.press('Escape');
  await expect(root).toHaveAttribute('data-state', 'view');
  await expect(page.locator('#ie-dialog')).toBeVisible();
});

test('names: an edit button without one is "Edit", described by the value', async ({ page }) => {
  await open(page);
  await add(page, { name: '' });
  await expect(page.locator('#ie-edit')).toHaveAccessibleName('Edit');
  await expect(page.locator('#ie-edit')).toHaveAccessibleDescription('LAPTOP-0042');
});

test('size, density and touch: the view is as high as the field it becomes', async ({ page }) => {
  await open(page);
  await add(page);
  const heights = (cls) => page.evaluate(async (cls) => {
    const root = document.getElementById('ie');
    root.className = 'ds-inlineedit ' + cls;
    const ctl = window.DS.core.get(root, 'inlineedit');
    const view = document.querySelector('#ie .ds-inlineedit__view').getBoundingClientRect().height;
    ctl.edit();
    const field = document.getElementById('ie-input').getBoundingClientRect().height;
    ctl.cancel();
    return [view, field];
  }, cls);
  expect(await heights('')).toEqual([40, 40]);
  expect(await heights('ds-sm')).toEqual([32, 32]);
  expect(await heights('ds-lg')).toEqual([48, 48]);
  expect(await heights('ds-density-compact')).toEqual([36, 36]);
  expect(await heights('ds-touch')).toEqual([48, 48]);
  expect(await page.locator('#ie-edit').evaluate((el) => el.getBoundingClientRect().height)).toBe(48);
});

test('the demo: a failed save shows its reason, every state renders, 360px fits, no console errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await open(page);
  await expect(page.locator('[data-demo="editing"]')).toHaveAttribute('data-state', 'edit');
  // The saving state: busy, the field read-only, the save button busy.
  const saving = page.locator('[data-demo="saving"]');
  await expect(saving).toHaveAttribute('aria-busy', 'true');
  await expect(saving.locator('input')).toHaveAttribute('readonly', '');
  await expect(saving.locator('.ds-inlineedit__save')).toHaveAttribute('aria-busy', 'true');
  const fail = page.locator('[data-demo="fail"]');
  await fail.locator('.ds-inlineedit__edit').click();
  await fail.locator('input').fill('Grace Hopper');
  await page.keyboard.press('Enter');
  await expect(fail.locator('.ds-inlineedit__error')).toContainText('did not answer', { timeout: 10000 });
  await page.setViewportSize({ width: 360, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('forced colours: the error keeps its icon and words; the field keeps its edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await add(page);
  await page.locator('#ie-edit').click();
  await page.locator('#ie-input').fill('');
  await page.keyboard.press('Enter');
  const out = await page.evaluate(() => [document.querySelector('#ie-error svg') !== null, getComputedStyle(document.getElementById('ie-input')).borderTopStyle]);
  expect(out).toEqual([true, 'solid']);
});
