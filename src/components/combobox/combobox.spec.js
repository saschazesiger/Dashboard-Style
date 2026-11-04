/**
 * The combobox on the options model (3.0): the field, its toggle and an
 * option at every size x density, with and without .ds-touch (touch wins, as
 * a minimum); the shape at rest and pressed; the name's type by size. Then what
 * 3.0 adds: group headings, descriptions, the clear button, the create option,
 * several values, the disabled toggle; the keyboard of both kinds of
 * combobox, names and roles, and forced colours. The 2.x behaviour stays in
 * test/browser/popups.spec.js and the other 2.x specs. Runs on the generated
 * fixture of the demo, and in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=combobox');
  await ready(page);
  await page.mouse.move(1, 1);
}

/** A closed combobox for measuring, its option in the flow. */
const MARKUP = (cls) => `<div class="ds-combo ${cls}"><input class="ds-input ds-combo__input" role="combobox" aria-label="Measured" aria-expanded="false">
  <button class="ds-combo__clear" type="button" aria-label="Clear"></button>
  <button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all"></button>
  <div class="ds-combo__popup" style="position: static"><ul class="ds-combo__list" role="listbox" aria-label="Measured"><li class="ds-combo__option" role="option" aria-selected="false"><span class="ds-combo__name">One line</span></li></ul></div></div>`;

const finish = (page, selector) => page.$eval(selector, (el) => Promise.all(el.getAnimations().map((animation) => animation.finished.catch(() => null))).then(() => undefined));

const radius = (page, selector) => page.$eval(selector, (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));

const section = (page, name) => page.locator('.sg-section, section, div').filter({ has: page.locator(`[data-demo="${name}"]`) }).last();

test('the field, its toggle and an option at every size x density; .ds-touch as a minimum over both', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities, markup }) => {
    const main = document.querySelector('#fx-component');
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        const region = document.createElement('div');
        region.className = `${density}${touch ? ' ds-touch' : ''}`;
        main.append(region);
        for (const [size] of sizes) {
          region.insertAdjacentHTML('beforeend', markup.replace('${cls}', size));
          const combo = region.lastElementChild;
          const rect = (selector) => combo.querySelector(selector).getBoundingClientRect();
          const input = combo.querySelector('.ds-combo__input');
          const name = getComputedStyle(combo.querySelector('.ds-combo__name'));
          const option = combo.querySelector('.ds-combo__option');
          const end = parseFloat(getComputedStyle(input).paddingInlineEnd);
          out.push({
            touch, density, size,
            field: rect('.ds-combo__input').height,
            line: parseFloat(getComputedStyle(input).lineHeight) + 2,
            toggle: [rect('.ds-combo__toggle').width, rect('.ds-combo__toggle').height],
            clear: [rect('.ds-combo__clear').width, rect('.ds-combo__clear').height],
            option: rect('.ds-combo__option').height,
            padding: parseFloat(getComputedStyle(option).paddingTop),
            nameLine: parseFloat(name.lineHeight),
            nameSize: parseFloat(name.fontSize),
            nameWeight: name.fontWeight,
            end,
          });
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES, markup: MARKUP('${cls}') });
  expect(measured).toHaveLength(SIZES.length * DENSITIES.length * 2);
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const name = `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`;
    // 40px at md and comfortable, 8px per size step, 4px per density step, at least 24px for the icon of the toggle.
    const box = Math.max(24, 40 + step * 8 + density * 4);
    if (entry.touch) {
      // Touch wins over size and density.
      expect(entry.toggle[1], `${name} toggle`).toBeGreaterThanOrEqual(TOUCH - 0.5);
      expect(entry.field, `${name} field`).toBeGreaterThanOrEqual(TOUCH - 0.5);
      expect(entry.option, `${name} option`).toBeGreaterThanOrEqual(TOUCH - 0.5);
    } else {
      expect(entry.toggle[1], `${name} toggle`).toBeCloseTo(box, 0);
      expect(entry.field, `${name} field`).toBeCloseTo(Math.max(box, entry.line), 0);
    }
    // One height: the toggle and the clear button are as tall as the field and square, and the field keeps room for both.
    expect(entry.toggle[0], `${name} toggle width`).toBeCloseTo(entry.toggle[1], 0);
    expect(entry.clear, `${name} clear`).toEqual(entry.toggle);
    expect(entry.end, `${name} room`).toBeCloseTo(4 + 2 * entry.toggle[0], 0);
    // An option: 48px at md and comfortable, the same steps, the padding 2px per density step, never less than its text.
    if (!entry.touch) {
      const content = 2 * entry.padding + entry.nameLine;
      expect(entry.option, `${name} option`).toBeCloseTo(Math.max(48 + step * 8 + density * 4, content), 0);
    }
    expect(entry.padding, `${name} padding`).toBeCloseTo(8 + density * 2, 0);
  }
  // Type changes with size only, and an option at rest stays at the regular weight.
  const fonts = Object.fromEntries(measured.filter((entry) => !entry.touch && entry.density === 'ds-density-comfortable').map((entry) => [entry.size, entry.nameSize]));
  expect(fonts).toEqual({ 'ds-xs': 12, 'ds-sm': 14, 'ds-md': 14, 'ds-lg': 16, 'ds-xl': 16 });
  expect(new Set(measured.map((entry) => entry.nameWeight))).toEqual(new Set(['400']));
});

