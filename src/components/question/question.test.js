/**
 * DS.question: the answer line, the digit keys, the states and the
 * registration. The form, the error, the focus and the announcement are
 * question.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from '../../js/core.js';
import { answerText, create, optionIndex, QUESTION_STATES } from './question.js';

describe('DS.question.answerText', () => {
  it('says the labels as a list, or Skipped, or nothing while it waits', () => {
    assert.equal(answerText('answered', ['All three']), 'Answered: All three');
    assert.equal(answerText('answered', ['Warranty', ' Open tickets ', '']), 'Answered: Warranty and Open tickets');
    assert.equal(answerText('answered', ['A', 'B', 'C']), 'Answered: A, B, and C');
    assert.equal(answerText('skipped', ['A']), 'Skipped');
    assert.equal(answerText('waiting', ['A']), '');
  });
});

describe('DS.question.optionIndex', () => {
  it('maps 1 to 9 to 0 to 8, and nothing else', () => {
    assert.equal(optionIndex({ key: '1' }), 0);
    assert.equal(optionIndex({ key: '9' }), 8);
    assert.equal(optionIndex({ key: '0' }), -1);
    assert.equal(optionIndex({ key: 'a' }), -1);
    assert.equal(optionIndex({ key: '12' }), -1);
    assert.equal(optionIndex({ key: '2', ctrlKey: true }), -1);
    assert.equal(optionIndex({ key: '2', altKey: true }), -1);
    assert.equal(optionIndex(null), -1);
  });
});

describe('DS.question registration', () => {
  it('lists its states and defines the behaviour with its attribute', () => {
    assert.deepEqual([...QUESTION_STATES], ['waiting', 'answered', 'skipped']);
    assert.ok(Object.isFrozen(QUESTION_STATES));
    assert.equal(runtime.state('core').specs.get('question').attribute, 'data-ds-question');
    assert.equal(typeof create, 'function');
  });
});
