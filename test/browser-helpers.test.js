/**
 * The pure checks of the browser tests' helper module
 * (test/browser/helpers/motion.js). That module imports only node:*, so its
 * judgement of a series of numbers is tested here without a browser.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  expectContinuous,
  expectMonotonic,
  expectPeakAtMost,
  expectSettles,
  expectSmooth,
  expectWithin,
  peakRatio,
  series,
} from './browser/helpers/motion.js';

/** `n + 1` samples of a curve from 0 to 1 at even times. */
const curve = (fn, n = 20) => Array.from({ length: n + 1 }, (_, i) => fn(i / n));
const easeOut = (t) => 1 - (1 - t) ** 3;
/** A damped spring from 0 to 1 (damping ratio zeta), settled by t = 1. */
const spring = (zeta, omega = 12) => (t) => {
  const damped = omega * Math.sqrt(1 - zeta ** 2);
  return 1 - Math.exp(-zeta * omega * t) * (Math.cos(damped * t) + ((zeta * omega) / damped) * Math.sin(damped * t));
};
/** Its overshoot: 1 + e^(-zeta pi / sqrt(1 - zeta^2)), about 1.028 at zeta = 0.75. */
const springPeak = (zeta) => 1 + Math.exp((-zeta * Math.PI) / Math.sqrt(1 - zeta ** 2));

describe('browser test helpers', () => {
  it('series() extracts one key', () => {
    assert.deepEqual(series([{ time: 0, opacity: 0 }, { time: 10, opacity: 0.5 }], 'opacity'), [0, 0.5]);
  });

  it('expectContinuous() passes smooth curves and fails one jump', () => {
    expectContinuous(curve((t) => t));
    expectContinuous(curve(easeOut));
    expectContinuous(curve(easeOut).reverse());
    const jumped = curve((t) => t);
    jumped[10] = 0.9;
    assert.throws(() => expectContinuous(jumped), /jump/);
    // A restart from zero in the middle of an exit is the classic interruption bug.
    const restart = [...curve((t) => 1 - t).slice(0, 8), ...curve((t) => t).slice(0, 8)];
    assert.throws(() => expectContinuous(restart), /jump/);
  });

  it('expectContinuous() honours its floor for frame jitter', () => {
    const jitter = [0, 0.1, 0.2, 0.35, 0.4, 0.5, 0.6];
    assert.throws(() => expectContinuous(jitter, { factor: 1, floor: 0 }), /jump/);
    expectContinuous(jitter, { factor: 1, floor: 0.1 });
  });

  it('peakRatio() measures the overshoot as a ratio of the travel', () => {
    const values = [0, 40, 80, 102.8, 101, 100];
    assert.ok(Math.abs(peakRatio(values) - 1.028) < 1e-9);
    assert.ok(Math.abs(peakRatio([100, 60, 20, -2.8, -1, 0]) - 1.028) < 1e-9, 'downwards travel');
    assert.ok(Math.abs(peakRatio([10, 50, 110], 10, 110) - 1) < 1e-9);
    assert.ok(Math.abs(springPeak(0.75) - 1.028) < 1e-3);
    assert.ok(Math.abs(peakRatio(curve(spring(0.75), 400)) - springPeak(0.75)) < 1e-3, 'a sampled spring');
    assert.throws(() => peakRatio([5, 5, 5]), /no travel/);
  });

  it('expectPeakAtMost() fails above the limit', () => {
    expectPeakAtMost([0, 60, 102.8, 100], 1.05);
    expectPeakAtMost([0, 60, 105, 100], 1.05);
    assert.throws(() => expectPeakAtMost([0, 60, 106, 100], 1.05), /exceeds/);
    assert.throws(() => expectPeakAtMost([0, 0.6, 1.02, 1], 1.05, { from: 0, to: 0.5 }), /exceeds/);
  });

  it('expectMonotonic() rejects a dip in either direction', () => {
    expectMonotonic(curve(easeOut));
    expectMonotonic(curve(easeOut).reverse());
    expectMonotonic([0, 0, 1], { direction: 'up' });
    assert.throws(() => expectMonotonic([0, 0.5, 0.4, 1]), /not monotonic/);
    assert.throws(() => expectMonotonic([1, 0.5, 0.6, 0]), /not monotonic/);
    assert.throws(() => expectMonotonic([0, 1], { direction: 'down' }), /not monotonic/);
    assert.throws(() => expectMonotonic(curve(spring(0.75), 100)), /not monotonic/, 'a spring turns back after its peak');
  });

  it('expectWithin() rejects a value out of range', () => {
    expectWithin(curve(easeOut), 0, 1);
    assert.throws(() => expectWithin([0, 0.5, 1.01], 0, 1), /outside/);
    assert.throws(() => expectWithin([-0.01, 0.5, 1], 0, 1), /outside/);
  });

  it('expectSettles() honours its tolerance', () => {
    expectSettles([0, 0.9, 0.996], 1);
    assert.throws(() => expectSettles([0, 0.9, 0.99], 1), /settles at/);
    expectSettles([0, 0.9, 0.99], 1, 0.02);
    expectSettles([0, 50, 99.5], 100, 0.5);
  });

  it('expectSmooth() judges steps by their frame time: long frames and holds pass, a jump or a restart fails', () => {
    // An ease-out over 1s, sampled on frames of 16ms with a 64ms frame and a held frame in between.
    const times = [0, 16, 32, 48, 112, 128, 128, 144, 160, 176, 192, 208, 224, 240];
    const at = (t) => easeOut(Math.min(1, t / 1000));
    const points = times.map((t, i) => ({ t: t + (i > 5 ? 16 : 0), v: i === 6 ? at(128) : at(t) }));
    expectSmooth(points, 'ease-out');
    // Reversed halfway on an ease-out (the steep start of the way back), with a long frame at the turn.
    const out = [0, 16, 32, 48, 64].map((t) => ({ t, v: 0.5 + 0.5 * at(t) }));
    const back = [112, 128, 144, 160, 176].map((t) => ({ t, v: out.at(-1).v - 0.5 * at(t - 64) }));
    expectSmooth([...out, ...back], 'reversal');
    // A jump ahead (to the end) that the motion then continues from.
    const jumped = times.map((t, i) => ({ t, v: at(t) + (i >= 8 ? 0.3 : 0) }));
    assert.throws(() => expectSmooth(jumped, 'jumped'), /jumped: a jump of/);
    // A restart from zero in the middle of an exit.
    const restart = [...times.slice(0, 7).map((t) => ({ t, v: 1 - at(t) })), ...times.slice(0, 7).map((t) => ({ t: t + 128, v: 1 - at(t) }))];
    assert.throws(() => expectSmooth(restart, 'restart'), /a jump of/);
    // A series that does not move is smooth.
    expectSmooth([{ t: 0, v: 1 }, { t: 16, v: 1 }], 'still');
  });
});
