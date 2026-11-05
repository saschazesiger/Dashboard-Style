/**
 * Syntax highlighting on its demo: data-ds-highlight colours every language
 * in place (the text stays the code), every token kind takes its role's
 * colour with the contrast the roles promise, a change of the language or
 * the code highlights again, the page's own highlighter goes first, and
 * forced colours read as plain text. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const LANGUAGES = ['json', 'js', 'ts', 'sh', 'html', 'xml', 'css', 'sql', 'yaml', 'go', 'py', 'diff'];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=highlight');
  await ready(page);
}

/** The relative luminance contrast of two computed rgb() colours. */
const contrastIn = (page, a, b) => page.evaluate(([fg, bg]) => {
  const lum = (text) => {
    const [r, g, b2] = text.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => v / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b2;
  };
  const [x, y] = [lum(fg), lum(bg)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}, [a, b]);

test('every language is highlighted in place; the text stays the code', async ({ page }) => {
  await open(page);
  for (const lang of LANGUAGES) {
    const code = page.locator(`[data-demo="languages"] code[data-ds-highlight="${lang}"]`);
    expect(await code.locator('[class^="ds-highlight__"]').count(), lang).toBeGreaterThan(2);
    const same = await code.evaluate((el) => el.textContent === DS.core.get(el, 'highlight').get());
    expect(same, lang).toBe(true);
  }
  await expect(page.locator('[data-demo="languages"] pre').first()).toHaveAccessibleName('JSON sample');
});

test('each kind takes its own colour, readable on the code background', async ({ page }) => {
  await open(page);
  const colours = await page.locator('[data-demo="kinds"] tbody tr').evaluateAll((rows) => rows.map((row) => {
    const token = row.querySelector('td:nth-child(2) code');
    return [token.className, getComputedStyle(token).color];
  }));
  expect(new Set(colours.map((entry) => entry[1])).size).toBeGreaterThanOrEqual(8);
  const bg = await page.locator('[data-demo="rendered"]').evaluate((el) => getComputedStyle(el).backgroundColor);
  // The fallbacks until the roles land, and the roles after: AA on the code background.
  for (const [, colour] of colours) expect(await contrastIn(page, colour, bg)).toBeGreaterThanOrEqual(4.5);
});

test('code the page renders through highlight() is escaped', async ({ page }) => {
  await open(page);
  const rendered = page.locator('[data-demo="rendered"] code');
  await expect(rendered).toContainText('<script> stays text');
  expect(await rendered.locator('script').count()).toBe(0);
  expect(await rendered.locator('.ds-highlight__keyword').count()).toBeGreaterThan(2);
});

test('a change of the language or the code highlights again; destroy leaves plain text', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const code = document.querySelector('[data-ds-highlight="json"]');
    code.setAttribute('data-ds-highlight', 'cobol');
    await new Promise((resolve) => setTimeout(resolve, 50));
    const plain = code.querySelectorAll('span').length;
    code.setAttribute('data-ds-highlight', 'yaml');
    await new Promise((resolve) => setTimeout(resolve, 50));
    const view = DS.core.get(code, 'highlight');
    const seen = [];
    code.addEventListener('ds:change', (event) => seen.push(event.detail));
    view.set('a: 1');
    const yaml = [...code.querySelectorAll('span')].map((span) => span.className);
    view.destroy();
    return { plain, yaml, seen, after: code.innerHTML };
  });
  expect(result.plain).toBe(0);
  expect(result.yaml).toEqual(['ds-highlight__property', 'ds-highlight__punctuation', 'ds-highlight__number']);
  expect(result.seen).toEqual([{ code: 'a: 1', language: 'yaml' }]);
  expect(result.after).toBe('a: 1');
});

test('the page\'s own highlighter goes first; null leaves the language to the system', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    DS.highlight.use((code, lang) => (lang === 'ruby' ? `<span class="page-keyword">${code}</span>` : null));
    const outside = DS.highlight.lines('def a\nend', 'ruby');
    const own = DS.highlight.highlight('{"a": 1}', 'json');
    DS.highlight.use(null);
    return { outside, own: own.includes('ds-highlight__property') };
  });
  expect(result).toEqual({ outside: ['<span class="page-keyword">def a</span>', '<span class="page-keyword">end</span>'], own: true });
});

test('forced colours: every token takes the text colour', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const colours = await page.locator('[data-demo="languages"] code[data-ds-highlight="js"]').evaluate((el) => {
    const text = getComputedStyle(el).color;
    return [...el.querySelectorAll('[class^="ds-highlight__"]')].map((span) => getComputedStyle(span).color === text);
  });
  expect(colours.every(Boolean)).toBe(true);
});
