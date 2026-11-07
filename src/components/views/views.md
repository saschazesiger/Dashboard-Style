## Saved views

Named sets of a list's filters, sort and columns, picked from a menu: the page's own views come built in, the user
saves, renames and deletes theirs (remembered in the browser), one is the default, and a link carries the current view
and state. It sits above a list or a [table](#table) with a [filter bar](#filter-bar) or a
[facet filter panel](#facet-filter-panel) and a [sort control](#sort-control).

```html
<div class="ds-views" data-ds-views data-ds-views-key="devices" data-ds-views-url="sync">
  <button class="ds-btn ds-views__trigger" type="button" aria-haspopup="menu" aria-expanded="false" data-ds-open="#views-menu">
    [icon layers 20]<span class="ds-sr">View: </span><span class="ds-views__name">All devices</span>
    <span class="ds-views__edited" hidden>Edited</span>[icon chevronDown 20 ds-views__chevron]</button>
  <button class="ds-btn ds-btn--text ds-views__save" type="button" hidden>Save view</button>
  <div class="ds-menu" id="views-menu" role="menu" aria-label="Views" hidden>
    <div class="ds-views__list" role="group" aria-label="Views">
      <button class="ds-menu__item" role="menuitemradio" aria-checked="false" type="button" data-ds-view="all" data-ds-view-default>
        [icon check 20 ds-menu__check]<span class="ds-menu__label">All devices</span></button>
      <button class="ds-menu__item" role="menuitemradio" aria-checked="false" type="button" data-ds-view="offline"
              data-ds-view-state="status=offline&amp;sort=-seen">[icon check 20 ds-menu__check]<span class="ds-menu__label">Offline</span></button>
    </div>
    <div class="ds-menu__divider" role="separator"></div>
    <button class="ds-menu__item" role="menuitem" type="button" data-ds-views-action="save">[icon save 20]<span class="ds-menu__label">Save changes</span></button>
    <button class="ds-menu__item" role="menuitem" type="button" data-ds-views-action="create">[icon plus 20]<span class="ds-menu__label">Save as new view …</span></button>
    <button class="ds-menu__item" role="menuitem" type="button" data-ds-views-action="rename">[icon pencil 20]<span class="ds-menu__label">Rename …</span></button>
    <button class="ds-menu__item" role="menuitem" type="button" data-ds-views-action="default">[icon star 20]<span class="ds-menu__label">Make default</span></button>
    <button class="ds-menu__item" role="menuitem" type="button" data-ds-views-action="share">[icon link 20]<span class="ds-menu__label">Copy link</span></button>
    <div class="ds-menu__divider" role="separator"></div>
    <button class="ds-menu__item ds-menu__item--danger" role="menuitem" type="button" data-ds-views-action="delete">[icon trash 20]<span class="ds-menu__label">Delete view</span></button>
  </div>
</div>
```

### Options

| Option | Classes, attributes | Where it applies | Effect |
|---|---|---|---|
| Storage key | `data-ds-views-key` | `.ds-views` | the key of the user's views in `DS.store` (namespace `views`); one per list |
| Address | `data-ds-views-url` `read` (default), `sync`, `off` | `.ds-views` | read the first view from the address; also write every change into it (`history.replaceState`); or leave it alone |
| Prefix | `data-ds-views-prefix` (`d.`) | `.ds-views` | only parameters that start with it are read and written, so the page's other parameters stay its own |
| Built-in view | `data-ds-view="<id>"`, `data-ds-view-state` (a query string), `data-ds-view-default` | a `menuitemradio` in `.ds-views__list` | a view of the page; it cannot be renamed, saved over or deleted |
| Action | `data-ds-views-action` `save`, `create`, `rename`, `default`, `share`, `delete` | a menu item or a button | what it does (below); `aria-disabled` where it does not apply |
| Size, density, shape, touch | `.ds-xs` ... `.ds-xl`, `.ds-density-*`, `.ds-shape-*`, `.ds-touch` | `.ds-views` or any ancestor | reach the buttons and the menu, which compute them; the gap steps 4px per size step |
| Name width | `--ds-views-name-max` | `.ds-views` | the widest the view's name gets on the trigger (240px), then an ellipsis |

There is no tone: a view shows no meaning of its own. Deleting is the menu's danger item, confirmed in a dialog whose
filled button is in the error tone and names the consequence (D10).

### Behaviour

`js/views.js` (`data-ds-views`, or `DS.views.create(el, options)`):

- **A state** is `{ filters, sort, columns }`: the filters as [`DS.filterbar.read()`](#filter-bar) gives them, the sort
  as [`DS.sort.stringify()`](#sort-control) writes it (`-seen`), the columns as a list of names; each may be left out.
  The page tells the current one with `set({ state })` after every change of its own; while it differs from the
  current view the trigger says "Edited" (`.ds-views__edited`) and `.ds-views__save` shows.
- **In the address** a state is a query string (`DS.views.toQuery()`, `DS.views.fromQuery()`): one parameter per
  filter value (`status=online&status=offline`, a range `storage=&storage=512`), `sort=-seen`, `cols=name,status` and
  `view=<id>`. Without a prefix every parameter but `view`, `sort` and `cols` is a filter; a page with parameters of its
  own sets `data-ds-views-prefix`.
- **The first view** comes from the address (unless `off`), else the stored default, else the built-in
  `data-ds-view-default`, else the first. The page reads it with `get()` and applies `get().state`.
- **Picking** a view from the menu sends `ds:view` (`{ id, name, state, reason: 'select' }`) for the page to apply,
  and announces "View: Offline". The system writes `aria-checked` on the views, the star and "Default" on the default
  one (`.ds-views__default`, at the row's end), the name on the trigger, and renders the user's views after the
  built-in ones (owned markup).
- **Actions.** `save` puts the state over the current view (a built-in one: as a new view); `create` asks a name (a
  [prompt dialog](#dialog)) and saves a new view; `rename` asks a new one; `default` makes the current view the
  default; `share` copies the link to the clipboard (else shows it in a dialog to copy); `delete` asks first and goes
  back to the default view. Each changes the user's set in `DS.store` and sends `ds:views` (`{ views, default, reason }`);
  saving and copying show a snackbar, every action is announced. Actions run once the menu has closed and given the
  focus back; a dialog's focus returns to the trigger.
- **Other tabs.** A view saved, renamed or deleted in another tab shows here at once (`DS.store`); a deleted current
  view falls back to the default.

### JS API

```js
const views = DS.views.create(el, { views: [{ id: 'mine', name: 'Mine', state: { filters: { owner: ['ada'] } } }] });
views.get();          // { id: 'all', name: 'All devices', state: {}, edited: false, default: 'all', views: [...] }
views.set({ state: { filters: bar.get(), sort: DS.sort.stringify(sort.get()), columns } });
views.set('offline');                           // pick a view; sends nothing, the page applies get().state
views.on('view', ({ state }) => apply(state));
await views.save();  await views.create('Offline laptops');  await views.rename('Laptops');
await views.setDefault();  await views.share();  await views.remove(true);   // true: ask first
views.link();                                   // the address of the current view and state

DS.views.toQuery({ filters: { status: ['online'] }, sort: '-seen' }, { view: 'all' });   // 'view=all&status=online&sort=-seen'
DS.views.fromQuery('?status=online&sort=-seen');   // { view: null, state: { filters: { status: ['online'] }, sort: '-seen' } }
```

`DS.views.create(el, options)` returns the controller (`get()`, `set(value)`, `on(type, fn)`, `save()`,
`create(name)`, `rename(name)`, `setDefault()`, `share()`, `remove(ask)`, `link()`, `update()`, `destroy()`);
`options.key`, `options.url` and `options.prefix` stand for the attributes, `options.views` adds built-in views.
`DS.views.toQuery(state, options)` and `DS.views.fromQuery(search, options)` are the address format alone.

### Accessibility

- **Names and roles.** The trigger is a menu button (`aria-haspopup="menu"`, `aria-expanded`) whose name says "View:
  All devices", and "Edited" while edited. The views are `menuitemradio` items in a named group, the current one
  `aria-checked="true"`; the default carries the word "Default", never the star alone. Actions that do not apply are
  `aria-disabled="true"` and keep their place, so their names are read.
- **Keyboard.** The [menu](#menu)'s: Enter, Space or ArrowDown opens it, the arrows move, Enter picks, Escape closes
  and the focus returns to the trigger. In the name dialog Enter saves and Escape cancels.
- **Announcements.** "View: Offline", "Saved Offline laptops", "Deleted Offline laptops", "Offline is the default view",
  "Link copied".
- **Strings.** `viewEdited`, `viewDefault`, `viewApplied`, `viewSaved`, `viewDeleted`, `viewDefaultSet`,
  `viewLinkCopied`, `viewNameLabel`, `viewNewTitle`, `viewRenameTitle`, `viewSave`, `viewLinkTitle`, `viewDeleteTitle`,
  `viewDeleteText`, `viewDeleteConfirm` (`DS.core.config()`). The menu's labels are the page's own.

### Forced colours

The words are text and the buttons, the menu and its checks keep their own models; the views add no colour.

### Hooks

| Hook | Default | What |
|---|---|---|
| `--ds-views-name-max` | 240px | the widest the view's name gets on the trigger |

**Motion:** the trigger's chevron turns while its menu is open (`--ds-dur-medium`, `--ds-ease-spatial`); the menu,
the dialogs and the snackbar play their own motion.
