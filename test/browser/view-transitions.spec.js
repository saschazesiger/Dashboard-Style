/**
 * DS.motion.transition() (1.5.0) and the View Transitions of motion.css:
 * fixtures/views.html (.ds-theme on <html>, window.fxViews navigates),
 * shell.html (.ds-theme on a wrapper: the embedded case), mpa-a.html and
 * mpa-b.html (page loads with css/optional/view-transitions.css), and the
 * styleguide's views page.
 *
 * Timelines are read at the transition's `ready` with every pseudo-element
 * animation paused in the same task, so nothing moves between the start
 * and the read; a test then finishes them (endTransition). Screenshots of
 * seeked View Transition frames are trustworthy in Chromium only (Firefox
 * shows the live page, Playwright's WebKit leaves most new images blank):
 * the other engines assert timelines and computed values. Tests whose
 * capability is missing are skipped by feature detection: the View
 * Transition path where startViewTransition is missing (the `fallback`
 * project, which proves the .ds-enter--swap path instead), page loads
 * where `onpagereveal` is missing.
 */
import { test, expect } from './base-test.js';
import { ready, settle, timeline } from './helpers/motion.js';

const VIEWS = '/test/browser/fixtures/views.html';
const VT_PSEUDO = /^::view-transition/;

/** Console errors (and warnings with `warnings`), page errors and unhandled rejections of the page. */
function collectErrors(page, { warnings = false } = {}) {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error' || (warnings && message.type() === 'warning')) errors.push(`${message.type()}: ${message.text()}`); });
  page.on('pageerror', (error) => errors.push(String(error)));
  return errors;
}

async function load(page, url = VIEWS) {
  await page.goto(url);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

const hasViewTransitions = (page) => page.evaluate(() => typeof document.startViewTransition === 'function');

/** The tokens as the engine computes them: durations in ms, curves as a probe transition serialises them. */
function tokens(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const out = {};
    for (const name of ['--ds-ease-in-out', '--ds-ease-spatial', '--ds-ease-in', '--ds-ease-exit']) {
      const probe = document.createElement('div');
      probe.style.transition = `opacity 1000ms var(${name})`;
      document.body.append(probe);
      void getComputedStyle(probe).opacity;
      probe.style.opacity = '0';
      out[name] = probe.getAnimations()[0].effect.getTiming().easing;
      probe.remove();
    }
    for (const name of ['--ds-dur-instant', '--ds-dur-fast', '--ds-dur-base', '--ds-dur-medium', '--ds-dur-slow', '--ds-dur-long']) {
      out[name] = Math.round(DS.motion.motionDuration(root, name));
    }
    return out;
  });
}

/** A curve as its numbers, rounded (engines print linear() stops with different precision). */
const curve = (easing) => (easing || '').match(/-?\d*\.?\d+/g).map((n) => Math.round(Number(n) * 100) / 100).join(' ');

/**
 * Calls fxViews[method](...args) and, at the View Transition's `ready`,
 * pauses every pseudo-element animation in the same task and returns them
 * as data, plus what the page showed meanwhile. The transition stays
 * paused for the caller (endTransition()). window.fxDone holds the
 * promise of the call.
 */
function startTransition(page, method, args = []) {
  return page.evaluate(async ([name, list]) => {
    const original = document.startViewTransition;
    let started = null;
    document.startViewTransition = function (callback) {
      started = original.call(document, callback);
      return started;
    };
    try {
      window.fxDone = window.fxViews[name](...list);
    } finally {
      document.startViewTransition = original;
    }
    window.fxDone.catch(() => {});
    window.fxTransition = started;
    await started.ready;
    const animations = document.documentElement.getAnimations({ subtree: true }).filter((a) => /^::view-transition/.test(a.effect.pseudoElement || ''));
    for (const animation of animations) animation.pause();
    const pill = document.querySelector('.ds-indicator');
    return {
      attribute: document.documentElement.getAttribute('data-ds-vt'),
      morph: document.documentElement.hasAttribute('data-ds-vt-morph'),
      topbarName: getComputedStyle(document.querySelector('.ds-topbar')).viewTransitionName,
      pillName: pill ? pill.style.getPropertyValue('view-transition-name') : null,
      animations: animations.map((a) => ({
        pseudo: a.effect.pseudoElement,
        name: a.animationName || '',
        duration: Math.round(Number(a.effect.getComputedTiming().duration)),
        delay: Math.round(a.effect.getTiming().delay),
        easing: (a.effect.getKeyframes()[0] || {}).easing || a.effect.getTiming().easing,
      })),
    };
  }, [method, args]);
}

/** Finishes the paused View Transition and waits for the call's promise; then nothing may run. */
async function endTransition(page) {
  await page.evaluate(async () => {
    for (const animation of document.documentElement.getAnimations({ subtree: true })) {
      if (/^::view-transition/.test(animation.effect.pseudoElement || '')) animation.finish();
    }
    await window.fxDone;
  });
  await settle(page);
}

/** The animations of one pseudo-element, by animation name. */
const of = (list, pseudo) => Object.fromEntries(list.filter((a) => a.pseudo === pseudo).map((a) => [a.name, a]));

/** Inline view-transition-names left in the document, the permanent indicator names aside. */
const leftoverNames = (page) => page.evaluate(() => [...document.querySelectorAll('[style*="view-transition-name"]')]
  .map((el) => el.style.getPropertyValue('view-transition-name'))
  .filter((name) => name && !name.startsWith('ds-indicator-')));

