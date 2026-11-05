/**
 * DS.copy without a DOM: copy() through the Clipboard API, through the copy
 * command when the API is missing or refuses, and nothing when both fail;
 * textOf() from a value, a target or the value beside the button; the
 * registration and the strings. The browser side is copy.spec.js.
 */
import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { copy, textOf } from './copy.js';
import { runtime } from '../../js/core.js';
import { read } from '../../../test/helpers.js';

const navigatorBefore = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

afterEach(() => {
  if (navigatorBefore) Object.defineProperty(globalThis, 'navigator', navigatorBefore);
});

function withClipboard(clipboard) {
  Object.defineProperty(globalThis, 'navigator', { value: { clipboard }, configurable: true, writable: true });
}

/** A stand-in document whose copy command answers `answer`. */
function fakeDoc(answer) {
  const made = [];
  return {
    made,
    activeElement: null,
    body: { append(node) { made.push(node); } },
    documentElement: {},
    createElement() {
      return {
        style: {},
        value: '',
        setAttribute() {},
        select() {},
        setSelectionRange() {},
        remove() { this.removed = true; },
      };
    },
    execCommand(name) {
      this.command = name;
      return answer;
    },
  };
}

describe('DS.copy.copy', () => {
  it('writes through the Clipboard API where it works', async () => {
    let written = null;
    withClipboard({ writeText: (text) => { written = text; return Promise.resolve(); } });
    const doc = fakeDoc(true);
    assert.deepEqual(await copy('ak_live_42', { doc }), { ok: true, method: 'clipboard' });
    assert.equal(written, 'ak_live_42');
    assert.equal(doc.command, undefined, 'no copy command');
  });

  it('falls back to the copy command when the API refuses or is missing, and cleans up', async () => {
    withClipboard({ writeText: () => Promise.reject(new Error('NotAllowedError')) });
    const doc = fakeDoc(true);
    assert.deepEqual(await copy('LAPTOP-0042', { doc }), { ok: true, method: 'command' });
    assert.equal(doc.command, 'copy');
    assert.equal(doc.made[0].value, 'LAPTOP-0042');
    assert.equal(doc.made[0].removed, true);
    withClipboard(undefined);
    assert.deepEqual(await copy('LAPTOP-0042', { doc: fakeDoc(true) }), { ok: true, method: 'command' });
  });

  it('resolves, never rejects, when nothing works', async () => {
    withClipboard({ writeText: () => { throw new Error('blocked'); } });
    assert.deepEqual(await copy('x', { doc: fakeDoc(false) }), { ok: false, method: 'none' });
    assert.deepEqual(await copy('x', { doc: {} }), { ok: false, method: 'none' });
  });
});

describe('DS.copy.textOf', () => {
  const button = (attributes, near = null) => ({
    attributes,
    getAttribute(name) { return this.attributes[name] ?? null; },
    hasAttribute(name) { return name in this.attributes; },
    getRootNode() { return { querySelector: (selector) => (selector === '#key' ? { tagName: 'CODE', textContent: '  ak_live_42 ' } : null) }; },
    ownerDocument: { getElementById: (id) => (id === 'field' ? { tagName: 'INPUT', value: 'https://example.com' } : null) },
    closest: () => (near ? { querySelector: () => near } : null),
  });

  it('reads the value first, then the target, then the value beside it', () => {
    assert.equal(textOf(button({ 'data-ds-copy': '#key', 'data-ds-copy-value': 'own' })), 'own');
    assert.equal(textOf(button({ 'data-ds-copy': '#key' })), 'ak_live_42');
    assert.equal(textOf(button({ 'data-ds-copy': 'field' })), 'https://example.com', 'an id, and a field\'s value');
    assert.equal(textOf(button({ 'data-ds-copy': '' }, { tagName: 'CODE', textContent: 'T-4127' })), 'T-4127');
    assert.equal(textOf(button({ 'data-ds-copy': '' })), '');
  });
});

describe('DS.copy', () => {
  it('registers its behaviour by its attribute', () => {
    assert.equal(runtime.state('core').specs.get('copy').attribute, 'data-ds-copy');
  });

  it('says its words through t(), holds on the token and names the keys of the platform', () => {
    const source = read('src/components/copy/copy.js').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const key of ['copy', 'copied', 'copyManual']) assert.match(source, new RegExp(`t\\('${key}'`));
    assert.match(source, /motionDuration\(button, '--ds-hold-status'\)/);
    assert.match(source, /formatKeys\('mod\+c'\)/);
  });
});
