/*
 * The tour's theme, built from the choices under "Theme it": accent, shape
 * and density. A project writes the same thing as a plain theme.css; here it
 * is generated, so the page can show the file it would be (DemoTheme.css())
 * and swap it in one step. Like every theme it sets roles and component
 * hooks on .ds-theme, unlayered, never motion tokens or motion hooks.
 *
 * Loaded in <head>: it applies the saved choice before the first paint.
 *
 *   DemoTheme.CHOICES     the options per setting, the first one the default
 *   DemoTheme.css(choice) the theme file for { accent, shape, density }
 *   DemoTheme.apply(choice) writes it into <style id="demo-theme"> and stores it
 *   DemoTheme.saved()     the stored choice (defaults where nothing is stored)
 */
(function () {
  'use strict';

  var CHOICES = {
    accent: ['blue', 'teal', 'violet', 'green'],
    shape: ['round', 'square'],
    density: ['comfortable', 'compact'],
  };

  /* The roles a brand colour sets; hover, pressed and the link underline are derived from --ds-primary
     by the system. Blue is the system's own. */
  var ACCENTS = {
    blue: null,
    teal: {
      '--ds-primary': '#006a6a',
      '--ds-accent': '#cce8e7', '--ds-on-accent': '#002020', '--ds-inverse-primary': '#4cdada',
    },
    violet: {
      '--ds-primary': '#6750a4',
      '--ds-accent': '#e8def8', '--ds-on-accent': '#1d192b', '--ds-inverse-primary': '#d0bcff',
    },
    green: {
      '--ds-primary': '#146c2e',
      '--ds-accent': '#c4eed0', '--ds-on-accent': '#002109', '--ds-inverse-primary': '#8fd89f',
    },
  };

  /* Radius roles; actions keep the pill rule (min(radius, half the height)), so 4px reads as square. */
  var SHAPES = {
    round: null,
    square: {
      '--ds-radius-xs': '2px', '--ds-radius-sm': '2px', '--ds-radius-md': '4px', '--ds-radius-lg': '4px',
      '--ds-radius-xl': '4px', '--ds-radius-2xl': '4px', '--ds-radius-action': '4px', '--ds-radius-action-pressed': '0',
    },
  };

  var DENSITIES = {
    comfortable: null,
    compact: {
      '--ds-font-body': 'var(--ds-weight-regular) 13px/18px var(--ds-font)',
      '--ds-font-dense': 'var(--ds-weight-regular) 13px/18px var(--ds-font)',
      '--ds-font-label': 'var(--ds-weight-label) 13px/18px var(--ds-font)',
      '--ds-btn-height': '32px',
    },
  };

  /* The project's own tokens (prefix --demo-): the colour of each accent's dot, whichever accent is on. */
  var OWN = {
    '--demo-swatch-blue': '#0b57d0',
    '--demo-swatch-teal': '#006a6a',
    '--demo-swatch-violet': '#6750a4',
    '--demo-swatch-green': '#146c2e',
  };

  var KEY = 'demo-theme';

  function normalise(choice) {
    var result = {};
    for (var name in CHOICES) {
      var value = choice && choice[name];
      result[name] = CHOICES[name].indexOf(value) >= 0 ? value : CHOICES[name][0];
    }
    return result;
  }

  function block(comment, values) {
    var lines = ['  /* ' + comment + ' */'];
    for (var name in values) lines.push('  ' + name + ': ' + values[name] + ';');
    return lines.join('\n');
  }

  /* The theme file for a choice: only what differs from the defaults. */
  function css(choice) {
    var c = normalise(choice);
    var parts = [];
    if (ACCENTS[c.accent]) parts.push(block('Accent: ' + c.accent, ACCENTS[c.accent]));
    if (SHAPES[c.shape]) parts.push(block('Shape: ' + c.shape, SHAPES[c.shape]));
    if (DENSITIES[c.density]) parts.push(block('Density: ' + c.density, DENSITIES[c.density]));
    if (!parts.length) parts.push('  /* The defaults: nothing to override. */');
    return '.ds-theme {\n' + parts.join('\n\n') + '\n}\n';
  }

  function saved() {
    try { return normalise(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (error) { return normalise({}); }
  }

  function apply(choice) {
    var c = normalise(choice);
    var style = document.getElementById('demo-theme');
    if (!style) {
      style = document.createElement('style');
      style.id = 'demo-theme';
      document.head.appendChild(style);
    }
    // The page's own tokens first, then the theme the code panel shows.
    style.textContent = '.ds-theme {\n' + block('The tour\'s own tokens', OWN) + '\n}\n\n' + css(c);
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (error) { /* storage blocked */ }
    return c;
  }

  apply(saved());
  window.DemoTheme = { CHOICES: CHOICES, css: css, apply: apply, saved: saved };
})();
