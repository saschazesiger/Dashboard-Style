/**
 * Persona: the layouts (beside, stacked, inline), the name in the size's
 * type role with the avatar following the size, the gap per step, lines
 * that end in an ellipsis in a narrow column, an interactive persona
 * (a name, the focus ring, the touch minimum, a blocked one), the avatar
 * hidden from the tree, and forced colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { focusByKeyboard, ready, settle } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2, 12], ['ds-sm', -1, 14], ['ds-md', 0, 14], ['ds-lg', 1, 16], ['ds-xl', 2, 16]];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=persona');
  await ready(page);
  await page.mouse.move(1, 1);
}

const probe = (page, html, read) => page.evaluate(({ html, read }) => {
  document.querySelector('#fx-component').insertAdjacentHTML('beforeend', `<div class="probe">${html}</div>`);
  const holder = document.querySelector('#fx-component > .probe:last-child');
  const el = holder.querySelector('#probe');
  el.removeAttribute('id');
  const style = getComputedStyle(el);
  const out = new Function('el', 'style', `return (${read});`)(el, style);
  holder.remove();
  return out;
}, { html, read });

const persona = (cls = '', tag = 'div', attrs = '') => `<${tag} id="probe" class="ds-persona ${cls}"${attrs}><span class="ds-avatar" aria-hidden="true">AL</span><span class="ds-persona__text"><span class="ds-persona__name">Ada Lovelace</span><span class="ds-persona__role">Field engineer</span></span></${tag}>`;

test('at every size: the avatar follows, the name takes the size\'s type, the gap 2px per step; density changes nothing', async ({ page }) => {
  await open(page);
  const read = '(() => { const a = el.querySelector(".ds-avatar").getBoundingClientRect(); const t = el.querySelector(".ds-persona__text").getBoundingClientRect(); return [a.width, parseFloat(getComputedStyle(el.querySelector(".ds-persona__name")).fontSize), Math.round(t.left - a.right), parseFloat(getComputedStyle(el.querySelector(".ds-persona__role")).fontSize)]; })()';
  for (const [size, step, font] of SIZES) {
    for (const density of ['', 'ds-density-tight']) {
      expect(await probe(page, `<div class="${density}">${persona(size)}</div>`, read), `${size} ${density}`).toEqual([32 + step * 8, font, 12 + step * 2, 12]);
    }
  }
});

test('stacked puts the avatar above, centred; inline sets name and role on one line', async ({ page }) => {
  await open(page);
  const stacked = await probe(page, persona('ds-persona--stacked'), '(() => { const a = el.querySelector(".ds-avatar").getBoundingClientRect(); const t = el.querySelector(".ds-persona__text").getBoundingClientRect(); return [a.bottom <= t.top, Math.abs((a.left + a.right) / 2 - (t.left + t.right) / 2) < 1, style.textAlign]; })()');
  expect(stacked).toEqual([true, true, 'center']);
  const inline = await probe(page, persona('ds-persona--inline'), '(() => { const n = el.querySelector(".ds-persona__name").getBoundingClientRect(); const r = el.querySelector(".ds-persona__role").getBoundingClientRect(); return [r.left >= n.right, Math.abs(n.bottom - r.bottom) < 4]; })()');
  expect(inline).toEqual([true, true]);
});

test('a narrow column: every line ends in an ellipsis instead of wrapping', async ({ page }) => {
  await open(page);
  const lines = await page.locator('[data-demo="narrow"] .ds-persona').evaluate((el) => [...el.querySelectorAll('.ds-persona__name, .ds-persona__role, .ds-persona__status')].map((line) => {
    const style = getComputedStyle(line);
    return [style.textOverflow, style.whiteSpace, line.scrollWidth > line.clientWidth, line.getBoundingClientRect().right <= el.parentElement.getBoundingClientRect().right + 0.5];
  }));
  for (const line of lines) expect(line).toEqual(['ellipsis', 'nowrap', true, true]);
});

test('names: the avatar is hidden, the name is read once; an interactive persona is a named link with the focus ring', async ({ page }) => {
  await open(page);
  const first = page.locator('[data-demo="default"] .ds-persona').first();
  await expect(first.locator('.ds-avatar')).toHaveAttribute('aria-hidden', 'true');
  await expect(first).toContainText('Online');
  const link = page.locator('[data-demo="interactive"] a.ds-persona');
  await expect(link).toHaveAccessibleName(/^Ada Lovelace\s*Field engineer$/);
  await focusByKeyboard(page, link);
  await settle(page);
  expect(await link.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  const toast = page.locator('.ds-toast, .ds-snackbar').filter({ hasText: 'Open Ada Lovelace' });
  await page.keyboard.press('Enter');
  await expect(toast.first()).toBeVisible();
  const blocked = page.locator('[data-demo="interactive"] button[disabled]');
  const ink = await page.evaluate(() => {
    const el = document.createElement('span');
    el.style.color = 'var(--ds-disabled-ink)';
    document.querySelector('.ds-theme').append(el);
    const colour = getComputedStyle(el).color;
    el.remove();
    return colour;
  });
  expect(await blocked.locator('.ds-persona__name').evaluate((el) => getComputedStyle(el).color)).toBe(ink);
});

test('touch: an interactive persona reaches --ds-target-min; a plain one keeps its height', async ({ page }) => {
  await open(page);
  const height = 'el.getBoundingClientRect().height';
  expect(await probe(page, `<div class="ds-touch">${persona('ds-pressable ds-xs', 'button', ' type="button"')}</div>`, height)).toBeGreaterThanOrEqual(48);
  expect(await probe(page, `<div class="ds-touch">${persona('ds-xs')}</div>`, height)).toBeLessThan(48);
});

test('forced colours: the text in system colours, a blocked persona in GrayText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const gray = await page.evaluate(() => {
    const el = document.createElement('span');
    el.style.color = 'GrayText';
    document.body.append(el);
    const colour = getComputedStyle(el).color;
    el.remove();
    return colour;
  });
  expect(await page.locator('[data-demo="interactive"] button[disabled] .ds-persona__name').evaluate((el) => getComputedStyle(el).color)).toBe(gray);
});
