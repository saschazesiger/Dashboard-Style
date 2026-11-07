/**
 * The toggletip: a click, a tap, Enter or Space opens its card and says its
 * text, focus stays on the button and Tab reaches the card's link; a second
 * click, Escape, a press outside and focus leaving close it; a blocked one
 * does nothing; the label row of a field; size, touch and shape; names and
 * forced colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

async function open(page, { width = 1280, height = 800, touch = false } = {}) {
  await page.setViewportSize({ width, height });
  await page.goto('/test/browser/fixtures/component.html?c=toggletip');
  await ready(page);
  // On the stage: it is a .ds-theme of its own, with its own default target.
  if (touch) await page.evaluate(() => (document.querySelector('#fx-component .ds-theme') ?? document.querySelector('#fx-component > div')).classList.add('ds-touch'));
  await page.mouse.move(1, 1);
}

async function cardOf(page, demo) {
  const id = await page.locator(`[data-demo="${demo}"]`).getAttribute('aria-controls');
  return page.locator(`#${id}`);
}

/** What the live regions of the page say now. */
const spoken = (page) => page.evaluate(() => [...document.querySelectorAll('[aria-live]')].map((node) => node.textContent).join(' | '));

test('a click opens the card, says its text and keeps focus on the button; a second click closes it', async ({ page }) => {
  await open(page);
  const button = page.locator('[data-demo="serial"]');
  const card = await cardOf(page, 'serial');
  await button.click();
  await expect(card).toHaveAttribute('data-state', 'open');
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(() => spoken(page)).toContain('On the sticker under the device');
  expect(await button.evaluate((el) => el === document.activeElement || document.activeElement === document.body)).toBe(true);
  await settle(page);
  // Below the button, the arrow pointing at its centre.
  const geometry = await page.evaluate(([b, c]) => {
    const a = document.querySelector(b).getBoundingClientRect();
    const box = document.querySelector(c).getBoundingClientRect();
    return { below: box.top >= a.bottom, arrow: parseFloat(getComputedStyle(document.querySelector(c)).getPropertyValue('--ds-popover-arrow')), centre: a.left + a.width / 2 - box.left };
  }, ['[data-demo="serial"]', `#${await card.getAttribute('id')}`]);
  expect(geometry.below).toBe(true);
  expect(geometry.arrow).toBeCloseTo(geometry.centre, 0);
  await button.click();
  await expect(card).toBeHidden();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
});

test('the keyboard: Enter and Space open it, Tab reaches its link, Escape closes it onto the button', async ({ page }) => {
  await open(page);
  const button = page.locator('[data-demo="serial"]');
  const card = await cardOf(page, 'serial');
  await focusByKeyboard(page, button);
  await page.keyboard.press('Enter');
  await expect(card).toHaveAttribute('data-state', 'open');
  expect(await page.evaluate(() => document.activeElement.getAttribute('data-demo'))).toBe('serial');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.textContent)).toBe('Where to find it');
  await expect(card).toHaveAttribute('data-state', 'open');
  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();
  expect(await page.evaluate(() => document.activeElement.getAttribute('data-demo'))).toBe('serial');
  await page.keyboard.press('Space');
  await expect(card).toHaveAttribute('data-state', 'open');
  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();
  // Tab past the card's link closes it and moves on to the field after it.
  await page.keyboard.press('Enter');
  await expect(card).toHaveAttribute('data-state', 'open');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(card).toBeHidden();
  expect(await page.evaluate(() => document.activeElement.tagName)).toBe('INPUT');
});

test('a press outside closes it; opening another closes the first', async ({ page }) => {
  await open(page);
  const serial = await cardOf(page, 'serial');
  const owner = await cardOf(page, 'owner');
  await page.locator('[data-demo="serial"]').click();
  await expect(serial).toHaveAttribute('data-state', 'open');
  await page.locator('[data-demo="owner"]').click();
  await expect(owner).toHaveAttribute('data-state', 'open');
  await expect(serial).toBeHidden();
  await page.mouse.click(5, 790);
  await expect(owner).toBeHidden();
});

test('placement above, and a blocked button opens nothing', async ({ page }) => {
  await open(page);
  const card = await cardOf(page, 'above');
  await page.locator('[data-demo="above"]').click();
  await expect(card).toHaveAttribute('data-state', 'open');
  await expect(card).toHaveAttribute('data-placement', 'top');
  await page.keyboard.press('Escape');
  const blocked = page.locator('[data-demo="blocked"]');
  await blocked.click({ force: true });
  await page.waitForTimeout(200);
  await expect(await cardOf(page, 'blocked')).toBeHidden();
  await expect(blocked).toHaveAttribute('aria-expanded', 'false');
});

