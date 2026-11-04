/**
 * DS.store (src/js/store.js) on a fake Storage: namespaces, JSON, the memory
 * fallback when storage throws or refuses, change events and what another tab
 * sends through `storage` events. The real engines run it in
 * test/browser/store.spec.js.
 */
import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as store from '../src/js/store.js';
import { runtime } from '../src/js/core.js';

function fakeStorage({ refuse = false, block = false } = {}) {
  const map = new Map();
  const guard = () => {
    if (block) throw new Error('blocked');
  };
  return {
    map,
    refuse,
    get length() {
      guard();
      return map.size;
    },
    key: (index) => {
      guard();
      return [...map.keys()][index] ?? null;
    },
    getItem(key) {
      guard();
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      guard();
      if (this.refuse) throw new Error('quota');
      map.set(key, String(value));
    },
    removeItem(key) {
      guard();
      map.delete(key);
    },
  };
}

const shared = runtime.state('store');

/** Handles count: the `storage` listener stays while one is open, so every test gives its own back. */
const opened = [];
const open = (...args) => {
  const handle = store.open(...args);
  opened.push(handle);
  return handle;
};

afterEach(() => {
  for (const handle of opened.splice(0)) handle.destroy();
  shared.memory.clear();
  assert.equal(shared.handles.size, 0);
  assert.equal(shared.listeners.size, 0);
});

describe('DS.open()', () => {
  it('stores JSON under ds:<namespace>:<key>, and each namespace has its own', () => {
    const storage = fakeStorage();
    const a = open('a', { storage });
    const b = open('b', { storage });
    a.set('columns', ['name', 'status']);
    a.set('width', 320);
    assert.equal(storage.map.get('ds:a:columns'), '["name","status"]');
    assert.deepEqual(a.get('columns'), ['name', 'status']);
    assert.equal(a.get('width'), 320);
    assert.equal(b.get('columns'), undefined);
    assert.deepEqual(a.keys(), ['columns', 'width']);
    assert.deepEqual(b.keys(), []);
    b.set('columns', []);
    a.clear();
    assert.deepEqual(a.keys(), []);
    assert.deepEqual(b.get('columns'), []);
  });

  it('gives the fallback while nothing is stored, but a stored false or null is a value', () => {
    const prefs = open('n', { storage: fakeStorage() });
    assert.equal(prefs.get('x', 7), 7);
    prefs.set('x', false);
    assert.equal(prefs.get('x', 7), false);
    prefs.set('x', null);
    assert.equal(prefs.get('x', 7), null);
    prefs.set('x', undefined);
    assert.equal(prefs.get('x', 7), 7, 'undefined removes');
  });

  it('reads what it cannot parse as not stored', () => {
    const storage = fakeStorage();
    storage.map.set('ds:n:x', '{oops');
    assert.equal(open('n', { storage }).get('x', 'fallback'), 'fallback');
  });

  it('refuses a namespace with a colon or none: it would collide with a key', () => {
    for (const name of ['a:b', '', null, 3]) assert.throws(() => open(name), TypeError);
  });
});

describe('the memory fallback', () => {
  it('holds a value storage refused, until storage takes one again', () => {
    const storage = fakeStorage({ refuse: true });
    const prefs = open('n', { storage });
    prefs.set('x', 1);
    assert.equal(storage.map.size, 0);
    assert.equal(prefs.get('x'), 1);
    assert.deepEqual(prefs.keys(), ['x']);
    storage.refuse = false;
    prefs.set('x', 2);
    assert.equal(storage.map.get('ds:n:x'), '2');
    assert.equal(shared.memory.size, 0, 'memory lets go once storage has it');
    assert.equal(prefs.get('x'), 2);
  });

  it('works when every storage call throws', () => {
    const prefs = open('n', { storage: fakeStorage({ block: true }) });
    assert.equal(prefs.get('x', 'f'), 'f');
    prefs.set('x', 1);
    assert.equal(prefs.get('x'), 1);
    assert.deepEqual(prefs.keys(), ['x']);
    prefs.remove('x');
    assert.equal(prefs.get('x', 'f'), 'f');
  });

  it('works with no storage at all', () => {
    const prefs = open('n', { storage: null });
    prefs.set('x', { a: 1 });
    assert.deepEqual(prefs.get('x'), { a: 1 });
    assert.equal(store.available({ storage: null }), false);
  });

  it('keeps the values of each storage apart', () => {
    const local = open('n', { storage: fakeStorage({ refuse: true }) });
    const session = open('n', { storage: fakeStorage({ refuse: true }) });
    const memory = open('n', { storage: null });
    local.set('x', 'local');
    session.set('x', 'session');
    assert.equal(local.get('x'), 'local');
    assert.equal(session.get('x'), 'session');
    assert.equal(memory.get('x', 'none'), 'none');
    assert.deepEqual(memory.keys(), []);
    session.remove('x');
    assert.equal(local.get('x'), 'local');
  });

  it('available() says whether a write reaches storage and leaves nothing behind', () => {
    const storage = fakeStorage();
    assert.equal(store.available({ storage }), true);
    assert.equal(storage.map.size, 0);
    assert.equal(store.available({ storage: fakeStorage({ refuse: true }) }), false);
    assert.equal(store.available({ storage: fakeStorage({ block: true }) }), false);
  });
});

