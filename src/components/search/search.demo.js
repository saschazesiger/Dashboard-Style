/*
 * The Search field demo: a device list filtered by a search with its
 * shortcut, clear button, count and recent searches; a mod+K search, a
 * plain one and a disabled one. Registered through SG.demo()
 * (styleguide/sg-core.js). Size, density, shape and touch come from the
 * options panel; a search has no tone.
 */
var SEARCH_DEVICES = ['Laptop 14 (Ada Lovelace)', 'Laptop 13 (spare)', 'Router, building A', 'Router, building B', 'Switch, floor 2',
  'Printer, floor 1', 'Monitor 27 (Ada Lovelace)', 'Tablet 11 (front desk)', 'Phone (ticket #42)', 'Server rack 1'];

function searchField(h, o) {
  var id = h.uid('search');
  return '<div class="ds-search" data-ds-search' + (o.recent ? ' data-ds-search-recent="' + o.recent + '"' : '') + (o.count ? ' data-ds-search-count="' + o.count + '"' : '') + (o.demo ? ' data-demo="' + o.demo + '"' : '') + '>' +
    h.icon('search', 20) +
    '<input class="ds-input" id="' + id + '" type="search" aria-label="' + o.label + '" placeholder="' + o.label + '" autocomplete="off"' + (o.hotkey ? ' data-ds-hotkey="' + o.hotkey + '"' : '') + (o.disabled ? ' disabled' : '') + (o.value ? ' value="' + h.esc(o.value) + '"' : '') + '>' +
    (o.hotkey ? '<kbd class="ds-kbd ds-search__key" aria-hidden="true"></kbd>' : '') +
    (o.clear === false ? '' : '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-search__clear" type="button" hidden>' + h.icon('close', 18) + '</button>') +
    '</div>';
}

SG.demo('search', {
  title: 'Search field',
  group: 'forms',
  need: 'Search a page or a list: a shortcut to reach it, clear it, see how many results, come back to recent searches',
  lead: 'The search pill with a clear button, its shortcut key, the number of results (shown, and spoken once typing pauses) and the recent searches, kept on this device.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var count = h.uid('search-count');
    return h.section('Filter a list', '<div role="search" data-demo="filter">' +
        '<div class="ds-action-bar">' + searchField(h, { label: 'Search devices', hotkey: '/', recent: 'sg-devices', count: count, demo: 'main' }) +
        '<span class="ds-search__count" id="' + count + '"></span></div>' +
        h.card('Devices', '<ul class="ds-plain-list" data-demo="rows">' + SEARCH_DEVICES.map(function (name) { return '<li>' + h.esc(name) + '</li>'; }).join('') + '</ul>') + '</div>',
      'Press <kbd class="ds-kbd">/</kbd>, type "laptop" and press Enter: it joins the recent searches. Empty the field and press Down to see them; Delete forgets one.') +

      h.section('Variants', '<div class="ds-form-grid ds-form-grid--2">' +
        searchField(h, { label: 'Search tickets', hotkey: 'mod+k' }) +
        searchField(h, { label: 'Search (no extras)', clear: false }) +
        '</div>') +

      h.section('States', '<div class="ds-form-grid ds-form-grid--2">' +
        searchField(h, { label: 'Search tickets (filled)', value: 'printer' }) +
        searchField(h, { label: 'Search (disabled)', disabled: true, hotkey: '/' }) +
        '</div>') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">/</kbd> (or the field\'s own shortcut) reaches the field; <kbd class="ds-kbd">Escape</kbd> clears it. In an empty field <kbd class="ds-kbd">Down</kbd> opens the recent searches, <kbd class="ds-kbd">Enter</kbd> takes one, <kbd class="ds-kbd">Delete</kbd> forgets it.</p>');
  },

  wire: function (root, h) {
    var main = h.$('[data-demo="main"]', root);
    var rows = h.$$('[data-demo="rows"] li', root);
    if (!main) return;
    var input = h.$('input', main);
    var filter = function () {
      var query = input.value.trim().toLowerCase();
      var shown = 0;
      rows.forEach(function (row) {
        var hit = !query || row.textContent.toLowerCase().indexOf(query) >= 0;
        row.hidden = !hit;
        if (hit) shown += 1;
      });
      var search = DS.core.get(main, 'search');
      if (search) search.set({ count: query ? shown : null });
    };
    input.addEventListener('input', filter);
    main.addEventListener('ds:search', function (event) {
      if (event.detail.source === 'recent') filter();
    });
  },
});
