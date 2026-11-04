/**
 * DS.dnd in real engines: a pointer drag and a keyboard drag in one list, across
 * zones (with a zone that refuses), in a wrapping set, in nested zones; a press
 * without a move stays a click and a drag ends in none; cancels from Escape, a
 * lost focus and a refused drop; a held key; the announcements; autoscroll; the
 * seams a tree or panel grid uses (target, keyTarget, place); owned state under a
 * morph; forced colours. Runs in the
 * `fallback` project too (no moveBefore: a move is a remove plus an add, and the
 * handle has to take its pointer capture back).
 */
import { test, expect } from './base-test.js';
import { ready, settle } from './helpers/motion.js';

const open = async (page) => {
  await page.goto('/test/browser/fixtures/dnd.html');
  await ready(page);
};

const order = (page, selector = '#steps') => page.evaluate((sel) => fxOrder(sel), selector);
const log = (page) => page.evaluate(() => fxLog);
const types = async (page) => (await log(page)).map((entry) => entry.type);
/** The setTimeout of the live region. */
const spoken = (page) => page.evaluate(() => new Promise((resolve) => setTimeout(() => resolve(fxSpoken()))));

/** Presses the grip of `key`, moves by (dx, dy) in steps, and leaves the button down. */
async function dragBy(page, key, dx, dy, steps = 12) {
  // first(): the item's own grip, before those of what it holds.
  const box = await page.locator(`[data-ds-key="${key}"] .ds-grip`).first().boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let step = 1; step <= steps; step += 1) await page.mouse.move(x + (dx * step) / steps, y + (dy * step) / steps);
}

test('a pointer drag carries the item past two others, with the look on it; it lands and reports the move', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.drag = fxDnd('#steps', { label: (item) => item.dataset.dsKey }); });
  const box = await page.locator('[data-ds-key="backup"] .ds-grip').boundingBox();
  const start = { x: box.x, y: box.y + box.height / 2 };
  await dragBy(page, 'backup', 0, 48 * 2.2);
  const row = page.locator('[data-ds-key="backup"]');
  await expect(row).toHaveAttribute('data-ds-dragging', '');
  expect(await order(page)).toEqual(['update', 'restart', 'backup', 'report']);
  expect(await page.evaluate(() => drag.get().mode)).toBe('pointer');
  // Under the pointer: its box follows, on the block axis only.
  const grip = await page.locator('[data-ds-key="backup"] .ds-grip').boundingBox();
  expect(Math.abs(grip.y + grip.height / 2 - start.y - 48 * 2.2)).toBeLessThan(2);
  expect(Math.abs(grip.x - start.x)).toBeLessThan(1);
  await page.mouse.up();
  await expect(row).toHaveAttribute('data-ds-dragging', 'end');
  expect(await page.evaluate(() => drag.get())).toBeNull();
  await settle(page);
  await expect(row).not.toHaveAttribute('data-ds-dragging', /.*/);
  const entries = await log(page);
  expect(entries[0]).toMatchObject({ type: 'drag-start', item: 'backup', from: 0, mode: 'pointer' });
  expect(entries.at(-1)).toMatchObject({ type: 'drop', item: 'backup', from: 0, to: 2, mode: 'pointer' });
  expect(await spoken(page)).toBe('Dropped backup at position 3 of 4.');
  // Nothing of the drag stays on the element.
  expect(await row.getAttribute('style')).toBeNull();
});

test('a press without a move stays a click: no lift, no events, the click arrives', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.drag = fxDnd('#steps');
    window.fxClicks = 0;
    document.querySelector('[data-ds-key="backup"] .ds-grip').addEventListener('click', () => { window.fxClicks += 1; });
  });
  const grip = page.locator('[data-ds-key="backup"] .ds-grip');
  const box = await grip.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 1, y + 1);
  await page.mouse.up();
  expect(await log(page)).toEqual([]);
  expect(await page.evaluate(() => fxClicks)).toBe(1);
  await expect(page.locator('[data-ds-key="backup"]')).not.toHaveAttribute('data-ds-dragging', /.*/);
});

