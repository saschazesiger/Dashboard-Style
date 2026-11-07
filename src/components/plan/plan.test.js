/**
 * DS.plan: the states and the registration. The decision, the actions,
 * the focus and the announcement are plan.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from '../../js/core.js';
import { create, PLAN_STATES, planState } from './plan.js';

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

describe('DS.plan.planState', () => {
  it('takes the three states and the two verbs', () => {
    assert.deepEqual([...PLAN_STATES], ['waiting', 'approved', 'rejected']);
    assert.equal(planState('approved'), 'approved');
    assert.equal(planState(' Rejected '), 'rejected');
    assert.equal(planState('approve'), 'approved');
    assert.equal(planState('reject'), 'rejected');
  });

  it('is waiting for anything else', () => {
    assert.equal(planState('done'), 'waiting');
    assert.equal(planState(''), 'waiting');
    assert.equal(planState(null), 'waiting');
    assert.equal(planState(undefined), 'waiting');
  });

  it('keeps its list frozen', () => {
    assert.ok(Object.isFrozen(PLAN_STATES));
  });
});

describe('DS.plan registration', () => {
  it('defines the behaviour with its attribute and reads its state again', () => {
    const spec = runtime.state('core').specs.get('plan');
    assert.equal(spec.attribute, 'data-ds-plan');
    assert.deepEqual([...spec.attributes], ['data-ds-plan-state']);
  });
});

describe('DS.plan.create', () => {
  it('listens for the press until destroy()', () => {
    const el = fakeElement();
    const plan = create(el);
    assert.deepEqual(el.live(), ['click']);
    assert.equal(el.getAttribute('data-state'), 'waiting');
    plan.destroy();
    assert.deepEqual(el.live(), []);
  });
});
