/*
 * The Shimmer demo: the glint on a plain status line, on mixed weights, on a
 * wheel line, in the muted colour of a meta row, on and off, and cut with an
 * ellipsis at a narrow width. Registered through SG.demo()
 * (styleguide/sg-core.js).
 */
SG.demo('shimmer', {
  title: 'Shimmer',
  group: 'feedback',
  need: 'Show that work is going on, on the words of a status line, with nothing beside them',
  lead: 'A soft glint travels over the words, a pass and a pause. It carries no meaning of its own: the words say what is going on.',
  options: { sizes: true, density: false, shape: false, tones: false },

  render: function (h) {
    return h.section('On a status line', '<div style="display: grid; gap: var(--ds-space-3); justify-items: start">' +
        '<div><span class="ds-shimmer" data-shimmer="Thinking">Thinking</span></div>' +
        '<div><strong class="ds-shimmer" data-shimmer="Running npm test">Running npm test</strong></div>' +
        '<div class="ds-meta"><span class="ds-shimmer" data-shimmer="Restarting LAPTOP-0042">Restarting LAPTOP-0042</span></div>' +
        '<div><span class="ds-wheel"><span class="ds-wheel__line ds-shimmer" data-shimmer="Writing the summary">Writing the summary</span></span></div>' +
        '</div>') +

      h.section('On and off', '<div class="sg-row">' +
        '<span class="ds-shimmer" data-shimmer="Importing 2,030 rows" data-demo="line">Importing 2,030 rows</span>' +
        '<button class="ds-btn ds-btn--quiet" type="button" aria-pressed="true" data-demo="toggle">Working</button>' +
        '</div><p class="ds-muted">Remove the class when the work ends: the glint goes at once, the text stays.</p>') +

      h.section('Narrow', '<div style="max-inline-size: 180px"><span class="ds-shimmer" data-shimmer="Checking the warranty of every laptop">Checking the warranty of every laptop</span></div>' +
        '<p class="ds-muted">The copy is cut with the same ellipsis as the text.</p>') +

      h.section('Screen readers and forced colours', '<p class="ds-muted">The copy has an empty alternative text, so the line is read once. In forced colours the copy is left out.</p>');
  },

  wire: function (root, h) {
    var line = h.$('[data-demo="line"]', root);
    h.$('[data-demo="toggle"]', root).addEventListener('click', function (event) {
      var on = event.currentTarget.getAttribute('aria-pressed') !== 'true';
      event.currentTarget.setAttribute('aria-pressed', String(on));
      line.classList.toggle('ds-shimmer', on);
    });
  },
});
