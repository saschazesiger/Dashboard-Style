/**
 * Menus, the combobox list and .ds-presence (1.3.0) on fixtures/popups.html:
 * a menu focuses its first enabled item (the last from ArrowUp), moves with
 * the arrows, Home and End (wrapping), closes on Escape (focus back on the
 * trigger), on Tab, after an item's click handlers ran (not for a disabled
 * item) and on a pointerdown outside (focus stays); it sits under its
 * trigger from the start edge, towards the start edge at the window's edge
 * and above the trigger at the bottom edge; in a short window it takes the
 * bigger side and scrolls inside instead of covering its trigger; a
 * body-level menu opened from inside a native dialog moves into it (else
 * it would be inert) and back. Popups grow from the trigger
 * edge (clip-path from --ds-clip-from, scale from --ds-scale-popup) with the
 * shadow's room from the first frame, and leave by opacity alone in
 * --ds-dur-instant, below and above their trigger (menu and combobox
 * list). The combobox chevron turns to 180deg on the spring (rising to its
 * peak, at most 5% past, settling) and back; a list at the
 * bottom of a dialog is not clipped where anchor positioning exists (where
 * the script places it, it flips above, the side with more room in the
 * dialog's box), and flips above at the window's bottom edge; in a short
 * window it never covers its field and stays inside the room; closing
 * the dialog closes its open list (off the Escape stack); the
 * active option's layer goes at once. .ds-presence turns back from where it
 * is, in opacity and scale (where the engine transitions display; Firefox
 * exits at once). Motion is read with the animations paused in the task
 * that starts them (state and timing, not frames).
 */
import { test, expect } from './base-test.js';
import {
  ready, settle, expectMonotonic, expectPeakAtMost, expectSettles,
} from './helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/popups.html';

async function load(page, width = 1000) {
  await page.setViewportSize({ width, height: 700 });
  await page.goto(FIXTURE);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

const focused = (page) => page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);

/** Waits until a popup's close ended (hidden, no data-state). */
const closed = (page, id) => page.waitForFunction((name) => {
  const el = document.getElementById(name);
  return el.hidden && !el.hasAttribute('data-state');
}, id);

/** Opens `id` through its trigger and waits for the entrance. */
async function openMenu(page, trigger, id) {
  await page.click(`#${trigger}`);
  await expect(page.locator(`#${id}`)).toHaveAttribute('data-state', 'open');
  await settle(page);
}

