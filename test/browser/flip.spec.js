/**
 * DS.motion.flip() in real engines (D7): a sort glides on `translate` with
 * the spring and lands, a sort during a sort continues from where each item
 * is, a typing filter never stacks glides, live data waits while a mouse is
 * over the list (never for touch), table rows glide, more than `max` moving
 * items update without motion, and a removed item fades out of flow while
 * its neighbours close the gap. Live data with a plain DOM mutate waits
 * whole and glides on release, and a re-render of the list's ancestor
 * mid-glide keeps what the glide holds. The list is keyed markup patched by
 * DS.dom.morphHtml (fixtures/data.html, window.fxData).
 */
import { test, expect } from './base-test.js';
import { ready, settle, sample, series, expectPeakAtMost, expectSettles, expectContinuous, expectMonotonic } from './helpers/motion.js';

/** Pauses every animation of the document (not scroll-driven ones), in the task that runs it. */
const PAUSE = 'for (const a of document.getAnimations().filter((x) => !window.ScrollTimeline || !(x.timeline instanceof ScrollTimeline))) a.pause();';

const NAMES = ['LAPTOP-0042', 'LAPTOP-0043', 'DESKTOP-0107', 'LAPTOP-0051', 'TABLET-0008', 'LAPTOP-0060', 'DESKTOP-0112', 'PHONE-0019'];

/** Loads the data fixture with the list rendered in `names` order. */
async function open(page, { speed, names = NAMES } = {}) {
  await page.goto(`/test/browser/fixtures/data.html${speed ? `?speed=${speed}` : ''}`);
  await ready(page);
  await page.mouse.move(1, 1);
  await page.evaluate((order) => DS.dom.morphHtml(document.getElementById('list'), fxData.list(order)), names);
  await settle(page);
}

/**
 * Starts a FLIP of the list to `names` (and `values`); resolves when it was
 * called, not when it ends. `freeze` pauses every animation in the same
 * task, so nothing can finish between the round trips that read it.
 */
function flipTo(page, names, { values, options = {}, freeze = false } = {}) {
  return page.evaluate(([order, numbers, opts, pause]) => {
    const list = document.getElementById('list');
    window.fxFlip = DS.motion.flip(list, (hooks) => DS.dom.morphHtml(list, fxData.list(order, numbers), hooks), opts);
    if (pause) for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
  }, [names, values ?? null, options, freeze]);
}

/** The names of the list as shown (pending removals excluded). */
const order = (page) => page.evaluate(() => [...document.querySelectorAll('#list > li:not([data-ds-leaving])')].map((item) => item.getAttribute('data-ds-key')));

/** Ends every finite animation after a seek-based sample (play() would restart one seeked to its end). */
const finishAll = (page) => page.evaluate(() => {
  for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) {
    if (Number.isFinite(animation.effect.getComputedTiming().iterations)) animation.finish();
  }
});

/**
 * Positions from rAF samples ({ time, y }) at even steps of the median frame
 * interval, linearly interpolated: a slow frame spreads over the steps it
 * took instead of looking like a jump, while a real jump stays one step.
 */
function evenly(samples) {
  const gaps = samples.slice(1).map((sample, index) => sample.time - samples[index].time).filter((gap) => gap > 0).sort((a, b) => a - b);
  const step = gaps[Math.floor(gaps.length / 2)] || 16;
  const out = [];
  let index = 0;
  for (let time = 0; time <= samples.at(-1).time; time += step) {
    while (index < samples.length - 2 && samples[index + 1].time < time) index += 1;
    const a = samples[index];
    const b = samples[index + 1] ?? a;
    const share = b.time > a.time ? Math.min(1, Math.max(0, (time - a.time) / (b.time - a.time))) : 0;
    out.push(a.y + (b.y - a.y) * share);
  }
  return out;
}

