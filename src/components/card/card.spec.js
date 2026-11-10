/**
 * The card on the options model (3.0), on its demo: the padding and the
 * rhythm at every density, --ds-card-pad following; what size leaves alone;
 * .ds-touch on an interactive card; the shape at rest and pressed; the
 * variants; the horizontal layout, in a row and wrapped; selectable cards by
 * pointer and keyboard, with their check; the body's rhythm against the
 * card's; the hover shadow; the blocked look; the three clickable forms; the
 * names; the 2.x aliases; forced colours. Runs in the `fallback` project too.
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

test('the rhythm is the card\'s: a density class on a child changes the child and not the gap above it', async ({ page }) => {
  await open(page);
  await add(page, `<section class="ds-card" id="card"><p id="one">One</p><p class="ds-density-tight" id="two">Two</p><p id="three">Three</p>
    <div class="ds-card ds-card--filled" id="nested"><p id="inner-one">Inner</p><p id="inner-two">Inner</p></div></section>`);
  const gap = (above, below) => page.evaluate(([a, b]) => document.getElementById(b).getBoundingClientRect().top - document.getElementById(a).getBoundingClientRect().bottom, [above, below]);
  expect(await gap('one', 'two')).toBeCloseTo(16, 0);
  expect(await gap('two', 'three')).toBeCloseTo(16, 0);
  expect(await gap('three', 'nested'), 'a nested card without a density class').toBeCloseTo(16, 0);
  expect(await gap('inner-one', 'inner-two')).toBeCloseTo(16, 0);
  // A card with a density class still sets the rhythm of its own children.
  await add(page, '<section class="ds-card ds-density-tight"><p id="one">One</p><p id="two">Two</p></section>');
  expect(await gap('one', 'two')).toBeCloseTo(10, 0);
});

test('.ds-card__body keeps the card\'s rhythm: the same gaps around a subtitle and a section, at every density, in a <span> body too', async ({ page }) => {
  await open(page);
  const BLOCKS = '<h3 class="ds-card__title">Title</h3><p>Text</p><h4 class="ds-card__subtitle">Sources</h4><p>Text</p><p>Text</p><div class="ds-card__section"><p>Section</p></div><p>Last</p>';
  const SPANS = '<span class="ds-card__title">Title</span><span>Text</span><span class="ds-card__subtitle">Sources</span><span>Text</span><span>Text</span>';
  const gaps = (id) => page.evaluate((name) => {
    const box = document.getElementById(name);
    const list = [...box.children].map((el) => el.getBoundingClientRect());
    return list.slice(1).map((rect, index) => Math.round((rect.top - list[index].bottom) * 2) / 2);
  }, id);
  for (const [density, step] of DENSITIES) {
    await add(page, `<div class="${density}" style="inline-size:800px">
      <section class="ds-card" id="card">${BLOCKS}</section>
      <section class="ds-card ds-card--horizontal"><div class="ds-card__media">M</div><div class="ds-card__body" id="body">${BLOCKS}</div></section>
      <button class="ds-card ds-card--interactive" type="button" id="button">${SPANS}</button>
      <button class="ds-card ds-card--interactive ds-card--horizontal" type="button"><span class="ds-card__media">M</span><span class="ds-card__body" id="span-body">${SPANS}</span></button>
    </div>`);
    const rhythm = 16 + step * 2;
    expect(await gaps('card'), density).toEqual([rhythm, 24, 8, rhythm, 8, rhythm]);
    expect(await gaps('body'), density).toEqual(await gaps('card'));
    expect(await gaps('span-body'), `${density}: the spans stack`).toEqual(await gaps('button'));
  }
  await add(page, '<section class="ds-card ds-card--horizontal"><div class="ds-card__media">M</div><div class="ds-card__body"><p id="filled">Text</p><p id="empty"></p></div></section>');
  expect(await page.$eval('#empty', (el) => getComputedStyle(el).display), 'an empty live region takes no room').toBe('none');
});

test('a switch in the header row hangs out of the title line, whatever its size and touch', async ({ page }) => {
  await open(page);
  const row = (cls) => `<section class="ds-card ${cls}"><div class="ds-card__row" data-row><h3 class="ds-card__title">T</h3><label class="ds-switch"><input type="checkbox"><span class="ds-switch__track"></span></label></div></section>`;
  await add(page, row('') + row('ds-sm') + row('ds-lg') + row('ds-density-compact') + row('ds-density-tight') + row('ds-touch'));
  const heights = await page.$$eval('[data-row]', (list) => list.map((el) => el.getBoundingClientRect().height));
  expect(heights).toEqual([24, 24, 24, 24, 24, 24]);
});

test('hover: an elevated card keeps its shadow, a hook replaces any card\'s; a blocked card takes no hover shadow', async ({ page }) => {
  await open(page);
  const HOOK = 'style="--ds-card-hover-shadow:0 0 0 3px rgb(1, 2, 3)"';
  await add(page, `<div class="ds-stack">
    <button class="ds-card ds-card--elevated ds-card--interactive" type="button" id="elevated">Elevated</button>
    <button class="ds-card ds-card--elevated ds-card--interactive" type="button" ${HOOK} id="elevated-hook">Elevated with the hook</button>
    <button class="ds-card ds-card--interactive" type="button" id="plain">Plain</button>
    <button class="ds-card ds-card--interactive" type="button" ${HOOK} id="hooked">Hook</button>
    <button class="ds-card ds-card--interactive" type="button" aria-disabled="true" ${HOOK} id="blocked">Blocked</button>
    <button class="ds-card ds-card--interactive" type="button" disabled ${HOOK} id="disabled">Disabled</button>
    <button class="ds-card ds-card--elevated ds-card--interactive" type="button" aria-disabled="true" ${HOOK} id="elevated-blocked">Elevated, blocked</button>
  </div>`);
  const shadow = (id) => page.$eval(`#${id}`, (el) => getComputedStyle(el).boxShadow);
  const point = async (id) => {
    const box = await page.locator(`#${id}`).boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await settle(page);
  };
  const rest = {};
  for (const id of ['elevated', 'elevated-hook', 'plain', 'hooked', 'blocked', 'disabled', 'elevated-blocked']) rest[id] = await shadow(id);
  expect(rest.elevated).not.toBe('none');
  expect(rest.plain).toBe('none');

  await point('elevated');
  expect(await shadow('elevated'), 'under the pointer').toBe(rest.elevated);
  await page.mouse.down();
  await settle(page);
  expect(await shadow('elevated'), 'pressed').toBe(rest.elevated);
  await page.mouse.up();

  await point('plain');
  expect(await shadow('plain')).toBe('none');
  await point('hooked');
  expect(await shadow('hooked')).not.toBe('none');
  await point('elevated-hook');
  expect(await shadow('elevated-hook')).not.toBe(rest['elevated-hook']);
  for (const id of ['blocked', 'disabled', 'elevated-blocked']) {
    await point(id);
    expect(await shadow(id), id).toBe(rest[id]);
  }
});

test('blocked: a disabled and an aria-disabled card look it, on the one disabled model', async ({ page }) => {
  await open(page);
  const clickable = page.locator('[data-demo="clickable"]');
  const read = (locator) => locator.evaluate((el) => {
    const style = getComputedStyle(el);
    const title = el.querySelector('.ds-card__title');
    const muted = el.querySelector('.ds-muted');
    return { cursor: style.cursor, ink: style.color, opacity: style.opacity, title: getComputedStyle(title).color, muted: getComputedStyle(muted).color };
  });
  await settle(page);
  const enabled = await read(clickable.getByRole('button', { name: /PRINTER-0003/ }));
  const disabled = await read(clickable.getByRole('button', { name: /Disabled/ }));
  const blocked = await read(clickable.getByRole('button', { name: /Blocked/ }));
  expect(enabled.cursor).toBe('pointer');
  for (const look of [disabled, blocked]) {
    expect(look.cursor).toBe('not-allowed');
    expect(look.opacity, 'the default model: full opacity, the ink').toBe('1');
    expect(look.ink).not.toBe(enabled.ink);
    expect(look.title, 'the title follows').toBe(look.ink);
    expect(look.muted, 'the quiet text follows').toBe(look.ink);
  }
  // A theme may dim the whole card instead: the hook, with the ink off.
  await add(page, `<div style="--ds-disabled-opacity:var(--ds-state-disabled);--ds-disabled-ink:initial">
    <button class="ds-card ds-card--interactive" type="button" disabled id="dim"><span class="ds-card__title">Dim</span></button></div>
    <button class="ds-card ds-card--interactive" type="button" id="reference"><span class="ds-card__title">Reference</span></button>`);
  await settle(page);
  const dim = await page.$eval('#dim', (el) => [getComputedStyle(el).opacity, getComputedStyle(el).color, getComputedStyle(el.firstElementChild).color]);
  const reference = await page.$eval('#reference', (el) => getComputedStyle(el).color);
  expect(Number(dim[0])).toBeLessThan(1);
  expect(dim[1]).toBe(reference);
  expect(dim[2], 'no cycle through --ds-text').toBe(reference);
  // Selected and blocked: the mark still says selected, in the disabled colours.
  await add(page, `<button class="ds-card ds-card--interactive ds-card--selectable" type="button" aria-pressed="true" id="on"><span class="ds-card__title">On</span><span class="ds-card__check" aria-hidden="true"></span></button>
    <button class="ds-card ds-card--interactive ds-card--selectable" type="button" aria-pressed="true" aria-disabled="true" id="both"><span class="ds-card__title">Both</span><span class="ds-card__check" aria-hidden="true"></span></button>
    <button class="ds-card ds-card--interactive ds-card--selectable" type="button" aria-pressed="false" aria-disabled="true" id="off"><span class="ds-card__title">Off</span><span class="ds-card__check" aria-hidden="true"></span></button>
    <div class="ds-card ds-card--interactive ds-card--selectable" aria-disabled="true" id="both-div"><h3 class="ds-card__title"><button class="ds-card__action" type="button" aria-pressed="true">Both</button></h3><span class="ds-card__check" aria-hidden="true"></span></div>`);
  await settle(page);
  const check = (id) => page.$eval(`#${id} .ds-card__check`, (el) => getComputedStyle(el).backgroundColor);
  expect(await check('both')).not.toBe(await check('on'));
  expect(await check('both')).not.toBe('rgba(0, 0, 0, 0)');
  expect(await check('both-div')).toBe(await check('both'));
  expect(await check('off')).toBe('rgba(0, 0, 0, 0)');
  expect(await page.$eval('#both-div .ds-card__title', (el) => getComputedStyle(el).color)).toBe(await page.$eval('#both .ds-card__title', (el) => getComputedStyle(el).color));
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

test('clickable: the three forms open by pointer and keyboard; a press morphs and hover moves nothing; a blocked card shows no press', async ({ page }) => {
  await open(page);
  const clickable = page.locator('[data-demo="clickable"]');
  const link = clickable.getByRole('link', { name: /MONITOR-0007/ });
  const button = clickable.getByRole('button', { name: /PRINTER-0003/ });
  const div = clickable.locator('div.ds-card');
  const action = div.locator('.ds-card__action');
  const restart = div.getByRole('button', { name: 'Restart' });
  // A new snackbar replaces the last one, so what opened is read from the clicks a key or the pointer makes.
  await clickable.evaluate((el) => {
    window.opened = [];
    el.addEventListener('click', (event) => {
      const target = event.target.closest('[data-demo]');
      if (target) window.opened.push(target.getAttribute('data-name') || target.getAttribute('data-demo'));
    });
  });
  const opened = () => page.evaluate(() => window.opened.splice(0));
  const toast = (text) => page.locator('.ds-toast').filter({ hasText: text }).first();

  await link.click();
  await expect(toast('Opened MONITOR-0007')).toBeVisible();
  await link.focus();
  await page.keyboard.press('Enter');
  expect(await opened(), 'the link form').toEqual(['MONITOR-0007', 'MONITOR-0007']);

  await button.click();
  await expect(toast('Opened PRINTER-0003')).toBeVisible();
  await button.focus();
  await page.keyboard.press('Enter');
  expect(await opened(), 'the button form').toEqual(['PRINTER-0003', 'PRINTER-0003']);

  // The <div> form: a click anywhere on the card lands on the stretched action.
  await div.scrollIntoViewIfNeeded();
  const text = await div.locator('.ds-muted').boundingBox();
  await page.mouse.click(text.x + text.width / 2, text.y + text.height / 2);
  await expect(toast('Opened LAPTOP-0017')).toBeVisible();
  await action.focus();
  await page.keyboard.press('Enter');
  expect(await opened(), 'the <div> form').toEqual(['LAPTOP-0017', 'LAPTOP-0017']);
  // Its other control stays its own.
  await restart.click();
  await expect(toast('Restarting LAPTOP-0017')).toBeVisible();
  expect(await opened()).toEqual(['restart']);

  await page.evaluate(() => document.activeElement.blur());
  const state = (locator) => locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, radius: parseFloat(getComputedStyle(el).borderTopLeftRadius), layer: Number(getComputedStyle(el, '::before').opacity) };
  });

  // Hover: a layer, no morph, nothing moves. The press: the layer stays under the ripple, the radius morphs.
  await button.scrollIntoViewIfNeeded();
  await page.mouse.move(1, 1);
  await settle(page);
  const rest = await state(button);
  await button.hover();
  await settle(page);
  const hovered = await state(button);
  expect(hovered.layer).toBeGreaterThan(0);
  expect({ ...hovered, layer: 0 }, 'hover moves nothing').toEqual({ ...rest, layer: 0 });
  await page.mouse.down();
  await settle(page);
  const pressed = await state(button);
  expect(pressed.radius, 'squarer while pressed').toBe(8);
  expect(pressed.width, 'nothing scales on press').toBe(rest.width);
  await page.mouse.up();
  // The ripple holds the press for its minimum time, then the radius springs back.
  await expect.poll(async () => (await state(button)).radius, { message: 'it springs back', timeout: 5000 }).toBe(rest.radius);
  await settle(page);

  // Blocked: no layer on hover or press, no morph, in both kinds.
  for (const name of [/Disabled/, /Blocked/]) {
    const card = clickable.getByRole('button', { name });
    await card.scrollIntoViewIfNeeded();
    const box = await card.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await settle(page);
    expect((await state(card)).layer, `${name}: hover`).toBe(0);
    await page.mouse.down();
    await settle(page);
    const down = await state(card);
    expect(down.layer, `${name}: press`).toBe(0);
    expect(down.radius, `${name}: no morph`).toBe(rest.radius);
    await page.mouse.up();
  }
  await expect(clickable.getByRole('button', { name: /Disabled/ })).toBeDisabled();
});

test('the 2.x names of .ds-card__section and .ds-card__more were removed in 3.0', async ({ page }) => {
  await open(page);
  // Built from fragments, so the removed-name guard of test/repo.test.js passes this file.
  const [section, more] = ['subsection', 'more'].map((name) => `ds-${name}`);
  await add(page, `<section class="ds-card"><div class="${section}" id="old"><p>A</p></div><div class="ds-card__section" id="new"><p>A</p></div>
    <div class="${more}" id="old-more"><button class="ds-btn" type="button">More</button></div><div class="ds-card__more" id="new-more"><button class="ds-btn" type="button">More</button></div></section>`);
  const read = (id) => page.$eval(`#${id}`, (el) => {
    const style = getComputedStyle(el);
    return [style.display, style.borderTopWidth, style.justifyContent];
  });
  expect(await read('new')).toEqual(['grid', '1px', 'normal']);
  expect(await read('old')).toEqual(['block', '0px', 'normal']);
  expect((await read('new-more'))[2]).toBe('center');
  expect(await read('old-more')).toEqual(['block', '0px', 'normal']);
});

test('forced colours: a selected card Highlight with its check, an elevated card an edge, a blocked card GrayText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await add(page, `<button class="ds-card ds-card--interactive ds-card--selectable" type="button" aria-pressed="true" id="on"><span class="ds-card__title">On</span><span class="ds-card__check" aria-hidden="true"></span></button>
    <button class="ds-card ds-card--interactive ds-card--selectable" type="button" aria-pressed="false" id="off"><span class="ds-card__title">Off</span><span class="ds-card__check" aria-hidden="true"></span></button>
    <button class="ds-card ds-card--interactive" type="button" aria-disabled="true" id="blocked"><span class="ds-card__title">Blocked</span></button>
    <section class="ds-card ds-card--elevated" id="elevated">A</section>
    <button class="ds-card ds-card--interactive ds-card--horizontal" type="button" aria-pressed="true" id="on-media"><span class="ds-card__media">M</span><span class="ds-card__body"><span class="ds-card__title">On</span></span></button>
    <button class="ds-card ds-card--interactive ds-card--horizontal" type="button" aria-disabled="true" id="blocked-media"><span class="ds-card__media">M</span><span class="ds-card__body"><span class="ds-card__title">Blocked</span></span></button>
    <button class="ds-card ds-card--interactive ds-card--selectable ds-card--horizontal" type="button" aria-pressed="true" aria-disabled="true" id="both"><span class="ds-card__media">M</span><span class="ds-card__body"><span class="ds-card__title">Both</span></span><span class="ds-card__check" aria-hidden="true"></span></button>
    <button class="ds-card ds-card--interactive ds-card--selectable" type="button" aria-pressed="true" disabled id="both-native"><span class="ds-card__title">Both</span><span class="ds-card__check" aria-hidden="true"></span></button>
    <div class="ds-card ds-card--interactive ds-card--selectable ds-card--horizontal" aria-disabled="true" id="both-div"><div class="ds-card__media">M</div><div class="ds-card__body"><h3 class="ds-card__title"><button class="ds-card__action" type="button" aria-pressed="true">Both</button></h3></div><span class="ds-card__check" aria-hidden="true"></span></div>
    <div class="ds-card ds-card--interactive ds-card--horizontal" id="on-div"><div class="ds-card__media">M</div><div class="ds-card__body"><h3 class="ds-card__title"><button class="ds-card__action" type="button" aria-pressed="true">On</button></h3></div></div>`);
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
    return { highlight: probe('backgroundColor', 'Highlight'), highlightText: probe('color', 'HighlightText'), grayText: probe('color', 'GrayText'), canvasText: probe('color', 'CanvasText'), canvas: probe('backgroundColor', 'Canvas') };
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
  // The media inherits the card's forced-color-adjust, so it takes the card's colours.
  for (const id of ['on-media', 'on-div']) {
    const media = await read(`#${id} .ds-card__media`);
    expect([media.background, media.color], id).toEqual([system.highlight, system.highlightText]);
  }
  for (const id of ['blocked-media', 'both', 'both-div']) {
    const media = await read(`#${id} .ds-card__media`);
    expect([media.background, media.color], id).toEqual([system.canvas, system.grayText]);
  }
  // Blocked and selected is blocked: the card, its text and its check in the blocked colours.
  for (const id of ['both', 'both-native', 'both-div']) {
    const look = await read(`#${id}`);
    expect([look.background, look.color, look.border], id).toEqual([system.canvas, system.grayText, system.grayText]);
    expect((await read(`#${id} .ds-card__title`)).color, id).toBe(system.grayText);
    const mark = await read(`#${id} .ds-card__check`);
    expect([mark.background, mark.color, mark.border], id).toEqual([system.grayText, system.canvas, system.grayText]);
    expect(await page.$eval(`#${id}`, (el) => getComputedStyle(el, '::after').borderTopColor), id).toBe(system.grayText);
  }
  expect((await read('#both-div .ds-card__action')).color).toBe(system.grayText);
  // The shape holds in forced colours too.
  expect(await radius(page, '#on')).toBe(12);
});