test('a pointer drag ends in no click on its handle; the next real click arrives', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.drag = fxDnd('#steps');
    window.fxClicks = 0;
    document.addEventListener('click', (event) => {
      if (event.target.closest('.ds-grip')) window.fxClicks += 1;
    });
  });
  await dragBy(page, 'backup', 0, 48 * 1.5);
  await page.mouse.up();
  await settle(page);
  expect(await page.evaluate(() => fxClicks)).toBe(0);
  // Cancelled with the button still down: its release adds no click either.
  await dragBy(page, 'update', 0, 48 * 1.5);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await settle(page);
  expect(await page.evaluate(() => fxClicks)).toBe(0);
  await page.locator('[data-ds-key="report"] .ds-grip').click();
  expect(await page.evaluate(() => fxClicks)).toBe(1);
  // A click of a key or a script was never the drag's: right after a drag it still arrives.
  await dragBy(page, 'restart', 0, 48 * 1.5);
  await page.mouse.up();
  await page.evaluate(() => document.querySelector('[data-ds-key="report"] .ds-grip').click());
  expect(await page.evaluate(() => fxClicks)).toBe(2);
});

test('the item stays under the pointer where the static body has a margin, scrolled too', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    document.body.style.margin = '40px';
    document.body.style.minBlockSize = '3000px';
    window.scrollTo(0, 60);
    window.drag = fxDnd('#steps');
  });
  const before = await page.locator('[data-ds-key="backup"]').boundingBox();
  await dragBy(page, 'backup', 0, 12);
  const during = await page.locator('[data-ds-key="backup"]').boundingBox();
  expect(Math.abs(during.y - (before.y + 12))).toBeLessThan(2);
  await page.mouse.up();
});

test('Escape cancels a pointer drag: the order comes back, and the rest of the drag does nothing', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.drag = fxDnd('#steps'); });
  await dragBy(page, 'backup', 0, 48 * 2.2);
  expect(await order(page)).not.toEqual(['backup', 'update', 'restart', 'report']);
  await page.keyboard.press('Escape');
  expect(await order(page)).toEqual(['backup', 'update', 'restart', 'report']);
  await page.mouse.move(100, 500);
  await page.mouse.up();
  expect(await order(page)).toEqual(['backup', 'update', 'restart', 'report']);
  expect((await types(page)).at(-1)).toBe('drag-cancel');
  expect(await types(page)).not.toContain('drop');
  expect(await spoken(page)).toMatch(/^Cancelled\. .*backup.* is back at position 1 of 4\.$/);
});

test('a drop the page refuses goes back, and a drop on its own place is a cancel', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.drag = fxDnd('#steps');
    document.querySelector('#steps').addEventListener('ds:drop', (event) => event.preventDefault());
  });
  await dragBy(page, 'backup', 0, 48 * 2.2);
  await page.mouse.up();
  expect(await order(page)).toEqual(['backup', 'update', 'restart', 'report']);
  expect(await types(page)).toEqual(expect.arrayContaining(['drop', 'drag-cancel']));
  await settle(page);
  await page.evaluate(() => { fxLog.length = 0; });
  await dragBy(page, 'update', 0, 8);
  await page.mouse.up();
  expect(await types(page)).toEqual(['drag-start', 'drag-cancel']);
});

test('a ds:drag-start listener can refuse the lift; a blocked handle or item does not lift', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.drag = fxDnd('#steps');
    document.querySelector('#steps').addEventListener('ds:drag-start', (event) => {
      if (event.detail.item.dataset.dsKey === 'update') event.preventDefault();
    });
    document.querySelector('[data-ds-key="restart"] .ds-grip').setAttribute('aria-disabled', 'true');
    document.querySelector('[data-ds-key="report"]').setAttribute('aria-busy', 'true');
  });
  for (const key of ['update', 'restart', 'report']) {
    await dragBy(page, key, 0, -100, 5);
    await expect(page.locator(`[data-ds-key="${key}"]`)).not.toHaveAttribute('data-ds-dragging', /.*/);
    await page.mouse.up();
  }
  expect(await order(page)).toEqual(['backup', 'update', 'restart', 'report']);
  expect(await page.evaluate(() => drag.get())).toBeNull();
});

