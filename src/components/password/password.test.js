/**
 * DS.password: the strength score (a pure function; no DOM in Node). The
 * browser side is password.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { create, strength } from './password.js';

describe('DS.password.strength', () => {
  it('is 0 for nothing', () => {
    for (const value of ['', null, undefined]) assert.equal(strength(value), 0);
  });

  it('is weak below the minimum length, for common passwords and for one character repeated', () => {
    for (const value of ['abc', 'Sh0rt!', 'password', 'Password1!', 'qwerty123', 'letmein!!', 'aaaaaaaaaaaa', '!!!!!!!!']) assert.equal(strength(value), 1, value);
    assert.equal(strength('devices42', { minLength: 12 }), 1);
  });

  it('counts runs and repeats for little', () => {
    for (const value of ['12345678', 'abcdefgh', 'qwertyuiop', 'asdfghjkl', 'abcabcabc']) assert.ok(strength(value) <= 2, value);
  });

  it('grows with length and variety', () => {
    assert.equal(strength('devices42'), 2);
    assert.equal(strength('Tr0ub4dor&3'), 3);
    assert.equal(strength('correct horse battery staple'), 4);
    assert.equal(strength('xK9#mQ2$vL7!pR4&'), 4);
    assert.ok(strength('Laptop-0042-Room') >= strength('laptop0042room'));
  });
});

describe('DS.password.create', () => {
  it('returns a controller that does nothing without an input', () => {
    const made = create({ querySelector: () => null, getAttribute: () => null });
    assert.deepEqual(made.get(), { revealed: false, strength: 0, capsLock: false });
    made.set({ revealed: true });
    made.destroy();
  });
});
