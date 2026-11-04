/*
 * The Password demo: choosing a password with the meter, signing in with the
 * reveal and the caps-lock hint, the states and a policy of the page's own.
 * Registered through SG.demo() (styleguide/sg-core.js). Size, density, shape
 * and touch come from the options panel; a field has no tone.
 */
function passwordField(h, o) {
  var id = h.uid('pw');
  var meter = h.uid('pw-meter');
  var caps = h.uid('pw-caps');
  var hint = o.hint ? h.uid('pw-hint') : '';
  var described = [o.meter ? meter : '', caps, hint].filter(Boolean).join(' ');
  return '<div class="ds-field"' + (o.manual ? '' : ' data-ds-password') + (o.demo ? ' data-demo="' + o.demo + '"' : '') + '>' +
    '<label class="ds-field__label" for="' + id + '">' + o.label + '</label>' +
    '<div class="ds-input-group"><input class="ds-input" id="' + id + '" type="password" autocomplete="' + (o.autocomplete || 'new-password') + '"' +
    (o.minlength ? ' minlength="' + o.minlength + '"' : '') + ' value="' + h.esc(o.value || '') + '" aria-describedby="' + described + '"' + (o.extra || '') + '>' +
    '<span class="ds-input-group__trailing"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Show password" aria-pressed="false"' + (o.extra && /disabled/.test(o.extra) ? ' disabled' : '') + '>' +
    '<span class="ds-icon-swap"><span class="ds-icon-swap__a">' + h.icon('eye', 18) + '</span><span class="ds-icon-swap__b">' + h.icon('eyeOff', 18) + '</span></span></button></span></div>' +
    (o.meter ? '<div class="ds-password__meter" id="' + meter + '"><span class="ds-password__bars" aria-hidden="true"><span></span><span></span><span></span><span></span></span><span class="ds-password__strength"></span></div>' : '') +
    (hint ? '<small class="ds-field__hint' + (o.error ? ' ds-field__hint--error' : '') + '" id="' + hint + '">' + (o.error ? h.icon('alertCircle', 16) : '') + o.hint + '</small>' : '') +
    '<small class="ds-field__hint ds-field__hint--warning ds-password__caps" id="' + caps + '" hidden>' + h.icon('alert', 16) + 'Caps Lock is on.</small></div>';
}

SG.demo('password', {
  title: 'Password',
  group: 'forms',
  need: 'Enter or choose a password: show it, see how strong it is, notice Caps Lock',
  lead: 'A password field with a reveal button, a strength meter in words and a hint when Caps Lock is on. Each part is optional: signing in needs no meter.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Choose a password', '<div class="ds-form-grid ds-form-grid--2">' +
        passwordField(h, { label: 'New password', meter: true, minlength: 12, hint: 'At least 12 characters.', demo: 'new' }) +
        '<div class="ds-stack" data-demo="levels">' +
        ['abc', 'devices42', 'Tr0ub4dor&3', 'correct horse battery staple'].map(function (value, index) {
          return passwordField(h, { label: 'Level ' + (index + 1), meter: true, value: value, autocomplete: 'off' });
        }).join('') + '</div></div>',
      'Type to see the meter: one to four bars and the level in words. Too short or a common password is weak.') +

      h.section('Sign in', '<div class="ds-form-grid ds-form-grid--2">' +
        passwordField(h, { label: 'Password', autocomplete: 'current-password', value: 'ex_7f3a9c21', demo: 'signin' }) +
        '<p class="ds-muted">Turn Caps Lock on while the field has the focus: the warning shows and is announced. The reveal keeps the caret where it was and hides the password again on submit.</p></div>') +

      h.section('States', '<div class="ds-form-grid ds-form-grid--2">' +
        passwordField(h, { label: 'Current password', autocomplete: 'current-password', value: 'wrong-guess', extra: ' aria-invalid="true"', error: true, hint: 'That password is not right.' }) +
        passwordField(h, { label: 'Device PIN', autocomplete: 'off', value: '2024', extra: ' disabled', hint: 'Disabled: the device is locked by policy.' }) +
        '</div>') +

      h.section('A scoring of the page\'s own', '<div class="ds-form-grid ds-form-grid--2">' +
        passwordField(h, { label: 'Admin password', meter: true, manual: true, demo: 'policy', hint: 'Needs 16 characters, a digit and a symbol.' }) +
        '<p class="ds-muted">DS.password.create(field, { score }) replaces the built-in score with the page\'s policy or a dictionary-based estimator.</p></div>') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> goes from the field to the reveal button; <kbd class="ds-kbd">Space</kbd> or <kbd class="ds-kbd">Enter</kbd> on it shows or hides the password. The level and the caps-lock warning are read with the field.</p>');
  },

  wire: function (root, h) {
    var policy = h.$('[data-demo="policy"]', root);
    if (!policy) return;
    var made = DS.password.create(policy, {
      score: function (value) {
        var checks = [value.length >= 16, /\d/.test(value), /[^\w\s]/.test(value)].filter(Boolean).length;
        return value.length < 8 ? 1 : 1 + checks;
      },
    });
    return function () { made.destroy(); };
  },
});
