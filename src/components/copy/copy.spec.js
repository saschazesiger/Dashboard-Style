/**
 * The copy button (DS.copy): what it copies (a target's text, a field's
 * value, the value beside it, data-ds-copy-value), the Clipboard API, the
 * copy command when the API is missing or refused, and the selection with
 * a hint when both fail; "Copied" (data-state, the icon swap, the done
 * face, the strings) for --ds-hold-status, then back; the announcement;
 * ds:copy; blocked buttons; the field look's options, a phone width and
 * forced colours. The clipboard is stubbed, so every engine runs the same
 * paths. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

/**
 * The page's clipboard: `api` 'ok' records writeText, 'refuse' rejects it,
 * 'none' removes it; the copy command records (or refuses with `command: false`).
 */
async function open(page, { api = 'ok', command = true } = {}) {
  await page.addInitScript(({ api, command }) => {
    window.__copied = [];
    const clipboard = api === 'none' ? undefined : {
      writeText: (text) => (api === 'ok' ? (window.__copied.push({ via: 'clipboard', text }), Promise.resolve()) : Promise.reject(new DOMException('Denied', 'NotAllowedError'))),
    };
    Object.defineProperty(Navigator.prototype, 'clipboard', { configurable: true, get: () => clipboard });
    Document.prototype.execCommand = function (name) {
      if (name !== 'copy' || !command) return false;
      const field = document.activeElement;
      window.__copied.push({ via: 'command', text: field?.value?.slice(field.selectionStart, field.selectionEnd) });
      return true;
    };
  }, { api, command });
  await page.goto('/test/browser/fixtures/component.html?c=copy');
  await ready(page);
  await page.mouse.move(1, 1);
  await page.evaluate(() => {
    window.__events = [];
    document.addEventListener('ds:copy', (event) => window.__events.push({ ...event.detail }));
  });
}

const copied = (page) => page.evaluate(() => window.__copied);
const events = (page) => page.evaluate(() => window.__events);
/** The text of every live region on the page. */
const spoken = (page) => page.evaluate(() => [...document.querySelectorAll('[aria-live]')].map((el) => el.textContent).join(' | '));

test('an icon button copies its target\'s text, shows the check for --ds-hold-status and says "Copied"', async ({ page }) => {
  await open(page);
  const button = page.getByRole('button', { name: 'Copy the API key' });
  await button.click();
  await expect.poll(() => copied(page)).toEqual([{ via: 'clipboard', text: 'ak_live_7f3a9c2e51b04d88a6' }]);
  await expect(button).toHaveAttribute('data-state', 'copied');
  await expect(button.locator('.ds-icon-swap')).toHaveAttribute('data-swap', 'b');
  await expect.poll(() => spoken(page)).toContain('Copied');
  expect(await events(page)).toEqual([{ text: 'ak_live_7f3a9c2e51b04d88a6', ok: true, method: 'clipboard' }]);
  // Back after --ds-hold-status; a second press inside the hold does nothing.
  await button.click();
  expect(await copied(page)).toHaveLength(1);
  const hold = await button.evaluate((el) => DS.motion.motionDuration(el, '--ds-hold-status'));
  expect(hold).toBeGreaterThan(0);
  await expect(button).not.toHaveAttribute('data-state', 'copied', { timeout: hold + 3000 });
  await expect(button.locator('.ds-icon-swap')).toHaveAttribute('data-swap', 'a');
});

test('what it copies: a field\'s value, the value beside it, data-ds-copy-value; set() overrides', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Copy the enrolment link' }).click();
  await page.getByRole('button', { name: 'Copy the serial number' }).click();
  await page.getByRole('button', { name: 'Copy link' }).click();
  await page.getByRole('button', { name: 'Copy address' }).click();
  await expect.poll(() => copied(page).then((list) => list.map((entry) => entry.text))).toEqual([
    'https://example.com/devices/42/enrol',
    'LAPTOP-0042',
    'https://example.com/tickets/4127',
    'Ada Lovelace <ada@example.com>',
  ]);
  const text = await page.evaluate(() => {
    const button = document.querySelector('[aria-label="Copy the ticket number"]');
    const control = DS.get(button, 'copy');
    const before = control.get();
    control.set('T-9999');
    return { before, after: control.get(), lookup: DS.copy.textOf(button) };
  });
  expect(text).toEqual({ before: 'T-4127', after: 'T-9999', lookup: 'T-4127' });
});

test('a labelled button rolls to its done face with "Copied" from the strings; the keyboard copies too', async ({ page }) => {
  await open(page);
  const button = page.getByRole('button', { name: 'Copy link' });
  await expect(button.locator('.ds-copy__done')).toHaveText('Copied');
  await focusByKeyboard(page, button);
  await page.keyboard.press('Enter');
  await expect(button).toHaveClass(/ds-btn--done/);
  await expect(button.locator('.ds-btn__face--done')).toBeVisible();
  // The focus stays on the button.
  await expect(button).toBeFocused();
  const other = page.getByRole('button', { name: 'Copy address' });
  await focusByKeyboard(page, other);
  await page.keyboard.press('Space');
  await expect.poll(() => copied(page).then((list) => list.length)).toBe(2);
});

