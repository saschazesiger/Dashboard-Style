/**
 * The final review of both styleguide pages (index.html and the Motion Lab,
 * motion.html), as sweeps over everything on them:
 *
 * - quiet load: from load until settled, every `transitionrun` and
 *   `animationstart` comes from a source on the QUIET list (loops, loaders
 *   after their delay, the first-render stagger, scroll-driven effects,
 *   the documented first-render entrances of content in the markup); a
 *   pre-checked chip, checkbox, radio or switch and the drawer's pill never
 *   animate on load;
 * - hover: in engines with a hovering pointer, one element of every kind
 *   of interactive element on both pages keeps its box (within 0.5px) and
 *   its translate, scale and transform while hovered (D14);
 * - disabled: pressing any visible :disabled or aria-disabled="true"
 *   control creates no ripple, keeps its radius and leaves its state layer
 *   (::before) as it was;
 * - forced colours: Chromium screenshots of both pages (and two lab
 *   sections) with forcedColors: 'active';
 * - page loads: over http, where the engine has cross-document View
 *   Transitions (Chromium, WebKit), the moves from index.html to
 *   motion.html and back are View Transitions in which the page frame
 *   (ds-drawer, ds-panel, ds-view) keeps its groups, the docked drawer
 *   plays nothing and the drawer's pill (ds-indicator-nav) glides in a
 *   group of its own from inside the drawer; a pill scrolled out of the
 *   drawer list goes with its page instead. Engines skip a transition
 *   whose new page is revealed after their timeout, which the shared run
 *   can cause: a page revealed later than REVEAL_BUDGET may come without
 *   one (annotated), a page revealed in time must have it;
 * - style scope (Chromium): a text change inside a card restyles its
 *   neighbourhood, not the page: fewer than 100 elements in the trace (a
 *   selector of ds.css once restyled the whole document on every DOM change
 *   inside a card). What such a recalc costs in ms is timed in perf.spec.js,
 *   where the CPU is not shared.
 */
import { test, expect } from '@playwright/test';
import { ready, settle } from './helpers/motion.js';

const PAGES = ['/styleguide/index.html', '/styleguide/motion.html'];

async function open(page, path) {
  await page.goto(path);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page, { timeout: 20000 });
}

/**
 * What may move on load, each with its reason. An event is
 * { type, name, pseudo, target, parent, loop, scroll } (target and parent
 * as "tag#id.class.class").
 */
const QUIET = [
  [(e) => e.loop, 'an infinite loop: spinners, loaders, progress, the skeleton wave'],
  [(e) => e.scroll, 'scroll-driven: it follows the scroll position, not time (hairlines, the top bar tint, edge fades, .ds-reveal--scroll)'],
  [(e) => e.name === 'ds-fade-in' && /\.(ds-loader|ds-loading|ds-boot|ds-skeleton|ds-loadbar)(\.|$)/.test(e.target), 'a loader that fades in after its delay'],
  [(e) => /\.ds-enter(\.|$)/.test(e.target) || (e.staggered && /^ds-(fade|lift)-in$/.test(e.name)), 'the first-render stagger (DS.motion.staggerOnce, enterAll)'],
  [(e) => /\.ds-status(\.|$)/.test(e.parent) && ['opacity', 'scale'].includes(e.name), 'a status icon in the markup comes in (@starting-style, status.css)'],
  [(e) => /\.ds-field__hint--error(\.|$)/.test(e.target) && e.name === 'ds-fade-in', 'a validation message in the markup fades in (form.css)'],
  [(e) => /^div\.ds-(dialog|sheet)(\.|$)/.test(e.parent) && /^ds-(fade|grow)-in$/.test(e.name), 'an overlay of the index shown in place by hand plays its entrance keyframes'],
];

