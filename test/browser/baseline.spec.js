/**
 * Settled screenshots of today's state (P0 baseline): the styleguide's
 * pages and every component demo, the fixture controls at rest and in
 * their hover, pressed, keyboard-focus and disabled states, the feedback
 * and shell parts, the overlays of the demos, the two reset fixtures; in
 * Chromium also the phone
 * width, the theme files and forced colours (skipped, with the reason,
 * where an engine cannot emulate them).
 *
 * One set, element shots (or a clip around the part), no full pages. Later
 * phases compare against it; a deliberate change updates the shot in the
 * same commit (`npm run test:browser:update`, then review the diff).
 *
 * Settled means: ready(), settle() (every finite animation done), the
 * count-up tiles at their final value, the pointer parked off the content,
 * and every infinite loop paused at a fixed point of its cycle (0, or 25 %
 * for the loop shots), so the shots use `animations: 'allow'`:
 * 'disabled' would cancel the loops and show a frame no user ever sees.
 * `annotate()` names the `src/` anchors (README, "Source anchors") a shot
 * covers.
 */
import { test, expect } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { ready, settle, focusByKeyboard } from './helpers/motion.js';

// Dozens of comparisons per test: WebKit needs more than the default 30s under load.
test.describe.configure({ timeout: 120000 });

const STYLEGUIDE = '/styleguide/index.html';
const FIXTURES = '/test/browser/fixtures/';

/**
 * The styleguide's pages: the overview and the foundations (the tokens
 * page, a table of every name, and the search are lists, not looks), then
 * every component's demo, each read from its folder
 * (src/components/<n>/<n>.demo.js). The 2.x sections they took over were
 * shot here until legacy.html was retired.
 */
const FOUNDATIONS = ['', 'colour', 'type', 'shape', 'elevation', 'motion', 'icons', 'theme'];
const DEMOS = readdirSync(new URL('../../src/components/', import.meta.url))
  .filter((name) => existsSync(new URL(`../../src/components/${name}/${name}.demo.js`, import.meta.url))).sort();

/* Taller than the longest page, since the view scrolls and a shot paints
   only what is inside the viewport (a taller part came out cut off, or
   with a blank top, and depended on the timing of scripts that run during
   the capture). At 1280px the view is the viewport less the 64px top bar;
   the longest demos are the table, the form and the list. At 390px they
   grow taller still. The theme files and the forced colours shoot the
   button, form and card demos too, so they share the height. */
const TALL = { width: 1280, height: 6400 };
const PAGES_TALL = TALL;
const PHONE_PAGES_TALL = { width: 390, height: 9600 };

function annotate(...anchors) {
  for (const anchor of anchors) test.info().annotations.push({ type: 'src', description: anchor });
}

/**
 * Pauses every infinite animation at `progress` (0 to 1) of one loop, after
 * its delay. Finite animations are left alone (settle() has finished them).
 */
function pauseLoops(page, progress = 0) {
  return page.evaluate((at) => {
    for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) {
      const timing = animation.effect.getComputedTiming();
      if (Number.isFinite(timing.iterations)) continue;
      animation.pause();
      animation.currentTime = (animation.effect.getTiming().delay || 0) + at * Number(timing.duration);
    }
  }, progress);
}

/** The pointer off every control (the fixtures' and the styleguide's padding). */
function park(page) {
  return page.mouse.move(1, 1);
}

async function open(page, path) {
  await page.goto(path);
  await ready(page);
  await park(page);
  await settle(page);
}

/**
 * Shows a route of the styleguide (`colour`, `components/button`): the
 * first one loads the page, the next ones change the hash as the drawer
 * does, and wait for the route's fade-through to end.
 */
async function route(page, key) {
  if (!page.url().includes(STYLEGUIDE)) {
    await open(page, `${STYLEGUIDE}#/${key}`);
    return;
  }
  await page.evaluate((hash) => { location.hash = hash; }, `#/${key}`);
  await expect(page.locator('html')).toHaveAttribute('data-sg-route', key);
  await page.waitForFunction(() => !document.documentElement.hasAttribute('data-ds-vt'), null, { timeout: 15000 });
  await park(page);
  await settle(page);
}

