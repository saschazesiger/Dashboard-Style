/*
 * The App frame demo: a small frame of its own (top bar with the search,
 * the app launcher, the notification slot and the account menu; a drawer
 * with a filter, nested groups and a pinned foot; one panel whose page head
 * folds its breadcrumbs), its parts one by one, the segmented switch and
 * the avatar. Registered through SG.demo() (styleguide/sg-core.js). Size,
 * density, shape and touch come from the options panel around it; the
 * behaviour is DS.shell's (data-ds-shell, data-ds-drawer,
 * data-ds-search-sheet, data-ds-launcher, data-ds-scheme-switch,
 * data-ds-breadcrumbs): wire() only does what a page does (aria-current,
 * the results of a search, a snackbar after an action).
 */
var DEVICES = ['LAPTOP-0042', 'LAPTOP-0017', 'LAPTOP-0108', 'DESKTOP-0009', 'PRINTER-0003', 'ROUTER-0001', 'TABLET-0021'];

function item(h, glyph, label, extra, count, badge) {
  return '<a class="ds-drawer__item" href="#" data-tip="' + h.esc(label) + '"' + (extra || '') + '>' + h.icon(glyph, 20) +
    '<span class="ds-drawer__label">' + label + '</span>' +
    (count ? '<span class="ds-drawer__count"><span class="ds-sr">, </span>' + count + '</span>' : '') +
    (badge ? '<span class="ds-badge"><span class="ds-sr">, </span>' + badge + '<span class="ds-sr"> new</span></span>' : '') + '</a>';
}

function toggle(h, label, count) {
  return '<summary class="ds-drawer__heading ds-drawer__toggle" data-tip="' + h.esc(label) + '">' + h.icon('chevronDown', 20, 'ds-chevron') + '<span>' + label + '</span>' +
    (count ? '<span class="ds-drawer__count" aria-hidden="true">' + count + '</span>' : '') + '</summary>';
}

function drawer(h, attributes) {
  return '<nav class="ds-drawer" aria-label="Sample navigation" tabindex="-1" data-demo="drawer" data-ds-drawer="sg-demo"' + attributes + '>' +
    '<div class="ds-drawer__head" aria-hidden="true"><span class="ds-brand__name">Product</span></div>' +
    '<div class="ds-drawer__back">' + item(h, 'arrowLeft', 'All sites') + '</div>' +
    '<div class="ds-drawer__actions"><button class="ds-btn ds-btn--tonal" type="button" data-tip="New ticket">' + h.icon('plus', 18) + '<span class="ds-drawer__label">New ticket</span></button></div>' +
    '<div class="ds-drawer__search"><div class="ds-search">' + h.icon('filter', 20) + '<input class="ds-input" type="search" aria-label="Filter the navigation" placeholder="Filter"></div></div>' +
    '<div class="ds-drawer__list" data-demo="list">' +
      '<div class="ds-drawer__group"><p class="ds-drawer__heading">Inventory</p>' +
        item(h, 'home', 'Overview', ' aria-current="page"') + item(h, 'laptop', 'Devices', '', 128) + item(h, 'bell', 'Updates', '', 0, 4) +
      '</div>' +
      '<details class="ds-drawer__group ds-collapsible" id="sg-demo-tickets" open>' + toggle(h, 'Tickets', 5) +
        item(h, 'ticket', 'Open', '', 3) +
        '<div class="ds-drawer__row">' + item(h, 'clock', 'Waiting', '', 2) +
          '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm ds-drawer__action ds-hover-actions" type="button" aria-label="Options for Waiting" data-tip="Options">' + h.icon('moreVertical', 18) + '</button></div>' +
        '<details class="ds-drawer__group ds-collapsible" id="sg-demo-archive" open>' + toggle(h, 'Archive') +
          item(h, 'history', 'This year') +
          '<details class="ds-drawer__group ds-collapsible" id="sg-demo-earlier">' + toggle(h, 'Earlier') + item(h, 'folder', '2025') + item(h, 'folder', '2024') + '</details>' +
        '</details>' +
      '</details>' +
      '<div class="ds-drawer__group"><p class="ds-drawer__heading">Blocked</p>' +
        '<a class="ds-drawer__item" href="#" aria-disabled="true" data-tip="Ask an administrator">' + h.icon('users', 20) + '<span class="ds-drawer__label">People</span></a>' +
      '</div>' +
    '</div>' +
    '<div class="ds-drawer__foot ds-drawer__foot--pinned">' + item(h, 'settings', 'Settings') + item(h, 'info', 'Help') + '</div>' +
  '</nav>';
}