test.describe('menu', () => {
  test('keyboard: first enabled item, arrows, Home and End wrap, Escape gives focus back', async ({ page }) => {
    await load(page);
    await page.focus('#trigger');
    await page.keyboard.press('Enter');
    await expect(page.locator('#menu')).toHaveAttribute('data-state', 'open');
    await expect(page.locator('#trigger')).toHaveAttribute('aria-expanded', 'true');
    expect(await focused(page)).toBe('item-edit');
    const keys = [['ArrowDown', 'item-rename'], ['ArrowDown', 'item-pin'], ['ArrowDown', 'item-archive'], ['ArrowDown', 'item-edit'],
      ['ArrowUp', 'item-archive'], ['Home', 'item-edit'], ['End', 'item-archive']];
    for (const [key, id] of keys) {
      await page.keyboard.press(key);
      expect(await focused(page), key).toBe(id);
    }
    await page.keyboard.press('Escape');
    expect(await focused(page)).toBe('trigger');
    await expect(page.locator('#trigger')).toHaveAttribute('aria-expanded', 'false');
    await closed(page, 'menu');
  });

  test('ArrowUp on the trigger opens on the last item; Tab closes and moves on', async ({ page }) => {
    await load(page);
    await page.focus('#trigger');
    await page.keyboard.press('ArrowUp');
    expect(await focused(page)).toBe('item-archive');
    await page.keyboard.press('Tab');
    expect(await focused(page)).toBe('after');
    await closed(page, 'menu');
    await expect(page.locator('#trigger')).toHaveAttribute('aria-expanded', 'false');
  });

  test('an item closes the menu after its click handlers ran; a disabled one does not', async ({ page }) => {
    await load(page);
    await openMenu(page, 'trigger', 'menu');
    await page.click('#item-rename', { force: true });
    await page.waitForTimeout(50);
    await expect(page.locator('#menu')).toHaveAttribute('data-state', 'open');
    await page.focus('#item-archive');
    await page.keyboard.press('Enter');
    await closed(page, 'menu');
    expect(await page.evaluate(() => window.activated)).toEqual([['item-rename', 'open'], ['item-archive', 'open']]);
    expect(await focused(page)).toBe('trigger');
  });

  test('a pointerdown outside closes it without moving focus to the trigger', async ({ page }) => {
    await load(page);
    await openMenu(page, 'trigger', 'menu');
    await page.click('#after');
    await closed(page, 'menu');
    expect(await focused(page)).toBe('after');
  });

  test('one menu for several triggers: a press on another trigger during the exit reopens it there, and that trigger closes it', async ({ page }) => {
    await load(page);
    // A second trigger of the same menu (one menu for every row), wired as the docs show.
    await page.evaluate(() => {
      const menu = document.getElementById('menu');
      const second = document.createElement('button');
      Object.assign(second, { className: 'ds-btn', type: 'button', id: 'trigger-2', textContent: 'Row 2' });
      second.setAttribute('aria-haspopup', 'menu');
      second.setAttribute('aria-expanded', 'false');
      second.setAttribute('aria-controls', 'menu');
      second.addEventListener('click', () => {
        if (second.getAttribute('aria-expanded') === 'true') DS.overlay.close(menu);
        else DS.overlay.open(menu, { opener: second });
      });
      document.getElementById('after').after(second);
    });
    await openMenu(page, 'trigger', 'menu');
    // Row 2's press: its pointerdown starts the outside close, its click
    // opens the menu during that exit (one task, so the exit is surely running).
    const during = await page.evaluate(() => {
      const second = document.getElementById('trigger-2');
      second.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true, button: 0, isPrimary: true, pointerType: 'mouse' }));
      const closing = document.getElementById('menu').getAttribute('data-state');
      second.click();
      return closing;
    });
    expect(during, 'the pointerdown started the exit').toBe('closed');
    await expect(page.locator('#menu')).toHaveAttribute('data-state', 'open');
    await settle(page);
    const placed = await page.evaluate(() => {
      const menu = document.getElementById('menu').getBoundingClientRect();
      const first = document.getElementById('trigger');
      const second = document.getElementById('trigger-2');
      return {
        atSecond: Math.abs(menu.left - second.getBoundingClientRect().left) < 1.5,
        below: Math.abs(menu.top - (second.getBoundingClientRect().bottom + 4)) < 1.5,
        expanded: [first.getAttribute('aria-expanded'), second.getAttribute('aria-expanded')],
      };
    });
    expect(placed).toEqual({ atSecond: true, below: true, expanded: ['false', 'true'] });
    // Row 2's trigger toggles it closed again.
    await page.click('#trigger-2');
    await closed(page, 'menu');
    expect(await page.evaluate(() => ['trigger', 'trigger-2'].map((id) => document.getElementById(id).getAttribute('aria-expanded')))).toEqual(['false', 'false']);
    // The same trigger during the exit still takes the close back where it is.
    await openMenu(page, 'trigger', 'menu');
    await page.evaluate(() => {
      const first = document.getElementById('trigger');
      first.click();
      first.click();
    });
    await expect(page.locator('#menu')).toHaveAttribute('data-state', 'open');
    expect(await page.locator('#trigger').getAttribute('aria-expanded')).toBe('true');
    await page.keyboard.press('Escape');
    await closed(page, 'menu');
  });

  test('placement: under the trigger from its start edge, towards the start edge at the right edge, above at the bottom', async ({ page }) => {
    await load(page);
    const place = async (trigger, id) => {
      await openMenu(page, trigger, id);
      const result = await page.evaluate(([t, m]) => {
        const a = document.getElementById(t).getBoundingClientRect();
        const b = document.getElementById(m).getBoundingClientRect();
        return { trigger: { left: a.left, right: a.right, top: a.top, bottom: a.bottom }, menu: { left: b.left, right: b.right, top: b.top, bottom: b.bottom }, top: document.getElementById(m).getAttribute('data-placement'), width: innerWidth };
      }, [trigger, id]);
      await page.keyboard.press('Escape');
      await closed(page, id);
      return result;
    };
    const below = await place('trigger', 'menu');
    expect(Math.abs(below.menu.left - below.trigger.left)).toBeLessThan(1.5);
    expect(Math.abs(below.menu.top - (below.trigger.bottom + 4))).toBeLessThan(1.5);
    const end = await place('end-trigger', 'end-menu');
    expect(Math.abs(end.menu.right - end.trigger.right), 'it opens towards the start edge').toBeLessThan(1.5);
    expect(end.menu.right).toBeLessThanOrEqual(end.width);
    const low = await place('low-trigger', 'low-menu');
    expect(Math.abs(low.menu.bottom - (low.trigger.top - 4)), 'it opens above').toBeLessThan(1.5);
    expect(low.top).toBe('top');
  });

  test('a menu the script places follows a scroll without adding or removing nodes every frame; its probe goes on close', async ({ page }) => {
    await load(page);
    // No popover: the script places the menu (Safari before 26, Firefox, Chrome before 125).
    await page.evaluate(() => { delete HTMLElement.prototype.showPopover; });
    await openMenu(page, 'trigger', 'menu');
    expect(await page.locator('#menu').getAttribute('data-anchored')).toBeNull();
    const probes = () => page.evaluate(() => [...document.querySelectorAll('[data-ds-keep][aria-hidden="true"]')]
      .filter((node) => getComputedStyle(node).position === 'fixed' && !node.childNodes.length).length);
    const result = await page.evaluate(async () => {
      const records = [];
      const observer = new MutationObserver((list) => records.push(...list.filter((record) => record.type === 'childList')));
      observer.observe(document, { childList: true, subtree: true });
      const menu = document.getElementById('menu');
      const trigger = document.getElementById('trigger');
      const before = menu.style.getPropertyValue('--ds-menu-y');
      for (let step = 1; step <= 10; step += 1) {
        // The trigger moves (an attribute change, not a child list one), then a scroll frame follows it.
        trigger.style.marginTop = `${step}px`;
        document.dispatchEvent(new Event('scroll'));
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
      observer.disconnect();
      const after = menu.style.getPropertyValue('--ds-menu-y');
      trigger.style.marginTop = '';
      return { records: records.length, followed: after !== before };
    });
    expect(result).toEqual({ records: 0, followed: true });
    expect(await probes()).toBe(1);
    await page.keyboard.press('Escape');
    await closed(page, 'menu');
    expect(await probes()).toBe(0);
  });

  test('a body-level menu opened from inside a native dialog moves into it: focusable and hit-testable, back home once closed', async ({ page }) => {
    await load(page);
    await page.click('#open-dialog');
    await settle(page);
    const opened = await page.evaluate(() => {
      const button = document.createElement('button');
      button.className = 'ds-btn';
      button.type = 'button';
      button.id = 'dialog-more';
      button.textContent = 'More';
      document.querySelector('#dialog .ds-dialog__actions').prepend(button);
      button.focus();
      DS.overlay.open(document.getElementById('menu'), { opener: button });
      return { inside: document.getElementById('dialog').contains(document.getElementById('menu')), focus: document.activeElement.id };
    });
    expect(opened).toEqual({ inside: true, focus: 'item-edit' });
    await settle(page);
    expect(await page.evaluate(() => {
      const box = document.getElementById('item-archive').getBoundingClientRect();
      return document.elementFromPoint(box.left + 20, box.top + box.height / 2)?.closest('.ds-menu__item')?.id;
    }), 'its items take the pointer').toBe('item-archive');
    await page.keyboard.press('ArrowDown');
    expect(await focused(page)).toBe('item-rename');
    await page.keyboard.press('Escape');
    expect(await focused(page)).toBe('dialog-more');
    await closed(page, 'menu');
    expect(await page.evaluate(() => ({
      home: document.getElementById('menu').parentElement.id,
      dialog: document.getElementById('dialog').open,
    }))).toEqual({ home: 'theme', dialog: true });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.getElementById('dialog').hasAttribute('data-state'));
  });

  test('in a short window the menu never covers its trigger: it takes the bigger side and scrolls inside', async ({ page }) => {
    await load(page);
    await page.setViewportSize({ width: 1000, height: 180 });
    await openMenu(page, 'trigger', 'menu');
    const boxes = await page.evaluate(() => {
      const t = document.getElementById('trigger').getBoundingClientRect();
      const m = document.getElementById('menu');
      const b = m.getBoundingClientRect();
      return { trigger: [t.top, t.bottom], menu: [b.top, b.bottom], scrolls: m.scrollHeight > m.clientHeight + 1, height: innerHeight };
    });
    const overlaps = boxes.menu[0] < boxes.trigger[1] - 0.5 && boxes.menu[1] > boxes.trigger[0] + 0.5;
    expect(overlaps, JSON.stringify(boxes)).toBe(false);
    expect(boxes.menu[0]).toBeGreaterThanOrEqual(-0.5);
    expect(boxes.menu[1]).toBeLessThanOrEqual(boxes.height + 0.5);
    expect(boxes.scrolls, 'the items scroll inside').toBe(true);
    await page.keyboard.press('Escape');
    await closed(page, 'menu');
    expect(await page.evaluate(() => document.getElementById('menu').style.maxHeight)).toBe('');
  });

  test('grows from the trigger edge with the shadow\'s room, and leaves by opacity alone', async ({ page }) => {
    await load(page);
    const start = await page.evaluate(() => {
      document.getElementById('trigger').click();
      const menu = document.getElementById('menu');
      const running = menu.getAnimations();
      for (const animation of running) animation.pause();
      const style = getComputedStyle(menu);
      const result = {
        names: running.map((animation) => animation.transitionProperty).sort(),
        opacity: Number(style.opacity),
        scale: style.scale,
        clip: style.clipPath,
        origin: style.transformOrigin,
        clipFrom: menu.style.getPropertyValue('--ds-clip-from'),
      };
      for (const animation of running) animation.play();
      return result;
    });
    expect(start.names).toEqual(['clip-path', 'opacity', 'scale']);
    expect(start.opacity).toBe(0);
    expect(start.scale).toBe('0.95');
    // Closed at the top edge (the trigger is above), the other edges 24px out.
    expect(start.clip).toMatch(/^inset\(-24px -24px 100%( -24px)? round/);
    expect(start.clipFrom).toMatch(/^inset\(calc\(-1 \* var\(--ds-space-6, 24px\)\)/);
    expect(start.origin).toMatch(/ 0px$/);
    await settle(page);
    expect(await page.evaluate(() => getComputedStyle(document.getElementById('menu')).clipPath)).toBe('inset(-24px)');
    const exit = await page.evaluate(() => {
      DS.overlay.close(document.getElementById('menu'));
      const running = document.getElementById('menu').getAnimations();
      return running.map((animation) => [animation.transitionProperty, animation.effect.getComputedTiming().duration, animation.effect.getTiming().delay]).sort();
    });
    // Opacity in --ds-dur-instant; scale and clip wait until it is invisible, then step.
    expect(exit.filter(([, duration]) => duration > 0)).toEqual([['opacity', 100, 0]]);
    await closed(page, 'menu');
  });

  test('a close taken back mid-way continues from the current opacity', async ({ page }) => {
    await load(page);
    await openMenu(page, 'trigger', 'menu');
    const values = await page.evaluate(() => {
      const menu = document.getElementById('menu');
      DS.overlay.close(menu);
      const exit = menu.getAnimations();
      for (const animation of exit) {
        animation.pause();
        animation.currentTime = 30;
      }
      const before = Number(getComputedStyle(menu).opacity);
      DS.overlay.open(menu, { opener: document.getElementById('trigger') });
      const after = Number(getComputedStyle(menu).opacity);
      for (const animation of menu.getAnimations()) animation.play();
      return { before, after, scale: getComputedStyle(menu).scale };
    });
    expect(values.before).toBeGreaterThan(0.05);
    expect(values.before).toBeLessThan(0.95);
    expect(Math.abs(values.after - values.before)).toBeLessThan(0.05);
    expect(values.scale).toBe('none');
    await settle(page);
    expect(await page.evaluate(() => Number(getComputedStyle(document.getElementById('menu')).opacity))).toBe(1);
  });
});

