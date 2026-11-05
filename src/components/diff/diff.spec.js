/**
 * The diff view: what it renders from the text (headers, counts, words,
 * gutters, signs), the folds and the lines loaded between hunks, the split
 * and auto views, the keyboard and the names, the highlighter hook, a page
 * that changes the source, the options, the contrast of the fills and forced
 * colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const TEXT = [
  'diff --git a/src/a.js b/src/a.js',
  '--- a/src/a.js',
  '+++ b/src/a.js',
  '@@ -1,16 +1,16 @@ function a() {',
  ' one',
  '-const RETRIES = 2;',
  '+const RETRIES = 3;',
  ...Array.from({ length: 12 }, (_, i) => ` same ${i + 1}`),
  '-two',
  '+deux',
  ' end',
  '@@ -40,2 +40,2 @@',
  ' keep',
  '-x <b>',
  '+y <b>',
].join('\n');

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=diff');
  await ready(page);
}

/** A fresh view of `text` in the fixture, made by the attribute path or by create(options). */
async function mount(page, text = TEXT, { attributes = '', options = null, cls = '' } = {}) {
  await page.evaluate(({ text, attributes, options, cls }) => {
    document.querySelector('#probe')?.remove();
    const host = document.createElement('div');
    host.id = 'probe';
    host.className = `ds-diff ${cls}`;
    host.setAttribute('aria-label', 'Probe');
    for (const [name, value] of Object.entries(attributes || {})) host.setAttribute(name, value);
    const source = document.createElement('pre');
    source.className = 'ds-diff__source';
    source.textContent = text;
    host.append(source);
    document.querySelector('#fx-component').prepend(host);
    if (options) {
      // A load callback cannot cross from the test: the page makes one that answers numbered lines.
      const made = { ...options };
      if (options.load === 'numbered') made.load = ({ from, to }) => new Promise((resolve) => setTimeout(() => resolve(Array.from({ length: to - from + 1 }, (_, i) => `loaded ${from + i}`)), 50));
      window.probeView = DS.diff.create(host, made);
    }
    else host.setAttribute('data-ds-diff', '');
  }, { text, attributes: attributes || {}, options, cls });
  await expect(page.locator('#probe .ds-diff__file').first()).toBeVisible();
  return page.locator('#probe');
}

test('renders the files: header, counts, status, gutters, signs and words; the source hides', async ({ page }) => {
  await open(page);
  const view = await mount(page);
  await expect(view.locator('.ds-diff__source')).toBeHidden();
  await expect(view).toHaveAttribute('data-view', 'unified');
  const file = view.locator('.ds-diff__file');
  await expect(file).toHaveCount(1);
  await expect(file.locator('.ds-diff__name')).toHaveText('src/a.js');
  await expect(file.locator('h3.ds-diff__name')).toHaveCount(1);
  await expect(file.locator('.ds-diff__stat')).toContainText('+3');
  await expect(file.locator('.ds-diff__stat .ds-sr')).toHaveText('3 added, 3 removed');
  await expect(file.locator('.ds-diff__hunk').first()).toContainText('@@ -1,16 +1,16 @@ function a() {');
  const changed = file.locator('.ds-diff__line').nth(1);
  await expect(changed.locator('.ds-diff__sign .ds-sr')).toHaveText('Removed');
  await expect(changed.locator('del.ds-diff__word')).toHaveText('2');
  await expect(file.locator('.ds-diff__line').nth(2).locator('ins.ds-diff__word')).toHaveText('3');
  // Numbers and signs are generated content, so a selection copies only the code.
  const before = await changed.locator('.ds-diff__num').first().evaluate((cell) => getComputedStyle(cell, '::before').content);
  expect(before).toBe('"2"');
  // Markup in the code is text.
  await expect(file.locator('.ds-diff__code', { hasText: '<b>' })).toHaveCount(2);
  await expect(file.locator('.ds-diff__code b')).toHaveCount(0);
  // The binary and the empty states.
  await mount(page, 'diff --git a/x.png b/x.png\nnew file mode 100644\nBinary files /dev/null and b/x.png differ');
  await expect(page.locator('#probe .ds-diff__status')).toHaveText('New file');
  await expect(page.locator('#probe .ds-diff__empty')).toHaveText('Binary file, not shown');
  await page.evaluate(() => { document.querySelector('#probe .ds-diff__source').textContent = ''; });
  await expect(page.locator('#probe .ds-diff__files > .ds-diff__empty')).toHaveText('No changes');
});