test.describe('quiet load', () => {
  for (const path of PAGES) {
    test(`${path}: only loops, loaders, the first-render stagger and documented entrances move on load; pre-set controls and the pill stay still`, async ({ page }) => {
      await page.addInitScript(() => {
        window.__loadMotion = [];
        const describe = (el) => (el && el.tagName ? el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + [...el.classList].map((name) => `.${name}`).join('')
          + (el.getAttribute('aria-label') ? `[aria-label="${el.getAttribute('aria-label')}"]` : '') : '');
        for (const type of ['transitionrun', 'animationstart']) {
          addEventListener(type, (event) => {
            const name = event.animationName || event.propertyName;
            const animation = event.target.getAnimations?.({ subtree: true }).find((each) => each.effect.target === event.target
              && (each.animationName || each.transitionProperty) === name && (each.effect.pseudoElement || '') === (event.pseudoElement || ''));
            const timeline = animation?.timeline;
            window.__loadMotion.push({
              type,
              name,
              pseudo: event.pseudoElement || '',
              target: describe(event.target),
              parent: describe(event.target.parentElement),
              // A child of a container DS.motion.staggerOnce() ran on (the event may come after its classes left).
              staggered: Boolean(event.target.parentElement?.hasAttribute('data-ds-staggered')),
              control: Boolean(event.target.closest?.('.ds-chip, .ds-switch, .ds-check, .ds-radio, .ds-indicator') || event.target.matches?.('input[type="checkbox"], input[type="radio"]')),
              loop: animation ? !Number.isFinite(animation.effect.getComputedTiming().iterations) : false,
              scroll: Boolean(timeline && typeof ScrollTimeline === 'function' && timeline instanceof ScrollTimeline),
            });
          }, true);
        }
      });
      await open(page, path);
      const events = await page.evaluate(() => window.__loadMotion);
      expect(events.length, 'the walk sees the loops').toBeGreaterThan(0);
      expect(events.filter((e) => e.control).map((e) => `${e.type} ${e.name} ${e.target}`), 'chips, switches, checks, radios and the pill stay still on load').toEqual([]);
      const unexplained = events.filter((e) => !QUIET.some(([allowed]) => allowed(e))).map((e) => `${e.type} ${e.name}${e.pseudo} ${e.target} < ${e.parent}`);
      expect([...new Set(unexplained)], 'motion on load from no source on the QUIET list').toEqual([]);
    });
  }
});

/** The kinds of interactive element on the page: one visible element per tag, classes, type and role. */
function interactiveKinds(page) {
  return page.evaluate(() => {
    const SELECTOR = 'a[href], button, [role="button"], [role="tab"], [role="menuitem"], [role="option"], input:not([type="hidden"]), select, textarea, summary, label, [tabindex="0"], .ds-tile, .ds-card--interactive, .ds-table--interactive tbody tr';
    const kinds = new Map();
    let n = 0;
    for (const el of document.querySelectorAll(SELECTOR)) {
      if (el.closest('[hidden], [inert], dialog:not([open]), .ds-dialog[hidden], .ds-sheet[hidden], .ds-menu[hidden], .ds-combo__popup[hidden], .ds-tooltip, .ds-toasts, .ds-scrim, iframe')) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4 || getComputedStyle(el).visibility === 'hidden') continue;
      const key = [el.tagName, [...el.classList].filter((name) => /^(ds|sg)-/.test(name)).sort().join('.'), el.getAttribute('type') || '', el.getAttribute('role') || ''].join('|');
      if (kinds.has(key)) continue;
      n += 1;
      el.setAttribute('data-review', String(n));
      kinds.set(key, String(n));
    }
    return [...kinds.values()];
  });
}

/** The box and the transforms of `[<attribute>=id]`, after scrolling it to the middle of its scroller. */
function geometry(page, id, scroll, attribute = 'data-review') {
  return page.evaluate(async ({ id: mark, scroll: bring, attribute: name }) => {
    const el = document.querySelector(`[${name}="${mark}"]`);
    if (bring) {
      el.scrollIntoView({ block: 'center', inline: 'nearest' });
      for (let i = 0; i < 2; i += 1) await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    }
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, translate: cs.translate, scale: cs.scale, transform: cs.transform, label: el.outerHTML.slice(0, 100) };
  }, { id, scroll, attribute });
}

