/**
 * The link: inline links keep the underline (colour is never alone), a
 * standalone link has none at rest and takes it on hover and keyboard
 * focus, reads the size's type and reaches the touch minimum; the external
 * icon and its rel; the focus ring snaps; forced colours keep the
 * standalone underline. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=link');
  await ready(page);
  await page.mouse.move(1, 1);
}

/** Inserts `html` (its subject has id="probe"), reads `read` (an expression of el and style), removes it. */
const probe = (page, html, read) => page.evaluate(({ html, read }) => {
  document.querySelector('#fx-component').insertAdjacentHTML('beforeend', `<div class="probe">${html}</div>`);
  const holder = document.querySelector('#fx-component > .probe:last-child');
  const el = holder.querySelector('#probe');
  el.removeAttribute('id');
  const style = getComputedStyle(el);
  const out = new Function('el', 'style', `return (${read});`)(el, style);
  holder.remove();
  return out;
}, { html, read });

/** The colour a token resolves to, as getComputedStyle writes it. */
const colourOf = (page, value) => page.evaluate((value) => {
  const el = document.createElement('span');
  el.style.color = value;
  document.querySelector('#fx-component').append(el);
  const colour = getComputedStyle(el).color;
  el.remove();
  return colour;
}, value);

test('inline: the link colour and the underline at rest, the stronger underline on hover', async ({ page }) => {
  await open(page);
  const link = page.locator('[data-demo="inline"] .ds-link').first();
  const rest = await link.evaluate((el) => {
    const style = getComputedStyle(el);
    return { line: style.textDecorationLine, colour: style.color, under: style.textDecorationColor };
  });
  expect(rest.line).toBe('underline');
  expect(rest.colour).toBe(await colourOf(page, 'var(--ds-link)'));
  expect(rest.under).toBe(await colourOf(page, 'var(--ds-link-underline)'));
  await link.hover();
  await expect.poll(() => link.evaluate((el) => getComputedStyle(el).textDecorationColor)).toBe(await colourOf(page, 'var(--ds-link-underline-hover)'));
  // Its type is the text's: a size class changes nothing on an inline link.
  expect(await probe(page, '<p class="ds-lg">A <a id="probe" class="ds-link" href="#x">link</a></p>', 'style.fontSize')).toBe(await probe(page, '<p class="ds-lg" id="probe">A</p>', 'style.fontSize'));
});

test('standalone: no underline at rest, the underline on hover and keyboard focus, the label role', async ({ page }) => {
  await open(page);
  const link = page.locator('[data-demo="standalone"] .ds-link--standalone').first();
  const transparent = await colourOf(page, 'transparent');
  expect(await link.evaluate((el) => getComputedStyle(el).textDecorationColor)).toBe(transparent);
  expect(await link.evaluate((el) => getComputedStyle(el).fontWeight)).toBe('500');
  await link.hover();
  const strong = await colourOf(page, 'var(--ds-link-underline-hover)');
  await expect.poll(() => link.evaluate((el) => getComputedStyle(el).textDecorationColor)).toBe(strong);
  await page.mouse.move(1, 1);
  await expect.poll(() => link.evaluate((el) => getComputedStyle(el).textDecorationColor)).toBe(transparent);
  await focusByKeyboard(page, link);
  await expect.poll(() => link.evaluate((el) => getComputedStyle(el).textDecorationColor)).toBe(strong);
  // The ring: solid from the first frame, at its offset once it snapped.
  const ring = await link.evaluate((el) => ({ style: getComputedStyle(el).outlineStyle, width: parseFloat(getComputedStyle(el).outlineWidth) }));
  expect(ring).toEqual({ style: 'solid', width: 2 });
  await expect.poll(() => link.evaluate((el) => parseFloat(getComputedStyle(el).outlineOffset))).toBe(2);
});

