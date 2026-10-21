#!/usr/bin/env node
/**
 * The one generator of sampled motion data, without dependencies and
 * deterministic: easing curves, loop keyframe stops and the wave masks.
 *
 *   node scripts/motion-curves.mjs           rewrite the generated parts of src/tokens.css and src/motion.css
 *   node scripts/motion-curves.mjs --check   exit 1 if they differ from the output or break their contract
 *
 * Easing curves (src/tokens.css, inside the
 * `@supports (transition-timing-function: linear(0, 1))` block): each becomes
 * a linear() easing (Progressive: older engines keep the cubic-bezier
 * fallback of the main .ds-theme rule). The stops are chosen adaptively on
 * a 0.1% grid: a segment grows as long as the straight line between its
 * rounded stops stays within TOLERANCE of the analytic curve, so steep parts
 * get dense stops and flat parts few. Outputs are rounded to 3 decimals,
 * positions to 0.1%.
 *   --ds-ease-spatial     springCurve(SPATIAL): the spring of movement that floats
 *   --ds-ease-emphasized  emphasizedCurve(): the Material 3 emphasized path
 *
 * Generated blocks, each between a `/* generated: <name> *\/` and an
 * `/* end generated: <name> *\/` marker (never edit them by hand):
 *   src/motion.css  loader-morph      the 7 Material 3 loader shapes as polygon()s
 *                   progress-head     the heads of the two-segment indeterminate bar
 *                   progress-tail     its tails
 *                   spinner-arc       the arc of the spinner (sweep and start)
 *                   skeleton-wave     the sweep of the skeleton wave
 *   src/tokens.css  progress-masks    the wave length and the wave masks of progress
 *
 * The loop curves are baked into the keyframe stops (linear interpolation
 * between them), so the loops run `linear` timing and need no curve token;
 * only the loader morph keeps one curve per step (--ds-ease-spatial).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS = 'src/tokens.css';
const MOTION = 'src/motion.css';

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

/** y for a given x of the cubic segment p0 ... p3 (monotonic in x). */
function bezierAt(p0, p1, p2, p3, x) {
  let low = 0;
  let high = 1;
  for (let i = 0; i < 60; i += 1) {
    const middle = (low + high) / 2;
    if (bezier(p0[0], p1[0], p2[0], p3[0], middle) < x) low = middle; else high = middle;
  }
  return bezier(p0[1], p1[1], p2[1], p3[1], (low + high) / 2);
}

/** A CSS cubic-bezier(x1, y1, x2, y2) easing as a function of x in [0, 1]. */
export function cubicBezier(x1, y1, x2, y2) {
  return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : bezierAt([0, 0], [x1, y1], [x2, y2], [1, 1], x));
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
    return bezierAt(p0, p1, p2, p3, x);
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

/* ── Keyframe stops of the loops ─────────────────────────────────────── */

/** A number with at most `digits` decimals, without trailing zeros or -0. */
export function fixed(value, digits) {
  const number = Number(value.toFixed(digits));
  return String(number === 0 ? 0 : number);
}

/** Keyframe offsets lie on this grid: 0.01% of a keyframe. */
const KEY_GRID = 10000;

/**
 * Stops of `f` on [a, b] (fractions of a keyframe, snapped to KEY_GRID):
 * [{ at, value }] with `at` in grid steps. Greedy: each segment is the
 * longest whose straight line stays within `tolerance` of `f`, so steep
 * parts get dense stops and flat parts (a hold) two.
 */
export function sampleSpan(f, a, b, tolerance) {
  const from = Math.round(a * KEY_GRID);
  const to = Math.round(b * KEY_GRID);
  const t = (step) => step / KEY_GRID;
  const fits = (i, j) => {
    const fi = f(t(i));
    const fj = f(t(j));
    for (let k = i * 4; k <= j * 4; k += 1) {
      const line = fi + ((fj - fi) * (k - i * 4)) / ((j - i) * 4);
      if (Math.abs(line - f(k / (4 * KEY_GRID))) > tolerance) return false;
    }
    return true;
  };
  const stops = [{ at: from, value: f(t(from)) }];
  let i = from;
  while (i < to) {
    let j = i + 1;
    while (j < to && fits(i, j + 1)) j += 1;
    stops.push({ at: j, value: f(t(j)) });
    i = j;
  }
  return stops;
}

