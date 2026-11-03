#!/usr/bin/env node
/**
 * The theme generator: one seed colour in, one theme file out, with every
 * colour role of the system in the light and the dark scheme, checked
 * against the contrast pairs of theme-rules.mjs (docs/theme-generator.md).
 *
 *   node tools/theme.mjs --seed '#0b57d0' [--scheme tonal|vibrant|neutral|fidelity|monochrome]
 *        [--contrast standard|medium|high] [--neutral <c>] [--accent <c>] [--error <c>]
 *        [--success <c>] [--warning <c>] [--name <name>] [--out <file>]
 *   node tools/theme.mjs --presets [--check] [--out <dir>]
 *
 * Colours are #rgb, #rrggbb, rgb() or oklch(). Without --out the theme goes
 * to stdout. The CLI checks what it writes with check-theme.mjs, once per
 * scheme, and exits 1 when a finding remains (it never should: the
 * generator moves tones until every pair passes). --presets writes the
 * shipped presets (PRESETS) to themes/presets/ (or --out), --check only
 * compares them. Exit 2 on a usage error.
 *
 * generateTheme(options) is the same, importable, and free of Node APIs
 * (this file imports node: modules only inside the CLI), so the styleguide
 * runs it in the browser. Plain ES2022; output is deterministic.
 *
 * How a role gets its colour: each role is a tone of one palette (ROLES:
 * the tone for standard and for high contrast, light and dark; medium lies
 * halfway). The palettes come from the seed by the scheme variant
 * (color.mjs, a port of Material Color Utilities), the status palettes
 * from their own seeds. Then, per scheme, every pair of TEXT_PAIRS,
 * CONTROL_PAIRS, ICON_PAIRS and CHART_PAIRS is checked on the final hex
 * values; a pair under its minimum moves its foreground tone away from the
 * ground (the surfaces never move), and when the foreground is already
 * black or white, the ground. The pairs themselves are never changed.
 */
import { Contrast, Hct, TonalPalette, apcaContrast, hexFromArgb, parseColor, sanitizeDegreesDouble, schemePalettes } from './color.mjs';
import { CHART_PAIRS, CONTROL_PAIRS, ICON_PAIRS, TEXT_PAIRS, contrast, parseColour, pickLightDark } from './theme-rules.mjs';

/** The scheme names of the CLI, and the MCU variant each one runs. */
export const SCHEMES = { tonal: 'tonal-spot', vibrant: 'vibrant', neutral: 'neutral', fidelity: 'fidelity', monochrome: 'monochrome' };

/** Contrast levels: the share of the way from the standard tones to the high ones, and the pair minimums. */
export const CONTRAST_LEVELS = {
  standard: { level: 0, text: 4.5, other: 3 },
  medium: { level: 0.5, text: 6, other: 4 },
  high: { level: 1, text: 7, other: 4.5 },
};

/** The status seeds when none is given: today's success and warning inks; error is MCU's error palette (hue 25, chroma 84). */
export const STATUS_DEFAULTS = { success: '#146c2e', warning: '#8f4e06' };

/**
 * The chart series beside --ds-chart-1 (the primary): hue offsets from the
 * primary hue, taken from the default palette (blue primary, orange, teal,
 * purple), at one chroma per scheme. The series keep colour in every scheme,
 * like the status colours: data needs telling apart.
 */
const CHART_OFFSETS = { '--ds-chart-2': 146.5, '--ds-chart-3': -85.7, '--ds-chart-4': 40.8 };
const CHART_CHROMA = { 'tonal-spot': 48, vibrant: 64, neutral: 32, fidelity: null, monochrome: 24 };

/**
 * Roles that tokens.css declares as var() of another role and that a pair
 * reads: they follow by themselves, so the generator checks them through
 * the role they read (a test keeps this list equal to tokens.css).
 */
export const FOLLOWS = {
  '--ds-link': '--ds-primary',
  '--ds-action-ink': '--ds-primary',
  '--ds-focus': '--ds-primary',
  '--ds-chart-1': '--ds-primary',
  '--ds-chart-neutral': '--ds-outline',
  '--ds-chart-warning': '--ds-warning',
  '--ds-chart-error': '--ds-error',
  '--ds-chart-track': '--ds-surface-high',
  '--ds-on-accent-icon': '--ds-on-accent',
};

