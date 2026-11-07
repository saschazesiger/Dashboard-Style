## Persona

A person (or an entity) in one block: the [avatar](#avatar), the name, a role and a status. For a list row, a table
cell, a card head or the owner of a ticket.

```html
<div class="ds-persona">
  <span class="ds-avatar ds-avatar--hue-3" aria-hidden="true">AL<span class="ds-presence-dot ds-presence-dot--online"></span></span>
  <span class="ds-persona__text">
    <span class="ds-persona__name">Ada Lovelace</span>
    <span class="ds-persona__role">Field engineer</span>
    <span class="ds-persona__status">
      <span class="ds-presence-label"><span class="ds-presence-dot ds-presence-dot--online"></span>Online</span>
    </span>
  </span>
</div>

<a class="ds-persona ds-pressable" href="/people/ada">                      <!-- opens the profile -->
  <span class="ds-avatar" data-ds-avatar="Ada Lovelace" aria-hidden="true"></span>
  <span class="ds-persona__text"><span class="ds-persona__name">Ada Lovelace</span><span class="ds-persona__role">ada@example.com</span></span>
</a>

<span class="ds-persona ds-persona--inline ds-sm">                          <!-- one line, in running text or a cell -->
  <span class="ds-avatar" aria-hidden="true">AL</span>
  <span class="ds-persona__text"><span class="ds-persona__name">Ada Lovelace</span><span class="ds-persona__role">Field engineer</span></span>
</span>
```

| Part | What |
|---|---|
| `.ds-persona__text` | the column of lines; it may shrink, and each line ends in an ellipsis rather than wrap |
| `.ds-persona__name` | the name, in the size's type role (`--ds-persona-name-font`), `--ds-text` |
| `.ds-persona__role` | a role, a team or an address, in `--ds-font-meta` (`--ds-persona-role-font`), `--ds-text-2` |
| `.ds-persona__status` | a status line in the role's type and ink, usually a `.ds-presence-label` ([Presence](#presence)) |

| Variant | Class | Look |
|---|---|---|
| Default | | the avatar at the start, the lines beside it, centred on it |
| Stacked | `.ds-persona--stacked` | the avatar above, the lines centred under it: the head of a profile card or a people grid |
| Inline | `.ds-persona--inline` | one line: the name, then the role |
| Interactive | `<a class="ds-persona ds-pressable">` or a `<button>` | opens something (a profile): the state layer, focus ring and ripple of `.ds-pressable` ([Utilities](#a-pressable-element-of-your-own)), a little room around its content, at least `--ds-target-min` high; `disabled` or `aria-disabled="true"` turn the text `--ds-disabled-ink` |

**Options** ([options.md](options.md)):

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the persona or any ancestor | the avatar 16 to 48px, the name in the size's type role (`--ds-size-font`), the gap 2px per step (8 to 16px around `--ds-persona-gap`) |
| Shape | `.ds-shape-*` | any container | the avatar's and the pressable's radius (theirs) |
| Touch | `.ds-touch` | any container | an interactive persona is at least `--ds-target-min` high |
| Density, tone | | | not read: a persona sits in a row that has its own density, and its status says itself in words |

**Accessibility.** The avatar is `aria-hidden`: the name beside it names the person once. A status is a word, in
`.ds-persona__status` or in a visible line; the avatar's dot alone never says it. An interactive persona is a link or a
button whose name is its text ("Ada Lovelace Field engineer"); `Tab` reaches it, `Enter` (and `Space` on a button) opens
it.

**Forced colours.** The text takes the system colours by itself (`GrayText` when blocked); the avatar and the presence dot
keep their own forced looks.

**Motion.** None of its own: the pressable's state layer and focus snap.

Hooks: `--ds-persona-gap`, `--ds-persona-name-font`, `--ds-persona-role-font` ([theming.md](theming.md#component-hooks)).

<!-- changelog -->
- Persona (3.0, new): `.ds-persona` with `__text`, `__name`, `__role` and `__status`, the variants `--stacked` and
  `--inline`, and an interactive persona with `.ds-pressable`; hooks `--ds-persona-gap`, `--ds-persona-name-font`,
  `--ds-persona-role-font`.