test('without size or density it keeps its 2.x geometry: 40px field and toggle, 48px option, room for the toggle', async ({ page }) => {
  await open(page);
  const plain = page.locator('[data-demo="plain"]');
  const box = await plain.locator('.ds-combo__input').boundingBox();
  const toggle = await plain.locator('.ds-combo__toggle').boundingBox();
  expect(box.height).toBe(40);
  expect([toggle.width, toggle.height]).toEqual([40, 40]);
  expect(await plain.locator('.ds-combo__input').evaluate((el) => getComputedStyle(el).paddingInlineEnd)).toBe('44px');
  // Without a toggle: only the field's own padding. The clear button's room comes and goes with it.
  const end = await page.evaluate(() => {
    const host = document.querySelector('#fx-component');
    host.insertAdjacentHTML('beforeend', '<div class="ds-combo" id="bare"><input class="ds-input ds-combo__input" role="combobox" aria-label="Bare" aria-expanded="false"></div><div class="ds-combo" id="clearing"><input class="ds-input ds-combo__input" role="combobox" aria-label="Clearing" aria-expanded="false"><button class="ds-combo__clear" type="button" aria-label="Clear"></button></div>');
    const read = (id) => getComputedStyle(document.querySelector(`#${id} input`)).paddingInlineEnd;
    return { bare: read('bare'), clearing: read('clearing') };
  });
  expect(end).toEqual({ bare: '12px', clearing: '44px' });
});

test('shape: the list and the toggle at rest, the press morph scaled with it, a blocked toggle does not morph', async ({ page }) => {
  await open(page);
  await page.evaluate((markup) => {
    const host = document.querySelector('#fx-component');
    for (const shape of ['square', 'soft', 'default', 'round']) host.insertAdjacentHTML('beforeend', `<div class="ds-shape-${shape}" id="shape-${shape}">${markup}</div>`);
  }, MARKUP(''));
  const expected = { square: [0, 0, 0], soft: [10, 6, 2], default: [20, 12, 4], round: [20, 18, 6] };
  for (const [shape, [rest, pressed, list]] of Object.entries(expected)) {
    const toggle = `#shape-${shape} .ds-combo__toggle`;
    const clear = `#shape-${shape} .ds-combo__clear`;
    expect(await radius(page, toggle), `${shape} toggle`).toBe(rest);
    expect(await radius(page, clear), `${shape} clear`).toBe(rest);
    expect(await radius(page, `#shape-${shape} .ds-combo__popup`), `${shape} list`).toBe(list);
    await page.$eval(toggle, (el) => el.classList.add('ds-pressed'));
    await finish(page, toggle);
    expect(await radius(page, toggle), `${shape} pressed`).toBe(pressed);
  }
  await page.$eval('#shape-default .ds-combo__clear', (el) => { el.setAttribute('aria-disabled', 'true'); el.classList.add('ds-pressed'); });
  await finish(page, '#shape-default .ds-combo__clear');
  expect(await radius(page, '#shape-default .ds-combo__clear')).toBe(20);
});

