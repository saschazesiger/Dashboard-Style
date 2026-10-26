/**
 * The token contract: themes that never touch motion, durations that follow
 * the --ds-time-scale multiplier, sampled curves that equal their generator,
 * JS constants that mirror CSS tokens, a default palette that passes WCAG
 * AA, and a theme template that lists every role.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { COUNT_UP_MS, LOADER_DELAY_MS, LOADER_MIN_VISIBLE_MS, MOTION_FALLBACKS } from '../src/js/motion.js';
import { DISMISS_DELAY_MS, TOOLTIP_DELAY_MS, TOOLTIP_HIDE_MS, TOOLTIP_SKIP_MS } from '../src/js/overlay.js';
import {
  emphasizedCurve, generate, LOADER_SHAPES, LOADER_VERTICES, loaderPolygons, problems, SPATIAL, springCurve, springFunction, TOLERANCE, WAVE,
} from '../scripts/motion-curves.mjs';
import {
  CONTROL_PAIRS, contrast as ratioOf, formatColour, ICON_PAIRS, MOTION, pairResults, parseColour, resolveColour, TEXT_PAIRS,
} from '../scripts/tools/theme-rules.mjs';
import { packageInfo, SHIPPED_THEMES, tokensJson } from '../scripts/build.mjs';
import { atRuleBlocks, filesIn, ms, read, stripComments, token, withoutAtRuleBlocks } from './helpers.js';

const tokens = stripComments(read('src/tokens.css'));
// MOTION (motion tokens and per-element motion hooks: no theme sets one, no role matches), the pair lists and the
// contrast function live in scripts/tools/theme-rules.mjs, shared with tools/check-theme.mjs.
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
    // The dismiss guard (2.0): shorter than the dialog's entrance, so a click on a backdrop that has
    // fully faded in always closes, and in the time-scale form (the styleguide's slow motion stretches it).
    assert.equal(ms('--ds-delay-dismiss'), DISMISS_DELAY_MS);
    assert.ok(ms('--ds-delay-dismiss') < ms('--ds-dur-slow'), '--ds-delay-dismiss is shorter than --ds-dur-slow');
    assert.equal(token('--ds-delay-dismiss'), 'calc(300ms * var(--ds-time-scale, 1))');
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

  it('orders the layers: raised < pinned < sticky < sticky-pinned < popover (2.0)', () => {
    const { scales } = layers();
    for (const name of ['--ds-z-pinned', '--ds-z-sticky-pinned']) assert.ok(scales.includes(name), `${name} is a scale`);
    assert.equal(token('--ds-z-pinned'), 'calc(var(--ds-z-raised) + 1)');
    assert.equal(token('--ds-z-sticky-pinned'), 'calc(var(--ds-z-sticky) + 1)');
    const value = (name) => {
      const text = token(name);
      const step = /^calc\(var\((--ds-z-[\w-]+)\) \+ (\d+)\)$/.exec(text);
      return step ? value(step[1]) + Number(step[2]) : Number(text);
    };
    const order = ['--ds-z-raised', '--ds-z-pinned', '--ds-z-sticky', '--ds-z-sticky-pinned', '--ds-z-popover'].map(value);
    assert.deepEqual([...order].sort((a, b) => a - b), order);
    assert.equal(new Set(order).size, order.length, order.join());
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
    for (const name of ['--ds-progress-wave-length', '--ds-progress-wave', '--ds-progress-ring-wave']) assert.ok(scales.includes(name), `${name} is a scale`);
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

/** The contrast of two #rrggbb colours (the shared WCAG function). */
const contrast = (a, b) => ratioOf(parseColour(a), parseColour(b));

