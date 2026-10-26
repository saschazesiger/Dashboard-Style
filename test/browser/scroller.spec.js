/**
 * Sideways scrollers of 2.0 on fixtures/tables.html: .ds-scroll-x fades
 * at each end that still has content and nowhere when it fits (scroll-
 * driven, else the data-ds-overflow-* attributes of DS.dom.scrollEdges()),
 * keeps the scrollbar strip opaque, is a tab stop with an inset ring that
 * drops the mask, prints unmasked, keeps its owned edge state through
 * morphHtml; .ds-jump holds a "Latest" pill at its log's bottom edge
 * without taking room or the pointer. The card table wrappers move to the
 * same numbers (scroll.spec.js).
 */
import { test, expect } from './base-test.js';
import { ready, settle, focusByKeyboard } from './helpers/motion.js';

const TABLES = '/test/browser/fixtures/tables.html';

async function open(page) {
  await page.goto(TABLES);
  await ready(page);
  await page.mouse.move(1, 1);
  await settle(page);
  await page.locator('#strip').scrollIntoViewIfNeeded();
}

const edges = (page, selector) => page.evaluate((sel) => {
  const style = getComputedStyle(document.querySelector(sel));
  return [Number(style.getPropertyValue('--ds-scroll-edge-start')), Number(style.getPropertyValue('--ds-scroll-edge-end'))];
}, selector);

function scrollTo(page, selector, left) {
  return page.evaluate(async ([sel, x]) => {
    document.querySelector(sel).scrollLeft = x;
    for (let i = 0; i < 2; i += 1) await new Promise((resolve) => requestAnimationFrame(resolve));
  }, [selector, left]);
}

test('a strip fades at each end that still has content, nowhere when it fits', async ({ page }) => {
  await open(page);
  expect(await page.evaluate(() => { const strip = document.getElementById('strip'); return strip.scrollWidth > strip.clientWidth; })).toBe(true);
  if (await page.evaluate(() => CSS.supports('animation-timeline: scroll()'))) {
    expect(await edges(page, '#strip')).toEqual([0, 1]);
    await scrollTo(page, '#strip', 16);
    const early = await edges(page, '#strip');
    expect(early[0]).toBeGreaterThan(0.3);
    expect(early[0]).toBeLessThan(0.7);
    await scrollTo(page, '#strip', 100000);
    expect(await edges(page, '#strip')).toEqual([1, 0]);
    expect(await edges(page, '#strip-fits')).toEqual([0, 0]);
  } else {
    // Without scroll timelines: no fade until DS.dom.scrollEdges() says where there is more.
    expect(await edges(page, '#strip')).toEqual([0, 0]);
    const fast = await page.evaluate(() => Math.round(DS.motion.motionDuration(document.documentElement, '--ds-dur-fast')));
    const transition = await page.evaluate(() => {
      const strip = document.getElementById('strip');
      DS.dom.scrollEdges(strip);
      void getComputedStyle(strip).getPropertyValue('--ds-scroll-edge-end');
      return strip.getAnimations().filter((a) => a.transitionProperty === '--ds-scroll-edge-end').map((a) => Math.round(a.effect.getTiming().duration));
    });
    expect(transition).toEqual([fast]);
    await settle(page);
    expect(await edges(page, '#strip')).toEqual([0, 1]);
    expect(await edges(page, '#strip-fits')).toEqual([0, 0]);
  }
  // The mask: transparent at a fading end, opaque between; the fade length is --ds-scroll-fade.
  const mask = await page.evaluate(() => { const style = getComputedStyle(document.getElementById('strip')); return style.maskImage || style.webkitMaskImage; });
  expect(mask).toMatch(/^linear-gradient\(to right, /);
  // --ds-scroll-fade: 0px turns the fades off (the numbers stay; the length is 0).
  await page.evaluate(() => document.getElementById('strip').style.setProperty('--ds-scroll-fade', '0px'));
  const off = await page.evaluate(() => { const style = getComputedStyle(document.getElementById('strip')); return (style.maskImage || style.webkitMaskImage).match(/calc\([^)]*\)|\d+px/g); });
  expect(off.join()).not.toMatch(/[1-9]\d*px/);
});

