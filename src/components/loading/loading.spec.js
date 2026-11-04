/**
 * Loading on the options model: the skeleton's bones at every size x density
 * x touch, their shape, the presets' layout, the wave and the pulse, no second
 * delay, the bar and the line's padding, roles and forced colours. Runs in
 * `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const BONES = ['ds-skeleton__line', 'ds-skeleton__field', 'ds-skeleton__avatar', 'ds-skeleton__media'];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=loading');
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

const height = 'el.getBoundingClientRect().height';

test('a bone at every size x density x touch: a line 2px per step, a field like a control, an avatar 8px per step', async ({ page }) => {
  await open(page);
  for (const touch of [false, true]) {
    for (const [density, densityStep] of DENSITIES) {
      for (const [size, sizeStep] of SIZES) {
        const around = `class="${density}${touch ? ' ds-touch' : ''} ${size}"`;
        const name = `${size} ${density}${touch ? ' touch' : ''}`;
        expect(await probe(page, `<div ${around}><span id="probe" class="ds-skeleton__line"></span></div>`, height), `${name} line`).toBe(12 + sizeStep * 2);
        expect(await probe(page, `<div ${around}><span id="probe" class="ds-skeleton__avatar"></span></div>`, height), `${name} avatar`).toBe(40 + sizeStep * 8);
        // The input's hook is this bone's base as it is the field's, whatever .ds-touch does to it.
        const base = await probe(page, `<div ${around}><span id="probe" class="ds-skeleton__field"></span></div>`, `parseFloat(style.getPropertyValue('--ds-input-height')) || 40`);
        expect(await probe(page, `<div ${around}><span id="probe" class="ds-skeleton__field"></span></div>`, height), `${name} field`).toBe(Math.max(touch ? 48 : 0, base + sizeStep * 8 + densityStep * 4));
        expect(await probe(page, `<div ${around}><div class="ds-skeleton__table"><div id="probe" class="ds-skeleton__cells"></div></div></div>`, height), `${name} row`).toBe(Math.max(touch ? 48 : 0, 52 + sizeStep * 8 + densityStep * 4));
        expect(await probe(page, `<div ${around}><div class="ds-skeleton__table"><div id="probe" class="ds-skeleton__cells ds-skeleton__cells--head"></div></div></div>`, height), `${name} head`).toBe(Math.max(touch ? 48 : 0, 48 + sizeStep * 8 + densityStep * 4));
      }
    }
  }
  // 2.x's bones at md.
  expect(await probe(page, '<span id="probe" class="ds-skeleton__line ds-skeleton__line--heading"></span>', height)).toBe(28);
  expect(await probe(page, '<span id="probe" class="ds-skeleton__line ds-skeleton__line--title"></span>', height)).toBe(16);
});

test('a bone reads the hook of what it stands for, as a theme sets it', async ({ page }) => {
  await open(page);
  expect(await probe(page, '<div style="--ds-input-height: 44px"><span id="probe" class="ds-skeleton__field"></span></div>', height)).toBe(44);
  expect(await probe(page, '<div style="--ds-table-row-height: 60px"><div id="probe" class="ds-skeleton__cells"></div></div>', height)).toBe(60);
  expect(await probe(page, '<div style="--ds-table-head-height: 36px"><div id="probe" class="ds-skeleton__cells ds-skeleton__cells--head"></div></div>', height)).toBe(36);
});

test('a bone is as high as the real control, at the default, under a theme\'s hook, and under compact once the owner is on the options model', async ({ page }) => {
  await open(page);
  const input = '<input id="probe" class="ds-input" aria-label="x">';
  const field = '<span id="probe" class="ds-skeleton__field"></span>';
  const row = '<div id="probe" class="ds-skeleton__cells"></div>';
  // A cell's row, in a table: the box the bone's row stands in for.
  const real = '<table class="ds-table"><tbody><tr id="probe"><td>x</td></tr></tbody></table>';
  const compare = async (around, label) => {
    expect(await probe(page, `<div ${around}>${field}</div>`, height), `${label} field`).toBe(await probe(page, `<div ${around}>${input}</div>`, height));
    expect(await probe(page, `<div ${around}>${row}</div>`, height), `${label} row`).toBe(await probe(page, `<div ${around}>${real}</div>`, height));
  };
  await compare('', 'default');
  await compare('style="--ds-input-height: 44px; --ds-table-row-height: 60px"', 'hooks');
  // Form and table reach this branch's parent on the options model in their own
  // branches: until then density does not move them, and the comparison waits.
  const ported = await probe(page, `<div class="ds-density-dense">${input}</div>`, height) !== await probe(page, input, height)
    && await probe(page, `<div class="ds-density-dense">${real}</div>`, height) !== await probe(page, real, height);
  if (ported) {
    await page.addStyleTag({ url: '/dist/themes/compact.css' });
    await compare('', 'compact');
  }
});

test('shape: a bone\'s radius times --ds-shape, at most half its height; the avatar round; a card\'s corners', async ({ page }) => {
  await open(page);
  const radius = 'parseFloat(style.borderTopLeftRadius)';
  for (const [shape, line, heading, card] of [['ds-shape-square', 0, 0, 0], ['ds-shape-soft', 3, 4, 6], ['ds-shape-default', 6, 8, 12], ['ds-shape-round', 6, 12, 18]]) {
    expect(await probe(page, `<div class="${shape}"><span id="probe" class="ds-skeleton__line"></span></div>`, radius), `${shape} line`).toBe(line);
    expect(await probe(page, `<div class="${shape}"><span id="probe" class="ds-skeleton__line ds-skeleton__line--heading"></span></div>`, radius), `${shape} heading`).toBe(heading);
    expect(await probe(page, `<div class="${shape}"><div id="probe" class="ds-skeleton__card"></div></div>`, radius), `${shape} card`).toBe(card);
  }
  expect(await probe(page, '<div class="ds-shape-square"><span id="probe" class="ds-skeleton__avatar"></span></div>', 'style.borderTopLeftRadius')).toBe('50%');
  // The clip follows the corners, or the band would show past them.
  expect(await probe(page, '<div class="ds-shape-square"><span id="probe" class="ds-skeleton__line"></span></div>', 'style.clipPath')).toMatch(/inset\(0(px)?( round 0(px)?)?\)/);
  expect(await probe(page, '<span id="probe" class="ds-skeleton__line" style="--ds-skeleton-radius: 2px"></span>', radius)).toBe(2);
});

test('the presets lay out: a list row, a table\'s cells, a form, a media\'s ratio', async ({ page }) => {
  await open(page);
  const row = await probe(page, '<div id="probe" class="ds-skeleton__row"><span class="ds-skeleton__avatar"></span><span class="ds-skeleton__lines"><span class="ds-skeleton__line"></span></span><span class="ds-skeleton__line"></span></div>', `(() => {
    const [avatar, lines, meta] = [...el.children].map((child) => child.getBoundingClientRect());
    return { row: avatar.right < lines.left && lines.right < meta.left, height: el.getBoundingClientRect().height, meta: meta.width };
  })()`);
  expect(row).toEqual({ row: true, height: 64, meta: 64 });
  const cells = await probe(page, '<div class="ds-skeleton__table"><div id="probe" class="ds-skeleton__cells"><span class="ds-skeleton__line"></span><span class="ds-skeleton__line"></span></div></div>', '[el.getBoundingClientRect().height, Math.round(el.children[0].getBoundingClientRect().width) === Math.round(el.children[1].getBoundingClientRect().width), style.borderBottomStyle]');
  expect(cells[0]).toBe(52);
  expect(cells.slice(1)).toEqual([true, 'solid']);
  expect(await probe(page, '<div class="ds-skeleton__table"><div id="probe" class="ds-skeleton__cells ds-skeleton__cells--head"></div></div>', height)).toBe(48);
  expect(await probe(page, '<span id="probe" class="ds-skeleton__media"></span>', 'Math.round(el.getBoundingClientRect().width / el.getBoundingClientRect().height * 100)')).toBe(178);
  expect(await probe(page, '<span id="probe" class="ds-skeleton__media" style="--ds-skeleton-media-ratio: 1 / 1"></span>', 'el.getBoundingClientRect().width === el.getBoundingClientRect().height')).toBe(true);
  const presets = await page.$$eval('[data-demo="presets"] .ds-skeleton', (all) => all.length);
  expect(presets).toBe(6);
});

test('the wave and the pulse: one band on every bone, or each bone breathing on the loop token, no second delay', async ({ page }) => {
  await open(page);
  for (const bone of BONES) {
    const wave = await probe(page, `<div class="ds-skeleton"><span id="probe" class="${bone}"></span></div>`, 'getComputedStyle(el, "::after").position');
    expect(wave, bone).toBe('fixed');
    const pulse = await probe(page, `<div class="ds-skeleton ds-skeleton--pulse"><span id="probe" class="${bone}"></span></div>`, '(() => { const after = getComputedStyle(el, "::after"); return [after.position, after.animationName, after.animationDirection, after.animationIterationCount, after.backgroundImage]; })()');
    expect(pulse, `${bone} pulse`).toEqual(['absolute', 'ds-fade-in', 'alternate', 'infinite', 'none']);
  }
  expect(await probe(page, '<div id="probe" class="ds-skeleton"></div>', 'style.animationName')).toBe('ds-fade-in, ds-skeleton-wave');
  expect(await probe(page, '<div id="probe" class="ds-skeleton ds-skeleton--pulse"></div>', 'style.animationName')).toBe('ds-fade-in');
  // A bone alone runs the wave itself.
  expect(await probe(page, '<span id="probe" class="ds-skeleton__avatar"></span>', 'style.animationName')).toBe('ds-skeleton-wave');
});

test('density: the line, a card and a surface\'s gap; type stays', async ({ page }) => {
  await open(page);
  for (const [density, step] of DENSITIES) {
    const around = `class="${density}"`;
    expect(await probe(page, `<div ${around}><div id="probe" class="ds-loading">Loading</div></div>`, '[parseFloat(style.paddingBlockStart), parseFloat(style.fontSize)]'), density).toEqual([16 + step * 2, 14]);
    expect(await probe(page, `<div ${around}><div id="probe" class="ds-skeleton__card"></div></div>`, 'parseFloat(style.paddingBlockStart)'), density).toBe(24 + step * 2);
    expect(await probe(page, `<div ${around}><div id="probe" class="ds-skeleton"></div></div>`, 'parseFloat(style.rowGap)'), density).toBe(16 + step * 2);
  }
});

test('roles and keyboard: every surface and line says its words in role="status"; nothing is a stop', async ({ page }) => {
  await open(page);
  const surfaces = await page.$$eval('#fx-component .ds-skeleton, #fx-component .ds-loading', (all) => all.map((el) => [el.getAttribute('role'), el.textContent.trim().length > 1, el.tabIndex]));
  expect(surfaces.length).toBeGreaterThan(7);
  for (const entry of surfaces) expect(entry).toEqual(['status', true, -1]);
  // The demo's buttons work by keyboard: the page gives way to its content.
  const button = page.locator('[data-demo="page-load"]');
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-demo="page"] .ds-skeleton')).toHaveCount(0);
  await expect(page.locator('[data-demo="page"]')).toContainText('1,284 devices');
});

test('forced colours: bones get an edge and no band, the bar paints Highlight', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  for (const bone of BONES) {
    expect(await probe(page, `<div class="ds-skeleton"><span id="probe" class="${bone}"></span></div>`, '[style.outlineStyle, style.clipPath, getComputedStyle(el, "::after").content]'), bone).toEqual(['solid', 'none', 'none']);
  }
  const highlight = await page.evaluate(() => {
    const el = document.createElement('span');
    el.style.color = 'Highlight';
    el.style.forcedColorAdjust = 'none';
    document.body.append(el);
    const colour = getComputedStyle(el).color;
    el.remove();
    return colour;
  });
  expect(await probe(page, '<span class="ds-loadbar"><span id="probe" class="ds-loadbar__bar"></span></span>', 'style.backgroundColor')).toBe(highlight);
});
