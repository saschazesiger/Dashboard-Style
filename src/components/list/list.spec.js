/**
 * The list on the options model (3.0): the row and the key-value row at
 * every size x density x touch; the shape on the list, its outer rows, the
 * media and a key-value row; the tone on an icon and its 2.x aliases; the
 * parts of a row (media, description, aside); stacked rows; a sticky group
 * heading; the keyboard path and the names of the demo; forced colours.
 * DS.list (3.0): selection by boxes, shift ranges and "select all";
 * single selection; reorder by keys and pointer; the virtual window with
 * selection; facts stacked, in a grid with spans, bordered, and copy per
 * value.
 * The 2.x behaviour stays in test/browser/lists.spec.js. Runs in the
 * `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/component.html?c=list';
const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const TOUCH = 48;

async function open(page) {
  await page.goto(FIXTURE);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

/** Adds markup to the page's theme and returns nothing: the tests read it by id. */
const add = (page, html) => page.evaluate((markup) => {
  const box = document.createElement('div');
  box.innerHTML = markup;
  document.querySelector('#fx-component').prepend(box);
}, html);

test('a row at every size x density: 8px per size, 4px per density from 56px, .ds-touch as a minimum', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const host = document.querySelector('#fx-component');
    const out = [];
    for (const touch of [false, true]) {
      for (const [density] of densities) {
        for (const [size] of sizes) {
          const region = document.createElement('div');
          region.className = `${density} ${size}${touch ? ' ds-touch' : ''}`;
          region.innerHTML = '<ul class="ds-list"><li class="ds-list__item"><span class="ds-list__text"><span class="ds-list__title">One line</span></span></li></ul>'
            + '<ul class="ds-kv-list ds-kv-list--interactive"><li><span>Pad</span></li><li><button class="ds-kv-list__row" type="button"><span>Owner</span><strong>Ada</strong></button></li><li><span>Pad</span></li></ul>'
            + '<ul class="ds-kv-list"><li><span>Pad</span></li><li><span>Owner</span><strong>Ada</strong></li><li><span>Pad</span></li></ul>'
            + '<dl class="ds-facts ds-facts--rows"><div><dt>Pad</dt><dd>x</dd></div><div><dt>Owner</dt><dd>Ada</dd></div><div><dt>Pad</dt><dd>x</dd></div></dl>';
          host.append(region);
          const row = region.querySelector('.ds-list__item');
          const title = getComputedStyle(region.querySelector('.ds-list__title'));
          const opens = region.querySelector('.ds-kv-list__row');
          const opensText = opens.querySelector('span').getBoundingClientRect();
          const opensBox = opens.getBoundingClientRect();
          out.push({
            touch, density, size,
            row: row.getBoundingClientRect().height,
            padY: parseFloat(getComputedStyle(row).paddingBlockStart),
            padX: parseFloat(getComputedStyle(row).paddingInlineStart),
            font: parseFloat(title.fontSize),
            opens: opensBox.height,
            opensGap: [opensText.top - opensBox.top, opensBox.bottom - opensText.bottom],
            kv: region.querySelectorAll('.ds-kv-list')[1].children[1].getBoundingClientRect().height,
            facts: region.querySelector('.ds-facts').children[1].getBoundingClientRect().height,
          });
          region.remove();
        }
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES });
  expect(measured).toHaveLength(SIZES.length * DENSITIES.length * 2);
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const name = `${entry.size} ${entry.density}${entry.touch ? ' touch' : ''}`;
    expect(entry.row, `${name}: row`).toBeCloseTo(Math.max(entry.touch ? TOUCH : 0, 56 + step * 8 + density * 4), 0);
    expect(entry.padY, `${name}: block padding`).toBeCloseTo(Math.max(0, 12 + step * 4 + density * 2), 1);
    expect(entry.padX, `${name}: side padding, density only`).toBeCloseTo(16 + density * 2, 1);
    // A key-value row is one 20px line and its padding; its height never goes below the line.
    const kv = 20 + 2 * Math.max(0, 12 + step * 4 + density * 2);
    expect(entry.kv, `${name}: key-value row`).toBeCloseTo(kv + 1, 0);
    expect(entry.facts, `${name}: fact row`).toBeCloseTo(kv + 1, 0);
    // A row that opens reaches the target through its padding: the line stays centred.
    expect(entry.opens, `${name}: row that opens`).toBeCloseTo(Math.max(entry.touch ? TOUCH : 0, kv), 0);
    expect(Math.abs(entry.opensGap[0] - entry.opensGap[1]), `${name}: its line is centred`).toBeLessThanOrEqual(1);
  }
  // Type changes with size only: caption at xs, chip at sm, label at md, subtitle at lg and xl.
  const fonts = Object.fromEntries(measured.filter((entry) => !entry.touch && entry.density === 'ds-density-comfortable').map((entry) => [entry.size, entry.font]));
  expect(fonts).toEqual({ 'ds-xs': 12, 'ds-sm': 14, 'ds-md': 14, 'ds-lg': 16, 'ds-xl': 16 });
  const dense = measured.filter((entry) => entry.size === 'ds-md' && !entry.touch).map((entry) => entry.font);
  expect(new Set(dense).size, 'density leaves the type alone').toBe(1);
});