test('groups: the group is named by its heading, the heading is never active, a filter takes a whole group with it', async ({ page }) => {
  await open(page);
  const demo = page.locator('[data-demo="grouped"]');
  const input = demo.getByRole('combobox', { name: 'Device type' });
  await input.focus();
  await page.keyboard.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  const list = demo.getByRole('listbox');
  await expect(list.getByRole('group', { name: 'Laptops' }).getByRole('option')).toHaveCount(2);
  await expect(list.getByRole('group', { name: 'Desktops' }).getByRole('option', { name: /OptiPlex/ })).toBeVisible();
  // A heading is no option, and the keys walk past it.
  await expect(list.getByRole('option', { name: 'Laptops', exact: true })).toHaveCount(0);
  await page.keyboard.press('ArrowDown');
  const first = demo.locator('.ds-combo__option[data-active]');
  await expect(first.locator('.ds-combo__name')).toHaveText('Latitude 7440');
  for (let i = 0; i < 3; i += 1) await page.keyboard.press('ArrowDown');
  await expect(demo.locator('.ds-combo__option[data-active] .ds-combo__name')).toHaveText('Surface Go 4');
  await expect(demo.locator('.ds-combo__heading[data-active]')).toHaveCount(0);
  expect(await input.getAttribute('aria-activedescendant')).toBe(await demo.locator('.ds-combo__option[data-active]').getAttribute('id'));
  // Every group but the first has its line.
  const lines = await demo.locator('.ds-combo__group').evaluateAll((groups) => groups.map((group) => parseFloat(getComputedStyle(group).borderTopWidth)));
  expect(lines).toEqual([0, 1, 1]);
  // A filter hides options only; the groups with none left go, and the line never stands over the first that shows.
  await input.fill('opti');
  const visible = await demo.locator('.ds-combo__group').evaluateAll((groups) => groups.map((group) => [getComputedStyle(group).display !== 'none', parseFloat(getComputedStyle(group).borderTopWidth)]));
  expect(visible.map(([shows]) => shows)).toEqual([false, true, false]);
  expect(visible[1][1]).toBe(0);
  await expect(demo.locator('.ds-combo__status')).toHaveText('1 of 4 models');
  await expect(demo.locator('.ds-combo__heading:visible')).toHaveText('Desktops');
  // Nothing found: the list part hides, the status says so, the popup stays.
  await input.fill('nothing like this');
  await expect(demo.locator('.ds-combo__list')).toBeHidden();
  await expect(demo.locator('.ds-combo__status')).toHaveText('No model matches');
  await expect(demo.locator('.ds-combo__popup')).toBeVisible();
});

test('hidden options, groups and the clear button go without .ds-base too', async ({ page }) => {
  await open(page);
  const display = await page.evaluate(() => {
    document.documentElement.classList.remove('ds-base');
    const host = document.querySelector('#fx-component');
    host.insertAdjacentHTML('beforeend', '<div class="ds-combo" id="nb"><input class="ds-input ds-combo__input" role="combobox" aria-label="X" aria-expanded="false"><button class="ds-combo__clear" type="button" aria-label="Clear" hidden></button><div class="ds-combo__popup" style="position: static"><div class="ds-combo__list" role="listbox" aria-label="X"><ul class="ds-combo__group" role="group" aria-label="A"><li class="ds-combo__option" role="option" aria-selected="false" hidden id="nb-o"></li></ul></div></div></div>');
    const read = (selector) => getComputedStyle(document.querySelector(selector)).display;
    return [read('#nb-o'), read('#nb .ds-combo__group'), read('#nb .ds-combo__clear')];
  });
  expect(display).toEqual(['none', 'none', 'none']);
});

