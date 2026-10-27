/**
 * The data parts of 1.4.0 (P6) in real engines: the table (the hover layer
 * on the cells over a selected row, select all in one frame, expandable
 * rows on grid-template-rows, the chevron and the sort arrow, sort FLIP on
 * <tr> continuing mid-flight, the live guard), clickable cards and tiles
 * (press morph, nothing moving on hover, the ripple inside the card, the
 * optional hover shadow, no press on the host from another control in
 * it), the layout (cards in a row, the row toggle, a selected row's
 * hairlines), the alert stack (dismiss glides the rest up), status icons
 * that a keyed reorder never replays, and forced colours. The fixture is fixtures/data.html; the page's own
 * behaviour (toggling aria-expanded, select all) runs in the tests, as a
 * page script would.
 *
 * Curves are read with seek-based samples; a change that starts a
 * transition or a FLIP runs in the same task as the pause, so nothing
 * finishes before it is read.
 */
import { test, expect } from './base-test.js';
import {
  ready, settle, seek, sample, timeline,
  series, expectMonotonic, expectPeakAtMost, expectSettles, expectContinuous,
} from './helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/data.html';

/** The table rows of the fixture: key, device, load. */
const ROWS = [['a1', 'LAPTOP-0042', '0.4'], ['a2', 'DESKTOP-0107', '1.2'], ['a3', 'TABLET-0008', '2.5']];

/** Loads the data fixture (optionally with DS.ripple attached) and lets its load-time motion end. */
async function open(page, { attach = false } = {}) {
  await page.goto(FIXTURE);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
  if (attach) await page.evaluate(() => { window.fxRipples = DS.ripple.attach(document); });
}

/**
 * Runs `action(el)` on the element and pauses every animation of the
 * document in the same task. Chromium starts the transition of an SVG
 * glyph (a chevron) only when the glyph's own style is read, so every
 * element of the theme is read first. `action` is serialised: it cannot
 * use variables of the test.
 */
function act(locator, action) {
  return locator.evaluate((el, source) => {
    new Function('el', `(${source})(el)`)(el);
    for (const node of document.querySelectorAll('.ds-theme *')) void getComputedStyle(node).opacity;
    for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
  }, action.toString());
}

/** Ends every finite animation (play() would restart one that was seeked to its end). */
const finishAll = (page) => page.evaluate(() => {
  for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) {
    if (Number.isFinite(animation.effect.getComputedTiming().iterations)) animation.finish();
  }
});

/** A duration token of the theme in ms, as the engine resolves it. */
function tokenMs(page, name) {
  return page.evaluate((token) => {
    const probe = document.createElement('span');
    probe.style.transitionDuration = `var(${token})`;
    document.querySelector('.ds-theme').append(probe);
    const value = getComputedStyle(probe).transitionDuration;
    probe.remove();
    return parseFloat(value) * (value.endsWith('ms') ? 1 : 1000);
  }, name);
}

/**
 * 40 points of a glide, short of its end: a paused animation seeked to its
 * end leaves getAnimations() unfinished, so finishAll() could not end it
 * and the flip() promise would never resolve. The end is read after
 * finishAll().
 */
const GLIDE = Array.from({ length: 40 }, (_, index) => ({ progress: index / 40 }));

/** Every `every` ms from 0 to `end` (inclusive). */
const steps = (end, every = 10) => Array.from({ length: Math.floor(end / every) + 1 }, (_, index) => index * every);

/** Whether the spring of this project overshoots (the fallback project plays its cubic). */
const springs = (testInfo) => testInfo.project.name !== 'fallback';

/** Rows of #irows in `order` (keys of ROWS), rendered as the fixture's markup; the page's renderer. */
function renderRows(order, rows) {
  const byKey = Object.fromEntries(rows.map((row) => [row[0], row]));
  return order.map((key) => {
    const [, name, load] = byKey[key];
    return `<tr data-ds-key="${key}"><td><input type="checkbox" aria-label="Select ${name}"></td>`
      + `<td><button class="ds-btn ds-btn--quiet ds-btn--icon ds-table__toggle" type="button" aria-expanded="false" aria-controls="${key}-detail" aria-label="Details">${DS.icons.icon(DS.icons.chevronDown, 20, 'ds-chevron')}</button></td>`
      + `<td class="ds-col--text"><a class="ds-link-btn ds-table__row-link" href="#${key}">${name}</a></td><td class="ds-num">${load}</td></tr>`
      + `<tr class="ds-table__detail" id="${key}-detail" data-ds-key="${key}-detail" inert><td colspan="4"><div class="ds-table__expand"><div><p>Issued to Ada Lovelace, last seen today.</p></div></div></td></tr>`;
  }).join('');
}

/** The keys of the trigger rows of #irows, in order. */
const rowOrder = (page) => page.evaluate(() => [...document.querySelectorAll('#irows > tr:not(.ds-table__detail)')].map((row) => row.getAttribute('data-ds-key')));

/** The page's sort: DS.motion.flip over the rows with DS.dom.morphHtml, frozen in the same task when asked. */
function sortTo(page, order, { live = false, freeze: pause = false } = {}) {
  return page.evaluate(([keys, rows, source, isLive, hold]) => {
    const render = new Function(`return (${source})`)();
    const body = document.getElementById('irows');
    window.fxSort = DS.motion.flip(body, (hooks) => DS.dom.morphHtml(body, render(keys, rows), hooks), { items: 'tr', live: isLive });
    if (hold) for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
  }, [order, ROWS, renderRows.toString(), live, pause]);
}

