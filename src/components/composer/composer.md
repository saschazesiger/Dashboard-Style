## Composer

The message field of a conversation: a filled shell with a textarea that grows with its text, attachments as chips,
a slash-command palette and @-mentions at the caret, send and stop, a slot for a microphone and a remembered draft.

```html
<form class="ds-composer" data-ds-composer data-ds-composer-draft="ticket-42">
  <ul class="ds-composer__attachments" aria-label="Attachments"></ul>
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Attach files" data-tip="Attach files" data-ds-composer-attach>[icon paperclip 20]</button>
  <input class="ds-composer__picker" type="file" multiple hidden>
  <textarea class="ds-composer__input ds-input--grow" rows="1" aria-label="Message" placeholder="Message"></textarea>
  <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Dictate" aria-pressed="false" data-tip="Dictate">[icon mic 20]</button>
  <button class="ds-btn ds-btn--filled ds-btn--icon" type="submit" aria-label="Send" data-tip="Send">
    <span class="ds-icon-swap" data-swap="a"><span class="ds-icon-swap__a">[icon send 20]</span><span class="ds-icon-swap__b">[icon square 20]</span></span>
  </button>
  <div class="ds-composer__palette" role="listbox" aria-label="Commands" data-ds-composer-trigger="/" popover="manual" hidden>
    <div class="ds-composer__option" role="option" data-value="/summarize">[icon sparkles 20]
      <span class="ds-composer__option-label">/summarize</span><span class="ds-composer__option-hint">Sum up the ticket</span></div>
    <div class="ds-composer__option" role="option" data-value="/assign">[icon userPlus 20]
      <span class="ds-composer__option-label">/assign</span><span class="ds-composer__option-hint">Give the ticket to someone</span></div>
  </div>
  <div class="ds-composer__palette" role="listbox" aria-label="People" data-ds-composer-trigger="@" popover="manual" hidden>
    <div class="ds-composer__option" role="option" data-value="@Ada Lovelace" data-id="u-1">[icon user 20]
      <span class="ds-composer__option-label">Ada Lovelace</span><span class="ds-composer__option-hint">Support</span></div>
  </div>
</form>
```

The simple markup still works and looks as in 2.x: a textarea and a send button in `.ds-composer`, without the
attribute (no behaviour) or with it (Enter sends, the button blocks while empty).

**Options** ([options.md](options.md)): classes on the composer or any ancestor.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the composer or any ancestor | the field row 8px per step (from `--ds-input-height`, 40px), the text of the size's role; attachment chips and palette rows 8px per step. The buttons follow their own rule |
| Density | `.ds-density-*` | any container | 4px less per step: the field row, the chips, the palette rows; the palette's padding 2px |
| Shape | `.ds-shape-*` | any container or the theme | the shell's, the chips' and the palette's radius times 0, .5, 1, 1.5 |
| Touch | `.ds-touch` | the theme or a container | the field row, the chips and the palette rows at least `--ds-touch-target` (48px) |
| Tone | | | none: a composer means nothing by colour |

- **Field**: `.ds-composer__input` (`rows="1"`) grows with its text (`field-sizing: content`; elsewhere the module
  calls `DS.dom.autosize()`) up to `--ds-composer-max-height` (220px), then scrolls; the buttons stay at the bottom.
  The ring follows the field model on the shell (`--ds-input-focus-color`), at once while focus is inside. Field text
  is `--ds-font-input` (16px) on screens up to 600px. A disabled textarea dims the shell.
- **Attachments**: `.ds-composer__attachments` (a `<ul>`, empty in the markup; it takes no room while empty) sits on
  a line of its own above the text. `data-ds-composer-attach` on a button opens `.ds-composer__picker` (a hidden file
  input; its `accept` and `multiple` apply); files dropped on the composer or pasted into it are attached too
  (`DS.dom.dropzone()`: `data-ds-dragover` shows a dashed ring and the drop tint). Each file is a
  `.ds-composer__attachment` chip: a file glyph, `.ds-composer__attachment-name` (an ellipsis past
  `--ds-composer-chip-max-width`), `.ds-composer__attachment-size` (`DS.format.bytes()`) and a remove button named
  "Remove *name*". Uploading is the page's: it reads the files from `ds:attach` or the send.
- **Microphone**: the slot is a quiet icon button between the field and Send, with `aria-pressed` while it records;
  recording and the transcription are the page's (`composer.set({ text })` puts the words in).
