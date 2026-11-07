/*
 * The Bar list demo: ranked rows with icons, links, a tone with its words,
 * the plain variant, new values that glide and reorder, and a narrow card.
 * Registered through SG.demo() (styleguide/sg-core.js). Size, density,
 * shape and touch come from the options panel; the panel's tone goes on
 * the row that stands out, since a row reads only its own.
 */
var BAR_ROWS = [['printer', 'Printers', 412], ['laptop', 'Laptops', 173], ['monitor', 'Monitors', 96], ['router', 'Routers', 49], ['smartphone', 'Phones', 21]];

function barListHtml(h, rows, options) {
  var top = rows.reduce(function (max, row) { return Math.max(max, row[2]); }, 1);
  return '<ol class="ds-bar-list' + (options.plain ? ' ds-bar-list--plain' : '') + '" aria-label="' + options.label + '" data-demo="' + options.name + '">' + rows.map(function (row) {
    var flagged = options.flag === row[1];
    var words = flagged ? row[1] + ', ' + options.flagWords : row[1];
    var label = (options.icons ? h.icon(flagged ? 'alert' : row[0], 16) : '') + '<span>' + h.esc(words) + '</span>';
    return '<li class="ds-bar-list__item' + (flagged ? ' ds-tone-' + (h.tone || 'error') : '') + '" data-ds-key="' + row[1] + '" style="--ds-share: ' + (row[2] / top).toFixed(3) + '">' +
      (options.links ? '<a class="ds-bar-list__label" href="#' + row[1].toLowerCase() + '">' + label + '</a>' : '<span class="ds-bar-list__label">' + label + '</span>') +
      '<span class="ds-bar-list__value">' + row[2].toLocaleString('en-US') + '</span></li>';
  }).join('') + '</ol>';
}

SG.demo('bar-list', {
  title: 'Bar list',
  group: 'data',
  need: 'Rank a few categories by a value, each row a label and a figure on a bar',
  lead: 'Ranked rows of a label and a figure, each on a bar as long as its share of the largest value. The bar says nothing the figure does not; a tone marks a row that stands out, and its words say why.',
  options: { sizes: true, density: true, shape: true, tones: true },

  render: function (h) {
    return h.section('Ranked, with icons and a flagged row', '<div class="ds-card">' + barListHtml(h, BAR_ROWS, { name: 'ranked', label: 'Open tickets per device type', icons: true, flag: 'Routers', flagWords: '3 failing' }) +
        '<div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="shuffle">' + h.icon('sync', 16) + 'New values</button></div></div>',
        'New values glide; a new order moves the rows through DS.motion.flip and the figures count.') +
      h.section('Links and the plain variant', '<div class="ds-grid-2"><div class="ds-card"><h3 class="ds-card__title">Top pages</h3>' +
        barListHtml(h, [['file', '/devices', 2810], ['file', '/tickets', 1904], ['file', '/reports/monthly-inventory-of-every-building', 712], ['file', '/settings', 120]], { name: 'links', label: 'Top pages, visits this week', links: true }) + '</div>' +
        '<div class="ds-card"><h3 class="ds-card__title">Tickets per assignee</h3>' +
        barListHtml(h, [['user', 'Ada Lovelace', 38], ['user', 'Unassigned', 24], ['user', 'Service desk', 9]], { name: 'plain', label: 'Tickets per assignee', plain: true }) + '</div></div>',
        'A label that opens something is a link: the link takes focus with the inset ring, never the row. A long label ends in an ellipsis on its bar.') +
      h.section('Empty', '<div class="ds-card"><div class="ds-empty ds-empty--inline ds-empty--no-data"><span class="ds-empty__disc" aria-hidden="true">' + h.icon('barChartHorizontal', 20) + '</span><p class="ds-empty__title">No tickets this week</p></div></div>',
        'With no rows, the page shows an empty state in place of the list.') +
      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches each link in a label; a list without links is no stop of its own. A screen reader reads each row as its label and figure.</p>');
  },

  wire: function (root, h) {
    var M = window.DS.motion;
    var list = h.$('[data-demo="ranked"]', root);
    M.enterAll(h.$$('.ds-bar-list__item', root), 'fill', { stagger: false });
    var onClick = function (event) {
      if (!event.target.closest('[data-demo="shuffle"]')) return;
      var rows = BAR_ROWS.map(function (row) { return [row[0], row[1], Math.round(20 + Math.random() * 400)]; }).sort(function (a, b) { return b[2] - a[2]; });
      var top = rows[0][2];
      M.flip(list, function () {
        rows.forEach(function (row) {
          var item = h.$('[data-ds-key="' + row[1] + '"]', list);
          list.append(item);
          item.style.setProperty('--ds-share', (row[2] / top).toFixed(3));
          var value = h.$('.ds-bar-list__value', item);
          M.countUp(value, row[2], { from: parseFloat(value.textContent.replace(/,/g, '')) || 0, format: function (v) { return Math.round(v).toLocaleString('en-US'); } });
        });
      });
    };
    root.addEventListener('click', onClick);
    return function () { root.removeEventListener('click', onClick); };
  }
});