test('keyboard: Space lifts, arrows and ends move, Space drops; the handle keeps the focus and every step is spoken', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.drag = fxDnd('#steps', { label: (item) => item.dataset.dsKey }); });
  const grip = page.locator('[data-ds-key="backup"] .ds-grip');
  await grip.focus();
  const describedBy = await grip.getAttribute('aria-describedby');
  expect(describedBy).toBeTruthy();
  expect(await page.evaluate((id) => document.getElementById(id).textContent, describedBy)).toMatch(/Space/);
  await page.keyboard.press('Space');
  await expect(page.locator('[data-ds-key="backup"]')).toHaveAttribute('data-ds-dragging', '');
  expect(await spoken(page)).toBe('Picked up backup, position 1 of 4.');
  await page.keyboard.press('ArrowDown');
  expect(await order(page)).toEqual(['update', 'backup', 'restart', 'report']);
  await expect(grip).toBeFocused();
  expect(await spoken(page)).toBe('Moved backup to position 2 of 4.');
  await page.keyboard.press('End');
  expect(await order(page)).toEqual(['update', 'restart', 'report', 'backup']);
  await page.keyboard.press('ArrowDown');
  expect(await order(page), 'already last').toEqual(['update', 'restart', 'report', 'backup']);
  await page.keyboard.press('Home');
  expect(await order(page)).toEqual(['backup', 'update', 'restart', 'report']);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await expect(grip).toBeFocused();
  expect(await spoken(page)).toBe('Dropped backup at position 2 of 4.');
  expect((await log(page)).at(-1)).toMatchObject({ type: 'drop', mode: 'keyboard', from: 0, to: 1 });
  await settle(page);
  await expect(page.locator('[data-ds-key="backup"]')).not.toHaveAttribute('data-ds-dragging', /.*/);
  // Enter lifts too.
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => drag.get()?.mode)).toBe('keyboard');
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => drag.get())).toBeNull();
  // The arrows do nothing until it is lifted (DS.motion.sortable() is the one that moves at once).
  await page.keyboard.press('ArrowDown');
  expect(await order(page)).toEqual(['update', 'backup', 'restart', 'report']);
});

test('a held Space lifts once: it neither cancels nor lifts again, and after a drop it does nothing', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.drag = fxDnd('#steps'); });
  await page.locator('[data-ds-key="update"] .ds-grip').focus();
  // A key.down() without a key.up() is an auto-repeat.
  await page.keyboard.down('Space');
  await page.keyboard.down('Space');
  await page.keyboard.down('Space');
  expect(await types(page)).toEqual(['drag-start']);
  await page.keyboard.up('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.down('Space');
  await page.keyboard.down('Space');
  await page.keyboard.down('Space');
  await page.keyboard.up('Space');
  expect(await types(page)).toEqual(['drag-start', 'drag-move', 'drop']);
  expect(await page.evaluate(() => drag.get())).toBeNull();
  // Held arrows repeat.
  await page.keyboard.press('Home');
  await page.keyboard.press('Space');
  await page.keyboard.down('ArrowDown');
  await page.keyboard.down('ArrowDown');
  await page.keyboard.up('ArrowDown');
  expect((await order(page)).indexOf('update')).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
});

test('a key lift and move during a glide continue from where the item is', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.drag = fxDnd('#steps'); });
  await page.locator('[data-ds-key="backup"] .ds-grip').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('End');
  await page.keyboard.press('Space');
  // Held half way down its glide, so nothing but the system moves it from here.
  const shown = () => page.evaluate(() => document.querySelector('[data-ds-key="backup"]').getBoundingClientRect().top);
  const held = await page.evaluate(() => {
    const glide = document.querySelector('[data-ds-key="backup"]').getAnimations().find((animation) => animation.id === 'ds-drag');
    glide.pause();
    glide.currentTime = glide.effect.getComputedTiming().duration / 2;
    return glide.effect.getComputedTiming().duration > 0;
  });
  expect(held).toBe(true);
  const before = await shown();
  await page.keyboard.press('Space');
  expect(Math.abs(await shown() - before), 'the lift leaves the glide alone').toBeLessThan(1);
  await page.keyboard.press('ArrowUp');
  const start = await page.evaluate(() => {
    const item = document.querySelector('[data-ds-key="backup"]');
    const glide = item.getAnimations().find((animation) => animation.id === 'ds-drag');
    glide.pause();
    glide.currentTime = 0;
    return item.getBoundingClientRect().top;
  });
  expect(Math.abs(start - before), 'the move starts from where it showed').toBeLessThan(1);
  await page.keyboard.press('Escape');
});

test('the live region is there before the first announcement, and stays the one', async ({ page }) => {
  await open(page);
  const made = await page.evaluate(() => {
    window.drag = fxDnd('#steps');
    const regions = document.querySelectorAll('.ds-theme > [aria-live="polite"].ds-sr');
    window.fxRegion = regions[0];
    fxDnd('#dialog-list');
    return { count: regions.length, text: regions[0]?.textContent, inDialog: document.querySelectorAll('#dialog [aria-live="polite"].ds-sr').length };
  });
  expect(made).toEqual({ count: 1, text: '', inDialog: 1 });
  await page.locator('[data-ds-key="update"] .ds-grip').focus();
  await page.keyboard.press('Space');
  expect(await spoken(page)).toBe('Picked up update, position 2 of 4.');
  expect(await page.evaluate(() => [fxRegion.isConnected, fxRegion.textContent, document.querySelectorAll('.ds-theme > [aria-live="polite"].ds-sr').length])).toEqual([true, 'Picked up update, position 2 of 4.', 1]);
  await page.keyboard.press('Escape');
});

