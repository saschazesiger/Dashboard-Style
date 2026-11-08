/**
 * The React adapter (dist/react/, docs/react.md) in the three engines, on
 * the pinned dev copy of React 18 (test/react/) under StrictMode: the
 * documented markup, controllers that survive StrictMode's double effects
 * and go on unmount (no listener left on window or document), what the
 * system writes (ripple spans, .ds-pressed, data-state, aria-selected,
 * popover) surviving re-renders, and the keyboard flows of the main
 * widgets (tabs, dialog, menu button, toggle group). Fixture:
 * fixtures/react.html with fixtures/react-app.js.
 */
import { test, expect } from '@playwright/test';

const FIXTURE = '/test/browser/fixtures/react.html';

async function open(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || (message.type() === 'warning' && /Warning:|Dashboard-Style React/.test(message.text()))) errors.push(message.text());
  });
  await page.goto(FIXTURE);
  await page.waitForSelector('html[data-fixture-ready]');
  return errors;
}

const mount = (page, name, props) => page.evaluate(([n, p]) => window.harness.mount(n, p), [name, props ?? {}]);
const logOf = (page) => page.evaluate(() => window.harness.log.map((entry) => entry.join(' ')));

test('renders the documented markup and marks only the roots it drives data-ds-managed', async ({ page }) => {
  const errors = await open(page);
  await mount(page, 'content');
  const provider = page.locator('#provider');
  await expect(provider).toHaveClass(/\bds-theme\b/);
  await expect(page.locator('#alert')).toHaveClass('ds-alert ds-tone-warning');
  await expect(page.locator('#alert > svg[aria-hidden="true"]')).toHaveCount(1);
  await expect(page.locator('#alert .ds-alert__title')).toHaveText('Certificate expires soon');
  await expect(page.locator('#card')).toHaveClass('ds-card');
  await expect(page.locator('#card > .ds-card__row > h2.ds-card__title')).toHaveText('Devices');
  await expect(page.locator('.ds-table-wrap > table#table.ds-table > caption.ds-sr')).toHaveText('Devices');
  await expect(page.locator('#table th[aria-sort="ascending"] .ds-table__sort')).toHaveText('Device');
  await expect(page.locator('#table tbody tr').first()).toHaveAttribute('data-ds-key', 'd3');
  await expect(page.locator('#table .ds-status.ds-tone-error > span')).toHaveText('Failed');
  // The field: label above, the hint and the error linked, aria-invalid.
  const input = page.locator('#serial');
  await expect(input).toHaveClass('ds-input');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  const describedBy = (await input.getAttribute('aria-describedby')).split(' ');
  expect(describedBy).toHaveLength(2);
  await expect(page.getByLabel('Serial')).toHaveCount(1);
  await expect(page.locator('.ds-field__hint--error')).toContainText('Already in use.');
  // Plain components carry no data-ds-managed; nothing inside them is skipped.
  expect(await page.locator('[data-ds-managed]').count()).toBe(0);
  // Sorting: the page renders the new order.
  await page.locator('#table th:nth-child(2) .ds-table__sort').click();
  await expect(page.locator('#table th:nth-child(2)')).toHaveAttribute('aria-sort', 'ascending');
  await expect(page.locator('#table tbody tr').first()).toHaveAttribute('data-ds-key', 'd2');
  expect(await logOf(page)).toEqual(['sort age ascending']);
  expect(errors).toEqual([]);
});

test('a button keeps its ripple and .ds-pressed through a re-render that changes its label', async ({ page }) => {
  const errors = await open(page);
  await mount(page, 'buttons');
  const save = page.locator('#save');
  await expect(save).toHaveClass('ds-btn ds-btn--filled');
  await expect(page.locator('#edit')).toHaveClass('ds-btn ds-btn--quiet ds-btn--icon');
  await expect(page.locator('#edit')).toHaveAttribute('data-tip', 'Edit');
  const box = await save.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(save.locator('.ds-press-ripple')).toHaveCount(1);
  await expect(save).toHaveClass(/\bds-pressed\b/);
  // A re-render while pressed: a new label, and a class change (the variant).
  await page.evaluate(() => window.harness.set.label('Saving'));
  await page.evaluate(() => window.harness.update({ variant: 'tonal' }));
  await expect(save).toHaveText('Saving');
  await expect(save).toHaveClass(/\bds-btn--tonal\b/);
  await expect(save).toHaveClass(/\bds-pressed\b/);
  await expect(save.locator('.ds-press-ripple')).toHaveCount(1);
  await page.mouse.up();
  await expect(save).not.toHaveClass(/\bds-pressed\b/);
  await expect(save.locator('.ds-press-ripple')).toHaveCount(0);
  expect(await logOf(page)).toEqual(['click save']);
  expect(errors).toEqual([]);
});