/**
 * A track: the stops of a piecewise function, one span per smooth piece.
 * `pieces` is [[a, b, f], ...] in order; joints appear once.
 */
function track(pieces, tolerance) {
  const stops = [];
  for (const [a, b, f] of pieces) {
    for (const stop of sampleSpan(f, a, b, tolerance)) {
      if (stops.length && stops.at(-1).at === stop.at) continue;
      stops.push(stop);
    }
  }
  return stops;
}

/** Keyframe offset text of a grid step ("12.5%"). */
const offsetText = (at) => `${fixed((at / KEY_GRID) * 100, 2)}%`;

/**
 * Keyframe stop lines: tracks { property: { stops, text } } merged by
 * offset, each line `<offset> { <property>: <value>; ... }`.
 */
function keyframeLines(tracks) {
  const byOffset = new Map();
  for (const [property, { stops, text }] of Object.entries(tracks)) {
    for (const stop of stops) {
      if (!byOffset.has(stop.at)) byOffset.set(stop.at, []);
      byOffset.get(stop.at).push(`${property}: ${text(stop.value)};`);
    }
  }
  return [...byOffset.keys()].sort((x, y) => x - y).map((at) => `${offsetText(at)} { ${byOffset.get(at).join(' ')} }`);
}

/**
 * Material 3 two-segment indeterminate progress on a 1800ms cycle: each
 * edge runs from 0 to 1 on its own curve and window (ms), then holds.
 */
export const PROGRESS_CYCLE = 1800;
export const PROGRESS_EDGES = {
  '--ds-progress-head-1': { from: 0, to: 750, curve: [0.2, 0, 0.8, 1] },
  '--ds-progress-tail-1': { from: 333, to: 1183, curve: [0.4, 0, 1, 1] },
  '--ds-progress-head-2': { from: 1000, to: 1567, curve: [0, 0, 0.65, 1] },
  '--ds-progress-tail-2': { from: 1267, to: 1800, curve: [0.1, 0, 0.45, 1] },
};
/** Largest error of an edge between its stops: 0.1% of the track. */
const PROGRESS_TOLERANCE = 0.001;

/** The tracks of one edge of the bar (values 0 ... 1). */
function progressTrack({ from, to, curve }) {
  const a = from / PROGRESS_CYCLE;
  const b = to / PROGRESS_CYCLE;
  const ease = cubicBezier(...curve);
  const pieces = [];
  if (a > 0) pieces.push([0, a, () => 0]);
  pieces.push([a, b, (t) => ease((t - a) / (b - a))]);
  if (b < 1) pieces.push([b, 1, () => 1]);
  return track(pieces, PROGRESS_TOLERANCE);
}

/** `ds-progress-head` or `ds-progress-tail` stop lines ('head' | 'tail'). */
export function progressLines(edge) {
  const tracks = {};
  for (const [property, spec] of Object.entries(PROGRESS_EDGES)) {
    if (property.includes(`-${edge}-`)) tracks[property] = { stops: progressTrack(spec), text: (value) => `${fixed(value * 100, 2)}%` };
  }
  return keyframeLines(tracks);
}

/**
 * The Material 3 spinner arc. Each arc cycle grows the sweep from MIN to
 * MAX (the head runs ahead) and shrinks it back while the start advances
 * ADVANCE (the tail chases the head), each half on the M3 curve
 * cubic-bezier(.4, 0, .2, 1). The start advances 270deg per cycle, so the
 * keyframe holds four cycles (4 x 270deg = 3 turns): only then does it end
 * where it began, and the loop never jumps. One keyframe loop is
 * --ds-loop-arc (4 x 1333ms); ds-spin turns the whole ring on top of it.
 */
export const ARC = { min: 10, max: 270, advance: 270, cycles: 4, curve: [0.4, 0, 0.2, 1] };
/** Largest error of the arc between its stops, in degrees. */
const ARC_TOLERANCE = 1;

