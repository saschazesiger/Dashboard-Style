/**
 * The Motion Lab (styleguide/motion.html) and the speed select both
 * styleguide pages share:
 *
 * - speed: the select sets --ds-time-scale on <html> (CSS durations and
 *   DS.motion.motionDuration() follow), stores its choice, and ?speed= wins
 *   over the stored choice without being stored;
 * - curves: every easing token has a plot, sampled from the browser; the
 *   effects curves stay within [0, 1] and are monotonic, the spatial spring
 *   peaks above 1 and at most 1.05 and settles (the cubic fallback in the
 *   `fallback` project peaks at 1); the ladder has a row per duration token,
 *   and its chips take token × time scale;
 * - coverage: every @keyframes name of the page's stylesheets (layer blocks
 *   included), every .ds-enter*, .ds-leave*, .ds-stagger, .ds-reveal*,
 *   .ds-collapsible, .ds-swap and .ds-icon-swap class and every function of
 *   DS.motion, DS.dom, DS.indicator, DS.ripple and DS.overlay appears in
 *   some data-lab-shows, apart from the named LAB_EXEMPT entries;
 * - demos, one test per section: every registry entry's Replay reaches
 *   data-lab-state="settled" within its ceiling (the timeline's, or its
 *   LONG_RUNS entry) with no console error and matches its timeline and
 *   settled shot; a reversible one, back at its start first when it has a
 *   reset(), rapid-toggles to the far state and back, with nothing inert or
 *   closing and no stray `hidden`; nothing is left
 *   over (motion classes, --ds-i, inert, --closing, the scroll lock);
 * - interruption: Reverse at 50% of every reversible demo is continuous in
 *   time at ?speed=0.1 (expectSmooth(), on frame timestamps);
 * - overlay table: every row of the docs/motion.md Overlays table against
 *   what the engine plays;
 * - stages: at 1280, 1000 and 390px no stage cuts its demo off, the open
 *   disclosure keeps its stage's height, and the skeleton keeps the height
 *   of the page that replaces it, its loading bar inside its pane;
 * - videos: with DS_VIDEO=1 only the "videos" tests run, one per section
 *   at ?speed=0.1 in every engine, each recording a video of its demos
 *   (Replay, then Reverse at 50% and Rapid toggle where reversible) into
 *   test-results/ for the review (never committed):
 *   DS_VIDEO=1 npm run test:browser -- lab.spec.js --project=chromium
 */
import { test, expect } from './base-test.js';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ready, settle, expectWithin, expectMonotonic, expectPeakAtMost, expectSettles, expectSmooth } from './helpers/motion.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const LAB = '/styleguide/motion.html';
const VIDEO = !!process.env.DS_VIDEO;
const STYLEGUIDE = '/styleguide/index.html';
// The expected plots and ladder rows come from the tokens themselves, in
// their order in src/tokens.css, so a new --ds-ease-* or --ds-dur-* token
// without a plot or a row fails.
const TOKEN_NAMES = [...new Set([...readFileSync(resolve(ROOT, 'src/tokens.css'), 'utf8').matchAll(/^\s*(--ds-(?:ease|dur)(?:-[a-z0-9-]+)?)\s*:/gm)].map((match) => match[1]))];
const EASINGS = TOKEN_NAMES.filter((name) => name.startsWith('--ds-ease-'));
const DURATIONS = TOKEN_NAMES.filter((name) => name.startsWith('--ds-dur-'));

let errors = [];

if (VIDEO) test.use({ video: { mode: 'on', size: { width: 1280, height: 800 } } });

test.beforeEach(({ page }, testInfo) => {
  test.skip(VIDEO !== testInfo.titlePath.includes('videos'), VIDEO ? 'DS_VIDEO=1 records the demo videos only' : 'the videos run with DS_VIDEO=1');
  errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(String(error)));
});

test.afterEach(() => {
  expect(errors, 'console errors').toEqual([]);
});

async function open(page, path = LAB) {
  await page.goto(path);
  await ready(page);
  await page.mouse.move(1, 1);
  // A stored slow speed stretches the first-render stagger too.
  await settle(page, { timeout: 20000 });
}

/** The time scale on <html> and motionDuration() of --ds-dur-medium there. */
function scale(page) {
  return page.evaluate(() => ({
    inline: document.documentElement.style.getPropertyValue('--ds-time-scale'),
    medium: Math.round(DS.motion.motionDuration(document.documentElement, '--ds-dur-medium')),
    speed: document.documentElement.getAttribute('data-sg-speed'),
    readout: document.getElementById('sg-speed-readout').hidden ? null : document.getElementById('sg-speed-readout').textContent,
  }));
}

test.describe('speed', () => {
  for (const path of [STYLEGUIDE, LAB]) {
    test(`${path}: the select slows every token, stores the choice, and ?speed= wins without being stored`, async ({ page }) => {
      await open(page, path);
      expect(await scale(page)).toEqual({ inline: '', medium: 250, speed: null, readout: null });
      await page.locator('#sg-speed-select').selectOption('0.1');
      expect(await scale(page)).toEqual({ inline: '10', medium: 2500, speed: '0.1', readout: 'Slow motion 0.1×' });
      expect(await page.evaluate(() => localStorage.getItem('ds-styleguide-speed'))).toBe('0.1');
      // The stored choice applies on the next load.
      await open(page, path);
      expect((await scale(page)).medium).toBe(2500);
      await expect(page.locator('#sg-speed-select')).toHaveValue('0.1');
      // ?speed= wins and is not stored.
      await open(page, `${path}?speed=0.5`);
      expect(await scale(page)).toEqual({ inline: '2', medium: 500, speed: '0.5', readout: 'Slow motion 0.5×' });
      expect(await page.evaluate(() => localStorage.getItem('ds-styleguide-speed'))).toBe('0.1');
      await page.locator('#sg-speed-select').selectOption('1');
      expect(await scale(page)).toEqual({ inline: '', medium: 250, speed: null, readout: null });
    });
  }

  test('a demo\'s CSS animation and the lab\'s ms labels follow the select', async ({ page }) => {
    await open(page);
    const label = page.locator('[data-lab-demo="enter-leave"] [data-lab-ms="--ds-dur-medium"]').first();
    await expect(label).toHaveText('250ms');
    await page.locator('#sg-speed-select').selectOption('0.25');
    await expect(label).toHaveText('1000ms');
    const slide = () => page.evaluate(() => {
      const card = document.getElementById('sg-motion-card');
      DS.motion.enter(card, 'slide');
      const out = card.getAnimations().map((animation) => Math.round(animation.effect.getComputedTiming().duration));
      DS.motion.cancel(card);
      return out;
    });
    expect(await slide()).toEqual([1400, 1400]);
    // At 0.1 every duration is ten times its speed-1 value, CSS and JS alike.
    await page.locator('#sg-speed-select').selectOption('1');
    const one = { css: await slide(), js: (await scale(page)).medium };
    await page.locator('#sg-speed-select').selectOption('0.1');
    expect({ css: await slide(), js: (await scale(page)).medium }).toEqual({ css: one.css.map((ms) => ms * 10), js: one.js * 10 });
  });
});

