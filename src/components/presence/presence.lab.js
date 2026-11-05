/* A presence that changes: the dot glides its colours on --ds-dur-medium, its shape and the word change at once. */
(function () {
  function to(stage, on) {
    var label = stage.querySelector('[data-lab-presence]');
    var dot = label.querySelector('.ds-presence-dot');
    dot.className = 'ds-presence-dot ds-presence-dot--' + (on ? 'busy' : 'online');
    label.lastElementChild.textContent = DS.core.t(on ? 'presenceBusy' : 'presenceOnline');
    return DS.motion.settled(dot);
  }

  SG_LAB.add({
    id: 'presence-change',
    group: 'feedback',
    title: 'Presence changes',
    note: 'A <code>.ds-presence-dot</code> that turns from online to busy: its colours glide on <code>--ds-dur-medium</code>, as a status chip does; the shape (a disc, a disc with a bar) and the word change at once.',
    shows: ['.ds-presence-dot', '.ds-presence-dot--online', '.ds-presence-dot--busy', '.ds-presence-label', '--ds-dur-medium', '--ds-ease-in-out'],
    html: '<span class="ds-presence-label ds-xl" data-lab-presence><span class="ds-presence-dot ds-presence-dot--online"></span><span>Online</span></span>',
    height: 120,
    play: function (stage) {
      return to(stage, !stage.querySelector('.ds-presence-dot--busy'));
    },
    toggle: function (stage, on) {
      return to(stage, on);
    },
    state: function (stage) {
      return Boolean(stage.querySelector('.ds-presence-dot--busy'));
    },
    reset: function (stage) {
      return to(stage, false);
    },
  });
})();
