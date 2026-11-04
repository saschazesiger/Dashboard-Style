## Password

A password to enter or to choose: `DS.password` adds the reveal, a strength meter and a caps-lock hint to a password
field of [Form](#form), each where its markup is.

```html
<div class="ds-field" data-ds-password>
  <label class="ds-field__label" for="pw">New password</label>
  <div class="ds-input-group">
    <input class="ds-input" id="pw" name="password" type="password" autocomplete="new-password" minlength="12"
           aria-describedby="pw-strength pw-caps">
    <span class="ds-input-group__trailing">
      <button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Show password" aria-pressed="false">
        <span class="ds-icon-swap"><span class="ds-icon-swap__a">[icon eye 18]</span><span class="ds-icon-swap__b">[icon eyeOff 18]</span></span></button>
    </span>
  </div>
  <div class="ds-password__meter" id="pw-strength">
    <span class="ds-password__bars" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
    <span class="ds-password__strength"></span>
  </div>
  <small class="ds-field__hint ds-field__hint--warning ds-password__caps" id="pw-caps" hidden>[icon alert 16]Caps Lock is on.</small>
</div>

<!-- signing in: the reveal and the caps-lock hint, no meter -->
<div class="ds-field" data-ds-password>
  <label class="ds-field__label" for="current">Password</label>
  <div class="ds-input-group">
    <input class="ds-input" id="current" type="password" autocomplete="current-password" aria-describedby="current-caps">
    <span class="ds-input-group__trailing"><button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Show password" aria-pressed="false">...</button></span>
  </div>
  <small class="ds-field__hint ds-field__hint--warning ds-password__caps" id="current-caps" hidden>[icon alert 16]Caps Lock is on.</small>
</div>
```

**Options** ([options.md](options.md)).

| Option | Classes, attributes | Where it applies | Effect |
|---|---|---|---|
| Parts | the reveal button (`aria-pressed`), `.ds-password__meter`, `.ds-password__caps` | inside `[data-ds-password]` | each is optional: a sign-in field has no meter |
| Minimum length | `minlength` on the input, else `data-ds-password-min` (default 8) | the input, the root | shorter scores Weak |
| Size, density, shape, touch | the option classes | the field or any ancestor | the field and the reveal button as in [Form](#form) and [Button](#button); the bars' corners times `--ds-shape`; the meter's type stays `--ds-font-meta` |
| Tone | | | none: the level is the meaning, in words and in the number of bars |

**Behaviour.** `DS.init()` finds `data-ds-password`.

- **Reveal**: the button with `aria-pressed` in the field's group toggles the input between `password` and `text`. Its
  name stays "Show password" and `aria-pressed` says the state (the icon swap follows it); the caret and the selection
  stay. While the text shows, spell checking and capitalisation are off (a spell checker may send what it reads to a
  server). A submit of the form hides it again, so a password manager sees a password field. A button without a name
  gets the string `showPassword`.
- **Strength**: on every input the meter fills one to four bars and says the level: Weak (one bar, error colour), Fair
  (two, warning), Good (three, success), Strong (four, success), as "Password strength: Fair"; empty, it shows nothing
  and keeps its room. `data-level` (0 to 4) on the meter is written by the system. The score: shorter than the minimum
  or a common password (with digits or marks around it) is Weak; else the length times the variety of characters, a
  repeat or a run along the alphabet, the digits or a keyboard row counting a quarter. It is a guide, not a policy:
  the server decides what it accepts, and a page with a dictionary-based estimator passes `score`.
- **Caps lock**: while the field has the focus and Caps Lock is on, `.ds-password__caps` shows (the system removes
  `hidden`) and is announced once; blur hides it. Without text of its own it says the string `capsLock`.
- **Events**: `ds:change` with `{ strength, text }` on the root when the level changes, `ds:reveal` with
  `{ revealed }`.

**JS API.**

```js
const pw = DS.password.create(field, { minLength: 12, score: (value) => zxcvbn(value).score });
pw.get();                       // { revealed: false, strength: 3, capsLock: false }
pw.set({ revealed: true });
pw.on('change', ({ strength, text }) => submit.toggleAttribute('aria-disabled', strength < 3));
DS.password.strength('correct horse battery staple');   // 4
```

`DS.password.create` returns the controller the attribute path makes (`get`, `set`, `on`, `update`, `destroy`);
`DS.password.strength` is the scoring behind the meter.

**Accessibility.** The input's `aria-describedby` names the meter and the caps-lock hint, so the level and the
warning are read with the field (the system takes the hint's id out while it is hidden, since a hidden description is
still read, and puts it back while it shows); a changed level is also announced once typing pauses (`--ds-delay-tooltip`), the
caps-lock warning at once. The bars are `aria-hidden`: the words carry the level. Use `autocomplete="new-password"`
when choosing one and `current-password` when signing in, and never block pasting.

**Forced colours.** A filled bar is `CanvasText`, an empty one a `CanvasText` outline; the word says the level. The
reveal button is a system button with its pressed state in `Highlight`.

**Hooks:** `--ds-password-meter-width` (240px), `--ds-password-bar-height` (4px)
([theming.md](theming.md#component-hooks)).

**Motion:** a bar's colour changes on `--ds-dur-fast`; the reveal's icons swap as every `.ds-icon-swap`.

<!-- changelog
- Password (`DS.password`, `[data-ds-password]`, `.ds-password__meter`, `.ds-password__bars`, `.ds-password__strength`,
  `.ds-password__caps`, hooks `--ds-password-meter-width`, `--ds-password-bar-height`): reveal with the caret kept and
  spell checking off, a four-level strength meter in words, a caps-lock hint. Strings `showPassword`, `capsLock`,
  `passwordStrength`, `strengthWeak`, `strengthFair`, `strengthGood`, `strengthStrong`.
-->
