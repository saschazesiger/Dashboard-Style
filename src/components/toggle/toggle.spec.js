/**
 * Toggle buttons and toggle groups (DS.toggle): a toggle flips aria-pressed
 * on a click, Enter and Space and sends ds:change; a blocked one never
 * does; a single group keeps one item on (required: never none), a
 * multiple group flips each; one tab stop with the arrow keys, Home and
 * End; set() from the page sends nothing; the filled and tonal toggles'
 * neutral container while off; the gap with the density; touch; forced
 * colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=toggle');
  await ready(page);
  await page.mouse.move(1, 1);
}

/** Every ds:change on the page, as { target, detail } with the target's data-demo or text. */
async function listen(page) {
  await page.evaluate(() => {
    window.__changes = [];
    document.addEventListener('ds:change', (event) => {
      const detail = { ...event.detail };
      delete detail.item;
      window.__changes.push({ target: event.target.getAttribute('data-demo') || event.target.textContent.trim(), detail });
    });
  });
}
const changes = (page) => page.evaluate(() => window.__changes);

/** The colour a value resolves to, as getComputedStyle writes it. */
const colourOf = (page, value) => page.evaluate((value) => {
  const el = document.createElement('span');
  el.style.color = value;
  document.querySelector('#fx-component').append(el);
  const colour = getComputedStyle(el).color;
  el.remove();
  return colour;
}, value);

test('one toggle: a click, Space and Enter flip aria-pressed and send ds:change', async ({ page }) => {
  await open(page);
  await listen(page);
  const toggle = page.locator('[data-demo="only-open"]');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(toggle).toHaveAccessibleName('Only open');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await focusByKeyboard(page, toggle);
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  expect(await changes(page)).toEqual([
    { target: 'only-open', detail: { pressed: true } },
    { target: 'only-open', detail: { pressed: false } },
    { target: 'only-open', detail: { pressed: true } },
  ]);
  // On is never the colour alone: the icon swap shows the check.
  await expect(toggle.locator('.ds-icon-swap__b')).toBeVisible();
  // The controller: get() and set() from the page, which sends nothing.
  const state = await toggle.evaluate((el) => {
    const control = DS.get(el, 'toggle');
    const before = control.get();
    control.set(false);
    return { before, after: control.get(), pressed: el.getAttribute('aria-pressed') };
  });
  expect(state).toEqual({ before: true, after: false, pressed: 'false' });
  expect(await changes(page)).toHaveLength(3);
});

test('a blocked toggle never flips: aria-disabled stays focusable, disabled is skipped', async ({ page }) => {
  await open(page);
  await listen(page);
  const mute = page.getByRole('button', { name: 'Mute' });
  await expect(mute).toHaveAttribute('aria-disabled', 'true');
  await mute.click({ force: true });
  await focusByKeyboard(page, mute);
  await page.keyboard.press('Space');
  await page.keyboard.press('Enter');
  await expect(mute).toHaveAttribute('aria-pressed', 'false');
  // The locked choice keeps its on look and its state.
  const helpful = page.getByRole('button', { name: 'Helpful', exact: true });
  await helpful.click({ force: true });
  await expect(helpful).toHaveAttribute('aria-pressed', 'true');
  expect(await changes(page)).toEqual([]);
});

test('a single, required group: one tab stop on the item that is on, arrows move, Space presses, never none', async ({ page }) => {
  await open(page);
  await listen(page);
  const group = page.locator('[data-demo="view"]');
  await expect(group).toHaveAttribute('role', 'toolbar');
  await expect(group).toHaveAccessibleName('View');
  const items = group.getByRole('button');
  await expect(items).toHaveCount(3);
  // One tab stop, resting on the item that is on.
  expect(await items.evaluateAll((list) => list.map((el) => el.tabIndex))).toEqual([0, -1, -1]);
  await focusByKeyboard(page, items.nth(0));
  await page.keyboard.press('ArrowRight');
  await expect(items.nth(1)).toBeFocused();
  // The arrows move focus only.
  await expect(items.nth(0)).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Space');
  await expect(items.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(items.nth(0)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-demo="view-out"]')).toHaveText('View: grid');
  await page.keyboard.press('End');
  await expect(items.nth(2)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(items.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(items.nth(2)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(items.nth(2)).toHaveAttribute('aria-pressed', 'true');
  // Required: pressing the item that is on keeps it on, and nothing is sent.
  await items.nth(2).click();
  await expect(items.nth(2)).toHaveAttribute('aria-pressed', 'true');
  expect(await changes(page)).toEqual([
    { target: 'view', detail: { value: 'grid' } },
    { target: 'view', detail: { value: 'board' } },
  ]);
  // Tab leaves the group in one step.
  await focusByKeyboard(page, items.nth(2));
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.closest('[data-demo="view"]'))).toBeNull();
  // Single: an arrow moves focus off the item that is on; once focus leaves,
  // Shift+Tab comes back to the item that is on, not to the last focused.
  await focusByKeyboard(page, items.nth(2));
  await page.keyboard.press('ArrowLeft');
  await expect(items.nth(1)).toBeFocused();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.closest('[data-demo="view"]'))).toBeNull();
  await page.keyboard.press('Shift+Tab');
  await expect(items.nth(2)).toBeFocused();
  await expect(items.nth(2)).toHaveAttribute('aria-pressed', 'true');
  // set() from the page: no event; the controller reads the state.
  const value = await group.evaluate((el) => {
    const control = DS.get(el, 'toggle-group');
    control.set('list');
    return control.get();
  });
  expect(value).toBe('list');
  await expect(items.nth(0)).toHaveAttribute('aria-pressed', 'true');
  expect(await changes(page)).toHaveLength(2);
});

