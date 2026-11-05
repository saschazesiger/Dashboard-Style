/*
 * The Motion Lab entry of DS.toggletip: the help card grows out of the info
 * button and the button morphs on press.
 */
SG_LAB.add({
  id: 'toggletip-open',
  group: 'overlays',
  title: 'Toggletip card',
  note: 'A click on the info button opens its card, which grows out of the button (the arrow\'s tip) like every popover; focus stays on the button.',
  shows: ['DS.toggletip.create', '.ds-toggletip', '.ds-popover--tip', '--ds-dur-medium', '--ds-ease-spatial', '--ds-dur-micro'],
  html: '<div class="sg-popup-stage"><span>Serial number</span> <button class="ds-toggletip" type="button" aria-label="About the serial number" aria-expanded="false" aria-controls="sg-lab-toggletip" data-lab-tip>' +
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></button>' +
    '<div class="ds-popover ds-popover--tip ds-popover--arrow" id="sg-lab-toggletip" role="group" aria-label="Serial number" hidden>' +
    '<div class="ds-popover__head"><h3 class="ds-popover__title">Serial number</h3></div>' +
    '<div class="ds-popover__body"><p>On the sticker under the device.</p></div></div></div>',
  height: 200,
  setup: function (stage) {
    var button = stage.querySelector('[data-lab-tip]');
    var control = DS.toggletip.create(button);
    button.addEventListener('click', function () { control.set(!control.get()); });
  },
  subject: function (stage) { return stage.querySelector('.ds-popover'); },
  state: function (stage) { return stage.querySelector('.ds-popover').getAttribute('data-state') === 'open'; },
  play: function (stage) {
    var control = DS.toggletip.create(stage.querySelector('[data-lab-tip]'));
    var card = stage.querySelector('.ds-popover');
    return control.set(true)
      .then(function () { return control.set(false); })
      .then(function () { return DS.motion.settled(card); });
  },
  toggle: function (stage, on) {
    return DS.toggletip.create(stage.querySelector('[data-lab-tip]')).set(on);
  },
});
