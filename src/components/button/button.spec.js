/**
 * The button on the options model (3.0, src/core/options.css, the
 * reference port of plans/3.0-conventions.md section 11): its height at
 * every size x density, with and without .ds-touch (touch wins, as a
 * minimum); the shape (square corners at 0, the pill at the default, the
 * press morph scaled with it); option classes that nest (a dense region in
 * a comfortable one, a comfortable island in the dense one); the filled
 * error button of a destructive confirmation (D10) and nothing else turned
 * red by a tone; the 2.x aliases (--primary, --sm); the new variants and
 * the failed face; forced colours. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page) {
  await page.goto('/src/components/button/button.fixture.html');
  await ready(page);
  await page.mouse.move(1, 1);
}

/** Every animation of the element (its transitions) at its end. */
const finish = (page, selector) => page.$eval(selector, (el) => Promise.all(el.getAnimations().map((animation) => animation.finished.catch(() => null))).then(() => undefined));

const box = (page, selector) => page.$eval(selector, (el) => {
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  return { width: rect.width, height: rect.height, radius: parseFloat(style.borderTopLeftRadius), font: parseFloat(style.fontSize), line: parseFloat(style.lineHeight), padStart: parseFloat(style.paddingInlineStart), background: style.backgroundColor, color: style.color, shadow: style.boxShadow };
});

test('the height at every size x density, and .ds-touch as a minimum over both', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const grid = document.querySelector('#grid');
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        const region = document.createElement('div');
        region.className = `fx-row ${density}${touch ? ' ds-touch' : ''}`;
        for (const [size] of sizes) {
          region.insertAdjacentHTML('beforeend', `<button class="ds-btn ${size}" type="button">Save</button>`
            + `<button class="ds-btn ds-btn--quiet ds-btn--icon ${size}" type="button" aria-label="Edit">${DS.icons.icon(DS.icons.pencil, 20)}</button>`);
        }
        grid.append(region);
        const [labelled, icons] = [[...region.querySelectorAll('.ds-btn:not(.ds-btn--icon)')], [...region.querySelectorAll('.ds-btn--icon')]];
        sizes.forEach(([size], i) => {
          const label = labelled[i].getBoundingClientRect();
          const icon = icons[i].getBoundingClientRect();
          const style = getComputedStyle(labelled[i]);
          out.push({ touch, density, size, height: label.height, icon: [icon.width, icon.height], content: parseFloat(style.lineHeight) + 2, font: parseFloat(style.fontSize) });
        });
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES });
  expect(measured).toHaveLength(SIZES.length * DENSITIES.length * 2);
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const name = `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`;
    // 40px at md and comfortable, 8px per size step, 4px per density step; never below its own line; touch: at least 48px.
    const computed = 40 + step * 8 + density * 4;
    const expected = Math.max(entry.touch ? TOUCH : 0, computed, entry.content);
    expect(entry.height, name).toBeCloseTo(expected, 0);
    // An icon button: 8px per size step, density leaves it alone; touch as wide as high.
    const icon = Math.max(entry.touch ? TOUCH : 0, 40 + step * 8);
    expect(entry.icon[0], `${name} icon width`).toBeCloseTo(icon, 0);
    expect(entry.icon[1], `${name} icon height`).toBeCloseTo(icon, 0);
  }
  // Type changes with size only: caption at xs, chip at sm, label at md, subtitle at lg and xl.
  const fonts = Object.fromEntries(measured.filter((entry) => !entry.touch && entry.density === 'ds-density-comfortable').map((entry) => [entry.size, entry.font]));
  expect(fonts).toEqual({ 'ds-xs': 12, 'ds-sm': 14, 'ds-md': 14, 'ds-lg': 16, 'ds-xl': 16 });
  // The comfortable md button is the default one: 40px.
  expect((await box(page, '#nest-outer')).height).toBe(40);
});

test('shape: 0 gives square corners, the default the pill; the press morph scales with it', async ({ page }) => {
  await open(page);
  const rest = {};
  for (const id of ['shape-square', 'shape-soft', 'shape-default', 'shape-round', 'shape-square-icon']) rest[id] = (await box(page, `#${id}`)).radius;
  expect(rest).toEqual({ 'shape-square': 0, 'shape-soft': 10, 'shape-default': 20, 'shape-round': 20, 'shape-square-icon': 0 });
  // Pressed (.ds-pressed, as DS.ripple holds it): --ds-radius-action-pressed (12px) times the shape, never rounder than at rest.
  const pressed = {};
  for (const id of ['shape-square', 'shape-soft', 'shape-default', 'shape-round']) {
    await page.$eval(`#${id}`, (el) => el.classList.add('ds-pressed'));
    await finish(page, `#${id}`);
    pressed[id] = (await box(page, `#${id}`)).radius;
    await page.$eval(`#${id}`, (el) => el.classList.remove('ds-pressed'));
  }
  expect(pressed).toEqual({ 'shape-square': 0, 'shape-soft': 6, 'shape-default': 12, 'shape-round': 18 });
  // A blocked button neither morphs nor shows a press.
  await page.$eval('#v-locked', (el) => el.classList.add('ds-pressed'));
  await finish(page, '#v-locked');
  expect((await box(page, '#v-locked')).radius).toBe(20);
});

