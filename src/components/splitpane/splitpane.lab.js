/* A split pane's pane collapses and comes back: its registered size glides on the decelerating curve, reversible mid-way. */
SG_LAB.add({
  id: 'splitpane-collapse',
  group: 'utilities',
  title: 'Split pane collapses',
  note: '<code>DS.splitpane.create()</code>: a collapsible pane glides its size (<code>--ds-splitpane-size</code>, registered) to nothing and back over <code>--ds-dur-medium</code> on <code>--ds-ease-out</code>: a size that pushes layout never overshoots. Reversed mid-way it turns from where it is. A drag and the keys move at once.',
  shows: ['DS.splitpane.create', '.ds-splitpane', '.ds-splitpane__pane', '.ds-splitpane__divider', '--ds-splitpane-size', '--ds-dur-medium', '--ds-ease-out'],
  // A collapsed pane is inert on purpose (data-lab-keep): nothing in it can take focus while it has no width.
  html: '<div class="ds-splitpane ds-splitpane--outlined" style="--ds-splitpane-height: 160px" data-lab-split>' +
    '<section class="ds-splitpane__pane" aria-label="Devices" data-ds-splitpane-collapsible data-lab-keep style="--ds-splitpane-size: 45%; --ds-splitpane-min: 96px"><div class="ds-splitpane__body"><p class="ds-muted">Devices</p></div></section>' +
    '<div class="ds-splitpane__divider" role="separator" tabindex="0" aria-label="Resize the devices"></div>' +
    '<section class="ds-splitpane__pane ds-splitpane__pane--fill" aria-label="Record"><div class="ds-splitpane__body"><p class="ds-muted">LAPTOP-0042</p></div></section></div>',
  height: 180,
  setup: function (stage) {
    stage.split = DS.splitpane.create(stage.querySelector('[data-lab-split]'));
  },
  play: function (stage) {
    var pane = stage.querySelector('.ds-splitpane__pane');
    stage.split.toggle(0);
    return DS.motion.settled(pane, { transitions: true });
  },
  state: function (stage) {
    return Boolean(stage.split && stage.split.get().collapsed[0]);
  },
  toggle: function (stage, on) {
    var pane = stage.querySelector('.ds-splitpane__pane');
    if (on) stage.split.collapse(0);
    else stage.split.expand(0);
    return DS.motion.settled(pane, { transitions: true });
  },
  reset: function (stage) {
    stage.split.expand(0);
    return DS.motion.settled(stage.querySelector('.ds-splitpane__pane'), { transitions: true });
  },
});