test('keyboard moves keep the item in view of its scroller', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.drag = fxDnd('#tall'); });
  const inView = () => page.evaluate(() => {
    const item = document.querySelector('[data-ds-key="t0"]');
    item.getAnimations().forEach((animation) => animation.finish());
    const box = item.getBoundingClientRect();
    const scroller = document.querySelector('#tall').getBoundingClientRect();
    return box.top >= scroller.top - 1 && box.bottom <= scroller.bottom + 1;
  });
  await page.locator('[data-ds-key="t0"] .ds-grip').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('End');
  expect((await order(page, '#tall')).at(-1)).toBe('t0');
  expect(await inView()).toBe(true);
  await page.keyboard.press('Home');
  expect(await inView()).toBe(true);
  await page.keyboard.press('Escape');
});

test('keyboard: Escape cancels and keeps a dialog around it open; Tab cancels and is never held', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.drag = fxDnd('#dialog-list'); });
  await page.locator('#open-dialog').click();
  await settle(page);
  const dialog = page.locator('#dialog');
  const grip = page.locator('[data-ds-key="one"] .ds-grip');
  await grip.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  expect(await order(page, '#dialog-list')).toEqual(['two', 'one', 'three']);
  await page.keyboard.press('Escape');
  expect(await order(page, '#dialog-list')).toEqual(['one', 'two', 'three']);
  await expect(dialog).not.toHaveAttribute('data-state', 'closing');
  expect(await page.evaluate(() => document.querySelector('#dialog').matches('[open], [data-state="open"]'))).toBe(true);
  // The region speaks inside the dialog: the page behind is inert.
  expect(await page.locator('#dialog [aria-live="polite"].ds-sr').count()).toBe(1);
  await settle(page);
  await grip.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => drag.get())).toBeNull();
  expect(await order(page, '#dialog-list')).toEqual(['one', 'two', 'three']);
  await expect(page.locator('[data-ds-key="one"] .ds-grip')).not.toBeFocused();
});

