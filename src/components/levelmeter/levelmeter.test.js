/**
 * DS.levelmeter: the level of a block of samples, its sample peak and its
 * decibels (pure functions). The controller (ballistics, peak, loud, ARIA) is covered in
 * the browser (levelmeter.spec.js).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { decibels, level, peak } from './levelmeter.js';

const sine = (amplitude, length = 2048) => Float32Array.from({ length }, (_, i) => amplitude * Math.sin((i / length) * Math.PI * 2 * 16));

describe('DS.levelmeter.level', () => {
  it('is 0 for silence, an empty block or nothing', () => {
    assert.equal(level(new Float32Array(128)), 0);
    assert.equal(level([]), 0);
    assert.equal(level(undefined), 0);
  });

  it('maps the RMS in dBFS from -60 dB (0) to 0 dB (1)', () => {
    // A full-scale square wave has an RMS of 1: 0 dBFS.
    assert.equal(level([1, -1, 1, -1]), 1);
    // RMS 0.1 is -20 dBFS: 40 / 60.
    assert.ok(Math.abs(level([0.1, -0.1, 0.1, -0.1]) - 2 / 3) < 1e-9);
    // RMS 0.001 is -60 dBFS: the floor.
    assert.equal(level([0.001, -0.001]), 0);
    // A sine of amplitude 1 has an RMS of 1 / sqrt 2: -3 dBFS.
    assert.ok(Math.abs(level(sine(1)) - 57 / 60) < 0.01);
  });

  it('stays within 0 and 1 and takes another floor', () => {
    assert.equal(level([4, -4]), 1, 'over full scale');
    assert.equal(level([0.00001]), 0, 'under the floor');
    assert.ok(Math.abs(level([0.1, -0.1], { floor: -40 }) - 0.5) < 1e-9);
    assert.equal(level([0.1, -0.1], { floor: 10 }), level([0.1, -0.1]), 'a floor above 0 dB is ignored');
  });

  it('reads plain arrays and ignores what is no number', () => {
    assert.equal(level([0.1, 'x', -0.1, null].map((value) => value)), level([0.1, 0, -0.1, 0]));
  });
});

describe('DS.levelmeter.peak', () => {
  it('is the largest |x|, 0 for silence or nothing, at most 1', () => {
    assert.equal(peak(new Float32Array(64)), 0);
    assert.equal(peak([]), 0);
    assert.equal(peak(undefined), 0);
    assert.equal(peak([0.2, -0.7, 0.5]), 0.7);
    assert.equal(peak([3, -4]), 1);
    assert.equal(peak([0.1, 'x', null, -0.3]), 0.3);
  });

  it('reaches -1 dBFS where clipping does and the RMS level does not', () => {
    const loud = 10 ** (-1 / 20);
    // A sine clipped at twice full scale: its RMS stays under -1 dBFS, its peak is full scale.
    const clipped = sine(2).map((value) => Math.max(-1, Math.min(1, value)));
    assert.ok(level(clipped) < 1 - 1 / 60, 'the RMS level stays below -1 dBFS');
    assert.ok(peak(clipped) >= loud);
    // A full-scale sine: -3 dB RMS, but a peak at full scale.
    assert.ok(peak(sine(1)) >= loud);
    // Ordinary speech-like levels stay below.
    assert.ok(peak(sine(0.3)) < loud);
  });
});

describe('DS.levelmeter.decibels', () => {
  it('maps a level back to whole dBFS', () => {
    assert.equal(decibels(1), 0);
    assert.equal(decibels(0.5), -30);
    assert.equal(decibels(2 / 3), -20);
    assert.equal(decibels(0.5, { floor: -40 }), -20);
  });

  it('is -Infinity at 0 and clamps', () => {
    assert.equal(decibels(0), -Infinity);
    assert.equal(decibels(-1), -Infinity);
    assert.equal(decibels(3), 0);
  });

  it('round-trips level()', () => {
    for (const rms of [0.5, 0.1, 0.02]) {
      assert.equal(decibels(level([rms, -rms])), Math.round(20 * Math.log10(rms)));
    }
  });
});
