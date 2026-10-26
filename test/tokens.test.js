/**
 * The token contract: themes that never touch motion, durations that follow
 * the --ds-time-scale multiplier, sampled curves that equal their generator,
 * JS constants that mirror CSS tokens, a default palette that passes WCAG
 * AA, and a theme template that lists every role.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { COUNT_UP_MS, LOADER_DELAY_MS, LOADER_MIN_VISIBLE_MS, MOTION_FALLBACKS } from '../src/js/motion.js';
import { TOOLTIP_DELAY_MS, TOOLTIP_HIDE_MS, TOOLTIP_SKIP_MS } from '../src/js/overlay.js';
import {
  emphasizedCurve, generate, LOADER_SHAPES, LOADER_VERTICES, loaderPolygons, problems, SPATIAL, springCurve, springFunction, TOLERANCE, WAVE,
} from '../scripts/motion-curves.mjs';
import { filesIn, ms, read, stripComments, token } from './helpers.js';

const tokens = stripComments(read('src/tokens.css'));
/** Motion tokens and per-element motion hooks: no theme sets one, no role matches. */
const MOTION = /--ds-(dur|ease|distance|loop|stagger|delay|hold|scale|time-scale|motion|enter|leave|clip-from|draw-length|scan|indicator-lag|indicator-dur)[\w-]*\s*:/;
/** Duration-like scales: written as calc(<n>ms * var(--ds-time-scale, 1)). */
const TIMED = /^--ds-(dur-[\w-]+|loop-[\w-]+|delay-[\w-]+|hold-[\w-]+|stagger)$/;

/** The linear() value of a token inside the @supports (linear()) block. */
function sampled(name) {
  const match = tokens.match(new RegExp(`${name}:\\s*(linear\\([^;]*\\));`));
  assert.ok(match, `${name} has a linear() value`);
  return match[1];
}

/** linear() stops as [{ value, at }] (at in [0, 1]; first and last implicit). */
function stops(linear) {
  const parts = linear.slice('linear('.length, -1).split(',').map((part) => part.trim().split(/\s+/));
  return parts.map(([value, at], index) => ({
    value: Number(value),
    at: at ? Number(at.replace('%', '')) / 100 : index === 0 ? 0 : 1,
  }));
}

/** Names declared in the main .ds-theme rule, split at the palette marker. */
function layers() {
  const source = read('src/tokens.css');
  // The rule ends at its matching brace (the file is indented inside @layer).
  const start = source.indexOf('.ds-theme {');
  let depth = 0;
  let end = start;
  do {
    if (source[end] === '{') depth += 1;
    else if (source[end] === '}') depth -= 1;
    end += 1;
  } while (depth > 0 || end <= source.indexOf('{', start));
  const main = source.slice(start, end);
  const marker = main.indexOf('── 2. Palette');
  const names = (text) => [...stripComments(text).matchAll(/(--ds-[\w-]+)\s*:/g)].map((match) => match[1]);
  return { scales: names(main.slice(0, marker)), roles: names(main.slice(marker)) };
}