test('options nest: a dense region inside a comfortable one applies, and a comfortable island inside it too', async ({ page }) => {
  await open(page);
  expect((await box(page, '#nest-outer')).height).toBe(40);
  expect((await box(page, '#nest-dense')).height).toBe(32);
  expect((await box(page, '#nest-back')).height).toBe(40);
  // Size and density add up: lg (48) in the dense region (-8).
  expect((await box(page, '#nest-dense-lg')).height).toBe(40);
  // The option sets a number on the region; the button computes from it (no role on .ds-theme reads it).
  const values = await page.$eval('#dense-region', (el) => ({ region: getComputedStyle(el).getPropertyValue('--ds-density').trim(), theme: getComputedStyle(document.querySelector('.ds-theme')).getPropertyValue('--ds-density').trim() }));
  expect(values).toEqual({ region: '-2', theme: '0' });
});

test('the filled error button of a confirmation (D10); an inherited tone or another variant stays as it is', async ({ page }) => {
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
    return { error: probe('var(--ds-error)'), onError: probe('var(--ds-on-error)'), primary: probe('var(--ds-primary)'), accent: probe('var(--ds-accent)') };
  });
  const confirm = await box(page, '#confirm-delete');
  expect(confirm.background).toBe(colours.error);
  expect(confirm.color).toBe(colours.onError);
  // The deprecated --primary alias takes it too.
  expect((await box(page, '#tone-alias')).background).toBe(colours.error);
  // A filled button in an error region stays filled; a tonal button ignores the tone.
  expect((await box(page, '#tone-inherited')).background).toBe(colours.primary);
  expect((await box(page, '#tone-tonal')).background).toBe(colours.accent);
  // Same shape, press and focus as every filled button: a pill, the ring on keyboard focus.
  expect(confirm.radius).toBe(20);
  await page.focus('#confirm-cancel');
  await page.keyboard.press('Tab');
  await expect(page.locator('#confirm-delete')).toBeFocused();
  expect(await page.$eval('#confirm-delete', (el) => getComputedStyle(el).outlineStyle)).toBe('solid');
});

test('the 2.x aliases and the variants of 3.0', async ({ page }) => {
  await open(page);
  const [filled, primary] = [await box(page, '#v-filled'), await box(page, '#v-primary')];
  expect(primary.background).toBe(filled.background);
  expect(primary.color).toBe(filled.color);
  // --sm keeps the fixed 2.x small button (32px, 12px padding), also in a dense region; .ds-sm follows the density.
  expect((await box(page, '#v-sm-alias')).height).toBe(32);
  expect((await box(page, '#v-sm-text-alias')).padStart).toBe(12);
  expect((await box(page, '#v-sm-text')).padStart).toBe(8);
  const dense = await page.evaluate(() => {
    const region = document.createElement('div');
    region.className = 'ds-density-dense';
    region.innerHTML = '<button class="ds-btn ds-btn--sm" type="button">Alias</button><button class="ds-btn ds-sm" type="button">Small</button>';
    document.querySelector('#grid').append(region);
    return [...region.children].map((el) => el.getBoundingClientRect().height);
  });
  expect(dense).toEqual([32, 24]);
  // Elevated rests on a shadow; ghost takes the ink of its surroundings; block fills its line.
  expect((await box(page, '#v-elevated')).shadow).not.toBe('none');
  await page.$eval('#ghost-host', (el) => { el.style.color = 'rgb(140, 29, 24)'; });
  await finish(page, '#v-ghost');
  expect((await box(page, '#v-ghost')).color).toBe('rgb(140, 29, 24)');
  const block = await page.$eval('#v-block', (el) => [el.getBoundingClientRect().width, el.parentElement.getBoundingClientRect().width]);
  expect(block[0]).toBeCloseTo(block[1], 0);
});

