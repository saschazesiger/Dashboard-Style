/**
 * The split button (DS.splitbutton): one pill with two targets (the outer
 * corners of the pill, square inner corners, the divider), two tab stops,
 * the action runs the page's handler, the toggle is a menu button (its
 * name from the strings when the markup gives none, the menu under it,
 * the keys and Escape of the APG pattern), a choice of radio items sets
 * the action's label and value and sends ds:change, set() sends nothing;
 * the options, a phone width and forced colours. Runs in `fallback` too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=splitbutton');
  await ready(page);
  await page.mouse.move(1, 1);
}

const focusedText = (page) => page.evaluate(() => (document.activeElement?.querySelector('.ds-menu__label')?.textContent ?? document.activeElement?.textContent ?? '').trim());

test('one pill, two targets: the outer corners, square inner corners, the toggle named from the strings', async ({ page }) => {
  await open(page);
  const group = page.getByRole('group', { name: 'Save' }).first();
  const action = group.locator('.ds-split-btn__action');
  const toggle = group.locator('.ds-split-btn__toggle');
  await expect(action).toHaveAccessibleName('Save');
  await expect(toggle).toHaveAccessibleName('More options for Save');
  await expect(toggle).toHaveAttribute('aria-haspopup', 'menu');
  // A name the markup gives stays.
  await expect(page.locator('[data-demo="merge"] .ds-split-btn__toggle')).toHaveAccessibleName('Merge methods');
  const shape = await group.evaluate((el) => {
    const [a, t] = el.querySelectorAll('.ds-btn');
    const sa = getComputedStyle(a);
    const st = getComputedStyle(t);
    return {
      action: [sa.borderStartStartRadius, sa.borderEndStartRadius, sa.borderStartEndRadius, sa.borderEndEndRadius].map(parseFloat),
      toggle: [st.borderStartStartRadius, st.borderEndStartRadius, st.borderStartEndRadius, st.borderEndEndRadius].map(parseFloat),
      height: [a.getBoundingClientRect().height, t.getBoundingClientRect().height],
      divider: st.borderInlineStartColor !== st.backgroundColor,
      toggleWidth: t.getBoundingClientRect().width,
    };
  });
  expect(shape.action).toEqual([20, 20, 0, 0]);
  expect(shape.toggle).toEqual([0, 0, 20, 20]);
  expect(shape.height).toEqual([40, 40]);
  expect(shape.divider).toBe(true);
  // The chevron (20px) and 8px each side.
  expect(shape.toggleWidth).toBeCloseTo(20 + 16 + 2, 0);
});

test('two tab stops: the action runs the page\'s handler; the toggle opens the menu under it', async ({ page }) => {
  await open(page);
  const group = page.getByRole('group', { name: 'Save' }).first();
  const action = group.locator('.ds-split-btn__action');
  const toggle = group.locator('.ds-split-btn__toggle');
  const menu = page.locator(`#${await toggle.getAttribute('aria-controls')}`);
  await action.click();
  await expect(page.locator('.ds-toast').filter({ hasText: 'Saved.' }).first()).toBeVisible();
  await expect(menu).toBeHidden();
  await focusByKeyboard(page, action);
  await page.keyboard.press('Tab');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(menu).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(() => focusedText(page)).toBe('Save as draft');
  // Under the toggle, not over the pill.
  const place = await page.evaluate(({ m, t }) => {
    const menu = document.getElementById(m).getBoundingClientRect();
    const toggle = document.querySelector(`[aria-controls="${m}"]`).getBoundingClientRect();
    return { below: menu.top >= toggle.bottom - 1, near: menu.top - toggle.bottom };
  }, { m: await toggle.getAttribute('aria-controls'), t: null });
  expect(place.below).toBe(true);
  expect(place.near).toBeLessThan(16);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(toggle).toBeFocused();
  for (const [key, first] of [['ArrowDown', 'Save as draft'], ['ArrowUp', 'Save and close'], ['Space', 'Save as draft']]) {
    await page.keyboard.press(key);
    await expect.poll(() => focusedText(page), key).toBe(first);
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
  }
  // An item runs, the menu closes, focus is back on the toggle.
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect(menu).toBeHidden();
  await expect(page.locator('.ds-toast').filter({ hasText: 'Saved and closed.' })).toBeVisible();
  await expect(toggle).toBeFocused();
});

test('a choice: the radio sets the action\'s label and value, ds:change on the group, set() sends nothing', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.__changes = [];
    document.addEventListener('ds:change', (event) => {
      if (event.target.matches('.ds-split-btn')) window.__changes.push(event.detail.value);
    });
  });
  const group = page.locator('[data-demo="merge"]');
  const action = group.locator('.ds-split-btn__action');
  const toggle = group.locator('.ds-split-btn__toggle');
  await toggle.click();
  const menu = page.locator(`#${await toggle.getAttribute('aria-controls')}`);
  await menu.getByRole('menuitemradio', { name: /Squash and merge/ }).click();
  await expect(action).toHaveAccessibleName('Squash and merge');
  await expect(action).toHaveAttribute('value', 'squash');
  await action.click();
  await expect(page.locator('.ds-toast').filter({ hasText: 'Started: squash.' })).toBeVisible();
  const state = await group.evaluate((el) => {
    const control = DS.get(el, 'splitbutton');
    const before = control.get();
    control.set('rebase');
    return { before, after: control.get(), value: el.querySelector('.ds-split-btn__action').value };
  });
  expect(state).toEqual({ before: 'squash', after: 'rebase', value: 'rebase' });
  await expect(action).toHaveAccessibleName('Rebase and merge');
  expect(await page.evaluate(() => window.__changes)).toEqual(['squash']);
});

test('the imperative API: DS.splitbutton.create, open and close; partsOf finds the parts', async ({ page }) => {
  await open(page);
  const out = await page.evaluate(async () => {
    const host = document.createElement('div');
    host.innerHTML = '<div class="ds-btn-group ds-split-btn" role="group" aria-label="Probe"><button class="ds-btn ds-split-btn__action" type="button">Run</button><button class="ds-btn ds-split-btn__toggle" type="button"></button></div>' +
      '<div class="ds-menu" role="menu" aria-label="Run options" hidden><button class="ds-menu__item" role="menuitem" type="button">Later</button></div>';
    document.querySelector('#fx-component').append(host);
    const group = host.firstElementChild;
    const parts = DS.splitbutton.partsOf(group);
    const control = DS.splitbutton.create(group);
    await control.open();
    const opened = parts.toggle.getAttribute('aria-expanded');
    await control.close();
    const same = DS.splitbutton.create(group) === control;
    const result = { menu: parts.menu === host.lastElementChild, name: parts.toggle.getAttribute('aria-label'), opened, closed: parts.toggle.getAttribute('aria-expanded'), value: control.get(), same };
    // Destroyed and made again: the name it wrote still follows the action's label.
    control.destroy();
    const again = DS.splitbutton.create(group);
    parts.action.textContent = 'Deploy';
    again.set(null);
    result.renamed = parts.toggle.getAttribute('aria-label');
    again.destroy();
    host.remove();
    return result;
  });
  expect(out).toEqual({ menu: true, name: 'More options for Run', opened: 'true', closed: 'false', value: null, same: true, renamed: 'More options for Deploy' });
});

test('options: size and density set both halves, the shape the pill, touch the toggle\'s width', async ({ page }) => {
  await open(page);
  const out = await page.evaluate(() => {
    const result = {};
    for (const cls of ['ds-sm', 'ds-lg', 'ds-density-dense', 'ds-shape-square', 'ds-touch']) {
      const region = document.createElement('div');
      region.className = cls;
      region.innerHTML = '<div class="ds-btn-group ds-split-btn" role="group" aria-label="P"><button class="ds-btn ds-btn--filled ds-split-btn__action" type="button"><span class="ds-split-btn__label">Save</span></button><button class="ds-btn ds-btn--filled ds-split-btn__toggle" type="button" aria-label="More"><svg width="20" height="20"></svg></button></div>';
      document.querySelector('#fx-component').append(region);
      const [a, t] = region.querySelectorAll('.ds-btn');
      result[cls] = { h: a.getBoundingClientRect().height, th: t.getBoundingClientRect().height, tw: t.getBoundingClientRect().width, r: parseFloat(getComputedStyle(a).borderStartStartRadius) };
      region.remove();
    }
    return result;
  });
  expect(out['ds-sm']).toMatchObject({ h: 32, th: 32, r: 16 });
  expect(out['ds-lg']).toMatchObject({ h: 48, th: 48, r: 24 });
  expect(out['ds-density-dense']).toMatchObject({ h: 32, th: 32 });
  expect(out['ds-shape-square'].r).toBe(0);
  expect(out['ds-touch'].th).toBe(48);
  expect(out['ds-touch'].tw).toBeGreaterThanOrEqual(48);
});

test('a phone width of 360px: the pill stays on one line, the label ends in an ellipsis', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page);
  const out = await page.evaluate(() => {
    const host = document.createElement('div');
    host.style.inlineSize = '160px';
    host.innerHTML = '<div class="ds-btn-group ds-split-btn" role="group" aria-label="P"><button class="ds-btn ds-btn--filled ds-split-btn__action" type="button"><span class="ds-split-btn__label">Save and send to every device owner</span></button><button class="ds-btn ds-btn--filled ds-split-btn__toggle" type="button" aria-label="More"><svg width="20" height="20"></svg></button></div>';
    document.querySelector('#fx-component').append(host);
    const group = host.firstElementChild;
    const label = group.querySelector('.ds-split-btn__label');
    const [a, t] = group.querySelectorAll('.ds-btn');
    const result = { width: group.getBoundingClientRect().width, oneLine: Math.abs(a.getBoundingClientRect().top - t.getBoundingClientRect().top) < 1, cut: label.scrollWidth > label.clientWidth };
    host.remove();
    return result;
  });
  expect(out.width).toBeLessThanOrEqual(160.5);
  expect(out.oneLine).toBe(true);
  expect(out.cut).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test('forced colours: both halves keep the system colours and a visible line between them', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const out = await page.getByRole('group', { name: 'Save' }).first().evaluate((el) => {
    const t = el.querySelector('.ds-split-btn__toggle');
    const probe = document.createElement('span');
    probe.style.color = 'ButtonBorder';
    el.append(probe);
    const border = getComputedStyle(probe).color;
    probe.remove();
    return { line: getComputedStyle(t).borderInlineStartColor, width: parseFloat(getComputedStyle(t).borderInlineStartWidth), border };
  });
  expect(out.width).toBe(1);
  expect(out.line).toBe(out.border);
});
