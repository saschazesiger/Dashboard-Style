/**
 * The card on the options model (3.0), on its demo: the padding and the
 * rhythm at every density, --ds-card-pad following; what size leaves alone;
 * .ds-touch on an interactive card; the shape at rest and pressed; the
 * variants; the horizontal layout, in a row and wrapped; selectable cards by
 * pointer and keyboard, with their check; the names; the 2.x aliases; forced
 * colours. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=card');
  await ready(page);
  await page.mouse.move(1, 1);
}

/** Adds markup to the page, in a region of its own that the test can name. */
const add = (page, html) => page.evaluate((markup) => {
  const region = document.createElement('div');
  region.id = 'probe';
  region.insertAdjacentHTML('beforeend', markup);
  document.getElementById('probe')?.remove();
  document.getElementById('fx-component').prepend(region);
}, html);

const finish = (page, selector) => page.$eval(selector, (el) => Promise.all(el.getAnimations().map((animation) => animation.finished.catch(() => null))).then(() => undefined));

const radius = (page, selector) => page.$eval(selector, (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));

test('density: 2px per step off the padding and the rhythm; --ds-card-pad follows; size and type stay', async ({ page }) => {
  await open(page);
  for (const [density, step] of DENSITIES) {
    await add(page, `<section class="ds-card ${density}" id="card"><h3 class="ds-card__title" id="title">Title</h3><p class="ds-muted" id="text">Text</p></section>
      <section class="ds-card ds-card--filled ${density}" id="filled"><p>Filled</p></section>`);
    const measured = await page.evaluate(() => {
      const card = document.getElementById('card');
      const style = getComputedStyle(card);
      const gap = document.getElementById('text').getBoundingClientRect().top - document.getElementById('title').getBoundingClientRect().bottom;
      return { pad: parseFloat(style.paddingLeft), read: style.getPropertyValue('--ds-card-pad').trim().length > 0, gap, filled: parseFloat(getComputedStyle(document.getElementById('filled')).paddingLeft), font: getComputedStyle(document.getElementById('title')).fontSize };
    });
    expect(measured.pad, density).toBe(24 + step * 2);
    expect(measured.gap, density).toBeCloseTo(16 + step * 2, 0);
    expect(measured.filled, density).toBe(20 + step * 2);
    expect(measured.read).toBe(true);
    expect(measured.font, 'type stays').toBe('16px');
  }
  // Size has no height to change: the padding stays, and it reaches the controls inside.
  await add(page, '<section class="ds-card ds-sm" id="card"><div class="ds-card__row"><h3 class="ds-card__title">T</h3><button class="ds-btn" type="button" id="inside">Run</button></div></section>');
  expect(await page.$eval('#card', (el) => parseFloat(getComputedStyle(el).paddingLeft))).toBe(24);
  expect(await page.$eval('#inside', (el) => el.getBoundingClientRect().height)).toBe(32);
});

test('touch: an interactive card is at least the touch target high; a plain one keeps its height', async ({ page }) => {
  await open(page);
  await add(page, `<div class="ds-touch" style="--ds-card-padding:0px">
    <button class="ds-card ds-card--interactive" type="button" id="small"></button>
    <section class="ds-card" id="plain"></section>
  </div>`);
  expect(await page.$eval('#small', (el) => el.getBoundingClientRect().height)).toBe(48);
  expect(await page.$eval('#plain', (el) => el.getBoundingClientRect().height)).toBeLessThan(10);
});

