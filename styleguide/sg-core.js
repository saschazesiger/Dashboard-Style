/*
 * sg-core.js: the demo registry of the 3.0 styleguide, with no dependency
 * on the pages that show the demos. A classic script on top of dist/ds.js,
 * so it runs from disk (file://). The styleguide (index.html) and the
 * per-component test fixtures load it, then demos.js (generated from every
 * src/components/<n>/<n>.demo.js), which registers each demo through
 * SG.demo().
 *
 * ── Writing a demo (src/components/<n>/<n>.demo.js) ──────────────────
 *
 *   SG.demo('<n>', {
 *     title: 'Date picker',                  // the page and drawer title
 *     group: 'forms',                        // as meta.json "group"
 *     need: 'Pick one date or a range',      // one line: what it is for
 *     lead: '…',                             // optional: a longer intro under the title
 *     options: {                             // what the options panel offers (all optional)
 *       variants: ['outlined', 'filled'],    //   look modifiers; render() reads h.variant
 *       sizes: true,                         //   true (xs…xl) or a list, e.g. ['sm', 'md', 'lg']
 *       density: true,                       //   true or a list of comfortable, compact, dense, tight
 *       tones: true,                         //   true (all six) or a list; render() may read h.tone
 *       shape: true,                         //   true or a list of square, soft, default, round
 *     },
 *     render: function (h) { return '…markup…'; },
 *     wire: function (root, h) { … }         // optional; may return a cleanup function
 *   });
 *
 * render(h) returns the demo's markup as a string. It runs again when the
 * variant or the tone changes; size, density, shape, touch, the colour
 * scheme and the width only change classes and attributes around it.
 * wire(root, h) adds what a project would write itself (the docs' "the
 * page adds" part): listeners, fake data, the toast after an action. Its
 * `root` is a fresh element per render, so listeners on it go with it; a
 * function it returns runs before the next render. Behaviour that the
 * system owns (data-ds-*) needs no wiring: the page has called DS.init().
 * A checkbox in the mixed state carries data-sg-mixed in the markup: the
 * mixed state exists only as a property, so mount() sets it on the parsed
 * markup before it goes into the page (set later, the box would play its
 * dash on load in Firefox and WebKit).
 *
 * The helpers `h`, the same object for render and wire:
 *   h.icon(name, size = 20, cls)   an icon of DS.icons as markup (aria-hidden)
 *   h.esc(text)                    text escaped for markup
 *   h.uid(prefix)                  an id unique on the page ("sg-<prefix>-<n>"), for
 *                                  label/for, aria-controls and aria-labelledby
 *   h.card(title, body, extra)     a .ds-card with a title (extra: attributes as text)
 *   h.section(title, body, lead)   a titled block of the demo (states, sizes, …)
 *   h.toast(text, kind)            a snackbar through DS.overlay.toast ('success',
 *                                  'info' or 'error')
 *   h.$(selector, root), h.$$(…)   querySelector and querySelectorAll (an array)
 *   h.slow(ms)                     a demo timer's delay at the styleguide's speed
 *   h.variant, h.tone              the panel's choice (null: show every variant / no tone)
 *   h.options                      every current choice ({ size, density, shape, tone,
 *                                  variant, scheme, touch, width })
 *
 * ── The API ───────────────────────────────────────────────────────────
 *
 *   SG.demo(name, spec)            registers a demo (a second call replaces it)
 *   SG.get(name)                   its spec, or null
 *   SG.list()                      every registered spec in registration order;
 *                                  each carries its `name`
 *   SG.mount(name, stage, choice)  renders the demo into `stage` (an element) with
 *                                  the option choice applied around it, then wires
 *                                  it; returns { root, spec, update(choice), destroy() }
 *   SG.applyOptions(stage, choice) sets the option classes and attributes on `stage`
 *   SG.optionClasses(choice)       the classes a choice puts on the stage
 *   SG.choices(spec)               what the panel offers for a demo:
 *                                  { variants, sizes, density, tones, shape } as lists
 *   SG.OPTIONS                     every option value of the system (below)
 *   SG.helpers(extra)              a helper object `h` (extra: fields to add)
 *   SG.registry                    window.SG_REGISTRY (registry.js, generated from the
 *                                  meta.json files) when the page loaded it, else null
 *
 * Option classes (plans/3.0-conventions.md, sections 2 and 3): size .ds-xs …
 * .ds-xl, density .ds-density-<level>, shape .ds-shape-<level>, tone
 * .ds-tone-<tone>, touch .ds-touch; the colour scheme is data-ds-scheme on
 * the stage, which is a .ds-theme of its own (the attribute pins a
 * light-dark() theme for it and everything inside). The width is the
 * stage's inline size.
 */
