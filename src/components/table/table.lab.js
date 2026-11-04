/*
 * The Motion Lab entries of the table: rows that glide, turn their arrow and
 * open their details, and the bar of a bulk selection. A classic script: the
 * build wraps it into styleguide/lab-components.js. The helpers are the lab's
 * own (styleguide/lab.js), which keeps them private. Nothing here reads DS
 * while the file loads, so the rows and their icons render in setup().
 */
var $ = function (selector, root) { return (root || document).querySelector(selector); };
var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
var icon = function (name, size, cls) { return DS.icons.icon(DS.icons[name], size, cls); };

function after(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, Math.max(0, ms)); });
}

function wait(sg, ms) { return after(sg.slow(ms)); }

/* Everything finite that still runs under the stage has ended (loops and scroll-driven animations do not count). */
function quiet(root, sg) {
  var end = Date.now() + sg.slow(10000);
  function round() {
    var running = root.getAnimations({ subtree: true }).filter(function (animation) {
      var timing = animation.effect && animation.effect.getComputedTiming();
      return timing && isFinite(timing.endTime) && animation.timeline === root.ownerDocument.timeline && animation.playState === 'running';
    });
    if (!running.length || Date.now() > end) return undefined;
    return Promise.race([
      Promise.all(running.map(function (animation) { return animation.finished.catch(function () {}); })),
      after(end - Date.now()),
    ]).then(function () { return sg.frames(2); }).then(round);
  }
  return sg.frames(2).then(round);
}

function switchHtml(id, name) {
  return '<label class="ds-switch"><input type="checkbox" role="switch" id="' + id + '"><span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">' + name + '</span>' +
    '<span class="ds-switch__state" aria-hidden="true"><span class="ds-switch__on">On</span><span class="ds-switch__off">Off</span></span></label>';
}

var TABLE = {
  rows: [
    { id: 'r1', name: 'LAPTOP-0042', owner: 'Ada Lovelace', load: 32, place: 'Building A, 1st floor' },
    { id: 'r2', name: 'LAPTOP-0043', owner: 'Alan Turing', load: 14, place: 'Building A, 2nd floor' },
    { id: 'r3', name: 'DESKTOP-0107', owner: '', load: 93, place: 'Server room' },
    { id: 'r4', name: 'LAPTOP-0051', owner: 'Grace Hopper', load: 78, place: 'Building B, ground floor' },
    { id: 'r5', name: 'TABLET-0121', owner: 'Katherine Johnson', load: 47, place: 'Building B, 1st floor' },
  ],
  sort: 'name',
  dir: 'ascending',
  filter: '',
  selected: {},
  expanded: {},
  feed: 0,
};

function tableShown() {
  var query = TABLE.filter.trim().toLowerCase();
  var sign = TABLE.dir === 'ascending' ? 1 : -1;
  return TABLE.rows.filter(function (row) { return !query || (row.name + ' ' + row.owner).toLowerCase().indexOf(query) !== -1; })
    .sort(function (a, b) { return sign * (TABLE.sort === 'load' ? a.load - b.load : a.name.localeCompare(b.name)); });
}

function tableHeadHtml() {
  var sortable = function (key, text, cls) {
    var sorted = TABLE.sort === key;
    return '<th scope="col"' + (cls ? ' class="' + cls + '"' : '') + (sorted ? ' aria-sort="' + TABLE.dir + '"' : '') + '><button class="ds-table__sort" type="button" data-table-sort="' + key + '">' + text + (sorted ? icon('arrowUp', 16, 'ds-table__sort-arrow') : '') + '</button></th>';
  };
  return '<tr><th scope="col"><input type="checkbox" aria-label="Select all devices" data-table-all></th><th scope="col"><span class="ds-sr">Details</span></th>' + sortable('name', 'Device') + '<th scope="col" class="ds-col--secondary">Owner</th>' + sortable('load', 'Load', 'ds-num') + '</tr>';
}

function tableRowsHtml(rows) {
  return rows.map(function (row) {
    var open = !!TABLE.expanded[row.id];
    return '<tr data-ds-key="' + row.id + '"><td><input type="checkbox" aria-label="Select ' + row.name + '" data-table-row' + (TABLE.selected[row.id] ? ' checked' : '') + '></td>' +
      '<td><button class="ds-btn ds-btn--quiet ds-btn--icon ds-table__toggle" type="button" aria-expanded="' + open + '" aria-controls="sg-lab-detail-' + row.id + '" aria-label="Details of ' + row.name + '" data-table-toggle>' + icon('chevronDown', 20, 'ds-chevron') + '</button></td>' +
      '<td class="ds-nowrap">' + row.name + '</td><td class="ds-col--secondary">' + (row.owner || '<span class="ds-muted">Not issued</span>') + '</td><td class="ds-num">' + row.load + '%</td></tr>' +
      '<tr class="ds-table__detail" id="sg-lab-detail-' + row.id + '" data-ds-key="' + row.id + '-detail"' + (open ? '' : ' inert') + '><td colspan="5"><div class="ds-table__expand"><div><dl class="ds-facts"><div><dt>Location</dt><dd>' + row.place + '</dd></div><div><dt>Owner</dt><dd>' + (row.owner || 'Not issued') + '</dd></div></dl></div></div></td></tr>';
  }).join('');
}