test('shape: multiplies the rest and the pressed radius; a pressed card never rounder than at rest; the stretched action follows', async ({ page }) => {
  await open(page);
  await add(page, `
    <div class="ds-shape-square"><button class="ds-card ds-card--interactive" type="button" id="square">A</button></div>
    <div class="ds-shape-soft"><button class="ds-card ds-card--interactive" type="button" id="soft">A</button></div>
    <button class="ds-card ds-card--interactive" type="button" id="default">A</button>
    <div class="ds-shape-round"><button class="ds-card ds-card--interactive" type="button" id="round">A</button></div>
    <div class="ds-shape-soft"><div class="ds-card ds-card--interactive" id="div"><a class="ds-card__action" href="#x" id="action">A</a></div></div>
    <button class="ds-card ds-card--interactive" type="button" aria-disabled="true" id="blocked">A</button>
    <div class="ds-card" style="--ds-card-radius:20px" id="hook">A</div>`);
  const rest = {};
  for (const id of ['square', 'soft', 'default', 'round']) rest[id] = await radius(page, `#${id}`);
  expect(rest).toEqual({ square: 0, soft: 6, default: 12, round: 18 });
  expect(await radius(page, '#hook')).toBe(20);
  expect(await page.$eval('#action', (el) => parseFloat(getComputedStyle(el, '::after').borderTopLeftRadius))).toBe(6);
  const pressed = {};
  for (const id of ['square', 'soft', 'default', 'round']) {
    await page.$eval(`#${id}`, (el) => el.classList.add('ds-pressed'));
    await finish(page, `#${id}`);
    pressed[id] = await radius(page, `#${id}`);
  }
  // --ds-radius-card-pressed (8px) times the shape.
  expect(pressed).toEqual({ square: 0, soft: 4, default: 8, round: 12 });
  await page.$eval('#blocked', (el) => el.classList.add('ds-pressed'));
  await finish(page, '#blocked');
  expect(await radius(page, '#blocked')).toBe(12);
});

test('variants: outlined is the default look, filled a tonal block, elevated a shadow instead of the hairline', async ({ page }) => {
  await open(page);
  await add(page, `<section class="ds-card" id="base">A</section><section class="ds-card ds-card--outlined" id="outlined">A</section>
    <section class="ds-card ds-card--filled" id="filled">A</section><section class="ds-card ds-card--elevated" id="elevated">A</section>`);
  const looks = await page.evaluate(() => Object.fromEntries(['base', 'outlined', 'filled', 'elevated'].map((id) => {
    const style = getComputedStyle(document.getElementById(id));
    return [id, { border: style.borderTopColor, background: style.backgroundColor, shadow: style.boxShadow }];
  })));
  expect(looks.outlined).toEqual(looks.base);
  expect(looks.filled.background).not.toBe(looks.base.background);
  expect(looks.filled.border).toBe('rgba(0, 0, 0, 0)');
  expect(looks.elevated.shadow).not.toBe('none');
  expect(looks.elevated.border).toBe('rgba(0, 0, 0, 0)');
});

test('horizontal: media beside the body in a wide card, each on a whole line once it is too narrow; a button card too', async ({ page }) => {
  await open(page);
  const layout = (id) => page.evaluate((name) => {
    const card = document.getElementById(name);
    const media = card.querySelector('.ds-card__media').getBoundingClientRect();
    const body = card.querySelector('.ds-card__body').getBoundingClientRect();
    return { media, body, sameRow: Math.abs(media.top - body.top) < 1 && media.right <= body.left, mediaWidth: media.width, bodyWidth: body.width, cardInner: card.clientWidth - parseFloat(getComputedStyle(card).paddingLeft) * 2 };
  }, id);
  const card = (id, tag, width) => `<div style="inline-size:${width}px"><${tag} class="ds-card ${tag === 'button' ? 'ds-card--interactive ' : ''}ds-card--horizontal" ${tag === 'button' ? 'type="button"' : ''} id="${id}"><span class="ds-card__media">M</span><span class="ds-card__body"><span class="ds-card__title">Title</span><span class="ds-muted">Text</span></span></${tag}></div>`;
  await add(page, card('wide', 'section', 800) + card('narrow', 'section', 300) + card('wide-button', 'button', 800) + card('narrow-button', 'button', 300));
  for (const id of ['wide', 'wide-button']) {
    const box = await layout(id);
    expect(box.sameRow, id).toBe(true);
    expect(box.mediaWidth, `${id}: the media keeps about its size`).toBeLessThan(170);
    expect(box.mediaWidth, id).toBeGreaterThanOrEqual(160);
  }
  for (const id of ['narrow', 'narrow-button']) {
    const box = await layout(id);
    expect(box.sameRow, id).toBe(false);
    expect(box.media.bottom, `${id}: the body under the media`).toBeLessThanOrEqual(box.body.top);
    expect(box.mediaWidth, id).toBeCloseTo(box.cardInner, 0);
    expect(box.bodyWidth, id).toBeCloseTo(box.cardInner, 0);
  }
  // No rhythm margin between the two: the gap decides.
  expect(await page.$eval('#narrow > .ds-card__body', (el) => getComputedStyle(el).marginTop)).toBe('0px');
});

