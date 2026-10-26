/**
 * Guardrails of the stylesheets: motion only through tokens and one file of
 * keyframes, no palette, radius or type literals in components (so a theme
 * reaches every value), CSS within the browser baseline and its cascade
 * layers, and the forced-colors and accessibility details that are easy
 * to lose.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import * as icons from '../src/js/icons.js';
import { RIPPLE_HOSTS } from '../src/js/ripple.js';
import {
  ROOT, atRuleBlocks, cssBundle, declarations, declarationsOf, filesIn, forcedColorBlocks, literalPart, ms, read, rules, stripComments, withoutAtRuleBlocks,
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
  'src/optional/view-transitions.css': ['ds.utilities'],
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
  [/scrollbar-gutter/, 'scrollbar-gutter'],
];

/** Plain :focus selectors that may draw an outline, each with its reason. */
const FOCUS_EXEMPT = [
  [/\.ds-input/, 'fields show an inset ring on any focus: typing needs to see where the caret is'],
  [/\.ds-skip/, 'the skip link is shown only while focused'],
];

/** Custom properties set at runtime by js/ or by the page (documented in docs/). */
const RUNTIME = new Set([
  '--ds-i',
  '--ds-ripple-x',
  '--ds-ripple-y',
  '--ds-ripple-r',
  '--ds-indicator-x',
  '--ds-indicator-y',
  '--ds-indicator-w',
  '--ds-indicator-h',
  '--ds-indicator-dur',
  '--ds-indicator-t',
  '--ds-indicator-r',
  '--ds-indicator-b',
  '--ds-indicator-l',
  '--ds-indicator-radius',
  '--ds-progress',
  '--ds-toast-left',
  '--ds-toast-bottom',
  '--ds-toast-shift',
  '--ds-toast-shift-y',
  '--ds-toast-reserve',
  '--ds-tooltip-x',
  '--ds-tooltip-y',
  '--ds-menu-x',
  '--ds-menu-y',
  '--ds-chips-backdrop',
  '--ds-flip-backdrop',
  '--ds-viewport-height',
  '--ds-keyboard-inset',
  '--ds-scrollbar-height',
  '--ds-scrollbar-width',
  '--ds-table-pin-width',
]);

/** Every @keyframes of motion.css as { name: body } (the body holds its from/to/% blocks). */
const KEYFRAMES = Object.fromEntries([...stripComments(read('src/motion.css')).matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?\})\s*\}/g)].map((match) => [match[1], match[2]]));
/** The deprecated combined exits (fade + move in one keyframe), removed in 2.0. */
const DEPRECATED_EXITS = ['ds-sink-out', 'ds-scale-out', 'ds-slide-out'];
/** The selector of a keyframe stop: from, to, percentages (with decimals), or a list of them ("0%, 100%"). */
const KEYFRAME_STOP = /^(from|to|\d+(\.\d+)?%)(\s*,\s*(from|to|\d+(\.\d+)?%))*$/;
/** Loops of loading indicators that keep transform: the turn of the spinner and the deprecated ds-indeterminate. */
const LOOPS = ['ds-spin', 'ds-pulse', 'ds-indeterminate'];
/**
 * The loops of the loading indicators (1.4.0), each with its reason: many
 * stops or one end only. Their stops come from scripts/motion-curves.mjs
 * where they are generated.
 */
const LOADER_LOOPS = new Map([
  ['ds-spinner-arc', 'generated: the arc of the spinner grows and shrinks four times per loop'],
  ['ds-loader-morph', 'generated: the seven loader shapes at k/7, the first again at 100%'],
  ['ds-loader-turn', 'a loop: one turn to 1turn'],
  ['ds-progress-head', 'generated: the heads of the two indeterminate segments'],
  ['ds-progress-tail', 'generated: the tails of the two indeterminate segments'],
  ['ds-progress-wave', 'a loop: the wave mask travels one wavelength'],
  ['ds-skeleton-wave', 'generated: the sweep of the skeleton wave, then its rest'],
]);
/** Keyframes that may name both ends, each with its reason; every other one is from-only, or to-only for ds-*-out. */
const KEYFRAME_SHAPE_EXEMPT = new Map([
  ['ds-clip-in', 'clip-path does not interpolate to none, so both ends are named'],
  ['ds-clip-out', 'clip-path does not interpolate to none, so both ends are named'],
  ['ds-spin', 'a loop: one full turn to 360deg'],
  ['ds-pulse', 'a loop: dims at 50% and comes back'],
  ['ds-indeterminate', 'a loop: the segment enters on one side and leaves on the other'],
  ['ds-scan', 'a loop: the band travels from above the frame to below it'],
  ['ds-ripple', 'a ring that grows and fades from a set start (--ds-ripple-opacity)'],
  ['ds-scroll-fade', 'scroll-linked: both ends named, so an inactive timeline (a scroller without overflow) leaves the element\'s own opacity 0'],
  ['ds-edge-fade', 'scroll-linked: a position on the table\'s scroll timeline, not an entrance, so both ends are named'],
  ...LOADER_LOOPS,
]);
/**
 * Movement exits that may run without ds-fade-out (selector → reason). Each
 * rule must set --ds-motion-distance: var(--ds-distance-sheet) itself: only
 * a full-distance slide leaves the screen without a fade.
 */
const EXIT_UNPAIRED = new Map([
  ['.ds-sheet--closing:not([data-state]) .ds-sheet__panel', 'the opaque side sheet panel slides its full width off screen (D16); phones: down'],
]);

/** Properties every transition and keyframe may animate (plus the registered --ds-* properties). */
const ANIMATABLE = new Set(['transform', 'translate', 'scale', 'opacity', 'color', 'background-color', 'border-color', 'outline-color',
  'text-decoration-color', 'fill', 'stroke', 'box-shadow', 'clip-path']);
/** Declarations of the rules whose selector list (split at top-level commas) contains `selector`. */
const declarationsAt = (css, selector) => rules(css).filter((rule) => splitSelectors(rule.selector).includes(selector)).flatMap((rule) => declarations(`${rule.body};`));
/** A drawn glyph (pathLength="1") or what it inherits from (an icon-swap face, a chip's check): stroke-dashoffset may transition there (drawn checks). */
const drawnGlyph = (selector) => splitSelectors(selector).every((part) => /\[pathLength\]$|> \.ds-icon-swap__[ab]$|\.ds-chip__check$/.test(part));
/** The two timings of the press morph: the press-in (micro, decelerating) and the release (medium, on the spring). */
const PRESS_MORPH = ['var(--ds-dur-micro) var(--ds-ease-out)', 'var(--ds-dur-medium) var(--ds-ease-spatial)'];
/**
 * The named exceptions of the animate list, exactly those of "What may
 * animate" in plans/motion-2.md and in its order (EXCEPTION_SPEC below);
 * rule 1 of docs/motion.md lists the same (tested). Each is property →
 * { use, properties, keyframes, transitions, script }: `properties` the
 * CSS properties it covers (default: the key), `keyframes` the @keyframes
 * that may animate it, `transitions` where a transition may (selector →
 * reason, or a check of (selector, entry) where a list would be endless),
 * `script` the module that animates it through el.animate().
 */
const EXCEPTIONS = new Map([
  ['rotate', {
    use: 'spinners, loaders, disclosure chevrons and icon swaps',
    keyframes: ['ds-spin', 'ds-loader-turn'],
    transitions: new Map([
      ['.ds-combo__toggle svg', 'disclosure chevrons: the combobox chevron turns 180deg with its list (D25)'],
      ['.ds-chevron', 'disclosure chevrons: the shared chevron turns 180deg with the expansion (D25)'],
      ['.ds-errors .ds-errors__chevron', 'disclosure chevrons: the errors list chevron turns 180deg with the list (D25)'],
      ['.ds-table__sort-arrow', 'icon swaps: the one arrow of the marked column turns 180deg between ascending and descending'],
    ]),
  }],
  ['border-radius', {
    use: 'the press morph',
    keyframes: [],
    // Every action host morphs (a list would be the ripple host list); the timing says it is the morph.
    transitions: (selector, entry) => PRESS_MORPH.includes(entry.words.slice(1, 3).join(' ')),
  }],
  ['outline-offset', {
    use: 'the focus snap',
    keyframes: [], // a transition, never a keyframe, so it cannot take over an element's animation
    transitions: (selector, entry) => entry.words[1] === 'var(--ds-dur-fast)' && entry.easing === 'var(--ds-ease-out)',
  }],
  ['stroke-dashoffset', { use: 'drawn checks', keyframes: ['ds-draw'], transitions: (selector) => drawnGlyph(selector) }],
  ['mask-position', { use: 'the travelling progress wave', properties: ['mask-position', '-webkit-mask-position'], keyframes: ['ds-progress-wave'], transitions: new Map() }],
  ['width', {
    use: 'the chip check slot',
    keyframes: [],
    transitions: new Map([['.ds-chip__body::after', 'the check slot of a chip: a layout size on --ds-ease-out (D29)']]),
  }],
  ['height', {
    use: '.ds-collapsible, the validation message room and expandable rows',
    properties: ['height', 'grid-template-rows'],
    keyframes: [],
    transitions: new Map([
      ['.ds-collapsible::details-content', 'the disclosure closes (0) on --ds-ease-in, only where interpolate-size exists'],
      ['.ds-collapsible[open]::details-content', 'the disclosure opens to auto on --ds-ease-out (D29), only where interpolate-size exists'],
      ['.ds-field__hint--error', 'the room of a validation message opens to auto on --ds-ease-out (D29), only where interpolate-size exists'],
      ['.ds-table__expand', 'an expandable table row closes (0fr, grid-template-rows) on --ds-ease-in: a layout size (D29)'],
      ['tr:has(.ds-table__toggle[aria-expanded="true"]) + .ds-table__detail .ds-table__expand', 'an expandable table row opens (1fr, grid-template-rows) on --ds-ease-out (D29)'],
    ]),
  }],
  ['min-height', { use: 'a flip() container shrinking after its removed items left', keyframes: [], transitions: new Map(), script: 'src/js/motion.js' }],
]);
/** "What may animate" in plans/motion-2.md, property by property (the authority for EXCEPTIONS). */
const EXCEPTION_SPEC = ['rotate', 'border-radius', 'outline-offset', 'stroke-dashoffset', 'mask-position', 'width', 'height', 'min-height'];
/** Whether a named exception lets `selector` transition `property` (`entry`: the transition's list entry). */
const transitionException = (selector, property, entry) => [...EXCEPTIONS].some(([key, exception]) => (exception.properties || [key]).includes(property)
  && (typeof exception.transitions === 'function' ? exception.transitions(selector, entry) : exception.transitions.has(selector)));
