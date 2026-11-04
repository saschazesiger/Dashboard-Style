/**
 * The number input: the spinbutton's role and values, the APG keys, typed
 * text read and written in the locale, the steppers (focus kept, off at the
 * ends, a held repeat), currency and unit affixes, the hidden plain value,
 * the events, sizes, density and touch, forced colours. Runs in `fallback`
 * too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=number');
  await ready(page);
}

/** A number group added to the fixture (attributes on the group), its controller ready. */
async function add(page, { attrs = '', value = '', extra = '', id = 'n', split = false, hidden = false, cls = '' } = {}) {
  await page.evaluate(({ attrs, value, extra, id, split, hidden, cls }) => {
    const steps = '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-number__step ds-number__down" type="button" tabindex="-1">-</button>' +
      '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-number__step ds-number__up" type="button" tabindex="-1">+</button>';
    const html = `<div class="ds-field ${cls}" id="${id}-field"><label class="ds-field__label" for="${id}">Quota</label>` +
      `<div class="ds-input-group ds-number${split ? ' ds-number--split' : ''}" id="${id}-group" data-ds-number ${attrs}>` +
      '<span class="ds-input-group__prefix" aria-hidden="true"></span>' +
      `<input class="ds-input" id="${id}" type="text" inputmode="decimal" value="${value}" ${extra}>` +
      '<span class="ds-input-group__suffix" aria-hidden="true"></span>' +
      (split ? steps : `<span class="ds-input-group__trailing ds-number__steps">${steps}</span>`) +
      (hidden ? `<input type="hidden" name="${id}" value="${value}">` : '') + '</div></div>';
    document.querySelector('#fx-component').insertAdjacentHTML('afterbegin', html);
  }, { attrs, value, extra, id, split, hidden, cls });
  await page.waitForFunction((id) => document.getElementById(id)?.getAttribute('role') === 'spinbutton', id);
  return page.locator(`#${id}`);
}

test('the field is a spinbutton with its values; the steppers are named and point at it', async ({ page }) => {
  await open(page);
  const field = await add(page, { attrs: 'data-ds-number-min="0" data-ds-number-max="500" data-ds-number-step="5" data-ds-number-unit="gigabyte"', value: '50' });
  await expect(field).toHaveAttribute('role', 'spinbutton');
  await expect(field).toHaveAttribute('aria-valuenow', '50');
  await expect(field).toHaveAttribute('aria-valuemin', '0');
  await expect(field).toHaveAttribute('aria-valuemax', '500');
  await expect(field).toHaveAttribute('aria-valuetext', '50 gigabytes');
  await expect(page.getByRole('spinbutton', { name: 'Quota', exact: true })).toHaveCount(1);
  const down = page.locator('#n-group .ds-number__down');
  await expect(down).toHaveAttribute('aria-label', 'Decrease');
  await expect(page.locator('#n-group .ds-number__up')).toHaveAttribute('aria-label', 'Increase');
  await expect(down).toHaveAttribute('aria-controls', 'n');
  await expect(down).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('#n-group .ds-input-group__suffix')).toHaveText('GB');
});

test('keys: arrows step, PageUp and PageDown a page, Home and End the limits; off-grid values land on the grid', async ({ page }) => {
  await open(page);
  const field = await add(page, { attrs: 'data-ds-number-min="0" data-ds-number-max="500" data-ds-number-step="5"', value: '50' });
  await field.focus();
  await page.keyboard.press('ArrowUp');
  await expect(field).toHaveValue('55');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(field).toHaveValue('45');
  await page.keyboard.press('PageUp');
  await expect(field).toHaveValue('95');
  await page.keyboard.press('PageDown');
  await expect(field).toHaveValue('45');
  await page.keyboard.press('End');
  await expect(field).toHaveValue('500');
  await expect(field).toHaveAttribute('aria-valuenow', '500');
  await page.keyboard.press('ArrowUp');
  await expect(field).toHaveValue('500');
  await page.keyboard.press('Home');
  await expect(field).toHaveValue('0');
  await field.fill('7');
  await page.keyboard.press('ArrowUp');
  await expect(field).toHaveValue('10');
  await field.fill('7');
  await page.keyboard.press('ArrowDown');
  await expect(field).toHaveValue('5');
});

