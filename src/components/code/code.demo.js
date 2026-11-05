/*
 * The Code block demo: a block alone and wrapping, the frame with its
 * header, numbered and marked lines, files as tabs, a folded block, a diff
 * and a block in compact prose. DS.code (data-ds-code) renders the lines,
 * highlights and wires the header; the page writes only the markup. The
 * copy buttons are the copy button component's (data-ds-copy).
 */
var DEVICE_JSON = '{\n  "id": 42,\n  "name": "LAPTOP-0042",\n  "model": "Laptop 14",\n  "owner": "Ada Lovelace",\n  "retired": false,\n  "ports": [80, 443],\n  "note": null\n}';

var RETIRE_SH = '#!/bin/sh\n# Retire a device after its backup\nset -eu\nDEVICE="${1:?asset tag}"\nds-cli backup "$DEVICE" --wait\nds-cli retire "$DEVICE" --force | tee -a retire.log\necho "Retired $DEVICE"';

var CLIENT_TS = 'interface Device {\n  id: number;\n  name: string;\n  retired?: boolean;\n}\n\nexport async function retire(device: Device): Promise<void> {\n  const res = await fetch(`/api/devices/${device.id}/retire`, { method: "POST" });\n  if (!res.ok) throw new Error(`Retire failed: ${res.status}`);\n}';

var SYNC_PY = 'from dataclasses import dataclass\n\n\n@dataclass\nclass Device:\n    id: int\n    name: str\n    retired: bool = False\n\n\ndef overdue(devices, years=4):\n    """Devices older than `years`, oldest first."""\n    old = [d for d in devices if d.age > years and not d.retired]\n    return sorted(old, key=lambda d: d.age, reverse=True)\n\n\nif __name__ == "__main__":\n    for device in overdue(load()):\n        print(f"{device.name}: {device.age} years")\n';

var CONFIG_DIFF = 'diff --git a/sync.yaml b/sync.yaml\n--- a/sync.yaml\n+++ b/sync.yaml\n@@ -1,5 +1,5 @@\n schedule:\n-  at: "01:00"\n+  at: "02:00"\n   retries: 3\n-  notify: false\n+  notify: true';

function copyButton(h, label) {
  return '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" data-ds-copy aria-label="' + label + '" data-tip="' + label + '">' +
    '<span class="ds-icon-swap"><span class="ds-icon-swap__a">' + h.icon('copy', 20) + '</span><span class="ds-icon-swap__b">' + h.icon('check', 20) + '</span></span></button>';
}

function wrapButton(h) {
  return '<button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" data-ds-code-wrap aria-pressed="false" aria-label="Wrap lines" data-tip="Wrap lines">' + h.icon('wrapText', 20) + '</button>';
}

function foot(h) {
  return '<div class="ds-code__foot"><button class="ds-btn ds-btn--text" type="button" data-ds-code-expand aria-expanded="false"><span class="ds-code__expand-label">Show more</span>' + h.icon('chevronDown', 20, 'ds-chevron') + '</button></div>';
}

function frame(h, options) {
  return '<figure class="ds-code' + (options.lines ? ' ds-code--lines' : '') + '" data-ds-code' + (options.max ? ' data-ds-code-max="' + options.max + '"' : '') + ' data-demo="' + options.demo + '">' +
    '<div class="ds-code__head ds-sm">' + (options.title ? '<span class="ds-code__title">' + options.title + '</span>' : '') + '<span class="ds-code__lang"></span>' +
    '<span class="ds-code__actions">' + (options.wrap ? wrapButton(h) : '') + copyButton(h, options.copy || 'Copy code') + '</span></div>' +
    '<pre class="ds-code-block" tabindex="0" data-ds-code-lang="' + options.lang + '"' + (options.mark ? ' data-ds-code-mark="' + options.mark + '"' : '') + (options.start ? ' data-ds-code-start="' + options.start + '"' : '') + '><code>' + h.esc(options.code) + '</code></pre>' +
    (options.max ? foot(h) : '') + '</figure>';
}