test.describe('curves and durations', () => {
  test('every easing token has a plot sampled from the browser', async ({ page, dsFallback }) => {
    await open(page);
    const plots = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-lab-curve]')].map((plot) => {
      const svg = plot.querySelector('[data-lab-peak]');
      return [plot.getAttribute('data-lab-curve'), { peak: Number(svg.getAttribute('data-lab-peak')), values: svg.getAttribute('data-lab-values').split(' ').map(Number) }];
    })));
    expect(Object.keys(plots).sort()).toEqual([...EASINGS].sort());
    for (const token of EASINGS) {
      const { values, peak } = plots[token];
      expect(values, token).toHaveLength(101);
      expect(values[0], token).toBeCloseTo(0, 3);
      expectSettles(values, 1, 0.001);
      if (token === '--ds-ease-spatial' && !dsFallback) {
        expect(peak, 'the spring overshoots').toBeGreaterThan(1.01);
        expectPeakAtMost(values, 1.05);
      } else {
        // Effects (and the spring's cubic fallback) stay in [0, 1] and never turn back.
        expectWithin(values, 0, 1, { tolerance: 1e-3 });
        expectMonotonic(values, { direction: 'up', tolerance: 1e-3 });
      }
    }
    if (!dsFallback) await expect(page.locator('#sg-lab-peak')).toHaveText(String(plots['--ds-ease-spatial'].peak.toFixed(3)));
  });

  test('the ladder has a row per duration token; its chips take token × time scale', async ({ page }) => {
    await page.goto(`${LAB}?speed=0.5`);
    await ready(page);
    const rows = await page.evaluate(() => [...document.querySelectorAll('[data-lab-demo="durations"] [data-lab-dur]')].map((chip) => chip.getAttribute('data-lab-dur')));
    expect(rows).toEqual(DURATIONS);
    const played = await page.evaluate(() => {
      const card = document.querySelector('[data-lab-demo="durations"]');
      card.querySelector('[data-lab="replay"]').click();
      const chips = [...card.querySelectorAll('.sg-ladder__chip')];
      const out = chips.map((chip) => Math.round(chip.getAnimations()[0].effect.getComputedTiming().duration));
      for (const animation of card.getAnimations({ subtree: true })) animation.finish();
      return out;
    });
    // 50 ... 600ms twice as long, then travelDuration() for 40, 160 and 480px.
    expect(played).toEqual([100, 200, 300, 400, 500, 700, 900, 1200, Math.round(2 * (250 + 100 * 40 / 480)), Math.round(2 * (250 + 100 * 160 / 480)), 700]);
  });
});

/** The lab's sections (window.SG_LAB_GROUPS), one test each. */
const GROUPS = ['foundations', 'utilities', 'keyframes', 'data', 'controls', 'navigation', 'overlays', 'feedback', 'views'];

/**
 * Primitives that need no demo of their own, each with its reason. The
 * coverage test fails for an entry that is no longer a primitive, so the
 * list cannot go stale.
 */
const LAB_EXEMPT = {
  'DS.dom.followViewport': 'layout follows the on-screen keyboard (--ds-viewport-height, data-ds-keyboard), no motion',
  'DS.dom.autosize': 'the height follows the text, never animated: no motion',
  'DS.dom.dropzone': 'events, no motion: the dropzone demo plays the data-ds-dragover look it writes',
  'DS.overlay.announce': 'live region, no motion',
  'DS.overlay.toastRegion': 'live region, no motion',
};

/** Closes what a demo left open (Rapid toggle ends on an open overlay) and waits until it is hidden. */
async function closeOverlays(page) {
  for (let i = 0; i < 4; i += 1) {
    const open = await page.evaluate(() => Boolean(document.querySelector('.ds-dialog[data-state="open"], .ds-sheet[data-state="open"]')));
    if (!open) break;
    await page.keyboard.press('Escape');
  }
  await page.waitForFunction(() => !document.querySelector('.ds-dialog[data-state], .ds-sheet[data-state], .ds-dialog--closing, .ds-sheet--closing'), null, { timeout: 15000 });
}

test.describe('coverage', () => {
  test('every keyframe, motion utility class and JS function appears in some demo', async ({ page }) => {
    await open(page);
    const found = await page.evaluate(() => {
      const keyframes = new Set();
      const classes = new Set();
      const UTILITY = /\.(ds-(?:enter|leave|stagger|reveal|collapsible|swap|icon-swap)(?:--[a-z0-9-]+)?)(?![\w-])/g;
      const walk = (rules) => {
        for (const rule of rules) {
          if (rule.type === CSSRule.KEYFRAMES_RULE) keyframes.add(rule.name);
          if (rule.selectorText) for (const match of rule.selectorText.matchAll(UTILITY)) classes.add(`.${match[1]}`);
          // Layer blocks, @media, @supports and @container hold rules of their own.
          if (rule.cssRules && rule.type !== CSSRule.KEYFRAMES_RULE) walk(rule.cssRules);
        }
      };
      for (const sheet of document.styleSheets) {
        try { walk(sheet.cssRules); } catch { /* a sheet from another origin: none here */ }
      }
      const functions = [];
      for (const name of ['motion', 'dom', 'indicator', 'ripple', 'overlay']) {
        for (const key of Object.keys(DS[name])) if (typeof DS[name][key] === 'function') functions.push(`DS.${name}.${key}`);
      }
      const shows = new Set([...document.querySelectorAll('[data-lab-shows]')].flatMap((card) => card.getAttribute('data-lab-shows').split(' ')));
      return { keyframes: [...keyframes].filter((name) => name.startsWith('ds-')), classes: [...classes], functions, shows: [...shows] };
    });
    // The walk saw the catalogue (sanity: it reads layer blocks).
    expect(found.keyframes).toContain('ds-fade-in');
    expect(found.classes).toContain('.ds-enter--pop');
    expect(found.functions).toContain('DS.overlay.open');
    const required = [...found.keyframes, ...found.classes, ...found.functions];
    for (const name of Object.keys(LAB_EXEMPT)) expect(required, `LAB_EXEMPT names ${name}, which is no primitive`).toContain(name);
    const missing = required.filter((name) => !found.shows.includes(name) && !(name in LAB_EXEMPT));
    expect(missing, 'primitives without a demo (add them to a demo\'s shows, or to LAB_EXEMPT with a reason)').toEqual([]);
    // A demo shows what exists: no stale keyframe, class or export in a shows list.
    const stale = found.shows.filter((name) => /^(ds-|\.ds-(enter|leave|stagger|reveal|collapsible|swap|icon-swap)\b|DS\.)/.test(name) && !required.includes(name));
    expect(stale, 'shows names that do not exist').toEqual([]);
  });

  test('every demo sits in one of the lab\'s sections', async ({ page }) => {
    await open(page);
    const groups = await page.evaluate(() => ({ groups: window.SG_LAB_GROUPS.map((group) => group.id), used: [...new Set(window.SG_LAB.map((entry) => entry.group))] }));
    expect(groups.groups).toEqual(GROUPS);
    for (const group of groups.used) expect(GROUPS).toContain(group);
  });
});

/**
 * The main property of each reversible demo, sampled every frame while
 * "Reverse at 50%" runs: it must be continuous (D21: never a jump, never a
 * restart from zero). `in`: the card's stage, the document or the stage's
 * frame; `text`: the first match whose text includes it; `sum`: the props
 * add up to one value (an indicator's painted edge is its box plus its inset).
 */
