/**
 * The spinner on the options model: the arc and the ring at every size
 * (density and touch change nothing), the ring's width, --ink, the deprecated
 * --sm, tones on the spinner only, the transition inside .ds-progress, the
 * names of the demo's rings, forced colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', 10, 24], ['ds-sm', 12, 32], ['ds-md', 16, 40], ['ds-lg', 20, 48], ['ds-xl', 24, 56]];
const DENSITIES = ['ds-density-comfortable', 'ds-density-compact', 'ds-density-dense', 'ds-density-tight'];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=spinner');
  await ready(page);
}

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

const box = '[el.getBoundingClientRect().width, el.getBoundingClientRect().height]';
const hook = (name) => `style.getPropertyValue("${name}").trim()`;

test('the size at every step; density and touch change nothing', async ({ page }) => {
  await open(page);
  for (const touch of [false, true]) {
    for (const density of DENSITIES) {
      for (const [size, arc, ring] of SIZES) {
        const around = `class="${density}${touch ? ' ds-touch' : ''}"`;
        expect(await probe(page, `<div ${around}><span id="probe" class="ds-spinner ${size}"></span></div>`, box), `${size} ${density}`).toEqual([arc, arc]);
        expect(await probe(page, `<div ${around}><span id="probe" class="ds-spinner ds-spinner--determinate ${size}" style="--ds-progress:.4"></span></div>`, box), `${size} ${density} ring`).toEqual([ring, ring]);
      }
    }
  }
  expect(await probe(page, '<span id="probe" class="ds-spinner"></span>', box)).toEqual([16, 16]);
  expect(await probe(page, '<span id="probe" class="ds-spinner ds-spinner--determinate"></span>', box)).toEqual([40, 40]);
});

test('the ring\'s width follows its size; the hook sets one; shape leaves both round', async ({ page }) => {
  await open(page);
  const inner = (cls, extra = '') => `<span id="probe" class="ds-spinner ds-spinner--determinate ${cls}" style="--ds-progress:.4;${extra}"></span>`;
  // The width resolves in the mask of ::after: read the computed custom property's own expression through a child that uses it.
  const width = 'parseFloat(getComputedStyle(el.appendChild(Object.assign(document.createElement("i"), { style: "display:block;width:var(--ds-spinner-width)" }))).width)';
  expect(await probe(page, inner(''), width)).toBe(4);
  expect(await probe(page, inner('ds-xl'), width)).toBeCloseTo(5.6, 1);
  expect(await probe(page, inner('', '--ds-spinner-determinate-width:2px'), width)).toBe(2);
  expect(await probe(page, `<div class="ds-shape-square"><span id="probe" class="ds-spinner"></span></div>`, 'style.borderTopLeftRadius')).toBe('50%');
});

test('--ink takes the text colour on a faint ring, at any size; the deprecated --sm keeps a fixed 12px', async ({ page }) => {
  await open(page);
  const ink = `<span id="probe" class="ds-spinner ds-spinner--ink ds-lg"></span>`;
  expect(await probe(page, ink, hook('--ds-spinner-color'))).toBe('currentColor');
  expect(await probe(page, ink, box)).toEqual([20, 20]);
  expect(await probe(page, '<span id="probe" class="ds-spinner ds-spinner--ink ds-sm"></span>', box)).toEqual([12, 12]);
  expect(await probe(page, '<div class="ds-lg"><span id="probe" class="ds-spinner ds-spinner--sm"></span></div>', box)).toEqual([12, 12]);
  expect(await probe(page, '<span id="probe" class="ds-spinner ds-spinner--sm"></span>', hook('--ds-spinner-color'))).toBe('currentColor');
});

test('tones: from the class on the spinner; an inherited one changes nothing; the arc turns only without a share', async ({ page }) => {
  await open(page);
  expect(await probe(page, '<span id="probe" class="ds-spinner ds-tone-error"></span>', hook('--ds-spinner-color'))).toBe('var(--ds-tone)'.length ? await probe(page, '<span id="probe" class="ds-tone-error"></span>', hook('--ds-tone')) : '');
  const track = await probe(page, '<span id="probe" class="ds-spinner ds-spinner--determinate ds-tone-error"></span>', hook('--ds-spinner-track'));
  expect(track).toBe(await probe(page, '<span id="probe" class="ds-tone-error"></span>', hook('--ds-tone-container')));
  expect(await probe(page, '<div class="ds-tone-error"><span id="probe" class="ds-spinner"></span></div>', hook('--ds-spinner-color'))).toBe('');
  expect(await probe(page, '<span id="probe" class="ds-spinner"></span>', 'style.animationName')).toBe('ds-spinner-arc, ds-spin');
  expect(await probe(page, '<span id="probe" class="ds-spinner ds-spinner--determinate"></span>', 'style.animationName')).toBe('none');
});

test('a ring in .ds-progress reads its share and has no transition of its own; alone it glides', async ({ page }) => {
  await open(page);
  const nested = '<div class="ds-progress" style="--ds-progress:.25"><span id="probe" class="ds-spinner ds-spinner--determinate"></span></div>';
  expect(await probe(page, nested, 'style.transitionDuration')).toBe('0s');
  expect(await probe(page, nested, 'Number(style.getPropertyValue("--ds-progress"))')).toBe(0.25);
  expect(await probe(page, '<span id="probe" class="ds-spinner ds-spinner--determinate"></span>', 'style.transitionProperty')).toBe('--ds-progress');
});

test('names and keyboard: a ring is a named progressbar, the arc hidden; neither is a stop', async ({ page }) => {
  await open(page);
  const rings = page.locator('[data-demo="rings"] [role="progressbar"]');
  await expect(rings).toHaveCount(4);
  await expect(rings.first()).toHaveAccessibleName('Upload 5%');
  await expect(rings.nth(1)).toHaveAttribute('aria-valuenow', '40');
  const stops = await page.$$eval('#fx-component .ds-spinner', (all) => all.every((el) => el.tabIndex < 0));
  expect(stops).toBe(true);
  // The Advance button by keyboard moves every ring through DS.dom.progress.
  await page.locator('[data-demo="advance"]').focus();
  await page.keyboard.press('Enter');
  await expect(rings.nth(1)).toHaveAttribute('aria-valuenow', '60');
});

test('forced colours: the arc Highlight and the track GrayText, in any tone', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  for (const cls of ['', 'ds-tone-error', 'ds-spinner--ink']) {
    const [color, track] = await probe(page, `<span id="probe" class="ds-spinner ${cls}"></span>`, '[style.getPropertyValue("--ds-spinner-color").trim(), style.getPropertyValue("--ds-spinner-track").trim()]');
    expect([color.toLowerCase(), track.toLowerCase()], cls || 'default').toEqual(['highlight', 'graytext']);
  }
});
