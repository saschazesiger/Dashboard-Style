/**
 * Guardrails of the stylesheets: motion only through tokens and one file of
 * keyframes, no palette, radius or type literals in components (so a theme
 * reaches every value), CSS within the browser baseline and its cascade
 * layers, and the forced-colors and accessibility details that are easy
 * to lose.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as icons from '../src/js/icons.js';
import {
  ROOT, cssBundle, declarations, declarationsOf, filesIn, forcedColorBlocks, literalPart, ms, read, rules, stripComments, withoutAtRuleBlocks,
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

/** The order statement every stylesheet of src/ starts with (dist/ds.css keeps one). */
const LAYER_STATEMENT = '@layer ds.tokens, ds.base, ds.components, ds.motion, ds.utilities;';
/** The layer block(s) of each file; every other file of src/components/ is ds.components. */
const LAYERS_OF = {
  'src/tokens.css': ['ds.tokens'],
  'src/base.css': ['ds.base'],
  'src/motion.css': ['ds.motion', 'ds.utilities'],
};

/**
 * Top-level items of a comment-free stylesheet, in order: statements as
 * { text } (`@import ...;`, `@layer a, b;`), blocks as { prelude, body }.
 */
function topLevel(css) {
  const items = [];
  let index = 0;
  while (index < css.length) {
    if (/\s/.test(css[index])) { index += 1; continue; }
    const semicolon = css.indexOf(';', index);
    const brace = css.indexOf('{', index);
    if (brace < 0 || (semicolon >= 0 && semicolon < brace)) {
      const end = semicolon < 0 ? css.length : semicolon + 1;
      items.push({ text: css.slice(index, end).replace(/\s+/g, ' ').trim() });
      index = end;
      continue;
    }
    let depth = 1;
    let end = brace + 1;
    while (depth > 0 && end < css.length) {
      if (css[end] === '{') depth += 1;
      else if (css[end] === '}') depth -= 1;
      end += 1;
    }
    items.push({ prelude: css.slice(index, brace).replace(/\s+/g, ' ').trim(), body: css.slice(brace + 1, end - 1) });
    index = end;
  }
  return items;
}

/**
 * Features newer than the baseline (Safari 16.4, Chrome 111, Firefox 128),
 * each with the name its file's "Progressive:" note must use. Baseline
 * features (:has(), color-mix(), container queries, svh/dvh) are not listed.
 */
