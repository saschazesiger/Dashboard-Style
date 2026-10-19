/**
 * The token contract: reduced motion through one switch, themes that never
 * touch motion, JS constants that mirror CSS tokens, a default palette that
 * passes WCAG AA, and a theme template that lists every role.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { COUNT_UP_MS, LOADER_DELAY_MS } from '../src/js/motion.js';
import { filesIn, read, stripComments, token } from './helpers.js';

const tokens = stripComments(read('src/tokens.css'));
const reduced = tokens.slice(tokens.indexOf('prefers-reduced-motion'));
const MOTION = /--ds-(dur|ease|distance|loop|stagger|delay|scale-enter|scale-small)[\w-]*\s*:/;

/** Names declared in the main .ds-theme rule, split at the palette marker. */
function layers() {
  const source = read('src/tokens.css');
  const main = source.slice(source.indexOf('.ds-theme {'), source.indexOf('\n}\n'));
  const marker = main.indexOf('── 2. Palette');
  const names = (text) => [...stripComments(text).matchAll(/(--ds-[\w-]+)\s*:/g)].map((match) => match[1]);
  return { scales: names(main.slice(0, marker)), roles: names(main.slice(marker)) };
}

describe('tokens', () => {
  it('switches every duration off for reduced motion (1ms, so end events still fire)', () => {
    const durations = [...new Set([...tokens.matchAll(/(--ds-dur-[\w-]+)\s*:/g)].map((match) => match[1]))];
    assert.ok(durations.length >= 6);
    for (const name of durations) assert.match(reduced, new RegExp(`${name}\\s*:\\s*1ms`), name);
  });

  it('collapses distances, scaling and staggering, and only slows the loaders', () => {
    const distances = [...new Set([...tokens.matchAll(/(--ds-distance-[\w-]+)\s*:/g)].map((match) => match[1]))];
    assert.ok(distances.includes('--ds-distance-sheet'));
    for (const name of distances) assert.match(reduced, new RegExp(`${name}\\s*:\\s*0(px|%)?\\s*;`), name);
    assert.match(reduced, /--ds-scale-enter\s*:\s*1\s*;/);
    assert.match(reduced, /--ds-stagger\s*:\s*0m?s\s*;/);
    for (const loop of ['--ds-loop-spin', '--ds-loop-spin-fast', '--ds-loop-indeterminate', '--ds-loop-pulse']) {
      const normal = parseFloat(token(loop));
      const slow = parseFloat(reduced.match(new RegExp(`${loop}\\s*:\\s*([\\d.]+)s`))[1]);
      assert.ok(slow > normal, `${loop} slows down (${normal}s -> ${slow}s) instead of stopping`);
    }
  });

  it('lets a page opt out only through .ds-motion-full on the switch itself', () => {
    assert.match(tokens, /@media \(prefers-reduced-motion: reduce\) \{\s*\.ds-theme:not\(\.ds-motion-full\) \{/);
  });

  it('keeps motion tokens out of themes', () => {
    for (const theme of filesIn('themes', (path) => path.endsWith('.css'))) {
      assert.equal(MOTION.test(stripComments(read(theme))), false, theme);
    }
  });

  it('keeps JS constants in step with the tokens they mirror', () => {
    assert.equal(parseInt(token('--ds-delay-loader'), 10), LOADER_DELAY_MS);
    assert.equal(parseInt(token('--ds-dur-glide'), 10), COUNT_UP_MS);
    // The indicator retargets for 600ms while it glides (js/indicator.js).
    assert.match(read('src/js/indicator.js'), /glideUntil = now \+ 600/);
    assert.ok(parseInt(token('--ds-dur-medium'), 10) < 600);
    // settled() waits at most this long: longer than the longest animation.
    const timeout = Number(read('src/js/motion.js').match(/DEFAULT_TIMEOUT_MS = (\d+)/)[1]);
    assert.ok(timeout > parseInt(token('--ds-dur-glide'), 10));
  });

  it('pins the shared link geometry and the disabled opacity', () => {
    assert.equal(token('--ds-link-underline-thickness'), '1px');
    assert.equal(token('--ds-link-underline-offset'), '3px');
    assert.equal(token('--ds-state-disabled'), '.38');
  });

  it('starts the scales and roles where the docs say (layers are documented)', () => {
    const { scales, roles } = layers();
    assert.ok(scales.includes('--ds-dur-fast') && scales.includes('--ds-space-4') && scales.includes('--ds-z-toast'));
    assert.ok(roles.includes('--ds-primary') && roles.includes('--ds-font-body') && roles.includes('--ds-elev-overlay'));
    assert.ok(!roles.some((name) => MOTION.test(`${name}:`)), 'no motion token among the roles');
  });

  it('lists every role in the theme template (themes/example.css)', () => {
    const example = stripComments(read('themes/example.css'));
    const missing = layers().roles.filter((name) => !new RegExp(`${name}\\s*:`).test(example));
    assert.deepEqual(missing, []);
  });
});

/** WCAG relative luminance and contrast of two #rrggbb colours. */
function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/** A role's value, following var() references to a #rrggbb literal. */
function colour(name) {
  let value = token(name);
  while (value && value.startsWith('var(')) value = token(value.slice(4, -1));
  assert.match(value || '', /^#[0-9a-f]{6}$/i, `${name} resolves to a hex colour`);
  return value;
}

describe('default palette', () => {
  const pairs = [
    ['--ds-text', '--ds-surface'], ['--ds-text', '--ds-backdrop'], ['--ds-text', '--ds-surface-highest'],
    ['--ds-text-2', '--ds-surface'], ['--ds-text-2', '--ds-backdrop'], ['--ds-text-2', '--ds-surface-low'], ['--ds-text-2', '--ds-surface-high'],
    ['--ds-text-3', '--ds-surface'],
    ['--ds-on-primary', '--ds-primary'], ['--ds-link', '--ds-surface'], ['--ds-action-ink', '--ds-surface'], ['--ds-action-ink', '--ds-backdrop'],
    ['--ds-on-accent', '--ds-accent'],
    ['--ds-on-error-container', '--ds-error-container'], ['--ds-on-success-container', '--ds-success-container'],
    ['--ds-on-warning-container', '--ds-warning-container'], ['--ds-text', '--ds-warning-surface'],
    ['--ds-on-inverse', '--ds-inverse'], ['--ds-on-error-container', '--ds-surface'],
  ];
  for (const [fg, bg] of pairs) {
    it(`${fg} on ${bg} passes AA for text (4.5:1)`, () => {
      const ratio = contrast(colour(fg), colour(bg));
      assert.ok(ratio >= 4.5, `${ratio.toFixed(2)}:1`);
    });
  }

  it('keeps icons and outlines at 3:1 where they carry meaning', () => {
    for (const [fg, bg] of [['--ds-error', '--ds-surface'], ['--ds-success', '--ds-surface'], ['--ds-warning', '--ds-surface'], ['--ds-outline', '--ds-surface'], ['--ds-inverse-primary', '--ds-inverse'], ['--ds-focus', '--ds-surface']]) {
      assert.ok(contrast(colour(fg), colour(bg)) >= 3, `${fg} on ${bg}`);
    }
  });
});
