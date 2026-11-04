/*
 * The App frame demo: a small frame of its own (top bar, drawer with nested
 * groups and a pinned foot, one panel), its parts one by one, the segmented
 * switch and the avatar. Registered through SG.demo() (styleguide/sg-core.js).
 * Size, density, shape and touch come from the options panel around it; the
 * rail's toggle and the modal drawer are what a project wires itself.
 */
function item(h, glyph, label, extra, count) {
  return '<a class="ds-drawer__item" href="#" data-tip="' + h.esc(label) + '"' + (extra || '') + '>' + h.icon(glyph, 20) +
    '<span class="ds-drawer__label">' + label + '</span>' +
    (count ? '<span class="ds-drawer__count"><span class="ds-sr">, </span>' + count + '</span>' : '') + '</a>';
}

function toggle(h, label, count) {
  return '<summary class="ds-drawer__heading ds-drawer__toggle" data-tip="' + h.esc(label) + '">' + h.icon('chevronDown', 20, 'ds-chevron') + '<span>' + label + '</span>' +
    (count ? '<span class="ds-drawer__count" aria-hidden="true">' + count + '</span>' : '') + '</summary>';
}

function drawer(h, attributes) {
  return '<nav class="ds-drawer" aria-label="Sample navigation" tabindex="-1" data-demo="drawer"' + attributes + '>' +
    '<div class="ds-drawer__head" aria-hidden="true"><span class="ds-brand__name">Product</span></div>' +
    '<div class="ds-drawer__back">' + item(h, 'arrowLeft', 'All sites') + '</div>' +
    '<div class="ds-drawer__actions"><button class="ds-btn ds-btn--tonal" type="button">' + h.icon('plus', 18) + 'New ticket</button></div>' +
    '<div class="ds-drawer__list" data-demo="list">' +
      '<div class="ds-drawer__group"><p class="ds-drawer__heading">Inventory</p>' +
        item(h, 'home', 'Overview', ' aria-current="page"') + item(h, 'laptop', 'Devices', '', 128) +
      '</div>' +
      '<details class="ds-drawer__group ds-collapsible" open>' + toggle(h, 'Tickets', 5) +
        item(h, 'ticket', 'Open', '', 3) +
        '<div class="ds-drawer__row">' + item(h, 'clock', 'Waiting', '', 2) +
          '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm ds-drawer__action ds-hover-actions" type="button" aria-label="Options for Waiting" data-tip="Options">' + h.icon('moreVertical', 18) + '</button></div>' +
        '<details class="ds-drawer__group ds-collapsible" open>' + toggle(h, 'Archive') +
          item(h, 'history', 'This year') +
          '<details class="ds-drawer__group ds-collapsible">' + toggle(h, 'Earlier') + item(h, 'folder', '2025') + item(h, 'folder', '2024') + '</details>' +
        '</details>' +
      '</details>' +
      '<div class="ds-drawer__group"><p class="ds-drawer__heading">Blocked</p>' +
        '<a class="ds-drawer__item" href="#" aria-disabled="true" data-tip="Ask an administrator">' + h.icon('users', 20) + '<span class="ds-drawer__label">People</span></a>' +
      '</div>' +
    '</div>' +
    '<div class="ds-drawer__foot ds-drawer__foot--pinned">' + item(h, 'settings', 'Settings') + item(h, 'info', 'Help') + '</div>' +
  '</nav>';
}

function account(h) {
  return '<div class="ds-account ds-account--capsule">' +
    '<div class="ds-account__text" aria-hidden="true"><div class="ds-account__name">Ada Lovelace</div><div class="ds-account__email">ada@example.org</div></div>' +
    '<span class="ds-account__avatar" role="img" aria-label="Ada Lovelace, ada@example.org" tabindex="0" data-tip="Ada Lovelace, ada@example.org">A</span>' +
    '<span class="ds-account__divider"></span><button class="ds-btn ds-btn--text" type="button">Sign out</button></div>';
}

