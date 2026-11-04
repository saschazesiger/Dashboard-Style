/* A list under its sticky head and foot: the edges follow the scroll position (or data-scrolled and data-ds-overflow-end). */
function stickyScroll(list, on) {
  var size = list.scrollHeight - list.clientHeight;
  list.scrollTo({ top: on ? size : 0, behavior: 'smooth' });
  return new Promise(function (resolve) {
    var left = 240;
    (function poll() {
      if (Math.abs(list.scrollTop - (on ? size : 0)) < 2 || --left <= 0) resolve();
      else requestAnimationFrame(poll);
    }());
  }).then(function () { return DS.motion.settled(list, { transitions: true, subtree: true }); });
}

SG_LAB.add({
  id: 'sticky-edges',
  group: 'views',
  title: 'Sticky head and foot',
  note: '<code>.ds-sticky--head</code> raises its edge once rows pass under it, <code>.ds-sticky--foot</code> while rows are hidden under it: on the scroller\'s scroll timeline (<code>ds-scroll-fade</code>), or through <code>DS.dom.watchScrolled</code> and <code>DS.dom.scrollEdges</code> over <code>--ds-dur-fast</code>.',
  shows: ['.ds-sticky', '.ds-sticky--head', '.ds-sticky--foot', 'ds-scroll-fade', 'DS.dom.watchScrolled', 'DS.dom.scrollEdges', '--ds-dur-fast'],
  html: '<div data-lab-sticky tabindex="0" role="region" aria-label="Tickets" style="overflow: auto; position: relative; block-size: 170px; border: 1px solid var(--ds-line); border-radius: var(--ds-radius-card); background: var(--ds-surface)">' +
    '<header class="ds-sticky ds-sticky--head" style="padding: var(--ds-space-2) var(--ds-space-4)"><p class="ds-card__title">Tickets</p></header>' +
    ['Battery swelling', 'Screen flickers', 'No network after update', 'Keyboard key stuck', 'Fan noise', 'Dock not detected', 'Printer offline', 'Disk almost full'].map(function (title, index) {
      return '<p class="ds-muted" style="padding: var(--ds-space-2) var(--ds-space-4); margin: 0">' + (1040 + index) + ' · ' + title + '</p>';
    }).join('') +
    '<footer class="ds-sticky ds-sticky--foot" style="padding: var(--ds-space-2) var(--ds-space-4)"><p class="ds-meta">8 open</p></footer></div>',
  height: 190,
  setup: function (stage) {
    var list = stage.querySelector('[data-lab-sticky]');
    DS.dom.watchScrolled(list, list.querySelector('.ds-sticky--head'));
    DS.dom.scrollEdges(list, { axis: 'block' });
  },
  play: function (stage) {
    var list = stage.querySelector('[data-lab-sticky]');
    return stickyScroll(list, list.scrollTop < 1);
  },
  state: function (stage) { return stage.querySelector('[data-lab-sticky]').scrollTop > 0; },
  toggle: function (stage, on) { return stickyScroll(stage.querySelector('[data-lab-sticky]'), on); },
});
