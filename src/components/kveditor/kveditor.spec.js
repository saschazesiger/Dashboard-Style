/**
 * Key-value editor (DS.kveditor): rows from data-ds-value, add and remove
 * with focus, Enter between fields, paste of KEY=value lines, the duplicate
 * warning, secrets and reveal, the hidden input, the narrow layout, the
 * options and forced colours. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=kveditor');
  await ready(page);
  await page.mouse.move(1, 1);
}

/** A fresh editor made for the test; its ds:change details land on window.changes. */
async function make(page, value, attributes = '', around = '') {
  await page.evaluate(({ value, attributes, around }) => {
    document.querySelector('[data-test-region]')?.remove();
    const region = document.createElement('form');
    region.setAttribute('data-test-region', '');
    region.className = around;
    region.innerHTML = `<fieldset class="ds-kveditor" data-ds-kveditor data-test-kv ${attributes}><legend class="ds-fieldset__legend">Variables</legend>
      <ul class="ds-kveditor__rows"></ul><div class="ds-kveditor__foot"><button class="ds-btn ds-btn--text ds-kveditor__add" type="button">Add variable</button></div></fieldset>`;
    region.querySelector('fieldset').setAttribute('data-ds-value', JSON.stringify(value));
    document.querySelector('#fx-component').prepend(region);
    window.changes = [];
    region.addEventListener('ds:change', (event) => window.changes.push(event.detail));
  }, { value, attributes, around });
  await page.waitForFunction(() => DS.get(document.querySelector('[data-test-kv]'), 'kveditor'));
  return page.locator('[data-test-kv]');
}

