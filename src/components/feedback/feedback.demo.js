/*
 * The Feedback demo: thumbs on a reply, with the reason dialog for a
 * thumb down, a locked choice and a stored one. Registered through
 * SG.demo() (styleguide/sg-core.js). What the page does with the feedback
 * (here: a line under the demo) is in wire.
 */
var FB_REASONS = [['wrong', 'Not correct'], ['incomplete', 'Incomplete'], ['unclear', 'Hard to follow'], ['other', 'Something else']];

function fbPair(h, attrs, pressed) {
  var button = function (value, label, glyph) {
    return '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-pressed="' + (pressed === value) + '" aria-label="' + label + '" data-tip="' + label + '" data-ds-feedback-value="' + value + '">' + h.icon(glyph, 18, 'ds-icon--fillable') + '</button>';
  };
  return '<div class="ds-feedback" role="group" aria-label="Rate this answer" data-ds-feedback ' + (attrs || '') + '>' +
    '<span class="ds-feedback__label" aria-hidden="true">Helpful?</span>' +
    button('up', 'Helpful', 'thumbUp') + button('down', 'Not helpful', 'thumbDown') +
    '<span class="ds-feedback__status"></span></div>';
}

function fbDialog(h, id) {
  var title = h.uid('reason-title');
  var comment = h.uid('reason-comment');
  return '<dialog class="ds-dialog" id="' + id + '" aria-labelledby="' + title + '">' +
    '<div class="ds-dialog__backdrop" data-ds-close></div>' +
    '<form class="ds-dialog__box">' +
    '<h2 class="ds-dialog__title" id="' + title + '">What went wrong?</h2>' +
    '<div class="ds-dialog__body"><div class="ds-stack">' +
    '<fieldset class="ds-chips"><legend class="ds-sr">Reasons</legend>' +
    FB_REASONS.map(function (row) {
      return '<label class="ds-chip"><input class="ds-chip__input" type="checkbox" name="reason" value="' + row[0] + '">' +
        '<span class="ds-chip__body">' + h.icon('check', 18, 'ds-chip__check') + '<span>' + row[1] + '</span></span></label>';
    }).join('') + '</fieldset>' +
    '<div class="ds-field"><label class="ds-field__label" for="' + comment + '">Anything else? (optional)</label>' +
    '<textarea class="ds-input ds-input--grow" id="' + comment + '" name="comment" rows="2"></textarea></div>' +
    '</div></div>' +
    '<div class="ds-dialog__actions"><button class="ds-btn ds-btn--text" type="button" data-ds-close>Skip</button>' +
    '<button class="ds-btn ds-btn--filled" type="submit">Send feedback</button></div>' +
    '</form></dialog>';
}

SG.demo('feedback', {
  title: 'Feedback',
  group: 'feedback',
  need: 'Rate a reply: thumbs up or down, with an optional dialog that asks why',
  lead: 'Two toggles whose thumb fills while pressed. A thumb down asks why in a dialog; skipping it still counts.',
  options: { variants: false, sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var dialog = h.uid('reason');
    return h.section('With a reason dialog', fbPair(h, 'data-ds-feedback-reason="' + dialog + '" data-demo="main"') + fbDialog(h, dialog) +
        '<p class="ds-muted" data-demo="log"></p>', 'Press the thumb down: the dialog asks why, with its form taken by the module.') +
      h.section('States', '<div class="ds-stack">' +
        '<div class="sg-row"><span class="ds-muted">Plain:</span>' + fbPair(h, '') + '</div>' +
        '<div class="sg-row"><span class="ds-muted">Once only:</span>' + fbPair(h, 'data-ds-feedback-lock') + '</div>' +
        '<div class="sg-row"><span class="ds-muted">Given before:</span>' + fbPair(h, '', 'up') + '</div>' +
        '</div>', 'Once only: the choice locks after the first press. Given before: a stored choice shows pressed.') +
      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches each thumb; <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> presses it. In the dialog <kbd class="ds-kbd">Esc</kbd> skips and the focus returns to the thumb.</p>');
  },

  wire: function (root, h) {
    var log = h.$('[data-demo="log"]', root);
    var main = h.$('[data-demo="main"]', root);
    if (!main || !log) return function () {};
    main.addEventListener('ds:feedback', function (event) {
      var d = event.detail;
      log.textContent = 'Feedback: ' + d.value + (d.reasons.length ? ', because ' + d.reasons.join(', ') : '') + (d.comment ? ' ("' + d.comment + '")' : '') + '.';
    });
    return function () {};
  },
});