test('a tap opens it on a touch screen, and .ds-touch widens the hit area around the glyph', async ({ page }) => {
  await open(page, { width: 390, height: 844, touch: true });
  const button = page.locator('[data-demo="serial"]');
  const box = await button.boundingBox();
  // The glyph keeps its 24px box: the label keeps its line.
  expect(box.height).toBeCloseTo(24, 0);
  // A point 10px beyond its edge still hits it (48px target).
  const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('[data-demo]')?.getAttribute('data-demo'), [box.x + box.width + 10, box.y + box.height / 2]);
  expect(hit).toBe('serial');
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2).catch(async () => button.click());
  const card = await cardOf(page, 'serial');
  await expect(card).toHaveAttribute('data-state', 'open');
  await settle(page);
  const edges = await card.evaluate((el) => { const r = el.getBoundingClientRect(); return [r.left, r.right, innerWidth]; });
  expect(edges[0]).toBeGreaterThanOrEqual(7);
  expect(edges[1]).toBeLessThanOrEqual(edges[2] - 7);
});

test('in a field the label and the button share the first row; size steps the button, shape its radius', async ({ page }) => {
  await open(page);
  const row = await page.evaluate(() => {
    const button = document.querySelector('[data-demo="serial"]');
    const label = button.previousElementSibling.getBoundingClientRect();
    const input = button.parentElement.querySelector('input').getBoundingClientRect();
    const b = button.getBoundingClientRect();
    return { sameRow: Math.abs((label.top + label.bottom) / 2 - (b.top + b.bottom) / 2) < 2, after: b.left >= label.right, below: input.top >= Math.max(label.bottom, b.bottom), full: input.width > 200 };
  });
  expect(row).toEqual({ sameRow: true, after: true, below: true, full: true });
  const sizes = await page.evaluate(() => {
    const out = {};
    for (const classes of ['', 'ds-xs', 'ds-xl', 'ds-density-tight', 'ds-shape-square', 'ds-shape-soft']) {
      const region = document.createElement('div');
      region.className = classes;
      region.innerHTML = '<button class="ds-toggletip" type="button" aria-label="Probe"></button>';
      document.querySelector('#fx-component').append(region);
      const el = region.firstChild;
      out[classes || 'default'] = { size: el.getBoundingClientRect().height, radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) };
      region.remove();
    }
    return out;
  });
  expect(sizes.default).toEqual({ size: 24, radius: 12 });
  expect(sizes['ds-xs'].size).toBe(16);
  expect(sizes['ds-xl'].size).toBe(32);
  expect(sizes['ds-density-tight'].size).toBe(24);
  expect(sizes['ds-shape-square'].radius).toBe(0);
  expect(sizes['ds-shape-soft'].radius).toBeLessThan(12);
});

test('names and roles: a named button with aria-expanded and aria-controls, a named group; a nameless button gets the system string', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('button', { name: 'About the serial number' })).toHaveAttribute('aria-expanded', 'false');
  await page.locator('[data-demo="serial"]').click();
  await expect(page.getByRole('group', { name: 'Serial number' })).toBeVisible();
  const name = await page.evaluate(async () => {
    const button = document.createElement('button');
    button.className = 'ds-toggletip';
    button.type = 'button';
    button.setAttribute('data-ds-toggletip', '');
    document.querySelector('#fx-component').append(button);
    await new Promise((resolve) => setTimeout(resolve, 50));
    return button.getAttribute('aria-label');
  });
  expect(name).toBe('More information');
});

test('forced colours: an open button is Highlight on HighlightText, the card keeps its edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const button = page.locator('[data-demo="serial"]');
  await button.click();
  const card = await cardOf(page, 'serial');
  await expect(card).toHaveAttribute('data-state', 'open');
  // The ink fades on --ds-dur-fast: read it once it rests.
  await settle(page);
  const styles = await button.evaluate((el) => ({ adjust: getComputedStyle(el).forcedColorAdjust, background: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }));
  const system = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.cssText = 'background: Highlight; color: HighlightText';
    document.body.append(probe);
    const out = { background: getComputedStyle(probe).backgroundColor, color: getComputedStyle(probe).color };
    probe.remove();
    return out;
  });
  expect(styles.adjust).toBe('none');
  expect(styles.background).toBe(system.background);
  expect(styles.color).toBe(system.color);
  expect(await card.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
});
