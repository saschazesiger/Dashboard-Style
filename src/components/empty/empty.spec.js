/**
 * The empty state on the options model: its places (section, page, inline),
 * the disc at every size, the padding at every size x density, shape, the
 * causes' and tones' colours, an inherited tone ignored, the picture, the
 * actions, the confirmation's entrance, keyboard and forced colours. Runs in
 * `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=empty');
  await ready(page);
}

const probe = (page, html, read) => page.evaluate(({ html, read }) => {
  document.querySelector('#fx-component').insertAdjacentHTML('beforeend', `<div class="probe" style="max-width:720px">${html}</div>`);
  const holder = document.querySelector('#fx-component > .probe:last-child');
  const el = holder.querySelector('#probe');
  el.removeAttribute('id');
  const style = getComputedStyle(el);
  const out = new Function('el', 'style', `return (${read});`)(el, style);
  holder.remove();
  return out;
}, { html, read });

const empty = (cls, inner = '') => `<div id="probe" class="ds-empty ${cls}"><span class="ds-empty__disc" aria-hidden="true"></span><p class="ds-empty__title">Title</p><p class="ds-empty__text">Words</p>${inner}</div>`;
const disc = (cls) => `<div class="ds-empty ${cls}"><span id="probe" class="ds-empty__disc" aria-hidden="true"></span><p class="ds-empty__title">Title</p></div>`;

test('the padding at every size x density; the disc follows size, not density', async ({ page }) => {
  await open(page);
  const read = '[parseFloat(style.paddingBlockStart), parseFloat(style.paddingInlineStart)]';
  for (const [density, densityStep] of DENSITIES) {
    for (const [size, sizeStep] of SIZES) {
      expect(await probe(page, `<div class="${density}">${empty(size)}</div>`, read), `${size} ${density}`).toEqual([32 + sizeStep * 8 + densityStep * 2, 16 + densityStep * 2]);
      expect(await probe(page, `<div class="${density}">${disc(size)}</div>`, 'el.getBoundingClientRect().width'), `${size} ${density} disc`).toBe(48 + sizeStep * 8);
    }
  }
});

test('touch: only its buttons read it', async ({ page }) => {
  await open(page);
  const read = 'parseFloat(style.paddingBlockStart)';
  expect(await probe(page, `<div class="ds-touch">${empty('')}</div>`, read)).toBe(32);
  expect(await probe(page, `<div class="ds-touch"><div class="ds-empty"><button id="probe" class="ds-btn ds-btn--tonal ds-sm" type="button">Add</button></div></div>`, 'el.getBoundingClientRect().height')).toBe(48);
});

test('its places: --section is the default, --page takes more room, --inline a row', async ({ page }) => {
  await open(page);
  const box = '[parseFloat(style.maxWidth), parseFloat(style.paddingBlockStart), style.textAlign]';
  const section = await probe(page, empty('ds-empty--section'), box);
  expect(section).toEqual(await probe(page, empty(''), box));
  expect(section).toEqual([400, 32, 'center']);
  expect(await probe(page, empty('ds-empty--page'), box)).toEqual([480, 96, 'center']);
  expect(await probe(page, disc('ds-empty--page'), 'el.getBoundingClientRect().width')).toBe(72);
  expect(await probe(page, empty('ds-empty--page'), 'parseFloat(getComputedStyle(el.querySelector(".ds-empty__title")).fontSize)')).toBe(22);
  const row = await probe(page, empty('ds-empty--inline', '<button class="ds-btn ds-btn--text" type="button">Clear</button>'), `(() => {
    const parts = ['.ds-empty__disc', '.ds-empty__title', '.ds-btn'].map((selector) => el.querySelector(selector).getBoundingClientRect());
    return { disc: parts[0].width, row: parts[0].right <= parts[1].left && parts[1].right <= parts[2].left, align: style.textAlign, wide: el.getBoundingClientRect().width > 480 };
  })()`);
  expect(row).toEqual({ disc: 32, row: true, align: 'start', wide: true });
});

test('inline: a picture stands where the disc does, at its size; the box stays a row', async ({ page }) => {
  await open(page);
  const out = await probe(page, `<div id="probe" class="ds-empty ds-empty--inline"><span class="ds-empty__media" aria-hidden="true"><svg width="500" height="500" viewBox="0 0 500 500"></svg></span><p class="ds-empty__title">Title</p><p class="ds-empty__text">Words</p><button class="ds-btn ds-btn--text" type="button">Clear</button></div>`, `(() => {
    const [media, title, text, button] = [...el.children].map((child) => child.getBoundingClientRect());
    return { media: [media.width, media.height], beside: media.right <= title.left && media.right <= text.left, words: title.bottom <= text.top + 0.51, end: text.right <= button.left, height: el.getBoundingClientRect().height, margin: parseFloat(getComputedStyle(el.children[0]).marginBottom) };
  })()`);
  expect(out).toEqual({ media: [32, 32], beside: true, words: true, end: true, height: 64, margin: 0 });
  expect(await probe(page, `<div class="ds-empty ds-empty--inline" style="--ds-empty-media-size: 48px"><span id="probe" class="ds-empty__media" aria-hidden="true"></span></div>`, 'el.getBoundingClientRect().height')).toBe(48);
});

test('inline: its padding takes density, not the size step or the hook', async ({ page }) => {
  await open(page);
  const read = '[parseFloat(style.paddingBlockStart), parseFloat(style.paddingInlineStart)]';
  for (const [density, step] of DENSITIES) {
    for (const [size] of SIZES) {
      expect(await probe(page, `<div class="${density}">${empty(`ds-empty--inline ${size}`)}</div>`, read), `${size} ${density}`).toEqual([12 + step * 2, 0]);
    }
  }
  expect(await probe(page, empty('ds-empty--inline" style="--ds-empty-padding: 99px'), read)).toEqual([12, 0]);
  // The disc still follows the size.
  expect(await probe(page, disc('ds-empty--inline ds-lg'), 'el.getBoundingClientRect().width')).toBe(40);
});

test('inline at a popup\'s width: two actions stack, the words keep their column; a wide row keeps them side by side', async ({ page }) => {
  await open(page);
  const two = '<div class="ds-empty__actions"><button class="ds-btn ds-btn--text" type="button">Import</button><button class="ds-btn ds-btn--text" type="button">Add device</button></div>';
  const read = `(() => {
    const [one, other] = [...el.querySelector('.ds-empty__actions').children].map((child) => child.getBoundingClientRect());
    const actions = el.querySelector('.ds-empty__actions').getBoundingClientRect();
    const box = el.getBoundingClientRect();
    return { words: parseFloat(style.gridTemplateColumns.split(' ')[1]), stacked: other.top >= one.bottom, inside: actions.right <= box.right + 0.51, half: actions.width <= box.width / 2 + 0.51 };
  })()`;
  const narrow = await probe(page, `<div style="width:280px">${empty('ds-empty--inline', two)}</div>`, read);
  expect(narrow.words).toBeGreaterThanOrEqual(80);
  expect(narrow).toMatchObject({ stacked: true, inside: true, half: true });
  const wide = await probe(page, `<div style="width:700px">${empty('ds-empty--inline', two)}</div>`, read);
  expect(wide.stacked).toBe(false);
  // One action never wraps its label, in the narrowest place.
  const one = await probe(page, `<div style="width:200px">${empty('ds-empty--inline', '<button class="ds-btn ds-btn--text" type="button">Clear filter</button>')}</div>`, 'el.querySelector(".ds-btn").getBoundingClientRect().height');
  expect(one).toBe(40);
});

test('causes and tones: the disc\'s colours; a tone wins over a cause; an inherited tone changes nothing; the hook wins', async ({ page }) => {
  await open(page);
  const look = '[style.backgroundColor, style.color]';
  const roles = await page.evaluate(() => {
    const read = (value) => {
      const el = document.createElement('span');
      el.style.color = value;
      document.body.append(el);
      const colour = getComputedStyle(el).color;
      el.remove();
      return colour;
    };
    const pair = (bg, ink) => [read(`var(${bg})`), read(`var(${ink})`)];
    return {
      tint: pair('--ds-accent', '--ds-on-accent-icon'),
      primary: pair('--ds-primary-container', '--ds-on-primary-container'),
      neutral: pair('--ds-surface-high', '--ds-text-2'),
      warning: pair('--ds-warning-container', '--ds-on-warning-container'),
      error: pair('--ds-error-container', '--ds-on-error-container'),
      info: pair('--ds-info-container', '--ds-on-info-container'),
    };
  });
  const expected = { '': roles.tint, 'ds-empty--no-data': roles.tint, 'ds-empty--first-use': roles.primary, 'ds-empty--not-set-up': roles.primary, 'ds-empty--no-results': roles.neutral, 'ds-empty--no-access': roles.neutral, 'ds-empty--offline': roles.warning, 'ds-empty--error': roles.error, 'ds-tone-info': roles.info, 'ds-empty--error ds-tone-info': roles.info };
  for (const [cls, pair] of Object.entries(expected)) expect(await probe(page, disc(cls), look), cls || 'default').toEqual(pair);
  expect(await probe(page, `<div class="ds-tone-error">${disc('')}</div>`, look)).toEqual(roles.tint);
  expect((await probe(page, disc('ds-empty--error" style="--ds-empty-disc-bg: rgb(1, 2, 3)'), look))[0]).toBe('rgb(1, 2, 3)');
});

test('shape: the disc\'s corners times --ds-shape, at most half its size', async ({ page }) => {
  await open(page);
  for (const [shape, value] of [['ds-shape-square', 0], ['ds-shape-soft', 12], ['ds-shape-default', 24], ['ds-shape-round', 24]]) {
    expect(await probe(page, `<div class="${shape}">${disc('')}</div>`, 'parseFloat(style.borderTopLeftRadius)'), shape).toBe(value);
  }
});

test('a picture takes the disc\'s place, at most its height; two actions stand side by side', async ({ page }) => {
  await open(page);
  const media = (cls) => `<div class="ds-empty ${cls}"><span id="probe" class="ds-empty__media" aria-hidden="true"><svg width="500" height="500"></svg></span></div>`;
  expect(await probe(page, media(''), 'el.getBoundingClientRect().height')).toBe(120);
  expect(await probe(page, media('ds-empty--page'), 'el.getBoundingClientRect().height')).toBe(160);
  expect(await probe(page, media('" style="--ds-empty-media-size: 80px'), 'el.getBoundingClientRect().height')).toBe(80);
  const actions = await probe(page, `<div class="ds-empty"><div id="probe" class="ds-empty__actions"><button class="ds-btn" type="button">One</button><button class="ds-btn" type="button">Two</button></div></div>`,
    '(() => { const [one, two] = [...el.children].map((child) => child.getBoundingClientRect()); return [one.top === two.top, one.right < two.left, parseFloat(style.marginTop)]; })()');
  expect(actions).toEqual([true, true, 12]);
});

test('the confirmation plays its entrance when inserted, and its ring follows the disc', async ({ page }) => {
  await open(page);
  const names = await page.$eval('[data-demo="done"] .ds-empty__disc', (el) => getComputedStyle(el).animationName);
  expect(names).toBe('ds-fade-in, ds-pop-in');
  // Play again: a new node, its entrance from the start, on the disc, the ring and the check.
  const replay = await page.evaluate(async () => {
    const before = document.querySelector('[data-demo="done"] .ds-empty__disc');
    await Promise.all(before.getAnimations({ subtree: true }).map((animation) => animation.finished));
    const finished = before.getAnimations({ subtree: true }).length;
    document.querySelector('[data-demo="replay"]').click();
    const disc = document.querySelector('[data-demo="done"] .ds-empty__disc');
    const running = disc.getAnimations({ subtree: true });
    return {
      finished,
      fresh: disc !== before,
      names: running.map((animation) => animation.animationName).sort(),
      started: running.every((animation) => animation.playState === 'running' && Number(animation.currentTime || 0) === 0),
    };
  });
  expect(replay).toEqual({ finished: 0, fresh: true, names: ['ds-draw', 'ds-fade-in', 'ds-pop-in', 'ds-ripple'], started: true });
  // The ring is the disc's box, also when the hook sets another size.
  const ring = await probe(page, `<div class="ds-empty ds-empty--done"><span id="probe" class="ds-empty__disc" style="--ds-empty-disc-size: 64px" aria-hidden="true"></span></div>`, `(() => {
    const after = getComputedStyle(el, '::after');
    return [parseFloat(style.width), parseFloat(style.height), parseFloat(after.width), parseFloat(after.height), after.position, after.animationName];
  })()`);
  expect(ring).toEqual([64, 64, 64, 64, 'absolute', 'ds-ripple']);
});

test('the demo: every cause has an icon and a title; Tab reaches an action, the rest is no stop', async ({ page }) => {
  await open(page);
  const causes = await page.$$eval('[data-demo="causes"] .ds-empty', (all) => all.map((el) => [Boolean(el.querySelector('.ds-empty__disc svg')), el.querySelector('.ds-empty__title').textContent.length > 2, el.tabIndex]));
  expect(causes.length).toBe(8);
  for (const [icon, title, tab] of causes) expect([icon, title, tab]).toEqual([true, true, -1]);
  const action = page.locator('[data-demo="causes"] .ds-empty .ds-btn').first();
  await action.focus();
  await expect(action).toBeFocused();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.tagName)).toBe('BUTTON');
});

test('forced colours: the fills go, a cause changes nothing, the done disc keeps its outline', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const look = '[style.backgroundColor, style.color]';
  expect(await probe(page, disc('ds-empty--error'), look)).toEqual(await probe(page, disc('ds-empty--offline'), look));
  expect(await probe(page, disc('ds-empty--done'), 'style.outlineStyle')).toBe('solid');
});
