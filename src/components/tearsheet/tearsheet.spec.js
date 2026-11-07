/**
 * The tearsheet: its geometry and options, the steps (checked one by one, the
 * rail, the progress line, focus and the announcement), the submit with
 * wait(), the unsaved-changes guard, stacking, the keyboard, names and forced
 * colours. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

async function open(page, { width = 1280, height = 800 } = {}) {
  await page.setViewportSize({ width, height });
  await page.goto('/test/browser/fixtures/component.html?c=tearsheet');
  await ready(page);
  await page.mouse.move(1, 1);
}

const add = (page) => page.locator('[data-demo="add"]');

async function openAdd(page) {
  await page.getByRole('button', { name: 'Add a device' }).click();
  await expect(add(page)).toHaveAttribute('data-state', 'open');
  await settle(page);
}

test('the box: wide, anchored to the bottom with the gap above; narrow; density and shape; the whole window on a phone', async ({ page }) => {
  await open(page);
  // Opened, settled (the box rises from the bottom edge), then measured.
  const measure = async (selector, around = '') => {
    await page.evaluate(({ selector, around }) => {
      const sheet = document.querySelector(selector);
      const holder = sheet.parentElement;
      holder.className = `${holder.className} ${around}`.trim();
      return DS.tearsheet.open(sheet);
    }, { selector, around });
    await expect(page.locator(selector)).toHaveAttribute('data-state', 'open');
    await settle(page);
    return page.evaluate(async ({ selector, around }) => {
      const sheet = document.querySelector(selector);
      const holder = sheet.parentElement;
      const box = sheet.querySelector('.ds-dialog__box').getBoundingClientRect();
      const style = getComputedStyle(sheet.querySelector('.ds-dialog__box'));
      const body = getComputedStyle(sheet.querySelector('.ds-tearsheet__body'));
      const out = { width: box.width, top: box.top, bottom: box.bottom, radius: parseFloat(style.borderTopLeftRadius), bottomRadius: parseFloat(style.borderBottomLeftRadius), pad: parseFloat(body.paddingLeft) };
      await DS.tearsheet.close(sheet, { force: true });
      holder.className = holder.className.replace(around, '').trim();
      return out;
    }, { selector, around });
  };
  const wide = await measure('[data-demo="add"]');
  expect(wide.width, 'the hook, 1200px').toBeCloseTo(1200, 0);
  expect(wide.top).toBeCloseTo(48, 0);
  expect(wide.bottom).toBeCloseTo(800, 0);
  expect(wide.radius).toBeGreaterThan(0);
  expect(wide.bottomRadius).toBe(0);
  expect(wide.pad).toBeCloseTo(24, 0);
  const compact = await measure('[data-demo="add"]', 'ds-density-compact');
  expect(compact.pad).toBeCloseTo(22, 0);
  expect((await measure('[data-demo="add"]', 'ds-shape-square')).radius).toBe(0);
  expect((await measure('[data-demo="person"]')).width).toBeCloseTo(640, 0);
  await page.setViewportSize({ width: 1000, height: 800 });
  expect((await measure('[data-demo="add"]')).width, 'never wider than the window less 32px a side').toBeCloseTo(1000 - 2 * 32, 0);
  await page.setViewportSize({ width: 390, height: 800 });
  const phone = await measure('[data-demo="add"]');
  expect(phone.width).toBeCloseTo(390, 0);
  expect(phone.top).toBeCloseTo(0, 0);
  expect(phone.radius).toBe(0);
});

test('steps: Next checks the step, the rail, the progress line, focus on the heading and the announcement follow; Back never checks', async ({ page }) => {
  await open(page);
  await openAdd(page);
  const sheet = add(page);
  const name = sheet.getByLabel('Name', { exact: true });
  await expect(name, 'focus in the first field').toBeFocused();
  await expect(sheet.getByRole('button', { name: 'Back' })).toBeHidden();
  await expect(sheet.getByRole('button', { name: 'Add device' })).toBeHidden();
  const rail = sheet.locator('.ds-steps__step');
  await sheet.getByRole('button', { name: 'Next' }).click();
  await expect(rail.nth(0), 'an empty required field: the step fails').toHaveAttribute('data-status', 'error');
  await expect(name).toBeFocused();
  await expect(sheet.locator('.ds-tearsheet__step').nth(0)).toBeVisible();
  await name.fill('LAPTOP-0042');
  await sheet.getByRole('button', { name: 'Next' }).click();
  await expect(sheet.locator('.ds-tearsheet__step').nth(1)).toBeVisible();
  await expect(sheet.locator('.ds-tearsheet__step').nth(0)).toBeHidden();
  await expect(rail.nth(0)).toHaveAttribute('data-status', 'done');
  await expect(rail.nth(0).locator('.ds-sr')).toHaveText(', done');
  await expect(rail.nth(0).locator('.ds-steps__mark svg')).toHaveCount(1);
  await expect(rail.nth(1)).toHaveAttribute('aria-current', 'step');
  await expect(sheet.getByRole('heading', { name: 'Network' }), 'focus on the new step\'s heading').toBeFocused();
  await expect(sheet.locator('.ds-tearsheet__progress')).toHaveText('Step 2 of 3: Network');
  await expect(page.locator('.ds-toasts [aria-live="polite"], .ds-sr[aria-live="polite"]').filter({ hasText: 'Step 2 of 3: Network' }).first()).toBeAttached();
  await sheet.getByRole('button', { name: 'Back' }).click();
  await expect(sheet.locator('.ds-tearsheet__step').nth(0)).toBeVisible();
  await expect(rail.nth(0)).toHaveAttribute('aria-current', 'step');
  // Enter in a field goes on.
  await name.focus();
  await page.keyboard.press('Enter');
  await expect(sheet.locator('.ds-tearsheet__step').nth(1)).toBeVisible();
  const host = sheet.getByLabel('Host name');
  await host.fill('Not A Host');
  await page.keyboard.press('Enter');
  await expect(rail.nth(1), 'the pattern fails').toHaveAttribute('data-status', 'error');
  await host.fill('laptop-0042');
  await page.keyboard.press('Enter');
  await expect(sheet.locator('.ds-tearsheet__step').nth(2)).toBeVisible();
  await expect(rail.nth(1)).toHaveAttribute('data-status', 'done');
  await expect(sheet.getByRole('button', { name: 'Next' })).toBeHidden();
  await expect(sheet.getByRole('button', { name: 'Add device' })).toBeVisible();
});

test('ds:step can refuse a step; set() and get() drive it from the page', async ({ page }) => {
  await open(page);
  await openAdd(page);
  const seen = await page.evaluate(() => {
    const sheet = document.querySelector('[data-demo="add"]');
    const flow = DS.get(sheet, 'tearsheet');
    const refuse = (event) => event.preventDefault();
    sheet.addEventListener('ds:step', refuse);
    sheet.querySelector('[name="name"]').value = 'LAPTOP-0042';
    sheet.querySelector('[data-ds-tearsheet-next]').click();
    const refused = flow.get().step;
    sheet.removeEventListener('ds:step', refuse);
    flow.set(2);
    return { refused, now: flow.get() };
  });
  expect(seen.refused).toBe(0);
  expect(seen.now).toMatchObject({ step: 2, total: 3, open: true });
});

test('submit: wait() keeps it busy, a failure keeps it open with a snackbar, success closes with reason submit', async ({ page }) => {
  await open(page);
  await openAdd(page);
  await page.evaluate(() => {
    const sheet = document.querySelector('[data-demo="add"]');
    sheet.querySelector('[name="name"]').value = 'LAPTOP-0042';
    sheet.querySelector('[name="host"]').value = 'laptop-0042';
    DS.get(sheet, 'tearsheet').set(2);
    window.attempts = 0;
    window.reason = null;
    sheet.addEventListener('ds:submit', (event) => {
      event.stopImmediatePropagation();
      window.attempts += 1;
      event.detail.wait(new Promise((resolve, reject) => { window.settle = { resolve, reject }; }));
    }, { capture: true });
    sheet.addEventListener('ds:close', (event) => { if (event.target === sheet) window.reason = event.detail.reason; });
  });
  const sheet = add(page);
  await sheet.getByRole('button', { name: 'Add device' }).click();
  await expect(sheet).toHaveAttribute('data-ds-busy', '');
  await page.keyboard.press('Escape');
  await expect(sheet, 'busy: Escape waits').toHaveAttribute('data-state', 'open');
  await page.evaluate(() => window.settle.reject(new Error('offline')));
  await expect(page.locator('.ds-toast__text', { hasText: 'That did not work. Try again.' })).toBeVisible();
  await expect(sheet).not.toHaveAttribute('data-ds-busy', '');
  await expect(sheet).toHaveAttribute('data-state', 'open');
  await sheet.getByRole('button', { name: 'Add device' }).click();
  await page.evaluate(() => window.settle.resolve());
  await settle(page);
  await expect(sheet).toBeHidden();
  expect(await page.evaluate(() => [window.attempts, window.reason])).toEqual([2, 'submit']);
  await expect(page.getByRole('button', { name: 'Add a device' }), 'focus back on the opener').toBeFocused();
});

test('unsaved changes: Escape and Cancel ask first; Keep editing stays, Discard closes; a clean one closes at once', async ({ page }) => {
  await open(page);
  await openAdd(page);
  const sheet = add(page);
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(sheet, 'clean: Escape closes').toBeHidden();
  await openAdd(page);
  await sheet.getByLabel('Name', { exact: true }).fill('LAPTOP-0042');
  await page.keyboard.press('Escape');
  const question = page.getByRole('alertdialog', { name: 'Discard your changes?' });
  await expect(question).toBeVisible();
  await expect(question.getByRole('button', { name: 'Keep editing' }), 'the safe choice first').toBeFocused();
  await expect(question.getByRole('button', { name: 'Discard' })).toHaveClass(/ds-tone-error/);
  await page.keyboard.press('Enter');
  await settle(page);
  await expect(question).toBeHidden();
  await expect(sheet).toHaveAttribute('data-state', 'open');
  await expect(sheet.getByLabel('Name', { exact: true }), 'the value stays').toHaveValue('LAPTOP-0042');
  await sheet.getByRole('button', { name: 'Cancel' }).click();
  await expect(question).toBeVisible();
  await question.getByRole('button', { name: 'Discard' }).click();
  await settle(page);
  await expect(sheet).toBeHidden();
  expect(await page.evaluate(() => DS.get(document.querySelector('[data-demo="add"]'), 'tearsheet').get().dirty)).toBe(false);
});

test('stacked: the one below recedes and is inert, Escape closes the top one only, focus goes back into the lower one', async ({ page }) => {
  await open(page);
  await openAdd(page);
  await page.evaluate(() => DS.get(document.querySelector('[data-demo="add"]'), 'tearsheet').set(2));
  const lower = add(page);
  const upper = page.locator('[data-demo="person"]');
  const opener = lower.getByRole('button', { name: 'Add a person' });
  await opener.click();
  await expect(upper).toHaveAttribute('data-state', 'open');
  await settle(page);
  await expect(lower).toHaveAttribute('data-stacked', '');
  await expect(upper).not.toHaveAttribute('data-stacked', '');
  await expect(upper).toHaveClass(/ds-dialog--nested/);
  const boxes = await page.evaluate(() => {
    const top = (selector) => document.querySelector(`${selector} .ds-dialog__box`).getBoundingClientRect().top;
    return { lower: top('[data-demo="add"]'), upper: top('[data-demo="person"]') };
  });
  expect(boxes.upper, 'the edge of the one below shows above').toBeGreaterThan(boxes.lower + 8);
  await expect(upper.getByLabel('Name', { exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(upper).toBeHidden();
  await expect(lower).toHaveAttribute('data-state', 'open');
  await expect(lower).not.toHaveAttribute('data-stacked', '');
  await expect(opener).toBeFocused();
});

test('names and roles: a dialog named by its title, a nav of steps with the current one, sections named by their headings', async ({ page }) => {
  await open(page);
  await openAdd(page);
  const sheet = page.getByRole('dialog', { name: 'Add a device' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('navigation', { name: 'Steps' })).toBeVisible();
  await expect(sheet.locator('[aria-current="step"]')).toHaveCount(1);
  await expect(sheet.getByRole('region', { name: 'Device' })).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Close' })).toBeVisible();
});

test('the narrow variant without a rail shows the progress line only with more than one step; Tab stays inside', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Edit the ticket' }).click();
  const sheet = page.locator('[data-demo="note"]');
  await expect(sheet).toHaveAttribute('data-state', 'open');
  await expect(sheet.locator('.ds-tearsheet__progress')).toBeHidden();
  for (let i = 0; i < 8; i += 1) await page.keyboard.press('Tab');
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[data-demo="note"]')))).toBe(true);
});

test('forced colours: the box keeps its edge and the hairlines stay', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await openAdd(page);
  const styles = await page.evaluate(() => {
    const sheet = document.querySelector('[data-demo="add"]');
    const box = getComputedStyle(sheet.querySelector('.ds-dialog__box'));
    const head = getComputedStyle(sheet.querySelector('.ds-tearsheet__head'));
    return { edge: box.borderTopColor, head: head.borderBottomColor, width: box.borderTopWidth };
  });
  expect(styles.edge).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
  expect(styles.head).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
});
