/**
 * DS.overlay.toast() and DS.overlay.tooltips() (1.3.0) in real engines
 * (fixtures/toast-tooltip.html).
 *
 * Snackbars: never more than three on screen, the messages on screen start
 * their glide where they stood (no jump), the oldest message that would
 * close by itself is replaced and a fourth waits behind three that stay;
 * the timer pauses on hover, focus and a hidden tab; a focused message
 * that leaves hands focus on, never to <body>; the text reaches the
 * announcers (an old role="status" region loses the role and gets its own); an open side
 * sheet takes the region in and its messages glide on the sheet's timing;
 * over an open dialog (native, div) or sheet a new error is above the
 * scrim, announced and closes by its own button, and through the exit it
 * stays above the leaving scrim and panel (Chromium keeps a closing native
 * dialog in the top layer); a reopen during the exit keeps it inside.
 *
 * Tooltips: the delay, the entrance (fade and --ds-scale-tooltip at the
 * anchor side, below and above), a tooltip that the page places with an
 * inline transform is at its anchor from the first frames (the scale
 * composes), the trigger's own icon and the crossing
 * onto the tooltip keep it (also for a trigger inside a div side sheet or
 * the modal drawer, where the tooltip is never inert), Escape hides it
 * without closing the dialog
 * under it, Tab between triggers and the warm-up swap or show at once,
 * a warm swap marks the side the tooltip really sits on (data-placement),
 * aria-describedby only when it adds something, anchor positioning where
 * the engine has it and the script's placement elsewhere, page scroll.
 *
 * Motion is read with the animations paused in the task that starts them,
 * timers with margins far from their thresholds, so nothing depends on how
 * fast the machine is.
 */
import { test, expect } from './base-test.js';
import { ready, settle, focusByKeyboard } from './helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/toast-tooltip.html';

async function load(page, { width = 1280, speed } = {}) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(FIXTURE + (speed ? `?speed=${speed}` : ''));
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

/** The texts of the messages on screen (leaving ones excluded), oldest first. */
const shown = (page, id = 'toasts') => page.evaluate((name) => [...document.getElementById(name).querySelectorAll('.ds-toast:not([data-ds-leaving])')]
  .map((el) => el.querySelector('.ds-toast__text').textContent), id);

/** The id (or tag) of the focused element. */
const focused = (page) => page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);

/** The page's tooltip: what it shows and how. */
const tipState = (page) => page.evaluate(() => {
  const tip = document.querySelector('.ds-tooltip');
  const style = getComputedStyle(tip);
  return { text: tip.textContent, hidden: tip.hidden, state: tip.dataset.state, warm: tip.hasAttribute('data-warm'), opacity: Number(style.opacity) };
});