/** What a route's shot shows: a component's demo (the stage), or the whole page of a foundation. */
function subject(page, key) {
  return page.locator(key.startsWith('components/') ? '#sg-stage' : '#sg-page');
}

/** The shot's name of a route: page-<route>.png, demo-<component>.png. */
function shotName(prefix, key) {
  return `${prefix}${key.startsWith('components/') ? `demo-${key.slice('components/'.length)}` : `page-${key || 'overview'}`}.png`;
}

/**
 * Scrolls the page (not the element's own scroll containers, whose position
 * is part of the shot) so the element sits in the middle of the viewport.
 * A clip around it then never reaches a viewport edge, whatever scroll
 * position the previous step left behind.
 */
async function centre(locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    window.scrollBy(0, Math.round(rect.top + rect.height / 2 - window.innerHeight / 2));
  });
}

/** True when the box with `pad` px on every side lies inside the viewport. */
function fits(box, pad, viewport) {
  return box.x - pad >= 0 && box.y - pad >= 0
    && box.x + box.width + pad <= viewport.width && box.y + box.height + pad <= viewport.height;
}

/**
 * A viewport clip around the element, `pad` px on every side (focus rings,
 * halos, shadows). An element too close to an edge is centred first; only
 * what cannot move there (a fixed layer at the viewport edge, the end of the
 * page) is clipped by the viewport, the same way on every run. Hover and
 * press shots centre the element before the pointer arrives (pointAt), so
 * nothing scrolls under the pointer here.
 */
async function clipAround(locator, pad = 8) {
  const page = locator.page();
  const viewport = page.viewportSize();
  await locator.scrollIntoViewIfNeeded();
  let box = await locator.boundingBox();
  if (!fits(box, pad, viewport)) {
    await centre(locator);
    box = await locator.boundingBox();
  }
  const x = Math.max(0, Math.floor(box.x - pad));
  const y = Math.max(0, Math.floor(box.y - pad));
  return {
    x,
    y,
    width: Math.min(viewport.width, Math.ceil(box.x + box.width + pad)) - x,
    height: Math.min(viewport.height, Math.ceil(box.y + box.height + pad)) - y,
  };
}

/** Settles, pauses the loops at `loop`, then compares an element shot. */
async function shoot(locator, name, { loop = 0 } = {}) {
  const page = locator.page();
  // Scrolled there before settling: the scroll repaints a tall viewport and
  // moves the styleguide's scroll-spy pill, which in the container's WebKit
  // took the first capture past the screenshot timeout (section-charts).
  // Two frames let the repaint (up to 2.4s there under load) and the spy's
  // callback pass, so the pill's glide has started when settle() looks; its
  // longer deadline still covers a slow frame inside the glide.
  await locator.scrollIntoViewIfNeeded();
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await settle(page, { timeout: 10000 });
  await pauseLoops(page, loop);
  // A page-tall shot in a 6400px viewport takes WebKit seconds per capture under a parallel run.
  await expect.soft(locator, name).toHaveScreenshot(name, { animations: 'allow', timeout: 20000 });
}

/** The same for a clip around the element (states whose ring or halo leaves the box). */
async function shootAround(locator, name, { pad = 8, loop = 0 } = {}) {
  const page = locator.page();
  await settle(page);
  await pauseLoops(page, loop);
  const clip = await clipAround(locator, pad);
  await expect.soft(page, name).toHaveScreenshot(name, { clip, animations: 'allow' });
}

/** The same for the viewport (the app frame and modal overlays are the viewport). */
async function shootViewport(page, name) {
  await settle(page);
  await pauseLoops(page, 0);
  await expect.soft(page, name).toHaveScreenshot(name, { animations: 'allow' });
}

/* ── Styleguide pages ──────────────────────────────────────────────── */