function tableSync(stage) {
  var rows = tableShown();
  var checked = rows.filter(function (row) { return TABLE.selected[row.id]; }).length;
  var all = $('[data-table-all]', stage);
  all.checked = rows.length > 0 && checked === rows.length;
  all.indeterminate = checked > 0 && checked < rows.length;
}

/* A user's sort or filter glides at once; the live feed waits for the pointer. */
function tableRender(stage, live) {
  var tbody = $('tbody', stage);
  DS.dom.morphHtml($('thead', stage), tableHeadHtml());
  var done = DS.motion.flip(tbody, function (options) { DS.dom.morphHtml(tbody, tableRowsHtml(tableShown()), options); }, { items: 'tr', live: !!live });
  tableSync(stage);
  // A table that fits again keeps no edge fade.
  DS.motion.resyncScroll($('.ds-table-wrap', stage));
  return done;
}

function tableSortBy(stage, key) {
  TABLE.dir = TABLE.sort === key && TABLE.dir === 'ascending' ? 'descending' : 'ascending';
  TABLE.sort = key;
  return tableRender(stage);
}

SG_LAB.add({
  id: 'table',
  group: 'feedback',
  title: 'Table',
  note: 'Sort by a column or type a filter: the rows glide to their places through <code>DS.motion.flip</code> on every keystroke, and the sort arrow turns. "Select all" checks every row in the same frame. A row\'s chevron opens its details, the room on <code>--ds-ease-out</code> (a layout size), the content fading in. The live feed changes the load every 2s; sorted by load the rows reorder, but only while the mouse is not over the table.',
  shows: ['DS.motion.flip', 'DS.dom.morphHtml', 'DS.motion.resyncScroll', '.ds-chevron', '--ds-dur-slow', '--ds-dur-medium', '--ds-dur-base', '--ds-ease-spatial', '--ds-ease-out', '--ds-ease-in'],
  html: '<div class="ds-table-wrap"><table class="ds-table ds-table--interactive sg-lab-table"><caption class="ds-sr">Devices</caption><thead></thead><tbody></tbody></table></div>',
  height: 420,
  wide: true,
  controls: '<div class="sg-row"><div class="ds-field sg-data-filter"><label class="ds-field__label" for="sg-lab-table-filter">Filter</label><input class="ds-input" id="sg-lab-table-filter" type="search" autocomplete="off" placeholder="Device or owner"></div>' + switchHtml('sg-lab-table-live', 'Live feed, sorted by load') + '</div>',
  setup: function (stage, sg) {
    var card = stage.parentNode;
    DS.dom.morphHtml($('thead', stage), tableHeadHtml());
    DS.dom.morphHtml($('tbody', stage), tableRowsHtml(tableShown()));
    stage.addEventListener('click', function (event) {
      var sort = event.target.closest('[data-table-sort]');
      if (sort) tableSortBy(stage, sort.getAttribute('data-table-sort'));
      var toggle = event.target.closest('[data-table-toggle]');
      if (toggle) {
        var id = toggle.closest('tr').getAttribute('data-ds-key');
        TABLE.expanded[id] = !TABLE.expanded[id];
        toggle.setAttribute('aria-expanded', String(TABLE.expanded[id]));
        $('#sg-lab-detail-' + id, stage).inert = !TABLE.expanded[id];
      }
    });
    stage.addEventListener('change', function (event) {
      var input = event.target;
      if (input.hasAttribute('data-table-all')) {
        tableShown().forEach(function (row) { TABLE.selected[row.id] = input.checked; });
        $$('[data-table-row]', stage).forEach(function (row) { row.checked = input.checked; });
      }
      if (input.hasAttribute('data-table-row')) TABLE.selected[input.closest('tr').getAttribute('data-ds-key')] = input.checked;
      tableSync(stage);
    });
    $('#sg-lab-table-filter', card).addEventListener('input', function (event) {
      TABLE.filter = event.target.value;
      tableRender(stage);
    });
    $('#sg-lab-table-live', card).addEventListener('change', function (event) {
      clearInterval(TABLE.feed);
      TABLE.feed = 0;
      if (!event.target.checked) return;
      TABLE.sort = 'load';
      TABLE.dir = 'descending';
      TABLE.feed = setInterval(function () {
        TABLE.rows.forEach(function (row) { if (Math.random() < 0.6) row.load = Math.max(1, Math.min(99, row.load + Math.round((Math.random() - 0.5) * 50))); });
        tableRender(stage, true);
      }, sg.slow(2000));
      tableRender(stage);
    });
    tableSync(stage);
  },
  play: function (stage, sg) { return tableSortBy(stage, 'load').then(function () { return quiet(stage, sg); }); },
});

