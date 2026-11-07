/*
 * The Category bar demo: tickets by status with a target, storage with
 * room left, a tone on the part that matters, a narrow card and new values.
 * Registered through SG.demo() (styleguide/sg-core.js). Size, density and
 * shape come from the options panel; the panel's tone goes on the last
 * part of the storage bar, since a part reads only its own.
 */
var CAT_STATUS = [['Open', 120, ''], ['In progress', 72, 's2'], ['Closed', 48, 's3']];

function categoryBarHtml(h, options) {
  var total = options.total || options.parts.reduce(function (sum, part) { return sum + part[1]; }, 0);
  var label = options.parts.map(function (part) { return part[0] + ' ' + part[1] + ' ' + options.unit + ' (' + Math.round(part[1] / total * 100) + '%)'; }).join(', ') +
    (options.rest ? ', ' + (total - options.parts.reduce(function (sum, part) { return sum + part[1]; }, 0)) + ' ' + options.unit + ' free' : '') +
    (options.marker ? '; ' + options.markerWords : '');
  var cls = function (part, kind) { return part[2] ? (part[2].indexOf('tone-') === 0 ? ' ds-' + part[2] : ' ds-' + kind + '--' + part[2]) : ''; };
  return '<figure class="ds-category-bar' + (options.rest ? ' ds-category-bar--rest' : '') + '" data-demo="' + options.name + '">' +
    '<figcaption class="ds-category-bar__head"><span class="ds-category-bar__label">' + options.title + '</span><span class="ds-category-bar__total">' + options.totalText + '</span></figcaption>' +
    '<div class="ds-category-bar__track" role="img" aria-label="' + h.esc(label) + '">' + options.parts.map(function (part) {
      return '<span class="ds-category-bar__part' + cls(part, 'category-bar__part') + '" style="--ds-share: ' + (part[1] / total).toFixed(3) + '"></span>';
    }).join('') + (options.marker ? '<span class="ds-category-bar__marker" style="--ds-share: ' + options.marker + '"></span>' : '') + '</div>' +
    '<ul class="ds-legend" aria-hidden="true">' + options.parts.map(function (part) {
      return '<li><span class="ds-legend__key' + cls(part, 'legend__key') + '"></span>' + part[0] + ' <span class="ds-category-bar__value">' + part[1] + (options.short || '') + '</span></li>';
    }).join('') + (options.rest ? '<li><span class="ds-legend__key" style="--ds-chart-color: var(--ds-chart-track)"></span>Free <span class="ds-category-bar__value">' + (total - options.parts.reduce(function (sum, part) { return sum + part[1]; }, 0)) + (options.short || '') + '</span></li>' : '') + '</ul></figure>';
}

SG.demo('category-bar', {
  title: 'Category bar',
  group: 'data',
  need: 'Show the parts of a whole on one bar, each named with its figure in a legend',
  lead: 'The parts of a whole on one bar, 2px apart, with the chart legend naming each part and its figure. The track says the same in its label, so a screen reader hears every part.',
  options: { sizes: true, density: true, shape: true, tones: true },

  render: function (h) {
    var storage = [['Images', 220, ''], ['Backups', 310, 's3'], ['Logs', 140, h.tone ? 'tone-' + h.tone : 'tone-warning']];
    return h.section('Parts of a whole, with a target', '<div class="ds-card">' +
        categoryBarHtml(h, { name: 'status', title: 'Tickets by status', totalText: '240 tickets', unit: 'tickets', parts: CAT_STATUS, marker: 0.8, markerWords: 'target: 80% handled' }) +
        '<div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="refresh">' + h.icon('sync', 16) + 'New values</button></div></div>',
        'The marker keeps its own share; the label says what it means.') +
      h.section('Room left, a part in a tone', '<div class="ds-card">' +
        categoryBarHtml(h, { name: 'storage', title: 'Storage', totalText: '670 of 1,000 GB', unit: 'GB', short: ' GB', parts: storage, total: 1000, rest: true }) + '</div>',
        'The shares add up to less than 1: the track shows what is free. The logs part takes the tone and the legend still names it.') +
      h.section('Narrow', '<div class="ds-card" style="max-inline-size: 320px">' +
        categoryBarHtml(h, { name: 'narrow', title: 'Devices by building, every site included', totalText: '1,284', unit: 'devices', parts: [['North', 620, ''], ['South', 410, 's2'], ['East', 180, 's3'], ['West', 74, 's4']] }) + '</div>',
        'A long label ends in an ellipsis, the total stays whole, the legend wraps.') +
      h.section('Keyboard', '<p class="ds-muted">A category bar is no stop of its own: nothing here takes focus. A screen reader reads the track\'s label, which names every part.</p>');
  },

  wire: function (root, h) {
    var M = window.DS.motion;
    M.enterAll(h.$$('.ds-category-bar__part', root), 'fill', { stagger: false });
    var onClick = function (event) {
      if (!event.target.closest('[data-demo="refresh"]')) return;
      var figure = h.$('[data-demo="status"]', root);
      var values = CAT_STATUS.map(function () { return Math.round(20 + Math.random() * 120); });
      var total = values.reduce(function (sum, value) { return sum + value; }, 0);
      h.$$('.ds-category-bar__part', figure).forEach(function (part, index) { part.style.setProperty('--ds-share', (values[index] / total).toFixed(3)); });
      h.$$('.ds-category-bar__value', figure).forEach(function (value, index) { M.countUp(value, values[index], { from: parseFloat(value.textContent) || 0, format: function (v) { return String(Math.round(v)); } }); });
      h.$('.ds-category-bar__total', figure).textContent = total + ' tickets';
      h.$('.ds-category-bar__track', figure).setAttribute('aria-label', CAT_STATUS.map(function (part, index) { return part[0] + ' ' + values[index] + ' tickets (' + Math.round(values[index] / total * 100) + '%)'; }).join(', ') + '; target: 80% handled');
    };
    root.addEventListener('click', onClick);
    return function () { root.removeEventListener('click', onClick); };
  }
});
