## Audit log

Who did what and when, with the old and new values of every changed field, grouped by day and narrowed by filters. For
the history of a whole workspace or of one record, a sign-in log, the changes of a setting.

```html
<section class="ds-auditlog" aria-label="Audit log" data-ds-auditlog>
  <div class="ds-auditlog__filters" role="group" aria-label="Filter the log">
    <div class="ds-search">[icon search 20]<input class="ds-input" type="search" aria-label="Search the log" placeholder="Search" data-ds-auditlog-filter="text"></div>
    <select class="ds-input ds-input--filled" aria-label="Who" data-ds-auditlog-filter="actor">
      <option value="">Everyone</option><option value="ada">Ada Lovelace</option><option value="sync">Directory sync</option>
    </select>
    <fieldset class="ds-chips"><legend class="ds-sr">What</legend>
      <label class="ds-chip"><input class="ds-chip__input" type="checkbox" value="change" data-ds-auditlog-filter="kind"><span class="ds-chip__body">[icon check 18 ds-chip__check]<span>Changes</span></span></label>
      <label class="ds-chip"><input class="ds-chip__input" type="checkbox" value="access" data-ds-auditlog-filter="kind"><span class="ds-chip__body">[icon check 18 ds-chip__check]<span>Sign-ins</span></span></label>
    </fieldset>
    <p class="ds-auditlog__count"></p>
  </div>
  <ol class="ds-timeline ds-timeline--activity" role="list" aria-label="Events"></ol>
  <div class="ds-empty ds-empty--no-results ds-empty--section" data-ds-auditlog-empty hidden><p class="ds-empty__title">No events match the filters</p></div>
  <!-- the records, in a script element of type application/json (or create(el, { entries })) -->
</section>
```

```js
const log = DS.auditlog.create(document.querySelector('#audit'), {
  entries: await api.events(),               // [{ id, at, actor, action, target, source, status, muted, note, changes }]
  fields: { owner: 'Owner', 'location.room': 'Room' },
});
log.set(await api.events());                 // new entries glide in at the top
log.filter({ actor: 'ada', from: '2026-10-01' });
```

The log is a [timeline](#timeline) (`.ds-timeline--activity`): a day heading (`.ds-timeline__day`: "Today",
"Yesterday", then the date written out), then one entry per record, newest first. An entry is one sentence, **who**
(`<strong>`, with an avatar's initials or an icon in `.ds-timeline__marker`), **what** (the verb) and the target (a
link where it has one), with **when** at the end of the line (`<time datetime>`, the full date and time in its
`title`). Under it:

- `.ds-auditlog__source`: where it came from (a channel, an address, a key), in the meta font.
- `.ds-auditlog__diff`, a description list of the changed fields, one `.ds-auditlog__change` per field: the field
  (`dt`), the old value (`.ds-auditlog__old`, struck through with `<del>`, a quiet error tint
  `--ds-auditlog-old-bg`), an arrow, and the new value (`.ds-auditlog__new`, underlined with `<ins>`, a quiet success
  tint `--ds-auditlog-new-bg`). A value that was not set says so in words (`.ds-auditlog__none`, "Not set"): a field
  that was added or cleared. The field column is `--ds-auditlog-field-width` (10rem); under 520px of the log's width
  the field goes above its values and the old value above the new one.
- A status (`.ds-status`, an icon and a word: "Failed") in the head line when the event has an outcome; a muted entry
  (`.ds-timeline__item--muted`, `muted: true`) for one that changed nothing; a note (`.ds-timeline__text`).
- `.ds-auditlog__filters`: a wrapping bar for the page's own controls (selects, chips, a search field, date fields),
  with `.ds-auditlog__count` at its end ("12 of 48 events").

A page that renders on the server writes the same markup itself and needs no script; `DS.auditlog` draws it from records
and filters it in the browser.

### Records and filters

`DS.auditlog` (`js/auditlog.js`) draws the entries of `create(el, { entries })`, or of a
`<script type="application/json">` inside the element (`data-ds-auditlog`), with `DS.dom.morphHtml` (keyed by `id`):