/**
 * Every colour role the generator sets: [name, palette, light standard,
 * light high, dark standard, dark high, group, ground]. A palette written
 * "a|b" is a in the light scheme, b in the dark one. Grounds (the surfaces
 * and the inverse surface) never move; the tones of the default palette set
 * the standard values, themes/contrast.css the high ones.
 */
const ROLE_TABLE = [
  ['--ds-backdrop', 'neutral', 96, 96, 6, 6, 'surfaces', true],
  ['--ds-surface', 'neutral', 100, 100, 12, 12, 'surfaces', true],
  ['--ds-surface-low', 'neutral', 98, 98, 10, 10, 'surfaces', true],
  ['--ds-surface-high', 'neutral', 94, 94, 17, 17, 'surfaces', true],
  ['--ds-surface-highest', 'neutral', 90, 90, 22, 22, 'surfaces', true],
  ['--ds-surface-overlay', 'neutral', 100, 100, 17, 17, 'surfaces', true],
  ['--ds-surface-popover', 'neutral', 100, 100, 17, 17, 'surfaces', true],
  ['--ds-text', 'neutral', 10, 10, 90, 90, 'text'],
  ['--ds-text-2', 'neutralVariant', 30, 10, 80, 90, 'text'],
  ['--ds-text-3', 'neutralVariant', 50, 25, 60, 80, 'text'],
  ['--ds-line', 'neutralVariant', 90, 25, 30, 80, 'text'],
  ['--ds-line-2', 'neutralVariant', 80, 35, 40, 70, 'text'],
  ['--ds-outline', 'neutralVariant', 50, 25, 60, 80, 'text'],
  ['--ds-primary', 'primary', 40, 40, 80, 80, 'primary'],
  ['--ds-on-primary', 'primary', 100, 100, 20, 20, 'primary'],
  ['--ds-accent', 'accent', 90, 80, 30, 40, 'primary'],
  ['--ds-on-accent', 'accent', 10, 10, 90, 90, 'primary'],
  ['--ds-error', 'error', 40, 40, 80, 80, 'status'],
  ['--ds-error-container', 'errorWash|error', 90, 90, 30, 30, 'status'],
  ['--ds-on-error-container', 'error', 30, 20, 90, 95, 'status'],
  ['--ds-success', 'success', 40, 40, 80, 80, 'status'],
  ['--ds-success-container', 'successWash|success', 90, 90, 30, 30, 'status'],
  ['--ds-on-success-container', 'success', 30, 20, 90, 95, 'status'],
  ['--ds-warning', 'warning', 40, 40, 80, 80, 'status'],
  ['--ds-warning-container', 'warningWash|warning', 90, 90, 30, 30, 'status'],
  ['--ds-on-warning-container', 'warning', 30, 20, 90, 95, 'status'],
  ['--ds-warning-surface', 'warningSurface', 97, 97, 14, 14, 'status'],
  ['--ds-inverse', 'neutral', 20, 20, 90, 90, 'inverse', true],
  ['--ds-on-inverse', 'neutral', 95, 95, 20, 20, 'inverse'],
  ['--ds-inverse-primary', 'primary', 80, 80, 40, 40, 'inverse'],
  ['--ds-chart-2', '--ds-chart-2', 52, 45, 75, 80, 'chart'],
  ['--ds-chart-3', '--ds-chart-3', 50, 45, 78, 80, 'chart'],
  ['--ds-chart-4', '--ds-chart-4', 45, 40, 68, 75, 'chart'],
];

export const ROLES = ROLE_TABLE.map(([name, palette, lightStandard, lightHigh, darkStandard, darkHigh, group, ground = false]) => {
  const [light, dark = light] = palette.split('|');
  return { name, palettes: { light, dark }, tones: { light: [lightStandard, lightHigh], dark: [darkStandard, darkHigh] }, group, ground };
});