/* The account menu: the avatar opens it; the name and email in its head name the menu; the theme switch pins the frame's scheme. */
function accountMenu(h) {
  var menu = h.uid('account');
  var name = h.uid('account-name');
  var email = h.uid('account-email');
  var heading = h.uid('scheme');
  var radio = function (value, glyph, label) {
    return '<button class="ds-menu__item" role="menuitemradio" type="button" aria-checked="' + (value === 'auto') + '" data-ds-scheme-value="' + value + '">' +
      h.icon('check', 20, 'ds-menu__check') + '<span class="ds-menu__label">' + label + '</span>' + h.icon(glyph, 20) + '</button>';
  };
  return '<div class="ds-account">' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-account__trigger" type="button" aria-label="Account: Ada Lovelace" aria-haspopup="menu" aria-expanded="false" aria-controls="' + menu + '" data-ds-open="#' + menu + '" data-tip="Ada Lovelace, ada@example.org" data-demo="account">' +
      '<span class="ds-account__avatar" aria-hidden="true">A</span></button>' +
    '<div class="ds-menu ds-account__menu" role="menu" id="' + menu + '" aria-labelledby="' + name + ' ' + email + '" hidden>' +
      '<div class="ds-account__head" aria-hidden="true"><span class="ds-account__avatar ds-lg">A</span>' +
        '<div class="ds-account__name" id="' + name + '">Ada Lovelace</div><div class="ds-account__email" id="' + email + '">ada@example.org</div></div>' +
      '<div class="ds-menu__divider" role="separator"></div>' +
      '<div role="group" aria-labelledby="' + heading + '" data-ds-scheme-switch="sg-demo-scheme">' +
        '<p class="ds-menu__heading" id="' + heading + '">Theme</p>' +
        radio('light', 'sun', 'Light') + radio('dark', 'moon', 'Dark') + radio('auto', 'monitor', 'Device') +
      '</div>' +
      '<div class="ds-menu__divider" role="separator"></div>' +
      '<a class="ds-menu__item" role="menuitem" href="#">' + h.icon('userCircle', 20) + '<span class="ds-menu__label">Your profile</span></a>' +
      '<button class="ds-menu__item" role="menuitem" type="button" data-demo="sign-out">' + h.icon('logout', 20) + '<span class="ds-menu__label">Sign out</span></button>' +
    '</div></div>';
}

/* The app switcher: a launcher grid in a menu. */
function launcher(h) {
  var menu = h.uid('apps');
  var app = function (glyph, label, current) {
    return '<a class="ds-menu__item ds-launcher__app" role="menuitem" href="#"' + (current ? ' aria-current="true"' : '') + '>' +
      '<span class="ds-launcher__icon">' + h.icon(glyph, 24) + '</span><span class="ds-launcher__label">' + label + '</span></a>';
  };
  return '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Apps" aria-haspopup="menu" aria-expanded="false" aria-controls="' + menu + '" data-ds-open="#' + menu + '" data-tip="Apps" data-demo="apps">' + h.icon('apps', 20) + '</button>' +
    '<div class="ds-menu ds-launcher" role="menu" id="' + menu + '" aria-label="Apps" data-ds-launcher hidden>' +
      app('laptop', 'Devices', true) + app('ticket', 'Tickets') + app('users', 'People') +
      app('barChart', 'Reports') + app('calendar', 'Schedule') + app('fileText', 'Documents') +
      app('mail', 'Mail') + app('settings', 'Admin console') + app('helpCircle', 'Help') +
    '</div>';
}

/* The top bar's search: inline from 721px, a sheet below (data-ds-search-sheet). */
function search(h, id) {
  return '<div class="ds-topbar__search" id="' + id + '" data-ds-search-sheet data-demo="search">' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-topbar__search-back" type="button" aria-label="Close search" data-ds-close>' + h.icon('arrowLeft', 20) + '</button>' +
    '<div class="ds-search">' + h.icon('search', 20) + '<input class="ds-input" type="search" aria-label="Search devices" placeholder="Search devices"></div>' +
    '<div class="ds-topbar__results" data-demo="results"></div>' +
  '</div>';
}

function crumbs(label) {
  return '<nav class="ds-breadcrumbs" aria-label="' + label + '" data-ds-breadcrumbs><ol>' +
    '<li><a href="#">Home</a></li><li><a href="#">Sites</a></li><li><a href="#">Building A</a></li>' +
    '<li><a href="#">Floor 2</a></li><li><a href="#">Devices</a></li><li><a href="#" aria-current="page">LAPTOP-0042</a></li>' +
  '</ol></nav>';
}

