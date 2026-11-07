/*
 * The Copy demo: a key in the field look, values inline, a labelled button
 * with a value of its own, the fallback without the Clipboard API, and the
 * blocked state. Registered through SG.demo() (styleguide/sg-core.js). Size,
 * density, shape and touch come from the options panel around the demo.
 */
function copySwap(h, size) {
  return '<span class="ds-icon-swap"><span class="ds-icon-swap__a">' + h.icon('copy', size) + '</span><span class="ds-icon-swap__b">' + h.icon('check', size) + '</span></span>';
}

function copyFaces(h, icon, label) {
  return '<span class="ds-btn__faces"><span class="ds-btn__face">' + h.icon(icon, 16) + label + '</span>' +
    '<span class="ds-btn__face ds-btn__face--done" aria-hidden="true">' + h.icon('check', 16) + '<span class="ds-copy__done"></span></span></span>';
}

SG.demo('copy', {
  title: 'Copy button',
  group: 'actions',
  need: 'Copy a value, a key or a link with one press, and say that it worked',
  lead: 'One press copies; the button shows the check for a moment and screen readers hear "Copied". Where the browser refuses, the text is selected and a hint says how to copy it by hand.',
  options: { variants: ['field', 'inline', 'labelled'], sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var show = function (name) { return !h.variant || h.variant === name; };
    var key = h.uid('key');
    var token = h.uid('token');
    var out = '';
    if (show('field')) {
      out += h.section('A key in the field look', '<div class="ds-form" style="max-inline-size: 420px">' +
        '<div class="ds-field" role="group" aria-labelledby="' + key + '-l"><span class="ds-field__label" id="' + key + '-l">API key</span>' +
        '<span class="ds-copy ds-copy--field" data-demo="field"><code class="ds-copy__value" id="' + key + '">ak_live_7f3a9c2e51b04d88a6</code>' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Copy the API key" data-tip="Copy the API key" data-ds-copy="#' + key + '">' + copySwap(h, 20) + '</button></span></div>' +
        '<div class="ds-field"><label class="ds-field__label" for="' + token + '">Enrolment link</label>' +
        '<span class="ds-copy ds-copy--field"><input class="ds-copy__value" id="' + token + '" value="https://example.com/devices/42/enrol" readonly>' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Copy the enrolment link" data-tip="Copy the enrolment link" data-ds-copy="#' + token + '">' + copySwap(h, 20) + '</button></span></div></div>',
        'data-ds-copy names the source: a field copies its value, any other element its text.');
    }
    if (show('inline')) {
      out += h.section('Inline values', '<dl class="ds-facts" data-demo="inline">' +
        '<div><dt>Serial number</dt><dd><span class="ds-copy"><code class="ds-copy__value">LAPTOP-0042</code>' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-xs" type="button" aria-label="Copy the serial number" data-tip="Copy the serial number" data-ds-copy>' + copySwap(h, 16) + '</button></span></dd></div>' +
        '<div><dt>Ticket</dt><dd><span class="ds-copy"><code class="ds-copy__value">T-4127</code>' +
        '<button class="ds-btn ds-btn--quiet ds-btn--icon ds-xs" type="button" aria-label="Copy the ticket number" data-tip="Copy the ticket number" data-ds-copy>' + copySwap(h, 16) + '</button></span></dd></div></dl>',
        'An empty data-ds-copy copies the .ds-copy__value beside the button.');
    }
    if (show('labelled')) {
      out += h.section('Labelled', '<div class="sg-row" data-demo="labelled">' +
        '<button class="ds-btn" type="button" data-ds-copy data-ds-copy-value="https://example.com/tickets/4127">' + copyFaces(h, 'link', 'Copy link') + '</button>' +
        '<button class="ds-btn ds-btn--tonal" type="button" data-ds-copy data-ds-copy-value="Ada Lovelace &lt;ada@example.com&gt;">' + copyFaces(h, 'mail', 'Copy address') + '</button>' +
        '</div>', 'data-ds-copy-value holds the text. The done face says "Copied" from the strings, its check draws itself.');
    }
    if (!h.variant) {
      out += h.section('States', '<div class="sg-row">' +
        '<button class="ds-btn" type="button" aria-disabled="true" data-tip="Only an owner can copy the key" data-ds-copy data-ds-copy-value="secret">' + copyFaces(h, 'copy', 'Copy key') + '</button>' +
        '</div><p class="ds-meta" data-demo="log" aria-hidden="true">ds:copy: nothing copied yet</p>',
        'aria-disabled never copies; its tooltip says why. Where the browser refuses both ways of copying, the source text is selected and the announcer says how to copy it by hand.');
      out += h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches each copy button; <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> copies. The announcement says "Copied".</p>');
    }
    return out;
  },

  wire: function (root, h) {
    var log = h.$('[data-demo="log"]', root);
    root.addEventListener('ds:copy', function (event) {
      if (log) log.textContent = 'ds:copy: ' + (event.detail.ok ? 'copied through ' + event.detail.method : 'refused, the text is selected');
    });
  },
});
