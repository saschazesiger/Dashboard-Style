/**
 * The controls of 2.0 in real engines (fixtures/controls-2.html): the
 * ripple handle (a captured pointer ends the press, release(), destroy()),
 * a programmatic chip toggle that glides, .ds-pressable, actions on
 * demand, buttons (disclosure tint, a locked choice, the adaptive label,
 * faces with an icon), action and input chips, badges, selected tiles and
 * cards with intrinsic tile columns, alerts, the done state, the switch
 * (the input covers the track, aria-disabled, locked, a list, the text
 * centred on the track), icons that fill and DS.icons.fill(), forced
 * colours and the settled shots.
 */
import { test, expect } from './base-test.js';
import { ready, settle, focusByKeyboard } from './helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/controls-2.html';

async function open(page, { attach = true } = {}) {
  await page.goto(FIXTURE);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
  if (attach) await page.evaluate(() => { window.fxRipples = DS.ripple.attach(document); });
}

/** Computed style values of the element (or its pseudo-element). */
const styleOf = (locator, props, pseudo) => locator.evaluate((el, [names, pseudoElement]) => {
  const style = getComputedStyle(el, pseudoElement || undefined);
  return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name)]));
}, [props, pseudo || null]);

/** The resolved colour of a custom property on the theme root, as the engine paints it. */
const colourOf = (page, token) => page.evaluate((name) => {
  const probe = document.createElement('span');
  probe.style.color = `var(${name})`;
  document.querySelector('.ds-theme').append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}, token);

test.describe('the ripple handle (CT-1)', () => {
  test('an ancestor that captures the pointer ends the press before the button goes up', async ({ page }) => {
    await open(page);
    // The row drags to scroll: past 6px it captures the pointer, as such rows do.
    await page.evaluate(() => {
      const row = document.getElementById('drag-row');
      let start = null;
      row.addEventListener('pointerdown', (event) => { start = { x: event.clientX, id: event.pointerId, left: row.scrollLeft }; });
      row.addEventListener('pointermove', (event) => {
        if (!start || !(event.buttons & 1)) return;
        if (Math.abs(event.clientX - start.x) > 6 && !row.hasPointerCapture(start.id)) row.setPointerCapture(start.id);
        row.scrollLeft = start.left - (event.clientX - start.x);
      });
      row.addEventListener('pointerup', () => { start = null; });
    });
    const chip = page.locator('#drag-chip');
    await chip.scrollIntoViewIfNeeded();
    const box = await chip.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    expect(await chip.evaluate((el) => el.classList.contains('ds-pressed'))).toBe(true);
    await expect(chip.locator('.ds-press-ripple')).toHaveCount(1);
    // The fade may finish (and the ripple go) before a poll sees it: record it as it starts.
    await chip.evaluate((el) => {
      window.fxFaded = false;
      new MutationObserver(() => {
        if (el.querySelector('.ds-press-ripple--out')) window.fxFaded = true;
      }).observe(el, { subtree: true, attributes: true, attributeFilter: ['class'] });
    });
    await page.mouse.move(box.x + box.width / 2 - 40, box.y + box.height / 2, { steps: 4 });
    // Still held: the ripple fades as on release, and .ds-pressed goes after its minimum.
    await expect.poll(() => page.evaluate(() => window.fxFaded), { timeout: 2000 }).toBe(true);
    await expect.poll(() => chip.evaluate((el) => el.classList.contains('ds-pressed')), { timeout: 2000 }).toBe(false);
    await page.mouse.up();
    await expect.poll(() => chip.locator('.ds-press-ripple').count(), { timeout: 2000 }).toBe(0);
  });

  test('release() ends a press by hand, with or without a host; destroy() and the deprecated detach() take it all back', async ({ page }) => {
    await open(page);
    for (const byHost of [true, false]) {
      const button = page.locator('#btn-badge');
      const box = await button.boundingBox();
      await page.mouse.move(box.x + 10, box.y + 10);
      await page.mouse.down();
      await expect(button.locator('.ds-press-ripple:not(.ds-press-ripple--out)')).toHaveCount(1);
      await page.evaluate((host) => window.fxRipples.release(host ? document.getElementById('btn-badge') : undefined), byHost);
      await expect(button.locator('.ds-press-ripple--out')).toHaveCount(1);
      await expect.poll(() => button.evaluate((el) => el.classList.contains('ds-pressed')), { timeout: 2000 }).toBe(false);
      await page.mouse.up();
      await expect.poll(() => button.locator('.ds-press-ripple').count(), { timeout: 2000 }).toBe(0);
    }
    // Nothing to release: no error.
    await page.evaluate(() => window.fxRipples.release());
    const state = await page.evaluate(() => {
      const handle = window.fxRipples;
      const keys = Object.keys(handle).sort();
      handle.detach();
      const after = document.documentElement.classList.contains('ds-ripples');
      const again = DS.ripple.attach(document);
      const fresh = again !== handle;
      again.destroy();
      return { keys, after, fresh, now: document.documentElement.classList.contains('ds-ripples') };
    });
    expect(state).toEqual({ keys: ['destroy', 'detach', 'release'], after: false, fresh: true, now: false });
  });

  test('a chip toggled by script with a change event in the same task glides like a click', async ({ page }) => {
    await open(page);
    const glides = await page.evaluate(() => {
      const input = document.getElementById('chip-filter-input');
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return input.nextElementSibling.getAnimations({ subtree: true }).map((animation) => animation.id).filter(Boolean);
    });
    expect(glides).toContain('ds-chip-slot');
  });

  test('a chip whose input is aria-disabled gets no ripple, no press and the blocked look', async ({ page }) => {
    await open(page);
    const chip = page.locator('#chip-aria-disabled');
    const body = chip.locator('.ds-chip__body');
    await body.scrollIntoViewIfNeeded();
    const box = await body.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await settle(page);
    expect(Number((await styleOf(body, ['opacity'], '::before')).opacity)).toBe(0);
    await page.mouse.down();
    expect(await chip.locator('.ds-press-ripple').count()).toBe(0);
    expect(Number((await styleOf(body, ['opacity'], '::before')).opacity)).toBe(0);
    await page.mouse.up();
    expect(await chip.evaluate((el) => getComputedStyle(el).cursor)).toBe('not-allowed');
    // The disabled model: the neutral outline and ink (or the theme's dimming).
    const look = await styleOf(body, ['border-top-color', 'color', 'opacity']);
    const enabled = await styleOf(page.locator('#chip-filter .ds-chip__body'), ['border-top-color', 'color', 'opacity']);
    expect(look).not.toEqual(enabled);
  });
});

