/*
 * The 3.0 styleguide (index.html): a page per component, generated from
 * the demos that src/components/<n>/<n>.demo.js register through SG.demo()
 * (sg-core.js, demos.js) and from the registry of the meta.json files
 * (registry.js), plus the foundation pages, a search, the "Which component
 * for which need" overview and the theme generator. A classic script on
 * top of dist/ds.js, so the page runs from disk, the theme generator
 * included (theme-generator.js, generated from scripts/tools/).
 *
 * Routes (the hash): #/ overview · #/needs · #/components/<n> · #/colour ·
 * #/type · #/shape · #/elevation · #/motion · #/icons · #/tokens[?q=] ·
 * #/theme · #/search?q=<text>. The 2.x sections stay on legacy.html until
 * every component is ported (plans/3.0-conventions.md, section 7).
 *
 * Hooks for the browser tests (test/browser/styleguide-v3.spec.js),
 * harmless when opened by hand:
 *   html[data-sg-ready]   set once the first page, the navigation and the
 *                         theme are in place
 *   html[data-sg-route]   the route last rendered (its motion may still run)
 *   html[data-sg-theme]   "<preset>[-contrast] <scheme>", once that theme applies
 *   ?speed=0.1            slow motion, as on legacy.html and the Motion Lab
 *   #sg-stage             the stage around a demo: a .ds-theme with the
 *                         options' classes and data-ds-scheme
 */
