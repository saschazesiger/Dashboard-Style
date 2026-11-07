/**
 * Type-to-confirm: the label the system writes, the blocked red button
 * (aria-disabled, in the tab order, the guard), the match (outer spaces,
 * case, paste), Enter before the match marks the field, the confirm closes
 * the dialog, an async confirm (busy, then closed), a failed one (the error
 * in words, the dialog open), the reset on open, a changed name, the D10
 * button, forced colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=typeconfirm');
  await ready(page);
}

async function add(page, { attrs = '' } = {}) {
  await page.evaluate(({ attrs }) => {
    document.querySelector('#fx-component').insertAdjacentHTML('afterbegin',
      '<button class="ds-btn" type="button" id="tc-open" data-ds-open="#tc">Delete</button>' +
      '<dialog class="ds-dialog" id="tc" role="alertdialog" aria-labelledby="tc-title" aria-describedby="tc-text"><div class="ds-dialog__backdrop" data-ds-close></div>' +
      `<form class="ds-dialog__box ds-typeconfirm" id="tc-box" data-ds-typeconfirm="LAPTOP-0042" ${attrs}>` +
      '<h2 class="ds-dialog__title" id="tc-title">Delete LAPTOP-0042?</h2><p class="ds-dialog__text" id="tc-text">This cannot be undone.</p>' +
      '<div class="ds-field"><label class="ds-field__label ds-typeconfirm__label" for="tc-input"></label>' +
      '<input class="ds-input ds-typeconfirm__input" id="tc-input" autocomplete="off" spellcheck="false" autocapitalize="off">' +
      '<small class="ds-field__hint ds-field__hint--error ds-typeconfirm__error" id="tc-error" hidden></small></div>' +
      '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" id="tc-cancel" data-ds-close autofocus>Cancel</button>' +
      '<button class="ds-btn ds-btn--filled ds-tone-error ds-typeconfirm__confirm" id="tc-confirm" type="submit">Delete device</button></div></form></dialog>');
    window.sgConfirms = 0;
    document.getElementById('tc-box').addEventListener('ds:confirm', () => { window.sgConfirms += 1; });
  }, { attrs });
  await page.waitForFunction(() => document.getElementById('tc-confirm')?.getAttribute('aria-disabled') === 'true');
  await page.locator('#tc-open').click();
  await expect(page.locator('#tc')).toBeVisible();
}

test('the label names what to type; the red button waits in the tab order and says it is unavailable', async ({ page }) => {
  await open(page);
  await add(page);
  await expect(page.locator('#tc-input')).toHaveAccessibleName('Type LAPTOP-0042 to confirm');
  await expect(page.locator('#tc-box .ds-typeconfirm__name')).toHaveText('LAPTOP-0042');
  const confirm = page.locator('#tc-confirm');
  await expect(confirm).toHaveAttribute('aria-disabled', 'true');
  await expect(confirm).toHaveAccessibleName('Delete device');
  await expect(page.locator('#tc-cancel')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#tc-input')).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(confirm).toBeFocused();
  // The guard blocks the blocked button for every input.
  await page.keyboard.press('Enter');
  await confirm.click({ force: true });
  await expect(page.locator('#tc')).toBeVisible();
  expect(await page.evaluate(() => window.sgConfirms)).toBe(0);
});

test('Enter before the match marks the field and keeps the focus; typing the name unblocks; Enter deletes and closes', async ({ page }) => {
  await open(page);
  await add(page);
  const input = page.locator('#tc-input');
  await page.evaluate(() => {
    window.sgSubmits = 0;
    document.getElementById('tc-box').addEventListener('submit', () => { window.sgSubmits += 1; });
  });
  await input.focus();
  await page.keyboard.type('LAPTOP');
  await page.keyboard.press('Enter');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  // Capture: the page's own submit handler never hears a submit that does not match.
  expect(await page.evaluate(() => window.sgSubmits)).toBe(0);
  await expect(input).toBeFocused();
  await expect(page.locator('#tc')).toBeVisible();
  await page.keyboard.type('-0042 ');
  await expect(input).not.toHaveAttribute('aria-invalid', /./);
  await expect(page.locator('#tc-confirm')).not.toHaveAttribute('aria-disabled', /./);
  await page.keyboard.press('Enter');
  await expect(page.locator('#tc')).toBeHidden();
  expect(await page.evaluate(() => window.sgConfirms)).toBe(1);
  await expect(page.locator('#tc-open')).toBeFocused();
});

test('the case counts unless asked; paste works', async ({ page }) => {
  await open(page);
  await add(page);
  const input = page.locator('#tc-input');
  await input.fill('laptop-0042');
  await expect(page.locator('#tc-confirm')).toHaveAttribute('aria-disabled', 'true');
  await page.evaluate(() => document.getElementById('tc-box').setAttribute('data-ds-typeconfirm-case', 'insensitive'));
  await expect(page.locator('#tc-confirm')).not.toHaveAttribute('aria-disabled', /./);
  await input.fill('');
  await input.evaluate((el) => {
    el.focus();
    el.value = 'LAPTOP-0042';
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste' }));
  });
  await expect(page.locator('#tc-confirm')).not.toHaveAttribute('aria-disabled', /./);
});

test('an async confirm: busy and read-only, then closed', async ({ page }) => {
  await open(page);
  await add(page);
  await page.evaluate(() => {
    document.getElementById('tc-box').addEventListener('ds:confirm', (event) => event.detail.wait(new Promise((resolve) => { window.sgResolve = resolve; })));
  });
  await page.locator('#tc-input').fill('LAPTOP-0042');
  await page.locator('#tc-confirm').click();
  await expect(page.locator('#tc-confirm')).toHaveAttribute('aria-busy', 'true');
  expect(await page.locator('#tc-input').evaluate((el) => el.readOnly)).toBe(true);
  await expect(page.locator('#tc')).toBeVisible();
  await page.evaluate(() => window.sgResolve());
  await expect(page.locator('#tc')).toBeHidden();
});

test('a failed confirm keeps the dialog open with the reason in words; the next open starts empty', async ({ page }) => {
  await open(page);
  await add(page);
  await page.evaluate(() => {
    document.getElementById('tc-box').addEventListener('ds:confirm', (event) => event.detail.wait(Promise.reject(new Error('It is still in use.'))));
  });
  await page.locator('#tc-input').fill('LAPTOP-0042');
  await page.locator('#tc-confirm').click();
  await expect(page.locator('#tc-error')).toHaveText('It is still in use.');
  await expect(page.locator('#tc-error svg')).toHaveCount(1);
  await expect(page.locator('#tc')).toBeVisible();
  await expect(page.locator('#tc-input')).toHaveAccessibleDescription('It is still in use.');
  await page.waitForFunction(() => [...document.querySelectorAll('[aria-live]')].some((el) => el.textContent.includes('It is still in use.')), null, { timeout: 3000 });
  await page.keyboard.press('Escape');
  await expect(page.locator('#tc')).toBeHidden();
  await page.locator('#tc-open').click();
  await expect(page.locator('#tc-input')).toHaveValue('');
  await expect(page.locator('#tc-error')).toBeHidden();
  await expect(page.locator('#tc-confirm')).toHaveAttribute('aria-disabled', 'true');
});

test('a changed name applies at once', async ({ page }) => {
  await open(page);
  await add(page);
  await page.locator('#tc-input').fill('LAPTOP-0042');
  await expect(page.locator('#tc-confirm')).not.toHaveAttribute('aria-disabled', /./);
  await page.evaluate(() => window.DS.core.get(document.getElementById('tc-box'), 'typeconfirm').set('ROUTER-7'));
  await expect(page.locator('#tc-input')).toHaveAccessibleName('Type ROUTER-7 to confirm');
  await expect(page.locator('#tc-confirm')).toHaveAttribute('aria-disabled', 'true');
});

test('the red button is the filled error button of D10; the demo renders without errors at 360px', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await open(page);
  const colours = await page.evaluate(() => {
    const button = document.querySelector('[data-demo="matched"] .ds-typeconfirm__confirm');
    const probe = document.createElement('span');
    probe.style.color = 'var(--ds-error)';
    button.append(probe);
    const want = getComputedStyle(probe).color;
    probe.remove();
    return [getComputedStyle(button).backgroundColor, want, button.getAttribute('aria-disabled')];
  });
  expect(colours[0]).toBe(colours[1]);
  expect(colours[2]).toBeNull();
  await expect(page.locator('[data-demo="waiting"] .ds-typeconfirm__confirm')).toHaveAttribute('aria-disabled', 'true');
  await page.setViewportSize({ width: 360, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('forced colours: the blocked button is GrayText, the name CanvasText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await add(page);
  const out = await page.evaluate(() => {
    const probe = (value) => {
      const el = document.createElement('span');
      el.style.color = value;
      document.getElementById('tc-box').append(el);
      const colour = getComputedStyle(el).color;
      el.remove();
      return colour;
    };
    return [getComputedStyle(document.getElementById('tc-confirm')).color === probe('GrayText'), getComputedStyle(document.querySelector('#tc-box .ds-typeconfirm__name')).color === probe('CanvasText')];
  });
  expect(out).toEqual([true, true]);
});