test.describe('styleguide pages', () => {
  test.use({ viewport: PAGES_TALL });
  // Demos that show today (a calendar, a date picker, relative times) would
  // change their shot every day: the page's Date stands still on one day.
  // Timers and animations keep running.
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-04T10:00:00'));
  });

  test('the overview and every foundation, settled', async ({ page }) => {
    for (const key of FOUNDATIONS) {
      await route(page, key);
      await shoot(subject(page, key), shotName('', key));
    }
  });

  test('every component has a demo', () => {
    const folders = readdirSync(new URL('../../src/components/', import.meta.url)).filter((name) => !name.startsWith('_')).sort();
    expect(DEMOS, 'a demo per component folder').toEqual(folders);
  });

  for (const name of DEMOS) {
    test(`the ${name} demo, settled`, async ({ page }) => {
      if (name === 'table') annotate('components/table.css:198-226');
      await route(page, `components/${name}`);
      await shoot(subject(page, `components/${name}`), shotName('', `components/${name}`));
    });
  }
});

/* ── Fixture controls: rest, hover, pressed, keyboard focus, disabled ── */

/**
 * The controls of controls.html and the clickable parts of feedback.html:
 * `crop` is what is shown, hovered and pressed, `focus` what takes keyboard
 * focus (default: the crop; `false`: not reachable by Tab).
 */
const CONTROLS = [
  { name: 'btn-outlined', crop: '#btn-outlined' },
  { name: 'btn-primary', crop: '#btn-primary' },
  { name: 'btn-tonal', crop: '#btn-tonal' },
  { name: 'btn-text', crop: '#btn-text' },
  { name: 'btn-quiet', crop: '#btn-quiet' },
  { name: 'btn-icon', crop: '#btn-icon' },
  { name: 'btn-disc', crop: '#btn-disc' },
  { name: 'btn-sm', crop: '#btn-sm' },
  { name: 'btn-pressed', crop: '#btn-pressed' },
  { name: 'chip', crop: '#chips .ds-chip >> nth=1', focus: '#chips .ds-chip__input >> nth=1' },
  { name: 'chip-selected', crop: '#chips .ds-chip >> nth=0', focus: '#chips .ds-chip__input >> nth=0' },
  { name: 'switch-off', crop: '.ds-switch:has(#switch-off)', focus: '#switch-off' },
  { name: 'switch-on', crop: '.ds-switch:has(#switch-on)', focus: '#switch-on' },
  { name: 'check', crop: '.ds-check:has(#check-off)', focus: '#check-off' },
  // Tab reaches only the checked radio of a group.
  { name: 'radio-card', crop: '.ds-radio:has(#radio-extended)', focus: false },
  { name: 'radio-card-selected', crop: '.ds-radio:has(#radio-standard)', focus: '#radio-standard' },
  { name: 'table-row', crop: '#table tbody tr >> nth=0', focus: '#table tbody tr >> nth=0 >> input' },
  { name: 'table-sort', crop: '#table .ds-table__sort >> nth=0' },
  { name: 'link-btn', crop: '#link-btn' },
  { name: 'field', crop: '#field-name' },
  { name: 'search', crop: '#search', focus: '#search-input' },
  { name: 'segmented', crop: '#segmented .ds-segmented__option >> nth=1' },
  { name: 'drawer-item', crop: '#drawer-list .ds-drawer__item >> nth=1' },
  { name: 'parts-link', crop: '#parts a >> nth=0' },
  { name: 'errors-summary', crop: '#errors summary' },
  { name: 'tile', crop: '#tile', page: 'feedback' },
  { name: 'card-link', crop: '#card-link', page: 'feedback' },
];

const DISABLED = [
  { name: 'btn-disabled', crop: '#btn-disabled' },
  { name: 'btn-aria-disabled', crop: '#btn-aria-disabled' },
  { name: 'btn-busy', crop: '#btn-busy' },
  { name: 'chip-disabled', crop: '.ds-chip:has(.ds-chip__input:disabled)' },
  { name: 'switch-disabled-off', crop: '.ds-switch:has(#switch-disabled-off)' },
  { name: 'switch-disabled-on', crop: '.ds-switch:has(#switch-disabled-on)' },
  { name: 'check-disabled', crop: '.ds-check:has(#check-disabled)' },
  { name: 'radio-disabled', crop: '.ds-radio:has(#radio-leasing)' },
  { name: 'field-disabled', crop: '#field-retired' },
];

