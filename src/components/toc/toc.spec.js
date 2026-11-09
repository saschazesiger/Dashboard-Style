/**
 * Jump links (DS.toc) on their demo: the scroll-spy (aria-current="location"
 * follows the reading line, the end of the scroll marks the last section), a
 * jump (scrolls, focuses the section, marks the link, ds:change, the hash
 * left alone with data-ds-toc-hash="off"), the indicator, the bar (sticky,
 * the current link kept in view), the options (size x density, touch), names
 * and forced colours. Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

const URL = '/test/browser/fixtures/component.html?c=toc';

async function open(page, width = 1280) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(URL);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

const column = (page) => page.getByRole('navigation', { name: 'On this page' });
const bar = (page) => page.getByRole('navigation', { name: 'Sections' });
const current = (nav) => nav.locator('.ds-toc__link[aria-current="location"]');

/** Scrolls a demo box so that the section of `name` (its heading) lies `offset` px below the box's top. */
async function scrollTo(page, box, name, offset = 0) {
  await page.locator(`[data-demo="${box}"]`).evaluate((el, [title, by]) => {
    const heading = [...el.querySelectorAll('h3, h4')].find((each) => each.textContent.trim() === title);
    el.scrollTop += heading.getBoundingClientRect().top - el.getBoundingClientRect().top - by;
  }, [name, offset]);
}

test('scroll-spy: the link of the section past the reading line is the current location, the end of the scroll marks the last', async ({ page }) => {
  await open(page);
  const nav = column(page);
  await expect(current(nav)).toHaveText('Overview');
  await expect(current(nav)).toHaveCount(1);
  await scrollTo(page, 'column-box', 'Network', 10);
  await expect(current(nav)).toHaveText('Network');
  await scrollTo(page, 'column-box', 'Storage', 10);
  await expect(current(nav)).toHaveText('Storage');
  // The end of the scroll: the last section cannot reach the line, but it shows.
  await page.locator('[data-demo="column-box"]').evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await expect(current(nav)).toHaveText('Notes');
  // Back to the top: the first again.
  await page.locator('[data-demo="column-box"]').evaluate((el) => { el.scrollTop = 0; });
  await expect(current(nav)).toHaveText('Overview');
});

test('a jump scrolls its section to the top, marks its link at once, moves the focus there and tells ds:change; the hash stays', async ({ page }) => {
  await open(page);
  const nav = column(page);
  const hash = await page.evaluate(() => location.hash);
  await page.evaluate(() => {
    window.__changes = [];
    document.addEventListener('ds:change', (event) => { if (event.target.matches('.ds-toc')) window.__changes.push([event.detail.id, event.detail.reason]); });
  });
  const link = nav.getByRole('link', { name: 'History' });
  await focusByKeyboard(page, link);
  await page.keyboard.press('Enter');
  await expect(link).toHaveAttribute('aria-current', 'location');
  const heading = page.locator('[data-demo="column-box"] h3', { hasText: 'History' });
  await expect(heading).toBeFocused();
  await expect(heading).toHaveAttribute('tabindex', '-1');
  await expect.poll(() => heading.evaluate((el) => Math.round(el.getBoundingClientRect().top - el.closest('[data-demo]').getBoundingClientRect().top))).toBeLessThan(40);
  await settle(page);
  await expect(link).toHaveAttribute('aria-current', 'location');
  const changes = await page.evaluate(() => window.__changes);
  expect(changes[0][1]).toBe('link');
  expect(changes[0][0]).toBe(await heading.getAttribute('id'));
  expect(await page.evaluate(() => location.hash)).toBe(hash);
  // The keyboard goes on inside the section: the next Tab leaves the heading, not the link.
  expect(await page.evaluate(() => document.activeElement.tagName)).toBe('H3');
});

