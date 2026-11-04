/**
 * The options of 3.0 (src/core/options.css, docs/options.md): size, density,
 * shape, tone and touch as classes that set only their own custom
 * properties, defaults on .ds-theme that no role folds in, and the tone
 * pairs at AA in every shipped palette. The button is the reference reader
 * (its heights, radii and touch minimum run in test/browser/button-options.spec.js).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { packageInfo, tokensJson } from '../scripts/build.mjs';
import { ICON_PAIRS, TEXT_PAIRS } from '../scripts/tools/theme-rules.mjs';
import { atRuleBlocks, declarations, declarationsOf, filesIn, read, rules, stripComments, token } from './helpers.js';

const OPTIONS = 'src/core/options.css';
const css = read(OPTIONS);

/** What each option class may set: [class, the properties it sets, the values]. */
const SIZES = [['ds-xs', -2, 'caption'], ['ds-sm', -1, 'chip'], ['ds-md', 0, 'label'], ['ds-lg', 1, 'subtitle'], ['ds-xl', 2, 'subtitle']];
const DENSITIES = [['ds-density-comfortable', 0], ['ds-density-compact', -1], ['ds-density-dense', -2], ['ds-density-tight', -3]];
const SHAPES = [['ds-shape-square', '0'], ['ds-shape-soft', '.5'], ['ds-shape-default', '1'], ['ds-shape-round', '1.5']];
const TONES = {
  neutral: ['--ds-text-2', '--ds-surface', '--ds-surface-high', '--ds-text'],
  primary: ['--ds-primary', '--ds-on-primary', '--ds-primary-container', '--ds-on-primary-container'],
  info: ['--ds-info', '--ds-on-info', '--ds-info-container', '--ds-on-info-container'],
  success: ['--ds-success', '--ds-on-success', '--ds-success-container', '--ds-on-success-container'],
  warning: ['--ds-warning', '--ds-on-warning', '--ds-warning-container', '--ds-on-warning-container'],
  error: ['--ds-error', '--ds-on-error', '--ds-error-container', '--ds-on-error-container'],
};
const TONE_VARS = ['--ds-tone', '--ds-on-tone', '--ds-tone-container', '--ds-on-tone-container'];
/** Every custom property an option class sets, and the defaults on .ds-theme. */
const OPTION_VARS = ['--ds-size-step', '--ds-size-font', '--ds-density', '--ds-shape', '--ds-target-min', ...TONE_VARS];
const DEFAULTS = { '--ds-size-step': '0', '--ds-density': '0', '--ds-shape': '1', '--ds-target-min': '0px' };

const own = (selector) => Object.fromEntries(declarationsOf(css, selector).map((entry) => [entry.property, entry.value]));

/** The body of the main .ds-theme rule of tokens.css (by brace depth). */
function themeRule() {
  const source = stripComments(read('src/core/tokens.css'));
  const start = source.indexOf('.ds-theme {');
  let depth = 0;
  let end = source.indexOf('{', start);
  do {
    if (source[end] === '{') depth += 1;
    else if (source[end] === '}') depth -= 1;
    end += 1;
  } while (depth > 0);
  return source.slice(source.indexOf('{', start) + 1, end - 1);
}

