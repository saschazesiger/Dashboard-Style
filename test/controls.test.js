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

describe('buttons (2.0)', () => {
  const B = 'src/components/button.css';
  const css = read(B);
  const DISCLOSURE = ':is(.ds-btn--disclosure, .ds-btn[aria-haspopup="dialog"])[aria-expanded="true"]';
  const LOCKED = '.ds-btn[aria-pressed="true"][aria-disabled="true"]:not([aria-busy="true"])';

  it('tints an open disclosure button like a pressed toggle, in forced colours too; menu triggers stay plain', () => {
    const tint = own(withoutAtRuleBlocks(css, /@media/), DISCLOSURE);
    assert.equal(tint['--ds-btn-bg'], 'var(--ds-accent)');
    assert.deepEqual(tint, own(withoutAtRuleBlocks(css, /@media/), '.ds-btn[aria-pressed="true"]'));
    const forced = forcedColorBlocks(css).join('\n');
    assert.equal(own(forced, DISCLOSURE).background, 'Highlight');
    assert.equal(own(forced, `${DISCLOSURE}:focus-visible`)['outline-color'], 'CanvasText');
    assert.doesNotMatch(stripComments(css), /aria-haspopup="menu"/);
  });

  it('keeps a locked choice in its on look, GrayText for other aria-disabled buttons in forced colours', () => {
    const locked = own(withoutAtRuleBlocks(css, /@media/), LOCKED);
    assert.deepEqual(locked, {
      opacity: '1', color: 'var(--ds-btn-color, var(--ds-action-ink))', background: 'var(--ds-btn-bg, transparent)',
      'border-color': 'var(--ds-btn-border, var(--ds-line-2))', cursor: 'default',
    });
    const forced = forcedColorBlocks(css).join('\n');
    assert.equal(own(forced, '.ds-btn[aria-disabled="true"]:not([aria-busy="true"])').color, 'GrayText');
    assert.equal(own(forced, LOCKED).background, 'Highlight');
  });

  it('pulls the start padding in before a leading icon of a face, and underlines with the link geometry', () => {
    assert.equal(own(css, '.ds-btn:is(:has(> svg:first-child), :has(> .ds-btn__faces:first-child > .ds-btn__face:first-child > svg:first-child))')['--ds-btn-padding-start'], 'var(--ds-space-3)');
    const hover = atRuleBlocks(css, /@media\s*\(hover:\s*hover\)/).map((block) => declarations(rules(block).find((rule) => rule.selector === '.ds-btn:hover')?.body ?? '')).find((list) => list.length);
    const names = hover.map((entry) => entry.property);
    assert.ok(names.indexOf('text-decoration-thickness') > names.indexOf('text-decoration'), 'after the shorthand');
    assert.ok(names.indexOf('text-underline-offset') > names.indexOf('text-decoration'));
  });

  it('folds the label of .ds-btn--adaptive in a narrow content panel and, in sheets and dialogs, a narrow window', () => {
    const container = atRuleBlocks(css, /@container ds-content \(max-width: 600px\)/).join('\n');
    const media = atRuleBlocks(css, /@media \(max-width: 600px\)/).join('\n');
    assert.equal(own(container, '.ds-btn--adaptive').width, 'var(--ds-btn-icon-size, 40px)');
    assert.equal(own(container, '.ds-btn--adaptive')['--ds-btn-bg'], 'transparent');
    assert.equal(own(container, '.ds-btn--adaptive.ds-btn--sm')['--ds-btn-icon-size'], 'var(--ds-btn-sm-icon-size, 32px)');
    assert.equal(own(container, '.ds-btn--adaptive .ds-btn__label').clip, 'rect(0, 0, 0, 0)');
    assert.deepEqual(own(media, ':is(.ds-sheet, .ds-dialog) .ds-btn--adaptive .ds-btn__label'), own(container, '.ds-btn--adaptive .ds-btn__label'));
    assert.deepEqual(own(media, ':is(.ds-sheet, .ds-dialog) .ds-btn--adaptive'), own(container, '.ds-btn--adaptive'));
  });

  it('keeps quiet links underlined, in the quieter ink, the link colour on hover', () => {
    const quiet = own(withoutAtRuleBlocks(css, /@media/), '.ds-link--quiet');
    assert.equal(quiet.color, 'var(--ds-text-2)');
    assert.equal(quiet['text-decoration-line'], 'underline');
    assert.equal(quiet['text-decoration-color'], 'var(--ds-line-2)');
    assert.deepEqual(own(withoutAtRuleBlocks(css, /@media/), '.ds-link-btn.ds-link-btn--quiet'), quiet);
    const hover = atRuleBlocks(css, /@media\s*\(hover:\s*hover\)/).map((block) => own(block, '.ds-link--quiet:hover')).find((entry) => entry.color);
    assert.deepEqual(hover, { color: 'var(--ds-link)', 'text-decoration-color': 'var(--ds-link-underline-hover)' });
  });
});

