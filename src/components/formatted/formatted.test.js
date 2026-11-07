/**
 * DS.formatted: the text and the tip of every kind, and the controller on a
 * stand-in element (no DOM in Node). The browser side is formatted.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { create, exact, text } from './formatted.js';

const L = { locale: 'en-US' };

/** Intl puts narrow and non-breaking spaces between a figure and its unit. */
const n = (value) => String(value).replace(/[\u00a0\u202f]/g, ' ');

function stub(content = '', attributes = {}) {
  return {
    textContent: content,
    childNodes: [],
    attributes: { ...attributes },
    getAttribute(name) { return this.attributes[name] ?? null; },
    hasAttribute(name) { return name in this.attributes; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    removeAttribute(name) { delete this.attributes[name]; },
    dispatchEvent() { return true; },
  };
}

describe('DS.formatted.text', () => {
  it('writes every kind through Intl', () => {
    assert.equal(n(text(1234.5678, L)), '1,234.568');
    assert.equal(n(text(1234.5678, { ...L, digits: 1 })), '1,234.6');
    assert.equal(n(text(1284902, { ...L, kind: 'compact' })), '1.3M');
    assert.equal(n(text(1284902, { ...L, kind: 'compact', style: 'long' })), '1.3 million');
    assert.equal(n(text(0.4213, { ...L, kind: 'percent' })), '42.1%');
    assert.equal(n(text(0.042, { ...L, kind: 'percent', signed: true })), '+4.2%');
    assert.equal(n(text(-0.042, { ...L, kind: 'percent', signed: true })), '-4.2%');
    assert.equal(n(text(1234.5, { ...L, kind: 'currency', currency: 'eur' })), '€1,234.50');
    assert.equal(n(text(1536, { ...L, kind: 'bytes' })), '1.5 kB');
    assert.equal(n(text(1536, { ...L, kind: 'bytes', base: '1024' })), '1.5 KiB');
    assert.equal(n(text(3725000, { ...L, kind: 'duration' })), '1 hr, 2 min');
    assert.equal(n(text(3725000, { ...L, kind: 'duration', style: 'clock' })), '1:02:05');
  });

  it('reads a text value, and is empty for what is no number; an unknown kind is a number', () => {
    assert.equal(n(text(' 42 ', L)), '42');
    for (const value of ['', 'many', null, undefined, NaN, Infinity]) assert.equal(n(text(value, L)), '', String(value));
    assert.equal(n(text(42, { ...L, kind: 'weight' })), '42');
  });

  it('falls back to the number for a currency code Intl refuses', () => {
    assert.equal(n(text(12, { ...L, kind: 'currency', currency: 'not a code' })), '12');
  });
});

describe('DS.formatted.exact', () => {
  it('gives the exact value where the text rounds it, else nothing', () => {
    assert.equal(n(exact(1536, { ...L, kind: 'bytes' })), '1,536 bytes');
    assert.equal(n(exact(1284902, { ...L, kind: 'compact' })), '1,284,902');
    assert.equal(n(exact(3725000, { ...L, kind: 'duration' })), '1 hour, 2 minutes, 5 seconds');
    assert.equal(n(exact(0.42137, { ...L, kind: 'percent' })), '42.137%');
    assert.equal(n(exact(0.042, { ...L, kind: 'percent', signed: true })), '');
    assert.equal(n(exact(1234.5, { ...L, kind: 'currency', currency: 'EUR' })), '');
    assert.equal(n(exact(42, L)), '');
    assert.equal(n(exact('none', L)), '');
  });
});

describe('DS.formatted.create', () => {
  it('formats the text it finds, writes the tip, and set() writes a new value with ds:change', () => {
    const el = stub('1536');
    const events = [];
    el.dispatchEvent = (event) => { events.push(event.type); return true; };
    const value = create(el, { kind: 'bytes', locale: 'en-US' });
    assert.equal(n(el.textContent), '1.5 kB');
    assert.equal(el.attributes['data-tip'], '1,536 bytes');
    const seen = [];
    value.on('change', (detail) => seen.push(detail.text));
    value.set(2048);
    assert.equal(n(el.textContent), '2 kB');
    assert.deepEqual(seen.map(n), ['2 kB']);
    assert.deepEqual({ ...value.get(), text: n(value.get().text) }, { value: 2048, text: '2 kB' });
    if (typeof CustomEvent === 'function') assert.deepEqual(events, ['ds:change']);
    value.destroy();
    assert.equal(el.attributes['data-tip'], undefined);
    assert.equal(n(el.textContent), '2 kB');
  });

  it('reads data-ds-value before the text, and set() writes it back', () => {
    const el = stub('', { 'data-ds-value': '0.5' });
    const value = create(el, { kind: 'percent', locale: 'en-US' });
    assert.equal(el.textContent, '50%');
    value.set(0.25);
    assert.equal(el.attributes['data-ds-value'], '0.25');
    assert.equal(el.textContent, '25%');
  });

  it('keeps a tip the page wrote, and writes none with tip: false', () => {
    const own = stub('1536', { 'data-tip': 'Disk of the printer' });
    create(own, { kind: 'bytes', locale: 'en-US' });
    assert.equal(own.attributes['data-tip'], 'Disk of the printer');
    const off = stub('1536');
    create(off, { kind: 'bytes', tip: false, locale: 'en-US' });
    assert.equal(off.attributes['data-tip'], undefined);
  });

  it('leaves a text that is no number alone', () => {
    const el = stub('n/a');
    create(el, { kind: 'bytes', locale: 'en-US' });
    assert.equal(el.textContent, 'n/a');
  });
});