test('rows from data-ds-value, with names, and the hidden input for a plain form', async ({ page }) => {
  await open(page);
  const el = await make(page, { API_URL: 'https://api.example.test', LOG_LEVEL: 'info' }, 'data-ds-kveditor-name="env"');
  await expect(el.locator('.ds-kveditor__row')).toHaveCount(2);
  await expect(el.getByRole('textbox', { name: 'Key, row 1' })).toHaveValue('API_URL');
  await expect(el.getByRole('textbox', { name: 'Value of LOG_LEVEL' })).toHaveValue('info');
  await expect(el.getByRole('button', { name: 'Remove API_URL' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Variables', exact: true })).toBeVisible();
  const submitted = await page.evaluate(() => Object.fromEntries(new FormData(document.querySelector('[data-test-region]'))).env);
  expect(JSON.parse(submitted)).toEqual({ API_URL: 'https://api.example.test', LOG_LEVEL: 'info' });
});

test('Add focuses the new key; Enter goes from key to value and on to a new row', async ({ page }) => {
  await open(page);
  const el = await make(page, { A: '1' });
  await el.getByRole('button', { name: 'Add variable' }).click();
  await expect(el.locator('.ds-kveditor__row')).toHaveCount(2);
  const key = el.getByRole('textbox', { name: 'Key, row 2' });
  await expect(key).toBeFocused();
  await page.keyboard.type('REGION');
  await page.keyboard.press('Enter');
  await expect(el.getByRole('textbox', { name: 'Value of REGION' })).toBeFocused();
  await page.keyboard.type('north');
  await page.keyboard.press('Enter');
  await expect(el.locator('.ds-kveditor__row')).toHaveCount(3);
  await expect(el.getByRole('textbox', { name: 'Key, row 3' })).toBeFocused();
  expect(await page.evaluate(() => DS.get(document.querySelector('[data-test-kv]'), 'kveditor').toObject())).toEqual({ A: '1', REGION: 'north' });
  const last = await page.evaluate(() => window.changes.at(-1));
  expect(last.value).toEqual({ A: '1', REGION: 'north' });
  // Enter in a field never submits the form.
  expect(await page.evaluate(() => location.search)).toContain('c=kveditor');
});

test('Remove moves focus to the next row, then the one before, then Add; it is spoken', async ({ page }) => {
  await open(page);
  const el = await make(page, { A: '1', B: '2', C: '3' });
  await el.getByRole('button', { name: 'Remove B' }).focus();
  await page.keyboard.press('Enter');
  await expect(el.locator('.ds-kveditor__row')).toHaveCount(2);
  await expect(el.getByRole('button', { name: 'Remove C' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(el.getByRole('button', { name: 'Remove A' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(el.locator('.ds-kveditor__row')).toHaveCount(0);
  await expect(el.getByRole('button', { name: 'Add variable' })).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.body.textContent.includes('Removed A.'))).toBe(true);
});

test('paste: KEY=value lines in an empty key fill it and add the rest after it', async ({ page }) => {
  await open(page);
  const el = await make(page, [{ key: 'FIRST', value: '1' }, { key: '', value: '' }, { key: 'LAST', value: '9' }]);
  await page.evaluate(() => {
    const key = document.querySelectorAll('[data-test-kv] .ds-kveditor__key')[1];
    key.focus();
    const data = new DataTransfer();
    data.setData('text/plain', '# copied\nDB_HOST=db.local\nexport DB_PORT=5432\nDB_NAME="devices"');
    const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', { value: data });
    key.dispatchEvent(event);
  });
  await expect(el.locator('.ds-kveditor__row')).toHaveCount(5);
  const rows = await page.evaluate(() => DS.get(document.querySelector('[data-test-kv]'), 'kveditor').get().map((row) => `${row.key}=${row.value}`));
  expect(rows).toEqual(['FIRST=1', 'DB_HOST=db.local', 'DB_PORT=5432', 'DB_NAME=devices', 'LAST=9']);
  await expect(el.getByRole('textbox', { name: 'Value of DB_NAME' })).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.body.textContent.includes('Pasted 3 rows.'))).toBe(true);
});

test('paste: a multi-line value that is not KEY=value lines stays the value; assignments into a value spread', async ({ page }) => {
  await open(page);
  const el = await make(page, [{ key: 'TLS_CERT', value: '' }]);
  const paste = (text) => page.evaluate((text) => {
    const value = document.querySelector('[data-test-kv] .ds-kveditor__input');
    value.focus();
    const data = new DataTransfer();
    data.setData('text/plain', text);
    const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', { value: data });
    value.dispatchEvent(event);
    return event.defaultPrevented;
  }, text);
  expect(await paste('-----BEGIN CERTIFICATE-----\nMIIBszCCAVmgAwIBAgIUQ==\n-----END CERTIFICATE-----')).toBe(false);
  await expect(el.locator('.ds-kveditor__row')).toHaveCount(1);
  // KEY=value lines pasted into a value still spread over rows.
  expect(await paste('DB_HOST=db.local\nDB_PORT=5432')).toBe(true);
  await expect(el.locator('.ds-kveditor__row')).toHaveCount(3);
});

test('a key that comes twice warns on both rows, in words, until it is unique again', async ({ page }) => {
  await open(page);
  const el = await make(page, [{ key: 'API_URL', value: 'a' }, { key: 'B', value: 'b' }, { key: 'API_URL', value: 'c' }]);
  const rows = el.locator('.ds-kveditor__row');
  await expect(rows.nth(0)).toHaveAttribute('data-status', 'warning');
  await expect(rows.nth(2)).toHaveAttribute('data-status', 'warning');
  await expect(rows.nth(1)).not.toHaveAttribute('data-status', 'warning');
  await expect(rows.nth(0).locator('.ds-kveditor__hint')).toHaveText('API_URL is also on row 3: the last one counts.');
  await expect(rows.nth(0).locator('.ds-kveditor__hint svg')).toHaveCount(1);
  const key = el.getByRole('textbox', { name: 'Key, row 3' });
  await expect(key).toHaveAccessibleDescription('API_URL is also on row 1: the last one counts.');
  expect(await page.evaluate(() => DS.get(document.querySelector('[data-test-kv]'), 'kveditor').toObject().API_URL)).toBe('c');
  await key.fill('API_HOST');
  await expect(rows.nth(0)).not.toHaveAttribute('data-status', 'warning');
  await expect(rows.nth(0).locator('.ds-kveditor__hint')).toBeHidden();
  await expect(key).not.toHaveAttribute('aria-describedby', /.+/);
  const value = el.getByRole('textbox', { name: 'Value, row 2' });
  await el.getByRole('textbox', { name: 'Key, row 2' }).fill('');
  await expect(value).toHaveValue('b');
  await expect(rows.nth(1).locator('.ds-kveditor__hint')).toHaveText('Add a key, or this row is left out.');
});

test('secrets: a matching key masks its value; reveal toggles it with aria-pressed', async ({ page }) => {
  await open(page);
  const el = await make(page, [{ key: 'API_TOKEN', value: 'tok_1' }, { key: 'PLAIN', value: 'x' }, { key: 'NOTE', value: 'given', secret: true }], 'data-ds-kveditor-secret="TOKEN|SECRET"');
  const token = el.getByLabel('Value of API_TOKEN', { exact: true });
  await expect(token).toHaveAttribute('type', 'password');
  await expect(el.getByLabel('Value of PLAIN', { exact: true })).toHaveAttribute('type', 'text');
  await expect(el.getByLabel('Value of NOTE', { exact: true })).toHaveAttribute('type', 'password');
  const reveal = el.getByRole('button', { name: 'Show the value of API_TOKEN' });
  await expect(reveal).toHaveAttribute('aria-pressed', 'false');
  await reveal.click();
  await expect(token).toHaveAttribute('type', 'text');
  await expect(reveal).toHaveAttribute('aria-pressed', 'true');
  await reveal.click();
  await expect(token).toHaveAttribute('type', 'password');
  const plainKey = el.getByRole('textbox', { name: 'Key, row 2' });
  await plainKey.fill('DB_SECRET');
  await expect(el.getByLabel('Value of DB_SECRET', { exact: true })).toHaveAttribute('type', 'password');
  await expect(plainKey, 'the key keeps the focus while its row turns secret').toBeFocused();
});

test('narrow: under 480px the value goes under the key, Remove stays beside the key', async ({ page }) => {
  await open(page);
  const el = await make(page, { ACCEPT: 'application/json' });
  const layout = async (width) => {
    await el.evaluate((node, width) => { node.style.inlineSize = `${width}px`; }, width);
    return el.locator('.ds-kveditor__row').evaluate((row) => {
      const box = (selector) => row.querySelector(selector).getBoundingClientRect();
      return { key: box('.ds-kveditor__key'), value: box('.ds-kveditor__value'), remove: box('.ds-kveditor__remove') };
    });
  };
  const wide = await layout(640);
  expect(Math.abs(wide.value.top - wide.key.top)).toBeLessThan(2);
  const narrow = await layout(360);
  expect(narrow.value.top).toBeGreaterThanOrEqual(narrow.key.bottom);
  expect(Math.abs(narrow.remove.top - narrow.key.top)).toBeLessThan(6);
  expect(narrow.remove.right).toBeLessThanOrEqual(360 + narrow.key.left);
});

test('options: density tightens the rows, touch makes every target 48px, size steps the fields', async ({ page }) => {
  await open(page);
  const measure = async (around) => {
    const el = await make(page, { A: '1', B: '2' }, '', around);
    return el.evaluate((node) => {
      const rows = node.querySelectorAll('.ds-kveditor__row');
      return {
        gap: rows[1].getBoundingClientRect().top - rows[0].getBoundingClientRect().bottom,
        field: node.querySelector('.ds-kveditor__key').getBoundingClientRect().height,
        remove: node.querySelector('.ds-kveditor__remove').getBoundingClientRect().height,
      };
    });
  };
  const base = await measure('');
  expect((await measure('ds-density-compact')).gap).toBeCloseTo(base.gap - 2, 0);
  expect((await measure('ds-lg')).field).toBeCloseTo(base.field + 8, 0);
  const touch = await measure('ds-touch ds-density-tight');
  expect(touch.field).toBeGreaterThanOrEqual(48);
  expect(touch.remove).toBeGreaterThanOrEqual(48);
});

test('forced colours: a warning key keeps a second edge', async ({ page }) => {
  await open(page);
  await page.emulateMedia({ forcedColors: 'active' });
  const el = await make(page, [{ key: 'A', value: '1' }, { key: 'A', value: '2' }]);
  const outline = await el.locator('.ds-kveditor__key').first().evaluate((key) => getComputedStyle(key).outlineStyle);
  expect(outline).toBe('solid');
});

test('the demo renders without errors and shows the object it exports', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page);
  await expect(page.locator('[data-demo="out"]')).toContainText('"API_TOKEN": "tok_51d8a0e7c2"');
  await expect(page.locator('.ds-kveditor[disabled] .ds-kveditor__key').first()).toBeDisabled();
  expect(errors).toEqual([]);
});
