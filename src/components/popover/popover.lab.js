/*
 * The Motion Lab entries of DS.popover: a popover with an arrow grows out of
 * its anchor on each side, and a hover card.
 */
SG_LAB.add({
  id: 'popover-open',
  group: 'overlays',
  title: 'Popover through DS.popover, with its arrow',
  note: 'It grows out of its anchor (the arrow\'s tip) on the spring while it fades in, and leaves with a quick fade; closed mid-way, it turns back from where it is. Each replay takes the next side.',
  shows: ['DS.popover.open', 'DS.popover.close', '.ds-popover--arrow', '--ds-scale-popup', '--ds-dur-medium', '--ds-dur-fast', '--ds-dur-instant', '--ds-ease-spatial'],
  html: '<div class="sg-popup-stage"><button class="ds-btn" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="sg-lab-popover" data-lab-open>Share</button>' +
    '<div class="ds-popover ds-popover--arrow" id="sg-lab-popover" role="dialog" aria-label="Share" hidden>' +
    '<div class="ds-popover__head"><h2 class="ds-popover__title">Share LAPTOP-0042</h2></div>' +
    '<div class="ds-popover__body"><p>Anyone in the team can open it.</p></div>' +
    '<div class="ds-popover__foot"><button class="ds-btn ds-btn--filled" type="button" data-ds-close>Copy link</button></div></div></div>',
  height: 260,
  setup: function (stage) {
    var trigger = stage.querySelector('[data-lab-open]');
    var popover = stage.querySelector('.ds-popover');
    trigger.addEventListener('click', function () {
      if (popover.getAttribute('data-state') === 'open') DS.popover.close(popover);
      else DS.popover.open(popover, { opener: trigger });
    });
  },
  subject: function (stage) { return stage.querySelector('.ds-popover'); },
  state: function (stage) { return stage.querySelector('.ds-popover').getAttribute('data-state') === 'open'; },
  play: function (stage) {
    var popover = stage.querySelector('.ds-popover');
    // Each replay takes the next side: below, above, after, before.
    var sides = ['bottom', 'top', 'end', 'start'];
    var turn = Number(stage.getAttribute('data-lab-turn') || 0);
    stage.setAttribute('data-lab-turn', String((turn + 1) % sides.length));
    var side = sides[turn];
    return DS.popover.open(popover, { opener: stage.querySelector('[data-lab-open]'), placement: side, focus: false })
      .then(function () { return DS.popover.close(popover); })
      .then(function () { return DS.motion.settled(popover); });
  },
  toggle: function (stage, on) {
    var popover = stage.querySelector('.ds-popover');
    return on ? DS.popover.open(popover, { opener: stage.querySelector('[data-lab-open]'), focus: false }) : DS.popover.close(popover);
  },
});