test.describe('snackbars', () => {
  test('five messages in a row: never more than three, the oldest that would close is replaced, nothing jumps', async ({ page }) => {
    await load(page);
    const runs = await page.evaluate(async () => {
      const region = document.getElementById('toasts');
      const results = [];
      for (let i = 1; i <= 5; i += 1) {
        // Where each message on screen stands before the call, and in the
        // first frame of the glide (paused in the same task).
        const before = new Map([...region.querySelectorAll('.ds-toast:not([data-ds-leaving])')].map((el) => [el, el.getBoundingClientRect().top]));
        DS.overlay.toast(region, `Message ${i}`, { persistent: i === 2 });
        // Read in the same task: the glides just started, their first frame is the old place.
        const jumps = [...before].filter(([el]) => el.isConnected && !el.hasAttribute('data-ds-leaving'))
          .map(([el, top]) => Math.abs(el.getBoundingClientRect().top - top));
        const count = region.querySelectorAll('.ds-toast:not([data-ds-leaving])').length;
        results.push({ count, jump: Math.max(0, ...jumps) });
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
      return results;
    });
    for (const [index, run] of runs.entries()) {
      expect(run.count, `after message ${index + 1}`).toBeLessThanOrEqual(3);
      // A jump would be a whole step (a message and the gap, 56px); the
      // glide's first moments may show a few px where the engine's clock
      // moves on within the task (WebKit).
      expect(run.jump, `message ${index + 1}: the others start where they stood`).toBeLessThanOrEqual(10);
    }
    await settle(page);
    // Message 2 stays (persistent); 1 and then 3 made room.
    expect(await shown(page)).toEqual(['Message 2', 'Message 4', 'Message 5']);
    expect(await page.locator('#toasts > .ds-toast').count()).toBe(3);
  });

  test('a fourth message waits behind three that stay and enters when one closes; close() drops a waiting one', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      const region = document.getElementById('toasts');
      window.fx = [1, 2, 3].map((i) => DS.overlay.toast(region, `Error ${i}`, { kind: 'error' }));
      window.fx.push(DS.overlay.toast(region, 'Waiting 1'), DS.overlay.toast(region, 'Waiting 2'));
    });
    await settle(page);
    expect(await shown(page)).toEqual(['Error 1', 'Error 2', 'Error 3']);
    expect(await page.evaluate(() => window.fx[3].el.isConnected)).toBe(false);
    // Dropped from the queue: its closed promise resolves, it never shows.
    await page.evaluate(() => window.fx[4].close());
    await page.evaluate(() => window.fx[4].closed);
    await page.locator('#toasts .ds-toast--error').nth(1).locator('.ds-toast__close').click();
    await settle(page);
    expect(await shown(page)).toEqual(['Error 1', 'Error 3', 'Waiting 1']);
    await page.evaluate(() => window.fx[1].closed);
  });

  test('the timer pauses on hover, on focus and on a hidden tab, and goes on with the time left', async ({ page }) => {
    await load(page);
    // A 1200ms timer, each pause held for 1600ms: a pause that did not take
    // would have closed the message by then.
    const make = (text, hide = false) => page.evaluate(([label, hidden]) => {
      const el = document.createElement('div');
      el.className = 'ds-toast';
      el.innerHTML = `<span class="ds-toast__text">${label}</span><button class="ds-btn ds-btn--quiet ds-btn--icon ds-toast__close" type="button" aria-label="Close">x</button>`;
      if (hidden) {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        document.dispatchEvent(new Event('visibilitychange'));
      }
      window.fxToast = DS.overlay.toast(document.getElementById('toasts'), el, { timeout: 1200 });
    }, [text, hide]);
    const present = () => page.evaluate(() => window.fxToast.el.isConnected && !window.fxToast.el.hasAttribute('data-ds-leaving'));

    // Hover.
    await make('Hovered');
    const box = await page.locator('#toasts .ds-toast').boundingBox();
    await page.mouse.move(box.x + 20, box.y + box.height / 2);
    await page.waitForTimeout(1600);
    expect(await present(), 'paused under the pointer').toBe(true);
    await page.mouse.move(1, 1);
    await page.waitForFunction(() => !window.fxToast.el.isConnected);

    // Focus.
    await make('Focused');
    await page.locator('#toasts .ds-toast__close').focus();
    await page.waitForTimeout(1600);
    expect(await present(), 'paused while focus is in the region').toBe(true);
    await page.locator('#after').focus();
    await page.waitForFunction(() => !window.fxToast.el.isConnected);

    // A hidden tab (from before the message came).
    await make('Hidden', true);
    await page.waitForTimeout(1600);
    expect(await present(), 'paused while the tab is hidden').toBe(true);
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForFunction(() => !window.fxToast.el.isConnected);
  });

  test('a length-dependent timeout: errors, persistent and action messages never close by themselves', async ({ page }) => {
    await load(page);
    const kept = await page.evaluate(async () => {
      const region = document.getElementById('toasts');
      const action = document.createElement('div');
      action.className = 'ds-toast';
      action.innerHTML = '<span class="ds-toast__text">Archived.</span><button class="ds-btn ds-btn--text" type="button">Undo</button>';
      const list = [
        DS.overlay.toast(region, 'Could not save.', { kind: 'error', timeout: 100 }),
        DS.overlay.toast(region, 'Export ready.', { persistent: true, timeout: 100 }),
        DS.overlay.toast(region, action, { timeout: 100 }),
      ];
      await new Promise((resolve) => setTimeout(resolve, 700));
      return list.map((entry) => entry.el.isConnected);
    });
    expect(kept).toEqual([true, true, true]);
    // The error and the persistent message got a close button, the plain one none.
    expect(await page.locator('#toasts .ds-toast__close').count()).toBe(2);
  });

  test('closing a focused message moves focus to the next close button, then back to where it came from, never to <body>', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      const region = document.getElementById('toasts');
      for (const text of ['One', 'Two', 'Three']) DS.overlay.toast(region, `Could not save ${text}.`, { kind: 'error' });
    });
    await settle(page);
    // Into the region from #after.
    const closes = page.locator('#toasts .ds-toast__close');
    await page.locator('#after').focus();
    await closes.nth(1).focus();
    await page.keyboard.press('Enter');
    // In the same task as the close: the next message's close button.
    expect(await page.evaluate(() => document.activeElement.closest('.ds-toast')?.textContent)).toBe('Could not save Three.');
    await settle(page);
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => document.activeElement.closest('.ds-toast')?.textContent)).toBe('Could not save One.');
    await settle(page);
    await page.keyboard.press('Enter');
    await settle(page);
    expect(await focused(page), 'back where focus came from').toBe('after');

    // Where focus came from is gone: the view (tabindex="-1").
    await page.evaluate(() => DS.overlay.toast(document.getElementById('toasts'), 'Could not sync.', { kind: 'error' }));
    await settle(page);
    await page.locator('#before').focus();
    await page.locator('#toasts .ds-toast__close').focus();
    await page.evaluate(() => document.getElementById('before').remove());
    await page.keyboard.press('Enter');
    await settle(page);
    expect(await focused(page)).toBe('page');
  });

  test('the text reaches the polite and assertive announcers, again for the same text; an old role="status" region loses it and gets its own', async ({ page }) => {
    await load(page);
    const said = await page.evaluate(async () => {
      const region = document.getElementById('toasts');
      const frame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const record = [];
      DS.overlay.toast(region, 'Saved.');
      DS.overlay.toast(region, 'Could not save.', { kind: 'error' });
      const polite = region.parentNode.querySelector('.ds-sr[aria-live="polite"]');
      const assertive = region.parentNode.querySelector('.ds-sr[aria-live="assertive"]');
      new MutationObserver(() => record.push(polite.textContent)).observe(polite, { childList: true, characterData: true, subtree: true });
      await frame();
      const first = [polite.textContent, assertive.textContent];
      DS.overlay.toast(region, 'Saved.');
      await frame();
      return {
        first,
        again: record,
        next: [polite.previousElementSibling === region, assertive.previousElementSibling === polite],
        live: [...region.querySelectorAll('[role], [aria-live]')].length,
      };
    });
    expect(said.first).toEqual(['Saved.', 'Could not save.']);
    expect(said.again.at(-2), 'cleared first').toBe('');
    expect(said.again.at(-1), 'then said again').toBe('Saved.');
    expect(said.next).toEqual([true, true]);
    expect(said.live, 'the messages are not live').toBe(0);

    // 2.0 (R11): the old markup is stripped once and announced by its own pair, never twice.
    const old = await page.evaluate(async () => {
      const frame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const region = document.getElementById('old-markup');
      const entry = DS.overlay.toast(region, 'Could not sync.', { kind: 'error' });
      await frame();
      const polite = region.nextElementSibling;
      const assertive = polite?.nextElementSibling;
      return {
        role: region.getAttribute('role'),
        live: region.getAttribute('aria-live'),
        message: entry.el.getAttribute('role'),
        announcers: region.parentNode.querySelectorAll(':scope > .ds-sr[aria-live]').length,
        next: [polite?.getAttribute('aria-live'), assertive?.getAttribute('aria-live')],
        said: assertive?.textContent,
      };
    });
    // Two of #toasts and two of #old-markup.
    expect(old).toEqual({ role: null, live: null, message: null, announcers: 4, next: ['polite', 'assertive'], said: 'Could not sync.' });
  });

  test('a re-render of the region\'s parent keeps the announcers and the tooltip, and never writes a message into the page', async ({ page }) => {
    // 1.6.2: both are data-ds-keep runtime nodes. Before, morphHtml() patched
    // the polite announcer into the next page element and removed the tooltip.
    await load(page);
    const after = await page.evaluate(async () => {
      const frame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const markup = (note) => `<p>Devices</p><div class="ds-toasts" id="m-toasts"></div><div class="m-note">${note}</div>`
        + '<button class="ds-btn" type="button" data-tip="Refresh the list" id="m-tip">Refresh</button>';
      const theme = document.createElement('div');
      theme.className = 'ds-theme';
      theme.id = 'm-theme';
      document.body.append(theme);
      DS.dom.morphHtml(theme, markup('Note A'));
      const tips = DS.overlay.tooltips(theme);
      const tip = theme.querySelector(':scope > .ds-tooltip');
      DS.overlay.toast(theme.querySelector('#m-toasts'), 'One', { persistent: true });
      await frame();
      DS.dom.morphHtml(theme, markup('Note B'));
      DS.overlay.toast(theme.querySelector('#m-toasts'), 'Two', { persistent: true });
      await frame();
      const result = {
        note: theme.querySelector('.m-note').textContent,
        children: [...theme.children].map((el) => el.classList[0] || el.tagName),
        polite: theme.querySelector('.ds-sr[aria-live="polite"]')?.textContent,
        announcers: theme.querySelectorAll(':scope > .ds-sr[aria-live]').length,
        tip: Boolean(tip?.isConnected) && tip.parentNode === theme,
      };
      tips.destroy();
      theme.remove();
      return result;
    });
    expect(after).toEqual({
      note: 'Note B',
      children: ['P', 'ds-toasts', 'ds-sr', 'ds-sr', 'm-note', 'ds-btn', 'ds-tooltip'],
      polite: 'Two',
      announcers: 2,
      tip: true,
    });
  });

  test('an open side sheet takes the region in; its messages glide with the panel and come back with it', async ({ page }) => {
    await load(page);
    await page.evaluate(() => DS.overlay.toast(document.getElementById('toasts'), 'Could not save.', { kind: 'error' }));
    await settle(page);
    const home = await page.locator('#toasts').boundingBox();
    const opened = await page.evaluate(() => {
      document.getElementById('open-sheet').click();
      const region = document.getElementById('toasts');
      const glide = region.getAnimations().filter((animation) => animation.transitionProperty === 'translate');
      glide.forEach((animation) => animation.pause());
      const timing = glide.map((animation) => ({ duration: animation.effect.getTiming().duration, easing: animation.effect.getTiming().easing }));
      const start = region.getBoundingClientRect().left;
      glide.forEach((animation) => animation.play());
      // The panel's own slide: the same curve as computed by this engine.
      const panel = document.querySelector('#sheet .ds-sheet__panel').getAnimations().find((animation) => animation.transitionProperty === 'translate');
      return { inSheet: region.parentNode.id, follow: region.dataset.follow, timing, start, sheetEase: panel.effect.getTiming().easing };
    });
    expect(opened.inSheet).toBe('sheet');
    expect(opened.follow).toBe('enter');
    expect(opened.timing).toHaveLength(1);
    expect(opened.timing[0].duration).toBe(450);
    expect(opened.timing[0].easing).toBe(opened.sheetEase);
    expect(Math.abs(opened.start - home.x), 'starts where it stood').toBeLessThan(1);
    await settle(page);
    const rest = await page.evaluate(() => {
      const panel = document.querySelector('#sheet .ds-sheet__panel').getBoundingClientRect();
      return { left: document.getElementById('toasts').getBoundingClientRect().left, panel: panel.left, follow: document.getElementById('toasts').dataset.follow ?? null };
    });
    expect(rest.left).toBeCloseTo(rest.panel + 24, 0);
    expect(rest.follow).toBeNull();
    // The message is usable inside the open sheet: nothing around it is inert, and its close button is on top.
    expect(await page.evaluate(() => {
      const region = document.getElementById('toasts');
      const close = region.querySelector('.ds-toast__close').getBoundingClientRect();
      const hit = document.elementFromPoint(close.left + close.width / 2, close.top + close.height / 2);
      return {
        inert: region.closest('[inert]') !== null,
        announcers: [...region.parentNode.querySelectorAll(':scope > .ds-sr[aria-live]')].map((node) => node.closest('[inert]') === null),
        onClose: hit?.closest('.ds-toast__close') !== null,
      };
    })).toEqual({ inert: false, announcers: [true, true], onClose: true });

    const closing = await page.evaluate(() => {
      document.getElementById('sheet-close').click();
      const region = document.getElementById('toasts');
      const glide = region.getAnimations().filter((animation) => animation.transitionProperty === 'translate');
      return { parent: region.parentNode.id, follow: region.dataset.follow, timing: glide.map((animation) => animation.effect.getTiming().duration) };
    });
    // It glides back inside the leaving sheet (above its scrim and panel) and returns to the page once it settled.
    expect(closing).toEqual({ parent: 'sheet', follow: 'exit', timing: [200] });
    await settle(page);
    const back = await page.locator('#toasts').boundingBox();
    expect(back.x).toBeCloseTo(home.x, 0);
    expect(await page.evaluate(() => document.getElementById('toasts').parentNode.id)).toBe('theme');
    expect(await page.evaluate(() => document.getElementById('toasts').style.getPropertyValue('--ds-toast-left'))).toBe('');
  });
});