test.describe('press model and utilities (CT-2, CT-4)', () => {
  test('.ds-pressable lays the state layer over a project element and ripples; blocked ones show neither', async ({ page }) => {
    await open(page);
    const row = page.locator('#pressable');
    expect(await row.evaluate((el) => getComputedStyle(el).position)).toBe('relative');
    const box = await row.boundingBox();
    await page.mouse.move(box.x + 8, box.y + box.height / 2);
    await settle(page);
    const hover = Number((await styleOf(row, ['opacity'], '::before')).opacity);
    await page.mouse.down();
    await expect(row.locator('.ds-press-ripple')).toHaveCount(1);
    await page.mouse.up();
    const blocked = page.locator('#pressable-blocked');
    const blockedBox = await blocked.boundingBox();
    await page.mouse.move(blockedBox.x + 8, blockedBox.y + blockedBox.height / 2);
    await page.mouse.down();
    expect(await blocked.locator('.ds-press-ripple').count()).toBe(0);
    expect(Number((await styleOf(blocked, ['opacity'], '::before')).opacity)).toBe(0);
    await page.mouse.up();
    expect(await blocked.evaluate((el) => getComputedStyle(el).cursor)).toBe('not-allowed');
    const hasHover = await page.evaluate(() => matchMedia('(hover: hover)').matches);
    if (hasHover) expect(hover).toBeGreaterThan(0);
    // The ring rests one width out and snaps to the offset; the inset form rests at 0.
    await focusByKeyboard(page, row);
    await settle(page);
    const ring = await styleOf(row, ['outline-style', 'outline-offset']);
    expect(ring['outline-style']).toBe('solid');
    expect(parseFloat(ring['outline-offset'])).toBe(2);
    expect(parseFloat((await styleOf(blocked, ['outline-offset']))['outline-offset'])).toBe(0);
  });

  test('.ds-hover-actions shows with its row\'s hover or focus, by opacity only', async ({ page }) => {
    await open(page);
    const actions = page.locator('#hover-actions');
    const opacity = async () => Number((await styleOf(actions, ['opacity'])).opacity);
    const hasHover = await page.evaluate(() => matchMedia('(hover: hover)').matches);
    if (hasHover) expect(await opacity()).toBe(0);
    const box = await page.locator('#pressable').boundingBox();
    await page.mouse.move(box.x + 8, box.y + box.height / 2);
    await settle(page);
    expect(await opacity()).toBe(1);
    await page.mouse.move(1, 1);
    await settle(page);
    if (hasHover) expect(await opacity()).toBe(0);
    await focusByKeyboard(page, page.locator('#hover-action'));
    await settle(page);
    expect(await opacity()).toBe(1);
    // Still in the tree and focusable while hidden.
    await page.locator('#hover-action').evaluate((el) => el.blur());
    expect(await page.locator('#hover-action').evaluate((el) => el.tabIndex)).toBe(0);
  });

  test('.ds-hover-actions answers to its nearest host: a table in a card shows the pointed row\'s actions only', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      const button = (name) => `<span class="ds-hover-actions" id="host-actions-${name}"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--sm" type="button" id="host-action-${name}" aria-label="Edit ${name}">E</button></span>`;
      document.querySelector('.ds-theme').insertAdjacentHTML('afterbegin',
        '<section class="ds-card" id="host-card" style="width: 480px">' +
        '<h3 class="ds-card__title" id="host-card-title">Fleet</h3>' +
        '<input class="ds-input" id="host-card-search" aria-label="Search devices">' +
        '<table class="ds-table"><tbody>' +
        `<tr id="host-row-1"><td>LAPTOP-0042</td><td class="ds-table__actions">${button('1')}</td></tr>` +
        `<tr id="host-row-2"><td>TABLET-0121</td><td class="ds-table__actions">${button('2')}</td></tr>` +
        '</tbody></table></section>');
    });
    const opacity = async (name) => Number((await styleOf(page.locator(`#host-actions-${name}`), ['opacity'])).opacity);
    const both = async () => [await opacity('1'), await opacity('2')];
    const hasHover = await page.evaluate(() => matchMedia('(hover: hover)').matches);
    if (hasHover) {
      await page.locator('#host-card-title').hover();
      await settle(page);
      expect(await both(), 'the card\'s title hovered').toEqual([0, 0]);
      await page.locator('#host-row-1 td').first().hover();
      await settle(page);
      expect(await both(), 'the first row hovered').toEqual([1, 0]);
      await page.mouse.move(1, 1);
      await settle(page);
    }
    await focusByKeyboard(page, page.locator('#host-card-search'));
    await settle(page);
    if (hasHover) expect(await both(), 'the card\'s search field focused').toEqual([0, 0]);
    await focusByKeyboard(page, page.locator('#host-action-2'));
    await settle(page);
    if (hasHover) expect(await both(), 'the second row\'s action focused').toEqual([0, 1]);
    await page.locator('#host-row-1').evaluate((el) => el.setAttribute('aria-selected', 'true'));
    await settle(page);
    expect(await opacity('1'), 'a selected row').toBe(1);
    // An open menu counts in the actions, also when the button itself carries .ds-hover-actions.
    await page.locator('#host-action-2').evaluate((el) => { el.blur(); el.setAttribute('aria-expanded', 'true'); });
    await settle(page);
    expect(await opacity('2'), 'an open menu in the actions').toBe(1);
  });

  test('keys and dividers draw from tokens', async ({ page }) => {
    await open(page);
    const kbd = await styleOf(page.locator('#kbd'), ['font-family', 'border-top-width', 'min-width']);
    expect(kbd['border-top-width']).toBe('1px');
    expect(parseFloat(kbd['min-width'])).toBe(20);
    const divider = await styleOf(page.locator('#divider'), ['border-top-width', 'margin-top', 'height']);
    expect(divider).toEqual({ 'border-top-width': '1px', 'margin-top': '0px', height: '1px' });
    const label = await styleOf(page.locator('#divider-label'), ['display', 'border-top-width'], '::before');
    expect(label['border-top-width']).toBe('1px');
  });
});

