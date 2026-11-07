/*
 * The Motion Lab entries of the data grid: rows that glide to a new sort
 * (DS.motion.flip under DS.datagrid), and a tree row whose chevron turns on
 * the spring as it opens. A classic script: the build wraps it into
 * styleguide/lab-components.js. Nothing here reads DS while the file loads;
 * the grids are made in setup().
 */
var gridOf = new WeakMap();

function gridAfter(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, Math.max(0, ms)); });
}

/* Everything finite that still runs under the stage has ended. */
function gridQuiet(root, sg) {
  var end = Date.now() + sg.slow(10000);
  function round() {
    var running = root.getAnimations({ subtree: true }).filter(function (animation) {
      var timing = animation.effect && animation.effect.getComputedTiming();
      return timing && isFinite(timing.endTime) && animation.timeline === root.ownerDocument.timeline && animation.playState === 'running';
    });
    if (!running.length || Date.now() > end) return undefined;
    return Promise.race([
      Promise.all(running.map(function (animation) { return animation.finished.catch(function () {}); })),
      gridAfter(end - Date.now()),
    ]).then(function () { return sg.frames(2); }).then(round);
  }
  return sg.frames(2).then(round);
}

var GRID_LAB_ROWS = [
  { id: 'd1', name: 'LAPTOP-0042', owner: 'Ada Lovelace', load: 32 },
  { id: 'd2', name: 'LAPTOP-0043', owner: 'Alan Turing', load: 14 },
  { id: 'd3', name: 'DESKTOP-0107', owner: 'Grace Hopper', load: 93 },
  { id: 'd4', name: 'LAPTOP-0051', owner: 'Grace Hopper', load: 78 },
  { id: 'd5', name: 'TABLET-0121', owner: 'Katherine Johnson', load: 47 },
];

SG_LAB.add({
  id: 'datagrid-sort',
  group: 'data',
  title: 'Data grid: sort',
  note: 'Click a header, Shift+click a second one: <code>DS.datagrid</code> sorts by several columns and the rows glide to their places through <code>DS.motion.flip</code>, keyed by their <code>data-ds-key</code>. Replay sorts by load, highest first.',
  shows: ['DS.datagrid.create', 'DS.motion.flip', '--ds-dur-slow', '--ds-ease-spatial'],
  html: '<div class="ds-table-wrap"><table class="ds-table ds-datagrid" aria-label="Devices"></table></div>',
  height: 360,
  wide: true,
  setup: function (stage) {
    gridOf.set(stage, DS.datagrid.create(stage.querySelector('table'), {
      columns: [
        { key: 'name', label: 'Device', className: 'ds-nowrap' },
        { key: 'owner', label: 'Owner' },
        { key: 'load', label: 'Load', type: 'number', format: function (value) { return value + '%'; } },
      ],
      rows: GRID_LAB_ROWS.map(function (row) { return Object.assign({}, row); }),
      sortable: true,
      multiSort: true,
      sort: [{ key: 'name', dir: 'ascending' }],
    }));
  },
  reset: function (stage, sg) {
    var grid = gridOf.get(stage);
    grid.set({ sort: [{ key: 'name', dir: 'ascending' }] });
    return gridQuiet(stage, sg);
  },
  play: function (stage, sg) {
    gridOf.get(stage).sort('load', 'descending');
    return gridQuiet(stage, sg);
  },
});

SG_LAB.add({
  id: 'datagrid-tree',
  group: 'data',
  title: 'Data grid: tree rows',
  note: 'A tree row opens: its <code>.ds-datagrid__chevron</code> turns 90deg on the spring (<code>--ds-dur-medium</code>, <code>--ds-ease-spatial</code>) and the children are there at once, indented by level. Replay opens Building A; ArrowRight and ArrowLeft open and close it from the keyboard.',
  shows: ['.ds-datagrid__chevron', '--ds-dur-medium', '--ds-ease-spatial'],
  html: '<div class="ds-table-wrap"><table class="ds-table ds-datagrid" aria-label="Places and devices"></table></div>',
  height: 320,
  setup: function (stage) {
    gridOf.set(stage, DS.datagrid.create(stage.querySelector('table'), {
      columns: [{ key: 'name', label: 'Name' }, { key: 'kind', label: 'Kind' }],
      rows: [
        { id: 'a', name: 'Building A', kind: 'Site', children: [
          { id: 'a1', name: 'LAPTOP-0042', kind: 'Laptop 14' },
          { id: 'a2', name: 'DESKTOP-0107', kind: 'Desktop 7' },
        ] },
        { id: 's', name: 'Server room', kind: 'Room', children: [{ id: 's1', name: 'LAPTOP-0051', kind: 'Laptop 13' }] },
      ],
      tree: true,
      focus: 'row',
    }));
  },
  reset: function (stage, sg) {
    gridOf.get(stage).expand('a', false);
    return gridQuiet(stage, sg);
  },
  play: function (stage, sg) {
    gridOf.get(stage).expand('a', true);
    return gridQuiet(stage, sg);
  },
  state: function (stage) { return stage.querySelector('tr[data-ds-datagrid-row="a"]').getAttribute('aria-expanded') === 'true'; },
  toggle: function (stage, on, sg) {
    gridOf.get(stage).expand('a', on);
    return gridQuiet(stage, sg);
  },
});
