/*
 * The Saved views demo: a list of devices with a filter bar, a sort control
 * and a choice of columns, and the views above them: three built in (All
 * devices, the default; Offline; Laptops by storage), the user's own saved
 * through the menu, and the address that carries the current one (with the
 * prefix dv., so the page's own parameters stay). The system keeps the
 * views (data-ds-views); wire() is the page: it applies a view's state to
 * its controls on ds:view, and tells the views its state after every change.
 */
var DEVICES = [
  ['LAPTOP-0042', 'laptop', 'online', 512, 'Ada Lovelace', 3],
  ['LAPTOP-0043', 'laptop', 'offline', 256, 'Grace Hopper', 40],
  ['DESKTOP-0007', 'desktop', 'online', 1024, 'Ada Lovelace', 1],
  ['DESKTOP-0011', 'desktop', 'maintenance', 2048, 'Alan Turing', 12],
  ['TABLET-0113', 'tablet', 'online', 128, 'Grace Hopper', 0],
  ['TABLET-0114', 'tablet', 'offline', 64, 'Ada Lovelace', 90],
  ['PHONE-0021', 'phone', 'online', 256, 'Alan Turing', 2],
  ['SERVER-0002', 'server', 'online', 4096, 'Alan Turing', 0],
  ['SERVER-0003', 'server', 'offline', 8192, 'Grace Hopper', 7],
].map(function (row, index) {
  return { id: 'd' + index, name: row[0], kind: row[1], status: row[2], storage: row[3], owner: row[4], seen: row[5] };
});

var ICONS = { laptop: 'laptop', desktop: 'monitor', tablet: 'tablet', phone: 'smartphone', server: 'server' };
var STATUS = { online: ['Online', 'checkCircle', 'success'], offline: ['Offline', 'wifiOff', 'neutral'], maintenance: ['Maintenance', 'wrench', 'warning'] };
var COLUMNS = [['owner', 'Owner'], ['storage', 'Storage'], ['seen', 'Last seen']];

function viewItem(h, id, name, attrs) {
  return '<button class="ds-menu__item" role="menuitemradio" aria-checked="false" type="button" data-ds-view="' + id + '"' + (attrs || '') + '>' +
    h.icon('check', 20, 'ds-menu__check') + '<span class="ds-menu__label">' + name + '</span></button>';
}

function action(h, kind, glyph, label, danger) {
  return '<button class="ds-menu__item' + (danger ? ' ds-menu__item--danger' : '') + '" role="menuitem" type="button" data-ds-views-action="' + kind + '">' +
    h.icon(glyph, 20) + '<span class="ds-menu__label">' + label + '</span></button>';
}

function viewsHtml(h) {
  var menu = h.uid('views-menu');
  return '<div class="ds-views" data-ds-views data-ds-views-key="sg-demo-devices" data-ds-views-url="sync" data-ds-views-prefix="dv.">' +
    '<button class="ds-btn ds-views__trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="' + menu + '" data-ds-open="#' + menu + '">' +
    h.icon('layers', 20) + '<span class="ds-sr">View: </span><span class="ds-views__name"></span><span class="ds-views__edited" hidden></span>' + h.icon('chevronDown', 20, 'ds-views__chevron') + '</button>' +
    '<button class="ds-btn ds-btn--text ds-views__save" type="button" hidden>Save view</button>' +
    '<div class="ds-menu" id="' + menu + '" role="menu" aria-label="Views" hidden>' +
    '<div class="ds-views__list" role="group" aria-label="Views">' +
    viewItem(h, 'all', 'All devices', ' data-ds-view-default data-ds-view-state="sort=name&amp;cols=owner,storage,seen"') +
    viewItem(h, 'offline', 'Offline', ' data-ds-view-state="status=offline&amp;sort=-seen&amp;cols=owner,storage,seen"') +
    viewItem(h, 'laptops', 'Laptops by storage', ' data-ds-view-state="kind=laptop&amp;sort=-storage&amp;cols=owner,storage"') + '</div>' +
    '<div class="ds-menu__divider" role="separator"></div>' +
    action(h, 'save', 'save', 'Save changes') + action(h, 'create', 'plus', 'Save as new view …') + action(h, 'rename', 'pencil', 'Rename …') +
    action(h, 'default', 'star', 'Make default') + action(h, 'share', 'link', 'Copy link') +
    '<div class="ds-menu__divider" role="separator"></div>' + action(h, 'delete', 'trash', 'Delete view', true) + '</div></div>';
}

