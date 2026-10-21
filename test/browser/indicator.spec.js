/**
 * DS.indicator (1.2.0) in real engines: the pill is a box with a clip-path
 * whose edges glide. A glide stretches toward its target (the leading edge
 * moves while the trailing edge still waits), passes the target by at most
 * 5 % of the travel (never on the cubic fallback) while the trailing edge
 * never passes its target, and collapses into the rest state, in real time
 * within its time + lag + 50ms; its time comes from travelDuration() and stretches with
 * ?speed. A second target mid-glide continues from the painted pill. The
 * first placement and a resize jump. The indicator follows aria-current by
 * itself (not with observe: false), keeps working after
 * DS.dom.morphHtml(), grows from the centre after an empty state and
 * contracts when its item goes (an item that comes back mid-contraction
 * turns it from where it is), copies a project class's border-radius,
 * and destroy() leaves nothing behind.
 *
 * Motion is read from computed values with every animation paused in the
 * task that starts it (no screenshots here: Playwright's WebKit screenshot
 * ends running custom-property transitions; the mid-glide and overshoot
 * shots are in frames.spec.js, Chromium only).
 */
import { test, expect } from './base-test.js';
import { expectContinuous, ready, setSpeed, settle } from './helpers/motion.js';

const FIXTURES = '/test/browser/fixtures/';

async function open(page, name, width = 1000) {
  await page.setViewportSize({ width, height: 800 });
  await page.goto(FIXTURES + name);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

/**
 * Page side: helpers on window.fxPill. paint(indicator) is the painted pill
 * in track coordinates (the box minus the computed insets), rect(track,
 * item) an item in the same coordinates, edges(indicator) the running edge
 * transitions.
 */
function install(page) {
  return page.evaluate(() => {
    const EDGES = ['--ds-indicator-t', '--ds-indicator-r', '--ds-indicator-b', '--ds-indicator-l'];
    window.fxPill = {
      paint(indicator) {
        const cs = getComputedStyle(indicator);
        const own = (name) => parseFloat(indicator.style.getPropertyValue(name)) || 0;
        const edge = (name) => parseFloat(cs.getPropertyValue(name)) || 0;
        const x = own('--ds-indicator-x');
        const y = own('--ds-indicator-y');
        return {
          left: x + edge('--ds-indicator-l'),
          top: y + edge('--ds-indicator-t'),
          right: x + own('--ds-indicator-w') - edge('--ds-indicator-r'),
          bottom: y + own('--ds-indicator-h') - edge('--ds-indicator-b'),
          opacity: Number(cs.opacity),
        };
      },
      rect(track, item) {
        const t = track.getBoundingClientRect();
        const r = item.getBoundingClientRect();
        const left = r.left - t.left - track.clientLeft + track.scrollLeft;
        const top = r.top - t.top - track.clientTop + track.scrollTop;
        return { left, top, right: left + r.width, bottom: top + r.height };
      },
      edges(indicator) {
        return indicator.getAnimations().filter((animation) => EDGES.includes(animation.transitionProperty));
      },
      pauseAll() {
        for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
      },
      seek(time) {
        for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.currentTime = time;
      },
      /**
       * Ends the edge transitions (the collapse to rest follows in a
       * microtask) and plays the rest. `edges`: the transitions to end, for
       * those that a seek moved into their after phase (getAnimations() no
       * longer lists them, and paused they never finish by themselves).
       */
      finish(indicator, edges = []) {
        for (const animation of [...edges, ...indicator.getAnimations()]) animation.finish();
        for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) if (animation.playState === 'paused') animation.play();
      },
    };
  });
}

