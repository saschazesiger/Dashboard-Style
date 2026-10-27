/**
 * The app frame of 1.2.0 (shell.css) in real engines: the drawer coming
 * back slides on the x axis like .ds-enter--slide; the modal drawer opens
 * on the spring (its overshoot covered by the bleed, so the screen edge
 * never shows the scrim), closes on --ds-dur-base and --ds-ease-exit, and
 * turns back from where it is; drawer labels change colour on the pill's
 * timing (in one frame without the pill, at once in the modal drawer) and
 * never animate their weight; a track of .ds-btn toggles leaves the tint
 * to the pill, its labels on the pill's timing; a segmented switch with
 * data-label keeps its
 * width, one without keeps its content in a row; the top bar tints while
 * the view is scrolled and its filled fields stay distinct; a brand of
 * only a name starts on the drawer's icon edge; .ds-view keeps a
 * stable gutter; the documented view swap never shows the new view at full
 * opacity before its entrance and ends on the latest content; the
 * styleguide's nav click glides the pill once.
 *
 * Motion is started and paused in one task and read by seeking, so nothing
 * depends on how fast the machine is; the one exception is the modal
 * drawer reopened mid-close, sampled on every frame at ten times slower
 * and judged with expectSmooth().
 */
import { test, expect } from './base-test.js';
import { ready, settle, timeline, expectSmooth } from './helpers/motion.js';

const FIXTURES = '/test/browser/fixtures/';

async function open(page, name, width = 1000) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(FIXTURES + name);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

/** Ends every running animation of the document (paused ones included). */
function finishAll(page) {
  return page.evaluate(() => {
    for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) {
      if (Number.isFinite(animation.effect.getComputedTiming().iterations)) animation.finish();
    }
  });
}