(function () {
  'use strict';

  var DS = window.DS;
  var SG = window.SG;
  var I = DS.icons;
  var M = DS.motion;
  var REG = window.SG_REGISTRY || { groups: [], components: [], tokens: [] };
  var icon = function (name, size, cls) { return I.icon(I[name], size || 20, cls); };
  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  var esc = function (text) { return String(text).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var html = document.documentElement;

  /* ── Slow motion: the speed select and ?speed=<factor> (as legacy.html) ── */

  var SPEEDS = [1, 0.5, 0.25, 0.1];
  var SPEED_KEY = 'ds-styleguide-speed';
  var speed = 1;

  function applySpeed(factor) {
    speed = factor;
    if (factor < 1) {
      html.setAttribute('data-sg-speed', String(factor));
      html.style.setProperty('--ds-time-scale', String(1 / factor));
    } else {
      html.removeAttribute('data-sg-speed');
      html.style.removeProperty('--ds-time-scale');
    }
  }

  (function initialSpeed() {
    var asked = Number(new URLSearchParams(location.search).get('speed'));
    var stored = 1;
    try { stored = Number(localStorage.getItem(SPEED_KEY)); } catch (e) { stored = 1; /* storage may be blocked */ }
    applySpeed(asked > 0 && asked <= 1 ? asked : SPEEDS.indexOf(stored) !== -1 ? stored : 1);
  }());

  function setupSpeed() {
    var select = $('#sg-speed-select');
    if (SPEEDS.indexOf(speed) === -1) {
      var option = document.createElement('option');
      option.value = String(speed);
      option.textContent = speed + '×';
      select.appendChild(option);
    }
    select.value = String(speed);
    var readout = function () {
      var out = $('#sg-speed-readout');
      out.hidden = speed >= 1;
      out.textContent = 'Slow motion ' + speed + '×';
    };
    readout();
    select.addEventListener('change', function () {
      applySpeed(Number(select.value));
      try { localStorage.setItem(SPEED_KEY, String(speed)); } catch (e) { /* storage may be blocked */ }
      readout();
    });
  }

  /* ── Theme: preset, contrast and colour scheme, for the whole page ───── */

  /*
   * The shipped presets (dist/themes/presets/<name>[-contrast].css) are
   * light-dark() themes: one file serves both schemes, and data-ds-scheme
   * on a .ds-theme pins one. The head of index.html applies the stored
   * choice before the first paint; this keeps it in step.
   */
  var PRESETS = ['default', 'slate', 'ocean', 'forest', 'violet', 'amber', 'rose', 'graphite'];
  var THEME_KEY = 'ds-sg3-theme';
  var theme = (function () {
    var stored = {};
    try { stored = JSON.parse(localStorage.getItem(THEME_KEY) || '{}') || {}; } catch (e) { stored = {}; }
    return {
      preset: PRESETS.indexOf(stored.preset) >= 0 ? stored.preset : 'default',
      contrast: stored.contrast === true,
      scheme: ['light', 'dark', 'auto'].indexOf(stored.scheme) >= 0 ? stored.scheme : 'auto',
    };
  }());
  /** The stylesheet of the theme generator while "Use in the styleguide" is on, or a loaded theme file (not stored). */
  var generated = null;
  /** The text of a theme loaded with "Load theme file ...", for the checks only a file can show. */
  var loadedSource = null;

  function presetHref(t) { return '../dist/themes/presets/' + t.preset + (t.contrast ? '-contrast' : '') + '.css'; }
  function themeName() { return (loadedSource ? 'file' : generated ? 'generated' : theme.preset + (theme.contrast ? '-contrast' : '')) + ' ' + theme.scheme; }

  function applyScheme(target) {
    if (theme.scheme === 'auto') target.removeAttribute('data-ds-scheme');
    else target.setAttribute('data-ds-scheme', theme.scheme);
  }

  /* Loads the new preset on the spare link (media "not all" until it has
     loaded), then swaps the links in one step, so the page never shows
     the system's defaults in between. */
  var themeRun = 0;
  function applyTheme(done) {
    var run = themeRun += 1;
    try { localStorage.setItem(THEME_KEY, JSON.stringify(theme)); } catch (e) { /* storage may be blocked */ }
    var links = [$('#sg-preset'), $('#sg-preset-2')];
    var live = links[0].disabled ? links[1] : links[0];
    var spare = live === links[0] ? links[1] : links[0];
    var href = presetHref(theme);
    var finish = function () {
      if (run !== themeRun) return;
      applyScheme(html);
      var stage = $('#sg-stage');
      if (stage && stageHandle) stageHandle.update({ scheme: theme.scheme });
      $('#sg-generated').textContent = generated || '';
      html.setAttribute('data-sg-theme', themeName());
      afterTheme();
      if (done) done();
    };
    if (live.getAttribute('href') === href && !live.disabled) { finish(); return; }
    spare.media = 'not all';
    spare.disabled = false;
    var loaded = function () {
      spare.removeEventListener('load', loaded);
      spare.removeEventListener('error', loaded);
      if (run !== themeRun) return;
      spare.media = '';
      live.disabled = true;
      finish();
    };
    spare.addEventListener('load', loaded);
    spare.addEventListener('error', loaded);
    spare.setAttribute('href', href);
  }

  /* What depends on the theme's values: the colour page's values and its check, the indicators. */
  function afterTheme() {
    readValues();
    renderThemeCheck();
    indicators.forEach(function (made) { made.handle.update(); });
  }

  /* ── Groups and components ─────────────────────────────────────────── */

  var GROUPS = {
    layout: ['Layout', 'layoutGrid'],
    actions: ['Actions', 'plus'],
    forms: ['Forms and inputs', 'pencil'],
    data: ['Data display', 'table'],
    feedback: ['Feedback', 'alertCircle'],
    overlays: ['Overlays', 'copy'],
    navigation: ['Navigation', 'menu'],
    content: ['Content', 'fileText'],
    motion: ['Motion', 'sparkles'],
  };

  function groupTitle(group) {
    return GROUPS[group] ? GROUPS[group][0] : String(group || 'Other').replace(/^\w/, function (c) { return c.toUpperCase(); });
  }
  function groupIcon(group) { return GROUPS[group] ? GROUPS[group][1] : 'apps'; }
  function titleOf(name) { return name.replace(/-/g, ' ').replace(/^\w/, function (c) { return c.toUpperCase(); }); }

  /*
   * Where each 2.x component shows on legacy.html until its demo is
   * ported (a section of styleguide.js). Goes with legacy.html.
   */
  var LEGACY = {
    button: 'buttons', status: 'status', alert: 'status', badge: 'status', empty: 'cards', card: 'cards', list: 'cards',
    tile: 'cards', timeline: 'cards', tasks: 'cards', disclosure: 'cards', prose: 'cards', table: 'table', pagination: 'table',
    form: 'forms', slider: 'forms', drag: 'forms', savebar: 'forms', chip: 'selection', switch: 'selection', combobox: 'selection',
    dialog: 'overlays', sheet: 'overlays', menu: 'overlays', toast: 'overlays', tooltip: 'overlays', loading: 'loading',
    loader: 'loading', spinner: 'loading', progress: 'loading', chart: 'charts', shell: 'frame', tabs: 'frame', steps: 'frame',
    page: 'frame', scroller: 'frame', utilities: 'frame', ripple: 'motion', indicator: 'motion',
  };

  /** Every component: the registry's (meta.json) joined with its demo, in group and meta.json order. */
  var COMPONENTS = (function () {
    var byName = {};
    var list = REG.components.map(function (entry) {
      var spec = SG.get(entry.name);
      var item = {
        name: entry.name, group: entry.group || (spec && spec.group), order: entry.order, title: spec ? spec.title : titleOf(entry.name),
        need: entry.need || (spec && spec.need) || '', tier: entry.tier || null, status: entry.status || null,
        classes: entry.classes || [], hooks: entry.hooks || [], attributes: entry.attributes || [], docs: entry.docs || null, spec: spec,
      };
      byName[item.name] = item;
      return item;
    });
    // A demo whose folder the registry does not know yet (registry.js not rebuilt).
    SG.list().forEach(function (spec) {
      if (byName[spec.name]) return;
      var item = { name: spec.name, group: spec.group, order: 9999, title: spec.title, need: spec.need || '', tier: null, status: null, classes: [], hooks: [], attributes: [], spec: spec };
      byName[item.name] = item;
      list.push(item);
    });
    var groups = Object.keys(GROUPS).concat(REG.groups || []);
    var rank = function (group) { var at = groups.indexOf(group); return at < 0 ? groups.length : at; };
    list.sort(function (a, b) { return rank(a.group) - rank(b.group) || a.order - b.order || a.name.localeCompare(b.name); });
    return list;
  }());
  var DEMOED = COMPONENTS.filter(function (c) { return c.spec; });
  function component(name) { return COMPONENTS.filter(function (c) { return c.name === name; })[0] || null; }

  /* ── Pages ─────────────────────────────────────────────────────────── */

  /** The foundation pages, in drawer order: [route, title, icon]. */
  var FOUNDATIONS = [['colour', 'Colour', 'palette'], ['type', 'Type', 'fileText'], ['shape', 'Space and shape', 'columns'], ['elevation', 'Elevation', 'layers'],
    ['motion', 'Motion', 'sparkles'], ['icons', 'Icons', 'apps'], ['tokens', 'Tokens', 'braces'], ['theme', 'Theme generator', 'wand']];

  function head(title, lead, extra) {
    return '<header class="ds-page-head"><h1 class="ds-page-head__title" tabindex="-1">' + title + '</h1>' +
      (lead ? '<p class="ds-page-head__lead">' + lead + '</p>' : '') + (extra || '') + '</header>';
  }

  function card(title, body, extra) {
    return '<section class="ds-card"' + (extra || '') + '>' + (title ? '<h2 class="ds-card__title">' + title + '</h2>' : '') + body + '</section>';
  }

  function tile(name, value, glyph, note) {
    return '<div class="ds-tile"><p class="ds-tile__label">' + icon(glyph, 20) + '<span>' + name + '</span></p><p class="ds-tile__value">' + value + '</p><p class="ds-tile__note">' + note + '</p></div>';
  }

  function glyphs() {
    return Object.keys(I).filter(function (name) { return typeof I[name] === 'string' && I[name].charAt(0) === '<'; });
  }

  function componentHref(c) { return c.spec ? '#/components/' + c.name : 'legacy.html' + (LEGACY[c.name] ? '#' + LEGACY[c.name] : ''); }

  function statusTag(c) {
    return c.spec ? '<span class="ds-tag">3.0 demo</span>' : '<span class="ds-tag ds-tag--neutral">2.x section</span>';
  }

  /* Overview */
  function overviewPage() {
    var groups = groupsOf(COMPONENTS);
    return '<section class="sg-hero" aria-labelledby="sg-hero-title"><h1 id="sg-hero-title" tabindex="-1">Dashboard-Style ' + esc(DS.version) + '</h1>' +
      '<p>A calm, themeable design system for admin dashboards. Every component on its own page with every option: size, density, shape, tone, variant, colour scheme, contrast, theme preset and touch, at any width.</p>' +
      '<div class="sg-row"><a class="ds-btn ds-btn--filled" href="#/needs">Which component for which need</a><a class="ds-btn" href="#/theme">' + icon('wand', 18) + 'Theme generator</a><a class="ds-btn ds-btn--text" href="motion.html">Motion Lab ' + icon('arrowRight', 16) + '</a></div></section>' +
      '<div class="ds-tiles">' + tile('Components', String(COMPONENTS.length), 'apps', DEMOED.length + ' with a 3.0 demo') + tile('Tokens', String(REG.tokens.length), 'braces', 'roles, scales and seeds') +
      tile('Icons', String(glyphs().length), 'image', 'outline, 24px grid') + tile('Dependencies', '0', 'box', 'plain CSS and JS') + '</div>' +
      '<div class="sg-group-grid">' + groups.map(function (group) {
        return '<section class="ds-card" aria-labelledby="sg-g-' + group.id + '"><h2 class="ds-card__title sg-card-title" id="sg-g-' + group.id + '">' + icon(groupIcon(group.id), 20) + '<span>' + esc(groupTitle(group.id)) + '</span></h2>' +
          '<ul class="sg-links">' + group.items.map(function (c) {
            return '<li><a href="' + componentHref(c) + '">' + esc(c.title) + '</a>' + (c.spec ? '' : ' <span class="ds-meta">2.x</span>') + '</li>';
          }).join('') + '</ul></section>';
      }).join('') + '</div>' +
      '<div class="ds-alert sg-note" role="note">' + icon('info', 20) + '<span class="ds-alert__text"><strong>Porting in progress.</strong> Components without a 3.0 demo link to their section on the <a href="legacy.html">2.x styleguide</a>, which phase 1 retires once every component has moved into its folder.</span></div>';
  }

  function groupsOf(list) {
    var out = [];
    list.forEach(function (c) {
      var last = out[out.length - 1];
      if (!last || last.id !== c.group) out.push(last = { id: c.group, items: [] });
      last.items.push(c);
    });
    return out;
  }

  /* Which component for which need */
  /*
   * The rows: each component's own need line (meta.json, else its demo),
   * then the rows of the 2.x table of docs/components.md (registry.js),
   * each naming the component it points to.
   */
  function needRows() {
    var rows = [];
    COMPONENTS.forEach(function (c) { if (c.need) rows.push({ need: c.need, c: c }); });
    (REG.needs || []).forEach(function (pair) {
      var c = component(pair[1]);
      if (c && pair[0] !== c.need) rows.push({ need: pair[0], c: c });
    });
    return rows;
  }

  function needsPage() {
    var rows = needRows();
    return head('Which component for which need', 'Find the need, then open its component. Rows of a component without a 3.0 demo yet open its section of the 2.x styleguide.') +
      '<section class="ds-card" aria-labelledby="sg-needs-title"><h2 class="ds-sr" id="sg-needs-title">Needs</h2><div class="ds-toolbar sg-filter"><div class="ds-search">' + icon('search', 20) +
      '<input class="ds-input" id="sg-need-filter" type="search" aria-label="Filter needs" placeholder="Filter: a need, a component, a group"></div><span class="ds-meta" id="sg-need-count" aria-live="polite">' + rows.length + ' needs</span></div>' +
      '<div class="ds-table-wrap" tabindex="0" role="region" aria-label="Components by need"><table class="ds-table">' +
      '<thead><tr><th scope="col">Need</th><th scope="col">Component</th><th scope="col" class="ds-col--secondary">Group</th><th scope="col" class="ds-col--secondary">Demo</th></tr></thead><tbody>' +
      rows.map(function (row) {
        var c = row.c;
        return '<tr data-sg-need="' + c.name + '" data-sg-text="' + esc((row.need + ' ' + c.title + ' ' + c.name + ' ' + groupTitle(c.group)).toLowerCase()) + '"><td class="ds-col--text">' + esc(row.need) + '</td>' +
          '<td><a href="' + componentHref(c) + '">' + esc(c.title) + '</a></td><td class="ds-col--secondary">' + esc(groupTitle(c.group)) + '</td><td class="ds-col--secondary">' + statusTag(c) + '</td></tr>';
      }).join('') + '</tbody></table></div></section>';
  }

  function wireNeeds(page) {
    var filter = $('#sg-need-filter', page);
    filter.addEventListener('input', function () {
      var words = filter.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      var shown = 0;
      $$('tbody tr', page).forEach(function (row) {
        var text = row.getAttribute('data-sg-text');
        row.hidden = !words.every(function (w) { return text.indexOf(w) >= 0; });
        if (!row.hidden) shown += 1;
      });
      $('#sg-need-count', page).textContent = shown + ' needs';
    });
  }

  /* Component page */
  function componentPage(c) {
    var spec = c.spec;
    var links = '<div class="sg-row sg-row--meta">' + '<span class="ds-tag ds-tag--neutral">' + icon(groupIcon(c.group), 16) + esc(groupTitle(c.group)) + '</span>' +
      (c.tier ? '<span class="ds-tag ds-tag--neutral">Tier ' + esc(c.tier) + '</span>' : '') + (c.status ? '<span class="ds-tag ds-tag--neutral">' + esc(cap(c.status)) + '</span>' : '') + statusTag(c) +
      '<a class="ds-btn ds-btn--text ds-sm" href="../docs/components.md' + (c.docs ? '#' + c.docs : '') + '">' + icon('fileText', 16) + 'Docs</a>' +
      (LEGACY[c.name] ? '<a class="ds-btn ds-btn--text ds-sm" href="legacy.html#' + LEGACY[c.name] + '">' + icon('history', 16) + '2.x section</a>' : '') + '</div>';
    return head(esc(spec.title), esc(spec.need || c.need), links) +
      (spec.lead ? '<p class="sg-lead">' + spec.lead + '</p>' : '') +
      optionsPanel(spec) +
      '<div class="sg-stage-wrap" id="sg-stage-wrap"><div id="sg-stage" role="region" aria-label="Demo: ' + esc(spec.title) + '"></div></div>' +
      referenceCard(c);
  }

  function referenceCard(c) {
    var needs = needRows().filter(function (row) { return row.c === c && row.need !== c.need; });
    var serves = needs.length ? '<section class="ds-card"><h2 class="ds-card__title">Also for</h2><ul class="ds-plain-list">' + needs.map(function (row) { return '<li>' + esc(row.need) + '</li>'; }).join('') + '</ul></section>' : '';
    if (!c.classes.length && !c.hooks.length) return serves;
    var codes = function (names) { return names.map(function (name) { return '<code>' + esc(name) + '</code>'; }).join(' '); };
    return serves + '<details class="ds-collapsible ds-disclosure sg-reference"><summary>Classes, attributes and hooks' + icon('chevronDown', 20, 'ds-chevron') + '</summary><div class="ds-disclosure__body">' +
      (c.classes.length ? '<p class="sg-label">Classes</p><p class="sg-codes">' + codes(c.classes) + '</p>' : '') +
      (c.attributes.length ? '<p class="sg-label">Attributes</p><p class="sg-codes">' + codes(c.attributes) + '</p>' : '') +
      (c.hooks.length ? '<p class="sg-label">Hooks</p><p class="sg-codes">' + codes(c.hooks) + '</p>' : '') + '</div></details>';
  }

  /* ── The options panel ─────────────────────────────────────────────── */

  /* The stage's choice: size, density, shape, touch and width carry over
     from page to page; tone and variant belong to one demo. */
  var stageChoice = { size: null, density: null, shape: null, tone: null, variant: null, touch: false, width: null };
  var stageHandle = null;
  var WIDTH_MIN = 360;
  var WIDTH_MAX = 1280;

  function segmented(name, label, items, current) {
    return '<div class="ds-segmented sg-segmented" role="radiogroup" aria-label="' + label + '" data-sg-option="' + name + '">' + items.map(function (item) {
      var on = item[0] === current;
      return '<button class="ds-segmented__option" type="button" role="radio" aria-checked="' + on + '"' + (on ? '' : ' tabindex="-1"') + ' data-sg-value="' + item[0] + '" data-label="' + item[1] + '">' + item[1] + '</button>';
    }).join('') + '</div>';
  }

  function select(name, label, items, current) {
    var id = 'sg-opt-' + name;
    return '<div class="ds-field"><label class="ds-field__label" for="' + id + '">' + label + '</label><select class="ds-input" id="' + id + '" data-sg-option="' + name + '">' + items.map(function (item) {
      return '<option value="' + item[0] + '"' + (item[0] === current ? ' selected' : '') + '>' + item[1] + '</option>';
    }).join('') + '</select></div>';
  }

  function toggle(name, label, on, hint) {
    return '<label class="ds-switch sg-switch"><input type="checkbox" role="switch" data-sg-option="' + name + '"' + (on ? ' checked' : '') + '>' +
      '<span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">' + label + (hint ? ' <span class="ds-meta">' + hint + '</span>' : '') + '</span></label>';
  }

  function field(label, control) {
    return '<div class="ds-field"><p class="ds-field__label" aria-hidden="true">' + label + '</p>' + control + '</div>';
  }

  var cap = function (text) { return text.charAt(0).toUpperCase() + text.slice(1); };
  var pairs = function (values) { return values.map(function (v) { return [v, cap(v)]; }); };

  /** The panel's lists for a demo: size, density and shape offer every value unless the demo lists some or sets false. */
  function panelChoices(spec) {
    var listed = SG.choices(spec);
    var opts = spec.options || {};
    var all = function (key, values) { return opts[key] === false ? [] : values.length ? values : SG.OPTIONS[key]; };
    return { sizes: all('sizes', listed.sizes), density: all('density', listed.density), shape: all('shape', listed.shape), tones: listed.tones, variants: listed.variants };
  }

  function optionsPanel(spec) {
    var c = panelChoices(spec);
    var parts = [];
    if (c.sizes.length) parts.push(field('Size', segmented('size', 'Size', c.sizes.map(function (s) { return [s, s.toUpperCase()]; }), stageChoice.size || 'md')));
    if (c.density.length) parts.push(select('density', 'Density', [['', 'As the theme']].concat(pairs(c.density)), stageChoice.density || ''));
    if (c.shape.length) parts.push(select('shape', 'Shape', [['', 'As the theme']].concat(pairs(c.shape)), stageChoice.shape || ''));
    if (c.tones.length) parts.push(select('tone', 'Tone', [['', 'None']].concat(pairs(c.tones)), ''));
    if (c.variants.length) parts.push(select('variant', 'Variant', [['', 'Every variant']].concat(pairs(c.variants)), ''));
    parts.push(field('Colour scheme', segmented('scheme', 'Colour scheme', [['light', 'Light'], ['dark', 'Dark'], ['auto', 'Auto']], theme.scheme)));
    parts.push(select('preset', 'Theme preset', PRESETS.map(function (p) { return [p, cap(p)]; }), theme.preset));
    var width = stageChoice.width || WIDTH_MAX;
    parts.push('<div class="ds-field sg-width"><label class="ds-field__label" for="sg-opt-width">Width</label><div class="ds-field__row">' +
      '<input class="ds-slider" id="sg-opt-width" type="range" min="' + WIDTH_MIN + '" max="' + WIDTH_MAX + '" step="10" value="' + width + '" aria-describedby="sg-opt-width-out" data-sg-option="width" style="--ds-share:' + share(width) + '">' +
      '<output class="ds-slider__value" id="sg-opt-width-out" for="sg-opt-width">' + widthText(width) + '</output></div></div>');
    parts.push('<div class="sg-switches">' + toggle('contrast', 'High contrast', theme.contrast) + toggle('touch', 'Touch', stageChoice.touch, '.ds-touch') + '</div>');
    var open = optionsOpen();
    return '<section class="ds-card sg-options" aria-labelledby="sg-options-title"><div class="sg-options__head"><h2 class="ds-card__title" id="sg-options-title">' + icon('sliders', 20) + '<span>Options</span></h2>' +
      '<div class="sg-row"><button class="ds-btn ds-btn--text ds-sm" type="button" data-sg="reset-options">' + icon('reset', 16) + 'Reset</button>' +
      '<button class="ds-btn ds-sm ds-btn--disclosure" type="button" data-sg="toggle-options" aria-expanded="' + open + '" aria-controls="sg-options-body">' + (open ? 'Hide' : 'Show') + '</button></div></div>' +
      '<div id="sg-options-body"' + (open ? '' : ' hidden') + '><div class="sg-options__grid">' + parts.join('') + '</div>' +
      '<p class="ds-meta sg-options__note">Size, density, shape, tone and touch are classes on the stage, which is a <code>.ds-theme</code> of its own; the scheme, contrast and preset apply to the whole page.</p></div></section>';
  }

  /* Open on wide screens; on a phone the panel starts closed, so the demo is in view. The choice holds for the visit. */
  var optionsShown = null;
  function optionsOpen() {
    return optionsShown === null ? !window.matchMedia('(max-width: 600px)').matches : optionsShown;
  }

  function share(width) { return ((width - WIDTH_MIN) / (WIDTH_MAX - WIDTH_MIN)).toFixed(3); }
  function widthText(width) { return width >= WIDTH_MAX ? 'Full' : width + 'px'; }

  function wireOptions(page, c) {
    var panel = $('.sg-options', page);
    var stage = $('#sg-stage', page);
    stageChoice.tone = null;
    stageChoice.variant = null;
    stageHandle = SG.mount(c.name, stage, Object.assign({}, stageChoice, { scheme: theme.scheme }));
    $$('.sg-segmented', panel).forEach(function (group) {
      addIndicator(group, { active: '[aria-checked="true"]', className: 'ds-segmented__indicator' });
      DS.dom.roving(group, { items: '.ds-segmented__option' });
      group.addEventListener('click', function (event) {
        var option = event.target.closest('.ds-segmented__option');
        if (!option || option.getAttribute('aria-checked') === 'true') return;
        $$('.ds-segmented__option', group).forEach(function (other) { other.setAttribute('aria-checked', String(other === option)); });
        choose(group.getAttribute('data-sg-option'), option.getAttribute('data-sg-value'));
      });
    });
    panel.addEventListener('change', function (event) {
      var control = event.target.closest('[data-sg-option]');
      if (!control) return;
      var name = control.getAttribute('data-sg-option');
      choose(name, control.type === 'checkbox' ? control.checked : control.value);
    });
    panel.addEventListener('input', function (event) {
      if (event.target.id !== 'sg-opt-width') return;
      var value = Number(event.target.value);
      event.target.style.setProperty('--ds-share', share(value));
      $('#sg-opt-width-out').textContent = widthText(value);
      choose('width', value);
    });
    $('[data-sg="toggle-options"]', panel).addEventListener('click', function () {
      optionsShown = this.getAttribute('aria-expanded') !== 'true';
      this.setAttribute('aria-expanded', String(optionsShown));
      this.textContent = optionsShown ? 'Hide' : 'Show';
      $('#sg-options-body', panel).hidden = !optionsShown;
      indicators.forEach(function (made) { made.handle.update(); });
    });
    $('[data-sg="reset-options"]', panel).addEventListener('click', function () {
      stageChoice = { size: null, density: null, shape: null, tone: null, variant: null, touch: false, width: null };
      show(route, { keepScroll: true });
      $('[data-sg="reset-options"]').focus();
    });
  }

  /** One choice of the panel: the stage's (classes around the demo) or the page's (the theme). */
  function choose(name, value) {
    if (name === 'scheme' || name === 'preset' || name === 'contrast') {
      if (name === 'contrast') theme.contrast = Boolean(value);
      else theme[name] = value;
      if (name !== 'scheme') { generated = null; loadedSource = null; }
      applyTheme();
      return;
    }
    if (name === 'size') value = value === 'md' ? null : value;
    else if (name === 'width') value = Number(value) >= WIDTH_MAX ? null : Number(value);
    else if (name !== 'touch') value = value || null;
    stageChoice[name] = value;
    if (stageHandle) stageHandle.update(stageChoice);
  }

  /* ── Foundations (from the 2.x sections) ───────────────────────────── */

  var COLOURS = [
    ['Surfaces', ['--ds-backdrop', '--ds-surface', '--ds-surface-low', '--ds-surface-high', '--ds-surface-highest', '--ds-surface-overlay', '--ds-surface-popover']],
    ['Text and lines', ['--ds-text', '--ds-text-2', '--ds-text-3', '--ds-line', '--ds-line-2', '--ds-outline']],
    ['Primary and tint', ['--ds-primary', '--ds-on-primary', '--ds-accent', '--ds-on-accent', '--ds-action-ink', '--ds-focus']],
    ['Status', ['--ds-success', '--ds-success-container', '--ds-on-success-container', '--ds-warning', '--ds-warning-container', '--ds-warning-surface', '--ds-error', '--ds-error-container', '--ds-on-error-container']],
    ['Inverse and overlays', ['--ds-inverse', '--ds-on-inverse', '--ds-inverse-primary', '--ds-scrim', '--ds-fill-round', '--ds-disabled-fill']],
    ['Chart series', ['--ds-chart-1', '--ds-chart-2', '--ds-chart-3', '--ds-chart-4', '--ds-chart-neutral', '--ds-chart-warning', '--ds-chart-error', '--ds-chart-track']],
  ];

  function colourPage() {
    return head('Colour', 'Roles of the active theme (the preset, contrast and scheme of the options). Text roles pass WCAG AA on the surfaces they are meant for; the tint never carries a state alone.') +
      themeBar() +
      '<div class="sg-group-grid">' + COLOURS.map(function (group) {
        return card(group[0], '<div class="sg-swatches">' + group[1].map(function (name) {
          return '<div class="sg-swatch"><span class="sg-swatch__chip" style="background:var(' + name + ')"></span><code>' + name + '</code><span class="ds-meta" data-sg-role="' + name + '"></span></div>';
        }).join('') + '</div>');
      }).join('') + '</div>' +
      card('Theme check', '<p class="ds-muted">The active theme against the rules of tools/check-theme.mjs: contrast as the browser computes it, in each scheme the theme shows, and field text at 16px.</p><div data-sg="theme-check" aria-live="polite"></div>', ' id="sg-theme-check"');
  }

  /* The page-wide theme choices on a foundation page (the component pages have them in the options panel). */
  function themeBar() {
    return '<section class="ds-card sg-options sg-options--theme" aria-label="Theme"><div class="sg-options__grid">' +
      field('Colour scheme', segmented('scheme', 'Colour scheme', [['light', 'Light'], ['dark', 'Dark'], ['auto', 'Auto']], theme.scheme)) +
      select('preset', 'Theme preset', PRESETS.map(function (p) { return [p, cap(p)]; }), theme.preset) +
      '<div class="sg-switches">' + toggle('contrast', 'High contrast', theme.contrast) + '</div>' +
      '<div class="sg-row sg-load"><button class="ds-btn ds-sm" type="button" data-sg="load-theme">' + icon('upload', 16) + 'Load theme file\u2026</button>' +
      '<input type="file" id="sg-theme-file" accept=".css,text/css" hidden></div></div></section>';
  }

  function wireThemeBar(page) {
    var bar = $('.sg-options--theme', page);
    if (!bar) return;
    var group = $('.sg-segmented', bar);
    addIndicator(group, { active: '[aria-checked="true"]', className: 'ds-segmented__indicator' });
    DS.dom.roving(group, { items: '.ds-segmented__option' });
    group.addEventListener('click', function (event) {
      var option = event.target.closest('.ds-segmented__option');
      if (!option || option.getAttribute('aria-checked') === 'true') return;
      $$('.ds-segmented__option', group).forEach(function (other) { other.setAttribute('aria-checked', String(other === option)); });
      choose('scheme', option.getAttribute('data-sg-value'));
    });
    bar.addEventListener('change', function (event) {
      var control = event.target.closest('[data-sg-option]');
      if (control) choose(control.getAttribute('data-sg-option'), control.type === 'checkbox' ? control.checked : control.value);
    });
    var file = $('#sg-theme-file', bar);
    $('[data-sg="load-theme"]', bar).addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function () {
      var chosen = file.files && file.files[0];
      if (!chosen) return;
      var reader = new FileReader();
      reader.onload = function () {
        loadedSource = String(reader.result);
        generated = loadedSource;
        applyTheme();
        SG.helpers().toast('Theme loaded: ' + chosen.name + '. Pick a preset to go back.', 'info');
      };
      reader.readAsText(chosen);
    });
  }

  /* The theme check: the pairs of scripts/tools/theme-rules.mjs (TEXT_PAIRS,
     CONTROL_PAIRS, ICON_PAIRS, CHART_PAIRS), copied for this classic
     script; test/tools.test.js keeps the copy equal. */
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
      ['--ds-on-info-container', '--ds-info-container'],
      ['--ds-on-primary-container', '--ds-primary-container'],
      ['--ds-on-error', '--ds-error'],
      ['--ds-on-success', '--ds-success'],
      ['--ds-on-warning', '--ds-warning'],
      ['--ds-on-info', '--ds-info'],
      ['--ds-surface', '--ds-text-2'],
      ['--ds-text', '--ds-warning-surface'],
      ['--ds-on-inverse', '--ds-inverse'],
      ['--ds-inverse-primary', '--ds-inverse'],
      ['--ds-on-error-container', '--ds-surface'],
      ['--ds-primary', '--ds-surface'],
      ['--ds-primary', '--ds-surface-low'],
      ['--ds-on-error-container', '--ds-surface-low'],
      ['--ds-text', '--ds-surface-high'],
      ['--ds-text', '--ds-surface-low'],
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
      ['--ds-info', '--ds-surface'],
      ['--ds-outline', '--ds-surface'],
      ['--ds-inverse-primary', '--ds-inverse'],
      ['--ds-focus', '--ds-surface'],
      ['--ds-surface-highest', '--ds-outline'],
      ['--ds-primary', '--ds-on-primary'],
    ],
    chart: [
      ['--ds-chart-1', '--ds-surface'],
      ['--ds-chart-1', '--ds-surface-low'],
      ['--ds-chart-1', '--ds-chart-track'],
      ['--ds-chart-2', '--ds-surface'],
      ['--ds-chart-2', '--ds-surface-low'],
      ['--ds-chart-2', '--ds-chart-track'],
      ['--ds-chart-3', '--ds-surface'],
      ['--ds-chart-3', '--ds-surface-low'],
      ['--ds-chart-3', '--ds-chart-track'],
      ['--ds-chart-4', '--ds-surface'],
      ['--ds-chart-4', '--ds-surface-low'],
      ['--ds-chart-4', '--ds-chart-track'],
      ['--ds-chart-neutral', '--ds-surface'],
      ['--ds-chart-neutral', '--ds-surface-low'],
      ['--ds-chart-neutral', '--ds-chart-track'],
      ['--ds-chart-warning', '--ds-surface'],
      ['--ds-chart-warning', '--ds-surface-low'],
      ['--ds-chart-warning', '--ds-chart-track'],
      ['--ds-chart-error', '--ds-surface'],
      ['--ds-chart-error', '--ds-surface-low'],
      ['--ds-chart-error', '--ds-chart-track'],
    ],
  };
  var PAIR_MIN = { text: 4.5, control: 3, icon: 3, chart: 3 };

  /* The computed colours of roles, as { name: [r, g, b, a] or null }, in `scheme`. */
  function roleColours(names, scheme) {
    var box = document.createElement('div');
    box.hidden = true;
    box.style.forcedColorAdjust = 'none';
    box.style.colorScheme = scheme;
    var probes = names.map(function (name) {
      var probe = document.createElement('span');
      probe.style.color = 'var(' + name + ')';
      box.appendChild(probe);
      return probe;
    });
    html.appendChild(box);
    var colours = {};
    names.forEach(function (name, i) {
      var text = getComputedStyle(probes[i]).color;
      var srgb = /^color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.e-]+))?\)$/.exec(text);
      var rgb = /^rgba?\(([\d.]+),? ([\d.]+),? ([\d.]+)(?:[,/] ?([\d.]+))?\)$/.exec(text);
      if (srgb) colours[name] = [srgb[1] * 255, srgb[2] * 255, srgb[3] * 255, srgb[4] === undefined ? 1 : Number(srgb[4])];
      else if (rgb) colours[name] = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), rgb[4] === undefined ? 1 : Number(rgb[4])];
      else colours[name] = null;
    });
    box.remove();
    return colours;
  }

  /** [r, g, b, a] as #rrggbb (or #rrggbbaa when translucent). */
  function hex(c) {
    var two = function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); };
    return '#' + two(c[0]) + two(c[1]) + two(c[2]) + (c[3] < 1 ? two(c[3] * 255) : '');
  }

  function over(top, bottom) {
    return [0, 1, 2].map(function (i) { return top[i] * top[3] + bottom[i] * (1 - top[3]); }).concat(1);
  }

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

  /* The schemes the page shows: a pinned one, else those --ds-color-scheme names. */
  function themeSchemes() {
    if (theme.scheme !== 'auto') return [theme.scheme];
    var words = getComputedStyle(html).getPropertyValue('--ds-color-scheme').trim().split(/\s+/);
    var found = ['light', 'dark'].filter(function (scheme) { return words.indexOf(scheme) >= 0; });
    return found.length ? found : ['light'];
  }

  function renderThemeCheck() {
    var host = $('[data-sg="theme-check"]');
    if (!host) return;
    var rows = [];
    var passed = 0;
    var names = [];
    Object.keys(THEME_PAIRS).forEach(function (kind) {
      THEME_PAIRS[kind].forEach(function (pair) { pair.forEach(function (name) { if (names.indexOf(name) < 0) names.push(name); }); });
    });
    var schemes = themeSchemes();
    var views = schemes.map(function (scheme) { return { scheme: scheme, colours: roleColours(names, scheme) }; });
    Object.keys(THEME_PAIRS).forEach(function (kind) {
      THEME_PAIRS[kind].forEach(function (pair) {
        var ok = true;
        views.forEach(function (view) {
          var where = schemes.length > 1 ? ' (' + view.scheme + ')' : '';
          var fg = view.colours[pair[0]];
          var bg = view.colours[pair[1]];
          if (!fg || !bg) { ok = false; rows.push({ ok: false, text: '<code>' + pair[0] + '</code> on <code>' + pair[1] + '</code>' + where + ': not a colour' }); return; }
          var value = ratio(fg, bg);
          if (value >= PAIR_MIN[kind]) return;
          ok = false;
          rows.push({ ok: false, text: '<code>' + pair[0] + '</code> on <code>' + pair[1] + '</code>' + where + ': ' + value.toFixed(2) + ':1, needs ' + PAIR_MIN[kind] + ':1 (' + kind + ')' });
        });
        if (ok) passed += 1;
      });
    });
    var probe = document.createElement('span');
    probe.style.font = 'var(--ds-font-input)';
    html.appendChild(probe);
    var size = parseFloat(getComputedStyle(probe).fontSize);
    probe.remove();
    if (size < 16) rows.push({ ok: false, text: '<code>--ds-font-input</code> is ' + size + 'px: keep field text at 16px or more' });
    if (loadedSource) {
      // What only the file shows (tools/check-theme.mjs checks the same).
      var text = loadedSource.replace(/\/\*[\s\S]*?\*\//g, '');
      var motion = text.match(/--ds-(dur|ease|distance|loop|stagger|delay|hold|scale|time-scale|motion|enter|leave|clip-from|draw-length|scan|indicator-lag|indicator-dur)[\w-]*\s*:/g);
      if (motion) rows.push({ ok: false, text: 'Sets motion tokens or hooks (' + motion.map(function (m) { return '<code>' + m.replace(/\s*:$/, '') + '</code>'; }).join(', ') + '): motion is one scheme for every product' });
      if (/:root\b/.test(text)) rows.push({ ok: false, text: 'Rules on <code>:root</code>: tokens live on <code>.ds-theme</code>' });
      if (/@layer\b/.test(text)) rows.push({ ok: false, text: 'Uses <code>@layer</code>: a theme stays unlayered' });
      if (/!\s*important/.test(text)) rows.push({ ok: false, text: 'Uses <code>!important</code>' });
    }
    rows.unshift({ ok: true, text: passed + ' contrast pairs pass' + (schemes.length > 1 ? ' in both schemes' : ' (' + schemes[0] + ')') });
    DS.dom.morphHtml(host, findingsHtml(rows));
  }

  function findingsHtml(rows) {
    return '<ul class="ds-plain-list sg-findings">' + rows.map(function (row) {
      var status = row.ok
        ? '<span class="ds-status ds-status--ok">' + icon('check', 16) + '<span>Passes</span></span>'
        : '<span class="ds-status ds-status--error">' + icon('alert', 16) + '<span>Fails</span></span>';
      return '<li class="sg-finding" data-ok="' + row.ok + '">' + status + '<span>' + row.text + '</span></li>';
    }).join('') + '</ul>';
  }

  /* Current values of the colour and type roles (they change with the theme). */
  function readValues() {
    var style = getComputedStyle(html);
    var targets = $$('[data-sg-role]');
    var raw = targets.map(function (el) { return style.getPropertyValue(el.getAttribute('data-sg-role')).trim(); });
    var colourNames = targets.filter(function (el, i) { return /light-dark\(|color-mix\(|^var\(/.test(raw[i]); }).map(function (el) { return el.getAttribute('data-sg-role'); });
    var colours = colourNames.length ? roleColours(colourNames, themeSchemes().length > 1 ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : themeSchemes()[0]) : {};
    targets.forEach(function (el, i) {
      var name = el.getAttribute('data-sg-role');
      var colour = colours[name];
      var text = colour && /light-dark\(|color-mix\(/.test(raw[i]) ? hex(colour) : raw[i];
      // A sampled linear() curve runs to hundreds of characters: its start, the whole in the title.
      el.textContent = text.length > 90 ? text.slice(0, 88) + '…' : text;
      if (text !== raw[i] || text.length > 90) el.title = raw[i];
    });
    $$('[data-sg-font]').forEach(function (el) {
      var s = getComputedStyle(el.parentNode.firstChild);
      el.textContent = s.fontWeight + ' ' + s.fontSize + '/' + s.lineHeight;
    });
  }

  var TYPE = [
    ['--ds-font-display', 'Key figure 1,284'], ['--ds-font-headline', 'Page title'], ['--ds-font-title', 'Dialog and section title'],
    ['--ds-font-subtitle', 'Card title'], ['--ds-font-reading', 'Running text meant to be read, at a comfortable size.'],
    ['--ds-font-body', 'Default UI text, fields and descriptions.'], ['--ds-font-dense', 'Table cell text'], ['--ds-font-label', 'Button and label'],
    ['--ds-font-chip', 'Chip'], ['--ds-font-meta', 'Hint, timestamp, tooltip'], ['--ds-font-caption', 'Status chip, field label'], ['--ds-font-code', 'const code = true;'],
  ];

  function typePage() {
    return head('Type', 'Roles are font shorthands: size, line height, weight and family in one token. Headings are regular weight; the label weight marks buttons and labels.') +
      card('', TYPE.map(function (role) {
        return '<div class="sg-type"><p style="font:var(' + role[0] + ')">' + role[1] + '</p><code>' + role[0] + '</code><span class="ds-meta" data-sg-font="' + role[0] + '"></span></div>';
      }).join(''));
  }

  function shapePage() {
    var spaces = ['1', '2', '3', '4', '5', '6', '7', '8', '10', '12'];
    var radii = ['--ds-radius-xs', '--ds-radius-sm', '--ds-radius-md', '--ds-radius-lg', '--ds-radius-xl', '--ds-radius-2xl', '--ds-radius-action'];
    var roles = ['--ds-radius-card', '--ds-radius-dialog', '--ds-radius-panel', '--ds-radius-field', '--ds-radius-chip'];
    return head('Space and shape', 'A 4px spacing grid and a radius scale with roles. Every action is a pill: its radius is at most half its height; a square theme (shape 0) makes square actions.') +
      card('Spacing', '<div class="sg-spaces">' + spaces.map(function (n) {
        return '<div class="sg-space"><span class="sg-space__bar" style="height:var(--ds-space-' + n + ')"></span><code>' + n + '</code></div>';
      }).join('') + '</div>') +
      card('Radius scale and roles', '<div class="sg-shapes">' + radii.concat(roles).map(function (name) {
        return '<div class="sg-shape" style="border-radius:var(' + name + ')"><code>' + name.replace('--ds-radius-', '') + '</code></div>';
      }).join('') + '</div>');
  }

  function elevationPage() {
    var elevations = ['--ds-elev-hover', '--ds-elev-popover', '--ds-elev-overlay'];
    return head('Elevation', 'Three elevation roles, for floating layers only: cards rest flat on a hairline, and only what floats above the page casts a shadow.') +
      themeBar() +
      card('Elevation roles', '<div class="sg-shapes">' + elevations.map(function (name) {
        return '<div class="sg-shape sg-shape--raised" style="box-shadow:var(' + name + ');border-radius:var(--ds-radius-card)"><code>' + name.replace('--ds-elev-', '') + '</code></div>';
      }).join('') + '</div>') +
      card('Surfaces from low to high', '<div class="sg-shapes">' + ['--ds-backdrop', '--ds-surface-low', '--ds-surface', '--ds-surface-high', '--ds-surface-highest'].map(function (name) {
        return '<div class="sg-shape" style="background:var(' + name + ')"><code>' + name.replace('--ds-', '') + '</code></div>';
      }).join('') + '</div>');
  }

  function motionPage() {
    return head('Motion', 'Material curves for fades, a gentle spring for movement that floats, short distances, exits faster than entrances. The same motion on every device; the speed select in the top bar (or ?speed=0.1 in the address) plays it slower.') +
      card('Principles', '<ul class="sg-principles">' +
        '<li>Springs carry what floats (the indicator, sheets, menus, rows that glide); fades and colours stay within their range, and sizes that push layout land on <code>--ds-ease-out</code>.</li>' +
        '<li>Hover never moves anything; a press ripples from the pointer and turns the shape squarer, then it springs back.</li>' +
        '<li>Interrupted, every motion continues from where it is; data glides to its new place and never replays an entrance.</li></ul>' +
        '<div class="sg-row"><a class="ds-btn ds-btn--tonal" href="motion.html">' + icon('activity', 16) + 'Open the Motion Lab</a><a class="ds-btn ds-btn--text" href="../docs/motion.md">Motion reference ' + icon('arrowRight', 16) + '</a></div>' +
        '<p class="ds-muted">The lab plots every curve as this browser plays it, lines up the durations, and replays every choreography, with rapid toggles and reversals to show interruption.</p>');
  }

  var FILLABLE = ['thumbUp', 'thumbDown', 'chat', 'shield', 'folder', 'flag', 'bell', 'home', 'moon', 'play'];

  function iconsPage() {
    return head('Icons', glyphs().length + ' outline glyphs on a 24px grid, colour from currentColor: <code>DS.icons.icon(DS.icons.name, size)</code>. The marked ones fill when on (<code>.ds-icon--fillable</code> in an aria-pressed control).') +
      card('', '<div class="ds-toolbar sg-filter"><div class="ds-search">' + icon('search', 20) + '<input class="ds-input" id="sg-icon-filter" type="search" aria-label="Filter icons" placeholder="Filter icons"></div>' +
        '<button class="ds-btn ds-sm" type="button" aria-pressed="false" data-sg="fill-icons">' + icon('bell', 16, 'ds-icon--fillable') + 'Fill the fillable glyphs</button></div>' +
        '<div class="sg-icons" id="sg-icons">' + glyphs().map(function (name) {
          var fillable = FILLABLE.indexOf(name) !== -1;
          return '<div class="sg-icon' + (fillable ? ' sg-icon--fillable' : '') + '" data-name="' + name.toLowerCase() + '">' + icon(name, 20, fillable ? 'ds-icon--fillable' : '') + '<span>' + name + (fillable ? ' (fills)' : '') + '</span></div>';
        }).join('') + '</div>');
  }

  function wireIcons(page) {
    var filter = $('#sg-icon-filter', page);
    filter.addEventListener('input', function () {
      var q = filter.value.trim().toLowerCase();
      $$('.sg-icon', page).forEach(function (el) { el.hidden = Boolean(q) && el.getAttribute('data-name').indexOf(q) < 0; });
    });
    $('[data-sg="fill-icons"]', page).addEventListener('click', function () {
      var on = this.getAttribute('aria-pressed') !== 'true';
      this.setAttribute('aria-pressed', String(on));
      $('#sg-icons', page).classList.toggle('sg-icons--filled', on);
    });
  }

  /* Tokens: every name of src/core/tokens.css (registry.js), its value on this page, and the component hooks. */
  function tokensPage(query) {
    return head('Tokens', REG.tokens.length + ' custom properties on <code>.ds-theme</code>: scales (the same in every theme), roles (what a theme sets) and seeds; then each component\'s hooks. Values are those of the active theme.') +
      '<section class="ds-card" aria-label="Tokens"><div class="ds-toolbar sg-filter"><div class="ds-search">' + icon('search', 20) +
      '<input class="ds-input" id="sg-token-filter" type="search" aria-label="Filter tokens" placeholder="Filter tokens" value="' + esc(query || '') + '"></div><span class="ds-meta" id="sg-token-count" aria-live="polite"></span></div>' +
      '<div class="ds-table-wrap" tabindex="0" role="region" aria-label="Tokens"><table class="ds-table ds-density-tight"><thead><tr><th scope="col">Token</th><th scope="col">Value</th><th scope="col" class="ds-col--secondary">Kind</th></tr></thead><tbody>' +
      REG.tokens.map(function (pair) {
        var name = pair[0];
        return '<tr data-name="' + name + '"><td class="ds-nowrap"><code>' + name + '</code></td><td class="ds-col--text"><span class="sg-token-value"><span class="sg-token-chip" aria-hidden="true"></span><span data-sg-role="' + name + '"></span></span></td><td class="ds-col--secondary">' + tokenKind(pair) + '</td></tr>';
      }).join('') +
      COMPONENTS.map(function (c) {
        return c.hooks.map(function (name) {
          return '<tr data-name="' + name + '"><td class="ds-nowrap"><code>' + name + '</code></td><td class="ds-col--text"><span class="ds-muted">hook of </span><a href="' + componentHref(c) + '">' + esc(c.title) + '</a></td><td class="ds-col--secondary">Hook</td></tr>';
        }).join('');
      }).join('') + '</tbody></table></div></section>';
  }

  /** The kind of a token ([name, layer] of registry.js): seed, motion, scale or role. */
  function tokenKind(pair) {
    if (/^--ds-seed-/.test(pair[0])) return 'Seed';
    if (/^--ds-(dur|ease|distance|scale|loop|delay|hold|stagger|time-scale|motion|enter|leave|clip-from|draw-length|scan|indicator)/.test(pair[0])) return 'Motion';
    return pair[1] === 'scale' ? 'Scale' : 'Role';
  }

  function wireTokens(page) {
    var filter = $('#sg-token-filter', page);
    var apply = function () {
      var q = filter.value.trim().toLowerCase();
      var shown = 0;
      $$('tbody tr', page).forEach(function (row) {
        var match = !q || row.getAttribute('data-name').indexOf(q) >= 0;
        row.hidden = !match;
        if (match) shown += 1;
      });
      $('#sg-token-count', page).textContent = shown + ' shown';
    };
    filter.addEventListener('input', apply);
    apply();
    // Colour chips for the values that are colours.
    var style = getComputedStyle(html);
    $$('.sg-token-value', page).forEach(function (cell) {
      var name = $('[data-sg-role]', cell).getAttribute('data-sg-role');
      var value = style.getPropertyValue(name).trim();
      if (/^(#|rgb|hsl|oklch|color|light-dark)/.test(value)) $('.sg-token-chip', cell).style.background = 'var(' + name + ')';
      else $('.sg-token-chip', cell).remove();
    });
  }

  /* ── Search ────────────────────────────────────────────────────────── */

  var PAGES_INDEX = [['', 'Overview'], ['needs', 'Which component for which need']].concat(FOUNDATIONS.map(function (f) { return [f[0], f[1]]; }));

  /** Results for `q`: { pages, components, classes, tokens }, each a list of { href, title, meta }. */
  function search(q) {
    var words = q.toLowerCase().split(/\s+/).filter(Boolean);
    var hit = function (text) { var t = String(text).toLowerCase(); return words.every(function (w) { return t.indexOf(w) >= 0; }); };
    var out = { pages: [], components: [], classes: [], tokens: [] };
    if (!words.length) return out;
    PAGES_INDEX.forEach(function (p) { if (hit(p[1])) out.pages.push({ href: '#/' + p[0], title: p[1], meta: 'Page' }); });
    COMPONENTS.forEach(function (c) {
      if (hit(c.name + ' ' + c.title + ' ' + c.need + ' ' + groupTitle(c.group))) out.components.push({ href: componentHref(c), title: c.title, meta: c.need || groupTitle(c.group) });
      c.classes.forEach(function (cls) { if (hit(cls)) out.classes.push({ href: componentHref(c), title: '.' + cls, meta: c.title }); });
      c.attributes.forEach(function (attr) { if (hit(attr)) out.classes.push({ href: componentHref(c), title: '[' + attr + ']', meta: c.title }); });
      c.hooks.forEach(function (hook) { if (hit(hook)) out.tokens.push({ href: componentHref(c), title: hook, meta: 'Hook of ' + c.title }); });
    });
    var listed = out.components.map(function (item) { return item.title; });
    needRows().forEach(function (row) {
      if (row.need === row.c.need || listed.indexOf(row.c.title + row.need) >= 0 || !hit(row.need)) return;
      listed.push(row.c.title + row.need);
      out.components.push({ href: componentHref(row.c), title: row.c.title, meta: row.need });
    });
    REG.tokens.forEach(function (pair) { if (hit(pair[0])) out.tokens.push({ href: '#/tokens?q=' + encodeURIComponent(pair[0]), title: pair[0], meta: tokenKind(pair) }); });
    return out;
  }

  var RESULT_MAX = 40;

  function resultsHtml(q) {
    var found = search(q);
    var total = found.pages.length + found.components.length + found.classes.length + found.tokens.length;
    if (!q.trim()) return '<div class="ds-empty"><span class="ds-empty__disc" aria-hidden="true">' + icon('search', 24) + '</span><p class="ds-empty__title">Search the styleguide</p><p class="ds-empty__text">Components, their need lines, classes, attributes, hooks and tokens.</p></div>';
    if (!total) return '<div class="ds-empty"><span class="ds-empty__disc" aria-hidden="true">' + icon('search', 24) + '</span><p class="ds-empty__title">Nothing matches “' + esc(q) + '”</p><p class="ds-empty__text">Try a part of a class (btn, chip), a token (primary, radius) or a need (date, upload).</p></div>';
    var block = function (title, items) {
      if (!items.length) return '';
      return card(title + ' <span class="ds-badge ds-badge--neutral">' + items.length + '</span>', '<ul class="ds-list ds-list--interactive" aria-label="' + title + '">' + items.slice(0, RESULT_MAX).map(function (item) {
        return '<li class="ds-list__item"><span class="ds-list__text"><span class="ds-list__title"><a class="ds-list__action" href="' + item.href + '">' + esc(item.title) + '</a></span><span class="ds-list__meta">' + esc(item.meta) + '</span></span>' + icon('chevronRight', 20, 'ds-list__chevron') + '</li>';
      }).join('') + '</ul>' + (items.length > RESULT_MAX ? '<p class="ds-meta">' + (items.length - RESULT_MAX) + ' more: narrow the search.</p>' : ''));
    };
    return '<p class="ds-meta" id="sg-result-count">' + total + ' result' + (total === 1 ? '' : 's') + '</p>' + block('Pages', found.pages) + block('Components', found.components) + block('Classes and attributes', found.classes) + block('Tokens and hooks', found.tokens);
  }

  function searchPage(q) {
    return head('Search', '') +
      '<div class="ds-search sg-search-page">' + icon('search', 20) + '<input class="ds-input" id="sg-search-page" type="search" aria-label="Search the styleguide" placeholder="Search components, classes and tokens" value="' + esc(q) + '"></div>' +
      '<div id="sg-results" aria-live="polite">' + resultsHtml(q) + '</div>';
  }

  function setupSearch() {
    var input = $('#sg-search');
    input.addEventListener('input', function () { searchFor(input.value, input); });
    document.addEventListener('keydown', function (event) {
      if (event.key !== '/' || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target.closest('input, textarea, select, [contenteditable]')) return;
      event.preventDefault();
      var field = input.offsetParent ? input : $('#sg-search-page');
      if (field) field.focus();
      else location.hash = '#/search';
    });
  }

  /* Typing searches in place: the first key opens the search page (a
     history entry), later ones replace its query. */
  function searchFor(q, from) {
    var target = '#/search?q=' + encodeURIComponent(q);
    if (route.name !== 'search') {
      location.hash = target;
      return;
    }
    history.replaceState(null, '', target);
    route = parse(target);
    DS.dom.morphHtml($('#sg-results'), resultsHtml(q));
    if (from !== $('#sg-search-page') && $('#sg-search-page')) $('#sg-search-page').value = q;
    if (from !== $('#sg-search')) $('#sg-search').value = q;
  }

  /* ── The theme generator (#/theme) ─────────────────────────────────── */

  var generator = window.SG_THEME_GENERATOR;   // theme-generator.js: tools/theme.mjs as a classic script
  var THEME_INPUT = { seed: '#0b57d0', scheme: 'tonal', contrast: 'standard', density: '0', shape: '1', type: '1', name: 'custom' };
  var lastTheme = null;

  var DENSITY = [['0', 'Comfortable (0)'], ['-1', 'Compact (-1)'], ['-2', 'Dense (-2)'], ['-3', 'Tight (-3)']];
  var SHAPES = [['0', 'Square (0)'], ['0.5', 'Soft (0.5)'], ['1', 'Default (1)'], ['1.5', 'Round (1.5)']];
  var TYPE_SCALES = [['0.9', '0.9 (smaller)'], ['1', '1 (default)'], ['1.1', '1.1 (larger)']];

  function themePage() {
    var t = THEME_INPUT;
    var opt = function (items, current) { return items.map(function (i) { return '<option value="' + i[0] + '"' + (i[0] === current ? ' selected' : '') + '>' + i[1] + '</option>'; }).join(''); };
    return head('Theme generator', 'One seed colour in, one theme file out: every colour role in the light and the dark scheme, checked against the contrast pairs. The same code as <code>node tools/theme.mjs</code>, running in this page.') +
      '<div class="sg-theme-layout">' +
      card('Input', '<form class="ds-form sg-theme-form" id="sg-theme-form">' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-seed">Seed colour</label><div class="ds-field__row sg-seed-row">' +
        '<input class="sg-seed-swatch" type="color" id="sg-seed-picker" value="' + t.seed + '" aria-label="Pick the seed colour">' +
        '<input class="ds-input" id="sg-seed" name="seed" value="' + t.seed + '" spellcheck="false" autocomplete="off" aria-describedby="sg-seed-hint"></div>' +
        '<p class="ds-field__hint" id="sg-seed-hint">#rgb, #rrggbb, rgb() or oklch()</p></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-scheme">Scheme</label><select class="ds-input" id="sg-scheme" name="scheme">' + opt([['tonal', 'Tonal'], ['vibrant', 'Vibrant'], ['neutral', 'Neutral'], ['fidelity', 'Fidelity'], ['monochrome', 'Monochrome']], t.scheme) + '</select></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-contrast">Contrast</label><select class="ds-input" id="sg-contrast" name="contrast">' + opt([['standard', 'Standard (4.5:1 text)'], ['medium', 'Medium (6:1 text)'], ['high', 'High (7:1 text)']], t.contrast) + '</select></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-density">Density</label><select class="ds-input" id="sg-density" name="density">' + opt(DENSITY, t.density) + '</select></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-shape">Shape</label><select class="ds-input" id="sg-shape" name="shape">' + opt(SHAPES, t.shape) + '</select></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-type">Type scale</label><select class="ds-input" id="sg-type" name="type">' + opt(TYPE_SCALES, t.type) + '</select></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="sg-name">Name</label><input class="ds-input" id="sg-name" name="name" value="' + t.name + '" spellcheck="false" autocomplete="off"></div>' +
        '<div class="sg-row"><button class="ds-btn ds-btn--filled" type="button" data-sg="download-theme" disabled>' + icon('download', 18) + 'Download theme</button>' +
        '<button class="ds-btn" type="button" data-sg="use-theme" aria-pressed="' + Boolean(generated) + '" disabled>Use in the styleguide</button></div></form>') +
      '<div class="sg-previews">' + ['light', 'dark'].map(function (scheme) {
        return '<section class="ds-theme sg-preview" data-ds-scheme="' + scheme + '" aria-label="Preview, ' + scheme + '"><p class="sg-preview__label">' + cap(scheme) + '</p>' + previewSample(scheme) + '</section>';
      }).join('') + '</div></div>' +
      card('Pair report', '<div id="sg-theme-report" aria-live="polite"><p class="ds-muted">Generating…</p></div>') +
      '<details class="ds-collapsible ds-disclosure"><summary>The theme file' + icon('chevronDown', 20, 'ds-chevron') + '</summary><div class="ds-disclosure__body"><pre class="ds-code-block sg-theme-css" id="sg-theme-css" tabindex="0"></pre></div></details>';
  }

  function previewSample(scheme) {
    var id = 'sg-pv-' + scheme;
    return '<div class="sg-preview__body">' +
      '<div class="sg-row"><button class="ds-btn ds-btn--filled" type="button">Save</button><button class="ds-btn ds-btn--tonal" type="button">Export</button><button class="ds-btn" type="button">Cancel</button></div>' +
      '<div class="sg-row"><span class="ds-status ds-status--ok">' + icon('check', 16) + '<span>Synced</span></span><span class="ds-status ds-status--warning">' + icon('alert', 16) + '<span>Expires soon</span></span><span class="ds-status ds-status--error">' + icon('alert', 16) + '<span>Failed</span></span></div>' +
      '<div class="ds-card"><h3 class="ds-card__title">LAPTOP-0042</h3><p class="ds-muted">Latitude 7440 · Ada Lovelace</p>' +
      '<div class="ds-field"><label class="ds-field__label" for="' + id + '-f">Asset tag</label><input class="ds-input" id="' + id + '-f" value="A-1042"></div>' +
      '<label class="ds-switch"><input type="checkbox" role="switch" checked><span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">Nightly sync</span></label></div>' +
      '<div class="ds-alert" role="note">' + icon('info', 20) + '<span class="ds-alert__text">Updates install tonight.</span></div>' +
      '<span class="ds-meter" role="meter" aria-label="Disk" aria-valuemin="0" aria-valuemax="100" aria-valuenow="62" style="--ds-share:.62"></span></div>';
  }

  function wireTheme(page) {
    var form = $('#sg-theme-form', page);
    var run = function () {
      var data = {};
      $$('[name]', form).forEach(function (input) { data[input.name] = input.value; });
      Object.assign(THEME_INPUT, data);
      var result;
      try {
        result = generator.generateTheme({ seed: data.seed.trim(), scheme: data.scheme, contrast: data.contrast, name: data.name.trim() || 'custom' });
      } catch (error) {
        DS.dom.morphHtml($('#sg-theme-report', page), '<div class="ds-alert ds-alert--error" role="alert">' + icon('alertCircle', 20) + '<span class="ds-alert__text">' + esc(error.message) + '</span></div>');
        return;
      }
      lastTheme = withOptions(result.css, data);
      showTheme(page, result, data);
      if (generated) { generated = lastTheme; applyTheme(); }
    };
    $$('[data-sg="download-theme"], [data-sg="use-theme"]', page).forEach(function (b) { b.disabled = false; });
    form.addEventListener('input', function (event) {
      if (event.target.id === 'sg-seed-picker') $('#sg-seed', page).value = event.target.value;
      if (event.target.id === 'sg-seed' && /^#[0-9a-f]{6}$/i.test(event.target.value.trim())) $('#sg-seed-picker', page).value = event.target.value.trim();
      run();
    });
    form.addEventListener('change', run);
    run();
    $('[data-sg="download-theme"]', page).addEventListener('click', function () {
      if (!lastTheme) return;
      var link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob([lastTheme], { type: 'text/css' }));
      link.download = (THEME_INPUT.name.trim() || 'custom') + '.css';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(link.href); }, 0);
      SG.helpers().toast('Downloaded ' + link.download + '.', 'success');
    });
    $('[data-sg="use-theme"]', page).addEventListener('click', function () {
      var on = this.getAttribute('aria-pressed') !== 'true';
      this.setAttribute('aria-pressed', String(on));
      generated = on ? lastTheme : null;
      applyTheme();
    });
  }

  /* The generated file plus the numeric options, which nest (a region may set its own). */
  function withOptions(css, data) {
    var extra = [];
    if (data.density !== '0') extra.push('  --ds-density: ' + data.density + ';');
    if (data.shape !== '1') extra.push('  --ds-shape: ' + data.shape + ';');
    if (data.type !== '1') extra.push('  --ds-type-scale: ' + data.type + ';');
    if (!extra.length) return css;
    return css.replace('.ds-theme {\n  --ds-color-scheme: light dark;\n', '.ds-theme {\n  --ds-color-scheme: light dark;\n\n  /* ── Options: numeric, read where they are used ── */\n' + extra.join('\n') + '\n');
  }

  /* The roles of the theme's first block as declarations, set inline on each preview. */
  function declarations(css) {
    var block = css.slice(css.indexOf('.ds-theme {') + 11, css.indexOf('\n}', css.indexOf('.ds-theme {')));
    var out = [];
    block.replace(/(--ds-[\w-]+):\s*([^;]+);/g, function (_, name, value) { out.push([name, value]); return _; });
    return out;
  }

  function showTheme(page, result, data) {
    var decls = declarations(withOptions(result.css, data)).filter(function (d) { return d[0] !== '--ds-color-scheme'; });
    $$('.sg-preview', page).forEach(function (preview) {
      preview.removeAttribute('style');
      decls.forEach(function (d) { preview.style.setProperty(d[0], d[1]); });
    });
    $('#sg-theme-css', page).textContent = lastTheme;
    var failing = result.report.filter(function (pair) { return pair.ratio < pair.min; });
    var lowest = function (scheme) {
      return result.report.filter(function (p) { return p.scheme === scheme && p.kind === 'text'; }).reduce(function (low, p) { return Math.abs(p.apca) < Math.abs(low.apca) ? p : low; });
    };
    var rows = [{ ok: !failing.length, text: (result.report.length - failing.length) + ' of ' + result.report.length + ' pairs pass in both schemes (WCAG 2)' }];
    failing.forEach(function (p) { rows.push({ ok: false, text: '<code>' + p.fg + '</code> on <code>' + p.bg + '</code> (' + p.scheme + '): ' + p.ratio.toFixed(2) + ':1, needs ' + p.min + ':1' }); });
    rows.push({ ok: true, text: result.moves.length + ' tone' + (result.moves.length === 1 ? '' : 's') + ' moved to reach a pair' + (result.moves.length ? ': ' + result.moves.slice(0, 6).map(function (m) { return '<code>' + m.role + '</code> ' + m.scheme + ' ' + m.from + '→' + m.to; }).join(', ') + (result.moves.length > 6 ? ', …' : '') : '') });
    ['light', 'dark'].forEach(function (scheme) {
      var low = lowest(scheme);
      rows.push({ ok: true, text: 'APCA, advisory: the lowest text pair in ' + scheme + ' is Lc ' + Math.abs(low.apca).toFixed(1) + ' (<code>' + low.fg + '</code> on <code>' + low.bg + '</code>)' });
    });
    var table = '<details class="ds-collapsible ds-disclosure"><summary>Every pair' + icon('chevronDown', 20, 'ds-chevron') + '</summary><div class="ds-disclosure__body"><div class="ds-table-wrap" tabindex="0" role="region" aria-label="Every pair"><table class="ds-table ds-table--dense"><thead><tr><th scope="col">Pair</th><th scope="col">Scheme</th><th scope="col" class="ds-num">Ratio</th><th scope="col" class="ds-num">Needs</th><th scope="col" class="ds-num ds-col--secondary">APCA Lc</th></tr></thead><tbody>' +
      result.report.map(function (p) {
        return '<tr><td><code>' + p.fg + '</code> on <code>' + p.bg + '</code></td><td>' + p.scheme + '</td><td class="ds-num">' + p.ratio.toFixed(2) + '</td><td class="ds-num">' + p.min + '</td><td class="ds-num ds-col--secondary">' + Math.abs(p.apca).toFixed(1) + '</td></tr>';
      }).join('') + '</tbody></table></div></div></details>';
    DS.dom.morphHtml($('#sg-theme-report', page), findingsHtml(rows) + table);
    html.setAttribute('data-sg-generated', result.options.seed + ' ' + result.options.scheme + ' ' + result.options.contrast);
  }

  /* ── Routing, navigation and the frame ─────────────────────────────── */

  function parse(hash) {
    var path = String(hash || '').replace(/^#\/?/, '');
    var at = path.indexOf('?');
    var query = new URLSearchParams(at >= 0 ? path.slice(at + 1) : '');
    path = at >= 0 ? path.slice(0, at) : path;
    var parts = path.split('/').filter(Boolean);
    if (!parts.length) return { name: 'overview', key: '' };
    if (parts[0] === 'components' && parts[1]) return { name: 'component', key: 'components/' + parts[1], component: parts[1] };
    if (parts[0] === 'search') return { name: 'search', key: 'search', q: query.get('q') || '' };
    if (parts[0] === 'tokens') return { name: 'tokens', key: 'tokens', q: query.get('q') || '' };
    return { name: parts[0], key: parts[0] };
  }

  var route = parse(location.hash);
  /** The sliding pills of the page: { track, handle }; a page's own go with it. */
  var indicators = [];

  function addIndicator(track, options) {
    indicators.push({ track: track, handle: DS.indicator.createIndicator(track, options) });
  }

  function pageHtml(r) {
    if (r.name === 'overview') return overviewPage();
    if (r.name === 'needs') return needsPage();
    if (r.name === 'search') return searchPage(r.q);
    if (r.name === 'tokens') return tokensPage(r.q);
    if (r.name === 'colour') return colourPage();
    if (r.name === 'type') return typePage();
    if (r.name === 'shape') return shapePage();
    if (r.name === 'elevation') return elevationPage();
    if (r.name === 'motion') return motionPage();
    if (r.name === 'icons') return iconsPage();
    if (r.name === 'theme') return themePage();
    if (r.name === 'component') {
      var c = component(r.component);
      if (c && c.spec) return componentPage(c);
      if (c) return head(esc(c.title), esc(c.need), '') + '<div class="ds-empty"><span class="ds-empty__disc" aria-hidden="true">' + icon('history', 24) + '</span><p class="ds-empty__title">Not ported yet</p><p class="ds-empty__text">' + esc(c.title) + ' still shows on the 2.x styleguide.</p><a class="ds-btn" href="' + componentHref(c) + '">Open its 2.x section</a></div>';
    }
    // An address of the 2.x page (index.html#buttons from before): that section stays on legacy.html.
    var legacy = Object.keys(LEGACY).some(function (name) { return LEGACY[name] === r.key; });
    return head('Not found', '') + '<div class="ds-empty"><span class="ds-empty__disc" aria-hidden="true">' + icon('search', 24) + '</span><p class="ds-empty__title">No page “' + esc(r.key) + '”</p><p class="ds-empty__text">' +
      (legacy ? 'That section stays on the 2.x styleguide for now.' : 'Use the drawer or the search.') + '</p>' + (legacy ? '<a class="ds-btn" href="legacy.html#' + esc(r.key) + '">Open the 2.x section</a>' : '<a class="ds-btn" href="#/">Overview</a>') + '</div>';
  }

  function wirePage(page, r) {
    if (r.name === 'component') { var c = component(r.component); if (c && c.spec) wireOptions(page, c); }
    if (r.name === 'colour' || r.name === 'elevation') wireThemeBar(page);
    if (r.name === 'icons') wireIcons(page);
    if (r.name === 'needs') wireNeeds(page);
    if (r.name === 'tokens') wireTokens(page);
    if (r.name === 'theme') wireTheme(page);
    if (r.name === 'search') {
      var field = $('#sg-search-page', page);
      field.addEventListener('input', function () { searchFor(field.value, field); });
    }
    readValues();
    renderThemeCheck();
  }

  /* Markup into the page through an inert <template> (as legacy.html): no
     <svg> parsed into the document ends the render block of <link rel="expect"> early. */
  function setHtml(element, markup) {
    var template = document.createElement('template');
    template.innerHTML = markup;
    element.replaceChildren(template.content);
  }

  /** Renders route `r` into the page; `options.keepScroll` keeps the view where it is. */
  function show(r, options) {
    route = r;
    var page = $('#sg-page');
    if (stageHandle) { stageHandle.destroy(); stageHandle = null; }
    indicators = indicators.filter(function (made) {
      if (!page.contains(made.track)) return true;
      made.handle.destroy();
      return false;
    });
    setHtml(page, pageHtml(r));
    page.setAttribute('data-sg-page-name', r.name);
    document.title = pageTitle(r) + ' · Dashboard-Style';
    wirePage(page, r);
    setActive();
    if (!(options && options.keepScroll)) $('#main').scrollTop = 0;
    if ($('#sg-search') !== document.activeElement) $('#sg-search').value = r.name === 'search' ? r.q : '';
    html.setAttribute('data-sg-route', r.key);
  }

  function pageTitle(r) {
    if (r.name === 'component') { var c = component(r.component); return c ? c.title : 'Not found'; }
    var found = PAGES_INDEX.filter(function (p) { return p[0] === r.key; })[0];
    return found ? found[1] : r.name === 'search' ? 'Search' : 'Styleguide';
  }

  function navHtml() {
    var item = function (href, label, glyph) { return '<a class="ds-drawer__item" href="' + href + '">' + icon(glyph, 20) + '<span class="ds-drawer__label">' + label + '</span></a>'; };
    var group = function (title, items) { return '<div class="ds-drawer__group"><p class="ds-drawer__heading">' + title + '</p>' + items.join('') + '</div>'; };
    return group('Start', [item('#/', 'Overview', 'overview'), item('#/needs', 'Which component', 'helpCircle')]) +
      group('Foundations', FOUNDATIONS.map(function (f) { return item('#/' + f[0], f[1], f[2]); })) +
      groupsOf(DEMOED).map(function (g) { return group(esc(groupTitle(g.id)), g.items.map(function (c) { return item('#/components/' + c.name, esc(c.title), groupIcon(c.group)); })); }).join('') +
      group('More', [item('motion.html', 'Motion Lab', 'activity'), item('legacy.html', '2.x styleguide', 'history')]);
  }

  /* The current drawer item: the route's own, the tokens page for its filter, nothing for search. */
  function setActive() {
    var current = '#/' + route.key;
    $$('#sg-nav .ds-drawer__item').forEach(function (a) {
      if (a.getAttribute('href') === current) {
        if (a.getAttribute('aria-current') !== 'page') a.setAttribute('aria-current', 'page');
      } else if (a.hasAttribute('aria-current')) {
        a.removeAttribute('aria-current');
      }
    });
  }

  var app = $('#sg-app');
  var modal = window.matchMedia(DS.overlay.DRAWER_QUERY);

  function openDrawer(open) {
    var drawer = $('#sg-drawer');
    if (open) DS.overlay.open(drawer, { opener: $('[data-sg="menu"]') });
    else DS.overlay.close(drawer);
  }

  function setupFrame() {
    $('#sg-version').textContent = 'v' + DS.version;
    setHtml($('[data-sg="menu"]'), icon('menu', 20));
    // The search's glyph is a direct child of .ds-search (its rule is `.ds-search > svg`).
    var glyph = document.createElement('template');
    glyph.innerHTML = icon('search', 20);
    $('#sg-search-icon').replaceWith(glyph.content);
    setHtml($('#sg-search-button'), icon('search', 20));
    setHtml($('#sg-nav'), navHtml());
    // The current item is part of the first render: the pill's first placement jumps there, and it is
    // named, so it glides across the load to the Motion Lab and back (css/optional/view-transitions.css).
    setActive();
    addIndicator($('#sg-nav'), { active: '[aria-current="page"]', className: 'ds-drawer__indicator', name: 'nav', reveal: true });
    DS.dom.scrollEdges($('#sg-nav'), { axis: 'block' });
    DS.dom.watchScrolled($('#main'), app);
    $('[data-sg="menu"]').addEventListener('click', function () { openDrawer(!app.hasAttribute('data-drawer-open')); });
    $('#sg-nav').addEventListener('click', function (event) {
      var link = event.target.closest('a');
      if (link && link.getAttribute('href').charAt(0) === '#' && modal.matches) openDrawer(false);
    });
  }

  /* A route change: the new page fades through (DS.motion.transition: a View
     Transition where there is one), focus goes to its title. */
  function navigate() {
    var next = parse(location.hash);
    if (next.key === route.key && next.name !== 'search' && next.q === route.q) return;
    if (next.name === 'search' && route.name === 'search') { show(next, { keepScroll: true }); return; }
    M.transition(function () { show(next); }, { type: 'fade-through' }).then(focusTitle, focusTitle);
  }

  /* Focus follows the navigation: to the new page's title, or to the search
     page's field; typing in the bar's search keeps its focus. */
  function focusTitle() {
    if (document.activeElement === $('#sg-search')) return;
    var target = route.name === 'search' ? $('#sg-search-page') : $('#sg-page h1');
    if (target) target.focus({ preventScroll: true });
  }

  /* ── Start ─────────────────────────────────────────────────────────── */

  setupFrame();
  setupSpeed();
  setupSearch();
  show(route);
  // First render: the page's parts stagger in once; later pages fade through (navigate()).
  M.staggerOnce($('#sg-page'));
  // Behaviour of the system (data-ds-*), the action guard and the ripple for every action on the page.
  DS.init(document);
  DS.ripple.attach(document);
  DS.overlay.tooltips(document);
  window.addEventListener('hashchange', navigate);
  applyTheme(function () {
    html.setAttribute('data-sg-ready', '');
  });
  window.SG_SHELL = { search: search, parse: parse, components: COMPONENTS };
}());
