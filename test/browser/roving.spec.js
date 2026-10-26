/**
 * DS.dom.roving() (2.0) in real engines: a tab list is one tab stop; the
 * arrow keys, Home and End move the focus (and the selection, through the
 * page's click handler), skipping a disabled tab and reaching an
 * aria-disabled one without selecting it; a toolbar moves the focus only,
 * without wrapping; Tab leaves the set from the stop. A re-render of the
 * tab list with DS.dom.morphHtml keeps it working. fixtures/helpers-2.html;
 * runs in the `fallback` project too.
 */
import { test, expect } from './base-test.js';
import { ready, settle } from './helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/helpers-2.html');
  await ready(page);
  await settle(page);
}

const stops = (page, selector) => page.evaluate((sel) => [...document.querySelectorAll(`${sel} [tabindex]`)].map((item) => `${item.id}:${item.getAttribute('tabindex')}`), selector);
const selected = (page) => page.evaluate(() => document.querySelector('#tabs [aria-selected="true"]').id);

test('tabs: one stop on the selected tab; arrows, Home and End move and select; disabled skipped, aria-disabled reached', async ({ page }) => {
  await open(page);
  expect(await stops(page, '#tabs')).toEqual(['tab-a:-1', 'tab-b:0', 'tab-d:-1']);
  await page.locator('#tab-b').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-d'), 'the disabled tab is skipped').toBeFocused();
  expect(await selected(page), 'an aria-disabled tab is never selected').toBe('tab-b');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-a'), 'wraps').toBeFocused();
  expect(await selected(page)).toBe('tab-a');
  await page.keyboard.press('End');
  await expect(page.locator('#tab-d')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.locator('#tab-a')).toBeFocused();
  expect(await stops(page, '#tabs')).toEqual(['tab-a:0', 'tab-b:-1', 'tab-d:-1']);
  // Tab leaves the set from its stop.
  await page.keyboard.press('Tab');
  await expect(page.locator('#tool-1')).toBeFocused();
});

test('toolbar: focus only, no wrap; a re-render of the tabs keeps the keys working', async ({ page }) => {
  await open(page);
  await page.locator('#tool-1').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tool-3')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tool-3'), 'no wrap').toBeFocused();
  // The page re-renders the tab list (selected tab C now enabled).
  await page.evaluate(() => {
    const tabs = document.getElementById('tabs');
    DS.dom.morphHtml(tabs, ['a', 'b', 'c'].map((key) => `<button class="ds-btn ds-btn--text" type="button" role="tab" id="tab-${key}" aria-selected="${key === 'c'}" tabindex="${key === 'c' ? 0 : -1}">${key.toUpperCase()}</button>`).join(''));
  });
  await page.locator('#tab-c').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#tab-b')).toBeFocused();
  expect(await selected(page)).toBe('tab-b');
});
