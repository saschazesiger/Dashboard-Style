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

/** The box of several values, empty. */
const MULTI = (cls) => `<div class="ds-combo ds-combo--multi ${cls}"><input class="ds-input ds-combo__input" role="combobox" aria-label="Measured" aria-expanded="false"><button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all"></button></div>`;

test('the field, its toggle and an option at every size x density; .ds-touch as a minimum over both', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities, markup, multi }) => {
    const main = document.querySelector('#fx-component');
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        const region = document.createElement('div');
        region.className = `${density}${touch ? ' ds-touch' : ''}`;
        main.append(region);
        for (const [size] of sizes) {
          region.insertAdjacentHTML('beforeend', multi.replace('${cls}', size));
          const box = region.lastElementChild;
          const multiBox = box.getBoundingClientRect().height;
          const multiToggle = box.querySelector('.ds-combo__toggle').getBoundingClientRect().height;
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
            multi: [multiBox, multiToggle],
          });
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES, markup: MARKUP('${cls}'), multi: MULTI('${cls}') });
  expect(measured).toHaveLength(SIZES.length * DENSITIES.length * 2);
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const name = `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`;
    // 40px at md and comfortable, 8px per size step, 4px per density step, at least 24px for the icon of the toggle.
    const box = Math.max(entry.touch ? TOUCH : 0, 24, 40 + step * 8 + density * 4);
    // Touch wins over size and density, as a minimum: it adds nothing to a step already above it.
    expect(entry.toggle[1], `${name} toggle`).toBeCloseTo(box, 0);
    expect(entry.field, `${name} field`).toBeCloseTo(Math.max(box, entry.line), 0);
    // The box of several values, empty: the same height as the field, and its toggle fills it.
    expect(entry.multi, `${name} several values`).toEqual([box, box]);
    // One height: the toggle and the clear button are as tall as the field and square, and the field keeps room for both.
    expect(entry.toggle[0], `${name} toggle width`).toBeCloseTo(entry.toggle[1], 0);
    expect(entry.clear, `${name} clear`).toEqual(entry.toggle);
    expect(entry.end, `${name} room`).toBeCloseTo(4 + 2 * entry.toggle[0], 0);
    // An option: 48px at md and comfortable, the same steps, the padding 2px per density step, never less than its text.
    const content = 2 * entry.padding + entry.nameLine;
    expect(entry.option, `${name} option`).toBeCloseTo(Math.max(entry.touch ? TOUCH : 0, 48 + step * 8 + density * 4, content), 0);
    expect(entry.padding, `${name} padding`).toBeCloseTo(8 + density * 2, 0);
  }
  // Type changes with size only, and an option at rest stays at the regular weight.
  const fonts = Object.fromEntries(measured.filter((entry) => !entry.touch && entry.density === 'ds-density-comfortable').map((entry) => [entry.size, entry.nameSize]));
  expect(fonts).toEqual({ 'ds-xs': 12, 'ds-sm': 14, 'ds-md': 14, 'ds-lg': 16, 'ds-xl': 16 });
  expect(new Set(measured.map((entry) => entry.nameWeight))).toEqual(new Set(['400']));
});

