/**
 * The controls of 1.1.0 (P3) in real engines: the press morph and the
 * micro press-in, the ripple on the new hosts, the focus snap and focus
 * layer, chips (slot glide, drawn check, the wrap), the switch (handle,
 * halo, disabled, state words), drawn checkboxes and radios, text fields,
 * busy faces and icon swaps, the one disabled model and the drawer press.
 *
 * Curves are read with freeze() and seek() (deterministic); a change that
 * starts a transition runs in the same task as the pause (act()), so
 * nothing finishes before it is sampled, however busy the machine is. Real
 * pointer and keyboard input is used where the behaviour depends on it
 * (:active, :focus-visible, the ripple). In the `fallback` project the
 * spring is its cubic fallback: no overshoot, and no interpolate-size.
 */
import { test, expect } from './base-test.js';
import {
  ready, settle, freeze, seek, sample, timeline, focusByKeyboard,
  series, expectMonotonic, expectWithin, expectPeakAtMost, expectSettles,
} from './helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/controls.html';

/** Loads the controls fixture (optionally with DS.ripple attached) and lets its load-time motion end. */
async function open(page, { attach = false, query = '' } = {}) {
  await page.goto(FIXTURE + query);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
  if (attach) await page.evaluate(() => { window.fxRipples = DS.ripple.attach(document); });
}

/** Adds markup at the end of the fixture's .ds-theme wrapper. */
function inject(page, html) {
  return page.evaluate((markup) => document.querySelector('.ds-theme').insertAdjacentHTML('beforeend', markup), html);
}

/**
 * Runs `action(el)` and pauses every animation of the document in the same
 * task. Chromium starts the transition of an SVG glyph (a chip's check)
 * only when the glyph's own style is read, so every element of the theme
 * is read first.
 */
function act(locator, action) {
  return locator.evaluate((el, source) => {
    new Function('el', `(${source})(el)`)(el);
    for (const node of document.querySelectorAll('.ds-theme *')) void getComputedStyle(node).opacity;
    for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
  }, action.toString());
}

/** Plays every paused animation again. */
function resume(page) {
  return page.evaluate(() => {
    for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) if (animation.playState === 'paused') animation.play();
  });
}

/**
 * Freezes the page and reads raw computed values of several elements at
 * each time, in one pass: a seek past an animation's end finishes it, and
 * a finished animation leaves getAnimations(), so a second pass over the
 * same times would find nothing to seek. `targets` maps a name to
 * [selector, props (camelCase), pseudo]; each entry is { time, [name]: { prop: value } }.
 */
async function sampleMany(page, targets, times) {
  const out = [];
  for (const time of times) {
    // Again while a read started an animation: Chromium styles (and so
    // transitions) a glyph only once its svg is visible, so a style read,
    // or the style flush of a seek, can start a transition that runs in
    // real time (under load, tens of milliseconds) and would be read at
    // that time instead of `time`. Pause, seek and read stay separate
    // tasks: WebKit reads a stale value when a seek ends a transition in
    // the task that reads.
    let entry = null;
    for (let pass = 0; !entry; pass += 1) {
      if (pass === 5) throw new Error(`sampleMany: animations kept starting at ${time}ms`);
      await freeze(page);
      await seek(page, time);
      const result = await page.evaluate((list) => {
        const values = Object.fromEntries(Object.entries(list).map(([name, [selector, props, pseudo]]) => {
          const cs = getComputedStyle(document.querySelector(selector), pseudo || null);
          return [name, Object.fromEntries(props.map((prop) => [prop, cs[prop]]))];
        }));
        return { values, started: document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline)).some((animation) => animation.playState === 'running') };
      }, targets);
      if (!result.started) entry = { time, ...result.values };
    }
    out.push(entry);
  }
  return out;
}

/**
 * Freezes the page at `time` (ms) for a screenshot or a read: pauses and
 * seeks every animation, reads the style of every element of the theme,
 * and does it again while that read started an animation (see sampleMany()).
 */
async function holdAt(page, time) {
  for (let pass = 0; pass < 5; pass += 1) {
    await freeze(page);
    await seek(page, time);
    const started = await page.evaluate(() => {
      for (const node of document.querySelectorAll('.ds-theme *')) void getComputedStyle(node).opacity;
      return document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline)).some((animation) => animation.playState === 'running');
    });
    if (!started) return;
  }
  throw new Error(`holdAt: animations kept starting at ${time}ms`);
}

/** One property of one target of sampleMany() as numbers (`pick` turns the raw value into a number). */
const track = (samples, name, prop, pick = parseFloat) => samples.map((entry) => pick(entry[name][prop]));

/** The n-th number of a computed value ('20px 0px', '0.857', 'inset(0px 50%)'). */
const nth = (index, fallback = 0) => (text) => {
  const numbers = (String(text).match(/-?[\d.]+(?:e-?\d+)?/g) || []).map(Number);
  return numbers[index] ?? numbers[0] ?? fallback;
};

/** The four edges of an inset() clip-path as [top, right, bottom, left]. */
const insetOf = (text) => {
  const match = /inset\(([^)]*)\)/.exec(text || '');
  if (!match) return [0, 0, 0, 0];
  const v = match[1].split(/\s+round\s+/)[0].trim().split(/\s+/).map(parseFloat);
  return [v[0], v[1] ?? v[0], v[2] ?? v[0], v[3] ?? v[1] ?? v[0]];
};

/** The channels of an rgb()/rgba() colour. */
const rgb = (text) => (text.match(/[\d.]+/g) || []).map(Number);

/** A computed token of the theme as a number (opacities). */
const tokenNumber = (page, name) => page.evaluate((token) => parseFloat(getComputedStyle(document.querySelector('.ds-theme')).getPropertyValue(token)), name);

/** A role as the rgb() string an element would compute for it. */
const roleColour = (page, name) => page.evaluate((token) => {
  const probe = document.createElement('span');
  probe.style.color = `var(${token})`;
  document.querySelector('.ds-theme').append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}, name);

/** Every 10ms from 0 to `end` (inclusive). */
/**
 * The wrap row #x-row in the page: the last chip's place, the first
 * chip's visible right edge (its body less a clip-path inset), its label's
 * left and the left of the second chip's body, with the row's gap.
 */
function wrapEdges() {
  const row = document.querySelector('#x-row');
  const chips = row.querySelectorAll('.ds-chip');
  const body = chips[0].querySelector('.ds-chip__body');
  const clip = /^inset\(([^)]*)\)/.exec(getComputedStyle(body).clipPath);
  const sides = clip ? clip[1].split(/\s+round\s+/)[0].trim().split(/\s+/).map(parseFloat) : [0];
  const last = chips[2].getBoundingClientRect();
  return {
    x: last.x,
    y: last.y,
    edge: body.getBoundingClientRect().right - (sides.length > 1 ? sides[1] : sides[0]),
    label: body.querySelector(':scope > span').getBoundingClientRect().left,
    next: chips[1].querySelector('.ds-chip__body').getBoundingClientRect().left,
    gap: parseFloat(getComputedStyle(row).columnGap) || 0,
  };
}

/** Seeks the paused page through `times` and reads wrapEdges() at each (one pass). */
async function sampleWrap(page, times) {
  await freeze(page);
  const out = [];
  for (const time of times) {
    await seek(page, time);
    out.push({ time, ...await page.evaluate(`(${wrapEdges.toString()})()`) });
  }
  return out;
}

