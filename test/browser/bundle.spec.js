/**
 * A partial bundle renders like the full ds.css and ds.js: the bundle tool
 * (scripts/tools/bundle.mjs) scans fixtures/bundle.html and writes a
 * minified classic bundle from this checkout's dist/ (its manifest.json)
 * into test-results/. The page then loads once with the
 * bundle and once with ds.css and ds.js: every computed property of the
 * elements it uses is the same, the ripple grows from a press, and the
 * dialog opens, takes focus and closes on Escape.
 */
import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '../../scripts/tools/bundle.mjs';
import { ready, settle } from './helpers/motion.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const PAGE = '/test/browser/fixtures/bundle.html';
let folder = '';
let sizes = null;

test.beforeAll(({}, testInfo) => {
  // One folder per project: the engines run in parallel workers.
  const name = `bundle-${testInfo.project.name}`;
  const out = join(ROOT, 'test-results', name);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const result = bundle({
    config: { content: ['test/browser/fixtures/bundle.html'], out: `test-results/${name}`, minify: true, js: 'classic' },
    cwd: ROOT,
    dist: join(ROOT, 'dist'),
  });
  if (result.errors.length) throw new Error(result.errors.join('\n'));
  sizes = result.entries[0].report;
  folder = `/test-results/${name}`;
});

/** Every computed property of the probed elements (and the ::before of each button), as plain data. */
const styles = (page) => page.evaluate(() => {
  const out = {};
  const read = (style) => Object.fromEntries([...style].sort().map((property) => [property, style.getPropertyValue(property)]));
  for (const element of document.querySelectorAll('[data-probe]')) {
    const name = element.getAttribute('data-probe');
    out[name] = read(getComputedStyle(element));
    if (element.matches('.ds-btn')) out[`${name}::before`] = read(getComputedStyle(element, '::before'));
    [...element.children].forEach((child, index) => { out[`${name} > ${index}`] = read(getComputedStyle(child)); });
  }
  return out;
});

async function load(page, mode) {
  await page.goto(mode === 'bundle' ? `${PAGE}?bundle=${encodeURIComponent(folder)}` : PAGE);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

/** The names an `@property` file registers. */
const registered = (path) => new Set([...readFileSync(path, 'utf8').matchAll(/@property\s+(--[\w-]+)/g)].map((match) => match[1]));

/**
 * The properties that differ between the full page (a) and the bundle (b),
 * per element. Custom properties keep the text of their declaration, so
 * they compare without whitespace (the minified files drop it); one the
 * bundle lacks may only be a registration of a component it leaves out.
 */
function differences(a, b) {
  const found = [];
  const left = [...registered(join(ROOT, 'dist/css/properties.css'))].filter((name) => !registered(join(ROOT, folder.slice(1), 'properties.css')).has(name));
  const tight = (value) => value?.replace(/\s+/g, ' ').replace(/\s*([,()/])\s*/g, '$1').trim();
  for (const element of new Set([...Object.keys(a), ...Object.keys(b)])) {
    for (const property of new Set([...Object.keys(a[element] ?? {}), ...Object.keys(b[element] ?? {})])) {
      const [x, y] = [a[element]?.[property], b[element]?.[property]];
      if (property.startsWith('--') && (tight(x) === tight(y) || (y === undefined && left.includes(property)))) continue;
      if (x !== y) found.push(`${element} ${property}: ${x} | ${y}`);
    }
  }
  return found;
}

test('the bundle holds what the page uses, at a fraction of ds.css and ds.js', () => {
  expect(sizes.components.map((item) => item.name)).toEqual(['utilities', 'button', 'spinner', 'card', 'status', 'alert', 'chip', 'dialog', 'ripple']);
  expect(sizes.modules.map((item) => item.name)).toEqual(['core', 'motion', 'dom', 'ripple', 'icons', 'overlay']);
  expect(sizes.icons.map((item) => item.name).sort()).toEqual(['alertCircle', 'check', 'checkCircle', 'close', 'info', 'wifiOff']);
  expect(sizes.files.css.gzip).toBeLessThan(40 * 1024);
});

test('a partial bundle computes the same styles as ds.css, at rest and with the dialog open', async ({ page }) => {
  await load(page, 'full');
  const full = await styles(page);
  await page.locator('#open').click();
  await settle(page);
  const fullOpen = await styles(page);

  await load(page, 'bundle');
  expect(await page.evaluate(() => [Object.keys(DS).sort(), document.styleSheets[1].href])).toEqual([
    ['config', 'core', 'define', 'dom', 'get', 'icons', 'init', 'motion', 'overlay', 'ripple', 'version'],
    expect.stringContaining('/ds.bundle.css'),
  ]);
  expect(differences(full, await styles(page))).toEqual([]);
  await page.locator('#open').click();
  await settle(page);
  expect(differences(fullOpen, await styles(page))).toEqual([]);
});

for (const mode of ['bundle', 'full']) {
  test(`the ripple and the dialog work (${mode})`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    await load(page, mode);
    const button = page.locator('#open');
    const box = await button.boundingBox();
    await page.mouse.move(box.x + 12, box.y + 10);
    await page.mouse.down();
    await expect(button.locator('.ds-press-ripple')).toHaveCount(1);
    expect(await button.locator('.ds-press-ripple').evaluate((el) => getComputedStyle(el).position)).toBe('absolute');
    await page.mouse.up();
    await settle(page);

    const dialog = page.locator('#dialog');
    await expect(dialog).toHaveAttribute('data-state', 'open');
    await expect(page.locator('#cancel')).toBeFocused();
    await expect(dialog.locator('.ds-dialog__box')).toBeVisible();
    await settle(page);
    await page.keyboard.press('Escape');
    await settle(page);
    await expect(dialog.locator('.ds-dialog__box')).toBeHidden();
    await expect(button).toBeFocused();
    await expect(page.locator('[data-probe="status"] svg')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}