describe('tokens', () => {
  it('writes every duration-like scale in the --ds-time-scale form', () => {
    const timed = layers().scales.filter((name) => TIMED.test(name));
    for (const name of ['--ds-dur-micro', '--ds-dur-long', '--ds-stagger', '--ds-delay-loader', '--ds-delay-boot', '--ds-hold-loader', '--ds-loop-spin']) {
      assert.ok(timed.includes(name), name);
    }
    for (const name of timed) assert.match(token(name), /^calc\(\d*\.?\d+m?s \* var\(--ds-time-scale, 1\)\)$/, name);
    assert.deepEqual(['micro', 'instant', 'fast', 'base', 'medium', 'slow', 'long', 'glide'].map((step) => ms(`--ds-dur-${step}`)), [50, 100, 150, 200, 250, 350, 450, 600]);
  });

  it('registers --ds-time-scale and declares it nowhere (styleguide and tests only)', () => {
    assert.match(tokens, /@property --ds-time-scale \{\s*syntax: '<number>';\s*inherits: true;\s*initial-value: 1;\s*\}/);
    const declared = [...filesIn('src', (path) => path.endsWith('.css')), ...filesIn('themes', (path) => path.endsWith('.css'))]
      .filter((file) => /--ds-time-scale\s*:/.test(stripComments(read(file))));
    assert.deepEqual(declared, []);
  });

  it('samples the spring and the emphasized path with scripts/motion-curves.mjs', () => {
    assert.equal(token('--ds-ease-spatial'), 'var(--ds-ease-out)', 'the cubic fallback of the spring');
    assert.equal(sampled('--ds-ease-spatial'), springCurve(SPATIAL));
    assert.equal(sampled('--ds-ease-emphasized'), emphasizedCurve());
    const spring = springFunction(SPATIAL);
    for (const stop of stops(sampled('--ds-ease-spatial'))) {
      assert.ok(Math.abs(stop.value - spring(stop.at)) <= TOLERANCE, `stop ${stop.value} at ${stop.at}`);
    }
  });

  it('gives the spring its contract: overshoot of 2-5%, then it settles', () => {
    const curve = stops(sampled('--ds-ease-spatial'));
    const peak = Math.max(...curve.map((stop) => stop.value));
    assert.ok(curve.every((stop) => stop.value >= 0));
    assert.ok(peak >= 1.02 && peak <= 1.05, `peak ${peak}`);
    assert.equal(curve.at(-1).value, 1);
    const after = curve.slice(curve.findIndex((stop) => stop.value === peak));
    assert.ok(after.every((stop) => stop.value >= 0.998 && stop.value <= peak), 'settles after the peak');
  });

  it('keeps motion tokens out of themes', () => {
    for (const theme of filesIn('themes', (path) => path.endsWith('.css'))) {
      assert.equal(MOTION.test(stripComments(read(theme))), false, theme);
    }
  });

  it('names every motion family it keeps out of themes in the rule lists', () => {
    // The lists a theme author or a project reads: the rule and the copied block of AGENTS.md, rule 2 of
    // theming.md and the header of the example theme.
    const families = /\(([^)]*)\)/.exec(MOTION.source)[1].split('|');
    const lists = {
      'AGENTS.md (rule)': /Themes never set motion tokens or\s+motion hooks \(([^)]*)\)/.exec(read('AGENTS.md'))?.[1],
      'AGENTS.md (project block)': /Never set motion tokens or hooks \(([^)]*)\)/.exec(read('AGENTS.md'))?.[1],
      'docs/theming.md (rule 2)': /\*\*Never set motion tokens\*\*([\s\S]*?)Motion is one/.exec(read('docs/theming.md'))?.[1],
      'themes/example.css': /Never set motion tokens([\s\S]*?)motion is one scheme/.exec(read('themes/example.css'))?.[1],
    };
    for (const [where, list] of Object.entries(lists)) {
      assert.ok(list, `${where}: the list is found`);
      const names = list.replace(/\n\s*\*\s*/g, ' ');
      for (const family of families) {
        assert.ok(names.includes(`--ds-${family}-*`) || new RegExp(`--ds-${family}(?![\\w-])`).test(names), `${where} names --ds-${family}`);
      }
    }
  });

  it('keeps JS constants in step with the tokens they mirror', () => {
    assert.equal(ms('--ds-delay-loader'), LOADER_DELAY_MS);
    assert.equal(ms('--ds-dur-glide'), COUNT_UP_MS);
    assert.equal(ms('--ds-hold-loader'), LOADER_MIN_VISIBLE_MS);
    assert.equal(ms('--ds-delay-tooltip'), TOOLTIP_DELAY_MS);
    assert.equal(ms('--ds-delay-tooltip-skip'), TOOLTIP_SKIP_MS);
    assert.equal(ms('--ds-delay-tooltip-hide'), TOOLTIP_HIDE_MS);
    // The indicator takes its timing from the tokens alone (travelDuration,
    // running transitions): no clock, no timer, no literal of two digits or more.
    const indicator = stripComments(read('src/js/indicator.js'));
    assert.doesNotMatch(indicator, /Date\.now|setTimeout/);
    assert.doesNotMatch(indicator, /(?<![\w.])\d{2,}/);
  });

  it('keeps every MOTION_FALLBACKS entry equal to its token in tokens.css', () => {
    /** A token's value with var() references followed (the cubic fallback of a sampled curve). */
    const resolved = (name) => {
      let value = token(name);
      while (value && /^var\(--ds-[\w-]+\)$/.test(value)) value = token(value.slice(4, -1));
      return value;
    };
    const normal = (text) => String(text).replace(/\s+/g, '');
    const names = Object.keys(MOTION_FALLBACKS);
    // Every duration, delay and hold scale and every easing role has its fallback.
    const scales = layers().scales.filter((name) => /^--ds-(dur|delay|hold)-/.test(name));
    const easings = [...tokens.matchAll(/(--ds-ease[\w-]*)\s*:/g)].map((match) => match[1]);
    assert.deepEqual([...new Set([...scales, ...easings])].filter((name) => !names.includes(name)), []);
    for (const [name, fallback] of Object.entries(MOTION_FALLBACKS)) {
      if (typeof fallback === 'number') assert.equal(ms(name), fallback, name);
      else {
        assert.match(resolved(name), /^cubic-bezier\(/, `${name}: the main value is a cubic`);
        assert.equal(normal(resolved(name)), normal(fallback), name);
      }
    }
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

  it('adds --ds-hold-status (2.0) as a motion scale before the palette', () => {
    const { scales } = layers();
    assert.ok(scales.includes('--ds-hold-status'), '--ds-hold-status is a scale');
    assert.equal(ms('--ds-hold-status'), 900);
    assert.match(token('--ds-hold-status'), /^calc\(900ms \* var\(--ds-time-scale, 1\)\)$/);
    assert.ok(MOTION.test('--ds-hold-status:'), 'a motion token: themes never set it');
  });

  it('adds the control scales and roles of 1.1.0 to their layers', () => {
    const { scales, roles } = layers();
    for (const name of ['--ds-state-focus', '--ds-hold-success']) assert.ok(scales.includes(name), `${name} is a scale`);
    assert.equal(token('--ds-state-focus'), '.10');
    assert.equal(ms('--ds-hold-success'), 600);
    assert.match(token('--ds-hold-success'), /^calc\(600ms \* var\(--ds-time-scale, 1\)\)$/);
    assert.ok(MOTION.test('--ds-hold-success:'), 'a motion token: themes never set it');
    const example = stripComments(read('themes/example.css'));
    for (const name of ['--ds-radius-check', '--ds-radius-action-pressed', '--ds-radius-card-pressed']) {
      assert.ok(roles.includes(name), `${name} is a role`);
      assert.match(example, new RegExp(`${name}\\s*:`), `${name} in themes/example.css`);
    }
    assert.equal(token('--ds-radius-action-pressed'), '12px');
    assert.equal(token('--ds-radius-card-pressed'), 'var(--ds-radius-sm)');
    assert.equal(token('--ds-radius-check'), '2px');
  });

  it('adds the loop scales and the skeleton role of 1.4.0 to their layers', () => {
    const { scales, roles } = layers();
    const loops = { '--ds-loop-spin': 1568, '--ds-loop-arc': 4 * 1333, '--ds-loop-indeterminate': 1800, '--ds-loop-loader': 7 * 650, '--ds-loop-skeleton': 2000, '--ds-loop-wave': 1200 };
    for (const [name, value] of Object.entries(loops)) {
      assert.ok(scales.includes(name), `${name} is a scale`);
      assert.equal(ms(name), value, name);
    }
    for (const name of ['--ds-state-pulse', '--ds-progress-wave-length', '--ds-progress-wave', '--ds-progress-ring-wave']) assert.ok(scales.includes(name), `${name} is a scale`);
    assert.equal(token('--ds-state-pulse'), '.45');
    assert.equal(token('--ds-progress-wave-length'), `${WAVE.length}px`);
    for (const name of ['--ds-progress-wave', '--ds-progress-ring-wave']) assert.match(token(name), /^url\("data:image\/svg\+xml,%3Csvg [^"#]*%3C\/svg%3E"\)$/, name);
    assert.ok(roles.includes('--ds-skeleton-highlight'), '--ds-skeleton-highlight is a role');
    assert.equal(token('--ds-skeleton-highlight'), 'var(--ds-surface-high)');
    assert.match(stripComments(read('themes/example.css')), /--ds-skeleton-highlight\s*:/);
  });

  it('generates the loop keyframes and the progress masks with scripts/motion-curves.mjs, within their contract', () => {
    const next = generate();
    for (const [path, content] of Object.entries(next)) assert.equal(read(path), content, `${path}: run node scripts/motion-curves.mjs`);
    assert.deepEqual(problems(), []);
    // The seven M3 shapes in the order of the loading indicator, 64 vertices each.
    assert.deepEqual(Object.keys(LOADER_SHAPES), ['soft burst', 'cookie-9', 'pentagon', 'pill', 'sunny', 'cookie-4', 'oval']);
    for (const points of Object.values(loaderPolygons())) {
      assert.equal(points.length, LOADER_VERTICES);
      assert.ok(Math.abs(points[0][0] - 50) <= 0.01 && points[0][1] < 50, 'the first vertex straight above the centre');
      assert.ok(points[1][0] > points[0][0], 'then clockwise');
    }
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

/** The text pairs that pass AA (4.5:1), in the default palette and in the theme template. */
const TEXT_PAIRS = [
  ['--ds-text', '--ds-surface'],
  ['--ds-text', '--ds-backdrop'],
  ['--ds-text', '--ds-surface-highest'],
  ['--ds-text-2', '--ds-surface'],
  ['--ds-text-2', '--ds-backdrop'],
  ['--ds-text-2', '--ds-surface-low'],
  ['--ds-text-2', '--ds-surface-high'],
  ['--ds-text-3', '--ds-surface'],
  ['--ds-on-primary', '--ds-primary'],
  ['--ds-link', '--ds-surface'],
  ['--ds-action-ink', '--ds-surface'],
  ['--ds-action-ink', '--ds-backdrop'],
  ['--ds-on-accent', '--ds-accent'],
  // A selected table row (--ds-table-row-selected, default --ds-accent) keeps its text readable.
  ['--ds-text', '--ds-accent'],
  ['--ds-text-2', '--ds-accent'],
  ['--ds-on-error-container', '--ds-error-container'],
  ['--ds-on-success-container', '--ds-success-container'],
  ['--ds-on-warning-container', '--ds-warning-container'],
  ['--ds-text', '--ds-warning-surface'],
  ['--ds-on-inverse', '--ds-inverse'],
  ['--ds-on-error-container', '--ds-surface'],
  // A field label tints with the ring, or takes the error ink: on every surface a field sits on.
  ['--ds-primary', '--ds-surface'],
  ['--ds-primary', '--ds-surface-low'],
  ['--ds-on-error-container', '--ds-surface-low'],
];

describe('default palette', () => {
  const pairs = TEXT_PAIRS;
  for (const [fg, bg] of pairs) {
    it(`${fg} on ${bg} passes AA for text (4.5:1)`, () => {
      const ratio = contrast(colour(fg), colour(bg));
      assert.ok(ratio >= 4.5, `${ratio.toFixed(2)}:1`);
    });
  }

  it('draws checkboxes and radios at 3:1 (WCAG 1.4.11): box, fill, mark, error', () => {
    for (const [fg, bg] of [['--ds-text-2', '--ds-surface'], ['--ds-primary', '--ds-surface'], ['--ds-error', '--ds-surface'],
      ['--ds-on-primary', '--ds-primary'], ['--ds-surface', '--ds-error']]) {
      const ratio = contrast(colour(fg), colour(bg));
      assert.ok(ratio >= 3, `${fg} on ${bg}: ${ratio.toFixed(2)}:1`);
    }
  });

  it('keeps icons and outlines at 3:1 where they carry meaning', () => {
    for (const [fg, bg] of [['--ds-error', '--ds-surface'], ['--ds-success', '--ds-surface'], ['--ds-warning', '--ds-surface'], ['--ds-outline', '--ds-surface'], ['--ds-inverse-primary', '--ds-inverse'], ['--ds-focus', '--ds-surface']]) {
      assert.ok(contrast(colour(fg), colour(bg)) >= 3, `${fg} on ${bg}`);
    }
  });
});

describe('theme template (themes/example.css)', () => {
  // Projects copy the template as their palette: it keeps the rule it states
  // ("Keep text roles at 4.5:1"). Roles it leaves unset take the default.
  const template = stripComments(read('themes/example.css'));
  const set = (name) => new RegExp(`(?<![\\w-])${name}\\s*:\\s*([^;]+);`).exec(template)?.[1].trim();
  const resolve = (name) => {
    let value = set(name) ?? token(name);
    while (value && value.startsWith('var(')) {
      const ref = value.slice(4, -1).split(',')[0].trim();
      value = set(ref) ?? token(ref);
    }
    assert.match(value || '', /^#[0-9a-f]{6}$/i, `${name} resolves to a hex colour`);
    return value;
  };
  it('keeps every text pair of the default palette at 4.5:1', () => {
    const failing = TEXT_PAIRS.map(([fg, bg]) => [fg, bg, contrast(resolve(fg), resolve(bg))])
      .filter(([, , ratio]) => ratio < 4.5)
      .map(([fg, bg, ratio]) => `${fg} on ${bg}: ${ratio.toFixed(2)}:1`);
    assert.deepEqual(failing, []);
  });
});
