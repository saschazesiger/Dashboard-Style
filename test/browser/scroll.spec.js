/**
 * Scroll-driven effects (1.5.0) on fixtures/views.html and the styleguide:
 * the panel hairline and the top bar's tint, a side sheet's head hairline,
 * a table's edge fades and .ds-reveal--scroll, each with its fallback
 * (data-scrolled from the 1px sentinel, the static fade, a static block).
 *
 * Scroll-driven animations follow the scroll position: they are read
 * after setting scrollTop / scrollLeft and two frames, never seeked.
 * Where the engine lacks them (Firefox today, the `fallback` project) the
 * fallback is asserted instead, by feature detection.
 */
import { test, expect } from './base-test.js';
import { ready, settle } from './helpers/motion.js';

const VIEWS = '/test/browser/fixtures/views.html';

async function load(page, url = VIEWS) {
  await page.goto(url);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

const supports = (page) => page.evaluate(() => ({
  scroll: CSS.supports('animation-timeline: scroll()'),
  scope: CSS.supports('timeline-scope: none'),
  view: CSS.supports('animation-timeline: view()'),
}));

/** Scrolls `selector` to `top` (block) or `left` (inline) and waits two frames, so scroll timelines have run. */
function scrollTo(page, selector, { top, left }) {
  return page.evaluate(async ([sel, y, x]) => {
    const scroller = document.querySelector(sel);
    if (y !== null) scroller.scrollTop = y;
    if (x !== null) scroller.scrollLeft = x;
    for (let i = 0; i < 2; i += 1) await new Promise((resolve) => requestAnimationFrame(resolve));
  }, [selector, top ?? null, left ?? null]);
}

/**
 * Scrolls `scroller` to `top` and, in the microtask after the sentinel's
 * observer set data-scrolled on `target`, starts the opacity transitions
 * of `pseudos` ([selector, '::before'] ...) and pauses every time-based
 * animation of the document in the same task: what the attribute fades in,
 * read before a frame can end it. The caller plays them on (release()).
 */
function scrolledFades(page, scroller, target, top, pseudos) {
  return page.evaluate(([scrollerSel, targetSel, y, list]) => new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      observer.disconnect();
      for (const [selector, pseudo] of list) void getComputedStyle(document.querySelector(selector), pseudo).opacity;
      const timed = document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline));
      for (const animation of timed) animation.pause();
      resolve(timed.filter((a) => a.transitionProperty === 'opacity' && list.some(([selector, pseudo]) => a.effect.target === document.querySelector(selector) && a.effect.pseudoElement === pseudo))
        .map((a) => ({ target: `#${a.effect.target.id}${a.effect.pseudoElement}`, duration: Math.round(a.effect.getTiming().duration), scrolled: document.querySelector(targetSel).hasAttribute('data-scrolled') })));
    });
    observer.observe(document.querySelector(targetSel), { attributes: true, attributeFilter: ['data-scrolled'] });
    document.querySelector(scrollerSel).scrollTop = y;
  }), [scroller, target, top, pseudos]);
}

/** Plays on what scrolledFades() paused. */
const release = (page) => page.evaluate(() => document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline)).forEach((a) => a.play()));

/** Computed opacity of a pseudo-element. */
const opacityOf = (page, selector, pseudo) => page.evaluate(([sel, p]) => Number(getComputedStyle(document.querySelector(sel), p).opacity), [selector, pseudo]);

