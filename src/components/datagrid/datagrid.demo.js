/*
 * The Data grid demo: the whole grid on a fleet of devices (sort by several
 * columns, the chooser, resize and reorder, selection across pages with the
 * bar, details, inline edit, the cell keys, the row menu, the summary row,
 * paging, export), the declarative path, tree rows, row groups with
 * subtotals, server data with its states, and ten thousand windowed rows.
 * Behaviour comes from DS.datagrid; wire() holds what a page writes itself: the
 * data, the filter field, the toast after an action. The fake fleet is
 * deterministic, so every visit shows the same rows.
 */
var GRID_MODELS = ['Laptop 14', 'Laptop 13', 'Desktop 7', 'Laptop 15', 'Tablet 13', 'Tablet 11'];
var GRID_OWNERS = ['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Katherine Johnson', 'Edsger Dijkstra', 'Barbara Liskov'];
var GRID_PLACES = ['Building A, 1st floor', 'Building A, 2nd floor', 'Server room', 'Building B, ground floor', 'Storage', 'Building B, 1st floor'];
var GRID_STATES = [['success', 'check', 'Active'], ['warning', 'alert', 'High load'], ['error', 'alert', 'Overloaded'], ['neutral', 'clock', 'Idle']];

/* A deterministic fleet of `count` devices. */
function gridFleet(count) {
  var rows = [];
  for (var i = 0; i < count; i += 1) {
    var load = (i * 37 + 11) % 100;
    rows.push({
      id: 'd' + (i + 1),
      name: (i % 3 === 2 ? 'DESKTOP-' : 'LAPTOP-') + String(100 + i * 7).padStart(4, '0'),
      model: GRID_MODELS[i % GRID_MODELS.length],
      owner: GRID_OWNERS[(i * 5) % GRID_OWNERS.length],
      place: GRID_PLACES[(i * 7) % GRID_PLACES.length],
      bought: new Date(Date.UTC(2020 + (i % 5), i % 12, 1 + (i * 3) % 28)),
      load: load,
      tickets: (i * 13) % 9,
    });
  }
  return rows;
}

function gridStatus(h, row) {
  var state = row.load >= 90 ? GRID_STATES[2] : row.load >= 75 ? GRID_STATES[1] : row.load < 10 ? GRID_STATES[3] : GRID_STATES[0];
  return '<span class="ds-status ds-tone-' + state[0] + '">' + h.icon(state[1], 16) + '<span>' + state[2] + '</span></span>';
}

/* The columns of the fleet; `edit` makes the owner and the load editable. */
function gridColumns(h, edit) {
  return [
    { key: 'name', label: 'Device', sortable: true, className: 'ds-nowrap', render: function (row) { return '<button class="ds-link-btn" type="button" data-demo="open" data-name="' + h.esc(row.name) + '">' + h.esc(row.name) + '</button>'; } },
    { key: 'model', label: 'Model', sortable: true, className: 'ds-nowrap' },
    { key: 'owner', label: 'Owner', sortable: true, className: 'ds-nowrap', edit: edit ? { type: 'select', options: GRID_OWNERS } : null },
    { key: 'place', label: 'Location', sortable: true, hidden: true, className: 'ds-nowrap' },
    { key: 'bought', label: 'Bought', type: 'date', sortable: true, hidden: true, className: 'ds-num ds-nowrap' },
    { key: 'tickets', label: 'Tickets', type: 'number', sortable: true, summary: 'sum' },
    { key: 'load', label: 'Load', type: 'number', sortable: true, summary: 'avg', format: function (value) { return value === null || value === undefined ? '' : value + '%'; },
      edit: edit ? { type: 'number', required: true, validate: function (value) { return value < 0 || value > 100 ? 'Between 0 and 100.' : ''; } } : null },
    { key: 'status', label: 'Status', value: function (row) { return row.load; }, render: function (row) { return gridStatus(h, row); }, export: true, exportValue: function (row) { return row.load >= 90 ? 'Overloaded' : row.load >= 75 ? 'High load' : row.load < 10 ? 'Idle' : 'Active'; }, filterable: false },
  ];
}

