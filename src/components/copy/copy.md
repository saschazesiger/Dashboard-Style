## Copy button

Copies a value, a key or a link with one press, shows "Copied" for a moment and says it to screen readers. Without the
Clipboard API it falls back to the copy command, and without that it selects the text and says how to copy it by hand.

```html
<!-- A value and its icon button, in the read-only field look -->
<span class="ds-copy ds-copy--field">
  <code class="ds-copy__value" id="api-key">ak_live_7f3a9c2e</code>
  <button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Copy the key" data-tip="Copy the key"
          data-ds-copy="#api-key">
    <span class="ds-icon-swap"><span class="ds-icon-swap__a">[icon copy 20]</span><span class="ds-icon-swap__b">[icon check 20]</span></span>
  </button>
</span>

<!-- Inline, the value beside it -->
<span class="ds-copy"><code class="ds-copy__value">LAPTOP-0042</code>
  <button class="ds-btn ds-btn--quiet ds-btn--icon ds-xs" type="button" aria-label="Copy the serial number" data-ds-copy>
    <span class="ds-icon-swap"><span class="ds-icon-swap__a">[icon copy 16]</span><span class="ds-icon-swap__b">[icon check 16]</span></span>
  </button></span>

<!-- A labelled button with a value of its own: the done face says "Copied" -->
<button class="ds-btn" type="button" data-ds-copy data-ds-copy-value="https://example.com/t/4127">
  <span class="ds-btn__faces">
    <span class="ds-btn__face">[icon link 16]Copy link</span>
    <span class="ds-btn__face ds-btn__face--done" aria-hidden="true">[icon check 16, pathLength 1]<span class="ds-copy__done"></span></span>
  </span>
</button>
```

| Class | What |
|---|---|
| `.ds-copy` | a value and its copy button in one line (`--ds-space-1` apart) |
| `.ds-copy--field` | the read-only field look: the field's height (`--ds-input-height` with its size and density steps, the touch minimum), the field radius times `--ds-shape`, `--ds-copy-field-bg`; the value fills it and the button sits at its end: an icon button 8px lower than the field at every size and density (32px at md), never below the touch minimum |
| `.ds-copy__value` | the value: the code role (`--ds-copy-font`), one line with an ellipsis; a click selects all of it (`user-select: all`) |
| `.ds-copy__manual` | written by `DS.copy` after the button when the browser refuses to copy and nothing on the page shows the text (a `data-ds-copy-value`, a text from `set()`): a read-only field (with `.ds-copy__value`) holding the text, focused and selected, to copy by hand; it goes on blur, Escape takes focus back to the button |
| `.ds-copy__done` | the words of a done face: `DS.copy` writes the strings' `copied` ("Copied") into it |

The button is a [Button](#button): an icon button with an icon swap (`.ds-icon-swap`, copy to check) or a labelled one
with faces (`.ds-btn__faces`; the done face's check draws itself).

### Options

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Field look | `.ds-copy--field` | the `.ds-copy` | the box of a read-only field (above) |
| Size | `.ds-xs` ... `.ds-xl` | the field, the button or any ancestor | the field's height (8px per step) and side padding; the button's own; the value keeps the code role |
| Density | `.ds-density-*` | any container | the field's height, 4px per step |
| Shape | `.ds-shape-*` | any container | the field's radius and the button's |
| Touch | `.ds-touch` | the theme or a container | the field and the button at least `--ds-touch-target` high |

No tone: copying has no status beyond "Copied".

### Behaviour: `data-ds-copy`

| Attribute | On | Effect |
|---|---|---|
| `data-ds-copy` | the button | copies on a press. Its value names the source: a selector or an id (a field's `value`, else the element's text); empty, the `.ds-copy__value` of the `.ds-copy` around the button |
| `data-ds-copy-value` | the button | the text to copy, instead of a source |
| `data-state="copied"` | the button, written by the system | for `--ds-hold-status` after a copy |

A press copies through the Clipboard API (`navigator.clipboard.writeText`, secure pages), else through the copy command
on a hidden, read-only textarea (focus goes back where it was). It worked: for `--ds-hold-status` the button carries
`data-state="copied"`, an icon swap in it shows its check, a button with a done face shows it (`.ds-btn--done`, blocked
while it shows), and the announcer says "Copied" (polite). It did not: the text is selected (in the source where it
shows the text that was meant; else in a `.ds-copy__manual` field after the button, focused) and the announcer says
"Copying is blocked here. The text is selected: press Ctrl+C to copy it." (assertive; ⌘C on Apple systems; string
`copyManual`). Either way `ds:copy` (`{ text, ok, method }`, method `'clipboard'`, `'command'` or `'none'`) goes out
on the button. A button without words and without a name gets the strings' `copy` ("Copy") as its `aria-label`.

### JS API

```js
await DS.copy.copy('ak_live_7f3a9c2e');            // { ok: true, method: 'clipboard' }; never rejects
DS.copy.textOf(button);                            // what the button would copy now
const share = DS.copy.create(button, { text: url }); // the controller data-ds-copy makes
share.set(nextUrl);                                // what it copies from now on (null: back to the markup)
share.get();
share.on('copy', ({ ok, method }) => { if (!ok) DS.overlay.toast(region, 'Copy it by hand.'); });
share.copy();                                      // as a press does
share.done();                                      // only the copied feedback, for a copy the page made itself
```

`DS.copy.copy(text, { doc })` is the copy alone (no feedback); `DS.copy.create(button, { text })` returns the controller
(`get`, `set`, `copy`, `done`, `on('copy')`, `destroy`), one per button: on a button the attribute set up it returns that
controller (`text` through `set()`), so a press still copies once; `DS.copy.textOf(button)` reads the source as the module does.

### Accessibility

- A `<button>`: Enter and Space copy. An icon button needs `aria-label` and a `data-tip` that say what is copied
  ("Copy the key"), never only "Copy" when several sit on a page. Its name does not change after a copy; the
  announcer says "Copied" instead, and the check or the done face shows it (never the colour alone).
- `aria-disabled` and busy buttons never copy (the action guard); a button in its copied hold ignores presses.
- The value is text (a `<code>`), read where it stands; with `user-select: all` one click selects all of it.
- Forced colours: the field keeps its border; the value is `CanvasText`; the button's system colours.

### Hooks

`--ds-copy-font` (the value's type), `--ds-copy-field-bg` (the field look's fill). The field reads `--ds-input-height`
to line up with the fields around it.

**Motion:** the button's own: the icon swap crossfades with a small scale (`.ds-icon-swap`), the faces roll and the
done check draws itself (`.ds-btn--done`); back after `--ds-hold-status`.
