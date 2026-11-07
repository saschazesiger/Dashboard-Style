/*
 * The Listbox demo: one value, several values with groups and
 * descriptions, a long list of data windowed by DS.virtual with a filter,
 * the states and the keys. Registered through SG.demo()
 * (styleguide/sg-core.js). Size, density, shape and touch come from the
 * options panel around it. The behaviour is the system's (data-ds-listbox,
 * DS.listbox.create); wire() only feeds data and shows what changed.
 */
var LB_MODELS = [['laptop-13', 'Laptop 13', '13 inch, 2022'], ['laptop-14', 'Laptop 14', '14 inch, 2023'], ['laptop-16', 'Laptop 16', '16 inch, 2024'], ['workstation-15', 'Workstation 15', '15 inch, 2023'], ['mini', 'Mini desktop', 'Desktop, 2023'], ['convertible', 'Convertible 13', '13 inch, 2022'], ['tablet', 'Field tablet', 'Tablet, 2024']];

var LB_GROUPS = [
  ['Laptops', [['laptop-14', 'Laptop 14', 'For most desks: light, with a full day of battery.'], ['workstation-15', 'Workstation 15', 'For drawing and video: the strong graphics card, and the weight that comes with it.']]],
  ['Desktops', [['mini', 'Mini desktop', 'For shared counters: small, on a lock, and quick to replace.'], ['tower', 'Tower 5', 'For the lab: room for two graphics cards.', true]]],
  ['Tablets', [['tablet', 'Field tablet', 'For the shop floor: scanner and pen, and a case that survives a fall.']]],
];

function lbCheck(h) {
  return '<span class="ds-listbox__check" aria-hidden="true">' + h.icon('check', 16) + '</span>';
}

function lbOption(h, value, name, meta, selected, extra) {
  return '<div class="ds-listbox__option" role="option" aria-selected="' + Boolean(selected) + '" data-value="' + value + '"' + (extra || '') + '>' +
    lbCheck(h) + '<span class="ds-listbox__name">' + h.esc(name) + '</span>' + (meta ? '<span class="ds-listbox__meta">' + h.esc(meta) + '</span>' : '') + '</div>';
}

function lbSingle(h, label) {
  return '<div class="ds-field"><span class="ds-field__label" id="' + label + '">Model</span>' +
    '<div class="ds-listbox" role="listbox" aria-labelledby="' + label + '" data-ds-listbox data-demo="single">' +
    LB_MODELS.map(function (model, index) { return lbOption(h, model[0], model[1], model[2], index === 1); }).join('') +
    '</div><p class="ds-field__hint" data-demo-out>Laptop 14</p></div>';
}

function lbGrouped(h, label) {
  return '<div class="ds-field"><span class="ds-field__label" id="' + label + '">Models to order</span>' +
    '<div class="ds-listbox" role="listbox" aria-multiselectable="true" aria-labelledby="' + label + '" data-ds-listbox data-demo="multi">' +
    LB_GROUPS.map(function (group, g) {
      var head = label + '-g' + g;
      return '<div class="ds-listbox__group" role="group" aria-labelledby="' + head + '"><div class="ds-listbox__heading" id="' + head + '" role="presentation">' + group[0] + '</div>' +
        group[1].map(function (item) {
          return '<div class="ds-listbox__option" role="option" aria-selected="' + (item[0] === 'mini') + '" data-value="' + item[0] + '"' + (item[3] ? ' aria-disabled="true"' : '') + '>' + lbCheck(h) +
            '<span class="ds-listbox__name">' + item[1] + '</span><span class="ds-listbox__description">' + item[2] + (item[3] ? ' Out of stock.' : '') + '</span></div>';
        }).join('') + '</div>';
    }).join('') +
    '</div><p class="ds-field__hint" data-demo-out>1 chosen</p></div>';
}

function lbLong(h, label, search) {
  return '<div class="ds-field"><label class="ds-field__label" for="' + search + '">Find a device</label>' +
    '<input class="ds-input" id="' + search + '" type="search" autocomplete="off" placeholder="Type a name, like lap 4" aria-controls="' + label + '" data-demo="search"></div>' +
    '<div class="ds-field"><span class="ds-field__label" id="' + label + '-label">Devices (10,000)</span>' +
    '<div class="ds-listbox" id="' + label + '" role="listbox" aria-multiselectable="true" aria-labelledby="' + label + '-label" data-demo="long"></div>' +
    '<p class="ds-field__hint" data-demo-out role="status">None chosen</p></div>';
}

