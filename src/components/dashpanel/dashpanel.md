## Dashboard panel

A titled block of a dashboard (a chart, a table, a list, a few figures) with a menu at its end and the states its data
goes through: loading, refreshing, failed, nothing to show. Panels sit in a grid and fill their cell's height, so a row
of panels lines up whatever each one shows:

```html
<div class="ds-grid-2">
  <section class="ds-dashpanel" aria-labelledby="p-tickets">
    <header class="ds-dashpanel__head">
      <div class="ds-dashpanel__heading">
        <h3 class="ds-dashpanel__title" id="p-tickets">Tickets per day</h3>
        <p class="ds-dashpanel__subtitle">Last 7 days</p>
      </div>
      <div class="ds-dashpanel__actions">
        <button class="ds-btn ds-btn--icon ds-btn--quiet ds-sm" type="button" aria-label="Actions for tickets per day"
                aria-haspopup="menu" aria-expanded="false" aria-controls="p-tickets-menu" data-ds-open="#p-tickets-menu">[icon moreVertical 18]</button>
        <div class="ds-menu" id="p-tickets-menu" role="menu" aria-label="Tickets per day" hidden> ... </div>
      </div>
      <span class="ds-loadbar" aria-hidden="true"><span class="ds-loadbar__bar"></span></span>
    </header>
    <div class="ds-dashpanel__body"> <figure class="ds-columns"> ... </figure> </div>
    <div class="ds-dashpanel__foot"><span>Updated 09:12</span> <a class="ds-link--quiet" href="/tickets">All tickets</a></div>
  </section>
</div>
```

| Part | What |
|---|---|
| `.ds-dashpanel` | the panel: a column as high as its grid cell; a region named by its title (`aria-labelledby`) |
| `.ds-dashpanel__head` | the title row, at least `--ds-dashpanel-head-height` (56px): the heading, then the actions; its last child is the loading bar |
| `.ds-dashpanel__heading` | the title and the subtitle, as wide as it gets |
| `.ds-dashpanel__title` | one line, an ellipsis when it is too long |
| `.ds-dashpanel__subtitle` | the period, the unit or the source, one line in the meta type |
| `.ds-dashpanel__actions` | at the end: a status ([status chip](#status-chip): stale or partial data), a small quiet icon button or two, the menu button with its [menu](#menu) |
| `.ds-dashpanel__body` | the content; it grows to fill the panel and is at least `--ds-dashpanel-body-min` (160px) high, so a state that replaces the content keeps its place |
| `.ds-dashpanel__body--flush` | no padding: a table, a list or a chart that runs to the panel's edges (a `.ds-list` loses its sides and lower edge, and at the panel's foot takes its lower corners) |
| `.ds-dashpanel__foot` | a hairline, then meta text and a link: when it was updated, where the rest is |

**States.** The page sets them; status is never told by colour alone.

| State | Markup |
|---|---|
| Loading (nothing to show yet) | `aria-busy="true"` on the panel and a [skeleton](#loading) in the body (`.ds-skeleton` with `role="status"` and its `.ds-sr` word) |
| Refreshing (the old data stays) | `DS.motion.refresh(body, load, { loadbar: false })`: the body takes `aria-busy="true"` and, after `--ds-delay-loader`, dims (`.ds-stale`) |
| Failed | an [empty state](#empty-state) in the body: `.ds-empty--error`, its icon, what failed and a "Try again" button |
| No data | an empty state: `.ds-empty--no-data`, its icon and words |
| Stale, partial | a `.ds-status` with its icon and word in the actions |

The loading bar of the head (`.ds-loadbar`, its last child) lies along the head's lower edge and shows only while the
panel or its body is `aria-busy="true"`; it waits the loader delay like every loading bar, so a fast answer shows
nothing. An empty state alone in the body sits in its middle.

**Options** ([options.md](options.md)): classes on the panel or any ancestor.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Variant | none (outlined), `.ds-dashpanel--filled`, `.ds-dashpanel--elevated` | the panel | outlined: the hairline on `--ds-surface`; filled: `--ds-dashpanel-filled-bg` (`--ds-surface-low`), no hairline, for a panel inside a card or a busy dashboard; elevated: `--ds-dashpanel-shadow` (`--ds-elev-1`) instead of the hairline |
| Density | `.ds-density-*` | any container | the padding (2px per step) and the head's height (4px per step) |
| Shape | `.ds-shape-*` | any container or the theme | the corners, `--ds-dashpanel-radius` (`--ds-radius-card`) times the shape |
| Touch | `.ds-touch` | any container | the head at least the touch target high |
| Size, tone | | | not read: a size class reaches the controls in it; the empty state, a status or an alert in it says what is wrong |

**Behaviour the page adds.** The menu opens through the system (`data-ds-open`, [menu](#menu)); the page loads the data,
sets the states above, and re-renders the body with `DS.dom.morphHtml` (charts glide to their new values through
`--ds-share`). "Try again" puts the loading state back and loads again.

**Accessibility.** The panel is a `section` named by its title (`aria-labelledby`); a truncated title keeps its whole
text as the name. The menu button names the panel ("Actions for tickets per day"). A loading body carries
`role="status"` with its word (the skeleton's `.ds-sr`), so the change is announced; the failed and no-data states say
what happened in words and with an icon. Keys: `Tab` reaches the actions; the menu has the keys of the
[menu](#menu).

**Forced colours.** The outlined panel keeps its hairline; the filled and the elevated panel have a transparent border
that becomes their edge.

**Hooks:** `--ds-dashpanel-padding`, `--ds-dashpanel-radius`, `--ds-dashpanel-bg`, `--ds-dashpanel-border`,
`--ds-dashpanel-filled-bg`, `--ds-dashpanel-shadow`, `--ds-dashpanel-head-height`, `--ds-dashpanel-body-min`
([theming.md](theming.md#component-hooks)).

**Motion.** None of its own: the refresh dims through `.ds-stale`, the loading bar fades in after the loader delay
([loading](#loading)), and the content that arrives glides through the chart's `--ds-share` or `DS.motion.flip`.

<!-- changelog -->
- Dashboard panel (`.ds-dashpanel`): a titled panel with an actions slot for a menu, a loading bar along its head, a
  body that keeps its place through the loading, refreshing, failed and no-data states, a foot; outlined, filled and
  elevated.
