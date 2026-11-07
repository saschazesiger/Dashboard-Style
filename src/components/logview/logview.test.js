/**
 * DS.logview: reading a line (stamp, level, text) and the ANSI runs, in Node
 * (no DOM). The browser side is logview.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parse, ansi } from './logview.js';

const ESC = '\u001b';

describe('DS.logview.parse', () => {
  it('reads an ISO stamp and an upper-case level off the text', () => {
    const line = parse('2026-11-04T09:00:01.120Z ERROR Sync failed: timeout after 8000 ms');
    assert.equal(line.time, '2026-11-04T09:00:01.120Z');
    assert.equal(line.level, 'error');
    assert.equal(line.text, 'Sync failed: timeout after 8000 ms');
    assert.deepEqual(line.segments.map((run) => run.text), ['Sync failed: timeout after 8000 ms']);
  });

  it('reads bracketed stamps and levels, a time of day, a syslog date and an offset', () => {
    assert.deepEqual(pick(parse('[09:00:01] [warn] Battery low')), ['09:00:01', 'warn', 'Battery low']);
    assert.deepEqual(pick(parse('[2026-11-04 09:00:01,123] <info> Started')), ['2026-11-04 09:00:01,123', 'info', 'Started']);
    assert.deepEqual(pick(parse('Nov  4 09:00:01 notice: Started')), ['Nov  4 09:00:01', 'info', 'Started']);
    assert.deepEqual(pick(parse('2026-11-04T09:00:01+02:00 WARNING disk 91%')), ['2026-11-04T09:00:01+02:00', 'warn', 'disk 91%']);
  });

  it('maps the level words of common logs to six levels', () => {
    const levels = ['FATAL', 'CRIT', 'PANIC', 'ERR', 'SEVERE', 'WARN', 'NOTICE', 'DEBUG', 'DBG', 'TRACE', 'VERBOSE'].map((word) => parse(`${word} x`).level);
    assert.deepEqual(levels, ['fatal', 'fatal', 'fatal', 'error', 'error', 'warn', 'info', 'debug', 'debug', 'trace', 'trace']);
  });

  it('keeps a word that starts a sentence: no level unless bracketed, upper case or followed by a colon', () => {
    assert.deepEqual(pick(parse('Error connecting to the server')), [null, null, 'Error connecting to the server']);
    assert.deepEqual(pick(parse('error: no route')), [null, 'error', 'no route']);
    assert.deepEqual(pick(parse('Info about the device')), [null, null, 'Info about the device']);
    assert.deepEqual(pick(parse('INFOS are not a level')), [null, null, 'INFOS are not a level']);
  });

  it('reads a level field (logfmt, JSON) and leaves it in the text', () => {
    assert.deepEqual(pick(parse('ts=09:00 level=warn msg="battery low"')), [null, 'warn', 'ts=09:00 level=warn msg="battery low"']);
    assert.deepEqual(pick(parse('{"level":"error","msg":"sync failed"}')), [null, 'error', '{"level":"error","msg":"sync failed"}']);
  });

  it('keeps what came after a carriage return, and reads the stamp under the colours', () => {
    assert.equal(parse('Downloading 10%\rDownloading 55%\rDownloading 100%').text, 'Downloading 100%');
    const coloured = parse(`${ESC}[2m09:00:01${ESC}[0m ${ESC}[31mERROR${ESC}[0m ${ESC}[1mdisk${ESC}[22m full`);
    assert.deepEqual(pick(coloured), ['09:00:01', 'error', 'disk full']);
    assert.deepEqual(coloured.segments.map((run) => [run.text, run.bold, run.fg]), [['disk', true, null], [' full', false, null]]);
  });

  it('takes anything without throwing', () => {
    for (const value of [undefined, null, '', 42, '   ', '[]', '[x]']) assert.equal(typeof parse(value).text, 'string');
  });
});

describe('DS.logview.ansi', () => {
  it('splits a text into runs by its SGR codes', () => {
    const runs = ansi(`plain ${ESC}[31mred ${ESC}[1mbold${ESC}[0m done`);
    assert.deepEqual(runs.map((run) => [run.text, run.fg, run.bold]), [['plain ', null, false], ['red ', 'red', false], ['bold', 'red', true], [' done', null, false]]);
    assert.equal(runs.map((run) => run.text).join(''), 'plain red bold done');
  });

  it('maps bright, 256 and true colours to the nearest of the eight', () => {
    assert.equal(ansi(`${ESC}[92mx`)[0].fg, 'green');
    assert.equal(ansi(`${ESC}[38;5;196mx`)[0].fg, 'red');
    assert.equal(ansi(`${ESC}[38;5;21mx`)[0].fg, 'blue');
    assert.equal(ansi(`${ESC}[38;5;244mx`)[0].fg, 'black');
    assert.equal(ansi(`${ESC}[38;2;0;200;210mx`)[0].fg, 'cyan');
    assert.equal(ansi(`${ESC}[48;5;11mx`)[0].bg, 'yellow');
    assert.equal(ansi(`${ESC}[105mx`)[0].bg, 'magenta');
  });

  it('turns styles on and off, and resets', () => {
    const [run] = ansi(`${ESC}[1;2;3;4;7;9mx`);
    assert.deepEqual([run.bold, run.dim, run.italic, run.underline, run.inverse, run.strike], [true, true, true, true, true, true]);
    const off = ansi(`${ESC}[1;3;4;7;9;31;42mx${ESC}[22;23;24;27;29;39;49my`).at(-1);
    assert.deepEqual([off.text, off.bold, off.italic, off.underline, off.inverse, off.strike, off.fg, off.bg], ['y', false, false, false, false, false, null, null]);
    assert.equal(ansi(`${ESC}[31mx${ESC}[my`).at(-1).fg, null, 'an empty SGR resets');
  });

  it('drops every other escape and merges equal runs', () => {
    const runs = ansi(`${ESC}]0;title${ESC}\\a${ESC}[2Kb${ESC}[1Ac${ESC}[0md`);
    assert.deepEqual(runs.map((run) => run.text), ['abcd']);
  });
});

function pick(line) {
  return [line.time, line.level, line.text];
}
