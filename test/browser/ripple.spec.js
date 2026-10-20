/**
 * DS.ripple in real engines (D6): the ripple grows from the pointer, goes
 * after the release, skips disabled hosts, is clipped by a host that was
 * static, comes from the centre on Enter, replaces the flat press layer
 * (the :active layer stays at its hover value) and hides in forced
 * colours. The controls fixture has no ripple until a test attaches it.
 */
import { test, expect } from './base-test.js';
import { ready, settle, focusByKeyboard } from './helpers/motion.js';

async function open(page, { attach = true } = {}) {
  await page.goto('/test/browser/fixtures/controls.html');
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
  if (attach) await page.evaluate(() => { window.fxRipples = DS.ripple.attach(document); });
}

/** The ripples inside the element: their centre in client px and their properties. */
const ripples = (locator) => locator.evaluate((el) => [...el.querySelectorAll('.ds-press-ripple')].map((span) => {
  const rect = span.getBoundingClientRect();
  return {
    x: (rect.left + rect.right) / 2,
    y: (rect.top + rect.bottom) / 2,
    out: span.classList.contains('ds-press-ripple--out'),
    keep: span.hasAttribute('data-ds-keep'),
    hidden: span.getAttribute('aria-hidden'),
    props: ['--ds-ripple-x', '--ds-ripple-y', '--ds-ripple-r'].map((name) => parseFloat(span.style.getPropertyValue(name))),
  };
}));

test('the ripple grows from the pointer and goes after the release', async ({ page }) => {
  await open(page);
  const button = page.locator('#btn-primary');
  const box = await button.boundingBox();
  const at = { x: box.x + 17, y: box.y + 9 };
  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  const [ripple] = await ripples(button);
  expect(Math.abs(ripple.x - at.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(ripple.y - at.y)).toBeLessThanOrEqual(1);
  expect(ripple).toMatchObject({ out: false, keep: true, hidden: 'true' });
  // The radius reaches the farthest corner of the padding box.
  const far = await button.evaluate((el, [x, y]) => Math.hypot(Math.max(x, el.clientWidth - x), Math.max(y, el.clientHeight - y)), ripple.props);
  expect(ripple.props[2]).toBeCloseTo(far, 1);
  expect(await button.evaluate((el) => el.classList.contains('ds-pressed'))).toBe(true);
  await page.mouse.up();
  await expect.poll(() => button.locator('.ds-press-ripple').count(), { timeout: 2000 }).toBe(0);
  expect(await button.evaluate((el) => el.classList.contains('ds-pressed'))).toBe(false);
});

test('disabled and aria-disabled hosts get no ripple', async ({ page }) => {
  await open(page);
  for (const id of ['#btn-disabled', '#btn-aria-disabled', '#btn-busy']) {
    const button = page.locator(id);
    const box = await button.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    expect(await button.locator('.ds-press-ripple').count(), id).toBe(0);
    await page.mouse.up();
  }
});

test('a [data-ds-ripple] host that was static is positioned and clips its ripple', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    document.querySelector('.ds-theme').insertAdjacentHTML('afterbegin',
      '<div id="x-row" data-ds-ripple tabindex="0" style="width: 240px; height: 40px; background: var(--ds-surface-high)">LAPTOP-0042</div>');
  });
  const row = page.locator('#x-row');
  expect(await row.evaluate((el) => getComputedStyle(el).position)).toBe('relative');
  const box = await row.boundingBox();
  await page.mouse.move(box.x + 4, box.y + 4);
  await page.mouse.down();
  const state = await row.evaluate((el) => {
    const span = el.querySelector('.ds-press-ripple');
    const style = getComputedStyle(el);
    return { overflow: style.overflowX, isolation: style.isolation, radius: parseFloat(span.style.getPropertyValue('--ds-ripple-r')) };
  });
  expect(state.overflow).toBe('clip');
  expect(state.isolation).toBe('isolate');
  // The circle is far larger than the row; the clip keeps it inside.
  expect(state.radius).toBeGreaterThan(200);
  await page.mouse.up();
  await expect.poll(() => row.locator('.ds-press-ripple').count(), { timeout: 2000 }).toBe(0);
  expect(await row.evaluate((el) => getComputedStyle(el).overflowX)).toBe('visible');
});

test('Enter on a focused host gives a centred ripple', async ({ page }) => {
  await open(page);
  const button = page.locator('#btn-tonal');
  await focusByKeyboard(page, button);
  await page.keyboard.down('Enter');
  const [ripple] = await ripples(button);
  const centre = await button.evaluate((el) => [el.clientWidth / 2, el.clientHeight / 2]);
  expect(ripple.props[0]).toBeCloseTo(centre[0], 1);
  expect(ripple.props[1]).toBeCloseTo(centre[1], 1);
  await page.keyboard.up('Enter');
  await expect.poll(() => button.locator('.ds-press-ripple').count(), { timeout: 2000 }).toBe(0);
});

