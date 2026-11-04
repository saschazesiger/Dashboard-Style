/**
 * Form on the options model (3.0): the height of a field, an input group, the
 * inset box and a .ds-check row at every size x density, with and without
 * .ds-touch (touch wins, as a minimum); field text at 16px on phones at every
 * size; the shape on fields, the search pill, checkboxes and cards; the three
 * looks; the slots; warning, success, read-only; checkbox cards (no halo, the
 * card's ring, the ripple, the press morph); fieldset and form section;
 * keyboard, names and forced colours. The 2.x behaviour stays in forms.spec.js
 * and controls.spec.js. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=form');
  await ready(page);
  await page.mouse.move(1, 1);
}

/** Appends markup to the page's theme and returns nothing; tests read it by id. */
const add = (page, html) => page.evaluate((markup) => {
  const host = document.createElement('div');
  host.id = 'fx-added';
  host.insertAdjacentHTML('beforeend', markup);
  document.querySelector('#fx-component').prepend(host);
}, html);

const style = (page, selector, pseudo) => page.$eval(selector, (el, which) => {
  const css = getComputedStyle(el, which || undefined);
  const rect = el.getBoundingClientRect();
  return { width: rect.width, height: rect.height, radius: parseFloat(css.borderTopLeftRadius), borderTop: css.borderTopColor, borderWidth: parseFloat(css.borderTopWidth), background: css.backgroundColor, color: css.color, font: parseFloat(css.fontSize), weight: css.fontWeight, shadow: css.boxShadow, padStart: parseFloat(css.paddingInlineStart), outline: css.outlineStyle, cursor: css.cursor, line: parseFloat(css.lineHeight), opacity: css.opacity, direction: css.gridTemplateColumns };
}, pseudo);

/** A colour role as the engine serialises it on a probe. */
const role = (page, value) => page.evaluate((css) => {
  const probe = document.createElement('span');
  probe.style.color = css;
  document.querySelector('.ds-theme').append(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
}, value);

test('the height at every size x density, and .ds-touch as a minimum over both', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const main = document.querySelector('#fx-component');
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const region = document.createElement('div');
          region.className = `${density} ${size}${touch ? ' ds-touch' : ''}`;
          region.innerHTML = '<input class="ds-input" aria-label="Field" data-kind="input">'
            + '<select class="ds-input" aria-label="Select" data-kind="select"><option>One</option></select>'
            + '<div class="ds-input-group" data-kind="group"><input class="ds-input" aria-label="Group"></div>'
            + '<label class="ds-check" data-kind="check"><input type="checkbox"><span>Row</span></label>'
            + '<div class="ds-search"><input class="ds-input" aria-label="Search" placeholder="Search" data-kind="search"></div>';
          main.prepend(region);
          for (const el of region.querySelectorAll('[data-kind]')) {
            const css = getComputedStyle(el);
            // A group holds the line of its input.
            const line = parseFloat(el.dataset.kind === 'group' ? getComputedStyle(el.firstElementChild).lineHeight : css.lineHeight);
            out.push({ touch, density, size, kind: el.dataset.kind, height: el.getBoundingClientRect().height, line });
          }
          region.remove();
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES });
  expect(measured).toHaveLength(SIZES.length * DENSITIES.length * 2 * 5);
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const name = `${entry.kind} ${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`;
    // 40px at md and comfortable, 8px per size step, 4px per density step; never below its own line and border; touch: at least 48px.
    const content = entry.line + (entry.kind === 'check' ? 0 : 2);
    const expected = Math.max(entry.touch ? TOUCH : 0, 40 + step * 8 + density * 4, content);
    expect(Math.abs(entry.height - expected), `${name}: ${entry.height} against ${expected}`).toBeLessThanOrEqual(2);
    if (entry.touch) expect(entry.height, `${name} touch minimum`).toBeGreaterThanOrEqual(TOUCH);
  }
});

test('the default field is 40px; a nested region follows its own density, a comfortable island too', async ({ page }) => {
  await open(page);
  await add(page, '<input class="ds-input" id="plain" aria-label="Plain"><div class="ds-density-dense"><input class="ds-input" id="dense" aria-label="Dense">'
    + '<div class="ds-density-comfortable"><input class="ds-input" id="back" aria-label="Back"></div><input class="ds-input ds-lg" id="dense-lg" aria-label="Dense, large"></div>');
  expect((await style(page, '#plain')).height).toBe(40);
  expect((await style(page, '#dense')).height).toBe(32);
  expect((await style(page, '#back')).height).toBe(40);
  expect((await style(page, '#dense-lg')).height).toBe(40);
});

test('the compact theme: a field and an input group are its density\'s 32px', async ({ page }) => {
  await open(page);
  await page.addStyleTag({ url: '/dist/themes/compact.css' });
  await add(page, '<input class="ds-input" id="c-field" aria-label="Field"><select class="ds-input" id="c-select" aria-label="Select"><option>One</option></select><div class="ds-input-group" id="c-group"><input class="ds-input" aria-label="Group"></div><div class="ds-density-comfortable"><input class="ds-input" id="c-back" aria-label="Back"></div>');
  await expect.poll(async () => (await style(page, '#c-field')).height).toBe(32);
  expect((await style(page, '#c-select')).height).toBe(32);
  expect((await style(page, '#c-group')).height).toBe(32);
  expect((await style(page, '#c-back')).height).toBe(40);
});

