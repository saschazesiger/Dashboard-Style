/*
 * The Table demo: the working table (sort, filter, select, expand, live data),
 * its looks, summary and sticky rows, pinned columns, the full-page table,
 * stacked rows, the selection bar and the states. Registered through SG.demo()
 * (styleguide/sg-core.js). Size, density, shape and touch come from the options
 * panel around it, so no table here carries a size or density class. The fake
 * fleet stands for what a project's data does.
 */
var LOOKS = [
  ['default', '', 'Hairlines between the rows, a quiet hover: the default.'],
  ['zebra', 'ds-table--zebra', 'Every other row tinted; a selected row and the hover lie over it.'],
  ['bordered', 'ds-table--bordered', 'A hairline between the columns too.'],
  ['plain', 'ds-table--plain ds-table--zebra', 'No hairlines between the rows, with the zebra to follow them by.'],
];
var MODELS = ['Laptop 14', 'Laptop 13', 'Desktop 7', 'Laptop 15', 'Tablet 13', 'Tablet 11'];
var OWNERS = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Katherine Johnson', 'Edsger Dijkstra', 'Barbara Liskov'];
var PLACES = ['Building A, 1st floor', 'Building A, 2nd floor', 'Server room', 'Building B, ground floor, the open-plan office next to the stairs', 'Storage', 'Building B, 1st floor'];

/* A deterministic fleet of `count` devices (the same rows on every visit). */
function fleet(count) {
  var rows = [];
  for (var i = 0; i < count; i += 1) {
    rows.push({
      id: 'd' + (i + 1),
      name: (i % 3 === 2 ? 'DESKTOP-' : 'LAPTOP-') + String(100 + i * 7).padStart(4, '0'),
      model: MODELS[i % MODELS.length],
      owner: OWNERS[(i * 5) % OWNERS.length],
      place: PLACES[(i * 7) % PLACES.length],
      bought: '20' + (20 + (i % 5)) + '-0' + (1 + (i % 9)) + '-1' + (i % 10),
      warranty: (1 + (i % 4)) + ' years',
      system: i % 4 === 3 ? 'Release 23.4' : 'Release 24.2',
      serial: 'SN-' + (40961 + i * 977).toString(16).toUpperCase(),
      load: (i * 37) % 100,
    });
  }
  return rows;
}

function loadStatus(load) {
  if (load >= 90) return ['error', 'alert', 'Overloaded'];
  if (load >= 75) return ['warning', 'alert', 'High load'];
  return ['ok', 'check', 'Active'];
}

/* ── The working table ── */

function sortHead(h, state, key, text, cls) {
  var sorted = state.sort === key;
  return '<th scope="col"' + (cls ? ' class="' + cls + '"' : '') + (sorted ? ' aria-sort="' + state.dir + '"' : '') + '><button class="ds-table__sort" type="button" data-demo="sort" data-key="' + key + '">' + text + (sorted ? h.icon('arrowUp', 16, 'ds-table__sort-arrow') : '') + '</button></th>';
}

function headHtml(h, state) {
  // Some rows selected: the header box is mixed (sg-core sets the property before the markup goes in).
  var rows = shown(state);
  var count = rows.filter(function (row) { return state.selected[row.id]; }).length;
  var box = count && count === rows.length ? ' checked' : count ? ' data-sg-mixed' : '';
  return '<tr><th scope="col"><input type="checkbox" aria-label="Select all devices" data-demo="select-all"' + box + '></th><th scope="col"><span class="ds-sr">Details</span></th>' +
    sortHead(h, state, 'name', 'Device') + '<th scope="col" class="ds-col--secondary">Model</th><th scope="col" class="ds-col--secondary">Owner</th>' +
    sortHead(h, state, 'load', 'Load', 'ds-num') + '<th scope="col">Status</th></tr>';
}

