/**
 * DS.overlay (1.3.0) in real engines: open() and close() of the dialog and
 * the side sheet in both markups, the modal drawer and the popups. Focus
 * moves in at once ([autofocus] first) and is back on the opener in the
 * same task as the close; the div trap makes the page inert and gives back
 * exactly what it took, and an overlay opened over another (a dialog from
 * the div sheet or the modal drawer, div or native) takes focus and the
 * pointer while the one under it stays behind; a div dialog over a native
 * sheet moves into it and back, and so does a native dialog over a native
 * sheet, which through its exit stays above the sheet's panel and takes the
 * clicks; only the box turns inert during the exit; Escape
 * closes only the top of the stack, after the page's own handlers (a
 * widget that prevents it keeps the overlay); the scroll lock counts;
 * snackbars stay usable over the modal drawer; a close taken back mid-way
 * ends open; a menu closes on Escape, Tab and a pointerdown outside; the
 * modal drawer acts only at 900px and below and closes a stale state when
 * the window widens; a native dialog or sheet covers the page through its
 * exit and is gone the moment the exit ends, and one the page closes
 * natively never vanishes before its exit plays.
 *
 * Motion: the entrance and exit tracks of dialog and side sheet match the
 * choreography (properties, durations and curves as this engine serialises
 * the tokens), the sheet panel never fades, its spring overshoots at most
 * 5% and the bleed fills the screen edge at the deepest frame (desktop: the
 * right column; phones rise on --ds-ease-out, the top never past 0), the
 * hand paths leave with their exit keyframes on phones too, a reopen at
 * 50% of the exit is continuous, and prefers-reduced-motion changes
 * nothing. Cancel and the
 * backdrop give focus back in the same task, Tab stays inside, a double
 * click on the backdrop (or the modal drawer's scrim) during the exit
 * never reaches the page and leaves focus on the opener, a closing
 * native dialog stays above a sticky element, the shell app gets no
 * gutter. Forced colours (Chromium): each overlay keeps its edge.
 *
 * State checks read state, not timing; motion is read with the animations
 * paused in the task that starts them and seeked, so nothing depends on how
 * fast the machine is.
 */
import { test, expect } from './base-test.js';
import {
  ready, settle, sample, seek, series, focusByKeyboard, expectMonotonic, expectPeakAtMost, expectSettles, expectContinuous,
} from './helpers/motion.js';

const FIXTURES = '/test/browser/fixtures/';

async function load(page, name = 'overlay.html', width = 1000) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(FIXTURES + name);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

/** The id (or tag) of the focused element. */
const focused = (page) => page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);

/** What a leftover of an overlay would look like: inert elements, the lock, data-state and --closing. */
const leftovers = (page) => page.evaluate(() => ({
  inert: [...document.querySelectorAll('[inert]')].map((el) => el.id || el.className),
  locked: document.body.classList.contains('ds-no-scroll'),
  states: [...document.querySelectorAll('[data-state]')].map((el) => `${el.id}=${el.dataset.state}`),
  closing: [...document.querySelectorAll('.ds-dialog--closing, .ds-sheet--closing, .ds-dialog--nested')].map((el) => el.id),
}));

const clean = { inert: [], locked: false, states: [], closing: [] };

/** Waits until `id` is hidden again (div: hidden; native: not open and not closing) and its close ended (no data-state). */
function closed(page, id) {
  return page.waitForFunction((name) => {
    const el = document.getElementById(name);
    const hidden = el.tagName === 'DIALOG' ? !el.open && !el.classList.contains('ds-dialog--closing') && !el.classList.contains('ds-sheet--closing') : el.hidden;
    return hidden && !el.hasAttribute('data-state');
  }, id);
}