test.describe('combobox list', () => {
  test('aria-expanded turns the chevron to 180deg; Escape closes the list and keeps focus in the field', async ({ page }) => {
    await load(page);
    await page.click('#combo-toggle');
    await expect(page.locator('#combo-input')).toHaveAttribute('aria-expanded', 'true');
    expect(await focused(page)).toBe('combo-input');
    // Polled: an engine under load may report the spring's last frame for a moment after the transition ended.
    const rotation = () => page.evaluate(() => getComputedStyle(document.querySelector('#combo-toggle svg')).rotate);
    await settle(page);
    await expect.poll(rotation).toBe('180deg');
    await page.keyboard.press('Escape');
    await closed(page, 'combo-popup');
    expect(await focused(page)).toBe('combo-input');
    await settle(page);
    await expect.poll(rotation).toMatch(/^(none|0deg)$/);
  });

  test('the list is as wide as the field and starts at its bottom edge', async ({ page }) => {
    await load(page);
    await page.click('#combo-toggle');
    await settle(page);
    const boxes = await page.evaluate(() => {
      const field = document.getElementById('combo').getBoundingClientRect();
      const list = document.getElementById('combo-popup').getBoundingClientRect();
      return { field: [field.left, field.width, field.bottom], list: [list.left, list.width, list.top], anchored: document.getElementById('combo-popup').hasAttribute('data-anchored') };
    });
    expect(Math.abs(boxes.list[0] - boxes.field[0])).toBeLessThan(1.5);
    expect(Math.abs(boxes.list[1] - boxes.field[1])).toBeLessThan(1.5);
    expect(Math.abs(boxes.list[2] - (boxes.field[2] + 4))).toBeLessThan(1.5);
  });

  test('at the window\'s bottom edge the list opens above its field', async ({ page }) => {
    await load(page);
    await page.focus('#low-combo-input');
    await page.keyboard.press('ArrowDown');
    await settle(page);
    const boxes = await page.evaluate(() => ({
      field: document.getElementById('low-combo').getBoundingClientRect().top,
      list: document.getElementById('low-combo-popup').getBoundingClientRect().bottom,
      placement: document.getElementById('low-combo-popup').getAttribute('data-placement'),
      origin: getComputedStyle(document.getElementById('low-combo-popup')).transformOrigin,
    }));
    expect(Math.abs(boxes.list - (boxes.field - 4))).toBeLessThan(1.5);
    expect(boxes.placement).toBe('top');
  });

  test('at the bottom of a dialog the list is not clipped by the dialog where anchor positioning exists', async ({ page, dsFallback }) => {
    await load(page);
    await page.click('#open-dialog');
    await settle(page);
    await page.focus('#dialog-combo-input');
    await page.keyboard.press('ArrowDown');
    await settle(page);
    const hit = await page.evaluate(() => {
      const list = document.getElementById('dialog-combo-popup');
      const box = list.getBoundingClientRect();
      const last = document.getElementById('dialog-e').getBoundingClientRect();
      const at = document.elementFromPoint(last.left + 20, last.top + last.height / 2);
      return { anchored: list.hasAttribute('data-anchored'), onLast: at?.closest('#dialog-e') !== null, placement: list.getAttribute('data-placement') };
    });
    const supported = await page.evaluate(() => typeof HTMLElement.prototype.showPopover === 'function' && CSS.supports('position-area: block-end') && CSS.supports('width: anchor-size(width)'));
    expect(hit.anchored).toBe(supported);
    if (supported) expect(hit.onLast, 'the last option is on top at its place').toBe(true);
    // The script's absolute list cannot leave the dialog's box: it takes the side with more room there.
    else expect(hit.placement).toBe('top');
    test.info().annotations.push({ type: 'path', description: supported ? 'anchored' : `script${dsFallback ? ' (fallback project)' : ''}` });
    // Escape closes the list first, the dialog with the next one.
    await page.keyboard.press('Escape');
    await closed(page, 'dialog-combo-popup');
    await expect(page.locator('#dialog')).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.getElementById('dialog').hasAttribute('data-state'));
  });

  test('in a short window the list in a dialog never covers its field and stays inside the room', async ({ page, dsFallback }) => {
    for (const [width, height] of [[1280, 560], [390, 600]]) {
      await load(page, width);
      await page.setViewportSize({ width, height });
      await page.click('#open-dialog');
      await settle(page);
      await page.focus('#dialog-combo-input');
      await page.keyboard.press('ArrowDown');
      await settle(page);
      const boxes = await page.evaluate(() => {
        const list = document.getElementById('dialog-combo-popup');
        const field = document.getElementById('dialog-combo').getBoundingClientRect();
        const box = list.getBoundingClientRect();
        const anchored = list.hasAttribute('data-anchored');
        const clip = anchored ? { top: 0, bottom: document.documentElement.clientHeight } : document.querySelector('#dialog .ds-dialog__box').getBoundingClientRect();
        // The last option can be reached: scrolled into the list, it is the one under the pointer.
        const inner = document.getElementById('dialog-combo-list');
        inner.scrollTop = inner.scrollHeight;
        const last = document.getElementById('dialog-e').getBoundingClientRect();
        const hit = document.elementFromPoint(last.left + 20, last.top + last.height / 2)?.closest('.ds-combo__option')?.id;
        return { field: [field.top, field.bottom], list: [box.top, box.bottom], clip: [clip.top, clip.bottom], anchored, hit };
      });
      const label = `${width}x${height} ${JSON.stringify(boxes)}`;
      const overlaps = boxes.list[0] < boxes.field[1] - 0.5 && boxes.list[1] > boxes.field[0] + 0.5;
      expect(overlaps, label).toBe(false);
      expect(boxes.list[0], label).toBeGreaterThanOrEqual(boxes.clip[0] - 0.5);
      expect(boxes.list[1], label).toBeLessThanOrEqual(boxes.clip[1] + 0.5);
      expect(boxes.hit, label).toBe('dialog-e');
      test.info().annotations.push({ type: 'path', description: boxes.anchored ? 'anchored' : `script${dsFallback ? ' (fallback project)' : ''}` });
      await page.keyboard.press('Escape');
      await closed(page, 'dialog-combo-popup');
      expect(await page.evaluate(() => document.getElementById('dialog-combo-popup').style.maxHeight)).toBe('');
    }
  });

  test('closing the dialog closes its open list: hidden, not expanded, off the Escape stack', async ({ page }) => {
    await load(page);
    await page.click('#open-dialog');
    await settle(page);
    await page.focus('#dialog-combo-input');
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#dialog-combo-input')).toHaveAttribute('aria-expanded', 'true');
    await settle(page);
    const atClose = await page.evaluate(() => {
      document.getElementById('dialog-cancel').click();
      const list = document.getElementById('dialog-combo-popup');
      return { list: list.dataset.state, expanded: document.getElementById('dialog-combo-input').getAttribute('aria-expanded'), focus: document.activeElement.id };
    });
    // The list leaves with the dialog, and focus goes to the dialog's opener.
    expect(atClose).toEqual({ list: 'closed', expanded: 'false', focus: 'open-dialog' });
    await closed(page, 'dialog-combo-popup');
    await page.waitForFunction(() => !document.getElementById('dialog').hasAttribute('data-state'));
    expect(await page.evaluate(() => {
      const list = document.getElementById('dialog-combo-popup');
      return { popover: list.hasAttribute('popover') && list.matches(':popover-open'), anchored: list.hasAttribute('data-anchored') };
    })).toEqual({ popover: false, anchored: false });
    // Nothing is left on the Escape stack: the next Escape is the page's.
    const consumed = await page.evaluate(() => new Promise((resolve) => {
      window.addEventListener('keydown', (event) => resolve(event.defaultPrevented), { once: true });
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    }));
    expect(consumed).toBe(false);
  });

  test('a held arrow key leaves no trail: the layer of the option left goes at once', async ({ page }) => {
    await load(page);
    await page.click('#combo-toggle');
    await settle(page);
    const layers = await page.evaluate(() => {
      const [a, b] = [document.getElementById('combo-a'), document.getElementById('combo-b')];
      a.setAttribute('data-active', '');
      getComputedStyle(a, '::before').opacity;
      a.removeAttribute('data-active');
      b.setAttribute('data-active', '');
      return { left: Number(getComputedStyle(a, '::before').opacity), duration: getComputedStyle(b, '::before').transitionDuration };
    });
    expect(layers.left).toBe(0);
    expect(layers.duration).toBe('0.05s');
  });
});