/** The values that are not tones: scrims, and the colour of the shadows (on black in the dark scheme). */
const FIXED = [
  ['--ds-scrim', 'rgba(0, 0, 0, .32)', 'rgba(0, 0, 0, .48)'],
  ['--ds-scrim-nested', 'rgba(0, 0, 0, .16)', 'rgba(0, 0, 0, .24)'],
];
const SHADOWS = [
  ['--ds-elev-1', ['0 1px 2px 0', '.3'], ['0 1px 3px 1px', '.15']],
  ['--ds-elev-2', ['0 1px 2px 0', '.3'], ['0 2px 6px 2px', '.15']],
  ['--ds-elev-3', ['0 1px 3px 0', '.3'], ['0 4px 8px 3px', '.15']],
];

const GROUP_TITLES = {
  surfaces: 'Surfaces: tone steps; the floating ones a step above the page in the dark',
  text: 'Text and lines',
  primary: 'Primary and tint',
  status: 'Status: inks on their containers',
  inverse: 'Inverse: snackbars and tooltips',
  chart: 'Chart series (the first is the primary)',
};

/**
 * The shipped presets (themes/presets/<name>.css and <name>-contrast.css).
 * default keeps the 2.x palette: its seed is the --ds-primary of
 * tokens.css (#0b57d0) at its own chroma (fidelity), its neutral the
 * blue-grey of the 2.x surfaces at low chroma.
 */
export const PRESETS = [
  { name: 'default', seed: '#0b57d0', scheme: 'fidelity', neutral: '#74777f', description: 'the 2.x palette: Google console blue on blue-grey surfaces' },
  { name: 'slate', seed: '#475d78', scheme: 'neutral', description: 'quiet blue-grey, almost no colour' },
  { name: 'ocean', seed: '#00658f', scheme: 'fidelity', description: 'deep sea blue' },
  { name: 'forest', seed: '#2f6b3a', scheme: 'fidelity', description: 'muted green' },
  { name: 'violet', seed: '#6750a4', scheme: 'tonal', description: 'soft violet (the Material baseline seed)' },
  { name: 'amber', seed: '#9a5b00', scheme: 'fidelity', description: 'warm amber' },
  { name: 'rose', seed: '#b3264d', scheme: 'fidelity', neutral: '#807475', description: 'deep rose on nearly neutral surfaces' },
  { name: 'graphite', seed: '#3c4043', scheme: 'monochrome', description: 'greys only; status colours and chart series keep their colour' },
];

const asArgb = (value, label) => {
  const argb = typeof value === 'number' ? value >>> 0 : parseColor(value);
  if (argb === null) throw new TypeError(`${label}: not a colour this generator reads (#rgb, #rrggbb, rgb() or oklch()): ${value}`);
  return argb;
};

/** The palettes of a theme: the scheme's six, plus accent, status, the warning surface and the chart series. */
function palettes({ seed, scheme, neutral, accent, error, success, warning }) {
  const source = Hct.fromInt(seed);
  const variant = SCHEMES[scheme];
  const base = schemePalettes(variant, source);
  const fromSeed = (argb) => TonalPalette.fromHct(Hct.fromInt(argb));
  const set = {
    primary: base.primary,
    accent: accent === null ? base.primary : fromSeed(accent),
    neutral: base.neutral,
    neutralVariant: base.neutralVariant,
    error: error === null ? base.error : fromSeed(error),
    success: fromSeed(success),
    warning: fromSeed(warning),
  };
  if (neutral !== null) {
    // A neutral seed sets the hue and chroma of both neutral palettes.
    const hct = Hct.fromInt(neutral);
    set.neutral = TonalPalette.fromHueAndChroma(hct.hue, hct.chroma);
    set.neutralVariant = set.neutral;
  }
  // Quiet washes of the status hues: light containers (a green or yellow seed would glare at tone 90) and the
  // warning surface of full-width banners. Dark containers keep the full chroma, as the 2.x dark theme does.
  for (const status of ['error', 'success', 'warning']) set[`${status}Wash`] = TonalPalette.fromHueAndChroma(set[status].hue, Math.min(set[status].chroma, 24));
  set.warningSurface = TonalPalette.fromHueAndChroma(set.warning.hue, Math.min(set.warning.chroma, 10));
  const chroma = CHART_CHROMA[variant] ?? Math.min(Math.max(source.chroma, 48), 80);
  for (const [name, offset] of Object.entries(CHART_OFFSETS)) {
    set[name] = TonalPalette.fromHueAndChroma(sanitizeDegreesDouble(base.primary.hue + offset), chroma);
  }
  return set;
}