test('an inline form centres its button on the field at every option', async ({ page }) => {
  await open(page);
  const form = (cls, button = '') => `<div class="ds-inline-form ${cls}" data-inline><div class="ds-field"><label class="ds-field__label" for="if-${cls}${button}">Ticket</label><input class="ds-input" id="if-${cls}${button}"></div><button class="ds-btn ${button}" type="button">Look up</button></div>`;
  await add(page, form('') + form('ds-sm') + form('ds-lg') + form('ds-density-dense') + form('ds-touch') + form('', 'ds-sm') + form('', 'ds-lg'));
  const offsets = await page.$$eval('[data-inline]', (forms) => forms.map((el) => {
    const centre = (part) => { const rect = el.querySelector(part).getBoundingClientRect(); return (rect.top + rect.bottom) / 2; };
    return Math.abs(centre('.ds-input') - centre('.ds-btn'));
  }));
  expect(offsets).toHaveLength(7);
  for (const offset of offsets) expect(offset).toBeLessThanOrEqual(0.5);
});

test('type follows size, side padding follows size and not density, labels keep their role', async ({ page }) => {
  await open(page);
  await add(page, SIZES.map(([size]) => `<div class="ds-field ${size}"><label class="ds-field__label" id="l-${size}" for="i-${size}">Name</label><input class="ds-input" id="i-${size}"></div>`).join('')
    + '<div class="ds-density-tight"><input class="ds-input" id="tight" aria-label="Tight"></div><input class="ds-input" id="base" aria-label="Base">');
  const read = {};
  for (const [size] of SIZES) read[size] = await style(page, `#i-${size}`);
  expect(Object.values(read).map((entry) => entry.font)).toEqual([12, 14, 14, 16, 16]);
  expect(Object.values(read).map((entry) => entry.padStart)).toEqual([4, 8, 12, 16, 20]);
  expect(new Set(Object.values(read).map((entry) => entry.weight)).size, 'field text keeps one weight').toBe(1);
  expect((await style(page, '#l-ds-xl')).font).toBe((await style(page, '#l-ds-xs')).font);
  expect((await style(page, '#tight')).padStart).toBe((await style(page, '#base')).padStart);
  expect((await style(page, '#tight')).font).toBe((await style(page, '#base')).font);
});

test('field text stays 16px on a phone at every size, in a group and on touch', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await open(page);
  await add(page, SIZES.map(([size]) => `<div class="${size}"><input class="ds-input" id="p-${size}" aria-label="Field"><select class="ds-input" id="s-${size}" aria-label="Select"><option>One</option></select>`
    + `<textarea class="ds-input" id="t-${size}" aria-label="Note"></textarea><div class="ds-input-group"><input class="ds-input" id="g-${size}" aria-label="Group"><span class="ds-input-group__suffix" id="u-${size}" aria-hidden="true">GB</span></div></div>`).join(''));
  for (const [size] of SIZES) {
    for (const part of ['p', 's', 't', 'g', 'u']) expect((await style(page, `#${part}-${size}`)).font, `${part} ${size}`).toBe(16);
  }
  // A phone's md field keeps the 2.x height around its taller line: 42px, also as a group.
  expect((await style(page, '#p-ds-md')).height).toBe(42);
  expect(await page.$eval('#g-ds-md', (el) => el.parentElement.getBoundingClientRect().height)).toBe(42);
});

test('.ds-touch alone gives field text its 16px on a desktop too', async ({ page }) => {
  await open(page);
  await add(page, '<div class="ds-touch"><input class="ds-input" id="touch-field" aria-label="Field"></div>');
  expect((await style(page, '#touch-field')).font).toBe(16);
});

test('shape: fields, the search pill, checkboxes and cards take it; a radio stays round; the card press morph scales', async ({ page }) => {
  await open(page);
  const set = (shape) => `<div class="ds-shape-${shape}"><input class="ds-input" id="f-${shape}" aria-label="Field"><div class="ds-input-group" id="g-${shape}"><input class="ds-input" aria-label="Group"></div>`
    + `<div class="ds-search"><input class="ds-input" id="s-${shape}" aria-label="Search" placeholder="S"></div><input class="ds-checkbox" type="checkbox" id="c-${shape}" aria-label="Box"><input class="ds-radio-input" type="radio" id="r-${shape}" aria-label="Radio">`
    + `<label class="ds-radio" id="card-${shape}"><input type="radio"><span><strong>Card</strong></span></label><label class="ds-check-card" id="ccard-${shape}"><input class="ds-checkbox" type="checkbox"><span><strong>Card</strong></span></label></div>`;
  await add(page, ['square', 'soft', 'default', 'round'].map(set).join(''));
  const shapes = { square: 0, soft: 0.5, default: 1, round: 1.5 };
  const field = (await style(page, '#f-default')).radius;
  const card = (await style(page, '#card-default')).radius;
  const box = (await style(page, '#c-default')).radius;
  expect(field).toBeGreaterThan(0);
  for (const [shape, factor] of Object.entries(shapes)) {
    expect((await style(page, `#f-${shape}`)).radius, `field ${shape}`).toBeCloseTo(field * factor, 1);
    expect((await style(page, `#g-${shape}`)).radius, `group ${shape}`).toBeCloseTo(field * factor, 1);
    expect((await style(page, `#c-${shape}`)).radius, `checkbox ${shape}`).toBeCloseTo(box * factor, 1);
    expect((await style(page, `#card-${shape}`)).radius, `radio card ${shape}`).toBeCloseTo(card * factor, 1);
    expect((await style(page, `#ccard-${shape}`)).radius, `check card ${shape}`).toBeCloseTo(card * factor, 1);
    // A radio is round in every shape.
    expect(await page.$eval(`#r-${shape}`, (el) => getComputedStyle(el).borderTopLeftRadius), `radio ${shape}`).toBe('50%');
  }
  // The search is the pill at the default shape, at most half its height, square at 0.
  expect((await style(page, '#s-default')).radius).toBe(20);
  expect((await style(page, '#s-round')).radius).toBe(20);
  expect((await style(page, '#s-soft')).radius).toBe(10);
  expect((await style(page, '#s-square')).radius).toBe(0);
  // Pressed: --ds-radius-card-pressed times the shape, never rounder than at rest; square stays square.
  for (const [shape, id] of [['square', 'ccard-square'], ['default', 'ccard-default']]) {
    await page.$eval(`#${id}`, (el) => el.classList.add('ds-pressed'));
    await page.waitForTimeout(300);
    const pressed = (await style(page, `#${id}`)).radius;
    if (shape === 'square') expect(pressed).toBe(0);
    else expect(pressed).toBeLessThan(card);
    await page.$eval(`#${id}`, (el) => el.classList.remove('ds-pressed'));
  }
});

