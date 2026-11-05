/**
 * Prose and code on the options model (3.0), on their demo: density (the gap
 * and the padding of blocks, the text stays), shape (every radius), the
 * compact mode for chat, task lists from a renderer's bare markup, callouts
 * in each tone with their word, footnotes with their links, heading
 * anchors, inline code, kbd and mark, the code block's keyboard and names; a component inside prose keeps its look; forced colours. Runs in
 * the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];

async function open(page) {
  await page.goto('/test/browser/fixtures/component.html?c=prose');
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

const SAMPLE = '<h2 id="h2">Heading</h2><p id="p1">One</p><p id="p2">Two</p><blockquote id="quote">Quote</blockquote><pre id="pre"><code>code</code></pre><div class="ds-prose__callout" id="callout"><p>Note</p></div><table><tbody><tr><td id="cell">1</td></tr></tbody></table>';

const metrics = (page) => page.evaluate(() => {
  const value = (id, property) => parseFloat(getComputedStyle(document.getElementById(id))[property]);
  return {
    gap: document.getElementById('p2').getBoundingClientRect().top - document.getElementById('p1').getBoundingClientRect().bottom,
    quote: value('quote', 'paddingLeft'),
    pre: value('pre', 'paddingLeft'),
    callout: value('callout', 'paddingLeft'),
    cell: value('cell', 'paddingLeft'),
    font: value('p1', 'fontSize'),
    heading: value('h2', 'fontSize'),
  };
});

test('density: 1px off the gap and 2px off the padding of blocks per step; the text stays', async ({ page }) => {
  await open(page);
  for (const [density, step] of DENSITIES) {
    await add(page, `<div class="ds-prose ${density}">${SAMPLE}</div>`);
    const measured = await metrics(page);
    expect(measured.gap, density).toBeCloseTo(8 + step, 0);
    expect(measured.quote, density).toBe(16 + step * 2);
    expect(measured.pre, density).toBe(16 + step * 2);
    expect(measured.callout, density).toBe(16 + step * 2);
    expect(measured.cell, density).toBe(12 + step * 2);
    expect(measured.font, `${density}: the reading size`).toBe(16);
  }
});

test('compact: 1px per density step off the gap and the padding; a cell keeps its side padding', async ({ page }) => {
  await open(page);
  for (const [density, step] of DENSITIES) {
    await add(page, `<div class="ds-prose ds-prose--compact ${density}">${SAMPLE}</div>`);
    const measured = await metrics(page);
    expect(measured.gap, density).toBeCloseTo(4 + step, 0);
    expect(measured.quote, density).toBe(12 + step);
    expect(measured.pre, density).toBe(12 + step);
    expect(measured.callout, density).toBe(12 + step);
    expect(measured.cell, `${density}: the cell's side`).toBe(8);
    expect(await page.$eval('#cell', (el) => parseFloat(getComputedStyle(el).paddingTop)), density).toBe(4 + step);
    expect(await page.$eval('#quote', (el) => parseFloat(getComputedStyle(el).paddingTop)), density).toBe(8 + step);
    expect(measured.font, density).toBe(14);
  }
});

test('the gap is the prose\'s: a density class on a block changes the block and not the gap above it', async ({ page }) => {
  await open(page);
  for (const [mode, gap] of [['', 8], ['ds-prose--compact', 4]]) {
    await add(page, `<div class="ds-prose ${mode}"><p id="one">One</p><p class="ds-density-tight" id="two">Two</p><pre class="ds-density-tight" id="three"><code>x</code></pre></div>`);
    const gaps = await page.evaluate(() => {
      const box = (id) => document.getElementById(id).getBoundingClientRect();
      return [box('two').top - box('one').bottom, box('three').top - box('two').bottom];
    });
    expect(gaps[0], mode).toBeCloseTo(gap, 0);
    expect(gaps[1], mode).toBeCloseTo(gap, 0);
  }
});

test('shape: multiplies the radius of quotes, callouts, code blocks and inline code', async ({ page }) => {
  await open(page);
  const radius = (id) => page.$eval(`#${id}`, (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
  for (const [shape, factor] of [['ds-shape-square', 0], ['ds-shape-soft', 0.5], ['ds-shape-default', 1], ['ds-shape-round', 1.5]]) {
    await add(page, `<div class="ds-prose ${shape}"><blockquote id="quote">Q</blockquote><div class="ds-prose__callout" id="callout">C</div><pre id="pre"><code>x</code></pre><p>In <code id="inline">code</code></p></div><div class="${shape}"><pre class="ds-code-block" id="block"><code>x</code></pre></div>`);
    expect(await radius('quote'), shape).toBe(12 * factor);
    expect(await radius('callout'), shape).toBe(12 * factor);
    expect(await radius('pre'), shape).toBe(12 * factor);
    expect(await radius('block'), shape).toBe(12 * factor);
    expect(await radius('inline'), shape).toBe(4 * factor);
  }
});

test('compact: the body role, one heading size and tight blocks; dense keeps the hierarchy', async ({ page }) => {
  await open(page);
  await add(page, `<div class="ds-prose ds-prose--compact">${SAMPLE}</div>`);
  const compact = await metrics(page);
  expect(compact.font).toBe(14);
  expect(compact.heading, 'a heading at the size of the text').toBe(14);
  expect(compact.gap).toBeCloseTo(4, 0);
  expect(compact.pre).toBe(12);
  expect(compact.quote).toBe(12);
  expect(compact.callout).toBe(12);
  expect(await page.$eval('#h2', (el) => Number(getComputedStyle(el).fontWeight))).toBeGreaterThanOrEqual(500);
  await add(page, `<div class="ds-prose ds-prose--dense">${SAMPLE}</div>`);
  const dense = await metrics(page);
  expect(dense.font).toBe(14);
  expect(dense.heading, 'dense keeps the subtitle').toBeGreaterThan(14);
  expect(dense.gap).toBeCloseTo(8, 0);
});

test('task list: each of the three forms loses its bullet, its box where the bullet stood; wrapped lines hang; other items keep theirs', async ({ page }) => {
  await open(page);
  const list = page.locator('[data-demo="tasks"] ul');
  const items = await list.evaluate((ul) => [...ul.children].map((li) => {
    const box = li.querySelector('input');
    const text = document.createRange();
    text.selectNodeContents(li);
    return {
      style: getComputedStyle(li).listStyleType,
      box: box ? box.getBoundingClientRect().toJSON() : null,
      checked: box ? box.checked : null,
      disabled: box ? box.disabled : null,
      position: box ? getComputedStyle(box).position : null,
      appearance: box ? getComputedStyle(box).appearance : null,
      li: li.getBoundingClientRect().toJSON(),
      ul: ul.getBoundingClientRect().left,
      text: text.getClientRects()[text.getClientRects().length - 1].left,
    };
  }));
  for (const item of items.slice(0, 3)) {
    expect(item.style).toBe('none');
    expect(item.position).toBe('absolute');
    expect(item.appearance).toBe('none');
    expect(item.box.width).toBe(16);
    expect(item.box.left).toBeCloseTo(item.ul, 0);
    expect(item.box.right, 'the box clears the text').toBeLessThanOrEqual(item.text);
  }
  expect(items[3].style).toBe('disc');
  // Wrapped lines stay in line with the text of the other items.
  await page.evaluate(() => { document.querySelector('[data-demo="tasks"]').style.maxInlineSize = '280px'; });
  const lines = await list.evaluate((ul) => {
    const li = ul.children[1];
    const range = document.createRange();
    range.selectNodeContents(li);
    const rects = [...range.getClientRects()].filter((rect) => rect.width > 20);
    return { many: new Set(rects.map((rect) => Math.round(rect.top))).size, lefts: [...new Set(rects.map((rect) => Math.round(rect.left)))] };
  });
  expect(lines.many, 'it wraps').toBeGreaterThan(1);
  expect(lines.lefts.length).toBe(1);
  // The state: a checked box is filled and shows its check; an empty one has only an edge.
  const fills = await list.evaluate((ul) => [...ul.querySelectorAll('input')].map((box) => ({ checked: box.checked, fill: getComputedStyle(box).backgroundColor, check: getComputedStyle(box, '::before').content, border: getComputedStyle(box).borderTopColor })));
  expect(fills[0].checked).toBe(true);
  expect(fills[0].fill).not.toBe('rgba(0, 0, 0, 0)');
  expect(fills[0].check).not.toBe('none');
  expect(fills[1].checked).toBe(false);
  expect(fills[1].fill).toBe('rgba(0, 0, 0, 0)');
  expect(fills[1].border).not.toBe('rgba(0, 0, 0, 0)');
  // Names: the label's text, or the attribute a renderer's bare box needs.
  await expect(list.getByRole('checkbox', { name: 'Charger packed' })).toBeChecked();
  await expect(list.getByRole('checkbox', { name: 'Label printed' })).not.toBeChecked();
});

test('task list: the box is centred on the first line of its text, in each form and each mode', async ({ page }) => {
  await open(page);
  const FORMS = '<ul><li><label><input type="checkbox" disabled checked> Charger</label></li><li><input type="checkbox" disabled aria-label="Label"> Label</li><li><p><input type="checkbox" disabled aria-label="Backup"> Backup</p></li><li><p><input type="checkbox" disabled aria-label="Loose"> Loose, the second of a loose list</p></li></ul>';
  for (const mode of ['', 'ds-prose--dense', 'ds-prose--compact']) {
    await add(page, `<div class="ds-prose ${mode}">${FORMS}</div>`);
    const offsets = await page.$$eval('#probe input', (boxes) => boxes.map((box) => {
      const rect = box.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(box.nextSibling);
      const line = range.getClientRects()[0];
      return Math.abs((rect.top + rect.bottom) / 2 - (line.top + line.bottom) / 2);
    }));
    expect(offsets).toHaveLength(4);
    for (const offset of offsets) expect(offset, mode || 'reading').toBeLessThan(1);
  }
});

test('a box the page made editable takes the ring and toggles with Space', async ({ page }) => {
  await open(page);
  await add(page, '<div class="ds-prose"><ul><li><label><input type="checkbox" id="editable"> Editable</label></li></ul></div>');
  const box = page.locator('#editable');
  await focusByKeyboard(page, box);
  await settle(page);
  expect(await box.evaluate((el) => [getComputedStyle(el).outlineStyle, getComputedStyle(el).outlineWidth])).toEqual(['solid', '2px']);
  await page.keyboard.press('Space');
  await expect(box).toBeChecked();
});

test('callouts: each tone colours the block, with its word and icon; no tone is the quote\'s surface; a link keeps its underline', async ({ page }) => {
  await open(page);
  const callouts = page.locator('[data-demo="callouts"] .ds-prose__callout');
  await expect(callouts).toHaveCount(5);
  const looks = await callouts.evaluateAll((list) => list.map((el) => {
    const style = getComputedStyle(el);
    const title = el.querySelector('.ds-prose__callout-title');
    const link = el.querySelector('a');
    return { background: style.backgroundColor, color: style.color, role: el.getAttribute('role'), word: title.textContent.trim(), icon: !!title.querySelector('svg'), hidden: title.querySelector('svg').getAttribute('aria-hidden'), linkColor: link ? getComputedStyle(link).color : null, underline: link ? getComputedStyle(link).textDecorationLine : null };
  }));
  expect(new Set(looks.slice(0, 4).map((look) => look.background)).size, 'four tones, four tints').toBe(4);
  for (const look of looks) {
    expect(look.role).toBe('note');
    expect(look.word.length).toBeGreaterThan(0);
    expect(look.icon).toBe(true);
    expect(look.hidden).toBe('true');
  }
  for (const look of looks.slice(0, 4)) {
    expect(look.linkColor).toBe(look.color);
    expect(look.underline).toBe('underline');
  }
  const quote = await page.locator('[data-demo="article"] blockquote').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(looks[4].background).toBe(quote);
  await expect(callouts.first()).toHaveRole('note');
});

test('a callout reads the tone from its own class: an inherited one leaves a plain note on the quote\'s surface', async ({ page }) => {
  await open(page);
  await add(page, `<div class="ds-prose"><blockquote id="quote">Quote</blockquote></div>
    <div class="ds-tone-error"><div class="ds-prose">
      <div class="ds-prose__callout" id="plain"><p>Note</p></div>
      <div class="ds-prose__callout ds-tone-info" id="own"><p>Own tone</p></div>
    </div></div>
    <div class="ds-prose"><div class="ds-prose__callout ds-tone-info" id="reference"><p>Info</p></div></div>
    <div class="ds-prose"><div class="ds-prose__callout ds-tone-neutral" id="neutral"><p>Neutral</p></div></div>`);
  const look = (id) => page.$eval(`#${id}`, (el) => [getComputedStyle(el).backgroundColor, getComputedStyle(el).color]);
  const quote = await look('quote');
  expect((await look('plain'))[0]).toBe(quote[0]);
  expect((await look('plain'))[1]).toBe(quote[1]);
  expect(await look('own')).toEqual(await look('reference'));
  expect((await look('reference'))[0]).not.toBe(quote[0]);
  expect((await look('neutral'))[0], 'the neutral tone is that surface too').toBe(quote[0]);
});

test('footnotes: the meta role under a hairline', async ({ page }) => {
  await open(page);
  const notes = page.locator('[data-demo="footnotes"] .ds-prose__footnotes');
  expect(await notes.evaluate((el) => [getComputedStyle(el).fontSize, getComputedStyle(el).borderTopStyle])).toEqual(['12px', 'solid']);
});

test('footnotes: a small figure that leaves the line alone, described by the hidden heading; each note links back', async ({ page }) => {
  await open(page);
  const demo = page.locator('[data-demo="footnotes"]');
  const ref = demo.locator('.ds-prose__fnref > a').first();
  await expect(ref).toHaveAccessibleName('1');
  await expect(ref).toHaveAccessibleDescription('Footnotes');
  // The reference leaves the line height alone: the paragraph is as tall as one without it.
  const [withRef, plain] = await demo.locator('p').first().evaluate((p) => {
    const twin = p.cloneNode(true);
    twin.querySelectorAll('sup').forEach((sup) => sup.remove());
    p.after(twin);
    const heights = [p.getBoundingClientRect().height, twin.getBoundingClientRect().height];
    twin.remove();
    return heights;
  });
  expect(withRef).toBe(plain);
  await expect(demo.locator('.ds-prose__footnotes')).toHaveAccessibleName('Footnotes');
  const back = demo.locator('.ds-prose__fnback').first();
  await expect(back).toHaveAccessibleName('Back to reference 1');
  expect(await back.locator('svg').getAttribute('aria-hidden')).toBe('true');
  // Keyboard: the reference and the link back take the ring.
  await focusByKeyboard(page, ref);
  await settle(page);
  expect(await ref.evaluate((el) => [el.matches(':focus-visible'), getComputedStyle(el).outlineStyle])).toEqual([true, 'solid']);
  // The note jumped to takes the tint (:target).
  const note = demo.locator('.ds-prose__footnotes li').first();
  const before = await note.evaluate((el) => getComputedStyle(el).backgroundColor);
  await note.evaluate((el) => { location.hash = el.id; });
  await expect.poll(() => note.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(before);
  await page.evaluate(() => history.replaceState(null, '', location.pathname + location.search));
});

test('heading anchors: the heading\'s text names the link, the icon shows on focus and hover; the heading\'s look stays', async ({ page }) => {
  await open(page);
  const heading = page.locator('[data-demo="anchors"] h2').first();
  const link = heading.locator('.ds-prose__anchor');
  await expect(link).toHaveAccessibleName('Before you start');
  await expect(page.getByRole('heading', { name: 'Before you start' }).first()).toBeVisible();
  expect(await link.getAttribute('href')).toBe(`#${await heading.getAttribute('id')}`);
  const look = await link.evaluate((el) => [getComputedStyle(el).color === getComputedStyle(el.parentElement).color, getComputedStyle(el).textDecorationLine]);
  expect(look).toEqual([true, 'none']);
  const icon = link.locator('svg');
  expect(await icon.getAttribute('aria-hidden')).toBe('true');
  expect(await icon.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
  await focusByKeyboard(page, link);
  await settle(page);
  expect(await icon.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  expect(await link.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  await page.evaluate(() => document.activeElement?.blur());
  await settle(page);
  expect(await icon.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
  const hover = await page.evaluate(() => matchMedia('(hover: hover)').matches);
  if (hover) {
    await heading.hover();
    await settle(page);
    expect(await icon.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  }
});

test('inline code, kbd and mark: a chip, a key in a hairline box, the tint; shape scales their radius', async ({ page }) => {
  await open(page);
  const demo = page.locator('[data-demo="inline"]');
  const style = (selector) => demo.locator(selector).first().evaluate((el) => {
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, border: cs.borderTopStyle, radius: parseFloat(cs.borderTopLeftRadius), family: cs.fontFamily, color: cs.color };
  });
  const [code, kbd, mark, text] = [await style('code'), await style('kbd'), await style('mark'), await style('p')];
  expect(code.bg).not.toBe('rgba(0, 0, 0, 0)');
  expect(kbd.border).toBe('solid');
  expect(kbd.family).toBe(code.family);
  expect(mark.bg).not.toBe('rgba(0, 0, 0, 0)');
  expect(mark.color).not.toBe(mark.bg);
  await demo.evaluate((el) => el.classList.add('ds-shape-square'));
  expect((await style('kbd')).radius).toBe(0);
  expect((await style('mark')).radius).toBe(0);
  await demo.evaluate((el) => el.classList.remove('ds-shape-square'));
});

test('a component inside prose keeps its look, in a callout too; a bare link takes the callout\'s ink', async ({ page }) => {
  await open(page);
  await add(page, `<div class="ds-prose">
    <a class="ds-btn ds-btn--filled" href="#x" id="button">Open</a>
    <a href="#x" id="bare">Link</a>
    <hr class="ds-divider ds-divider--inset" id="divider">
    <h3 class="ds-card__title" id="title">Title</h3>
    <div class="ds-prose__callout ds-tone-info" id="callout">
      <p><a class="ds-btn ds-btn--filled" href="#x" id="in-callout">Open</a></p>
      <p><a class="ds-chip" href="#x" id="chip-in-callout">Chip</a></p>
      <p><a class="x-page ds-btn ds-btn--filled" href="#x" id="second-class">Open</a></p>
      <p><a href="#x" id="bare-in-callout">Link</a></p>
    </div>
  </div><a class="ds-btn ds-btn--filled" href="#x" id="reference">Open</a><a class="ds-chip" href="#x" id="chip-reference">Chip</a><h3 class="ds-card__title" id="title-reference">Title</h3>`);
  const read = (id) => page.$eval(`#${id}`, (el) => {
    const style = getComputedStyle(el);
    return { color: style.color, decoration: style.textDecorationLine, background: style.backgroundColor };
  });
  await settle(page);
  const reference = await read('reference');
  expect(await read('button')).toEqual(reference);
  expect(await read('in-callout'), 'a filled button on a callout keeps its ink').toEqual(reference);
  expect(await read('second-class'), 'a ds- class after a class of the page counts too').toEqual(reference);
  // A chip's own rule inherits the ink around it, so on a tint it reads like any text there; no underline is added.
  const chip = await read('chip-in-callout');
  expect(chip.color).toBe((await read('callout')).color);
  expect(chip.decoration).toBe((await read('chip-reference')).decoration);
  expect((await read('bare')).decoration).toBe('underline');
  const bare = await read('bare-in-callout');
  expect(bare.color).toBe((await read('callout')).color);
  expect(bare.decoration).toBe('underline');
  expect(await page.$eval('#divider', (el) => getComputedStyle(el).marginInlineStart)).toBe('16px');
  // An h3 in prose would take the reading text's font; a card title keeps its role.
  const font = (id) => page.$eval(`#${id}`, (el) => [getComputedStyle(el).fontSize, getComputedStyle(el).fontWeight, getComputedStyle(el).lineHeight]);
  expect(await font('title')).toEqual(await font('title-reference'));
});

test('a page\'s class is not a system class: it wins over what it sets and keeps the rest, even when its name contains ds-', async ({ page }) => {
  await open(page);
  await add(page, `<style>.x-own { background-color: rgb(1, 2, 3); }</style><div class="ds-prose">
    <blockquote id="bare">Bare</blockquote>
    <blockquote class="needs-review" id="needs">Contains ds-</blockquote>
    <blockquote class="x-own" id="own">Sets its background</blockquote>
    <ul id="plain-list"><li>Item</li></ul>
    <ul class="cards-list" id="cards"><li>Item</li></ul>
    <a href="#x" class="downloads-link" id="downloads">Link</a>
    <p class="fields-note x-page" id="note"><code class="fields-code" id="code">code</code></p>
  </div>`);
  const look = (id) => page.$eval(`#${id}`, (el) => {
    const style = getComputedStyle(el);
    return { background: style.backgroundColor, padding: style.paddingLeft, list: style.paddingInlineStart, decoration: style.textDecorationLine, border: style.borderTopStyle };
  });
  const bare = await look('bare');
  expect(bare.background).not.toBe('rgba(0, 0, 0, 0)');
  expect(bare.padding).toBe('16px');
  expect(await look('needs')).toEqual(bare);
  const own = await look('own');
  expect(own.background, 'the page\'s class wins over what it sets').toBe('rgb(1, 2, 3)');
  expect(own.padding, 'and keeps the rest').toBe('16px');
  expect(await look('cards')).toEqual(await look('plain-list'));
  expect((await look('downloads')).decoration).toBe('underline');
  expect((await look('code')).border).toBe('solid');
});

test('code block: Tab reaches a named block that scrolls, an inset ring; arrow keys scroll; --wrap wraps', async ({ page }) => {
  await open(page);
  const block = page.locator('[data-demo="code"] pre[tabindex]');
  await expect(block).toHaveAccessibleName('Request');
  await focusByKeyboard(page, block);
  await settle(page);
  expect(await block.evaluate((el) => [getComputedStyle(el).outlineStyle, getComputedStyle(el).outlineOffset])).toEqual(['solid', '-2px']);
  await page.setViewportSize({ width: 400, height: 800 });
  await block.evaluate((el) => { el.scrollLeft = 0; });
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => document.querySelector('[data-demo="code"] pre[tabindex]').scrollLeft > 0, null, { timeout: 3000 });
  const wrap = page.locator('[data-demo="code"] .ds-code-block--wrap');
  expect(await wrap.evaluate((el) => [getComputedStyle(el).whiteSpace, el.scrollWidth <= el.clientWidth])).toEqual(['pre-wrap', true]);
});

test('forced colours: quotes, callouts and code keep an edge; a checked box Highlight', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const outline = (selector) => page.locator(selector).first().evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(await outline('[data-demo="article"] blockquote')).toBe('solid');
  expect(await outline('[data-demo="callouts"] .ds-prose__callout')).toBe('solid');
  expect(await outline('[data-demo="code"] .ds-code-block--wrap')).toBe('solid');
  const system = await page.evaluate(() => {
    const el = document.createElement('span');
    el.style.forcedColorAdjust = 'none';
    el.style.backgroundColor = 'Highlight';
    document.body.append(el);
    const colour = getComputedStyle(el).backgroundColor;
    el.remove();
    return colour;
  });
  const checked = page.locator('[data-demo="tasks"] input').first();
  expect(await checked.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(system);
  // A mark takes Mark / MarkText, a kbd keeps its border.
  const markColour = await page.evaluate(() => {
    const el = document.createElement('span');
    el.style.forcedColorAdjust = 'none';
    el.style.backgroundColor = 'Mark';
    document.body.append(el);
    const colour = getComputedStyle(el).backgroundColor;
    el.remove();
    return colour;
  });
  expect(await page.locator('[data-demo="inline"] mark').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(markColour);
  expect(await page.locator('[data-demo="inline"] kbd').first().evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe('solid');
});
