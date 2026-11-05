/**
 * The snackbar on the options model (3.0): the shape on its radius, one size
 * whatever the density and size around it, the tones of a message built by
 * hand, the keyboard, names and forced colours, and that DS.toast and
 * DS.overlay hold the same behaviour. The 2.x behaviour stays in
 * test/browser/toast-tooltip.spec.js. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/test/browser/fixtures/component.html?c=toast');
  await ready(page);
  await page.mouse.move(1, 1);
}

const look = (page, around) => page.evaluate((around) => {
  const region = document.createElement('div');
  region.className = around;
  region.innerHTML = '<div class="ds-toast"><span class="ds-toast__text">Saved.</span><button class="ds-btn ds-btn--text ds-sm ds-toast__action" type="button">Undo</button><button class="ds-btn ds-btn--quiet ds-btn--icon ds-toast__close" type="button" aria-label="Close"></button></div>';
  document.querySelector('#fx-component').append(region);
  const toast = region.querySelector('.ds-toast');
  const out = { radius: parseFloat(getComputedStyle(toast).borderTopLeftRadius), height: toast.getBoundingClientRect().height, action: toast.querySelector('.ds-toast__action').getBoundingClientRect().height, close: toast.querySelector('.ds-toast__close').getBoundingClientRect().height, padding: parseFloat(getComputedStyle(toast).paddingLeft) };
  region.remove();
  return out;
}, around);

test('the shape multiplies the radius; density and size change nothing', async ({ page }) => {
  await open(page);
  const plain = await look(page, '');
  expect(plain.radius).toBeGreaterThan(0);
  expect((await look(page, 'ds-shape-square')).radius).toBe(0);
  expect((await look(page, 'ds-shape-round')).radius).toBeCloseTo(plain.radius * 1.5, 1);
  expect(plain.close, 'its close button keeps 36px').toBeCloseTo(36, 0);
  for (const around of ['ds-density-tight', 'ds-sm', 'ds-lg', 'ds-xs']) {
    const other = await look(page, around);
    expect(other.height, around).toBeCloseTo(plain.height, 0);
    expect(other.padding, around).toBeCloseTo(plain.padding, 0);
    expect(other.close, `${around}: the close button`).toBeCloseTo(plain.close, 0);
  }
  expect((await look(page, 'ds-touch')).close, 'only touch makes it bigger').toBeGreaterThanOrEqual(48);
  expect(plain.action, 'its action keeps 32px').toBeCloseTo(32, 0);
  expect((await look(page, 'ds-density-tight')).action, 'at any density').toBeCloseTo(32, 0);
});

test('the close button takes its name from DS.config({ strings }); closeLabel still wins', async ({ page }) => {
  await open(page);
  const names = await page.evaluate(() => {
    DS.config({ strings: { close: 'Schliessen' } });
    const region = DS.overlay.toastRegion(document);
    const named = (options) => {
      const message = DS.overlay.toast(region, 'Failed.', { kind: 'error', ...options });
      const button = message.el.querySelector('.ds-toast__close');
      return [button.getAttribute('aria-label'), button.getAttribute('data-tip')];
    };
    const out = { strings: named({ key: 'a' }), option: named({ key: 'b', closeLabel: 'Zu' }) };
    DS.config({ strings: { close: 'Close' } });
    return out;
  });
  expect(names).toEqual({ strings: ['Schliessen', 'Schliessen'], option: ['Zu', 'Zu'] });
});

test('the kinds: an icon and a word; a tone on a built message reads as its kind; an error stays and is announced at once', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const region = DS.overlay.toastRegion(document);
    const built = (classes) => {
      const el = document.createElement('div');
      el.className = `ds-toast ${classes}`;
      el.innerHTML = '<span class="ds-toast__text">Built by hand.</span>';
      return DS.overlay.toast(region, el, { restart: false });
    };
    const error = built('ds-tone-error');
    const icon = DS.icons.iconElement(DS.icons.alertCircle, 20);
    error.el.prepend(icon);
    const plain = DS.overlay.toast(region, 'Could not save.', { kind: 'error' });
    return {
      stays: Boolean(error.el.querySelector('.ds-toast__close')),
      iconInk: getComputedStyle(icon).color,
      ink: getComputedStyle(error.el).color,
      plainIcon: Boolean(plain.el.querySelector('svg')),
      word: plain.el.querySelector('.ds-toast__text').textContent,
      classes: plain.el.className,
      assertive: document.querySelector('.ds-sr[aria-live="assertive"]') !== null,
    };
  });
  expect(result.stays, 'an error stays, so it can be closed').toBe(true);
  expect(result.iconInk).toBe(result.ink);
  expect(result.plainIcon).toBe(true);
  expect(result.word).toBe('Could not save.');
  expect(result.classes).toContain('ds-toast--error');
  expect(result.assertive).toBe(true);
  await page.evaluate(() => DS.overlay.closeToasts());
  await settle(page);
});

test('the keyboard: Tab reaches a message\'s buttons, focus pauses its timer, a focused message that leaves hands focus on', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'With undo' }).click();
  const action = page.getByRole('button', { name: 'Undo', exact: true }).last();
  await expect(action).toBeVisible();
  await settle(page);
  await action.focus();
  await page.keyboard.press('Tab');
  const closeButton = page.locator('.ds-toasts .ds-toast__close').last();
  await expect(closeButton).toBeFocused();
  await expect(closeButton).toHaveAccessibleName('Close');
  await page.keyboard.press('Enter');
  await settle(page);
  expect(await page.evaluate(() => document.activeElement !== document.body || document.querySelector('.ds-toasts .ds-toast') === null)).toBe(true);
});

test('DS.toast holds the same functions as DS.overlay: one region, one stack', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(async () => {
    const region = DS.toast.toastRegion(document);
    const first = DS.toast.toast(region, 'Same message.');
    const second = DS.overlay.toast(region, 'Same message.');
    const same = first === second;
    const count = region.querySelectorAll('.ds-toast').length;
    await DS.overlay.closeToasts(region);
    return { same, count, region: region === DS.overlay.toastRegion(document) };
  });
  expect(seen).toEqual({ same: true, count: 1, region: true });
});

test('the demo\'s buttons show each message', async ({ page }) => {
  await open(page);
  for (const [name, text] of [['Saved', 'Saved LAPTOP-0042.'], ['Info', 'The nightly sync runs at 02:30.'], ['Error, stays', 'Could not save the changes.']]) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.locator('.ds-toasts .ds-toast__text', { hasText: text })).toBeVisible();
  }
  await page.getByRole('button', { name: 'A retry keeps one error' }).click();
  await page.getByRole('button', { name: 'A retry keeps one error' }).click();
  await expect(page.locator('.ds-toasts .ds-toast__text', { hasText: /attempt/ })).toHaveCount(1);
  await page.getByRole('button', { name: 'Close all' }).click();
  await settle(page);
  await expect(page.locator('.ds-toasts .ds-toast')).toHaveCount(0);
});

test('forced colours: a message keeps its edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const edge = await page.evaluate(() => getComputedStyle(document.querySelector('[data-demo="static"] .ds-toast')).outlineColor);
  expect(edge).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
});

/* ── 3.0: waiting, progress, the queue limit and the stack ── */