test.describe('the View Transition path (html.ds-theme)', () => {
  test.beforeEach(async ({ page, dsFallback }) => {
    test.skip(dsFallback, 'the fallback project has no View Transitions: see "the fallback path"');
    await load(page);
    test.skip(!(await hasViewTransitions(page)), 'no same-document View Transitions in this engine');
  });

  test('fade-through: the view fades out in --ds-dur-instant, then in over --ds-dur-medium; the top bar is no group', async ({ page, browserName }) => {
    const t = await tokens(page);
    const bar = await page.locator('.ds-topbar').boundingBox();
    const clip = { x: bar.x, y: bar.y, width: bar.width, height: bar.height };
    const before = browserName === 'chromium' ? await page.screenshot({ clip, animations: 'disabled', caret: 'hide' }) : null;
    const run = await startTransition(page, 'go', [1]);
    expect(run.attribute).toBe('fade-through');
    expect(run.topbarName).toBe('none');
    const old = of(run.animations, '::view-transition-old(ds-view)');
    const next = of(run.animations, '::view-transition-new(ds-view)');
    expect(Object.keys(old)).toEqual(['ds-fade-out']);
    expect([old['ds-fade-out'].duration, old['ds-fade-out'].delay, curve(old['ds-fade-out'].easing)]).toEqual([t['--ds-dur-instant'], 0, curve(t['--ds-ease-in'])]);
    expect(Object.keys(next).sort()).toEqual(['ds-fade-in', 'ds-grow-in']);
    expect([next['ds-fade-in'].duration, next['ds-fade-in'].delay, curve(next['ds-fade-in'].easing)]).toEqual([t['--ds-dur-medium'], t['--ds-dur-instant'], curve(t['--ds-ease-in-out'])]);
    expect([next['ds-grow-in'].duration, next['ds-grow-in'].delay, curve(next['ds-grow-in'].easing)]).toEqual([t['--ds-dur-medium'], t['--ds-dur-instant'], curve(t['--ds-ease-spatial'])]);
    // The root crossfades over --ds-dur-fast; nothing is named after the top bar.
    expect(of(run.animations, '::view-transition-new(root)')['-ua-view-transition-fade-in']?.duration).toBe(t['--ds-dur-fast']);
    expect(run.animations.filter((a) => /topbar/.test(a.pseudo))).toEqual([]);
    // A plain swap holds the frozen page no longer than the view's own motion: nothing outlasts --ds-dur-slow
    // (the panel and view groups take --ds-dur-long only for a morph, data-ds-vt-morph).
    expect(run.morph).toBe(false);
    expect(run.animations.filter((a) => a.delay + a.duration > t['--ds-dur-slow']).map((a) => `${a.pseudo} ${a.name} ${a.delay}+${a.duration}`)).toEqual([]);
    if (before) {
      // The bar never moves or fades: frames at 0 and 50 % of every track are the same picture. Against
      // the live bar only the text's antialiasing differs (Chromium rasterises snapshots in grayscale,
      // the live page with subpixel colour), so that comparison is on luminance.
      const at = (progress) => page.evaluate((p) => {
        for (const animation of document.documentElement.getAnimations({ subtree: true })) {
          if (!/^::view-transition/.test(animation.effect.pseudoElement || '')) continue;
          animation.currentTime = animation.effect.getTiming().delay + Number(animation.effect.getComputedTiming().duration) * p;
        }
      }, progress);
      await at(0);
      const start = await page.screenshot({ clip, animations: 'allow', caret: 'hide' });
      await at(0.5);
      const middle = await page.screenshot({ clip, animations: 'allow', caret: 'hide' });
      const compare = (a, b) => page.evaluate(async ([x, y]) => {
        const decode = async (data) => {
          const image = new Image();
          image.src = `data:image/png;base64,${data}`;
          await image.decode();
          const canvas = new OffscreenCanvas(image.width, image.height);
          const context = canvas.getContext('2d');
          context.drawImage(image, 0, 0);
          return context.getImageData(0, 0, image.width, image.height).data;
        };
        const [p, q] = [await decode(x), await decode(y)];
        const lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        let channel = 0;
        let luminance = 0;
        for (let i = 0; i < p.length; i += 4) {
          if (Math.max(Math.abs(p[i] - q[i]), Math.abs(p[i + 1] - q[i + 1]), Math.abs(p[i + 2] - q[i + 2])) > 8) channel += 1;
          if (Math.abs(lum(p, i) - lum(q, i)) > 64) luminance += 1;
        }
        return { channel: channel / (p.length / 4), luminance: luminance / (p.length / 4) };
      }, [a.toString('base64'), b.toString('base64')]);
      expect((await compare(start, middle)).channel, 'the bar mid-transition equals its first frame').toBeLessThan(0.0005);
      expect((await compare(before, middle)).luminance, 'the bar mid-transition equals the settled bar').toBeLessThan(0.0005);
    }
    await endTransition(page);
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-ds-vt'))).toBe(false);
    await expect(page.locator('#page h1')).toHaveText('Devices');
  });

  test('shared axis: the new view comes from the end going forward, from the start going back, on the spring', async ({ page }) => {
    const t = await tokens(page);
    for (const [type, sign] of [['forward', 1], ['back', -1]]) {
      const run = await startTransition(page, 'go', [type === 'forward' ? 1 : 0, type]);
      expect(run.attribute).toBe(type);
      const next = of(run.animations, '::view-transition-new(ds-view)');
      const old = of(run.animations, '::view-transition-old(ds-view)');
      expect(Object.keys(next).sort()).toEqual(['ds-fade-in', 'ds-shift-in']);
      expect(Object.keys(old).sort()).toEqual(['ds-fade-out', 'ds-shift-out']);
      // Both land at --ds-dur-slow on the spring; the new view travels with its fade.
      expect([old['ds-shift-out'].duration, old['ds-shift-out'].delay, curve(old['ds-shift-out'].easing)], `${type} out`).toEqual([t['--ds-dur-slow'], 0, curve(t['--ds-ease-spatial'])]);
      expect([next['ds-shift-in'].duration, next['ds-shift-in'].delay, curve(next['ds-shift-in'].easing)], `${type} in`).toEqual([t['--ds-dur-medium'], t['--ds-dur-instant'], curve(t['--ds-ease-spatial'])]);
      expect([next['ds-fade-in'].duration, next['ds-fade-in'].delay]).toEqual([next['ds-shift-in'].duration, next['ds-shift-in'].delay]);
      const start = await page.evaluate(() => {
        for (const animation of document.documentElement.getAnimations({ subtree: true })) {
          if (/^::view-transition/.test(animation.effect.pseudoElement || '')) animation.currentTime = 0;
        }
        const x = (pseudo) => parseFloat(getComputedStyle(document.documentElement, pseudo).translate) || 0;
        return { next: x('::view-transition-new(ds-view)'), old: x('::view-transition-old(ds-view)') };
      });
      expect(run.animations.filter((a) => a.delay + a.duration > t['--ds-dur-slow']).map((a) => `${a.pseudo} ${a.name}`), `${type}: nothing outlasts --ds-dur-slow`).toEqual([]);
      expect(Math.sign(start.next), `${type}: the new view starts at ${start.next}px`).toBe(sign);
      expect(start.old, `${type}: the old view starts in place`).toBe(0);
      await endTransition(page);
    }
  });

  test('container: the card grows into its detail on the spring over --ds-dur-long, and no name is left behind', async ({ page }) => {
    const t = await tokens(page);
    for (const [method, args] of [['detail', [1]], ['back', [1]]]) {
      const run = await startTransition(page, method, args);
      expect(run.attribute, method).toBe('container');
      const group = run.animations.find((a) => a.pseudo === '::view-transition-group(ds-container)');
      expect(group, `${method}: a ds-container group`).toBeTruthy();
      expect([group.duration, curve(group.easing)]).toEqual([t['--ds-dur-long'], curve(t['--ds-ease-spatial'])]);
      const old = of(run.animations, '::view-transition-old(ds-container)');
      expect(Object.keys(old)).toEqual(['ds-fade-out']);
      expect([old['ds-fade-out'].duration, old['ds-fade-out'].delay]).toEqual([t['--ds-dur-fast'], 0]);
      // The new image is live and opaque from the first frame (one surface grows).
      expect(Object.keys(of(run.animations, '::view-transition-new(ds-container)'))).toEqual([]);
      await endTransition(page);
      expect(await leftoverNames(page), method).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.hasAttribute('data-ds-vt'))).toBe(false);
    }
    await expect(page.locator('#card-1')).toBeVisible();
  });

  test('container: an element its scroller clips inside the window is no group (it would cover the top bar): a fade-through', async ({ page }) => {
    // The window of the review: 1280 x 500, a detail far longer than the view.
    await page.setViewportSize({ width: 1280, height: 500 });
    await page.addStyleTag({ content: '#detail { min-height: 1500px !important; }' });
    await settle(page);
    const groups = (run) => run.animations.filter((a) => /\(ds-container\)/.test(a.pseudo));
    // A card in view into the long detail: the part below the window does not count.
    let run = await startTransition(page, 'detail', [1]);
    expect(run.attribute).toBe('container');
    expect(groups(run).length).toBeGreaterThan(0);
    await endTransition(page);
    // Scrolled to the detail's end (where Back is): its top lies above the view, under the top bar.
    await page.evaluate(() => { const view = document.querySelector('.ds-view'); view.scrollTop = view.scrollHeight; });
    await settle(page);
    run = await startTransition(page, 'back', [1]);
    expect(run.attribute, 'back from a scrolled detail').toBe('fade-through');
    expect(groups(run), 'no ds-container group over the top bar').toEqual([]);
    await endTransition(page);
    expect(await leftoverNames(page)).toEqual([]);
    // A card partly scrolled under the top bar, into its detail and into the sheet.
    for (const [method, args] of [['detail', [1]], ['openSheet', [1, true]]]) {
      await page.evaluate(() => {
        const view = document.querySelector('.ds-view');
        const card = document.getElementById('card-1');
        view.scrollTop += card.getBoundingClientRect().top - view.getBoundingClientRect().top + 20;
      });
      await settle(page);
      run = await startTransition(page, method, args);
      expect(run.attribute, method).toBe('fade-through');
      expect(groups(run), method).toEqual([]);
      await endTransition(page);
      expect(await leftoverNames(page), method).toEqual([]);
      if (method === 'detail') {
        await page.evaluate(() => window.fxViews.go(0));
        await settle(page);
      }
    }
    // The sheet still opened, with its usual entrance (finished by now).
    await expect(page.locator('#sheet')).toHaveAttribute('data-state', 'open');
    await page.evaluate(() => window.fxViews.closeSheet());
    await settle(page);
  });

  test('container: one surface grows, never see-through: the old image lies on the opaque new one while it fades', async ({ page }) => {
    const t = await tokens(page);
    for (const [method, args] of [['detail', [1]], ['back', [1]], ['openSheet', [1, true]]]) {
      await startTransition(page, method, args);
      const frames = await page.evaluate((end) => {
        const animations = document.documentElement.getAnimations({ subtree: true }).filter((a) => /^::view-transition/.test(a.effect.pseudoElement || ''));
        const opacity = (pseudo) => Number(getComputedStyle(document.documentElement, pseudo).opacity);
        const out = [];
        for (let time = 0; time <= end; time += 25) {
          for (const animation of animations) animation.currentTime = time;
          const old = opacity('::view-transition-old(ds-container)');
          const next = opacity('::view-transition-new(ds-container)');
          // Normal blending, the old image on top: what the pair covers of the page under it.
          out.push({ time, old, next, coverage: 1 - (1 - old) * (1 - next) });
        }
        const pair = getComputedStyle(document.documentElement, '::view-transition-old(ds-container)');
        return { out, oldZ: pair.zIndex, blend: pair.mixBlendMode };
      }, t['--ds-dur-long']);
      expect(frames.blend, method).toBe('normal');
      const thin = frames.out.filter((frame) => frame.coverage < 0.99);
      expect(thin, `${method}: the group is opaque at every seeked time`).toEqual([]);
      expect(frames.out[0].old, `${method}: the old image starts opaque`).toBeGreaterThan(0.99);
      expect(frames.out.find((frame) => frame.time === t['--ds-dur-fast'] + 25).old, `${method}: and is gone after --ds-dur-fast`).toBeLessThan(0.01);
      await endTransition(page);
      if (method === 'openSheet') {
        await page.evaluate(() => window.fxViews.closeSheet());
        await settle(page);
      }
    }
  });

  test('snackbars stay on top and still: a region with messages is a group above the page\'s, with only its live image', async ({ page, browserName }) => {
    await page.evaluate(() => DS.overlay.toast(document.getElementById('toasts'), 'Saved.', { persistent: true }));
    await settle(page);
    // A second region with a message: one name only, or the engine would skip the transition.
    await page.evaluate(() => {
      const extra = document.createElement('div');
      extra.className = 'ds-toasts';
      extra.id = 'extra-toasts';
      extra.style.setProperty('--ds-toast-bottom', '200px');
      document.body.append(extra);
      DS.overlay.toast(extra, 'Also saved.', { persistent: true });
    });
    await settle(page);
    const box = await page.locator('#toasts .ds-toast').boundingBox();
    const run = await startTransition(page, 'go', [1]);
    const during = await page.evaluate(() => {
      const root = document.documentElement;
      const z = (pseudo) => Number(getComputedStyle(root, pseudo).zIndex);
      return {
        names: ['#toasts', '#extra-toasts'].map((id) => getComputedStyle(document.querySelector(id)).viewTransitionName),
        extraInline: document.getElementById('extra-toasts').style.getPropertyValue('view-transition-name'),
        toasts: z('::view-transition-group(ds-toasts)'),
        panel: z('::view-transition-group(ds-panel)'),
        view: z('::view-transition-group(ds-view)'),
        oldOpacity: Number(getComputedStyle(root, '::view-transition-old(ds-toasts)').opacity),
      };
    });
    expect(during.names).toEqual(['ds-toasts', 'none']);
    expect(during.extraInline).toBe('none');
    expect(during.toasts).toBeGreaterThan(during.panel);
    expect(during.toasts).toBeGreaterThan(during.view);
    expect(during.oldOpacity).toBe(0);
    expect(run.animations.filter((a) => /^::view-transition-(old|new)\(ds-toasts\)$/.test(a.pseudo)), 'only the live image, still').toEqual([]);
    if (browserName === 'chromium') {
      // Seeked halfway: the message is drawn (its dark surface), not the panel's white image over it.
      await page.evaluate(() => {
        for (const animation of document.documentElement.getAnimations({ subtree: true })) {
          if (/^::view-transition/.test(animation.effect.pseudoElement || '')) animation.currentTime = Number(animation.effect.getComputedTiming().endTime) / 2;
        }
      });
      const shot = await page.screenshot({ clip: box, animations: 'allow', caret: 'hide' });
      const dark = await page.evaluate(async (data) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = new OffscreenCanvas(image.width, image.height);
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, image.width, image.height).data;
        let count = 0;
        for (let i = 0; i < pixels.length; i += 4) if (0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2] < 96) count += 1;
        return count / (pixels.length / 4);
      }, shot.toString('base64'));
      expect(dark, 'the snackbar mid-transition').toBeGreaterThan(0.6);
    }
    await endTransition(page);
    expect(await page.evaluate(() => [getComputedStyle(document.getElementById('toasts')).viewTransitionName, document.getElementById('extra-toasts').style.getPropertyValue('view-transition-name')])).toEqual(['none', '']);
    await expect(page.locator('#toasts .ds-toast')).toHaveCount(1);
  });

  test('clicks during a transition land: two presses on Next 100ms apart step two records, two drawer clicks end on the second', async ({ page }) => {
    await page.evaluate(() => window.fxViews.openSheet(0));
    await settle(page);
    const next = await page.locator('#sheet-next').boundingBox();
    // Real presses (a locator click would wait for the button to take hits again).
    await page.mouse.click(next.x + next.width / 2, next.y + next.height / 2);
    await page.waitForTimeout(100);
    await page.mouse.click(next.x + next.width / 2, next.y + next.height / 2);
    await expect(page.locator('#record')).toHaveAttribute('data-record', '2');
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-ds-vt'));
    await settle(page);
    await expect(page.locator('#record')).toHaveAttribute('data-record', '2');
    await page.evaluate(() => window.fxViews.closeSheet());
    await settle(page);
    for (const [label, wait] of [['Devices', 120], ['Tickets', 0]]) {
      const item = await page.locator('.ds-drawer__item', { hasText: label }).boundingBox();
      await page.mouse.click(item.x + item.width / 2, item.y + item.height / 2);
      if (wait) await page.waitForTimeout(wait);
    }
    await expect(page.locator('#page h1')).toHaveText('Tickets');
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-ds-vt'));
    await settle(page);
    await expect(page.locator('#page h1')).toHaveText('Tickets');
    expect(await leftoverNames(page)).toEqual([]);
  });

  test('indicator: no group of its own within a page; the live pill glides under its labels and lands on the item', async ({ page }) => {
    const run = await startTransition(page, 'go', [2]);
    expect(run.pillName, 'the name is lifted while the transition runs').toBe('none');
    expect(run.animations.filter((a) => /ds-indicator/.test(a.pseudo))).toEqual([]);
    expect(run.animations.filter((a) => a.pseudo === '::view-transition-new(ds-drawer)'), 'the drawer shows live').toEqual([]);
    // Let the transition run: the live pill's edges transition while data-ds-vt is still set.
    const glide = await page.evaluate(async () => {
      for (const animation of document.documentElement.getAnimations({ subtree: true })) {
        if (/^::view-transition/.test(animation.effect.pseudoElement || '')) animation.play();
      }
      const pill = document.querySelector('.ds-indicator');
      for (let frame = 0; frame < 60 && document.documentElement.hasAttribute('data-ds-vt'); frame += 1) {
        const edges = pill.getAnimations().filter((a) => /^--ds-indicator-/.test(a.transitionProperty || ''));
        if (edges.length) return { edges: edges.map((a) => a.transitionProperty).sort(), during: document.documentElement.getAttribute('data-ds-vt') };
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      return { edges: [], during: null };
    });
    expect(glide.during).toBe('fade-through');
    expect(glide.edges.length).toBeGreaterThan(0);
    await page.evaluate(() => window.fxDone);
    await settle(page);
    const end = await page.evaluate(() => {
      const pill = document.querySelector('.ds-indicator');
      const item = document.querySelector('.ds-drawer__item[aria-current="page"]');
      const a = pill.getBoundingClientRect();
      const b = item.getBoundingClientRect();
      // The pill is painted by clip-path inside its box: compare the painted edges.
      const style = getComputedStyle(pill);
      const inset = (name) => parseFloat(style.getPropertyValue(name)) || 0;
      return {
        name: pill.style.getPropertyValue('view-transition-name'),
        running: pill.getAnimations().length,
        top: a.top + inset('--ds-indicator-t') - b.top,
        bottom: a.bottom - inset('--ds-indicator-b') - b.bottom,
        label: item.textContent.trim(),
      };
    });
    expect(end.name).toBe('ds-indicator-nav');
    expect(end.running).toBe(0);
    expect(end.label).toBe('Tickets');
    expect(Math.abs(end.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(end.bottom)).toBeLessThanOrEqual(1);
  });

  test('watchdog: an update that takes 4s loses its motion after --ds-dur-long, and the page takes a click meanwhile', async ({ page }) => {
    const t = await tokens(page);
    const skipped = await page.evaluate(async () => {
      const original = document.startViewTransition;
      let started = null;
      document.startViewTransition = function (callback) {
        started = original.call(document, callback);
        return started;
      };
      const at = performance.now();
      window.fxDone = window.fxViews.slow(1, 4000);
      document.startViewTransition = original;
      try {
        await started.ready;
        return { skipped: false, after: performance.now() - at };
      } catch {
        return { skipped: true, after: performance.now() - at };
      }
    });
    expect(skipped.skipped).toBe(true);
    expect(skipped.after).toBeGreaterThanOrEqual(t['--ds-dur-long'] - 20);
    expect(skipped.after).toBeLessThan(1500);
    // Well before the update ends (4s): the margins hold under load, and the click still proves that the
    // page takes input while the update is pending.
    await page.locator('#ping').click({ timeout: 2000 });
    expect(await page.evaluate(() => [window.fxViews.pings, window.fxViews.current])).toEqual([1, 0]);
    await page.evaluate(() => window.fxDone);
    expect(await page.evaluate(() => [window.fxViews.current, document.documentElement.hasAttribute('data-ds-vt')])).toEqual([1, false]);
  });

  test('a view without the drawer: the panel morphs over --ds-dur-long, the drawer leaves and comes back with the view', async ({ page }) => {
    const t = await tokens(page);
    const leaving = await startTransition(page, 'go', [3]);
    expect(leaving.morph, 'the panel changes its width').toBe(true);
    for (const name of ['ds-panel', 'ds-view']) {
      const group = leaving.animations.find((a) => a.pseudo === `::view-transition-group(${name})`);
      expect([group.duration, curve(group.easing)], name).toEqual([t['--ds-dur-long'], curve(t['--ds-ease-spatial'])]);
    }
    expect(leaving.animations.filter((a) => a.pseudo === '::view-transition-new(ds-drawer)'), 'old-only').toEqual([]);
    const exit = of(leaving.animations, '::view-transition-old(ds-drawer)');
    expect(Object.keys(exit).sort()).toEqual(['ds-fade-out', 'ds-shift-out']);
    expect([exit['ds-fade-out'].duration, exit['ds-shift-out'].duration, curve(exit['ds-shift-out'].easing)]).toEqual([t['--ds-dur-fast'], t['--ds-dur-base'], curve(t['--ds-ease-exit'])]);
    await endTransition(page);
    expect(await page.evaluate(() => document.getElementById('app').hasAttribute('data-drawer-hidden'))).toBe(true);
    const back = await startTransition(page, 'go', [0]);
    expect(back.morph).toBe(true);
    const entrance = of(back.animations, '::view-transition-new(ds-drawer)');
    expect(Object.keys(entrance).sort()).toEqual(['ds-fade-in', 'ds-shift-in']);
    expect([entrance['ds-shift-in'].duration, curve(entrance['ds-shift-in'].easing)]).toEqual([t['--ds-dur-long'], curve(t['--ds-ease-spatial'])]);
    expect(back.animations.filter((a) => a.pseudo === '::view-transition-old(ds-drawer)'), 'new-only').toEqual([]);
    // enter(drawer) inside the update stays quiet: the transition plays the return.
    expect(await timeline(page.locator('#drawer'), { names: ['ds-fade-in', 'ds-shift-in'] })).toEqual([]);
    await endTransition(page);
  });

  test('side sheet: previous and next swap only the body; Refresh starts no transition and no animation', async ({ page }) => {
    await page.evaluate(() => window.fxViews.openSheet(0));
    await settle(page);
    const step = await startTransition(page, 'step', [1]);
    expect(step.attribute).toBe('forward');
    expect(Object.keys(of(step.animations, '::view-transition-new(ds-sheet-body)')).sort()).toEqual(['ds-fade-in', 'ds-shift-in']);
    expect(Object.keys(of(step.animations, '::view-transition-old(ds-sheet-body)')).sort()).toEqual(['ds-fade-out', 'ds-shift-out']);
    // The page under the scrim keeps no names: it stays in the root, under the sheet.
    expect(step.animations.filter((a) => /\((ds-view|ds-panel|ds-drawer)\)/.test(a.pseudo))).toEqual([]);
    await endTransition(page);
    await expect(page.locator('#record')).toHaveAttribute('data-record', '1');
    const refresh = await page.evaluate(() => {
      let calls = 0;
      const original = document.startViewTransition;
      document.startViewTransition = function (callback) { calls += 1; return original.call(document, callback); };
      window.fxViews.refresh();
      document.startViewTransition = original;
      const body = document.getElementById('sheet-body');
      const timed = body.getAnimations({ subtree: true }).filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline));
      return { calls, animations: timed.length, text: document.getElementById('record').textContent };
    });
    expect(refresh).toEqual({ calls: 0, animations: 0, text: 'Record 2, refreshed 1 times.' });
    expect(await leftoverNames(page)).toEqual([]);
  });

  test('a sheet shown inline in the page, or closed, gets no name: only an open modal sheet\'s body is a group', async ({ page }) => {
    await page.evaluate(() => {
      const inline = document.createElement('div');
      inline.className = 'ds-sheet';
      inline.id = 'inline-sheet';
      inline.innerHTML = '<section class="ds-sheet__panel"><div class="ds-sheet__head"><h2 class="ds-sheet__title">Inline</h2></div><div class="ds-sheet__body">Shown in the page.</div></section>';
      document.querySelector('#main .ds-content').append(inline);   // in the view, beside the page the swap replaces
    });
    const names = () => page.evaluate(() => ['#inline-sheet', '#sheet'].map((id) => getComputedStyle(document.querySelector(`${id} .ds-sheet__body`)).viewTransitionName));
    const run = await startTransition(page, 'go', [1]);
    expect(await names(), 'inline and closed').toEqual(['none', 'none']);
    expect(run.animations.filter((a) => /ds-sheet-body/.test(a.pseudo))).toEqual([]);
    await endTransition(page);
    await page.evaluate(() => window.fxViews.openSheet(0));
    await settle(page);
    const step = await startTransition(page, 'step', [1]);
    expect(await names(), 'the open sheet only').toEqual(['none', 'ds-sheet-body']);
    expect(step.animations.some((a) => a.pseudo === '::view-transition-new(ds-sheet-body)')).toBe(true);
    await endTransition(page);
  });

  test('a div sheet or div dialog shown by hand (no DS.overlay) covers the frame too: only the sheet body is a group', async ({ page }) => {
    await page.evaluate(() => {
      const sheet = document.createElement('div');
      sheet.className = 'ds-sheet';
      sheet.id = 'hand-sheet';
      sheet.setAttribute('role', 'dialog');
      sheet.setAttribute('aria-modal', 'true');
      sheet.setAttribute('aria-labelledby', 'hand-sheet-title');
      sheet.hidden = true;
      sheet.innerHTML = '<div class="ds-sheet__backdrop"></div><section class="ds-sheet__panel"><div class="ds-sheet__head"><h2 class="ds-sheet__title" id="hand-sheet-title">By hand</h2></div><div class="ds-sheet__body" id="hand-body"><p>Record 1</p></div></section>';
      const dialog = document.createElement('div');
      dialog.className = 'ds-dialog';
      dialog.id = 'hand-dialog';
      dialog.hidden = true;
      dialog.innerHTML = '<div class="ds-dialog__backdrop"></div><div class="ds-dialog__box" role="alertdialog" aria-modal="true" aria-label="By hand"><p class="ds-dialog__text">Shown by hand.</p></div>';
      document.body.append(sheet, dialog);
      const body = document.getElementById('hand-body');
      window.fxViews.handSwap = () => DS.motion.transition(() => { DS.dom.morphHtml(body, '<p>Record 2</p>'); return body; }, { type: 'forward' });
    });
    const frameGroups = (run) => run.animations.filter((a) => /\((ds-view|ds-panel|ds-drawer)\)/.test(a.pseudo)).map((a) => a.pseudo);
    // Shown the documented way: removing hidden, without data-state.
    await page.evaluate(() => { document.getElementById('hand-sheet').hidden = false; });
    await settle(page);
    const swap = await startTransition(page, 'handSwap');
    expect(frameGroups(swap), 'the page under the hand-shown sheet stays in the root').toEqual([]);
    expect(swap.animations.some((a) => a.pseudo === '::view-transition-new(ds-sheet-body)'), 'its body is the group').toBe(true);
    await endTransition(page);
    await expect(page.locator('#hand-body')).toHaveText('Record 2');
    await page.evaluate(() => { document.getElementById('hand-sheet').hidden = true; document.getElementById('hand-dialog').hidden = false; });
    await settle(page);
    const go = await startTransition(page, 'go', [1]);
    expect(frameGroups(go), 'the page under the hand-shown dialog stays in the root').toEqual([]);
    await endTransition(page);
    expect(await leftoverNames(page)).toEqual([]);
    // Hidden again, the frame is named as usual.
    await page.evaluate(() => { document.getElementById('hand-dialog').hidden = true; });
    const back = await startTransition(page, 'go', [0]);
    expect(frameGroups(back).length, 'nothing covers the frame').toBeGreaterThan(0);
    await endTransition(page);
  });

  test('phone width: a navigation from the modal drawer crossfades under it; view and panel are no groups', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await settle(page);
    for (const method of ['fromDrawer', 'afterDrawer']) {
      await page.evaluate(() => window.fxViews.openDrawer());
      await settle(page);
      await expect(page.locator('#app')).toHaveAttribute('data-drawer-open', '');
      const run = await startTransition(page, method, [method === 'fromDrawer' ? 1 : 2]);
      expect(run.animations.filter((a) => /\((ds-view|ds-panel|ds-drawer)\)/.test(a.pseudo)).map((a) => a.pseudo), method).toEqual([]);
      expect(run.animations.some((a) => a.pseudo === '::view-transition-new(root)'), `${method}: the root crossfades`).toBe(true);
      await endTransition(page);
      expect(await page.evaluate(() => document.getElementById('app').hasAttribute('data-drawer-open')), method).toBe(false);
      expect(await leftoverNames(page), method).toEqual([]);
    }
    await expect(page.locator('#page h1')).toHaveText('Tickets');
  });
});

