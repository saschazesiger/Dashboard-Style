/**
 * The app frame on the options model (3.0), on its demo: drawer rows and the
 * segmented switch at every size x density, with and without .ds-touch
 * (touch wins, as a minimum); the shape on rows, the pill, the press, the
 * panel and the modal drawer; the avatar's sizes and its 2.x aliases; nested
 * groups (the indent is padding, the rail drops it); the pinned foot; the
 * rail (a toggle expands it, hover never does); the keyboard (skip link,
 * groups, the modal drawer); names; forced colours. The 2.x behaviour stays
 * in shell.spec, frame-2.spec, indicator.spec and overlay.spec. Runs in the
 * `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

/*
 * 3.0, DS.shell (from "the rail is remembered" on): the frame's behaviour on
 * its demo, the filter and the keys of the drawer, the phone search sheet,
 * the launcher, the bell, the account menu with the scheme switch and the
 * folding breadcrumbs, each with its keys, names and forced colours.
 */

const URL = '/test/browser/fixtures/component.html?c=shell';
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

/**
 * Every group of the demo open: what changes inside a closed group (skipped
 * content) starts transitions that Firefox never runs, and settle() would
 * wait for them.
 */
const openGroups = (page) => page.$$eval('[data-demo="list"] details', (els) => { for (const el of els) el.open = true; }).then(() => settle(page));

const finish = (page, selector) => page.$eval(selector, (el) => Promise.all(el.getAnimations().map((animation) => animation.finished.catch(() => null))).then(() => undefined));

test('a drawer row and the segmented switch at every size x density, .ds-touch as a minimum over both', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const out = [];
    const host = document.createElement('div');
    document.querySelector('#fx-component').append(host);
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const region = document.createElement('div');
          region.className = `${size} ${density}${touch ? ' ds-touch' : ''}`;
          region.innerHTML = '<div class="ds-drawer__group"><a class="ds-drawer__item" href="#"><span class="ds-drawer__label">Devices</span></a></div>'
            + '<details class="ds-drawer__group"><summary class="ds-drawer__heading ds-drawer__toggle"><span>Group</span></summary></details>'
            + '<div class="ds-segmented" role="group" aria-label="Mode"><button class="ds-segmented__option" type="button" aria-pressed="true">Live</button></div>';
          host.append(region);
          const item = region.querySelector('.ds-drawer__item');
          const toggle = region.querySelector('.ds-drawer__toggle');
          const track = region.querySelector('.ds-segmented');
          const option = region.querySelector('.ds-segmented__option');
          out.push({
            touch, density, size,
            item: item.getBoundingClientRect().height,
            toggle: toggle.getBoundingClientRect().height,
            line: parseFloat(getComputedStyle(item).lineHeight),
            track: track.getBoundingClientRect().height,
            pad: parseFloat(getComputedStyle(option).paddingInlineStart),
            font: parseFloat(getComputedStyle(item).fontSize),
            weight: getComputedStyle(item).fontWeight,
            toggleFont: parseFloat(getComputedStyle(toggle).fontSize),
            toggleWeight: getComputedStyle(toggle).fontWeight,
            radius: parseFloat(getComputedStyle(track).borderTopLeftRadius),
            optionLine: parseFloat(getComputedStyle(option).lineHeight),
          });
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
    const min = entry.touch ? TOUCH : 0;
    // A row: 48px at md and comfortable, 8px per size step, 4px per density step; never below its own line.
    const row = Math.max(min, 48 + step * 8 + density * 4, entry.line);
    expect(entry.item, `${name} item`).toBeCloseTo(row, 0);
    expect(entry.toggle, `${name} toggle`).toBeCloseTo(row, 0);
    // The switch: 32px at md and comfortable, the same steps, its 1px edges included.
    expect(entry.track, `${name} track`).toBeCloseTo(Math.max(min, 32 + step * 8 + density * 4, entry.optionLine + 2), 0);
    // A pill at every size and density: half of what it measures, whatever floors it.
    expect(entry.radius, `${name} radius`).toBeCloseTo(entry.track / 2, 0);
    // A group toggle is a row of the item's type, in the label weight.
    expect(entry.toggleFont, `${name} toggle font`).toBe(entry.font);
    expect(entry.toggleWeight, `${name} toggle weight`).toBe('500');
    expect(entry.pad, `${name} padding`).toBe(16 + step * 4);
    // Every size at the regular weight: only the current row is heavier.
    expect(entry.weight, `${name} weight`).toBe('400');
  }
  const fonts = Object.fromEntries(measured.filter((entry) => !entry.touch && entry.density === 'ds-density-comfortable').map((entry) => [entry.size, entry.font]));
  expect(fonts).toEqual({ 'ds-xs': 12, 'ds-sm': 14, 'ds-md': 14, 'ds-lg': 16, 'ds-xl': 16 });
});

test('the defaults keep the 2.x look: a 48px row, a 32px switch, a 32px avatar, a 64px bar', async ({ page }) => {
  await open(page);
  const size = (selector) => page.$eval(selector, (el) => el.getBoundingClientRect().height);
  expect(await size('[data-demo="list"] .ds-drawer__item')).toBe(48);
  expect(await size('nav[data-demo="segmented"]')).toBe(32);
  expect(await size('.ds-avatar.ds-md')).toBe(32);
  expect(await size('[data-demo="app"] > .ds-topbar')).toBe(64);
  expect(await page.$eval('[data-demo="list"] .ds-drawer__item[aria-current="page"]', (el) => getComputedStyle(el).fontWeight)).toBe('500');
});

test('density and size leave the frame alone: the bar, the column and the panel are layout', async ({ page }) => {
  await open(page);
  const frame = () => page.evaluate(() => {
    const app = document.querySelector('[data-demo="app"]');
    return [app.querySelector('.ds-topbar').getBoundingClientRect().height, app.querySelector('.ds-drawer').getBoundingClientRect().width, parseFloat(getComputedStyle(app.querySelector('.ds-panel')).marginRight)];
  });
  const before = await frame();
  await page.$eval('[data-demo="app"]', (el) => el.classList.add('ds-density-tight', 'ds-xs'));
  expect(await frame()).toEqual(before);
  expect(await page.$eval('[data-demo="list"] .ds-drawer__item', (el) => el.getBoundingClientRect().height)).toBe(48 - 16 - 12);
});