const PROGRESSIVE = [
  [/linear\(/, 'linear()'],
  [/@starting-style/, '@starting-style'],
  [/allow-discrete/, 'allow-discrete'],
  [/(?<![\w-])popover(?![\w-])|:popover-open/, 'popover'],
  [/anchor-name|position-anchor|position-area|position-try|anchor\(/, 'anchor positioning'],
  [/view-transition/, 'View Transitions'],
  [/animation-timeline|scroll-timeline|view-timeline|animation-range|timeline-scope/, 'scroll-driven'],
  [/interpolate-size|calc-size\(/, 'interpolate-size'],
  [/::details-content/, '::details-content'],
  [/overflow-clip-margin/, 'overflow-clip-margin'],
  [/sibling-index\(|sibling-count\(/, 'sibling-index()'],
  [/text-wrap/, 'text-wrap'],
  [/scrollbar-color|scrollbar-width/, 'scrollbar-color'],
];

/** Plain :focus selectors that may draw an outline, each with its reason. */
const FOCUS_EXEMPT = [
  [/\.ds-input/, 'fields show an inset ring on any focus: typing needs to see where the caret is'],
  [/\.ds-skip/, 'the skip link is shown only while focused'],
];

/** Custom properties set at runtime by js/ or by the page (documented in docs/). */
const RUNTIME = new Set(['--ds-i', '--ds-indicator-x', '--ds-indicator-y', '--ds-indicator-w', '--ds-indicator-h', '--ds-progress', '--ds-toast-left', '--ds-toast-bottom', '--ds-toast-shift', '--ds-toast-shift-y', '--ds-toast-reserve']);

/** Every @keyframes of motion.css as { name: body } (the body holds its from/to/% blocks). */
const KEYFRAMES = Object.fromEntries([...stripComments(read('src/motion.css')).matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?\})\s*\}/g)].map((match) => [match[1], match[2]]));
/** The deprecated combined exits (fade + move in one keyframe), removed in 2.0. */
const DEPRECATED_EXITS = ['ds-sink-out', 'ds-scale-out', 'ds-slide-out'];
/** Loops of loading indicators: they may keep transform (P6 reworks them). */
const LOOPS = ['ds-spin', 'ds-pulse', 'ds-indeterminate'];
/** Keyframes that may rotate: spinners (P3 to P6 add loaders, chevrons and icon swaps). */
const ROTATE = ['ds-spin'];
/** Keyframes that may name both ends, each with its reason; every other one is from-only, or to-only for ds-*-out. */
const KEYFRAME_SHAPE_EXEMPT = new Map([
  ['ds-clip-in', 'clip-path does not interpolate to none, so both ends are named'],
  ['ds-clip-out', 'clip-path does not interpolate to none, so both ends are named'],
  ['ds-spin', 'a loop: one full turn to 360deg'],
  ['ds-pulse', 'a loop: dims at 50% and comes back'],
  ['ds-indeterminate', 'a loop: the segment enters on one side and leaves on the other'],
  ['ds-scan', 'a loop: the band travels from above the frame to below it'],
  ['ds-ripple', 'a ring that grows and fades from a set start (--ds-ripple-opacity)'],
]);
/** Movement exits that may run without ds-fade-out (selector → reason). P5 adds the opaque side sheet panel (D16). */
const EXIT_UNPAIRED = new Map();

/** Properties every transition and keyframe may animate (plus the registered --ds-* properties). */
const ANIMATABLE = new Set(['transform', 'translate', 'scale', 'opacity', 'color', 'background-color', 'border-color', 'outline-color',
  'text-decoration-color', 'fill', 'stroke', 'box-shadow', 'clip-path', 'border-radius']);
/** Animated properties allowed on one selector only, each with its reason. */
const ANIMATED_EXCEPTIONS = new Map([
  ['.ds-collapsible::details-content', { properties: ['height'], reason: 'the disclosure opens to auto, only where interpolate-size exists' }],
]);
/** Animated properties that a later phase removes (P8 asserts that this is empty). */
const ANIMATED_PENDING = new Map([
  ['.ds-indicator', { properties: ['width', 'height'], phase: 'P4 (moved by transform or clip-path)' }],
]);
/** The registered custom properties of src/ (they animate like any other property). */
const REGISTERED = new Set(SRC_CSS.flatMap((file) => [...stripComments(read(file)).matchAll(/@property\s+(--ds-[\w-]+)/g)].map((match) => match[1])));

/** The per-element motion hooks: registered in motion.css with inherits: false (the canonical list). */
const MOTION_HOOKS = ['--ds-motion-distance', '--ds-motion-scale', '--ds-motion-origin', '--ds-clip-from', '--ds-draw-length',
  '--ds-enter-keyframes', '--ds-enter-duration', '--ds-enter-easing', '--ds-enter-delay',
  '--ds-leave-keyframes', '--ds-leave-duration', '--ds-leave-easing', '--ds-i'];

/** The words of one entry of a list at top-level whitespace (var(...) and calc(...) stay whole). */
function words(entry) {
  const out = [];
  let depth = 0;
  let current = '';
  for (const char of entry.trim()) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (/\s/.test(char) && depth === 0) {
      if (current) out.push(current);
      current = '';
    } else current += char;
  }
  if (current) out.push(current);
  return out;
}

/** A time word in ms (0ms, 150ms, .2s, var(--ds-dur-*|--ds-loop-*|--ds-delay-*|--ds-stagger)), else undefined. */
function timeOf(word) {
  const literal = word.match(/^(\d*\.?\d+)(ms|s)$/);
  if (literal) return Number(literal[1]) * (literal[2] === 's' ? 1000 : 1);
  const token = word.match(/^var\((--ds-(?:dur|loop|delay)-[\w-]+|--ds-stagger)\)$/);
  return token ? ms(token[1]) : undefined;
}

/** The entries of an `animation` or `transition` shorthand as { name, words, times, easing, infinite }. */
function entriesOf(value) {
  return splitSelectors(value).map((entry) => {
    const parts = words(entry);
    return {
      name: parts[0],
      words: parts,
      times: parts.map(timeOf).filter((time) => time !== undefined),
      easing: parts.find((word) => /^var\(--ds-ease-[\w-]+\)$|^(linear|ease(-in|-out|-in-out)?|cubic-bezier\(.*\)|linear\(.*\))$/.test(word)),
      infinite: parts.includes('infinite'),
    };
  });
}