test('the real .ds-touch rule adds nothing to a step above the target', async ({ page }) => {
  await open(page);
  const heights = await page.evaluate((multi) => {
    const host = document.querySelector('#fx-component');
    host.insertAdjacentHTML('beforeend', `<div class="ds-touch">${multi.replace('${cls}', 'ds-lg')}</div>`);
    const box = host.lastElementChild.firstElementChild;
    return [box.getBoundingClientRect().height, box.querySelector('.ds-combo__toggle').getBoundingClientRect().height];
  }, MULTI('${cls}'));
  expect(heights).toEqual([TOUCH, TOUCH]);
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
  await expect(list.getByRole('group', { name: 'Desktops' }).getByRole('option', { name: /Mini desktop/ })).toBeVisible();
  // A heading is no option, and the keys walk past it.
  await expect(list.getByRole('option', { name: 'Laptops', exact: true })).toHaveCount(0);
  await page.keyboard.press('ArrowDown');
  const first = demo.locator('.ds-combo__option[data-active]');
  await expect(first.locator('.ds-combo__name')).toHaveText('Laptop 14');
  for (let i = 0; i < 3; i += 1) await page.keyboard.press('ArrowDown');
  await expect(demo.locator('.ds-combo__option[data-active] .ds-combo__name')).toHaveText('Field tablet');
  await expect(demo.locator('.ds-combo__heading[data-active]')).toHaveCount(0);
  expect(await input.getAttribute('aria-activedescendant')).toBe(await demo.locator('.ds-combo__option[data-active]').getAttribute('id'));
  // Every group but the first has its line.
  const lines = await demo.locator('.ds-combo__group').evaluateAll((groups) => groups.map((group) => parseFloat(getComputedStyle(group).borderTopWidth)));
  expect(lines).toEqual([0, 1, 1]);
  // A group hidden as a whole counts as gone too: the line moves off the group that is now the first.
  const afterHidden = await demo.locator('.ds-combo__group').evaluateAll((groups) => {
    groups[0].hidden = true;
    const widths = groups.slice(1).map((group) => parseFloat(getComputedStyle(group).borderTopWidth));
    groups[0].hidden = false;
    return widths;
  });
  expect(afterHidden).toEqual([0, 1]);
  // A filter hides options only; the groups with none left go, and the line never stands over the first that shows.
  await input.fill('mini');
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
  await expect(active.locator('.ds-combo__name')).toHaveText('Laptop 14');
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('Laptop 14');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', /.+/);
  await page.keyboard.press('Escape');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).toBeFocused();
  // A closed list has no active option, on Escape and on blur.
  await expect(input).not.toHaveAttribute('aria-activedescendant');
  await expect(demo.locator('.ds-combo__option[data-active]')).toHaveCount(0);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', /.+/);
  await input.blur();
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).not.toHaveAttribute('aria-activedescendant');
  await expect(demo.locator('.ds-combo__option[data-active]')).toHaveCount(0);
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
  // Escape leaves no active option behind.
  await page.keyboard.press('Enter');
  await expect(button).toHaveAttribute('aria-activedescendant', /.+/);
  await page.keyboard.press('Escape');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).not.toHaveAttribute('aria-activedescendant');
  await expect(field.locator('.ds-combo__option[data-active]')).toHaveCount(0);
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
  await input.fill('Lap');
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
  await demo.locator('.ds-combo__input').fill('Lap');
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
  await input.fill('Laptop 15');
  await expect(create).toBeVisible();
  await expect(create.getByText('Create "Laptop 15"')).toBeVisible();
  await expect(create.locator('svg')).toHaveCount(1);
  await page.keyboard.press('ArrowDown');
  await expect(create).toHaveAttribute('data-active', '');
  const inks = await create.evaluate((el) => [getComputedStyle(el.querySelector('.ds-combo__name')).color, getComputedStyle(el).color]);
  expect(inks[0]).toBe(inks[1]);
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('Laptop 15');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  // An exact name creates nothing.
  await input.fill('Laptop 14');
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
  await expect(combo.getByRole('button', { name: 'Remove Laptop 13' })).toBeVisible();
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
  await combo.getByRole('button', { name: 'Remove Laptop 13' }).click();
  await expect(combo.locator('.ds-chip')).toHaveCount(3);
  await expect(input).toBeFocused();
  // Escape leaves no active option behind. The press on the chip took the focus, so the list closed: the first arrow
  // opens it, the next one moves.
  await page.keyboard.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', /.+/);
  await page.keyboard.press('Escape');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).not.toHaveAttribute('aria-activedescendant');
  await expect(combo.locator('.ds-combo__option[data-active]')).toHaveCount(0);
});

test('several values: a press on an empty part of the box goes to the field', async ({ page }) => {
  await open(page);
  const combo = page.locator('[data-demo="multi"]');
  const input = combo.locator('.ds-combo__input');
  await combo.evaluate((el) => { el.style.maxWidth = '320px'; });
  await input.focus();
  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press('ArrowDown');
    if (i === 0) await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
  }
  await input.blur();
  await expect(input).not.toBeFocused();
  // A point of the box itself: beside the chips, where nothing else takes the press.
  const point = await combo.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    for (let y = rect.top + 1; y < rect.bottom; y += 1) {
      for (let x = rect.left + 1; x < rect.right; x += 1) {
        if (document.elementFromPoint(x, y) === el) return { x, y, cursor: getComputedStyle(el).cursor };
      }
    }
    return null;
  });
  expect(point.cursor).toBe('text');
  await page.mouse.click(point.x, point.y);
  await expect(input).toBeFocused();
  // The status line under it is no field.
  expect(await combo.locator('.ds-combo__status').evaluate((el) => getComputedStyle(el).cursor)).toBe('default');
});