test.describe('page loads (css/optional/view-transitions.css)', () => {
  test.beforeEach(async ({ page, dsFallback }) => {
    test.skip(dsFallback, 'the fallback project plays an engine without View Transitions');
    await page.goto('/test/browser/fixtures/mpa-a.html');
    await shown(page);
    test.skip(!(await page.evaluate(() => 'onpagereveal' in window)), 'no cross-document View Transitions in this engine');
  });

  /** The page is ready and has rendered (a page load transitions only from a page that was shown). */
  async function shown(page) {
    await ready(page);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }

  test('a page load glides the named indicator on the --ds-dur-slow spring; the top bar is no group', async ({ page }) => {
    await page.locator('#to-b').click();
    await page.waitForURL(/mpa-b\.html/);
    const revealed = await page.evaluate(() => window.revealed);
    const slow = await page.evaluate(() => Math.round(DS.motion.motionDuration(document.documentElement, '--ds-dur-slow')));
    expect(revealed.transition).toBe(true);
    const pill = revealed.animations.find((a) => a.pseudo === '::view-transition-group(ds-indicator-nav)');
    expect(pill, JSON.stringify(revealed.animations.map((a) => a.pseudo))).toBeTruthy();
    expect(Math.round(pill.duration)).toBe(slow);
    expect(revealed.animations.filter((a) => /topbar/.test(a.pseudo))).toEqual([]);
    expect(revealed.animations.some((a) => a.pseudo === '::view-transition-new(ds-view)' && a.name === 'ds-fade-in')).toBe(true);
  });

  /** Records the pill's view-transition-name as the page is left (after the indicator's own pageswap listener). */
  function recordPillAtSwap(page) {
    return page.evaluate(() => {
      sessionStorage.removeItem('ds-pill-at-swap');
      addEventListener('pageswap', () => sessionStorage.setItem('ds-pill-at-swap', getComputedStyle(document.querySelector('.ds-indicator')).viewTransitionName));
    });
  }

  test('phone width: a page left from the open modal drawer stays under it; only the new frame fades in', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await page.evaluate(() => DS.overlay.open(document.querySelector('.ds-drawer')));
    await settle(page);
    await expect(page.locator('.ds-app')).toHaveAttribute('data-drawer-open', '');
    expect(await page.evaluate(() => ['.ds-view', '.ds-panel'].map((s) => getComputedStyle(document.querySelector(s)).viewTransitionName)), 'unnamed under the drawer').toEqual(['none', 'none']);
    await recordPillAtSwap(page);
    await page.locator('#to-b').click();
    await page.waitForURL(/mpa-b\.html/);
    // The pill keeps no name under the modal drawer (1.6.1): its group would paint over the drawer's labels.
    expect(await page.evaluate(() => sessionStorage.getItem('ds-pill-at-swap'))).toBe('none');
    const revealed = await page.evaluate(() => window.revealed);
    expect(revealed.transition).toBe(true);
    const pseudos = revealed.animations.map((a) => `${a.pseudo} ${a.name}`);
    // The panel exists on the new side only (its one-sided crossfade): the old page's frame lay in the root.
    expect(pseudos).toContain('::view-transition-new(ds-panel) ds-fade-in');
    expect(pseudos).toContain('::view-transition-new(ds-view) ds-fade-in');
    // WebKit lists the animations of an image that does not exist too, so only Chromium can tell from the list.
    if (browserName === 'chromium') expect(pseudos.filter((p) => /old\(ds-(view|panel)\)/.test(p))).toEqual([]);
  });

  test('a page left with a dialog open: the frame and the pill stay under its scrim; the pill is no group from the old page', async ({ page, browserName }) => {
    await page.evaluate(() => {
      document.querySelector('.ds-theme').insertAdjacentHTML('beforeend', '<div class="ds-dialog" id="fx-dialog" hidden><div class="ds-dialog__backdrop" data-close></div><div class="ds-dialog__box" role="alertdialog" aria-modal="true" aria-labelledby="fx-dialog-title"><h2 class="ds-dialog__title" id="fx-dialog-title">Leave the page?</h2><div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-close>Stay</button></div></div></div>');
      return DS.overlay.open(document.getElementById('fx-dialog'));
    });
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.ds-indicator')).viewTransitionName), 'named while the page shows').toBe('ds-indicator-nav');
    await recordPillAtSwap(page);
    // The page under the dialog is inert: the navigation starts from the script.
    await page.evaluate(() => document.getElementById('to-b').click());
    await page.waitForURL(/mpa-b\.html/);
    expect(await page.evaluate(() => sessionStorage.getItem('ds-pill-at-swap'))).toBe('none');
    const revealed = await page.evaluate(() => window.revealed);
    expect(revealed.transition).toBe(true);
    // WebKit lists the animations of an image that does not exist too, so only Chromium can tell from the list.
    if (browserName === 'chromium') expect(revealed.animations.filter((a) => /old\(ds-indicator-nav\)/.test(a.pseudo))).toEqual([]);
    // Nothing covers the new page: its pill has its name.
    await settle(page);
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.ds-indicator')).viewTransitionName)).toBe('ds-indicator-nav');
  });

  test('without the opt-in stylesheet no page load transitions', async ({ page }) => {
    await page.goto('/test/browser/fixtures/mpa-a.html?plain=1');
    await shown(page);
    await page.locator('#to-b').click();
    await page.waitForURL(/mpa-b\.html\?plain=1/);
    expect(await page.evaluate(() => window.revealed)).toEqual({ transition: false, animations: [] });
  });
});

