/**
 * The theme generator (scripts/tools/theme.mjs, shipped in dist/tools/) and
 * the colour science under it (scripts/tools/color.mjs, a port of Material
 * Color Utilities): MCU's own reference values, the scheme tones, the
 * presets up to date, 60 seeds across the hue wheel and the chroma range
 * through every pair in both schemes, and the CLI.
 *
 * The MCU values are quoted from its tests (TypeScript: hct/hct_test.ts,
 * hct/hct_round_trip_test.ts, palettes/palettes_test.ts,
 * temperature/temperature_cache_test.ts, dislike/dislike_analyzer_test.ts,
 * contrast/contrast_test.ts, scheme/dynamic_scheme_test.ts; Swift:
 * SchemeTests/Scheme*Tests.swift for the scheme variants).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, packageInfo, tokensJson, withBanner } from '../scripts/build.mjs';
import { checkTheme } from '../scripts/tools/check-theme.mjs';
import {
  Cam16, Contrast, CRITICAL_PLANES, DislikeAnalyzer, Hct, TemperatureCache, TonalPalette, ViewingConditions,
  apcaContrast, argbFromHex, argbFromOklch, argbFromRgb, blueFromArgb, getRotatedHue, greenFromArgb, hexFromArgb,
  oklchFromArgb, oklchInSrgb, parseColor, redFromArgb, schemePalettes, wcagContrast,
} from '../scripts/tools/color.mjs';
import { CONTRAST_LEVELS, FOLLOWS, PRESETS, ROLES, SCHEMES, generateTheme, pickScheme, presetFiles } from '../scripts/tools/theme.mjs';
import { CHART_MARKS, pairResults, parseColour, resolveColour } from '../scripts/tools/theme-rules.mjs';
import { scan } from '../scripts/tools/css-scan.mjs';
import { ROOT, filesIn, read, stripComments } from './helpers.js';

const close = (actual, expected, digits, label) => assert.ok(Math.abs(actual - expected) < 10 ** -digits / 2 + 1e-12, `${label}: ${actual} is not ${expected} to ${digits} digits`);
const hex = (argb) => `0x${(argb >>> 0).toString(16)}`;

const RED = 0xffff0000;
const GREEN = 0xff00ff00;
const BLUE = 0xff0000ff;
const WHITE = 0xffffffff;
const BLACK = 0xff000000;

describe('color.mjs: HCT, the MCU port', () => {
  it('computes CAM16 as MCU does (hct_test.ts, "CAM to ARGB")', () => {
    const expected = [
      [RED, 27.408, 113.358, 46.445, 89.494, 91.890, 105.989],
      [GREEN, 142.140, 108.410, 79.332, 85.588, 78.605, 138.520],
      [BLUE, 282.788, 87.231, 25.466, 68.867, 93.675, 78.481],
      [WHITE, 209.492, 2.869, 100.0, 2.265, 12.068, 155.521],
      [BLACK, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    ];
    for (const [argb, hue, chroma, j, m, s, q] of expected) {
      const cam = Cam16.fromInt(argb);
      const label = hex(argb);
      close(cam.hue, hue, 3, `${label} hue`);
      close(cam.chroma, chroma, 3, `${label} chroma`);
      close(cam.j, j, 3, `${label} j`);
      close(cam.m, m, 3, `${label} m`);
      close(cam.s, s, 3, `${label} s`);
      close(cam.q, q, 3, `${label} q`);
    }
  });

  it('turns CAM16 back into the same colour, and HCT into MCU\'s values (hct_test.ts)', () => {
    for (const argb of [RED, GREEN, BLUE]) assert.equal(Cam16.fromInt(argb).toInt(), argb, hex(argb));
    const green = Hct.fromInt(GREEN);
    close(green.hue, 142.139, 2, 'green hue');
    close(green.chroma, 108.410, 2, 'green chroma');
    close(green.tone, 87.737, 2, 'green tone');
    const blue = Hct.fromInt(BLUE);
    close(blue.hue, 282.788, 2, 'blue hue');
    close(blue.chroma, 87.230, 2, 'blue chroma');
    close(blue.tone, 32.302, 2, 'blue tone');
    // "blue tone 90": chroma is cut to what sRGB holds at that tone.
    const light = Hct.from(282.788, 87.230, 90.0);
    close(light.hue, 282.239, 2, 'blue tone 90 hue');
    close(light.chroma, 19.144, 2, 'blue tone 90 chroma');
    close(light.tone, 90.035, 2, 'blue tone 90 tone');
  });

  it('builds the default viewing conditions (hct_test.ts, "viewing conditions")', () => {
    const vc = ViewingConditions.DEFAULT;
    const expected = { n: 0.184, aw: 29.981, nbb: 1.017, ncb: 1.017, c: 0.69, nc: 1.0, fl: 0.388, fLRoot: 0.789, z: 1.909 };
    for (const [key, value] of Object.entries(expected)) close(vc[key], value, 3, key);
    [1.021, 0.986, 0.934].forEach((value, i) => close(vc.rgbD[i], value, 3, `rgbD[${i}]`));
  });

  it('solves HCT to a sufficiently close colour (hct_test.ts, "CamSolver")', () => {
    const onBoundary = (argb) => [redFromArgb(argb), greenFromArgb(argb), blueFromArgb(argb)].some((c) => c === 0 || c === 255);
    for (let hue = 15; hue < 360; hue += 30) {
      for (let chroma = 0; chroma <= 100; chroma += 10) {
        for (let tone = 20; tone <= 80; tone += 10) {
          const color = Hct.from(hue, chroma, tone);
          if (chroma > 0) assert.ok(Math.abs(color.hue - hue) <= 4.0, `hue ${hue} ${chroma} ${tone}`);
          assert.ok(color.chroma >= 0 && color.chroma <= chroma + 2.5, `chroma ${hue} ${chroma} ${tone}`);
          if (color.chroma < chroma - 2.5) assert.ok(onBoundary(color.toInt()), `on the gamut boundary ${hue} ${chroma} ${tone}`);
          assert.ok(Math.abs(color.tone - tone) <= 0.5, `tone ${hue} ${chroma} ${tone}`);
        }
      }
    }
  });

  it('round-trips 512 colours through HCT (hct_round_trip_test.ts)', () => {
    for (let r = 0; r < 296; r += 37) {
      for (let g = 0; g < 296; g += 37) {
        for (let b = 0; b < 296; b += 37) {
          const argb = argbFromRgb(Math.min(255, r), Math.min(255, g), Math.min(255, b));
          const hct = Hct.fromInt(argb);
          assert.equal(Hct.from(hct.hue, hct.chroma, hct.tone).toInt(), argb, hexFromArgb(argb));
        }
      }
    }
  });

  it('computes the critical planes MCU lists literally (hct_solver.ts)', () => {
    assert.equal(CRITICAL_PLANES.length, 255);
    const literal = { 0: 0.015176349177441876, 1: 0.045529047532325624, 100: 12.878295467455942, 200: 58.08241284012621, 254: 99.55452497210776 };
    for (const [i, value] of Object.entries(literal)) close(CRITICAL_PLANES[i], value, 12, `plane ${i}`);
  });

  it('gives MCU\'s tonal palette of blue (palettes_test.ts, "ofBlue")', () => {
    const blue = TonalPalette.fromInt(BLUE);
    const expected = {
      100: 0xffffffff, 95: 0xfff1efff, 90: 0xffe0e0ff, 80: 0xffbec2ff, 70: 0xff9da3ff, 60: 0xff7c84ff,
      50: 0xff5a64ff, 40: 0xff343dff, 30: 0xff0000ef, 20: 0xff0001ac, 10: 0xff00006e, 0: 0xff000000,
    };
    for (const [tone, argb] of Object.entries(expected)) assert.equal(hex(blue.tone(Number(tone))), hex(argb), `tone ${tone}`);
  });

  it('finds key colours as MCU does (palettes_test.ts, "KeyColor")', () => {
    const exact = TonalPalette.fromHueAndChroma(50.0, 60.0).keyColor;
    assert.ok(Math.abs(exact.hue - 50.0) < 10.0 && Math.abs(exact.chroma - 60.0) < 0.5 && exact.tone > 0 && exact.tone < 100);
    // For hue 149, chroma peaks at 89.6 (tone 87.9): an unreachable chroma comes close to the peak.
    const high = TonalPalette.fromHueAndChroma(149.0, 200.0).keyColor;
    assert.ok(Math.abs(high.hue - 149.0) < 10.0 && high.chroma > 89.0 && high.tone > 0 && high.tone < 100);
    const low = TonalPalette.fromHueAndChroma(50.0, 3.0).keyColor;
    assert.ok(Math.abs(low.hue - 50.0) < 10.0 && Math.abs(low.chroma - 3.0) < 0.5 && Math.abs(low.tone - 50.0) < 0.5);
  });

  it('measures temperature, complement and analogous colours (temperature_cache_test.ts)', () => {
    const raw = [[BLUE, -1.393], [RED, 2.351], [GREEN, -0.267], [WHITE, -0.5], [BLACK, -0.5]];
    for (const [argb, value] of raw) close(TemperatureCache.rawTemperature(Hct.fromInt(argb)), value, 3, `raw ${hex(argb)}`);
    const relative = [[BLUE, 0.0], [RED, 1.0], [GREEN, 0.467], [WHITE, 0.5], [BLACK, 0.5]];
    for (const [argb, value] of relative) close(new TemperatureCache(Hct.fromInt(argb)).inputRelativeTemperature, value, 3, `relative ${hex(argb)}`);
    const complement = [[BLUE, 0xff9d0002], [RED, 0xff007bfc], [GREEN, 0xffffd2c9], [WHITE, 0xffffffff], [BLACK, 0xff000000]];
    for (const [argb, value] of complement) assert.equal(hex(new TemperatureCache(Hct.fromInt(argb)).complement.toInt()), hex(value), `complement ${hex(argb)}`);
    const analogous = new TemperatureCache(Hct.fromInt(BLUE)).analogous().map((e) => hex(e.toInt()));
    assert.deepEqual(analogous, [0xff00590c, 0xff00564e, 0xff0000ff, 0xff6700cc, 0xff81009f].map(hex));
  });

  it('dislikes and fixes bile colours, and likes skin tones (dislike_analyzer_test.ts)', () => {
    for (const argb of [0xfff6ede4, 0xfff3e7db, 0xfff7ead0, 0xffeadaba, 0xffd7bd96, 0xffa07e56, 0xff825c43, 0xff604134, 0xff3a312a, 0xff292420]) {
      assert.equal(DislikeAnalyzer.isDisliked(Hct.fromInt(argb)), false, hex(argb));
    }
    for (const argb of [0xff95884b, 0xff716b40, 0xffb08e00, 0xff4c4308, 0xff464521]) {
      const hct = Hct.fromInt(argb);
      assert.equal(DislikeAnalyzer.isDisliked(hct), true, hex(argb));
      assert.equal(DislikeAnalyzer.isDisliked(DislikeAnalyzer.fixIfDisliked(hct)), false, hex(argb));
    }
    const tone67 = Hct.from(100.0, 50.0, 67.0);
    assert.equal(DislikeAnalyzer.isDisliked(tone67), false);
    assert.equal(DislikeAnalyzer.fixIfDisliked(tone67).toInt(), tone67.toInt());
  });

  it('does MCU\'s tone arithmetic for contrast (contrast_test.ts)', () => {
    close(Contrast.ratioOfTones(-10.0, 110.0), 21.0, 3, 'ratio out of bounds');
    assert.equal(Contrast.lighter(90.0, 10.0), -1.0);
    assert.equal(Contrast.lighter(110.0, 2.0), -1.0);
    assert.equal(Contrast.lighter(-10.0, 2.0), -1.0);
    assert.equal(Contrast.lighterUnsafe(100.0, 2.0), 100);
    assert.equal(Contrast.darker(10.0, 20.0), -1.0);
    assert.equal(Contrast.darker(110.0, 2.0), -1.0);
    assert.equal(Contrast.darker(-10.0, 2.0), -1.0);
    assert.equal(Contrast.darkerUnsafe(0.0, 2.0), 0.0);
  });

  it('rotates hues piecewise (dynamic_scheme_test.ts)', () => {
    const source = Hct.from(43, 16, 16);
    close(getRotatedHue(source, [], []), 43, 0, 'no input');
    close(getRotatedHue(source, [0], [0]), 43, 0, 'one input, no rotation');
    close(getRotatedHue(source, [0], [0, 1]), 43, 0, 'length mismatch');
    close(getRotatedHue(source, [0, 42, 360], [0, 15, 0]), 43 + 15, 0, 'on the boundary');
    close(getRotatedHue(source, [0, 42, 360], [0, 480, 0]), 163, 0, 'wraps past 360');
  });
});

describe('color.mjs: scheme tones', () => {
  it('builds the tonal-spot palettes: MCU\'s roles at their 2021 tones (SchemeTonalSpotTests.swift, high-chroma seed 0xfffa2bec)', () => {
    const p = schemePalettes('tonal-spot', Hct.fromInt(0xfffa2bec));
    // [palette, tone, light scheme value, the MCU role]
    const light = [
      ['primary', 40, 0xff814c77, 'primary'], ['primary', 100, 0xffffffff, 'onPrimary'], ['primary', 90, 0xffffd7f3, 'primaryContainer'],
      ['primary', 30, 0xff67355e, 'onPrimaryContainer'], ['secondary', 40, 0xff6e5868, 'secondary'], ['secondary', 90, 0xfff8daee, 'secondaryContainer'],
      ['tertiary', 40, 0xff815343, 'tertiary'], ['tertiary', 90, 0xffffdbd0, 'tertiaryContainer'], ['error', 40, 0xffba1a1a, 'error'],
      ['error', 90, 0xffffdad6, 'errorContainer'], ['error', 30, 0xff93000a, 'onErrorContainer'], ['neutral', 98, 0xfffff7f9, 'surface'],
      ['neutral', 10, 0xff201a1e, 'onSurface'], ['neutralVariant', 90, 0xffeedee7, 'surfaceVariant'], ['neutralVariant', 30, 0xff4e444b, 'onSurfaceVariant'],
      ['neutralVariant', 50, 0xff80747b, 'outline'], ['neutralVariant', 80, 0xffd2c2cb, 'outlineVariant'], ['neutral', 20, 0xff362e33, 'inverseSurface'],
      ['neutral', 95, 0xfffaedf3, 'inverseOnSurface'], ['primary', 80, 0xfff3b2e4, 'inversePrimary'],
    ];
    const dark = [
      ['primary', 20, 0xff4d1f47, 'onPrimary'], ['secondary', 80, 0xffdbbed1, 'secondary'], ['tertiary', 80, 0xfff5b9a5, 'tertiary'],
      ['error', 80, 0xffffb4ab, 'error'], ['error', 20, 0xff690005, 'onError'], ['neutral', 6, 0xff181216, 'surface'], ['neutral', 90, 0xffecdfe5, 'onSurface'],
      ['neutralVariant', 60, 0xff9a8d95, 'outline'],
    ];
    for (const [palette, tone, argb, role] of [...light, ...dark]) assert.equal(hex(p[palette].tone(tone)), hex(argb), `${role}: ${palette} tone ${tone}`);
  });

  it('gives each variant MCU\'s key colours for a blue seed (Scheme{Vibrant,Neutral,Fidelity,Monochrome}Tests.swift, "testKeyColors")', () => {
    // One value differs from the Swift test: its vibrant neutral key is 0xff777682, where MCU's TypeScript
    // (the source of this port) gives 0xff767682, one step of red apart; the port follows the TypeScript.
    const expected = {
      vibrant: [0xff080cff, 0xff7b7296, 0xff886c9d, 0xff767682, 0xff767685],
      neutral: [0xff767685, 0xff777680, 0xff75758b, 0xff787678, 0xff787678],
      fidelity: [0xff080cff, 0xff656dd3, 0xff9d0002, 0xff767684, 0xff757589],
      monochrome: [0xff777777, 0xff777777, 0xff777777, 0xff777777, 0xff777777],
    };
    for (const [variant, keys] of Object.entries(expected)) {
      const p = schemePalettes(variant, Hct.fromInt(BLUE));
      const found = ['primary', 'secondary', 'tertiary', 'neutral', 'neutralVariant'].map((name) => hex(p[name].keyColor.toInt()));
      assert.deepEqual(found, keys.map(hex), variant);
    }
    // The standard-contrast primary of the vibrant and neutral variants is their palette at tone 40.
    assert.equal(hex(schemePalettes('vibrant', Hct.fromInt(BLUE)).primary.tone(40)), hex(0xff343dff), 'vibrant primary');
    assert.equal(hex(schemePalettes('neutral', Hct.fromInt(BLUE)).primary.tone(40)), hex(0xff5d5d6c), 'neutral primary');
    assert.equal(hex(schemePalettes('monochrome', Hct.fromInt(BLUE)).primary.tone(98)), hex(0xfff9f9f9), 'monochrome surface tone');
  });

  it('maps every scheme name of the generator to an MCU variant', () => {
    assert.deepEqual(Object.keys(SCHEMES), ['tonal', 'vibrant', 'neutral', 'fidelity', 'monochrome']);
    for (const variant of Object.values(SCHEMES)) assert.ok(schemePalettes(variant, Hct.fromInt(BLUE)).primary instanceof TonalPalette, variant);
    assert.throws(() => schemePalettes('expressive', Hct.fromInt(BLUE)), /Unsupported variant/);
  });
});

describe('color.mjs: sRGB, OKLCH and contrast', () => {
  it('reads seeds as hex, rgb() and oklch(), and writes hex', () => {
    assert.equal(hexFromArgb(argbFromHex('#0B57D0')), '#0b57d0');
    assert.equal(hexFromArgb(parseColor('#abc')), '#aabbcc');
    assert.equal(hexFromArgb(parseColor('rgb(11, 87, 208)')), '#0b57d0');
    assert.equal(hexFromArgb(parseColor('rgb(11 87 208)')), '#0b57d0');
    assert.equal(parseColor('hsl(0 0% 0%)'), null);
    assert.equal(parseColor('not a colour'), null);
  });

  it('converts to OKLCH as CSS Color 4 does (red is oklch(62.796% 0.25768 29.2339)) and back', () => {
    const [L, C, h] = oklchFromArgb(RED);
    close(L, 0.62796, 4, 'L');
    close(C, 0.25768, 4, 'C');
    close(h, 29.2339, 2, 'h');
    const [wL, wC] = oklchFromArgb(WHITE);
    close(wL, 1, 4, 'white L');
    assert.ok(wC < 1e-4, 'white is achromatic');
    for (const color of ['#0b57d0', '#146c2e', '#8f4e06', '#ffffff', '#000000', '#7f7f7f']) {
      const argb = argbFromHex(color);
      assert.equal(hexFromArgb(argbFromOklch(...oklchFromArgb(argb))), color, `${color} round trip`);
    }
    assert.equal(hexFromArgb(parseColor('oklch(62.796% 0.25768 29.2339)')), '#ff0000');
  });

  it('maps an out-of-gamut OKLCH colour into sRGB, keeping lightness and hue', () => {
    assert.equal(oklchInSrgb(0.7, 0.4, 150), false);
    const mapped = argbFromOklch(0.7, 0.4, 150);
    const [L, C, h] = oklchFromArgb(mapped);
    assert.ok(Math.abs(L - 0.7) < 0.02, `L ${L}`);
    assert.ok(Math.abs(h - 150) < 3, `h ${h}`);
    assert.ok(C < 0.4 && C > 0.1, `C ${C}`);
    assert.equal(hexFromArgb(argbFromOklch(1.2, 0.1, 30)), '#ffffff');
    assert.equal(hexFromArgb(argbFromOklch(0, 0.1, 30)), '#000000');
  });

  it('computes WCAG 2 ratios and APCA Lc (the reference values of the APCA-W3 README)', () => {
    close(wcagContrast(BLACK, WHITE), 21, 6, 'black on white');
    close(wcagContrast(WHITE, WHITE), 1, 6, 'white on white');
    // Same function as theme-rules.mjs, which the checks use.
    close(wcagContrast(argbFromHex('#0b57d0'), WHITE), pairResults((name) => ({ '--ds-on-primary': '#ffffff', '--ds-primary': '#0b57d0' })[name])
      .find((pair) => pair.fg === '--ds-on-primary' && pair.bg === '--ds-primary').ratio, 9, 'equal to theme-rules.mjs');
    close(apcaContrast(argbFromHex('#888888'), WHITE), 63.056, 2, '#888 on #fff');
    close(apcaContrast(WHITE, argbFromHex('#888888')), -68.541, 2, '#fff on #888');
    close(apcaContrast(BLACK, argbFromHex('#aaaaaa')), 58.146, 2, '#000 on #aaa');
    close(apcaContrast(argbFromHex('#aaaaaa'), BLACK), -56.241, 2, '#aaa on #000');
    assert.equal(apcaContrast(WHITE, WHITE), 0);
  });

  it('runs in a browser: color.mjs imports nothing, theme.mjs imports node: modules only inside the CLI', () => {
    const color = read('scripts/tools/color.mjs');
    assert.doesNotMatch(color, /^\s*import\b|\bimport\(|\brequire\(|\bprocess\b|\bBuffer\b/m);
    const theme = read('scripts/tools/theme.mjs');
    const statics = [...theme.matchAll(/^import .* from '([^']+)';$/gm)].map((match) => match[1]);
    assert.deepEqual(statics, ['./color.mjs', './theme-rules.mjs']);
    assert.doesNotMatch(read('scripts/tools/theme-rules.mjs'), /^\s*import\b/m, 'theme-rules.mjs stays dependency-free too');
  });
});

describe('tools/theme.mjs', () => {
  const tokens = JSON.parse(tokensJson(packageInfo()));
  const deprecations = JSON.parse(read('src/deprecations.json'));
  const defaults = new Map(tokens.tokens.map((entry) => [entry.name, entry.default]));
  /** Declarations of the first `.ds-theme {` block (the base rule). */
  const declared = (css) => {
    const rule = scan(css).rules.find((entry) => entry.selector === '.ds-theme' && !entry.context.length);
    return Object.fromEntries(rule.declarations.map((d) => [d.property, d.value]));
  };
  /** Every pair that fails with `css` (one scheme's view) loaded after ds.css. */
  const failing = (css) => {
    const values = declared(css);
    const lookup = (name) => (name in values ? values[name] : defaults.get(name));
    return pairResults(lookup).filter((pair) => pair.ratio === null || pair.ratio < pair.min)
      .map((pair) => `${pair.fg} on ${pair.bg}: ${pair.ratio === null ? 'not resolved' : pair.ratio.toFixed(2)}`);
  };
  /** check-theme.mjs findings other than info, per scheme. */
  const findings = (css, path = 'theme.css') => ['light', 'dark'].flatMap((scheme) => checkTheme({ files: [{ path: `${path} (${scheme})`, css: pickScheme(css, scheme) }], tokens, deprecations })
    .filter((finding) => finding.level !== 'info').map((finding) => `${finding.file} ${finding.rule} ${finding.message}`));

  it('reads the roles that follow by themselves (FOLLOWS) as tokens.css declares them', () => {
    for (const [name, target] of Object.entries(FOLLOWS)) assert.equal(defaults.get(name), `var(${target})`, name);
  });

  it('sets every colour role that themes/dark.css sets, and nothing that is not a themeable role', () => {
    const dark = Object.keys(declared(read('themes/dark.css')));
    const theme = declared(generateTheme({ seed: '#0b57d0' }).css);
    assert.deepEqual(dark.filter((name) => !(name in theme)), []);
    for (const name of Object.keys(theme)) {
      const entry = tokens.tokens.find((candidate) => candidate.name === name);
      assert.ok(entry?.themeable, `${name} is a themeable role`);
      assert.equal(entry.layer, 'role', name);
    }
    assert.equal(theme['--ds-color-scheme'], 'light dark');
    for (const role of ROLES) assert.match(theme[role.name], /^light-dark\(#[0-9a-f]{6}, #[0-9a-f]{6}\)$|^#[0-9a-f]{6}$/, role.name);
    // Shadows on black in the dark scheme (a grey shadow on a dark surface would glow).
    for (const name of ['--ds-elev-1', '--ds-elev-2', '--ds-elev-3']) assert.doesNotMatch(pickScheme(theme[name], 'dark'), /rgba\((?!0, 0, 0,)/, name);
  });

  it('pins the scheme with data-ds-scheme and follows the system without it', () => {
    const { rules } = scan(generateTheme({ seed: '#0b57d0' }).css);
    const scheme = Object.fromEntries(rules.map((rule) => [rule.selector, rule.declarations.find((d) => d.property === '--ds-color-scheme')?.value]));
    assert.deepEqual(scheme, { '.ds-theme': 'light dark', '.ds-theme[data-ds-scheme="light"]': 'light', '.ds-theme[data-ds-scheme="dark"]': 'dark' });
    assert.match(stripComments(read('src/core/tokens.css')), /:where\(\.ds-theme\)\s*\{\s*color-scheme:\s*var\(--ds-color-scheme\);/, 'tokens.css applies --ds-color-scheme');
  });

  it('views one scheme of a file (pickScheme), nested light-dark() included', () => {
    const css = '.ds-theme { --ds-color-scheme: light dark; --a: light-dark(#fff, #000); --b: 0 1px light-dark(rgba(1, 2, 3, .3), rgba(0, 0, 0, .3)); }';
    assert.equal(pickScheme(css, 'light'), '.ds-theme { --ds-color-scheme: light; --a: #fff; --b: 0 1px rgba(1, 2, 3, .3); }');
    assert.equal(pickScheme(css, 'dark'), '.ds-theme { --ds-color-scheme: dark; --a: #000; --b: 0 1px rgba(0, 0, 0, .3); }');
    assert.equal(pickScheme('/* light-dark() */', 'dark'), '/* light-dark() */');
  });

  it('is deterministic', () => {
    const options = { seed: 'oklch(60% 0.15 40)', scheme: 'vibrant', contrast: 'medium', accent: '#7b5800', name: 'again' };
    assert.equal(generateTheme(options).css, generateTheme(options).css);
  });

  it('rejects what it cannot read', () => {
    assert.throws(() => generateTheme({}), /seed/);
    assert.throws(() => generateTheme({ seed: 'blue' }), /seed/);
    assert.throws(() => generateTheme({ seed: '#123456', scheme: 'expressive' }), /scheme/);
    assert.throws(() => generateTheme({ seed: '#123456', contrast: 'max' }), /contrast/);
    assert.throws(() => generateTheme({ seed: '#123456', name: '../x' }), /name/);
  });

  it('passes every pair and check-theme.mjs in light, dark and high contrast for 60 seeds across the hue wheel and the chroma range', () => {
    const schemes = Object.keys(SCHEMES);
    let themes = 0;
    for (let i = 0; i < 60; i += 1) {
      // Hues every 6 degrees, chroma 4 to 100 and tone 30 to 70 in coprime cycles, every scheme in turn.
      const hue = (i * 6 + 7) % 360;
      const seed = hexFromArgb(Hct.from(hue, [4, 16, 32, 48, 72, 100][i % 6], [30, 40, 50, 60, 70][i % 5]).toInt());
      for (const contrast of Object.keys(CONTRAST_LEVELS)) {
        const scheme = schemes[(i + Object.keys(CONTRAST_LEVELS).indexOf(contrast)) % schemes.length];
        const theme = generateTheme({ seed, scheme, contrast });
        themes += 1;
        const label = `${seed} ${scheme} ${contrast}`;
        for (const view of ['light', 'dark']) assert.deepEqual(failing(pickScheme(theme.css, view)), [], `${label} ${view}`);
        assert.deepEqual(findings(theme.css, label), [], label);
        const { min } = theme.report.reduce((low, pair) => (pair.ratio - pair.min < low.ratio - low.min ? pair : low));
        assert.ok(theme.report.every((pair) => pair.ratio >= pair.min), `${label}: the report agrees (lowest minimum ${min})`);
        const series = CHART_MARKS.slice(0, 4).map((name) => theme.light[FOLLOWS[name] ?? name]);
        assert.equal(new Set(series).size, 4, `${label}: four distinct chart series`);
      }
    }
    assert.equal(themes, 180);
  });

  it('raises the minimums with the contrast level and moves tones, never the pairs', () => {
    const seed = '#f4d03f';
    const standard = generateTheme({ seed, scheme: 'fidelity' });
    const high = generateTheme({ seed, scheme: 'fidelity', contrast: 'high' });
    assert.ok(standard.report.filter((pair) => pair.kind === 'text').every((pair) => pair.min === 4.5));
    assert.ok(high.report.filter((pair) => pair.kind === 'text').every((pair) => pair.min === 7 && pair.ratio >= 7));
    assert.ok(high.report.filter((pair) => pair.kind !== 'text').every((pair) => pair.min === 4.5 && pair.ratio >= 4.5));
    // A light yellow seed: its tone-40 primary would sit under 4.5:1 on some surface, so a tone moved and the header says so.
    assert.ok(high.moves.length > 0);
    for (const move of high.moves) assert.match(high.css, new RegExp(`\\* {3}${move.role} ${move.scheme}: ${move.from} -> ${move.to}\\n`));
    assert.match(high.css, /--ds-focus-width: 3px;/);
    assert.match(high.css, /--ds-link-underline: currentColor;/);
    assert.doesNotMatch(standard.css, /--ds-focus-width/);
  });

  it('reports APCA as advice, next to the WCAG ratio of every pair', () => {
    const { report } = generateTheme({ seed: '#0b57d0' });
    assert.equal(report.length, 2 * pairResults(() => undefined).length);
    for (const pair of report) assert.ok(Number.isFinite(pair.apca) && Number.isFinite(pair.ratio), `${pair.fg} on ${pair.bg}`);
  });
});

describe('themes/presets/', () => {
  const files = presetFiles();

  it('holds exactly what the generator writes (node scripts/tools/theme.mjs --presets)', () => {
    const onDisk = filesIn('themes/presets').map((path) => path.slice('themes/presets/'.length));
    assert.deepEqual(onDisk, [...files.keys()].sort());
    for (const [file, css] of files) assert.equal(read(`themes/presets/${file}`), css, `themes/presets/${file} is out of date`);
    assert.deepEqual(PRESETS.map((preset) => preset.name), ['default', 'slate', 'ocean', 'forest', 'violet', 'amber', 'rose', 'graphite']);
  });

  it('passes check-theme.mjs in both schemes, without an error or a warning', () => {
    const tokens = JSON.parse(tokensJson(packageInfo()));
    const deprecations = JSON.parse(read('src/deprecations.json'));
    for (const [file, css] of files) {
      // As written: check-theme.mjs reads light-dark() and checks every pair in both schemes, so nothing is left unchecked.
      assert.deepEqual(checkTheme({ files: [{ path: file, css }], tokens, deprecations }).map((f) => `${f.level} ${f.rule} ${f.message}`), [], file);
      for (const scheme of ['light', 'dark']) {
        const found = checkTheme({ files: [{ path: file, css: pickScheme(css, scheme) }], tokens, deprecations });
        assert.deepEqual(found.map((f) => `${f.level} ${f.rule} ${f.message}`), [], `${file} (${scheme})`);
      }
    }
  });

  it('keeps the default preset close to the 2.x palette: its seed is --ds-primary of tokens.css', () => {
    const primary = defaults();
    const preset = PRESETS.find((entry) => entry.name === 'default');
    assert.equal(preset.seed, primary.get('--ds-primary'));
    const theme = generateTheme({ ...preset });
    const distance = (a, b) => {
      const [x, y] = [parseColour(a), parseColour(b)];
      return Math.max(...[0, 1, 2].map((i) => Math.abs(x[i] - y[i])));
    };
    // Light against tokens.css, dark against themes/dark.css: the brand roles within a few steps per channel.
    const dark = Object.fromEntries([...stripComments(read('themes/dark.css')).matchAll(/(--ds-[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
    const near = { '--ds-primary': 8, '--ds-accent': 12, '--ds-on-accent': 12, '--ds-backdrop': 12, '--ds-surface': 0, '--ds-surface-high': 12, '--ds-text-2': 12, '--ds-outline': 12, '--ds-error': 16, '--ds-success': 8, '--ds-warning': 8 };
    for (const [name, limit] of Object.entries(near)) {
      assert.ok(distance(theme.light[name], primary.get(name)) <= limit, `${name} light: ${theme.light[name]} vs ${primary.get(name)}`);
    }
    for (const name of ['--ds-primary', '--ds-on-primary', '--ds-text', '--ds-text-2']) {
      assert.ok(distance(theme.dark[name], dark[name]) <= 16, `${name} dark: ${theme.dark[name]} vs ${dark[name]}`);
    }
    function defaults() {
      const values = new Map(JSON.parse(tokensJson(packageInfo())).tokens.map((entry) => [entry.name, entry.default]));
      const resolved = new Map();
      for (const name of values.keys()) {
        const colour = resolveColour(`var(${name})`, (key) => values.get(key));
        if (colour) resolved.set(name, `#${colour.slice(0, 3).map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`);
      }
      return resolved;
    }
  });

  it('ships the presets in dist/themes/presets/ and the generator in dist/tools/', () => {
    const out = build();
    const info = packageInfo();
    for (const [file, css] of files) assert.equal(out.get(`themes/presets/${file}`)?.toString('utf8'), withBanner(file, css, info), file);
    for (const tool of ['color.mjs', 'theme.mjs']) assert.equal(out.get(`tools/${tool}`)?.toString('utf8'), withBanner(tool, read(`scripts/tools/${tool}`), info), tool);
  });
});

describe('tools/theme.mjs as a CLI', () => {
  const cli = (args) => spawnSync(process.execPath, [join(ROOT, 'scripts/tools/theme.mjs'), ...args], { encoding: 'utf8' });

  it('writes valid CSS that check-theme.mjs passes, and says what it did', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ds-theme-'));
    try {
      const out = join(dir, 'brand.css');
      const run = cli(['--seed', '#7b5800', '--scheme', 'tonal', '--contrast', 'medium', '--success', 'rgb(0 110 40)', '--name', 'brand', '--out', out]);
      assert.equal(run.status, 0, run.stderr);
      assert.match(run.stderr, /pairs pass in both schemes/);
      assert.match(run.stderr, /APCA, advisory/);
      const css = readFileSync(out, 'utf8');
      // Balanced braces and parentheses outside comments, one block per rule, nothing nested.
      const code = stripComments(css);
      assert.equal((code.match(/\{/g) ?? []).length, (code.match(/\}/g) ?? []).length);
      assert.equal((code.match(/\(/g) ?? []).length, (code.match(/\)/g) ?? []).length);
      const scanned = scan(css);
      assert.deepEqual(scanned.rules.map((rule) => rule.selector), ['.ds-theme', '.ds-theme[data-ds-scheme="light"]', '.ds-theme[data-ds-scheme="dark"]']);
      assert.ok(scanned.rules[0].declarations.every((d) => d.property.startsWith('--ds-') && d.value && !d.important));
      assert.equal(scanned.atRules.length + scanned.statements.length, 0, 'no at-rules');
      assert.match(css, /node tools\/theme\.mjs --seed '#7b5800' --scheme tonal --success '#006e28' --contrast medium --name brand/);
      const check = spawnSync(process.execPath, [join(ROOT, 'scripts/tools/check-theme.mjs'), out, '--tokens', join(ROOT, 'dist/tokens.json')], { encoding: 'utf8' });
      assert.equal(check.status, 0, check.stderr);
      assert.match(check.stdout, /check-theme: 0 errors, 0 warnings/);
      // Without --out the theme goes to stdout.
      const piped = cli(['--seed', '#7b5800', '--scheme', 'tonal', '--contrast', 'medium', '--success', 'rgb(0 110 40)', '--name', 'brand']);
      assert.equal(piped.status, 0, piped.stderr);
      assert.equal(piped.stdout, css);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exits 2 on a usage error and 0 on a preset check', () => {
    assert.equal(cli([]).status, 2);
    assert.equal(cli(['--seed']).status, 2);
    assert.equal(cli(['--seed', '#123456', '--scheme', 'expressive']).status, 2);
    assert.equal(cli(['--colour', '#123456']).status, 2);
    assert.equal(cli(['--help']).status, 0);
    const presets = cli(['--presets', '--check']);
    assert.equal(presets.status, 0, presets.stderr);
    assert.match(presets.stderr, /16 preset files checked/);
  });
});
