/**
 * The password: the reveal (type, aria-pressed, the caret, spell checking,
 * hidden again on submit), the meter (bars, words, data-level, ds:change, an
 * announcement), the caps-lock hint, a scoring of the page's own, the
 * descriptions, size and touch of the parts, forced colours. Runs in
 * `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=password');
  await ready(page);
}

async function add(page, { attrs = '', extra = '', form = false } = {}) {
  await page.evaluate(({ attrs, extra, form }) => {
    const field = '<div class="ds-field" id="p-root" data-ds-password ' + attrs + '><label class="ds-field__label" for="p">New password</label>' +
      '<div class="ds-input-group"><input class="ds-input" id="p" type="password" autocomplete="off" aria-describedby="p-meter p-caps" ' + extra + '>' +
      '<span class="ds-input-group__trailing"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" id="p-show" type="button" aria-pressed="false">' +
      '<span class="ds-icon-swap"><span class="ds-icon-swap__a"></span><span class="ds-icon-swap__b"></span></span></button></span></div>' +
      '<div class="ds-password__meter" id="p-meter"><span class="ds-password__bars" aria-hidden="true"><span></span><span></span><span></span><span></span></span><span class="ds-password__strength"></span></div>' +
      '<small class="ds-field__hint ds-field__hint--warning ds-password__caps" id="p-caps" hidden></small></div>';
    const html = form ? `<form id="p-form" action="javascript:void 0">${field}<button type="submit" id="p-submit">Save</button></form>` : field;
    document.querySelector('#fx-component').insertAdjacentHTML('afterbegin', html);
  }, { attrs, extra, form });
  await page.waitForFunction(() => document.querySelector('#p-meter')?.hasAttribute('data-level'));
  return page.locator('#p');
}

test('reveal: type, aria-pressed and the default name; the caret stays; no spell checking while shown', async ({ page }) => {
  await open(page);
  const input = await add(page);
  const show = page.locator('#p-show');
  await expect(show).toHaveAttribute('aria-label', 'Show password');
  await expect(show).toHaveAttribute('aria-controls', 'p');
  await input.fill('secret-value');
  await input.evaluate((el) => el.setSelectionRange(3, 6));
  await show.click();
  await expect(input).toHaveAttribute('type', 'text');
  await expect(show).toHaveAttribute('aria-pressed', 'true');
  await expect(input).toHaveAttribute('spellcheck', 'false');
  await expect(input).toHaveAttribute('autocapitalize', 'off');
  await input.focus();
  await input.evaluate((el) => el.setSelectionRange(3, 6));
  await page.keyboard.press('Tab');
  await expect(show).toBeFocused();
  await page.keyboard.press('Space');
  await expect(input).toHaveAttribute('type', 'password');
  await expect(show).toHaveAttribute('aria-pressed', 'false');
  await expect(input).not.toHaveAttribute('spellcheck', /./);
});

test('the caret and selection survive a reveal while the field has the focus', async ({ page }) => {
  await open(page);
  const input = await add(page);
  await input.fill('abcdefgh');
  const sel = await page.evaluate(() => {
    const el = document.getElementById('p');
    el.focus();
    el.setSelectionRange(2, 5);
    window.DS.core.get(document.getElementById('p-root'), 'password').set({ revealed: true });
    return [el.type, el.selectionStart, el.selectionEnd, document.activeElement === el];
  });
  expect(sel).toEqual(['text', 2, 5, true]);
});

test('a submit hides the password again', async ({ page }) => {
  await open(page);
  const input = await add(page, { form: true });
  await input.fill('abcdefgh');
  await page.locator('#p-show').click();
  await expect(input).toHaveAttribute('type', 'text');
  await page.locator('#p-submit').click();
  await expect(input).toHaveAttribute('type', 'password');
});

test('the meter: bars and words per level, data-level, ds:change once per level, announced after a pause', async ({ page }) => {
  await open(page);
  const input = await add(page);
  const meter = page.locator('#p-meter');
  await page.evaluate(() => {
    window.sgLevels = [];
    document.getElementById('p-root').addEventListener('ds:change', (event) => window.sgLevels.push(event.detail.strength));
  });
  await expect(meter).toHaveAttribute('data-level', '0');
  await expect(page.locator('#p-meter .ds-password__strength')).toHaveText('');
  const filled = () => page.evaluate(() => {
    const bars = [...document.querySelectorAll('#p-meter .ds-password__bars > span')];
    const empty = getComputedStyle(bars[3]).backgroundColor;
    return bars.filter((bar) => getComputedStyle(bar).backgroundColor !== empty).length;
  });
  for (const [value, level, word] of [['abc', 1, 'Weak'], ['devices42', 2, 'Fair'], ['Tr0ub4dor&3', 3, 'Good'], ['correct horse battery staple', 4, 'Strong']]) {
    await input.fill(value);
    await expect(meter).toHaveAttribute('data-level', String(level));
    await expect(page.locator('#p-meter .ds-password__strength')).toHaveText(`Password strength: ${word}`);
    if (level < 4) await expect.poll(filled).toBe(level);
  }
  await input.fill('correct horse battery staples');
  expect(await page.evaluate(() => window.sgLevels)).toEqual([1, 2, 3, 4]);
  await page.waitForFunction(() => [...document.querySelectorAll('[aria-live]')].some((el) => el.textContent.includes('Password strength: Strong')), null, { timeout: 3000 });
  await expect(input).toHaveAccessibleDescription('Password strength: Strong');
});

test('the minimum length: minlength on the input first, else data-ds-password-min', async ({ page }) => {
  await open(page);
  const input = await add(page, { attrs: 'data-ds-password-min="20"' });
  await input.fill('Tr0ub4dor&3');
  await expect(page.locator('#p-meter')).toHaveAttribute('data-level', '1');
  // The input's minlength wins over the attribute (the engine enforces it).
  await input.evaluate((el) => el.setAttribute('minlength', '8'));
  await input.fill('');
  await input.fill('Tr0ub4dor&3');
  await expect(page.locator('#p-meter')).not.toHaveAttribute('data-level', '1');
});

test('caps lock: the hint shows while it is on, with its default text, and goes on blur', async ({ page, browserName }) => {
  await open(page);
  const input = await add(page);
  const caps = page.locator('#p-caps');
  await expect(caps).toBeHidden();
  await expect(caps).toHaveText('Caps Lock is on.');
  await input.focus();
  await input.evaluate((el) => {
    const event = new KeyboardEvent('keydown', { key: 'A', bubbles: true, modifierCapsLock: true });
    el.dispatchEvent(event);
  });
  test.skip(browserName === 'webkit', 'WebKit does not take modifierCapsLock from the KeyboardEvent constructor');
  await expect(caps).toBeVisible();
  await expect(input).toHaveAttribute('aria-describedby', 'p-meter p-caps');
  await page.locator('#p-show').focus();
  await expect(input).toHaveAttribute('aria-describedby', 'p-meter');
  await expect(caps).toBeHidden();
});

test('a scoring of the page\'s own replaces the built-in one', async ({ page }) => {
  await open(page);
  const input = await add(page);
  await page.evaluate(() => {
    const root = document.getElementById('p-root');
    window.DS.core.destroy(root);
    root.removeAttribute('data-ds-password');
    window.DS.password.create(root, { score: (value) => (value.includes('!') ? 4 : 1) });
  });
  await input.fill('abc!');
  await expect(page.locator('#p-meter')).toHaveAttribute('data-level', '4');
});

test('the demo: every level, no console errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await open(page);
  const words = await page.locator('[data-demo="levels"] .ds-password__strength').allTextContents();
  expect(words).toEqual(['Password strength: Weak', 'Password strength: Fair', 'Password strength: Good', 'Password strength: Strong']);
  expect(errors).toEqual([]);
});

test('touch: the reveal button takes the touch target; the bars follow the shape', async ({ page }) => {
  await open(page);
  await add(page);
  const out = await page.evaluate(() => {
    document.getElementById('p-root').classList.add('ds-touch', 'ds-shape-square');
    return [document.getElementById('p-show').getBoundingClientRect().height, getComputedStyle(document.querySelector('#p-meter .ds-password__bars > span')).borderTopLeftRadius];
  });
  expect(out).toEqual([48, '0px']);
});

test('forced colours: filled bars CanvasText, empty ones outlined', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const input = await add(page);
  await input.fill('devices42');
  // The bars' colour glides on --ds-dur-fast.
  await expect.poll(() => page.evaluate(() => {
    const bars = [...document.querySelectorAll('#p-meter .ds-password__bars > span')].map((bar) => getComputedStyle(bar));
    return [bars[0].backgroundColor === bars[0].outlineColor, bars[3].outlineStyle, bars[3].backgroundColor !== bars[0].backgroundColor];
  })).toEqual([true, 'solid', true]);
});
