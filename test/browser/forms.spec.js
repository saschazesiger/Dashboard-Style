/**
 * The form parts of 2.0 (docs/components.md, Form) in real engines:
 *
 * - a check list keeps the ring and the halo of its first and last box
 *   inside its box, and its rows keep their height while it scrolls;
 * - a long check label wraps beside its box, a short one keeps the 40px
 *   row; the children of a check group line up under the parent's label;
 * - aria-disabled checkboxes look like disabled ones, show no hover halo
 *   and keep their focus halo;
 * - the word "(changed)" joins a field's name only while it is changed,
 *   and its dot fades in on --ds-dur-fast and out on --ds-dur-instant;
 * - the search key rests in the field's end padding and goes once the
 *   field has the focus or a value;
 * - an input group draws the ring while its input has the focus, not
 *   while its trailing button has it; invalid turns its border;
 * - the filled field keeps its label inside the box and turns its bottom
 *   line to 2px on focus;
 * - radio tiles stand in two columns (one on a phone) and pop their check;
 * - the sticky actions stick on a phone only; date and time fields side by
 *   side take less padding at 720px and below, a field alone keeps its own;
 * - the composer keeps its button at the bottom while its text grows
 *   (field-sizing, else DS.dom.autosize()) up to its cap, then scrolls;
 * - forced colours: a focused field shows an outline (Chromium emulates
 *   forced colours);
 * - settled shots of the slider and the tiles.
 */
import { test, expect } from './base-test.js';
import { ready, settle, focusByKeyboard } from './helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/forms.html';

async function open(page) {
  await page.goto(FIXTURE);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

/** The border box of a locator's element. */
function box(locator) {
  return locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
  });
}

/** Alpha of the last colour in a box-shadow ("rgba(...)" or "rgb(...)"; none is 0). */
function shadowAlpha(value) {
  if (!value || value === 'none') return 0;
  const match = /rgba?\(([^)]+)\)/.exec(value);
  if (!match) return 1;
  const parts = match[1].split(/[\s,/]+/).filter(Boolean);
  return parts.length > 3 ? Number(parts[3]) : 1;
}

