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
    // Only the nearest host: a table in a card answers to its rows (every host around the actions is hovered).
    const host = ':is(tr, li, .ds-card, .ds-drawer__row, .ds-hover-host)';
    assert.deepEqual(hover, [`${host}:hover .ds-hover-actions:not(${host}:not(:hover) .ds-hover-actions)`]);
    const shown = selectorsOf(withoutAtRuleBlocks(css, /@media/)).filter((part) => part.includes('.ds-hover-actions') && part !== '.ds-hover-actions');
    for (const state of [':focus-within', '[aria-current]', '[aria-selected="true"]', '[data-ds-shown]', ':has([aria-expanded="true"])']) {
      assert.ok(shown.some((part) => part.includes(state)), state);
    }
    assert.ok(shown.includes('.ds-touch .ds-hover-actions'));
    // A host in a state reveals unless a nearer host is in none; an open menu counts in the actions only (no
    // :has() on every row and card).
    const states = shown.find((part) => part.startsWith(`${host}:is(:focus-within`));
    assert.ok(states, 'the host states');
    assert.match(states, /\.ds-hover-actions:not\(:is\(tr, li, .*\):is\(:focus-within, .*\) :is\(tr, li, .*\):not\(:focus-within, .*\) \.ds-hover-actions\)$/);
    assert.ok(!shown.some((part) => part.startsWith(host) && part.includes(':has(')), 'no :has() on the hosts');
    assert.ok(shown.includes('.ds-hover-actions:is(:focus-within, [data-ds-shown], [aria-expanded="true"], :has([aria-expanded="true"]))'));
    // A drawer row is current through its item, not itself.
    assert.ok(shown.includes('.ds-drawer__row:has(> .ds-drawer__item[aria-current]:not([aria-current="false"])) .ds-hover-actions'));
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
      '--ds-check-sm-height', '--ds-check-target', '--ds-switch-height', '--ds-switch-halo', '--ds-chip-height', '--ds-combo-option-height', '--ds-menu-item-height',
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
    // The 1px floor: a container that Firefox styles before its first layout reads 0px wide (no fold on load).
    const container = atRuleBlocks(css, /@container ds-content \(min-width: 1px\) and \(max-width: 600px\)/).join('\n');
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