test.describe('buttons, chips, badges (CT-6 to CT-8)', () => {
  test('an open disclosure or dialog opener takes the tint; a menu trigger does not; a locked choice keeps its on look', async ({ page }) => {
    await open(page);
    const accent = await colourOf(page, '--ds-accent');
    const bg = (id) => page.locator(id).evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(await bg('#btn-disclosure')).toBe(accent);
    expect(await bg('#btn-dialog-opener')).toBe(accent);
    expect(await bg('#btn-menu-opener')).not.toBe(accent);
    expect(await bg('#btn-locked')).toBe(accent);
    const locked = await styleOf(page.locator('#btn-locked'), ['opacity', 'cursor']);
    expect(locked).toEqual({ opacity: '1', cursor: 'default' });
    expect(Number((await styleOf(page.locator('#btn-locked-off'), ['opacity'])).opacity)).toBeLessThanOrEqual(1);
  });

  test('a leading icon in the first face pulls the start padding in; the adaptive label folds in a narrow panel', async ({ page }) => {
    await open(page);
    const pad = await styleOf(page.locator('#btn-faces-icon'), ['padding-left', 'padding-right']);
    expect(parseFloat(pad['padding-left'])).toBe(12);
    expect(parseFloat(pad['padding-right'])).toBe(16);
    const narrow = page.locator('#btn-adaptive-narrow');
    const narrowBox = await narrow.boundingBox();
    expect(Math.round(narrowBox.width)).toBe(40);
    expect(Math.round(narrowBox.height)).toBe(40);
    expect(await narrow.locator('.ds-btn__label').evaluate((el) => el.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
    expect(await narrow.evaluate((el) => el.textContent.trim())).toBe('Export');
    const wide = await page.locator('#btn-adaptive-wide').boundingBox();
    expect(wide.width).toBeGreaterThan(60);
  });

  test('an adaptive button outside a content panel (top bar, a page outside the frame) folds in a narrow window (2.1)', async ({ page }) => {
    await open(page);
    // A top bar, a .ds-vt-view page and a 900px .ds-content as a page would write them.
    await page.evaluate(() => {
      const button = (id, text) => `<button class="ds-btn ds-btn--adaptive" type="button" id="${id}" data-tip="${text}"><span data-icon="download" data-size="16"></span><span class="ds-btn__label">${text}</span></button>`;
      const root = document.querySelector('.ds-theme');
      root.insertAdjacentHTML('afterbegin', `<header class="ds-topbar"><div class="ds-topbar__actions">${button('btn-adaptive-topbar', 'Sign out')}</div></header>`
        + `<main class="ds-vt-view" tabindex="-1"><section>${button('btn-adaptive-page', 'Back')}</section></main>`
        + `<div class="ds-content" style="width: 900px">${button('btn-adaptive-panel', 'Export')}</div>`);
      DS.icons.fill(root);
    });
    const read = () => page.evaluate(() => ['btn-adaptive-topbar', 'btn-adaptive-page', 'btn-adaptive-narrow', 'btn-adaptive-panel'].map((id) => {
      const el = document.getElementById(id);
      const label = el.querySelector('.ds-btn__label').getBoundingClientRect();
      return { id, width: Math.round(el.getBoundingClientRect().width), label: label.width <= 1 && label.height <= 1, text: el.textContent.trim() };
    }));
    const icon = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.ds-theme')).getPropertyValue('--ds-btn-icon-size')) || 40);
    // A wide window: outside a panel the label shows; in the panels as before (the 500px one folds).
    for (const entry of await read()) expect(entry.label, entry.id).toBe(entry.id === 'btn-adaptive-narrow');
    // A 390px window: the top bar and the page fold to the icon size and keep their names; a panel decides by its own width.
    await page.setViewportSize({ width: 390, height: 800 });
    const narrow = await read();
    for (const entry of narrow.slice(0, 2)) expect(entry, entry.id).toMatchObject({ width: icon, label: true });
    expect(narrow.map((entry) => entry.text)).toEqual(['Sign out', 'Back', 'Export', 'Export']);
    expect(narrow[2]).toMatchObject({ width: icon, label: true });
    expect(narrow[3].label, 'a 900px .ds-content keeps its label in a narrow window').toBe(false);
  });

  test('quiet links are underlined in the quieter ink', async ({ page }) => {
    await open(page);
    const text2 = await colourOf(page, '--ds-text-2');
    for (const id of ['#link-quiet', '#link-btn-quiet']) {
      const style = await styleOf(page.locator(id), ['color', 'text-decoration-line']);
      expect(style.color, id).toBe(text2);
      expect(style['text-decoration-line'], id).toBe('underline');
    }
  });

  test('button chips: no check slot, the padding by their parts, an ellipsis at the cap, input chips tinted, wrapping chips keep one-line height', async ({ page }) => {
    await open(page);
    const pad = async (id) => styleOf(page.locator(`${id} .ds-chip__body`), ['padding-left', 'padding-right', 'height', 'background-color']);
    const input = await pad('#chip-input');
    expect([parseFloat(input['padding-left']), parseFloat(input['padding-right'])]).toEqual([16, 8]);
    expect(input['background-color']).toBe(await colourOf(page, '--ds-accent'));
    const action = await pad('#chip-action');
    expect([parseFloat(action['padding-left']), parseFloat(action['padding-right'])]).toEqual([8, 16]);
    expect(await page.locator('#chip-action .ds-chip__body').evaluate((el) => getComputedStyle(el, '::after').content)).toBe('none');
    const long = page.locator('#chip-long .ds-chip__body');
    expect(Math.round((await long.boundingBox()).width)).toBe(240);
    expect(await page.locator('#chip-long .ds-chip__label').evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    // Wrapping: one line keeps 32px, the long one grows.
    expect(Math.round((await page.locator('#chip-wrap-short .ds-chip__body').boundingBox()).height)).toBe(32);
    expect((await page.locator('#chip-wrap-long .ds-chip__body').boundingBox()).height).toBeGreaterThan(40);
    expect(await page.locator('#empty-chips').evaluate((el) => getComputedStyle(el).display)).toBe('none');
  });

  test('badges are pills with tabular figures; on a tinted host the strong pair; an empty one takes no room', async ({ page }) => {
    await open(page);
    const badge = await styleOf(page.locator('#badge'), ['height', 'min-width', 'font-variant-numeric', 'background-color']);
    expect(badge.height).toBe('20px');
    expect(badge['font-variant-numeric']).toBe('tabular-nums');
    expect(badge['background-color']).toBe(await colourOf(page, '--ds-accent'));
    expect((await styleOf(page.locator('#badge-tinted'), ['background-color']))['background-color']).toBe(await colourOf(page, '--ds-primary'));
    expect((await styleOf(page.locator('#badge-error'), ['background-color']))['background-color']).toBe(await colourOf(page, '--ds-error-container'));
    expect(await page.locator('#badge-empty').evaluate((el) => getComputedStyle(el).display)).toBe('none');
    expect((await styleOf(page.locator('#tag'), ['background-color']))['background-color']).toBe(await colourOf(page, '--ds-accent'));
  });
});

test.describe('tiles, cards, alerts, the done state (CT-9 to CT-12)', () => {
  test('a selected tile and card take the tint and a static border ring that leaves the outline free', async ({ page }) => {
    await open(page);
    const accent = await colourOf(page, '--ds-accent');
    const primary = await colourOf(page, '--ds-primary');
    for (const id of ['#tile-selected', '#card-selected', '#card-div']) {
      const el = page.locator(id);
      expect((await styleOf(el, ['background-color']))['background-color'], id).toBe(accent);
      const ring = await styleOf(el, ['border-top-width', 'border-top-color', 'position'], '::after');
      expect(ring['border-top-width'], id).toBe('2px');
      expect(ring['border-top-color'], id).toBe(primary);
    }
    expect((await styleOf(page.locator('#tile-plain'), ['background-color']))['background-color']).not.toBe(accent);
    // Focused and selected: both read at once.
    await focusByKeyboard(page, page.locator('#tile-selected'));
    await settle(page);
    expect((await styleOf(page.locator('#tile-selected'), ['outline-style']))['outline-style']).toBe('solid');
    expect((await styleOf(page.locator('#tile-selected'), ['border-top-width'], '::after'))['border-top-width']).toBe('2px');
    // A button action of the <div> form has no look of its own.
    const action = await styleOf(page.locator('#card-action'), ['border-top-width', 'padding-left', 'background-color']);
    expect(action).toEqual({ 'border-top-width': '0px', 'padding-left': '0px', 'background-color': 'rgba(0, 0, 0, 0)' });
  });

  test('tile rows fill their container: four, three, two, one per row; --3 caps at three', async ({ page }) => {
    await open(page);
    const columns = (id) => page.locator(id).evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(await columns('#tiles-900')).toBe(4);
    expect(await columns('#tiles-600')).toBe(3);
    expect(await columns('#tiles-400')).toBe(2);
    expect(await columns('#tiles-150')).toBe(1);
    expect(await columns('#tiles-3')).toBe(3);
    expect((await styleOf(page.locator('#tile-plain .ds-tile__value'), ['color'])).color).toBe(await colourOf(page, '--ds-text-2'));
  });

  test('alerts: actions in a row, plain findings without fill, with a hairline between', async ({ page }) => {
    await open(page);
    const actions = page.locator('#alert-actions .ds-alert__actions');
    expect(await actions.evaluate((el) => getComputedStyle(el).display)).toBe('flex');
    const plain = await styleOf(page.locator('#alert-plain'), ['background-color', 'padding-left', 'border-top-left-radius']);
    expect(plain).toEqual({ 'background-color': 'rgba(0, 0, 0, 0)', 'padding-left': '0px', 'border-top-left-radius': '0px' });
    expect((await styleOf(page.locator('#alert-plain-2'), ['border-top-width']))['border-top-width']).toBe('1px');
  });

  test('the done state plays its entrance when shown, and not again when a re-render keeps it', async ({ page }) => {
    await open(page);
    const names = () => page.locator('#done').evaluate((el) => el.getAnimations({ subtree: true }).map((animation) => animation.animationName).sort());
    await page.locator('#done').evaluate((el) => { el.hidden = false; });
    expect(await names()).toEqual(['ds-draw', 'ds-fade-in', 'ds-pop-in', 'ds-ripple']);
    await settle(page, { timeout: 8000 });
    await page.evaluate(() => { const holder = document.getElementById('done-holder'); DS.dom.morphHtml(holder, holder.innerHTML); });
    expect(await names()).toEqual([]);
  });
});

test.describe('the switch (CT-13)', () => {
  test('the input covers the track and takes the click', async ({ page }) => {
    await open(page);
    const track = page.locator('#switch-plain .ds-switch__track');
    await track.scrollIntoViewIfNeeded();
    const box = await track.boundingBox();
    const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.id, [box.x + box.width / 2, box.y + box.height / 2]);
    expect(hit).toBe('switch-plain-input');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    expect(await page.locator('#switch-plain-input').isChecked()).toBe(true);
    expect(Math.round((await page.locator('#switch-plain').boundingBox()).height)).toBe(40);
  });

  test('an aria-disabled switch shows no hover, halo or grow; a locked one keeps full strength with the lock on the handle', async ({ page }) => {
    await open(page);
    const track = page.locator('#switch-aria .ds-switch__track');
    await track.scrollIntoViewIfNeeded();
    const box = await track.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await settle(page);
    expect(Number((await styleOf(track, ['opacity'], '::before')).opacity)).toBe(0);
    await page.locator('#switch-aria').evaluate((el) => el.classList.add('ds-pressed'));
    await settle(page);
    expect((await styleOf(track, ['scale'], '::after')).scale).not.toBe('1');
    expect(await page.locator('#switch-aria').evaluate((el) => getComputedStyle(el).cursor)).toBe('not-allowed');
    const look = await styleOf(track, ['background-color', 'opacity']);
    expect(look).not.toEqual(await styleOf(page.locator('#switch-plain .ds-switch__track'), ['background-color', 'opacity']));
    // Locked: full strength, the on colours, the lock riding the handle.
    const locked = page.locator('#switch-locked .ds-switch__track');
    expect((await styleOf(locked, ['opacity'])).opacity).toBe('1');
    expect((await styleOf(locked, ['background-color']))['background-color']).toBe(await colourOf(page, '--ds-primary'));
    const icon = await styleOf(page.locator('#switch-locked .ds-switch__icon'), ['opacity', 'translate', 'color']);
    expect(icon.opacity).toBe('1');
    expect(icon.translate).toBe('20px');
    expect(icon.color).toBe(await colourOf(page, '--ds-primary'));
    const off = page.locator('#switch-locked-off .ds-switch__track');
    expect((await styleOf(off, ['background-color']))['background-color']).toBe(await colourOf(page, '--ds-surface-highest'));
    expect(Number((await styleOf(off, ['scale'], '::after')).scale)).toBeCloseTo(6 / 7, 3);
    expect((await styleOf(page.locator('#switch-locked-off .ds-switch__icon'), ['color'])).color).toBe(await colourOf(page, '--ds-surface-highest'));
  });

  test('a switch list lays its rows on one grid, the meta beside the name, under it when narrow', async ({ page }) => {
    await open(page);
    const row = page.locator('#switch-row');
    expect(await row.evaluate((el) => getComputedStyle(el).display)).toBe('grid');
    expect((await row.boundingBox()).height).toBeGreaterThanOrEqual(56);
    const name = await page.locator('#row-name').boundingBox();
    const meta = await page.locator('#row-meta').boundingBox();
    expect(meta.x).toBeGreaterThan(name.x + name.width - 1);
    await page.locator('#switch-list').evaluate((el) => { el.style.width = '400px'; });
    await settle(page);
    const metaNarrow = await page.locator('#row-meta').boundingBox();
    const nameNarrow = await page.locator('#row-name').boundingBox();
    expect(metaNarrow.y).toBeGreaterThan(nameNarrow.y + nameNarrow.height - 1);
  });

  test('the name and its hint stand together and centre on the track, with or without a hint, wide and narrow (2.1)', async ({ page }) => {
    await open(page);
    // A row whose long name wraps, with a hint; a row with a meta and no hint.
    await page.evaluate(() => {
      const list = document.getElementById('switch-list');
      list.insertAdjacentHTML('beforeend', '<label class="ds-switch" id="fx-row-long"><input type="checkbox" role="switch" aria-labelledby="fx-long-name" aria-describedby="fx-long-hint"><span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label" id="fx-long-name">Send a summary of every failed nightly backup to the owners of the affected devices</span><small class="ds-switch__hint" id="fx-long-hint">Once a day, after the last run</small><span class="ds-switch__state" aria-hidden="true">Off</span></label>'
        + '<label class="ds-switch" id="fx-row-meta"><input type="checkbox" role="switch" aria-labelledby="fx-meta-name"><span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label" id="fx-meta-name">Weekly digest</span><span class="ds-switch__meta"><span class="ds-tag ds-tag--neutral">2 lists</span></span></label>');
      list.children[1].id = 'fx-row-plain';
    });
    /** Per switch: the gap from the name to its hint, and the text block's centre less the track's centre. */
    const measure = (ids) => page.evaluate((list) => list.map((id) => {
      const row = document.getElementById(id);
      const box = (el) => el && el.getBoundingClientRect();
      const track = box(row.querySelector('.ds-switch__track'));
      const name = box(row.querySelector('.ds-switch__label'));
      const hint = box(row.querySelector('.ds-switch__hint'));
      const metaEl = row.querySelector('.ds-switch__meta');
      const meta = metaEl && { top: box(metaEl).top - parseFloat(getComputedStyle(metaEl).marginTop), bottom: box(metaEl).bottom };
      // The meta (with its air above) belongs to the text block when it wraps under it.
      const parts = [name, hint, meta && meta.top >= name.bottom - 1 ? meta : null].filter(Boolean);
      const top = Math.min(...parts.map((b) => b.top));
      const bottom = Math.max(...parts.map((b) => b.bottom));
      return { id, gap: hint ? hint.top - name.bottom : 0, off: (top + bottom) / 2 - (track.top + track.bottom) / 2 };
    }), ids);
    const rows = ['switch-row', 'fx-row-plain', 'fx-row-long', 'fx-row-meta', 'switch-locked'];
    for (const width of ['600px', '400px']) {
      await page.locator('#switch-list').evaluate((el, w) => { el.style.width = w; }, width);
      await settle(page);
      for (const { id, gap, off } of await measure(rows)) {
        expect(Math.abs(gap), `${id} at ${width}: name to hint`).toBeLessThanOrEqual(1);
        expect(Math.abs(off), `${id} at ${width}: text centre to track centre`).toBeLessThanOrEqual(1);
      }
    }
  });
});

test.describe('icons (CT-3)', () => {
  test('a fillable glyph fills while its control is pressed', async ({ page }) => {
    await open(page);
    const last = page.locator('#btn-rating svg > :last-child');
    expect((await styleOf(last, ['fill'])).fill).toBe('rgba(0, 0, 0, 0)');
    await page.locator('#btn-rating').evaluate((el) => el.setAttribute('aria-pressed', 'true'));
    await settle(page);
    const fill = (await styleOf(last, ['fill'])).fill;
    const colour = await page.locator('#btn-rating').evaluate((el) => getComputedStyle(el).color);
    expect(fill).toBe(colour);
  });

  test('DS.icons.fill() draws every [data-icon] once, through DOM APIs', async ({ page }) => {
    await open(page);
    const result = await page.evaluate(() => {
      const holder = document.createElement('div');
      holder.innerHTML = '<span data-icon="bell" data-icon-size="16"></span><span data-icon="send"></span>';
      document.querySelector('.ds-theme').append(holder);
      const first = DS.icons.fill(holder);
      const svg = holder.querySelector('svg');
      const second = DS.icons.fill(holder);
      return { first, second, kept: holder.querySelector('svg') === svg, sizes: [...holder.querySelectorAll('svg')].map((el) => el.getAttribute('width')) };
    });
    expect(result).toEqual({ first: 2, second: 0, kept: true, sizes: ['16', '20'] });
  });
  test('DS.icons.fill() with data-icon-place="start" keeps the label: the button matches its markup form (2.1)', async ({ page }) => {
    await open(page);
    const result = await page.evaluate(() => {
      const holder = document.createElement('div');
      holder.style.cssText = 'display: flex; gap: 8px; align-items: flex-start';
      holder.innerHTML =
        `<button class="ds-btn" type="button" id="fx-markup">${DS.icons.icon(DS.icons.plus, 18)}Add device</button>` +
        '<button class="ds-btn" type="button" id="fx-filled" data-icon="plus" data-icon-size="18" data-icon-place="start">Add device</button>' +
        '<button class="ds-btn" type="button" id="fx-end" data-icon="external" data-icon-size="18" data-icon-place="end">Open the guide</button>';
      document.querySelector('.ds-theme').append(holder);
      const first = DS.icons.fill(holder);
      const glyph = document.querySelector('#fx-filled svg');
      const second = DS.icons.fill(holder);
      const metrics = (id) => {
        const button = document.getElementById(id);
        const box = button.getBoundingClientRect();
        const svg = button.querySelector('svg').getBoundingClientRect();
        const style = getComputedStyle(button);
        return {
          width: box.width, height: box.height, paddingLeft: style.paddingLeft, paddingRight: style.paddingRight,
          svg: [svg.left - box.left, svg.top - box.top, svg.width],
        };
      };
      const end = document.getElementById('fx-end');
      return {
        first, second, kept: document.querySelector('#fx-filled svg') === glyph,
        markup: metrics('fx-markup'), filled: metrics('fx-filled'),
        text: document.getElementById('fx-filled').textContent,
        end: { last: end.lastElementChild?.tagName.toLowerCase(), text: end.textContent, children: end.childNodes.length },
      };
    });
    expect([result.first, result.second, result.kept]).toEqual([2, 0, true]);
    expect(result.text).toBe('Add device');
    expect(result.filled).toEqual(result.markup);
    expect(result.end).toEqual({ last: 'svg', text: 'Open the guide', children: 2 });
  });
});

test.describe('forced colours', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'forced colours are emulated in Chromium only');

  test('selected tiles and cards, open disclosure buttons and locked choices take Highlight; aria-disabled takes GrayText', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page);
    const system = await page.evaluate(() => {
      const probe = (value) => { const el = document.createElement('span'); el.style.color = value; document.body.append(el); const out = getComputedStyle(el).color; el.remove(); return out; };
      return { highlight: probe('Highlight'), gray: probe('GrayText'), canvas: probe('Canvas') };
    });
    const bg = (id) => page.locator(id).evaluate((el) => getComputedStyle(el).backgroundColor);
    for (const id of ['#tile-selected', '#card-selected', '#btn-disclosure', '#btn-locked']) expect(await bg(id), id).toBe(system.highlight);
    expect(await page.locator('#btn-locked-off').evaluate((el) => getComputedStyle(el).color)).toBe(system.gray);
    // The lock: Canvas on the off handle (CanvasText), Highlight on the on handle (Canvas).
    const lock = (id) => page.locator(`${id} .ds-switch__icon`).evaluate((el) => getComputedStyle(el).color);
    expect(await lock('#switch-locked-off')).toBe(system.canvas);
    expect(await lock('#switch-locked')).toBe(system.highlight);
  });

  test('a focused aria-disabled button, chip, switch, card or tile rings in CanvasText, not the brand colour', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page);
    await page.evaluate(() => {
      document.querySelector('.ds-theme').insertAdjacentHTML('afterbegin',
        '<div class="fx-row"><button class="ds-card ds-card--interactive" type="button" id="card-blocked" aria-disabled="true"><span class="ds-card__title">Premium</span></button>' +
        '<button class="ds-tile" type="button" id="tile-blocked" aria-disabled="true"><span class="ds-tile__label">Archived</span><span class="ds-tile__value">4</span></button></div>');
    });
    const canvasText = await page.evaluate(() => { const el = document.createElement('span'); el.style.color = 'CanvasText'; document.body.append(el); const out = getComputedStyle(el).color; el.remove(); return out; });
    for (const [focus, ring] of [
      ['#btn-locked-off', '#btn-locked-off'],
      ['#chip-aria-disabled input', '#chip-aria-disabled .ds-chip__body'],
      ['#switch-aria-input', '#switch-aria .ds-switch__track'],
      ['#card-blocked', '#card-blocked'],
      ['#tile-blocked', '#tile-blocked'],
    ]) {
      await focusByKeyboard(page, page.locator(focus));
      const outline = await styleOf(page.locator(ring), ['outline-style', 'outline-color']);
      expect(outline['outline-style'], focus).toBe('solid');
      expect(outline['outline-color'], focus).toBe(canvasText);
    }
  });

  test('the fixture in forced colours (settled shot)', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page, { attach: false });
    await expect(page).toHaveScreenshot('controls-2-forced.png', { fullPage: true });
  });
});

