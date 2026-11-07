/*
 * The Bottom sheet demo: filters with two detents (half and full), and a
 * short sheet of actions that is as tall as its content. Opening, the
 * detents, the drag and the dismiss come from the system
 * (data-ds-bottomsheet); wire() holds what a project writes: the count.
 */
var BS_TYPES = ['Laptops', 'Desktops', 'Tablets', 'Phones', 'Printers', 'Monitors', 'Docking stations', 'Headsets', 'Keyboards', 'Routers'];

SG.demo('bottomsheet', {
  title: 'Bottom sheet',
  group: 'overlays',
  need: 'Show a short task or details from the bottom edge on a phone, with heights to rest at and a drag to dismiss',
  lead: 'A modal sheet that rises from the bottom edge: drag its handle or head between its heights, or down to dismiss it. On a wide screen it stays at most 640px wide and centred. The options panel changes density and shape around it.',
  options: { sizes: false, density: true, shape: true, tones: false },

  render: function (h) {
    var filters = h.uid('bs-filters');
    var actions = h.uid('bs-actions');
    return h.section('Detents', '<div class="sg-row"><button class="ds-btn" type="button" data-ds-open="#' + filters + '" aria-haspopup="dialog" aria-expanded="false">' + h.icon('filter', 18) + 'Filters</button></div>' +
      '<dialog class="ds-sheet ds-bottomsheet" id="' + filters + '" aria-labelledby="' + filters + '-title" data-ds-bottomsheet data-ds-bottomsheet-detents="0.5 1" data-demo="filters">' +
      '<div class="ds-sheet__backdrop" data-ds-close></div><section class="ds-sheet__panel ds-bottomsheet__panel">' +
      '<button class="ds-bottomsheet__handle" type="button" aria-label="Resize the filters"></button>' +
      '<div class="ds-sheet__head"><div class="ds-sheet__heading"><h2 class="ds-sheet__title" id="' + filters + '-title">Filters</h2>' +
      '<p class="ds-sheet__subtitle" aria-live="polite" data-demo="count">240 devices</p></div>' +
      '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>' + h.icon('close', 20) + '</button></div>' +
      '<div class="ds-sheet__body" tabindex="0" role="region" aria-label="Device types">' + BS_TYPES.map(function (type, index) {
        return '<label class="ds-check"><input type="checkbox" name="type" value="' + h.esc(type) + '"' + (index < 3 ? ' checked' : '') + '><span>' + h.esc(type) + '</span></label>';
      }).join('') + '</div>' +
      '<div class="ds-sheet__foot"><button class="ds-btn ds-btn--text" type="button" data-demo="reset">Reset</button>' +
      '<button class="ds-btn ds-btn--filled" type="button" data-ds-close>Show devices</button></div></section></dialog>',
      'It opens at half height; drag the handle or the head up to the full height, or down to dismiss. The handle is a button too: Enter, Space and the arrow keys change the height.') +

      h.section('As tall as its content', '<div class="sg-row"><button class="ds-btn" type="button" data-ds-open="#' + actions + '" aria-haspopup="dialog" aria-expanded="false">Actions for LAPTOP-0042</button></div>' +
        '<dialog class="ds-sheet ds-bottomsheet" id="' + actions + '" aria-labelledby="' + actions + '-title" data-ds-bottomsheet data-demo="actions">' +
        '<div class="ds-sheet__backdrop" data-ds-close></div><section class="ds-sheet__panel ds-bottomsheet__panel">' +
        '<button class="ds-bottomsheet__handle" type="button" aria-label="Resize the sheet"></button>' +
        '<div class="ds-sheet__head"><h2 class="ds-sheet__title" id="' + actions + '-title">LAPTOP-0042</h2></div>' +
        '<div class="ds-sheet__body"><div role="group" aria-label="Actions">' +
        '<button class="ds-menu__item" type="button" data-ds-close>' + h.icon('pencil', 20) + '<span class="ds-menu__label">Edit</span></button>' +
        '<button class="ds-menu__item" type="button" data-ds-close>' + h.icon('userPlus', 20) + '<span class="ds-menu__label">Hand over</span></button>' +
        '<button class="ds-menu__item" type="button" data-ds-close>' + h.icon('archive', 20) + '<span class="ds-menu__label">Archive</span></button></div></div>' +
        '</section></dialog>',
        'Without detents the sheet is as tall as its content; a drag down still dismisses it.') +

      h.section('Keyboard', '<p class="ds-muted">Focus moves to the handle and <kbd class="ds-kbd">Tab</kbd> stays inside; on the handle <kbd class="ds-kbd">Enter</kbd>, <kbd class="ds-kbd">Space</kbd>, <kbd class="ds-kbd">↑</kbd> and <kbd class="ds-kbd">↓</kbd> change the height, and each height is said; <kbd class="ds-kbd">Escape</kbd> closes and focus goes back to the button.</p>');
  },

  wire: function (root, h) {
    var sheet = h.$('[data-demo="filters"]', root);
    var count = h.$('[data-demo="count"]', root);
    var update = function () {
      var checked = h.$$('input[name="type"]:checked', sheet).length;
      count.textContent = (checked * 24) + ' devices';
    };
    sheet.addEventListener('change', update);
    h.$('[data-demo="reset"]', root).addEventListener('click', function () {
      h.$$('input[name="type"]', sheet).forEach(function (input) { input.checked = false; });
      update();
    });
    update();
    return function () {
      for (const open of root.querySelectorAll('dialog[open]')) open.close();
    };
  },
});