test('options: a standalone link reads the size role and the touch minimum; the shape scales the ring radius', async ({ page }) => {
  await open(page);
  const standalone = (cls) => `<div class="${cls}"><a id="probe" class="ds-link ds-link--standalone" href="#x">All devices</a></div>`;
  expect(await probe(page, standalone(''), 'parseFloat(style.fontSize)')).toBe(14);
  expect(await probe(page, standalone('ds-xs'), 'parseFloat(style.fontSize)')).toBe(12);
  expect(await probe(page, standalone('ds-lg'), 'parseFloat(style.fontSize)')).toBe(16);
  expect(await probe(page, standalone(''), 'el.getBoundingClientRect().height')).toBeLessThan(48);
  expect(await probe(page, standalone('ds-touch'), 'el.getBoundingClientRect().height')).toBe(48);
  // An inline link in text is exempt from the target minimum.
  expect(await probe(page, '<p class="ds-touch">A <a id="probe" class="ds-link" href="#x">link</a></p>', 'el.getBoundingClientRect().height')).toBeLessThan(48);
  expect(await probe(page, standalone('ds-shape-square'), 'parseFloat(style.borderTopLeftRadius)')).toBe(0);
  expect(await probe(page, standalone(''), 'parseFloat(style.borderTopLeftRadius)')).toBe(4);
  expect(await probe(page, standalone('ds-shape-round'), 'parseFloat(style.borderTopLeftRadius)')).toBe(6);
});

test('external: the icon after the words, hidden from screen readers; rel and the new-tab text', async ({ page }) => {
  await open(page);
  const link = page.locator('[data-demo="external"] .ds-link--external');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAccessibleName('product manual (opens in a new tab)');
  const icon = link.locator('.ds-link__icon');
  await expect(icon).toHaveAttribute('aria-hidden', 'true');
  const geometry = await link.evaluate((el) => {
    const icon = el.querySelector('.ds-link__icon').getBoundingClientRect();
    const font = parseFloat(getComputedStyle(el).fontSize);
    const text = document.createRange();
    text.selectNodeContents(el.firstChild);
    return { icon: icon.width, font, after: icon.left - text.getBoundingClientRect().right };
  });
  expect(geometry.icon).toBeCloseTo(geometry.font * 0.875, 1);
  expect(geometry.after).toBeGreaterThanOrEqual(3);
  // Hover never moves the icon.
  const before = await icon.boundingBox();
  await link.hover();
  expect(await icon.boundingBox()).toEqual(before);
});

test('quiet: the quieter ink, still underlined', async ({ page }) => {
  await open(page);
  const quiet = page.locator('[data-demo="quiet"] .ds-link--quiet').first();
  const style = await quiet.evaluate((el) => ({ colour: getComputedStyle(el).color, line: getComputedStyle(el).textDecorationLine }));
  expect(style).toEqual({ colour: await colourOf(page, 'var(--ds-text-2)'), line: 'underline' });
});

test('no ripple, no state layer, no press morph: a link is inline text', async ({ page }) => {
  await open(page);
  const link = page.locator('[data-demo="standalone"] .ds-link--standalone').first();
  const box = await link.boundingBox();
  await page.mouse.move(box.x + 5, box.y + box.height / 2);
  await page.mouse.down();
  const pressed = await link.evaluate((el) => ({ ripple: el.querySelectorAll('.ds-press-ripple').length, before: getComputedStyle(el, '::before').content }));
  await page.mouse.up();
  expect(pressed.ripple).toBe(0);
  expect(pressed.before).toBe('none');
});

test('forced colours: LinkText, and a standalone link keeps its underline', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const link = page.locator('[data-demo="standalone"] .ds-link--standalone').first();
  const style = await link.evaluate((el) => ({ under: getComputedStyle(el).textDecorationColor, colour: getComputedStyle(el).color }));
  expect(style.under).toBe(style.colour);
  expect(style.under).not.toBe('rgba(0, 0, 0, 0)');
});