test('read-only several values: the box shows the look of a read-only field, and its hover stays quiet', async ({ page }) => {
  await open(page);
  const combo = page.locator('[data-demo="multi"]');
  const read = await combo.evaluate((el) => {
    const field = document.createElement('input');
    field.className = 'ds-input';
    field.readOnly = true;
    field.setAttribute('aria-label', 'Reference');
    el.parentElement.append(field);
    el.querySelector('input').readOnly = true;
    return Promise.all(el.getAnimations().map((animation) => animation.finished.catch(() => null))).then(() => ({
      box: [getComputedStyle(el).backgroundColor, getComputedStyle(el).borderTopColor],
      field: [getComputedStyle(field).backgroundColor, getComputedStyle(field).borderTopColor],
    }));
  });
  expect(read.box).toEqual(read.field);
  const box = await combo.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await finish(page, '[data-demo="multi"]');
  expect(await combo.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe(read.field[1]);
});

test('disabled: the clear button leaves the tab order and the room, the chips lose the pointer, and the demo\'s chips their keys', async ({ page }) => {
  await open(page);
  // The demo sets `disabled` on its chips, as the docs ask.
  const demo = page.locator('.ds-combo--multi').filter({ has: page.locator('input:disabled') });
  await expect(demo.locator('.ds-chip')).toBeDisabled();
  await page.evaluate(() => {
    document.querySelector('#fx-component').insertAdjacentHTML('afterbegin', `
      <button type="button" id="before">Before</button>
      <div class="ds-combo" id="off"><input class="ds-input ds-combo__input" role="combobox" aria-label="Off" aria-expanded="false" value="Laptop 14" disabled><button class="ds-combo__clear" type="button" aria-label="Clear" id="off-clear"></button><button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all"></button></div>
      <button type="button" id="between">Between</button>
      <div class="ds-combo ds-combo--multi" id="off-multi"><button class="ds-chip ds-chip--input" type="button" id="chip-open"><span class="ds-chip__body"><span class="ds-chip__label">Forgotten</span></span></button><button class="ds-chip ds-chip--input" type="button" id="chip-off" disabled><span class="ds-chip__body"><span class="ds-chip__label">Set</span></span></button><input class="ds-input ds-combo__input" role="combobox" aria-label="Off too" aria-expanded="false" disabled></div>
      <button type="button" id="after">After</button>`);
    window.chipClicks = 0;
    document.querySelector('#chip-open').addEventListener('click', () => { window.chipClicks += 1; });
  });
  // The clear button is out of the tab order, so Enter cannot empty the field, and the field keeps no room for it.
  await expect(page.locator('#off-clear')).toBeHidden();
  await page.locator('#before').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#between')).toBeFocused();
  expect(await page.locator('#off input').evaluate((el) => getComputedStyle(el).paddingInlineEnd)).toBe('44px');
  // A chip the page forgot takes no pointer; a chip with `disabled`, as the docs ask, takes no keys either.
  const chip = await page.locator('#chip-open').boundingBox();
  await page.mouse.click(chip.x + chip.width / 2, chip.y + chip.height / 2);
  expect(await page.evaluate(() => window.chipClicks)).toBe(0);
  await page.locator('#chip-open').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#after')).toBeFocused();
  // Disabled is one model: the box's surface and the toggle's ink fade on --ds-dur-fast.
  const fades = await page.evaluate(() => [getComputedStyle(document.querySelector('.ds-combo--multi')).transitionProperty, getComputedStyle(document.querySelector('.ds-combo__toggle')).transitionProperty]);
  expect(fades[0]).toContain('background-color');
  expect(fades[1]).toContain('color');
});

test('hover on the invalid box of several values: one edge, the box\'s, darker as on a single field', async ({ page }) => {
  await open(page);
  const combo = page.locator('[data-demo="multi"]');
  await combo.locator('input').evaluate((el) => el.setAttribute('aria-invalid', 'true'));
  const box = await combo.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await finish(page, '[data-demo="multi"]');
  await finish(page, '[data-demo="multi"] input');
  const read = await combo.evaluate((el) => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--ds-on-error-container)';
    el.append(probe);
    const ink = getComputedStyle(probe).color;
    probe.remove();
    return { ink, box: getComputedStyle(el).borderTopColor, field: getComputedStyle(el.querySelector('input')).borderTopStyle };
  });
  expect(read.box).toBe(read.ink);
  expect(read.field).toBe('none');
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

test('disabled is one model: a select-only button\'s value and meta take the ink of a disabled field', async ({ page }) => {
  await open(page);
  const inks = await page.evaluate(() => {
    const button = document.querySelector('[data-demo="select-disabled"] .ds-combo__input');
    const field = [...document.querySelectorAll('input.ds-combo__input:disabled')][0];
    return {
      field: getComputedStyle(field).color,
      value: getComputedStyle(button.querySelector('.ds-combo__value')).color,
      meta: getComputedStyle(button.querySelector('.ds-combo__meta')).color,
    };
  });
  expect(inks.value).toBe(inks.field);
  expect(inks.meta).toBe(inks.field);
});

test('an option both chosen and blocked reads as blocked, and keeps the tint of the choice', async ({ page }) => {
  await open(page);
  const read = await page.evaluate(() => {
    const list = [...document.querySelectorAll('[aria-label="Option states"] .ds-combo__option')];
    const [chosen, blocked, both] = [list[2], list[4], list[5]];
    const style = (el) => getComputedStyle(el);
    return {
      name: style(both.querySelector('.ds-combo__name')).color,
      meta: style(both.querySelector('.ds-combo__meta')).color,
      ink: style(blocked.querySelector('.ds-combo__name')).color,
      background: style(both).backgroundColor,
      tint: style(chosen).backgroundColor,
      weight: style(both.querySelector('.ds-combo__name')).fontWeight,
      chosenWeight: style(chosen.querySelector('.ds-combo__name')).fontWeight,
    };
  });
  expect(read.name).toBe(read.ink);
  expect(read.meta).toBe(read.ink);
  expect(read.background).toBe(read.tint);
  expect(read.weight).toBe(read.chosenWeight);
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
    const system = { selected: probe('backgroundColor', 'SelectedItem'), selectedText: probe('color', 'SelectedItemText'), highlight: probe('outlineColor', 'Highlight'), canvasText: probe('outlineColor', 'CanvasText'), grayText: probe('color', 'GrayText'), canvas: probe('backgroundColor', 'Canvas') };
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
      both: [style(list[5]).backgroundColor, style(list[5].querySelector('.ds-combo__name')).color, style(list[5]).outlineStyle, style(list[5]).outlineColor],
      popup: [style(document.querySelector('.ds-combo__popup[style]')).outlineStyle, parseFloat(style(document.querySelector('.ds-combo__popup[style]')).outlineWidth)],
      box: [style(multi).borderTopStyle, style(multi).borderTopColor],
      ring: [style(multi).outlineStyle, parseFloat(style(multi).outlineWidth), style(multi).outlineColor, parseFloat(style(multi).outlineOffset)],
      inner: style(multi.querySelector('input')).borderTopStyle,
    };
  });
  expect(read.active).toBe(read.system.highlight);
  expect(read.chosen[0]).toBe(read.system.selected);
  expect(read.chosen.slice(1)).toEqual([read.system.selectedText, read.system.selectedText, read.system.selectedText]);
  expect(read.chosenActive).toBe(read.system.canvasText);
  expect(read.blocked).toBe(read.system.grayText);
  // Chosen and blocked: GrayText has no contrast on SelectedItem, so no fill, and an edge for the choice.
  expect(read.both).toEqual([read.system.canvas, read.system.grayText, 'solid', read.system.grayText]);
  expect(read.popup).toEqual(['solid', 1]);
  expect(read.box).toEqual(['solid', read.system.highlight]);
  // The shadow of the focus ring is dropped and the field inside has no outline: the box takes one, as a single field has.
  expect(read.ring).toEqual(['solid', 2, read.system.highlight, -2]);
  // One box: the field inside draws none of its own, which a transparent border would be here.
  expect(read.inner).toBe('none');
});