/** ds-flip animations per item key. */
const glides = (page) => page.evaluate(() => Object.fromEntries([...document.querySelectorAll('#list > li')]
  .map((item) => [item.getAttribute('data-ds-key'), item.getAnimations().filter((animation) => animation.id === 'ds-flip').length])));

test('a sort glides on translate with the spring, peaks at most 5 % past and lands', async ({ page, dsFallback }) => {
  await open(page);
  const first = page.locator('#list > li[data-ds-key="LAPTOP-0042"]');
  const from = (await first.boundingBox()).y;
  // Frozen in the task of flip(): a ~300ms glide cannot end before it is read.
  await flipTo(page, [...NAMES].reverse(), { freeze: true });
  const animations = await first.evaluate((el) => el.getAnimations().map((animation) => ({
    id: animation.id,
    composite: animation.effect.composite,
    properties: animation.effect.getKeyframes().flatMap((frame) => Object.keys(frame)).filter((key) => !['offset', 'easing', 'composite', 'computedOffset'].includes(key)),
  })));
  expect(animations).toEqual([{ id: 'ds-flip', composite: 'add', properties: ['translate', 'translate'] }]);
  const samples = await sample(first, ['rect.y'], Array.from({ length: 41 }, (_, index) => ({ progress: index / 40 })));
  const ys = series(samples, 'rect.y');
  await finishAll(page);
  await settle(page);
  const to = (await first.boundingBox()).y;
  expect(to - from).toBeCloseTo(7 * 40, 0);
  expect(ys[0]).toBeCloseTo(from, 0);
  expectPeakAtMost(ys, 1.05, { from, to });
  expectSettles(ys, to, 0.5);
  // The spring overshoots a little where linear() exists; the cubic fallback lands without.
  const peak = Math.max(...ys.map((y) => (y - from) / (to - from)));
  if (dsFallback) expect(peak).toBeLessThanOrEqual(1 + 1e-3);
  else expect(peak).toBeGreaterThan(1.005);
});

test('a second sort mid-flight continues from where the item is', async ({ page }) => {
  await open(page, { speed: 0.1 });
  const item = page.locator('#list > li[data-ds-key="LAPTOP-0042"]');
  await flipTo(page, [...NAMES].reverse());
  await page.waitForTimeout(800);
  // The second sort and the frames after it in one task, so no round trip
  // sits between the value before it and the first frame of the new glide.
  const handoff = await item.evaluate((el) => {
    const list = document.getElementById('list');
    const top = () => el.getBoundingClientRect().top;
    const before = top();
    const start = performance.now();
    DS.motion.flip(list, (hooks) => DS.dom.morphHtml(list, fxData.list(fxData.names), hooks));
    const after = top();
    const glides = el.getAnimations().filter((animation) => animation.id === 'ds-flip').length;
    const samples = [{ time: 0, y: after }];
    return new Promise((resolve) => {
      const frame = (now) => {
        samples.push({ time: Math.max(0, now - start), y: top() });
        if (now - start < 1500) requestAnimationFrame(frame);
        else resolve({ before, after, glides, samples });
      };
      requestAnimationFrame(frame);
    });
  });
  expect(Math.abs(handoff.after - handoff.before)).toBeLessThan(0.5);
  expect(handoff.glides).toBe(1);
  // Judged on an even time grid, so a frame the machine skipped is no jump.
  expectContinuous(evenly(handoff.samples), { factor: 3 });
});