test('shape: rows, the pill, the press, the switch, the capsule, the panel and the avatar', async ({ page }) => {
  await open(page);
  await openGroups(page);
  for (const [shape, factor] of [['ds-shape-square', 0], ['ds-shape-soft', 0.5], ['ds-shape-default', 1], ['ds-shape-round', 1.5]]) {
    await page.$eval('.sg-demo-root', (el, name) => { el.className = el.className.replace(/\bds-shape-\w+/g, ''); el.classList.add(name); }, shape);
    await settle(page);
    const read = () => page.evaluate(() => {
      const radius = (selector) => parseFloat(getComputedStyle(document.querySelector(selector)).borderTopLeftRadius);
      return {
        item: radius('[data-demo="list"] .ds-drawer__item'),
        current: parseFloat(getComputedStyle(document.querySelector('[data-demo="list"] .ds-drawer__indicator')).getPropertyValue('--ds-indicator-radius')),
        track: radius('nav[data-demo="segmented"]'),
        capsule: radius('.ds-account--capsule'),
        panel: radius('[data-demo="panel"]'),
      };
    });
    const rest = await read();
    // The pill: at most half the box; times the shape, never past half.
    expect(rest.item, `${shape} item`).toBe(Math.min(24 * factor, 24));
    expect(rest.current, `${shape} pill`).toBeCloseTo(Math.min(24 * factor, 24), 1);
    expect(rest.track, `${shape} track`).toBe(Math.min(16 * factor, 16));
    expect(rest.capsule, `${shape} capsule`).toBe(Math.min(24 * factor, 24));
    expect(rest.panel, `${shape} panel`).toBe(20 * factor);
    // Pressed: the role (12px) times the shape, never rounder than at rest.
    const item = '[data-demo="list"] .ds-drawer__item:not([aria-current])';
    await page.$eval(item, (el) => el.classList.add('ds-pressed'));
    await finish(page, item);
    expect(parseFloat(await page.$eval(item, (el) => getComputedStyle(el).borderTopLeftRadius)), `${shape} pressed`).toBe(Math.min(12 * factor, 24));
    await page.$eval(item, (el) => el.classList.remove('ds-pressed'));
  }
  // The avatar is square at 0, a disc from the default up.
  const avatar = await page.evaluate(() => {
    const el = document.querySelector('.ds-avatar.ds-md');
    const measure = (shape) => {
      el.classList.remove('ds-shape-default', 'ds-shape-round', 'ds-shape-square');
      el.classList.add(shape);
      return getComputedStyle(el).borderTopLeftRadius;
    };
    return [measure('ds-shape-default'), measure('ds-shape-round'), measure('ds-shape-square')];
  });
  // Past 50% the corners overlap and scale back: still a disc.
  expect(avatar).toEqual(['50%', '75%', '0%']);
});

test('the modal drawer takes the shape on its open side, and the lock-up follows the menu button under touch', async ({ page }) => {
  await open(page, 800);
  await page.$eval('[data-demo="app"]', (el) => el.classList.add('ds-shape-soft'));
  const edge = await page.$eval('[data-demo="drawer"]', (el) => {
    const style = getComputedStyle(el);
    return { start: parseFloat(style.borderTopLeftRadius), end: parseFloat(style.borderTopRightRadius), head: parseFloat(getComputedStyle(el.querySelector('.ds-drawer__head')).paddingLeft) };
  });
  expect(edge).toEqual({ start: 0, end: 8, head: 8 + 40 + 8 });
  await page.$eval('[data-demo="app"]', (el) => el.classList.add('ds-touch'));
  expect(await page.$eval('[data-demo="drawer"] .ds-drawer__head', (el) => parseFloat(getComputedStyle(el).paddingLeft))).toBe(8 + 48 + 8);
});

test('.ds-touch: the brand link and the skip link are a finger\'s target; the rail\'s toggle stays on the axis', async ({ page }) => {
  await open(page);
  await page.$eval('[data-demo="app"]', (el) => el.classList.add('ds-touch'));
  const brand = await page.$eval('[data-demo="app"] .ds-brand', (el) => { const rect = el.getBoundingClientRect(); return [rect.height, rect.width >= 48]; });
  expect(brand).toEqual([48, true]);
  await page.$eval('[data-demo="app"] .ds-skip', (el) => el.focus());
  expect(await page.$eval('[data-demo="app"] .ds-skip', (el) => el.getBoundingClientRect().height)).toBe(48);
  await page.$eval('[data-demo="app"] .ds-skip', (el) => el.blur());
  await page.$eval('[data-demo="app"]', (el) => el.setAttribute('data-drawer-collapsed', ''));
  const axis = await page.evaluate(() => {
    const app = document.querySelector('[data-demo="app"]');
    const menu = app.querySelector('.ds-topbar__menu').getBoundingClientRect();
    const item = app.querySelector('[data-demo="list"] .ds-drawer__item').getBoundingClientRect();
    return [menu.left + menu.width / 2 - app.getBoundingClientRect().left, item.left + item.width / 2 - app.getBoundingClientRect().left];
  });
  expect(axis[0]).toBeCloseTo(36, 0);
  expect(axis[1]).toBeCloseTo(36, 0);
});

test('.ds-touch: the account avatar keeps its disc, and its hit area is a finger\'s target', async ({ page }) => {
  await open(page, 600);
  // The capsule's avatar is the tab stop (the frame's account is a menu button since 3.0).
  const measure = () => page.$eval('[data-demo="capsule"] .ds-account__avatar', (el) => {
    el.scrollIntoView({ block: 'center' });
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const reach = (distance) => el === document.elementFromPoint(cx, cy - distance);
    return { size: [rect.width, rect.height], near: reach(18), far: reach(23), outside: reach(25) };
  });
  expect((await measure()).size).toEqual([32, 32]);
  expect((await measure()).far, 'no larger than its disc without touch').toBe(false);
  await page.$eval('[data-demo="capsule"]', (el) => el.classList.add('ds-touch'));
  expect(await measure()).toEqual({ size: [32, 32], near: true, far: true, outside: false });
});

test('compact theme: a drawer row 40px, a switch 32px, as in 2.x', async ({ page }) => {
  await open(page);
  await page.addStyleTag({ url: '/dist/themes/compact.css' });
  const height = (selector) => page.$eval(selector, (el) => el.getBoundingClientRect().height);
  expect(await height('[data-demo="list"] .ds-drawer__item')).toBe(40);
  expect(await height('[data-demo="list"] .ds-drawer__toggle')).toBe(40);
  expect(await height('[data-demo="segmented"]')).toBe(32);
});

test('an avatar steps 8px per size', async ({ page }) => {
  await open(page);
  const sizes = await page.$$eval('.sg-demo-section .ds-avatar', (els) => els.map((el) => el.getBoundingClientRect().width));
  expect(sizes).toEqual([16, 24, 32, 40, 48]);
});

