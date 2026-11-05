/*
 * The Lists demo: rows that open a record, with media, a description and
 * an aside; stacked rows; sticky letter headings; key-value rows, bars,
 * facts and the lock. Registered through SG.demo() (styleguide/sg-core.js).
 * Size, density, shape and touch come from the options panel around it, so
 * nothing here carries a size class but the row's own small menu button.
 * The fake records stand for what a project's data layer returns.
 */
var RECORDS = [
  { id: 'd42', name: 'LAPTOP-0042', glyph: 'laptop', meta: 'Notebook 14 · Building A', status: ['warning', 'alert', 'Warranty ends'] },
  { id: 'd17', name: 'LAPTOP-0017', glyph: 'laptop', meta: 'Notebook 14 · Building B, 2nd floor', status: ['ok', 'check', 'Managed'] },
  { id: 'p03', name: 'PRINTER-0003', glyph: 'box', meta: 'Printer · Floor 2, by the kitchen', status: ['error', 'alertCircle', 'Offline'] },
  { id: 'm09', name: 'MONITOR-0009', glyph: 'monitor', meta: 'Display · Retired, read only', blocked: true },
];

var PEOPLE = [
  { initials: 'AL', name: 'Ada Lovelace', role: 'Research', text: 'Asked for a second dock for the lab.', when: '09:12' },
  { initials: 'AT', name: 'Alan Turing', role: 'Research', text: 'Returned TABLET-0121 with its charger.', when: 'Yesterday' },
  { initials: 'GH', name: 'Grace Hopper', role: 'Service desk', text: 'Closed ticket #42 after the repair.', when: 'Mon' },
];

var LETTERS = [['A', ['Ada Lovelace', 'Alan Turing', 'Annie Easley']], ['G', ['Grace Hopper', 'Gladys West']], ['K', ['Katherine Johnson', 'Karen Sparck Jones']]];

function recordRow(h, row, current) {
  var chip = row.status ? '<span class="ds-status ds-tone-' + (row.status[0] === 'ok' ? 'success' : row.status[0]) + '">' + h.icon(row.status[1], 16) + '<span>' + row.status[2] + '</span></span>' : '';
  return '<li class="ds-list__item" data-ds-key="' + row.id + '">' + h.icon(row.glyph, 20, 'ds-list__icon') +
    '<span class="ds-list__text"><span class="ds-list__title"><a class="ds-list__action" href="#record" data-list-open data-name="' + row.name + '"' +
    (current ? ' aria-current="true"' : '') + (row.blocked ? ' aria-disabled="true" data-tip="Retired devices are read only"' : '') + '>' + row.name + '</a></span>' +
    '<span class="ds-list__meta">' + row.meta + (current ? ' · <strong>Open</strong>' : '') + '</span></span>' + chip +
    '<span class="ds-list__actions"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="More for ' + row.name + '" data-tip="More" data-list-more data-name="' + row.name + '">' + h.icon('moreVertical', 18) + '</button></span>' +
    h.icon('chevronRight', 20, 'ds-list__chevron') + '</li>';
}

function personRow(h, person, extra) {
  return '<li class="ds-list__item"><span class="ds-list__media ds-list__media--round" aria-hidden="true">' + person.initials + '</span>' +
    '<span class="ds-list__text"><span class="ds-list__title">' + person.name + '</span>' +
    '<span class="ds-list__description">' + person.text + '</span><span class="ds-list__meta">' + person.role + '</span></span>' +
    '<span class="ds-list__aside">' + person.when + '</span>' + (extra || '') + '</li>';
}

function letterRows() {
  return LETTERS.map(function (group) {
    return '<li class="ds-list__group" role="presentation"><h4 class="ds-list__heading">' + group[0] + '</h4></li>' +
      group[1].map(function (name) { return '<li class="ds-list__item"><span class="ds-list__text"><span class="ds-list__title">' + name + '</span></span></li>'; }).join('');
  }).join('');
}