/** Whether the @keyframes `name` may animate `property` (rotate also through transform: rotate()). */
const keyframeException = (name, property) => [...EXCEPTIONS].some(([key, exception]) => (exception.properties || [key]).includes(property) && exception.keyframes.includes(name));
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
  for (const { property, value } of declarationsAt(read(file), selector)) {
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
  ['.ds-enter--scale / .ds-leave--scale', [[M, '.ds-enter--scale', ['--ds-enter-duration']], ENTER_BASE], [[M, '.ds-leave--scale', ['--ds-leave-duration']], LEAVE_BASE]],
  ['.ds-enter--slide / .ds-leave--slide', [[M, '.ds-enter--slide', ['--ds-enter-duration']], ENTER_BASE], [[M, '.ds-leave--slide', ['--ds-leave-duration']], LEAVE_BASE]],
  ['.ds-enter--pop / .ds-leave--pop', [[M, '.ds-enter--pop', ['--ds-enter-duration']], ENTER_BASE], [[M, '.ds-leave--pop', ['--ds-leave-duration']], LEAVE_BASE]],
  ['dialog (DS.overlay)', [['src/components/dialog.css', '.ds-dialog[data-state] .ds-dialog__box', ['transition']]], [['src/components/dialog.css', '.ds-dialog[data-state="closed"] .ds-dialog__box', ['transition']]]],
  ['dialog (keyframes)', [['src/components/dialog.css', '.ds-dialog:not([data-state]) .ds-dialog__box', ['animation']]], [['src/components/dialog.css', '.ds-dialog--closing:not([data-state]) .ds-dialog__box', ['animation']]]],
  ['side sheet (DS.overlay)', [['src/components/sheet.css', '.ds-sheet[data-state] .ds-sheet__panel', ['transition']]], [['src/components/sheet.css', '.ds-sheet[data-state="closed"] .ds-sheet__panel', ['transition']]]],
  ['side sheet (keyframes)', [['src/components/sheet.css', '.ds-sheet:not([data-state]) .ds-sheet__panel', ['animation']]], [['src/components/sheet.css', '.ds-sheet--closing:not([data-state]) .ds-sheet__panel', ['animation']]]],
  ['modal drawer', [['src/components/shell.css', '.ds-app[data-drawer-open] .ds-drawer', ['transition']]], [['src/components/shell.css', '.ds-drawer', ['transition']]]],
  ['snackbar', [['src/components/toast.css', '.ds-toast', ['animation']]], [['src/components/toast.css', '.ds-toast', ['--ds-leave-duration']]]],
  ['tooltip (DS.overlay)', [['src/components/tooltip.css', '.ds-tooltip[data-state]', ['transition']]], [['src/components/tooltip.css', '.ds-tooltip[data-state="closed"]', ['transition']]]],
  ['tooltip (keyframes)', [['src/components/tooltip.css', '.ds-tooltip:not([data-state])', ['animation']]], [['src/components/tooltip.css', '.ds-tooltip:not([data-state])', ['--ds-leave-duration']]]],
  ['combobox list', [['src/components/combobox.css', '.ds-combo__popup[data-state]', ['transition']]], [['src/components/combobox.css', '.ds-combo__popup[data-state="closed"]', ['transition']]]],
  ['menu', [['src/components/menu.css', '.ds-menu[data-state]', ['transition']]], [['src/components/menu.css', '.ds-menu[data-state="closed"]', ['transition']]]],
];
/**
 * Old/new pairs outside the ratio, each with its reason (the test checks
 * that they exist): the "View transitions" section of motion.css.
 */
const RATIO_EXEMPT = new Map([
  ['.ds-theme::view-transition-old(ds-view)', 'view transitions: old and new are simultaneous images of one moment, not a component\'s entrance and exit; fade-through lets the old view go in --ds-dur-instant by design'],
  ['.ds-theme[data-ds-vt="forward"]::view-transition-old(ds-view)', 'view transitions: shared axis, as fade-through'],
  ['.ds-theme[data-ds-vt="back"]::view-transition-old(ds-view)', 'view transitions: shared axis, as fade-through'],
  ['.ds-theme[data-ds-vt="container"]::view-transition-old(ds-container)', 'view transitions: the container\'s two images cross while its group grows'],
]);
/**
 * The control marks of 1.1.0: what leaves takes 0.4-0.67 of what enters
 * (an exit that is quick but still seen), measured like RATIOS.
 */
