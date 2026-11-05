/*
 * The Container presets demo: a readout of the size the stage is at (the
 * stage is the page's content container, so the width option moves it),
 * a head whose actions stack when compact, and three fixed containers side
 * by side, each answering for its own width. What a project writes
 * itself: nothing but the markup.
 */
SG.demo('container', {
  title: 'Container presets',
  group: 'layout',
  need: 'Let a region react to its own width: hide, show or stack parts at the compact, medium and expanded container sizes',
  lead: 'Classes that query the nearest container, not the window. The first region is a .ds-container as wide as the stage: move the width option to 360px, 700px and full, and watch the readout, the head and the table columns.',
  options: { sizes: false, density: false, shape: false, tones: false },

  render: function (h) {
    var readout = function () {
      return '<span class="ds-status ds-only-compact" data-demo="size">' + h.icon('smartphone', 16) + '<span>Compact</span></span>' +
        '<span class="ds-status ds-only-medium" data-demo="size">' + h.icon('tablet', 16) + '<span>Medium</span></span>' +
        '<span class="ds-status ds-only-expanded" data-demo="size">' + h.icon('monitor', 16) + '<span>Expanded</span></span>';
    };
    var region = function (width, label) {
      return '<div class="ds-container ds-card" data-demo="region" style="inline-size: ' + width + '; max-inline-size: 100%">' +
        '<p class="ds-meta">' + label + '</p><div class="ds-cluster">' + readout() + '</div></div>';
    };

    return h.section('A region as wide as the stage', '<div class="ds-container ds-stack" data-demo="stage">' +
        '<div class="ds-cluster" data-demo="readout"><span class="ds-meta">This region is</span>' + readout() + '</div>' +
        '<header class="ds-cluster ds-cluster--between" data-demo="head"><h3 class="ds-card__title">LAPTOP-0042</h3>' +
        '<div class="ds-cluster ds-stack-compact" data-demo="actions"><button class="ds-btn ds-sm" type="button">' + h.icon('sync', 16) + 'Sync</button>' +
        '<button class="ds-btn ds-sm" type="button">' + h.icon('lock', 16) + 'Lock</button>' +
        '<button class="ds-btn ds-btn--filled ds-sm" type="button">' + h.icon('pencil', 16) + 'Edit</button></div></header>' +
        '<table class="ds-table" data-demo="table"><thead><tr><th scope="col">Device</th><th scope="col">Owner</th><th scope="col" class="ds-hide-compact">Model</th><th scope="col" class="ds-hide-compact ds-hide-medium">Last synced</th></tr></thead><tbody>' +
        [['LAPTOP-0042', 'Ada Lovelace', 'Laptop 14', 'Today 09:12'], ['LAPTOP-0017', 'Charles Babbage', 'Laptop 16', 'Yesterday 17:40'], ['MONITOR-0007', 'Grace Hopper', 'Monitor 27', '3 days ago']].map(function (row) {
          return '<tr><td>' + row[0] + '</td><td>' + row[1] + '</td><td class="ds-hide-compact">' + row[2] + '</td><td class="ds-hide-compact ds-hide-medium">' + row[3] + '</td></tr>';
        }).join('') + '</tbody></table></div>',
      'The actions stack at full width when compact (.ds-stack-compact); the model column hides when compact, the sync time below expanded (.ds-hide-compact.ds-hide-medium).') +

      h.section('Regions of their own', '<div class="ds-stack" data-demo="regions">' +
        region('320px', '.ds-container, 320px wide') + region('680px', '.ds-container, 680px wide') + region('100%', '.ds-container, the stage\'s width') +
        '</div>', 'Each .ds-container answers for its own width, whatever the window or the stage.');
  },
});