var TICKETS = [
  { id: 't41', title: 'Replace the fan', meta: '#41 · LAPTOP-0042' },
  { id: 't42', title: 'Second dock for the lab', meta: '#42 · Ada Lovelace' },
  { id: 't43', title: 'Printer offline on floor 2', meta: '#43 · PRINTER-0003' },
  { id: 't44', title: 'New badge reader', meta: '#44 · Building B', blocked: true },
  { id: 't45', title: 'Return TABLET-0121', meta: '#45 · Alan Turing' }
];

function selectRow(h, ticket, type) {
  return '<li class="ds-list__item" data-ds-key="' + ticket.id + '"><input class="' + (type === 'radio' ? 'ds-radio-input' : 'ds-checkbox') + ' ds-list__check" type="' + type + '"' +
    (type === 'radio' ? ' name="' + h.uid('owner') + '"' : '') + ' value="' + ticket.id + '" aria-label="Select ' + h.esc(ticket.title) + '"' + (ticket.blocked ? ' disabled' : '') + '>' +
    '<span class="ds-list__text"><span class="ds-list__title">' + h.esc(ticket.title) + '</span><span class="ds-list__meta">' + h.esc(ticket.meta) + (ticket.blocked ? ' · closed' : '') + '</span></span></li>';
}

function virtualDevice(index) {
  var n = String(index + 1).padStart(4, '0');
  return { id: 'v' + n, name: 'DEVICE-' + n, meta: ['Notebook 14', 'Display 27', 'Printer', 'Tablet 11'][index % 4] + ' · Building ' + 'ABCD'.charAt(index % 4) };
}