/**
 * The toggled chip keeps pace with its neighbour: its visible edge plus
 * the gap never passes the next chip's left (1px), and both it and its
 * label start where they were and glide.
 */
function expectEdgeKeepsPace(samples, start, testInfo) {
  for (const entry of samples) expect(entry.edge + entry.gap, `overlap at ${entry.time}ms`).toBeLessThanOrEqual(entry.next + 1);
  const labels = samples.map((entry) => entry.label);
  expect(Math.abs(labels[0] - start.label), 'the label starts where it was').toBeLessThanOrEqual(1);
  expect(Math.abs(labels.at(-1) - start.label), 'the label moved').toBeGreaterThan(10);
  expect(Math.abs(labels[10] - labels[0]), 'the label is on its way at 100ms').toBeGreaterThan(2);
  if (springs(testInfo)) expectPeakAtMost(labels, 1.05);
  else expectMonotonic(labels);
}

const steps = (end, every = 10) => Array.from({ length: Math.floor(end / every) + 1 }, (_, index) => index * every);

/** Whether the spring of this project overshoots (the fallback project plays its cubic). */
const springs = (testInfo) => testInfo.project.name !== 'fallback';

/** Two animation frames, so a change has been laid out and painted. */
const frames = (page) => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));

/**
 * Whether a clipping ancestor cuts into what is drawn around the element:
 * the pixels around it, once as they are and once with the clip lifted by
 * `unclip` (a style sheet); equal pixels mean nothing was cut off.
 */
async function isClipped(page, locator, unclip, pad = 14) {
  const box = await locator.boundingBox();
  const clip = { x: Math.floor(box.x - pad), y: Math.floor(box.y - pad), width: Math.ceil(box.width + 2 * pad), height: Math.ceil(box.height + 2 * pad) };
  await settle(page);
  await frames(page);
  const before = await page.screenshot({ clip, animations: 'allow', caret: 'hide' });
  await page.addStyleTag({ content: unclip });
  await frames(page);
  const after = await page.screenshot({ clip, animations: 'allow', caret: 'hide' });
  return !before.equals(after);
}

