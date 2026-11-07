/*
 * The Markdown demo: a live editor (a textarea and its rendering through
 * DS.markdown.create), the attribute path with anchors, hostile input
 * written as text, and a chat answer streamed into compact prose.
 */
var ARTICLE = [
  '## Retire a device',
  '',
  'Back up the device and note its **asset tag**. Run `ds-cli backup` first, then see the [retirement policy](https://example.com/policy "Policy")[^1].',
  '',
  '> [!WARNING]',
  '> Retiring a device erases it.',
  '',
  '### Checklist',
  '',
  '- [x] Charger packed',
  '- [ ] Label printed',
  '- [ ] Handed to *Ada Lovelace*',
  '',
  '1. Sign out',
  '2. Run the command:',
  '',
  '   ```sh',
  '   ds-cli retire LAPTOP-0042 --force',
  '   ```',
  '',
  '| Model | Years | Status |',
  '|:--|--:|:-:|',
  '| Laptop 14 | 4 | ~~active~~ retired |',
  '| Laptop 16 | 3 | active |',
  '',
  'Questions? Write to it-support@example.com or open www.example.com/help.',
  '',
  '[^1]: The policy of the IT department.',
].join('\n');

var HOSTILE = [
  '<script>alert("x")</script> and <img src=x onerror=alert(1)> stay text.',
  '',
  '[A link](javascript:alert(1)), [another](java&#x09;script:alert(1)) and ![an image](data:image/png;base64,AAAA) become text.',
  '',
  '[A safe link](https://example.com) keeps rel="noopener".',
].join('\n');

var ANSWER = 'Three devices are **overdue**:\n\n1. `LAPTOP-0042`, issued to Ada Lovelace\n2. `PRINTER-7`\n3. `TABLET-12`\n\nTo remind their owners:\n\n```sh\nds-cli remind --overdue\n```\n\n> [!NOTE]\n> Reminders go out at 09:00.';

SG.demo('markdown', {
  title: 'Markdown',
  group: 'content',
  need: 'Render Markdown safely into prose: a CommonMark subset with GFM tables, task lists and autolinks, or the page\'s own renderer and sanitiser',
  lead: 'A small, safe renderer: CommonMark\'s everyday blocks and inlines, GFM tables, task lists, strikethrough and autolinks, footnotes and callouts. No HTML passes through, and only http, https, mailto and relative links become links.',
  options: { sizes: false, density: true, shape: true, tones: false },

  render: function (h) {
    var editor = h.uid('source');
    return h.section('Live', '<div class="ds-grid-2" style="align-items: start" data-demo="live"><div class="ds-field"><label class="ds-field__label" for="' + editor + '">Markdown</label>' +
      '<textarea class="ds-input" id="' + editor + '" rows="18" spellcheck="false" data-demo="source">' + h.esc(ARTICLE) + '</textarea></div>' +
      '<div class="ds-prose" data-demo="preview" aria-live="off"></div></div>',
      'Type on the left: DS.markdown.create() renders on every input, patching the prose in place.') +

      h.section('From the markup, with anchors', '<div class="ds-prose" data-ds-markdown data-ds-markdown-anchors data-demo="attribute">\n## Setup\nHover a heading: the link icon shows; its text links to it.\n\n### Network\nThe *device* joins `corp-wifi` on its own.\n</div>',
        'data-ds-markdown renders the element\'s text; data-ds-markdown-anchors links every heading to itself.') +

      h.section('Hostile input', '<div class="ds-grid-2"><pre class="ds-code-block ds-code-block--wrap" data-demo="hostile-source"><code>' + h.esc(HOSTILE) + '</code></pre><div class="ds-prose" data-demo="hostile"></div></div>',
        'Every character is escaped; another scheme than http, https or mailto (also hidden by entities) writes the text alone.') +

      h.section('A streamed answer', '<div class="ds-stack"><div class="ds-card ds-card--filled" style="max-inline-size:400px"><div class="ds-prose ds-prose--compact" data-demo="answer" aria-live="polite"></div></div>' +
        '<div><button class="ds-btn" type="button" data-demo="stream">' + h.icon('sparkles', 20) + 'Stream an answer</button></div></div>',
        'Compact prose, breaks and code blocks with a header: set() patches the nodes in place as the text grows.');
  },

  wire: function (root, h) {
    // In-page links (anchors, footnotes) stay in the demo: the styleguide's address is its route.
    root.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link) return;
      event.preventDefault();
      var target = document.getElementById(link.getAttribute('href').slice(1));
      if (!target || !root.contains(target)) return;
      target.scrollIntoView({ block: 'nearest' });
      var focusable = target.matches('a[href]') ? target : target.querySelector('a[href]');
      if (focusable) focusable.focus();
    });
    // External links of the sample open nothing from the styleguide.
    root.addEventListener('click', function (event) {
      if (event.target.closest('a[href^="http"], a[href^="mailto"]')) event.preventDefault();
    });
    var source = h.$('[data-demo="source"]', root);
    var preview = DS.markdown.create(h.$('[data-demo="preview"]', root), { source: source.value, anchors: true });
    source.addEventListener('input', function () { preview.set(source.value); });

    DS.markdown.create(h.$('[data-demo="hostile"]', root), { source: HOSTILE });

    var answer = DS.markdown.create(h.$('[data-demo="answer"]', root), { source: '', breaks: true, code: 'block' });
    var timer = 0;
    var button = h.$('[data-demo="stream"]', root);
    button.addEventListener('click', function () {
      clearTimeout(timer);
      var at = 0;
      answer.set('');
      var step = function () {
        at = Math.min(ANSWER.length, at + 6);
        answer.set(ANSWER.slice(0, at));
        if (at < ANSWER.length) timer = setTimeout(step, h.slow(40));
      };
      step();
    });
    return function () { clearTimeout(timer); };
  },
});
