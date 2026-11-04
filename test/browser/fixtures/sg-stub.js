/*
 * A small standalone SG for the per-component fixture page
 * (/test/browser/fixtures/component.html?c=<name>, which serve.js writes):
 * the minimal surface of the styleguide's demo API that every
 * src/components/<name>/<name>.demo.js relies on (plans/3.0-conventions.md,
 * section 7), so a component's spec renders its demo alone, without the
 * styleguide shell.
 *
 *   SG.demo(name, { render(h), wire(root, h), ...more })
 *       registers a demo; `render` returns its markup, the optional `wire`
 *       does what a project would write itself. Every other field (title,
 *       group, need, options ...) is the styleguide's business and is kept
 *       untouched in SG.demos.
 *   h = { icon(name, size, cls), esc(text), uid(prefix), card(title, body), section(title, body) }
 *       the helpers render() and wire() receive.
 *   SG.mount(root, { only })
 *       renders every registered demo (or only the one named `only`) into
 *       root, one <div data-sg-demo="<name>"> each, then calls its wire().
 *
 * The page then runs DS.init(document) and fixture.js marks
 * data-fixture-ready. A classic script in the ES5 style of the
 * styleguide; it reads DS from the page (dist/ds.js loaded before it).
 */
(function (root) {
  'use strict';

  var demos = [];
  var counter = 0;
  var esc = function (text) {
    return String(text).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  var h = {
    icon: function (name, size, cls) {
      var glyph = root.DS.icons[name];
      if (!glyph) throw new Error('SG stub: no icon ' + name);
      return root.DS.icons.icon(glyph, size || 20, cls || '');
    },
    esc: esc,
    uid: function (prefix) {
      counter += 1;
      return (prefix || 'sg') + '-' + counter;
    },
    card: function (title, body) {
      return '<div class="ds-card"><h3 class="ds-card__title">' + esc(title) + '</h3>' + (body || '') + '</div>';
    },
    section: function (title, body) {
      return '<section class="fx-section"><h2>' + esc(title) + '</h2>' + (body || '') + '</section>';
    },
  };

  /* Markup through an inert <template>, as the styleguide does. */
  function setHtml(element, html) {
    var template = document.createElement('template');
    template.innerHTML = html;
    element.replaceChildren(template.content);
  }

  root.SG = {
    demos: demos,
    h: h,
    demo: function (name, definition) {
      if (typeof name !== 'string' || !name) throw new Error('SG.demo(name, definition): a name');
      if (!definition || typeof definition.render !== 'function') throw new Error('SG.demo(' + name + '): render(h) is a function');
      if ('wire' in definition && typeof definition.wire !== 'function') throw new Error('SG.demo(' + name + '): wire(root, h) is a function');
      demos.push({ name: name, definition: definition });
    },
    mount: function (container, options) {
      var only = options && options.only;
      var chosen = demos.filter(function (demo) { return !only || demo.name === only; });
      if (!chosen.length) throw new Error('SG stub: no demo' + (only ? ' named ' + only : '') + ' registered');
      chosen.forEach(function (demo) {
        var box = document.createElement('div');
        box.setAttribute('data-sg-demo', demo.name);
        container.appendChild(box);
        setHtml(box, demo.definition.render(h));
        if (demo.definition.wire) demo.definition.wire(box, h);
      });
      return chosen.length;
    },
  };
}(typeof globalThis !== 'undefined' ? globalThis : this));
