/**
 * DS.plan: the states and the registration. The decision, the actions,
 * the focus and the announcement are plan.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from '../../js/core.js';
import { create, PLAN_STATES, planState } from './plan.js';

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
    assert.equal(typeof create, 'function');
  });
});