test('a badge counts through DS.badge, and a busy action shows its faces', async ({ page }) => {
  const errors = await open(page);
  await mount(page, 'buttons');
  const badge = page.locator('#badge');
  await expect(badge).toHaveAttribute('data-ds-managed', '');
  await expect(badge).toHaveText('');
  await page.evaluate(() => window.harness.set.count(3));
  await expect(badge).toHaveText('3');
  await page.evaluate(() => window.harness.set.count(12));
  await expect(badge).toHaveText('9+');
  const publish = page.locator('#publish');
  await expect(publish.locator('.ds-btn__faces > .ds-btn__face')).toHaveCount(4);
  await publish.click();
  await expect(publish).toHaveAttribute('aria-busy', 'true');
  await expect(publish).not.toHaveAttribute('aria-busy', 'true');
  expect(errors).toEqual([]);
});

test('tabs: StrictMode keeps one controller; arrows, Home and End select; the selection survives re-renders', async ({ page }) => {
  const errors = await open(page);
  await mount(page, 'tabs');
  const row = page.locator('#tabs');
  await expect(row).toHaveAttribute('data-ds-managed', '');
  await expect(row).toHaveAttribute('role', 'tablist');
  const tab = (name) => page.getByRole('tab', { name });
  await expect(tab('Details')).toHaveAttribute('aria-selected', 'true');
  // One indicator: the StrictMode run's first controller went with its cleanup.
  await expect(row.locator('.ds-tabs__indicator')).toHaveCount(1);
  // Lazy panels: only the shown one has its content.
  await expect(page.locator('#history-text')).toHaveCount(0);
  await tab('Details').focus();
  await page.keyboard.press('ArrowRight');
  await expect(tab('History')).toHaveAttribute('aria-selected', 'true');
  await expect(tab('History')).toBeFocused();
  await expect(page.locator('#history-text')).toBeVisible();
  await expect(page.getByRole('tabpanel', { name: 'Details' })).toBeHidden();
  // A re-render (a new tick, the same props) keeps what DS.tabs wrote.
  await page.evaluate(() => window.harness.set.tick());
  await expect(tab('History')).toHaveAttribute('aria-selected', 'true');
  await expect(tab('Details')).toHaveAttribute('aria-selected', 'false');
  await expect(tab('History')).toHaveAttribute('tabindex', '0');
  // End skips nothing but the disabled tab never takes the selection.
  await page.keyboard.press('End');
  await expect(tab('Archived')).toBeFocused();
  await expect(tab('History')).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(tab('Details')).toHaveAttribute('aria-selected', 'true');
  // A value from the page selects through DS.tabs.
  await page.evaluate(() => window.harness.set.value('report'));
  await expect(tab('Report')).toHaveAttribute('aria-selected', 'true');
  expect(await logOf(page)).toEqual(['change history', 'change details', 'change report']);
  expect(errors).toEqual([]);
});

test('tabs: Delete closes a closable tab through onClose; React removes it and its neighbour is selected', async ({ page }) => {
  const errors = await open(page);
  await mount(page, 'tabs', { initial: 'report' });
  const tab = (name) => page.getByRole('tab', { name });
  await expect(tab('Report')).toHaveAttribute('aria-selected', 'true');
  await tab('Report').focus();
  await page.keyboard.press('Delete');
  await expect(tab('Report')).toHaveCount(0);
  await expect(page.locator('.ds-tabs__panel')).toHaveCount(3);
  await expect(tab('Archived')).toHaveAttribute('aria-selected', 'false');
  await expect(tab('History')).toHaveAttribute('aria-selected', 'true');
  await expect(tab('History')).toBeFocused();
  expect(await logOf(page)).toEqual(['change history', 'close report']);
  expect(errors).toEqual([]);
});