test('under .ds-ripples a pressed host keeps its flat layer at the hover value', async ({ page }) => {
  await open(page);
  const button = page.locator('#btn-outlined');
  const layer = () => button.evaluate((el) => getComputedStyle(el, '::before').opacity);
  await button.hover();
  await settle(page);
  const hover = await layer();
  await page.mouse.down();
  await settle(page);
  const pressed = await layer();
  await page.mouse.up();
  expect(Number(hover)).toBeGreaterThan(0);
  expect(pressed).toBe(hover);
  // Without attach() the press darkens the flat layer instead.
  await open(page, { attach: false });
  await button.hover();
  await settle(page);
  await page.mouse.down();
  await settle(page);
  expect(Number(await layer())).toBeGreaterThan(Number(hover));
  expect(await button.locator('.ds-press-ripple').count()).toBe(0);
  await page.mouse.up();
});

test('under .ds-ripples a pressed .ds-btn--disc keeps its full disc', async ({ page }) => {
  await open(page);
  const disc = page.locator('#btn-disc');
  await disc.hover();
  await page.mouse.down();
  await settle(page);
  expect(await disc.evaluate((el) => getComputedStyle(el, '::before').opacity)).toBe('1');
  await page.mouse.up();
});

test.describe('without hover (a phone)', () => {
  // Decided before the page exists: Firefox cannot create an isMobile context.
  test.skip(({ browserName }) => browserName !== 'chromium', 'isMobile and forced :active (CDP) exist in Chromium only');
  test.use({ isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 } });

  test('a pressed button keeps its press hook: the disc stays, a plain button leaves the press to the ripple', async ({ page }) => {
    await open(page, { attach: false });
    expect(await page.evaluate(() => matchMedia('(hover: hover)').matches)).toBe(false);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument');
    /** The ::before opacity of `selector` while :active is forced on it. */
    const pressed = async (selector) => {
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
      await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['active'] });
      await settle(page);
      const opacity = await page.locator(selector).evaluate((el) => getComputedStyle(el, '::before').opacity);
      await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
      await settle(page);
      return Number(opacity);
    };
    const without = { disc: await pressed('#btn-disc'), plain: await pressed('#btn-outlined') };
    await page.evaluate(() => DS.ripple.attach(document));
    const withRipples = { disc: await pressed('#btn-disc'), plain: await pressed('#btn-outlined') };
    const state = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.ds-theme')).getPropertyValue('--ds-state-pressed')));
    expect(without.disc).toBe(1);
    expect(without.plain).toBeCloseTo(state, 5);
    // The ripple brings --ds-state-pressed; the layer keeps the rest of the hook.
    expect(withRipples.disc).toBeCloseTo(1 - state, 5);
    expect(withRipples.plain).toBe(0);
  });
});

test('forced colours show no ripple', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const button = page.locator('#btn-primary');
  const box = await button.boundingBox();
  await page.mouse.move(box.x + 10, box.y + 10);
  await page.mouse.down();
  expect(await button.locator('.ds-press-ripple').evaluate((span) => getComputedStyle(span).display)).toBe('none');
  await page.mouse.up();
});

test.describe('touch (WebKit)', () => {
  test.use({ hasTouch: true });

  test('a tap ripples, and attach() adds the passive touchstart listener iOS needs for :active', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'the iOS engine');
    await page.addInitScript(() => {
      window.fxTouchListeners = [];
      const add = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function (type, listener, options) {
        if (type === 'touchstart') window.fxTouchListeners.push({ root: this === document.documentElement, passive: Boolean(options && options.passive) });
        return add.call(this, type, listener, options);
      };
    });
    await open(page, { attach: false });
    const before = await page.evaluate(() => window.fxTouchListeners.length);
    await page.evaluate(() => DS.ripple.attach(document));
    expect(await page.evaluate((count) => window.fxTouchListeners.slice(count), before)).toEqual([{ root: true, passive: true }]);
    const button = page.locator('#btn-primary');
    const seen = button.evaluate((el) => new Promise((resolve) => {
      new MutationObserver((records, observer) => {
        if (el.querySelector('.ds-press-ripple')) {
          observer.disconnect();
          resolve(true);
        }
      }).observe(el, { childList: true });
      setTimeout(() => resolve(false), 2000);
    }));
    await button.tap();
    expect(await seen).toBe(true);
    await expect.poll(() => button.locator('.ds-press-ripple').count(), { timeout: 2000 }).toBe(0);
  });
});