function frame(h) {
  var view = h.uid('view');
  var searchId = h.uid('search');
  // A frame inside the styleguide's own frame: its parts keep out of the page's View Transitions,
  // whose names (ds-drawer, ds-panel, ds-view) may each sit on one element only. A project never needs this.
  var unnamed = ' style="view-transition-name: none;"';
  return '<div style="overflow: hidden; border: 1px solid var(--ds-line); border-radius: var(--ds-radius-card);">' +
    '<div class="ds-app ds-app--drawer" data-demo="app" data-ds-shell="sg-demo" style="--ds-viewport-height: 560px;">' +
    '<a class="ds-skip" href="#' + view + '">Skip to content</a>' +
    '<div class="ds-topbar">' +
      '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-topbar__menu" type="button" aria-label="Menu" aria-expanded="false" aria-pressed="false" data-demo="menu">' + h.icon('menu', 20) + '</button>' +
      '<a class="ds-brand" href="#"><span class="ds-brand__name">Product</span></a>' +
      search(h, searchId) +
      '<div class="ds-topbar__actions">' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-topbar__search-open" type="button" aria-label="Search" data-tip="Search" data-demo="search-open">' + h.icon('search', 20) + '</button>' +
        launcher(h) +
        // The notification slot: a notification centre opens from here (data-ds-open on its panel).
        '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Notifications, 3 unread" data-tip="Notifications" data-demo="bell">' + h.icon('bell', 20) +
          '<span class="ds-badge ds-badge--dot ds-tone-error" aria-hidden="true"></span></button>' +
      '</div>' +
      accountMenu(h) +
    '</div>' +
    '<div class="ds-scrim" data-demo="scrim"></div>' +
    drawer(h, unnamed) +
    '<div class="ds-panel" data-demo="panel"' + unnamed + '>' +
      '<div class="ds-view" id="' + view + '" tabindex="-1" data-demo="view"' + unnamed + '><div class="ds-content"><div class="ds-page">' +
        '<header class="ds-page-head">' + crumbs('Breadcrumb') + '<h3 class="ds-page-head__title">Overview</h3><p class="ds-page-head__lead">One white panel, the only scroller of the frame. Scroll it: the top bar tints and the hairline shows.</p></header>' +
        '<div class="ds-stack">' +
          h.card('Devices', '<p class="ds-muted">128 devices, 3 waiting for a sync.</p>') +
          h.card('Tickets', '<p class="ds-muted">3 open, 2 waiting. The drawer groups them.</p>') +
          h.card('People', '<p class="ds-muted">Grace Hopper joined on Monday.</p>') +
          h.card('Sites', '<p class="ds-muted">Building A and Building B.</p>') +
        '</div>' +
      '</div></div></div>' +
    '</div></div></div>';
}

function radio(text, on, blocked) {
  return '<button class="ds-segmented__option" type="button" role="radio" aria-checked="' + on + '"' + (on ? '' : ' tabindex="-1"') +
    (blocked ? ' aria-disabled="true" data-tip="No map for this site"' : '') + ' data-label="' + text + '">' + text + '</button>';
}

function bar(inner, extra) {
  return '<div style="overflow: hidden; margin-block-end: var(--ds-space-3); border-radius: var(--ds-radius-card); background: var(--ds-backdrop);"' + (extra || '') + '><div class="ds-topbar" style="min-height: var(--ds-topbar-height); padding-inline: var(--ds-space-4) var(--ds-space-2);">' + inner + '</div></div>';
}

function capsule(h) {
  return '<div class="ds-account ds-account--capsule">' +
    '<div class="ds-account__text" aria-hidden="true"><div class="ds-account__name">Ada Lovelace</div><div class="ds-account__email">ada@example.org</div></div>' +
    '<span class="ds-account__avatar" role="img" aria-label="Ada Lovelace, ada@example.org" tabindex="0" data-tip="Ada Lovelace, ada@example.org">A</span>' +
    '<span class="ds-account__divider"></span><button class="ds-btn ds-btn--text" type="button">Sign out</button></div>';
}