test.describe('snackbars over a modal', () => {
  test('while a dialog or side sheet is open (native and div), a new error is above its scrim, announced, and its close button closes only it', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      const dialog = document.createElement('div');
      dialog.className = 'ds-dialog';
      dialog.id = 'fx-dialog';
      dialog.hidden = true;
      dialog.innerHTML = '<div class="ds-dialog__backdrop" data-close></div><div class="ds-dialog__box" role="alertdialog" aria-modal="true" aria-label="Save"><button class="ds-btn ds-btn--text" type="button" data-close>Cancel</button></div>';
      document.getElementById('theme').append(dialog);
    });
    for (const id of ['native', 'fx-dialog', 'sheet']) {
      await page.evaluate((name) => DS.overlay.open(document.getElementById(name), { opener: document.getElementById('before') }), id);
      await settle(page);
      await page.evaluate(() => DS.overlay.toast(document.getElementById('toasts'), 'Could not save.', { kind: 'error' }));
      await settle(page);
      const inside = await page.evaluate((name) => {
        const region = document.getElementById('toasts');
        const close = region.querySelector('.ds-toast__close').getBoundingClientRect();
        const hit = document.elementFromPoint(close.left + close.width / 2, close.top + close.height / 2);
        const announcers = [...region.parentNode.querySelectorAll(':scope > .ds-sr[aria-live]')];
        return {
          host: region.parentNode.id,
          inert: region.closest('[inert]') !== null,
          announcers: announcers.map((node) => node.closest('[inert]') === null),
          said: announcers.find((node) => node.getAttribute('aria-live') === 'assertive')?.textContent,
          onClose: hit?.closest('.ds-toast__close') !== null,
        };
      }, id);
      expect(inside, id).toEqual({ host: id, inert: false, announcers: [true, true], said: 'Could not save.', onClose: true });
      await page.locator('#toasts .ds-toast__close').click();
      await expect(page.locator('#toasts .ds-toast'), id).toHaveCount(0);
      expect(await page.evaluate((name) => document.getElementById(name).dataset.state, id), `${id} stays open`).toBe('open');
      await page.evaluate((name) => DS.overlay.close(document.getElementById(name)), id);
      await page.waitForFunction((name) => !document.getElementById(name).hasAttribute('data-state'), id);
      expect(await page.evaluate(() => {
        const region = document.getElementById('toasts');
        return { parent: region.parentNode.id, left: region.style.getPropertyValue('--ds-toast-left'), inert: document.querySelectorAll('[inert]').length };
      }), id).toEqual({ parent: 'theme', left: '', inert: 0 });
    }
  });
});

test.describe('snackbars over a closing modal', () => {
  test('through the exit of a dialog or side sheet (native and div) a message stays on top of its scrim and panel', async ({ page }) => {
    await load(page);
    await page.evaluate(() => {
      // A native side sheet: Chromium keeps it in the top layer through its exit.
      const sheet = document.createElement('dialog');
      sheet.className = 'ds-sheet';
      sheet.id = 'fx-native-sheet';
      sheet.setAttribute('aria-label', 'Details');
      sheet.innerHTML = '<div class="ds-sheet__backdrop" data-close></div><section class="ds-sheet__panel"><div class="ds-sheet__body" tabindex="0"><p>Synced nightly.</p></div></section>';
      document.getElementById('theme').append(sheet);
    });
    for (const id of ['native', 'fx-native-sheet', 'sheet']) {
      await page.evaluate((name) => DS.overlay.open(document.getElementById(name), { opener: document.getElementById('before') }), id);
      await settle(page);
      await page.evaluate(() => DS.overlay.toast(document.getElementById('toasts'), 'Could not save.', { kind: 'error' }));
      await settle(page);
      const during = await page.evaluate((name) => {
        const el = document.getElementById(name);
        DS.overlay.close(el);
        const animations = document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline));
        animations.forEach((animation) => animation.pause());
        return [0.3, 0.4, 0.5].map((progress) => {
          for (const animation of animations) {
            const timing = animation.effect.getComputedTiming();
            animation.currentTime = (animation.effect.getTiming().delay || 0) + progress * Number(timing.duration);
          }
          const toast = document.querySelector('#toasts .ds-toast').getBoundingClientRect();
          const [top] = document.elementsFromPoint(toast.left + toast.width / 2, toast.top + toast.height / 2);
          return { progress, top: top?.closest('.ds-toast') ? 'toast' : `${top?.className}` };
        });
      }, id);
      expect(during, id).toEqual([0.3, 0.4, 0.5].map((progress) => ({ progress, top: 'toast' })));
      await page.evaluate(() => document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline)).forEach((animation) => animation.finish()));
      await page.waitForFunction((name) => !document.getElementById(name).hasAttribute('data-state'), id);
      expect(await page.evaluate(() => document.getElementById('toasts').parentNode.id), id).toBe('theme');
      await page.locator('#toasts .ds-toast__close').click();
      await expect(page.locator('#toasts .ds-toast'), id).toHaveCount(0);
    }
  });

  test('reopened during the exit, the region stays inside and glides back to the panel; the next close gives it back', async ({ page }) => {
    await load(page);
    await page.evaluate(() => DS.overlay.toast(document.getElementById('toasts'), 'Could not save.', { kind: 'error' }));
    await settle(page);
    await page.evaluate(() => DS.overlay.open(document.getElementById('sheet'), { opener: document.getElementById('before') }));
    await settle(page);
    const reopened = await page.evaluate(() => {
      const sheet = document.getElementById('sheet');
      const region = document.getElementById('toasts');
      DS.overlay.close(sheet);
      // Halfway through the exit glide.
      for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) {
        animation.pause();
        animation.currentTime = (animation.effect.getTiming().delay || 0) + 0.5 * Number(animation.effect.getComputedTiming().duration);
      }
      const mid = region.getBoundingClientRect().left;
      DS.overlay.open(sheet, { opener: document.getElementById('before') });
      const glide = region.getAnimations().filter((animation) => animation.transitionProperty === 'translate');
      glide.forEach((animation) => animation.pause());
      const start = region.getBoundingClientRect().left;
      document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline)).forEach((animation) => animation.play());
      return { parent: region.parentNode.id, follow: region.dataset.follow, jump: Math.abs(start - mid) < 1 };
    });
    expect(reopened).toEqual({ parent: 'sheet', follow: 'enter', jump: true });
    await settle(page);
    const rest = await page.evaluate(() => ({
      left: document.getElementById('toasts').getBoundingClientRect().left,
      panel: document.querySelector('#sheet .ds-sheet__panel').getBoundingClientRect().left,
    }));
    expect(rest.left).toBeCloseTo(rest.panel + 24, 0);
    await page.evaluate(() => DS.overlay.close(document.getElementById('sheet')));
    await page.waitForFunction(() => !document.getElementById('sheet').hasAttribute('data-state'));
    expect(await page.evaluate(() => {
      const region = document.getElementById('toasts');
      return { parent: region.parentNode.id, left: region.style.getPropertyValue('--ds-toast-left') };
    })).toEqual({ parent: 'theme', left: '' });
  });
});

