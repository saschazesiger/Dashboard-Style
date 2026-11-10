/**
 * The badge on the options model: the height at every size (density and touch
 * change nothing), the shape, the dot, the tone from the class on the badge
 * only, the 2.x tones gone, a count with a maximum through the attribute and
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

test('a dot without a tone holds 3:1 on a surface: primary, the hook on top; on a filled button the fill\'s ink; a neutral dot keeps its colour on a tinted host', async ({ page }) => {
  await open(page);
  const fill = 'style.backgroundColor';
  const roles = await page.evaluate(() => {
    const read = (value) => {
      const el = document.createElement('span');
      el.style.color = value;
      document.body.append(el);
      const colour = getComputedStyle(el).color;
      el.remove();
      return colour;
    };
    return { primary: read('var(--ds-primary)'), onPrimary: read('var(--ds-on-primary)'), accent: read('var(--ds-accent)'), surface: read('var(--ds-surface)'), neutral: read('var(--ds-text-2)') };
  });
  expect(await probe(page, badge('ds-badge--dot', ''), fill)).toBe(roles.primary);
  expect(await probe(page, badge(''), fill), 'a count keeps the tint').toBe(roles.accent);
  expect(await probe(page, badge('ds-badge--dot" style="--ds-badge-bg: rgb(1, 2, 3)', ''), fill)).toBe('rgb(1, 2, 3)');
  expect(await probe(page, `<button class="ds-btn ds-btn--filled" type="button">x ${badge('ds-badge--dot', '')}</button>`, fill)).toBe(roles.onPrimary);
  expect(await probe(page, badge('ds-badge--dot ds-tone-neutral', ''), fill)).toBe(roles.neutral);
  const tinted = await probe(page, `<button class="ds-btn ds-btn--tonal" type="button">x ${badge('ds-badge--dot ds-tone-neutral', '')}</button>`, fill);
  expect(tinted, 'never the surface').toBe(roles.neutral);
  expect(await probe(page, `<button class="ds-btn ds-btn--tonal" type="button">x ${badge('ds-badge--dot', '')}</button>`, fill)).toBe(roles.primary);
  // A count on the same host still takes the surface, as it did.
  expect(await probe(page, `<button class="ds-btn ds-btn--tonal" type="button">x ${badge('ds-tone-neutral')}</button>`, fill)).toBe(roles.surface);
});

test('the 2.x tones were removed in 3.0: a badge with one looks like the plain one', async ({ page }) => {
  await open(page);
  const plain = await probe(page, badge(''), look);
  for (const kind of ['neutral', 'ok', 'warning', 'error']) {
    expect(await probe(page, badge(`ds-badge--${kind}`), look), kind).toEqual(plain);
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

test('on an icon button\'s corner: over the top end corner, a press on it, also where it hangs over, presses the host', async ({ page }) => {
  await open(page);
  const host = page.locator('#fx-component [data-demo="corner"] .ds-btn').first();
  const corner = host.locator('.ds-badge--corner');
  const hostBox = await host.boundingBox();
  const badgeBox = await corner.boundingBox();
  const border = await host.evaluate((el) => el.clientTop);
  // A quarter of its 20px height over the top and the end edge of the padding box (LTR).
  expect(Math.round(badgeBox.y - hostBox.y - border)).toBe(-5);
  expect(Math.round(badgeBox.x + badgeBox.width - (hostBox.x + hostBox.width - border))).toBe(5);
  await expect(host).toHaveAccessibleName('Notifications, 3 new');
  // A click on the part of the badge outside the button is the button's.
  await host.evaluate((el) => {
    el.dataset.clicks = '0';
    el.addEventListener('click', () => { el.dataset.clicks = String(Number(el.dataset.clicks) + 1); });
  });
  const x = badgeBox.x + badgeBox.width / 2;
  const y = badgeBox.y + 3;
  expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('.ds-btn')?.getAttribute('aria-label'), { x, y })).toBe('Notifications, 3 new');
  await page.mouse.click(x, y);
  await expect(host).toHaveAttribute('data-clicks', '1');
});

test('a press keeps a host with a corner badge unclipped; its ripple clips itself with the host\'s radius; other hosts clip as before', async ({ page }) => {
  await open(page);
  const host = page.locator('#fx-component [data-demo="corner"] .ds-btn').first();
  const hostBox = await host.boundingBox();
  await page.mouse.move(hostBox.x + hostBox.width / 2, hostBox.y + hostBox.height / 2);
  await page.mouse.down();
  await expect(host.locator(':scope > .ds-press-ripple')).toHaveCount(1);
  const during = await host.evaluate((el) => {
    const ripple = el.querySelector(':scope > .ds-press-ripple');
    const own = getComputedStyle(el);
    const box = getComputedStyle(ripple);
    const rect = ripple.getBoundingClientRect();
    const hostRect = el.getBoundingClientRect();
    return {
      hostOverflow: own.overflowX,
      isolation: own.isolation,
      boxOverflow: box.overflowX,
      radius: box.borderTopLeftRadius === own.borderTopLeftRadius,
      fits: Math.abs(rect.width - el.clientWidth) < 1 && Math.abs(rect.height - el.clientHeight) < 1 && Math.abs(rect.left - hostRect.left - el.clientLeft) < 1,
      circle: getComputedStyle(ripple, '::before').borderTopLeftRadius,
      badge: getComputedStyle(el.querySelector('.ds-badge--corner')).visibility,
    };
  });
  await page.mouse.up();
  expect(during).toEqual({ hostOverflow: 'visible', isolation: 'isolate', boxOverflow: 'clip', radius: true, fits: true, circle: '50%', badge: 'visible' });
  const plain = page.locator('#fx-component button', { hasText: 'Inbox' }).first();
  const plainBox = await plain.boundingBox();
  await page.mouse.move(plainBox.x + 8, plainBox.y + plainBox.height / 2);
  await page.mouse.down();
  await expect(plain.locator(':scope > .ds-press-ripple')).toHaveCount(1);
  expect(await plain.evaluate((el) => getComputedStyle(el).overflowX)).toBe('clip');
  await page.mouse.up();
});

test('the corner dot sits inside the corner, on the edge of a round host; the badge is hidden from assistive tech', async ({ page }) => {
  await open(page);
  const host = page.locator('#fx-component [data-demo="corner"] .ds-btn').nth(2);
  const dot = host.locator('.ds-badge--corner');
  const hostBox = await host.boundingBox();
  const dotBox = await dot.boundingBox();
  const border = await host.evaluate((el) => el.clientTop);
  expect(Math.round(dotBox.y - hostBox.y - border)).toBe(2);
  expect(Math.round(hostBox.x + hostBox.width - border - (dotBox.x + dotBox.width))).toBe(2);
  await expect(host).toHaveAccessibleName('Messages, new ones');
  await expect(dot).toHaveAttribute('aria-hidden', 'true');
});