/** Two animation frames. */
function frames(page) {
  return page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

/** The rest state of a track's indicator against its active item. */
function restState(page, track, active) {
  return page.evaluate(([trackSelector, activeSelector]) => {
    const element = document.querySelector(trackSelector);
    const indicator = element.querySelector(':scope > .ds-indicator');
    const cs = getComputedStyle(indicator);
    const painted = fxPill.paint(indicator);
    const item = fxPill.rect(element, element.querySelector(activeSelector));
    return {
      glide: indicator.hasAttribute('data-glide'),
      dir: indicator.hasAttribute('data-dir'),
      instant: indicator.classList.contains('ds-indicator--instant'),
      insets: ['t', 'r', 'b', 'l'].map((edge) => cs.getPropertyValue(`--ds-indicator-${edge}`).trim()),
      offset: ['left', 'top', 'right', 'bottom'].map((side) => Math.round(painted[side] - item[side])),
      box: Math.round(parseFloat(indicator.style.getPropertyValue('--ds-indicator-h')) - (item.bottom - item.top)),
    };
  }, [track, active]);
}

const REST = { glide: false, dir: false, instant: true, insets: ['0px', '0px', '0px', '0px'], offset: [0, 0, 0, 0], box: 0 };

test('a glide stretches lead-first, passes its target by at most 5 % and lands in the rest state', async ({ page, dsFallback }) => {
  await open(page, 'shell.html');
  await install(page);
  const run = await page.evaluate(() => {
    const track = document.getElementById('drawer-list');
    const indicator = track.querySelector('.ds-indicator');
    const item = track.querySelector('[href="#settings"]');
    const from = fxPill.paint(indicator);
    item.click();
    const edges = fxPill.edges(indicator);
    fxPill.pauseAll();
    const to = fxPill.rect(track, item);
    const timing = Object.fromEntries(edges.map((animation) => [animation.transitionProperty, animation.effect.getTiming()]));
    const lead = timing['--ds-indicator-b'];
    const trail = timing['--ds-indicator-t'];
    const samples = [];
    const end = trail.delay + trail.duration;
    for (let time = 0; time < end; time += end / 60) {
      fxPill.seek(time);
      samples.push({ time, ...fxPill.paint(indicator) });
    }
    const distance = Math.hypot(((to.top + to.bottom) - (from.top + from.bottom)) / 2, ((to.left + to.right) - (from.left + from.right)) / 2);
    fxPill.finish(indicator, edges);
    return {
      from, to, samples, dir: indicator.dataset.dir, glide: indicator.hasAttribute('data-glide'),
      lead: { duration: lead.duration, delay: lead.delay },
      trail: { duration: trail.duration, delay: trail.delay },
      dur: parseFloat(track.style.getPropertyValue('--ds-indicator-dur')),
      expected: DS.motion.travelDuration(track, distance),
      lag: DS.motion.motionDuration(track, '--ds-dur-micro'),
      inside: parseFloat(indicator.style.getPropertyValue('--ds-indicator-y')) + parseFloat(indicator.style.getPropertyValue('--ds-indicator-h')) <= track.scrollHeight,
    };
  });
  expect(run.glide).toBe(true);
  expect(run.dir).toBe('down');
  expect(run.dur).toBeCloseTo(run.expected, 3);
  expect(run.lead.duration).toBeCloseTo(run.expected, 3);
  expect(run.lead.delay).toBe(0);
  expect(run.trail.duration).toBeCloseTo(run.expected, 3);
  expect(run.trail.delay).toBeCloseTo(run.lag, 3);
  expect(run.inside, 'the box adds no scroll range').toBe(true);
  // Lead first: before the trailing edge's delay ends, only the bottom edge moved.
  const early = run.samples.filter((entry) => entry.time > 0 && entry.time < run.lag);
  expect(early.length).toBeGreaterThan(0);
  for (const entry of early) expect(entry.top).toBeCloseTo(run.from.top, 1);
  expect(early.at(-1).bottom - run.from.bottom).toBeGreaterThan(1);
  // The overshoot: visible on the spring, never on the cubic fallback.
  const travel = run.to.bottom - run.from.bottom;
  const pass = Math.max(...run.samples.map((entry) => entry.bottom)) - run.to.bottom;
  if (dsFallback) expect(pass).toBeLessThanOrEqual(0.5);
  else expect(pass).toBeGreaterThan(0);
  expect(pass).toBeLessThanOrEqual(0.05 * travel + 1);
  // The trailing edge never springs past its target: the pill is never
  // shorter than the item and never slides off it (only the lead overshoots).
  const height = run.to.bottom - run.to.top;
  for (const entry of run.samples) {
    expect(entry.top, `trailing edge at ${entry.time}ms`).toBeLessThanOrEqual(run.to.top + 0.5);
    expect(entry.bottom - entry.top, `height at ${entry.time}ms`).toBeGreaterThanOrEqual(height - 1);
  }
  await frames(page);
  expect(await restState(page, '#drawer-list', '[aria-current="page"]')).toEqual(REST);
});

test('a glide lands in the rest state within its time + lag + 50ms, in real time', async ({ page }) => {
  await open(page, 'shell.html');
  await install(page);
  // Nothing is finished or seeked: the collapse is seen by an observer of
  // data-glide, timed on the document timeline from the edges' start (so
  // neither the click nor the reading round trip counts). A frame that comes
  // late can only delay the collapse by its own lateness: the gap before it
  // is recorded and allowed for.
  const run = await page.evaluate(() => new Promise((resolve) => {
    const track = document.getElementById('drawer-list');
    const indicator = track.querySelector('.ds-indicator');
    const item = track.querySelector('[href="#settings"]');
    const frameTimes = [];
    let watching = true;
    const frame = () => {
      frameTimes.push(document.timeline.currentTime);
      if (watching) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    item.click();
    const edges = fxPill.edges(indicator);
    const dur = parseFloat(track.style.getPropertyValue('--ds-indicator-dur'));
    const lag = DS.motion.motionDuration(track, '--ds-dur-micro');
    // The start time is set once the edges leave their pending state (the
    // collapse cancels them, which clears it again).
    let start = null;
    Promise.all(edges.map((animation) => animation.ready)).then(() => {
      start = Math.min(...edges.map((animation) => animation.startTime));
    });
    new MutationObserver((records, observer) => {
      if (indicator.hasAttribute('data-glide')) return;
      observer.disconnect();
      watching = false;
      const now = document.timeline.currentTime;
      const cs = getComputedStyle(indicator);
      const painted = fxPill.paint(indicator);
      const rect = fxPill.rect(track, item);
      const previous = frameTimes.filter((time) => time < now).at(-1) ?? now;
      resolve({
        edges: edges.length,
        elapsed: start === null ? null : now - start,
        gap: now - previous,
        dur,
        lag,
        insets: ['t', 'r', 'b', 'l'].map((edge) => cs.getPropertyValue(`--ds-indicator-${edge}`).trim()),
        offset: ['left', 'top', 'right', 'bottom'].map((side) => Math.round(painted[side] - rect[side])),
      });
    }).observe(indicator, { attributeFilter: ['data-glide'] });
  }));
  expect(run.edges).toBe(2);
  expect(run.elapsed).not.toBeNull();
  expect(run.elapsed).toBeGreaterThanOrEqual(run.dur + run.lag - 1);
  expect(run.elapsed).toBeLessThanOrEqual(run.dur + run.lag + Math.max(50, run.gap));
  expect(run.insets).toEqual(['0px', '0px', '0px', '0px']);
  expect(run.offset).toEqual([0, 0, 0, 0]);
});

test('a neighbour hop takes --ds-dur-medium, a jump across the list up to --ds-dur-slow, both stretched by ?speed', async ({ page }) => {
  await open(page, 'controls.html');
  /** Hop and jump in the drawer list, from the travel times of the edges. */
  const measure = async () => {
    await install(page);
    return page.evaluate(() => {
      const track = document.getElementById('drawer-list');
      const indicator = track.querySelector(':scope > .ds-indicator');
      const go = (href) => {
        track.querySelector(`[href="${href}"]`).click();
        const duration = Math.max(...fxPill.edges(indicator).map((animation) => animation.effect.getTiming().duration));
        fxPill.finish(indicator);
        return duration;
      };
      return {
        hop: go('#devices'),
        jump: go('#settings'),
        medium: DS.motion.motionDuration(track, '--ds-dur-medium'),
        slow: DS.motion.motionDuration(track, '--ds-dur-slow'),
      };
    });
  };
  const durations = await measure();
  expect(durations.hop).toBeGreaterThan(durations.medium);
  expect(durations.hop).toBeLessThan(durations.medium + (durations.slow - durations.medium) / 4);
  expect(durations.jump).toBeGreaterThan(durations.hop);
  expect(durations.jump).toBeLessThanOrEqual(durations.slow);
  // Ten times slower at ?speed=0.1 (--ds-time-scale), the same distances.
  await setSpeed(page, 0.1);
  await page.mouse.move(1, 1);
  await settle(page, { timeout: 30000 });
  const slow = await measure();
  expect(slow.medium).toBeCloseTo(durations.medium * 10, 3);
  expect(slow.slow).toBeCloseTo(durations.slow * 10, 3);
  expect(slow.hop).toBeCloseTo(durations.hop * 10, 1);
  expect(slow.jump).toBeCloseTo(durations.jump * 10, 1);
});

test('a second target mid-glide continues from the painted pill', async ({ page }) => {
  await open(page, 'shell.html');
  await install(page);
  const result = await page.evaluate(() => {
    const track = document.getElementById('drawer-list');
    const indicator = track.querySelector('.ds-indicator');
    track.querySelector('[href="#settings"]').click();
    fxPill.pauseAll();
    fxPill.seek(DS.motion.motionDuration(track, '--ds-dur-fast'));
    const before = fxPill.paint(indicator);
    track.querySelector('[href="#devices"]').click();
    const after = fxPill.paint(indicator);
    const running = fxPill.edges(indicator).length;
    fxPill.pauseAll();
    return { before, after, running, dir: indicator.dataset.dir };
  });
  expect(result.running).toBeGreaterThan(0);
  expect(result.dir).toBe('up');
  for (const side of ['left', 'top', 'right', 'bottom']) expect(Math.abs(result.after[side] - result.before[side]), side).toBeLessThan(1);
  await page.evaluate(() => fxPill.finish(document.querySelector('#drawer-list > .ds-indicator')));
  await frames(page);
  expect(await restState(page, '#drawer-list', '[aria-current="page"]')).toEqual(REST);
});

test('the first placement and a window resize jump', async ({ page }) => {
  await open(page, 'shell.html');
  await install(page);
  await page.evaluate(() => {
    window.fxRuns = [];
    const indicator = document.querySelector('#drawer-list > .ds-indicator');
    indicator.addEventListener('transitionrun', (event) => window.fxRuns.push(event.propertyName));
  });
  expect(await restState(page, '#drawer-list', '[aria-current="page"]')).toEqual(REST);
  await page.setViewportSize({ width: 1100, height: 700 });
  await frames(page);
  await settle(page);
  expect(await page.evaluate(() => window.fxRuns)).toEqual([]);
  expect(await restState(page, '#drawer-list', '[aria-current="page"]')).toEqual(REST);
});

test('a change of aria-current moves the pill without update(); with observe: false it does not', async ({ page }) => {
  await open(page, 'shell.html');
  await install(page);
  const observed = await page.evaluate(async () => {
    const track = document.getElementById('drawer-list');
    const indicator = track.querySelector('.ds-indicator');
    track.querySelector('[aria-current]').removeAttribute('aria-current');
    track.querySelector('[href="#owners"]').setAttribute('aria-current', 'page');
    // After the observer's microtask its frame is requested first, so it has run by this one.
    await Promise.resolve();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const running = fxPill.edges(indicator).length;
    fxPill.finish(indicator);
    return { running, dir: indicator.dataset.dir };
  });
  expect(observed).toEqual({ running: 2, dir: 'down' });
  await frames(page);
  expect(await restState(page, '#drawer-list', '[aria-current="page"]')).toEqual(REST);

  const manual = await page.evaluate(async () => {
    const track = document.getElementById('drawer-list');
    window.fixtureIndicators.forEach((handle) => handle.destroy());
    const handle = DS.indicator.createIndicator(track, { active: '[aria-current="page"]', className: 'ds-drawer__indicator', observe: false });
    const indicator = track.querySelector(':scope > .ds-indicator');
    // The resize observer's first notification (a resize re-places the pill too) passes first.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    track.querySelector('[aria-current]').removeAttribute('aria-current');
    track.querySelector('[href="#devices"]').setAttribute('aria-current', 'page');
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const still = fxPill.edges(indicator).length;
    handle.update();
    const running = fxPill.edges(indicator).length;
    fxPill.finish(indicator);
    return { still, running };
  });
  expect(manual).toEqual({ still: 0, running: 2 });
});

test('DS.dom.morphHtml() keeps the pill, the next change glides by itself, and replaced items stay observed', async ({ page }) => {
  await open(page, 'controls.html');
  await install(page);
  await page.evaluate(() => {
    document.querySelector('.ds-theme').insertAdjacentHTML('beforeend', '<div id="x-track" style="position: relative; display: flex; gap: 4px; width: 480px">'
      + '<button class="ds-btn ds-btn--sm" type="button" aria-pressed="true">Day</button><button class="ds-btn ds-btn--sm" type="button" aria-pressed="false">Week</button></div>');
    window.xIndicator = DS.indicator.createIndicator(document.getElementById('x-track'), { active: '[aria-pressed="true"]', className: 'ds-segmented__indicator' });
  });
  await frames(page);
  const result = await page.evaluate(async () => {
    const track = document.getElementById('x-track');
    const indicator = track.querySelector(':scope > .ds-indicator');
    // New items (links instead of buttons), the second one active: no update().
    DS.dom.morphHtml(track, ['Day', 'Week', 'Month'].map((label) => `<a class="ds-btn ds-btn--sm" href="#${label}" aria-pressed="${label === 'Week'}">${label}</a>`).join(''));
    await Promise.resolve();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const kept = track.firstElementChild === indicator && track.querySelectorAll('.ds-indicator').length === 1;
    const running = fxPill.edges(indicator).length;
    fxPill.finish(indicator);
    return { kept, running, dir: indicator.dataset.dir };
  });
  expect(result).toEqual({ kept: true, running: 2, dir: 'right' });
  await frames(page);
  expect(await restState(page, '#x-track', '[aria-pressed="true"]')).toEqual(REST);
  // A badge in the new first item pushes the active one along: the resize observer follows the new items.
  await page.evaluate(() => {
    document.querySelector('#x-track a').insertAdjacentHTML('beforeend', '<span class="ds-status ds-status--warning">12 new</span>');
  });
  await frames(page);
  await settle(page);
  expect(await restState(page, '#x-track', '[aria-pressed="true"]')).toEqual(REST);
});

test('without an active item the pill contracts and fades; the next one grows from its centre', async ({ page }) => {
  await open(page, 'shell.html');
  await install(page);
  const result = await page.evaluate(() => {
    const track = document.getElementById('drawer-list');
    const indicator = track.querySelector('.ds-indicator');
    const handle = window.fixtureIndicators[0];
    const item = track.querySelector('[href="#tickets"]');
    track.querySelector('[aria-current]').removeAttribute('aria-current');
    handle.update();
    const leave = fxPill.edges(indicator).map((animation) => ({ edge: animation.transitionProperty, duration: animation.effect.getTiming().duration }));
    const empty = indicator.hasAttribute('data-empty');
    fxPill.finish(indicator);
    item.setAttribute('aria-current', 'page');
    handle.update();
    fxPill.pauseAll();
    const start = fxPill.paint(indicator);
    const rect = fxPill.rect(track, item);
    return { leave, empty, start, rect, fast: DS.motion.motionDuration(track, '--ds-dur-fast') };
  });
  expect(result.empty).toBe(true);
  expect(result.leave.map((entry) => entry.edge).sort()).toEqual(['--ds-indicator-l', '--ds-indicator-r']);
  for (const entry of result.leave) expect(entry.duration).toBe(result.fast);
  const centre = (result.rect.left + result.rect.right) / 2;
  expect(result.start.left).toBeCloseTo(centre, 0);
  expect(result.start.right).toBeCloseTo(centre, 0);
  expect(result.start.opacity).toBe(0);
  expect(result.start.top).toBeCloseTo(result.rect.top, 0);
  await page.evaluate(() => fxPill.finish(document.querySelector('#drawer-list > .ds-indicator')));
  await frames(page);
  await settle(page);
  expect(await restState(page, '#drawer-list', '[aria-current="page"]')).toEqual(REST);
});

test('an item that comes back while the pill contracts turns it from where it is painted', async ({ page }) => {
  await open(page, 'shell.html');
  await install(page);
  const result = await page.evaluate(() => {
    const track = document.getElementById('drawer-list');
    const indicator = track.querySelector('.ds-indicator');
    const handle = window.fixtureIndicators[0];
    const item = track.querySelector('[aria-current="page"]');
    item.removeAttribute('aria-current');
    handle.update();
    fxPill.pauseAll();
    // Partway into the contraction (--ds-dur-fast).
    const into = DS.motion.motionDuration(track, '--ds-dur-fast') * 0.3;
    fxPill.seek(into);
    const before = fxPill.paint(indicator);
    item.setAttribute('aria-current', 'page');
    handle.update();
    const after = fxPill.paint(indicator);
    fxPill.pauseAll();
    const edges = fxPill.edges(indicator);
    const end = Math.max(...edges.map((animation) => animation.effect.getTiming().delay + animation.effect.getTiming().duration));
    const samples = [];
    for (let time = 0; time <= end; time += end / 40) {
      fxPill.seek(time);
      samples.push(fxPill.paint(indicator));
    }
    fxPill.finish(indicator, edges);
    return { before, after, samples, rect: fxPill.rect(track, item), empty: indicator.hasAttribute('data-empty') };
  });
  expect(result.empty).toBe(false);
  // Still a wide, mostly opaque pill: the old way snapped it to a sliver.
  expect(result.before.right - result.before.left).toBeGreaterThan((result.rect.right - result.rect.left) / 2);
  expect(result.before.opacity).toBeGreaterThan(0.5);
  for (const side of ['left', 'top', 'right', 'bottom']) expect(Math.abs(result.after[side] - result.before[side]), side).toBeLessThan(1);
  expect(Math.abs(result.after.opacity - result.before.opacity)).toBeLessThan(0.05);
  const series = [result.before, ...result.samples];
  for (const side of ['left', 'right']) expectContinuous(series.map((entry) => entry[side]), { floor: 2 });
  // The fade turns back from where it was: it only rises, to full opacity.
  const opacity = series.map((entry) => entry.opacity);
  opacity.slice(1).forEach((value, index) => expect(value).toBeGreaterThanOrEqual(opacity[index] - 0.01));
  expect(opacity.at(-1)).toBeCloseTo(1, 2);
  await frames(page);
  await settle(page);
  expect(await restState(page, '#drawer-list', '[aria-current="page"]')).toEqual(REST);
});

test('a project class with only a border-radius keeps its corners', async ({ page }) => {
  await open(page, 'controls.html');
  const radii = await page.evaluate(() => {
    document.head.insertAdjacentHTML('beforeend', '<style>.x-pill { border-radius: 8px; background: var(--ds-accent); } .x-round { border-radius: 9999px; background: var(--ds-accent); }</style>');
    const make = (id, className) => {
      document.querySelector('.ds-theme').insertAdjacentHTML('beforeend', `<div id="${id}" style="position: relative; display: flex; width: 300px">`
        + '<button class="ds-btn ds-btn--sm" type="button" aria-pressed="true">Day</button><button class="ds-btn ds-btn--sm" type="button" aria-pressed="false">Week</button></div>');
      const track = document.getElementById(id);
      DS.indicator.createIndicator(track, { active: '[aria-pressed="true"]', className });
      const indicator = track.querySelector('.ds-indicator');
      return {
        radius: getComputedStyle(indicator).getPropertyValue('--ds-indicator-radius').trim(),
        half: `${track.querySelector('[aria-pressed="true"]').getBoundingClientRect().height / 2}px`,
        running: indicator.getAnimations().length,
      };
    };
    return { square: make('x-square', 'x-pill'), round: make('x-round', 'x-round') };
  });
  expect(radii.square).toEqual({ radius: '8px', half: radii.square.half, running: 0 });
  expect(radii.round).toEqual({ radius: radii.round.half, half: radii.round.half, running: 0 });
});

test('destroy() is final: a late loadingdone writes nothing', async ({ page }) => {
  await open(page, 'shell.html');
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const result = await page.evaluate(async () => {
    const track = document.getElementById('drawer-list');
    const handle = window.fixtureIndicators[0];
    track.querySelector('[href="#owners"]').click();
    handle.destroy();
    document.fonts.dispatchEvent(new Event('loadingdone'));
    track.querySelector('[aria-current]').removeAttribute('aria-current');
    track.querySelector('[href="#devices"]').setAttribute('aria-current', 'page');
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return {
      spans: track.querySelectorAll('.ds-indicator').length,
      hasClass: track.classList.contains('ds-has-indicator'),
      dur: track.style.getPropertyValue('--ds-indicator-dur'),
    };
  });
  expect(result).toEqual({ spans: 0, hasClass: false, dur: '' });
  expect(errors).toEqual([]);
});
