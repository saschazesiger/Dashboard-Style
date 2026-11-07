/**
 * The secret field: the parts of every state, the hidden action input, focus
 * and announcements on each change, Escape cancels a replace (and leaves a
 * dialog around it open), the names and descriptions, a form reset, the
 * attribute path, size and touch of the stored box, forced colours. Runs in
 * `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=secret');
  await ready(page);
}

async function add(page, { stored = 'set', form = false } = {}) {
  await page.evaluate(({ stored, form }) => {
    const field = '<div class="ds-field ds-secret" id="s-root" data-ds-secret="' + stored + '">' +
      '<label class="ds-field__label" for="s">API key</label>' +
      '<div class="ds-secret__stored"><span class="ds-secret__mask" aria-hidden="true">••••••••</span><span class="ds-secret__status"></span>' +
      '<span class="ds-secret__actions"><button class="ds-btn ds-btn--text ds-secret__replace" id="s-replace" type="button">Replace</button>' +
      '<button class="ds-btn ds-btn--text ds-secret__clear" id="s-clear" type="button">Clear</button>' +
      '<button class="ds-btn ds-btn--text ds-secret__undo" id="s-undo" type="button">Undo</button></span></div>' +
      '<div class="ds-secret__entry"><div class="ds-input-group"><input class="ds-input" id="s" name="key" type="password" autocomplete="off"></div>' +
      '<button class="ds-btn ds-btn--text ds-secret__cancel" id="s-cancel" type="button">Cancel</button></div>' +
      '<input type="hidden" name="key_action" id="s-action" data-ds-secret-action></div>';
    const html = form ? `<form id="s-form">${field}<button type="reset" id="s-reset">Discard</button></form>` : field;
    document.querySelector('#fx-component').insertAdjacentHTML('afterbegin', html);
  }, { stored, form });
  await page.waitForFunction(() => document.getElementById('s-root')?.hasAttribute('data-state'));
  return page.locator('#s-root');
}

const shown = (page) => page.evaluate(() => ['stored', 'entry', 'replace', 'clear', 'undo', 'cancel']
  .filter((part) => {
    const el = document.querySelector(`#s-root .ds-secret__${part}`);
    return el && el.getClientRects().length > 0;
  }));

test('set: the mask, "Set", Replace and Clear; the input is disabled; the action is keep', async ({ page }) => {
  await open(page);
  const root = await add(page);
  await expect(root).toHaveAttribute('data-state', 'set');
  expect(await shown(page)).toEqual(['stored', 'replace', 'clear']);
  await expect(page.locator('#s-root .ds-secret__status')).toHaveText('Set');
  await expect(page.locator('#s')).toBeDisabled();
  await expect(page.locator('#s-action')).toHaveValue('keep');
  await expect(page.locator('#s-replace')).toHaveAccessibleName('Replace');
  await expect(page.locator('#s-replace')).toHaveAccessibleDescription('API key Set');
});

test('empty: the entry without Cancel; typing makes the action set', async ({ page }) => {
  await open(page);
  const root = await add(page, { stored: '' });
  await expect(root).toHaveAttribute('data-state', 'empty');
  expect(await shown(page)).toEqual(['entry']);
  await expect(page.locator('#s-action')).toHaveValue('keep');
  await page.locator('#s').fill('ex_key');
  await expect(page.locator('#s-action')).toHaveValue('set');
});

test('replace by keyboard: Enter on Replace focuses the empty field, Escape cancels and focuses Replace', async ({ page }) => {
  await open(page);
  const root = await add(page);
  await page.evaluate(() => {
    window.sgChanges = [];
    document.getElementById('s-root').addEventListener('ds:change', (event) => window.sgChanges.push(event.detail));
  });
  await page.locator('#s-replace').focus();
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-state', 'replace');
  await expect(page.locator('#s')).toBeFocused();
  await expect(page.locator('#s')).toHaveValue('');
  expect(await shown(page)).toEqual(['entry', 'cancel']);
  await page.keyboard.type('ex_new');
  await expect(page.locator('#s-action')).toHaveValue('set');
  await page.keyboard.press('Escape');
  await expect(root).toHaveAttribute('data-state', 'set');
  await expect(page.locator('#s-replace')).toBeFocused();
  await expect(page.locator('#s')).toHaveValue('');
  await expect(page.locator('#s-action')).toHaveValue('keep');
  expect(await page.evaluate(() => window.sgChanges)).toEqual([{ state: 'replace', action: 'keep' }, { state: 'set', action: 'keep' }]);
  await page.waitForFunction(() => [...document.querySelectorAll('[aria-live]')].some((el) => el.textContent.includes('Set')), null, { timeout: 3000 });
});

test('Cancel goes back to set; Clear strikes the mask, focuses Undo and says so; Undo returns', async ({ page }) => {
  await open(page);
  const root = await add(page);
  await page.locator('#s-replace').click();
  await page.locator('#s-cancel').click();
  await expect(root).toHaveAttribute('data-state', 'set');
  await expect(page.locator('#s-replace')).toBeFocused();
  await page.locator('#s-clear').click();
  await expect(root).toHaveAttribute('data-state', 'clear');
  await expect(page.locator('#s-undo')).toBeFocused();
  expect(await shown(page)).toEqual(['stored', 'undo']);
  await expect(page.locator('#s-root .ds-secret__status')).toHaveText('Removed when you save');
  await expect(page.locator('#s-action')).toHaveValue('clear');
  expect(await page.locator('#s-root .ds-secret__mask').evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe('line-through');
  await page.waitForFunction(() => [...document.querySelectorAll('[aria-live]')].some((el) => el.textContent.includes('Removed when you save')), null, { timeout: 3000 });
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-state', 'set');
  await expect(page.locator('#s-replace')).toBeFocused();
});

test('Escape in a replacing field inside a dialog cancels the replace and keeps the dialog open', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    document.querySelector('#fx-component').insertAdjacentHTML('beforeend', '<div class="ds-dialog" id="s-dialog" role="dialog" aria-modal="true" aria-label="Keys" hidden><div class="ds-dialog__box"><div class="ds-dialog__body" id="s-body"></div></div></div>');
  });
  await add(page);
  await page.evaluate(() => {
    document.getElementById('s-body').append(document.getElementById('s-root'));
    window.DS.overlay.open(document.getElementById('s-dialog'));
  });
  await page.locator('#s-replace').click();
  await expect(page.locator('#s')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#s-root')).toHaveAttribute('data-state', 'set');
  await expect(page.locator('#s-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#s-dialog')).toBeHidden();
});

test('a form reset and the attribute bring the first state back; set() drives it from the page', async ({ page }) => {
  await open(page);
  const root = await add(page, { form: true });
  await page.locator('#s-clear').click();
  await page.locator('#s-reset').click();
  await expect(root).toHaveAttribute('data-state', 'set');
  await page.evaluate(() => document.getElementById('s-root').setAttribute('data-ds-secret', ''));
  await expect(root).toHaveAttribute('data-state', 'empty');
  await expect(page.locator('#s-root .ds-secret__status')).toHaveText('Not set');
  await page.evaluate(() => window.DS.core.get(document.getElementById('s-root'), 'secret').set('set'));
  await expect(root).toHaveAttribute('data-state', 'set');
});

test('set() while typing a new one (a save on Enter) moves the focus to Replace; clear from Replace to Undo', async ({ page }) => {
  await open(page);
  const root = await add(page, { form: true });
  await page.evaluate(() => document.getElementById('s-form').addEventListener('submit', (event) => {
    event.preventDefault();
    window.DS.core.get(document.getElementById('s-root'), 'secret').set('set');
  }));
  await page.locator('#s-replace').click();
  await expect(page.locator('#s')).toBeFocused();
  await page.keyboard.type('abc123');
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-state', 'set');
  await expect(page.locator('#s-replace')).toBeFocused();
  await page.evaluate(() => window.DS.core.get(document.getElementById('s-root'), 'secret').set('clear'));
  await expect(page.locator('#s-undo')).toBeFocused();
  // Focus elsewhere stays where it is.
  await page.locator('#s-reset').focus();
  await page.evaluate(() => window.DS.core.get(document.getElementById('s-root'), 'secret').set('set'));
  await expect(page.locator('#s-reset')).toBeFocused();
});

test('size and touch: the stored box steps like a field and takes the touch target', async ({ page }) => {
  await open(page);
  await add(page);
  const height = (cls) => page.evaluate((cls) => {
    const root = document.getElementById('s-root');
    root.className = 'ds-field ds-secret ' + cls;
    return document.querySelector('#s-root .ds-secret__stored').getBoundingClientRect().height;
  }, cls);
  expect(await height('')).toBe(40);
  expect(await height('ds-sm')).toBe(32);
  expect(await height('ds-lg')).toBe(48);
  expect(await height('ds-density-compact')).toBe(36);
  expect(await height('ds-sm ds-touch')).toBe(48);
  expect(await page.locator('#s-replace').evaluate((el) => el.getBoundingClientRect().height)).toBe(48);
  await height('ds-lg');
  expect(await page.locator('#s-replace').evaluate((el) => el.getBoundingClientRect().height)).toBe(40);
});

test('the demo: every state, the narrow width, no console errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await open(page);
  const states = await page.locator('[data-demo="states"] .ds-secret').evaluateAll((els) => els.map((el) => el.getAttribute('data-state')));
  expect(states).toEqual(['set', 'replace', 'clear', 'empty']);
  // The line under the buttons shows what a submit would post, from the first frame.
  await expect(page.locator('[data-demo="actions"]')).toHaveText('The server would get: api_key_action=keep, smtp_password_action=keep');
  await page.setViewportSize({ width: 360, height: 800 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('forced colours: the stored box keeps an edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await add(page);
  const edge = await page.locator('#s-root .ds-secret__stored').evaluate((el) => [getComputedStyle(el, '::after').borderTopStyle, getComputedStyle(el, '::after').borderTopWidth]);
  expect(edge).toEqual(['solid', '1px']);
});