function toolbar(h) {
  var status = h.uid('status');
  var kind = h.uid('kind');
  var sort = h.uid('sort');
  return '<div class="ds-filterbar" data-ds-filterbar role="search" aria-label="Filter devices"><div class="ds-filterbar__row">' +
    '<div class="ds-search ds-filterbar__search">' + h.icon('search', 20) + '<input class="ds-input" type="search" name="q" aria-label="Search devices" placeholder="Search devices"></div>' +
    '<div class="ds-filterbar__filters">' +
    '<div class="ds-field"><label class="ds-field__label" for="' + status + '">Status</label><select class="ds-input" id="' + status + '" name="status"><option value="">Any</option><option value="online">Online</option><option value="offline">Offline</option><option value="maintenance">Maintenance</option></select></div>' +
    '<div class="ds-field"><label class="ds-field__label" for="' + kind + '">Type</label><select class="ds-input" id="' + kind + '" name="kind"><option value="">Any</option><option value="laptop">Laptop</option><option value="desktop">Desktop</option><option value="tablet">Tablet</option><option value="phone">Phone</option><option value="server">Server</option></select></div>' +
    '</div><p class="ds-filterbar__count" aria-live="polite"></p></div>' +
    '<div class="ds-filterbar__applied" hidden><div class="ds-chips ds-filterbar__chips" role="group" aria-label="Applied filters"></div>' +
    '<button class="ds-btn ds-btn--text ds-filterbar__clear" type="button">Clear all</button></div></div>' +
    '<div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--ds-space-3)">' +
    '<div class="ds-sort" data-ds-sort data-ds-value="name" role="group" aria-label="Sort devices"><label class="ds-sort__label" for="' + sort + '">Sort by</label>' +
    '<select class="ds-input ds-sort__field" id="' + sort + '"><option value="name" data-ds-sort-type="text">Name</option>' +
    '<option value="seen" data-ds-sort-type="date" data-ds-sort-default="descending" data-ds-sort-asc="Newest first" data-ds-sort-desc="Oldest first">Last seen</option>' +
    '<option value="storage" data-ds-sort-type="number" data-ds-sort-default="descending">Storage</option></select>' +
    '<button class="ds-btn ds-btn--quiet ds-sort__order" type="button">' + h.icon('arrowUp', 20, 'ds-sort__arrow') +
    '<span class="ds-sr">Order: </span><span class="ds-sort__words"><span class="ds-sort__word"></span><span class="ds-sort__word"></span></span></button></div>' +
    '<fieldset class="sg-views-columns" style="display: flex; flex-wrap: wrap; gap: var(--ds-space-4); margin: 0; padding: 0; border: 0"><legend class="ds-sr">Columns</legend>' +
    COLUMNS.map(function (column) { return '<label class="ds-check"><input type="checkbox" value="' + column[0] + '" checked><span>' + column[1] + '</span></label>'; }).join('') +
    '</fieldset></div>';
}

function seenText(days) {
  return days === 0 ? 'seen today' : days === 1 ? 'seen yesterday' : 'seen ' + days + ' days ago';
}

function visibleDevices(state) {
  var filters = state.filters || {};
  var q = ((filters.q || [''])[0] || '').toLowerCase();
  var sort = DS.sort.parse(state.sort || 'name') || { field: 'name', direction: 'ascending' };
  return DEVICES.filter(function (device) {
    return (!q || device.name.toLowerCase().indexOf(q) >= 0 || device.owner.toLowerCase().indexOf(q) >= 0) &&
      (!filters.status || filters.status.indexOf(device.status) >= 0) &&
      (!filters.kind || filters.kind.indexOf(device.kind) >= 0);
  }).sort(function (a, b) {
    var x = sort.field === 'seen' ? -a.seen : a[sort.field];
    var y = sort.field === 'seen' ? -b.seen : b[sort.field];
    var order = typeof x === 'string' ? x.localeCompare(y) : x - y;
    return sort.direction === 'descending' ? -order : order;
  });
}

