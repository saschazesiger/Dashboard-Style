/**
 * DS.reasoning: the summary line it writes. The clock, the open and close
 * and the follow are reasoning.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../../js/core.js';
import { create, summaryText } from './reasoning.js';

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
  it('is the controller factory', () => {
    assert.equal(typeof create, 'function');
  });
});