test('a fold opens its lines, moves the focus to the first of them and says how many', async ({ page }) => {
  await open(page);
  const view = await mount(page);
  const fold = view.locator('.ds-diff__fold button');
  await expect(fold).toHaveText('Show 6 unchanged lines');
  await expect(view.locator('.ds-diff__line', { hasText: 'same 4' })).toHaveCount(0);
  const events = page.evaluate(() => new Promise((resolve) => document.querySelector('#probe').addEventListener('ds:expand', (event) => resolve(event.detail.count), { once: true })));
  await fold.focus();
  await page.keyboard.press('Enter');
  expect(await events).toBe(6);
  await expect(view.locator('.ds-diff__fold')).toHaveCount(0);
  const first = view.locator('.ds-diff__line', { hasText: 'same 4' });
  await expect(first).toBeFocused();
  await expect(page.locator('.ds-sr', { hasText: '6 more lines shown' }).first()).toBeAttached();
  // The fold stays open across a render of the same text.
  await page.evaluate(() => DS.core.get(document.querySelector('#probe'), 'diff').set({ view: 'split' }));
  await expect(view.locator('.ds-diff__fold')).toHaveCount(0);
  // expand() opens every fold.
  await mount(page);
  await page.evaluate(() => DS.core.get(document.querySelector('#probe'), 'diff').expand());
  await expect(page.locator('#probe .ds-diff__fold')).toHaveCount(0);
  await mount(page, TEXT, { attributes: { 'data-ds-diff-context': 'all' } });
  await expect(page.locator('#probe .ds-diff__fold')).toHaveCount(0);
});

test('split puts old and new side by side; auto picks by the width', async ({ page }) => {
  await open(page);
  const view = await mount(page, TEXT, { attributes: { 'data-ds-diff-view': 'split' } });
  await expect(view).toHaveAttribute('data-view', 'split');
  const row = view.locator('.ds-diff__line').nth(1);
  await expect(row.locator('td')).toHaveCount(6);
  await expect(row.locator('.ds-diff__code').first()).toHaveAttribute('data-kind', 'del');
  await expect(row.locator('.ds-diff__code').last()).toHaveAttribute('data-kind', 'add');
  await expect(view.locator('.ds-diff__cols th .ds-sr')).toHaveText(['Old line', 'Change', 'Before', 'New line', 'Change', 'After']);
  await page.evaluate(() => { document.querySelector('#probe').style.inlineSize = '600px'; });
  await page.evaluate(() => document.querySelector('#probe').setAttribute('data-ds-diff-view', 'auto'));
  await expect(view).toHaveAttribute('data-view', 'unified');
  await page.evaluate(() => { document.querySelector('#probe').style.inlineSize = '800px'; });
  await expect(view).toHaveAttribute('data-view', 'split');
  await page.evaluate(() => { document.querySelector('#probe').style.setProperty('--ds-diff-split-min', '900px'); document.querySelector('#probe').style.inlineSize = '850px'; });
  await expect(view).toHaveAttribute('data-view', 'unified');
});

