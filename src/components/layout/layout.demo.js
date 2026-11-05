/*
 * The Layout demo: every primitive with plain content (devices, tickets).
 * They size themselves by their own width, so the width slider of the
 * options panel shows each reflow; density tightens the default gaps and
 * shape the frame's radius. What a project writes itself: nothing but the
 * markup.
 */
var DEVICES = [
  { name: 'LAPTOP-0042', owner: 'Ada Lovelace', state: 'Online' },
  { name: 'LAPTOP-0017', owner: 'Charles Babbage', state: 'Syncing' },
  { name: 'MONITOR-0007', owner: 'Grace Hopper', state: 'Offline' },
  { name: 'DESKTOP-0003', owner: 'Alan Turing', state: 'Online' },
  { name: 'TABLET-0011', owner: 'Ada Lovelace', state: 'Online' },
];

SG.demo('layout', {
  title: 'Layout',
  group: 'layout',
  need: 'Arrange parts without page CSS: a row that wraps, a side and main column, equal parts, a centred column, a full-height cover, a media frame, an auto-fit grid',
  lead: 'Primitives that size themselves by their own width: narrow the stage with the width option and each one reflows. Density tightens their default gaps, shape the frame\'s corners.',
  options: { sizes: false, density: true, shape: true, tones: false },

  render: function (h) {
    var figure = function (label, value, meta) {
      return '<section class="ds-card"><p class="ds-meta">' + label + '</p><p class="ds-card__title">' + value + '</p><p class="ds-muted">' + meta + '</p></section>';
    };
    var deviceCard = function (device) {
      return '<section class="ds-card"><h3 class="ds-card__title">' + device.name + '</h3><p class="ds-muted">' + device.owner + ' · ' + device.state + '</p></section>';
    };
    var filterId = h.uid('filter');

    return h.section('Cluster', '<div class="ds-stack" data-demo="cluster">' +
        '<div class="ds-cluster" data-demo="cluster-default"><button class="ds-btn ds-sm" type="button">' + h.icon('filter', 16) + 'Filter</button><button class="ds-btn ds-sm" type="button">' + h.icon('download', 16) + 'Export</button><button class="ds-btn ds-sm" type="button">' + h.icon('printer', 16) + 'Print</button><button class="ds-btn ds-btn--filled ds-sm ds-push" type="button" data-demo="push">' + h.icon('plus', 16) + 'Add device</button></div>' +
        '<div class="ds-cluster ds-cluster--between" data-demo="cluster-between"><h3 class="ds-card__title">Tickets</h3><span class="ds-meta">12 open · 3 waiting</span></div>' +
        '<div class="ds-cluster ds-cluster--end" data-demo="cluster-end"><button class="ds-btn ds-btn--text ds-sm" type="button">Cancel</button><button class="ds-btn ds-btn--filled ds-sm" type="button">Save</button></div>' +
        '<div class="ds-cluster ds-cluster--nowrap" data-demo="cluster-nowrap"><span class="ds-truncate">A long ticket subject that keeps to one line and ends in an ellipsis where it meets the actions</span><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm ds-push" type="button" aria-label="Edit ticket">' + h.icon('pencil', 18) + '</button></div>' +
        '</div>', '.ds-cluster wraps its items; .ds-push sends the main action to the end, --between spreads, --end aligns a form\'s actions, --nowrap keeps one line and lets a .ds-truncate title shrink.') +

      h.section('Split', '<div class="ds-split" data-demo="split">' +
        '<aside class="ds-split__side ds-card" aria-labelledby="' + filterId + '"><h3 class="ds-card__title" id="' + filterId + '">Filters</h3><p class="ds-muted">State, owner and model.</p></aside>' +
        '<div class="ds-split__main ds-stack">' + DEVICES.slice(0, 3).map(deviceCard).join('') + '</div>' +
        '</div>', 'The side keeps --ds-split-side (18rem) beside the main column; once the main column would be narrower than half the row, both stack.') +

      h.section('Switcher', '<div class="ds-switcher" data-demo="switcher">' +
        figure('Devices', '1,284', '12 added this week') + figure('Online', '1,196', '93% of the fleet') + figure('Open tickets', '37', '5 waiting for parts') +
        '</div>', 'One row of equal parts while the switcher is at least 30rem wide, else one column: never two above one.') +

      h.section('Measure', '<div class="ds-measure" data-demo="measure"><p>A centred column at the reading measure: release notes, a settings form or a sign-in card stay readable on a wide page while the page around them uses its full width.</p></div>' +
        '<div class="ds-measure ds-measure--intrinsic" data-demo="measure-intrinsic"><p class="ds-meta">--intrinsic centres each child at its own width</p><button class="ds-btn ds-btn--tonal ds-sm" type="button">Load more</button></div>') +

      h.section('Cover', '<section class="ds-card" data-demo="cover-card"><div class="ds-cover" data-demo="cover" style="--ds-cover-min: 280px; --ds-cover-pad: 0px">' +
        '<p class="ds-meta">Step 2 of 3</p>' +
        '<div class="ds-cover__main ds-measure ds-measure--intrinsic"><h3 class="ds-card__title">Pair the device</h3><p class="ds-muted">Enter the code shown on LAPTOP-0042.</p></div>' +
        '<p class="ds-meta">Need help? Ask Ada Lovelace.</p>' +
        '</div></section>', 'At least --ds-cover-min high; __main sits in the middle, the parts before and after it at the edges.') +

      h.section('Frame', '<div class="ds-grid" data-demo="frames" style="--ds-grid-min: 9rem">' +
        [['', '16 / 9 (default)'], ['ds-frame--4-3', '4 / 3'], ['ds-frame--square', 'square'], ['ds-frame--3-4', '3 / 4'], ['ds-frame--21-9', '21 / 9']].map(function (entry) {
          return '<figure class="ds-stack" style="--ds-stack-gap: var(--ds-space-2); margin: 0; align-self: start"><div class="ds-frame ' + entry[0] + '" data-demo="frame">' + h.icon('image', 32) + '</div><figcaption class="ds-meta">' + entry[1] + '</figcaption></figure>';
        }).join('') +
        '</div>', 'Crops an img, video, iframe, canvas or picture to its ratio; anything else is centred. Shape multiplies its radius.') +

      h.section('Grid', '<div class="ds-stack" data-demo="grids">' +
        '<p class="ds-meta">.ds-grid: as many columns as fit at --ds-grid-min (16rem)</p>' +
        '<div class="ds-grid" data-demo="grid">' + DEVICES.map(deviceCard).join('') + '</div>' +
        '<p class="ds-meta">.ds-grid--max-3 with --ds-grid-min: 8rem: never more than three</p>' +
        '<div class="ds-grid ds-grid--max-3" data-demo="grid-max" style="--ds-grid-min: 8rem">' + DEVICES.map(deviceCard).join('') + '</div>' +
        '<p class="ds-meta">.ds-grid--fill: a lone card keeps its column</p>' +
        '<div class="ds-grid ds-grid--fill" data-demo="grid-fill">' + deviceCard(DEVICES[0]) + '</div>' +
        '</div>');
  },
});
