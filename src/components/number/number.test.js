/**
 * DS.number: parsing and formatting in a locale, the limits and the step
 * grid (pure functions; no DOM in Node). The browser side is number.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clamp, create, format, parse, symbols } from './number.js';

describe('DS.number.symbols', () => {
  it('reads the separators and digits of a locale from Intl', () => {
    assert.deepEqual({ ...symbols('en'), digits: undefined }, { group: ',', decimal: '.', digits: undefined });
    assert.deepEqual({ ...symbols('de'), digits: undefined }, { group: '.', decimal: ',', digits: undefined });
    assert.equal(symbols('fr').decimal, ',');
    assert.match(symbols('fr').group, /^\s$/u);
    assert.equal(symbols('de-CH').decimal, '.');
    assert.equal(symbols('ar-EG').digits[3], '٣');
    assert.deepEqual(symbols('en').digits, ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
  });
});

describe('DS.number.parse', () => {
  it('reads the locale\'s separators', () => {
    assert.equal(parse('1,234.5', { locale: 'en' }), 1234.5);
    assert.equal(parse('1.234,5', { locale: 'de' }), 1234.5);
    assert.equal(parse('1 234,5', { locale: 'fr' }), 1234.5);
    assert.equal(parse('1 234,5', { locale: 'fr' }), 1234.5);
    assert.equal(parse('1’234.5', { locale: 'de-CH' }), 1234.5);
    assert.equal(parse("1'234.5", { locale: 'de-CH' }), 1234.5);
  });

  it('takes a full stop as the decimal where the locale has no other use for it', () => {
    assert.equal(parse('1.5', { locale: 'fr' }), 1.5);
    assert.equal(parse('1.500', { locale: 'de' }), 1500);
    assert.equal(parse('.5', { locale: 'en' }), 0.5);
  });

  it('reads the locale\'s digits, the minus signs and an affix typed along', () => {
    assert.equal(parse('٣٤٥', { locale: 'ar-EG' }), 345);
    assert.equal(parse('-5', { locale: 'en' }), -5);
    assert.equal(parse('−5', { locale: 'en' }), -5);
    assert.equal(parse('€-5', { locale: 'en' }), -5);
    assert.equal(parse('-€5', { locale: 'en' }), -5);
    assert.equal(parse('50 GB', { locale: 'en' }), 50);
    assert.equal(parse('19,90 €', { locale: 'de' }), 19.9);
    assert.equal(parse('  42  ', { locale: 'en' }), 42);
  });

  it('gives null for empty text and NaN for what is no number', () => {
    for (const text of ['', '   ', null, undefined]) assert.equal(parse(text, { locale: 'en' }), null);
    for (const text of ['abc', '1a2', '1.2.3', '1,2.3.4', '-', '€']) assert.ok(Number.isNaN(parse(text, { locale: 'en' })), text);
    assert.ok(Number.isNaN(parse('1,5,3', { locale: 'de' })));
  });
});

describe('DS.number.format', () => {
  it('writes the locale with the asked fraction digits and grouping', () => {
    assert.equal(format(1234.5, { locale: 'en' }), '1,234.5');
    assert.equal(format(1234.5, { locale: 'de', decimals: 2 }), '1.234,50');
    assert.equal(format(1234.5, { locale: 'en', grouping: false }), '1234.5');
    assert.equal(format(0.1 + 0.2, { locale: 'en', decimals: 1 }), '0.3');
    assert.equal(format(-3, { locale: 'en' }), '-3');
  });

  it('is empty for null and NaN', () => {
    assert.equal(format(null), '');
    assert.equal(format(undefined), '');
    assert.equal(format(Number.NaN), '');
  });

  it('reads back what it writes', () => {
    for (const locale of ['en', 'de', 'fr', 'de-CH', 'ar-EG', 'hi-IN']) {
      for (const value of [0, 7, -12.25, 1234.5, 9876543.21]) assert.equal(parse(format(value, { locale, decimals: 2 }), { locale }), value, `${locale} ${value}`);
    }
  });
});

describe('DS.number.clamp', () => {
  it('keeps the limits and rounds to the step counted from the minimum', () => {
    assert.equal(clamp(-3, { min: 0 }), 0);
    assert.equal(clamp(600, { max: 500 }), 500);
    assert.equal(clamp(7, { step: 5 }), 5);
    assert.equal(clamp(8, { step: 5 }), 10);
    assert.equal(clamp(4, { min: 1, step: 2 }), 5);
    assert.equal(clamp(13, { min: 0, max: 12, step: 5 }), 10);
    assert.equal(clamp(0.1 + 0.2, { step: 0.1 }), 0.3);
    assert.equal(clamp(1.006, { step: 0.01 }), 1.01);
  });

  it('leaves what is no number alone', () => {
    assert.ok(Number.isNaN(clamp(Number.NaN, { min: 0 })));
  });
});

describe('DS.number.create', () => {
  it('returns a controller that does nothing without a field', () => {
    const el = { querySelector: () => null, getAttribute: () => null };
    const made = create(el);
    assert.equal(made.get(), null);
    made.set(4);
    assert.equal(typeof made.on('change', () => {}), 'function');
    made.destroy();
  });
});