describe('options (3.0, src/core/options.css)', () => {
  it('sets the size step and the type role of each size, and nothing else', () => {
    for (const [cls, step, role] of SIZES) {
      assert.deepEqual(own(`.${cls}`), { '--ds-size-step': String(step), '--ds-size-font': `var(--ds-font-${role})` }, cls);
    }
  });

  it('sets only --ds-density on the density classes, 0 to -3', () => {
    for (const [cls, density] of DENSITIES) assert.deepEqual(own(`.${cls}`), { '--ds-density': String(density) }, cls);
  });

  it('sets only --ds-shape on the shape classes, 0 to 1.5', () => {
    for (const [cls, shape] of SHAPES) assert.deepEqual(own(`.${cls}`), { '--ds-shape': shape }, cls);
  });

  it('sets only the four tone colours on the tone classes, each from a role', () => {
    for (const [tone, roles] of Object.entries(TONES)) {
      assert.deepEqual(own(`.ds-tone-${tone}`), Object.fromEntries(TONE_VARS.map((name, i) => [name, `var(${roles[i]})`])), tone);
    }
  });

  it('turns .ds-touch into a minimum (--ds-target-min), nothing more', () => {
    assert.deepEqual(own('.ds-touch'), { '--ds-target-min': 'var(--ds-touch-target)' });
  });

  it('holds nothing but option classes that set option properties: one class per rule, no other selector or property', () => {
    const expected = new Set([...SIZES.map(([cls]) => cls), ...DENSITIES.map(([cls]) => cls), ...SHAPES.map(([cls]) => cls),
      ...Object.keys(TONES).map((tone) => `ds-tone-${tone}`), 'ds-touch']);
    const seen = new Set();
    for (const { selector, body } of rules(css)) {
      const match = /^\.(ds-[\w-]+)$/.exec(selector);
      assert.ok(match, `${selector}: one class, no combinator, pseudo-class or element`);
      assert.ok(expected.has(match[1]), `.${match[1]} is an option class`);
      assert.ok(!seen.has(match[1]), `.${match[1]}: one rule`);
      seen.add(match[1]);
      for (const { property } of declarations(`${body};`)) assert.ok(OPTION_VARS.includes(property), `.${match[1]} sets ${property}: only option properties`);
    }
    assert.deepEqual([...seen].sort(), [...expected].sort(), 'every option class has its rule');
    assert.deepEqual(atRuleBlocks(css, /^@(media|supports|container)\b/), [], 'no condition: an option applies everywhere');
  });

  it('sits in ds.utilities (a page\'s class beats a component\'s own value and the defaults), after the layer statement', () => {
    const code = stripComments(css).trim();
    assert.ok(code.startsWith('@layer ds.tokens, ds.base, ds.components, ds.motion, ds.utilities;'));
    assert.deepEqual([...code.matchAll(/@layer\s+([\w.]+)\s*\{/g)].map((match) => match[1]), ['ds.utilities']);
    assert.doesNotMatch(code, /!important/);
  });

  it('puts the numeric defaults on .ds-theme, after the palette marker (themeable), and documents them', () => {
    const rule = themeRule();
    const marker = rule.indexOf('── 2. Palette');
    for (const [name, value] of Object.entries(DEFAULTS)) {
      assert.equal(token(name), value, name);
      assert.ok(rule.indexOf(`${name}:`) > marker, `${name} is a role (after the palette marker): a theme may set it`);
    }
    const known = new Map(JSON.parse(tokensJson(packageInfo())).tokens.map((entry) => [entry.name, entry]));
    for (const name of Object.keys(DEFAULTS)) assert.equal(known.get(name)?.themeable, true, `${name}: themeable in tokens.json`);
    // The tone colours and the size's type role exist only where a class sets them: never a default.
    for (const name of ['--ds-size-font', ...TONE_VARS]) assert.ok(!rule.includes(`${name}:`), `${name}: no default on .ds-theme`);
    const docs = read('docs/options.md') + read('docs/tokens.md');
    for (const name of OPTION_VARS) assert.ok(docs.includes(`\`${name}\``), `${name} documented`);
  });

  it('folds no option into a role on .ds-theme (a nested option class would change nothing)', () => {
    const offenders = [];
    for (const { property, value } of declarations(themeRule())) {
      for (const name of OPTION_VARS) if (value.includes(`var(${name}`)) offenders.push(`${property}: ${value}`);
    }
    assert.deepEqual(offenders, []);
    // Nor does a theme: the shipped themes set an option as a plain number, never a role from one.
    for (const file of ['themes/dark.css', 'themes/compact.css', 'themes/contrast.css', 'themes/example.css']) {
      for (const { property, value } of declarations(read(file))) {
        for (const name of OPTION_VARS) assert.ok(!value.includes(`var(${name}`), `${file}: ${property} reads ${name}`);
      }
    }
  });

  it('multiplies every type role by --ds-type-scale, theme-level, and never takes field text under 16px', () => {
    const theme = Object.fromEntries(declarations(themeRule()).map(({ property, value }) => [property, value]));
    assert.equal(theme['--ds-type-scale'], '1');
    assert.equal(theme['--ds-size-display'], 'calc(36px * var(--ds-type-scale))');
    const SIZED = /^var\(--ds-weight-\w+\) calc\(\d+px \* var\(--ds-type-scale\)\)\/calc\(\d+px \* var\(--ds-type-scale\)\) var\(--ds-font(-mono)?\)$/;
    const roles = Object.keys(theme).filter((name) => /^--ds-font-/.test(name) && !['--ds-font-mono', '--ds-font-input', '--ds-font-display'].includes(name));
    assert.ok(roles.length >= 10, 'finds the type roles');
    for (const name of roles) assert.match(theme[name], SIZED, name);
    assert.equal(theme['--ds-font-display'], 'var(--ds-weight-regular) var(--ds-size-display)/calc(44px * var(--ds-type-scale)) var(--ds-font)');
    assert.equal(theme['--ds-font-input'], 'var(--ds-weight-regular) max(16px, calc(16px * var(--ds-type-scale)))/max(24px, calc(24px * var(--ds-type-scale))) var(--ds-font)');
    // Say so where a theme author looks: it is theme-level and does not nest.
    assert.match(read('docs/options.md'), /`--ds-type-scale`[\s\S]*do not nest/);
    assert.ok(read('docs/tokens.md').includes('`--ds-type-scale`'));
    // No component sets it: only a theme does.
    for (const file of filesIn('src/components', (path) => path.endsWith('.css'))) assert.ok(!/--ds-type-scale\s*:/.test(stripComments(read(file))), file);
  });

  it('keeps every tone pair in the contrast lists (text on the full colour and on the container, the ink on the surface)', () => {
    const has = (list, pair) => list.some(([fg, bg]) => fg === pair[0] && bg === pair[1]);
    for (const [tone, [ink, onInk, container, onContainer]] of Object.entries(TONES)) {
      assert.ok(has(TEXT_PAIRS, [onInk, ink]), `${tone}: ${onInk} on ${ink}`);
      assert.ok(has(TEXT_PAIRS, [onContainer, container]), `${tone}: ${onContainer} on ${container}`);
      if (tone !== 'neutral' && tone !== 'primary') assert.ok(has(ICON_PAIRS, [ink, '--ds-surface']), `${tone}: ${ink} on --ds-surface`);
    }
  });

  it('reads the options in the button\'s own rule, with fallbacks, never on .ds-theme', () => {
    const button = Object.fromEntries(declarationsOf(read('src/components/button/button.css'), '.ds-btn').map((entry) => [entry.property, entry.value]));
    assert.equal(button['--_h'], 'var(--ds-btn-height-exact, calc(var(--ds-btn-height, 40px) + var(--ds-size-step, 0) * 8px + var(--ds-density, 0) * 4px))');
    assert.equal(button['--_box'], 'max(var(--ds-target-min, 0px), var(--_h))');
    assert.equal(button['min-height'], 'var(--_box)');
    assert.equal(button.font, 'var(--ds-btn-font, var(--ds-size-font, var(--ds-font-label)))');
    // Only a filled button reads a tone, from its own class (an inherited tone never turns a button red, D10).
    const toned = rules(read('src/components/button/button.css')).filter((rule) => /var\(--ds-(on-)?tone\b/.test(rule.body)).map((rule) => rule.selector);
    assert.deepEqual(toned, [':is(.ds-btn--filled, .ds-btn--primary).ds-tone-error']);
  });
});