test.describe('check list and check rows', () => {
  test('a check list keeps the ring and halo of its first and last box inside, and its rows keep their height', async ({ page }) => {
    await open(page);
    const list = page.locator('#check-list');
    const inner = await list.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return { left: r.left + parseFloat(s.borderLeftWidth), right: r.right - parseFloat(s.borderRightWidth), scrolls: el.scrollHeight > el.clientHeight };
    });
    expect(inner.scrolls, 'the list scrolls on its own').toBe(true);
    // The long row keeps two lines (an auto row would shrink to 40px in a box shorter than its rows).
    expect((await box(page.locator('#long-check'))).height).toBeGreaterThan(55);
    for (const which of ['first', 'last']) {
      const input = list.locator('input')[which]();
      await focusByKeyboard(page, input);
      await settle(page);
      const reach = await input.evaluate((el) => {
        const s = getComputedStyle(el);
        const ring = parseFloat(s.outlineOffset) + parseFloat(s.outlineWidth);
        const halo = Math.max(...[...s.boxShadow.matchAll(/(-?[\d.]+)px/g)].map((m) => Number(m[1])));
        return { ring, halo, style: s.outlineStyle };
      });
      expect(reach.style, `${which}: a ring`).not.toBe('none');
      const visible = await list.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top + el.clientTop, bottom: r.top + el.clientTop + el.clientHeight };
      });
      const b = await box(input);
      const extent = Math.max(reach.ring, reach.halo);
      expect(b.left - extent, `${which}: start edge`).toBeGreaterThanOrEqual(inner.left - 0.5);
      expect(b.right + extent, `${which}: end edge`).toBeLessThanOrEqual(inner.right + 0.5);
      expect(b.top - extent, `${which}: top edge`).toBeGreaterThanOrEqual(visible.top - 0.5);
      expect(b.bottom + extent, `${which}: bottom edge`).toBeLessThanOrEqual(visible.bottom + 0.5);
    }
  });

  test('a long check label wraps beside its box; a short row stays 40px; children line up under the parent label', async ({ page }) => {
    await open(page);
    expect((await box(page.locator('#plain-row'))).height).toBe(40);
    const row = await box(page.locator('#long-check'));
    const input = await box(page.locator('#long-check input'));
    // The box centres on the first 20px line, 10px below the row's top.
    expect(Math.abs((input.top + input.bottom) / 2 - (row.top + 20))).toBeLessThanOrEqual(1);
    const parentText = await box(page.locator('#check-group > .ds-check > span'));
    const child = await box(page.locator('.ds-check-group__children input').first());
    expect(Math.abs(child.left - parentText.left)).toBeLessThanOrEqual(1);
  });

  test('an aria-disabled checkbox looks disabled, shows no hover halo and keeps its focus halo', async ({ page }) => {
    await open(page);
    const read = (selector) => page.locator(selector).evaluate((el) => ({ border: getComputedStyle(el).borderColor, opacity: getComputedStyle(el).opacity, cursor: getComputedStyle(el).cursor, shadow: getComputedStyle(el).boxShadow, ink: getComputedStyle(el.closest('.ds-check')).color }));
    const aria = await read('#aria-box');
    const disabled = await read('#disabled-box');
    expect(aria.border).toBe(disabled.border);
    expect(aria.ink).toBe(disabled.ink);
    expect(aria.cursor).toBe('not-allowed');
    await page.locator('#aria-row').hover();
    await settle(page);
    expect(shadowAlpha((await read('#aria-box')).shadow), 'no hover halo').toBe(0);
    await page.locator('#plain-row').hover();
    await settle(page);
    expect(shadowAlpha((await read('#plain-box')).shadow), 'a plain box shows its hover halo').toBeGreaterThan(0);
    await page.mouse.move(1, 1);
    await focusByKeyboard(page, page.locator('#aria-box'));
    await settle(page);
    const focused = await read('#aria-box');
    expect(shadowAlpha(focused.shadow), 'the focus halo stays').toBeGreaterThan(0);
  });
});

