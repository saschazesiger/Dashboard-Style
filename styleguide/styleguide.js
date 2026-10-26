/*
 * The living styleguide: every component with the markup of
 * docs/components.md, the tokens of the active theme and the icon set
 * (index.html), and the Motion Lab (motion.html). A classic script on top
 * of dist/ds.js, so both pages run from disk. It is the one shared script
 * of both pages: the frame, navigation, themes, the speed select and the
 * readiness hook; <body data-sg-page="index|lab"> says which sections it
 * renders. The lab's demos come from the registry window.SG_LAB (lab.js,
 * loaded before this file), whose cards get Replay, Rapid toggle and
 * Reverse at 50% here.
 *
 * Overlays (dialogs, sheets, the modal drawer, menus, the combobox list,
 * snackbars and tooltips) run through DS.overlay; the rest of the small
 * behaviours here (filtering the combobox, what a menu item does) is demo
 * code, not part of the system: projects bring their own.
 *
 * Hooks for the browser tests (test/browser/), harmless when opened by hand:
 *   html[data-sg-ready]   set once render, navigation, demos and themes are
 *                         set up and a saved theme has loaded (the lab's
 *                         demos come after its first render: startLab)
 *   html[data-sg-theme]   the theme last applied, set once its values and
 *                         the indicators were updated
 *   ?speed=0.1            slow motion (a factor of 1 or less), marked
 *                         html[data-sg-speed]; it wins over the speed
 *                         select's stored choice and is not stored
 *   [data-lab-demo]       a lab card: data-lab-shows (what it exercises),
 *                         data-lab-state running or settled, and its
 *                         buttons [data-lab="replay|rapid|reverse"]
 *   window.SG_LAB_HELPERS the `sg` object the registry's functions receive
 *                         (a test calls a demo's reset() with it)
 */
