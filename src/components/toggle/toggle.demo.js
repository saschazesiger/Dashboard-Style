/*
 * The Toggle demo: single toggles in every look, a single-choice group, a
 * connected multiple-choice group, the blocked states and the events the
 * page hears. Registered through SG.demo() (styleguide/sg-core.js). The
 * look of the groups follows the variant of the options panel; size,
 * density, shape and touch come from the panel around the demo.
 */
var LOOKS = ['outlined', 'quiet', 'filled', 'tonal'];

function swap(h, name) {
  return '<span class="ds-icon-swap"><span class="ds-icon-swap__a">' + h.icon(name, 16) + '</span><span class="ds-icon-swap__b">' + h.icon('check', 16) + '</span></span>';
}

SG.demo('toggle', {
  title: 'Toggle button',
  group: 'actions',
  need: 'Turn an option on or off with a button, or pick one or several in a set of toggle buttons',
  lead: 'A button that stays on or off (aria-pressed), and a set of them where one or several are on. On is the fill plus a check or a filled glyph, never the colour alone.',
  options: { variants: LOOKS, sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var look = h.variant || 'outlined';
    var cls = 'ds-btn ds-btn--' + look;
    var icons = (h.variant ? [h.variant] : LOOKS).map(function (name) {
      return '<button class="ds-btn ds-btn--' + name + ' ds-btn--icon" type="button" aria-pressed="' + (name === 'filled' || name === 'outlined' ? 'true' : 'false') + '" aria-label="Pin (' + name + ')" data-tip="Pin (' + name + ')" data-ds-toggle>' + h.icon('pin', 20, 'ds-icon--fillable') + '</button>';
    }).join('');
    return h.section('One toggle', '<div class="sg-row" data-demo="single">' +
      '<button class="' + cls + '" type="button" aria-pressed="false" data-ds-toggle data-demo="only-open">' + swap(h, 'filter') + 'Only open</button>' +
      '<button class="' + cls + '" type="button" aria-pressed="true" data-ds-toggle>' + swap(h, 'eye') + 'Show offline</button>' +
      '</div><div class="sg-row" data-demo="icons">' + icons +
      '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-pressed="false" aria-label="Star" data-tip="Star" data-ds-toggle>' + h.icon('star', 20, 'ds-icon--fillable') + '</button>' +
      '</div>', 'Icon toggles in the standard (quiet), filled, tonal and outlined looks: a filled or tonal one shows the neutral container while off. The glyph fills while on.') +

      h.section('One of a set', '<div class="ds-toggle-group" role="toolbar" aria-label="View" data-ds-toggle-group="single" data-ds-toggle-group-required data-demo="view">' +
        '<button class="' + cls + '" type="button" aria-pressed="true" value="list">' + swap(h, 'list') + 'List</button>' +
        '<button class="' + cls + '" type="button" aria-pressed="false" value="grid">' + swap(h, 'layoutGrid') + 'Grid</button>' +
        '<button class="' + cls + '" type="button" aria-pressed="false" value="board">' + swap(h, 'kanban') + 'Board</button>' +
        '</div><p class="ds-meta" data-demo="view-out">View: list</p>', 'data-ds-toggle-group="single" with -required: one is always on. A role="toolbar": one tab stop, the arrow keys move between the buttons, Space presses, Tab comes back to the one that is on.') +

      h.section('Several of a set, connected', '<div class="ds-toggle-group ds-btn-group" role="toolbar" aria-label="Format" data-ds-toggle-group="multiple" data-ds-value="bold" data-demo="format">' +
        '<button class="' + cls + ' ds-btn--icon" type="button" aria-pressed="false" value="bold" aria-label="Bold" data-tip="Bold">' + h.icon('bold', 20) + '</button>' +
        '<button class="' + cls + ' ds-btn--icon" type="button" aria-pressed="false" value="italic" aria-label="Italic" data-tip="Italic">' + h.icon('italic', 20) + '</button>' +
        '<button class="' + cls + ' ds-btn--icon" type="button" aria-pressed="false" value="code" aria-label="Code" data-tip="Code">' + h.icon('code', 20) + '</button>' +
        '<button class="' + cls + ' ds-btn--icon" type="button" aria-pressed="false" value="quote" aria-label="Quote" data-tip="Quote">' + h.icon('quote', 20) + '</button>' +
        '</div><p class="ds-meta" data-demo="format-out">Format: bold</p>', 'data-ds-toggle-group="multiple" with .ds-btn-group: one pill outline. data-ds-value="bold" sets the start.') +

      h.section('Filters, none required', '<div class="ds-toggle-group" role="group" aria-label="Status" data-ds-toggle-group="single">' +
        '<button class="' + cls + '" type="button" aria-pressed="false" value="open">' + swap(h, 'circleDot') + 'Open</button>' +
        '<button class="' + cls + '" type="button" aria-pressed="false" value="waiting">' + swap(h, 'hourglass') + 'Waiting</button>' +
        '<button class="' + cls + '" type="button" aria-pressed="false" value="closed">' + swap(h, 'checkCircle') + 'Closed</button>' +
        '</div>', 'Single without -required: pressing the button that is on turns it off again. A role="group": every button is a tab stop of its own.') +

      h.section('States', '<div class="sg-row">' +
        '<button class="' + cls + '" type="button" aria-pressed="false" disabled>' + swap(h, 'bell') + 'Disabled</button>' +
        '<button class="' + cls + '" type="button" aria-pressed="true" disabled>' + swap(h, 'bell') + 'Disabled, on</button>' +
        '<button class="' + cls + '" type="button" aria-pressed="false" aria-disabled="true" data-tip="Only an owner can mute this device" data-ds-toggle>' + swap(h, 'bellOff') + 'Mute</button>' +
        '<div role="group" aria-label="Was this helpful?" class="ds-toggle-group">' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-pressed="true" aria-disabled="true" aria-label="Helpful">' + h.icon('thumbUp', 20, 'ds-icon--fillable') + '</button>' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-pressed="false" aria-disabled="true" aria-label="Not helpful">' + h.icon('thumbDown', 20, 'ds-icon--fillable') + '</button></div>' +
        '</div>', 'aria-disabled stays focusable, so its tooltip can say why; a choice made once keeps its on look.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches a toggle (in a toolbar: the one that is on); <kbd class="ds-kbd">Space</kbd> or <kbd class="ds-kbd">Enter</kbd> presses it; in a toolbar <kbd class="ds-kbd">←</kbd> <kbd class="ds-kbd">→</kbd> <kbd class="ds-kbd">Home</kbd> <kbd class="ds-kbd">End</kbd> move between the buttons.</p>');
  },

  wire: function (root, h) {
    var view = h.$('[data-demo="view"]', root);
    var format = h.$('[data-demo="format"]', root);
    root.addEventListener('ds:change', function (event) {
      if (event.target === view) h.$('[data-demo="view-out"]', root).textContent = 'View: ' + event.detail.value;
      if (event.target === format) h.$('[data-demo="format-out"]', root).textContent = 'Format: ' + (event.detail.value.join(', ') || 'none');
    });
  },
});
