/**
 * DS.menu without a DOM: its registration and controller, and that the check
 * items stay the page's unless the menu asks. The keys and the placement in a
 * browser are menu.spec.js and test/browser/popups.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as menu from './menu.js';
import { runtime } from '../../js/core.js';
import { read } from '../../../test/helpers.js';

describe('DS.menu', () => {
  it('registers its behaviour by its attribute', () => {
    const spec = runtime.state('core').specs.get('menu');
    assert.equal(spec.attribute, 'data-ds-menu');
    assert.equal(typeof spec.init, 'function');
  });

  it('makes the controller of every overlay', () => {
    const control = menu.create({ addEventListener() {}, removeEventListener() {} });
    assert.equal(control.get(), false);
    assert.deepEqual(Object.keys(control).sort(), ['destroy', 'element', 'get', 'on', 'set']);
  });

  it('flips check items only on a menu that asks, since a 2.x page flips them itself', () => {
    const source = read('src/components/menu/menu.js');
    assert.match(source, /if \(!menu\.hasAttribute\('data-ds-menu-checks'\)\) return;/);
  });

  it('names no timing of its own: type-ahead resets after the token', () => {
    const source = read('src/components/menu/menu.js');
    assert.match(source, /motionDuration\(menu, '--ds-delay-tooltip'\)/);
    assert.doesNotMatch(source.replace(/\/\*[\s\S]*?\*\//g, ''), /\b\d+ms\b/);
  });

  it('registers the context menu as a delegated behaviour of its attribute', () => {
    const spec = runtime.state('core').specs.get('contextmenu');
    assert.equal(spec.attribute, 'data-ds-contextmenu');
    assert.equal(typeof spec.global, 'function');
    assert.equal(typeof menu.openAt, 'function');
  });

  it('opens nothing for an element outside a document', async () => {
    assert.equal(await menu.openAt({ isConnected: false }, { x: 1, y: 2 }), undefined);
  });

  it('times submenus and the long press by the tokens: hover intent and the touch delay', () => {
    const source = read('src/components/menu/menu.js');
    assert.match(source, /time\('--ds-delay-submenu'\)/);
    assert.match(source, /time\('--ds-delay-submenu-close'\)/);
    assert.match(source, /motionDuration\(target, '--ds-delay-long-press'\)/);
    assert.doesNotMatch(source.replace(/\/\*[\s\S]*?\*\//g, ''), /setTimeout\([^,]+,\s*\d+\)/);
  });

  it('keeps a submenu\'s items out of its parent\'s keys, clicks and checks', () => {
    const source = read('src/components/menu/menu.js');
    assert.match(source, /item\.closest\('\.ds-menu'\) === menu && canFocus\(item\)/);
    assert.match(source, /if \(target\?\.closest\?\.\('\.ds-menu'\) !== menu\) return;/);
    assert.match(source, /item\.closest\('\.ds-menu'\) !== menu/);
  });
});
