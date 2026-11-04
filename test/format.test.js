/**
 * DS.format (src/js/format.js) without a DOM: the Intl wrappers in a fixed
 * locale, relative time with a fixed `now`, the shared clock on mocked
 * timers, and data-ds-time on a small fake element. The real engines run it
 * in test/browser/format.spec.js.
 */
import { describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import * as format from '../src/js/format.js';
import { config, runtime } from '../src/js/core.js';

const en = { locale: 'en-US' };
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Non-breaking and narrow spaces read as spaces: engines differ in them. */
const plain = (text) => text.replace(/[  ]/g, ' ');

describe('numbers', () => {
  it('formats through Intl with the options passed on', () => {
    assert.equal(format.number(1234.5, en), '1,234.5');
    assert.equal(format.number(1234.5, { locale: 'de-DE' }), '1.234,5');
    assert.equal(format.number(0.126, { ...en, maximumFractionDigits: 1 }), '0.1');
    assert.equal(format.number(12345678901234567890n, en), '12,345,678,901,234,567,890');
    assert.equal(format.number('42', en), '42');
  });

  it('gives `empty` for what is no number, and never throws on it', () => {
    for (const value of [null, undefined, '', 'many', NaN]) {
      assert.equal(format.number(value, en), '');
      assert.equal(format.number(value, { ...en, empty: '-' }), '-');
      assert.equal(format.percent(value, { ...en, empty: '-' }), '-');
      assert.equal(format.bytes(value, { ...en, empty: '-' }), '-');
      assert.equal(format.duration(value, { ...en, empty: '-' }), '-');
      assert.equal(format.currency(value, 'EUR', { ...en, empty: '-' }), '-');
    }
    assert.equal(format.number(0, en), '0');
  });

  it('takes a share as a percentage and a code as a currency', () => {
    assert.equal(format.percent(0.42, en), '42%');
    assert.equal(format.percent(0.426, { ...en, maximumFractionDigits: 1 }), '42.6%');
    assert.equal(format.currency(19.9, 'USD', en), '$19.90');
    assert.equal(plain(format.currency(19.9, 'EUR', { locale: 'de-DE' })), '19,90 €');
    assert.throws(() => format.currency(1, 'not a code', en), RangeError, 'a developer mistake still throws');
  });

  it('a locale the engine refuses counts as none, and config() supplies the default', () => {
    assert.equal(typeof format.number(1, { locale: 'not_a_locale!' }), 'string');
    const before = config().locale;
    config({ locale: 'de-DE' });
    try {
      assert.equal(format.number(1234.5), '1.234,5');
      assert.equal(format.number(1234.5, en), '1,234.5', 'a call may override it');
    } finally {
      config({ locale: before === 'de-DE' ? null : null });
    }
  });
});

describe('bytes', () => {
  it('takes the largest unit that keeps a figure of at least 1', () => {
    assert.equal(plain(format.bytes(0, en)), '0 byte');
    assert.equal(plain(format.bytes(999, en)), '999 byte');
    assert.equal(plain(format.bytes(1536, en)), '1.5 kB');
    assert.equal(plain(format.bytes(1500000, en)), '1.5 MB');
    assert.equal(plain(format.bytes(-1536, en)), '-1.5 kB');
    assert.equal(plain(format.bytes(1e30, en)), '1,000,000,000,000,000 PB');
  });

  it('a figure that rounds up to the next unit takes it', () => {
    assert.equal(plain(format.bytes(999960, en)), '1 MB');
    assert.equal(plain(format.bytes(1048575, { ...en, base: 1024 })), '1 MiB');
  });

  it('base 1024 uses the binary symbols, in the locale\'s digits', () => {
    assert.equal(plain(format.bytes(1536, { ...en, base: 1024 })), '1.5 KiB');
    assert.equal(plain(format.bytes(1536, { locale: 'de-DE', base: 1024 })), '1,5 KiB');
    assert.equal(plain(format.bytes(512, { ...en, base: 1024 })), '512 B');
  });

  it('takes the fraction digits and a minimum above the default', () => {
    assert.equal(plain(format.bytes(1536, { ...en, maximumFractionDigits: 0 })), '2 kB');
    assert.equal(plain(format.bytes(1536, { ...en, minimumFractionDigits: 2 })), '1.54 kB');
    assert.equal(plain(format.bytes(12, { ...en, minimumFractionDigits: 2 })), '12.00 byte');
  });
});

describe('duration', () => {
  it('shows two units by default, the last one rounded', () => {
    assert.equal(plain(format.duration(3725000, en)), '1 hr, 2 min');
    assert.equal(plain(format.duration(90 * SECOND, en)), '1 min, 30 sec');
    assert.equal(plain(format.duration(2 * DAY + 5 * HOUR, en)), '2 days, 5 hr');
  });

  it('leaves zero units out and rounding carries', () => {
    assert.equal(plain(format.duration(HOUR, en)), '1 hr');
    assert.equal(plain(format.duration(HOUR - 300, en)), '1 hr', '59 min 59.7 s to two units');
    assert.equal(plain(format.duration(0, en)), '0 sec');
    assert.equal(plain(format.duration(400, en)), '400 ms');
    assert.equal(plain(format.duration(999.8, en)), '1 sec');
  });

  it('takes style, parts and smallest', () => {
    assert.equal(plain(format.duration(3725000, { ...en, style: 'long' })), '1 hour, 2 minutes');
    assert.equal(plain(format.duration(3725000, { ...en, style: 'narrow' })), '1h 2m');
    assert.equal(plain(format.duration(3725000, { ...en, parts: 3 })), '1 hr, 2 min, 5 sec');
    assert.equal(plain(format.duration(3725000, { ...en, parts: 1 })), '1 hr');
    assert.equal(plain(format.duration(20 * SECOND, { ...en, smallest: 'minute' })), '0 min');
    assert.equal(plain(format.duration(40 * SECOND, { ...en, smallest: 'minute' })), '1 min');
    assert.equal(plain(format.duration(400, { ...en, smallest: 'second' })), '0 sec');
  });

  it('shows a clock', () => {
    assert.equal(format.duration(3725000, { ...en, style: 'clock' }), '1:02:05');
    assert.equal(format.duration(125000, { ...en, style: 'clock' }), '2:05');
    assert.equal(format.duration(5000, { ...en, style: 'clock' }), '0:05');
    assert.equal(format.duration(100 * HOUR, { ...en, style: 'clock' }), '100:00:00');
  });

  it('puts the sign on the first unit, and an infinity gives `empty`', () => {
    assert.equal(plain(format.duration(-3725000, en)), '-1 hr, 2 min');
    assert.equal(format.duration(-5000, { ...en, style: 'clock' }), '-0:05');
    assert.equal(format.duration(Infinity, { ...en, empty: '-' }), '-');
  });
});

describe('list and plural', () => {
  it('joins items through Intl.ListFormat, without the empty ones', () => {
    assert.equal(format.list(['Ada', 'Grace', 'Joan'], en), 'Ada, Grace, and Joan');
    assert.equal(format.list(['Ada', null, '', 'Joan'], en), 'Ada and Joan');
    assert.equal(format.list(['Ada', 'Grace'], { ...en, type: 'disjunction' }), 'Ada or Grace');
    assert.equal(format.list(new Set(['Ada']), en), 'Ada');
    assert.equal(format.list([], { ...en, empty: 'nobody' }), 'nobody');
    assert.equal(format.list(null, en), '');
  });

  it('picks the exact form, then the category, then other', () => {
    const forms = { '=0': 'No devices', one: '{count} device', other: '{count} devices' };
    assert.equal(format.plural(0, forms, en), 'No devices');
    assert.equal(format.plural(1, forms, en), '1 device');
    assert.equal(format.plural(1234, forms, en), '1,234 devices');
    assert.equal(format.plural(2, { other: '{count} x' }, en), '2 x');
    assert.equal(format.plural(2, { one: 'one' }, { ...en, empty: 'none' }), 'none');
  });

  it('knows the categories of the locale, ordinals and form functions', () => {
    const forms = { one: 'jeden', few: 'kilka', many: 'wiele', other: 'inne' };
    assert.equal(format.plural(3, forms, { locale: 'pl' }), 'kilka');
    assert.equal(format.plural(5, forms, { locale: 'pl' }), 'wiele');
    const ordinal = { one: '{count}st', two: '{count}nd', few: '{count}rd', other: '{count}th' };
    assert.equal(format.plural(22, ordinal, { ...en, type: 'ordinal' }), '22nd');
    assert.equal(format.plural(3, { other: ({ count, formatted }) => `${count}/${formatted}` }, en), '3/3');
  });
});

describe('dates', () => {
  const now = Date.UTC(2026, 10, 4, 12);

  it('takes the largest fitting unit, cut to whole units', () => {
    const at = (ms) => format.relative(now + ms, { ...en, now });
    assert.equal(at(-3 * MINUTE), '3 minutes ago');
    assert.equal(at(-59 * MINUTE - 59 * SECOND), '59 minutes ago');
    assert.equal(at(2 * HOUR), 'in 2 hours');
    assert.equal(at(-30 * SECOND), '30 seconds ago');
    assert.equal(at(-400 * DAY), 'last year');
    assert.equal(at(-14 * DAY), '2 weeks ago');
  });

  it('numeric auto says the words, always the numbers', () => {
    assert.equal(format.relative(now, { ...en, now }), 'now');
    assert.equal(format.relative(now - DAY, { ...en, now }), 'yesterday');
    assert.equal(format.relative(now - DAY, { ...en, now, numeric: 'always' }), '1 day ago');
    assert.equal(format.relative(now, { ...en, now, numeric: 'always' }), 'in 0 seconds');
  });

  it('smallest and largest limit the unit', () => {
    assert.equal(format.relative(now - 30 * SECOND, { ...en, now, smallest: 'minute', numeric: 'always' }), '0 minutes ago');
    assert.equal(format.relative(now - 14 * DAY, { ...en, now, largest: 'day' }), '14 days ago');
    assert.equal(format.relative(now - 3 * HOUR, { ...en, now, smallest: 'hour', largest: 'hour' }), '3 hours ago');
    assert.equal(format.relative(now - 3 * DAY, { ...en, now, smallest: 'hour', largest: 'hour' }), '72 hours ago');
  });

  it('reads a Date, a timestamp and a text; what is no date gives `empty`', () => {
    assert.equal(format.relative(new Date(now - MINUTE), { ...en, now }), '1 minute ago');
    assert.equal(format.relative(new Date(now - MINUTE).toISOString(), { ...en, now }), '1 minute ago');
    assert.equal(format.relative('soon', { ...en, now, empty: '-' }), '-');
    assert.equal(format.absolute(null, { ...en, empty: '-' }), '-');
  });

  it('absolute defaults to a medium date and a short time, and takes options', () => {
    const utc = { ...en, timeZone: 'UTC' };
    assert.equal(plain(format.absolute(now, utc)), 'Nov 4, 2026, 12:00 PM');
    assert.equal(format.absolute(now, { ...utc, dateStyle: 'short' }), '11/4/26');
    assert.equal(format.absolute(now, { ...utc, year: 'numeric' }), '2026');
  });
});

describe('the shared clock', () => {
  afterEach(() => mock.timers.reset());

  it('lives in runtime.state and has one timer however many clients', () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    const state = runtime.state('format');
    const a = [];
    const b = [];
    const offA = format.clock((now) => {
      a.push(now);
      return 2 * MINUTE;
    });
    const offB = format.clock((now) => {
      b.push(now);
      return 5 * MINUTE;
    });
    assert.equal(state.clients.size, 2);
    assert.equal(a.length, 1, 'it runs at once');
    mock.timers.tick(MINUTE);
    assert.equal(a.length, 1, 'nothing is due yet');
    mock.timers.tick(MINUTE);
    assert.equal(a.length, 2, 'the soonest client wakes the clock');
    assert.equal(b.length, 1, 'a client not due stays asleep');
    mock.timers.tick(3 * MINUTE);
    assert.equal(b.length, 2);
    offA();
    offB();
    assert.equal(state.clients.size, 0);
    assert.equal(state.timer, null, 'no client, no timer');
  });

  it('a client that returns nothing runs every second; one that throws does not stop the others', () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    const reported = [];
    const before = globalThis.reportError;
    globalThis.reportError = (error) => reported.push(error);
    let runs = 0;
    let bad = 0;
    const off = format.clock(() => {
      runs += 1;
    });
    const offBad = format.clock(() => {
      bad += 1;
      if (bad > 1) throw new Error('boom');
    });
    for (let second = 0; second < 3; second += 1) mock.timers.tick(SECOND);
    globalThis.reportError = before;
    off();
    offBad();
    assert.equal(runs, 4);
    assert.equal(bad, 4);
    assert.equal(reported.length, 3);
  });

  it('never spins on a client that returns 0', () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    let runs = 0;
    const off = format.clock(() => {
      runs += 1;
      return 0;
    });
    mock.timers.tick(SECOND);
    off();
    assert.ok(runs <= 6, `at most five wakes a second, was ${runs - 1}`);
  });

  it('sleeps while the page is hidden and runs everything on return', () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    const listeners = new Map();
    const before = globalThis.document;
    const doc = {
      visibilityState: 'visible',
      addEventListener: (type, fn) => listeners.set(type, fn),
      removeEventListener: (type) => listeners.delete(type),
    };
    globalThis.document = doc;
    try {
      let runs = 0;
      const off = format.clock(() => {
        runs += 1;
        return MINUTE;
      });
      assert.equal(runs, 1);
      doc.visibilityState = 'hidden';
      listeners.get('visibilitychange')();
      mock.timers.tick(10 * MINUTE);
      assert.equal(runs, 1, 'no wake while hidden');
      doc.visibilityState = 'visible';
      listeners.get('visibilitychange')();
      assert.equal(runs, 2, 'on return at once');
      off();
      assert.equal(listeners.size, 0, 'the listener goes with the last client');
    } finally {
      globalThis.document = before;
    }
  });
});