SG.demo('shell', {
  title: 'App frame',
  group: 'navigation',
  need: 'Frame an app: top bar with search, launcher and account menu, navigation drawer, content panel, breadcrumbs and banners',
  lead: 'A top bar and a navigation drawer on the tinted backdrop, one white content panel that is the only scroller. At 900px and below the drawer is modal; above it, the menu button toggles the rail, remembered. Hover never expands the rail. Below 720px the search becomes a sheet. The options panel changes the rows and the switch: the frame itself is layout.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('The frame', frame(h) +
      '<div class="sg-row"><button class="ds-btn ds-sm" type="button" aria-pressed="false" data-demo="foot-rail">The foot as a row of icons</button></div>',
      'A filter, nested groups (three levels, remembered open or closed), counts, a badge, an item with an action, a blocked item, a pinned foot. The menu button toggles the rail above 900px and opens the modal drawer below; the top bar holds the search (a sheet below 720px), the app launcher, the notification slot and the account menu with the theme switch; the page head folds its breadcrumbs.') +

      h.section('Breadcrumbs that fold',
        '<div data-demo="crumbs-box" style="inline-size: 100%; min-inline-size: 160px; max-inline-size: 100%; padding: var(--ds-space-3); border: 1px dashed var(--ds-line-2); border-radius: var(--ds-radius-sm); resize: horizontal; overflow: hidden;">' + crumbs('Breadcrumb, resizable') + '</div>' +
        '<div style="inline-size: 280px; max-inline-size: 100%; margin-block-start: var(--ds-space-3); padding: var(--ds-space-3); border: 1px dashed var(--ds-line-2); border-radius: var(--ds-radius-sm);">' + crumbs('Breadcrumb, narrow') + '</div>',
        'Drag the corner of the first box: the middle folds into a menu first, then the first crumb, then the parent; the current page stays. The "more" button opens a menu of the folded crumbs.') +

      h.section('Top bar parts',
        bar('<a class="ds-brand" href="#"><span class="ds-brand__name">Product</span></a><h3 class="ds-topbar__title">LAPTOP-0042</h3>' +
          '<div class="ds-topbar__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Settings" data-tip="Settings">' + h.icon('settings', 20) + '</button></div>') +
        bar('<a class="ds-brand" href="#"><span class="ds-brand__name">Product</span></a>' +
          '<div class="ds-topbar__search"><div class="ds-search">' + h.icon('search', 20) + '<input class="ds-input" type="search" aria-label="Search sites" placeholder="Search sites"><kbd class="ds-kbd ds-search__key" aria-hidden="true">/</kbd></div></div>' +
          capsule(h), ' data-demo="capsule"'),
        'A title, or a search centred in the bar, icon actions with tooltips, and the account as a capsule (without a menu: the avatar names the person, the button signs out).') +

      h.section('Segmented switch',
        '<div class="sg-row"><nav class="ds-segmented" aria-label="Report" data-demo="segmented" data-active="current"><a class="ds-segmented__option" href="#" aria-current="true" data-label="Live">Live</a><a class="ds-segmented__option" href="#" data-label="Admin">Admin</a><a class="ds-segmented__option" href="#" data-label="Reports">Reports</a></nav>' +
        '<div class="ds-segmented" role="radiogroup" aria-label="View" data-demo="segmented" data-active="checked">' + radio('List', true) + radio('Chart', false) + radio('Map', false, true) + '</div></div>',
        'Links in a nav move between modes; buttons (role="radio") change the view of one page, one tab stop with the arrow keys. Map is aria-disabled: it keeps its focus and says why.') +

      h.section('Segmented with icons and counts',
        '<div class="sg-row"><div class="ds-segmented" role="radiogroup" aria-label="Tickets" data-demo="segmented" data-active="checked">' +
          [['inbox', 'Open', 12], ['clock', 'Waiting', 3]].map(function (entry, index) {
            return '<button class="ds-segmented__option" type="button" role="radio" aria-checked="' + (index === 0) + '"' + (index ? ' tabindex="-1"' : '') + ' data-label="' + entry[1] + '">' + h.icon(entry[0], 18) + entry[1] +
              (entry[2] ? '<span class="ds-segmented__count"><span class="ds-sr">, </span>' + entry[2] + '</span>' : '') + '</button>';
          }).join('') + '</div>' +
        '<div class="ds-segmented" role="radiogroup" aria-label="Layout" data-demo="segmented" data-active="checked">' +
          [['list', 'List'], ['layoutGrid', 'Grid'], ['map', 'Map']].map(function (entry, index) {
            return '<button class="ds-segmented__option" type="button" role="radio" aria-checked="' + (index === 0) + '"' + (index ? ' tabindex="-1"' : '') + ' aria-label="' + entry[1] + '" data-tip="' + entry[1] + '">' + h.icon(entry[0], 18) + '</button>';
          }).join('') + '</div></div>',
        'An icon before the label and a count after it, read with the label; an option that is only an icon is named by aria-label and shows a tooltip. The options panel changes the size, density and shape.') +

      h.section('Avatar',
        '<div class="sg-row" style="align-items: center;">' +
          ['ds-xs', 'ds-sm', 'ds-md', 'ds-lg', 'ds-xl'].map(function (size) { return '<span class="ds-avatar ' + size + '" role="img" aria-label="Ada Lovelace">A</span>'; }).join('') +
        '</div>', 'The same disc anywhere: a size class on it or an ancestor; the shape multiplies its radius. No status dot: a status goes next to the name as a word.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the skip link first, then each link of the bar and the drawer; in the drawer <kbd class="ds-kbd">↑</kbd> <kbd class="ds-kbd">↓</kbd>, <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd> move between the items and <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> opens a group; <kbd class="ds-kbd">↓</kbd> from the filter goes to the first match and <kbd class="ds-kbd">Esc</kbd> clears it. The launcher moves in two dimensions with the arrow keys. In the modal drawer and the search sheet the focus stays inside and <kbd class="ds-kbd">Esc</kbd> closes them, back to their button.</p>');
  },

  wire: function (root, h) {
    var app = h.$('[data-demo="app"]', root);
    var list = h.$('[data-demo="list"]', root);
    var handles = [];
    h.$$('[data-demo="segmented"]', root).forEach(function (group) {
      var buttons = group.getAttribute('data-active') === 'checked';
      handles.push(DS.indicator.create(group, { active: buttons ? '[aria-checked="true"]' : '[aria-current="true"]', className: 'ds-segmented__indicator' }));
      if (buttons) handles.push(DS.dom.roving(group, { items: '.ds-segmented__option' }));
    });

    // The search: the page renders its own results (here a filter over sample devices).
    var input = h.$('[data-demo="search"] input', root);
    var results = h.$('[data-demo="results"]', root);
    input.addEventListener('input', function () {
      var query = input.value;
      var found = query ? DEVICES.filter(function (name) { return DS.shell.matchText(name, query); }) : [];
      DS.dom.morphHtml(results, found.length
        ? '<ul class="ds-list ds-list--interactive" aria-label="Devices">' + found.map(function (name) {
          return '<li class="ds-list__item" data-ds-key="' + name + '">' + h.icon(name.indexOf('LAPTOP') === 0 ? 'laptop' : 'monitor', 20, 'ds-list__icon') +
            '<span class="ds-list__text"><span class="ds-list__title"><a class="ds-list__action" href="#">' + name + '</a></span><span class="ds-list__meta">Building A</span></span></li>';
        }).join('') + '</ul>'
        : (query ? '<p class="ds-muted" role="status">No devices match.</p>' : ''));
    });

    root.addEventListener('click', function (event) {
      var link = event.target.closest('a[href="#"]');
      if (link) event.preventDefault();
      var footRail = event.target.closest('[data-demo="foot-rail"]');
      if (footRail) {
        var asRow = footRail.getAttribute('aria-pressed') !== 'true';
        footRail.setAttribute('aria-pressed', String(asRow));
        h.$('[data-demo="drawer"] .ds-drawer__foot', root).classList.toggle('ds-drawer__foot--rail', asRow);
      }
      var option = event.target.closest('.ds-segmented__option');
      if (option && option.getAttribute('aria-disabled') !== 'true') {
        var name = option.hasAttribute('role') ? 'aria-checked' : 'aria-current';
        h.$$('.ds-segmented__option', option.parentNode).forEach(function (other) {
          if (name === 'aria-checked') other.setAttribute(name, String(other === option));
          else if (other === option) other.setAttribute(name, 'true');
          else other.removeAttribute(name);
        });
      }
      // The page says where it is; DS.shell closes the modal drawer after a choice.
      var row = event.target.closest('.ds-drawer__list .ds-drawer__item');
      if (row && row.getAttribute('aria-disabled') !== 'true') {
        h.$$('.ds-drawer__item', list).forEach(function (other) {
          if (other === row) other.setAttribute('aria-current', 'page');
          else other.removeAttribute('aria-current');
        });
      }
      if (event.target.closest('[data-demo="sign-out"]')) h.toast('Signed out (a page would sign out here).', 'info');
      if (event.target.closest('[data-demo="bell"]')) h.toast('The notification centre opens here.', 'info');
      var tile = event.target.closest('.ds-launcher__app');
      if (tile) h.toast('Opening ' + tile.textContent.trim() + '.', 'info');
    });

    return function () { handles.forEach(function (handle) { if (handle && handle.destroy) handle.destroy(); }); };
  },
});
