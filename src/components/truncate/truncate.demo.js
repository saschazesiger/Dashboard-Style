/*
 * The Truncate demo: the three positions at a width the reader can change,
 * a path link, a file list, two lines in a card, and a text the page
 * changes. Registered through SG.demo() (styleguide/sg-core.js).
 */
var TRUNC_TEXTS = [
  ['end', 'Replace the toner of every printer on the second floor before Friday'],
  ['start', '/devices/north-building/floor-2/printers/printer-7'],
  ['middle', 'inventory-export-2026-11-04-final-reviewed-by-ada.csv']
];

SG.demo('truncate', {
  title: 'Truncate',
  group: 'content',
  need: 'Cut a long text at its end, start or middle with an ellipsis and show it whole in a tooltip',
  lead: 'A text too long for its place is cut where it hurts least: at its end, its start (a path) or its middle (a file name). While it is cut, the whole text is in a tooltip; a screen reader always reads it whole.',
  options: { sizes: false, density: false, shape: false, tones: false },

  render: function (h) {
    var id = h.uid('trunc-width');
    return h.section('Positions', '<div class="ds-card"><div class="ds-field"><label class="ds-field__label" for="' + id + '">Width</label><input class="ds-slider" id="' + id + '" type="range" min="120" max="560" value="260" style="--ds-share: .32" data-demo="width"></div>' +
        '<div data-demo="box" style="inline-size: 260px; display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--ds-space-3)">' + TRUNC_TEXTS.map(function (row) {
          return '<div><p class="ds-muted" style="margin: 0">' + row[0] + '</p><span class="ds-truncate" data-ds-truncate="' + row[0] + '" tabindex="0" data-demo="' + row[0] + '">' + row[1] + '</span></div>';
        }).join('') + '</div></div>', 'Drag the width: the start and the middle are cut again on every resize. Each one here takes focus, so its tooltip shows from the keyboard.') +
      h.section('In a list', '<div class="ds-card" style="max-inline-size: 360px"><ul class="ds-list" aria-label="Exports">' +
        ['device-inventory-north-building-2026-11.csv', 'tickets-closed-by-ada-lovelace-october.xlsx', 'short.pdf'].map(function (name) {
          return '<li class="ds-list__item">' + h.icon('file', 20, 'ds-list__icon') + '<span class="ds-list__text"><a class="ds-list__title ds-truncate" data-ds-truncate="middle" href="#' + name + '">' + name + '</a></span></li>';
        }).join('') + '</ul></div>', 'A link may be the .ds-truncate itself: its name stays whole, focus shows the tooltip.') +
      h.section('Two lines', '<div class="ds-card" style="max-inline-size: 320px"><p class="ds-truncate ds-truncate--lines">Every printer on the second floor reports low toner. Replace the cartridges, then reset the counters in the device page so the alerts stop.</p></div>', 'CSS alone: up to --ds-truncate-lines lines, then the end is cut. Where all of it matters, use expandable text.') +
      h.section('A text the page changes', '<div class="ds-card" style="max-inline-size: 300px"><span class="ds-truncate" data-ds-truncate="middle" data-demo="live">backup-2026-11-04.tar.gz</span><div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="rename">Rename</button></div></div>') +
      h.section('Keyboard', '<p class="ds-muted">A cut link or button shows the whole text in its tooltip on focus; <kbd class="ds-kbd">Esc</kbd> hides it.</p>');
  },

  wire: function (root, h) {
    var box = h.$('[data-demo="box"]', root);
    var onInput = function (event) {
      if (!event.target.matches('[data-demo="width"]')) return;
      box.style.inlineSize = event.target.value + 'px';
      event.target.style.setProperty('--ds-share', ((event.target.value - 120) / 440).toFixed(3));
    };
    var long = false;
    var onClick = function (event) {
      if (!event.target.closest('[data-demo="rename"]')) return;
      long = !long;
      window.DS.get(h.$('[data-demo="live"]', root), 'truncate').set(long ? 'backup-of-every-device-in-the-north-building-2026-11-04.tar.gz' : 'backup-2026-11-04.tar.gz');
    };
    root.addEventListener('input', onInput);
    root.addEventListener('click', onClick);
    return function () { root.removeEventListener('input', onInput); root.removeEventListener('click', onClick); };
  }
});
