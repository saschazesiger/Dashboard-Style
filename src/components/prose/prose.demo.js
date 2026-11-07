/*
 * The Prose and code demo: rendered text with every bare element, task
 * lists, callouts in each tone, footnotes with their links, heading
 * anchors, inline code, kbd and mark, the dense and the compact mode, and
 * code blocks. Density and shape come from the options panel around it;
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
    '<table><thead><tr><th>Model</th><th>Years</th></tr></thead><tbody><tr><td>Laptop 14</td><td>4</td></tr><tr><td>Laptop 16</td><td>3</td></tr></tbody></table>' +
    '<hr><p>Ask <mark>IT support</mark> when in doubt.</p>';
}

function anchored(h, level, text) {
  var id = h.uid('heading');
  return '<' + level + ' id="' + id + '"><a class="ds-prose__anchor" href="#' + id + '">' + text + h.icon('link', 16) + '</a></' + level + '>';
}

function footnotes(h, mode) {
  var label = h.uid('notes');
  var note = h.uid('note');
  var ref = h.uid('ref');
  var note2 = h.uid('note');
  var ref2 = h.uid('ref');
  return '<div class="ds-prose' + mode + '" data-demo="footnotes"><p>Devices are retired after four years.<sup class="ds-prose__fnref"><a href="#' + note + '" id="' + ref + '" aria-describedby="' + label + '">1</a></sup> A backup comes first.<sup class="ds-prose__fnref"><a href="#' + note2 + '" id="' + ref2 + '" aria-describedby="' + label + '">2</a></sup></p>' +
    '<section class="ds-prose__footnotes" aria-labelledby="' + label + '"><h2 class="ds-sr" id="' + label + '">Footnotes</h2><ol>' +
    '<li id="' + note + '"><p>The policy of the IT department. <a class="ds-prose__fnback" href="#' + ref + '" aria-label="Back to reference 1">' + h.icon('cornerUpLeft', 16) + '</a></p></li>' +
    '<li id="' + note2 + '"><p>Kept for 90 days. <a class="ds-prose__fnback" href="#' + ref2 + '" aria-label="Back to reference 2">' + h.icon('cornerUpLeft', 16) + '</a></p></li></ol></section></div>';
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
  need: 'Show rendered rich text, with task lists, callouts, footnotes, heading anchors and a compact mode for chat',
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

      h.section('Footnotes', footnotes(h, mode),
        'A small figure links to its note, which links back; the note jumped to takes the tint.') +

      h.section('Heading anchors', '<div class="ds-prose' + mode + '" data-demo="anchors">' + anchored(h, 'h2', 'Before you start') + '<p>The heading\'s text links to itself: hover it, or reach it with Tab, and the link icon shows.</p>' + anchored(h, 'h3', 'What to bring') + '<p>Its name stays the heading\'s text.</p></div>') +

      h.section('Inline code, keys and marks', '<div class="ds-prose' + mode + '" data-demo="inline"><p>Run <code>ds-cli backup</code>, then press <kbd>Ctrl</kbd> + <kbd>K</kbd> and search for <mark>LAPTOP-0042</mark>.</p></div>',
        'Bare code, kbd and mark in prose: a chip in the text\'s size, a key, the tint.') +

      h.section('Compact, for chat', '<div class="ds-card ds-card--filled" style="max-inline-size:360px"><div class="ds-prose ds-prose--compact" data-demo="compact"><h2>Three devices are overdue</h2><p>I checked the list. <strong>LAPTOP-0042</strong> is the oldest:</p><ul><li>Issued to Ada Lovelace</li><li>Last seen today</li></ul><pre><code>ds-cli remind LAPTOP-0042</code></pre><div class="ds-prose__callout ds-tone-info" role="note"><p class="ds-prose__callout-title">' + h.icon('info', 16) + 'Note</p><p>Reminders go out at 09:00.</p></div></div></div>',
        'The body role, one heading size and tight blocks: at home in a bubble or a narrow panel.') +

      h.section('Code blocks', '<div class="ds-stack" data-demo="code"><pre class="ds-code-block" tabindex="0" aria-label="Request"><code>GET /api/devices/42 HTTP/1.1\nAccept: application/json\nX-Request-Id: 0f8c2a7e-6b1d-4d3a-9e77-1c5a2b9f4d10-0f8c2a7e-6b1d-4d3a-9e77-1c5a2b9f4d10</code></pre>' +
        '<pre class="ds-code-block ds-code-block--wrap"><code>X-Request-Id: 0f8c2a7e-6b1d-4d3a-9e77-1c5a2b9f4d10-0f8c2a7e-6b1d-4d3a-9e77-1c5a2b9f4d10-0f8c2a7e-6b1d-4d3a-9e77-1c5a2b9f4d10</code></pre></div>',
        'A block that can scroll takes <code>tabindex="0"</code> and a name, so a keyboard reaches it; <code>--wrap</code> wraps long lines instead.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches links and a code block that can scroll; the arrow keys scroll it.</p>');
  },

  wire: function (root) {
    // In-page links stay in the demo (the styleguide's address is its route): scroll to the target and focus it.
    root.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link) return;
      event.preventDefault();
      var target = link.getAttribute('href') === '#prose-demo' ? null : document.getElementById(link.getAttribute('href').slice(1));
      if (!target || !root.contains(target)) return;
      target.scrollIntoView({ block: 'nearest' });
      var focusable = target.matches('a[href]') ? target : target.querySelector('a[href]');
      if (focusable) focusable.focus();
    });
  },
});