test.describe('across zones', () => {
  const setup = (page) => page.evaluate(() => {
    window.drag = fxDnd('#board', {
      zones: '.fx-column',
      items: '.fx-card',
      list: 'ul',
      label: (item) => item.dataset.dsKey,
      accept: (item, zone) => !(item.dataset.dsKey === 'locked' && zone.hasAttribute('data-only-open')),
    });
  });
  const lists = (page) => page.evaluate(() => Array.from(document.querySelectorAll('#board ul')).map((ul) => Array.from(ul.children).map((li) => li.dataset.dsKey)));

  test('a pointer drag moves an item into another zone, which shows it is the target', async ({ page }) => {
    await open(page);
    await setup(page);
    const from = await page.locator('[data-ds-key="fan"] .ds-grip').boundingBox();
    const to = await page.locator('.fx-column[aria-label="Doing"]').boundingBox();
    await dragBy(page, 'fan', to.x + to.width / 2 - from.x, -8);
    expect(await lists(page)).toEqual([['disk', 'locked'], ['fan', 'cable'], []]);
    await expect(page.locator('.fx-column[aria-label="Doing"]')).toHaveAttribute('data-ds-dragover', '');
    await expect(page.locator('.fx-column[aria-label="To do"]')).not.toHaveAttribute('data-ds-dragover', /.*/);
    await page.mouse.up();
    await expect(page.locator('.fx-column[aria-label="Doing"]')).not.toHaveAttribute('data-ds-dragover', /.*/);
    const last = (await log(page)).at(-1);
    expect(last).toMatchObject({ type: 'drop', item: 'fan', to: 0, zone: 'Doing' });
    expect(await spoken(page)).toBe('Dropped fan in Doing, position 1 of 2.');
    await settle(page);
    // No fade: flip never treats it as a new item.
    expect(await page.locator('[data-ds-key="fan"]').evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  });

  test('a pointer stays with a drag outside the container (the capture holds through the move)', async ({ page }) => {
    await open(page);
    await setup(page);
    const to = await page.locator('.fx-column[aria-label="Doing"]').boundingBox();
    const from = await page.locator('[data-ds-key="fan"] .ds-grip').boundingBox();
    await dragBy(page, 'fan', to.x + to.width / 2 - from.x, -8);
    await page.mouse.move(5, 5);
    await page.mouse.up();
    expect(await page.evaluate(() => drag.get())).toBeNull();
    expect((await log(page)).at(-1).type).toBe('drop');
  });

  test('a zone that refuses the item is passed over', async ({ page }) => {
    await open(page);
    await setup(page);
    const from = await page.locator('[data-ds-key="locked"] .ds-grip').boundingBox();
    const done = await page.locator('.fx-column[aria-label="Done"]').boundingBox();
    await dragBy(page, 'locked', done.x + done.width / 2 - from.x, 0);
    expect((await lists(page))[2]).toEqual([]);
    await page.mouse.up();
    await settle(page);
    // By keyboard: ArrowRight stops at the last zone that takes it.
    const grip = page.locator('[data-ds-key="locked"] .ds-grip');
    await grip.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    expect((await lists(page))[2]).toEqual([]);
    expect((await lists(page))[1]).toContain('locked');
  });

  test('the keyboard crosses zones with the arrows across the axis, and names the zone', async ({ page }) => {
    await open(page);
    await setup(page);
    const grip = page.locator('[data-ds-key="fan"] .ds-grip');
    await grip.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    expect(await lists(page)).toEqual([['disk', 'locked'], ['fan', 'cable'], []]);
    await expect(grip).toBeFocused();
    expect(await spoken(page)).toBe('Moved fan to Doing, position 1 of 2.');
    await page.keyboard.press('ArrowRight');
    expect(await lists(page)).toEqual([['disk', 'locked'], ['cable'], ['fan']]);
    expect(await spoken(page)).toBe('Moved fan to Done, position 1 of 1.');
    await page.keyboard.press('ArrowRight');
    expect((await lists(page))[2]).toEqual(['fan']);
    await page.keyboard.press('Escape');
    expect(await lists(page)).toEqual([['fan', 'disk', 'locked'], ['cable'], []]);
    await expect(grip).toBeFocused();
  });

  test('set() moves without a drag, with the events and the announcement of a drop', async ({ page }) => {
    await open(page);
    await setup(page);
    const moved = await page.evaluate(() => drag.set({ item: document.querySelector('[data-ds-key="fan"]'), zone: document.querySelector('.fx-column[aria-label="Done"]'), index: 0 }));
    expect(moved).toBe(true);
    expect((await lists(page))[2]).toEqual(['fan']);
    expect((await log(page)).at(-1)).toMatchObject({ type: 'drop', mode: 'api', zone: 'Done' });
    expect(await spoken(page)).toBe('Dropped fan in Done, position 1 of 1.');
    // Refused, and to the place it is: nothing happens.
    expect(await page.evaluate(() => drag.set({ item: document.querySelector('[data-ds-key="locked"]'), zone: document.querySelector('.fx-column[aria-label="Done"]'), index: 0 }))).toBe(false);
    expect(await page.evaluate(() => drag.set({ item: document.querySelector('[data-ds-key="fan"]'), index: 0 }))).toBe(false);
  });

  test('set() has the DOM in its new order when ds:drop runs, and back when it is refused', async ({ page }) => {
    await open(page);
    await setup(page);
    await page.evaluate(() => {
      window.fxSeen = [];
      document.querySelector('#board').addEventListener('ds:drop', (event) => {
        window.fxSeen.push(event.detail.item.closest('.fx-column').getAttribute('aria-label'));
        if (window.fxRefuse) event.preventDefault();
      });
    });
    const move = () => page.evaluate(() => drag.set({ item: document.querySelector('[data-ds-key="fan"]'), zone: document.querySelector('.fx-column[aria-label="Doing"]'), index: 1 }));
    const before = await lists(page);
    await page.evaluate(() => { window.fxRefuse = true; });
    expect(await move()).toBe(false);
    expect(await page.evaluate(() => fxSeen)).toEqual(['Doing']);
    expect(await lists(page)).toEqual(before);
    await page.evaluate(() => { window.fxRefuse = false; });
    expect(await move()).toBe(true);
    expect(await page.evaluate(() => fxSeen)).toEqual(['Doing', 'Doing']);
    expect((await lists(page))[1]).toEqual(['cable', 'fan']);
  });
});

test('a wrapping set moves by what the item is over, and by keys in two dimensions', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.drag = fxDnd('#wrap', { axis: 'both' }); });
  const a = await page.locator('[data-ds-key="a"]').boundingBox();
  const e = await page.locator('[data-ds-key="e"]').boundingBox();
  await dragBy(page, 'a', e.x - a.x, e.y - a.y);
  await page.mouse.up();
  const after = await order(page, '#wrap');
  expect(after.indexOf('a')).toBeGreaterThanOrEqual(3);
  await settle(page);
  // Keys: ArrowUp finds the place in the row above.
  const grip = page.locator('[data-ds-key="f"] .ds-grip');
  await grip.focus();
  const before = await order(page, '#wrap');
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowLeft');
  const left = await order(page, '#wrap');
  expect(left.indexOf('f')).toBe(before.indexOf('f') - 1);
  await page.keyboard.press('ArrowUp');
  const up = await order(page, '#wrap');
  expect(up.indexOf('f')).toBeLessThan(left.indexOf('f'));
  await page.keyboard.press('Escape');
  expect(await order(page, '#wrap')).toEqual(before);
});

