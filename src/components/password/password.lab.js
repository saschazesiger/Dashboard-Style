/* The password's strength meter through its controller: the bars change colour on --ds-dur-fast, the reveal swaps its icon. */
SG_LAB.add({
  id: 'password-meter',
  group: 'controls',
  title: 'Password strength meter',
  note: '<code>DS.password.create()</code>: each level fills its bars in the level\'s colour (<code>--ds-dur-fast</code>), and the level is written in words; the reveal button\'s icons swap as every <code>.ds-icon-swap</code>.',
  shows: ['DS.password.create', '.ds-password__meter', '.ds-password__bars', '--ds-dur-fast'],
  html: '<div class="ds-field"><label class="ds-field__label" for="lab-pw">New password</label>' +
    '<div class="ds-input-group"><input class="ds-input" id="lab-pw" type="password" autocomplete="off" aria-describedby="lab-pw-meter">' +
    '<span class="ds-input-group__trailing"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Show password" aria-pressed="false"><span class="ds-icon-swap"><span class="ds-icon-swap__a">' +
    DS.icons.icon(DS.icons.eye, 18) + '</span><span class="ds-icon-swap__b">' + DS.icons.icon(DS.icons.eyeOff, 18) + '</span></span></button></span></div>' +
    '<div class="ds-password__meter" id="lab-pw-meter"><span class="ds-password__bars" aria-hidden="true"><span></span><span></span><span></span><span></span></span><span class="ds-password__strength"></span></div></div>',
  height: 140,
  setup: function (stage) {
    stage.pw = DS.password.create(stage.querySelector('.ds-field'));
  },
  play: function (stage) {
    var input = stage.querySelector('input');
    var steps = ['abc', 'devices42', 'Tr0ub4dor&3', 'correct horse battery staple'];
    var meter = stage.querySelector('.ds-password__meter');
    var at = steps.indexOf(input.value) + 1;
    input.value = at >= steps.length ? '' : steps[at];
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return DS.motion.settled(meter.querySelector('.ds-password__bars'), { subtree: true, transitions: true });
  },
  toggle: function (stage, on) {
    if (stage.pw) stage.pw.set({ revealed: on });
    var input = stage.querySelector('input');
    if (!input.value) {
      input.value = 'Tr0ub4dor&3';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return DS.motion.settled(stage.querySelector('.ds-icon-swap'), { subtree: true, transitions: true });
  },
  state: function (stage) {
    return Boolean(stage.pw && stage.pw.get().revealed);
  },
  reset: function (stage) {
    if (stage.pw) stage.pw.destroy();
    var input = stage.querySelector('input');
    input.value = '';
    input.type = 'password';
    stage.querySelector('button').setAttribute('aria-pressed', 'false');
    stage.pw = DS.password.create(stage.querySelector('.ds-field'));
  },
});