/** Every pair of theme-rules.mjs with its kind and the minimum at this contrast level. */
function pairsAt(levelInfo) {
  const lists = [['text', TEXT_PAIRS, levelInfo.text], ['control', CONTROL_PAIRS, levelInfo.other], ['icon', ICON_PAIRS, levelInfo.other], ['chart', CHART_PAIRS, levelInfo.other]];
  return lists.flatMap(([kind, pairs, min]) => pairs.map(([fg, bg]) => ({ kind, fg, bg, min })));
}

const own = (name) => FOLLOWS[name] ?? name;
const ratioOf = (a, b) => contrast(parseColour(a), parseColour(b));

/**
 * One scheme's roles: the design tones, then the moves that bring every
 * pair to its minimum. Returns { values: name -> hex, tones, moves }.
 */
function solveScheme(set, scheme, levelInfo) {
  const roles = new Map(ROLES.map((role) => {
    const [standard, high] = role.tones[scheme];
    return [role.name, { ...role, palette: role.palettes[scheme], tone: standard + (high - standard) * levelInfo.level }];
  }));
  for (const role of roles.values()) role.design = role.tone;
  const hex = (role) => hexFromArgb(set[role.palette].tone(role.tone));
  const toneOf = (role) => Hct.fromInt(set[role.palette].tone(role.tone)).tone;
  const pairs = pairsAt(levelInfo).map((pair) => ({ ...pair, fgRole: roles.get(own(pair.fg)), bgRole: roles.get(own(pair.bg)) }));
  for (const pair of pairs) if (!pair.fgRole || !pair.bgRole) throw new Error(`theme.mjs: no role for the pair ${pair.fg} on ${pair.bg}`);
  const passes = (pair) => ratioOf(hex(pair.fgRole), hex(pair.bgRole)) >= pair.min;

  /** Moves `mover` away from `other` until the ratio is reached or the tone hits 0 or 100; true when it moved. */
  const push = (mover, other, min) => {
    if (mover.ground) return false;
    const otherTone = toneOf(other);
    const ownTone = toneOf(mover);
    const direction = ownTone === otherTone ? (scheme === 'light' ? -1 : 1) : Math.sign(ownTone - otherTone);
    const limit = direction < 0 ? 0 : 100;
    if (mover.tone === limit) return false;
    const goal = direction < 0 ? Contrast.darkerUnsafe(otherTone, min + 0.05) : Contrast.lighterUnsafe(otherTone, min + 0.05);
    let next = direction < 0 ? Math.min(mover.tone - 0.5, goal) : Math.max(mover.tone + 0.5, goal);
    next = Math.max(0, Math.min(100, Math.round(next * 2) / 2));
    mover.tone = next;
    return true;
  };

  for (let round = 0; round < 400; round += 1) {
    const failing = pairs.find((pair) => !passes(pair));
    if (!failing) break;
    if (push(failing.fgRole, failing.bgRole, failing.min)) continue;
    if (push(failing.bgRole, failing.fgRole, failing.min)) continue;
    throw new Error(`theme.mjs: ${failing.fg} on ${failing.bg} cannot reach ${failing.min}:1 in the ${scheme} scheme`);
  }
  const unresolved = pairs.find((pair) => !passes(pair));
  if (unresolved) throw new Error(`theme.mjs: ${unresolved.fg} on ${unresolved.bg} does not converge in the ${scheme} scheme`);

  const values = {};
  const moves = [];
  for (const role of roles.values()) {
    values[role.name] = hex(role);
    if (role.tone !== role.design) moves.push({ scheme, role: role.name, from: role.design, to: role.tone });
  }
  const report = pairs.map((pair) => {
    const fg = values[pair.fgRole.name];
    const bg = values[pair.bgRole.name];
    return { scheme, kind: pair.kind, fg: pair.fg, bg: pair.bg, min: pair.min, ratio: ratioOf(fg, bg), apca: apcaContrast(parseColor(fg), parseColor(bg)) };
  });
  return { values, moves, report };
}

const title = (name) => name.replace(/(^|[-_\s])(\w)/g, (_, gap, letter) => `${gap ? ' ' : ''}${letter.toUpperCase()}`);

