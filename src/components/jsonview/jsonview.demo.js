/*
 * The JSON viewer demo: a device record with an id beyond 2^53, nested
 * objects and arrays; a log of 250 events that opens into ranges; a quiet
 * viewer without the bar; text that is no JSON. Registered through
 * SG.demo() (styleguide/sg-core.js). Size, density, shape and touch come
 * from the options panel around it. The payloads stand for what a
 * project's API returns.
 */
var DEVICE_JSON = '{\n' +
  '  "id": 9007199254740993,\n' +
  '  "name": "LAPTOP-0042",\n' +
  '  "model": "Notebook 14",\n' +
  '  "managed": true,\n' +
  '  "retired": null,\n' +
  '  "battery": { "health": 0.87, "cycles": 412 },\n' +
  '  "owner": { "name": "Ada Lovelace", "team": "Research", "display name": "Ada L." },\n' +
  '  "tags": ["lab", "loan", "lovelace"],\n' +
  '  "tickets": [\n' +
  '    { "id": 42, "title": "Replace the fan", "open": true },\n' +
  '    { "id": 57, "title": "Second dock for the lab", "open": false }\n' +
  '  ],\n' +
  '  "notes": "Issued to Ada Lovelace on 12 Oct 2026. The charger stays in the lab; ask the service desk before you take it home for a weekend."\n' +
  '}';

function eventLog() {
  var kinds = ['check-in', 'sync', 'update', 'login'];
  var list = [];
  for (var i = 0; i < 250; i += 1) list.push({ n: i, kind: kinds[i % 4], device: 'LAPTOP-' + String(1000 + (i % 37)).slice(1), ok: i % 23 !== 0 });
  return { device: 'LAPTOP-0042', events: list };
}

SG.demo('jsonview', {
  title: 'JSON viewer',
  group: 'data',
  need: 'Read a JSON document: open its levels, search keys and values, copy a value or its path',
  lead: 'A JSON document on the tree view: open and close its levels with the arrow keys, search keys and values, copy a value or its path from any row. Numbers keep every digit of the source; only what opens is rendered, and more than 100 entries open into ranges.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('A record', '<div class="ds-jsonview" data-ds-jsonview data-ds-jsonview-open="2" aria-label="Response of GET /devices/42" data-demo="device">' +
        '<script type="application/json">' + DEVICE_JSON + '</script></div>',
        'Two levels open. The id is beyond 2^53: it shows and copies with every digit. Search "lovelace", then Enter and Shift+Enter walk the matches. The copy buttons show on the row under the pointer, the focused row and the chosen one.') +

      h.section('Large', '<div class="ds-jsonview" aria-label="Event log of LAPTOP-0042" data-demo="log" style="--ds-jsonview-max-height: 24rem"></div>',
        'Set from the page with DS.jsonview.create(el, { value }). The 250 events open into ranges of 100; the rows scroll inside the viewer past --ds-jsonview-max-height.') +

      h.section('Without the bar', '<div class="ds-jsonview" data-ds-jsonview data-ds-jsonview-search="off" aria-label="Webhook body" data-demo="quiet">' +
        '<script type="application/json">{"event":"device.updated","device":{"id":42,"name":"LAPTOP-0042"},"changes":["owner"]}</script></div>',
        'data-ds-jsonview-search="off": for a short body.') +

      h.section('Not JSON', '<div class="ds-jsonview" data-ds-jsonview aria-label="Pasted configuration" data-demo="broken">' +
        '<script type="application/json">{\n  "retries": 3,\n  "timeout" 30\n}</script></div>',
        'The error says where the text stops being JSON, with an icon and in words.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">↑</kbd> <kbd class="ds-kbd">↓</kbd> move, <kbd class="ds-kbd">→</kbd> opens or enters, <kbd class="ds-kbd">←</kbd> closes or goes up, <kbd class="ds-kbd">*</kbd> opens the siblings, letters jump by key, <kbd class="ds-kbd">Tab</kbd> reaches the copy buttons of the focused row. In the search field <kbd class="ds-kbd">Enter</kbd> and <kbd class="ds-kbd">Shift</kbd>+<kbd class="ds-kbd">Enter</kbd> walk the matches, <kbd class="ds-kbd">Esc</kbd> clears it.</p>');
  },

  // What a page writes itself: the data of the large viewer, and a word after a copy.
  wire: function (root, h) {
    window.DS.jsonview.create(h.$('[data-demo="log"]', root), { value: eventLog(), open: 2 });
    var onCopy = function (event) {
      h.toast(event.detail.kind === 'path' ? 'Copied ' + event.detail.path + '.' : 'Copied the value of ' + event.detail.path + '.', 'success');
    };
    root.addEventListener('ds:copy', onCopy);
    return function () { root.removeEventListener('ds:copy', onCopy); };
  }
});