test('dialog: opens on its prop, focus in and back, Escape asks onClose, re-renders keep data-state', async ({ page }) => {
  const errors = await open(page);
  await mount(page, 'dialog');
  const dialog = page.locator('#confirm');
  await expect(dialog).toBeHidden();
  await page.locator('#opener').click();
  await expect(dialog).toHaveAttribute('data-state', 'open');
  await expect(page.getByRole('alertdialog', { name: 'Delete 3 devices?' })).toBeVisible();
  await expect(page.locator('#cancel')).toBeFocused();
  // A re-render while open keeps what DS.overlay wrote.
  await page.evaluate(() => window.harness.set.tick());
  await expect(page.locator('#tick-text')).toHaveText('Rendered 1 times.');
  await expect(dialog).toHaveAttribute('data-state', 'open');
  expect(await dialog.evaluate((el) => el.open && el.matches(':modal'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.locator('#opener')).toBeFocused();
  expect(await logOf(page)).toEqual(['close escape']);
  // [data-ds-close] and the page's own close (the prop) both work.
  await page.locator('#opener').click();
  await expect(page.locator('#cancel')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  await page.locator('#opener').click();
  await page.locator('#delete').click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('#opener')).toBeFocused();
  await expect(page.locator('.ds-toast')).toContainText('3 devices deleted');
  expect(await logOf(page)).toEqual(['close escape', 'close close', 'delete']);
  expect(errors).toEqual([]);
});

test('menu button and toggle group: keyboard flows, and popover and data-state survive a re-render', async ({ page }) => {
  const errors = await open(page);
  await mount(page, 'generic');
  const button = page.locator('#export');
  const menu = page.locator('#export-menu');
  await expect(button).toHaveAttribute('data-ds-managed', '');
  await expect(button).toHaveClass('ds-btn ds-menu-btn');
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toBeVisible();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('menuitem', { name: 'CSV' })).toBeFocused();
  const popover = await menu.getAttribute('popover');
  await page.evaluate(() => window.harness.set.tick());
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute('data-state', 'open');
  expect(await menu.getAttribute('popover')).toBe(popover);
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'JSON' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(menu).toBeHidden();
  await expect(button).toBeFocused();
  // The toggle group: one tab stop, arrows move, Space presses.
  const listButton = page.getByRole('button', { name: 'List' });
  const gridButton = page.getByRole('button', { name: 'Grid' });
  await listButton.focus();
  await page.keyboard.press('ArrowRight');
  await expect(gridButton).toBeFocused();
  await page.keyboard.press('Space');
  await expect(gridButton).toHaveAttribute('aria-pressed', 'true');
  await expect(listButton).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(() => window.harness.set.tick());
  await expect(gridButton).toHaveAttribute('aria-pressed', 'true');
  expect(await logOf(page)).toEqual(['menu json', 'view grid']);
  expect(errors).toEqual([]);
});

test('mounting and unmounting under StrictMode leaks no listener and no controller', async ({ page }) => {
  const errors = await open(page);
  const cycle = async () => {
    for (const name of ['buttons', 'tabs', 'dialog', 'content', 'generic']) {
      await mount(page, name);
      if (name === 'dialog') {
        await page.locator('#opener').click();
        await expect(page.locator('#confirm')).toHaveAttribute('data-state', 'open');
      }
      if (name === 'generic') {
        await page.locator('#export').click();
        await expect(page.locator('#export-menu')).toBeVisible();
      }
      await page.evaluate(() => window.harness.unmount());
    }
    // Unmounted while open: the overlays' cleanup ran (scroll lock, Escape stack).
    await page.waitForTimeout(50);
    return page.evaluate(() => window.__listeners());
  };
  const first = await cycle();
  const second = await cycle();
  const third = await cycle();
  expect(second).toEqual(first);
  expect(third).toEqual(first);
  expect(await page.evaluate(() => document.body.classList.contains('ds-no-scroll'))).toBe(false);
  expect(errors).toEqual([]);
});