test('a typing filter at 60ms intervals never stacks glides and ends in the filtered order', async ({ page }) => {
  await open(page);
  const typed = ['L', 'LA', 'LAP', 'LAPT', 'LAPTO', 'LAPTOP', 'LAPTOP-', 'LAPTOP-00', 'LAPTOP-004'];
  const most = await page.evaluate(async (steps) => {
    const list = document.getElementById('list');
    let worst = 0;
    for (const text of steps) {
      const shown = fxData.names.filter((name) => name.includes(text));
      DS.motion.flip(list, (hooks) => DS.dom.morphHtml(list, fxData.list(shown), hooks));
      for (const item of list.children) worst = Math.max(worst, item.getAnimations().filter((animation) => animation.id === 'ds-flip').length);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    return worst;
  }, typed);
  expect(most).toBeLessThanOrEqual(1);
  await settle(page);
  expect(await order(page)).toEqual(['LAPTOP-0042', 'LAPTOP-0043']);
  expect(await page.locator('#list > li').count()).toBe(2);
  expect(await page.locator('#list').evaluate((el) => el.style.position), 'the list gets its position back').toBe('');
});

test('live data waits while the mouse is over the list (values at once), then reorders once it leaves', async ({ page }) => {
  await open(page);
  await page.locator('#list > li').nth(2).hover();
  const values = NAMES.map((_, index) => index * 10);
  await flipTo(page, [...NAMES].reverse(), { values: [...values].reverse(), options: { live: true } });
  expect(await order(page)).toEqual(NAMES);
  expect(await page.locator('#list > li .ds-num').allTextContents()).toEqual(values.map(String));
  expect(Object.values(await glides(page)).every((count) => count === 0)).toBe(true);
  // Still held a little later.
  await page.waitForTimeout(300);
  expect(await order(page)).toEqual(NAMES);
  const left = Date.now();
  await page.mouse.move(1, 1);
  await expect.poll(() => order(page), { timeout: 1500 }).toEqual([...NAMES].reverse());
  expect(Date.now() - left).toBeLessThan(2000);
  await page.evaluate(() => window.fxFlip);
  await settle(page);
});

test('a held reorder runs after `hold` even while the mouse stays', async ({ page }) => {
  await open(page);
  await page.locator('#list > li').nth(1).hover();
  await flipTo(page, [...NAMES].reverse(), { options: { live: true, hold: 600 } });
  expect(await order(page)).toEqual(NAMES);
  await page.waitForTimeout(300);
  expect(await order(page)).toEqual(NAMES);
  await expect.poll(() => order(page), { timeout: 1500 }).toEqual([...NAMES].reverse());
});

test.describe('touch', () => {
  test.use({ hasTouch: true });

  test('a touch tap does not hold live data', async ({ page }) => {
    await open(page);
    // A first live update attaches the guard; then the finger comes.
    await page.evaluate(() => DS.motion.flip(document.getElementById('list'), () => {}, { live: true }));
    await page.locator('#list > li').nth(2).tap();
    await flipTo(page, [...NAMES].reverse(), { options: { live: true } });
    expect(await order(page)).toEqual([...NAMES].reverse());
    expect(Object.values(await glides(page)).some((count) => count === 1)).toBe(true);
  });
});

test('table rows glide when a tbody is reordered', async ({ page }) => {
  await open(page);
  await page.evaluate((names) => DS.dom.morphHtml(document.getElementById('rows'), fxData.rows(names)), NAMES.slice(0, 5));
  const row = page.locator('#rows > tr[data-ds-key="LAPTOP-0042"]');
  const from = (await row.boundingBox()).y;
  // Frozen and read in the task of flip(): one round trip can take as long
  // as the ~300ms glide (seen in Firefox), which would end before it is read.
  const ids = await page.evaluate((names) => {
    const body = document.getElementById('rows');
    DS.motion.flip(body, (hooks) => DS.dom.morphHtml(body, fxData.rows(names), hooks));
    for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
    return body.querySelector('tr[data-ds-key="LAPTOP-0042"]').getAnimations().map((animation) => animation.id);
  }, NAMES.slice(0, 5).reverse());
  expect(ids).toEqual(['ds-flip']);
  const [middle] = await sample(row, ['rect.y'], [{ progress: 0.5 }]);
  await finishAll(page);
  await settle(page);
  const to = (await row.boundingBox()).y;
  expect(to).toBeGreaterThan(from + 100);
  expect(middle['rect.y']).toBeGreaterThan(from + 10);
  expect(middle['rect.y']).toBeLessThan(to + 10);
  expect(await page.evaluate(() => [...document.querySelectorAll('#rows > tr')].map((tr) => tr.getAttribute('data-ds-key')))).toEqual(NAMES.slice(0, 5).reverse());
});

test('60 moving items update without motion (cap of 50)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 4000 });
  const names = Array.from({ length: 60 }, (_, index) => `DEVICE-${String(index + 1).padStart(4, '0')}`);
  await open(page, { names });
  await flipTo(page, [...names].reverse());
  const flips = await page.evaluate(() => document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline)).filter((animation) => animation.id === 'ds-flip').length);
  expect(flips).toBe(0);
  expect(await order(page)).toEqual([...names].reverse());
});

