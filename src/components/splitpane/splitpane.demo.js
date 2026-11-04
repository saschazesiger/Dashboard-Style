/*
 * The Split pane demo: a list beside its record (collapsible, remembered,
 * with a toggle button), three panes around a work area, panes stacked on
 * percentages, and the keys. Dragging, the keys, collapsing and the store
 * come from the system (data-ds-splitpane, data-ds-splitpane-toggle);
 * wire() holds only what a page adds: the reset button (a project's own control). Size, density, shape and touch come from the options
 * panel around it.
 */
var SPLIT_DEVICES = [
  ['LAPTOP-0042', 'laptop', 'Notebook 14 · Building A'],
  ['LAPTOP-0017', 'laptop', 'Notebook 14 · Building B'],
  ['PRINTER-0003', 'printer', 'Printer · Floor 2'],
  ['MONITOR-0009', 'monitor', 'Display · Room 4.12'],
  ['TABLET-0121', 'tablet', 'Tablet · Service desk'],
  ['ROUTER-0002', 'router', 'Router · Server room'],
];

function splitList(h, label) {
  return '<ul class="ds-list ds-list--interactive" aria-label="' + label + '">' + SPLIT_DEVICES.map(function (row, index) {
    return '<li class="ds-list__item">' + h.icon(row[1], 20, 'ds-list__icon') +
      '<span class="ds-list__text"><span class="ds-list__title"><a class="ds-list__action" href="#device"' + (index === 0 ? ' aria-current="true"' : '') + '>' + row[0] + '</a></span>' +
      '<span class="ds-list__meta">' + row[2] + '</span></span></li>';
  }).join('') + '</ul>';
}

function splitRecord(h, headingId) {
  return '<div class="ds-splitpane__body ds-stack">' +
    '<h3 class="ds-card__title" id="' + headingId + '">LAPTOP-0042</h3>' +
    '<p class="ds-muted">Notebook 14, assigned to Ada Lovelace since March. The warranty ends in 30 days.</p>' +
    '<ul class="ds-kv-list"><li><span>Owner</span><strong>Ada Lovelace</strong></li><li><span>Location</span><strong>Building A, room 2.04</strong></li>' +
    '<li><span>Last seen</span><strong>Today, 09:12</strong></li><li><span>Product</span><strong>Notebook 14</strong></li></ul></div>';
}

