/**
 * The popover: a click toggles it, it is placed at its trigger in the top
 * layer on the side asked for (flipped without room) with the arrow at the
 * trigger's centre, focus moves in and Tab past either end closes it onto
 * the trigger, Escape and a press outside close it, the hover card opens on
 * hover and keyboard focus without taking focus; the options (density,
 * shape), names and roles, and forced colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

async function open(page, { width = 1280, height = 800 } = {}) {
  await page.setViewportSize({ width, height });
  await page.goto('/test/browser/fixtures/component.html?c=popover');
  await ready(page);
  await page.mouse.move(1, 1);
}

const panelOf = (page, demo) => page.locator(`#${/** @type {string} */ (demo)}`);

/** The popover a trigger names. */
async function target(page, demo) {
  const id = await page.locator(`[data-demo="${demo}"]`).getAttribute('aria-controls');
  return page.locator(`#${id}`);
}

const activeDemo = (page) => page.evaluate(() => {
  const active = document.activeElement;
  return active?.getAttribute('data-demo') ?? active?.id ?? active?.tagName ?? null;
});

test('a click opens it in the top layer, below its trigger with the arrow at its centre; a second click closes it', async ({ page }) => {
  await open(page);
  const trigger = page.locator('[data-demo="share"]');
  const panel = await target(page, 'share');
  await trigger.click();
  await expect(panel).toHaveAttribute('data-state', 'open');
  await settle(page);
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const geometry = await page.evaluate((id) => {
    const el = document.getElementById(id);
    const trig = document.querySelector('[data-demo="share"]');
    const a = trig.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    return {
      top: el.matches(':popover-open'),
      popover: el.getAttribute('popover'),
      placement: el.getAttribute('data-placement'),
      gap: b.top - a.bottom,
      arrow: parseFloat(getComputedStyle(el).getPropertyValue('--ds-popover-arrow')),
      centre: a.left + a.width / 2 - b.left,
      arrowTop: parseFloat(getComputedStyle(el, '::before').top),
    };
  }, await panel.getAttribute('id'));
  expect(geometry.top).toBe(true);
  expect(geometry.popover).toBe('manual');
  expect(geometry.placement).toBeNull();
  expect(geometry.gap).toBeCloseTo(12, 0);
  expect(geometry.arrow).toBeCloseTo(geometry.centre, 0);
  expect(geometry.arrowTop).toBeLessThan(0);
  // A second click on the trigger closes it and keeps focus there.
  await trigger.click();
  await expect(panel).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(await panel.getAttribute('popover')).toBeNull();
});

test('each placement takes its side; without room it flips to the other one', async ({ page }) => {
  await open(page);
  for (const side of ['top', 'end', 'bottom', 'start']) {
    const trigger = page.locator(`[data-demo="side-${side}"]`);
    const panel = await target(page, `side-${side}`);
    await trigger.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 200 - document.querySelector('[data-demo="side-top"]').getBoundingClientRect().top));
    await trigger.click();
    await expect(panel).toHaveAttribute('data-state', 'open');
    await settle(page);
    const where = await page.evaluate(([demo, id]) => {
      const a = document.querySelector(`[data-demo="${demo}"]`).getBoundingClientRect();
      const b = document.getElementById(id).getBoundingClientRect();
      if (b.bottom <= a.top + 1) return 'top';
      if (b.top >= a.bottom - 1) return 'bottom';
      if (b.right <= a.left + 1) return 'start';
      if (b.left >= a.right - 1) return 'end';
      return 'over';
    }, [`side-${side}`, await panel.getAttribute('id')]);
    expect(where, side).toBe(side);
    expect(await panel.getAttribute('data-placement'), side).toBe(side === 'bottom' ? null : side);
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
  }
  // At the bottom edge of the window, "bottom" flips above; at the end edge, "end" flips before.
  const flipped = await page.evaluate(async () => {
    const el = document.querySelector('[data-demo="share-panel"]');
    await DS.popover.open(el, { anchor: { x: 300, y: innerHeight - 10 }, focus: false });
    const above = el.getAttribute('data-placement');
    await DS.popover.close(el);
    await DS.popover.open(el, { anchor: { x: innerWidth - 10, y: 200 }, placement: 'end', focus: false });
    const before = el.getAttribute('data-placement');
    await DS.popover.close(el);
    return [above, before];
  });
  expect(flipped).toEqual(['top', 'start']);
});

