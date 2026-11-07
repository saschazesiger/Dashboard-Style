/*
 * The Facet filter panel demo: a panel of facets beside a list of devices,
 * with counts that follow the other facets (each facet counts what the
 * other filters leave), a search and a limit in the long Owner facet, an
 * "Any" radio facet and a range; the same panel in a narrow column, where
 * it folds behind Filters and opens in a side sheet. The system keeps the
 * panel (data-ds-facets); wire() is the page: it filters fake data on
 * ds:filter, re-renders the list with DS.dom.morphHtml inside
 * DS.motion.flip, and writes the counts and the total.
 */
var OWNERS = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson', 'Margaret Hamilton', 'Radia Perlman', 'Annie Easley'];
var KINDS = [['laptop', 'Laptop', 'laptop'], ['desktop', 'Desktop', 'monitor'], ['tablet', 'Tablet', 'tablet'], ['phone', 'Phone', 'smartphone'], ['server', 'Server', 'server']];
var STATES = [['online', 'Online', 'checkCircle', 'success'], ['offline', 'Offline', 'wifiOff', 'neutral'], ['maintenance', 'Maintenance', 'wrench', 'warning']];
var DEVICES = [];
(function () {
  var storage = [64, 128, 256, 512, 1024, 2048, 4096];
  for (var index = 0; index < 18; index += 1) {
    var kind = KINDS[(index * 3) % KINDS.length];
    DEVICES.push({
      id: 'd' + index,
      name: kind[1].toUpperCase() + '-' + String(100 + index * 7).padStart(4, '0'),
      kind: kind[0],
      status: STATES[(index * 5 + (index > 9 ? 1 : 0)) % 3][0],
      owner: OWNERS[(index * 2 + (index > 7 ? 1 : 0)) % OWNERS.length],
      storage: storage[(index * 4) % storage.length],
      seen: [1, 3, 20, 30, 70, 200, 400][(index * 3) % 7],
    });
  }
})();

var KEY = { 'Ada Lovelace': 'ada', 'Grace Hopper': 'grace', 'Alan Turing': 'alan', 'Katherine Johnson': 'katherine', 'Margaret Hamilton': 'margaret', 'Radia Perlman': 'radia', 'Annie Easley': 'annie' };

function check(type, name, value, label, count) {
  return '<label class="ds-check"><input type="' + type + '" name="' + name + '" value="' + value + '"' + (type === 'radio' && value === '' ? ' checked' : '') + '><span>' + label + '</span>' +
    (count === false ? '' : '<span class="ds-check__count">0</span>') + '</label>';
}

function panel(h, sheet, title, seen) {
  var min = h.uid('min');
  var max = h.uid('max');
  return '<section class="ds-facets" role="complementary" data-ds-facets data-ds-facets-sheet="#' + sheet + '" aria-labelledby="' + title + '">' +
    '<div class="ds-facets__head"><h2 class="ds-facets__title" id="' + title + '">Filters</h2>' +
    '<button class="ds-btn ds-btn--text ds-facets__clear" type="button">Clear all</button></div>' +
    '<div class="ds-facets__applied" hidden><div class="ds-chips ds-facets__chips" role="group" aria-label="Applied filters"></div></div>' +
    '<fieldset class="ds-facet"><legend class="ds-facet__title">Status</legend><div class="ds-facet__options">' +
    STATES.map(function (row) { return check('checkbox', 'status', row[0], row[1]); }).join('') + '</div></fieldset>' +
    '<fieldset class="ds-facet"><legend class="ds-facet__title">Type</legend><div class="ds-facet__options">' +
    KINDS.map(function (row) { return check('checkbox', 'kind', row[0], row[1]); }).join('') + '</div></fieldset>' +
    '<fieldset class="ds-facet" data-ds-facet-limit="4"><legend class="ds-facet__title">Owner</legend>' +
    '<div class="ds-search ds-facet__search">' + h.icon('search', 20) + '<input class="ds-input" type="search" aria-label="Search owners" placeholder="Search owners"></div>' +
    '<div class="ds-facet__options">' + OWNERS.map(function (owner) { return check('checkbox', 'owner', KEY[owner], owner); }).join('') + '</div>' +
    '<p class="ds-facet__empty" hidden></p><button class="ds-btn ds-btn--text ds-facet__more" type="button" hidden></button></fieldset>' +
    '<fieldset class="ds-facet"><legend class="ds-facet__title">Last seen</legend><div class="ds-facet__options">' +
    check('radio', seen, '', 'Any time', false) + check('radio', seen, '24', 'Last 24 hours', false) + check('radio', seen, '168', 'Last 7 days', false) + '</div></fieldset>' +
    '<fieldset class="ds-facet" data-ds-filter-label="Storage"><legend class="ds-facet__title">Storage (GB)</legend><div class="ds-facet__range">' +
    '<div class="ds-field"><label class="ds-field__label" for="' + min + '">Min</label><input class="ds-input" id="' + min + '" type="number" inputmode="numeric" min="0" name="storage" data-ds-filter-bound="min"></div>' +
    '<span class="ds-facet__dash" aria-hidden="true">–</span>' +
    '<div class="ds-field"><label class="ds-field__label" for="' + max + '">Max</label><input class="ds-input" id="' + max + '" type="number" inputmode="numeric" min="0" name="storage" data-ds-filter-bound="max"></div>' +
    '</div></fieldset></section>';
}