test('a removed item fades out of flow while its neighbours close the gap', async ({ page }) => {
  await open(page);
  const next = page.locator('#list > li[data-ds-key="LAPTOP-0051"]');
  const from = (await next.boundingBox()).y;
  await flipTo(page, NAMES.filter((name) => name !== 'DESKTOP-0107'), { freeze: true });
  const removed = page.locator('#list > li[data-ds-key="DESKTOP-0107"]');
  const state = await removed.evaluate((el) => ({
    leaving: el.hasAttribute('data-ds-leaving'),
    inert: el.inert,
    position: getComputedStyle(el).position,
    animations: el.getAnimations().map((animation) => animation.animationName).sort(),
  }));
  expect(state).toEqual({ leaving: true, inert: true, position: 'absolute', animations: ['ds-fade-out'] });
  expect(await next.evaluate((el) => el.getAnimations().map((animation) => animation.id))).toEqual(['ds-flip']);
  const [middle] = await sample(next, ['rect.y'], [{ progress: 0.5 }]);
  const [fading] = await sample(removed, ['opacity'], [{ progress: 0.5 }]);
  expect(middle['rect.y']).toBeLessThan(from - 5);
  expect(middle['rect.y']).toBeGreaterThan(from - 40 - 5);
  expect(fading.opacity).toBeGreaterThan(0);
  expect(fading.opacity).toBeLessThan(1);
  await finishAll(page);
  await page.evaluate(() => window.fxFlip);
  await settle(page);
  expect(await removed.count()).toBe(0);
  expect((await next.boundingBox()).y).toBeCloseTo(from - 40, 0);
  expect(await page.locator('#list').evaluate((el) => el.style.position), 'the list gets its position back').toBe('');
});

test('removed items stay inside the list while they fade; what follows waits, then glides up', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async (names) => {
    const list = document.getElementById('list');
    const following = list.closest('section').nextElementSibling;
    const top = () => following.getBoundingClientRect().top;
    const start = top();
    const done = DS.motion.flip(list, (hooks) => DS.dom.morphHtml(list, fxData.list(names), hooks));
    const sameTask = top();
    const frames = [];
    let running = true;
    const tick = () => {
      const box = list.getBoundingClientRect();
      const leaving = [...list.querySelectorAll('[data-ds-leaving]')].map((item) => item.getBoundingClientRect());
      frames.push({
        top: top(),
        leaving: leaving.length,
        inside: leaving.every((rect) => rect.top >= box.top - 0.5 && rect.bottom <= box.bottom + 0.5),
      });
      if (running) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    await done;
    running = false;
    return { start, sameTask, frames, end: top(), minHeight: list.style.minHeight, position: list.style.position };
  }, NAMES.slice(0, 5));
  expect(result.sameTask).toBe(result.start);
  expect(result.frames[0].leaving).toBe(3);
  const fading = result.frames.filter((frame) => frame.leaving > 0);
  expect(fading.every((frame) => frame.inside), 'no leaving item paints outside the list').toBe(true);
  expect(fading.every((frame) => frame.top === result.start), 'what follows waits while they fade').toBe(true);
  const tops = result.frames.map((frame) => frame.top);
  expectMonotonic(tops, { direction: 'down', tolerance: 0.5 });
  // It glides: at least one frame between the old and the new place.
  expect(tops.some((value) => value < result.start - 1 && value > result.end + 1)).toBe(true);
  expect(result.end).toBeCloseTo(result.start - 3 * 40, 0);
  expect(result.minHeight, 'the list gets its min-height back').toBe('');
  expect(result.position).toBe('');
});