function gridMenu(h, id, label) {
  return '<div class="ds-menu" role="menu" id="' + id + '" aria-label="' + label + '" hidden>' +
    '<button class="ds-menu__item" role="menuitem" type="button" data-ds-action="open">' + h.icon('external', 20) + '<span class="ds-menu__label">Open</span></button>' +
    '<button class="ds-menu__item" role="menuitem" type="button" data-ds-action="ticket">' + h.icon('ticket', 20) + '<span class="ds-menu__label">New ticket</span></button>' +
    '<button class="ds-menu__item" role="menuitem" type="button" data-ds-action="copy">' + h.icon('copy', 20) + '<span class="ds-menu__label">Copy the name</span></button>' +
    '<div class="ds-menu__divider" role="separator"></div>' +
    '<button class="ds-menu__item ds-menu__item--danger" role="menuitem" type="button" data-ds-action="retire">' + h.icon('archive', 20) + '<span class="ds-menu__label">Retire the device</span></button></div>';
}

function gridToolbar(h, ids) {
  return '<div class="ds-toolbar"><div class="ds-swap">' +
    '<div class="ds-action-bar">' +
      '<div class="ds-search">' + h.icon('search', 20) + '<input class="ds-input" type="search" aria-label="Filter devices" placeholder="Filter devices" autocomplete="off" data-demo="filter"></div>' +
      '<button class="ds-btn ds-btn--quiet" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="' + ids.columns + '" data-ds-open="#' + ids.columns + '">' + h.icon('columns', 18) + 'Columns</button>' +
      '<button class="ds-btn ds-btn--quiet" type="button" data-ds-datagrid-command="csv" aria-controls="' + ids.table + '" data-ds-datagrid-file="devices.csv">' + h.icon('download', 18) + 'Export</button>' +
      '<button class="ds-btn ds-btn--quiet" type="button" data-ds-datagrid-command="copy" aria-controls="' + ids.table + '">' + h.icon('copy', 18) + 'Copy</button>' +
    '</div>' +
    '<div class="ds-selection-bar" id="' + ids.bar + '" role="toolbar" aria-label="Selected devices" hidden>' +
      '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Clear selection" data-tip="Clear selection" data-ds-datagrid-command="clear">' + h.icon('close', 20) + '</button>' +
      '<p class="ds-selection-bar__count" aria-live="polite"></p>' +
      '<div class="ds-selection-bar__actions"><button class="ds-btn ds-btn--text" type="button" data-ds-datagrid-command="copy">' + h.icon('copy', 18) + 'Copy</button>' +
      '<button class="ds-btn ds-btn--text" type="button" data-demo="retire">' + h.icon('archive', 18) + 'Retire</button></div>' +
    '</div></div></div>' +
    '<div class="ds-menu" role="menu" id="' + ids.columns + '" aria-label="Columns" data-ds-menu hidden></div>';
}

function gridPager(id, label) {
  return '<nav class="ds-pagination" id="' + id + '" aria-label="' + label + '">' +
    '<div class="ds-pagination__size"><label class="ds-pagination__label" for="' + id + '-size">Rows per page</label>' +
    '<select class="ds-input ds-input--filled" id="' + id + '-size" data-ds-datagrid-size><option>5</option><option selected>10</option><option>25</option></select></div>' +
    '<p class="ds-pagination__range" aria-live="polite"></p>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="First page" data-tip="First page" data-ds-datagrid-page="first">' + SG.helpers().icon('chevronFirst', 20) + '</button>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Previous page" data-tip="Previous page" data-ds-datagrid-page="previous">' + SG.helpers().icon('chevronLeft', 20) + '</button>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Next page" data-tip="Next page" data-ds-datagrid-page="next">' + SG.helpers().icon('chevronRight', 20) + '</button>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Last page" data-tip="Last page" data-ds-datagrid-page="last">' + SG.helpers().icon('chevronLast', 20) + '</button></nav>';
}