test('the looks: outlined on the surface, filled on the tone without a border, inset with the label in the box', async ({ page }) => {
  await open(page);
  await add(page, '<div class="ds-field ds-field--outlined"><label class="ds-field__label" for="o">O</label><input class="ds-input" id="o"></div>'
    + '<div class="ds-field ds-field--filled"><label class="ds-field__label" for="fi">F</label><input class="ds-input" id="fi"></div>'
    + '<div class="ds-field ds-field--filled"><label class="ds-field__label" for="fo">F</label><input class="ds-input ds-input--outlined" id="fo"></div>'
    + '<div class="ds-field ds-field--filled"><label class="ds-field__label" for="fg">F</label><div class="ds-input-group" id="fg-box"><input class="ds-input" id="fg"></div></div>'
    + '<input class="ds-input ds-input--filled" id="one" aria-label="One"><div class="ds-input-group ds-input-group--filled" id="one-group"><input class="ds-input" aria-label="One group"></div>'
    + '<div class="ds-field ds-field--inset" id="inset"><label class="ds-field__label" for="in">Title</label><input class="ds-input" id="in" value="Quarterly report"><small class="ds-field__hint">Shown in the list.</small></div>'
    + '<div class="ds-field ds-field--inset" id="inset-group"><label class="ds-field__label" for="ig">Website</label><div class="ds-input-group"><span class="ds-input-group__prefix" aria-hidden="true">https://</span><input class="ds-input" id="ig" value="example.org"></div></div>');
  await settle(page);
  const surface = await role(page, 'var(--ds-surface)');
  const tonal = await role(page, 'var(--ds-surface-high)');
  const outline = await role(page, 'var(--ds-outline)');
  const clear = 'rgba(0, 0, 0, 0)';
  expect(await style(page, '#o')).toMatchObject({ background: surface, borderTop: outline });
  expect(await style(page, '#fi')).toMatchObject({ background: tonal, borderTop: clear });
  expect(await style(page, '#fo')).toMatchObject({ background: surface, borderTop: outline });
  expect(await style(page, '#fg-box')).toMatchObject({ background: tonal, borderTop: clear });
  expect(await style(page, '#one')).toMatchObject({ background: tonal, borderTop: clear });
  expect(await style(page, '#one-group')).toMatchObject({ background: tonal, borderTop: clear });
  // Inset: the box behind label and value is 56px; the value has no box of its own, in a group neither.
  const box = await page.evaluate(() => {
    const field = document.querySelector('#inset');
    const label = field.querySelector('.ds-field__label').getBoundingClientRect();
    const input = field.querySelector('.ds-input').getBoundingClientRect();
    return { height: input.bottom - label.top, inputBelow: input.top >= label.bottom - 1 };
  });
  expect(box.inputBelow).toBe(true);
  expect(Math.abs(box.height - 56)).toBeLessThanOrEqual(2);
  const before = await style(page, '#inset', '::before');
  expect(before.background).toBe(tonal);
  expect((await style(page, '#in')).borderWidth).toBe(0);
  expect((await style(page, '#inset-group .ds-input-group')).borderWidth).toBe(0);
  // Focus draws the 2px line, also through an input group; nothing of the ring of the group is left.
  await page.focus('#ig');
  const line = await style(page, '#inset-group', '::before');
  expect(line.shadow).toMatch(/inset/);
  expect(line.shadow).toMatch(/-2px/);
  expect((await style(page, '#inset-group .ds-input-group')).shadow).toBe('none');
});

test('filled reaches an input group in a field row: the readable placeholder, its own hover', async ({ page }) => {
  await open(page);
  await add(page, '<div class="ds-field ds-field--filled"><label class="ds-field__label" for="rg">Key</label><div class="ds-field__row"><div class="ds-input-group" id="rg-box"><input class="ds-input" id="rg" placeholder="Paste it"></div><button class="ds-btn" type="button">Copy</button></div></div>');
  await settle(page);
  expect(await page.$eval('#rg', (el) => getComputedStyle(el, '::placeholder').color)).toBe(await role(page, 'var(--ds-text-2)'));
  await page.hover('#rg-box');
  await settle(page);
  expect(await style(page, '#rg-box')).toMatchObject({ background: await role(page, 'var(--ds-surface-highest)'), borderTop: 'rgba(0, 0, 0, 0)' });
});

