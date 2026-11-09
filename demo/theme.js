/*
 * The tour's theme, chosen under "Theme it": a seed colour (one of the
 * shipped presets, or a colour of the visitor's own that the generator turns
 * into a theme), a palette style, a contrast level, the shape and density
 * options, and the appearance (light, dark or as the device). A project
 * writes the same thing as one theme.css: a preset or a generated file
 * (tools/theme.mjs), both schemes in one file through light-dark(), plus its
 * numeric options. Like every theme it sets roles and options on .ds-theme,
 * unlayered, never motion tokens or motion hooks.
 *
 * Loaded in <head> after the preset's <link id="demo-preset">: it applies the
 * saved choice before the first paint, so a reload never flashes the default.
 *
 *   DemoTheme.PRESETS          the shipped presets: name, label, seed, scheme
 *   DemoTheme.saved()          the stored choice (defaults where nothing is stored)
 *   DemoTheme.apply(choice, css) applies a choice; css is the generated file of
 *                              a custom seed (from the generator), kept for the next load
 *   DemoTheme.file(choice, css) the theme.css a project would write for it
 *   DemoTheme.appearance(value) stores the appearance (light, dark, auto) and pins it
 */
(function () {
  'use strict';

  var PRESETS = [
    { name: 'default', label: 'Default', seed: '#0b57d0', scheme: 'fidelity' },
    { name: 'slate', label: 'Slate', seed: '#475d78', scheme: 'neutral' },
    { name: 'ocean', label: 'Ocean', seed: '#00658f', scheme: 'fidelity' },
    { name: 'forest', label: 'Forest', seed: '#2f6b3a', scheme: 'fidelity' },
    { name: 'violet', label: 'Violet', seed: '#6750a4', scheme: 'tonal' },
    { name: 'amber', label: 'Amber', seed: '#9a5b00', scheme: 'fidelity' },
    { name: 'rose', label: 'Rose', seed: '#b3264d', scheme: 'fidelity' },
    { name: 'graphite', label: 'Graphite', seed: '#3c4043', scheme: 'monochrome' },
  ];
  var CHOICES = {
    contrast: ['standard', 'high'],
    shape: ['1', '.5', '0'],
    density: ['0', '-1', '-2'],
    appearance: ['auto', 'light', 'dark'],
    scheme: ['tonal', 'vibrant', 'neutral', 'fidelity', 'monochrome'],
  };
  var KEY = 'demo-theme';
  var CSS_KEY = 'demo-theme-css';
  /* The preset files sit next to the tour in the published site and in a checkout alike. */
  var PRESET_PATH = '../dist/themes/presets/';
  var root = document.documentElement;

  function presetOf(name) {
    for (var i = 0; i < PRESETS.length; i += 1) if (PRESETS[i].name === name) return PRESETS[i];
    return null;
  }

  function normalise(choice) {
    var c = choice || {};
    var out = { preset: presetOf(c.preset) ? c.preset : null, seed: /^#[0-9a-f]{6}$/i.test(c.seed || '') ? c.seed.toLowerCase() : null };
    if (!out.preset && !out.seed) out.preset = 'default';
    for (var name in CHOICES) out[name] = CHOICES[name].indexOf(String(c[name])) >= 0 ? String(c[name]) : CHOICES[name][0];
    if (out.preset) {
      out.seed = presetOf(out.preset).seed;
      out.scheme = presetOf(out.preset).scheme;
    }
    return out;
  }

  function read(key) {
    try { return localStorage.getItem(key); } catch (error) { return null; }
  }
  function write(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (error) { /* storage blocked: the choice lasts for this page */ }
  }

  function saved() {
    var choice;
    try { choice = JSON.parse(read(KEY) || '{}'); } catch (error) { choice = {}; }
    return normalise(choice);
  }

  /* The numeric options: they nest, so a region may still set its own option class. */
  function optionsCss(c) {
    var lines = [];
    if (c.shape !== '1') lines.push('  --ds-shape: ' + c.shape + ';');
    if (c.density !== '0') lines.push('  --ds-density: ' + c.density + ';');
    return lines.length ? '.ds-theme {\n' + lines.join('\n') + '\n}\n' : '';
  }

  function element(id, tag) {
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement(tag);
      el.id = id;
      document.head.appendChild(el);
    }
    return el;
  }

  /* Applies a choice: the preset's link, or the generated file in a style; the options; the appearance. */
  function apply(choice, css) {
    var c = normalise(choice);
    var link = document.getElementById('demo-preset');
    var custom = element('demo-custom', 'style');
    if (c.preset) {
      var href = PRESET_PATH + c.preset + (c.contrast === 'high' ? '-contrast' : '') + '.css';
      if (link.getAttribute('href') !== href) link.setAttribute('href', href);
      link.disabled = false;
      custom.textContent = '';
      write(CSS_KEY, null);
    } else {
      var text = css || read(CSS_KEY) || '';
      custom.textContent = text;
      // Without the generated file (storage blocked) the preset stays: the page keeps a whole theme.
      link.disabled = Boolean(text);
      if (css) write(CSS_KEY, css);
    }
    element('demo-options', 'style').textContent = optionsCss(c);
    pin(c.appearance);
    write(KEY, JSON.stringify(c));
    return c;
  }

  /* data-ds-scheme pins light or dark on the theme; auto lets the device decide (the preset holds both). */
  function pin(value) {
    if (value === 'light' || value === 'dark') root.setAttribute('data-ds-scheme', value);
    else root.removeAttribute('data-ds-scheme');
  }

  function appearance(value) {
    var c = saved();
    c.appearance = CHOICES.appearance.indexOf(value) >= 0 ? value : 'auto';
    pin(c.appearance);
    write(KEY, JSON.stringify(c));
    return c.appearance;
  }

  /* The theme.css of a choice: the preset's file named, or the generated file, then the options. */
  function file(choice, css) {
    var c = normalise(choice);
    var options = optionsCss(c);
    var head;
    if (c.preset) {
      head = '/* The ' + presetOf(c.preset).label.toLowerCase() + ' preset' + (c.contrast === 'high' ? ' at high contrast' : '') +
        ': both schemes in one file. Link it after ds.css:\n' +
        '   <link rel="stylesheet" href="vendor/dashboard-style/themes/presets/' + c.preset + (c.contrast === 'high' ? '-contrast' : '') + '.css"> */\n';
      return head + (options ? '\n/* theme.css: the options on top of it */\n' + options : '\n/* No options to add: the defaults. */\n');
    }
    head = css || read(CSS_KEY) || '/* Generating ... */\n';
    return head + (options ? '\n/* The options: numeric, read where they are used */\n' + options : '');
  }

  apply(saved());
  window.DemoTheme = { PRESETS: PRESETS, CHOICES: CHOICES, saved: saved, apply: apply, file: file, appearance: appearance, presetOf: presetOf };
})();
