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
    var nested = h.uid('nested');
    var move = h.uid('move');
    var share = h.uid('share');
    var assign = h.uid('assign');
    var context = h.uid('context');
    var people = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Katherine Johnson', 'Margaret Hamilton', 'Radia Perlman', 'Barbara Liskov', 'Frances Allen', 'Edsger Dijkstra', 'Donald Knuth', 'Hedy Lamarr', 'John von Neumann'];
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

      h.section('Submenus', '<div class="sg-row">' +
        '<button class="ds-btn" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="' + nested + '" data-ds-open="#' + nested + '" data-demo="nested">' + h.icon('moreVertical', 16) + 'Device</button></div>' +
        '<div class="ds-menu" role="menu" id="' + nested + '" aria-label="Device" hidden data-demo="nested-menu">' +
        item(h, 'pencil', 'Rename', '', ' data-toast="Renamed."') +
        '<button class="ds-menu__item" role="menuitem" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="' + move + '" data-demo="move-item">' + h.icon('folder', 20) +
        '<span class="ds-menu__label">Move to</span>' + h.icon('chevronRight', 20, 'ds-menu__chevron') + '</button>' +
        '<div class="ds-menu" role="menu" id="' + move + '" aria-label="Move to" hidden data-demo="move-menu">' +
        item(h, 'folder', 'Storage room', '', ' data-toast="Moved to the storage room."') + item(h, 'folder', 'Front desk', '', ' data-toast="Moved to the front desk."') +
        '<button class="ds-menu__item" role="menuitem" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="' + share + '" data-demo="share-item">' + h.icon('users', 20) +
        '<span class="ds-menu__label">A person</span>' + h.icon('chevronRight', 20, 'ds-menu__chevron') + '</button>' +
        '<div class="ds-menu" role="menu" id="' + share + '" aria-label="A person" hidden data-demo="share-menu">' +
        item(h, 'user', 'Ada Lovelace', '', ' data-toast="Handed to Ada Lovelace."') + item(h, 'user', 'Alan Turing', '', ' data-toast="Handed to Alan Turing."') + '</div></div>' +
        item(h, 'archive', 'Archive', '', ' data-toast="Archived."') +
        '<div class="ds-menu__divider" role="separator"></div>' +
        item(h, 'trash', 'Delete device', ' ds-menu__item--danger', ' data-toast="Deleted LAPTOP-0042."') + '</div>',
        'ArrowRight, Enter or Space opens a submenu, ArrowLeft and Escape close it. A mouse resting on the item opens it; a diagonal path to it keeps it open.') +

      h.section('Search inside a long menu', '<div class="sg-row">' +
        '<button class="ds-btn" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="' + assign + '" data-ds-open="#' + assign + '" data-demo="assign">' + h.icon('user', 16) + 'Assign</button></div>' +
        '<div class="ds-menu" role="menu" id="' + assign + '" aria-label="Assign to" hidden data-demo="assign-menu">' +
        '<div class="ds-menu__search">' + h.icon('search', 20) + '<input type="search" aria-label="Search people" placeholder="Search" autocomplete="off"></div>' +
        people.map(function (name) { return item(h, 'user', name, '', ' data-toast="Assigned to ' + name + '."'); }).join('') + '</div>',
        'Typing filters the items; ArrowDown moves into them, Enter takes the first match, Escape clears the field first.') +

      h.section('Context menu', '<div class="ds-list" role="list" aria-label="Devices" data-demo="rows">' +
        ['LAPTOP-0042', 'LAPTOP-0043', 'PRINTER-0007'].map(function (name) {
          return '<div class="ds-list__item ds-pressable ds-pressable--inset" role="listitem" tabindex="0" data-ds-contextmenu="#' + context + '" data-device="' + name + '" aria-describedby="' + context + '-hint">' +
            h.icon(name.indexOf('PRINTER') === 0 ? 'printer' : 'laptop', 20) + '<span>' + name + '</span></div>';
        }).join('') + '</div>' +
        '<div class="ds-tiles" role="list" aria-label="Device groups" data-demo="tiles" style="margin-top:var(--ds-space-3)">' +
        [['Laptops', '42', 'LAPTOP group'], ['Printers', '7', 'PRINTER group']].map(function (entry) {
          return '<div class="ds-tile" role="listitem" tabindex="0" data-ds-contextmenu="#' + context + '" data-device="' + entry[2] + '" aria-describedby="' + context + '-hint">' +
            '<p class="ds-tile__label">' + h.icon(entry[0] === 'Printers' ? 'printer' : 'laptop', 16) + '<span>' + entry[0] + '</span></p>' +
            '<p class="ds-tile__value">' + entry[1] + '</p></div>';
        }).join('') + '</div>' +
        '<p class="ds-muted" id="' + context + '-hint">Right-click a row or a tile, press and hold it, or focus it and press Shift+F10.</p>' +
        '<div class="ds-menu" role="menu" id="' + context + '" aria-label="Device actions" hidden data-demo="context-menu">' +
        '<p class="ds-menu__heading" data-row-name>Device</p>' +
        item(h, 'pencil', 'Rename', '', ' data-act="Renamed"') + item(h, 'copy', 'Duplicate', '', ' data-act="Duplicated"') +
        '<div class="ds-menu__divider" role="separator"></div>' +
        item(h, 'trash', 'Delete device', ' ds-menu__item--danger', ' data-act="Deleted"') + '</div>') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">ArrowDown</kbd> on the button opens on the first item, <kbd class="ds-kbd">ArrowUp</kbd> on the last. The arrows, <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd> move, a letter jumps, <kbd class="ds-kbd">Escape</kbd> closes and focus is back on the button, <kbd class="ds-kbd">Tab</kbd> closes and moves on. A blocked item keeps its focus, so its name is read.</p>');
  },

  wire: function (root, h) {
    var device = null;
    root.addEventListener('click', function (event) {
      var row = event.target.closest('[data-toast]');
      if (row && row.getAttribute('aria-disabled') !== 'true') h.toast(row.getAttribute('data-toast'), 'info');
      var act = event.target.closest('[data-act]');
      if (act && device) h.toast(act.getAttribute('data-act') + ' ' + device + '.', 'info');
    });
    // The context menu fits its heading to the row it opens for.
    root.addEventListener('ds:contextmenu', function (event) {
      device = event.target.getAttribute('data-device');
      var heading = event.detail.menu.querySelector('[data-row-name]');
      if (heading) heading.textContent = device;
    });
  },
});