describe('chips, badges and tags (2.0)', () => {
  const chip = read('src/components/chip.css');
  const flat = withoutAtRuleBlocks(chip, /@media/);

  it('resets button chips, keeps every visual on the body and drops the check slot', () => {
    const reset = own(flat, ':is(button, a).ds-chip');
    for (const [property, value] of [['margin', '0'], ['padding', '0'], ['border', '0'], ['background', 'none'], ['font', 'inherit']]) assert.equal(reset[property], value, property);
    assert.equal(own(flat, ':is(button, a).ds-chip > .ds-chip__body::after').content, 'none');
    assert.equal(own(flat, ':is(button, a).ds-chip > .ds-chip__body')['max-width'], 'var(--ds-chip-max-width, 240px)');
    assert.equal(own(flat, ':is(button, a).ds-chip > .ds-chip__body:has(> .ds-chip__icon:first-child)')['padding-inline-start'], 'var(--ds-space-2)');
    assert.equal(own(flat, ':is(button, a).ds-chip > .ds-chip__body:has(> .ds-chip__trailing:last-child)')['padding-inline-end'], 'var(--ds-space-2)');
    assert.equal(own(flat, '.ds-chip__label')['text-overflow'], 'ellipsis');
    assert.deepEqual(own(flat, ':is(button, a).ds-chip:not(:disabled, [aria-disabled="true"]):is(:active, .ds-pressed) > .ds-chip__body::before'),
      { opacity: 'var(--ds-state-pressed)', 'transition-duration': 'var(--ds-dur-micro)' });
    // No morph: no radius changes on press; and a chip that stays on is a filter chip.
    assert.ok(!rules(chip).some((rule) => /\.ds-chip[^,{]*:(active|is\(:active)/.test(rule.selector) && /border-radius/.test(rule.body)));
    assert.ok(!selectorsOf(chip).some((part) => /\.ds-chip\[aria-pressed/.test(part)), 'no .ds-chip[aria-pressed]');
    // The ripple rules of ripple.css know button chips (press and focus).
    const ripple = selectorsOf(read('src/components/ripple.css')).filter((part) => part.includes('.ds-chip') && part.includes(':is(button, a)'));
    assert.equal(ripple.length, 3);
  });

  it('tints input chips through hooks, wraps long chips at one-line height, hides an empty row', () => {
    assert.deepEqual(own(flat, '.ds-chip--input > .ds-chip__body'), {
      'border-color': 'var(--ds-chip-input-border, var(--ds-accent))', background: 'var(--ds-chip-input-bg, var(--ds-accent))', color: 'var(--ds-chip-input-color, var(--ds-on-accent))',
    });
    const wrap = own(flat, '.ds-chips--wrap .ds-chip__body');
    assert.equal(wrap['padding-block'], 'calc((var(--ds-chip-height, 32px) - 1lh) / 2 - 1px)');
    assert.equal(wrap['border-radius'], 'min(var(--ds-radius-chip), calc(var(--ds-chip-height, 32px) / 2))');
    assert.equal(wrap['white-space'], 'normal');
    assert.equal(own(flat, '.ds-chips:empty').display, 'none');
    assert.equal(own(flat, '.ds-chips[data-ds-glide] .ds-chip')['background-color'], 'var(--ds-chips-backdrop, var(--ds-flip-backdrop, var(--ds-surface)))');
    assert.equal(own(forcedColorBlocks(chip).join('\n'), '.ds-chip--input > .ds-chip__body')['border-color'], 'CanvasText');
  });

  it('blocks aria-disabled filter chips like disabled ones (looks, hover, press, cursor, forced colours)', () => {
    assert.doesNotMatch(stripComments(chip), /\.ds-chip__input:disabled|\.ds-chip__input:not\(:disabled\)|:checked:disabled/);
    assert.equal(own(flat, '.ds-chip:has(.ds-chip__input:is(:disabled, [aria-disabled="true"]))').cursor, 'not-allowed');
    assert.equal(own(forcedColorBlocks(chip).join('\n'), '.ds-chip__input:is(:disabled, [aria-disabled="true"]) + .ds-chip__body').color, 'GrayText');
    assert.doesNotMatch(stripComments(read('src/components/ripple.css')), /\.ds-chip__input:not\(:disabled\)/);
  });

  it('draws badges and tags as pills from hooks, with tones and the strong pair on tinted hosts', () => {
    const badge = read('src/components/badge.css');
    const base = own(withoutAtRuleBlocks(badge, /@media/), '.ds-badge');
    assert.equal(base['min-width'], 'var(--ds-badge-size, 20px)');
    assert.equal(base['border-radius'], 'min(var(--ds-badge-radius, var(--ds-radius-action)), calc(var(--ds-badge-size, 20px) / 2))');
    assert.equal(base.font, 'var(--ds-font-caption)');
    assert.equal(base['font-variant-numeric'], 'tabular-nums');
    assert.equal(own(badge, '.ds-badge:empty').display, 'none');
    for (const tone of ['neutral', 'ok', 'warning', 'error']) assert.ok(own(badge, `.ds-badge--${tone}`)['--ds-badge-bg'], tone);
    const tinted = selectorsOf(badge).find((part) => part.endsWith('.ds-badge:not(.ds-badge--neutral, .ds-badge--ok, .ds-badge--warning, .ds-badge--error)'));
    for (const host of ['.ds-btn[aria-pressed="true"]', '.ds-btn--tonal', '.ds-chip--input', '.ds-chip__input:checked + .ds-chip__body', '.ds-table__row--selected']) assert.ok(tinted.includes(host), host);
    assert.equal(own(forcedColorBlocks(badge).join('\n'), '.ds-badge').outline, '1px solid CanvasText');
    assert.match(read('src/index.css'), /@import '\.\/components\/chip\.css';\n@import '\.\/components\/badge\.css';/);
    const status = read('src/components/status.css');
    const tag = own(withoutAtRuleBlocks(status, /@media/), '.ds-tag');
    assert.equal(tag.background, 'var(--ds-tag-bg, var(--ds-accent))');
    assert.equal(tag.color, 'var(--ds-tag-color, var(--ds-on-accent))');
    assert.equal(tag['border-radius'], 'min(var(--ds-radius-action), calc(var(--ds-tag-height, 24px) / 2))');
    assert.equal(own(status, '.ds-tag > svg').color, 'var(--ds-on-accent-icon)');
    assert.deepEqual(own(status, '.ds-tag--neutral'), { '--ds-tag-bg': 'var(--ds-surface-high)', '--ds-tag-color': 'var(--ds-text)' });
    assert.equal(own(forcedColorBlocks(status).join('\n'), '.ds-tag').outline, '1px solid CanvasText');
    // Not interactive: no cursor, no state layer.
    assert.ok(!rules(status).some((rule) => rule.selector.includes('.ds-tag') && /cursor|::before/.test(rule.selector + rule.body)));
  });
});
