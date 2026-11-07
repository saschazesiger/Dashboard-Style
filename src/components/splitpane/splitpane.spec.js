/**
 * The split pane (DS.splitpane) on its demo: the separator's names, roles
 * and value; the APG window splitter keys side by side and stacked; the
 * drag, its snap shut and Escape; collapse and restore (Enter, double click,
 * the toggle button with aria-expanded); three panes; the remembered sizes
 * and reset(); the options (size, density, shape, touch); the collapse glide
 * on its curve; forced colours. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=splitpane');
  await ready(page);
  await page.mouse.move(1, 1);
}

const two = '[data-demo="two"]';
const width = (page, selector) => page.$eval(selector, (el) => el.getBoundingClientRect().width);
const height = (page, selector) => page.$eval(selector, (el) => el.getBoundingClientRect().height);
const list = `${two} > .ds-splitpane__pane:first-child`;
const divider = `${two} > .ds-splitpane__divider`;

test('names and roles: every divider is a focusable separator with its orientation, the pane it controls and its value', async ({ page }) => {
  await open(page);
  const separators = page.getByRole('separator', { name: 'Resize the device list' });
  await expect(separators).toHaveCount(1);
  const id = await page.$eval(list, (el) => el.id);
  await expect(separators).toHaveAttribute('aria-controls', id);
  await expect(separators).toHaveAttribute('aria-orientation', 'vertical');
  await expect(separators).toHaveAttribute('tabindex', '0');
  const value = await page.$eval(divider, (el) => ['aria-valuemin', 'aria-valuenow', 'aria-valuemax'].map((name) => Number(el.getAttribute(name))));
  // 280px of the room the divider leaves, between 200px and 60% of the split pane.
  const whole = await page.$eval(two, (el) => el.clientWidth);
  expect(value).toEqual([200, 280, whole * 0.6].map((px) => Math.round((px / (whole - 1)) * 100)));
  await expect(page.locator('[data-demo="stacked"] > .ds-splitpane__divider')).toHaveAttribute('aria-orientation', 'horizontal');
  // A divider the page left unnamed gets the system's string.
  await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = 'probe';
    host.insertAdjacentHTML('beforeend', '<div class="ds-splitpane" data-ds-splitpane style="--ds-splitpane-height: 100px"><div class="ds-splitpane__pane"></div><div class="ds-splitpane__divider"></div><div class="ds-splitpane__pane"></div></div>');
    document.getElementById('fx-component').prepend(host);
  });
  await expect(page.locator('#probe .ds-splitpane__divider')).toHaveAttribute('aria-label', 'Resize');
  await expect(page.locator('#probe .ds-splitpane__divider')).toHaveAttribute('role', 'separator');
});

test('keys: the arrows move by 16px (Shift 64px), Home and End go to the limits, Enter collapses and restores', async ({ page }) => {
  await open(page);
  await focusByKeyboard(page, page.locator(divider));
  expect(await width(page, list)).toBeCloseTo(280, 0);
  await page.keyboard.press('ArrowRight');
  expect(await width(page, list)).toBeCloseTo(296, 0);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  expect(await width(page, list)).toBeCloseTo(264, 0);
  await page.keyboard.press('Shift+ArrowRight');
  expect(await width(page, list)).toBeCloseTo(328, 0);
  await page.keyboard.press('ArrowUp');
  expect(await width(page, list), 'side by side: the vertical arrows do nothing').toBeCloseTo(328, 0);
  await page.keyboard.press('Home');
  expect(await width(page, list)).toBeCloseTo(200, 0);
  await page.keyboard.press('End');
  const whole = await page.$eval(two, (el) => el.clientWidth);
  expect(await width(page, list)).toBeCloseTo(whole * 0.6, 0);
  await expect(page.locator(divider)).toHaveAttribute('aria-valuenow', String(Math.round((whole * 0.6) / (whole - 1) * 100)));

  await page.keyboard.press('Enter');
  await settle(page);
  expect(await width(page, list)).toBeCloseTo(0, 0);
  await expect(page.locator(divider)).toHaveAttribute('aria-valuetext', 'Collapsed');
  await expect(page.locator(divider)).toHaveAttribute('aria-valuenow', '0');
  await expect(page.locator(list)).toHaveAttribute('data-state', 'collapsed');
  expect(await page.$eval(list, (el) => el.inert)).toBe(true);
  await expect(page.locator(divider)).toBeFocused();
  await page.keyboard.press('Enter');
  await settle(page);
  expect(await width(page, list), 'back to the size it had').toBeCloseTo(whole * 0.6, 0);
  await expect(page.locator(divider)).not.toHaveAttribute('aria-valuetext');
  await expect(page.locator(list)).not.toHaveAttribute('data-state');
  expect(await page.$eval(list, (el) => el.inert)).toBe(false);

  // Below the minimum by a key: shut; an arrow outwards opens it at the minimum.
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowLeft');
  await settle(page);
  await expect(page.locator(list)).toHaveAttribute('data-state', 'collapsed');
  await page.keyboard.press('ArrowRight');
  await settle(page);
  expect(await width(page, list)).toBeCloseTo(200, 0);
});

test('stacked: ArrowUp and ArrowDown move the divider; a percentage stays a share', async ({ page }) => {
  await open(page);
  const pane = '[data-demo="stacked"] > .ds-splitpane__pane';
  const whole = await page.$eval('[data-demo="stacked"]', (el) => el.clientHeight);
  expect(await height(page, pane)).toBeCloseTo(whole * 0.4, 0);
  await focusByKeyboard(page, page.locator('[data-demo="stacked"] > .ds-splitpane__divider'));
  await page.keyboard.press('ArrowDown');
  expect(await height(page, pane)).toBeCloseTo(whole * 0.4 + 16, 0);
  await page.keyboard.press('ArrowLeft');
  expect(await height(page, pane)).toBeCloseTo(whole * 0.4 + 16, 0);
  expect(await page.$eval(pane, (el) => el.style.getPropertyValue('--ds-splitpane-size'))).toMatch(/%$/);
  await page.$eval('[data-demo="stacked"]', (el) => { el.style.setProperty('--ds-splitpane-height', '500px'); });
  expect(await height(page, pane)).toBeCloseTo((500 - 2) * ((whole * 0.4 + 16) / whole), 0);
});

test('narrow: under data-ds-splitpane-stack the panes stack, the divider turns and moves with the vertical arrows', async ({ page }) => {
  await open(page);
  await page.$eval(two, (el) => { el.style.inlineSize = '340px'; });
  await expect(page.locator(two)).toHaveAttribute('data-state', 'stacked');
  await expect(page.locator(divider)).toHaveAttribute('aria-orientation', 'horizontal');
  expect(await page.$eval(two, (el) => getComputedStyle(el).flexDirection)).toBe('column');
  expect(await width(page, list)).toBeCloseTo(338, 0);
  expect(await height(page, list)).toBeCloseTo(Math.min(280, 358 * 0.6), 0);
  await focusByKeyboard(page, page.locator(divider));
  const before = await height(page, list);
  await page.keyboard.press('ArrowUp');
  expect(await height(page, list)).toBeCloseTo(Math.max(200, before - 16), 0);
  // No sideways scroll on a phone.
  expect(await page.$eval(two, (el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.$eval(two, (el) => { el.style.inlineSize = ''; });
  await expect(page.locator(two)).not.toHaveAttribute('data-state');
  await expect(page.locator(divider)).toHaveAttribute('aria-orientation', 'vertical');
});

test('three panes: each divider resizes its outer neighbour, the filling pane keeps its minimum', async ({ page }) => {
  await open(page);
  const panes = page.locator('[data-demo="three"] > .ds-splitpane__pane');
  const dividers = page.locator('[data-demo="three"] > .ds-splitpane__divider');
  const inspectorId = await panes.nth(2).getAttribute('id');
  await expect(dividers.nth(1)).toHaveAttribute('aria-controls', inspectorId);
  await focusByKeyboard(page, dividers.nth(1));
  await page.keyboard.press('ArrowLeft');
  expect((await panes.nth(2).boundingBox()).width, 'the inspector grows as its divider moves left').toBeCloseTo(256, 0);
  await focusByKeyboard(page, dividers.nth(0));
  await page.keyboard.press('End');
  expect((await panes.nth(0).boundingBox()).width).toBeCloseTo(320, 0);
  // The inspector to its largest: the filling pane keeps 200px.
  await focusByKeyboard(page, dividers.nth(1));
  await page.keyboard.press('End');
  expect((await panes.nth(1).boundingBox()).width).toBeGreaterThanOrEqual(199);
});

test('drag: follows the pointer, snaps shut below half the minimum, and Escape puts it back', async ({ page }) => {
  await open(page);
  const box = await page.locator(divider).boundingBox();
  const y = box.y + box.height / 3;
  await page.mouse.move(box.x + 0.5, y);
  await page.mouse.down();
  await expect(page.locator(divider)).toHaveAttribute('data-state', 'dragging');
  await page.mouse.move(box.x + 60.5, y, { steps: 4 });
  expect(await width(page, list)).toBeCloseTo(340, 0);
  await page.mouse.up();
  await expect(page.locator(divider)).not.toHaveAttribute('data-state');
  expect(await width(page, list)).toBeCloseTo(340, 0);

  const changes = [];
  await page.exposeFunction('reportChange', (detail) => changes.push(detail));
  await page.$eval(two, (el) => el.addEventListener('ds:change', (event) => window.reportChange(event.detail)));
  const now = await page.locator(divider).boundingBox();
  await page.mouse.move(now.x + 0.5, y);
  await page.mouse.down();
  await page.mouse.move(now.x - 260, y, { steps: 6 });
  await settle(page);
  await expect(page.locator(list)).toHaveAttribute('data-state', 'collapsed');
  expect(changes, 'no change event during a drag').toEqual([]);
  await page.mouse.up();
  await expect.poll(() => changes.length).toBe(1);
  expect(changes[0].collapsed).toEqual([true, false]);
  expect(changes[0].index).toBe(0);
  await settle(page);

  // Out again by a drag, then Escape: back where the drag began (shut).
  const shut = await page.locator(divider).boundingBox();
  await page.mouse.move(shut.x + 0.5, y);
  await page.mouse.down();
  await page.mouse.move(shut.x + 250, y, { steps: 4 });
  await expect(page.locator(list)).not.toHaveAttribute('data-state', 'collapsed');
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await settle(page);
  await expect(page.locator(list)).toHaveAttribute('data-state', 'collapsed');
});

test('double click and the toggle button collapse and restore; the button carries aria-expanded', async ({ page }) => {
  await open(page);
  const toggle = page.locator('[data-demo="toggle"]');
  const id = await page.$eval(list, (el) => el.id);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle).toHaveAttribute('aria-controls', id);
  await toggle.click();
  await settle(page);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(await width(page, list)).toBeCloseTo(0, 0);
  await page.locator(divider).dblclick();
  await settle(page);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(await width(page, list)).toBeCloseTo(280, 0);
  // A pane that cannot collapse goes back to its start size on a double click.
  const stacked = '[data-demo="stacked"] > .ds-splitpane__pane';
  const start = await height(page, stacked);
  await focusByKeyboard(page, page.locator('[data-demo="stacked"] > .ds-splitpane__divider'));
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.locator('[data-demo="stacked"] > .ds-splitpane__divider').dblclick();
  expect(await height(page, stacked)).toBeCloseTo(start, 0);
});

test('a hide button inside the pane: the pane collapses and the focus moves to its divider, not to the page', async ({ page }) => {
  await open(page);
  await page.$eval(list, (el) => {
    el.insertAdjacentHTML('afterbegin', '<button class="ds-btn" type="button" id="hide-inside" data-ds-splitpane-toggle="0">Hide</button>');
  });
  const hide = page.locator('#hide-inside');
  await focusByKeyboard(page, hide);
  await page.keyboard.press('Enter');
  await expect(page.locator(list)).toHaveAttribute('data-state', 'collapsed');
  expect(await page.$eval(list, (el) => el.inert)).toBe(true);
  await expect(page.locator(divider), 'the divider that opens it again').toBeFocused();
  await page.keyboard.press('Enter');
  await settle(page);
  await expect(page.locator(list)).not.toHaveAttribute('data-state');

  // From the page too: collapse() on a pane that holds the focus.
  await hide.focus();
  await page.$eval(two, (el) => DS.core.get(el, 'splitpane').collapse(0));
  await expect(page.locator(divider)).toBeFocused();
});

test('a key that changes nothing reports nothing', async ({ page }) => {
  await open(page);
  const changes = [];
  await page.exposeFunction('reportChange', (detail) => changes.push(detail.collapsed[0]));
  await page.$eval(two, (el) => el.addEventListener('ds:change', (event) => window.reportChange(event.detail)));
  await focusByKeyboard(page, page.locator(divider));
  await page.keyboard.press('Home');
  await page.keyboard.press('Home');
  await page.keyboard.press('End');
  await page.keyboard.press('End');
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => changes.length).toBe(2);
  await page.keyboard.press('Enter');
  await settle(page);
  await page.keyboard.press('ArrowLeft');
  await expect.poll(() => changes.length).toBe(3);
  await page.keyboard.press('Home');
  await expect.poll(() => changes.length).toBe(4);
  expect(changes, 'shut by Enter, open again by Home').toEqual([false, false, true, false]);
});

test('destroy() takes back what it wrote: a collapsed pane is reachable again', async ({ page }) => {
  await open(page);
  const before = await page.$eval(divider, (el) => el.getAttribute('aria-orientation'));
  expect(before).toBe('vertical');
  await page.$eval(two, (el) => DS.core.get(el, 'splitpane').collapse(0));
  await settle(page);
  expect(await page.$eval(list, (el) => el.inert)).toBe(true);
  // The behaviour goes with its attribute, as a re-render that drops it would.
  await page.$eval(two, (el) => el.removeAttribute('data-ds-splitpane'));
  await expect(page.locator(list)).not.toHaveAttribute('data-state');
  expect(await page.$eval(list, (el) => el.inert)).toBe(false);
  expect(await page.$eval(list, (el) => el.style.getPropertyValue('--ds-splitpane-size'))).toBe('280px');
  await settle(page);
  expect(await width(page, list)).toBeCloseTo(280, 0);
  for (const name of ['aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext', 'aria-orientation']) {
    await expect(page.locator(divider), name).not.toHaveAttribute(name);
  }
  // The markup's own attributes stay.
  await expect(page.locator(divider)).toHaveAttribute('role', 'separator');
  await expect(page.locator(divider)).toHaveAccessibleName('Resize the device list');
});

test('remembers the sizes and what is collapsed; reset() forgets them', async ({ page }) => {
  await open(page);
  await focusByKeyboard(page, page.locator(divider));
  await page.keyboard.press('Shift+ArrowRight');
  expect(await width(page, list)).toBeCloseTo(344, 0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ds:splitpane:sg-devices')))).toEqual({ sizes: ['344px', null], collapsed: [false, false] });
  await page.reload();
  await ready(page);
  expect(await width(page, list)).toBeCloseTo(344, 0);
  await page.locator('[data-demo="toggle"]').click();
  await settle(page);
  await page.reload();
  await ready(page);
  await expect(page.locator(list)).toHaveAttribute('data-state', 'collapsed');
  expect(await width(page, list)).toBeCloseTo(0, 0);
  await expect(page.locator('[data-demo="toggle"]')).toHaveAttribute('aria-expanded', 'false');
  await page.locator('[data-demo="reset"]').click();
  expect(await width(page, list)).toBeCloseTo(280, 0);
  expect(await page.evaluate(() => localStorage.getItem('ds:splitpane:sg-devices'))).toBeNull();
});

test('the controller: get, set, collapse, expand, on', async ({ page }) => {
  await open(page);
  const result = await page.$eval(two, async (el) => {
    const split = DS.core.get(el, 'splitpane');
    const seen = [];
    const off = split.on('change', (detail) => seen.push(detail.sizes[0]));
    const first = split.get();
    split.set({ sizes: [320] });
    const afterSet = split.get();
    split.set({ sizes: [5000] });
    const clamped = split.get().sizes[0];
    split.collapse(0);
    const collapsed = split.get().collapsed[0];
    split.expand(el.querySelector('.ds-splitpane__pane').id);
    off();
    split.set({ sizes: ['300px'] });
    return { first, afterSet, clamped, collapsed, seen };
  });
  expect(result.first).toEqual({ sizes: [280, null], collapsed: [false, false] });
  expect(result.afterSet.sizes[0]).toBe(320);
  const whole = await page.$eval(two, (el) => el.clientWidth);
  expect(result.clamped).toBeCloseTo(whole * 0.6, -1);
  expect(result.collapsed).toBe(true);
  expect(result.seen.length).toBe(4);
});

test('options: the grip steps with size, the hit area and the grip take the touch target, the body padding follows density, the frame the shape', async ({ page }) => {
  await open(page);
  const grip = (selector) => page.$eval(selector, (el) => parseFloat(getComputedStyle(el, '::after').height));
  const hit = (selector) => page.$eval(selector, (el) => parseFloat(getComputedStyle(el, '::before').width));
  await page.evaluate(() => {
    const region = document.createElement('div');
    region.id = 'probe';
    region.insertAdjacentHTML('beforeend', ['', 'ds-sm', 'ds-lg', 'ds-touch', 'ds-density-dense', 'ds-shape-square'].map((cls, index) => `<div class="${cls}"><div class="ds-splitpane ds-splitpane--outlined" style="--ds-splitpane-height: 120px" id="o${index}"><div class="ds-splitpane__pane"><div class="ds-splitpane__body">A</div></div><div class="ds-splitpane__divider" role="separator" tabindex="0" aria-label="Resize"></div><div class="ds-splitpane__pane"></div></div></div>`).join(''));
    document.getElementById('fx-component').prepend(region);
  });
  expect(await grip('#o0 > .ds-splitpane__divider')).toBe(32);
  expect(await grip('#o1 > .ds-splitpane__divider')).toBe(24);
  expect(await grip('#o2 > .ds-splitpane__divider')).toBe(40);
  expect(await grip('#o3 > .ds-splitpane__divider')).toBe(48);
  expect(await hit('#o0 > .ds-splitpane__divider')).toBe(12);
  expect(await hit('#o3 > .ds-splitpane__divider')).toBe(24);
  const pad = (id) => page.$eval(`#${id} .ds-splitpane__body`, (el) => parseFloat(getComputedStyle(el).paddingTop));
  expect(await pad('o0')).toBe(16);
  expect(await pad('o4')).toBe(12);
  const radius = (id) => page.$eval(`#${id}`, (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
  expect(await radius('o5')).toBe(0);
  expect(await radius('o0')).toBeGreaterThan(0);
});

test('motion: collapsing glides the size on the decelerating curve, without overshoot, and turns back from where it is', async ({ page }) => {
  await open(page);
  const widths = await page.$eval(two, async (split) => {
    const el = split.querySelector('.ds-splitpane__pane');
    DS.core.get(split, 'splitpane').collapse(0);
    // A frame first: Gecko may start the transition at its next style update, not at the read below.
    await new Promise((resolve) => { requestAnimationFrame(resolve); });
    const animations = el.getAnimations().filter((animation) => animation.transitionProperty === '--ds-splitpane-size');
    if (!animations.length) return null;
    const [animation] = animations;
    animation.pause();
    const total = animation.effect.getComputedTiming().duration;
    return [0, 0.25, 0.5, 0.75, 1].map((share) => {
      animation.currentTime = share * total;
      return el.getBoundingClientRect().width;
    });
  });
  expect(widths, 'a transition of the registered size').not.toBeNull();
  for (let index = 1; index < widths.length; index += 1) expect(widths[index]).toBeLessThanOrEqual(widths[index - 1] + 0.5);
  expect(widths[0]).toBeCloseTo(280, 0);
  expect(widths[4]).toBeCloseTo(0, 0);
  // Decelerating: most of the way is done in the first half.
  expect(widths[2]).toBeLessThan(140);
  await page.$eval(list, (el) => el.getAnimations().forEach((animation) => animation.play()));
  await settle(page);

  // Reversed mid-way: it turns from where it is. The opening transition is
  // held where it is, so the new one must start from that very width, in
  // every engine, whatever the frame timing.
  const turn = await page.$eval(two, async (el) => {
    const split = DS.core.get(el, 'splitpane');
    const pane = el.querySelector('.ds-splitpane__pane');
    const at = () => pane.getBoundingClientRect().width;
    const frame = () => new Promise((resolve) => { requestAnimationFrame(resolve); });
    const glide = () => pane.getAnimations().find((animation) => animation.transitionProperty === '--ds-splitpane-size') ?? null;
    split.expand(0);
    await frame();
    await frame();
    const opening = glide();
    if (!opening) return null;
    opening.currentTime = opening.effect.getComputedTiming().duration * 0.4;
    opening.pause();
    const mid = at();
    split.collapse(0);
    await frame();
    const closing = glide();
    if (!closing || closing === opening) return { mid, after: null };
    closing.pause();
    closing.currentTime = 0;
    const after = at();
    closing.play();
    return { mid, after };
  });
  expect(turn, 'a transition of the registered size on the way out').not.toBeNull();
  expect(turn.mid).toBeGreaterThan(0);
  expect(turn.mid).toBeLessThan(280);
  expect(turn.after, 'a new transition on the way back').not.toBeNull();
  // The way back starts where the way out was held: neither shut nor open.
  expect(Math.abs(turn.after - turn.mid)).toBeLessThan(2);
  await settle(page);
  expect(await width(page, list)).toBeCloseTo(0, 0);
});

test('forced colours: the line and the grip in CanvasText, Highlight while dragged', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const system = (name) => page.evaluate((colour) => {
    const el = document.createElement('span');
    el.style.color = colour;
    el.style.forcedColorAdjust = 'none';
    document.body.append(el);
    const value = getComputedStyle(el).color;
    el.remove();
    return value;
  }, name);
  const canvasText = await system('CanvasText');
  expect(await page.$eval(divider, (el) => getComputedStyle(el).backgroundColor)).toBe(canvasText);
  expect(await page.$eval(divider, (el) => getComputedStyle(el, '::after').backgroundColor)).toBe(canvasText);
  await page.$eval(divider, (el) => el.setAttribute('data-state', 'dragging'));
  const highlight = await system('Highlight');
  // The colour glides over --ds-dur-fast: wait for its end.
  await expect.poll(() => page.$eval(divider, (el) => getComputedStyle(el, '::after').backgroundColor)).toBe(highlight);
  expect(await page.$eval(divider, (el) => getComputedStyle(el).backgroundColor)).toBe(highlight);
});
