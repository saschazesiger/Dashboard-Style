/**
 * The list-detail layout (DS.listdetail) on its demo: names and roles; what
 * shows at one, two and three columns and every level; the triggers, the
 * back and close buttons; the focus that follows the level (phone: to the
 * title and back to the row, wide: stays in the list), also on a resize;
 * the attribute path and the controller; the entering column; the options
 * (density, touch, shape); the layout before the script; forced colours.
 * Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

const layout = '[data-demo="layout"]';
const col = (part) => `${layout} > .ds-listdetail__${part}`;

async function open(page, width) {
  await page.goto('/test/browser/fixtures/component.html?c=listdetail');
  await ready(page);
  await page.mouse.move(1, 1);
  if (width) await narrow(page, width);
}

/** Gives the layout a width of its own: it folds by its own width, whatever the window. */
async function narrow(page, width) {
  await page.$eval(layout, (el, px) => { el.style.inlineSize = `${px}px`; }, width);
  await expect.poll(() => page.$eval(layout, (el) => Math.round(el.getBoundingClientRect().width))).toBe(width);
}

const shown = (page) => page.$eval(layout, (el) => [el.getAttribute('data-columns'), el.getAttribute('data-shown')]);
const visible = (page, selector) => page.$eval(selector, (el) => el.checkVisibility());
const row = (page, index = 0) => page.locator(`${col('list')} .ds-list__action`).nth(index);

test('names and roles: named columns and buttons, the level and what shows written by the system', async ({ page }) => {
  await open(page, 900);
  await expect(page.locator(layout)).toHaveAttribute('data-state', 'list');
  expect(await shown(page)).toEqual(['2', 'list detail']);
  // The layout carries its own role and name (a plain div takes no name); the list column is a region named by its title.
  await expect(page.locator(layout)).toHaveAttribute('role', 'group');
  await expect(page.locator(layout)).toHaveAccessibleName('Devices');
  await expect(page.getByRole('group', { name: 'Devices', exact: true }).first()).toBeVisible();
  await expect(page.locator(col('list'))).toHaveAccessibleName('Devices');
  await expect(page.getByRole('region', { name: 'Devices', exact: true }).first()).toBeVisible();
  await expect(page.locator(col('detail'))).toHaveAccessibleName('Device');
  // The sub-detail waits; the back buttons hide while their column's predecessor shows.
  expect(await visible(page, col('sub'))).toBe(false);
  expect(await visible(page, `${col('detail')} .ds-listdetail__back`)).toBe(false);
  expect(await visible(page, `${col('detail')} .ds-listdetail__close`), 'nothing picked: nothing to close').toBe(false);

  // Buttons the page left unnamed get the system's strings.
  await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = 'probe';
    host.insertAdjacentHTML('beforeend', '<div class="ds-listdetail" data-ds-listdetail style="--ds-listdetail-height: 200px"><section class="ds-listdetail__list"></section><section class="ds-listdetail__detail"><header class="ds-listdetail__head"><button class="ds-btn ds-btn--icon ds-listdetail__back" type="button"></button><h2 class="ds-listdetail__title">X</h2><button class="ds-btn ds-btn--icon ds-listdetail__close" type="button"></button></header></section></div>');
    document.getElementById('fx-component').prepend(host);
  });
  await expect(page.locator('#probe .ds-listdetail__back')).toHaveAttribute('aria-label', 'Back');
  await expect(page.locator('#probe .ds-listdetail__close')).toHaveAttribute('aria-label', 'Close');
  await expect(page.locator('#probe .ds-listdetail')).toHaveAttribute('data-state', 'list');
});

