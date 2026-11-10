/**
 * The timeline on the options model (3.0): the rail's geometry holds at
 * every size x density (the dot and the marker on the head line, the rail
 * through their centre, the padding and the title stepping); the marks on
 * the title's centre with a status chip and in a feed; the rail clear of a
 * marker; the shape on the dot, the marker and the comment box; the activity
 * and comment variants, a muted marker, the time at the end of the line; the
 * actions' hang by the text button's padding; the keyboard path and the names
 * of the demo; forced colours. The 2.x behaviour stays in test/browser/timeline.spec.js.
 * Runs in the `fallback` project too.
 */
import { test, expect } from '../../../test/browser/base-test.js';
import { ready, settle, focusByKeyboard } from '../../../test/browser/helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/component.html?c=timeline';
const SIZES = [['ds-xs', -2], ['ds-sm', -1], ['ds-md', 0], ['ds-lg', 1], ['ds-xl', 2]];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];

async function open(page) {
  await page.goto(FIXTURE);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

const add = (page, html) => page.evaluate((markup) => {
  const box = document.createElement('div');
  box.innerHTML = markup;
  document.querySelector('#fx-component').prepend(box);
}, html);

test('at every size x density the dot and the marker sit on the head line and the rail through their centre', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate(({ sizes, densities }) => {
    const host = document.querySelector('#fx-component');
    const out = [];
    for (const [density] of densities) {
      for (const [size] of sizes) {
        const region = document.createElement('div');
        region.className = `${density} ${size}`;
        region.innerHTML = '<ol class="ds-timeline" role="list">'
          + '<li class="ds-timeline__item" id="a"><div class="ds-timeline__head"><p class="ds-timeline__title">One</p></div></li>'
          + '<li class="ds-timeline__item ds-timeline__item--icon" id="b"><span class="ds-timeline__marker" aria-hidden="true"><svg></svg></span><div class="ds-timeline__head"><p class="ds-timeline__title">Two</p></div></li>'
          + '<li class="ds-timeline__item" id="c"><div class="ds-timeline__head"><p class="ds-timeline__title">Three</p></div></li></ol>';
        host.append(region);
        const [a, b] = [region.querySelector('#a'), region.querySelector('#b')];
        const list = region.querySelector('.ds-timeline').getBoundingClientRect();
        const headA = a.querySelector('.ds-timeline__head').getBoundingClientRect();
        const dot = getComputedStyle(a, '::after');
        const rail = getComputedStyle(a, '::before');
        const aBox = a.getBoundingClientRect();
        const marker = b.querySelector('.ds-timeline__marker').getBoundingClientRect();
        const headB = b.querySelector('.ds-timeline__head').getBoundingClientRect();
        const glyph = b.querySelector('svg').getBoundingClientRect();
        const style = getComputedStyle(a);
        const dotTop = aBox.top + parseFloat(dot.top);
        out.push({
          density, size,
          pad: parseFloat(style.paddingTop),
          indent: aBox.left - list.left,
          head: headA.height,
          dotSize: parseFloat(dot.width),
          dotOnHead: dotTop + parseFloat(dot.height) / 2 - (headA.top + headA.height / 2),
          dotCentre: aBox.left + parseFloat(dot.left) + parseFloat(dot.width) / 2 - list.left,
          railCentre: aBox.left + parseFloat(rail.left) + parseFloat(rail.borderInlineStartWidth) / 2 - list.left,
          marker: marker.width,
          markerOnHead: marker.top + marker.height / 2 - (headB.top + headB.height / 2),
          markerCentre: marker.left + marker.width / 2 - list.left,
          glyph: glyph.width,
          title: parseFloat(getComputedStyle(a.querySelector('.ds-timeline__title')).fontSize),
        });
        region.remove();
      }
    }
    return out;
  }, { sizes: SIZES, densities: DENSITIES });
  expect(measured).toHaveLength(SIZES.length * DENSITIES.length);
  for (const entry of measured) {
    const step = SIZES.find(([size]) => size === entry.size)[1];
    const density = DENSITIES.find(([name]) => name === entry.density)[1];
    const name = `${entry.size} ${entry.density}`;
    expect(entry.pad, `${name}: padding, density only`).toBeCloseTo(12 + density * 2, 1);
    expect(entry.indent, `${name}: indent`).toBeCloseTo(32 + step * 4, 0);
    expect(entry.head, `${name}: head line, stepping up only`).toBeCloseTo(24 + Math.max(0, step) * 4, 0);
    expect(entry.dotSize, `${name}: dot`).toBeCloseTo(10 + step * 2, 0);
    expect(entry.marker, `${name}: marker`).toBeCloseTo(24 + step * 4, 0);
    expect(entry.glyph, `${name}: glyph in proportion`).toBeCloseTo((24 + step * 4) * 2 / 3, 0);
    expect(Math.abs(entry.dotOnHead), `${name}: the dot on the head line`).toBeLessThanOrEqual(1);
    expect(Math.abs(entry.markerOnHead), `${name}: the marker on the head line`).toBeLessThanOrEqual(1);
    expect(Math.abs(entry.dotCentre - entry.railCentre), `${name}: the rail through the dot`).toBeLessThanOrEqual(1);
    expect(Math.abs(entry.markerCentre - entry.railCentre), `${name}: the rail through the marker`).toBeLessThanOrEqual(1);
  }
  const fonts = Object.fromEntries(measured.filter((entry) => entry.density === 'ds-density-comfortable').map((entry) => [entry.size, entry.title]));
  expect(fonts).toEqual({ 'ds-xs': 12, 'ds-sm': 14, 'ds-md': 14, 'ds-lg': 16, 'ds-xl': 16 });
});