test('typed text: committed on Enter and blur, read in the locale, kept within the limits, rounded, or put back', async ({ page }) => {
  await open(page);
  const field = await add(page, { attrs: 'data-ds-number-min="0" data-ds-number-max="5000" data-ds-number-step="0.5"', value: '2', hidden: true });
  await field.fill('1234.26');
  await page.keyboard.press('Tab');
  await expect(field).toHaveValue('1,234.5');
  await expect(page.locator('#n-group input[type=hidden]')).toHaveValue('1234.5');
  await field.fill('99999');
  await field.press('Enter');
  await expect(field).toHaveValue('5,000.0');
  await field.fill('lots');
  await field.press('Enter');
  await expect(field).toHaveValue('5,000.0');
  await field.fill('-3');
  await field.press('Enter');
  await expect(field).toHaveValue('0.0');
  await field.fill('');
  await field.press('Enter');
  await expect(field).toHaveValue('');
  await expect(field).not.toHaveAttribute('aria-valuenow', /./);
  await expect(page.locator('#n-group input[type=hidden]')).toHaveValue('');
});

test('a German field: its separators, the euro sign behind the figure, the spoken amount', async ({ page }) => {
  await open(page);
  await add(page, { attrs: 'data-ds-number-currency="EUR"', value: '' });
  const field = page.locator('#n');
  await page.evaluate(() => {
    const group = document.getElementById('n-group');
    window.DS.core.destroy(group);
    group.removeAttribute('data-ds-number');
    window.sgNumber = window.DS.number.create(group, { locale: 'de' });
  });
  await field.fill('1.234,5');
  await field.press('Enter');
  await expect(field).toHaveValue('1.234,50');
  expect(await page.evaluate(() => window.sgNumber.get())).toBe(1234.5);
  await expect(page.locator('#n-group .ds-input-group__suffix')).toHaveText('€');
  await expect(page.locator('#n-group .ds-input-group__prefix')).toBeHidden();
  await expect(field).toHaveAttribute('aria-valuetext', /1\.234,50 Euro/);
});

test('an English amount: the symbol before the figure, the currency\'s two decimals', async ({ page }) => {
  await open(page);
  const field = await add(page, { attrs: 'data-ds-number-currency="EUR" data-ds-number-min="0"', value: '19.9' });
  await expect(field).toHaveValue('19.90');
  await expect(page.locator('#n-group .ds-input-group__prefix')).toHaveText('€');
  await expect(page.locator('#n-group .ds-input-group__suffix')).toBeHidden();
  await expect(field).toHaveAttribute('aria-valuetext', '19.90 euros');
});

test('steppers: the focus stays, a press steps once, they are off at the ends and while the field is blocked', async ({ page }) => {
  await open(page);
  const field = await add(page, { attrs: 'data-ds-number-min="0" data-ds-number-max="2"', value: '1' });
  const down = page.locator('#n-group .ds-number__down');
  const up = page.locator('#n-group .ds-number__up');
  await field.focus();
  await up.click();
  await expect(field).toHaveValue('2');
  await expect(field).toBeFocused();
  await expect(up).toBeDisabled();
  await down.click();
  await down.click();
  await expect(field).toHaveValue('0');
  await expect(down).toBeDisabled();
  await expect(up).toBeEnabled();
  await page.evaluate(() => {
    const input = document.getElementById('n');
    input.readOnly = true;
    window.DS.core.get(document.getElementById('n-group'), 'number').update();
  });
  await expect(up).toBeDisabled();
});

test('a held stepper repeats until it is let go', async ({ page }) => {
  await open(page);
  const field = await add(page, { attrs: 'data-ds-number-min="0" data-ds-number-max="100"', value: '0' });
  const box = await page.locator('#n-group .ds-number__up').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1200);
  await page.mouse.up();
  const held = Number(await field.inputValue());
  expect(held).toBeGreaterThan(3);
  await page.waitForTimeout(400);
  expect(Number(await field.inputValue())).toBe(held);
});

test('a click without a pointer (a screen reader) steps once; a step from a stepper is announced', async ({ page }) => {
  await open(page);
  const field = await add(page, { attrs: 'data-ds-number-unit="kilogram"', value: '4' });
  await page.evaluate(() => document.querySelector('#n-group .ds-number__up').click());
  await expect(field).toHaveValue('5');
  await page.waitForFunction(() => [...document.querySelectorAll('[aria-live]')].some((el) => el.textContent.includes('5 kilograms')), null, { timeout: 3000 });
});