test('selectable: a press selects, the check says so; a blocked card stays; the keyboard does the same', async ({ page }) => {
  await open(page);
  const plans = page.locator('[data-demo="plans"]');
  const standard = plans.getByRole('button', { name: /^Standard/ });
  const extended = plans.getByRole('button', { name: /^Extended/ });
  const archive = plans.getByRole('button', { name: /^Archive/ });
  await expect(standard).toHaveAttribute('aria-pressed', 'true');
  await expect(extended).toHaveAttribute('aria-pressed', 'false');
  const mark = (locator) => locator.locator('.ds-card__check').evaluate((el) => {
    const style = getComputedStyle(el);
    return { background: style.backgroundColor, color: style.color, border: style.borderTopColor, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height, hidden: el.getAttribute('aria-hidden'), pointer: style.pointerEvents, margin: style.marginTop };
  });
  await settle(page);
  const on = await mark(standard);
  const off = await mark(extended);
  expect(on.background).not.toBe('rgba(0, 0, 0, 0)');
  expect(on.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(off.background).toBe('rgba(0, 0, 0, 0)');
  expect(off.color, 'no check at rest').toBe('rgba(0, 0, 0, 0)');
  expect(off.border, 'the empty mark has an edge').not.toBe('rgba(0, 0, 0, 0)');
  expect([on.width, on.height, on.hidden, on.pointer, on.margin]).toEqual([20, 20, 'true', 'none', '0px']);

  // The content keeps clear of the mark; the mark sits on the title's line.
  const clear = await standard.evaluate((card) => {
    const check = card.querySelector('.ds-card__check').getBoundingClientRect();
    const title = card.querySelector('.ds-card__title').getBoundingClientRect();
    return { textEnd: title.right, checkStart: check.left, offset: (check.top + check.bottom) / 2 - (title.top + title.bottom) / 2 };
  });
  expect(clear.textEnd).toBeLessThanOrEqual(clear.checkStart);
  expect(Math.abs(clear.offset)).toBeLessThan(2);

  await extended.click();
  await expect(extended).toHaveAttribute('aria-pressed', 'true');
  await expect(standard).toHaveAttribute('aria-pressed', 'false');
  await settle(page);
  const moved = await mark(extended);
  expect(moved.background).toBe(on.background);

  // The mark transitions on the card's colour timing, from where it is.
  const transition = await extended.locator('.ds-card__check').evaluate((el) => getComputedStyle(el).transitionProperty);
  expect(transition).toContain('background-color');

  await archive.click({ force: true });
  await expect(archive, 'an aria-disabled card ignores the press').toHaveAttribute('aria-pressed', 'false');

  // The keyboard: a ring and the focus layer, Space and Enter press.
  await focusByKeyboard(page, standard);
  await settle(page);
  const ring = await standard.evaluate((el) => {
    const style = getComputedStyle(el);
    return { outline: style.outlineStyle, width: style.outlineWidth, layer: parseFloat(getComputedStyle(el, '::before').opacity) };
  });
  expect(ring.outline).toBe('solid');
  expect(ring.width).toBe('2px');
  expect(ring.layer).toBeGreaterThan(0);
  await page.keyboard.press('Space');
  await expect(standard).toHaveAttribute('aria-pressed', 'true');
  await focusByKeyboard(page, extended);
  await page.keyboard.press('Enter');
  await expect(extended).toHaveAttribute('aria-pressed', 'true');
  await expect(standard).toHaveAttribute('aria-pressed', 'false');
});

test('the <div> form: the selected look comes through :has() from its action; its other link stays usable', async ({ page }) => {
  await open(page);
  const card = page.locator('[data-demo="plans"] > div.ds-card');
  const action = card.getByRole('button', { name: 'Custom' });
  const link = card.getByRole('link', { name: 'Compare plans' });
  await expect(link).toBeVisible();
  const look = () => card.evaluate((el) => ({ background: getComputedStyle(el).backgroundColor, check: getComputedStyle(el.querySelector('.ds-card__check')).color }));
  await settle(page);
  const before = await look();
  await action.click();
  await expect(action).toHaveAttribute('aria-pressed', 'true');
  await settle(page);
  const after = await look();
  expect(after.background).not.toBe(before.background);
  expect(after.check).not.toBe(before.check);
  await focusByKeyboard(page, action);
  await settle(page);
  expect(await card.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  // The link sits above the stretched action.
  const hit = await link.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) === el;
  });
  expect(hit).toBe(true);
});