test('inset takes a select with the triangle\'s room, and a counter in line with the label', async ({ page }) => {
  await open(page);
  await add(page, '<select class="ds-input" id="plain-select" aria-label="Plain"><option>One</option></select>'
    + '<div class="ds-field ds-field--inset"><label class="ds-field__label" for="is">Kind</label><select class="ds-input" id="is"><option>One</option></select></div>'
    + '<div class="ds-field ds-field--inset"><label class="ds-field__label" for="il">Kind</label><input class="ds-input" id="il" list="il-list"><datalist id="il-list"><option value="One"></option></datalist></div>'
    + '<div class="ds-field ds-field--inset" id="if"><label class="ds-field__label" id="if-l" for="ifi">Note</label><input class="ds-input" id="ifi"><div class="ds-field__foot" id="if-f"><small class="ds-field__hint">Hint</small><span class="ds-field__counter" aria-hidden="true">1 / 80</span></div></div>');
  const paddingRight = (id) => page.$eval(`#${id}`, (el) => parseFloat(getComputedStyle(el).paddingRight));
  const room = await paddingRight('plain-select');
  expect(room).toBeGreaterThan(12);
  expect(await paddingRight('is')).toBe(room);
  expect(await paddingRight('il')).toBe(room);
  // Also while focused: the inset's focus rule sets the padding as well.
  await page.focus('#is');
  expect(await paddingRight('is')).toBe(room);
  await page.focus('#il');
  expect(await paddingRight('il')).toBe(room);
  // The foot lines up with the label's text and keeps a gap to the box.
  const foot = await page.evaluate(() => {
    const [label, row, input] = ['#if-l', '#if-f', '#ifi'].map((selector) => document.querySelector(selector));
    return {
      label: label.getBoundingClientRect().left + parseFloat(getComputedStyle(label).paddingInlineStart),
      foot: row.getBoundingClientRect().left + parseFloat(getComputedStyle(row).paddingInlineStart),
      gap: row.getBoundingClientRect().top - input.getBoundingClientRect().bottom,
    };
  });
  expect(foot.foot).toBe(foot.label);
  expect(foot.gap).toBe(4);
});

test('on a phone an inset box is one height with a plain input and with an input group', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await open(page);
  await add(page, '<div class="ds-field ds-field--inset" id="pi"><label class="ds-field__label" for="pii">Title</label><input class="ds-input" id="pii"></div>'
    + '<div class="ds-field ds-field--inset" id="pg"><label class="ds-field__label" for="pgi">Site</label><div class="ds-input-group"><input class="ds-input" id="pgi"></div></div>');
  const heights = () => page.evaluate(() => ['#pi', '#pg'].map((id) => document.querySelector(id).getBoundingClientRect().height));
  const [plain, group] = await heights();
  expect(group).toBe(plain);
  await page.focus('#pgi');
  expect((await heights())[1], 'also focused').toBe(plain);
});

test('inset follows size, density and touch', async ({ page }) => {
  await open(page);
  const measure = (cls, id) => `<div class="${cls}"><div class="ds-field ds-field--inset" id="${id}"><label class="ds-field__label" for="${id}-i">Title</label><input class="ds-input" id="${id}-i" value="Value"></div></div>`;
  await add(page, measure('', 'i-base') + measure('ds-density-dense', 'i-dense') + measure('ds-lg', 'i-lg') + measure('ds-density-tight ds-touch', 'i-touch'));
  const height = (id) => page.$eval(`#${id}`, (el) => el.getBoundingClientRect().height);
  const base = await height('i-base');
  expect(Math.abs((await height('i-dense')) - (base - 8))).toBeLessThanOrEqual(1);
  expect(await height('i-lg')).toBeGreaterThanOrEqual(base + 4);
  expect(await height('i-touch')).toBeGreaterThanOrEqual(TOUCH);
});

test('the slots: in the order of the markup, the same type as the value, a trailing button keeps its ring', async ({ page }) => {
  await open(page);
  await add(page, '<div class="ds-field"><label class="ds-field__label" for="slot">Website</label><div class="ds-input-group" id="slots"><span class="ds-input-group__leading" id="lead" aria-hidden="true"><span data-icon="globe"></span></span><span class="ds-input-group__prefix" id="pre" aria-hidden="true">https://</span><input class="ds-input" id="slot" value="example.org"><span class="ds-input-group__suffix" id="suf" aria-hidden="true">GB</span><span class="ds-input-group__trailing" id="trail"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" id="slot-btn" type="button" aria-label="Clear"><span>x</span></button></span></div></div>'
    + '<div class="ds-input-group"><input class="ds-input" aria-label="Quota"><span class="ds-input-group__affix" id="old" aria-hidden="true">GB</span></div>');
  const order = await page.$$eval('#slots > *', (els) => els.map((el) => el.getBoundingClientRect().left));
  expect(order).toEqual([...order].sort((a, b) => a - b));
  const [prefix, suffix, value, old] = [await style(page, '#pre'), await style(page, '#suf'), await style(page, '#slot'), await style(page, '#old')];
  expect(prefix.font).toBe(value.font);
  expect(suffix.font).toBe(value.font);
  // The 2.x name looks like its replacement.
  expect(old.font).toBe(suffix.font);
  expect(old.color).toBe(suffix.color);
  // The value keeps the room; the leading icon takes no pointer.
  expect(value.width).toBeGreaterThan(50);
  expect(await page.$eval('#lead', (el) => getComputedStyle(el).pointerEvents)).toBe('none');
  // Tab reaches the input, then the trailing button with its ring.
  await page.focus('#slot');
  await page.keyboard.press('Tab');
  await expect(page.locator('#slot-btn')).toBeFocused();
  expect((await style(page, '#slot-btn')).outline).toBe('solid');
});

