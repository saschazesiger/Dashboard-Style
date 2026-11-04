/*
 * The Disclosure demo: the plain summary, accordion rows, the exclusive
 * accordion (details[name], no script) and rows in a card, which run to its
 * edges. Size, density, shape and touch come from the options panel around
 * it. Nothing to wire: <details> is the behaviour.
 */
var FAQ = [
  ['When does the sync run?', 'Nightly', 'Every night at 02:00; a manual run starts at once.'],
  ['What does a lock mean?', 'Directory', 'Another system sets the value: change it there.'],
  ['Who can retire a device?', 'Admins', 'Administrators of its building.'],
];

function rows(h, name) {
  return '<div class="ds-disclosure-list">' + FAQ.map(function (row, index) {
    return '<details class="ds-collapsible ds-disclosure ds-disclosure--row"' + (name ? ' name="' + name + '"' : '') + (index === 0 ? ' open' : '') + '>' +
      '<summary><span class="ds-disclosure__title">' + row[0] + '</span><span class="ds-disclosure__meta">' + row[1] + '</span>' + h.icon('chevronDown', 20, 'ds-chevron') + '</summary>' +
      '<div class="ds-disclosure__body"><p class="ds-muted">' + row[2] + '</p></div></details>';
  }).join('') + '</div>';
}

SG.demo('disclosure', {
  title: 'Disclosure',
  group: 'content',
  need: 'Hide advanced settings or sections until asked, one at a time if needed',
  lead: 'A details element with the system\'s summary. Rows that share a name are an exclusive accordion: opening one closes the other, with no script. The options panel changes size, density, shape and touch around the demo.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Plain', '<details class="ds-collapsible ds-disclosure" data-demo="plain"><summary>Advanced settings' + h.icon('chevronDown', 20, 'ds-chevron') + '</summary>' +
        '<div class="ds-disclosure__body"><p class="ds-muted">Asset tag, purchase date and the cost centre.</p></div></details>') +

      h.section('Exclusive accordion', '<div data-demo="accordion">' + rows(h, h.uid('faq')) + '</div>',
        'The same name on each row: one open at a time, in every browser of the floor.') +

      h.section('Rows that open on their own', '<div data-demo="independent">' + rows(h) + '</div>') +

      h.section('In a card', '<section class="ds-card" data-demo="in-card"><h3 class="ds-card__title">Help</h3>' + rows(h, h.uid('faq')) + '</section>',
        'The rows run to the card\'s edges; their text stays in line with the card\'s.') +

      h.section('Keyboard', '<p class="ds-muted"><kbd class="ds-kbd">Tab</kbd> reaches each summary; <kbd class="ds-kbd">Enter</kbd> or <kbd class="ds-kbd">Space</kbd> opens and closes it.</p>');
  },
});