test.describe('blocked hosts and selected cards (2.0 review)', () => {
  test('a badge in a disabled or aria-disabled button or chip takes the disabled model', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      document.querySelector('.ds-theme').insertAdjacentHTML('afterbegin',
        '<div class="fx-row"><button class="ds-btn" type="button" disabled>Inbox <span class="ds-badge" id="badge-disabled">3</span></button>' +
        '<button class="ds-btn" type="button" aria-disabled="true">Alerts <span class="ds-badge ds-badge--error" id="badge-aria">2</span></button>' +
        '<label class="ds-chip"><input class="ds-chip__input" type="checkbox" disabled><span class="ds-chip__body"><span>Failed</span> <span class="ds-badge" id="badge-chip">5</span></span></label></div>');
    });
    await settle(page);
    const fill = await colourOf(page, '--ds-disabled-fill');
    const ink = await colourOf(page, '--ds-disabled-ink');
    for (const id of ['#badge-disabled', '#badge-aria', '#badge-chip']) {
      const look = await styleOf(page.locator(id), ['background-color', 'color']);
      expect(look, id).toEqual({ 'background-color': fill, color: ink });
    }
    // An enabled host keeps the tint.
    expect((await styleOf(page.locator('#badge'), ['background-color']))['background-color']).toBe(await colourOf(page, '--ds-accent'));
  });

  test('a selected interactive card keeps its 2px ring while a ripple is inside (overflow-clip-margin)', async ({ page }) => {
    await open(page);
    const card = page.locator('#card-selected');
    await card.scrollIntoViewIfNeeded();
    const rect = await card.boundingBox();
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down();
    await expect(card.locator(':scope > .ds-press-ripple')).toHaveCount(1);
    const during = await card.evaluate((el) => ({
      overflow: getComputedStyle(el).overflowX,
      margin: getComputedStyle(el).getPropertyValue('overflow-clip-margin'),
      supported: CSS.supports('overflow-clip-margin', '1px'),
    }));
    await page.mouse.up();
    expect(during.overflow).toBe('clip');
    if (during.supported) expect(during.margin).toBe('1px');
  });
});

test('the fixture at rest (settled shot)', async ({ page }) => {
  await open(page, { attach: false });
  await expect(page).toHaveScreenshot('controls-2.png', { fullPage: true });
});