test('focus moves in; Tab past the last control closes it and moves on, Shift+Tab before the first closes it onto the trigger', async ({ page }) => {
  await open(page);
  const trigger = page.locator('[data-demo="share"]');
  const panel = await target(page, 'share');
  await focusByKeyboard(page, trigger);
  await page.keyboard.press('Enter');
  await expect(panel).toHaveAttribute('data-state', 'open');
  // The first control that is no close button: the field.
  expect(await page.evaluate(() => document.activeElement.type)).toBe('email');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.textContent)).toBe('Send');
  await page.keyboard.press('Tab');
  await expect(panel).toHaveAttribute('data-state', 'closed');
  // Moved on from the trigger: the next stop after it, outside the popover.
  expect(await page.evaluate((id) => !document.getElementById(id).contains(document.activeElement) && document.activeElement !== document.querySelector('[data-demo="share"]'), await panel.getAttribute('id'))).toBe(true);
  await expect(panel).toBeHidden();
  // Shift+Tab before the first control closes it onto the trigger.
  await focusByKeyboard(page, trigger);
  await page.keyboard.press('Enter');
  await expect(panel).toHaveAttribute('data-state', 'open');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(panel).toHaveAttribute('data-state', 'closed');
  expect(await activeDemo(page)).toBe('share');
});

test('Escape closes it onto the trigger; a press outside closes it and leaves focus there; [data-ds-close] closes it', async ({ page }) => {
  await open(page);
  const trigger = page.locator('[data-demo="share"]');
  const panel = await target(page, 'share');
  await trigger.click();
  await expect(panel).toHaveAttribute('data-state', 'open');
  await page.evaluate((id) => document.getElementById(id).addEventListener('ds:close', (event) => { window.closedFor = event.detail.reason; }, { once: true }), await panel.getAttribute('id'));
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.closedFor)).toBe('escape');
  await expect(panel).toBeHidden();
  expect(await activeDemo(page)).toBe('share');
  // A press outside.
  await trigger.click();
  await expect(panel).toHaveAttribute('data-state', 'open');
  await page.mouse.click(5, 790);
  await expect(panel).toBeHidden();
  // The close button.
  await trigger.click();
  await expect(panel).toHaveAttribute('data-state', 'open');
  await settle(page);
  await panel.locator('.ds-popover__close').click();
  await expect(panel).toBeHidden();
  expect(await activeDemo(page)).toBe('share');
});

test('one popover open at a time per trigger; a press on another trigger closes the first', async ({ page }) => {
  await open(page);
  const first = await target(page, 'share');
  const second = await target(page, 'filter');
  await page.locator('[data-demo="share"]').click();
  await expect(first).toHaveAttribute('data-state', 'open');
  await page.locator('[data-demo="filter"]').click();
  await expect(second).toHaveAttribute('data-state', 'open');
  await expect(first).toBeHidden();
  // Without an arrow it aligns with the trigger's start edge.
  await settle(page);
  const edges = await page.evaluate((id) => [document.querySelector('[data-demo="filter"]').getBoundingClientRect().left, document.getElementById(id).getBoundingClientRect().left], await second.getAttribute('id'));
  expect(edges[1]).toBeCloseTo(edges[0], 0);
});

test('the hover card: a resting mouse opens it after the delay, keyboard focus at once; it never takes focus and stays while the pointer is on it', async ({ page }) => {
  await open(page);
  const name = page.locator('[data-demo="person"]');
  const card = page.locator('[data-demo="person-card"]');
  // Measured in the page (the runner's own timers drift on a loaded machine):
  // from the pointer's arrival to ds:open, at least the delay.
  await page.evaluate(() => {
    const trigger = document.querySelector('[data-demo="person"]');
    const panel = document.querySelector('[data-demo="person-card"]');
    window.__hover = {};
    trigger.addEventListener('pointerover', () => { window.__hover.over ??= performance.now(); });
    panel.addEventListener('ds:open', () => { window.__hover.open ??= performance.now(); });
  });
  await name.hover();
  await expect(card).toHaveAttribute('data-state', 'open', { timeout: 2000 });
  const waited = await page.evaluate(() => ({
    gap: window.__hover.open - window.__hover.over,
    delay: DS.motion.motionDuration(document.querySelector('[data-demo="person"]'), '--ds-delay-tooltip'),
  }));
  expect(waited.gap).toBeGreaterThanOrEqual(waited.delay - 20);
  // The pointer crosses onto the card: it stays.
  await settle(page);
  const box = await card.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
  await page.waitForTimeout(400);
  await expect(card).toHaveAttribute('data-state', 'open');
  // Leaving both: it closes after the grace.
  await page.mouse.move(2, 2);
  await expect(card).toBeHidden();
  // Keyboard focus shows it at once; focus stays on the name, Tab reaches its link.
  await focusByKeyboard(page, name);
  await expect(card).toHaveAttribute('data-state', 'open');
  expect(await activeDemo(page)).toBe('person');
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.textContent)).toBe('Open the profile');
  await expect(card).toHaveAttribute('data-state', 'open');
  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();
});

