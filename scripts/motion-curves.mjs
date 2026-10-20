#!/usr/bin/env node
/**
 * The one source of the sampled easing curves in src/tokens.css, without
 * dependencies and deterministic.
 *
 *   node scripts/motion-curves.mjs           rewrite the linear() values in src/tokens.css
 *   node scripts/motion-curves.mjs --check   exit 1 if src/tokens.css differs from the output
 *
 * Each curve becomes a linear() easing (Progressive: older engines keep the
 * cubic-bezier fallback of the main .ds-theme rule). The stops are chosen
 * adaptively on a 0.1% grid: a segment grows as long as the straight line
 * between its rounded stops stays within TOLERANCE of the analytic curve,
 * so steep parts get dense stops and flat parts few. Outputs are rounded to
 * 3 decimals, positions to 0.1%.
 *
 * Curves written into tokens.css (inside the
 * `@supports (transition-timing-function: linear(0, 1))` block):
 *   --ds-ease-spatial     springCurve(SPATIAL): the spring of movement that floats
 *   --ds-ease-emphasized  emphasizedCurve(): the Material 3 emphasized path
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS = join(ROOT, 'src/tokens.css');

/** Largest distance between the sampled line and the analytic curve. */
export const TOLERANCE = 0.002;
/** Stop positions lie on this grid (0.1%). */
const GRID = 1000;
/** Points checked per grid step when a segment is measured. */
const SUBSTEPS = 10;

/**
 * The spring of --ds-ease-spatial: damping ratio 0.75 peaks at about 1.028
 * (2.8% overshoot), settled once it stays within 0.001 of its rest.
 */
export const SPATIAL = { zeta: 0.75, band: 0.001 };

/**
 * The step response of a damped spring (zeta < 1), normalised so that t = 1
 * is its settle time: the last moment |x - 1| exceeds `band`. One curve then
 * serves every duration (the duration token is the settle time).
 *
 *   x(t) = 1 - e^(-zeta w t) (cos(w_d t) + zeta w / w_d sin(w_d t))
 */
export function springFunction({ zeta, band }) {
  if (!(zeta > 0 && zeta < 1)) throw new Error('springFunction: an underdamped spring needs 0 < zeta < 1');
  const damped = Math.sqrt(1 - zeta * zeta);
  const x = (tau) => 1 - Math.exp(-zeta * tau) * (Math.cos(damped * tau) + (zeta / damped) * Math.sin(damped * tau));
  const outside = (tau) => Math.abs(x(tau) - 1) > band;
  // The envelope e^(-zeta tau) / damped bounds |x - 1|: past its crossing of
  // the band, the curve never leaves it again.
  const limit = Math.log(1 / (band * damped)) / zeta;
  const step = 1e-3;
  let last = 0;
  for (let tau = 0; tau <= limit + step; tau += step) if (outside(tau)) last = tau;
  // The settle time lies between the last sample outside and the next one.
  let low = last;
  let high = last + step;
  for (let i = 0; i < 60; i += 1) {
    const middle = (low + high) / 2;
    if (outside(middle)) low = middle; else high = middle;
  }
  const settle = high;
  return (t) => (t >= 1 ? 1 : x(t * settle));
}

/** A point of a cubic Bézier segment at parameter u. */
function bezier(p0, p1, p2, p3, u) {
  const v = 1 - u;
  return v * v * v * p0 + 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u * p3;
}

/**
 * The Material 3 emphasized path: two cubic segments,
 * M 0,0 C .05,0 .133333,.06 .166666,.4 C .208333,.82 .25,1 1,1.
 * Returns y for a given x (each segment is monotonic in x).
 */
export function emphasizedFunction() {
  const segments = [
    [[0, 0], [0.05, 0], [2 / 15, 0.06], [1 / 6, 0.4]],
    [[1 / 6, 0.4], [5 / 24, 0.82], [0.25, 1], [1, 1]],
  ];
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const [p0, p1, p2, p3] = x < segments[1][0][0] ? segments[0] : segments[1];
    let low = 0;
    let high = 1;
    for (let i = 0; i < 60; i += 1) {
      const middle = (low + high) / 2;
      if (bezier(p0[0], p1[0], p2[0], p3[0], middle) < x) low = middle; else high = middle;
    }
    return bezier(p0[1], p1[1], p2[1], p3[1], (low + high) / 2);
  };
}