/* ── Behaviour by the system: data-ds-combobox, DS.combobox (3.0) ───────── */

const sys = (page, name) => page.locator(`[data-demo="sys-${name}"]`);
const sysInput = (page, name) => sys(page, name).locator('.ds-combo__input');
const shownNames = (page, name) => sys(page, name).locator('.ds-combo__option:not([hidden]) .ds-combo__name').allTextContents();

test('by the system: a fuzzy filter, best first, the letters marked, the count in the status line', async ({ page }) => {
  await open(page);
  const input = sysInput(page, 'fuzzy');
  await input.click();
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.type('lp 16');
  await expect(sys(page, 'fuzzy').locator('.ds-combo__status')).toHaveText('1 result');
  expect(await shownNames(page, 'fuzzy')).toEqual(['Laptop 16', 'Create “lp 16”']);
  await expect(sys(page, 'fuzzy').locator('.ds-combo__option').first().locator('.ds-combo__match')).toHaveText(['L', 'p', '16']);
  const mark = await sys(page, 'fuzzy').locator('.ds-combo__match').first().evaluate((el) => getComputedStyle(el).textDecorationLine);
  expect(mark).toBe('underline');
  // ArrowDown walks, Enter chooses, the list closes, the field shows the name, ds:change tells the page.
  await page.keyboard.press('ArrowDown');
  const active = await input.getAttribute('aria-activedescendant');
  expect(await page.locator(`[id="${active}"] .ds-combo__name`).textContent()).toBe('Laptop 16');
  await page.keyboard.press('Enter');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).toHaveValue('Laptop 16');
  await expect(input).not.toHaveAttribute('aria-activedescendant');
  await expect(page.locator('[data-demo-out="sys-fuzzy"]')).toHaveText('Chosen: Laptop 16');
  await expect(input).toBeFocused();
});