test.describe('table', () => {
  test('hover lays a layer on the cells that adds to a selected row\'s colour', async ({ page }) => {
    await open(page);
    const selected = page.locator('#irows > tr[data-ds-key="a2"]');
    const read = (row) => row.evaluate((el) => ({ row: getComputedStyle(el).backgroundColor, cell: getComputedStyle(el.cells[2]).backgroundColor }));
    const rest = await read(selected);
    await page.locator('#irows > tr[data-ds-key="a2"] td.ds-num').hover({ force: true });
    await settle(page);
    const hovered = await read(selected);
    const alpha = (colour) => {
      const parts = (colour.match(/[\d.]+/g) || []).map(Number);
      return colour.startsWith('rgba') || colour.startsWith('color(') ? parts.at(-1) : (parts.length ? 1 : 0);
    };
    // The row keeps its selection colour; the cells add a translucent layer over it.
    expect(hovered.row).toBe(rest.row);
    expect(rest.row).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    expect(alpha(rest.cell)).toBe(0);
    expect(alpha(hovered.cell)).toBeGreaterThan(0);
    expect(alpha(hovered.cell)).toBeLessThan(0.2);
    // The same layer on a row that is not selected.
    await page.locator('#irows > tr[data-ds-key="a1"] td.ds-num').hover({ force: true });
    await settle(page);
    expect((await read(page.locator('#irows > tr[data-ds-key="a1"]'))).cell).toBe(hovered.cell);
  });

  test('select all starts every row\'s colour transition on the same frame, with no delay', async ({ page }) => {
    await open(page);
    const result = await page.evaluate(async () => {
      const boxes = [...document.querySelectorAll('#irows input[type="checkbox"]')];
      // The page's select-all handler: every row in one task.
      for (const box of boxes) box.checked = true;
      document.getElementById('select-all').checked = true;
      const rows = boxes.map((box) => box.closest('tr'));
      for (const row of rows) void getComputedStyle(row).backgroundColor;
      // Collected in the task of the change (a 150ms transition may be over
      // by a later read); their start times are set once they are ready.
      const lists = rows.map((row) => row.getAnimations().filter((a) => a.transitionProperty === 'background-color'));
      await Promise.all(lists.flat().map((a) => a.ready));
      return lists.map((list) => list.map((a) => ({ start: a.startTime, delay: a.effect.getTiming().delay })));
    });
    // a2 was already selected: no transition; a1 and a3 start together.
    expect(result[1]).toEqual([]);
    const started = [result[0], result[2]].map((list) => {
      expect(list).toHaveLength(1);
      return list[0];
    });
    expect(started[0].start).not.toBeNull();
    expect(started[1].start).toBe(started[0].start);
    expect(started.map((entry) => entry.delay)).toEqual([0, 0]);
  });

  test('an expandable row opens over --ds-dur-medium and closes over --ds-dur-base, never overshooting', async ({ page }) => {
    await open(page);
    const expand = page.locator('#a1-detail .ds-table__expand');
    const opened = (el) => {
      el.querySelector('#irows > tr[data-ds-key="a1"] .ds-table__toggle').setAttribute('aria-expanded', 'true');
      document.getElementById('a1-detail').inert = false;
    };
    const closed = (el) => {
      el.querySelector('#irows > tr[data-ds-key="a1"] .ds-table__toggle').setAttribute('aria-expanded', 'false');
      document.getElementById('a1-detail').inert = true;
    };
    await act(page.locator('#itable'), opened);
    const opening = (await timeline(expand)).find((entry) => entry.name === 'grid-template-rows');
    expect(opening.duration).toBe(await tokenMs(page, '--ds-dur-medium'));
    const up = series(await sample(expand, ['rect.height'], steps(250, 10)), 'rect.height');
    expectMonotonic(up, { direction: 'up', tolerance: 0.01 });
    expect(up[0]).toBeLessThan(1);
    expect(up.at(-1)).toBeGreaterThan(30);
    await finishAll(page);
    await settle(page);
    const full = (await expand.boundingBox()).height;
    expect(Math.max(...up)).toBeLessThanOrEqual(full + 0.5);
    await act(page.locator('#itable'), closed);
    const closing = (await timeline(expand)).find((entry) => entry.name === 'grid-template-rows');
    expect(closing.duration).toBe(await tokenMs(page, '--ds-dur-base'));
    const down = series(await sample(expand, ['rect.height'], steps(200, 10)), 'rect.height');
    expectMonotonic(down, { direction: 'down', tolerance: 0.01 });
    expect(down[0]).toBeCloseTo(full, 0);
    expect(down.at(-1)).toBeLessThan(1);
  });

  test('the chevron and the sort arrow turn to 180deg on the spring and land there', async ({ page }, testInfo) => {
    await open(page);
    const chevron = page.locator('#irows > tr[data-ds-key="a1"] .ds-chevron');
    const arrow = page.locator('#sort > svg');
    await act(page.locator('#itable'), (el) => {
      el.querySelector('#irows > tr[data-ds-key="a1"] .ds-table__toggle').setAttribute('aria-expanded', 'true');
      el.querySelector('#sort-head').setAttribute('aria-sort', 'descending');
    });
    for (const [name, locator] of [['chevron', chevron], ['arrow', arrow]]) {
      const turn = (await timeline(locator)).find((entry) => entry.name === 'rotate');
      expect(turn, name).toBeTruthy();
      expect(turn.duration, name).toBe(await tokenMs(page, '--ds-dur-medium'));
    }
    // Both in one pass: a seek to the end finishes the transitions.
    const both = await page.evaluate((times) => {
      const chevronEl = document.querySelector('#irows > tr[data-ds-key="a1"] .ds-chevron');
      const arrowEl = document.querySelector('#sort > svg');
      const angle = (el) => parseFloat(getComputedStyle(el).rotate) || 0;
      return times.map((time) => {
        for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.currentTime = time;
        return { chevron: angle(chevronEl), arrow: angle(arrowEl) };
      });
    }, steps(250, 10));
    for (const name of ['chevron', 'arrow']) {
      const values = both.map((entry) => entry[name]);
      expect(values[0], name).toBeCloseTo(0, 3);
      expect(values.at(-1), name).toBeCloseTo(180, 3);
      expectPeakAtMost(values, 1.05, { from: 0, to: 180 });
      if (!springs(testInfo)) expectMonotonic(values, { direction: 'up' });
    }
  });

  test('an arrow without .ds-table__sort-arrow keeps the direction the page drew', async ({ page }) => {
    await open(page);
    const state = await page.locator('#sort-head').evaluate((el) => {
      const arrow = el.querySelector('svg');
      arrow.classList.remove('ds-table__sort-arrow');
      void getComputedStyle(arrow).rotate;
      el.setAttribute('aria-sort', 'descending');
      return { rotate: getComputedStyle(arrow).rotate, running: arrow.getAnimations().length };
    });
    expect(state.rotate).toBe('none');
    expect(state.running).toBe(0);
  });

  test('a sort glides the <tr> on translate, continuously, and lands in the new order', async ({ page }) => {
    await open(page);
    const row = page.locator('#irows > tr[data-ds-key="a1"]');
    const from = (await row.boundingBox()).y;
    await sortTo(page, ['a3', 'a2', 'a1'], { freeze: true });
    const glide = await row.evaluate((el) => el.getAnimations().map((animation) => ({
      id: animation.id,
      properties: animation.effect.getKeyframes().flatMap((frame) => Object.keys(frame)).filter((key) => !['offset', 'easing', 'composite', 'computedOffset'].includes(key)),
    })));
    expect(glide).toEqual([{ id: 'ds-flip', properties: ['translate', 'translate'] }]);
    const ys = series(await sample(row, ['rect.y'], GLIDE), 'rect.y');
    await finishAll(page);
    await page.evaluate(() => window.fxSort);
    await settle(page);
    const to = (await row.boundingBox()).y;
    expect(to).toBeGreaterThan(from + 80);
    expect(ys[0]).toBeCloseTo(from, 0);
    expectContinuous(ys, { factor: 3 });
    expect(Math.abs(ys.at(-1) - to)).toBeLessThan(3);
    expect(await rowOrder(page)).toEqual(['a3', 'a2', 'a1']);
  });

  test('a second sort mid-flight continues from where the row is (no jump over 2px)', async ({ page }) => {
    await open(page);
    const row = page.locator('#irows > tr[data-ds-key="a1"]');
    await sortTo(page, ['a3', 'a2', 'a1'], { freeze: true });
    await seek(page, { progress: 0.4 });
    // The second sort and the reads around it in one task.
    const handoff = await row.evaluate((el, [rows, source]) => {
      const render = new Function(`return (${source})`)();
      const body = document.getElementById('irows');
      const before = el.getBoundingClientRect().top;
      window.fxSort = DS.motion.flip(body, (hooks) => DS.dom.morphHtml(body, render(['a1', 'a2', 'a3'], rows), hooks), { items: 'tr' });
      const glides = el.getAnimations().filter((animation) => animation.id === 'ds-flip');
      for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
      return { before, after: el.getBoundingClientRect().top, glides: glides.length };
    }, [ROWS, renderRows.toString()]);
    expect(handoff.glides).toBe(1);
    expect(Math.abs(handoff.after - handoff.before)).toBeLessThanOrEqual(2);
    const ys = series(await sample(row, ['rect.y'], GLIDE), 'rect.y');
    expect(Math.abs(ys[0] - handoff.before)).toBeLessThanOrEqual(2);
    expectContinuous(ys, { factor: 3 });
    await finishAll(page);
    await page.evaluate(() => window.fxSort);
    await settle(page);
    expect(await rowOrder(page)).toEqual(['a1', 'a2', 'a3']);
  });

  test('a live reorder waits while the mouse is over the rows and runs at most 2s later', async ({ page }) => {
    await open(page);
    await page.locator('#irows > tr[data-ds-key="a2"] td.ds-num').hover({ force: true });
    const started = Date.now();
    await sortTo(page, ['a3', 'a2', 'a1'], { live: true });
    expect(await rowOrder(page)).toEqual(['a1', 'a2', 'a3']);
    await page.waitForTimeout(300);
    expect(await rowOrder(page)).toEqual(['a1', 'a2', 'a3']);
    await expect.poll(() => rowOrder(page), { timeout: 3000, intervals: [50] }).toEqual(['a3', 'a2', 'a1']);
    const waited = Date.now() - started;
    expect(waited).toBeGreaterThan(1500);
    expect(waited).toBeLessThan(2600);
    await page.evaluate(() => window.fxSort);
    await settle(page);
  });
});

