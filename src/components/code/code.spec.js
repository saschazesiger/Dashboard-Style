/**
 * The code block (DS.code) on its demo: lines (the text stays the source,
 * numbers never copied), marks, the header (language, copy target, names),
 * the wrap toggle, files as tabs (keyboard, ARIA), the fold (state, height,
 * reversal), the controller, density, shape, touch, forced colours and the
 * time 2,000 lines take. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=code');
  await ready(page);
  await page.mouse.move(1, 1);
}

const DEVICE = '{\n  "id": 42,\n  "name": "LAPTOP-0042",\n  "model": "Laptop 14",\n  "owner": "Ada Lovelace",\n  "retired": false,\n  "ports": [80, 443],\n  "note": null\n}';

test('lines: one per line, numbered, highlighted; the code\'s text stays the source', async ({ page }) => {
  await open(page);
  const code = page.locator('[data-demo="header"] code');
  expect(await code.evaluate((el) => el.textContent)).toBe(DEVICE);
  expect(await code.locator('.ds-code__line').count()).toBe(9);
  expect(await code.locator('.ds-code__line').nth(2).getAttribute('data-line')).toBe('3');
  expect(await code.locator('.ds-highlight__property').count()).toBeGreaterThan(5);
  // The number is generated content: shown, never part of the text.
  const gutter = await code.locator('.ds-code__line').first().evaluate((el) => getComputedStyle(el, '::before').content);
  expect(gutter).toBe('"1"');
  // Without a header, numbering from 41.
  const start = page.locator('[data-demo="start"] .ds-code__line');
  expect(await start.first().getAttribute('data-line')).toBe('41');
});

test('marked lines: a <mark> with a tint and a bar at its start', async ({ page }) => {
  await open(page);
  const marks = page.locator('[data-demo="header"] mark.ds-code__line--mark');
  expect(await marks.evaluateAll((els) => els.map((el) => el.getAttribute('data-line')))).toEqual(['3', '5', '6']);
  const look = await marks.first().evaluate((el) => ({ bar: getComputedStyle(el).borderInlineStartWidth, bg: getComputedStyle(el).backgroundColor }));
  expect(look.bar).toBe('2px');
  expect(look.bg).not.toBe('rgba(0, 0, 0, 0)');
  // The mark spans the block's width: the line's box reaches both edges of the scroller.
  const [line, pre] = await Promise.all([marks.first().boundingBox(), page.locator('[data-demo="header"] pre').boundingBox()]);
  expect(Math.round(line.x)).toBe(Math.round(pre.x));
  expect(Math.round(line.width)).toBe(Math.round(pre.width));
  expect(await page.locator('[data-demo="start"] mark').getAttribute('data-line')).toBe('43');
});

test('a diff tints its added and removed lines; the signs stay', async ({ page }) => {
  await open(page);
  const diff = page.locator('[data-demo="diff"]');
  expect(await diff.locator('.ds-code__line--inserted').count()).toBe(2);
  expect(await diff.locator('.ds-code__line--deleted').count()).toBe(2);
  expect(await diff.locator('.ds-code__line--inserted').first().textContent()).toMatch(/^\+/);
});

test('header: the language, a copy button aimed at the code, the block named by the title', async ({ page }) => {
  await open(page);
  const frame = page.locator('[data-demo="header"]');
  await expect(frame.locator('.ds-code__lang')).toHaveText('json');
  const id = await frame.locator('code').getAttribute('id');
  expect(await frame.locator('[data-ds-copy]').getAttribute('data-ds-copy')).toBe(`#${id}`);
  await expect(frame.locator('pre')).toHaveAccessibleName('device.json');
  await expect(frame.locator('[data-ds-copy]')).toHaveAccessibleName('Copy code');
  // A frame without a title is named by its language.
  await expect(page.locator('[data-demo="compact-code"] pre')).toHaveAccessibleName('sh');
});

test('wrap: a toggle button; every block wraps; a press back scrolls again', async ({ page }) => {
  await open(page);
  const frame = page.locator('[data-demo="tabs"]');
  const toggle = frame.locator('[data-ds-code-wrap]');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(toggle).toHaveAccessibleName('Wrap lines');
  const events = page.evaluate(() => new Promise((resolve) => document.querySelector('[data-demo="tabs"]').addEventListener('ds:wrap', (event) => resolve(event.detail), { once: true })));
  await toggle.click();
  expect(await events).toEqual({ wrap: true });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  for (const pre of await frame.locator('pre').all()) await expect(pre).toHaveClass(/ds-code-block--wrap/);
  expect(await frame.locator('pre').first().evaluate((el) => getComputedStyle(el).whiteSpace)).toBe('pre-wrap');
  await focusByKeyboard(page, toggle);
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(await frame.locator('pre').first().evaluate((el) => getComputedStyle(el).whiteSpace)).toBe('pre');
});

test('tabs: the arrow keys, Home and End select a file; its block shows, the header follows', async ({ page }) => {
  await open(page);
  const frame = page.locator('[data-demo="tabs"]');
  const tabs = frame.getByRole('tab');
  await expect(frame.getByRole('tablist')).toHaveAccessibleName('Files');
  await expect(tabs).toHaveCount(3);
  await focusByKeyboard(page, tabs.first());
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'false');
  await expect(frame.getByRole('tabpanel')).toHaveAccessibleName('retire.sh');
  await expect(frame.locator('.ds-code__lang')).toHaveText('sh');
  const shown = frame.locator('pre:not([hidden]) code');
  expect(await frame.locator('[data-ds-copy]').getAttribute('data-ds-copy')).toBe(`#${await shown.getAttribute('id')}`);
  await page.keyboard.press('End');
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await expect(frame.locator('.ds-code__lang')).toHaveText('ts');
  await page.keyboard.press('Home');
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  await tabs.nth(2).click();
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  expect(await frame.locator('pre').evaluateAll((els) => els.map((el) => el.hidden))).toEqual([true, true, false]);
  // Tab from the selected tab leaves the row (one stop), then reaches the buttons and the block.
  expect(await tabs.evaluateAll((els) => els.map((el) => el.tabIndex))).toEqual([-1, -1, 0]);
});

test('fold: longer than its maximum, the block shows that many lines; Show more opens and closes it', async ({ page }) => {
  await open(page);
  const frame = page.locator('[data-demo="folded"]');
  const pre = frame.locator('pre');
  const button = frame.locator('[data-ds-code-expand]');
  await expect(frame).toHaveAttribute('data-state', 'collapsed');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toHaveAccessibleName('Show more');
  expect(await button.getAttribute('aria-controls')).toBe(await pre.getAttribute('id'));
  const folded = await pre.evaluate((el) => {
    const style = getComputedStyle(el);
    return { height: el.getBoundingClientRect().height, expected: 8 * parseFloat(style.lineHeight) + parseFloat(style.paddingTop) };
  });
  expect(folded.height).toBeCloseTo(folded.expected, 0);
  await focusByKeyboard(page, button);
  await page.keyboard.press('Enter');
  await expect(frame).toHaveAttribute('data-state', 'expanded');
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(button).toHaveAccessibleName('Show less');
  await settle(page);
  await page.waitForFunction(() => !document.querySelector('[data-demo="folded"] pre').style.height, null, { timeout: 3000 });
  const unfolded = await pre.evaluate((el) => ({ height: el.getBoundingClientRect().height, full: el.scrollHeight }));
  expect(unfolded.height).toBeCloseTo(unfolded.full, 0);
  await page.keyboard.press('Enter');
  await expect(frame).toHaveAttribute('data-state', 'collapsed');
  await page.waitForFunction(() => !document.querySelector('[data-demo="folded"] pre').style.height, null, { timeout: 3000 });
  expect(await pre.evaluate((el) => el.getBoundingClientRect().height)).toBeCloseTo(folded.expected, 0);
  // A frame whose block fits shows no foot.
  expect(await page.locator('[data-demo="header"]').getAttribute('data-state')).toBeNull();
});

test('fold: the height glides from where it is, and a reversal continues from there', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { document.querySelector('.ds-theme').style.setProperty('--ds-time-scale', '10'); });
  const frame = page.locator('[data-demo="folded"]');
  const pre = frame.locator('pre');
  const start = await pre.evaluate((el) => el.getBoundingClientRect().height);
  await frame.locator('[data-ds-code-expand]').click();
  await page.waitForTimeout(400);
  const mid = await pre.evaluate((el) => el.getBoundingClientRect().height);
  expect(mid).toBeGreaterThan(start);
  // The reversal in one task: the height right after it is the height right before it.
  const [before, after] = await pre.evaluate((el) => {
    const height = el.getBoundingClientRect().height;
    el.closest('.ds-code').querySelector('[data-ds-code-expand]').click();
    return [height, el.getBoundingClientRect().height];
  });
  expect(before).toBeGreaterThanOrEqual(mid);
  // No snap to either end: it goes on from where it was (an engine may sample the clock a moment later).
  const full = await pre.evaluate((el) => el.scrollHeight);
  expect(Math.abs(after - before)).toBeLessThan((full - start) * 0.1);
  await page.waitForFunction(() => !document.querySelector('[data-demo="folded"] pre').style.height, null, { timeout: 10000 });
  expect(await pre.evaluate((el) => el.getBoundingClientRect().height)).toBeCloseTo(start, 0);
});

test('the controller: set, select, expand, wrap and their events; the attribute path\'s controller is DS.core.get', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const el = document.querySelector('[data-demo="header"]');
    const code = DS.core.get(el, 'code');
    const seen = [];
    code.on('change', (detail) => seen.push(['change', detail.code]));
    el.addEventListener('ds:change', () => seen.push(['event']));
    code.set('{ "id": 43 }\n');
    return { text: el.querySelector('code').textContent, lines: el.querySelectorAll('.ds-code__line').length, get: code.get(), seen };
  });
  expect(result).toEqual({ text: '{ "id": 43 }', lines: 1, get: '{ "id": 43 }\n', seen: [['event'], ['change', '{ "id": 43 }\n']] });
  const tabs = await page.evaluate(() => {
    const el = document.querySelector('[data-demo="tabs"]');
    const code = DS.core.get(el, 'code');
    const selected = [];
    el.addEventListener('ds:select', (event) => selected.push(event.detail.index));
    code.select(2);
    code.select(9);
    return { selected, lang: el.querySelector('.ds-code__lang').textContent, source: code.get().slice(0, 9) };
  });
  expect(tabs).toEqual({ selected: [2], lang: 'ts', source: 'interface' });
});

test('density: 2px per step off the block\'s padding, the lines with it; shape: the frame\'s radius', async ({ page }) => {
  await open(page);
  const measure = () => page.evaluate(() => {
    const frame = document.querySelector('[data-demo="header"]');
    const line = frame.querySelector('.ds-code__line');
    const pre = frame.querySelector('pre');
    return { top: parseFloat(getComputedStyle(pre).paddingTop), line: parseFloat(getComputedStyle(line).paddingInlineEnd), radius: parseFloat(getComputedStyle(frame).borderTopLeftRadius) };
  });
  const base = await measure();
  expect(base).toEqual({ top: 16, line: 16, radius: base.radius });
  for (const [cls, step] of [['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]]) {
    await page.evaluate((name) => { document.querySelector('[data-demo="header"]').className = `ds-code ds-code--lines ${name}`; }, cls);
    const measured = await measure();
    expect(measured.top, cls).toBe(16 + step * 2);
    expect(measured.line, cls).toBe(16 + step * 2);
  }
  await page.evaluate(() => { document.querySelector('[data-demo="header"]').className = 'ds-code ds-code--lines ds-shape-square'; });
  expect((await measure()).radius).toBe(0);
  await page.evaluate(() => { document.querySelector('[data-demo="header"]').className = 'ds-code ds-code--lines ds-shape-round'; });
  expect((await measure()).radius).toBeCloseTo(base.radius * 1.5, 0);
});

test('touch: the header\'s buttons and tabs grow to the touch target', async ({ page }) => {
  await open(page);
  await page.evaluate(() => document.querySelector('[data-demo="tabs"]').classList.add('ds-touch'));
  const sizes = await page.locator('[data-demo="tabs"] :is([role="tab"], .ds-btn)').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)));
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(48);
});

test('a block that scrolls: Tab reaches it, an inset ring, the arrow keys scroll it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await open(page);
  const block = page.locator('[data-demo="plain"] pre[tabindex]');
  await expect(block).toHaveAccessibleName('Request');
  await focusByKeyboard(page, block);
  await settle(page);
  expect(await block.evaluate((el) => [getComputedStyle(el).outlineStyle, getComputedStyle(el).outlineOffset])).toEqual(['solid', '-2px']);
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => document.querySelector('[data-demo="plain"] pre[tabindex]').scrollLeft > 0, null, { timeout: 3000 });
  // Nothing in the demo is wider than a phone.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('2,000 lines render quickly', async ({ page }) => {
  await open(page);
  const took = await page.evaluate(() => {
    const source = Array.from({ length: 2000 }, (_, i) => `function f${i}(a, b) { return a.value + "s${i}" * 0x${i} / 2; } // ${i}`).join('\n');
    const figure = document.createElement('figure');
    figure.className = 'ds-code ds-code--lines';
    figure.innerHTML = '<pre class="ds-code-block" data-ds-code-lang="js"><code></code></pre>';
    figure.querySelector('code').textContent = source;
    document.getElementById('fx-component').append(figure);
    const start = performance.now();
    DS.code.create(figure);
    const lines = figure.querySelectorAll('.ds-code__line').length;
    const time = performance.now() - start;
    figure.remove();
    return { lines, time };
  });
  expect(took.lines).toBe(2000);
  expect(took.time).toBeLessThan(1500);
});

test('forced colours: the frame and the block keep an edge; a marked line its bar in Highlight', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  expect(await page.locator('[data-demo="header"]').evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  expect(await page.locator('[data-demo="plain"] pre').first().evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  const system = await page.evaluate(() => {
    const el = document.createElement('span');
    el.style.forcedColorAdjust = 'none';
    el.style.color = 'Highlight';
    document.body.append(el);
    const colour = getComputedStyle(el).color;
    el.remove();
    return colour;
  });
  expect(await page.locator('[data-demo="header"] mark').first().evaluate((el) => getComputedStyle(el).borderInlineStartColor)).toBe(system);
  expect(await page.locator('[data-demo="header"] mark').first().evaluate((el) => getComputedStyle(el).borderInlineStartWidth)).toBe('2px');
});