test('a long body scrolls inside a popover capped by the room on its side', async ({ page }) => {
  await open(page, { width: 390, height: 500 });
  const trigger = page.locator('[data-demo="long"]');
  await trigger.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, document.querySelector('[data-demo="long"]').getBoundingClientRect().top - 120));
  await trigger.click();
  const panel = await target(page, 'long');
  await expect(panel).toHaveAttribute('data-state', 'open');
  await settle(page);
  const sizes = await page.evaluate((id) => {
    const el = document.getElementById(id);
    const body = el.querySelector('.ds-popover__body');
    const box = el.getBoundingClientRect();
    return { bottom: box.bottom, left: box.left, right: box.right, view: innerHeight, width: innerWidth, scrolls: body.scrollHeight > body.clientHeight + 1 };
  }, await panel.getAttribute('id'));
  expect(sizes.bottom).toBeLessThanOrEqual(sizes.view - 7);
  expect(sizes.left).toBeGreaterThanOrEqual(7);
  expect(sizes.right).toBeLessThanOrEqual(sizes.width - 7);
  expect(sizes.scrolls).toBe(true);
});

test('density steps the padding, shape the radius; size and tone leave it', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(() => {
    const out = {};
    for (const classes of ['', 'ds-density-compact', 'ds-density-tight', 'ds-shape-square', 'ds-shape-round', 'ds-lg']) {
      const region = document.createElement('div');
      region.className = classes;
      region.innerHTML = '<div class="ds-popover" role="dialog" aria-label="Probe"><div class="ds-popover__body">Text</div></div>';
      document.querySelector('#fx-component').append(region);
      const el = region.querySelector('.ds-popover');
      out[classes || 'default'] = { pad: parseFloat(getComputedStyle(el.firstChild).paddingTop), radius: parseFloat(getComputedStyle(el).borderTopLeftRadius), font: getComputedStyle(el).fontSize };
      region.remove();
    }
    return out;
  });
  expect(measured.default.pad).toBe(16);
  expect(measured['ds-density-compact'].pad).toBe(14);
  expect(measured['ds-density-tight'].pad).toBe(10);
  expect(measured['ds-shape-square'].radius).toBe(0);
  expect(measured['ds-shape-round'].radius).toBeCloseTo(measured.default.radius * 1.5, 1);
  expect(measured['ds-lg'].pad).toBe(16);
  expect(measured['ds-lg'].font).toBe(measured.default.font);
});

test('names and roles: a non-modal dialog named by its title, the trigger with aria-haspopup, aria-expanded and aria-controls', async ({ page }) => {
  await open(page);
  const trigger = page.locator('[data-demo="share"]');
  await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Share LAPTOP-0042' });
  await expect(dialog).toBeVisible();
  expect(await dialog.getAttribute('aria-modal')).toBeNull();
  // The page around it stays usable: nothing turned inert.
  expect(await page.evaluate(() => document.querySelectorAll('[inert]').length)).toBe(0);
  await expect(page.getByRole('group', { name: 'Ada Lovelace' })).toBeHidden();
});

test('DS.popover: open at a point, close, and the controller', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(async () => {
    const el = document.querySelector('[data-demo="share-panel"]');
    const control = DS.popover.create(el);
    const seen = [];
    control.on('open', () => seen.push('open'));
    control.on('close', () => seen.push('close'));
    await DS.popover.open(el, { anchor: { x: 300, y: 200 }, opener: document.querySelector('[data-demo="share"]'), focus: false });
    const box = el.getBoundingClientRect();
    const at = { left: box.left, top: box.top, open: control.get() };
    await control.set(false);
    control.destroy();
    return { at, seen, open: control.get(), hidden: el.hidden };
  });
  expect(result.at.open).toBe(true);
  // Centred on the point with the arrow (align center), 12px below it.
  expect(result.at.top).toBeCloseTo(212, 0);
  expect(result.seen).toEqual(['open', 'close']);
  expect(result.open).toBe(false);
  expect(result.hidden).toBe(true);
});

test('forced colours: the popover keeps its edge, the arrow goes', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await page.locator('[data-demo="share"]').click();
  const panel = await target(page, 'share');
  await expect(panel).toHaveAttribute('data-state', 'open');
  await settle(page);
  const styles = await panel.evaluate((el) => ({ outline: getComputedStyle(el).outlineStyle, width: getComputedStyle(el).outlineWidth, arrow: getComputedStyle(el, '::before').display }));
  expect(styles.outline).toBe('solid');
  expect(styles.width).toBe('1px');
  expect(styles.arrow).toBe('none');
});
