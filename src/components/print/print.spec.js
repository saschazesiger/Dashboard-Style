/**
 * Print on its demo, on screen and with the print media emulated:
 * .ds-print-only shows on paper only and .ds-print-hide on screen only,
 * whatever display a component gives them, and a hidden part leaves the
 * accessibility tree; the break and avoid classes set their break
 * properties on paper only; .ds-print-exact keeps fills; .ds-print-urls
 * prints the address after an http(s) link; .ds-print-page is a sheet on
 * screen (its width hook, its radius times the shape, a narrow margin on
 * a phone) and the paper's full width in print, in the light scheme of a
 * light-dark() theme; forced colours keep the sheet's edge. Runs in the
 * `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=print');
  await ready(page);
}

const style = (page, selector, props, pseudo) => page.$eval(selector, (el, [names, which]) => {
  const computed = getComputedStyle(el, which || null);
  return Object.fromEntries(names.map((name) => [name, computed.getPropertyValue(name)]));
}, [props, pseudo]);

test('screen: the paper-only note is hidden and out of the accessibility tree; the actions show', async ({ page }) => {
  await open(page);
  await expect(page.locator('[data-demo="print-only"]')).toBeHidden();
  await expect(page.locator('[data-demo="actions"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Print' })).toBeVisible();
  expect(await style(page, '[data-demo="total"]', ['break-inside'])).toEqual({ 'break-inside': 'auto' });
  expect(await style(page, '[data-demo="break-before"]', ['break-before'])).toEqual({ 'break-before': 'auto' });
  expect(await page.$eval('[data-demo="sheet"] a', (el) => getComputedStyle(el, '::after').content)).toBe('none');
});

test('paper: the note shows, the actions go, breaks and fills apply, links print their address', async ({ page }) => {
  await open(page);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('[data-demo="print-only"]')).toBeVisible();
  await expect(page.locator('[data-demo="actions"]')).toBeHidden();
  expect(await style(page, '[data-demo="total"]', ['break-inside'])).toEqual({ 'break-inside': 'avoid' });
  expect(await style(page, '[data-demo="break-before"]', ['break-before', 'print-color-adjust'])).toEqual({ 'break-before': 'page', 'print-color-adjust': 'exact' });
  const after = await page.$eval('[data-demo="sheet"] a', (el) => getComputedStyle(el, '::after').content);
  expect(after).toContain('https://example.com/terms');
  await page.evaluate(() => {
    document.getElementById('fx-component').insertAdjacentHTML('afterbegin', '<div id="probe"><div class="ds-print-break-after" id="after">A</div><div class="ds-print-urls"><a href="#local" id="local">Local</a><a href="mailto:ada@example.com" id="mail">Mail</a></div><div class="ds-cluster ds-print-hide" id="row">B</div></div>');
  });
  expect(await style(page, '#after', ['break-after'])).toEqual({ 'break-after': 'page' });
  expect(await page.$eval('#local', (el) => getComputedStyle(el, '::after').content), 'an in-page link prints no address').toBe('none');
  expect(await page.$eval('#mail', (el) => getComputedStyle(el, '::after').content)).toBe('none');
  expect(await style(page, '#row', ['display']), 'hidden whatever display the cluster gives it').toEqual({ display: 'none' });
});

test('the sheet: a sheet of --ds-print-page-width on screen, the paper\'s width in print', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const sheet = page.locator('[data-demo="sheet"]');
  const screen = await sheet.evaluate((el) => {
    const probe = document.createElement('div');
    probe.style.inlineSize = '210mm';
    document.body.append(probe);
    const a4 = probe.getBoundingClientRect().width;
    probe.remove();
    const s = getComputedStyle(el);
    return { width: Math.round(el.getBoundingClientRect().width), a4: Math.round(a4), shadow: s.boxShadow !== 'none', pad: s.paddingTop };
  });
  expect(screen.width).toBeLessThanOrEqual(screen.a4);
  expect(screen.shadow).toBe(true);
  expect(screen.pad).toBe('40px');
  await sheet.evaluate((el) => el.style.setProperty('--ds-print-page-width', '500px'));
  expect(Math.round(await sheet.evaluate((el) => el.getBoundingClientRect().width))).toBe(500);
  await sheet.evaluate((el) => el.style.removeProperty('--ds-print-page-width'));
  await page.emulateMedia({ media: 'print' });
  const paper = await sheet.evaluate((el) => {
    const s = getComputedStyle(el);
    return { max: s.maxWidth, pad: s.paddingTop, radius: s.borderTopLeftRadius, shadow: s.boxShadow, scheme: s.colorScheme };
  });
  expect(paper).toEqual({ max: 'none', pad: '0px', radius: '0px', shadow: 'none', scheme: 'light' });
  const headings = await page.$eval('[data-demo="sheet"] h3', (el) => getComputedStyle(el).breakAfter);
  expect(headings).toBe('avoid');
});

test('the sheet in a dark light-dark() region prints light', async ({ page }) => {
  await open(page);
  // A preset: every role is light-dark() (the default tokens are light values).
  await page.evaluate(() => new Promise((resolve) => {
    const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: '/dist/themes/presets/default.css', onload: resolve });
    document.head.append(link);
  }));
  await page.evaluate(() => { document.querySelector('[data-demo="sheet"]').parentElement.style.colorScheme = 'dark'; });
  const surface = (scheme) => page.evaluate((s) => {
    const probe = document.createElement('div');
    probe.style.cssText = `color-scheme: ${s}; background: var(--ds-surface)`;
    document.querySelector('[data-demo="sheet"]').parentElement.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, scheme);
  const light = await surface('light');
  const screen = await page.$eval('[data-demo="sheet"]', (el) => getComputedStyle(el).backgroundColor);
  expect(screen, 'dark on screen').not.toBe(light);
  await page.emulateMedia({ media: 'print' });
  expect(await page.$eval('[data-demo="sheet"]', (el) => getComputedStyle(el).backgroundColor)).toBe(light);
});

test('options: the radius times the shape on screen; a narrow container keeps a usable margin', async ({ page }) => {
  await open(page);
  const radius = (shape) => page.evaluate((cls) => {
    const sheet = document.querySelector('[data-demo="sheet"]');
    sheet.parentElement.className = `ds-stack ${cls}`;
    return parseFloat(getComputedStyle(sheet).borderTopLeftRadius);
  }, shape);
  const base = await radius('');
  expect(base).toBeGreaterThan(0);
  expect(await radius('ds-shape-square')).toBe(0);
  expect(await radius('ds-shape-soft')).toBeCloseTo(base / 2, 0);
  await page.evaluate(() => {
    const host = document.createElement('div');
    host.style.cssText = 'container-type: inline-size; inline-size: 360px';
    host.innerHTML = '<article class="ds-print-page" id="narrow">Invoice</article>';
    document.getElementById('fx-component').prepend(host);
  });
  expect(await page.$eval('#narrow', (el) => getComputedStyle(el).paddingTop)).toBe('20px');
});

test('the demo at 360px: the sheet and its table fit, nothing scrolls sideways', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  await expect(page.locator('[data-demo="sheet"]')).toBeVisible();
  await expect(page.getByRole('article', { name: 'Invoice 2026-0142' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('forced colours: the sheet keeps an edge where its shadow goes', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  expect(await style(page, '[data-demo="sheet"]', ['outline-style', 'outline-width'])).toEqual({ 'outline-style': 'solid', 'outline-width': '1px' });
});