test('at every size the dot and the marker stay on the title\'s centre, with a status chip and in a feed', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate((sizes) => sizes.map(([size]) => {
    const region = document.createElement('div');
    region.className = size;
    region.innerHTML = '<ol class="ds-timeline" role="list"><li class="ds-timeline__item" id="chip"><div class="ds-timeline__head"><p class="ds-timeline__title">Issued</p><span class="ds-status ds-tone-success"><span>Active</span></span></div></li></ol>'
      + '<ol class="ds-timeline ds-timeline--activity" role="list"><li class="ds-timeline__item ds-timeline__item--icon" id="feed"><span class="ds-timeline__marker" aria-hidden="true">GH</span><div class="ds-timeline__head"><p class="ds-timeline__title"><strong>Grace Hopper</strong> took it</p></div></li>'
      + '<li class="ds-timeline__item" id="feed-dot"><div class="ds-timeline__head"><p class="ds-timeline__title">A sync</p></div></li></ol>';
    document.querySelector('#fx-component').prepend(region);
    const centre = (el) => { const box = el.getBoundingClientRect(); return box.top + box.height / 2; };
    const dotCentre = (item) => {
      const dot = getComputedStyle(item, '::after');
      return item.getBoundingClientRect().top + parseFloat(dot.top) + parseFloat(dot.height) / 2;
    };
    const title = (id) => centre(region.querySelector(`#${id} .ds-timeline__title`));
    const marker = region.querySelector('#feed .ds-timeline__marker');
    const out = {
      size,
      chip: dotCentre(region.querySelector('#chip')) - title('chip'),
      feed: centre(marker) - title('feed'),
      feedDot: dotCentre(region.querySelector('#feed-dot')) - title('feed-dot'),
      // Initials shrink with the disc, so they are never cut.
      initials: marker.scrollWidth - marker.clientWidth,
    };
    region.remove();
    return out;
  }), SIZES);
  for (const entry of measured) {
    expect(Math.abs(entry.chip), `${entry.size}: the dot beside a chip`).toBeLessThanOrEqual(0.5);
    expect(Math.abs(entry.feed), `${entry.size}: the marker of a feed`).toBeLessThanOrEqual(0.5);
    expect(Math.abs(entry.feedDot), `${entry.size}: the dot of a feed`).toBeLessThanOrEqual(0.5);
    expect(entry.initials, `${entry.size}: the initials fit`).toBeLessThanOrEqual(0);
  }
});

