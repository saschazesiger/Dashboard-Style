/**
 * DS.terminal: the bytes a key sends (sequence()), in Node (no DOM), and the
 * private colours theme() reads, against the stylesheet. The browser side
 * is terminal.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sequence, theme } from './terminal.js';
import { read, declarationsOf } from '../../../test/helpers.js';

const ESC = '\u001b';

describe('DS.terminal.sequence', () => {
  it('sends the keys a phone keyboard lacks as xterm does', () => {
    assert.equal(sequence('esc'), ESC);
    assert.equal(sequence('tab'), '\t');
    assert.equal(sequence('up'), `${ESC}[A`);
    assert.equal(sequence('down'), `${ESC}[B`);
    assert.equal(sequence('right'), `${ESC}[C`);
    assert.equal(sequence('left'), `${ESC}[D`);
    assert.equal(sequence('home'), `${ESC}[H`);
    assert.equal(sequence('end'), `${ESC}[F`);
    assert.equal(sequence('pgup'), `${ESC}[5~`);
    assert.equal(sequence('pgdn'), `${ESC}[6~`);
  });

  it('takes the names in any case', () => {
    assert.equal(sequence('ESC'), ESC);
    assert.equal(sequence('Up'), `${ESC}[A`);
  });

  it('puts the modifiers into a cursor key as its parameter', () => {
    assert.equal(sequence('up', { ctrl: true }), `${ESC}[1;5A`);
    assert.equal(sequence('left', { alt: true }), `${ESC}[1;3D`);
    assert.equal(sequence('right', { ctrl: true, alt: true }), `${ESC}[1;7C`);
    assert.equal(sequence('pgup', { ctrl: true }), `${ESC}[5;5~`);
    assert.equal(sequence('home', { alt: true }), `${ESC}[1;3H`);
  });

  it('turns a character with Ctrl into its control code', () => {
    assert.equal(sequence('c', { ctrl: true }), '\u0003');
    assert.equal(sequence('C', { ctrl: true }), '\u0003');
    assert.equal(sequence('d', { ctrl: true }), '\u0004');
    assert.equal(sequence('z', { ctrl: true }), '\u001a');
    assert.equal(sequence('[', { ctrl: true }), ESC);
    assert.equal(sequence('\\', { ctrl: true }), '\u001c');
    assert.equal(sequence(' ', { ctrl: true }), '\u0000');
    assert.equal(sequence('@', { ctrl: true }), '\u0000');
    assert.equal(sequence('?', { ctrl: true }), '\u007f');
    assert.equal(sequence('3', { ctrl: true }), ESC);
    assert.equal(sequence('7', { ctrl: true }), '\u001f');
  });

  it('puts ESC before a key with Alt', () => {
    assert.equal(sequence('x', { alt: true }), `${ESC}x`);
    assert.equal(sequence('c', { ctrl: true, alt: true }), `${ESC}\u0003`);
    assert.equal(sequence('esc', { alt: true }), `${ESC}${ESC}`);
  });

  it('sends a character as it is, and Esc and Tab unchanged with Ctrl', () => {
    assert.equal(sequence('|'), '|');
    assert.equal(sequence('é'), 'é');
    assert.equal(sequence('😀'), '😀');
    assert.equal(sequence('tab', { ctrl: true }), '\t');
    assert.equal(sequence('esc', { ctrl: true }), ESC);
  });

  it('gives null for what cannot be sent', () => {
    assert.equal(sequence('ctrl'), null);
    assert.equal(sequence('alt'), null);
    assert.equal(sequence('é', { ctrl: true }), null);
    assert.equal(sequence('1', { ctrl: true }), null);
    assert.equal(sequence('word'), null);
    assert.equal(sequence(''), null);
    assert.equal(sequence(undefined), null);
  });
});

describe('DS.terminal.theme', () => {
  it('is empty outside a document', () => {
    assert.deepEqual(theme(null), {});
    assert.deepEqual(theme({}), {});
  });

  it('reads colours the stylesheet declares on the frame, each from its hook over a role', () => {
    const css = read('src/components/terminal/terminal.css');
    const frame = Object.fromEntries(declarationsOf(css, '.ds-terminal').map(({ property, value }) => [property, value]));
    const module = read('src/components/terminal/terminal.js');
    const names = [...module.matchAll(/read\('([a-z-]+)'\)/g)].map((match) => match[1]);
    for (const name of ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']) {
      assert.match(frame[`--_${name}`], new RegExp(`^var\\(--ds-terminal-${name}, `), name);
    }
    for (const name of names) assert.ok(frame[`--_${name}`], `--_${name} is declared on .ds-terminal`);
    assert.match(frame['--_bg'], /^var\(--ds-terminal-bg, var\(--ds-code-bg\)\)$/);
  });
});
