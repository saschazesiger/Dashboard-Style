/*
 * The Utilities demo: the text helpers, the press model on a project's own
 * element, actions on demand, keys, dividers and icons that fill. The
 * options panel's touch and shape reach .ds-pressable and .ds-kbd; the rest
 * have no height or meaning of their own. What a project writes itself: the
 * keys of its pressable row and the stale data.
 */
var ROWS = ['LAPTOP-0042', 'LAPTOP-0017', 'MONITOR-0007'];

SG.demo('utilities', {
  title: 'Utilities',
  group: 'layout',
  need: 'Small helpers: the theme root, screen-reader text, dividers, numerals, keys and bigger touch targets',
  lead: 'Shared helper classes. The options panel changes the shape and touch of those that have a target or a radius.',
  options: { sizes: false, density: false, shape: true, tones: false },

  render: function (h) {
    return h.section('Text', '<div class="ds-stack" data-demo="text">' +
        '<p class="ds-muted">.ds-muted: quieter body text, for notes and descriptions, 1284 devices.</p>' +
        '<p class="ds-meta">' + h.icon('clock', 16) + 'Synced 09:12: .ds-meta, a meta line with a leading icon.</p>' +
        '<p>Visually hidden text follows<span class="ds-sr"> and a screen reader reads it</span>.</p>' +
        '<p class="ds-center">.ds-center: centred text.</p><p class="ds-num">1,284 .ds-num</p>' +
        '<p>A value and its unit: <span class="ds-nowrap">512 GB</span>.</p></div>') +

      h.section('Stale', '<div data-demo="stale"><ul class="ds-plain-list" aria-busy="false" data-demo="stale-list"><li>Laptop 14, synced today</li><li>Laptop 16, synced yesterday</li></ul><div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="refresh">' + h.icon('sync', 16) + 'Refresh</button></div></div>',
        '.ds-stale dims only after the loader delay, so a fast answer never dims; the fresh values come at once.') +

      h.section('A pressable element of your own', '<ul class="ds-plain-list" data-demo="pressable">' +
        ROWS.map(function (name) { return '<li><div class="ds-pressable" role="button" tabindex="0" data-demo="row" style="padding:var(--ds-space-2)">' + name + '</div></li>'; }).join('') +
        '<li><div class="ds-pressable ds-pressable--lg" role="button" tabindex="0" data-demo="row" style="padding:var(--ds-space-2)">.ds-pressable--lg: the larger hover layer</div></li>' +
        '<li><div class="ds-pressable ds-pressable--inset" role="button" tabindex="0" data-demo="row" style="padding:var(--ds-space-2)">.ds-pressable--inset: the ring inside the edge</div></li>' +
        '<li><div class="ds-pressable" role="button" tabindex="0" aria-disabled="true" style="padding:var(--ds-space-2)">aria-disabled: no layer, no ripple, keeps the focus</div></li>' +
        '<li><div class="ds-pressable" role="button" tabindex="0" aria-busy="true" style="padding:var(--ds-space-2)">aria-busy: no layer, no ripple</div></li>' +
        '</ul>') +

      h.section('Actions on demand', '<table class="ds-table" data-demo="actions"><tbody>' + ROWS.map(function (name, index) {
        return '<tr class="ds-hover-host"><td>' + name + '</td><td class="ds-num"><span class="ds-hover-actions"' + (index === 2 ? ' data-ds-shown' : '') + '><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Edit ' + name + '">' + h.icon('pencil', 18) + '</button></span></td></tr>';
      }).join('') + '</tbody></table>', 'Point at a row or Tab into it; the third carries data-ds-shown. On touch screens and under .ds-touch they always show.') +

      h.section('Keys', '<p data-demo="keys"><kbd class="ds-kbd">Ctrl</kbd> <kbd class="ds-kbd">K</kbd> opens the search.</p>') +

      h.section('Dividers', '<div class="ds-stack" data-demo="dividers"><hr class="ds-divider"><hr class="ds-divider ds-divider--inset"><div class="sg-row">Left<span class="ds-divider ds-divider--vertical" role="separator" aria-orientation="vertical"></span>Right</div><div class="ds-divider ds-divider--label" role="separator"><span>Today</span></div></div>') +

      h.section('Icons that fill', '<div class="sg-row" data-demo="icons"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Helpful" aria-pressed="false" data-demo="fill">' + h.icon('thumbUp', 20, 'ds-icon--fillable') + '</button><span aria-hidden="true">' + h.icon('thumbUp', 20, 'ds-icon--filled') + '</span></div>', 'Fills while its control is on (aria-pressed).') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches a pressable element and a row\'s actions; <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> press it, which the page wires.</p>');
  },

  wire: function (root, h) {
    root.addEventListener('click', function (event) {
      var target = event.target.closest('[data-demo]');
      if (!target) return;
      var kind = target.getAttribute('data-demo');
      if (kind === 'row') h.toast('Opened ' + target.textContent + '.', 'info');
      if (kind === 'fill') target.setAttribute('aria-pressed', String(target.getAttribute('aria-pressed') !== 'true'));
      if (kind === 'refresh') {
        var list = h.$('[data-demo="stale-list"]', root);
        list.classList.add('ds-stale');
        list.setAttribute('aria-busy', 'true');
        setTimeout(function () {
          list.classList.remove('ds-stale');
          list.setAttribute('aria-busy', 'false');
        }, h.slow(900));
      }
    });
    root.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      var row = event.target.closest('[data-demo="row"]');
      if (!row) return;
      event.preventDefault();
      row.click();
    });
  },
});
