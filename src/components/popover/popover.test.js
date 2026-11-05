/**
 * DS.popover without a DOM: its registration, its controller, and that it
 * names no timing of its own. Placement, focus, light dismiss and the hover
 * card in a browser are popover.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as popover from './popover.js';
import { runtime } from '../../js/core.js';
import { computePlacement } from '../../js/position.js';
import { read } from '../../../test/helpers.js';

describe('DS.popover', () => {
  it('registers its trigger behaviour by its attribute, with its options observed', () => {
    const spec = runtime.state('core').specs.get('popover');
    assert.equal(spec.attribute, 'data-ds-popover');
    assert.equal(typeof spec.init, 'function');
    assert.deepEqual([...spec.attributes].sort(), ['data-ds-popover-align', 'data-ds-popover-placement', 'data-ds-popover-trigger']);
  });

  it('makes a controller of the shared shape', () => {
    const control = popover.create({ addEventListener() {}, removeEventListener() {} });
    assert.equal(control.get(), false);
    assert.deepEqual(Object.keys(control).sort(), ['destroy', 'element', 'get', 'on', 'set']);
    const off = control.on('open', () => {});
    assert.equal(typeof off, 'function');
    control.destroy();
  });

  it('resolves at once for an element that is not in a document', async () => {
    assert.equal(await popover.open({ isConnected: false }), undefined);
    assert.equal(await popover.open(null), undefined);
  });

  it('names no timing of its own: the hover card waits on the tooltip tokens', () => {
    const source = read('src/components/popover/popover.js');
    assert.match(source, /motionDuration\(trigger, token\)/);
    assert.match(source, /time\('--ds-delay-tooltip'\)/);
    assert.match(source, /time\('--ds-delay-tooltip-skip'\)/);
    assert.doesNotMatch(source.replace(/\/\*[\s\S]*?\*\//g, ''), /\b\d+ms\b|setTimeout\([^,]+,\s*\d+\)/);
  });

  it('places through js/position.js: the arrow stays clear of the corners, the box inside the bounds', () => {
    const bounds = { left: 0, top: 0, right: 400, bottom: 300 };
    // A trigger at the right edge: the box shifts left, the arrow still points at the trigger's centre.
    const result = computePlacement({ left: 360, right: 392, top: 20, bottom: 52 }, { width: 200, height: 100 }, bounds, { side: 'bottom', align: 'center', offset: 12, padding: 8, arrowPadding: 16 });
    assert.equal(result.side, 'bottom');
    assert.equal(result.x, 400 - 8 - 200);
    assert.equal(result.arrow, 376 - result.x);
    // No room below: above, with the arrow on the other edge.
    const above = computePlacement({ left: 100, right: 132, top: 250, bottom: 282 }, { width: 200, height: 100 }, bounds, { side: 'bottom', align: 'center', offset: 12, padding: 8, arrowPadding: 16 });
    assert.equal(above.side, 'top');
    assert.equal(above.y, 250 - 12 - 100);
    // The arrow never reaches the rounded corner.
    const corner = computePlacement({ left: 0, right: 8, top: 20, bottom: 52 }, { width: 200, height: 100 }, bounds, { side: 'bottom', align: 'center', offset: 12, padding: 8, arrowPadding: 16 });
    assert.equal(corner.arrow, 16);
  });

  it('writes popover="manual" and never auto (closing stays with DS.overlay)', () => {
    const source = read('src/components/popover/popover.js').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.match(source, /setAttribute\('popover', 'manual'\)/);
    assert.doesNotMatch(source, /'auto'/);
  });
});
