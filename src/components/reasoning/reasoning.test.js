/**
 * DS.reasoning: the summary line it writes. The clock, the open and close
 * and the follow are reasoning.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../../js/core.js';
import { create, summaryText } from './reasoning.js';

/**
 * A stand-in element that records its listeners: one is live until its
 * signal aborts (one without a signal stays for good).
 */
function fakeElement(attributes = {}, extra = {}) {
  const added = [];
  const attrs = new Map(Object.entries(attributes));
  const view = { setTimeout: () => 0, clearTimeout() {}, addEventListener() {} };
  return {
    live: () => added.filter((entry) => !entry.signal?.aborted).map((entry) => entry.type),
    ownerDocument: { defaultView: view, activeElement: null, getElementById: () => null },
    addEventListener: (type, fn, options) => added.push({ type, signal: options?.signal }),
    getAttribute: (name) => (attrs.has(name) ? attrs.get(name) : null),
    hasAttribute: (name) => attrs.has(name),
    setAttribute: (name, value) => attrs.set(name, String(value)),
    removeAttribute: (name) => attrs.delete(name),
    querySelector: () => null,
    querySelectorAll: () => [],
    ...extra,
  };
}

describe('DS.reasoning.summaryText', () => {
  it('says Thinking while it runs and how long it took once done', () => {
    config({ locale: 'en' });
    assert.equal(summaryText(4000, false), 'Thinking');
    assert.equal(summaryText(12400, true), 'Thought for 12s');
    assert.equal(summaryText(65000, true), 'Thought for 1m 5s');
    config({ locale: null });
  });

  it('takes the page\'s strings', () => {
    config({ locale: 'en', strings: { reasoningDone: 'Reasoned for {time}', reasoningRunning: 'Reasoning' } });
    assert.equal(summaryText(3000, true), 'Reasoned for 3s');
    assert.equal(summaryText(0, false), 'Reasoning');
    config({ locale: null, strings: { reasoningDone: null, reasoningRunning: null } });
  });
});

describe('DS.reasoning.create', () => {
  it('listens for the toggle until destroy()', () => {
    const el = fakeElement();
    const reasoning = create(el);
    assert.deepEqual(el.live(), ['toggle']);
    assert.equal(el.getAttribute('data-state'), 'running');
    reasoning.destroy();
    assert.deepEqual(el.live(), []);
  });
});
