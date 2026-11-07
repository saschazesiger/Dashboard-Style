## Avatar

A person as a disc, or an entity (a team, a device, a service) as a rounded square: a picture, initials or an icon.

```html
<span class="ds-avatar" role="img" aria-label="Ada Lovelace">AL</span>                     <!-- initials, the tint -->
<span class="ds-avatar" data-ds-avatar="Ada Lovelace"></span>                               <!-- avatar.js: initials, hue, label -->
<span class="ds-avatar ds-sm" aria-hidden="true">AL</span> Ada Lovelace                      <!-- next to the name -->
<span class="ds-avatar" role="img" aria-label="Ada Lovelace"><img src="/people/ada.jpg" alt=""></span>
<img class="ds-avatar" src="/people/ada.jpg" alt="">                                        <!-- a picture next to the name -->
<span class="ds-avatar" role="img" aria-label="Unknown user">[icon user 20]</span>
<span class="ds-avatar ds-avatar--square" role="img" aria-label="Build service">[icon server 20]</span>
```

A disc of `--ds-avatar-size` (32px at size md, 8px per size step: `.ds-xs` 16, `.ds-sm` 24, `.ds-lg` 40, `.ds-xl` 48px)
on the tint (`--ds-avatar-bg` / `--ds-avatar-color`: `--ds-accent` / `--ds-on-accent`), the initials in the size's
type role, a picture covering it, an icon at 60% of its side. The shape multiplies its radius: a disc from the default
up, square at `.ds-shape-square`. An avatar next to the visible name is `aria-hidden` (or an `<img alt="">`); one alone
names the person (`role="img"` and `aria-label`, or a button's or link's own name).

### Colour from the name

`.ds-avatar--hue-1`, `.ds-avatar--hue-2`, `.ds-avatar--hue-3`, `.ds-avatar--hue-4`, `.ds-avatar--hue-5` and `.ds-avatar--hue-6`
give an avatar a colour of its own, so a list of people reads apart: a chart
role (`--ds-chart-1` to `--ds-chart-4`, the neutral chart mark and a mix of the second and fourth) mixed into the surface
(24%) behind the same role mixed into the text (60%). Every pair holds 4.5:1 in the default palette, the shipped themes
and every preset, light and dark (tested). The hue follows the name, so a person has the same colour on every page:

```js
DS.avatar.hue('Ada Lovelace');       // 1 ... 6
DS.avatar.initials('Ada Lovelace');  // 'AL'
```

`hue(name)` is FNV-1a (32 bit) over the UTF-8 bytes of the name (trimmed, NFC, lower case), modulo 6, plus 1, so a server
that renders the class itself agrees with the script. `initials(name, max)` takes the first letter of the first and the
last word, upper case (`max` 1: the first only, for `.ds-xs`); words in brackets are left out and an e-mail address
counts by its local part (`ada.lovelace@...` gives `AL`).

### Status, activity ring, corner badge

```html
<span class="ds-avatar" role="img" aria-label="Ada Lovelace, online">AL<span class="ds-presence-dot ds-presence-dot--online"></span></span>
<span class="ds-avatar ds-avatar--ring" role="img" aria-label="Ada Lovelace, new activity">AL</span>
<span class="ds-avatar ds-avatar--ring ds-tone-success" role="img" aria-label="Ada Lovelace, speaking">AL</span>
<span class="ds-avatar" role="img" aria-label="Ada Lovelace, 3 unread">AL<span class="ds-badge">3</span></span>
<span class="ds-avatar" role="img" aria-label="Ada Lovelace, new messages">AL<span class="ds-badge ds-badge--dot ds-tone-error"></span></span>
```