test('a description wraps, a meta line stays on one; both take the ink of a chosen option', async ({ page }) => {
  await open(page);
  const demo = page.locator('[data-demo="grouped"]');
  await demo.evaluate((el) => { el.style.maxWidth = '240px'; });
  const input = demo.locator('.ds-combo__input');
  await input.focus();
  await page.keyboard.press('ArrowDown');
  await settle(page);
  const first = demo.locator('.ds-combo__option').first();
  const description = first.locator('.ds-combo__description');
  const wrapped = await description.evaluate((el) => el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight));
  expect(wrapped).toBeGreaterThanOrEqual(2);
  expect(await page.locator('[data-demo="plain"] .ds-combo__meta').first().evaluate((el) => getComputedStyle(el).whiteSpace)).toBe('nowrap');
  const inked = await first.evaluate((option) => {
    option.setAttribute('aria-selected', 'true');
    const read = (selector) => getComputedStyle(option.querySelector(selector));
    const probe = document.createElement('span');
    probe.style.color = 'var(--ds-on-accent)';
    option.append(probe);
    const ink = getComputedStyle(probe).color;
    probe.remove();
    return { ink, name: read('.ds-combo__name').color, weight: read('.ds-combo__name').fontWeight, description: read('.ds-combo__description').color };
  });
  expect(inked.name).toBe(inked.ink);
  expect(inked.description).toBe(inked.ink);
  expect(inked.weight).toBe('500');
});

test('the keys of the combobox: open, walk, choose, Escape; focus stays in the field', async ({ page }) => {
  await open(page);
  const demo = page.locator('[data-demo="plain"]');
  const input = demo.getByRole('combobox', { name: 'Model' });
  await input.focus();
  await page.keyboard.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await expect(input).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  const active = demo.locator('.ds-combo__option[data-active]');
  await expect(active.locator('.ds-combo__name')).toHaveText('Latitude 7440');
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('Latitude 7440');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).toBeFocused();
  // The toggle is out of the tab order, and it has a name.
  await expect(demo.getByRole('button', { name: 'Show all' })).toHaveAttribute('tabindex', '-1');
});

test('the keys of a select-only combobox: open on the choice, skip the blocked one, type ahead, choose', async ({ page }) => {
  await open(page);
  const field = page.locator('.ds-combo--select').first();
  const button = field.getByRole('combobox');
  await expect(button).toHaveAccessibleName(/Plan.*Standard/);
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(field.locator('.ds-combo__option[data-active] .ds-combo__name')).toHaveText('Standard');
  // ArrowDown passes Premium (aria-disabled); Home and End go to the ends.
  await page.keyboard.press('ArrowDown');
  await expect(field.locator('.ds-combo__option[data-active] .ds-combo__name')).toHaveText('Team');
  await page.keyboard.press('Home');
  await expect(field.locator('.ds-combo__option[data-active] .ds-combo__name')).toHaveText('Basic');
  await page.keyboard.press('End');
  await expect(field.locator('.ds-combo__option[data-active] .ds-combo__name')).toHaveText('Team');
  await page.keyboard.press('b');
  await expect(field.locator('.ds-combo__option[data-active] .ds-combo__name')).toHaveText('Basic');
  await page.keyboard.press(' ');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(field.locator('.ds-combo__value')).toHaveText('Basic');
  await expect(button).toBeFocused();
  // The value and its meta end in an ellipsis instead of widening the field.
  expect(await field.locator('.ds-combo__value').evaluate((el) => getComputedStyle(el).textOverflow)).toBe('ellipsis');
});

test('the clear button shows with text, sits in the tab order and has the ring; the field keeps room only while it shows', async ({ page }) => {
  await open(page);
  const demo = page.locator('[data-demo="clearable"]');
  const input = demo.locator('.ds-combo__input');
  const clear = demo.getByRole('button', { name: 'Clear model' });
  await expect(clear).toBeHidden();
  expect(await input.evaluate((el) => getComputedStyle(el).paddingInlineEnd)).toBe('44px');
  await input.fill('Lat');
  await expect(clear).toBeVisible();
  expect(await input.evaluate((el) => getComputedStyle(el).paddingInlineEnd)).toBe('84px');
  await input.focus();
  await page.keyboard.press('Tab');
  await expect(clear).toBeFocused();
  const ring = await clear.evaluate((el) => {
    const style = getComputedStyle(el);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth), layer: getComputedStyle(el, '::before').opacity };
  });
  expect(ring.style).toBe('solid');
  expect(ring.width).toBe(2);
  expect(Number(ring.layer)).toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('');
  await expect(clear).toBeHidden();
  await expect(input).toBeFocused();
});