test.describe('.ds-presence', () => {
  test('a toggle taken back mid-way continues from where it is', async ({ page }) => {
    await load(page);
    const supported = await page.evaluate(() => CSS.supports('transition-behavior: allow-discrete'));
    const values = await page.evaluate(() => {
      const note = document.getElementById('presence');
      const read = () => [Number(getComputedStyle(note).opacity), getComputedStyle(note).scale];
      note.hidden = false;
      const enter = note.getAnimations();
      enter.forEach((animation) => { animation.pause(); animation.currentTime = 60; });
      const mid = read();
      note.hidden = true;
      const leaving = read();
      // Engines that do not transition display (Firefox) hide it at once.
      const exits = getComputedStyle(note).display !== 'none' && note.getAnimations().length > 0;
      note.getAnimations().forEach((animation) => { animation.pause(); animation.currentTime = 40; });
      const out = read();
      note.hidden = false;
      const back = read();
      note.getAnimations().forEach((animation) => animation.play());
      return { animated: enter.length, exits, mid, leaving, out, back };
    });
    if (!supported) {
      expect(values.animated).toBe(0);
      return;
    }
    expect(values.animated).toBeGreaterThan(0);
    expect(values.mid[0]).toBeGreaterThan(0.05);
    expect(values.mid[0]).toBeLessThan(0.99);
    const scale = (value) => (value === 'none' ? 1 : parseFloat(value));
    if (values.exits) {
      expect(Math.abs(values.leaving[0] - values.mid[0])).toBeLessThan(0.05);
      expect(Math.abs(values.back[0] - values.out[0])).toBeLessThan(0.05);
      expect(Math.abs(scale(values.leaving[1]) - scale(values.mid[1]))).toBeLessThan(0.05);
      expect(Math.abs(scale(values.back[1]) - scale(values.out[1]))).toBeLessThan(0.05);
    } else {
      // The exit is the named fallback (instant): nothing to continue from.
      test.info().annotations.push({ type: 'path', description: 'no display transition: instant exit' });
      expect(values.out[0]).toBe(0);
    }
    await settle(page);
    expect(await page.evaluate(() => Number(getComputedStyle(document.getElementById('presence')).opacity))).toBe(1);
  });
});

