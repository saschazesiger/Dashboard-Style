/**
 * Presence: the dot at every size (density, touch and shape change nothing),
 * four states that differ in shape as well as colour, the word next to
 * every dot of the demo, the strings, the colour glide on --ds-dur-medium,
 * and forced colours, where the shapes stay apart in CanvasText. Runs in
 * `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const STATES = ['online', 'away', 'busy', 'offline'];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=presence');
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

const dot = (state, cls = '') => `<span id="probe" class="ds-presence-dot ds-presence-dot--${state} ${cls}"></span>`;
const box = '[el.getBoundingClientRect().width, el.getBoundingClientRect().height]';
const look = '[style.backgroundColor, style.backgroundImage, style.borderTopColor, style.borderTopWidth]';

test('the dot at every size, 2px per step; density, touch and shape change nothing', async ({ page }) => {
  await open(page);
  for (const [size, step] of SIZES) {
    const side = 10 + step * 2;
    for (const around of ['', 'ds-density-tight', 'ds-touch', 'ds-shape-square']) {
      expect(await probe(page, `<div class="${around}">${dot('online', size)}</div>`, box), `${size} ${around}`).toEqual([side, side]);
    }
  }
  expect(await probe(page, `<div class="ds-shape-square">${dot('busy')}</div>`, 'style.borderTopLeftRadius')).toBe('50%');
});

test('four states, four shapes: each one differs from the others in more than its colour', async ({ page }) => {
  await open(page);
  const shapes = {};
  for (const state of STATES) shapes[state] = await probe(page, dot(state), look);
  // Filled: online and busy fill the hollow; away and offline keep the ground.
  const ground = await probe(page, dot('offline'), 'style.backgroundColor');
  expect(shapes.online[0]).not.toBe(ground);
  expect(shapes.busy[0]).not.toBe(ground);
  expect(shapes.online[1], 'online: no image').toBe('none');
  expect(shapes.busy[1], 'busy: the bar').toMatch(/linear-gradient/);
  expect(shapes.away[1], 'away: the lower half').toMatch(/linear-gradient/);
  expect(shapes.offline[1], 'offline: an empty ring').toBe('none');
  for (const state of STATES) expect(parseFloat(shapes[state][3]), state).toBe(2);
});

test('every dot of the demo comes with its word', async ({ page }) => {
  await open(page);
  const missing = await page.$$eval('#fx-component .ds-presence-dot', (dots) => dots.filter((el) => {
    const label = el.closest('.ds-presence-label');
    const word = (label ? label.textContent : el.textContent).trim();
    return !/^(Online|Away|Busy|Offline)$/.test(word);
  }).length);
  expect(missing).toBe(0);
  expect(await page.evaluate(() => ['presenceOnline', 'presenceAway', 'presenceBusy', 'presenceOffline'].map((key) => DS.core.t(key)))).toEqual(['Online', 'Away', 'Busy', 'Offline']);
});

test('a state change glides the colours on --ds-dur-medium; the word changes at once', async ({ page }) => {
  await open(page);
  const live = page.locator('[data-demo="live"]');
  const out = await live.evaluate((el) => {
    const d = el.querySelector('.ds-presence-dot');
    const probe = document.createElement('span');
    probe.style.transitionDuration = 'var(--ds-dur-medium)';
    el.append(probe);
    const medium = getComputedStyle(probe).transitionDuration;
    probe.remove();
    const style = getComputedStyle(d);
    return { props: style.transitionProperty, durations: style.transitionDuration, medium };
  });
  expect(out.props).toBe('background-color, border-color');
  expect(out.durations).toBe(`${out.medium}, ${out.medium}`);
  await page.locator('[data-demo="cycle"]').click();
  await expect(live).toHaveText('Away');
  await expect(live.locator('.ds-presence-dot')).toHaveClass(/ds-presence-dot--away/);
  await settle(page);
});

test('forced colours: the shapes in CanvasText on Canvas', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const system = await page.evaluate(() => ['CanvasText', 'Canvas'].map((name) => {
    const el = document.createElement('span');
    el.style.color = name;
    document.body.append(el);
    const colour = getComputedStyle(el).color;
    el.remove();
    return colour;
  }));
  const online = await probe(page, dot('online'), look);
  const offline = await probe(page, dot('offline'), look);
  expect(online[2]).toBe(system[0]);
  expect(online[0]).toBe(system[0]);
  expect(offline[0]).toBe(system[1]);
  expect((await probe(page, dot('busy'), look))[1]).toMatch(/linear-gradient/);
});