/** A role's value, following var() references to a #rrggbb literal. */
function colour(name) {
  let value = token(name);
  while (value && value.startsWith('var(')) value = token(value.slice(4, -1));
  assert.match(value || '', /^#[0-9a-f]{6}$/i, `${name} resolves to a hex colour`);
  return value;
}

/** The chart marks (series, neutral, tones) and the grounds they sit on: 3:1 each (WCAG 1.4.11). */
const CHART_MARKS = ['--ds-chart-1', '--ds-chart-2', '--ds-chart-3', '--ds-chart-4', '--ds-chart-neutral', '--ds-chart-warning', '--ds-chart-error'];
const CHART_GROUNDS = ['--ds-surface', '--ds-surface-low', '--ds-chart-track'];

describe('default palette', () => {
  const pairs = TEXT_PAIRS;
  for (const [fg, bg] of pairs) {
    it(`${fg} on ${bg} passes AA for text (4.5:1)`, () => {
      const ratio = contrast(colour(fg), colour(bg));
      assert.ok(ratio >= 4.5, `${ratio.toFixed(2)}:1`);
    });
  }

  it('draws checkboxes and radios at 3:1 (WCAG 1.4.11): box, fill, mark, error', () => {
    for (const [fg, bg] of CONTROL_PAIRS) {
      const ratio = contrast(colour(fg), colour(bg));
      assert.ok(ratio >= 3, `${fg} on ${bg}: ${ratio.toFixed(2)}:1`);
    }
  });

  it('keeps icons and outlines at 3:1 where they carry meaning', () => {
    for (const [fg, bg] of ICON_PAIRS) {
      assert.ok(contrast(colour(fg), colour(bg)) >= 3, `${fg} on ${bg}`);
    }
  });

  it('draws every chart series, the neutral and the tones at 3:1 on the surfaces and the track (2.0); four distinct series', () => {
    for (const fg of CHART_MARKS) {
      for (const bg of CHART_GROUNDS) {
        const ratio = contrast(colour(fg), colour(bg));
        assert.ok(ratio >= 3, `${fg} on ${bg}: ${ratio.toFixed(2)}:1`);
      }
    }
    const series = CHART_MARKS.slice(0, 4).map((name) => colour(name).toLowerCase());
    assert.equal(new Set(series).size, 4, series.join(' '));
    assert.equal(token('--ds-chart-1'), 'var(--ds-primary)');
    assert.equal(token('--ds-chart-track'), 'var(--ds-surface-high)');
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

  it('keeps the chart marks at 3:1 on the surfaces and the track, four distinct series', () => {
    const failing = CHART_MARKS.flatMap((fg) => CHART_GROUNDS.map((bg) => [fg, bg, contrast(resolve(fg), resolve(bg))]))
      .filter(([, , ratio]) => ratio < 3)
      .map(([fg, bg, ratio]) => `${fg} on ${bg}: ${ratio.toFixed(2)}:1`);
    assert.deepEqual(failing, []);
    assert.equal(new Set(CHART_MARKS.slice(0, 4).map((name) => resolve(name).toLowerCase())).size, 4);
  });
});

describe('derived roles (2.0)', () => {
  /** A role's colour on .ds-theme, `lookup` giving the raw value each name holds (default: tokens.css alone). */
  const resolved = (name, lookup = token) => formatColour(resolveColour(`var(${name})`, lookup));

  it('derives the reference colours from their source, at the values of 1.x', () => {
    const derived = {
      '--ds-link-underline': ['color-mix(in srgb, var(--ds-link) 40%, transparent)', 'rgba(11, 87, 208, .4)'],
      '--ds-fill-round': ['color-mix(in srgb, var(--ds-text) 8%, transparent)', 'rgba(31, 31, 31, .08)'],
      '--ds-disabled-fill': ['color-mix(in srgb, var(--ds-text) 12%, transparent)', 'rgba(31, 31, 31, .12)'],
      '--ds-disabled-ink': ['color-mix(in srgb, var(--ds-text) 38%, transparent)', 'rgba(31, 31, 31, .38)'],
      '--ds-primary-hover': ['color-mix(in srgb, var(--ds-primary), var(--ds-on-primary) 8%)', '#1f64d4'],
      '--ds-primary-pressed': ['color-mix(in srgb, var(--ds-primary), #000 15%)', '#094ab1'],
    };
    for (const [name, [value, before]] of Object.entries(derived)) {
      assert.equal(token(name), value, `${name} is derived`);
      assert.equal(resolved(name), before, `${name} keeps its 1.x value`);
    }
  });

  it('follows a theme that sets the source on .ds-theme, and keeps a value the theme sets itself', () => {
    const theme = { '--ds-primary': '#006a6a', '--ds-text': '#191c1c', '--ds-link-underline': '#ff0000' };
    const lookup = (name) => theme[name] ?? token(name);
    assert.equal(resolved('--ds-primary-hover', lookup), '#147676');
    assert.equal(resolved('--ds-primary-pressed', lookup), '#005a5a');
    assert.equal(resolved('--ds-fill-round', lookup), 'rgba(25, 28, 28, .08)');
    assert.equal(resolved('--ds-disabled-ink', lookup), 'rgba(25, 28, 28, .38)');
    assert.equal(resolved('--ds-link-underline', lookup), '#ff0000');
  });

  it('resolves color-mix() as CSS Color 5 does (shares, alpha, premultiplied)', () => {
    const none = () => undefined;
    assert.equal(formatColour(resolveColour('color-mix(in srgb, #000, #fff)', none)), '#808080');
    assert.equal(formatColour(resolveColour('color-mix(in srgb, #ff0000 25%, #0000ff)', none)), '#4000bf');
    assert.equal(formatColour(resolveColour('color-mix(in srgb, #ff0000 20%, #0000ff 20%)', none)), 'rgba(128, 0, 128, .4)');
    assert.equal(formatColour(resolveColour('color-mix(in srgb, rgba(255, 0, 0, .5), transparent)', none)), 'rgba(255, 0, 0, .25)');
    assert.equal(resolveColour('color-mix(in oklab, #000, #fff)', none), null, 'other spaces are not checked');
    assert.equal(resolveColour('var(--ds-missing)', none), null);
    assert.equal(formatColour(resolveColour('var(--ds-missing, #123456)', none)), '#123456');
  });

  it('adds the floating surfaces and the colour scheme as roles, and sets color-scheme from it', () => {
    const { roles } = layers();
    for (const name of ['--ds-surface-overlay', '--ds-surface-popover', '--ds-color-scheme']) assert.ok(roles.includes(name), `${name} is a role`);
    assert.equal(token('--ds-surface-overlay'), 'var(--ds-surface)');
    assert.equal(token('--ds-surface-popover'), 'var(--ds-surface)');
    assert.equal(token('--ds-color-scheme'), 'light');
    // The one declaration of tokens.css that is not a custom property (or an @property descriptor), at zero
    // specificity, so a page or component that sets color-scheme itself wins.
    const plain = [...tokens.matchAll(/([^{};]+)\{([^{}]*)\}/g)]
      .filter((match) => !/@property/.test(match[1]))
      .flatMap((match) => [...match[2].matchAll(/(?:^|;)\s*([a-z][\w-]*)\s*:/g)].map((d) => `${match[1].trim()} ${d[1]}`));
    assert.deepEqual(plain, [':where(.ds-theme) color-scheme']);
    assert.match(tokens, /:where\(\.ds-theme\)\s*\{\s*color-scheme:\s*var\(--ds-color-scheme\);\s*\}/);
  });

  it('paints the floating layers on the floating surfaces', () => {
    const background = (file, selector) => {
      const css = stripComments(read(file));
      const rule = new RegExp(`(?:^|[{};])\\s*${selector.replace(/\./g, '\\.')}\\s*\\{([^}]*)\\}`).exec(css);
      assert.ok(rule, `${file}: ${selector}`);
      return /(?:^|;)\s*background:\s*([^;]+);/.exec(rule[1])?.[1].trim();
    };
    assert.equal(background('src/components/dialog.css', '.ds-dialog__box'), 'var(--ds-surface-overlay)');
    assert.equal(background('src/components/sheet.css', '.ds-sheet__panel'), 'var(--ds-surface-overlay)');
    assert.equal(background('src/components/menu.css', '.ds-menu'), 'var(--ds-surface-popover)');
    assert.equal(background('src/components/combobox.css', '.ds-combo__popup'), 'var(--ds-surface-popover)');
    assert.equal(background('src/components/shell.css', '.ds-skip'), 'var(--ds-surface-popover)');
  });
});

describe('shipped themes (themes/dark.css, compact.css, contrast.css)', () => {
  const known = new Map(JSON.parse(tokensJson(packageInfo())).tokens.map((entry) => [entry.name, entry]));
  /** Hooks a shipped theme sets before the package that adds them merged (2.0 fan-out); the sweep empties it. */
  const ADDED_BY_LATER_MERGES = new Map([
    ['--ds-table-head-height', 'TB-6 (WP5)'],
    ['--ds-table-row-height', 'TB-6 (WP5)'],
  ]);
  /** The declarations of a theme on .ds-theme outside @media (what applies without a condition). */
  const declared = (file) => {
    const css = withoutAtRuleBlocks(read(file), /^@media\b/);
    return Object.fromEntries([...css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));
  };
  /** The value of a name with `files` loaded after ds.css, in this order. */
  const stack = (...files) => {
    const layers = files.map(declared);
    return (name) => {
      for (const layer of [...layers].reverse()) if (name in layer) return layer[name];
      return token(name);
    };
  };
  const failing = (lookup) => pairResults(lookup)
    .filter((pair) => pair.ratio === null || pair.ratio < pair.min)
    .map((pair) => `${pair.fg} on ${pair.bg}: ${pair.ratio === null ? 'not resolved' : `${pair.ratio.toFixed(2)}:1 (needs ${pair.min}:1)`}`);

  for (const files of [['themes/dark.css'], ['themes/contrast.css'], ['themes/compact.css'], ['themes/dark.css', 'themes/contrast.css'], ['themes/example.css', 'themes/contrast.css']]) {
    it(`keeps every text pair at 4.5:1 and every control, icon, outline and chart pair at 3:1: ${files.join(' + ')}`, () => {
      assert.deepEqual(failing(stack(...files)), []);
    });
  }

  it('sets only known roles and hooks, never a scale, a motion token or a removed name', () => {
    for (const name of SHIPPED_THEMES) {
      const file = `themes/${name}.css`;
      const css = stripComments(read(file));
      assert.doesNotMatch(css, MOTION, `${file}: no motion token or hook`);
      assert.doesNotMatch(css, /@layer|!important|:root/, `${file}: unlayered, on .ds-theme, no !important`);
      for (const match of css.matchAll(/(--ds-[\w-]+)\s*:/g)) {
        const entry = known.get(match[1]);
        if (ADDED_BY_LATER_MERGES.has(match[1]) && entry?.layer !== 'hook') continue;
        assert.ok(entry, `${file}: ${match[1]} is a token of the system`);
        assert.ok(entry.themeable, `${file}: ${match[1]} is a role or a hook (${entry.layer})`);
      }
    }
  });

  it('gives the dark theme every colour role that does not follow another role, the floating surfaces and the scheme', () => {
    const dark = declared('themes/dark.css');
    const { roles } = layers();
    // Literal colours of tokens.css; derived mixes and var() roles follow by themselves.
    const literal = roles.filter((name) => parseColour(token(name)));
    assert.ok(literal.includes('--ds-surface') && literal.includes('--ds-scrim'), 'the walk finds the literal colours');
    assert.deepEqual(literal.filter((name) => !(name in dark)), []);
    assert.equal(dark['--ds-color-scheme'], 'dark');
    for (const name of ['--ds-surface-overlay', '--ds-surface-popover', '--ds-elev-1', '--ds-elev-2', '--ds-elev-3']) assert.ok(name in dark, name);
    // Shadows on black: a grey shadow on a dark surface would glow.
    for (const name of ['--ds-elev-1', '--ds-elev-2', '--ds-elev-3']) assert.doesNotMatch(dark[name], /rgba\((?!0, 0, 0,)/, name);
  });

  it('keeps the contrast theme palette-neutral: roles only, mixed from the theme in use', () => {
    const contrast = declared('themes/contrast.css');
    assert.equal(contrast['--ds-text-2'], 'var(--ds-text)');
    assert.equal(contrast['--ds-line'], 'var(--ds-outline)');
    assert.equal(contrast['--ds-focus-width'], '3px');
    assert.equal(contrast['--ds-link-underline'], 'currentColor');
    for (const [name, value] of Object.entries(contrast)) {
      assert.equal(known.get(name)?.layer, 'role', `${name} is a role`);
      assert.doesNotMatch(value, /#[0-9a-f]{3,8}\b(?![^(]*\))|rgba?\(/i, `${name}: no literal colour (it would break the dark theme)`);
    }
  });

  it('gives the compact theme the default heights back under a coarse pointer, and leaves field text alone', () => {
    const css = read('themes/compact.css');
    const compact = declared('themes/compact.css');
    const coarse = atRuleBlocks(css, /^@media \(pointer: coarse\)$/);
    assert.equal(coarse.length, 1, 'one @media (pointer: coarse) block');
    const back = Object.fromEntries([...coarse[0].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));
    const heights = Object.keys(compact).filter((name) => /-height$/.test(name));
    assert.ok(heights.length >= 8, `${heights.length} heights`);
    assert.deepEqual(Object.keys(back).sort(), heights.sort(), 'every compact height comes back');
    for (const name of heights) {
      assert.ok(parseFloat(compact[name]) < parseFloat(back[name]), `${name}: compact is shorter`);
      const fallback = known.get(name)?.default;
      if (fallback) assert.equal(back[name], fallback, `${name}: the default height on a touch screen`);
    }
    for (const name of Object.keys(compact).filter((n) => n.startsWith('--ds-font-'))) assert.match(compact[name], / 13px\/18px /, name);
    assert.ok(!('--ds-font-input' in compact) && !('--ds-font-reading' in compact), 'phones keep the 16px field text');
    // A theme root with .ds-touch keeps its touch targets: an unlayered theme on that element would beat it.
    for (const match of stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/--[\w-]+-height\s*:/.test(match[2])) assert.equal(match[1].trim(), '.ds-theme:not(.ds-touch)', 'the heights skip a .ds-touch theme root');
    }
  });
});