test('nested groups indent as padding: the layer and the pill keep the row\'s width, the pill follows across levels', async ({ page }) => {
  await open(page);
  // Every level open; the list scrolls, so the rows are measured, not looked at.
  await openGroups(page);
  const rows = await page.evaluate(() => {
    const row = (label) => [...document.querySelectorAll('[data-demo="list"] .ds-drawer__item')].find((el) => el.textContent.includes(label));
    return ['Open', 'This year', '2025'].map((label) => {
      const el = row(label);
      const rect = el.getBoundingClientRect();
      const before = getComputedStyle(el, '::before');
      return { pad: parseFloat(getComputedStyle(el).paddingInlineStart), left: rect.left, width: rect.width, layer: parseFloat(before.width) };
    });
  });
  expect(rows.map((row) => row.pad)).toEqual([16, 16 + 32, 16 + 64]);
  expect(new Set(rows.map((row) => row.left)).size).toBe(1);
  expect(new Set(rows.map((row) => row.width)).size).toBe(1);
  for (const row of rows) expect(row.layer).toBe(row.width);
  const heading = await page.$$eval('[data-demo="list"] details details > summary', (els) => els.map((el) => parseFloat(getComputedStyle(el).paddingInlineStart)));
  expect(heading).toEqual([48, 80]);
  // Selecting a row on the third level moves the pill onto it, at the row's full width.
  await page.locator('[data-demo="list"] .ds-drawer__item', { hasText: '2025' }).click();
  await settle(page);
  const pill = await page.evaluate(() => {
    const item = [...document.querySelectorAll('[data-demo="list"] .ds-drawer__item')].find((el) => el.textContent.includes('2025')).getBoundingClientRect();
    const box = document.querySelector('[data-demo="list"] .ds-drawer__indicator').getBoundingClientRect();
    return [item.left - box.left, item.width - box.width, item.top - box.top];
  });
  for (const delta of pill) expect(Math.abs(delta)).toBeLessThan(1);
});

test('the foot is pinned: the list scrolls behind it, and --pinned draws its hairline', async ({ page }) => {
  await open(page);
  const measure = () => page.evaluate(() => {
    const drawer = document.querySelector('[data-demo="drawer"]');
    const list = drawer.querySelector('.ds-drawer__list');
    const foot = drawer.querySelector('.ds-drawer__foot');
    return { scrolls: list.scrollHeight > list.clientHeight, bottom: drawer.getBoundingClientRect().bottom - foot.getBoundingClientRect().bottom, listEnd: foot.getBoundingClientRect().top - list.getBoundingClientRect().bottom, top: foot.getBoundingClientRect().top };
  });
  const before = await measure();
  expect(before.scrolls).toBe(true);
  expect(before.listEnd).toBeCloseTo(0, 0);
  expect(before.bottom).toBeCloseTo(0, 0);
  await page.$eval('[data-demo="list"]', (el) => { el.scrollTop = el.scrollHeight; });
  expect((await measure()).top).toBe(before.top);
  const line = await page.$eval('[data-demo="drawer"] .ds-drawer__foot', (el) => {
    const style = getComputedStyle(el, '::before');
    return { width: parseFloat(style.borderTopWidth), start: parseFloat(style.marginLeft) };
  });
  expect(line).toEqual({ width: 1, start: 16 });
});

test('the rail: the toggle expands it, hover never does; it drops the indent and keeps the names', async ({ page }) => {
  await open(page);
  await openGroups(page);
  const column = () => page.$eval('[data-demo="drawer"]', (el) => el.getBoundingClientRect().width);
  expect(await column()).toBe(256);
  const menu = page.locator('[data-demo="menu"]');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-pressed', 'true');
  await settle(page);
  expect(await column()).toBe(72);
  // Hovering a row, the list and the whole drawer changes nothing.
  for (const target of ['[data-demo="list"] .ds-drawer__item', '[data-demo="list"]', '[data-demo="drawer"]']) {
    await page.locator(target).first().hover();
    await settle(page);
    expect(await column(), target).toBe(72);
  }
  const rows = await page.evaluate(() => {
    const all = [...document.querySelectorAll('[data-demo="list"] .ds-drawer__item')].filter((el) => el.getClientRects().length);
    const rail = document.querySelector('[data-demo="drawer"]').getBoundingClientRect();
    return all.map((el) => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, height: rect.height, centre: rect.left + rect.width / 2 - rail.left, pad: parseFloat(getComputedStyle(el).paddingInlineStart) };
    });
  });
  expect(rows.length).toBeGreaterThan(4);
  for (const row of rows) expect(row).toEqual({ width: 48, height: 48, centre: 36, pad: 0 });
  // Labels are hidden but read; each item names itself in its tooltip.
  await expect(page.getByRole('link', { name: /^Devices ?, 128$/ })).toBeVisible();
  await expect(page.locator('[data-demo="list"] .ds-drawer__item', { hasText: 'Devices' })).toHaveAttribute('data-tip', 'Devices');
  // A group toggle is a chevron there: its tip names it.
  const toggles = page.locator('[data-demo="list"] .ds-drawer__toggle');
  expect(await toggles.evaluateAll((els) => els.map((el) => el.getAttribute('data-tip')))).toEqual(['Tickets', 'Archive', 'Earlier']);
  await toggles.first().hover();
  await expect(page.locator('.ds-tooltip')).toHaveText('Tickets');
  await page.mouse.move(1, 1);
  await menu.click();
  await settle(page);
  expect(await column()).toBe(256);
});

test('the rail centres a compact row on its axis', async ({ page }) => {
  await open(page);
  await openGroups(page);
  await page.$eval('[data-demo="app"]', (el) => { el.classList.add('ds-density-dense'); el.setAttribute('data-drawer-collapsed', ''); });
  await settle(page);
  const row = await page.evaluate(() => {
    const rect = document.querySelector('[data-demo="list"] .ds-drawer__item').getBoundingClientRect();
    return { width: rect.width, height: rect.height, centre: rect.left + rect.width / 2 - document.querySelector('[data-demo="drawer"]').getBoundingClientRect().left };
  });
  expect(row).toEqual({ width: 40, height: 40, centre: 36 });
});

