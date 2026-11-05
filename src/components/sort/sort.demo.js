/*
 * The Sort control demo: the inline look and the menu look, each sorting a
 * list of devices that re-renders through DS.dom.morphHtml inside
 * DS.motion.flip (what a project writes on ds:sort), the field types and
 * their words, and a narrow row. The system keeps the control in step
 * (data-ds-sort); wire() holds only the page's sorting.
 */
var DEVICES = [
  { id: 'd1', name: 'LAPTOP-0042', seen: 3, storage: 512, kind: 'laptop' },
  { id: 'd2', name: 'DESKTOP-0007', seen: 45, storage: 1024, kind: 'monitor' },
  { id: 'd3', name: 'TABLET-0113', seen: 1, storage: 128, kind: 'tablet' },
  { id: 'd4', name: 'PHONE-0021', seen: 12, storage: 256, kind: 'smartphone' },
  { id: 'd5', name: 'SERVER-0002', seen: 0, storage: 4096, kind: 'server' },
];

function fieldsHtml(selected) {
  return '<option value="name" data-ds-sort-type="text"' + (selected === 'name' ? ' selected' : '') + '>Name</option>' +
    '<option value="seen" data-ds-sort-type="date" data-ds-sort-default="descending"' + (selected === 'seen' ? ' selected' : '') + '>Last seen</option>' +
    '<option value="storage" data-ds-sort-type="number" data-ds-sort-default="descending"' + (selected === 'storage' ? ' selected' : '') + '>Storage</option>';
}

function inline(h, value, label) {
  var id = h.uid('sort');
  return '<div class="ds-sort" data-ds-sort data-ds-value="' + value + '" role="group" aria-label="' + label + '">' +
    '<label class="ds-sort__label" for="' + id + '">Sort by</label>' +
    '<select class="ds-input ds-sort__field" id="' + id + '">' + fieldsHtml(value.replace('-', '')) + '</select>' +
    '<button class="ds-btn ds-btn--quiet ds-sort__order" type="button">' + h.icon('arrowUp', 20, 'ds-sort__arrow') +
    '<span class="ds-sr">Order: </span><span class="ds-sort__words"><span class="ds-sort__word"></span><span class="ds-sort__word"></span></span></button></div>';
}

function item(h, attrs, label) {
  return '<button class="ds-menu__item" role="menuitemradio" aria-checked="false" type="button" ' + attrs + '>' +
    h.icon('check', 20, 'ds-menu__check') + '<span class="ds-menu__label">' + label + '</span></button>';
}

function menu(h, value) {
  var id = h.uid('sort-menu');
  var by = h.uid('sort-by');
  var order = h.uid('sort-order');
  return '<div class="ds-sort ds-sort--menu" data-ds-sort data-ds-value="' + value + '">' +
    '<button class="ds-btn ds-sort__trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="' + id + '" data-ds-open="#' + id + '">' +
    h.icon('sort', 20) + '<span class="ds-sr">Sort by </span><span class="ds-sort__value"></span><span class="ds-sr">, </span>' +
    '<span class="ds-sort__words ds-sr"><span class="ds-sort__word"></span><span class="ds-sort__word"></span></span>' + h.icon('arrowUp', 20, 'ds-sort__arrow') + '</button>' +
    '<div class="ds-menu" id="' + id + '" role="menu" aria-label="Sort" hidden>' +
    '<div role="group" aria-labelledby="' + by + '"><p class="ds-menu__heading" id="' + by + '">Sort by</p>' +
    item(h, 'data-ds-sort-field="name" data-ds-sort-type="text"', 'Name') +
    item(h, 'data-ds-sort-field="seen" data-ds-sort-type="date" data-ds-sort-default="descending"', 'Last seen') +
    item(h, 'data-ds-sort-field="storage" data-ds-sort-type="number" data-ds-sort-default="descending"', 'Storage') + '</div>' +
    '<div class="ds-menu__divider" role="separator"></div>' +
    '<div role="group" aria-labelledby="' + order + '"><p class="ds-menu__heading" id="' + order + '">Order</p>' +
    item(h, 'data-ds-sort-direction="ascending"', '') + item(h, 'data-ds-sort-direction="descending"', '') + '</div></div></div>';
}

