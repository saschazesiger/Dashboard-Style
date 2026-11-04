/* A reel and a column: the fades on the same two numbers, the reel resting on a child. */
function scrollToEnd(area, axis, on) {
  var size = axis === 'block' ? area.scrollHeight - area.clientHeight : area.scrollWidth - area.clientWidth;
  area.scrollTo(axis === 'block' ? { top: on ? size : 0, behavior: 'smooth' } : { left: on ? size : 0, behavior: 'smooth' });
  return new Promise(function (resolve) {
    var left = 240;
    (function poll() {
      var at = axis === 'block' ? area.scrollTop : area.scrollLeft;
      if (Math.abs(at - (on ? size : 0)) < 2 || --left <= 0) resolve();
      else requestAnimationFrame(poll);
    }());
  }).then(function () { return DS.motion.settled(area, { transitions: true }); });
}

SG_LAB.add({
  id: 'scroll-reel',
  group: 'views',
  title: 'A reel of cards',
  note: '<code>.ds-scroll-x--reel</code>: the children in a row, the next one peeking in; a scroll rests on the start of one, and the fades of <code>.ds-scroll-x</code> follow the position.',
  shows: ['.ds-scroll-x--reel', 'ds-scroll-edge-start', 'ds-scroll-edge-end', '--ds-dur-fast'],
  html: '<div class="ds-scroll-x ds-scroll-x--reel" tabindex="0" role="region" aria-label="Devices">' + ['LAPTOP-0042', 'LAPTOP-0017', 'MONITOR-0007', 'PRINTER-0003', 'TABLET-0121'].map(function (name) {
    return '<div class="ds-card"><p class="ds-card__title">' + name + '</p><p class="ds-muted">Issued, synced today.</p></div>';
  }).join('') + '</div>',
  height: 140,
  setup: function (stage) { DS.dom.scrollEdges(stage.querySelector('.ds-scroll-x')); },
  play: function (stage) {
    var reel = stage.querySelector('.ds-scroll-x');
    return scrollToEnd(reel, 'inline', reel.scrollLeft < 1);
  },
  state: function (stage) { return stage.querySelector('.ds-scroll-x').scrollLeft > 0; },
  toggle: function (stage, on) { return scrollToEnd(stage.querySelector('.ds-scroll-x'), 'inline', on); },
});

SG_LAB.add({
  id: 'scroll-y',
  group: 'views',
  title: 'A column that scrolls down',
  note: '<code>.ds-scroll-y</code>: the same two numbers on the block axis, on <code>scroll(self block)</code>, or through <code>DS.dom.scrollEdges(area, { axis: \'block\' })</code>.',
  shows: ['.ds-scroll-y', 'ds-scroll-edge-start', 'ds-scroll-edge-end', 'DS.dom.scrollEdges', '--ds-dur-fast'],
  html: '<div class="ds-scroll-y" tabindex="0" role="region" aria-label="Activity" style="--ds-scroll-max-height:150px">' + ['Synced LAPTOP-0042.', 'Imported 12 devices.', 'TABLET-0121 is back online.', 'Exported the list as CSV.', 'Restarted PRINTER-0003.', 'Ada Lovelace signed in.', 'Nightly sync finished.', 'Grace Hopper took MONITOR-0007.', 'Synced TABLET-0121.', 'Imported 3 devices.', 'Exported the report.'].map(function (line) {
    return '<p class="ds-muted">' + line + '</p>';
  }).join('') + '</div>',
  height: 170,
  setup: function (stage) { DS.dom.scrollEdges(stage.querySelector('.ds-scroll-y'), { axis: 'block' }); },
  play: function (stage) {
    var area = stage.querySelector('.ds-scroll-y');
    return scrollToEnd(area, 'block', area.scrollTop < 1);
  },
  state: function (stage) { return stage.querySelector('.ds-scroll-y').scrollTop > 0; },
  toggle: function (stage, on) { return scrollToEnd(stage.querySelector('.ds-scroll-y'), 'block', on); },
});