test('the clear button is a ripple host with a press of its own', async ({ page }) => {
  await open(page);
  const demo = page.locator('[data-demo="clearable"]');
  await demo.locator('.ds-combo__input').fill('Lat');
  const clear = demo.locator('.ds-combo__clear');
  const box = await clear.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(clear.locator('.ds-press-ripple')).toHaveCount(1);
  await page.mouse.up();
});

test('the create option shows when no option matches exactly, names the text, and is reached by the keys', async ({ page }) => {
  await open(page);
  const demo = page.locator('[data-demo="clearable"]');
  const input = demo.locator('.ds-combo__input');
  const create = demo.locator('.ds-combo__option--create');
  await input.focus();
  await page.keyboard.press('ArrowDown');
  await expect(create).toBeHidden();
  await input.fill('Latitude 7450');
  await expect(create).toBeVisible();
  await expect(create.getByText('Create "Latitude 7450"')).toBeVisible();
  await expect(create.locator('svg')).toHaveCount(1);
  await page.keyboard.press('ArrowDown');
  await expect(create).toHaveAttribute('data-active', '');
  const inks = await create.evaluate((el) => [getComputedStyle(el.querySelector('.ds-combo__name')).color, getComputedStyle(el).color]);
  expect(inks[0]).toBe(inks[1]);
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('Latitude 7450');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  // An exact name creates nothing.
  await input.fill('Latitude 7440');
  await expect(create).toBeHidden();
});

test('several values: chips in the box, the list stays open, Backspace and the chip remove one, the box shows the focus', async ({ page }) => {
  await open(page);
  const combo = page.locator('.ds-combo--multi').first();
  const input = combo.locator('.ds-combo__input');
  await expect(combo.locator('.ds-combo__list')).toHaveAttribute('aria-multiselectable', 'true');
  await combo.evaluate((el) => { el.style.maxWidth = '320px'; });
  const atRest = await combo.boundingBox();
  expect(atRest.height).toBe(40);
  const before = await combo.evaluate((el) => getComputedStyle(el).boxShadow);
  await input.focus();
  // The box takes the ring at once; the field inside shows none.
  const focused = await combo.evaluate((el) => [getComputedStyle(el).boxShadow, getComputedStyle(el.querySelector('input')).boxShadow, getComputedStyle(el.querySelector('input')).outlineStyle]);
  expect(focused[0]).not.toBe(before);
  expect(focused[1]).toBe('none');
  expect(focused[2]).toBe('none');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await expect(combo.getByRole('button', { name: 'Remove Latitude 5430' })).toBeVisible();
  await expect(combo.locator('.ds-combo__option').first()).toHaveAttribute('aria-selected', 'true');
  for (let i = 0; i < 4; i += 1) {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
  }
  await expect(combo.locator('.ds-chip')).toHaveCount(5);
  // The box grows, the toggle stays on its first line and at its end.
  const grown = await combo.boundingBox();
  expect(grown.height).toBeGreaterThan(atRest.height);
  const toggle = await combo.locator('.ds-combo__toggle').boundingBox();
  expect(Math.abs(toggle.y - grown.y)).toBeLessThanOrEqual(1);
  // The chips never run under the toggle.
  const right = await combo.locator('.ds-chip').evaluateAll((chips) => Math.max(...chips.map((chip) => chip.getBoundingClientRect().right)));
  expect(right).toBeLessThanOrEqual(toggle.x + 1);
  await page.keyboard.press('Backspace');
  await expect(combo.locator('.ds-chip')).toHaveCount(4);
  await combo.getByRole('button', { name: 'Remove Latitude 5430' }).click();
  await expect(combo.locator('.ds-chip')).toHaveCount(3);
  await expect(input).toBeFocused();
});

