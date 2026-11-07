/**
 * Back to top (DS.backtop) on its demo: hidden at the top, shown past the
 * threshold with the scale entrance, hidden again under half of it; a click
 * scrolls back and moves the focus to the first heading of the box; the name; the
 * sticky place at the end of the content; the fixed variant; touch; forced
 * colours. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

const URL = '/test/browser/fixtures/component.html?c=backtop';

async function open(page, width = 1280) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(URL);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

const scroll = (page, box, top) => page.locator(`[data-demo="${box}"]`).evaluate((el, value) => { el.scrollTop = value; }, top);

test('hidden at the top, shown past the threshold, hidden again under half of it; ds:change tells', async ({ page }) => {
  await open(page);
  const button = page.locator('[data-demo="icon-box"] .ds-backtop');
  await expect(button).toBeHidden();
  await page.evaluate(() => {
    window.__shown = [];
    document.addEventListener('ds:change', (event) => { if (event.target.matches('.ds-backtop')) window.__shown.push(event.detail.shown); });
  });
  await scroll(page, 'icon-box', 200);
  await page.waitForTimeout(100);
  await expect(button).toBeHidden();
  await scroll(page, 'icon-box', 300);
  await expect(button).toBeVisible();
  const enter = await button.evaluate((el) => el.getAnimations().map((animation) => animation.animationName));
  expect(enter).toEqual(expect.arrayContaining(['ds-fade-in', 'ds-grow-in']));
  // Between half the threshold and the threshold it stays.
  await scroll(page, 'icon-box', 150);
  await page.waitForTimeout(100);
  await expect(button).toBeVisible();
  await scroll(page, 'icon-box', 100);
  await expect(button).toBeHidden();
  expect(await page.evaluate(() => window.__shown)).toEqual([true, false]);
});

test('a click scrolls back to the top and moves the focus to the first heading of the box; Enter does the same', async ({ page }) => {
  await open(page);
  const box = page.locator('[data-demo="icon-box"]');
  const button = box.locator('.ds-backtop');
  await scroll(page, 'icon-box', 600);
  await expect(button).toBeVisible();
  await settle(page);
  await button.click();
  await expect.poll(() => box.evaluate((el) => el.scrollTop)).toBe(0);
  const heading = box.locator('h4');
  await expect(heading).toBeFocused();
  await expect(heading).toHaveAttribute('tabindex', '-1');
  await expect(button).toBeHidden();

  // Far down (beyond three heights) it jumps; by keyboard as well.
  await box.evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await expect(button).toBeVisible();
  await settle(page);
  await focusByKeyboard(page, button);
  await page.keyboard.press('Enter');
  await expect.poll(() => box.evaluate((el) => el.scrollTop)).toBe(0);
  await expect(heading).toBeFocused();
});

test('names and place: the string names an icon button, a label names itself; it sits at the end of the content, sticky at the bottom end', async ({ page }) => {
  await open(page);
  const icon = page.locator('[data-demo="icon-box"] .ds-backtop');
  await expect(icon).toHaveAttribute('aria-label', 'Back to top');
  const label = page.locator('[data-demo="label-box"] .ds-backtop');
  expect(await label.getAttribute('aria-label')).toBeNull();
  await scroll(page, 'icon-box', 400);
  await expect(icon).toBeVisible();
  await settle(page);
  await expect(page.getByRole('button', { name: 'Back to top' }).first()).toBeVisible();
  const place = await icon.evaluate((el) => {
    const box = el.parentElement.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return { position: style.position, bottom: Math.round(box.bottom - rect.bottom), end: Math.round(box.right - rect.right) };
  });
  // 24px from the box's content edge (its 16px of padding and 1px border counted), at the content's end.
  expect(place).toEqual({ position: 'sticky', bottom: 41, end: 17 });
  // At the end of the scroll it takes its own row: the last line stays uncovered.
  await page.locator('[data-demo="icon-box"]').evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await settle(page);
  const covered = await icon.evaluate((el) => {
    const last = el.parentElement.querySelector('ol > li:last-child').getBoundingClientRect();
    return el.getBoundingClientRect().top < last.bottom;
  });
  expect(covered).toBe(false);
});

test('the fixed variant sits in the window\'s corner; touch makes the button a finger\'s target', async ({ page }) => {
  await open(page, 390);
  const result = await page.evaluate(() => {
    const button = document.querySelector('[data-demo="icon-box"] .ds-backtop');
    button.classList.add('ds-backtop--fixed', 'ds-touch');
    button.hidden = false;
    const rect = button.getBoundingClientRect();
    const out = { position: getComputedStyle(button).position, right: Math.round(innerWidth - rect.right), bottom: Math.round(innerHeight - rect.bottom), height: rect.height, width: rect.width };
    button.classList.remove('ds-backtop--fixed', 'ds-touch');
    button.hidden = true;
    return out;
  });
  expect(result.position).toBe('fixed');
  expect(result.right).toBe(24);
  expect(result.bottom).toBe(24);
  expect(result.height).toBeGreaterThanOrEqual(48);
  expect(result.width).toBeGreaterThanOrEqual(48);
});

test('the controller: get, set, go, on; a page scroller by data-ds-backtop-target; destroy hands back what it owned', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const host = document.createElement('div');
    host.innerHTML = '<div id="bt-box" style="block-size: 200px; overflow-y: auto;"><h2 id="bt-top">Top</h2><div style="block-size: 2000px;"></div></div>' +
      '<button class="ds-btn ds-btn--icon ds-backtop" type="button" id="bt" data-ds-backtop data-ds-backtop-target="#bt-box" data-ds-backtop-after="100" data-ds-backtop-focus="#bt-top" hidden>^</button>';
    document.querySelector('#fx-component').append(host);
    DS.init(host);
    const button = host.querySelector('#bt');
    const box = host.querySelector('#bt-box');
    const top = DS.get(button, 'backtop');
    const seen = [];
    const off = top.on('change', (detail) => seen.push(detail.shown));
    box.scrollTop = 500;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise((resolve) => setTimeout(resolve, 50));
    const after = top.get();
    top.go();
    const focused = document.activeElement.id;
    off();
    top.set(false);
    top.destroy();
    top.destroy();
    return { after, seen, focused, label: button.getAttribute('aria-label') };
  });
  expect(result).toEqual({ after: true, seen: [true], focused: 'bt-top', label: null });
});

test('forced colours: the button keeps its edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await scroll(page, 'icon-box', 600);
  const button = page.locator('[data-demo="icon-box"] .ds-backtop');
  await expect(button).toBeVisible();
  await settle(page);
  const edge = await button.evaluate((el) => {
    const style = getComputedStyle(el);
    return style.borderTopStyle !== 'none' || style.outlineStyle !== 'none';
  });
  expect(edge).toBe(true);
});
