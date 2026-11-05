/**
 * Image: the shapes and the fit, the states (loaded, a fade-in, a second
 * source, the fallback with the alt text), set() and a new src, the
 * options, names, forced colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const PICTURE = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="48"><rect width="64" height="48" fill="#888"/></svg>');
const BROKEN = 'data:image/svg+xml,not-a-picture';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=image');
  await ready(page);
}

/** A frame at 320px wide, made and started in the page; returns what `read` gives once it settled. */
const frame = (page, { cls = '', attrs = '', src = PICTURE, alt = 'Printer 7', wrap = '' }, read) => page.evaluate(async ({ cls, attrs, src, alt, wrap, read }) => {
  const holder = document.createElement('div');
  holder.style.inlineSize = '320px';
  holder.className = wrap;
  holder.innerHTML = `<figure class="ds-image ${cls}"><span class="ds-image__frame" ${attrs}><img alt="${alt}"></span><figcaption class="ds-image__caption">Caption</figcaption></figure>`;
  document.querySelector('#fx-component').append(holder);
  const el = holder.querySelector('.ds-image__frame');
  const handle = window.DS.image.create(el);
  const states = [];
  handle.on('change', (detail) => states.push(detail.state));
  handle.set(src);
  for (let i = 0; i < 50 && !['loaded', 'error'].includes(handle.get().state); i += 1) await new Promise((r) => setTimeout(r, 20));
  const out = new Function('el', 'handle', 'states', 'holder', `return (${read});`)(el, handle, states, holder);
  handle.destroy();
  holder.remove();
  return out;
}, { cls, attrs, src, alt, wrap, read });

test('the shapes: square, photo, wide and any ratio; the picture fills the frame, cropped or fitted', async ({ page }) => {
  await open(page);
  const size = 'Math.round(el.getBoundingClientRect().height)';
  expect(await frame(page, { cls: 'ds-image--square' }, size)).toBe(320);
  expect(await frame(page, { cls: 'ds-image--photo' }, size)).toBe(240);
  expect(await frame(page, { cls: 'ds-image--wide' }, size)).toBe(180);
  expect(await frame(page, { attrs: 'style="--ds-image-ratio: 2 / 1"' }, size)).toBe(160);
  // Its own shape: 64 x 48 at 320px wide.
  expect(await frame(page, {}, size)).toBe(240);
  const fit = 'getComputedStyle(el.querySelector("img")).objectFit + " " + Math.round(el.querySelector("img").getBoundingClientRect().height)';
  expect(await frame(page, { cls: 'ds-image--square' }, fit)).toBe('cover 320');
  expect(await frame(page, { cls: 'ds-image--square ds-image--contain' }, fit)).toBe('contain 320');
});

test('states: loaded at once from a ready picture, a fade-in for one that arrives, the second source, then the fallback', async ({ page }) => {
  await open(page);
  // The demo's pictures are there: loaded, at full opacity.
  const shapes = page.locator('#fx-component .ds-image--square .ds-image__frame').first();
  await expect(shapes).toHaveAttribute('data-state', 'loaded');
  await expect.poll(() => shapes.locator('img').evaluate((img) => getComputedStyle(img).opacity)).toBe('1');
  // A broken one with a second source shows that source.
  await expect(page.locator('#fx-component [data-demo="second"]')).toHaveAttribute('data-state', 'loaded');
  // A broken one without: the fallback with the glyph and the alt text, the picture gone.
  const broken = page.locator('#fx-component [data-demo="broken"]');
  await expect(broken).toHaveAttribute('data-state', 'error');
  await expect(broken.locator('.ds-image__fallback')).toBeVisible();
  await expect(broken.locator('.ds-image__fallback')).toHaveText('Printer 7 by the window');
  await expect(broken.locator('img')).toBeHidden();
  expect(await broken.locator('.ds-image__fallback svg').getAttribute('aria-hidden')).toBe('true');
  // The order of the states, from set().
  expect(await frame(page, {}, 'states')).toEqual(['loading', 'loaded']);
  // An undecodable source may fail at once (Firefox): no loading first.
  expect((await frame(page, { src: BROKEN }, 'states')).filter((state) => state !== 'loading')).toEqual(['error']);
  expect(await frame(page, { src: BROKEN, attrs: `data-ds-image-fallback="${PICTURE}"` }, 'states')).toEqual(['loading', 'loaded']);
  // A decorative picture's fallback is hidden whole.
  expect(await frame(page, { src: BROKEN, alt: '' }, 'el.querySelector(".ds-image__fallback").getAttribute("aria-hidden")')).toBe('true');
});

