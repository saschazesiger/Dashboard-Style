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
  const measure = () => page.$eval('[data-demo="app"] .ds-account__avatar', (el) => {
    el.scrollIntoView({ block: 'center' });
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const reach = (distance) => el === document.elementFromPoint(cx, cy - distance);
    return { size: [rect.width, rect.height], near: reach(18), far: reach(23), outside: reach(25) };
  });
  expect((await measure()).size).toEqual([32, 32]);
  expect((await measure()).far, 'no larger than its disc without touch').toBe(false);
  await page.$eval('[data-demo="app"]', (el) => el.classList.add('ds-touch'));
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

test('an avatar steps 8px per size; the 2.x aliases keep their fixed discs whatever surrounds them', async ({ page }) => {
  await open(page);
  const sizes = await page.$$eval('.sg-demo-section .ds-avatar', (els) => els.map((el) => el.getBoundingClientRect().width));
  expect(sizes).toEqual([16, 24, 32, 40, 48]);
  const aliases = await page.evaluate(() => {
    const region = document.createElement('div');
    region.className = 'ds-xl';
    region.innerHTML = '<span class="ds-avatar ds-avatar--sm">A</span><span class="ds-avatar ds-avatar--lg">A</span>';
    document.querySelector('#fx-component').append(region);
    return [...region.children].map((el) => [el.getBoundingClientRect().width, parseFloat(getComputedStyle(el).fontSize)]);
  });
  expect(aliases).toEqual([[24, 12], [40, 16]]);
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
