/**
 * The badge on the options model: the height at every size (density and touch
 * change nothing), the shape, the dot, the tone from the class on the badge
 * only, the deprecated tones, a count with a maximum through the attribute and
 * the controller (with its pop), a blocked and a tinted host, forced colours.
 * Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = ['ds-density-comfortable', 'ds-density-compact', 'ds-density-dense', 'ds-density-tight'];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=badge');
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

const badge = (cls, text = '3') => `<span id="probe" class="ds-badge ${cls}">${text}</span>`;
const height = 'el.getBoundingClientRect().height';
const look = '[style.backgroundColor, style.color]';

test('the height at every size; density and touch change nothing; a small button takes a small badge', async ({ page }) => {
  await open(page);
  for (const touch of [false, true]) {
    for (const density of DENSITIES) {
      for (const [size, step] of SIZES) {
        expect(await probe(page, `<div class="${density}${touch ? ' ds-touch' : ''}">${badge(size)}</div>`, height), `${size} ${density} ${touch}`).toBe(20 + step * 2);
      }
    }
  }
  expect(await probe(page, `<button class="ds-btn ds-sm" type="button">Inbox ${badge('')}</button>`, height)).toBe(18);
  expect(await probe(page, badge(''), 'parseFloat(style.fontSize)')).toBe(12);
});

test('shape: the corners times --ds-shape, at most half the height; a dot stays round', async ({ page }) => {
  await open(page);
  const radius = 'parseFloat(style.borderTopLeftRadius)';
  for (const [shape, value] of [['ds-shape-square', 0], ['ds-shape-soft', 5], ['ds-shape-default', 10], ['ds-shape-round', 10]]) {
    expect(await probe(page, `<div class="${shape}">${badge('')}</div>`, radius), shape).toBe(value);
  }
  expect(await probe(page, `<div class="ds-shape-square">${badge('ds-badge--dot ds-tone-error', '')}</div>`, 'style.borderTopLeftRadius')).toBe('50%');
});

test('the dot: 8px at md, 2px per step, shown while empty; an empty count takes no room', async ({ page }) => {
  await open(page);
  const box = '[el.getBoundingClientRect().width, el.getBoundingClientRect().height]';
  expect(await probe(page, badge('ds-badge--dot', ''), box)).toEqual([8, 8]);
  expect(await probe(page, badge('ds-badge--dot ds-lg', ''), box)).toEqual([10, 10]);
  expect(await probe(page, badge('ds-badge--dot', '<span class="ds-sr">New</span>'), box)).toEqual([8, 8]);
  expect(await probe(page, badge('', ''), 'style.display')).toBe('none');
});

test('tones: from the class on the badge; an inherited tone changes nothing; a dot takes the full colour', async ({ page }) => {
  await open(page);
  const pair = await page.evaluate(() => {
    const read = (value) => {
      const el = document.createElement('span');
      el.style.color = value;
      document.body.append(el);
      const colour = getComputedStyle(el).color;
      el.remove();
      return colour;
    };
    return { container: read('var(--ds-error-container)'), on: read('var(--ds-on-error-container)'), error: read('var(--ds-error)') };
  });
  expect(await probe(page, badge('ds-tone-error'), look)).toEqual([pair.container, pair.on]);
  expect((await probe(page, badge('ds-badge--dot ds-tone-error', ''), look))[0]).toBe(pair.error);
  expect(await probe(page, `<div class="ds-tone-error">${badge('')}</div>`, look)).toEqual(await probe(page, badge(''), look));
});

test('the deprecated tones look like the new ones until 3.0 ships', async ({ page }) => {
  await open(page);
  for (const [kind, tone] of [['neutral', 'neutral'], ['ok', 'success'], ['warning', 'warning'], ['error', 'error']]) {
    expect(await probe(page, badge(`ds-badge--${kind}`), look), kind).toEqual(await probe(page, badge(`ds-tone-${tone}`), look));
  }
});

test('on a tinted host the default badge turns strong; in a blocked host it takes the disabled model over any tone', async ({ page }) => {
  await open(page);
  const tinted = await probe(page, `<button class="ds-btn ds-btn--tonal" type="button">x ${badge('')}</button>`, look);
  expect(tinted).not.toEqual(await probe(page, badge(''), look));
  const tone = await probe(page, `<button class="ds-btn ds-btn--tonal" type="button">x ${badge('ds-tone-error')}</button>`, look);
  expect(tone).toEqual(await probe(page, badge('ds-tone-error'), look));
  const blocked = await probe(page, `<button class="ds-btn" type="button" disabled>x ${badge('ds-tone-error')}</button>`, look);
  expect(blocked).not.toEqual(await probe(page, badge('ds-tone-error'), look));
});

test('a count with a maximum: the attribute path, its update, and zero', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    document.querySelector('#fx-component').insertAdjacentHTML('beforeend', '<span id="attr" class="ds-badge" data-ds-badge="128" data-ds-badge-max="99"></span>');
  });
  const el = page.locator('#attr');
  await expect(el).toHaveText('99+');
  await el.evaluate((node) => node.setAttribute('data-ds-badge-max', '999'));
  await expect(el).toHaveText('128');
  await el.evaluate((node) => node.setAttribute('data-ds-badge', '0'));
  await expect(el).toHaveText('', { timeout: 5000 });
  await expect(el).toBeHidden();
  expect(await page.evaluate(() => DS.badge.format(128))).toBe('99+');
  // The controller of the attribute path.
  const value = await el.evaluate((node) => { node.setAttribute('data-ds-badge', '4'); return new Promise((done) => setTimeout(() => done(DS.core.get(node, 'badge').get()), 50)); });
  expect(value).toBe('4');
  // The demo's rows: 7, 99, 99+, 9+.
  const figures = await page.$$eval('#fx-component [data-ds-badge]:not(#attr)', (all) => all.map((node) => node.textContent));
  expect(figures).toEqual(['7', '99', '99+', '9+']);
});

test('the controller: a count that appears pops in, one that goes pops out, the figure changes at once; events', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const holder = document.querySelector('#fx-component').appendChild(document.createElement('div'));
    const el = holder.appendChild(document.createElement('span'));
    el.className = 'ds-badge';
    const seen = [];
    holder.addEventListener('ds:change', (event) => seen.push(event.detail.text));
    const badge = DS.badge.create(el, { value: 0 });
    const out = { first: el.classList.contains('ds-enter') };
    badge.set(3);
    out.popsIn = el.classList.contains('ds-enter--pop');
    out.text = el.textContent;
    await DS.motion.settled(el);
    badge.set(4);
    out.figure = el.textContent;
    out.notAgain = el.classList.contains('ds-enter--pop');
    badge.set(0);
    out.popsOut = el.classList.contains('ds-leave--pop');
    out.keeps = el.textContent;
    await DS.motion.settled(el);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    out.empty = el.textContent;
    out.display = getComputedStyle(el).display;
    out.seen = seen;
    return out;
  });
  expect(result).toEqual({ first: false, popsIn: true, text: '3', figure: '4', notAgain: false, popsOut: true, keeps: '4', empty: '', display: 'none', seen: ['3', '4', ''] });
});

test('the demo: the button drives the count by keyboard, and the host\'s name holds the count', async ({ page }) => {
  await open(page);
  const inbox = page.locator('#fx-component button', { hasText: 'Inbox' });
  await expect(inbox).toHaveAccessibleName(/Inbox 3/);
  await inbox.focus();
  await page.keyboard.press('Enter');
  await expect(inbox).toHaveAccessibleName(/Inbox 4/);
});

test('forced colours: Canvas and CanvasText with an outline, so a dot stays visible; GrayText in a blocked host', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const dot = await probe(page, badge('ds-badge--dot ds-tone-error', ''), '[style.outlineStyle, style.forcedColorAdjust]');
  expect(dot).toEqual(['solid', 'none']);
  expect(await probe(page, badge('ds-tone-error'), look)).toEqual(await probe(page, badge('ds-tone-success'), look));
  const blocked = await probe(page, `<button class="ds-btn" type="button" disabled>x ${badge('')}</button>`, 'style.color');
  expect(blocked).toBe(await page.evaluate(() => {
    const el = document.createElement('span');
    el.style.color = 'GrayText';
    el.style.forcedColorAdjust = 'none';
    document.body.append(el);
    const colour = getComputedStyle(el).color;
    el.remove();
    return colour;
  }));
});