test.describe('press', () => {
  test('a held press reaches the pressed radius (12px) and the layer within 100ms', async ({ page }) => {
    await open(page);
    const button = page.locator('#btn-primary');
    const pressedOpacity = await tokenNumber(page, '--ds-state-pressed');
    const box = await button.boundingBox();
    expect(await button.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBeCloseTo(box.height / 2, 1);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(100);
    const held = await button.evaluate((el) => ({
      radius: parseFloat(getComputedStyle(el).borderTopLeftRadius),
      layer: parseFloat(getComputedStyle(el, '::before').opacity),
    }));
    await page.mouse.up();
    expect(held.radius).toBeCloseTo(12, 1);
    expect(held.layer).toBeCloseTo(pressedOpacity, 2);
  });

  test('the release springs the radius back to half the height and settles within --ds-dur-medium + 50ms', async ({ page }, testInfo) => {
    await open(page);
    const button = page.locator('#btn-primary');
    // The press-in: --ds-dur-micro.
    const pressIn = await button.evaluate((el) => {
      el.classList.add('ds-pressed');
      // One transition per corner (the longhands of border-radius).
      return [...new Set(el.getAnimations().filter((a) => /radius$/.test(a.transitionProperty)).map((a) => a.effect.getTiming().duration))];
    });
    expect(pressIn).toEqual([50]);
    await settle(page);
    expect(await button.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBeCloseTo(12, 1);
    await act(button, (el) => el.classList.remove('ds-pressed'));
    const values = series(await sample(button, ['borderRadius'], steps(300)), 'borderRadius');
    expect(values[0]).toBeCloseTo(12, 1);
    expectSettles(values, 18, 0.05);
    // Settled by --ds-dur-medium + 50ms: every sample from 250ms on is at rest.
    expectWithin(values.slice(25), 17.95, 18.05);
    if (springs(testInfo)) expectPeakAtMost(values, 1.05, { from: 12, to: 18 });
    else expectMonotonic(values, { direction: 'up' });
  });

  test('.ds-pressed keeps the morph for at least --ds-dur-instant after a 30ms click', async ({ page }) => {
    await open(page, { attach: true });
    const button = page.locator('#btn-tonal');
    await button.evaluate((el) => {
      window.fxPress = {};
      el.addEventListener('pointerdown', () => { window.fxPress.down = performance.now(); });
      new MutationObserver(() => {
        if (window.fxPress.down && !el.classList.contains('ds-pressed') && window.fxPress.up === undefined) {
          window.fxPress.up = performance.now();
          window.fxPress.radius = parseFloat(getComputedStyle(el).borderTopLeftRadius);
        }
      }).observe(el, { attributes: true, attributeFilter: ['class'] });
    });
    const box = await button.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    // 30ms, and at least two rendered frames: an engine whose animation
    // clock only advances with frames (Firefox) would otherwise leave the
    // morph at its start on a busy machine, as no frame showed it.
    await page.evaluate(() => Promise.all([
      new Promise((resolve) => setTimeout(resolve, 30)),
      new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    ]));
    await page.mouse.up();
    await expect.poll(() => page.evaluate(() => window.fxPress.up !== undefined), { timeout: 2000 }).toBe(true);
    const press = await page.evaluate(() => window.fxPress);
    expect(press.up - press.down).toBeGreaterThanOrEqual(98);
    // The morph was held to its end: the release starts from the pressed radius.
    expect(press.radius).toBeCloseTo(12, 0);
  });

  test('disabled, aria-disabled and busy buttons show no layer change, no morph and no ripple', async ({ page }) => {
    await open(page, { attach: true });
    for (const id of ['#btn-disabled', '#btn-aria-disabled', '#btn-busy']) {
      const button = page.locator(id);
      const read = () => button.evaluate((el) => ({
        radius: getComputedStyle(el).borderTopLeftRadius,
        layer: getComputedStyle(el, '::before').opacity,
        ripples: el.querySelectorAll('.ds-press-ripple').length,
      }));
      await button.hover({ force: true });
      await settle(page);
      const rest = await read();
      await page.mouse.down();
      await page.waitForTimeout(120);
      const held = await read();
      await page.mouse.up();
      expect(held, id).toEqual({ ...rest, ripples: 0 });
      expect(Number(rest.layer), id).toBe(0);
      await page.mouse.move(1, 1);
    }
  });

  test('the disc never scales, on hover or on press', async ({ page }) => {
    await open(page, { attach: true });
    const disc = page.locator('#btn-disc');
    const read = () => disc.evaluate((el) => [el, '::before'].map((part) => {
      const cs = part === el ? getComputedStyle(el) : getComputedStyle(el, part);
      return `${cs.transform} ${cs.scale}`;
    }));
    await disc.hover();
    await settle(page);
    expect(await read()).toEqual(['none none', 'none none']);
    await page.mouse.down();
    await page.waitForTimeout(80);
    expect(await read()).toEqual(['none none', 'none none']);
    await page.mouse.up();
  });
});

test.describe('ripple', () => {
  const COMBO = `<div class="ds-combo" id="x-combo"><input class="ds-input ds-combo__input" role="combobox" aria-expanded="false" aria-label="Model" value="Lat"><button class="ds-combo__toggle" id="x-combo-toggle" type="button" tabindex="-1" aria-label="Show all"></button></div>`;

  test('the combobox toggle, the errors summary and a table sort each get one ripple, clipped to their box', async ({ page }) => {
    await open(page, { attach: true });
    await inject(page, COMBO);
    for (const selector of ['#x-combo-toggle', '#errors summary', '#table .ds-table__sort >> nth=0']) {
      const host = page.locator(selector);
      await host.scrollIntoViewIfNeeded();
      const box = await host.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      const state = await host.evaluate((el) => ({
        ripples: el.querySelectorAll(':scope > .ds-press-ripple').length,
        overflow: getComputedStyle(el).overflowX,
        position: getComputedStyle(el).position,
      }));
      await page.mouse.up();
      expect(state.ripples, selector).toBe(1);
      expect(state.overflow, selector).toBe('clip');
      if (selector === '#x-combo-toggle') expect(state.position).toBe('absolute');
      await expect.poll(() => host.locator(':scope > .ds-press-ripple').count(), { timeout: 2000 }).toBe(0);
    }
  });

  test('under .ds-ripples their pressed layer stays at the hover value (layer and ripple never add up)', async ({ page }) => {
    await open(page, { attach: true });
    await inject(page, COMBO);
    for (const selector of ['#x-combo-toggle', '#errors summary', '#table .ds-table__sort >> nth=0', '.ds-radio >> nth=1']) {
      const host = page.locator(selector);
      const layer = () => host.evaluate((el) => Number(getComputedStyle(el, '::before').opacity));
      await host.hover();
      await settle(page);
      const hover = await layer();
      await page.mouse.down();
      await settle(page);
      const pressed = await layer();
      await page.mouse.up();
      expect(hover, selector).toBeGreaterThan(0);
      expect(pressed, selector).toBeCloseTo(hover, 3);
      await page.mouse.move(1, 1);
      await settle(page);
    }
  });
});

test.describe('focus', () => {
  /** Focuses `next` with Tab from the control before it and records outline and layer from the focus event on. */
  async function tabInto(page, previous, next, ms = 300) {
    await focusByKeyboard(page, previous);
    await settle(page);
    await next.evaluate((el, duration) => {
      window.fxFocus = new Promise((resolve) => {
        el.addEventListener('focus', () => {
          const out = [];
          const start = performance.now();
          const read = () => {
            const cs = getComputedStyle(el);
            out.push({ time: performance.now() - start, style: cs.outlineStyle, width: parseFloat(cs.outlineWidth), offset: parseFloat(cs.outlineOffset) });
          };
          read();
          const transitions = el.getAnimations().filter((a) => a.transitionProperty === 'outline-offset').map((a) => a.effect.getTiming().duration);
          const frame = () => {
            read();
            if (performance.now() - start < duration) requestAnimationFrame(frame);
            else resolve({ samples: out, transitions });
          };
          requestAnimationFrame(frame);
        }, { once: true });
      });
    }, ms);
    await page.keyboard.press('Tab');
    return page.evaluate(() => window.fxFocus);
  }

  test('after Tab the ring is solid in the first frame and its offset snaps from 4 to 2px in --ds-dur-fast', async ({ page }) => {
    await open(page);
    const { samples, transitions } = await tabInto(page, page.locator('#btn-tonal'), page.locator('#btn-text'));
    expect(transitions).toEqual([150]);
    expect(samples[0].style).toBe('solid');
    expect(samples[0].width).toBe(2);
    expect(samples[0].offset).toBeGreaterThanOrEqual(3.5);
    expectMonotonic(series(samples, 'offset'), { direction: 'down' });
    for (const entry of samples.filter((item) => item.time >= 200)) expect(entry.offset).toBeCloseTo(2, 2);
    expect(samples.every((entry) => entry.style === 'solid' && entry.width === 2)).toBe(true);
  });

  test('the focus layer lies at --ds-state-focus (.10)', async ({ page }) => {
    await open(page);
    const button = page.locator('#btn-outlined');
    await focusByKeyboard(page, button);
    await settle(page);
    expect(await button.evaluate((el) => Number(getComputedStyle(el, '::before').opacity))).toBeCloseTo(0.1, 3);
  });

  test('a focused .ds-enter button runs its entrance and the outline-offset transition together', async ({ page }) => {
    await open(page, { query: '?speed=0.1' });
    await inject(page, '<p><button class="ds-btn" type="button" id="x-before">Back</button> <button class="ds-btn ds-enter" type="button" id="x-enter">Retry</button></p>');
    const button = page.locator('#x-enter');
    // One Tab from the button before it, so the snap starts once from the
    // ring at rest: focusByKeyboard() focuses, blurs and refocuses, and
    // WebKit (whole-pixel offsets) starts no transition when the blur's
    // own transition still reads 2px as Tab lands.
    await page.locator('#x-before').focus();
    await page.keyboard.press('Tab');
    expect(await button.evaluate((el) => el === document.activeElement && el.matches(':focus-visible'))).toBe(true);
    const running = (await timeline(button)).filter((entry) => entry.playState === 'running');
    expect(running.some((entry) => entry.type === 'animation' && entry.name === 'ds-fade-in')).toBe(true);
    expect(running.some((entry) => entry.type === 'transition' && entry.name === 'outline-offset')).toBe(true);
  });

  test('inset rings of segmented options and drawer items are not clipped', async ({ page }) => {
    await open(page);
    const option = page.locator('#segmented .ds-segmented__option >> nth=1');
    await focusByKeyboard(page, option);
    expect(await isClipped(page, option, '.ds-segmented { overflow: visible !important; }', 4)).toBe(false);
    // The drawer list scrolls, so lifting its clip would move the items: the
    // inset ring lies inside the item, and the focused item inside the list.
    const item = page.locator('#drawer-list .ds-drawer__item >> nth=8');
    await focusByKeyboard(page, item);
    await settle(page);
    const geometry = await item.evaluate((el) => {
      const cs = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      const list = el.closest('.ds-drawer__list').getBoundingClientRect();
      return { offset: parseFloat(cs.outlineOffset), width: parseFloat(cs.outlineWidth), inside: box.top >= list.top - 0.5 && box.bottom <= list.bottom + 0.5 && box.left >= list.left - 0.5 && box.right <= list.right + 0.5 };
    });
    expect(geometry).toEqual({ offset: -2, width: 2, inside: true });
  });
});

test.describe('chips', () => {
  const chip = (page, index) => page.locator('#chips .ds-chip').nth(index);

  test('selecting grows the slot to 18px without overshoot and draws the check; deselecting reverses in order', async ({ page }) => {
    await open(page);
    const target = chip(page, 1);
    const targets = {
      slot: ['#chips .ds-chip:nth-of-type(2) .ds-chip__body', ['width'], '::after'],
      stroke: ['#chips .ds-chip:nth-of-type(2) .ds-chip__check [pathLength]', ['strokeDashoffset']],
    };
    await act(target, (el) => el.querySelector('input').click());
    let values = await sampleMany(page, targets, steps(350));
    const slot = track(values, 'slot', 'width');
    const stroke = track(values, 'stroke', 'strokeDashoffset');
    expect(slot[0]).toBeCloseTo(0, 1);
    expectMonotonic(slot, { direction: 'up' });
    expectWithin(slot, 0, 18);
    expectSettles(slot, 18, 0.5);
    expect(stroke[0]).toBeCloseTo(1, 3);
    expectMonotonic(stroke, { direction: 'down' });
    expectSettles(stroke, 0, 0.01);
    await resume(page);
    await settle(page);
    // The deselect starts from the settled selected state, not from a
    // transition a late style read started after settle().
    await page.waitForFunction(([slotSelector, strokeSelector]) => {
      const slot = parseFloat(getComputedStyle(document.querySelector(slotSelector), '::after').width);
      const stroke = parseFloat(getComputedStyle(document.querySelector(strokeSelector)).strokeDashoffset);
      const glyph = document.querySelector(strokeSelector);
      return Math.abs(slot - 18) < 0.01 && stroke === 0 && !glyph.getAnimations().length;
    }, [targets.slot[0], targets.stroke[0]]);

    // Deselect: the check leaves first, the slot closes after --ds-dur-micro.
    await act(target, (el) => el.querySelector('input').click());
    values = await sampleMany(page, targets, steps(400));
    const back = track(values, 'slot', 'width');
    const backStroke = track(values, 'stroke', 'strokeDashoffset');
    // At 40ms the check is leaving while the slot still waits (--ds-dur-micro).
    expect(back[4]).toBeCloseTo(18, 1);
    expect(backStroke[4]).toBeGreaterThan(0);
    expectMonotonic(back, { direction: 'down' });
    expectSettles(back, 0, 0.5);
    expectMonotonic(backStroke, { direction: 'up' });
    expectSettles(backStroke, 1, 0.01);
  });

  test('a radio-chip pair keeps the row width within 2px', async ({ page }) => {
    await open(page);
    const row = page.locator('#chips');
    const first = chip(page, 3);
    await act(first, (el) => el.querySelector('input').click());
    const widths = [];
    for (const time of steps(320, 20)) {
      await seek(page, time);
      widths.push(await row.evaluate((el) => {
        const chips = el.querySelectorAll('.ds-chip');
        return chips[4].getBoundingClientRect().right - chips[3].getBoundingClientRect().left;
      }));
    }
    expectWithin(widths, widths[0] - 2, widths[0] + 2);
  });

  test('a chip rendered selected starts no animation', async ({ page }) => {
    await open(page);
    const count = await page.evaluate(() => {
      document.querySelector('#chips').insertAdjacentHTML('beforeend',
        `<label class="ds-chip" id="x-chip"><input class="ds-chip__input" type="checkbox" checked><span class="ds-chip__body">${DS.icons.icon(DS.icons.check, 18, 'ds-chip__check')}<span>Pre-selected</span></span></label>`);
      return document.querySelector('#x-chip').getAnimations({ subtree: true }).length;
    });
    expect(count).toBe(0);
  });

  test('with attach(), a chip pushed to the next line glides there from where it was', async ({ page }, testInfo) => {
    await open(page, { attach: true });
    // A row just wide enough for its chips: selecting the first one pushes
    // the last one to a new line. At the top of the page: flip() leaves
    // items outside the viewport alone.
    const before = await page.evaluate(() => {
      const names = ['Laptops', 'Desktops', 'Printers'];
      document.querySelector('.ds-theme').insertAdjacentHTML('afterbegin', `<fieldset class="ds-chips" id="x-row" style="display: inline-flex">${names.map((name) =>
        `<label class="ds-chip"><input class="ds-chip__input" type="checkbox"><span class="ds-chip__body">${DS.icons.icon(DS.icons.check, 18, 'ds-chip__check')}<span>${name}</span></span></label>`).join('')}</fieldset>`);
      const row = document.querySelector('#x-row');
      row.style.width = `${row.getBoundingClientRect().width + 6}px`;
      row.style.display = '';
      const box = row.lastElementChild.getBoundingClientRect();
      const first = row.querySelector('.ds-chip__body');
      const edge = first.getBoundingClientRect().right;
      const label = first.querySelector(':scope > span').getBoundingClientRect().left;
      row.querySelector('input').click();
      for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
      return { x: box.x, y: box.y, edge, label };
    });
    // Mid-glide, the moving chip rests on an opaque backing in the colour
    // behind the row, so it never shows the chips it crosses through it.
    await holdAt(page, 40);
    const backing = await page.evaluate(() => {
      const row = document.querySelector('#x-row');
      let behind = '';
      for (let node = row.parentElement; node && !behind; node = node.parentElement) {
        const colour = getComputedStyle(node).backgroundColor;
        if (colour !== 'transparent' && !/,\s*0\)$/.test(colour)) behind = colour;
      }
      return { glide: row.hasAttribute('data-ds-glide'), chip: getComputedStyle(row.lastElementChild).backgroundColor, behind };
    });
    expect(backing.glide).toBe(true);
    expect(backing.chip).toBe(backing.behind);
    if (testInfo.project.name !== 'fallback') {
      await expect(page.locator('#x-row')).toHaveScreenshot('wrap-glide.png', { animations: 'allow', caret: 'hide' });
    }
    const samples = await sampleWrap(page, steps(500));
    const xs = samples.map((entry) => entry.x);
    const ys = samples.map((entry) => entry.y);
    // The selected chip's slot landed at once: its body opens with its
    // neighbour's glide (no overlap, no gap), from its old edge.
    expect(Math.abs(samples[0].edge - before.edge), 'the selected chip starts at its old edge').toBeLessThanOrEqual(1);
    expectEdgeKeepsPace(samples, before, testInfo);
    // No jump: it starts where it was, is on its way at 100ms and lands on the next line.
    expect(Math.abs(xs[0] - before.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(ys[0] - before.y)).toBeLessThanOrEqual(2);
    expect(ys.at(-1) - before.y, 'the last chip moved to the next line').toBeGreaterThan(10);
    for (const values of [xs, ys]) {
      expect(Math.abs(values[10] - values[0])).toBeGreaterThan(2);
      expect(Math.abs(values[10] - values.at(-1))).toBeGreaterThan(2);
      if (springs(testInfo)) expectPeakAtMost(values, 1.05);
      else expectMonotonic(values);
      expect(values.at(-2)).toBeCloseTo(values.at(-1), 1);
    }
    // Back to one line: the body cannot paint its old width, but its label
    // glides back and it never overlaps the next chip. (Seeked, so the
    // glide ends paused.)
    const selected = samples.at(-1);
    await act(page.locator('#x-row'), (el) => el.querySelector('input').click());
    const back = await sampleWrap(page, steps(500));
    expectEdgeKeepsPace(back, selected, testInfo);
    expect(Math.abs(back[0].x - selected.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(back.at(-1).y - before.y), 'the last chip is back on the first line').toBeLessThanOrEqual(1);
    await resume(page);
    await settle(page);
    // Pushed down again, in real time: the backing is there for the glide and
    // goes once the chips landed.
    expect(await page.evaluate(() => {
      document.querySelector('#x-row input').click();
      return document.querySelector('#x-row').hasAttribute('data-ds-glide');
    })).toBe(true);
    await expect(page.locator('#x-row')).not.toHaveAttribute('data-ds-glide');
    expect(await page.locator('#x-row').evaluate((el) => el.style.getPropertyValue('--ds-chips-backdrop'))).toBe('');
  });
});

test.describe('switch', () => {
  test('the handle travels 20px on the spring, never scaled above 1, and the halo follows it', async ({ page }, testInfo) => {
    await open(page);
    await act(page.locator('#switch-off'), (el) => el.click());
    const times = steps(320);
    const values = await sampleMany(page, {
      handle: ['#switch-off + .ds-switch__track', ['translate', 'scale'], '::after'],
      halo: ['#switch-off + .ds-switch__track', ['translate'], '::before'],
    }, times);
    const travel = track(values, 'handle', 'translate', nth(0));
    const scale = track(values, 'handle', 'scale', nth(0, 1));
    expect(travel[0]).toBeCloseTo(0, 1);
    expectSettles(travel, 20, 0.05);
    if (springs(testInfo)) expectPeakAtMost(travel, 1.05, { from: 0, to: 20 });
    else expectWithin(travel, 0, 20);
    expectWithin(scale, 4 / 7 - 0.001, 1);
    expectSettles(scale, 6 / 7, 0.002);
    track(values, 'halo', 'translate', nth(0)).forEach((value, index) => expect(Math.abs(value - travel[index]), `${times[index]}ms`).toBeLessThanOrEqual(0.5));
  });

  test('pressing grows the handle to its full size (1)', async ({ page }) => {
    await open(page);
    const handle = page.locator('#switch-on + .ds-switch__track');
    await handle.scrollIntoViewIfNeeded();
    const box = await handle.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(150);
    const scale = await handle.evaluate((el) => getComputedStyle(el, '::after').scale);
    await page.mouse.up();
    expect(Number(scale)).toBeCloseTo(1, 3);
  });

  test('a disabled switch shows no hover change, halo or grow and has the not-allowed cursor', async ({ page }) => {
    await open(page);
    const label = page.locator('#switch-disabled-off').locator('xpath=..');
    const handle = page.locator('#switch-disabled-off + .ds-switch__track');
    const read = () => handle.evaluate((el) => ({
      handle: getComputedStyle(el, '::after').backgroundColor,
      scale: getComputedStyle(el, '::after').scale,
      halo: getComputedStyle(el, '::before').opacity,
    }));
    const rest = await read();
    await handle.hover();
    await settle(page);
    expect(await read()).toEqual(rest);
    await page.mouse.down();
    await page.waitForTimeout(150);
    expect(await read()).toEqual(rest);
    await page.mouse.up();
    expect(Number(rest.halo)).toBe(0);
    expect(await label.evaluate((el) => getComputedStyle(el).cursor)).toBe('not-allowed');
  });

  test('the two state words crossfade: the leaving word fades first, the other rises in after it', async ({ page }) => {
    await open(page);
    await inject(page, `<label class="ds-switch" id="x-switch"><input type="checkbox" role="switch"><span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">Alerts</span><span class="ds-switch__state" aria-hidden="true"><span class="ds-switch__on">On</span><span class="ds-switch__off">Off</span></span></label>`);
    const on = page.locator('#x-switch .ds-switch__on');
    const off = page.locator('#x-switch .ds-switch__off');
    expect(await on.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
    expect(await off.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await act(page.locator('#x-switch input'), (el) => el.click());
    const values = await sampleMany(page, {
      on: ['#x-switch .ds-switch__on', ['opacity', 'translate']],
      off: ['#x-switch .ds-switch__off', ['opacity']],
    }, [0, 40, 100, 150, 250]);
    const incoming = track(values, 'on', 'opacity');
    const leaving = track(values, 'off', 'opacity');
    const rise = track(values, 'on', 'translate', nth(1));
    // At 40ms the old word is fading and the new one still waits (--ds-dur-micro).
    expect(leaving[1]).toBeLessThan(1);
    expect(incoming[1]).toBe(0);
    expectMonotonic(incoming, { direction: 'up' });
    expectMonotonic(leaving, { direction: 'down' });
    expectSettles(incoming, 1, 0.001);
    expectSettles(leaving, 0, 0.001);
    expect(rise[1]).toBeGreaterThan(0);
    expectSettles(rise, 0, 0.01);
  });
});

test.describe('checkbox and radio', () => {
  const BOXES = `<p id="x-boxes"><input class="ds-checkbox" type="checkbox" id="x-check" aria-label="Select">
    <input class="ds-checkbox" type="checkbox" id="x-mixed" checked aria-label="Mixed">
    <input class="ds-radio-input" type="radio" name="x-size" id="x-radio" aria-label="Small"></p>`;

  test('the check and the dot are pseudo-elements of the input, and they render', async ({ page }) => {
    await open(page);
    const check = page.locator('#check-on');
    const content = await check.evaluate((el) => [getComputedStyle(el, '::before').content, getComputedStyle(el, '::after').content]);
    expect(content).toEqual(['""', '""']);
    expect(await page.locator('#radio-standard').evaluate((el) => getComputedStyle(el, '::after').content)).toBe('""');
    // The drawn check shows: hiding the pseudo-element changes the pixels.
    const box = await check.boundingBox();
    const clip = { x: Math.floor(box.x), y: Math.floor(box.y), width: Math.ceil(box.width), height: Math.ceil(box.height) };
    const drawn = await page.screenshot({ clip });
    await page.addStyleTag({ content: '#check-on::before { visibility: hidden; }' });
    await frames(page);
    expect(drawn.equals(await page.screenshot({ clip }))).toBe(false);
  });

  test('nothing animates on load', async ({ page }) => {
    await open(page);
    const count = await page.evaluate((markup) => {
      document.querySelector('.ds-theme').insertAdjacentHTML('beforeend', markup.replace('id="x-check"', 'id="x-check" checked').replace('id="x-radio"', 'id="x-radio" checked'));
      document.querySelector('#x-mixed').indeterminate = true;
      return document.querySelector('#x-boxes').getAnimations({ subtree: true }).length;
    }, BOXES);
    expect(count).toBe(0);
  });

  test('the check wipes in from inset(0 100% 0 0) to inset(0) after --ds-dur-micro', async ({ page }) => {
    await open(page);
    await inject(page, BOXES);
    const box = page.locator('#x-check');
    await act(box, (el) => el.click());
    const wipe = await sample(box, ['clipPath.right', 'opacity'], [0, 40, ...steps(320).slice(5)], { pseudo: '::before' });
    const right = series(wipe, 'clipPath.right');
    expect(right[0]).toBe(100);
    expect(right[1]).toBe(100);
    expectMonotonic(right, { direction: 'down' });
    expectSettles(right, 0, 0.01);
    expect(wipe[0].opacity).toBe(1);
  });

  test('checked to indeterminate morphs: the check collapses to the centre while the dash grows', async ({ page }) => {
    await open(page);
    await inject(page, BOXES);
    const box = page.locator('#x-mixed');
    await act(box, (el) => { el.indeterminate = true; });
    const values = await sampleMany(page, {
      check: ['#x-mixed', ['clipPath'], '::before'],
      dash: ['#x-mixed', ['clipPath'], '::after'],
    }, steps(260));
    const check = track(values, 'check', 'clipPath', (text) => insetOf(text)[3]);
    const dash = track(values, 'dash', 'clipPath', (text) => insetOf(text)[1]);
    expect(check[0]).toBeCloseTo(0, 1);
    expectMonotonic(check, { direction: 'up' });
    expectSettles(check, 50, 0.01);
    expect(dash[0]).toBeCloseTo(50, 1);
    expectMonotonic(dash, { direction: 'down' });
    expectSettles(dash, 0, 0.01);
  });

  test('the radio dot grows on the spring (peak at most 1.05)', async ({ page }, testInfo) => {
    await open(page);
    await inject(page, BOXES);
    const radio = page.locator('#x-radio');
    await act(radio, (el) => el.click());
    const dot = series(await sample(radio, ['scale.x'], steps(300), { pseudo: '::after' }), 'scale.x');
    expect(dot[0]).toBeCloseTo(0, 2);
    expectSettles(dot, 1, 0.005);
    if (springs(testInfo)) expectPeakAtMost(dot, 1.05, { from: 0, to: 1 });
    else expectWithin(dot, 0, 1);
  });

  test('hovering the .ds-check row lights the input\'s halo', async ({ page }) => {
    await open(page);
    const input = page.locator('#check-off');
    const halo = () => input.evaluate((el) => getComputedStyle(el).boxShadow);
    const rest = await halo();
    await page.locator('#check-off + span').hover();
    await settle(page);
    const lit = await halo();
    expect(lit).not.toBe(rest);
    expect(lit).not.toMatch(/transparent|rgba\(0, 0, 0, 0\)/);
  });

  test('the halo of a table checkbox is not clipped by the table wrapper', async ({ page }) => {
    await open(page);
    const input = page.locator('#table thead input[type="checkbox"]');
    await input.hover();
    expect(await isClipped(page, input, '.ds-table-wrap, .ds-table, .ds-table th, .ds-table td { overflow: visible !important; }')).toBe(false);
  });

  test('a switch and a chip in a table cell keep their hidden inputs (not drawn as table checkboxes)', async ({ page }) => {
    await open(page);
    const result = await page.evaluate(() => {
      const switchMarkup = (id, disabled) => `<label class="ds-switch"><input type="checkbox" role="switch" id="${id}"${disabled ? ' disabled' : ''}><span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">Sync</span></label>`;
      const chipMarkup = (id, disabled) => `<label class="ds-chip"><input class="ds-chip__input" type="checkbox" id="${id}"${disabled ? ' disabled' : ''}><span class="ds-chip__body">${DS.icons.icon(DS.icons.check, 18, 'ds-chip__check')}<span>Open</span></span></label>`;
      const cells = (prefix) => `<td>${switchMarkup(`${prefix}-switch`, false)}</td><td>${switchMarkup(`${prefix}-switch-off`, true)}</td><td>${chipMarkup(`${prefix}-chip`, false)}</td><td>${chipMarkup(`${prefix}-chip-off`, true)}</td>`;
      document.querySelector('.ds-theme').insertAdjacentHTML('beforeend',
        `<div id="x-cells"><table class="ds-table"><tbody><tr>${cells('t')}</tr></tbody></table><table><tbody><tr>${cells('p')}</tr></tbody></table></div>`);
      const read = (id) => {
        const input = document.getElementById(id);
        const style = getComputedStyle(input);
        const label = input.closest('label');
        const shown = label.querySelector('.ds-switch__track, .ds-chip__body');
        return {
          position: style.position, opacity: style.opacity, appearance: style.appearance, width: style.width,
          before: getComputedStyle(input, '::before').content,
          offset: shown.getBoundingClientRect().left - label.getBoundingClientRect().left,
        };
      };
      const out = {};
      for (const name of ['switch', 'switch-off', 'chip', 'chip-off']) out[name] = { table: read(`t-${name}`), plain: read(`p-${name}`) };
      return out;
    });
    for (const [name, { table, plain }] of Object.entries(result)) {
      expect(table.position, name).toBe('absolute');
      expect(table.opacity, name).toBe('0');
      expect(table.appearance, name).not.toBe('none');
      expect(table.width, name).toBe('1px');
      expect(table.before, name).toBe('none');
      // The track (or chip body) sits where it does outside a table.
      expect(Math.abs(table.offset - plain.offset), name).toBeLessThanOrEqual(0.5);
    }
  });

  test('forced colours draw boxes, marks and dots in system colours', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'forced colours are emulated in Chromium only (one baseline)');
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page);
    await inject(page, BOXES);
    await page.evaluate(() => {
      document.querySelector('#x-check').checked = true;
      document.querySelector('#x-radio').checked = true;
      document.querySelector('#x-mixed').indeterminate = true;
    });
    await settle(page);
    await expect(page.locator('#checks')).toHaveScreenshot('forced-checks.png');
    await expect(page.locator('#x-boxes')).toHaveScreenshot('forced-boxes.png');
  });

  test.describe('touch (WebKit)', () => {
    test.use({ hasTouch: true, isMobile: true });

    test('a tap grows the halo from 0 at the centre', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'the iOS engine');
      // iOS applies :active only with a touchstart listener: attach() adds it.
      await open(page, { attach: true });
      expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true);
      const input = page.locator('#check-off');
      const spread = (text) => (String(text).match(/(-?[\d.]+)px/g) || []).map(parseFloat)[3] ?? 0;
      expect(spread(await input.evaluate((el) => getComputedStyle(el).boxShadow))).toBe(0);
      // A Playwright tap lasts a few ms: read the transition the press starts.
      const pressed = input.evaluate((el) => new Promise((resolve) => {
        el.addEventListener('touchstart', () => {
          const halo = el.getAnimations().find((animation) => animation.transitionProperty === 'box-shadow');
          resolve({
            active: el.matches(':active'),
            duration: halo?.effect.getTiming().duration,
            keyframes: halo?.effect.getKeyframes().map((frame) => frame.boxShadow),
          });
        }, { once: true, passive: true });
      }));
      await input.tap();
      const press = await pressed;
      expect(press.active).toBe(true);
      expect(press.duration).toBe(250);
      expect(spread(press.keyframes[0])).toBe(0);
      expect(spread(press.keyframes.at(-1))).toBe(11);
    });
  });
});

