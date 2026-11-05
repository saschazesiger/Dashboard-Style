/*
 * The Filter bar demo: a bar over a list of devices that filters as you
 * type and choose, with the applied filters as chips and the count; the
 * same bar in a narrow column, where its filters fold behind "Filters" and
 * open in a side sheet. The system keeps the bar (data-ds-filterbar); wire()
 * is the page: it filters fake data on ds:filter, re-renders the list with
 * DS.dom.morphHtml inside DS.motion.flip and writes the count.
 */
var DEVICES = [
  ['LAPTOP-0042', 'laptop', 'online', 512, 'Ada Lovelace'],
  ['LAPTOP-0043', 'laptop', 'offline', 256, 'Grace Hopper'],
  ['DESKTOP-0007', 'desktop', 'online', 1024, 'Ada Lovelace'],
  ['DESKTOP-0011', 'desktop', 'maintenance', 2048, 'Alan Turing'],
  ['TABLET-0113', 'tablet', 'online', 128, 'Grace Hopper'],
  ['TABLET-0114', 'tablet', 'offline', 64, 'Ada Lovelace'],
  ['PHONE-0021', 'phone', 'online', 256, 'Alan Turing'],
  ['PHONE-0022', 'phone', 'maintenance', 128, 'Ada Lovelace'],
  ['SERVER-0002', 'server', 'online', 4096, 'Alan Turing'],
  ['SERVER-0003', 'server', 'offline', 8192, 'Grace Hopper'],
].map(function (row, index) {
  return { id: 'd' + index, name: row[0], kind: row[1], status: row[2], storage: row[3], owner: row[4] };
});

var ICONS = { laptop: 'laptop', desktop: 'monitor', tablet: 'tablet', phone: 'smartphone', server: 'server' };
var STATUS = { online: ['Online', 'checkCircle', 'success'], offline: ['Offline', 'wifiOff', 'neutral'], maintenance: ['Maintenance', 'wrench', 'warning'] };

function select(h, name, label, options) {
  var id = h.uid(name);
  return '<div class="ds-field"><label class="ds-field__label" for="' + id + '">' + label + '</label><select class="ds-input" id="' + id + '" name="' + name + '"><option value="">Any</option>' +
    options.map(function (option) { return '<option value="' + option[0] + '">' + option[1] + '</option>'; }).join('') + '</select></div>';
}

function range(h) {
  var from = h.uid('from');
  var to = h.uid('to');
  return '<div role="group" aria-label="Storage in GB" data-ds-filter-label="Storage" style="display: flex; gap: var(--ds-space-2)">' +
    '<div class="ds-field" style="width: 96px"><label class="ds-field__label" for="' + from + '">Storage from</label><input class="ds-input" id="' + from + '" type="number" inputmode="numeric" min="0" name="storage" data-ds-filter-bound="min" placeholder="GB"></div>' +
    '<div class="ds-field" style="width: 96px"><label class="ds-field__label" for="' + to + '">to</label><input class="ds-input" id="' + to + '" type="number" inputmode="numeric" min="0" name="storage" data-ds-filter-bound="max" placeholder="GB"></div></div>';
}

function bar(h, label, sheet, all) {
  return '<div class="ds-filterbar" data-ds-filterbar data-ds-filterbar-sheet="#' + sheet + '" role="search" aria-label="' + label + '">' +
    '<div class="ds-filterbar__row">' +
    '<div class="ds-search ds-filterbar__search">' + h.icon('search', 20) + '<input class="ds-input" type="search" name="q" aria-label="Search devices" placeholder="Search devices"></div>' +
    '<div class="ds-filterbar__filters">' +
    select(h, 'status', 'Status', [['online', 'Online'], ['offline', 'Offline'], ['maintenance', 'Maintenance']]) +
    select(h, 'kind', 'Type', [['laptop', 'Laptop'], ['desktop', 'Desktop'], ['tablet', 'Tablet'], ['phone', 'Phone'], ['server', 'Server']]) +
    range(h) +
    (all ? '<label class="ds-check"><input type="checkbox" name="mine" value="yes" data-ds-filter-label="Owner"><span>Only mine</span></label>' : '') +
    '</div>' +
    '<button class="ds-btn ds-filterbar__more" type="button" aria-haspopup="dialog">' + h.icon('filter', 20) + 'Filters<span class="ds-badge ds-filterbar__badge" hidden></span></button>' +
    '<p class="ds-filterbar__count" aria-live="polite"></p></div>' +
    '<div class="ds-filterbar__applied" hidden><div class="ds-chips ds-filterbar__chips" role="group" aria-label="Applied filters"></div>' +
    '<button class="ds-btn ds-btn--text ds-filterbar__clear" type="button">Clear all</button></div></div>' +
    '<dialog class="ds-sheet" id="' + sheet + '" aria-labelledby="' + sheet + '-title"><div class="ds-sheet__backdrop" data-ds-close></div>' +
    '<section class="ds-sheet__panel"><div class="ds-sheet__head"><h2 class="ds-sheet__title" id="' + sheet + '-title">Filters</h2>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>' + h.icon('close', 20) + '</button></div>' +
    '<div class="ds-sheet__body" tabindex="0"></div>' +
    '<div class="ds-sheet__foot"><button class="ds-btn ds-btn--text ds-filterbar__clear" type="button">Clear all</button>' +
    '<button class="ds-btn ds-btn--filled ds-filterbar__results" type="button" data-ds-close>Show results</button></div></section></dialog>';
}

