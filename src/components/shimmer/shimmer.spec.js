/**
 * The shimmer on its demo page: the copy lies over the text in the line's
 * own type, in the glint, through a band of the mask that travels one tile
 * per round; the accessible name is the text's own, said once; the class
 * off takes the glint away and leaves the text; the copy is cut with the
 * same ellipsis; forced colours leave the copy out. Runs in the `fallback`
 * project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const URL = '/test/browser/fixtures/component.html?c=shimmer';

async function open(page) {
  await page.goto(URL);
  await ready(page);
}

const FIRST = '.ds-shimmer[data-shimmer="Thinking"]';

test('the copy lies over the text in its own type, in the glint, through a travelling band of the mask', async ({ page }) => {
  await open(page);
  const look = await page.locator(FIRST).evaluate((el) => {
    const text = getComputedStyle(el);
    const copy = getComputedStyle(el, '::after');
    const probe = document.createElement('span');
    probe.style.color = 'var(--ds-shimmer-glint, light-dark(var(--ds-surface), var(--ds-on-primary-container)))';
    el.closest('.ds-theme').append(probe);
    const glint = getComputedStyle(probe).color;
    probe.remove();
    return {
      content: copy.content,
      position: copy.position,
      font: [copy.fontSize, copy.fontWeight, copy.fontFamily].join(' '),
      textFont: [text.fontSize, text.fontWeight, text.fontFamily].join(' '),
      color: copy.color,
      glint,
      mask: copy.maskImage || copy.webkitMaskImage,
      maskSize: copy.maskSize || copy.webkitMaskSize,
      animation: copy.animationName,
      timing: copy.animationTimingFunction,
      iterations: copy.animationIterationCount,
      duration: copy.animationDuration,
      pointer: copy.pointerEvents,
    };
  });
  expect(look.content).toContain('Thinking');
  expect(look.position).toBe('absolute');
  expect(look.font).toBe(look.textFont);
  expect(look.color).toBe(look.glint);
  expect(look.mask).toContain('linear-gradient');
  expect(look.maskSize).toMatch(/^480px/);
  expect(look.animation).toBe('ds-progress-wave');
  expect(look.timing).toBe('linear');
  expect(look.iterations).toBe('infinite');
  expect(parseFloat(look.duration)).toBeCloseTo(4.55, 2);
  expect(look.pointer).toBe('none');
});

test('the accessible name is the text, said once: the copy has an empty alternative text', async ({ page }) => {
  await open(page);
  await expect(page.locator(FIRST)).toHaveText('Thinking');
  const snapshot = await page.locator('.sg-demo-root').ariaSnapshot();
  expect(snapshot).toContain('Thinking');
  expect(snapshot).not.toMatch(/Thinking\s*Thinking/);
  expect(snapshot).not.toMatch(/Running npm test\s*Running npm test/);
});

test('the class off takes the glint away at once and leaves the text; the toggle is a button with its state', async ({ page }) => {
  await open(page);
  const toggle = page.locator('[data-demo="toggle"]');
  const line = page.locator('[data-demo="line"]');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(line).not.toHaveClass(/ds-shimmer/);
  expect(await line.evaluate((el) => getComputedStyle(el, '::after').content)).toBe('none');
  await expect(line).toHaveText('Importing 2,030 rows');
});

test('a narrow line is cut with an ellipsis, and its copy with it', async ({ page }) => {
  await open(page);
  const cut = await page.locator('.ds-shimmer[data-shimmer^="Checking the warranty"]').evaluate((el) => ({
    overflow: getComputedStyle(el).textOverflow,
    copy: getComputedStyle(el, '::after').textOverflow,
    width: el.getBoundingClientRect().width,
    cut: el.scrollWidth > el.clientWidth,
  }));
  expect(cut.overflow).toBe('ellipsis');
  expect(cut.copy).toBe('ellipsis');
  expect(cut.cut).toBe(true);
  expect(cut.width).toBeLessThanOrEqual(180);
});

test('forced colours: the copy is left out, the text stays', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const look = await page.locator(FIRST).evaluate((el) => ({ copy: getComputedStyle(el, '::after').content, text: el.textContent }));
  expect(look.copy).toBe('none');
  expect(look.text).toBe('Thinking');
});
