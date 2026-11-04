/*
 * The switch's motion of 3.0: the glyphs of .ds-switch--icons crossfade while
 * they ride the handle, and the spinner of a busy switch waits for
 * --ds-delay-loader. The 2.x rows (toggle, locked) stay in styleguide/lab.js.
 */
SG_LAB.add({
  id: 'switch-icons',
  group: 'controls',
  title: 'Switch with icons',
  note: 'One glyph per state on the handle (<code>.ds-switch--icons</code>): both ride the handle on the spring and crossfade, in on <code>--ds-dur-fast</code> and out on <code>--ds-dur-instant</code>; the off handle stays at 24px.',
  shows: ['.ds-switch--icons', '--ds-dur-fast', '--ds-dur-instant', '--ds-dur-medium', '--ds-ease-spatial'],
  html: '<label class="ds-switch ds-switch--icons"><input type="checkbox" role="switch"><span class="ds-switch__track" aria-hidden="true"></span><span class="ds-switch__label">Automatic updates</span></label>',
  setup: function (stage) {
    stage.querySelector('.ds-switch__track').insertAdjacentHTML('beforeend', DS.icons.icon(DS.icons.close, 16, 'ds-switch__icon ds-switch__icon--off') + DS.icons.icon(DS.icons.check, 16, 'ds-switch__icon ds-switch__icon--on'));
  },
  play: function (stage) {
    var input = stage.querySelector('input');
    input.checked = !input.checked;
    return DS.motion.settled(stage.querySelector('.ds-switch__icon--on'), { transitions: true });
  },
  state: function (stage) { return stage.querySelector('input').checked; },
  toggle: function (stage, on) {
    stage.querySelector('input').checked = on;
    return DS.motion.settled(stage.querySelector('.ds-switch__icon--on'), { transitions: true });
  },
});

function setBusy(stage, on) {
  var input = stage.querySelector('input');
  if (on) {
    input.setAttribute('aria-busy', 'true');
    input.setAttribute('aria-disabled', 'true');
  } else {
    input.removeAttribute('aria-busy');
    input.removeAttribute('aria-disabled');
  }
}

SG_LAB.add({
  id: 'switch-busy',
  group: 'controls',
  title: 'Busy switch',
  note: 'While the page waits: <code>aria-busy</code> with <code>aria-disabled</code> on the input. The handle grows to hold the spinner, which fades in only after <code>--ds-delay-loader</code> on <code>--ds-dur-fast</code> and goes on <code>--ds-dur-instant</code>.',
  shows: ['.ds-switch__spinner', '--ds-delay-loader', '--ds-dur-fast', '--ds-dur-instant'],
  html: '<label class="ds-switch"><input type="checkbox" role="switch" checked><span class="ds-switch__track" aria-hidden="true"><span class="ds-spinner ds-switch__spinner"></span></span><span class="ds-switch__label">Remote access</span></label>',
  play: function (stage) {
    var spinner = stage.querySelector('.ds-switch__spinner');
    setBusy(stage, !stage.querySelector('input').hasAttribute('aria-busy'));
    // The spinner's own loop never settles: wait for its opacity alone.
    return Promise.all(spinner.getAnimations().filter(function (animation) { return animation.transitionProperty === 'opacity'; }).map(function (animation) { return animation.finished.catch(function () {}); }));
  },
  state: function (stage) { return stage.querySelector('input').hasAttribute('aria-busy'); },
  toggle: function (stage, on) { setBusy(stage, on); },
});
