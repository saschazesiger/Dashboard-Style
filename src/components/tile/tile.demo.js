/*
 * The Tiles demo: key figures with a delta and a trend, a tile that opens,
 * tiles that filter, the states. Registered through SG.demo()
 * (styleguide/sg-core.js). Size, density, shape and touch come from the
 * options panel around it; the tone goes on a delta, never on a value. The
 * figures are fake, as a project's would come from its data layer.
 */
var SPARK = [3, 5, 4, 7, 6, 2, 8, 5, 9, 6, 4, 7, 10, 12];

/** A sparkline of spans, so it also fits inside a clickable tile. */
function sparkline(label) {
  return '<span class="ds-columns ds-columns--mini" role="img" aria-label="' + label + '"><span class="ds-columns__plot" aria-hidden="true">' + SPARK.map(function (value, index) {
    return '<span class="ds-columns__col' + (index === SPARK.length - 1 ? ' ds-columns__col--highlight' : '') + '" style="--ds-share:' + (value / 12).toFixed(3) + '"><span class="ds-columns__fill"></span></span>';
  }).join('') + '</span></span>';
}

function deltaHtml(h, tone, glyph, word) {
  return '<p class="ds-tile__delta' + (tone ? ' ds-tone-' + tone : '') + '">' + h.icon(glyph, 16) + '<span>' + word + '</span></p>';
}