const CONTINUITY = {
  spring: { in: 'stage', sel: '.sg-lane__box', props: ['translate.x'] },
  durations: { in: 'stage', sel: '.sg-ladder__chip[data-lab-dur="--ds-dur-glide"]', props: ['translate.x'] },
  'enter-leave': { in: 'stage', sel: '#sg-motion-card', props: ['opacity'] },
  interrupt: { in: 'stage', sel: '#sg-bench-card', props: ['opacity'] },
  swap: { in: 'stage', sel: '[data-swap-toggle] .ds-icon-swap__b', props: ['opacity'] },
  disclosure: { in: 'stage', sel: '.ds-chevron', props: ['rotate'] },
  pop: { in: 'stage', sel: '.ds-badge', props: ['opacity', 'scale.x'] },
  clip: { in: 'stage', sel: '.sg-clip__panel', props: ['opacity'] },
  'icon-swap': { in: 'stage', sel: '[data-pair="offline"] .ds-icon-swap__b', props: ['opacity'] },
  chips: { in: 'stage', sel: '.ds-chip__body', text: 'Archived', pseudo: '::after', props: ['width'] },
  switch: { in: 'stage', sel: '.ds-switch__track', pseudo: '::after', props: ['translate.x'] },
  'switch-locked': { in: 'stage', sel: '.ds-switch__icon', props: ['opacity'] },
  checks: { in: 'stage', sel: '.sg-row .ds-radio-input:nth-of-type(2)', pseudo: '::after', props: ['scale.x'] },
  track: { in: 'stage', sel: '.ds-indicator', props: ['--ds-indicator-x', '--ds-indicator-l'], sum: true },
  segmented: { in: 'stage', sel: '.ds-indicator', props: ['--ds-indicator-x', '--ds-indicator-l'], sum: true },
  dialog: { in: 'doc', sel: '#sg-lab-dialog .ds-dialog__box', props: ['opacity', 'scale.x'] },
  'dialog-div': { in: 'doc', sel: '#sg-lab-dialog-div .ds-dialog__box', props: ['opacity', 'scale.x'] },
  sheet: { in: 'doc', sel: '#sg-lab-sheet .ds-sheet__panel', props: ['translate.x'] },
  'sheet-div': { in: 'doc', sel: '#sg-lab-sheet-div .ds-sheet__panel', props: ['translate.x'] },
  'dialog-full': { in: 'doc', sel: '#sg-lab-dialog-full .ds-dialog__box', props: ['opacity', 'translate.y'] },
  'action-sheet': { in: 'doc', sel: '#sg-lab-action-sheet .ds-dialog__box', props: ['opacity', 'translate.y'] },
  'dialog-work': { in: 'doc', sel: '#sg-lab-dialog-work .ds-dialog__box', props: ['opacity', 'scale.x'] },
  'modal-drawer': { in: 'frame', sel: '#drawer', props: ['translateX'] },
  menu: { in: 'stage', sel: '#sg-lab-menu', props: ['opacity'] },
  combobox: { in: 'stage', sel: '.ds-combo__popup', props: ['opacity'] },
  snackbars: { in: 'doc', sel: '#sg-toasts .ds-toast', props: ['opacity'] },
  savebar: { in: 'frame', sel: '#savebar-bar', props: ['opacity'] },
  progress: { in: 'stage', sel: '#sg-lab-progress', props: ['--ds-progress'] },
  presence: { in: 'stage', sel: '.ds-presence--keep', props: ['opacity'] },
  dropzone: { in: 'stage', sel: '.ds-dropzone__over', props: ['opacity'] },
  'field-changed': { in: 'stage', sel: '#sg-lab-changed .ds-field__label', pseudo: '::after', props: ['opacity'] },
  'search-key': { in: 'stage', sel: '.ds-search__key', props: ['opacity'] },
  'radio-tiles': { in: 'stage', sel: '.ds-radio:nth-of-type(2) .ds-radio__mark svg', props: ['opacity', 'scale.x'] },
  charts: { in: 'stage', sel: '.ds-meter', props: ['--ds-share'] },
};

/** Reversible demos whose reversal is not read from one element's computed style, each with its reason. */
const CONTINUITY_EXEMPT = {
  validation: 'a message that goes is removed at once by design (rule: the room opens on --ds-ease-out, removal is instant)',
  drawer: 'hides and shows through DS.motion.transition(): with View Transitions the motion plays on snapshots, not on the live drawer',
  topbar: 'scroll-driven: the tint follows the scroll position the demo sets, not time',
  tooltips: 'a tooltip waits --ds-delay-tooltip before it moves, so the reversal comes before it shows',
  views: 'View Transitions play on snapshots in a frame (pseudo-elements, not the live view)',
  scroll: 'scroll-driven: the reveal and the edge fades follow the scroll position, not time',
  sortable: 'each toggle moves the row in the DOM and flip() glides it from where it is painted, so its translate restarts from a new layout place (continuity on screen is checked by flip.spec.js and the data-list demo)',
  'follow-end': 'scroll-driven: the log follows the scroll position the demo sets; the pill only toggles hidden (its fade is .ds-presence, timed in the presence demo)',
  wizard: 'View Transitions play on snapshots in a frame (pseudo-elements, not the live view)',
  tiles: 'selection is a colour transition (background-color, --ds-dur-fast) and a ring that shows at once: no number to sample',
  'live-check': 'a hint that goes is removed at once by design, like a validation message (its room opens on --ds-ease-out, removal is instant)',
  tasks: 'a status change swaps the mark at once (its glyph is the state); only the tick of a step that turns done draws, and it starts anew by design',
};

/**
 * Demos whose Replay chains steps on timers (beyond the motion the click
 * starts) or moves outside the stage, so the timeline read in the task of
 * the click is empty or short: their ceiling is this one (or the
 * timeline's, if that is longer), with the reason. The runs are a few
 * seconds at most; the ceiling leaves room for a machine under load, since
 * a timer chain stretches with every late timer.
 */
const LONG_RUNS = {
  drawer: { ms: 15000, reason: 'hides this page\'s drawer through transition(), holds 300ms and brings it back (about 2 × --ds-dur-long plus the wait for quiet); the View Transition plays on pseudo-elements of <html>, outside the stage' },
  snackbars: { ms: 15000, reason: 'sends five messages 200ms apart into the page\'s region, each entering while the stack glides (FLIP), then waits until the region is quiet' },
  tooltips: { ms: 15000, reason: 'a cold tooltip waits --ds-delay-tooltip, the pointer rests 400ms, moves along four more buttons 250ms apart and leaves; the tooltip opens after the click task' },
  'modal-drawer': { ms: 15000, reason: 'opens the modal drawer in its frame, holds 400ms and closes it (the frame\'s animations are outside the stage)' },
  'dialog-work': { ms: 15000, reason: 'opens the dialog, holds 300ms, runs a fake request of 2s while the dialog is busy, then closes it (the dialog sits outside the stage)' },
  topbar: { ms: 15000, reason: 'scrolls the small app in its frame down smoothly, holds 400ms and scrolls back' },
  savebar: { ms: 15000, reason: 'shows the save bar in its frame, holds 600ms and hides it (the frame\'s animations are outside the stage)' },
  focus: { ms: 12000, reason: 'walks the focus along five stops 400ms apart (the ring snaps at each)' },
  scroll: { ms: 12000, reason: 'scrolls the box to its end smoothly, holds 300ms and scrolls back (scroll-driven effects)' },
  validation: { ms: 12000, reason: 'focuses the field and validates it 300ms later (the message fades in while its room opens)' },
  'live-check': { ms: 12000, reason: 'clears the field, then shows the error 200ms later and turns it into a confirmation 400ms after that' },
  views: { ms: 12000, reason: 'a View Transition in a frame: it plays on pseudo-elements whose duration the timeline cannot read' },
  wizard: { ms: 12000, reason: 'a View Transition in a frame: it plays on pseudo-elements whose duration the timeline cannot read' },
};

/**
 * Masked parts of a settled stage screenshot, each with its reason (frame
 * timing writes them, or an engine paints them nondeterministically); an
 * entry with `engines` masks only in those engines.
 */