test('two columns: a row opens the detail beside the list and the focus stays; the sub-detail pushes the list out', async ({ page }) => {
  await open(page, 900);
  const changes = [];
  await page.exposeFunction('reportChange', (detail) => changes.push(detail));
  await page.$eval(layout, (el) => el.addEventListener('ds:change', (event) => window.reportChange(event.detail)));

  await row(page, 1).click();
  await expect(page.locator(layout)).toHaveAttribute('data-state', 'detail');
  await expect(page.locator(layout)).toHaveAttribute('data-direction', 'forward');
  expect(await shown(page)).toEqual(['2', 'list detail']);
  await expect(row(page, 1), 'the list still shows: the focus stays').toBeFocused();
  await expect(page.locator(`${col('detail')} .ds-listdetail__title`)).toHaveText('LAPTOP-0017');
  expect(await visible(page, `${col('detail')} .ds-listdetail__close`)).toBe(true);
  expect(await visible(page, `${col('detail')} .ds-listdetail__back`)).toBe(false);
  await expect.poll(() => changes).toEqual([{ level: 'detail', previous: 'list' }]);

  const ticket = page.locator(`${col('detail')} [data-ds-listdetail-show="sub"]`);
  await ticket.click();
  await expect(page.locator(layout)).toHaveAttribute('data-state', 'sub');
  expect(await shown(page)).toEqual(['2', 'detail sub']);
  expect(await visible(page, col('list'))).toBe(false);
  expect(await visible(page, `${col('detail')} .ds-listdetail__back`), 'the list is out: the detail goes back to it').toBe(true);
  expect(await visible(page, `${col('sub')} .ds-listdetail__close`)).toBe(true);
  expect(await visible(page, `${col('sub')} .ds-listdetail__back`)).toBe(false);
  await expect(ticket).toBeFocused();

  await page.locator(`${col('sub')} .ds-listdetail__close`).click();
  await expect(page.locator(layout)).toHaveAttribute('data-state', 'detail');
  await expect(page.locator(layout)).toHaveAttribute('data-direction', 'back');
  expect(await shown(page)).toEqual(['2', 'list detail']);
  await page.locator(`${col('detail')} .ds-listdetail__close`).click();
  await expect(page.locator(layout)).toHaveAttribute('data-state', 'list');
  await expect.poll(() => changes.map((change) => change.level)).toEqual(['detail', 'sub', 'detail', 'list']);
});

test('two columns: a close or back button that hides as it is pressed hands the focus back to the row', async ({ page }) => {
  await open(page, 900);
  const hidden = () => page.evaluate(() => document.activeElement?.closest('[data-demo="layout"]') ? document.activeElement.checkVisibility() : null);
  // The detail's close button: the level becomes list, the button hides, the detail column stays.
  await row(page, 2).click();
  const close = page.locator(`${col('detail')} .ds-listdetail__close`);
  await focusByKeyboard(page, close);
  await page.keyboard.press('Enter');
  await expect(page.locator(layout)).toHaveAttribute('data-state', 'list');
  expect(await shown(page)).toEqual(['2', 'list detail']);
  expect(await visible(page, `${col('detail')} .ds-listdetail__close`)).toBe(false);
  await expect(row(page, 2), 'close: back on the row that opened the detail').toBeFocused();
  expect(await hidden()).toBe(true);

  // The detail's back button at the sub level: the list comes back, the button hides.
  await row(page, 1).click();
  await page.locator(`${col('detail')} [data-ds-listdetail-show="sub"]`).click();
  expect(await shown(page)).toEqual(['2', 'detail sub']);
  await focusByKeyboard(page, page.locator(`${col('detail')} .ds-listdetail__back`));
  await page.keyboard.press('Enter');
  await expect(page.locator(layout)).toHaveAttribute('data-state', 'list');
  expect(await shown(page)).toEqual(['2', 'list detail']);
  expect(await visible(page, `${col('detail')} .ds-listdetail__back`)).toBe(false);
  await expect(row(page, 1), 'back: on the row that opened the detail').toBeFocused();
});

