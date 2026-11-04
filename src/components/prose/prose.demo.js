/*
 * The Prose and code demo: rendered text with every bare element, task
 * lists, callouts in each tone, footnotes, the dense and the compact mode,
 * and code blocks. Density and shape come from the options panel around it;
 * the panel's tone goes on the first callout. Nothing to wire: a Markdown
 * renderer writes this markup.
 */
var CALLOUTS = [
  ['info', 'info', 'Note', 'The nightly sync runs at 02:00.'],
  ['success', 'check', 'Tip', 'A manual run starts at once.'],
  ['warning', 'alert', 'Warning', 'Retiring a device erases it.'],
  ['error', 'alertCircle', 'Danger', 'A retired device cannot be restored.'],
];

function article(h) {
  return '<h2>Before you start</h2>' +
    '<p>Back up the device and note its <strong>asset tag</strong>. See <a href="#prose-demo">backups</a>, or run <code>ds-cli backup</code>.<sup><a href="#prose-demo">1</a></sup></p>' +
    '<h3>What to bring</h3>' +
    '<ul><li>Charger</li><li>Docking station<ul><li>With its power cable</li></ul></li></ul>' +
    '<ol><li>Sign out</li><li>Hand it in</li></ol>' +
    '<blockquote><p>Devices older than four years are retired, not repaired.</p></blockquote>' +
    '<pre><code>ds-cli retire LAPTOP-0042</code></pre>' +
    '<table><thead><tr><th>Model</th><th>Years</th></tr></thead><tbody><tr><td>Latitude 7440</td><td>4</td></tr><tr><td>ThinkPad T14</td><td>3</td></tr></tbody></table>' +
    '<hr><p>Ask <mark>IT support</mark> when in doubt.</p>';
}

function tasks() {
  return '<ul>' +
    '<li><label><input type="checkbox" disabled checked> Charger packed</label></li>' +
    '<li><input type="checkbox" disabled aria-label="Label printed"> Label printed, with a long line that wraps under the text and stays in line with it, never under the checkbox</li>' +
    '<li><p><input type="checkbox" disabled checked aria-label="Backup made"> Backup made: the form a loose list renders</p></li>' +
    '<li>An item with no checkbox keeps its bullet</li>' +
    '</ul>';
}

function callout(h, entry, tone) {
  return '<div class="ds-prose__callout ds-tone-' + (tone || entry[0]) + '" role="note"><p class="ds-prose__callout-title">' + h.icon(entry[1], 16) + entry[2] + '</p><p>' + entry[3] + ' <a href="#prose-demo">Read more</a>.</p></div>';
}

SG.demo('prose', {
  title: 'Prose and code',
  group: 'content',
  need: 'Show rendered rich text and blocks of code, with task lists, callouts and a compact mode for chat',
  lead: 'Text the page does not mark up itself: a Markdown renderer writes bare elements, and the system styles them. A class of the page always wins, and a component inside prose keeps its look.',
  options: { sizes: false, density: true, shape: true, tones: ['info', 'success', 'warning', 'error'], variants: ['reading', 'dense', 'compact'] },

  render: function (h) {
    var mode = h.variant && h.variant !== 'reading' ? ' ds-prose--' + h.variant : '';
    return h.section('Rendered text', '<div class="ds-prose' + mode + '" data-demo="article">' + article(h) + '</div>') +

      h.section('Task list', '<div class="ds-prose' + mode + '" data-demo="tasks">' + tasks() + '</div>',
        'The bare markup of a Markdown renderer: the checkbox stands where the bullet stood.') +

      h.section('Callouts', '<div class="ds-prose' + mode + '" data-demo="callouts">' + CALLOUTS.map(function (entry, index) {
        return callout(h, entry, index === 0 && h.tone ? h.tone : null);
      }).join('') + '<div class="ds-prose__callout" role="note"><p class="ds-prose__callout-title">' + h.icon('info', 16) + 'Note</p><p>With no tone: the surface of a quote.</p></div></div>',
        'A word and an icon say what it is; the tone only colours it.') +

      h.section('Footnotes', '<div class="ds-prose' + mode + '" data-demo="footnotes"><p>Devices are retired after four years.<sup><a href="#prose-demo">1</a></sup></p><section class="ds-prose__footnotes"><ol><li>The policy of the IT department.</li></ol></section></div>') +

      h.section('Compact, for chat', '<div class="ds-card ds-card--filled" style="max-inline-size:360px"><div class="ds-prose ds-prose--compact" data-demo="compact"><h2>Three devices are overdue</h2><p>I checked the list. <strong>LAPTOP-0042</strong> is the oldest:</p><ul><li>Issued to Ada Lovelace</li><li>Last seen today</li></ul><pre><code>ds-cli remind LAPTOP-0042</code></pre><div class="ds-prose__callout ds-tone-info" role="note"><p class="ds-prose__callout-title">' + h.icon('info', 16) + 'Note</p><p>Reminders go out at 09:00.</p></div></div></div>',
        'The body role, one heading size and tight blocks: at home in a bubble or a narrow panel.') +

      h.section('Code blocks', '<div class="ds-stack" data-demo="code"><pre class="ds-code-block" tabindex="0" aria-label="Request"><code>GET /api/devices/42 HTTP/1.1\nAccept: application/json\nX-Request-Id: 0f8c2a7e-6b1d-4d3a-9e77-1c5a2b9f4d10-0f8c2a7e-6b1d-4d3a-9e77-1c5a2b9f4d10</code></pre>' +
        '<pre class="ds-code-block ds-code-block--wrap"><code>X-Request-Id: 0f8c2a7e-6b1d-4d3a-9e77-1c5a2b9f4d10-0f8c2a7e-6b1d-4d3a-9e77-1c5a2b9f4d10-0f8c2a7e-6b1d-4d3a-9e77-1c5a2b9f4d10</code></pre></div>',
        'A block that can scroll takes <code>tabindex="0"</code> and a name, so a keyboard reaches it; <code>--wrap</code> wraps long lines instead.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches links and a code block that can scroll; the arrow keys scroll it.</p>');
  },

  wire: function (root) {
    root.addEventListener('click', function (event) {
      if (event.target.closest('a[href="#prose-demo"]')) event.preventDefault();
    });
  },
});