test.describe('reveal from the trigger in both placements', () => {
  /**
   * Opens `popup` from `opener` through DS.overlay and reads its first
   * frame with every animation paused in the same task: the tracks, the
   * clip, the origin, the shadow and the side it was placed on.
   */
  function firstFrame(page, popup, opener) {
    return page.evaluate(([id, from]) => {
      const el = document.getElementById(id);
      const trigger = document.getElementById(from);
      trigger.focus();
      DS.overlay.open(el, { opener: trigger });
      const running = document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline));
      for (const animation of running) animation.pause();
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      const anchor = trigger.getBoundingClientRect();
      return {
        tracks: el.getAnimations().map((animation) => `${animation.transitionProperty} ${animation.effect.getTiming().duration}`).sort(),
        opacity: Number(style.opacity),
        scale: style.scale,
        clip: style.clipPath,
        originY: parseFloat(style.transformOrigin.split(' ')[1]),
        height: el.offsetHeight,
        shadow: style.boxShadow,
        above: box.top < anchor.top,
      };
    }, [popup, opener]);
  }

  /** The exit tracks that take time (scale and clip step once it is invisible). */
  function exitTracks(page, popup) {
    return page.evaluate((id) => {
      const el = document.getElementById(id);
      DS.overlay.close(el);
      return el.getAnimations().map((animation) => [animation.transitionProperty, animation.effect.getComputedTiming().duration])
        .filter(([, duration]) => duration > 0).map(([name, duration]) => `${name} ${duration}`).sort();
    }, popup);
  }

  for (const [label, popup, opener, side] of [
    ['menu below', 'menu', 'trigger', 'below'],
    ['menu above', 'low-menu', 'low-trigger', 'above'],
    ['combobox list below', 'combo-popup', 'combo-input', 'below'],
    ['combobox list above', 'low-combo-popup', 'low-combo-input', 'above'],
  ]) {
    test(`${label}: clip and scale from the trigger edge, the shadow from the first frame, an opacity-only exit`, async ({ page }) => {
      await load(page);
      const start = await firstFrame(page, popup, opener);
      expect(start.above, 'placement').toBe(side === 'above');
      expect(start.tracks).toEqual(['clip-path 250', 'opacity 150', 'scale 250']);
      expect(start.opacity).toBe(0);
      expect(start.scale).toBe('0.95');
      // Closed at the trigger edge; the other three edges keep 24px of room for the shadow.
      if (side === 'below') expect(start.clip).toMatch(/^inset\(-24px -24px 100%( -24px)?( round .*)?\)$/);
      else expect(start.clip).toMatch(/^inset\(100% -24px -24px( -24px)?( round .*)?\)$/);
      expect(start.originY).toBeCloseTo(side === 'below' ? 0 : start.height, 0);
      expect(start.shadow).not.toBe('none');
      await page.evaluate(() => document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline)).forEach((animation) => animation.finish()));
      await settle(page);
      expect(await exitTracks(page, popup)).toEqual(['opacity 100']);
      await closed(page, popup);
    });
  }

  test('the chevron turns to 180deg on the spring (rising to its peak, at most 5% past) and back to 0', async ({ page }) => {
    await load(page);
    const chevron = page.locator('#combo-toggle svg');
    const turn = async (action) => {
      await page.evaluate((act) => {
        const popup = document.getElementById('combo-popup');
        if (act === 'open') DS.overlay.open(popup, { opener: document.getElementById('combo-input') });
        else DS.overlay.close(popup);
        for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
      }, action);
      // Seeks the chevron's own transition only: a paused animation seeked past its end drops out of
      // getAnimations() with its promise pending, and the list's close would never end.
      const { duration, values } = await chevron.evaluate((el) => {
        const turning = el.getAnimations().find((animation) => animation.transitionProperty === 'rotate');
        const angles = [];
        for (let time = 0; time <= 250; time += 5) {
          turning.currentTime = time;
          const value = getComputedStyle(el).rotate;
          angles.push(value === 'none' ? 0 : parseFloat(value));
        }
        turning.currentTime = 0;
        return { duration: turning.effect.getTiming().duration, values: angles };
      });
      expect(duration, action).toBe(250);
      const peakAt = action === 'open' ? values.indexOf(Math.max(...values)) : values.indexOf(Math.min(...values));
      expectMonotonic(values.slice(0, peakAt + 1), { direction: action === 'open' ? 'up' : 'down' });
      expectPeakAtMost(values, 1.05, { from: action === 'open' ? 0 : 180, to: action === 'open' ? 180 : 0 });
      expectSettles(values, action === 'open' ? 180 : 0, 0.5);
      await page.evaluate(() => document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline)).forEach((animation) => animation.finish()));
      await settle(page);
    };
    await turn('open');
    await turn('close');
    await closed(page, 'combo-popup');
  });
});