/** `ds-spinner-arc` stop lines (--ds-spinner-arc, --ds-spinner-start). */
export function spinnerArcLines() {
  const { min, max, advance, cycles, curve } = ARC;
  const ease = cubicBezier(...curve);
  const sweep = [];
  const start = [];
  for (let cycle = 0; cycle < cycles; cycle += 1) {
    const a = cycle / cycles;
    const middle = (cycle + 0.5) / cycles;
    const b = (cycle + 1) / cycles;
    const base = cycle * advance;
    sweep.push([a, middle, (t) => min + (max - min) * ease((t - a) / (middle - a))]);
    sweep.push([middle, b, (t) => max - (max - min) * ease((t - middle) / (b - middle))]);
    start.push([a, middle, () => base]);
    start.push([middle, b, (t) => base + advance * ease((t - middle) / (b - middle))]);
  }
  const degrees = (value) => `${fixed(value, 2)}deg`;
  return keyframeLines({
    '--ds-spinner-arc': { stops: track(sweep, ARC_TOLERANCE), text: degrees },
    '--ds-spinner-start': { stops: track(start, ARC_TOLERANCE), text: degrees },
  });
}

/**
 * The skeleton wave: --ds-skeleton-x sweeps on a symmetric sine in-out
 * over the first 60% of the cycle, then rests. The bones paint a 200vw
 * wide gradient with the band at its middle, fixed to the viewport, at
 * this x: the band's centre travels from half a viewport left of the
 * screen (x = -150vw) to half a viewport right of it (x = 50vw). Both ends
 * show no band, whether the gradient repeats (the ends are one period,
 * 200vw, apart) or not, so the rest and the restart never show a jump.
 */
export const SKELETON = { from: -150, to: 50, sweep: 0.6 };
/** Largest error of the wave between its stops, in vw. */
const SKELETON_TOLERANCE = 0.2;

/** `ds-skeleton-wave` stop lines (--ds-skeleton-x). */
export function skeletonLines() {
  const { from, to, sweep } = SKELETON;
  const stops = track([
    [0, sweep, (t) => from + ((to - from) * (1 - Math.cos((Math.PI * t) / sweep))) / 2],
    [sweep, 1, () => to],
  ], SKELETON_TOLERANCE);
  return keyframeLines({ '--ds-skeleton-x': { stops, text: (value) => `${fixed(value, 2)}vw` } });
}

/* ── Loader shapes ───────────────────────────────────────────────────── */

/** Vertices of every loader polygon. */
export const LOADER_VERTICES = 64;

/** Arc points per rounded corner of the dense outline. */
const CORNER_STEPS = 48;

const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const times = (p, k) => [p[0] * k, p[1] * k];
const length = (p) => Math.hypot(p[0], p[1]);
const unit = (p) => times(p, 1 / length(p));
const polar = (angle, radius, centre = [0, 0]) => [centre[0] + radius * Math.cos(angle), centre[1] + radius * Math.sin(angle)];
const radians = (degrees) => (degrees * Math.PI) / 180;

/**
 * The dense outline of a polygon whose corners are rounded with circles
 * (as androidx.graphics.shapes.RoundedPolygon without smoothing): vertices
 * [{ p: [x, y], r }]. A rounding that does not fit its edges shrinks in
 * proportion, as there.
 */
function roundedOutline(vertices) {
  const count = vertices.length;
  const corners = vertices.map((vertex, index) => {
    const before = vertices[(index + count - 1) % count].p;
    const after = vertices[(index + 1) % count].p;
    const u = unit(sub(before, vertex.p));
    const v = unit(sub(after, vertex.p));
    const angle = Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1])));
    return { ...vertex, u, v, angle, cut: vertex.r ? vertex.r / Math.tan(angle / 2) : 0 };
  });
  // Edge i runs from corner i to corner i + 1: both cuts must fit on it.
  const scale = corners.map(() => 1);
  corners.forEach((corner, index) => {
    const next = corners[(index + 1) % count];
    const side = length(sub(next.p, corner.p));
    const need = corner.cut + next.cut;
    if (need > side) {
      const factor = side / need;
      scale[index] = Math.min(scale[index], factor);
      scale[(index + 1) % count] = Math.min(scale[(index + 1) % count], factor);
    }
  });
  const outline = [];
  corners.forEach((corner, index) => {
    const cut = corner.cut * scale[index];
    if (!cut) { outline.push(corner.p); return; }
    const radius = cut * Math.tan(corner.angle / 2);
    const centre = add(corner.p, times(unit(add(corner.u, corner.v)), radius / Math.sin(corner.angle / 2)));
    const from = Math.atan2(corner.p[1] + corner.u[1] * cut - centre[1], corner.p[0] + corner.u[0] * cut - centre[0]);
    let to = Math.atan2(corner.p[1] + corner.v[1] * cut - centre[1], corner.p[0] + corner.v[0] * cut - centre[0]);
    // The arc between the two tangent points is the short one (pi - angle).
    while (to - from > Math.PI) to -= 2 * Math.PI;
    while (to - from < -Math.PI) to += 2 * Math.PI;
    for (let step = 0; step <= CORNER_STEPS; step += 1) outline.push(polar(from + ((to - from) * step) / CORNER_STEPS, radius, centre));
  });
  return outline;
}

