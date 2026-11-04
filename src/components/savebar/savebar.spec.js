/**
 * The save bar on the options model (3.0): its least height and padding at
 * every size x density, with and without .ds-touch; the shape; the bar in the
 * flow (.ds-savebar--inline) for a form outside a card, at every width; the
 * keyboard, names and roles of the floating bar in the demo; forced colours;
 * the demo's own flow through DS.overlay.savebar(). The 2.x behaviour stays
 * in test/browser/savebar.spec.js. Runs on the generated fixture of the demo,
 * and in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=savebar');
  await ready(page);
  await page.mouse.move(1, 1);
}

const BAR = (cls) => `<div class="ds-savebar__bar ${cls}" role="group" aria-label="Measured" style="position: static"><p class="ds-savebar__text">x</p></div>`;

test('the least height and the padding at every size x density; .ds-touch as a minimum', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities, bar }) => {
    const main = document.querySelector('#fx-component');
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        const region = document.createElement('div');
        region.className = `${density}${touch ? ' ds-touch' : ''}`;
        main.append(region);
        for (const [size] of sizes) {
          region.insertAdjacentHTML('beforeend', bar.replace('${cls}', size));
          const el = region.lastElementChild;
          const style = getComputedStyle(el);
          out.push({ touch, density, size, height: el.getBoundingClientRect().height, padding: parseFloat(style.paddingTop), start: parseFloat(style.paddingInlineStart), line: parseFloat(getComputedStyle(el.firstElementChild).lineHeight) });
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES, bar: BAR('${cls}') });
  expect(measured).toHaveLength(SIZES.length * DENSITIES.length * 2);
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const name = `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`;
    const content = 2 * entry.padding + entry.line;
    expect(entry.height, name).toBeCloseTo(Math.max(entry.touch ? TOUCH : 0, 56 + step * 8 + density * 4, content), 0);
    // The block padding follows the density; the side padding stays room for its content.
    expect(entry.padding, `${name} padding`).toBeCloseTo(8 + density * 2, 0);
    expect(entry.start, `${name} start`).toBe(20);
  }
});

test('shape: the floating bar\'s radius; its buttons follow the shape by themselves', async ({ page }) => {
  await open(page);
  const radii = await page.evaluate((bar) => {
    const host = document.querySelector('#fx-component');
    const out = {};
    for (const shape of ['square', 'soft', 'default', 'round']) {
      host.insertAdjacentHTML('beforeend', `<div class="ds-shape-${shape}">${bar}</div>`);
      const el = host.lastElementChild.firstElementChild;
      el.insertAdjacentHTML('beforeend', '<div class="ds-savebar__actions"><button class="ds-btn ds-btn--filled" type="button">Save</button></div>');
      out[shape] = [parseFloat(getComputedStyle(el).borderTopLeftRadius), parseFloat(getComputedStyle(el.querySelector('.ds-btn')).borderTopLeftRadius)];
    }
    return out;
  }, BAR(''));
  // --ds-radius-card (12px) times the shape.
  const card = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.borderRadius = 'var(--ds-radius-card)';
    document.querySelector('.ds-theme').append(probe);
    const radius = parseFloat(getComputedStyle(probe).borderTopLeftRadius);
    probe.remove();
    return radius;
  });
  expect(radii.square).toEqual([0, 0]);
  expect(radii.soft[0]).toBeCloseTo(card * 0.5, 1);
  expect(radii.default[0]).toBeCloseTo(card, 1);
  expect(radii.round[0]).toBeCloseTo(card * 1.5, 1);
  expect(radii.default[1]).toBe(20);
});

test('in the flow: it takes its room, sticks at the bottom of the scroller at every width, and needs no script', async ({ page }) => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await open(page);
    const flow = page.locator('[data-demo="flow"]');
    const bar = flow.locator('.ds-savebar__bar');
    await flow.scrollIntoViewIfNeeded();
    // It shows without DS.overlay.savebar(), flat, in the flow: the wrapper has the bar's height.
    await expect(bar).toBeVisible();
    const look = await flow.locator('.ds-savebar').evaluate((wrapper) => {
      const el = wrapper.firstElementChild;
      const style = getComputedStyle(el);
      return { room: wrapper.getBoundingClientRect().height, own: el.getBoundingClientRect().height, position: style.position, shadow: style.boxShadow, radius: parseFloat(style.borderTopLeftRadius), line: parseFloat(style.borderTopWidth) };
    });
    expect(look.room, `${width}: takes its room`).toBeCloseTo(look.own, 0);
    expect(look).toMatchObject({ position: 'static', shadow: 'none', radius: 0, line: 1 });
    // Scrolled to the start: the bar sits at the bottom edge of the scroller, the form runs on under it.
    const measure = () => flow.evaluate((scroller) => {
      const box = scroller.getBoundingClientRect();
      const bar = scroller.querySelector('.ds-savebar__bar').getBoundingClientRect();
      return { barBottom: bar.bottom, barLeft: bar.left, barRight: bar.right, left: box.left + scroller.clientLeft, right: box.left + scroller.clientLeft + scroller.clientWidth, bottom: box.top + scroller.clientTop + scroller.clientHeight, more: scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop };
    });
    const start = await measure();
    expect(start.more, `${width}: the form scrolls`).toBeGreaterThan(0);
    expect(start.barBottom, `${width}: at the bottom edge`).toBeCloseTo(start.bottom, 0);
    // It runs to the edges of the scroller (--ds-savebar-bleed).
    expect(start.barLeft, `${width}: bleeds to the start`).toBeCloseTo(start.left, 0);
    expect(start.barRight, `${width}: bleeds to the end`).toBeCloseTo(start.right, 0);
    // Still there at the end of the form, after the last field.
    await flow.evaluate((scroller) => { scroller.scrollTop = scroller.scrollHeight; });
    const end = await measure();
    expect(end.barBottom).toBeCloseTo(end.bottom, 0);
    const lastField = await flow.locator('input').last().boundingBox();
    const barBox = await bar.boundingBox();
    expect(lastField.y + lastField.height, `${width}: the last field clears it`).toBeLessThanOrEqual(barBox.y);
  }
});

test('in the flow: Tab reaches its buttons, a focused field scrolls clear of it, and it is a named group', async ({ page }) => {
  await open(page);
  const flow = page.locator('[data-demo="flow"]');
  const group = flow.getByRole('group', { name: 'Form actions' });
  await expect(group.getByRole('button', { name: 'Save' })).toBeVisible();
  // Every field Tab lands on is clear of the bar, at a wide and a phone width (WCAG 2.4.11).
  const inputs = flow.locator('input');
  const count = await inputs.count();
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await flow.evaluate((scroller) => { scroller.scrollTop = 0; });
    await inputs.first().focus();
    for (let i = 0; i < count; i += 1) {
      await expect(inputs.nth(i)).toBeFocused();
      await settle(page);
      const [field, barBox] = [await inputs.nth(i).boundingBox(), await group.boundingBox()];
      expect(field.y + field.height, `${width}: field ${i} under the bar`).toBeLessThanOrEqual(barBox.y + 2);
      if (i < count - 1) await page.keyboard.press('Tab');
    }
  }
  await page.keyboard.press('Tab');
  await expect(group.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(group.getByRole('button', { name: 'Save' })).toBeFocused();
  // Hidden by the page, it takes no room, also without .ds-base.
  const room = await flow.locator('.ds-savebar').evaluate((wrapper) => {
    document.documentElement.classList.remove('ds-base');
    wrapper.firstElementChild.hidden = true;
    return wrapper.getBoundingClientRect().height;
  });
  expect(room).toBe(0);
});

test('in the flow: a .ds-view keeps the room by itself, a bar hidden by the page keeps none, the hook sets more', async ({ page }) => {
  await open(page);
  const read = await page.evaluate(() => {
    const host = document.querySelector('#fx-component');
    host.insertAdjacentHTML('beforeend', '<div class="ds-view" id="flow-view" style="block-size: 200px"><div class="ds-content"><form class="ds-form"><div class="ds-savebar ds-savebar--inline"><div class="ds-savebar__bar" role="group" aria-label="Actions"><p class="ds-savebar__text">x</p></div></div></form></div></div>');
    const view = host.lastElementChild;
    const room = () => getComputedStyle(view).scrollPaddingBlockEnd;
    const shown = room();
    view.style.setProperty('--ds-savebar-room', '120px');
    const hooked = room();
    view.querySelector('.ds-savebar__bar').hidden = true;
    return { shown, hooked, hidden: room() };
  });
  // The least height at the largest size and a row for the words, with the margin: 56 + 16 + 32 + 8.
  expect(read.shown).toBe('112px');
  expect(read.hooked).toBe('120px');
  expect(read.hidden).toBe('auto');
});

test('in the flow on a phone: a snackbar rises above the actions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await open(page);
  const flow = page.locator('[data-demo="flow"]');
  // The bottom of the form's scroller at the bottom of the window, as on a phone when the form fills it.
  await flow.evaluate((scroller) => scroller.scrollIntoView({ block: 'end' }));
  await flow.getByRole('button', { name: 'Save' }).click();
  const toast = page.locator('.ds-toast').filter({ hasText: 'Changes saved.' });
  await expect(toast).toBeVisible();
  await settle(page);
  const [box, actions] = [await toast.boundingBox(), await flow.locator('.ds-savebar__bar').boundingBox()];
  expect(actions.y + actions.height, 'the bar is at the bottom of the window').toBeGreaterThan(700);
  expect(box.y + box.height, 'the snackbar clears the bar').toBeLessThanOrEqual(actions.y);
});

test('in the flow on a phone: a size on the bar alone never covers a field or a snackbar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await open(page);
  const flow = page.locator('[data-demo="flow"]');
  const group = flow.getByRole('group', { name: 'Form actions' });
  // The size sits on the bar, out of reach of the scroller and the snackbars that keep the room.
  await group.evaluate((bar) => bar.classList.add('ds-xl'));
  const inputs = flow.locator('input');
  const count = await inputs.count();
  await inputs.first().focus();
  for (let i = 0; i < count; i += 1) {
    await expect(inputs.nth(i)).toBeFocused();
    await settle(page);
    const [field, barBox] = [await inputs.nth(i).boundingBox(), await group.boundingBox()];
    expect(barBox.height, 'the bar wraps, at its largest').toBeGreaterThan(96);
    expect(field.y + field.height, `field ${i} under the bar`).toBeLessThanOrEqual(barBox.y + 2);
    if (i < count - 1) await page.keyboard.press('Tab');
  }
  await flow.evaluate((scroller) => scroller.scrollIntoView({ block: 'end' }));
  await flow.getByRole('button', { name: 'Save' }).click();
  const toast = page.locator('.ds-toast').filter({ hasText: 'Changes saved.' });
  await expect(toast).toBeVisible();
  await settle(page);
  const [box, actions] = [await toast.boundingBox(), await group.boundingBox()];
  expect(box.y + box.height, 'the snackbar clears the bar').toBeLessThanOrEqual(actions.y);
});

test('on a view: a change shows the named region; Tab reaches it; Discard and Save hide it, focus goes back into the form', async ({ page }) => {
  await open(page);
  const view = page.locator('[data-demo="view"]');
  const bar = view.locator('.ds-savebar__bar');
  await expect(bar).toBeHidden();
  const name = view.getByRole('textbox', { name: 'Device name' });
  await name.fill('LAPTOP-0043');
  const region = view.getByRole('region', { name: 'Unsaved changes' });
  await expect(region).toBeVisible();
  await expect(region.locator('.ds-savebar__text')).toHaveText('1 unsaved change');
  await expect(view).toHaveAttribute('data-ds-savebar', '');
  await settle(page);
  // The last field can scroll above the floating bar (WCAG 2.4.11: never hidden; WebKit's own focus scroll stops 2px short of the padding).
  const owner = view.getByRole('textbox', { name: 'Cost centre' });
  await owner.focus();
  await settle(page);
  const [fieldBox, barBox] = [await owner.boundingBox(), await bar.boundingBox()];
  expect(fieldBox.y + fieldBox.height / 2).toBeLessThanOrEqual(barBox.y);
  await page.keyboard.press('Tab');
  await expect(region.getByRole('button', { name: 'Discard' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(bar).toBeHidden();
  await expect(name).toBeFocused();
  await expect(name).toHaveValue('LAPTOP-0042');
  // Save: busy, then hidden, a snackbar says so, and the new value is the saved one.
  await name.fill('LAPTOP-0044');
  await expect(region).toBeVisible();
  await region.getByRole('button', { name: 'Save' }).click();
  await expect(bar).toBeHidden({ timeout: 10000 });
  await expect(page.locator('.ds-toast').filter({ hasText: 'Changes saved.' })).toBeVisible();
  await expect(name).toHaveValue('LAPTOP-0044');
});

test('forced colours: the floating bar keeps an edge, the bar in the flow its hairline', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const read = await page.evaluate(() => {
    const rest = getComputedStyle(document.querySelector('[data-demo="rest"] .ds-savebar__bar'));
    const flow = getComputedStyle(document.querySelector('.ds-savebar--inline .ds-savebar__bar'));
    return { rest: [rest.outlineStyle, parseFloat(rest.outlineWidth)], flow: [flow.borderTopStyle, parseFloat(flow.borderTopWidth)] };
  });
  expect(read.rest).toEqual(['solid', 1]);
  expect(read.flow).toEqual(['solid', 1]);
});