function shown(state) {
  var query = state.filter.trim().toLowerCase();
  var sign = state.dir === 'ascending' ? 1 : -1;
  return state.rows.filter(function (row) {
    return !query || [row.name, row.model, row.owner].join(' ').toLowerCase().indexOf(query) !== -1;
  }).sort(function (a, b) {
    return sign * (state.sort === 'load' ? a.load - b.load : a.name.localeCompare(b.name));
  });
}

function rowsHtml(h, state) {
  return shown(state).map(function (row) {
    var open = !!state.expanded[row.id];
    var status = loadStatus(row.load);
    var detail = state.prefix + '-' + row.id;
    return '<tr data-ds-key="' + row.id + '">' +
      '<td><input type="checkbox" aria-label="Select ' + row.name + '" data-demo="select-row"' + (state.selected[row.id] ? ' checked' : '') + '></td>' +
      '<td><button class="ds-btn ds-btn--quiet ds-btn--icon ds-table__toggle" type="button" aria-expanded="' + open + '" aria-controls="' + detail + '" aria-label="Details of ' + row.name + '" data-demo="toggle">' + h.icon('chevronDown', 20, 'ds-chevron') + '</button></td>' +
      '<td class="ds-nowrap"><button class="ds-link-btn ds-table__row-link" type="button" data-demo="open" data-name="' + row.name + '">' + row.name + '</button></td>' +
      '<td class="ds-col--secondary">' + row.model + '</td><td class="ds-col--secondary">' + row.owner + '</td><td class="ds-num">' + row.load + '%</td>' +
      '<td><span class="ds-status ds-tone-' + (status[0] === 'ok' ? 'success' : status[0]) + '">' + h.icon(status[1], 16) + '<span>' + status[2] + '</span></span></td></tr>' +
      '<tr class="ds-table__detail" id="' + detail + '" data-ds-key="' + row.id + '-detail"' + (open ? '' : ' inert') + '><td colspan="7"><div class="ds-table__expand"><div>' +
      '<dl class="ds-facts"><div><dt>Owner</dt><dd>' + row.owner + '</dd></div><div><dt>Model</dt><dd>' + row.model + '</dd></div><div><dt>Location</dt><dd>' + row.place + '</dd></div></dl>' +
      '</div></div></td></tr>';
  }).join('');
}

function newState(h) {
  return { rows: fleet(6), sort: 'name', dir: 'ascending', filter: '', selected: { d2: true }, expanded: {}, prefix: h.uid('detail'), feed: 0 };
}

/* ── Wide tables: pinned columns, the full-page table ── */

function wideHead(actions) {
  return '<tr><th scope="col">Device</th><th scope="col">Model</th><th scope="col">Owner</th><th scope="col">Location</th>' +
    '<th scope="col" class="ds-num">Bought</th><th scope="col">Warranty</th><th scope="col">System</th><th scope="col">Serial</th>' +
    '<th scope="col" class="ds-num">Load</th>' + (actions ? '<th scope="col"><span class="ds-sr">Actions</span></th>' : '') + '</tr>';
}

function wideRow(h, row, actions) {
  return '<tr data-ds-key="' + row.id + '"><td class="ds-nowrap"><button class="ds-link-btn ds-table__row-link" type="button" data-demo="open" data-name="' + row.name + '">' + row.name + '</button></td>' +
    '<td class="ds-nowrap">' + row.model + '</td><td class="ds-nowrap">' + row.owner + '</td><td class="ds-nowrap" data-tip="' + row.place + '">' + row.place + '</td>' +
    '<td class="ds-num ds-nowrap">' + row.bought + '</td><td class="ds-nowrap">' + row.warranty + '</td><td class="ds-nowrap">' + row.system + '</td><td class="ds-nowrap">' + row.serial + '</td>' +
    '<td class="ds-num">' + row.load + '%</td>' +
    (actions ? '<td class="ds-table__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Edit ' + row.name + '" data-tip="Edit" data-demo="edit" data-name="' + row.name + '">' + h.icon('pencil', 20) + '</button></td>' : '') + '</tr>';
}