/** A token's computed value as a colour, read through a probe element inside the fixture's theme. */
function colourOf(page, token) {
  return page.evaluate((name) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${name})`;
    document.querySelector('.ds-theme').append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, token);
}

test.describe('drawer', () => {
  test('enter(drawer) and enter(drawer, "slide") play the same timeline, on the x axis only', async ({ page }) => {
    await open(page, 'shell.html');
    const drawer = page.locator('#drawer');
    const play = async (variant) => {
      const start = await drawer.evaluate((el, name) => {
        if (name) DS.motion.enter(el, name); else DS.motion.enter(el);
        for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
        const cs = getComputedStyle(el);
        return { translate: cs.translate, opacity: Number(cs.opacity) };
      }, variant);
      const played = (await timeline(drawer)).map(({ type, name, duration, delay, keyframeEasing, iterations }) => ({ type, name, duration, delay, keyframeEasing, iterations }));
      await finishAll(page);
      await settle(page);
      return { start, played };
    };
    const plain = await play('');
    const slide = await play('slide');
    expect(plain.played.map((entry) => entry.name)).toEqual(['ds-fade-in', 'ds-shift-in']);
    expect(plain.played).toEqual(slide.played);
    for (const { start } of [plain, slide]) {
      const [x, y = '0px'] = start.translate.split(/\s+/);
      expect(parseFloat(x)).toBeLessThan(-1);
      expect(parseFloat(y)).toBe(0);
      expect(start.opacity).toBe(0);
    }
  });

  test('the modal drawer opens on the spring, its bleed covers the screen edge, and it closes on --ds-dur-base', async ({ page, dsFallback }) => {
    await open(page, 'shell.html', 800);
    const drawer = page.locator('#drawer');
    const read = () => drawer.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const bleed = getComputedStyle(el, '::before');
      return { x: rect.left, width: rect.width, bleed: parseFloat(bleed.width), right: bleed.right };
    });
    await page.evaluate(() => {
      document.getElementById('menu').click();
      for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
    });
    const open1 = (await timeline(drawer)).find((entry) => entry.name === 'transform');
    const durations = await drawer.evaluate((el) => ({
      long: DS.motion.motionDuration(el, '--ds-dur-long'),
      base: DS.motion.motionDuration(el, '--ds-dur-base'),
      exit: DS.motion.motionEasing(el, '--ds-ease-exit'),
    }));
    expect(open1.duration).toBe(durations.long);
    const frames = [];
    for (let step = 0; step <= 20; step += 1) {
      await page.evaluate((time) => {
        for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.currentTime = time;
      }, (open1.duration * step) / 20);
      frames.push(await read());
    }
    const width = frames[0].width;
    const peak = Math.max(...frames.map((frame) => frame.x));
    expect(frames[0].x).toBeLessThan(-width * 0.9);
    // The spring passes x = 0 by at most 5 % of the width; the cubic
    // fallback never passes.
    if (dsFallback) expect(peak).toBeLessThanOrEqual(0.5);
    else expect(peak).toBeGreaterThan(0.5);
    expect(peak).toBeLessThanOrEqual(width * 0.05 + 0.5);
    expect(Math.abs(frames.at(-1).x)).toBeLessThan(0.5);
    // In every frame the drawer or its bleed reaches x = 0.
    for (const frame of frames) {
      // The bleed overlaps the drawer by 1px (no seam).
      expect(parseFloat(frame.right)).toBeCloseTo(frame.width - 1, 0);
      expect(frame.x + 1 - frame.bleed).toBeLessThanOrEqual(0);
    }
    await finishAll(page);
    await settle(page);

    // Close: --ds-dur-base on --ds-ease-exit.
    await page.evaluate(() => {
      document.getElementById('scrim').click();
      for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
    });
    const close = (await timeline(drawer)).find((entry) => entry.name === 'transform');
    expect(close.duration).toBe(durations.base);
    const numbers = (curve) => curve.match(/-?\d*\.?\d+/g).map(Number);
    expect(close.easing).toMatch(/^cubic-bezier\(/);
    expect(numbers(close.easing)).toEqual(numbers(durations.exit));

    await finishAll(page);
    await settle(page);

    // Reopened mid-close, it continues from where it is (D21). Ten times
    // slower, the close runs on its own, the menu reopens the drawer at half
    // of it, and its left edge, read on every frame at that frame's time,
    // never jumps (a paused and seeked reversal reads differently in
    // Firefox than what it paints).
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--ds-time-scale', '10');
      document.getElementById('menu').click();
    });
    await finishAll(page);
    await settle(page);
    const trace = await drawer.evaluate(async (el) => {
      const frame = () => new Promise((resolve) => requestAnimationFrame((time) => resolve(time)));
      const samples = [];
      const read = (t) => samples.push({ t, v: el.getBoundingClientRect().left });
      read(await frame());
      document.getElementById('scrim').click();
      const half = DS.motion.motionDuration(el, '--ds-dur-base') / 2;
      let turn = null;
      for (;;) {
        const t = await frame();
        read(t);
        if (!turn && t - samples[0].t >= half) {
          document.getElementById('menu').click();
          turn = { at: samples.length - 1, count: el.getAnimations().filter((animation) => animation.transitionProperty === 'transform').length };
        } else if (turn && !el.getAnimations().length) break;
        if (t - samples[0].t > 30000) break;
      }
      return { samples, turn };
    });
    await page.evaluate(() => document.documentElement.style.removeProperty('--ds-time-scale'));
    expect(trace.turn.count, 'one transform transition takes over').toBe(1);
    expect(trace.samples[trace.turn.at].v, 'reopened mid-close').toBeLessThan(-10);
    expect(Math.abs(trace.samples.at(-1).v), 'open again').toBeLessThan(0.5);
    expectSmooth(trace.samples, 'the drawer reopened mid-close');
  });
});

test.describe('labels', () => {
  test('a drawer label changes colour on the pill\'s timing, and its weight at once', async ({ page }) => {
    await open(page, 'shell.html');
    const item = page.locator('#drawer-list .ds-drawer__item[href="#owners"]');
    await item.evaluate((el) => {
      el.click();
      // The indicator places in a frame (the click handler's update() at once).
      for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
    });
    const result = await item.evaluate((el) => {
      const track = el.closest('.ds-has-indicator');
      const dur = parseFloat(track.style.getPropertyValue('--ds-indicator-dur'));
      const transitions = el.getAnimations({ subtree: true }).filter((animation) => typeof animation.transitionProperty === 'string')
        .map((animation) => ({ property: animation.transitionProperty, duration: animation.effect.getTiming().duration, target: animation.effect.target.tagName.toLowerCase() }));
      return { dur, transitions };
    });
    expect(result.dur).toBeGreaterThan(0);
    const colours = result.transitions.filter((entry) => entry.property === 'color');
    expect(colours.map((entry) => entry.target).sort()).toEqual(['a', 'svg']);
    for (const entry of colours) expect(entry.duration).toBe(result.dur);
    expect(result.transitions.filter((entry) => /font/.test(entry.property))).toEqual([]);
    await finishAll(page);
    await settle(page);
  });

  test('without the pill, tint and label change in one frame', async ({ page }) => {
    await open(page, 'shell.html');
    const accent = await colourOf(page, '--ds-on-accent');
    const state = await page.evaluate(() => new Promise((resolve) => {
      for (const indicator of window.fixtureIndicators) indicator.destroy();
      const items = [...document.querySelectorAll('#drawer-list .ds-drawer__item')];
      items[0].removeAttribute('aria-current');
      items[3].setAttribute('aria-current', 'page');
      requestAnimationFrame(() => {
        const cs = getComputedStyle(items[3]);
        resolve({ color: cs.color, svg: getComputedStyle(items[3].querySelector('svg')).color, background: cs.backgroundColor, running: items[3].getAnimations({ subtree: true }).filter((animation) => !animation.effect.pseudoElement).length });
      });
    }));
    expect(state.color).toBe(accent);
    expect(state.svg).toBe(accent);
    expect(state.background).toBe(await colourOf(page, '--ds-accent'));
    expect(state.running).toBe(0);
  });

  test('in the modal drawer the label changes at once', async ({ page }) => {
    await open(page, 'shell.html', 800);
    const accent = await colourOf(page, '--ds-on-accent');
    const state = await page.evaluate(() => {
      const items = [...document.querySelectorAll('#drawer-list .ds-drawer__item')];
      items[0].removeAttribute('aria-current');
      items[3].setAttribute('aria-current', 'page');
      window.fixtureIndicators[0].update();
      const colours = items[3].getAnimations({ subtree: true }).filter((animation) => animation.transitionProperty === 'color').length;
      return { colours, color: getComputedStyle(items[3]).color };
    });
    expect(state).toEqual({ colours: 0, color: accent });
  });

  test('a track of .ds-btn toggles: only the pill paints the selection, labels on its timing', async ({ page }) => {
    await open(page, 'controls.html');
    await page.evaluate(() => {
      const track = document.createElement('div');
      track.id = 'x-toggles';
      track.style.display = 'inline-flex';
      track.innerHTML = ['Day', 'Week', 'Month', 'Year'].map((text, index) => `<button class="ds-btn ds-btn--sm ds-btn--text" type="button" aria-pressed="${index ? 'false' : 'true'}">${text}</button>`).join('');
      document.querySelector('.ds-theme').append(track);
      window.xToggles = DS.indicator.createIndicator(track, { active: '[aria-pressed="true"]', className: 'x-toggles__pill' });
    });
    await settle(page);
    const result = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('#x-toggles > .ds-btn')];
      const target = buttons[3];
      // The pressed twin keeps the label on the pill's timing too.
      target.classList.add('ds-pressed');
      buttons[0].setAttribute('aria-pressed', 'false');
      target.setAttribute('aria-pressed', 'true');
      window.xToggles.update();
      for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
      const track = target.parentElement;
      const dur = parseFloat(track.style.getPropertyValue('--ds-indicator-dur'));
      const colours = (el) => el.getAnimations().filter((animation) => animation.transitionProperty === 'color').map((animation) => animation.effect.getTiming().duration);
      const backgrounds = buttons.flatMap((el) => el.getAnimations().filter((animation) => /^background|^border-.*-color$/.test(animation.transitionProperty || '')).map((animation) => animation.transitionProperty));
      const cs = getComputedStyle(target);
      return { dur, from: colours(buttons[0]), to: colours(target), backgrounds, background: cs.backgroundColor, border: cs.borderTopColor };
    });
    expect(result.dur).toBeGreaterThan(0);
    expect(result.from).toHaveLength(1);
    expect(result.from[0]).toBeCloseTo(result.dur, 1);
    expect(result.to).toHaveLength(1);
    expect(result.to[0]).toBeCloseTo(result.dur, 1);
    expect(result.backgrounds).toEqual([]);
    expect(result.background).toBe('rgba(0, 0, 0, 0)');
    expect(result.border).toBe('rgba(0, 0, 0, 0)');
    await finishAll(page);
    await settle(page);
    // Outside a track the toggle keeps its tint.
    await page.evaluate(() => {
      window.xToggles.destroy();
      document.querySelector('#x-toggles > .ds-pressed').classList.remove('ds-pressed');
    });
    await finishAll(page);
    const tint = await page.locator('#x-toggles > .ds-btn >> nth=3').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(tint).toBe(await colourOf(page, '--ds-accent'));
  });

  test('a segmented switch with data-label keeps its width', async ({ page }) => {
    await open(page, 'controls.html');
    await page.evaluate(() => {
      const nav = document.createElement('nav');
      nav.className = 'ds-segmented';
      nav.id = 'x-labelled';
      nav.setAttribute('aria-label', 'Mode');
      nav.innerHTML = ['Live', 'Reports and exports'].map((text, index) => `<a class="ds-segmented__option" href="#${index}" data-label="${text}"${index ? '' : ' aria-current="true"'}>${text}</a>`).join('');
      document.querySelector('.ds-theme').append(nav);
      window.xLabelled = DS.indicator.createIndicator(nav, { active: '[aria-current="true"]', className: 'ds-segmented__indicator' });
    });
    await settle(page);
    const widths = () => page.evaluate(() => [...document.querySelectorAll('#x-labelled, #x-labelled > a')].map((el) => el.getBoundingClientRect().width));
    const before = await widths();
    await page.evaluate(() => {
      const [first, second] = document.querySelectorAll('#x-labelled > a');
      first.removeAttribute('aria-current');
      second.setAttribute('aria-current', 'true');
    });
    await settle(page);
    expect(await page.locator('#x-labelled > a >> nth=1').getAttribute('aria-current')).toBe('true');
    expect(await widths()).toEqual(before);
  });

  test('a segmented option without data-label keeps its content in a row and the switch its height', async ({ page }) => {
    await open(page, 'controls.html');
    const result = await page.evaluate(() => {
      const make = (html) => {
        const nav = document.createElement('nav');
        nav.className = 'ds-segmented';
        nav.setAttribute('aria-label', 'Mode');
        nav.innerHTML = html;
        document.querySelector('.ds-theme').append(nav);
        return nav;
      };
      const plain = make('<a class="ds-segmented__option" href="#a" aria-current="true">Live</a><a class="ds-segmented__option" href="#b">Admin</a>');
      const rich = make('<a class="ds-segmented__option" href="#a" aria-current="true"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24"></rect></svg>Live</a>'
        + '<a class="ds-segmented__option" href="#b">Admin <span>3</span></a>');
      const [first, second] = rich.querySelectorAll('a');
      const textRect = (node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        return range.getBoundingClientRect();
      };
      const icon = first.querySelector('svg').getBoundingClientRect();
      const live = textRect(first.lastChild);
      const admin = textRect(second.firstChild);
      const badge = second.querySelector('span').getBoundingClientRect();
      const middle = (rect) => rect.top + rect.height / 2;
      return {
        direction: getComputedStyle(first).flexDirection,
        plain: plain.getBoundingClientRect().height,
        rich: rich.getBoundingClientRect().height,
        iconBeforeText: icon.right <= live.left + 0.5,
        iconRow: Math.abs(middle(icon) - middle(live)),
        badgeAfterText: admin.right <= badge.left + 0.5,
        badgeRow: Math.abs(middle(admin) - middle(badge)),
      };
    });
    expect(result.direction).toBe('row');
    expect(result.rich).toBeCloseTo(result.plain, 0);
    expect(result.iconBeforeText).toBe(true);
    expect(result.iconRow).toBeLessThan(2);
    expect(result.badgeAfterText).toBe(true);
    expect(result.badgeRow).toBeLessThan(2);
  });
});

test.describe('top bar and view', () => {
  test('the top bar tints to --ds-surface-high while the view is scrolled: on the scroll where timelines exist, else over --ds-dur-fast', async ({ page }) => {
    await open(page, 'shell.html');
    const bar = page.locator('.ds-topbar');
    const view = page.locator('#main');
    const high = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.backgroundColor = 'var(--ds-surface-high)';
      document.querySelector('.ds-theme').append(probe);
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return value;
    });
    // The tint is a layer behind the bar's content; the bar itself stays clear.
    const tint = () => bar.evaluate((el) => {
      const layer = getComputedStyle(el, '::before');
      return { bar: getComputedStyle(el).backgroundColor, color: layer.backgroundColor, opacity: Number(layer.opacity) };
    });
    expect(await tint()).toEqual({ bar: 'rgba(0, 0, 0, 0)', color: high, opacity: 0 });
    const frames = () => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    if (await page.evaluate(() => CSS.supports('timeline-scope: none'))) {
      // Scroll-driven: the tint follows the view's scroll over its first 8px, and data-scrolled changes nothing.
      for (const [top, opacity] of [[4, 0.5], [8, 1], [120, 1], [0, 0]]) {
        await view.evaluate((el, value) => { el.scrollTop = value; }, top);
        await frames();
        expect((await tint()).opacity, `scrollTop ${top}`).toBeCloseTo(opacity, 1);
      }
      await page.evaluate(() => document.getElementById('app').setAttribute('data-scrolled', ''));
      await frames();
      expect((await tint()).opacity).toBe(0);
      return;
    }
    await page.evaluate(() => {
      document.getElementById('app').setAttribute('data-scrolled', '');
      for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
    });
    const fade = (await timeline(bar, { subtree: true })).find((entry) => entry.pseudoElement === '::before' && entry.name === 'opacity');
    expect(fade.duration).toBe(await bar.evaluate((el) => DS.motion.motionDuration(el, '--ds-dur-fast')));
    await finishAll(page);
    expect(await tint()).toEqual({ bar: 'rgba(0, 0, 0, 0)', color: high, opacity: 1 });
  });

  test('filled toolbar fields keep their container on the tinted bar', async ({ page }) => {
    await open(page, 'shell.html');
    await page.evaluate(() => {
      document.querySelector('.ds-topbar .ds-brand').insertAdjacentHTML('afterend', '<div class="ds-search"><input class="ds-input" id="x-search" type="search" aria-label="Search"></div>'
        + '<select class="ds-input ds-input--filled" id="x-filled" aria-label="Theme"><option>Default</option></select>');
    });
    // The tint's colour (its layer, .ds-topbar::before; scroll-driven engines show it by the scroll position).
    const read = () => page.evaluate(() => ({
      bar: getComputedStyle(document.querySelector('.ds-topbar'), '::before').backgroundColor,
      search: getComputedStyle(document.getElementById('x-search')).backgroundColor,
      filled: getComputedStyle(document.getElementById('x-filled')).backgroundColor,
    }));
    const high = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.backgroundColor = 'var(--ds-surface-high)';
      document.querySelector('.ds-theme').append(probe);
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return value;
    });
    const rest = await read();
    expect(rest.search).toBe(high);
    expect(rest.filled).toBe(high);
    await page.evaluate(() => document.getElementById('app').setAttribute('data-scrolled', ''));
    await settle(page);
    const tinted = await read();
    expect(tinted.bar).toBe(high);
    expect(tinted.search).not.toBe(tinted.bar);
    expect(tinted.filled).not.toBe(tinted.bar);
    // A focused search keeps its own look on the tint.
    await page.locator('#x-search').focus();
    await settle(page);
    expect((await read()).search).toBe(await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.backgroundColor = 'var(--ds-surface)';
      document.querySelector('.ds-theme').append(probe);
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return value;
    }));
  });

  test('a brand of only a name starts its text on the drawer\'s icon edge, with and without the menu button first; a mark centres on the axis (2.1)', async ({ page }) => {
    await open(page, 'shell.html');
    /** The name's and the mark's left edges against the bar, and the icon axis resolved through a probe. */
    const measure = () => page.evaluate(() => {
      const app = document.getElementById('app');
      const probe = document.createElement('div');
      probe.style.cssText = 'position: absolute; width: var(--ds-drawer-icon-axis); height: 0';
      app.append(probe);
      const axis = probe.getBoundingClientRect().width;
      probe.remove();
      const bar = document.querySelector('.ds-topbar').getBoundingClientRect().left;
      const name = document.querySelector('.ds-topbar .ds-brand__name').getBoundingClientRect().left;
      const mark = document.getElementById('fx-mark');
      return { axis, name: name - bar, mark: mark ? mark.getBoundingClientRect().left + mark.getBoundingClientRect().width / 2 - bar : null };
    });
    // The menu button first (shown only with the modal drawer, so hidden here).
    const first = await measure();
    expect(first.axis).toBeGreaterThan(20);
    expect(Math.abs(first.name - (first.axis - 10))).toBeLessThan(0.5);
    // The brand first.
    await page.evaluate(() => document.getElementById('menu').remove());
    const alone = await measure();
    expect(Math.abs(alone.name - (alone.axis - 10))).toBeLessThan(0.5);
    // A 32px mark before the name: the mark centres on the axis instead. A
    // new brand, as a page renders it (Firefox does not re-match the rule
    // when a child is inserted before the name later).
    await page.evaluate(() => {
      const brand = document.querySelector('.ds-topbar .ds-brand');
      const copy = brand.cloneNode(true);
      const mark = document.createElement('span');
      mark.id = 'fx-mark';
      mark.style.cssText = 'display: block; width: 32px; height: 32px';
      copy.prepend(mark);
      brand.replaceWith(copy);
    });
    const marked = await measure();
    expect(Math.abs(marked.mark - marked.axis)).toBeLessThan(0.5);
  });

  test('.ds-view keeps a stable scrollbar gutter', async ({ page }) => {
    await open(page, 'shell.html');
    const view = page.locator('#main');
    const supported = await page.evaluate(() => CSS.supports('scrollbar-gutter: stable'));
    if (supported) expect(await view.evaluate((el) => getComputedStyle(el).scrollbarGutter)).toBe('stable');
    const width = () => page.evaluate(() => document.querySelector('#main .ds-content').getBoundingClientRect().width);
    await page.evaluate(() => {
      const stack = document.querySelector('#main .ds-stack');
      [...stack.children].slice(1).forEach((card) => card.remove());
    });
    const short = await width();
    expect(await view.evaluate((el) => el.scrollHeight <= el.clientHeight)).toBe(true);
    await page.evaluate(() => {
      const stack = document.querySelector('#main .ds-stack');
      for (let i = 0; i < 12; i += 1) stack.append(stack.firstElementChild.cloneNode(true));
    });
    expect(await view.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    if (supported) expect(await width()).toBe(short);
  });

  test('the documented view swap never shows the new view at full opacity before its entrance, and ends on the latest', async ({ page }) => {
    await open(page, 'shell.html');
    const result = await page.evaluate(() => new Promise((resolve) => {
      // The sequence of docs/components.md (App frame), as a page writes it.
      let swaps = 0;
      async function swapView(view, html) {
        const run = ++swaps;
        view.classList.add('ds-view--leaving');
        await DS.motion.settled(view.firstElementChild, { event: 'transitionend', property: 'opacity' });
        if (run !== swaps) return;
        view.innerHTML = html;
        view.classList.remove('ds-view--leaving');
        DS.motion.enter(view.firstElementChild, 'swap');
      }
      const view = document.getElementById('main');
      const frames = [];
      // The first look at B, in the microtask after the swap's own task
      // (before any frame, however busy the machine is).
      let firstB = null;
      new MutationObserver(() => {
        const child = view.firstElementChild;
        if (firstB || child?.getAttribute('data-page') !== 'B') return;
        firstB = {
          opacity: Number(getComputedStyle(child).opacity),
          entering: child.getAnimations().some((animation) => animation.animationName === 'ds-fade-in'),
        };
      }).observe(view, { childList: true });
      const page = (name) => `<div class="ds-content" data-page="${name}"><div class="ds-page"><h1 class="ds-page-head__title">${name}</h1></div></div>`;
      const record = () => {
        const child = view.firstElementChild;
        frames.push({ page: child.getAttribute('data-page') || 'first', opacity: Number(getComputedStyle(child).opacity) });
      };
      // The second navigation comes while the first still waits for its fade
      // (in the same task: a frame callback could come after the 100ms fade
      // on a busy machine, and the first swap would rightly finish).
      swapView(view, page('A'));
      record();
      swapView(view, page('B'));
      const start = performance.now();
      const frame = () => {
        record();
        if (performance.now() - start < 1500) requestAnimationFrame(frame);
        else resolve({ frames, firstB, children: view.children.length, last: view.firstElementChild.getAttribute('data-page') });
      };
      requestAnimationFrame(frame);
    }));
    expect(result.last).toBe('B');
    expect(result.children).toBe(1);
    expect(result.frames.some((frame) => frame.page === 'A')).toBe(false);
    expect(result.firstB, 'B was inserted').not.toBeNull();
    expect(result.firstB.entering, 'B enters with ds-fade-in').toBe(true);
    expect(result.firstB.opacity).toBeLessThan(0.05);
    expect(result.frames.at(-1).opacity).toBe(1);
  });
});

test.describe('styleguide navigation', () => {
  test('a drawer link sets its item at once and the pill glides there once', async ({ page }) => {
    await page.goto('/styleguide/index.html');
    await ready(page);
    await page.mouse.move(1, 1);
    await settle(page, { timeout: 5000 });
    await page.locator('#sg-nav a[href="#overview"]').click();
    await page.waitForFunction(() => document.querySelector('#sg-nav a[href="#overview"]').getAttribute('aria-current') === 'page');
    await settle(page, { timeout: 5000 });
    await page.evaluate(() => {
      window.sgChanges = [];
      window.sgGlides = 0;
      new MutationObserver((records) => {
        for (const record of records) {
          if (record.target.getAttribute('aria-current') === 'page') window.sgChanges.push(record.target.getAttribute('href'));
        }
      }).observe(document.getElementById('sg-nav'), { subtree: true, attributeFilter: ['aria-current'] });
      const pill = document.querySelector('#sg-nav > .ds-indicator');
      new MutationObserver(() => { if (pill.hasAttribute('data-glide')) window.sgGlides += 1; })
        .observe(pill, { attributeFilter: ['data-glide'] });
    });
    await page.locator('#sg-nav a[href="#icons"]').click();
    // The smooth scroll ends and the scroll-spy wakes up again.
    await page.waitForFunction(() => new Promise((resolve) => {
      const view = document.getElementById('main');
      const top = view.scrollTop;
      setTimeout(() => resolve(top > 0 && view.scrollTop === top), 300);
    }), null, { timeout: 8000 });
    await page.waitForTimeout(400);
    await settle(page, { timeout: 5000 });
    expect(await page.evaluate(() => window.sgChanges)).toEqual(['#icons']);
    expect(await page.evaluate(() => window.sgGlides)).toBe(1);
  });
});
