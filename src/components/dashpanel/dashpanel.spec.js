/**
 * The dashboard panel on its demo: regions named by their titles; the menu
 * through the system (keys, Escape, focus back); the states (loading with
 * its bar along the head, refreshing, failed with Try again, no data,
 * stale told by a word); a row of panels lining up; the variants; the
 * options (density, touch, shape); a phone width; forced colours. Runs in
 * the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=dashpanel');
  await ready(page);
  await page.mouse.move(1, 1);
}

const panel = (name) => `[data-demo="${name}"]`;
const display = (page, selector) => page.$eval(selector, (el) => getComputedStyle(el).display);

test('names and roles: each panel is a region named by its title, its menu button names the panel', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('region', { name: 'Tickets per day' })).toHaveCount(1);
  await expect(page.getByRole('region', { name: 'Warranty ends' })).toHaveCount(1);
  const button = page.locator(`${panel('ready')} .ds-dashpanel__actions [aria-haspopup="menu"]`);
  await expect(button).toHaveAccessibleName('Actions for Tickets per day');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  // The loading body announces itself: a status with its word.
  await expect(page.locator(`${panel('loading')} [role="status"]`)).toHaveText('Loading');
  // Stale data is told by a word, not by colour alone.
  await expect(page.locator(`${panel('stale')} .ds-dashpanel__actions .ds-status`)).toHaveText('Stale');
  await expect(page.locator(`${panel('failed')} .ds-empty__title`)).toHaveText('Could not load the warranties');
});

test('the menu: opens from its button by keyboard, moves with the arrows, Escape closes it and the focus is back', async ({ page }) => {
  await open(page);
  const button = page.locator(`${panel('ready')} .ds-dashpanel__actions [aria-haspopup="menu"]`);
  const menu = page.locator(`${panel('ready')} .ds-menu`);
  await focusByKeyboard(page, button);
  await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('data-state', 'open');
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('menuitem', { name: 'Refresh' }).first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Export CSV' }).first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toBeFocused();
  await settle(page);
  await expect(menu).toBeHidden();
});

test('loading: the bar along the head shows only while the panel or its body is busy', async ({ page }) => {
  await open(page);
  const bar = (name) => `${panel(name)} > .ds-dashpanel__head > .ds-loadbar`;
  expect(await display(page, bar('ready'))).toBe('none');
  expect(await display(page, bar('loading'))).toBe('block');
  // Along the head's lower edge, over its whole width.
  const [head, line] = await page.$eval(bar('loading'), (el) => [el.parentElement.getBoundingClientRect(), el.getBoundingClientRect()].map((r) => ({ left: r.left, right: r.right, bottom: r.bottom })));
  expect(line.bottom).toBeCloseTo(head.bottom, 0);
  expect(line.left).toBeCloseTo(head.left, 0);
  expect(line.right).toBeCloseTo(head.right, 0);
  // The body keeps its place while a state replaces the content.
  expect(await page.$eval(`${panel('loading')} .ds-dashpanel__body`, (el) => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(160);
});

test('refreshing: the body is busy and dims while the old data stays, the bar shows; then a toast', async ({ page }) => {
  await open(page);
  const body = page.locator(`${panel('refresh')} .ds-dashpanel__body`);
  await page.locator(`${panel('refresh')} [data-dp-refresh]`).first().click();
  await expect(body).toHaveAttribute('aria-busy', 'true');
  await expect(body).toHaveClass(/ds-stale/);
  expect(await display(page, `${panel('refresh')} > .ds-dashpanel__head > .ds-loadbar`)).toBe('block');
  await expect(page.locator(`${panel('refresh')} .ds-columns`)).toHaveCount(1);
  await expect(page.locator('.ds-toast, .ds-snackbar').filter({ hasText: 'Refreshed.' }).first()).toBeVisible({ timeout: 10000 });
  await expect(body).not.toHaveAttribute('aria-busy', 'true');
  await expect(body).not.toHaveClass(/ds-stale/);
});

test('failed: Try again puts the loading state back, then the content', async ({ page }) => {
  await open(page);
  const failed = page.locator(panel('failed'));
  const empty = failed.locator('.ds-empty');
  // The empty state alone in the body sits in its middle.
  const [body, box] = await Promise.all([failed.locator('.ds-dashpanel__body').boundingBox(), empty.boundingBox()]);
  expect(Math.abs((box.y - body.y) - (body.y + body.height - box.y - box.height))).toBeLessThan(18);
  await failed.getByRole('button', { name: 'Try again' }).click();
  await expect(failed).toHaveAttribute('aria-busy', 'true');
  await expect(failed.locator('[role="status"]')).toHaveText('Loading');
  await expect(failed.locator('.ds-columns')).toHaveCount(1, { timeout: 10000 });
  await expect(failed).not.toHaveAttribute('aria-busy');
});

test('a row of panels lines up whatever each shows; at 360px they stack and nothing scrolls sideways', async ({ page }) => {
  await open(page);
  const heights = await page.$$eval('.ds-grid-2 > .ds-dashpanel', (els) => els.slice(0, 2).map((el) => el.getBoundingClientRect().height));
  expect(heights[0]).toBeCloseTo(heights[1], 0);
  await page.setViewportSize({ width: 360, height: 800 });
  const fits = await page.$$eval('.ds-dashpanel', (els) => els.every((el) => el.scrollWidth <= el.clientWidth + 1 && el.getBoundingClientRect().right <= innerWidth + 1));
  expect(fits).toBe(true);
  // A long title ends in an ellipsis and keeps its name.
  await page.$eval(`${panel('ready')} .ds-dashpanel__title`, (el) => { el.textContent = 'Tickets per day across every building and every floor of the site'; });
  const title = await page.$eval(`${panel('ready')} .ds-dashpanel__title`, (el) => [el.scrollWidth > el.clientWidth, getComputedStyle(el).textOverflow]);
  expect(title).toEqual([true, 'ellipsis']);
});

test('variants: outlined has the hairline, filled the low surface, elevated the shadow', async ({ page }) => {
  await open(page);
  const look = (name) => page.$eval(panel(`variant-${name}`), (el) => {
    const style = getComputedStyle(el);
    return { border: style.borderTopColor, bg: style.backgroundColor, shadow: style.boxShadow };
  });
  const outlined = await look('outlined');
  const filled = await look('filled');
  const elevated = await look('elevated');
  expect(outlined.border).not.toBe('rgba(0, 0, 0, 0)');
  expect(outlined.shadow).toBe('none');
  expect(filled.border).toBe('rgba(0, 0, 0, 0)');
  expect(filled.bg).not.toBe(outlined.bg);
  expect(elevated.border).toBe('rgba(0, 0, 0, 0)');
  expect(elevated.shadow).not.toBe('none');
});

test('options: the head and the padding follow density, the head takes the touch target, the corners the shape', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const region = document.createElement('div');
    region.id = 'probe';
    region.insertAdjacentHTML('beforeend', ['', 'ds-density-dense', 'ds-touch', 'ds-shape-square'].map((cls, index) => `<div class="${cls}"><section class="ds-dashpanel" id="o${index}"><header class="ds-dashpanel__head"><div class="ds-dashpanel__heading"><h3 class="ds-dashpanel__title">A</h3></div></header><div class="ds-dashpanel__body">B</div></section></div>`).join(''));
    document.getElementById('fx-component').prepend(region);
  });
  const head = (id) => page.$eval(`#${id} .ds-dashpanel__head`, (el) => el.getBoundingClientRect().height);
  const pad = (id) => page.$eval(`#${id} .ds-dashpanel__body`, (el) => parseFloat(getComputedStyle(el).paddingLeft));
  const radius = (id) => page.$eval(`#${id}`, (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
  expect(await head('o0')).toBe(56);
  expect(await head('o1')).toBe(48);
  const target = await page.$eval('#o2', (el) => parseFloat(getComputedStyle(el).getPropertyValue('--ds-target-min')));
  expect(await head('o2')).toBeGreaterThanOrEqual(Math.max(56, target));
  expect(await pad('o0')).toBe(16);
  expect(await pad('o1')).toBe(12);
  expect(await radius('o0')).toBeGreaterThan(0);
  expect(await radius('o3')).toBe(0);
});

test('forced colours: every variant keeps an edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  for (const name of ['outlined', 'filled', 'elevated']) {
    const edge = await page.$eval(panel(`variant-${name}`), (el) => {
      const style = getComputedStyle(el);
      return [style.borderTopWidth, style.borderTopStyle, style.borderTopColor];
    });
    expect(edge[0], name).toBe('1px');
    expect(edge[1], name).toBe('solid');
    expect(edge[2], name).not.toBe('rgba(0, 0, 0, 0)');
  }
});