const SHOT_MASKS = {
  interrupt: { selectors: ['.sg-trace'], reason: 'the trace draws the card\'s opacity as each frame of this run sampled it' },
  views: {
    selectors: ['iframe'],
    engines: ['firefox'],
    reason: 'after the same-document View Transition Firefox now and then paints the frame\'s content 1px up and to the left under parallel load (2 of 20), with the same DOM, layout and animations as a good run; the timeline and the state checks stay the proof (README, capability table, row 11)',
  },
  wizard: {
    selectors: ['iframe'],
    engines: ['firefox'],
    reason: 'the same Firefox paint offset after a same-document View Transition in a frame as in the views demo',
  },
};

/** The locators SHOT_MASKS masks in a demo's stage in this engine. */
function shotMasks(stage, id, browserName) {
  const entry = SHOT_MASKS[id];
  if (!entry || (entry.engines && !entry.engines.includes(browserName))) return [];
  return entry.selectors.map((selector) => stage.locator(selector));
}

/** Seeded, so the live data of the demos (random loads and orders) is the same on every run. */
function seedRandom(page) {
  return page.addInitScript(() => {
    let seed = 0x2f6b4e1;
    Math.random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  });
}

/** Scrolls a card to the top of the view (the same place on every run) and waits two frames. */
function bringUp(page, id) {
  return page.evaluate(async (demoId) => {
    document.querySelector(`[data-lab-demo="${demoId}"]`).scrollIntoView({ block: 'start' });
    for (let i = 0; i < 2; i += 1) await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }, id);
}

/**
 * Presses Replay (in the page, so no pointer ripple) and reads, in the task
 * of the click, every time-based animation it started in the stage and the
 * demo's subject (subtree): "type name pseudo duration delay iterations
 * easing", unique and sorted, the curve named by its token where it is one.
 */
function replayTimeline(page, id) {
  return page.evaluate((demoId) => {
    const card = document.querySelector(`[data-lab-demo="${demoId}"]`);
    const stage = card.querySelector('.sg-lab-stage');
    const entry = window.SG_LAB.find((each) => each.id === demoId);
    const TOKENS = ['--ds-ease-in-out', '--ds-ease-value', '--ds-ease-out', '--ds-ease-in', '--ds-ease-exit', '--ds-ease-emphasized', '--ds-ease-spatial'];
    const names = new Map();
    const name = (easing, token) => { if (easing && !names.has(easing)) names.set(easing, token); };
    for (const token of TOKENS) {
      // The engine's own serialisation of each curve, as a transition, an animation and a script animation use it.
      const probe = document.createElement('div');
      probe.style.cssText = `position: absolute; visibility: hidden; transition: opacity 1000ms var(${token});`;
      document.body.append(probe);
      void getComputedStyle(probe).opacity;
      probe.style.opacity = '0';
      name(probe.getAnimations()[0]?.effect.getTiming().easing, token);
      probe.style.cssText = `position: absolute; visibility: hidden; animation: ds-fade-in 1000ms var(${token});`;
      name(probe.getAnimations()[0]?.effect.getKeyframes()[0]?.easing, token);
      try {
        const scripted = probe.animate({ opacity: [0, 1] }, { duration: 1000, easing: getComputedStyle(probe).getPropertyValue(token).trim() });
        name(scripted.effect.getTiming().easing, token);
        scripted.cancel();
      } catch {
        // An engine without linear() in el.animate() (the fallback project).
      }
      probe.remove();
    }
    card.querySelector('[data-lab="replay"]').click();
    const roots = [stage];
    const subject = entry.subject ? entry.subject(stage) : null;
    if (subject && !stage.contains(subject)) roots.push(subject);
    const lines = new Set();
    for (const root of roots) {
      for (const animation of root.getAnimations({ subtree: true })) {
        if (typeof ScrollTimeline === 'function' && animation.timeline instanceof ScrollTimeline) continue;
        const effect = animation.effect;
        const timing = effect.getTiming();
        const computed = effect.getComputedTiming();
        const type = typeof CSSAnimation !== 'undefined' && animation instanceof CSSAnimation ? 'animation'
          : typeof CSSTransition !== 'undefined' && animation instanceof CSSTransition ? 'transition' : 'script';
        const label = type === 'animation' ? animation.animationName : type === 'transition' ? animation.transitionProperty : animation.id || '(script)';
        const easing = type === 'animation' ? effect.getKeyframes()[0]?.easing || 'linear' : timing.easing;
        lines.add([type, label, effect.pseudoElement || '-', Math.round(Number(computed.duration)), Math.round(timing.delay || 0),
          Number.isFinite(computed.iterations) ? computed.iterations : 'infinite', names.get(easing) || easing].join(' '));
      }
    }
    return [...lines].sort();
  }, id);
}

/** The end of the longest finite animation of a timeline, in ms. */
function longestOf(lines) {
  return Math.max(0, ...lines.map((line) => line.split(' ')).filter((parts) => parts[5] !== 'infinite')
    .map((parts) => Number(parts[4]) + Number(parts[3]) * Number(parts[5])).filter(Number.isFinite));
}

/**
 * Presses "Reverse at 50%" (in the page) and samples the demo's main
 * property on every frame until the card has settled; a sample is null
 * while the element is not rendered (hidden before or after). A sample's
 * `t` is the time of its frame (the rAF timestamp, the time the frame's
 * animations were sampled at), not when the script got to read it: on a
 * busy machine the two drift apart by a frame or more, and a step would
 * read as too fast or too slow for its time.
 */
function reverseTrace(page, id, spec) {
  return page.evaluate(async ({ demoId, spec: what }) => {
    const card = document.querySelector(`[data-lab-demo="${demoId}"]`);
    const stage = card.querySelector('.sg-lab-stage');
    const scope = () => (what.in === 'frame' ? stage.querySelector('iframe').contentDocument : what.in === 'doc' ? document : stage);
    const find = () => {
      const all = [...scope().querySelectorAll(what.sel)];
      return what.text ? all.find((el) => el.textContent.includes(what.text)) : all[0];
    };
    const read = (t) => {
      const el = find();
      if (!el || !el.getClientRects().length) return { t, gone: true };
      const cs = el.ownerDocument.defaultView.getComputedStyle(el, what.pseudo || null);
      const pair = (value) => (value === 'none' ? [] : value.split(/\s+/).map(parseFloat));
      const out = { t };
      for (const key of what.props) {
        if (key === 'opacity') out[key] = parseFloat(cs.opacity);
        else if (key === 'translate.x') out[key] = pair(cs.translate)[0] || 0;
        else if (key === 'translate.y') out[key] = pair(cs.translate)[1] || 0;
        else if (key === 'scale.x') out[key] = cs.scale === 'none' ? 1 : pair(cs.scale)[0];
        else if (key === 'rotate') out[key] = cs.rotate === 'none' ? 0 : parseFloat(cs.rotate);
        else if (key === 'translateX') out[key] = new DOMMatrixReadOnly(cs.transform === 'none' ? undefined : cs.transform).m41;
        else if (key === 'width') out[key] = parseFloat(cs.width) || 0;
        else out[key] = parseFloat(cs.getPropertyValue(key)) || 0;
      }
      return out;
    };
    const frame = () => new Promise((resolve) => requestAnimationFrame((time) => resolve(time)));
    const samples = [read(await frame())];
    card.querySelector('[data-lab="reverse"]').click();
    const end = performance.now() + 60000;
    let after = 0;
    while (performance.now() < end && after < 3) {
      samples.push(read(await frame()));
      if (card.getAttribute('data-lab-state') === 'settled') after += 1;
    }
    return { samples, settled: card.getAttribute('data-lab-state') === 'settled' };
  }, { demoId: id, spec });
}

