/* A list-detail layout at a phone's width: the record slides in from the end, back slides the list in from the start. */
SG_LAB.add({
  id: 'listdetail-level',
  group: 'navigation',
  title: 'List-detail: one column',
  note: '<code>DS.listdetail.create()</code> at 360px: the column that comes slides in and fades (<code>DS.motion.enter(column, \'slide\')</code>: <code>ds-shift-in</code> over <code>--ds-dur-slow</code> on <code>--ds-ease-spatial</code>, <code>ds-fade-in</code>), from the end going deeper and from the start going back; the column that goes is gone at once.',
  shows: ['DS.listdetail.create', '.ds-listdetail', '.ds-listdetail__list', '.ds-listdetail__detail', '.ds-enter--slide', 'ds-shift-in', 'ds-fade-in', '--ds-dur-slow', '--ds-ease-spatial', '--ds-distance-xl'],
  html: '<div class="ds-listdetail ds-listdetail--outlined" style="--ds-listdetail-height: 200px; inline-size: 360px; max-inline-size: 100%" data-lab-ld>' +
    '<section class="ds-listdetail__list" aria-label="Devices"><header class="ds-listdetail__head"><h3 class="ds-listdetail__title">Devices</h3></header><div class="ds-listdetail__body"><p class="ds-muted">LAPTOP-0042</p></div></section>' +
    '<section class="ds-listdetail__detail" aria-label="Record"><header class="ds-listdetail__head"><h3 class="ds-listdetail__title">LAPTOP-0042</h3></header><div class="ds-listdetail__body"><p class="ds-muted">Ada Lovelace</p></div></section></div>',
  height: 220,
  setup: function (stage) {
    stage.layout = DS.listdetail.create(stage.querySelector('[data-lab-ld]'));
  },
  play: function (stage) {
    var layout = stage.layout;
    layout.set(layout.get() === 'list' ? 'detail' : 'list', { focus: false });
    return DS.motion.settled(stage.querySelector(layout.get() === 'list' ? '.ds-listdetail__list' : '.ds-listdetail__detail'));
  },
  state: function (stage) {
    return Boolean(stage.layout && stage.layout.get() === 'detail');
  },
  toggle: function (stage, on) {
    stage.layout.set(on ? 'detail' : 'list', { focus: false });
    return DS.motion.settled(stage.querySelector(on ? '.ds-listdetail__detail' : '.ds-listdetail__list'));
  },
  reset: function (stage) {
    stage.layout.set('list', { animate: false, focus: false });
  },
});