test('a blocked button never copies; a button without a name is named "Copy"', async ({ page }) => {
  await open(page);
  const locked = page.getByRole('button', { name: 'Copy key' });
  await locked.click({ force: true });
  await focusByKeyboard(page, locked);
  await page.keyboard.press('Enter');
  expect(await copied(page)).toEqual([]);
  await expect(locked).not.toHaveAttribute('data-state', 'copied');
  const name = await page.evaluate(() => {
    const button = document.createElement('button');
    button.className = 'ds-btn ds-btn--icon';
    button.type = 'button';
    button.setAttribute('data-ds-copy-value', 'x');
    document.querySelector('#fx-component').append(button);
    const control = DS.copy.create(button);
    const label = button.getAttribute('aria-label');
    control.destroy();
    button.remove();
    return label;
  });
  expect(name).toBe('Copy');
});

test('without the Clipboard API, or refused: the copy command, and focus stays where it was', async ({ page }) => {
  await open(page, { api: 'none' });
  const button = page.getByRole('button', { name: 'Copy the serial number' });
  await focusByKeyboard(page, button);
  await page.keyboard.press('Enter');
  await expect.poll(() => copied(page)).toEqual([{ via: 'command', text: 'LAPTOP-0042' }]);
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute('data-state', 'copied');
  expect(await events(page)).toEqual([{ text: 'LAPTOP-0042', ok: true, method: 'command' }]);
  expect(await page.locator('textarea').count()).toBe(0);
});

test('the clipboard refused: the copy command next', async ({ page }) => {
  await open(page, { api: 'refuse' });
  await page.getByRole('button', { name: 'Copy link' }).click();
  await expect.poll(() => copied(page)).toEqual([{ via: 'command', text: 'https://example.com/tickets/4127' }]);
});

test('both refused: the text is selected and the announcer says how to copy it by hand', async ({ page }) => {
  await open(page, { api: 'refuse', command: false });
  const button = page.getByRole('button', { name: 'Copy the API key' });
  await button.click();
  await expect.poll(() => events(page)).toEqual([{ text: 'ak_live_7f3a9c2e51b04d88a6', ok: false, method: 'none' }]);
  await expect(button).not.toHaveAttribute('data-state', 'copied');
  expect(await page.evaluate(() => String(getSelection()))).toBe('ak_live_7f3a9c2e51b04d88a6');
  await expect.poll(() => spoken(page)).toMatch(/Copying is blocked here\. The text is selected: press (Ctrl\+C|⌘C|Cmd\+C|.+) to copy it\./);
});

test('the field look: the field height at every size and density, the touch minimum, the shape, 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  const out = await page.evaluate(() => {
    const result = {};
    for (const cls of ['', 'ds-sm', 'ds-lg', 'ds-density-dense', 'ds-touch', 'ds-shape-square']) {
      const region = document.createElement('div');
      region.className = cls;
      region.innerHTML = '<span class="ds-copy ds-copy--field"><code class="ds-copy__value">a-very-long-value-that-never-fits-a-phone-0123456789</code><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Copy" data-ds-copy></button></span>';
      document.querySelector('#fx-component').append(region);
      const field = region.firstElementChild;
      const value = field.firstElementChild;
      result[cls || 'md'] = { button: field.querySelector('.ds-btn').getBoundingClientRect().height, h: field.getBoundingClientRect().height, r: parseFloat(getComputedStyle(field).borderTopLeftRadius), w: field.getBoundingClientRect().width, parent: region.getBoundingClientRect().width, cut: value.scrollWidth > value.clientWidth };
      region.remove();
    }
    return result;
  });
  expect(out.md.h).toBe(40);
  expect(out['ds-sm'].h).toBe(32);
  expect(out['ds-lg'].h).toBe(48);
  expect(out['ds-density-dense'].h).toBe(32);
  // The button 8px lower than the field; under touch a full target, the field around it.
  expect([out.md.button, out['ds-sm'].button, out['ds-lg'].button]).toEqual([32, 24, 40]);
  expect(out['ds-touch'].button).toBe(48);
  expect(out['ds-touch'].h).toBeGreaterThanOrEqual(48);
  expect(out.md.r).toBeGreaterThan(0);
  expect(out['ds-shape-square'].r).toBe(0);
  for (const entry of Object.values(out)) {
    expect(entry.w).toBeLessThanOrEqual(entry.parent + 0.5);
    expect(entry.cut).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test('forced colours: the field keeps its border, the value is CanvasText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const out = await page.locator('[data-demo="field"]').evaluate((el) => {
    const probe = document.createElement('span');
    probe.style.color = 'CanvasText';
    el.append(probe);
    const text = getComputedStyle(probe).color;
    probe.remove();
    return { border: parseFloat(getComputedStyle(el).borderTopWidth), borderColour: getComputedStyle(el).borderTopColor, bg: getComputedStyle(el).backgroundColor, value: getComputedStyle(el.querySelector('.ds-copy__value')).color, text };
  });
  expect(out.border).toBe(1);
  expect(out.borderColour).not.toBe(out.bg);
  expect(out.value).toBe(out.text);
});