| Field | What |
|---|---|
| `id` | the key of its row |
| `at` | when: a `Date`, a timestamp or an ISO text; the day and time in the page's locale (`DS.core.config`), `timeZone` for another zone |
| `actor` | a name, or `{ name, id, initials, image, icon }` (`icon`: `sync`, `user` or `globe`, for a system that acted) |
| `action` | the verb and what goes with it: "changed", "signed in to" |
| `target` | a text, or `{ label, href }` |
| `source`, `note` | a line in the meta font, a line of text |
| `status` | `{ tone, text }`: a `.ds-status` with the tone's icon and the word |
| `muted` | an entry that changed nothing |
| `changes` | `[{ field, before, after }]`, or `before` and `after` as whole records: `changes()` finds what differs |
| `facets` | the values the filters compare (else the entry's own field; an object by its `id`, else its `name`) |

Values are text as they come; numbers go through `Intl`, a list is joined, an object is JSON, and `format(value, path,
entry)` (an option) writes them the page's way. Every text is escaped.

**Filters.** Each control inside the log with `data-ds-auditlog-filter="<name>"` narrows the entries: a select, a text
or date field, radios, or checkboxes that share the name (none checked: all). `text` finds every word in what an entry
shows, without case or accents (typing waits `--ds-dur-fast`); `from` and `to` take a date (`YYYY-MM-DD`, whole days);
any other name compares the entry's facet. A day without entries left goes with them. The count says "12 of 48 events"
("48 events" without a filter) and the announcer says it after each change ("No results" for none); with nothing to show
the list hides and the page's `[data-ds-auditlog-empty]` shows. A `reset` of a form around the controls clears them.

| Export | What |
|---|---|
| `create(el, options)` | a log from the page (`entries`, `fields`, `format`, `filters`, `locale`, `timeZone`, `now`, `order`: `'newest'` or `'oldest'`, `live`), or new options for one `DS.init()` made; the controller below |
| `changes(before, after, options)` | the fields that differ between two versions of a record: `[{ path, field, before, after, kind }]`, `kind` `'added'`, `'removed'` or `'changed'`; nested objects open into `owner.name`, lists of objects into `ports[0].speed`; `options.fields` labels the paths, `options.ignore` leaves some out |
| `group(entries, options)` | the entries by calendar day: `[{ key: '2026-10-12', label, entries }]` (`now`, `locale`, `timeZone`, `order`) |
| `matches(entry, filters, options)` | whether an entry passes the filters (`{ text, from, to, <facet> }`) |

The controller: `get()` (every entry), `set(entries)` (what changed glides through `DS.motion.flip`, held while the log is
pointed at or holds the focus, as live data is; resolves once settled), `filter(values)` (sets the filters and the
controls; without an argument returns them), `count()` (`{ shown, total }`), `on(type, fn)`, `configure(options)`,
`update()` (reads the controls and the JSON again) and `destroy()`. Events on the element: `ds:filter`
`{ filters, shown, total }`, `ds:render` `{ shown, total }`.

### Options

On the log or any ancestor; each is computed in the component's own rule ([options.md](options.md)).

| Option | Classes | Applies to | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the timeline, `.ds-auditlog__change` | the timeline's (marker, title); a change row's block padding 2px per step; the values stay in the body font |
| Density | `.ds-density-*` | `.ds-auditlog__change`, `.ds-auditlog__filters` | a change row's block padding 2px per step, the bar's gap 2px per step; the timeline's entries their own |
| Shape | `.ds-shape-*` | `.ds-auditlog__diff`, the values | multiplies the radius |
| Touch | `.ds-touch` | the filter controls | their own: the log adds no target |
| Tone | none of its own | | an outcome is a `.ds-status` with an icon and a word; old and new carry a strike, an underline and a hidden word |

### Keyboard and names

Nothing in the log is a target but its links and the filter controls, in reading order. Name the log (`aria-label`),
the filter bar (`role="group"` with `aria-label`), each control and the list. A reader hears each change as "Owner,
Before: Grace Hopper, After: Ada Lovelace": the words `.ds-sr` holds ("Before:", "After:") say which is which, the arrow
is drawn and silent. Filtering announces the count.

### Forced colours

The tints give way; the strike and the underline stay, and the values keep a border that becomes their edge. The diff
keeps its frame and hairlines; the timeline's marker and rail are its own.

### Hooks

`--ds-auditlog-field-width`, `--ds-auditlog-old-bg`, `--ds-auditlog-new-bg`, `--ds-auditlog-diff-radius`: see
[theming.md](theming.md).

**Motion:** the timeline's: new entries come in through `DS.motion.flip` (a new row fades in, the rows below glide down;
a live log waits while it is pointed at or holds the focus). Filtering re-renders at once.

<!-- changelog -->
- Audit log (`.ds-auditlog`, `DS.auditlog`): who, what and when on the activity timeline, grouped by day, with a diff of
  each changed field (`.ds-auditlog__diff`: old struck through, new underlined, the words for a reader), a filter bar
  with a live count, and the pure helpers `changes()`, `group()` and `matches()`. Hooks `--ds-auditlog-field-width`,
  `--ds-auditlog-old-bg`, `--ds-auditlog-new-bg`, `--ds-auditlog-diff-radius`. New strings `auditlogToday`,
  `auditlogYesterday`, `auditlogUndated`, `auditlogBefore`, `auditlogAfter`, `auditlogNotSet`, `auditlogEvent`,
  `auditlogEvents`, `auditlogFiltered`.