/* The bar of a bulk selection. */

function selectionToolbar() {
  return '<div class="ds-action-bar"><div class="ds-search">' + icon('search', 20) + '<input class="ds-input" type="search" aria-label="Search devices" placeholder="Search devices"></div><p class="ds-meta">3 devices</p></div>';
}

function selectionBar(count) {
  return '<div class="ds-selection-bar" role="toolbar" aria-label="Selected devices"><button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Clear selection" data-selection-clear>' + icon('close', 20) + '</button>' +
    '<p class="ds-selection-bar__count" aria-live="polite">' + count + ' selected</p><div class="ds-selection-bar__actions"><button class="ds-btn ds-btn--text" type="button">' + icon('trash', 18) + 'Delete</button></div></div>';
}

/* The bar and the toolbar cross only when the count goes from 0 to 1 and back; the count text changes at once. */
function selectionSync(stage) {
  var boxes = $$('tbody input', stage);
  var count = boxes.filter(function (box) { return box.checked; }).length;
  var slot = $('.ds-swap', stage);
  var bar = $(':scope > .ds-selection-bar:not([data-ds-leaving])', slot);
  var all = $('thead input', stage);
  all.checked = count === boxes.length;
  all.indeterminate = count > 0 && count < boxes.length;
  var template = document.createElement('template');
  if (count && !bar) {
    template.innerHTML = selectionBar(count);
    return DS.motion.crossfade(slot, template.content.firstElementChild);
  }
  if (!count && bar) {
    template.innerHTML = selectionToolbar();
    return DS.motion.crossfade(slot, template.content.firstElementChild);
  }
  if (bar) $('.ds-selection-bar__count', bar).textContent = count + ' selected';
  return Promise.resolve();
}

SG_LAB.add({
  id: 'selection-bar',
  group: 'feedback',
  title: 'Bulk selection bar',
  note: 'Check a row: the <code>.ds-selection-bar</code> crosses with the toolbar in one <code>.ds-swap</code> slot (<code>DS.motion.crossfade()</code>: the bar fades in over <code>--ds-dur-fast</code>, the toolbar out over <code>--ds-dur-instant</code>), so the table never moves. More rows only change the count, at once; clearing the selection crosses back.',
  shows: ['.ds-selection-bar', 'DS.motion.crossfade', '.ds-swap', '--ds-dur-fast', '--ds-dur-instant', '--ds-ease-in-out'],
  html: '<div class="ds-toolbar"><div class="ds-swap"></div></div>' +
    '<div class="ds-table-wrap"><table class="ds-table"><caption class="ds-sr">Devices to select</caption><thead><tr><th scope="col"><input type="checkbox" aria-label="Select all devices"></th><th scope="col">Device</th></tr></thead><tbody>' +
    ['LAPTOP-0042', 'TABLET-0121', 'PRINTER-0003'].map(function (name) { return '<tr><td><input type="checkbox" aria-label="Select ' + name + '"></td><td>' + name + '</td></tr>'; }).join('') + '</tbody></table></div>',
  height: 280,
  setup: function (stage) {
    DS.dom.morphHtml($('.ds-swap', stage), selectionToolbar());
    stage.addEventListener('change', function (event) {
      if (event.target.closest('thead')) $$('tbody input', stage).forEach(function (box) { box.checked = event.target.checked; });
      selectionSync(stage);
    });
    stage.addEventListener('click', function (event) {
      if (!event.target.closest('[data-selection-clear]')) return;
      $$('tbody input', stage).forEach(function (box) { box.checked = false; });
      selectionSync(stage);
      $('thead input', stage).focus();
    });
  },
  play: function (stage, sg) {
    var boxes = $$('tbody input', stage);
    boxes[0].checked = true;
    return selectionSync(stage).then(function () { return wait(sg, 300); }).then(function () {
      boxes[1].checked = true;
      selectionSync(stage);
      return wait(sg, 300);
    }).then(function () {
      boxes.forEach(function (box) { box.checked = false; });
      return selectionSync(stage);
    }).then(function () { return quiet(stage, sg); });
  },
  state: function (stage) { return Boolean($('.ds-swap > .ds-selection-bar:not([data-ds-leaving])', stage)); },
  toggle: function (stage, on) {
    $$('tbody input', stage).forEach(function (box, index) { box.checked = on && index === 0; });
    return selectionSync(stage);
  },
});