function files(h) {
  var list = [['device.json', 'json', DEVICE_JSON], ['retire.sh', 'sh', RETIRE_SH], ['client.ts', 'ts', CLIENT_TS]];
  var ids = list.map(function () { return [h.uid('file'), h.uid('block')]; });
  return '<figure class="ds-code ds-code--lines" data-ds-code data-demo="tabs"><div class="ds-code__head ds-sm">' +
    '<div class="ds-tabs ds-tabs--flush" role="tablist" aria-label="Files">' + list.map(function (file, index) {
      return '<button class="ds-tabs__tab" role="tab" type="button" id="' + ids[index][0] + '" aria-selected="' + (index === 0) + '" aria-controls="' + ids[index][1] + '"' + (index ? ' tabindex="-1"' : '') + ' data-label="' + file[0] + '">' + file[0] + '</button>';
    }).join('') + '</div><span class="ds-code__lang"></span><span class="ds-code__actions">' + wrapButton(h) + copyButton(h, 'Copy the file') + '</span></div>' +
    list.map(function (file, index) {
      return '<pre class="ds-code-block" id="' + ids[index][1] + '" role="tabpanel" aria-labelledby="' + ids[index][0] + '" tabindex="0" data-ds-code-lang="' + file[1] + '"' + (index ? ' hidden' : '') + '><code>' + h.esc(file[2]) + '</code></pre>';
    }).join('') + '</figure>';
}

SG.demo('code', {
  title: 'Code block',
  group: 'content',
  need: 'Show a block of code with its language, a copy button, line numbers, marked lines, files as tabs and a folded height',
  lead: 'A block alone, or in a frame with its file or language, wrap and copy, numbered and marked lines, files as tabs and a height that folds long code. DS.code renders the lines and highlights them; the line numbers are never copied.',
  options: { sizes: false, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('A block alone', '<div class="ds-stack" data-demo="plain"><pre class="ds-code-block" tabindex="0" aria-label="Request"><code>GET /api/devices/42 HTTP/1.1\nAccept: application/json\nX-Request-Id: 0f8c2a7e-6b1d-4d3a-9e77-1c5a2b9f4d10-0f8c2a7e-6b1d-4d3a-9e77-1c5a2b9f4d10</code></pre>' +
      '<pre class="ds-code-block ds-code-block--wrap"><code>X-Request-Id: 0f8c2a7e-6b1d-4d3a-9e77-1c5a2b9f4d10-0f8c2a7e-6b1d-4d3a-9e77-1c5a2b9f4d10-0f8c2a7e-6b1d-4d3a-9e77-1c5a2b9f4d10</code></pre></div>',
        'A block that can scroll takes tabindex="0" and a name, so a keyboard reaches it; --wrap wraps long lines instead.') +

      h.section('With a header', frame(h, { demo: 'header', title: 'device.json', lang: 'json', code: DEVICE_JSON, lines: true, wrap: true, mark: '3,5-6' }),
        'The file, the language, a wrap toggle and a copy button; numbered lines, lines 3 and 5 to 6 marked: a tint and a bar.') +

      h.section('Files as tabs', files(h),
        'A tab per file: the arrow keys, Home and End switch; the language, the wrap and the copy button follow the file shown.') +

      h.section('Folded', frame(h, { demo: 'folded', title: 'sync.py', lang: 'py', code: SYNC_PY, lines: true, max: 8 }),
        'Longer than data-ds-code-max (8 lines): folded under a fade; Show more unfolds it, the height gliding.') +

      h.section('A diff', frame(h, { demo: 'diff', title: 'sync.yaml', lang: 'diff', code: CONFIG_DIFF, copy: 'Copy the diff' }),
        'Added and removed lines tinted; the + and - stay, so the change never rests on the colour.') +

      h.section('Without a header, from line 41', '<figure class="ds-code ds-code--lines" data-ds-code="sql" data-demo="start"><pre class="ds-code-block" tabindex="0" aria-label="Query" data-ds-code-start="41" data-ds-code-mark="43"><code>' +
        h.esc("SELECT id, name, owner\nFROM devices\nWHERE retired = false AND bought < now() - interval '4 years'\nORDER BY bought;") + '</code></pre></figure>',
        'data-ds-code-start numbers from another line; the mark names the number shown.') +

      h.section('In a chat bubble', '<div class="ds-card ds-card--filled" style="max-inline-size:360px"><div class="ds-prose ds-prose--compact" data-demo="compact"><p>Run this to retire it:</p>' +
        frame(h, { demo: 'compact-code', lang: 'sh', code: 'ds-cli retire LAPTOP-0042 --force' }) + '</div></div>',
        'In compact prose the block is tighter.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches the header\'s buttons, the selected tab and the block, whose arrow keys scroll it. <kbd class="ds-kbd">Left</kbd> and <kbd class="ds-kbd">Right</kbd>, <kbd class="ds-kbd">Home</kbd> and <kbd class="ds-kbd">End</kbd> switch files. <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> on Show more unfolds.</p>');
  },
});
