/*
 * The frame of the page patterns (src/patterns/pt.js): what the pattern
 * pages share as demos, not part of any pattern. A project that copies a
 * pattern keeps its markup and its own wiring (the script at the end of
 * the page) and leaves this file behind.
 *
 * A classic script in the <head>, before the first paint, after the
 * theme's <link id="pt-theme">:
 *   - the colour scheme: ?scheme=light|dark|auto (the styleguide's
 *     preview; auto: the system's), else the choice the dark-theme button
 *     stored, else the system's (no data-ds-scheme: the light-dark() theme
 *     follows the system);
 *   - the theme preset: ?preset=<name> and ?contrast=1 load another
 *     preset of dist/themes/presets/ (the styleguide's choice);
 *   - the dark-theme button, [data-pt-scheme]: an icon toggle
 *     (aria-pressed, a fillable moon from DS.icons) that pins the dark or
 *     the light scheme and remembers it.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var KEY = 'pt-scheme';
  var PRESETS = ['default', 'slate', 'ocean', 'forest', 'violet', 'amber', 'rose', 'graphite'];
  var params = new URLSearchParams(location.search);

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function store(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* storage blocked (a frame from disk): the choice lasts for this page */ }
  }

  var asked = params.get('scheme');
  var scheme = asked === 'light' || asked === 'dark' ? asked : asked === 'auto' ? null : stored();
  if (scheme === 'light' || scheme === 'dark') root.setAttribute('data-ds-scheme', scheme);

  var preset = params.get('preset');
  var contrast = params.get('contrast') === '1';
  var theme = document.getElementById('pt-theme');
  if (theme && (PRESETS.indexOf(preset) > 0 || contrast)) {
    theme.href = theme.href.replace(/[\w-]+\.css$/, (PRESETS.indexOf(preset) >= 0 ? preset : 'default') + (contrast ? '-contrast' : '') + '.css');
  }

  var system = window.matchMedia('(prefers-color-scheme: dark)');
  function dark() {
    var pinned = root.getAttribute('data-ds-scheme');
    return pinned ? pinned === 'dark' : system.matches;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-pt-scheme]'));
    var sync = function () {
      buttons.forEach(function (button) { button.setAttribute('aria-pressed', String(dark())); });
    };
    buttons.forEach(function (button) {
      if (window.DS && !button.querySelector('svg')) button.prepend(DS.icons.iconElement(DS.icons.moon, 20, 'ds-icon--fillable'));
      button.addEventListener('click', function () {
        var next = dark() ? 'light' : 'dark';
        root.setAttribute('data-ds-scheme', next);
        store(next);
        sync();
      });
    });
    system.addEventListener('change', sync);
    sync();
  });
}());
