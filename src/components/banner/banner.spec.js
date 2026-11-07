/**
 * The banner (3.0): messages in priority order, the more button
 * (aria-expanded), dismissal remembered through DS.store (also after a new
 * render), focus that never falls to the body, broadcasts from data with
 * their announcement, safe action links, a change of -max and -remember
 * that keeps the controller, the corners of stacked messages, a phone and forced
 * colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

async function open(page, width = 1280) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto('/test/browser/fixtures/component.html?c=banner');
  await ready(page);
  await page.mouse.move(1, 1);
}

const strip = (page) => page.locator('.ds-banner').first();
const shown = (page) => strip(page).locator(':scope > .ds-alert:not([hidden])');
const more = (page) => strip(page).locator('.ds-banner__more');

test.beforeEach(async ({ page }) => {
  // A fresh tab for each test, kept across a reload within it.
  await page.addInitScript(() => {
    if (sessionStorage.getItem('spec-started')) return;
    sessionStorage.clear();
    sessionStorage.setItem('spec-started', '1');
  });
});

test('the most urgent message leads; the others wait behind the more button, which says how many', async ({ page }) => {
  await open(page);
  await expect(shown(page)).toHaveCount(1);
  await expect(shown(page).first()).toHaveClass(/ds-tone-error/);
  await expect(more(page)).toHaveText('Show 2 more');
  await expect(more(page)).toHaveAttribute('aria-expanded', 'false');
  const ids = await strip(page).evaluate((el) => [...el.querySelectorAll(':scope > .ds-alert')].map((alert) => alert.getAttribute('data-ds-banner-id')));
  expect(ids).toEqual(['sg-outage-1104', 'sg-offline', 'sg-maintenance-1109']);
  const controls = (await more(page).getAttribute('aria-controls')).split(' ');
  expect(controls).toHaveLength(3);
  await more(page).click();
  await expect(shown(page)).toHaveCount(3);
  await expect(more(page)).toHaveText('Show less');
  await expect(more(page)).toHaveAttribute('aria-expanded', 'true');
  // Only the first keeps the panel's corners; the next are square, a hairline apart.
  const corners = await shown(page).evaluateAll((alerts) => alerts.map((alert) => ({ radius: parseFloat(getComputedStyle(alert).borderTopLeftRadius), line: getComputedStyle(alert).borderTopWidth })));
  expect(corners[0].radius).toBeGreaterThan(0);
  expect(corners[1]).toEqual({ radius: 0, line: '1px' });
  await more(page).click();
  await expect(shown(page)).toHaveCount(1);
});

test('dismissing: the dismiss button, focus to the next message, remembered after a reload; not offered without an id or with "off"', async ({ page }) => {
  await open(page);
  await more(page).click();
  const dismiss = shown(page).first().getByRole('button', { name: 'Dismiss' });
  await expect(dismiss).toBeVisible();
  await expect(strip(page).locator('[data-ds-banner-id="sg-offline"] .ds-banner__dismiss')).toHaveCount(0);
  await dismiss.focus();
  await page.keyboard.press('Enter');
  await expect(strip(page).locator('[data-ds-banner-id="sg-outage-1104"]')).toBeHidden();
  // Focus moved on, never to the body.
  expect(await page.evaluate(() => document.activeElement !== document.body && document.activeElement.closest('.ds-banner, .ds-view') !== null)).toBe(true);
  const stored = await page.evaluate(() => Object.keys(sessionStorage).filter((key) => key.startsWith('ds:banner:')));
  expect(stored).toEqual(['ds:banner:sg-outage-1104']);
  // A new render of the same markup keeps it away (the store), and Forget brings it back.
  await page.reload();
  await ready(page);
  await expect(strip(page).locator('[data-ds-banner-id="sg-outage-1104"]')).toBeHidden();
  await expect(shown(page).first()).toHaveAttribute('data-ds-banner-id', 'sg-offline');
  await page.getByRole('button', { name: 'Forget dismissals' }).click();
  await expect(shown(page).first()).toHaveAttribute('data-ds-banner-id', 'sg-outage-1104');
});

test('the last message dismissed: the banner hides and focus goes to the view', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const el = document.querySelectorAll('.ds-banner')[1];
    const banner = DS.banner.create(el);
    const button = el.querySelector('.ds-banner__dismiss');
    button.focus();
    button.click();
    el.querySelector('.ds-alert:not([hidden]) .ds-banner__dismiss').focus();
    el.querySelector('.ds-alert:not([hidden]) .ds-banner__dismiss').click();
    return { hidden: el.hidden, focus: document.activeElement.className, shown: banner.get() };
  });
  expect(result.hidden).toBe(true);
  expect(result.shown).toEqual([]);
  expect(result.focus).toContain('ds-view');
});

test('broadcasts from data: built in the alert markup, in priority order, announced; remove() takes one back', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Broadcast an urgent one' }).click();
  await expect(shown(page).first()).toContainText('Backups are paused');
  await expect(shown(page).first()).not.toHaveAttribute('role');
  await expect(shown(page).first().locator('.ds-alert__title')).toHaveText('Backups are paused');
  await expect.poll(() => page.evaluate(() => document.querySelector('.ds-sr[aria-live="assertive"]')?.textContent ?? '')).toContain('Backups are paused. Storage is full on SERVER-0003.');
  await expect(more(page)).toHaveText('Show 3 more');
  await page.getByRole('button', { name: 'Broadcast a notice' }).click();
  await expect(more(page)).toHaveText('Show 4 more');
  // A notice waits behind the more button, so it is not announced.
  await page.getByRole('button', { name: 'Back online' }).click();
  await expect(strip(page).locator('[data-ds-banner-id="sg-offline"]')).toHaveCount(0);
  await expect(more(page)).toHaveText('Show 3 more');
  const events = await page.evaluate(() => new Promise((resolve) => {
    const el = document.querySelector('.ds-banner');
    el.addEventListener('ds:dismiss', (event) => resolve(event.detail), { once: true });
    DS.banner.create(el).dismiss('sg-urgent-1');
  }));
  expect(events).toEqual({ id: 'sg-urgent-1' });
});

test('data-ds-banner-max shows that many; the more button stays away', async ({ page }) => {
  await open(page);
  const all = page.locator('.ds-banner').nth(1);
  await expect(all.locator(':scope > .ds-alert:not([hidden])')).toHaveCount(2);
  await expect(all.locator('.ds-banner__more')).toBeHidden();
  // Success is the lowest tone: the plain alert leads.
  await expect(all.locator(':scope > .ds-alert').first()).toHaveAttribute('data-ds-banner-id', 'sg-all-tip');
});

test('a change of data-ds-banner-max or -remember keeps the controller and the messages from data', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(async () => {
    const el = document.querySelector('.ds-banner');
    const handle = DS.banner.create(el);
    handle.add({ id: 'data-1', tone: 'info', text: 'A notice from data.' });
    const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
    // Room for all four: the three of the markup and the one from data.
    el.setAttribute('data-ds-banner-max', '5');
    await flush();
    const afterMax = { same: DS.banner.create(el) === handle, kept: Boolean(el.querySelector('[data-ds-banner-id="data-1"]')), shown: el.querySelectorAll(':scope > .ds-alert:not([hidden])').length };
    el.setAttribute('data-ds-banner-remember', 'off');
    await flush();
    const afterRemember = { same: DS.banner.create(el) === handle, kept: Boolean(el.querySelector('[data-ds-banner-id="data-1"]')) };
    // The new storage (memory only) takes the dismissal; back on localStorage, which never had it, the message returns.
    handle.dismiss('data-1');
    const dismissed = el.querySelector('[data-ds-banner-id="data-1"]').hidden;
    el.removeAttribute('data-ds-banner-remember');
    await flush();
    const back = !el.querySelector('[data-ds-banner-id="data-1"]').hidden;
    el.removeAttribute('data-ds-banner-max');
    await flush();
    handle.remove('data-1');
    return { afterMax, afterRemember, dismissed, back };
  });
  expect(seen.afterMax).toEqual({ same: true, kept: true, shown: 4 });
  expect(seen.afterRemember).toEqual({ same: true, kept: true });
  expect(seen.dismissed).toBe(true);
  expect(seen.back).toBe(true);
});

test('an action href from data: only a safe link; a javascript: or data: URL makes a button', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(() => {
    const el = document.querySelector('.ds-banner');
    DS.banner.create(el).add([
      { id: 'href-js', tone: 'info', text: 'Script.', action: { label: 'Open', href: 'javascript:window.__pwn=1' } },
      { id: 'href-data', tone: 'info', text: 'Data.', action: { label: 'Open', href: 'data:text/html,x' } },
      { id: 'href-ok', tone: 'info', text: 'Safe.', action: { label: 'Open', href: '/status' } },
    ]);
    const action = (id) => el.querySelector(`[data-ds-banner-id="${id}"] .ds-btn--text`);
    return ['href-js', 'href-data', 'href-ok'].map((id) => ({ tag: action(id).tagName, href: action(id).getAttribute('href') }));
  });
  expect(seen).toEqual([{ tag: 'BUTTON', href: null }, { tag: 'BUTTON', href: null }, { tag: 'A', href: '/status' }]);
});

test('the keyboard: Tab goes through the action, the dismiss button, then the more button', async ({ page }) => {
  await open(page);
  await strip(page).locator('.ds-banner__dismiss').first().focus();
  await page.keyboard.press('Tab');
  await expect(more(page)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(more(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(more(page)).toBeFocused();
});

test('a phone: the messages wrap inside the width', async ({ page }) => {
  await open(page, 360);
  await more(page).click();
  const fit = await page.evaluate(() => ({
    right: Math.max(...[...document.querySelectorAll('.ds-banner > :not([hidden])')].map((el) => el.getBoundingClientRect().right)),
    width: document.documentElement.clientWidth,
  }));
  expect(fit.right).toBeLessThanOrEqual(fit.width);
});

test('forced colours: the hairline between messages stays', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await more(page).click();
  await settle(page);
  const line = await shown(page).nth(1).evaluate((alert) => getComputedStyle(alert).borderTopColor);
  expect(line).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
});