test('a jump past other sections keeps its own mark the whole way: the sections it glides past never take it', async ({ page }) => {
  await open(page);
  // A short view, so the last section lies more than a view away and the glide passes the others.
  await page.locator('[data-demo="column-box"]').evaluate((el) => { el.style.blockSize = '200px'; });
  await settle(page);
  const nav = column(page);
  const links = nav.locator('.ds-toc__link');
  const last = links.last();
  await page.evaluate(() => {
    window.__changes = [];
    document.addEventListener('ds:change', (event) => { if (event.target.matches('.ds-toc')) window.__changes.push(event.detail.id); });
  });
  // The mark on every frame of the glide, from the click until the scroll has rested.
  await page.evaluate(() => {
    window.__marks = [];
    const nav = document.querySelector('.ds-toc');
    const sample = () => {
      const now = nav.querySelector('.ds-toc__link[aria-current="location"]')?.textContent.trim() ?? '';
      if (window.__marks[window.__marks.length - 1] !== now) window.__marks.push(now);
      window.__sampling = requestAnimationFrame(sample);
    };
    window.__sampling = requestAnimationFrame(sample);
  });
  const name = (await last.textContent()).trim();
  await last.click();
  await expect(last).toHaveAttribute('aria-current', 'location');
  await settle(page);
  await page.waitForTimeout(200);
  const marks = await page.evaluate(() => { cancelAnimationFrame(window.__sampling); return window.__marks.slice(1); });
  expect(marks, 'the marks after the click').toEqual([name]);
  expect(await page.evaluate(() => window.__changes.length), 'one ds:change').toBe(1);
});

test('the indicator lies on the current link: a bar on the column\'s line, under the link in a bar; it glides with the mark', async ({ page }) => {
  await open(page);
  const nav = column(page);
  const geometry = async (scope) => scope.evaluate((el) => {
    const pill = el.querySelector('.ds-toc__indicator');
    const link = el.querySelector('.ds-toc__link[aria-current="location"]');
    const a = pill.getBoundingClientRect();
    const b = link.getBoundingClientRect();
    const style = getComputedStyle(pill);
    return { top: Math.round(a.top - b.top), left: Math.round(a.left - b.left), height: Math.round(a.height - b.height), start: parseFloat(style.borderInlineStartWidth), end: parseFloat(style.borderBlockEndWidth) };
  });
  expect(await geometry(nav)).toEqual({ top: 0, left: 0, height: 0, start: 3, end: 0 });
  await nav.getByRole('link', { name: 'Software' }).click();
  await settle(page);
  expect(await geometry(nav)).toEqual({ top: 0, left: 0, height: 0, start: 3, end: 0 });
  const row = bar(page);
  expect(await geometry(row)).toEqual({ top: 0, left: 0, height: 0, start: 0, end: 3 });
});

test('the bar sticks at the top of its scroller, scrolls sideways without a scrollbar and keeps the current link in view', async ({ page }) => {
  await open(page, 390);
  const row = bar(page);
  await scrollTo(page, 'bar-box', 'Notes', 60);
  await page.locator('[data-demo="bar-box"]').evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await expect(current(row)).toHaveText('Notes');
  await settle(page);
  // The reveal is a smooth scroll of the list, which may still run after the marks settle.
  await expect.poll(() => row.evaluate((el) => {
    const link = el.querySelector('[aria-current="location"]').getBoundingClientRect();
    const rect = el.querySelector('.ds-toc__list').getBoundingClientRect();
    return link.left >= rect.left - 1 && link.right <= rect.right + 1;
  })).toBe(true);
  const look = await row.evaluate((el) => {
    const box = el.closest('[data-demo]').getBoundingClientRect();
    const list = el.querySelector('.ds-toc__list');
    const link = el.querySelector('[aria-current="location"]').getBoundingClientRect();
    const rect = list.getBoundingClientRect();
    return { stuck: Math.round(el.getBoundingClientRect().top - box.top), scrolls: list.scrollWidth > list.clientWidth, bar: getComputedStyle(list).scrollbarWidth, visible: link.left >= rect.left - 1 && link.right <= rect.right + 1, height: el.querySelector('.ds-toc__link').getBoundingClientRect().height };
  });
  expect(look).toEqual({ stuck: 1, scrolls: true, bar: 'none', visible: true, height: 48 });
  // The current link keeps the weight of the others: a change of the scroll-spy moves no link sideways.
  const lefts = () => row.evaluate((el) => [...el.querySelectorAll(':scope > .ds-toc__list > li > .ds-toc__link')].map((link) => [Math.round(link.getBoundingClientRect().left + el.querySelector('.ds-toc__list').scrollLeft), getComputedStyle(link).fontWeight]));
  const before = await lefts();
  await scrollTo(page, 'bar-box', 'Hardware', 60);
  await expect(current(row)).not.toHaveText('Notes');
  expect(await lefts()).toEqual(before);
  // Nested lists stay off the bar.
  await expect(row.getByRole('link', { name: 'Storage' })).toBeHidden();
});