SG.demo('tile', {
  title: 'Tiles',
  group: 'data',
  need: 'Show key figures at the top of a page, how they moved, and filter by one',
  lead: 'Key figures on tonal tiles that fill their row. The value never wraps and never takes a colour; the delta says how it moved, with an arrow and a word, and takes the tone. The trend slot holds a sparkline at the foot of the tile.',
  options: { sizes: true, density: true, shape: true, tones: ['neutral', 'primary', 'info', 'success', 'warning', 'error'] },

  render: function (h) {
    var tone = h.tone;
    return h.section('Key figures', '<div class="ds-tiles" data-demo="figures">' +
      '<div class="ds-tile"><p class="ds-tile__label">' + h.icon('laptop', 20) + '<span>Devices</span></p><p class="ds-tile__value" data-demo="devices">1,284</p>' + deltaHtml(h, tone || 'success', 'arrowUp', '12 more this week') + '<div class="ds-tile__trend">' + sparkline('Devices per day, last 14 days: highest 12 today') + '</div></div>' +
      '<div class="ds-tile"><p class="ds-tile__label">' + h.icon('alert', 20) + '<span>Overdue</span></p><p class="ds-tile__value">7</p>' + deltaHtml(h, tone || 'error', 'arrowUp', '3 more than last week') + '<p class="ds-tile__note">Target: none overdue</p></div>' +
      '<div class="ds-tile"><p class="ds-tile__label">' + h.icon('sync', 20) + '<span>Synced</span></p><p class="ds-tile__value">96%</p>' + deltaHtml(h, tone, 'arrowRight', 'No change') + '<span class="ds-meter" role="meter" aria-label="Synced" aria-valuemin="0" aria-valuemax="100" aria-valuenow="96" aria-valuetext="96% synced, target 95%" style="--ds-share:.96"></span><p class="ds-tile__note">Target 95%</p></div>' +
      '<div class="ds-tile"><p class="ds-tile__label"><span>Average age</span></p><p class="ds-tile__value">3.1 y</p><p class="ds-tile__note">Across every building</p></div>' +
      '</div><div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="refresh">' + h.icon('sync', 16) + 'New figures</button></div>',
      'Every new value goes through DS.motion.countUp: it counts from the figure it shows. Pick a tone in the options panel to see it on the deltas.') +

      h.section('KPI stat: unit and target', '<div class="ds-tiles ds-tiles--3" data-demo="kpi">' +
        '<div class="ds-tile"><p class="ds-tile__label">' + h.icon('hardDrive', 20) + '<span>Storage used</span></p><p class="ds-tile__value"><span class="ds-tile__figure" data-demo="storage">640</span><span class="ds-tile__unit">GB</span></p>' + deltaHtml(h, tone, 'arrowUp', '40 GB more this month') +
          '<div class="ds-tile__target"><span class="ds-meter" role="meter" aria-label="Storage used" aria-valuemin="0" aria-valuemax="1000" aria-valuenow="640" aria-valuetext="640 GB of 1,000, target below 800" style="--ds-share: .64"><span class="ds-meter__threshold" style="--ds-share: .8" aria-hidden="true"></span></span><p class="ds-tile__target-text">Below the 800 GB target</p></div>' +
          '<div class="ds-tile__trend">' + sparkline('Storage used per day, last 14 days') + '</div></div>' +
        '<div class="ds-tile"><p class="ds-tile__label">' + h.icon('timer', 20) + '<span>Median response</span></p><p class="ds-tile__value"><span class="ds-tile__figure">212</span><span class="ds-tile__unit">ms</span></p>' + deltaHtml(h, tone || 'success', 'arrowDown', '18 ms faster') +
          '<div class="ds-tile__target"><span class="ds-meter ds-tone-warning" role="meter" aria-label="Median response" aria-valuemin="0" aria-valuemax="300" aria-valuenow="212" aria-valuetext="212 ms, target 200 ms: missed" style="--ds-share: .707"><span class="ds-meter__threshold" style="--ds-share: .667" aria-hidden="true"></span></span><p class="ds-tile__target-text">12 ms over the 200 ms target</p></div></div>' +
        '<div class="ds-tile"><p class="ds-tile__label">' + h.icon('ticket', 20) + '<span>Tickets closed</span></p><p class="ds-tile__value"><span class="ds-tile__figure">129</span><span class="ds-tile__unit">of 140</span></p>' + deltaHtml(h, tone, 'arrowRight', 'Same as last week') +
          '<div class="ds-tile__target"><span class="ds-meter ds-tone-success" role="meter" aria-label="Tickets closed" aria-valuemin="0" aria-valuemax="140" aria-valuenow="129" aria-valuetext="129 of 140, 92% of the target" style="--ds-share: .921"></span><p class="ds-tile__target-text">92% of the weekly target</p></div></div>' +
        '</div>', 'The figure with a unit, how it moved in an arrow and a word, a meter with a mark at the target and the words whether it is met, and the trend.') +

      h.section('A tile that opens', '<div class="ds-tiles ds-tiles--3" data-demo="open">' +
        '<a class="ds-tile" href="#overdue" data-demo="open-link"><span class="ds-tile__label">' + h.icon('alert', 20) + '<span>Overdue</span></span><span class="ds-tile__value">7</span><span class="ds-tile__note">Opens the list</span><span class="ds-tile__trend">' + sparkline('Overdue devices per day, last 14 days') + '</span></a>' +
        '<button class="ds-tile" type="button" data-demo="open-button"><span class="ds-tile__label">' + h.icon('wrench', 20) + '<span>In repair</span></span><span class="ds-tile__value">3</span><span class="ds-tile__note">Opens a sheet</span></button>' +
        '<button class="ds-tile" type="button" aria-disabled="true" data-tip="Only an administrator can open it"><span class="ds-tile__label">' + h.icon('ban', 20) + '<span>Retired</span></span><span class="ds-tile__value">12</span><span class="ds-tile__note">Blocked: it says why</span></button>' +
        '</div>', 'A state layer, the ripple and the press morph, no lift and no scale. Inside a button or a link, parts are spans, the sparkline too.') +

      h.section('Filter by a figure', '<div class="ds-tiles ds-tiles--3" role="group" aria-label="Filter devices" data-demo="filter">' +
        '<button class="ds-tile" type="button" aria-pressed="true"><span class="ds-tile__label">' + h.icon('check', 20) + '<span>Overdue</span></span><span class="ds-tile__value">12</span><span class="ds-tile__delta ds-tone-error">' + h.icon('arrowUp', 16) + '<span>3 more</span></span></button>' +
        '<button class="ds-tile" type="button" aria-pressed="false"><span class="ds-tile__label"><span>In repair</span></span><span class="ds-tile__value">3</span><span class="ds-tile__delta">' + h.icon('arrowDown', 16) + '<span>1 fewer</span></span></button>' +
        '<button class="ds-tile" type="button" aria-pressed="false"><span class="ds-tile__label"><span>Retired</span></span><span class="ds-tile__value ds-tile__value--empty">No data</span><span class="ds-tile__note">Select to filter</span></button>' +
        '</div>', 'A toggle: aria-pressed. Selected it takes the tint and a static ring, plus a check in the label: never the tint alone.') +

      h.section('States', '<div class="ds-tiles ds-tiles--3" data-demo="states">' +
        '<div class="ds-tile"><p class="ds-tile__label"><span>No value yet</span></p><p class="ds-tile__value ds-tile__value--empty">No data</p></div>' +
        '<div class="ds-tile"><p class="ds-tile__label"><span>A value too wide</span></p><p class="ds-tile__value" data-tip="1,284,902,113,207">1,284,902,113,207</p><p class="ds-tile__note">Ends in an ellipsis, the full value in its tip</p></div>' +
        '<div class="ds-tile ds-stale" aria-busy="true"><p class="ds-tile__label"><span>Refreshing</span></p><p class="ds-tile__value">128</p><p class="ds-tile__note">The old figure stays while new ones load</p></div>' +
        '</div>') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches a tile that opens or filters; <kbd class="ds-kbd">Enter</kbd> follows or presses it, <kbd class="ds-kbd">Space</kbd> presses a button. A tile that only shows a figure is not in the tab order.</p>');
  },

  // What a page writes itself: new figures, opening a list, the filter.
  wire: function (root, h) {
    var M = window.DS.motion;
    var devices = 1284;
    var storage = 640;
    var format = function (value) { return Math.round(value).toLocaleString('en-US'); };
    M.countUp(h.$('[data-demo="devices"]', root), devices, { duration: 0, format: format });
    // With a unit, the count runs on the figure, so the unit stays.
    M.countUp(h.$('[data-demo="storage"]', root), storage, { duration: 0 });
    var onClick = function (event) {
      var target = event.target.closest('[data-demo="refresh"], [data-demo="open-link"], [data-demo="open-button"], [data-demo="filter"] .ds-tile');
      if (!target || !root.contains(target)) return;
      if (target.getAttribute('data-demo') === 'refresh') {
        devices += 12;
        storage += 8;
        M.countUp(h.$('[data-demo="devices"]', root), devices, { format: format });
        M.countUp(h.$('[data-demo="storage"]', root), storage);
      } else if (target.matches('[data-demo="open-link"], [data-demo="open-button"]')) {
        event.preventDefault();
        h.toast('Opened the list.', 'info');
      } else {
        var pressed = target.getAttribute('aria-pressed') !== 'true';
        var label = h.$('.ds-tile__label', target);
        target.setAttribute('aria-pressed', String(pressed));
        window.DS.dom.morphHtml(label, (pressed ? h.icon('check', 20) : '') + '<span>' + h.esc(label.textContent) + '</span>');
      }
    };
    root.addEventListener('click', onClick);
    return function () { root.removeEventListener('click', onClick); };
  }
});