/* A tree of places and their devices. */
function gridTree() {
  var fleet = gridFleet(14);
  return [
    { id: 'a', name: 'Building A', kind: 'Site', children: [
      { id: 'a1', name: '1st floor', kind: 'Floor', children: fleet.slice(0, 3).map(function (row) { return { id: row.id, name: row.name, kind: row.model, load: row.load }; }) },
      { id: 'a2', name: '2nd floor', kind: 'Floor', children: fleet.slice(3, 6).map(function (row) { return { id: row.id, name: row.name, kind: row.model, load: row.load }; }) },
    ] },
    { id: 'b', name: 'Building B', kind: 'Site', children: [
      { id: 'b0', name: 'Ground floor', kind: 'Floor', children: fleet.slice(6, 10).map(function (row) { return { id: row.id, name: row.name, kind: row.model, load: row.load }; }) },
    ] },
    { id: 's', name: 'Server room', kind: 'Room', children: fleet.slice(10, 14).map(function (row) { return { id: row.id, name: row.name, kind: row.model, load: row.load }; }) },
  ];
}

SG.demo('datagrid', {
  title: 'Data grid',
  group: 'data',
  need: 'Work through many records: sort by several columns, choose and resize columns, select across pages, edit in place, export',
  lead: 'The table, driven by DS.datagrid: every option is opt-in, so each section turns on what it shows. The options panel changes the rows through size, density, touch and shape, as on any table.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var ids = { table: h.uid('grid'), columns: h.uid('columns'), bar: h.uid('bar'), menu: h.uid('row-menu'), pager: h.uid('pages') };
    var serverIds = { table: h.uid('server'), pager: h.uid('server-pages') };
    var declared = gridFleet(5);
    return h.section('The whole grid',
      '<section class="ds-card" data-demo="full">' +
        '<div class="ds-card__row"><h3 class="ds-card__title">Devices</h3></div>' +
        gridToolbar(h, ids) +
        '<div class="ds-table-wrap"><table class="ds-table ds-datagrid ds-table--interactive" id="' + ids.table + '" aria-label="Devices" data-demo="full-table"></table></div>' +
        gridPager(ids.pager, 'Pages of devices') +
        gridMenu(h, ids.menu, 'Device actions') +
      '</section>',
      'Shift+click a second header to sort by both. Drag a header\'s grip (or Space, the arrows, Space) to move a column, its edge to resize it; Columns hides and shows them. Select a row, then the whole page: the bar offers every row. Double-click an owner or a load to edit it, right-click a row for its menu. Tab into the grid and use the arrow keys.') +

      h.section('From the markup',
        '<section class="ds-card" data-demo="declared"><div class="ds-table-wrap"><table class="ds-table ds-datagrid" aria-label="Devices, from the markup" data-ds-datagrid data-ds-config=\'{"select":"multiple","focus":"row","multiSort":true,"resize":true,"footLabel":"Highest"}\'>' +
        '<thead><tr><th scope="col" data-ds-datagrid-col="name" data-ds-datagrid-sort>Device</th><th scope="col" data-ds-datagrid-col="owner" data-ds-datagrid-sort>Owner</th><th scope="col" class="ds-num" data-ds-datagrid-col="load" data-ds-datagrid-sort aria-sort="descending" data-ds-datagrid-summary="max">Load</th></tr></thead><tbody>' +
        declared.map(function (row) { return '<tr data-ds-key="' + row.id + '"><td class="ds-nowrap">' + row.name + '</td><td>' + row.owner + '</td><td class="ds-num" data-value="' + row.load + '">' + row.load + '%</td></tr>'; }).join('') +
        '</tbody></table></div></section>',
        'A plain table with data-ds-datagrid and its options in data-ds-config: the grid reads the columns and rows once. Row focus: the arrows move from row to row, Space selects, Shift with the arrows extends.') +

      h.section('Tree rows',
        '<section class="ds-card"><div class="ds-table-wrap"><table class="ds-table ds-datagrid" aria-label="Places and devices" data-demo="tree"></table></div></section>',
        'A treegrid: ArrowRight opens a row or goes to its first child, ArrowLeft closes it or goes to its parent. A filter keeps the ancestors of a match.') +

      h.section('Row groups and subtotals',
        '<section class="ds-card"><div class="ds-table-wrap"><table class="ds-table ds-datagrid ds-table--zebra" aria-label="Devices by model" data-demo="groups"></table></div></section>',
        'Grouped by model: each head row shows its count and the subtotals of the columns with a summary; the summary row sums every row.') +

      h.section('Server data',
        '<section class="ds-card" data-demo="server-card"><div class="ds-card__row"><h3 class="ds-card__title">Tickets</h3><div class="sg-row">' +
        '<button class="ds-btn ds-btn--quiet ds-sm" type="button" aria-pressed="false" data-demo="fail">Fail the next load</button></div></div>' +
        '<div class="ds-table-wrap"><table class="ds-table ds-datagrid" id="' + serverIds.table + '" aria-label="Tickets" data-demo="server"></table></div>' +
        gridPager(serverIds.pager, 'Pages of tickets') + '</section>',
        'Sort and paging go to a fake server that answers after a moment: the rows dim while the next page comes, the first load shows its line, a failed load its error with Try again.') +

      h.section('Stacked rows',
        '<section class="ds-card"><div class="ds-table-wrap"><table class="ds-table ds-table--stack ds-datagrid" aria-label="Devices to issue" data-demo="stack"></table></div></section>',
        'The table\'s stacked rows work as on any table: the grid writes each cell\'s data-label. In a side sheet, a dialog or a content area of 600px or less each row becomes a block: narrow the width. Double-click a value to edit it.') +

      h.section('Ten thousand rows',
        '<div style="display: flex; flex-direction: column; height: 400px; min-width: 0"><div class="ds-table-wrap ds-table-wrap--fill"><table class="ds-table ds-datagrid" aria-label="Every device" data-demo="virtual"></table></div></div>',
        'Windowed through DS.virtual: only the rows near the viewport exist, aria-rowcount tells the whole set, and the keys reach every row.') +

      h.section('States', '<div style="display: grid; gap: var(--ds-space-4); grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr))">' +
        '<section class="ds-card"><h3 class="ds-card__title">Nothing yet</h3><div class="ds-table-wrap"><table class="ds-table ds-datagrid" aria-label="Devices, none yet" data-demo="empty"></table></div></section>' +
        '<section class="ds-card"><h3 class="ds-card__title">Loading</h3><div class="ds-table-wrap"><table class="ds-table ds-datagrid" aria-label="Devices, loading" data-demo="loading"></table></div></section>' +
        '<section class="ds-card"><h3 class="ds-card__title">Did not load</h3><div class="ds-table-wrap"><table class="ds-table ds-datagrid" aria-label="Devices, failed" data-demo="error"></table></div></section>' +
        '<section class="ds-card"><h3 class="ds-card__title">No results</h3><div class="ds-table-wrap"><table class="ds-table ds-datagrid" aria-label="Devices, filtered" data-demo="no-results"></table></div></section>' +
        '</div>') +

      h.section('Keyboard', '<p class="ds-muted">With focus mode the grid is one tab stop. <kbd class="ds-kbd">ArrowUp</kbd> <kbd class="ds-kbd">ArrowDown</kbd> <kbd class="ds-kbd">ArrowLeft</kbd> <kbd class="ds-kbd">ArrowRight</kbd> move, <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd> go to the row\'s ends (with <kbd class="ds-kbd">Ctrl</kbd> the grid\'s), <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">F2</kbd> edits a cell or enters one with several controls, <kbd class="ds-kbd">Escape</kbd> goes back, <kbd class="ds-kbd">Shift</kbd>+<kbd class="ds-kbd">Space</kbd> selects the row, <kbd class="ds-kbd">Ctrl</kbd>+<kbd class="ds-kbd">A</kbd> the page, <kbd class="ds-kbd">Ctrl</kbd>+<kbd class="ds-kbd">C</kbd> copies, <kbd class="ds-kbd">Shift</kbd>+<kbd class="ds-kbd">F10</kbd> opens the row\'s menu.</p>');
  },

  wire: function (root, h) {
    var grids = [];
    var timers = [];
    var fleet = gridFleet(36);
    var full = h.$('[data-demo="full-table"]', root);
    var card = h.$('[data-demo="full"]', root);

    var main = DS.datagrid.create(full, {
      columns: gridColumns(h, true),
      rows: fleet,
      select: 'multiple',
      bar: h.$('.ds-selection-bar', card),
      focus: 'cell',
      multiSort: true,
      resize: true,
      reorder: true,
      chooser: h.$('.ds-menu[aria-label="Columns"]', card),
      presets: [{ id: 'triage', label: 'Triage', columns: ['name', 'load', 'status', 'tickets'] }],
      detail: function (row) {
        return '<dl class="ds-facts"><div><dt>Owner</dt><dd>' + h.esc(row.owner) + '</dd></div><div><dt>Location</dt><dd>' + h.esc(row.place) + '</dd></div><div><dt>Bought</dt><dd>' + DS.format.absolute(row.bought, { dateStyle: 'medium' }) + '</dd></div></dl>';
      },
      actions: function (row) {
        return '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Actions for ' + h.esc(row.name) + '" aria-haspopup="menu" aria-expanded="false" data-ds-datagrid-menu>' + h.icon('moreVertical', 20) + '</button>';
      },
      menu: h.$('.ds-menu[aria-label="Device actions"]', card),
      sort: [{ key: 'name', dir: 'ascending' }],
      page: { size: 10 },
      pager: h.$('.ds-pagination', card),
    });
    grids.push(main);

    full.addEventListener('ds:action', function (event) {
      var detail = event.detail;
      if (detail.action === 'copy') navigator.clipboard && navigator.clipboard.writeText(detail.row.name).catch(function () {});
      h.toast({ open: 'Opened ', ticket: 'New ticket for ', copy: 'Copied ', retire: 'Retiring stays a demo: ' }[detail.action] + detail.row.name + '.', 'info');
    });
    full.addEventListener('ds:edit', function (event) {
      h.toast('Saved ' + event.detail.column + ' of ' + event.detail.row.name + '.', 'success');
    });

    root.addEventListener('click', function (event) {
      var target = event.target.closest('[data-demo]');
      if (!target) return;
      var kind = target.getAttribute('data-demo');
      if (kind === 'open') h.toast('Opened ' + target.getAttribute('data-name') + '.', 'info');
      if (kind === 'retire') h.toast('Retiring ' + main.get().selection.count + ' devices stays a demo.', 'info');
      if (kind === 'fail') target.setAttribute('aria-pressed', String(target.getAttribute('aria-pressed') !== 'true'));
    });
    root.addEventListener('input', function (event) {
      if (event.target.getAttribute('data-demo') === 'filter') main.set({ filter: event.target.value });
    });

    // Tree rows.
    grids.push(DS.datagrid.create(h.$('[data-demo="tree"]', root), {
      columns: [{ key: 'name', label: 'Name' }, { key: 'kind', label: 'Kind' }, { key: 'load', label: 'Load', type: 'number', format: function (value) { return value === undefined ? '' : value + '%'; } }],
      rows: gridTree(),
      tree: true,
      expanded: ['a', 'a1'],
      sortable: true,
    }));

    // Row groups.
    grids.push(DS.datagrid.create(h.$('[data-demo="groups"]', root), {
      columns: [{ key: 'name', label: 'Device', className: 'ds-nowrap' }, { key: 'model', label: 'Model' }, { key: 'tickets', label: 'Tickets', type: 'number', summary: 'sum' }, { key: 'load', label: 'Load', type: 'number', summary: 'avg', format: function (value) { return value + '%'; } }],
      rows: gridFleet(12),
      group: 'model',
      collapsed: ['Tablet 11', 'Tablet 13'],
      sort: [{ key: 'name', dir: 'ascending' }],
    }));

    // Server data: a fake backend that sorts and pages after a moment.
    var tickets = [];
    for (var i = 0; i < 64; i += 1) tickets.push({ id: 't' + (i + 1), title: ['Replace the fan', 'Battery swells', 'Screen flickers', 'Update the firmware', 'Keyboard sticks', 'No network'][i % 6], device: gridFleet(64)[(i * 7) % 64].name, opened: (i * 17) % 40 + 1, priority: ['Low', 'Normal', 'High'][i % 3] });
    var failButton = h.$('[data-demo="fail"]', root);
    grids.push(DS.datagrid.create(h.$('[data-demo="server"]', root), {
      columns: [{ key: 'title', label: 'Ticket', sortable: true }, { key: 'device', label: 'Device', sortable: true, className: 'ds-nowrap' }, { key: 'priority', label: 'Priority', sortable: true }, { key: 'opened', label: 'Open for', type: 'number', sortable: true, summary: 'sum', format: function (value) { return value + ' d'; } }],
      source: function (query, context) {
        return new Promise(function (resolve, reject) {
          var timer = setTimeout(function () {
            if (failButton.getAttribute('aria-pressed') === 'true') {
              failButton.setAttribute('aria-pressed', 'false');
              reject(new Error('The fake server failed, as asked.'));
              return;
            }
            var result = DS.datagrid.query(tickets, { columns: [{ key: 'title' }, { key: 'device' }, { key: 'priority' }, { key: 'opened', type: 'number' }], sort: query.sort, filter: query.filter, page: query.page });
            resolve({ rows: result.rows, total: result.total, summary: { opened: result.filtered.reduce(function (sum, row) { return sum + row.opened; }, 0) } });
          }, h.slow(600));
          timers.push(timer);
          context.signal.addEventListener('abort', function () { clearTimeout(timer); });
        });
      },
      page: { size: 10 },
      pager: h.$('.ds-pagination[aria-label="Pages of tickets"]', root),
      sort: [{ key: 'opened', dir: 'descending' }],
    }));

    // Stacked rows: labels from the columns, values edited in place.
    grids.push(DS.datagrid.create(h.$('[data-demo="stack"]', root), {
      columns: [{ key: 'name', label: 'Device', className: 'ds-nowrap' }, { key: 'owner', label: 'Owner', edit: { type: 'select', options: GRID_OWNERS } }, { key: 'place', label: 'Location', edit: true }],
      rows: gridFleet(3),
    }));

    // Ten thousand rows.
    var many = gridFleet(10000);
    grids.push(DS.datagrid.create(h.$('[data-demo="virtual"]', root), {
      columns: [{ key: 'name', label: 'Device', sortable: true }, { key: 'model', label: 'Model', sortable: true }, { key: 'owner', label: 'Owner', sortable: true }, { key: 'load', label: 'Load', type: 'number', sortable: true, format: function (value) { return value + '%'; } }],
      rows: many,
      virtual: { estimate: 52 },
      focus: 'cell',
      select: 'multiple',
    }));

    // The states.
    var cols = [{ key: 'name', label: 'Device' }, { key: 'model', label: 'Model' }, { key: 'load', label: 'Load', type: 'number' }];
    grids.push(DS.datagrid.create(h.$('[data-demo="empty"]', root), { columns: cols, rows: [] }));
    grids.push(DS.datagrid.create(h.$('[data-demo="loading"]', root), { columns: cols, source: function () { return new Promise(function () {}); } }));
    grids.push(DS.datagrid.create(h.$('[data-demo="error"]', root), { columns: cols, source: function () { return Promise.reject(new Error('Offline')); } }));
    grids.push(DS.datagrid.create(h.$('[data-demo="no-results"]', root), { columns: cols, rows: gridFleet(4), filter: 'floor 9' }));

    return function () {
      timers.forEach(clearTimeout);
      grids.forEach(function (grid) { grid.destroy(); });
    };
  },
});
