/**
 * The file field, the drop zone and the grip on the options model (3.0): the
 * file field and its button at every size x density, with and without
 * .ds-touch; the zone's padding, disc and title by option; the shape at rest
 * and pressed; the zone in one row; the error state; the keyboard (the zone's
 * ring for its hidden input, the keys of a grip), names and roles; forced
 * colours. The 2.x behaviour stays in test/browser/dropzone.spec.js and
 * sortable.spec.js. Runs on the generated fixture of the demo, and in the
 * `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=drag');
  await ready(page);
  await page.mouse.move(1, 1);
}

const ZONE = (cls, inline) => `<label class="ds-dropzone${inline ? ' ds-dropzone--inline' : ''} ${cls}"><input class="ds-dropzone__input" type="file"><span class="ds-dropzone__disc" aria-hidden="true"></span><span class="ds-dropzone__title"><span class="ds-dropzone__idle">Drop</span><span class="ds-dropzone__over" aria-hidden="true">Release</span></span><span class="ds-dropzone__hint">Hint</span></label>`;

const finish = (page, selector) => page.$eval(selector, (el) => Promise.all(el.getAnimations().map((animation) => animation.finished.catch(() => null))).then(() => undefined));

test('the file field and its button at every size x density; .ds-touch as a minimum', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const main = document.querySelector('#fx-component');
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        const region = document.createElement('div');
        region.className = `${density}${touch ? ' ds-touch' : ''}`;
        main.append(region);
        for (const [size] of sizes) {
          region.insertAdjacentHTML('beforeend', `<input class="ds-input ${size}" type="file" aria-label="Measured">`);
          const el = region.lastElementChild;
          const button = getComputedStyle(el, '::file-selector-button');
          out.push({ touch, density, size, field: el.getBoundingClientRect().height, button: parseFloat(button.blockSize || button.height), line: parseFloat(button.lineHeight), font: parseFloat(button.fontSize) });
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES });
  expect(measured).toHaveLength(SIZES.length * DENSITIES.length * 2);
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const name = `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`;
    const button = Math.max(32 + step * 8 + density * 4, entry.line);
    // The button: 32px at md and comfortable, the field's steps, never less than its own line; the field never less than 24px.
    expect(entry.button, `${name} button`).toBeCloseTo(button, 0);
    if (entry.touch) expect(entry.field, `${name} field`).toBeGreaterThanOrEqual(TOUCH - 0.5);
    else expect(entry.field, `${name} field`).toBeCloseTo(Math.max(40 + step * 8 + density * 4, 24), 0);
  }
  const fonts = Object.fromEntries(measured.filter((entry) => !entry.touch && entry.density === 'ds-density-comfortable').map((entry) => [entry.size, entry.font]));
  expect(fonts).toEqual({ 'ds-xs': 12, 'ds-sm': 14, 'ds-md': 14, 'ds-lg': 16, 'ds-xl': 16 });
});

test('the zone: padding and gap by density, the disc and the title by size, one row, at least the touch target', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities, zone }) => {
    const main = document.querySelector('#fx-component');
    const out = [];
    for (const [density] of densities) {
      const region = document.createElement('div');
      region.className = density;
      main.append(region);
      for (const [size] of sizes) {
        region.insertAdjacentHTML('beforeend', zone.replace('${cls}', size));
        const el = region.lastElementChild;
        const style = getComputedStyle(el);
        const disc = el.querySelector('.ds-dropzone__disc').getBoundingClientRect();
        out.push({ density, size, padding: parseFloat(style.paddingTop), side: parseFloat(style.paddingInlineStart), gap: parseFloat(style.rowGap), disc: [disc.width, disc.height], font: parseFloat(getComputedStyle(el.querySelector('.ds-dropzone__title')).fontSize) });
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES, zone: ZONE('${cls}') });
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const name = `${entry.size} ${entry.density}`;
    expect(entry.padding, `${name} padding`).toBe(24 + density * 2);
    expect(entry.side, `${name} side`).toBe(20);
    expect(entry.gap, `${name} gap`).toBe(8 + density * 2);
    expect(entry.disc, `${name} disc`).toEqual([48 + step * 8, 48 + step * 8]);
  }
  const fonts = Object.fromEntries(measured.filter((entry) => entry.density === 'ds-density-comfortable').map((entry) => [entry.size, entry.font]));
  expect(fonts).toEqual({ 'ds-xs': 12, 'ds-sm': 14, 'ds-md': 14, 'ds-lg': 16, 'ds-xl': 16 });

  // One row: disc, words and hint on a line; the disc 32px at md, never less than its icon.
  const inline = await page.evaluate((zone) => {
    const main = document.querySelector('#fx-component');
    main.insertAdjacentHTML('beforeend', `<div class="ds-touch ds-density-tight" style="width: 720px">${zone.replace('${cls}', 'ds-xs')}</div>`);
    const small = main.lastElementChild.firstElementChild;
    main.insertAdjacentHTML('beforeend', `<div style="width: 720px">${zone.replace('${cls}', '')}</div>`);
    const plain = main.lastElementChild.firstElementChild;
    const top = (el, selector) => el.querySelector(selector).getBoundingClientRect();
    const disc = top(plain, '.ds-dropzone__disc');
    const title = top(plain, '.ds-dropzone__title');
    const hint = top(plain, '.ds-dropzone__hint');
    return {
      touch: small.getBoundingClientRect().height,
      smallDisc: top(small, '.ds-dropzone__disc').width,
      disc: disc.width,
      inRow: Math.abs((disc.top + disc.bottom) / 2 - (title.top + title.bottom) / 2) < 1 && Math.abs((hint.top + hint.bottom) / 2 - (title.top + title.bottom) / 2) < 1,
      hintAtEnd: plain.getBoundingClientRect().right - hint.right,
    };
  }, ZONE('${cls}', true));
  expect(inline.touch).toBeGreaterThanOrEqual(TOUCH - 0.5);
  expect(inline.smallDisc).toBe(24);
  expect(inline.disc).toBe(32);
  expect(inline.inRow).toBe(true);
  expect(inline.hintAtEnd).toBeLessThanOrEqual(14);
});

test('shape: the zone at rest and pressed, its disc, the file button', async ({ page }) => {
  await open(page);
  await page.evaluate((zone) => {
    const host = document.querySelector('#fx-component');
    for (const shape of ['square', 'soft', 'default', 'round']) {
      host.insertAdjacentHTML('beforeend', `<div class="ds-shape-${shape}" id="shape-${shape}">${zone.replace('${cls}', '')}<input class="ds-input" type="file" aria-label="Measured"></div>`);
    }
  }, ZONE('${cls}'));
  const card = await page.evaluate(() => {
    const read = (value) => {
      const probe = document.createElement('div');
      probe.style.borderRadius = value;
      document.querySelector('.ds-theme').append(probe);
      const radius = parseFloat(getComputedStyle(probe).borderTopLeftRadius);
      probe.remove();
      return radius;
    };
    return { rest: read('var(--ds-radius-card)'), pressed: read('var(--ds-radius-card-pressed)') };
  });
  for (const [shape, factor] of [['square', 0], ['soft', 0.5], ['default', 1], ['round', 1.5]]) {
    const zone = `#shape-${shape} .ds-dropzone`;
    const read = () => page.$eval(zone, (el) => ({
      zone: parseFloat(getComputedStyle(el).borderTopLeftRadius),
      disc: parseFloat(getComputedStyle(el.querySelector('.ds-dropzone__disc')).borderTopLeftRadius),
      file: parseFloat(getComputedStyle(el.parentElement.querySelector('.ds-input'), '::file-selector-button').borderTopLeftRadius),
    }));
    const rest = await read();
    expect(rest.zone, `${shape} zone`).toBeCloseTo(card.rest * factor, 1);
    // A circle at the default and above; the file button a pill at the default and above.
    expect(rest.disc, `${shape} disc`).toBeCloseTo(Math.min(24 * factor, 24), 1);
    expect(rest.file, `${shape} file button`).toBeCloseTo(Math.min(16 * factor, 16), 1);
    await page.$eval(zone, (el) => el.classList.add('ds-pressed'));
    await finish(page, zone);
    expect((await read()).zone, `${shape} pressed`).toBeCloseTo(Math.min(card.pressed * factor, card.rest * factor), 1);
  }
});

test('the zone\'s states: dragged over and disabled keep their looks; a file over a limit shows the error edge and words', async ({ page }) => {
  await open(page);
  const colours = await page.evaluate(() => {
    const probe = (value) => {
      const el = document.createElement('span');
      el.style.color = value;
      document.querySelector('.ds-theme').append(el);
      const colour = getComputedStyle(el).color;
      el.remove();
      return colour;
    };
    return { error: probe('var(--ds-error)'), ink: probe('var(--ds-on-error-container)'), hint: probe('var(--ds-text-2)') };
  });
  const invalid = page.locator('.ds-dropzone').filter({ has: page.locator('input[aria-invalid="true"]') });
  const read = await invalid.evaluate((el) => {
    const style = getComputedStyle(el);
    return { border: style.borderTopColor, line: style.borderTopStyle, hint: getComputedStyle(el.querySelector('.ds-dropzone__hint')).color, words: el.querySelector('.ds-dropzone__hint').textContent };
  });
  expect(read).toEqual({ border: colours.error, line: 'solid', hint: colours.ink, words: 'report.csv is over the 10 MB limit' });
  await expect(invalid.locator('input')).toHaveAccessibleDescription(/over the 10 MB limit/);
  // A plain zone keeps the dashed edge and the quiet hint.
  const plain = page.locator('[data-demo="zone"]');
  const quiet = await plain.evaluate((el) => [getComputedStyle(el).borderTopStyle, getComputedStyle(el.querySelector('.ds-dropzone__hint')).color]);
  expect(quiet).toEqual(['dashed', colours.hint]);
  // Dragged over: the words of the drop state.
  const over = page.locator('.ds-dropzone[data-ds-dragover]');
  await settle(page);
  expect(await over.locator('.ds-dropzone__over').evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  // Disabled: through its input.
  const off = page.locator('.ds-dropzone').filter({ has: page.locator('input:disabled') });
  expect(await off.evaluate((el) => getComputedStyle(el).cursor)).toBe('not-allowed');
});

test('keyboard: Tab reaches the zone\'s input, the ring shows on the zone; the name comes from its label', async ({ page }) => {
  await open(page);
  const zone = page.locator('[data-demo="zone"]');
  const input = zone.locator('input');
  await expect(input).toHaveAccessibleName(/Drop CSV files here or browse/);
  // The first tab stop of the demo.
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused();
  const ring = await zone.evaluate((el) => {
    const style = getComputedStyle(el);
    return [style.outlineStyle, parseFloat(style.outlineWidth)];
  });
  expect(ring).toEqual(['solid', 2]);
});

test('keyboard: the keys of a grip move its row, keep the focus and say so; every grip has a name', async ({ page }) => {
  await open(page);
  const rows = page.locator('[data-demo="rows"]');
  const out = page.locator('[data-demo="rows-out"]');
  await expect(rows.getByRole('button')).toHaveCount(4);
  const grip = rows.getByRole('button', { name: 'Move Back up the database' });
  await grip.focus();
  await page.keyboard.press('ArrowDown');
  await expect(out).toHaveText('Order: 2, 1, 3, 4');
  await expect(grip).toBeFocused();
  await settle(page);
  await page.keyboard.press('End');
  await expect(out).toHaveText('Order: 2, 3, 4, 1');
  await settle(page);
  await page.keyboard.press('Home');
  await expect(out).toHaveText('Order: 1, 2, 3, 4');
  await expect(grip).toBeFocused();
  // The grip takes touch from the button it is, and density leaves it alone (an icon button).
  const size = await page.evaluate(() => {
    const row = document.querySelector('[data-demo="rows"]');
    const read = () => row.querySelector('.ds-grip').getBoundingClientRect().height;
    const rest = read();
    row.classList.add('ds-density-tight');
    const dense = read();
    row.classList.add('ds-touch');
    return [rest, dense, read()];
  });
  expect(size[0]).toBe(40);
  expect(size[1]).toBe(40);
  expect(size[2]).toBeGreaterThanOrEqual(TOUCH - 0.5);
});

test('the chosen files: a named list with a named progress bar and a remove button, which removes through flip()', async ({ page }) => {
  await open(page);
  const list = page.getByRole('list', { name: 'Chosen files' });
  await expect(list.getByRole('listitem')).toHaveCount(2);
  await expect(list.getByRole('progressbar', { name: 'Upload of devices.csv' })).toHaveAttribute('aria-valuenow', '30');
  await list.getByRole('button', { name: 'Remove owners.csv' }).click();
  await expect(list.getByRole('listitem')).toHaveCount(1);
});

test('forced colours: the zone\'s edge, the file button, the dragged row, and blocked in GrayText', async ({ page, browserName }) => {
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
    const system = { buttonText: probe('borderTopColor', 'ButtonText'), highlight: probe('borderTopColor', 'Highlight'), grayText: probe('color', 'GrayText') };
    const style = (el, pseudo) => getComputedStyle(el, pseudo);
    const row = document.querySelector('[data-demo="rows"] li');
    row.setAttribute('data-ds-dragging', '');
    const file = document.querySelector('.ds-input[type="file"]:not(:disabled)');
    const locked = document.querySelector('.ds-input[type="file"]:disabled');
    return {
      system,
      zone: [style(document.querySelector('[data-demo="zone"]')).borderTopStyle, style(document.querySelector('[data-demo="zone"]')).borderTopColor],
      over: style(document.querySelector('.ds-dropzone[data-ds-dragover]')).borderTopColor,
      blocked: style([...document.querySelectorAll('.ds-dropzone')].find((el) => el.querySelector('input:disabled'))).color,
      fileButton: style(file, '::file-selector-button').borderTopStyle,
      lockedButton: style(locked, '::file-selector-button').color,
      dragged: [style(row).outlineStyle, style(row).outlineColor],
    };
  });
  expect(read.zone).toEqual(['dashed', read.system.buttonText]);
  expect(read.over).toBe(read.system.highlight);
  expect(read.blocked).toBe(read.system.grayText);
  expect(read.fileButton).toBe('solid');
  expect(read.lockedButton).toBe(read.system.grayText);
  expect(read.dragged[0]).toBe('solid');
  expect(read.dragged[1]).toBe(read.system.highlight);
});
