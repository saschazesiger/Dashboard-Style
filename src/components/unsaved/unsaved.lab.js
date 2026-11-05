/*
 * Motion Lab: an unsaved change. The field's dot fades in (Form's
 * .ds-field--changed) and the save bar rises on the spring (.ds-presence,
 * DS.overlay.savebar); undoing the change by hand takes both back.
 */
function unsavedLabToggle(stage, on) {
  var input = stage.querySelector('input');
  input.value = on ? 'Grace Hopper' : 'Ada Lovelace';
  stage.guard.check();
  return Promise.all([
    DS.motion.settled(stage.querySelector('.ds-savebar__bar'), { transitions: true }),
    DS.motion.settled(stage.querySelector('.ds-field'), { transitions: true, subtree: true }),
  ]);
}

SG_LAB.add({
  id: 'unsaved-change',
  group: 'controls',
  title: 'Unsaved changes: the bar and the dot',
  note: '<code>DS.unsaved.create()</code>: a change shows the field\'s dot (in on <code>--ds-dur-fast</code>, out on <code>--ds-dur-instant</code>) and the save bar, which rises from <code>--ds-scale-enter</code> on <code>--ds-ease-spatial</code> and leaves faster. The same value again takes both back.',
  shows: ['DS.unsaved.create', '.ds-field--changed', 'DS.overlay.savebar', '.ds-presence', '--ds-ease-spatial'],
  html: '<div class="ds-view" style="block-size: 240px; inline-size: min(100%, 520px); border: 1px solid var(--ds-line); view-transition-name: none; scroll-timeline: none;">' +
    '<div class="ds-content"><form class="ds-form" aria-label="Device"><div class="ds-field"><label class="ds-field__label" for="lab-unsaved-owner">Owner <span class="ds-field__changed ds-sr">(changed)</span></label>' +
    '<input class="ds-input" id="lab-unsaved-owner" name="owner" value="Ada Lovelace"></div></form></div>' +
    '<div class="ds-savebar"><div class="ds-savebar__bar ds-presence" role="region" aria-label="Unsaved changes" hidden><p class="ds-savebar__text" data-ds-unsaved-count></p>' +
    '<div class="ds-savebar__actions"><button class="ds-btn ds-btn--text" type="button" data-ds-unsaved-discard>Discard</button><button class="ds-btn ds-btn--filled" type="button" data-ds-unsaved-save>Save</button></div></div></div></div>',
  height: 260,
  setup: function (stage) {
    stage.guard = DS.unsaved.create(stage.querySelector('form'), { hotkey: 'off' });
  },
  play: function (stage) {
    return unsavedLabToggle(stage, true);
  },
  toggle: unsavedLabToggle,
  state: function (stage) {
    return Boolean(stage.guard && stage.guard.get().dirty);
  },
  reset: function (stage) {
    return unsavedLabToggle(stage, false);
  },
});