test.describe('dialog and sheet', () => {
  test('a div dialog traps by inert, focuses its first action and gives focus back in the frame of Escape', async ({ page }) => {
    await load(page);
    await page.click('#open-dialog');
    const opened = await page.evaluate(() => ({
      hidden: document.getElementById('dialog').hidden,
      state: document.getElementById('dialog').dataset.state,
      pageInert: document.getElementById('page').inert,
      sheetInert: document.getElementById('sheet').inert,
      locked: document.body.classList.contains('ds-no-scroll'),
      focus: document.activeElement.id,
    }));
    expect(opened).toEqual({ hidden: false, state: 'open', pageInert: true, sheetInert: true, locked: true, focus: 'dialog-cancel' });

    // In the same task as the key: focus on the opener, the page back, only the box inert.
    const atClose = await page.evaluate(() => {
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      return {
        focus: document.activeElement.id,
        pageInert: document.getElementById('page').inert,
        boxInert: document.querySelector('#dialog .ds-dialog__box').inert,
        backdropInert: document.querySelector('#dialog .ds-dialog__backdrop').inert,
        state: document.getElementById('dialog').dataset.state,
      };
    });
    expect(atClose).toEqual({ focus: 'open-dialog', pageInert: false, boxInert: true, backdropInert: false, state: 'closed' });
    await closed(page, 'dialog');
    expect(await leftovers(page)).toEqual(clean);
    expect(await focused(page)).toBe('open-dialog');
  });

  test('a native dialog honours autofocus, plays its exit on cancel and keeps --closing until it settled', async ({ page }) => {
    await load(page);
    await page.click('#open-native');
    expect(await page.evaluate(() => ({ open: document.getElementById('native').open, focus: document.activeElement.id }))).toEqual({ open: true, focus: 'native-cancel' });
    const atClose = await page.evaluate(() => {
      const dialog = document.getElementById('native');
      const cancel = new Event('cancel', { cancelable: true });
      dialog.dispatchEvent(cancel);
      return { prevented: cancel.defaultPrevented, open: dialog.open, closing: dialog.classList.contains('ds-dialog--closing'), focus: document.activeElement.id };
    });
    expect(atClose).toEqual({ prevented: true, open: false, closing: true, focus: 'open-native' });
    await closed(page, 'native');
    expect(await leftovers(page)).toEqual(clean);

    // The keyboard path: Escape closes it the same way.
    await page.click('#open-native');
    await page.keyboard.press('Escape');
    await closed(page, 'native');
    expect(await focused(page)).toBe('open-native');
    expect(await leftovers(page)).toEqual(clean);

    // Closed natively by the page (or a <form method="dialog">): the state follows.
    await page.click('#open-native');
    await page.evaluate(() => document.getElementById('native').close());
    await closed(page, 'native');
    expect(await leftovers(page)).toEqual(clean);
    await page.click('#open-native');
    expect(await page.evaluate(() => document.getElementById('native').open)).toBe(true);
    await page.keyboard.press('Escape');
    await closed(page, 'native');
    expect(await leftovers(page)).toEqual(clean);
  });

  test('[data-close] closes, also on the native sheet; clicks on it during the exit are ignored', async ({ page }) => {
    await load(page);
    await page.click('#open-native-sheet');
    expect(await focused(page)).toBe('native-sheet-close');
    const twice = await page.evaluate(() => {
      const sheet = document.getElementById('native-sheet');
      const backdrop = sheet.querySelector('.ds-sheet__backdrop');
      backdrop.click();
      const state = sheet.dataset.state;
      backdrop.click();
      return { state, after: sheet.dataset.state, closing: sheet.classList.contains('ds-sheet--closing') };
    });
    expect(twice).toEqual({ state: 'closed', after: 'closed', closing: true });
    await closed(page, 'native-sheet');
    expect(await focused(page)).toBe('open-native-sheet');
    expect(await leftovers(page)).toEqual(clean);
  });

  test('a dialog from inside the sheet is nested; Escape closes only the top, twice for both', async ({ page }) => {
    await load(page);
    await page.click('#open-sheet');
    expect(await focused(page)).toBe('sheet-close');
    await page.click('#sheet-delete');
    // The sheet's trap took the dialog as a sibling: the stack lifts it, so it takes focus and the pointer.
    expect(await page.evaluate(() => ({
      nested: document.getElementById('dialog').classList.contains('ds-dialog--nested'),
      scrim: getComputedStyle(document.querySelector('#dialog .ds-dialog__backdrop')).backgroundColor,
      sheetInert: document.getElementById('sheet').inert,
      dialogInert: document.getElementById('dialog').closest('[inert]') !== null,
      focus: document.activeElement.id,
    }))).toMatchObject({ nested: true, sheetInert: true, dialogInert: false, focus: 'dialog-cancel' });
    await settle(page);
    expect(await page.evaluate(() => {
      const box = document.getElementById('dialog-ok').getBoundingClientRect();
      return document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)?.closest('button')?.id;
    }), 'Delete is hit-testable').toBe('dialog-ok');

    await page.keyboard.press('Escape');
    await closed(page, 'dialog');
    expect(await page.evaluate(() => ({
      sheet: document.getElementById('sheet').dataset.state,
      sheetInert: document.getElementById('sheet').inert,
      pageInert: document.getElementById('page').inert,
      nested: document.getElementById('dialog').classList.contains('ds-dialog--nested'),
      locked: document.body.classList.contains('ds-no-scroll'),
      focus: document.activeElement.id,
    }))).toEqual({ sheet: 'open', sheetInert: false, pageInert: true, nested: false, locked: true, focus: 'sheet-delete' });

    await page.keyboard.press('Escape');
    await closed(page, 'sheet');
    expect(await focused(page)).toBe('open-sheet');
    expect(await leftovers(page)).toEqual(clean);
  });

  test('a native dialog from inside the div sheet takes focus and the pointer; the sheet stays blocked under it', async ({ page }) => {
    await load(page);
    await page.click('#open-sheet');
    await page.evaluate(() => DS.overlay.open(document.getElementById('native'), { opener: document.getElementById('sheet-delete') }));
    // showModal() blocks the sheet (no inert attribute needed); the sheet's trap had taken the dialog, the stack lifts it.
    expect(await page.evaluate(() => ({
      inert: document.getElementById('native').closest('[inert]') !== null,
      focus: document.activeElement.id,
    }))).toEqual({ inert: false, focus: 'native-cancel' });
    await settle(page);
    expect(await page.evaluate(() => {
      const box = document.getElementById('native-ok').getBoundingClientRect();
      return document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)?.closest('button')?.id;
    })).toBe('native-ok');
    await page.keyboard.press('Escape');
    await closed(page, 'native');
    expect(await page.evaluate(() => ({ sheetInert: document.getElementById('sheet').inert, nativeInert: document.getElementById('native').inert, focus: document.activeElement.id })))
      .toEqual({ sheetInert: false, nativeInert: true, focus: 'sheet-delete' });
    await page.keyboard.press('Escape');
    await closed(page, 'sheet');
    expect(await leftovers(page)).toEqual(clean);
  });

  test('a div dialog over a native sheet moves into it while it shows (else it would be inert) and back once closed', async ({ page }) => {
    await load(page);
    await page.click('#open-native-sheet');
    const opened = await page.evaluate(() => {
      const dialog = document.getElementById('dialog');
      DS.overlay.open(dialog, { opener: document.getElementById('native-sheet-close') });
      return { inside: document.getElementById('native-sheet').contains(dialog), focus: document.activeElement.id, nested: dialog.classList.contains('ds-dialog--nested') };
    });
    expect(opened).toEqual({ inside: true, focus: 'dialog-cancel', nested: true });
    await settle(page);
    expect(await page.evaluate(() => {
      const box = document.getElementById('dialog-ok').getBoundingClientRect();
      return document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)?.closest('button')?.id;
    })).toBe('dialog-ok');
    await page.keyboard.press('Escape');
    await closed(page, 'dialog');
    expect(await page.evaluate(() => ({
      home: document.getElementById('dialog').parentElement === document.body && document.getElementById('dialog').previousElementSibling?.id === 'menu',
      sheet: document.getElementById('native-sheet').open,
      focus: document.activeElement.id,
    }))).toEqual({ home: true, sheet: true, focus: 'native-sheet-close' });
    await page.keyboard.press('Escape');
    await closed(page, 'native-sheet');
    expect(await leftovers(page)).toEqual(clean);
  });

  test('a native dialog over a native sheet moves into it; through its exit it stays above the panel and takes the clicks', async ({ page }) => {
    // Slowed tenfold, so the second click of the double click surely lands while the exit plays.
    await load(page, 'overlay.html?speed=0.1');
    await page.click('#open-native-sheet');
    await settle(page, { timeout: 10000 });
    await page.click('#native-sheet-retire');
    expect(await page.evaluate(() => {
      const dialog = document.getElementById('native');
      return { inside: document.getElementById('native-sheet').contains(dialog), open: dialog.open, nested: dialog.classList.contains('ds-dialog--nested'), focus: document.activeElement.id };
    })).toEqual({ inside: true, open: true, nested: true, focus: 'native-cancel' });
    await settle(page, { timeout: 10000 });

    // A double click on the dialog's scrim over the sheet's own scrim: the first closes the dialog, the second lands
    // on the leaving dialog (the sheet is the top modal again at once) and closes nothing.
    await page.mouse.dblclick(40, 400);
    expect(await page.evaluate(() => ({
      dialog: document.getElementById('native').dataset.state,
      sheet: document.getElementById('native-sheet').dataset.state,
      focus: document.activeElement.id,
    }))).toEqual({ dialog: 'closed', sheet: 'open', focus: 'native-sheet-retire' });
    await closed(page, 'native');
    expect(await page.evaluate(() => {
      const dialog = document.getElementById('native');
      const sheet = document.getElementById('native-sheet');
      return { home: dialog.parentElement === document.body && dialog.previousElementSibling?.id === 'dialog', sheet: sheet.open && sheet.dataset.state === 'open', focus: document.activeElement.id };
    })).toEqual({ home: true, sheet: true, focus: 'native-sheet-retire' });

    // At 50% of the exit (paused in the task that starts it): the dialog's scrim is on top over the sheet's scrim and
    // over its panel, and the box, given back to hit testing for the read, is above the panel.
    await page.click('#native-sheet-retire');
    await settle(page, { timeout: 10000 });
    const half = await page.evaluate(() => {
      const dialog = document.getElementById('native');
      const box = dialog.querySelector('.ds-dialog__box');
      DS.overlay.close(dialog);
      for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) {
        animation.pause();
        animation.currentTime = (animation.effect.getTiming().delay || 0) + Number(animation.effect.getComputedTiming().duration) / 2;
      }
      const hit = (x, y) => {
        const el = document.elementFromPoint(x, y);
        return el?.closest('.ds-dialog__backdrop, .ds-dialog__box, .ds-sheet__backdrop, .ds-sheet__panel')?.className.split(' ')[0] ?? el?.tagName;
      };
      const panel = document.querySelector('#native-sheet .ds-sheet__panel').getBoundingClientRect();
      const rect = box.getBoundingClientRect();
      const overPanel = { x: Math.round((Math.max(panel.left, rect.right) + panel.right) / 2), y: Math.round(panel.bottom - 40) };
      box.inert = false;
      box.style.pointerEvents = 'auto';
      // A point of the box over the panel (the box is centred, the panel on the right).
      const boxHit = hit(Math.round(Math.max(rect.left, panel.left) + 20), Math.round(rect.top + rect.height / 2));
      box.style.removeProperty('pointer-events');
      box.inert = true;
      return {
        state: dialog.dataset.state,
        opacity: Number(getComputedStyle(box).opacity),
        sheetScrim: hit(40, 400),
        panel: hit(overPanel.x, overPanel.y),
        box: boxHit,
        overlaps: rect.right > panel.left,
      };
    });
    expect(half.opacity, 'the exit is under way').toBeGreaterThan(0.05);
    expect(half.opacity, 'the exit is under way').toBeLessThan(0.95);
    expect(half).toMatchObject({ state: 'closed', sheetScrim: 'ds-dialog__backdrop', panel: 'ds-dialog__backdrop', box: 'ds-dialog__box', overlaps: true });
    await finishAll(page);
    await closed(page, 'native');
    expect(await focused(page)).toBe('native-sheet-retire');
    await page.keyboard.press('Escape');
    await closed(page, 'native-sheet');
    expect(await focused(page)).toBe('open-native-sheet');
    expect(await leftovers(page)).toEqual(clean);
  });

  test('a widget inside that handles Escape itself keeps the overlay open; Escape elsewhere in it closes it', async ({ page }) => {
    await load(page);
    for (const [id, opener, other] of [['dialog', 'open-dialog', 'dialog-cancel'], ['native', 'open-native', 'native-cancel'], ['native-sheet', 'open-native-sheet', 'native-sheet-close']]) {
      await page.evaluate((name) => {
        const input = document.createElement('input');
        input.className = 'ds-input';
        input.id = 'fx-widget';
        input.setAttribute('aria-label', 'Name');
        document.getElementById(name).querySelector('.ds-dialog__box, .ds-sheet__panel').append(input);
        window.widget = { keys: 0, stop: true };
        // An inline edit that cancels itself on Escape.
        input.addEventListener('keydown', (event) => {
          if (event.key !== 'Escape') return;
          window.widget.keys += 1;
          event.preventDefault();
          if (window.widget.stop) event.stopPropagation();
        });
      }, id);
      await page.click(`#${opener}`);
      await settle(page);
      for (const stop of [true, false]) {
        await page.evaluate((value) => { window.widget.stop = value; }, stop);
        await page.focus('#fx-widget');
        await page.keyboard.press('Escape');
        await settle(page);
        expect(await page.evaluate((name) => ({ keys: window.widget.keys, state: document.getElementById(name).dataset.state, focus: document.activeElement.id }), id), `${id}, stopPropagation: ${stop}`)
          .toEqual({ keys: stop ? 1 : 2, state: 'open', focus: 'fx-widget' });
      }
      await page.focus(`#${other}`);
      await page.keyboard.press('Escape');
      await closed(page, id);
      expect(await focused(page), id).toBe(opener);
      await page.evaluate(() => document.getElementById('fx-widget').remove());
      expect(await leftovers(page), id).toEqual(clean);
    }
  });

  test('a close taken back ends open, and rapid toggles end in a consistent state', async ({ page }) => {
    await load(page);
    const reopened = await page.evaluate(async () => {
      const dialog = document.getElementById('dialog');
      const opener = document.getElementById('open-dialog');
      DS.overlay.open(dialog, { opener });
      const closing = DS.overlay.close(dialog);
      const again = DS.overlay.close(dialog);
      const entrance = DS.overlay.open(dialog, { opener });
      await Promise.all([closing, entrance]);
      return {
        same: closing === again,
        hidden: dialog.hidden,
        state: dialog.dataset.state,
        boxInert: dialog.querySelector('.ds-dialog__box').inert,
        pageInert: document.getElementById('page').inert,
        locked: document.body.classList.contains('ds-no-scroll'),
      };
    });
    expect(reopened).toEqual({ same: true, hidden: false, state: 'open', boxInert: false, pageInert: true, locked: true });
    await page.evaluate(() => DS.overlay.close(document.getElementById('dialog')));
    expect(await leftovers(page)).toEqual(clean);

    // Five toggles, each in its own frame, on both markups.
    for (const id of ['dialog', 'native']) {
      await page.evaluate(async (name) => {
        const el = document.getElementById(name);
        const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
        for (let i = 0; i < 5; i += 1) {
          if (i % 2) DS.overlay.close(el);
          else DS.overlay.open(el, { opener: document.getElementById('open-dialog') });
          await frame();
        }
        await DS.overlay.close(el);
      }, id);
      await closed(page, id);
      expect(await leftovers(page), id).toEqual(clean);
    }
  });

  test('an overlay outside .ds-theme warns once', async ({ page }) => {
    await load(page);
    const warnings = [];
    page.on('console', (message) => { if (message.type() === 'warning') warnings.push(message.text()); });
    await page.evaluate(async () => {
      const stray = document.createElement('div');
      stray.className = 'ds-dialog';
      stray.innerHTML = '<div class="ds-dialog__backdrop"></div><div class="ds-dialog__box"><button type="button">OK</button></div>';
      document.documentElement.append(stray);
      for (let i = 0; i < 2; i += 1) {
        DS.overlay.open(stray);
        await DS.overlay.close(stray);
      }
      stray.remove();
    });
    expect(warnings.filter((text) => text.includes('.ds-theme'))).toHaveLength(1);
    expect(await leftovers(page)).toEqual(clean);
  });
});