/** A small element: attributes, one text node, connected. */
function fakeElement(attributes = {}, localName = 'time') {
  const attrs = new Map(Object.entries(attributes));
  const text = { nodeType: 3, nodeValue: 'markup' };
  return {
    localName,
    ownerDocument: { defaultView: {} },
    isConnected: true,
    childNodes: [text],
    firstChild: text,
    get textContent() {
      return text.nodeValue;
    },
    set textContent(value) {
      text.nodeValue = value;
    },
    getAttribute: (name) => attrs.get(name) ?? null,
    hasAttribute: (name) => attrs.has(name),
    setAttribute: (name, value) => attrs.set(name, String(value)),
    removeAttribute: (name) => attrs.delete(name),
  };
}

describe('time(el)', () => {
  const saved = { locale: null };
  afterEach(() => {
    mock.timers.reset();
    config({ locale: saved.locale });
  });

  it('writes the relative text and the absolute tip, and wakes when the text changes', () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'], now: Date.UTC(2026, 10, 4, 12) });
    config({ locale: 'en-US' });
    const el = fakeElement({ datetime: new Date(Date.now() - 3 * MINUTE - 5 * SECOND).toISOString() });
    const controller = format.time(el);
    assert.equal(el.textContent, '3 minutes ago');
    assert.ok(el.getAttribute('data-tip'), 'the absolute date is in data-tip');
    assert.equal(format.time(el), controller, 'once per element');
    const texts = [];
    const off = controller.on('change', ({ text }) => texts.push(text));
    mock.timers.tick(54 * SECOND);
    assert.equal(el.textContent, '3 minutes ago');
    mock.timers.tick(SECOND);
    assert.equal(el.textContent, '4 minutes ago');
    assert.deepEqual(texts, ['4 minutes ago']);
    off();
    controller.destroy();
    controller.destroy();
    assert.equal(el.getAttribute('data-tip'), null);
    assert.notEqual(format.time(el), controller, 'after destroy() a new controller');
    format.time(el).destroy();
  });

  it('counts a future time down to its boundaries', () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'], now: Date.UTC(2026, 10, 4, 12) });
    config({ locale: 'en-US' });
    const el = fakeElement({ datetime: new Date(Date.now() + 2 * MINUTE + 30 * SECOND).toISOString() });
    const controller = format.time(el);
    assert.equal(el.textContent, 'in 2 minutes');
    mock.timers.tick(31 * SECOND);
    assert.equal(el.textContent, 'in 1 minute');
    controller.destroy();
  });

  it('keeps the page\'s data-tip, and data-ds-time-tip="off" writes none', () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    const own = fakeElement({ datetime: new Date().toISOString(), 'data-tip': 'Mine' });
    const off = fakeElement({ datetime: new Date().toISOString(), 'data-ds-time-tip': 'off' });
    const a = format.time(own);
    const b = format.time(off);
    assert.equal(own.getAttribute('data-tip'), 'Mine');
    assert.equal(off.getAttribute('data-tip'), null);
    a.destroy();
    b.destroy();
    assert.equal(own.getAttribute('data-tip'), 'Mine', 'destroy() leaves what it did not write');
  });

  it('reads its options from the attributes and takes a new date through set()', () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'], now: Date.UTC(2026, 10, 4, 12) });
    config({ locale: 'en-US' });
    const el = fakeElement({ 'data-ds-time': new Date(Date.now() - 30 * SECOND).toISOString(), 'data-ds-time-smallest': 'minute', 'data-ds-time-numeric': 'always' }, 'span');
    const controller = format.time(el);
    assert.equal(el.textContent, '0 minutes ago');
    controller.set(Date.now() - 2 * HOUR);
    assert.equal(el.textContent, '2 hours ago');
    assert.equal(controller.get().value.getTime(), Date.now() - 2 * HOUR);
    controller.destroy();
  });

  it('without a date it keeps the text, and a controller whose element left stops', () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    const state = runtime.state('format');
    const before = state.clients.size;
    const el = fakeElement({ datetime: 'not a date' });
    const controller = format.time(el);
    assert.equal(el.textContent, 'markup');
    assert.equal(el.getAttribute('data-tip'), null);
    assert.equal(state.clients.size, before + 1);
    el.isConnected = false;
    mock.timers.tick(2 * HOUR);
    assert.equal(state.clients.size, before);
    controller.destroy();
  });

  it('does nothing without an element', () => {
    const idle = format.time(null);
    assert.deepEqual(idle.get(), { value: null, text: '' });
    idle.set(1);
    idle.destroy();
  });
});