test('the scrollbar strip stays opaque: a second mask layer of --ds-scrollbar-height', async ({ page }) => {
  await open(page);
  await page.evaluate(() => document.getElementById('strip').style.setProperty('--ds-scrollbar-height', '10px'));
  const size = await page.evaluate(() => { const style = getComputedStyle(document.getElementById('strip')); return style.maskSize || style.webkitMaskSize; });
  expect(size.replace(/\s+/g, ' ')).toMatch(/, 100% 10px$/);
});

test('a strip that is a tab stop shows an inset ring, unmasked, and arrow keys scroll it', async ({ page }) => {
  await open(page);
  await focusByKeyboard(page, page.locator('#strip'));
  await settle(page);
  const focused = await page.evaluate(() => {
    const style = getComputedStyle(document.getElementById('strip'));
    return { outline: style.outlineStyle, offset: style.outlineOffset, mask: style.maskImage || style.webkitMaskImage };
  });
  expect(focused).toEqual({ outline: 'solid', offset: '-2px', mask: 'none' });
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => page.evaluate(() => document.getElementById('strip').scrollLeft)).toBeGreaterThan(0);
});

test('the jump place holds its pill above the log\'s bottom edge, takes no room and lets the pointer through', async ({ page }) => {
  await open(page);
  await page.locator('#log').scrollIntoViewIfNeeded();
  const state = await page.evaluate(() => {
    const log = document.getElementById('log');
    log.scrollTop = 0;
    const place = document.getElementById('jump');
    const pill = document.getElementById('jump-pill').getBoundingClientRect();
    const box = log.getBoundingClientRect();
    const line = log.querySelector('p').getBoundingClientRect();
    const beside = document.elementFromPoint(box.left + 4, pill.top + pill.height / 2);
    return {
      height: place.getBoundingClientRect().height,
      above: Math.round(box.bottom - pill.bottom),
      centred: Math.abs((pill.left + pill.right) / 2 - (box.left + box.right) / 2) < 2,
      pillHit: document.elementFromPoint((pill.left + pill.right) / 2, pill.top + pill.height / 2)?.closest('#jump-pill') !== null,
      beside: beside?.tagName,
      lineHeight: Math.round(line.height),
    };
  });
  expect(state.height).toBe(0);
  expect(state.above).toBe(16);
  expect(state).toMatchObject({ centred: true, pillHit: true, beside: 'P' });
});

test('print: the strip shows all of its content, unmasked; the jump pill is hidden', async ({ page }) => {
  await open(page);
  await page.emulateMedia({ media: 'print' });
  const printed = await page.evaluate(() => {
    const strip = getComputedStyle(document.getElementById('strip'));
    return { overflow: strip.overflowX, mask: strip.maskImage || strip.webkitMaskImage, jump: getComputedStyle(document.getElementById('jump')).display };
  });
  expect(printed).toEqual({ overflow: 'visible', mask: 'none', jump: 'none' });
});

test('a re-render through morphHtml keeps the edge state that DS.dom.scrollEdges() owns', async ({ page }) => {
  await open(page);
  const state = await page.evaluate(async () => {
    const box = document.querySelector('.fx-strip-box');
    const strip = document.getElementById('strip');
    DS.dom.scrollEdges(strip);
    strip.scrollLeft = 40;
    for (let i = 0; i < 3; i += 1) await new Promise((resolve) => requestAnimationFrame(resolve));
    const read = () => ['data-ds-edges', 'data-ds-overflow-start', 'data-ds-overflow-end'].filter((name) => strip.hasAttribute(name));
    const before = read();
    // The page renders the box again from markup without the owned attributes.
    const html = box.innerHTML.replace(/\sdata-ds-(edges|overflow-start|overflow-end)(="[^"]*")?/g, '');
    DS.dom.morphHtml(box, html);
    return { before, after: read(), same: document.getElementById('strip') === strip };
  });
  expect(state.same, 'the strip is patched in place').toBe(true);
  expect(state.before).toEqual(['data-ds-edges', 'data-ds-overflow-start', 'data-ds-overflow-end']);
  expect(state.after).toEqual(state.before);
});