test('the row picked last is the one going back returns to, also after the layout narrows', async ({ page }) => {
  await open(page, 900);
  await row(page, 0).click();
  await row(page, 3).click();
  await expect(row(page, 3)).toBeFocused();
  await narrow(page, 400);
  await expect.poll(() => shown(page)).toEqual(['1', 'detail']);
  await expect(page.locator(`${col('detail')} .ds-listdetail__title`)).toBeFocused();
  await focusByKeyboard(page, page.locator(`${col('detail')} .ds-listdetail__back`));
  await page.keyboard.press('Enter');
  expect(await shown(page)).toEqual(['1', 'list']);
  await expect(row(page, 3)).toBeFocused();
});

test('three columns: the sub-detail beside both', async ({ page }) => {
  await open(page, 1200);
  await row(page).click();
  await page.locator(`${col('detail')} [data-ds-listdetail-show="sub"]`).click();
  expect(await shown(page)).toEqual(['3', 'list detail sub']);
  for (const part of ['list', 'detail', 'sub']) expect(await visible(page, col(part)), part).toBe(true);
  const widths = await page.$$eval(`${layout} > section`, (els) => els.map((el) => Math.round(el.getBoundingClientRect().width)));
  expect(widths[0]).toBe(320);
  expect(widths[2]).toBe(360);
  expect(widths[1]).toBeGreaterThanOrEqual(400);
});