const CONTROL_ANCHORS = [
  'components/table.css:84', 'components/table.css:251-272', 'components/alert.css:89-131',
  'components/list.css:146-151', 'components/form.css:206-208', 'components/form.css:247',
  'components/card.css:145-155', 'components/tile.css:107-118',
];

/** Opens each fixture page once and hands over its controls. */
async function eachControl(page, list, act) {
  for (const fixture of ['controls', 'feedback']) {
    const controls = list.filter((control) => (control.page || 'controls') === fixture);
    if (!controls.length) continue;
    await open(page, `${FIXTURES}${fixture}.html`);
    for (const control of controls) {
      await act(control, page.locator(control.crop));
      await park(page);
    }
  }
}

/** Centres the element in the viewport and moves the real pointer to its centre. */
async function pointAt(locator) {
  await centre(locator);
  const box = await locator.boundingBox();
  await locator.page().mouse.move(box.x + box.width / 2, box.y + box.height / 2);
}

test.describe('fixture controls', () => {
  test('at rest', async ({ page }) => {
    await open(page, `${FIXTURES}controls.html`);
    for (const id of ['buttons', 'chips', 'switch', 'checks', 'table', 'fields', 'nav', 'text']) {
      await shoot(page.locator(`section[aria-labelledby="${id}-title"]`), `controls-${id}.png`);
    }
  });

  test('hover', async ({ page }) => {
    annotate(...CONTROL_ANCHORS);
    await eachControl(page, CONTROLS, async (control, locator) => {
      await pointAt(locator);
      await shootAround(locator, `hover-${control.name}.png`);
    });
  });

  test('held press', async ({ page }) => {
    annotate(...CONTROL_ANCHORS);
    await eachControl(page, CONTROLS, async (control, locator) => {
      // A real press, held while the shot is taken; released off the
      // content, so the press activates nothing (no toggle, no navigation).
      await pointAt(locator);
      await page.mouse.down();
      try {
        await shootAround(locator, `press-${control.name}.png`);
      } finally {
        await park(page);
        await page.mouse.up();
      }
    });
  });

  test('keyboard focus', async ({ page }) => {
    annotate(...CONTROL_ANCHORS);
    await eachControl(page, CONTROLS.filter((control) => control.focus !== false), async (control, locator) => {
      await focusByKeyboard(page, page.locator(control.focus || control.crop));
      await shootAround(locator, `focus-${control.name}.png`);
    });
  });

  test('disabled, hovered', async ({ page }) => {
    await eachControl(page, DISABLED, async (control, locator) => {
      await pointAt(locator);
      await shootAround(locator, `disabled-${control.name}.png`);
    });
  });
});

/* ── Feedback parts ────────────────────────────────────────────────── */

test('feedback parts', async ({ page }) => {
  annotate('components/progress.css:25-48', 'components/loading.css:20-40', 'components/loading.css:42-69',
    'components/loading.css:76-113', 'components/spinner.css:16-44', 'components/status.css:28-30');
  await open(page, `${FIXTURES}feedback.html`);
  for (const id of ['progress-05', 'progress-40', 'progress-100', 'progress-waiting', 'statuses']) {
    await shoot(page.locator(`#${id}`), `feedback-${id}.png`);
  }
  await shootAround(page.locator('section[aria-labelledby="alerts-title"]'), 'feedback-alerts.png', { pad: 0 });
  // Infinite loops at two fixed points of their cycle.
  for (const loop of [0, 0.25]) {
    const at = `${loop * 100}`;
    for (const id of ['progress-indeterminate', 'skeleton', 'loading']) {
      await shoot(page.locator(`#${id}`), `feedback-${id}-${at}.png`, { loop });
    }
    await shootAround(page.locator('#spinner').locator('..'), `feedback-spinners-${at}.png`, { pad: 4, loop });
  }
  // A status class swapped on the live node, settled.
  await page.locator('#status-toggle').click();
  await park(page);
  await shoot(page.locator('#status-live'), 'feedback-status-toggled.png');
});

/* ── App frame (shell fixture) ─────────────────────────────────────── */