(function (root) {
  'use strict';

  var DS = root.DS;
  if (!DS) throw new Error('sg-core.js: load dist/ds.js first');

  var OPTIONS = Object.freeze({
    sizes: ['xs', 'sm', 'md', 'lg', 'xl'],
    density: ['comfortable', 'compact', 'dense', 'tight'],
    shape: ['square', 'soft', 'default', 'round'],
    tones: ['neutral', 'primary', 'info', 'success', 'warning', 'error'],
    schemes: ['light', 'dark', 'auto'],
  });

  /*
   * The choice nothing has changed: no option class at all, so the stage
   * shows what the theme sets (a theme may set --ds-density or --ds-shape
   * on .ds-theme; a class on the stage would hide that). md is the size
   * without a class.
   */
  var DEFAULTS = Object.freeze({ size: null, density: null, shape: null, tone: null, variant: null, scheme: 'auto', touch: false, width: null });

  var SPEC_KEYS = ['title', 'group', 'need', 'lead', 'options', 'render', 'wire'];
  var OPTION_KEYS = ['variants', 'sizes', 'density', 'tones', 'shape'];

  var demos = {};
  var order = [];
  var ids = 0;

  var esc = function (text) {
    return String(text).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  var $ = function (selector, scope) { return (scope || document).querySelector(selector); };
  var $$ = function (selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); };

  function icon(name, size, cls) {
    var glyph = DS.icons[name];
    if (typeof glyph !== 'string') throw new Error('h.icon: no glyph "' + name + '" in DS.icons');
    return DS.icons.icon(glyph, size || 20, cls);
  }

  function uid(prefix) {
    ids += 1;
    return 'sg-' + String(prefix || 'id').replace(/[^\w-]/g, '-') + '-' + ids;
  }

  function card(title, body, extra) {
    return '<section class="ds-card"' + (extra || '') + '>' + (title ? '<h3 class="ds-card__title">' + title + '</h3>' : '') + body + '</section>';
  }

  function section(title, body, lead) {
    var id = uid('section');
    return '<section class="sg-demo-section" aria-labelledby="' + id + '"><h2 class="sg-demo-section__title" id="' + id + '">' + title + '</h2>' +
      (lead ? '<p class="sg-demo-section__lead">' + lead + '</p>' : '') + body + '</section>';
  }

  /* The snackbar region: the page's own (.ds-toasts), else DS.overlay makes one. */
  function toast(text, kind) {
    return DS.overlay.toast(DS.overlay.toastRegion(document), text, { kind: kind === true ? 'error' : kind || 'success' });
  }

  /* A demo's timer at the page's speed: --ds-time-scale (the speed select) stretches it like the motion. */
  function slow(ms) {
    var scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ds-time-scale')) || 1;
    return ms * scale;
  }

  function helpers(extra) {
    var h = { icon: icon, esc: esc, uid: uid, card: card, section: section, toast: toast, $: $, $$: $$, slow: slow, variant: null, tone: null, options: Object.assign({}, DEFAULTS) };
    if (extra) Object.keys(extra).forEach(function (key) { h[key] = extra[key]; });
    return h;
  }

  /** A list option: true means every value, a list means those values (checked), false or absent means none. */
  function listOf(value, all, where) {
    if (!value) return [];
    if (value === true) return all.slice();
    if (!Array.isArray(value)) throw new TypeError(where + ': true, false or a list');
    value.forEach(function (item) { if (all.indexOf(item) < 0) throw new TypeError(where + ': "' + item + '" is not one of ' + all.join(', ')); });
    return value.slice();
  }

  function demo(name, spec) {
    if (!/^[a-z][a-z0-9-]*$/.test(String(name))) throw new TypeError('SG.demo: the name is the component folder (got "' + name + '")');
    if (!spec || typeof spec.render !== 'function') throw new TypeError('SG.demo("' + name + '"): spec.render(h) is required');
    if (typeof spec.title !== 'string' || !spec.title) throw new TypeError('SG.demo("' + name + '"): spec.title is required');
    if (spec.wire !== undefined && typeof spec.wire !== 'function') throw new TypeError('SG.demo("' + name + '"): spec.wire is a function');
    Object.keys(spec).forEach(function (key) {
      if (SPEC_KEYS.indexOf(key) < 0) throw new TypeError('SG.demo("' + name + '"): unknown key "' + key + '" (' + SPEC_KEYS.join(', ') + ')');
    });
    Object.keys(spec.options || {}).forEach(function (key) {
      if (OPTION_KEYS.indexOf(key) < 0) throw new TypeError('SG.demo("' + name + '"): unknown option "' + key + '" (' + OPTION_KEYS.join(', ') + ')');
    });
    var entry = Object.freeze(Object.assign({ name: name, group: null, need: '', lead: '', options: {} }, spec, { name: name }));
    choices(entry); // validates the option lists
    if (!(name in demos)) order.push(name);
    demos[name] = entry;
    return entry;
  }

  function get(name) { return demos[name] || null; }
  function list() { return order.map(function (name) { return demos[name]; }); }

  /** What the panel offers for a demo, every option as a list. */
  function choices(spec) {
    var options = (spec && spec.options) || {};
    var variants = options.variants || [];
    if (!Array.isArray(variants)) throw new TypeError('SG.demo("' + spec.name + '"): options.variants is a list of names');
    return {
      variants: variants.slice(),
      sizes: listOf(options.sizes, OPTIONS.sizes, 'options.sizes'),
      density: listOf(options.density, OPTIONS.density, 'options.density'),
      tones: listOf(options.tones, OPTIONS.tones, 'options.tones'),
      shape: listOf(options.shape, OPTIONS.shape, 'options.shape'),
    };
  }

  /** The option classes of a choice (a null option adds none). */
  function optionClasses(choice) {
    var c = Object.assign({}, DEFAULTS, choice || {});
    var classes = [];
    if (c.size) classes.push('ds-' + c.size);
    if (c.density) classes.push('ds-density-' + c.density);
    if (c.shape) classes.push('ds-shape-' + c.shape);
    if (c.tone) classes.push('ds-tone-' + c.tone);
    if (c.touch) classes.push('ds-touch');
    return classes;
  }

  var OPTION_CLASS = /^ds-(xs|sm|md|lg|xl|touch|density-[\w-]+|shape-[\w-]+|tone-[\w-]+)$/;

  /** Sets the option classes, the colour scheme, the variant and the width on `stage`. */
  function applyOptions(stage, choice) {
    var c = Object.assign({}, DEFAULTS, choice || {});
    Array.prototype.slice.call(stage.classList).forEach(function (name) { if (OPTION_CLASS.test(name)) stage.classList.remove(name); });
    optionClasses(c).forEach(function (name) { stage.classList.add(name); });
    if (c.scheme === 'light' || c.scheme === 'dark') stage.setAttribute('data-ds-scheme', c.scheme);
    else stage.removeAttribute('data-ds-scheme');
    if (c.variant) stage.setAttribute('data-sg-variant', c.variant);
    else stage.removeAttribute('data-sg-variant');
    if (c.width) stage.style.setProperty('inline-size', c.width + 'px');
    else stage.style.removeProperty('inline-size');
  }

  /*
   * Renders a demo into `stage`: the stage becomes a .ds-theme (so the
   * colour scheme can be pinned on it) and gets the option classes; the
   * demo's markup goes into a fresh child, through an inert <template>
   * (no script runs, and Chromium's render block of <link rel="expect">
   * is not ended early by an <svg> parsed into the document).
   */
  function mount(name, stage, choice) {
    var spec = get(name);
    if (!spec) throw new Error('SG.mount: no demo "' + name + '" (is demos.js loaded after sg-core.js?)');
    var current = Object.assign({}, DEFAULTS, choice || {});
    var cleanup = null;
    var handle = { root: null, spec: spec, update: update, destroy: destroy, choice: function () { return Object.assign({}, current); } };
    stage.classList.add('ds-theme', 'sg-demo-stage');
    stage.setAttribute('data-sg-stage', name);

    function draw() {
      if (typeof cleanup === 'function') cleanup();
      cleanup = null;
      var h = helpers({ variant: current.variant || null, tone: current.tone || null, options: Object.assign({}, current) });
      var box = document.createElement('div');
      box.className = 'sg-demo-root';
      box.setAttribute('data-sg-demo', name);
      var template = document.createElement('template');
      template.innerHTML = spec.render(h);
      Array.prototype.forEach.call(template.content.querySelectorAll('input[data-sg-mixed]'), function (input) { input.indeterminate = true; });
      box.appendChild(template.content);
      stage.replaceChildren(box);
      handle.root = box;
      if (spec.wire) cleanup = spec.wire(box, h) || null;
    }

    function update(next) {
      var before = current;
      current = Object.assign({}, current, next || {});
      applyOptions(stage, current);
      // Variant and tone may change the markup itself.
      if (before.variant !== current.variant || before.tone !== current.tone) draw();
      return handle;
    }

    function destroy() {
      if (typeof cleanup === 'function') cleanup();
      cleanup = null;
      stage.replaceChildren();
      handle.root = null;
    }

    applyOptions(stage, current);
    draw();
    return handle;
  }

  var SG = root.SG || (root.SG = {});
  SG.demo = demo;
  SG.get = get;
  SG.list = list;
  SG.mount = mount;
  SG.applyOptions = applyOptions;
  SG.optionClasses = optionClasses;
  SG.choices = choices;
  SG.helpers = helpers;
  SG.OPTIONS = OPTIONS;
  SG.DEFAULTS = DEFAULTS;
  Object.defineProperty(SG, 'registry', { get: function () { return root.SG_REGISTRY || null; }, enumerable: true, configurable: true });
})(typeof globalThis !== 'undefined' ? globalThis : this);