test.describe('fields', () => {
  test('"(changed)" joins the name only while the field is changed; the dot fades in fast and out in --ds-dur-instant', async ({ page }) => {
    await open(page);
    const input = page.locator('#place');
    const field = page.locator('#changed-field');
    const dot = () => page.locator('#changed-field .ds-field__label').evaluate((el) => {
      const s = getComputedStyle(el, '::after');
      return { opacity: Number(s.opacity), duration: s.transitionDuration, width: s.width };
    });
    await expect(input).toHaveAccessibleName('Room');
    const rest = await dot();
    expect(rest.opacity).toBe(0);
    expect(rest.width, 'the dot keeps its room').toBe('6px');
    const label = await box(page.locator('#changed-field .ds-field__label'));
    await field.evaluate((el) => el.classList.add('ds-field--changed'));
    await expect(input).toHaveAccessibleName('Room (changed)');
    const shown = await dot();
    expect(shown.duration).toBe('0.15s');
    await settle(page);
    expect((await dot()).opacity).toBe(1);
    expect(await box(page.locator('#changed-field .ds-field__label')), 'the label never shifts').toEqual(label);
    await field.evaluate((el) => el.classList.remove('ds-field--changed'));
    expect((await dot()).duration).toBe('0.1s');
    await expect(input).toHaveAccessibleName('Room');
  });

  test('the search key rests in the end padding and goes once the field has the focus or a value', async ({ page }) => {
    await open(page);
    const key = page.locator('#search .ds-search__key');
    const input = page.locator('#search-input');
    const state = () => key.evaluate((el) => ({ opacity: Number(getComputedStyle(el).opacity), visibility: getComputedStyle(el).visibility }));
    expect(await state()).toEqual({ opacity: 1, visibility: 'visible' });
    const room = await input.evaluate((el) => { const r = el.getBoundingClientRect(); return r.right - parseFloat(getComputedStyle(el).paddingRight); });
    expect((await box(key)).left, 'the caret never runs under the key').toBeGreaterThanOrEqual(room - 0.5);
    await input.focus();
    await settle(page);
    expect(await state()).toEqual({ opacity: 0, visibility: 'hidden' });
    await input.fill('laptop');
    await input.blur();
    await settle(page);
    expect(await state()).toEqual({ opacity: 0, visibility: 'hidden' });
    await input.fill('');
    await input.blur();
    await settle(page);
    expect(await state()).toEqual({ opacity: 1, visibility: 'visible' });
  });

  test('an input group rings while its input has the focus, not while its button has it; invalid turns its border', async ({ page }) => {
    await open(page);
    const group = page.locator('#password-group');
    const read = (locator) => locator.evaluate((el) => ({ border: getComputedStyle(el).borderTopColor, shadow: getComputedStyle(el).boxShadow, height: el.getBoundingClientRect().height }));
    const primary = await page.locator('.ds-theme').evaluate((el) => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--ds-primary)';
      el.append(probe);
      const colour = getComputedStyle(probe).color;
      probe.remove();
      return colour;
    });
    expect((await read(group)).height).toBe(40);
    expect((await read(page.locator('#quota-group'))).height).toBe(40);
    const inner = await page.locator('#password').evaluate((el) => ({ border: getComputedStyle(el).borderTopWidth, background: getComputedStyle(el).backgroundColor }));
    expect(inner.border).toBe('0px');
    expect(inner.background).toBe('rgba(0, 0, 0, 0)');
    await page.locator('#password').focus();
    const ring = await read(group);
    expect(ring.border, 'the ring at once').toBe(primary);
    expect(ring.shadow).toContain('inset');
    await focusByKeyboard(page, page.locator('#reveal'));
    await settle(page);
    const button = await read(group);
    expect(button.border).not.toBe(primary);
    expect(shadowAlpha(button.shadow)).toBe(0);
    const error = await page.locator('.ds-theme').evaluate((el) => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--ds-error)';
      el.append(probe);
      const colour = getComputedStyle(probe).color;
      probe.remove();
      return colour;
    });
    expect((await read(page.locator('#site-group'))).border).toBe(error);
  });

  test('the filled field keeps its label inside the box and turns its bottom line to 2px on focus', async ({ page }) => {
    await open(page);
    const field = page.locator('#inset-title-field');
    const label = await box(field.locator('.ds-field__label'));
    const input = await box(page.locator('#inset-input'));
    const area = await field.evaluate((el) => {
      const s = getComputedStyle(el, '::before');
      return { shadow: s.boxShadow, height: parseFloat(s.height) };
    });
    expect(label.bottom).toBeLessThanOrEqual(input.top + 0.5);
    // The box spans the label's and the input's rows.
    expect(Math.abs(area.height - (input.bottom - label.top))).toBeLessThanOrEqual(1);
    expect(area.shadow).toMatch(/-1px/);
    await page.locator('#inset-input').focus();
    const focused = await field.evaluate((el) => getComputedStyle(el, '::before').boxShadow);
    expect(focused).toMatch(/-2px/);
  });

  test('date and time fields side by side take less padding at 720px and below; a field alone keeps its own', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await open(page);
    const pad = (selector) => page.locator(selector).evaluate((el) => getComputedStyle(el).paddingLeft);
    expect(await pad('#daily')).toBe('8px');
    expect(await pad('#starts')).toBe('8px');
    expect(await pad('#alone')).toBe('12px');
  });

  test('the composer keeps its button at the bottom while the text grows, up to its cap', async ({ page }) => {
    await open(page);
    // field-sizing grows the field where the refinement applies; elsewhere
    // (Firefox, the fallback project, which drops every @supports block)
    // DS.dom.autosize() sets its height from the text.
    const native = await page.locator('#message').evaluate((el) => getComputedStyle(el).getPropertyValue('field-sizing') === 'content');
    const before = await box(page.locator('#message'));
    await page.locator('#message').fill('One\nTwo\nThree\nFour');
    const after = await box(page.locator('#message'));
    expect(after.height).toBeGreaterThan(before.height + 40);
    expect(await page.locator('#message').evaluate((el) => el.style.height !== '')).toBe(!native);
    const shell = await page.locator('#composer').evaluate((el) => { const r = el.getBoundingClientRect(); return r.bottom - parseFloat(getComputedStyle(el).paddingBottom) - parseFloat(getComputedStyle(el).borderBottomWidth); });
    expect(Math.abs((await box(page.locator('#send'))).bottom - shell)).toBeLessThanOrEqual(1);
    // --ds-composer-max-height (220px) caps it; then the text scrolls.
    await page.locator('#message').fill(Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`).join('\n'));
    const capped = await page.locator('#message').evaluate((el) => ({ height: el.getBoundingClientRect().height, scrolls: el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY !== 'hidden' }));
    expect(capped.height).toBeLessThanOrEqual(220.5);
    expect(capped.height).toBeGreaterThan(200);
    expect(capped.scrolls).toBe(true);
    // Emptied, it shrinks back to one row.
    await page.locator('#message').fill('');
    expect(Math.abs((await box(page.locator('#message'))).height - before.height)).toBeLessThanOrEqual(1);
  });
});

test.describe('tiles, actions, slider', () => {
  test('radio tiles stand in two columns, one on a phone; the check pops in on the chosen tile', async ({ page }) => {
    await open(page);
    const columns = () => page.locator('#tiles').evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(await columns()).toBe(2);
    await page.locator('#tile-desktop').click();
    const mark = page.locator('#tile-desktop .ds-radio__mark svg');
    const entering = await mark.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(entering).toBe('0.15s, 0.25s');
    await settle(page);
    expect(await mark.evaluate((el) => [Number(getComputedStyle(el).opacity), getComputedStyle(el).scale])).toEqual([1, '1']);
    expect(await page.locator('.ds-radio:not(#tile-desktop) .ds-radio__mark svg').evaluate((el) => Number(getComputedStyle(el).opacity))).toBe(0);
    await page.setViewportSize({ width: 400, height: 800 });
    expect(await columns()).toBe(1);
  });

  test('the actions stick to the bottom on a phone only', async ({ page }) => {
    await open(page);
    expect(await page.locator('#actions').evaluate((el) => getComputedStyle(el).position)).toBe('static');
    await page.setViewportSize({ width: 390, height: 700 });
    expect(await page.locator('#actions').evaluate((el) => getComputedStyle(el).position)).toBe('sticky');
  });

  test('a slider rests and focuses with its halo, its value as tall as the halo', async ({ page }) => {
    await open(page);
    expect((await box(page.locator('#keep'))).height).toBe(40);
    await expect(page.locator('#sliders')).toHaveScreenshot('sliders.png');
    await focusByKeyboard(page, page.locator('#keep'));
    await page.keyboard.press('ArrowRight');
    expect(await page.locator('#keep').inputValue()).toBe('41');
    await page.locator('#keep').evaluate((el) => el.style.setProperty('--ds-share', String(el.value / 100)));
    await settle(page);
    await expect(page.locator('#sliders')).toHaveScreenshot('sliders-focused.png');
  });

  test('settled shots: tiles, input groups, the filled field', async ({ page }) => {
    await open(page);
    await expect(page.locator('#tiles')).toHaveScreenshot('tiles.png');
    await expect(page.locator('#groups')).toHaveScreenshot('groups.png');
    await expect(page.locator('#inset')).toHaveScreenshot('inset.png');
    await expect(page.locator('#check-list')).toHaveScreenshot('check-list.png');
  });
});

test.describe('forced colours', () => {
  test('a focused field shows an outline (its inset ring is a shadow there)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page);
    // The focused control, and the box that draws its field (a pseudo-element for the filled field).
    for (const [control, host, pseudo] of [['#room', '#room', null], ['#quota', '#quota-group', null], ['#inset-input', '#inset-title-field', '::before'], ['#message', '#composer', null]]) {
      await page.locator(control).focus();
      const outline = await page.locator(host).evaluate((el, part) => {
        const s = getComputedStyle(el, part);
        return { style: s.outlineStyle, width: s.outlineWidth };
      }, pseudo);
      expect(outline, control).toEqual({ style: 'solid', width: '2px' });
    }
  });
});
