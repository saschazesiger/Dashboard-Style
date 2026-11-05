/**
 * The menu button (DS.menubutton): the APG menu button pattern (a click,
 * Enter and Space open the menu on its first item, ArrowDown on the first,
 * ArrowUp on the last; Escape closes it and focus comes back), the
 * aria the module fills in, the turned chevron, a choice of radio items
 * (the label follows, ds:change on a pick, set() sends nothing), blocked
 * triggers, the imperative API, the options and forced colours. Runs in
 * `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, focusByKeyboard, settle } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=menubutton');
  await ready(page);
  await page.mouse.move(1, 1);
}

const menuFor = async (page, button) => page.locator(`#${await button.getAttribute('aria-controls')}`);
const focusedText = (page) => page.evaluate(() => (document.activeElement?.querySelector('.ds-menu__label')?.textContent ?? document.activeElement?.textContent ?? '').trim());

test('names and states: a button with aria-haspopup, aria-expanded and aria-controls', async ({ page }) => {
  await open(page);
  const button = page.locator('[data-demo="export"]');
  await expect(button).toHaveAccessibleName('Export');
  await expect(button).toHaveAttribute('aria-haspopup', 'menu');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  const menu = await menuFor(page, button);
  await expect(menu).toHaveAttribute('role', 'menu');
  await expect(menu).toBeHidden();
  // The module fills in what markup lacks: an id on the menu, the trigger's aria.
  const filled = await page.evaluate(() => {
    const host = document.createElement('div');
    host.innerHTML = '<button class="ds-btn ds-menu-btn" type="button" data-ds-menubutton>Probe</button><div class="ds-menu" role="menu" aria-label="Probe" hidden><button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="true">One</button></div>';
    document.querySelector('#fx-component').append(host);
    const trigger = host.firstElementChild;
    const control = DS.menubutton.create(trigger);
    const menu = host.lastElementChild;
    const out = { haspopup: trigger.getAttribute('aria-haspopup'), expanded: trigger.getAttribute('aria-expanded'), controls: trigger.getAttribute('aria-controls') === menu.id && Boolean(menu.id), checks: menu.hasAttribute('data-ds-menu-checks'), value: control.get() };
    control.destroy();
    host.remove();
    return out;
  });
  expect(filled).toEqual({ haspopup: 'menu', expanded: 'false', controls: true, checks: true, value: 'One' });
});

test('a click opens the menu on its first item and turns the chevron; Escape closes it, focus comes back', async ({ page }) => {
  await open(page);
  const button = page.locator('[data-demo="export"]');
  const menu = await menuFor(page, button);
  await button.click();
  await expect(menu).toBeVisible();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(() => focusedText(page)).toBe('CSV');
  await settle(page);
  const turned = await button.locator('.ds-menu-btn__chevron').evaluate((el) => getComputedStyle(el).rotate);
  expect(turned).toMatch(/180deg|^-?180/);
  await page.keyboard.press('Escape');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toBeFocused();
  await expect(menu).toBeHidden();
  // A second click on an open menu closes it.
  await button.click();
  await expect(menu).toBeVisible();
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
});

test('keys: Enter and Space on the first item, ArrowDown on the first, ArrowUp on the last', async ({ page }) => {
  await open(page);
  const button = page.locator('[data-demo="export"]');
  const menu = await menuFor(page, button);
  for (const [key, first] of [['Enter', 'CSV'], ['Space', 'CSV'], ['ArrowDown', 'CSV'], ['ArrowUp', 'Print']]) {
    await focusByKeyboard(page, button);
    await page.keyboard.press(key);
    await expect(menu, key).toBeVisible();
    await expect.poll(() => focusedText(page), key).toBe(first);
    await page.keyboard.press('Escape');
    await expect(button).toBeFocused();
    await expect(menu).toBeHidden();
  }
  // An item runs the page's action and closes the menu.
  await focusByKeyboard(page, button);
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => focusedText(page)).toBe('CSV');
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => focusedText(page)).toBe('JSON');
  await page.keyboard.press('Enter');
  await expect(menu).toBeHidden();
  await expect(button).toBeFocused();
  await expect(page.locator('.ds-toast').filter({ hasText: 'JSON: done.' })).toBeVisible();
});

test('a choice: the label follows the checked item, a pick sends ds:change, set() sends nothing', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.__changes = [];
    document.addEventListener('ds:change', (event) => {
      if (event.target.matches('.ds-menu-btn')) window.__changes.push(event.detail.value);
    });
  });
  const button = page.locator('[data-demo="sort"]');
  await expect(button).toHaveAccessibleName('Sort: Name');
  await button.click();
  const menu = await menuFor(page, button);
  await expect(menu.getByRole('menuitemradio', { name: 'Name' })).toHaveAttribute('aria-checked', 'true');
  await menu.getByRole('menuitemradio', { name: 'Last seen' }).click();
  await expect(button.locator('.ds-menu-btn__value')).toHaveText('Last seen');
  await expect(button).toHaveAccessibleName('Sort: Last seen');
  await expect(page.locator('[data-demo="sort-out"]')).toHaveText('Sorted by last seen');
  const state = await button.evaluate((el) => {
    const control = DS.get(el, 'menubutton');
    const before = control.get();
    control.set('owner');
    return { before, after: control.get() };
  });
  expect(state).toEqual({ before: 'seen', after: 'owner' });
  await expect(button.locator('.ds-menu-btn__value')).toHaveText('Owner');
  await expect(menu.locator('[value="owner"]')).toHaveAttribute('aria-checked', 'true');
  expect(await page.evaluate(() => window.__changes)).toEqual(['seen']);
});

test('blocked triggers never open: aria-disabled by click and keys, disabled not at all', async ({ page }) => {
  await open(page);
  const locked = page.getByRole('button', { name: 'Move to' });
  const menu = await menuFor(page, locked);
  await locked.click({ force: true });
  await focusByKeyboard(page, locked);
  for (const key of ['Enter', 'Space', 'ArrowDown', 'ArrowUp']) await page.keyboard.press(key);
  await expect(menu).toBeHidden();
  await expect(locked).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.ds-menu-btn[disabled]')).toBeDisabled();
});

test('the icon-only trigger: named, no chevron, opens its menu', async ({ page }) => {
  await open(page);
  const more = page.getByRole('button', { name: 'More actions' });
  await expect(more).toHaveAttribute('aria-haspopup', 'menu');
  await more.click();
  const menu = await menuFor(page, more);
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAccessibleName('Ticket actions');
  await page.keyboard.press('Escape');
  await expect(more).toBeFocused();
});

test('DS.menubutton.open and close drive the same menu, the button as its opener', async ({ page }) => {
  await open(page);
  const button = page.locator('[data-demo="export"]');
  const menu = await menuFor(page, button);
  await button.evaluate((el) => DS.menubutton.open(el));
  await expect(menu).toBeVisible();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await button.evaluate((el) => DS.menubutton.close(el));
  await expect(menu).toBeHidden();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
});

test('options: the chevron pulls the end padding in by size; touch; the value ends in an ellipsis', async ({ page }) => {
  await open(page);
  const pads = await page.evaluate(() => {
    const out = {};
    for (const cls of ['ds-sm', '', 'ds-lg', 'ds-touch']) {
      const region = document.createElement('div');
      region.className = cls;
      region.style.inlineSize = '120px';
      region.innerHTML = '<button class="ds-btn ds-menu-btn" type="button">Sort: <span class="ds-menu-btn__value">Serial number and owner</span><svg class="ds-chevron ds-menu-btn__chevron" width="16" height="16" aria-hidden="true"></svg></button>';
      document.querySelector('#fx-component').append(region);
      const button = region.firstElementChild;
      const value = button.querySelector('.ds-menu-btn__value');
      out[cls || 'md'] = { end: parseFloat(getComputedStyle(button).paddingInlineEnd), start: parseFloat(getComputedStyle(button).paddingInlineStart), height: button.getBoundingClientRect().height, width: button.getBoundingClientRect().width, cut: value.scrollWidth > value.clientWidth };
      region.remove();
    }
    return out;
  });
  expect(pads.md).toMatchObject({ end: 12, start: 16, height: 40, cut: true });
  expect(pads['ds-sm'].end).toBe(12);
  expect(pads['ds-lg'].end).toBe(16);
  expect(pads['ds-touch'].height).toBe(48);
  for (const entry of Object.values(pads)) expect(entry.width).toBeLessThanOrEqual(120);
});

test('forced colours: the button keeps its system colours, the chevron its ink, the menu its edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const button = page.locator('[data-demo="sort"]');
  const out = await button.evaluate((el) => ({ ink: getComputedStyle(el).color, chevron: getComputedStyle(el.querySelector('.ds-menu-btn__chevron')).color }));
  expect(out.chevron).toBe(out.ink);
  await button.click();
  const menu = await menuFor(page, button);
  await expect(menu).toBeVisible();
  const edge = await menu.evaluate((el) => {
    const style = getComputedStyle(el);
    return Math.max(parseFloat(style.outlineWidth) || 0, parseFloat(style.borderTopWidth) || 0);
  });
  expect(edge).toBeGreaterThan(0);
});
