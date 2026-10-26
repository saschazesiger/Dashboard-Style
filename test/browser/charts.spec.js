/**
 * The charts of 2.0 in real engines (fixtures/charts.html): fills clipped
 * at --ds-share (never scaled, so a round end keeps its shape), a new
 * share gliding on --ds-ease-value over --ds-dur-glide and landing with a
 * countUp() figure, the first render filling from zero
 * (.ds-enter--fill: ds-fill-share with the fade), a column's value riding
 * on its fill, the chart roles of the series, a column that opens its day
 * (the layer, an inset ring, the ripple), the mini sparkline, and forced
 * colours (fills in CanvasText, series hatched).
 */
import { test, expect } from './base-test.js';
import { ready, settle, focusByKeyboard, sample, expectMonotonic } from './helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/charts.html';

async function open(page, { attach = false } = {}) {
  await page.goto(FIXTURE);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
  if (attach) await page.evaluate(() => { window.fxRipples = DS.ripple.attach(document); });
}

/** A colour token as the engine computes it on an element of the theme. */
function colourOf(page, value, property = 'backgroundColor') {
  return page.evaluate(([css, prop]) => {
    const probe = document.createElement('div');
    probe.style[prop] = css;
    document.querySelector('.ds-theme').append(probe);
    const colour = getComputedStyle(probe)[prop];
    probe.remove();
    return colour;
  }, [value, property]);
}

/** The clip-path a probe computes for `value`, so engines serialise both sides alike. */
function clipOf(page, value) {
  return page.evaluate((css) => {
    const probe = document.createElement('div');
    probe.style.clipPath = css;
    document.body.append(probe);
    const clip = getComputedStyle(probe).clipPath;
    probe.remove();
    return clip;
  }, value);
}

test('a meter is clipped at its share with a round end; it takes the track and series roles', async ({ page }) => {
  await open(page);
  const meter = page.locator('#meter');
  const seen = await meter.evaluate((el) => ({
    share: getComputedStyle(el).getPropertyValue('--ds-share').trim(),
    clip: getComputedStyle(el, '::before').clipPath,
    fill: getComputedStyle(el, '::before').backgroundColor,
    track: getComputedStyle(el).backgroundColor,
    height: el.getBoundingClientRect().height,
    radius: getComputedStyle(el).borderTopLeftRadius,
    transform: getComputedStyle(el, '::before').transform,
    scale: getComputedStyle(el, '::before').scale,
  }));
  expect(Number(seen.share)).toBeCloseTo(0.62, 5);
  const clip = await clipOf(page, 'inset(0 calc((1 - 0.62) * 100%) 0 0 round 9999px)');
  expect(seen.clip).toBe(clip);
  expect(seen.fill).toBe(await colourOf(page, 'var(--ds-chart-1)'));
  expect(seen.track).toBe(await colourOf(page, 'var(--ds-chart-track)'));
  expect(seen.height).toBe(4);
  expect(seen.radius).toBe('2px');
  expect(seen.transform).toBe('none');
  expect(seen.scale).toBe('none');
  expect(await page.locator('#meter-warning').evaluate((el) => getComputedStyle(el, '::before').backgroundColor)).toBe(await colourOf(page, 'var(--ds-chart-warning)'));
});

test('a new share glides on --ds-ease-value over --ds-dur-glide and lands with the figure counted in the same task', async ({ page }) => {
  await open(page);
  const meter = page.locator('#meter');
  const run = await page.evaluate(() => {
    const el = document.getElementById('meter');
    el.style.setProperty('--ds-share', '0.2');
    const counting = DS.motion.countUp(document.getElementById('figure'), 20, { format: (value) => `${Math.round(value)}%` });
    void getComputedStyle(el).getPropertyValue('--ds-share');
    const transition = el.getAnimations().find((animation) => animation.transitionProperty === '--ds-share');
    const glide = DS.motion.motionDuration(el, '--ds-dur-glide');
    return { duration: transition ? Number(transition.effect.getComputedTiming().duration) : null, glide, counted: Boolean(counting) };
  });
  expect(run.duration).toBe(run.glide);
  const values = (await sample(meter, ['--ds-share'], [0, 0.25, 0.5, 0.75, 1].map((progress) => ({ progress })))).map((entry) => entry['--ds-share']);
  expectMonotonic(values, { direction: 'down' });
  expect(values[0]).toBeCloseTo(0.62, 2);
  expect(values.at(-1)).toBeCloseTo(0.2, 2);
});

