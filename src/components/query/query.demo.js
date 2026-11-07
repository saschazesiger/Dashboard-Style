/*
 * The Query input demo: tickets filtered by a typed query (status,
 * priority, assignee, kind, created), with the structured query the page
 * gets, a query with an invalid token, the empty field and a disabled
 * one. Registered through SG.demo() (styleguide/sg-core.js). Size,
 * density, shape and touch come from the options panel around it. Running
 * the query is the page's; parsing, suggesting, the tokens and the saved
 * queries are DS.query.
 */
var QUERY_KEYS = [
  { key: 'status', label: 'Status', values: ['open', 'pending', 'closed'] },
  { key: 'priority', label: 'Priority', type: 'number', description: '1 (low) to 4 (urgent)' },
  { key: 'assignee', label: 'Assignee', values: [{ value: 'ada', label: 'Ada Lovelace' }, { value: 'grace', label: 'Grace Hopper' }, { value: 'alan', label: 'Alan Turing' }] },
  { key: 'kind', label: 'Kind', values: [{ value: 'hardware', label: 'Hardware', description: 'A device or a part' }, { value: 'access', label: 'Access', description: 'Accounts and keys' }, { value: 'network', label: 'Network' }] },
  { key: 'created', label: 'Created', type: 'date', description: 'A date, as 2026-11-04' },
];

function queryField(h, attributes, placeholder) {
  var id = h.uid('query');
  return '<div class="ds-query" data-ds-query data-ds-query-keys="' + h.esc(JSON.stringify(QUERY_KEYS)) + '"' + (attributes || '') + '>' +
    '<label class="ds-field__label" for="' + id + '">Filter tickets</label>' +
    '<div class="ds-query__row"><div class="ds-combo ds-combo--multi ds-query__box">' +
    '<span class="ds-query__icon" aria-hidden="true">' + h.icon('search', 20) + '</span>' +
    '<input class="ds-input ds-combo__input ds-query__input" id="' + id + '" placeholder="' + (placeholder || 'status:open printer') + '"' + (attributes && attributes.indexOf('data-demo-disabled') >= 0 ? ' disabled' : '') + '>' +
    '<button class="ds-combo__clear" type="button" hidden>' + h.icon('close', 20) + '</button>' +
    '<div class="ds-combo__popup" hidden><div class="ds-combo__list"></div><p class="ds-combo__status" role="status"></p></div></div>' +
    '<button class="ds-btn ds-btn--icon ds-query__save" type="button" data-tip="Save this query">' + h.icon('bookmark', 20) + '</button></div></div>';
}

SG.demo('query', {
  title: 'Query input',
  group: 'forms',
  need: 'Filter with a typed query of tokens such as status:open, with suggestions, operators and saved queries',
  lead: 'Filters typed as tokens: the list suggests keys, operators and values, the tokens can be edited from the keyboard, and a query can be kept under a name. The page gets the query as data.',
  options: { sizes: true, density: true, shape: true, tones: false, variants: false },

  render: function (h) {
    return h.section('Tickets', queryField(h, ' data-ds-query-store="sg-tickets" data-ds-value="status:open priority:>=3" data-demo="tickets"') +
        '<pre class="ds-muted" data-demo="out" style="margin: var(--ds-space-3) 0 0; white-space: pre-wrap; font: var(--ds-font-code);"></pre>',
      'Type "st", take Status and a value; "priority:" offers the operators. Space after a complete filter or Enter makes a token. The bookmark keeps the query under a name; while the field is empty the list shows the saved ones.') +
      h.section('States', queryField(h, ' data-ds-value="state:open assignee:ada created:2026-13-01 printer jam"') +
        '<div style="block-size: var(--ds-space-4);"></div>' + queryField(h, '', 'Search tickets') +
        '<div style="block-size: var(--ds-space-4);"></div>' + queryField(h, ' data-ds-value="status:closed" data-demo-disabled'),
      'A key that does not exist and a date that is none make invalid tokens: the error tone, the icon and the reason in their name and tooltip. Then the empty field and a disabled one.') +
      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">↓</kbd> <kbd class="ds-kbd">↑</kbd> move through the suggestions and <kbd class="ds-kbd">Enter</kbd> takes one. <kbd class="ds-kbd">Backspace</kbd> in the empty field brings the last token back to edit it. <kbd class="ds-kbd">←</kbd> at the start moves to the tokens: <kbd class="ds-kbd">Delete</kbd> removes one, <kbd class="ds-kbd">F2</kbd> edits it, <kbd class="ds-kbd">End</kbd> goes back to the field. <kbd class="ds-kbd">Escape</kbd> closes the list, then empties the field.</p>');
  },

  wire: function (root, h) {
    var tickets = h.$('[data-demo="tickets"]', root);
    var out = h.$('[data-demo="out"]', root);
    var show = function (query) {
      out.textContent = 'filters: [\n' + query.filters.map(function (filter) { return '  ' + JSON.stringify(filter); }).join(',\n') + '\n]\ntext: ' + JSON.stringify(query.text);
    };
    tickets.addEventListener('ds:change', function (event) { show(event.detail); });
    tickets.addEventListener('ds:submit', function (event) { h.toast('Searching ' + (event.detail.value || 'every ticket'), 'info'); });
    var controller = DS.get(tickets, 'query');
    if (controller) show(controller.get());
    else setTimeout(function () { var later = DS.get(tickets, 'query'); if (later) show(later.get()); });
    h.$$('[data-demo-disabled]', root).forEach(function (field) {
      var save = field.querySelector('.ds-query__save');
      if (save) save.disabled = true;
    });
  },
});
