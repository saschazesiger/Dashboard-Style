## Error summary

The problems of a form after a submit, at its top: a title that counts them and a link per problem to its field. It
takes the focus, so a reader starts there and a sighted person sees all of it at once. `DS.errorsummary` builds it from
the fields' own constraints and from `aria-invalid`.

```html
<form class="ds-form" novalidate>
  <div class="ds-alert ds-tone-error ds-errorsummary" data-ds-errorsummary tabindex="-1" hidden>
    [icon alertCircle 20]
    <div class="ds-alert__text">
      <h2 class="ds-alert__title ds-errorsummary__title"></h2>
      <ul class="ds-errorsummary__list"></ul>
    </div>
  </div>
  <div class="ds-field">
    <label class="ds-field__label" for="dev-name">Device name</label>
    <input class="ds-input" id="dev-name" required>
    <small class="ds-field__hint ds-field__hint--error" hidden></small>
  </div>
  <!-- more fields, then the actions -->
</form>
```

Put it first in the form (or give it `data-ds-errorsummary="<form id>"` elsewhere). The `hidden` error hint of a field
is optional: where it is there and empty, the summary writes the message at the field too.

**Options** ([options.md](options.md)).

| Option | Attribute or class | Where it applies | Effect |
|---|---|---|---|
| Form | inside it, or `data-ds-errorsummary="<form id>"` | the summary | the form whose fields it checks |
| Size, density, shape | the option classes | the summary or any ancestor | the alert's padding and corners ([Alert](#alert)) |
| Touch | `.ds-touch` | the theme or a container | each link at least `--ds-touch-target` high |
| Tone | `.ds-tone-error` | the summary | always the error's, with the icon and the words |

**Behaviour.** `DS.init()` finds `data-ds-errorsummary`.

- **Which fields**: those of the form that fail their own constraints (`required`, `type`, `pattern`, `min`, `max`,
  `maxlength` ...: `checkValidity()`) and those the page marked `aria-invalid="true"` (a check of its own), in the
  form's order. Disabled fields count for nothing. The radios of a name are one problem: one line, named by the group
  (the `role="radiogroup"`'s `aria-labelledby` or `aria-label`, else the fieldset's `<legend>`), linked to the checked
  radio or the first, every radio marked and unmarked together.
- **The words**: a field's visible error hint (`.ds-field__hint--error` with text: the page's message), else its label
  and the browser's validation message ("Device name: Please fill out this field.", the string `errorSummaryField`).
  Write your own messages for anything a person reads often: the browser's are generic and in the browser's language.
- **On submit** (capture: a submit with problems never reaches the page's handler): the submit stops; every field with
  a problem gets `aria-invalid="true"` (the system's while the problem lasts) and, in an empty hidden error hint, the
  message with its icon, linked by `aria-describedby`; the title says "There are 2 problems" (`errorSummaryOne`,
  `errorSummaryMany`); the list holds a link per problem; the summary shows and takes the focus (`tabindex="-1"`; the
  focus ring after a submit from the keyboard, and after a click where the engine honours
  `focus({ focusVisible: true })`). A link moves the focus into its field (the first control of a group) and brings it into view.
- **While fixing**: as a field is fixed (`input`, `change`) its problem leaves the list and its marks go; the summary
  hides once none is left. A field that had no problem in the list joins only on the next submit, `validate()` or
  `set()`, never while someone types. A form `reset` takes everything back.
- `novalidate` on the form (set by the system) keeps the browser's own bubbles away: the summary replaces them.
- **Events** on the summary: `ds:invalid` with `{ errors }` when it shows, `ds:change` with `{ errors }` when the list
  changes (`errors`: `[{ id, text }]`).

**JS API.**

```js
const summary = DS.errorsummary.create(el);   // or DS.core.get(el, 'errorsummary')
summary.validate();                           // false, and the summary shows (focus: false keeps the focus)
summary.set([{ field: 'serial', text: 'This serial number is taken.' }]);   // a server's answer
summary.get();                                // { errors: [{ id: 'serial', text: 'This serial number is taken.' }] }
summary.clear();
DS.errorsummary.title(3);                     // 'There are 3 problems'
```

`DS.errorsummary.create` returns the controller the attribute path makes (`get`, `set`, `validate`, `clear`, `on`,
`destroy`); `DS.errorsummary.title` is its title.

**Accessibility.** The summary is a named group (`role="group"`, `aria-labelledby` its title, both set when missing)
that takes the focus after a failed submit: a reader hears the title and moves through the links. Never show it
while someone types (only on submit, `validate()` or `set()`); the list shrinks as fields are fixed, without moving
the focus. Each field keeps its own message, so a person who follows a link hears what is wrong there.

**Forced colours.** The alert keeps its edge ([Alert](#alert)); the links are `LinkText`; the focus ring is the
system's.

**Hooks:** none of its own; the alert's.

**Motion:** none of its own: the summary shows at once and its focus ring snaps as every ring does.
