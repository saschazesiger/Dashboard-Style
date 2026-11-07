/**
 * The tag input (3.0): the box at every size x density and under .ds-touch,
 * adding by Enter, a comma and a paste, the checks with their message and
 * aria-invalid, the maximum, removing by Backspace, Delete and a press, the
 * arrow keys across the chips, names, announcements, the states and forced
 * colours. Runs on the generated fixture of the demo, and in `fallback`.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=taginput');
  await ready(page);
  await page.mouse.move(1, 1);
}

const box = (page, name) => page.locator(`[data-demo="${name}"]`);
const field = (page, name) => box(page, name).locator('.ds-taginput__input');
const tags = (page, name) => page.evaluate((demo) => DS.get(document.querySelector(`[data-demo="${demo}"]`), 'taginput').get(), name);
const spoken = (page, text) => page.locator('.ds-toasts [aria-live], .ds-sr[aria-live]').filter({ hasText: text });

test('the box at every size x density, and .ds-touch as a minimum over both', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const region = document.createElement('div');
          region.className = `${density} ${size}${touch ? ' ds-touch' : ''}`;
          region.innerHTML = '<div class="ds-taginput"><input class="ds-input ds-taginput__input" aria-label="Probe"></div>';
          document.querySelector('#fx-component').append(region);
          out.push({ touch, density, size, height: region.firstElementChild.getBoundingClientRect().height });
          region.remove();
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES });
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    expect(entry.height, `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`).toBeCloseTo(Math.max(entry.touch ? 48 : 0, 24, 40 + step * 8 + density * 4), 0);
  }
});

test('Enter and a comma add a tag, a repeat is refused with a message and aria-invalid until the text changes', async ({ page }) => {
  await open(page);
  const input = field(page, 'labels');
  await expect(box(page, 'labels').locator('.ds-chip')).toHaveText(['Remove printer', 'Remove floor-2', 'Remove shared']);
  await input.click();
  await page.keyboard.type('lab');
  await page.keyboard.press('Enter');
  await page.keyboard.type('kiosk,');
  expect(await tags(page, 'labels')).toEqual(['printer', 'floor-2', 'shared', 'lab', 'kiosk']);
  await expect(input).toHaveValue('');
  await expect(spoken(page, 'Added kiosk')).toHaveCount(1);
  await expect(page.locator('[data-demo-out="labels"]')).toHaveText('printer, floor-2, shared, lab, kiosk');
  await page.keyboard.type('Printer');
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('Printer');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  const message = page.locator('.ds-taginput__message').first();
  await expect(message).toHaveText('Printer is in the list already');
  await expect(message.locator('svg')).toHaveCount(1);
  const described = await input.getAttribute('aria-describedby');
  expect(described.split(' ')).toContain(await message.getAttribute('id'));
  await page.keyboard.type('s');
  await expect(input).not.toHaveAttribute('aria-invalid');
  await expect(message).toBeHidden();
});

test('a pasted list adds every tag that passes and keeps the rest typed', async ({ page }) => {
  await open(page);
  const input = field(page, 'mails');
  await input.click();
  await page.evaluate(() => {
    const target = document.querySelector('[data-demo="mails"] .ds-taginput__input');
    const data = new DataTransfer();
    data.setData('text/plain', 'grace@example.com, not an address\nalan@example.com; edsger@example.com; barbara@example.com');
    const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true });
    // Not every engine takes clipboardData from the constructor.
    Object.defineProperty(event, 'clipboardData', { value: data });
    target.dispatchEvent(event);
  });
  expect(await tags(page, 'mails')).toEqual(['ada@example.com', 'grace@example.com', 'alan@example.com', 'edsger@example.com']);
  await expect(input).toHaveValue('not an address, barbara@example.com');
  await expect(box(page, 'mails')).toHaveClass(/ds-taginput--full/);
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('.ds-taginput__message').nth(1)).toHaveText(/not valid|Up to 4 items/);
});

test('Backspace removes the last tag; the arrows walk the chips; Delete, Backspace and Enter remove the focused one', async ({ page }) => {
  await open(page);
  const input = field(page, 'labels');
  const chips = box(page, 'labels').locator('.ds-chip');
  await input.click();
  await page.keyboard.press('Backspace');
  expect(await tags(page, 'labels')).toEqual(['printer', 'floor-2']);
  await expect(spoken(page, 'Removed shared')).toHaveCount(1);
  await expect(input).toBeFocused();
  // The chips are no tab stops.
  await expect(chips.first()).toHaveAttribute('tabindex', '-1');
  await page.keyboard.press('ArrowLeft');
  await expect(chips.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(chips.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(input).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Home');
  await expect(chips.nth(0)).toBeFocused();
  await page.keyboard.press('Delete');
  expect(await tags(page, 'labels')).toEqual(['floor-2']);
  await expect(chips.nth(0)).toBeFocused();
  await page.keyboard.press('Enter');
  expect(await tags(page, 'labels')).toEqual([]);
  await expect(input).toBeFocused();
});

test('a press on a chip removes it and keeps the focus in the field; leaving the field adds what is typed', async ({ page }) => {
  await open(page);
  const input = field(page, 'labels');
  await box(page, 'labels').locator('.ds-chip').nth(1).click();
  expect(await tags(page, 'labels')).toEqual(['printer', 'shared']);
  await expect(input).toBeFocused();
  await page.keyboard.type('spare');
  await page.keyboard.press('Tab');
  expect(await tags(page, 'labels')).toEqual(['printer', 'shared', 'spare']);
  // Walking into the chips with the keys is no leaving: the half-typed text stays typed.
  await input.focus();
  await page.keyboard.type('half');
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowLeft');
  await expect(box(page, 'labels').locator('.ds-chip').last()).toBeFocused();
  expect(await tags(page, 'labels')).toEqual(['printer', 'shared', 'spare']);
  await expect(input).toHaveValue('half');
  await page.keyboard.press('ArrowRight');
  await expect(input).toBeFocused();
  await page.keyboard.press('Tab');
  expect(await tags(page, 'labels')).toEqual(['printer', 'shared', 'spare', 'half']);
});

test('ds:add can refuse a tag; set() changes the tags without an event', async ({ page }) => {
  await open(page);
  const result = await page.evaluate(() => {
    const el = document.querySelector('[data-demo="labels"]');
    const control = DS.get(el, 'taginput');
    const events = [];
    el.addEventListener('ds:add', (event) => { if (event.detail.text === 'no') event.preventDefault(); });
    el.addEventListener('ds:change', (event) => events.push(event.detail));
    const kept = control.add('no, yes');
    control.set(['one', 'two', 'one']);
    return { kept, events, value: control.get() };
  });
  expect(result.kept).toBe('no');
  expect(result.events).toEqual([{ value: ['printer', 'floor-2', 'shared', 'yes'], added: ['yes'], removed: [] }]);
  expect(result.value).toEqual(['one', 'two']);
});

test('states: disabled takes the chips with it, read-only keeps the tags, the page\'s error stays', async ({ page }) => {
  await open(page);
  const disabled = page.locator('.ds-taginput:has(> .ds-taginput__input:disabled)');
  await expect(disabled.locator('.ds-chip').first()).toBeDisabled();
  expect(await disabled.evaluate((el) => getComputedStyle(el).cursor)).toBe('not-allowed');
  const readonly = page.locator('.ds-taginput:has(> .ds-taginput__input[readonly])');
  await readonly.locator('.ds-taginput__input').focus();
  await page.keyboard.press('Backspace');
  await expect(readonly.locator('.ds-chip')).toHaveCount(2);
  const invalid = page.locator('.ds-taginput:has(> .ds-taginput__input[aria-invalid="true"])').last();
  const colors = await invalid.evaluate((el) => {
    const probe = document.createElement('div');
    probe.style.color = 'var(--ds-error)';
    el.append(probe);
    const error = getComputedStyle(probe).color;
    probe.remove();
    return { border: getComputedStyle(el).borderTopColor, error };
  });
  expect(colors.border).toBe(colors.error);
});

test('forced colours: a focused box takes the Highlight outline, a disabled one GrayText', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await field(page, 'labels').focus();
  const focused = await box(page, 'labels').evaluate((el) => getComputedStyle(el).outlineStyle + ' ' + getComputedStyle(el).outlineWidth);
  expect(focused).toBe('solid 2px');
  const disabled = page.locator('.ds-taginput:has(> .ds-taginput__input:disabled)');
  const gray = await disabled.evaluate((el) => {
    const probe = document.createElement('span');
    probe.style.color = 'GrayText';
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return [getComputedStyle(el).borderTopColor, value];
  });
  expect(gray[0]).toBe(gray[1]);
});