test.describe('scroll lock', () => {
  test('counts, never goes below 0, and the page does not shift sideways', async ({ page }) => {
    await load(page);
    const counted = await page.evaluate(() => {
      const has = () => document.body.classList.contains('ds-no-scroll');
      const steps = [];
      DS.overlay.lockScroll();
      DS.overlay.lockScroll();
      steps.push(has());
      DS.overlay.unlockScroll();
      steps.push(has());
      DS.overlay.unlockScroll();
      steps.push(has());
      DS.overlay.unlockScroll();
      DS.overlay.lockScroll();
      steps.push(has());
      DS.overlay.unlockScroll();
      steps.push(has());
      return steps;
    });
    expect(counted).toEqual([true, true, false, true, false]);

    const x = () => page.evaluate(() => document.getElementById('open-dialog').getBoundingClientRect().left);
    const before = await x();
    await page.click('#open-dialog');
    expect(await x()).toBe(before);
    await page.keyboard.press('Escape');
    await closed(page, 'dialog');
    expect(await x()).toBe(before);
    expect(await page.evaluate(() => [document.documentElement.style.scrollbarGutter, document.body.style.paddingRight])).toEqual(['', '']);
  });
});

test.describe('popups', () => {
  test('a menu focuses its first enabled item and closes on Escape (focus to the trigger), Tab and outside', async ({ page }) => {
    await load(page);
    await page.click('#open-menu');
    expect(await page.evaluate(() => ({ focus: document.activeElement.id, expanded: document.getElementById('open-menu').getAttribute('aria-expanded') })))
      .toEqual({ focus: 'menu-b', expanded: 'true' });
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => ({ focus: document.activeElement.id, expanded: document.getElementById('open-menu').getAttribute('aria-expanded') })))
      .toEqual({ focus: 'open-menu', expanded: 'false' });
    await closed(page, 'menu');

    // Tab: Tab moves on from the trigger.
    await page.click('#open-menu');
    await page.keyboard.press('Tab');
    expect(await focused(page)).toBe('combo-input');
    await closed(page, 'menu');

    // A pointerdown outside closes it without taking focus to the trigger.
    await page.click('#open-menu');
    await page.mouse.click(700, 700);
    await closed(page, 'menu');
    expect(await focused(page)).not.toBe('open-menu');
    expect(await page.getAttribute('#open-menu', 'aria-expanded')).toBe('false');

    // The trigger toggles: its pointerdown is not "outside".
    await page.click('#open-menu');
    await page.click('#open-menu');
    await closed(page, 'menu');
    expect(await leftovers(page)).toEqual(clean);
  });

  test('a combobox popup keeps focus in its input; Escape closes the list only', async ({ page }) => {
    await load(page);
    await page.click('#open-dialog');
    await page.keyboard.press('Escape');
    await closed(page, 'dialog');
    await page.focus('#combo-input');
    await page.evaluate(() => DS.overlay.open(document.getElementById('combo-popup'), { opener: document.getElementById('combo-input') }));
    expect(await page.evaluate(() => ({
      focus: document.activeElement.id,
      expanded: document.getElementById('combo-input').getAttribute('aria-expanded'),
      hidden: document.getElementById('combo-popup').hidden,
      locked: document.body.classList.contains('ds-no-scroll'),
    }))).toEqual({ focus: 'combo-input', expanded: 'true', hidden: false, locked: false });
    await page.keyboard.press('Escape');
    await closed(page, 'combo-popup');
    expect(await focused(page)).toBe('combo-input');
    expect(await page.getAttribute('#combo-input', 'aria-expanded')).toBe('false');
  });
});

test.describe('modal drawer', () => {
  test('opens only at 900px and below: inert page, lock, focus, Escape and the scrim', async ({ page }) => {
    await load(page, 'shell.html', 800);
    const opened = await page.evaluate(() => {
      DS.overlay.open(document.getElementById('drawer'), { opener: document.getElementById('menu') });
      return {
        open: document.getElementById('app').hasAttribute('data-drawer-open'),
        expanded: document.getElementById('menu').getAttribute('aria-expanded'),
        // 2.0: the current item takes focus (the drawer itself without one).
        focus: document.activeElement.getAttribute('aria-current') === 'page' && document.getElementById('drawer').contains(document.activeElement) ? 'current item' : document.activeElement.id,
        inert: [...document.querySelectorAll('#app > *')].filter((el) => el.inert).map((el) => el.className.split(' ')[0]),
        locked: document.body.classList.contains('ds-no-scroll'),
      };
    });
    expect(opened).toEqual({ open: true, expanded: 'true', focus: 'current item', inert: ['ds-skip', 'ds-topbar', 'ds-panel'], locked: true });

    const atClose = await page.evaluate(() => {
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      return { open: document.getElementById('app').hasAttribute('data-drawer-open'), focus: document.activeElement.id, drawerInert: document.getElementById('drawer').inert };
    });
    expect(atClose).toEqual({ open: false, focus: 'menu', drawerInert: true });
    await page.waitForFunction(() => !document.getElementById('drawer').inert);
    expect(await leftovers(page)).toEqual(clean);

    await page.evaluate(() => DS.overlay.open(document.getElementById('drawer'), { opener: document.getElementById('menu') }));
    await page.evaluate(() => document.getElementById('scrim').click());
    await page.waitForFunction(() => !document.getElementById('drawer').inert);
    expect(await page.evaluate(() => document.getElementById('app').hasAttribute('data-drawer-open'))).toBe(false);
    expect(await focused(page)).toBe('menu');
    expect(await leftovers(page)).toEqual(clean);
  });

  test('snackbars stay usable over the modal drawer: the region and its announcers are never inert', async ({ page }) => {
    await load(page, 'shell.html', 800);
    const opened = await page.evaluate(() => {
      const region = document.createElement('div');
      region.className = 'ds-toasts';
      region.id = 'fx-toasts';
      document.getElementById('app').after(region);
      DS.overlay.toast(region, 'Could not save.', { kind: 'error' });
      DS.overlay.open(document.getElementById('drawer'), { opener: document.getElementById('menu') });
      return {
        open: document.getElementById('app').hasAttribute('data-drawer-open'),
        region: region.closest('[inert]') !== null,
        announcers: [...region.parentNode.querySelectorAll(':scope > .ds-sr[aria-live]')].map((node) => node.closest('[inert]') === null),
      };
    });
    expect(opened).toEqual({ open: true, region: false, announcers: [true, true] });
    await settle(page);
    await page.locator('#fx-toasts .ds-toast__close').click();
    await expect(page.locator('#fx-toasts .ds-toast')).toHaveCount(0);
    expect(await page.evaluate(() => document.getElementById('app').hasAttribute('data-drawer-open')), 'the drawer stays open').toBe(true);
    await page.evaluate(() => DS.overlay.close(document.getElementById('drawer')));
    await page.waitForFunction(() => !document.getElementById('drawer').inert);
    expect(await leftovers(page)).toEqual(clean);
  });

  test('a dialog opened from the modal drawer (div and native) takes focus and the pointer; the app stays behind it', async ({ page }) => {
    await load(page, 'shell.html', 800);
    for (const native of [false, true]) {
      const opened = await page.evaluate((isNative) => {
        const drawer = document.getElementById('drawer');
        const dialog = document.createElement(isNative ? 'dialog' : 'div');
        dialog.className = 'ds-dialog';
        dialog.id = 'fx-dialog';
        if (!isNative) dialog.hidden = true;
        dialog.innerHTML = '<div class="ds-dialog__backdrop" data-close></div><div class="ds-dialog__box"><button type="button" class="ds-btn" id="fx-ok">OK</button></div>';
        document.querySelector('.ds-theme').append(dialog);
        DS.overlay.open(drawer, { opener: document.getElementById('menu') });
        DS.overlay.open(dialog, { opener: drawer.querySelector('.ds-drawer__item') });
        return {
          inert: dialog.closest('[inert]') !== null,
          focus: document.activeElement.id,
          app: document.getElementById('app').inert,
        };
      }, native);
      // The div trap makes the app inert; showModal() blocks it without the attribute.
      expect(opened, native ? 'native' : 'div').toEqual({ inert: false, focus: 'fx-ok', app: !native });
      await settle(page);
      expect(await page.evaluate(() => {
        const box = document.getElementById('fx-ok').getBoundingClientRect();
        return document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)?.id;
      }), native ? 'native' : 'div').toBe('fx-ok');
      await page.evaluate(async () => {
        const dialog = document.getElementById('fx-dialog');
        await DS.overlay.close(dialog);
        await DS.overlay.close(document.getElementById('drawer'));
        dialog.remove();
      });
      expect(await leftovers(page)).toEqual(clean);
    }
  });

  test('drawer then dialog, closed in either order, release the lock and every inert', async ({ page }) => {
    await load(page, 'shell.html', 800);
    for (const order of [['drawer', 'dialog'], ['dialog', 'drawer']]) {
      await page.evaluate(async (first) => {
        const drawer = document.getElementById('drawer');
        const dialog = document.createElement('div');
        dialog.className = 'ds-dialog';
        dialog.id = 'fx-dialog';
        dialog.hidden = true;
        dialog.innerHTML = '<div class="ds-dialog__backdrop" data-close></div><div class="ds-dialog__box"><button type="button" id="fx-ok">OK</button></div>';
        document.querySelector('.ds-theme').append(dialog);
        DS.overlay.open(drawer, { opener: document.getElementById('menu') });
        DS.overlay.open(dialog, { opener: drawer.querySelector('.ds-drawer__item') });
        const both = { drawer, dialog };
        await Promise.all(first === 'drawer' ? [DS.overlay.close(both.drawer), DS.overlay.close(both.dialog)] : [DS.overlay.close(both.dialog), DS.overlay.close(both.drawer)]);
        dialog.remove();
      }, order[0]);
      expect(await leftovers(page), order.join(' > ')).toEqual(clean);
      expect(await page.evaluate(() => document.getElementById('app').hasAttribute('data-drawer-open'))).toBe(false);
    }
  });

  test('wider than 900px it does nothing; a window that widens closes a stale open state at once', async ({ page }) => {
    await load(page, 'shell.html', 1000);
    await page.evaluate(() => DS.overlay.open(document.getElementById('drawer')));
    expect(await page.evaluate(() => document.getElementById('app').hasAttribute('data-drawer-open'))).toBe(false);
    expect(await leftovers(page)).toEqual(clean);

    await page.setViewportSize({ width: 800, height: 800 });
    await page.evaluate(() => DS.overlay.open(document.getElementById('drawer'), { opener: document.getElementById('menu') }));
    expect(await page.evaluate(() => document.body.classList.contains('ds-no-scroll'))).toBe(true);
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.waitForFunction(() => !document.getElementById('app').hasAttribute('data-drawer-open') && !document.body.classList.contains('ds-no-scroll'));
    expect(await leftovers(page)).toEqual(clean);
    expect(await page.getAttribute('#menu', 'aria-expanded')).toBe('false');
    await page.waitForFunction(() => !document.getElementById('drawer').classList.contains('ds-drawer--instant'));
  });
});