test('keyboard: the skip link shows on focus; a group opens with Enter and Space; items are tab stops', async ({ page }) => {
  await open(page);
  const skip = page.locator('[data-demo="app"] .ds-skip');
  await focusByKeyboard(page, skip);
  await expect(skip).toBeFocused();
  expect(await skip.evaluate((el) => el.getBoundingClientRect().width > 40)).toBe(true);
  expect(await skip.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');

  const summary = page.locator('[data-demo="list"] details details details > summary');
  const details = page.locator('[data-demo="list"] details details details');
  await focusByKeyboard(page, summary);
  await page.keyboard.press('Enter');
  await expect(details).toHaveJSProperty('open', true);
  await page.keyboard.press('Space');
  await expect(details).toHaveJSProperty('open', false);

  const item = page.locator('[data-demo="list"] .ds-drawer__item', { hasText: 'Devices' });
  await focusByKeyboard(page, item);
  await expect(item).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(item).toHaveAttribute('aria-current', 'page');
});

test('keyboard: the modal drawer takes the focus, Escape closes it and gives it back', async ({ page }) => {
  await open(page, 800);
  const menu = page.locator('[data-demo="menu"]');
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-demo="app"]')).toHaveAttribute('data-drawer-open', '');
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('[data-demo="list"] .ds-drawer__item[aria-current="page"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-demo="app"]')).not.toHaveAttribute('data-drawer-open', '');
  await expect(menu).toBeFocused();

  // Choosing an item closes it, and the choice lands.
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-demo="app"]')).toHaveAttribute('data-drawer-open', '');
  await settle(page);
  const devices = page.locator('[data-demo="list"] .ds-drawer__item', { hasText: 'Devices' });
  await devices.click();
  await expect(devices).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('[data-demo="app"]')).not.toHaveAttribute('data-drawer-open', '');
  await expect(menu).toBeFocused();
});

test('keyboard: a switch of buttons is one tab stop and skips nothing it may reach; its links are a stop each', async ({ page }) => {
  await open(page);
  const group = page.locator('[role="radiogroup"][data-demo="segmented"]').first();
  const options = group.locator('.ds-segmented__option');
  await focusByKeyboard(page, options.first());
  await page.keyboard.press('ArrowRight');
  await expect(options.nth(1)).toBeFocused();
  await expect(options.nth(1)).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(options.nth(2)).toBeFocused();
  await expect(options.nth(1), 'an aria-disabled option takes the focus, never the state').toHaveAttribute('aria-checked', 'true');
  expect(await options.evaluateAll((els) => els.filter((el) => el.tabIndex === 0).length)).toBe(1);
  expect(await page.locator('nav[data-demo="segmented"] a').evaluateAll((els) => els.every((el) => el.tabIndex === 0))).toBe(true);
});

test('icons and counts: a count reads with the label, the width holds when the choice moves, an icon-only option is named and compact', async ({ page }) => {
  await open(page);
  const tickets = page.getByRole('radiogroup', { name: 'Tickets' });
  await expect(tickets.getByRole('radio', { name: /^Open\s*, 12$/ })).toHaveAttribute('aria-checked', 'true');
  await expect(tickets.getByRole('radio')).toHaveCount(2);
  const look = () => tickets.evaluate((el) => {
    const options = [...el.querySelectorAll('.ds-segmented__option')];
    const open = options[0];
    const icon = open.querySelector('svg').getBoundingClientRect();
    const count = open.querySelector('.ds-segmented__count').getBoundingClientRect();
    return {
      widths: options.map((option) => Math.round(option.getBoundingClientRect().width)),
      height: Math.round(open.getBoundingClientRect().height),
      row: Math.abs((icon.top + icon.bottom) / 2 - (count.top + count.bottom) / 2) <= 2,
      order: icon.right <= count.left,
      tabular: getComputedStyle(open.querySelector('.ds-segmented__count')).fontVariantNumeric,
    };
  });
  const before = await look();
  expect(before.row, 'icon, label and count on one line').toBe(true);
  expect(before.order).toBe(true);
  expect(before.tabular).toBe('tabular-nums');
  await tickets.getByRole('radio', { name: /^Waiting\s*, 3$/ }).click();
  await expect(tickets.getByRole('radio', { name: /^Waiting\s*, 3$/ })).toHaveAttribute('aria-checked', 'true');
  const after = await look();
  expect(after.widths, 'the reserved width keeps every option in place').toEqual(before.widths);
  expect(after.height).toBe(before.height);
  const layout = page.getByRole('radiogroup', { name: 'Layout' });
  const map = layout.getByRole('radio', { name: 'Map' });
  await expect(map).toHaveCount(1);
  const pads = await layout.evaluate((el) => {
    const option = el.querySelector('.ds-segmented__option');
    const style = getComputedStyle(option);
    const label = getComputedStyle(document.querySelector('[aria-label="Tickets"] .ds-segmented__option'));
    return { icon: parseFloat(style.paddingInlineStart), label: parseFloat(label.paddingInlineStart) };
  });
  expect(pads.icon).toBeCloseTo(pads.label / 2, 0);
});

test('names and roles', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('navigation', { name: 'Sample navigation' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toHaveCount(1);
  await expect(page.getByRole('img', { name: 'Ada Lovelace, ada@example.org' }).first()).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: 'View' }).getByRole('radio', { name: 'List' })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Options for Waiting' })).toHaveCount(1);
});

test('forced colours: a current row and a selected option SelectedItem, blocked GrayText, the indicators gone', async ({ page, browserName }) => {
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
  const look = (selector) => page.$eval(selector, (el) => ({ background: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }));
  expect(await look('[data-demo="list"] .ds-drawer__item[aria-current="page"]')).toEqual({ background: system.item, color: system.text });
  expect(await look('nav[data-demo="segmented"] [aria-current="true"]')).toEqual({ background: system.item, color: system.text });
  expect((await look('[data-demo="list"] .ds-drawer__item[aria-disabled="true"]')).color).toBe(system.gray);
  expect(await page.$eval('[data-demo="list"] .ds-drawer__indicator', (el) => getComputedStyle(el).display)).toBe('none');
  // A row action over a current row takes the fill's ink; over any other row it keeps the forced one.
  const waiting = page.locator('[data-demo="list"] .ds-drawer__row');
  const action = waiting.locator('.ds-drawer__action');
  expect(await action.evaluate((el) => getComputedStyle(el).forcedColorAdjust)).toBe('auto');
  await waiting.locator('.ds-drawer__item').evaluate((el) => el.setAttribute('aria-current', 'page'));
  expect(await action.evaluate((el) => [getComputedStyle(el).forcedColorAdjust, getComputedStyle(el).color])).toEqual(['none', system.text]);
  await waiting.locator('.ds-drawer__item').evaluate((el) => el.removeAttribute('aria-current'));
  // The modal drawer keeps its edge.
  await page.setViewportSize({ width: 800, height: 800 });
  expect(await page.$eval('[data-demo="drawer"]', (el) => getComputedStyle(el).outlineStyle)).toBe('solid');
});

/* ── 3.0: DS.shell ─────────────────────────────────── */

const app = '[data-demo="app"]';
const drawerField = '[data-demo="drawer"] .ds-drawer__search input';
const shown = (page, selector) => page.$$eval(selector, (els) => els.filter((el) => el.getClientRects().length).map((el) => el.textContent.trim().replace(/\s+/g, ' ')));