/**
 * Starts a FLIP of `containerId` to the markup `render(names)` and, in the
 * same task, pauses every animation and seeks the glides to each share of
 * their duration: at each, `document.elementFromPoint` at the centre of the
 * item keyed `key` names the item found there (the topmost). Then it reads
 * the inline styles the glide left on the items and the container.
 */
function crossing(page, { containerId, render, names, key, shares }) {
  return page.evaluate(([id, kind, order, watched, steps]) => {
    const container = document.getElementById(id);
    container.scrollIntoView({ block: 'center' });
    const markup = () => (kind === 'rows' ? fxData.rows(order) : fxData.list(order));
    DS.motion.flip(container, (hooks) => DS.dom.morphHtml(container, markup(), hooks));
    const animations = document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline)).filter((animation) => animation.id === 'ds-flip');
    for (const animation of animations) animation.pause();
    const item = container.querySelector(`[data-ds-key="${watched}"]`);
    const found = steps.map((share) => {
      for (const animation of animations) animation.currentTime = share * animation.effect.getComputedTiming().duration;
      const rect = item.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + 12, rect.top + rect.height / 2);
      return hit?.closest('[data-ds-key]')?.getAttribute('data-ds-key') ?? null;
    });
    for (const animation of animations) animation.finish();
    return { found, glides: animations.length };
  }, [containerId, render, names, key, shares]);
}

/** The inline styles a glide may set, per item, plus the container's isolation. */
const leftovers = (page, containerId) => page.evaluate((id) => {
  const container = document.getElementById(id);
  return {
    isolation: container.style.isolation,
    items: [...container.children].map((item) => `${item.style.position}|${item.style.zIndex}`).filter((text) => text !== '|'),
  };
}, containerId);

test('an item gliding past others paints above them (the farthest on top) and gets its styles back', async ({ page }) => {
  await open(page);
  const shares = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9];
  // The last item goes to the top past every other one.
  const top = ['PHONE-0019', ...NAMES.slice(0, -1)];
  const toTop = await crossing(page, { containerId: 'list', render: 'list', names: top, key: 'PHONE-0019', shares });
  expect(toTop.glides).toBe(NAMES.length);
  expect(toTop.found, 'the rising item is never under the ones it passes').toEqual(shares.map(() => 'PHONE-0019'));
  await settle(page);
  expect(await leftovers(page, 'list')).toEqual({ isolation: '', items: [] });
  // A reverse: the two farthest travels cross in the middle; the rising one wins the tie.
  const reverse = await crossing(page, { containerId: 'list', render: 'list', names: [...top].reverse(), key: 'DESKTOP-0112', shares });
  expect(reverse.found).toEqual(shares.map(() => 'DESKTOP-0112'));
  await settle(page);
  expect(await leftovers(page, 'list')).toEqual({ isolation: '', items: [] });
  // Table rows too.
  const rows = NAMES.slice(0, 5);
  await page.evaluate((names) => DS.dom.morphHtml(document.getElementById('rows'), fxData.rows(names)), rows);
  const lastRow = rows.at(-1);
  const table = await crossing(page, { containerId: 'rows', render: 'rows', names: [lastRow, ...rows.slice(0, -1)], key: lastRow, shares });
  expect(table.found).toEqual(shares.map(() => lastRow));
  await settle(page);
  expect(await leftovers(page, 'rows')).toEqual({ isolation: '', items: [] });
});