test('a role="group" keeps every button a tab stop; data-ds-toggle-group-roving overrides the role', async ({ page }) => {
  await open(page);
  const status = page.getByRole('group', { name: 'Status' });
  const items = status.getByRole('button');
  await focusByKeyboard(page, items.nth(0));
  await page.keyboard.press('Tab');
  await expect(items.nth(1)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(items.nth(2)).toBeFocused();
  expect(await items.evaluateAll((list) => list.map((el) => el.getAttribute('tabindex')))).toEqual([null, null, null]);
  const stops = await page.evaluate(async () => {
    const make = (role, roving) => {
      const el = document.createElement('div');
      el.className = 'ds-toggle-group';
      el.setAttribute('role', role);
      el.setAttribute('aria-label', 'Probe');
      el.setAttribute('data-ds-toggle-group', 'single');
      if (roving) el.setAttribute('data-ds-toggle-group-roving', roving);
      el.innerHTML = '<button class="ds-btn" type="button" aria-pressed="false">A</button><button class="ds-btn" type="button" aria-pressed="true">B</button>';
      document.querySelector('#fx-component').append(el);
      return el;
    };
    const groups = [make('group', 'on'), make('toolbar', 'off')];
    DS.init(document.querySelector('#fx-component'));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const out = groups.map((el) => [...el.children].map((item) => item.getAttribute('tabindex')));
    for (const el of groups) el.remove();
    return out;
  });
  expect(stops).toEqual([['-1', '0'], [null, null]]);
});

test('create() and group() on what the attributes set up: the same controller, a press flips once', async ({ page }) => {
  await open(page);
  const out = await page.evaluate(() => {
    const button = document.querySelector('[data-demo="only-open"]');
    const before = button.getAttribute('aria-pressed');
    const made = DS.toggle.create(button);
    const same = made === DS.get(button, 'toggle') && made === DS.toggle.create(button);
    button.click();
    const view = document.querySelector('[data-demo="view"]');
    const group = DS.toggle.group(view, { value: 'grid' });
    const groupSame = group === DS.get(view, 'toggle-group');
    view.querySelector('[value="board"]').click();
    return { before, after: button.getAttribute('aria-pressed'), same, groupSame, value: group.get(), pressed: view.querySelectorAll('[aria-pressed="true"]').length };
  });
  expect(out).toEqual({ before: 'false', after: 'true', same: true, groupSame: true, value: 'board', pressed: 1 });
});

test('a single group without -required turns off again; a multiple group flips each item', async ({ page }) => {
  await open(page);
  await listen(page);
  const status = page.getByRole('group', { name: 'Status' });
  const first = status.getByRole('button', { name: 'Open' });
  await first.click();
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await status.getByRole('button', { name: 'Waiting' }).click();
  await expect(first).toHaveAttribute('aria-pressed', 'false');
  await status.getByRole('button', { name: 'Waiting' }).click();
  await expect(status.locator('[aria-pressed="true"]')).toHaveCount(0);

  const format = page.locator('[data-demo="format"]');
  // data-ds-value="bold" is the start, over the markup.
  await expect(format.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true');
  await format.getByRole('button', { name: 'Code' }).click();
  await format.getByRole('button', { name: 'Bold' }).click();
  await expect(page.locator('[data-demo="format-out"]')).toHaveText('Format: code');
  const log = (await changes(page)).filter((change) => change.target === 'format');
  expect(log.map((change) => change.detail.value)).toEqual([['bold', 'code'], ['code']]);
  expect(await format.evaluate((el) => DS.get(el, 'toggle-group').get())).toEqual(['code']);
});

test('the imperative API makes the same controllers', async ({ page }) => {
  await open(page);
  const out = await page.evaluate(() => {
    const host = document.createElement('div');
    host.className = 'ds-toggle-group';
    host.setAttribute('role', 'group');
    host.setAttribute('aria-label', 'Probe');
    host.innerHTML = '<button class="ds-btn" type="button" aria-pressed="false" value="a">A</button><button class="ds-btn" type="button" aria-pressed="false" value="b">B</button>';
    document.querySelector('#fx-component').append(host);
    const group = DS.toggle.group(host, { mode: 'single', required: true, value: 'b' });
    const seen = [];
    const off = group.on('change', ({ value }) => seen.push(value));
    host.querySelector('[value="a"]').click();
    off();
    host.querySelector('[value="b"]').click();
    const single = document.createElement('button');
    single.className = 'ds-btn';
    single.type = 'button';
    single.textContent = 'Solo';
    host.after(single);
    const toggle = DS.toggle.create(single, { pressed: true });
    single.click();
    const result = { seen, value: group.get(), solo: toggle.get(), attr: single.getAttribute('aria-pressed') };
    group.destroy();
    toggle.destroy();
    host.remove();
    single.remove();
    return result;
  });
  expect(out).toEqual({ seen: ['a'], value: 'b', solo: false, attr: 'false' });
});

test('filled and tonal toggles: the neutral container while off, their own fill while on', async ({ page }) => {
  await open(page);
  const look = (selector) => page.locator(selector).evaluate((el) => getComputedStyle(el).backgroundColor);
  const neutral = await colourOf(page, 'var(--ds-surface-highest)');
  const primary = await colourOf(page, 'var(--ds-primary)');
  await page.evaluate(() => {
    document.querySelector('#fx-component').insertAdjacentHTML('beforeend', '<div class="probe">' +
      '<button id="f-off" class="ds-btn ds-btn--filled ds-btn--icon" type="button" aria-pressed="false" aria-label="A"></button>' +
      '<button id="f-on" class="ds-btn ds-btn--filled ds-btn--icon" type="button" aria-pressed="true" aria-label="B"></button>' +
      '<button id="t-off" class="ds-btn ds-btn--tonal ds-btn--icon" type="button" aria-pressed="false" aria-label="C"></button>' +
      '<button id="f-plain" class="ds-btn ds-btn--filled ds-btn--icon" type="button" aria-label="D"></button></div>');
  });
  expect(await look('#f-off')).toBe(neutral);
  expect(await look('#t-off')).toBe(neutral);
  expect(await look('#f-on')).toBe(primary);
  // A filled button that is no toggle keeps its fill.
  expect(await look('#f-plain')).toBe(primary);
});

test('options: the gap steps with the density; an icon toggle reaches the touch minimum', async ({ page }) => {
  await open(page);
  const gaps = await page.evaluate(() => {
    const out = {};
    for (const cls of ['', 'ds-density-compact', 'ds-density-tight']) {
      const region = document.createElement('div');
      region.className = cls;
      region.innerHTML = '<div class="ds-toggle-group" role="group" aria-label="P"><button class="ds-btn ds-btn--icon" type="button" aria-pressed="false" aria-label="A"></button><button class="ds-btn ds-btn--icon ds-touch" type="button" aria-pressed="false" aria-label="B"></button></div>';
      document.querySelector('#fx-component').append(region);
      const group = region.firstElementChild;
      out[cls || 'comfortable'] = { gap: parseFloat(getComputedStyle(group).columnGap), touch: group.lastElementChild.getBoundingClientRect().width };
      region.remove();
    }
    return out;
  });
  expect(gaps.comfortable.gap).toBe(8);
  expect(gaps['ds-density-compact'].gap).toBe(6);
  expect(gaps['ds-density-tight'].gap).toBe(2);
  for (const entry of Object.values(gaps)) expect(entry.touch).toBe(48);
});

test('a phone width of 360px: the groups wrap inside their region', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  const overflow = await page.evaluate(() => [...document.querySelectorAll('.ds-toggle-group')].map((el) => el.scrollWidth - el.clientWidth));
  for (const extra of overflow) expect(extra).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test('forced colours: a toggle that is on is Highlight, an off one the button colours', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const on = page.locator('[data-demo="view"] [aria-pressed="true"]');
  const off = page.locator('[data-demo="view"] [aria-pressed="false"]').first();
  const highlight = await colourOf(page, 'Highlight');
  expect(await on.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(highlight);
  expect(await off.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(highlight);
});
