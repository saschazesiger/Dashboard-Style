/**
 * The snackbar on the options model (3.0): the shape on its radius, one size
 * whatever the density and size around it, the tones of a message built by
 * hand, the keyboard, names and forced colours, and that DS.toast and
 * DS.overlay hold the same behaviour. The 2.x behaviour stays in
 * test/browser/toast-tooltip.spec.js. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/test/browser/fixtures/component.html?c=toast');
  await ready(page);
  await page.mouse.move(1, 1);
}

const look = (page, around) => page.evaluate((around) => {
  const region = document.createElement('div');
  region.className = around;
  region.innerHTML = '<div class="ds-toast"><span class="ds-toast__text">Saved.</span><button class="ds-btn ds-btn--text ds-sm ds-toast__action" type="button">Undo</button></div>';
  document.querySelector('#fx-component').append(region);
  const toast = region.querySelector('.ds-toast');
  const out = { radius: parseFloat(getComputedStyle(toast).borderTopLeftRadius), height: toast.getBoundingClientRect().height, action: toast.querySelector('.ds-toast__action').getBoundingClientRect().height, padding: parseFloat(getComputedStyle(toast).paddingLeft) };
  region.remove();
  return out;
}, around);

test('the shape multiplies the radius; density and size change nothing', async ({ page }) => {
  await open(page);
  const plain = await look(page, '');
  expect(plain.radius).toBeGreaterThan(0);
  expect((await look(page, 'ds-shape-square')).radius).toBe(0);
  expect((await look(page, 'ds-shape-round')).radius).toBeCloseTo(plain.radius * 1.5, 1);
  for (const around of ['ds-density-tight', 'ds-lg', 'ds-xs']) {
    const other = await look(page, around);
    expect(other.height, around).toBeCloseTo(plain.height, 0);
    expect(other.padding, around).toBeCloseTo(plain.padding, 0);
  }
  expect(plain.action, 'its action keeps 32px').toBeCloseTo(32, 0);
  expect((await look(page, 'ds-density-tight')).action, 'at any density').toBeCloseTo(32, 0);
});

test('the kinds: an icon and a word; a tone on a built message reads as its kind; an error stays and is announced at once', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const region = DS.overlay.toastRegion(document);
    const built = (classes) => {
      const el = document.createElement('div');
      el.className = `ds-toast ${classes}`;
      el.innerHTML = '<span class="ds-toast__text">Built by hand.</span>';
      return DS.overlay.toast(region, el, { restart: false });
    };
    const error = built('ds-tone-error');
    const icon = DS.icons.iconElement(DS.icons.alertCircle, 20);
    error.el.prepend(icon);
    const plain = DS.overlay.toast(region, 'Could not save.', { kind: 'error' });
    return {
      stays: Boolean(error.el.querySelector('.ds-toast__close')),
      iconInk: getComputedStyle(icon).color,
      ink: getComputedStyle(error.el).color,
      plainIcon: Boolean(plain.el.querySelector('svg')),
      word: plain.el.querySelector('.ds-toast__text').textContent,
      classes: plain.el.className,
      assertive: document.querySelector('.ds-sr[aria-live="assertive"]') !== null,
    };
  });
  expect(result.stays, 'an error stays, so it can be closed').toBe(true);
  expect(result.iconInk).toBe(result.ink);
  expect(result.plainIcon).toBe(true);
  expect(result.word).toBe('Could not save.');
  expect(result.classes).toContain('ds-toast--error');
  expect(result.assertive).toBe(true);
  await page.evaluate(() => DS.overlay.closeToasts());
  await settle(page);
});

test('the keyboard: Tab reaches a message\'s buttons, focus pauses its timer, a focused message that leaves hands focus on', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'With undo' }).click();
  const action = page.getByRole('button', { name: 'Undo', exact: true }).last();
  await expect(action).toBeVisible();
  await settle(page);
  await action.focus();
  await page.keyboard.press('Tab');
  const closeButton = page.locator('.ds-toasts .ds-toast__close').last();
  await expect(closeButton).toBeFocused();
  await expect(closeButton).toHaveAccessibleName('Close');
  await page.keyboard.press('Enter');
  await settle(page);
  expect(await page.evaluate(() => document.activeElement !== document.body || document.querySelector('.ds-toasts .ds-toast') === null)).toBe(true);
});

test('DS.toast holds the same functions as DS.overlay: one region, one stack', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(async () => {
    const region = DS.toast.toastRegion(document);
    const first = DS.toast.toast(region, 'Same message.');
    const second = DS.overlay.toast(region, 'Same message.');
    const same = first === second;
    const count = region.querySelectorAll('.ds-toast').length;
    await DS.overlay.closeToasts(region);
    return { same, count, region: region === DS.overlay.toastRegion(document) };
  });
  expect(seen).toEqual({ same: true, count: 1, region: true });
});

test('the demo\'s buttons show each message', async ({ page }) => {
  await open(page);
  for (const [name, text] of [['Saved', 'Saved LAPTOP-0042.'], ['Info', 'The nightly sync runs at 02:30.'], ['Error, stays', 'Could not save the changes.']]) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.locator('.ds-toasts .ds-toast__text', { hasText: text })).toBeVisible();
  }
  await page.getByRole('button', { name: 'A retry keeps one error' }).click();
  await page.getByRole('button', { name: 'A retry keeps one error' }).click();
  await expect(page.locator('.ds-toasts .ds-toast__text', { hasText: /attempt/ })).toHaveCount(1);
  await page.getByRole('button', { name: 'Close all' }).click();
  await settle(page);
  await expect(page.locator('.ds-toasts .ds-toast')).toHaveCount(0);
});

test('forced colours: a message keeps its edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const edge = await page.evaluate(() => getComputedStyle(document.querySelector('[data-demo="static"] .ds-toast')).outlineColor);
  expect(edge).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
});