/** The command that regenerates a theme, for its header. */
function commandOf(options) {
  const parts = ['node tools/theme.mjs', `--seed '${options.seedText}'`, `--scheme ${options.scheme}`];
  for (const key of ['neutral', 'accent', 'error', 'success', 'warning']) if (options.given[key]) parts.push(`--${key} '${options.given[key]}'`);
  if (options.contrast !== 'standard') parts.push(`--contrast ${options.contrast}`);
  parts.push(`--name ${options.name}`);
  return parts.join(' ');
}

/** The colour of a role as one declaration value: light-dark() when the schemes differ. */
const both = (light, dark) => (light === dark ? light : `light-dark(${light}, ${dark})`);

/**
 * A theme from a seed. Options: seed (required), neutral, accent, error,
 * success, warning (colours as text or ARGB integers), scheme (tonal,
 * vibrant, neutral, fidelity or monochrome; default tonal), contrast
 * (standard, medium or high; default standard), name (default "custom").
 *
 * Returns { css, light, dark, moves, report, options }: the stylesheet; the
 * hex value of every role per scheme; the tones the generator moved to
 * reach a pair ({ scheme, role, from, to }); every pair per scheme with its
 * WCAG ratio and its APCA Lc (advisory); the options as read.
 */
export function generateTheme(options = {}) {
  const scheme = options.scheme ?? 'tonal';
  if (!(scheme in SCHEMES)) throw new TypeError(`scheme: one of ${Object.keys(SCHEMES).join(', ')} (got ${scheme})`);
  const contrastName = options.contrast ?? 'standard';
  const levelInfo = CONTRAST_LEVELS[contrastName];
  if (!levelInfo) throw new TypeError(`contrast: one of ${Object.keys(CONTRAST_LEVELS).join(', ')} (got ${contrastName})`);
  if (options.seed === undefined || options.seed === null || options.seed === '') throw new TypeError('seed: a colour is required');
  const name = String(options.name ?? 'custom');
  if (!/^[a-z0-9][\w-]*$/i.test(name)) throw new TypeError(`name: letters, digits, - and _ (got ${name})`);
  const optional = (key) => (options[key] === undefined || options[key] === null || options[key] === '' ? null : asArgb(options[key], key));
  const read = {
    seed: asArgb(options.seed, 'seed'),
    scheme,
    neutral: optional('neutral'),
    accent: optional('accent'),
    error: optional('error'),
    success: optional('success') ?? asArgb(STATUS_DEFAULTS.success, 'success'),
    warning: optional('warning') ?? asArgb(STATUS_DEFAULTS.warning, 'warning'),
  };
  const set = palettes(read);
  const light = solveScheme(set, 'light', levelInfo);
  const dark = solveScheme(set, 'dark', levelInfo);
  const given = Object.fromEntries(['neutral', 'accent', 'error', 'success', 'warning'].map((key) => [key, read[key] === null || options[key] === undefined || options[key] === null || options[key] === '' ? null : hexFromArgb(read[key])]));
  const info = { name, scheme, contrast: contrastName, seedText: hexFromArgb(read.seed), given };

  const lines = [];
  lines.push('/*');
  lines.push(` * ${title(name)} theme${contrastName === 'standard' ? '' : ` (${contrastName} contrast)`}: generated by tools/theme.mjs; regenerate it rather`);
  lines.push(' * than editing it:');
  lines.push(' *');
  lines.push(` *   ${commandOf(info)}`);
  lines.push(' *');
  lines.push(` * Seed ${info.seedText}, scheme ${scheme} (HCT palettes of Material Color Utilities),`);
  lines.push(` * contrast ${contrastName}: text pairs at ${levelInfo.text}:1 or more, controls, icons, outlines and chart`);
  lines.push(` * marks at ${levelInfo.other}:1 or more (WCAG 2), in both colour schemes.`);
  lines.push(' *');
  lines.push(' * One file for both schemes: load it after ds.css, instead of a theme plus');
  lines.push(' * themes/dark.css. Every colour role is light-dark(<light>, <dark>). The');
  lines.push(' * roles are unregistered custom properties, so light-dark() is resolved');
  lines.push(' * where a component uses the colour, by that element\'s color-scheme; and');
  lines.push(' * tokens.css sets color-scheme on every .ds-theme from --ds-color-scheme.');
  lines.push(' * This file sets it to "light dark" (the system decides); the attribute');
  lines.push(' * data-ds-scheme="light" or "dark" on a .ds-theme element pins the scheme');
  lines.push(' * for it and everything inside, so a region can differ from the page.');
  lines.push(' * Shadows are not colours: their colour parts are light-dark() too.');
  const moves = [...light.moves, ...dark.moves];
  if (moves.length) {
    lines.push(' *');
    lines.push(' * Tones moved to reach a pair (role scheme: design tone -> tone):');
    for (const move of moves) lines.push(` *   ${move.role} ${move.scheme}: ${move.from} -> ${move.to}`);
  }
  lines.push(' *');
  lines.push(' * Roles only: no scales, no motion tokens or hooks, never in @layer.');
  lines.push(' */');
  lines.push('');
  lines.push('.ds-theme {');
  lines.push('  --ds-color-scheme: light dark;');
  let group = null;
  for (const role of ROLES) {
    if (role.group !== group) {
      group = role.group;
      lines.push('');
      lines.push(`  /* ── ${GROUP_TITLES[group]} ── */`);
    }
    lines.push(`  ${role.name}: ${both(light.values[role.name], dark.values[role.name])};`);
  }
  lines.push('');
  lines.push('  /* ── Scrims and shadows (on black in the dark) ── */');
  for (const [property, lightValue, darkValue] of FIXED) lines.push(`  ${property}: ${both(lightValue, darkValue)};`);
  for (const [property, ...layers] of SHADOWS) {
    const value = layers.map(([geometry, alpha]) => `${geometry} ${both(`rgba(60, 64, 67, ${alpha})`, `rgba(0, 0, 0, ${alpha})`)}`).join(', ');
    lines.push(`  ${property}: ${value};`);
  }
  if (contrastName === 'high') {
    lines.push('');
    lines.push('  /* ── Focus and links, as themes/contrast.css sets them ── */');
    lines.push('  --ds-focus-width: 3px;');
    lines.push('  --ds-link-underline: currentColor;');
  }
  lines.push('}');
  lines.push('');
  lines.push('.ds-theme[data-ds-scheme="light"] {');
  lines.push('  --ds-color-scheme: light;');
  lines.push('}');
  lines.push('');
  lines.push('.ds-theme[data-ds-scheme="dark"] {');
  lines.push('  --ds-color-scheme: dark;');
  lines.push('}');
  lines.push('');

  return {
    css: lines.join('\n'),
    light: light.values,
    dark: dark.values,
    moves,
    report: [...light.report, ...dark.report],
    options: { name, scheme, contrast: contrastName, seed: info.seedText, ...given },
  };
}

