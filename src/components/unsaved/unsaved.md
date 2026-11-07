## Unsaved-changes guard

Keeps a form's edits from getting lost: it knows what changed, shows it in a [Save bar](#save-bar), saves on Ctrl+S
(Command+S on Apple systems), warns before the page unloads and asks before an in-app navigation throws the edits away.

```html
<main class="ds-view" id="main" tabindex="-1">
  <div class="ds-content">
    <form class="ds-form" data-ds-unsaved aria-labelledby="device-title">
      <div class="ds-field">
        <label class="ds-field__label" for="name">Device name <span class="ds-field__changed ds-sr">(changed)</span></label>
        <input class="ds-input" id="name" name="name" value="LAPTOP-0042">
      </div>
      ...
    </form>
  </div>
  <div class="ds-savebar">
    <div class="ds-savebar__bar ds-presence" role="region" aria-label="Unsaved changes" hidden>
      <p class="ds-savebar__text ds-unsaved__count" data-ds-unsaved-count></p>
      <div class="ds-savebar__actions">
        <button class="ds-btn ds-btn--text" type="button" data-ds-unsaved-discard>Discard</button>
        <button class="ds-btn ds-btn--filled" type="button" data-ds-unsaved-save><span class="ds-btn__faces"> ... </span></button>
      </div>
    </div>
  </div>
</main>
<nav data-ds-unsaved-link> <a href="/devices">Devices</a> ... </nav>   <!-- links that ask first -->
```

```js
form.addEventListener('ds:save', (event) => event.detail.waitUntil(api.saveDevice(new FormData(form))));
form.addEventListener('ds:discard', () => tags.set(savedTags));          // what the page holds itself
DS.unsaved.navigate(() => router.go('/devices'));                       // asks first while something is unsaved
const guard = DS.get(form, 'unsaved');                                  // or DS.unsaved.create(form, options)
```

- **What changed.** The values of the form's fields when the guard starts are the baseline; every `input`, `change`
  and `ds:change` inside the form (a [key-value editor](#key-value-editor), a combobox) compares the fields with it.
  Buttons and fields with `data-ds-unsaved-ignore` stay out; hidden inputs count. A change undone by hand is no change.
  `check()` compares again after a script set a value.
- **Shown.** The number of changed fields (a radio group counts once) goes into every `[data-ds-unsaved-count]` of the
  form and its bar ("2 unsaved changes"; with `.ds-unsaved__count`, in tabular figures, so it keeps its width). The `.ds-field` of a changed control takes Form's
  `.ds-field--changed` (a dot after the label, "(changed)" in the label's name; the guard adds the
  `.ds-field__changed` word where the label has none); `data-ds-unsaved-marks="off"` leaves the fields alone.
- **The save bar** shows through `DS.overlay.savebar()` while something is changed and hides once nothing is. It is
  `data-ds-unsaved-savebar` (a selector; `off` for none), else a `.ds-savebar` inside the form, else the one of the
  form's `.ds-view`. Without one, the count still shows where the page put it.
- **Save.** `[data-ds-unsaved-save]`, Ctrl+S (`data-ds-unsaved-hotkey`: another combo of
  [DS.hotkeys](core.md#hotkeys), or `off`) and `save()` send a cancelable `ds:save` (`{ changed, waitUntil(promise) }`).
  Hand the save to `waitUntil()` (or the option `onSave`): the save button shows its busy face
  (`DS.motion.busy()`, [Button](#button)); when the promise resolves, the values become the new baseline, the bar hides
  and "Changes saved." is spoken; when it rejects, everything stays and "Not saved. Your changes are still here." is
  spoken at once. Without either, the form is submitted (`requestSubmit()`, with the browser's own checks) and the page
  calls `commit()` once it saved. The shortcut counts while the form is on screen, also from its fields; with several
  guards on screen, the one the focus is in takes it.
- **Discard.** `[data-ds-unsaved-discard]` and `discard()` put every field back to the baseline, send `ds:discard`
  (`{ changed }`) for what the page holds outside the fields, hide the bar and say "Changes discarded."; focus goes back
  into the form (the save bar's `focusTarget`: the first field).
- **Leaving.** While something is unsaved the browser asks before the page unloads (`beforeunload`, listened to only
  while something is unsaved, so the page keeps its back-forward cache otherwise). A native submit that goes through
  leaves without the question. `DS.unsaved.navigate(go, options)` asks in a dialog first (`DS.overlay.confirm()`:
  "Leave without saving?", "Discard changes" in the error tone (D10), "Keep editing" with the first focus) and runs
  `go()` when the person agrees or nothing is unsaved; it resolves whether it went. Once `go()` resolved, the guards it
  asked for drop their changes quietly (`ds:discard`, no focus move): a route that keeps the form shows it clean and
  without the bar, and the next edit warns again before an unload. A link inside
  `[data-ds-unsaved-link]` does the same by itself (a plain click; a new tab, a download or another target goes as it
  is).

**JS API.** `DS.get(form, 'unsaved')` or `DS.unsaved.create(form, { savebar, hotkey, marks, onSave })` return the
controller: `get()` (`{ dirty, count, changed }`), `set(false)` (what the fields hold is saved, as `commit()`),
`set(true)` (unsaved whatever the fields say, for a change the guard cannot see), `check()`, `commit()`, `discard()`,
`save()` (resolves whether it saved), `on(type, fn)` (`change`, `save`, `saved`, `discard`, `error`) and `destroy()`
(also when the form leaves the page: a bar outside the form hides, unless another guard that shares it holds
changes).
Events on the form: `ds:change` (`{ dirty, count, changed }`) when the changes change, `ds:save` (cancelable),
`ds:saved`, `ds:discard` and `ds:error` (`{ error }`). `data-ds-dirty` on the form says that something is unsaved. The
helpers: `DS.unsaved.isDirty(root)` (whether a guard in `root` holds changes), `DS.unsaved.navigate(go, options)`
(`root`, `opener`, `title`, `text`, `confirmLabel`, `cancelLabel`), `DS.unsaved.snapshot(form)` (the fields' state) and
`DS.unsaved.diff(before, after)` (what differs).

**Options** ([options.md](options.md)): the guard draws nothing of its own.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size, density, shape, touch | the usual classes | any container | the bar, fields and buttons compute their own ([Save bar](#save-bar), [Form](#form), [Button](#button)) |
| Tone | none | | a changed field shows a dot and the word "(changed)"; the bar says the count in words |

**Keyboard and names.** Ctrl+S or Command+S saves from anywhere in the form or its bar (the shortcut sheet lists it as
"Save changes"); Tab reaches the bar's buttons after the form. The bar is a `role="region"` named "Unsaved changes"; a
changed field's label adds "(changed)" to its name; save, failure and discard are spoken through the announcer
([DS.a11y](core.md#accessibility-helpers)). The dialog of `navigate()` is an alertdialog whose first focus is "Keep
editing"; Escape keeps editing.

**Forced colours.** The bar, the changed dot and the buttons are their components': the bar keeps its edge, the dot
turns `CanvasText`.

**Motion:** the save bar rises on the spring and leaves faster (`.ds-presence`), a changed field's dot fades in on
`--ds-dur-fast` and out on `--ds-dur-instant` (Form), and a save plays the button's busy and done faces.

**Strings:** `unsavedOne`, `unsavedMany`, `unsavedSaveKey`, `unsavedSaved`, `unsavedFailed`, `unsavedDiscarded`,
`unsavedLeaveTitle`, `unsavedLeaveText`, `unsavedLeave`, `unsavedStay` and `unsavedChangedWord`
([install.md](install.md#language-and-locale)).