/**
 * androidx RoundedPolygon.star: `points` outer vertices on radius 1 (the
 * first at angle 0, pointing right), inner ones between them on `inner`,
 * every corner rounded by `rounding`; `turn` rotates it (degrees).
 */
function star(points, inner, rounding, turn = 0) {
  const vertices = [];
  for (let index = 0; index < points * 2; index += 1) {
    vertices.push({ p: polar(radians(turn) + (index * Math.PI) / points, index % 2 ? inner : 1), r: rounding });
  }
  return roundedOutline(vertices);
}

/**
 * The Material 3 customPolygon: vertices [x, y, rounding] in the unit
 * square, repeated `reps` times around its centre; with `mirroring`, every
 * second repetition is mirrored, so a half section describes the shape.
 */
function customPolygon(points, reps, mirroring = false) {
  const centre = [0.5, 0.5];
  const angles = points.map(([x, y]) => Math.atan2(y - centre[1], x - centre[0]));
  const distances = points.map(([x, y]) => length(sub([x, y], centre)));
  const vertices = [];
  if (mirroring) {
    const sections = reps * 2;
    const section = (2 * Math.PI) / sections;
    for (let rep = 0; rep < sections; rep += 1) {
      for (let index = 0; index < points.length; index += 1) {
        const i = rep % 2 === 0 ? index : points.length - 1 - index;
        if (i === 0 && rep % 2 === 1) continue;
        const angle = section * rep + (rep % 2 === 0 ? angles[i] : section - angles[i] + 2 * angles[0]);
        vertices.push({ p: polar(angle, distances[i], centre), r: points[i][2] });
      }
    }
  } else {
    for (let rep = 0; rep < reps; rep += 1) {
      for (let index = 0; index < points.length; index += 1) {
        vertices.push({ p: polar(angles[index] + (rep * 2 * Math.PI) / reps, distances[index], centre), r: points[index][2] });
      }
    }
  }
  return roundedOutline(vertices);
}

/** A capsule of length 1 and width `width` along `angle` (degrees). */
function capsule(width, angle) {
  const half = (1 - width) / 2;
  const axis = radians(angle);
  const outline = [];
  for (const [end, from] of [[half, axis - Math.PI / 2], [-half, axis + Math.PI / 2]]) {
    const centre = polar(axis, end);
    for (let step = 0; step <= CORNER_STEPS * 2; step += 1) outline.push(polar(from + (Math.PI * step) / (CORNER_STEPS * 2), width / 2, centre));
  }
  return outline;
}

/** An ellipse with axes 1 and `ratio`, its long axis along `angle` (degrees). */
function ellipse(ratio, angle) {
  const axis = radians(angle);
  const outline = [];
  for (let step = 0; step < CORNER_STEPS * 8; step += 1) {
    const t = (2 * Math.PI * step) / (CORNER_STEPS * 8);
    const [x, y] = [Math.cos(t), ratio * Math.sin(t)];
    outline.push([x * Math.cos(axis) - y * Math.sin(axis), x * Math.sin(axis) + y * Math.cos(axis)]);
  }
  return outline;
}

/**
 * The seven shapes of the Material 3 Expressive loading indicator, in its
 * order, as dense outlines (screen coordinates, y down). The values follow
 * androidx.compose.material3.MaterialShapes; pill and oval are drawn
 * directly (a capsule and an ellipse on the diagonal).
 */
