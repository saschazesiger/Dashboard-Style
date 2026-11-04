/*
 * The Menu demo: the overflow menu of a row, groups with headings, check and
 * radio items, descriptions, shortcuts, a danger item and a blocked one.
 * Opening, the keys and the flipped checks come from the system (data-ds-open,
 * data-ds-menu-checks); wire() holds only the message after an action.
 */
function item(h, icon, label, extra, attrs) {
  return '<button class="ds-menu__item' + (extra || '') + '" role="menuitem" type="button"' + (attrs || '') + '>' + h.icon(icon, 20) +
    '<span class="ds-menu__label">' + label + '</span></button>';
}

function check(h, role, label, checked) {
  return '<button class="ds-menu__item" role="' + role + '" type="button" aria-checked="' + checked + '">' + h.icon('check', 20, 'ds-menu__check') +
    '<span class="ds-menu__label">' + label + '</span></button>';
}

SG.demo('menu', {
  title: 'Menu',
  group: 'overlays',
  need: 'Offer the actions of one item, or the overflow of a toolbar, from a button',
  lead: 'A list of actions that grows out of its button. The options panel changes the rows through size, density, touch and shape; the danger item is the one that carries a tone, always with its label.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var plain = h.uid('actions');
    var rich = h.uid('rich');
    var picks = h.uid('picks');
    var sort = h.uid('sort');
    return h.section('Actions', '<div class="sg-row">' +
      '<button class="ds-btn" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="' + plain + '" data-ds-open="#' + plain + '" data-demo="plain">' + h.icon('moreVertical', 16) + 'Actions</button></div>' +
      '<div class="ds-menu" role="menu" id="' + plain + '" aria-label="Actions" hidden data-demo="actions">' +
      item(h, 'pencil', 'Edit', '', ' data-toast="Opened the record."') +
      item(h, 'copy', 'Duplicate', '', ' data-toast="Duplicated as LAPTOP-0043."') +
      item(h, 'archive', 'Archive', '', ' data-toast="Archived."') +
      '<div class="ds-menu__divider" role="separator"></div>' +
      item(h, 'trash', 'Delete (needs admin rights)', '', ' aria-disabled="true"') +
      item(h, 'trash', 'Delete device', ' ds-menu__item--danger', ' data-toast="Deleted LAPTOP-0042."') +
      '</div>') +

      h.section('Descriptions and shortcuts', '<div class="sg-row">' +
        '<button class="ds-btn" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="' + rich + '" data-ds-open="#' + rich + '" data-demo="rich">Export</button></div>' +
        '<div class="ds-menu" role="menu" id="' + rich + '" aria-label="Export" hidden data-demo="export">' +
        '<button class="ds-menu__item" role="menuitem" type="button" aria-keyshortcuts="Control+E">' + h.icon('download', 20) +
        '<span class="ds-menu__content"><span class="ds-menu__label">Download</span><span class="ds-menu__description">A CSV file with every column.</span></span>' +
        '<span class="ds-menu__shortcut">Ctrl E</span></button>' +
        '<button class="ds-menu__item" role="menuitem" type="button" aria-keyshortcuts="Control+L">' + h.icon('link', 20) +
        '<span class="ds-menu__content"><span class="ds-menu__label">Copy link</span><span class="ds-menu__description">Anyone with access can open it.</span></span>' +
        '<span class="ds-menu__shortcut">Ctrl L</span></button></div>') +

      h.section('Groups, check and radio items', '<div class="sg-row">' +
        '<button class="ds-btn" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="' + picks + '" data-ds-open="#' + picks + '" data-demo="picks">' + h.icon('settings', 16) + 'Sort and view</button></div>' +
        '<div class="ds-menu" role="menu" id="' + picks + '" aria-label="Sort and view" hidden data-ds-menu-checks data-demo="checks">' +
        '<div role="group" aria-labelledby="' + sort + '"><p class="ds-menu__heading" id="' + sort + '">Sort by</p>' +
        check(h, 'menuitemradio', 'Name', true) + check(h, 'menuitemradio', 'Last seen', false) + check(h, 'menuitemradio', 'Owner', false) + '</div>' +
        '<div class="ds-menu__divider" role="separator"></div>' +
        check(h, 'menuitemcheckbox', 'Compact rows', true) + check(h, 'menuitemcheckbox', 'Show retired', false) +
        '<div class="ds-menu__divider" role="separator"></div>' +
        '<button class="ds-menu__item" role="menuitem" type="button">' + h.icon('download', 20) + '<span class="ds-menu__label">Export the list</span><span class="ds-menu__meta"><kbd class="ds-kbd">Ctrl</kbd> <kbd class="ds-kbd">E</kbd></span></button></div>',
        'With data-ds-menu-checks the system moves the checks and sends ds:change. The meta slot at an item\'s end (.ds-menu__meta) holds keys or a state word.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">ArrowDown</kbd> on the button opens on the first item, <kbd class="ds-kbd">ArrowUp</kbd> on the last. The arrows, <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd> move, a letter jumps, <kbd class="ds-kbd">Escape</kbd> closes and focus is back on the button, <kbd class="ds-kbd">Tab</kbd> closes and moves on. A blocked item keeps its focus, so its name is read.</p>');
  },

  wire: function (root, h) {
    root.addEventListener('click', function (event) {
      var row = event.target.closest('[data-toast]');
      if (row && row.getAttribute('aria-disabled') !== 'true') h.toast(row.getAttribute('data-toast'), 'info');
    });
  },
});