const CHECKBOX = ':is(.ds-check input[type="checkbox"], .ds-table input[type="checkbox"]:where(:not(.ds-switch *, .ds-chip *)), .ds-checkbox)';
const RADIO = ':is(.ds-check input[type="radio"], .ds-radio input, .ds-radio-input)';
const SWAP_SHOWN = '.ds-icon-swap:where([data-swap="b"], [aria-pressed="true"] :not([data-swap])) > .ds-icon-swap__b';
const CONTROL_RATIOS = [
  ['chip check', [['src/components/chip.css', '.ds-chip__input:checked + .ds-chip__body .ds-chip__check', ['transition']]], [['src/components/chip.css', '.ds-chip__check', ['transition']]]],
  ['checkbox mark', [['src/components/form.css', `${CHECKBOX}:checked::before`, ['transition']]], [['src/components/form.css', `${CHECKBOX}::before`, ['transition']]]],
  ['radio dot', [['src/components/form.css', `${RADIO}:checked::after`, ['transition']]], [['src/components/form.css', `${RADIO}::after`, ['transition']]]],
  ['button faces', [['src/components/button.css', '.ds-btn[aria-busy="true"] .ds-btn__face--busy', ['transition']]], [['src/components/button.css', '.ds-btn__face--busy', ['transition']]]],
  ['icon swap', [[M, SWAP_SHOWN, ['transition']]], [[M, '.ds-icon-swap > .ds-icon-swap__b', ['transition']]]],
  ['switch state word', [['src/components/switch.css', '.ds-switch input:checked ~ .ds-switch__state .ds-switch__on', ['transition']]], [['src/components/switch.css', '.ds-switch__on', ['transition']]]],
];
const resolveDuration = (candidates) => candidates.map(([file, selector, properties]) => longest(file, selector, properties)).find((time) => time !== undefined);
/** The popups of the ratio table: they may exit in --ds-dur-instant (motion-2.md). */
const POPUPS = ['src/components/tooltip.css', 'src/components/combobox.css', 'src/components/menu.css'];

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
    // The switch handle may grow while pressed (D6), never above 1 (its 28px box).
    const ACTIVE_EXEMPT = new Map([
      ['.ds-switch:active input:not(:disabled) + .ds-switch__track::after', 'the handle grows to its pressed size'],
      ['.ds-switch.ds-pressed input:not(:disabled) + .ds-switch__track::after', 'the handle grows to its pressed size'],
    ]);
    const offenders = [];
    for (const file of ALL_CSS) {
      for (const { selector, body } of rules(read(file))) {
        const set = declarations(`${body};`).map((entry) => entry.property);
        const parts = splitSelectors(selector);
        if (parts.some((part) => part.includes(':hover'))) {
          const moves = set.filter((property) => /^(transform|translate|scale|rotate|top|right|bottom|left|inset|margin(-[\w-]+)?)$/.test(property));
          if (moves.length) offenders.push(`${file}: ${selector}: ${moves.join(', ')} on hover`);
        }
        // .ds-pressed is the press js/ripple.js holds: the same rule as :active.
        if (parts.some((part) => /:active|\.ds-pressed\b/.test(part) && !ACTIVE_EXEMPT.has(part))) {
          const moves = set.filter((property) => /^(transform|translate|scale)$/.test(property));
          if (moves.length) offenders.push(`${file}: ${selector}: ${moves.join(', ')} on press`);
        }
      }
    }
    assert.deepEqual(offenders, []);
    // The exemption is the switch handle only, and it never grows above its box.
    for (const selector of ACTIVE_EXEMPT.keys()) {
      assert.match(selector, /\.ds-switch__track::after$/, selector);
      for (const { property, value } of declarationsAt(read('src/components/switch.css'), selector)) {
        if (property === 'scale') assert.ok(Number(value) <= 1, `${selector}: scale ${value}`);
        assert.ok(!/^(transform|translate)$/.test(property), `${selector}: ${property}`);
      }
    }
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
          if (!moves.length || names.includes('ds-fade-out')) continue;
          if (!EXIT_UNPAIRED.has(selector)) offenders.push(`${file}: ${selector}: ${moves.join(', ')} without ds-fade-out`);
          else if (!/(^|;\s*)--ds-motion-distance:\s*var\(--ds-distance-sheet\)/.test(body)) offenders.push(`${file}: ${selector}: an unpaired exit must travel --ds-distance-sheet`);
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
      // Popups may exit in --ds-dur-instant, whatever their entrance.
      const popupInstant = POPUPS.some((file) => entrance[0][0] === file) && leave === ms('--ds-dur-instant');
      assert.ok(leave < enter && (popupInstant || (ratio >= 0.3 && ratio <= 0.8)), `${name}: exit ${leave}ms / entrance ${enter}ms = ${ratio.toFixed(2)}`);
    }
    for (const [selector, reason] of RATIO_EXEMPT) assert.ok(declarationsAt(read(M), selector).length, `exempt, but missing: ${selector} (${reason})`);
    // What the docs promise: rule 3 of docs/motion.md (the next tests).
    for (const [name, entrance, exit] of CONTROL_RATIOS) {
      const enter = resolveDuration(entrance);
      const leave = resolveDuration(exit);
      assert.ok(enter > 0 && leave > 0, `${name}: ${enter}/${leave}`);
      const ratio = leave / enter;
      assert.ok(ratio >= 0.4 && ratio <= 0.67 + 1e-9, `${name}: exit ${leave}ms / entrance ${enter}ms = ${ratio.toFixed(2)}`);
    }
    assert.deepEqual(CONTROL_RATIOS.map(([, entrance, exit]) => `${resolveDuration(entrance)}/${resolveDuration(exit)}`),
      ['250/150', '250/150', '250/150', '150/100', '250/100', '150/100']);
  });

  it('has a ratio row for every component with an entrance and an exit', () => {
    // An exit: a --closing, --leaving, [data-state="closed"] or .ds-leave selector, or an animation with a ds-*-out keyframe.
    const exitKeyframe = new RegExp(`(^|[\\s,(])(${[...KEYFRAME_NAMES].filter((name) => name.endsWith('-out')).join('|')})(?![\\w-])`);
    const withRow = new Set(RATIOS.flatMap(([, entrance, exit]) => [...entrance, ...exit].map(([file]) => file)));
    const missing = [];
    for (const file of filesIn('src/components', (path) => path.endsWith('.css'))) {
      const exits = rules(read(file)).some(({ selector, body }) => /--closing|--leaving|\[data-state="closed"\]|\.ds-leave\b/.test(selector)
        || declarations(`${body};`).some(({ property, value }) => /^(animation|animation-name|--ds-leave-keyframes)$/.test(property) && exitKeyframe.test(value)));
      const enters = /\bds-[\w-]+-in\b|\[data-state\]|\[data-state="open"\]|@starting-style/.test(stripComments(read(file)));
      if (exits && enters && !withRow.has(file)) missing.push(file);
    }
    assert.deepEqual(missing, [], 'components with an entrance and an exit but no row in RATIOS');
  });

  it('documents the same exit/entrance pairs in rule 3 of docs/motion.md', () => {
    const rule = read('docs/motion.md').match(/^3\. Exits take[\s\S]*?(?=^4\. )/m)?.[0] || '';
    const rows = [...rule.matchAll(/^\s+\| ([^|]+) \| `(--ds-dur-[\w-]+)` \| `(--ds-dur-[\w-]+)` \|/gm)]
      .map((match) => [match[1].replace(/`/g, '').trim(), ms(match[2]), ms(match[3])]);
    assert.deepEqual(rows, RATIOS.map(([name, entrance, exit]) => [name, resolveDuration(entrance), resolveDuration(exit)]));
  });

  it('brings the drawer back like .ds-enter--slide, from the left (enter(drawer) equals enter(drawer, "slide"))', () => {
    const own = (file, selector) => Object.fromEntries(declarationsOf(read(file), selector).map((entry) => [entry.property, entry.value]));
    const drawer = own('src/components/shell.css', '.ds-drawer.ds-enter');
    const slide = own(M, '.ds-enter--slide');
    for (const hook of ['--ds-enter-keyframes', '--ds-enter-duration', '--ds-enter-easing']) {
      assert.ok(slide[hook], `.ds-enter--slide sets ${hook}`);
      assert.equal(drawer[hook], slide[hook], `.ds-drawer.ds-enter ${hook}`);
    }
    assert.equal(drawer['--ds-motion-distance'], 'calc(-1 * var(--ds-distance-xl))');
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
        // none and the CSS-wide keywords (revert-layer hands a loader back to its own timing) carry no duration;
        // a timeline-driven animation (animation-timeline in the same rule) runs on the scroll position, not on time.
        if (own.animation && !own['animation-timeline'] && !/^(none|inherit|initial|unset|revert|revert-layer)$/.test(own.animation)) {
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
    for (const file of SRC_CSS) {
      for (const { selector, body } of rules(read(file))) {
        for (const { property, value } of declarations(`${body};`)) {
          if (property !== 'transition' && property !== 'transition-property') continue;
          for (const entry of entriesOf(value)) {
            const animated = entry.name;
            if (animated === 'none' || ANIMATABLE.has(animated) || REGISTERED.has(animated)) continue;
            if (/^(all|font-weight)$/.test(animated)) offenders.push(`${file}: ${selector}: never ${animated}`);
            else if (/^(visibility|display|content-visibility|overlay)$/.test(animated)) {
              // A discrete property flips: as a 0ms step, or with allow-discrete.
              if (!(entry.times[0] === 0 || entry.words.includes('allow-discrete'))) offenders.push(`${file}: ${selector}: ${animated} must step`);
            } else if (!transitionException(selector, animated, entry)) offenders.push(`${file}: ${selector}: ${animated} (not a named exception here: EXCEPTIONS)`);
          }
        }
      }
    }
    for (const [name, body] of Object.entries(KEYFRAMES)) {
      for (const { property, value } of declarations(body)) {
        // transform: rotate() counts as rotate (the turn of ds-spin).
        const animated = property === 'transform' && /rotate/.test(value) ? 'rotate' : property;
        if (ANIMATABLE.has(animated) || REGISTERED.has(animated)) continue;
        if (!keyframeException(name, animated)) offenders.push(`@keyframes ${name}: ${animated}`);
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('allows exactly the named exceptions of the animate list, as docs/motion.md rule 1 lists them', () => {
    assert.deepEqual([...EXCEPTIONS.keys()], EXCEPTION_SPEC);
    // Rule 1 of docs/motion.md: "Named exceptions (EXCEPTIONS in test/css.test.js):" and one
    // "- `<property>`: <use>" line per exception, in the same order.
    const rule = read('docs/motion.md').match(/^1\. Animate only[\s\S]*?(?=^2\. )/m)?.[0] || '';
    const listed = [...rule.matchAll(/^\s+- `([\w-]+)`: ([\s\S]*?)(?=^\s+- `|^\s*$)/gm)].map((match) => [match[1], match[2].replace(/\s+/g, ' ')]);
    assert.deepEqual(listed.map(([property]) => property), EXCEPTION_SPEC, 'docs/motion.md rule 1 lists the exceptions');
    for (const [property, use] of listed) {
      for (const word of EXCEPTIONS.get(property).use.match(/[.\w-]{5,}/g)) assert.ok(use.includes(word), `rule 1, ${property}: names "${word}"`);
    }
    // Every selector and keyframe an exception names exists, and the script animates its property.
    const selectors = new Set(SRC_CSS.flatMap((file) => rules(read(file)).flatMap((rule) => splitSelectors(rule.selector))));
    for (const [property, exception] of EXCEPTIONS) {
      for (const name of exception.keyframes) assert.ok(KEYFRAME_NAMES.has(name), `${property}: @keyframes ${name}`);
      if (exception.transitions instanceof Map) for (const selector of exception.transitions.keys()) assert.ok(selectors.has(selector), `${property}: ${selector} is in src/`);
      if (exception.script) assert.match(read(exception.script), new RegExp(`\\{ ${property.replace(/-(\w)/g, (m, c) => c.toUpperCase())}: `), `${property}: animated in ${exception.script}`);
    }
  });

  it('draws strokes on the <svg>, never through a [pathLength] selector that moves (Chromium misses a change above it)', () => {
    // A class or :checked change above a [pathLength] rule does not restyle
    // the path in Chromium (its invalidation keys on the lowercased name);
    // stroke-dashoffset inherits, so the glyph's <svg> carries the motion.
    const offenders = [];
    for (const file of SRC_CSS) {
      for (const rule of rules(read(file))) {
        if (!splitSelectors(rule.selector).some((part) => /\[pathLength\]$/.test(part))) continue;
        if (declarations(`${rule.body};`).some(({ property }) => /^(transition|animation)|^stroke-dashoffset$/.test(property))) offenders.push(`${file}: ${rule.selector}`);
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
        // `none` on a keyframes hook: no entrance (the drawer inside a View Transition, shell.css).
        if (/keyframes$/.test(property) && value === 'none') continue;
        const ok = splitSelectors(value.replace(token, 'T')).every((item) => /^(T|0|0px|-?\d*\.?\d+%|calc\([-\s\dT.*+/]*\))$/.test(item) || (keyframe.test(item) && KEYFRAME_NAMES.has(item)));
        if (!ok) offenders.push(`${file}: ${property}: ${value}`);
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('registers the runtime properties of the loading indicators at top level, typed (1.4.0)', () => {
    const topLevel = withoutAtRuleBlocks(stripComments(read('src/tokens.css')), /^@layer\b/);
    const expected = [
      ['--ds-progress', '<number>', true, '0'],
      ['--ds-progress-head-1', '<percentage>', true, '0%'], ['--ds-progress-head-2', '<percentage>', true, '0%'],
      ['--ds-progress-tail-1', '<percentage>', true, '0%'], ['--ds-progress-tail-2', '<percentage>', true, '0%'],
      ['--ds-spinner-arc', '<angle>', false, '10deg'], ['--ds-spinner-start', '<angle>', false, '0deg'],
      ['--ds-skeleton-x', '<length>', true, '0px'],
    ];
    for (const [name, syntax, inherits, initial] of expected) {
      const pattern = new RegExp(`@property ${name} \\{\\s*syntax: '${syntax}';\\s*inherits: ${inherits};\\s*initial-value: ${initial};\\s*\\}`);
      assert.match(topLevel, pattern, `${name}: @property outside any layer`);
    }
    // The loops that animate them, and only those, are the loader loops.
    const animatesLoopProperty = (body) => /--ds-(progress-(head|tail)-\d|spinner-(arc|start)|skeleton-x)\s*:/.test(body);
    assert.deepEqual(Object.keys(KEYFRAMES).filter((name) => animatesLoopProperty(KEYFRAMES[name])).sort(),
      ['ds-progress-head', 'ds-progress-tail', 'ds-skeleton-wave', 'ds-spinner-arc']);
    for (const name of LOADER_LOOPS.keys()) assert.ok(KEYFRAME_NAMES.has(name), `${name} is defined in motion.css`);
    assert.match(KEYFRAMES['ds-loader-turn'], /^\s*to\s*\{\s*rotate:\s*1turn;\s*\}\s*$/);
    // The -webkit- twin is for Chrome/Edge 111-119, which know only the prefixed mask properties.
    assert.match(KEYFRAMES['ds-progress-wave'], /^\s*to\s*\{\s*-webkit-mask-position:\s*var\(--ds-progress-wave-length\) 0;\s*mask-position:\s*var\(--ds-progress-wave-length\) 0;\s*\}\s*$/);
    assert.match(KEYFRAMES['ds-pulse'], /^\s*50%\s*\{\s*opacity:\s*var\(--ds-state-pulse\);\s*\}\s*$/);
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

  it('keeps its own box where a layered reset or a parent card would reach it (1.6.2)', () => {
    const has = (file, selector, property, value) => rules(read(file)).filter((rule) => splitSelectors(rule.selector).includes(selector))
      .flatMap((rule) => declarations(`${rule.body};`)).some((entry) => entry.property === property && entry.value === value);
    // Bootstrap's reboot floats, widens and spaces a legend.
    for (const [property, value] of [['float', 'none'], ['width', 'auto'], ['margin', '0'], ['padding', '0']]) {
      assert.ok(has('src/components/form.css', 'legend.ds-field__label', property, value), `legend.ds-field__label { ${property}: ${value} }`);
    }
    // A bare table checkbox keeps no UA margin (a 48px head stays 48px).
    assert.ok(has('src/components/form.css', '.ds-table input[type="checkbox"]:where(:not(.ds-switch *, .ds-chip *))', 'margin', '0'));
    // Inline code keeps the ink of its text.
    assert.ok(has('src/base.css', ':where(.ds-base) code', 'color', 'inherit'));
    // Out of flow: no rhythm margin of .ds-card > * + * moves a div dialog or sheet.
    assert.ok(has('src/components/dialog.css', '.ds-dialog', 'margin', '0'));
    assert.ok(has('src/components/sheet.css', '.ds-sheet', 'margin', '0'));
  });

  it('hides with the hidden attribute without .ds-base', () => {
    const hides = (file, selector) => rules(read(file)).some((rule) => splitSelectors(rule.selector).includes(`${selector}[hidden]`) && /display:\s*none/.test(rule.body));
    for (const [file, selector] of [['src/components/dialog.css', '.ds-dialog'], ['src/components/sheet.css', '.ds-sheet'], ['src/components/combobox.css', '.ds-combo__popup'], ['src/components/tooltip.css', '.ds-tooltip']]) {
      assert.ok(hides(file, selector), `${file}: ${selector}[hidden] { display: none }`);
    }
    // Any ds component, for DS.motion.leave(el, v, { then: 'hide' }): a zero-specificity rule in ds.utilities, scoped by .ds-theme.
    const motion = stripComments(read('src/motion.css'));
    const utilities = motion.slice(motion.indexOf('@layer ds.utilities {'));
    assert.ok(rules(utilities).some((rule) => /^:where\(\.ds-theme\)\s+:where\(\[hidden\]/.test(rule.selector) && /display:\s*none/.test(rule.body)),
      'motion.css: :where(.ds-theme) :where([hidden]...) { display: none } in ds.utilities');
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
        // min() of tokens (a pill's rest and pressed radius) carries no literal of its own.
        if (/radius/.test(property) && literal.replace(/\b0\b|\b50%|\binherit\b|\bmin\(|[\s,()]/g, '').trim()) offenders.push(`${file}: ${property}: ${value}`);
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
    for (const file of COMPONENT_CSS) {
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

  it('bundles every stylesheet of src/ except src/optional/', () => {
    const bundle = new Set(cssBundle());
    assert.deepEqual(SRC_CSS.filter((file) => file !== 'src/index.css' && !file.startsWith('src/optional/') && !bundle.has(file)), []);
    // Opt-in stylesheets: never in ds.css, shipped on their own under css/optional/.
    const optional = SRC_CSS.filter((file) => file.startsWith('src/optional/'));
    assert.ok(optional.length, 'src/optional/ holds the opt-in stylesheets');
    for (const file of optional) {
      assert.ok(!bundle.has(file), `${file} is opt-in: src/index.css never imports it`);
      assert.ok(existsSync(join(ROOT, 'dist/css', file.slice('src/'.length))), `${file} ships as dist/css/${file.slice('src/'.length)}`);
      assert.ok(read('docs/install.md').includes(file.slice('src/optional/'.length)), `${file} is named in docs/install.md`);
    }
    assert.match(read('docs/install.md'), /\| `css\/optional\/` \|/, 'docs/install.md: the css/optional/ row of the dist/ table');
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
      // @view-transition is a document-wide at-rule, only in the opt-in src/optional/ files.
      const blocks = items.filter((item) => item.body !== undefined && !/^@property\s/.test(item.prelude) && !(file.startsWith('src/optional/') && item.prelude === '@view-transition'));
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
    assert.deepEqual(rules(motion).filter((rule) => !KEYFRAME_STOP.test(rule.selector)), []);
    const selectors = rules(utilities).flatMap((rule) => splitSelectors(rule.selector));
    for (const utility of ['.ds-enter', '.ds-leave', '.ds-stagger > *', '.ds-reveal', '.ds-collapsible', '.ds-chevron', '.ds-swap', '.ds-icon-swap', '.ds-presence']) {
      assert.ok(selectors.includes(utility), utility);
    }
    // A node that DS.dom.morphHtml moves with insertBefore skips its @starting-style entrances.
    for (const moving of [':where(.ds-theme) [data-ds-moving]', ':where(.ds-theme) [data-ds-moving] *']) assert.ok(selectors.includes(moving), moving);
    const moving = /^:where\(\.ds-theme\) \[data-ds-moving\]( \*)?$/;
    // `hidden` inside the theme without .ds-base (DS.motion.leave(el, v, { then: 'hide' })).
    const hidden = ':where(.ds-theme) :where([hidden]:not(.ds-presence, [hidden="until-found"]))';
    assert.ok(selectors.includes(hidden), hidden);
    // The view-transition rules hang off the document element (html.ds-theme, keyed on data-ds-vt,
    // or data-ds-vt-morph while the panel changes its width).
    const viewTransition = /^\.ds-theme(\[data-ds-vt="[\w-]+"\]|\[data-ds-vt-morph\])?::view-transition-(group|image-pair|old|new)\([\w*-]+\)(:only-child)?$/;
    assert.ok(selectors.some((selector) => viewTransition.test(selector)), 'the view-transition section');
    assert.deepEqual(selectors.filter((selector) => selector !== hidden && !moving.test(selector) && !viewTransition.test(selector) && !/^(dialog)?\.ds-(enter|leave|stagger|reveal|collapsible|chevron|swap|icon-swap(__[ab])?|presence)\b/.test(selector)), []);
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

  it('names a fallback for every "Progressive:" entry of a src/ header (<feature>: <what happens without it>)', () => {
    // The note is a list at the end of its paragraph: "Progressive:" on a line
    // of its own, then "- <feature> (<what it adds>): <the fallback>" entries.
    const files = [...SRC_CSS, ...filesIn('src/js', (path) => path.endsWith('.js'))];
    const offenders = [];
    let notes = 0;
    for (const file of files) {
      const header = read(file).match(/^\/\*[\s\S]*?\*\//)?.[0] || '';
      const lines = header.split('\n').map((line) => line.replace(/^\s*\/?\*+\/?\s?/, '').replace(/\s*\*\/$/, ''));
      for (const line of lines) if (/^Progressive:\s*\S/.test(line)) offenders.push(`${file}: "${line}": put the entries in a list under "Progressive:"`);
      const start = lines.findIndex((line) => /^Progressive:\s*$/.test(line));
      if (start < 0) continue;
      notes += 1;
      const entries = [];
      for (const line of lines.slice(start + 1)) {
        if (!line.trim()) break;
        if (line.startsWith('- ')) entries.push(line.slice(2));
        else if (line.startsWith('  ') && entries.length) entries[entries.length - 1] += ` ${line.trim()}`;
        else offenders.push(`${file}: "${line}" is no entry of the Progressive: list`);
      }
      if (!entries.length) offenders.push(`${file}: an empty Progressive: list`);
      for (const entry of entries) {
        // The feature ends at the first ": " outside parentheses.
        let depth = 0;
        let split = -1;
        for (let index = 0; index < entry.length - 1 && split < 0; index += 1) {
          if (entry[index] === '(') depth += 1;
          else if (entry[index] === ')') depth -= 1;
          else if (depth === 0 && entry[index] === ':' && entry[index + 1] === ' ') split = index;
        }
        const fallback = split < 0 ? '' : entry.slice(split + 2);
        if (split < 1 || !/\b(without|elsewhere|ignored|instead|falls? back)\b/i.test(fallback)) offenders.push(`${file}: "${entry.slice(0, 70)}...": name the fallback after "<feature>: "`);
      }
    }
    assert.ok(notes >= 15, 'the walk finds the notes');
    assert.deepEqual(offenders, []);
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
            // The ring moved to another element: it must follow the same :focus-visible through :has(),
            // or sit on the element's own pseudo-element (a link stretched over a row or card).
            const compound = part.split(/\s*[\s>+~]\s*/).find((piece) => piece.includes(':focus-visible'));
            const own = new RegExp(`${literally(compound)}::(before|after)$`);
            const moved = all.some((other) => ring(other.body) && splitSelectors(other.selector).some((sel) => sel.includes(`:has(${compound})`) || own.test(sel)));
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
        if (KEYFRAME_STOP.test(selector) || selector === '@view-transition') continue;
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
      ['src/components/combobox.css', '.ds-combo__popup'],
      ['src/components/menu.css', '.ds-menu'],
    ];
    for (const [file, selector] of cases) {
      const outline = declarationsOf(read(file), selector).find((entry) => entry.property === 'outline');
      assert.match(outline?.value || '', /solid transparent$/, `${file}: ${selector}`);
    }
    // The combobox list keeps that edge (no CanvasText outline of its own), and the
    // chosen option shows the system's selection colours, not a forced Canvas.
    const combo = forcedColorBlocks(read('src/components/combobox.css'));
    assert.deepEqual(combo.flatMap((block) => declarationsOf(block, '.ds-combo__popup')).filter((entry) => entry.property === 'outline'), []);
    const selected = Object.fromEntries(combo.flatMap((block) => declarationsOf(block, '.ds-combo__option[aria-selected="true"]')).map((entry) => [entry.property, entry.value]));
    assert.deepEqual([selected['forced-color-adjust'], selected.background, selected.color], ['none', 'SelectedItem', 'SelectedItemText']);
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

  it('draws the masked glyphs of the fields (calendar, clear, the checkbox check) from the icon set', () => {
    const masks = [...read('src/components/form.css').matchAll(/url\("data:image\/svg\+xml,([^"]+)"\)/g)].map((match) => decodeURIComponent(match[1]));
    const drawn = new Set();
    for (const svg of masks) {
      const inner = svg.replace(/^<svg[^>]*>|<\/svg>$/g, '').replace(/'/g, '"');
      const name = ['calendar', 'close', 'check'].find((glyph) => icons[glyph] === inner);
      assert.ok(name, `not a glyph of the set: ${inner}`);
      drawn.add(name);
      // The checkbox check alone is heavier: stroke 3 is 2.25px in the 18px box.
      const width = name === 'check' ? 3 : 2;
      assert.match(svg, new RegExp(`stroke-width='${width}' stroke-linecap='round' stroke-linejoin='round'`));
    }
    assert.deepEqual([...drawn].sort(), ['calendar', 'check', 'close']);
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

  it('shows the focus ring solid from the first frame and snaps only its offset', () => {
    const offenders = [];
    for (const file of COMPONENT_CSS) {
      for (const { property, value } of declarations(read(file))) {
        if (!/^transition(-property)?$/.test(property)) continue;
        for (const entry of entriesOf(value)) {
          if (/^(outline|outline-color|outline-width|outline-style|all)$/.test(entry.name)) offenders.push(`${file}: transition of ${entry.name}`);
          if (entry.name === 'outline-offset' && !(entry.words[1] === 'var(--ds-dur-fast)' && entry.words[2] === 'var(--ds-ease-out)')) offenders.push(`${file}: ${entry.words.join(' ')}`);
        }
      }
    }
    for (const body of Object.values(KEYFRAMES)) assert.doesNotMatch(body, /outline/, 'a keyframe would take over the element\'s animation');
    // Every ring of the components (outline: var(--ds-focus-outline)) rests one
    // width further out (inset rings: on the edge) and lists outline-offset
    // in the element's own transition. The rest rule is the ring's selector
    // without its focus state.
    const SNAP = 'calc(var(--ds-focus-offset) + var(--ds-focus-width))';
    const INSET = 'calc(-1 * var(--ds-focus-width))';
    for (const file of COMPONENT_CSS) {
      const all = rules(read(file));
      for (const { selector, body } of all) {
        const own = Object.fromEntries(declarations(`${body};`).map((entry) => [entry.property, entry.value]));
        if (own.outline !== 'var(--ds-focus-outline)') continue;
        for (const part of splitSelectors(selector)) {
          const rest = part
            .replace(/^(\.ds-[\w-]+) input:focus-visible \+ (\.ds-[\w-]+)$/, '$2')
            .replace(/^\.ds-chip__input:focus-visible \+ /, '')
            // A ring drawn on the host for a focused descendant rests on the host.
            .replace(/:has\([^()]*:focus-visible\)/, '')
            .replace(/:focus-visible/, '');
          const expected = own['outline-offset'] === INSET ? '0' : SNAP;
          const restRules = all.filter((rule) => splitSelectors(rule.selector).includes(rest) || (rest.startsWith(':where(.ds-base)') && /:where\(.ds-base\) (a|:where\(summary, \[tabindex\]:not\(\[tabindex\^="-"\]\)\))/.test(rule.selector)));
          const entries = Object.fromEntries(restRules.flatMap((rule) => declarations(`${rule.body};`)).map((entry) => [entry.property, entry.value]));
          if (rest.startsWith(':where(.ds-base)')) continue; // the page base: checked below
          if (entries['outline-offset'] !== expected) offenders.push(`${file}: ${rest} rests at ${entries['outline-offset']}, not ${expected}`);
          if (!/outline-offset var\(--ds-dur-fast\) var\(--ds-ease-out\)/.test(entries.transition || '')) offenders.push(`${file}: ${rest} has no outline-offset in its transition`);
        }
      }
    }
    for (const selector of [':where(.ds-base) a', ':where(.ds-base) :where(summary, [tabindex]:not([tabindex^="-"]))']) {
      const entries = Object.fromEntries(declarationsAt(read('src/base.css'), selector).map((entry) => [entry.property, entry.value]));
      assert.equal(entries['outline-offset'], SNAP, selector);
      assert.match(entries.transition, /outline-offset var\(--ds-dur-fast\) var\(--ds-ease-out\)/, selector);
    }
    assert.deepEqual(offenders, []);
  });

  it('lays the focus layer under the ring (--ds-state-focus), at once', () => {
    const cases = [
      ['src/components/button.css', '.ds-btn:focus-visible::before', 'var(--ds-btn-state-focus-opacity, var(--ds-state-focus))'],
      ['src/components/chip.css', '.ds-chip__input:focus-visible + .ds-chip__body::before', 'var(--ds-state-focus)'],
      ['src/components/shell.css', '.ds-segmented__option:focus-visible::before', 'var(--ds-state-focus)'],
      ['src/components/shell.css', '.ds-drawer__item:focus-visible::before', 'var(--ds-state-focus)'],
      ['src/components/tile.css', ':is(button, a).ds-tile:focus-visible::before', 'var(--ds-state-focus)'],
      ['src/components/table.css', '.ds-table__sort:focus-visible::before', 'var(--ds-state-focus)'],
      ['src/components/alert.css', '.ds-errors summary:focus-visible::before', 'var(--ds-state-focus)'],
      // A radio card's input has no halo: the card's layer is its focus layer.
      ['src/components/form.css', '.ds-radio:has(:where(input):focus-visible):not(.ds-radio--disabled, :has(input:disabled))::before', 'var(--ds-state-focus)'],
    ];
    for (const [file, selector, opacity] of cases) {
      const entries = Object.fromEntries(declarationsAt(read(file), selector).map((entry) => [entry.property, entry.value]));
      assert.equal(entries.opacity, opacity, `${file}: ${selector}`);
      // The first entry is the layer's opacity (a segmented option keeps the
      // spring of its clip in a second one).
      assert.equal(entries['transition-duration']?.split(',')[0].trim(), '0s', `${file}: ${selector}`);
    }
    // The halos of the switch and of checkboxes and radios are their focus layer.
    const halo = Object.fromEntries(declarationsAt(read('src/components/switch.css'), '.ds-switch input:focus-visible + .ds-switch__track::before').map((entry) => [entry.property, entry.value]));
    assert.equal(halo.opacity, 'var(--ds-state-focus)');
    assert.match(halo.transition, /(^|, )opacity 0s(,|$)/);
    const unforced = (file) => withoutAtRuleBlocks(read(file), /@media\s*\(forced-colors:\s*active\)/);
    const check = Object.fromEntries(declarationsAt(unforced('src/components/form.css'), ':is(.ds-check input, .ds-table input[type="checkbox"]:where(:not(.ds-switch *, .ds-chip *)), .ds-checkbox, .ds-radio-input):focus-visible:not(:disabled)').map((entry) => [entry.property, entry.value]));
    assert.match(check['box-shadow'], /var\(--ds-state-focus\)/);
    assert.match(check.transition, /(^|, )box-shadow 0s(,|$)/);
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

/** A RegExp source that matches `text` literally. */
const literally = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The compound a selector part styles: its last compound, without pseudo-elements. */
function subjectOf(part) {
  let depth = 0;
  let start = 0;
  for (let index = 0; index < part.length; index += 1) {
    const char = part[index];
    if (char === '(' || char === '[') depth += 1;
    else if (char === ')' || char === ']') depth -= 1;
    else if (depth === 0 && /[\s>+~]/.test(char)) start = index + 1;
  }
  return part.slice(start).replace(/::[\w-]+(\(.*\))?$/, '');
}

/**
 * Action-like parts (cursor: pointer) that are no ripple host, each with
 * its reason; keyed by the class of the styled compound, or `input`.
 */
const RIPPLE_EXEMPT = new Map([
  ['.ds-link-btn', 'an inline text link: no ripple and no morph (they would reach outside the text line)'],
  ['.ds-switch', 'its halo is the press (D23)'],
  ['.ds-check', 'a checkbox row: the input\'s halo is the press'],
  ['input', 'checkbox and radio inputs: an input cannot hold a ripple, the halo is the press'],
  ['.ds-checkbox', 'a checkbox input: the halo is the press'],
  ['.ds-radio-input', 'a radio input: the halo is the press'],
  ['.ds-combo__option', 'pointer-down selects and closes the list; the state layer is the feedback'],
  ['.ds-input', 'native field parts (select, the calendar and clear buttons)'],
  ['.ds-brand', 'the home link in the top bar: identity, not a control; no state layer, ripple or morph (like a link in text)'],
  ['.ds-skip', 'a keyboard-only skip link, shown only while focused: its focus ring is the feedback'],
]);

describe('controls (1.1.0)', () => {
  /** The pills that morph: rest radius min(..., half the height), pressed radius from the role. */
  const PILLS = [
    ['src/components/button.css', '.ds-btn', 'var(--ds-btn-half)', 'var(--ds-btn-radius-pressed, var(--ds-radius-action-pressed))'],
    ['src/components/shell.css', '.ds-drawer__item', 'calc(var(--ds-drawer-item-height, 48px) / 2)', 'var(--ds-radius-action-pressed)'],
    ['src/components/combobox.css', '.ds-combo__toggle', 'calc(var(--ds-space-10) / 2)', 'var(--ds-radius-action-pressed)'],
  ];
  const BLOCKED = [':disabled', '[aria-disabled="true"]', '[aria-busy="true"]'];

  /** The pressed parts (`host:active...`, `host.ds-pressed...`) of `file` that set a border-radius, with their declarations. */
  function pressed(file, host) {
    const pattern = new RegExp(`^${literally(host)}(:active|\\.ds-pressed)(?![\\w-])`);
    return rules(read(file)).flatMap((rule) => splitSelectors(rule.selector)
      .filter((part) => pattern.test(part) && !part.includes('::') && /border-radius\s*:/.test(rule.body))
      .map((part) => ({ part, own: Object.fromEntries(declarations(`${rule.body};`).map((entry) => [entry.property, entry.value])) })));
  }

  it('morphs every pill on press and springs it back (rest radius never 9999px)', () => {
    for (const [file, host, half, role] of PILLS) {
      const rest = Object.fromEntries(declarationsAt(read(file), host).map((entry) => [entry.property, entry.value]));
      assert.ok(rest['border-radius'].startsWith('min(') && rest['border-radius'].endsWith(`, ${half})`), `${host}: rest radius ${rest['border-radius']}`);
      assert.match(rest.transition, /border-radius var\(--ds-dur-medium\) var\(--ds-ease-spatial\)/, `${host}: the release springs back`);
      const parts = pressed(file, host);
      assert.deepEqual(parts.map(({ part }) => /:active/.test(part) ? 'active' : 'pressed').sort(), ['active', 'pressed'], `${host}: :active and .ds-pressed`);
      for (const { part, own } of parts) {
        for (const state of BLOCKED) assert.ok(part.includes(state), `${part}: excludes ${state}`);
        assert.ok(own['border-radius'].startsWith(`min(${role}, `) && own['border-radius'].endsWith(`, ${half})`), `${part}: ${own['border-radius']}`);
        assert.match(own.transition, /border-radius var\(--ds-dur-micro\) var\(--ds-ease-out\)/, `${part}: the press goes in on --ds-dur-micro`);
      }
    }
    // A round icon button morphs from half its own size; done buttons are blocked too.
    const icon = Object.fromEntries(declarationsOf(read('src/components/button.css'), '.ds-btn--icon').map((entry) => [entry.property, entry.value]));
    assert.equal(icon['--ds-btn-half'], 'calc(var(--ds-btn-icon-size, 40px) / 2)');
    for (const { part } of pressed('src/components/button.css', '.ds-btn')) assert.ok(part.includes('.ds-btn--done'), part);
    // Radio cards go to the card's pressed role, never rounder than at rest.
    const card = pressed('src/components/form.css', '.ds-radio');
    assert.equal(card.length, 2);
    for (const { part, own } of card) {
      assert.ok(part.includes(':not(.ds-radio--disabled, :has(input:disabled))'), part);
      assert.equal(own['border-radius'], 'min(var(--ds-radius-card-pressed), var(--ds-radius-card))');
      assert.match(own.transition, /border-radius var\(--ds-dur-micro\) var\(--ds-ease-out\)/);
    }
    const cardRest = Object.fromEntries(declarationsAt(read('src/components/form.css'), '.ds-radio').map((entry) => [entry.property, entry.value]));
    assert.match(cardRest.transition, /border-radius var\(--ds-dur-medium\) var\(--ds-ease-spatial\)/);
  });

  it('shows no hover or press layer on a blocked tile or card, but keeps the focus layer', () => {
    const cases = [
      ['src/components/tile.css', ':is(button, a).ds-tile', '[aria-disabled="true"]:focus-visible::before'],
      ['src/components/card.css', '.ds-card--interactive', '[aria-disabled="true"]:is(:focus-visible, :has(.ds-card__action:focus-visible))::before'],
    ];
    const opacityAt = (file, selector) => declarationsAt(read(file), selector).find((entry) => entry.property === 'opacity')?.value;
    for (const [file, host, focus] of cases) {
      assert.equal(opacityAt(file, `${host}:is(:disabled, [aria-disabled="true"]):is(:active, .ds-pressed)::before`), '0', `${host}: press`);
      assert.equal(opacityAt(file, `${host}:is(:disabled, [aria-disabled="true"]):hover::before`), '0', `${host}: hover`);
      assert.equal(opacityAt(file, `${host}${focus}`), 'var(--ds-state-focus)', `${host}: focus`);
    }
  });

  it('presses every state layer in --ds-dur-micro (no --ds-dur-instant press-in)', () => {
    const offenders = [];
    let layers = 0;
    for (const file of COMPONENT_CSS.filter((path) => path !== 'src/components/ripple.css')) {
      for (const { selector, body } of rules(read(file))) {
        const parts = splitSelectors(selector).filter((part) => /:active|\.ds-pressed\b/.test(part) && part.endsWith('::before'));
        if (!parts.length) continue;
        const own = Object.fromEntries(declarations(`${body};`).map((entry) => [entry.property, entry.value]));
        const timing = `${own.transition || ''} ${own['transition-duration'] || ''}`;
        if (/--ds-dur-instant/.test(timing)) offenders.push(`${file}: ${selector}: --ds-dur-instant`);
        // A layer that shows the press must bring it in on the micro step.
        if (/--ds-state-pressed|-state-pressed-opacity/.test(own.opacity || '')) {
          layers += 1;
          if (!/--ds-dur-micro/.test(timing)) offenders.push(`${file}: ${selector}: no --ds-dur-micro press-in`);
        }
      }
    }
    assert.deepEqual(offenders, []);
    assert.ok(layers >= 10, `${layers} press layers`);
  });

  it('gives every action a ripple, or names why not (RIPPLE_EXEMPT)', () => {
    const hosts = splitSelectors(RIPPLE_HOSTS);
    const classOf = (compound) => compound.match(/\.ds-[\w-]+/)?.[0] ?? (/^input\b/.test(compound) ? 'input' : compound);
    const isHost = (part) => hosts.some((host) => {
      if (/\s/.test(host)) return part.replace(/::[\w-]+$/, '').endsWith(host);
      const name = host.match(/\.ds-[\w-]+|\[[\w-]+\]/)[0];
      return new RegExp(`${literally(name)}(?![\\w-])`).test(subjectOf(part));
    });
    const offenders = [];
    const exemptUsed = new Set();
    for (const file of SRC_CSS) {
      for (const { selector, body } of rules(read(file))) {
        if (!/cursor:\s*pointer/.test(body)) continue;
        for (const part of splitSelectors(selector).filter((item) => item.includes('.ds-'))) {
          if (isHost(part)) continue;
          const key = classOf(subjectOf(part));
          if (RIPPLE_EXEMPT.has(key)) exemptUsed.add(key);
          else offenders.push(`${file}: ${part} (no ripple host, not in RIPPLE_EXEMPT)`);
        }
      }
    }
    // A link or button takes its pointer cursor from the UA stylesheet, so
    // the markup in the header comments counts too: every <a class="ds-...">
    // and <button class="ds-..."> is a host, a link that stands for its host
    // (HOST_LINK in ripple.js) or an exemption.
    const hostLinks = [...read('src/js/ripple.js').match(/const HOST_LINK = \[([^\]]+)\]\.join\(', '\)/)[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
    // A host of one compound (`.ds-btn`, `:is(button, a).ds-tile`) matches an element by tag and classes.
    const elementIsHost = (tag, names) => hosts.some((host) => {
      const match = host.match(/^(?::is\(([\w,\s]+)\))?((?:\.[\w-]+)+)$/);
      if (!match || (match[1] && !match[1].split(',').map((item) => item.trim()).includes(tag))) return false;
      return match[2].split('.').filter(Boolean).every((name) => names.includes(name));
    });
    for (const file of COMPONENT_CSS) {
      const header = read(file).match(/\/\*[\s\S]*?\*\//)?.[0] ?? '';
      for (const [, tag, list] of header.matchAll(/<(a|button)\b[^>]*?\bclass="([^"]*)"/g)) {
        const names = list.split(/\s+/).filter((name) => name.startsWith('ds-'));
        if (!names.length) continue;
        if (elementIsHost(tag, names) || hostLinks.some((link) => names.includes(link.slice(1)))) continue;
        const key = `.${names.find((name) => !name.includes('--')) ?? names[0]}`;
        if (RIPPLE_EXEMPT.has(key)) exemptUsed.add(key);
        else offenders.push(`${file}: <${tag} class="${list}"> in the header (no ripple host, not in RIPPLE_EXEMPT)`);
      }
    }
    assert.deepEqual(offenders, []);
    assert.deepEqual([...RIPPLE_EXEMPT.keys()].filter((key) => !exemptUsed.has(key)), [], 'an exemption nothing needs: shorten RIPPLE_EXEMPT');
    // Every host with a pressed state layer has its .ds-ripples rule, so layer and ripple never stack.
    // The layer is the host's ::before; a table row's is on its cells
    // (> :is(td, th), so a <th scope="row"> row header has it too).
    const layer = (part) => part.endsWith('::before') || part.endsWith(' > :is(td, th)');
    const ripple = rules(read('src/components/ripple.css')).flatMap((rule) => splitSelectors(rule.selector));
    for (const host of hosts.filter((item) => item !== '[data-ds-ripple]')) {
      const layered = COMPONENT_CSS.filter((path) => path !== 'src/components/ripple.css').some((file) => rules(read(file))
        .some((rule) => splitSelectors(rule.selector).some((part) => new RegExp(`${literally(host)}(?![\\w-])[^,]*:active`).test(part) && layer(part))));
      assert.ok(layered, `${host}: a pressed state layer`);
      assert.ok(ripple.some((part) => part.startsWith(`:where(.ds-ripples) ${host}:where(`) && part.includes(':is(:active, .ds-pressed)') && layer(part)), `${host}: its .ds-ripples rule`);
    }
  });

  it('opens the chip check slot by width alone (--ds-ease-out) and never hides the check', () => {
    for (const file of SRC_CSS) {
      for (const { selector, body } of rules(read(file))) {
        const own = Object.fromEntries(declarations(`${body};`).map((entry) => [entry.property, entry.value]));
        if (selector.includes('.ds-chip__check')) {
          assert.notEqual(own.display, 'none', `${file}: ${selector}`);
          assert.equal(own.animation, undefined, `${file}: ${selector}: transitions only`);
        }
        for (const entry of entriesOf(own.transition || '')) {
          if (entry.name !== 'width') continue;
          assert.equal(selector, '.ds-chip__body::after', `${file}: ${selector}: width transition`);
          assert.equal(entry.easing, 'var(--ds-ease-out)', 'a layout size never overshoots (D29)');
        }
      }
    }
    assert.equal(declarationsAt(read('src/components/chip.css'), '.ds-chip__body::after').find((entry) => entry.property === 'transition')?.value,
      'width var(--ds-dur-medium) var(--ds-ease-out) var(--ds-dur-micro)');
  });

  it('draws checkboxes and radios on the native input (no accent-color), in system colours when forced', () => {
    for (const file of ALL_CSS) assert.doesNotMatch(stripComments(read(file)), /accent-color/, file);
    const form = read('src/components/form.css');
    const drawn = rules(form).filter((rule) => /(^|;\s*)appearance:\s*none/.test(rule.body) && /-webkit-appearance:\s*none/.test(rule.body))
      .flatMap((rule) => splitSelectors(rule.selector));
    for (const selector of ['.ds-check input[type="checkbox"]', '.ds-table input[type="checkbox"]:where(:not(.ds-switch *, .ds-chip *))', '.ds-checkbox', '.ds-check input[type="radio"]', '.ds-radio input', '.ds-radio-input']) {
      assert.ok(drawn.includes(selector) || drawn.includes(selector.replace(/\[type="\w+"\]$/, '')), `${selector}: appearance: none`);
    }
    const SYSTEM = /^(Canvas|CanvasText|Highlight|HighlightText|GrayText|none|transparent)$/;
    const forced = forcedColorBlocks(form).flatMap((block) => rules(block))
      .filter((rule) => /\.ds-checkbox|\.ds-radio-input/.test(rule.selector));
    assert.ok(forced.some((rule) => /forced-color-adjust:\s*none/.test(rule.body)), 'forced-color-adjust: none');
    const colours = forced.flatMap((rule) => declarations(`${rule.body};`)).filter((entry) => /^(background|border-color|color|outline-color|box-shadow)$/.test(entry.property));
    assert.ok(colours.length >= 8, `${colours.length} forced colours`);
    for (const { property, value } of colours) assert.match(value, SYSTEM, `${property}: ${value}`);
    for (const value of ['CanvasText', 'Highlight', 'HighlightText', 'GrayText']) assert.ok(colours.some((entry) => entry.value === value), value);
  });

  it('fades the blur of a field as one unit and shows its ring at once', () => {
    const form = read('src/components/form.css');
    const input = Object.fromEntries(declarationsOf(form, '.ds-input').map((entry) => [entry.property, entry.value]));
    const names = entriesOf(input.transition).map((entry) => entry.name);
    for (const name of ['border-color', 'box-shadow', 'color']) assert.ok(names.includes(name), `.ds-input transitions ${name}`);
    const focus = Object.fromEntries(declarationsOf(form, '.ds-input:focus').map((entry) => [entry.property, entry.value]));
    assert.equal(focus['transition-duration'], '0s');
  });

  it('fades every control to one disabled model', () => {
    const transitionOf = (file, selector) => declarationsAt(read(file), selector).find((entry) => entry.property === 'transition')?.value || '';
    for (const [file, selector] of [
      ['src/components/button.css', '.ds-btn'],
      ['src/components/chip.css', '.ds-chip__body'],
      ['src/components/switch.css', '.ds-switch__track'],
      ['src/components/form.css', '.ds-checkbox'],
    ]) {
      assert.match(transitionOf(file, selector), /(^|, )opacity var\(--ds-dur-fast\) var\(--ds-ease-in-out\)/, `${selector}: opacity fades`);
    }
    const reads = (file, selector) => declarationsAt(read(file), selector).map((entry) => entry.value).join(' ');
    const chip = reads('src/components/chip.css', '.ds-chip__input:disabled + .ds-chip__body');
    for (const token of ['--ds-disabled-fill', '--ds-disabled-ink', '--ds-disabled-opacity']) assert.ok(chip.includes(token), `chip: ${token}`);
    const track = reads('src/components/switch.css', '.ds-switch input:disabled + .ds-switch__track');
    for (const token of ['--ds-disabled-fill', '--ds-disabled-opacity']) assert.ok(track.includes(token), `switch track: ${token}`);
    assert.ok(reads('src/components/switch.css', '.ds-switch input:disabled + .ds-switch__track::after').includes('--ds-disabled-ink'), 'switch handle');
    // Hover changes nothing on a disabled chip or switch.
    const hover = atRuleBlocks(read('src/components/switch.css'), /@media\s*\(hover:\s*hover\)/).flatMap((block) => rules(block)).flatMap((rule) => splitSelectors(rule.selector));
    assert.ok(hover.length && hover.every((part) => part.includes(':not(:disabled)')), hover.join(' | '));
    const chipHover = atRuleBlocks(read('src/components/chip.css'), /@media\s*\(hover:\s*hover\)/).flatMap((block) => rules(block)).flatMap((rule) => splitSelectors(rule.selector));
    assert.ok(chipHover.length && chipHover.every((part) => part.includes(':not(:disabled)')), chipHover.join(' | '));
  });

  it('keeps the spinner of a hidden busy face still (no endless loop per button at rest)', () => {
    const paused = declarationsAt(read('src/components/button.css'), '.ds-btn:not([aria-busy="true"]) .ds-btn__face--busy .ds-spinner');
    assert.deepEqual(paused.map(({ property, value }) => `${property}: ${value}`), ['animation-play-state: paused']);
  });
});

describe('navigation (1.2.0)', () => {
  const SHELL = 'src/components/shell.css';
  const INDICATOR = 'src/components/indicator.css';
  const PILL_PROPERTIES = ['--ds-indicator-t', '--ds-indicator-r', '--ds-indicator-b', '--ds-indicator-l', '--ds-indicator-radius'];
  /** The properties a rule's transition or transition-property animates. */
  const animated = (body) => declarations(`${body};`)
    .filter(({ property }) => property === 'transition' || property === 'transition-property')
    .flatMap(({ value }) => entriesOf(value).map((entry) => entry.name));

  it('registers the clip edges and the radius of the pill as non-inheriting lengths, at top level', () => {
    const source = stripComments(read(INDICATOR));
    const topLevel = withoutAtRuleBlocks(source, /^@layer\b/);
    for (const name of PILL_PROPERTIES) {
      const pattern = new RegExp(`@property ${literally(name)} \\{\\s*syntax: '<length>';\\s*inherits: false;\\s*initial-value: 0px;\\s*\\}`);
      assert.match(topLevel, pattern, `${name}: @property outside any layer`);
      assert.ok(REGISTERED.has(name));
    }
  });

  it('draws the pill by clip-path on a box: no width, height or transform ever transitions', () => {
    const own = Object.fromEntries(declarationsAt(read(INDICATOR), '.ds-indicator').map((entry) => [entry.property, entry.value]));
    assert.equal(own.translate, 'var(--ds-indicator-x, 0) var(--ds-indicator-y, 0)');
    assert.equal(own.transform, undefined);
    assert.match(own['clip-path'], /^inset\(var\(--ds-indicator-t\) var\(--ds-indicator-r\) var\(--ds-indicator-b\) var\(--ds-indicator-l\) round var\(--ds-indicator-radius\)\)$/);
    for (const file of [INDICATOR, SHELL]) {
      for (const { selector, body } of rules(read(file))) {
        // Rules on the pill itself (its last compound), not on items inside a track with one.
        if (!splitSelectors(selector).some((part) => /(\.ds-indicator|__indicator)(?![\w-])[^\s>+~]*$/.test(part))) continue;
        for (const name of animated(body)) {
          assert.ok(['none', 'opacity', ...PILL_PROPERTIES].includes(name), `${file}: ${selector}: ${name}`);
        }
      }
    }
  });

  it('never transitions font-weight in shell.css, not even as a delayed step', () => {
    for (const { selector, body } of rules(read(SHELL))) {
      for (const { property, value } of declarations(`${body};`)) {
        if (!property.startsWith('transition')) continue;
        assert.doesNotMatch(value, /font-weight|\bfont\b|\ball\b/, `${selector}: ${property}: ${value}`);
      }
    }
  });

  it('changes label colour on the pill timing, only under .ds-has-indicator', () => {
    const LABELS = /\.ds-drawer__item(?![\w-])(?!.*::)|\.ds-segmented__option(?![\w-])(?!.*::)/;
    const found = [];
    for (const { selector, body } of rules(read(SHELL))) {
      if (!animated(body).includes('color')) continue;
      for (const part of splitSelectors(selector).filter((text) => LABELS.test(text))) {
        assert.ok(part.includes('.ds-has-indicator'), `${part}: a colour transition without the pill`);
        found.push(part);
      }
      const colour = declarations(`${body};`).filter(({ property }) => property === 'transition')
        .flatMap(({ value }) => entriesOf(value)).find((entry) => entry.name === 'color');
      assert.deepEqual(colour?.words, ['color', 'var(--ds-indicator-dur, var(--ds-dur-medium))', 'var(--ds-ease-in-out)'], selector);
    }
    for (const part of ['.ds-has-indicator .ds-drawer__item', '.ds-has-indicator .ds-drawer__item svg', '.ds-has-indicator > .ds-segmented__option']) {
      assert.ok(found.includes(part), `${part}: changes colour with the pill`);
    }
    // The modal drawer: its pill does not glide, so its labels change at once.
    const modal = atRuleBlocks(read(SHELL), /max-width:\s*900px/).flatMap((block) => rules(block));
    const items = modal.filter((rule) => splitSelectors(rule.selector).some((part) => /^\.ds-drawer (\.ds-has-indicator )?\.ds-drawer__item/.test(part)));
    assert.ok(items.length >= 3, 'item, pressed item and icon rules in the modal drawer');
    for (const rule of items) assert.equal(animated(rule.body).includes('color'), false, rule.selector);
  });
});

describe('overlays (1.3.0)', () => {
  /** The overlays whose motion is keyed on data-state, with the class of their root. */
  const STATEFUL = [
    ['src/components/dialog.css', /\.ds-dialog(?![\w-])/],
    ['src/components/sheet.css', /\.ds-sheet(?![\w-])/],
    ['src/components/tooltip.css', /\.ds-tooltip(?![\w-])/],
    ['src/components/combobox.css', /\.ds-combo__popup(?![\w-])/],
    ['src/components/menu.css', /\.ds-menu(?![\w-])/],
  ];

  /**
   * Every @starting-style block of a comment-free stylesheet with the
   * preludes of the blocks around it (outermost first).
   */
  function startingStyles(css) {
    const found = [];
    const stack = [];
    let from = 0;
    for (let index = 0; index < css.length; index += 1) {
      if (css[index] === ';') from = index + 1;
      else if (css[index] === '{') {
        const prelude = css.slice(from, index).replace(/\s+/g, ' ').trim();
        if (prelude === '@starting-style') found.push([...stack]);
        stack.push(prelude);
        from = index + 1;
      } else if (css[index] === '}') {
        stack.pop();
        from = index + 1;
      }
    }
    return found;
  }

  it('hides a closed native dialog or sheet (display outranks the UA rule) and keeps its ::backdrop transparent', () => {
    for (const [file, block] of [['src/components/dialog.css', 'ds-dialog'], ['src/components/sheet.css', 'ds-sheet']]) {
      const css = read(file);
      const selector = `dialog.${block}:not([open]):not(.${block}--closing):not([data-state="open"])`;
      const hidden = declarationsAt(css, selector);
      assert.equal(hidden.find((entry) => entry.property === 'display')?.value, 'none', `${file}: ${selector} { display: none }`);
      const backdrop = declarationsAt(css, `dialog.${block}::backdrop`);
      assert.equal(backdrop.find((entry) => entry.property === 'background')?.value, 'transparent', `${file}: the scrim is the __backdrop child`);
    }
  });

  it('runs keyframes on dialog, sheet, tooltip, combobox list and menu only without data-state', () => {
    const offenders = [];
    let keyframed = 0;
    for (const [file, root] of STATEFUL) {
      for (const { selector, body } of rules(read(file))) {
        const names = declarations(`${body};`).flatMap(({ property, value }) => {
          if (property === 'animation') return entriesOf(value).map((entry) => entry.name);
          if (property === 'animation-name') return splitSelectors(value);
          return [];
        }).filter((name) => name !== 'none');
        if (!names.length) continue;
        for (const part of splitSelectors(selector).filter((text) => root.test(text))) {
          keyframed += 1;
          if (!part.includes(':not([data-state])')) offenders.push(`${file}: ${part}: ${names.join(', ')}`);
        }
      }
    }
    assert.deepEqual(offenders, [], 'a keyframe on a data-state path cannot reverse from where it is');
    assert.ok(keyframed >= STATEFUL.length, 'each overlay keeps its keyframe path for markup driven by hand');
  });

  it('places @starting-style outside style rules, only in files that name it under "Progressive:"', () => {
    let count = 0;
    for (const file of SRC_CSS) {
      const source = read(file);
      const blocks = startingStyles(stripComments(source));
      if (!blocks.length) continue;
      const header = source.match(/^\/\*[\s\S]*?\*\//)?.[0] || '';
      const note = header.includes('Progressive:') ? header.slice(header.indexOf('Progressive:')) : '';
      assert.ok(note.includes('@starting-style'), `${file}: name @starting-style under "Progressive:"`);
      for (const around of blocks) {
        count += 1;
        assert.ok(around.every((prelude) => /^@(layer|media|supports)\b/.test(prelude)), `${file}: @starting-style inside ${around.join(' > ')}`);
      }
    }
    assert.ok(count >= 4, 'dialog, sheet, presence and the validation room use it');
  });

  it('keeps :popover-open in rules of one selector (an engine without it drops only that rule)', () => {
    const offenders = [];
    for (const file of SRC_CSS) {
      for (const { selector } of rules(read(file))) {
        if (selector.includes(':popover-open') && splitSelectors(selector).length > 1) offenders.push(`${file}: ${selector}`);
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('exempts only the full-distance side sheet slide from the fade pairing', () => {
    assert.deepEqual([...EXIT_UNPAIRED.keys()], ['.ds-sheet--closing:not([data-state]) .ds-sheet__panel']);
  });
});

export { ROOT };

describe('feedback and data (1.4.0)', () => {
  /** The rules of `file` whose selector list has a part matching `pattern`, with their own declarations. */
  const rulesWith = (file, pattern) => rules(read(file)).filter((rule) => splitSelectors(rule.selector).some((part) => pattern.test(part)))
    .map((rule) => ({ selector: rule.selector, own: Object.fromEntries(declarations(`${rule.body};`).map((entry) => [entry.property, entry.value])) }));

  it('presses clickable cards and tiles by radius and layer only: nothing moves on hover or press', () => {
    for (const [file, host] of [['src/components/card.css', /\.ds-card--interactive/], ['src/components/tile.css', /\.ds-tile/]]) {
      const states = rulesWith(file, new RegExp(`${host.source}[^\\s,]*(:hover|:active|\\.ds-pressed)`));
      assert.ok(states.length >= 3, `${file}: hover and press rules`);
      for (const { selector, own } of states) {
        const moves = Object.keys(own).filter((property) => /^(transform|translate|scale|rotate|top|right|bottom|left|inset|margin(-[\w-]+)?)$/.test(property));
        assert.deepEqual(moves, [], `${file}: ${selector}`);
      }
      // The press morph is there, on :active and on .ds-pressed.
      const morph = states.filter(({ selector, own }) => own['border-radius'] && !selector.includes('::'));
      assert.equal(morph.length, 1, `${file}: one press morph rule`);
      assert.match(morph[0].selector, /:active/);
      assert.match(morph[0].selector, /\.ds-pressed/);
    }
    assert.equal(rulesWith('src/components/card.css', /^\.ds-card--interactive:active/).find(({ own }) => own['border-radius']).own['border-radius'],
      'min(var(--ds-radius-card-pressed), var(--ds-radius-card))');
    assert.equal(rulesWith('src/components/tile.css', /^:is\(button, a\)\.ds-tile:active/).find(({ own }) => own['border-radius']).own['border-radius'],
      'min(var(--ds-tile-radius-pressed, var(--ds-radius-md)), var(--ds-tile-radius, var(--ds-radius-lg)))');
  });

  it('names the P6 uses of the animate exceptions', () => {
    assert.ok(EXCEPTIONS.get('height').transitions.has('.ds-table__expand'), 'expandable rows: grid-template-rows');
    assert.ok(EXCEPTIONS.get('rotate').keyframes.includes('ds-loader-turn'), 'the loader turns');
    for (const selector of ['.ds-chevron', '.ds-errors .ds-errors__chevron', '.ds-table__sort-arrow']) assert.ok(EXCEPTIONS.get('rotate').transitions.has(selector), selector);
  });

  it('keeps the waiting track in the layout (hidden, not display: none) and fades it in', () => {
    const file = 'src/components/progress.css';
    const waiting = rulesWith(file, /^\.ds-progress--waiting \.ds-progress__track$/);
    assert.equal(waiting.length, 1);
    assert.deepEqual(waiting[0].own, { visibility: 'hidden', opacity: '0', 'animation-play-state': 'paused' });
    for (const { own } of rulesWith(file, /\.ds-progress--waiting/)) assert.ok(!('display' in own), 'never display: none');
    const track = Object.fromEntries(declarationsAt(read(file), '.ds-progress__track').map((entry) => [entry.property, entry.value]));
    assert.equal(track.transition, 'opacity var(--ds-dur-fast) var(--ds-ease-in-out)');
  });

  it('waits the loader delay once: loaders in a waiting container and a loading bar in a skeleton have no fade of their own', () => {
    const loader = rulesWith('src/components/loader.css', /^\.ds-(boot|loading|skeleton) \.ds-loader$/);
    assert.equal(loader.length, 1);
    assert.equal(loader[0].own.animation, 'none');
    assert.equal(splitSelectors(loader[0].selector).length, 3);
    const standalone = declarationsAt(read('src/components/loading.css'), '.ds-loadbar:not(.ds-skeleton > .ds-loadbar)').find((entry) => entry.property === 'animation');
    assert.match(standalone.value, /^ds-fade-in var\(--ds-dur-medium\) var\(--ds-ease-in-out\) var\(--ds-delay-loader\) backwards,/);
    const inSkeleton = declarationsAt(read('src/components/loading.css'), '.ds-loadbar').find((entry) => entry.property === 'animation');
    assert.doesNotMatch(inSkeleton.value, /ds-fade-in/);
    // The skeleton's wave starts after its entrance.
    const skeleton = declarationsAt(read('src/components/loading.css'), '.ds-skeleton').find((entry) => entry.property === 'animation');
    assert.match(skeleton.value, /ds-skeleton-wave var\(--ds-loop-skeleton\) linear calc\(var\(--ds-delay-loader\) \+ var\(--ds-dur-medium\)\) infinite/);
  });
});

describe('view transitions and scroll-driven effects (1.5.0)', () => {
  /** Every style rule of src/ as { file, selector, parts, own (property → value), order (property names in order) }. */
  const all = SRC_CSS.flatMap((file) => rules(read(file)).map(({ selector, body }) => {
    const list = declarations(`${body};`);
    return { file, selector, parts: splitSelectors(selector), own: Object.fromEntries(list.map((entry) => [entry.property, entry.value])), order: list.map((entry) => entry.property) };
  }));
  const optional = (file) => file.startsWith('src/optional/');
  /** The header comment of a file from its "Progressive:" note on. */
  const progressiveNote = (file) => {
    const header = read(file).match(/^\/\*[\s\S]*?\*\//)?.[0] || '';
    return header.includes('Progressive:') ? header.slice(header.indexOf('Progressive:')) : '';
  };
  /**
   * Rules that set animation-timeline without the shorthand, each with its
   * reason: a reset to the document timeline, never a timeline of its own.
   */
  const TIMELINE_RESETS = new Map([
    ['.ds-reveal--scroll:is(.ds-enter, .ds-leave)', 'enter() or leave() on a scroll-revealed block plays in time: the one-shot utilities set longhands only, which would keep the view() timeline'],
  ]);

  it('opts into page loads (@view-transition) and names for good only in src/optional/; ds.css never does', () => {
    for (const file of SRC_CSS.filter((path) => !optional(path))) assert.doesNotMatch(stripComments(read(file)), /@view-transition/, file);
    assert.match(stripComments(read('src/optional/view-transitions.css')), /@view-transition\s*\{\s*navigation:\s*auto;\s*\}/);
    assert.doesNotMatch(stripComments(read('dist/ds.css')), /@view-transition/);
    // ds.css names the frame only while DS.motion.transition() runs (data-ds-vt on <html>).
    const named = all.filter((rule) => 'view-transition-name' in rule.own);
    assert.ok(named.some((rule) => optional(rule.file)) && named.some((rule) => !optional(rule.file)));
    for (const rule of named.filter((entry) => !optional(entry.file))) {
      for (const part of rule.parts) assert.match(part, /^\.ds-theme\[data-ds-vt\] /, `${rule.file}: ${part}: named only while a transition runs`);
    }
  });

  it('hangs every ::view-transition-* rule off .ds-theme (the document element), so a host page is never restyled', () => {
    const pseudo = all.flatMap((rule) => rule.parts.filter((part) => part.includes('::view-transition')).map((part) => `${rule.file}: ${part}`));
    assert.ok(pseudo.length > 10, 'the view-transition section');
    assert.deepEqual(pseudo.filter((entry) => !/: \.ds-theme(\[data-ds-vt(="[\w-]+")?\]|\[data-ds-vt-morph\])?::view-transition-/.test(entry)), []);
  });

  it('gives every view-transition-name in src/ the ds- prefix (CSS values and the names js/ writes)', () => {
    const values = all.filter((rule) => 'view-transition-name' in rule.own).map((rule) => rule.own['view-transition-name']);
    for (const value of values) assert.match(value, /^ds-[\w-]+$/, value);
    const pseudoNames = all.flatMap((rule) => rule.parts.flatMap((part) => [...part.matchAll(/::view-transition-[\w-]+\(([^)]*)\)/g)].map((match) => match[1])));
    for (const name of pseudoNames) assert.match(name, /^(\*|root|ds-[\w-]+)$/, name);
    // Inline names written by the scripts: ds-<name>, or none while a name is lifted.
    const written = filesIn('src/js', (path) => path.endsWith('.js')).flatMap((file) => [
      ...[...read(file).matchAll(/setProperty\('view-transition-name',\s*['`]([^'`]*)['`]/g)].map((match) => match[1]),
      ...[...read(file).matchAll(/viewTransitionName\s*=\s*['`]([^'`]*)['`]/g)].map((match) => match[1]),
    ]);
    assert.ok(written.includes('ds-container') && written.includes('ds-indicator-${name}'), written.join());
    for (const name of written) assert.match(name, /^(ds-[\w${}-]+|none)$/, name);
  });

  it('sets animation-timeline after the animation shorthand (which resets it), resets named', () => {
    const timed = all.filter((rule) => 'animation-timeline' in rule.own);
    assert.ok(timed.length >= 5, 'hairline, tint, sheet hairline, table edges, reveal');
    for (const rule of timed) {
      const where = `${rule.file}: ${rule.selector}`;
      if (TIMELINE_RESETS.has(rule.selector)) {
        assert.equal(rule.own['animation-timeline'], 'auto', `${where}: a reset goes back to the document timeline`);
        assert.ok(!('animation' in rule.own), `${where}: a reset keeps the one-shot's own shorthand`);
        continue;
      }
      assert.ok('animation' in rule.own, `${where}: the shorthand in the same rule`);
      assert.ok(rule.order.indexOf('animation') < rule.order.indexOf('animation-timeline'), `${where}: animation-timeline after the shorthand`);
      if ('animation-range' in rule.own) assert.ok(rule.order.indexOf('animation') < rule.order.indexOf('animation-range'), `${where}: animation-range after the shorthand`);
    }
    for (const selector of TIMELINE_RESETS.keys()) assert.ok(timed.some((rule) => rule.selector === selector), `exempt, but missing: ${selector}`);
  });

  it('guards scroll timelines: named ones by @supports (timeline-scope: none), anonymous ones by @supports (animation-timeline: ...)', () => {
    const scoped = /@supports\s*\(timeline-scope:\s*none\)/;
    const anonymous = /@supports\s*\(animation-timeline:\s*(scroll|view)\(\)\)/;
    const timelineProps = /^(animation-timeline|animation-range|scroll-timeline|view-timeline|timeline-scope)$/;
    for (const file of SRC_CSS) {
      const css = read(file);
      // Outside both guards: no timeline at all.
      for (const { selector, body } of rules(withoutAtRuleBlocks(withoutAtRuleBlocks(css, scoped), anonymous))) {
        for (const { property } of declarations(`${body};`)) assert.ok(!timelineProps.test(property), `${file}: ${selector}: ${property} outside a feature query`);
      }
      // Named timelines (and their scope) only behind timeline-scope: an engine without it leaves them unresolved.
      for (const block of atRuleBlocks(css, anonymous)) {
        for (const { property, value } of declarations(block)) {
          if (/^(scroll-timeline|view-timeline|timeline-scope)$/.test(property) || (property === 'animation-timeline' && value.startsWith('--'))) assert.fail(`${file}: ${property}: ${value} needs @supports (timeline-scope: none)`);
          if (property === 'animation-timeline') assert.match(value, /^(scroll|view)\([^)]*\)$|^auto$/, `${file}: ${value}`);
        }
      }
      for (const block of atRuleBlocks(css, scoped)) {
        for (const { property, value } of declarations(block)) {
          if (/^(animation-timeline|scroll-timeline|timeline-scope)$/.test(property)) assert.match(value, /^--ds-[\w-]+(\s+block|\s+inline)?$/, `${file}: ${property}: ${value}`);
        }
      }
    }
  });

  it('runs the scroll-linked keyframes only on a scroll timeline, and times nothing on one', () => {
    const scrollLinked = ['ds-scroll-fade', 'ds-edge-fade'];
    const users = all.filter((rule) => scrollLinked.some((name) => new RegExp(`(^|[\\s,])${name}(\\s|,|$)`).test(rule.own.animation || '')));
    assert.ok(users.length >= 5, users.map((rule) => rule.selector).join());
    for (const rule of users) {
      assert.ok(rule.own['animation-timeline'], `${rule.file}: ${rule.selector}: on a timeline`);
      // A duration on a scroll timeline means nothing (and Firefox would run it in time without the feature query).
      for (const entry of entriesOf(rule.own.animation)) assert.equal(entry.times.length, 0, `${rule.file}: ${rule.selector}: no duration`);
    }
    // ds-edge-fade: a position on the table's scroll, on its registered lengths only.
    const edge = KEYFRAMES['ds-edge-fade'];
    assert.ok(edge, 'ds-edge-fade exists');
    const stops = rules(edge).map((rule) => rule.selector);
    assert.ok(stops.includes('0%') && stops.includes('100%'), stops.join());
    const touched = new Set(declarations(edge).map((entry) => entry.property));
    assert.deepEqual([...touched].sort(), ['--ds-table-fade-end', '--ds-table-fade-start']);
    for (const name of touched) assert.ok(REGISTERED.has(name), `${name} is registered`);
    assert.deepEqual(rules(KEYFRAMES['ds-scroll-fade']).map((rule) => rule.selector), ['from', 'to']);
  });

  it('names View Transitions and scroll-driven animations under "Progressive:" in each file that uses them', () => {
    const expected = {
      'src/components/shell.css': ['View Transitions', 'scroll-driven'],
      'src/components/sheet.css': ['View Transitions', 'scroll-driven'],
      'src/components/table.css': ['scroll-driven'],
      'src/motion.css': ['View Transitions', 'scroll-driven'],
      'src/optional/view-transitions.css': ['View Transitions'],
    };
    for (const [file, names] of Object.entries(expected)) {
      for (const name of names) assert.ok(progressiveNote(file).includes(name), `${file}: "${name}" under "Progressive:"`);
    }
    // The scripts name theirs too.
    assert.match(read('src/js/motion.js').match(/^\/\*[\s\S]*?\*\//)[0], /Progressive:[\s\S]*startViewTransition/);
    assert.match(read('src/js/indicator.js').match(/^\/\*[\s\S]*?\*\//)[0], /Progressive:[\s\S]*view-transition-name/);
  });

  it('hides the top bar tint in forced colours and prints scroll-revealed blocks at their end state', () => {
    const tint = forcedColorBlocks(read('src/components/shell.css')).flatMap((block) => declarationsOf(block, '.ds-topbar::before'));
    assert.equal(tint.find((entry) => entry.property === 'display')?.value, 'none');
    const print = atRuleBlocks(read('src/motion.css'), /@media\s+print/).flatMap((block) => declarationsOf(block, '.ds-reveal--scroll'));
    assert.equal(print.find((entry) => entry.property === 'animation')?.value, 'none');
    // The reveal hides nothing without view(): its only rules sit behind the feature query (and print).
    const outside = rules(withoutAtRuleBlocks(withoutAtRuleBlocks(read('src/motion.css'), /@supports\s*\(animation-timeline/), /@media\s+print/));
    assert.deepEqual(outside.filter((rule) => rule.selector.includes('.ds-reveal--scroll')).map((rule) => rule.selector), []);
    // Its base opacity is the element's own: the hairline, tint and sheet hairline rest at 0 and only the timeline shows them.
    for (const [file, selector] of [['src/components/shell.css', '.ds-view::before'], ['src/components/shell.css', '.ds-topbar::before'], ['src/components/sheet.css', '.ds-sheet__head::after']]) {
      const base = declarationsOf(withoutAtRuleBlocks(read(file), /@supports/), selector).filter((entry) => entry.property === 'opacity');
      assert.equal(base[0]?.value, '0', `${file}: ${selector} rests at opacity 0`);
    }
  });
});