test('options: 8px per size step, 4px per density step, touch as a minimum; the bar from 48px', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(() => {
    const out = [];
    const host = document.querySelector('#fx-component');
    for (const variant of ['', ' ds-toc--bar']) {
      for (const [size, step] of [['ds-xs', -2], ['ds-md', 0], ['ds-xl', 2]]) {
        for (const [density, level] of [['ds-density-comfortable', 0], ['ds-density-tight', -3]]) {
          for (const touch of [false, true]) {
            const nav = document.createElement('nav');
            nav.className = `ds-toc${variant} ${size} ${density}${touch ? ' ds-touch' : ''}`;
            nav.innerHTML = '<ol class="ds-toc__list"><li><a class="ds-toc__link" href="#x">Overview</a></li></ol>';
            host.append(nav);
            const link = nav.querySelector('a');
            out.push({ bar: Boolean(variant), step, level, touch, height: link.getBoundingClientRect().height, line: parseFloat(getComputedStyle(link).lineHeight) + 8, weight: getComputedStyle(link).fontWeight });
            nav.remove();
          }
        }
      }
    }
    return out;
  });
  for (const entry of measured) {
    const base = (entry.bar ? 48 : 32) + entry.step * 8 + entry.level * 4;
    const name = JSON.stringify(entry);
    expect(entry.height, name).toBeCloseTo(Math.max(entry.touch ? 48 : 0, base, entry.bar ? 0 : entry.line), 0);
    expect(entry.weight, name).toBe('400');
  }
});

test('names and roles: a landmark named by its title, a list of links, one current location; counts read with the label', async ({ page }) => {
  await open(page);
  const nav = column(page);
  await expect(nav).toHaveCount(1);
  await expect(nav.getByRole('list').first()).toBeVisible();
  await expect(nav.getByRole('link', { name: /^Software ?, 3$/ })).toHaveCount(1);
  const stops = await nav.getByRole('link').evaluateAll((els) => els.every((el) => el.tabIndex === 0));
  expect(stops).toBe(true);
  expect(await page.locator('.ds-toc__link[aria-current="location"]').count()).toBe(2);
});

test('narrow content: a sticky column sits above the text and stops sticking', async ({ page }) => {
  await open(page, 390);
  const position = await column(page).evaluate((el) => getComputedStyle(el).position);
  expect(position).toBe('static');
});

test('forced colours: the current link SelectedItem, the indicator gone, the line CanvasText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const system = await page.evaluate(() => {
    const probe = (property, value) => {
      const el = document.createElement('span');
      el.style.forcedColorAdjust = 'none';
      el.style[property] = value;
      document.querySelector('.ds-theme').append(el);
      const colour = getComputedStyle(el)[property];
      el.remove();
      return colour;
    };
    return { item: probe('backgroundColor', 'SelectedItem'), text: probe('color', 'SelectedItemText'), line: probe('backgroundColor', 'CanvasText') };
  });
  const link = current(column(page));
  expect(await link.evaluate((el) => ({ background: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color }))).toEqual({ background: system.item, color: system.text });
  expect(await column(page).locator('.ds-toc__indicator').evaluate((el) => getComputedStyle(el).display)).toBe('none');
  expect(await column(page).locator('.ds-toc__list').first().evaluate((el) => getComputedStyle(el, '::before').backgroundColor)).toBe(system.line);
});