test('a wrapping set in several zones: an arrow with nowhere left in the zone goes on to the next, as a pointer can', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.drag = fxDnd('#wrap-board', { zones: '.fx-wrap', axis: 'both' }); });
  const zones = () => page.evaluate(() => Array.from(document.querySelectorAll('.fx-wrap')).map((zone) => Array.from(zone.children).map((el) => el.dataset.dsKey)));
  expect(await zones()).toEqual([['w1', 'w2', 'w3', 'w4'], ['w5']]);
  // Right at the end of the first zone.
  await page.locator('[data-ds-key="w4"] .ds-grip').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  expect(await zones()).toEqual([['w1', 'w2', 'w3'], ['w5', 'w4']]);
  expect(await spoken(page)).toMatch(/^Moved w4 to Second, position \d of 2\.$/);
  // Left at the start of the second, and back.
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowLeft');
  expect((await zones())[0]).toContain('w4');
  await page.keyboard.press('Escape');
  expect(await zones()).toEqual([['w1', 'w2', 'w3', 'w4'], ['w5']]);
  // Down with no row below: the next zone. Up with no row above: the one before.
  await page.locator('[data-ds-key="w4"] .ds-grip').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  expect((await zones())[1]).toContain('w4');
  await page.keyboard.press('ArrowUp');
  expect((await zones())[0]).toContain('w4');
  // Past the last zone nothing moves, and nothing throws.
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowLeft');
  expect((await zones())[0][0]).toBe('w4');
  await page.keyboard.press('Escape');
  // A zone that refuses is passed over.
  await page.evaluate(() => {
    drag.destroy();
    window.drag = fxDnd('#wrap-board', { zones: '.fx-wrap', axis: 'both', accept: (item, zone) => zone.getAttribute('aria-label') !== 'Second' });
  });
  await page.locator('[data-ds-key="w4"] .ds-grip').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  expect(await zones()).toEqual([['w1', 'w2', 'w3', 'w4'], ['w5']]);
  await page.keyboard.press('Escape');
});