test('a button in the trailing slot adds nothing to the field\'s height, like a direct one', async ({ page }) => {
  await open(page);
  const group = (id, cls, button) => `<div class="${cls}"><div class="ds-input-group" id="${id}"><input class="ds-input" aria-label="Group"><span class="ds-input-group__trailing"><button class="ds-btn ds-btn--quiet ds-btn--icon ${button}" type="button" aria-label="Clear"><span>x</span></button></span></div></div>`;
  await add(page, group('slot-md', '', '') + group('slot-sm', '', 'ds-sm') + group('slot-dense', 'ds-density-dense', 'ds-sm') + group('slot-xs', 'ds-xs', 'ds-xs')
    + '<div class="ds-input-group" id="direct"><input class="ds-input" aria-label="Group"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Clear"><span>x</span></button></div>');
  for (const [id, height] of [['slot-md', 40], ['slot-sm', 40], ['slot-dense', 32], ['slot-xs', 24], ['direct', 40]]) expect((await style(page, `#${id}`)).height, id).toBe(height);
});

test('warning and success colour the control and its ring, the hint says it; aria-invalid stays the error', async ({ page }) => {
  await open(page);
  await add(page, '<div class="ds-field ds-field--warning"><label class="ds-field__label" for="w">Cert</label><input class="ds-input" id="w" aria-describedby="w-h"><small class="ds-field__hint ds-field__hint--warning" id="w-h"><svg width="16" height="16" aria-hidden="true"></svg>Expires in 3 days.</small></div>'
    + '<div class="ds-field ds-field--success"><label class="ds-field__label" for="s">User</label><div class="ds-input-group" id="s-box"><input class="ds-input" id="s" aria-describedby="s-h"></div><small class="ds-field__hint ds-field__hint--success" id="s-h"><svg width="16" height="16" aria-hidden="true"></svg>Available.</small></div>'
    + '<div class="ds-field ds-field--inset ds-field--warning" id="w-inset"><label class="ds-field__label" for="wi">Cert</label><input class="ds-input" id="wi"></div>'
    + '<div class="ds-field ds-field--warning"><label class="ds-field__label" for="e">Both</label><input class="ds-input" id="e" aria-invalid="true"></div>');
  await settle(page);
  const [warning, success, error, warningInk] = [await role(page, 'var(--ds-warning)'), await role(page, 'var(--ds-success)'), await role(page, 'var(--ds-error)'), await role(page, 'var(--ds-on-warning-container)')];
  expect((await style(page, '#w')).borderTop).toBe(warning);
  expect((await style(page, '#s-box')).borderTop).toBe(success);
  // The hint: an icon and a word, in the state's ink.
  expect((await style(page, '#w-h')).color).toBe(warningInk);
  expect(await page.$eval('#w-h', (el) => [!!el.querySelector('svg'), el.textContent.trim().length > 0])).toEqual([true, true]);
  // The ring keeps the state's colour while focused.
  await page.focus('#w');
  const focused = await style(page, '#w');
  expect(focused.borderTop).toBe(warning);
  expect(focused.shadow).toContain(warning);
  // The label takes the ring's colour with the ring.
  expect((await style(page, 'label[for="w"]')).color).toBe(warning);
  await page.focus('#s');
  expect((await style(page, '#s-box')).shadow).toContain(success);
  expect((await style(page, 'label[for="s"]')).color).toBe(success);
  // Filled line of the inset field.
  expect((await style(page, '#w-inset', '::before')).shadow).toContain(warning);
  // aria-invalid wins over a state class.
  expect((await style(page, '#e')).borderTop).toBe(error);
});

test('read-only: the quiet look, focusable and selectable; a select through aria-readonly; disabled is out of the tab order', async ({ page }) => {
  await open(page);
  await add(page, '<input class="ds-input" id="ro" aria-label="Serial" value="SN-0042" readonly><select class="ds-input" id="ros" aria-label="Warranty" aria-readonly="true"><option>4 years</option></select><div class="ds-input-group" id="rog"><input class="ds-input" aria-label="Key" value="abc" readonly></div><input class="ds-input" id="dis" aria-label="Off" disabled value="Off"><input class="ds-input" id="after" aria-label="After">');
  await settle(page);
  const [low, line] = [await role(page, 'var(--ds-surface-low)'), await role(page, 'var(--ds-line)')];
  for (const id of ['ro', 'ros', 'rog']) expect(await style(page, `#${id}`), id).toMatchObject({ background: low, borderTop: line });
  await page.focus('#ro');
  await expect(page.locator('#ro')).toBeFocused();
  await page.focus('#rog .ds-input');
  await page.keyboard.press('Tab');
  await expect(page.locator('#after')).toBeFocused();
});

