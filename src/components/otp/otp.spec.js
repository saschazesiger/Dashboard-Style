/**
 * The code field: the names, typing and auto-advance, characters the type
 * refuses, Backspace, Delete and the arrows, paste and autofill spread over
 * the cells, ds:change and ds:complete, submit when complete, the PIN mask,
 * alphanumeric codes, the group's aria-invalid on every cell, size, touch and
 * the narrow width, forced colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=otp');
  await ready(page);
}

async function add(page, { length = 6, attrs = '', form = false } = {}) {
  await page.evaluate(({ length, attrs, form }) => {
    let cells = '';
    for (let i = 0; i < length; i += 1) {
      if (i === 3) cells += '<span class="ds-otp__sep" aria-hidden="true"></span>';
      cells += `<input class="ds-input ds-otp__cell" id="c${i}">`;
    }
    const field = '<div class="ds-field"><span class="ds-field__label" id="o-label">Verification code</span>' +
      `<div class="ds-otp" id="o" role="group" aria-labelledby="o-label" data-ds-otp ${attrs}>${cells}<input type="hidden" name="code" id="o-value"></div></div>`;
    const html = form ? `<form id="o-form" action="javascript:void 0">${field}<button type="reset" id="o-reset">Clear</button></form>` : field;
    document.querySelector('#fx-component').insertAdjacentHTML('afterbegin', html);
    window.sgEvents = [];
    const group = document.getElementById('o');
    group.addEventListener('ds:change', (event) => window.sgEvents.push(['change', event.detail.value, event.detail.complete]));
    group.addEventListener('ds:complete', (event) => window.sgEvents.push(['complete', event.detail.value]));
  }, { length, attrs, form });
  await page.waitForFunction(() => document.getElementById('c0')?.hasAttribute('aria-label'));
  return page.locator('#o');
}

const values = (page) => page.locator('#o .ds-otp__cell').evaluateAll((cells) => cells.map((cell) => cell.value).join('|'));
const focused = (page) => page.evaluate(() => document.activeElement?.id);

test('names: the group by its label, every cell "Digit n of 6"; one-time-code on the first only', async ({ page }) => {
  await open(page);
  const group = await add(page);
  await expect(group).toHaveAccessibleName('Verification code');
  await expect(group).toHaveAttribute('role', 'group');
  await expect(page.locator('#c0')).toHaveAccessibleName('Digit 1 of 6');
  await expect(page.locator('#c5')).toHaveAccessibleName('Digit 6 of 6');
  await expect(page.locator('#c0')).toHaveAttribute('autocomplete', 'one-time-code');
  await expect(page.locator('#c1')).toHaveAttribute('autocomplete', 'off');
  await expect(page.locator('#c0')).toHaveAttribute('inputmode', 'numeric');
  await expect(page.locator('#c0')).toHaveAttribute('type', 'text');
});

test('typing fills and advances, refuses letters, completes once; the hidden value follows', async ({ page }) => {
  await open(page);
  await add(page);
  await page.locator('#c0').focus();
  await page.keyboard.type('12a3');
  expect(await values(page)).toBe('1|2|3|||');
  expect(await focused(page)).toBe('c3');
  await page.keyboard.type('456');
  expect(await values(page)).toBe('1|2|3|4|5|6');
  expect(await focused(page)).toBe('c5');
  await expect(page.locator('#o-value')).toHaveValue('123456');
  const events = await page.evaluate(() => window.sgEvents);
  expect(events.filter((e) => e[0] === 'complete')).toEqual([['complete', '123456']]);
  expect(events.at(-2)).toEqual(['change', '123456', true]);
  // Typing over the last cell replaces it: still complete, no second complete event.
  await page.keyboard.type('9');
  expect(await values(page)).toBe('1|2|3|4|5|9');
  expect((await page.evaluate(() => window.sgEvents)).filter((e) => e[0] === 'complete').length).toBe(1);
});

test('Backspace, Delete, the arrows, Home and End', async ({ page }) => {
  await open(page);
  await add(page);
  await page.locator('#c0').focus();
  await page.keyboard.type('1234');
  expect(await focused(page)).toBe('c4');
  await page.keyboard.press('Backspace');
  expect(await values(page)).toBe('1|2|3|||');
  expect(await focused(page)).toBe('c3');
  await page.keyboard.press('Backspace');
  expect(await values(page)).toBe('1|2||||');
  expect(await focused(page)).toBe('c2');
  await page.keyboard.press('ArrowRight');
  expect(await focused(page)).toBe('c3');
  await page.keyboard.press('ArrowLeft');
  expect(await focused(page)).toBe('c2');
  await page.keyboard.press('Home');
  expect(await focused(page)).toBe('c0');
  await page.keyboard.press('Delete');
  expect(await values(page)).toBe('|2||||');
  expect(await focused(page)).toBe('c0');
  await page.keyboard.press('ArrowRight');
  expect(await focused(page)).toBe('c1');
  await page.keyboard.press('End');
  expect(await focused(page)).toBe('c5');
  await page.keyboard.press('ArrowRight');
  expect(await focused(page)).toBe('c5');
  // Typing in a filled cell replaces its character.
  await page.locator('#c1').focus();
  await page.keyboard.type('7');
  expect(await values(page)).toBe('|7||||');
  expect(await focused(page)).toBe('c2');
});

test('paste: a whole code fills from the first cell, a part from the cell it lands in', async ({ page }) => {
  await open(page);
  await add(page);
  const paste = (id, text) => page.evaluate(({ id, text }) => {
    const data = new DataTransfer();
    data.setData('text/plain', text);
    const cell = document.getElementById(id);
    cell.focus();
    const event = new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true });
    cell.dispatchEvent(event);
    // Firefox leaves a constructed event's clipboardData empty: then the text arrives as the browser inserts it.
    if (!event.defaultPrevented) {
      cell.value = text;
      cell.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste' }));
    }
  }, { id, text });
  await paste('c3', '12');
  expect(await values(page)).toBe('|||1|2|');
  expect(await focused(page)).toBe('c5');
  await paste('c4', '402 913');
  expect(await values(page)).toBe('4|0|2|9|1|3');
  expect(await focused(page)).toBe('c5');
  await expect(page.locator('#o-value')).toHaveValue('402913');
});

test('autofill: the code arriving in the first cell spreads over all', async ({ page }) => {
  await open(page);
  await add(page);
  await page.evaluate(() => {
    const cell = document.getElementById('c0');
    cell.value = '654321';
    cell.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(await values(page)).toBe('6|5|4|3|2|1');
  expect((await page.evaluate(() => window.sgEvents)).filter((e) => e[0] === 'complete')).toEqual([['complete', '654321']]);
});

test('submit when complete; a reset empties the hidden value', async ({ page }) => {
  await open(page);
  await add(page, { attrs: 'data-ds-otp-submit', form: true });
  await page.evaluate(() => {
    window.sgSubmits = 0;
    document.getElementById('o-form').addEventListener('submit', (event) => { event.preventDefault(); window.sgSubmits += 1; });
  });
  await page.locator('#c0').focus();
  await page.keyboard.type('123456');
  expect(await page.evaluate(() => window.sgSubmits)).toBe(1);
  await page.locator('#o-reset').click();
  await expect(page.locator('#o-value')).toHaveValue('');
  expect(await values(page)).toBe('|||||');
});

test('a PIN is masked; an alphanumeric code upper-cases and names its cells "Character"', async ({ page }) => {
  await open(page);
  await add(page, { length: 4, attrs: 'data-ds-otp-mask' });
  await expect(page.locator('#c0')).toHaveAttribute('type', 'password');
  await page.evaluate(() => {
    const group = document.getElementById('o');
    group.removeAttribute('data-ds-otp-mask');
    group.setAttribute('data-ds-otp-type', 'alphanumeric');
  });
  await expect(page.locator('#c0')).toHaveAttribute('type', 'text');
  await expect(page.locator('#c0')).toHaveAccessibleName('Character 1 of 4');
  await page.locator('#c0').focus();
  await page.keyboard.type('a-b9');
  expect(await values(page)).toBe('A|B|9|');
});

test('the group\'s aria-invalid reaches every cell and leaves with it; set() and clear()', async ({ page }) => {
  await open(page);
  const group = await add(page);
  const border = () => page.locator('#c3').evaluate((el) => getComputedStyle(el).borderTopColor);
  const rest = await border();
  await page.evaluate(() => document.getElementById('o').setAttribute('aria-invalid', 'true'));
  await expect(page.locator('#c3')).toHaveAttribute('aria-invalid', 'true');
  // The border colour glides on --ds-dur-fast.
  await expect.poll(border).toBe(await page.evaluate(() => {
    const probe = document.createElement('i');
    probe.style.color = 'var(--ds-error)';
    document.getElementById('o').append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  }));
  await page.evaluate(() => document.getElementById('o').removeAttribute('aria-invalid'));
  await expect(page.locator('#c3')).not.toHaveAttribute('aria-invalid', /./);
  await expect.poll(border).toBe(rest);
  await page.evaluate(() => window.DS.core.get(document.getElementById('o'), 'otp').set('12 3'));
  expect(await values(page)).toBe('1|2|3|||');
  await page.evaluate(() => window.DS.core.get(document.getElementById('o'), 'otp').clear());
  expect(await values(page)).toBe('|||||');
  expect(await focused(page)).toBe('c0');
  await expect(group).toBeVisible();
});

test('size and touch: cells step 8px in both directions, the touch target wins; 360px fits', async ({ page }) => {
  await open(page);
  await add(page);
  const box = (cls) => page.evaluate((cls) => {
    document.getElementById('o').className = 'ds-otp ' + cls;
    const rect = document.getElementById('c0').getBoundingClientRect();
    return [rect.width, rect.height];
  }, cls);
  expect(await box('')).toEqual([40, 40]);
  expect(await box('ds-sm')).toEqual([32, 32]);
  expect(await box('ds-lg')).toEqual([48, 48]);
  expect(await box('ds-xs ds-touch')).toEqual([48, 48]);
  expect(await box('ds-xl')).toEqual([56, 56]);
  await box('ds-touch');
  await page.setViewportSize({ width: 360, height: 800 });
  // Six cells at the touch target and the demo's eight stay on one line inside their group at a phone's width.
  const fit = await page.evaluate(() => [
    [...document.querySelectorAll('.ds-otp')].every((group) => {
      const box = group.getBoundingClientRect();
      return [...group.querySelectorAll('.ds-otp__cell')].every((cell) => {
        const rect = cell.getBoundingClientRect();
        return rect.right <= box.right + 0.5 && rect.top === group.querySelector('.ds-otp__cell').getBoundingClientRect().top;
      });
    }),
    document.documentElement.scrollWidth - document.documentElement.clientWidth,
  ]);
  expect(fit).toEqual([true, 0]);
  await page.evaluate(() => document.querySelectorAll('.ds-otp').forEach((group) => group.classList.add('ds-touch')));
  expect((await page.evaluate(() => [...document.querySelectorAll('.ds-otp')].every((group) => group.lastElementChild.previousElementSibling.getBoundingClientRect().right <= group.getBoundingClientRect().right + 0.5)))).toBe(true);
});

test('the demo: every variant and state, no console errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await open(page);
  await expect(page.locator('.ds-otp[data-ds-otp-mask] .ds-otp__cell').first()).toHaveAttribute('type', 'password');
  await expect(page.locator('[data-demo="states"] .ds-otp[aria-invalid="true"] .ds-otp__cell').first()).toHaveAttribute('aria-invalid', 'true');
  const form = page.locator('[data-demo="verify"]');
  await form.locator('.ds-otp__cell').first().focus();
  await page.keyboard.type('111111');
  await form.locator('button[type="submit"]').click();
  await expect(form.locator('.ds-otp')).toHaveAttribute('aria-invalid', 'true');
  expect(errors).toEqual([]);
});

test('forced colours: the separator is a system-colour dash, the cells keep their edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await add(page);
  const out = await page.evaluate(() => [
    getComputedStyle(document.querySelector('#o .ds-otp__sep')).backgroundColor,
    getComputedStyle(document.getElementById('c0')).borderTopStyle,
  ]);
  expect(out[0]).not.toBe('rgba(0, 0, 0, 0)');
  expect(out[1]).toBe('solid');
});
