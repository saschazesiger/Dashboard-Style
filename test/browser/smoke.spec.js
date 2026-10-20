/**
 * Smoke tests of the harness itself: the static server, the styleguide's
 * test hooks (`data-sg-ready`, `data-sg-theme`, `?speed=`), the version of
 * the loaded `dist/ds.js` and the four ES modules of `dist/js/`. When one of
 * these fails, every other spec fails for the same reason; start here.
 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { ready, settle } from './helpers/motion.js';

const STYLEGUIDE = '/styleguide/index.html';
const FIXTURES = '/test/browser/fixtures/';
const VERSION = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version;

/** Collects console errors and uncaught exceptions of the page. */
function collectErrors(page) {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(String(error)));
  return errors;
}

test('the server answers with the right types and stays inside the repository', async ({ request }) => {
  const types = {
    [STYLEGUIDE]: 'text/html',
    '/dist/ds.js': 'text/javascript',
    '/dist/js/motion.js': 'text/javascript',
    '/dist/ds.css': 'text/css',
    '/dist/fonts/fonts.css': 'text/css',
    '/package.json': 'application/json',
  };
  for (const [path, type] of Object.entries(types)) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()['content-type'], path).toContain(type);
    expect(response.headers()['cache-control'], `${path}: no caching headers`).toBeUndefined();
  }
  const font = readFileSync(new URL('../../dist/fonts/fonts.css', import.meta.url), 'utf8').match(/url\(["']?([^"')]+\.woff2)/);
  expect(font, 'fonts.css names a woff2 file').not.toBeNull();
  const woff = await request.get(new URL(font[1], 'http://127.0.0.1:4173/dist/fonts/').pathname);
  expect(woff.headers()['content-type']).toContain('font/woff2');
  expect((await request.get('/dist/')).status(), 'no directory listings').toBe(404);
  expect((await request.get('/dist/missing.css')).status()).toBe(404);
  expect((await request.get('/%2e%2e/%2e%2e/etc/passwd')).status(), 'nothing outside the root').toBeGreaterThanOrEqual(400);
});

test('the styleguide reaches data-sg-ready without a console error and runs this version', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto(STYLEGUIDE);
  await ready(page);
  await settle(page);
  await expect(page.locator('html')).toHaveAttribute('data-sg-ready', '');
  expect(await page.evaluate(() => window.DS.version)).toBe(VERSION);
  expect(errors).toEqual([]);
});

test('every fixture loads without a console error', async ({ page }) => {
  const errors = collectErrors(page);
  for (const name of ['motion', 'controls', 'feedback', 'shell', 'module', 'reset', 'reset-layered', 'spike']) {
    await page.goto(`${FIXTURES}${name}.html`);
    // module.html has no fixture.js: it reports through window.moduleResult.
    if (name === 'module') await page.waitForFunction(() => window.moduleResult);
    else await ready(page);
  }
  expect(errors).toEqual([]);
});

test('module.html imports the four ES modules and they export what window.DS exposes', async ({ page }) => {
  await page.goto(`${FIXTURES}module.html`);
  const result = await page.waitForFunction(() => window.moduleResult).then((handle) => handle.jsonValue());
  expect(result.error).toBeUndefined();
  expect(result.missing).toEqual({});
  expect(Object.keys(result.modules).sort()).toEqual(['dom', 'icons', 'indicator', 'motion']);
  expect(result.ok).toBe(true);
});

test('a theme switch marks data-sg-theme and re-places the three indicators', async ({ page }) => {
  await page.goto(STYLEGUIDE);
  await ready(page);
  await settle(page);
  /** Whether each indicator's placement matches its active item (box size). */
  const placed = () => page.evaluate(() => [
    ['#sg-nav', '[aria-current="page"]'],
    ['#sg-segmented', '[aria-current="true"]'],
    ['#sg-track', '[aria-pressed="true"]'],
  ].map(([track, active]) => {
    const indicator = document.querySelector(`${track} > .ds-indicator`);
    const item = document.querySelector(`${track} ${active}`);
    const rect = item.getBoundingClientRect();
    const width = parseFloat(indicator.style.getPropertyValue('--ds-indicator-w'));
    const height = parseFloat(indicator.style.getPropertyValue('--ds-indicator-h'));
    return `${track} ${Math.abs(width - rect.width) < 0.5 && Math.abs(height - rect.height) < 0.5 ? 'placed' : `off (${width}x${height} vs ${rect.width}x${rect.height})`}`;
  }));
  const expected = ['#sg-nav placed', '#sg-segmented placed', '#sg-track placed'];
  expect(await placed()).toEqual(expected);
  // The dim preset changes type and button sizes; example loads a file.
  for (const value of ['dim', 'example', 'square', 'default', 'dim', 'default']) {
    await page.locator('#sg-theme-select').selectOption(value);
    await expect(page.locator('html')).toHaveAttribute('data-sg-theme', value);
    expect(await placed(), value).toEqual(expected);
  }
});

test('a saved theme is applied before data-sg-ready', async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem('ds-styleguide-theme', 'example'); } catch (e) { /* the assertion below fails */ }
  });
  await page.goto(STYLEGUIDE);
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-sg-theme', 'example');
  expect(await page.locator('#sg-theme-link').evaluate((link) => !link.disabled && !!link.sheet)).toBe(true);
});

test('?speed=0.1 slows CSS motion tenfold on the styleguide and the fixtures', async ({ page }) => {
  await page.goto(`${STYLEGUIDE}?speed=0.1`);
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-sg-speed', '0.1');
  const card = page.locator('#sg-motion-card');
  // --ds-time-scale stretches the tokens: the 350ms slide takes 3500ms.
  const durations = (locator) => locator.evaluate((el) => el.getAnimations().map((animation) => Math.round(animation.effect.getComputedTiming().duration)));
  await page.locator('[data-enter="slide"]').click();
  await expect.poll(() => durations(card)).toEqual([3500, 3500]);

  await page.goto(`${FIXTURES}motion.html?speed=0.1`);
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-fx-speed', '0.1');
  await page.locator('[data-replay="#enter-scale"]').click();
  await expect.poll(() => durations(page.locator('#enter-scale'))).toEqual([2500, 2500]);
});