test.describe('native dialog and sheet motion', () => {
  test('closed natively by the page (close(), a <form method="dialog">), it never vanishes before its exit plays', async ({ page }) => {
    await load(page);
    for (const id of ['native', 'native-sheet']) {
      for (const how of ['close', 'form']) {
        const frames = await page.evaluate(async ([name, way]) => {
          const el = document.getElementById(name);
          await DS.overlay.open(el, { opener: document.getElementById('open-native') });
          let form = null;
          if (way === 'form') {
            form = document.createElement('form');
            form.method = 'dialog';
            el.append(form);
          }
          const read = (at) => ({ at, state: el.dataset.state ?? null, display: getComputedStyle(el).display });
          const out = [];
          if (form) form.requestSubmit();
          else el.close();
          out.push(read('task'));
          // Every frame until the exit runs (the close event comes a task later).
          for (let frame = 0; frame < 6; frame += 1) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
            out.push(read(frame));
          }
          form?.remove();
          return out;
        }, [id, how]);
        const gaps = frames.filter((entry) => entry.state === 'open' && entry.display === 'none');
        expect(gaps, `${id} ${how}`).toEqual([]);
        expect(frames.some((entry) => entry.state === 'closed'), `${id} ${how}: the exit plays`).toBe(true);
        await closed(page, id);
        expect(await leftovers(page), `${id} ${how}`).toEqual(clean);
      }
    }
  });

  test('a native dialog or sheet closed by DS.overlay is gone at once when its exit ends (never lingers for the hand path)', async ({ page }) => {
    await load(page);
    for (const id of ['native', 'native-sheet']) {
      const after = await page.evaluate(async (name) => {
        const el = document.getElementById(name);
        await DS.overlay.open(el, { opener: document.getElementById('open-native') });
        // Mid-exit the overlay still covers the page and catches the pointer.
        const closing = DS.overlay.close(el);
        const during = { display: getComputedStyle(el).display, hit: el.contains(document.elementFromPoint(20, 400)) };
        await closing;
        return { during, display: getComputedStyle(el).display, hit: el.contains(document.elementFromPoint(20, 400)) };
      }, id);
      expect(after, id).toEqual({ during: { display: id === 'native' ? 'grid' : 'flex', hit: true }, display: 'none', hit: false });
      expect(await leftovers(page), id).toEqual(clean);
    }
  });
});

/* ── Motion: timelines, bleed, interruption (1.3.0 Tests) ──────────── */

/**
 * The engine's own serialisation of every duration and curve token, read
 * from transitions of a probe inside the theme, so an expected timeline
 * compares like for like (a linear() curve, or its cubic fallback).
 */
function tokens(page) {
  return page.evaluate(() => {
    const theme = document.querySelector('.ds-theme');
    const out = {};
    for (const name of ['--ds-ease-in-out', '--ds-ease-spatial', '--ds-ease-exit', '--ds-ease-out', '--ds-ease-in']) {
      // A fresh probe each time: a change back on a running transition would reverse it instead.
      const probe = document.createElement('div');
      probe.style.transition = `opacity 1000ms var(${name})`;
      theme.append(probe);
      void getComputedStyle(probe).opacity;
      probe.style.opacity = '0';
      const [animation] = probe.getAnimations();
      out[name] = animation.effect.getTiming().easing;
      probe.remove();
    }
    for (const name of ['--ds-dur-instant', '--ds-dur-fast', '--ds-dur-base', '--ds-dur-medium', '--ds-dur-slow', '--ds-dur-long']) {
      out[name] = Math.round(DS.motion.motionDuration(theme, name));
    }
    return out;
  });
}

/**
 * Runs `action` ('open' or 'close') on `id` and returns the transitions it
 * started on the backdrop and the box or panel as "property duration
 * easing", read with every animation paused in the same task; they stay
 * paused for the caller (sample(), or finish them).
 */
function tracksOf(page, id, action) {
  return page.evaluate(([name, act]) => {
    const el = document.getElementById(name);
    if (act === 'open') DS.overlay.open(el, { opener: document.getElementById('open-dialog') });
    else DS.overlay.close(el);
    for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
    const read = (part) => part.getAnimations().filter((animation) => animation.transitionProperty && animation.effect.getTiming().duration > 0)
      .map((animation) => `${animation.transitionProperty} ${Math.round(animation.effect.getTiming().duration)} ${animation.effect.getTiming().easing}`).sort();
    return {
      backdrop: read(el.querySelector('.ds-dialog__backdrop, .ds-sheet__backdrop')),
      box: read(el.querySelector('.ds-dialog__box, .ds-sheet__panel')),
    };
  }, [id, action]);
}

/** The expected tracks: [property, duration token, curve token] → "property ms easing", sorted. */
const expected = (t, entries) => entries.map(([property, duration, easing]) => `${property} ${t[duration]} ${t[easing]}`).sort();

/** The longest duration of a list of tracks. */
const longestOf = (list) => Math.max(...list.map((entry) => Number(entry.split(' ')[1])));

const finishAll = (page) => page.evaluate(() => document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline)).forEach((animation) => animation.finish()));

/** PNG pixels of `clip` as [r, g, b, a, ...], decoded by the page itself (no image library in the tests). */
async function pixels(page, clip) {
  const png = await page.screenshot({ clip, animations: 'allow', caret: 'hide' });
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    return Array.from(context.getImageData(0, 0, image.width, image.height).data);
  }, png.toString('base64'));
}