test('promise(): a spinner while the work runs, then the success in place, which closes by itself', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(async () => {
    const region = DS.toast.toastRegion(document);
    let finish;
    const work = new Promise((resolve) => { finish = resolve; });
    const handle = DS.toast.promise(region, work, { pending: 'Saving LAPTOP-0042', success: (value) => `Saved ${value}.`, timeout: 600 });
    await DS.motion.settled(region, { subtree: true });
    const pending = {
      busy: handle.el.getAttribute('aria-busy'),
      spinner: Boolean(handle.el.querySelector('.ds-toast__spinner')),
      close: Boolean(handle.el.querySelector('.ds-toast__close')),
      text: handle.el.querySelector('.ds-toast__text').textContent,
    };
    finish('LAPTOP-0042');
    await work;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const done = {
      busy: handle.el.hasAttribute('aria-busy'),
      spinner: Boolean(handle.el.querySelector('.ds-toast__spinner')),
      icon: Boolean(handle.el.querySelector(':scope > svg')),
      text: handle.el.querySelector('.ds-toast__text').textContent,
      said: document.querySelector('.ds-sr[aria-live="polite"]')?.textContent ?? '',
    };
    await handle.closed;
    return { pending, done, gone: !handle.el.isConnected };
  });
  expect(seen.pending).toEqual({ busy: 'true', spinner: true, close: true, text: 'Saving LAPTOP-0042' });
  expect(seen.done.busy).toBe(false);
  expect(seen.done.spinner).toBe(false);
  expect(seen.done.icon).toBe(true);
  expect(seen.done.text).toBe('Saved LAPTOP-0042.');
  expect(seen.gone, 'the success closes by itself').toBe(true);
});

