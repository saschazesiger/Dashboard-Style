/* The plan card: once decided its actions leave and the state changes in place; back to waiting they enter. */
SG_LAB.add({
  id: 'plan-decide',
  group: 'feedback',
  title: 'Plan card: a decision',
  note: '<code>DS.plan.create()</code> and <code>set(state)</code>: approved, the actions leave (<code>DS.motion.leave()</code>, <code>.ds-leave</code> on <code>--ds-dur-fast</code>) and the word changes in place; back to waiting they enter (<code>.ds-enter</code>, <code>--ds-dur-medium</code>). Rapid toggle turns them back from where they are.',
  shows: ['DS.plan.create', '.ds-plan', '.ds-plan__actions', '.ds-plan__state'],
  html: '<article class="ds-plan" data-lab-plan aria-label="Replace the swollen batteries"><div class="ds-plan__head"><h3 class="ds-plan__title">Replace the swollen batteries</h3><span class="ds-plan__state"></span></div>' +
    '<ol class="ds-tasks ds-plan__steps" aria-label="Steps"><li class="ds-tasks__item" data-status="pending"><span class="ds-tasks__mark"></span><span class="ds-tasks__text">Order three batteries</span></li></ol>' +
    '<div class="ds-plan__actions"><button class="ds-btn ds-btn--filled" type="button" data-ds-plan-action="approve">Approve</button><button class="ds-btn" type="button" data-ds-plan-action="reject">Reject</button></div></article>',
  height: 220,
  setup: function (stage) {
    stage.plan = DS.plan.create(stage.querySelector('[data-lab-plan]'));
  },
  play: function (stage, sg) {
    var actions = stage.querySelector('.ds-plan__actions');
    stage.plan.set('approved');
    return new Promise(function (resolve) {
      setTimeout(function () {
        stage.plan.set('waiting');
        resolve(DS.motion.settled(actions));
      }, sg.slow(900));
    });
  },
  toggle: function (stage, on) {
    stage.plan.set(on ? 'approved' : 'waiting');
    return DS.motion.settled(stage.querySelector('.ds-plan__actions'));
  },
  state: function (stage) { return stage.plan.get().state === 'approved'; },
});
