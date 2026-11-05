/*
 * The Motion Lab entry of DS.copy: the feedback after a copy, on an icon
 * button (the icon swap) and on a labelled button (the done face rolls in,
 * its check draws itself), held for --ds-hold-status, then back.
 */
SG_LAB.add({
  id: 'copy-feedback',
  group: 'controls',
  title: 'Copy button says "Copied"',
  note: '<code>DS.copy.create()</code>: after a copy the icon swaps to the check, the done face rolls in and its check draws itself; after <code>--ds-hold-status</code> both go back. The copy itself is skipped here (<code>done()</code>), so the clipboard is left alone.',
  shows: ['DS.copy.create', '.ds-copy', '.ds-copy__done', '.ds-icon-swap', '.ds-btn--done', '--ds-hold-status', '--ds-dur-fast'],
  html: '<div class="sg-row"><span class="ds-copy"><code class="ds-copy__value">LAPTOP-0042</code>' +
    '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Copy the serial number" data-lab-copy="icon">' +
    '<span class="ds-icon-swap"><span class="ds-icon-swap__a" data-icon="copy"></span><span class="ds-icon-swap__b" data-icon="check"></span></span></button></span>' +
    '<button class="ds-btn" type="button" data-lab-copy="faces"><span class="ds-btn__faces"><span class="ds-btn__face"><span data-icon="link" data-icon-size="16"></span>Copy link</span>' +
    '<span class="ds-btn__face ds-btn__face--done" aria-hidden="true"><span data-icon="check" data-icon-size="16"></span><span class="ds-copy__done"></span></span></span></button></div>',
  height: 120,
  setup: function (stage) {
    DS.icons.fill(stage);
    stage.copies = Array.prototype.map.call(stage.querySelectorAll('[data-lab-copy]'), function (button) { return DS.copy.create(button, { text: 'LAPTOP-0042' }); });
  },
  play: function (stage) {
    stage.copies.forEach(function (copy) { copy.done(); });
    var buttons = stage.querySelectorAll('[data-lab-copy]');
    var hold = DS.motion.motionDuration(buttons[0], '--ds-hold-status');
    return new Promise(function (resolve) { setTimeout(resolve, hold); })
      .then(function () { return DS.motion.settled(stage, { subtree: true }); });
  },
});