test('the rail stops clear of a marker, also through a day heading: a muted ring shows no stub inside', async ({ page }) => {
  await open(page);
  const measured = await page.evaluate((sizes) => sizes.map(([size]) => {
    const region = document.createElement('div');
    region.className = size;
    region.innerHTML = '<ol class="ds-timeline ds-timeline--activity" role="list"><li class="ds-timeline__item" id="above"><div class="ds-timeline__head"><p class="ds-timeline__title">One</p></div></li>'
      + '<li class="ds-timeline__item ds-timeline__item--icon ds-timeline__item--muted" id="ring"><span class="ds-timeline__marker" aria-hidden="true"></span><div class="ds-timeline__head"><p class="ds-timeline__title">Two</p></div></li>'
      + '<li class="ds-timeline__group" role="presentation" id="day"><h4 class="ds-timeline__day">Day</h4></li>'
      + '<li class="ds-timeline__item ds-timeline__item--icon ds-timeline__item--muted" id="after-day"><span class="ds-timeline__marker" aria-hidden="true"></span><div class="ds-timeline__head"><p class="ds-timeline__title">Three</p></div></li>'
      + '<li class="ds-timeline__item" id="last"><div class="ds-timeline__head"><p class="ds-timeline__title">Four</p></div></li></ol>';
    document.querySelector('#fx-component').prepend(region);
    const railEnd = (id) => {
      const item = region.querySelector(`#${id}`);
      const rail = getComputedStyle(item, '::before');
      return item.getBoundingClientRect().top + parseFloat(rail.top) + parseFloat(rail.height);
    };
    const markerTop = (id) => region.querySelector(`#${id} .ds-timeline__marker`).getBoundingClientRect().top;
    const out = { size, entry: markerTop('ring') - railEnd('above'), day: markerTop('after-day') - railEnd('day') };
    region.remove();
    return out;
  }), SIZES);
  for (const entry of measured) {
    expect(entry.entry, `${entry.size}: the gap above a marker`).toBeCloseTo(4, 0);
    expect(entry.day, `${entry.size}: the gap below a day heading`).toBeCloseTo(4, 0);
  }
});

test('the shape multiplies the dot, the marker and the comment box', async ({ page }) => {
  await open(page);
  const read = (shape) => page.evaluate((cls) => {
    const region = document.createElement('div');
    region.className = cls;
    region.innerHTML = '<ol class="ds-timeline" role="list"><li class="ds-timeline__item" id="a"><div class="ds-timeline__head"><p class="ds-timeline__title">One</p></div></li>'
      + '<li class="ds-timeline__item ds-timeline__item--icon ds-timeline__item--comment" id="b"><span class="ds-timeline__marker" aria-hidden="true">AL</span><div class="ds-timeline__head"><p class="ds-timeline__title">Ada</p></div><p class="ds-timeline__text">Note</p></li></ol>';
    document.querySelector('#fx-component').prepend(region);
    const out = {
      dot: parseFloat(getComputedStyle(region.querySelector('#a'), '::after').borderTopLeftRadius),
      marker: parseFloat(getComputedStyle(region.querySelector('.ds-timeline__marker')).borderTopLeftRadius),
      comment: parseFloat(getComputedStyle(region.querySelector('.ds-timeline__text')).borderTopLeftRadius),
    };
    region.remove();
    return out;
  }, shape);
  expect(await read('ds-shape-square')).toEqual({ dot: 0, marker: 0, comment: 0 });
  // A round mark is half its size times the shape, at most half its size.
  expect(await read('ds-shape-soft')).toEqual({ dot: 2.5, marker: 6, comment: 6 });
  expect(await read('')).toEqual({ dot: 5, marker: 12, comment: 12 });
  expect(await read('ds-shape-round')).toEqual({ dot: 5, marker: 12, comment: 18 });
});