test('a focused read-only field shows the whole ring or focus line of its look, on the quiet surface', async ({ page }) => {
  await open(page);
  await add(page, '<input class="ds-input" id="ro" aria-label="Serial" value="SN-0042" readonly>'
    + '<div class="ds-input-group" id="rog"><input class="ds-input" id="rogi" aria-label="Key" value="abc" readonly></div>'
    + '<div class="ds-field ds-field--filled"><label class="ds-field__label" for="rof">Owner</label><input class="ds-input" id="rof" value="Ada" readonly></div>'
    + '<div class="ds-field ds-field--inset" id="roi"><label class="ds-field__label" for="roii">Title</label><input class="ds-input" id="roii" value="Report" readonly></div>'
    + '<div class="ds-field ds-field--inset" id="roig"><label class="ds-field__label" for="roigi">Site</label><div class="ds-input-group"><input class="ds-input" id="roigi" value="example.org" readonly></div></div>');
  await settle(page);
  const [primary, low, line] = [await role(page, 'var(--ds-primary)'), await role(page, 'var(--ds-surface-low)'), await role(page, 'var(--ds-line)')];
  for (const [id, box] of [['ro', 'ro'], ['rogi', 'rog'], ['rof', 'rof']]) {
    await page.focus(`#${id}`);
    const ring = await style(page, `#${box}`);
    expect(ring.borderTop, `${box} border`).toBe(primary);
    expect(ring.shadow, `${box} ring`).toContain(primary);
    expect(ring.background, `${box} surface`).toBe(low);
  }
  for (const [id, box] of [['roii', 'roi'], ['roigi', 'roig']]) {
    await page.focus(`#${id}`);
    const focused = await style(page, `#${box}`, '::before');
    expect(focused.shadow, `${box} line`).toContain(primary);
    expect(focused.shadow, `${box} line`).toMatch(/-2px/);
    expect(focused.background, `${box} surface`).toBe(low);
  }
  // Back at rest: the quiet look returns.
  await page.evaluate(() => document.activeElement.blur());
  await settle(page);
  for (const box of ['ro', 'rog']) expect((await style(page, `#${box}`)).borderTop, box).toBe(line);
  expect((await style(page, '#roi', '::before')).shadow).toContain(line);
  expect((await style(page, '#roig', '::before')).shadow).toMatch(/-1px/);
});

test('the counter past its limit takes the error ink beside its figures', async ({ page }) => {
  await open(page);
  await add(page, '<div class="ds-field__foot"><small class="ds-field__hint">Hint</small><span class="ds-field__counter" id="c1" aria-hidden="true">12 / 80</span></div><div class="ds-field__foot"><span class="ds-field__counter ds-field__counter--over" id="c2" aria-hidden="true">90 / 80</span></div>');
  expect((await style(page, '#c2')).color).toBe(await role(page, 'var(--ds-on-error-container)'));
  expect((await style(page, '#c1')).color).toBe(await role(page, 'var(--ds-text-2)'));
});

test('a checkbox card: its layer and ring on the card, no halo on the input, Space toggles, the ripple presses it', async ({ page }) => {
  await open(page);
  await add(page, '<button class="ds-btn" id="cc-before" type="button">Before</button><div class="ds-check-cards" role="group" aria-label="Add-ons"><label class="ds-check-card" id="cc"><input class="ds-checkbox" type="checkbox" id="cc-i"><span><strong>Backups</strong><small>Every night.</small></span></label>'
    + '<label class="ds-check-card" id="cc-off"><input class="ds-checkbox" type="checkbox" disabled><span><strong>Audit log</strong></span></label><label class="ds-check-card" id="cc-blocked"><input class="ds-checkbox" type="checkbox" aria-disabled="true" id="cc-b"><span><strong>Blocked</strong></span></label></div>');
  await settle(page);
  // Names: the group by its aria-label, the checkbox by its card.
  await expect(page.locator('#fx-added').getByRole('group', { name: 'Add-ons' }).getByRole('checkbox', { name: /Backups/ })).toBeVisible();
  // A checked card: the primary ring around, never the tint alone.
  await page.focus('#cc-i');
  await page.keyboard.press('Space');
  await expect(page.locator('#cc-i')).toBeChecked();
  await settle(page);
  const primary = await role(page, 'var(--ds-primary)');
  const card = await style(page, '#cc');
  expect(card.borderTop).toBe(primary);
  expect(card.shadow).toContain(primary);
  // Keyboard focus rings the card, not the box inside.
  await page.mouse.move(1, 1);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(page.locator('#cc-i')).toBeFocused();
  expect((await style(page, '#cc')).outline).toBe('solid');
  expect((await style(page, '#cc-i')).outline).toBe('none');
  // No halo: the input's spread is 0.
  const shadow = (await style(page, '#cc-i')).shadow;
  expect(shadow === 'none' || / 0px 0px 0px 0px/.test(` ${shadow}`) || /0px 0px 0px$/.test(shadow.replace(/rgba?\([^)]*\) ?/, '').trim()), shadow).toBe(true);
  // A press adds a ripple (the host of DS.ripple); a disabled one takes none and shows the not-allowed cursor.
  const box = await page.locator('#cc').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(page.locator('#cc .ds-press-ripple')).toHaveCount(1);
  await page.mouse.up();
  // A press on the box itself ripples the card too: the card owns its input.
  await expect(page.locator('#cc .ds-press-ripple')).toHaveCount(0);
  const tick = await page.locator('#cc-i').boundingBox();
  await page.mouse.move(tick.x + tick.width / 2, tick.y + tick.height / 2);
  await page.mouse.down();
  await expect(page.locator('#cc .ds-press-ripple')).toHaveCount(1);
  await page.mouse.up();
  expect((await style(page, '#cc-off')).cursor).toBe('not-allowed');
  const off = await page.locator('#cc-off').boundingBox();
  await page.mouse.move(off.x + off.width / 2, off.y + off.height / 2);
  await page.mouse.down();
  await expect(page.locator('#cc-off .ds-press-ripple')).toHaveCount(0);
  await page.mouse.up();
  // aria-disabled: focusable, blocked by the guard for a click and for Space.
  await page.focus('#cc-b');
  await page.keyboard.press('Space');
  await expect(page.locator('#cc-b')).not.toBeChecked();
  await page.locator('#cc-blocked').click({ force: true });
  await expect(page.locator('#cc-b')).not.toBeChecked();
});