/** The fallback list of a hook read (`var(--hook, a, b)` → `a, b`). */
const fallbackOf = (value) => value.replace(/^var\(--[\w-]+,\s*/, '').replace(/\)$/, '');

/** Whether a keyframe changes opacity or a colour. */
const fades = (name) => /(^|[;{\s])(opacity|color|background(-color)?|border-color|outline-color|fill|stroke)\s*:/.test(KEYFRAMES[name] || '');

/** The longest duration (ms) the rule `selector` of `file` sets through `properties` (first time of each list entry). */
function longest(file, selector, properties) {
  const times = [];
  for (const { property, value } of declarationsOf(read(file), selector)) {
    if (!properties.includes(property)) continue;
    if (property === 'animation' || property === 'transition') {
      for (const entry of entriesOf(value)) if (entry.times.length) times.push(entry.times[0]);
    } else {
      const token = value.match(/--ds-dur-[\w-]+/);
      if (token) times.push(ms(token[0]));
    }
  }
  return times.length ? Math.max(...times) : undefined;
}

/**
 * Exit/entrance pairs, measured on the longest track of each side; each
 * side lists candidates [file, selector, properties], the first that sets
 * a duration wins (a variant without its own duration takes the base's).
 */
const M = 'src/motion.css';
const ENTER_BASE = [M, '.ds-enter', ['animation-duration']];
const LEAVE_BASE = [M, '.ds-leave', ['animation-duration']];
const RATIOS = [
  ['.ds-enter / .ds-leave', [ENTER_BASE], [LEAVE_BASE]],
  ['--scale', [[M, '.ds-enter--scale', ['--ds-enter-duration']], ENTER_BASE], [[M, '.ds-leave--scale', ['--ds-leave-duration']], LEAVE_BASE]],
  ['--slide', [[M, '.ds-enter--slide', ['--ds-enter-duration']], ENTER_BASE], [[M, '.ds-leave--slide', ['--ds-leave-duration']], LEAVE_BASE]],
  ['--pop', [[M, '.ds-enter--pop', ['--ds-enter-duration']], ENTER_BASE], [[M, '.ds-leave--pop', ['--ds-leave-duration']], LEAVE_BASE]],
  ['dialog', [['src/components/dialog.css', '.ds-dialog__box', ['animation']]], [['src/components/dialog.css', '.ds-dialog--closing .ds-dialog__box', ['animation']]]],
  ['side sheet', [['src/components/sheet.css', '.ds-sheet__panel', ['animation']]], [['src/components/sheet.css', '.ds-sheet--closing .ds-sheet__panel', ['animation']]]],
  ['modal drawer', [['src/components/shell.css', '.ds-app[data-drawer-open] .ds-drawer', ['transition']]], [['src/components/shell.css', '.ds-drawer', ['transition']]]],
  ['snackbar', [['src/components/toast.css', '.ds-toast', ['animation']]], [['src/components/toast.css', '.ds-toast', ['--ds-leave-duration']]]],
  ['tooltip', [['src/components/tooltip.css', '.ds-tooltip', ['animation']]], [['src/components/tooltip.css', '.ds-tooltip', ['--ds-leave-duration']]]],
];
const resolveDuration = (candidates) => candidates.map(([file, selector, properties]) => longest(file, selector, properties)).find((time) => time !== undefined);

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
    const enter = declarations(motion.slice(motion.indexOf('.ds-enter {'), motion.indexOf('.ds-leave {')));
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

  it('fills bars from zero only, gliding on the value curve (first render of a chart)', () => {
    const motion = stripComments(read('src/motion.css'));
    // The scale property multiplies the bar's own transform: scaleX(<share>).
    assert.match(motion, /@keyframes ds-fill-x\s*\{\s*from\s*\{\s*scale:\s*0 1;\s*\}\s*\}/);
    assert.match(motion, /@keyframes ds-fill-y\s*\{\s*from\s*\{\s*scale:\s*1 0;\s*\}\s*\}/);
    for (const axis of ['x', 'y']) {
      const fill = Object.fromEntries(declarationsOf(read('src/motion.css'), `.ds-enter--fill-${axis}`).map((entry) => [entry.property, entry.value]));
      assert.equal(fill['--ds-enter-keyframes'], `ds-fade-in, ds-fill-${axis}`);
      assert.equal(fill['--ds-enter-duration'], 'var(--ds-dur-glide)');
      assert.equal(fill['--ds-enter-easing'], 'var(--ds-ease-in-out), var(--ds-ease-value)');
    }
  });

  it('starts every exit at once and plays it once', () => {
    const leave = Object.fromEntries(declarationsOf(read('src/motion.css'), '.ds-leave').map((entry) => [entry.property, entry.value]));
    assert.equal(leave['animation-delay'], '0ms');
    assert.equal(leave['animation-iteration-count'], '1');
  });

  it('fades every .ds-leave variant out first and moves it separately', () => {
    const motion = stripComments(read('src/motion.css'));
    const leave = declarations(motion.slice(motion.indexOf('.ds-leave {'), motion.indexOf('.ds-collapsible')));
    const variants = [fallbackOf(leave.find((entry) => entry.property === 'animation-name').value), ...leave.filter((entry) => entry.property === '--ds-leave-keyframes').map((entry) => entry.value)];
    assert.ok(variants.length >= 5, variants.join(' | '));
    for (const list of variants) {
      const names = list.split(/\s*,\s*/);
      assert.equal(names[0], 'ds-fade-out', list);
      for (const name of names.slice(1)) assert.ok(!fades(name), `${name} must be movement only`);
    }
  });

  it('has no near-zero durations (a tiny duration on a loop races)', () => {
    assert.deepEqual(ALL_CSS.filter((file) => /\.0\d*1ms|0\.01ms/.test(read(file))), []);
  });

  it('keeps effect curves within [0, 1] and never decreasing (only the spring overshoots)', () => {
    const offenders = [];
    for (const file of ALL_CSS) {
      // The spring of floating movement is the one exemption (its contract: test/tokens.test.js).
      const css = stripComments(read(file)).replace(/--ds-ease-spatial:\s*linear\([^;]*\);/g, '');
      for (const match of css.matchAll(/cubic-bezier\(([^)]*)\)/g)) {
        if (!match[1].split(',').map(Number).every((value) => value >= 0 && value <= 1)) offenders.push(`${file}: ${match[0]}`);
      }
      for (const match of css.matchAll(/linear\(([^)]*\d[^)]*)\)/g)) {
        const outputs = match[1].split(',').map((stop) => Number(stop.trim().split(/\s+/)[0]));
        if (!outputs.every((value) => value >= 0 && value <= 1)) offenders.push(`${file}: linear(...) leaves [0, 1]`);
        if (outputs.some((value, index) => index > 0 && value < outputs[index - 1])) offenders.push(`${file}: linear(...) decreases`);
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('falls back from the spring to the decelerate curve where linear() is missing', () => {
    const declarations = [...stripComments(read('src/tokens.css')).matchAll(/--ds-ease-spatial:\s*([^;]+);/g)].map((match) => match[1]);
    assert.equal(declarations.length, 2);
    assert.equal(declarations[0], 'var(--ds-ease-out)');
    assert.match(declarations[1], /^linear\(/);
  });

  it('never moves anything on hover and never transforms on press', () => {
    // transform: none and var() values count too: a hover that resets a
    // transform moves the element back (the old disc loophole).
    const ACTIVE_EXEMPT = new Map(); // P3 adds the switch handle (it may grow while pressed, D6).
    const offenders = [];
    for (const file of ALL_CSS) {
      for (const { selector, body } of rules(read(file))) {
        const set = declarations(`${body};`).map((entry) => entry.property);
        const parts = splitSelectors(selector);
        if (parts.some((part) => part.includes(':hover'))) {
          const moves = set.filter((property) => /^(transform|translate|scale|rotate|top|right|bottom|left|inset|margin(-[\w-]+)?)$/.test(property));
          if (moves.length) offenders.push(`${file}: ${selector}: ${moves.join(', ')} on hover`);
        }
        if (parts.some((part) => part.includes(':active') && !ACTIVE_EXEMPT.has(part))) {
          const moves = set.filter((property) => /^(transform|translate|scale)$/.test(property));
          if (moves.length) offenders.push(`${file}: ${selector}: ${moves.join(', ')} on press`);
        }
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('runs the spring only on movement (effects never overshoot)', () => {
    const spatial = 'var(--ds-ease-spatial)';
    const offenders = [];
    for (const file of SRC_CSS) {
      for (const { selector, body } of rules(read(file))) {
        const own = Object.fromEntries(declarations(`${body};`).map((entry) => [entry.property, entry.value]));
        if (own.animation) {
          for (const entry of entriesOf(own.animation)) if (entry.easing === spatial && fades(entry.name)) offenders.push(`${file}: ${selector}: ${entry.name} on the spring`);
        }
        if (own.transition) {
          for (const entry of entriesOf(own.transition)) {
            if (entry.easing === spatial && !/^(transform|translate|scale|rotate|clip-path|border-radius)$/.test(entry.name)) offenders.push(`${file}: ${selector}: transition of ${entry.name} on the spring`);
          }
        }
      }
    }
    // The motion utilities pair --ds-enter-keyframes / --ds-leave-keyframes
    // with the easing at the same index (a variant inherits what it does not set).
    for (const kind of ['enter', 'leave']) {
      const base = Object.fromEntries(declarationsOf(read(M), `.ds-${kind}`).map((entry) => [entry.property, entry.value]));
      const defaults = { keyframes: fallbackOf(base['animation-name']), easing: fallbackOf(base['animation-timing-function']) };
      const variants = rules(read(M)).filter((rule) => new RegExp(`--ds-${kind}-(keyframes|easing)\\s*:`).test(rule.body));
      for (const { selector, body } of [{ selector: `.ds-${kind}`, body: '' }, ...variants]) {
        const own = Object.fromEntries(declarations(`${body};`).map((entry) => [entry.property, entry.value]));
        const names = (own[`--ds-${kind}-keyframes`] || defaults.keyframes).split(/\s*,\s*/);
        const easings = splitSelectors(own[`--ds-${kind}-easing`] || defaults.easing);
        names.forEach((name, index) => {
          if (easings[index % easings.length] === spatial && fades(name)) offenders.push(`${M}: ${selector}: ${name} on the spring`);
        });
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('pairs every movement exit with ds-fade-out and keeps the deprecated exits unused', () => {
    const offenders = [];
    for (const file of SRC_CSS) {
      for (const { selector, body } of rules(read(file))) {
        for (const { property, value } of declarations(`${body};`)) {
          let names;
          if (property === 'animation') names = entriesOf(value).map((entry) => entry.name);
          else if (property === 'animation-name' || property === '--ds-leave-keyframes') names = splitSelectors(fallbackOf(value));
          else continue;
          const moves = names.filter((name) => /^ds-[\w-]+-out$/.test(name) && name !== 'ds-fade-out');
          if (moves.length && !names.includes('ds-fade-out') && !EXIT_UNPAIRED.has(selector)) offenders.push(`${file}: ${selector}: ${moves.join(', ')} without ds-fade-out`);
        }
      }
    }
    assert.deepEqual(offenders, []);
    for (const file of [...SRC_CSS, ...filesIn('src/js')]) {
      const source = file.endsWith('.css') ? stripComments(read(file)) : read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      for (const name of DEPRECATED_EXITS) {
        const uses = source.split(name).length - 1 - (source.includes(`@keyframes ${name} `) ? 1 : 0);
        assert.equal(uses, 0, `${file} uses the deprecated ${name}`);
      }
    }
  });

  it('keeps every exit at 0.3-0.8 of its entrance (longest track)', () => {
    for (const [name, entrance, exit] of RATIOS) {
      const enter = resolveDuration(entrance);
      const leave = resolveDuration(exit);
      assert.ok(enter > 0 && leave > 0, `${name}: ${enter}/${leave}`);
      const ratio = leave / enter;
      assert.ok(leave < enter && ratio >= 0.3 && ratio <= 0.8, `${name}: exit ${leave}ms / entrance ${enter}ms = ${ratio.toFixed(2)}`);
    }
    // The table reads what the docs promise.
    assert.deepEqual(RATIOS.map(([, entrance, exit]) => `${resolveDuration(entrance)}/${resolveDuration(exit)}`),
      ['250/150', '250/200', '350/200', '250/150', '250/150', '350/200', '350/200', '250/150', '150/100']);
  });

  it('shapes keyframes: entrances from-only, exits to-only, movement on translate and scale', () => {
    for (const [name, body] of Object.entries(KEYFRAMES)) {
      const stops = rules(body).map((rule) => rule.selector);
      if (!KEYFRAME_SHAPE_EXEMPT.has(name)) assert.deepEqual(stops, [/-out$/.test(name) ? 'to' : 'from'], name);
      if (/-out$/.test(name) && name !== 'ds-fade-out' && !DEPRECATED_EXITS.includes(name)) assert.ok(!/opacity\s*:/.test(body), `${name}: an exit is movement only`);
      if (!LOOPS.includes(name) && !DEPRECATED_EXITS.includes(name)) assert.doesNotMatch(body, /(^|[;{\s])transform\s*:/, `${name}: use translate and scale`);
    }
    assert.deepEqual(rules(KEYFRAMES['ds-press-ripple']).map((rule) => rule.selector), ['from']);
  });

  it('times loops with --ds-loop-* and one-shots with --ds-dur-*', () => {
    const offenders = [];
    for (const file of SRC_CSS) {
      for (const { selector, body } of rules(read(file))) {
        const own = Object.fromEntries(declarations(`${body};`).map((entry) => [entry.property, entry.value]));
        // none and the CSS-wide keywords (revert-layer hands a loader back to its own timing) carry no duration.
        if (own.animation && !/^(none|inherit|initial|unset|revert|revert-layer)$/.test(own.animation)) {
          for (const entry of entriesOf(own.animation)) {
            const duration = entry.words.find((word) => timeOf(word) !== undefined);
            const expected = entry.infinite ? /^var\(--ds-loop-/ : /^var\(--ds-dur-/;
            if (!expected.test(duration || '')) offenders.push(`${file}: ${selector}: ${entry.words.join(' ')}`);
          }
        }
        if (own['animation-duration']) {
          const expected = own['animation-iteration-count'] === 'infinite' ? /var\(--ds-loop-/ : /var\(--ds-(dur|loop)-/;
          if (!expected.test(own['animation-duration'])) offenders.push(`${file}: ${selector}: animation-duration: ${own['animation-duration']}`);
        }
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('animates only the allowed properties', () => {
    const offenders = [];
    const allowed = (selector, property) => ANIMATABLE.has(property) || REGISTERED.has(property)
      || [ANIMATED_EXCEPTIONS, ANIMATED_PENDING].some((map) => map.get(selector)?.properties.includes(property));
    for (const file of SRC_CSS) {
      for (const { selector, body } of rules(read(file))) {
        for (const { property, value } of declarations(`${body};`)) {
          if (property !== 'transition' && property !== 'transition-property') continue;
          for (const entry of entriesOf(value)) {
            const animated = entry.name;
            if (animated === 'none' || animated === 'outline-offset') continue; // the focus snap: a transition, never a keyframe
            if (/^(all|font-weight)$/.test(animated)) offenders.push(`${file}: ${selector}: never ${animated}`);
            else if (/^(visibility|display|content-visibility|overlay)$/.test(animated)) {
              // A discrete property flips: as a 0ms step, or with allow-discrete.
              if (!(entry.times[0] === 0 || entry.words.includes('allow-discrete'))) offenders.push(`${file}: ${selector}: ${animated} must step`);
            } else if (animated === 'rotate') offenders.push(`${file}: ${selector}: rotate only in the ROTATE keyframes`);
            else if (!allowed(selector, animated)) offenders.push(`${file}: ${selector}: ${animated}`);
          }
        }
      }
    }
    for (const [name, body] of Object.entries(KEYFRAMES)) {
      for (const { property, value } of declarations(body)) {
        const rotates = property === 'rotate' || (property === 'transform' && /rotate/.test(value));
        if (rotates && !ROTATE.includes(name)) offenders.push(`@keyframes ${name}: rotate`);
        else if (property === 'stroke-dashoffset' && name !== 'ds-draw') offenders.push(`@keyframes ${name}: stroke-dashoffset only in ds-draw`);
        else if (!rotates && property !== 'stroke-dashoffset' && !ANIMATABLE.has(property) && !REGISTERED.has(property)) offenders.push(`@keyframes ${name}: ${property}`);
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('gives the per-element motion hooks token values only', () => {
    const keyframe = /^ds-[\w-]+$/;
    const token = /var\(--ds-(dur|ease|distance|delay|scale)-[\w-]+\)|var\(--ds-stagger\)/g;
    const offenders = [];
    for (const file of SRC_CSS.filter((path) => path !== 'src/tokens.css')) {
      for (const { property, value } of declarations(read(file))) {
        if (!/^--ds-[\w-]*(duration|delay|easing|distance|scale|keyframes)/.test(property)) continue;
        const ok = splitSelectors(value.replace(token, 'T')).every((item) => /^(T|0|0px|-?\d*\.?\d+%|calc\([-\s\dT.*+/]*\))$/.test(item) || (keyframe.test(item) && KEYFRAME_NAMES.has(item)));
        if (!ok) offenders.push(`${file}: ${property}: ${value}`);
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('registers exactly the canonical motion hooks, as documented', () => {
    const registered = [...stripComments(read(M)).matchAll(/@property\s+(--ds-[\w-]+)\s*\{([^}]*)\}/g)]
      .filter((match) => /inherits:\s*false/.test(match[2])).map((match) => match[1]);
    assert.deepEqual([...registered].sort(), [...MOTION_HOOKS].sort());
    const docs = read('docs/motion.md');
    const paragraph = docs.slice(docs.indexOf('Per-element settings'), docs.indexOf('Unregistered', docs.indexOf('Per-element settings')));
    const documented = [...new Set([...paragraph.matchAll(/`(--ds-[\w-]+)`/g)].map((match) => match[1]))];
    assert.deepEqual(documented.sort(), [...MOTION_HOOKS].sort());
  });

  it('closes dialog and sheet with the backdrop still catching clicks', () => {
    for (const [file, block, part] of [['src/components/dialog.css', 'ds-dialog', 'ds-dialog__box'], ['src/components/sheet.css', 'ds-sheet', 'ds-sheet__panel']]) {
      const blocked = rules(read(file)).filter((rule) => /pointer-events:\s*none/.test(rule.body)).flatMap((rule) => splitSelectors(rule.selector));
      assert.ok(blocked.includes(`.${block}--closing .${part}`), `${file}: the ${part} lets clicks through while it leaves`);
      assert.deepEqual(blocked.filter((selector) => selector.includes(`${block}--closing`) && !selector.endsWith(`.${part}`)), [], `${file}: only the ${part}`);
    }
  });

  it('hides with the hidden attribute without .ds-base', () => {
    const hides = (file, selector) => rules(read(file)).some((rule) => splitSelectors(rule.selector).includes(`${selector}[hidden]`) && /display:\s*none/.test(rule.body));
    for (const [file, selector] of [['src/components/dialog.css', '.ds-dialog'], ['src/components/sheet.css', '.ds-sheet'], ['src/components/combobox.css', '.ds-combo__popup'], ['src/components/tooltip.css', '.ds-tooltip']]) {
      assert.ok(hides(file, selector), `${file}: ${selector}[hidden] { display: none }`);
    }
    // Generic: markup in a header that shows `hidden` on a class which sets display.
    const offenders = [];
    for (const file of filesIn('src/components', (path) => path.endsWith('.css'))) {
      const header = read(file).match(/^\/\*[\s\S]*?\*\//)?.[0] || '';
      for (const tag of header.matchAll(/<\w+\s[^>]*>/g)) {
        if (!/\shidden(?=[\s>])/.test(tag[0])) continue;
        for (const name of (tag[0].match(/class="([^"]*)"/)?.[1] || '').split(/\s+/).filter(Boolean)) {
          if (declarationsOf(read(file), `.${name}`).some((entry) => entry.property === 'display' && entry.value !== 'none') && !hides(file, `.${name}`)) offenders.push(`${file}: .${name}`);
        }
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

describe('CSS for the baseline', () => {
  it('declares the canonical layer order first in every file of src/', () => {
    for (const file of SRC_CSS) {
      const items = topLevel(stripComments(read(file)));
      assert.equal(items[0]?.text, LAYER_STATEMENT, `${file}: the layer statement comes first`);
    }
  });

  it('puts every rule of src/ into its file\'s layer (only @property stays outside)', () => {
    for (const file of SRC_CSS) {
      const items = topLevel(stripComments(read(file))).slice(1);
      const expected = file === 'src/index.css' ? [] : LAYERS_OF[file] || ['ds.components'];
      const blocks = items.filter((item) => item.body !== undefined && !/^@property\s/.test(item.prelude));
      assert.deepEqual(blocks.map((item) => item.prelude), expected.map((name) => `@layer ${name}`), file);
      const statements = items.filter((item) => item.body === undefined);
      const allowed = file === 'src/index.css' ? /^@import '[^']+';$/ : /^$/;
      assert.deepEqual(statements.map((item) => item.text).filter((text) => !allowed.test(text)), [], file);
    }
  });

  it('keeps keyframes in ds.motion and the motion utilities in ds.utilities', () => {
    const items = topLevel(stripComments(read('src/motion.css')));
    const motion = items.find((item) => item.prelude === '@layer ds.motion').body;
    const utilities = items.find((item) => item.prelude === '@layer ds.utilities').body;
    assert.equal([...motion.matchAll(/@keyframes\s+([\w-]+)/g)].length, KEYFRAME_NAMES.size);
    assert.doesNotMatch(utilities, /@keyframes/);
    assert.deepEqual(rules(motion).filter((rule) => !/^(from|to|\d+%)$/.test(rule.selector)), []);
    const selectors = rules(utilities).flatMap((rule) => splitSelectors(rule.selector));
    for (const utility of ['.ds-enter', '.ds-leave', '.ds-stagger > *', '.ds-reveal', '.ds-collapsible']) {
      assert.ok(selectors.includes(utility), utility);
    }
    assert.deepEqual(selectors.filter((selector) => !/^\.ds-(enter|leave|stagger|reveal|collapsible)\b/.test(selector)), []);
  });

  it('leaves themes, fonts and the styleguide unlayered', () => {
    for (const file of [...ALL_CSS.filter((path) => !path.startsWith('src/')), 'styleguide/styleguide.css']) {
      assert.doesNotMatch(stripComments(read(file)), /@layer\b/, file);
    }
  });

  it('uses no nesting and has no stray comment ends', () => {
    for (const file of ALL_CSS) {
      const css = stripComments(read(file));
      assert.doesNotMatch(css, /\*\//, `${file}: text outside a comment (a stray "*/")`);
      assert.doesNotMatch(css.replace(/url\([^)]*\)/g, ''), /&/, file);
    }
  });

  it('keeps !important to its allowlist', () => {
    const found = [];
    for (const file of ALL_CSS) {
      for (const { selector, body } of rules(read(file))) {
        for (const { property, value } of declarations(`${body};`)) if (/!important/.test(value)) found.push(`${file}: ${selector}: ${property}`);
      }
    }
    const allowed = new Set([
      'src/base.css: :where(.ds-base) [hidden]: display',
      ...['position', 'top', 'left', 'width', 'height', 'padding', 'margin', 'overflow', 'clip', 'white-space', 'border']
        .map((property) => `src/components/utilities.css: .ds-sr: ${property}`),
      'src/components/utilities.css: .ds-num: text-align',
      'src/components/utilities.css: .ds-center: text-align',
      'src/components/shell.css: .ds-theme svg: color',
    ]);
    assert.deepEqual(found.filter((entry) => !allowed.has(entry)), []);
    assert.deepEqual([...allowed].filter((entry) => !found.includes(entry)), [], 'an allowlisted !important is gone: shorten the list');
  });

  it('names every feature newer than the baseline under "Progressive:" in the header', () => {
    for (const file of SRC_CSS) {
      const source = read(file);
      const css = stripComments(source);
      const header = source.match(/^\/\*[\s\S]*?\*\//)?.[0] || '';
      const note = header.includes('Progressive:') ? header.slice(header.indexOf('Progressive:')) : '';
      for (const [pattern, name] of PROGRESSIVE) {
        if (pattern.test(css)) assert.ok(note.includes(name), `${file} uses ${name}: name it under "Progressive:" in the header`);
      }
    }
  });

  it('puts focus rings on :focus-visible', () => {
    const plainFocus = /:focus(?![-\w])/;
    const ring = (body) => /(^|[;\s])outline\s*:/.test(body) && !/(^|[;\s])outline\s*:\s*none/.test(body);
    const offenders = [];
    for (const file of SRC_CSS) {
      const all = rules(read(file));
      for (const { selector, body } of all) {
        for (const part of splitSelectors(selector)) {
          if (part.includes(':focus:not(:focus-visible)')) offenders.push(`${file}: ${part}: use :focus-visible`);
          if (ring(body) && plainFocus.test(part) && !FOCUS_EXEMPT.some(([pattern]) => pattern.test(part))) offenders.push(`${file}: ${part}: ring on :focus`);
          if (/(^|[;\s])outline\s*:\s*none/.test(body) && part.includes(':focus-visible')) {
            // The ring moved to another element: it must follow the same :focus-visible through :has().
            const compound = part.split(/\s*[\s>+~]\s*/).find((piece) => piece.includes(':focus-visible'));
            const moved = all.some((other) => ring(other.body) && splitSelectors(other.selector).some((sel) => sel.includes(`:has(${compound})`)));
            if (!moved) offenders.push(`${file}: ${part}: outline: none without a ring on :has(${compound})`);
          }
        }
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