SG.demo('splitpane', {
  title: 'Split pane',
  group: 'layout',
  need: 'Show two or three panes side by side or stacked, resized by dragging or the keyboard, remembered, collapsible',
  lead: 'Panes with a divider between each pair: drag it, or focus it and use the arrow keys (the WAI-ARIA window splitter). Each pane has a start size and limits of its own, a pane can collapse, and the sizes can be remembered. The options panel changes the grip (size), the body padding (density), the corners (shape) and the hit area (touch).',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var list = h.uid('split-list');
    var record = h.uid('split-record');
    var tree = h.uid('split-tree');
    var inspector = h.uid('split-inspector');
    var query = h.uid('split-query');
    return h.section('List and record',
      '<div class="sg-row">' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Device list" data-tip="Device list" data-ds-splitpane-toggle="' + list + '" data-demo="toggle">' + h.icon('panelLeft', 20) + '</button>' +
        '<button class="ds-btn ds-btn--text" type="button" data-demo="reset">' + h.icon('reset', 16) + 'Reset sizes</button></div>' +
      '<div class="ds-splitpane ds-splitpane--outlined" data-ds-splitpane data-ds-splitpane-store="sg-devices" style="--ds-splitpane-height: 360px" data-demo="two">' +
        '<section class="ds-splitpane__pane" id="' + list + '" aria-label="Devices" data-ds-splitpane-collapsible style="--ds-splitpane-size: 280px; --ds-splitpane-min: 200px; --ds-splitpane-max: 60%">' + splitList(h, 'Devices') + '</section>' +
        '<div class="ds-splitpane__divider" role="separator" tabindex="0" aria-label="Resize the device list"></div>' +
        '<section class="ds-splitpane__pane ds-splitpane__pane--fill" aria-labelledby="' + record + '">' + splitRecord(h, record) + '</section>' +
      '</div>',
      'The list starts at 280px, between 200px and 60%. It collapses: Enter or a double click on the divider, a drag below 100px, or the button above. Its size is remembered (data-ds-splitpane-store); Reset sizes forgets it.') +

      h.section('Three panes',
        '<div class="ds-splitpane ds-splitpane--outlined" data-ds-splitpane style="--ds-splitpane-height: 320px" data-demo="three">' +
          '<nav class="ds-splitpane__pane" id="' + tree + '" aria-label="Folders" style="--ds-splitpane-size: 200px; --ds-splitpane-min: 160px; --ds-splitpane-max: 320px">' +
            '<div class="ds-splitpane__body"><ul class="ds-plain-list"><li>All devices</li><li>Laptops</li><li>Printers</li><li>Retired</li></ul></div></nav>' +
          '<div class="ds-splitpane__divider" role="separator" tabindex="0" aria-label="Resize the folders"></div>' +
          '<section class="ds-splitpane__pane ds-splitpane__pane--fill" aria-label="Devices" style="--ds-splitpane-min: 200px">' + splitList(h, 'Devices in the folder') + '</section>' +
          '<div class="ds-splitpane__divider" role="separator" tabindex="0" aria-label="Resize the inspector"></div>' +
          '<aside class="ds-splitpane__pane" id="' + inspector + '" aria-label="Inspector" data-ds-splitpane-collapsible style="--ds-splitpane-size: 240px; --ds-splitpane-min: 200px; --ds-splitpane-max: 40%">' +
            '<div class="ds-splitpane__body ds-stack"><h3 class="ds-card__title">Inspector</h3><ul class="ds-kv-list"><li><span>Model</span><strong>Notebook 14</strong></li><li><span>Disk</span><strong>78%</strong></li></ul></div></aside>' +
        '</div>',
        'The outer panes have a size, the middle one fills (--fill). Each divider resizes its outer neighbour; the work area keeps its 200px minimum. The inspector collapses.') +

      h.section('Stacked',
        '<div class="ds-splitpane ds-splitpane--outlined ds-splitpane--stacked" data-ds-splitpane style="--ds-splitpane-height: 360px" data-demo="stacked">' +
          '<section class="ds-splitpane__pane" id="' + query + '" aria-label="Query" style="--ds-splitpane-size: 40%; --ds-splitpane-min: 80px; --ds-splitpane-max: 80%">' +
            '<div class="ds-splitpane__body"><p class="ds-muted">status = offline AND building = "A"</p></div></section>' +
          '<div class="ds-splitpane__divider" role="separator" tabindex="0" aria-label="Resize the query"></div>' +
          '<section class="ds-splitpane__pane" aria-label="Results">' + splitList(h, 'Results') + '</section>' +
        '</div>',
        'The panes one above the other; the divider moves with ArrowUp and ArrowDown. A percentage stays a share when the split pane resizes.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches each divider. <kbd class="ds-kbd">ArrowLeft</kbd> and <kbd class="ds-kbd">ArrowRight</kbd> (stacked: <kbd class="ds-kbd">ArrowUp</kbd> and <kbd class="ds-kbd">ArrowDown</kbd>) move it by 16px, with <kbd class="ds-kbd">Shift</kbd> by 64px; <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd> give the pane its smallest and largest size; <kbd class="ds-kbd">Enter</kbd> collapses and restores a pane that can collapse. <kbd class="ds-kbd">Escape</kbd> during a drag puts the divider back.</p>');
  },

  wire: function (root, h) {
    root.addEventListener('click', function (event) {
      if (!event.target.closest('[data-demo="reset"]')) return;
      var split = DS.core.get(h.$('[data-demo="two"]', root), 'splitpane');
      if (split) split.reset();
    });
  },
});