test.describe('nested zones', () => {
  const parentOf = (page, key) => page.evaluate((name) => document.querySelector(`[data-ds-key="${name}"]`).parentElement.getAttribute('aria-label'), key);
  const roots = (page) => page.evaluate(() => Array.from(document.querySelector('#tree > ul').children).map((el) => el.dataset.dsKey));
  /** Opens the page with the tree in view; the page errors collect in what it returns. */
  const prepare = async (page) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await open(page);
    await page.evaluate(() => document.querySelector('#tree').scrollIntoView({ block: 'center', behavior: 'instant' }));
    return errors;
  };
  const setup = async (page) => {
    const errors = await prepare(page);
    await page.evaluate(() => { window.drag = fxDnd('#tree', { zones: 'ul', items: 'li' }); });
    return errors;
  };

  test('a pointer drag never drops an item into itself, and what it holds travels with it', async ({ page }) => {
    const errors = await setup(page);
    // Just into its own nested list: the innermost zone under the pointer, were it allowed, and not yet past p2.
    const inner = await page.locator('ul[aria-label="Inside p1"]').boundingBox();
    const grip = await page.locator('[data-ds-key="p1"] .ds-grip').first().boundingBox();
    await dragBy(page, 'p1', 12, inner.y + 4 - (grip.y + grip.height / 2));
    expect(await parentOf(page, 'p1')).toBe('Root');
    // Below everything: past p2, in the root.
    const p2 = await page.locator('[data-ds-key="p2"]').boundingBox();
    await page.mouse.move(grip.x + 12, p2.y + p2.height + 40);
    expect(await roots(page)).toEqual(['p2', 'p1']);
    expect(await page.evaluate(() => document.querySelector('[data-ds-key="c1"]').getAnimations().length), 'no glide of its own inside the dragged item').toBe(0);
    await page.mouse.up();
    expect(await parentOf(page, 'c1')).toBe('Inside p1');
    expect(errors).toEqual([]);
  });

  test('the keyboard skips the zones inside the item, and a child still moves into its neighbour', async ({ page }) => {
    const errors = await setup(page);
    await page.locator('[data-ds-key="p1"] .ds-grip').first().focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    expect(await parentOf(page, 'p1')).toBe('Inside p2');
    await page.keyboard.press('ArrowRight');
    expect(await parentOf(page, 'p1')).toBe('Inside p2');
    await page.keyboard.press('ArrowLeft');
    expect(await parentOf(page, 'p1')).toBe('Root');
    await page.keyboard.press('Escape');
    expect(await roots(page)).toEqual(['p1', 'p2']);
    await page.locator('[data-ds-key="c1"] .ds-grip').focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    expect(await parentOf(page, 'c1')).toBe('Inside p2');
    await page.keyboard.press('Space');
    expect(errors).toEqual([]);
  });

  test('a page\'s own target or set() that names a zone inside the item is ignored, and the context leaves those out', async ({ page }) => {
    const errors = await prepare(page);
    await page.evaluate(() => {
      window.drag = fxDnd('#tree', {
        zones: 'ul',
        items: 'li',
        keyTarget(key, context) {
          window.fxZones = context.zones.map((zone) => zone.getAttribute('aria-label'));
          return { zone: document.querySelector('ul[aria-label="Inside p1"]'), index: 0 };
        },
      });
    });
    await page.locator('[data-ds-key="p1"] .ds-grip').first().focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    expect(await parentOf(page, 'p1')).toBe('Root');
    expect(await types(page)).toEqual(['drag-start']);
    expect(await page.evaluate(() => fxZones)).toEqual(['Root', 'Inside p2']);
    await page.keyboard.press('Escape');
    const moved = await page.evaluate(() => [
      drag.set({ item: document.querySelector('[data-ds-key="p1"]'), zone: document.querySelector('ul[aria-label="Inside p1"]'), index: 0 }),
      drag.set({ item: document.querySelector('[data-ds-key="p1"]'), zone: document.querySelector('ul[aria-label="Inside c1"]'), index: 0 }),
    ]);
    expect(moved).toEqual([false, false]);
    expect(await parentOf(page, 'p1')).toBe('Root');
    expect(errors).toEqual([]);
  });
});

test('near the edge of a scroller it scrolls, and the item keeps moving through the list', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.drag = fxDnd('#tall'); document.querySelector('#tall').scrollIntoView({ block: 'center' }); });
  const scroller = page.locator('#tall');
  const box = await scroller.boundingBox();
  const limit = await scroller.evaluate((el) => el.scrollHeight - el.clientHeight);
  const grip = await page.locator('[data-ds-key="t1"] .ds-grip').boundingBox();
  const x = grip.x + grip.width / 2;
  const y = grip.y + grip.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 10);
  await page.mouse.move(x, box.y + box.height - 6, { steps: 6 });
  await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(200);
  await expect.poll(async () => (await order(page, '#tall')).indexOf('t1')).toBeGreaterThan(5);
  // It stops at the real end: the dragged item's own overflow makes no more room.
  await expect.poll(() => scroller.evaluate((el) => el.scrollTop), { timeout: 10000 }).toBeGreaterThanOrEqual(limit - 1);
  await page.waitForTimeout(200);
  expect(await scroller.evaluate((el) => el.scrollTop)).toBeLessThanOrEqual(limit + 1);
  await page.mouse.up();
  const top = await scroller.evaluate((el) => el.scrollTop);
  await page.waitForTimeout(100);
  expect(await scroller.evaluate((el) => el.scrollTop), 'no scroll without a drag').toBe(top);
});

