/**
 * Tabs on the options model (3.0), on their demo: the height at every size x
 * density, with and without .ds-touch; the shape on the ring, the layer, the
 * press and the contained tray; the contained look (the row's height, the
 * pill gliding); vertical (the bar at its end, Up and Down, the columns
 * folding at 600px of the content); counts and icons with data-label; tabs
 * that close (room, click, Delete, focus); names; forced colours. The 2.x
 * behaviour stays in test/browser/tabs.spec.js. Runs in the `fallback`
 * project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

const URL = '/test/browser/fixtures/component.html?c=tabs';
const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page, width = 1280) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(URL);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

const finish = (page, selector) => page.$eval(selector, (el) => Promise.all(el.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => null))).then(() => undefined));

test('the height at every size x density, .ds-touch as a minimum; side padding by size; type by size at the regular weight', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const out = [];
    const host = document.createElement('div');
    document.querySelector('#fx-component').append(host);
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const row = document.createElement('div');
          row.className = `ds-tabs ${size} ${density}${touch ? ' ds-touch' : ''}`;
          row.innerHTML = '<button class="ds-tabs__tab" type="button" role="tab" aria-selected="false">Details</button>';
          host.append(row);
          const tab = row.firstElementChild;
          const style = getComputedStyle(tab);
          out.push({ touch, density, size, height: tab.getBoundingClientRect().height, pad: parseFloat(style.paddingInlineStart), line: parseFloat(style.lineHeight), font: parseFloat(style.fontSize), weight: style.fontWeight });
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
    expect(entry.height, name).toBeCloseTo(Math.max(entry.touch ? TOUCH : 0, 48 + step * 8 + density * 4, entry.line), 0);
    expect(entry.pad, `${name} padding`).toBe(16 + step * 4);
    expect(entry.weight, `${name} weight`).toBe('400');
  }
  const fonts = Object.fromEntries(measured.filter((entry) => !entry.touch && entry.density === 'ds-density-comfortable').map((entry) => [entry.size, entry.font]));
  expect(fonts).toEqual({ 'ds-xs': 12, 'ds-sm': 14, 'ds-md': 14, 'ds-lg': 16, 'ds-xl': 16 });
});

test('shape: the ring\'s radius and the layer, at rest and pressed; a square shape has square corners', async ({ page }) => {
  await open(page);
  const tab = '[aria-label="Device"] .ds-tabs__tab:nth-of-type(2)';
  for (const [shape, factor] of [['ds-shape-square', 0], ['ds-shape-soft', 0.5], ['ds-shape-default', 1], ['ds-shape-round', 1.5]]) {
    await page.$eval('[aria-label="Device"]', (el, name) => { el.className = el.className.replace(/\bds-shape-\w+/g, ''); el.classList.add(name); }, shape);
    await finish(page, tab);
    const read = () => page.$eval(tab, (el) => [parseFloat(getComputedStyle(el).borderTopLeftRadius), parseFloat(getComputedStyle(el, '::before').borderTopLeftRadius)]);
    const [ring, layer] = await read();
    expect(ring, `${shape} ring`).toBe(Math.min(24 * factor, 24));
    expect(layer, `${shape} layer`).toBe(Math.min(20 * factor, 20));
    await page.$eval(tab, (el) => el.classList.add('ds-pressed'));
    await finish(page, tab);
    const pressed = (await read())[1];
    expect(pressed, `${shape} pressed`).toBe(Math.min(12 * factor, 20));
    await page.$eval(tab, (el) => el.classList.remove('ds-pressed'));
    await finish(page, tab);
  }
});

test('contained: a tray as high as a line row, the selected tab a surface pill that glides inside it', async ({ page }) => {
  await open(page);
  const tray = page.locator('.ds-tabs--contained').first();
  const line = page.locator('[aria-label="Device"]');
  const geometry = await tray.evaluate((el) => {
    const tab = el.querySelector('[role="tab"]');
    const rect = el.getBoundingClientRect();
    return { row: rect.height, tab: tab.getBoundingClientRect().height, width: rect.width, parent: el.parentElement.getBoundingClientRect().width, before: parseFloat(getComputedStyle(tab, '::before').top), radius: parseFloat(getComputedStyle(el).borderTopLeftRadius), hairline: parseFloat(getComputedStyle(el).borderBottomWidth) };
  });
  const lineHeight = await line.evaluate((el) => el.getBoundingClientRect().height);
  expect(geometry.row).toBe(lineHeight - 1);
  expect(geometry.tab).toBe(40);
  expect(geometry.width).toBeLessThan(geometry.parent);
  expect(geometry.before).toBe(0);
  expect(geometry.radius).toBe(24);
  expect(geometry.hairline).toBe(0);
  const colour = (selector) => tray.locator(selector).first().evaluate((el) => getComputedStyle(el).backgroundColor);
  const surface = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.backgroundColor = 'var(--ds-surface)';
    document.querySelector('.ds-theme').append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  });
  expect(await colour('.ds-tabs__indicator')).toBe(surface);
  expect(await colour('[aria-selected="true"]')).toBe('rgba(0, 0, 0, 0)');
  // The pill lands on the next tab, at its size and with its radius.
  await tray.locator('[role="tab"]').nth(1).click();
  await settle(page);
  const landed = await tray.evaluate((el) => {
    const pill = el.querySelector('.ds-tabs__indicator');
    const tab = el.querySelector('[aria-selected="true"]').getBoundingClientRect();
    const rect = pill.getBoundingClientRect();
    return { left: Math.abs(rect.left - tab.left), width: Math.abs(rect.width - tab.width), radius: parseFloat(getComputedStyle(pill).getPropertyValue('--ds-indicator-radius')) };
  });
  expect(landed.left).toBeLessThan(1);
  expect(landed.width).toBeLessThan(1);
  expect(landed.radius).toBe(20);
  // Without the indicator the tab paints the pill itself.
  await page.evaluate(() => {
    const row = document.createElement('div');
    row.className = 'ds-tabs ds-tabs--contained';
    row.id = 'plain-contained';
    row.innerHTML = '<button class="ds-tabs__tab" type="button" role="tab" aria-selected="true">Day</button>';
    document.querySelector('#fx-component').append(row);
  });
  expect(await page.$eval('#plain-contained [role="tab"]', (el) => getComputedStyle(el).backgroundColor)).toBe(surface);
  // The shape reaches the tray and the pill.
  await tray.evaluate((el) => el.classList.add('ds-shape-square'));
  expect(await tray.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBe(0);
  await settle(page);
  expect(await tray.locator('.ds-tabs__indicator').evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue('--ds-indicator-radius')))).toBe(0);
});

test('vertical: a column with the bar at its end, Up and Down move, the columns fold at 600px of the content', async ({ page }) => {
  await open(page);
  const list = page.locator('.ds-tabs--vertical');
  await expect(list).toHaveAttribute('aria-orientation', 'vertical');
  const geometry = await list.evaluate((el) => {
    const tabs = [...el.querySelectorAll('[role="tab"]')].map((tab) => tab.getBoundingClientRect());
    const style = getComputedStyle(el);
    return {
      stacked: tabs[1].top >= tabs[0].bottom,
      left: new Set(tabs.map((tab) => tab.left)).size,
      end: parseFloat(style.borderRightWidth),
      bottom: parseFloat(style.borderBottomWidth),
      position: getComputedStyle(el.querySelector('.ds-tabs__indicator')).backgroundPositionX,
      justify: getComputedStyle(el.querySelector('[role="tab"]')).justifyContent,
    };
  });
  expect(geometry.stacked).toBe(true);
  expect(geometry.left).toBe(1);
  expect(geometry.end).toBe(1);
  expect(geometry.bottom).toBe(0);
  expect(geometry.position).toBe('100%');
  expect(geometry.justify).toBe('start');

  const tabs = list.locator('[role="tab"]');
  await focusByKeyboard(page, tabs.first());
  await page.keyboard.press('ArrowDown');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await settle(page);
  const pill = await list.evaluate((el) => {
    const box = el.querySelector('.ds-tabs__indicator').getBoundingClientRect();
    const tab = el.querySelector('[aria-selected="true"]').getBoundingClientRect();
    return Math.abs(box.top - tab.top);
  });
  expect(pill).toBeLessThan(1);
  await page.keyboard.press('ArrowUp');
  await expect(tabs.first()).toBeFocused();
  await page.keyboard.press('End');
  await expect(tabs.nth(2)).toBeFocused();

  // In a content container of 600px or less the columns fold.
  const columns = (width) => page.evaluate((inline) => {
    const wrap = document.createElement('div');
    wrap.className = 'ds-content';
    wrap.style.inlineSize = `${inline}px`;
    wrap.innerHTML = '<div class="ds-tabs__columns" id="fold"><div></div><div></div></div>';
    document.querySelector('#fx-component').append(wrap);
    const value = getComputedStyle(wrap.querySelector('#fold')).gridTemplateColumns.split(' ').length;
    wrap.remove();
    return value;
  }, width);
  expect(await columns(1000)).toBe(2);
  expect(await columns(500)).toBe(1);
});

test('counts and icons: a count reads with the label, data-label reserves the width under the text, so nothing moves', async ({ page }) => {
  await open(page);
  const row = page.locator('[aria-label="Inbox"]');
  await expect(row.getByRole('tab', { name: /^Waiting ?, 3$/ })).toHaveCount(1);
  const count = await row.locator('.ds-tabs__count').first().evaluate((el) => ({ font: parseFloat(getComputedStyle(el).fontSize), numeric: getComputedStyle(el).fontVariantNumeric }));
  expect(count).toEqual({ font: 12, numeric: 'tabular-nums' });
  const widths = () => row.locator('[role="tab"]').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
  const before = await widths();
  await row.locator('[role="tab"]').nth(1).click();
  await settle(page);
  expect(await widths()).toEqual(before);
  // The copy sits in the text's column, not the icon's: the icon's column stays the icon's width, and icon, text
  // and count sit on one line.
  const icon = await row.locator('[role="tab"]').first().evaluate((el) => {
    const svg = el.querySelector('svg').getBoundingClientRect();
    const count = el.querySelector('.ds-tabs__count').getBoundingClientRect();
    const range = document.createRange();
    range.selectNode([...el.childNodes].find((node) => node.nodeType === 3));
    const text = range.getBoundingClientRect();
    const middle = (rect) => rect.top + rect.height / 2;
    return { column: parseFloat(getComputedStyle(el).gridTemplateColumns.split(' ')[0]), svg: svg.width, line: Math.abs(middle(svg) - middle(text)), count: Math.abs(middle(count) - middle(text)), order: svg.right <= text.left && text.right <= count.left };
  });
  expect(icon.column).toBe(icon.svg);
  expect(icon.line).toBeLessThan(2);
  expect(icon.count).toBeLessThan(2);
  expect(icon.order).toBe(true);
});

test('tabs that close: room for the button, a click and Delete close, the focus and the selection move on', async ({ page }) => {
  await open(page);
  const row = page.locator('[aria-label="Open reports"]');
  const geometry = await row.locator('.ds-tabs__item').first().evaluate((el) => {
    const tab = el.querySelector('[role="tab"]').getBoundingClientRect();
    const close = el.querySelector('.ds-tabs__close').getBoundingClientRect();
    const text = el.querySelector('[role="tab"]');
    return { inside: close.right <= tab.right && close.left >= tab.left, room: parseFloat(getComputedStyle(text).paddingInlineEnd), size: close.width, wrapper: getComputedStyle(el).display };
  });
  expect(geometry).toEqual({ inside: true, room: 24 + 8, size: 24, wrapper: 'grid' });
  const closeButtons = row.locator('.ds-tabs__close');
  expect(await closeButtons.first().evaluate((el) => el.tabIndex)).toBe(-1);
  // A tablist owns only tabs: the button is no part of the tree; Delete is told, a panel holds the named action.
  await expect(closeButtons).toHaveCount(3);
  await expect(row.getByRole('button')).toHaveCount(0);
  await expect(row.getByRole('tab', { name: 'April' })).toHaveAttribute('aria-keyshortcuts', 'Delete');
  await expect(page.getByRole('tabpanel', { name: 'March' }).getByRole('button', { name: 'Close March' })).toBeVisible();

  // A click on the close button of a tab that is not selected keeps the selection, and the focus lands on it.
  await closeButtons.nth(1).click();
  await expect(row.locator('[role="tab"]')).toHaveCount(2);
  await expect(row.getByRole('tab', { name: 'March' })).toHaveAttribute('aria-selected', 'true');
  await expect(row.getByRole('tab', { name: 'March' })).toBeFocused();

  // Delete on the selected tab: the next one takes the selection and the focus.
  const march = row.getByRole('tab', { name: 'March' });
  await focusByKeyboard(page, march);
  await page.keyboard.press('Delete');
  await expect(row.locator('[role="tab"]')).toHaveCount(1);
  const may = row.getByRole('tab', { name: 'May' });
  await expect(may).toHaveAttribute('aria-selected', 'true');
  await expect(may).toBeFocused();
  await expect(page.locator(`#${await may.getAttribute('aria-controls')}`)).toBeVisible();

  // The last tab stays, also from its panel's action.
  await page.getByRole('tabpanel', { name: 'May' }).getByRole('button', { name: 'Close May' }).click();
  await expect(row.locator('[role="tab"]')).toHaveCount(1);
  // ... and from its close button: the press never leaves the focus on that aria-hidden button.
  await closeButtons.first().click();
  await expect(row.locator('[role="tab"]')).toHaveCount(1);
  expect(await closeButtons.first().evaluate((el) => el.contains(document.activeElement))).toBe(false);

  // Under .ds-touch the button is a finger's target and the tab keeps room for it.
  await row.evaluate((el) => el.classList.add('ds-touch'));
  const touch = await row.locator('.ds-tabs__item').first().evaluate((el) => [el.querySelector('.ds-tabs__close').getBoundingClientRect().height, parseFloat(getComputedStyle(el.querySelector('[role="tab"]')).paddingInlineEnd)]);
  expect(touch).toEqual([48, 48 + 8]);
});

test('the panel\'s close action closes its tab, and the focus and the selection move on', async ({ page }) => {
  await open(page);
  const row = page.locator('[aria-label="Open reports"]');
  await page.getByRole('tabpanel', { name: 'March' }).getByRole('button', { name: 'Close March' }).click();
  await expect(row.locator('[role="tab"]')).toHaveCount(2);
  const april = row.getByRole('tab', { name: 'April' });
  await expect(april).toHaveAttribute('aria-selected', 'true');
  await expect(april).toBeFocused();
});

test('--fill shares the row, wrappers included', async ({ page }) => {
  await open(page);
  const widths = await page.locator('.ds-tabs--fill [role="tab"]').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().width)));
  expect(new Set(widths).size).toBe(1);
  const wrapped = await page.evaluate(() => {
    const row = document.createElement('div');
    row.className = 'ds-tabs ds-tabs--fill';
    row.innerHTML = '<span class="ds-tabs__item"><button class="ds-tabs__tab" type="button" role="tab" aria-selected="true">One</button></span><span class="ds-tabs__item"><button class="ds-tabs__tab" type="button" role="tab" aria-selected="false">Two more</button></span>';
    document.querySelector('#fx-component').append(row);
    return [...row.children].map((el) => Math.round(el.getBoundingClientRect().width));
  });
  expect(wrapped[0]).toBe(wrapped[1]);
});

test('keyboard and names: one stop for ARIA tabs, a stop per link; Tab goes on to the panel; a disabled tab keeps its panel', async ({ page }) => {
  await open(page);
  const row = page.getByRole('tablist', { name: 'Device', exact: true });
  const tabs = row.getByRole('tab');
  await focusByKeyboard(page, tabs.first());
  expect(await tabs.evaluateAll((els) => els.filter((el) => el.tabIndex === 0).length)).toBe(1);
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(2)).toBeFocused();
  await expect(tabs.nth(2), 'aria-disabled takes the focus, not the selection').toHaveAttribute('aria-selected', 'false');
  await page.keyboard.press('Home');
  await expect(tabs.first()).toBeFocused();
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('tabpanel', { name: 'Details' }).first()).toBeFocused();

  const panel = await tabs.first().getAttribute('aria-controls');
  await expect(page.locator(`#${panel}`)).toHaveAttribute('aria-labelledby', await tabs.first().getAttribute('id'));
  const links = page.getByRole('navigation', { name: 'Device pages' }).getByRole('link');
  await expect(links.first()).toHaveAttribute('aria-current', 'page');
  expect(await links.evaluateAll((els) => els.every((el) => el.tabIndex === 0))).toBe(true);
});

test('forced colours: the selected tab SelectedItem, also contained, blocked GrayText, the tray keeps an edge, the indicator gone', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const system = await page.evaluate(() => {
    const probe = (property, value) => {
      const el = document.createElement('span');
      el.style.forcedColorAdjust = 'none';
      el.style[property] = value;
      document.querySelector('.ds-theme').append(el);
      const colour = getComputedStyle(el)[property];
      el.remove();
      return colour;
    };
    return { item: probe('backgroundColor', 'SelectedItem'), text: probe('color', 'SelectedItemText'), gray: probe('color', 'GrayText') };
  });
  const look = (selector) => page.locator(selector).first().evaluate((el) => ({ background: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }));
  for (const row of ['[aria-label="Device"]', '.ds-tabs--contained', '.ds-tabs--vertical']) {
    expect(await look(`${row} [aria-selected="true"]`), row).toEqual({ background: system.item, color: system.text });
    expect(await page.locator(`${row} .ds-tabs__indicator`).first().evaluate((el) => getComputedStyle(el).display), row).toBe('none');
  }
  expect((await look('[aria-label="Device"] [aria-disabled="true"]')).color).toBe(system.gray);
  expect(await page.locator('.ds-tabs--contained').first().evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  // A close button lying over the selected fill takes that fill's ink; on an unselected tab it keeps the forced one.
  const closes = page.locator('[aria-label="Open reports"] .ds-tabs__close');
  expect((await closes.first().evaluate((el) => getComputedStyle(el).color))).toBe(system.text);
  expect((await closes.first().locator('svg').evaluate((el) => getComputedStyle(el).color))).toBe(system.text);
  expect(await closes.first().evaluate((el) => getComputedStyle(el).forcedColorAdjust)).toBe('none');
  expect(await closes.nth(1).evaluate((el) => getComputedStyle(el).forcedColorAdjust)).toBe('auto');
});

test('compact theme: a tab 40px as in 2.x, a contained tray as high', async ({ page }) => {
  await open(page);
  await page.addStyleTag({ url: '/dist/themes/compact.css' });
  expect(await page.locator('[aria-label="Device"] [role="tab"]').first().evaluate((el) => el.getBoundingClientRect().height)).toBe(40);
  expect(await page.locator('.ds-tabs--contained').first().evaluate((el) => el.getBoundingClientRect().height)).toBe(40);
});

test('the ripple box lies over the layer: a line tab inset, a contained tab flush, the radius follows the shape', async ({ page }) => {
  await open(page);
  const tenth = (value) => Math.round(value * 10) / 10;
  const measure = async (locator) => {
    const box = await locator.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    const ripple = locator.locator('.ds-press-ripple').first();
    await expect(ripple).toHaveCount(1);
    const geometry = await ripple.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const host = el.parentElement.getBoundingClientRect();
      return { top: rect.top - host.top, bottom: host.bottom - rect.bottom, height: rect.height, hostHeight: host.height, radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) };
    });
    await page.mouse.up();
    await page.mouse.move(1, 1);
    await settle(page);
    return Object.fromEntries(Object.entries(geometry).map(([key, value]) => [key, tenth(value)]));
  };
  const line = page.locator('[aria-label="Device"] [role="tab"]').nth(1);
  expect(await measure(line)).toEqual({ top: 4, bottom: 4, height: 40, hostHeight: 48, radius: 20 });
  const tray = page.locator('.ds-tabs--contained').first();
  const contained = tray.locator('[role="tab"]').nth(1);
  expect(await measure(contained)).toEqual({ top: 0, bottom: 0, height: 40, hostHeight: 40, radius: 20 });
  await tray.evaluate((el) => el.classList.add('ds-shape-square'));
  await settle(page);
  expect(await measure(contained)).toEqual({ top: 0, bottom: 0, height: 40, hostHeight: 40, radius: 0 });
});

test('overflow: the tabs that do not fit fold into More, its menu lists them with their counts, a choice selects and keeps the selected tab in the row', async ({ page }) => {
  await open(page);
  const bar = page.locator('.ds-tabs__bar').filter({ has: page.locator('[aria-label="Queues"]') });
  const row = bar.locator('[role="tablist"]');
  const more = bar.locator('.ds-tabs__more');
  // Wide enough: nothing folds and More stays away.
  await bar.evaluate((el) => { el.style.inlineSize = '1200px'; });
  await expect(more).toBeHidden();
  await expect(row.locator('[role="tab"]:visible')).toHaveCount(8);
  // Narrow: the bar's own width decides (a ResizeObserver), not the window's.
  await bar.evaluate((el) => { el.style.inlineSize = '360px'; });
  await expect(more).toBeVisible();
  await expect(more).toHaveAccessibleName('More tabs');
  await expect(more).toHaveAttribute('aria-haspopup', 'menu');
  const shown = await row.locator('[role="tab"]:visible').count();
  expect(shown).toBeGreaterThan(0);
  expect(shown).toBeLessThan(8);
  const fits = await bar.evaluate((el) => {
    const list = el.querySelector('[role="tablist"]');
    const button = el.querySelector('.ds-tabs__more');
    return { row: list.scrollWidth <= list.clientWidth + 1, inside: button.getBoundingClientRect().right <= el.getBoundingClientRect().right + 0.5 };
  });
  expect(fits).toEqual({ row: true, inside: true });

  // The menu: one item per folded tab, its count read with it; DS.overlay opens it and Escape returns the focus.
  await focusByKeyboard(page, more);
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu', { name: 'More tabs' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem')).toHaveCount(8 - shown);
  await expect(menu.getByRole('menuitem', { name: /^Closed/ })).toContainText('140');
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(more).toBeFocused();

  // A choice selects its tab: it comes into the row (an earlier one folds instead), takes the focus and shows its panel.
  await more.click();
  await menu.getByRole('menuitem', { name: /^Closed/ }).click();
  await expect(menu).toBeHidden();
  const closed = row.getByRole('tab', { name: /^Closed/ });
  await expect(closed).toBeVisible();
  await expect(closed).toHaveAttribute('aria-selected', 'true');
  await expect(closed).toBeFocused();
  await expect(page.locator(`#${await closed.getAttribute('aria-controls')}`)).toBeVisible();
  await expect(row.getByRole('tab', { name: /^Open/ })).toBeVisible();
  // Wide again: every tab comes back, More goes.
  await bar.evaluate((el) => { el.style.inlineSize = '1200px'; });
  await expect(more).toBeHidden();
  await expect(row.locator('[role="tab"]:visible')).toHaveCount(8);
});

test('adding: the add button sends ds:add, add() writes a tab that closes, selects it and moves the focus', async ({ page }) => {
  await open(page);
  const bar = page.locator('.ds-tabs__bar').filter({ has: page.locator('[aria-label="Drafts"]') });
  const row = bar.getByRole('tablist');
  const add = bar.getByRole('button', { name: 'New report' });
  await expect(add).toBeVisible();
  const events = await page.evaluate(() => {
    window.__adds = 0;
    document.addEventListener('ds:add', () => { window.__adds += 1; });
  });
  expect(events).toBeUndefined();
  await add.click();
  expect(await page.evaluate(() => window.__adds)).toBe(1);
  await expect(row.getByRole('tab')).toHaveCount(3);
  const added = row.getByRole('tab').nth(2);
  await expect(added).toHaveAttribute('aria-selected', 'true');
  await expect(added).toBeFocused();
  await expect(added).toHaveAttribute('aria-keyshortcuts', 'Delete');
  const panel = page.locator(`#${await added.getAttribute('aria-controls')}`);
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('role', 'tabpanel');
  await expect(panel).toHaveAttribute('aria-labelledby', await added.getAttribute('id'));
  // The panel holds the named close action, after the page's content: the one way a screen reader on a touch screen closes it.
  const label = await added.getAttribute('data-label');
  const action = panel.getByRole('button', { name: `Close ${label}` });
  await expect(action).toBeVisible();
  await expect(action).toHaveAttribute('data-ds-tabs-close', '');
  expect(await panel.evaluate((el) => el.lastElementChild.matches('[data-ds-tabs-close]') && el.firstElementChild.matches('p'))).toBe(true);
  // Delete closes it again; the neighbour takes the selection and a screen reader hears it.
  await page.keyboard.press('Delete');
  await expect(row.getByRole('tab')).toHaveCount(2);
  await expect(row.getByRole('tab').nth(1)).toBeFocused();
  await expect(page.locator('[aria-live]').filter({ hasText: /closed$/ })).toHaveCount(1);
  // A second one closes from its panel's action.
  await add.click();
  await expect(row.getByRole('tab')).toHaveCount(3);
  const second = row.getByRole('tab').nth(2);
  const secondPanel = page.locator(`#${await second.getAttribute('aria-controls')}`);
  await secondPanel.getByRole('button', { name: `Close ${await second.getAttribute('data-label')}` }).click();
  await expect(row.getByRole('tab')).toHaveCount(2);
  await expect(secondPanel).toHaveCount(0);
});

test('the behaviour: ds:change with first, panels kept alive (fields and scroll), manual activation, get/set, destroy', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const host = document.createElement('div');
    host.innerHTML = '<div class="ds-tabs" role="tablist" aria-label="Kept" data-ds-tabs data-ds-tabs-activate="manual">' +
      '<button class="ds-tabs__tab" role="tab" type="button" id="k-a" aria-selected="true" aria-controls="k-pa" data-label="One">One</button>' +
      '<button class="ds-tabs__tab" role="tab" type="button" id="k-b" aria-selected="false" aria-controls="k-pb" data-label="Two">Two</button></div>' +
      '<div class="ds-tabs__panel" role="tabpanel" id="k-pa" aria-labelledby="k-a" tabindex="0"><input id="k-field" aria-label="Note"></div>' +
      '<div class="ds-tabs__panel" role="tabpanel" id="k-pb" aria-labelledby="k-b" tabindex="0">Two</div>';
    document.querySelector('#fx-component').append(host);
    DS.init(host);
    const list = host.querySelector('[role="tablist"]');
    const tabs = DS.get(list, 'tabs');
    const changes = [];
    list.addEventListener('ds:change', (event) => changes.push([event.detail.value, event.detail.first]));
    host.querySelector('#k-field').value = 'kept';
    tabs.set('k-b');
    const hidden = host.querySelector('#k-pa').hidden;
    tabs.set('k-a');
    tabs.set('k-b');
    const value = host.querySelector('#k-field').value;
    // Manual: the arrow keys move the focus, Enter selects.
    host.querySelector('#k-b').focus();
    host.querySelector('#k-b').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    const focused = document.activeElement.id;
    const stillSelected = tabs.get();
    tabs.destroy();
    tabs.destroy();
    return { changes, hidden, value, focused, stillSelected };
  });
  expect(result.changes).toEqual([['k-b', true], ['k-a', false], ['k-b', false]]);
  expect(result.hidden).toBe(true);
  expect(result.value).toBe('kept');
  expect(result.focused).toBe('k-a');
  expect(result.stillSelected).toBe('k-b');
});

test('narrow phone: the More menu keeps the row inside 360px, add and More stay reachable, touch targets hold', async ({ page }) => {
  await open(page, 390);
  const bar = page.locator('.ds-tabs__bar').filter({ has: page.locator('[aria-label="Drafts"]') });
  // Enough drafts to overflow on a phone.
  for (let index = 0; index < 4; index += 1) await bar.getByRole('button', { name: 'New report' }).click();
  await bar.evaluate((el) => el.classList.add('ds-touch'));
  const more = bar.locator('.ds-tabs__more');
  await expect(more).toBeVisible();
  const box = await bar.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const parts = [...el.querySelectorAll('.ds-tabs__more, .ds-tabs__add')].map((part) => part.getBoundingClientRect());
    return { right: rect.right, width: document.documentElement.clientWidth, parts: parts.map((part) => ({ right: part.right, height: part.height })) };
  });
  expect(box.right).toBeLessThanOrEqual(box.width);
  for (const part of box.parts) {
    expect(part.right).toBeLessThanOrEqual(box.right + 0.5);
    expect(part.height).toBeGreaterThanOrEqual(48);
  }
});