test('a gliding row of an interactive table covers the checkbox and the chevron of a row it crosses', async ({ page }) => {
  await open(page);
  // A is removed (table rows go at once), C rises two rows past B, which
  // stays: C is the only mover, so it glides on the lowest rank, and it
  // ends before B, so B's controls (lifted to --ds-z-raised) come later in
  // the paint order of a tie.
  const result = await page.evaluate((shares) => {
    const chevron = DS.icons.icon(DS.icons.chevronDown, 20, 'ds-chevron');
    const row = (key) => `<tr data-ds-key="${key}"><td><input type="checkbox" aria-label="Select ${key}"></td>`
      + `<td><button class="ds-btn ds-btn--quiet ds-btn--icon ds-table__toggle" type="button" aria-expanded="false" aria-label="Details">${chevron}</button></td>`
      + `<td class="ds-col--text">${key}</td><td class="ds-num">1.2</td></tr>`;
    document.querySelector('.ds-theme').insertAdjacentHTML('afterbegin', '<div class="ds-table-wrap" style="width: 640px"><table class="ds-table ds-table--interactive"><caption class="ds-sr">Devices</caption><tbody id="z-rows"></tbody></table></div>');
    const body = document.getElementById('z-rows');
    body.scrollIntoView({ block: 'center' });
    DS.dom.morphHtml(body, ['LAPTOP-A', 'LAPTOP-B', 'LAPTOP-C'].map(row).join(''));
    DS.motion.flip(body, (hooks) => DS.dom.morphHtml(body, ['LAPTOP-C', 'LAPTOP-B'].map(row).join(''), hooks));
    const animations = document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline)).filter((animation) => animation.id === 'ds-flip');
    for (const animation of animations) animation.pause();
    const still = body.querySelector('[data-ds-key="LAPTOP-B"]');
    const keyAt = (x, y) => document.elementFromPoint(x, y)?.closest('[data-ds-key]')?.getAttribute('data-ds-key') ?? null;
    const centre = (el) => { const rect = el.getBoundingClientRect(); return [rect.left + rect.width / 2, rect.top + rect.height / 2]; };
    const out = shares.map((share) => {
      for (const animation of animations) animation.currentTime = share * animation.effect.getComputedTiming().duration;
      const [boxX, y] = centre(still.querySelector('input'));
      const [toggleX] = centre(still.querySelector('.ds-table__toggle'));
      const text = still.querySelector('.ds-col--text').getBoundingClientRect();
      return { share, text: keyAt(text.left + text.width / 2, y), box: keyAt(boxX, y), toggle: keyAt(toggleX, y) };
    });
    const moving = animations.map((animation) => animation.effect.target.getAttribute('data-ds-key'));
    for (const animation of animations) animation.finish();
    return { moving, out };
  }, [0.02, 0.05, 0.08, 0.11, 0.14, 0.17, 0.2, 0.25, 0.3, 0.4]);
  expect(result.moving).toEqual(['LAPTOP-C']);
  const covered = result.out.filter((sample) => sample.text === 'LAPTOP-C');
  expect(covered.length, JSON.stringify(result.out)).toBeGreaterThan(0);
  for (const sample of covered) expect(sample, 'the controls of the row it crosses stay under it').toEqual({ ...sample, box: 'LAPTOP-C', toggle: 'LAPTOP-C' });
  await settle(page);
  expect(await leftovers(page, 'z-rows')).toEqual({ isolation: '', items: [] });
});

