/*
 * The Slider demo: a labelled slider with its value, the states, and a slider
 * without a value row. Registered through SG.demo() (styleguide/sg-core.js).
 * Size, density, shape and touch come from the options panel around it. The
 * one line of behaviour is what a project writes: --ds-share and the output.
 */
function slider(h, label, value, attributes, unit) {
  var id = h.uid('slider');
  var out = h.uid('slider-out');
  return '<div class="ds-field"><label class="ds-field__label" for="' + id + '">' + label + '</label><div class="ds-field__row">' +
    '<input class="ds-slider" id="' + id + '" type="range" min="7" max="365" value="' + value + '" aria-describedby="' + out + '" data-unit="' + unit + '"' + (attributes || '') + '>' +
    '<output class="ds-slider__value" id="' + out + '" for="' + id + '">' + value + ' ' + unit + '</output></div></div>';
}

SG.demo('slider', {
  title: 'Slider',
  group: 'forms',
  need: 'Pick a value on a range by dragging or with the arrow keys',
  lead: 'A value on a scale, on the native range input, so keyboard, forms and labels stay native. The options panel changes size, density, shape and touch around the demo.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('With its value', '<div class="ds-stack" data-demo="value">' + slider(h, 'Keep history for', 90, '', 'days') + '</div>') +
      h.section('States', '<div class="ds-stack" data-demo="states">' + slider(h, 'Disabled', 180, ' disabled', 'days') +
        slider(h, 'Blocked with a reason', 30, ' aria-disabled="true" data-tip="Needs an admin"', 'days') + '</div>') +
      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the slider; the arrow keys step, <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd> jump, <kbd class="ds-kbd">Page Up</kbd> and <kbd class="ds-kbd">Page Down</kbd> take bigger steps.</p>');
  },

  wire: function (root, h) {
    function share(input) {
      input.style.setProperty('--ds-share', String((input.value - input.min) / (input.max - input.min)));
      var output = h.$('#' + input.getAttribute('aria-describedby'), root);
      if (output) output.textContent = input.value + ' ' + input.getAttribute('data-unit');
    }
    h.$$('.ds-slider', root).forEach(share);
    root.addEventListener('input', function (event) {
      if (event.target.matches('.ds-slider')) share(event.target);
    });
  },
});