test('the shape multiplies the list, its outer rows, the media and a key-value row', async ({ page }) => {
  await open(page);
  const read = (shape) => page.evaluate((cls) => {
    const region = document.createElement('div');
    region.className = cls;
    region.innerHTML = '<ul class="ds-list"><li class="ds-list__item"><span class="ds-list__media" id="m">AL</span><span class="ds-list__media ds-list__media--round" id="r">AL</span><span class="ds-list__text"><span class="ds-list__title">One</span></span></li></ul>'
      + '<ul class="ds-kv-list ds-kv-list--interactive"><li><a class="ds-kv-list__row" href="#x"><span>Owner</span><strong>Ada</strong></a></li></ul>';
    document.querySelector('#fx-component').prepend(region);
    const radius = (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius);
    const out = {
      list: radius(region.querySelector('.ds-list')),
      row: radius(region.querySelector('.ds-list__item')),
      media: radius(region.querySelector('#m')),
      round: radius(region.querySelector('#r')),
      kv: radius(region.querySelector('.ds-kv-list__row')),
    };
    region.remove();
    return out;
  }, shape);
  // --ds-radius-card 12px, --ds-radius-sm 8px; a round media is half its size times the shape, at most half its size.
  expect(await read('ds-shape-square')).toEqual({ list: 0, row: 0, media: 0, round: 0, kv: 0 });
  expect(await read('ds-shape-soft')).toEqual({ list: 6, row: 5, media: 4, round: 10, kv: 4 });
  expect(await read('')).toEqual({ list: 12, row: 11, media: 8, round: 20, kv: 8 });
  expect(await read('ds-shape-round')).toEqual({ list: 18, row: 17, media: 12, round: 20, kv: 12 });
});

test('a tone on the icon colours it, an inherited one does not; the 2.x names stay aliases', async ({ page }) => {
  await open(page);
  await add(page, `<div class="ds-tone-error" id="region"><ul class="ds-kv-list"><li><span>A</span><strong>
    <svg class="ds-kv-list__icon" id="plain" width="16" height="16"></svg>
    <svg class="ds-kv-list__icon ds-tone-success" id="tone" width="16" height="16"></svg>
    <svg class="ds-kv-list__icon ds-kv-list__icon--ok" id="alias-ok" width="16" height="16"></svg>
    <svg class="ds-kv-list__icon ds-tone-warning" id="tone-w" width="16" height="16"></svg>
    <svg class="ds-kv-list__icon ds-kv-list__icon--warning" id="alias-w" width="16" height="16"></svg>
    <svg class="ds-kv-list__icon ds-tone-error" id="tone-e" width="16" height="16"></svg>
    <svg class="ds-kv-list__icon ds-kv-list__icon--error" id="alias-e" width="16" height="16"></svg>
  </strong></li></ul></div>`);
  const colour = (id) => page.$eval(`#${id}`, (el) => getComputedStyle(el).color);
  const quiet = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--ds-text-2)';
    document.querySelector('#fx-component').append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  });
  expect(await colour('plain'), 'an inherited tone does not colour a value').toBe(quiet);
  expect(await colour('tone')).toBe(await colour('alias-ok'));
  expect(await colour('tone-w')).toBe(await colour('alias-w'));
  expect(await colour('tone-e')).toBe(await colour('alias-e'));
  expect(new Set([await colour('tone'), await colour('tone-w'), await colour('tone-e'), quiet]).size).toBe(4);
});

