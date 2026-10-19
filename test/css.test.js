/**
 * Guardrails of the stylesheets: motion only through tokens and one file of
 * keyframes, no palette, radius or type literals in components (so a theme
 * reaches every value), plain CSS a Safari 14 page can load, and the
 * forced-colors and accessibility details that are easy to lose.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as icons from '../src/js/icons.js';
import {
  ROOT, cssBundle, declarations, declarationsOf, filesIn, forcedColorBlocks, literalPart, read, rules, stripComments, withoutAtRuleBlocks,
} from './helpers.js';

const ALL_CSS = [...filesIn('src', (path) => path.endsWith('.css')), 'fonts/fonts.css', ...filesIn('themes', (path) => path.endsWith('.css'))];
const SRC_CSS = filesIn('src', (path) => path.endsWith('.css'));
/** Files whose values must all come from tokens: everything but tokens.css. */
const COMPONENT_CSS = SRC_CSS.filter((path) => path !== 'src/tokens.css' && path !== 'src/index.css');
const KEYFRAME_NAMES = new Set([...read('src/motion.css').matchAll(/@keyframes\s+([\w-]+)/g)].map((match) => match[1]));
/** A selector list split at its top-level commas (not inside :is() or :where()). */
function splitSelectors(selector) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const char of selector) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) { parts.push(current.trim()); current = ''; } else current += char;
  }
  parts.push(current.trim());
  return parts;
}

/**
 * :hover selectors allowed outside `@media (hover: hover)`, each with its
 * reason. Forced-colours blocks are exempt as a whole (structurally, below).
 */
const HOVER_EXEMPT = new Map([
  ['.ds-drawer__list:hover', 'shows the scrollbar of a scrolling drawer list, no choreography'],
]);

/** The :hover selectors outside hover and forced-colours blocks, minus HOVER_EXEMPT. */
function hoverOutsideHoverBlocks(css) {
  const outside = withoutAtRuleBlocks(withoutAtRuleBlocks(css, /@media\s*\(hover:\s*hover\)/), /@media\s*\(forced-colors:\s*active\)/);
  return rules(outside).flatMap((rule) => splitSelectors(rule.selector))
    .filter((selector) => /:hover/.test(selector) && !HOVER_EXEMPT.has(selector));
}

/** Custom properties set at runtime by js/ or by the page (documented in docs/). */
const RUNTIME = new Set(['--ds-i', '--ds-indicator-x', '--ds-indicator-y', '--ds-indicator-w', '--ds-indicator-h', '--ds-progress', '--ds-toast-left', '--ds-toast-bottom', '--ds-toast-shift', '--ds-toast-shift-y', '--ds-toast-reserve']);