(function () {
  'use strict';

  var DS = window.DS;
  var I = DS.icons;
  var M = DS.motion;
  var icon = function (name, size, cls) { return I.icon(I[name], size, cls); };
  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  var esc = function (text) { return String(text).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /** Which page this is: the styleguide (index.html) or the Motion Lab (motion.html). */
  var PAGE = document.body.getAttribute('data-sg-page') === 'lab' ? 'lab' : 'index';

  /* ── Slow motion: the speed select and ?speed=<factor> ───────────── */

  /*
   * Styleguide tooling only. --ds-time-scale multiplies every duration and
   * delay token: at a speed of 0.1 it is 10, inline on the root .ds-theme
   * element (<html>), so CSS motion and everything DS.motion times from
   * the tokens (motionDuration() reads them) run ten times slower. Themes
   * and components never set it (test/tokens.test.js forbids it in src/
   * and themes/). The select's choice is stored; ?speed= wins over it and
   * is not stored, so test runs are deterministic.
   */
  var SPEEDS = [1, 0.5, 0.25, 0.1];
  var SPEED_KEY = 'ds-styleguide-speed';
  var speed = 1;

  function applySpeed(factor) {
    var root = document.documentElement;
    speed = factor;
    if (factor < 1) {
      root.setAttribute('data-sg-speed', String(factor));
      root.style.setProperty('--ds-time-scale', String(1 / factor));
    } else {
      root.removeAttribute('data-sg-speed');
      root.style.removeProperty('--ds-time-scale');
    }
  }

  (function initialSpeed() {
    var asked = Number(new URLSearchParams(location.search).get('speed'));
    var stored = 1;
    try { stored = Number(localStorage.getItem(SPEED_KEY)); } catch (e) { stored = 1; /* storage may be blocked */ }
    applySpeed(asked > 0 && asked <= 1 ? asked : SPEEDS.indexOf(stored) !== -1 ? stored : 1);
  }());

  /* A demo's own timer (a fake request, a poll, a feed): slowed down with
     the speed like the motion, so the story keeps its pace. */
  function slow(ms) { return ms / speed; }

  /* The read-out next to the select names the speed while it is below 1,
     so a screenshot never hides it; the lab's ms labels follow. */
  function showSpeed() {
    var out = $('#sg-speed-readout');
    out.hidden = speed >= 1;
    out.textContent = 'Slow motion ' + speed + '\u00d7';
    refreshTimes();
  }

  /* The select in the top bar. A ?speed= factor that is none of its
     options gets an option of its own for the visit. */
  function setupSpeed() {
    var select = $('#sg-speed-select');
    if (SPEEDS.indexOf(speed) === -1) {
      var option = document.createElement('option');
      option.value = String(speed);
      option.textContent = speed + '\u00d7';
      select.appendChild(option);
    }
    select.value = String(speed);
    showSpeed();
    select.addEventListener('change', function () {
      applySpeed(Number(select.value));
      try { localStorage.setItem(SPEED_KEY, String(speed)); } catch (e) { /* storage may be blocked */ }
      showSpeed();
    });
  }

  /* ── Sections ─────────────────────────────────────────────────────── */

  /* The drawer: groups of [section id, label, icon], and a fourth entry
     for a link to the other page. */
  var NAV = [
    { group: 'Start', items: [['overview', 'Overview', 'overview']] },
    { group: 'Foundations', items: [['colour', 'Colour', 'image'], ['type', 'Type', 'fileText'], ['shape', 'Space and shape', 'columns']] },
    { group: 'Components', items: [['buttons', 'Buttons', 'plus'], ['status', 'Status and alerts', 'alertCircle'], ['cards', 'Cards and lists', 'list'], ['table', 'Table', 'rows'], ['forms', 'Forms', 'pencil'], ['selection', 'Chips, switch, combobox', 'check'], ['overlays', 'Overlays', 'copy'], ['loading', 'Loading and progress', 'sync'], ['charts', 'Charts', 'barChart'], ['frame', 'App frame', 'monitor']] },
    { group: 'Motion and icons', items: [['motion', 'Motion', 'sparkles'], ['lab', 'Motion Lab', 'activity', 'motion.html'], ['icons', 'Icons', 'apps']] },
  ];

  /* The lab's drawer: its sections (the groups that have demos), then the way back. */
  function labNav() {
    return [
      { group: 'Motion Lab', items: [['lab', 'Overview', 'overview']].concat(labGroups().map(function (group) { return [group.id, group.title, group.icon]; })) },
      { group: 'Styleguide', items: [['index', 'Components and tokens', 'arrowLeft', 'index.html']] },
    ];
  }

  function section(id, title, lead, body) {
    return '<section class="sg-section" id="' + id + '" aria-labelledby="' + id + '-title">' +
      '<header class="ds-page-head"><h2 class="ds-page-head__title" id="' + id + '-title">' + title + '</h2>' +
      (lead ? '<p class="ds-page-head__lead">' + lead + '</p>' : '') + '</header>' + body + '</section>';
  }

  function card(title, body, extra) {
    return '<section class="ds-card"' + (extra || '') + '>' + (title ? '<h3 class="ds-card__title">' + title + '</h3>' : '') + body + '</section>';
  }

  function label(text) { return '<p class="sg-label">' + text + '</p>'; }

  /* Overview */
  function overview() {
    return '<section class="sg-section" id="overview" aria-labelledby="overview-title">' +
      '<div class="sg-hero"><h1 id="overview-title">A calm, themeable system for dashboards</h1>' +
      '<p>White panels on a tinted backdrop, hairlines instead of shadows, pill-shaped actions and quiet motion. Every value comes from a token, so one theme file restyles everything below.</p>' +
      '<div class="sg-row"><a class="ds-btn ds-btn--primary" href="../README.md">Get started</a><a class="ds-btn" href="../docs/theming.md">Theming guide</a><a class="ds-btn ds-btn--text" href="../docs/components.md">Component markup ' + icon('arrowRight', 16) + '</a></div></div>' +
      '<div class="ds-tiles">' +
      tile('Components', '37', 'apps', 'one file each') + tile('Tokens', '120+', 'settings', 'three layers') + tile('Icons', String(glyphs().length), 'image', 'outline, 24px grid') + tile('Dependencies', '0', 'box', 'plain CSS and JS') +
      '</div></section>';
  }

  function tile(name, value, glyph, note) {
    return '<div class="ds-tile"><p class="ds-tile__label">' + icon(glyph, 20) + '<span>' + name + '</span></p><p class="ds-tile__value" data-count="' + parseInt(value, 10) + '" data-suffix="' + value.replace(/\d+/, '') + '">' + value + '</p><p class="ds-tile__note">' + note + '</p></div>';
  }

  /* Colour */
  var COLOURS = [
    ['Surfaces', ['--ds-backdrop', '--ds-surface', '--ds-surface-low', '--ds-surface-high', '--ds-surface-highest', '--ds-surface-overlay', '--ds-surface-popover']],
    ['Text and lines', ['--ds-text', '--ds-text-2', '--ds-text-3', '--ds-line', '--ds-line-2', '--ds-outline']],
    ['Primary and tint', ['--ds-primary', '--ds-on-primary', '--ds-accent', '--ds-on-accent', '--ds-action-ink', '--ds-focus']],
    ['Status', ['--ds-success', '--ds-success-container', '--ds-on-success-container', '--ds-warning', '--ds-warning-container', '--ds-warning-surface', '--ds-error', '--ds-error-container', '--ds-on-error-container']],
    ['Inverse and overlays', ['--ds-inverse', '--ds-on-inverse', '--ds-inverse-primary', '--ds-scrim', '--ds-fill-round', '--ds-disabled-fill']],
  ];

  function colour() {
    return section('colour', 'Colour', 'Roles of the active theme. Text roles pass WCAG AA on the surfaces they are meant for; the tint never carries a state alone.',
      COLOURS.map(function (group) {
        return card(group[0], '<div class="sg-swatches">' + group[1].map(function (name) {
          return '<div class="sg-swatch"><span class="sg-swatch__chip" style="background:var(' + name + ')"></span><code>' + name + '</code><span class="ds-meta" data-value="' + name + '"></span></div>';
        }).join('') + '</div>');
      }).join('') +
      card('Theme check', '<p class="ds-muted">The active theme against the rules of tools/check-theme.mjs: contrast as the browser computes it (color-mix() included), field text at 16px, and for a loaded file its motion tokens, :root, @layer and !important.</p>' +
        '<div data-sg="theme-check" aria-live="polite"></div>', ' id="sg-theme-check"'));
  }

  /* ── Theme check ──────────────────────────────────────────────────── */

  /* The pairs of scripts/tools/theme-rules.mjs (TEXT_PAIRS, CONTROL_PAIRS,
     ICON_PAIRS), copied for this classic script; test/tools.test.js keeps
     the copy equal. */
  var THEME_PAIRS = {
    text: [
      ['--ds-text', '--ds-surface'],
      ['--ds-text', '--ds-backdrop'],
      ['--ds-text', '--ds-surface-highest'],
      ['--ds-text-2', '--ds-surface'],
      ['--ds-text-2', '--ds-backdrop'],
      ['--ds-text-2', '--ds-surface-low'],
      ['--ds-text-2', '--ds-surface-high'],
      ['--ds-text-3', '--ds-surface'],
      ['--ds-on-primary', '--ds-primary'],
      ['--ds-link', '--ds-surface'],
      ['--ds-action-ink', '--ds-surface'],
      ['--ds-action-ink', '--ds-backdrop'],
      ['--ds-on-accent', '--ds-accent'],
      ['--ds-text', '--ds-accent'],
      ['--ds-text-2', '--ds-accent'],
      ['--ds-on-error-container', '--ds-error-container'],
      ['--ds-on-success-container', '--ds-success-container'],
      ['--ds-on-warning-container', '--ds-warning-container'],
      ['--ds-text', '--ds-warning-surface'],
      ['--ds-on-inverse', '--ds-inverse'],
      ['--ds-on-error-container', '--ds-surface'],
      ['--ds-primary', '--ds-surface'],
      ['--ds-primary', '--ds-surface-low'],
      ['--ds-on-error-container', '--ds-surface-low'],
      ['--ds-text', '--ds-surface-overlay'],
      ['--ds-text-2', '--ds-surface-overlay'],
      ['--ds-text', '--ds-surface-popover'],
      ['--ds-text-2', '--ds-surface-popover'],
    ],
    control: [
      ['--ds-text-2', '--ds-surface'],
      ['--ds-primary', '--ds-surface'],
      ['--ds-error', '--ds-surface'],
      ['--ds-on-primary', '--ds-primary'],
      ['--ds-surface', '--ds-error'],
    ],
    icon: [
      ['--ds-error', '--ds-surface'],
      ['--ds-success', '--ds-surface'],
      ['--ds-warning', '--ds-surface'],
      ['--ds-outline', '--ds-surface'],
      ['--ds-inverse-primary', '--ds-inverse'],
      ['--ds-focus', '--ds-surface'],
    ],
  };
  var PAIR_MIN = { text: 4.5, control: 3, icon: 3 };
  /* The motion families no theme sets (MOTION_FAMILIES of theme-rules.mjs). */
  var THEME_MOTION = /--ds-(dur|ease|distance|loop|stagger|delay|hold|scale|time-scale|motion|enter|leave|clip-from|draw-length|scan|indicator-lag|indicator-dur)[\w-]*\s*:/;

  /* The computed colour of a role on the theme root as [r, g, b, a] (rgb() or color(srgb ...)). */
  function roleColour(name) {
    var probe = document.createElement('span');
    probe.style.color = 'var(' + name + ')';
    document.documentElement.appendChild(probe);
    var text = getComputedStyle(probe).color;
    probe.remove();
    var srgb = /^color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.e-]+))?\)$/.exec(text);
    if (srgb) return [srgb[1] * 255, srgb[2] * 255, srgb[3] * 255, srgb[4] === undefined ? 1 : Number(srgb[4])];
    var rgb = /^rgba?\(([\d.]+),? ([\d.]+),? ([\d.]+)(?:[,/] ?([\d.]+))?\)$/.exec(text);
    if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), rgb[4] === undefined ? 1 : Number(rgb[4])];
    return null;
  }

  function over(top, bottom) {
    return [0, 1, 2].map(function (i) { return top[i] * top[3] + bottom[i] * (1 - top[3]); }).concat(1);
  }

  /* WCAG contrast of fg on bg (a translucent bg over white, a translucent fg over the bg). */
  function ratio(fg, bg) {
    var back = bg[3] < 1 ? over(bg, [255, 255, 255, 1]) : bg;
    var front = fg[3] < 1 ? over(fg, back) : fg;
    var lum = function (c) {
      var l = c.slice(0, 3).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
    };
    var a = lum(front);
    var b = lum(back);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }

  /* The findings for the active theme: [{ ok, text }]. `source` is the
     loaded file's text (checked for what only the file can show), or null. */
  function themeFindings(source) {
    var rows = [];
    var passed = 0;
    Object.keys(THEME_PAIRS).forEach(function (kind) {
      THEME_PAIRS[kind].forEach(function (pair) {
        var fg = roleColour(pair[0]);
        var bg = roleColour(pair[1]);
        if (!fg || !bg) { rows.push({ ok: false, text: '<code>' + pair[0] + '</code> on <code>' + pair[1] + '</code>: not a colour' }); return; }
        var value = ratio(fg, bg);
        if (value >= PAIR_MIN[kind]) { passed += 1; return; }
        rows.push({ ok: false, text: '<code>' + pair[0] + '</code> on <code>' + pair[1] + '</code>: ' + value.toFixed(2) + ':1, needs ' + PAIR_MIN[kind] + ':1 (' + kind + ')' });
      });
    });
    var probe = document.createElement('span');
    probe.style.font = 'var(--ds-font-input)';
    document.documentElement.appendChild(probe);
    var size = parseFloat(getComputedStyle(probe).fontSize);
    probe.remove();
    if (size < 16) rows.push({ ok: false, text: '<code>--ds-font-input</code> is ' + size + 'px: keep field text at 16px or more' });
    if (source) {
      var text = String(source).replace(/\/\*[\s\S]*?\*\//g, '');
      var motion = text.match(new RegExp(THEME_MOTION.source, 'g'));
      if (motion) rows.push({ ok: false, text: 'Sets motion tokens or hooks (' + motion.map(function (m) { return '<code>' + m.replace(/\s*:$/, '') + '</code>'; }).join(', ') + '): motion is one scheme for every product' });
      if (/:root\b/.test(text)) rows.push({ ok: false, text: 'Rules on <code>:root</code>: tokens live on <code>.ds-theme</code>' });
      if (/@layer\b/.test(text)) rows.push({ ok: false, text: 'Uses <code>@layer</code>: a theme stays unlayered' });
      if (/!\s*important/.test(text)) rows.push({ ok: false, text: 'Uses <code>!important</code>' });
    }
    rows.unshift({ ok: true, text: passed + ' contrast pairs pass' });
    return rows;
  }

  function renderThemeCheck(source) {
    var host = $('[data-sg="theme-check"]');
    if (!host) return;
    var rows = themeFindings(source);
    DS.dom.morphHtml(host, '<ul class="ds-plain-list sg-findings">' + rows.map(function (row) {
      var status = row.ok
        ? '<span class="ds-status ds-status--ok">' + icon('check', 16) + '<span>Passes</span></span>'
        : '<span class="ds-status ds-status--error">' + icon('alert', 16) + '<span>Fails</span></span>';
      return '<li class="sg-finding" data-ok="' + row.ok + '">' + status + '<span>' + row.text + '</span></li>';
    }).join('') + '</ul>');
  }

  /* Type */
  var TYPE = [
    ['--ds-font-display', 'Key figure 1,284'], ['--ds-font-headline', 'Page title'], ['--ds-font-title', 'Dialog and section title'],
    ['--ds-font-subtitle', 'Card title'], ['--ds-font-reading', 'Running text meant to be read, at a comfortable size.'],
    ['--ds-font-body', 'Default UI text, fields and descriptions.'], ['--ds-font-dense', 'Table cell text'], ['--ds-font-label', 'Button and label'],
    ['--ds-font-chip', 'Chip'], ['--ds-font-meta', 'Hint, timestamp, tooltip'], ['--ds-font-caption', 'Status chip, field label'], ['--ds-font-code', 'const code = true;'],
  ];

  function type() {
    return section('type', 'Type', 'Roles are font shorthands: size, line height, weight and family in one token. Headings are regular weight; the label weight marks buttons and labels.',
      card('', TYPE.map(function (role) {
        return '<div class="sg-type"><p style="font:var(' + role[0] + ')">' + role[1] + '</p><code>' + role[0] + '</code><span class="ds-meta" data-font="' + role[0] + '"></span></div>';
      }).join('')));
  }

  /* Space, radii, elevation */
  function shape() {
    var spaces = ['1', '2', '3', '4', '5', '6', '7', '8', '10', '12'];
    var radii = ['--ds-radius-xs', '--ds-radius-sm', '--ds-radius-md', '--ds-radius-lg', '--ds-radius-xl', '--ds-radius-2xl', '--ds-radius-action'];
    var roles = ['--ds-radius-card', '--ds-radius-dialog', '--ds-radius-panel', '--ds-radius-field', '--ds-radius-chip'];
    var elevations = ['--ds-elev-hover', '--ds-elev-popover', '--ds-elev-overlay'];
    return section('shape', 'Space and shape', 'A 4px spacing grid, a radius scale with roles (every action is a pill), and three elevation roles for floating layers only.',
      card('Spacing', '<div class="sg-spaces">' + spaces.map(function (n) {
        return '<div class="sg-space"><span class="sg-space__bar" style="height:var(--ds-space-' + n + ')"></span><code>' + n + '</code></div>';
      }).join('') + '</div>') +
      card('Radius scale and roles', '<div class="sg-shapes">' + radii.concat(roles).map(function (name) {
        return '<div class="sg-shape" style="border-radius:var(' + name + ')"><code>' + name.replace('--ds-radius-', '') + '</code></div>';
      }).join('') + '</div>') +
      card('Elevation', '<div class="sg-shapes">' + elevations.map(function (name) {
        return '<div class="sg-shape sg-shape--raised" style="box-shadow:var(' + name + ');border-radius:var(--ds-radius-card)"><code>' + name.replace('--ds-elev-', '') + '</code></div>';
      }).join('') + '</div>'));
  }

  /* Buttons */
  function buttons() {
    return section('buttons', 'Buttons', 'Every action is a pill. One filled button per area; no red buttons: the main action names the consequence.',
      '<div class="ds-grid-2">' +
      card('Variants', label('Primary, tonal, outlined, text, quiet') +
        '<div class="sg-row"><button class="ds-btn ds-btn--primary" type="button">Save</button><button class="ds-btn ds-btn--tonal" type="button">Add entry</button><button class="ds-btn" type="button">Export</button><button class="ds-btn ds-btn--text" type="button">Details</button><button class="ds-btn ds-btn--quiet" type="button">' + icon('filter', 16) + 'Filter</button></div>' +
        label('With icons, small, icon only, disc') +
        '<div class="sg-row"><button class="ds-btn ds-btn--primary" type="button">' + icon('plus', 16) + 'New device</button><button class="ds-btn ds-btn--sm" type="button">' + icon('download', 16) + 'CSV</button><button class="ds-btn ds-btn--text ds-btn--sm" type="button">Undo</button><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Settings" data-tip="Settings">' + icon('settings', 20) + '</button><button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--disc" type="button" aria-label="More" data-tip="More actions">' + icon('moreVertical', 20) + '</button><button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--sm" type="button" aria-label="Edit" data-tip="Edit">' + icon('pencil', 18) + '</button></div>' +
        label('Toggle (aria-pressed)') +
        '<div class="sg-row"><button class="ds-btn ds-btn--quiet" type="button" aria-pressed="true" data-sg="toggle">' + icon('filter', 16) + 'Filter</button><button class="ds-btn" type="button" aria-pressed="false" data-sg="toggle">Only active</button></div>') +
      card('States', label('Disabled') +
        '<div class="sg-row"><button class="ds-btn ds-btn--primary" type="button" disabled>Save</button><button class="ds-btn ds-btn--tonal" type="button" disabled>Add entry</button><button class="ds-btn" type="button" disabled>Export</button><button class="ds-btn ds-btn--text" type="button" disabled>Details</button></div>' +
        label('aria-disabled: focusable, the tooltip says why') +
        '<div class="sg-row"><button class="ds-btn ds-btn--primary" type="button" aria-disabled="true" data-tip="Fill in the serial number first">Publish</button></div>' +
        label('Busy, then done: spinner only after the loader delay (DS.motion.busy)') +
        '<div class="sg-row"><button class="ds-btn ds-btn--primary" type="button" data-sg="busy">' + faces('Save changes', 'Saving', 'Saved') + '</button><button class="ds-btn" type="button" data-sg="busy-fail">' + faces('Sync now', 'Syncing', 'Synced') + '</button></div>' +
        label('Icon swaps: copy to check, a pressed toggle') +
        '<div class="sg-row"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Copy link" data-sg="copy"><span class="ds-icon-swap">' + icon('copy', 20) + '</span></button>' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Work offline" aria-pressed="false" data-sg="toggle"><span class="ds-icon-swap"><span class="ds-icon-swap__a">' + icon('wifi', 20) + '</span><span class="ds-icon-swap__b">' + icon('wifiOff', 20) + '</span></span></button>' +
        '<button class="ds-link-btn" type="button">A button that reads like a link</button></div>') +
      '</div>' +
      '<div class="ds-grid-2">' +
      card('Panels, adaptive labels, quiet links', label('Opens a panel: tinted while it is open (aria-expanded)') +
        '<div class="sg-row"><button class="ds-btn ds-btn--disclosure" type="button" aria-expanded="false" data-sg="expand">' + icon('filter', 16) + 'Filters</button>' +
        '<button class="ds-btn" type="button" aria-haspopup="dialog" aria-expanded="true">Details (its sheet is open)</button>' +
        '<button class="ds-btn ds-btn--quiet" type="button" aria-haspopup="menu" aria-expanded="true">A menu trigger stays plain</button></div>' +
        label('Adaptive: the label folds away in a content panel of 600px or less') +
        '<div class="sg-row"><button class="ds-btn ds-btn--adaptive" type="button" data-tip="Export">' + icon('download', 16) + '<span class="ds-btn__label">Export</span></button>' +
        '<button class="ds-btn ds-btn--adaptive ds-btn--sm" type="button" data-tip="Share">' + icon('link', 16) + '<span class="ds-btn__label">Share</span></button></div>' +
        label('Quiet links next to the main one') +
        '<div class="sg-row"><a href="#buttons">Open the record</a><a class="ds-link--quiet" href="#buttons">Show history</a><button class="ds-link-btn ds-link-btn--quiet" type="button">Edit columns</button></div>' +
        label('Touch targets: .ds-touch on the page sets every target to 48px') +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" aria-pressed="false" data-sg="touch">Touch targets</button></div>') +
      card('A choice made once, then locked', '<p class="ds-muted">Vote once: the pressed toggle keeps its on look while aria-disabled, its sibling dims. The thumb fills while pressed (.ds-icon--fillable).</p>' +
        '<div class="sg-row" role="group" aria-label="Was this helpful?" id="sg-vote">' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-pressed="false" aria-label="Helpful" data-tip="Helpful" data-sg="vote">' + icon('thumbUp', 20, 'ds-icon--fillable') + '</button>' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-pressed="false" aria-label="Not helpful" data-tip="Not helpful" data-sg="vote">' + icon('thumbDown', 20, 'ds-icon--fillable') + '</button>' +
        '<button class="ds-btn ds-btn--text ds-btn--sm" type="button" data-sg="vote-reset">Vote again</button></div>' +
        label('Locked choices, rendered') +
        '<div class="sg-row"><button class="ds-btn" type="button" aria-pressed="true" aria-disabled="true" data-tip="Sent on Monday">' + icon('check', 16) + 'Approved</button><button class="ds-btn" type="button" aria-pressed="false" aria-disabled="true" data-tip="Sent on Monday">Rejected</button></div>') +
      '</div>' +
      card('Press, focus and disabled', '<p class="ds-muted">Point at a button in the first column for its hover, press and hold it for the morph and the ripple, or Tab to it for the ring that snaps in. The second column holds the press (a static .ds-pressed).</p>' +
        '<div class="ds-table-wrap"><table class="ds-table sg-states"><caption class="ds-sr">Button states</caption><thead><tr><th scope="col">Variant</th><th scope="col">Rest</th><th scope="col">Held press</th><th scope="col">Disabled</th><th scope="col">aria-disabled</th></tr></thead><tbody>' +
        BUTTON_VARIANTS.map(function (variant) {
          var make = function (extra) {
            return '<button class="ds-btn' + variant[1] + (extra === 'pressed' ? ' ds-pressed' : '') + '" type="button"' +
              (variant[2] ? ' aria-label="' + variant[2] + '"' : '') +
              (extra === 'pressed' ? ' data-ds-ripple="off" tabindex="-1"' : '') + (extra === 'disabled' ? ' disabled' : '') + (extra === 'aria' ? ' aria-disabled="true"' : '') + '>' + variant[3] + '</button>';
          };
          return '<tr><th scope="row">' + variant[0] + '</th><td>' + make('') + '</td><td>' + make('pressed') + '</td><td>' + make('disabled') + '</td><td>' + make('aria') + '</td></tr>';
        }).join('') + '</tbody></table></div>'));
  }

  /* The rows of the button state table: name, classes, aria-label, content. */
  var BUTTON_VARIANTS = [
    ['Primary', ' ds-btn--primary', '', 'Save'],
    ['Tonal', ' ds-btn--tonal', '', 'Add entry'],
    ['Outlined', '', '', 'Export'],
    ['Text', ' ds-btn--text', '', 'Details'],
    ['Quiet', ' ds-btn--quiet', '', icon('filter', 16) + 'Filter'],
    ['Icon', ' ds-btn--quiet ds-btn--icon', 'Settings', icon('settings', 20)],
    ['Disc', ' ds-btn--quiet ds-btn--icon ds-btn--disc', 'More actions', icon('moreVertical', 20)],
  ];

  /* Status and alerts */
  function status() {
    return section('status', 'Status and alerts', 'Status is never colour alone: always an icon and a word, on the tonal container of its status.',
      card('Status chips', '<div class="sg-row">' +
        '<span class="ds-status ds-status--ok">' + icon('check', 16) + '<span>Synced</span></span>' +
        '<span class="ds-status ds-status--warning">' + icon('alert', 16) + '<span>Expires soon</span></span>' +
        '<span class="ds-status ds-status--error">' + icon('alert', 16) + '<span>Failed</span></span>' +
        '<span class="ds-status ds-status--running"><span class="ds-spinner ds-status__spinner" aria-hidden="true"></span><span>Running</span></span>' +
        '<span class="ds-status">' + icon('clock', 16) + '<span>Waiting</span></span>' +
        '<span class="ds-status">' + icon('ban', 16) + '<span>Off</span></span></div>' +
        // The toggle first: the chip changes width on every tick, and the button the user presses again must not move.
        '<div class="sg-row"><button class="ds-btn ds-btn--sm ds-btn--quiet" type="button" data-sg="status-poll" aria-pressed="false">Poll every 1.5s</button><span id="sg-status-poll">' + pollChip(0) + '</span></div>' +
        '<p class="ds-muted">A polled chip, rendered with DS.dom.morphHtml: the kept chip changes colour over 250ms, an icon that comes in new fades in and springs up, the word changes at once.</p>') +
      card('Badges and tags', label('Badges: counts on buttons and chips (a toned badge has its word next to it)') +
        '<div class="sg-row"><button class="ds-btn" type="button" data-sg="badge-add">' + icon('mail', 16) + 'Inbox <span class="ds-badge" id="sg-badge">3</span></button>' +
        '<button class="ds-btn ds-btn--quiet" type="button" aria-pressed="true" data-sg="toggle">' + icon('filter', 16) + 'Filters <span class="ds-badge">2</span></button>' +
        '<button class="ds-btn ds-btn--tonal" type="button">Updates <span class="ds-badge ds-badge--neutral">12</span></button>' +
        '<span class="sg-row"><span>Failed</span><span class="ds-badge ds-badge--error">2</span><span>Warnings</span><span class="ds-badge ds-badge--warning">5</span><span>Passed</span><span class="ds-badge ds-badge--ok">41</span></span></div>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="badge-add">' + icon('plus', 16) + 'One more</button><button class="ds-btn ds-btn--sm" type="button" data-sg="badge-clear">Mark all read</button></div>' +
        label('Tags: words, not states or counts') +
        '<div class="sg-row"><span class="ds-tag">Preview</span><span class="ds-tag">' + icon('sparkles', 16) + 'Beta</span><span class="ds-tag ds-tag--neutral">' + icon('tag', 16) + 'External</span></div>') +
      card('Alerts',
        '<div class="sg-alerts" id="sg-alerts">' +
        '<div class="ds-alert ds-alert--info" role="status">' + icon('info', 20) + '<span class="ds-alert__text">The nightly sync runs at 02:00. Changes made now appear tomorrow.</span><button class="ds-btn ds-btn--text ds-btn--sm" type="button" data-sg="alert-dismiss">Dismiss</button></div>' +
        '<div class="ds-alert ds-alert--success">' + icon('checkCircle', 20) + '<span class="ds-alert__text">All 128 devices are up to date.</span><button class="ds-btn ds-btn--text ds-btn--sm" type="button" data-sg="alert-dismiss">Dismiss</button></div>' +
        '<div class="ds-alert ds-alert--warning">' + icon('alert', 20) + '<span class="ds-alert__text">The certificate expires in 5 days.</span><button class="ds-btn ds-btn--text ds-btn--sm" type="button">Renew</button></div>' +
        '<div class="ds-alert ds-alert--error" role="alert">' + icon('alertCircle', 20) + '<span class="ds-alert__text">Could not reach the directory server.</span><button class="ds-btn ds-btn--text ds-btn--sm" type="button">Try again</button></div>' +
        '</div>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="alert-insert">' + icon('plus', 16) + 'Insert an alert</button></div>' +
        '<p class="ds-muted">Both through DS.motion.flip on the stack: a dismissed alert fades out in place while the ones below glide up; a new one fades in at the top while the others glide down (past six, the oldest goes in the same call).</p>' +
        '<details class="ds-errors ds-collapsible"><summary>' + icon('alertCircle', 16) + '2 rows were skipped' + icon('chevronDown', 16, 'ds-errors__chevron') + '</summary><ul><li>Row 4: unknown model "XPS 13 9999"</li><li>Row 9: duplicate serial number</li></ul></details>') +
      '<div class="ds-grid-2">' +
      card('Titles and actions', '<div class="ds-stack">' +
        '<div class="ds-alert ds-alert--warning">' + icon('alert', 20) + '<div class="ds-alert__text"><p class="ds-alert__title">Certificate expires soon</p><p>The server certificate of the directory expires on 1 May.</p><p>Renew it before then, or sign-ins stop.</p></div>' +
        '<div class="ds-alert__actions"><button class="ds-btn ds-btn--text ds-btn--sm" type="button">Renew</button><button class="ds-btn ds-btn--text ds-btn--sm" type="button">Remind me</button></div></div>' +
        '<div class="ds-alert">' + icon('info', 20) + '<span class="ds-alert__text"><span class="ds-alert__title">Maintenance tonight</span> The directory is read-only from 22:00 to 23:00.</span></div></div>' +
        '<p class="ds-muted">The "Square containers" preset turns on --ds-alert-edge: an edge in the icon colour.</p>') +
      card('Findings in a card', '<div class="ds-alert ds-alert--plain ds-alert--error">' + icon('alertCircle', 20) + '<span class="ds-alert__text"><strong class="ds-alert__title">Disk almost full</strong> 92% used on drive C.</span></div>' +
        '<div class="ds-alert ds-alert--plain ds-alert--warning">' + icon('alert', 20) + '<span class="ds-alert__text">The warranty ends in 30 days.</span></div>' +
        '<div class="ds-alert ds-alert--plain ds-alert--success">' + icon('checkCircle', 20) + '<span class="ds-alert__text">The disk is encrypted.</span></div>') +
      '</div>');
  }

  /* The polled status chip: running, then ok, then error, and round again. */
  var POLL = [['running', '', 'Syncing'], ['ok', 'check', 'Synced'], ['error', 'alert', 'Failed']];
  var poll = { step: 0, timer: 0 };

  function pollChip(step) {
    var state = POLL[step % POLL.length];
    var mark = state[1] ? icon(state[1], 16) : '<span class="ds-spinner ds-status__spinner" aria-hidden="true"></span>';
    return '<span class="ds-status ds-status--' + state[0] + '">' + mark + '<span>' + state[2] + '</span></span>';
  }

  function togglePoll(button) {
    var on = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(on));
    clearInterval(poll.timer);
    poll.timer = 0;
    if (!on) return;
    poll.timer = setInterval(function () {
      poll.step += 1;
      DS.dom.morphHtml($('#sg-status-poll'), pollChip(poll.step));
    }, slow(1500));
  }

  /* Alerts come and go through flip() on their stack (a grid with a gap). */
  var alertCount = 0;
  var ALERT_NEWS = ['Synced LAPTOP-0042.', 'Imported 12 devices.', 'TABLET-0121 is back online.', 'Exported the list as CSV.'];

  function insertAlert() {
    var stack = $('#sg-alerts');
    var holder = document.createElement('div');
    holder.innerHTML = '<div class="ds-alert ds-alert--success">' + icon('checkCircle', 20) + '<span class="ds-alert__text">' + ALERT_NEWS[alertCount % ALERT_NEWS.length] + '</span><button class="ds-btn ds-btn--text ds-btn--sm" type="button" data-sg="alert-dismiss">Dismiss</button></div>';
    alertCount += 1;
    var alert = holder.firstChild;
    var shown = $$(':scope > .ds-alert:not([data-ds-leaving])', stack);
    var oldest = shown.length >= 6 ? shown[shown.length - 1] : null;
    M.flip(stack, function () {
      if (oldest) oldest.remove();
      stack.prepend(alert);
    });
  }

  function dismissAlert(button) {
    var alert = button.closest('.ds-alert');
    var stack = $('#sg-alerts');
    // Focus moves on before its button goes: to the next alert's button, else the insert button.
    if (alert.contains(document.activeElement)) {
      var next = alert.nextElementSibling || alert.previousElementSibling;
      ((next && $('button', next)) || $('[data-sg="alert-insert"]')).focus();
    }
    M.flip(stack, function () { alert.remove(); });
  }

  /* Cards, tiles, lists, empty state */
  function cards() {
    return section('cards', 'Cards and lists', 'White cards with a hairline; hierarchy from type and tonal tiles. Key figures never take a colour and never wrap.',
      '<div class="ds-tiles">' +
      '<div class="ds-tile"><p class="ds-tile__label">' + icon('laptop', 20) + '<span>Devices</span></p><p class="ds-tile__value" id="sg-devices" data-count="1284">1284</p><p class="ds-tile__note">+12 this week</p></div>' +
      '<button class="ds-tile" type="button" data-sg="tile-open"><span class="ds-tile__label">' + icon('alert', 20) + '<span>Overdue</span></span><span class="ds-tile__value" data-count="7">7</span><span class="ds-tile__note">clickable tile</span></button>' +
      '<div class="ds-tile"><p class="ds-tile__label">' + icon('sync', 20) + '<span>Synced</span></p><p class="ds-tile__value" id="sg-synced" data-count="1210">1210</p>' +
        '<div class="ds-progress ds-progress--flat sg-tile-progress" id="sg-synced-progress" style="--ds-progress:.94"><div class="ds-progress__track" role="progressbar" aria-label="Synced devices" aria-valuemin="0" aria-valuemax="100" aria-valuenow="94"><div class="ds-progress__bar"></div></div></div>' +
        '<p class="ds-tile__note" id="sg-synced-note">74 not synced yet</p></div>' +
      '<div class="ds-tile"><p class="ds-tile__label"><span>Average age</span></p><p class="ds-tile__value">3.1 y</p></div>' +
      '</div>' +
      '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="figures">' + icon('sync', 16) + 'Refresh the figures</button></div>' +
      label('Filter by a figure: tiles that are toggles (aria-pressed)') +
      '<div class="ds-tiles ds-tiles--3" role="group" aria-label="Filter devices" id="sg-filter-tiles">' +
      '<button class="ds-tile" type="button" aria-pressed="true" data-sg="filter-tile"><span class="ds-tile__label">' + icon('check', 20) + '<span>Overdue</span></span><span class="ds-tile__value">12</span><span class="ds-tile__note">filtered</span></button>' +
      '<button class="ds-tile" type="button" aria-pressed="false" data-sg="filter-tile"><span class="ds-tile__label">' + icon('wrench', 20) + '<span>In repair</span></span><span class="ds-tile__value">3</span><span class="ds-tile__note">select to filter</span></button>' +
      '<button class="ds-tile" type="button" aria-pressed="false" data-sg="filter-tile"><span class="ds-tile__label">' + icon('ban', 20) + '<span>Retired</span></span><span class="ds-tile__value ds-tile__value--empty">No data</span><span class="ds-tile__note">select to filter</span></button>' +
      '</div>' +
      '<p class="ds-muted">Every figure counts from the value it shows (DS.motion.countUp); the bar of the synced share is set in the same task and lands on the same frame; the note changes at once.</p>' +
      '<div class="ds-grid-2">' +
      '<section class="ds-card"><div class="ds-card__row"><h3 class="ds-card__title">LAPTOP-0042</h3><span class="ds-status ds-status--ok">' + icon('check', 16) + '<span>Managed</span></span></div>' +
        '<p class="ds-muted">Issued to Ada Lovelace. <a href="#cards">Open the record</a> or copy the serial <code>5CD1234XYZ</code>.</p>' +
        '<ul class="ds-kv-list"><li><span>Model</span><strong>Latitude 7440</strong></li><li><span>Warranty until</span><strong>2027-03-31</strong></li><li><span>Storage</span><strong>512 GB</strong></li></ul>' +
        '<nav class="ds-card__links" aria-label="Related"><a class="ds-btn ds-btn--text ds-card__link" href="#cards">History ' + icon('arrowRight', 16) + '</a><a class="ds-btn ds-btn--text ds-card__link" href="#cards">Tickets ' + icon('arrowRight', 16) + '</a></nav></section>' +
      '<section class="ds-card"><div class="ds-card__row"><h3 class="ds-card__title">Sync</h3><label class="ds-switch"><input type="checkbox" role="switch" checked data-sg="switch"><span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label ds-sr">Nightly sync</span><span class="ds-switch__state" aria-hidden="true">On</span></label></div>' +
        '<dl class="ds-facts"><div><dt>Last run</dt><dd>Today, 02:00 <span class="ds-nowrap">(1 min 35 s)</span></dd></div><div><dt>Changes</dt><dd><span class="ds-parts"><span class="ds-parts__list"><span><a href="#table">3 new</a></span><span><a href="#table">1 updated</a></span><span>250 unchanged</span></span></span></dd></div><div><dt>Next</dt><dd>Tomorrow, 02:00</dd></div></dl>' +
        '<div class="ds-subsection"><h3 class="ds-card__subtitle">Sources</h3><p class="ds-muted">Directory (users, groups) and device management (hardware).</p></div>' +
        '<p class="ds-meta">Last saved today, 09:12 by Ada Lovelace</p></section>' +
      '</div>' +
      '<div class="ds-grid-2">' +
      '<button class="ds-card ds-card--interactive" type="button" data-sg="card-open" data-name="PRINTER-0003"><span class="ds-card__row"><span class="ds-card__title">PRINTER-0003</span><span class="ds-status ds-status--warning">' + icon('alert', 16) + '<span>Toner low</span></span></span><span class="ds-muted sg-card-text">Floor 2, by the kitchen. The whole card is one button: hover lays a layer over it, a press turns it squarer and ripples from the pointer.</span></button>' +
      '<div class="ds-card ds-card--interactive"><div class="ds-card__row"><h3 class="ds-card__title"><a class="ds-card__action" href="#cards" data-sg="card-open" data-name="LAPTOP-0017">LAPTOP-0017</a></h3><button class="ds-btn ds-btn--sm" type="button" data-sg="card-restart">Restart</button></div><p class="ds-muted">Issued to Grace Hopper. The title link stretches over the card, so the whole card opens the record; Restart stays a button of its own.</p></div>' +
      '</div>' +
      label('Pick one of a few cards: the card is a toggle (aria-pressed), the ring stays inside, the focus ring outside') +
      '<div class="ds-grid-2" role="group" aria-label="Plan" id="sg-plans">' +
      '<div class="ds-card ds-card--interactive"><h3 class="ds-card__title">' + icon('check', 20) + '<button class="ds-card__action" type="button" aria-pressed="true" data-sg="plan">Standard</button></h3><p class="ds-muted">Daily sync, 30 days of history.</p></div>' +
      '<div class="ds-card ds-card--interactive ds-card--elevated"><h3 class="ds-card__title"><button class="ds-card__action" type="button" aria-pressed="false" data-sg="plan">Extended</button></h3><p class="ds-muted">Hourly sync, a year of history. An elevated card with a button action.</p><a class="ds-link--quiet" href="#cards">Compare plans</a></div>' +
      '</div>' +
      '<div class="ds-grid-2">' +
      card('Empty state', '<div class="ds-empty"><span class="ds-empty__disc" aria-hidden="true">' + icon('box', 24) + '</span><p class="ds-empty__title">No devices in storage</p><p class="ds-empty__text">Devices you take back appear here until they are issued again.</p><button class="ds-btn ds-btn--tonal" type="button">' + icon('plus', 16) + 'Add device</button></div>') +
      card('Done state', '<div id="sg-done">' + doneHtml(true) + '</div><div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="done-replay">Send the request</button></div><p class="ds-muted">.ds-empty--done plays its entrance when it is inserted: the disc pops in, a ring widens once, the check draws itself.</p>') +
      card('Pressable rows, actions on demand, keys and dividers', '<ul class="ds-plain-list sg-press-rows">' +
        '<li class="sg-press-row ds-pressable ds-pressable--inset" tabindex="0" role="button" data-sg="press-row">LAPTOP-0042 <span class="ds-hover-actions"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--sm" type="button" aria-label="Edit LAPTOP-0042" data-tip="Edit">' + icon('pencil', 18) + '</button></span></li>' +
        '<li class="sg-press-row ds-pressable ds-pressable--inset" tabindex="0" role="button" data-sg="press-row">TABLET-0121 <span class="ds-hover-actions"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--sm" type="button" aria-label="Edit TABLET-0121" data-tip="Edit">' + icon('pencil', 18) + '</button></span></li>' +
        '<li class="sg-press-row ds-pressable ds-pressable--inset" tabindex="0" role="button" aria-disabled="true" data-tip="Retired devices cannot be opened">PRINTER-0003 (aria-disabled)</li></ul>' +
        '<div class="ds-divider ds-divider--label" role="separator"><span>Today</span></div>' +
        '<p class="ds-muted">Press <kbd class="ds-kbd">Ctrl</kbd> <kbd class="ds-kbd">K</kbd> to search. The rows are project elements with .ds-pressable; the edit buttons show with the row\'s hover or focus (.ds-hover-actions).</p>' +
        '<hr class="ds-divider"><div class="sg-row">Grid <span class="ds-divider ds-divider--vertical" role="separator" aria-orientation="vertical"></span> List</div>') +
      '<section class="ds-card ds-card--filled"><h3 class="ds-card__title">Filled card</h3><p class="ds-muted">A quieter block inside a card or form, for example a test result.</p><ul class="ds-plain-list"><li><span class="ds-status ds-status--ok">' + icon('check', 16) + '<span>Server reachable</span></span></li><li><span class="ds-status ds-status--ok">' + icon('check', 16) + '<span>Signed in</span></span></li><li><span class="ds-status ds-status--error">' + icon('alert', 16) + '<span>No write access</span></span></li></ul><div class="ds-more"><button class="ds-btn" type="button">Show more</button></div></section>' +
      '</div>' +
      '<div class="ds-grid-2">' +
      card('Removing the last item', '<ul class="ds-kv-list sg-items" id="sg-items">' + itemsHtml() + '</ul>' +
        '<div class="ds-empty" id="sg-items-empty" hidden><span class="ds-empty__disc" aria-hidden="true">' + icon('box', 24) + '</span><p class="ds-empty__title">No devices to return</p><p class="ds-empty__text">Every device on loan is back.</p><button class="ds-btn ds-btn--tonal" type="button" data-sg="items-restore">' + icon('plus', 16) + 'Lend two again</button></div>' +
        '<p class="ds-muted">Each item leaves through DS.motion.flip; after the last one the empty state shows and its disc pops in (DS.motion.enter(disc, \'pop\')).</p>') +
      card('Refreshing data', '<div id="sg-stale" aria-busy="false"><ul class="ds-kv-list" id="sg-stale-list">' + staleHtml() + '</ul></div>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="stale-fast">Fast refresh (150ms)</button><button class="ds-btn ds-btn--sm" type="button" data-sg="stale-slow">Slow refresh (1200ms)</button></div>' +
        '<p class="ds-muted">While a refresh runs the list carries .ds-stale and aria-busy="true". It dims only after the loader delay, so the fast refresh never dims; the fresh values show at once.</p>') +
      '</div>' + listCards());
  }

  /* The done state: a confirmation whose disc pops in and whose check draws itself. */
  function doneHtml(still) {
    return '<div class="ds-empty' + (still ? '' : ' ds-empty--done') + '" role="status"><span class="ds-empty__disc" aria-hidden="true">' + icon('check', 24) + '</span><p class="ds-empty__title">Request sent</p><p class="ds-empty__text">IT answers within a day.</p></div>';
  }

  /* Removing the last item: two devices on loan, each with its own button. */
  var ITEMS = [['i1', 'LAPTOP-0201'], ['i2', 'TABLET-0207']];

  function itemsHtml() {
    return ITEMS.map(function (item) {
      return '<li data-ds-key="' + item[0] + '"><span>' + item[1] + '</span><button class="ds-btn ds-btn--text ds-btn--sm" type="button" data-sg="item-return">Mark returned</button></li>';
    }).join('');
  }

  function returnItem(button) {
    var list = $('#sg-items');
    var item = button.closest('li');
    var next = item.nextElementSibling || item.previousElementSibling;
    if (next && item.contains(document.activeElement)) $('button', next).focus();
    M.flip(list, function () { item.remove(); }).then(function () {
      var empty = $('#sg-items-empty');
      if ($$('li:not([data-ds-leaving])', list).length || !empty.hidden) return;
      // The user removed the last one: the empty state is there at once and its disc pops in.
      list.hidden = true;
      empty.hidden = false;
      M.enter($('.ds-empty__disc', empty), 'pop');
      $('button', empty).focus({ preventScroll: true });
    });
  }

  function restoreItems() {
    var list = $('#sg-items');
    var empty = $('#sg-items-empty');
    M.leave(empty, '', { then: 'hide' }).then(function () {
      list.hidden = false;
      M.flip(list, function (options) { DS.dom.morphHtml(list, itemsHtml(), options); });
    });
  }

  /* Refreshing data: .ds-stale while a (fake) request runs. */
  var staleRun = 0;

  function staleHtml() {
    var seed = staleRun;
    return [['Online', 1180 + (seed * 37) % 60], ['Offline', 42 + (seed * 13) % 20], ['Updating', 6 + (seed * 5) % 9]].map(function (row) {
      return '<li><span>' + row[0] + '</span><strong class="ds-num">' + row[1].toLocaleString('en-US') + '</strong></li>';
    }).join('');
  }

  function refreshStale(ms) {
    var box = $('#sg-stale');
    var run = staleRun += 1;
    box.classList.add('ds-stale');
    box.setAttribute('aria-busy', 'true');
    setTimeout(function () {
      if (run !== staleRun) return;
      DS.dom.morphHtml($('#sg-stale-list'), staleHtml());
      box.classList.remove('ds-stale');
      box.setAttribute('aria-busy', 'false');
    }, slow(ms));
  }

  /* Key figures: devices and synced count from what they show; the synced
     bar is set in the same task, so bar and figure land together. */
  function syncShare() {
    var devices = Number($('#sg-devices').getAttribute('data-count'));
    var synced = Math.min(devices, Number($('#sg-synced').getAttribute('data-count')));
    var share = synced / devices;
    var bar = $('#sg-synced-progress');
    bar.style.setProperty('--ds-progress', String(share));
    $('.ds-progress__track', bar).setAttribute('aria-valuenow', String(Math.round(share * 100)));
    $('#sg-synced-note').textContent = (devices - synced).toLocaleString('en-US') + ' not synced yet';
  }

  function refreshFigures() {
    var devices = Number($('#sg-devices').getAttribute('data-count')) + Math.round(Math.random() * 12);
    $('#sg-devices').setAttribute('data-count', String(devices));
    $('#sg-synced').setAttribute('data-count', String(devices - Math.round(10 + Math.random() * 180)));
    syncShare();
    countTiles();
  }

  /* ── Lists, disclosure, timeline and tasks (2.0) ─────────────────── */

  function statusChip(status) {
    if (!status) return '';
    return '<span class="ds-status ds-status--' + status[0] + '">' + icon(status[1], 16) + '<span>' + status[2] + '</span></span>';
  }

  /* Row list: keyed rows; the opened one is current, Reorder glides them through flip(). */
  var ROWS = {
    current: 'd17',
    items: [
      { id: 'd42', name: 'LAPTOP-0042', glyph: 'laptop', meta: 'Notebook 14 · Building A', status: ['warning', 'alert', 'Warranty ends'] },
      { id: 'd17', name: 'LAPTOP-0017', glyph: 'laptop', meta: 'Notebook 14 · Building B, 2nd floor', status: ['ok', 'check', 'Managed'] },
      { id: 'p03', name: 'PRINTER-0003', glyph: 'box', meta: 'Printer · Floor 2, by the kitchen', status: ['error', 'alertCircle', 'Offline'] },
      { id: 'm09', name: 'MONITOR-0009', glyph: 'monitor', meta: 'Display · Retired, read only', status: null, blocked: true },
    ],
  };

  function rowListHtml() {
    return ROWS.items.map(function (row) {
      var current = row.id === ROWS.current;
      return '<li class="ds-list__item" data-ds-key="' + row.id + '">' + icon(row.glyph, 20, 'ds-list__icon') +
        '<span class="ds-list__text"><span class="ds-list__title"><a class="ds-list__action" href="#cards" data-sg="ls-open" data-name="' + row.name + '"' +
        (current ? ' aria-current="true"' : '') + (row.blocked ? ' aria-disabled="true" data-tip="Retired devices are read only"' : '') + '>' + row.name + '</a></span>' +
        '<span class="ds-list__meta">' + row.meta + (current ? ' · <strong>Open</strong>' : '') + '</span></span>' + statusChip(row.status) +
        '<span class="ds-list__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--sm" type="button" aria-label="More for ' + row.name + '" data-tip="More" data-sg="ls-more" data-name="' + row.name + '">' + icon('moreVertical', 18) + '</button></span>' +
        icon('chevronRight', 20, 'ds-list__chevron') + '</li>';
    }).join('');
  }

  function renderRows() {
    var list = $('#sg-rows');
    return M.flip(list, function (options) { DS.dom.morphHtml(list, rowListHtml(), options); });
  }

  /* History and activity: a timeline with day groups, a muted entry and actions; a feed with icon markers. */
  function historyHtml() {
    return '<li class="ds-timeline__group" role="presentation"><h4 class="ds-timeline__day">12 Oct 2026</h4></li>' +
      '<li class="ds-timeline__item" data-ds-key="h3"><div class="ds-timeline__head"><p class="ds-timeline__title">Issued</p>' + statusChip(['ok', 'check', 'Active']) + '</div>' +
        '<p class="ds-timeline__meta"><time datetime="2026-10-12T14:05">14:05</time> · Ada Lovelace</p><p class="ds-timeline__text">Issued to Ada Lovelace.\nCharger and bag included.</p>' +
        '<div class="ds-timeline__actions"><button class="ds-btn ds-btn--text ds-btn--sm" type="button" aria-label="Edit the entry of 12 Oct 2026, 14:05" data-sg="ls-edit">Edit</button></div></li>' +
      '<li class="ds-timeline__item ds-timeline__item--muted" data-ds-key="h2"><div class="ds-timeline__head"><p class="ds-timeline__title">Return planned</p></div>' +
        '<p class="ds-timeline__meta"><time datetime="2026-10-12T09:40">09:40</time> · Grace Hopper</p><p class="ds-timeline__text">Cancelled: the loan was extended.</p></li>' +
      '<li class="ds-timeline__group" role="presentation"><h4 class="ds-timeline__day">3 Oct 2026</h4></li>' +
      '<li class="ds-timeline__item" data-ds-key="h1"><div class="ds-timeline__head"><p class="ds-timeline__title">Repaired</p></div>' +
        '<p class="ds-timeline__meta"><time datetime="2026-10-03T09:30">09:30</time> · Service desk</p><p class="ds-timeline__text">Keyboard replaced under warranty.</p></li>';
  }

  var ACTIVITY = {
    next: 0,
    items: [
      { id: 'a2', glyph: 'user', title: 'Grace Hopper took LAPTOP-0051', meta: 'Today, 08:47' },
      { id: 'a1', glyph: 'sync', title: 'The nightly sync changed 4 devices', meta: 'Today, 02:00' },
    ],
    fresh: [['pencil', 'Ada Lovelace renamed PRINTER-0003'], ['ticket', 'Ticket #42 was closed'], ['shield', 'LAPTOP-0042 installed its updates']],
  };

  function activityHtml() {
    return ACTIVITY.items.map(function (item) {
      return '<li class="ds-timeline__item ds-timeline__item--icon" data-ds-key="' + item.id + '"><span class="ds-timeline__marker" aria-hidden="true">' + icon(item.glyph, 16) + '</span>' +
        '<div class="ds-timeline__head"><p class="ds-timeline__title">' + item.title + '</p></div><p class="ds-timeline__meta">' + item.meta + '</p></li>';
    }).join('');
  }

  function addActivity() {
    var fresh = ACTIVITY.fresh[ACTIVITY.next % ACTIVITY.fresh.length];
    ACTIVITY.next += 1;
    ACTIVITY.items.unshift({ id: 'a' + (ACTIVITY.items.length + ACTIVITY.next + 2), glyph: fresh[0], title: fresh[1], meta: 'Just now' });
    if (ACTIVITY.items.length > 4) ACTIVITY.items.pop();
    var list = $('#sg-activity');
    M.flip(list, function (options) { DS.dom.morphHtml(list, activityHtml(), options); }, { live: true });
  }

  /* Tasks: Advance finishes the running step and starts the next one. */
  var TASKS = ['Copy the image', 'Install updates', 'Join the domain', 'Restart'];
  var tasksAt = { done: 1, failed: false };

  function tasksHtml() {
    return TASKS.map(function (text, index) {
      var status = index < tasksAt.done ? 'done' : index === tasksAt.done ? (tasksAt.failed ? 'failed' : 'running') : 'pending';
      var mark = status === 'done' ? icon('checkCircle', 20) : status === 'failed' ? icon('alertCircle', 20) : status === 'running' ? '<span class="ds-spinner ds-spinner--sm"></span>' : '';
      var word = { done: ': done', running: ': running', pending: ': waiting' }[status];
      return '<li class="ds-tasks__item" data-status="' + status + '" data-ds-key="t' + index + '"><span class="ds-tasks__mark">' + mark + '</span><span class="ds-tasks__text">' + text +
        (status === 'failed' ? ': failed, the server did not answer' : '<span class="ds-sr">' + word + '</span>') + '</span></li>';
    }).join('');
  }

  function renderTasks(action) {
    if (action === 'ls-task-next') {
      if (tasksAt.failed) tasksAt.failed = false;
      else tasksAt.done = Math.min(TASKS.length, tasksAt.done + 1);
    }
    if (action === 'ls-task-fail' && tasksAt.done < TASKS.length) tasksAt.failed = true;
    if (action === 'ls-task-reset') tasksAt = { done: 0, failed: false };
    DS.dom.morphHtml($('#sg-tasks'), tasksHtml());
    $('#sg-tasks-count').textContent = tasksAt.done + ' of ' + TASKS.length;
  }

  function listCards() {
    return card('Row list', '<ul class="ds-list ds-list--interactive" id="sg-rows" aria-label="Devices">' + rowListHtml() + '</ul>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="ls-reorder">' + icon('sort', 16) + 'Reorder</button></div>' +
        '<p class="ds-muted">Each row opens its record: the title link stretches over the row, the menu button stays a control of its own. The open row is current (aria-current); the retired one is blocked. Reorder glides the rows through DS.motion.flip. In a narrow column the status, the actions and the chevron drop to a second line by themselves.</p>') +
      '<div class="ds-grid-2">' +
      card('Rows that open', '<ul class="ds-kv-list ds-kv-list--interactive">' +
        '<li><a class="ds-kv-list__row" href="#cards" data-sg="ls-kv" data-name="Ada Lovelace"><span>Owner</span><strong>Ada Lovelace</strong></a></li>' +
        '<li><button class="ds-kv-list__row" type="button" data-sg="ls-kv" data-name="the open tickets"><span>Tickets</span><strong>3 open</strong></button></li>' +
        '<li><button class="ds-kv-list__row" type="button" aria-disabled="true" data-tip="Only an administrator can change it"><span>Cost centre</span><strong>4100</strong></button></li>' +
        '<li><div class="ds-kv-list__row"><span>Serial</span><strong>5CD1234XYZ</strong></div></li>' +
        '<li><div class="ds-kv-list__row"><span>Backup</span><strong>' + icon('checkCircle', 16, 'ds-kv-list__icon ds-kv-list__icon--ok') + '<span class="ds-sr">Passed:</span> Today, 02:00</strong></div></li>' +
        '<li><div class="ds-kv-list__row"><span>Asset tag</span><strong class="ds-muted">Not set</strong></div></li></ul>' +
        '<h4 class="ds-card__subtitle">Storage</h4><ul class="ds-kv-list ds-kv-list--bars" id="sg-bars">' +
        '<li><span>System disk</span><strong>78%</strong><span class="ds-meter ds-meter--warning" aria-hidden="true" style="--ds-share:.78"></span></li>' +
        '<li><span data-tip="Shared documents and project archives">Shared documents and project archives</span><strong>31%</strong><span class="ds-meter" aria-hidden="true" style="--ds-share:.31"></span></li></ul>') +
      card('Facts in rows', '<dl class="ds-facts ds-facts--rows"><div><dt>Owner</dt><dd>Ada Lovelace<span class="ds-lock" role="img" aria-label="Set by the directory sync" data-tip="Set by the directory sync">' + icon('lock', 16) + '</span></dd></div>' +
        '<div><dt>Department</dt><dd>Research<span class="ds-lock" role="img" aria-label="Set by the directory sync" data-tip="Set by the directory sync">' + icon('lock', 16) + '</span></dd></div>' +
        '<div><dt>Location</dt><dd>Building A, 1st floor</dd></div><div><dt>Notes</dt><dd>Docking station at the desk by the window.</dd></div></dl>' +
        '<p class="ds-meta">Values with a lock come from the directory sync: change them there.</p>') +
      '</div>' +
      '<div class="ds-grid-2">' +
      card('History', '<ol class="ds-timeline" role="list" aria-label="History of LAPTOP-0042">' + historyHtml() + '</ol>') +
      card('Activity', '<ol class="ds-timeline" id="sg-activity" role="list" aria-label="Activity">' + activityHtml() + '</ol>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="ls-activity">' + icon('plus', 16) + 'Add an entry</button></div>' +
        '<p class="ds-muted">A live feed: a new entry fades in at the top while the others glide down (DS.motion.flip with live: true).</p>') +
      '</div>' +
      '<div class="ds-grid-2">' +
      card('Disclosure', '<details class="ds-collapsible ds-disclosure"><summary>Advanced settings' + icon('chevronDown', 20, 'ds-chevron') + '</summary>' +
        '<div class="ds-disclosure__body"><p class="ds-muted">Asset tag, purchase date and the cost centre.</p></div></details>' +
        '<div class="ds-disclosure-list">' + [['When does the sync run?', 'Nightly', 'Every night at 02:00; a manual run starts at once.'], ['What does a lock mean?', 'Directory', 'Another system sets the value: change it there.'], ['Who can retire a device?', 'Admins', 'Administrators of its building.']].map(function (row) {
          return '<details class="ds-collapsible ds-disclosure ds-disclosure--row" name="sg-faq"><summary><span class="ds-disclosure__title">' + row[0] + '</span><span class="ds-disclosure__meta">' + row[1] + '</span>' + icon('chevronDown', 20, 'ds-chevron') + '</summary>' +
            '<div class="ds-disclosure__body"><p class="ds-muted">' + row[2] + '</p></div></details>';
        }).join('') + '</div>') +
      card('', '<div class="ds-tasks__head"><h3 class="ds-card__title">Set up LAPTOP-0042</h3><p class="ds-meta" id="sg-tasks-count">' + tasksAt.done + ' of ' + TASKS.length + '</p></div>' +
        '<ol class="ds-tasks" id="sg-tasks" aria-label="Steps">' + tasksHtml() + '</ol>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="ls-task-next">Advance</button><button class="ds-btn ds-btn--sm" type="button" data-sg="ls-task-fail">Fail the running step</button><button class="ds-btn ds-btn--text ds-btn--sm" type="button" data-sg="ls-task-reset">Start over</button></div>') +
      '</div>';
  }

  function listsAction(action, el, event) {
    if (action === 'ls-open' || action === 'ls-kv') event.preventDefault();
    if (el.getAttribute('aria-disabled') === 'true') return;
    if (action === 'ls-open') {
      ROWS.current = el.closest('.ds-list__item').getAttribute('data-ds-key');
      renderRows();
      toast('Opened ' + el.getAttribute('data-name') + '.', 'info');
    }
    if (action === 'ls-more') toast('More for ' + el.getAttribute('data-name') + '.', 'info');
    if (action === 'ls-kv') toast('Opened ' + el.getAttribute('data-name') + '.', 'info');
    if (action === 'ls-reorder') {
      ROWS.items.push(ROWS.items.shift());
      renderRows();
    }
    if (action === 'ls-edit') toast('Editing opens a form in place (DS.motion.crossfade).', 'info');
    if (action === 'ls-activity') addActivity();
    if (/^ls-task-/.test(action)) renderTasks(action);
    if (/^ls-chart-/.test(action)) chartsAction(action, el);
  }

  /* ── Charts (2.0) ─────────────────────────────────────────────────── */

  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var CHART_SETS = [[42, 38, 51, 47, 30, 8, 5], [36, 44, 40, 52, 41, 12, 9], [28, 31, 45, 39, 50, 6, 11]];
  var chartsAt = 0;

  function columnsHtml(values, interactive) {
    var max = Math.max.apply(null, values);
    return values.map(function (value, index) {
      var share = 'style="--ds-share:' + (value / max).toFixed(3) + '"';
      var parts = '<span class="ds-columns__value">' + value + '</span><span class="ds-columns__fill" aria-hidden="true"></span><span class="ds-columns__label">' + DAYS[index] + '</span>';
      if (interactive) return '<li><button class="ds-columns__col" type="button" ' + share + ' aria-label="' + DAYS[index] + ': ' + value + ' tickets" data-sg="ls-chart-col">' + parts + '</button></li>';
      return '<li class="ds-columns__col" ' + share + '>' + parts + '</li>';
    }).join('');
  }

  var WEEKS = [['W37', 12, 9, 2], ['W38', 15, 14, 4], ['W39', 9, 12, 1], ['W40', 18, 11, 3], ['W41', 11, 16, 5], ['W42', 14, 6, 2]];

  function groupsHtml() {
    var max = 18;
    return WEEKS.map(function (week, index) {
      var current = index === WEEKS.length - 1;
      return '<li class="ds-columns__group' + (current ? ' ds-columns__group--current' : '') + '"><ol class="ds-columns__plot">' +
        '<li class="ds-columns__col" style="--ds-share:' + (week[1] / max).toFixed(3) + '"><span class="ds-columns__fill" aria-hidden="true"></span><span class="ds-sr">Opened: ' + week[1] + '</span></li>' +
        '<li class="ds-columns__col ds-columns__col--s2" style="--ds-share:' + (week[2] / max).toFixed(3) + '"><span class="ds-columns__fill" aria-hidden="true"></span><span class="ds-sr">Closed: ' + week[2] + '</span></li>' +
        '<li class="ds-columns__col ds-columns__col--s3" style="--ds-share:' + (week[3] / max).toFixed(3) + '"><span class="ds-columns__fill" aria-hidden="true"></span><span class="ds-sr">Reopened: ' + week[3] + '</span></li></ol>' +
        '<span class="ds-columns__label">' + week[0] + (current ? '<span class="ds-sr">, this week</span>' : '') + '</span></li>';
    }).join('');
  }

  var SPARK = [3, 5, 4, 7, 6, 2, 8, 5, 9, 6, 4, 7, 10, 12];

  function charts() {
    var spark = SPARK.map(function (value, index) {
      return '<li class="ds-columns__col' + (index === SPARK.length - 1 ? ' ds-columns__col--highlight' : '') + '" style="--ds-share:' + (value / 12).toFixed(3) + '"><span class="ds-columns__fill"></span></li>';
    }).join('');
    return section('charts', 'Charts', 'Meters, columns and legends from the chart roles: four series in a fixed order, each at 3:1. A fill is clipped at its share (--ds-share), never scaled, so its round end keeps its shape; the first render fills from zero, later values glide.',
      '<div class="ds-grid-2">' +
      card('Meters', '<div class="sg-meters" id="sg-meters">' +
        '<p class="sg-meter-label"><span>Disk</span><strong class="ds-num" id="sg-meter-disk">62%</strong></p><span class="ds-meter" role="meter" aria-label="Disk" aria-valuemin="0" aria-valuemax="100" aria-valuenow="62" aria-valuetext="62% used" style="--ds-share:.62"></span>' +
        '<p class="sg-meter-label"><span>Memory: high</span><strong class="ds-num">91%</strong></p><span class="ds-meter ds-meter--warning" role="meter" aria-label="Memory" aria-valuemin="0" aria-valuemax="100" aria-valuenow="91" aria-valuetext="91% used, high" style="--ds-share:.91"></span>' +
        '<p class="sg-meter-label"><span>Battery health</span><strong class="ds-num">48%</strong></p><span class="ds-meter ds-meter--neutral" role="meter" aria-label="Battery health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="48" aria-valuetext="48%" style="--ds-share:.48"></span></div>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="ls-chart-meter">' + icon('sync', 16) + 'New disk value</button></div>' +
        '<p class="ds-muted">The meter glides on --ds-ease-value while its figure counts (DS.motion.countUp) in the same task: both land on the same frame.</p>') +
      card('Columns', '<figure class="ds-columns" id="sg-columns"><figcaption class="ds-sr">Devices that checked in, per day</figcaption><ol class="ds-columns__plot">' + columnsHtml(CHART_SETS[0]) + '</ol></figure>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="ls-chart-values">' + icon('sync', 16) + 'New values</button><button class="ds-btn ds-btn--sm" type="button" data-sg="ls-chart-fill">Fill again</button></div>' +
        '<p class="ds-muted">New values glide; Fill again plays the first render (DS.motion.enterAll(marks, \'fill\'), .ds-enter--fill).</p>') +
      '</div>' +
      '<div class="ds-grid-2">' +
      card('Columns that open', '<figure class="ds-columns"><figcaption class="ds-sr">Tickets per day</figcaption><ol class="ds-columns__plot">' + columnsHtml(CHART_SETS[1], true) + '</ol></figure>' +
        '<p class="ds-muted">Each column is a button that opens its day: a state layer, an inset ring and the ripple, no morph.</p>') +
      card('Grouped, with a sparkline', '<figure class="ds-columns ds-columns--grouped"><figcaption class="ds-sr">Tickets opened, closed and reopened per week</figcaption>' +
        '<div class="ds-scroll-x" tabindex="0" role="group" aria-label="Tickets per week"><ol class="ds-columns__groups">' + groupsHtml() + '</ol></div></figure>' +
        '<ul class="ds-legend"><li><span class="ds-legend__key"></span>Opened</li><li><span class="ds-legend__key ds-legend__key--s2"></span>Closed</li><li><span class="ds-legend__key ds-legend__key--s3"></span>Reopened</li></ul>' +
        '<div class="sg-spark"><p class="sg-spark__figure">12</p><figure class="ds-columns ds-columns--mini" role="img" aria-label="Tickets per day, last 14 days: highest 12 today"><ol class="ds-columns__plot" aria-hidden="true">' + spark + '</ol></figure></div>') +
      '</div>');
  }

  /* The marks of the charts section (meters and columns) that fill on the first render. */
  function chartMarks(root) {
    return $$('.ds-meter, .ds-columns__col', root || $('#charts'));
  }

  function chartsAction(action, el) {
    if (action === 'ls-chart-values') {
      chartsAt = (chartsAt + 1) % CHART_SETS.length;
      var values = CHART_SETS[chartsAt];
      var max = Math.max.apply(null, values);
      $$('#sg-columns .ds-columns__col').forEach(function (col, index) {
        col.style.setProperty('--ds-share', (values[index] / max).toFixed(3));
        $('.ds-columns__value', col).textContent = String(values[index]);
      });
    }
    if (action === 'ls-chart-fill') M.enterAll(chartMarks($('#sg-columns')), 'fill', { stagger: false });
    if (action === 'ls-chart-meter') {
      var meter = $('#sg-meters .ds-meter');
      var next = Number(meter.getAttribute('aria-valuenow')) >= 60 ? 27 : 84;
      meter.style.setProperty('--ds-share', String(next / 100));
      meter.setAttribute('aria-valuenow', String(next));
      meter.setAttribute('aria-valuetext', next + '% used');
      M.countUp($('#sg-meter-disk'), next, { format: function (value) { return Math.round(value) + '%'; } });
    }
    if (action === 'ls-chart-col') toast('Opened the tickets of ' + el.getAttribute('aria-label').split(':')[0] + '.', 'info');
  }

  /* Table: keyed rows rendered through DS.motion.flip + DS.dom.morphHtml. */
  var TABLE = {
    rows: [
      { id: 'r1', name: 'LAPTOP-0042', model: 'Latitude 7440', owner: 'Ada Lovelace', load: 32, place: 'Building A, 1st floor', seen: 'Today, 09:12' },
      { id: 'r2', name: 'LAPTOP-0043', model: 'ThinkPad T14', owner: 'Alan Turing', load: 14, place: 'Building A, 2nd floor', seen: 'Today, 08:47' },
      { id: 'r3', name: 'DESKTOP-0107', model: 'OptiPlex 7010', owner: '', load: 93, place: 'Server room', seen: 'Today, 09:15' },
      { id: 'r4', name: 'LAPTOP-0051', model: 'EliteBook 840', owner: 'Grace Hopper', load: 78, place: 'Building B, ground floor', seen: 'Yesterday, 17:30' },
      { id: 'r5', name: 'LAPTOP-0060', model: 'Surface Pro 9', owner: '', load: 5, place: 'Storage', seen: '3 days ago' },
      { id: 'r6', name: 'TABLET-0121', model: 'iPad Air', owner: 'Katherine Johnson', load: 47, place: 'Building B, 1st floor', seen: 'Today, 07:58' },
    ],
    sort: 'name',
    dir: 'ascending',
    filter: '',
    selected: { r2: true },
    expanded: {},
    feed: 0,
  };

  function tableShown() {
    var query = TABLE.filter.trim().toLowerCase();
    var rows = TABLE.rows.filter(function (row) {
      return !query || [row.name, row.model, row.owner].join(' ').toLowerCase().indexOf(query) !== -1;
    });
    var sign = TABLE.dir === 'ascending' ? 1 : -1;
    return rows.sort(function (a, b) {
      return sign * (TABLE.sort === 'load' ? a.load - b.load : a.name.localeCompare(b.name));
    });
  }

  function loadStatus(load) {
    if (load >= 90) return ['error', 'alert', 'Overloaded'];
    if (load >= 75) return ['warning', 'alert', 'High load'];
    return ['ok', 'check', 'Active'];
  }

  /* The header row: the arrow only at the sorted column, the same up arrow for both directions. */
  function tableHeadHtml() {
    var sortable = function (key, text, cls) {
      var sorted = TABLE.sort === key;
      return '<th scope="col"' + (cls ? ' class="' + cls + '"' : '') + (sorted ? ' aria-sort="' + TABLE.dir + '"' : '') + '><button class="ds-table__sort" type="button" data-sg="table-sort" data-key="' + key + '">' + text + (sorted ? icon('arrowUp', 16, 'ds-table__sort-arrow') : '') + '</button></th>';
    };
    return '<tr><th scope="col"><input type="checkbox" aria-label="Select all devices" data-sg="select-all"></th><th scope="col"><span class="ds-sr">Details</span></th>' +
      sortable('name', 'Device') + '<th scope="col" class="ds-col--secondary">Model</th><th scope="col" class="ds-col--secondary">Owner</th>' +
      sortable('load', 'Load', 'ds-num') + '<th scope="col">Status</th></tr>';
  }

  function tableRowsHtml(rows) {
    return rows.map(function (row) {
      var open = !!TABLE.expanded[row.id];
      var state = loadStatus(row.load);
      return '<tr data-ds-key="' + row.id + '">' +
        '<td><input type="checkbox" aria-label="Select ' + row.name + '" data-sg="select-row"' + (TABLE.selected[row.id] ? ' checked' : '') + '></td>' +
        '<td><button class="ds-btn ds-btn--quiet ds-btn--icon ds-table__toggle" type="button" aria-expanded="' + open + '" aria-controls="sg-detail-' + row.id + '" aria-label="Details of ' + row.name + '" data-sg="row-toggle">' + icon('chevronDown', 20, 'ds-chevron') + '</button></td>' +
        '<td class="ds-nowrap"><button class="ds-link-btn ds-table__row-link" type="button" data-sg="row-open">' + row.name + '</button></td>' +
        '<td class="ds-col--secondary">' + row.model + '</td>' +
        '<td class="ds-col--secondary">' + (row.owner || '<span class="ds-muted">Not issued</span>') + '</td>' +
        '<td class="ds-num">' + row.load + '%</td>' +
        '<td><span class="ds-status ds-status--' + state[0] + '">' + icon(state[1], 16) + '<span>' + state[2] + '</span></span></td></tr>' +
        '<tr class="ds-table__detail" id="sg-detail-' + row.id + '" data-ds-key="' + row.id + '-detail"' + (open ? '' : ' inert') + '><td colspan="7"><div class="ds-table__expand"><div>' +
        '<dl class="ds-facts"><div><dt>Owner</dt><dd>' + (row.owner || 'Not issued') + '</dd></div><div><dt>Model</dt><dd>' + row.model + '</dd></div><div><dt>Location</dt><dd>' + row.place + '</dd></div><div><dt>Last seen</dt><dd>' + row.seen + '</dd></div></dl>' +
        '</div></div></td></tr>';
    }).join('');
  }

  function table() {
    return section('table', 'Table', 'A 48px header, 52px rows, hairlines and a quiet hover; no zebra. In a card the table runs to the edges; secondary columns drop on phones.',
      '<section class="ds-card"><div class="ds-card__row"><h3 class="ds-card__title">Devices</h3><div class="sg-row"><button class="ds-btn ds-btn--quiet ds-btn--sm" type="button" aria-pressed="false" data-sg="dense">Dense</button><button class="ds-btn ds-btn--quiet ds-btn--sm" type="button" aria-pressed="false" data-sg="table-live">Live feed</button><button class="ds-btn ds-btn--sm" type="button">' + icon('download', 16) + 'CSV</button></div></div>' +
      '<div class="ds-field sg-table-filter"><label class="ds-field__label" for="sg-table-filter">Filter</label><input class="ds-input" id="sg-table-filter" type="search" autocomplete="off" placeholder="Device, model or owner"></div>' +
      '<div class="ds-table-wrap"><table class="ds-table ds-table--interactive" id="sg-table"><caption class="ds-sr">Devices</caption><thead>' + tableHeadHtml() + '</thead><tbody>' + tableRowsHtml(tableShown()) + '</tbody></table></div>' +
      '<div class="ds-empty" id="sg-table-empty" hidden><span class="ds-empty__disc" aria-hidden="true">' + icon('search', 24) + '</span><p class="ds-empty__title">No device matches</p><p class="ds-empty__text" id="sg-table-empty-text"></p></div>' +
      '</section>' +
      '<p class="ds-muted">Every row opens its record (the device name stretches over the row; the checkbox and the chevron stay their own controls). Select rows or all of them, open a row\'s details, sort by a column, or type a filter: rows glide to their places on every keystroke. The live feed changes the load every 2s; sorted by load, the rows reorder, but while the mouse is over the table or a row has focus only the values change, and the reorder waits (at most 2s).</p>');
  }

  /* Renders the table through flip(): a user's sort or filter glides at once, the live feed waits for the pointer. */
  function renderTable(live) {
    var tbody = $('#sg-table tbody');
    var empty = $('#sg-table-empty');
    var rows = tableShown();
    DS.dom.morphHtml($('#sg-table thead'), tableHeadHtml());
    var done = M.flip(tbody, function (options) { DS.dom.morphHtml(tbody, tableRowsHtml(rows), options); }, { items: 'tr', live: !!live });
    syncSelectAll();
    if (!rows.length) {
      $('#sg-table-empty-text').textContent = 'Nothing has "' + TABLE.filter.trim() + '" in its name, model or owner.';
      // The rows leave first, then the empty state fades in, without a rise.
      if (empty.hidden) done.then(function () { if (!tableShown().length && empty.hidden) M.enter(empty, 'fade'); });
    } else if (!empty.hidden && !empty.classList.contains('ds-leave')) {
      // The filter found rows again: the empty state goes while they enter.
      M.leave(empty, '', { then: 'hide' });
    }
  }

  function tableAction(action, el) {
    var id = el.closest('tr') && el.closest('tr').getAttribute('data-ds-key');
    var row = TABLE.rows.filter(function (r) { return r.id === id; })[0];
    if (action === 'table-sort') {
      var key = el.getAttribute('data-key');
      TABLE.dir = TABLE.sort === key && TABLE.dir === 'ascending' ? 'descending' : 'ascending';
      TABLE.sort = key;
      renderTable();
    }
    if (action === 'row-toggle' && row) {
      TABLE.expanded[id] = !TABLE.expanded[id];
      el.setAttribute('aria-expanded', String(TABLE.expanded[id]));
      $('#sg-detail-' + id).inert = !TABLE.expanded[id];
    }
    if (action === 'row-open' && row) toast('Opened ' + row.name + '.', 'info');
    if (action === 'table-live') {
      var on = el.getAttribute('aria-pressed') !== 'true';
      el.setAttribute('aria-pressed', String(on));
      clearInterval(TABLE.feed);
      TABLE.feed = 0;
      if (on) {
        TABLE.feed = setInterval(function () {
          TABLE.rows.forEach(function (r) {
            if (Math.random() < 0.6) r.load = Math.max(1, Math.min(99, r.load + Math.round((Math.random() - 0.5) * 50)));
          });
          renderTable(true);
        }, slow(2000));
      }
    }
  }

  /* Forms */
  function forms() {
    return section('forms', 'Forms', 'Outlined 40px fields with the label above, a 2px focus ring that appears at once, errors with an icon and a message. Field text is 16px on phones.',
      '<form class="ds-card ds-form" onsubmit="return false">' +
      '<div class="ds-card__row"><h3 class="ds-card__title">Device</h3></div>' +
      '<div class="ds-form-grid">' +
      '<div class="ds-field"><label class="ds-field__label" for="f-name">Name</label><input class="ds-input" id="f-name" value="LAPTOP-0042" aria-describedby="f-name-hint"><small class="ds-field__hint" id="f-name-hint">As printed on the label.</small></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="f-type">Type</label><select class="ds-input" id="f-type"><option>Laptop</option><option>Desktop</option><option>Tablet</option></select></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="f-date">Bought</label><input class="ds-input" id="f-date" type="date" value="2024-03-12"></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="f-serial">Serial number</label><input class="ds-input" id="f-serial" value="5CD1234XYZ" aria-invalid="true" aria-describedby="f-serial-error"><small class="ds-field__hint ds-field__hint--error" id="f-serial-error">' + icon('alertCircle', 16) + 'Already used by LAPTOP-0017.</small></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="f-model">Model</label><input class="ds-input" id="f-model" list="f-models" placeholder="Start typing"><datalist id="f-models"><option>Latitude 7440</option><option>ThinkPad T14</option></datalist></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="f-id">Asset ID</label><input class="ds-input" id="f-id" value="A-000042" readonly aria-describedby="f-id-hint"><small class="ds-field__hint" id="f-id-hint">Read-only: set by the system.</small></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="f-retired">Retired on</label><input class="ds-input" id="f-retired" type="date" disabled></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="f-cost">Cost centre</label><input class="ds-input" id="f-cost" value="4100"></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="f-room">Room</label><input class="ds-input" id="f-room" placeholder="e.g. B 2.14"></div>' +
      '<div class="ds-field ds-field--full"><label class="ds-field__label" for="f-notes">Notes</label><textarea class="ds-input" id="f-notes" rows="3" placeholder="Anything the next person should know"></textarea></div>' +
      '</div>' +
      '<label class="ds-check"><input type="checkbox" checked><span>Managed by device management</span></label>' +
      '<label class="ds-check ds-check--sm"><input type="checkbox"><span>Delete the saved recovery key</span></label>' +
      '<div class="ds-radios" role="radiogroup" aria-label="Plan"><label class="ds-radio"><input type="radio" name="plan" checked><span><strong>Standard</strong><small>Replaced after four years.</small></span></label><label class="ds-radio"><input type="radio" name="plan"><span><strong>Extended</strong><small>Replaced after six years, with an extended warranty.</small></span></label><label class="ds-radio ds-radio--disabled"><input type="radio" name="plan" disabled><span><strong>Leasing</strong><small class="ds-radio__note">' + icon('alert', 16) + 'Needs a contract first.</small></span></label></div>' +
      '<button class="ds-btn ds-btn--text ds-add-row" type="button">' + icon('plus', 16) + 'Add an accessory</button>' +
      '<div class="ds-form-actions"><button class="ds-btn ds-btn--primary" type="submit">Save</button><button class="ds-btn ds-btn--text" type="button">Discard</button><p class="ds-meta">Last saved today, 09:12</p></div>' +
      '</form>' +
      '<div class="ds-grid-2">' +
      card('Checkboxes and radios', label('In a row (.ds-check): the halo lights on the whole row') +
        '<div class="ds-stack"><fieldset class="ds-field"><legend class="ds-field__label">Options</legend>' +
        '<label class="ds-check"><input type="checkbox" checked><span>Checked</span></label>' +
        '<label class="ds-check"><input type="checkbox"><span>Not checked</span></label>' +
        '<label class="ds-check"><input type="checkbox" data-sg="indeterminate"><span>Some of them (indeterminate)</span></label>' +
        '<label class="ds-check"><input type="checkbox" aria-invalid="true" aria-describedby="sg-terms-error"><span>I accept the terms of use</span></label>' +
        '<small class="ds-field__hint ds-field__hint--error" id="sg-terms-error">' + icon('alertCircle', 16) + 'Accept the terms to continue.</small>' +
        '<label class="ds-check"><input type="checkbox" disabled><span>Locked by policy</span></label>' +
        '<label class="ds-check"><input type="checkbox" checked disabled><span>Required by policy</span></label></fieldset>' +
        '<fieldset class="ds-field"><legend class="ds-field__label">Delivery</legend>' +
        '<label class="ds-check"><input type="radio" name="sg-delivery" checked><span>Ship to the office</span></label>' +
        '<label class="ds-check"><input type="radio" name="sg-delivery"><span>Pick up in person</span></label>' +
        '<label class="ds-check"><input type="radio" name="sg-delivery" disabled><span>Courier (not available here)</span></label></fieldset></div>' +
        label('Anywhere (.ds-checkbox, .ds-radio-input)') +
        '<div class="sg-row"><input class="ds-checkbox" type="checkbox" aria-label="Checked" checked><input class="ds-checkbox" type="checkbox" aria-label="Indeterminate" data-sg="indeterminate"><input class="ds-checkbox" type="checkbox" aria-label="Not checked"><input class="ds-checkbox" type="checkbox" aria-label="Checked, in error" aria-invalid="true" checked><input class="ds-checkbox" type="checkbox" aria-label="Disabled" disabled checked>' +
        '<input class="ds-radio-input" type="radio" name="sg-size" aria-label="Small" checked><input class="ds-radio-input" type="radio" name="sg-size" aria-label="Large"><input class="ds-radio-input" type="radio" name="sg-size" aria-label="Huge (disabled)" disabled></div>') +
      card('Focus and validation', '<p class="ds-muted">The label takes the ring\'s colour while the field has the focus. Type something other than five digits: the message fades in and its room opens; it goes at once when the number is right.</p>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-ticket">Ticket number</label><input class="ds-input" id="sg-ticket" inputmode="numeric" autocomplete="off" placeholder="12345" data-sg="validate" aria-describedby="sg-ticket-error"><small class="ds-field__hint ds-field__hint--error" id="sg-ticket-error"></small></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-ticket-note">Note</label><input class="ds-input" id="sg-ticket-note" placeholder="Optional"></div>') +
      '</div>' +
      card('Toolbar, action bar and inline form', '<div class="ds-toolbar"><div class="ds-filters">' +
        '<div class="ds-field ds-field--grow"><label class="ds-sr" for="f-q">Search</label><div class="ds-search">' + icon('search', 20) + '<input class="ds-input" id="f-q" type="search" placeholder="Search name, owner or serial"></div></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="f-status">Status</label><select class="ds-input ds-input--filled" id="f-status"><option>All</option><option>Active</option></select></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="f-since">Since</label><input class="ds-input ds-input--filled" id="f-since" type="date"></div>' +
        '</div></div>' +
        '<div class="ds-action-bar"><div class="ds-search">' + icon('search', 20) + '<input class="ds-input" type="search" aria-label="Search devices" placeholder="Search devices"></div><button class="ds-btn ds-btn--quiet" type="button" aria-pressed="false" data-sg="toggle">' + icon('filter', 16) + 'Filter</button><button class="ds-btn ds-btn--tonal" type="button">' + icon('plus', 16) + 'Add</button><p class="ds-meta">128 devices</p></div>' +
        '<div class="ds-inline-form"><div class="ds-field"><label class="ds-field__label" for="f-ticket">Ticket number</label><input class="ds-input" id="f-ticket" placeholder="12345"></div><button class="ds-btn" type="button">Look up</button></div>') +
      '<div class="ds-grid-2">' +
      card('Files', label('The file field (.ds-input[type="file"]) and a drop zone (.ds-dropzone, DS.dom.dropzone): drop, browse or paste') +
        '<div class="ds-stack"><div class="ds-field"><label class="ds-field__label" for="sg-file">Photo</label><input class="ds-input" type="file" id="sg-file" accept="image/*"></div>' +
        '<label class="ds-dropzone" id="sg-dropzone"><input class="ds-dropzone__input" type="file" accept=".csv" multiple>' +
        '<span class="ds-dropzone__disc" aria-hidden="true">' + icon('plus', 24) + '</span>' +
        '<span class="ds-dropzone__title"><span class="ds-dropzone__idle">Drop CSV files here or <span class="ds-dropzone__browse">browse</span></span><span class="ds-dropzone__over" aria-hidden="true">Release to add the files</span></span>' +
        '<span class="ds-dropzone__hint">Up to 10 MB each</span></label>' +
        '<p class="ds-muted" id="sg-dropzone-out" aria-live="polite">No file chosen yet.</p></div>') +
      card('Reorder rows', label('A grip per row (.ds-grip) and DS.motion.sortable(): drag the grip, or focus it and press the arrow keys') +
        '<ul class="ds-plain-list sg-sortable" id="sg-sortable">' + ['Back up the database', 'Update the agents', 'Restart the gateways', 'Send the report'].map(function (text, index) {
          return '<li class="sg-sortable__row" data-ds-key="step-' + index + '"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-grip" type="button" aria-label="Move ' + text + '">' + icon('menu', 20) + '</button><span>' + text + '</span></li>';
        }).join('') + '</ul>' +
        '<p class="ds-muted" id="sg-sortable-out">Order: 1, 2, 3, 4</p>') +
      '</div>' +
      card('Select-only combobox', '<p class="ds-muted">A button shows the choice with its meta (<code>.ds-combo--select</code>); Enter, Space or the arrows open the list, letters jump to an option. Premium cannot be chosen.</p>' +
        '<div class="ds-field" style="max-width:420px">' + selectComboMarkup('f-plan', 'Plan') + '</div>') +
      formParts());
  }

  /* A glyph of the set, or a stand-in until the set has it. */
  function glyph(name, fallback) { return I[name] ? name : fallback; }

  /* The form parts of 2.0: hints, markers, the search key, field rows and
     input groups, the filled field, check lists and groups, editing in
     rows, radio tiles, the slider, the composer. setupForms() wires them. */
  function formParts() {
    var check = function (text, count, checked) {
      return '<label class="ds-check"><input type="checkbox" name="sg-status"' + (checked ? ' checked' : '') + '><span>' + text + '</span><span class="ds-check__count">' + count + '</span></label>';
    };
    var tile = function (value, name, note, glyphName, checked) {
      return '<label class="ds-radio"><input type="radio" name="sg-kind" value="' + value + '"' + (checked ? ' checked' : '') + '><span class="ds-radio__icon" aria-hidden="true">' + icon(glyphName, 20) + '</span>' +
        '<span><strong>' + name + '</strong><small>' + note + '</small></span><span class="ds-radio__mark" aria-hidden="true">' + icon('check', 14) + '</span></label>';
    };
    return '<div class="ds-grid-2">' +
      card('Hints, markers and a counter', '<p class="ds-muted">Type a name: the hint confirms it (or says it is taken) and its room opens. Optional fields say so; the counter follows the note.</p>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-user">Username <span class="ds-field__required" aria-hidden="true">*</span></label><input class="ds-input" id="sg-user" required autocomplete="off" placeholder="ada.lovelace" data-sg="live-check" aria-describedby="sg-user-hint"><small class="ds-field__hint" id="sg-user-hint"></small></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-room">Room <span class="ds-field__optional">(optional)</span></label><input class="ds-input" id="sg-room" aria-describedby="sg-room-hint"><small class="ds-field__hint" id="sg-room-hint">' + icon('info', 16) + 'As written on the door.</small></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-note-count">Note</label><textarea class="ds-input" id="sg-note-count" maxlength="80" data-sg="counter" aria-describedby="sg-note-count-hint"></textarea><div class="ds-field__foot"><small class="ds-field__hint" id="sg-note-count-hint">Shown to the next person.</small><span class="ds-field__counter" aria-hidden="true">0 / 80</span></div></div>') +
      card('Search key, field rows and input groups', label('A search with its key (press / to focus it)') +
        '<div class="ds-search">' + icon('search', 20) + '<input class="ds-input" id="sg-search-key" type="search" aria-label="Search devices" aria-keyshortcuts="/" placeholder="Search devices"><kbd class="ds-kbd ds-search__key" aria-hidden="true">/</kbd></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-api-key">API key</label><div class="ds-field__row"><input class="ds-input" id="sg-api-key" value="ex_7f3a9c21d4e8" readonly><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Copy the key" data-tip="Copy the key" data-sg="copy"><span class="ds-icon-swap">' + icon('copy', 20) + '</span></button></div></div>' +
        '<div class="ds-form-grid--2 ds-form-grid"><div class="ds-field"><label class="ds-field__label" for="sg-quota">Quota (GB)</label><div class="ds-input-group"><input class="ds-input" id="sg-quota" inputmode="numeric" value="50"><span class="ds-input-group__affix" aria-hidden="true">GB</span></div></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-site">Website</label><div class="ds-input-group"><span class="ds-input-group__affix" aria-hidden="true">https://</span><input class="ds-input" id="sg-site" value="example.org" aria-invalid="true" aria-describedby="sg-site-error"></div><small class="ds-field__hint ds-field__hint--error" id="sg-site-error">' + icon('alertCircle', 16) + 'Not reachable.</small></div></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-password">Password</label><div class="ds-input-group"><input class="ds-input" id="sg-password" type="password" value="correct horse" autocomplete="off"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--sm" type="button" aria-label="Show password" aria-pressed="false" aria-controls="sg-password" data-sg="reveal"><span class="ds-icon-swap"><span class="ds-icon-swap__a">' + icon(glyph('eye', 'lock'), 18) + '</span><span class="ds-icon-swap__b">' + icon(glyph('eyeOff', 'key'), 18) + '</span></span></button></div></div>' +
        '<div class="ds-form-grid--2 ds-form-grid"><div class="ds-field"><label class="ds-field__label" for="sg-start">Starts</label><input class="ds-input" id="sg-start" type="datetime-local" value="2025-03-12T09:30"></div><div class="ds-field"><label class="ds-field__label" for="sg-time">Daily at</label><input class="ds-input" id="sg-time" type="time" value="02:30"></div></div>') +
      card('Filled field', '<p class="ds-muted">The label sits in the tonal box; the focus is a 2px line at its bottom.</p>' +
        '<div class="ds-field ds-field--inset"><label class="ds-field__label" for="sg-inset-title">Title</label><input class="ds-input" id="sg-inset-title" value="Quarterly report" aria-describedby="sg-inset-title-hint"><small class="ds-field__hint" id="sg-inset-title-hint">Shown in the list.</small></div>' +
        '<div class="ds-field ds-field--inset"><label class="ds-field__label" for="sg-inset-kind">Kind</label><select class="ds-input" id="sg-inset-kind"><option>Report</option><option>Note</option></select></div>' +
        '<div class="ds-field ds-field--inset"><label class="ds-field__label" for="sg-inset-code">Code</label><input class="ds-input" id="sg-inset-code" value="Q1 25" aria-invalid="true" aria-describedby="sg-inset-code-error"><small class="ds-field__hint ds-field__hint--error" id="sg-inset-code-error">' + icon('alertCircle', 16) + 'Letters and digits only.</small></div>') +
      card('Check list and check group', '<div class="ds-stack"><fieldset class="ds-field"><legend class="ds-field__label">Status</legend><div class="ds-check-list">' +
        check('Active', 47, true) + check('In storage', 12) + check('Lent out', 8) + check('In repair', 3, true) + check('Waiting for parts from the manufacturer, ordered last week', 2) + check('Retired', 31) + check('Lost', 1) + check('Sold', 6) +
        '</div></fieldset>' +
        '<fieldset class="ds-field"><legend class="ds-field__label">Notify by</legend><div class="ds-check-group" data-sg="check-group"><label class="ds-check"><input type="checkbox" data-sg-all><span>All channels</span></label>' +
        '<div class="ds-check-group__children" role="group" aria-label="Channels"><label class="ds-check"><input type="checkbox" checked><span>Email</span></label><label class="ds-check"><input type="checkbox"><span>Chat</span></label><label class="ds-check"><input type="checkbox" aria-disabled="true" data-tip="Needs a phone number first"><span>Phone (aria-disabled)</span></label></div></div></fieldset></div>') +
      card('Editing in rows', '<p class="ds-muted">Change a field: a dot and the word "(changed)" mark it until you save. On a phone the actions stay at the bottom.</p>' +
        '<form class="ds-form ds-form--rows" data-sg="rows" onsubmit="return false">' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-rows-name">Name <span class="ds-field__changed ds-sr">(changed)</span></label><input class="ds-input" id="sg-rows-name" value="LAPTOP-0042" data-initial="LAPTOP-0042"></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-rows-room">Room <span class="ds-field__changed ds-sr">(changed)</span></label><input class="ds-input" id="sg-rows-room" value="B 2.14" data-initial="B 2.14"></div>' +
        '<div class="ds-field" role="group" aria-labelledby="sg-rows-serial"><span class="ds-field__label" id="sg-rows-serial">Serial number</span><span class="ds-field__value">5CD1234XYZ</span></div>' +
        '<div class="ds-form-actions ds-form-actions--sticky"><button class="ds-btn ds-btn--primary" type="submit" data-sg="rows-save">Save</button><button class="ds-btn ds-btn--text" type="reset" data-sg="rows-reset">Discard</button></div></form>') +
      card('Radio tiles', '<div class="ds-radios ds-radios--tiles" role="radiogroup" aria-label="Device type" data-sg="tiles">' +
        tile('laptop', 'Laptop', 'With a dock.', 'laptop', true) + tile('desktop', 'Desktop', 'At one desk.', 'monitor') + tile('tablet', 'Tablet', 'For the field.', 'image') +
        '<label class="ds-radio ds-radio--disabled"><input type="radio" name="sg-kind" value="server" disabled><span class="ds-radio__icon" aria-hidden="true">' + icon('server', 20) + '</span><span><strong>Server</strong><small class="ds-radio__note">' + icon('alert', 16) + 'Needs a rack.</small></span><span class="ds-radio__mark" aria-hidden="true">' + icon('check', 14) + '</span></label></div>') +
      card('Slider', '<div class="ds-field"><label class="ds-field__label" for="sg-keep">Keep history for</label><div class="ds-field__row"><input class="ds-slider" id="sg-keep" type="range" min="7" max="365" value="90" aria-describedby="sg-keep-out" data-sg="slider" data-unit="days"><output class="ds-slider__value" id="sg-keep-out" for="sg-keep">90 days</output></div></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-load">Alert above</label><div class="ds-field__row"><input class="ds-slider" id="sg-load" type="range" min="0" max="100" value="80" step="5" aria-describedby="sg-load-out" data-sg="slider" data-unit="%"><output class="ds-slider__value" id="sg-load-out" for="sg-load">80%</output></div></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-locked">Retention (set by policy)</label><div class="ds-field__row"><input class="ds-slider" id="sg-locked" type="range" min="0" max="100" value="30" disabled aria-describedby="sg-locked-out" data-sg="slider" data-unit="%"><output class="ds-slider__value" id="sg-locked-out" for="sg-locked">30%</output></div></div>') +
      card('Composer and a growing field', '<p class="ds-muted">Both grow with their text; the send button stays at the bottom.</p>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-grow">Note</label><textarea class="ds-input ds-input--grow" id="sg-grow" rows="1" data-sg="grow" placeholder="A line, or a few"></textarea></div>' +
        '<form class="ds-composer" onsubmit="return false"><textarea class="ds-composer__input ds-input--grow" rows="1" aria-label="Message" placeholder="Write a message" data-sg="grow"></textarea>' +
        '<button class="ds-btn ds-btn--primary ds-btn--icon" type="submit" aria-label="Send" data-tip="Send">' + icon(glyph('send', 'arrowUp'), 20) + '</button></form>') +
      '</div>';
  }

  /* The behaviour of the form parts: the page's own few lines, as
     docs/components.md shows them. */
  function setupForms() {
    var user = $('#sg-user');
    if (!user) return;
    // The live check: a verdict per keystroke, the hint changes only when it does.
    user.addEventListener('input', function () {
      var value = user.value.trim();
      var hint = $('#sg-user-hint');
      var verdict = !value ? '' : /^ada/i.test(value) ? 'taken' : 'free';
      if (hint.getAttribute('data-verdict') === verdict) return;
      hint.setAttribute('data-verdict', verdict);
      hint.classList.toggle('ds-field__hint--error', verdict === 'taken');
      hint.classList.toggle('ds-field__hint--success', verdict === 'free');
      if (verdict === 'taken') user.setAttribute('aria-invalid', 'true');
      else user.removeAttribute('aria-invalid');
      setHtml(hint, verdict === 'taken' ? icon('alertCircle', 16) + 'Already taken.' : verdict === 'free' ? icon('checkCircle', 16) + 'Available.' : '');
    });
    $$('[data-sg="counter"]').forEach(function (area) {
      var counter = $('.ds-field__counter', area.parentNode);
      area.addEventListener('input', function () { counter.textContent = area.value.length + ' / ' + area.maxLength; });
    });
    // "/" focuses the search when the focus is not in a field.
    document.addEventListener('keydown', function (event) {
      if (event.key !== '/' || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target.closest && event.target.closest('input, textarea, select, [contenteditable]')) return;
      var search = $('#sg-search-key');
      if (!search || !search.getClientRects().length) return;
      event.preventDefault();
      search.focus();
    });
    document.addEventListener('click', function (event) {
      var reveal = event.target.closest('[data-sg="reveal"]');
      if (!reveal) return;
      var shown = reveal.getAttribute('aria-pressed') !== 'true';
      reveal.setAttribute('aria-pressed', String(shown));
      reveal.setAttribute('aria-label', shown ? 'Hide password' : 'Show password');
      $('#' + reveal.getAttribute('aria-controls')).type = shown ? 'text' : 'password';
    });
    // The parent checkbox follows its children (checked, or mixed while only some are).
    $$('[data-sg="check-group"]').forEach(function (group) {
      var all = $('[data-sg-all]', group);
      var children = $$('.ds-check-group__children input:not([aria-disabled="true"])', group);
      var sync = function () {
        var on = children.filter(function (child) { return child.checked; }).length;
        all.checked = on === children.length;
        all.indeterminate = on > 0 && on < children.length;
      };
      all.addEventListener('change', function () { children.forEach(function (child) { child.checked = all.checked; }); });
      group.addEventListener('change', sync);
      sync();
    });
    // Changed fields: the class follows the difference from the saved value.
    $$('[data-sg="rows"]').forEach(function (form) {
      var mark = function () {
        $$('[data-initial]', form).forEach(function (input) { input.closest('.ds-field').classList.toggle('ds-field--changed', input.value !== input.getAttribute('data-initial')); });
      };
      form.addEventListener('input', mark);
      form.addEventListener('reset', function () { setTimeout(mark); });
      $('[data-sg="rows-save"]', form).addEventListener('click', function () {
        $$('[data-initial]', form).forEach(function (input) { input.setAttribute('data-initial', input.value); });
        mark();
      });
    });
    $$('[data-sg="tiles"]').forEach(function (group) {
      // A checked radio changes no attribute: the change event moves the pill.
      var pill = addIndicator(group, { active: '.ds-radio:has(input:checked)', className: 'ds-radios__indicator' });
      group.addEventListener('change', function () { pill.update(); });
    });
    // The slider's share of its range for the active part, and its output.
    $$('[data-sg="slider"]').forEach(function (slider) {
      var output = $('#' + slider.getAttribute('aria-describedby'));
      var unit = slider.getAttribute('data-unit');
      var share = function () {
        slider.style.setProperty('--ds-share', String((slider.value - slider.min) / (slider.max - slider.min)));
        output.value = slider.value + (unit === '%' ? '%' : ' ' + unit);
      };
      slider.addEventListener('input', share);
      share();
    });
    // field-sizing grows them where it exists; elsewhere DS.dom.autosize does.
    if (DS.dom.autosize) $$('[data-sg="grow"]').forEach(function (area) { DS.dom.autosize(area); });
  }

  /* Chips, switch, combobox */
  /* A switch with both state words: the CSS shows and crossfades them. */
  function switchRow(name, attributes) {
    return '<label class="ds-switch"><input type="checkbox" role="switch"' + (attributes ? ' ' + attributes : '') + '><span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">' + name + '</span>' +
      '<span class="ds-switch__state" aria-hidden="true"><span class="ds-switch__on">On</span><span class="ds-switch__off">Off</span></span></label>';
  }

  function selection() {
    var chip = function (text, checked, type, disabled) {
      return '<label class="ds-chip"><input class="ds-chip__input" type="' + (type || 'checkbox') + '" name="' + (type === 'radio' ? 'age' : 'status') + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '><span class="ds-chip__body">' + icon('check', 18, 'ds-chip__check') + '<span>' + text + '</span></span></label>';
    };
    return section('selection', 'Chips, switch, combobox', 'Selection always shows more than the tint: a check, the label weight, a state word.',
      '<div class="ds-grid-2">' +
      card('Filter chips', '<p class="ds-muted">The room of the check opens and the check draws itself; chips that move to another line glide there.</p><div><fieldset class="ds-chips"><legend class="ds-sr">Status</legend>' + chip('Active', true) + chip('In storage') + chip('Archived') + chip('Lent out') + chip('In repair') + '<span class="ds-chips__divider" aria-hidden="true"></span>' + chip('Older than 4 years', false, 'radio') + chip('Newer than 1 year', true, 'radio') + chip('Unavailable', false, 'checkbox', true) + chip('Required', true, 'checkbox', true) + '</fieldset></div>') +
      card('Switch', '<div class="ds-stack">' + switchRow('Nightly sync', 'checked') + switchRow('Email summary', '') +
        '<label class="ds-switch"><input type="checkbox" role="switch" data-sg="switch"><span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">Weekly report (one word)</span><span class="ds-switch__state" aria-hidden="true">Off</span></label>' +
        switchRow('Locked by policy', 'disabled') + switchRow('Required by policy', 'checked disabled') +
        switchRow('Blocked with a reason (aria-disabled)', 'aria-disabled="true" data-tip="Needs an admin"') + '</div>') +
      '</div>' +
      '<div class="ds-grid-2">' +
      card('Action and input chips', '<p class="ds-muted">Active filters remove themselves (the chips after one glide into its place); suggestions act at once.</p>' +
        '<div class="ds-chips" role="group" aria-label="Active filters" id="sg-input-chips">' + inputChipsHtml() + '</div>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="chips-restore">Restore the filters</button></div>' +
        '<div class="ds-chips ds-chips--wrap" role="group" aria-label="Suggestions">' +
        '<button class="ds-chip" type="button" data-sg="suggest"><span class="ds-chip__body">' + icon('user', 18, 'ds-chip__icon') + '<span class="ds-chip__label">Only my devices</span></span></button>' +
        '<button class="ds-chip" type="button" data-sg="suggest"><span class="ds-chip__body"><span class="ds-chip__label">Show the devices that were not seen this month and are still assigned to someone</span></span></button>' +
        '<button class="ds-chip" type="button" disabled><span class="ds-chip__body"><span class="ds-chip__label">Unavailable</span></span></button></div>') +
      card('Locked switches, hints and a switch list', '<div class="ds-stack">' +
        '<label class="ds-switch ds-switch--locked"><input type="checkbox" role="switch" checked aria-disabled="true" aria-describedby="sg-lock-why"><span class="ds-switch__track" aria-hidden="true">' + icon('lock', 16, 'ds-switch__icon') + '</span><span class="ds-switch__label">Disk encryption</span><small class="ds-switch__hint" id="sg-lock-why">Set by the device policy</small></label>' +
        '<label class="ds-switch ds-switch--locked"><input type="checkbox" role="switch" aria-disabled="true" aria-describedby="sg-lock-why-2"><span class="ds-switch__track" aria-hidden="true">' + icon('lock', 16, 'ds-switch__icon') + '</span><span class="ds-switch__label">Remote wipe</span><small class="ds-switch__hint" id="sg-lock-why-2">Set by the directory</small></label>' +
        '<div class="ds-switch-list">' + switchListRow('sg-sw-mail', 'Email reports', 'Every Monday at 08:00', '<span class="ds-tag ds-tag--neutral">3 recipients</span>', true) +
        switchListRow('sg-sw-push', 'Push notifications', 'On this device only', '', false) +
        switchListRow('sg-sw-digest', 'A weekly digest of every device that changed its owner, its place or its warranty', 'Long names wrap', '<span class="ds-badge ds-badge--neutral">12</span>', false) + '</div></div>') +
      '</div>' +
      card('Combobox', '<p class="ds-muted">Type or use the chevron: the list grows out of the field, the chevron turns with it, and arrow keys move the active option.</p>' +
        '<div class="ds-field" style="max-width:420px">' + comboMarkup('f-combo', 'Model') + '</div>'));
  }

  /* The active filters of the input chip demo. */
  var FILTERS = ['Building C, second floor', 'Owner: Ada Lovelace', 'Warranty ends this year'];

  function inputChipsHtml() {
    return FILTERS.map(function (text) {
      return '<button class="ds-chip ds-chip--input" type="button" data-tip="' + text + '" data-sg="chip-remove"><span class="ds-chip__body"><span class="ds-chip__label"><span class="ds-sr">Remove filter </span>' + text + '</span>' + icon('close', 18, 'ds-chip__trailing') + '</span></button>';
    }).join('');
  }

  /* A row of the switch list: named by its label, described by its hint. */
  function switchListRow(id, name, hint, meta, checked) {
    return '<label class="ds-switch"><input type="checkbox" role="switch"' + (checked ? ' checked' : '') + ' aria-labelledby="' + id + '-name" aria-describedby="' + id + '-hint"><span class="ds-switch__track" aria-hidden="true"></span>' +
      '<span class="ds-switch__label" id="' + id + '-name">' + name + '</span><small class="ds-switch__hint" id="' + id + '-hint">' + hint + '</small>' + (meta ? '<span class="ds-switch__meta">' + meta + '</span>' : '') +
      '<span class="ds-switch__state" aria-hidden="true"><span class="ds-switch__on">On</span><span class="ds-switch__off">Off</span></span></label>';
  }

  /* The plans of the select-only combobox: a name, a meta, a share of the quota; one is blocked. */
  var PLANS = [['Basic', '2 devices', 0.2, false], ['Standard', '5 devices', 0.6, false], ['Premium', 'Needs a contract', 1, true], ['Team', '25 devices', 0.36, false]];

  /* A select-only combobox (docs/components.md, Combobox); setupSelectCombo() wires it. */
  function selectComboMarkup(id, name) {
    return '<span class="ds-field__label" id="' + id + '-label">' + name + '</span>' +
      '<div class="ds-combo ds-combo--select" data-sg-select>' +
      '<button class="ds-input ds-combo__input" id="' + id + '" type="button" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="' + id + '-list" aria-labelledby="' + id + '-label ' + id + '-value">' +
      '<span class="ds-combo__value" id="' + id + '-value">Standard</span><span class="ds-combo__meta">5 devices</span></button>' +
      '<button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show plans">' + icon('chevronDown', 20) + '</button>' +
      '<div class="ds-combo__popup" hidden><ul class="ds-combo__list" id="' + id + '-list" role="listbox" aria-labelledby="' + id + '-label">' +
      PLANS.map(function (plan, index) {
        return '<li class="ds-combo__option" id="' + id + '-' + index + '" role="option" aria-selected="' + (index === 1) + '"' + (plan[3] ? ' aria-disabled="true"' : '') + '>' +
          '<span class="ds-combo__name">' + plan[0] + '</span><span class="ds-combo__meta">' + plan[1] + '</span>' +
          '<div class="ds-progress" style="--ds-progress:' + plan[2] + '"><div class="ds-progress__track" role="presentation"><div class="ds-progress__bar"></div></div></div></li>';
      }).join('') +
      '</ul></div></div>';
  }

  /* The models of the combobox demos. */
  var MODELS = [['Latitude 5430', '14 inch · 2022'], ['Latitude 7440', '14 inch · 2023'], ['Latitude 9450', '14 inch · 2024'], ['Precision 3581', '15 inch · 2023'], ['OptiPlex 7010', 'Desktop · 2023'], ['Surface Laptop 5', '13 inch · 2022']];

  /* A closed combobox (docs/components.md, Combobox); setupCombo() wires it. */
  function comboMarkup(id, name) {
    return '<label class="ds-field__label" for="' + id + '">' + name + '</label>' +
      '<div class="ds-combo" data-sg-combo><input class="ds-input ds-combo__input" id="' + id + '" role="combobox" aria-expanded="false" aria-controls="' + id + '-list" aria-autocomplete="list" autocomplete="off">' +
      '<button class="ds-combo__toggle" type="button" tabindex="-1" aria-label="Show all">' + icon('chevronDown', 20) + '</button>' +
      '<div class="ds-combo__popup" hidden><ul class="ds-combo__list" id="' + id + '-list" role="listbox">' +
      MODELS.map(function (model, index) {
        return '<li class="ds-combo__option" id="' + id + '-' + index + '" role="option" aria-selected="false"><span class="ds-combo__name">' + model[0] + '</span><span class="ds-combo__meta">' + model[1] + '</span></li>';
      }).join('') +
      '</ul><p class="ds-combo__status" role="status">' + MODELS.length + ' models</p></div></div>';
  }

  /* Overlays */
  function overlays() {
    var tipButton = function (glyph, name) {
      return '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="' + name + '" data-tip="' + name + '">' + icon(glyph, 20) + '</button>';
    };
    return section('overlays', 'Overlays', 'Dialogs, side sheets, menus, snackbars and tooltips float over the page and open through DS.overlay: focus moves in and back at once, Escape closes the top one, and every motion turns back from where it is. Open the real ones or inspect them in place.',
      card('Try them', '<div class="sg-row"><button class="ds-btn ds-btn--primary" type="button" data-sg="dialog">Open dialog</button><button class="ds-btn" type="button" data-sg="dialog-div">Dialog (div markup)</button><button class="ds-btn" type="button" data-sg="dialog-combo">Dialog with a list</button><button class="ds-btn" type="button" data-sg="sheet">Open side sheet</button></div>' +
        '<div class="sg-row"><button class="ds-btn" type="button" data-sg="dialog-long">Long form (body scrolls)</button><button class="ds-btn" type="button" data-sg="dialog-people">Pick one of 40 people</button><button class="ds-btn" type="button" data-sg="dialog-work">Delete (busy)</button><button class="ds-btn" type="button" data-sg="dialog-type">Type the name to delete</button></div>' +
        '<div class="sg-row"><button class="ds-btn" type="button" data-sg="dialog-full">Full screen on phones</button><button class="ds-btn" type="button" data-sg="dialog-actions">Action sheet</button><button class="ds-btn" type="button" data-sg="dialog-confirm">DS.overlay.confirm()</button><button class="ds-btn" type="button" data-sg="dialog-prompt">DS.overlay.prompt()</button><button class="ds-btn" type="button" data-sg="sheet-filters">Filters (sheet with a foot)</button></div>' +
        '<div class="sg-row"><button class="ds-btn" type="button" data-sg="toast">Show snackbar</button><button class="ds-btn" type="button" data-sg="toast-error">Show error</button><button class="ds-btn" type="button" data-sg="toast-many">4 messages</button><button class="ds-btn" type="button" data-sg="toast-undo">With undo</button><button class="ds-btn" type="button" data-sg="toast-retry">Fail twice (one key)</button><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Copy link" data-tip="Copy link">' + icon('link', 20) + '</button>' +
        '<button class="ds-btn ds-btn--text" type="button" popovertarget="sg-presence">A popover (.ds-presence)</button></div>' +
        '<div class="ds-presence sg-presence" id="sg-presence" popover><p class="ds-card__title">A plain popover</p><p class="ds-muted">Toggled by popovertarget, no script: .ds-presence fades it in and out. Escape or a click outside closes it.</p></div>') +
      '<div class="ds-grid-2">' +
      card('Dialog', '<div class="sg-inline-overlay">' + dialogMarkup(true) + '</div>') +
      card('Side sheet', '<div class="sg-inline-overlay">' + sheetMarkup(true) + '</div>') +
      '</div>' +
      '<div class="ds-grid-2">' +
      card('Dialog body in a 360px frame', '<p class="ds-muted">A contained dialog with a long list: only its body scrolls, title and actions stay; the hairline shows while the list is scrolled.</p><div class="sg-inline-overlay sg-inline-overlay--short">' + bodyDialogMarkup() + '</div>') +
      '<section class="ds-card"><div class="ds-card__row"><h3 class="ds-card__title">Sort and view</h3><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Sort and view" aria-haspopup="menu" aria-expanded="false" aria-controls="sg-sort-menu" data-sg-sort-menu>' + icon('settings', 20) + '</button></div>' +
        '<p class="ds-muted">A menu with a group of radio items under a heading, a checkbox item with its state word and a shortcut at an item\'s end. Type a letter to jump.</p>' +
        '<div class="ds-menu" role="menu" id="sg-sort-menu" aria-label="Sort and view" hidden>' +
        '<div role="group" aria-labelledby="sg-sort-h"><p class="ds-menu__heading" id="sg-sort-h">Sort by</p>' +
        ['Name', 'Last seen', 'Load'].map(function (name, index) {
          return '<button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="' + (index === 0) + '" data-sg-radio>' + icon('check', 20, 'ds-menu__check') + '<span class="ds-menu__label">' + name + '</span></button>';
        }).join('') + '</div>' +
        '<div class="ds-menu__divider" role="separator"></div>' +
        '<button class="ds-menu__item" role="menuitemcheckbox" type="button" aria-checked="true" data-sg-state>' + icon('check', 20, 'ds-menu__check') + '<span class="ds-menu__label">Compact rows</span><span class="ds-menu__meta">On</span></button>' +
        '<button class="ds-menu__item" role="menuitem" type="button" data-sg-item="Copied the link.">' + icon('link', 20) + '<span class="ds-menu__label">Copy link</span><span class="ds-menu__meta">Ctrl L</span></button>' +
        '</div></section>' +
      '</div>' +
      '<div class="ds-grid-2">' +
      '<section class="ds-card"><div class="ds-card__row"><h3 class="ds-card__title">LAPTOP-0042</h3><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Actions for LAPTOP-0042" aria-haspopup="menu" aria-expanded="false" aria-controls="sg-menu" data-sg-menu>' + icon('moreVertical', 20) + '</button></div>' +
        '<p class="ds-muted">An overflow menu: it grows out of its button, the arrow keys move through it, Escape gives focus back.</p>' +
        '<div class="ds-menu" role="menu" id="sg-menu" aria-label="Actions for LAPTOP-0042" hidden>' +
        '<button class="ds-menu__item" role="menuitem" type="button" data-sg-item="Opened the record.">' + icon('pencil', 20) + '<span class="ds-menu__label">Edit</span></button>' +
        '<button class="ds-menu__item" role="menuitem" type="button" data-sg-item="Duplicated as LAPTOP-0043.">' + icon('copy', 20) + '<span class="ds-menu__label">Duplicate</span></button>' +
        '<button class="ds-menu__item" role="menuitemcheckbox" type="button" aria-checked="true">' + icon('check', 20, 'ds-menu__check') + '<span class="ds-menu__label">Pinned to the top</span></button>' +
        '<div class="ds-menu__divider" role="separator"></div>' +
        '<button class="ds-menu__item" role="menuitem" type="button" data-sg-item="Archived. Undo from the archive.">' + icon('archive', 20) + '<span class="ds-menu__label">Archive</span></button>' +
        '<button class="ds-menu__item" role="menuitem" type="button" aria-disabled="true">' + icon('trash', 20) + '<span class="ds-menu__label">Delete (needs admin rights)</span></button>' +
        '</div></section>' +
      card('Tooltips along a toolbar', '<p class="ds-muted">Rest on one button: its tooltip comes after a moment. Then move along the row: the next ones show at once and swap in place.</p>' +
        '<div class="sg-row" role="toolbar" aria-label="Device actions">' + tipButton('sync', 'Sync now') + tipButton('download', 'Download report') + tipButton('history', 'Show history') + tipButton('lock', 'Lock device') + tipButton('settings', 'Device settings') + '</div>') +
      '</div>' +
      card('Snackbar and tooltip', '<div class="ds-stack"><div class="ds-toast sg-toast-demo">' + icon('checkCircle', 20) + '<span class="ds-toast__text">Saved. The record is visible to everyone now.</span><button class="ds-btn ds-btn--quiet ds-btn--icon ds-toast__close" type="button" aria-label="Close">' + icon('close', 20) + '</button></div>' +
        '<div class="ds-toast ds-toast--error sg-toast-demo">' + icon('alertCircle', 20) + '<span class="ds-toast__text">Could not save. Check the connection and try again.</span></div>' +
        '<div class="ds-toast sg-toast-demo">' + icon('checkCircle', 20) + '<span class="ds-toast__text">3 devices deleted.</span><button class="ds-btn ds-btn--text ds-btn--sm ds-toast__action" type="button">Undo</button><button class="ds-btn ds-btn--quiet ds-btn--icon ds-toast__close" type="button" aria-label="Close" data-tip="Close">' + icon('close', 20) + '</button></div>' +
        '<div class="ds-tooltip sg-tooltip-demo">Copy link</div></div>') +
      '<div class="ds-grid-2">' +
      card('Tooltips that repeat the text', '<p class="ds-muted">A tip that says what the trigger shows appears only while the text is cut off: rest on both names. The icon button keeps its tip: its label is only for screen readers.</p>' +
        '<div class="sg-tip-column"><a class="sg-tip-name" href="#overlays" data-tip="LAPTOP-0042">LAPTOP-0042</a><a class="sg-tip-name" href="#overlays" data-tip="LAPTOP-0042-FINANCE-BACKUP-WEST">LAPTOP-0042-FINANCE-BACKUP-WEST</a></div>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" data-tip="Sync now">' + icon('sync', 20) + '<span class="ds-sr">Sync now</span></button><button class="ds-btn ds-btn--primary" type="button" aria-disabled="true" data-tip="Fill in the serial number first">Publish</button></div>' +
        '<p class="ds-meta">On a touch screen: a tap on Publish shows why it is blocked, a long press on the icon shows its name.</p>') +
      card('Save bar', '<p class="ds-muted">Change a field: the save bar rises at the bottom of the view, the snackbars rise above it, and a field under it scrolls clear. Discard or Save hides it.</p>' +
        '<form class="ds-form" id="sg-savebar-form"><div class="ds-field"><label class="ds-field__label" for="sg-sb-name">Device name</label><input class="ds-input" id="sg-sb-name" value="LAPTOP-0042"></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-sb-owner">Owner</label><input class="ds-input" id="sg-sb-owner" value="Ada Lovelace"></div></form>' +
        '<div class="sg-savebar-demo"><div class="ds-savebar__bar"><p class="ds-savebar__text">2 unsaved changes</p><div class="ds-savebar__actions"><button class="ds-btn ds-btn--text" type="button">Discard</button><button class="ds-btn ds-btn--primary" type="button">Save</button></div></div></div>') +
      '</div>');
  }

  /* A contained dialog whose body scrolls (the 360px frame of the overlays section). */
  function bodyDialogMarkup() {
    var rows = '';
    for (var i = 0; i < 14; i += 1) rows += '<label class="ds-check"><input type="checkbox"' + (i < 2 ? ' checked' : '') + '> ' + PEOPLE[i % PEOPLE.length] + '</label>';
    return '<div class="ds-dialog ds-dialog--contained"><div class="ds-dialog__backdrop" data-close></div>' +
      '<div class="ds-dialog__box" role="group" aria-label="Notify people"><h2 class="ds-dialog__title">Notify people</h2>' +
      '<div class="ds-dialog__body" data-sg-scrolled><p class="ds-dialog__text">They get an email when LAPTOP-0042 is back.</p>' + rows + '</div>' +
      '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button">Cancel</button><button class="ds-btn ds-btn--primary" type="button">Notify 2 people</button></div></div></div>';
  }

  /* The people of the list dialogs. */
  var PEOPLE = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Katherine Johnson', 'Margaret Hamilton', 'Edsger Dijkstra', 'Barbara Liskov', 'Donald Knuth', 'Frances Allen', 'John Backus'];

  /* A form taller than the window: the body scrolls, title and actions stay (docs/components.md, Dialog). */
  function longDialogMarkup() {
    var field = function (id, label, extra) {
      return '<div class="ds-field"><label class="ds-field__label" for="sg-long-' + id + '">' + label + '</label><input class="ds-input" id="sg-long-' + id + '"' + (extra || '') + '></div>';
    };
    return '<dialog class="ds-dialog ds-dialog--wide" id="sg-dialog-long" aria-labelledby="sg-long-title"><div class="ds-dialog__backdrop" data-close></div>' +
      '<div class="ds-dialog__box"><h2 class="ds-dialog__title" id="sg-long-title">Edit LAPTOP-0042</h2>' +
      '<div class="ds-dialog__body" data-sg-scrolled><p class="ds-dialog__text">The changes apply to every list once you save.</p>' +
      field('name', 'Name', ' value="LAPTOP-0042"') + field('owner', 'Owner', ' value="Ada Lovelace"') + field('place', 'Location', ' value="Building A, 1st floor"') +
      field('model', 'Model', ' value="Latitude 7440"') + field('serial', 'Serial number', ' value="7H2K9Q3"') + field('bought', 'Bought', ' type="date" value="2023-04-12"') +
      field('warranty', 'Warranty until', ' type="date" value="2026-04-12"') + field('note', 'Note', ' placeholder="Add a note"') +
      '<label class="ds-check"><input type="checkbox" checked> Sync nightly</label></div>' +
      '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-close>Cancel</button><button class="ds-btn ds-btn--primary" type="button" data-close>Save</button></div></div></dialog>';
  }

  /* A search over a list (docs/components.md, Dialog): a fixed height, a count, Choose blocked until a choice. */
  function peopleDialogMarkup() {
    return '<dialog class="ds-dialog ds-dialog--wide" id="sg-dialog-people" aria-labelledby="sg-people-title" style="--ds-dialog-height: 560px"><div class="ds-dialog__backdrop" data-close></div>' +
      '<div class="ds-dialog__box"><h2 class="ds-dialog__title" id="sg-people-title">Choose the new owner</h2>' +
      '<div class="ds-search">' + icon('search', 20) + '<input class="ds-input" id="sg-people-search" type="search" aria-label="Search people" placeholder="Search people" autocomplete="off"></div>' +
      '<p class="ds-meta" id="sg-people-count" aria-live="polite">40 people</p>' +
      '<div class="ds-dialog__body" id="sg-people-list" role="radiogroup" aria-label="People" data-sg-scrolled></div>' +
      '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-close>Cancel</button>' +
      '<button class="ds-btn ds-btn--primary" type="button" id="sg-people-ok" aria-disabled="true" data-tip="Choose a person first">Choose</button></div></div></dialog>';
  }

  /* Keeps the dialog open while its action runs (data-ds-busy); the switch lets the request fail. */
  function workDialogMarkup() {
    return '<dialog class="ds-dialog" id="sg-dialog-work" role="alertdialog" aria-labelledby="sg-work-title" aria-describedby="sg-work-text"><div class="ds-dialog__backdrop" data-close></div>' +
      '<div class="ds-dialog__box"><h2 class="ds-dialog__title" id="sg-work-title">Delete 3 devices?</h2>' +
      '<div class="ds-dialog__body"><p class="ds-dialog__text" id="sg-work-text">They disappear from every list. Escape and the backdrop wait while it works.</p>' +
      '<label class="ds-check"><input type="checkbox" id="sg-work-fail"> Let the request fail</label></div>' +
      '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" id="sg-work-cancel" data-close autofocus>Cancel</button>' +
      '<button class="ds-btn ds-btn--primary" type="button" id="sg-work-ok">' + faces('Delete devices', 'Deleting', 'Deleted') + '</button></div></div></dialog>';
  }

  /* Confirm by typing the name (docs/components.md, Dialog). */
  function typeDialogMarkup() {
    return '<dialog class="ds-dialog ds-dialog--wide" id="sg-dialog-type" role="alertdialog" aria-labelledby="sg-type-title" aria-describedby="sg-type-text"><div class="ds-dialog__backdrop" data-close></div>' +
      '<div class="ds-dialog__box"><h2 class="ds-dialog__title" id="sg-type-title">Delete LAPTOP-0042 for good?</h2>' +
      '<div class="ds-dialog__body"><p class="ds-dialog__text" id="sg-type-text">Its history, tickets and documents go with it. This cannot be undone.</p>' +
      '<div class="ds-alert ds-alert--warning">' + icon('alert', 20) + '<span class="ds-alert__text">The device is still assigned to Ada Lovelace.</span></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="sg-type-field">Type LAPTOP-0042 to confirm</label><input class="ds-input" id="sg-type-field" autocomplete="off" spellcheck="false" autocapitalize="off" autofocus></div></div>' +
      '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" id="sg-type-cancel" data-close>Cancel</button>' +
      '<button class="ds-btn ds-btn--primary" type="button" id="sg-type-ok" aria-disabled="true" data-tip="Type the name first">' + faces('Delete for good', 'Deleting', 'Deleted') + '</button></div></div></dialog>';
  }

  /* A task that needs the whole phone screen: full screen at 600px and below. */
  function fullDialogMarkup() {
    return '<dialog class="ds-dialog ds-dialog--full-narrow" id="sg-dialog-full" aria-labelledby="sg-full-title"><div class="ds-dialog__backdrop" data-close></div>' +
      '<div class="ds-dialog__box"><div class="ds-dialog__head"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-close>' + icon('close', 20) + '</button>' +
      '<h2 class="ds-dialog__title" id="sg-full-title">New ticket</h2><button class="ds-btn ds-btn--text" type="button" data-close>Save</button></div>' +
      '<div class="ds-dialog__body"><div class="ds-field"><label class="ds-field__label" for="sg-full-subject">Subject</label><input class="ds-input" id="sg-full-subject" placeholder="What is wrong?"></div>' +
      '<div class="ds-field"><label class="ds-field__label" for="sg-full-text">Description</label><textarea class="ds-input" id="sg-full-text"></textarea></div></div></div></dialog>';
  }

  /* The actions of a row on a phone: the menu's items in an action sheet. */
  function actionsDialogMarkup() {
    var item = function (glyph, label) {
      return '<button class="ds-menu__item" type="button" data-close data-sg-item="' + label + ': done.">' + icon(glyph, 20) + '<span class="ds-menu__label">' + label + '</span></button>';
    };
    return '<dialog class="ds-dialog ds-dialog--bottom" id="sg-dialog-actions" aria-labelledby="sg-actions-title"><div class="ds-dialog__backdrop" data-close></div>' +
      '<div class="ds-dialog__box"><h2 class="ds-dialog__title" id="sg-actions-title">LAPTOP-0042</h2><div class="ds-dialog__list">' +
      item('pencil', 'Edit') + item('copy', 'Duplicate') + item('archive', 'Archive') + '</div>' +
      '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-close>Cancel</button></div></div></dialog>';
  }

  /* Filters in a side sheet: a live count in the subtitle, the actions in the foot. */
  function filtersSheetMarkup() {
    var types = [['Laptops', 128, true], ['Desktops', 54, false], ['Printers', 18, false], ['Tablets', 40, true]];
    return '<dialog class="ds-sheet" id="sg-sheet-filters" aria-labelledby="sg-filters-title"><div class="ds-sheet__backdrop" data-close></div><section class="ds-sheet__panel">' +
      '<div class="ds-sheet__head"><div class="ds-sheet__heading"><h2 class="ds-sheet__title" id="sg-filters-title">Filters</h2><p class="ds-sheet__subtitle" id="sg-filters-count" aria-live="polite"></p></div>' +
      '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-close>' + icon('close', 20) + '</button></div>' +
      '<div class="ds-sheet__body" tabindex="0"><fieldset class="ds-field"><legend class="ds-field__label">Type</legend>' +
      types.map(function (type) {
        return '<label class="ds-check"><input type="checkbox" data-count="' + type[1] + '"' + (type[2] ? ' checked' : '') + '> ' + type[0] + '</label>';
      }).join('') + '</fieldset></div>' +
      '<div class="ds-sheet__foot"><p class="ds-meta" id="sg-filters-meta"></p><button class="ds-btn ds-btn--text" type="button" id="sg-filters-reset">Reset</button>' +
      '<button class="ds-btn ds-btn--primary" type="button" id="sg-filters-show" data-close>Show devices</button></div></section></dialog>';
  }

  /* The inline dialog (inspected in place, .ds-dialog--contained). */
  function dialogMarkup(inline) {
    return '<div class="ds-dialog' + (inline ? ' ds-dialog--contained' : '') + '"><div class="ds-dialog__backdrop" data-close></div>' +
      '<div class="ds-dialog__box" role="' + (inline ? 'group' : 'alertdialog') + '"' + (inline ? '' : ' aria-modal="true" aria-labelledby="sg-d-title" aria-describedby="sg-d-text"') + '>' +
      '<h2 class="ds-dialog__title"' + (inline ? '' : ' id="sg-d-title"') + '>Delete 3 devices?</h2><p class="ds-dialog__text"' + (inline ? '' : ' id="sg-d-text"') + '>They disappear from every list. This cannot be undone.</p>' +
      '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-close>Cancel</button><button class="ds-btn ds-btn--primary" type="button" data-close>Delete devices</button></div></div></div>';
  }

  /* The page dialogs (docs/components.md, Dialog). The native markup is
     the preferred one: showModal() makes the page inert; autofocus puts
     the first focus on Cancel, the safe choice of a destructive dialog. */
  function nativeDialogMarkup(id, title, text, action) {
    return '<dialog class="ds-dialog" id="' + id + '" role="alertdialog" aria-labelledby="' + id + '-title" aria-describedby="' + id + '-text"><div class="ds-dialog__backdrop" data-close></div>' +
      '<div class="ds-dialog__box"><h2 class="ds-dialog__title" id="' + id + '-title">' + title + '</h2><p class="ds-dialog__text" id="' + id + '-text">' + text + '</p>' +
      '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-close autofocus>Cancel</button><button class="ds-btn ds-btn--primary" type="button" data-close>' + action + '</button></div></div></dialog>';
  }

  /* The div markup: the same tree, the role on the box. */
  function divDialogMarkup() {
    return '<div class="ds-dialog" id="sg-dialog-div" hidden><div class="ds-dialog__backdrop" data-close></div>' +
      '<div class="ds-dialog__box" role="alertdialog" aria-modal="true" aria-labelledby="sg-dd-title" aria-describedby="sg-dd-text">' +
      '<h2 class="ds-dialog__title" id="sg-dd-title">Archive 3 devices?</h2><p class="ds-dialog__text" id="sg-dd-text">They leave the active lists and stay in the archive for a year.</p>' +
      '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-close autofocus>Cancel</button><button class="ds-btn ds-btn--primary" type="button" data-close>Archive devices</button></div></div></div>';
  }

  /* A dialog whose last field is a combobox: its list opens in the top
     layer (anchor positioning), so the dialog's scrolling box never clips it. */
  function comboDialogMarkup() {
    return '<dialog class="ds-dialog" id="sg-dialog-combo" aria-labelledby="sg-dc-title"><div class="ds-dialog__backdrop" data-close></div>' +
      '<div class="ds-dialog__box"><h2 class="ds-dialog__title" id="sg-dc-title">Replace the device</h2><p class="ds-dialog__text">Choose the model that takes over LAPTOP-0042. Its owner and location stay.</p>' +
      '<div class="ds-field">' + comboMarkup('sg-dc-model', 'New model') + '</div>' +
      '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-close>Cancel</button><button class="ds-btn ds-btn--primary" type="button" data-close>Replace</button></div></div></dialog>';
  }

  /* The side sheet: inline (div, inspected in place) or the page's native
     one, with a button that opens a dialog over it (the nested scrim). */
  function sheetMarkup(inline) {
    var tag = inline ? 'div' : 'dialog';
    return '<' + tag + ' class="ds-sheet"' + (inline ? '' : ' id="sg-sheet" aria-labelledby="sg-s-title"') + '><div class="ds-sheet__backdrop" data-close></div><section class="ds-sheet__panel">' +
      '<div class="ds-sheet__head"><h2 class="ds-sheet__title"' + (inline ? '' : ' id="sg-s-title"') + '>LAPTOP-0042</h2><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-close>' + icon('close', 20) + '</button></div>' +
      '<div class="ds-sheet__body" tabindex="0"><dl class="ds-facts"><div><dt>Owner</dt><dd>Ada Lovelace</dd></div><div><dt>Location</dt><dd>Building A, 1st floor</dd></div></dl>' +
      '<div class="ds-field"><label class="ds-field__label" for="sg-sheet-note' + (inline ? '-i' : '') + '">Note</label><input class="ds-input" id="sg-sheet-note' + (inline ? '-i' : '') + '" placeholder="Add a note"></div>' +
      '<div class="ds-form-actions"><button class="ds-btn ds-btn--primary" type="button" data-close>Save</button><button class="ds-btn ds-btn--text" type="button" data-close>Cancel</button>' +
      (inline ? '' : '<button class="ds-btn ds-btn--text" type="button" data-sg="dialog-nested">Retire the device</button>') + '</div></div></section></' + tag + '>';
  }

  /* Loading and progress */
  function progressHtml(share, name, label, detail, extra) {
    return '<div class="ds-progress' + (extra && extra.cls ? ' ' + extra.cls : '') + '"' + (extra && extra.id ? ' id="' + extra.id + '"' : '') + (share === null ? '' : ' style="--ds-progress:' + share + '"') + '>' +
      '<div class="ds-progress__track" role="progressbar" aria-label="' + name + '" aria-valuemin="0" aria-valuemax="100"' + (share === null ? ' aria-valuetext="' + extra.text + '"' : ' aria-valuenow="' + Math.round(share * 100) + '"') + '><div class="ds-progress__bar"></div></div>' +
      '<p class="ds-progress__label">' + label + '</p>' + (detail ? '<p class="ds-progress__detail">' + detail + '</p>' : '') + '</div>';
  }

  function ring(share, flat) {
    return '<span class="ds-spinner ds-spinner--determinate' + (flat ? ' ds-spinner--flat' : '') + '" role="progressbar" aria-label="Upload' + (flat ? ' (flat)' : '') + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(share * 100) + '" style="--ds-progress:' + share + '"></span>';
  }

  function skeletonHtml() {
    return '<div class="ds-skeleton" role="status" style="position:relative"><span class="ds-sr">Loading the page ...</span>' +
      '<span class="ds-skeleton__line ds-skeleton__line--heading" aria-hidden="true"></span><span class="ds-skeleton__line ds-skeleton__line--lead" aria-hidden="true"></span>' +
      '<p class="ds-skeleton__note">Loading 3 of 12 reports</p>' +
      '<div class="ds-skeleton__card"><span class="ds-skeleton__line ds-skeleton__line--title"></span><span class="ds-skeleton__line"></span><span class="ds-skeleton__line ds-skeleton__line--short"></span></div>' +
      '<div class="ds-skeleton__card"><span class="ds-skeleton__line ds-skeleton__line--title"></span><span class="ds-skeleton__line"></span><span class="ds-skeleton__line ds-skeleton__line--mid"></span></div></div>';
  }

  function loadedPageHtml() {
    return '<div class="ds-reveal sg-loaded"><h4 class="sg-loaded__title">Devices</h4><p class="ds-muted">1,284 devices, 7 overdue for replacement.</p>' +
      '<section class="ds-card"><h5 class="ds-card__title">LAPTOP-0042</h5><p class="ds-muted">Latitude 7440, issued to Ada Lovelace.</p></section>' +
      '<section class="ds-card"><h5 class="ds-card__title">DESKTOP-0107</h5><p class="ds-muted">OptiPlex 7010, in the server room. Replacement overdue.</p></section></div>';
  }

  function loading() {
    return section('loading', 'Loading and progress', 'Fast loads show nothing: indicators fade in after the loader delay and then stay long enough not to flicker. Their loops always run at their token speed.',
      '<div class="ds-grid-2">' +
      card('Shape loader', '<div class="sg-row sg-loaders"><span class="ds-loader" aria-hidden="true"></span><span class="ds-loader ds-loader--sm" aria-hidden="true"></span><span class="ds-loader ds-loader--contained" aria-hidden="true"></span></div>' +
        '<div class="ds-boot sg-boot" role="status"><span class="ds-loader" aria-hidden="true"></span>Starting the console ...</div>' +
        '<div class="ds-loading" role="status"><span class="ds-loader ds-loader--sm" aria-hidden="true"></span>Loading more devices ...</div>' +
        '<div class="ds-loading" role="status"><span class="ds-loader ds-loader--sm" aria-hidden="true"></span>Importing devices<p class="ds-loading__detail">812 of 2,030 rows</p></div>' +
        '<p class="ds-muted">The block loader (48px, --sm 24px, --contained on a tinted disc) for a section, a sheet or the app start: the shape morphs through the seven Material shapes while it turns. A few per view at most; inline spots keep the spinner.</p>') +
      card('Spinners', '<div class="sg-row"><span class="ds-spinner" aria-hidden="true"></span><span class="ds-spinner ds-spinner--sm" aria-hidden="true"></span><span class="ds-status ds-status--running"><span class="ds-spinner ds-status__spinner" aria-hidden="true"></span><span>Importing</span></span><button class="ds-btn ds-btn--primary" type="button" aria-busy="true">' + faces('Save', 'Saving', 'Saved') + '</button></div>' +
        '<div class="sg-row">' + ring(0.05) + ring(0.4) + ring(1) + ring(0.4, true) + '</div>' +
        '<p class="ds-muted">The inline spinner (16px, --sm 12px in the text colour) is the arc that grows and shrinks while it turns. The determinate ring shows a share on a wavy arc, a gap and the track (5%, 40%, done, and --flat); it never spins.</p>') +
      '</div>' +
      '<div class="ds-grid-2">' +
      card('Progress', progressHtml(0.05, 'Export', '5%', '102 of 2,030 rows') +
        progressHtml(0.4, 'Import', '40%', '812 of 2,030 rows', { id: 'sg-progress' }) +
        progressHtml(1, 'Backup', '100%', 'Done') +
        progressHtml(0.4, 'Upload (flat)', '40%', 'flat: no gap, no stop dot, no wave', { cls: 'ds-progress--flat' }) +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="progress">Advance</button></div>') +
      card('Unknown share', progressHtml(null, 'Preparing', 'Preparing the import ...', '', { cls: 'ds-progress--indeterminate', text: 'Preparing' }) +
        progressHtml(null, 'Queued export', 'Waiting for a free worker ...', '', { cls: 'ds-progress--waiting', text: 'Waiting' }) +
        progressHtml(0, 'Import run', 'Ready', 'Start runs waiting, preparing, 30%, done', { id: 'sg-progress-run' }) +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="progress-run">Start</button></div>' +
        '<p class="ds-muted">While the share is unknown the bar has no aria-valuenow but an aria-valuetext ("Waiting", "Preparing"); the first share sets aria-valuenow again. The segments stop and fade out, and the bar grows from 0 to its share.</p>') +
      '</div>' +
      '<div class="ds-grid-2">' +
      card('Page skeleton', '<div class="sg-stack" id="sg-skeleton-stage">' + skeletonHtml() + offHtml(loadedPageHtml()) + '</div>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="skeleton"><span class="sg-stack sg-stack--inline"><span>Load the page</span><span class="sg-off" aria-hidden="true">Show the skeleton again</span></span></button></div>' +
        '<p class="ds-muted">One calm wave passes over every bone at once. Loaded, the page replaces the skeleton with .ds-reveal.</p>') +
      card('Fast and slow loads', '<div class="sg-load-stage" id="sg-load-stage"><p class="ds-muted">Load the device list.</p></div>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="load" data-ms="150">Fast (150ms)</button><button class="ds-btn ds-btn--sm" type="button" data-sg="load" data-ms="300">Medium (300ms)</button><button class="ds-btn ds-btn--sm" type="button" data-sg="load" data-ms="1200">Slow (1200ms)</button></div>' +
        '<p class="ds-muted">The loading line goes in at once but fades in only after the loader delay, so the fast load shows nothing. DS.motion.settleLoader(startedAt, { element }) keeps a loader that did show for at least the hold time, so it never flashes.</p>') +
      '</div>');
  }

  /* The progress run: waiting, preparing, a first share, done; the aria follows each step. */
  var progressTimers = [];

  function progressRun() {
    var p = $('#sg-progress-run');
    var track = $('.ds-progress__track', p);
    var say = function (label, detail) {
      $('.ds-progress__label', p).textContent = label;
      $('.ds-progress__detail', p).textContent = detail;
    };
    var unknown = function (cls, text) {
      p.classList.remove('ds-progress--waiting', 'ds-progress--indeterminate');
      p.classList.add(cls);
      track.removeAttribute('aria-valuenow');
      track.setAttribute('aria-valuetext', text);
    };
    var share = function (value, label, detail) {
      p.classList.remove('ds-progress--waiting', 'ds-progress--indeterminate');
      p.style.setProperty('--ds-progress', String(value));
      track.removeAttribute('aria-valuetext');
      track.setAttribute('aria-valuenow', String(Math.round(value * 100)));
      say(label, detail);
    };
    progressTimers.forEach(clearTimeout);
    progressTimers = [];
    unknown('ds-progress--waiting', 'Waiting');
    p.style.setProperty('--ds-progress', '0');
    say('Waiting for a free worker ...', 'queued');
    progressTimers.push(setTimeout(function () {
      unknown('ds-progress--indeterminate', 'Preparing');
      say('Preparing the import ...', 'reading the file');
    }, slow(1200)));
    progressTimers.push(setTimeout(function () { share(0.3, '30%', '609 of 2,030 rows'); }, slow(3000)));
    progressTimers.push(setTimeout(function () { share(1, '100%', 'Done'); }, slow(4500)));
  }

  /* Skeleton: the page loads (the skeleton stays at least the loader hold once shown), then .ds-reveal. */
  var skeletonShownAt = Date.now();

  /* Markup in a stack cell that holds its size but is not shown (no motion, not announced, not focusable). */
  function offHtml(html) {
    return html.replace(/^<(\w+) class="/, '<$1 aria-hidden="true" inert class="sg-off ');
  }

  /* Shows one layer of a stack and keeps the others as invisible sizers: the
     stack is as tall and wide as its largest layer in both states, so the
     swap moves nothing below it (or the button under the pointer).
     Removing .sg-off restarts the layer's own entrance (.ds-reveal, the
     skeleton's delayed fade and wave). */
  function showLayer(stack, layer) {
    Array.prototype.forEach.call(stack.children, function (child) {
      var off = child !== layer;
      child.classList.toggle('sg-off', off);
      child.inert = off;
      if (off) child.setAttribute('aria-hidden', 'true');
      else child.removeAttribute('aria-hidden');
    });
  }

  function skeletonDemo(button) {
    var stage = $('#sg-skeleton-stage');
    var skeleton = $('.ds-skeleton', stage);
    var loaded = $('.sg-loaded', stage);
    var labels = button.querySelector('.sg-stack');
    if (!skeleton.classList.contains('sg-off')) {
      if (stage.getAttribute('data-sg-loading') === 'true') return;
      stage.setAttribute('data-sg-loading', 'true');
      M.settleLoader(skeletonShownAt, { element: skeleton }).then(function () {
        stage.removeAttribute('data-sg-loading');
        showLayer(stage, loaded);
        showLayer(labels, labels.lastElementChild);
      });
      return;
    }
    showLayer(stage, skeleton);
    showLayer(labels, labels.firstElementChild);
    skeletonShownAt = Date.now();
  }

  /* Fast and slow loads: a loading line, a fake request, settleLoader(), then the result. */
  var loadRun = 0;

  function loadDemo(ms) {
    var stage = $('#sg-load-stage');
    var run = loadRun += 1;
    stage.innerHTML = '<div class="ds-loading" role="status"><span class="ds-loader ds-loader--sm" aria-hidden="true"></span>Loading the devices ...</div>';
    var loader = stage.firstChild;
    /* The times are read once, before the request, so the verdict follows the
       hold settleLoader() computes rather than wall time (a busy machine). */
    var times = { delay: M.motionDuration(loader, '--ds-delay-loader'), minVisible: M.motionDuration(loader, '--ds-hold-loader') };
    var startedAt = Date.now();
    setTimeout(function () {
      var answered = Date.now();
      var shown = answered - startedAt > times.delay;
      var held = M.loaderHoldMs(startedAt, answered, times) > 0;
      M.settleLoader(startedAt, { now: answered, delay: times.delay, minVisible: times.minVisible }).then(function () {
        if (run !== loadRun) return;
        stage.innerHTML = '<p class="ds-muted">Loaded 1,284 devices after ' + ms + 'ms. ' +
          (!shown ? 'The loader never showed.' : held ? 'The loader had just appeared, so it stayed for the hold time.' : 'The loader showed and left at once.') + '</p>';
        M.enter(stage.firstChild, 'swap');
      });
    }, slow(ms));
  }

  /* App frame */
  /* The pages of the view swap demo (App frame). */
  var SWAP_PAGES = [
    ['Devices', 'Every laptop and desktop, synced nightly.'],
    ['Tickets', 'Three open, one waiting for a part.'],
    ['Owners', 'Forty-two people in six teams.'],
  ];

  function swapPage(index) {
    var page = SWAP_PAGES[index % SWAP_PAGES.length];
    return '<div class="sg-swap-page"><h4 class="ds-card__title">' + page[0] + '</h4><p class="ds-muted">' + page[1] + '</p></div>';
  }

  /* A segmented option as a radio button (a mode of the same page). */
  function radioSegment(text, checked, blocked) {
    return '<button class="ds-segmented__option" type="button" role="radio" aria-checked="' + Boolean(checked) + '"' + (checked ? '' : ' tabindex="-1"') +
      (blocked ? ' aria-disabled="true" data-tip="Needs at least two devices with readings"' : '') + ' data-label="' + text + '">' + text + '</button>';
  }

  function drawerItem(glyph, label, extra, count) {
    return '<a class="ds-drawer__item" href="#sg-drawer-sample"' + (extra || '') + ' data-tip="' + label + '">' + icon(glyph, 20) + '<span class="ds-drawer__label">' + label + '</span>' +
      (count ? '<span class="ds-drawer__count"><span class="ds-sr">, </span>' + count + '</span>' : '') + '</a>';
  }

  /* The drawer's parts, outside a frame: back, actions, groups that close, counts, a row action, a foot. */
  function drawerSample() {
    return '<div class="ds-drawer__back">' + drawerItem('arrowLeft', 'All sites') + '</div>' +
      '<div class="ds-drawer__actions"><button class="ds-btn ds-btn--tonal" type="button">' + icon('plus', 18) + 'New ticket</button></div>' +
      '<div class="ds-drawer__list" id="sg-drawer-sample-list">' +
        '<details class="ds-drawer__group ds-collapsible" open><summary class="ds-drawer__heading ds-drawer__toggle">' + icon('chevronDown', 20, 'ds-chevron') + '<span>Tickets</span><span class="ds-drawer__count" aria-hidden="true">5</span></summary>' +
          drawerItem('ticket', 'Open', ' aria-current="page"', 3) +
          '<div class="ds-drawer__row">' + drawerItem('clock', 'Waiting', '', 2) +
          '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-btn--sm ds-drawer__action" type="button" aria-label="Options for Waiting" data-tip="Options">' + icon('moreVertical', 18) + '</button></div>' +
        '</details>' +
        '<details class="ds-drawer__group ds-collapsible"><summary class="ds-drawer__heading ds-drawer__toggle">' + icon('chevronDown', 20, 'ds-chevron') + '<span>Devices</span><span class="ds-drawer__count" aria-hidden="true">12</span></summary>' +
          drawerItem('laptop', 'Laptops', '', 9) + drawerItem('monitor', 'Desktops', '', 3) +
        '</details>' +
      '</div>' +
      '<div class="ds-drawer__foot ds-drawer__foot--rail">' + drawerItem('settings', 'Settings') + drawerItem('info', 'Help') + '</div>';
  }

  var TABS = [['details', 'Details'], ['history', 'History', '3'], ['reports', 'Reports', '', true]];

  function tabsSample() {
    return '<div class="ds-tabs" id="sg-tabs" role="tablist" aria-label="Device">' + TABS.map(function (tab, index) {
      return '<button class="ds-tabs__tab" role="tab" type="button" id="sg-tab-' + tab[0] + '" aria-selected="' + (index === 0) + '" aria-controls="sg-tabpanel-' + tab[0] + '"' +
        (index ? ' tabindex="-1"' : '') + (tab[3] ? ' aria-disabled="true" data-tip="No reports for this device yet"' : '') + ' data-label="' + tab[1] + '">' + tab[1] +
        (tab[2] ? '<span class="ds-meta"><span class="ds-sr">, </span>' + tab[2] + '</span>' : '') + '</button>';
    }).join('') + '</div>' +
    TABS.map(function (tab, index) {
      return '<div class="ds-tabs__panel sg-tabpanel" role="tabpanel" id="sg-tabpanel-' + tab[0] + '" aria-labelledby="sg-tab-' + tab[0] + '" tabindex="0"' + (index ? ' hidden' : '') + '>' +
        '<p class="ds-muted">' + ['Latitude 7440, issued to Ada Lovelace. Synced today at 09:12.', 'Three changes this week: a new owner, a battery swap, a move to Building B.', 'No reports yet.'][index] + '</p></div>';
    }).join('');
  }

  function pageHeadSample() {
    return '<header class="ds-page-head">' +
      '<a class="ds-btn ds-btn--text ds-btn--sm ds-page-head__back" href="#frame">' + icon('arrowLeft', 18) + '<span class="ds-sr">Back to </span>Devices</a>' +
      '<div class="ds-page-head__row"><div class="ds-page-head__text"><h3 class="ds-page-head__title">LAPTOP-0042</h3><p class="ds-page-head__lead">Latitude 7440 · issued to Ada Lovelace · 2 of 128</p>' +
      '<div class="ds-page-head__status"><span class="ds-status ds-status--success">' + icon('checkCircle', 16) + '<span>Synced</span></span></div></div>' +
      '<div class="ds-page-head__actions"><button class="ds-btn" type="button">Retire</button><button class="ds-btn ds-btn--primary" type="button">Edit</button></div></div>' +
      '</header>' +
      '<nav class="ds-breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="#frame">Inventory</a></li><li><a href="#frame">Devices</a></li><li><a href="#frame" aria-current="page">LAPTOP-0042</a></li></ol></nav>';
  }

  var STEPS = ['Device', 'Problem', 'Contact'];

  function stepsSample(current) {
    var items = STEPS.map(function (label, index) {
      var done = index < current;
      return '<li class="ds-steps__step"' + (done ? ' data-status="done"' : '') + (index === current ? ' aria-current="step"' : '') + '>' +
        '<span class="ds-steps__mark">' + (done ? icon('check', 16) : String(index + 1)) + '</span>' +
        '<span class="ds-steps__label">' + label + (done ? '<span class="ds-sr">, done</span>' : '') + '</span></li>';
    }).join('');
    return '<ol class="ds-steps" aria-label="Report a problem">' + items + '</ol>' +
      '<ol class="ds-steps ds-steps--bar" aria-label="Step ' + Math.min(current + 1, STEPS.length) + ' of ' + STEPS.length + '">' + items + '</ol>';
  }

  function frame() {
    var segment = function (text, current) {
      return '<a class="ds-segmented__option" href="#frame" data-label="' + text + '"' + (current ? ' aria-current="true"' : '') + '>' + text + '</a>';
    };
    return section('frame', 'App frame', 'This page is the frame: a top bar and a navigation drawer on the backdrop, one white panel that scrolls. Below 900px the drawer becomes a modal sheet (use the menu button): it opens on the spring and closes accelerating, and crossing 900px never slides it. Scroll the page and the top bar tints with the hairline under it. The sliding pill follows the section you read; press and hold a drawer item or a segmented option and it turns squarer, then springs back.',
      card('Segmented switch', '<div class="sg-row"><nav class="ds-segmented" id="sg-segmented" aria-label="Mode">' + segment('Live', true) + segment('Admin') + segment('Reports') + '</nav></div>' +
        '<p class="ds-muted">The tint glides between options (DS.indicator) and the labels change colour while it arrives; the current option is also set in the label weight. data-label keeps the width of the heavier weight, so the switch never changes width.</p>' +
        '<div class="sg-row"><div class="ds-segmented" id="sg-segmented-buttons" role="radiogroup" aria-label="View">' + radioSegment('List', true) + radioSegment('Map') + radioSegment('Chart', false, true) + '</div></div>' +
        '<p class="ds-muted">A mode of the same page: button options (role="radio", aria-checked) sit flush in a page toolbar; the margin after the brand is the top bar\'s. Chart is aria-disabled: no hover, press or ripple, but it keeps its focus and says why.</p>') +
      card('Drawer parts', '<div class="sg-drawer-sample" id="sg-drawer-sample">' + drawerSample() + '</div>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="rail-toggle" aria-pressed="false">Rail (this page\'s drawer)</button></div>' +
        '<p class="ds-muted">A way back up with a hairline under it, a primary action, groups that close (their heading is a pressable row; the count shows while closed, and the pill leaves an item whose group closes), counts, an item with an action of its own at its end, and a foot of icon-only items. The rail narrows this page\'s drawer to its icons above 900px: labels stay readable and each item names itself in its tooltip.</p>') +
      card('Top bar parts', '<div class="sg-topbar-sample"><div class="ds-topbar">' +
          '<a class="ds-brand" href="#frame"><span class="ds-brand__name">Inventory</span></a>' +
          '<h1 class="ds-topbar__title">LAPTOP-0042</h1>' +
          '<div class="ds-topbar__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Help" data-tip="Help">' + icon('info', 20) + '</button><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Settings" data-tip="Settings">' + icon('settings', 20) + '</button></div>' +
          '<div class="ds-account ds-account--capsule"><div class="ds-account__text" aria-hidden="true"><div class="ds-account__name">Ada Lovelace</div><div class="ds-account__email">ada@example.org</div></div>' +
          '<span class="ds-account__avatar" role="img" aria-label="Ada Lovelace, ada@example.org" tabindex="0" data-tip="Ada Lovelace, ada@example.org">A</span><span class="ds-account__divider"></span><button class="ds-btn ds-btn--text" type="button">Sign out</button></div>' +
        '</div></div>' +
        '<div class="sg-row"><span class="ds-avatar ds-avatar--sm" role="img" aria-label="Grace Hopper">G</span><span class="ds-avatar" role="img" aria-label="Alan Turing">A</span><span class="ds-avatar ds-avatar--lg" role="img" aria-label="Katherine Johnson">K</span><span class="ds-muted">Avatars: 24, 32 and 40px</span></div>' +
        '<p class="ds-muted">A title in the bar (two lines of the label role on phones, where the brand gives way), icon actions with tooltips, and the account as a capsule: the avatar carries the name, the text beside it is aria-hidden and goes below 720px.</p>') +
      card('Tabs', tabsSample() +
        '<p class="ds-muted">The bar under the selected tab glides like the drawer\'s pill and the labels change colour as it arrives; the selected tab also takes the label weight. Arrow keys move between the tabs; the new panel enters with swap. History carries a count; Reports is aria-disabled and says why in its tooltip.</p>') +
      card('Page head and breadcrumbs', '<div class="sg-stage sg-page-sample">' + pageHeadSample() + '</div>' +
        '<p class="ds-muted">A record\'s head: the way back (a small text button, "Back to Devices" for a screen reader), the title with its lead and status, and the actions on the title\'s centre line; they wrap under the title on a narrow page. Breadcrumbs take the back link\'s place where the trail matters; on a narrow page only the parent shows.</p>') +
      card('Steps', '<div class="sg-steps-sample" id="sg-steps">' + stepsSample(1) + '</div>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="steps-back">Back</button><button class="ds-btn ds-btn--sm ds-btn--tonal" type="button" data-sg="steps-next">Next step</button></div>' +
        '<p class="ds-muted">A done step draws its check, the current one is filled and set in the label weight; the bar fills its segments on the value curve. Steps are not buttons: going back is the page\'s own button.</p>') +
      card('A message for the whole app', '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="banner-toggle" aria-pressed="false">Show the offline banner</button></div>' +
        '<p class="ds-muted">The banner sits above the view in the panel, outside its scroll. It comes and goes through DS.motion.flip on the panel: the view glides, the banner fades in place.</p>') +
      card('Prose and code', '<div class="ds-prose ds-prose--dense">' +
          '<h2>Before you retire a device</h2><p>Back up the device and note its <strong>asset tag</strong>; the <a href="#frame">retire checklist</a> lists the rest. Run <code>ds-cli retire</code> from a workstation.</p>' +
          '<ul><li>Charger and dock go back to storage.</li><li>The owner gets a replacement first.</li></ul>' +
          '<blockquote><p>Devices older than four years are retired, not repaired.</p></blockquote>' +
          '<pre><code>ds-cli retire LAPTOP-0042 --keep-history</code></pre>' +
        '</div>' +
        '<pre class="ds-code-block" tabindex="0" aria-label="Request"><code>GET /api/devices/42 HTTP/1.1\nAccept: application/json</code></pre>' +
        '<p class="ds-muted">Rendered rich text keeps a reading hierarchy of its own (.ds-prose; --dense for cards). A code block scrolls sideways in its own box; it takes the focus only because it can scroll.</p>') +
      card('Sign-in page', '<div class="sg-auth-sample"><div class="ds-auth">' +
          '<div class="ds-auth__alert"><div class="ds-alert ds-alert--error" role="status">' + icon('alertCircle', 20) + '<span class="ds-alert__text">The password is wrong.</span></div></div>' +
          '<section class="ds-card ds-card--elevated ds-auth__card" aria-labelledby="sg-auth-title"><h3 class="ds-card__title" id="sg-auth-title">Sign in</h3>' +
          '<form class="ds-form" data-sg-form><div class="ds-field"><label class="ds-field__label" for="sg-auth-email">Email</label><input class="ds-input" id="sg-auth-email" type="email" autocomplete="off" value="ada@example.org"></div>' +
          '<div class="ds-form-actions"><button class="ds-btn ds-btn--primary" type="button">Sign in</button></div></form></section>' +
        '</div></div>' +
        '<p class="ds-muted">.ds-auth: one centred card on the backdrop, the alert slot above it, the primary action as wide as the card. Shown here in a box; the page itself is at least the window\'s height.</p>') +
      card('Drawer and view', '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" data-sg="drawer-toggle" aria-pressed="false">View without the drawer</button><button class="ds-btn ds-btn--sm" type="button" data-sg="swap-view">Swap the view</button></div>' +
        '<div class="sg-stage sg-swap-stage"><div class="sg-swap-view" id="sg-swap-view">' + swapPage(0) + '</div></div>' +
        '<p class="ds-muted">Inside DS.motion.transition() the panel takes the width on the spring while the drawer leaves to the left, and gives it back while the drawer comes in; without View Transitions the grid changes at once and the returning drawer slides in from the left (DS.motion.enter(drawer)). The swap, by hand, fades the view\'s children out (.ds-view--leaving, deprecated since 2.0: DS.motion.transition() replaces it), waits for that fade, replaces the content and lets it enter (swap); pressing again during a swap ends on the latest view.</p>' +
        '<pre class="ds-code-block" tabindex="0" aria-label="The breakpoint snippet">const modal = matchMedia(\'(max-width: 900px)\');\nmodal.addEventListener(\'change\', () =&gt; {\n  drawer.classList.add(\'ds-drawer--instant\');\n  if (!modal.matches) {\n    app.removeAttribute(\'data-drawer-open\');\n    document.body.classList.remove(\'ds-no-scroll\');\n  }\n  requestAnimationFrame(() =&gt; requestAnimationFrame(() =&gt;\n    drawer.classList.remove(\'ds-drawer--instant\')));\n});</pre>' +
        '<p class="ds-muted">The breakpoint snippet this page runs: the drawer turns modal (or back) in place, and a modal drawer that a wider window no longer shows is closed.</p>') +
      card('Views and scrolling', '<p class="ds-muted">The motion between views and the motion that follows scrolling, in a small app of its own: fade-through between destinations, shared axis for previous and next, a card growing into its detail or into a side sheet, a destination without the drawer, a record swap in a sheet, a report that reveals itself on scroll, a wide table with live edge fades, and page loads with the opt-in stylesheet (needs http).</p>' +
        '<div class="sg-row"><a class="ds-btn" href="views.html">Open the views page ' + icon('arrowRight', 16) + '</a></div>') +
      card('Markup', '<pre class="ds-code-block" tabindex="0" aria-label="The frame markup">&lt;div class="ds-app ds-app--drawer"&gt;\n  &lt;div class="ds-topbar"&gt; menu button, .ds-brand, .ds-account &lt;/div&gt;\n  &lt;nav class="ds-drawer"&gt; .ds-drawer__list &gt; .ds-drawer__group &gt; .ds-drawer__item &lt;/nav&gt;\n  &lt;div class="ds-scrim"&gt;&lt;/div&gt;\n  &lt;div class="ds-panel"&gt;&lt;main class="ds-view"&gt;\n    &lt;div class="ds-content"&gt;&lt;div class="ds-page"&gt; ... &lt;/div&gt;&lt;/div&gt;\n  &lt;/main&gt;&lt;/div&gt;\n&lt;/div&gt;</pre><p class="ds-muted">Full markup in docs/components.md.</p>'));
  }

  /* Motion: the principles in short; every demo is in the Motion Lab. */
  function motion() {
    return section('motion', 'Motion', 'Material curves for fades, a gentle spring for movement that floats, short distances, exits faster than entrances. The same motion on every device; the Speed select in the top bar (or ?speed=0.1 in the address) plays it slower.',
      card('Principles', '<ul class="sg-principles">' +
        '<li>Springs carry what floats (the indicator, sheets, menus, rows that glide); fades and colours stay within their range, and sizes that push layout land on <code>--ds-ease-out</code>.</li>' +
        '<li>Hover never moves anything; a press ripples from the pointer and turns the shape squarer, then it springs back.</li>' +
        '<li>Interrupted, every motion continues from where it is; data glides to its new place and never replays an entrance.</li></ul>' +
        '<div class="sg-row"><a class="ds-btn ds-btn--tonal" href="motion.html">' + icon('activity', 16) + 'Open the Motion Lab</a><a class="ds-btn ds-btn--text" href="../docs/motion.md">Motion reference ' + icon('arrowRight', 16) + '</a></div>' +
        '<p class="ds-muted">The lab plots every curve as this browser plays it, lines up the durations, and replays every choreography, with rapid toggles and reversals to show interruption.</p>'));
  }

  /* Icons */
  function glyphs() {
    return Object.keys(I).filter(function (name) { return typeof I[name] === 'string' && I[name].charAt(0) === '<'; });
  }

  /* The glyphs whose last element is a closed outline (docs/icons.md): they fill when on. */
  var FILLABLE = ['thumbUp', 'thumbDown', 'chat', 'shield', 'folder', 'flag', 'bell', 'home', 'moon', 'play'];

  function icons() {
    return section('icons', 'Icons', glyphs().length + ' outline glyphs on a 24px grid, stroke 2, colour from currentColor. DS.icons.icon(DS.icons.name, size). The marked ones fill when on (.ds-icon--fillable in an aria-pressed control).',
      card('', '<div class="sg-row"><button class="ds-btn ds-btn--sm" type="button" aria-pressed="false" data-sg="fill-icons">' + icon('bell', 16, 'ds-icon--fillable') + 'Fill the fillable glyphs</button></div>' +
        '<div class="sg-icons" id="sg-icons">' + glyphs().map(function (name) {
          var fillable = FILLABLE.indexOf(name) !== -1;
          return '<div class="sg-icon' + (fillable ? ' sg-icon--fillable' : '') + '">' + icon(name, 20, fillable ? 'ds-icon--fillable' : '') + '<span>' + name + (fillable ? ' (fills)' : '') + '</span></div>';
        }).join('') + '</div>'));
  }

  /* ── Motion Lab (motion.html) ────────────────────────────────────── */

  var LAB = window.SG_LAB || [];

  /** The lab's groups that have demos, in page order. */
  function labGroups() {
    return (window.SG_LAB_GROUPS || []).filter(function (group) {
      return LAB.some(function (entry) { return entry.group === group.id; });
    });
  }

  /** Tokens whose computed value is a time: the card shows them in ms. */
  var TIMED = /^--ds-(dur|delay|hold|stagger|loop)(-|$)/;

  function isToken(name) { return name.indexOf('--ds-') === 0; }

  /** A token as a label; a time token with its computed ms (refreshTimes() fills it). */
  function tokenLabel(name) {
    return '<code>' + name + '</code>' + (TIMED.test(name) ? ' <span class="ds-num" data-lab-ms="' + name + '"></span>' : '');
  }

  /* A code label is an inline-block, and an inline-block adds a line break
     opportunity on each side, even next to "(" or ",": the punctuation
     touching a label goes into one .sg-glue span with it, which keeps them
     on one line (the label itself can still wrap inside). */
  function glue(html) {
    return html.replace(/([(\[{"']*)(<code>[^<]*<\/code>)([)\]}.,;:!?"']*)/g, function (match, before, code, after) {
      return before || after ? '<span class="sg-glue">' + before + code + after + '</span>' : match;
    });
  }

  /* One demo of the registry: stage, the tokens it uses with their ms at the
     current speed, what else it exercises, and its buttons. */
  function labCard(entry) {
    return glue(labCardHtml(entry));
  }

  function labCardHtml(entry) {
    var tokens = entry.shows.filter(isToken);
    var others = entry.shows.filter(function (name) { return !isToken(name); });
    return '<article class="ds-card sg-demo' + (entry.wide ? ' sg-demo--wide' : '') + '" data-lab-demo="' + entry.id + '" data-lab-shows="' + esc(entry.shows.join(' ')) + '" data-lab-state="idle" aria-labelledby="lab-' + entry.id + '-title">' +
      '<h3 class="ds-card__title" id="lab-' + entry.id + '-title">' + entry.title + '</h3>' +
      (entry.note ? '<p class="ds-muted sg-demo__note">' + entry.note + '</p>' : '') +
      '<div class="sg-lab-stage"' + (entry.height ? ' style="--sg-lab-stage-height: ' + entry.height + 'px"' : '') + '>' + entry.html + '</div>' +
      (entry.after || '') +
      (tokens.length ? '<p class="ds-meta sg-demo__tokens">' + tokens.map(tokenLabel).join(' · ') + '</p>' : '') +
      (others.length ? '<p class="ds-meta sg-demo__shows">Exercises ' + others.map(function (name) { return '<code>' + esc(name) + '</code>'; }).join(', ') + '</p>' : '') +
      '<div class="sg-row sg-demo__actions"><button class="ds-btn ds-btn--sm ds-btn--tonal" type="button" data-lab="replay">' + icon('reset', 16) + (entry.playLabel || 'Replay') + '</button>' +
      (entry.toggle ? '<button class="ds-btn ds-btn--sm" type="button" data-lab="rapid">Rapid toggle</button><button class="ds-btn ds-btn--sm" type="button" data-lab="reverse">Reverse at 50%</button>' : '') + '</div>' +
      (entry.controls || '') + '</article>';
  }

  function labGroup(group) {
    return '<section class="sg-section" id="' + group.id + '" aria-labelledby="' + group.id + '-title">' +
      '<header class="ds-page-head"><h2 class="ds-page-head__title" id="' + group.id + '-title">' + group.title + '</h2>' +
      '<p class="ds-page-head__lead">' + group.lead + '</p></header>' +
      '<div class="sg-demos">' + LAB.filter(function (entry) { return entry.group === group.id; }).map(labCard).join('') + '</div></section>';
  }

  /* The lab's opening: what it is, how to use it, and four figures. */
  function labIntro() {
    var durations = {};
    LAB.forEach(function (entry) { entry.shows.forEach(function (name) { if (name.indexOf('--ds-dur-') === 0) durations[name] = true; }); });
    var curves = LAB.filter(function (entry) { return entry.id.indexOf('curve-') === 0; }).length;
    var figure = function (name, value, glyph, note, id) {
      return '<div class="ds-tile"><p class="ds-tile__label">' + icon(glyph, 20) + '<span>' + name + '</span></p><p class="ds-tile__value"' + (id ? ' id="' + id + '"' : '') + '>' + value + '</p><p class="ds-tile__note">' + note + '</p></div>';
    };
    return '<section class="sg-section" id="lab" aria-labelledby="lab-title">' +
      '<div class="sg-hero"><h1 id="lab-title">Motion Lab</h1>' +
      '<p>Every motion of Dashboard-Style, one demo at a time: the curves and durations it is built from, sampled from this browser, and the choreography of its parts. Replay any demo; Rapid toggle and Reverse at 50% interrupt it, and every motion continues from where it is.</p>' +
      '<p>The Speed select in the top bar slows everything down to a tenth (or add <code>?speed=0.1</code> to the address): it sets <code>--ds-time-scale</code>, so CSS motion and DS.motion slow down together.</p>' +
      '<div class="sg-row"><a class="ds-btn ds-btn--primary" href="#foundations">Start with the curves</a><a class="ds-btn" href="index.html">' + icon('arrowLeft', 16) + 'Back to the styleguide</a><a class="ds-btn ds-btn--text" href="../docs/motion.md">Motion reference ' + icon('arrowRight', 16) + '</a></div></div>' +
      '<div class="ds-tiles">' +
      figure('Demos', String(LAB.length), 'apps', 'each one replays') + figure('Curves', String(curves), 'activity', 'sampled, not drawn') +
      figure('Durations', String(Object.keys(durations).length), 'clock', '50 to 600ms') + figure('Spring peak', '...', 'sparkles', 'the contract: at most 1.05', 'sg-lab-peak') +
      '</div></section>';
  }

  /* The time labels of the lab: tokens in ms at the current speed, and the
     travel times of the ladder. */
  function refreshTimes() {
    // Every read first, then every write: a write between two reads would
    // make each read restyle the whole page again.
    var labels = $$('[data-lab-ms]').map(function (el) { return [el, Math.round(M.motionDuration(el, el.getAttribute('data-lab-ms'))) + 'ms']; })
      .concat($$('[data-lab-travel]').map(function (el) { return [el, Math.round(M.travelDuration(el, Number(el.getAttribute('data-lab-travel')))) + 'ms']; }));
    labels.forEach(function (label) { if (label[0].textContent !== label[1]) label[0].textContent = label[1]; });
  }

  /* The helpers a lab entry gets as `sg` (lab.js). */
  var indicators = [];

  function addIndicator(track, options) {
    var made = DS.indicator.createIndicator(track, options);
    indicators.push(made);
    return made;
  }

  function frames(count) {
    return new Promise(function (resolve) {
      var left = count;
      (function tick() {
        if (left <= 0) { resolve(); return; }
        left -= 1;
        requestAnimationFrame(tick);
      }());
    });
  }

  var SG = { icon: icon, toast: function (text, kind) { return toast(text, kind); }, slow: slow, indicator: addIndicator, frames: frames };
  window.SG_LAB_HELPERS = SG;

  /* Each demo's run: a newer press supersedes an older one (its timers stop,
     and only the latest run marks the card settled), and `on` is where a
     reversible demo is. */
  var labDemos = {};

  function labOn(demo) {
    if (demo.entry.state) demo.on = !!demo.entry.state(demo.stage);
    return demo.on;
  }

  function labRun(demo, start) {
    var run = demo.run += 1;
    demo.timers.forEach(clearTimeout);
    demo.timers = [];
    demo.card.setAttribute('data-lab-state', 'running');
    var finish = function () { if (run === demo.run) demo.card.setAttribute('data-lab-state', 'settled'); };
    new Promise(function (resolve) { resolve(start()); }).then(finish, function (error) {
      finish();
      throw error;
    });
  }

  function later(demo, ms) {
    return new Promise(function (resolve) { demo.timers.push(setTimeout(resolve, ms)); });
  }

  function labReplay(demo) {
    labRun(demo, function () {
      if (demo.entry.reset) demo.entry.reset(demo.stage, SG);
      var done = demo.entry.play(demo.stage, SG);
      demo.on = true;
      labOn(demo);
      return done;
    });
  }

  /* Five toggles 80ms apart (at the current speed): the end state is the
     one the count implies, and nothing jumps on the way. */
  function labRapid(demo) {
    labRun(demo, function () {
      labOn(demo);
      return new Promise(function (resolve) {
        var left = 5;
        (function next() {
          demo.on = !demo.on;
          var done = demo.entry.toggle(demo.stage, demo.on, SG);
          left -= 1;
          if (left) demo.timers.push(setTimeout(next, slow(80)));
          else resolve(done);
        }());
      });
    });
  }

  /** How long until the longest motion in `root` (the stage, or the entry's subject) is half done (ms). */
  function halfway(root) {
    var longest = null;
    root.getAnimations({ subtree: true }).forEach(function (animation) {
      var timing = animation.effect && animation.effect.getComputedTiming();
      if (!timing || !isFinite(timing.endTime) || !(timing.endTime > 0)) return;
      if (!longest || timing.endTime > longest.end) longest = { end: timing.endTime, at: Number(animation.currentTime) || 0 };
    });
    if (!longest) return M.motionDuration(document.documentElement, '--ds-dur-medium') / 2;
    return Math.max(0, longest.end / 2 - longest.at);
  }

  /* Starts the motion, then turns it back at half of its (scaled) duration:
     the way back continues from there, never from the start. */
  function labReverse(demo) {
    labRun(demo, function () {
      demo.on = !labOn(demo);
      demo.entry.toggle(demo.stage, demo.on, SG);
      // Two frames: an indicator places itself one frame after the change.
      return frames(2).then(function () {
        var subject = demo.entry.subject ? demo.entry.subject(demo.stage) : demo.stage;
        return later(demo, halfway(subject || demo.stage));
      }).then(function () {
        demo.on = !demo.on;
        return demo.entry.toggle(demo.stage, demo.on, SG);
      });
    });
  }

  /* The lab's sections, appended to the opening that render() put in. */
  function renderLabSections() {
    var template = document.createElement('template');
    template.innerHTML = labGroups().map(labGroup).join('');
    var sections = Array.prototype.slice.call(template.content.children);
    presetStates(template.content);
    $('#sg-page').append(template.content);
    return sections;
  }

  /*
   * The lab's sections and demos come after the first render. Built, laid
   * out and set up (curves sampled, indicators placed) before it, they kept
   * the page render-blocked (<link rel="expect"> in motion.html) for half a
   * second and more, and a cross-document View Transition whose new page
   * comes that late is skipped once the engine's timeout passes: the move
   * from the styleguide lost its glide on a busy machine. So the first
   * render holds the frame, the drawer with its named pill and the lab's
   * opening; the rest waits for the incoming View Transition to finish
   * (its main-thread animations, the pill's size among them, would stall
   * behind the work) or, without one, for the frame after the reveal.
   * pagereveal comes before the animation frame callbacks of the same
   * frame: a first frame callback that has seen none comes after a reveal
   * that happened earlier, or in an engine without the event.
   */
  function startLab(done) {
    var transition = null;
    var start = function () {
      setTimeout(function () {
        var sections = renderLabSections();
        setupLab();
        $$('.sg-section').forEach(function (s) { spy.observe(s); });
        refreshTimes();
        M.enterAll(sections, 'swap');
        var target = location.hash && document.getElementById(location.hash.slice(1));
        if (target) target.scrollIntoView();
        done();
      }, 0);
    };
    window.addEventListener('pagereveal', function (event) { transition = event.viewTransition || null; }, { once: true });
    requestAnimationFrame(function () {
      if (transition) transition.finished.then(start, start);
      else start();
    });
  }

  function setupLab() {
    LAB.forEach(function (entry) {
      var card = $('[data-lab-demo="' + entry.id + '"]');
      var demo = labDemos[entry.id] = { entry: entry, card: card, stage: $('.sg-lab-stage', card), on: false, run: 0, timers: [] };
      if (entry.setup) entry.setup(demo.stage, SG);
      labOn(demo);
    });
    $('#sg-page').addEventListener('click', function (event) {
      var button = event.target.closest('[data-lab]');
      var demo = button && labDemos[button.closest('[data-lab-demo]').getAttribute('data-lab-demo')];
      if (!demo) return;
      var kind = button.getAttribute('data-lab');
      if (kind === 'replay') labReplay(demo);
      if (kind === 'rapid' && demo.entry.toggle) labRapid(demo);
      if (kind === 'reverse' && demo.entry.toggle) labReverse(demo);
    });
    var spatial = $('[data-lab-curve="--ds-ease-spatial"] [data-lab-peak]');
    if (spatial && $('#sg-lab-peak')) $('#sg-lab-peak').textContent = spatial.getAttribute('data-lab-peak');
    DS.overlay.tooltips(document);
  }

  /* ── Render ──────────────────────────────────────────────────────── */

  /* Markup into the page through an inert <template>: parsed straight into
     the document (innerHTML with an icon's <svg>), it would make Chromium
     end the render block of the pages' <link rel="expect"> before the
     named drawer indicator exists (css/optional/view-transitions.css). */
  function setHtml(element, html, prepare) {
    var template = document.createElement('template');
    template.innerHTML = html;
    if (prepare) prepare(template.content);
    element.replaceChildren(template.content);
  }

  function render() {
    $('#sg-version').textContent = 'v' + DS.version;
    setHtml($('[data-sg="menu"]'), icon('menu', 20));
    setHtml($('#sg-nav'), (PAGE === 'lab' ? labNav() : NAV).map(function (group) {
      return '<div class="ds-drawer__group"><p class="ds-drawer__heading">' + group.group + '</p>' + group.items.map(function (item) {
        return '<a class="ds-drawer__item" href="' + (item[3] || '#' + item[0]) + '">' + icon(item[2], 20) + '<span class="ds-drawer__label">' + item[1] + '</span></a>';
      }).join('') + '</div>';
    }).join(''));
    // The lab's first render is its opening alone: its demos follow once
    // the page is revealed (startLab).
    setHtml($('#sg-page'), PAGE === 'lab'
      ? labIntro()
      : overview() + colour() + type() + shape() + buttons() + status() + cards() + table() + forms() + selection() + overlays() + loading() + charts() + frame() + motion() + icons(), presetStates);
    // The current item is part of the first render: its colour never fades
    // in on load. A lab address with a section's hash starts on that
    // section's item, before the section itself exists.
    var hashed = PAGE === 'lab' && location.hash && $$('#sg-nav a').some(function (a) { return a.getAttribute('href') === location.hash; });
    setActive(hashed ? location.hash.slice(1) : $('.sg-section').id);
    readValues();
  }

  /* The mixed state exists only as a property: set it on the parsed markup
     before it goes into the page, or the boxes play their dash on load
     where the engine has styled them on insertion (Firefox, WebKit). A
     header checkbox takes the state of its rows, as the demos keep it. */
  function presetStates(root) {
    $$('[data-sg="indeterminate"], [data-check-some]', root).forEach(function (input) { input.indeterminate = true; });
    $$('table', root).forEach(function (table) {
      var all = $('thead input[type="checkbox"]', table);
      var rows = $$('tbody input[type="checkbox"]', table);
      if (!all || !rows.length) return;
      var checked = rows.filter(function (row) { return row.checked; }).length;
      all.checked = checked === rows.length;
      all.indeterminate = checked > 0 && checked < rows.length;
    });
  }

  /* Current values of the colour and type roles (they change with the theme). */
  function readValues() {
    var style = getComputedStyle(document.documentElement);
    $$('[data-value]').forEach(function (el) { el.textContent = style.getPropertyValue(el.dataset.value).trim(); });
    $$('[data-font]').forEach(function (el) {
      var sample = el.parentNode.firstChild;
      var s = getComputedStyle(sample);
      el.textContent = s.fontWeight + ' ' + s.fontSize + '/' + s.lineHeight;
    });
  }

  /* ── Navigation: drawer, active section, modal drawer ──────────────── */

  var app = $('#sg-app');
  var view = $('#main');
  var modal = window.matchMedia('(max-width: 900px)');

  /* The indicators follow aria-current and aria-pressed by themselves
     (their MutationObserver): no update() after a change. */
  function setActive(id) {
    $$('#sg-nav .ds-drawer__item').forEach(function (a) {
      if (a.getAttribute('href') === '#' + id) {
        if (a.getAttribute('aria-current') !== 'page') a.setAttribute('aria-current', 'page');
      } else if (a.hasAttribute('aria-current')) {
        a.removeAttribute('aria-current');
      }
    });
  }

  /* The modal drawer through DS.overlay: the scroll lock, the inert page,
     Escape, the scrim, and focus back on the menu button at once. */
  function openDrawer(open) {
    var drawer = $('#sg-drawer');
    if (open) DS.overlay.open(drawer, { opener: $('[data-sg="menu"]') });
    else DS.overlay.close(drawer);
  }

  /* Scroll-spy with a programmatic smooth scroll: a drawer link sets its
     item current at once and mutes the spy until the scroll ends, so the
     pill does not walk through every section on the way. The end is
     scrollend where it exists (Progressive), else a quiet period without
     scroll events (--ds-dur-fast) that each scroll event restarts. The
     period only starts with the first scroll event (a busy page may start
     the smooth scroll late), and a link to where the view already is mutes
     nothing, since no scroll follows. */
  var navigating = false;
  var quietTimer = 0;
  /** The scroll-spy (an IntersectionObserver on the sections), set up by setupNavigation(). */
  var spy = null;

  /** Whether scrolling `section` to the top of the view moves the view. */
  function scrollsTo(section) {
    var margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
    var top = section.getBoundingClientRect().top - view.getBoundingClientRect().top - view.clientTop - margin + view.scrollTop;
    var target = Math.max(0, Math.min(view.scrollHeight - view.clientHeight, top));
    return Math.abs(target - view.scrollTop) >= 1;
  }

  function stopNavigating() {
    navigating = false;
    clearTimeout(quietTimer);
  }

  function waitForQuiet() {
    clearTimeout(quietTimer);
    quietTimer = setTimeout(stopNavigating, M.motionDuration(view, '--ds-dur-fast'));
  }

  /* The breakpoint snippet of docs/components.md: crossing 900px changes
     the drawer in place (no slide, no scrim fade) and closes a modal
     drawer that the wider window no longer shows. */
  function setupBreakpoint() {
    var drawer = $('#sg-drawer');
    modal.addEventListener('change', function () {
      drawer.classList.add('ds-drawer--instant');
      if (!modal.matches && app.hasAttribute('data-drawer-open')) openDrawer(false);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { drawer.classList.remove('ds-drawer--instant'); });
      });
    });
  }

  function setupNavigation() {
    // Named, so the pill glides across the load between the two pages
    // (css/optional/view-transitions.css).
    // The current item is set (render()): the pill's first placement jumps
    // there, instead of growing in from an empty track on load.
    addIndicator($('#sg-nav'), { active: '[aria-current="page"]', className: 'ds-drawer__indicator', name: 'nav' });
    var list = $('#sg-nav');
    var overflow = function () { list.classList.toggle('ds-drawer__list--overflow', list.scrollHeight > list.clientHeight + 1); };
    overflow();
    window.addEventListener('resize', overflow);
    var visible = {};
    spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible[entry.target.id] = entry.isIntersecting; });
      if (navigating) return;
      var first = $$('.sg-section').filter(function (s) { return visible[s.id]; })[0];
      if (first) setActive(first.id);
    }, { root: view, rootMargin: '0px 0px -60% 0px' });
    // The lab's spy starts with its sections (startLab): watching the
    // opening alone would take the pill off a hash's section on load.
    if (PAGE !== 'lab') $$('.sg-section').forEach(function (s) { spy.observe(s); });

    // data-scrolled (DS.dom.watchScrolled): the fallback of the scroll-driven hairlines and the top bar's tint.
    DS.dom.watchScrolled(view, app);
    $$('.ds-sheet__panel').forEach(function (panel) { DS.dom.watchScrolled($('.ds-sheet__body', panel), panel); });
    view.addEventListener('scroll', function () {
      if (navigating && !('onscrollend' in view)) waitForQuiet();
    }, { passive: true });
    if ('onscrollend' in view) view.addEventListener('scrollend', function () { if (navigating) stopNavigating(); });

    $('#sg-nav').addEventListener('click', function (event) {
      var link = event.target.closest('a');
      // A link to the other page loads it (a cross-document View Transition over http).
      if (!link || link.getAttribute('href').charAt(0) !== '#') return;
      event.preventDefault();
      var id = link.getAttribute('href').slice(1);
      var section = $('#' + id);
      setActive(id);
      stopNavigating();
      navigating = scrollsTo(section);
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
      if (modal.matches) openDrawer(false);
    });
    setupBreakpoint();
    // The scrim and Escape close the drawer by themselves (DS.overlay).
    $('[data-sg="menu"]').addEventListener('click', function () {
      // Above 900px the menu button shows only with the rail: it widens the drawer again.
      if (!modal.matches && this.hasAttribute('aria-pressed')) return toggleRail($('[data-sg="rail-toggle"]'));
      openDrawer(!app.hasAttribute('data-drawer-open'));
    });

    if (!$('#sg-segmented')) return;
    setupFrameParts();
    addIndicator($('#sg-segmented'), { active: '[aria-current="true"]', className: 'ds-segmented__indicator', name: 'mode' });
    $('#sg-segmented').addEventListener('click', function (event) {
      var option = event.target.closest('a');
      if (!option) return;
      event.preventDefault();
      $$('.ds-segmented__option', this).forEach(function (o) { if (o === option) o.setAttribute('aria-current', 'true'); else o.removeAttribute('aria-current'); });
    });
  }

  /* The 2.0 frame parts (App frame): segmented buttons, the drawer sample,
     tabs, steps, the rail of this page's drawer and the banner. */
  function setupFrameParts() {
    var buttons = $('#sg-segmented-buttons');
    addIndicator(buttons, { active: '[aria-checked="true"]', className: 'ds-segmented__indicator' });
    buttons.addEventListener('click', function (event) {
      var option = event.target.closest('.ds-segmented__option');
      if (!option || option.getAttribute('aria-disabled') === 'true') return;
      $$('.ds-segmented__option', buttons).forEach(function (other) {
        other.setAttribute('aria-checked', String(other === option));
        other.tabIndex = other === option ? 0 : -1;
      });
    });

    var sample = $('#sg-drawer-sample-list');
    addIndicator(sample, { active: '[aria-current="page"]', className: 'ds-drawer__indicator', reveal: true });
    $('#sg-drawer-sample').addEventListener('click', function (event) {
      var item = event.target.closest('.ds-drawer__item');
      if (!item) return;
      event.preventDefault();
      if (!sample.contains(item)) return;
      $$('.ds-drawer__item', sample).forEach(function (other) {
        if (other === item) other.setAttribute('aria-current', 'page');
        else other.removeAttribute('aria-current');
      });
    });

    var tabs = $('#sg-tabs');
    addIndicator(tabs, { active: '[aria-selected="true"]', className: 'ds-tabs__indicator', reveal: true });
    tabs.addEventListener('click', function (event) {
      var tab = event.target.closest('[role="tab"]');
      if (!tab || tab.getAttribute('aria-disabled') === 'true' || tab.getAttribute('aria-selected') === 'true') return;
      var shown = null;
      $$('[role="tab"]', tabs).forEach(function (other) {
        var selected = other === tab;
        var panel = $('#' + other.getAttribute('aria-controls'));
        other.setAttribute('aria-selected', String(selected));
        other.tabIndex = selected ? 0 : -1;
        panel.hidden = !selected;
        if (selected) shown = panel;
      });
      M.enter(shown, 'swap');
    });
  }

  var stepAt = 1;

  function step(by) {
    stepAt = Math.max(0, Math.min(STEPS.length, stepAt + by));
    DS.dom.morphHtml($('#sg-steps'), stepsSample(stepAt));
  }

  /* The rail of this page's drawer: data-drawer-collapsed, the menu button
     with aria-pressed (it shows above 900px then), and a tooltip on each
     item, whose label is gone. */
  function toggleRail(button) {
    var on = !app.hasAttribute('data-drawer-collapsed');
    if (button) button.setAttribute('aria-pressed', String(on));
    app.toggleAttribute('data-drawer-collapsed', on);
    var menu = $('[data-sg="menu"]');
    if (on) menu.setAttribute('aria-pressed', 'true');
    else menu.removeAttribute('aria-pressed');
    $$('#sg-nav .ds-drawer__item').forEach(function (item) {
      if (on) item.setAttribute('data-tip', $('.ds-drawer__label', item).textContent);
      else item.removeAttribute('data-tip');
    });
  }

  /* The offline banner in this page's panel: in and out through flip(),
     so the view glides and nothing animates a height. */
  function toggleBanner(button) {
    var panel = $('.ds-panel', app);
    var on = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(on));
    button.textContent = on ? 'Hide the offline banner' : 'Show the offline banner';
    M.flip(panel, function () {
      var banner = $('#sg-banner');
      if (!on) {
        if (banner) banner.remove();
        return;
      }
      var holder = document.createElement('div');
      holder.innerHTML = '<div class="ds-banner" id="sg-banner"><div class="ds-alert ds-alert--warning" role="status">' + icon('wifiOff', 20) +
        '<span class="ds-alert__text">You are offline. Changes are saved when the connection is back.</span><button class="ds-btn ds-btn--text ds-btn--sm" type="button" data-sg="banner-retry">Retry</button></div></div>';
      panel.insertBefore(holder.firstChild, panel.firstChild);
    }, { items: ':scope > *' });
  }

  /* Drawer and view demos (App frame). */
  var swapRun = 0;
  var swapIndex = 0;

  /* The documented swap sequence (docs/components.md, App frame): fade the
     children out, wait for that fade, replace, and let the new content
     enter in the same task; a newer swap takes over. */
  function swapView() {
    var target = $('#sg-swap-view');
    var run = swapRun += 1;
    swapIndex += 1;
    target.classList.add('ds-view--leaving');
    M.settled(target.firstElementChild, { event: 'transitionend', property: 'opacity' }).then(function () {
      if (run !== swapRun) return;
      target.innerHTML = swapPage(swapIndex);
      target.classList.remove('ds-view--leaving');
      M.enter(target.firstElementChild, 'swap');
    });
  }

  function toggleDrawer(button) {
    var drawer = $('#sg-drawer');
    var hide = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(hide));
    if (hide && app.hasAttribute('data-drawer-open')) openDrawer(false);
    // The documented recipe (docs/components.md, the same as the Motion
    // Lab's): with View Transitions the panel takes the width on the spring
    // while the drawer leaves to the left, and gives it back while the
    // drawer comes in; elsewhere the grid changes at once and the returning
    // drawer slides in through enter().
    M.transition(function () {
      if (hide) {
        app.setAttribute('data-drawer-hidden', '');
        return undefined;
      }
      app.removeAttribute('data-drawer-hidden');
      if (modal.matches) drawer.hidden = false;
      else M.enter(drawer);
      return undefined;
    });
  }

  /* ── Demo behaviours ──────────────────────────────────────────────── */

  /* The page overlays exist while they show: built on the first open,
     taken back by a second open while they close (DS.overlay continues
     the motion from where it is), and removed once DS.overlay has hidden
     them again (it drops data-state then). */
  var shownOverlays = {};

  function showOverlay(name, markup, opener, wire) {
    var overlay = shownOverlays[name];
    if (!overlay || !overlay.isConnected) {
      var holder = document.createElement('div');
      holder.innerHTML = markup;
      overlay = shownOverlays[name] = holder.firstChild;
      document.body.appendChild(overlay);
      $$('[data-sg-combo]', overlay).forEach(setupCombo);
      $$('.ds-sheet__panel', overlay).forEach(function (panel) { DS.dom.watchScrolled($('.ds-sheet__body', panel), panel); });
      // A dialog body that scrolls: the hairline on the box while it is scrolled.
      $$('.ds-dialog__body[data-sg-scrolled]', overlay).forEach(function (body) { DS.dom.watchScrolled(body, body.parentNode); });
      if (wire) wire(overlay);
      new MutationObserver(function (records, observer) {
        if (overlay.hasAttribute('data-state')) return;
        observer.disconnect();
        overlay.remove();
      }).observe(overlay, { attributes: true, attributeFilter: ['data-state'] });
    }
    return DS.overlay.open(overlay, { opener: opener });
  }

  /* Snackbars through DS.overlay.toast(): at most three, the others glide;
     an error stays until it is closed. */
  function toast(text, kind) {
    return DS.overlay.toast(toastRegion(), text, { kind: kind === true ? 'error' : kind || 'success' });
  }

  /* The region, aligned with the content panel (the drawer is beside it);
     while a side sheet has taken the region in, DS.overlay sets the edge. */
  function toastRegion() {
    var region = $('#sg-toasts');
    if (region.parentNode === document.body) region.style.setProperty('--ds-toast-left', Math.round($('.ds-panel').getBoundingClientRect().left + 24) + 'px');
    return region;
  }

  /* With undo: the action closes the message and runs once; the message
     stays until it is used or closed (DS.overlay.toast with `action`). */
  function undoToast() {
    DS.overlay.toast(toastRegion(), '3 devices deleted.', { action: { label: 'Undo', onClick: function () { toast('Restored 3 devices.'); } } });
  }

  /* Fail twice: the second error takes the first one's place (one key), so
     a retry never stacks its errors; the success clears them (closeToasts). */
  function retryToast() {
    var region = toastRegion();
    DS.overlay.toast(region, 'Could not sync. Retrying ...', { kind: 'error', key: 'sg-sync' });
    setTimeout(function () { DS.overlay.toast(region, 'Could not sync again. Check the connection.', { kind: 'error', key: 'sg-sync' }); }, slow(1200));
    setTimeout(function () {
      DS.overlay.closeToasts(region, { key: 'sg-sync' }).then(function () { toast('Synced.'); });
    }, slow(3600));
  }

  /* The page's save bar: a .ds-savebar after the view's content, shown by
     the first change of the demo form (DS.overlay.savebar()). */
  var savebarHandle = null;
  function setupSavebar() {
    var form = $('#sg-savebar-form');
    if (!form || savebarHandle) return;
    var wrapper = document.createElement('div');
    wrapper.className = 'ds-savebar';
    setHtml(wrapper, '<div class="ds-savebar__bar ds-presence" role="region" aria-label="Unsaved changes" hidden><p class="ds-savebar__text" id="sg-savebar-text"></p>' +
      '<div class="ds-savebar__actions"><button class="ds-btn ds-btn--text" type="button" data-sg-savebar="discard">Discard</button>' +
      '<button class="ds-btn ds-btn--primary" type="button" data-sg-savebar="save">' + faces('Save', 'Saving', 'Saved') + '</button></div></div>');
    $('#main').append(wrapper);
    savebarHandle = DS.overlay.savebar(wrapper, { focusTarget: function () { return $('#sg-sb-name'); } });
    var changed = {};
    var count = function () { return Object.keys(changed).length; };
    form.addEventListener('input', function (event) {
      var field = event.target;
      if (field.value === field.defaultValue) delete changed[field.id];
      else changed[field.id] = true;
      if (!count()) {
        savebarHandle.hide();
        return;
      }
      $('#sg-savebar-text').textContent = count() === 1 ? '1 unsaved change' : count() + ' unsaved changes';
      savebarHandle.show();
    });
    wrapper.addEventListener('click', function (event) {
      var button = event.target.closest('[data-sg-savebar]');
      if (!button) return;
      if (button.getAttribute('data-sg-savebar') === 'discard') {
        form.reset();
        changed = {};
        savebarHandle.hide();
        return;
      }
      M.busy(button, function () {
        return new Promise(function (resolve) { setTimeout(resolve, slow(900)); });
      }).then(function () {
        $$('input', form).forEach(function (field) { field.defaultValue = field.value; });
        changed = {};
        savebarHandle.hide();
        toast('Changes saved.');
      });
    });
  }

  /* "4 messages": an error that waits for its close button, then three
     that close by themselves; the fourth message replaces the oldest of
     those, and the others glide to make room. */
  function manyToasts() {
    var messages = [
      ['Could not reach the directory server. Owners may be out of date.', 'error'],
      ['Imported 128 devices.', 'success'],
      ['Synced LAPTOP-0042.', 'info'],
      ['Exported the list as CSV.', 'success'],
    ];
    var step = slow(250);
    messages.forEach(function (message, index) {
      setTimeout(function () { toast(message[0], message[1]); }, index * step);
    });
  }

  /*
   * The combobox demos: the page filters and chooses, DS.overlay opens
   * and closes the list (the chevron follows aria-expanded). Focus stays
   * in the field: a press in the list or on the chevron keeps it there.
   */
  function setupCombo(combo) {
    var input = $('.ds-combo__input', combo);
    var popup = $('.ds-combo__popup', combo);
    var list = $('.ds-combo__list', combo);
    var status = $('.ds-combo__status', combo);
    var options = $$('.ds-combo__option', list);
    var isOpen = function () { return input.getAttribute('aria-expanded') === 'true'; };
    var shown = function () { return options.filter(function (option) { return !option.hidden; }); };
    var activeOption = function () { return options.filter(function (option) { return option.hasAttribute('data-active'); })[0] || null; };
    var nameOf = function (option) { return $('.ds-combo__name', option).textContent; };

    function setActive(option) {
      options.forEach(function (each) { if (each !== option) each.removeAttribute('data-active'); });
      if (!option) { input.removeAttribute('aria-activedescendant'); return; }
      option.setAttribute('data-active', '');
      input.setAttribute('aria-activedescendant', option.id);
      if (isOpen()) option.scrollIntoView({ block: 'nearest' });
    }

    // Filtering never re-creates or re-hides the list: without a match the
    // list part hides and the status says so.
    function filter() {
      var query = input.value.trim().toLowerCase();
      options.forEach(function (option) { option.hidden = query !== '' && nameOf(option).toLowerCase().indexOf(query) === -1; });
      var count = shown().length;
      list.hidden = count === 0;
      status.textContent = count === 0 ? 'No model matches' : count === options.length ? options.length + ' models' : count + ' of ' + options.length + ' models';
      if (activeOption() && activeOption().hidden) setActive(null);
    }

    function open() { if (!isOpen()) DS.overlay.open(popup, { opener: input }); }
    function close() { if (isOpen()) DS.overlay.close(popup); }

    function choose(option) {
      options.forEach(function (each) { each.setAttribute('aria-selected', String(each === option)); });
      input.value = nameOf(option);
      close();
      filter();
    }

    function move(step) {
      var visible = shown();
      if (!visible.length) return;
      var index = visible.indexOf(activeOption());
      setActive(visible[index < 0 ? (step > 0 ? 0 : visible.length - 1) : (index + step + visible.length) % visible.length]);
    }

    input.addEventListener('input', function () { filter(); open(); });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!isOpen()) { open(); return; }
        move(event.key === 'ArrowDown' ? 1 : -1);
      } else if (event.key === 'Enter' && isOpen() && activeOption()) {
        event.preventDefault();
        choose(activeOption());
      }
    });
    input.addEventListener('blur', close);
    // Presses in the list and on the chevron keep focus in the field.
    [popup, $('.ds-combo__toggle', combo)].forEach(function (part) {
      part.addEventListener('mousedown', function (event) { event.preventDefault(); });
    });
    $('.ds-combo__toggle', combo).addEventListener('click', function () {
      if (isOpen()) { close(); return; }
      input.focus();
      open();
    });
    list.addEventListener('pointermove', function (event) {
      var option = event.target.closest('.ds-combo__option');
      if (option && option !== activeOption()) setActive(option);
    });
    list.addEventListener('click', function (event) {
      var option = event.target.closest('.ds-combo__option');
      if (option) choose(option);
    });
  }

  /*
   * The select-only combobox (docs/components.md, Combobox): the keys of
   * the WAI select-only pattern are the page's script; DS.overlay opens and
   * closes the list. Focus stays on the button; data-active and
   * aria-activedescendant follow the keys; blocked options are passed by.
   */
  function setupSelectCombo(combo) {
    var button = $('.ds-combo__input', combo);
    var popup = $('.ds-combo__popup', combo);
    var options = $$('.ds-combo__option', popup);
    var usable = function () { return options.filter(function (option) { return option.getAttribute('aria-disabled') !== 'true'; }); };
    var isOpen = function () { return button.getAttribute('aria-expanded') === 'true'; };
    var active = function () { return options.filter(function (option) { return option.hasAttribute('data-active'); })[0] || null; };
    var chosen = function () { return options.filter(function (option) { return option.getAttribute('aria-selected') === 'true'; })[0] || usable()[0]; };
    var typed = '';
    var typedAt = 0;

    function setActive(option) {
      options.forEach(function (each) { if (each !== option) each.removeAttribute('data-active'); });
      if (!option) { button.removeAttribute('aria-activedescendant'); return; }
      option.setAttribute('data-active', '');
      button.setAttribute('aria-activedescendant', option.id);
      option.scrollIntoView({ block: 'nearest' });
    }
    function open() {
      if (isOpen()) return;
      DS.overlay.open(popup, { opener: button });
      setActive(chosen());
    }
    function close() {
      setActive(null);
      if (isOpen()) DS.overlay.close(popup);
    }
    function choose(option) {
      if (!option || option.getAttribute('aria-disabled') === 'true') return;
      options.forEach(function (each) { each.setAttribute('aria-selected', String(each === option)); });
      $('.ds-combo__value', button).textContent = $('.ds-combo__name', option).textContent;
      $('.ds-combo__meta', button).textContent = $('.ds-combo__meta', option).textContent;
      close();
    }
    function move(step) {
      var list = usable();
      var index = list.indexOf(active());
      setActive(list[Math.max(0, Math.min(list.length - 1, index + step))]);
    }
    button.addEventListener('click', function (event) {
      if (event.detail > 1) return;
      if (isOpen()) close(); else open();
    });
    button.addEventListener('keydown', function (event) {
      var key = event.key;
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        event.preventDefault();
        if (!isOpen()) open(); else move(key === 'ArrowDown' ? 1 : -1);
      } else if ((key === 'Home' || key === 'End') && isOpen()) {
        event.preventDefault();
        var list = usable();
        setActive(key === 'Home' ? list[0] : list[list.length - 1]);
      } else if ((key === 'Enter' || key === ' ') && isOpen()) {
        event.preventDefault();
        choose(active());
      } else if (key.length === 1 && key !== ' ') {
        // Type-ahead: the next usable option whose name starts with the letters.
        var now = Date.now();
        typed = now - typedAt > M.motionDuration(button, '--ds-delay-tooltip') ? key.toLowerCase() : typed + key.toLowerCase();
        typedAt = now;
        var match = usable().filter(function (option) { return $('.ds-combo__name', option).textContent.toLowerCase().indexOf(typed) === 0; })[0];
        if (!match) return;
        open();
        setActive(match);
      }
    });
    button.addEventListener('blur', close);
    [popup, $('.ds-combo__toggle', combo)].forEach(function (part) {
      part.addEventListener('mousedown', function (event) { event.preventDefault(); });
    });
    $('.ds-combo__toggle', combo).addEventListener('click', function () {
      button.focus();
      if (isOpen()) close(); else open();
    });
    popup.addEventListener('pointermove', function (event) {
      var option = event.target.closest('.ds-combo__option');
      if (option && option.getAttribute('aria-disabled') !== 'true' && option !== active()) setActive(option);
    });
    popup.addEventListener('click', function (event) { choose(event.target.closest('.ds-combo__option')); });
  }

  /* ── The dialogs of 2.0 (docs/components.md, Dialog) ─────────────── */

  /* "Pick one of 40 people": the list filters through morphHtml inside flip; Choose waits for a choice. */
  function wirePeople(dialog) {
    var list = $('#sg-people-list', dialog);
    var search = $('#sg-people-search', dialog);
    var count = $('#sg-people-count', dialog);
    var ok = $('#sg-people-ok', dialog);
    var people = [];
    for (var i = 0; i < 40; i += 1) people.push({ id: 'p' + i, name: PEOPLE[i % PEOPLE.length] + ' ' + (Math.floor(i / PEOPLE.length) + 1) });
    var picked = '';
    function render() {
      var query = search.value.trim().toLowerCase();
      var rows = people.filter(function (person) { return person.name.toLowerCase().indexOf(query) !== -1; });
      var html = rows.length ? rows.map(function (person) {
        return '<label class="ds-check" data-ds-key="' + person.id + '"><input type="radio" name="sg-person" value="' + person.id + '"' + (person.id === picked ? ' checked' : '') + '> ' + esc(person.name) + '</label>';
      }).join('') : '<div class="ds-empty" data-ds-key="empty"><p class="ds-empty__title">Nobody matches</p><p class="ds-empty__text">Try a shorter name.</p></div>';
      var empty = !rows.length && !$('.ds-empty', list);
      M.flip(list, function () { DS.dom.morphHtml(list, html); });
      if (empty) M.enter($('.ds-empty', list), 'fade');
      count.textContent = rows.length + ' of ' + people.length + ' people';
    }
    render();
    search.addEventListener('input', render);
    list.addEventListener('change', function (event) {
      picked = event.target.value;
      ok.removeAttribute('aria-disabled');
      ok.removeAttribute('data-tip');
    });
    ok.addEventListener('click', function () {
      if (ok.getAttribute('aria-disabled') === 'true') return;
      var person = people.filter(function (each) { return each.id === picked; })[0];
      DS.overlay.close(dialog, { reason: 'confirm' });
      toast(person.name + ' owns LAPTOP-0042 now.');
    });
  }

  /* "Delete (busy)": data-ds-busy while a fake 2s request runs; it fails when the box is checked. */
  function wireWork(dialog) {
    var ok = $('#sg-work-ok', dialog);
    var cancel = $('#sg-work-cancel', dialog);
    ok.addEventListener('click', function (event) {
      if (event.detail > 1 || dialog.hasAttribute('data-ds-busy')) return;
      var fail = $('#sg-work-fail', dialog).checked;
      dialog.setAttribute('data-ds-busy', '');
      cancel.setAttribute('aria-disabled', 'true');
      cancel.setAttribute('data-tip', 'Wait until the devices are deleted');
      var settle = function () {
        dialog.removeAttribute('data-ds-busy');
        cancel.removeAttribute('aria-disabled');
        cancel.removeAttribute('data-tip');
      };
      M.busy(ok, function () {
        return new Promise(function (resolve, reject) {
          setTimeout(function () { if (fail) reject(new Error('timeout')); else resolve(); }, slow(2000));
        });
      }, { done: false }).then(function () {
        settle();
        DS.overlay.close(dialog, { reason: 'confirm' });
        toast('3 devices deleted.');
      }, function () {
        settle();
        toast('Could not delete the devices. Try again.', true);
        ok.focus();
      });
    });
    dialog.addEventListener('ds-close', function (event) { toast('Closed: ' + event.detail.reason + '.', 'info'); });
  }

  /* "Type the name to delete": the action waits for the exact name; Enter runs it. */
  function wireType(dialog) {
    var name = 'LAPTOP-0042';
    var field = $('#sg-type-field', dialog);
    var ok = $('#sg-type-ok', dialog);
    var cancel = $('#sg-type-cancel', dialog);
    var ready = function () { return field.value.trim() === name; };
    field.addEventListener('input', function () {
      ok.setAttribute('aria-disabled', String(!ready()));
      if (ready()) ok.removeAttribute('data-tip'); else ok.setAttribute('data-tip', 'Type the name first');
    });
    function run() {
      if (!ready() || dialog.hasAttribute('data-ds-busy')) return;
      dialog.setAttribute('data-ds-busy', '');
      field.readOnly = true;
      cancel.setAttribute('aria-disabled', 'true');
      M.busy(ok, function () { return new Promise(function (resolve) { setTimeout(resolve, slow(1200)); }); }, { done: false }).then(function () {
        dialog.removeAttribute('data-ds-busy');
        field.readOnly = false;
        cancel.removeAttribute('aria-disabled');
        DS.overlay.close(dialog, { reason: 'confirm' });
        toast(name + ' deleted.');
      });
    }
    field.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); run(); }
    });
    ok.addEventListener('click', function (event) { if (event.detail < 2) run(); });
  }

  /* "Filters": the subtitle counts the devices live, the foot counts the filters. */
  function wireFilters(sheet) {
    var boxes = $$('input[type="checkbox"]', sheet);
    function update() {
      var on = boxes.filter(function (box) { return box.checked; });
      var devices = on.reduce(function (sum, box) { return sum + Number(box.getAttribute('data-count')); }, 0);
      $('#sg-filters-count', sheet).textContent = devices + ' of 240 devices';
      $('#sg-filters-meta', sheet).textContent = on.length === 1 ? '1 filter' : on.length + ' filters';
      $('#sg-filters-show', sheet).textContent = 'Show ' + devices + ' devices';
    }
    update();
    sheet.addEventListener('change', update);
    $('#sg-filters-reset', sheet).addEventListener('click', function () {
      boxes.forEach(function (box) { box.checked = false; });
      update();
    });
  }

  /* The action sheet's rows say what they did. */
  function wireActions(dialog) {
    dialog.addEventListener('click', function (event) {
      var item = event.target.closest('[data-sg-item]');
      if (item) toast(item.getAttribute('data-sg-item'));
    });
  }

  /* The overflow menu: the trigger toggles it, ArrowDown and ArrowUp open
     it on the first or last item; DS.overlay does the rest. Items say what
     they did in a snackbar; the checkable one flips its check. */
  function setupMenus() {
    $$('[data-sg-menu], [data-sg-sort-menu]').forEach(function (trigger) {
      var menu = document.getElementById(trigger.getAttribute('aria-controls'));
      trigger.addEventListener('click', function (event) {
        // The second click of a double click toggles nothing.
        if (event.detail > 1) return;
        if (trigger.getAttribute('aria-expanded') === 'true') DS.overlay.close(menu);
        else DS.overlay.open(menu, { opener: trigger });
      });
      trigger.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        DS.overlay.open(menu, { opener: trigger });
      });
      menu.addEventListener('click', function (event) {
        var item = event.target.closest('.ds-menu__item');
        if (!item || item.getAttribute('aria-disabled') === 'true') return;
        if (item.getAttribute('role') === 'menuitemcheckbox') item.setAttribute('aria-checked', String(item.getAttribute('aria-checked') !== 'true'));
        // One radio of its group at a time; a checkbox item says its state at its end.
        if (item.getAttribute('role') === 'menuitemradio') {
          $$('[role="menuitemradio"]', item.closest('[role="group"]') || menu).forEach(function (each) { each.setAttribute('aria-checked', String(each === item)); });
          toast('Sorted by ' + $('.ds-menu__label', item).textContent.toLowerCase() + '.', 'info');
        }
        if (item.hasAttribute('data-sg-state')) $('.ds-menu__meta', item).textContent = item.getAttribute('aria-checked') === 'true' ? 'On' : 'Off';
        if (item.hasAttribute('data-sg-item')) toast(item.getAttribute('data-sg-item'));
      });
    });
  }

  /* The faces of a button that works (button.css): the label, the busy
     face with the small spinner, the done face with a check that draws. */
  function faces(label, busyLabel, doneLabel) {
    return '<span class="ds-btn__faces"><span class="ds-btn__face">' + esc(label) + '</span>' +
      '<span class="ds-btn__face ds-btn__face--busy" aria-hidden="true"><span class="ds-spinner ds-spinner--sm"></span>' + esc(busyLabel) + '</span>' +
      '<span class="ds-btn__face ds-btn__face--done" aria-hidden="true">' + icon('check', 16) + esc(doneLabel) + '</span></span>';
  }

  // DS.motion.busy() holds the busy face for the loader minimum and shows
  // the success face; the width never changes (the faces share one cell).
  function busy(button) {
    M.busy(button, function () {
      return new Promise(function (resolve) { setTimeout(resolve, slow(1600)); });
    }).then(function () { toast('Changes saved.'); });
  }

  // The failing twin: the busy face goes at once on the error (no success
  // face), and the page says what went wrong.
  function busyFail(button) {
    M.busy(button, function () {
      return new Promise(function (resolve, reject) {
        setTimeout(function () { reject(new Error('The sync server did not answer.')); }, slow(1600));
      });
    }).catch(function () { toast('Could not sync. Check the connection and try again.', true); });
  }

  // Copy link: the icon swaps to a drawn check for --ds-hold-success, then
  // back (DS.motion.crossfade, kind 'icon'; a press meanwhile restarts it).
  var copyTimer = 0;
  function copied(button) {
    var swap = $('.ds-icon-swap', button);
    clearTimeout(copyTimer);
    M.crossfade(swap, icon('check', 20), { kind: 'icon' });
    copyTimer = setTimeout(function () {
      M.crossfade(swap, icon('copy', 20), { kind: 'icon' });
    }, M.motionDuration(button, '--ds-hold-success'));
  }

  function setupDemos() {
    document.addEventListener('click', function (event) {
      var el = event.target.closest('[data-sg]');
      if (!el) return;
      var action = el.getAttribute('data-sg');
      if (action === 'dialog') showOverlay('dialog', nativeDialogMarkup('sg-dialog', 'Delete 3 devices?', 'They disappear from every list. This cannot be undone.', 'Delete devices'), el);
      if (action === 'dialog-div') showOverlay('dialog-div', divDialogMarkup(), el);
      if (action === 'dialog-combo') showOverlay('dialog-combo', comboDialogMarkup(), el);
      if (action === 'dialog-nested') showOverlay('dialog-nested', nativeDialogMarkup('sg-dialog-nested', 'Retire LAPTOP-0042?', 'It leaves the active lists; its history stays.', 'Retire device'), el);
      if (action === 'sheet') showOverlay('sheet', sheetMarkup(false), el);
      if (action === 'dialog-long') showOverlay('dialog-long', longDialogMarkup(), el);
      if (action === 'dialog-people') showOverlay('dialog-people', peopleDialogMarkup(), el, wirePeople);
      if (action === 'dialog-work') showOverlay('dialog-work', workDialogMarkup(), el, wireWork);
      if (action === 'dialog-type') showOverlay('dialog-type', typeDialogMarkup(), el, wireType);
      if (action === 'dialog-full') showOverlay('dialog-full', fullDialogMarkup(), el);
      if (action === 'dialog-actions') showOverlay('dialog-actions', actionsDialogMarkup(), el, wireActions);
      if (action === 'sheet-filters') showOverlay('sheet-filters', filtersSheetMarkup(), el, wireFilters);
      if (action === 'dialog-confirm') {
        DS.overlay.confirm({
          title: 'Archive 3 devices?', text: 'They leave the active lists and stay in the archive for a year.',
          confirmLabel: 'Archive devices', destructive: true, opener: el,
          onConfirm: function () { return new Promise(function (resolve) { setTimeout(resolve, slow(1200)); }); },
        }).then(function (yes) { toast(yes ? '3 devices archived.' : 'Nothing archived.', yes ? 'success' : 'info'); });
      }
      if (action === 'dialog-prompt') {
        DS.overlay.prompt({ title: 'Rename the device', label: 'Name', value: 'LAPTOP-0042', confirmLabel: 'Rename', opener: el, input: { autocomplete: 'off', required: true } })
          .then(function (value) { if (value !== null) toast('Renamed to ' + value + '.'); });
      }
      if (action === 'toast') toast('Saved. The record is visible to everyone now.');
      if (action === 'toast-error') toast('Could not save. Check the connection and try again.', true);
      if (action === 'toast-many') manyToasts();
      if (action === 'toast-undo') undoToast();
      if (action === 'toast-retry') retryToast();
      if (action === 'busy') busy(el);
      if (action === 'busy-fail') busyFail(el);
      if (action === 'copy') copied(el);
      if (action === 'figures') refreshFigures();
      if (action === 'status-poll') togglePoll(el);
      if (action === 'alert-insert') insertAlert();
      if (action === 'alert-dismiss') dismissAlert(el);
      if (action === 'item-return') returnItem(el);
      if (action === 'items-restore') restoreItems();
      if (action === 'stale-fast') refreshStale(150);
      if (action === 'stale-slow') refreshStale(1200);
      if (action === 'card-open' || action === 'tile-open') {
        event.preventDefault();
        toast('Opened ' + (el.getAttribute('data-name') || 'the overdue devices') + '.', 'info');
      }
      if (action === 'card-restart') toast('Restarting LAPTOP-0017.', 'info');
      if (action === 'expand') el.setAttribute('aria-expanded', String(el.getAttribute('aria-expanded') !== 'true'));
      if (action === 'touch') {
        el.setAttribute('aria-pressed', String(el.getAttribute('aria-pressed') !== 'true'));
        document.documentElement.classList.toggle('ds-touch', el.getAttribute('aria-pressed') === 'true');
      }
      if (action === 'vote' && el.getAttribute('aria-disabled') !== 'true') {
        $$('[data-sg="vote"]', $('#sg-vote')).forEach(function (button) {
          button.setAttribute('aria-pressed', String(button === el));
          button.setAttribute('aria-disabled', 'true');
        });
      }
      if (action === 'vote-reset') {
        $$('[data-sg="vote"]', $('#sg-vote')).forEach(function (button) {
          button.setAttribute('aria-pressed', 'false');
          button.removeAttribute('aria-disabled');
        });
      }
      if (action === 'badge-add' || action === 'badge-clear') countBadge(action === 'badge-add');
      if (action === 'filter-tile') {
        $$('[data-sg="filter-tile"]', $('#sg-filter-tiles')).forEach(function (tile) { tile.setAttribute('aria-pressed', String(tile === el && el.getAttribute('aria-pressed') !== 'true')); });
      }
      if (action === 'plan') {
        $$('[data-sg="plan"]', $('#sg-plans')).forEach(function (plan) { plan.setAttribute('aria-pressed', String(plan === el)); });
      }
      if (action === 'done-replay') DS.dom.morphHtml($('#sg-done'), '');
      if (action === 'done-replay') DS.dom.morphHtml($('#sg-done'), doneHtml());
      if (action === 'press-row') toast('Opened ' + el.firstChild.textContent.trim() + '.', 'info');
      if (action === 'chip-remove') removeChip(el);
      if (action === 'chips-restore') DS.dom.morphHtml($('#sg-input-chips'), inputChipsHtml());
      if (action === 'suggest') toast('Applied: ' + el.textContent.trim() + '.', 'info');
      if (action === 'fill-icons') {
        el.setAttribute('aria-pressed', String(el.getAttribute('aria-pressed') !== 'true'));
        $$('.sg-icon--fillable svg', $('#sg-icons')).forEach(function (svg) { svg.classList.toggle('ds-icon--filled', el.getAttribute('aria-pressed') === 'true'); });
      }
      if (action.indexOf('ls-') === 0) listsAction(action, el, event);
      if (action === 'table-sort' || action === 'row-toggle' || action === 'row-open' || action === 'table-live') tableAction(action, el);
      if (action === 'progress-run') progressRun();
      if (action === 'skeleton') skeletonDemo(el);
      if (action === 'load') loadDemo(Number(el.getAttribute('data-ms')));
      if (action === 'drawer-toggle') toggleDrawer(el);
      if (action === 'rail-toggle') toggleRail(el);
      if (action === 'banner-toggle') toggleBanner(el);
      if (action === 'banner-retry') toast('Still offline. Trying again in a minute.', 'info');
      if (action === 'steps-next') step(1);
      if (action === 'steps-back') step(-1);
      if (action === 'swap-view') swapView();
      if (action === 'toggle' || action === 'dense') el.setAttribute('aria-pressed', String(el.getAttribute('aria-pressed') !== 'true'));
      if (action === 'dense') $('#sg-table').classList.toggle('ds-table--dense', el.getAttribute('aria-pressed') === 'true');
      if (action === 'progress') {
        var p = $('#sg-progress');
        var value = Math.min(1, (parseFloat(p.style.getPropertyValue('--ds-progress')) || 0) + 0.2);
        if (value >= 1 && parseFloat(p.style.getPropertyValue('--ds-progress')) >= 1) value = 0.1;
        p.style.setProperty('--ds-progress', String(value));
        $('.ds-progress__track', p).setAttribute('aria-valuenow', String(Math.round(value * 100)));
        $('.ds-progress__label', p).textContent = Math.round(value * 100) + '%';
        $('.ds-progress__detail', p).textContent = Math.round(value * 2030).toLocaleString('en-US') + ' of 2,030 rows';
      }
    });
    // The table filter: a user action, so every keystroke glides at once.
    $('#sg-table-filter').addEventListener('input', function (event) {
      TABLE.filter = event.target.value;
      renderTable();
    });
    document.addEventListener('change', function (event) {
      var input = event.target;
      if (input.getAttribute('data-sg') === 'switch') $('.ds-switch__state', input.parentNode).textContent = input.checked ? 'On' : 'Off';
      // Select all changes every row in the same frame (no stagger).
      if (input.getAttribute('data-sg') === 'select-all') {
        $$('[data-sg="select-row"]').forEach(function (row) {
          row.checked = input.checked;
          TABLE.selected[row.closest('tr').getAttribute('data-ds-key')] = input.checked;
        });
      }
      if (input.getAttribute('data-sg') === 'select-row') {
        TABLE.selected[input.closest('tr').getAttribute('data-ds-key')] = input.checked;
        syncSelectAll();
      }
    });
    // The ticket field: checked on every keystroke, the message only
    // changes when the verdict does (so it fades in once).
    $('#sg-ticket').addEventListener('input', function (event) {
      var field = event.target;
      var wrong = field.value.trim() !== '' && !/^\d{5}$/.test(field.value.trim());
      if (wrong === (field.getAttribute('aria-invalid') === 'true')) return;
      if (wrong) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
      $('#sg-ticket-error').innerHTML = wrong ? icon('alertCircle', 16) + 'A ticket number has five digits.' : '';
    });
    // The mixed state exists only as a property.
    $$('[data-sg="indeterminate"]').forEach(function (input) { input.indeterminate = true; });
    syncSelectAll();
    // Every [data-tip] of the page: delay, warm-up along a toolbar,
    // hoverable, Escape (DS.overlay.tooltips creates its own tooltip).
    DS.overlay.tooltips(document);
    $$('#sg-page [data-sg-combo]').forEach(setupCombo);
    $$('#sg-page [data-sg-select]').forEach(setupSelectCombo);
    $$('#sg-page .ds-dialog__body[data-sg-scrolled]').forEach(function (body) { DS.dom.watchScrolled(body, body.parentNode); });
    setupMenus();
    setupFiles();
    setupForms();
    setupSavebar();
  }

  /* Files and reordering (2.0): DS.dom.dropzone() names what it took,
     DS.motion.sortable() what order the rows are in. */
  function setupFiles() {
    var out = $('#sg-dropzone-out');
    var names = function (files) { return files.map(function (file) { return file.name; }).join(', '); };
    DS.dom.dropzone($('#sg-dropzone'), { paste: true, onFiles: function (files) { out.textContent = 'Added ' + names(files) + '.'; } });
    var list = $('#sg-sortable');
    DS.motion.sortable(list, {
      onChange: function (order) {
        $('#sg-sortable-out').textContent = 'Order: ' + order.map(function (row) { return Number(row.getAttribute('data-ds-key').slice(5)) + 1; }).join(', ');
      },
    });
  }

  /* The inbox badge: it pops in when a count appears and out when it goes; the number changes at once. */
  var badgeCount = 3;

  function countBadge(add) {
    var badge = $('#sg-badge');
    var shown = !badge.hidden;
    badgeCount = add ? badgeCount + 1 : 0;
    if (badgeCount) badge.textContent = String(badgeCount);
    if (badgeCount && !shown) {
      badge.hidden = false;
      M.enter(badge, 'pop');
    } else if (!badgeCount && shown) {
      M.leave(badge, 'pop', { then: 'hide' });
    }
  }

  /* An input chip removes its filter: the chips after it glide into its place, focus goes to a neighbour. */
  function removeChip(chip) {
    var row = chip.parentNode;
    var next = chip.nextElementSibling || chip.previousElementSibling;
    if (next) next.focus();
    else $('[data-sg="chips-restore"]').focus();
    M.flip(row, function () { chip.remove(); });
  }

  /* The header checkbox of the table: checked, mixed or empty by its shown rows. */
  function syncSelectAll() {
    var rows = tableShown();
    var checked = rows.filter(function (row) { return TABLE.selected[row.id]; }).length;
    var all = $('[data-sg="select-all"]');
    all.checked = rows.length > 0 && checked === rows.length;
    all.indeterminate = checked > 0 && checked < rows.length;
  }

  /* Counts every tile to its data-count, from the value it shows (0 on the first render). */
  function countTiles() {
    $$('.ds-tile__value[data-count]').forEach(function (el) {
      var suffix = el.getAttribute('data-suffix') || '';
      M.countUp(el, Number(el.getAttribute('data-count')), {
        format: function (value) { return Math.round(value).toLocaleString('en-US') + suffix; },
      });
    });
  }

  /* ── Themes ───────────────────────────────────────────────────────── */

  var PRESETS = {
    square: '.ds-theme {\n  --ds-radius-xs: 0; --ds-radius-sm: 0; --ds-radius-md: 0; --ds-radius-lg: 0; --ds-radius-xl: 0; --ds-radius-2xl: 0;\n  --ds-radius-chip: 9999px;\n  --ds-elev-hover: none; --ds-elev-overlay: none;\n  --ds-dialog-border: 1px solid var(--ds-line);\n  --ds-backdrop: #ffffff; --ds-surface-low: #f6f6f6; --ds-surface-high: #f0f0f0;\n  --ds-text: #000000; --ds-primary: #202124; --ds-accent: #e8eaed; --ds-on-accent: #000000;\n  --ds-link-underline: rgba(0, 0, 0, .35);\n  --ds-alert-edge: 4px;\n}',
    dim: '.ds-theme {\n  --ds-disabled-opacity: var(--ds-state-disabled); --ds-disabled-fill: initial; --ds-disabled-ink: initial;\n}',
  };

  /* Theme files, as [href, media] for the two theme links: the template
     and the shipped themes of dist/themes/. "System" loads dark and
     contrast for the media that ask for them, as a project does. */
  var THEME_FILES = {
    example: [['../themes/example.css', '']],
    dark: [['../dist/themes/dark.css', '']],
    compact: [['../dist/themes/compact.css', '']],
    contrast: [['../dist/themes/contrast.css', '']],
    system: [['../dist/themes/dark.css', '(prefers-color-scheme: dark)'], ['../dist/themes/contrast.css', '(prefers-contrast: more)']],
  };

  /* Counts theme changes: a slow load that a newer choice overtook still
     calls its `done`, but never updates or marks the page. */
  var themeRun = 0;

  /* Once a theme's rules apply: refresh the shown values, re-place the
     indicators, then mark the theme for the tests. */
  function afterThemeChange(value) {
    readValues();
    if (value !== 'file') themeSource = null;
    renderThemeCheck(themeSource);
    indicators.forEach(function (made) { made.update(); });
    document.documentElement.setAttribute('data-sg-theme', value);
  }

  /* The text of a theme loaded with "Load theme file ...", for the theme check. */
  var themeSource = null;

  /* Calls back once the theme link has its sheet: at once when the href is
     unchanged and the sheet is there (no load event follows), otherwise on
     the link's load or error event. */
  function whenLinkLoaded(link, href, callback) {
    if (link.href === new URL(href, document.baseURI).href && link.sheet) { callback(); return; }
    var finish = function () {
      link.removeEventListener('load', finish);
      link.removeEventListener('error', finish);
      callback();
    };
    link.addEventListener('load', finish);
    link.addEventListener('error', finish);
    link.href = href;
  }

  /* Swaps the theme in one step: inside DS.motion.transition() as a
     fade-through (View Transitions; elsewhere the view fades through with
     .ds-enter--swap), or at once (`instant`, the saved theme on load).
     Calls `then` once the swap and its motion are done. */
  function swapTheme(apply, instant, then) {
    if (instant) { apply(); requestAnimationFrame(then); return; }
    M.transition(apply, { type: 'fade-through' }).then(then, then);
  }

  /* Applies a theme (a value of the select), then calls `done`. Theme
     files load first, their links on media "not all" (a disabled link
     would not load at all); only then does the page switch, in one step,
     and afterThemeChange() re-places the indicators. */
  function applyTheme(value, done, instant) {
    var links = [$('#sg-theme-link'), $('#sg-theme-link-2')];
    var style = $('#sg-theme-style');
    var files = THEME_FILES[value] || [];
    var run = themeRun += 1;
    var finish = function () {
      if (run === themeRun) afterThemeChange(value);
      if (done) done();
    };
    var apply = function () {
      if (run !== themeRun) return;          // a newer choice took over
      style.textContent = PRESETS[value] || '';
      links.forEach(function (link, i) {
        link.media = files[i] ? files[i][1] : '';
        link.disabled = !files[i];
      });
    };
    try { localStorage.setItem('ds-styleguide-theme', value === 'file' ? 'default' : value); } catch (e) { /* storage may be blocked */ }
    if (!files.length) { swapTheme(apply, instant, finish); return; }
    var waiting = files.length;
    files.forEach(function (entry, i) {
      var link = links[i];
      if (link.disabled) link.media = 'not all';
      link.disabled = false;
      whenLinkLoaded(link, entry[0], function () {
        waiting -= 1;
        if (waiting) return;
        if (run !== themeRun) { if (done) done(); return; }
        swapTheme(apply, instant, finish);
      });
    });
  }

  /* Wires the switcher and applies the saved theme, then calls `done`. */
  function setupThemes(done) {
    var select = $('#sg-theme-select');
    var file = $('#sg-theme-file');
    var saved = 'default';
    try { saved = localStorage.getItem('ds-styleguide-theme') || 'default'; } catch (e) { saved = 'default'; }
    select.addEventListener('change', function () {
      if (select.value === 'file') { file.click(); return; }
      applyTheme(select.value);
    });
    file.addEventListener('change', function () {
      var chosen = file.files && file.files[0];
      if (!chosen) { select.value = 'default'; applyTheme('default'); return; }
      var reader = new FileReader();
      reader.onload = function () {
        var run = themeRun += 1;
        swapTheme(function () {
          if (run !== themeRun) return;
          $('#sg-theme-link').disabled = true;
          $('#sg-theme-link-2').disabled = true;
          themeSource = String(reader.result);
          $('#sg-theme-style').textContent = themeSource;
        }, false, function () { if (run === themeRun) afterThemeChange('file'); });
        toast('Theme loaded: ' + chosen.name);
      };
      reader.readAsText(chosen);
    });
    if (saved !== 'default' && saved !== 'file') {
      select.value = saved;
      applyTheme(saved, done, true);
    } else {
      renderThemeCheck(null);
      done();
    }
  }

  // Tests wait for data-sg-ready instead of racing the first stagger: it
  // comes once the themes are set up and, in the lab, the demos too.
  var waiting = PAGE === 'lab' ? 2 : 1;
  var started = function () {
    waiting -= 1;
    if (!waiting) document.documentElement.setAttribute('data-sg-ready', '');
  };
  render();
  // Every action gets the pointer ripple (and iOS its :active feedback).
  DS.ripple.attach(document);
  setupNavigation();
  setupSpeed();
  if (PAGE === 'lab') startLab(started);
  else setupDemos();
  setupThemes(started);
  // First render: the sections in view stagger in once (the lab's demos
  // join when they come), and the key figures of the styleguide count up
  // from 0.
  M.staggerOnce($('#sg-page'));
  if (PAGE === 'index') countTiles();
  // The charts fill from zero once, on the first render (.ds-enter--fill).
  if (PAGE === 'index') M.enterAll(chartMarks(), 'fill', { stagger: false });
  if (PAGE === 'index' && location.hash && $(location.hash)) $(location.hash).scrollIntoView();
}());
