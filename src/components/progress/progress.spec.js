/**
 * Progress on the options model: the track at every size (touch changes
 * nothing), the label's distance at every density and its places, shape, tones
 * from the class on the element only, the hooks over a tone, names and values,
 * forced colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', 1], ['ds-sm', 2], ['ds-md', 4], ['ds-lg', 6], ['ds-xl', 8]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=progress');
  await ready(page);
}

const probe = (page, html, read) => page.evaluate(({ html, read }) => {
  document.querySelector('#fx-component').insertAdjacentHTML('beforeend', `<div class="probe" style="width:480px">${html}</div>`);
  const holder = document.querySelector('#fx-component > .probe:last-child');
  const el = holder.querySelector('#probe');
  el.removeAttribute('id');
  const style = getComputedStyle(el);
  const out = new Function('el', 'style', `return (${read});`)(el, style);
  holder.remove();
  return out;
}, { html, read });

const bar = (cls, label = '40%', extra = '') => `<div id="probe" class="ds-progress ${cls}" style="--ds-progress:.4;${extra}"><div class="ds-progress__track" role="progressbar" aria-label="Import" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40"><div class="ds-progress__bar"></div></div><p class="ds-progress__label">${label}</p><p class="ds-progress__detail">812 of 2,030 rows</p></div>`;
const track = (read) => `(() => { const part = el.querySelector(".ds-progress__track"); const style = getComputedStyle(part); return ${read}; })()`;

test('the track at every size; the bar\'s box follows it (a wave reaches 3/4 of it out); density and touch leave it', async ({ page }) => {
  await open(page);
  for (const touch of [false, true]) {
    for (const [density] of DENSITIES) {
      for (const [size, thick] of SIZES) {
        const out = await probe(page, `<div class="${density}${touch ? ' ds-touch' : ''}">${bar(size)}</div>`, track('[part.getBoundingClientRect().height, part.querySelector(".ds-progress__bar").getBoundingClientRect().height]'));
        expect(out, `${size} ${density} ${touch}`).toEqual([thick, thick * 2.5]);
      }
    }
  }
  expect(await probe(page, bar(''), track('part.getBoundingClientRect().height'))).toBe(4);
  expect(await probe(page, bar('', '40%', '--ds-progress-height: 10px'), track('part.getBoundingClientRect().height'))).toBe(10);
  // Type stays.
  expect(await probe(page, bar('ds-xl'), 'parseFloat(getComputedStyle(el.querySelector(".ds-progress__label")).fontSize)')).toBe(14);
});

test('the label\'s distance at every density; its places: above, at the end', async ({ page }) => {
  await open(page);
  for (const [density, step] of DENSITIES) {
    expect(await probe(page, `<div class="${density}">${bar('')}</div>`, 'parseFloat(getComputedStyle(el.querySelector(".ds-progress__label")).marginTop)'), density).toBe(8 + step * 2);
  }
  const places = `(() => {
    const [t, l, d] = ['.ds-progress__track', '.ds-progress__label', '.ds-progress__detail'].map((selector) => el.querySelector(selector).getBoundingClientRect());
    return { above: l.bottom <= t.top, under: l.top >= t.bottom, atEnd: l.left >= t.right && Math.round((l.top + l.bottom) / 2) === Math.round((t.top + t.bottom) / 2), detailUnder: d.top >= t.bottom + 3 };
  })()`;
  expect(await probe(page, bar(''), places)).toEqual({ above: false, under: true, atEnd: false, detailUnder: true });
  expect(await probe(page, bar('ds-progress--label-above'), places)).toEqual({ above: true, under: false, atEnd: false, detailUnder: true });
  expect(await probe(page, bar('ds-progress--label-end'), places)).toEqual({ above: false, under: false, atEnd: true, detailUnder: true });
});

test('shape: the ends times --ds-shape; a square has no round caps', async ({ page }) => {
  await open(page);
  for (const [shape, value] of [['ds-shape-square', 0], ['ds-shape-soft', 2], ['ds-shape-default', 2], ['ds-shape-round', 2]]) {
    expect(await probe(page, `<div class="${shape}">${bar('')}</div>`, track('parseFloat(style.borderTopLeftRadius)')), shape).toBe(value);
  }
  expect(await probe(page, '<div class="ds-shape-soft ds-xl">' + bar('') + '</div>', track('parseFloat(style.borderTopLeftRadius)'))).toBe(4);
  expect(await probe(page, '<div class="ds-shape-square">' + bar('') + '</div>', track('getComputedStyle(part.querySelector(".ds-progress__bar")).clipPath'))).not.toMatch(/round [1-9]/);
});

test('tones: from the class on .ds-progress; an inherited one changes nothing; a hook wins over a tone', async ({ page }) => {
  await open(page);
  const roles = await page.evaluate(() => {
    const read = (value) => {
      const el = document.createElement('span');
      el.style.color = value;
      document.body.append(el);
      const colour = getComputedStyle(el).color;
      el.remove();
      return colour;
    };
    return { error: read('var(--ds-error)'), primary: read('var(--ds-primary)') };
  });
  const fill = track('getComputedStyle(part.querySelector(".ds-progress__bar"), "::after").backgroundColor');
  expect(await probe(page, bar(''), fill)).toBe(roles.primary);
  expect(await probe(page, bar('ds-tone-error'), fill)).toBe(roles.error);
  expect(await probe(page, `<div class="ds-tone-error">${bar('')}</div>`, fill)).toBe(roles.primary);
  expect(await probe(page, bar('ds-tone-error', '40%', '--ds-progress-bar: rgb(1, 2, 3)'), fill)).toBe('rgb(1, 2, 3)');
  // The segments of an unknown share take the tone too.
  expect(await probe(page, bar('ds-tone-error ds-progress--indeterminate'), track('getComputedStyle(part, "::before").backgroundColor'))).toBe(roles.error);
});

test('names and values: the demo\'s tracks are named progressbars; an unknown share has a text instead of a value; none is a stop', async ({ page }) => {
  await open(page);
  const bars = await page.$$eval('#fx-component .ds-progress__track', (all) => all.map((el) => ({ role: el.getAttribute('role'), name: el.getAttribute('aria-label'), now: el.getAttribute('aria-valuenow'), text: el.getAttribute('aria-valuetext'), tab: el.tabIndex })));
  expect(bars.length).toBeGreaterThan(8);
  for (const entry of bars) {
    expect(entry.role).toBe('progressbar');
    expect(entry.name.length).toBeGreaterThan(1);
    expect(entry.now !== null || entry.text !== null, entry.name).toBe(true);
    expect(entry.tab).toBe(-1);
  }
  const run = page.locator('[data-demo="run-holder"] .ds-progress');
  await page.locator('[data-demo="run"]').focus();
  await page.keyboard.press('Enter');
  await expect(run).toHaveClass(/ds-progress--waiting/);
  await expect(run.locator('.ds-progress__track')).toHaveAttribute('aria-valuetext', 'Waiting');
  await expect(run.locator('.ds-progress__track')).toHaveAttribute('aria-valuenow', '30', { timeout: 10000 });
});

test('forced colours: Highlight for the bar, GrayText for the track and an edge, in any tone', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const system = await page.evaluate(() => {
    const el = document.createElement('span');
    el.style.color = 'Highlight';
    el.style.forcedColorAdjust = 'none';
    document.body.append(el);
    const colour = getComputedStyle(el).color;
    el.remove();
    return colour;
  });
  for (const cls of ['', 'ds-tone-error']) {
    const [fill, adjust, outline] = await probe(page, bar(cls), track('[getComputedStyle(part.querySelector(".ds-progress__bar"), "::after").backgroundColor, style.forcedColorAdjust, style.outlineStyle]'));
    expect([fill, adjust, outline], cls || 'default').toEqual([system, 'none', 'solid']);
  }
});