describe('tiles and cards (2.0)', () => {
  const tile = read('src/components/tile.css');
  const card = read('src/components/card.css');
  const SEL = ':is([aria-pressed="true"], [aria-checked="true"], [aria-selected="true"])';

  it('marks a selected tile or card by the tint and a static border ring on a free ::after', () => {
    const flatTile = withoutAtRuleBlocks(tile, /@media/);
    assert.equal(own(flatTile, `:is(button, a).ds-tile${SEL}`).background, 'var(--ds-tile-selected-bg, var(--ds-accent))');
    const flatCard = withoutAtRuleBlocks(card, /@media/);
    assert.equal(own(flatCard, `.ds-card--interactive${SEL}`).background, 'var(--ds-card-selected-bg, var(--ds-accent))');
    assert.equal(own(flatCard, `.ds-card--interactive:has(.ds-card__action${SEL})`).background, 'var(--ds-card-selected-bg, var(--ds-accent))');
    for (const [css, selector] of [[flatTile, `:is(button, a).ds-tile${SEL}::after`], [flatCard, `.ds-card--interactive${SEL}::after`]]) {
      const ring = own(css, selector);
      assert.equal(ring.border, 'var(--ds-focus-width) solid var(--ds-selected-ring, var(--ds-primary))', selector);
      assert.equal(ring['pointer-events'], 'none');
      assert.equal(ring.transition, undefined, 'the ring shows at once');
      assert.ok(!('box-shadow' in ring), 'a border, never a box-shadow ring');
    }
    // The colours glide on --ds-dur-fast (rest and pressed).
    for (const [css, selector] of [[flatTile, ':is(button, a).ds-tile'], [flatCard, '.ds-card--interactive']]) {
      assert.match(own(css, selector).transition, /background-color var\(--ds-dur-fast\) var\(--ds-ease-in-out\)/, selector);
    }
    const forcedTile = forcedColorBlocks(tile).join('\n');
    assert.equal(own(forcedTile, `:is(button, a).ds-tile${SEL}`).background, 'Highlight');
    assert.equal(own(forcedTile, `:is(button, a).ds-tile${SEL}`).color, 'HighlightText');
    const forcedCard = forcedColorBlocks(card).join('\n');
    assert.equal(own(forcedCard, `.ds-card--interactive${SEL}`).background, 'Highlight');
    assert.equal(own(forcedCard, '.ds-card--interactive[aria-disabled="true"]').color, 'GrayText');
  });

  it('fills tile rows intrinsically (up to four, --3: three), without a window step', () => {
    const flat = withoutAtRuleBlocks(tile, /@media/);
    assert.equal(own(flat, '.ds-tiles')['grid-template-columns'],
      'repeat(auto-fit, minmax(min(100%, max(var(--ds-tile-min-width, 176px), (100% - (var(--ds-tiles-columns, 4) - 1) * var(--ds-space-3)) / var(--ds-tiles-columns, 4))), 1fr))');
    assert.match(own(flat, '.ds-tiles--3')['grid-template-columns'], /\/ 3\)\), 1fr\)\)$/);
    assert.doesNotMatch(stripComments(tile), /max-width:\s*1100px/);
    const value = own(flat, '.ds-tile__value');
    assert.deepEqual([value['min-width'], value.overflow, value['text-overflow']], ['0', 'hidden', 'ellipsis']);
    assert.equal(own(flat, '.ds-tile__value--empty').color, 'var(--ds-text-2)');
  });

  it('resets a button action, wraps titles, hangs only text links, elevates and keeps short cards whole in print', () => {
    const flat = withoutAtRuleBlocks(card, /@media/);
    const action = own(flat, 'button.ds-card__action');
    for (const [property, value] of [['margin', '0'], ['padding', '0'], ['border', '0'], ['background', 'none'], ['font', 'inherit'], ['text-align', 'start']]) assert.equal(action[property], value, property);
    assert.equal(own(flat, '.ds-card__title')['overflow-wrap'], 'anywhere');
    assert.equal(own(flat, '.ds-card__title:has(> svg:first-child)').display, 'flex');
    assert.ok(own(flat, '.ds-card__links > :is(.ds-btn--text, .ds-card__link)')['margin-inline-start']);
    assert.equal(own(flat, '.ds-card__links > *')['margin-inline-start'], undefined);
    assert.equal(own(flat, '.ds-card__links')['align-items'], 'center');
    assert.equal(own(flat, '.ds-card--elevated')['box-shadow'], 'var(--ds-card-shadow, var(--ds-elev-1))');
    assert.equal(own(forcedColorBlocks(card).join('\n'), '.ds-card--elevated')['border-color'], 'CanvasText');
    for (const css of [card, tile]) assert.ok(atRuleBlocks(css, /@media\s+print/).some((block) => /break-inside:\s*avoid/.test(block)));
  });
});

