/**
 * The menu on the options model (3.0): a row's height at every size x density,
 * with and without .ds-touch; the shape on the menu's radius; the keyboard from
 * a declarative trigger; check and radio items the system flips; descriptions,
 * shortcuts and the danger item; names and forced colours. The 2.x behaviour
 * stays in test/browser/popups.spec.js and overlay.spec.js. Runs in the
 * `fallback` project too (the script's placement).
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { focusByKeyboard, ready, settle } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=menu');
  await ready(page);
  await page.mouse.move(1, 1);
}

const focused = (page) => page.evaluate(() => document.activeElement?.querySelector?.('.ds-menu__label')?.textContent ?? document.activeElement?.textContent?.trim());

test('a row at every size x density, and .ds-touch as a minimum over both', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const region = document.createElement('div');
          region.className = `${density} ${size}${touch ? ' ds-touch' : ''}`;
          region.innerHTML = '<div class="ds-menu" role="menu" aria-label="Probe"><button class="ds-menu__item" role="menuitem" type="button"><span class="ds-menu__label">Row</span></button></div>';
          document.querySelector('#fx-component').append(region);
          const item = region.querySelector('.ds-menu__item');
          out.push({ touch, density, size, height: item.getBoundingClientRect().height, line: parseFloat(getComputedStyle(item).lineHeight), font: getComputedStyle(item).fontSize });
          region.remove();
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES });
  expect(measured).toHaveLength(SIZES.length * DENSITIES.length * 2);
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const name = `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`;
    // 48px at md and comfortable, 8px per size step, 4px per density step; never below its line; touch: at least 48px.
    expect(entry.height, name).toBeCloseTo(Math.max(entry.touch ? TOUCH : 0, 48 + step * 8 + density * 4, entry.line), 0);
  }
});

test('the default row keeps 48px and the body type; a size class changes the type', async ({ page }) => {
  await open(page);
  const rows = await page.evaluate(() => {
    const row = (classes) => {
      const region = document.createElement('div');
      region.className = classes;
      region.innerHTML = '<div class="ds-menu" role="menu" aria-label="Probe"><button class="ds-menu__item" role="menuitem" type="button"><span class="ds-menu__label">Row</span></button></div>';
      document.querySelector('#fx-component').append(region);
      const item = region.querySelector('.ds-menu__item');
      const out = { height: item.getBoundingClientRect().height, font: getComputedStyle(item).fontSize, line: getComputedStyle(item).lineHeight };
      region.remove();
      return out;
    };
    const body = document.createElement('p');
    body.style.font = 'var(--ds-font-body)';
    document.querySelector('#fx-component').append(body);
    const expected = { font: getComputedStyle(body).fontSize, line: getComputedStyle(body).lineHeight };
    body.remove();
    return { plain: row(''), small: row('ds-xs'), expected };
  });
  expect(rows.plain.height).toBeCloseTo(48, 0);
  expect(rows.plain.font).toBe(rows.expected.font);
  expect(rows.plain.line).toBe(rows.expected.line);
  expect(rows.small.font).not.toBe(rows.plain.font);
});

test('the shape multiplies the menu\'s radius; a row stays square', async ({ page }) => {
  await open(page);
  const radii = await page.evaluate(() => {
    const radius = (classes) => {
      const region = document.createElement('div');
      region.className = classes;
      region.innerHTML = '<div class="ds-menu" role="menu" aria-label="Probe"><button class="ds-menu__item" role="menuitem" type="button"><span class="ds-menu__label">Row</span></button></div>';
      document.querySelector('#fx-component').append(region);
      const out = [parseFloat(getComputedStyle(region.querySelector('.ds-menu')).borderTopLeftRadius), parseFloat(getComputedStyle(region.querySelector('.ds-menu__item')).borderTopLeftRadius)];
      region.remove();
      return out;
    };
    return { square: radius('ds-shape-square'), soft: radius('ds-shape-soft'), plain: radius(''), round: radius('ds-shape-round') };
  });
  expect(radii.plain[0]).toBeGreaterThan(0);
  expect(radii.square[0]).toBe(0);
  expect(radii.soft[0]).toBeCloseTo(radii.plain[0] / 2, 1);
  expect(radii.round[0]).toBeCloseTo(radii.plain[0] * 1.5, 1);
  for (const value of Object.values(radii)) expect(value[1]).toBe(0);
});

test('a declarative trigger: a click toggles, ArrowDown and ArrowUp open, the keys move, Escape and Tab close', async ({ page }) => {
  await open(page);
  const trigger = page.locator('[data-demo="plain"]');
  const menu = page.locator('[data-demo="actions"]');
  await trigger.click();
  await expect(menu).toHaveAttribute('data-state', 'open');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  expect(await focused(page)).toBe('Edit');
  await page.keyboard.press('ArrowDown');
  expect(await focused(page)).toBe('Duplicate');
  await page.keyboard.press('End');
  expect(await focused(page)).toBe('Delete device');
  await page.keyboard.press('ArrowDown');
  expect(await focused(page), 'wraps').toBe('Edit');
  await page.keyboard.press('ArrowUp');
  expect(await focused(page)).toBe('Delete device');
  await page.keyboard.press('Home');
  expect(await focused(page)).toBe('Edit');
  await page.keyboard.press('a');
  expect(await focused(page), 'type-ahead').toBe('Archive');
  await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
  await settle(page);
  await expect(menu).toBeHidden();

  await trigger.click();
  await expect(menu).toHaveAttribute('data-state', 'open');
  await settle(page);
  await trigger.click();
  await expect(trigger, 'a second click closes').toHaveAttribute('aria-expanded', 'false');
  await settle(page);

  await trigger.focus();
  await page.keyboard.press('ArrowUp');
  await expect(menu).toHaveAttribute('data-state', 'open');
  expect(await focused(page), 'the last enabled item').toBe('Delete device');
  await page.keyboard.press('Tab');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await settle(page);

  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  expect(await focused(page), 'the first item').toBe('Edit');
  await page.keyboard.press('Escape');
});

test('data-ds-menu-checks: a radio takes its group\'s one check, a checkbox toggles, ds:change tells, and it closes', async ({ page }) => {
  await open(page);
  const menu = page.locator('[data-demo="checks"]');
  const checked = () => menu.locator('[role="group"] [aria-checked="true"] .ds-menu__label').allTextContents();
  await page.evaluate(() => {
    window.changes = [];
    document.querySelector('[data-demo="checks"]').addEventListener('ds:change', (event) => window.changes.push([event.detail.item.textContent.trim(), event.detail.checked]));
  });
  await page.locator('[data-demo="picks"]').click();
  await settle(page);
  expect(await checked()).toEqual(['Name']);
  await expect(menu.locator('[aria-checked="false"] .ds-menu__check').first()).toBeHidden();
  await menu.locator('[role="menuitemradio"]', { hasText: 'Last seen' }).click();
  expect(await checked()).toEqual(['Last seen']);
  await settle(page);
  await expect(menu, 'an item closes the menu, as in 2.x').toBeHidden();
  await page.locator('[data-demo="picks"]').click();
  await settle(page);
  await menu.locator('[role="menuitemcheckbox"]', { hasText: 'Compact rows' }).click();
  await settle(page);
  await expect(menu.locator('[role="menuitemcheckbox"]', { hasText: 'Compact rows' })).toHaveAttribute('aria-checked', 'false');
  await page.locator('[data-demo="picks"]').click();
  await settle(page);
  await menu.locator('[role="menuitemradio"]', { hasText: 'Last seen' }).click();
  await settle(page);
  await expect(menu, 'it still closes').toBeHidden();
  expect(await checked(), 'the radio keeps its check').toContain('Last seen');
  expect(await page.evaluate(() => window.changes), 'the radio that was the one: nothing changed, nothing told').toEqual([['Last seen', true], ['Compact rows', false]]);
});

test('without data-ds-menu-checks the page flips aria-checked, as in 2.x', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const menu = document.querySelector('[data-demo="checks"]');
    menu.removeAttribute('data-ds-menu-checks');
    const trigger = document.querySelector('[data-demo="picks"]');
    await DS.overlay.open(menu, { opener: trigger });
    const item = menu.querySelector('[role="menuitemcheckbox"]');
    const before = item.getAttribute('aria-checked');
    item.click();
    return [before, item.getAttribute('aria-checked')];
  });
  expect(result).toEqual(['true', 'true']);
});

test('a description wraps under the label, a shortcut sits at the end; a danger item takes the error ink and keeps its word', async ({ page }) => {
  await open(page);
  await page.locator('[data-demo="rich"]').click();
  await settle(page);
  const parts = await page.evaluate(() => {
    const row = document.querySelector('[data-demo="export"] .ds-menu__item');
    const box = (selector) => row.querySelector(selector).getBoundingClientRect();
    const label = box('.ds-menu__label');
    const description = box('.ds-menu__description');
    const shortcut = box('.ds-menu__shortcut');
    return { below: description.top >= label.bottom - 1, end: shortcut.left >= description.right - 1, inside: shortcut.right <= row.getBoundingClientRect().right, name: row.textContent.replace(/\s+/g, ' ').trim(), keys: row.getAttribute('aria-keyshortcuts') };
  });
  expect(parts).toMatchObject({ below: true, end: true, inside: true, keys: 'Control+E' });
  expect(parts.name).toContain('Download');
  await page.keyboard.press('Escape');
  await settle(page);
  const danger = await page.evaluate(() => {
    const row = document.querySelector('.ds-menu__item--danger');
    const probe = document.createElement('i');
    probe.style.color = 'var(--ds-error)';
    row.parentElement.append(probe);
    const expected = getComputedStyle(probe).color;
    probe.remove();
    return { color: getComputedStyle(row).color, icon: getComputedStyle(row.querySelector('svg')).color, expected, word: row.textContent.trim(), background: getComputedStyle(row).backgroundColor };
  });
  expect(danger.color).toBe(danger.expected);
  expect(danger.icon).toBe(danger.expected);
  expect(danger.word).toBe('Delete device');
  expect(danger.background, 'no red fill').toBe('rgba(0, 0, 0, 0)');
});

test('names and roles; a blocked item stays focusable and does nothing', async ({ page }) => {
  await open(page);
  const trigger = page.locator('[data-demo="plain"]');
  await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  await trigger.click();
  await settle(page);
  await expect(page.getByRole('menu', { name: 'Actions' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
  const blocked = page.getByRole('menuitem', { name: 'Delete (needs admin rights)' });
  await expect(blocked).toHaveAttribute('aria-disabled', 'true');
  await blocked.focus();
  await expect(blocked).toBeFocused();
  await blocked.click({ force: true });
  await expect(page.locator('[data-demo="actions"]'), 'it stays open').toHaveAttribute('data-state', 'open');
  await page.keyboard.press('Escape');
  await settle(page);
  await page.locator('[data-demo="picks"]').click();
  await settle(page);
  await expect(page.getByRole('group', { name: 'Sort by' })).toBeVisible();
  await expect(page.getByRole('menuitemradio', { name: 'Name' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('menuitemcheckbox', { name: 'Compact rows' })).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Escape');
});

test('DS.menu: open, close and the controller', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(async () => {
    const menu = document.querySelector('[data-demo="actions"]');
    const trigger = document.querySelector('[data-demo="plain"]');
    const control = DS.menu.create(menu);
    const events = [];
    const off = control.on('open', (event) => events.push(['open', event.detail.opener === trigger]));
    control.on('close', (event) => events.push(['close', event.detail.reason]));
    const first = control.get();
    await DS.menu.open(menu, { opener: trigger });
    const opened = control.get();
    await DS.menu.close(menu);
    const closed = control.get();
    off();
    await control.set(true, { opener: trigger });
    await control.set(false, { reason: 'done' });
    control.destroy();
    return { first, opened, closed, events };
  });
  expect(seen).toEqual({ first: false, opened: true, closed: false, events: [['open', true], ['close', 'api'], ['close', 'done']] });
});

test('forced colours: the menu keeps its edge, the focused item its ring, a blocked item GrayText, the shades go', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await page.locator('[data-demo="plain"]').click();
  await settle(page);
  const styles = await page.evaluate(() => {
    const menu = document.querySelector('[data-demo="actions"]');
    const blocked = menu.querySelector('[aria-disabled="true"]');
    const probe = document.createElement('i');
    probe.style.color = 'GrayText';
    menu.append(probe);
    const gray = getComputedStyle(probe).color;
    probe.remove();
    return { edge: getComputedStyle(menu).outlineColor, blocked: getComputedStyle(blocked).color, gray, shade: getComputedStyle(menu, '::before').display };
  });
  expect(styles.edge).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
  expect(styles.blocked).toBe(styles.gray);
  expect(styles.shade).toBe('none');
  await page.keyboard.press('Escape');
});

test('submenus: ArrowRight opens one on its first item beside its item, ArrowLeft and Escape close it onto the item', async ({ page }) => {
  await open(page);
  const trigger = page.locator('[data-demo="nested"]');
  const menu = page.locator('[data-demo="nested-menu"]');
  const sub = page.locator('[data-demo="move-menu"]');
  const item = page.locator('[data-demo="move-item"]');
  await trigger.click();
  await expect(menu).toHaveAttribute('data-state', 'open');
  await page.keyboard.press('ArrowDown');
  expect(await focused(page)).toBe('Move to');
  // The arrows of the parent pass the submenu's items by.
  await page.keyboard.press('ArrowDown');
  expect(await focused(page)).toBe('Archive');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowRight');
  await expect(sub).toHaveAttribute('data-state', 'open');
  await expect(item).toHaveAttribute('aria-expanded', 'true');
  expect(await focused(page)).toBe('Storage room');
  await settle(page);
  const geometry = await page.evaluate(() => {
    const it = document.querySelector('[data-demo="move-item"]').getBoundingClientRect();
    const box = document.querySelector('[data-demo="move-menu"]');
    const first = box.querySelector('.ds-menu__item').getBoundingClientRect();
    return { beside: box.getBoundingClientRect().left >= it.right - 1, level: Math.abs(first.top - it.top), top: box.matches(':popover-open'), placement: box.getAttribute('data-placement') };
  });
  expect(geometry.beside).toBe(true);
  expect(geometry.level).toBeLessThan(2);
  expect(geometry.top).toBe(true);
  expect(geometry.placement).toBe('end');
  await page.keyboard.press('ArrowLeft');
  await expect(sub).toHaveAttribute('data-state', 'closed');
  expect(await focused(page)).toBe('Move to');
  await expect(menu).toHaveAttribute('data-state', 'open');
  // Enter opens it too; Escape closes only the submenu.
  await page.keyboard.press('Enter');
  await expect(sub).toHaveAttribute('data-state', 'open');
  expect(await focused(page)).toBe('Storage room');
  await page.keyboard.press('Escape');
  await expect(sub).toBeHidden();
  await expect(menu).toHaveAttribute('data-state', 'open');
  expect(await focused(page)).toBe('Move to');
  // A nested one, then Tab closes the whole chain and moves on from the trigger.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('End');
  expect(await focused(page)).toBe('A person');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-demo="share-menu"]')).toHaveAttribute('data-state', 'open');
  await page.keyboard.press('Tab');
  await expect(menu).toBeHidden();
  await expect(sub).toBeHidden();
  await expect(page.locator('[data-demo="share-menu"]')).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('submenus: an item chosen inside closes the whole chain, focus back on the trigger', async ({ page }) => {
  await open(page);
  const trigger = page.locator('[data-demo="nested"]');
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-demo="nested-menu"]')).toBeHidden();
  await expect(page.locator('[data-demo="move-menu"]')).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator('.ds-toast').last()).toContainText('storage room');
});

test('submenus: a resting pointer opens one and leaves focus; another item closes it after the grace, unless the pointer reaches it', async ({ page }) => {
  await open(page);
  await page.locator('[data-demo="nested"]').click();
  const menu = page.locator('[data-demo="nested-menu"]');
  const sub = page.locator('[data-demo="move-menu"]');
  await expect(menu).toHaveAttribute('data-state', 'open');
  await settle(page);
  await page.locator('[data-demo="move-item"]').hover();
  await expect(sub).toHaveAttribute('data-state', 'open');
  expect(await focused(page), 'focus stays in the parent').not.toBe('Storage room');
  await settle(page);
  // Across "Archive" into the submenu: it stays.
  const archive = await page.locator('[data-demo="nested-menu"] > .ds-menu__item').nth(2).boundingBox();
  const target = await sub.locator('.ds-menu__item').nth(1).boundingBox();
  await page.mouse.move(archive.x + archive.width - 4, archive.y + archive.height / 2);
  await page.mouse.move(target.x + 10, target.y + target.height / 2, { steps: 3 });
  await page.waitForTimeout(600);
  await expect(sub).toHaveAttribute('data-state', 'open');
  // Resting on another item: it goes.
  await page.mouse.move(archive.x + 20, archive.y + archive.height / 2);
  await expect(sub).toBeHidden();
  await expect(menu).toHaveAttribute('data-state', 'open');
  // A click on the item opens it as well, and the menu stays.
  await page.locator('[data-demo="move-item"]').click();
  await expect(sub).toHaveAttribute('data-state', 'open');
  await expect(menu).toHaveAttribute('data-state', 'open');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
});

test('search: it takes focus, typing filters and says when nothing matches, the arrows and Enter work from the field, Escape clears first', async ({ page }) => {
  await open(page);
  const trigger = page.locator('[data-demo="assign"]');
  const menu = page.locator('[data-demo="assign-menu"]');
  await trigger.click();
  await expect(menu).toHaveAttribute('data-state', 'open');
  const field = menu.locator('.ds-menu__search input');
  await expect(field).toBeFocused();
  await page.keyboard.type('gr');
  await expect(menu.locator('.ds-menu__item:visible')).toHaveCount(1);
  await expect(menu.locator('.ds-menu__item:visible')).toContainText('Grace Hopper');
  await page.keyboard.press('ArrowDown');
  expect(await focused(page)).toBe('Grace Hopper');
  await page.keyboard.press('ArrowUp');
  await expect(field).toBeFocused();
  await page.keyboard.type('zz');
  await expect(menu.locator('.ds-menu__item:visible')).toHaveCount(0);
  await expect(menu.locator('.ds-menu__empty')).toHaveText('No results');
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('[aria-live]')].map((node) => node.textContent).join(' '))).toContain('No results');
  // The first Escape clears the field, the second closes.
  await page.keyboard.press('Escape');
  await expect(field).toHaveValue('');
  await expect(menu).toHaveAttribute('data-state', 'open');
  await expect(menu.locator('.ds-menu__empty')).toBeHidden();
  await expect(menu.locator('.ds-menu__item:visible')).toHaveCount(12);
  // A letter typed on an item goes on in the field; Enter takes the first match.
  await page.keyboard.press('ArrowDown');
  await page.keyboard.type('hed');
  await expect(field).toBeFocused();
  await expect(field).toHaveValue('hed');
  await page.keyboard.press('Enter');
  await expect(menu).toBeHidden();
  await expect(page.locator('.ds-toast').last()).toContainText('Hedy Lamarr');
  // Opened again, it starts unfiltered.
  await trigger.click();
  await expect(field).toHaveValue('');
  await expect(menu.locator('.ds-menu__item:visible')).toHaveCount(12);
  await page.keyboard.press('Escape');
});

test('context menu: a right click opens it at the pointer, the row is told and gets focus back; a press anywhere outside closes it', async ({ page }) => {
  await open(page);
  const rows = page.locator('[data-demo="rows"] [data-ds-contextmenu]');
  const menu = page.locator('[data-demo="context-menu"]');
  const row = rows.nth(1);
  await row.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const box = await row.boundingBox();
  await row.focus();
  await page.mouse.click(box.x + 60, box.y + box.height / 2, { button: 'right' });
  await expect(menu).toHaveAttribute('data-state', 'open');
  await expect(menu.locator('[data-row-name]')).toHaveText('LAPTOP-0043');
  expect(await row.getAttribute('aria-expanded'), 'a row is no menu button').toBeNull();
  await settle(page);
  const at = await menu.boundingBox();
  expect(at.x).toBeCloseTo(box.x + 60, 0);
  expect(at.y).toBeCloseTo(box.y + box.height / 2, 0);
  expect(await menu.evaluate((el) => el.matches(':popover-open'))).toBe(true);
  expect(await focused(page)).toBe('Rename');
  // A press on its own row closes it too.
  await page.mouse.click(box.x + 300, box.y + box.height / 2);
  await expect(menu).toBeHidden();
  // Choosing an item: the page knows the row; focus goes back to it.
  await page.mouse.click(box.x + 60, box.y + box.height / 2, { button: 'right' });
  await expect(menu).toHaveAttribute('data-state', 'open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(menu).toBeHidden();
  await expect(page.locator('.ds-toast').last()).toContainText('Duplicated LAPTOP-0043');
  await expect(row).toBeFocused();
  expect(await row.getAttribute('aria-expanded')).toBeNull();
  // A cancelled ds:contextmenu keeps the browser's menu: nothing opens.
  await page.evaluate(() => document.addEventListener('ds:contextmenu', (event) => event.preventDefault(), { once: true }));
  await page.mouse.click(box.x + 60, box.y + box.height / 2, { button: 'right' });
  await page.waitForTimeout(200);
  await expect(menu).toBeHidden();
});

test('context menu: Shift+F10 and the ContextMenu key open it under the focused row', async ({ page }) => {
  await open(page);
  const row = page.locator('[data-demo="rows"] [data-ds-contextmenu]').first();
  const menu = page.locator('[data-demo="context-menu"]');
  await row.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await focusByKeyboard(page, row);
  await page.keyboard.press('Shift+F10');
  await expect(menu).toHaveAttribute('data-state', 'open');
  await expect(menu.locator('[data-row-name]')).toHaveText('LAPTOP-0042');
  expect(await focused(page)).toBe('Rename');
  await settle(page);
  const [rowBox, menuBox] = [await row.boundingBox(), await menu.boundingBox()];
  expect(menuBox.y).toBeGreaterThanOrEqual(rowBox.y + rowBox.height - 1);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(row).toBeFocused();
  await page.keyboard.press('ContextMenu');
  await expect(menu).toHaveAttribute('data-state', 'open');
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
});

test('context menu: a long press on a touch screen opens it at the finger, and the click it ends in never comes', async ({ page, browserName }) => {
  test.skip(browserName === 'firefox', 'Firefox has no touch events in Playwright without hasTouch');
  await open(page);
  const row = page.locator('[data-demo="rows"] [data-ds-contextmenu]').nth(2);
  const menu = page.locator('[data-demo="context-menu"]');
  await row.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const box = await row.boundingBox();
  const x = box.x + 40;
  const y = box.y + box.height / 2;
  const clicks = await page.evaluate(() => {
    window.rowClicks = 0;
    document.addEventListener('click', (event) => { if (event.target.closest?.('[data-ds-contextmenu]')) window.rowClicks += 1; });
    return 0;
  });
  // A pointer press by touch, held past the delay, through the pointer events the browser sends.
  await row.evaluate((el, [px, py]) => {
    const init = { bubbles: true, cancelable: true, composed: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: px, clientY: py };
    el.dispatchEvent(new PointerEvent('pointerdown', init));
    window.releaseTouch = () => {
      el.dispatchEvent(new PointerEvent('pointerup', init));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: px, clientY: py }));
    };
  }, [x, y]);
  await expect(menu).toHaveAttribute('data-state', 'open', { timeout: 3000 });
  await row.evaluate(() => window.releaseTouch());
  expect(await page.evaluate(() => window.rowClicks)).toBe(clicks);
  await expect(menu.locator('[data-row-name]')).toHaveText('PRINTER-0007');
  await settle(page);
  const at = await menu.boundingBox();
  expect(at.x).toBeCloseTo(x, 0);
  // A press that moves is a scroll: nothing opens.
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await row.evaluate((el, [px, py]) => {
    const init = { bubbles: true, cancelable: true, composed: true, pointerId: 8, pointerType: 'touch', isPrimary: true, clientX: px, clientY: py };
    el.dispatchEvent(new PointerEvent('pointerdown', init));
    el.dispatchEvent(new PointerEvent('pointermove', { ...init, clientY: py + 30 }));
  }, [x, y]);
  await page.waitForTimeout(900);
  await expect(menu).toBeHidden();
});

test('forced colours: an item whose submenu shows is Highlight on HighlightText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await page.locator('[data-demo="nested"]').click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-demo="move-menu"]')).toHaveAttribute('data-state', 'open');
  await settle(page);
  const styles = await page.evaluate(() => {
    const item = document.querySelector('[data-demo="move-item"]');
    const probe = document.createElement('span');
    probe.style.cssText = 'background: Highlight; color: HighlightText';
    document.body.append(probe);
    const system = { background: getComputedStyle(probe).backgroundColor, color: getComputedStyle(probe).color };
    probe.remove();
    return { background: getComputedStyle(item).backgroundColor, color: getComputedStyle(item).color, system };
  });
  expect(styles.background).toBe(styles.system.background);
  expect(styles.color).toBe(styles.system.color);
});