test.describe('fields', () => {
  test('the label takes the primary colour in the first focus frame', async ({ page }) => {
    await open(page);
    const primary = await roleColour(page, '--ds-primary');
    const field = page.locator('#field-name');
    const result = field.evaluate((el) => new Promise((resolve) => {
      const label = document.querySelector('label[for="field-name"]');
      el.addEventListener('focus', () => {
        const atOnce = getComputedStyle(label).color;
        requestAnimationFrame(() => resolve([atOnce, getComputedStyle(label).color]));
      }, { once: true });
    }));
    await field.click();
    expect(await result).toEqual([primary, primary]);
  });

  test('an error message fades in, and where height animates to auto its room opens from 0', async ({ page }, testInfo) => {
    await open(page);
    const grows = await page.evaluate(() => CSS.supports('interpolate-size: allow-keywords'));
    const message = page.locator('#x-error');
    // Validation while someone works in the field: focus is inside it.
    await page.locator('#field-name').focus();
    await settle(page);
    await act(page.locator('#fields .ds-field >> nth=0'), (el) => {
      el.insertAdjacentHTML('beforeend', '<small class="ds-field__hint ds-field__hint--error" id="x-error">Already used by LAPTOP-0017.</small>');
    });
    const heightTransition = (await timeline(message)).some((entry) => entry.name === 'height');
    const values = await sample(message, ['opacity', 'rect.height'], steps(220));
    const opacity = series(values, 'opacity');
    expect(opacity[0]).toBeCloseTo(0, 2);
    expectMonotonic(opacity, { direction: 'up' });
    expectSettles(opacity, 1, 0.001);
    const height = series(values, 'rect.height');
    if (grows && testInfo.project.name === 'chromium') {
      expect(heightTransition).toBe(true);
      expect(height[0]).toBeCloseTo(0, 1);
      expectMonotonic(height, { direction: 'up' });
      expect(height.at(-1)).toBeGreaterThan(10);
    } else {
      // Only the fade: the room is there at once.
      expect(heightTransition).toBe(false);
      expect(height[0]).toBeGreaterThan(10);
    }
  });

  test('a message already in the markup does not open its room on load (nothing below it moves)', async ({ page }) => {
    await page.addInitScript(() => {
      window.fxLoad = { height: [], heights: [] };
      document.addEventListener('transitionrun', (event) => {
        if (event.propertyName === 'height' && event.target.closest && event.target.closest('.ds-field__hint--error')) window.fxLoad.height.push(event.target.id);
      }, true);
      // Every frame from the first one: the message's height as painted.
      const start = performance.now();
      const frame = (now) => {
        const message = document.querySelector('#field-serial-error');
        if (message) window.fxLoad.heights.push(message.getBoundingClientRect().height);
        if (now - start < 600) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    await page.goto(FIXTURE);
    await ready(page);
    await settle(page);
    await page.waitForFunction(() => window.fxLoad.heights.length > 0 && performance.now() > 700);
    const seen = await page.evaluate(() => window.fxLoad);
    const height = await page.locator('#field-serial-error').evaluate((el) => el.getBoundingClientRect().height);
    expect(height).toBeGreaterThan(10);
    expect(seen.height, 'height transitions of error messages on load').toEqual([]);
    expectWithin(seen.heights, height - 0.5, height + 0.5);
  });
});

test.describe('busy faces and icon swaps', () => {
  const FACES = `<p><button class="ds-btn ds-btn--primary" type="button" id="x-save"><span class="ds-btn__faces">
    <span class="ds-btn__face">Save</span>
    <span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--sm"></span>Saving</span>
    <span class="ds-btn__face ds-btn__face--done" aria-hidden="true"><span data-x-icon="check"></span>Saved</span>
  </span></button></p>`;

  async function faces(page) {
    await inject(page, FACES);
    await page.evaluate(() => {
      const slot = document.querySelector('#x-save [data-x-icon]');
      slot.outerHTML = DS.icons.icon(DS.icons.check, 16);
    });
    return page.locator('#x-save');
  }

  test('a faces button at rest runs no endless loop; busy, its spinner turns', async ({ page }) => {
    await open(page);
    const button = await faces(page);
    const loops = () => button.evaluate((el) => el.getAnimations({ subtree: true })
      .filter((animation) => !Number.isFinite(animation.effect.getComputedTiming().iterations))
      .map((animation) => animation.playState));
    expect((await loops()).filter((state) => state === 'running')).toEqual([]);
    await button.evaluate((el) => el.setAttribute('aria-busy', 'true'));
    expect(await loops()).toContain('running');
    await button.evaluate((el) => el.removeAttribute('aria-busy'));
    expect((await loops()).filter((state) => state === 'running')).toEqual([]);
  });

  test('the width stays the same through rest, busy, done and rest', async ({ page }) => {
    await open(page);
    const button = await faces(page);
    const widths = await button.evaluate((el) => new Promise((resolve) => {
      const seen = [];
      let running = true;
      const frame = () => {
        seen.push({ width: el.getBoundingClientRect().width, busy: el.getAttribute('aria-busy'), done: el.classList.contains('ds-btn--done') });
        if (running) requestAnimationFrame(frame);
      };
      frame();
      DS.motion.busy(el, () => new Promise((done) => setTimeout(done, 400))).then(() => {
        const wait = () => (el.classList.contains('ds-btn--done') ? requestAnimationFrame(wait) : setTimeout(() => { running = false; resolve(seen); }, 300));
        wait();
      });
    }));
    expect(widths.some((entry) => entry.busy === 'true')).toBe(true);
    expect(widths.some((entry) => entry.done)).toBe(true);
    expectWithin(widths.map((entry) => entry.width), widths[0].width - 0.5, widths[0].width + 0.5);
  });

  test('work faster than the loader delay never shows the busy face', async ({ page }) => {
    await open(page);
    const button = await faces(page);
    const seen = await button.evaluate((el) => new Promise((resolve) => {
      const busyFace = el.querySelector('.ds-btn__face--busy');
      const label = el.querySelector('.ds-btn__face');
      const out = { busy: 0, label: 1 };
      let running = true;
      const frame = () => {
        out.busy = Math.max(out.busy, Number(getComputedStyle(busyFace).opacity));
        out.label = Math.min(out.label, Number(getComputedStyle(label).opacity));
        if (running) requestAnimationFrame(frame);
      };
      frame();
      DS.motion.busy(el, () => new Promise((done) => setTimeout(done, 50)), { done: false })
        .then(() => setTimeout(() => { running = false; resolve(out); }, 300));
    }));
    expect(seen.busy).toBe(0);
    expect(seen.label).toBe(1);
  });

  test('the done face stays at least --ds-hold-success', async ({ page }) => {
    await open(page);
    const button = await faces(page);
    const held = await button.evaluate((el) => new Promise((resolve) => {
      let added = 0;
      new MutationObserver(() => {
        if (el.classList.contains('ds-btn--done') && !added) added = performance.now();
        else if (!el.classList.contains('ds-btn--done') && added) resolve(performance.now() - added);
      }).observe(el, { attributes: true, attributeFilter: ['class'] });
      DS.motion.busy(el, () => Promise.resolve());
    }));
    expect(held).toBeGreaterThanOrEqual(595);
  });

  test('the incoming icon springs up from .6 (peak at most 1.05), the outgoing one is gone within --ds-dur-instant', async ({ page }, testInfo) => {
    await open(page);
    await inject(page, '<p><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" id="x-copy" aria-label="Copy link"><span class="ds-icon-swap" id="x-swap"></span></button></p>');
    const swap = page.locator('#x-swap');
    await swap.evaluate((el) => el.append(DS.icons.iconElement(DS.icons.copy, 20)));
    await act(swap, (el) => { DS.motion.crossfade(el, DS.icons.icon(DS.icons.check, 20), { kind: 'icon' }); });
    const values = await sampleMany(page, {
      incoming: ['#x-swap > .ds-icon-swap__b', ['scale', 'opacity']],
      outgoing: ['#x-swap > .ds-icon-swap__a', ['opacity']],
    }, steps(300));
    const scale = track(values, 'incoming', 'scale', nth(0, 1));
    const outgoing = track(values, 'outgoing', 'opacity');
    expect(scale[0]).toBeCloseTo(0.6, 2);
    expectSettles(scale, 1, 0.005);
    if (springs(testInfo)) expectPeakAtMost(scale, 1.05, { from: 0.6, to: 1 });
    else expectWithin(scale, 0.6, 1);
    expect(outgoing[10]).toBeCloseTo(0, 3);
    expect(await swap.getAttribute('data-swap')).toBe('b');
  });
});

test.describe('disabled', () => {
  test('disabling a fieldset brings every control to its disabled look within 150ms, without a step', async ({ page }) => {
    await open(page);
    await inject(page, `<fieldset id="x-set" style="border: 0; padding: 0; margin: 0">
      <button class="ds-btn ds-btn--primary" type="button" id="x-btn">Save</button>
      <label class="ds-chip"><input class="ds-chip__input" type="checkbox" id="x-chip-input"><span class="ds-chip__body"><span>Archived</span></span></label>
      <label class="ds-switch"><input type="checkbox" role="switch" id="x-sw"><span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">Sync</span></label>
      <input class="ds-checkbox" type="checkbox" id="x-box" checked aria-label="Managed">
    </fieldset>`);
    await settle(page);
    await act(page.locator('#x-set'), (el) => { el.disabled = true; });
    const cases = [
      ['#x-btn', 'backgroundColor', 150],
      ['#x-chip-input + .ds-chip__body', 'color', 150],
      ['#x-box', 'backgroundColor', 150],
      // The track keeps the timing of its toggle (--ds-dur-base).
      ['#x-sw + .ds-switch__track', 'backgroundColor', 200],
    ];
    const samples = await sampleMany(page, Object.fromEntries(cases.map(([selector, property]) => [selector, [selector, [property]]])), [0, 75, 100, 150, 200, 250]);
    for (const [selector, property, end] of cases) {
      const at = (time) => rgb(samples.find((entry) => entry.time === time)[selector][property]);
      const values = [at(0), at(end / 2), at(end), at(end + 50)];
      expect(values[1], `${selector}: a fade, not a step`).not.toEqual(values[0]);
      expect(values[1], `${selector}: still on its way at ${end / 2}ms`).not.toEqual(values[2]);
      expect(values[2], `${selector}: there by ${end}ms`).toEqual(values[3]);
      // Every channel moves one way.
      for (let channel = 0; channel < values[0].length; channel += 1) expectMonotonic(values.map((value) => value[channel]), { tolerance: 0.5 });
    }
  });

  test('a chip and a radio card in a disabled fieldset get no ripple and no .ds-pressed', async ({ page }) => {
    await open(page, { attach: true });
    await inject(page, `<fieldset class="ds-chips" id="x-off" disabled>
      <label class="ds-chip" id="x-off-chip"><input class="ds-chip__input" type="checkbox"><span class="ds-chip__body"><span>Archived</span></span></label>
      <label class="ds-radio" id="x-off-radio"><input type="radio" name="x-off"><span><strong>Leasing</strong></span></label>
    </fieldset>`);
    await settle(page);
    /** Presses `id` for 120ms and reads what DS.ripple added meanwhile. */
    const press = async (id) => {
      const host = page.locator(id);
      await host.scrollIntoViewIfNeeded();
      const box = await host.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(120);
      const held = await host.evaluate((el) => ({
        ripples: el.querySelectorAll('.ds-press-ripple').length,
        pressed: el.matches('.ds-pressed') || el.querySelector('.ds-pressed') !== null,
      }));
      await page.mouse.up();
      await page.mouse.move(1, 1);
      await settle(page);
      return held;
    };
    for (const id of ['#x-off-chip', '#x-off-radio']) {
      expect(await page.locator(`${id} input`).evaluate((el) => [el.disabled, el.matches(':disabled')]), id).toEqual([false, true]);
      expect(await press(id), id).toEqual({ ripples: 0, pressed: false });
    }
    // The same hosts do press once the fieldset is enabled: the check above is not vacuous.
    await page.locator('#x-off').evaluate((el) => { el.disabled = false; });
    for (const id of ['#x-off-chip', '#x-off-radio']) expect(await press(id), id).toEqual({ ripples: 1, pressed: true });
  });
});

test.describe('drawer', () => {
  test('the modal drawer of a .ds-base page keeps its forced-colours edge on its own edge (outline-offset 0)', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await page.goto('/test/browser/fixtures/shell.html');
    await ready(page);
    await page.evaluate(() => document.querySelector('.ds-theme').classList.add('ds-base'));
    if (browserName === 'chromium') {
      await page.emulateMedia({ forcedColors: 'active' });
      expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
    }
    await page.locator('#menu').click();
    await settle(page);
    const read = (selector) => page.locator(selector).evaluate((el) => ({ style: getComputedStyle(el).outlineStyle, offset: getComputedStyle(el).outlineOffset }));
    expect(await read('#drawer')).toEqual({ style: 'solid', offset: '0px' });
    // Programmatic focus targets (tabindex -1) take no resting offset from the page base.
    expect((await read('#main')).offset).toBe('0px');
    expect((await read('.ds-page-head__title')).offset).toBe('0px');
  });

  test('pressing the active item morphs the item and its pill to 12px, without a transform, and springs back', async ({ page }) => {
    await open(page);
    const item = page.locator('#drawer-list .ds-drawer__item[aria-current="page"]');
    const pill = page.locator('#drawer-list .ds-drawer__indicator');
    // The pill's corners are its clip's (--ds-indicator-radius, 1.2.0).
    const read = () => Promise.all([item, pill].map((locator) => locator.evaluate((el) => ({
      radius: parseFloat(el.classList.contains('ds-indicator') ? getComputedStyle(el).getPropertyValue('--ds-indicator-radius') : getComputedStyle(el).borderTopLeftRadius),
      transform: `${getComputedStyle(el).transform} ${getComputedStyle(el).translate} ${getComputedStyle(el).scale}`,
    }))));
    await item.scrollIntoViewIfNeeded();
    const [restItem, restPill] = await read();
    expect(restItem.radius).toBeCloseTo(24, 1);
    expect(restPill.radius).toBeCloseTo(24, 1);
    const box = await item.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(120);
    const [heldItem, heldPill] = await read();
    await page.mouse.up();
    expect(heldItem.radius).toBeCloseTo(12, 1);
    expect(heldPill.radius).toBeCloseTo(12, 1);
    expect(heldItem.transform).toBe(restItem.transform);
    expect(heldPill.transform).toBe(restPill.transform);
    await settle(page);
    const [backItem, backPill] = await read();
    expect(backItem.radius).toBeCloseTo(24, 1);
    expect(backPill.radius).toBeCloseTo(24, 1);
  });

  test('with attach(), a click on another item still glides the pill there (the held press keeps its movement)', async ({ page }) => {
    await open(page, { attach: true });
    const item = page.locator('#drawer-list .ds-drawer__item >> nth=2');
    await item.scrollIntoViewIfNeeded();
    // Read in the click task, after the fixture made the item active and
    // called update(): the item is still .ds-pressed then.
    await page.evaluate(() => {
      document.addEventListener('click', (event) => {
        const pill = document.querySelector('#drawer-list .ds-drawer__indicator');
        const target = event.target.closest('.ds-drawer__item');
        window.fxDrawerClick = {
          pressed: target.classList.contains('ds-pressed'),
          current: target.getAttribute('aria-current'),
          properties: getComputedStyle(pill).transitionProperty,
          running: pill.getAnimations().map((animation) => animation.transitionProperty),
        };
      }, { once: true });
    });
    await item.click();
    const seen = await page.evaluate(() => window.fxDrawerClick);
    expect(seen.pressed, 'the item is still pressed during the click').toBe(true);
    expect(seen.current).toBe('page');
    expect(seen.properties.split(/,\s*/)).toEqual(expect.arrayContaining(['--ds-indicator-t', '--ds-indicator-b', '--ds-indicator-radius']));
    expect(seen.running).toEqual(expect.arrayContaining(['--ds-indicator-t', '--ds-indicator-b']));
  });
});
