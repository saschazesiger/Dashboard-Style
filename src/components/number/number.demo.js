/*
 * The Number input demo: steppers at the end and split, currencies and units
 * in the locale, the states, a German field and the keys. Registered through
 * SG.demo() (styleguide/sg-core.js). Size, density, shape and touch come from
 * the options panel around it; a field has no tone.
 */
function numberField(h, o) {
  var id = h.uid('number');
  var hint = o.hint ? h.uid('number-hint') : '';
  var attrs = Object.keys(o.attrs || {}).map(function (name) { return ' data-ds-number-' + name + '="' + o.attrs[name] + '"'; }).join('');
  var input = '<input class="ds-input" id="' + id + '" type="text" inputmode="' + (o.inputmode || 'decimal') + '" autocomplete="off" value="' + h.esc(o.value) + '"' +
    (hint ? ' aria-describedby="' + hint + '"' : '') + (o.extra || '') + '>';
  var down = '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-number__step ds-number__down" type="button" tabindex="-1"' + (o.less ? ' aria-label="' + o.less + '"' : '') + '>' + h.icon('minimize', 18) + '</button>';
  var up = '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-number__step ds-number__up" type="button" tabindex="-1"' + (o.more ? ' aria-label="' + o.more + '"' : '') + '>' + h.icon('plus', 18) + '</button>';
  var affix = o.affix ? '<span class="ds-input-group__prefix" aria-hidden="true"></span>' : '';
  var suffix = o.suffix !== undefined ? '<span class="ds-input-group__suffix" aria-hidden="true">' + o.suffix + '</span>' : '';
  var body = o.split
    ? input + down + up
    : affix + input + suffix + (o.steppers === false ? '' : '<span class="ds-input-group__trailing ds-number__steps">' + down + up + '</span>');
  return '<div class="ds-field"' + (o.demo ? ' data-demo="' + o.demo + '"' : '') + '><label class="ds-field__label" for="' + id + '">' + o.label + '</label>' +
    '<div class="ds-input-group ds-number' + (o.split ? ' ds-number--split' : '') + '"' + (o.manual ? '' : ' data-ds-number') + attrs + '>' + body + '</div>' +
    (hint ? '<small class="ds-field__hint' + (o.error ? ' ds-field__hint--error' : '') + '" id="' + hint + '">' + (o.error ? h.icon('alertCircle', 16) : '') + o.hint + '</small>' : '') + '</div>';
}