test('activity: sentences with who in the label weight, no hairlines, closer entries, the time at the end of the line', async ({ page }) => {
  await open(page);
  const list = page.locator('[data-demo="activity"]');
  await expect(list).toHaveAttribute('aria-label', 'Activity');
  const read = await list.evaluate((el) => {
    const [first, second] = el.querySelectorAll('.ds-timeline__item');
    const title = second.querySelector('.ds-timeline__title');
    const time = first.querySelector('.ds-timeline__time').getBoundingClientRect();
    const head = first.querySelector('.ds-timeline__head').getBoundingClientRect();
    const titleStyle = getComputedStyle(first.querySelector('.ds-timeline__title'));
    return {
      border: parseFloat(getComputedStyle(second).borderTopWidth),
      pad: parseFloat(getComputedStyle(first).paddingTop),
      titleWeight: titleStyle.fontWeight,
      strongWeight: getComputedStyle(first.querySelector('strong')).fontWeight,
      timeEnd: head.right - time.right,
      mutedColor: getComputedStyle(title).color,
      plainColor: titleStyle.color,
      marker: { background: getComputedStyle(second.querySelector('.ds-timeline__marker')).backgroundColor, border: parseFloat(getComputedStyle(second.querySelector('.ds-timeline__marker')).borderTopWidth), colour: getComputedStyle(second.querySelector('.ds-timeline__marker')).borderTopColor },
      after: getComputedStyle(first, '::after').display,
    };
  });
  expect(read.border).toBe(0);
  expect(read.pad).toBe(8);
  expect(Number(read.strongWeight)).toBeGreaterThan(Number(read.titleWeight));
  expect(read.timeEnd).toBeCloseTo(0, 0);
  expect(read.mutedColor, 'the muted entry is quieter').not.toBe(read.plainColor);
  expect(read.marker.background, 'a muted marker is a ring').toBe('rgba(0, 0, 0, 0)');
  expect(read.marker.border).toBe(1);
  expect(read.marker.colour).not.toBe('rgba(0, 0, 0, 0)');
  expect(read.after, 'a marker replaces the dot').toBe('none');
  // A live entry comes in through flip(), on top, with its who and its time.
  await page.locator('[data-demo="add"]').click();
  await settle(page);
  await expect(list.locator('.ds-timeline__item').first().locator('strong')).toHaveText('Alan Turing');
});

test('comment: the text in a box with a border, its line breaks kept, as wide as the text and never over the measure', async ({ page }) => {
  await open(page);
  const comment = page.locator('[data-demo="comments"] .ds-timeline__item--comment .ds-timeline__text');
  const read = await comment.evaluate((el) => {
    const style = getComputedStyle(el);
    const entry = el.closest('.ds-timeline__item').getBoundingClientRect();
    return { border: parseFloat(style.borderTopWidth), radius: parseFloat(style.borderTopLeftRadius), background: style.backgroundColor, whiteSpace: style.whiteSpace, width: el.getBoundingClientRect().width, entry: entry.width };
  });
  expect(read.border).toBe(1);
  expect(read.radius).toBe(12);
  expect(read.background).not.toBe('rgba(0, 0, 0, 0)');
  expect(read.whiteSpace).toBe('pre-line');
  expect(read.width).toBeLessThan(read.entry);
});

test('the actions hang by the text button\'s padding at their size, so the label lines up with the text', async ({ page }) => {
  await open(page);
  // A theme's padding for buttons does not reach a text button, which sets its own.
  await add(page, `<ol class="ds-timeline" role="list" id="hang-theme" style="--ds-btn-padding-x:20px">
    <li class="ds-timeline__item"><p class="ds-timeline__text" id="text-theme">Text</p>
      <div class="ds-timeline__actions"><button class="ds-btn ds-btn--text" type="button" id="theme"><span>Edit</span></button></div>
      <div class="ds-timeline__actions ds-sm"><button class="ds-btn ds-btn--text" type="button" id="theme-sm"><span>Edit</span></button></div>
    </li></ol>`);
  await add(page, `<ol class="ds-timeline" role="list" id="hang">
    <li class="ds-timeline__item"><p class="ds-timeline__text" id="text">Text</p>
      <div class="ds-timeline__actions ds-sm"><button class="ds-btn ds-btn--text" type="button" id="sm"><span>Edit</span></button></div>
      <div class="ds-timeline__actions"><button class="ds-btn ds-btn--text" type="button" id="md"><span>Edit</span></button></div>
      <div class="ds-timeline__actions ds-lg"><button class="ds-btn ds-btn--text" type="button" id="lg"><span>Edit</span></button></div>
    </li></ol>`);
  const read = await page.evaluate(() => {
    const left = (selector) => document.querySelector(selector).getBoundingClientRect().left;
    return { text: left('#text'), sm: left('#sm span'), md: left('#md span'), lg: left('#lg span'), textTheme: left('#text-theme'), theme: left('#theme span'), themeSm: left('#theme-sm span') };
  });
  // The button's transparent 1px border stays outside the hang, as in 2.x.
  for (const size of ['sm', 'md', 'lg']) expect(Math.abs(read[size] - read.text), size).toBeLessThanOrEqual(1);
  expect(Math.abs(read.theme - read.textTheme), 'under a theme\'s --ds-btn-padding-x').toBeLessThanOrEqual(1);
  expect(Math.abs(read.themeSm - read.textTheme), 'small, under a theme\'s --ds-btn-padding-x').toBeLessThanOrEqual(1);
});