- **Send and stop**: the submit button. Enter sends, Shift+Enter breaks the line, Ctrl/Cmd+Enter always sends.
  `data-ds-composer-enter="newline"` makes Enter a line break (the default on a device without a fine pointer: an
  on-screen keyboard has no Shift+Enter), `"send"` keeps it sending. While busy (`set({ busy: true })` or
  `data-ds-composer-busy` on the composer; `data-state="busy"` is the system's) the button is Stop: its
  `.ds-icon-swap` shows face b (a square), its name and tooltip turn to the string `stop`, and a press dispatches
  `ds:stop`; Enter does not send meanwhile. With nothing to send the button is `aria-disabled="true"`.
- **Commands and mentions**: a `.ds-composer__palette` (`role="listbox"`, `aria-label`, `popover="manual"`, `hidden`)
  per trigger character in `data-ds-composer-trigger`: `/` counts at the very start of the message, any other trigger
  (`@`, `#`) at the start or after a space. Typing it opens the palette at the caret, above it (below without room; `--ds-composer-palette-x` and
  `--ds-composer-palette-y` are the script's coordinates, never set them), and while it is open it stays next to the
  caret as filtering changes its height, the page scrolls and the window or the on-screen keyboard resizes;
  the text after the trigger filters the `.ds-composer__option` rows by their label (`data-label`, else
  `.ds-composer__option-label`). `data-ds-composer-filter="off"` on a palette leaves filtering to the page, which
  renders the options on `ds:query` (`{ trigger, query }`, also sent while the module filters). `.ds-composer__empty`
  shows "No results" (written by the module when the palette has none). Choosing inserts `data-value` (else the
  label) and a space.
- **Drafts**: `data-ds-composer-draft="<key>"` remembers the text through `DS.store` (namespace `composer`) while
  typing, gives it back when the page opens with an empty field, and drops it on send. One key per conversation: a
  composer reused across conversations changes the attribute, and the text typed so far stays under the old key, the
  field, the attachments and the chosen mentions are cleared, and the new key's draft comes back.

**Behaviour and API.** `data-ds-composer` on the shell (a `<form>`, or any element: a submit button inside acts the
same) attaches it on `DS.init()`; `data-ds-composer-busy`, `-draft` and `-enter` are read again when they change (only
the one that changed: a busy state set through `set({ busy })` outlives a new draft key).

```js
const composer = DS.composer.create(form, { draft: 'ticket-42', enter: 'send' });  // or DS.core.get(form, 'composer')
composer.on('send', ({ text, attachments, mentions, command }) => post(text, attachments));
composer.set({ busy: true });          // a reply runs: Send turns into Stop
composer.on('stop', () => request.abort());
composer.set({ busy: false, text: '' });
composer.add(files);                   // attach File objects; composer.remove(id) takes one off
composer.get();                        // { text, attachments, busy }
DS.composer.query('/sum', 4);          // { trigger: '/', query: 'sum', start: 0, end: 4 }
```

| Event | When | `detail` |
|---|---|---|
| `ds:send` | Enter, Ctrl/Cmd+Enter, the submit button or `send()`, with text or files; cancelable: `preventDefault()` keeps the text and the files | `{ text, attachments, mentions, command }`: `attachments` `{ id, name, size, type, file }`, `mentions` the chosen ones still in the text `{ value, id }`, `command` the chosen `/` command the text starts with, else `null` |
| `ds:stop` | the submit button while busy | `{}` |
| `ds:attach` | files were added | `{ files, attachments }` |
| `ds:remove` | an attachment was removed | `{ attachment }` |
| `ds:command`, `ds:mention` | an option of the `/` palette, of any other | `{ value, id, option }` (`id`: `data-id`, else the value) |
| `ds:query` | the word after a trigger changed | `{ trigger, query }` |

`DS.composer.create(el, options)` returns the controller (`get`, `set`, `on`, `send`, `add`, `remove`, `focus`,
`destroy`), the one the attribute path makes; `on(type, fn)` takes the event names without `ds:`.
`DS.composer.query(text, caret, triggers)` is the pure function that finds the word a palette serves.

**Accessibility.** The textarea keeps its label (`aria-label` or a `<label>`). Focus stays in the field while a palette
is open. A textarea cannot take `role="combobox"`, so the field is no full APG combobox: it exposes
`aria-autocomplete="list"`, `aria-controls` while a palette is open and `aria-activedescendant` on the active option
(`aria-selected="true"`), and the module announces the number of matches when the palette opens and whenever filtering
changes it ("Results: 3", the string `resultCount`; "No results" for none). Down and Up move the active option (round at the
ends), Enter or Tab inserts it, Escape closes the palette (`DS.overlay`, the top layer first) and it stays closed for
that word; a press outside, leaving the field or moving the caret out of the word closes it. The active option shows
the focus layer and a bar on its start edge, so it reads without colour. Attachments are a named list; adding and
removing one is announced ("Attached report.pdf", "Removed report.pdf") and a removed chip hands the focus to the next
remove button, else the field. Give the send, attach and microphone buttons names (`aria-label`) and tooltips.

**Forced colours.** The shell and the chips keep their edge (a transparent border becomes `CanvasText`), the focused
shell a `Highlight` outline, the drop state a dashed `Highlight` edge, the palette a transparent outline as its edge;
the active option is `SelectedItem` / `SelectedItemText`, a blocked one `GrayText`.

**Hooks**: `--ds-composer-radius` (`--ds-radius-2xl`), `--ds-composer-max-height` (220px), `--ds-composer-bg`
(`--ds-surface-high`), `--ds-composer-chip-height` (40px), `--ds-composer-chip-max-width` (200px),
`--ds-composer-palette-width` (320px), `--ds-composer-palette-radius` (`--ds-radius-xs`), `--ds-composer-option-height`
(40px); it reads `--ds-input-height`, `--ds-input-focus-color`, `--ds-input-font` and `--ds-input-weight` of the field
([theming.md](theming.md#component-hooks)).

**Motion.** The palette fades in on `--ds-dur-fast` and grows from `--ds-scale-popup` at the caret on the spring
(`--ds-dur-medium`); it leaves in `--ds-dur-instant`, fading only. Its transitions are keyed on `data-state`
(`DS.overlay`), so a palette closed mid-way turns back from where it is. Chips pop in and out
(`DS.motion.enter` / `leave`, `'pop'`); the send icon swaps to stop through `.ds-icon-swap`. The field's height follows
the text at once, never animated.