function average(rows) {
  return Math.round(rows.reduce(function (sum, row) { return sum + row.load; }, 0) / rows.length);
}

/* ── The bar of a bulk selection ── */

function bulkToolbar(h) {
  return '<div class="ds-action-bar"><div class="ds-search">' + h.icon('search', 20) + '<input class="ds-input" type="search" aria-label="Search devices" placeholder="Search devices"></div><p class="ds-meta">4 devices</p></div>';
}

function selectionBar(h, count) {
  return '<div class="ds-selection-bar" role="toolbar" aria-label="Selected devices">' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Clear selection" data-tip="Clear selection" data-demo="bulk-clear">' + h.icon('close', 20) + '</button>' +
    '<p class="ds-selection-bar__count" aria-live="polite">' + count + ' selected</p>' +
    '<div class="ds-selection-bar__actions"><button class="ds-btn ds-btn--text" type="button" data-demo="bulk-delete">' + h.icon('trash', 18) + 'Delete</button></div></div>';
}

/* One element from trusted demo markup. */
function element(html) {
  var template = document.createElement('template');
  template.innerHTML = html;
  return template.content.firstElementChild;
}

SG.demo('table', {
  title: 'Table',
  group: 'data',
  need: 'Compare records in columns: sort, select in bulk, act per row',
  lead: 'A plain table with a 48px head and 52px rows, in a card out to its edges. The options panel changes the row height through size and density, the radii through shape; touch keeps rows and sort targets at the touch minimum. Secondary columns drop on phones.',
  options: { variants: LOOKS.map(function (look) { return look[0]; }), sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var state = newState(h);
    var look = LOOKS.filter(function (entry) { return entry[0] === h.variant; })[0];
    var looks = LOOKS.filter(function (entry) { return !h.variant || entry[0] === h.variant; });
    var wide = fleet(6);
    var long = fleet(12);
    var fill = fleet(30);
    var sources = [['Status page', 'https://status.example.org'], ['Mail relay', 'https://mail.example.org/health'], ['Backups', 'https://backup.example.org/ping']];
    return h.section('Sort, filter, select, expand',
      '<section class="ds-card" data-demo="devices"><div class="ds-card__row"><h3 class="ds-card__title">Devices</h3><div class="sg-row"><button class="ds-btn ds-btn--quiet ds-sm" type="button" aria-pressed="false" data-demo="live">Live feed</button></div></div>' +
      '<div class="ds-field" style="max-width: 320px"><label class="ds-field__label" for="' + state.prefix + '-filter">Filter</label><input class="ds-input" id="' + state.prefix + '-filter" type="search" autocomplete="off" placeholder="Device, model or owner" data-demo="filter"></div>' +
      '<div class="ds-table-wrap"><table class="ds-table ds-table--interactive' + (look && look[1] ? ' ' + look[1] : '') + '"><caption class="ds-sr">Devices</caption><thead>' + headHtml(h, state) + '</thead><tbody>' + rowsHtml(h, state) + '</tbody></table></div>' +
      '<div class="ds-empty" data-demo="empty" hidden><span class="ds-empty__disc" aria-hidden="true">' + h.icon('search', 24) + '</span><p class="ds-empty__title">No device matches</p><p class="ds-empty__text">Nothing has that in its name, model or owner.</p></div></section>',
      'Every row opens its record: the device name stretches over the row, the checkbox and the chevron stay their own controls. Rows glide to their places on every keystroke; the live feed waits while the pointer is on the table.') +

      h.section('Looks', looks.map(function (entry) {
        return '<section class="ds-card" data-demo="look-' + entry[0] + '"><h3 class="ds-card__title">' + entry[0].replace(/^\w/, function (c) { return c.toUpperCase(); }) + '</h3><p class="ds-muted">' + entry[2] + '</p>' +
          '<div class="ds-table-wrap"><table class="ds-table' + (entry[1] ? ' ' + entry[1] : '') + '"><caption class="ds-sr">Devices, ' + entry[0] + '</caption><thead><tr><th scope="col">Device</th><th scope="col">Model</th><th scope="col" class="ds-num">Load</th></tr></thead><tbody>' +
          fleet(4).map(function (row) { return '<tr><td class="ds-nowrap">' + row.name + '</td><td>' + row.model + '</td><td class="ds-num">' + row.load + '%</td></tr>'; }).join('') + '</tbody></table></div></section>';
      }).join('')) +

      h.section('Sticky head and summary foot',
        '<section class="ds-card" data-demo="sticky"><div class="ds-table-wrap" style="--ds-table-max-height: 280px" tabindex="0" role="region" aria-label="Devices, scrolling"><table class="ds-table ds-table--sticky-head ds-table--sticky-foot"><caption class="ds-sr">Devices with a summary</caption>' +
        '<thead><tr><th scope="col">Device</th><th scope="col">Model</th><th scope="col" class="ds-num">Load</th></tr></thead><tbody>' +
        long.map(function (row) { return '<tr><td class="ds-nowrap">' + row.name + '</td><td>' + row.model + '</td><td class="ds-num">' + row.load + '%</td></tr>'; }).join('') +
        '</tbody><tfoot><tr><th scope="row">' + long.length + ' devices</th><td></td><td class="ds-num">' + average(long) + '%</td></tr></tfoot></table></div></section>',
        'The wrapper is bounded by --ds-table-max-height, so the rows scroll under the head and the summary.') +

      h.section('Pinned first and last column, row actions',
        '<section class="ds-card" data-demo="pinned"><div class="ds-table-wrap"><table class="ds-table ds-table--wide ds-table--interactive ds-table--pin-first ds-table--pin-last"><caption class="ds-sr">Devices with pinned columns</caption>' +
        '<thead>' + wideHead(true) + '</thead><tbody>' + wide.map(function (row) { return wideRow(h, row, true); }).join('') + '</tbody>' +
        '<tfoot><tr><th scope="row">6 devices</th><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td class="ds-num">' + average(wide) + '%</td><td></td></tr></tfoot></table></div></section>',
        'Narrow the width: the columns scroll under both pinned ones. A hairline shows on the side that has columns under it; a click anywhere on the row opens it, outside the pinned last column. As a wide table (.ds-table--wide) it drops its secondary columns where the page is narrow next to the drawer.') +

      h.section('Full page',
        '<div style="display: flex; flex-direction: column; height: 360px; min-width: 0" data-demo="fill"><div class="ds-table-wrap ds-table-wrap--fill"><table class="ds-table ds-table--interactive ds-table--pin-first"><caption class="ds-sr">The whole fleet</caption>' +
        '<thead>' + wideHead(false) + '</thead><tbody>' + fill.map(function (row) { return wideRow(h, row, false); }).join('') + '</tbody></table></div></div>',
        'Its own card: in a .ds-view--fill it takes what is left of the view; here a frame of 360px. The header sticks, the device column stays, long cells end in an ellipsis.') +

      h.section('Stacked rows',
        '<section class="ds-card" data-demo="stack"><div class="ds-table-wrap"><table class="ds-table ds-table--stack"><caption class="ds-sr">Status sources</caption>' +
        '<thead><tr><th scope="col">Name</th><th scope="col">URL</th><th scope="col"><span class="ds-sr">Remove</span></th></tr></thead><tbody>' +
        sources.map(function (source, index) {
          return '<tr data-ds-key="s' + (index + 1) + '"><td data-label="Name"><input class="ds-input" aria-label="Name of source ' + (index + 1) + '" value="' + source[0] + '"></td>' +
            '<td data-label="URL"><input class="ds-input" type="url" aria-label="URL of source ' + (index + 1) + '" value="' + source[1] + '"></td>' +
            '<td class="ds-table__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Remove source ' + (index + 1) + '" data-tip="Remove">' + h.icon('close', 20) + '</button></td></tr>';
        }).join('') + '</tbody></table></div></section>',
        'A row of fields per entry. In a side sheet, a dialog or a narrow content area (600px; --stack-wide: 840px) each row becomes a block: narrow the width.') +

      h.section('Bulk selection bar',
        '<section class="ds-card" data-demo="bulk"><div class="ds-toolbar"><div class="ds-swap" data-demo="bulk-slot">' + bulkToolbar(h) + '</div></div>' +
        '<div class="ds-table-wrap"><table class="ds-table"><caption class="ds-sr">Devices to select</caption><thead><tr><th scope="col"><input type="checkbox" aria-label="Select all devices" data-demo="bulk-all"></th><th scope="col">Device</th><th scope="col">Model</th></tr></thead><tbody>' +
        fleet(4).map(function (row) { return '<tr><td><input type="checkbox" aria-label="Select ' + row.name + '" data-demo="bulk-row"></td><td class="ds-nowrap">' + row.name + '</td><td>' + row.model + '</td></tr>'; }).join('') +
        '</tbody></table></div></section>',
        'Check a row: the bar crosses with the toolbar in one slot, so the table never moves.') +

      h.section('States',
        '<section class="ds-card ds-stale" aria-busy="true" data-demo="loading"><h3 class="ds-card__title">Loading</h3><div class="ds-table-wrap"><table class="ds-table"><caption class="ds-sr">Devices, loading</caption><thead><tr><th scope="col">Device</th><th scope="col" class="ds-num">Load</th></tr></thead><tbody>' +
        fleet(2).map(function (row) { return '<tr><td>' + row.name + '</td><td class="ds-num">' + row.load + '%</td></tr>'; }).join('') + '</tbody></table></div></section>' +
        '<section class="ds-card" data-demo="scroll-only"><h3 class="ds-card__title">Nothing focusable in its cells</h3><div class="ds-table-wrap" tabindex="0" role="region" aria-label="Device history"><table class="ds-table"><caption class="ds-sr">Device history</caption><thead><tr><th scope="col">Device</th><th scope="col">Serial</th><th scope="col">Bought</th></tr></thead><tbody>' +
        fleet(2).map(function (row) { return '<tr><td class="ds-nowrap">' + row.name + '</td><td class="ds-nowrap">' + row.serial + '</td><td class="ds-nowrap">' + row.bought + '</td></tr>'; }).join('') + '</tbody></table></div></section>',
        'The rows dim while new ones load; an empty result is the filter above. A wrapper with nothing focusable in its cells is a tab stop itself.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches each sort button, checkbox, toggle, row link and row action; <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> uses it. A focused row link rings the whole row. Focus never lands under a sticky row or a pinned first column; under a pinned last column only while the page sets --ds-table-pin-last-width.</p>');
  },

  wire: function (root, h) {
    var state = newState(h);
    var card = h.$('[data-demo="devices"]', root);
    var table = h.$('table', card);
    var tbody = h.$('tbody', table);
    var thead = h.$('thead', table);
    var empty = h.$('[data-demo="empty"]', card);
    var bulk = h.$('[data-demo="bulk"]', root);
    var edges = h.$$('.ds-table-wrap', root).map(function (wrap) { return DS.dom.scrollEdges(wrap); });

    function syncAll() {
      var rows = shown(state);
      var count = rows.filter(function (row) { return state.selected[row.id]; }).length;
      var all = h.$('[data-demo="select-all"]', table);
      all.checked = rows.length > 0 && count === rows.length;
      all.indeterminate = count > 0 && count < rows.length;
    }

    /* A user's sort or filter glides at once; the live feed waits for the pointer. */
    function render(live) {
      DS.dom.morphHtml(thead, headHtml(h, state));
      var done = DS.motion.flip(tbody, function (options) { DS.dom.morphHtml(tbody, rowsHtml(h, state), options); }, { items: 'tr', live: !!live });
      syncAll();
      if (!shown(state).length) {
        if (empty.hidden) done.then(function () { if (!shown(state).length && empty.hidden) DS.motion.enter(empty, 'fade'); });
      } else if (!empty.hidden && !empty.classList.contains('ds-leave')) {
        DS.motion.leave(empty, '', { then: 'hide' });
      }
    }

    function syncBulk() {
      var boxes = h.$$('[data-demo="bulk-row"]', bulk);
      var count = boxes.filter(function (box) { return box.checked; }).length;
      var slot = h.$('[data-demo="bulk-slot"]', bulk);
      var bar = h.$(':scope > .ds-selection-bar:not([data-ds-leaving])', slot);
      var all = h.$('[data-demo="bulk-all"]', bulk);
      all.checked = count === boxes.length;
      all.indeterminate = count > 0 && count < boxes.length;
      if (count && !bar) DS.motion.crossfade(slot, element(selectionBar(h, count)));
      else if (!count && bar) DS.motion.crossfade(slot, element(bulkToolbar(h)));
      else if (bar) h.$('.ds-selection-bar__count', bar).textContent = count + ' selected';
    }

    root.addEventListener('click', function (event) {
      var target = event.target.closest('[data-demo]');
      if (!target) return;
      var kind = target.getAttribute('data-demo');
      var row = target.closest('tr');
      var key = row && row.getAttribute('data-ds-key');
      if (kind === 'sort') {
        var by = target.getAttribute('data-key');
        state.dir = state.sort === by && state.dir === 'ascending' ? 'descending' : 'ascending';
        state.sort = by;
        render();
      }
      if (kind === 'toggle') {
        state.expanded[key] = !state.expanded[key];
        target.setAttribute('aria-expanded', String(state.expanded[key]));
        document.getElementById(target.getAttribute('aria-controls')).inert = !state.expanded[key];
      }
      if (kind === 'open') h.toast('Opened ' + target.getAttribute('data-name') + '.', 'info');
      if (kind === 'edit') h.toast('Editing ' + target.getAttribute('data-name') + '.', 'info');
      if (kind === 'live') {
        var on = target.getAttribute('aria-pressed') !== 'true';
        target.setAttribute('aria-pressed', String(on));
        clearInterval(state.feed);
        state.feed = 0;
        if (on) {
          state.feed = setInterval(function () {
            state.rows.forEach(function (entry) {
              if (Math.random() < 0.6) entry.load = Math.max(1, Math.min(99, entry.load + Math.round((Math.random() - 0.5) * 50)));
            });
            render(true);
          }, h.slow(2000));
        }
      }
      if (kind === 'bulk-clear') {
        h.$$('[data-demo="bulk-row"]', bulk).forEach(function (box) { box.checked = false; });
        syncBulk();
        h.$('[data-demo="bulk-all"]', bulk).focus();
      }
      if (kind === 'bulk-delete') h.toast('Selected rows stay: this is a demo.', 'info');
    });

    root.addEventListener('change', function (event) {
      var kind = event.target.getAttribute('data-demo');
      if (kind === 'select-row') {
        state.selected[event.target.closest('tr').getAttribute('data-ds-key')] = event.target.checked;
        syncAll();
      }
      if (kind === 'select-all') {
        shown(state).forEach(function (row) { state.selected[row.id] = event.target.checked; });
        h.$$('[data-demo="select-row"]', table).forEach(function (box) { box.checked = event.target.checked; });
        syncAll();
      }
      if (kind === 'bulk-all') h.$$('[data-demo="bulk-row"]', bulk).forEach(function (box) { box.checked = event.target.checked; });
      if (kind === 'bulk-all' || kind === 'bulk-row') syncBulk();
    });

    root.addEventListener('input', function (event) {
      if (event.target.getAttribute('data-demo') !== 'filter') return;
      state.filter = event.target.value;
      render();
    });

    syncAll();

    return function () {
      clearInterval(state.feed);
      edges.forEach(function (handle) { handle.destroy(); });
    };
  },
});