function rowsHtml(h, state) {
  var columns = state.columns || COLUMNS.map(function (column) { return column[0]; });
  return visibleDevices(state).map(function (device) {
    var status = STATUS[device.status];
    var meta = columns.map(function (column) {
      return column === 'owner' ? h.esc(device.owner) : column === 'storage' ? device.storage + ' GB' : seenText(device.seen);
    }).join(' · ');
    return '<li class="ds-list__item" data-ds-key="' + device.id + '">' + h.icon(ICONS[device.kind], 20, 'ds-list__icon') +
      '<span class="ds-list__text"><span class="ds-list__title">' + h.esc(device.name) + '</span>' + (meta ? '<span class="ds-list__meta">' + meta + '</span>' : '') + '</span>' +
      '<span class="ds-status ds-tone-' + status[2] + '">' + h.icon(status[1], 16) + '<span>' + status[0] + '</span></span></li>';
  }).join('');
}

SG.demo('views', {
  title: 'Saved views',
  group: 'data',
  need: "Save and share a list's filters, sort and columns as named views, with a default and a link",
  lead: 'Named sets of filters, a sort and columns, picked from a menu. The page brings its own views; the user saves, renames and deletes theirs, makes one the default and copies a link that carries the current view.',
  options: { tones: false },

  render: function (h) {
    return h.section('Views of a list',
      '<div class="sg-views-block" style="display: grid; gap: var(--ds-space-4)">' + viewsHtml(h) + toolbar(h) +
      '<ul class="ds-list" aria-label="Devices" data-demo-list></ul></div>',
      'Pick Offline or Laptops by storage: the filters, the sort and the columns follow. Change any of them and the view says Edited; Save view keeps it as a view of your own (in this browser), Copy link puts it in the address. The address of this page follows the view, under the prefix dv.') +
      h.section('Keyboard', '<p class="ds-muted">The views are a menu: <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">ArrowDown</kbd> opens it, the arrows move, <kbd class="ds-kbd">Enter</kbd> picks a view or runs an action, <kbd class="ds-kbd">Escape</kbd> closes it. A view picked, saved or deleted is announced; the default carries the word Default.</p>');
  },

  wire: function (root, h) {
    var block = h.$('.sg-views-block', root);
    var list = h.$('[data-demo-list]', block);
    var views = DS.views.create(h.$('.ds-views', block));
    var bar = DS.filterbar.create(h.$('.ds-filterbar', block));
    var sort = DS.sort.create(h.$('.ds-sort', block));
    var boxes = h.$$('.sg-views-columns input', block);

    var state = function () {
      return {
        filters: bar.get(),
        sort: DS.sort.stringify(sort.get()),
        columns: boxes.filter(function (box) { return box.checked; }).map(function (box) { return box.value; }),
      };
    };
    var render = function (glide) {
      var now = state();
      var html = rowsHtml(h, now);
      if (glide) DS.motion.flip(list, function (options) { DS.dom.morphHtml(list, html, options); }, { items: 'li' });
      else DS.dom.morphHtml(list, html);
      bar.count(visibleDevices(now).length, { one: '{count} device', other: '{count} devices' });
    };
    // A view's state into the page's controls: sends nothing, so the page renders once.
    var apply = function (next) {
      bar.set(next.filters || {});
      sort.set(next.sort || 'name');
      var columns = next.columns || COLUMNS.map(function (column) { return column[0]; });
      boxes.forEach(function (box) { box.checked = columns.indexOf(box.value) >= 0; });
      views.set({ state: state() });
      render(true);
    };
    var changed = function () {
      views.set({ state: state() });
      render(true);
    };

    apply(views.get().state);
    block.addEventListener('ds:view', function (event) { apply(event.detail.state); });
    block.addEventListener('ds:filter', changed);
    block.addEventListener('ds:sort', changed);
    boxes.forEach(function (box) { box.addEventListener('change', changed); });
  },
});
