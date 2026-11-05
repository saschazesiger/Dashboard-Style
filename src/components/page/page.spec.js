/**
 * The page on the options model (3.0), on its demo: the page's own rhythm
 * does not follow density or size, the head's actions line up with the
 * button's computed height at every option; the details row (a label over its
 * value, wrapping, printed); the tabs row of the head; empty parts take no
 * room; breadcrumbs (type by size, the touch minimum, keyboard, the parent at
 * 600px); names; forced colours. The 2.x behaviour stays in
 * test/browser/page.spec.js. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

const URL = '/test/browser/fixtures/component.html?c=page';

async function open(page) {
  await page.goto(URL);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

// The record's head of the first section (the sticky and the folding heads below have the same parts).
const HEAD = '.ds-page-head:not(.ds-page-head--sticky, [data-ds-page-head]):has(.ds-page-head__details dd)';

test('the head\'s actions centre on the title line at every size and density', async ({ page }) => {
  await open(page);
  for (const classes of ['', 'ds-sm', 'ds-lg', 'ds-density-compact', 'ds-density-tight', 'ds-lg ds-density-dense', 'ds-touch']) {
    const result = await page.$eval(HEAD, (head, names) => {
      head.className = `ds-page-head ${names}`;
      const title = head.querySelector('.ds-page-head__title').getBoundingClientRect();
      const button = head.querySelector('.ds-page-head__actions .ds-btn').getBoundingClientRect();
      return { title: title.top + title.height / 2, button: button.top + button.height / 2 };
    }, classes);
    expect(Math.abs(result.title - result.button), `"${classes}"`).toBeLessThanOrEqual(1);
  }
});

test('the page\'s own rhythm stays: density and size change the controls inside, not its padding or gaps', async ({ page }) => {
  await open(page);
  const read = () => page.evaluate(() => {
    const content = document.querySelector('#page-rhythm');
    const inner = content.querySelector('.ds-page');
    return { pad: getComputedStyle(content).paddingTop, gap: getComputedStyle(inner).rowGap, button: content.querySelector('.ds-btn').getBoundingClientRect().height };
  });
  await page.evaluate(() => {
    const content = document.createElement('div');
    content.className = 'ds-content';
    content.id = 'page-rhythm';
    content.innerHTML = '<div class="ds-page"><p>One</p><button class="ds-btn" type="button">Add</button></div>';
    document.querySelector('#fx-component').append(content);
  });
  const before = await read();
  await page.$eval('#page-rhythm', (el) => el.classList.add('ds-density-tight'));
  const after = await read();
  expect(after.pad).toBe(before.pad);
  expect(after.gap).toBe(before.gap);
  expect(after.button).toBe(before.button - 12);
});

test('the details row: a label over its value, tabular figures, wrapping; it prints, the actions do not', async ({ page }) => {
  await open(page);
  const details = page.locator(`${HEAD} .ds-page-head__details`);
  const first = await details.locator('.ds-page-head__detail').first().evaluate((el) => {
    const term = el.querySelector('dt');
    const value = el.querySelector('dd');
    return {
      under: value.getBoundingClientRect().top >= term.getBoundingClientRect().bottom - 1,
      termFont: parseFloat(getComputedStyle(term).fontSize),
      valueFont: parseFloat(getComputedStyle(value).fontSize),
      margin: getComputedStyle(value).marginInlineStart,
      numeric: getComputedStyle(value).fontVariantNumeric,
    };
  });
  expect(first).toEqual({ under: true, termFont: 12, valueFont: 14, margin: '0px', numeric: 'tabular-nums' });
  await details.evaluate((el) => { el.style.inlineSize = '200px'; });
  const rows = await details.locator('.ds-page-head__detail').evaluateAll((els) => new Set(els.map((el) => Math.round(el.getBoundingClientRect().top))).size);
  expect(rows).toBeGreaterThan(1);
  await details.evaluate((el) => { el.style.inlineSize = ''; });
  await page.emulateMedia({ media: 'print' });
  await expect(details).toBeVisible();
  await expect(page.locator(`${HEAD} .ds-page-head__actions`)).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
});

test('the tabs row is the head\'s last row, with its indicator on the current link', async ({ page }) => {
  await open(page);
  const tabs = page.locator(`${HEAD} .ds-page-head__tabs`);
  const geometry = await tabs.evaluate((el) => {
    const head = el.parentElement;
    const details = head.querySelector('.ds-page-head__details');
    return { last: head.lastElementChild === el, gap: el.getBoundingClientRect().top - details.getBoundingClientRect().bottom };
  });
  expect(geometry.last).toBe(true);
  expect(geometry.gap).toBe(4 + 12);
  const links = page.getByRole('navigation', { name: 'LAPTOP-0042' }).first().getByRole('link');
  await expect(links).toHaveCount(3);
  await links.nth(1).click();
  await expect(links.nth(1)).toHaveAttribute('aria-current', 'page');
  await settle(page);
  const landed = await tabs.evaluate((el) => {
    const pill = el.querySelector('.ds-tabs__indicator').getBoundingClientRect();
    const link = el.querySelector('[aria-current="page"]').getBoundingClientRect();
    return Math.abs(pill.left - link.left);
  });
  expect(landed).toBeLessThan(1);
});

test('empty parts take no room: lead, status, actions, details and tabs', async ({ page }) => {
  await open(page);
  const head = page.locator('.ds-page-head', { hasText: 'No status yet' });
  for (const part of ['lead', 'status', 'actions', 'details', 'tabs']) {
    expect(await head.locator(`.ds-page-head__${part}`).evaluate((el) => getComputedStyle(el).display), part).toBe('none');
  }
});

test('breadcrumbs: type by size at any ancestor, the touch minimum, the parent alone at 600px of the content', async ({ page }) => {
  await open(page);
  const crumbs = page.locator('.ds-breadcrumbs');
  const link = crumbs.locator('a').first();
  const font = () => link.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(await font()).toBe(14);
  await crumbs.evaluate((el) => el.classList.add('ds-xs'));
  expect(await font()).toBe(12);
  await crumbs.evaluate((el) => el.classList.remove('ds-xs'));
  const before = await link.evaluate((el) => el.getBoundingClientRect().height);
  expect(before).toBeLessThan(48);
  await crumbs.evaluate((el) => el.classList.add('ds-touch'));
  expect(await link.evaluate((el) => el.getBoundingClientRect().height)).toBe(48);
  // The text stays on the link's centre.
  const centred = await link.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const text = range.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    return Math.abs((text.top + text.height / 2) - (box.top + box.height / 2));
  });
  expect(centred).toBeLessThan(2);
  await crumbs.evaluate((el) => el.classList.remove('ds-touch'));

  const narrow = await page.$eval('.ds-breadcrumbs', (el) => {
    const wrap = document.createElement('div');
    wrap.className = 'ds-content';
    wrap.style.inlineSize = '400px';
    wrap.append(el.cloneNode(true));
    document.querySelector('#fx-component').append(wrap);
    const shown = [...wrap.querySelectorAll('li')].filter((item) => getComputedStyle(item).display !== 'none').map((item) => item.textContent);
    wrap.remove();
    return shown;
  });
  expect(narrow).toEqual(['Devices']);
});

test('keyboard and names: the back link reads its target, breadcrumbs are stops with the link ring, the page is marked', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('region', { name: 'A record\'s head' }).getByRole('link', { name: 'Back to Devices', exact: true })).toHaveCount(1);
  const nav = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(nav.getByRole('link', { name: 'LAPTOP-0042' })).toHaveAttribute('aria-current', 'page');
  const first = nav.getByRole('link').first();
  await focusByKeyboard(page, first);
  await expect(first).toBeFocused();
  expect(await first.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  await page.keyboard.press('Tab');
  await expect(nav.getByRole('link').nth(1)).toBeFocused();
});

test('forced colours: the breadcrumb chevrons paint in CanvasText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const colours = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.forcedColorAdjust = 'none';
    probe.style.backgroundColor = 'CanvasText';
    document.querySelector('.ds-theme').append(probe);
    const text = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return { text, chevron: getComputedStyle(document.querySelector('.ds-breadcrumbs li + li'), '::before').backgroundColor };
  });
  expect(colours.chevron).toBe(colours.text);
});

test('a sticky head condenses once its fold has scrolled past, keeps the content in place, and unfolds at the top', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const box = page.locator('[data-demo="sticky-box"]');
  const head = box.locator('.ds-page-head');
  await expect(head).not.toHaveAttribute('data-scrolled');
  await page.evaluate(() => {
    window.__condensed = [];
    document.addEventListener('ds:change', (event) => { if (event.target.matches('.ds-page-head')) window.__condensed.push(event.detail.condensed); });
  });
  const card = box.locator('.ds-card').nth(1);
  // A little scroll: still whole (what folds has not scrolled past yet).
  await box.evaluate((el) => { el.scrollTop = 20; });
  await page.waitForTimeout(100);
  await expect(head).not.toHaveAttribute('data-scrolled');
  // Far enough: condensed, and the card did not move on screen by the change.
  await box.evaluate((el) => { el.scrollTop = 400; });
  await expect(head).toHaveAttribute('data-scrolled', '');
  const look = await head.evaluate((el) => ({
    lead: getComputedStyle(el.querySelector('.ds-page-head__lead')).display,
    details: getComputedStyle(el.querySelector('.ds-page-head__details')).display,
    back: getComputedStyle(el.querySelector('.ds-page-head__back')).display,
    title: parseFloat(getComputedStyle(el.querySelector('.ds-page-head__title')).fontSize),
    tabs: getComputedStyle(el.querySelector('.ds-page-head__tabs')).display,
    stuck: Math.round(el.getBoundingClientRect().top - el.parentElement.getBoundingClientRect().top),
    line: getComputedStyle(el, '::after').opacity,
  }));
  expect(look).toMatchObject({ lead: 'none', details: 'none', back: 'none', tabs: 'block', stuck: 1 });
  expect(look.title).toBeLessThan(28);
  await expect.poll(() => head.evaluate((el) => getComputedStyle(el, '::after').opacity)).toBe('1');
  // The content stays in place while the head changes: scroll by a step and the card moves by that step only.
  const before = await card.evaluate((el) => el.getBoundingClientRect().top);
  await box.evaluate((el) => { el.scrollTop -= 10; });
  await page.waitForTimeout(100);
  const after = await card.evaluate((el) => el.getBoundingClientRect().top);
  expect(Math.round(after - before)).toBe(10);
  // Back at the top: whole again; the scroll stays where the reader put it.
  await box.evaluate((el) => { el.scrollTop = 0; });
  await expect(head).not.toHaveAttribute('data-scrolled');
  await page.waitForTimeout(100);
  expect(await box.evaluate((el) => el.scrollTop)).toBe(0);
  expect(await page.evaluate(() => window.__condensed)).toEqual([true, false]);
});

test('the condensing keeps the content where it was: no jump at the moment the head folds', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const box = page.locator('[data-demo="sticky-box"]');
  const head = box.locator('.ds-page-head');
  const card = box.locator('.ds-card').nth(2);
  // Step down a few px at a time; at each step the card moves by the step, the fold included.
  let last = await card.evaluate((el) => el.getBoundingClientRect().top);
  let folded = false;
  for (let step = 0; step < 60 && !folded; step += 1) {
    await box.evaluate((el) => { el.scrollTop += 8; });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const top = await card.evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.abs(last - top - 8), `step ${step}`).toBeLessThanOrEqual(1);
    last = top;
    folded = await head.evaluate((el) => el.hasAttribute('data-scrolled'));
  }
  expect(folded).toBe(true);
});

test('actions fold into More by the row\'s width: the first ones first, the filled one last; the menu presses them', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await open(page);
  const head = page.locator('[data-demo="folding"]');
  const more = head.locator('.ds-page-head__more');
  await expect(more).toBeVisible();
  await expect(more).toHaveAccessibleName('More actions');
  await expect(head.getByRole('button', { name: 'Duplicate' })).toBeHidden();
  await expect(head.getByRole('button', { name: 'Edit' })).toBeVisible();
  const fits = await head.evaluate((el) => {
    const row = el.querySelector('.ds-page-head__row').getBoundingClientRect();
    return [...el.querySelectorAll('.ds-page-head__actions > :not([hidden])')].every((part) => part.getBoundingClientRect().right <= row.right + 0.5);
  });
  expect(fits).toBe(true);

  await focusByKeyboard(page, more);
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu', { name: 'More actions' });
  await expect(menu).toBeVisible();
  const items = menu.getByRole('menuitem');
  const names = await items.allTextContents();
  expect(names[0]).toBe('Duplicate');
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(more).toBeFocused();

  // An item presses its action.
  await page.evaluate(() => {
    window.__pressed = 0;
    document.querySelector('[data-demo="folding"] .ds-page-head__actions > button').addEventListener('click', () => { window.__pressed += 1; });
  });
  await more.click();
  await menu.getByRole('menuitem', { name: 'Duplicate' }).click();
  await expect(menu).toBeHidden();
  expect(await page.evaluate(() => window.__pressed)).toBe(1);

  // Narrower: more fold, Edit (filled) stays; blocked stays blocked in the menu.
  await head.evaluate((el) => { el.parentElement.style.inlineSize = '200px'; });
  await expect(head.getByRole('button', { name: 'Retire' })).toBeHidden();
  await expect(head.getByRole('button', { name: 'Edit' })).toBeVisible();
  await more.click();
  await expect(menu.getByRole('menuitem', { name: 'Retire' })).toHaveAttribute('aria-disabled', 'true');
  await expect(menu.getByRole('menuitem', { name: 'Export' })).toHaveAttribute('href', '#');
  await page.keyboard.press('Escape');

  // Wide: everything back, More gone.
  await head.evaluate((el) => { el.parentElement.style.inlineSize = '1000px'; });
  await expect(more).toBeHidden();
  await expect(head.getByRole('button', { name: 'Duplicate' })).toBeVisible();
});

test('touch: the More button is a finger\'s target; a phone keeps every action reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await open(page);
  const head = page.locator('[data-demo="sticky"]');
  await head.evaluate((el) => el.classList.add('ds-touch'));
  const more = head.locator('.ds-page-head__more');
  await expect(more).toBeVisible();
  expect(await more.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(48);
  const right = await head.evaluate((el) => Math.max(...[...el.querySelectorAll('.ds-page-head__actions > :not([hidden])')].map((part) => part.getBoundingClientRect().right)));
  expect(right).toBeLessThanOrEqual(390);
});

test('forced colours: the hairline under a sticky head is CanvasText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const colours = await page.locator('[data-demo="sticky"]').evaluate((el) => {
    const probe = document.createElement('span');
    probe.style.forcedColorAdjust = 'none';
    probe.style.backgroundColor = 'CanvasText';
    document.body.append(probe);
    const want = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return { want, got: getComputedStyle(el, '::after').backgroundColor };
  });
  expect(colours.got).toBe(colours.want);
});
