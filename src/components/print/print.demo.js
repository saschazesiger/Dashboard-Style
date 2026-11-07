/*
 * The Print demo: an invoice on a .ds-print-page sheet, with screen-only
 * actions, a paper-only note, a kept-together total and links that print
 * their address. Print the styleguide page (or use the browser's print
 * preview) to see the paper side. What a project writes itself: the print
 * button's call to print().
 */
var INVOICE_LINES = [
  ['Product licence, 12 months', '25', '48.00'],
  ['Laptop 14 rental, per month', '4', '89.00'],
  ['Monitor 27 rental, per month', '4', '21.00'],
  ['On-site support, hours', '6', '95.00'],
];

SG.demo('print', {
  title: 'Print',
  group: 'layout',
  need: 'Decide what goes on paper and where sheets break, and lay out a printable report or invoice',
  lead: 'Classes for paper. The sheet below is .ds-print-page: print this page or open the print preview to see what paper gets.',
  options: { sizes: false, density: true, shape: true, tones: false },

  render: function (h) {
    var total = 0;
    var rows = INVOICE_LINES.map(function (line) {
      var sum = Number(line[1]) * Number(line[2]);
      total += sum;
      return '<tr><td>' + line[0] + '</td><td class="ds-num">' + line[1] + '</td><td class="ds-num">' + line[2] + '</td><td class="ds-num">' + sum.toFixed(2) + '</td></tr>';
    }).join('');
    var titleId = h.uid('invoice');
    return h.section('A printable sheet', '<div class="ds-stack" data-demo="print">' +
        '<div class="ds-cluster ds-print-hide" data-demo="actions"><button class="ds-btn ds-btn--filled ds-sm" type="button" data-demo="print-button">' + h.icon('printer', 16) + 'Print</button><span class="ds-meta">.ds-print-hide: these actions stay off paper</span></div>' +
        '<article class="ds-print-page ds-print-urls" data-demo="sheet" aria-labelledby="' + titleId + '">' +
        '<header class="ds-cluster ds-cluster--between ds-cluster--top"><div><h3 class="ds-card__title" id="' + titleId + '">Invoice 2026-0142</h3><p class="ds-muted">For Ada Lovelace, devices team</p></div>' +
        '<p class="ds-meta ds-tabular">Issued 2026-11-04<br>Due 2026-12-04</p></header>' +
        '<p class="ds-meta ds-print-only ds-mt-2" data-demo="print-only">.ds-print-only: printed on 2026-11-04, page for the records</p>' +
        '<div class="ds-table-wrap ds-mt-6"><table class="ds-table"><thead><tr><th scope="col">Item</th><th scope="col" class="ds-num">Qty</th><th scope="col" class="ds-num">Price</th><th scope="col" class="ds-num">Sum</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<div class="ds-cluster ds-cluster--end ds-print-avoid ds-mt-4" data-demo="total"><span class="ds-meta">Total</span><strong class="ds-tabular">' + total.toFixed(2) + '</strong></div>' +
        '<p class="ds-muted ds-mt-8">Terms and the payment details: <a href="https://example.com/terms">example.com/terms</a> (.ds-print-urls prints the address after the link).</p>' +
        '</article></div>') +

      h.section('Sheet breaks', '<ul class="ds-plain-list" data-demo="breaks">' +
        '<li><code>.ds-print-break-before</code> starts a new sheet, <code>.ds-print-break-after</code> ends one.</li>' +
        '<li><code>.ds-print-avoid</code> keeps a block on one sheet: the total above stays with nothing torn off.</li>' +
        '<li><code>.ds-print-exact</code> prints fills as shown, for a chart or a heat map whose colours carry meaning.</li>' +
        '</ul><p class="ds-print-break-before ds-print-exact ds-meta" data-demo="break-before">This line starts a sheet of its own on paper.</p>');
  },

  wire: function (root) {
    root.addEventListener('click', function (event) {
      if (event.target.closest('[data-demo="print-button"]')) window.print();
    });
  },
});