test('a first item that a plain DOM mutate removes keeps its place, padding and divider while it fades', async ({ page }) => {
  await open(page, { speed: 0.1 });
  const result = await page.evaluate(() => {
    document.querySelector('.ds-theme').insertAdjacentHTML('afterbegin', '<ul class="ds-kv-list" id="kv" style="width: 480px">'
      + ['LAPTOP-0201', 'LAPTOP-0202', 'LAPTOP-0203'].map((name) => `<li data-ds-key="${name}"><span>${name}</span><button class="ds-btn ds-btn--text ds-btn--sm" type="button">Mark returned</button></li>`).join('')
      + '</ul>');
    const list = document.getElementById('kv');
    const first = list.firstElementChild;
    const read = () => ({
      offset: first.querySelector('span').getBoundingClientRect().top - first.getBoundingClientRect().top,
      border: getComputedStyle(first).borderTopWidth,
      first: first.matches(':first-child'),
    });
    const before = read();
    DS.motion.flip(list, () => first.remove());
    const animations = document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline));
    for (const animation of animations) animation.pause();
    const during = [0, 0.5, 0.9].map((share) => {
      for (const animation of animations) {
        const { duration, delay } = animation.effect.getComputedTiming();
        if (Number.isFinite(duration)) animation.currentTime = delay + share * duration;
      }
      return read();
    });
    const connected = first.isConnected;
    for (const animation of animations) if (Number.isFinite(animation.effect.getComputedTiming().iterations)) animation.finish();
    return { before, during, connected };
  });
  expect(result.connected).toBe(true);
  for (const frame of result.during) {
    expect(Math.abs(frame.offset - result.before.offset), JSON.stringify(result)).toBeLessThanOrEqual(1);
    expect(frame.border).toBe(result.before.border);
    expect(frame.first).toBe(true);
  }
  await settle(page);
  expect(await page.evaluate(() => [...document.querySelectorAll('#kv > li')].map((item) => item.getAttribute('data-ds-key')))).toEqual(['LAPTOP-0202', 'LAPTOP-0203']);
});

test('a glide cancelled by the next one keeps the item raised; a removed item keeps its lift', async ({ page }) => {
  await open(page);
  const result = await page.evaluate((names) => {
    const list = document.getElementById('list');
    const to = (order) => DS.motion.flip(list, (hooks) => DS.dom.morphHtml(list, fxData.list(order), hooks));
    to([...names].reverse());
    const raised = list.querySelector('[data-ds-key="PHONE-0019"]');
    const removed = list.querySelector('[data-ds-key="LAPTOP-0042"]');
    // Mid-flight: one item goes away, the rest keep gliding.
    to(names.slice(1));
    for (const animation of document.getAnimations().filter((a) => !window.ScrollTimeline || !(a.timeline instanceof ScrollTimeline))) animation.pause();
    return new Promise((resolve) => setTimeout(() => resolve({
      raisedZ: raised.style.zIndex,
      raisedPosition: raised.style.position,
      removedPosition: removed.style.position,
      removedZ: removed.style.zIndex,
      isolation: list.style.isolation,
    }), 50));
  }, NAMES);
  expect(result.raisedZ).not.toBe('');
  expect(result.raisedPosition).toBe('relative');
  expect(result.removedPosition).toBe('absolute');
  expect(result.removedZ).toBe('');
  expect(result.isolation).toBe('isolate');
  await finishAll(page);
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 50)));
  await settle(page);
  expect(await leftovers(page, 'list')).toEqual({ isolation: '', items: [] });
});