function matches(device, filters) {
  var q = (filters.q || [''])[0].toLowerCase();
  var storage = filters.storage || ['', ''];
  return (!q || device.name.toLowerCase().indexOf(q) >= 0 || device.owner.toLowerCase().indexOf(q) >= 0) &&
    (!filters.status || filters.status.indexOf(device.status) >= 0) &&
    (!filters.kind || filters.kind.indexOf(device.kind) >= 0) &&
    (!filters.mine || device.owner === 'Ada Lovelace') &&
    (storage[0] === '' || device.storage >= Number(storage[0])) &&
    (storage[1] === '' || device.storage <= Number(storage[1]));
}

function rowsHtml(h, filters) {
  return DEVICES.filter(function (device) { return matches(device, filters); }).map(function (device) {
    var status = STATUS[device.status];
    return '<li class="ds-list__item" data-ds-key="' + device.id + '">' + h.icon(ICONS[device.kind], 20, 'ds-list__icon') +
      '<span class="ds-list__text"><span class="ds-list__title">' + h.esc(device.name) + '</span><span class="ds-list__meta">' + h.esc(device.owner) + ' · ' + device.storage + ' GB</span></span>' +
      '<span class="ds-status ds-tone-' + status[2] + '">' + h.icon(status[1], 16) + '<span>' + status[0] + '</span></span></li>';
  }).join('');
}

function block(h, label, narrow) {
  return '<div class="sg-filterbar-block" style="display: grid; gap: var(--ds-space-4);' + (narrow ? ' max-width: 400px' : '') + '">' + bar(h, label, h.uid('filters-sheet'), narrow) +
    '<ul class="ds-list" aria-label="' + label + ': devices" data-demo-list></ul></div>';
}

SG.demo('filterbar', {
  title: 'Filter bar',
  group: 'data',
  need: 'Filter a list from a bar of inline filters that fold into a sheet when narrow, with applied chips, Clear all and a count',
  lead: 'A search and inline filters above a list. What is applied shows as chips, each removable, with Clear all; the count follows. When the bar is too narrow for its filters they fold behind a Filters button and open in a side sheet.',
  options: { tones: false },

  render: function (h) {
    return h.section('Inline', block(h, 'Filter devices', false),
      'Type to search; choose a status, a type or a storage range. Each applied value is a chip that removes it. Narrow the width in the options panel to watch the filters fold.') +
      h.section('Folded', block(h, 'Filter devices, narrow', true),
        'Here the row cannot hold the filters (one more: Only mine), so they fold behind Filters, whose badge counts what is applied among them. The sheet holds the same controls, stacked; they go back when it closes.') +
      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> goes through the search, the filters or Filters, the chips and Clear all. <kbd class="ds-kbd">Enter</kbd> on a chip removes it and the focus moves to the next chip. Every removal is announced, and the count is a polite live region.</p>');
  },

  wire: function (root, h) {
    h.$$('.sg-filterbar-block', root).forEach(function (blockEl) {
      var el = h.$('.ds-filterbar', blockEl);
      var list = h.$('[data-demo-list]', blockEl);
      var bar = DS.filterbar.create(el);
      var render = function (filters, glide) {
        var html = rowsHtml(h, filters);
        if (glide) DS.motion.flip(list, function (options) { DS.dom.morphHtml(list, html, options); }, { items: 'li' });
        else DS.dom.morphHtml(list, html);
        bar.count(DEVICES.filter(function (device) { return matches(device, filters); }).length, { one: '{count} device', other: '{count} devices' });
      };
      render(bar.get(), false);
      el.addEventListener('ds:filter', function (event) { render(event.detail.filters, true); });
    });
  },
});