test.describe('overlay timelines', () => {
  test('dialog (div and native): the entrance and exit follow the choreography, the exit is shorter', async ({ page }) => {
    await load(page);
    const t = await tokens(page);
    for (const id of ['dialog', 'native']) {
      const entrance = await tracksOf(page, id, 'open');
      expect(entrance.backdrop, id).toEqual(expected(t, [['opacity', '--ds-dur-medium', '--ds-ease-in-out']]));
      expect(entrance.box, id).toEqual(expected(t, [
        ['opacity', '--ds-dur-fast', '--ds-ease-in-out'],
        ['scale', '--ds-dur-slow', '--ds-ease-spatial'],
        ['translate', '--ds-dur-slow', '--ds-ease-spatial'],
      ]));
      await finishAll(page);
      await settle(page);
      const exit = await tracksOf(page, id, 'close');
      expect(exit.backdrop, id).toEqual(expected(t, [['opacity', '--ds-dur-base', '--ds-ease-in-out']]));
      expect(exit.box, id).toEqual(expected(t, [
        ['opacity', '--ds-dur-base', '--ds-ease-in-out'],
        ['scale', '--ds-dur-base', '--ds-ease-exit'],
        ['translate', '--ds-dur-base', '--ds-ease-exit'],
      ]));
      expect(longestOf(exit.box), id).toBeLessThan(longestOf(entrance.box));
      await finishAll(page);
      await closed(page, id);
      expect(await leftovers(page), id).toEqual(clean);
    }
  });

  test('side sheet (div and native): the opaque panel only slides, on the spring in and accelerating out', async ({ page }) => {
    await load(page);
    const t = await tokens(page);
    for (const id of ['sheet', 'native-sheet']) {
      const panel = page.locator(`#${id} .ds-sheet__panel`);
      const entrance = await tracksOf(page, id, 'open');
      expect(entrance.backdrop, id).toEqual(expected(t, [['opacity', '--ds-dur-medium', '--ds-ease-in-out']]));
      expect(entrance.box, id).toEqual(expected(t, [['translate', '--ds-dur-long', '--ds-ease-spatial']]));
      const into = await sample(panel, ['opacity'], [0, 50, 100, 200, 300, 450].map((ms) => ms * t['--ds-dur-long'] / 450));
      expect(series(into, 'opacity'), `${id}: never fades in`).toEqual(into.map(() => 1));
      await finishAll(page);
      await settle(page);
      const exit = await tracksOf(page, id, 'close');
      expect(exit.backdrop, id).toEqual(expected(t, [['opacity', '--ds-dur-base', '--ds-ease-in-out']]));
      expect(exit.box, id).toEqual(expected(t, [['translate', '--ds-dur-base', '--ds-ease-exit']]));
      expect(longestOf(exit.box), id).toBeLessThan(longestOf(entrance.box));
      const out = await sample(panel, ['opacity'], [0, 50, 100, 150, 199].map((ms) => ms * t['--ds-dur-base'] / 200));
      expect(series(out, 'opacity'), `${id}: never fades out`).toEqual(out.map(() => 1));
      await finishAll(page);
      await closed(page, id);
      expect(await leftovers(page), id).toEqual(clean);
    }
  });

  for (const [label, width, title] of [
    ['desktop', 1000, 'the spring overshoots at most 5% and settles; the bleed fills the screen edge at the peak'],
    ['phone', 390, 'it rises on --ds-ease-out, so its head never passes the top edge; the bottom edge shows the panel'],
  ]) {
    test(`side sheet (${label}): ${title}`, async ({ page }) => {
      await load(page, 'overlay.html', width);
      const t = await tokens(page);
      const axis = width > 600 ? 'x' : 'y';
      const entrance = await tracksOf(page, 'sheet', 'open');
      // As tall as the screen, a phone sheet that sprang would cut off its head at the top edge.
      expect(entrance.box).toEqual(expected(t, [['translate', '--ds-dur-long', axis === 'x' ? '--ds-ease-spatial' : '--ds-ease-out']]));
      const panel = page.locator('#sheet .ds-sheet__panel');
      const steps = Array.from({ length: 46 }, (_, i) => (i * t['--ds-dur-long']) / 45);
      const values = series(await sample(panel, [`rect.${axis}`], steps), `rect.${axis}`);
      const rest = values.at(-1);
      expect(rest).toBeCloseTo(axis === 'x' ? width - (await panel.evaluate((el) => el.offsetWidth)) : 0, 0);
      expectMonotonic(values.slice(0, values.indexOf(Math.min(...values)) + 1), { direction: 'down' });
      expectPeakAtMost(values, 1.05, { from: values[0], to: rest });
      expectSettles(values, rest, 0.5);
      if (axis === 'y') expect(Math.min(...values), 'the panel\'s top never passes the top edge').toBeGreaterThanOrEqual(-0.5);

      // The frame of the deepest overshoot (paused, seeked): the outer screen edge shows the panel, not the scrim.
      const peak = steps[values.indexOf(Math.min(...values))];
      await seek(page, peak);
      const colour = await panel.evaluate((el) => getComputedStyle(el).backgroundColor.match(/\d+/g).slice(0, 3).map(Number));
      const viewport = page.viewportSize();
      const clip = axis === 'x' ? { x: viewport.width - 2, y: 120, width: 1, height: 560 } : { x: 24, y: viewport.height - 2, width: viewport.width - 48, height: 1 };
      const data = await pixels(page, clip);
      const off = [];
      for (let i = 0; i < data.length; i += 4) {
        if (Math.max(...[0, 1, 2].map((c) => Math.abs(data[i + c] - colour[c]))) > 3) off.push(data.slice(i, i + 3).join(','));
      }
      expect(off, `${Math.min(...values) - rest}px past rest at ${peak}ms`).toEqual([]);
      await finishAll(page);
      await page.evaluate(() => DS.overlay.close(document.getElementById('sheet')));
      await closed(page, 'sheet');
    });
  }

  test('driven by hand (no data-state), dialog and sheet leave with their exit keyframes, also at 600px and below', async ({ page }) => {
    for (const width of [1000, 400]) {
      await load(page, 'overlay.html', width);
      const read = await page.evaluate(() => {
        // The computed form of a curve token, to compare like for like.
        const curve = (token) => {
          const probe = document.createElement('div');
          probe.style.animationTimingFunction = `var(${token})`;
          document.querySelector('.ds-theme').append(probe);
          const value = getComputedStyle(probe).animationTimingFunction;
          probe.remove();
          return value;
        };
        const out = {};
        for (const [id, part, closing] of [['dialog', '.ds-dialog__box', 'ds-dialog--closing'], ['sheet', '.ds-sheet__panel', 'ds-sheet--closing']]) {
          const el = document.getElementById(id);
          const box = el.querySelector(part);
          el.hidden = false;
          const enter = getComputedStyle(box);
          const entrance = { names: enter.animationName, curves: enter.animationTimingFunction };
          // The first frame of the rise, frozen in this task: the same --ds-distance-sm as the state path.
          const grow = box.getAnimations().find((animation) => animation.animationName === 'ds-grow-in');
          if (grow) {
            for (const animation of box.getAnimations()) animation.pause();
            grow.currentTime = 0;
            const distance = document.createElement('div');
            distance.style.width = 'var(--ds-distance-sm)';
            document.querySelector('.ds-theme').append(distance);
            entrance.rise = getComputedStyle(box).translate === `0px ${getComputedStyle(distance).width}`;
            distance.remove();
          }
          el.classList.add(closing);
          const leave = getComputedStyle(box);
          const exit = { names: leave.animationName, curves: leave.animationTimingFunction, running: box.getAnimations().map((animation) => animation.animationName).sort() };
          el.classList.remove(closing);
          el.hidden = true;
          out[id] = { entrance, exit };
        }
        out.curves = { inOut: curve('--ds-ease-in-out'), out: curve('--ds-ease-out'), spatial: curve('--ds-ease-spatial'), exit: curve('--ds-ease-exit') };
        return out;
      });
      const c = read.curves;
      const phone = width <= 600;
      expect(read.dialog.entrance, `dialog at ${width}px`).toEqual({ names: 'ds-fade-in, ds-grow-in', curves: `${c.inOut}, ${phone ? c.out : c.spatial}`, rise: true });
      expect(read.dialog.exit, `dialog at ${width}px`).toEqual({ names: 'ds-fade-out, ds-shrink-out', curves: `${c.inOut}, ${c.exit}`, running: ['ds-fade-out', 'ds-shrink-out'] });
      expect(read.sheet.entrance, `sheet at ${width}px`).toEqual({ names: phone ? 'ds-lift-in' : 'ds-shift-in', curves: phone ? c.out : c.spatial });
      expect(read.sheet.exit, `sheet at ${width}px`).toEqual({ names: phone ? 'ds-drop-out' : 'ds-shift-out', curves: c.exit, running: [phone ? 'ds-drop-out' : 'ds-shift-out'] });
    }
  });

  test('a reopen at 50% of the exit continues from the current opacity and scale (div and native)', async ({ page }) => {
    await load(page);
    const t = await tokens(page);
    for (const id of ['dialog', 'native']) {
      await page.evaluate((name) => DS.overlay.open(document.getElementById(name), { opener: document.getElementById('open-dialog') }), id);
      await settle(page);
      const box = page.locator(`#${id} .ds-dialog__box`);
      await tracksOf(page, id, 'close');
      const half = t['--ds-dur-base'] / 2;
      const exit = await sample(box, ['opacity', 'scale.x'], Array.from({ length: 11 }, (_, i) => (i * half) / 10));
      // Taken back at 50% in one task (seek, read, open, pause): the new transitions start from there. The exit runs
      // again from 50% before the open (play() keeps the seeked time within the task): Firefox takes a replaced
      // transition's value from the timeline (real time since it began) when showModal() puts the dialog back in the
      // top layer, not from a paused animation's held time.
      const at = await page.evaluate(([name, time]) => {
        for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) {
          animation.currentTime = time;
          animation.play();
        }
        const style = getComputedStyle(document.querySelector(`#${name} .ds-dialog__box`));
        const values = { opacity: Number(style.opacity), 'scale.x': style.scale === 'none' ? 1 : parseFloat(style.scale) };
        DS.overlay.open(document.getElementById(name), { opener: document.getElementById('open-dialog') });
        for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
        return values;
      }, [id, half]);
      // Fine steps while the opacity climbs (the standard curve is steep there), then coarser ones.
      const steps = [...Array.from({ length: 80 }, (_, i) => i * 2), ...Array.from({ length: 20 }, (_, i) => 160 + (i * (t['--ds-dur-slow'] - 160)) / 19)];
      const back = await sample(box, ['opacity', 'scale.x'], steps);
      expect(at.opacity, `${id}: the exit had begun`).toBeLessThan(0.9);
      expect(Math.abs(exit.at(-1).opacity - at.opacity), id).toBeLessThan(0.001);
      expect(Math.abs(back[0].opacity - at.opacity), id).toBeLessThan(0.02);
      expect(Math.abs(back[0]['scale.x'] - at['scale.x']), id).toBeLessThan(0.002);
      for (const key of ['opacity', 'scale.x']) expectContinuous([...series(exit, key), ...series(back, key)], { floor: key === 'opacity' ? 0.05 : 0.002 });
      expect(back.at(-1).opacity, id).toBe(1);
      expect(back.at(-1)['scale.x'], id).toBeCloseTo(1, 3);
      expect(await page.evaluate((name) => document.getElementById(name).dataset.state, id)).toBe('open');
      await finishAll(page);
      await page.evaluate((name) => DS.overlay.close(document.getElementById(name)), id);
      await finishAll(page);
      await closed(page, id);
      expect(await leftovers(page), id).toEqual(clean);
    }
  });

  test('the same timelines with prefers-reduced-motion: reduce (one motion on every device)', async ({ page }) => {
    const record = async () => {
      await load(page);
      const out = {};
      for (const id of ['dialog', 'native', 'sheet', 'native-sheet']) {
        out[`${id} open`] = await tracksOf(page, id, 'open');
        await finishAll(page);
        await settle(page);
        out[`${id} close`] = await tracksOf(page, id, 'close');
        await finishAll(page);
        await closed(page, id);
      }
      out.menu = await page.evaluate(() => {
        const menu = document.getElementById('menu');
        DS.overlay.open(menu, { opener: document.getElementById('open-menu') });
        const tracks = menu.getAnimations().map((animation) => `${animation.transitionProperty} ${animation.effect.getTiming().duration} ${animation.effect.getTiming().easing}`).sort();
        for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.finish();
        return tracks;
      });
      await page.evaluate(() => DS.overlay.close(document.getElementById('menu')));
      await finishAll(page);
      return out;
    };
    const full = await record();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    expect(await record()).toEqual(full);
  });
});