describe('change events', () => {
  it('tells the namespace\'s listeners of a change, not of the same value', () => {
    const storage = fakeStorage();
    const a = open('a', { storage });
    const also = open('a', { storage });
    const other = open('b', { storage });
    const seen = [];
    const others = [];
    const off = also.on('change', (detail) => seen.push(detail));
    other.on('change', (detail) => others.push(detail));
    a.set('x', 1);
    a.set('x', 1);
    a.set('x', 2);
    a.remove('x');
    a.remove('x');
    assert.deepEqual(seen, [
      { namespace: 'a', key: 'x', value: 1, previous: undefined, external: false },
      { namespace: 'a', key: 'x', value: 2, previous: 1, external: false },
      { namespace: 'a', key: 'x', value: undefined, previous: 2, external: false },
    ]);
    assert.deepEqual(others, []);
    off();
    a.set('x', 3);
    assert.equal(seen.length, 3);
  });

  it('a listener that throws is reported and the others still run', () => {
    const before = globalThis.reportError;
    const reported = [];
    globalThis.reportError = (error) => reported.push(error);
    const prefs = open('n', { storage: fakeStorage() });
    const seen = [];
    prefs.on('change', () => {
      throw new Error('boom');
    });
    prefs.on('change', (detail) => seen.push(detail.key));
    prefs.set('x', 1);
    globalThis.reportError = before;
    prefs.destroy();
    assert.equal(reported.length, 1);
    assert.deepEqual(seen, ['x']);
  });

  describe('from another tab', () => {
    const listeners = new Map();
    const original = {
      add: globalThis.addEventListener,
      remove: globalThis.removeEventListener,
    };
    const fire = (detail) => listeners.get('storage')?.(detail);

    function listen() {
      globalThis.addEventListener = (type, fn) => listeners.set(type, fn);
      globalThis.removeEventListener = (type) => listeners.delete(type);
    }

    afterEach(() => {
      globalThis.addEventListener = original.add;
      globalThis.removeEventListener = original.remove;
      listeners.clear();
    });

    it('arrives as external, parsed, in its namespace only', () => {
      listen();
      const storage = fakeStorage();
      const a = open('a', { storage });
      const seen = [];
      a.on('change', (detail) => seen.push(detail));
      fire({ key: 'ds:a:x', newValue: '5', oldValue: '4', storageArea: storage });
      fire({ key: 'ds:a:deep:key', newValue: 'true', oldValue: null, storageArea: storage });
      fire({ key: 'ds:b:x', newValue: '5', oldValue: null, storageArea: storage });
      fire({ key: 'someone-else', newValue: '5', oldValue: null, storageArea: storage });
      fire({ key: 'ds:a:y', newValue: '5', oldValue: null, storageArea: fakeStorage() });
      fire({ key: 'ds:__probe__', newValue: '1', oldValue: null, storageArea: storage });
      assert.deepEqual(seen, [
        { namespace: 'a', key: 'x', value: 5, previous: 4, external: true },
        { namespace: 'a', key: 'deep:key', value: true, previous: undefined, external: true },
      ]);
      a.destroy();
      assert.equal(listeners.has('storage'), false);
    });

    it('is heard from the first open() until the last destroy(), without an on()', () => {
      listen();
      const before = globalThis.document;
      const told = [];
      globalThis.document = { dispatchEvent: (event) => told.push(event.detail.key) };
      try {
        const storage = fakeStorage();
        const first = open('a', { storage });
        assert.equal(listeners.has('storage'), true, 'open() listens');
        const second = open('b', { storage });
        fire({ key: 'ds:a:x', newValue: '5', oldValue: null, storageArea: storage });
        assert.deepEqual(told, ['x'], 'ds:store with no listener of its own');
        fire({ key: null, newValue: null, oldValue: null, storageArea: storage });
        assert.deepEqual(told, ['x', null, null], 'a clear elsewhere tells each open namespace, once');
        first.destroy();
        first.destroy();
        assert.equal(listeners.has('storage'), true, 'a handle is still open, and destroy() counts once');
        second.destroy();
        assert.equal(listeners.has('storage'), false);
        assert.equal(shared.stop, null);
      } finally {
        globalThis.document = before;
      }
    });

    it('a newer value from another tab replaces one only this page kept', () => {
      listen();
      const storage = fakeStorage({ refuse: true });
      const a = open('a', { storage });
      a.set('x', 'mine');
      a.on('change', () => {});
      storage.map.set('ds:a:x', '"theirs"');
      fire({ key: 'ds:a:x', newValue: '"theirs"', oldValue: null, storageArea: storage });
      assert.equal(a.get('x'), 'theirs');
      a.destroy();
    });

    it('localStorage.clear() elsewhere arrives once per namespace as key null', () => {
      listen();
      const storage = fakeStorage();
      const a = open('a', { storage });
      const b = open('b', { storage });
      const seen = [];
      a.on('change', (detail) => seen.push(detail));
      a.on('change', () => {});
      b.on('change', (detail) => seen.push(detail));
      fire({ key: null, newValue: null, oldValue: null, storageArea: storage });
      assert.deepEqual(seen.map((detail) => [detail.namespace, detail.key, detail.external]), [['a', null, true], ['b', null, true]]);
      a.destroy();
      b.destroy();
    });
  });
});