test('keyboard and names: the toggle folds the file, the body is a named region', async ({ page }) => {
  await open(page);
  const view = await mount(page);
  const toggle = view.locator('.ds-diff__toggle');
  await expect(toggle).toHaveAccessibleName('src/a.js');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(view.locator('section.ds-diff__file')).toHaveAccessibleName('src/a.js');
  const body = view.locator('.ds-diff__body');
  await expect(body).toHaveAttribute('role', 'region');
  await expect(body).toHaveAccessibleName('src/a.js');
  await toggle.focus();
  await page.keyboard.press('Tab');
  await expect(body).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(body).toBeHidden();
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Space');
  await expect(body).toBeVisible();
  await mount(page, TEXT, { attributes: { 'data-ds-diff-heading': '4' } });
  await expect(page.locator('#probe h4.ds-diff__name')).toHaveCount(1);
});

test('the lines between hunks: loaded by the page, shown with the focus on the first, never folded again', async ({ page }) => {
  await open(page);
  await mount(page, TEXT, { options: { load: 'numbered' } });
  const view = page.locator('#probe');
  const gap = view.locator('.ds-diff__hunk').nth(1).locator('button');
  await expect(gap).toHaveAccessibleName('Show 23 unchanged lines');
  await expect(view.locator('.ds-diff__hunk').first().locator('button')).toHaveCount(0);
  await gap.click();
  await expect(view.locator('.ds-diff__line', { hasText: 'loaded 17' })).toBeFocused();
  await expect(view.locator('.ds-diff__line', { hasText: 'loaded 39' })).toHaveCount(1);
  await expect(view.locator('.ds-diff__hunk').nth(1).locator('button')).toHaveCount(0);
  const numbers = await view.locator('.ds-diff__line', { hasText: 'loaded 17' }).locator('.ds-diff__num').evaluateAll((cells) => cells.map((cell) => cell.dataset.line));
  expect(numbers).toEqual(['17', '17']);
  await expect(view.locator('.ds-diff__fold')).toHaveCount(1);
});

test('a highlighter colours the code; the word marks lie over it, the nesting whole', async ({ page }) => {
  await open(page);
  await page.evaluate(() => DS.diff.highlighter((code) => code.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]).replace(/\b(const)\b/g, '<span class="kw">$1</span>').replace(/(\d+)/g, '<span class="num">$1</span>')));
  const view = await mount(page);
  const added = view.locator('.ds-diff__line').nth(2).locator('.ds-diff__code');
  await expect(added.locator('.kw')).toHaveText('const');
  await expect(added.locator('.num ins.ds-diff__word')).toHaveText('3');
  await expect(added).toHaveText('const RETRIES = 3;');
  await expect(view.locator('.ds-diff__code', { hasText: 'y <b>' })).toHaveCount(1);
  // Off for one view, and back to none for the page.
  await mount(page, TEXT, { options: { highlight: false } });
  await expect(page.locator('#probe .kw')).toHaveCount(0);
  await page.evaluate(() => DS.diff.highlighter(null));
  await mount(page);
  await expect(page.locator('#probe .kw')).toHaveCount(0);
});

test('a page that changes the source renders again; destroy() gives the source back', async ({ page }) => {
  await open(page);
  const view = await mount(page);
  await page.evaluate(() => { document.querySelector('#probe .ds-diff__source').textContent = 'diff --git a/b.txt b/b.txt\n--- a/b.txt\n+++ b/b.txt\n@@ -1 +1 @@\n-a\n+b'; });
  await expect(view.locator('.ds-diff__name')).toHaveText('b.txt');
  const changes = page.evaluate(() => new Promise((resolve) => document.querySelector('#probe').addEventListener('ds:change', (event) => resolve(event.detail.view), { once: true })));
  await page.evaluate(() => DS.core.get(document.querySelector('#probe'), 'diff').set({ view: 'split' }));
  expect(await changes).toBe('split');
  await page.evaluate(() => DS.core.destroy(document.querySelector('#probe')));
  await expect(view.locator('.ds-diff__files')).toHaveCount(0);
  await expect(view.locator('.ds-diff__source')).toBeVisible();
});

