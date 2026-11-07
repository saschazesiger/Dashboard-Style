/*
 * The Key-value editor demo: environment variables with a secret and a
 * duplicate, labels without the monospace look, paste, the object it
 * exports, and a disabled editor. Registered through SG.demo()
 * (styleguide/sg-core.js). Size, density, shape and touch come from the
 * options panel around it. Showing the object is the page's; rows, paste,
 * warnings and secrets are DS.kveditor.
 */
function kvEditor(h, legend, value, extra, add) {
  return '<fieldset class="ds-kveditor' + (extra.code ? ' ds-kveditor--code' : '') + '" data-ds-kveditor' +
    (extra.secret ? ' data-ds-kveditor-secret="' + extra.secret + '"' : '') + (extra.disabled ? ' disabled' : '') +
    (extra.demo ? ' data-demo="' + extra.demo + '"' : '') + ' data-ds-value="' + h.esc(JSON.stringify(value)) + '">' +
    '<legend class="ds-fieldset__legend">' + legend + '</legend>' +
    '<div class="ds-kveditor__head" aria-hidden="true"><span>Key</span><span>Value</span></div>' +
    '<ul class="ds-kveditor__rows"></ul>' +
    '<div class="ds-kveditor__foot"><button class="ds-btn ds-btn--text ds-kveditor__add" type="button">' + h.icon('plus', 18) + add + '</button></div></fieldset>';
}

SG.demo('kveditor', {
  title: 'Key-value editor',
  group: 'forms',
  need: 'Edit pairs of a key and a value (environment variables, labels, headers): paste KEY=value lines, duplicates warned, secrets hidden',
  lead: 'Rows of a key and a value. Paste KEY=value lines into a key to fill several rows at once; a key that comes twice is warned about in words; secret values stay hidden until revealed.',
  options: { variants: ['code', 'plain'], sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var env = h.section('Environment variables', kvEditor(h, 'Environment variables', [
        { key: 'API_URL', value: 'https://api.example.test' },
        { key: 'API_TOKEN', value: 'tok_51d8a0e7c2' },
        { key: 'LOG_LEVEL', value: 'info' },
        { key: 'API_URL', value: 'https://staging.example.test' },
      ], { code: true, secret: 'TOKEN|SECRET|PASSWORD|KEY$', demo: 'env' }, 'Add variable') +
      '<p class="ds-muted">The object it exports:</p><pre class="ds-code-block ds-code-block--wrap" data-demo="out"></pre>',
      'API_TOKEN is secret by its name: its value is masked until revealed. API_URL comes twice: both rows say so, and the last one counts. Paste lines such as <code>DB_HOST=db.local</code> into an empty key.');
    var labels = h.section('Labels', kvEditor(h, 'Device labels', { building: 'North', floor: '2', owner: 'Ada Lovelace' }, {}, 'Add label'),
      'Without --code: the body font, for words rather than names.');
    if (h.variant === 'code') return env;
    if (h.variant === 'plain') return labels;
    return env + labels +
      h.section('Narrow', '<div style="max-inline-size: 360px;">' + kvEditor(h, 'Headers', [{ key: 'Accept', value: 'application/json' }, { key: 'X-Request-Source', value: 'console' }], { code: true }, 'Add header') + '</div>',
        'Under 480px of the editor the key and Remove share a line and the value goes under them.') +
      h.section('Disabled', kvEditor(h, 'Locked variables', { REGION: 'eu-central', REPLICAS: '3' }, { code: true, disabled: true }, 'Add variable'),
        'A disabled fieldset disables every field and button at once.') +
      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> goes through each row\'s key, value, reveal and Remove. <kbd class="ds-kbd">Enter</kbd> in a key goes to its value; in a value it goes to the next row, or adds one after the last. Removing a row moves focus to the next one.</p>');
  },

  wire: function (root, h) {
    var env = h.$('[data-demo="env"]', root);
    var out = h.$('[data-demo="out"]', root);
    if (!env || !out) return;
    var show = function (value) { out.textContent = JSON.stringify(value, null, 2); };
    env.addEventListener('ds:change', function (event) { show(event.detail.value); });
    DS.init(root);
    show(DS.get(env, 'kveditor').toObject());
  },
});