test('the rail is remembered; the menu button is a toggle above 900px and a disclosure below', async ({ page }) => {
  await open(page);
  const menu = page.locator('[data-demo="menu"]');
  await expect(menu).toHaveAttribute('aria-pressed', 'false');
  expect(await menu.getAttribute('aria-expanded')).toBeNull();
  const changes = page.evaluate(() => new Promise((resolve) => document.querySelector('[data-demo="app"]').addEventListener('ds:change', (event) => resolve(event.detail), { once: true })));
  await menu.click();
  expect(await changes).toEqual({ rail: true });
  await expect(page.locator(app)).toHaveAttribute('data-drawer-collapsed', '');
  expect(await page.evaluate(() => DS.get(document.querySelector('[data-demo="app"]'), 'shell').get())).toEqual({ rail: true, open: false });
  await page.reload();
  await ready(page);
  await expect(page.locator(app)).toHaveAttribute('data-drawer-collapsed', '');
  await expect(menu).toHaveAttribute('aria-pressed', 'true');
  await page.setViewportSize({ width: 800, height: 800 });
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  expect(await menu.getAttribute('aria-pressed')).toBeNull();
  // The modal drawer is unaffected by the rail.
  await menu.click();
  await expect(page.locator(app)).toHaveAttribute('data-drawer-open', '');
  expect(await page.$eval('[data-demo="drawer"]', (el) => el.getBoundingClientRect().width)).toBeGreaterThan(200);
});

test('the rail: a drawer action turns icon-only, a badge becomes a dot, the filter goes', async ({ page }) => {
  await open(page);
  await openGroups(page);
  await page.locator('[data-demo="menu"]').click();
  await settle(page);
  const action = page.locator('[data-demo="drawer"] .ds-drawer__actions .ds-btn');
  const box = await action.evaluate((el) => { const r = el.getBoundingClientRect(); return [r.width, r.height]; });
  expect(box).toEqual([40, 40]);
  await expect(action).toHaveAccessibleName('New ticket');
  const dot = await page.$eval('[data-demo="list"] .ds-drawer__item .ds-badge', (el) => {
    const r = el.getBoundingClientRect();
    const item = el.parentElement.getBoundingClientRect();
    return { w: r.width, h: r.height, inside: r.right <= item.right && r.top >= item.top };
  });
  expect(dot).toEqual({ w: 8, h: 8, inside: true });
  await expect(page.getByRole('link', { name: /^Updates ?, 4 new$/ })).toHaveCount(1);
  await expect(page.locator(drawerField)).toBeHidden();
});

test('the drawer filter: every word, accents and case aside; groups open for a match and close again', async ({ page }) => {
  await open(page);
  const field = page.locator(drawerField);
  const events = [];
  await page.exposeFunction('sgFilter', (detail) => events.push(detail));
  await page.$eval('[data-demo="drawer"]', (el) => el.addEventListener('ds:filter', (event) => window.sgFilter(event.detail)));
  await page.$eval('[data-demo="list"] details details details', (el) => { el.open = false; });
  await field.fill('ARCH');
  // "Archive" matches as a heading: its items show, its closed sub-group opens.
  expect(await shown(page, '[data-demo="list"] .ds-drawer__item')).toEqual(['This year', '2025', '2024']);
  await expect(page.locator('[data-demo="list"] details details details')).toHaveJSProperty('open', true);
  await expect(page.locator('[data-demo="list"] .ds-drawer__heading:not(.ds-drawer__toggle)', { hasText: 'Inventory' })).toBeHidden();
  await field.fill('waiting');
  expect(await shown(page, '[data-demo="list"] .ds-drawer__item')).toEqual(['Waiting, 2']);
  await expect(page.locator('[aria-live], [role="status"]').filter({ hasText: /^1 match$/ }).first()).toBeAttached({ timeout: 5000 });
  await field.fill('nothing like it');
  await expect(page.locator('[data-demo="list"] .ds-drawer__empty')).toHaveText('No results');
  await field.fill('ope');
  expect(await shown(page, '[data-demo="list"] .ds-drawer__item')).toEqual(['Open, 3']);
  // ArrowDown goes to the first match; Escape in the field clears it.
  await field.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-demo="list"] .ds-drawer__item', { hasText: 'Open' })).toBeFocused();
  await field.focus();
  // The item's tooltip takes an Escape while it leaves: wait until it has gone.
  await expect(page.locator('.ds-tooltip')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(field).toHaveValue('');
  await expect(page.locator('[data-demo="list"] .ds-drawer__empty')).toBeHidden();
  await expect(page.locator('[data-demo="list"] details details details'), 'a group the filter opened closes again').toHaveJSProperty('open', false);
  expect(events.at(-1).query).toBe('');
  expect(events.at(-1).count, 'every item of the list shows again').toBeGreaterThan(8);
  expect(events.some((detail) => detail.query === 'waiting' && detail.count === 1)).toBe(true);
});

test('the drawer remembers its groups open or closed; the way to the current item opens', async ({ page }) => {
  await open(page);
  const tickets = page.locator('[data-demo="list"] > details');
  await expect(tickets).toHaveJSProperty('open', true);
  await tickets.locator(':scope > summary').click();
  await expect(tickets).toHaveJSProperty('open', false);
  await page.waitForTimeout(50);
  await page.reload();
  await ready(page);
  await expect(tickets).toHaveJSProperty('open', false);
  expect(await page.evaluate(() => DS.get(document.querySelector('[data-demo="drawer"]'), 'drawer').get().open)).toEqual(['sg-demo-archive']);
  // The current item inside a closed group opens its way on the next load.
  await page.evaluate(() => {
    const link = [...document.querySelectorAll('[data-demo="list"] .ds-drawer__item')].find((el) => el.textContent.includes('2025'));
    for (const other of document.querySelectorAll('[data-demo="list"] [aria-current]')) other.removeAttribute('aria-current');
    link.setAttribute('aria-current', 'page');
    const nav = document.querySelector('[data-demo="drawer"]');
    DS.get(nav, 'drawer').destroy();
    DS.shell.drawer(nav, { key: 'sg-demo' });
  });
  await expect(tickets).toHaveJSProperty('open', true);
  await expect(page.locator('#sg-demo-earlier')).toHaveJSProperty('open', true);
});

test('the drawer\'s keys: arrows, Home and End over the shown items and toggles, Up from the first to the filter', async ({ page }) => {
  await open(page);
  const overview = page.locator('[data-demo="list"] .ds-drawer__item', { hasText: 'Overview' });
  await focusByKeyboard(page, overview);
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-demo="list"] .ds-drawer__item', { hasText: 'Devices' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-demo="list"] .ds-drawer__toggle', { hasText: 'Tickets' })).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.locator('[data-demo="drawer"] .ds-drawer__foot .ds-drawer__item', { hasText: 'Help' })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.locator('[data-demo="drawer"] .ds-drawer__back .ds-drawer__item')).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(page.locator(drawerField)).toBeFocused();
});

