/**
 * The controls, press, icons and utilities of 2.0: the press model for a
 * project element (.ds-pressable), actions on demand, keys, dividers,
 * icons that fill, touch targets, buttons, chips, badges and tags,
 * selected tiles and cards, alerts, the done state and the switch. The
 * general guardrails (tokens, motion, layers) are in css.test.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RIPPLE_HOSTS } from '../src/js/ripple.js';
import { atRuleBlocks, declarations, declarationsOf, forcedColorBlocks, read, rules, stripComments, withoutAtRuleBlocks } from './helpers.js';

const U = 'src/components/utilities.css';

/** A selector list split at its top-level commas. */
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

/** The declarations (as { property: value }) of the rules of `css` whose selector list holds `selector`. */
function own(css, selector) {
  return Object.fromEntries(rules(css).filter((rule) => splitSelectors(rule.selector).includes(selector))
    .flatMap((rule) => declarations(`${rule.body};`)).map((entry) => [entry.property, entry.value]));
}

/** Every selector part of `css` (top level, @media blocks included). */
const selectorsOf = (css) => rules(css).flatMap((rule) => splitSelectors(rule.selector));

describe('.ds-pressable (2.0)', () => {
  const css = read(U);

  it('lays the state layer of the system over a project element, with the focus snap', () => {
    const base = own(css, '.ds-pressable');
    assert.equal(base.position, 'relative');
    assert.equal(base.isolation, 'isolate');
    assert.equal(base['border-radius'], 'var(--ds-pressable-radius, var(--ds-radius-sm))');
    assert.equal(base['outline-offset'], 'calc(var(--ds-focus-offset) + var(--ds-focus-width))');
    assert.equal(base.transition, 'outline-offset var(--ds-dur-fast) var(--ds-ease-out)');
    assert.equal(own(css, '.ds-pressable::before').background, 'var(--ds-pressable-layer, currentColor)');
    const hover = atRuleBlocks(css, /@media\s*\(hover:\s*hover\)/).map((block) => own(block, '.ds-pressable:hover::before')).find((entry) => entry.opacity);
    assert.equal(hover.opacity, 'var(--ds-state-hover)');
    const large = atRuleBlocks(css, /@media\s*\(hover:\s*hover\)/).map((block) => own(block, '.ds-pressable--lg:hover::before')).find((entry) => entry.opacity);
    assert.equal(large.opacity, 'var(--ds-state-hover-lg)');
    assert.deepEqual(own(css, '.ds-pressable:active::before'), { opacity: 'var(--ds-state-pressed)', 'transition-duration': 'var(--ds-dur-micro)' });
    assert.deepEqual(own(css, '.ds-pressable:focus-visible::before'), { opacity: 'var(--ds-state-focus)', 'transition-duration': '0s' });
    assert.equal(own(css, '.ds-pressable--inset')['outline-offset'], '0');
    assert.equal(own(css, '.ds-pressable--inset:focus-visible')['outline-offset'], 'calc(-1 * var(--ds-focus-width))');
    // Never a morph: no radius changes on press.
    assert.ok(!rules(css).some((rule) => /\.ds-pressable[^,]*:(active|is\(:active)/.test(rule.selector) && /border-radius/.test(rule.body)));
  });

  it('blocks disabled, aria-disabled and busy elements; ripples them as a host; no layer in forced colours', () => {
    const blocked = '.ds-pressable:is(:disabled, [aria-disabled="true"], [aria-busy="true"])';
    assert.equal(own(css, blocked).cursor, 'not-allowed');
    assert.equal(own(css, `${blocked}:is(:active, .ds-pressed)::before`).opacity, '0');
    assert.ok(splitSelectors(RIPPLE_HOSTS).includes('.ds-pressable'));
    const ripple = selectorsOf(read('src/components/ripple.css'));
    assert.ok(ripple.some((part) => part.startsWith(':where(.ds-ripples) .ds-pressable:where(') && part.includes(':is(:active, .ds-pressed)')));
    const forced = forcedColorBlocks(css).flatMap((block) => declarationsOf(block, '.ds-pressable::before'));
    assert.equal(forced.find((entry) => entry.property === 'display')?.value, 'none');
  });
});

describe('utilities (2.0)', () => {
  const css = read(U);

  it('shows .ds-hover-actions by opacity only, on demand, and always without hover', () => {
    assert.deepEqual(own(withoutAtRuleBlocks(css, /@media/), '.ds-hover-actions'), { opacity: '0', transition: 'opacity var(--ds-dur-instant) var(--ds-ease-in-out)' });
    const hover = atRuleBlocks(css, /@media\s*\(hover:\s*hover\)/).flatMap((block) => selectorsOf(block)).filter((part) => part.includes('.ds-hover-actions'));
    assert.deepEqual(hover, [':is(tr, li, .ds-card, .ds-drawer__row, .ds-hover-host):hover .ds-hover-actions']);
    const shown = selectorsOf(withoutAtRuleBlocks(css, /@media/)).filter((part) => part.includes('.ds-hover-actions') && part !== '.ds-hover-actions');
    for (const state of [':focus-within', '[aria-current]', '[aria-selected="true"]', '[data-ds-shown]', ':has([aria-expanded="true"])']) {
      assert.ok(shown.some((part) => part.includes(state)), state);
    }
    assert.ok(shown.includes('.ds-touch .ds-hover-actions'));
    const none = atRuleBlocks(css, /@media\s*\(hover:\s*none\)/).flatMap((block) => declarationsOf(block, '.ds-hover-actions'));
    assert.equal(none.find((entry) => entry.property === 'opacity')?.value, '1');
    // Opacity only: nothing else changes in any of its rules.
    for (const rule of rules(css).filter((item) => item.selector.includes('.ds-hover-actions'))) {
      for (const { property } of declarations(`${rule.body};`)) assert.ok(['opacity', 'transition'].includes(property), `${rule.selector}: ${property}`);
    }
  });

  it('draws keys and dividers from tokens, and takes the margin off .ds-muted', () => {
    const kbd = own(css, '.ds-kbd');
    assert.equal(kbd.font, 'var(--ds-font-code)');
    assert.equal(kbd.border, '1px solid var(--ds-kbd-border, var(--ds-line-2))');
    assert.equal(kbd.background, 'var(--ds-kbd-bg, var(--ds-surface))');
    assert.equal(own(css, '.ds-divider')['border-top'], '1px solid var(--ds-line)');
    assert.equal(own(css, '.ds-divider--inset')['margin-inline-start'], 'var(--ds-space-4)');
    assert.equal(own(css, '.ds-divider--vertical')['border-inline-start'], '1px solid var(--ds-line)');
    assert.equal(own(css, '.ds-divider--label::before')['border-top'], '1px solid var(--ds-line)');
    assert.equal(own(css, '.ds-muted').margin, '0');
    assert.match(read(U).match(/^\/\*[\s\S]*?\*\//)[0], /every component scroller is positioned/i);
  });

  it('fills the last element of a fillable icon while its control is on', () => {
    assert.equal(own(css, '.ds-icon--filled > :last-child').fill, 'currentColor');
    assert.deepEqual(own(css, '.ds-icon--fillable > :last-child'), { fill: 'transparent', transition: 'fill var(--ds-dur-fast) var(--ds-ease-in-out)' });
    assert.equal(own(css, ':is([aria-pressed="true"], [aria-checked="true"]) .ds-icon--fillable > :last-child').fill, 'currentColor');
  });

  it('sets every target hook to --ds-touch-target under .ds-touch (opt-in, a role)', () => {
    const touch = own(css, '.ds-touch');
    const hooks = ['--ds-btn-height', '--ds-btn-sm-height', '--ds-btn-icon-size', '--ds-btn-sm-icon-size', '--ds-input-height', '--ds-check-height',
      '--ds-check-target', '--ds-switch-height', '--ds-switch-halo', '--ds-chip-height', '--ds-combo-option-height', '--ds-menu-item-height',
      '--ds-drawer-item-height', '--ds-toast-close-size', '--ds-tabs-height', '--ds-disclosure-height'];
    for (const hook of hooks) assert.equal(touch[hook], 'var(--ds-touch-target)', hook);
    assert.equal(touch['--ds-input-font'], 'var(--ds-font-input)');
    assert.deepEqual(Object.keys(touch).sort(), [...hooks, '--ds-input-font'].sort());
    // The role sits after the palette marker, 48px; never automatic on a coarse pointer.
    const tokens = stripComments(read('src/tokens.css'));
    const marker = read('src/tokens.css').indexOf('── 2. Palette');
    assert.ok(read('src/tokens.css').indexOf('--ds-touch-target: 48px') > marker);
    assert.match(tokens, /--ds-touch-target:\s*48px/);
    for (const file of ['src/components/utilities.css', 'src/base.css']) assert.doesNotMatch(stripComments(read(file)), /pointer:\s*coarse/, file);
    const theming = read('docs/theming.md');
    assert.match(theming, /## Touch screens/);
    for (const hook of hooks) assert.ok(theming.includes(`\`${hook}\``), `docs/theming.md names ${hook}`);
  });
});
