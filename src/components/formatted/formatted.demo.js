/*
 * The Formatted values demo: every kind with its options, the tip with the
 * exact value, relative times that tick, a locale switch, a value that a
 * re-render changes, and a table column. Registered through SG.demo()
 * (styleguide/sg-core.js). No options apply: a value takes the type of
 * where it stands.
 */
var FORMAT_ROWS = [
  ['number', '1234.5678', '', 'A number'],
  ['number', '1234.5678', ' data-ds-format-digits="1"', 'One fraction digit'],
  ['compact', '1284902', '', 'A count in short form'],
  ['compact', '1284902', ' data-ds-format-style="long"', 'Long form'],
  ['percent', '0.4213', '', 'A share'],
  ['percent', '0.042', ' data-ds-format-signed', 'A delta, signed'],
  ['currency', '1234.5', ' data-ds-format-currency="EUR"', 'Money'],
  ['bytes', '1536000', '', 'Bytes'],
  ['bytes', '1536000', ' data-ds-format-base="1024"', 'Binary bytes'],
  ['duration', '3725000', '', 'A duration'],
  ['duration', '3725000', ' data-ds-format-style="clock"', 'On a clock']
];

SG.demo('formatted', {
  title: 'Formatted values',
  group: 'data',
  need: 'Show a number, bytes, a duration, money, a percentage or a relative time in the page\'s locale',
  lead: 'Figures and times in the page\'s locale through Intl. The raw value stays in the markup; where the text rounds it, the exact value shows in a tooltip, marked by a dotted underline.',
  options: { sizes: false, density: false, shape: false, tones: false },

  render: function (h) {
    var now = Date.now();
    var iso = function (offset) { return new Date(now - offset).toISOString(); };
    return h.section('Kinds', '<div class="ds-card"><table class="ds-table" data-demo="kinds"><thead><tr><th scope="col">What</th><th scope="col">Markup</th><th scope="col" class="ds-num">Shows</th></tr></thead><tbody>' +
        FORMAT_ROWS.map(function (row) {
          return '<tr><td>' + row[3] + '</td><td><code>' + h.esc('data-ds-format="' + row[0] + '"' + row[2]) + ', ' + row[1] + '</code></td><td class="ds-num"><span data-ds-format="' + row[0] + '"' + row[2] + ' tabindex="0">' + row[1] + '</span></td></tr>';
        }).join('') + '</tbody></table></div>', 'Hover or focus a dotted value for its exact figure. Each one here has tabindex="0" so the keyboard reaches its tip.') +
      h.section('Relative time', '<div class="ds-card"><ul class="ds-list" aria-label="Recent activity" data-demo="times">' +
          [['Ada Lovelace closed ticket 4,127', 20000], ['Laptop 0042 checked in', 4 * 60000], ['Printer 7 went offline', 3 * 3600000], ['Backup finished', 26 * 3600000]].map(function (row) {
            return '<li class="ds-list__item"><span class="ds-list__text"><span class="ds-list__title">' + row[0] + '</span></span><time class="ds-list__meta" data-ds-time datetime="' + iso(row[1]) + '" tabindex="0">' + iso(row[1]).slice(0, 16).replace('T', ' ') + '</time></li>';
          }).join('') + '</ul></div>', 'One clock for the whole page ticks every time; the absolute date is in each tooltip.') +
      h.section('Locale and live values', '<div class="ds-card"><p>Storage: <span data-ds-format="bytes" data-ds-value="734003200" data-demo="live" tabindex="0"></span>, budget <span data-ds-format="currency" data-ds-format-currency="EUR" data-ds-value="1234.5"></span>, uptime <span data-ds-format="percent" data-ds-format-digits="2" data-ds-value="0.99871"></span>, updated <time data-ds-time data-ds-time-style="short" datetime="' + iso(90000) + '"></time>.</p>' +
        '<div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="more">' + h.icon('plus', 16) + 'Add 50 MB</button>' +
        '<button class="ds-btn ds-btn--text ds-sm" type="button" data-demo="locale" aria-pressed="false">German locale</button></div></div>',
        'A new value is formatted at once; a new locale rewrites every value and time on the page.') +
      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches a value only where the page made it a stop (tabindex="0"); its tip then shows with the exact figure, <kbd class="ds-kbd">Esc</kbd> hides it.</p>');
  },

  wire: function (root, h) {
    var live = h.$('[data-demo="live"]', root);
    var onClick = function (event) {
      if (event.target.closest('[data-demo="more"]')) {
        window.DS.get(live, 'formatted').set(Number(live.getAttribute('data-ds-value')) + 52428800);
        return;
      }
      var button = event.target.closest('[data-demo="locale"]');
      if (!button) return;
      var german = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(german));
      window.DS.config({ locale: german ? 'de-DE' : null });
    };
    root.addEventListener('click', onClick);
    return function () {
      root.removeEventListener('click', onClick);
      window.DS.config({ locale: null });
    };
  }
});