test('panel hairline and top bar tint: they follow the first 8px of scroll, or data-scrolled fades them in', async ({ page }) => {
  await load(page, `${VIEWS}?observe=0`);
  const has = await supports(page);
  if (has.scroll) {
    // The scroll position alone: the fixture never sets data-scrolled here.
    const read = async (top) => {
      await scrollTo(page, '#main', { top });
      return {
        hairline: await opacityOf(page, '#main', '::before'),
        tint: has.scope ? await opacityOf(page, '#topbar', '::before') : null,
      };
    };
    const at = { 0: await read(0), 4: await read(4), 8: await read(8), 40: await read(40) };
    expect(at[0].hairline).toBe(0);
    expect(at[4].hairline).toBeGreaterThan(0.35);
    expect(at[4].hairline).toBeLessThan(0.65);
    expect([at[8].hairline, at[40].hairline]).toEqual([1, 1]);
    if (has.scope) {
      expect(at[0].tint).toBe(0);
      expect(at[4].tint).toBeGreaterThan(0.35);
      expect(at[4].tint).toBeLessThan(0.65);
      expect([at[8].tint, at[40].tint]).toEqual([1, 1]);
    }
    await scrollTo(page, '#main', { top: 0 });
    expect(await opacityOf(page, '#main', '::before'), 'scrolled back').toBe(0);
    expect(await page.locator('#app').getAttribute('data-scrolled')).toBeNull();
  }
  if (!has.scroll || !has.scope) {
    // The observer of the sentinel sets data-scrolled; the hairline and the tint fade in over --ds-dur-fast.
    await load(page);
    const fast = await page.evaluate(() => Math.round(DS.motion.motionDuration(document.documentElement, '--ds-dur-fast')));
    const fades = await scrolledFades(page, '#main', '#app', 40, [['#topbar', '::before'], ['#main', '::before']]);
    const expected = has.scroll ? ['#topbar::before'] : ['#main::before', '#topbar::before'];
    expect(fades.map((entry) => entry.target).sort()).toEqual(expected);
    for (const entry of fades) expect([entry.duration, entry.scrolled]).toEqual([fast, true]);
    await release(page);
    await settle(page);
    expect(await opacityOf(page, '#topbar', '::before')).toBe(1);
    expect(await opacityOf(page, '#main', '::before')).toBe(1);
    await scrollTo(page, '#main', { top: 0 });
    await expect(page.locator('#app')).not.toHaveAttribute('data-scrolled', '');
  }
});

test('a scrolled view that no longer scrolls keeps no tint or hairline: the styleguide\'s Report, scrolled, then Overview', async ({ page }) => {
  await page.goto('/styleguide/views.html');
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
  await page.locator('[data-vw-go="2"]').click();
  await settle(page);
  await scrollTo(page, '#main', { top: 300 });
  await settle(page);   // without scroll timelines data-scrolled fades the tint in
  expect(await page.evaluate(() => document.getElementById('main').scrollTop), 'Report scrolls').toBe(300);
  expect(await opacityOf(page, '.ds-topbar', '::before'), 'tinted while scrolled').toBe(1);
  await page.locator('[data-vw-go="0"]').click();
  await settle(page);
  await scrollTo(page, '#main', {});
  const after = await page.evaluate(() => {
    const view = document.getElementById('main');
    return { top: view.scrollTop, overflows: view.scrollHeight > view.clientHeight, scrolled: document.getElementById('vw-app').hasAttribute('data-scrolled') };
  });
  expect(after).toEqual({ top: 0, overflows: false, scrolled: false });
  expect(await opacityOf(page, '.ds-topbar', '::before'), 'the bar').toBe(0);
  expect(await opacityOf(page, '#main', '::before'), 'the panel hairline').toBe(0);
});

test('transition() and resyncScroll(): a scroller that stops overflowing rests as on a fresh load (view, sheet body)', async ({ page }) => {
  // No sentinel observer here: transition() and resyncScroll() alone.
  await load(page, `${VIEWS}?observe=0`);
  const has = await supports(page);
  test.skip(!has.scroll, 'without scroll timelines data-scrolled draws the hairlines (the test above)');
  await scrollTo(page, '#main', { top: 300 });
  expect(await opacityOf(page, '#main', '::before')).toBe(1);
  await page.evaluate(() => window.fxViews.go(1));
  await settle(page);
  await scrollTo(page, '#main', {});
  expect(await page.evaluate(() => document.getElementById('main').scrollHeight > document.getElementById('main').clientHeight), 'the new view fits').toBe(false);
  expect(await opacityOf(page, '#main', '::before'), 'the panel hairline').toBe(0);
  if (has.scope) expect(await opacityOf(page, '#topbar', '::before'), 'the bar').toBe(0);
  if (!has.scope) return;
  // A sheet body scrolled, then its content shrinks in place.
  await page.evaluate(() => window.fxViews.openSheet(0));
  await settle(page);
  await scrollTo(page, '#sheet-body', { top: 200 });
  expect(await opacityOf(page, '#sheet .ds-sheet__head', '::after')).toBe(1);
  const restarted = await page.evaluate(async () => {
    const body = document.getElementById('sheet-body');
    DS.dom.morphHtml(body, '<p id="record" data-record="0">Short.</p>');
    return DS.motion.resyncScroll(body);
  });
  expect(restarted).toBeGreaterThanOrEqual(1);
  await scrollTo(page, '#sheet-body', {});
  expect(await opacityOf(page, '#sheet .ds-sheet__head', '::after'), 'the sheet head hairline').toBe(0);
  // Scrolling again still drives it.
  await page.evaluate(() => DS.dom.morphHtml(document.getElementById('sheet-body'), '<div style="flex: none; height: 2000px">Tall.</div>'));
  await scrollTo(page, '#sheet-body', { top: 4 });
  const half = await opacityOf(page, '#sheet .ds-sheet__head', '::after');
  expect(half).toBeGreaterThan(0.35);
  expect(half).toBeLessThan(0.65);
});