test.describe('tooltips', () => {
  test('shows after the delay, not before; the trigger is described only when the tip adds to its name', async ({ page }) => {
    await load(page);
    const button = await page.locator('#tip-download').boundingBox();
    await page.mouse.move(button.x + 3, button.y + button.height / 2);
    await page.waitForTimeout(150);
    expect((await tipState(page)).hidden, 'not within the delay').toBe(true);
    await page.waitForFunction(() => document.querySelector('.ds-tooltip').dataset.state === 'open');
    await settle(page);
    expect(await tipState(page)).toEqual({ text: 'Download as CSV', hidden: false, state: 'open', warm: false, opacity: 1 });
    const id = await page.evaluate(() => document.querySelector('.ds-tooltip').id);
    expect(await page.locator('#tip-download').getAttribute('aria-describedby')).toBe(id);
    // Copy link: the tip is its name; nothing to describe.
    await page.mouse.move(1, 1);
    await settle(page);
    expect(await page.locator('#tip-download').getAttribute('aria-describedby')).toBeNull();
    await page.waitForTimeout(400);
    const copy = await page.locator('#tip-copy').boundingBox();
    await page.mouse.move(copy.x + 3, copy.y + copy.height / 2);
    await page.waitForFunction(() => document.querySelector('.ds-tooltip').dataset.state === 'open');
    expect(await page.locator('#tip-copy').getAttribute('aria-describedby')).toBeNull();
  });

  test('fades in and grows from --ds-scale-tooltip at the anchor side, below and above the trigger; leaves with a fade only', async ({ page }) => {
    await load(page);
    for (const [id, side] of [['#tip-download', 'below'], ['#tip-bottom', 'above']]) {
      await page.evaluate(() => document.getElementById('before').focus());
      await focusByKeyboard(page, page.locator(id));
      const entrance = await page.evaluate((selector) => {
        // Shown in the focusin of the Tab: restart it paused, from its closed state.
        const tip = document.querySelector('.ds-tooltip');
        const trigger = document.querySelector(selector);
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
        for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.finish();
        trigger.blur();
        // Past the warm-up window, so the next show is a cold one.
        return new Promise((resolve) => setTimeout(() => {
          trigger.focus();
          void getComputedStyle(tip).opacity;
          const animations = tip.getAnimations();
          animations.forEach((animation) => { animation.pause(); animation.currentTime = 0; });
          const style = getComputedStyle(tip);
          const box = tip.getBoundingClientRect();
          const anchor = trigger.getBoundingClientRect();
          resolve({
            tracks: animations.map((animation) => `${animation.transitionProperty} ${animation.effect.getTiming().duration}`).sort(),
            opacity: Number(style.opacity),
            scale: style.scale,
            origin: style.transformOrigin.split(' ').map(parseFloat),
            height: tip.offsetHeight,
            width: tip.offsetWidth,
            above: box.bottom <= anchor.top + 1,
            centre: Math.abs((box.left + box.right) / 2 - (anchor.left + anchor.right) / 2),
            // Measured at rest size: the left edge, clamped 8px from the viewport.
            left: box.left - parseFloat(style.transformOrigin) * (1 - Number(style.scale)),
            state: tip.dataset.state,
          });
        }, 400));
      }, id);
      expect(entrance.state, id).toBe('open');
      expect(entrance.tracks, id).toEqual(['opacity 150', 'scale 250']);
      expect(entrance.opacity, id).toBe(0);
      expect(Number(entrance.scale), id).toBeCloseTo(0.9, 5);
      expect(entrance.above, id).toBe(side === 'above');
      // The origin sits on the trigger's side of the tooltip, on its centre line.
      expect(entrance.origin[1], id).toBeCloseTo(side === 'above' ? entrance.height : 0, 0);
      // Centred on the trigger, unless that would take it closer than 8px to the viewport edge.
      if (entrance.left > 8.5) expect(entrance.centre, id).toBeLessThan(1.5);
      else expect(entrance.left, id).toBeCloseTo(8, 0);
      await page.evaluate(() => document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline)).forEach((animation) => animation.finish()));
      // The exit: opacity only, in --ds-dur-instant; the scale waits until it is invisible.
      const exit = await page.evaluate(() => {
        const tip = document.querySelector('.ds-tooltip');
        const before = tip.dataset.state;
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
        void getComputedStyle(tip).opacity;
        const animations = tip.getAnimations();
        animations.forEach((animation) => animation.pause());
        return [`was ${before}`, ...animations.map((animation) => `${animation.transitionProperty} ${animation.effect.getTiming().duration} after ${animation.effect.getTiming().delay}`).sort()];
      });
      expect(exit, id).toEqual(['was open', 'opacity 100 after 0', 'scale 0 after 100']);
      await page.evaluate(() => document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline)).forEach((animation) => animation.finish()));
      await settle(page);
    }
  });

  test('placed by a page with an inline transform, it is already at its anchor at 10% of the entrance (keyframes and data-state)', async ({ page }) => {
    await load(page);
    for (const path of ['keyframes', 'data-state']) {
      const frame = await page.evaluate((mode) => {
        const trigger = document.getElementById('tip-download').getBoundingClientRect();
        const tip = document.createElement('div');
        tip.className = 'ds-tooltip';
        tip.setAttribute('role', 'tooltip');
        tip.textContent = 'Placed by the page';
        tip.hidden = true;
        document.getElementById('theme').append(tip);
        // The old recipe: top/left at 0 and a transform to the place under the trigger, with the
        // origin set with it (docs: the scale composes after the transform, about that origin).
        tip.hidden = false;
        const width = tip.offsetWidth;
        const x = Math.round(trigger.left + trigger.width / 2 - width / 2);
        const y = Math.round(trigger.bottom + 8);
        tip.style.cssText = `left: 0; top: 0; transform: translate(${x}px, ${y}px); transform-origin: ${x + width / 2}px ${y}px`;
        if (mode === 'data-state') {
          tip.setAttribute('data-state', 'closed');
          void getComputedStyle(tip).opacity;
          tip.setAttribute('data-state', 'open');
        } else {
          tip.hidden = true;
          void getComputedStyle(tip).display;
          tip.hidden = false;
        }
        const running = tip.getAnimations();
        for (const animation of running) {
          animation.pause();
          animation.currentTime = 0.1 * Number(animation.effect.getComputedTiming().duration);
        }
        const box = tip.getBoundingClientRect();
        const result = { count: running.length, centre: (box.left + box.right) / 2 - (x + width / 2), top: box.top - y, opacity: Number(getComputedStyle(tip).opacity) };
        tip.remove();
        return result;
      }, path);
      expect(frame.count, path).toBeGreaterThan(0);
      expect(frame.opacity, `${path}: the entrance is under way`).toBeLessThan(1);
      expect(Math.abs(frame.centre), `${path}: centred on the trigger`).toBeLessThan(1);
      expect(Math.abs(frame.top), `${path}: at the gap under the trigger, not flying in`).toBeLessThan(1);
    }
  });

  test('moving onto the trigger\'s icon and across the gap onto the tooltip keeps it (hoverable)', async ({ page }) => {
    await load(page);
    const button = await page.locator('#tip-settings').boundingBox();
    await page.mouse.move(button.x + 3, button.y + button.height / 2);
    await page.waitForFunction(() => document.querySelector('.ds-tooltip').dataset.state === 'open');
    await settle(page);
    await page.mouse.move(button.x + button.width / 2, button.y + button.height / 2);
    await page.waitForTimeout(300);
    expect((await tipState(page)).state, 'on the icon').toBe('open');
    // Out of the trigger into the gap, and 50ms later (inside the 100ms
    // grace) onto the tooltip: the events a crossing pointer sends, timed
    // in the page so the test machine's speed does not matter.
    await page.evaluate(() => new Promise((resolve) => {
      const trigger = document.getElementById('tip-settings');
      const tip = document.querySelector('.ds-tooltip');
      trigger.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, pointerType: 'mouse', relatedTarget: document.body }));
      setTimeout(() => {
        tip.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse', relatedTarget: document.body }));
        resolve();
      }, 50);
    }));
    await page.waitForTimeout(300);
    expect((await tipState(page)).state, 'on the tooltip').toBe('open');
    // Off the tooltip: it goes after the grace.
    await page.evaluate(() => document.querySelector('.ds-tooltip').dispatchEvent(new PointerEvent('pointerout', { bubbles: true, pointerType: 'mouse', relatedTarget: document.body })));
    await page.waitForFunction(() => document.querySelector('.ds-tooltip').hidden);
  });

  test('a trigger inside a div side sheet or the modal drawer shows a tooltip that is not inert and keeps it when the pointer crosses onto it', async ({ page }) => {
    for (const [width, overlay] of [[1280, 'sheet'], [800, 'drawer']]) {
      await load(page, { width });
      await page.evaluate((kind) => {
        const trigger = document.createElement('button');
        trigger.className = 'ds-btn ds-btn--quiet ds-btn--icon';
        trigger.type = 'button';
        trigger.id = 'tip-inside';
        trigger.setAttribute('aria-label', 'Pin');
        trigger.setAttribute('data-tip', 'Pin to the top of the list');
        trigger.textContent = 'P';
        if (kind === 'sheet') {
          // After the close button, which takes the focus: the pointer alone holds the tooltip.
          document.querySelector('#sheet .ds-sheet__head').append(trigger);
        } else {
          // The modal drawer as the app frame has it, next to the page.
          const app = document.createElement('div');
          app.className = 'ds-app ds-app--drawer';
          app.id = 'app';
          app.innerHTML = '<div class="ds-scrim" id="scrim"></div><nav class="ds-drawer" id="drawer" aria-label="Main" tabindex="-1"></nav>';
          app.querySelector('.ds-drawer').append(trigger);
          document.getElementById('theme').prepend(app);
        }
        DS.overlay.open(document.getElementById(kind), kind === 'sheet' ? { opener: document.getElementById('open-sheet') } : {});
      }, overlay);
      await settle(page);
      expect(await focused(page), overlay).not.toBe('tip-inside');
      const button = await page.locator('#tip-inside').boundingBox();
      await page.mouse.move(button.x + button.width / 2, button.y + button.height / 2);
      await page.waitForFunction(() => document.querySelector('.ds-tooltip').dataset.state === 'open');
      await settle(page);
      const where = await page.evaluate(() => {
        const tip = document.querySelector('.ds-tooltip');
        return { inert: tip.inert || Boolean(tip.closest('[inert]')), text: tip.textContent };
      });
      expect(where, overlay).toEqual({ inert: false, text: 'Pin to the top of the list' });
      // A real pointer crossing onto the tooltip: an inert one would let it
      // through to the page behind, and the tooltip would hide.
      const box = await page.locator('.ds-tooltip').boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(400);
      expect((await tipState(page)).state, `${overlay}: on the tooltip`).toBe('open');
      expect(await page.evaluate(() => document.elementFromPoint(...(() => {
        const rect = document.querySelector('.ds-tooltip').getBoundingClientRect();
        return [rect.left + rect.width / 2, rect.top + rect.height / 2];
      })()).closest('.ds-tooltip') !== null), `${overlay}: the tooltip takes the pointer`).toBe(true);
      // Off it: it goes after the grace.
      await page.mouse.move(button.x + button.width / 2, Math.min(790, box.y + box.height + 120));
      await page.waitForFunction(() => document.querySelector('.ds-tooltip').hidden);
      await page.evaluate((kind) => DS.overlay.close(document.getElementById(kind)), overlay);
      await settle(page);
      expect(await page.evaluate(() => document.querySelectorAll('[inert]').length), `${overlay}: nothing stays inert`).toBe(0);
    }
  });

  test('Escape hides the tooltip in a dialog without closing the dialog; the next Escape closes it', async ({ page }) => {
    await load(page);
    await page.locator('#open-native').click();
    await settle(page);
    expect(await focused(page)).toBe('native-cancel');
    await page.keyboard.press('Shift+Tab');
    expect(await focused(page)).toBe('tip-dialog');
    let state = await tipState(page);
    expect(state.state).toBe('open');
    expect(await page.evaluate(() => document.querySelector('.ds-tooltip').closest('dialog')?.id ?? null), 'inside the dialog (not under the top layer)').toBe('native');
    await settle(page);
    await page.keyboard.press('Escape');
    state = await tipState(page);
    expect(state.state).toBe('closed');
    expect(await page.evaluate(() => document.getElementById('native').open)).toBe(true);
    await settle(page);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.getElementById('native').open && !document.getElementById('native').hasAttribute('data-state'));
    expect(await focused(page)).toBe('open-native');
  });

  test('Tab from one trigger to the next keeps it shown and swaps in place without a new entrance', async ({ page }) => {
    await load(page);
    await focusByKeyboard(page, page.locator('#tip-archive'));
    await settle(page);
    expect((await tipState(page)).text).toBe('Archive');
    // Every frame from before the Tab until well past the hide grace.
    const watching = page.evaluate(() => new Promise((resolve) => {
      const tip = document.querySelector('.ds-tooltip');
      const seen = [];
      const start = performance.now();
      const frame = (now) => {
        const style = getComputedStyle(tip);
        seen.push({ text: tip.textContent, shown: !tip.hidden && Number(style.opacity) > 0.99 && style.scale === 'none' });
        if (now - start < 600) requestAnimationFrame(frame);
        else resolve(seen);
      };
      requestAnimationFrame(frame);
    }));
    await page.keyboard.press('Tab');
    const seen = await watching;
    expect(await focused(page)).toBe('tip-settings');
    expect(seen.at(-1).text).toBe('Settings');
    expect(seen.every((entry) => entry.shown), 'shown at full size and opacity in every frame').toBe(true);
  });

  test('the warm-up: the next trigger along the toolbar shows at once, a hidden tooltip only fades in', async ({ page }) => {
    await load(page);
    const copy = await page.locator('#tip-copy').boundingBox();
    await page.mouse.move(copy.x + 3, copy.y + copy.height / 2);
    await page.waitForFunction(() => document.querySelector('.ds-tooltip').dataset.state === 'open');
    await settle(page);
    // Straight to the next button: shown at once, in place.
    const download = await page.locator('#tip-download').boundingBox();
    await page.mouse.move(download.x + download.width / 2, download.y + 3);
    expect(await tipState(page)).toMatchObject({ text: 'Download as CSV', state: 'open', hidden: false });
    await settle(page);
    // Off the toolbar until the tooltip is hidden, then onto a third
    // button in the same task (well inside the 300ms skip window): it
    // shows at once, warm, and only fades in.
    const warm = await page.evaluate(() => new Promise((resolve) => {
      const tip = document.querySelector('.ds-tooltip');
      const from = document.getElementById('tip-download');
      const next = document.getElementById('tip-archive');
      from.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, pointerType: 'mouse', relatedTarget: document.body }));
      const wait = () => {
        if (!tip.hidden) {
          requestAnimationFrame(wait);
          return;
        }
        next.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse', relatedTarget: document.body }));
        const animations = tip.getAnimations();
        animations.forEach((animation) => animation.pause());
        resolve({ state: tip.dataset.state, warm: tip.hasAttribute('data-warm'), text: tip.textContent, tracks: animations.map((animation) => animation.transitionProperty), scale: getComputedStyle(tip).scale });
      };
      wait();
    }));
    expect(warm).toEqual({ state: 'open', warm: true, text: 'Archive', tracks: ['opacity'], scale: 'none' });
  });

  test('a warm swap marks the side the tooltip really sits on, also coming from a trigger in a scrolled box', async ({ page }) => {
    await load(page);
    // A trigger inside a scrolled box and one lower down on the page. Chromium lays the swap out from the scrolled
    // box to the other trigger with the box's scroll still applied (the anchor's scroll offset is taken in the next
    // rendering update): a side read in that task said "top" for a tooltip that then sits below.
    await page.evaluate(() => {
      const box = document.createElement('div');
      box.id = 'tip-scroller';
      box.style.cssText = 'position: fixed; left: 600px; top: 200px; width: 300px; height: 300px; overflow: auto;';
      box.innerHTML = '<div style="height: 400px"></div><button class="ds-btn" type="button" id="tip-scrolled" data-tip="Inside a scrolled box">Scrolled</button><div style="height: 800px"></div>';
      const lower = document.createElement('button');
      lower.className = 'ds-btn';
      lower.type = 'button';
      lower.id = 'tip-lower';
      lower.textContent = 'Lower';
      lower.setAttribute('data-tip', 'A trigger lower down');
      lower.style.cssText = 'position: fixed; left: 300px; top: 400px;';
      document.getElementById('page').append(box, lower);
      box.scrollTop = 300;
    });
    const hover = async (id) => {
      const to = await page.locator(id).boundingBox();
      await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2);
    };
    await hover('#tip-scrolled');
    await page.waitForFunction(() => document.querySelector('.ds-tooltip').dataset.state === 'open');
    await settle(page);
    for (const [from, to, side] of [[null, '#tip-lower', 'below'], ['#tip-scrolled', '#tip-download', 'below'], ['#tip-scrolled', '#tip-bottom', 'above']]) {
      if (from) {
        await hover(from);
        await settle(page);
      }
      await hover(to);
      // Read once two frames have rendered after the swap (the place is settled by then), with the motion finished.
      const read = await page.evaluate((selector) => new Promise((resolve) => {
        const frames = (n) => (n ? requestAnimationFrame(() => frames(n - 1)) : finish());
        const finish = () => {
          const tip = document.querySelector('.ds-tooltip');
          for (const animation of tip.getAnimations()) animation.finish();
          const box = tip.getBoundingClientRect();
          const anchor = document.querySelector(selector).getBoundingClientRect();
          resolve({
            text: tip.textContent,
            state: tip.dataset.state,
            marked: tip.getAttribute('data-placement') === 'top' ? 'above' : 'below',
            real: box.bottom <= anchor.top + 1 ? 'above' : box.top >= anchor.bottom - 1 ? 'below' : 'overlapping',
          });
        };
        frames(3);
      }), to);
      expect(read, to).toMatchObject({ state: 'open', marked: side, real: side });
    }
  });

  test('placed by anchor positioning where the engine has it, by the script elsewhere; page scroll moves or hides it', async ({ page }) => {
    await load(page);
    await focusByKeyboard(page, page.locator('#tip-more'));
    await settle(page);
    const placed = await page.evaluate(() => {
      const tip = document.querySelector('.ds-tooltip');
      const trigger = document.getElementById('tip-more');
      const anchored = typeof HTMLElement.prototype.showPopover === 'function' && CSS.supports('position-area: block-end') && 'anchorName' in document.documentElement.style;
      const box = tip.getBoundingClientRect();
      const anchor = trigger.getBoundingClientRect();
      return {
        anchored,
        marked: tip.hasAttribute('data-anchored'),
        popover: tip.matches('[popover]') && tip.matches(':popover-open'),
        scripted: tip.style.getPropertyValue('--ds-tooltip-x') !== '',
        gap: box.top - anchor.bottom,
        centre: Math.abs((box.left + box.right) / 2 - (anchor.left + anchor.right) / 2),
        anchorName: trigger.style.getPropertyValue('anchor-name'),
      };
    });
    expect(placed.marked).toBe(placed.anchored);
    expect(placed.popover).toBe(placed.anchored);
    expect(placed.scripted).toBe(!placed.anchored);
    expect(placed.gap).toBeCloseTo(8, 0);
    expect(placed.centre).toBeLessThan(1.5);
    expect(placed.anchorName !== '').toBe(placed.anchored);

    // A small scroll: it stays at its trigger.
    await page.mouse.wheel(0, 40);
    await page.waitForFunction(() => {
      const tip = document.querySelector('.ds-tooltip').getBoundingClientRect();
      const anchor = document.getElementById('tip-more').getBoundingClientRect();
      return Math.abs(tip.top - anchor.bottom - 8) < 1;
    });
    // Scrolled out of view: hidden, and the trigger's anchor-name is gone again.
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForFunction(() => document.querySelector('.ds-tooltip').hidden);
    expect(await page.locator('#tip-more').evaluate((el) => el.style.getPropertyValue('anchor-name'))).toBe('');
  });

  test('a pointerdown hides it at once; touch never shows one', async ({ page }) => {
    await load(page);
    await focusByKeyboard(page, page.locator('#tip-copy'));
    expect((await tipState(page)).state).toBe('open');
    await page.mouse.click(600, 400);
    expect((await tipState(page)).state).toBe('closed');
    await settle(page);
    await page.mouse.move(1, 1);
    await page.waitForTimeout(400);
    await page.evaluate(() => document.getElementById('tip-copy').dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'touch' })));
    await page.waitForTimeout(800);
    expect((await tipState(page)).hidden).toBe(true);
  });
});