/* ── 2.0: menu groups, headings, radio items, meta, type-ahead; select-only ── */

/** A menu with a heading, a group of radio items and items with a meta, at the end of the page's theme. */
function addSortMenu(page) {
  return page.evaluate(() => {
    const button = document.createElement('button');
    button.className = 'ds-btn';
    button.type = 'button';
    button.id = 'sort-trigger';
    button.textContent = 'Sort';
    button.setAttribute('aria-haspopup', 'menu');
    button.setAttribute('aria-expanded', 'false');
    document.querySelector('main, .fx-root, body').prepend(button);
    const menu = document.createElement('div');
    menu.className = 'ds-menu';
    menu.setAttribute('role', 'menu');
    menu.id = 'sort-menu';
    menu.hidden = true;
    const item = (id, label, role = 'menuitem', meta = '') => {
      const node = document.createElement('button');
      node.className = 'ds-menu__item';
      node.type = 'button';
      node.id = id;
      node.setAttribute('role', role);
      if (role !== 'menuitem') node.setAttribute('aria-checked', String(id === 'sort-name'));
      const text = document.createElement('span');
      text.className = 'ds-menu__label';
      text.textContent = label;
      node.append(text);
      if (meta) {
        const end = document.createElement('span');
        end.className = 'ds-menu__meta';
        end.textContent = meta;
        node.append(end);
      }
      return node;
    };
    const group = document.createElement('div');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-labelledby', 'sort-h');
    const heading = document.createElement('p');
    heading.className = 'ds-menu__heading';
    heading.id = 'sort-h';
    heading.textContent = 'Sort by';
    group.append(heading, item('sort-name', 'Name', 'menuitemradio'), item('sort-seen', 'Last seen', 'menuitemradio'), item('sort-load', 'Load', 'menuitemradio'));
    menu.append(group, item('sort-lock', 'Lock', 'menuitem', 'Ctrl L'), item('sort-list', 'List view', 'menuitemcheckbox', 'On'));
    (document.querySelector('.ds-theme') ?? document.body).append(menu);
    button.addEventListener('click', () => DS.overlay.open(menu, { opener: button }));
  });
}