test.describe('hover', () => {
  for (const path of PAGES) {
    test(`${path}: no interactive element moves on hover (D14)`, async ({ page }) => {
      test.setTimeout(300000);
      await open(page, path);
      test.skip(!(await page.evaluate(() => matchMedia('(hover: hover)').matches)), 'this engine has no hovering pointer');
      const ids = await interactiveKinds(page);
      expect(ids.length).toBeGreaterThan(20);
      const moved = [];
      for (const id of ids) {
        await page.mouse.move(1, 1);
        const before = await geometry(page, id, true);
        if (before.y < 0 || before.y + before.height / 2 > 800 || before.x + before.width / 2 > 1280) continue;
        await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
        await settle(page, { timeout: 5000 });
        const after = await geometry(page, id, false);
        const shifted = ['x', 'y', 'width', 'height'].some((key) => Math.abs(after[key] - before[key]) > 0.5);
        if (shifted || ['translate', 'scale', 'transform'].some((key) => after[key] !== before[key])) {
          moved.push(`${before.label}: ${JSON.stringify(before)} -> ${JSON.stringify(after)}`);
        }
      }
      await page.mouse.move(1, 1);
      expect(moved).toEqual([]);
    });
  }
});

test.describe('disabled', () => {
  for (const path of PAGES) {
    test(`${path}: a press on a disabled control ripples, morphs and lights nothing`, async ({ page }) => {
      test.setTimeout(300000);
      await open(page, path);
      const ids = await page.evaluate(() => {
        let n = 0;
        const out = [];
        for (const control of document.querySelectorAll(':disabled, [aria-disabled="true"]')) {
          if (control.closest('[hidden], [inert], .ds-tooltip, iframe') || control.matches('fieldset, optgroup, option')) continue;
          // A control drawn by its label (a chip, a switch) is pressed there.
          const rect = control.getBoundingClientRect();
          const host = rect.width < 4 || rect.height < 4 || getComputedStyle(control).opacity === '0' ? control.closest('label') : control;
          if (!host) continue;
          const box = host.getBoundingClientRect();
          if (box.width < 4 || box.height < 4 || getComputedStyle(host).visibility === 'hidden') continue;
          n += 1;
          host.setAttribute('data-review-disabled', String(n));
          out.push(String(n));
        }
        return out;
      });
      // The index shows the disabled states; the lab may have none.
      if (path === PAGES[0]) expect(ids.length).toBeGreaterThan(3);
      const read = (id) => page.evaluate((mark) => {
        const el = document.querySelector(`[data-review-disabled="${mark}"]`);
        const before = getComputedStyle(el, '::before');
        return {
          radius: getComputedStyle(el).borderTopLeftRadius,
          layer: before.content === 'none' ? null : before.opacity,
          ripples: el.querySelectorAll('.ds-press-ripple').length + (el.closest('.ds-chip')?.querySelectorAll('.ds-press-ripple').length ?? 0),
          label: el.outerHTML.slice(0, 100),
        };
      }, id);
      const pressed = [];
      for (const id of ids) {
        await page.mouse.move(1, 1);
        const box = await geometry(page, id, true, 'data-review-disabled');
        await settle(page, { timeout: 5000 });
        const rest = await read(id);
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        // Longer than the press-in (--ds-dur-micro) and the ripple's minimum (--ds-dur-instant).
        await page.waitForTimeout(250);
        const down = await read(id);
        await page.mouse.up();
        if (down.ripples || down.radius !== rest.radius || down.layer !== rest.layer) pressed.push(`${rest.label}: ${JSON.stringify(rest)} -> ${JSON.stringify(down)}`);
      }
      expect(pressed).toEqual([]);
    });
  }
});

test.describe('forced colours', () => {
  test('both pages and two lab sections keep their edges and states in a contrast theme (Chromium)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
    test.setTimeout(120000);
    await page.emulateMedia({ forcedColors: 'active' });
    for (const path of PAGES) {
      await open(page, path);
      await expect(page).toHaveScreenshot(`forced-${path.split('/').pop().replace('.html', '')}.png`);
    }
    for (const section of ['controls', 'feedback']) {
      await page.evaluate(async (id) => {
        document.getElementById(id).scrollIntoView({ block: 'start' });
        for (let i = 0; i < 2; i += 1) await new Promise((resolve) => requestAnimationFrame(() => resolve()));
      }, section);
      await settle(page, { timeout: 20000 });
      await expect(page).toHaveScreenshot(`forced-lab-${section}.png`);
    }
  });
});

/**
 * Records, on every page the context loads, what its incoming cross-document
 * View Transition does once ready: the groups that move, the drawer's
 * one-sided images (an image alone in its group plays a slide), the first
 * keyframe of the pill's group (where it starts) and the drawer's box.
 */
