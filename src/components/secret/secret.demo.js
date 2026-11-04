/*
 * The Secret field demo: a stored key, one not set yet, every state, and the
 * action the server reads. Registered through SG.demo() (styleguide/sg-core.js).
 * Size, density, shape and touch come from the options panel; no tone.
 */
function secretField(h, o) {
  var id = h.uid('secret');
  var hint = o.hint ? h.uid('secret-hint') : '';
  return '<div class="ds-field ds-secret" data-ds-secret="' + (o.stored ? 'set' : '') + '"' + (o.demo ? ' data-demo="' + o.demo + '"' : '') + '>' +
    '<label class="ds-field__label" for="' + id + '">' + o.label + '</label>' +
    '<div class="ds-secret__stored"><span class="ds-secret__mask" aria-hidden="true">••••••••</span><span class="ds-secret__status"></span>' +
    '<span class="ds-secret__actions"><button class="ds-btn ds-btn--text ds-secret__replace" type="button">Replace</button>' +
    '<button class="ds-btn ds-btn--text ds-secret__clear" type="button">Clear</button>' +
    '<button class="ds-btn ds-btn--text ds-secret__undo" type="button">Undo</button></span></div>' +
    '<div class="ds-secret__entry"><div class="ds-input-group"><input class="ds-input" id="' + id + '" name="' + o.name + '" type="password" autocomplete="off" spellcheck="false"' + (hint ? ' aria-describedby="' + hint + '"' : '') + '></div>' +
    '<button class="ds-btn ds-btn--text ds-secret__cancel" type="button">Cancel</button></div>' +
    '<input type="hidden" name="' + o.name + '_action" data-ds-secret-action>' +
    (hint ? '<small class="ds-field__hint" id="' + hint + '">' + o.hint + '</small>' : '') + '</div>';
}

SG.demo('secret', {
  title: 'Secret field',
  group: 'forms',
  need: 'Keep a stored secret (an API key, a token): show that it is set without the value, replace or clear it',
  lead: 'The server keeps the value and never sends it back: the field says it is set, and offers to replace or clear it. A hidden input tells the server what to do on save.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('A stored key and one not set yet', '<form class="ds-form" data-demo="form"><div class="ds-form-grid ds-form-grid--2">' +
        secretField(h, { label: 'API key', name: 'api_key', stored: true, hint: 'Used by the inventory sync.', demo: 'key' }) +
        secretField(h, { label: 'Mail server password', name: 'smtp_password', hint: 'For the alert mails.' }) +
        '</div><div class="ds-form-actions"><button class="ds-btn ds-btn--filled" type="submit">Save</button><button class="ds-btn ds-btn--text" type="reset">Discard</button>' +
        '<p class="ds-meta" data-demo="actions" aria-live="off">The server would get: api_key_action=keep, smtp_password_action=keep</p></div></form>',
      'Replace, then type a key or press Escape; Clear, then Undo. The line under the buttons is what a submit would post.') +

      h.section('Every state', '<div class="ds-form-grid ds-form-grid--2" data-demo="states">' +
        secretField(h, { label: 'Webhook token (set)', name: 'w1', stored: true }) +
        secretField(h, { label: 'Webhook token (replace)', name: 'w2', stored: true }) +
        secretField(h, { label: 'Webhook token (clear)', name: 'w3', stored: true }) +
        secretField(h, { label: 'Webhook token (empty)', name: 'w4' }) +
        '</div>') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches Replace and Clear; <kbd class="ds-kbd">Enter</kbd> on Replace moves into the field, <kbd class="ds-kbd">Escape</kbd> there cancels. Each change is announced with the status words.</p>');
  },

  wire: function (root, h) {
    var states = h.$$('[data-demo="states"] .ds-secret', root);
    // DS.init's observer attaches the controllers in a microtask after the markup went in.
    if (states.length) {
      Promise.resolve().then(function () {
        var get = function (el) { return DS.core.get(el, 'secret'); };
        if (get(states[1])) get(states[1]).set('replace');
        if (get(states[2])) get(states[2]).set('clear');
      });
    }
    var form = h.$('[data-demo="form"]', root);
    var line = h.$('[data-demo="actions"]', root);
    var show = function () {
      if (!form || !line) return;
      line.textContent = 'The server would get: ' + h.$$('input[data-ds-secret-action]', form).map(function (input) { return input.name + '=' + input.value; }).join(', ');
    };
    if (form) {
      form.addEventListener('ds:change', show);
      form.addEventListener('input', show);
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        show();
        h.toast('Saved (demo): nothing left the page.', 'success');
        h.$$('.ds-secret', form).forEach(function (el) {
          var secret = DS.core.get(el, 'secret');
          var state = secret && secret.get();
          if (state) secret.set(state.action === 'clear' ? 'empty' : state.action === 'set' || state.stored ? 'set' : 'empty');
        });
        show();
      });
    }
    show();
  },
});