test.describe('focus and pointer during the close', () => {
  test('Cancel and a backdrop click give focus to the opener in the same task (div and native)', async ({ page }) => {
    await load(page);
    for (const [id, opener, cancel] of [['dialog', 'open-dialog', 'dialog-cancel'], ['native', 'open-native', 'native-cancel']]) {
      for (const target of [`#${cancel}`, `#${id} .ds-dialog__backdrop`]) {
        await page.click(`#${opener}`);
        const atClose = await page.evaluate((selector) => {
          document.querySelector(selector).click();
          return document.activeElement.id;
        }, target);
        expect(atClose, `${id}: ${target}`).toBe(opener);
        await closed(page, id);
        expect(await focused(page)).toBe(opener);
        expect(await leftovers(page)).toEqual(clean);
      }
    }
  });

  test('a native dialog or sheet opened and closed with the mouse shows no keyboard ring; with the keyboard it does', async ({ page }) => {
    // WebKit marks what showModal() and close() focus as :focus-visible even
    // after a click (1.6.2): the autofocus target, then the opener.
    await load(page);
    const ring = () => page.evaluate(() => ({ id: document.activeElement?.id, ring: document.activeElement?.matches(':focus-visible') ?? false }));
    for (const [id, opener, inside] of [['native', 'open-native', 'native-cancel'], ['native-sheet', 'open-native-sheet', 'native-sheet-close']]) {
      await page.click(`#${opener}`);
      await settle(page);
      expect(await ring(), `${id}: a mouse open`).toEqual({ id: inside, ring: false });
      await page.click(`#${inside}`);
      await closed(page, id);
      expect(await ring(), `${id}: a mouse close`).toEqual({ id: opener, ring: false });
      await page.mouse.move(1, 1);
      await focusByKeyboard(page, page.locator(`#${opener}`));
      await page.keyboard.press('Enter');
      await settle(page);
      expect(await ring(), `${id}: a keyboard open`).toEqual({ id: inside, ring: true });
      await page.keyboard.press('Escape');
      await closed(page, id);
      expect(await ring(), `${id}: Escape`).toEqual({ id: opener, ring: true });
      expect(await leftovers(page)).toEqual(clean);
    }
  });

  test('a native dialog opened with the mouse leaves the text field it focuses alone: no blur, and it keeps its ring', async ({ page }) => {
    // The WebKit ring correction runs only where there is something to correct: a text field always shows the ring.
    await load(page);
    await page.evaluate(() => {
      document.querySelector('.ds-theme').insertAdjacentHTML('beforeend', '<button class="ds-btn" type="button" id="x-open-field">Rename</button>'
        + '<dialog class="ds-dialog" id="x-field-dialog" aria-labelledby="x-field-title"><div class="ds-dialog__backdrop" data-close></div><div class="ds-dialog__box">'
        + '<h2 class="ds-dialog__title" id="x-field-title">Rename</h2><input class="ds-input" id="x-field" required aria-label="Name">'
        + '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" id="x-field-cancel" data-close>Cancel</button></div></div></dialog>');
      window.fxLog = [];
      const field = document.getElementById('x-field');
      for (const type of ['focus', 'blur']) field.addEventListener(type, () => window.fxLog.push(type));
      document.getElementById('x-open-field').addEventListener('click', (event) => DS.overlay.open(document.getElementById('x-field-dialog'), { opener: event.currentTarget }));
    });
    await page.click('#x-open-field');
    await settle(page);
    expect(await page.evaluate(() => ({ log: window.fxLog, focused: document.activeElement?.id, ring: document.getElementById('x-field').matches(':focus-visible') })))
      .toEqual({ log: ['focus'], focused: 'x-field', ring: true });
    await page.click('#x-field-cancel');
    await closed(page, 'x-field-dialog');
  });

  test('Tab and Shift+Tab never reach the page behind an open dialog (div and native)', async ({ page }) => {
    await load(page);
    for (const [id, opener] of [['dialog', 'open-dialog'], ['native', 'open-native']]) {
      await page.click(`#${opener}`);
      const stops = [];
      for (const key of [...Array(5).fill('Tab'), ...Array(5).fill('Shift+Tab')]) {
        await page.keyboard.press(key);
        // <body> stands for the browser's own UI between the last and the first stop.
        stops.push(await page.evaluate((name) => {
          const active = document.activeElement;
          return !active || active === document.body || document.getElementById(name).contains(active) ? 'inside' : active.id || active.tagName;
        }, id));
      }
      expect(stops, id).toEqual(stops.map(() => 'inside'));
      await page.keyboard.press('Escape');
      await closed(page, id);
    }
  });

  test('a double click on the backdrop during the exit never reaches the page under it, and focus stays on the opener', async ({ page }) => {
    // Slowed tenfold, so the second click surely lands while the exit plays.
    await load(page, 'overlay.html?speed=0.1');
    await page.evaluate(() => {
      window.pageClicks = [];
      for (const button of document.querySelectorAll('#page button')) button.addEventListener('click', () => window.pageClicks.push(button.id));
    });
    const under = await page.locator('#open-native-sheet').boundingBox();
    for (const id of ['dialog', 'native', 'sheet', 'native-sheet']) {
      await page.evaluate((name) => DS.overlay.open(document.getElementById(name), { opener: document.getElementById('open-dialog') }), id);
      await settle(page, { timeout: 10000 });
      await page.mouse.dblclick(under.x + under.width / 2, under.y + under.height / 2);
      // The second press lands on the leaving backdrop, which is not focusable: focus stays on the opener.
      expect(await page.evaluate((name) => ({ state: document.getElementById(name).dataset.state, focus: document.activeElement.id }), id), id)
        .toEqual({ state: 'closed', focus: 'open-dialog' });
      await page.mouse.click(under.x + under.width / 2, under.y + under.height / 2);
      expect(await page.evaluate(() => window.pageClicks), id).toEqual([]);
      await closed(page, id);
      expect(await focused(page), id).toBe('open-dialog');
      expect(await leftovers(page), id).toEqual(clean);
    }
  });

  test('a double click on the modal drawer\'s scrim during the exit keeps focus on the menu button', async ({ page }) => {
    await load(page, 'shell.html?speed=0.1', 800);
    await page.evaluate(() => DS.overlay.open(document.getElementById('drawer'), { opener: document.getElementById('menu') }));
    await settle(page, { timeout: 10000 });
    await page.mouse.dblclick(700, 400);
    expect(await page.evaluate(() => ({
      open: document.getElementById('app').hasAttribute('data-drawer-open'),
      closing: document.getElementById('drawer').inert,
      focus: document.activeElement.id,
    }))).toEqual({ open: false, closing: true, focus: 'menu' });
    await page.waitForFunction(() => !document.getElementById('drawer').inert, null, { timeout: 10000 });
    expect(await focused(page)).toBe('menu');
    expect(await leftovers(page)).toEqual(clean);
  });


  test('a native dialog or sheet keeps above a sticky page element while it closes (--closing outside the top layer)', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      const bar = document.createElement('div');
      bar.id = 'sticky';
      bar.style.cssText = 'position: sticky; top: 0; z-index: var(--ds-z-sticky); height: 64px; background: var(--ds-surface)';
      document.getElementById('page').prepend(bar);
    });
    for (const id of ['native', 'native-sheet']) {
      const hits = await page.evaluate(async (name) => {
        const el = document.getElementById(name);
        await DS.overlay.open(el, { opener: document.getElementById('open-native') });
        DS.overlay.close(el);
        const exit = document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline));
        const sticky = document.getElementById('sticky').getBoundingClientRect();
        const hit = () => el.contains(document.elementFromPoint(sticky.left + 8, sticky.top + 8));
        const out = { open: el.open, start: hit() };
        for (const animation of exit) animation.pause();
        for (const animation of exit) animation.currentTime = Number(animation.effect.getComputedTiming().duration) * 0.6;
        out.mid = hit();
        out.zIndex = getComputedStyle(el).zIndex;
        for (const animation of exit) animation.play();
        return out;
      }, id);
      expect(hits, id).toEqual({ open: false, start: true, mid: true, zIndex: id === 'native' ? '51' : '50' });
      await closed(page, id);
      expect(await leftovers(page), id).toEqual(clean);
    }
  });

  test('the shell app: no scroll gutter or padding is added, nothing shifts sideways', async ({ page }) => {
    await load(page, 'shell.html', 1000);
    const x = () => page.evaluate(() => document.querySelector('.ds-topbar').getBoundingClientRect().right);
    const before = await x();
    const room = await page.evaluate(() => {
      const dialog = document.createElement('div');
      dialog.className = 'ds-dialog';
      dialog.id = 'fx-dialog';
      dialog.hidden = true;
      dialog.innerHTML = '<div class="ds-dialog__backdrop" data-close></div><div class="ds-dialog__box"><button type="button">OK</button></div>';
      document.querySelector('.ds-theme').append(dialog);
      DS.overlay.open(dialog);
      return { locked: document.body.classList.contains('ds-no-scroll'), gutter: document.documentElement.style.scrollbarGutter, padding: document.body.style.paddingRight };
    });
    expect(room).toEqual({ locked: true, gutter: '', padding: '' });
    expect(await x()).toBe(before);
    await page.evaluate(() => DS.overlay.close(document.getElementById('fx-dialog')));
    await closed(page, 'fx-dialog');
    expect(await leftovers(page)).toEqual(clean);
  });
});

/* ── Forced colours (Chromium emulation) ───────────────────────────── */

test.describe('forced colours', () => {
  test.beforeEach(async ({ page, browserName, dsFallback }) => {
    test.skip(browserName !== 'chromium' || dsFallback, 'forced colours are emulated and shot in Chromium only (one baseline)');
    await page.emulateMedia({ forcedColors: 'active' });
  });

  /**
   * The settled overlay with 8px around it (inside the viewport), after
   * checking that its surface (`surface`, default the overlay) paints the
   * edge `edge` that forced colours give its transparent outline or border.
   */
  async function shoot(page, selector, name, { edge = 'outline-top-color', surface = selector } = {}) {
    await settle(page);
    const locator = page.locator(selector).first();
    const colour = await page.locator(surface).first().evaluate((el, property) => getComputedStyle(el).getPropertyValue(property), edge);
    expect(colour, `${name}: ${edge}`).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
    const box = await locator.boundingBox();
    const viewport = page.viewportSize();
    const x = Math.max(0, Math.floor(box.x - 8));
    const y = Math.max(0, Math.floor(box.y - 8));
    const clip = { x, y, width: Math.min(viewport.width, Math.ceil(box.x + box.width + 8)) - x, height: Math.min(viewport.height, Math.ceil(box.y + box.height + 8)) - y };
    await expect.soft(page, name).toHaveScreenshot(name, { clip });
  }

  test('dialog (both markups) and side sheet keep their edge', async ({ page }) => {
    await load(page);
    expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
    for (const [opener, id, part, name] of [['open-dialog', 'dialog', '.ds-dialog__box', 'forced-dialog.png'], ['open-native', 'native', '.ds-dialog__box', 'forced-dialog-native.png'], ['open-sheet', 'sheet', '.ds-sheet__panel', 'forced-sheet.png']]) {
      await page.click(`#${opener}`);
      await page.mouse.move(1, 1);
      await shoot(page, `#${id} ${part}`, name, { edge: part === '.ds-dialog__box' ? 'border-top-color' : 'outline-top-color' });
      await page.keyboard.press('Escape');
      await closed(page, id);
    }
  });

  test('menu and combobox list with a selected option keep their edge', async ({ page }) => {
    await load(page, 'popups.html', 1000);
    await page.click('#trigger');
    await page.mouse.move(1, 1);
    await shoot(page, '#menu', 'forced-menu.png');
    await page.keyboard.press('Escape');
    await page.click('#combo-toggle');
    await page.mouse.move(1, 1);
    const selected = await page.locator('#combo-b').evaluate((el) => {
      const style = getComputedStyle(el);
      return { background: style.backgroundColor, color: style.color, page: getComputedStyle(document.body).backgroundColor };
    });
    expect(selected.background, 'the chosen option in the system selection colour').not.toBe(selected.page);
    await shoot(page, '#combo-popup', 'forced-combobox.png');
  });

  test('snackbar stack and tooltip keep their edge', async ({ page }) => {
    await load(page, 'toast-tooltip.html', 1280);
    await page.evaluate(() => {
      const region = document.getElementById('toasts');
      DS.overlay.toast(region, 'Saved.', { persistent: true });
      DS.overlay.toast(region, 'Could not reach the device.', { kind: 'error' });
      DS.overlay.toast(region, '3 devices archived.', { persistent: true });
    });
    await shoot(page, '#toasts', 'forced-snackbars.png', { surface: '#toasts .ds-toast' });
    await focusByKeyboard(page, page.locator('#tip-download'));
    await shoot(page, '.ds-tooltip', 'forced-tooltip.png');
  });
});