test('by the system: nothing found keeps the list open and says so; the clear button empties field and value', async ({ page }) => {
  await open(page);
  const input = sysInput(page, 'fuzzy');
  const clear = sys(page, 'fuzzy').locator('.ds-combo__clear');
  await expect(clear).toBeHidden();
  await input.click();
  await page.keyboard.type('zzzz');
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await expect(sys(page, 'fuzzy').locator('.ds-combo__status')).toHaveText('No results');
  // Creatable: the one option left creates the text.
  expect(await shownNames(page, 'fuzzy')).toEqual(['Create “zzzz”']);
  await expect(clear).toBeVisible();
  await clear.click();
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
  await expect(clear).toBeHidden();
});

test('by the system: creating a value sends a cancelable ds:create, then chooses it', async ({ page }) => {
  await open(page);
  const input = sysInput(page, 'fuzzy');
  await page.evaluate(() => {
    window.created = [];
    document.querySelector('[data-demo="sys-fuzzy"]').addEventListener('ds:create', (event) => {
      window.created.push(event.detail.text);
      if (event.detail.text === 'No') event.preventDefault();
    });
  });
  await input.click();
  await page.keyboard.type('No');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('No');
  expect(await page.evaluate(() => DS.get(document.querySelector('[data-demo="sys-fuzzy"]'), 'combobox').get())).toBeNull();
  await input.fill('Tower 9');
  await page.locator('[data-demo="sys-fuzzy"] .ds-combo__option--create').click();
  await expect(input).toHaveValue('Tower 9');
  expect(await page.evaluate(() => [window.created, DS.get(document.querySelector('[data-demo="sys-fuzzy"]'), 'combobox').get()])).toEqual([['No', 'Tower 9'], 'Tower 9']);
});

test('by the system: a source asked after the pause, with a spinner and aria-busy, a newer query aborting the older one', async ({ page }) => {
  await open(page);
  const input = sysInput(page, 'remote');
  await page.evaluate(() => {
    window.searches = [];
    document.querySelector('[data-demo="sys-remote"]').addEventListener('ds:search', (event) => window.searches.push(event.detail.query));
  });
  await input.click();
  await expect(sys(page, 'remote').locator('.ds-combo__status')).toHaveText('Type to search');
  await page.keyboard.type('grace');
  await expect(sys(page, 'remote').locator('.ds-combo__list')).toHaveAttribute('aria-busy', 'true');
  await expect(sys(page, 'remote').locator('.ds-combo__status .ds-spinner')).toHaveCount(1);
  await expect(sys(page, 'remote').locator('.ds-combo__status')).toHaveText('1 result', { timeout: 5000 });
  await expect(sys(page, 'remote').locator('.ds-combo__list')).not.toHaveAttribute('aria-busy', 'true');
  expect(await shownNames(page, 'remote')).toEqual(['Grace Hopper']);
  await expect(sys(page, 'remote').locator('.ds-combo__match')).toHaveText(['Grace']);
  // One search for the typed word: the letters in between waited.
  expect(await page.evaluate(() => window.searches)).toEqual(['grace']);
  await page.keyboard.type('zz');
  await expect(sys(page, 'remote').locator('.ds-combo__status')).toHaveText('No results', { timeout: 5000 });
  await expect(sys(page, 'remote').locator('.ds-combo__list')).toBeHidden();
});

