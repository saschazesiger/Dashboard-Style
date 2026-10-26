/**
 * The save bar (2.0): .ds-savebar and DS.overlay.savebar() in the app
 * frame (fixtures/savebar.html).
 *
 * - Showing it moves nothing on the page (no child of the view shifts),
 *   at 1280, 1000 and 390px; the bar sits in the page column, its offset
 *   above the view's bottom, and the view keeps its end clear of it
 *   (data-ds-savebar, --ds-savebar-height, scroll padding, the content's
 *   bottom padding).
 * - Snackbars rise above it and come back down when it hides.
 * - A focused field that the bar would cover scrolls clear (WCAG 2.4.11).
 * - Focus inside the bar goes to focusTarget() (else the view) on hide.
 * - Hidden at the end of the page, the room stays until the page scrolls
 *   away from the end, so nothing jumps.
 * - update() waits for a running exit; a re-render keeps what it wrote.
 * - The entrance is the .ds-presence one (where allow-discrete exists),
 *   from its bottom edge; print hides it.
 */
import { test, expect } from './base-test.js';
import { ready, settle } from './helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/savebar.html';

async function load(page, { width = 1280, height = 800 } = {}) {
  await page.setViewportSize({ width, height });
  await page.goto(FIXTURE);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

/** Where the bar, the view and the page column are, and what the view carries. */
const layout = (page) => page.evaluate(() => {
  const view = document.getElementById('main');
  const bar = document.getElementById('bar').getBoundingClientRect();
  const column = document.querySelector('.ds-page').getBoundingClientRect();
  const rect = view.getBoundingClientRect();
  const style = getComputedStyle(view);
  return {
    hidden: document.getElementById('bar').hidden,
    on: view.hasAttribute('data-ds-savebar'),
    rest: view.hasAttribute('data-ds-savebar-rest'),
    height: view.style.getPropertyValue('--ds-savebar-height'),
    barHeight: document.getElementById('bar').offsetHeight,
    left: bar.left - column.left,
    right: column.right - bar.right,
    offset: rect.bottom - bar.bottom,
    scrollPadding: parseFloat(style.scrollPaddingBottom) || 0,
    contentPad: parseFloat(getComputedStyle(view.querySelector('.ds-content')).paddingBottom),
  };
});

/** The boxes of the view's content, to tell that nothing moved. */
const boxes = (page) => page.evaluate(() => [...document.querySelectorAll('#main .ds-page *')].slice(0, 40).map((el) => {
  const rect = el.getBoundingClientRect();
  return [Math.round(rect.left), Math.round(rect.top), Math.round(rect.width), Math.round(rect.height)].join(',');
}));

for (const width of [1280, 1000, 390]) {
  test(`at ${width}px showing it moves nothing; it sits in the page column above the view's bottom, and the view keeps its end clear`, async ({ page }) => {
    await load(page, { width });
    const before = await boxes(page);
    await page.evaluate(() => window.bar.show());
    expect(await boxes(page), 'no page child moves').toEqual(before);
    await settle(page);
    const shown = await layout(page);
    expect(shown.hidden).toBe(false);
    expect(shown.on).toBe(true);
    expect(parseFloat(shown.height)).toBe(shown.barHeight);
    expect(Math.abs(shown.left)).toBeLessThan(1);
    expect(Math.abs(shown.right)).toBeLessThan(1);
    expect(shown.offset).toBeCloseTo(16, 0);
    expect(shown.scrollPadding).toBeCloseTo(shown.barHeight + 16 + 8, 0);
    expect(shown.contentPad).toBeGreaterThanOrEqual(shown.barHeight + 16 + 8 - 0.5);
    await page.evaluate(() => window.bar.hide());
    await settle(page);
    const hidden = await layout(page);
    expect(hidden).toMatchObject({ hidden: true, on: false, rest: false, height: '' });
  });
}

test('snackbars rise above the bar and come back down when it hides', async ({ page }) => {
  await load(page);
  await page.evaluate(() => DS.overlay.toast(null, 'Export ready.', { persistent: true }));
  await settle(page);
  const home = await page.evaluate(() => document.getElementById('toasts').getBoundingClientRect().bottom);
  await page.evaluate(() => window.bar.show());
  await settle(page);
  const above = await page.evaluate(() => {
    const region = document.getElementById('toasts');
    return { gap: document.getElementById('bar').getBoundingClientRect().top - region.getBoundingClientRect().bottom, lift: region.style.getPropertyValue('--ds-toast-lift') };
  });
  expect(above.gap).toBeGreaterThanOrEqual(7.5);
  expect(above.lift).not.toBe('');
  await page.evaluate(() => window.bar.hide());
  await settle(page);
  const back = await page.evaluate(() => ({ bottom: document.getElementById('toasts').getBoundingClientRect().bottom, lift: document.getElementById('toasts').style.getPropertyValue('--ds-toast-lift') }));
  expect(back.lift).toBe('');
  expect(Math.abs(back.bottom - home)).toBeLessThan(1);
  // A message that shows while the bar is up enters above it at once.
  await page.evaluate(() => window.bar.show());
  await settle(page);
  await page.evaluate(() => DS.overlay.toast(null, 'Saved.', { persistent: true }));
  await settle(page);
  expect(await page.evaluate(() => document.getElementById('bar').getBoundingClientRect().top - document.getElementById('toasts').getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(7.5);
});

test('keep clear: a focused field that the bar would cover scrolls above it when it shows', async ({ page }) => {
  await load(page, { height: 600 });
  await page.evaluate(() => {
    const view = document.getElementById('main');
    const last = document.getElementById('last');
    view.scrollTop += last.getBoundingClientRect().bottom - view.getBoundingClientRect().bottom + 2;
    last.focus({ preventScroll: true });
  });
  await page.keyboard.type('x');
  await settle(page);
  const clear = await page.evaluate(() => document.getElementById('last').getBoundingClientRect().bottom <= document.getElementById('bar').getBoundingClientRect().top + 1);
  expect(clear).toBe(true);
});

test('focus inside the bar goes to focusTarget() on hide; without one, to the view', async ({ page }) => {
  await load(page);
  await page.evaluate(() => window.bar.show());
  await settle(page);
  const hidden = await page.evaluate(() => {
    document.getElementById('discard').focus();
    document.getElementById('discard').click();
    return { active: document.activeElement.id, inert: document.getElementById('bar').inert };
  });
  expect(hidden).toEqual({ active: 'name', inert: true });
  await settle(page);
  expect(await page.evaluate(() => document.getElementById('bar').inert)).toBe(false);
  const plain = await page.evaluate(async () => {
    window.bar.destroy();
    const other = DS.overlay.savebar(document.getElementById('bar'));
    other.show();
    document.getElementById('save').focus();
    other.hide();
    return document.activeElement.id;
  });
  expect(plain).toBe('main');
});

test('hidden at the end of the page, the room stays until the page scrolls away from the end', async ({ page }) => {
  await load(page, { height: 600 });
  await page.evaluate(() => window.bar.show());
  await settle(page);
  const end = await page.evaluate(() => {
    const view = document.getElementById('main');
    view.scrollTop = view.scrollHeight;
    const top = view.scrollTop;
    window.bar.hide();
    return { top, after: view.scrollTop, rest: view.hasAttribute('data-ds-savebar-rest') };
  });
  expect(end.rest).toBe(true);
  expect(end.after, 'nothing jumps').toBe(end.top);
  await settle(page);
  await page.evaluate(() => { document.getElementById('main').scrollTop -= 300; });
  await page.waitForFunction(() => !document.getElementById('main').hasAttribute('data-ds-savebar-rest'));
  expect((await layout(page)).height).toBe('');
});

test('update() runs at once while it rests, after the exit while it leaves; a re-render keeps what it wrote', async ({ page }) => {
  await load(page);
  const order = await page.evaluate(async () => {
    const log = [];
    window.bar.update(() => log.push('at once'));
    window.bar.show();
    window.bar.hide();
    window.bar.update(() => log.push('after the exit'));
    log.push('hide returned');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return log;
  });
  const reduced = await page.evaluate(() => CSS.supports('transition-behavior: allow-discrete'));
  expect(order).toEqual(reduced ? ['at once', 'hide returned', 'after the exit'] : ['at once', 'hide returned', 'after the exit']);
  const kept = await page.evaluate(() => {
    window.bar.show();
    const wrapper = document.getElementById('savebar');
    DS.dom.morphHtml(wrapper, wrapper.innerHTML.replace('<div class="ds-savebar__bar ds-presence"', '<div hidden class="ds-savebar__bar ds-presence"'));
    const view = document.getElementById('main');
    return { hidden: document.getElementById('bar').hidden, on: view.hasAttribute('data-ds-savebar') };
  });
  expect(kept).toEqual({ hidden: false, on: true });
});

test('the entrance is the .ds-presence one, from the bottom edge; print hides it', async ({ page }) => {
  await load(page);
  const entrance = await page.evaluate(() => {
    const bar = document.getElementById('bar');
    window.bar.show();
    const running = bar.getAnimations().map((animation) => animation.transitionProperty).filter(Boolean).sort();
    return { running, origin: getComputedStyle(bar).transformOrigin, discrete: CSS.supports('transition-behavior: allow-discrete') };
  });
  const height = (await layout(page)).barHeight;
  expect(entrance.origin).toBe(`${(await page.locator('#bar').evaluate((el) => el.offsetWidth)) / 2}px ${height}px`);
  if (entrance.discrete) expect(entrance.running).toEqual(expect.arrayContaining(['opacity', 'scale']));
  await settle(page);
  await page.emulateMedia({ media: 'print' });
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('savebar')).display)).toBe('none');
});
