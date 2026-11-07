/**
 * DS.duration without a DOM: reading lengths of time as people write them
 * in two locales, ISO 8601 both ways, the words it writes back, and its
 * registration. The keys and the states in a browser are duration.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse, iso, format } from './duration.js';
import { runtime } from '../../js/core.js';

const H = 3600000;
const M = 60000;

describe('DS.duration', () => {
  it('reads units in any spacing, words, clocks, decimals and ISO 8601', () => {
    const cases = {
      '1h 30m': H + 30 * M,
      '1h30m': H + 30 * M,
      '90 min': 90 * M,
      '1 hour, 30 minutes': H + 30 * M,
      '1h and 5m': H + 5 * M,
      '1:30': H + 30 * M,
      '1:30:15': H + 30 * M + 15000,
      '1.5h': 1.5 * H,
      '1,5 h': 1.5 * H,
      '2 days 4 hours': 52 * H,
      '3w': 21 * 24 * H,
      '45s': 45000,
      '250ms': 250,
      PT1H30M: H + 30 * M,
      P1DT2H: 26 * H,
      'pt45s': 45000,
    };
    for (const [text, ms] of Object.entries(cases)) assert.equal(parse(text, { locale: 'en' }), ms, text);
  });

  it('counts a bare number in the default unit, or after a unit in the next smaller one', () => {
    assert.equal(parse('90', { locale: 'en' }), 90 * M);
    assert.equal(parse('2', { unit: 'h', locale: 'en' }), 2 * H);
    assert.equal(parse('1h 30', { locale: 'en' }), H + 30 * M);
    assert.equal(parse('1d 6', { locale: 'en' }), 30 * H);
  });

  it('reads the unit words of the locale (through Intl) and its "and"', () => {
    assert.equal(parse('1 Std., 30 Min.', { locale: 'de' }), H + 30 * M);
    assert.equal(parse('2 Tage und 3 Stunden', { locale: 'de' }), 51 * H);
    assert.equal(parse('2 jours et 3 heures', { locale: 'fr' }), 51 * H);
  });

  it('refuses what is not a duration', () => {
    for (const text of ['', '   ', 'soon', '1h foo', '1 parsec', 'h']) assert.equal(parse(text, { locale: 'en' }), null, text);
    assert.equal(parse(-5), null);
    assert.equal(parse(5000), 5000);
  });

  it('writes ISO 8601 and the locale\'s words', () => {
    assert.equal(iso(H + 30 * M), 'PT1H30M');
    assert.equal(iso(26 * H), 'P1DT2H');
    assert.equal(iso(0), 'PT0S');
    assert.equal(iso(1500), 'PT1.5S');
    assert.equal(iso(null), '');
    assert.equal(iso(-1), '');
    assert.equal(format(H + 30 * M, { locale: 'en' }), '1h 30m');
    assert.equal(format(H + 30 * M, { style: 'long', locale: 'en' }), '1 hour, 30 minutes');
    assert.equal(parse(format(26 * H + 61000, { locale: 'de' }), { locale: 'de' }), 26 * H + 61000);
  });

  it('registers its behaviour by its attribute', () => {
    assert.equal(runtime.state('core').specs.get('duration').attribute, 'data-ds-duration');
  });
});