/* ── 2.0: announce, toastRegion, restart, key, closeToasts, reserve, action, lift ── */

const APP = '/test/browser/fixtures/savebar.html';

async function loadApp(page, { width = 1280, height = 800 } = {}) {
  await page.setViewportSize({ width, height });
  await page.goto(APP);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

/** The region's box and the inline lift DS.overlay wrote. */
const regionBox = (page, id = 'toasts') => page.evaluate((name) => {
  const region = document.getElementById(name);
  const rect = region.getBoundingClientRect();
  return { left: rect.left, bottom: rect.bottom, lift: region.style.getPropertyValue('--ds-toast-lift'), parent: region.parentNode.id };
}, id);

/** data-toast-reserve and --ds-toast-reserve of an element. */
const reserveOf = (page, id) => page.evaluate((name) => {
  const node = document.getElementById(name);
  return { on: node.hasAttribute('data-toast-reserve'), value: node.style.getPropertyValue('--ds-toast-reserve') };
}, id);

test.describe('snackbars 2.0', () => {
  test('announce() speaks through the announcers, the same text twice, nothing for empty text; toastRegion() finds or creates the region', async ({ page }) => {
    await loadApp(page);
    const said = await page.evaluate(async () => {
      const frame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const region = DS.overlay.toastRegion();
      const record = [];
      DS.overlay.announce('');
      DS.overlay.announce('3 devices match.');
      const polite = region.nextElementSibling;
      const assertive = polite.nextElementSibling;
      new MutationObserver(() => record.push(polite.textContent)).observe(polite, { childList: true, characterData: true, subtree: true });
      await frame();
      DS.overlay.announce('3 devices match.');
      DS.overlay.announce('Could not reach the server.', { assertive: true });
      await frame();
      const found = region.id;
      region.remove();
      polite.remove();
      assertive.remove();
      const made = DS.overlay.toastRegion();
      return {
        found,
        polite: polite.textContent,
        assertive: assertive.textContent,
        again: record.slice(-2),
        made: { className: made.className, attrs: made.attributes.length, after: made.previousElementSibling?.id },
        same: DS.overlay.toastRegion() === made,
      };
    });
    expect(said.found).toBe('toasts');
    expect(said.polite).toBe('3 devices match.');
    expect(said.again, 'cleared, then said again').toEqual(['', '3 devices match.']);
    expect(said.assertive).toBe('Could not reach the server.');
    expect(said.made).toEqual({ className: 'ds-toasts', attrs: 1, after: 'app' });
    expect(said.same).toBe(true);
  });

  test('a region toastRegion() creates while a dialog or sheet is open goes into it: the message is above the modal, usable and announced', async ({ page }) => {
    // The overlay fixture has no .ds-toasts: toast(null) and announce() make one.
    for (const id of ['native', 'dialog', 'native-sheet', 'sheet']) {
      await page.setViewportSize({ width: 1000, height: 800 });
      await page.goto('/test/browser/fixtures/overlay.html');
      await ready(page);
      await page.mouse.move(1, 1);
      await settle(page);
      await page.evaluate((name) => DS.overlay.open(document.getElementById(name), { opener: document.getElementById('open-dialog') }), id);
      await settle(page);
      await page.evaluate(() => {
        DS.overlay.toast(null, 'Could not delete the devices.', { kind: 'error' });
        DS.overlay.announce('3 devices match.');
      });
      await settle(page);
      const inside = await page.evaluate((name) => {
        const host = document.getElementById(name);
        const message = document.querySelector('.ds-toast--error');
        const rect = message.getBoundingClientRect();
        const close = message.querySelector('.ds-toast__close');
        close.focus();
        const announcers = [...document.querySelectorAll('.ds-sr[aria-live]')];
        return {
          inHost: host.contains(message),
          hit: message.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)),
          focus: document.activeElement === close,
          announcers: announcers.length === 2 && announcers.every((node) => host.contains(node)),
          said: announcers.find((node) => node.getAttribute('aria-live') === 'polite')?.textContent,
        };
      }, id);
      expect(inside, id).toEqual({ inHost: true, hit: true, focus: true, announcers: true, said: '3 devices match.' });
      await page.evaluate((name) => DS.overlay.close(document.getElementById(name)), id);
      await settle(page);
      // Back where it was made once the exit settled.
      expect(await page.evaluate((name) => {
        const region = document.querySelector('.ds-toasts');
        return { parent: region.parentNode === document.body, inHost: document.getElementById(name).contains(region) };
      }, id), id).toEqual({ parent: true, inHost: false });
    }
  });

  test('the same message again restarts the one on screen (one message, its timer starts over); restart: false stacks it', async ({ page }) => {
    await loadApp(page);
    const first = await page.evaluate(async () => {
      const region = document.getElementById('toasts');
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const a = DS.overlay.toast(null, 'Offline.', { kind: 'info', timeout: 1500 });
      await wait(1000);
      const b = DS.overlay.toast(region, ' offline. ', { kind: 'info', timeout: 1500 });
      await wait(1000);
      // 2000ms after the first call, 1000ms after the restart: still there.
      const count = region.querySelectorAll('.ds-toast:not([data-ds-leaving])').length;
      window.__restart = a;
      return { same: a === b, el: a.el === b.el, count };
    });
    expect(first).toEqual({ same: true, el: true, count: 1 });
    await page.evaluate(() => window.__restart.closed);
    expect(await shown(page)).toEqual([]);
    const stacked = await page.evaluate(() => {
      const one = DS.overlay.toast(null, 'Saved.');
      const two = DS.overlay.toast(null, 'Saved.', { restart: false });
      return one !== two;
    });
    expect(stacked).toBe(true);
    expect(await shown(page)).toEqual(['Saved.', 'Saved.']);
  });

  test('a key replaces a message in place: the old one is closed, focus moves to the new close button, a waiting one keeps its slot', async ({ page }) => {
    await loadApp(page);
    await page.evaluate(() => { window.__old = DS.overlay.toast(null, 'Could not save.', { kind: 'error', key: 'save' }); });
    await settle(page);
    await page.locator('#toasts .ds-toast__close').focus();
    const replaced = await page.evaluate(async () => {
      const next = DS.overlay.toast(null, 'Could not save, again.', { kind: 'error', key: 'save' });
      await window.__old.closed;
      return { focus: document.activeElement === next.el.querySelector('.ds-toast__close'), different: next !== window.__old };
    });
    expect(replaced).toEqual({ focus: true, different: true });
    await settle(page);
    expect(await shown(page)).toEqual(['Could not save, again.']);
    const queued = await page.evaluate(async () => {
      for (const text of ['One stays.', 'Two stay.']) DS.overlay.toast(null, text, { persistent: true });
      const waiting = DS.overlay.toast(null, 'Waiting.', { persistent: true, key: 'wait' });
      const taker = DS.overlay.toast(null, 'Waiting, newer.', { persistent: true, key: 'wait' });
      await waiting.closed;
      return { waiting: waiting.el.isConnected, taker: taker.el.isConnected };
    });
    expect(queued).toEqual({ waiting: false, taker: false });
    // Closing one that stays lets the newer waiting one in.
    await page.evaluate(() => DS.overlay.closeToasts(null, { key: 'save' }));
    await settle(page);
    expect(await shown(page)).toEqual(['One stays.', 'Two stay.', 'Waiting, newer.']);
  });

  test('closeToasts() closes by kind and by key, on screen and waiting, and resolves once they are gone', async ({ page }) => {
    await loadApp(page);
    const left = await page.evaluate(async () => {
      DS.overlay.toast(null, 'Could not sync A.', { kind: 'error' });
      DS.overlay.toast(null, 'Export ready.', { kind: 'info', persistent: true });
      DS.overlay.toast(null, 'Could not sync B.', { kind: 'error', key: 'b' });
      const waiting = DS.overlay.toast(null, 'Could not sync C.', { kind: 'error' });
      await DS.overlay.closeToasts(null, { kind: 'error' });
      const texts = [...document.querySelectorAll('#toasts .ds-toast:not([data-ds-leaving]) .ds-toast__text')].map((el) => el.textContent);
      await waiting.closed;
      await DS.overlay.closeToasts();
      return { texts, after: document.querySelectorAll('#toasts .ds-toast').length };
    });
    expect(left).toEqual({ texts: ['Export ready.'], after: 0 });
  });

  test('a message that stays keeps room at the end of the view and gives it back; reserve: false leaves the page its own', async ({ page }) => {
    await loadApp(page);
    await page.evaluate(() => { window.__err = DS.overlay.toast(null, 'Could not save. Check the connection and try again.', { kind: 'error' }); });
    await settle(page);
    const held = await page.evaluate(() => {
      const view = document.getElementById('main').getBoundingClientRect();
      const message = document.querySelector('#toasts .ds-toast').getBoundingClientRect();
      return { expected: Math.ceil(view.bottom - message.top), value: parseFloat(document.getElementById('main').style.getPropertyValue('--ds-toast-reserve')) };
    });
    expect((await reserveOf(page, 'main')).on).toBe(true);
    expect(Math.abs(held.value - held.expected)).toBeLessThanOrEqual(1);
    await page.evaluate(() => window.__err.close());
    await settle(page);
    expect(await reserveOf(page, 'main')).toEqual({ on: false, value: '' });
    // The page's own reserve stays with reserve: false.
    await page.evaluate(() => {
      const view = document.getElementById('main');
      view.setAttribute('data-toast-reserve', '');
      view.style.setProperty('--ds-toast-reserve', '10px');
      window.__err = DS.overlay.toast(null, 'Could not save.', { kind: 'error', reserve: false });
    });
    await settle(page);
    await page.evaluate(() => window.__err.close());
    await settle(page);
    expect(await reserveOf(page, 'main')).toEqual({ on: true, value: '10px' });
  });

  test('a focused element that a staying message covers scrolls clear of it', async ({ page }) => {
    await loadApp(page, { height: 600 });
    await page.evaluate(() => {
      const view = document.getElementById('main');
      const last = document.getElementById('last');
      // The field right at the view's bottom edge, focused.
      view.scrollTop += last.getBoundingClientRect().bottom - view.getBoundingClientRect().bottom + 4;
      last.focus({ preventScroll: true });
      DS.overlay.toast(null, 'Could not save.', { kind: 'error' });
    });
    await settle(page);
    const clear = await page.evaluate(() => {
      const top = document.querySelector('#toasts .ds-toast').getBoundingClientRect().top;
      return document.getElementById('last').getBoundingClientRect().bottom <= top + 1;
    });
    expect(clear).toBe(true);
  });

  test('in a side sheet the body keeps the room and the messages rise above its foot, gliding on both axes; closing gives both back', async ({ page }) => {
    await loadApp(page);
    await page.evaluate(() => DS.overlay.toast(null, 'Could not save.', { kind: 'error' }));
    await settle(page);
    const home = await regionBox(page);
    const start = await page.evaluate(() => {
      document.getElementById('open-sheet').click();
      const region = document.getElementById('toasts');
      const glide = region.getAnimations().filter((animation) => animation.transitionProperty === 'translate');
      glide.forEach((animation) => animation.pause());
      const rect = region.getBoundingClientRect();
      glide.forEach((animation) => animation.play());
      return { left: rect.left, bottom: rect.bottom, glides: glide.length };
    });
    expect(start.glides).toBe(1);
    expect(Math.abs(start.left - home.left), 'starts where it stood (x)').toBeLessThan(1);
    expect(Math.abs(start.bottom - home.bottom), 'starts where it stood (y)').toBeLessThan(1);
    await settle(page);
    const inSheet = await page.evaluate(() => {
      const foot = document.getElementById('sheet-foot').getBoundingClientRect();
      const region = document.getElementById('toasts');
      return { parent: region.parentNode.id, gap: foot.top - region.getBoundingClientRect().bottom, lift: parseFloat(region.style.getPropertyValue('--ds-toast-lift')), foot: foot.height };
    });
    expect(inSheet.parent).toBe('sheet');
    expect(inSheet.lift).toBeCloseTo(inSheet.foot + 8, 0);
    expect(inSheet.gap).toBeGreaterThanOrEqual(7);
    expect((await reserveOf(page, 'sheet-body')).on).toBe(true);
    expect((await reserveOf(page, 'main')).on).toBe(false);
    await page.locator('#sheet-close').click();
    await settle(page);
    const back = await regionBox(page);
    expect(back.parent).toBe('theme');
    expect(back.lift).toBe('');
    expect(Math.abs(back.bottom - home.bottom)).toBeLessThan(1);
    expect((await reserveOf(page, 'sheet-body')).on).toBe(false);
    expect((await reserveOf(page, 'main')).on).toBe(true);
  });

  test('in a dialog the dialog makes room while its box would overlap the stack; released after its exit', async ({ page }) => {
    await loadApp(page, { height: 420 });
    await page.locator('#open-dialog').click();
    await settle(page);
    await page.evaluate(() => {
      DS.overlay.toast(null, 'Could not delete LAPTOP-0042.', { kind: 'error' });
      DS.overlay.toast(null, 'Could not delete TABLET-0121.', { kind: 'error' });
    });
    await settle(page);
    const held = await page.evaluate(() => {
      const box = document.getElementById('dialog-box').getBoundingClientRect();
      const top = Math.min(...[...document.querySelectorAll('#toasts .ds-toast')].map((el) => el.getBoundingClientRect().top));
      return { inDialog: document.getElementById('toasts').parentNode.id, clear: box.bottom <= top + 1 };
    });
    expect(held).toEqual({ inDialog: 'dialog', clear: true });
    expect((await reserveOf(page, 'dialog')).on).toBe(true);
    await page.locator('#dialog-cancel').click();
    await settle(page);
    expect((await reserveOf(page, 'dialog')).on).toBe(false);
    expect(await page.evaluate(() => document.getElementById('toasts').parentNode.id)).toBe('theme');
    expect((await reserveOf(page, 'main')).on).toBe(true);
  });

  test('beside the open modal drawer the region starts at its edge; on phones it rises above the drawer\'s foot', async ({ page }) => {
    await loadApp(page, { width: 800 });
    await page.evaluate(() => DS.overlay.toast(null, 'Export ready.', { persistent: true }));
    await settle(page);
    await page.locator('#menu').click();
    await settle(page);
    const beside = await page.evaluate(() => ({ left: document.getElementById('toasts').getBoundingClientRect().left, drawer: document.getElementById('drawer').getBoundingClientRect().right }));
    expect(beside.left).toBeCloseTo(beside.drawer + 24, 0);
    await page.keyboard.press('Escape');
    await settle(page);
    await page.setViewportSize({ width: 390, height: 800 });
    await settle(page);
    await page.locator('#menu').click();
    await settle(page);
    const phone = await page.evaluate(() => {
      const foot = document.getElementById('drawer-foot').getBoundingClientRect();
      const region = document.getElementById('toasts');
      return { lift: parseFloat(region.style.getPropertyValue('--ds-toast-lift')), foot: foot.height, gap: foot.top - region.getBoundingClientRect().bottom };
    });
    expect(phone.lift).toBeCloseTo(phone.foot + 8, 0);
    expect(phone.gap).toBeGreaterThanOrEqual(7);
    await page.keyboard.press('Escape');
    await settle(page);
    expect((await regionBox(page)).lift).toBe('');
  });

  test('an action: a text button in the inverse primary ink; a click closes the message and calls onClick once; the message stays until used', async ({ page }) => {
    await loadApp(page);
    await page.evaluate(() => {
      window.__calls = [];
      window.__undo = DS.overlay.toast(null, '3 devices deleted.', { timeout: 500, action: { label: 'Undo', onClick: (event, handle) => window.__calls.push([event.type, handle === window.__undo]) } });
    });
    await page.waitForTimeout(1500);
    const look = await page.evaluate(() => {
      const button = document.querySelector('#toasts .ds-toast__action');
      const probe = document.createElement('i');
      probe.style.color = 'var(--ds-inverse-primary)';
      document.getElementById('toasts').append(probe);
      const ink = getComputedStyle(probe).color;
      probe.remove();
      return {
        classes: button.className,
        type: button.type,
        color: getComputedStyle(button).color === ink,
        order: [...button.parentNode.children].map((el) => (el.tagName === 'svg' ? 'svg' : el.classList[el.classList.length - 1])),
      };
    });
    expect(look).toEqual({ classes: 'ds-btn ds-btn--text ds-btn--sm ds-toast__action', type: 'button', color: true, order: ['svg', 'ds-toast__text', 'ds-toast__action', 'ds-toast__close'] });
    expect(await shown(page), 'stays past its timeout').toEqual(['3 devices deleted.']);
    await page.locator('#toasts .ds-toast__action').dblclick();
    await page.evaluate(() => window.__undo.closed);
    expect(await page.evaluate(() => window.__calls)).toEqual([['click', true]]);
  });

  test('an element message that stays gets the close button with its tooltip; --ds-toast-close-size sizes it', async ({ page }) => {
    await loadApp(page);
    const built = await page.evaluate(() => {
      document.getElementById('theme').style.setProperty('--ds-toast-close-size', '40px');
      const el = document.createElement('div');
      el.className = 'ds-toast';
      el.innerHTML = '<span class="ds-toast__text">Firmware update waiting.</span>';
      DS.overlay.toast(null, el, { persistent: true, closeLabel: 'Dismiss' });
      const close = el.querySelector('.ds-toast__close');
      return { label: close?.getAttribute('aria-label'), tip: close?.getAttribute('data-tip'), width: close?.getBoundingClientRect().width };
    });
    expect(built).toEqual({ label: 'Dismiss', tip: 'Dismiss', width: 40 });
  });
});
