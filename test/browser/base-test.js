/**
 * The shared `test` of the engine specs: @playwright/test with one option,
 * `dsFallback`, which the `fallback` project turns on (Chromium playing an
 * engine on the browser floor, so every fallback path runs):
 *
 * - `dist/ds.css` is served without its progressive refinements: every
 *   `@supports (...)` block and every `@starting-style` block is dropped
 *   (an `@supports not (...)` block keeps its rules), so `linear()` tokens
 *   compute to their cubic fallbacks and anchor positioning,
 *   `interpolate-size`, `sibling-index()` and the like are gone;
 * - an init script removes `document.startViewTransition`, the popover
 *   methods and `moveBefore`, makes `CSS.supports()` answer false for those
 *   features, and makes `Element.prototype.animate` throw a TypeError for a
 *   `linear()` easing (as Chrome/Edge 111-112 and Safari 16.4-17.1 do), so
 *   the cubic retry of motion.js is what plays.
 *
 * A spec opts in by importing `test` (and `expect`) from here instead of
 * from @playwright/test; playwright.config.js runs exactly those specs in
 * the `fallback` project. This file and the specs are the only modules
 * that import @playwright/test (test/repo.test.js); helpers/ stays free of
 * it.
 */
import { test as base, expect } from '@playwright/test';

export { expect };

/** Skips a comment or a string starting at `index`; returns the index after it, or -1 when there is none. */
function skipOpaque(css, index) {
  if (css.startsWith('/*', index)) {
    const end = css.indexOf('*/', index + 2);
    return end < 0 ? css.length : end + 2;
  }
  const quote = css[index];
  if (quote !== '"' && quote !== "'") return -1;
  let at = index + 1;
  while (at < css.length && css[at] !== quote) at += css[at] === '\\' ? 2 : 1;
  return at + 1;
}

/** The index after the block whose `{` is at `open`. */
function blockEnd(css, open) {
  let depth = 0;
  let at = open;
  while (at < css.length) {
    const skipped = skipOpaque(css, at);
    if (skipped >= 0) {
      at = skipped;
      continue;
    }
    if (css[at] === '{') depth += 1;
    else if (css[at] === '}') {
      depth -= 1;
      if (depth === 0) return at + 1;
    }
    at += 1;
  }
  return css.length;
}

/**
 * The stylesheet without its progressive blocks: `@supports (...)` and
 * `@starting-style` blocks go, at any depth; `@supports not (...)` blocks
 * are unwrapped (their rules are the fallback). Comments and strings are
 * left alone.
 * @param {string} css
 * @returns {string}
 */
export function stripProgressive(css) {
  let out = '';
  let at = 0;
  while (at < css.length) {
    const skipped = skipOpaque(css, at);
    if (skipped >= 0) {
      out += css.slice(at, skipped);
      at = skipped;
      continue;
    }
    const rule = /^@(supports|starting-style)\b/.exec(css.slice(at, at + 20));
    if (rule) {
      const open = css.indexOf('{', at);
      const end = blockEnd(css, open);
      const prelude = css.slice(at, open);
      if (/^@supports\s+not\b/.test(prelude)) out += stripProgressive(css.slice(open + 1, end - 1));
      at = end;
      continue;
    }
    out += css[at];
    at += 1;
  }
  return out;
}

/** Runs in the page before any script: an engine on the browser floor. */
function floorEngine() {
  const drop = (proto, names) => {
    for (const name of names) {
      if (proto && name in proto) delete proto[name];
    }
  };
  drop(Document.prototype, ['startViewTransition', 'moveBefore']);
  drop(Element.prototype, ['moveBefore']);
  drop(DocumentFragment.prototype, ['moveBefore']);
  drop(HTMLElement.prototype, ['showPopover', 'hidePopover', 'togglePopover']);
  const unsupported = /linear\(|anchor|position-area|position-try|view-transition|sibling-index|sibling-count|interpolate-size|calc-size|overflow-clip-margin|animation-timeline|scroll-timeline|view-timeline|animation-range|timeline-scope|allow-discrete|transition-behavior|popover|details-content/i;
  const supports = CSS.supports.bind(CSS);
  CSS.supports = (...args) => (unsupported.test(args.join(' ')) ? false : supports(...args));
  const animate = Element.prototype.animate;
  const linear = (value) => typeof value === 'string' && value.includes('linear(');
  Element.prototype.animate = function (keyframes, options) {
    const frames = Array.isArray(keyframes) ? keyframes : [keyframes];
    if (linear(options?.easing) || frames.some((frame) => linear(frame?.easing))) throw new TypeError(`Failed to execute 'animate' on 'Element': Invalid easing`);
    return animate.call(this, keyframes, options);
  };
}

export const test = base.extend({
  /** True in the `fallback` project (playwright.config.js). */
  dsFallback: [false, { option: true }],

  page: async ({ page, dsFallback }, use) => {
    if (dsFallback) {
      await page.route('**/dist/ds.css', async (route) => {
        const response = await route.fetch();
        const css = stripProgressive(await response.text());
        const left = css.replace(/\/\*[\s\S]*?\*\//g, '');
        if (/linear\(|@starting-style|@supports\s*\(/.test(left)) throw new Error('fallback: a progressive block survived the strip');
        await route.fulfill({ response, body: css });
      });
      await page.addInitScript(floorEngine);
    }
    await use(page);
  },
});
