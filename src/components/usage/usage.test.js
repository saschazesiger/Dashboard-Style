/**
 * DS.usage: the share of a budget, where it stands, the figures, and the
 * registration. The meter, the status and the announcement are
 * usage.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from '../../js/core.js';
import { costText, create, shareOf, stateOf, usageText } from './usage.js';

describe('DS.usage.shareOf', () => {
  it('takes the larger of the token and the cost share', () => {
    assert.equal(shareOf({ used: 50, budget: 100 }), 0.5);
    assert.equal(shareOf({ used: 50, budget: 100, cost: 4, costBudget: 5 }), 0.8);
    assert.equal(shareOf({ cost: 6, costBudget: 5 }), 1.2);
  });

  it('gives null without a budget, with a budget of zero or for what is no number', () => {
    assert.equal(shareOf({ used: 50 }), null);
    assert.equal(shareOf({ used: 50, budget: 0 }), null);
    assert.equal(shareOf({ used: 'many', budget: 100 }), null);
    assert.equal(shareOf({ used: -5, budget: 100 }), null);
    assert.equal(shareOf(), null);
  });
});

describe('DS.usage.stateOf', () => {
  it('is near from the warn share, over past 1, else ok', () => {
    assert.equal(stateOf(0.79), 'ok');
    assert.equal(stateOf(0.8), 'near');
    assert.equal(stateOf(1), 'near');
    assert.equal(stateOf(1.01), 'over');
    assert.equal(stateOf(0.6, 0.5), 'near');
    assert.equal(stateOf(null), 'ok');
  });

  it('falls back to 0.8 for a warn share that is none', () => {
    assert.equal(stateOf(0.85, 0), 'near');
    assert.equal(stateOf(0.75, Number.NaN), 'ok');
  });
});

describe('DS.usage figures', () => {
  it('counts tokens compactly, against a budget through usageOf', () => {
    assert.equal(usageText(182400, 250000), '182.4K of 250K tokens');
    assert.equal(usageText(1, null), '1 token');
    assert.equal(usageText(1240), '1.2K tokens');
    assert.equal(usageText(null, 100), '');
  });

  it('formats the cost in its currency, against a budget through usageOf', () => {
    assert.equal(costText(3.12, 5, 'USD'), '$3.12 of $5.00');
    assert.equal(costText(0.37), '$0.37');
    assert.equal(costText(6.4, 5, 'EUR'), '€6.40 of €5.00');
    assert.equal(costText(null, 5), '');
  });
});

describe('DS.usage registration', () => {
  it('defines the behaviour with its attribute and the attributes it reads again', () => {
    const spec = runtime.state('core').specs.get('usage');
    assert.equal(spec.attribute, 'data-ds-usage');
    assert.ok(spec.attributes.includes('data-ds-usage-used'));
    assert.ok(spec.attributes.includes('data-ds-usage-cost-budget'));
    assert.equal(typeof create, 'function');
  });
});