test('side sheet: the head hairline follows the body\'s first 8px of scroll, or data-scrolled on the panel', async ({ page }) => {
  await load(page, `${VIEWS}?observe=0`);
  const has = await supports(page);
  if (has.scope) {
    await page.evaluate(() => window.fxViews.openSheet(0));
    await settle(page);
    const read = async (top) => {
      await scrollTo(page, '#sheet-body', { top });
      return opacityOf(page, '#sheet .ds-sheet__head', '::after');
    };
    const at = [await read(0), await read(4), await read(8), await read(60)];
    expect(at[0]).toBe(0);
    expect(at[1]).toBeGreaterThan(0.35);
    expect(at[1]).toBeLessThan(0.65);
    expect([at[2], at[3]]).toEqual([1, 1]);
    // DS.overlay.open() watches the body (2.0): data-scrolled is set from the first pixel, yet the timeline draws.
    expect(await page.locator('#sheet .ds-sheet__panel').getAttribute('data-scrolled')).toBe('');
  } else {
    await load(page);
    await page.evaluate(() => window.fxViews.openSheet(0));
    await settle(page);
    const fast = await page.evaluate(() => Math.round(DS.motion.motionDuration(document.documentElement, '--ds-dur-fast')));
    await page.evaluate(() => { document.querySelector('#sheet .ds-sheet__head').id = 'sheet-head'; });
    const fade = await scrolledFades(page, '#sheet-body', '#sheet .ds-sheet__panel', 60, [['#sheet-head', '::after']]);
    expect(fade).toEqual([{ target: '#sheet-head::after', duration: fast, scrolled: true }]);
    await release(page);
    await settle(page);
    expect(await opacityOf(page, '#sheet .ds-sheet__head', '::after')).toBe(1);
  }
});

