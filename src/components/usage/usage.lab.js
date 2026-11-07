/* The usage meter: its share glides; near and over the budget the tone and the status change in place. */
SG_LAB.add({
  id: 'usage-share',
  group: 'data',
  title: 'Usage meter: tokens spent',
  note: '<code>DS.usage.create()</code> and <code>set({ used })</code>: the share glides on <code>--ds-ease-value</code> over <code>--ds-dur-glide</code> (the meter\'s <code>--ds-share</code>); from 80% the meter takes the warning role and the status its icon and word, past the budget the error role. Rapid toggle turns the glide back from where it is.',
  shows: ['DS.usage.create', '.ds-usage', '.ds-usage__meter', '--ds-share'],
  html: '<section class="ds-usage" data-lab-usage aria-label="Tokens this month"><div class="ds-usage__head"><h3 class="ds-usage__title">Tokens this month</h3><span class="ds-usage__status" hidden></span></div>' +
    '<span class="ds-meter ds-usage__meter" role="meter" aria-label="Tokens this month"></span>' +
    '<p class="ds-usage__figures"><span class="ds-usage__value"></span><span class="ds-usage__cost"></span></p></section>',
  height: 140,
  setup: function (stage) {
    stage.usage = DS.usage.create(stage.querySelector('[data-lab-usage]'), { used: 60000, budget: 250000, cost: 1.2, costBudget: 5 });
    stage.at = 0;
  },
  play: function (stage) {
    var steps = [60000, 215000, 262000];
    stage.at = (stage.at + 1) % steps.length;
    stage.usage.set({ used: steps[stage.at] });
    return DS.motion.settled(stage.querySelector('.ds-meter'));
  },
  toggle: function (stage, on) {
    stage.at = on ? 1 : 0;
    stage.usage.set({ used: on ? 215000 : 60000 });
    return DS.motion.settled(stage.querySelector('.ds-meter'));
  },
  state: function (stage) { return stage.at === 1; },
});