function recordReveal(page) {
  return page.addInitScript(() => {
    window.__revealed = new Promise((resolve) => {
      addEventListener('pagereveal', (event) => {
        // ms from the start of the navigation (the click) to the reveal.
        const at = performance.now();
        const transition = event.viewTransition;
        if (!transition) { resolve({ at, transition: false, groups: [] }); return; }
        transition.ready.then(() => {
          const animations = document.documentElement.getAnimations({ subtree: true });
          const of = (pseudo) => animations.filter((animation) => animation.effect.pseudoElement === pseudo);
          const first = of('::view-transition-group(ds-indicator-nav)')[0]?.effect.getKeyframes()[0];
          const matrix = first?.transform ? new DOMMatrixReadOnly(first.transform) : null;
          const drawer = document.querySelector('.ds-drawer').getBoundingClientRect();
          resolve({
            at,
            transition: true,
            groups: [...new Set(animations.map((animation) => animation.effect.pseudoElement || '').filter((pseudo) => /^::view-transition-group/.test(pseudo)))],
            drawerImages: [...of('::view-transition-old(ds-drawer)'), ...of('::view-transition-new(ds-drawer)')].map((animation) => `${animation.effect.pseudoElement} ${animation.animationName}`),
            pill: matrix ? { x: matrix.e, y: matrix.f, width: parseFloat(first.width), height: parseFloat(first.height) } : null,
            drawer: { left: drawer.left, top: drawer.top, right: drawer.right, bottom: drawer.bottom },
          });
        }, () => resolve({ at, transition: true, skipped: true, groups: [] }));
      });
    });
  });
}

/**
 * How late a page may be revealed and still must get its transition (ms
 * from the click). Below every engine's timeout for the new page (Chromium
 * waits seconds; WebKit kept transitions for pages revealed after 1.9s),
 * above what the pages take: about 0.1-0.2s for the lab, whose demos come
 * after the reveal, and 0.3-0.5s for the index, unloaded. Only the shared
 * run of every spec reveals a page later than this.
 */
const REVEAL_BUDGET = 1000;

/**
 * Whether the page got its View Transition. A page revealed within
 * REVEAL_BUDGET must have one that runs; a later one may have none (the
 * engine's timeout), noted as an annotation instead of a failure.
 */
function expectTransition(revealed, label) {
  if ((!revealed.transition || revealed.skipped) && revealed.at > REVEAL_BUDGET) {
    test.info().annotations.push({ type: 'late reveal', description: `${label}: revealed after ${Math.round(revealed.at)}ms, the engine skipped the transition` });
    return false;
  }
  expect(revealed.transition, `${label} (revealed after ${Math.round(revealed.at)}ms)`).toBe(true);
  expect(revealed.skipped, `${label} (revealed after ${Math.round(revealed.at)}ms)`).toBeUndefined();
  return true;
}

/** The pill's group starts inside the drawer (it never glides in over the top bar), or the pill has no group of its own. */
function expectPillInDrawer(revealed, label) {
  if (!revealed.pill) return;
  const { pill, drawer } = revealed;
  expect(pill.x, `${label}: the pill starts inside the drawer (left)`).toBeGreaterThanOrEqual(drawer.left - 1);
  expect(pill.y, `${label}: the pill starts inside the drawer (top), under the top bar`).toBeGreaterThanOrEqual(drawer.top - 1);
  expect(pill.x + pill.width, `${label}: the pill starts inside the drawer (right)`).toBeLessThanOrEqual(drawer.right + 1);
  expect(pill.y + pill.height, `${label}: the pill starts inside the drawer (bottom)`).toBeLessThanOrEqual(drawer.bottom + 1);
}

