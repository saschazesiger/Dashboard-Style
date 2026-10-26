/**
 * Tabs (tabs.css) in real engines: a 48px row over a hairline; the bar
 * under the selected tab is the indicator (3px, --ds-primary, at the bottom
 * of the tab) and glides to the next one; the selected tab takes the
 * primary ink and the label weight without changing width (data-label);
 * the new panel enters with swap; the state layer is a pill inside the tab
 * that morphs on press and holds the ripple; a blocked tab shows no hover
 * or press and keeps its panel; a row that scrolls sideways keeps the
 * selected tab in view (reveal) and hides its scrollbar; --fill shares the
 * row; forced colours paint the selected tab SelectedItem; print wraps.
 */
import { test, expect } from './base-test.js';
import { ready, settle } from './helpers/motion.js';

const URL = '/test/browser/fixtures/tabs.html';

async function open(page) {
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.goto(URL);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

const box = (page, selector) => page.locator(selector).first().evaluate((el) => {
  const rect = el.getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom };
});
const style = (page, selector, property, pseudo = null) => page.locator(selector).first().evaluate((el, [name, which]) => getComputedStyle(el, which).getPropertyValue(name), [property, pseudo]);

/** The colour a token computes to, through a probe. */
function colourOf(page, token) {
  return page.evaluate((name) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, token);
}

test('a 48px row over a hairline; the selected tab is primary ink, the label weight and a 3px bar at its bottom', async ({ page }) => {
  await open(page);
  expect((await box(page, '#t-details')).height).toBe(48);
  expect(await style(page, '#tabs', 'border-bottom-width')).toBe('1px');
  expect(await style(page, '#t-details', 'color')).toBe(await colourOf(page, '--ds-primary'));
  expect(Number(await style(page, '#t-details', 'font-weight'))).toBeGreaterThan(Number(await style(page, '#t-history', 'font-weight')));
  const bar = await box(page, '#tabs .ds-indicator');
  const tab = await box(page, '#t-details');
  expect(Math.abs(bar.left - tab.left)).toBeLessThan(1);
  expect(Math.abs(bar.bottom - tab.bottom)).toBeLessThan(1);
  expect(await style(page, '#tabs .ds-indicator', 'background-size')).toContain('3px');
});

test('selecting a tab glides the bar, keeps every width, and enters the new panel with swap', async ({ page }) => {
  await open(page);
  const widths = await page.locator('#tabs .ds-tabs__tab').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
  // The entrance is read in the click's own task: on a busy machine a
  // later read can come after it ended.
  // The bar's glide is watched from before the click for the same reason.
  const panel = await page.evaluate(async () => {
    const bar = document.querySelector('#tabs .ds-indicator');
    let glided = false;
    const watch = new MutationObserver(() => { glided ||= 'glide' in bar.dataset; });
    watch.observe(bar, { attributes: true, attributeFilter: ['data-glide'] });
    document.getElementById('t-history').click();
    const el = document.getElementById('p-history');
    const result = { hidden: el.hidden, names: el.getAnimations().map((a) => a.animationName) };
    for (let i = 0; i < 3; i++) await new Promise((resolve) => requestAnimationFrame(resolve));
    watch.disconnect();
    return { ...result, glided: glided || 'glide' in bar.dataset };
  });
  expect(panel.hidden).toBe(false);
  expect(panel.names.join(' ')).toMatch(/ds-/);
  expect(panel.glided).toBe(true);
  await settle(page);
  expect(await page.locator('#tabs .ds-tabs__tab').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width))).toEqual(widths);
  const bar = await box(page, '#tabs .ds-indicator');
  const history = await box(page, '#t-history');
  expect(Math.abs(bar.left - history.left)).toBeLessThan(1);
  expect(Math.abs(bar.width - history.width)).toBeLessThan(1);
  expect(await page.locator('#p-details').isHidden()).toBe(true);
});

test('the state layer is a pill inside the tab that turns squarer on press and holds the ripple', async ({ page }) => {
  await open(page);
  const tab = await box(page, '#t-history');
  const rest = await style(page, '#t-history', 'border-top-left-radius', '::before');
  expect(await style(page, '#t-history', 'top', '::before')).toBe('4px');
  await page.mouse.move(tab.left + 20, tab.top + 20);
  await page.mouse.down();
  // The morph runs on --ds-dur-micro; a busy machine may need longer.
  await page.waitForFunction((rest) => parseFloat(getComputedStyle(document.getElementById('t-history'), '::before').borderTopLeftRadius) < parseFloat(rest), rest, { timeout: 3000 }).catch(() => {});
  const ripple = await page.locator('#t-history .ds-press-ripple').evaluate((el) => {
    const outer = el.getBoundingClientRect();
    return { top: outer.top, height: outer.height, overflow: getComputedStyle(el).overflow };
  });
  expect(Math.round(ripple.top - tab.top)).toBe(4);
  expect(Math.round(ripple.height)).toBe(40);
  expect(ripple.overflow).toBe('clip');
  expect(parseFloat(await style(page, '#t-history', 'border-top-left-radius', '::before'))).toBeLessThan(parseFloat(rest));
  await page.mouse.up();
});

test('a blocked tab shows no hover or press and keeps the selection', async ({ page }) => {
  await open(page);
  await page.locator('#t-reports').hover();
  await settle(page);
  expect(Number(await style(page, '#t-reports', 'opacity', '::before'))).toBe(0);
  await page.locator('#t-reports').click({ force: true });
  expect(await page.locator('#t-details').getAttribute('aria-selected')).toBe('true');
  expect(await page.locator('#t-reports .ds-press-ripple').count()).toBe(0);
});

test('a row that scrolls sideways hides its scrollbar and keeps the selected tab in view', async ({ page }) => {
  await open(page);
  const scrolls = await page.locator('#narrow').evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(scrolls).toBe(true);
  expect((await box(page, '#narrow')).height).toBe(49); // 48px and the hairline: no scrollbar under the row
  await page.locator('#narrow').evaluate((el) => {
    el.querySelectorAll('.ds-tabs__tab').forEach((tab) => tab.setAttribute('aria-selected', String(tab.id === 'may')));
  });
  await page.waitForFunction(() => {
    const row = document.getElementById('narrow').getBoundingClientRect();
    const may = document.getElementById('may').getBoundingClientRect();
    // The last tab: as far as the row scrolls (no room past its end).
    return document.getElementById('narrow').scrollLeft > 0 && may.right <= row.right + 0.5 && may.left >= row.left;
  }, null, { timeout: 5000 });
});

test('--fill shares the row; link tabs select by aria-current', async ({ page }) => {
  await open(page);
  const tabs = await page.locator('#fill .ds-tabs__tab').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
  expect(Math.abs(tabs[0] - tabs[1])).toBeLessThan(1);
  expect(Math.abs(tabs[0] + tabs[1] - 480)).toBeLessThan(1);
  const bar = await box(page, '#links .ds-indicator');
  const overview = await box(page, '#links .ds-tabs__tab');
  expect(Math.abs(bar.left - overview.left)).toBeLessThan(1);
});

test('forced colours paint the selected tab SelectedItem and hide the bar; print wraps the row', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const selected = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.cssText = 'forced-color-adjust: none; background-color: SelectedItem';
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  });
  expect(await style(page, '#t-details', 'background-color')).toBe(selected);
  expect(await style(page, '#tabs .ds-indicator', 'display')).toBe('none');
  await page.emulateMedia({ forcedColors: 'none', media: 'print' });
  expect(await style(page, '#narrow', 'flex-wrap')).toBe('wrap');
});
