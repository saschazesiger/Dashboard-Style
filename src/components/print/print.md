## Print

What goes on paper and how it breaks into sheets. Every component already prints itself sensibly: the app frame's
bars and drawer stay off, scrollers unroll, tables repeat their header row and keep rows whole, open overlays stay
off. These classes are for the page's own content.

```html
<div class="ds-cluster ds-print-hide">…filters and actions…</div>        <!-- screen only -->
<p class="ds-meta ds-print-only">Printed on 2026-11-04 by Ada Lovelace</p>  <!-- paper only -->
<section class="ds-print-break-before">…</section>                        <!-- starts a new sheet -->
<figure class="ds-print-avoid">…</figure>                                  <!-- never split -->
<div class="ds-print-exact">…a chart whose fills carry meaning…</div>
<div class="ds-print-urls">…links print their address…</div>

<section class="ds-print-page">                                            <!-- a printable report or invoice -->
  <header class="ds-cluster ds-cluster--between">…</header>
  <table class="ds-table">…</table>
</section>
<button class="ds-btn ds-print-hide" type="button">[icon printer 16] Print</button>              <!-- the page calls print() -->
```

| Class | Screen | Paper |
|---|---|---|
| `.ds-print-only` | hidden | shown |
| `.ds-print-hide` | shown | hidden |
| `.ds-print-break-before`, `.ds-print-break-after` | – | a new sheet before or after it |
| `.ds-print-avoid` | – | never split across two sheets (a figure, a card, a total with its last rows) |
| `.ds-print-exact` | – | fills and colours print as shown; the browser drops backgrounds to save ink otherwise |
| `.ds-print-urls` | – | every `http(s)` link inside prints its address after its text, inline, also where a component lays the link's `::after` out as a box (the stretched link of an interactive card) |
| `.ds-print-page` | a sheet: `--ds-print-page-width` (210mm, A4) wide, centred, `--ds-print-page-pad` inside, the surface and a soft shadow | the paper's full width, no frame; the light scheme of the theme (its `light-dark()` roles); headings kept with what follows them, figures, images, code and quotes whole, no line alone at the top or foot of a sheet |

- Hiding is `display: none !important`, like the `hidden` attribute, whatever `display` a component gives the
  element.
- Paper keeps the browser's page margins (the print dialog sets them); `.ds-print-page` adds none of its own in print.
- A page that prints in a dark theme file of its own (`themes/dark.css`, which sets dark values rather than
  `light-dark()`) prints dark inside `.ds-print-page` too: load the light theme for print where that matters.
- Status on paper: tones are colour, and colour may not print; the icon and the word of a status chip or an alert
  still carry the meaning. Use `.ds-print-exact` where a fill carries meaning (a chart, a heat map).
- Options: shape multiplies the sheet's radius on screen; size, density, tone and touch are its content's own.
- Forced colours: the sheet keeps a transparent outline that becomes its edge.
- Hooks: `--ds-print-page-width`, `--ds-print-page-pad` ([theming.md](theming.md#component-hooks)).

<!-- changelog -->
- Added: Print, `.ds-print-only`, `.ds-print-hide`, `.ds-print-break-before`, `.ds-print-break-after`,
  `.ds-print-avoid`, `.ds-print-exact`, `.ds-print-urls` and the printable sheet `.ds-print-page`
  (`--ds-print-page-width`, `--ds-print-page-pad`).