test('live: a plain DOM mutate waits whole while the mouse is over the stack, then glides on release', async ({ page }) => {
  await open(page);
  const stack = page.locator('#alerts');
  await stack.scrollIntoViewIfNeeded();
  await page.locator('#alert-3').hover();
  // Held: the plain mutate (no options, so no holdOrder) does not run yet.
  const held = await page.evaluate(() => {
    const list = document.getElementById('alerts');
    const watched = document.getElementById('alert-3');
    const top = watched.getBoundingClientRect().top;
    const alert = document.createElement('div');
    alert.className = 'ds-alert ds-alert--error';
    alert.id = 'alert-new';
    alert.innerHTML = '<span class="ds-alert__text">The sync failed.</span>';
    window.fxAlert = alert;
    window.fxFlip = DS.motion.flip(list, () => list.prepend(alert), { live: true });
    return { top, now: watched.getBoundingClientRect().top, inserted: alert.isConnected, count: list.children.length, glides: watched.getAnimations().length };
  });
  expect(held).toEqual({ top: held.top, now: held.top, inserted: false, count: 3, glides: 0 });
  // The pointer leaves (dispatched in the task that reads it): the insert runs as a glide.
  const released = await page.evaluate((pause) => {
    const list = document.getElementById('alerts');
    const watched = document.getElementById('alert-3');
    const top = watched.getBoundingClientRect().top;
    list.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
    new Function(pause)();
    return {
      first: list.firstElementChild === window.fxAlert,
      count: list.children.length,
      glide: watched.getAnimations().filter((animation) => animation.id === 'ds-flip').length,
      from: Math.round(watched.getBoundingClientRect().top - top),
    };
  }, PAUSE);
  expect(released.first).toBe(true);
  expect(released.count).toBe(4);
  expect(released.glide).toBe(1);
  expect(released.from, 'the glide starts where the alert was').toBe(0);
  await finishAll(page);
  await page.evaluate(() => window.fxFlip);
});

test('live: a mutate that takes the options but ignores holdOrder glides at once instead of jumping', async ({ page }) => {
  await open(page);
  await page.locator('#alerts').scrollIntoViewIfNeeded();
  await page.locator('#alert-3').hover();
  const result = await page.evaluate((pause) => {
    const list = document.getElementById('alerts');
    const watched = document.getElementById('alert-3');
    const top = watched.getBoundingClientRect().top;
    const alert = document.createElement('div');
    alert.className = 'ds-alert';
    alert.innerHTML = '<span class="ds-alert__text">New devices joined.</span>';
    window.fxFlip = DS.motion.flip(list, (options) => list.prepend(alert), { live: true });
    new Function(pause)();
    return {
      inserted: list.firstElementChild === alert,
      glide: watched.getAnimations().filter((animation) => animation.id === 'ds-flip').length,
      from: Math.round(watched.getBoundingClientRect().top - top),
    };
  }, PAUSE);
  expect(result).toEqual({ inserted: true, glide: 1, from: 0 });
  await finishAll(page);
  await page.evaluate(() => window.fxFlip);
});

test('a re-render of the list\'s ancestor mid-glide keeps the held height, the leaving item\'s place and the raised ranks', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(([names, pause]) => {
    const list = document.getElementById('list');
    const section = list.closest('section');
    const following = section.nextElementSibling;
    const rest = names.slice(1);
    window.fxFlip = DS.motion.flip(list, (hooks) => DS.dom.morphHtml(list, fxData.list(rest), hooks));
    new Function(pause)();
    const leaving = list.querySelector('[data-ds-leaving]');
    const read = () => ({
      position: list.style.position,
      isolation: list.style.isolation,
      minHeight: list.style.minHeight,
      glide: list.hasAttribute('data-ds-glide'),
      after: following.getBoundingClientRect().top,
      leaving: (({ left, top }) => `${Math.round(left)},${Math.round(top)}`)(leaving.getBoundingClientRect()),
    });
    const before = read();
    // A live re-render of the section around the list, as authored (no inline styles on the list).
    DS.dom.morphHtml(section, `<h2 id="list-title">List</h2><ul class="fx-list fx-narrow" id="list">${fxData.list(rest)}</ul>`);
    return { before, after: read() };
  }, [NAMES, PAUSE]);
  expect(result.before.position).toBe('relative');
  expect(result.before.isolation).toBe('isolate');
  expect(result.before.minHeight).not.toBe('');
  expect(result.before.glide).toBe(true);
  expect(result.after).toEqual(result.before);
  await finishAll(page);
  await page.evaluate(() => window.fxFlip);
  await settle(page);
  expect(await page.locator('#list').evaluate((el) => ({ position: el.style.position, isolation: el.style.isolation, minHeight: el.style.minHeight, glide: el.hasAttribute('data-ds-glide') })))
    .toEqual({ position: '', isolation: '', minHeight: '', glide: false });
});