export const LOADER_SHAPES = {
  'soft burst': () => customPolygon([[0.193, 0.277, 0.053], [0.176, 0.055, 0.053]], 10),
  'cookie-9': () => star(9, 0.8, 0.5, -90),
  pentagon: () => customPolygon([[0.5, -0.009, 0.172], [1.03, 0.365, 0.164], [0.828, 0.97, 0.169]], 1, true),
  pill: () => capsule(0.6, -45),
  sunny: () => star(8, 0.8, 0.15),
  'cookie-4': () => customPolygon([[1.237, 1.236, 0.258], [0.5, 0.918, 0.233]], 4),
  oval: () => ellipse(0.64, -45),
};

/**
 * An outline resampled to `count` vertices at equal arc length, centred on
 * its bounding box and scaled so its farthest point lies on a circle of
 * radius 0.5 around (0.5, 0.5): the shape turns inside its box, and every
 * shape fills the same circle. Normalised so morphs never twist: clockwise
 * on screen, the first vertex where the outline crosses straight up from
 * the centre.
 */
export function resample(outline, count = LOADER_VERTICES) {
  const xs = outline.map((p) => p[0]);
  const ys = outline.map((p) => p[1]);
  const centre = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  let points = outline.map((p) => sub(p, centre));
  const reach = Math.max(...points.map(length));
  points = points.map((p) => times(p, 0.5 / reach));
  // Shoelace: positive area is clockwise on screen (y points down).
  let area = 0;
  points.forEach((p, index) => {
    const q = points[(index + 1) % points.length];
    area += p[0] * q[1] - q[0] * p[1];
  });
  if (area < 0) points.reverse();
  // Start where the outline crosses the upward ray (x = 0, y < 0).
  let start;
  points.forEach((p, index) => {
    const q = points[(index + 1) % points.length];
    if (start === undefined && p[0] < 0 && q[0] >= 0 && p[1] + q[1] < 0) {
      const k = -p[0] / (q[0] - p[0]);
      start = { index, point: add(p, times(sub(q, p), k)) };
    }
  });
  if (!start) throw new Error('resample: the outline never crosses straight up from its centre');
  const ring = [start.point, ...points.slice(start.index + 1), ...points.slice(0, start.index + 1), start.point];
  const lengths = [0];
  for (let index = 1; index < ring.length; index += 1) lengths.push(lengths[index - 1] + length(sub(ring[index], ring[index - 1])));
  const total = lengths.at(-1);
  const result = [];
  let segment = 1;
  for (let k = 0; k < count; k += 1) {
    const target = (total * k) / count;
    while (lengths[segment] < target) segment += 1;
    const span = lengths[segment] - lengths[segment - 1];
    const ratio = span ? (target - lengths[segment - 1]) / span : 0;
    result.push(add(ring[segment - 1], times(sub(ring[segment], ring[segment - 1]), ratio)));
  }
  return result.map((p) => [p[0] + 0.5, p[1] + 0.5]);
}

/** The loader polygons: { name: [[x%, y%], ...] }, LOADER_VERTICES each, 2 decimals. */
export function loaderPolygons() {
  return Object.fromEntries(Object.entries(LOADER_SHAPES).map(([name, shape]) => [name,
    resample(shape()).map((p) => p.map((value) => Number(fixed(value * 100, 2))))]));
}

/** `ds-loader-morph` stop lines: shape k at k/7, the first again at 100%. */
export function loaderLines() {
  const shapes = Object.values(loaderPolygons());
  const lines = [];
  shapes.forEach((points, index) => {
    const offset = index === 0 ? '0%, 100%' : `${fixed((index / shapes.length) * 100, 2)}%`;
    const pairs = points.map(([x, y]) => `${x}% ${y}%`);
    const rows = [];
    for (let row = 0; row < pairs.length; row += 8) rows.push(`    ${pairs.slice(row, row + 8).join(', ')}${row + 8 < pairs.length ? ',' : ''}`);
    lines.push(`${offset} {`, '  clip-path: polygon(', ...rows, '  );', '}');
  });
  return lines;
}

/* ── Wave masks of progress ──────────────────────────────────────────── */

