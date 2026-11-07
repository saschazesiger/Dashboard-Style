/**
 * DS.otp: the cleaning of pasted and typed text (a pure function) and a
 * controller without cells. The browser side is otp.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clean, create } from './otp.js';

describe('DS.otp.clean', () => {
  it('keeps digits only on a numeric code, dropping separators', () => {
    assert.equal(clean('12 34-56'), '123456');
    assert.equal(clean(' 123 456 '), '123456');
    assert.equal(clean('code: 4021'), '4021');
    assert.equal(clean(''), '');
    assert.equal(clean(null), '');
    assert.equal(clean(undefined), '');
  });

  it('reads full-width digits and the digits of other scripts', () => {
    assert.equal(clean('１２３'), '123');
    assert.equal(clean('٤٠٢٩١٣'), '402913');
    assert.equal(clean('०१२३४५६७८९'), '0123456789');
  });

  it('keeps letters and digits on an alphanumeric code, upper-cased', () => {
    assert.equal(clean('ab-c12', { type: 'alphanumeric' }), 'ABC12');
    assert.equal(clean('x9y8 z7', { type: 'alphanumeric' }), 'X9Y8Z7');
    assert.equal(clean('é!', { type: 'alphanumeric' }), '');
  });

  it('cuts to the length', () => {
    assert.equal(clean('1234567', { length: 6 }), '123456');
    assert.equal(clean('12', { length: 6 }), '12');
  });
});

describe('DS.otp.create', () => {
  it('returns a controller that holds nothing without cells', () => {
    const made = create({ querySelectorAll: () => [], querySelector: () => null, getAttribute: () => null, hasAttribute: () => false });
    assert.equal(made.get(), '');
    made.set('123');
    assert.equal(made.get(), '');
    const off = made.on('change', () => {});
    off();
    assert.equal(typeof made.on('nonsense', () => {}), 'function');
    made.destroy();
    made.destroy();
  });
});
