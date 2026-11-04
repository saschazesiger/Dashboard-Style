/*
 * The Code field demo: a six-digit code in two groups, a PIN, an
 * alphanumeric recovery code, the error and disabled states. Registered
 * through SG.demo() (styleguide/sg-core.js). Size, density, shape and touch
 * come from the options panel; a field has no tone.
 */
function otpField(h, o) {
  var label = h.uid('otp-label');
  var hint = h.uid('otp-hint');
  var cells = '';
  for (var i = 0; i < o.length; i += 1) {
    if (o.split && i === o.split) cells += '<span class="ds-otp__sep" aria-hidden="true"></span>';
    cells += '<input class="ds-input ds-otp__cell" inputmode="' + (o.type === 'alphanumeric' ? 'text' : 'numeric') + '" autocomplete="' + (i === 0 && !o.mask ? 'one-time-code' : 'off') + '"' +
      (o.value ? ' value="' + h.esc(o.value.charAt(i)) + '"' : '') + (o.disabled ? ' disabled' : '') + '>';
  }
  return '<div class="ds-field"' + (o.demo ? ' data-demo="' + o.demo + '"' : '') + '>' +
    '<span class="ds-field__label" id="' + label + '">' + o.label + '</span>' +
    '<div class="ds-otp" role="group" aria-labelledby="' + label + '" aria-describedby="' + hint + '" data-ds-otp' +
    (o.type ? ' data-ds-otp-type="' + o.type + '"' : '') + (o.mask ? ' data-ds-otp-mask' : '') + (o.error ? ' aria-invalid="true"' : '') + '>' +
    cells + '<input type="hidden" name="' + (o.name || 'code') + '"></div>' +
    '<small class="ds-field__hint' + (o.error ? ' ds-field__hint--error' : '') + '" id="' + hint + '">' + (o.error ? h.icon('alertCircle', 16) : '') + o.hint + '</small></div>';
}

SG.demo('otp', {
  title: 'Code field',
  group: 'forms',
  need: 'Enter a one-time code or a PIN: one cell per character, paste and autofill the whole code',
  lead: 'One cell per character: typing moves on, Backspace moves back, and a pasted or autofilled code spreads over the cells. The group is named by its label; each cell says which digit it is.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Verify a sign-in', '<form class="ds-form" data-demo="verify">' +
        otpField(h, { label: 'Verification code', length: 6, split: 3, hint: 'We sent it to the phone ending in 42. Try 123456; paste "123 456" too.', demo: 'code' }) +
        '<div class="ds-form-actions"><button class="ds-btn ds-btn--filled" type="submit">Verify</button><button class="ds-btn ds-btn--text" type="reset">Clear</button></div></form>',
      'Type, paste or let the phone fill it. A wrong code shows an error in words; typing again takes it away.') +

      h.section('Variants', '<div class="ds-form-grid ds-form-grid--2">' +
        otpField(h, { label: 'Device PIN', length: 4, mask: true, hint: 'Four digits, shown as dots.', name: 'pin' }) +
        otpField(h, { label: 'Recovery code', length: 8, split: 4, type: 'alphanumeric', hint: 'Letters and digits, from the list you saved.', name: 'recovery' }) +
        '</div>') +

      h.section('States', '<div class="ds-form-grid ds-form-grid--2" data-demo="states">' +
        otpField(h, { label: 'Code (wrong)', length: 6, split: 3, value: '402913', error: true, hint: 'That code is not right. Check the newest message.' }) +
        otpField(h, { label: 'Code (disabled)', length: 6, split: 3, value: '402', disabled: true, hint: 'Wait 30 seconds before you try again.' }) +
        '</div>') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Left</kbd> and <kbd class="ds-kbd">Right</kbd> move between cells, <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd> to the ends; <kbd class="ds-kbd">Backspace</kbd> in an empty cell clears the one before.</p>');
  },

  wire: function (root, h) {
    var form = h.$('[data-demo="verify"]', root);
    if (!form) return;
    var group = h.$('.ds-otp', form);
    var hint = h.$('.ds-field__hint', form);
    var text = hint.textContent;
    var reset = function () {
      group.removeAttribute('aria-invalid');
      hint.className = 'ds-field__hint';
      hint.textContent = text;
    };
    form.addEventListener('ds:change', function () { if (group.hasAttribute('aria-invalid')) reset(); });
    form.addEventListener('reset', reset);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var code = DS.core.get(group, 'otp');
      var value = code ? code.get() : '';
      if (value === '123456') {
        reset();
        h.toast('Verified (demo).', 'success');
        return;
      }
      group.setAttribute('aria-invalid', 'true');
      hint.className = 'ds-field__hint ds-field__hint--error';
      hint.innerHTML = h.icon('alertCircle', 16) + (value.length < 6 ? 'Enter all six digits.' : 'That code is not right. Try 123456.');
    });
  },
});