test('a row holds media, title, description, meta, aside and actions; in a narrow list the trailing parts drop', async ({ page }) => {
  await open(page);
  await add(page, `<ul class="ds-list" id="wide" style="inline-size:640px"><li class="ds-list__item">
    <span class="ds-list__media ds-list__media--round" aria-hidden="true">AL</span>
    <span class="ds-list__text"><span class="ds-list__title">Ada Lovelace</span><span class="ds-list__description">Asked for a dock.</span><span class="ds-list__meta">Research</span></span>
    <span class="ds-list__aside">09:12</span>
    <span class="ds-list__actions"><button class="ds-btn ds-btn--quiet ds-sm" type="button">Reply</button></span>
  </li></ul>`);
  const boxes = await page.evaluate(() => {
    const box = (selector) => { const r = document.querySelector(`#wide ${selector}`).getBoundingClientRect(); return { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
    const style = (selector) => getComputedStyle(document.querySelector(`#wide ${selector}`));
    return {
      media: box('.ds-list__media'), text: box('.ds-list__text'), aside: box('.ds-list__aside'), actions: box('.ds-list__actions'), row: box('.ds-list__item'),
      title: box('.ds-list__title'), description: box('.ds-list__description'), meta: box('.ds-list__meta'),
      asideFont: parseFloat(style('.ds-list__aside').fontSize), descriptionFont: parseFloat(style('.ds-list__description').fontSize),
    };
  });
  expect([boxes.media.width, boxes.media.height]).toEqual([40, 40]);
  expect(boxes.text.left).toBeGreaterThan(boxes.media.right);
  expect(boxes.aside.left).toBeGreaterThanOrEqual(boxes.text.right);
  expect(boxes.actions.left).toBeGreaterThanOrEqual(boxes.aside.right);
  expect(boxes.description.top).toBeGreaterThanOrEqual(boxes.title.bottom);
  expect(boxes.meta.top).toBeGreaterThanOrEqual(boxes.description.bottom);
  expect(boxes.asideFont).toBe(12);
  expect(boxes.descriptionFont).toBe(14);
  await page.$eval('#wide', (el) => { el.style.inlineSize = '260px'; });
  const narrow = await page.evaluate(() => {
    const box = (selector) => document.querySelector(`#wide ${selector}`).getBoundingClientRect();
    return { aside: box('.ds-list__aside').top, text: box('.ds-list__text').bottom };
  });
  expect(narrow.aside, 'the aside drops under the text').toBeGreaterThanOrEqual(narrow.text);
});

test('stacked: the trailing parts go under the text in a wide list; the media holds its column', async ({ page }) => {
  await open(page);
  await add(page, `<ul class="ds-list ds-list--stacked" id="stacked" style="inline-size:640px">
    <li class="ds-list__item" id="s1"><span class="ds-list__media" aria-hidden="true">AL</span>
      <span class="ds-list__text"><span class="ds-list__title">Ada Lovelace</span></span>
      <span class="ds-list__aside">09:12</span>
      <span class="ds-list__actions"><button class="ds-btn ds-sm" type="button">Reply</button></span>
    </li>
    <li class="ds-list__item" id="s2"><span class="ds-list__text"><span class="ds-list__title">No media</span></span><span class="ds-list__aside">10:00</span></li>
  </ul>`);
  const read = await page.evaluate(() => {
    const box = (selector) => document.querySelector(selector).getBoundingClientRect();
    const row = box('#s1');
    return {
      media: box('#s1 .ds-list__media'), text: box('#s1 .ds-list__text'), aside: box('#s1 .ds-list__aside'), actions: box('#s1 .ds-list__actions'),
      rowHeight: row.height, rowLeft: row.left,
      noMediaText: box('#s2 .ds-list__text').left, noMediaAside: box('#s2 .ds-list__aside').left, noMediaRow: box('#s2').left,
    };
  });
  expect(read.aside.top).toBeGreaterThanOrEqual(read.text.bottom);
  expect(read.actions.top).toBeGreaterThanOrEqual(read.aside.bottom);
  expect(read.aside.left, 'in the text\'s column').toBeCloseTo(read.text.left, 0);
  expect(read.actions.left, 'in the text\'s column').toBeCloseTo(read.text.left, 0);
  expect(read.text.left).toBeGreaterThan(read.media.right);
  // No stray space from the rows the media spans: padding, one title line, the parts and their 8px.
  const parts = read.actions.bottom - read.text.top;
  expect(read.rowHeight).toBeLessThanOrEqual(parts + 24 + 2);
  // Without media the text starts at the padding.
  expect(read.noMediaText - read.noMediaRow).toBeCloseTo(16, 0);
  expect(read.noMediaAside).toBeCloseTo(read.noMediaText, 0);
});

test('stacked: the ripple of a pressed row lands on the pointer, with and without media', async ({ page }) => {
  await open(page);
  await add(page, `<ul class="ds-list ds-list--interactive ds-list--stacked" style="inline-size:640px">
    <li class="ds-list__item" id="press-media"><span class="ds-list__media" aria-hidden="true">AL</span>
      <span class="ds-list__text"><span class="ds-list__title"><a class="ds-list__action" href="#ada">Ada Lovelace</a></span></span>
      <span class="ds-list__aside">09:12</span>
    </li>
    <li class="ds-list__item" id="press-plain">
      <span class="ds-list__text"><span class="ds-list__title"><a class="ds-list__action" href="#grace">Grace Hopper</a></span></span>
      <span class="ds-list__aside">10:00</span>
    </li>
  </ul>`);
  await page.evaluate(() => { window.DS.ripple.attach(document); });
  for (const id of ['press-media', 'press-plain']) {
    const row = page.locator(`#${id}`);
    const box = await row.boundingBox();
    const [x, y] = [Math.round(box.x + box.width * 0.6), Math.round(box.y + box.height * 0.7)];
    await page.mouse.move(x, y);
    await page.mouse.down();
    const centre = await row.locator('.ds-press-ripple').evaluate((span) => {
      const rect = span.getBoundingClientRect();
      return [rect.left + rect.width / 2, rect.top + rect.height / 2];
    });
    await page.mouse.up();
    await page.mouse.move(1, 1);
    // Within a pixel: the engines round the pointer's coordinates.
    expect(Math.abs(centre[0] - x), `${id}: x`).toBeLessThanOrEqual(1);
    expect(Math.abs(centre[1] - y), `${id}: y`).toBeLessThanOrEqual(1);
  }
});

test('a toned meter in a bars row: the word stands in the row, as the meter is hidden and a figure is no status', async ({ page }) => {
  await open(page);
  const rows = page.locator('[data-demo="bars"] li:has(.ds-meter[class*="ds-tone-"])');
  await expect(rows).not.toHaveCount(0);
  for (const text of await rows.locator('strong').allTextContents()) expect(text).toMatch(/^\d+%, [a-z]+$/);
});

test('a group heading sticks to the top of its scroller, on an opaque fill above the rows', async ({ page }) => {
  await open(page);
  const scroller = page.locator('[data-demo="letters"]');
  const list = scroller.locator('.ds-list');
  await expect(list.locator('.ds-list__group')).toHaveCount(3);
  await scroller.scrollIntoViewIfNeeded();
  await scroller.evaluate((el) => { el.scrollTop = 80; });
  const read = await scroller.evaluate((el) => {
    const top = el.getBoundingClientRect().top + el.clientTop;
    const first = el.querySelector('.ds-list__group');
    const box = first.getBoundingClientRect();
    const style = getComputedStyle(first);
    const under = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return { offset: box.top - top, background: style.backgroundColor, covered: first.contains(under), position: style.position, heading: first.querySelector('.ds-list__heading').tagName, role: first.getAttribute('role') };
  });
  expect(read.position).toBe('sticky');
  expect(read.offset, 'held at the top').toBeCloseTo(0, 0);
  expect(read.covered, 'above the rows that pass under it').toBe(true);
  expect(read.background).not.toBe('rgba(0, 0, 0, 0)');
  expect(read.role).toBe('presentation');
  expect(read.heading).toBe('H4');
});

test('a sticky heading never covers the keyboard focus: going up with Shift+Tab, each action stops below it', async ({ page }) => {
  await open(page);
  const rows = Array.from({ length: 12 }, (_, index) => `<li class="ds-list__item"><span class="ds-list__text"><span class="ds-list__title"><a class="ds-list__action" href="#r${index}" id="r${index}">Row ${index}</a></span></span></li>`).join('');
  const run = async (style, head) => {
    await add(page, `<div id="box" style="max-block-size:200px;overflow:auto;${style}">${head}<ul class="ds-list ds-list--interactive" role="list"><li class="ds-list__group" role="presentation"><h4 class="ds-list__heading">A</h4></li>${rows}</ul></div>`);
    await page.locator('#r11').focus();
    for (let index = 10; index >= 0; index -= 1) {
      await page.keyboard.press('Shift+Tab');
      // The box scrolls the focus into view; read once it has held still for two frames (a busy engine takes longer).
      await page.evaluate(() => new Promise((resolve) => {
        const box = document.getElementById('box');
        let last = -1;
        let still = 0;
        const frame = () => {
          still = box.scrollTop === last ? still + 1 : 0;
          last = box.scrollTop;
          if (still >= 2) resolve();
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }));
      const read = await page.evaluate(() => {
        const action = document.activeElement;
        const group = document.querySelector('#box .ds-list__group');
        const box = action.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return { id: action.id, gap: box.top - group.getBoundingClientRect().bottom, covered: group.contains(hit) };
      });
      expect(read.id).toBe(`r${index}`);
      expect(read.covered, `r${index}: under the heading`).toBe(false);
      expect(read.gap, `r${index}: clear of the heading`).toBeGreaterThanOrEqual(0);
    }
    await page.locator('#box').evaluate((el) => el.parentElement.remove());
  };
  await run('', '');
  // Under a sticky page head the heading stands lower, and the focus stops lower with it.
  await run('--ds-list-group-top:32px', '<div style="position:sticky;inset-block-start:0;block-size:32px"></div>');
});

test('facts above tiles: the second fact starts where the third tile does, at every density', async ({ page }) => {
  await open(page);
  const read = await page.evaluate((densities) => densities.map(([density]) => {
    const region = document.createElement('div');
    region.className = density;
    region.style.inlineSize = '1000px';
    region.innerHTML = '<section class="ds-card"><dl class="ds-facts"><div><dt>Owner</dt><dd>Ada</dd></div><div id="second"><dt>Place</dt><dd>Lab</dd></div></dl>'
      + '<div class="ds-tiles">' + '<div class="ds-tile"><p class="ds-tile__value">1</p></div>'.repeat(4) + '</div></section>';
    document.querySelector('#fx-component').prepend(region);
    const out = { density, second: region.querySelector('#second').getBoundingClientRect().left, third: region.querySelectorAll('.ds-tile')[2].getBoundingClientRect().left };
    region.remove();
    return out;
  }), DENSITIES);
  for (const entry of read) expect(Math.abs(entry.second - entry.third), entry.density).toBeLessThanOrEqual(0.5);
});

test('keyboard and names: Tab reaches each action and rings its row; Enter opens; the row controls are named', async ({ page }) => {
  await open(page);
  const rows = page.locator('[data-demo="rows"]');
  await expect(rows).toHaveAttribute('aria-label', 'Devices');
  const first = rows.locator('.ds-list__action').first();
  await focusByKeyboard(page, first);
  await expect(first).toBeFocused();
  const ring = await first.evaluate((el) => {
    const style = getComputedStyle(el.closest('.ds-list__item'));
    return { outline: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  expect(ring).toEqual({ outline: 'solid', width: 2 });
  await page.keyboard.press('Tab');
  await expect(rows.getByRole('button', { name: 'More for LAPTOP-0042' })).toBeFocused();
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(rows.locator('.ds-list__action[aria-current="true"]')).toHaveText('LAPTOP-0042');
  await settle(page);
  // A blocked action stays focusable, so its tip can say why, and opens nothing.
  const blocked = rows.locator('.ds-list__action[aria-disabled="true"]');
  await blocked.focus();
  await expect(blocked).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(rows.locator('.ds-list__action[aria-current="true"]')).toHaveText('LAPTOP-0042');
  // A key-value row that opens is a control of its own.
  const kv = page.locator('[data-demo="kv"]').getByRole('button', { name: /Tickets/ });
  await focusByKeyboard(page, kv);
  await expect(kv).toBeFocused();
  // The lock is an image with its reason; the sr word says the tone.
  await expect(page.getByRole('img', { name: 'Set by the directory sync' })).toBeVisible();
  await expect(page.locator('[data-demo="kv"] .ds-sr').first()).toHaveText('Passed:');
});

test('forced colours: the current row is SelectedItem, its parts in the same ink; the media on Canvas with an edge, in that row too; a blocked key-value row GrayText', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  await add(page, `<ul class="ds-list" id="fc"><li class="ds-list__item" aria-current="true">
    <span class="ds-list__media" aria-hidden="true">AL</span>
    <span class="ds-list__text"><span class="ds-list__title">Ada</span><span class="ds-list__description">Text</span><span class="ds-list__meta">Meta</span></span>
    <span class="ds-list__aside">09:12</span>
    </li><li class="ds-list__item" id="plain"><span class="ds-list__media" aria-hidden="true">GH</span></li></ul>`);
  const system = await page.evaluate(() => {
    const probe = (property, value) => {
      const el = document.createElement('span');
      el.style.forcedColorAdjust = 'none';
      el.style[property] = value;
      document.querySelector('#fx-component').append(el);
      const colour = getComputedStyle(el)[property];
      el.remove();
      return colour;
    };
    return { selected: probe('backgroundColor', 'SelectedItem'), selectedText: probe('color', 'SelectedItemText'), gray: probe('color', 'GrayText'), canvas: probe('backgroundColor', 'Canvas'), canvasText: probe('color', 'CanvasText') };
  });
  const row = await page.$eval('#fc .ds-list__item', (el) => ({
    background: getComputedStyle(el).backgroundColor,
    inks: ['.ds-list__title', '.ds-list__description', '.ds-list__meta', '.ds-list__aside'].map((s) => getComputedStyle(el.querySelector(s)).color),
  }));
  expect(row.background).toBe(system.selected);
  for (const ink of row.inks) expect(ink).toBe(system.selectedText);
  // The row's forced-color-adjust: none must not reach the media: palette fill, selection ink and no edge read 1.2:1.
  for (const selector of ['#plain .ds-list__media', '#fc [aria-current] .ds-list__media']) {
    const media = await page.$eval(selector, (el) => {
      const style = getComputedStyle(el);
      return { width: parseFloat(style.borderTopWidth), edge: style.borderTopColor, background: style.backgroundColor, ink: style.color };
    });
    expect(media.width, selector).toBe(1);
    expect(media.edge, selector).toBe(system.canvasText);
    expect(media.background, selector).toBe(system.canvas);
    expect(media.ink, selector).toBe(system.canvasText);
  }
  const blocked = await page.locator('[data-demo="kv"] .ds-kv-list__row[aria-disabled="true"]').evaluate((el) => getComputedStyle(el).color);
  expect(blocked).toBe(system.gray);
});

/* ── DS.list (3.0) ─────────────────────────────────────────── */

const titles = (locator) => locator.locator('.ds-list__item .ds-list__title').allTextContents();

test('select: a box or a press on the row checks it, the row tints and keeps its box; Shift checks a range; ds:change tells the keys', async ({ page }) => {
  await open(page);
  const list = page.locator('[data-demo="select"]');
  await list.evaluate((el) => { window.__changes = []; el.addEventListener('ds:change', (event) => window.__changes.push(event.detail.keys)); });
  const rows = list.locator('.ds-list__item');
  await rows.nth(0).locator('.ds-list__title').click();
  await expect(rows.nth(0).locator('.ds-list__check')).toBeChecked();
  await settle(page);
  const tint = await rows.nth(0).evaluate((row) => getComputedStyle(row).backgroundColor);
  const accent = await page.evaluate(() => { const el = document.createElement('span'); el.style.color = 'var(--ds-accent)'; document.querySelector('#fx-component').append(el); const c = getComputedStyle(el).color; el.remove(); return c; });
  expect(tint).toBe(accent);
  // Shift and a click on a box: the range, past the disabled row.
  await rows.nth(4).locator('.ds-list__check').click({ modifiers: ['Shift'] });
  for (const index of [0, 1, 2, 4]) await expect(rows.nth(index).locator('.ds-list__check')).toBeChecked();
  await expect(rows.nth(3).locator('.ds-list__check')).not.toBeChecked();
  expect(await list.evaluate((el) => DS.list.create(el).get())).toEqual(['t41', 't42', 't43', 't45']);
  expect(await page.evaluate(() => window.__changes.at(-1))).toEqual(['t41', 't42', 't43', 't45']);
  await expect(page.locator('[data-demo="picked"]')).toHaveText('4 selected');
  // The all box: checked, since every row that can be is.
  const all = page.locator('[data-demo="all"]');
  await expect(all).toBeChecked();
  await rows.nth(1).locator('.ds-list__check').click();
  await expect(all).not.toBeChecked();
  expect(await all.evaluate((box) => box.indeterminate)).toBe(true);
  await all.click();
  expect(await list.evaluate((el) => DS.list.create(el).get())).toEqual(['t41', 't42', 't43', 't45']);
  await all.click();
  expect(await list.evaluate((el) => DS.list.create(el).get())).toEqual([]);
  expect(await all.evaluate((box) => box.indeterminate)).toBe(false);
  // The keyboard: Space on a box.
  await focusByKeyboard(page, rows.nth(2).locator('.ds-list__check'));
  await page.keyboard.press('Space');
  expect(await list.evaluate((el) => DS.list.create(el).get())).toEqual(['t43']);
  // set() from the page.
  await list.evaluate((el) => DS.list.create(el).set(['t45']));
  await expect(rows.nth(4).locator('.ds-list__check')).toBeChecked();
  await expect(rows.nth(2).locator('.ds-list__check')).not.toBeChecked();
});

test('single: radios choose one, a press on another row moves it', async ({ page }) => {
  await open(page);
  const list = page.locator('[data-demo="single"]');
  const rows = list.locator('.ds-list__item');
  await rows.nth(1).locator('.ds-list__title').click();
  expect(await list.evaluate((el) => DS.list.create(el).get())).toBe('t42');
  await rows.nth(2).locator('.ds-list__check').click();
  expect(await list.evaluate((el) => DS.list.create(el).get())).toBe('t43');
  await expect(rows.nth(1).locator('.ds-list__check')).not.toBeChecked();
});

test('reorder: each row gets a named grip; Space lifts, the arrows move, Space drops; ds:drop tells the place', async ({ page }) => {
  await open(page);
  const list = page.locator('[data-demo="reorder-list"]');
  await expect(list.getByRole('button', { name: 'Move Building A' })).toHaveCount(1);
  await expect(list.locator('.ds-list__grip')).toHaveCount(4);
  await list.evaluate((el) => el.addEventListener('ds:drop', (event) => { window.__drop = event.detail.to.index; }));
  await focusByKeyboard(page, list.getByRole('button', { name: 'Move Building A' }));
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await settle(page);
  expect(await titles(list)).toEqual(['Building B', 'Lab', 'Building A', 'Storage']);
  expect(await page.evaluate(() => window.__drop)).toBe(2);
  // By pointer: Storage to the top.
  const grip = list.getByRole('button', { name: 'Move Storage' });
  await list.scrollIntoViewIfNeeded();
  const from = await grip.boundingBox();
  const top = await list.locator('.ds-list__item').first().boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  // In small steps, so a busy engine sees the drag pass every row.
  await page.mouse.move(from.x + from.width / 2, from.y - 10, { steps: 6 });
  await page.mouse.move(from.x + from.width / 2, top.y - 8, { steps: 32 });
  await page.mouse.up();
  await settle(page);
  await expect.poll(async () => (await titles(list))[0]).toBe('Storage');
});

test('virtual: only rows near the viewport exist, keyed and counted; the arrows walk; Space checks; the selection survives scrolling', async ({ page }) => {
  await open(page);
  const list = page.locator('[data-demo="virtual"]');
  const count = await list.locator('.ds-list__item').count();
  expect(count).toBeGreaterThan(3);
  expect(count).toBeLessThan(40);
  await expect(list.locator('.ds-list__item').first()).toHaveAttribute('aria-setsize', '5000');
  const first = list.locator('.ds-list__item').first();
  await focusByKeyboard(page, first);
  // An inset ring on the focused row.
  expect(await first.evaluate((row) => getComputedStyle(row).outlineStyle)).not.toBe('none');
  // A listbox of options: the focused row says its state (its box is inert, out of the tab order and the tree).
  await expect(list).toHaveAttribute('role', 'listbox');
  await expect(list).toHaveAttribute('aria-multiselectable', 'true');
  await expect(first).toHaveAttribute('role', 'option');
  await expect(first).toHaveAttribute('aria-selected', 'false');
  expect(await first.locator('.ds-list__check').evaluate((box) => box.inert)).toBe(true);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  expect(await list.evaluate((el) => DS.list.create(el).get())).toEqual(['v0002']);
  await expect(page.locator('[data-demo="virtual-out"]')).toHaveText('5,000 devices, 1 selected');
  await expect(list.locator('[data-ds-key="v0002"]')).toBeFocused();
  await expect(page.getByRole('option', { name: /DEVICE-0002/, selected: true })).toBeFocused();
  await expect(list.locator('[data-ds-key="v0001"]')).toHaveAttribute('aria-selected', 'false');
  // A press on the (inert) box reaches the row, which toggles it.
  await list.locator('[data-ds-key="v0003"] .ds-list__check').click({ force: true });
  await expect(list.locator('[data-ds-key="v0003"]')).toHaveAttribute('aria-selected', 'true');
  await list.locator('[data-ds-key="v0003"] .ds-list__check').click({ force: true });
  await expect(list.locator('[data-ds-key="v0003"]')).toHaveAttribute('aria-selected', 'false');
  await page.keyboard.press('End');
  await expect(list.locator('[data-ds-key="v5000"]')).toBeFocused();
  await expect(list.locator('[data-ds-key="v0002"]')).toHaveCount(0);
  await page.keyboard.press('Home');
  await expect(list.locator('[data-ds-key="v0002"] .ds-list__check')).toBeChecked();
  // Select all through the API: every key, rendered or not.
  await list.evaluate((el) => DS.list.create(el).set(['v4999', 'v0001']));
  await expect(list.locator('[data-ds-key="v0001"] .ds-list__check')).toBeChecked();
  await expect(list.locator('[data-ds-key="v0002"] .ds-list__check')).not.toBeChecked();
  await expect(list.locator('[data-ds-key="v0001"]')).toHaveAttribute('aria-selected', 'true');
  // destroy() gives the page its roles back.
  await list.evaluate((el) => DS.list.create(el).destroy());
  await expect(list).not.toHaveAttribute('role', /.*/);
  await expect(list.locator('[data-ds-key="v0001"]')).not.toHaveAttribute('role', /.*/);
  expect(await list.locator('[data-ds-key="v0001"] .ds-list__check').evaluate((box) => box.inert)).toBe(false);
});

test('facts: stacked is one column, a grid spans wide and full facts (one column where one fits), bordered cells frame them', async ({ page }) => {
  await open(page);
  const grid = page.locator('[data-demo="grid"]');
  const boxes = await grid.evaluate((dl) => [...dl.children].map((div) => { const r = div.getBoundingClientRect(); return { cls: div.className, w: r.width, x: r.x }; }));
  const single = boxes.find((box) => !box.cls).w;
  const wide = boxes.find((box) => box.cls === 'ds-facts__wide').w;
  const full = boxes.find((box) => box.cls === 'ds-facts__full').w;
  expect(wide).toBeGreaterThan(single * 1.9);
  expect(full).toBeCloseTo(await grid.evaluate((dl) => dl.clientWidth), -1);
  expect(await grid.evaluate((dl) => getComputedStyle(dl).borderTopStyle)).toBe('solid');
  expect(await grid.evaluate((dl) => getComputedStyle(dl.firstElementChild).borderInlineEndStyle)).toBe('solid');
  // Narrow: one column, the wide fact in it.
  await grid.evaluate((dl) => { dl.style.width = '360px'; });
  const narrow = await grid.evaluate((dl) => [...dl.children].map((div) => div.getBoundingClientRect().width));
  for (const width of narrow) expect(width).toBeCloseTo(narrow[0], 0);
  expect(await grid.evaluate((dl) => dl.scrollWidth <= dl.clientWidth + 1)).toBe(true);
  const stacked = await page.locator('.ds-facts--stacked').first().evaluate((dl) => getComputedStyle(dl).gridTemplateColumns.split(' ').length);
  expect(stacked).toBe(1);
});

test('facts: a copy button per value, named by its label, copies the value without the button; the check shows; nocopy leaves one out', async ({ page }) => {
  await page.addInitScript(() => {
    window.__copied = [];
    const clipboard = { writeText: (text) => { window.__copied.push(text); return Promise.resolve(); } };
    Object.defineProperty(navigator, 'clipboard', { configurable: true, get: () => clipboard });
  });
  await open(page);
  const grid = page.locator('[data-demo="grid"]');
  await expect(grid.locator('.ds-facts__copy')).toHaveCount(5);
  await expect(grid.locator('[data-ds-facts-nocopy] .ds-facts__copy')).toHaveCount(0);
  const button = grid.getByRole('button', { name: 'Copy Serial' });
  // At rest it waits; on the fact under the pointer it shows.
  if (await page.evaluate(() => matchMedia('(hover: hover)').matches)) {
    await settle(page);
    await expect(button).toHaveCSS('opacity', '0');
  }
  await button.hover();
  await settle(page);
  await expect(button).toHaveCSS('opacity', '1');
  await button.click();
  await expect.poll(() => page.evaluate(() => window.__copied.at(-1))).toBe('5CD1234XYZ');
  await expect(button).toHaveAttribute('data-state', 'copied');
  await expect(button).not.toHaveAttribute('data-state', 'copied', { timeout: 5000 });
  // Keyboard: Tab reaches it, and it shows while focused.
  await focusByKeyboard(page, grid.getByRole('button', { name: 'Copy Model' }));
  await settle(page);
  await expect(grid.getByRole('button', { name: 'Copy Model' })).toHaveCSS('opacity', '1');
});
