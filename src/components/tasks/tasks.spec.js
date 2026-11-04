/**
 * The tasks on the options model (3.0): size and density space the steps
 * and leave the type and the mark alone; the shape on the pending ring; the
 * status shows in the mark and the weight and says itself in words; a step
 * adds no tab stop; a step that advances in place keeps its mark and draws
 * its tick; forced colours. The 2.x behaviour stays in
 * test/browser/lists.spec.js. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/component.html?c=tasks';
const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];

async function open(page) {
  await page.goto(FIXTURE);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

test('size and density space the steps, never below none; the type and the mark stay', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const host = document.querySelector('#fx-component');
    const out = [];
    for (const [density] of densities) {
      for (const [size] of sizes) {
        const region = document.createElement('div');
        region.className = `${density} ${size}`;
        region.innerHTML = '<ol class="ds-tasks"><li class="ds-tasks__item" data-status="pending"><span class="ds-tasks__mark"></span><span class="ds-tasks__text">One</span></li><li class="ds-tasks__item" data-status="done"><span class="ds-tasks__mark"></span><span class="ds-tasks__text">Two</span></li></ol>';
        host.append(region);
        const [first, second] = region.querySelectorAll('.ds-tasks__item');
        const mark = first.querySelector('.ds-tasks__mark').getBoundingClientRect();
        out.push({
          density, size,
          gap: second.getBoundingClientRect().top - first.getBoundingClientRect().bottom,
          mark: [mark.width, mark.height],
          font: parseFloat(getComputedStyle(first).fontSize),
        });
        region.remove();
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES });
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const name = `${entry.size} ${entry.density}`;
    expect(entry.gap, `${name}: gap`).toBeCloseTo(Math.max(0, 8 + step * 2 + density * 2), 0);
    expect(entry.mark, `${name}: mark`).toEqual([20, 20]);
    expect(entry.font, `${name}: type`).toBe(14);
  }
});

test('the shape multiplies the pending ring; the spinner and the glyphs stay round', async ({ page }) => {
  await open(page);
  const read = (shape) => page.evaluate((cls) => {
    const region = document.createElement('div');
    region.className = cls;
    region.innerHTML = '<ol class="ds-tasks"><li class="ds-tasks__item" data-status="pending"><span class="ds-tasks__mark"></span><span class="ds-tasks__text">One</span></li></ol>';
    document.querySelector('#fx-component').prepend(region);
    const radius = parseFloat(getComputedStyle(region.querySelector('.ds-tasks__mark'), '::before').borderTopLeftRadius);
    region.remove();
    return radius;
  }, shape);
  // Half of the 16px ring, times the shape, at most half.
  expect(await read('ds-shape-square')).toBe(0);
  expect(await read('ds-shape-soft')).toBe(4);
  expect(await read('')).toBe(8);
  expect(await read('ds-shape-round')).toBe(8);
});

test('each status has a shape of its own, a word, and the running step the label weight', async ({ page }) => {
  await open(page);
  const read = await page.locator('[data-demo="all"]').evaluate((list) => Object.fromEntries([...list.children].map((item) => {
    const mark = item.querySelector('.ds-tasks__mark');
    return [item.getAttribute('data-status'), {
      glyph: !!mark.querySelector('svg'), spinner: !!mark.querySelector('.ds-spinner'),
      ring: parseFloat(getComputedStyle(mark, '::before').borderTopWidth) || 0,
      weight: Number(getComputedStyle(item.querySelector('.ds-tasks__text')).fontWeight),
      text: item.querySelector('.ds-tasks__text').textContent,
    }];
  })));
  expect(read.pending.ring).toBe(2);
  expect(read.running.spinner).toBe(true);
  expect(read.done.glyph).toBe(true);
  expect(read.failed.glyph).toBe(true);
  expect(read.running.weight).toBeGreaterThan(read.pending.weight);
  expect(read.pending.text).toContain(': waiting');
  expect(read.running.text).toContain(': running');
  expect(read.done.text).toContain(': done');
  expect(read.failed.text).toContain('failed');
});

test('keyboard and names: the list is named and adds no tab stop; the page\'s buttons drive it', async ({ page }) => {
  await open(page);
  const steps = page.getByRole('list', { name: 'Steps' });
  await expect(steps).toBeVisible();
  const stops = await steps.evaluate((el) => [...el.querySelectorAll('*')].filter((node) => node.tabIndex >= 0).length);
  expect(stops).toBe(0);
  const next = page.locator('[data-demo="next"]');
  await next.focus();
  await page.keyboard.press('Enter');
  await settle(page);
  await expect(page.locator('[data-demo="count"]')).toHaveText('2 of 4');
  await expect(steps.locator('[data-status="done"]')).toHaveCount(2);
  await expect(steps.locator('[data-status="running"]')).toHaveText(/Join the domain: running/);
  await page.locator('[data-demo="fail"]').click();
  await settle(page);
  await expect(steps.locator('[data-status="failed"]')).toHaveText(/failed, the server did not answer/);
  await page.locator('[data-demo="reset"]').click();
  await settle(page);
  await expect(page.locator('[data-demo="count"]')).toHaveText('0 of 4');
  await expect(steps.locator('[data-status="done"]')).toHaveCount(0);
});

test('forced colours: the marks and the ring in the text colour', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const read = await page.locator('[data-demo="all"]').evaluate((list) => {
    const probe = document.createElement('span');
    probe.style.color = 'CanvasText';
    probe.style.forcedColorAdjust = 'none';
    list.append(probe);
    const text = getComputedStyle(probe).color;
    probe.remove();
    const mark = (status) => list.querySelector(`[data-status="${status}"] .ds-tasks__mark`);
    return {
      text,
      marks: ['pending', 'running', 'done', 'failed'].map((status) => getComputedStyle(mark(status)).color),
      ring: getComputedStyle(mark('pending'), '::before').borderTopColor,
    };
  });
  for (const colour of read.marks) expect(colour).toBe(read.text);
  expect(read.ring).toBe(read.text);
});
