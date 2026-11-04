/*
 * The Picker demo: the popover of the date and time pickers on its own, as
 * a page uses it for a panel of its own: presets beside a pane, a foot with
 * actions. Placing, opening, closing, Tab and Escape come from the system
 * (data-ds-picker); wire() is what the page does with a choice.
 */
SG.demo('picker', {
  title: 'Picker popover',
  group: 'overlays',
  need: 'Open a panel of choices from a button: the popover of the date and time pickers',
  lead: 'The popover the pickers open from their button: a small modal dialog that grows from the button, keeps Tab inside and closes on Escape or a press outside. A page may use it for a panel of its own.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var title = h.uid('picker-title');
    return h.section('A panel of its own', '<div class="sg-row" data-demo="own">' +
        '<div class="ds-picker" data-ds-picker>' +
        '<button class="ds-btn" type="button" data-ds-picker-toggle>' + h.icon('filter', 16) + 'Status: <span data-demo="status">Any</span></button>' +
        '<div class="ds-picker__popover" aria-labelledby="' + title + '" hidden>' +
        '<div class="ds-picker__panes">' +
        '<div class="ds-picker__presets" role="group" aria-labelledby="' + title + '">' +
        '<p class="ds-picker__heading" id="' + title + '">Show devices that are</p>' +
        '<button class="ds-picker__preset" type="button" data-value="Any" aria-current="true">Any status<span class="ds-picker__meta">128</span></button>' +
        '<button class="ds-picker__preset" type="button" data-value="Online">Online<span class="ds-picker__meta">96</span></button>' +
        '<button class="ds-picker__preset" type="button" data-value="Offline">Offline<span class="ds-picker__meta">27</span></button>' +
        '<button class="ds-picker__preset" type="button" data-value="Retired" aria-disabled="true">Retired<span class="ds-picker__meta">5</span></button>' +
        '</div>' +
        '<div class="ds-picker__pane"><p class="ds-muted">Offline: no report<br>in the last 15 minutes.</p></div>' +
        '</div>' +
        '<div class="ds-picker__foot"><button class="ds-btn ds-btn--text" type="button" data-demo="reset">Reset</button><span class="ds-picker__spacer"></span><button class="ds-btn ds-btn--filled" type="button" data-demo="done">Done</button></div>' +
        '</div></div></div>', 'Escape closes it and focus is back on the button; a press outside closes it and leaves focus where it was put.');
  },

  wire: function (root, h) {
    var picker = h.$('[data-ds-picker]', root);
    var status = h.$('[data-demo="status"]', root);
    function choose(value) {
      h.$$('.ds-picker__preset', root).forEach(function (item) {
        if (item.getAttribute('data-value') === value) item.setAttribute('aria-current', 'true');
        else item.removeAttribute('aria-current');
      });
      status.textContent = value;
    }
    root.addEventListener('click', function (event) {
      var preset = event.target.closest('.ds-picker__preset');
      if (preset && preset.getAttribute('aria-disabled') !== 'true') choose(preset.getAttribute('data-value'));
      if (event.target.closest('[data-demo="reset"]')) choose('Any');
      if (event.target.closest('[data-demo="done"]')) DS.picker.close(picker);
    });
  },
});
