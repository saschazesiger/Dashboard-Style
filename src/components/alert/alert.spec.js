/**
 * The alert on the options model: its padding at every size x density, touch
 * on its buttons and the errors summary, the shape, tones from the class on
 * the alert only, the deprecated kinds, the inline and the section variant,
 * buttons centred on the first line, the demo's keyboard and flip, forced
 * colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=alert');
  await ready(page);
}

const probe = (page, html, read) => page.evaluate(({ html, read }) => {
  document.querySelector('#fx-component').insertAdjacentHTML('beforeend', `<div class="probe" style="max-width:640px">${html}</div>`);
  const holder = document.querySelector('#fx-component > .probe:last-child');
  const el = holder.querySelector('#probe');
  el.removeAttribute('id');
  const style = getComputedStyle(el);
  const out = new Function('el', 'style', `return (${read});`)(el, style);
  holder.remove();
  return out;
}, { html, read });

const alert = (cls) => `<div id="probe" class="ds-alert ${cls}"><span class="ds-alert__text">Words</span></div>`;
const look = '[style.backgroundColor, style.color]';

test('the padding at every size x density: 2px per step of each; type stays; touch leaves the box alone', async ({ page }) => {
  await open(page);
  const read = '[parseFloat(style.paddingBlockStart), parseFloat(style.paddingInlineStart), parseFloat(style.fontSize)]';
  for (const touch of [false, true]) {
    for (const [density, densityStep] of DENSITIES) {
      for (const [size, sizeStep] of SIZES) {
        const at = (12 + sizeStep * 2 + densityStep * 2);
        expect(await probe(page, `<div class="${density}${touch ? ' ds-touch' : ''}">${alert(size)}</div>`, read), `${size} ${density}`).toEqual([at, at + 4, 14]);
      }
    }
  }
});

test('touch: its button and the errors summary reach the target; a button hangs centred on the first line', async ({ page }) => {
  await open(page);
  const html = (cls) => `<div class="${cls}"><div class="ds-alert">
    <svg width="20" height="20"></svg><span class="ds-alert__text" id="line">Words</span>
    <button id="probe" class="ds-btn ds-btn--text ds-sm" type="button">Act</button></div></div>`;
  const offset = '(() => { const text = el.parentElement.querySelector(".ds-alert__text").getBoundingClientRect(); const box = el.getBoundingClientRect(); return [box.height, (box.top + box.bottom) / 2 - (text.top + text.bottom) / 2]; })()';
  const plain = await probe(page, html(''), offset);
  expect(plain[0]).toBe(32);
  expect(Math.abs(plain[1])).toBeLessThan(0.51);
  const touched = await probe(page, html('ds-touch'), offset);
  expect(touched[0]).toBe(48);
  expect(Math.abs(touched[1])).toBeLessThan(0.51);
  // In an actions row of small buttons too (the row reads the buttons' own size).
  const row = await probe(page, `<div class="ds-alert"><span class="ds-alert__text">Words</span><div class="ds-alert__actions"><button id="probe" class="ds-btn ds-btn--text ds-sm" type="button">Act</button></div></div>`,
    '(() => { const text = el.closest(".ds-alert").querySelector(".ds-alert__text").getBoundingClientRect(); const box = el.getBoundingClientRect(); return (box.top + box.bottom) / 2 - (text.top + text.bottom) / 2; })()');
  expect(Math.abs(row)).toBeLessThan(0.51);
  const summary = await probe(page, '<details class="ds-errors ds-touch"><summary id="probe">2 errors</summary><ul><li>Row</li></ul></details>', 'el.getBoundingClientRect().height');
  expect(summary).toBe(48);
});

test('shape: the corners times --ds-shape; --plain and --inline have none', async ({ page }) => {
  await open(page);
  const radius = 'parseFloat(style.borderTopLeftRadius)';
  for (const [shape, value] of [['ds-shape-square', 0], ['ds-shape-soft', 6], ['ds-shape-default', 12], ['ds-shape-round', 18]]) {
    expect(await probe(page, `<div class="${shape}">${alert('')}</div>`, radius), shape).toBe(value);
    expect(await probe(page, `<div class="${shape}">${alert('ds-alert--plain')}</div>`, radius)).toBe(0);
    expect(await probe(page, `<div class="${shape}">${alert('ds-alert--inline')}</div>`, radius)).toBe(0);
  }
});

test('tones: from the class on the alert; an inherited one changes nothing; the deprecated kinds match', async ({ page }) => {
  await open(page);
  const c = await page.evaluate(() => {
    const read = (value) => {
      const el = document.createElement('span');
      el.style.color = value;
      document.body.append(el);
      const colour = getComputedStyle(el).color;
      el.remove();
      return colour;
    };
    return { infoBg: read('var(--ds-info-container)'), infoInk: read('var(--ds-on-info-container)'), warningBg: read('var(--ds-warning-surface)'), text: read('var(--ds-text)') };
  });
  expect(await probe(page, alert('ds-tone-info'), look)).toEqual([c.infoBg, c.infoInk]);
  // Warning keeps its quieter surface and body ink, as 2.x.
  expect(await probe(page, alert('ds-tone-warning'), look)).toEqual([c.warningBg, c.text]);
  expect(await probe(page, `<div class="ds-tone-error">${alert('')}</div>`, look)).toEqual(await probe(page, alert(''), look));
  for (const kind of ['success', 'warning', 'error']) {
    expect(await probe(page, alert(`ds-alert--${kind}`), look), kind).toEqual(await probe(page, alert(`ds-tone-${kind}`), look));
  }
});

test('the error tone sets its buttons\' ink; a hook on the element still wins over a tone', async ({ page }) => {
  await open(page);
  const ink = await probe(page, `<div class="ds-alert ds-tone-error"><span class="ds-alert__text">Words</span><button id="probe" class="ds-btn ds-btn--text" type="button">Act</button></div>`, 'style.color');
  expect(ink).toBe(await probe(page, `<div class="ds-alert ds-alert--error"><span class="ds-alert__text">Words</span><button id="probe" class="ds-btn ds-btn--text" type="button">Act</button></div>`, 'style.color'));
  expect(await probe(page, alert('ds-tone-error" style="--ds-alert-bg: rgb(1, 2, 3)'), 'style.backgroundColor')).toBe('rgb(1, 2, 3)');
  // A filled button keeps the ink of its own fill, or its label would vanish.
  const filled = (cls) => `<div class="ds-alert ${cls}"><span class="ds-alert__text">Words</span><button id="probe" class="ds-btn ds-btn--filled" type="button">Act</button></div>`;
  expect(await probe(page, filled('ds-tone-error'), 'style.color')).toBe(await probe(page, filled(''), 'style.color'));
});

test('inline: no box, whatever the tone, size, density or shape; the icon keeps the tone', async ({ page }) => {
  await open(page);
  const read = '[style.backgroundColor, parseFloat(style.paddingBlockStart), parseFloat(style.paddingInlineStart), parseFloat(style.fontSize), style.display]';
  expect(await probe(page, alert('ds-alert--inline ds-tone-error ds-lg'), read)).toEqual(['rgba(0, 0, 0, 0)', 0, 0, 12, 'inline-flex']);
  const icon = await probe(page, `<p class="ds-alert ds-alert--inline ds-tone-error"><svg id="probe" width="16" height="16"></svg><span class="ds-alert__text">Words</span></p>`, 'style.color');
  expect(icon).toBe(await page.evaluate(() => {
    const el = document.createElement('span');
    el.style.color = 'var(--ds-error)';
    document.body.append(el);
    const colour = getComputedStyle(el).color;
    el.remove();
    return colour;
  }));
});

test('section: its actions always under the text, in the text\'s column; the subtitle type on the title', async ({ page }) => {
  await open(page);
  const out = await probe(page, `<div id="probe" class="ds-alert ds-alert--section ds-tone-error"><svg width="20" height="20"></svg><div class="ds-alert__text"><p class="ds-alert__title">Title</p><p>Words</p></div>
    <div class="ds-alert__actions"><button class="ds-btn ds-btn--filled" type="button">Open</button></div></div>`, `(() => {
      const text = el.querySelector('.ds-alert__text').getBoundingClientRect();
      const actions = el.querySelector('.ds-alert__actions').getBoundingClientRect();
      const title = getComputedStyle(el.querySelector('.ds-alert__title'));
      return { below: actions.top >= text.bottom, column: Math.round(actions.left - text.left), font: parseFloat(title.fontSize), padding: parseFloat(style.paddingBlockStart) };
    })()`);
  expect(out).toEqual({ below: true, column: 0, font: 16, padding: 16 });
});

test('the demo: Tab reaches the buttons and the summary; Enter opens the list; dismiss and insert go through flip', async ({ page }) => {
  await open(page);
  const summary = page.locator('.ds-errors summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.ds-errors')).toHaveAttribute('open', '');
  await expect(summary).toHaveCSS('outline-style', /solid|auto/);
  const stack = page.locator('[data-demo="stack"] > .ds-alert');
  const before = await stack.count();
  await page.locator('[data-demo="insert"]').click();
  await expect(stack).toHaveCount(before + 1);
  await page.locator('[data-demo="dismiss"]').first().click();
  await expect(stack).toHaveCount(before, { timeout: 5000 });
  // Every alert of the demo has an icon and a word.
  const parts = await page.$$eval('#fx-component .ds-alert', (all) => all.map((el) => Boolean(el.querySelector('svg')) && el.textContent.trim().length > 1));
  expect(parts.every(Boolean)).toBe(true);
});

test('forced colours: a transparent outline is the edge of a box; none on --plain and --inline; a tone changes nothing', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  expect(await probe(page, alert('ds-tone-error'), 'style.outlineStyle')).toBe('solid');
  expect(await probe(page, alert('ds-alert--section'), 'style.outlineStyle')).toBe('solid');
  expect(await probe(page, alert('ds-alert--plain'), 'style.outlineStyle')).toBe('none');
  expect(await probe(page, alert('ds-alert--inline'), 'style.outlineStyle')).toBe('none');
  expect(await probe(page, alert('ds-tone-error'), look)).toEqual(await probe(page, alert('ds-tone-success'), look));
});
