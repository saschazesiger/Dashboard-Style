/* The log viewer's one motion: the "Latest" pill that comes while the reader is away from the end, and goes back. */
function logviewLines(count) {
  var lines = [];
  for (var i = 0; i < count; i += 1) lines.push('09:00:' + String(i % 60).padStart(2, '0') + ' ' + (i % 7 === 3 ? 'WARN ' : 'INFO ') + 'Device ' + (40 + (i % 5)) + ' synced ' + i + ' settings');
  return lines;
}

function logviewScroll(stage, toEnd) {
  var log = stage.logview;
  var scroller = stage.querySelector('.ds-logview__scroller');
  var pill = stage.querySelector('.ds-logview__latest');
  if (toEnd) log.latest();
  else scroller.scrollTop = Math.max(0, scroller.scrollTop - scroller.clientHeight);
  return new Promise(function (resolve) { requestAnimationFrame(function () { requestAnimationFrame(resolve); }); })
    .then(function () { return DS.motion.settled(pill, { transitions: true }); });
}

SG_LAB.add({
  id: 'logview-latest',
  group: 'data',
  title: 'Log viewer: the Latest pill',
  note: '<code>DS.logview.create()</code> follows the end through <code>DS.dom.followEnd()</code>: scrolling up lets go and the pill comes (<code>.ds-presence</code>: a fade and a grow on the spring), pressing it scrolls back and the pill goes, faster.',
  shows: ['DS.logview.create', '.ds-logview', '.ds-presence', '--ds-dur-medium', '--ds-ease-spatial'],
  html: '<div class="ds-logview" data-ds-logview-tools="off" aria-label="Device log" style="--ds-logview-height: 200px"></div>',
  height: 220,
  setup: function (stage) {
    stage.logview = DS.logview.create(stage.querySelector('.ds-logview'), { lines: logviewLines(120) });
  },
  play: function (stage) {
    return logviewScroll(stage, !stage.querySelector('.ds-logview__latest').hidden);
  },
  toggle: function (stage, on) {
    return logviewScroll(stage, !on);
  },
  state: function (stage) {
    return !stage.querySelector('.ds-logview__latest').hidden;
  },
  reset: function (stage) {
    return logviewScroll(stage, true);
  },
});