test('promise(): a failure turns into the error, which stays and is announced at once; a closed one still says it', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(async () => {
    const region = DS.toast.toastRegion(document);
    const failing = Promise.reject(new Error('offline'));
    const handle = DS.toast.promise(region, failing, { pending: 'Saving', error: (reason) => `Could not save: ${reason.message}.` });
    await failing.catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 50));
    const out = {
      classes: handle.el.className,
      text: handle.el.querySelector('.ds-toast__text').textContent,
      stays: handle.el.isConnected,
    };
    // Closed while waiting: the outcome is still said.
    let finish;
    const second = DS.toast.promise(region, new Promise((resolve) => { finish = resolve; }), { pending: 'Exporting', success: 'Export ready.' });
    await second.close();
    finish();
    return out;
  });
  // Spoken on the next frame: the error at once (assertive), the closed one's outcome politely.
  await expect.poll(() => page.evaluate(() => document.querySelector('.ds-sr[aria-live="assertive"]')?.textContent ?? '')).toContain('Could not save: offline.');
  await expect.poll(() => page.evaluate(() => document.querySelector('.ds-sr[aria-live="polite"]')?.textContent ?? '')).toContain('Export ready.');
  await page.evaluate(() => DS.toast.closeToasts());
  expect(seen.classes).toContain('ds-toast--error');
  expect(seen.text).toBe('Could not save: offline.');
  expect(seen.stays).toBe(true);
});

test('progress(): a progressbar named by the text, the share at the end, set() moves it, done() ends it in place', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(async () => {
    const region = DS.toast.toastRegion(document);
    const upload = DS.toast.progress(region, 'Uploading 3 files', { value: 0.25 });
    const bar = upload.el.querySelector('[role="progressbar"]');
    const name = document.getElementById(bar.getAttribute('aria-labelledby'))?.textContent;
    const first = { now: bar.getAttribute('aria-valuenow'), figure: upload.el.querySelector('.ds-toast__value').textContent };
    upload.set(0.8, 'Uploading the last file');
    const second = { now: bar.getAttribute('aria-valuenow'), text: upload.el.querySelector('.ds-toast__text').textContent };
    upload.set(null);
    const unknown = bar.hasAttribute('aria-valuenow');
    upload.done('3 files uploaded.', { persistent: true });
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const done = {
      bar: Boolean(upload.el.querySelector('[role="progressbar"]')),
      text: upload.el.querySelector('.ds-toast__text').textContent,
      progressClass: upload.el.classList.contains('ds-toast--progress'),
    };
    upload.set(0.1);
    await DS.toast.closeToasts(region);
    return { name, first, second, unknown, done };
  });
  expect(seen.name).toBe('Uploading 3 files');
  expect(seen.first.now).toBe('25');
  expect(seen.first.figure).toMatch(/25\s?%/);
  expect(seen.second).toEqual({ now: '80', text: 'Uploading the last file' });
  expect(seen.unknown, 'an unknown share has no value').toBe(false);
  expect(seen.done).toEqual({ bar: false, text: '3 files uploaded.', progressClass: false });
});