test.describe('page loads', () => {
  test('index.html to motion.html and back are cross-document View Transitions: the frame keeps its groups, the drawer stays, the pill glides in its own group', async ({ page }) => {
    // Tall enough that both drawer lists show every link: the pill is in view on both pages.
    await page.setViewportSize({ width: 1280, height: 1100 });
    await recordReveal(page);
    await open(page, PAGES[0]);
    test.skip(!(await page.evaluate(() => 'onpagereveal' in window)), 'no cross-document View Transitions in this engine');
    for (const [from, link, to] of [[PAGES[0], 'motion.html', /motion\.html/], [PAGES[1], 'index.html', /index\.html/]]) {
      const label = `${from.split('/').pop()} to ${link}`;
      await page.locator(`#sg-nav a[href="${link}"]`).click();
      await page.waitForURL(to);
      const revealed = await page.evaluate(() => window.__revealed);
      if (expectTransition(revealed, label)) {
        // The page frame is named on both sides: an in-place demo dialog of
        // the index (.ds-dialog--contained) once unnamed it.
        for (const name of ['ds-drawer', 'ds-panel', 'ds-view', 'ds-indicator-nav']) expect(revealed.groups, label).toContain(`::view-transition-group(${name})`);
        // The docked drawer stays: no image of it slides in or out alone.
        expect(revealed.drawerImages, `${label}: the drawer's images play nothing`).toEqual([]);
        expectPillInDrawer(revealed, label);
      }
      await ready(page);
      await settle(page, { timeout: 20000 });
    }
  });

  test('a pill scrolled out of the drawer list goes with its page instead of gliding in over the top bar', async ({ page }) => {
    await recordReveal(page);
    await open(page, PAGES[0]);
    test.skip(!(await page.evaluate(() => 'onpagereveal' in window)), 'no cross-document View Transitions in this engine');
    // At 1280x800 the index's drawer list scrolls: the link to the lab lies
    // below the fold, and scrolling to it takes the active item's pill out of view.
    const link = page.locator('#sg-nav a[href="motion.html"]');
    await link.scrollIntoViewIfNeeded();
    const out = await page.evaluate(() => {
      const pill = document.querySelector('#sg-nav .ds-indicator').getBoundingClientRect();
      const list = document.querySelector('#sg-drawer').getBoundingClientRect();
      return pill.top < list.top || pill.bottom > list.bottom;
    });
    expect(out, 'the active item is scrolled out of the drawer').toBe(true);
    await link.click();
    await page.waitForURL(/motion\.html/);
    const revealed = await page.evaluate(() => window.__revealed);
    if (expectTransition(revealed, 'index.html, scrolled, to motion.html')) {
      expectPillInDrawer(revealed, 'index.html, scrolled, to motion.html');
      expect(revealed.groups, 'the pill has no pair to glide between').not.toContain('::view-transition-group(ds-indicator-nav)');
    }
    await ready(page);
  });
});

/**
 * Where each page gets its text change: an element inside a card. The
 * restyled elements are counted here, in the shared run (a count does not
 * depend on the load); perf.spec.js times the same changes (its own copy of
 * these targets) where the CPU is not shared.
 */
const STYLE_TARGETS = {
  '/styleguide/index.html': '.ds-card p',
  '/styleguide/motion.html': '[data-lab-demo="progress"] .ds-progress__label',
};

test.describe('style scope', () => {
  for (const path of PAGES) {
    test(`${path}: a text change inside a card restyles its neighbourhood, not the page (Chromium)`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'the element count of a style recalc comes from the tracing of Chromium');
      await open(page, path);
      const selector = STYLE_TARGETS[path];
      // Every loop paused: the trace then holds the recalc of the change alone.
      const nodes = await page.evaluate(() => {
        for (const animation of document.getAnimations()) animation.pause();
        return document.querySelectorAll('*').length;
      });
      const change = (n) => page.evaluate(([target, text]) => {
        const element = document.querySelector(target);
        element.textContent = text;
        void getComputedStyle(element).color;
      }, [selector, `${n}%`]);
      const client = await page.context().newCDPSession(page);
      const events = [];
      client.on('Tracing.dataCollected', (data) => events.push(...data.value));
      const complete = new Promise((resolve) => client.once('Tracing.tracingComplete', resolve));
      await client.send('Tracing.start', { categories: 'devtools.timeline', transferMode: 'ReportEvents' });
      await change(77);
      await client.send('Tracing.end');
      await complete;
      const counts = events.filter((event) => event.name === 'UpdateLayoutTree' && event.args?.elementCount !== undefined).map((event) => event.args.elementCount);
      expect(counts.length, 'the trace holds the recalc').toBeGreaterThan(0);
      expect(Math.max(...counts), `restyled elements of ${nodes}`).toBeLessThan(100);
    });
  }
});