test('keyboard and names: no stop of its own; Tab reaches the buttons, each named after its entry', async ({ page }) => {
  await open(page);
  const history = page.getByRole('list', { name: 'History of LAPTOP-0042' });
  await expect(history).toBeVisible();
  const entries = await history.evaluate((el) => [...el.children].map((item) => item.tabIndex));
  expect(entries.every((index) => index === -1), 'an entry is no target').toBe(true);
  const edit = history.getByRole('button', { name: 'Edit the entry of 12 Oct 2026, 14:05' });
  await focusByKeyboard(page, edit);
  await expect(edit).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.ds-toast').last()).toContainText('Editing opens a form');
  const reply = page.getByRole('button', { name: 'Reply to Grace Hopper' });
  await focusByKeyboard(page, reply);
  await expect(reply).toBeFocused();
  // The markers are decoration: the sentence says who.
  const hidden = await page.locator('.ds-timeline__marker').evaluateAll((els) => els.every((el) => el.getAttribute('aria-hidden') === 'true'));
  expect(hidden).toBe(true);
  await expect(page.locator('[data-demo="history"] time').first()).toHaveAttribute('datetime', '2026-10-12T14:05');
  // The feed's times are machine-readable too, "Yesterday" and a new "Just now" among them.
  const feed = page.locator('[data-demo="activity"]');
  await page.locator('[data-demo="add"]').click();
  await expect(feed.locator('time').first()).toHaveText('Just now');
  const times = await feed.locator('time').evaluateAll((els) => els.map((el) => [el.textContent, el.getAttribute('datetime')]));
  expect(times.map(([text]) => text)).toContain('Yesterday');
  for (const [text, datetime] of times) expect(datetime, text).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
});

test('forced colours: the dot, the ring and the rail stay; the marker and the comment box keep an edge', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await page.emulateMedia({ forcedColors: 'active' });
  await open(page);
  const read = await page.evaluate(() => {
    const edge = (el, pseudo) => {
      const style = getComputedStyle(el, pseudo);
      return { width: parseFloat(style.borderTopWidth), colour: style.borderTopColor };
    };
    const history = document.querySelector('[data-demo="history"]');
    const comments = document.querySelector('[data-demo="comments"]');
    const feed = document.querySelector('[data-demo="activity"]');
    const rail = getComputedStyle(history.querySelector('.ds-timeline__item'), '::before');
    return {
      dot: edge(history.querySelector('.ds-timeline__item'), '::after'),
      ring: edge(history.querySelector('.ds-timeline__item--muted'), '::after'),
      rail: { width: parseFloat(rail.borderInlineStartWidth), colour: rail.borderInlineStartColor },
      marker: edge(feed.querySelector('.ds-timeline__marker')),
      muted: edge(feed.querySelector('.ds-timeline__item--muted .ds-timeline__marker')),
      comment: edge(comments.querySelector('.ds-timeline__item--comment .ds-timeline__text')),
    };
  });
  const CLEAR = 'rgba(0, 0, 0, 0)';
  expect(read.dot.width).toBeGreaterThan(0);
  expect(read.dot.colour).not.toBe(CLEAR);
  expect(read.ring.colour).not.toBe(CLEAR);
  expect(read.rail.width).toBe(2);
  expect(read.rail.colour).not.toBe(CLEAR);
  expect(read.marker.width).toBe(1);
  expect(read.marker.colour).not.toBe(CLEAR);
  expect(read.muted.colour).not.toBe(CLEAR);
  expect(read.comment.colour).not.toBe(CLEAR);
});