test.describe('the fallback path (.ds-enter--swap)', () => {
  /** Runs a swap through DS.motion.transition() and reads what the returned element and the document animate. */
  function swapOnce(page, run) {
    return page.evaluate(async (source) => {
      let calls = 0;
      const original = document.startViewTransition;
      if (original) document.startViewTransition = function (callback) { calls += 1; return original.call(document, callback); };
      const target = await new Function(`return (${source})`)()();
      if (original) document.startViewTransition = original;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const pseudo = document.documentElement.getAnimations({ subtree: true }).filter((a) => /^::view-transition/.test(a.effect.pseudoElement || ''));
      return {
        calls,
        entrance: target.getAnimations().map((a) => a.animationName).filter(Boolean).sort(),
        swap: target.classList.contains('ds-enter--swap'),
        pseudo: pseudo.length,
      };
    }, run.toString());
  }

  test('embedded (.ds-theme on a wrapper): never startViewTransition; the new view fades through', async ({ page }) => {
    await load(page, '/test/browser/fixtures/shell.html');
    const result = await swapOnce(page, async () => {
      const page = document.querySelector('.ds-page');
      const next = document.createElement('div');
      next.className = 'ds-stack';
      next.innerHTML = '<section class="ds-card"><h2 class="ds-card__title">Another view</h2></section>';
      window.fxDone = DS.motion.transition(() => { page.replaceChildren(next); return next; }, { type: 'forward' });
      await Promise.resolve();
      await Promise.resolve();
      return next;
    });
    expect(result).toEqual({ calls: 0, entrance: ['ds-fade-in', 'ds-lift-in'], swap: true, pseudo: 0 });
    await page.evaluate(() => window.fxDone);
    await settle(page);
  });

  test('without View Transitions (the fallback project): the returned element enters with .ds-enter--swap, the drawer slides back', async ({ page, dsFallback }) => {
    test.skip(!dsFallback, 'the engines with View Transitions run them (above)');
    await load(page);
    const result = await swapOnce(page, async () => {
      window.fxDone = window.fxViews.go(1);
      await Promise.resolve();
      await Promise.resolve();
      return document.getElementById('page').firstElementChild;
    });
    expect(result).toEqual({ calls: 0, entrance: ['ds-fade-in', 'ds-lift-in'], swap: true, pseudo: 0 });
    await page.evaluate(() => window.fxDone);
    await settle(page);
    // A view without the drawer: the grid jumps; coming back, the drawer slides in (P4).
    await page.evaluate(() => window.fxViews.go(3));
    await settle(page);
    // Read in the task that starts it (after the swap's microtasks): the slide lasts --ds-dur-slow only, so a
    // later round trip may come after it under load.
    const slide = await page.evaluate(async () => {
      window.fxDone = window.fxViews.go(0);
      await Promise.resolve();
      await Promise.resolve();
      return document.getElementById('drawer').getAnimations().map((a) => a.animationName).filter(Boolean).sort();
    });
    expect(slide).toEqual(['ds-fade-in', 'ds-shift-in']);
    await page.evaluate(() => window.fxDone);
    await settle(page);
  });

  test('an update that returns nothing: the view\'s content enters, never the data-scrolled sentinel first in the view', async ({ page }) => {
    await load(page);
    const result = await page.evaluate(async () => {
      // Every engine plays the path without View Transitions here (the fallback project has none anyway).
      document.startViewTransition = undefined;
      const view = document.getElementById('main');
      const sentinel = view.firstElementChild;
      window.fxDone = window.fxViews.bare(1);
      await Promise.resolve();
      await Promise.resolve();
      const content = view.querySelector(':scope > .ds-content');
      const out = {
        sentinel: sentinel.hasAttribute('data-ds-keep') && sentinel.getAttribute('aria-hidden') === 'true',
        sentinelFirst: view.firstElementChild === sentinel,
        sentinelEnters: sentinel.classList.contains('ds-enter--swap'),
        contentEnters: content.classList.contains('ds-enter--swap'),
        entrance: content.getAnimations().map((a) => a.animationName).filter(Boolean).sort(),
      };
      delete document.startViewTransition;
      return out;
    });
    expect(result).toEqual({ sentinel: true, sentinelFirst: true, sentinelEnters: false, contentEnters: true, entrance: ['ds-fade-in', 'ds-lift-in'] });
    await page.evaluate(() => window.fxDone);
    await settle(page);
    await expect(page.locator('#page h1')).toHaveText('Devices');
  });
});

