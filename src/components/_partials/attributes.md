## Attributes

The attributes the system writes (owned state: a re-render with `DS.dom.morphHtml` keeps them; never set them) and
the ones the page sets for it. The project check reads this table.

| Attribute | Written by | On | Meaning |
|---|---|---|---|
| `data-scrolled` | the system (`DS.dom.watchScrolled`) | `.ds-app`, `.ds-sheet__panel`, `.ds-dialog__box` or the scroller | the scroller is scrolled away from its top (hairlines, top bar tint) |
| `data-ds-sentinel` | the system (`DS.dom.watchScrolled`) | the 1px sentinel first in a watched scroller | marks the sentinel (with `data-ds-keep`) |
| `data-ds-text` | the system (`DS.dom.watchScrolled`) | a watched `.ds-dialog__body` | bare text stands among its children, so a body of text and the sentinel is not taken for empty |
| `data-ds-edges` | the system (`DS.dom.scrollEdges`) | the scroller | its edges are reported |
| `data-ds-overflow-start` | the system (`DS.dom.scrollEdges`) | the scroller | more to scroll at the start of its axis |
| `data-ds-overflow-end` | the system (`DS.dom.scrollEdges`) | the scroller | more to scroll at the end of its axis |
| `data-ds-dragover` | the system (`DS.dom.dropzone`, `DS.dnd`) | a `.ds-dropzone`, a page drop target or a zone of `DS.dnd` | files are dragged over it, or the dragged item is |
| `data-ds-dragging` | the system (`DS.motion.sortable`, `DS.dnd`) | the item being moved | the dragged row |
| `data-ds-virtual-gap` | the system (`DS.virtual`) | a hidden spacer among the rows | stands in for rows that are not rendered |
| `data-ds-time` | the page | any element, usually a `<time>` | `DS.format` keeps its relative time current ([core.md](core.md#relative-time-data-ds-time)) |
| `data-ds-keyboard` | the system (`DS.dom.followViewport`) | `<html>` | the on-screen keyboard is up |
| `data-toast-reserve` (with `--ds-toast-reserve`) | both: `DS.overlay.toast()` by default, the page only with `reserve: false` | `.ds-view`, `.ds-sheet__body`, `.ds-dialog` | the layer keeps room at its end for snackbars that stay ([Snackbar](#snackbar)) |
| `data-ds-savebar` (with `--ds-savebar-height`) | the system (`DS.overlay.savebar()`) | `.ds-view` | the save bar shows: scroll padding and the content's end keep its room ([Save bar](#save-bar)) |
| `data-ds-savebar-rest` | the system (`DS.overlay.savebar()`) | `.ds-view` | the bar hid at the end of the page: its room stays until the page scrolls away from the end ([Save bar](#save-bar)) |
| `data-ds-busy` | the page | `.ds-dialog`, `.ds-sheet`, `.ds-drawer` | keeps the overlay open while its action runs: the user's close attempts do nothing, `DS.overlay.close()` still closes ([Dialog](#dialog), "While its action runs") |
| `data-ds-open` | the page | a button | `DS.init()`: a click, or a menu's ArrowDown and ArrowUp, opens the overlay it names (a selector or an id), with the button as its opener ([Dialog](#dialog)) |
| `data-ds-close` | the page | a control or a backdrop | without a value closes the overlay around it; with a selector or an id closes that overlay, leaving the one around it open ([Dialog](#dialog)) |
| `data-ds-dialog-form` | the page | the `form.ds-dialog__box` of a dialog | the system handles its submit: `ds:submit`, then the close ([Dialog](#a-form-dialog)) |
| `data-ds-menu-checks` | the page | `.ds-menu` | the system flips its check items and sends `ds:change` ([Menu](#menu)) |
| `data-tip-shortcut` | the page | a `[data-tip]` trigger | the key after the tip's text, in `.ds-tooltip__shortcut`; the tip then shows whatever the visible text ([Tooltip](#tooltip)) |
| `data-ds-toast-room` | the page | `.ds-view`, `.ds-sheet__body`, `.ds-dialog` | `off`: this layer keeps no room for snackbars that stay; the page keeps the messages clear itself ([Snackbar](#snackbar), "Room at the end") |
| `aria-keyshortcuts` | both: the system (`DS.hotkeys`, from `data-ds-hotkey`) unless the markup has one, then the page's stays | the element with `data-ds-hotkey` | the combos of the element, for assistive tech; while the system writes it a re-render keeps it |
| `data-ds-hotkey` (with `data-ds-hotkey-description`, `-group`, `-scope`) | the page | a button, link or field | a press of the combo presses it, or focuses a field ([core.md](core.md#hotkeys)) |
| `data-ds-guard="off"` | the page | any element around actions | its `aria-disabled` and busy actions explain themselves on click: `DS.motion.guard()` lets their activations through |
| `data-icon` | the page | any element | the glyph name that `DS.icons.fill()` draws into it ([icons.md](icons.md)) |
| `data-icon-size` | the page | an element with `data-icon` | the glyph size in px for `DS.icons.fill()` (default 20) |
| `data-icon-place` | the page | an element with `data-icon` | `start` or `end`: `DS.icons.fill()` puts the glyph first or last and keeps the content (without it the glyph replaces the content; [icons.md](icons.md)) |
| `data-ds-shown` | the page | a `.ds-presence--keep` element, a `.ds-hover-actions` host or its actions | shown (`.ds-presence--keep`: without it hidden, keeping its box; `.ds-hover-actions`: the actions show without hover or focus, [Utilities](#actions-on-demand)) |
| `data-drawer-collapsed` | the page | `.ds-app` | the docked drawer is a rail (above 900px; [App frame](#the-rail)) |
| `data-label` | the page | `.ds-segmented__option`, `.ds-tabs__tab` | the option's text again: keeps the width of the selected weight |
| `data-label` | the page | a cell of `.ds-table--stack` / `--stack-wide` | the label shown above the cell's content while the rows stack ([Stacked rows](#stacked-rows)) |
| `data-status` | the page | `.ds-steps__step` | `done`: a finished step ([Steps](#steps)) |
