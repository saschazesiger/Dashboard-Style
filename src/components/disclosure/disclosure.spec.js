/**
 * The disclosure on the options model (3.0), on its demo: the summary's
 * height at every size x density x touch, plain and as a row; the shape at
 * rest and pressed, a row staying rectangular; the exclusive accordion
 * (details[name]) by pointer and keyboard, with its motion; rows that run to
 * a card's edges at every density; names and the keyboard; forced colours.
 * Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=disclosure');
  await ready(page);
  await page.mouse.move(1, 1);
}

const add = (page, html) => page.evaluate((markup) => {
  const region = document.createElement('div');
  region.id = 'probe';
  region.insertAdjacentHTML('beforeend', markup);
  document.getElementById('probe')?.remove();
  document.getElementById('fx-component').prepend(region);
}, html);

const finish = (page, selector) => page.$eval(selector, (el) => Promise.all(el.getAnimations().map((animation) => animation.finished.catch(() => null))).then(() => undefined));

const details = (cls, id) => `<details class="ds-collapsible ds-disclosure ${cls}" id="${id}"><summary><span class="ds-disclosure__title">Title</span></summary><div class="ds-disclosure__body"><p>Body</p></div></details>`;

test('the height at every size x density, and .ds-touch as a minimum over both', async ({ page }) => {
  await open(page);
  for (const touch of [false, true]) {
    for (const [density, densityStep] of DENSITIES) {
      for (const [size, sizeStep] of SIZES) {
        await add(page, `<div class="${density} ${size}${touch ? ' ds-touch' : ''}">${details('', 'plain')}${details('ds-disclosure--row', 'row')}</div>`);
        const measured = await page.evaluate(() => ({
          plain: document.querySelector('#plain > summary').getBoundingClientRect().height,
          row: document.querySelector('#row > summary').getBoundingClientRect().height,
          line: parseFloat(getComputedStyle(document.querySelector('#plain > summary')).lineHeight),
        }));
        const name = `${size} ${density}${touch ? ' touch' : ''}`;
        expect(measured.plain, `${name}: plain`).toBeCloseTo(Math.max(touch ? TOUCH : 0, 40 + sizeStep * 8 + densityStep * 4, measured.line), 0);
        // A row keeps --ds-space-2 of padding around its text.
        expect(measured.row, `${name}: row`).toBeCloseTo(Math.max(touch ? TOUCH : 0, 48 + sizeStep * 8 + densityStep * 4, measured.line + 16), 0);
      }
    }
  }
});

test('type follows size only; density takes the row\'s side padding and the room around the body', async ({ page }) => {
  await open(page);
  await add(page, `<div class="ds-lg">${details('', 'large')}</div>${details('', 'plain')}<div class="ds-density-dense">${details('ds-disclosure--row', 'dense')}${details('', 'dense-plain')}</div>${details('ds-disclosure--row', 'row')}`);
  const font = (id) => page.$eval(`#${id} > summary`, (el) => getComputedStyle(el).fontSize);
  expect(await font('large')).toBe('16px');
  expect(await font('plain')).toBe('14px');
  expect(await font('dense-plain')).toBe('14px');
  const pad = (id) => page.$eval(`#${id} > summary`, (el) => parseFloat(getComputedStyle(el).paddingLeft));
  expect(await pad('row')).toBe(16);
  expect(await pad('dense')).toBe(12);
  expect(await page.$eval('#dense-plain .ds-disclosure__body', (el) => parseFloat(getComputedStyle(el).paddingTop))).toBe(8);
  expect(await page.$eval('#plain .ds-disclosure__body', (el) => parseFloat(getComputedStyle(el).paddingTop))).toBe(12);
});

test('shape: multiplies the plain summary, at rest and pressed; a row stays rectangular', async ({ page }) => {
  await open(page);
  await add(page, `<div class="ds-shape-square">${details('', 'square')}</div><div class="ds-shape-soft">${details('', 'soft')}</div>${details('', 'default')}<div class="ds-shape-round">${details('', 'round')}${details('ds-disclosure--row', 'row')}</div>`);
  const radius = (id) => page.$eval(`#${id} > summary`, (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
  const rest = {};
  for (const id of ['square', 'soft', 'default', 'round', 'row']) rest[id] = await radius(id);
  expect(rest).toEqual({ square: 0, soft: 10, default: 20, round: 20, row: 0 });
  const pressed = {};
  for (const id of ['square', 'soft', 'default', 'round']) {
    await page.$eval(`#${id} > summary`, (el) => el.classList.add('ds-pressed'));
    await finish(page, `#${id} > summary`);
    pressed[id] = await radius(id);
  }
  // --ds-radius-action-pressed (12px) times the shape, never rounder than at rest.
  expect(pressed).toEqual({ square: 0, soft: 6, default: 12, round: 18 });
});

test('an exclusive accordion opens one row at a time, by pointer and keyboard; rows without a name are independent', async ({ page }) => {
  await open(page);
  const accordion = page.locator('[data-demo="accordion"]');
  const rows = accordion.locator('details');
  const open0 = () => rows.evaluateAll((list) => list.map((row) => row.open));
  await expect(rows).toHaveCount(3);
  expect(await open0()).toEqual([true, false, false]);
  await rows.nth(1).locator('summary').click();
  await settle(page);
  expect(await open0()).toEqual([false, true, false]);
  // The keyboard, native: a summary is a tab stop, Enter and Space toggle.
  await focusByKeyboard(page, rows.nth(2).locator('summary'));
  await page.keyboard.press('Enter');
  await settle(page);
  expect(await open0()).toEqual([false, false, true]);
  await page.keyboard.press('Space');
  await settle(page);
  expect(await open0()).toEqual([false, false, false]);

  const independent = page.locator('[data-demo="independent"] details');
  await independent.nth(1).locator('summary').click();
  await settle(page);
  expect(await independent.evaluateAll((list) => list.map((row) => row.open))).toEqual([true, true, false]);
});

test('the row that closes plays the same motion as the one that opens: the chevrons turn at once', async ({ page }) => {
  await open(page);
  const rows = page.locator('[data-demo="accordion"] details');
  await settle(page);
  const turned = (index) => rows.nth(index).locator('.ds-chevron').evaluate((el) => getComputedStyle(el).rotate);
  expect(await turned(0)).toBe('180deg');
  await rows.nth(1).locator('summary').click();
  await settle(page);
  expect(await turned(1)).toBe('180deg');
  expect(['none', '0deg']).toContain(await turned(0));
});

test('in a card the rows run to its edges at every density, their text in line with the card\'s', async ({ page }) => {
  await open(page);
  for (const [density, step] of DENSITIES) {
    await add(page, `<section class="ds-card ${density}" id="card"><h3 class="ds-card__title" id="title">Help</h3><div class="ds-disclosure-list">${details('ds-disclosure--row', 'row')}</div></section>`);
    await page.$eval('#row', (el) => { el.open = true; });
    await settle(page);
    const measured = await page.evaluate(() => {
      const card = document.getElementById('card');
      const box = card.getBoundingClientRect();
      const summary = document.querySelector('#row > summary').getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(document.querySelector('#row .ds-disclosure__title'));
      const title = document.createRange();
      title.selectNodeContents(document.getElementById('title'));
      return { left: summary.left - box.left - card.clientLeft, right: box.right - card.clientLeft - summary.right, text: range.getBoundingClientRect().left - title.getBoundingClientRect().left, body: parseFloat(getComputedStyle(document.querySelector('#row .ds-disclosure__body')).paddingLeft) };
    });
    expect(measured.left, density).toBeCloseTo(0, 0);
    expect(measured.right, density).toBeCloseTo(0, 0);
    expect(Math.abs(measured.text), density).toBeLessThan(1);
    expect(measured.body, density).toBe(24 + step * 2);
  }
});

test('names: each summary reads as its text with its expanded state; the chevron is hidden', async ({ page }) => {
  await open(page);
  const summary = page.locator('[data-demo="plain"] > summary');
  await expect(summary).toHaveAccessibleName(/Advanced settings/);
  expect(await summary.locator('svg').getAttribute('aria-hidden')).toBe('true');
  // A ring on keyboard focus, solid from the first frame; a row's is inset.
  await focusByKeyboard(page, summary);
  await settle(page);
  expect(await summary.evaluate((el) => [getComputedStyle(el).outlineStyle, getComputedStyle(el).outlineWidth, getComputedStyle(el).outlineOffset])).toEqual(['solid', '2px', '2px']);
  const row = page.locator('[data-demo="accordion"] summary').first();
  await focusByKeyboard(page, row);
  await settle(page);
  expect(await row.evaluate((el) => getComputedStyle(el).outlineOffset)).toBe('-2px');
});

test('forced colours: no state layer; the ring and the hairlines stay', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const summary = page.locator('[data-demo="plain"] > summary');
  expect(await summary.evaluate((el) => getComputedStyle(el, '::before').display)).toBe('none');
  await focusByKeyboard(page, summary);
  await settle(page);
  expect(await summary.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  const hairline = page.locator('[data-demo="accordion"] details').nth(1);
  expect(await hairline.evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe('solid');
});
