/*
 * The Usage meter demo: tokens and cost against their budgets with buttons
 * that spend more (near, then over the budget), the three states side by
 * side, tokens without a budget, the inline variant in a composer's foot,
 * and a narrow column. Registered through SG.demo() (styleguide/sg-core.js).
 */
function usageMarkup(h, attrs, title, note, inline) {
  var id = h.uid('usage');
  return '<section class="ds-usage' + (inline ? ' ds-usage--inline' : '') + '" data-ds-usage ' + attrs + ' aria-labelledby="' + id + '">' +
    '<div class="ds-usage__head"><h3 class="ds-usage__title" id="' + id + '">' + h.esc(title) + '</h3><span class="ds-usage__status" hidden></span></div>' +
    '<span class="ds-meter ds-usage__meter" role="meter" aria-labelledby="' + id + '"></span>' +
    '<p class="ds-usage__figures"><span class="ds-usage__value"></span><span class="ds-usage__cost"></span></p>' +
    (note ? '<p class="ds-usage__note">' + h.esc(note) + '</p>' : '') +
    '</section>';
}

SG.demo('usage', {
  title: 'Usage meter',
  group: 'data',
  need: 'Show the tokens and the cost an assistant or agent used against a budget, with a word when it comes near or goes over',
  lead: 'The share of the budget on a meter, the figures under it. Near the budget and past it an icon and a word say so, and a screen reader hears it once.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('Against a budget', '<div class="ds-stack">' +
        usageMarkup(h, 'data-demo="live" data-ds-usage-used="170000" data-ds-usage-budget="250000" data-ds-usage-cost="2.61" data-ds-usage-cost-budget="5"', 'Tokens this month', 'Resets on 1 December.') +
        '<div class="sg-row">' +
        '<button class="ds-btn" type="button" data-demo="spend">' + h.icon('plus', 16) + 'Run a report</button>' +
        '<button class="ds-btn ds-btn--quiet" type="button" data-demo="reset">' + h.icon('reset', 16) + 'Start of the month</button>' +
        '</div></div>',
        'Each report spends 40K tokens: from 80% of the budget the status says so, past it the meter turns to the error role.') +

      h.section('States', '<div style="display: grid; gap: var(--ds-space-4); grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))">' +
        '<div class="ds-card">' + usageMarkup(h, 'data-ds-usage-used="61000" data-ds-usage-budget="250000"', 'Product assistant') + '</div>' +
        '<div class="ds-card">' + usageMarkup(h, 'data-ds-usage-used="212000" data-ds-usage-budget="250000"', 'Ticket triage') + '</div>' +
        '<div class="ds-card">' + usageMarkup(h, 'data-ds-usage-used="96000" data-ds-usage-budget="100000" data-ds-usage-cost="6.4" data-ds-usage-cost-budget="5" data-ds-usage-currency="EUR"', 'Device reports', 'The cost went past its budget first.') + '</div>' +
        '</div>', 'Comfortable, near the budget (from 80%), over it: the icon and the word say it, the meter repeats it.') +

      h.section('Without a budget', usageMarkup(h, 'data-ds-usage-used="18420" data-ds-usage-cost="0.37"', 'This conversation'),
        'No share and no status: the figures alone, and an empty meter track.') +

      h.section('Inline', '<div class="ds-card"><p class="ds-muted">Ask about a device, a ticket or a Product.</p>' +
        usageMarkup(h, 'data-ds-usage-used="7400" data-ds-usage-budget="8000"', 'Context', null, true) + '</div>',
        '.ds-usage--inline: one row for a composer\'s foot or a toolbar.') +

      h.section('Narrow', '<div style="max-inline-size: 260px">' +
        usageMarkup(h, 'data-ds-usage-used="241000" data-ds-usage-budget="250000" data-ds-usage-cost="4.82" data-ds-usage-cost-budget="5"', 'Tokens this month') + '</div>') +

      h.section('Keyboard and screen readers', '<p class="ds-muted">Nothing takes focus. The meter is named by its title and says its value in words ("61% used"); the status word is announced once when it gets worse.</p>');
  },

  wire: function (root, h) {
    var live = h.$('[data-demo="live"]', root);
    var get = function () { return DS.core.get(live, 'usage'); };
    root.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-demo]');
      if (!button || !get()) return;
      var now = get().get();
      if (button.getAttribute('data-demo') === 'spend') get().set({ used: now.used + 40000, cost: Math.round((now.cost + 0.6) * 100) / 100 });
      else get().set({ used: 170000, cost: 2.61 });
    });
  },
});