test('the seams of a tree or a grid: target, keyTarget and place replace the list logic', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const list = document.querySelector('#steps');
    window.fxPlaced = [];
    window.drag = fxDnd('#steps', {
      target: (point, context) => {
        const over = context.itemsIn(list).find((item) => {
          if (item === context.item) return false;
          const box = context.layoutBox(item);
          return point.y >= box.top && point.y <= box.bottom;
        });
        return over ? { zone: list, index: context.itemsIn(list).indexOf(over), position: 'inside', over: over.dataset.dsKey } : null;
      },
      keyTarget: (key, context) => (key === 'ArrowDown' ? { zone: list, index: 2, position: 'inside', over: 'restart' } : null),
      place: (target) => fxPlaced.push(target.over ?? 'home'),
    });
    return true;
  });
  expect(result).toBe(true);
  await dragBy(page, 'backup', 0, 48 * 2);
  await page.mouse.up();
  // place() decides: nothing moved in the DOM.
  expect(await order(page)).toEqual(['backup', 'update', 'restart', 'report']);
  const placed = await page.evaluate(() => fxPlaced);
  expect(placed.length).toBeGreaterThan(0);
  expect(placed).toContain('restart');
  expect((await log(page)).at(-1)).toMatchObject({ type: 'drop', item: 'backup' });
  await settle(page);
  await page.evaluate(() => { fxPlaced.length = 0; });
  await page.locator('[data-ds-key="update"] .ds-grip').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Escape');
  // The move, then the way back through the same seam.
  expect(await page.evaluate(() => fxPlaced)).toEqual(['restart', 'home']);
});

test('a morph during a drag leaves what the system wrote on the elements', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.drag = fxDnd('#steps'); });
  await dragBy(page, 'backup', 0, 30);
  const result = await page.evaluate(() => {
    const list = document.querySelector('#steps');
    const row = list.querySelector('[data-ds-key="backup"]');
    const translate = row.style.translate;
    DS.dom.morphChildren(row, Array.from(row.cloneNode(true).childNodes));
    return { dragging: row.getAttribute('data-ds-dragging'), same: row.style.translate === translate };
  });
  expect(result).toEqual({ dragging: '', same: true });
  await page.mouse.up();
});

test('a re-render that takes the handle cancels the drag', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.drag = fxDnd('#steps'); });
  await dragBy(page, 'backup', 0, 30);
  await page.evaluate(() => document.querySelector('[data-ds-key="backup"] .ds-grip').remove());
  await page.mouse.move(100, 120);
  await page.mouse.move(100, 130);
  await expect.poll(() => page.evaluate(() => drag.get())).toBeNull();
  await page.mouse.up();
});

test('a re-render that takes the focused handle of a keyboard drag cancels it, and the next key is the page\'s', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.drag = fxDnd('#steps'); });
  await page.locator('[data-ds-key="backup"] .ds-grip').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.evaluate(() => document.querySelector('[data-ds-key="backup"]').remove());
  await expect.poll(() => page.evaluate(() => drag.get())).toBeNull();
  expect((await log(page)).at(-1).type).toBe('drag-cancel');
  // The item a re-render took stays gone.
  expect(await order(page)).toEqual(['update', 'restart', 'report']);
});

test('destroy() ends a running drag, is safe twice and takes the listeners away', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.drag = fxDnd('#steps'); });
  await dragBy(page, 'backup', 0, 48 * 2.2);
  await page.evaluate(() => { drag.destroy(); drag.destroy(); });
  expect(await order(page)).toEqual(['backup', 'update', 'restart', 'report']);
  await page.mouse.up();
  await expect(page.locator('[data-ds-key="backup"]')).not.toHaveAttribute('data-ds-dragging', /.*/);
  const count = (await log(page)).length;
  await dragBy(page, 'backup', 0, 48 * 2.2);
  await page.mouse.up();
  expect((await log(page)).length).toBe(count);
  expect(await page.evaluate(() => fxDnd('#steps') !== drag)).toBe(true);
});

test.describe('forced colours', () => {
  test.use({ forcedColors: 'active' });

  test('the dragged item and the target zone are outlined', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit has no forced-colours emulation');
    await open(page);
    await page.evaluate(() => { window.drag = fxDnd('#board', { zones: '.fx-column', items: '.fx-card', list: 'ul' }); });
    const from = await page.locator('[data-ds-key="fan"] .ds-grip').boundingBox();
    const to = await page.locator('.fx-column[aria-label="Doing"]').boundingBox();
    await dragBy(page, 'fan', to.x + to.width / 2 - from.x, -8);
    const styles = await page.evaluate(() => ({
      item: getComputedStyle(document.querySelector('[data-ds-dragging]')).outlineStyle,
      zone: getComputedStyle(document.querySelector('[data-ds-dragover]')).outlineStyle,
    }));
    expect(styles.item).toBe('solid');
    expect(styles.zone).toBe('dashed');
    await page.mouse.up();
  });
});