/* ── 2.0: busy, reasons, topmost, the dismiss guard, focus return ─── */

/**
 * Records every ds-close of the page as "id:reason" (window.__closes), in
 * the order they are sent.
 */
function recordCloses(page) {
  return page.evaluate(() => {
    window.__closes = [];
    document.addEventListener('ds-close', (event) => window.__closes.push(`${event.target.id || event.target.className}:${event.detail.reason}`));
  });
}

const closes = (page) => page.evaluate(() => window.__closes.splice(0));

/** Opens `id` from `opener` and waits until its entrance settled. */
async function openSettled(page, id, opener) {
  await page.evaluate(([name, from]) => DS.overlay.open(document.getElementById(name), { opener: from ? document.getElementById(from) : undefined }), [id, opener]);
  await settle(page);
}

const isOpen = (page, id) => page.evaluate((name) => document.getElementById(name).getAttribute('data-state') === 'open', id);

test.describe('busy overlays (2.0, data-ds-busy)', () => {
  const OVERLAYS = [
    ['dialog', 'open-dialog', '#dialog-cancel', '.ds-dialog__backdrop'],
    ['native', 'open-native', '#native-cancel', '.ds-dialog__backdrop'],
    ['sheet', 'open-sheet', '#sheet-close', '.ds-sheet__backdrop'],
    ['native-sheet', 'open-native-sheet', '#native-sheet-close', '.ds-sheet__backdrop'],
  ];

  for (const [id, opener, closer, backdrop] of OVERLAYS) {
    test(`${id}: Escape, [data-close], the backdrop and the native cancel do nothing while busy; close() and a removal still close`, async ({ page }) => {
      await load(page);
      await recordCloses(page);
      await openSettled(page, id, opener);
      await page.evaluate((name) => document.getElementById(name).setAttribute('data-ds-busy', ''), id);
      await page.keyboard.press('Escape');
      await page.evaluate(([name, close, scrim]) => {
        const el = document.getElementById(name);
        document.querySelector(close).click();
        el.querySelector(scrim).click();
        // A close request of the engine (Escape, Android Back) on a native dialog.
        if (el.tagName === 'DIALOG') el.dispatchEvent(new Event('cancel', { cancelable: true }));
      }, [id, closer, backdrop]);
      // The pointer path too: a real click on the backdrop, well after the open.
      await page.mouse.click(4, 4);
      expect(await isOpen(page, id), 'still open').toBe(true);
      expect(await page.evaluate((name) => (document.getElementById(name).tagName === 'DIALOG' ? document.getElementById(name).open : true), id), 'the native dialog stays modal').toBe(true);
      expect(await closes(page), 'a refused attempt sends no ds-close').toEqual([]);
      // close() of the page closes a busy overlay.
      await page.evaluate((name) => DS.overlay.close(document.getElementById(name)), id);
      await closed(page, id);
      expect(await closes(page)).toEqual([`${id}:api`]);
      expect(await focused(page)).toBe(opener);
      // Removed from the document while busy: closed at once, with reason removed.
      await openSettled(page, id, opener);
      const reason = await page.evaluate(async (name) => {
        const el = document.getElementById(name);
        const place = [el.parentNode, el.nextSibling];
        // Sent on the detached element: the document no longer hears it.
        el.addEventListener('ds-close', (event) => window.__closes.push(`${name}:${event.detail.reason}`), { once: true });
        el.remove();
        await new Promise((resolve) => setTimeout(resolve));
        place[0].insertBefore(el, place[1]);
        el.removeAttribute('data-ds-busy');
        return window.__closes.splice(0);
      }, id);
      expect(reason).toEqual([`${id}:removed`]);
      expect(await leftovers(page)).toEqual(clean);
    });
  }

  test('a menu inside a busy sheet still closes on Escape; the sheet does not', async ({ page }) => {
    await load(page);
    await recordCloses(page);
    await openSettled(page, 'sheet', 'open-sheet');
    await page.evaluate(() => document.getElementById('sheet').setAttribute('data-ds-busy', ''));
    await page.evaluate(() => DS.overlay.open(document.getElementById('menu'), { opener: document.getElementById('sheet-delete') }));
    await settle(page);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.getElementById('menu').hasAttribute('data-state'));
    await page.keyboard.press('Escape');
    expect(await isOpen(page, 'sheet')).toBe(true);
    expect(await closes(page)).toEqual(['menu:escape']);
    await page.evaluate(() => document.getElementById('sheet').removeAttribute('data-ds-busy'));
    await page.keyboard.press('Escape');
    await closed(page, 'sheet');
    expect(await closes(page)).toEqual(['sheet:escape']);
  });

  test('the modal drawer at 800px: Escape and the scrim do nothing while busy; close() closes; a wider window closes with reason breakpoint', async ({ page }) => {
    await load(page, 'shell-overlay.html', 800);
    await recordCloses(page);
    const drawerOpen = () => page.evaluate(() => document.getElementById('app').hasAttribute('data-drawer-open'));
    await openSettled(page, 'drawer', 'menu');
    await page.evaluate(() => document.getElementById('drawer').setAttribute('data-ds-busy', ''));
    await page.keyboard.press('Escape');
    await page.evaluate(() => document.getElementById('scrim').click());
    expect(await drawerOpen()).toBe(true);
    expect(await closes(page)).toEqual([]);
    await page.evaluate(() => DS.overlay.close(document.getElementById('drawer')));
    expect(await drawerOpen()).toBe(false);
    expect(await closes(page)).toEqual(['drawer:api']);
    await settle(page);
    await page.evaluate(() => document.getElementById('drawer').removeAttribute('data-ds-busy'));
    await openSettled(page, 'drawer', 'menu');
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.waitForFunction(() => !document.getElementById('app').hasAttribute('data-drawer-open'));
    expect(await closes(page)).toEqual(['drawer:breakpoint']);
  });
});

test.describe('why it closed (2.0, ds-close)', () => {
  test('each way of closing sends its reason once; nothing during an exit; inner layers first with parent', async ({ page }) => {
    await load(page);
    await recordCloses(page);
    // Escape, the backdrop, another [data-close], a reason of the page's own, the native close of the page.
    await openSettled(page, 'dialog', 'open-dialog');
    await page.keyboard.press('Escape');
    await closed(page, 'dialog');
    await openSettled(page, 'dialog', 'open-dialog');
    await page.evaluate(() => document.querySelector('#dialog .ds-dialog__backdrop').click());
    await closed(page, 'dialog');
    await openSettled(page, 'dialog', 'open-dialog');
    await page.evaluate(() => document.getElementById('dialog-ok').click());
    await closed(page, 'dialog');
    await openSettled(page, 'dialog', 'open-dialog');
    await page.evaluate(() => {
      const dialog = document.getElementById('dialog');
      DS.overlay.close(dialog, { reason: 'confirm' });
      // A second close during the exit: no second event.
      DS.overlay.close(dialog);
    });
    await closed(page, 'dialog');
    await openSettled(page, 'native', 'open-native');
    await page.evaluate(() => document.getElementById('native').close());
    await closed(page, 'native');
    expect(await closes(page)).toEqual(['dialog:escape', 'dialog:backdrop', 'dialog:close', 'dialog:confirm', 'native:api']);
    // Menus: an item, Tab, a press outside.
    await page.click('#open-menu');
    await settle(page);
    await page.click('#menu-b');
    await page.waitForFunction(() => !document.getElementById('menu').hasAttribute('data-state'));
    await page.click('#open-menu');
    await settle(page);
    await page.keyboard.press('Tab');
    await page.waitForFunction(() => !document.getElementById('menu').hasAttribute('data-state'));
    await page.click('#open-menu');
    await settle(page);
    await page.mouse.click(600, 700);
    await page.waitForFunction(() => !document.getElementById('menu').hasAttribute('data-state'));
    expect(await closes(page)).toEqual(['menu:item', 'menu:tab', 'menu:outside']);
    // A menu opened from inside the sheet closes with it, before the sheet's own event.
    await openSettled(page, 'sheet', 'open-sheet');
    await page.evaluate(() => DS.overlay.open(document.getElementById('menu'), { opener: document.getElementById('sheet-delete') }));
    await settle(page);
    await page.evaluate(() => DS.overlay.close(document.getElementById('sheet')));
    await closed(page, 'sheet');
    expect(await closes(page)).toEqual(['menu:parent', 'sheet:api']);
    // Never opened: nothing.
    await page.evaluate(() => DS.overlay.close(document.getElementById('native-sheet')));
    expect(await closes(page)).toEqual([]);
  });

  test('the event comes after focus is back on the opener and the box turned inert', async ({ page }) => {
    await load(page);
    await openSettled(page, 'dialog', 'open-dialog');
    const seen = await page.evaluate(() => new Promise((resolve) => {
      const dialog = document.getElementById('dialog');
      dialog.addEventListener('ds-close', (event) => resolve({
        focus: document.activeElement.id,
        inert: dialog.querySelector('.ds-dialog__box').inert,
        state: dialog.getAttribute('data-state'),
        cancelable: event.cancelable,
        bubbles: event.bubbles,
      }), { once: true });
      DS.overlay.close(dialog);
    }));
    expect(seen).toEqual({ focus: 'open-dialog', inert: true, state: 'closed', cancelable: false, bubbles: true });
  });
});