/**
 * A stylesheet as one scheme sees it: every light-dark(a, b) replaced by a
 * (light) or b (dark), and --ds-color-scheme set to that scheme (the
 * light-dark() part is pickLightDark() of theme-rules.mjs, which
 * check-theme.mjs uses to check every pair in both schemes).
 */
export function pickScheme(css, scheme) {
  return pickLightDark(css, scheme).replace(/--ds-color-scheme:\s*light dark;/g, `--ds-color-scheme: ${scheme};`);
}

/** The preset files: Map of file name -> css (<name>.css and <name>-contrast.css). */
export function presetFiles() {
  const files = new Map();
  for (const preset of PRESETS) {
    const { name, description, ...options } = preset;
    files.set(`${name}.css`, generateTheme({ ...options, name }).css);
    files.set(`${name}-contrast.css`, generateTheme({ ...options, name, contrast: 'high' }).css);
  }
  return files;
}

// ── CLI ────────────────────────────────────────────────────────────────────

const USAGE = `Usage: node tools/theme.mjs --seed <colour> [--scheme ${Object.keys(SCHEMES).join('|')}] [--contrast ${Object.keys(CONTRAST_LEVELS).join('|')}]
         [--neutral <c>] [--accent <c>] [--error <c>] [--success <c>] [--warning <c>] [--name <name>] [--out <file>]
       node tools/theme.mjs --presets [--check] [--out <dir>]`;