test('one column (a phone): the level\'s own column, the focus to its title and back to the row', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await open(page);
  expect((await shown(page))[0]).toBe('1');
  expect(await visible(page, col('detail'))).toBe(false);

  await focusByKeyboard(page, row(page, 2));
  await page.keyboard.press('Enter');
  await expect(page.locator(layout)).toHaveAttribute('data-state', 'detail');
  expect(await shown(page)).toEqual(['1', 'detail']);
  expect(await visible(page, col('list'))).toBe(false);
  const title = page.locator(`${col('detail')} .ds-listdetail__title`);
  await expect(title).toBeFocused();
  await expect(title).toHaveAttribute('tabindex', '-1');
  await expect(title).toHaveText('PRINTER-0003');
  const back = page.locator(`${col('detail')} .ds-listdetail__back`);
  expect(await visible(page, `${col('detail')} .ds-listdetail__back`)).toBe(true);
  await expect(back).toHaveAccessibleName('Back to devices');
  // No wider than the phone: nothing scrolls sideways once the column arrived.
  await settle(page);
  expect(await page.$eval(layout, (el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  // Deeper, then back up twice with the keyboard.
  await page.locator(`${col('detail')} [data-ds-listdetail-show="sub"]`).click();
  expect(await shown(page)).toEqual(['1', 'sub']);
  await expect(page.locator(`${col('sub')} .ds-listdetail__title`)).toBeFocused();
  await expect(page.locator(`${col('sub')} .ds-listdetail__back`)).toHaveAccessibleName('Back to PRINTER-0003');
  await focusByKeyboard(page, page.locator(`${col('sub')} .ds-listdetail__back`));
  await page.keyboard.press('Enter');
  expect(await shown(page)).toEqual(['1', 'detail']);
  await expect(page.locator(`${col('detail')} [data-ds-listdetail-show="sub"]`), 'back on the trigger that opened the sub-detail').toBeFocused();
  await focusByKeyboard(page, back);
  await page.keyboard.press('Space');
  expect(await shown(page)).toEqual(['1', 'list']);
  await expect(row(page, 2), 'back on the row it came from').toBeFocused();
});

test('a resize folds and unfolds the columns and moves the focus out of a column that goes', async ({ page }) => {
  await open(page, 900);
  await row(page).click();
  await expect(row(page)).toBeFocused();
  await narrow(page, 600);
  await expect.poll(() => shown(page)).toEqual(['1', 'detail']);
  await expect(page.locator(`${col('detail')} .ds-listdetail__title`), 'the list went: the focus to the detail').toBeFocused();
  await narrow(page, 1100);
  await expect.poll(() => shown(page)).toEqual(['3', 'list detail']);
  // The widths are hooks: a narrower list fits two columns sooner.
  await page.$eval(layout, (el) => el.style.setProperty('--ds-listdetail-list-width', '200px'));
  await narrow(page, 640);
  await expect.poll(() => shown(page)).toEqual(['2', 'list detail']);
  expect(await page.$eval(col('list'), (el) => el.getBoundingClientRect().width)).toBe(200);
});

test('the attribute path and the controller: get, set, back, visible, on, arrange', async ({ page }) => {
  await open(page, 900);
  await page.$eval(layout, (el) => el.setAttribute('data-ds-listdetail', 'detail'));
  await expect(page.locator(layout)).toHaveAttribute('data-state', 'detail');
  const result = await page.$eval(layout, (el) => {
    const handle = DS.core.get(el, 'listdetail');
    const seen = [];
    const off = handle.on('change', (detail) => seen.push(`${detail.previous}>${detail.level}`));
    handle.set('sub', { animate: false, focus: false });
    const atSub = [handle.get(), handle.visible()];
    handle.back();
    handle.back();
    const atList = handle.get();
    handle.set('nothing');
    off();
    handle.set('detail');
    return { atSub, atList, seen, now: handle.get(), arrange: DS.listdetail.arrange(390, 'sub'), parent: DS.listdetail.parent('sub') };
  });
  expect(result.atSub).toEqual(['sub', ['detail', 'sub']]);
  expect(result.atList).toBe('list');
  expect(result.seen).toEqual(['detail>sub', 'sub>detail', 'detail>list']);
  expect(result.now).toBe('detail');
  expect(result.arrange).toEqual({ columns: 1, shown: ['sub'] });
  expect(result.parent).toBe('detail');

  // create() on markup of the page's own.
  const made = await page.evaluate(() => {
    const host = document.createElement('div');
    host.innerHTML = '<div class="ds-listdetail" style="--ds-listdetail-height: 200px; inline-size: 500px"><section class="ds-listdetail__list"></section><section class="ds-listdetail__detail"></section></div>';
    document.getElementById('fx-component').prepend(host);
    const handle = DS.listdetail.create(host.firstElementChild, { level: 'detail' });
    const out = [handle.get(), handle.visible()];
    handle.destroy();
    return out;
  });
  expect(made).toEqual(['detail', ['detail']]);
});

test('motion: the column that comes slides in from the end, going back from the start; none on a resize', async ({ page }) => {
  await open(page, 600);
  await row(page).click();
  const names = await page.$eval(col('detail'), (el) => el.getAnimations().map((animation) => animation.animationName).sort());
  expect(names).toEqual(['ds-fade-in', 'ds-shift-in']);
  const start = await page.$eval(col('detail'), (el) => {
    const shift = el.getAnimations().find((animation) => animation.animationName === 'ds-shift-in');
    shift.pause();
    shift.currentTime = 0;
    const x = parseFloat(getComputedStyle(el).translate);
    shift.play();
    return x;
  });
  expect(start, 'going deeper it comes from the end').toBeGreaterThan(0);
  expect(await page.$eval(col('detail'), (el) => el.classList.contains('ds-enter--slide'))).toBe(true);
  await settle(page);
  await page.locator(`${col('detail')} .ds-listdetail__back`).click();
  const from = await page.$eval(col('list'), (el) => {
    const shift = el.getAnimations().find((animation) => animation.animationName === 'ds-shift-in');
    shift.pause();
    shift.currentTime = 0;
    return parseFloat(getComputedStyle(el).translate);
  });
  expect(from, 'going back it comes from the start').toBeLessThan(0);
  await page.$eval(col('list'), (el) => el.getAnimations().forEach((animation) => animation.play()));
  await settle(page);
  await narrow(page, 900);
  await expect.poll(() => shown(page)).toEqual(['2', 'list detail']);
  expect(await page.$eval(col('detail'), (el) => el.getAnimations().length)).toBe(0);
});

test('options: the head follows density and touch, the frame the shape', async ({ page }) => {
  await open(page, 900);
  await page.evaluate(() => {
    const region = document.createElement('div');
    region.id = 'probe';
    region.insertAdjacentHTML('beforeend', ['', 'ds-density-dense', 'ds-touch', 'ds-shape-square'].map((cls, index) => `<div class="${cls}"><div class="ds-listdetail ds-listdetail--outlined" id="o${index}" style="--ds-listdetail-height: 160px"><section class="ds-listdetail__list"><header class="ds-listdetail__head"><h2 class="ds-listdetail__title">A</h2></header><div class="ds-listdetail__body">B</div></section></div></div>`).join(''));
    document.getElementById('fx-component').prepend(region);
  });
  const head = (id) => page.$eval(`#${id} .ds-listdetail__head`, (el) => el.getBoundingClientRect().height);
  const pad = (id) => page.$eval(`#${id} .ds-listdetail__body`, (el) => parseFloat(getComputedStyle(el).paddingTop));
  const radius = (id) => page.$eval(`#${id}`, (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
  expect(await head('o0')).toBe(56);
  expect(await head('o1')).toBe(48);
  expect(await head('o2')).toBeGreaterThanOrEqual(await page.$eval('#o2', (el) => parseFloat(getComputedStyle(el).getPropertyValue('--ds-target-min'))));
  expect(await pad('o0')).toBe(16);
  expect(await pad('o1')).toBe(12);
  expect(await radius('o0')).toBeGreaterThan(0);
  expect(await radius('o3')).toBe(0);
});

test('before the script: a narrow window shows the list alone, or the level the attribute names', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await open(page);
  await page.evaluate(() => {
    const columns = '<section class="ds-listdetail__list">L</section><section class="ds-listdetail__detail">D</section><section class="ds-listdetail__sub">S</section>';
    document.getElementById('fx-component').insertAdjacentHTML('afterbegin', `<div id="probe"><div class="ds-listdetail" id="n0" style="--ds-listdetail-height: 80px">${columns}</div><div class="ds-listdetail" id="n1" data-ds-listdetail-x="detail" style="--ds-listdetail-height: 80px">${columns}</div></div>`);
  });
  const display = (selector) => page.$eval(selector, (el) => getComputedStyle(el).display);
  expect(await display('#n0 > .ds-listdetail__list')).not.toBe('none');
  expect(await display('#n0 > .ds-listdetail__detail')).toBe('none');
  expect(await display('#n0 > .ds-listdetail__sub')).toBe('none');
  // The attribute without its script (a static page, the script failed): the level it names.
  await page.$eval('#n1', (el) => {
    el.removeAttribute('data-ds-listdetail-x');
    el.setAttribute('data-ds-listdetail', 'detail');
    // Keep the runtime off this one: what the stylesheet does alone.
    DS.core.destroy?.(el);
    el.removeAttribute('data-shown');
    el.removeAttribute('data-columns');
  });
  expect(await display('#n1 > .ds-listdetail__list')).toBe('none');
  expect(await display('#n1 > .ds-listdetail__detail')).not.toBe('none');
});

test('forced colours: the hairlines and the frame stay', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page, 900);
  const border = (selector, side) => page.$eval(selector, (el, name) => {
    const style = getComputedStyle(el);
    return [style.getPropertyValue(`border-${name}-width`), style.getPropertyValue(`border-${name}-style`)];
  }, side);
  expect(await border(layout, 'top')).toEqual(['1px', 'solid']);
  expect(await border(col('detail'), 'left')).toEqual(['1px', 'solid']);
  expect(await border(`${col('list')} .ds-listdetail__head`, 'bottom')).toEqual(['1px', 'solid']);
});