test('the size reaches the box, the halo and the dot of checks; the deprecated --sm keeps its 32px row', async ({ page }) => {
  await open(page);
  await add(page, '<label class="ds-check ds-xl"><input type="checkbox" id="x"><span>Big</span></label><label class="ds-check ds-check--sm" id="old"><input type="checkbox"><span>Old</span></label><div class="ds-density-tight"><label class="ds-check ds-check--sm" id="old-tight"><input type="checkbox"><span>Old</span></label></div><label class="ds-check ds-sm" id="new"><input type="checkbox"><span>New</span></label><input class="ds-radio-input ds-lg" type="radio" id="rl" aria-label="Radio" checked>');
  expect((await style(page, '#x')).width).toBe(22);
  expect((await style(page, '#old')).height).toBe(32);
  expect((await style(page, '#old-tight')).height).toBe(32);
  expect((await style(page, '#new')).height).toBe(32);
  const radio = await page.$eval('#rl', (el) => parseFloat(getComputedStyle(el, '::after').width));
  expect(radio).toBeCloseTo(20 * 4 / 9, 0);
  // The box sits on the first line of its row whatever the size.
  const centred = await page.$eval('#x', (el) => {
    const label = el.parentElement.querySelector('span').getBoundingClientRect();
    const box = el.getBoundingClientRect();
    return Math.abs((box.top + box.bottom) / 2 - (label.top + label.bottom) / 2);
  });
  expect(centred).toBeLessThanOrEqual(1);
});

test('fieldset and form section: a named group without a frame, a section on a hairline, columns that narrow', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await open(page);
  await add(page, '<fieldset class="ds-fieldset" id="fs"><legend class="ds-fieldset__legend" id="fs-l">Place</legend><p class="ds-fieldset__hint">Where it stands.</p><div class="ds-field"><label class="ds-field__label" for="b">Building</label><input class="ds-input" id="b"></div></fieldset>'
    + '<fieldset class="ds-fieldset ds-fieldset--outlined" id="fso" disabled><legend class="ds-fieldset__legend" id="fso-l">Off</legend><label class="ds-check"><input type="checkbox" id="fso-c"><span>Mail</span></label></fieldset>'
    + '<section class="ds-form-section ds-form-section--columns" id="s1" aria-labelledby="s1-t"><div class="ds-form-section__head" id="s1-h"><h3 class="ds-form-section__title" id="s1-t">General</h3><p class="ds-form-section__text">Text.</p></div><div class="ds-form-section__body" id="s1-b"><input class="ds-input" aria-label="Name"></div></section>'
    + '<section class="ds-form-section" id="s2" aria-labelledby="s2-t"><div class="ds-form-section__head"><h3 class="ds-form-section__title" id="s2-t">Alerts</h3></div><div class="ds-form-section__body"><input class="ds-input" aria-label="Mail"></div></section>');
  await settle(page);
  const added = page.locator('#fx-added');
  await expect(added.getByRole('group', { name: 'Place' })).toBeVisible();
  await expect(added.getByRole('region', { name: 'General' })).toBeVisible();
  const frame = await page.$eval('#fs', (el) => { const css = getComputedStyle(el); return [css.borderTopWidth, css.paddingTop, css.marginTop]; });
  expect(frame).toEqual(['0px', '0px', '0px']);
  // Outlined: a frame; disabled: the legend quiet, the control disabled.
  expect((await style(page, '#fso')).borderWidth).toBe(1);
  expect((await style(page, '#fso-l')).color).toBe(await role(page, 'var(--ds-text-2)'));
  await expect(page.locator('#fso-c')).toBeDisabled();
  // Section after a section: the hairline; a first section has none.
  expect((await style(page, '#s2')).borderWidth).toBe(1);
  expect((await style(page, '#s1')).borderWidth).toBe(0);
  // Columns: the head beside the body, the label of a field stays above; narrow: one column.
  const beside = await page.evaluate(() => [document.querySelector('#s1-h').getBoundingClientRect().right, document.querySelector('#s1-b').getBoundingClientRect().left]);
  expect(beside[0]).toBeLessThanOrEqual(beside[1]);
  await page.setViewportSize({ width: 600, height: 800 });
  const stacked = await page.evaluate(() => [document.querySelector('#s1-h').getBoundingClientRect().bottom, document.querySelector('#s1-b').getBoundingClientRect().top]);
  expect(stacked[0]).toBeLessThanOrEqual(stacked[1]);
});