test('rapid double navigation within 50ms ends on the second view, with nothing left behind', async ({ page }) => {
  const errors = collectErrors(page);
  await load(page);
  const result = await page.evaluate(async () => {
    const rejections = [];
    window.addEventListener('unhandledrejection', (event) => rejections.push(String(event.reason)));
    const first = window.fxViews.go(1);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const second = window.fxViews.go(2, 'forward');
    const settled = await Promise.allSettled([first, second]);
    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
      settled: settled.map((entry) => entry.status),
      title: document.querySelector('#page h1').textContent,
      current: document.querySelector('.ds-drawer__item[aria-current="page"]').textContent.trim(),
      attribute: document.documentElement.hasAttribute('data-ds-vt'),
      rejections,
    };
  });
  expect(result).toEqual({ settled: ['fulfilled', 'fulfilled'], title: 'Tickets', current: 'Tickets', attribute: false, rejections: [] });
  await settle(page);
  expect(await leftoverNames(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test('the pages with <link rel="expect"> load without a console warning (the render block is not ended early)', async ({ page }) => {
  const errors = collectErrors(page, { warnings: true });
  for (const url of ['/styleguide/views.html', '/styleguide/views.html?mpa=1', '/test/browser/fixtures/mpa-a.html', '/test/browser/fixtures/mpa-b.html']) {
    await page.goto(url);
    await ready(page);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  }
  expect(errors).toEqual([]);
});

test('the styleguide\'s views page: every demo ends settled, without a console error or warning', async ({ page }) => {
  test.setTimeout(60000);
  const errors = collectErrors(page, { warnings: true });
  await page.goto('/styleguide/views.html');
  await ready(page);
  await page.mouse.move(1, 1);
  const done = async () => {
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-ds-vt'));
    await settle(page);
  };
  const nav = (label) => page.locator('#vw-nav .ds-drawer__item', { hasText: label });
  for (const label of ['Devices', 'Report', 'Wall display']) {
    await nav(label).click();
    await done();
    await expect(page.locator('#vw-page h1')).toHaveText(label);
  }
  // Wall display has no drawer: Next wraps round to the overview, and the drawer comes back.
  await page.locator('[data-vw-step="1"]').click();
  await done();
  await expect(page.locator('#vw-page h1')).toHaveText('Overview');
  await expect(nav('Overview')).toBeVisible();
  // Previous and next (shared axis), wrapping round.
  await page.locator('[data-vw-step="1"]').click();
  await done();
  await expect(page.locator('#vw-page h1')).toHaveText('Devices');
  await page.locator('[data-vw-step="-1"]').click();
  await done();
  // A card into its detail and back (container transform).
  await page.locator('[data-vw-detail="1"]').click();
  await done();
  await expect(page.locator('#vw-detail')).toBeVisible();
  await page.locator('[data-vw-back]').click();
  await done();
  // Quick look: the card grows into the sheet; its arrows swap the record; Refresh morphs in place.
  await page.locator('[data-vw-quick="0"]').click();
  await done();
  await expect(page.locator('#vw-sheet')).toHaveAttribute('data-state', 'open');
  await page.locator('#vw-sheet-next').click();
  await done();
  await expect(page.locator('#vw-sheet-title')).toHaveText('LAPTOP-0043');
  await page.locator('#vw-sheet-prev').click();
  await done();
  await page.locator('[data-vw-refresh]').click();
  await done();
  await page.locator('#vw-sheet-close').click();
  await done();
  // Devices: a row opens the sheet (no container), the wide table scrolls.
  await nav('Devices').click();
  await done();
  await page.locator('[data-vw-open="2"]').click();
  await done();
  await expect(page.locator('#vw-sheet-title')).toHaveText('DESKTOP-0107');
  await page.keyboard.press('Escape');
  await done();
  expect(errors).toEqual([]);
});