SG.demo('list', {
  title: 'Lists',
  group: 'data',
  need: 'Show label and value pairs, short record lists or runs of small counts',
  lead: 'Records in rows that open, with media, a description and a fact at the end; rows chosen by a box, moved by a grip or windowed by the thousand; label and value rows, bars and facts that copy. A row is 56px at the default size and density, and every option steps from there.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var current = 'd17';
    return h.section('Rows that open', '<ul class="ds-list ds-list--interactive" aria-label="Devices" data-demo="rows">' + RECORDS.map(function (row) { return recordRow(h, row, row.id === current); }).join('') + '</ul>' +
      '<div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="reorder">' + h.icon('sort', 16) + 'Reorder</button></div>',
      'The title link stretches over the row; the menu button stays a control of its own. The second row is current (aria-current), the last one blocked. Reorder glides the rows through DS.motion.flip.') +

      h.section('Media, description, meta and actions', '<ul class="ds-list" aria-label="People" data-demo="media">' +
        personRow(h, PEOPLE[0], '<span class="ds-list__actions"><button class="ds-btn ds-btn--quiet ds-sm" type="button" aria-label="Reply to Ada Lovelace">Reply</button></span>') +
        personRow(h, PEOPLE[1]) +
        '<li class="ds-list__item"><span class="ds-list__media" aria-hidden="true">' + h.icon('image', 20) + '</span><span class="ds-list__text"><span class="ds-list__title">Floor plan, building A</span><span class="ds-list__meta">PNG · 2.4 MB</span></span><span class="ds-list__aside">3 Oct</span></li>' +
        '</ul>', '.ds-list__media takes a thumbnail, an icon or an avatar\'s initials (--round for a person). .ds-list__aside holds a short fact at the end of the row.') +

      h.section('Stacked', '<ul class="ds-list ds-list--stacked" aria-label="Open requests" data-demo="stacked">' +
        personRow(h, PEOPLE[0], '<span class="ds-status ds-tone-warning">' + h.icon('alert', 16) + '<span>In review</span></span>') +
        personRow(h, PEOPLE[2], '<span class="ds-status ds-tone-success">' + h.icon('check', 16) + '<span>Done</span></span>') +
        '</ul>', 'The trailing parts go under the text at any width, for a narrow column or a side sheet.') +

      h.section('Sticky headings', '<div tabindex="0" role="region" aria-label="People by letter" data-demo="letters" style="max-block-size:240px;overflow:auto"><ul class="ds-list" role="list" aria-label="People">' + letterRows() + '</ul></div>',
        'A .ds-list__group row stays at the top of the nearest scroller while its rows pass under it. Scroll the box.') +

      h.section('Selectable', (function () {
        var id = h.uid('tickets');
        return '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:var(--ds-space-4)"><label class="ds-check"><input type="checkbox" aria-controls="' + id + '" data-ds-list-all data-demo="all"> Select all</label>' +
          '<span class="ds-muted" data-demo="picked" aria-live="polite">None selected</span></div>' +
          '<ul class="ds-list" id="' + id + '" aria-label="Open tickets" data-ds-list data-ds-list-select="multiple" data-demo="select">' + TICKETS.map(function (ticket) { return selectRow(h, ticket, 'checkbox'); }).join('') + '</ul>';
      })() +
        '<h4 class="ds-meta">One owner</h4><ul class="ds-list" aria-label="Owner" data-ds-list data-ds-list-select="single" data-demo="single">' + TICKETS.slice(0, 3).map(function (ticket) { return selectRow(h, ticket, 'radio'); }).join('') + '</ul>',
        'A press anywhere on a row toggles its box; Shift and a click checks the rows between. "Select all" shows mixed for some; the closed ticket stays as it is. Radios choose one.') +

      h.section('Reorder', '<ul class="ds-list" aria-label="Rollout order" data-ds-list data-ds-list-reorder data-demo="reorder-list">' +
        ['Building A', 'Building B', 'Lab', 'Storage'].map(function (name, index) {
          return '<li class="ds-list__item" data-ds-key="o' + index + '">' + h.icon('building', 20, 'ds-list__icon') + '<span class="ds-list__text"><span class="ds-list__title">' + name + '</span><span class="ds-list__meta">Wave ' + (index + 1) + '</span></span></li>';
        }).join('') + '</ul>',
        'Drag a grip, or Tab to it, press Space, move with the arrow keys and press Space again. The page saves on ds:drop.') +

      h.section('Virtual', '<p class="ds-muted" data-demo="virtual-out" aria-live="polite">5,000 devices, 0 selected</p><ul class="ds-list ds-list--scroll" aria-label="All devices" data-demo="virtual"></ul>',
        'DS.list.create(el, { select, virtual }): only the rows near the viewport exist. One tab stop: the arrow keys, Home, End and Page keys move it, Space checks the row.') +

      h.section('Key-value rows', '<div class="ds-grid-2">' + h.card('Rows that open', '<ul class="ds-kv-list ds-kv-list--interactive" data-demo="kv">' +
        '<li><a class="ds-kv-list__row" href="#owner" data-list-kv data-name="Ada Lovelace"><span>Owner</span><strong>Ada Lovelace</strong></a></li>' +
        '<li><button class="ds-kv-list__row" type="button" data-list-kv data-name="the open tickets"><span>Tickets</span><strong>3 open</strong></button></li>' +
        '<li><button class="ds-kv-list__row" type="button" aria-disabled="true" data-tip="Only an administrator can change it"><span>Cost centre</span><strong>4100</strong></button></li>' +
        '<li><div class="ds-kv-list__row"><span>Serial</span><strong>5CD1234XYZ</strong></div></li>' +
        '<li><div class="ds-kv-list__row"><span>Backup</span><strong>' + h.icon('checkCircle', 16, 'ds-kv-list__icon ds-tone-success') + '<span class="ds-sr">Passed:</span> Today, 02:00</strong></div></li>' +
        '<li><div class="ds-kv-list__row"><span>Battery</span><strong>' + h.icon('alert', 16, 'ds-kv-list__icon ds-tone-warning') + '<span class="ds-sr">Low:</span> 48%</strong></div></li>' +
        '<li><div class="ds-kv-list__row"><span>Sync</span><strong>' + h.icon('alertCircle', 16, 'ds-kv-list__icon ds-tone-error') + '<span class="ds-sr">Failed:</span> Yesterday</strong></div></li>' +
        '<li><div class="ds-kv-list__row"><span>Asset tag</span><strong class="ds-muted">Not set</strong></div></li></ul>') +
        h.card('Plain, and with bars', '<ul class="ds-kv-list"><li><span>Model</span><strong>Notebook 14</strong></li><li><span>Warranty until</span><strong>2027-03-31</strong></li><li><span>Storage</span><strong>512 GB</strong></li></ul>' +
        '<ul class="ds-kv-list ds-kv-list--bars" data-demo="bars">' +
        '<li><span>System disk</span><strong>78%, high</strong><span class="ds-meter ds-tone-warning" aria-hidden="true" style="--ds-share:.78"></span></li>' +
        '<li><span data-tip="Shared documents and project archives">Shared documents and project archives</span><strong>31%</strong><span class="ds-meter" aria-hidden="true" style="--ds-share:.31"></span></li></ul>') + '</div>',
        'Rows that open hang into the space at their sides, so their text stays in line with the static rows. A tone on a .ds-kv-list__icon always comes with a .ds-sr word.') +

      h.section('Facts, parts and the lock', '<div class="ds-grid-2">' + h.card('Facts', '<dl class="ds-facts" data-demo="facts"><div><dt>Last run</dt><dd>Today, 02:00</dd></div><div><dt>Changes</dt><dd><span class="ds-parts"><span class="ds-parts__list"><span><a href="#new">3 new</a></span><span><a href="#updated">1 updated</a></span><span>250 unchanged</span></span></span></dd></div><div><dt>Next</dt><dd>Tomorrow, 02:00</dd></div></dl>' +
        '<ul class="ds-plain-list"><li>Back up the disk first.</li><li>Then install the updates.</li></ul>') +
        h.card('Facts in rows', '<dl class="ds-facts ds-facts--rows"><div><dt>Owner</dt><dd>Ada Lovelace<span class="ds-lock" role="img" aria-label="Set by the directory sync" data-tip="Set by the directory sync">' + h.icon('lock', 16) + '</span></dd></div>' +
        '<div><dt>Location</dt><dd>Building A, 1st floor</dd></div><div><dt>Notes</dt><dd>Docking station at the desk by the window.</dd></div></dl>' +
        '<p class="ds-meta">Values with a lock come from the directory sync: change them there.</p>') + '</div>') +

      h.section('Description lists', '<dl class="ds-facts ds-facts--grid ds-facts--bordered" data-ds-facts-copy data-demo="grid">' +
        '<div><dt>Serial</dt><dd>5CD1234XYZ</dd></div><div><dt>Model</dt><dd>Notebook 14</dd></div><div><dt>Asset tag</dt><dd>IT-004211</dd></div>' +
        '<div class="ds-facts__wide"><dt>Location</dt><dd>Building A, 1st floor, room 101</dd></div><div><dt>Owner</dt><dd>Ada Lovelace</dd></div>' +
        '<div class="ds-facts__full"><dt>Notes</dt><dd data-ds-facts-nocopy>Issued with a second charger; the dock stays at the desk by the window.</dd></div></dl>' +
        '<div class="ds-grid-2" style="margin-top:var(--ds-space-4)">' + h.card('Stacked', '<dl class="ds-facts ds-facts--stacked"><div><dt>Owner</dt><dd>Ada Lovelace</dd></div><div><dt>Team</dt><dd>Research</dd></div><div><dt>Since</dt><dd>12 Oct 2026</dd></div></dl>') +
        h.card('Rows, bordered, copy', '<dl class="ds-facts ds-facts--rows ds-facts--bordered" data-ds-facts-copy><div><dt>Hostname</dt><dd>laptop-0042.example.test</dd></div><div><dt>MAC</dt><dd>00:1B:44:11:3A:B7</dd></div><div><dt>IP</dt><dd>10.20.4.17</dd></div></dl>') + '</div>',
        'A grid whose facts span (.ds-facts__wide, .ds-facts__full; one column where only one fits), bordered cells, stacked facts, and a copy button per value (data-ds-facts-copy): it shows on the fact under the pointer or in use.') +

      h.section('Empty', '<ul class="ds-list" aria-label="No devices"></ul><p class="ds-muted">An empty list takes no room: show an empty state instead.</p>') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the action of each row, then its other controls; <kbd class="ds-kbd">Enter</kbd> opens the record. The row shows an inset ring while its action has keyboard focus.</p>');
  },

  // What a page writes itself: opening a record, its menu, a new order.
  wire: function (root, h) {
    var rows = h.$('[data-demo="rows"]', root);
    var order = RECORDS.slice();
    var current = 'd17';
    var render = function () {
      return window.DS.motion.flip(rows, function (options) {
        window.DS.dom.morphHtml(rows, order.map(function (row) { return recordRow(h, row, row.id === current); }).join(''), options);
      });
    };
    var onClick = function (event) {
      var target = event.target.closest('[data-list-open], [data-list-more], [data-list-kv], [data-demo="reorder"]');
      if (!target || !root.contains(target)) return;
      if (target.matches('a')) event.preventDefault();
      if (target.getAttribute('aria-disabled') === 'true') return;
      if (target.hasAttribute('data-list-open')) {
        current = target.closest('.ds-list__item').getAttribute('data-ds-key');
        render();
        h.toast('Opened ' + target.getAttribute('data-name') + '.', 'info');
      }
      if (target.hasAttribute('data-list-more')) h.toast('More for ' + target.getAttribute('data-name') + '.', 'info');
      if (target.hasAttribute('data-list-kv')) h.toast('Opened ' + target.getAttribute('data-name') + '.', 'info');
      if (target.getAttribute('data-demo') === 'reorder') {
        order.push(order.shift());
        render();
      }
    };
    var picked = h.$('[data-demo="picked"]', root);
    var onChange = function (event) {
      if (event.target.getAttribute('data-demo') === 'select' && picked) picked.textContent = event.detail.keys.length ? event.detail.keys.length + ' selected' : 'None selected';
      if (event.target.getAttribute('data-demo') === 'virtual') h.$('[data-demo="virtual-out"]', root).textContent = '5,000 devices, ' + event.detail.keys.length + ' selected';
    };
    var onDrop = function (event) {
      h.toast('Moved ' + event.detail.item.querySelector('.ds-list__title').textContent + ' to place ' + (event.detail.to.index + 1) + '.', 'success');
    };
    var onCopy = function (event) { h.toast('Copied ' + event.detail.label + '.', 'success'); };
    window.DS.list.create(h.$('[data-demo="virtual"]', root), {
      select: 'multiple',
      virtual: {
        count: 5000,
        estimate: 56,
        key: function (index) { return virtualDevice(index).id; },
        render: function (index) {
          var device = virtualDevice(index);
          return '<li class="ds-list__item" data-ds-key="' + device.id + '"><input class="ds-checkbox ds-list__check" type="checkbox" aria-label="Select ' + device.name + '">' +
            '<span class="ds-list__text"><span class="ds-list__title">' + device.name + '</span><span class="ds-list__meta">' + device.meta + '</span></span></li>';
        }
      }
    });
    root.addEventListener('click', onClick);
    root.addEventListener('ds:change', onChange);
    root.addEventListener('ds:drop', onDrop);
    root.addEventListener('ds:copy', onCopy);
    return function () {
      root.removeEventListener('click', onClick);
      root.removeEventListener('ds:change', onChange);
      root.removeEventListener('ds:drop', onDrop);
      root.removeEventListener('ds:copy', onCopy);
    };
  }
});