test('the first render fills every mark from zero (.ds-enter--fill), never by a scale', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(() => {
    const marks = [...document.querySelectorAll('#meter, #columns .ds-columns__col')];
    DS.motion.enterAll(marks, 'fill', { stagger: false });
    const names = marks[0].getAnimations().map((animation) => `${animation.animationName} ${Number(animation.effect.getComputedTiming().duration)}`).sort();
    return { names, glide: DS.motion.motionDuration(marks[0], '--ds-dur-glide'), classes: marks[1].className };
  });
  expect(seen.names).toEqual([`ds-fade-in ${seen.glide}`, `ds-fill-share ${seen.glide}`]);
  expect(seen.classes).toContain('ds-enter--fill');
  const fill = page.locator('#columns .ds-columns__col').first();
  const values = (await sample(fill, ['--ds-share'], [0, 0.25, 0.5, 0.75, 1].map((progress) => ({ progress })))).map((entry) => entry['--ds-share']);
  expect(values[0]).toBeCloseTo(0, 3);
  expectMonotonic(values, { direction: 'up' });
  expect(await fill.locator('.ds-columns__fill').evaluate((el) => [getComputedStyle(el).transform, getComputedStyle(el).scale])).toEqual(['none', 'none']);
});

test('a column\'s value rides on the top of its fill; the series take their roles', async ({ page }) => {
  await open(page);
  const cols = await page.evaluate(() => [...document.querySelectorAll('#columns .ds-columns__col')].map((col) => {
    const fill = col.querySelector('.ds-columns__fill');
    const box = fill.getBoundingClientRect();
    const share = parseFloat(getComputedStyle(col).getPropertyValue('--ds-share'));
    return {
      top: box.top + (1 - share) * box.height,
      value: col.querySelector('.ds-columns__value').getBoundingClientRect().bottom,
      colour: getComputedStyle(fill).backgroundColor,
      height: box.height,
    };
  }));
  for (const col of cols) {
    expect(col.height).toBe(120);
    expect(col.top - col.value).toBeCloseTo(4, 0);
  }
  const roles = await Promise.all(['--ds-chart-1', '--ds-chart-2', '--ds-chart-3', '--ds-chart-4'].map((name) => colourOf(page, `var(${name})`)));
  expect(cols.slice(0, 4).map((col) => col.colour)).toEqual(roles);
  // Legend keys share the series of their modifier.
  const keys = await page.locator('#legend .ds-legend__key').evaluateAll((els) => els.map((el) => [getComputedStyle(el).backgroundColor, el.getBoundingClientRect().width]));
  expect(keys.map(([colour]) => colour)).toEqual(roles);
  expect(keys.map(([, width]) => width)).toEqual([12, 12, 12, 12]);
});

test('a column that opens its day: the layer, an inset ring, the ripple, no morph', async ({ page }) => {
  await open(page, { attach: true });
  const button = page.locator('#col-button');
  const radius = await button.evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
  // Keyboard focus first, on a fresh page: an inset ring.
  await focusByKeyboard(page, button);
  await settle(page);
  expect(await button.evaluate((el) => [getComputedStyle(el).outlineStyle, getComputedStyle(el).outlineOffset])).toEqual(['solid', '-2px']);
  await button.evaluate((el) => el.blur());
  await button.hover();
  await settle(page);
  expect(await button.evaluate((el) => Number(getComputedStyle(el, '::before').opacity))).toBeGreaterThan(0);
  await page.mouse.down();
  expect(await button.evaluate((el) => el.querySelectorAll(':scope > .ds-press-ripple').length)).toBe(1);
  await settle(page);
  expect(await button.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).toBe(radius);
  await page.mouse.up();
  await page.mouse.move(1, 1);
  await settle(page, { timeout: 5000 });
});

test('the sparkline: 32px high, the highlighted column in the first series, the rest neutral', async ({ page }) => {
  await open(page);
  const cols = await page.locator('#mini .ds-columns__fill').evaluateAll((els) => els.map((el) => [getComputedStyle(el).backgroundColor, el.getBoundingClientRect().height]));
  const neutral = await colourOf(page, 'var(--ds-chart-neutral)');
  const first = await colourOf(page, 'var(--ds-chart-1)');
  expect(cols.map(([colour]) => colour)).toEqual([neutral, neutral, first]);
  expect(cols.map(([, height]) => height)).toEqual([32, 32, 32]);
});

test('forced colours: fills in CanvasText, series 2 to 4 hatched, the meter track Canvas with an edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await open(page);
  await page.emulateMedia({ forcedColors: 'active' });
  await settle(page);
  const canvasText = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.cssText = 'forced-color-adjust: none; background-color: CanvasText';
    document.body.append(probe);
    const colour = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return colour;
  });
  const fills = await page.locator('#columns .ds-columns__fill').evaluateAll((els) => els.map((el) => [getComputedStyle(el).backgroundColor, getComputedStyle(el).backgroundImage]));
  expect(fills[0][0]).toBe(canvasText);
  expect(fills[0][1]).toBe('none');
  for (const [, image] of fills.slice(1, 4)) expect(image).toMatch(/^repeating-linear-gradient\(/);
  expect(new Set(fills.slice(1, 4).map(([, image]) => image)).size).toBe(3);
  const meter = await page.locator('#meter').evaluate((el) => [getComputedStyle(el, '::before').backgroundColor, getComputedStyle(el).outlineStyle]);
  expect(meter).toEqual([canvasText, 'solid']);
});