test('keyboard: Tab walks fields and boxes, Space toggles, the arrows move within radios, a blocked box ignores Space', async ({ page }) => {
  await open(page);
  await add(page, '<input class="ds-input" id="k1" aria-label="One"><label class="ds-check"><input type="checkbox" id="k2"><span>Two</span></label><label class="ds-check"><input type="checkbox" id="k3" aria-disabled="true"><span>Three</span></label>'
    + '<div class="ds-radios" role="radiogroup" aria-label="Plan"><label class="ds-radio"><input type="radio" name="k-plan" id="k4" checked><span><strong>A</strong></span></label><label class="ds-radio"><input type="radio" name="k-plan" id="k5"><span><strong>B</strong></span></label></div><input class="ds-input" id="k6" aria-label="Six">');
  await page.focus('#k1');
  await page.keyboard.press('Tab');
  await expect(page.locator('#k2')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.locator('#k2')).toBeChecked();
  await page.keyboard.press('Tab');
  await expect(page.locator('#k3')).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.locator('#k3')).not.toBeChecked();
  await page.keyboard.press('Tab');
  await expect(page.locator('#k4')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#k5')).toBeChecked();
  await expect(page.locator('#k5')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#k6')).toBeFocused();
  // Names through the label; a card by its content.
  await expect(page.locator('#fx-added').getByRole('radiogroup', { name: 'Plan' }).getByRole('radio')).toHaveCount(2);
});

test('forced colours: focus an outline, a state keeps a word, cards and blocked words in system colours', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await add(page, '<div class="ds-field ds-field--warning"><label class="ds-field__label" for="fw">Cert</label><input class="ds-input" id="fw"><small class="ds-field__hint ds-field__hint--warning">Expires.</small></div>'
    + '<div class="ds-field ds-field--inset" id="fi"><label class="ds-field__label" for="fii">Title</label><div class="ds-input-group"><input class="ds-input" id="fii"></div></div>'
    + '<div class="ds-input-group" id="fg"><input class="ds-input" id="fgi" aria-label="Group"></div>'
    + '<label class="ds-check-card" id="fc"><input class="ds-checkbox" type="checkbox" id="fci" checked><span><strong>Card</strong></span></label><label class="ds-check-card" id="fcc"><input class="ds-checkbox" type="checkbox" id="fcd" checked disabled><span><strong id="fcs">Off</strong></span></label>'
    + '<label class="ds-radio" id="fr"><input type="radio" name="fr" checked><span><strong>On</strong></span></label><label class="ds-radio ds-radio--disabled"><input type="radio" name="fr2" disabled><span><strong id="frs">Off</strong></span></label><label class="ds-check-card"><input class="ds-checkbox" type="checkbox" aria-disabled="true"><span><strong id="fbs">Blocked</strong></span></label>'
    + '<input class="ds-input" id="fdi" aria-label="Off" value="Off" disabled><input class="ds-input" id="fen" aria-label="On" value="On"><div class="ds-input-group" id="fdg"><input class="ds-input" aria-label="Off" disabled></div>'
    + '<fieldset class="ds-fieldset" disabled><legend class="ds-fieldset__legend" id="fdl">Off</legend></fieldset>');
  await settle(page);
  const system = await page.evaluate(() => {
    const probe = (property, value) => {
      const el = document.createElement('span');
      el.style.forcedColorAdjust = 'none';
      el.style[property] = value;
      document.querySelector('.ds-theme').append(el);
      const colour = getComputedStyle(el)[property];
      el.remove();
      return colour;
    };
    return { highlight: probe('backgroundColor', 'Highlight'), gray: probe('backgroundColor', 'GrayText') };
  });
  await page.focus('#fw');
  expect((await style(page, '#fw')).outline).toBe('solid');
  // The inset box shows the outline for a focused group, the group draws no ring of its own.
  await page.focus('#fii');
  expect((await style(page, '#fi', '::before')).outline).toBe('solid');
  expect((await style(page, '#fi .ds-input-group')).outline).toBe('none');
  await page.focus('#fgi');
  expect((await style(page, '#fg')).outline).toBe('solid');
  // A box in a card: the system's selection colours; disabled GrayText.
  expect((await style(page, '#fci')).background).toBe(system.highlight);
  expect((await style(page, '#fcd')).background).toBe(system.gray);
  // A selected card: its edge too; checked and blocked, GrayText.
  expect((await style(page, '#fc')).borderTop).toBe(system.highlight);
  expect((await style(page, '#fr')).borderTop).toBe(system.highlight);
  expect((await style(page, '#fcc')).borderTop).toBe(system.gray);
  // Blocked is GrayText: a disabled field and group, unlike an enabled field; the words of a blocked choice.
  const disabled = await style(page, '#fdi');
  expect(disabled).toMatchObject({ borderTop: system.gray, color: system.gray });
  expect((await style(page, '#fen')).borderTop).not.toBe(system.gray);
  expect((await style(page, '#fdg')).borderTop).toBe(system.gray);
  for (const id of ['fdl', 'fcs', 'frs', 'fbs']) expect((await style(page, `#${id}`)).color, id).toBe(system.gray);
});
