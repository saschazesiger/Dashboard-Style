## Label group

The tags of one item on one line, as many as fit, then a "+N" button that shows all of them in a popup: a ticket's
labels in a table row, a device's groups in a card head.

```html
<div class="ds-label-group" data-ds-label-group>
  <ul class="ds-label-group__list" aria-label="Labels of ticket 42">
    <li><span class="ds-tag">Printer</span></li>
    <li><span class="ds-tag ds-tone-warning">Waiting for parts</span></li>
    <li><span class="ds-tag">Second floor</span></li>
  </ul>
</div>
```

The module writes the button and the popup after the list:

```html
<button class="ds-btn ds-btn--tonal ds-label-group__more" type="button" aria-haspopup="dialog"
        aria-expanded="false" aria-controls="..." aria-label="+2 more, show all 3"><span aria-hidden="true">+2</span></button>
<div class="ds-label-group__popup" id="..." role="dialog" aria-label="Labels of ticket 42" tabindex="-1" hidden>
  <ul class="ds-label-group__all">...every tag again...</ul>
</div>
```

| Part | Class | What |
|---|---|---|
| Group | `.ds-label-group` | one line: the list, then the button; give it its width (in a flex row: `min-width: 0` and room to grow) |
| List | `.ds-label-group__list` | a named `<ul>` of `<li>`, each holding a [tag](#status-chip) (`.ds-tag`, with a tone and an icon if it has one); the tags that do not fit are `hidden` |
| Button | `.ds-label-group__more` | a tonal [button](#button) as high as a tag, "+N" |
| Popup | `.ds-label-group__popup` | every tag, wrapping, in a popup at the button |
| All | `.ds-label-group__all` | the list in the popup |

### Behaviour: `data-ds-label-group`

On the group. It measures the tags, keeps those that fit on the line and hides the others, at most
`data-ds-label-group-max` of them (a fixed number: "the first 3"); again when the group's width changes and when the
page re-renders the list (`DS.dom.morphHtml`). Every group of the page is measured in one batch, reads before writes,
and each tag's width is kept until the list changes, so a table column of a few hundred groups costs a layout or two
per resize. One tag left alone in too little room ends in an ellipsis. The button
opens the popup through `DS.overlay`: it grows from the button, focus moves into it, Escape closes it and focus goes
back to the button; a pointerdown outside it or focus that leaves it (Tab on) closes it too. The popup is placed at the
button: anchored in the top layer where the engine can, else by the script (`--ds-label-group-x`, `--ds-label-group-y`).

The tags in the popup are copies without their ids: a page that acts on a tag (a link to a filter) uses links or
listens on the document.

### JS API

- `DS.labelgroup.create(el, { max })`: the controller the attribute path makes, on the group (that one itself when
  `DS.init()` already made it). `get()` gives
  `{ total, hidden, open }`; `set(open)` opens or closes the popup (it opens only while tags are hidden);
  `on('change', fn)` runs when the hidden count or the popup changes; `update()` measures again; `destroy()` shows
  every tag and takes the button and the popup away. Events: `ds:change` with `{ total, hidden, open }` on the group.
- `DS.labelgroup.visibleCount(widths, room, more, gap, max)`: the measuring alone: how many tags of `widths` fit in
  `room` beside a button `more` wide, `gap` apart (at most `max`, at least one).

### Options

On the group or any ancestor; each is computed in this component's own rules ([options.md](options.md)).

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the button | 4px per step as the tags (24px at md), its side padding 2px per step |
| Shape | `.ds-shape-*` | the button, the popup | the pill and the popup's corners times `--ds-shape` |
| Touch | `.ds-touch` | the button | at least `--ds-touch-target` high |
| Density, tone | | | not read: the tags carry their own tones and words |

### Accessibility

The list is a named `<ul>`: a screen reader hears how many tags it shows. The button's name says how many more and how
many in all ("+3 more, show all 8"), starting with what it shows, so a voice command "click plus 3" finds it; it has
`aria-haspopup="dialog"` and `aria-expanded`. The popup is a non-modal `role="dialog"` named like the list, focusable
itself (`tabindex="-1"`), so focus lands in it and Tab moves on through its links or past the group. Strings:
`labelGroupMore` and `labelGroupAll` ([install.md](install.md#language-and-locale)).

### Forced colours

The popup's transparent outline becomes its edge; the button is a button.

### Hooks

`--ds-label-group-gap`: see [theming.md](theming.md). The button follows `--ds-tag-height`.

**Motion:** the popup is a popup of `DS.overlay`: it fades in over `--ds-dur-fast` and grows from the button
(`--ds-scale-popup`, its clip opening from the button's edge) on `--ds-ease-spatial` over `--ds-dur-medium`; the exit
only fades, over `--ds-dur-instant`. Transitions keyed on `data-state`, so a close mid-way turns back from where it is.
Tags hide and show at once: a line that slid would move the row.

<!-- changelog -->
- Label group (new, `labelgroup`): `.ds-label-group` with `__list`, `__more`, `__popup` and `__all`;
  `data-ds-label-group` (and `-max`) keeps the tags that fit on one line and writes a "+N" button that opens every tag
  in a popup through `DS.overlay`; `DS.labelgroup.create`, `visibleCount`; hook `--ds-label-group-gap`; strings
  `labelGroupMore`, `labelGroupAll`.