/** Elements a run left inert or closing in the stage and around the subject (data-lab-keep and closed detail rows excepted). */
function strays(page, id) {
  return page.evaluate((demoId) => {
    const card = document.querySelector(`[data-lab-demo="${demoId}"]`);
    const stage = card.querySelector('.sg-lab-stage');
    const entry = window.SG_LAB.find((each) => each.id === demoId);
    const subject = entry.subject ? entry.subject(stage) : null;
    const nodes = [stage, ...stage.querySelectorAll('*'), ...(subject && !stage.contains(subject) ? [subject, ...subject.querySelectorAll('*')] : [])];
    return nodes.filter((el) => !el.closest('[data-lab-keep], .ds-table__detail') && el.matches('[inert], .ds-dialog--closing, .ds-sheet--closing'))
      .map((el) => el.outerHTML.slice(0, 120));
  }, id);
}

/**
 * The elements carrying `hidden` in the stage and around the subject
 * (data-lab-keep excepted), each as "tag#id.class", sorted: what
 * a demo hides in one state. An interrupted entrance must never leave one
 * behind.
 */
function hiddenIn(page, id) {
  return page.evaluate((demoId) => {
    const card = document.querySelector(`[data-lab-demo="${demoId}"]`);
    const stage = card.querySelector('.sg-lab-stage');
    const entry = window.SG_LAB.find((each) => each.id === demoId);
    const subject = entry.subject ? entry.subject(stage) : null;
    const nodes = [stage, ...stage.querySelectorAll('*'), ...(subject && !stage.contains(subject) ? [subject, ...subject.querySelectorAll('*')] : [])];
    return nodes.filter((el) => el.hidden && !el.closest('[data-lab-keep]'))
      .map((el) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${[...el.classList].map((name) => `.${name}`).join('')}`).sort();
  }, id);
}

/** Where a reversible demo is (its registry's state()), or null without one. */
function stateOf(page, id) {
  return page.evaluate((demoId) => {
    const entry = window.SG_LAB.find((each) => each.id === demoId);
    return entry.state ? Boolean(entry.state(document.querySelector(`[data-lab-demo="${demoId}"] .sg-lab-stage`))) : null;
  }, id);
}

test.describe('demos', () => {
  test.beforeEach(({ page }) => seedRandom(page));

  for (const group of GROUPS) {
    test(`${group}: every demo replays to settled within its ceiling and matches its timeline and settled shot; reversible ones rapid-toggle to the implied state`, async ({ page, browserName }) => {
      test.setTimeout(480000);
      await open(page);
      const demos = await page.evaluate((id) => window.SG_LAB.filter((entry) => entry.group === id).map((entry) => ({ id: entry.id, toggle: typeof entry.toggle === 'function' })), group);
      expect(demos.length).toBeGreaterThan(0);
      for (const demo of demos) {
        const card = page.locator(`[data-lab-demo="${demo.id}"]`);
        const stage = card.locator('.sg-lab-stage');
        // Replay: the timeline it starts, then settled within the ceiling that timeline gives.
        await bringUp(page, demo.id);
        const timeline = await replayTimeline(page, demo.id);
        expect(`${JSON.stringify(timeline, null, 2)}\n`).toMatchSnapshot(`${demo.id}.json`);
        const ceiling = Math.max(LONG_RUNS[demo.id]?.ms ?? 0, 4000 + 10 * longestOf(timeline));
        await expect(card, `${demo.id} replay`).toHaveAttribute('data-lab-state', 'settled', { timeout: ceiling });
        await settle(page, { timeout: 20000 });
        await expect(stage, `${demo.id}: the settled stage`).toHaveScreenshot(`${demo.id}.png`, { mask: shotMasks(stage, demo.id, browserName) });
        if (demo.toggle) {
          // Rapid toggle: five toggles from where it is end on the other
          // side, with nothing stray; five more come back, and what is
          // hidden there is what was hidden before (no `hidden` left behind
          // by an entrance that was turned back). A demo with reset() goes
          // back to its start first, so nothing the Replay left (messages
          // that close on their own timers) moves during the rounds.
          if (await page.evaluate((id) => typeof window.SG_LAB.find((entry) => entry.id === id).reset === 'function', demo.id)) {
            await page.evaluate((id) => {
              const entry = window.SG_LAB.find((each) => each.id === id);
              return Promise.resolve(entry.reset(document.querySelector(`[data-lab-demo="${id}"] .sg-lab-stage`), window.SG_LAB_HELPERS)).then(() => undefined);
            }, demo.id);
            await settle(page, { timeout: 20000 });
          }
          await bringUp(page, demo.id);
          const before = await stateOf(page, demo.id);
          const hidden = await hiddenIn(page, demo.id);
          for (const [round, end] of [['far', before === null ? null : !before], ['back', before]]) {
            await card.locator('[data-lab="rapid"]').evaluate((button) => button.click());
            await expect(card, `${demo.id} rapid (${round})`).toHaveAttribute('data-lab-state', 'settled', { timeout: 20000 });
            if (end !== null) expect(await stateOf(page, demo.id), `${demo.id}: five toggles end on the ${round === 'far' ? 'far' : 'first'} state`).toBe(end);
            expect(await strays(page, demo.id), `${demo.id}: nothing inert or closing after Rapid toggle (${round})`).toEqual([]);
          }
          expect(await hiddenIn(page, demo.id), `${demo.id}: ten toggles leave hidden what was hidden, and nothing else`).toEqual(hidden);
        }
        await closeOverlays(page);
      }
      await settle(page, { timeout: 20000 });
      // Nothing left over from the runs: the demos that keep an element hidden
      // and inert on purpose mark it data-lab-keep; a closed detail row is inert by design.
      expect(await page.evaluate(() => [...document.querySelectorAll('#sg-page *')]
        .filter((el) => !el.closest('[data-lab-keep], .ds-table__detail') && (el.matches('.ds-leave, [inert], .ds-enter, .ds-dialog--closing, .ds-sheet--closing') || el.style.getPropertyValue('--ds-i') !== ''))
        .map((el) => el.outerHTML.slice(0, 120)))).toEqual([]);
      expect(await page.evaluate(() => document.body.classList.contains('ds-no-scroll'))).toBe(false);
    });
  }

  test('every reversible demo is checked for continuity or exempt with a reason; the lists name real demos', async ({ page }) => {
    await open(page);
    const reversible = await page.evaluate(() => window.SG_LAB.filter((entry) => typeof entry.toggle === 'function').map((entry) => entry.id));
    expect([...Object.keys(CONTINUITY), ...Object.keys(CONTINUITY_EXEMPT)].sort()).toEqual([...reversible].sort());
    const ids = await page.evaluate(() => window.SG_LAB.map((entry) => entry.id));
    for (const id of [...Object.keys(LONG_RUNS), ...Object.keys(SHOT_MASKS)]) expect(ids).toContain(id);
  });
});

test.describe('interruption', () => {
  test.beforeEach(({ page }) => seedRandom(page));

  for (const group of GROUPS) {
    test(`${group}: "Reverse at 50%" of every reversible demo continues from where it is, at ?speed=0.1`, async ({ page }) => {
      test.setTimeout(480000);
      // Ten times slower: a frame is a hundredth of a motion, so a jump stands out from a steep curve.
      await open(page, `${LAB}?speed=0.1`);
      const demos = await page.evaluate((id) => window.SG_LAB.filter((entry) => entry.group === id && typeof entry.toggle === 'function').map((entry) => entry.id), group);
      test.skip(!demos.length, 'this section has no reversible demo');
      for (const id of demos) {
        await bringUp(page, id);
        const spec = CONTINUITY[id];
        const trace = await reverseTrace(page, id, spec ?? { in: 'stage', sel: ':scope', props: ['opacity'] });
        expect(trace.settled, `${id} reverse`).toBe(true);
        if (spec) {
          const samples = trace.samples.filter((sample) => !sample.gone);
          const series = spec.sum ? [samples.map((sample) => ({ t: sample.t, v: spec.props.reduce((sum, key) => sum + sample[key], 0) }))]
            : spec.props.map((key) => samples.map((sample) => ({ t: sample.t, v: sample[key] })));
          const moved = series.some((points) => Math.max(...points.map((p) => p.v)) - Math.min(...points.map((p) => p.v)) > 1e-3);
          expect(moved, `${id}: Reverse at 50% moved ${spec.props.join(', ')}`).toBe(true);
          for (const points of series) expectSmooth(points, `${id}: Reverse at 50% on ${spec.props.join(' + ')}`);
        } else {
          expect(Object.keys(CONTINUITY_EXEMPT), `${id}: a reversible demo needs a CONTINUITY entry (or an exemption with its reason)`).toContain(id);
        }
        await closeOverlays(page);
      }
    });
  }
});

/* ── The overlay table of docs/motion.md against the engines ───────── */

/** A track of the table: property or keyframe names with their duration and curve tokens. */
function tracksOf(cell) {
  return cell.split(';').map((part) => {
    const names = [...part.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
    return { names: names.filter((name) => !name.startsWith('--')), duration: names.find((name) => name.startsWith('--ds-dur-')), easing: names.find((name) => name.startsWith('--ds-ease-')) };
  });
}

/** The rows of the "Overlays" table in docs/motion.md: layer, path, entrance, exit and whether the origin is --ds-motion-origin. */
function overlayRows() {
  const doc = readFileSync(resolve(ROOT, 'docs/motion.md'), 'utf8');
  const start = doc.indexOf('\n### Overlays');
  const section = doc.slice(start, doc.indexOf('\n### ', start + 1));
  return section.split('\n').filter((line) => line.startsWith('| ') && !line.startsWith('| Layer ') && !line.startsWith('|---')).map((line) => {
    const cells = line.slice(2, -2).split(' | ');
    return { layer: cells[0], path: cells[1], entrance: tracksOf(cells[2]), exit: tracksOf(cells[3]), origin: cells[5].includes('`--ds-motion-origin`') };
  });
}

/**
 * How the lab shows each layer of the table: its variants (`id` of the
 * element, its opener, `nested` when a parent dialog opens first), the
 * part whose tracks the row names, and a phone viewport where the row is
 * for phones. `drive` names the driver in layerStep().
 */
const LAYERS = {
  Scrim: { drive: 'modal', part: '.ds-dialog__backdrop, .ds-sheet__backdrop', variants: [['sg-lab-dialog', 'dialog'], ['sg-lab-dialog-div', 'dialog-div'], ['sg-lab-sheet', 'sheet'], ['sg-lab-sheet-div', 'sheet-div']] },
  Dialog: { drive: 'modal', part: '.ds-dialog__box', variants: [['sg-lab-dialog', 'dialog'], ['sg-lab-dialog-div', 'dialog-div']] },
  'Nested dialog': { drive: 'nested', part: '.ds-dialog__box', variants: [['sg-lab-dialog-nested', 'dialog'], ['sg-lab-dialog-div-nested', 'dialog-div']] },
  'Dialog on a phone': { drive: 'modal', phone: true, part: '.ds-dialog__box', variants: [['sg-lab-dialog', 'dialog'], ['sg-lab-dialog-div', 'dialog-div']] },
  'Full-screen dialog': { drive: 'modal', part: '.ds-dialog__box', variants: [['sg-lab-dialog-full', 'dialog-full']] },
  'Action sheet': { drive: 'modal', part: '.ds-dialog__box', variants: [['sg-lab-action-sheet', 'action-sheet']] },
  'Side sheet': { drive: 'modal', part: '.ds-sheet__panel', variants: [['sg-lab-sheet', 'sheet'], ['sg-lab-sheet-div', 'sheet-div']] },
  'Side sheet on a phone': { drive: 'modal', phone: true, part: '.ds-sheet__panel', variants: [['sg-lab-sheet', 'sheet'], ['sg-lab-sheet-div', 'sheet-div']] },
  'Modal drawer': { drive: 'drawer', part: '#drawer', variants: [['drawer', 'modal-drawer']] },
  'Modal drawer scrim': { drive: 'drawer', part: '.ds-scrim', variants: [['drawer', 'modal-drawer']] },
  Snackbar: { drive: 'toast', part: '.ds-toast', variants: [['sg-toasts', 'snackbars']] },
  Tooltip: { drive: 'tooltip', part: '.ds-tooltip', variants: [['0', 'tooltips']] },
  'Tooltip warm-up': { drive: 'warm', part: '.ds-tooltip', variants: [['1', 'tooltips']] },
  Menu: { drive: 'popup', part: '#sg-lab-menu', variants: [['sg-lab-menu', 'menu']] },
  'Combobox list': { drive: 'popup', part: '.ds-combo__popup', variants: [['sg-lab-combo', 'combobox']] },
};

/**
 * One step of a layer in the lab ('open' or 'close'): runs it, then reads in
 * the same task (or, for a tooltip that shows after its delay, in the frame
 * it opens) the part's running transitions and animations as "name ms
 * easing", the row's tracks resolved the same way (durations through
 * motionDuration(), curves through the engine's own serialisation of each
 * token on a probe), and the origin. Then it finishes the layer's motion
 * and waits until the step has settled.
 */
function layerStep(page, layer, step, variant, row) {
  return page.evaluate(async ({ layer: spec, step: act, variant: [id, demo], tracks }) => {
    const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
    const until = async (test, what) => {
      const end = performance.now() + 30000;
      while (!test()) {
        if (performance.now() > end) throw new Error(`${demo} ${act}: no ${what}`);
        await frame();
      }
    };
    const card = document.querySelector(`[data-lab-demo="${demo}"]`);
    const stage = card.querySelector('.sg-lab-stage');
    const pointer = (el, type) => {
      const rect = el.getBoundingClientRect();
      el.dispatchEvent(new PointerEvent(type, { bubbles: true, composed: true, cancelable: true, pointerType: 'mouse', isPrimary: true, pointerId: 1, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 }));
    };
    let win = window;
    let root;
    let part;
    let done;
    if (spec.drive === 'modal' || spec.drive === 'nested') {
      root = document.getElementById(id);
      part = root.querySelector(spec.part);
      if (spec.drive === 'nested') {
        const parent = document.getElementById(id.replace(/-nested$/, ''));
        if (act === 'open') {
          // The parent first, its entrance finished, then the nested dialog from its button.
          DS.overlay.open(parent, { opener: card.querySelector('[data-overlay-open]') });
          for (const animation of parent.getAnimations({ subtree: true })) if (Number.isFinite(animation.effect.getComputedTiming().iterations)) animation.finish();
          DS.overlay.open(root, { opener: parent.querySelector('[data-nested]') });
        } else DS.overlay.close(root);
        done = act === 'open' ? () => root.getAttribute('data-state') === 'open' : () => !root.hasAttribute('data-state');
      } else {
        if (act === 'open') DS.overlay.open(root, { opener: card.querySelector('[data-overlay-open]') });
        else DS.overlay.close(root);
        done = act === 'open' ? () => root.getAttribute('data-state') === 'open' : () => !root.hasAttribute('data-state');
      }
    } else if (spec.drive === 'drawer') {
      win = stage.querySelector('iframe').contentWindow;
      const doc = win.document;
      root = doc.getElementById('app');
      part = doc.querySelector(spec.part);
      const drawer = doc.getElementById('drawer');
      if (act === 'open') win.DS.overlay.open(drawer, { opener: doc.getElementById('menu') });
      else win.DS.overlay.close(drawer);
      done = act === 'open' ? () => root.hasAttribute('data-drawer-open') : () => !root.hasAttribute('data-drawer-open');
    } else if (spec.drive === 'toast') {
      root = document.getElementById(id);
      if (act === 'open') window.__labToast = DS.overlay.toast(root, 'Saved LAPTOP-0042.', { kind: 'success', persistent: true });
      else window.__labToast.close();
      part = window.__labToast.el;
      done = act === 'open' ? () => part.isConnected : () => !part.isConnected;
    } else if (spec.drive === 'tooltip' || spec.drive === 'warm') {
      const trigger = stage.querySelectorAll('[data-tip]')[Number(id)];
      const tip = () => document.querySelector('.ds-tooltip[role="tooltip"]');
      if (act === 'open') {
        pointer(trigger, 'pointerover');
        // Cold: after --ds-delay-tooltip; warm (within --ds-delay-tooltip-skip of the last hide): at once.
        if (spec.drive === 'tooltip') await until(() => tip()?.getAttribute('data-state') === 'open', 'tooltip');
        else if (tip()?.getAttribute('data-state') !== 'open') throw new Error('the warm-up did not show at once');
        if (spec.drive === 'warm' && !tip().hasAttribute('data-warm')) throw new Error('the warm-up is not marked data-warm');
      } else document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', isPrimary: true }));
      root = tip();
      part = root;
      done = act === 'open' ? () => root.getAttribute('data-state') === 'open' : () => root.hidden;
    } else {
      part = stage.querySelector(spec.part);
      root = part;
      const opener = demo === 'menu' ? stage.querySelector('[data-menu-trigger]') : stage.querySelector('.ds-combo__input');
      if (act === 'open') DS.overlay.open(part, { opener });
      else DS.overlay.close(part);
      done = act === 'open' ? () => part.getAttribute('data-state') === 'open' : () => !part.hasAttribute('data-state');
    }
    const view = part.ownerDocument.defaultView;
    const DISCRETE = ['visibility', 'display', 'overlay', 'content-visibility'];
    const isTransition = (a) => typeof view.CSSTransition !== 'undefined' && a instanceof view.CSSTransition;
    const isAnimation = (a) => typeof view.CSSAnimation !== 'undefined' && a instanceof view.CSSAnimation;
    const actual = part.getAnimations().filter((a) => {
      const timing = a.effect.getTiming();
      if (!Number.isFinite(a.effect.getComputedTiming().iterations)) return false;
      if (isTransition(a)) return timing.duration > 0 && !DISCRETE.includes(a.transitionProperty);
      return isAnimation(a);
    }).map((a) => `${isTransition(a) ? a.transitionProperty : a.animationName} ${Math.round(a.effect.getTiming().duration)} ${isTransition(a) ? a.effect.getTiming().easing : a.effect.getKeyframes()[0]?.easing}`).sort();
    // The row, resolved in the part's own document: a fresh probe per curve and kind.
    const easingOf = (token, keyframes) => {
      const probe = part.ownerDocument.createElement('div');
      probe.style.cssText = keyframes ? `position: absolute; visibility: hidden; animation: ds-fade-in 1000ms var(${token});` : `position: absolute; visibility: hidden; transition: opacity 1000ms var(${token});`;
      const theme = part.closest('.ds-theme');
      (!theme || theme === part.ownerDocument.documentElement ? part.ownerDocument.body : theme).append(probe);
      void view.getComputedStyle(probe).opacity;
      probe.style.opacity = '0';
      const animation = probe.getAnimations()[0];
      const out = keyframes ? animation.effect.getKeyframes()[0]?.easing : animation.effect.getTiming().easing;
      probe.remove();
      return out;
    };
    const expected = tracks.flatMap((track) => track.names.map((name) => `${name} ${Math.round(view.DS.motion.motionDuration(part, track.duration))} ${easingOf(track.easing, name.startsWith('ds-'))}`)).sort();
    const origin = { written: part.style.getPropertyValue('--ds-motion-origin').trim(), computed: view.getComputedStyle(part).transformOrigin };
    // Finish the step and wait until it has settled (the overlay's own promises run).
    for (const animation of (root.getAnimations ? root.getAnimations({ subtree: true }) : [])) {
      if (Number.isFinite(animation.effect.getComputedTiming().iterations)) animation.finish();
    }
    for (const animation of part.getAnimations()) if (Number.isFinite(animation.effect.getComputedTiming().iterations)) animation.finish();
    await until(done, `settled ${act}`);
    return { actual, expected, origin };
  }, { layer, step, variant, tracks: row[step === 'open' ? 'entrance' : 'exit'] });
}

/** Stages whose content is taller than the stage (it would be cut off): "id: scrollHeight/clientHeight". */
function overflowing(page) {
  return page.evaluate(() => [...document.querySelectorAll('[data-lab-demo]')]
    // The scroll demo scrolls on purpose.
    .filter((card) => card.getAttribute('data-lab-demo') !== 'scroll')
    .map((card) => [card.getAttribute('data-lab-demo'), card.querySelector('.sg-lab-stage')])
    .filter(([, stage]) => stage.scrollHeight > stage.clientHeight + 1)
    .map(([id, stage]) => `${id}: ${stage.scrollHeight}/${stage.clientHeight}`));
}

/** Code labels of the lab split over two lines (an inline-block label has one rect, however it wraps inside). */
function splitCode(page) {
  return page.evaluate(() => [...document.querySelectorAll('[data-lab-demo] code, .sg-hero code')]
    .filter((code) => code.getClientRects().length > 1)
    .map((code) => `${code.closest('[data-lab-demo]')?.getAttribute('data-lab-demo') ?? 'hero'}: ${code.textContent}`));
}

/**
 * Punctuation that touches a code label ("(" before it, "," after it) but sits on another line: an inline-block
 * label adds a break opportunity on each side, so the styleguide glues them (glue() in styleguide.js).
 */
function orphanedPunctuation(page) {
  return page.evaluate(() => {
    const out = [];
    const charRect = (node, at) => {
      const range = document.createRange();
      range.setStart(node, at);
      range.setEnd(node, at + 1);
      return range.getBoundingClientRect();
    };
    const sameLine = (rect, chip) => {
      const middle = rect.top + rect.height / 2;
      return middle >= chip.top && middle <= chip.bottom;
    };
    for (const code of document.querySelectorAll('[data-lab-demo] code, .sg-hero code')) {
      const rects = code.getClientRects();
      if (!rects.length) continue;
      const name = `${code.closest('[data-lab-demo]')?.getAttribute('data-lab-demo') ?? 'hero'}: ${code.textContent}`;
      const before = code.previousSibling;
      if (before?.nodeType === 3 && before.data.length && /\S/.test(before.data.at(-1)) && !sameLine(charRect(before, before.data.length - 1), rects[0])) out.push(`${name} after "${before.data.at(-1)}"`);
      const after = code.nextSibling;
      if (after?.nodeType === 3 && after.data.length && /\S/.test(after.data[0]) && !sameLine(charRect(after, 0), rects[rects.length - 1])) out.push(`${name} before "${after.data[0]}"`);
    }
    return out;
  });
}

/** Demos whose read-out starts empty: the line is reserved, so the first Replay that fills it moves nothing. */
const EMPTY_READOUTS = { stagger: 'sg-stagger-left', 'stagger-once': 'sg-once-left', morph: 'sg-jobs-focus', menu: 'sg-menu-placement', combobox: 'sg-combo-placement' };

test.describe('stages', () => {
  for (const width of [1280, 1000, 390]) {
    test(`at ${width}px every stage holds its demo, the open disclosure keeps its stage's height, and no code label breaks or loses its punctuation`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await open(page);
      expect(await overflowing(page)).toEqual([]);
      const heights = await page.evaluate(async () => {
        const stage = document.querySelector('[data-lab-demo="disclosure"] .sg-lab-stage');
        const entry = window.SG_LAB.find((each) => each.id === 'disclosure');
        const closed = stage.getBoundingClientRect().height;
        await entry.toggle(stage, true, window.SG_LAB_HELPERS);
        return { closed, open: stage.getBoundingClientRect().height, fits: stage.scrollHeight <= stage.clientHeight + 1 };
      });
      expect(heights).toEqual({ closed: heights.closed, open: heights.closed, fits: true });
      // Curve captions, the ladder heads and the rules list included.
      expect(await splitCode(page)).toEqual([]);
      // Nor does the punctuation touching a label wrap away from it.
      expect(await orphanedPunctuation(page)).toEqual([]);
    });
  }

  test('a read-out that starts empty keeps its card\'s height when the first Replay fills it', async ({ page }) => {
    await open(page);
    for (const [id, readout] of Object.entries(EMPTY_READOUTS)) {
      const card = page.locator(`[data-lab-demo="${id}"]`);
      await bringUp(page, id);
      // The morph demo reports where focus was: a note in the patched list.
      if (id === 'morph') await page.evaluate(() => document.querySelector('#sg-jobs-morph input').focus());
      const before = await page.evaluate(({ demoId, readoutId }) => ({
        text: document.getElementById(readoutId).textContent,
        display: getComputedStyle(document.getElementById(readoutId)).display,
        height: document.querySelector(`[data-lab-demo="${demoId}"]`).getBoundingClientRect().height,
      }), { demoId: id, readoutId: readout });
      expect(before, `${id}: an empty read-out keeps its line`).toEqual({ text: '', display: 'block', height: before.height });
      await card.locator('[data-lab="replay"]').evaluate((button) => button.click());
      await expect(card, `${id} replay`).toHaveAttribute('data-lab-state', 'settled', { timeout: 30000 });
      await expect(page.locator(`#${readout}`), `${id}: the read-out is filled`).not.toHaveText('');
      await settle(page, { timeout: 20000 });
      const after = await card.evaluate((element) => element.getBoundingClientRect().height);
      expect(after, `${id}: the card keeps its height`).toBe(before.height);
      await closeOverlays(page);
    }
  });

  test('the skeleton keeps the height of the page that replaces it, and its loading bar stays in its pane', async ({ page }) => {
    await open(page);
    await bringUp(page, 'skeleton');
    const loading = await page.evaluate(() => {
      const card = document.querySelector('[data-lab-demo="skeleton"]');
      const panes = card.querySelector('.sg-panes');
      const settled = panes.getBoundingClientRect().height;
      card.querySelector('[data-lab="replay"]').click();
      const pane = card.querySelector('#sg-skeleton-bar').getBoundingClientRect();
      const bar = card.querySelector('#sg-skeleton-bar .ds-loadbar').getBoundingClientRect();
      const label = card.querySelector('#sg-skeleton-bar').previousElementSibling.getBoundingClientRect();
      return {
        settled,
        loading: panes.getBoundingClientRect().height,
        inside: bar.left >= pane.left - 0.5 && bar.right <= pane.right + 0.5 && bar.top >= pane.top - 0.5,
        belowLabel: bar.top >= label.bottom - 0.5,
      };
    });
    expect(loading).toEqual({ settled: loading.settled, loading: loading.settled, inside: true, belowLabel: true });
    await expect(page.locator('[data-lab-demo="skeleton"]')).toHaveAttribute('data-lab-state', 'settled', { timeout: 20000 });
  });
});

