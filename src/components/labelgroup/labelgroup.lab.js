/*
 * The Motion Lab entry of DS.labelgroup: the "+N" popup grows from its
 * button on the spring and leaves with a quick fade.
 */
SG_LAB.add({
  id: 'labelgroup-popup',
  group: 'overlays',
  title: 'Label group, every tag in a popup',
  note: 'The popup of the "+N" button fades in over <code>--ds-dur-fast</code> and grows from the button on <code>--ds-ease-spatial</code> over <code>--ds-dur-medium</code>; it leaves with a fade over <code>--ds-dur-instant</code>. Closed mid-way, it turns back from where it is. The tags themselves hide and show at once.',
  shows: ['DS.labelgroup.create', '.ds-label-group', '.ds-label-group__popup', '--ds-dur-fast', '--ds-dur-medium', '--ds-dur-instant', '--ds-ease-spatial', '--ds-scale-popup'],
  html: '<div class="sg-popup-stage"><div class="ds-label-group" style="inline-size: 240px">' +
    '<ul class="ds-label-group__list" aria-label="Labels of ticket 41">' +
    '<li><span class="ds-tag">Printer</span></li><li><span class="ds-tag ds-tone-warning">Waiting for parts</span></li>' +
    '<li><span class="ds-tag">Second floor</span></li><li><span class="ds-tag">Hardware</span></li><li><span class="ds-tag">Vendor</span></li></ul></div></div>',
  height: 200,
  setup: function (stage) {
    stage.sgLabelGroup = DS.labelgroup.create(stage.querySelector('.ds-label-group'));
  },
  subject: function (stage) { return stage.querySelector('.ds-label-group__popup'); },
  state: function (stage) { return stage.sgLabelGroup.get().open; },
  play: function (stage) {
    var handle = stage.sgLabelGroup;
    var popup = stage.querySelector('.ds-label-group__popup');
    handle.set(true);
    return DS.motion.settled(popup).then(function () {
      handle.set(false);
      return DS.motion.settled(popup);
    });
  },
  toggle: function (stage, on) {
    var handle = stage.sgLabelGroup;
    handle.set(on);
    var popup = stage.querySelector('.ds-label-group__popup');
    // Closing: the overlay's promise, which resolves once the exit has played and the popup is hidden again
    // (settled() alone could resolve before the exit has started).
    return on ? DS.motion.settled(popup) : DS.overlay.close(popup);
  }
});