function frame(h) {
  var view = h.uid('view');
  // A frame inside the styleguide's own frame: its parts keep out of the page's View Transitions,
  // whose names (ds-drawer, ds-panel, ds-view) may each sit on one element only. A project never needs this.
  var unnamed = ' style="view-transition-name: none;"';
  return '<div style="overflow: hidden; border: 1px solid var(--ds-line); border-radius: var(--ds-radius-card);">' +
    '<div class="ds-app ds-app--drawer" data-demo="app" style="--ds-viewport-height: 560px;">' +
    '<a class="ds-skip" href="#' + view + '">Skip to content</a>' +
    '<div class="ds-topbar">' +
      '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-topbar__menu" type="button" aria-label="Menu" aria-expanded="false" aria-pressed="false" data-demo="menu">' + h.icon('menu', 20) + '</button>' +
      '<a class="ds-brand" href="#"><span class="ds-brand__name">Product</span></a>' +
      '<div class="ds-topbar__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Help" data-tip="Help">' + h.icon('info', 20) + '</button></div>' +
      account(h) +
    '</div>' +
    '<div class="ds-scrim" data-demo="scrim"></div>' +
    drawer(h, unnamed) +
    '<div class="ds-panel" data-demo="panel"' + unnamed + '>' +
      '<div class="ds-view" id="' + view + '" tabindex="-1" data-demo="view"' + unnamed + '><div class="ds-content"><div class="ds-page">' +
        '<header class="ds-page-head"><h3 class="ds-page-head__title">Overview</h3><p class="ds-page-head__lead">One white panel, the only scroller of the frame. Scroll it: the top bar tints and the hairline shows.</p></header>' +
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

function bar(inner) {
  return '<div style="overflow: hidden; margin-block-end: var(--ds-space-3); border-radius: var(--ds-radius-card); background: var(--ds-backdrop);"><div class="ds-topbar" style="min-height: var(--ds-topbar-height); padding-inline: var(--ds-space-4) var(--ds-space-2);">' + inner + '</div></div>';
}

SG.demo('shell', {
  title: 'App frame',
  group: 'navigation',
  need: 'Frame an app: top bar, navigation drawer, content panel, account and banners',
  lead: 'A top bar and a navigation drawer on the tinted backdrop, one white content panel that is the only scroller. At 900px and below the drawer is modal; above it, the menu button toggles the rail. Hover never expands the rail. The options panel changes the rows and the switch: the frame itself is layout.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('The frame', frame(h),
      'Nested groups (three levels), a group that closes, counts, an item with an action, a blocked item, a pinned foot. The menu button toggles the rail above 900px and opens the modal drawer below.') +

      h.section('Top bar parts',
        bar('<a class="ds-brand" href="#"><span class="ds-brand__name">Product</span></a><h3 class="ds-topbar__title">LAPTOP-0042</h3>' +
          '<div class="ds-topbar__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Settings" data-tip="Settings">' + h.icon('settings', 20) + '</button></div>') +
        bar('<a class="ds-brand" href="#"><span class="ds-brand__name">Product</span></a>' +
          '<div class="ds-topbar__search"><div class="ds-search">' + h.icon('search', 20) + '<input class="ds-input" type="search" aria-label="Search devices" placeholder="Search devices"><kbd class="ds-kbd ds-search__key" aria-hidden="true">/</kbd></div></div>' +
          account(h)),
        'A title, or a search centred in the bar (hidden below 720px), icon actions with tooltips, and the account as a capsule.') +

      h.section('Segmented switch',
        '<div class="sg-row"><nav class="ds-segmented" aria-label="Report" data-demo="segmented" data-active="current"><a class="ds-segmented__option" href="#" aria-current="true" data-label="Live">Live</a><a class="ds-segmented__option" href="#" data-label="Admin">Admin</a><a class="ds-segmented__option" href="#" data-label="Reports">Reports</a></nav>' +
        '<div class="ds-segmented" role="radiogroup" aria-label="View" data-demo="segmented" data-active="checked">' + radio('List', true) + radio('Chart', false) + radio('Map', false, true) + '</div></div>',
        'Links in a nav move between modes; buttons (role="radio") change the view of one page, one tab stop with the arrow keys. Map is aria-disabled: it keeps its focus and says why.') +

      h.section('Avatar',
        '<div class="sg-row" style="align-items: center;">' +
          ['ds-xs', 'ds-sm', 'ds-md', 'ds-lg', 'ds-xl'].map(function (size) { return '<span class="ds-avatar ' + size + '" role="img" aria-label="Ada Lovelace">A</span>'; }).join('') +
        '</div>', 'The same disc anywhere: a size class on it or an ancestor; the shape multiplies its radius. No status dot: a status goes next to the name as a word.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the skip link first, then each link of the bar and the drawer; <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> opens a group. In the modal drawer the focus stays inside and <kbd class="ds-kbd">Esc</kbd> closes it, back to the menu button.</p>');
  },

  wire: function (root, h) {
    var app = h.$('[data-demo="app"]', root);
    var list = h.$('[data-demo="list"]', root);
    var menu = h.$('[data-demo="menu"]', root);
    var handles = [
      DS.indicator.createIndicator(list, { active: '[aria-current="page"]', className: 'ds-drawer__indicator', reveal: true }),
      DS.dom.scrollEdges(list, { axis: 'block' }),
      DS.dom.watchScrolled(h.$('[data-demo="view"]', root), app),
    ];
    h.$$('[data-demo="segmented"]', root).forEach(function (group) {
      var buttons = group.getAttribute('data-active') === 'checked';
      handles.push(DS.indicator.createIndicator(group, { active: buttons ? '[aria-checked="true"]' : '[aria-current="true"]', className: 'ds-segmented__indicator' }));
      if (buttons) handles.push(DS.dom.roving(group, { items: '.ds-segmented__option' }));
    });

    var wide = matchMedia('(min-width: 901px)');
    menu.addEventListener('click', function () {
      if (!wide.matches) { DS.overlay.open(h.$('[data-demo="drawer"]', root), { opener: menu }); return; }
      var collapsed = !app.hasAttribute('data-drawer-collapsed');
      app.toggleAttribute('data-drawer-collapsed', collapsed);
      menu.setAttribute('aria-pressed', String(collapsed));
    });

    root.addEventListener('click', function (event) {
      var link = event.target.closest('a[href="#"]');
      if (link) event.preventDefault();
      var option = event.target.closest('.ds-segmented__option');
      if (option && option.getAttribute('aria-disabled') !== 'true') {
        var name = option.hasAttribute('role') ? 'aria-checked' : 'aria-current';
        h.$$('.ds-segmented__option', option.parentNode).forEach(function (other) {
          if (name === 'aria-checked') other.setAttribute(name, String(other === option));
          else if (other === option) other.setAttribute(name, 'true');
          else other.removeAttribute(name);
        });
      }
      var row = event.target.closest('.ds-drawer__list .ds-drawer__item');
      if (row && row.getAttribute('aria-disabled') !== 'true') {
        h.$$('.ds-drawer__item', list).forEach(function (other) {
          if (other === row) other.setAttribute('aria-current', 'page');
          else other.removeAttribute('aria-current');
        });
        if (app.hasAttribute('data-drawer-open')) DS.overlay.close(h.$('[data-demo="drawer"]', root));
      }
    });

    return function () { handles.forEach(function (handle) { if (handle && handle.destroy) handle.destroy(); }); };
  },
});
