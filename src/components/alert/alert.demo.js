/*
 * The Alert demo: every tone, the three variants, titles and actions, the
 * collapsible errors list, and alerts that come and go through
 * DS.motion.flip. Registered through SG.demo() (styleguide/sg-core.js). Size,
 * density, shape and touch come from the options panel around it; the panel's
 * tone goes on the sample alert itself, since an alert reads only its own.
 */
var TONES = [
  ['', 'info', 'The nightly sync runs at 02:00. Changes made now appear tomorrow.'],
  ['info', 'info', 'A new agent version is available for 12 devices.'],
  ['primary', 'sparkles', 'Bulk edit is on for this list.'],
  ['neutral', 'clock', 'The report covers the last 30 days.'],
  ['success', 'checkCircle', 'All 128 devices are up to date.'],
  ['warning', 'alert', 'The certificate expires in 5 days.'],
  ['error', 'alertCircle', 'Could not reach the directory server.'],
];
var NEWS = ['Synced LAPTOP-0042.', 'Imported 12 devices.', 'TABLET-0121 is back online.', 'Exported the list as CSV.'];

function alertHtml(h, tone, glyph, text, extra) {
  return '<div class="ds-alert' + (tone ? ' ds-tone-' + tone : '') + '"' + (tone === 'error' ? ' role="alert"' : ' role="status"') + '>' + h.icon(glyph, 20) +
    '<span class="ds-alert__text">' + text + '</span>' + (extra || '') + '</div>';
}

function dismiss() {
  return '<button class="ds-btn ds-btn--text ds-sm" type="button" data-demo="dismiss">Dismiss</button>';
}

SG.demo('alert', {
  title: 'Alert',
  group: 'feedback',
  need: 'Tell the user something about a page or a section, in place, with an icon and a word',
  lead: 'A notice on a tonal container, always with an icon and a word. The options panel pads it (size, density) and rounds it (shape); the tone goes on the alert itself.',
  options: { variants: ['plain', 'inline', 'section'], sizes: true, density: true, shape: true, tones: true },

  render: function (h) {
    var sample = h.tone || 'warning';
    var variant = function (name) { return !h.variant || h.variant === name; };
    var serial = h.uid('serial');
    return h.section('Tones', '<div class="ds-stack" data-demo="stack">' + TONES.map(function (row) {
      return alertHtml(h, row[0], row[1], row[2], row[0] === 'warning' ? '<button class="ds-btn ds-btn--text ds-sm" type="button">Renew</button>' : row[0] === 'error' ? '<button class="ds-btn ds-btn--text ds-sm" type="button">Try again</button>' : dismiss());
    }).join('') + '</div>' +
      '<div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="insert">' + h.icon('plus', 16) + 'Insert an alert</button></div>' +
      '<p class="ds-muted">Both through DS.motion.flip on the stack: a dismissed alert fades out in place while the ones below glide up; a new one fades in at the top while the others glide down.</p>') +

      h.section('Titles and actions',
        '<div class="ds-stack"><div class="ds-alert ds-tone-' + sample + '" data-demo="sample">' + h.icon('alert', 20) + '<div class="ds-alert__text"><p class="ds-alert__title">Certificate expires soon</p><p>The server certificate of the directory expires on 1 May.</p><p>Renew it before then, or sign-ins stop.</p></div>' +
        '<div class="ds-alert__actions"><button class="ds-btn ds-btn--text ds-sm" type="button">Renew</button><button class="ds-btn ds-btn--text ds-sm" type="button">Remind me</button></div></div>' +
        '<div class="ds-alert">' + h.icon('info', 20) + '<span class="ds-alert__text"><span class="ds-alert__title">Maintenance tonight</span> The directory is read-only from 22:00 to 23:00.</span></div></div>' +
        '<p class="ds-muted">Narrow the width in the options panel: the actions drop under the text once it has less than its 256px.</p>') +

      (variant('plain') ? h.section('Plain: findings in a card', h.card('Findings',
        '<div class="ds-alert ds-alert--plain ds-tone-error">' + h.icon('alertCircle', 20) + '<span class="ds-alert__text"><strong class="ds-alert__title">Disk almost full</strong> 92% used on drive C.</span></div>' +
        '<div class="ds-alert ds-alert--plain ds-tone-warning">' + h.icon('alert', 20) + '<span class="ds-alert__text">The warranty ends in 30 days.</span></div>' +
        '<div class="ds-alert ds-alert--plain ds-tone-success">' + h.icon('checkCircle', 20) + '<span class="ds-alert__text">The disk is encrypted.</span></div>')) : '') +

      (variant('inline') ? h.section('Inline: under a field or in a row',
        '<div class="ds-field"><label class="ds-field__label" for="' + serial + '">Serial number</label><input class="ds-input" id="' + serial + '" value="CN-0042"></div>' +
        '<p class="ds-alert ds-alert--inline ds-tone-warning">' + h.icon('alert', 16) + '<span class="ds-alert__text">Used by 3 other devices.</span></p> ' +
        '<p class="ds-alert ds-alert--inline ds-tone-success">' + h.icon('check', 16) + '<span class="ds-alert__text">Checked a minute ago.</span></p> ' +
        '<p class="ds-alert ds-alert--inline">' + h.icon('info', 16) + '<span class="ds-alert__text">Printed on the back of the device.</span></p>') : '') +

      (variant('section') ? h.section('Section: a block with its actions',
        '<div class="ds-alert ds-alert--section ds-tone-error" role="alert">' + h.icon('alertCircle', 20) + '<div class="ds-alert__text"><p class="ds-alert__title">The import stopped</p><p>Row 812 has no serial number. Nothing was saved.</p></div>' +
        '<div class="ds-alert__actions"><button class="ds-btn ds-btn--filled" type="button">Open the file</button><button class="ds-btn ds-btn--text" type="button">Discard</button></div></div>') : '') +

      h.section('Errors list',
        '<details class="ds-errors ds-collapsible"><summary>' + h.icon('alertCircle', 16) + '2 rows were skipped' + h.icon('chevronDown', 16, 'ds-errors__chevron') + '</summary><ul><li>Row 4: unknown model "Notebook 99"</li><li>Row 9: duplicate serial number</li></ul></details>') +

      h.section('Keyboard', '<p class="ds-muted">An alert has no stop of its own. <kbd class="ds-kbd">Tab</kbd> reaches its buttons and the errors summary; <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> presses them. The word says the meaning, never the colour alone.</p>');
  },

  wire: function (root, h) {
    var stack = h.$('[data-demo="stack"]', root);
    var count = 0;
    var holder = document.createElement('template');
    root.addEventListener('click', function (event) {
      var button = event.target.closest('[data-demo]');
      if (!button) return;
      var kind = button.getAttribute('data-demo');
      if (kind === 'dismiss') {
        var alert = button.closest('.ds-alert');
        DS.motion.flip(stack, function () { alert.remove(); });
      }
      if (kind === 'insert') {
        holder.innerHTML = alertHtml(h, 'success', 'checkCircle', NEWS[count % NEWS.length], dismiss());
        count += 1;
        var fresh = holder.content.firstChild;
        var shown = h.$$(':scope > .ds-alert:not([data-ds-leaving])', stack);
        var oldest = shown.length >= 8 ? shown[shown.length - 1] : null;
        DS.motion.flip(stack, function () {
          if (oldest) oldest.remove();
          stack.prepend(fresh);
        });
      }
    });
  },
});