test('the failed face: an icon and a word after the work failed, not blocked, then the rest face again', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const button = document.querySelector('#v-failed');
    const outcome = await DS.motion.busy(button, () => Promise.reject(new Error('offline'))).then(() => 'resolved', (error) => error.message);
    const face = button.querySelector('.ds-btn__face--failed');
    return { outcome, failed: button.classList.contains('ds-btn--failed'), busy: button.getAttribute('aria-busy'), pointer: getComputedStyle(button).pointerEvents, word: face.textContent.trim(), icon: !!face.querySelector('svg') };
  });
  expect(result).toEqual({ outcome: 'offline', failed: true, busy: null, pointer: 'auto', word: 'Not saved', icon: true });
  await page.waitForFunction(() => {
    const face = document.querySelector('#v-failed .ds-btn__face--failed');
    return getComputedStyle(face).opacity === '1';
  });
  // After --ds-hold-status the rest face comes back.
  await page.waitForFunction(() => !document.querySelector('#v-failed').classList.contains('ds-btn--failed'), null, { timeout: 5000 });
  await settle(page);
  expect(await page.$eval('#v-failed .ds-btn__face:not([class*="--"])', (el) => getComputedStyle(el).opacity)).toBe('1');
});

test('forced colours: the error tone becomes the system button colours; a toggle Highlight, a blocked button GrayText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
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
    return { highlight: probe('backgroundColor', 'Highlight'), highlightText: probe('color', 'HighlightText'), grayText: probe('color', 'GrayText') };
  });
  const [confirm, filled, toggle, locked] = [await box(page, '#confirm-delete'), await box(page, '#v-filled'), await box(page, '#v-toggle'), await box(page, '#v-locked')];
  expect(confirm.background).toBe(filled.background);
  expect(confirm.color).toBe(filled.color);
  expect(toggle.background).toBe(system.highlight);
  expect(toggle.color).toBe(system.highlightText);
  expect(locked.color).toBe(system.grayText);
  // The square shape and the touch minimum hold in forced colours too.
  expect((await box(page, '#shape-square')).radius).toBe(0);
});

test('icon buttons in the four looks, each a circle at every size; as toggles the filled and tonal ones turn neutral while off', async ({ page }) => {
  await open(page);
  const out = await page.evaluate(() => {
    const host = document.createElement('div');
    host.className = 'ds-theme';
    document.body.append(host);
    const colour = (value) => {
      const probe = document.createElement('span');
      probe.style.color = value;
      host.append(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    };
    const result = {};
    for (const look of ['quiet', 'filled', 'tonal', 'outlined']) {
      for (const [size, pressed] of [['', null], ['ds-sm', null], ['ds-lg', null], ['', 'false'], ['', 'true']]) {
        const button = document.createElement('button');
        button.className = `ds-btn ds-btn--${look} ds-btn--icon ${size}`;
        button.type = 'button';
        button.setAttribute('aria-label', 'Probe');
        if (pressed) button.setAttribute('aria-pressed', pressed);
        host.append(button);
        const style = getComputedStyle(button);
        const rect = button.getBoundingClientRect();
        result[`${look} ${size || 'md'}${pressed ? ` ${pressed}` : ''}`] = { w: rect.width, h: rect.height, r: parseFloat(style.borderTopLeftRadius), bg: style.backgroundColor, border: style.borderTopColor };
        button.remove();
      }
    }
    const colours = { neutral: colour('var(--ds-surface-highest)'), primary: colour('var(--ds-primary)'), clear: colour('transparent') };
    host.remove();
    return { result, ...colours };
  });
  const { result, neutral, primary, clear } = out;
  for (const look of ['quiet', 'filled', 'tonal', 'outlined']) {
    expect(result[`${look} md`]).toMatchObject({ w: 40, h: 40, r: 20 });
    expect(result[`${look} ds-sm`]).toMatchObject({ w: 32, h: 32, r: 16 });
    expect(result[`${look} ds-lg`]).toMatchObject({ w: 48, h: 48, r: 24 });
  }
  expect(result['quiet md'].bg).toBe(clear);
  expect(result['filled md'].bg).toBe(primary);
  expect(result['tonal md'].bg).not.toBe(clear);
  expect(result['outlined md'].bg).toBe(clear);
  expect(result['outlined md'].border).not.toBe(clear);
  // Toggles: filled and tonal show the neutral container while off, their fill while on.
  expect(result['filled md false'].bg).toBe(neutral);
  expect(result['tonal md false'].bg).toBe(neutral);
  expect(result['filled md true'].bg).toBe(primary);
  expect(result['tonal md true'].bg).not.toBe(neutral);
  // The quiet and outlined toggles: clear while off, the tint while on.
  expect(result['quiet md false'].bg).toBe(clear);
  expect(result['outlined md true'].bg).not.toBe(clear);
});
