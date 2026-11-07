## Object page

One record on one page: the [page head](#page) with its key facts, the section anchors ([jump links](#jump-links) as a
bar) under it, and the sections as cards; an edit mode turns a section, or every section, into its inline-edit form.

```html
<div class="ds-object" data-ds-object>
  <header class="ds-page-head ds-page-head--sticky" data-ds-page-head>
    <a class="ds-btn ds-btn--text ds-sm ds-page-head__back" href="/devices">[icon arrowLeft 18]<span class="ds-sr">Back to </span>Devices</a>
    <div class="ds-page-head__row">
      <div class="ds-page-head__text"><h1 class="ds-page-head__title" id="obj-title" tabindex="-1">LAPTOP-0042</h1></div>
      <div class="ds-page-head__actions">
        <button class="ds-btn" type="button" data-ds-object-cancel hidden>Cancel</button>
        <button class="ds-btn ds-btn--filled" type="button" data-ds-object-save hidden>Save all</button>
        <button class="ds-btn ds-btn--filled" type="button" data-ds-object-edit>Edit</button>
      </div>
    </div>
    <dl class="ds-page-head__details">
      <div class="ds-page-head__detail"><dt>Owner</dt><dd>Ada Lovelace</dd></div> ...
    </dl>
  </header>
  <nav class="ds-toc ds-toc--bar ds-toc--sticky" aria-label="Sections" data-ds-toc>
    <ol class="ds-toc__list"><li><a class="ds-toc__link" href="#general">General</a></li> ...</ol>
  </nav>
  <section class="ds-card ds-object__section" id="general" aria-labelledby="general-title">
    <div class="ds-object__head">
      <h2 class="ds-object__title" id="general-title">General</h2>
      <button class="ds-btn ds-btn--text ds-sm ds-object__edit" type="button" data-ds-object-edit aria-describedby="general-title">Edit</button>
    </div>
    <div class="ds-object__view">
      <dl class="ds-facts ds-facts--rows"><div><dt>Name</dt><dd>LAPTOP-0042</dd></div> ...</dl>
    </div>
    <form class="ds-form ds-object__form" hidden>
      <div class="ds-form-grid"> <div class="ds-field"> ... </div> </div>
      <div class="ds-form-actions">
        <button class="ds-btn" type="button" data-ds-object-cancel>Cancel</button>
        <button class="ds-btn ds-btn--filled" type="submit">Save</button>
      </div>
    </form>
  </section>
  ...
</div>
```

| Part | What |
|---|---|
| `.ds-object` | the page: a column, `--ds-object-gap` (`--ds-space-5`) between the parts |
| `.ds-page-head` | the head with its key facts (`.ds-page-head__details`); sticky and condensing with `.ds-page-head--sticky` and `data-ds-page-head` ([Page](#page)) |
| `.ds-toc--bar` | the section anchors: a sticky bar of jump links that sticks right under the head and marks the section being read |
| `.ds-object__section` | a section, on a `.ds-card`; a jump lands with its title clear of the head and the bar (`scroll-margin-top`) |
| `.ds-object__head`, `.ds-object__title` | the section's title row: the title in the title role, the edit action at its end |
| `.ds-object__edit` | the section's edit action (a small text button whose text ends on the card's edge); gone while the section edits |
| `.ds-object__view`, `.ds-object__form` | the two faces of a section: what it shows, and its form (a `.ds-form`, hidden until it edits) |

Options: size, density, shape and tone reach the controls and cards inside (each computes its own); the object page's
own rhythm is layout. The head and the bar stick one under the other: the module writes the head's height as
`--ds-object-head` and the bar's as `--ds-object-bar` on the `.ds-object` (runtime properties: read, never set). Status in
the head (a `.ds-status` in `.ds-page-head__status`) carries its icon and word.

### Behaviour: `data-ds-object`

`data-ds-object` on the `.ds-object` (`DS.init()` finds it; `DS.object.create(el)` is the imperative path, with the same
controller):

- **Edit a section.** A `[data-ds-object-edit]` button in a section turns it into its form: the view hides, the form
  enters (`DS.motion.enter(form, 'swap')`), the focus goes to its first field, a screen reader hears "Editing General"
  (the string `editing`), and the section takes `data-editing`.
- **Edit mode.** A `[data-ds-object-edit]` button outside the sections (in the head) turns every section that has a form
  into it (a read-only section, such as a history without a `.ds-object__form`, stays as it is);
  the `.ds-object` takes `data-editing`, that button hides and the `[data-ds-object-save]` and `[data-ds-object-cancel]`
  buttons outside the sections show (the module owns their `hidden`; render them `hidden`).
- **Save.** Submitting a section's form (its submit button, Enter in a field) sends `ds:save` on the section:
  `{ section, id, form, values }` (`values`: the form's entries, a repeated name as a list). Unless a listener cancels
  it, the view comes back, the focus goes to the section's edit action and a screen reader hears "General saved" (the
  string `saved`). A page that saves on a server cancels `ds:save`, shows the busy state on the submit button
  (`DS.motion.busy()`), and calls `done(section)` once saved; an error stays in the form ([Form](#form)). A form
  with `novalidate` (the system's error hints instead of the browser's) validates in that listener: it cancels
  `ds:save`, marks the fields (`aria-invalid="true"` and a `.ds-field__hint--error`), focuses the first and does not
  call `done()`.
  `[data-ds-object-save]` outside the sections submits every form that edits (each validates first) as one batch: the
  focus stays put while the sections save and goes to the head's edit once the last one is done (to the first field of
  a section that is still open when one did not validate).
- **Cancel.** `[data-ds-object-cancel]` in a section, or Escape in its form (unless a popup in it is open), sends
  `ds:cancel` (`{ section, id, form }`); unless cancelled (unsaved changes the page wants confirmed), the form resets
  and the view comes back. Outside the sections it cancels every section that edits.
- `ds:edit` (cancelable) on the section before it turns; `ds:change` (`{ editing }`, the ids that edit) on the `.ds-object`.

The controller (`DS.get(el, 'object')`, or what `create()` returns): `get()` (the ids of the sections that edit),
`set(ids)` (`true` for all that have a form, `false` for none), `edit(section)`, `save(section)`, `cancel(section)` (no argument: every
section), `done(section)`, `on(type, fn)` and `destroy()`. `DS.object.values(entries)` is the mapping of a form's
entries alone.

What the module writes is owned state (`DS.dom.morphHtml` keeps it): `hidden` on the faces and on the buttons outside
the sections, `data-editing` on the sections and the `.ds-object`.

- Keyboard and names: the record is the page's `h1` (the head's title), each section a region named by its own title; the edit
  action of a section is described by it (`aria-describedby`), so it reads "Edit, General". Entering the form moves the
  focus to its first field, leaving it back to the edit action; Escape cancels. The anchors are links (Tab), the head's
  actions and the More menu as in [Page](#page).
- Forced colours: the cards keep their edges; a section that edits shows its form, so the state is never a colour.
  Print leaves the bar and the edit actions off the paper.
- Hooks: [theming.md](theming.md#component-hooks).

**Motion:** a section's faces swap with `.ds-enter--swap` (the form in, then the view back); the head condenses and the
bar's mark glides as on their own (Page, Jump links).

<!-- changelog
- Object page (`.ds-object`, `DS.object`, `object.js`): one record on one page, the page head with its key facts, the
  section anchors as a sticky bar of jump links under it, sections as cards, and an edit mode that turns a section or
  every section into its inline form (`ds:edit`, `ds:save` with the form's values, `ds:cancel`, `done()`).
-->