describe('alerts (2.0)', () => {
  const css = read('src/components/alert.css');
  const flat = withoutAtRuleBlocks(css, /@media/);

  it('reads its look from 13 hooks with the 1.6 values as fallbacks', () => {
    const base = own(flat, '.ds-alert');
    assert.equal(base.background, 'var(--ds-alert-bg, var(--ds-surface-low))');
    assert.equal(base.color, 'var(--ds-alert-color, var(--ds-text))');
    assert.equal(base['border-inline-start'], 'var(--ds-alert-edge, 0px) solid var(--ds-alert-icon, var(--ds-primary))');
    assert.equal(own(flat, '.ds-alert > svg').color, 'var(--ds-alert-icon, var(--ds-primary))');
    const kinds = {
      success: ['--ds-success-container', '--ds-on-success-container', '--ds-success'],
      warning: ['--ds-warning-surface', '--ds-text', '--ds-warning'],
      error: ['--ds-error-container', '--ds-on-error-container', '--ds-error'],
    };
    const hooks = new Set(['--ds-alert-bg', '--ds-alert-color', '--ds-alert-icon', '--ds-alert-edge']);
    for (const [kind, [bg, color, icon]] of Object.entries(kinds)) {
      assert.deepEqual(own(flat, `.ds-alert--${kind}`), {
        '--ds-alert-bg': `var(--ds-alert-${kind}-bg, var(${bg}))`,
        '--ds-alert-color': `var(--ds-alert-${kind}-color, var(${color}))`,
        '--ds-alert-icon': `var(--ds-alert-${kind}-icon, var(${icon}))`,
      }, kind);
      for (const part of ['bg', 'color', 'icon']) hooks.add(`--ds-alert-${kind}-${part}`);
    }
    assert.equal(hooks.size, 13);
    assert.equal(own(flat, '.ds-alert--error:not(.ds-alert--plain) .ds-btn')['--ds-btn-color'], 'var(--ds-alert-error-color, var(--ds-on-error-container))');
    const theming = read('docs/theming.md');
    for (const hook of hooks) assert.ok(theming.includes(`\`${hook}\``), hook);
    assert.equal(own(forcedColorBlocks(css).join('\n'), '.ds-alert:not(.ds-alert--plain)').outline, '1px solid transparent');
  });

  it('has a plain preset after the kinds, titles, paragraphs and an actions row; centres buttons on their own height', () => {
    const plain = own(flat, '.ds-alert--plain');
    assert.deepEqual(plain, { '--ds-alert-bg': 'transparent', '--ds-alert-color': 'var(--ds-text)', '--ds-alert-edge': '0', 'padding-inline': '0', 'border-radius': '0' });
    assert.ok(stripComments(css).indexOf('.ds-alert--plain {') > stripComments(css).indexOf('.ds-alert--error {'), 'after the kinds');
    assert.equal(own(flat, '.ds-alert--plain + .ds-alert--plain')['border-top'], '1px solid var(--ds-line)');
    assert.equal(own(flat, '.ds-alert__title').font, 'var(--ds-font-label)');
    assert.equal(own(flat, '.ds-alert__text > p').margin, '0');
    assert.equal(own(flat, '.ds-alert__text > p + p')['margin-top'], 'var(--ds-space-2)');
    assert.equal(own(flat, '.ds-alert:has(> .ds-alert__actions) > .ds-alert__text').flex, '1 1 var(--ds-alert-text-basis, 256px)');
    for (const selector of ['.ds-alert .ds-btn', '.ds-alert__actions']) {
      assert.equal(own(flat, selector)['margin-block'], 'calc((var(--ds-space-5) - var(--ds-btn-height, 36px)) / 2)', selector);
    }
    assert.equal(own(flat, '.ds-alert__actions > .ds-btn').margin, '0');
  });
});

describe('the done state (2.0)', () => {
  const css = read('src/components/empty.css');

  it('pops the disc in, rings once and draws the check, on tokens, as keyframes', () => {
    const disc = own(withoutAtRuleBlocks(css, /@media/), '.ds-empty--done .ds-empty__disc');
    assert.equal(disc.animation, 'ds-fade-in var(--ds-dur-slow) var(--ds-ease-in-out) var(--ds-dur-base) backwards, ds-pop-in var(--ds-dur-slow) var(--ds-ease-spatial) var(--ds-dur-base) backwards');
    const ring = own(css, '.ds-empty--done .ds-empty__disc::after');
    assert.equal(ring.animation, 'ds-ripple var(--ds-dur-slow) var(--ds-ease-out) var(--ds-dur-slow)');
    assert.equal(ring.opacity, '0', 'invisible before and after its one play');
    assert.equal(own(css, '.ds-empty--done .ds-empty__disc > svg').animation, 'ds-draw var(--ds-dur-glide) var(--ds-ease-out) var(--ds-dur-slow) backwards');
    assert.equal(own(css, '.ds-empty--done .ds-empty__disc [pathLength]')['stroke-dasharray'], '1');
    assert.equal(own(forcedColorBlocks(css).join('\n'), '.ds-empty--done .ds-empty__disc').outline, '1px solid CanvasText');
  });
});