test('events: input and change on the field, ds:change on the group, once per change', async ({ page }) => {
  await open(page);
  const field = await add(page, { value: '1' });
  await page.evaluate(() => {
    window.sgEvents = [];
    const group = document.getElementById('n-group');
    for (const type of ['input', 'change', 'ds:change']) group.addEventListener(type, (event) => window.sgEvents.push(type === 'ds:change' ? `${type} ${event.detail.value}` : type));
  });
  await field.focus();
  await page.keyboard.press('ArrowUp');
  expect(await page.evaluate(() => window.sgEvents)).toEqual(['input', 'change', 'ds:change 2']);
  await page.evaluate(() => { window.sgEvents = []; window.DS.core.get(document.getElementById('n-group'), 'number').set(2); });
  expect(await page.evaluate(() => window.sgEvents)).toEqual([]);
});

test('the controller: set, step, get and on, and a morph keeps the spinbutton', async ({ page }) => {
  await open(page);
  const field = await add(page, { attrs: 'data-ds-number-step="0.25"', value: '1' });
  const out = await page.evaluate(() => {
    const made = window.DS.core.get(document.getElementById('n-group'), 'number');
    const seen = [];
    const off = made.on('change', ({ value }) => seen.push(value));
    made.set('2.5');
    made.step(2);
    off();
    made.step(-1);
    return { value: made.get(), seen };
  });
  expect(out).toEqual({ value: 2.75, seen: [2.5, 3] });
  await expect(field).toHaveValue('2.75');
  await page.evaluate(() => {
    const group = document.getElementById('n-group');
    const copy = group.cloneNode(true);
    for (const name of ['role', 'aria-valuenow', 'aria-valuetext']) copy.querySelector('#n').removeAttribute(name);
    window.DS.dom.morphHtml(group.parentElement, group.parentElement.innerHTML.replace(group.outerHTML, copy.outerHTML));
  });
  await expect(field).toHaveAttribute('role', 'spinbutton');
  await expect(field).toHaveAttribute('aria-valuenow', '2.75');
});

test('size, density and touch: the field 8px per size step, 4px per density step; the steppers 8px less; touch wins', async ({ page }) => {
  await open(page);
  const measure = (cls) => page.evaluate((cls) => {
    const field = document.getElementById('n-field');
    field.className = `ds-field ${cls}`;
    const group = document.getElementById('n-group');
    const step = group.querySelector('.ds-number__up');
    return [group.getBoundingClientRect().height, step.getBoundingClientRect().height];
  }, cls);
  await add(page, { value: '3' });
  expect(await measure('')).toEqual([40, 32]);
  expect(await measure('ds-lg')).toEqual([48, 40]);
  expect(await measure('ds-xs')).toEqual([24, 16]);
  expect(await measure('ds-density-dense')).toEqual([32, 24]);
  expect(await measure('ds-touch ds-density-dense')).toEqual([48, 48]);
  await page.evaluate(() => { document.getElementById('n-field').className = 'ds-field ds-shape-square'; });
  // The radius glides there (the press morph's transition).
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector('#n-group .ds-number__up')).borderTopLeftRadius)).toBe('0px');
});

test('split: the minus first and the plus last whatever the markup, the figure centred', async ({ page }) => {
  await open(page);
  await add(page, { value: '3', split: true });
  const boxes = await page.evaluate(() => {
    const group = document.getElementById('n-group');
    const x = (sel) => group.querySelector(sel).getBoundingClientRect().x;
    return { down: x('.ds-number__down'), field: x('.ds-input'), up: x('.ds-number__up'), align: getComputedStyle(group.querySelector('.ds-input')).textAlign };
  });
  expect(boxes.down).toBeLessThan(boxes.field);
  expect(boxes.field).toBeLessThan(boxes.up);
  expect(boxes.align).toBe('center');
});

test('the demo renders every section without console errors and the German fields read in German', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await open(page);
  await expect(page.locator('[data-demo="german"] .ds-input').first()).toHaveValue('1.234,50');
  await expect(page.getByRole('spinbutton')).not.toHaveCount(0);
  expect(errors).toEqual([]);
});

test('forced colours: the steppers are system buttons, GrayText while disabled', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await add(page, { attrs: 'data-ds-number-min="0"', value: '0' });
  const colours = await page.evaluate(() => {
    const read = (value) => {
      const el = document.createElement('span');
      el.style.color = value;
      document.body.append(el);
      const colour = getComputedStyle(el).color;
      el.remove();
      return colour;
    };
    return { off: getComputedStyle(document.querySelector('#n-group .ds-number__down')).color, gray: read('GrayText') };
  });
  expect(colours.off).toBe(colours.gray);
});