SG.demo('listbox', {
  title: 'Listbox',
  group: 'forms',
  need: 'Choose one or several options from a visible list: groups, descriptions, type-ahead, thousands of options',
  lead: 'A list that stays in view: one tab stop, the arrow keys move, the choice shows by the tint, the weight and a check. DS.listbox is also the list engine of the combobox and the select panel.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var single = h.uid('listbox');
    var multi = h.uid('listbox');
    var long = h.uid('listbox');
    var search = h.uid('listbox-search');
    var states = h.uid('listbox');
    return '<div class="ds-form-grid ds-form-grid--2">' +
      h.section('One value', '<div class="ds-form">' + lbSingle(h, single) + '</div>',
        'The choice follows the active option, as in a native list. A letter jumps to the next model that starts with it.') +
      h.section('Several values, groups and descriptions', '<div class="ds-form">' + lbGrouped(h, multi) + '</div>',
        'Space chooses, Shift with an arrow chooses while it moves, Ctrl+A chooses all. Tower 5 cannot be chosen.') +
      '</div>' +
      h.section('Thousands of options', '<div class="ds-form">' + lbLong(h, long, search) + '</div>',
        'Data rendered by the system: only the options near the viewport exist (DS.virtual). The filter matches words in any order and letters in order, and marks them.') +
      h.section('States', '<div class="ds-form-grid ds-form-grid--2"><div class="ds-field"><span class="ds-field__label" id="' + states + '">Disabled</span>' +
        '<div class="ds-listbox" role="listbox" aria-labelledby="' + states + '" aria-disabled="true">' +
        lbOption(h, 'a', 'Laptop 14', '14 inch, 2023', true) + lbOption(h, 'b', 'Mini desktop', 'Desktop, 2023', false) + '</div></div>' +
        '<div class="ds-field"><span class="ds-field__label" id="' + states + '-o">The options</span>' +
        '<div class="ds-listbox" role="listbox" aria-multiselectable="true" aria-labelledby="' + states + '-o" style="--ds-listbox-max-height: none;">' +
        lbOption(h, 'c', 'At rest', 'A line of meta', false) +
        lbOption(h, 'd', 'Active', 'Keyboard or pointer', false, ' data-active') +
        lbOption(h, 'e', 'Chosen', 'The tint, the weight and the check', true) +
        lbOption(h, 'f', 'Blocked', 'Out of stock', false, ' aria-disabled="true"') +
        lbOption(h, 'g', 'Chosen and blocked', 'No longer offered', true, ' aria-disabled="true"') +
        '</div></div></div>') +
      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the list, <kbd class="ds-kbd">ArrowDown</kbd> and <kbd class="ds-kbd">ArrowUp</kbd> move, <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd> go to the ends, <kbd class="ds-kbd">Page Down</kbd> and <kbd class="ds-kbd">Page Up</kbd> ten options. With several values <kbd class="ds-kbd">Space</kbd> chooses, <kbd class="ds-kbd">Shift</kbd> with an arrow chooses on the way and <kbd class="ds-kbd">Ctrl</kbd>+<kbd class="ds-kbd">A</kbd> chooses all. Letters jump to a name.</p>');
  },

  wire: function (root, h) {
    function names(list, value) {
      var entries = list.entries();
      return [].concat(value || []).map(function (v) {
        var entry = entries.filter(function (e) { return e.value === v; })[0];
        return entry ? entry.label : v;
      });
    }
    h.$$('[data-ds-listbox]', root).forEach(function (el) {
      var out = h.$('[data-demo-out]', el.parentNode);
      el.addEventListener('ds:change', function (event) {
        var list = DS.get(el, 'listbox');
        var chosen = names(list, event.detail.value);
        out.textContent = el.getAttribute('aria-multiselectable') === 'true' ? chosen.length + ' chosen' + (chosen.length ? ': ' + chosen.join(', ') : '') : chosen[0] || 'None';
      });
    });

    var long = h.$('[data-demo="long"]', root);
    var kinds = ['Laptop', 'Workstation', 'Mini desktop', 'Field tablet', 'Monitor', 'Dock'];
    var sites = ['Hall A', 'Hall B', 'Front desk', 'Lab', 'Storage'];
    var items = [];
    for (var i = 0; i < 10000; i += 1) {
      items.push({ value: 'd-' + i, label: kinds[i % kinds.length] + ' ' + (1000 + i), meta: sites[(i * 7) % sites.length] + ', row ' + (i % 40 + 1) });
    }
    var list = DS.listbox.create(long, { items: items, multiple: true });
    var out = h.$('[data-demo-out]', long.parentNode);
    long.addEventListener('ds:change', function (event) {
      var n = event.detail.value.length;
      out.textContent = n ? n + ' chosen' : 'None chosen';
    });
    var search = h.$('[data-demo="search"]', root);
    search.addEventListener('input', function () {
      var count = list.filter(search.value);
      out.textContent = search.value.trim() ? count + ' match' + (count === 1 ? '' : 'es') : list.get().length + ' chosen';
    });
    return function () { list.destroy(); };
  },
});
