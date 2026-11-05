/**
 * Query input (DS.query): tokens from data-ds-value, the combobox keys and
 * suggestions (keys, operators, values), commits by Space and Enter,
 * ds:submit, invalid tokens, keyboard editing of the tokens, Escape, the
 * clear button, saved queries through DS.store, values() from the page,
 * the options and forced colours. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const KEYS = [
  { key: 'status', label: 'Status', values: ['open', 'pending', 'closed'] },
  { key: 'priority', label: 'Priority', type: 'number' },
  { key: 'assignee', label: 'Assignee', values: [{ value: 'ada', label: 'Ada Lovelace' }, { value: 'grace', label: 'Grace Hopper' }] },
];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=query');
  await ready(page);
  await page.mouse.move(1, 1);
  await page.evaluate(() => localStorage.clear());
}

/** A query made for the test; ds:change and ds:submit land on window.changes and window.submits. */
async function make(page, { value = '', attributes = '', around = '', imperative = false } = {}) {
  await page.evaluate(({ keys, value, attributes, around, imperative }) => {
    document.querySelector('[data-test-region]')?.remove();
    const region = document.createElement('form');
    region.setAttribute('data-test-region', '');
    region.className = around;
    region.innerHTML = `<div class="ds-query" ${imperative ? '' : 'data-ds-query'} data-test-query ${attributes}>
      <label class="ds-field__label" for="t-q">Filter tickets</label>
      <div class="ds-query__row"><div class="ds-combo ds-combo--multi ds-query__box">
        <span class="ds-query__icon" aria-hidden="true"></span>
        <input class="ds-input ds-combo__input ds-query__input" id="t-q" placeholder="status:open">
        <button class="ds-combo__clear" type="button" hidden>x</button>
        <div class="ds-combo__popup" hidden><div class="ds-combo__list"></div><p class="ds-combo__status" role="status"></p></div></div>
        <button class="ds-btn ds-btn--icon ds-query__save" type="button">s</button></div></div>`;
    const el = region.querySelector('.ds-query');
    if (!imperative) {
      el.setAttribute('data-ds-query-keys', JSON.stringify(keys));
      if (value) el.setAttribute('data-ds-value', value);
    }
    document.querySelector('#fx-component').prepend(region);
    window.changes = [];
    window.submits = [];
    region.addEventListener('ds:change', (event) => window.changes.push(event.detail));
    region.addEventListener('ds:submit', (event) => window.submits.push(event.detail));
    region.addEventListener('submit', (event) => event.preventDefault());
  }, { keys: KEYS, value, attributes, around, imperative });
  if (!imperative) await page.waitForFunction(() => DS.get(document.querySelector('[data-test-query]'), 'query'));
  return page.locator('[data-test-query]');
}

const query = (page) => page.evaluate(() => DS.get(document.querySelector('[data-test-query]'), 'query').get());

test('tokens from data-ds-value, with names in words, the hidden input and the structured query', async ({ page }) => {
  await open(page);
  const el = await make(page, { value: 'status:open priority:>=3 printer', attributes: 'data-ds-query-name="q"' });
  const tokens = el.locator('.ds-query__token');
  await expect(tokens).toHaveCount(3);
  await expect(tokens.nth(0)).toHaveAccessibleName('Remove filter Status is open');
  await expect(tokens.nth(1)).toHaveAccessibleName('Remove filter Priority at least 3');
  await expect(tokens.nth(2)).toHaveAccessibleName('Remove filter Text printer');
  await expect(tokens.nth(0)).toHaveAccessibleDescription('Backspace or Delete removes it, F2 edits it.');
  await expect(tokens.nth(1)).toContainText('Priority≥3');
  await expect(tokens.nth(0)).toHaveAttribute('tabindex', '-1');
  const input = el.getByRole('combobox', { name: 'Filter tickets' });
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).toHaveAttribute('aria-autocomplete', 'list');
  expect(await query(page)).toMatchObject({
    filters: [{ key: 'status', op: 'is', values: ['open'] }, { key: 'priority', op: 'gte', values: ['3'] }],
    text: 'printer',
    value: 'status:open priority:>=3 printer',
  });
  expect(await page.evaluate(() => new FormData(document.querySelector('[data-test-region]')).get('q'))).toBe('status:open priority:>=3 printer');
  await expect(el.getByRole('button', { name: 'Clear the query' })).toBeVisible();
  await expect(el.getByRole('button', { name: 'Save this query' })).toHaveAttribute('aria-disabled', 'false');
});