test.describe('status chips in a sorted table', () => {
  test('a keyed reorder through insertBefore never replays the status icons\' entrance', async ({ page, dsFallback }) => {
    await open(page);
    // Rows with status chips; the old moveBefore-less path (WebKit, Firefox 128, Chrome before 133) in every engine.
    const render = (keys) => keys.map((key) => `<tr data-ds-key="${key}"><td>${key}</td><td><span class="ds-status ds-status--ok">${DS.icons.icon(DS.icons.check, 16)}<span>Synced</span></span></td></tr>`).join('');
    await page.evaluate((source) => {
      const table = document.createElement('table');
      table.className = 'ds-table';
      table.innerHTML = `<tbody id="srows">${new Function(`return (${source})`)()(['s1', 's2', 's3', 's4'])}</tbody>`;
      document.querySelector('.ds-theme').prepend(table);
    }, render.toString());
    await settle(page);
    const result = await page.locator('#srows').evaluate((body, source) => {
      const rows = new Function(`return (${source})`)();
      body.moveBefore = undefined;
      const calls = { insertBefore: 0 };
      const insert = body.insertBefore;
      body.insertBefore = function insertBefore(...args) {
        calls.insertBefore += 1;
        return insert.apply(this, args);
      };
      window.fxSort = DS.motion.flip(body, (hooks) => DS.dom.morphHtml(body, rows(['s4', 's3', 's2', 's1', 's5']), hooks), { items: 'tr' });
      const icons = [...body.querySelectorAll('tr .ds-status > svg')].map((svg) => {
        const style = getComputedStyle(svg);
        const transitions = svg.getAnimations().map((animation) => animation.transitionProperty).filter(Boolean);
        return { key: svg.closest('tr').getAttribute('data-ds-key'), transitions, opacity: style.opacity, scale: style.scale };
      });
      for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
      return { calls, icons, marked: body.querySelectorAll('[data-ds-moving]').length, starting: 'CSSStartingStyleRule' in window };
    }, render.toString());
    expect(result.calls.insertBefore).toBeGreaterThan(0);
    expect(result.marked).toBe(0);
    const moved = result.icons.filter((icon) => icon.key !== 's5');
    expect(moved.map((icon) => icon.key)).toEqual(['s4', 's3', 's2', 's1']);
    for (const icon of moved) {
      expect(icon.transitions, icon.key).toEqual([]);
      expect(icon.opacity, icon.key).toBe('1');
      expect(['none', '1'], icon.key).toContain(icon.scale);
    }
    // The check is live: a chip that is new does play the entrance where @starting-style exists.
    const fresh = result.icons.find((icon) => icon.key === 's5');
    if (result.starting && !dsFallback) expect(fresh.transitions).toEqual(expect.arrayContaining(['opacity', 'scale']));
    await finishAll(page);
    await page.evaluate(() => window.fxSort);
  });
});