describe('the switch (2.0)', () => {
  const css = read('src/components/switch.css');
  const flat = withoutAtRuleBlocks(css, /@media|@container/);
  const BLOCKED = 'input:is(:disabled, [aria-disabled="true"])';

  it('lets the input cover the track and blocks aria-disabled like disabled', () => {
    const input = own(flat, '.ds-switch input');
    for (const [property, value] of [['position', 'absolute'], ['inset-block', '0'], ['inset-inline-start', '0'], ['width', '52px'], ['height', '32px'], ['margin', 'auto 0'], ['appearance', 'none'], ['opacity', '0'], ['cursor', 'inherit']]) {
      assert.equal(input[property], value, property);
    }
    assert.equal(own(flat, '.ds-switch__track')['pointer-events'], 'none');
    assert.equal(own(flat, '.ds-switch')['min-height'], 'var(--ds-switch-height, 40px)');
    const source = stripComments(css);
    assert.doesNotMatch(source, /input:disabled|:not\(:disabled\)|:checked:disabled/, 'every blocked look also for aria-disabled');
    assert.ok(own(flat, `.ds-switch ${BLOCKED} + .ds-switch__track`).opacity);
    assert.equal(own(flat, `.ds-switch:has(${BLOCKED})`).cursor, 'not-allowed');
    const forced = forcedColorBlocks(css).join('\n');
    assert.equal(own(forced, `.ds-switch ${BLOCKED} + .ds-switch__track`)['border-color'], 'GrayText');
    assert.equal(own(forced, '.ds-switch input:checked:focus-visible + .ds-switch__track')['outline-color'], 'CanvasText');
  });

  it('keeps a locked switch at full strength with the lock riding the handle', () => {
    assert.deepEqual(own(flat, `.ds-switch--locked ${BLOCKED} + .ds-switch__track`), { 'border-color': 'var(--ds-outline)', background: 'var(--ds-surface-highest)', opacity: '1' });
    assert.equal(own(flat, `.ds-switch--locked ${BLOCKED} + .ds-switch__track::after`).scale, 'calc(6 / 7)');
    // After the disabled rules (same weight), so it wins.
    assert.ok(stripComments(css).indexOf(`.ds-switch--locked ${BLOCKED} + .ds-switch__track {`) > stripComments(css).indexOf(`.ds-switch ${BLOCKED} + .ds-switch__track {`));
    const icon = own(flat, '.ds-switch__icon');
    assert.deepEqual([icon['inset-block-start'], icon['inset-inline-start'], icon.color, icon.opacity], ['6px', '6px', 'var(--ds-surface-highest)', '0']);
    assert.deepEqual(own(flat, '.ds-switch input:checked + .ds-switch__track .ds-switch__icon'), { color: 'var(--ds-primary)', translate: '20px 0' });
    assert.match(icon.transition, /translate var\(--ds-dur-medium\) var\(--ds-ease-spatial\)/);
    assert.match(icon.transition, /^opacity var\(--ds-dur-instant\)/);
    assert.match(own(flat, '.ds-switch--locked .ds-switch__icon').transition, /^opacity var\(--ds-dur-fast\)/);
    const forced = forcedColorBlocks(css).join('\n');
    assert.equal(own(forced, `.ds-switch--locked input:checked:is(:disabled, [aria-disabled="true"]) + .ds-switch__track`).background, 'Highlight');
  });

  it('lays out hints, extras and switch lists, wrapping the meta in a narrow list', () => {
    assert.equal(own(flat, 'small.ds-switch__hint').font, 'var(--ds-font-meta)');
    assert.equal(own(flat, '.ds-switch__label')['overflow-wrap'], 'anywhere');
    assert.equal(own(flat, '.ds-switch-list').container, 'ds-switch-list / inline-size');
    const row = own(flat, '.ds-switch-list > .ds-switch');
    assert.equal(row['grid-template-columns'], 'auto minmax(0, 1fr) auto auto');
    assert.equal(row['min-height'], 'var(--ds-switch-list-row-height, 56px)');
    const narrow = atRuleBlocks(css, /@container ds-switch-list \(max-width: 560px\)/).join('\n');
    assert.match(own(narrow, '.ds-switch-list > .ds-switch')['grid-template-areas'], /"track meta state"/);
  });
});