test('clickable: the three forms open by pointer and keyboard; disabled and aria-disabled show no press', async ({ page }) => {
  await open(page);
  const clickable = page.locator('[data-demo="clickable"]');
  await expect(clickable.getByRole('link', { name: /MONITOR-0007/ })).toBeVisible();
  const button = clickable.getByRole('button', { name: /PRINTER-0003/ });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.ds-toast').filter({ hasText: 'Opened PRINTER-0003' })).toBeVisible();
  // No morph on hover and nothing moves on it.
  const disabled = clickable.getByRole('button', { name: /Disabled/ });
  await expect(disabled).toBeDisabled();
  const blocked = clickable.getByRole('button', { name: /Blocked/ });
  await blocked.hover();
  await settle(page);
  expect(await blocked.evaluate((el) => getComputedStyle(el, '::before').opacity)).toBe('0');
});

test('the 2.x names keep working: .ds-subsection and .ds-more are aliases of .ds-card__section and .ds-card__more', async ({ page }) => {
  await open(page);
  await add(page, `<section class="ds-card"><div class="ds-subsection" id="old"><p>A</p></div><div class="ds-card__section" id="new"><p>A</p></div>
    <div class="ds-more" id="old-more"><button class="ds-btn" type="button">More</button></div><div class="ds-card__more" id="new-more"><button class="ds-btn" type="button">More</button></div></section>`);
  const read = (id) => page.$eval(`#${id}`, (el) => {
    const style = getComputedStyle(el);
    return [style.display, style.gap, style.paddingTop, style.borderTopWidth, style.borderTopColor, style.justifyContent];
  });
  expect(await read('old')).toEqual(await read('new'));
  expect(await read('old-more')).toEqual(await read('new-more'));
});

test('forced colours: a selected card Highlight with its check, an elevated card an edge, a blocked card GrayText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await add(page, `<button class="ds-card ds-card--interactive ds-card--selectable" type="button" aria-pressed="true" id="on"><span class="ds-card__title">On</span><span class="ds-card__check" aria-hidden="true"></span></button>
    <button class="ds-card ds-card--interactive ds-card--selectable" type="button" aria-pressed="false" id="off"><span class="ds-card__title">Off</span><span class="ds-card__check" aria-hidden="true"></span></button>
    <button class="ds-card ds-card--interactive" type="button" aria-disabled="true" id="blocked"><span class="ds-card__title">Blocked</span></button>
    <section class="ds-card ds-card--elevated" id="elevated">A</section>`);
  await settle(page);
  const system = await page.evaluate(() => {
    const probe = (property, value) => {
      const el = document.createElement('span');
      el.style.forcedColorAdjust = 'none';
      el.style[property] = value;
      document.body.append(el);
      const colour = getComputedStyle(el)[property];
      el.remove();
      return colour;
    };
    return { highlight: probe('backgroundColor', 'Highlight'), highlightText: probe('color', 'HighlightText'), grayText: probe('color', 'GrayText'), canvasText: probe('color', 'CanvasText') };
  });
  const read = (selector) => page.$eval(selector, (el) => {
    const style = getComputedStyle(el);
    return { background: style.backgroundColor, color: style.color, border: style.borderTopColor };
  });
  const on = await read('#on');
  expect(on.background).toBe(system.highlight);
  expect(on.color).toBe(system.highlightText);
  const check = await read('#on .ds-card__check');
  expect(check.background, 'the check stands out from the fill').toBe(system.highlightText);
  expect(check.color).toBe(system.highlight);
  expect((await read('#off .ds-card__check')).border).toBe(system.canvasText);
  expect((await read('#blocked')).color).toBe(system.grayText);
  expect((await read('#elevated')).border).toBe(system.canvasText);
  // The shape holds in forced colours too.
  expect(await radius(page, '#on')).toBe(12);
});