test.describe('cards and tiles', () => {
  const HOSTS = [
    { name: 'card', selector: '#card-button', rest: 12, pressed: 8 },
    { name: 'tile', selector: '#tile-button', rest: 16, pressed: 12 },
  ];

  for (const host of HOSTS) {
    test(`a held press on the ${host.name} reaches ${host.pressed}px within 100ms; the release springs back`, async ({ page }, testInfo) => {
      await open(page);
      const el = page.locator(host.selector);
      const radius = () => el.evaluate((node) => parseFloat(getComputedStyle(node).borderTopLeftRadius));
      expect(await radius()).toBeCloseTo(host.rest, 1);
      await el.scrollIntoViewIfNeeded();
      const box = await el.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(100);
      const held = await radius();
      await page.mouse.up();
      expect(held).toBeCloseTo(host.pressed, 1);
      await page.mouse.move(1, 1);
      await settle(page);
      // The release, seeked: from the pressed radius back on the spring.
      await el.evaluate((node) => node.classList.add('ds-pressed'));
      await settle(page);
      await act(el, (node) => node.classList.remove('ds-pressed'));
      const values = series(await sample(el, ['borderRadius'], steps(300)), 'borderRadius');
      expect(values[0]).toBeCloseTo(host.pressed, 1);
      expectSettles(values, host.rest, 0.05);
      if (springs(testInfo)) expectPeakAtMost(values, 1.05, { from: host.pressed, to: host.rest });
      else expectMonotonic(values, { direction: 'up' });
    });
  }

  test('nothing moves on hover; the hover shadow is none unless a theme sets --ds-card-hover-shadow', async ({ page }) => {
    await open(page);
    for (const selector of ['#card-button', '#card-div', '#tile-button']) {
      const el = page.locator(selector);
      await el.scrollIntoViewIfNeeded();
      // The box in document coordinates: hover() may scroll the page (WebKit
      // on a busy machine), which is not the card moving.
      const read = () => el.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        const box = { top: rect.top + scrollY, left: rect.left + scrollX, width: rect.width, height: rect.height };
        return { box, transform: getComputedStyle(node).transform, translate: getComputedStyle(node).translate, scale: getComputedStyle(node).scale };
      });
      const rest = await read();
      await el.hover();
      await settle(page);
      const hovered = await read();
      expect(hovered, selector).toEqual(rest);
      expect(hovered.transform, selector).toBe('none');
    }
    const card = page.locator('#card-button');
    await card.hover();
    await settle(page);
    expect(await card.evaluate((node) => getComputedStyle(node).boxShadow)).toBe('none');
    await card.evaluate((node) => node.style.setProperty('--ds-card-hover-shadow', 'var(--ds-elev-hover)'));
    await page.mouse.move(1, 1);
    await settle(page);
    expect(await card.evaluate((node) => getComputedStyle(node).boxShadow)).toBe('none');
    await card.hover();
    await settle(page);
    expect(await card.evaluate((node) => getComputedStyle(node).boxShadow)).not.toBe('none');
  });

  test('the ripple stays inside the card, also on the <div> form, and inside the row', async ({ page }) => {
    await open(page, { attach: true });
    for (const [selector, target] of [['#card-button', '#card-button'], ['#card-div .ds-card__action', '#card-div'], ['#irows > tr[data-ds-key="a3"] td.ds-num', '#irows > tr[data-ds-key="a3"]']]) {
      const host = page.locator(target);
      const press = page.locator(selector);
      await press.scrollIntoViewIfNeeded();
      const box = await press.boundingBox();
      // Near a corner, so an unclipped circle would reach far outside.
      await page.mouse.move(box.x + 4, box.y + box.height - 4);
      await page.mouse.down();
      const state = await host.evaluate((el) => {
        const ripples = [...el.querySelectorAll('.ds-press-ripple')];
        const rect = el.getBoundingClientRect();
        // The clipping box of the ripple: the host itself, or for a row the
        // box in its first cell that covers the row.
        const clipper = (node) => {
          for (let at = node; at && at !== el.parentElement; at = at.parentElement) {
            const style = getComputedStyle(at);
            if (/clip|hidden/.test(style.overflowX)) return at.getBoundingClientRect();
          }
          return null;
        };
        return {
          count: ripples.length,
          host: rect.toJSON(),
          clip: ripples.length ? clipper(ripples[0])?.toJSON() ?? null : null,
        };
      });
      await page.mouse.up();
      expect(state.count, selector).toBe(1);
      expect(state.clip, `${selector}: the ripple is clipped`).not.toBeNull();
      for (const [edge, inside] of [['left', (a, b) => a >= b - 0.5], ['top', (a, b) => a >= b - 0.5], ['right', (a, b) => a <= b + 0.5], ['bottom', (a, b) => a <= b + 0.5]]) {
        expect(inside(state.clip[edge], state.host[edge]), `${selector}: ${edge} ${state.clip[edge]} / ${state.host[edge]}`).toBe(true);
      }
      await page.mouse.move(1, 1);
      await expect.poll(() => host.locator('.ds-press-ripple').count(), { timeout: 2000 }).toBe(0);
    }
  });

  test('Enter on the <div> card\'s focused action keeps the ring painted while the ripple clips the card', async ({ page }) => {
    await open(page, { attach: true });
    const card = page.locator('#card-div');
    await card.scrollIntoViewIfNeeded();
    // Keyboard focus (so :focus-visible): from the card's button back to its action.
    await page.locator('#card-div-button').focus();
    await page.keyboard.press('Shift+Tab');
    await expect(card.locator('.ds-card__action')).toBeFocused();
    await settle(page);
    // A pixel of the ring: left of the card, half way down, in the middle of
    // the ring's width (outside the padding box the ripple clips to).
    const ringPixel = async () => {
      const box = await card.boundingBox();
      // The ring as the tokens define it, whichever element draws it.
      const geometry = await card.evaluate((el) => {
        const probe = document.createElement('span');
        probe.style.cssText = 'position: absolute; outline: var(--ds-focus-outline); outline-offset: var(--ds-focus-offset)';
        el.parentElement.append(probe);
        const style = getComputedStyle(probe);
        const ring = { offset: parseFloat(style.outlineOffset), width: parseFloat(style.outlineWidth), colour: style.outlineColor };
        probe.remove();
        return ring;
      });
      const x = Math.floor(box.x - geometry.offset - geometry.width / 2);
      const y = Math.floor(box.y + box.height / 2);
      const shot = await page.screenshot({ clip: { x, y, width: 1, height: 1 } });
      const pixel = await page.evaluate(async (png) => {
        const image = new Image();
        image.src = `data:image/png;base64,${png}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context2d = canvas.getContext('2d');
        context2d.drawImage(image, 0, 0);
        return [...context2d.getImageData(0, 0, 1, 1).data.slice(0, 3)];
      }, shot.toString('base64'));
      const ring = await page.evaluate((colour) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const context2d = canvas.getContext('2d');
        context2d.fillStyle = colour;
        context2d.fillRect(0, 0, 1, 1);
        return [...context2d.getImageData(0, 0, 1, 1).data.slice(0, 3)];
      }, geometry.colour);
      return { pixel, ring };
    };
    const expectRing = ({ pixel, ring }, what) => {
      for (const [index, channel] of pixel.entries()) expect(Math.abs(channel - ring[index]), `${what}: ${pixel} / ${ring}`).toBeLessThanOrEqual(2);
    };
    expectRing(await ringPixel(), 'the ring before the press');
    await page.keyboard.down('Enter');
    const state = await card.evaluate((el) => ({ ripples: el.querySelectorAll('.ds-press-ripple').length, overflow: getComputedStyle(el).overflowX }));
    const pressed = await ringPixel();
    await page.keyboard.up('Enter');
    expect(state.ripples).toBe(1);
    expect(state.overflow).toBe('clip');
    expectRing(pressed, 'the ring mid-ripple');
    await expect.poll(() => card.locator('.ds-press-ripple').count(), { timeout: 2000 }).toBe(0);
  });

  test('a row whose first cell is a <th scope="row"> header keeps the ripple inside the row and gives the header the row layers', async ({ page }) => {
    await open(page, { attach: true });
    await page.evaluate(() => {
      document.querySelector('#a3-detail').insertAdjacentHTML('afterend', '<tr data-ds-key="a4" id="th-row"><th scope="row"><a class="ds-link-btn ds-table__row-link" href="#a4">PHONE-0001</a></th><td></td><td></td><td class="ds-num">0.1</td></tr>');
    });
    const row = page.locator('#th-row');
    const press = row.locator('td.ds-num');
    await press.scrollIntoViewIfNeeded();
    const box = await press.boundingBox();
    // Near a corner, so an unclipped circle would reach far outside.
    await page.mouse.move(box.x + 4, box.y + box.height - 4);
    await settle(page);
    await page.mouse.down();
    await settle(page);
    const state = await row.evaluate((el) => {
      // The layer's alpha: a header cell lays its own currentColor (the
      // header text colour), so only the strength is compared.
      const alphaOf = (colour) => {
        const parts = colour.match(/[\d.]+/g).map(Number);
        return colour.includes('/') || colour.startsWith('rgba') ? parts.at(-1) : 1;
      };
      const ripple = el.querySelector('.ds-press-ripple');
      return {
        holder: ripple?.parentElement.tagName,
        ripple: ripple?.getBoundingClientRect().toJSON(),
        overflow: ripple && getComputedStyle(ripple).overflowX,
        row: el.getBoundingClientRect().toJSON(),
        header: alphaOf(getComputedStyle(el.cells[0]).backgroundColor),
        cell: alphaOf(getComputedStyle(el.cells[3]).backgroundColor),
      };
    });
    await page.mouse.up();
    expect(state.holder).toBe('TH');
    // The ripple is the box over the row that clips the circle, not a free circle.
    expect(state.overflow).toBe('clip');
    for (const edge of ['left', 'top', 'right', 'bottom']) {
      expect(state.ripple[edge], `${edge} ${state.ripple[edge]} / ${state.row[edge]}`).toBeCloseTo(state.row[edge], 0);
    }
    // The header cell takes the same layer as the other cells of the row.
    expect(state.cell).toBeGreaterThan(0);
    expect(state.header).toBeCloseTo(state.cell, 2);
    await page.mouse.move(1, 1);
    await expect.poll(() => row.locator('.ds-press-ripple').count(), { timeout: 2000 }).toBe(0);
    await settle(page);
    // Hover: the header cell has the row's hover layer too.
    // (The row link stretches over the row, so the pointer goes by position.)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await settle(page);
    const hover = await row.evaluate((el) => [el.cells[0], el.cells[3]].map((cell) => getComputedStyle(cell).backgroundColor));
    expect(hover[1]).not.toBe('rgba(0, 0, 0, 0)');
    expect(hover[0]).not.toBe('rgba(0, 0, 0, 0)');
  });
});

test.describe('secondary controls', () => {
  test('under .ds-ripples, a press on another link or field in a row or a <div> card leaves the host unpressed', async ({ page }) => {
    await open(page, { attach: true });
    // A page's own extras: a plain link and a field in the <div> card, a plain link in a row.
    await page.evaluate(() => {
      document.querySelector('#card-div .ds-muted').insertAdjacentHTML('beforeend', ' <a href="#owner" id="x-card-link">Owner</a> <input type="text" id="x-card-field" aria-label="Note">');
      document.querySelector('#irows > tr[data-ds-key="a3"] td.ds-num').insertAdjacentHTML('beforeend', ' <a href="#load" id="x-row-link">history</a>');
    });
    for (const [selector, hostSelector] of [['#x-card-link', '#card-div'], ['#x-card-field', '#card-div'], ['#x-row-link', '#irows > tr[data-ds-key="a3"]']]) {
      const control = page.locator(selector);
      const host = page.locator(hostSelector);
      await control.scrollIntoViewIfNeeded();
      const box = await control.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      const state = await host.evaluate((el) => ({
        pressed: el.classList.contains('ds-pressed'),
        ripples: el.querySelectorAll('.ds-press-ripple').length,
        radius: getComputedStyle(el).borderTopLeftRadius,
      }));
      await page.mouse.up();
      await page.mouse.move(1, 1);
      expect(state.pressed, selector).toBe(false);
      expect(state.ripples, selector).toBe(0);
      if (hostSelector === '#card-div') expect(parseFloat(state.radius), selector).toBeCloseTo(12, 1);
      await settle(page);
    }
    // The host's own link still presses the host.
    const action = page.locator('#card-div .ds-card__action');
    const box = await action.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    const pressed = await page.locator('#card-div').evaluate((el) => el.classList.contains('ds-pressed') && el.querySelectorAll('.ds-press-ripple').length === 1);
    await page.mouse.up();
    expect(pressed).toBe(true);
  });
});

test.describe('layout', () => {
  test('cards in one grid row start their content at the same height, the button form too', async ({ page }) => {
    await open(page);
    const offsets = await page.evaluate(() => ['#card-button', '#card-div'].map((selector) => {
      const card = document.querySelector(selector);
      return { height: card.getBoundingClientRect().height, title: card.querySelector('.ds-card__title').getBoundingClientRect().top - card.getBoundingClientRect().top };
    }));
    expect(offsets[0].height).toBeCloseTo(offsets[1].height, 1);
    expect(offsets[0].title).toBeCloseTo(offsets[1].title, 1);
  });

  test('a row\'s toggle is centred on the row\'s text line', async ({ page }) => {
    await open(page);
    const centres = await page.evaluate(() => {
      const row = document.querySelector('#irows > tr[data-ds-key="a1"]');
      const centre = (el) => { const rect = el.getBoundingClientRect(); return rect.top + rect.height / 2; };
      return { toggle: centre(row.querySelector('.ds-table__toggle')), link: centre(row.querySelector('.ds-table__row-link')), height: row.getBoundingClientRect().height };
    });
    expect(Math.abs(centres.toggle - centres.link)).toBeLessThanOrEqual(0.5);
    expect(centres.height).toBeCloseTo(52, 0);
  });

  for (const scale of [1, 2]) {
    test.describe(`device scale ${scale}`, () => {
      test.use({ deviceScaleFactor: scale });

      test('a selected row keeps both hairlines', async ({ page }) => {
        await open(page);
        // With and without the (collapsed) detail rows between the rows.
        for (const details of [true, false]) {
          if (!details) await page.evaluate(() => { for (const row of document.querySelectorAll('#irows > .ds-table__detail')) row.remove(); });
          const shot = await page.locator('#itable').screenshot({ animations: 'disabled' });
          const runs = await page.evaluate(async ([png, dpr]) => {
            const image = new Image();
            image.src = `data:image/png;base64,${png}`;
            await image.decode();
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const context2d = canvas.getContext('2d');
            context2d.drawImage(image, 0, 0);
            // A column through the Load cells (in their padding, clear of the
            // figures): runs of one colour, top down.
            const table = document.getElementById('itable').getBoundingClientRect();
            const cell = document.querySelector('#irows > tr[data-ds-key="a2"] td.ds-num').getBoundingClientRect();
            const x = Math.round((cell.left + 4 - table.left) * dpr);
            const data = context2d.getImageData(x, 0, 1, image.height).data;
            const list = [];
            for (let y = 0; y < image.height; y += 1) {
              const colour = `${data[y * 4]},${data[y * 4 + 1]},${data[y * 4 + 2]}`;
              if (list.length && list.at(-1).colour === colour) list.at(-1).size += 1;
              else list.push({ colour, size: 1 });
            }
            return list;
          }, [shot.toString('base64'), scale]);
          // The selected row is the one long run that is neither the page nor a line.
          const page0 = runs[0].colour;
          const selected = runs.findIndex((run) => run.colour !== page0 && run.size > 40 * scale);
          expect(selected, JSON.stringify(runs)).toBeGreaterThan(0);
          const line = runs.find((run) => run.colour !== page0 && run.size <= scale).colour;
          for (const neighbour of [runs[selected - 1], runs[selected + 1]]) {
            expect(neighbour.colour, `${details ? 'with' : 'without'} details: ${JSON.stringify(runs)}`).toBe(line);
            expect(neighbour.size, `${details ? 'with' : 'without'} details: ${JSON.stringify(runs)}`).toBe(scale);
          }
        }
      });
    });
  }
});

test.describe('alerts', () => {
  test('dismissing the first of three glides the second up continuously; the dismissed one is gone after its exit', async ({ page }) => {
    await open(page);
    const second = page.locator('#alert-2');
    const from = (await second.boundingBox()).y;
    const target = (await page.locator('#alert-1').boundingBox()).y;
    await page.evaluate(() => {
      const stack = document.getElementById('alerts');
      window.fxDismiss = DS.motion.flip(stack, () => document.getElementById('alert-1').remove());
      for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
    });
    const leaving = await page.locator('#alert-1').evaluate((el) => ({ position: getComputedStyle(el).position, animations: el.getAnimations().map((a) => a.animationName || a.id) }));
    expect(leaving.position).toBe('absolute');
    expect(leaving.animations).toContain('ds-fade-out');
    const ys = series(await sample(second, ['rect.y'], GLIDE), 'rect.y');
    expect(Math.abs(ys[0] - from)).toBeLessThanOrEqual(2);
    expectContinuous(ys, { factor: 3, floor: 2 });
    await finishAll(page);
    await page.evaluate(() => window.fxDismiss);
    await settle(page);
    expect(await page.locator('#alert-1').count()).toBe(0);
    expect((await second.boundingBox()).y).toBeCloseTo(target, 0);
    expect(Math.abs(ys.at(-1) - target)).toBeLessThan(3);
  });
});

test.describe('blocked tiles and cards', () => {
  test('an aria-disabled tile or card shows no hover or press layer and keeps its shape', async ({ page }) => {
    await open(page);
    for (const id of ['tile-button', 'card-button']) {
      const host = page.locator(`#${id}`);
      await host.evaluate((el) => el.setAttribute('aria-disabled', 'true'));
      await host.scrollIntoViewIfNeeded();
      const read = () => host.evaluate((el) => ({ layer: Number(getComputedStyle(el, '::before').opacity), radius: getComputedStyle(el).borderTopLeftRadius }));
      const rest = await read();
      await host.hover();
      await settle(page);
      const hover = await read();
      await page.mouse.down();
      await settle(page);
      const pressed = await read();
      await page.mouse.up();
      await page.mouse.move(1, 1);
      await settle(page);
      expect(hover, id).toEqual({ layer: 0, radius: rest.radius });
      expect(pressed, id).toEqual({ layer: 0, radius: rest.radius });
    }
  });
});