test('suggestions: a key, then its values, by keyboard; the token is spoken and sent', async ({ page }) => {
  await open(page);
  const el = await make(page);
  const input = el.getByRole('combobox', { name: 'Filter tickets' });
  await input.focus();
  await page.keyboard.type('st');
  const list = page.getByRole('listbox', { name: 'Suggestions' });
  await expect(list).toBeVisible();
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await expect(list.getByRole('option')).toHaveText([/Status/, /Search for "st"/]);
  await expect(el.locator('.ds-combo__status')).toHaveText('2 suggestions');
  await page.keyboard.press('ArrowDown');
  const first = list.getByRole('option').first();
  await expect(input).toHaveAttribute('aria-activedescendant', await first.getAttribute('id'));
  await expect(first).toHaveAttribute('data-active', '');
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('status:');
  await expect(list.getByRole('option')).toHaveText(['is not-status:', 'open', 'pending', 'closed']);
  await page.keyboard.type('pe');
  await expect(list.getByRole('option')).toHaveText(['pending']);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('');
  await expect(el.locator('.ds-query__token')).toHaveCount(1);
  await expect(el.locator('.ds-query__token')).toHaveAccessibleName('Remove filter Status is pending');
  await expect.poll(() => page.evaluate(() => document.body.textContent.includes('Added filter Status is pending.'))).toBe(true);
  expect(await page.evaluate(() => window.changes.at(-1).filters)).toEqual([{ key: 'status', op: 'is', values: ['pending'] }]);
  // The list stays open on the keys for the next filter.
  await expect(list.getByRole('option').first()).toHaveText(/Status/);
});

test('a key that compares offers its operators; Space after a complete filter makes a token', async ({ page }) => {
  await open(page);
  const el = await make(page);
  const input = el.getByRole('combobox', { name: 'Filter tickets' });
  await input.focus();
  await page.keyboard.type('priority:');
  await expect(page.getByRole('listbox').getByRole('option')).toHaveText(['is not-priority:', 'overpriority:>', 'at leastpriority:>=', 'underpriority:<', 'at mostpriority:<=']);
  await page.keyboard.type('>2 ');
  await expect(input).toHaveValue('');
  await expect(el.locator('.ds-query__token')).toHaveAccessibleName('Remove filter Priority over 2');
  // An incomplete filter keeps its space.
  await page.keyboard.type('printer ');
  await expect(input).toHaveValue('printer ');
});

test('Enter makes tokens of the text, free words join; Enter in the empty field sends ds:submit', async ({ page }) => {
  await open(page);
  const el = await make(page);
  const input = el.getByRole('combobox', { name: 'Filter tickets' });
  await input.fill('paper -status:closed jam');
  await input.press('Enter');
  expect((await query(page)).value).toBe('paper jam -status:closed');
  await input.fill('tray');
  await input.press('Enter');
  expect((await query(page)).text).toBe('paper jam tray');
  await expect(el.locator('.ds-query__token')).toHaveCount(2);
  await input.press('Enter');
  expect(await page.evaluate(() => window.submits.length)).toBe(1);
  expect(await page.evaluate(() => window.submits[0].filters)).toEqual([{ key: 'status', op: 'not', values: ['closed'] }]);
});

test('an invalid token: the error tone, its icon and the reason in its name', async ({ page }) => {
  await open(page);
  const el = await make(page, { value: 'state:open status:done priority:>x' });
  const tokens = el.locator('.ds-query__token');
  await expect(tokens).toHaveCount(3);
  for (const index of [0, 1, 2]) {
    await expect(tokens.nth(index)).toHaveClass(/ds-tone-error/);
    await expect(tokens.nth(index).locator('.ds-chip__icon')).toHaveCount(1);
  }
  await expect(tokens.nth(0)).toHaveAccessibleName('Remove filter state is open (not a known filter)');
  await expect(tokens.nth(1)).toHaveAccessibleName('Remove filter Status is done (not a valid value)');
  expect((await query(page)).filters).toEqual([]);
  expect((await query(page)).invalid.length).toBe(3);
});

test('keys of the tokens: arrows, Home, End, Delete, Backspace and F2; Backspace in the empty field edits the last', async ({ page }) => {
  await open(page);
  const el = await make(page, { value: 'status:open assignee:ada priority:<4' });
  const input = el.getByRole('combobox', { name: 'Filter tickets' });
  const tokens = el.locator('.ds-query__token');
  await input.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(tokens.nth(2)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(tokens.nth(1)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tokens.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Delete');
  await expect(tokens).toHaveCount(2);
  await expect(tokens.nth(1)).toBeFocused();
  await expect(tokens.nth(1)).toHaveAccessibleName('Remove filter Priority under 4');
  await page.keyboard.press('Backspace');
  await expect(tokens).toHaveCount(1);
  await expect(tokens.nth(0)).toBeFocused();
  await page.keyboard.press('F2');
  await expect(tokens).toHaveCount(0);
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('status:open');
  await page.keyboard.press('Enter');
  await expect(tokens).toHaveCount(1);
  await page.keyboard.press('Backspace');
  await expect(input).toHaveValue('status:open');
  await expect.poll(() => page.evaluate(() => document.body.textContent.includes('Editing filter Status is open.'))).toBe(true);
  await input.press('Enter');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('End');
  await expect(input).toBeFocused();
});

test('a press on a token removes it; the clear button empties the query; Escape closes, then clears', async ({ page }) => {
  await open(page);
  const el = await make(page, { value: 'status:open priority:2' });
  await el.locator('.ds-query__token').first().click();
  await expect(el.locator('.ds-query__token')).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => document.body.textContent.includes('Removed filter Status is open.'))).toBe(true);
  const input = el.getByRole('combobox', { name: 'Filter tickets' });
  await input.focus();
  await page.keyboard.type('pri');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).toHaveValue('pri');
  await page.keyboard.press('Escape');
  await expect(input).toHaveValue('');
  await el.getByRole('button', { name: 'Clear the query' }).click();
  await expect(el.locator('.ds-query__token')).toHaveCount(0);
  await expect(input).toBeFocused();
  await expect(el.getByRole('button', { name: 'Clear the query' })).toBeHidden();
  await expect(el.getByRole('button', { name: 'Save this query' })).toHaveAttribute('aria-disabled', 'true');
});