/** The determinate wave: a 4px stroke, ±3px amplitude, 40px wavelength. */
export const WAVE = { length: 40, amplitude: 3, stroke: 4 };
/** The wavy ring of the 40px determinate spinner: 7 waves of ±1.6px. */
export const RING = { size: 40, stroke: 4, amplitude: 1.6, waves: 7 };

const pathNumber = (value) => fixed(value, 2);

/**
 * An SVG path through a smooth parametric curve, as cubic segments from
 * its values and derivatives (Hermite): `point(s)` and `slope(s)` on
 * [from, to], `steps` segments.
 */
function smoothPath(point, slope, from, to, steps, close = false) {
  const h = (to - from) / steps;
  const text = (p) => `${pathNumber(p[0])} ${pathNumber(p[1])}`;
  const parts = [`M${text(point(from))}`];
  for (let step = 0; step < steps; step += 1) {
    const s0 = from + step * h;
    const s1 = s0 + h;
    const c1 = add(point(s0), times(slope(s0), h / 3));
    const c2 = sub(point(s1), times(slope(s1), h / 3));
    parts.push(`C${text(c1)} ${text(c2)} ${text(point(s1))}`);
  }
  return parts.join('') + (close ? 'Z' : '');
}

/** An SVG as a CSS url() with a data URI (single quotes inside, no #). */
function svgUrl(width, height, path, stroke) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>`
    + `<path d='${path}' fill='none' stroke='black' stroke-width='${stroke}'/></svg>`;
  return `url("data:image/svg+xml,${svg.replace(/</g, '%3C').replace(/>/g, '%3E')}")`;
}

/**
 * --ds-progress-wave: one wavelength of a sine stroke, centred in a box
 * of amplitude + half the stroke on each side (40 x 10). The path runs one
 * eighth of a wave past both ends, so repeated tiles join without a seam.
 */
export function progressWave() {
  const { length: wave, amplitude, stroke } = WAVE;
  const height = 2 * (amplitude + stroke / 2);
  const k = (2 * Math.PI) / wave;
  const point = (x) => [x, height / 2 - amplitude * Math.sin(k * x)];
  const slope = (x) => [1, -amplitude * k * Math.cos(k * x)];
  return svgUrl(wave, height, smoothPath(point, slope, -wave / 8, wave + wave / 8, 10), stroke);
}

/**
 * --ds-progress-ring-wave: a closed wavy ring for the 40px determinate
 * spinner, its centre line r(a) = r0 + amplitude * sin(waves * a), so the
 * stroke stays inside the box.
 */
export function progressRingWave() {
  const { size, stroke, amplitude, waves } = RING;
  const c = size / 2;
  const r0 = c - stroke / 2 - amplitude;
  const r = (a) => r0 + amplitude * Math.sin(waves * (a + Math.PI / 2));
  const dr = (a) => amplitude * waves * Math.cos(waves * (a + Math.PI / 2));
  const point = (a) => [c + r(a) * Math.cos(a), c + r(a) * Math.sin(a)];
  const slope = (a) => [dr(a) * Math.cos(a) - r(a) * Math.sin(a), dr(a) * Math.sin(a) + r(a) * Math.cos(a)];
  return svgUrl(size, size, smoothPath(point, slope, -Math.PI / 2, (3 * Math.PI) / 2, waves * 4, true), stroke);
}

/* ── Generated blocks ────────────────────────────────────────────────── */

/** The generated blocks by file and name, as lines (indented by the marker). */
export function blocks() {
  return {
    [MOTION]: {
      'loader-morph': loaderLines(),
      'progress-head': progressLines('head'),
      'progress-tail': progressLines('tail'),
      'spinner-arc': spinnerArcLines(),
      'skeleton-wave': skeletonLines(),
    },
    [TOKENS]: {
      'progress-masks': [
        `--ds-progress-wave-length: ${WAVE.length}px;`,
        `--ds-progress-wave: ${progressWave()};`,
        `--ds-progress-ring-wave: ${progressRingWave()};`,
      ],
    },
  };
}

/** `source` with the block `name` replaced by `lines` (indented like its start marker). */
export function replaceBlock(source, name, lines) {
  const open = `/* generated: ${name} */`;
  const close = `/* end generated: ${name} */`;
  const start = source.indexOf(open);
  const end = source.indexOf(close);
  if (start < 0 || end < start || source.indexOf(open, start + 1) >= 0) throw new Error(`no single "${open}" ... "${close}" block`);
  const indent = source.slice(source.lastIndexOf('\n', start) + 1, start);
  if (!/^\s*$/.test(indent)) throw new Error(`"${open}" must start its line`);
  return `${source.slice(0, start)}${open}\n${lines.map((line) => `${indent}${line}`).join('\n')}\n${indent}${source.slice(end)}`;
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

/** Every generated file: { path: next content } from the current sources. */
export function generate(read = (path) => readFileSync(join(ROOT, path), 'utf8').replace(/\r\n/g, '\n')) {
  const result = {};
  for (const [path, named] of Object.entries(blocks())) {
    let source = read(path);
    if (path === TOKENS) source = rewrite(source);
    for (const [name, lines] of Object.entries(named)) {
      try {
        source = replaceBlock(source, name, lines);
      } catch (error) {
        throw new Error(`${path}: ${error.message}`);
      }
    }
    result[path] = source;
  }
  return result;
}

/**
 * The contract of the generated data; returns the problems found (empty
 * when all is well): 64 vertices within the box per loader shape, edges of
 * the bar within 0-100% that never decrease within a cycle, the arc within
 * its sweep, a skeleton wave that only moves forward.
 */
export function problems() {
  const found = [];
  for (const [name, points] of Object.entries(loaderPolygons())) {
    if (points.length !== LOADER_VERTICES) found.push(`loader ${name}: ${points.length} vertices`);
    if (!points.flat().every((value) => value >= 0 && value <= 100)) found.push(`loader ${name}: a vertex outside 0-100%`);
  }
  for (const [property, spec] of Object.entries(PROGRESS_EDGES)) {
    const values = progressTrack(spec).map((stop) => Number(fixed(stop.value * 100, 2)));
    if (!values.every((value) => value >= 0 && value <= 100)) found.push(`${property}: a value outside 0-100%`);
    if (values.some((value, index) => index > 0 && value < values[index - 1])) found.push(`${property}: decreases within the cycle`);
    if (values[0] !== 0 || values.at(-1) !== 100) found.push(`${property}: does not run from 0% to 100%`);
  }
  const arc = spinnerArcLines().flatMap((line) => [...line.matchAll(/--ds-spinner-arc: (-?[\d.]+)deg/g)].map((match) => Number(match[1])));
  if (!arc.every((value) => value >= ARC.min && value <= ARC.max)) found.push('--ds-spinner-arc: outside its sweep');
  const starts = spinnerArcLines().flatMap((line) => [...line.matchAll(/--ds-spinner-start: (-?[\d.]+)deg/g)].map((match) => Number(match[1])));
  if (starts.at(-1) % 360 !== starts[0] % 360) found.push('--ds-spinner-start: the loop does not end where it starts (mod 360deg)');
  const skeleton = skeletonLines().map((line) => Number(line.match(/--ds-skeleton-x: (-?[\d.]+)vw/)[1]));
  if (skeleton.some((value, index) => index > 0 && value < skeleton[index - 1])) found.push('--ds-skeleton-x: moves backwards within the sweep');
  return found;
}

function main() {
  const invalid = problems();
  if (invalid.length) {
    console.error(`scripts/motion-curves.mjs: the generated data breaks its contract:\n  ${invalid.join('\n  ')}`);
    process.exit(1);
  }
  const read = (path) => readFileSync(join(ROOT, path), 'utf8').replace(/\r\n/g, '\n');
  const next = generate(read);
  const changed = Object.keys(next).filter((path) => next[path] !== read(path));
  if (process.argv.includes('--check')) {
    if (changed.length) {
      console.error(`${changed.join(', ')}: the generated parts differ from scripts/motion-curves.mjs; run \`node scripts/motion-curves.mjs\`.`);
      process.exit(1);
    }
    console.log('Generated curves, keyframes and masks are up to date.');
    return;
  }
  for (const path of changed) writeFileSync(join(ROOT, path), next[path]);
  console.log(changed.length ? `Rewritten: ${changed.join(', ')}.` : 'Generated curves, keyframes and masks are up to date.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