function sheetHtml(h, sheet) {
  return '<dialog class="ds-sheet" id="' + sheet + '" aria-labelledby="' + sheet + '-title"><div class="ds-sheet__backdrop" data-ds-close></div>' +
    '<section class="ds-sheet__panel"><div class="ds-sheet__head"><h2 class="ds-sheet__title" id="' + sheet + '-title">Filters</h2>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Close" data-ds-close>' + h.icon('close', 20) + '</button></div>' +
    '<div class="ds-sheet__body" tabindex="0"></div>' +
    '<div class="ds-sheet__foot"><button class="ds-btn ds-btn--filled ds-facets__results" type="button" data-ds-close>Show results</button></div></section></dialog>';
}

/** Whether a device passes the filters, leaving out one facet (its own counts). */
function passes(device, filters, skip) {
  var storage = filters.storage || ['', ''];
  return (skip === 'status' || !filters.status || filters.status.indexOf(device.status) >= 0) &&
    (skip === 'kind' || !filters.kind || filters.kind.indexOf(device.kind) >= 0) &&
    (skip === 'owner' || !filters.owner || filters.owner.indexOf(KEY[device.owner]) >= 0) &&
    (skip === 'seen' || !filters.seen || device.seen <= Number(filters.seen[0])) &&
    (skip === 'storage' || ((storage[0] === '' || device.storage >= Number(storage[0])) && (storage[1] === '' || device.storage <= Number(storage[1]))));
}

/** Each facet's counts: what the other filters leave, by value. */
function countsOf(filters) {
  var out = { status: {}, kind: {}, owner: {} };
  STATES.forEach(function (row) { out.status[row[0]] = 0; });
  KINDS.forEach(function (row) { out.kind[row[0]] = 0; });
  OWNERS.forEach(function (owner) { out.owner[KEY[owner]] = 0; });
  DEVICES.forEach(function (device) {
    if (passes(device, filters, 'status')) out.status[device.status] += 1;
    if (passes(device, filters, 'kind')) out.kind[device.kind] += 1;
    if (passes(device, filters, 'owner')) out.owner[KEY[device.owner]] += 1;
  });
  return out;
}

function rowsHtml(h, filters) {
  return DEVICES.filter(function (device) { return passes(device, filters, null); }).map(function (device) {
    var state = STATES.filter(function (row) { return row[0] === device.status; })[0];
    var kind = KINDS.filter(function (row) { return row[0] === device.kind; })[0];
    return '<li class="ds-list__item" data-ds-key="' + device.id + '">' + h.icon(kind[2], 20, 'ds-list__icon') +
      '<span class="ds-list__text"><span class="ds-list__title">' + h.esc(device.name) + '</span><span class="ds-list__meta">' + h.esc(device.owner) + ' · ' + device.storage + ' GB</span></span>' +
      '<span class="ds-status ds-tone-' + state[3] + '">' + h.icon(state[2], 16) + '<span>' + state[1] + '</span></span></li>';
  }).join('');
}

