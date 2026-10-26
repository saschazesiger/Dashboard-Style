/**
 * The timeline of 2.0 in real engines (fixtures/lists.html): dots and icon
 * markers on the rail and on the head line, the rail in segments from dot
 * to dot (with a gap) and through day headings, a ring for a muted entry,
 * borders that stay in forced colours, text that keeps its line breaks,
 * and entries that come and go only through DS.motion.flip (no motion of
 * its own at rest).
 */
import { test, expect } from './base-test.js';
import { ready, settle } from './helpers/motion.js';

const FIXTURE = '/test/browser/fixtures/lists.html';

async function open(page) {
  await page.goto(FIXTURE);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
}

/**
 * The geometry of every child of the timeline in page pixels: the dot
 * (::after) and rail (::before) boxes from their computed offsets against
 * the item's padding box, the marker's box and the head's centre line.
 */
function geometry(page) {
  return page.evaluate(() => [...document.getElementById('timeline').children].map((item) => {
    const box = item.getBoundingClientRect();
    const padTop = box.top + item.clientTop;
    const padLeft = box.left + item.clientLeft;
    const padBottom = padTop + item.clientHeight;
    const dot = getComputedStyle(item, '::after');
    const rail = getComputedStyle(item, '::before');
    const head = item.querySelector('.ds-timeline__head')?.getBoundingClientRect();
    const marker = item.querySelector('.ds-timeline__marker')?.getBoundingClientRect();
    const px = (value) => parseFloat(value);
    return {
      key: item.getAttribute('data-ds-key') || item.id,
      group: item.classList.contains('ds-timeline__group'),
      dot: dot.display === 'none' || dot.content === 'none' ? null : {
        x: padLeft + px(dot.left) + px(dot.width) / 2,
        y: padTop + px(dot.top) + px(dot.height) / 2,
        top: padTop + px(dot.top),
        bottom: padTop + px(dot.top) + px(dot.height),
        size: px(dot.width),
        ring: px(dot.borderTopWidth),
        colour: dot.borderTopColor,
      },
      rail: rail.display === 'none' || rail.content === 'none' ? null : {
        x: padLeft + px(rail.left) + px(rail.borderLeftWidth) / 2,
        top: padTop + px(rail.top),
        bottom: padBottom - px(rail.bottom),
        width: px(rail.borderLeftWidth),
      },
      head: head ? head.top + head.height / 2 : null,
      marker: marker ? { x: marker.left + marker.width / 2, y: marker.top + marker.height / 2, top: marker.top, bottom: marker.bottom } : null,
      text: item.getBoundingClientRect().left,
    };
  }));
}

test('dots and markers sit on the rail and on the head line; a muted entry is a ring', async ({ page }) => {
  await open(page);
  const parts = await geometry(page);
  const entries = parts.filter((part) => !part.group);
  const railX = entries.find((part) => part.rail).rail.x;
  for (const entry of entries) {
    const mark = entry.dot || entry.marker;
    expect(mark, `${entry.key}: a dot or a marker`).toBeTruthy();
    expect(Math.abs(mark.x - railX), `${entry.key}: on the rail`).toBeLessThan(0.75);
    expect(Math.abs(mark.y - entry.head), `${entry.key}: on the head line`).toBeLessThan(0.75);
    // The mark sits in the indent, before the entry's text edge.
    expect((entry.marker || entry.dot).x).toBeLessThan(entry.text);
  }
  const muted = parts.find((part) => part.key === 'e2');
  expect(muted.dot.ring).toBe(2);
  const plain = parts.find((part) => part.key === 'e3');
  expect(plain.dot.ring).toBe(plain.dot.size / 2);
  // An icon entry has no dot of its own: its marker takes the place.
  expect(parts.find((part) => part.key === 'e1').dot).toBeNull();
});

test('the rail runs from dot to dot with a gap, through a day heading, and ends at the last entry', async ({ page }) => {
  await open(page);
  const parts = await geometry(page);
  const gap = 4;
  const marks = parts.map((part) => part.dot || part.marker);
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    if (!part.rail) continue;
    if (!part.group) expect(part.rail.top - marks[index].bottom, `${part.key}: the gap below its mark`).toBeCloseTo(gap, 0);
    const next = parts[index + 1];
    // A rail that reaches into a day heading meets that heading's own rail;
    // one that reaches an entry stops a gap above its dot.
    if (next.group) expect(part.rail.bottom).toBeGreaterThanOrEqual(next.rail ? next.rail.top : 0);
    else if (next.dot) expect(Math.abs(next.dot.top - part.rail.bottom - gap), `${part.key}: the gap above the next dot`).toBeLessThan(1.5);
    else expect(part.rail.bottom).toBeGreaterThanOrEqual(next.marker.top - gap - 1);
  }
  // The first day heading carries no rail (nothing above it), the second one does.
  expect(parts[0].group && parts[0].rail).toBeNull();
  const second = parts.find((part) => part.key === 'day-2');
  expect(second.rail).not.toBeNull();
  expect(parts.at(-1).rail).toBeNull();
});

test('the text keeps its line breaks; nothing moves at rest', async ({ page }) => {
  await open(page);
  const text = await page.evaluate(() => {
    const el = document.querySelector('#timeline .ds-timeline__text');
    return { space: getComputedStyle(el).whiteSpace, lines: el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight) };
  });
  expect(text.space).toBe('pre-line');
  expect(text.lines).toBeCloseTo(2, 0);
  expect(await page.evaluate(() => document.getElementById('timeline').getAnimations({ subtree: true }).length)).toBe(0);
});

test('entries come and go through flip(): a new one fades in, the others glide, the list stands on a backing meanwhile', async ({ page }) => {
  await open(page);
  const seen = await page.evaluate(() => {
    const list = document.getElementById('timeline');
    // Items outside the viewport jump: the list is brought into view first.
    list.scrollIntoView({ block: 'center' });
    fxLists.entries.unshift(['e4', 'Repaired', '']);
    DS.motion.flip(list, (options) => DS.dom.morphHtml(list, fxLists.timelineHtml(), options));
    const fresh = list.querySelector('[data-ds-key="e4"]');
    const others = [...list.children].filter((item) => item !== fresh);
    return {
      fade: fresh.getAnimations().some((animation) => animation.animationName === 'ds-fade-in'),
      glides: others.filter((item) => item.getAnimations().some((animation) => !animation.animationName)).length,
      backing: getComputedStyle(others[1]).backgroundImage,
    };
  });
  expect(seen.fade).toBe(true);
  expect(seen.glides).toBeGreaterThan(0);
  expect(seen.backing).toMatch(/gradient/);
  await settle(page, { timeout: 5000 });
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('#timeline > .ds-timeline__item')).backgroundImage)).toBe('none');
});

test('dots and rails are borders, so they stay in forced colours', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced colours are emulated in Chromium only');
  await open(page);
  await page.emulateMedia({ forcedColors: 'active' });
  await settle(page);
  const canvas = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.cssText = 'forced-color-adjust: none; color: CanvasText; background-color: Canvas';
    document.body.append(probe);
    const colours = [getComputedStyle(probe).color, getComputedStyle(probe).backgroundColor];
    probe.remove();
    return colours;
  });
  const parts = await geometry(page);
  const plain = parts.find((part) => part.key === 'e3');
  expect(plain.dot.colour).toBe(canvas[0]);
  expect(plain.dot.colour).not.toBe(canvas[1]);
  expect(plain.rail.width).toBe(2);
});