test.describe('overlay table', () => {
  test.beforeEach(({ page }) => seedRandom(page));

  test('every layer of the docs/motion.md Overlays table plays its tracks, durations, curves and origin in this engine', async ({ page }) => {
    test.setTimeout(300000);
    const rows = overlayRows();
    expect(rows.map((row) => row.layer).sort(), 'the table and LAYERS name the same layers').toEqual(Object.keys(LAYERS).sort());
    // Slowed down tenfold: the motion is read in its first frames, and the waits stay deterministic.
    await open(page, `${LAB}?speed=0.1`);
    for (const phone of [false, true]) {
      if (phone) {
        await page.setViewportSize({ width: 390, height: 800 });
        await settle(page, { timeout: 20000 });
      }
      for (const row of rows.filter((each) => Boolean(LAYERS[each.layer].phone) === phone)) {
        for (const variant of LAYERS[row.layer].variants) {
          for (const step of ['open', 'close']) {
            const read = await layerStep(page, LAYERS[row.layer], step, variant, row);
            expect(read.actual, `${row.layer} (${variant[0]}) ${step}`).toEqual(read.expected);
            if (row.origin && step === 'open') {
              // originFrom() wrote the origin, and the part grows from it.
              expect(read.origin.written, `${row.layer} (${variant[0]}): --ds-motion-origin written`).not.toBe('');
              const numbers = (value) => value.split(/\s+/).slice(0, 2).map(parseFloat);
              const [x, y] = numbers(read.origin.computed);
              const [ox, oy] = numbers(read.origin.written);
              expect(Math.abs(x - ox) + Math.abs(y - oy), `${row.layer} (${variant[0]}): transform-origin ${read.origin.computed} is --ds-motion-origin ${read.origin.written}`).toBeLessThan(1);
            }
          }
          if (LAYERS[row.layer].drive === 'nested') {
            // The parent dialog the nested one opened from.
            await page.evaluate((id) => DS.overlay.close(document.getElementById(id.replace(/-nested$/, ''))), variant[0]);
            await page.waitForFunction((id) => !document.getElementById(id.replace(/-nested$/, '')).hasAttribute('data-state'), variant[0], { timeout: 30000 });
          }
        }
      }
    }
    expect(await page.evaluate(() => document.body.classList.contains('ds-no-scroll'))).toBe(false);
  });
});

test.describe('videos', () => {
  for (const group of GROUPS) {
    test(`${group}: every demo at ?speed=0.1, on video`, async ({ page }) => {
      test.setTimeout(30 * 60000);
      await page.goto(`${LAB}?speed=0.1`);
      await ready(page);
      await page.mouse.move(1, 1);
      await settle(page, { timeout: 60000 });
      const demos = await page.evaluate((id) => window.SG_LAB.filter((entry) => entry.group === id).map((entry) => ({ id: entry.id, toggle: typeof entry.toggle === 'function' })), group);
      for (const demo of demos) {
        const card = page.locator(`[data-lab-demo="${demo.id}"]`);
        await card.scrollIntoViewIfNeeded();
        for (const kind of demo.toggle ? ['replay', 'reverse', 'rapid'] : ['replay']) {
          await card.locator(`[data-lab="${kind}"]`).click();
          await expect(card, `${demo.id} ${kind}`).toHaveAttribute('data-lab-state', 'settled', { timeout: 120000 });
          // A beat at rest between the runs, so the video shows where each one landed.
          await page.waitForTimeout(400);
        }
        await closeOverlays(page);
      }
    });
  }
});