test.describe('menu groups and type-ahead (2.0)', () => {
  test('the arrow keys pass the heading by; the heading is caption type and not focusable', async ({ page, browserName, dsFallback }) => {
    await load(page);
    await addSortMenu(page);
    await page.focus('#sort-trigger');
    await page.keyboard.press('Enter');
    await expect(page.locator('#sort-menu')).toHaveAttribute('data-state', 'open');
    expect(await focused(page)).toBe('sort-name');
    await page.keyboard.press('ArrowUp');
    expect(await focused(page), 'from the first item up wraps to the last, never the heading').toBe('sort-list');
    await page.keyboard.press('Home');
    expect(await focused(page)).toBe('sort-name');
    const heading = await page.evaluate(() => {
      const node = document.getElementById('sort-h');
      return { tabIndex: node.tabIndex, font: getComputedStyle(node).fontSize };
    });
    expect(heading).toEqual({ tabIndex: -1, font: '12px' });
    // The meta sits at the item's end (the item's padding from its edge).
    await settle(page);
    const meta = await page.evaluate(() => {
      const item = document.getElementById('sort-lock').getBoundingClientRect();
      const end = document.querySelector('#sort-lock .ds-menu__meta').getBoundingClientRect();
      return item.right - end.right;
    });
    expect(Math.abs(meta - 12)).toBeLessThan(1);
    // The settled menu (one engine, as baseline.spec.js does for its extra shots).
    if (browserName === 'chromium' && !dsFallback) {
      await page.mouse.move(1, 1);
      await expect.soft(page.locator('#sort-menu'), 'menu-groups.png').toHaveScreenshot('menu-groups.png', { animations: 'allow' });
    }
  });

  test('type-ahead moves to the next item whose label starts with the typed letters; one letter again cycles', async ({ page }) => {
    await load(page);
    await addSortMenu(page);
    await page.focus('#sort-trigger');
    await page.keyboard.press('Enter');
    await expect(page.locator('#sort-menu')).toHaveAttribute('data-state', 'open');
    await page.keyboard.press('l');
    expect(await focused(page)).toBe('sort-seen');
    await page.keyboard.press('o');
    expect(await focused(page), '"lo" leads to Load').toBe('sort-load');
    // After --ds-delay-tooltip the letters start again; "l" again cycles through the L items.
    const wait = await page.evaluate(() => DS.motion.motionDuration(document.getElementById('sort-menu'), '--ds-delay-tooltip'));
    await page.waitForTimeout(wait + 100);
    await page.keyboard.press('l');
    expect(await focused(page)).toBe('sort-lock');
    await page.keyboard.press('l');
    expect(await focused(page)).toBe('sort-list');
    // A letter no label starts with moves nothing.
    await page.waitForTimeout(wait + 100);
    await page.keyboard.press('z');
    expect(await focused(page)).toBe('sort-list');
    await page.keyboard.press('Escape');
    expect(await focused(page)).toBe('sort-trigger');
  });
});