- **Status**: a `.ds-presence-dot` ([Presence](#presence)) at the bottom end corner, on the curve, on an edge ring of
  `--ds-avatar-edge-color` (`--ds-surface`: set it where the avatar lies on another ground). Its four states differ in
  shape, and the avatar's label carries the word ("Ada Lovelace, online"), never the colour alone.
- **Activity ring** (`.ds-avatar--ring`): a ring of `--ds-avatar-ring-color` (`--ds-primary`; a `.ds-tone-*` class on
  the avatar itself: that tone) beyond the edge ring. It says "something new" or "speaking": the label says which.
- **Corner badge**: a `.ds-badge` ([Badge](#badge)) at the top end corner on the edge ring: a count centred on the
  corner of the box (so it covers less of the initials), a dot on the curve; its word in the label.

The avatar's overflow stays visible, so the corner parts are never cut; a picture inside clips itself to the radius.

### Interactive avatars

`<button class="ds-avatar">` or `<a class="ds-avatar" href>` opens something (a profile, the account menu): a state
layer over the picture (hover inside `@media (hover: hover)`, the press in `--ds-dur-micro`, the focus layer with the
ring), the focus ring that snaps in (`outline-offset`, `--ds-dur-fast`), and a hit area of `--ds-target-min` around the
disc (`.ds-touch`: 48px), while the disc keeps its size. `:disabled` and `aria-disabled="true"` show the disabled model
(`--ds-disabled-fill` and `--ds-disabled-ink`, a picture faded to `--ds-state-disabled`, on `--ds-dur-fast`) and no layer.

No ripple and no morph: a ripple host clips while a ripple is inside, which would cut the status dot and the badge on the
corner, so an interactive avatar presses through its state layer (the exception in `meta.json`), until each ripple clips
itself. A disc is a face, not a pill: it never morphs.

### Group

```html
<div class="ds-avatar-group" role="group" aria-label="Assigned to" data-ds-avatar-group data-ds-avatar-group-max="4">
  <span class="ds-avatar" data-ds-avatar="Ada Lovelace"></span>
  <span class="ds-avatar" data-ds-avatar="Grace Hopper"></span>
  <a class="ds-avatar" href="/people/joan" data-ds-avatar="Joan Clarke"></a>
  <span class="ds-avatar" data-ds-avatar="Alan Turing" data-ds-avatar-status="away"></span>
  <span class="ds-avatar" data-ds-avatar="Katherine Johnson"></span>
  <span class="ds-avatar" data-ds-avatar="Margaret Hamilton"></span>
  <button class="ds-avatar ds-avatar-group__more" type="button" aria-haspopup="menu" aria-expanded="false"
          aria-controls="people-more" data-ds-open="#people-more"></button>
  <div class="ds-menu" role="menu" id="people-more" hidden></div>
</div>
```

`.ds-avatar-group` stacks its avatars, each a quarter over the one before, every one on its edge ring
(`--ds-avatar-edge-color`); `.ds-avatar-group--spread` sets them side by side. A size class on the group sizes them all.
`.ds-avatar-group__more` is the neutral "+N" (`--ds-surface-high`, `--ds-text`).

`data-ds-avatar-group` with `data-ds-avatar-group-max` (default 4): past the maximum the group shows `max - 1` avatars and
"+N", so it never grows past `max` discs. It hides the rest (`hidden`, owned), writes the text of the "+N" button
(`avatarOverflow`, "+3") and its name (`avatarMore`, "3 more"), and fills the menu the button opens (`aria-controls`, else
`data-ds-open`) with one `.ds-menu__item` per hidden avatar: its face at `.ds-sm`, its name, its status word. A linked
avatar becomes a link; any other a button that sends `ds:select` (`detail: { avatar, name }`) on the group and presses the
avatar it stands for when that one is a button. Menu items are actions: when the avatars are neither links nor buttons,
the page handles `ds:select` (open the person's profile, say), so an item never does nothing. It follows avatars added,
removed or renamed. The menu opens and closes through `DS.overlay` (`data-ds-open`): the [Menu](#menu)'s keys, Escape
and focus return. When the group shrinks while focus is on "+N" or in its menu, focus stays in the group: a menu with
nothing left to list closes (`DS.overlay.close`) and focus goes to the last interactive avatar shown, else to the group
itself (`tabindex="-1"`, owned); a focused item that goes passes focus to the item now at its place. Without the script,
render the "+N" yourself.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the avatar, the group or any ancestor | 8px per step, 16 to 48px; the type role of the size; a status dot 2px per step (6 to 14px) |
| Shape | `.ds-shape-*` | any container or the theme | multiplies the radius: a disc from the default up, square at 0; `--square` at most a quarter of the side; the corner parts follow the curve |
| Touch | `.ds-touch` | any container | an interactive avatar's hit area grows to `--ds-target-min`; the disc keeps its size |
| Tone | `.ds-tone-*` | on a `.ds-avatar--ring` itself | the ring's colour; the label says what it means |
| Density | | | not read: an avatar is the size of a face; a dense row takes a smaller size class |

`.ds-avatar--sm` and `.ds-avatar--lg` are **deprecated** (3.0, removed when 3.0 ships): `.ds-sm` and `.ds-lg`, also on any
ancestor. Until then they keep the fixed 2.x discs (24 and 40px). The account avatar of the app frame
(`.ds-account__avatar`) is the same disc.

### Behaviour: `data-ds-avatar`

`data-ds-avatar="<name>"` (with `DS.init()`): the initials go in where the markup has no content of its own (a picture,
an icon, a text; `data-ds-avatar-initials="1"`: one letter), the hue class where it has none, and the name as the label
where the avatar is no `aria-hidden` decoration: `role="img"` and `aria-label` (a button or link keeps its role; an
`<img>` gets `alt`), the page's own `aria-label` kept as the name. `data-ds-avatar-status` (`online`, `away`, `busy`,
`offline`) adds the status dot and its word: "Ada Lovelace, Online" (`avatarStatus`, `presenceOnline` ...). What it writes
is owned, so a re-render with `DS.dom.morphHtml` keeps it; a page that renders the initials itself writes
`DS.avatar.initials(name)` into its template.

```js
const ada = DS.avatar.create(el, { name: 'Ada Lovelace', status: 'online' });   // or DS.core.get(el, 'avatar')
ada.set({ status: 'away' });           // a missing key stays; status: null takes the dot away
ada.get();                             // { name: 'Ada Lovelace', status: 'away' }
ada.on('change', ({ name, status }) => { /* also a bubbling ds:change on the avatar */ });

const team = DS.avatar.group(groupEl, { max: 3 });                                // or DS.core.get(groupEl, 'avatar-group')
team.get();                            // { max: 3, shown: 2, hidden: 4 }
team.set(5);
```

| Export | What |
|---|---|
| `DS.avatar.initials(name, max)` | the initials of a name (default two letters) |
| `DS.avatar.hue(name)` | the hue class of a name, 1 to 6 |
| `DS.avatar.create(el, { name, status })` | the controller of one avatar: `get()`, `set(name or { name, status })`, `on('change')`, `destroy()` |
| `DS.avatar.group(el, { max })` | the controller of a group: `get()` (`{ max, shown, hidden }`), `set(max)`, `on('change')`, `destroy()` |

### Accessibility

- One name per person: an avatar next to the visible name is `aria-hidden`; one alone has a label. A status, a ring or a
  badge add their word to that label ("Ada Lovelace, online, 3 unread"): colour never says it alone.
- A group is `role="group"` with a label ("Assigned to"); hidden avatars are out of the reading order, and the "+N" button
  names how many more there are ("3 more") and opens a menu (`aria-haspopup="menu"`, `aria-expanded`) that lists them.
- Keyboard: interactive avatars and the "+N" button are tab stops; `Enter` or `Space` presses them; in the menu
  `ArrowUp`, `ArrowDown`, `Home`, `End` and type-ahead move, `Escape` closes back to the button.

### Forced colours

The disc keeps its edge (a transparent outline that turns visible); the state layer goes, the focus ring stays; a blocked
avatar is `GrayText`; the activity ring becomes a `Highlight` outline beyond the edge. A status dot and a badge keep their own forced looks (the
dot's shapes in `CanvasText`).

### Motion

None of its own: the state layer fades on `--ds-dur-fast` (the press in `--ds-dur-micro`), the ring snaps in; a badge on
the corner pops in and out through `DS.badge`; a status dot glides its colours ([Presence](#presence)).

Hooks: `--ds-avatar-size`, `--ds-avatar-bg`, `--ds-avatar-color`, `--ds-avatar-font`, `--ds-avatar-square-radius`,
`--ds-avatar-edge-color`, `--ds-avatar-ring-color` ([theming.md](theming.md#component-hooks)).

<!-- changelog -->
- Avatar (3.0): `.ds-avatar` moves out of the app frame into a component of its own, with `.ds-avatar--hue-1` ... `-6`
  (a colour from the name, 4.5:1 in every theme), `.ds-avatar--square` (entities), `.ds-avatar--ring` (activity), a
  status dot (`.ds-presence-dot`) and a corner badge (`.ds-badge`) that are never cut, interactive avatars (state layer,
  focus ring, touch hit area), and `.ds-avatar-group` with `--spread` and `__more`. `DS.avatar` (`initials`, `hue`,
  `create`, `group`), `data-ds-avatar` and `data-ds-avatar-group`. New strings: `avatarStatus`, `avatarMore`,
  `avatarOverflow`. An avatar's overflow is visible now (2.x clipped it); a picture inside clips itself.
