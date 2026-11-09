/**
 * The shared `test` of the engine specs: @playwright/test with one option,
 * `dsFallback`, which the `fallback` project turns on (Chromium playing an
 * engine on the browser floor, Safari 17.5, Chrome/Edge 123, Firefox 130,
 * so the fallback path of every progressive feature runs):
 *
 * - `dist/ds.css`, `dist/ds.min.css` and the project bundles (`ds/ds.<entry>.css`) are
 *   served without their progressive refinements: every
 *   `@supports (...)` block whose condition names a progressive feature
 *   (`PROGRESSIVE` below: anchor positioning, View Transitions,
 *   scroll-driven animations, `interpolate-size`, `sibling-index()`,
 *   `::details-content`, `field-sizing`, `text-wrap: pretty`, relative
 *   colour syntax, `appearance: base-select`, `overflow-clip-margin` ...)
 *   is dropped, and so is every `@scope` and style query
 *   (`@container style(...)`) block; an `@supports not (...)` block of a
 *   progressive feature keeps its rules (they are the fallback). What the
 *   floor has stays: the `@supports (transition-timing-function:
 *   linear(0, 1))` refinements (the spring computes), `@starting-style` and
 *   `transition-behavior: allow-discrete`;
 * - an init script removes `document.startViewTransition` and `moveBefore`
 *   and makes `CSS.supports()` answer false for the progressive features.
 *   The popover methods and `linear()` in `el.animate()` stay: both are at
 *   the floor (motion-engine.spec.js fakes an engine without `linear()` in
 *   `el.animate()` by itself, for the cubic retry of motion.js).
 *
 * `scrollbar-gutter` and `scrollbar-color` stay progressive in `src/`, but
 * Chromium keeps them here, as it did at the 2.x floor. Bare progressive
 * declarations outside an `@supports` block (`text-wrap: pretty`) are left
 * in: Chromium applies them, an engine without them ignores them.
 *
 * A spec opts in by importing `test` (and `expect`) from here instead of
 * from @playwright/test; playwright.config.js runs exactly those specs in
 * the `fallback` project. This file and the specs are the only modules
 * that import @playwright/test (test/repo.test.js); helpers/ stays free of
 * it.
 */
import { test as base, expect } from '@playwright/test';

export { expect };

/**
 * The progressive features (plans/3.0.md, "Browser floor", the right-hand
 * column, plus the 2.x refinements that stay progressive): an `@supports`
 * condition that names one is dropped, and `CSS.supports()` answers false
 * for it.
 */
export const PROGRESSIVE = /anchor|position-area|position-try|view-transition|animation-timeline|scroll-timeline|view-timeline|animation-range|timeline-scope|interpolate-size|calc-size|sibling-index|sibling-count|details-content|field-sizing|text-wrap(-style)?[\s:]+pretty|base-select|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(\s*from\s|@scope|overflow-clip-margin|hyphenate-limit-chars/i;

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
 * The stylesheet without its progressive blocks, at any depth:
 * `@supports (...)` blocks whose condition names a `PROGRESSIVE` feature
 * go, the other `@supports` blocks stay (with their own progressive blocks
 * stripped); `@supports not (...)` blocks of a progressive feature are
 * unwrapped (their rules are the fallback), those of a feature at the
 * floor go. `@scope` and style query (`@container style(...)`) blocks go.
 * `@starting-style` stays: it is at the floor. Comments and strings are
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
    const rule = /^@(supports|scope|container)\b/.exec(css.slice(at, at + 20));
    if (rule) {
      const open = css.indexOf('{', at);
      const end = blockEnd(css, open);
      const prelude = css.slice(at, open);
      const inner = css.slice(open + 1, end - 1);
      const kept = rule[1] === 'supports'
        ? (/^@supports\s+not\b/.test(prelude) ? null : !PROGRESSIVE.test(prelude))
        : !(rule[1] === 'scope' || /\bstyle\s*\(/.test(prelude));
      if (kept === null) {
        if (PROGRESSIVE.test(prelude)) out += stripProgressive(inner);
      } else if (kept) {
        out += `${prelude}{${stripProgressive(inner)}}`;
      }
      at = end;
      continue;
    }
    out += css[at];
    at += 1;
  }
  return out;
}

/**
 * Runs in the page before any script: an engine on the browser floor.
 * @param {string} progressive the source of `PROGRESSIVE` (an init script
 *   is serialised, so it cannot close over this module)
 */
function floorEngine(progressive) {
  const drop = (proto, names) => {
    for (const name of names) {
      if (proto && name in proto) delete proto[name];
    }
  };
  drop(Document.prototype, ['startViewTransition', 'moveBefore']);
  drop(Element.prototype, ['moveBefore']);
  drop(DocumentFragment.prototype, ['moveBefore']);
  const unsupported = new RegExp(progressive, 'i');
  const supports = CSS.supports.bind(CSS);
  CSS.supports = (...args) => (unsupported.test(args.join(' ')) ? false : supports(...args));
}

export const test = base.extend({
  /** True in the `fallback` project (playwright.config.js). */
  dsFallback: [false, { option: true }],

  page: async ({ page, dsFallback }, use) => {
    if (dsFallback) {
      // ds.css, ds.min.css (the styleguide and the Motion Lab) and the project bundles
      // (ds/ds.bundle.css of the tour and the reference app, ds/ds.<entry>.css of the page patterns).
      await page.route(/(\/dist\/ds(\.min)?|\/ds\/ds\.[\w-]+)\.css(\?.*)?$/, async (route) => {
        const response = await route.fetch();
        const css = stripProgressive(await response.text());
        const left = css.replace(/\/\*[\s\S]*?\*\//g, '');
        const survived = [...left.matchAll(/@supports\s*\(([^{]*)\{/g)].some((match) => PROGRESSIVE.test(match[1]))
          || /@scope\b|@container[^{]*\bstyle\s*\(/.test(left);
        if (survived) throw new Error('fallback: a progressive block survived the strip');
        await route.fulfill({ response, body: css });
      });
      await page.addInitScript(floorEngine, PROGRESSIVE.source);
    }
    await use(page);
  },
});