test.describe('status line', () => {
  test('roll(): the two lines never cover each other (one line height apart while both show)', async ({ page }) => {
    await open(page);
    const frames = await page.evaluate(() => {
      const slot = document.createElement('p');
      slot.style.cssText = 'margin: 0; line-height: 28px; font-size: 16px';
      slot.textContent = 'Checking 4 devices ...';
      document.getElementById('form').append(slot);
      void slot.offsetHeight;
      DS.motion.roll(slot, '3 of 4 devices up to date');
      // Frozen in the task that started it, then stepped through by hand.
      const animations = slot.getAnimations({ subtree: true });
      for (const animation of animations) animation.pause();
      const [oldLine, newLine] = slot.children;
      const height = slot.getBoundingClientRect().height;
      const out = [];
      for (let t = 0; t <= 400; t += 10) {
        for (const animation of animations) animation.currentTime = t;
        const read = (line) => ({ y: line.getBoundingClientRect().top, opacity: Number(getComputedStyle(line).opacity) });
        out.push({ t, height, old: read(oldLine), next: read(newLine) });
      }
      return { out, lines: slot.children.length, names: animations.map((animation) => animation.animationName).sort() };
    });
    expect(frames.lines).toBe(2);
    expect(frames.names).toEqual(['ds-fade-in', 'ds-fade-out', 'ds-roll-in', 'ds-roll-out']);
    const close = frames.out.filter(({ old, next, height }) => old.opacity > 0.3 && next.opacity > 0.3 && next.y - old.y < 0.9 * height);
    expect(close.map(({ t, old, next }) => `${t}ms: ${(next.y - old.y).toFixed(1)}px apart`)).toEqual([]);
    // The new line lands in the slot, the old one is gone above it.
    expect(frames.out.at(-1).next.opacity).toBe(1);
    expect(frames.out.at(-1).old.opacity).toBe(0);
  });
});

