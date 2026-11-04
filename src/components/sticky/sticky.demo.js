/*
 * The Sticky demo: a ticket list that scrolls under its head and foot, a
 * wide board whose first column sticks, and a side column beside long
 * content. What a project writes itself: its scrollers, and the DS.dom
 * watches that raise the edges where scroll-driven animations are missing
 * (Firefox, Safari 17), attached once in wire().
 */
var TICKETS = ['Battery swelling', 'Screen flickers', 'No network after update', 'Keyboard key stuck', 'Fan noise', 'Sync fails with a certificate error',
  'Dock not detected', 'Printer offline', 'Camera blurry', 'Disk almost full', 'Licence expired', 'Charger missing'];
var BOARD_DEVICES = ['LAPTOP-0042', 'LAPTOP-0017', 'MONITOR-0007', 'DESKTOP-0003'];
var BOARD_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];

SG.demo('sticky', {
  title: 'Sticky',
  group: 'layout',
  need: 'Keep a head, a foot or a side in view while its list scrolls, raised once content passes under it',
  lead: 'Scroll each box: the head, the foot and the first column stay, and raise an edge while content passes under them.',
  options: { sizes: false, density: false, shape: false, tones: false },

  render: function (h) {
    var scroller = 'overflow: auto; position: relative; max-block-size: 20rem; border: 1px solid var(--ds-line); border-radius: var(--ds-radius-card); background: var(--ds-surface)';
    var pad = 'padding: var(--ds-space-3) var(--ds-space-4)';
    var listId = h.uid('tickets');
    var list = '<div data-demo="list" tabindex="0" role="region" aria-labelledby="' + listId + '" style="' + scroller + '; scroll-padding-block: 4rem">' +
      '<header class="ds-sticky ds-sticky--head ds-cluster ds-cluster--between" data-demo="head" style="' + pad + '"><h3 class="ds-card__title" id="' + listId + '">Tickets</h3><span class="ds-meta">12 open</span></header>' +
      '<ul class="ds-list">' + TICKETS.map(function (title, index) {
        return '<li class="ds-list__item">' + h.icon('ticket', 20, 'ds-list__icon') + '<span class="ds-list__text"><span class="ds-list__title">' + (1040 + index) + ' · ' + title + '</span><span class="ds-list__meta">Opened by Ada Lovelace</span></span></li>';
      }).join('') + '</ul>' +
      '<footer class="ds-sticky ds-sticky--foot ds-cluster ds-cluster--end" data-demo="foot" style="' + pad + '"><span class="ds-meta ds-push">3 selected</span><button class="ds-btn ds-sm" type="button">Assign</button><button class="ds-btn ds-btn--filled ds-sm" type="button">Close tickets</button></footer>' +
      '</div>';

    var cell = 'padding: var(--ds-space-2) var(--ds-space-3); border-block-end: 1px solid var(--ds-line)';
    var boardId = h.uid('board');
    var board = '<div data-demo="board" tabindex="0" role="region" aria-labelledby="' + boardId + '" style="' + scroller + '">' +
      '<div role="table" aria-labelledby="' + boardId + '" style="display: grid; grid-template-columns: 10rem repeat(' + BOARD_DAYS.length + ', 6rem); inline-size: max-content">' +
      '<div role="row" style="display: contents"><span role="columnheader" class="ds-sticky ds-sticky--start ds-meta" data-demo="corner" style="' + cell + '" id="' + boardId + '">Device</span>' +
      BOARD_DAYS.map(function (day) { return '<span role="columnheader" class="ds-meta" style="' + cell + '">' + day + '</span>'; }).join('') + '</div>' +
      BOARD_DEVICES.map(function (device, row) {
        return '<div role="row" style="display: contents"><span role="rowheader" class="ds-sticky ds-sticky--start" data-demo="start" style="' + cell + '">' + device + '</span>' +
          BOARD_DAYS.map(function (day, column) { return '<span role="cell" class="ds-tabular" style="' + cell + '">' + ((row * 7 + column * 3) % 9) + ' h</span>'; }).join('') + '</div>';
      }).join('') + '</div></div>';

    var sideId = h.uid('side');
    var side = '<div data-demo="side-scroller" style="' + scroller + '; padding: var(--ds-space-4)"><div class="ds-split">' +
      '<nav class="ds-split__side ds-sticky ds-sticky--side" data-demo="side" aria-labelledby="' + sideId + '" style="--ds-split-side: 10rem"><p class="ds-meta" id="' + sideId + '">On this page</p><ul class="ds-plain-list"><li>Hardware</li><li>Software</li><li>Owner</li><li>History</li></ul></nav>' +
      '<article class="ds-split__main ds-stack">' + ['Hardware', 'Software', 'Owner', 'History'].map(function (title) {
        return '<section class="ds-card"><h3 class="ds-card__title">' + title + '</h3><p class="ds-muted">LAPTOP-0042 keeps this part of its record here: the model, its serial number, the warranty and the last time it synced with the console.</p></section>';
      }).join('') + '</article></div></div>';

    return h.section('Head and foot', list + '<div class="ds-cluster"><button class="ds-btn ds-sm" type="button" aria-pressed="false" data-demo="flat">Flat head (.ds-sticky--flat)</button></div>',
        'The head raises its edge once rows pass under it; the foot while rows are still hidden under it.') +
      h.section('First column', board, 'Scroll sideways: the device column stays, and raises its edge once columns pass under it.') +
      h.section('Side', side, '.ds-sticky--side stays at the top beside long content, with no fill and no edge.');
  },

  wire: function (root, h) {
    // Where scroll-driven animations are missing these attributes raise the edges; where they exist, the scroll timeline does.
    var list = h.$('[data-demo="list"]', root);
    var handles = [
      DS.dom.watchScrolled(list, h.$('[data-demo="head"]', root)),
      DS.dom.scrollEdges(list, { axis: 'block' }),
      DS.dom.scrollEdges(h.$('[data-demo="board"]', root)),
    ];
    root.addEventListener('click', function (event) {
      var flat = event.target.closest('[data-demo="flat"]');
      if (!flat) return;
      var on = flat.getAttribute('aria-pressed') !== 'true';
      flat.setAttribute('aria-pressed', String(on));
      h.$('[data-demo="head"]', root).classList.toggle('ds-sticky--flat', on);
    });
    return function () {
      handles.forEach(function (handle) { handle.destroy(); });
    };
  },
});
