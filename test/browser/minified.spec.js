/**
 * dist/ds.min.css renders as dist/ds.css does (3.0): the same fixture,
 * loaded once with each stylesheet (minified.html?min), gives every
 * element and its ::before and ::after the same computed style, in every
 * engine. lightningcss merges the blocks of a layer and writes values in
 * its own notation (#fff for #ffffff, .15s for 150ms, double quotes); a
 * custom property keeps the tokens as written, so two custom values count
 * as the same when the browser computes them alike as a real property
 * (a duration, a colour, a shadow, a font, a curve). The cascade must not
 * notice the difference.
 */
import { test, expect } from '@playwright/test';

const FIXTURE = '/test/browser/fixtures/minified.html';

/** Every computed property of every element below #sample and its two pseudo-elements, animations paused at 0. */
async function styles(page, query) {
  await page.goto(FIXTURE + query);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  return page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      animation.pause();
      animation.currentTime = 0;
    }
    const out = {};
    [...document.querySelectorAll('#sample, #sample *')].forEach((element, index) => {
      for (const pseudo of ['', '::before', '::after']) {
        const style = getComputedStyle(element, pseudo || null);
        const values = {};
        for (let i = 0; i < style.length; i += 1) values[style[i]] = style.getPropertyValue(style[i]).trim();
        out[`${index} ${element.tagName.toLowerCase()}.${element.className}${pseudo}`] = values;
      }
    });
    return out;
  });
}

/** Pairs of custom property values that the browser computes alike as one of a few real properties. */
async function sameAsComputed(page, pairs) {
  return page.evaluate((list) => {
    const probe = document.createElement('span');
    document.querySelector('#sample').append(probe);
    const as = (property, value) => {
      probe.style.setProperty(property, '');
      probe.style.setProperty(property, value);
      return probe.style.getPropertyValue(property) ? getComputedStyle(probe).getPropertyValue(property) : null;
    };
    const PROPERTIES = ['transition-duration', 'color', 'box-shadow', 'font', 'transition-timing-function', 'opacity', 'width', 'border-radius', 'background-image', 'translate', 'scale'];
    const result = list.map(([a, b]) => PROPERTIES.some((property) => {
      const left = as(property, a);
      return left !== null && left === as(property, b);
    }) || a.replace(/'/g, '"') === b.replace(/'/g, '"'));
    probe.remove();
    return result;
  }, pairs);
}

test('ds.min.css gives the sample the same computed styles as ds.css', async ({ page }) => {
  const full = await styles(page, '');
  expect(await page.evaluate(() => [...document.styleSheets].some((entry) => /\/dist\/ds\.css$/.test(entry.href ?? '')))).toBe(true);
  const min = await styles(page, '?min');
  expect(await page.evaluate(() => [...document.styleSheets].some((entry) => /\/dist\/ds\.min\.css$/.test(entry.href ?? '')))).toBe(true);
  expect(Object.keys(min)).toEqual(Object.keys(full));
  expect(Object.keys(full).length).toBeGreaterThan(300);
  const differences = [];
  const custom = [];
  for (const [box, values] of Object.entries(full)) {
    for (const [property, value] of Object.entries(values)) {
      // lightningcss writes `background: none` as `background: 0 0`: the position of no image is 0px, not 0%, with nothing to place.
      if (min[box][property] === value || (/^background-position/.test(property) && min[box][property] === value.replace(/\b0%/g, '0px'))) continue;
      if (property.startsWith('--')) custom.push([box, property, value, min[box][property]]);
      else differences.push(`${box} ${property}: ${value} -> ${min[box][property]}`);
    }
  }
  expect(differences.slice(0, 20)).toEqual([]);
  // Custom properties: compare each distinct pair once.
  const pairs = [...new Map(custom.map(([, property, a, b]) => [`${property}|${a}|${b}`, [a, b]])).values()];
  const same = await sameAsComputed(page, pairs);
  expect(pairs.filter((_, index) => !same[index]).slice(0, 20)).toEqual([]);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.ds-btn--primary')).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
});
