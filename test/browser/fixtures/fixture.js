/*
 * Shared page script of the browser-test fixtures (a classic script after
 * /dist/ds.js, like a project would load it). It only fills in what plain
 * HTML cannot say short:
 *
 *   <span data-icon="check" data-size="16" data-class="ds-chip__check"></span>
 *       replaced by DS.icons.icon(DS.icons.check, 16, 'ds-chip__check')
 *   <button data-replay="#box" data-classes="ds-enter ds-enter--fade">
 *       restarts those classes on #box (DS.motion.replay)
 *   <button data-toggle-class="ds-status--ok ds-status--error" data-target="#chip">
 *       swaps the classes on the live node (no re-render)
 *   [data-indicator="<active selector>"] [data-indicator-class="..."]
 *   [data-indicator-name="nav"]
 *       gets a sliding indicator (DS.indicator.createIndicator, with that
 *       view-transition `name` when given); a click on an item makes it the
 *       active one (a link with data-fx-follow loads its page instead)
 *   ?speed=0.1 in the URL
 *       slows every motion timed by the tokens down (see below)
 *
 * When everything is wired, <html> gets data-fixture-ready.
 */
(function () {
  'use strict';

  var DS = window.DS;
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };

  // Built node by node: markup such as <svg> parsed into the page before
  // a <link rel="expect"> target (mpa-a.html, mpa-b.html) makes Chromium end
  // that render block early, with a console warning.
  $$('[data-icon]').forEach(function (el) {
    var glyph = DS.icons[el.getAttribute('data-icon')];
    el.replaceWith(DS.icons.iconElement(glyph, Number(el.getAttribute('data-size') || 20), el.getAttribute('data-class') || ''));
  });

  document.addEventListener('click', function (event) {
    var replay = event.target.closest('[data-replay]');
    if (replay) {
      var box = document.querySelector(replay.getAttribute('data-replay'));
      DS.motion.replay.apply(null, [box].concat(replay.getAttribute('data-classes').split(/\s+/)));
    }
    var toggle = event.target.closest('[data-toggle-class]');
    if (toggle) {
      var node = document.querySelector(toggle.getAttribute('data-target'));
      toggle.getAttribute('data-toggle-class').split(/\s+/).forEach(function (name) { node.classList.toggle(name); });
    }
  });

  var indicators = [];
  $$('[data-indicator]').forEach(function (track) {
    var active = track.getAttribute('data-indicator');
    var attribute = /^\[([\w-]+)/.exec(active)[1];
    var value = /="([^"]*)"/.exec(active)[1];
    var indicator = DS.indicator.createIndicator(track, {
      active: active,
      className: track.getAttribute('data-indicator-class') || '',
      name: track.getAttribute('data-indicator-name') || '',
    });
    indicators.push(indicator);
    track.addEventListener('click', function (event) {
      var item = event.target.closest('a, button');
      if (!item || !track.contains(item) || item.hasAttribute('data-fx-follow')) return;
      event.preventDefault();
      $$('a, button', track).forEach(function (other) {
        if (other === item) other.setAttribute(attribute, value);
        else if (attribute === 'aria-pressed') other.setAttribute(attribute, 'false');
        else other.removeAttribute(attribute);
      });
      indicator.update();
    });
  });
  window.fixtureIndicators = indicators;

  // ?speed=<factor> (1 or less): like the styleguide (setSpeed() in
  // helpers/motion.js), --ds-time-scale = 1 / factor on <html>, above every
  // .ds-theme of the fixture, so every duration and delay token stretches.
  var speed = Number(new URLSearchParams(location.search).get('speed'));
  if (speed > 0 && speed < 1) {
    document.documentElement.setAttribute('data-fx-speed', String(speed));
    document.documentElement.style.setProperty('--ds-time-scale', String(1 / speed));
  }

  document.documentElement.setAttribute('data-fixture-ready', '');
}());