test.describe('app frame', () => {
  test('docked drawer, no drawer, scrolled hairline at 1000px', async ({ page }) => {
    annotate('components/shell.css:248-252');
    await page.setViewportSize({ width: 1000, height: 800 });
    await open(page, `${FIXTURES}shell.html`);
    await shootViewport(page, 'shell-docked.png');
    await page.locator('#main').evaluate((view) => { view.scrollTop = 120; });
    await expect(page.locator('#app')).toHaveAttribute('data-scrolled', '');
    await shootViewport(page, 'shell-scrolled.png');
    await page.locator('#main').evaluate((view) => { view.scrollTop = 0; });
    await page.locator('#app').evaluate((app) => app.setAttribute('data-drawer-hidden', ''));
    await shootViewport(page, 'shell-drawer-hidden.png');
  });

  test('modal drawer closed and open at 800px', async ({ page }) => {
    annotate('components/shell.css:576-603', 'components/shell.css:622-645');
    await page.setViewportSize({ width: 800, height: 800 });
    await open(page, `${FIXTURES}shell.html`);
    await shootViewport(page, 'shell-modal-closed.png');
    await page.locator('#menu').click();
    await park(page);
    await expect(page.locator('#app')).toHaveAttribute('data-drawer-open', '');
    await shootViewport(page, 'shell-modal-open.png');
  });
});

/* ── Overlays (styleguide demos) ───────────────────────────────────── */

test.describe('overlays', () => {
  test('dialog and side sheet at 1280px', async ({ page }) => {
    await route(page, 'components/dialog');
    await page.locator('#sg-stage button[data-ds-open]').first().click();
    await park(page);
    await shootViewport(page, 'overlay-dialog.png');
    await page.keyboard.press('Escape');
    await expect(page.locator('#sg-stage dialog.ds-dialog[open]')).toHaveCount(0);
    await route(page, 'components/sheet');
    await page.locator('#sg-stage button[data-ds-open]').first().click();
    await park(page);
    await shootViewport(page, 'overlay-sheet.png');
  });

  test('side sheet at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await route(page, 'components/sheet');
    await page.locator('#sg-stage button[data-ds-open]').first().click();
    await park(page);
    await shootViewport(page, 'overlay-sheet-phone.png');
  });

  test('two snackbars, the tooltip and the open combobox', async ({ page }) => {
    await route(page, 'components/toast');
    // DS.overlay.toast() closes a plain snackbar after 4s and more: keep it for the shot.
    await page.evaluate(() => {
      const later = window.setTimeout;
      window.setTimeout = (fn, ms, ...args) => (ms >= 4000 ? 0 : later(fn, ms, ...args));
    });
    await page.locator('[data-toast-demo="saved"]').click();
    await page.locator('[data-toast-demo="error"]').click();
    await park(page);
    await expect(page.locator('#sg-toasts > .ds-toast')).toHaveCount(2);
    await shootAround(page.locator('#sg-toasts'), 'overlay-snackbars.png', { pad: 16 });
    await page.locator('#sg-toasts .ds-toast__close').click();
    await expect(page.locator('#sg-toasts > .ds-toast--error')).toHaveCount(0);

    await route(page, 'components/tooltip');
    const anchor = page.locator('#sg-stage [data-demo="toolbar"] [data-tip]').first();
    await pointAt(anchor);
    await expect(page.locator('.ds-tooltip[role="tooltip"]')).toBeVisible();
    await settle(page);
    const tip = await page.locator('.ds-tooltip[role="tooltip"]').boundingBox();
    const box = await anchor.boundingBox();
    const x = Math.floor(Math.min(tip.x, box.x) - 8);
    const y = Math.floor(Math.min(tip.y, box.y) - 8);
    const clip = {
      x,
      y,
      width: Math.ceil(Math.max(tip.x + tip.width, box.x + box.width) + 8) - x,
      height: Math.ceil(Math.max(tip.y + tip.height, box.y + box.height) + 8) - y,
    };
    await pauseLoops(page, 0);
    await expect.soft(page, 'overlay-tooltip.png').toHaveScreenshot('overlay-tooltip.png', { clip, animations: 'allow' });
    await park(page);

    // The combobox list, opened from its chevron: the field and the list.
    await route(page, 'components/combobox');
    const combo = page.locator('#sg-stage [data-demo="combo"]').first();
    await combo.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await combo.locator('.ds-combo__toggle').click();
    await park(page);
    await expect(combo.locator('.ds-combo__input')).toHaveAttribute('aria-expanded', 'true');
    await settle(page);
    await pauseLoops(page, 0);
    const field = await page.locator('#sg-stage .ds-field:has([data-demo="combo"])').first().boundingBox();
    const list = await combo.locator('.ds-combo__popup').boundingBox();
    const left = Math.floor(Math.min(field.x, list.x) - 16);
    const top = Math.floor(Math.min(field.y, list.y) - 16);
    const listClip = {
      x: left,
      y: top,
      width: Math.ceil(Math.max(field.x + field.width, list.x + list.width) + 16) - left,
      height: Math.ceil(Math.max(field.y + field.height, list.y + list.height) + 16) - top,
    };
    await expect.soft(page, 'overlay-combobox.png').toHaveScreenshot('overlay-combobox.png', { clip: listClip, animations: 'allow' });
  });
});

