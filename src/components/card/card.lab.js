/* A selectable card: the tint, the ring and the check, on --ds-dur-fast. */
SG_LAB.add({
  id: 'card-selectable',
  group: 'controls',
  title: 'A selectable card',
  note: 'A choice among a few cards: <code>aria-pressed</code> turns the tint on over <code>--ds-dur-fast</code>, the ring shows at once, and the mark of <code>.ds-card--selectable</code> fills with its check on the same timing. A reversal continues from the current colours.',
  shows: ['.ds-card--selectable', '.ds-card__check', '--ds-dur-fast', '--ds-ease-in-out'],
  html: '<button class="ds-card ds-card--interactive ds-card--selectable" type="button" aria-pressed="false" style="max-width:320px"><span class="ds-card__title">Extended</span><span class="ds-muted">Hourly sync, a year of history.</span><span class="ds-card__check" aria-hidden="true"></span></button>',
  setup: function (stage) { stage.querySelector('.ds-card__check').insertAdjacentHTML('beforeend', DS.icons.icon(DS.icons.check, 16)); },
  height: 160,
  play: function (stage) {
    var card = stage.querySelector('.ds-card');
    card.setAttribute('aria-pressed', String(card.getAttribute('aria-pressed') !== 'true'));
    return DS.motion.settled(card, { transitions: true, subtree: true });
  },
  state: function (stage) { return stage.querySelector('.ds-card').getAttribute('aria-pressed') === 'true'; },
  toggle: function (stage, on) {
    var card = stage.querySelector('.ds-card');
    card.setAttribute('aria-pressed', String(on));
    return DS.motion.settled(card, { transitions: true, subtree: true });
  },
});