test.describe('card layout (2.1)', () => {
  test('.ds-grid-2: the link rows share one bottom line and the tallest card keeps 16px above its hairline', async ({ page }) => {
    await open(page);
    const box = (id) => page.evaluate((el) => document.getElementById(el).getBoundingClientRect().toJSON(), id);
    const [shortText, shortRow, tallText, tallRow] = await Promise.all(['links-short-text', 'links-short-row', 'links-tall-text', 'links-tall-row'].map(box));
    expect(Math.abs(shortRow.bottom - tallRow.bottom)).toBeLessThanOrEqual(1);
    // The tallest card has no free space: the floor alone stands between its text and the hairline.
    expect(Math.abs(tallRow.top - tallText.bottom - 16)).toBeLessThanOrEqual(1);
    // A shorter card still pushes its links down to the shared line.
    expect(shortRow.top - shortText.bottom).toBeGreaterThan(16 + 1);
  });

  test('card head row: a status chip sits on the title line and, wrapped, keeps the card\'s 16px to the text below', async ({ page }) => {
    await open(page);
    const read = (width) => page.evaluate((w) => {
      document.getElementById('head-card').style.setProperty('width', w);
      const [title, chip, text] = ['head-title', 'head-status', 'head-text'].map((id) => document.getElementById(id).getBoundingClientRect());
      return { wrapped: chip.top >= title.bottom, below: text.top - chip.bottom, offset: (chip.top + chip.bottom) / 2 - (title.top + title.bottom) / 2 };
    }, width);
    const narrow = await read('300px');
    expect(narrow.wrapped).toBe(true);
    expect(narrow.below).toBeGreaterThanOrEqual(16 - 0.5);
    const wide = await read('720px');
    expect(wide.wrapped).toBe(false);
    expect(Math.abs(wide.offset)).toBeLessThanOrEqual(1);
  });
});

test.describe('forced colours', () => {
  test('a selected row and the interactive cards keep their cues', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'forced colours are emulated in Chromium only (one baseline)');
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page);
    await expect(page.locator('#itable')).toHaveScreenshot('forced-table-selected.png');
    await expect(page.locator('#cards')).toHaveScreenshot('forced-cards.png');
  });
});