function block(h, label, narrow) {
  var sheet = h.uid('facets-sheet');
  // Radios of one name form one group across the page: each panel names its own.
  var seen = narrow ? 'seen-narrow' : 'seen';
  return '<div class="sg-facets-block" data-seen="' + seen + '"' + (narrow ? ' style="max-width: 560px"' : '') + '><div class="ds-facets-layout">' + panel(h, sheet, h.uid('facets-title'), seen) +
    '<div class="ds-facets-layout__main" style="display: grid; gap: var(--ds-space-3)">' +
    '<div style="display: flex; flex-wrap: wrap; align-items: center; gap: var(--ds-space-3)">' +
    '<button class="ds-btn ds-facets__toggle" type="button" aria-haspopup="dialog">' + h.icon('filter', 20) + 'Filters<span class="ds-badge ds-facets__badge" hidden></span></button>' +
    '<p class="ds-facets__count"></p></div>' +
    '<div class="ds-facets__applied" hidden><div class="ds-chips ds-facets__chips" role="group" aria-label="Applied filters"></div>' +
    '<button class="ds-btn ds-btn--text ds-facets__clear" type="button">Clear all</button></div>' +
    '<ul class="ds-list" aria-label="' + label + '" data-demo-list></ul></div></div>' + sheetHtml(h, sheet) + '</div>';
}

SG.demo('facets', {
  title: 'Facet filter panel',
  group: 'data',
  need: 'Filter a list from a panel of facets beside it: options with counts, a search inside long facets, ranges, applied chips and Clear all; a side sheet on phones',
  lead: 'Facets beside a list, each option with the number it would leave. A long facet has a search and shows its first options; ranges take two fields. What is applied shows as chips with Clear all. Where the panel does not fit beside the list it folds behind Filters and opens in a side sheet.',
  options: { tones: false },

  render: function (h) {
    return h.section('Beside the list', block(h, 'Devices', false),
      'Check a status or a type: the counts of the other facets follow. Search the owners, or show them all. An option that would leave nothing is disabled. Narrow the width in the options panel to watch the panel fold.') +
      h.section('Folded', block(h, 'Devices, narrow', true),
        'In a narrow column the panel folds behind Filters, whose badge counts what is applied. The applied filters stay in sight above the list as chips, each removable, with Clear all. The sheet holds the same panel; it goes back when the sheet closes.') +
      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> walks the facets (a radio facet is one stop; the arrows choose), <kbd class="ds-kbd">Space</kbd> checks. In a facet search <kbd class="ds-kbd">Escape</kbd> empties it first. The number of matches is announced once typing pauses, removals and Clear all when they happen, and the count of results once the changes pause.</p>');
  },

  wire: function (root, h) {
    h.$$('.sg-facets-block', root).forEach(function (blockEl) {
      var el = h.$('.ds-facets', blockEl);
      var list = h.$('[data-demo-list]', blockEl);
      var panel = DS.facets.create(el);
      var seen = blockEl.getAttribute('data-seen');
      var render = function (given, glide) {
        var filters = Object.assign({}, given, { seen: given[seen] });
        var html = rowsHtml(h, filters);
        if (glide) DS.motion.flip(list, function (options) { DS.dom.morphHtml(list, html, options); }, { items: 'li' });
        else DS.dom.morphHtml(list, html);
        panel.counts(countsOf(filters));
        panel.count(DEVICES.filter(function (device) { return passes(device, filters, null); }).length, { one: '{count} device', other: '{count} devices' });
      };
      render(panel.get(), false);
      el.addEventListener('ds:filter', function (event) { render(event.detail.filters, true); });
    });
  },
});