const round = (value) => Math.round(value * 1000) / 1000;

/**
 * Samples `f` on [0, 1] into linear() stops: [{ at, value }] with `at` in
 * grid steps. The first stop is 0 at 0%, the last 1 at 100%.
 */
export function sample(f, tolerance = TOLERANCE) {
  const value = (i) => (i === 0 ? 0 : i === GRID ? 1 : round(f(i / GRID)));
  const fits = (from, to) => {
    const a = value(from);
    const b = value(to);
    for (let k = from * SUBSTEPS; k <= to * SUBSTEPS; k += 1) {
      const t = k / (GRID * SUBSTEPS);
      const line = a + ((b - a) * (k - from * SUBSTEPS)) / ((to - from) * SUBSTEPS);
      if (Math.abs(line - f(t)) > tolerance) return false;
    }
    return true;
  };
  const stops = [{ at: 0, value: 0 }];
  let from = 0;
  while (from < GRID) {
    let to = from + 1;
    while (to < GRID && fits(from, to + 1)) to += 1;
    stops.push({ at: to, value: value(to) });
    from = to;
  }
  return stops;
}

/** linear() text of sampled stops; the first and last stop need no position. */
export function linearText(stops) {
  const number = (n) => String(round(n));
  const percent = (at) => `${String(Math.round(at) / (GRID / 100))}%`;
  const parts = stops.map((stop, index) => (index === 0 || index === stops.length - 1 ? number(stop.value) : `${number(stop.value)} ${percent(stop.at)}`));
  return `linear(${parts.join(', ')})`;
}

/** The spring as a linear() easing (see springFunction). */
export function springCurve(options = SPATIAL) {
  return linearText(sample(springFunction(options)));
}

/** The Material 3 emphasized path as a linear() easing. */
export function emphasizedCurve() {
  return linearText(sample(emphasizedFunction()));
}

/** The token values this script owns, by name. */
export function curves() {
  return {
    '--ds-ease-spatial': springCurve(SPATIAL),
    '--ds-ease-emphasized': emphasizedCurve(),
  };
}

const SUPPORTS = '@supports (transition-timing-function: linear(0, 1))';

/** tokens.css with every owned value inside the linear() @supports block replaced. */
export function rewrite(source) {
  const start = source.indexOf(SUPPORTS);
  if (start < 0) throw new Error(`src/tokens.css: no "${SUPPORTS}" block`);
  let depth = 0;
  let end = source.indexOf('{', start);
  do {
    if (source[end] === '{') depth += 1;
    else if (source[end] === '}') depth -= 1;
    end += 1;
  } while (depth > 0 && end < source.length);
  let block = source.slice(start, end);
  for (const [name, value] of Object.entries(curves())) {
    const pattern = new RegExp(`(${name}:\\s*)linear\\([^;]*\\);`);
    if (!pattern.test(block)) throw new Error(`src/tokens.css: ${name}: linear(...); missing in the ${SUPPORTS} block`);
    block = block.replace(pattern, (match, head) => `${head}${value};`);
  }
  return source.slice(0, start) + block + source.slice(end);
}

function main() {
  const source = readFileSync(TOKENS, 'utf8').replace(/\r\n/g, '\n');
  const next = rewrite(source);
  if (process.argv.includes('--check')) {
    if (next !== source) {
      console.error('src/tokens.css: the sampled curves differ from scripts/motion-curves.mjs; run `node scripts/motion-curves.mjs`.');
      process.exit(1);
    }
    console.log('src/tokens.css curves are up to date.');
    return;
  }
  if (next !== source) writeFileSync(TOKENS, next);
  console.log(next === source ? 'src/tokens.css curves are up to date.' : 'src/tokens.css curves rewritten.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
