/* The count badge through its controller: a count that appears pops in, one that goes pops out, the figure changes at once. */
SG_LAB.add({
  id: 'badge-count',
  group: 'feedback',
  title: 'Badge count',
  note: '<code>DS.badge.create()</code>: the count stops at its maximum (<code>99+</code>). A count that appears pops in, one that goes pops out on <code>DS.motion.enter</code> and <code>leave</code>; the figure itself changes at once.',
  shows: ['DS.badge.create', '.ds-badge', '.ds-enter--pop', '.ds-leave--pop', 'ds-pop-in', 'ds-pop-out'],
  html: '<button class="ds-btn" type="button">Inbox <span class="ds-badge" data-lab-badge></span></button>',
  height: 120,
  setup: function (stage) {
    stage.badge = DS.badge.create(stage.querySelector('[data-lab-badge]'), { value: 0 });
  },
  play: function (stage) {
    var el = stage.querySelector('[data-lab-badge]');
    stage.badge = stage.badge || DS.badge.create(el, { value: 0 });
    stage.badge.set(stage.badge.get() ? 0 : 128);
    return DS.motion.settled(el);
  },
  toggle: function (stage, on) {
    var el = stage.querySelector('[data-lab-badge]');
    stage.badge = stage.badge || DS.badge.create(el, { value: 0 });
    stage.badge.set(on ? 128 : 0);
    return DS.motion.settled(el);
  },
  state: function (stage) {
    return Boolean(stage.badge && stage.badge.get());
  },
  reset: function (stage) {
    var el = stage.querySelector('[data-lab-badge]');
    DS.motion.cancel(el);
    el.hidden = false;
    el.textContent = '';
    stage.badge = DS.badge.create(el, { value: 0 });
  },
});