test.describe('topmost (2.0)', () => {
  test('names the top open layer: none, a sheet, a dialog over it, the sheet again once the dialog closes, a menu', async ({ page }) => {
    await load(page);
    const top = () => page.evaluate(() => DS.overlay.topmost()?.id ?? null);
    expect(await top()).toBe(null);
    await openSettled(page, 'sheet', 'open-sheet');
    expect(await top()).toBe('sheet');
    await openSettled(page, 'dialog', 'sheet-delete');
    expect(await top()).toBe('dialog');
    // A closing layer no longer counts.
    await page.evaluate(() => DS.overlay.close(document.getElementById('dialog')));
    expect(await top()).toBe('sheet');
    await closed(page, 'dialog');
    await page.evaluate(() => DS.overlay.close(document.getElementById('sheet')));
    await closed(page, 'sheet');
    await page.click('#open-menu');
    expect(await top()).toBe('menu');
    await page.keyboard.press('Escape');
    expect(await top()).toBe(null);
  });
});

test.describe('the dismiss guard (2.0, --ds-delay-dismiss)', () => {
  test('a double click on the opener opens and does not close; a click on the backdrop 400ms later closes', async ({ page }) => {
    await load(page);
    await recordCloses(page);
    await page.dblclick('#open-dialog');
    await settle(page);
    expect(await isOpen(page, 'dialog')).toBe(true);
    await page.waitForTimeout(400);
    await page.mouse.click(4, 4);
    await closed(page, 'dialog');
    expect(await closes(page)).toEqual(['dialog:backdrop']);
    // The native dialog too.
    await page.dblclick('#open-native');
    await settle(page);
    expect(await isOpen(page, 'native')).toBe(true);
    await page.waitForTimeout(400);
    await page.mouse.click(4, 4);
    await closed(page, 'native');
    expect(await closes(page)).toEqual(['native:backdrop']);
  });

  test('a click right after the open does not close; the window follows --ds-time-scale', async ({ page }) => {
    await load(page);
    await page.click('#open-dialog');
    await page.mouse.click(4, 4);
    expect(await isOpen(page, 'dialog')).toBe(true);
    await settle(page);
    await page.evaluate(() => DS.overlay.close(document.getElementById('dialog')));
    await closed(page, 'dialog');
    // Ten times slower: 400ms after the open is still inside the window of 3000ms.
    await page.evaluate(() => document.body.style.setProperty('--ds-time-scale', '10'));
    expect(await page.evaluate(() => Math.round(DS.motion.motionDuration(document.body, '--ds-delay-dismiss')))).toBe(3000);
    await page.click('#open-dialog');
    await page.waitForTimeout(400);
    await page.mouse.click(4, 4);
    expect(await isOpen(page, 'dialog')).toBe(true);
    await page.evaluate(() => document.querySelector('#dialog .ds-dialog__backdrop').click());
    await page.evaluate(() => document.body.style.removeProperty('--ds-time-scale'));
    await closed(page, 'dialog');
  });

  test('a drag from the box that ends on the backdrop does not close; a second click on Cancel does not, click() does', async ({ page }) => {
    await load(page);
    await openSettled(page, 'dialog', 'open-dialog');
    await page.waitForTimeout(400);
    const box = await page.locator('#dialog .ds-dialog__box').boundingBox();
    await page.mouse.move(box.x + 8, box.y + 8);
    await page.mouse.down();
    await page.mouse.move(4, 4, { steps: 4 });
    await page.mouse.up();
    expect(await isOpen(page, 'dialog')).toBe(true);
    // A click with detail 2 on a [data-close] is ignored; detail 0 (click()) closes.
    await page.evaluate(() => document.getElementById('dialog-cancel').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 2 })));
    expect(await isOpen(page, 'dialog')).toBe(true);
    await page.evaluate(() => document.getElementById('dialog-cancel').click());
    await closed(page, 'dialog');
  });

  test('the modal drawer\'s scrim: a click right after the open does not close, one later does', async ({ page }) => {
    await load(page, 'shell-overlay.html', 800);
    await page.evaluate(() => { DS.overlay.open(document.getElementById('drawer'), { opener: document.getElementById('menu') }); });
    await page.mouse.click(780, 400);
    expect(await page.evaluate(() => document.getElementById('app').hasAttribute('data-drawer-open'))).toBe(true);
    await settle(page);
    await page.waitForTimeout(400);
    await page.mouse.click(780, 400);
    expect(await page.evaluate(() => document.getElementById('app').hasAttribute('data-drawer-open'))).toBe(false);
  });
});

test.describe('the dismiss guard on touch (2.0)', () => {
  test.use({ hasTouch: true });

  test('a double tap on the opener opens and does not close', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Playwright emulates touch in Chromium and WebKit');
    await load(page);
    const button = await page.locator('#open-dialog').boundingBox();
    const x = button.x + button.width / 2;
    const y = button.y + button.height / 2;
    await page.touchscreen.tap(x, y);
    await page.touchscreen.tap(x, y);
    await settle(page);
    expect(await isOpen(page, 'dialog')).toBe(true);
    await page.waitForTimeout(400);
    await page.touchscreen.tap(4, 4);
    await closed(page, 'dialog');
  });
});

test.describe('focus back and openers (2.0)', () => {
  test('a replaced opener: focus goes to the element with its id; returnTo() wins when the opener is gone; a throwing one falls through', async ({ page }) => {
    await load(page);
    // The re-render replaced the opener with a twin of the same id.
    await openSettled(page, 'dialog', 'open-dialog');
    await page.evaluate(() => {
      const twin = document.getElementById('open-dialog').cloneNode(true);
      twin.setAttribute('data-twin', '');
      document.getElementById('open-dialog').replaceWith(twin);
    });
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => document.activeElement.id + (document.activeElement.hasAttribute('data-twin') ? ' (twin)' : ''))).toBe('open-dialog (twin)');
    await closed(page, 'dialog');
    // returnTo: called only when the opener cannot take focus.
    const calls = await page.evaluate(async () => {
      let called = 0;
      const dialog = document.getElementById('dialog');
      const returnTo = () => { called += 1; return document.getElementById('after-menu'); };
      DS.overlay.open(dialog, { opener: document.getElementById('open-sheet'), returnTo });
      await DS.overlay.close(dialog);
      const kept = [document.activeElement.id, called];
      DS.overlay.open(dialog, { opener: document.getElementById('open-sheet'), returnTo });
      document.getElementById('open-sheet').remove();
      await DS.overlay.close(dialog);
      return { kept, gone: [document.activeElement.id, called] };
    });
    expect(calls).toEqual({ kept: ['open-sheet', 0], gone: ['after-menu', 1] });
    // A returnTo that throws is reported, and the landmark takes focus.
    const thrown = await page.evaluate(async () => {
      const errors = [];
      window.addEventListener('error', (event) => { errors.push(event.message); event.preventDefault(); });
      const dialog = document.getElementById('dialog');
      DS.overlay.open(dialog, { opener: document.getElementById('open-native-sheet'), returnTo: () => { throw new Error('no row'); } });
      document.getElementById('open-native-sheet').remove();
      await DS.overlay.close(dialog);
      return { focus: document.activeElement.id, errors: errors.length };
    });
    expect(thrown).toEqual({ focus: 'page', errors: 1 });
  });

  test('without an opener and with focus on <body>, the clicked control is the opener (Safari does not focus it)', async ({ page }) => {
    await load(page);
    const back = await page.evaluate(async () => {
      const button = document.getElementById('after-menu');
      button.addEventListener('click', () => DS.overlay.open(document.getElementById('dialog')), { once: true });
      document.activeElement?.blur();
      // A dispatched click never focuses: what Safari does with a mouse click on a button.
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
      const during = document.activeElement.id;
      await DS.overlay.close(document.getElementById('dialog'));
      return { during, after: document.activeElement.id };
    });
    expect(back).toEqual({ during: 'dialog-cancel', after: 'after-menu' });
  });

  test('a dialog or sheet keeps aria-expanded on an opener that has the attribute, and adds none to one without', async ({ page }) => {
    await load(page);
    const states = await page.evaluate(async () => {
      const opener = document.getElementById('open-sheet');
      opener.setAttribute('aria-expanded', 'false');
      const sheet = document.getElementById('sheet');
      DS.overlay.open(sheet, { opener });
      const open = opener.getAttribute('aria-expanded');
      const closing = DS.overlay.close(sheet);
      const atClose = opener.getAttribute('aria-expanded');
      await closing;
      const plain = document.getElementById('open-dialog');
      DS.overlay.open(document.getElementById('dialog'), { opener: plain });
      const without = plain.hasAttribute('aria-expanded');
      await DS.overlay.close(document.getElementById('dialog'));
      return { open, atClose, without };
    });
    expect(states).toEqual({ open: 'true', atClose: 'false', without: false });
  });
});

test.describe('a filled search takes the first Escape (2.0)', () => {
  test('Escape clears a filled search inside the dialog and fires input; the next Escape closes', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      const search = document.createElement('input');
      search.type = 'search';
      search.id = 'dialog-search';
      search.className = 'ds-input';
      search.setAttribute('aria-label', 'Search');
      document.querySelector('#dialog .ds-dialog__title').after(search);
      window.__inputs = 0;
      search.addEventListener('input', () => { window.__inputs += 1; });
    });
    await openSettled(page, 'dialog', 'open-dialog');
    await page.locator('#dialog-search').fill('lap');
    await page.evaluate(() => { window.__inputs = 0; });
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => ({ value: document.getElementById('dialog-search').value, inputs: window.__inputs }))).toEqual({ value: '', inputs: 1 });
    expect(await isOpen(page, 'dialog')).toBe(true);
    await page.keyboard.press('Escape');
    await closed(page, 'dialog');
  });
});