test('by the system: several values as chips, the list open, Backspace and a chip remove one, announced', async ({ page }) => {
  await open(page);
  const combo = sys(page, 'multi');
  const input = sysInput(page, 'multi');
  await expect(combo.locator('.ds-combo__list')).toHaveAttribute('aria-multiselectable', 'true');
  await input.click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await expect(combo.locator('.ds-chip')).toHaveText(['Remove Laptop 13', 'Remove Laptop 14']);
  await expect(combo.locator('[aria-selected="true"] .ds-combo__name')).toHaveText(['Laptop 13', 'Laptop 14']);
  await page.keyboard.press('Backspace');
  await expect(combo.locator('.ds-chip')).toHaveText(['Remove Laptop 13']);
  await expect(page.locator('.ds-toasts [aria-live], .ds-sr[aria-live]').filter({ hasText: 'Removed Laptop 14' })).toHaveCount(1);
  await combo.locator('.ds-chip').click();
  await expect(combo.locator('.ds-chip')).toHaveCount(0);
  await expect(input).toBeFocused();
  // Typing narrows, choosing empties the field again.
  await page.keyboard.type('mini');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('');
  expect(await page.evaluate(() => DS.get(document.querySelector('[data-demo="sys-multi"]'), 'combobox').get())).toEqual(['Mini desktop']);
});

test('by the system: 5,000 options windowed; the active one stays rendered and named', async ({ page }) => {
  await open(page);
  const combo = sys(page, 'many');
  const input = sysInput(page, 'many');
  await input.click();
  await expect(combo.locator('.ds-combo__status')).toHaveText('5,000 results');
  const rendered = await combo.locator('.ds-combo__option').count();
  expect(rendered).toBeLessThan(80);
  await expect(combo.locator('.ds-combo__option').first()).toHaveAttribute('aria-setsize', '5000');
  await page.keyboard.press('ArrowUp');
  const active = await input.getAttribute('aria-activedescendant');
  await expect(page.locator(`[id="${active}"]`)).toHaveAttribute('aria-posinset', '5000');
  await expect(page.locator(`[id="${active}"]`)).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('Monitor 5999');
});

test('by the system: Tab closes without choosing, Alt+ArrowDown opens without moving, Escape closes', async ({ page }) => {
  await open(page);
  const input = sysInput(page, 'fuzzy');
  await input.click();
  await page.keyboard.press('Escape');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Alt+ArrowDown');
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await expect(input).not.toHaveAttribute('aria-activedescendant');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).toHaveValue('');
});

test('single files: combobox.css without scroller.css still has the registered edge numbers of its fade', async ({ page, baseURL }) => {
  // tokens.css registers --ds-scroll-edge-start and -end (once, for every set of single files): a registered
  // <number> computes to its canonical form, an unregistered one would keep the text as written.
  const sheets = ['core/tokens.css', 'components/form.css', 'components/combobox.css'].map((file) => `<link rel="stylesheet" href="${baseURL}/dist/css/${file}">`).join('');
  await page.setContent(`<!doctype html>${sheets}<div class="ds-theme"><div class="ds-combo__list" style="--ds-scroll-edge-start: 0.50; --ds-scroll-edge-end: 1.0"></div></div>`, { waitUntil: 'load' });
  const values = await page.$eval('.ds-combo__list', (el) => [getComputedStyle(el).getPropertyValue('--ds-scroll-edge-start').trim(), getComputedStyle(el).getPropertyValue('--ds-scroll-edge-end').trim()]);
  expect(values).toEqual(['0.5', '1']);
  expect(await page.$$eval('link', (links) => links.map((link) => link.href).some((href) => href.includes('scroller')))).toBe(false);
});