test('options: density and size step the lines, shape the corners; wrap', async ({ page }) => {
  await open(page);
  await mount(page);
  const height = (cls) => page.evaluate((cls) => {
    const probe = document.querySelector('#probe');
    probe.className = `ds-diff ${cls}`;
    return probe.querySelectorAll('.ds-diff__line')[3].getBoundingClientRect().height;
  }, cls);
  expect(await height('')).toBe(24);
  expect(await height('ds-density-compact')).toBe(22);
  expect(await height('ds-density-dense')).toBe(20);
  expect(await height('ds-density-tight')).toBe(20);
  expect(await height('ds-lg')).toBe(26);
  const radius = (cls) => page.evaluate((cls) => {
    const probe = document.querySelector('#probe');
    probe.className = `ds-diff ${cls}`;
    return parseFloat(getComputedStyle(probe.querySelector('.ds-diff__file')).borderTopLeftRadius);
  }, cls);
  const base = await radius('');
  expect(base).toBeGreaterThan(0);
  expect(await radius('ds-shape-square')).toBe(0);
  expect(await radius('ds-shape-soft')).toBeCloseTo(base / 2, 1);
  const code = page.locator('#probe .ds-diff__code').first();
  expect(await code.evaluate((cell) => getComputedStyle(cell).whiteSpace)).toBe('pre');
  await page.evaluate(() => { document.querySelector('#probe').className = 'ds-diff ds-diff--wrap'; });
  expect(await code.evaluate((cell) => getComputedStyle(cell).whiteSpace)).toBe('pre-wrap');
});

/** WCAG contrast of the text on the fill behind it. */
const contrastOf = (page, selector) => page.evaluate((selector) => {
  const cell = document.querySelector(selector);
  const rgb = (value) => {
    const probe = document.createElement('canvas').getContext('2d');
    probe.fillStyle = value;
    probe.fillRect(0, 0, 1, 1);
    return [...probe.getImageData(0, 0, 1, 1).data.slice(0, 3)];
  };
  const lum = ([r, g, b]) => [r, g, b].map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const style = getComputedStyle(cell);
  const [a, b] = [lum(rgb(style.color)), lum(rgb(style.backgroundColor))];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}, selector);

test('the code reads at 4.5:1 on every fill, light and dark', async ({ page }) => {
  await open(page);
  await mount(page);
  for (const scheme of ['light', 'dark']) {
    await page.evaluate((scheme) => document.body.setAttribute('data-ds-scheme', scheme), scheme);
    for (const selector of ['#probe .ds-diff__code[data-kind="add"]', '#probe .ds-diff__code[data-kind="del"]', '#probe ins.ds-diff__word', '#probe del.ds-diff__word', '#probe .ds-diff__hunk > td', '#probe .ds-diff__num[data-kind="add"]', '#probe .ds-diff__num[data-kind="del"]']) {
      expect(await contrastOf(page, selector), `${scheme} ${selector}`).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test('forced colours: the signs stay, inserted words underlined, removed ones struck', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const view = await mount(page);
  expect(await view.locator('ins.ds-diff__word').first().evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe('underline');
  expect(await view.locator('del.ds-diff__word').first().evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe('line-through');
  await expect(view.locator('.ds-diff__sign[data-kind="add"] .ds-sr').first()).toHaveText('Added');
  const sign = await view.locator('.ds-diff__sign[data-kind="add"]').first().evaluate((cell) => getComputedStyle(cell, '::before').content);
  expect(sign).toMatch(/^"\+"/);
});

test('the demo renders without errors and its view switch works', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await open(page);
  const main = page.locator('[data-demo="main"]');
  await expect(main.locator('.ds-diff__file')).toHaveCount(4);
  await page.locator('[data-mode="split"]').click();
  await expect(main).toHaveAttribute('data-view', 'split');
  await page.locator('[data-demo="wrap"]').click();
  await expect(main).toHaveClass(/ds-diff--wrap/);
  expect(errors).toEqual([]);
});
