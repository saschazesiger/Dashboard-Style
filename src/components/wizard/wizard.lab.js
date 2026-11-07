/*
 * Motion Lab: a form wizard moving on and back. Next checks the step (here
 * filled in), the step turns done in the steps (its check draws itself) and
 * the next panel enters with .ds-enter--swap; Back plays the same entrance
 * the other way round.
 */
function wizardLabForm() {
  var panel = function (title, body, hidden) {
    return '<section class="ds-wizard__panel"' + (hidden ? ' hidden' : '') + '><h3 class="ds-wizard__title">' + title + '</h3>' + body + '</section>';
  };
  return '<form class="ds-wizard" aria-label="Report a problem" style="inline-size: min(100%, 520px);">' +
    '<ol class="ds-steps ds-wizard__steps" aria-label="Report a problem"></ol>' +
    panel('Device', '<div class="ds-field"><label class="ds-field__label" for="lab-wizard-serial">Serial number</label><input class="ds-input" id="lab-wizard-serial" name="serial" required value="SN-3381-77"></div>') +
    panel('Problem', '<div class="ds-field"><label class="ds-field__label" for="lab-wizard-what">What happened</label><input class="ds-input" id="lab-wizard-what" name="what" value="It does not start"></div>', true) +
    panel('Review', '<div class="ds-wizard__summary"></div>', true).replace('<section class="ds-wizard__panel"', '<section class="ds-wizard__panel" data-ds-wizard-summary') +
    '<div class="ds-wizard__actions"><button class="ds-btn ds-wizard__back" type="button">Back</button>' +
    '<button class="ds-btn ds-btn--filled ds-wizard__next" type="button">Next</button>' +
    '<button class="ds-btn ds-btn--filled ds-wizard__submit" type="submit" hidden>Send report</button></div></form>';
}

SG_LAB.add({
  id: 'wizard-step',
  group: 'controls',
  title: 'Form wizard: next and back',
  note: '<code>DS.wizard.create()</code>: Next checks the step, the step turns done (its check draws itself, as in Steps) and the next panel enters with <code>.ds-enter--swap</code> through <code>DS.motion.enter()</code>: it fades in and moves <code>--ds-distance-sm</code> on the spring. Back never checks and plays the same entrance.',
  shows: ['DS.wizard.create', '.ds-wizard', '.ds-wizard__panel', '.ds-enter--swap', 'DS.motion.enter'],
  html: wizardLabForm(),
  height: 300,
  setup: function (stage) {
    stage.wizard = DS.wizard.create(stage.querySelector('.ds-wizard'));
  },
  play: function (stage) {
    stage.wizard.next();
    return DS.motion.settled(stage.wizard.get().panel);
  },
  toggle: function (stage, on) {
    if (on) stage.wizard.go(1);
    else stage.wizard.go(0);
    return DS.motion.settled(stage.wizard.get().panel);
  },
  state: function (stage) {
    return Boolean(stage.wizard && stage.wizard.get().index === 1);
  },
  reset: function (stage) {
    stage.wizard.go(0);
  },
});