test('data-ds-toast-limit: how many show at once; the others wait in the queue', async ({ page }) => {
  await open(page);
  const counts = await page.evaluate(async () => {
    const region = DS.toast.toastRegion(document);
    region.setAttribute('data-ds-toast-limit', '1');
    for (const name of ['One', 'Two', 'Three']) DS.toast.toast(region, `${name} stays.`, { persistent: true, restart: false });
    await DS.motion.settled(region, { subtree: true });
    const one = region.querySelectorAll('.ds-toast:not([data-ds-leaving])').length;
    region.setAttribute('data-ds-toast-limit', '5');
    await DS.toast.closeToasts(region);
    region.removeAttribute('data-ds-toast-limit');
    return { one };
  });
  expect(counts.one).toBe(1);
});

test('the stack: collapsed behind the front, expanded on focus or a click, never on hover; collapses on a press outside', async ({ page }) => {
  await open(page);
  await page.evaluate(async () => {
    const region = DS.toast.toastRegion(document);
    region.classList.add('ds-toasts--stack');
    for (const name of ['LAPTOP-0042', 'TABLET-0007', 'PHONE-0013']) DS.toast.toast(region, `Saved ${name}.`, { persistent: true, restart: false });
    await DS.motion.settled(region, { subtree: true });
  });
  await settle(page);
  const region = page.locator('.ds-toasts');
  const boxes = () => page.evaluate(() => [...document.querySelectorAll('.ds-toasts .ds-toast')].map((el) => {
    const box = el.getBoundingClientRect();
    return { top: Math.round(box.top), height: Math.round(box.height), text: getComputedStyle(el.querySelector('.ds-toast__text')).opacity };
  }));
  let collapsed = await boxes();
  expect(collapsed).toHaveLength(3);
  // Collapsed: the front's text shows, those behind are hidden and stand only a little above it.
  expect(collapsed[2].text).toBe('1');
  expect(collapsed[0].text).toBe('0');
  expect(collapsed[2].top - collapsed[0].top).toBeLessThan(collapsed[2].height);
  // Hover never expands it.
  await page.locator('.ds-toasts .ds-toast').last().hover();
  await page.waitForTimeout(300);
  await expect(region).not.toHaveAttribute('data-expanded', '');
  // A click on a message does.
  await page.locator('.ds-toasts .ds-toast__text').last().click();
  await expect(region).toHaveAttribute('data-expanded', '');
  await settle(page);
  const expanded = await boxes();
  expect(expanded[1].top - expanded[0].top).toBeGreaterThanOrEqual(expanded[0].height);
  expect(expanded[0].text).toBe('1');
  // A press outside collapses it.
  await page.mouse.click(640, 100);
  await expect(region).not.toHaveAttribute('data-expanded', '');
  // Focus inside expands it, and every message's close button is reachable.
  await page.locator('.ds-toasts .ds-toast__close').first().focus();
  await expect(region).toHaveAttribute('data-expanded', '');
  await expect(page.locator('.ds-toasts .ds-toast__close').first()).toHaveAccessibleName('Close');
  await page.evaluate(() => document.activeElement.blur());
  await expect(region).not.toHaveAttribute('data-expanded', '');
  await page.evaluate(async () => {
    const region = DS.toast.toastRegion(document);
    await DS.toast.closeToasts(region);
    region.classList.remove('ds-toasts--stack');
  });
});

test('forced colours: the waiting spinner and the progress bar take system colours', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const seen = await page.evaluate(() => {
    const spinner = document.querySelector('[data-demo="work-static"] .ds-toast__spinner');
    // The bar paints its fill on pseudo-elements from --ds-progress-bar.
    const meter = document.querySelector('[data-demo="work-static"] .ds-progress');
    return { spinner: getComputedStyle(spinner).getPropertyValue('--ds-spinner-color').trim(), bar: getComputedStyle(meter).getPropertyValue('--ds-progress-bar').trim() };
  });
  expect(seen.spinner).toBe('Highlight');
  expect(seen.bar).toBe('Highlight');
});