test('a picture that arrives fades in over --ds-dur-medium; a new one fades out over --ds-dur-fast', async ({ page }) => {
  await open(page);
  const [inMs, outMs, medium, fast] = await page.evaluate(() => {
    const el = document.querySelector('[data-demo="swap"]');
    const img = el.querySelector('img');
    el.setAttribute('data-state', 'loading');
    const out = getComputedStyle(img).transitionDuration;
    el.setAttribute('data-state', 'loaded');
    const back = getComputedStyle(img).transitionDuration;
    const probe = document.createElement('span');
    probe.style.transitionDuration = 'var(--ds-dur-medium), var(--ds-dur-fast)';
    el.append(probe);
    const tokens = getComputedStyle(probe).transitionDuration.split(', ');
    probe.remove();
    return [back, out, ...tokens];
  });
  expect([inMs, outMs]).toEqual([medium, fast]);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('[data-demo="swap"] img')).transitionProperty)).toBe('opacity');
});

test('set() and a re-render with a new src start again; destroy() takes data-state and the written fallback away', async ({ page }) => {
  await open(page);
  const out = await page.evaluate(async (BROKEN) => {
    const el = document.querySelector('[data-demo="swap"]');
    const handle = window.DS.get(el, 'image');
    const seen = [];
    const off = handle.on('change', (detail) => seen.push(detail.state));
    const event = new Promise((done) => el.addEventListener('ds:change', (e) => done(e.detail.state), { once: true }));
    handle.set(BROKEN);
    const first = await event;
    // A re-render writes a working picture: loaded again, the fallback hidden.
    window.DS.dom.morphHtml(el, `<img src="${document.querySelector('.ds-image--square img').getAttribute('src')}" alt="Printer 7">`);
    for (let i = 0; i < 50 && handle.get().state !== 'loaded'; i += 1) await new Promise((r) => setTimeout(r, 20));
    off();
    return [first, seen, handle.get().state];
  }, BROKEN);
  expect(out[0]).toBe('error');
  expect(out[1].filter((state) => state !== 'loading')).toEqual(['error', 'loaded']);
  expect(out[2]).toBe('loaded');
  const after = await frame(page, { src: BROKEN }, '(handle.destroy(), [el.hasAttribute("data-state"), el.querySelector(".ds-image__fallback")])');
  expect(after).toEqual([false, null]);
});

test('options: shape squares the frame; density closes the gap to the caption; size changes nothing', async ({ page }) => {
  await open(page);
  expect(await frame(page, { cls: 'ds-image--square' }, 'parseFloat(getComputedStyle(el).borderTopLeftRadius)')).toBe(8);
  expect(await frame(page, { cls: 'ds-image--square', wrap: 'ds-shape-square' }, 'parseFloat(getComputedStyle(el).borderTopLeftRadius)')).toBe(0);
  expect(await frame(page, {}, 'parseFloat(getComputedStyle(el.parentElement).rowGap)')).toBe(8);
  expect(await frame(page, { wrap: 'ds-density-dense' }, 'parseFloat(getComputedStyle(el.parentElement).rowGap)')).toBe(6);
  expect(await frame(page, { cls: 'ds-image--square', wrap: 'ds-xl ds-touch' }, 'Math.round(el.getBoundingClientRect().height)')).toBe(320);
});

test('names: the alt text names the picture; the failed one is read from its fallback', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('img', { name: 'Laptop 0042', exact: true })).toHaveCount(1);
  await expect(page.locator('#fx-component [data-demo="broken"]')).toContainText('Printer 7 by the window');
  await expect(page.getByRole('figure').first()).toBeVisible();
});

test('forced colours: the frame keeps an edge, the fallback CanvasText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const [edge, ink, expected] = await page.locator('#fx-component [data-demo="broken"]').evaluate((el) => {
    const probe = document.createElement('span');
    probe.style.cssText = 'forced-color-adjust: none; color: CanvasText';
    document.body.append(probe);
    const out = [getComputedStyle(el).outlineColor, getComputedStyle(el.querySelector('.ds-image__fallback')).color, getComputedStyle(probe).color];
    probe.remove();
    return out;
  });
  expect(edge).toBe(expected);
  expect(ink).toBe(expected);
});