describe('blocked hosts and selected cards (2.0 review)', () => {
  it('rings a focused aria-disabled control in a system colour in forced colours (its colours are not forced)', () => {
    for (const [file, selector] of [
      ['src/components/button.css', '.ds-btn[aria-disabled="true"]:focus-visible'],
      ['src/components/chip.css', '.ds-chip__input[aria-disabled="true"]:focus-visible + .ds-chip__body'],
      ['src/components/switch.css', '.ds-switch input[aria-disabled="true"]:focus-visible + .ds-switch__track'],
      ['src/components/card.css', '.ds-card--interactive[aria-disabled="true"]:is(:focus-visible, :has(.ds-card__action:focus-visible))'],
      ['src/components/tile.css', ':is(button, a).ds-tile[aria-disabled="true"]:focus-visible'],
    ]) {
      const forced = forcedColorBlocks(read(file)).join('\n');
      assert.equal(own(forced, selector)['outline-color'], 'CanvasText', `${file}: ${selector}`);
    }
  });

  it('gives a badge in a blocked host the disabled model, GrayText in forced colours', () => {
    const css = read('src/components/badge.css');
    const blocked = rules(withoutAtRuleBlocks(css, /@media/)).find((rule) => rule.selector.includes('.ds-btn:disabled') && rule.selector.endsWith(' .ds-badge'));
    assert.ok(blocked, 'a rule for a badge in a blocked host');
    for (const host of ['.ds-btn[aria-disabled="true"]:not([aria-busy="true"])', '.ds-chip__input:is(:disabled, [aria-disabled="true"]) + .ds-chip__body', '.ds-tabs__tab:is(:disabled, [aria-disabled="true"])']) {
      assert.ok(blocked.selector.includes(host), host);
    }
    const body = Object.fromEntries(declarations(`${blocked.body};`).map((entry) => [entry.property, entry.value]));
    assert.equal(body.background, 'var(--ds-disabled-fill, var(--ds-badge-bg, var(--ds-accent)))');
    assert.equal(body.color, 'var(--ds-disabled-ink, var(--ds-badge-color, var(--ds-on-accent)))');
    const forced = rules(forcedColorBlocks(css).join('\n')).find((rule) => rule.selector === blocked.selector);
    assert.match(forced?.body ?? '', /color: GrayText/);
  });

  it('keeps the outer pixel of a selected card\'s ring while a ripple clips it', () => {
    const block = atRuleBlocks(read('src/components/ripple.css'), /@supports \(overflow-clip-margin: 1px\)/).join('\n');
    const rule = rules(block).find((item) => item.selector.includes('.ds-card--interactive'));
    assert.ok(rule && /\[aria-pressed="true"\]/.test(rule.selector) && rule.selector.includes(':has(> .ds-press-ripple)'));
    assert.match(rule.body, /overflow-clip-margin: 1px/);
  });
});

describe('invalid groups, blocked radio cards and sliders (2.0 review)', () => {
  const css = read('src/components/form.css');

  it('turns a focused invalid input group\'s border and ring both to the error colour', () => {
    assert.deepEqual(own(css, '.ds-input-group:has(> [aria-invalid="true"]:focus)'), { 'border-color': 'var(--ds-error)', 'box-shadow': 'inset 0 0 0 1px var(--ds-error)' });
  });

  it('keeps the error ink on the label of an invalid group, row or combobox, bounded to them', () => {
    const label = rules(css).find((rule) => rule.selector.startsWith('.ds-field:has(> [aria-invalid="true"]') && rule.selector.endsWith('> .ds-field__label'));
    assert.equal(label?.selector, '.ds-field:has(> [aria-invalid="true"], > :is(.ds-input-group, .ds-field__row, .ds-combo) > [aria-invalid="true"]) > .ds-field__label');
  });

  it('gives a radio card with a blocked input no hover border and the quiet look', () => {
    const hover = atRuleBlocks(css, /@media\s*\(hover:\s*hover\)/).flatMap((block) => rules(block)).filter((rule) => /^\.ds-radio:hover/.test(rule.selector) && /border-color/.test(rule.body));
    assert.ok(hover.length > 0);
    for (const rule of hover) assert.ok(rule.selector.includes(':not(.ds-radio--disabled, :has(input:is(:disabled, [aria-disabled="true"])))'), rule.selector);
    assert.deepEqual(own(css, '.ds-radio:has(input:is(:disabled, [aria-disabled="true"])):not(:has(input:checked))'), { 'border-color': 'var(--ds-line)', background: 'var(--ds-surface-low)' });
    assert.equal(own(css, '.ds-radio:has(input:is(:disabled, [aria-disabled="true"])) strong').color, 'var(--ds-text-2)');
  });

  it('draws a blocked slider handle solid (the ink over the surface)', () => {
    const css = read('src/components/slider.css');
    for (const pseudo of ['::-webkit-slider-thumb', '::-moz-range-thumb']) {
      assert.equal(own(css, `.ds-slider:is(:disabled, [aria-disabled="true"])${pseudo}`).background, 'linear-gradient(currentColor, currentColor) var(--ds-surface)', pseudo);
    }
  });
});

describe('the loading line (2.0 review)', () => {
  it('keeps the loading line a flex row; only detail lines make it a grid', () => {
    const css = read('src/components/loading.css');
    assert.equal(own(css, '.ds-loading').display, 'flex');
    assert.equal(own(css, '.ds-loading:has(> .ds-loading__detail)').display, 'grid');
  });
});
