/**
 * DS.kbd: the keys and words of combos and sequences on both platforms.
 * The browser side (the markup it writes) is kbd.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { keys } from './kbd.js';

describe('DS.kbd.keys', () => {
  it('writes mod as Command on Apple systems and Control elsewhere', () => {
    const apple = keys('mod+shift+k', { apple: true });
    assert.deepEqual(apple.combos, [{ keys: ['⇧', '⌘', 'K'], text: '⇧⌘K' }]);
    assert.equal(apple.spoken, 'Shift Command K');
    assert.equal(apple.aria, 'Shift+Meta+K');
    const other = keys('mod+shift+k', { apple: false });
    assert.deepEqual(other.combos, [{ keys: ['Ctrl', 'Shift', 'K'], text: 'Ctrl+Shift+K' }]);
    assert.equal(other.spoken, 'Ctrl Shift K');
    assert.equal(other.aria, 'Control+Shift+K');
  });

  it('names the Apple modifiers in words, and keys with names as such', () => {
    assert.equal(keys('ctrl+alt+delete', { apple: true }).spoken, 'Control Option Delete');
    assert.equal(keys('alt+arrowup', { apple: false }).spoken, 'Alt ↑');
    assert.equal(keys('escape', { apple: false }).spoken, 'Esc');
  });

  it('reads a sequence: combos apart by spaces, joined by "then"', () => {
    const data = keys('g i', { apple: false });
    assert.equal(data.combos.length, 2);
    assert.equal(data.spoken, 'G then I');
    assert.equal(data.aria, 'G I');
  });

  it('throws on what DS.hotkeys cannot read, and on nothing', () => {
    assert.throws(() => keys('', { apple: false }));
    assert.throws(() => keys('mod+', { apple: false }));
    assert.throws(() => keys('hyper+k', { apple: false }));
  });
});