function seenText(days) {
  return days === 0 ? 'Seen today' : days === 1 ? 'Seen yesterday' : 'Seen ' + days + ' days ago';
}

function rowsHtml(h, state) {
  var list = DEVICES.slice().sort(function (a, b) {
    var x = a[state.field];
    var y = b[state.field];
    // Last seen counts in days ago: newest first is the smallest number first.
    if (state.field === 'seen') { x = -x; y = -y; }
    var order = typeof x === 'string' ? x.localeCompare(y) : x - y;
    return state.direction === 'descending' ? -order : order;
  });
  return list.map(function (device) {
    return '<li class="ds-list__item" data-ds-key="' + device.id + '">' + h.icon(device.kind, 20, 'ds-list__icon') +
      '<span class="ds-list__text"><span class="ds-list__title">' + h.esc(device.name) + '</span>' +
      '<span class="ds-list__meta">' + seenText(device.seen) + ' · ' + (device.storage >= 1024 ? device.storage / 1024 + ' TB' : device.storage + ' GB') + '</span></span></li>';
  }).join('');
}

function block(h, control, label) {
  return '<div class="sg-sort-block" style="display: grid; gap: var(--ds-space-3); max-width: 520px">' + control +
    '<ul class="ds-list" aria-label="' + label + '" data-demo-list></ul></div>';
}

SG.demo('sort', {
  title: 'Sort control',
  group: 'data',
  need: 'Sort a list or a set of cards by a field and a direction, outside a table',
  lead: 'The field and the direction of a list or cards. The direction is said in the words of the field: A to Z, Newest first, Highest first. The page sorts on ds:sort; the list glides to its new order.',
  options: { variants: ['inline', 'menu'], tones: false },

  render: function (h) {
    var show = function (name) { return !h.variant || h.variant === name; };
    return (show('inline') ? h.section('Inline', block(h, inline(h, '-seen', 'Sort devices'), 'Devices, sorted'),
      'A select of the fields and an order button. The select starts a date in its newest-first order; the order button flips it.') : '') +
      (show('menu') ? h.section('Menu', block(h, menu(h, 'name'), 'Devices in the menu demo'),
        'One button that names the field and points the order, for a toolbar or a phone. The menu holds the fields and the two orders.') : '') +
      h.section('Field types', '<div class="sg-row">' + inline(h, 'name', 'Sort by name') + inline(h, '-storage', 'Sort by storage') + '</div>',
        'Text says A to Z, numbers Lowest first and Highest first, dates Oldest first and Newest first. Both words share one cell, so the button keeps its width.') +
      h.section('Narrow', '<div style="max-width: 320px; container: ds-content / inline-size">' + inline(h, 'name', 'Sort, narrow') + '</div>',
        'In a content area of 480px or less the visible label goes; it still names the select.') +
      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the select and the order button; <kbd class="ds-kbd">Space</kbd> flips the order. On the menu look, <kbd class="ds-kbd">ArrowDown</kbd> opens the menu, the arrows move and <kbd class="ds-kbd">Enter</kbd> chooses. Every change is announced.</p>');
  },

  wire: function (root, h) {
    h.$$('.sg-sort-block', root).forEach(function (blockEl) {
      var control = h.$('.ds-sort', blockEl);
      var list = h.$('[data-demo-list]', blockEl);
      var sort = DS.sort.create(control);
      var render = function (state) {
        DS.motion.flip(list, function (options) { DS.dom.morphHtml(list, rowsHtml(h, state), options); }, { items: 'li' });
      };
      DS.dom.morphHtml(list, rowsHtml(h, sort.get()));
      control.addEventListener('ds:sort', function (event) { render(event.detail); });
    });
  },
});