test('saved queries: Save asks for a name and keeps it in DS.store; the empty field lists them; Delete removes one', async ({ page }) => {
  await open(page);
  const el = await make(page, { value: 'status:open assignee:ada', attributes: 'data-ds-query-store="test-tickets"' });
  await el.getByRole('button', { name: 'Save this query' }).click();
  const dialog = page.getByRole('dialog', { name: 'Save the query' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Name' }).fill('My open tickets');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ds:query:test-tickets')))).toEqual([{ name: 'My open tickets', value: 'status:open assignee:ada' }]);
  await page.evaluate(() => DS.get(document.querySelector('[data-test-query]'), 'query').clear());
  const input = el.getByRole('combobox', { name: 'Filter tickets' });
  await input.focus();
  await page.keyboard.press('ArrowDown');
  const list = page.getByRole('listbox');
  await expect(list.getByRole('group', { name: 'Saved queries' })).toBeVisible();
  await expect(list.getByRole('option').first()).toHaveText(/My open tickets/);
  await expect(el.locator('.ds-combo__status')).toHaveText('Enter applies this saved query, Delete removes it.');
  await page.keyboard.press('Enter');
  expect((await query(page)).value).toBe('status:open assignee:ada');
  await expect.poll(() => page.evaluate(() => document.body.textContent.includes('Applied My open tickets.'))).toBe(true);
  await page.evaluate(() => DS.get(document.querySelector('[data-test-query]'), 'query').clear());
  await input.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Delete');
  await expect(list.getByRole('group', { name: 'Saved queries' })).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ds:query:test-tickets')))).toEqual([]);
});

test('values() from the page: a key\'s values arrive as the person types', async ({ page }) => {
  await open(page);
  const el = await make(page, { imperative: true });
  await page.evaluate(() => {
    window.asked = [];
    DS.query.create(document.querySelector('[data-test-query]'), {
      keys: [{ key: 'device', label: 'Device' }],
      values: (key, typed) => {
        window.asked.push([key, typed]);
        return Promise.resolve(['LAPTOP-0042', 'LAPTOP-0107', 'PRINTER-0003'].filter((name) => name.toLowerCase().includes(typed.toLowerCase())));
      },
    });
  });
  const input = el.getByRole('combobox', { name: 'Filter tickets' });
  await input.focus();
  await page.keyboard.type('device:lap');
  await expect(page.getByRole('listbox').getByRole('option')).toHaveText(['LAPTOP-0042', 'LAPTOP-0107', 'lap']);
  expect(await page.evaluate(() => window.asked.at(-1))).toEqual(['device', 'lap']);
});

test('options: size steps the box, touch makes tokens 48px; at 360px the box wraps without overflow', async ({ page }) => {
  await open(page);
  const measure = async (around) => {
    const el = await make(page, { value: 'status:open', around });
    return el.evaluate((node) => ({
      box: node.querySelector('.ds-query__box').getBoundingClientRect().height,
      token: node.querySelector('.ds-query__token').getBoundingClientRect().height,
    }));
  };
  const base = await measure('');
  expect((await measure('ds-lg')).box).toBeCloseTo(base.box + 8, 0);
  expect((await measure('ds-touch ds-density-tight')).token).toBeGreaterThanOrEqual(48);
  const el = await make(page, { value: 'status:open,pending assignee:ada priority:>=3 "a long free text"' });
  await el.evaluate((node) => { node.style.inlineSize = '328px'; });
  expect(await el.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
});

test('forced colours: the box keeps its border and the tokens their edge', async ({ page }) => {
  await open(page);
  await page.emulateMedia({ forcedColors: 'active' });
  const el = await make(page, { value: 'status:open' });
  const styles = await el.evaluate((node) => ({
    box: getComputedStyle(node.querySelector('.ds-query__box')).borderTopStyle,
    token: getComputedStyle(node.querySelector('.ds-query__token .ds-chip__body')).borderTopStyle,
  }));
  expect(styles.box).toBe('solid');
  expect(styles.token).toBe('solid');
});

test('the demo renders without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page);
  await expect(page.locator('[data-demo="tickets"] .ds-query__token')).toHaveCount(2);
  await expect(page.locator('[data-demo="out"]')).toContainText('"key":"priority","op":"gte"');
  await expect(page.locator('[data-demo-disabled] .ds-query__token')).toBeDisabled();
  expect(errors).toEqual([]);
});