describe('motion in CSS', () => {
  it('defines @keyframes only in motion.css, each name once', () => {
    assert.deepEqual(ALL_CSS.filter((file) => file !== 'src/motion.css' && /@keyframes/.test(read(file))), []);
    const names = [...read('src/motion.css').matchAll(/@keyframes\s+([\w-]+)/g)].map((match) => match[1]);
    assert.deepEqual(names, [...new Set(names)]);
    assert.ok(names.every((name) => name.startsWith('ds-')), names.join());
  });

  it('only uses keyframes that exist', () => {
    const missing = [];
    for (const file of ALL_CSS) {
      for (const { property, value } of declarations(read(file))) {
        if (!/^(animation|animation-name|--ds-enter-keyframes|--ds-leave-keyframes)$/.test(property)) continue;
        for (const word of literalPart(value).split(/[\s,]+/)) {
          if (word.startsWith('ds-') && !KEYFRAME_NAMES.has(word)) missing.push(`${file}: ${word}`);
        }
      }
    }
    assert.deepEqual(missing, []);
  });

  it('takes durations and easings of transitions and animations from tokens', () => {
    const offenders = [];
    for (const file of COMPONENT_CSS) {
      for (const { property, value } of declarations(read(file))) {
        if (!/^(transition|animation)(-duration|-delay|-timing-function)?$/.test(property)) continue;
        const literal = literalPart(value);
        // `linear` is fine for loops, 0s/0ms for "no delay" or "at once".
        const time = literal.match(/(?<![\w-])(?!0m?s\b)\d*\.?\d+m?s\b/);
        const easing = literal.match(/\b(ease(-in|-out|-in-out)?|cubic-bezier|steps)\b/);
        if (time || easing) offenders.push(`${file}: ${property}: ${value}`);
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('fades every .ds-enter variant on the standard curve and moves it separately', () => {
    const motion = stripComments(read('src/motion.css'));
    const keyframes = Object.fromEntries([...motion.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?\})\s*\}/g)].map((match) => [match[1], match[2]]));
    const enter = declarations(motion.slice(motion.indexOf('.ds-enter.ds-enter'), motion.indexOf('.ds-leave.ds-leave')));
    const fallback = (property) => enter.find((entry) => entry.property === property).value.replace(/^var\(--[\w-]+,\s*/, '').replace(/\)$/, '');
    const variants = [fallback('animation-name'), ...enter.filter((entry) => entry.property === '--ds-enter-keyframes').map((entry) => entry.value)];
    const easings = [fallback('animation-timing-function'), ...enter.filter((entry) => entry.property === '--ds-enter-easing').map((entry) => entry.value)];
    for (const list of variants) {
      const names = list.split(/\s*,\s*/);
      assert.equal(names[0], 'ds-fade-in', list);
      for (const name of names.slice(1)) assert.doesNotMatch(keyframes[name], /opacity/, `${name} must be movement only`);
    }
    for (const list of easings) assert.match(list, /^var\(--ds-ease-in-out\)/, list);
  });

  it('fills bars from zero only, gliding on the standard curve (first render of a chart)', () => {
    const motion = stripComments(read('src/motion.css'));
    assert.match(motion, /@keyframes ds-fill-x\s*\{\s*from\s*\{\s*transform:\s*scaleX\(0\);\s*\}\s*\}/);
    assert.match(motion, /@keyframes ds-fill-y\s*\{\s*from\s*\{\s*transform:\s*scaleY\(0\);\s*\}\s*\}/);
    for (const axis of ['x', 'y']) {
      const fill = Object.fromEntries(declarationsOf(read('src/motion.css'), `.ds-enter--fill-${axis}`).map((entry) => [entry.property, entry.value]));
      assert.equal(fill['--ds-enter-keyframes'], `ds-fade-in, ds-fill-${axis}`);
      assert.equal(fill['--ds-enter-duration'], 'var(--ds-dur-glide)');
      assert.equal(fill['--ds-enter-easing'], 'var(--ds-ease-in-out), var(--ds-ease-in-out)');
    }
  });

  it('starts every exit at once and plays it once', () => {
    const leave = Object.fromEntries(declarationsOf(read('src/motion.css'), '.ds-leave.ds-leave').map((entry) => [entry.property, entry.value]));
    assert.equal(leave['animation-delay'], '0ms');
    assert.equal(leave['animation-iteration-count'], '1');
  });

  it('never fakes reduced motion with a tiny duration (endless loops would race)', () => {
    assert.deepEqual(ALL_CSS.filter((file) => /\.0\d*1ms|0\.01ms/.test(read(file))), []);
  });

  it('never overshoots: every curve stays within [0, 1]', () => {
    const offenders = [];
    for (const file of ALL_CSS) {
      const css = stripComments(read(file));
      for (const match of css.matchAll(/cubic-bezier\(([^)]*)\)/g)) {
        if (!match[1].split(',').map(Number).every((value) => value >= 0 && value <= 1)) offenders.push(`${file}: ${match[0]}`);
      }
      for (const match of css.matchAll(/linear\(([^)]*\d[^)]*)\)/g)) {
        const outputs = match[1].split(',').map((stop) => Number(stop.trim().split(/\s+/)[0]));
        if (!outputs.every((value) => value >= 0 && value <= 1)) offenders.push(`${file}: linear(...)`);
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('never scales an element up on hover and never scales on press', () => {
    const offenders = [];
    for (const file of ALL_CSS) {
      for (const { selector, body } of rules(read(file))) {
        // transform: scale(...) and the separate scale property.
        const factors = [
          ...[...body.matchAll(/scale(?:3d|X|Y)?\(\s*([\d.]+)/g)].map((match) => Number(match[1])),
          ...[...body.matchAll(/(?:^|[;\s])scale\s*:\s*([\d.]+)/g)].map((match) => Number(match[1])),
        ];
        if (selector.includes(':hover') && factors.some((factor) => factor > 1)) offenders.push(`${file}: ${selector}`);
        if (selector.includes(':active') && factors.length) offenders.push(`${file}: ${selector}`);
      }
    }
    assert.deepEqual(offenders, []);
  });
});

describe('values come from tokens', () => {
  it('has no colour literals in components (themes reach every colour)', () => {
    const offenders = [];
    for (const file of COMPONENT_CSS) {
      for (const { property, value } of declarations(read(file))) {
        // A mask only reads alpha: #000 there is "opaque", not a colour.
        const literal = /mask-image$/.test(property) ? literalPart(value).replace(/#000\b/g, '') : literalPart(value);
        if (/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(|\b(?:white|black|red|green|blue|gray|grey)\b/i.test(literal)) {
          offenders.push(`${file}: ${property}: ${value}`);
        }
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('takes radii and shadows from tokens', () => {
    const offenders = [];
    for (const file of COMPONENT_CSS) {
      for (const { property, value } of declarations(read(file))) {
        const literal = literalPart(value).trim();
        if (/radius/.test(property) && literal.replace(/\b0\b|\b50%|\binherit\b/g, '').trim()) offenders.push(`${file}: ${property}: ${value}`);
        // Shadows used as rings (inset 0 0 0 1px var(--x)) are geometry; a blur is elevation.
        if (property === 'box-shadow' && /\d+px\s+\d+px\s+\d+px\s+\d*px?\s*$/.test(literal)) offenders.push(`${file}: ${property}: ${value}`);
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('sets type through the roles, never as a literal', () => {
    const offenders = [];
    for (const file of COMPONENT_CSS) {
      for (const { property, value } of declarations(read(file))) {
        if (!['font', 'font-size', 'font-weight', 'line-height', 'font-family', 'letter-spacing'].includes(property)) continue;
        if (property === 'line-height' && value === '1') continue; // an inline box of the glyphs alone
        if (property === 'letter-spacing' && value === '0') continue;
        if (['font-family', 'font'].includes(property) && /^(inherit|var\(.*\))$/.test(value)) continue;
        if (/(?<![\w.-])\d*\.?\d+(?:px|rem|em|pt)?(?![\w%])/.test(literalPart(value)) || /['"]/.test(literalPart(value))) {
          offenders.push(`${file}: ${property}: ${value}`);
        }
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('dims through the state tokens, not literal opacities', () => {
    const offenders = [];
    for (const file of COMPONENT_CSS.filter((path) => path !== 'src/motion.css')) {
      for (const { property, value } of declarations(read(file))) {
        if (property === 'opacity' && !/^\s*[01]\s*$/.test(literalPart(value)) && /\d/.test(literalPart(value))) offenders.push(`${file}: ${value}`);
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('takes layers from the z tokens', () => {
    const offenders = [];
    for (const file of COMPONENT_CSS) {
      for (const { property, value } of declarations(read(file))) {
        // -1: a state layer under its own content (isolated stacking context).
        if (property === 'z-index' && value !== '-1' && !/^var\(--ds-z-/.test(value) && !/^var\(--ds-[\w-]+-z,\s*var\(--ds-z-/.test(value)) offenders.push(`${file}: ${value}`);
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('draws every link underline with the shared geometry tokens', () => {
    const offenders = [];
    for (const file of COMPONENT_CSS) {
      for (const { property, value } of declarations(read(file))) {
        if (['text-underline-offset', 'text-decoration-thickness'].includes(property) && /\d/.test(literalPart(value))) offenders.push(`${file}: ${property}`);
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('defines every custom property that is read without a fallback', () => {
    const css = cssBundle().map((file) => stripComments(read(file))).join('\n');
    const defined = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]));
    const used = [...css.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)].map((match) => match[1]);
    assert.deepEqual([...new Set(used)].filter((name) => !defined.has(name) && !RUNTIME.has(name)).sort(), []);
  });

  it('uses only the ds- prefix for classes and custom properties', () => {
    const offenders = [];
    for (const file of SRC_CSS) {
      const css = stripComments(read(file));
      for (const match of css.matchAll(/(?:var\(\s*|[;{\s])--([\w-]+)\s*[:,)]/g)) if (!match[1].startsWith('ds-')) offenders.push(`${file}: --${match[1]}`);
      for (const { selector } of rules(css)) {
        for (const match of selector.matchAll(/\.([a-z][\w-]*)/gi)) if (!match[1].startsWith('ds-')) offenders.push(`${file}: .${match[1]}`);
      }
    }
    assert.deepEqual([...new Set(offenders)], []);
  });

  it('bundles every stylesheet of src/', () => {
    const bundle = new Set(cssBundle());
    assert.deepEqual(SRC_CSS.filter((file) => file !== 'src/index.css' && !bundle.has(file)), []);
  });
});

describe('plain CSS for older browsers', () => {
  it('uses no @layer and no nesting, and has no stray comment ends', () => {
    for (const file of ALL_CSS) {
      const css = stripComments(read(file));
      assert.doesNotMatch(css, /\*\//, `${file}: text outside a comment (a stray "*/")`);
      assert.doesNotMatch(css, /@layer\b/, file);
      assert.doesNotMatch(css.replace(/url\([^)]*\)/g, ''), /&/, file);
    }
  });

  it('says so in the header where a file relies on a newer feature', () => {
    const features = /:has\(|color-mix\(|@container|container-type|\bcontainer:|\d+cqi|interpolate-size|\b\d*\.?\d+[sld]v[hwib]\b|linear\(0/;
    for (const file of SRC_CSS) {
      const css = read(file);
      if (!features.test(stripComments(css))) continue;
      const header = css.match(/^\/\*[\s\S]*?\*\//)?.[0] || '';
      assert.match(header, /Progressive:/, `${file} uses a newer feature: name it under "Progressive:" in the header`);
    }
  });

  it('uses top/right/bottom/left instead of inset (Safari 14.0 drops it)', () => {
    const offenders = [];
    for (const file of ALL_CSS) {
      for (const { property } of declarations(read(file))) if (property === 'inset') offenders.push(file);
    }
    assert.deepEqual(offenders, []);
  });

  it('gives keyboard focus rings a :focus fallback for browsers without :focus-visible', () => {
    // The ring sits on X:focus (:focus-visible implies :focus) and a separate
    // X:focus:not(:focus-visible) rule takes it off after a pointer click; a
    // browser without :focus-visible drops only that second rule. Deliberately
    // without: the radio card (its ring needs :has() anyway), the sheet body
    // (no ring on programmatic focus), the skip link (shown only while
    // focused) and the page base (the browser's own ring remains).
    const exempt = /\.ds-radio|\.ds-sheet__body|\.ds-skip|\.ds-base/;
    const focus = /:focus(?![-\w])/;
    const offenders = [];
    for (const file of SRC_CSS) {
      const all = rules(read(file));
      for (const { selector, body } of all) {
        if (!/(^|[;\s])outline\s*:/.test(body) || /outline\s*:\s*none/.test(body)) continue;
        for (const part of splitSelectors(selector)) {
          if (exempt.test(part)) continue;
          if (part.includes(':focus-visible')) { offenders.push(`${file}: ${part}: put the ring on :focus`); continue; }
          if (!focus.test(part)) continue;
          const off = part.replace(focus, ':focus:not(:focus-visible)');
          if (!all.some((rule) => rule.selector === off && /outline\s*:\s*none/.test(rule.body))) offenders.push(`${file}: ${off} missing`);
        }
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('never lists :focus-visible or :has() next to other selectors (one unknown selector drops the whole list)', () => {
    const offenders = [];
    for (const file of SRC_CSS) {
      for (const { selector } of rules(read(file))) {
        const parts = splitSelectors(selector);
        if (parts.length < 2) continue;
        for (const part of parts) if (/:focus-visible|:has\(/.test(part)) offenders.push(`${file}: ${selector}`);
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('scopes the page base to .ds-base without adding specificity', () => {
    for (const { selector } of rules(read('src/base.css'))) {
      for (const part of splitSelectors(selector)) assert.match(part, /:where\(\.ds-base\)/, part);
    }
  });

  it('puts tokens on .ds-theme, never on :root', () => {
    for (const file of ALL_CSS) assert.doesNotMatch(stripComments(read(file)), /:root\b/, file);
  });

  it('styles no bare element outside a .ds- scope', () => {
    const offenders = [];
    for (const file of COMPONENT_CSS.filter((path) => path !== 'src/base.css')) {
      for (const { selector } of rules(read(file))) {
        if (/^(from|to|\d+%)$/.test(selector)) continue;
        for (const part of splitSelectors(selector)) if (!/\.ds-/.test(part)) offenders.push(`${file}: ${part}`);
      }
    }
    assert.deepEqual(offenders, []);
  });
});

describe('accessibility details', () => {
  it('places every print rule after the screen rules for the same selector', () => {
    // Same specificity, so the later rule wins: a print reset placed before
    // the base rule would never apply.
    const source = cssBundle().map((file) => stripComments(read(file))).join('\n');
    const printRanges = [];
    for (const match of source.matchAll(/@media\s+print\s*\{/g)) {
      let depth = 1;
      let end = match.index + match[0].length;
      while (depth > 0 && end < source.length) {
        if (source[end] === '{') depth += 1;
        else if (source[end] === '}') depth -= 1;
        end += 1;
      }
      printRanges.push([match.index, end]);
    }
    const inPrint = (index) => printRanges.some(([start, end]) => index > start && index < end);
    const all = [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
      index: match.index,
      parts: splitSelectors(match[1].replace(/\s+/g, ' ').trim()),
      print: inPrint(match.index),
    }));
    const offenders = [];
    for (const rule of all.filter((entry) => entry.print)) {
      for (const part of rule.parts) {
        if (all.some((other) => !other.print && other.index > rule.index && other.parts.includes(part))) offenders.push(part);
      }
    }
    assert.ok(printRanges.length > 0, 'the bundle has print rules');
    assert.deepEqual(offenders, []);
  });

  it('lets aria-disabled buttons keep the pointer (tooltips), but blocks busy and disabled ones', () => {
    const button = rules(read('src/components/button.css'));
    const blocked = button.filter((rule) => /pointer-events:\s*none/.test(rule.body)).flatMap((rule) => splitSelectors(rule.selector));
    assert.ok(blocked.includes('.ds-btn:disabled') && blocked.includes('.ds-btn[aria-busy="true"]'), blocked.join());
    assert.ok(!blocked.some((part) => part.includes('aria-disabled')), blocked.join());
  });

  it('pads cards only through the padding hooks, so a theme can set them', () => {
    const sets = declarations(read('src/components/card.css')).filter((entry) => entry.property === '--ds-card-pad');
    assert.equal(sets.length, 3);
    for (const { value } of sets) assert.match(value, /^var\(--ds-card-padding(-sm|-filled)?, var\(--ds-space-\d\)\)$/);
  });

  it('keeps an edge on floating layers in forced colors (transparent outlines)', () => {
    const cases = [
      ['src/components/sheet.css', '.ds-sheet__panel'],
      ['src/components/toast.css', '.ds-toast'],
      ['src/components/tooltip.css', '.ds-tooltip'],
      ['src/components/shell.css', '.ds-drawer'],
    ];
    for (const [file, selector] of cases) {
      const outline = declarationsOf(read(file), selector).find((entry) => entry.property === 'outline');
      assert.match(outline?.value || '', /solid transparent$/, `${file}: ${selector}`);
    }
    const border = declarationsOf(read('src/components/dialog.css'), '.ds-dialog__box').find((entry) => entry.property === 'border');
    assert.equal(border?.value, 'var(--ds-dialog-border, 1px solid transparent)');
  });

  it('brings native selects back in forced colors, where background images vanish', () => {
    const select = forcedColorBlocks(read('src/components/form.css')).flatMap((block) => declarationsOf(block, 'select.ds-input'));
    assert.equal(select.find((entry) => entry.property === 'appearance')?.value, 'auto');
    assert.equal(select.find((entry) => entry.property === 'background-image')?.value, 'none');
  });

  it('keeps the loading bar visible in forced colors, where both fills become Canvas', () => {
    const blocks = forcedColorBlocks(read('src/components/loading.css'));
    const bar = blocks.flatMap((block) => declarationsOf(block, '.ds-loadbar__bar'));
    assert.equal(bar.find((entry) => entry.property === 'forced-color-adjust')?.value, 'none');
    assert.equal(bar.find((entry) => entry.property === 'background')?.value, 'Highlight');
    assert.ok(blocks.flatMap((block) => declarationsOf(block, '.ds-loadbar')).some((entry) => entry.property === 'outline'));
  });

  it('draws the masked glyphs of the fields (calendar, clear) from the icon set', () => {
    const masks = [...read('src/components/form.css').matchAll(/url\("data:image\/svg\+xml,([^"]+)"\)/g)].map((match) => decodeURIComponent(match[1]));
    const drawn = new Set();
    for (const svg of masks) {
      const inner = svg.replace(/^<svg[^>]*>|<\/svg>$/g, '').replace(/'/g, '"');
      const name = ['calendar', 'close'].find((glyph) => icons[glyph] === inner);
      assert.ok(name, `not a glyph of the set: ${inner}`);
      drawn.add(name);
      assert.match(svg, /stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/);
    }
    assert.deepEqual([...drawn].sort(), ['calendar', 'close']);
  });

  it('rings a date field while its calendar button has the focus', () => {
    const form = read('src/components/form.css');
    const ring = rules(form).find((rule) => rule.selector.split(/\s*,\s*/).includes('.ds-input:focus'));
    assert.ok(ring.selector.includes('.ds-input[type="date"]:focus-within'), ring.selector);
    // The error ring as well: a focused date field in error keeps its red ring.
    const invalid = rules(form).find((rule) => rule.selector.split(/\s*,\s*/).includes('.ds-input[aria-invalid="true"]:focus'));
    assert.ok(invalid.selector.includes('.ds-input[aria-invalid="true"]:focus-within'), invalid.selector);
  });

  it('keeps the outlined field hover from outranking the filled toolbar fields', () => {
    const hover = rules(read('src/components/form.css')).filter((rule) => /^\.ds-input[^\s,]*:hover/.test(rule.selector) && rule.body.includes('var(--ds-text)'));
    assert.deepEqual(hover.map((rule) => rule.selector), ['.ds-input:where(:hover:not(:focus-within, :disabled, [readonly], [aria-invalid="true"]))']);
  });

  it('shows the focus ring at once (no transition on outline)', () => {
    for (const file of COMPONENT_CSS) {
      for (const { property, value } of declarations(read(file))) {
        if (/^transition(-property)?$/.test(property)) assert.doesNotMatch(value, /\boutline\b|\ball\b/, `${file}: ${value}`);
      }
    }
  });

  it('lines up the figures of counts, times and key figures (tabular)', () => {
    const cases = [
      ['src/components/utilities.css', '.ds-muted'],
      ['src/components/utilities.css', '.ds-meta'],
      ['src/components/tile.css', '.ds-tile__value'],
      ['src/components/tile.css', '.ds-tile__note'],
      ['src/components/list.css', '.ds-facts dd'],
      ['src/components/table.css', '.ds-table'],
    ];
    for (const [file, selector] of cases) {
      const entries = declarationsOf(read(file), selector);
      assert.equal(entries.find((entry) => entry.property === 'font-variant-numeric')?.value, 'tabular-nums', `${file}: ${selector}`);
    }
  });

  it('hover choreography only for devices that hover', () => {
    const offenders = COMPONENT_CSS.flatMap((file) => hoverOutsideHoverBlocks(read(file)).map((selector) => `${file}: ${selector}`));
    assert.deepEqual(offenders, []);
    // The scanner must see a :hover rule outside a hover block, also when nested.
    const planted = '@media (hover: hover) { .ds-a:hover { color: red; } }\n'
      + '@supports (display: grid) { @media (min-width: 1px) { .ds-b:hover, .ds-c { color: red; } } }\n'
      + '.ds-d:hover { color: red; }';
    assert.deepEqual(hoverOutsideHoverBlocks(planted), ['.ds-b:hover', '.ds-d:hover']);
  });
});

export { ROOT };
