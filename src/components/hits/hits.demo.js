/*
 * The Search hits demo: a search field that filters a ticket list and marks
 * the hits, the count announced; a phrase; a text marked by the server.
 * Registered through SG.demo() (styleguide/sg-core.js). Shape comes from
 * the options panel.
 */
var HL_TICKETS = ['Replace the toner on the second floor', 'Printer 7 jams on every second page', 'Café machine in the north building is offline', 'Toner ordered for every printer', 'Laptop 0042 needs a new battery'];

SG.demo('hits', {
  title: 'Search hits',
  group: 'content',
  need: 'Mark the hits of a search in a text, ignoring case and accents',
  lead: 'The hits of a search marked in a text, ignoring case and accents. The page filters and announces the count; DS.hits marks.',
  options: { sizes: false, density: false, shape: true, tones: false },

  render: function (h) {
    var id = h.uid('hl-search');
    var listId = h.uid('hl-list');
    return h.section('Search a list', '<div class="ds-card" style="max-inline-size: 560px"><div class="ds-field"><label class="ds-field__label" for="' + id + '">Search tickets</label>' +
        '<input class="ds-input" id="' + id + '" type="search" value="toner" aria-controls="' + listId + '" data-demo="search"></div>' +
        '<p class="ds-muted" data-demo="count" aria-hidden="true"></p>' +
        '<ul class="ds-list" id="' + listId + '" aria-label="Tickets" data-ds-hits="toner" data-demo="list">' + HL_TICKETS.map(function (text) {
          return '<li class="ds-list__item"><span class="ds-list__text"><span class="ds-list__title">' + text + '</span></span></li>';
        }).join('') + '</ul></div>', 'Try "cafe", "second" or "print toner": every word is marked, accents and case ignored.') +
      h.section('A phrase', '<div class="ds-card" style="max-inline-size: 560px"><p data-ds-hits="second floor" data-ds-hits-mode="phrase" data-demo="phrase">The printer on the second floor jams on every second page; the second floor team has a spare.</p></div>', 'data-ds-hits-mode="phrase" marks the whole query only.') +
      h.section('Marked by the server', '<div class="ds-card" style="max-inline-size: 560px"><p>Replace the <mark class="ds-hit">toner</mark> of every printer on floor 2.</p></div>') +
      h.section('Keyboard', '<p class="ds-muted">Marks take no focus. The search field filters as you type; the count is announced once typing pauses.</p>');
  },

  wire: function (root, h) {
    var list = h.$('[data-demo="list"]', root);
    var count = h.$('[data-demo="count"]', root);
    var timer = 0;
    var apply = function (query, announce) {
      var words = query.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\s+/).filter(Boolean);
      var shown = 0;
      h.$$('.ds-list__item', list).forEach(function (item) {
        var text = item.textContent.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
        var hit = !words.length || words.some(function (word) { return text.indexOf(word) !== -1; });
        item.hidden = !hit;
        if (hit) shown += 1;
      });
      // Before DS.init's observer has reached the new demo, the attribute is the query.
      var marks = window.DS.get(list, 'hits');
      if (marks) marks.set(query);
      else list.setAttribute('data-ds-hits', query);
      count.textContent = shown + ' of ' + HL_TICKETS.length + ' tickets';
      if (announce) {
        clearTimeout(timer);
        timer = setTimeout(function () { window.DS.a11y.announce(shown + ' tickets match'); }, h.slow(500));
      }
    };
    apply('toner', false);
    var onInput = function (event) {
      if (event.target.matches('[data-demo="search"]')) apply(event.target.value, true);
    };
    root.addEventListener('input', onInput);
    return function () { clearTimeout(timer); root.removeEventListener('input', onInput); };
  }
});