test.describe('select-only combobox (2.0)', () => {
  test('a button field shows value and meta in one row; DS.overlay opens its list and keeps focus on the button; a blocked option shows no active layer', async ({ page, browserName, dsFallback }) => {
    await load(page);
    await page.evaluate(() => {
      const root = document.querySelector('.ds-theme') ?? document.body;
      const field = document.createElement('div');
      field.className = 'ds-field';
      field.style.maxWidth = '240px';
      field.innerHTML = '<span class="ds-field__label" id="plan-label">Plan</span>'
        + '<div class="ds-combo ds-combo--select" id="plan">'
        + '<button class="ds-input ds-combo__input" id="plan-button" type="button" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="plan-list" aria-labelledby="plan-label plan-value">'
        + '<span class="ds-combo__value" id="plan-value">Standard with a long name</span><span class="ds-combo__meta">4 devices</span></button>'
        + '<button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show plans"></button>'
        + '<div class="ds-combo__popup" id="plan-popup" hidden><ul class="ds-combo__list" id="plan-list" role="listbox" aria-labelledby="plan-label">'
        + '<li class="ds-combo__option" id="plan-a" role="option" aria-selected="true"><span class="ds-combo__name">Standard</span></li>'
        + '<li class="ds-combo__option" id="plan-b" role="option" aria-selected="false" aria-disabled="true" data-active><span class="ds-combo__name">Premium</span><span class="ds-combo__meta">Needs a contract</span></li>'
        + '</ul></div></div>';
      root.prepend(field);
    });
    const row = await page.evaluate(() => {
      const button = document.getElementById('plan-button').getBoundingClientRect();
      const value = document.getElementById('plan-value');
      const metaNode = document.querySelector('#plan-button .ds-combo__meta');
      const meta = metaNode.getBoundingClientRect();
      return {
        oneRow: Math.abs(value.getBoundingClientRect().top - meta.top) < 4,
        inside: meta.right <= button.right,
        // Too long for the field: the row ends in an ellipsis instead of growing.
        cut: [value, metaNode].some((node) => node.scrollWidth > node.clientWidth) && getComputedStyle(value).textOverflow === 'ellipsis',
        start: getComputedStyle(document.getElementById('plan-button')).textAlign,
      };
    });
    expect(row).toEqual({ oneRow: true, inside: true, cut: true, start: 'start' });
    await page.focus('#plan-button');
    await page.evaluate(() => DS.overlay.open(document.getElementById('plan-popup'), { opener: document.getElementById('plan-button') }));
    await settle(page);
    const open = await page.evaluate(() => {
      const option = document.getElementById('plan-b');
      return {
        expanded: document.getElementById('plan-button').getAttribute('aria-expanded'),
        focus: document.activeElement.id,
        layer: getComputedStyle(option, '::before').opacity,
        height: Math.round(document.getElementById('plan-a').getBoundingClientRect().height),
      };
    });
    expect(open).toEqual({ expanded: 'true', focus: 'plan-button', layer: '0', height: 48 });
    if (browserName === 'chromium' && !dsFallback) {
      await page.mouse.move(1, 1);
      const field = await page.locator('#plan').boundingBox();
      const list = await page.locator('#plan-popup').boundingBox();
      const clip = { x: field.x - 8, y: field.y - 8, width: Math.max(field.width, list.width) + 16, height: list.y + list.height - field.y + 16 };
      await expect.soft(page, 'combo-select.png').toHaveScreenshot('combo-select.png', { clip, animations: 'allow' });
    }
    await page.keyboard.press('Escape');
    await closed(page, 'plan-popup');
    expect(await focused(page)).toBe('plan-button');
  });
});