test('the phone search sheet: opens over the frame, keeps the focus inside, Escape clears then closes', async ({ page }) => {
  await open(page, 390);
  const opener = page.locator('[data-demo="search-open"]');
  const sheet = page.locator('[data-demo="search"]');
  const input = sheet.locator('input');
  await expect(sheet).toBeHidden();
  await expect(opener).toHaveAttribute('aria-expanded', 'false');
  expect(await opener.getAttribute('aria-controls')).toBe(await sheet.getAttribute('id'));
  await opener.click();
  await expect(sheet).toHaveAttribute('data-state', 'open');
  await expect(opener).toHaveAttribute('aria-expanded', 'true');
  await expect(input).toBeFocused();
  await settle(page);
  const box = await sheet.evaluate((el) => { const r = el.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
  expect(box).toEqual([0, 0, 390, 800]);
  // The rest of the page is inert; the bar's own buttons do not paint over the sheet.
  expect(await page.$eval('[data-demo="panel"]', (el) => el.closest('[inert]') !== null)).toBe(true);
  expect(await page.evaluate(() => document.elementFromPoint(380, 400)?.closest('[data-demo="search"]') !== null)).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');
  await input.fill('lap');
  await expect(sheet.locator('.ds-topbar__results .ds-list__item')).toHaveCount(3);
  // Tab goes round inside.
  const stops = await sheet.evaluate((el) => [...el.querySelectorAll('button, input, a[href]')].filter((n) => n.getClientRects().length).length);
  for (let i = 0; i < stops; i += 1) await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.closest('[data-demo="search"]') !== null)).toBe(true);
  await input.focus();
  await page.keyboard.press('Escape');
  await expect(input).toHaveValue('');
  await expect(sheet).toHaveAttribute('data-state', 'open');
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(opener).toHaveAttribute('aria-expanded', 'false');
  expect(await page.$eval('[data-demo="panel"]', (el) => el.closest('[inert]') === null)).toBe(true);
  // The back button closes it too; a wider window puts the search back in the bar.
  await opener.click();
  await expect(sheet).toHaveAttribute('data-state', 'open');
  await sheet.locator('.ds-topbar__search-back').click();
  await expect(sheet).toBeHidden();
  await opener.click();
  await expect(sheet).toHaveAttribute('data-state', 'open');
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(sheet).toBeVisible();
  await expect(opener).toBeHidden();
  await expect.poll(() => sheet.evaluate((el) => [getComputedStyle(el).position, el.getBoundingClientRect().height < 64])).toEqual(['static', true]);
  expect(await page.$eval('[data-demo="panel"]', (el) => el.closest('[inert]') === null)).toBe(true);
});

