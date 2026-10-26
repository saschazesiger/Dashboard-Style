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
  [/field-sizing/, 'field-sizing'],
  // An HTML attribute, not CSS: the note of disclosure.css names it (rows that share a name open one at a time).
  [/details\[name\]/, 'details[name]'],
  [/hyphenate-limit-chars/, 'hyphenate-limit-chars'],
  [/content:\s*[^;]*\/\s*["']/, 'alt text for generated content'],
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
  '--ds-share',
  '--ds-toast-left',
  '--ds-toast-bottom',
  '--ds-toast-shift',
  '--ds-toast-shift-y',
  '--ds-toast-reserve',
  '--ds-toast-lift',
  '--ds-keyboard-inset',
  '--ds-savebar-height',
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
/** The selector of a keyframe stop: from, to, percentages (with decimals), or a list of them ("0%, 100%"). */
const KEYFRAME_STOP = /^(from|to|\d+(\.\d+)?%)(\s*,\s*(from|to|\d+(\.\d+)?%))*$/;
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
  ['ds-spin', 'a loop: one full turn to 1turn'],
  ['ds-scan', 'a loop: the band travels from above the frame to below it'],
  ['ds-ripple', 'a ring that grows and fades from a set start (--ds-ripple-opacity)'],
  ['ds-scroll-fade', 'scroll-linked: both ends named, so an inactive timeline (a scroller without overflow) leaves the element\'s own opacity 0'],
  ['ds-edge-fade', 'scroll-linked: a position on the table\'s scroll timeline, not an entrance, so both ends are named'],
  ['ds-scroll-edge-start', 'scroll-linked: the start fade of a sideways scroller over the first --ds-space-8 of its scroll, a position, not an entrance'],
  ['ds-scroll-edge-end', 'scroll-linked: the end fade of a sideways scroller over the last --ds-space-8 of its scroll, a position, not an entrance'],
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
/** A drawn glyph (pathLength="1") or what it inherits from (an icon-swap face, a chip's check, the mark of a task or a step): stroke-dashoffset may transition there (drawn checks). */
const drawnGlyph = (selector) => splitSelectors(selector).every((part) => /\[pathLength\]$|> \.ds-icon-swap__[ab]$|\.ds-chip__check$|^\.ds-tasks__mark$|^\.ds-steps__mark$/.test(part));
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
      ['.ds-field__hint--success', 'the room of a confirmation under a field opens like a validation message\'s (D29), only where interpolate-size exists'],
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
/** Whether the @keyframes `name` may animate `property`. */
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

/**
 * The longest duration (ms) the rule `selector` of `file` sets through `properties` (first time of each list entry);
 * `only`: the entries of that animated property alone (a fade whose element also travels).
 */
function longest(file, selector, properties, only) {
  const times = [];
  for (const { property, value } of declarationsAt(read(file), selector)) {
    if (!properties.includes(property)) continue;
    if (property === 'animation' || property === 'transition') {
      for (const entry of entriesOf(value)) if (entry.times.length && (!only || entry.name === only)) times.push(entry.times[0]);
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
  ['full-screen dialog (DS.overlay)', [['src/components/dialog.css', '.ds-dialog--full[data-state] .ds-dialog__box', ['transition']]], [['src/components/dialog.css', '.ds-dialog--full[data-state="closed"] .ds-dialog__box', ['transition']]]],
  ['action sheet (DS.overlay)', [['src/components/dialog.css', '.ds-dialog--bottom[data-state] .ds-dialog__box', ['transition']]], [['src/components/dialog.css', '.ds-dialog--bottom[data-state="closed"] .ds-dialog__box', ['transition']]]],
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
  ['presence that keeps its box', [[M, '.ds-presence--keep[data-ds-shown]', ['transition']]], [[M, '.ds-presence--keep', ['transition']]]],
  ['switch lock (fade; it travels with the handle)', [['src/components/switch.css', '.ds-switch--locked .ds-switch__icon', ['transition'], 'opacity']], [['src/components/switch.css', '.ds-switch__icon', ['transition'], 'opacity']]],
  ['hover actions', [['src/components/utilities.css', '.ds-hover-actions:is(:focus-within, [data-ds-shown], :has([aria-expanded="true"]))', ['transition']]], [['src/components/utilities.css', '.ds-hover-actions', ['transition']]]],
  ['changed dot', [['src/components/form.css', '.ds-field--changed > .ds-field__label::after', ['transition']]], [['src/components/form.css', '.ds-field__label::after', ['transition']]]],
  ['search key', [['src/components/form.css', '.ds-search__key', ['transition']]], [['src/components/form.css', '.ds-search .ds-input:is(:focus, :not(:placeholder-shown), :disabled) ~ .ds-search__key', ['transition']]]],
  ['radio tile check', [['src/components/form.css', '.ds-radio > input:checked ~ .ds-radio__mark > svg', ['transition']]], [['src/components/form.css', '.ds-radio__mark > svg', ['transition']]]],
  ['rail labels', [['src/components/shell.css', '.ds-drawer__label', ['transition']]], [['src/components/shell.css', '.ds-app--drawer[data-drawer-collapsed] .ds-drawer :is(.ds-drawer__label, .ds-drawer__heading:not(.ds-drawer__toggle), .ds-drawer__toggle > span, .ds-drawer__count)', ['transition']]]],
];
const resolveDuration = (candidates) => candidates.map(([file, selector, properties, only]) => longest(file, selector, properties, only)).find((time) => time !== undefined);
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
      ['.ds-switch:active input:not(:disabled, [aria-disabled="true"]) + .ds-switch__track::after', 'the handle grows to its pressed size'],
      ['.ds-switch.ds-pressed input:not(:disabled, [aria-disabled="true"]) + .ds-switch__track::after', 'the handle grows to its pressed size'],
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

  it('pairs every movement exit with ds-fade-out', () => {
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
      ['250/150', '250/150', '250/150', '150/100', '250/100', '150/100', '150/100', '150/100', '150/100', '150/100', '150/100', '250/150', '150/100']);
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
      if (/-out$/.test(name) && name !== 'ds-fade-out') assert.ok(!/opacity\s*:/.test(body), `${name}: an exit is movement only`);
      // No keyframe writes transform (the spinner turns on rotate), so an element's own transform always stays.
      assert.doesNotMatch(body, /(^|[;{\s])transform\s*:/, `${name}: use translate, scale and rotate`);
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
      for (const { property } of declarations(body)) {
        if (ANIMATABLE.has(property) || REGISTERED.has(property)) continue;
        if (!keyframeException(name, property)) offenders.push(`@keyframes ${name}: ${property}`);
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
    assert.match(KEYFRAMES['ds-spin'], /^\s*to\s*\{\s*rotate:\s*1turn;\s*\}\s*$/);
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

  it('never shadows a size hook with a literal on a component (D16: a modifier reads its own hook)', () => {
    // Assignments of --ds-* inside src/components/ whose value, outside var() and outside
    // calc()/min()/max()/clamp()/color-mix() of tokens, still holds a length or a number other than 0 and 1.
    // Allowed: forced-colours blocks, the runtime properties, the registered ones and the motion hooks.
    const strip = (value) => {
      let out = value;
      for (let i = 0; i < 8; i += 1) out = out.replace(/(?:var|calc|min|max|clamp|color-mix)\([^()]*\)/g, ' ');
      return out;
    };
    const offenders = [];
    for (const file of filesIn('src/components', (path) => path.endsWith('.css'))) {
      for (const { selector, body } of rules(withoutAtRuleBlocks(read(file), /@media\s*\(forced-colors:\s*active\)/))) {
        for (const { property, value } of declarations(`${body};`)) {
          if (!property.startsWith('--ds-') || RUNTIME.has(property) || REGISTERED.has(property) || /^--ds-(motion|enter|leave)-/.test(property)) continue;
          const left = strip(value);
          if (!/(?<![\w.-])\d*\.?\d+(px|rem|em|vw|vh|%)(?![\w-])/.test(left) && !/(?<![\w.%-])(?![01](?![\d.]))\d*\.?\d+(?![\w.%-])/.test(left)) continue;
          for (const part of splitSelectors(selector)) offenders.push(`${file}: ${part}: ${property}: ${value}`);
        }
      }
    }
    assert.deepEqual(offenders, []);
    // The five size modifiers of 1.6 read their own hooks.
    const reads = [
      ['src/components/button.css', '.ds-btn--sm', '--ds-btn-height', 'var(--ds-btn-sm-height, 32px)'],
      ['src/components/button.css', '.ds-btn--icon.ds-btn--sm', '--ds-btn-icon-size', 'var(--ds-btn-sm-icon-size, 32px)'],
      ['src/components/loader.css', '.ds-loader--sm', '--ds-loader-size', 'var(--ds-loader-sm-size, 24px)'],
      ['src/components/spinner.css', '.ds-spinner--determinate', '--ds-spinner-width', 'var(--ds-spinner-determinate-width, 4px)'],
      ['src/components/status.css', '.ds-status__spinner', '--ds-spinner-width', 'var(--ds-status-spinner-width, 2px)'],
      // and the small check row, so .ds-touch reaches it.
      ['src/components/form.css', '.ds-check--sm', '--ds-check-height', 'var(--ds-check-sm-height, 32px)'],
    ];
    for (const [file, selector, property, value] of reads) {
      assert.equal(declarationsAt(read(file), selector).find((entry) => entry.property === property)?.value, value, `${selector} { ${property} }`);
    }
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

  it('puts .ds-presence on a wrapper, never on a button, chip or card (their own transitions would go), 2.0', () => {
    const files = [...filesIn('docs', (path) => path.endsWith('.md')), ...filesIn('styleguide', (path) => /\.(js|html)$/.test(path)),
      ...filesIn('example', (path) => /\.(js|html)$/.test(path)), ...filesIn('demo', (path) => /\.(js|html)$/.test(path))];
    const offenders = [];
    for (const file of files) {
      for (const match of read(file).matchAll(/class=(["'])([^"']*)\1/g)) {
        const names = match[2].split(/\s+/);
        if (names.includes('ds-presence') && names.some((name) => /^ds-(btn|chip|card)$/.test(name))) offenders.push(`${file}: ${match[0]}`);
      }
    }
    assert.deepEqual(offenders, []);
    // The keep variant toggles a page-set attribute, outside every feature query.
    const outside = withoutAtRuleBlocks(stripComments(read('src/motion.css')), /@supports/);
    assert.match(outside, /\.ds-presence--keep\s*\{[^}]*visibility:\s*hidden/);
    assert.match(outside, /\.ds-presence--keep\[data-ds-shown\]\s*\{[^}]*visibility:\s*visible/);
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
    // A view outside the app frame (2.0) is named only while a transition runs.
    const vtView = '.ds-theme[data-ds-vt] .ds-vt-view';
    assert.ok(selectors.includes(vtView), vtView);
    assert.deepEqual(selectors.filter((selector) => selector !== hidden && selector !== vtView && !moving.test(selector) && !viewTransition.test(selector) && !/^(dialog)?\.ds-(enter|leave|stagger|reveal|collapsible|chevron|swap|icon-swap(__[ab])?|presence)\b/.test(selector)), []);
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
      ...['position', 'top', 'inset-inline-start', 'width', 'height', 'padding', 'margin', 'overflow', 'clip', 'white-space', 'border']
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
            // or sit on the element's own pseudo-element (a link stretched over a row or card, the
            // handle of a slider).
            const compound = part.split(/\s*[\s>+~]\s*/).find((piece) => piece.includes(':focus-visible'));
            const own = new RegExp(`${literally(compound)}::(before|after|-webkit-slider-thumb|-moz-range-thumb)$`);
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
      const name = ['calendar', 'clock', 'close', 'check'].find((glyph) => icons[glyph] === inner);
      assert.ok(name, `not a glyph of the set: ${inner}`);
      drawn.add(name);
      // The checkbox check alone is heavier: stroke 3 is 2.25px in the 18px box.
      const width = name === 'check' ? 3 : 2;
      assert.match(svg, new RegExp(`stroke-width='${width}' stroke-linecap='round' stroke-linejoin='round'`));
    }
    assert.deepEqual([...drawn].sort(), ['calendar', 'check', 'clock', 'close']);
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
    // .ds-input itself: an input group draws a box of its own.
    const hover = rules(read('src/components/form.css')).filter((rule) => /^\.ds-input(?![\w-])[^\s,]*:hover/.test(rule.selector) && rule.body.includes('var(--ds-text)'));
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
      ['src/components/list.css', '.ds-list--interactive > .ds-list__item:has(.ds-list__action:focus-visible)::before', 'var(--ds-state-focus)'],
      ['src/components/list.css', ':is(a, button).ds-kv-list__row:focus-visible::before', 'var(--ds-state-focus)'],
      ['src/components/disclosure.css', '.ds-disclosure > summary:focus-visible::before', 'var(--ds-state-focus)'],
      ['src/components/chart.css', ':is(button, a).ds-columns__col:focus-visible::before', 'var(--ds-state-focus)'],
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
      ['src/components/list.css', '.ds-list__meta'],
      ['src/components/timeline.css', '.ds-timeline__meta'],
      ['src/components/chart.css', '.ds-columns__value'],
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
  ['.ds-slider', 'a range input: the halo around its handle is the press (an input cannot hold a ripple), like the switch'],
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
    ['src/components/combobox.css', '.ds-combo__toggle', 'calc(var(--ds-input-height, 40px) / 2)', 'var(--ds-radius-action-pressed)'],
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
      assert.ok(part.includes(':not(.ds-radio--disabled, :has(input:is(:disabled, [aria-disabled="true"])))'), part);
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
      ['src/components/list.css', ':is(a, button).ds-kv-list__row', '[aria-disabled="true"]:focus-visible::before'],
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
    // The layer is the host's ::before; a table row's is the --ds-table-row-layer its cells paint
    // (> :is(td, th), so a <th scope="row"> row header has it too).
    const layer = (part, body) => part.endsWith('::before') || part.endsWith(' > :is(td, th)') || /(^|[;{\s])--ds-table-row-layer\s*:/.test(body);
    const ripple = rules(read('src/components/ripple.css')).flatMap((rule) => splitSelectors(rule.selector).map((part) => ({ part, body: rule.body })));
    for (const host of hosts.filter((item) => item !== '[data-ds-ripple]')) {
      const layered = COMPONENT_CSS.filter((path) => path !== 'src/components/ripple.css').some((file) => rules(read(file))
        .some((rule) => splitSelectors(rule.selector).some((part) => new RegExp(`${literally(host)}(?![\\w-])[^,]*:active`).test(part) && layer(part, rule.body))));
      assert.ok(layered, `${host}: a pressed state layer`);
      assert.ok(ripple.some(({ part, body }) => part.startsWith(`:where(.ds-ripples) ${host}:where(`) && part.includes(':is(:active, .ds-pressed)') && layer(part, body)), `${host}: its .ds-ripples rule`);
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
    const chip = reads('src/components/chip.css', '.ds-chip__input:is(:disabled, [aria-disabled="true"]) + .ds-chip__body');
    for (const token of ['--ds-disabled-fill', '--ds-disabled-ink', '--ds-disabled-opacity']) assert.ok(chip.includes(token), `chip: ${token}`);
    const track = reads('src/components/switch.css', '.ds-switch input:is(:disabled, [aria-disabled="true"]) + .ds-switch__track');
    for (const token of ['--ds-disabled-fill', '--ds-disabled-opacity']) assert.ok(track.includes(token), `switch track: ${token}`);
    assert.ok(reads('src/components/switch.css', '.ds-switch input:is(:disabled, [aria-disabled="true"]) + .ds-switch__track::after').includes('--ds-disabled-ink'), 'switch handle');
    // Hover changes nothing on a disabled chip or switch.
    const hover = atRuleBlocks(read('src/components/switch.css'), /@media\s*\(hover:\s*hover\)/).flatMap((block) => rules(block)).flatMap((rule) => splitSelectors(rule.selector));
    assert.ok(hover.length && hover.every((part) => part.includes(':not(:disabled, [aria-disabled="true"])')), hover.join(' | '));
    const chipHover = atRuleBlocks(read('src/components/chip.css'), /@media\s*\(hover:\s*hover\)/).flatMap((block) => rules(block)).flatMap((rule) => splitSelectors(rule.selector));
    // aria-disabled (2.0) is blocked like disabled: :not(:disabled, [aria-disabled="true"]).
    assert.ok(chipHover.length && chipHover.every((part) => part.includes(':not(:disabled, [aria-disabled="true"])')), chipHover.join(' | '));
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
    // A blocked option (2.0) fades to the disabled model on --ds-dur-fast, the one other colour timing.
    const BLOCKED = /:is\(:disabled, \[aria-disabled="true"\]\)$/;
    for (const { selector, body } of rules(read(SHELL))) {
      if (!animated(body).includes('color')) continue;
      if (splitSelectors(selector).every((part) => BLOCKED.test(part))) {
        const colour = declarations(`${body};`).filter(({ property }) => property === 'transition')
          .flatMap(({ value }) => entriesOf(value)).find((entry) => entry.name === 'color');
        assert.deepEqual(colour?.words, ['color', 'var(--ds-dur-fast)', 'var(--ds-ease-in-out)'], selector);
        continue;
      }
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
        // The scroll-linked edge numbers run on a scroll position, not on the open state.
        }).filter((name) => name !== 'none' && !/^ds-scroll-edge-(start|end)$/.test(name));
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

  it('scrolls only the body of a dialog that has one, with room for rings, and lets the box scroll in a short window (2.0)', () => {
    // The screen rules outside the short-window and phone blocks.
    const css = withoutAtRuleBlocks(withoutAtRuleBlocks(read('src/components/dialog.css'), /@media\s*\(max-height:\s*320px\)/), /@media\s*\(max-width:\s*600px\)/);
    const own = (selector) => Object.fromEntries(declarationsAt(css, selector).map((entry) => [entry.property, entry.value]));
    assert.deepEqual([own('.ds-dialog__box:has(> .ds-dialog__body)').display, own('.ds-dialog__box:has(> .ds-dialog__body)')['flex-direction']], ['flex', 'column']);
    assert.equal(own('.ds-dialog__box > *')['flex-shrink'], '0');
    const body = own('.ds-dialog__body');
    assert.deepEqual([body['overflow-y'], body['min-height'], body.margin, body.padding, body['overscroll-behavior']],
      ['auto', '0', 'calc(-1 * var(--ds-space-3))', 'var(--ds-space-3)', 'contain']);
    // The hairline is a border (forced colours keep it), shown while scrolled.
    assert.equal(body['border-top'], '1px solid transparent');
    assert.equal(own('.ds-dialog__box[data-scrolled] > .ds-dialog__body')['border-top-color'], 'var(--ds-line)');
    const short = atRuleBlocks(read('src/components/dialog.css'), /@media\s*\(max-height:\s*320px\)/).join('\n');
    assert.equal(declarationsOf(short, '.ds-dialog__body').find((entry) => entry.property === 'overflow')?.value, 'visible', 'a window 320px high: the box scrolls');
    assert.equal(own('.ds-dialog__box').height, 'var(--ds-dialog-height, auto)');
    assert.equal(own('.ds-dialog--wide .ds-dialog__box').width, 'min(var(--ds-dialog-width-wide, 560px), 100%)');
    assert.equal(own('.ds-dialog__body:empty').display, 'none');
    assert.equal(own('.ds-dialog__actions:empty').display, 'none');
    // The fallback focus of the box shows no ring (it beats the ds.base ring by layer).
    assert.equal(own('.ds-dialog__box[tabindex="-1"]:focus').outline, 'none');
    assert.equal(own('.ds-dialog--full .ds-dialog__box')['border-radius'], 'var(--ds-dialog-full-radius, 0)');
  });

  it('gives the side sheet a wrapping title, a subtitle, a foot and a positioned body with a thin scrollbar (2.0)', () => {
    const css = read('src/components/sheet.css');
    const own = (selector) => Object.fromEntries(declarationsAt(css, selector).map((entry) => [entry.property, entry.value]));
    const title = own('.ds-sheet__title');
    assert.equal(title['overflow-wrap'], 'anywhere');
    assert.equal(title['white-space'], undefined, 'the title wraps');
    assert.equal(own('.ds-sheet__subtitle')['text-overflow'], 'ellipsis');
    assert.equal(own('.ds-sheet__subtitle:empty').display, 'none');
    assert.equal(own('.ds-sheet__foot')['border-top'], 'var(--ds-sheet-foot-border, 1px solid var(--ds-line))');
    assert.equal(own('.ds-sheet__foot:empty').display, 'none');
    const body = own('.ds-sheet__body');
    assert.deepEqual([body.position, body['scrollbar-width'], body['scrollbar-color']], ['relative', 'thin', 'var(--ds-line-2) transparent']);
    assert.equal(own('.ds-sheet__body > .ds-btn')['align-self'], 'flex-start');
    assert.match(read('src/components/sheet.css').match(/^\/\*[\s\S]*?\*\//)[0], /aria-label="Close" data-close>/, 'the header markup closes with data-close');
  });

  it('sizes the combobox from the field hooks and draws blocked options and menu items in GrayText when forced (2.0)', () => {
    const combo = read('src/components/combobox.css');
    const own = (css, selector) => Object.fromEntries(declarationsAt(css, selector).map((entry) => [entry.property, entry.value]));
    assert.equal(own(combo, '.ds-combo__input')['padding-inline-end'], 'calc(var(--ds-space-1) + var(--ds-input-height, 40px))');
    assert.deepEqual([own(combo, '.ds-combo__toggle').width, own(combo, '.ds-combo__toggle').height], ['var(--ds-input-height, 40px)', 'var(--ds-input-height, 40px)']);
    assert.equal(own(combo, '.ds-combo__option')['min-height'], 'var(--ds-combo-option-height, 48px)');
    assert.equal(own(combo, '.ds-combo:not(:has(.ds-combo__toggle)) > .ds-combo__input')['padding-inline-end'], 'var(--ds-space-3)');
    assert.equal(own(read('src/components/menu.css'), '.ds-menu__item')['min-height'], 'var(--ds-menu-item-height, 48px)');
    for (const [file, selector] of [['src/components/menu.css', '.ds-menu__item[aria-disabled="true"]'], ['src/components/combobox.css', '.ds-combo__option[aria-disabled="true"]']]) {
      const forced = forcedColorBlocks(read(file)).flatMap((block) => declarationsOf(block, selector));
      assert.equal(forced.find((entry) => entry.property === 'color')?.value, 'GrayText', `${file}: ${selector}`);
    }
    // The header markup names the live status and the list autocomplete.
    const header = combo.match(/^\/\*[\s\S]*?\*\//)[0];
    assert.match(header, /class="ds-combo__status" role="status"/);
    assert.match(header, /aria-autocomplete="list"/);
  });

  it('prints no open overlay: menus, the combobox list, dialogs and side sheets are hidden in print (2.0)', () => {
    for (const [file, selector] of [['src/components/menu.css', '.ds-menu'], ['src/components/combobox.css', '.ds-combo__popup'], ['src/components/dialog.css', '.ds-dialog'], ['src/components/sheet.css', '.ds-sheet'], ['src/components/toast.css', '.ds-toasts'], ['src/components/tooltip.css', '.ds-tooltip'], ['src/components/loader.css', '.ds-loader']]) {
      const print = atRuleBlocks(read(file), /@media\s+print/).flatMap((block) => declarationsOf(block, selector));
      assert.equal(print.find((entry) => entry.property === 'display')?.value, 'none', `${file}: ${selector} in print`);
    }
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

  it('gives the loading parts of 2.0 their hooks and layout: bone radius, the skeleton note, detail lines', () => {
    const css = read('src/components/loading.css');
    const own = (selector) => Object.fromEntries(declarationsAt(css, selector).map((entry) => [entry.property, entry.value]));
    assert.equal(own('.ds-skeleton__line')['border-radius'], 'var(--ds-skeleton-radius, var(--ds-radius-action))');
    assert.match(stripComments(css), /\.ds-skeleton__line--heading \{[^}]*border-radius: var\(--ds-skeleton-radius, var\(--ds-radius-sm\)\)/);
    assert.deepEqual([own('.ds-skeleton__note').color, own('.ds-skeleton__note').font, own('.ds-skeleton__note')['font-variant-numeric']], ['var(--ds-text-2)', 'var(--ds-font-meta)', 'tabular-nums']);
    assert.equal(own('.ds-skeleton__note:empty').display, 'none');
    assert.equal(own('.ds-loading').display, 'grid');
    assert.equal(own('.ds-loading__detail')['grid-column'], '2');
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
    const scrollLinked = ['ds-scroll-fade', 'ds-edge-fade', 'ds-scroll-edge-start', 'ds-scroll-edge-end'];
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
    // The edge numbers (2.0): from 0 to 1 at the start, 1 to 0 at the end, registered <number>s that do not inherit.
    for (const [name, property, from, to] of [['ds-scroll-edge-start', '--ds-scroll-edge-start', '0', '1'], ['ds-scroll-edge-end', '--ds-scroll-edge-end', '1', '0']]) {
      const stops = Object.fromEntries(rules(KEYFRAMES[name]).map((rule) => [rule.selector, declarations(rule.body)]));
      assert.deepEqual(Object.keys(stops), ['from', 'to'], name);
      assert.deepEqual([stops.from, stops.to].map((list) => list.map((entry) => `${entry.property}: ${entry.value}`)), [[`${property}: ${from}`], [`${property}: ${to}`]], name);
      assert.ok(REGISTERED.has(property), `${property} is registered`);
      assert.match(stripComments(read('src/components/scroller.css')), new RegExp(`@property ${property} \\{\\s*syntax: '<number>';\\s*inherits: false;\\s*initial-value: 0;`), property);
    }
    // Every user of the edge numbers runs both on its own scroll (inline; the combobox list block), over the documented ranges.
    const shades = new Set(['.ds-menu::before', '.ds-menu::after']);
    const edges = users.filter((rule) => /ds-scroll-edge-start/.test(rule.own.animation) && !shades.has(rule.selector));
    assert.ok(edges.length >= 5, edges.map((rule) => rule.selector).join());
    for (const rule of edges) {
      assert.equal(rule.own.animation, 'ds-scroll-edge-start linear both, ds-scroll-edge-end linear both', rule.selector);
      assert.equal(rule.own['animation-timeline'], rule.selector === '.ds-combo__list' ? 'scroll(self block)' : 'scroll(self inline)', rule.selector);
      assert.equal(rule.own['animation-range'], '0 var(--ds-space-8), calc(100% - var(--ds-space-8)) 100%', rule.selector);
    }
    // The menu is its own surface: one shade per edge, each on the menu's block scroll (the nearest scroller of its pseudo-element).
    const shade = Object.fromEntries(users.filter((rule) => shades.has(rule.selector)).map((rule) => [rule.selector, rule.own]));
    assert.deepEqual(Object.keys(shade).sort(), ['.ds-menu::after', '.ds-menu::before']);
    assert.deepEqual(['.ds-menu::before', '.ds-menu::after'].map((selector) => [shade[selector].animation, shade[selector]['animation-timeline'], shade[selector]['animation-range']]), [
      ['ds-scroll-edge-start linear both', 'scroll(nearest block)', '0 var(--ds-space-8)'],
      ['ds-scroll-edge-end linear both', 'scroll(nearest block)', 'calc(100% - var(--ds-space-8)) 100%'],
    ]);
  });

  it('names View Transitions and scroll-driven animations under "Progressive:" in each file that uses them', () => {
    const expected = {
      'src/components/shell.css': ['View Transitions', 'scroll-driven'],
      'src/components/sheet.css': ['View Transitions', 'scroll-driven'],
      'src/components/table.css': ['scroll-driven'],
      'src/components/scroller.css': ['scroll-driven'],
      'src/components/menu.css': ['scroll-driven'],
      'src/components/combobox.css': ['scroll-driven'],
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

describe('lists, timeline, tasks and charts (2.0)', () => {
  /** The declarations of `selector` in `file` outside forced colours (the screen rules). */
  const own = (file, selector) => Object.fromEntries(declarationsAt(withoutAtRuleBlocks(read(file), /@media\s*\(forced-colors:\s*active\)/), selector).map((entry) => [entry.property, entry.value]));
  const LIST = 'src/components/list.css';
  const CHART = 'src/components/chart.css';

  it('registers --ds-share at top level, a number that inherits, and fills marks from it once', () => {
    const topLevel = withoutAtRuleBlocks(stripComments(read('src/tokens.css')), /^@layer\b/);
    assert.match(topLevel, /@property --ds-share \{\s*syntax: '<number>';\s*inherits: true;\s*initial-value: 0;\s*\}/);
    assert.match(KEYFRAMES['ds-fill-share'], /^\s*from\s*\{\s*--ds-share:\s*0;\s*\}\s*$/);
    const fill = Object.fromEntries(declarationsOf(read('src/motion.css'), '.ds-enter--fill').map((entry) => [entry.property, entry.value]));
    assert.equal(fill['--ds-enter-keyframes'], 'ds-fade-in, ds-fill-share');
    assert.equal(fill['--ds-enter-duration'], 'var(--ds-dur-glide)');
    assert.equal(fill['--ds-enter-easing'], 'var(--ds-ease-in-out), var(--ds-ease-value)');
  });

  it('clips chart fills at the share and never scales them; the share glides on the value curve', () => {
    assert.ok(!declarations(read(CHART)).some(({ property }) => property === 'transform' || property === 'scale'), 'no transform or scale in chart.css');
    assert.match(own(CHART, '.ds-meter::before')['clip-path'], /^inset\(0 calc\(\(1 - var\(--ds-share\)\) \* 100%\) 0 0 round var\(--ds-radius-action\)\)$/);
    assert.match(own(CHART, '.ds-columns__fill')['clip-path'], /^inset\(calc\(\(1 - var\(--ds-share\)\) \* 100%\) 0 0 0 round /);
    for (const selector of ['.ds-meter', '.ds-columns__col']) {
      assert.equal(own(CHART, selector).transition, '--ds-share var(--ds-dur-glide) var(--ds-ease-value)', selector);
    }
    // The value rides on the share (translate only), and the track is the neutral role, not the tint.
    assert.match(own(CHART, '.ds-columns__value').translate, /var\(--ds-share\)/);
    assert.equal(own(CHART, '.ds-meter').background, 'var(--ds-meter-track, var(--ds-chart-track))');
  });

  it('hatches series 2 to 4 in forced colours, so they stay apart without colour', () => {
    const forced = forcedColorBlocks(read(CHART)).join('\n');
    for (const [series, angle] of [['s2', '45deg'], ['s3', '135deg'], ['s4', '90deg']]) {
      const fill = declarationsOf(forced, `.ds-columns__col--${series} > .ds-columns__fill`).find((entry) => entry.property === 'background')?.value ?? '';
      assert.match(fill, new RegExp(`^repeating-linear-gradient\\(${angle}, CanvasText`), series);
      const key = declarationsOf(forced, `.ds-legend__key--${series}`).find((entry) => entry.property === 'background')?.value ?? '';
      assert.equal(key, fill, `legend key ${series}`);
    }
  });

  it('presses interactive list rows by layer only (no morph), with an inset ring and the blocked model', () => {
    const row = '.ds-list--interactive > .ds-list__item';
    const css = read(LIST);
    assert.equal(own(LIST, row)['outline-offset'], '0');
    assert.ok(!/border-radius/.test(own(LIST, row).transition), 'no morph');
    assert.equal(own(LIST, `${row}:has(.ds-list__action:focus-visible)`)['outline-offset'], 'calc(-1 * var(--ds-focus-width))');
    const hover = atRuleBlocks(css, /@media\s*\(hover:\s*hover\)/).flatMap((block) => declarationsOf(block, `${row}:hover::before`));
    assert.equal(hover.find((entry) => entry.property === 'opacity')?.value, 'var(--ds-state-hover-lg)');
    const blocked = `${row}:has(.ds-list__action:is(:disabled, [aria-disabled="true"]))`;
    assert.equal(own(LIST, `${blocked}:is(:active, .ds-pressed)::before`).opacity, '0');
    assert.equal(own(LIST, blocked).cursor, 'not-allowed');
    assert.equal(own(LIST, `${row}:has(.ds-list__action[aria-disabled="true"]:focus-visible)::before`).opacity, 'var(--ds-state-focus)');
    // Never clips: a row's menu must not be cut.
    assert.ok(!('overflow' in own(LIST, '.ds-list')), '.ds-list sets no overflow');
    // The current row: aria-current itself, SelectedItem in forced colours.
    const forced = forcedColorBlocks(css).join('\n');
    assert.match(forced, /\.ds-list__item:is\(\[aria-current\][^{]*\{[^}]*background: SelectedItem;[^}]*color: SelectedItemText;/);
  });

  it('gives clickable key-value rows the state layer, a snapping ring and the disabled model; the kv fixes', () => {
    const row = ':is(a, button).ds-kv-list__row';
    assert.equal(own(LIST, row)['outline-offset'], 'calc(var(--ds-focus-offset) + var(--ds-focus-width))');
    assert.equal(own(LIST, `${row}:is(:disabled, [aria-disabled="true"])`).color, 'var(--ds-disabled-ink)');
    assert.equal(own(LIST, `${row}:is(:disabled, [aria-disabled="true"]):is(:active, .ds-pressed)::before`).opacity, '0');
    assert.equal(own(LIST, `${row}[aria-disabled="true"]:focus-visible::before`).opacity, 'var(--ds-state-focus)');
    // No bottom padding on the last row, wrapping parts, end alignment, no top margin.
    assert.equal(own(LIST, '.ds-kv-list li:last-child')['padding-bottom'], '0');
    assert.equal(own(LIST, '.ds-kv-list :is(li, .ds-kv-list__row) > :is(span, strong)')['overflow-wrap'], 'anywhere');
    assert.equal(own(LIST, '.ds-kv-list strong')['text-align'], 'end');
    assert.equal(own(LIST, ':where(.ds-kv-list, .ds-plain-list, .ds-list)')['margin-top'], '0');
    assert.equal(own(LIST, '.ds-facts--rows').display, 'block');
  });

  it('morphs the plain disclosure summary like a pill; a row summary takes an inset ring and no morph', () => {
    const file = 'src/components/disclosure.css';
    const half = 'calc(var(--ds-disclosure-height, 40px) / 2)';
    const rest = own(file, '.ds-disclosure > summary');
    assert.equal(rest['border-radius'], `min(var(--ds-radius-action), ${half})`);
    assert.match(rest.transition, /border-radius var\(--ds-dur-medium\) var\(--ds-ease-spatial\)/);
    for (const state of [':active', '.ds-pressed']) {
      const pressed = own(file, `.ds-disclosure:not(.ds-disclosure--row) > summary${state}`);
      assert.equal(pressed['border-radius'], `min(var(--ds-radius-action-pressed), ${half})`, state);
      assert.match(pressed.transition, /border-radius var\(--ds-dur-micro\) var\(--ds-ease-out\)/, state);
    }
    const row = own(file, '.ds-disclosure--row > summary');
    assert.equal(row['border-radius'], '0');
    assert.equal(row['outline-offset'], '0');
    assert.equal(own(file, '.ds-disclosure--row > summary:focus-visible')['outline-offset'], 'calc(-1 * var(--ds-focus-width))');
  });

  it('draws timeline dots and rails with borders (they stay in forced colours) and has no motion of its own', () => {
    const file = 'src/components/timeline.css';
    const dot = own(file, '.ds-timeline__item::after');
    assert.match(dot.border, /^calc\(var\(--ds-timeline-dot-size, 10px\) \/ 2\) solid var\(--ds-timeline-dot-color, var\(--ds-primary\)\)$/);
    assert.ok(!('background' in dot) && !('background-color' in dot), 'a dot of borders, no background');
    assert.match(own(file, '.ds-timeline__item::before')['border-inline-start'], /var\(--ds-timeline-line-width, 2px\) solid/);
    assert.deepEqual(declarations(read(file)).filter(({ property }) => /^(transition|animation)/.test(property)), []);
  });

  it('shows the status of a task by the mark and the weight, never by colour alone', () => {
    const file = 'src/components/tasks.css';
    assert.match(own(file, '.ds-tasks__item[data-status="pending"] .ds-tasks__mark::before').border, /solid var\(--ds-outline\)/);
    assert.equal(own(file, '.ds-tasks__item[data-status="running"] .ds-tasks__text')['font-weight'], 'var(--ds-weight-label)');
    // The tick draws through the mark's inherited dash offset: a transition, so a list rendered done stays still.
    assert.equal(own(file, '.ds-tasks__mark').transition, 'stroke-dashoffset var(--ds-dur-medium) var(--ds-ease-out) var(--ds-dur-micro)');
    assert.equal(own(file, '.ds-tasks__mark')['stroke-dashoffset'], '1');
    assert.equal(own(file, '.ds-tasks__item[data-status="done"] .ds-tasks__mark')['stroke-dashoffset'], '0');
    assert.equal(own(file, '.ds-tasks__item[data-status="done"] .ds-tasks__mark [pathLength]')['stroke-dasharray'], '1');
  });
});

describe('app frame, page and base (2.0)', () => {
  const SHELL = 'src/components/shell.css';
  const COMPONENT_FILES = filesIn('src/components', (path) => path.endsWith('.css'));
  /** The block a selector part styles: its last compound's first .ds- class, without a modifier. */
  const blockOf = (part) => {
    const last = part.trim().split(/\s+|>|\+|~/).filter(Boolean).at(-1) || '';
    return /(\.ds-[\w-]+?)(?:--[\w-]+)?(?=[\s:.[>+~)]|$)/.exec(last)?.[1] ?? null;
  };
  /** Every block of src/components/ whose rules declare `property` matching `value`. */
  const blocksWith = (property, value) => new Set(COMPONENT_FILES.flatMap((file) => rules(stripComments(read(file)))
    .filter((rule) => declarations(`${rule.body};`).some((entry) => property.test(entry.property) && value.test(entry.value)))
    .flatMap((rule) => splitSelectors(rule.selector).map(blockOf).filter(Boolean))));
  /** Scrollers that hold no element to position, each with its reason. */
  const SCROLLERS_EXEMPT = new Map([
    ['.ds-input', 'textarea.ds-input--grow scrolls its own text: a textarea has no child elements'],
  ]);

  it('positions every block that scrolls, so its absolute content and scroll-into-view stay inside it', () => {
    const scrollers = blocksWith(/^overflow(-x|-y)?$/, /\b(auto|scroll)\b/);
    const positioned = blocksWith(/^position$/, /^(relative|absolute|fixed|sticky)$/);
    for (const block of ['.ds-view', '.ds-drawer__list', '.ds-tabs', '.ds-code-block']) assert.ok(scrollers.has(block), `${block} scrolls`);
    const missing = [...scrollers].filter((block) => !positioned.has(block) && !SCROLLERS_EXEMPT.has(block));
    assert.deepEqual(missing, []);
  });

  it('gives button options the reset and selects them by aria-current, aria-checked or aria-pressed', () => {
    const css = stripComments(read(SHELL));
    const reset = declarationsOf(css, 'button.ds-segmented__option');
    for (const [property, value] of [['margin', '0'], ['border', '0'], ['background', 'none'], ['cursor', 'pointer']]) {
      assert.ok(reset.some((entry) => entry.property === property && entry.value === value), `button option: ${property}: ${value}`);
    }
    const SELECTED = '.ds-segmented__option:is([aria-current="true"], [aria-checked="true"], [aria-pressed="true"])';
    assert.ok(rules(css).some((rule) => splitSelectors(rule.selector).includes(SELECTED)), SELECTED);
    assert.ok(!rules(css).some((rule) => splitSelectors(rule.selector).includes('.ds-segmented__option[aria-current="true"]')), 'the old selection selector is folded into :is()');
  });

  it('gives the brand link the touch target under .ds-touch', () => {
    const touch = declarationsOf(stripComments(read(SHELL)), '.ds-touch .ds-brand');
    for (const property of ['min-width', 'min-height']) {
      assert.ok(touch.some((entry) => entry.property === property && entry.value === 'var(--ds-touch-target)'), property);
    }
  });

  it('keeps the segmented switch\'s start margin to the top bar', () => {
    const css = withoutAtRuleBlocks(stripComments(read(SHELL)), /@media/);
    const own = declarationsOf(css, '.ds-segmented').map((entry) => entry.property);
    assert.ok(!own.some((property) => /^margin/.test(property)), '.ds-segmented itself sits flush');
    assert.ok(declarationsOf(css, '.ds-topbar .ds-segmented').some((entry) => entry.property === 'margin-inline-start' && entry.value === 'var(--ds-space-4)'));
  });

  it('paints a choice in a set SelectedItem in forced colours: the current drawer item, the selected option and tab', () => {
    const blocks = (file) => forcedColorBlocks(stripComments(read(file))).join('\n');
    const selectedIn = (css, needle) => rules(css).some((rule) => splitSelectors(rule.selector).some((part) => part.includes(needle))
      && /background(-color)?:\s*SelectedItem\b/.test(rule.body) && /color:\s*SelectedItemText/.test(rule.body) && /forced-color-adjust:\s*none/.test(rule.body));
    assert.ok(selectedIn(blocks(SHELL), '.ds-drawer__item[aria-current="page"]'), 'current drawer item');
    assert.ok(selectedIn(blocks(SHELL), '.ds-segmented__option:is([aria-current="true"], [aria-checked="true"], [aria-pressed="true"])'), 'selected option');
    assert.ok(selectedIn(blocks('src/components/tabs.css'), '.ds-tabs__tab:is([aria-selected="true"], [aria-current="page"])'), 'selected tab');
    for (const file of [SHELL, 'src/components/tabs.css']) assert.match(blocks(file), /\[aria-disabled="true"\][^{]*\{[^}]*GrayText/, `${file}: blocked is GrayText`);
  });

  it('imports tabs and steps after the shell and prose after the lists, the timeline and the tasks', () => {
    const order = [...read('src/index.css').matchAll(/@import '\.\/components\/([\w-]+)\.css'/g)].map((match) => match[1]);
    assert.equal(order.indexOf('tabs'), order.indexOf('shell') + 1);
    assert.equal(order.indexOf('steps'), order.indexOf('tabs') + 1);
    // The lists of 2.0 (list, timeline, tasks) stay together; prose follows the last of them.
    assert.equal(order.indexOf('prose'), Math.max(...['list', 'timeline', 'tasks'].map((name) => order.indexOf(name))) + 1);
  });

  it('gives bare headings under .ds-base the type roles by the element alone', () => {
    const css = stripComments(read('src/base.css'));
    const roles = { h1: '--ds-font-headline', h2: '--ds-font-subtitle', h3: '--ds-font-label', h6: '--ds-font-label' };
    for (const [element, role] of Object.entries(roles)) {
      const found = rules(css).filter((rule) => splitSelectors(rule.selector).some((part) => part === `:where(.ds-base) ${element}` || (part.startsWith(':where(.ds-base) :is(') && part.includes(element))))
        .flatMap((rule) => declarations(`${rule.body};`)).filter((entry) => entry.property === 'font');
      assert.ok(found.some((entry) => entry.value === `var(${role})`), `${element}: ${role}`);
    }
    const inside = rules(css).filter((rule) => splitSelectors(rule.selector).includes(':where(.ds-base) :where(pre, a) code')).flatMap((rule) => declarations(`${rule.body};`));
    assert.ok(inside.some((entry) => entry.property === 'background' && entry.value === 'none'), 'code inside a pre or a link has no chip');
  });

  it('switches the rail\'s column at once and fades only its labels (no layout animation)', () => {
    const css = stripComments(read(SHELL));
    const rail = rules(css).filter((rule) => rule.selector.includes('[data-drawer-collapsed]'));
    assert.ok(rail.length > 0);
    for (const rule of rail) {
      for (const entry of declarations(`${rule.body};`).filter(({ property }) => property === 'transition')) {
        assert.deepEqual(entriesOf(entry.value).map((part) => part.name), ['opacity'], rule.selector);
      }
    }
    assert.ok(/--ds-drawer-rail-width:\s*72px/.test(read('src/tokens.css')), 'the rail width is a layout role');
  });

  it('hides the banner, keeps stale content at full strength and keeps cards whole in print', () => {
    const print = atRuleBlocks(stripComments(read(SHELL)), /@media print/).join('\n');
    assert.ok(rules(print).some((rule) => splitSelectors(rule.selector).includes('.ds-banner') && /display:\s*none/.test(rule.body)));
    assert.ok(declarationsOf(print, '.ds-stale').some((entry) => entry.property === 'opacity' && entry.value === '1'));
    // Short cards only: a card that holds a table may break (card.css). Pushed whole to the next page inside a grid,
    // Chromium printed it over the blocks after it.
    assert.ok(rules(print).some((rule) => splitSelectors(rule.selector).includes('.ds-card:not(:has(.ds-table-wrap, .ds-table))') && /break-inside:\s*avoid/.test(rule.body)));
    assert.ok(!rules(print).some((rule) => splitSelectors(rule.selector).includes('.ds-card') && /break-inside:\s*avoid/.test(rule.body)), 'every card kept whole');
  });
});

describe('tables and scrollers (2.0)', () => {
  const TABLE = 'src/components/table.css';
  const SCROLLER = 'src/components/scroller.css';
  const table = read(TABLE);

  it('keeps the three copies of the stacked block identical (sheet and dialog, 600px, 840px)', () => {
    // Each copy: its scope (the stacked table) and its card form; the rules of a copy are the rules whose selector starts with either.
    const copies = [
      { block: withoutAtRuleBlocks(withoutAtRuleBlocks(table, /@container/), /@media\s+print/), scope: ':is(.ds-sheet__body, .ds-dialog) :is(.ds-table--stack, .ds-table--stack-wide)', card: ':is(.ds-sheet__body, .ds-dialog) .ds-card .ds-table-wrap > :is(.ds-table--stack, .ds-table--stack-wide)' },
      { block: atRuleBlocks(table, /@container ds-content \(max-width: 600px\)/).join('\n'), scope: '.ds-table--stack', card: '.ds-card .ds-table-wrap > .ds-table--stack' },
      { block: atRuleBlocks(table, /@container ds-content \(max-width: 840px\)/).join('\n'), scope: '.ds-table--stack-wide', card: '.ds-card .ds-table-wrap > .ds-table--stack-wide' },
    ];
    const normalised = copies.map(({ block, scope, card }) => rules(block)
      .filter((rule) => rule.selector.startsWith(scope) || rule.selector.startsWith(card))
      .map((rule) => `${rule.selector.startsWith(card) ? `C${rule.selector.slice(card.length)}` : `S${rule.selector.slice(scope.length)}`} { ${rule.body} }`));
    assert.ok(normalised[0].length >= 10, normalised[0].join('\n'));
    assert.deepEqual(normalised[1], normalised[0], 'the 600px copy equals the sheet and dialog copy');
    assert.deepEqual(normalised[2], normalised[0], 'the 840px copy equals the sheet and dialog copy');
    // The stacked block: the header for screen readers only, rows as bordered blocks, labels above the content.
    const own = (selector) => Object.fromEntries(declarationsAt(atRuleBlocks(table, /@container ds-content \(max-width: 600px\)/).join('\n'), selector).map((entry) => [entry.property, entry.value]));
    assert.equal(own('.ds-table--stack > thead')['clip-path'], 'inset(50%)');
    assert.equal(own('.ds-table--stack > tbody > tr').border, '1px solid var(--ds-line)');
    assert.equal(own('.ds-table--stack > tbody > tr')['border-radius'], 'var(--ds-radius-card)');
    const label = declarationsAt(atRuleBlocks(table, /@container ds-content \(max-width: 600px\)/).join('\n'), '.ds-table--stack > tbody > tr > td[data-label]::before');
    assert.deepEqual(label.filter((entry) => entry.property === 'content').map((entry) => entry.value), ['attr(data-label)', 'attr(data-label) / ""'], 'the plain label first, the alt text form after it');
    assert.equal(label.find((entry) => entry.property === 'font')?.value, 'var(--ds-font-label)');
    // A wrapper of stacked rows never fades.
    const quiet = Object.fromEntries(declarationsAt(table, '.ds-card .ds-table-wrap:has(> :is(.ds-table--stack, .ds-table--stack-wide))').map((entry) => [entry.property, entry.value]));
    assert.deepEqual([quiet['mask-image'], quiet['-webkit-mask-image'], quiet.animation], ['none', 'none', 'none']);
  });

  it('fades every sideways scroller on the two edge numbers, through --ds-scroll-fade, and leaves the scrollbar strip opaque', () => {
    const masks = [...rules(read(SCROLLER)), ...rules(table)].flatMap((rule) => declarations(`${rule.body};`).filter((entry) => /mask-image$/.test(entry.property) && entry.value !== 'none').map((entry) => ({ selector: rule.selector, ...entry })));
    assert.ok(masks.length >= 12, `${masks.length} masks`);
    for (const { selector, property, value } of masks) {
      assert.match(value, /var\(--ds-scroll-fade, var\(--ds-(space-8|card-pad)\)\)/, `${selector}: ${property} reads the one fade switch`);
      // Only transparent and #000 as stops (a mask reads alpha), never a colour or a deprecated length.
      assert.doesNotMatch(value, /--ds-table-fade-|rgb|#(?!000\b)/, `${selector}: ${property}`);
      if (/to right/.test(value)) assert.match(value, /calc\(var\(--ds-scroll-edge-start\) \* .*calc\(100% - var\(--ds-scroll-edge-end\) \* /, `${selector}: the numbers scale the fade`);
    }
    // Every masked scroller has its -webkit- twin (Chrome and Edge before 120).
    for (const { selector, property } of masks.filter((entry) => entry.property === 'mask-image')) assert.ok(masks.some((entry) => entry.selector === selector && entry.property === '-webkit-mask-image'), selector);
    // The scrollbar strip: a second, opaque layer the size of --ds-scrollbar-height (the fill wrapper: the padding box ring).
    const size = declarationsOf(read(SCROLLER), '.ds-scroll-x').find((entry) => entry.property === 'mask-size')?.value;
    assert.equal(size, '100% calc(100% - var(--ds-scrollbar-height, 0px)), 100% var(--ds-scrollbar-height, 0px)');
    const fill = Object.fromEntries(declarationsOf(table, '.ds-table-wrap--fill').map((entry) => [entry.property, entry.value]));
    assert.equal(fill['mask-composite'], 'add, exclude');
    assert.equal(fill['-webkit-mask-composite'], 'source-over, xor');
    assert.equal(fill['mask-clip'], 'padding-box, padding-box, border-box');
    // The attribute fallback sets the numbers; the scroll timeline wins where it runs.
    for (const [file, host] of [[SCROLLER, '.ds-scroll-x'], [TABLE, '.ds-table-wrap']]) {
      const css = read(file);
      assert.equal(declarationsOf(css, `${host}[data-ds-overflow-start]`).find((entry) => entry.property === '--ds-scroll-edge-start')?.value, '1', host);
      assert.equal(declarationsOf(css, `${host}[data-ds-overflow-end]`).find((entry) => entry.property === '--ds-scroll-edge-end')?.value, '1', host);
      // The numbers glide only once DS.dom.scrollEdges() has measured
      // (data-ds-edges comes after the first edges): nothing moves on load.
      assert.match(declarationsOf(css, `${host}[data-ds-edges]`).find((entry) => entry.property === 'transition')?.value ?? '', /--ds-scroll-edge-start var\(--ds-dur-fast\) var\(--ds-ease-in-out\), --ds-scroll-edge-end var\(--ds-dur-fast\) var\(--ds-ease-in-out\)/, host);
      for (const selector of [host, `${host}[tabindex]`]) assert.doesNotMatch(declarationsOf(css, selector).find((entry) => entry.property === 'transition')?.value ?? '', /--ds-scroll-edge/, selector);
      assert.match(declarationsOf(css, `${host}[tabindex][data-ds-edges]`).find((entry) => entry.property === 'transition')?.value ?? '', /--ds-scroll-edge-end .*outline-offset var\(--ds-dur-fast\) var\(--ds-ease-out\)/, host);
    }
    // The hook is a length that themes may set: documented, never a motion hook.
    assert.doesNotMatch('--ds-scroll-fade:', /--ds-(dur|ease|distance|loop|stagger|delay|hold|scale|time-scale|motion|enter|leave)/);
  });

  it('fades the cut edges of a menu and a combobox list on the same numbers, on the block axis (2.0)', () => {
    const combo = read('src/components/combobox.css');
    const menu = read('src/components/menu.css');
    // The list: the .ds-scroll-x mask turned to the block axis, its scrollbar strip (--ds-scrollbar-width) opaque.
    const list = Object.fromEntries(declarationsOf(combo, '.ds-combo__list').map((entry) => [entry.property, entry.value]));
    for (const property of ['mask-image', '-webkit-mask-image']) {
      assert.match(list[property], /^linear-gradient\(to bottom, transparent, #000 calc\(var\(--ds-scroll-edge-start\) \* var\(--ds-scroll-fade, var\(--ds-space-8\)\)\), #000 calc\(100% - var\(--ds-scroll-edge-end\) \* var\(--ds-scroll-fade, var\(--ds-space-8\)\)\), transparent\), linear-gradient\(#000, #000\)$/, property);
    }
    assert.equal(list['mask-size'], 'calc(100% - var(--ds-scrollbar-width, 0px)) 100%, var(--ds-scrollbar-width, 0px) 100%');
    assert.equal(list['-webkit-mask-size'], list['mask-size']);
    assert.equal(list['mask-position'], '0 0, 100% 0');
    assert.equal(list['scroll-padding-block'], 'var(--ds-scroll-fade, var(--ds-space-8))');
    assert.match(list.transition, /--ds-scroll-edge-start var\(--ds-dur-fast\) var\(--ds-ease-in-out\), --ds-scroll-edge-end var\(--ds-dur-fast\) var\(--ds-ease-in-out\)/);
    // The menu is its own surface (a mask would cut its shadow): a sticky shade of it at each edge.
    const before = Object.fromEntries(declarationsOf(menu, '.ds-menu::before').map((entry) => [entry.property, entry.value]));
    const after = Object.fromEntries(declarationsOf(menu, '.ds-menu::after').map((entry) => [entry.property, entry.value]));
    assert.equal(before.background, 'linear-gradient(var(--ds-surface-popover), transparent)');
    assert.equal(after.background, 'linear-gradient(transparent, var(--ds-surface-popover))');
    assert.deepEqual([before.opacity, after.opacity], ['var(--ds-scroll-edge-start)', 'var(--ds-scroll-edge-end)']);
    for (const own of [before, after]) assert.deepEqual([own.position, own.height, own['pointer-events']], ['sticky', 'var(--ds-scroll-fade, var(--ds-space-8))', 'none']);
    assert.equal(declarationsOf(menu, '.ds-menu').find((entry) => entry.property === 'scroll-padding-block')?.value, 'var(--ds-scroll-fade, var(--ds-space-8))');
    // The attribute fallback of DS.dom.scrollEdges() (attached by DS.overlay) sets the numbers.
    for (const [css, start, end] of [[combo, '.ds-combo__list[data-ds-overflow-start]', '.ds-combo__list[data-ds-overflow-end]'], [menu, '.ds-menu[data-ds-overflow-start]::before', '.ds-menu[data-ds-overflow-end]::after']]) {
      assert.equal(declarationsOf(css, start).find((entry) => entry.property === '--ds-scroll-edge-start')?.value, '1', start);
      assert.equal(declarationsOf(css, end).find((entry) => entry.property === '--ds-scroll-edge-end')?.value, '1', end);
    }
    // Forced colours would keep the shades' gradient in the theme's colour: they go.
    const forced = atRuleBlocks(menu, /@media \(forced-colors: active\)/).join('\n');
    for (const selector of ['.ds-menu::before', '.ds-menu::after']) assert.equal(declarationsAt(forced, selector).find((entry) => entry.property === 'display')?.value, 'none', selector);
  });

  it('makes a sideways scroller a tab stop with an inset ring that drops the mask, and unmasks it in print', () => {
    for (const [file, host] of [[SCROLLER, '.ds-scroll-x[tabindex]'], [TABLE, '.ds-table-wrap[tabindex]']]) {
      const focus = Object.fromEntries(declarationsOf(read(file), `${host}:focus-visible`).map((entry) => [entry.property, entry.value]));
      assert.equal(focus.outline, 'var(--ds-focus-outline)', host);
      assert.equal(focus['outline-offset'], 'calc(-1 * var(--ds-focus-width))', host);
      assert.equal(focus['mask-image'], 'none', host);
      assert.equal(focus['-webkit-mask-image'], 'none', host);
    }
    const print = (file, selector) => Object.fromEntries(atRuleBlocks(read(file), /@media\s+print/).flatMap((block) => declarationsOf(block, selector)).map((entry) => [entry.property, entry.value]));
    assert.deepEqual([print(SCROLLER, '.ds-scroll-x').overflow, print(SCROLLER, '.ds-scroll-x')['mask-image']], ['visible', 'none']);
    assert.equal(print(SCROLLER, '.ds-jump').display, 'none');
    assert.deepEqual([print(TABLE, '.ds-table-wrap').overflow, print(TABLE, '.ds-table-wrap')['mask-image']], ['visible', 'none']);
    assert.equal(print(TABLE, '.ds-table-wrap--fill')['max-height'], 'none');
    assert.equal(print(TABLE, '.ds-table th')['white-space'], 'normal');
    assert.equal(print(TABLE, '.ds-table tr')['break-inside'], 'avoid');
    assert.equal(print(TABLE, '.ds-selection-bar').display, 'none');
    assert.equal(print('src/components/pagination.css', '.ds-pagination').display, 'none');
    // The jump place takes no room and lets the pointer through to the log; only the pill takes it.
    const jump = Object.fromEntries(declarationsOf(read(SCROLLER), '.ds-jump').map((entry) => [entry.property, entry.value]));
    assert.deepEqual([jump.position, jump.height, jump['pointer-events']], ['sticky', '0', 'none']);
    assert.equal(declarationsOf(read(SCROLLER), '.ds-jump > *').find((entry) => entry.property === 'pointer-events')?.value, 'auto');
  });

  it('keeps pinned cells opaque: their layers are background images of two registered colours, never a translucent background colour', () => {
    const PINNED = ['.ds-table--pin-first tbody tr:not(.ds-table__detail) > :is(td, th):first-child', '.ds-table--pin-first thead th:first-child'];
    const screen = withoutAtRuleBlocks(withoutAtRuleBlocks(table, /@media\s*\(forced-colors:\s*active\)/), /@media\s+print/);
    for (const rule of rules(screen)) {
      for (const part of splitSelectors(rule.selector)) {
        if (!/\.ds-table--pin-first\b/.test(part) || part.endsWith('::after')) continue;
        for (const { property } of declarations(`${rule.body};`)) assert.notEqual(property, 'background-color', `${part}: a pinned cell lays its layers over its base as images`);
      }
    }
    const base = Object.fromEntries(declarationsAt(screen, PINNED[0]).map((entry) => [entry.property, entry.value]));
    assert.deepEqual([base.position, base['inset-inline-start'], base['z-index']], ['sticky', '0', 'var(--ds-z-pinned)']);
    assert.match(base['background-image'], /^linear-gradient\(var\(--ds-table-sticky-layer\), var\(--ds-table-sticky-layer\)\), linear-gradient\(var\(--ds-table-sticky-tint\), var\(--ds-table-sticky-tint\)\), linear-gradient\(var\(--ds-table-sticky-bg, var\(--ds-surface\)\)/);
    // A body row's pinned cell lays the row's layer and selection over its base, at the row's pace.
    assert.deepEqual([base['--ds-table-sticky-layer'], base['--ds-table-sticky-tint']], ['var(--ds-table-row-layer)', 'var(--ds-table-row-tint)']);
    assert.match(base.transition, /--ds-table-sticky-layer var\(--ds-table-row-pace\) var\(--ds-ease-in-out\), --ds-table-sticky-tint var\(--ds-dur-fast\) var\(--ds-ease-in-out\)/);
    for (const name of ['--ds-table-sticky-layer', '--ds-table-sticky-tint']) {
      assert.match(stripComments(table), new RegExp(`@property ${name} \\{\\s*syntax: '<color>';\\s*inherits: false;\\s*initial-value: transparent;`), name);
    }
    assert.equal(declarationsAt(table, '.ds-table-wrap--fill > .ds-table--pin-first > thead th:first-child').find((entry) => entry.property === 'z-index')?.value, 'var(--ds-z-sticky-pinned)');
    // Forced colours: sticky and pinned cells Canvas, the fill wrapper's edge CanvasText.
    const forced = forcedColorBlocks(table).join('\n');
    for (const selector of [...PINNED, '.ds-table-wrap--fill > .ds-table > thead th']) {
      const own = Object.fromEntries(declarationsAt(forced, selector).map((entry) => [entry.property, entry.value]));
      assert.deepEqual([own['background-color'], own['background-image']], ['Canvas', 'none'], selector);
    }
    assert.equal(declarationsAt(forced, '.ds-table-wrap--fill').find((entry) => entry.property === 'border-color')?.value, 'CanvasText');
    assert.match(declarationsAt(forced, '.ds-selection-bar').find((entry) => entry.property === 'outline')?.value ?? '', /CanvasText/);
  });

  it('scopes the interactive row rules to rows with a row link (a row without one stays plain)', () => {
    const ROW = '.ds-table--interactive tbody tr:not(.ds-table__detail)';
    const offenders = [];
    for (const file of [TABLE, 'src/components/ripple.css']) {
      for (const rule of rules(read(file))) {
        for (const part of splitSelectors(rule.selector)) {
          // The row's own pointer and press: only with a row link (focus already follows the link).
          if (part.includes(ROW) && /cursor|:active|\.ds-pressed/.test(`${part} ${rule.body}`) && !part.includes(`${ROW}:has(.ds-table__row-link)`)) offenders.push(`${file}: ${part}`);
        }
      }
    }
    assert.deepEqual(offenders, []);
    assert.ok(splitSelectors(RIPPLE_HOSTS).includes(`${ROW}:has(.ds-table__row-link)`));
    assert.ok(!splitSelectors(RIPPLE_HOSTS).includes(ROW));
  });

  it('never puts a bare structural pseudo-class in the subject of a table or ripple rule (it is tried on every element)', () => {
    // A subject such as `tr > :first-child` makes Chromium try it on every element and mark every parent as
    // depending on its first child: each inserted node then restyles its siblings (four times the style work of
    // the styleguide's load). Name the element first: `tr > :is(td, th):first-child`.
    const offenders = [];
    for (const file of [TABLE, 'src/components/ripple.css', SCROLLER, 'src/components/pagination.css']) {
      for (const rule of rules(read(file))) {
        for (const part of splitSelectors(rule.selector)) {
          const subject = part.replace(/::[\w-]+(\([^)]*\))?$/, '').split(/\s*[\s>+~]\s*(?![^(]*\))/).pop();
          if (/^:(first|last|only|nth)-/.test(subject)) offenders.push(`${file}: ${part}`);
        }
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('never styles table rows or cells behind a :has() of another element (the row decides, its cells paint)', () => {
    // Chromium keeps one invalidation set for every :has() that is not in the subject: the subjects of those rules.
    // The root (.ds-theme:not(:has(...))) is in it, so each change anywhere in the page restyles every element that
    // set names: a `tr:has(...) > :is(td, th)` rule restyled every table cell of the page on each text change
    // (the styleguide: 1,170 cells, 27ms a change). Rows set --ds-table-row-* instead, which their cells read.
    const offenders = [];
    for (const file of SRC_CSS) {
      for (const rule of rules(read(file))) {
        for (const part of splitSelectors(rule.selector)) {
          let depth = 0;
          let last = 0;
          for (let index = 0; index < part.length; index += 1) {
            const char = part[index];
            if (char === '(') depth += 1;
            else if (char === ')') depth -= 1;
            else if (depth === 0 && /[\s>+~]/.test(char)) last = index + 1;
          }
          const subject = part.slice(last).replace(/::[\w-]+(\([^)]*\))?$/, '').replace(/\.[\w-]+|\[[^\]]*\]/g, '');
          if (part.slice(0, last).includes(':has(') && /(^|[^\w-])(td|th|tr)(?![\w-])/.test(subject)) offenders.push(`${file}: ${part}`);
        }
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('reads the density hooks for every cell height, and the cell padding from them', () => {
    for (const [selector, hook, fallback] of [['.ds-table th', '--ds-table-head-height', '48px'], ['.ds-table td', '--ds-table-row-height', '52px'], ['.ds-table--dense :is(th, td)', '--ds-table-dense-row-height', '40px']]) {
      const own = Object.fromEntries(declarationsAt(withoutAtRuleBlocks(table, /@media|@container/), selector).map((entry) => [entry.property, entry.value]));
      assert.equal(own.height, `var(${hook}, ${fallback})`, selector);
      assert.ok(own['padding-block'].startsWith('min(var(--ds-space-3), calc((') && own['padding-block'].includes(`var(${hook}, ${fallback})`), `${selector}: ${own['padding-block']}`);
    }
    // Summary rows: label type, a hairline above, none below.
    const foot = Object.fromEntries(declarationsAt(table, '.ds-table tfoot :is(th, td)').map((entry) => [entry.property, entry.value]));
    assert.deepEqual([foot['border-top'], foot['border-bottom'], foot.font, foot['font-variant-numeric']], ['1px solid var(--ds-line-2)', '0', 'var(--ds-font-label)', 'tabular-nums']);
    // No rule of a body row reaches the summary row.
    assert.deepEqual(rules(table).flatMap((rule) => splitSelectors(rule.selector)).filter((part) => /tfoot/.test(part) && /:hover|row-link|:active/.test(part)), []);
  });
});

/*
 * Direction (D9). 2.0 lays out left to right only, but every component uses
 * the logical form of a property where the baseline has it (margin-inline-*,
 * padding-inline-*, border-inline-*, inset-inline-*, text-align: start | end),
 * so a page with dir="rtl" mirrors what does not move. What stays physical is
 * listed below with its reason; a declaration on the safe area
 * (env(safe-area-inset-left | right)) is physical by nature and passes.
 */
const DIRECTION_FILES = [...filesIn('src/components', (path) => path.endsWith('.css')), 'src/base.css'];
/** A box shorthand's values at the top level (not inside var() or calc()). */
function boxValues(value) {
  const parts = [];
  let depth = 0;
  let current = '';
  for (const char of value.replace(/\s*!important$/, '').trim()) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (/\s/.test(char) && depth === 0) { if (current) parts.push(current); current = ''; } else current += char;
  }
  if (current) parts.push(current);
  return parts;
}
/** Why a declaration is physical, or undefined when it reads the same in both directions. */
function physicalReason(property, value) {
  const plain = value.replace(/\s*!important$/, '');
  if (/^(margin|padding|scroll-margin|scroll-padding)-(left|right)$|^border-(left|right)(-(width|style|color))?$|^(left|right)$|^border-(top|bottom)-(left|right)-radius$/.test(property)) return property;
  if (/^(text-align|text-align-last|float|clear)$/.test(property) && /^(left|right)$/.test(plain)) return `${property}: ${plain}`;
  if (/^(margin|padding|inset|scroll-margin|scroll-padding|border-width|border-style|border-color)$/.test(property)) {
    const values = boxValues(plain);
    if (values.length === 4 && values[1] !== values[3]) return `${property} with different left and right`;
  }
  if (property === 'border-radius') {
    const values = boxValues(plain.split('/')[0]);
    const [tl, tr = tl, br = tl, bl = tr] = values;
    if (tl !== tr || br !== bl) return 'border-radius with different left and right corners';
  }
  if (/\bto (left|right)\b|\bto (top|bottom) (left|right)\b/.test(plain)) return 'gradient direction';
  if (/^(background|background-position|background-position-x|mask|mask-position|-webkit-mask|-webkit-mask-position)$/.test(property)
    && /(^|[\s,/])(left|right)(?=[\s,/]|$)/.test(plain.replace(/\([^()]*(\([^()]*\)[^()]*)*\)/g, ''))) return 'position keyword';
  return undefined;
}
/** `file: selector: property` of every physical declaration that stays, with its reason. */
const PHYSICAL_ALLOWED = new Map([
  ['src/components/form.css: select.ds-input, input.ds-input[list]: padding-right', 'the room of the arrow, which sits at the right'],
  ['src/components/form.css: select.ds-input, input.ds-input[list]: background-position', 'the select arrow: two gradients placed from the right edge'],
  ['src/components/form.css: input.ds-input[list]::-webkit-calendar-picker-indicator: margin', 'the invisible picker laid over the arrow at the right'],
  ['src/components/indicator.css: .ds-indicator: left', 'DS.indicator writes viewport-measured x from the left'],
  ['src/components/menu.css: .ds-menu: inset', 'script coordinates: --ds-menu-x from the left'],
  ['src/components/progress.css: .ds-progress__track: background', 'gradient direction: the bar fills left to right with its clip'],
  ['src/components/ripple.css: .ds-press-ripple: left', 'pointer coordinates: --ds-ripple-x from the host\'s left'],
  ['src/components/ripple.css: .ds-ripples tr > :is(td, th) > .ds-press-ripple::before: left', 'pointer coordinates: --ds-ripple-x from the cell\'s left'],
  ['src/components/ripple.css: .ds-ripples .ds-tabs__tab > .ds-press-ripple::before: left', 'pointer coordinates: --ds-ripple-x from the tab\'s left'],
  ['src/components/scroller.css: .ds-scroll-x: -webkit-mask-image', 'gradient direction: the edge fades follow the sideways scroll'],
  ['src/components/scroller.css: .ds-scroll-x: mask-image', 'gradient direction: the edge fades follow the sideways scroll'],
  ['src/components/sheet.css: .ds-sheet__panel: border-radius', 'the side sheet slides in from the right edge: its open side is the left'],
  ['src/components/sheet.css: .ds-sheet__panel::after: left', 'the bleed beyond the right edge covers the slide\'s overshoot'],
  ['src/components/shell.css: .ds-app--drawer .ds-panel: margin-left', 'clears the safe-area margin-left of the panel, which stays physical'],
  ['src/components/shell.css: .ds-drawer: left', 'the modal drawer slides in from the left edge'],
  ['src/components/shell.css: .ds-drawer: border-radius', 'the modal drawer slides in from the left edge: its open side is the right'],
  ['src/components/shell.css: .ds-drawer::before: right', 'the bleed left of the modal drawer covers the slide\'s overshoot'],
  ['src/components/slider.css: .ds-slider::-webkit-slider-runnable-track: background', 'gradient direction: the active part fills from the left, as the native thumb moves'],
  ['src/components/switch.css: .ds-switch__track::after: left', 'the handle starts at the left and travels on translate'],
  ['src/components/switch.css: .ds-switch__track::before: left', 'the halo starts at the left and travels on translate with the handle'],
  ['src/components/table.css: .ds-table-wrap--fill: -webkit-mask-image', 'gradient direction: the edge fades follow the sideways scroll'],
  ['src/components/table.css: .ds-table-wrap--fill: mask-image', 'gradient direction: the edge fades follow the sideways scroll'],
  ['src/components/table.css: .ds-card .ds-table-wrap:has(> .ds-table--wide): -webkit-mask-image', 'gradient direction: the edge fades follow the sideways scroll'],
  ['src/components/table.css: .ds-card .ds-table-wrap:has(> .ds-table--wide): mask-image', 'gradient direction: the edge fades follow the sideways scroll'],
  ['src/components/table.css: .ds-card .ds-table-wrap:where([data-ds-edges]):has(> .ds-table--wide): -webkit-mask-image', 'gradient direction: the edge fades follow the sideways scroll'],
  ['src/components/table.css: .ds-card .ds-table-wrap:where([data-ds-edges]):has(> .ds-table--wide): mask-image', 'gradient direction: the edge fades follow the sideways scroll'],
  ['src/components/table.css: .ds-card .ds-table-wrap: -webkit-mask-image', 'gradient direction: the edge fades follow the sideways scroll'],
  ['src/components/table.css: .ds-card .ds-table-wrap: mask-image', 'gradient direction: the edge fades follow the sideways scroll'],
  ['src/components/table.css: .ds-card .ds-table-wrap:where([data-ds-edges]): -webkit-mask-image', 'gradient direction: the edge fades follow the sideways scroll'],
  ['src/components/table.css: .ds-card .ds-table-wrap:where([data-ds-edges]): mask-image', 'gradient direction: the edge fades follow the sideways scroll'],
  ['src/components/toast.css: .ds-toasts: left', 'script coordinate: --ds-toast-left, and DS.overlay reads the computed left back'],
  ['src/components/tooltip.css: .ds-tooltip: left', 'script coordinates: --ds-tooltip-x from the left'],
  ['src/components/tooltip.css: .ds-tooltip[popover]: inset', 'script coordinates: --ds-tooltip-x from the left'],
  ['src/components/tooltip.css: .ds-tooltip[data-anchored]: left', 'clears the script coordinate for anchor positioning'],
]);

describe('direction (2.0, D9)', () => {
  it('uses logical properties in components and the page base, physical ones only on the allowlist', () => {
    const found = [];
    for (const file of DIRECTION_FILES) {
      for (const { selector, body } of rules(read(file))) {
        for (const { property, value } of declarations(`${body};`)) {
          const reason = physicalReason(property, value);
          if (reason && !/env\(safe-area-inset-(left|right)\)/.test(value)) found.push(`${file}: ${selector}: ${property}`);
        }
      }
    }
    assert.deepEqual([...new Set(found)].filter((entry) => !PHYSICAL_ALLOWED.has(entry)), [], 'a physical property: use its logical form (margin-inline-start, inset-inline, text-align: start ...) or allowlist it with a reason');
    assert.deepEqual([...PHYSICAL_ALLOWED.keys()].filter((entry) => !found.includes(entry)), [], 'an allowlisted physical property is gone: shorten the list');
  });

  it('recognises the physical forms it guards against', () => {
    for (const [property, value] of [['margin-left', '0'], ['padding-right', '4px'], ['border-left', '1px solid'], ['left', '0'], ['right', 'auto'],
      ['text-align', 'right'], ['float', 'left'], ['padding', '0 8px 0 4px'], ['inset', '0 auto auto 0'], ['border-radius', '8px 0 0 8px'],
      ['background', 'linear-gradient(to right, red, blue)'], ['background-position', 'right 12px top 50%'], ['border-top-left-radius', '4px']]) {
      assert.ok(physicalReason(property, value), `${property}: ${value}`);
    }
    for (const [property, value] of [['margin-inline-start', '0'], ['inset-inline', '0'], ['inset', '0'], ['text-align', 'start'], ['padding', '0 8px'],
      ['padding', '0 8px 4px'], ['padding', '1px 8px 2px 8px'], ['border-radius', '8px 8px 0 0'], ['border-radius', 'var(--ds-radius-card)'],
      ['background', 'linear-gradient(currentColor, currentColor) center bottom / 100% 3px no-repeat'], ['margin', 'calc(-1 * var(--ds-space-2)) 0']]) {
      assert.equal(physicalReason(property, value), undefined, `${property}: ${value}`);
    }
  });
});

describe('forced colours and print after the merges (2.0)', () => {
  const forced = (file) => atRuleBlocks(read(file), /@media\s*\(forced-colors:\s*active\)/).join('\n');
  const printed = (file) => atRuleBlocks(read(file), /@media\s+print/).join('\n');
  const has = (css, selector, property, value) => rules(css).some((rule) => splitSelectors(rule.selector).includes(selector)
    && declarations(`${rule.body};`).some((entry) => entry.property === property && entry.value === value));

  it('maps the states of the new parts per D8', () => {
    // A focused chosen option: a CanvasText ring inside its SelectedItem fill.
    assert.ok(has(forced('src/components/combobox.css'), '.ds-combo__option[aria-selected="true"][data-active]', 'outline-color', 'CanvasText'));
    // Blocked is GrayText: key-value rows, the drop zone and the file field.
    assert.ok(has(forced('src/components/list.css'), ':is(a, button).ds-kv-list__row:is(:disabled, [aria-disabled="true"])', 'color', 'GrayText'));
    assert.ok(has(forced('src/components/drag.css'), '.ds-dropzone:has(input:disabled)', 'color', 'GrayText'));
    assert.ok(has(forced('src/components/drag.css'), '.ds-input[type="file"]:disabled::file-selector-button', 'color', 'GrayText'));
    // forced-color-adjust inherits: the other controls of a current row take the system colours again, on Canvas.
    const list = rules(forced('src/components/list.css'));
    assert.ok(list.some((rule) => /\.ds-list__item:is\(\[aria-current\]/.test(rule.selector) && /:not\(\.ds-list__action\)$/.test(rule.selector) && /forced-color-adjust: auto/.test(rule.body)));
    assert.ok(list.some((rule) => /\.ds-list__item:is\(\[aria-current\]/.test(rule.selector) && /:not\(\.ds-list__action\)$/.test(rule.selector) && /background-color: Canvas/.test(rule.body)));
  });

  it('prints the state of controls drawn with backgrounds, and no closed detail row', () => {
    for (const [file, selector] of [['src/components/spinner.css', '.ds-spinner'], ['src/components/progress.css', '.ds-progress'], ['src/components/switch.css', '.ds-switch'], ['src/components/steps.css', '.ds-steps'], ['src/components/slider.css', '.ds-slider'], ['src/components/form.css', '.ds-radio > :is(.ds-radio__icon, .ds-radio__mark)']]) {
      assert.ok(has(printed(file), selector, 'print-color-adjust', 'exact'), `${file}: ${selector}`);
      assert.ok(has(printed(file), selector, '-webkit-print-color-adjust', 'exact'), `${file}: ${selector} (prefixed)`);
      assert.match(read(file).match(/^\/\*[\s\S]*?\*\//)[0], /Print:/, `${file}: a Print: note in the header`);
    }
    assert.ok(has(printed('src/components/table.css'), '.ds-table tr:not(:has(.ds-table__toggle[aria-expanded="true"])) + .ds-table__detail', 'display', 'none'));
  });
});
