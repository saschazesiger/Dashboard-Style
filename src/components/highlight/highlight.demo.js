/*
 * The Syntax highlighting demo: a sample of every language of D13 in a code
 * block (data-ds-highlight), the token kinds with their classes and roles,
 * and code a page renders itself through DS.highlight.highlight().
 */
var SAMPLES = [
  ['json', 'JSON', '{\n  "id": 42,\n  "name": "LAPTOP-0042",\n  "retired": false,\n  "ports": [80, 443],\n  "note": null\n}'],
  ['js', 'JavaScript', '// Retire every device older than four years\nconst limit = 4;\nexport async function retireOld(devices) {\n  const old = devices.filter((d) => d.age > limit && !/^TEST-/.test(d.name));\n  for (const device of old) await api.retire(device.id);\n  return `${old.length} retired`;\n}'],
  ['ts', 'TypeScript', 'interface Device {\n  id: number;\n  owner?: string;\n}\ntype Retired = Device & { retiredAt: Date };\nexport const isRetired = (d: Device): d is Retired => "retiredAt" in d;'],
  ['sh', 'Shell', '$ ds-cli backup LAPTOP-0042 --wait\n$ ds-cli retire LAPTOP-0042 --force | tee -a retire.log  # keep a record\nexport DS_TOKEN="${DS_TOKEN:-none}"'],
  ['html', 'HTML', '<!doctype html>\n<button class="ds-btn" type="button" data-ds-copy="#key">Copy &amp; close</button>\n<!-- the key -->\n<script>DS.init(document);</script>'],
  ['xml', 'XML', '<?xml version="1.0" encoding="UTF-8"?>\n<device id="42" retired="false">\n  <name>LAPTOP-0042</name>\n  <![CDATA[ a < b ]]>\n</device>'],
  ['css', 'CSS', '@media (min-width: 600px) {\n  .ds-theme .device-card:hover {\n    --ds-card-padding: 24px;\n    color: var(--ds-text-2);\n    margin: 0 auto !important;\n  }\n}'],
  ['sql', 'SQL', "SELECT d.id, COUNT(*) AS tickets\nFROM devices d\nJOIN tickets t ON t.device_id = d.id\nWHERE d.name LIKE 'LAPTOP-%' AND t.closed IS NULL -- open only\nGROUP BY d.id;"],
  ['yaml', 'YAML', '---\nschedule:\n  at: "02:00"   # nightly\n  retries: 3\n  notify: true\ndevices: &all\n  - LAPTOP-0042\n  - PRINTER-7'],
  ['go', 'Go', 'package devices\n\nimport "fmt"\n\ntype Device struct {\n\tID   int\n\tName string\n}\n\nfunc (d Device) String() string {\n\treturn fmt.Sprintf("%s (%d)", d.Name, d.ID)\n}'],
  ['py', 'Python', '@dataclass\nclass Device:\n    id: int\n    retired: bool = False\n\n    def label(self) -> str:\n        return f"Device {self.id}" if not self.retired else None  # gone'],
  ['diff', 'Diff', '--- a/sync.yaml\n+++ b/sync.yaml\n@@ -1,3 +1,3 @@\n schedule:\n-  at: "01:00"\n+  at: "02:00"'],
];

var KINDS = [
  ['keyword', 'const, if, SELECT, @media', '--ds-code-keyword'],
  ['string', '"LAPTOP-0042", /^TEST-/', '--ds-code-string'],
  ['number', '42, true, null, #fff', '--ds-code-number'],
  ['comment', '// a comment', '--ds-code-comment'],
  ['function', 'retire(), ds-cli, a tag name', '--ds-code-function'],
  ['type', 'Device, string, .card', '--ds-code-type'],
  ['property', '"id":, color:, --force, $HOME', '--ds-code-property'],
  ['meta', '@dataclass, $, ---, @@', '--ds-code-meta'],
  ['inserted', '+ an added line', '--ds-code-inserted'],
  ['deleted', '- a removed line', '--ds-code-deleted'],
];

SG.demo('highlight', {
  title: 'Syntax highlighting',
  group: 'content',
  need: 'Colour code by its syntax: json, js and ts, sh, html and xml, css, sql, yaml, go, py and diff, or with the page\'s own highlighter',
  lead: 'The system\'s own small tokenizers, one pass each: data-ds-highlight colours the text of an element in place, DS.highlight.highlight() returns escaped markup. The colours are the theme\'s code roles.',
  options: { sizes: false, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Languages', '<div class="ds-grid-2" style="align-items: start" data-demo="languages">' + SAMPLES.map(function (sample) {
      return '<div class="ds-stack" style="--ds-stack-gap: var(--ds-space-2)"><h3 class="ds-card__title">' + sample[1] + ' <span class="ds-muted">' + sample[0] + '</span></h3>' +
        '<pre class="ds-code-block" tabindex="0" aria-label="' + sample[1] + ' sample"><code data-ds-highlight="' + sample[0] + '">' + h.esc(sample[2]) + '</code></pre></div>';
    }).join('') + '</div>', 'Every language of D13, with its aliases (yml, bash, python, typescript ...).') +

      h.section('Token kinds', '<div class="ds-table-wrap"><table class="ds-table" data-demo="kinds"><thead><tr><th>Kind</th><th>Tokens</th><th>Role</th></tr></thead><tbody>' + KINDS.map(function (kind) {
        return '<tr><td><code class="ds-highlight__' + kind[0] + '">' + kind[0] + '</code></td><td><code class="ds-highlight__' + kind[0] + '">' + h.esc(kind[1]) + '</code></td><td><code>' + kind[2] + '</code></td></tr>';
      }).join('') + '</tbody></table></div>', 'A theme sets the roles; every one reaches 4.5:1 on --ds-code-bg in light and dark, 7:1 with the contrast theme.') +

      h.section('Rendered by the page', '<pre class="ds-code-block" tabindex="0" aria-label="Rendered by the page" data-demo="rendered"><code></code></pre>',
        'DS.highlight.highlight(code, \'sql\') returns escaped markup the page puts in place itself; unknown languages stay plain.');
  },

  wire: function (root, h) {
    var target = h.$('[data-demo="rendered"] code', root);
    DS.dom.morphHtml(target, DS.highlight.highlight("UPDATE devices SET retired = true WHERE id = 42; -- <script> stays text", 'sql'));
  },
});