test('states: a disabled field takes its toggle with it; an error on the box of several values', async ({ page }) => {
  await open(page);
  const disabled = page.locator('.ds-combo').filter({ has: page.locator('input:disabled') }).first();
  const toggle = disabled.locator('.ds-combo__toggle');
  expect(await toggle.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
  const invalid = page.locator('.ds-combo').filter({ has: page.locator('input[aria-invalid="true"]') }).first();
  await expect(invalid.locator('input')).toHaveAccessibleName('With an error');
  await expect(invalid.locator('input')).toHaveAccessibleDescription(/Choose one of the models/);
  const colours = await page.evaluate(() => {
    const combo = document.querySelector('.ds-combo--multi');
    const input = combo.querySelector('input');
    const probe = document.createElement('span');
    probe.style.color = 'var(--ds-error)';
    combo.append(probe);
    const error = getComputedStyle(probe).color;
    probe.remove();
    input.setAttribute('aria-invalid', 'true');
    return new Promise((resolve) => {
      Promise.all(combo.getAnimations().map((animation) => animation.finished.catch(() => null))).then(() => {
        resolve({ error, border: getComputedStyle(combo).borderTopColor });
      });
    });
  });
  expect(colours.border).toBe(colours.error);
  // Disabled: the quiet surface on the box, nothing of its own on the field inside.
  const quiet = await page.evaluate(() => {
    const combo = document.querySelector('.ds-combo--multi');
    const input = combo.querySelector('input');
    input.removeAttribute('aria-invalid');
    input.disabled = true;
    const probe = document.createElement('span');
    probe.style.backgroundColor = 'var(--ds-surface-low)';
    document.querySelector('.ds-theme').append(probe);
    const surface = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return Promise.all(combo.getAnimations().concat(input.getAnimations()).map((animation) => animation.finished.catch(() => null))).then(() => ({ surface, box: getComputedStyle(combo).backgroundColor, field: getComputedStyle(input).backgroundColor, toggle: getComputedStyle(combo.querySelector('.ds-combo__toggle')).pointerEvents }));
  });
  expect(quiet.box).toBe(quiet.surface);
  expect(quiet.field).toBe('rgba(0, 0, 0, 0)');
  expect(quiet.toggle).toBe('none');
});

test('forced colours: the chosen option, the active one, a blocked one, the list\'s edge and the box of several values', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const read = await page.evaluate(() => {
    const probe = (property, value) => {
      const el = document.createElement('span');
      el.style.forcedColorAdjust = 'none';
      el.style[property] = value;
      document.querySelector('.ds-theme').append(el);
      const colour = getComputedStyle(el)[property];
      el.remove();
      return colour;
    };
    const system = { selected: probe('backgroundColor', 'SelectedItem'), selectedText: probe('color', 'SelectedItemText'), highlight: probe('outlineColor', 'Highlight'), canvasText: probe('outlineColor', 'CanvasText'), grayText: probe('color', 'GrayText') };
    const list = [...document.querySelectorAll('[aria-label="Option states"] .ds-combo__option')];
    const style = (el) => getComputedStyle(el);
    const multi = document.querySelector('.ds-combo--multi');
    multi.querySelector('input').focus();
    return {
      system,
      active: style(list[1]).outlineColor,
      chosen: [style(list[2]).backgroundColor, style(list[2]).color, style(list[2].querySelector('.ds-combo__name')).color, style(list[2].querySelector('.ds-combo__description')).color],
      chosenActive: style(list[3]).outlineColor,
      blocked: style(list[4]).color,
      popup: [style(document.querySelector('.ds-combo__popup[style]')).outlineStyle, parseFloat(style(document.querySelector('.ds-combo__popup[style]')).outlineWidth)],
      box: [style(multi).borderTopStyle, style(multi).borderTopColor],
    };
  });
  expect(read.active).toBe(read.system.highlight);
  expect(read.chosen[0]).toBe(read.system.selected);
  expect(read.chosen.slice(1)).toEqual([read.system.selectedText, read.system.selectedText, read.system.selectedText]);
  expect(read.chosenActive).toBe(read.system.canvasText);
  expect(read.blocked).toBe(read.system.grayText);
  expect(read.popup).toEqual(['solid', 1]);
  expect(read.box).toEqual(['solid', read.system.highlight]);
});
