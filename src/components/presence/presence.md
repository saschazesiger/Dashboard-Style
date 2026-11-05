## Presence

Whether a person can be reached now: online, away, busy or offline, as a dot and a word.

```html
<span class="ds-presence-label"><span class="ds-presence-dot ds-presence-dot--online"></span>Online</span>
<span class="ds-presence-label"><span class="ds-presence-dot ds-presence-dot--away"></span>Away</span>
<span class="ds-presence-label"><span class="ds-presence-dot ds-presence-dot--busy"></span>Busy</span>
<span class="ds-presence-label"><span class="ds-presence-dot ds-presence-dot--offline"></span>Offline</span>
```

Each state has a shape of its own as well as a colour, so the four stay apart without colour, and a word always says
which one it is:

| State | Class | Shape | Colour (hook) |
|---|---|---|---|
| Online | `.ds-presence-dot--online` | a filled disc | `--ds-presence-online` (`--ds-success`) |
| Away | `.ds-presence-dot--away` | a ring, its lower half filled | `--ds-presence-away` (`--ds-warning`) |
| Busy | `.ds-presence-dot--busy` | a filled disc with a bar across | `--ds-presence-busy` (`--ds-error`) |
| Offline | `.ds-presence-dot--offline` | an empty ring | `--ds-presence-offline` (`--ds-outline`) |

`.ds-presence-label` sets the dot before its word on one line; the word takes the type and ink around it, so it sits
in a table cell, a persona or a menu as it is. On an avatar the dot goes in the corner and the avatar's label carries
the word ([Avatar](#avatar)). The words are the strings `presenceOnline`, `presenceAway`, `presenceBusy` and
`presenceOffline` of `DS.core.t()`, for a page that writes them from its data.

A presence is not the motion utility `.ds-presence`, which fades toggled elements in and out ([Motion
classes](#motion-classes)).

**Options** ([options.md](options.md)):

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the dot or any ancestor | 2px per step, 6 to 14px around the 10px md dot (`--ds-presence-dot-size`); the stroke is a fifth of it |
| Shape | | | not read: the dot is round at every shape, so the four shapes stay apart |
| Tone, density, touch | | | not read: each state has its colour, and a dot is no target |

**Accessibility.** The dot is decoration and needs no `aria-hidden` of its own (it has no content); the word carries the
state. A dot without a visible word takes it in `.ds-sr` inside it, or in the label of what it sits on. A presence that
changes while someone reads the page is not announced: it changes often, and a screen reader reads the word when it gets
there. Every fill holds 3:1 on the surfaces.

**Forced colours.** The shapes in `CanvasText` on `Canvas`: the filled disc, the half-filled ring, the disc with its bar
and the empty ring stay apart without their colours.

**Motion.** A state change glides the dot's colours on `--ds-dur-medium` (`--ds-ease-in-out`), as a status chip does;
the shape changes at once.

Hooks: `--ds-presence-dot-size`, `--ds-presence-ground` (the hollow of the away, busy and offline dots, `--ds-surface`:
set it where the dot lies on another ground), `--ds-presence-online`, `--ds-presence-away`, `--ds-presence-busy`,
`--ds-presence-offline` ([theming.md](theming.md#component-hooks)).

<!-- changelog -->
- Presence (3.0, new): `.ds-presence-dot` with `--online`, `--away`, `--busy` and `--offline`, each a shape of its own,
  and `.ds-presence-label` (the dot with its word); the strings `presenceOnline`, `presenceAway`, `presenceBusy`,
  `presenceOffline`.