/* ── Reset fixtures (the @layer migration note of P1) ─────────────── */

for (const fixture of ['reset', 'reset-layered']) {
  test(`${fixture}.html`, async ({ page }) => {
    await open(page, `${FIXTURES}${fixture}.html`);
    const parts = ['#reset-buttons', '#reset-field', '#reset-card'];
    const boxes = await Promise.all(parts.map((id) => page.locator(id).boundingBox()));
    const x = Math.floor(Math.min(...boxes.map((b) => b.x)) - 8);
    const y = Math.floor(Math.min(...boxes.map((b) => b.y)) - 8);
    const clip = {
      x,
      y,
      width: Math.ceil(Math.max(...boxes.map((b) => b.x + b.width)) + 8) - x,
      height: Math.ceil(Math.max(...boxes.map((b) => b.y + b.height)) + 8) - y,
    };
    await pauseLoops(page, 0);
    await expect.soft(page, fixture).toHaveScreenshot(`${fixture}.png`, { clip, animations: 'allow' });
  });
}

/* ── Chromium only: phone width, theme files ──────────────────────── */

test.describe('phone width (Chromium)', () => {
  test.use({ viewport: PHONE_PAGES_TALL });

  test('the frame, table and dialog demos at 390px', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'phone variants are Chromium only, to keep the set lean');
    annotate('components/table.css:198-226');
    for (const name of ['shell', 'table', 'dialog']) {
      await route(page, `components/${name}`);
      await shoot(subject(page, `components/${name}`), shotName('phone-', `components/${name}`));
    }
  });
});

test.describe('theme files (Chromium)', () => {
  test.use({ viewport: TALL });

  for (const file of ['example', 'square', 'dim']) {
    test(`the button, form and card demos with the ${file} theme file`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'theme variants are Chromium only, to keep the set lean');
      await page.addInitScript((value) => {
        try { localStorage.setItem('ds-sg3-theme', JSON.stringify({ preset: 'default', contrast: false, scheme: 'auto', file: value })); } catch (e) { /* the shot fails visibly */ }
      }, file);
      for (const name of ['button', 'form', 'card']) {
        await route(page, `components/${name}`);
        await expect(page.locator('html')).toHaveAttribute('data-sg-theme', `default auto +${file}`);
        await shoot(subject(page, `components/${name}`), shotName(`theme-${file}-`, `components/${name}`));
      }
    });
  }
});

/* ── Forced colours ────────────────────────────────────────────────── */

test.describe('forced colours', () => {
  test.use({ viewport: TALL });

  test('the button, form, chip, dialog and loading demos', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'forced colours are shot in Chromium only, to keep the set lean');
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto(STYLEGUIDE);
    const emulated = await page.evaluate(() => matchMedia('(forced-colors: active)').matches);
    test.skip(!emulated, `${browserName} does not emulate forced-colors: active (page.emulateMedia)`);
    for (const name of ['button', 'form', 'chip', 'dialog', 'loading']) {
      await route(page, `components/${name}`);
      await shoot(subject(page, `components/${name}`), shotName('forced-', `components/${name}`));
    }
  });
});