test('the launcher: a menu of apps in a grid, two-dimensional keys, the current app marked', async ({ page }) => {
  await open(page);
  const trigger = page.locator('[data-demo="apps"]');
  const menu = page.getByRole('menu', { name: 'Apps' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const apps = menu.getByRole('menuitem');
  await expect(apps).toHaveCount(9);
  await expect(apps.first()).toBeFocused();
  await expect(apps.first()).toHaveAttribute('aria-current', 'true');
  const rows = await apps.evaluateAll((els) => new Set(els.map((el) => Math.round(el.getBoundingClientRect().top))).size);
  expect(rows).toBe(3);
  await page.keyboard.press('ArrowRight');
  await expect(apps.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(apps.nth(4)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(apps.nth(3)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(apps.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(apps.nth(0), 'no wrap at the top edge').toBeFocused();
  await page.keyboard.press('End');
  await expect(apps.nth(8)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(apps.nth(8), 'no wrap at the bottom edge').toBeFocused();
  await page.keyboard.press('Home');
  await expect(apps.nth(0)).toBeFocused();
  // The current app: the tint on its disc and the label weight, not colour alone.
  const look = await apps.evaluateAll((els) => els.slice(0, 2).map((el) => [getComputedStyle(el).fontWeight, getComputedStyle(el.querySelector('.ds-launcher__icon')).backgroundColor]));
  expect(look[0][0]).not.toBe(look[1][0]);
  expect(look[0][1]).not.toBe(look[1][1]);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('the launcher follows size, density, shape and touch', async ({ page }) => {
  await open(page);
  const measure = (classes) => page.evaluate((cls) => {
    const menu = document.querySelector('.ds-launcher');
    menu.hidden = false;
    menu.style.position = 'static';
    menu.className = `ds-menu ds-launcher ${cls}`;
    const appEl = menu.querySelector('.ds-launcher__app');
    const disc = appEl.querySelector('.ds-launcher__icon');
    const out = { app: appEl.getBoundingClientRect().height, disc: disc.getBoundingClientRect().width, radius: parseFloat(getComputedStyle(appEl).borderTopLeftRadius) };
    menu.hidden = true;
    menu.removeAttribute('style');
    return out;
  }, classes);
  expect((await measure('')).app).toBe(88);
  expect((await measure('')).disc).toBe(40);
  expect(await measure('ds-xs')).toMatchObject({ app: 72, disc: 24 });
  expect(await measure('ds-xl')).toMatchObject({ app: 104, disc: 56 });
  expect((await measure('ds-density-tight')).app).toBe(76);
  expect((await measure('ds-xs ds-density-tight')).app).toBe(60);
  // Touch wins as a minimum: the smallest app computes 60px, a finger's target at least 48px.
  const floor = (cls) => page.evaluate((c) => {
    const probe = document.createElement('div');
    probe.className = `ds-menu ds-launcher ${c}`;
    probe.innerHTML = '<a class="ds-menu__item ds-launcher__app" href="#">App</a>';
    document.querySelector('.ds-launcher').after(probe);
    probe.style.setProperty('--ds-launcher-app-height', '24px');
    const value = getComputedStyle(probe.firstChild).minHeight;
    probe.remove();
    return value;
  }, cls);
  expect(await floor('ds-xs')).toBe('8px');
  expect(await floor('ds-xs ds-touch')).toBe('48px');
  expect((await measure('ds-shape-square')).radius).toBe(0);
  const base = (await measure('')).radius;
  expect((await measure('ds-shape-soft')).radius).toBeCloseTo(base / 2, 1);
});

test('the bell: a dot on its icon\'s corner, inside the button, and a name that says the count', async ({ page }) => {
  await open(page);
  const bell = page.locator('[data-demo="bell"]');
  await expect(bell).toHaveAccessibleName('Notifications, 3 unread');
  // At md, lg and under touch: the box grows, the 20px glyph stays, the dot (a step larger at lg) keeps its corner.
  for (const [option, size] of [['', 8], ['ds-lg', 10], ['ds-touch', 8]]) {
    const placed = await bell.evaluate((button, name) => {
      button.classList.remove('ds-lg', 'ds-touch');
      if (name) button.classList.add(name);
      const dot = button.querySelector('.ds-badge--dot').getBoundingClientRect();
      const box = button.getBoundingClientRect();
      const glyph = button.querySelector('svg').getBoundingClientRect();
      return { inside: dot.left >= box.left && dot.right <= box.right && dot.top >= box.top && dot.bottom <= box.bottom, corner: Math.abs(dot.right - glyph.right) < 1 && Math.abs(dot.top - glyph.top) < 1, size: dot.width };
    }, option);
    expect(placed, option || 'md').toEqual({ inside: true, corner: true, size });
  }
});

test('the account menu: named by its head, a theme switch that pins the scheme and is remembered', async ({ page }) => {
  await open(page);
  const trigger = page.getByRole('button', { name: 'Account: Ada Lovelace' });
  await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  await trigger.click();
  const menu = page.getByRole('menu', { name: 'Ada Lovelace ada@example.org', exact: true });
  await expect(menu).toBeVisible();
  const theme = menu.getByRole('group', { name: 'Theme' });
  await expect(theme.getByRole('menuitemradio', { name: 'Device' })).toHaveAttribute('aria-checked', 'true');
  const change = page.evaluate(() => new Promise((resolve) => document.querySelector('[data-ds-scheme-switch]').addEventListener('ds:change', (event) => resolve(event.detail), { once: true })));
  await theme.getByRole('menuitemradio', { name: 'Dark' }).click();
  expect(await change).toEqual({ value: 'dark' });
  const pinned = () => page.evaluate(() => document.querySelector('[data-ds-scheme-switch]').closest('.ds-theme').getAttribute('data-ds-scheme'));
  expect(await pinned()).toBe('dark');
  await expect(page.locator('[data-ds-scheme-value="dark"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[data-ds-scheme-value="auto"]')).toHaveAttribute('aria-checked', 'false');
  await page.reload();
  await ready(page);
  expect(await pinned()).toBe('dark');
  // The page pins the theme itself: the switch follows; auto removes the pin.
  await page.evaluate(() => document.querySelector('[data-ds-scheme-switch]').closest('.ds-theme').setAttribute('data-ds-scheme', 'light'));
  await expect(page.locator('[data-ds-scheme-value="light"]')).toHaveAttribute('aria-checked', 'true');
  await page.evaluate(() => DS.get(document.querySelector('[data-ds-scheme-switch]'), 'scheme-switch').set('auto'));
  expect(await pinned()).toBeNull();
  // Sign out is the page's: a plain menu item.
  await trigger.click();
  await expect(page.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('the breadcrumbs fold their middle into a menu by the width of their nav', async ({ page }) => {
  await open(page);
  const box = page.locator('[data-demo="crumbs-box"]');
  const nav = box.locator('.ds-breadcrumbs');
  const more = nav.locator('.ds-breadcrumbs__more button');
  const visible = () => shown(page, '[data-demo="crumbs-box"] li:not(.ds-breadcrumbs__more)');
  await expect(more).toBeHidden();
  expect(await visible()).toEqual(['Home', 'Sites', 'Building A', 'Floor 2', 'Devices', 'LAPTOP-0042']);
  await box.evaluate((el) => { el.style.inlineSize = '360px'; });
  await expect(more).toBeVisible();
  const middle = await visible();
  expect(middle[0]).toBe('Home');
  expect(middle.at(-1)).toBe('LAPTOP-0042');
  expect(middle.length).toBeLessThan(6);
  await expect(more).toHaveAccessibleName(`Show ${6 - middle.length} more`);
  expect(await nav.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await box.evaluate((el) => { el.style.inlineSize = '160px'; });
  await expect.poll(visible, 'the parent goes last; the current page never').toEqual(['LAPTOP-0042']);
  await expect(more).toHaveAccessibleName('Show 5 more');
  await box.evaluate((el) => { el.style.inlineSize = '280px'; });
  await expect.poll(visible).toEqual(['Devices', 'LAPTOP-0042']);
  await expect(more).toHaveAccessibleName('Show 4 more');
  // The menu lists the folded crumbs in order, as links; the keys open it on the first.
  await more.focus();
  await page.keyboard.press('ArrowDown');
  const menu = page.getByRole('menu', { name: 'Show 4 more' });
  await expect(menu).toBeVisible();
  await expect(more).toHaveAttribute('aria-expanded', 'true');
  expect(await menu.getByRole('menuitem').allTextContents()).toEqual(['Home', 'Sites', 'Building A', 'Floor 2']);
  await expect(menu.getByRole('menuitem').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(more).toBeFocused();
  await box.evaluate((el) => { el.style.inlineSize = '100%'; });
  await expect(more).toBeHidden();
  await expect.poll(visible).toEqual(['Home', 'Sites', 'Building A', 'Floor 2', 'Devices', 'LAPTOP-0042']);
});

test('a re-render with DS.dom.morphHtml keeps the drawer\'s filter and the folded trail, and follows what changed', async ({ page }) => {
  await open(page);
  // The page's template: the list and the trail as rendered, without the parts and marks of the system.
  const template = (selector) => page.$eval(selector, (el) => {
    const copy = el.cloneNode(true);
    for (const kept of copy.querySelectorAll('[data-ds-keep]')) kept.remove();
    for (const marked of copy.querySelectorAll('[data-ds-filtered], [data-ds-collapsed]')) marked.removeAttribute(marked.hasAttribute('data-ds-filtered') ? 'data-ds-filtered' : 'data-ds-collapsed');
    return copy.innerHTML;
  });
  const listHtml = await template('[data-demo="list"]');
  const field = page.locator(drawerField);
  await field.fill('waiting');
  const items = () => shown(page, '[data-demo="list"] .ds-drawer__item');
  expect(await items()).toEqual(['Waiting, 2']);
  await page.$eval('[data-demo="list"]', (el, html) => DS.dom.morphHtml(el, html), listHtml);
  expect(await items(), 'the same list again: the filter stays').toEqual(['Waiting, 2']);
  await expect(field).toHaveValue('waiting');
  expect(await page.$eval('[data-demo="drawer"]', (el) => DS.get(el, 'drawer').get().count)).toBe(1);
  // New items during the filter follow the query.
  const more = '<a class="ds-drawer__item" href="#"><span class="ds-drawer__label">Waiting list</span></a><a class="ds-drawer__item" href="#"><span class="ds-drawer__label">Zebra</span></a>';
  await page.$eval('[data-demo="list"]', (el, html) => DS.dom.morphHtml(el, html), listHtml + more);
  await expect.poll(items).toEqual(['Waiting, 2', 'Waiting list']);
  expect(await page.$eval('[data-demo="drawer"]', (el) => DS.get(el, 'drawer').get().count)).toBe(2);
  await field.fill('');
  await expect.poll(async () => (await items()).includes('Zebra')).toBe(true);

  const box = page.locator('[data-demo="crumbs-box"]');
  const crumbs = () => shown(page, '[data-demo="crumbs-box"] li:not(.ds-breadcrumbs__more)');
  const trailHtml = await template('[data-demo="crumbs-box"] .ds-breadcrumbs ol');
  await box.evaluate((el) => { el.style.inlineSize = '280px'; });
  await expect.poll(crumbs).toEqual(['Devices', 'LAPTOP-0042']);
  await page.$eval('[data-demo="crumbs-box"] .ds-breadcrumbs ol', (el, html) => DS.dom.morphHtml(el, html), trailHtml);
  expect(await crumbs(), 'the same trail again: the fold stays').toEqual(['Devices', 'LAPTOP-0042']);
  await expect(box.locator('.ds-breadcrumbs__more button')).toBeVisible();
  // Another text: the trail folds again and still fits.
  await page.$eval('[data-demo="crumbs-box"] .ds-breadcrumbs ol', (el, html) => DS.dom.morphHtml(el, html), trailHtml.replace('>Devices<', '>Every device on the second floor of Building A<'));
  await expect.poll(crumbs).toEqual(['LAPTOP-0042']);
  await expect(box.locator('.ds-breadcrumbs__more button')).toHaveAccessibleName('Show 5 more');
  expect(await box.locator('.ds-breadcrumbs').evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
});

test('the theme switch as radios: one tab stop, the arrow keys move and choose, round at the ends', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const group = document.createElement('div');
    group.className = 'ds-segmented';
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-label', 'Colour scheme');
    group.setAttribute('data-ds-scheme-switch', 'sg-test-radios');
    group.setAttribute('data-ds-scheme-switch-remember', 'off');
    group.innerHTML = ['light', 'dark', 'auto'].map((value) => `<button class="ds-segmented__option" type="button" role="radio" aria-checked="false" data-ds-scheme-value="${value}">${value}</button>`).join('');
    document.querySelector('#fx-component').append(group);
  });
  const group = page.getByRole('radiogroup', { name: 'Colour scheme' });
  const radio = (name) => group.getByRole('radio', { name });
  await expect(radio('auto')).toHaveAttribute('aria-checked', 'true');
  const stops = () => group.evaluate((el) => [...el.querySelectorAll('[role="radio"]')].map((item) => item.getAttribute('tabindex')));
  expect(await stops()).toEqual(['-1', '-1', '0']);
  const pinned = () => page.evaluate(() => document.querySelector('[data-ds-scheme-switch="sg-test-radios"]').closest('.ds-theme').getAttribute('data-ds-scheme'));
  await radio('auto').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(radio('dark')).toBeFocused();
  await expect(radio('dark')).toHaveAttribute('aria-checked', 'true');
  expect(await pinned()).toBe('dark');
  expect(await stops()).toEqual(['-1', '0', '-1']);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(radio('light')).toBeFocused();
  expect(await pinned()).toBe('light');
  await page.keyboard.press('ArrowUp');
  await expect(radio('auto')).toBeFocused();
  expect(await pinned()).toBeNull();
  // Nothing was stored (remember off), and the menu's switch follows the pin.
  expect(await page.evaluate(() => DS.store.open('shell').get('sg-test-radios', null))).toBeNull();
});

test('a phone at 360px: the bar keeps every action and the account inside the frame', async ({ page }) => {
  await open(page, 360);
  const fits = await page.evaluate(() => {
    const bar = document.querySelector('[data-demo="app"] > .ds-topbar').getBoundingClientRect();
    return [...document.querySelectorAll('[data-demo="app"] > .ds-topbar :is(.ds-topbar__menu, .ds-topbar__actions > .ds-btn, .ds-account__trigger)')]
      .filter((el) => el.getClientRects().length)
      .map((el) => { const r = el.getBoundingClientRect(); return [el.getAttribute('aria-label'), r.width, r.left >= bar.left && r.right <= bar.right]; });
  });
  expect(fits.map(([name]) => name)).toEqual(['Menu', 'Search', 'Apps', 'Notifications, 3 unread', 'Account: Ada Lovelace']);
  for (const [name, width, inside] of fits) expect([name, width, inside]).toEqual([name, 40, true]);
});

test('names and roles of the 3.0 parts', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('searchbox', { name: 'Filter the navigation' })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Search devices' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Apps' })).toHaveAttribute('aria-haspopup', 'menu');
  await expect(page.getByRole('navigation', { name: 'Breadcrumb', exact: true })).toBeVisible();
  await expect(page.locator('[data-demo="crumbs-box"] [aria-current="page"]')).toHaveText('LAPTOP-0042');
  expect(await page.$eval('[data-demo="menu"]', (el) => el.getAttribute('aria-controls'))).toBe(await page.$eval('[data-demo="drawer"]', (el) => el.id));
});

test('forced colours: the current app SelectedItem, a rail badge Highlight, the sheet and discs keep their edges', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const system = await page.evaluate(() => {
    const probe = (value) => {
      const el = document.createElement('span');
      el.style.forcedColorAdjust = 'none';
      el.style.backgroundColor = value;
      document.querySelector('.ds-theme').append(el);
      const colour = getComputedStyle(el).backgroundColor;
      el.remove();
      return colour;
    };
    return { item: probe('SelectedItem'), highlight: probe('Highlight') };
  });
  await page.locator('[data-demo="apps"]').click();
  await expect.poll(() => page.$eval('.ds-launcher__app[aria-current="true"]', (el) => getComputedStyle(el).backgroundColor)).toBe(system.item);
  expect(await page.$eval('.ds-launcher__icon', (el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  await page.keyboard.press('Escape');
  await page.locator('[data-demo="menu"]').click();
  await expect.poll(() => page.$eval('[data-demo="list"] .ds-drawer__item .ds-badge', (el) => getComputedStyle(el).backgroundColor)).toBe(system.highlight);
  await page.setViewportSize({ width: 390, height: 800 });
  await page.locator('[data-demo="search-open"]').click();
  expect(await page.$eval('[data-demo="search"]', (el) => getComputedStyle(el).outlineStyle)).toBe('solid');
});