async function main(argv) {
  const { existsSync, mkdirSync, readFileSync, writeFileSync } = await import('node:fs');
  const { dirname, join, resolve } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const here = dirname(fileURLToPath(import.meta.url));
  const VALUED = ['seed', 'neutral', 'accent', 'error', 'success', 'warning', 'scheme', 'contrast', 'name', 'out'];
  const options = {};
  const flags = new Set();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const key = arg.startsWith('--') ? arg.slice(2) : null;
    if (key && VALUED.includes(key) && argv[i + 1] !== undefined) options[key] = argv[(i += 1)];
    else if (key && ['presets', 'check', 'help'].includes(key)) flags.add(key);
    else {
      console.error(USAGE);
      return 2;
    }
  }
  if (flags.has('help')) {
    console.log(USAGE);
    return 0;
  }

  // The check of what is written: check-theme.mjs on each scheme's view, with the copy's tokens.json.
  const tokensPath = [join(here, '..', 'tokens.json'), join(here, '..', '..', 'dist', 'tokens.json')].find((path) => existsSync(path));
  const deprecationsPath = [join(here, '..', 'deprecations.json'), join(here, '..', '..', 'dist', 'deprecations.json')].find((path) => existsSync(path));
  const { checkTheme, formatFinding } = await import('./check-theme.mjs');
  const verify = (path, css) => {
    if (!tokensPath) return [];
    const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));
    const deprecations = deprecationsPath ? JSON.parse(readFileSync(deprecationsPath, 'utf8')) : null;
    return ['light', 'dark'].flatMap((scheme) => checkTheme({ files: [{ path: `${path} (${scheme})`, css: pickScheme(css, scheme) }], tokens, deprecations })
      .filter((finding) => finding.level !== 'info'));
  };

  if (flags.has('presets')) {
    const dir = resolve(options.out ?? join(here, '..', '..', 'themes', 'presets'));
    const files = presetFiles();
    let problems = 0;
    for (const [file, css] of files) {
      const path = join(dir, file);
      const findings = verify(path, css);
      for (const finding of findings) console.error(formatFinding(finding));
      problems += findings.length;
      if (flags.has('check')) {
        if (!existsSync(path) || readFileSync(path, 'utf8') !== css) {
          console.error(`${path}: not what the generator writes (run node scripts/tools/theme.mjs --presets)`);
          problems += 1;
        }
      } else {
        mkdirSync(dir, { recursive: true });
        writeFileSync(path, css);
      }
    }
    console.error(`theme: ${files.size} preset files ${flags.has('check') ? 'checked' : 'written'} in ${dir}${problems ? `, ${problems} problem${problems === 1 ? '' : 's'}` : ''}`);
    return problems ? 1 : 0;
  }

  if (!options.seed) {
    console.error(USAGE);
    return 2;
  }
  let theme;
  try {
    theme = generateTheme(options);
  } catch (error) {
    console.error(`theme: ${error.message}`);
    return 2;
  }
  const target = options.out ? resolve(options.out) : 'stdout';
  const findings = verify(target, theme.css);
  for (const finding of findings) console.error(formatFinding(finding));
  if (options.out) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, theme.css);
  } else {
    process.stdout.write(theme.css);
  }
  const lowest = (scheme) => theme.report.filter((pair) => pair.scheme === scheme && pair.kind === 'text')
    .reduce((low, pair) => (Math.abs(pair.apca) < Math.abs(low.apca) ? pair : low));
  const advisory = ['light', 'dark'].map((scheme) => {
    const pair = lowest(scheme);
    return `${scheme} Lc ${Math.abs(pair.apca).toFixed(1)} (${pair.fg} on ${pair.bg})`;
  }).join(', ');
  console.error(`theme: ${theme.options.name} (${theme.options.scheme}, ${theme.options.contrast}) to ${target}; ${theme.report.length} pairs pass in both schemes, ${theme.moves.length} tone${theme.moves.length === 1 ? '' : 's'} moved; APCA, advisory, lowest text pair: ${advisory}${tokensPath ? '' : '; tokens.json not found, check-theme skipped'}`);
  return findings.length ? 1 : 0;
}

if (typeof process !== 'undefined' && process.argv?.[1]) {
  const { fileURLToPath } = await import('node:url');
  const { resolve } = await import('node:path');
  if (resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await main(process.argv.slice(2));
}
