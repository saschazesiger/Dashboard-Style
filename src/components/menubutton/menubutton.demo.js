/*
 * The Menu button demo: actions behind a labelled button, a choice that
 * shows what was picked, the icon-only trigger and the blocked states.
 * Registered through SG.demo() (styleguide/sg-core.js). The variant picks
 * the button's look; size, density, shape and touch come from the panel.
 */
var LOOKS = ['outlined', 'filled', 'tonal', 'quiet', 'text'];

function menuOf(h, id, label, items) {
  return '<div class="ds-menu" id="' + id + '" role="menu" aria-label="' + label + '"' + (items.radio ? ' data-ds-menu-checks' : '') + ' hidden>' + items.list.map(function (item) {
    if (items.radio) {
      return '<button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="' + (item[2] ? 'true' : 'false') + '" value="' + item[0] + '">' +
        h.icon('check', 20, 'ds-menu__check') + '<span class="ds-menu__label">' + item[1] + '</span></button>';
    }
    return '<button class="ds-menu__item" role="menuitem" type="button" data-demo-item="' + item[1] + '">' + h.icon(item[0], 20) + '<span class="ds-menu__label">' + item[1] + '</span></button>';
  }).join('') + '</div>';
}

SG.demo('menubutton', {
  title: 'Menu button',
  group: 'actions',
  need: 'Open a menu of actions or choices from a button with a chevron, and show the choice',
  lead: 'A button that opens a menu. Its chevron turns while the menu is open; with radio items it shows what was chosen.',
  options: { variants: LOOKS, sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var look = h.variant || 'outlined';
    var cls = 'ds-btn ds-menu-btn' + (look === 'outlined' ? '' : ' ds-btn--' + look);
    var chevron = h.icon('chevronDown', 16, 'ds-chevron ds-menu-btn__chevron');
    var exportMenu = h.uid('export');
    var sortMenu = h.uid('sort');
    var rowMenu = h.uid('row');
    var lockedMenu = h.uid('locked');
    var looks = h.variant ? [look] : LOOKS;
    return h.section('Actions', '<div class="sg-row">' + looks.map(function (name, index) {
      var id = index ? h.uid('export') : exportMenu;
      var classes = 'ds-btn ds-menu-btn' + (name === 'outlined' ? '' : ' ds-btn--' + name);
      return '<button class="' + classes + '" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="' + id + '" data-ds-menubutton="#' + id + '"' + (index ? '' : ' data-demo="export"') + '>' + h.icon('download', 16) + 'Export' + chevron + '</button>' +
        menuOf(h, id, 'Export', { list: [['fileSpreadsheet', 'CSV'], ['fileJson', 'JSON'], ['printer', 'Print']] });
    }).join('') + '</div>', h.variant ? '' : 'Any look of the button: outlined, filled, tonal, quiet and text.') +

      h.section('A choice', '<div class="sg-row">' +
        '<button class="' + cls + '" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="' + sortMenu + '" data-ds-menubutton="#' + sortMenu + '" data-demo="sort">Sort: <span class="ds-menu-btn__value">Name</span>' + chevron + '</button>' +
        menuOf(h, sortMenu, 'Sort by', { radio: true, list: [['name', 'Name', true], ['seen', 'Last seen'], ['owner', 'Owner'], ['serial', 'Serial number']] }) +
        '<span class="ds-meta" data-demo="sort-out">Sorted by name</span></div>',
        'Radio items make it a choice: the button shows the checked label and sends ds:change.') +

      h.section('Icon only', '<div class="sg-row">' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="More actions" data-tip="More actions" aria-haspopup="menu" aria-expanded="false" aria-controls="' + rowMenu + '" data-ds-menubutton="#' + rowMenu + '">' + h.icon('moreVertical', 20) + '</button>' +
        menuOf(h, rowMenu, 'Ticket actions', { list: [['pencil', 'Edit'], ['duplicate', 'Duplicate'], ['archive', 'Archive']] }) +
        '</div>', 'No chevron and no class of its own: .ds-btn--icon with data-ds-menubutton.') +

      h.section('States', '<div class="sg-row">' +
        '<button class="' + cls + '" type="button" disabled>Export' + chevron + '</button>' +
        '<button class="' + cls + '" type="button" aria-disabled="true" data-tip="Select a device first" aria-haspopup="menu" aria-expanded="false" aria-controls="' + lockedMenu + '" data-ds-menubutton="#' + lockedMenu + '">Move to' + chevron + '</button>' +
        menuOf(h, lockedMenu, 'Move to', { list: [['folder', 'Archive']] }) +
        '</div>', 'A blocked menu button never opens; aria-disabled keeps it focusable, so its tooltip can say why.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Enter</kbd>, <kbd class="ds-kbd">Space</kbd> or <kbd class="ds-kbd">↓</kbd> open the menu on its first item, <kbd class="ds-kbd">↑</kbd> on its last; <kbd class="ds-kbd">Escape</kbd> closes it and focus comes back to the button.</p>');
  },

  wire: function (root, h) {
    root.addEventListener('ds:change', function (event) {
      if (event.target.getAttribute('data-demo') === 'sort') h.$('[data-demo="sort-out"]', root).textContent = 'Sorted by ' + event.detail.item.textContent.trim().toLowerCase();
    });
    root.addEventListener('click', function (event) {
      var item = event.target.closest('[data-demo-item]');
      if (item) h.toast(item.getAttribute('data-demo-item') + ': done.', 'success');
    });
  },
});