SG.demo('number', {
  title: 'Number input',
  group: 'forms',
  need: 'Enter a number, an amount or a quantity with a unit: steppers, limits and the locale\'s way of writing it',
  lead: 'A spinbutton on a field: type in the locale, step with the arrows or the buttons, stay within the limits. A currency or a unit sits where the locale writes it.',
  options: { variants: ['end', 'split'], sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var variants = [];
    if (!h.variant || h.variant === 'end') {
      variants.push(numberField(h, { label: 'Quota (GB)', value: '50', inputmode: 'numeric', suffix: 'GB', attrs: { min: 0, max: 500, step: 5 }, hint: '0 to 500, in steps of 5.', demo: 'quota' }));
    }
    if (!h.variant || h.variant === 'split') {
      variants.push(numberField(h, { label: 'Seats', value: '3', inputmode: 'numeric', split: true, less: 'Fewer seats', more: 'More seats', attrs: { min: 1, max: 20 }, hint: '1 to 20 people.', demo: 'seats' }));
    }
    return h.section('Variants', '<div class="ds-form-grid ds-form-grid--2">' + variants.join('') + '</div>',
      'Both steppers at the end (the default), or the minus first and the plus last for a quantity. The steppers stay out of the tab order: the arrow keys do the same from the field.') +

      h.section('Amounts and units', '<div class="ds-form-grid ds-form-grid--3">' +
        numberField(h, { label: 'Price', value: '19.9', affix: true, suffix: '', attrs: { currency: 'EUR', min: 0, step: 0.01 }, demo: 'price' }) +
        numberField(h, { label: 'Licence cost', value: '1250', affix: true, suffix: '', attrs: { currency: 'USD', min: 0, step: 10 } }) +
        numberField(h, { label: 'Budget', value: '120000', inputmode: 'numeric', affix: true, suffix: '', attrs: { currency: 'JPY', min: 0, step: 1000 } }) +
        numberField(h, { label: 'Disk size', value: '256', inputmode: 'numeric', suffix: '', attrs: { unit: 'gigabyte', min: 0, step: 64 } }) +
        numberField(h, { label: 'Battery threshold', value: '20', inputmode: 'numeric', suffix: '', attrs: { unit: 'percent', min: 5, max: 95, step: 5 } }) +
        numberField(h, { label: 'Room temperature', value: '21.5', suffix: '', attrs: { unit: 'celsius', min: 10, max: 30, step: 0.5 } }) +
        '</div>', 'The symbol and the unit come from Intl in the page\'s locale (data-ds-number-currency, -unit) and stay aria-hidden: the field says "19.90 euros" itself.') +

      h.section('In another locale', '<div class="ds-form-grid ds-form-grid--2" data-demo="german">' +
        numberField(h, { label: 'Preis (de)', value: '', manual: true, affix: true, suffix: '', attrs: { currency: 'EUR', min: 0, step: 0.01 } }) +
        numberField(h, { label: 'Menge (de)', value: '', manual: true, suffix: '', attrs: { unit: 'kilogram', step: 0.1 } }) +
        '</div>', 'DS.number.create(group, { locale: \'de\' }): 1.234,5 reads as 1234.5, and the euro sign moves behind the figure.') +

      h.section('States', '<div class="ds-form-grid ds-form-grid--2">' +
        numberField(h, { label: 'Retries', value: '0', inputmode: 'numeric', attrs: { min: 0, max: 5 }, hint: 'At its minimum the minus is off.' }) +
        numberField(h, { label: 'Ports', value: '48', inputmode: 'numeric', attrs: { min: 1, max: 48 }, hint: 'At its maximum the plus is off.' }) +
        numberField(h, { label: 'Licences', value: '7', inputmode: 'numeric', attrs: { min: 1 }, extra: ' aria-invalid="true"', error: true, hint: 'Only 5 licences are left.' }) +
        numberField(h, { label: 'Warranty (years)', value: '4', inputmode: 'numeric', extra: ' readonly', hint: 'Read-only: set by the contract.' }) +
        numberField(h, { label: 'Fans', value: '2', inputmode: 'numeric', extra: ' disabled', hint: 'Disabled: no fan control on this model.' }) +
        numberField(h, { label: 'Screen size (in)', value: '', suffix: 'in', steppers: false, attrs: { min: 10, max: 34, step: 0.1, decimals: 1 }, hint: 'Empty, without steppers: typing only.' }) +
        '</div>') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">↑</kbd> <kbd class="ds-kbd">↓</kbd> step, <kbd class="ds-kbd">Page Up</kbd> <kbd class="ds-kbd">Page Down</kbd> take ten steps, <kbd class="ds-kbd">Home</kbd> <kbd class="ds-kbd">End</kbd> go to the limits, <kbd class="ds-kbd">Enter</kbd> or leaving the field writes what was typed back in the locale. Text that is no number goes back to the last value.</p>' +
        '<p class="ds-meta" data-demo="log" aria-live="off">Change a value: its ds:change shows here.</p>');
  },

  wire: function (root, h) {
    // A German field is the page's own call: no data-ds-number, create() with the locale.
    var german = h.$$('[data-demo="german"] .ds-number', root).map(function (group, index) {
      var made = DS.number.create(group, { locale: 'de' });
      made.set(index === 0 ? 1234.5 : 2.5);
      return made;
    });
    var log = h.$('[data-demo="log"]', root);
    root.addEventListener('ds:change', function (event) {
      var field = event.target.closest('.ds-field');
      var label = field && h.$('.ds-field__label', field);
      if (log && event.detail && 'value' in event.detail) log.textContent = (label ? label.textContent : 'Value') + ': ' + event.detail.text + ' (value ' + event.detail.value + ')';
    });
    return function () { german.forEach(function (made) { made.destroy(); }); };
  },
});
