/* The wheel: one strip of two lines (the new pushes the old out), the hold that turns a burst into one roll, and the morph hooks. */
(function () {
  var STEPS = ['Thinking', 'Running npm test', 'Writing the summary'];
  var line = function (text) { return '<span class="ds-wheel__line" data-ds-key="' + text + '">' + text + '</span>'; };

  SG_LAB.add({
    id: 'wheel-roll',
    group: 'feedback',
    title: 'Wheel: a status line rolls',
    note: '<code>DS.wheel.create()</code> and <code>set()</code>: both lines glide together, one line apart, on <code>--ds-dur-slow</code> and <code>--ds-ease-in-out</code>, each fading on its own glide. A change during a turn waits out <code>--ds-hold-status</code>; Rapid toggle rolls once to the last line.',
    shows: ['DS.wheel.create', '.ds-wheel', '.ds-wheel__line', '--ds-dur-slow', '--ds-ease-in-out', '--ds-hold-status'],
    html: '<p class="ds-meta">Status</p><p><span class="ds-wheel" data-lab-wheel></span></p>',
    height: 120,
    setup: function (stage) {
      stage.wheel = DS.wheel.create(stage.querySelector('[data-lab-wheel]'), { text: STEPS[0] });
      stage.at = 0;
    },
    play: function (stage) {
      stage.at = (stage.at + 1) % STEPS.length;
      stage.wheel.set(STEPS[stage.at]);
      return DS.motion.settled(stage.querySelector('[data-lab-wheel]'), { subtree: true });
    },
    toggle: function (stage, on) {
      stage.at = on ? 1 : 0;
      stage.wheel.set(STEPS[stage.at]);
      return DS.motion.settled(stage.querySelector('[data-lab-wheel]'), { subtree: true });
    },
    state: function (stage) { return stage.at === 1; },
    reset: function (stage) {
      var slot = stage.querySelector('[data-lab-wheel]');
      slot.replaceChildren();
      stage.wheel = DS.wheel.create(slot, { text: STEPS[0] });
      stage.at = 0;
    },
  });

  SG_LAB.add({
    id: 'wheel-burst',
    group: 'feedback',
    title: 'Wheel: a burst rolls once',
    note: '<code>DS.wheel.roll()</code> five times in one task: the lines that never showed go at once, and only the last one comes in, with the shimmer.',
    shows: ['DS.wheel.roll', '.ds-shimmer'],
    html: '<p class="ds-meta">Status</p><p><span class="ds-wheel" data-lab-burst></span></p>',
    height: 120,
    setup: function (stage) {
      DS.wheel.roll(stage.querySelector('[data-lab-burst]'), 'Listing devices');
      stage.round = 0;
    },
    play: function (stage) {
      var slot = stage.querySelector('[data-lab-burst]');
      stage.round += 1;
      var last;
      ['LAPTOP-0042', 'LAPTOP-0043', 'LAPTOP-0044', 'LAPTOP-0045', 'Round ' + stage.round + ' done'].forEach(function (text) {
        last = DS.wheel.roll(slot, 'Reading ' + text, { shimmer: true });
      });
      return last;
    },
  });

  SG_LAB.add({
    id: 'wheel-morph',
    group: 'feedback',
    title: 'Wheel: lines of a morph',
    note: '<code>DS.dom.morphHtml(el, html, DS.wheel.hooks)</code>: a new key rolls in; the same key with a ticking figure is patched in place and does not roll.',
    shows: ['DS.dom.morphHtml'],
    html: '<p class="ds-meta">Sync</p><p data-lab-morph><span class="ds-wheel">' + line('Waiting') + '</span></p>',
    height: 120,
    play: function (stage, sg) {
      var host = stage.querySelector('[data-lab-morph]');
      var draw = function (key, text) {
        DS.dom.morphHtml(host, '<span class="ds-wheel"><span class="ds-wheel__line" data-ds-key="' + key + '">' + text + '</span></span>', DS.wheel.hooks);
      };
      draw('Syncing', 'Syncing 1 of 3');
      return new Promise(function (resolve) {
        setTimeout(function () { draw('Syncing', 'Syncing 2 of 3'); }, sg.slow(300));
        setTimeout(function () { draw('Syncing', 'Syncing 3 of 3'); }, sg.slow(600));
        setTimeout(function () {
          draw('Waiting', 'Waiting');
          resolve(DS.motion.settled(host, { subtree: true }));
        }, sg.slow(900));
      });
    },
  });
})();