test('table edge fades: a fade on each side that still has columns, none on a table that fits; else the static fade', async ({ page }) => {
  await load(page);
  const has = await supports(page);
  // 2.0: the wrappers fade on the edge numbers of scroller.css (0 or 1, times the fade length).
  const fades = (selector) => page.evaluate((sel) => {
    const wrap = document.querySelector(sel);
    const style = getComputedStyle(wrap);
    return {
      start: Number(style.getPropertyValue('--ds-scroll-edge-start')),
      end: Number(style.getPropertyValue('--ds-scroll-edge-end')),
      mask: style.maskImage || style.webkitMaskImage,
      scrolls: wrap.scrollWidth > wrap.clientWidth,
    };
  }, selector);
  const wide = await fades('#wide');
  expect(wide.scrolls, 'the wide table scrolls sideways').toBe(true);
  if (has.scroll) {
    expect([wide.start, wide.end]).toEqual([0, 1]);
    await scrollTo(page, '#wide', { left: 100000 });
    const end = await fades('#wide');
    expect([end.start, end.end]).toEqual([1, 0]);
    const narrow = await fades('#narrow');
    expect(narrow.scrolls).toBe(false);
    expect([narrow.start, narrow.end], 'a table that fits fades nowhere').toEqual([0, 0]);
    // Scrolled to its end, then columns hidden until it fits: resyncScroll() drops the start fade it kept.
    await page.evaluate(() => {
      const wrap = document.getElementById('wide');
      for (const cell of wrap.querySelectorAll('th:nth-child(n+3), td:nth-child(n+3)')) cell.hidden = true;
      return DS.motion.resyncScroll(wrap);
    });
    await scrollTo(page, '#wide', {});
    const fits = await fades('#wide');
    expect(fits.scrolls, 'the table fits now').toBe(false);
    expect(await page.evaluate(() => document.getElementById('wide').getAnimations().length), 'it keeps its edge fades').toBe(2);
    expect([fits.start, fits.end], 'a table that fits now fades nowhere').toEqual([0, 0]);
  } else {
    // The static fade at the right edge, without a timeline.
    expect(wide.mask).toMatch(/linear-gradient\(to left, /);
    expect(await page.evaluate(() => document.getElementById('wide').getAnimations().length)).toBe(0);
  }
});

test('reveal on scroll: hidden below the fold, opaque 96px into view; opaque in print and without view()', async ({ page }) => {
  await load(page);
  const has = await supports(page);
  const reveal = () => page.evaluate(() => {
    const el = document.getElementById('reveal');
    const view = document.getElementById('main').getBoundingClientRect();
    return { opacity: Number(getComputedStyle(el).opacity), inView: view.bottom - el.getBoundingClientRect().top };
  });
  const below = await reveal();
  expect(below.inView, 'below the fold').toBeLessThan(0);
  if (has.view) {
    expect(below.opacity).toBe(0);
    // 4 x --ds-space-6 (96px) of it in view, and a little more.
    await page.evaluate(async () => {
      const view = document.getElementById('main');
      const el = document.getElementById('reveal');
      view.scrollTop += el.getBoundingClientRect().top - view.getBoundingClientRect().bottom + 100;
      for (let i = 0; i < 2; i += 1) await new Promise((resolve) => requestAnimationFrame(resolve));
    });
    const inView = await reveal();
    expect(inView.inView).toBeGreaterThanOrEqual(96);
    expect(inView.opacity).toBe(1);
    await scrollTo(page, '#main', { top: 0 });
    expect((await reveal()).opacity, 'scrolled back, it reverses').toBe(0);
    await page.emulateMedia({ media: 'print' });
    expect((await reveal()).opacity, 'print shows its end state').toBe(1);
    await page.emulateMedia({ media: 'screen' });
  } else {
    expect(below.opacity, 'static, never hidden').toBe(1);
  }
});

test('sentinel: scrolling the styleguide view 2000px changes data-scrolled on .ds-app at most twice', async ({ page }) => {
  await page.goto('/styleguide/index.html');
  await ready(page);
  const mutations = await page.evaluate(async () => {
    const app = document.querySelector('.ds-app');
    const view = document.querySelector('.ds-view');
    view.scrollTop = 0;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const records = [];
    const observer = new MutationObserver((list) => records.push(...list.map((record) => record.attributeName)));
    observer.observe(app, { attributes: true, attributeFilter: ['data-scrolled'] });
    for (let y = 50; y <= 2000; y += 50) {
      view.scrollTop = y;
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    observer.disconnect();
    return { count: records.length, scrolled: app.hasAttribute('data-scrolled') };
  });
  expect(mutations.scrolled).toBe(true);
  expect(mutations.count).toBeGreaterThanOrEqual(1);
  expect(mutations.count).toBeLessThanOrEqual(2);
});

/* ── 2.0: DS.dom.watchScrolled() and DS.dom.scrollEdges() ─────────── */

test('watchScrolled: DS.overlay.open() watches a sheet body; opened twice it keeps one sentinel through re-renders; data-scrolled on the panel in every engine (2.0)', async ({ page }) => {
  await load(page);
  const result = await page.evaluate(async () => {
    const body = document.getElementById('sheet-body');
    const frames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const counts = [];
    const auto = [];
    for (let i = 0; i < 2; i += 1) {
      await window.fxViews.openSheet(i);
      // open() watched it (OV-15); a page that still wires it on every open gets the same watch.
      auto.push(body.querySelectorAll('[data-ds-sentinel]').length);
      DS.dom.watchScrolled(body);
      DS.dom.morphHtml(body, `<p>Record ${i}</p>`.repeat(80));
      counts.push(body.querySelectorAll('[data-ds-sentinel]').length);
      await window.fxViews.closeSheet();
    }
    // A re-render that drops the sentinel while closed: the next open puts it back.
    body.textContent = '';
    await window.fxViews.openSheet(0);
    auto.push(body.querySelectorAll('[data-ds-sentinel]').length);
    body.scrollTop = 120;
    await frames();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const panel = document.querySelector('#sheet .ds-sheet__panel');
    const scrolled = panel.hasAttribute('data-scrolled');
    body.scrollTop = 0;
    await frames();
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { auto, counts, first: body.firstElementChild.hasAttribute('data-ds-sentinel'), scrolled, back: panel.hasAttribute('data-scrolled') };
  });
  expect(result).toEqual({ auto: [1, 1, 1], counts: [1, 1], first: true, scrolled: true, back: false });
});

test('DS.overlay.open() watches a dialog body: data-scrolled on the box; an empty body (its sentinel aside) takes no room; the lead text keeps its pull-up (2.0)', async ({ page }) => {
  await load(page);
  const result = await page.evaluate(async () => {
    const frames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const settle = () => new Promise((resolve) => setTimeout(resolve, 50));
    document.querySelector('.ds-theme').insertAdjacentHTML('beforeend',
      '<dialog class="ds-dialog" id="watched" aria-labelledby="watched-title"><div class="ds-dialog__backdrop" data-close></div>' +
      '<div class="ds-dialog__box"><h2 class="ds-dialog__title" id="watched-title">Notify people</h2>' +
      '<div class="ds-dialog__body" id="watched-body"></div>' +
      '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-close>Close</button></div></div></dialog>');
    const dialog = document.getElementById('watched');
    const box = dialog.querySelector('.ds-dialog__box');
    const body = document.getElementById('watched-body');
    await DS.overlay.open(dialog);
    const out = { sentinels: body.querySelectorAll(':scope > [data-ds-sentinel]').length, emptyDisplay: getComputedStyle(body).display };
    let rows = '<p class="ds-dialog__text" id="watched-lead">They get an email.</p>';
    for (let i = 0; i < 40; i += 1) rows += '<p>Person ' + (i + 1) + '</p>';
    DS.dom.morphHtml(body, rows);
    await frames();
    out.leadMargin = getComputedStyle(document.getElementById('watched-lead')).marginTop;
    out.first = body.firstElementChild.hasAttribute('data-ds-sentinel');
    body.scrollTop = 120;
    await frames();
    await settle();
    out.scrolled = box.hasAttribute('data-scrolled');
    body.scrollTop = 0;
    await frames();
    await settle();
    out.back = box.hasAttribute('data-scrolled');
    await DS.overlay.close(dialog);
    dialog.remove();
    return out;
  });
  expect(result.sentinels).toBe(1);
  expect(result.emptyDisplay).toBe('none');
  expect(result.first).toBe(true);
  expect(parseFloat(result.leadMargin)).toBeLessThan(0);
  expect(result.scrolled).toBe(true);
  expect(result.back).toBe(false);
});

test('scrollEdges: overflow at each end follows the scroll, the scrollbar room is reported, destroy() cleans up (2.0)', async ({ page }) => {
  await load(page);
  const result = await page.evaluate(async () => {
    const frames = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    document.querySelector('.ds-theme').insertAdjacentHTML('afterbegin', '<div id="edges"><div id="edges-wide">Wide content</div></div>');
    const box = document.getElementById('edges');
    Object.assign(box.style, { width: '200px', overflowX: 'auto', overflowY: 'hidden' });
    document.getElementById('edges-wide').style.width = '800px';
    const state = () => ['data-ds-edges', 'data-ds-overflow-start', 'data-ds-overflow-end'].filter((name) => box.hasAttribute(name)).join(' ');
    const handle = DS.dom.scrollEdges(box);
    const out = { start: state(), bar: box.style.getPropertyValue('--ds-scrollbar-height') };
    box.scrollLeft = 300;
    await frames();
    out.middle = state();
    box.scrollLeft = 600;
    await frames();
    out.end = state();
    document.getElementById('edges-wide').style.width = '100px';
    await frames();
    await frames();
    out.fits = state();
    handle.destroy();
    out.destroyed = state();
    box.remove();
    return out;
  });
  expect(result.start).toBe('data-ds-edges data-ds-overflow-end');
  expect(result.bar).toMatch(/^\d+px$/);
  expect(result.middle).toBe('data-ds-edges data-ds-overflow-start data-ds-overflow-end');
  expect(result.end).toBe('data-ds-edges data-ds-overflow-start');
  expect(result.fits).toBe('data-ds-edges');
  expect(result.destroyed).toBe('');
});
