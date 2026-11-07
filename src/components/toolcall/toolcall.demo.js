/*
 * The Tool call demo: a done call with its input and output, a running one
 * whose time ticks, a failed one with its error, one waiting for approval,
 * a cancelled one, nested calls, and a narrow column. Registered through
 * SG.demo() (styleguide/sg-core.js).
 */
var MARKS = { pending: 'hourglass', done: 'checkCircle', failed: 'alertCircle', cancelled: 'ban' };

function toolMark(h, status) {
  return status === 'running' ? '<span class="ds-spinner"></span>' : h.icon(MARKS[status], 16);
}

function toolRow(h, call) {
  var attrs = ' data-status="' + call.status + '" data-ds-toolcall' + (call.attrs || '') + (call.open ? ' open' : '');
  return '<details class="ds-collapsible ds-disclosure ds-disclosure--row ds-toolcall"' + attrs + '>' +
    '<summary>' +
    '<span class="ds-toolcall__icon">' + h.icon(call.icon, 20) + '</span>' +
    '<span class="ds-disclosure__title ds-toolcall__title"><span class="ds-toolcall__name">' + h.esc(call.name) + '</span> <span class="ds-toolcall__args">' + h.esc(call.args) + '</span></span>' +
    ' <span class="ds-toolcall__status"><span class="ds-toolcall__mark">' + toolMark(h, call.status) + '</span><span class="ds-toolcall__word">' + call.word + '</span></span>' +
    ' <time class="ds-toolcall__time"></time>' +
    h.icon('chevronDown', 20, 'ds-chevron') +
    '</summary>' +
    '<div class="ds-disclosure__body ds-toolcall__body">' + (call.body || '') + '</div>' +
    '</details>';
}

function toolPart(h, label, code, error) {
  return '<div class="ds-toolcall__part' + (error ? ' ds-toolcall__part--error' : '') + '"><p class="ds-toolcall__label">' + label + '</p>' +
    '<pre class="ds-toolcall__code" tabindex="0" aria-label="' + label + '"><code>' + h.esc(code) + '</code></pre></div>';
}

SG.demo('toolcall', {
  title: 'Tool call',
  group: 'content',
  need: 'Show a call an agent made: its arguments, status, duration, input and output, and the calls inside it',
  lead: 'A disclosure row in a frame: the call at a glance, its input and output a press away. The status always has a word.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    var input = '{\n  "script": "test",\n  "filter": "devices"\n}';
    var output = '> device-sync@2.4.0 test\n> node --test devices\n\n✔ reads the device list (12ms)\n✔ groups by warranty end (4ms)\n✔ exports the CSV (31ms)\n\n42 passing (1s)';
    var nested = '<div class="ds-toolcall__calls">' +
      toolRow(h, { status: 'done', icon: 'laptop', name: 'read_device', args: 'LAPTOP-0042', word: 'Done', attrs: ' data-ds-toolcall-duration="180"', body: toolPart(h, 'Output', '{ "serial": "LAPTOP-0042", "warranty": "2027-02-28" }') }) +
      toolRow(h, { status: 'done', icon: 'laptop', name: 'read_device', args: 'LAPTOP-0043', word: 'Done', attrs: ' data-ds-toolcall-duration="210"', body: toolPart(h, 'Output', '{ "serial": "LAPTOP-0043", "warranty": "2026-12-31" }') }) +
      toolRow(h, { status: 'failed', icon: 'laptop', name: 'read_device', args: 'LAPTOP-0044', word: 'Failed', attrs: ' data-ds-toolcall-duration="5000"', body: toolPart(h, 'Error', 'Timed out after 5s', true) }) +
      '</div>';
    return h.section('Every status', '<div class="ds-toolcall-list" data-demo="list">' +
        toolRow(h, { status: 'done', icon: 'terminal', name: 'run_tests', args: 'npm test -- devices', word: 'Done', attrs: ' data-ds-toolcall-duration="1240"', body: toolPart(h, 'Input', input) + toolPart(h, 'Output', output) }) +
        toolRow(h, { status: 'running', icon: 'search', name: 'search_tickets', args: 'status:open device:LAPTOP-0042', word: 'Running', attrs: ' data-demo="running"', body: toolPart(h, 'Input', '{ "query": "status:open device:LAPTOP-0042" }') }) +
        toolRow(h, { status: 'failed', icon: 'globe', name: 'fetch', args: 'https://example.com/api/devices', word: 'Failed', attrs: ' data-ds-toolcall-duration="30000"', body: toolPart(h, 'Input', '{ "url": "https://example.com/api/devices" }') + toolPart(h, 'Output', 'Error: the request timed out after 30s', true) }) +
        toolRow(h, { status: 'pending', icon: 'trash', name: 'delete_device', args: 'LAPTOP-0007', word: 'Needs approval', body: toolPart(h, 'Input', '{ "serial": "LAPTOP-0007" }') }) +
        toolRow(h, { status: 'cancelled', icon: 'mail', name: 'send_mail', args: 'Ada Lovelace', word: 'Cancelled', attrs: ' data-ds-toolcall-duration="420"', body: toolPart(h, 'Input', '{ "to": "ada@example.com", "subject": "Warranty" }') }) +
        '</div><div class="sg-row">' +
        '<button class="ds-btn" type="button" data-demo="finish">' + h.icon('check', 16) + 'Finish the search</button>' +
        '<button class="ds-btn ds-btn--quiet" type="button" data-demo="restart">' + h.icon('reset', 16) + 'Run it again</button>' +
        '</div>', 'The running search ticks its time; finishing it swaps the mark, the word and the time, and is announced once.') +

      h.section('Nested calls', '<div class="ds-toolcall-list">' +
        toolRow(h, { status: 'done', icon: 'listTree', name: 'check_warranty', args: '3 devices', word: 'Done', attrs: ' data-ds-toolcall-duration="5420"', open: true, body: toolPart(h, 'Input', '{ "devices": ["LAPTOP-0042", "LAPTOP-0043", "LAPTOP-0044"] }') + nested }) +
        '</div>', 'The calls a call made sit on a rail in its body, without a frame of their own.') +

      h.section('Narrow', '<div style="max-inline-size: 300px"><div class="ds-toolcall-list">' +
        toolRow(h, { status: 'done', icon: 'terminal', name: 'run_tests', args: 'npm test -- devices', word: 'Done', attrs: ' data-ds-toolcall-duration="1240"', body: toolPart(h, 'Output', '42 passing (1s)') }) +
        '</div></div>', 'Under 360px a row lets its time go and cuts its arguments shorter.') +

      h.section('Keyboard and screen readers', '<p class="ds-muted">Tab reaches each summary; Enter or Space opens it. Input and output take focus to scroll. The end of a call is announced once: "search_tickets: Done".</p>');
  },

  wire: function (root, h) {
    var running = h.$('[data-demo="running"]', root);
    running.setAttribute('data-ds-toolcall-since', String(Date.now()));
    root.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-demo]');
      var call = DS.core.get(running, 'toolcall');
      if (!button || !call) return;
      if (button.getAttribute('data-demo') === 'finish') call.set({ status: 'done', label: 'Done' });
      if (button.getAttribute('data-demo') === 'restart') call.set({ status: 'running', label: 'Running', since: Date.now(), duration: null });
    });
  },
});
