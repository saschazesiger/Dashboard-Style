## Message

One turn of a conversation: the user's own message, the assistant's reply, a system line or a tool result, with
its state while a reply streams in, stops or fails, and the actions under it.

```html
<article class="ds-message ds-message--user" data-ds-message aria-labelledby="m1-author">
  <div class="ds-message__main">
    <header class="ds-message__head"><span class="ds-message__author" id="m1-author">Ada Lovelace</span>
      <time class="ds-message__time" datetime="2026-11-04T09:40:00Z">09:40</time></header>
    <div class="ds-message__content">Why does laptop 4 lose its charge overnight?</div>
    <footer class="ds-message__footer" role="group" aria-label="Message actions">
      <button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Edit" data-tip="Edit" data-ds-message-action="edit">[icon pencil 18]</button>
    </footer>
  </div>
</article>

<article class="ds-message ds-message--assistant" data-ds-message="streaming" aria-labelledby="m2-author">
  <div class="ds-message__avatar" aria-hidden="true">[icon bot 20]</div>
  <div class="ds-message__main">
    <header class="ds-message__head"><span class="ds-message__author" id="m2-author">Assistant</span></header>
    <div class="ds-message__content ds-prose ds-prose--compact"><p>The battery report shows</p></div>
    <footer class="ds-message__footer" role="group" aria-label="Message actions">
      <button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Copy" data-tip="Copy" data-ds-message-action="copy">
        <span class="ds-icon-swap" data-swap="a"><span class="ds-icon-swap__a">[icon copy 18]</span><span class="ds-icon-swap__b">[icon check 18]</span></span></button>
      <button class="ds-btn ds-btn--quiet ds-btn--icon ds-sm" type="button" aria-label="Retry" data-tip="Retry" data-ds-message-action="retry">[icon refresh 18]</button>
      <div class="ds-feedback" ...>...</div>   <!-- thumbs: see Feedback -->
    </footer>
  </div>
</article>

<div class="ds-message ds-message--system"><div class="ds-message__main">
  <p class="ds-message__content">[icon userPlus 16] Grace Hopper joined the ticket</p></div></div>

<article class="ds-message ds-message--tool" aria-label="Tool result: battery_report">
  <div class="ds-message__avatar" aria-hidden="true">[icon wrench 20]</div>
  <div class="ds-message__main">
    <header class="ds-message__head"><span class="ds-message__author">battery_report</span></header>
    <pre class="ds-message__content">cycles: 812, capacity: 61%</pre>
  </div>
</article>
```

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Role (variant) | `.ds-message--assistant` (the default look), `.ds-message--user`, `.ds-message--system`, `.ds-message--tool` | the message | the assistant's reply runs the full width with an avatar at the start; the user's sits in a bubble at the end side (`--ds-message-user-bg`, at most `--ds-message-user-max` wide, line breaks kept), its avatar at the end; a system line is centred and quiet (meta type, `--ds-text-2`), without avatar or footer; a tool result is framed (`--ds-message-tool-bg`, a line, code type) |
| Size | `.ds-xs` ... `.ds-xl` | the message or any ancestor | the avatar 8px per step (32px at md); the text keeps the body role, a conversation reads at one size |
| Density | `.ds-density-*` | any container | 2px less per step between head, content, note and footer, and of the bubble's and the tool frame's padding |
| Shape | `.ds-shape-*` | any container or the theme | the bubble's and the tool frame's radius times 0, .5, 1, 1.5; the avatar stays round |
| Touch | `.ds-touch` | the theme or a container | the footer's buttons follow the button's rule (48px targets) |
| Tone | | | none: the role is the variant; a failed reply shows the error ink with its icon and word |

**Parts.** `.ds-message__avatar` (a round slot for an icon, initials or an `<img>`; `aria-hidden` when the head names
the author), `.ds-message__main` (the column), `.ds-message__head` (`.ds-message__author`, `.ds-message__time`, an
[AI label](#ai-label)), `.ds-message__content` (plain text, or `.ds-prose .ds-prose--compact` for rendered markdown),
`.ds-message__note` (a line with an icon and a word under the content) and `.ds-message__footer` (quiet icon buttons
and a [feedback](#feedback) pair; at the end side for the user). A message is an `<article>` named by its author
(`aria-labelledby`), so a screen reader can move from one to the next.

**States.** `data-ds-message="streaming"`, `"partial"`, `"error"` or empty (complete) is the state the page renders;
`DS.message` writes `data-state` from it (none when complete), so the page never sets `data-state` itself:

| State | Shows | ARIA |
|---|---|---|
| `streaming` | a block cursor at the end of the text (after the last paragraph, heading or list item, or alone in an empty content); the footer keeps its room but stays invisible, so nothing moves when it comes | `aria-busy="true"` on the message, so a screen reader waits for the whole reply |
| `partial` | a note "Stopped" with a stop icon (the string `messageStopped`) | |
| `error` | a note in the error ink with an alert icon: the text of `set({ error })`, else "Not completed" (the string `messageFailed`); put a Retry in the footer | |
| complete | the reply as it is | |

The module writes its note (`.ds-message__note`, marked `data-ds-message-note`) after the content and removes it when
the state changes; a `.ds-message__note` of the page's own replaces it.

**Behaviour and API.** `data-ds-message` attaches `DS.message` on `DS.init()` and is read again when it changes.

```js
const message = DS.message.create(article);   // or DS.core.get(article, 'message'): the same controller
message.set('streaming');
message.append('The battery report shows ');   // plain text at the end of the content
message.set({ state: 'error', error: 'The connection was lost.' });
message.set({ state: 'done' });
message.on('retry', () => regenerate());
message.on('edit', ({ text }) => composer.set({ text }));
DS.message.state('Partial');                     // 'partial': what a value means
```

- `get()` gives `{ state, text }`; `set(state)` or `set({ state, text, error, copy })` (`text` replaces the content's
  text); `append(text)` streams plain text in (into the last paragraph when the content ends in one); `copy()`
  copies as the button does; `on(type, fn)` for `change`, `copy`, `retry`, `edit` and `action` returns the unsubscribe;
  `destroy()`. Rich content is the page's: re-render it with `DS.dom.morphHtml(content, html)` while it streams.
- `DS.message.create(el, { state, error, copy })`: `copy` is the text the copy action writes (a string, or a function
  of the message: the markdown source, say), else the content's rendered text.
- `DS.message.state(value)`: the state a value names (`'done'` for anything unknown).
- Footer actions are buttons with `data-ds-message-action`: `copy` writes to the clipboard, shows face b of its
  `.ds-icon-swap` (a check) and the string `copied` as its name and tooltip for `--ds-hold-status`, announces "Copied"
  and dispatches `ds:copy` (`{ text }`); `retry` dispatches `ds:retry`; `edit` dispatches `ds:edit` (`{ text }`); any
  other value `ds:action` (`{ action }`). A blocked or busy button does nothing. Regenerating, editing (put the text
  into the [composer](#composer), or swap the content for a field) and sending feedback are the page's.
- `ds:change` (`{ state, previous }`) bubbles on every change of state; the [transcript](#transcript) announces a reply
  once it is complete.
- The clipboard is progressive: where `navigator.clipboard.writeText` is missing or refused, nothing changes and
  `copy()` resolves `false`.

**Accessibility.** Give the footer `role="group"` and a name, every icon button a name (`aria-label`) and a tooltip.
The cursor is drawn by CSS and never read; the note is text. A reply is announced by the transcript once it is complete,
never word by word. The user's bubble keeps line breaks (`white-space: pre-wrap`).

**Forced colours.** The bubble and the tool frame keep their edge (a transparent border); the cursor is `CanvasText`; the
error note keeps its icon and word in the system colours.

**Hooks**: `--ds-message-avatar-size` (32px), `--ds-message-gap` (`--ds-space-2`), `--ds-message-user-bg`
(`--ds-surface-high`), `--ds-message-user-color` (`--ds-text`), `--ds-message-user-max` (80%), `--ds-message-radius`
(`--ds-radius-xl`), `--ds-message-tool-bg` (`--ds-surface-low`) ([theming.md](theming.md#component-hooks)).

**Motion.** None of its own: the text that streams in is the motion, so the cursor stands still. The copy button swaps
its icon through `.ds-icon-swap`. Print leaves the footer and the cursor out.

<!-- changelog -->
- Message (3.0, new): `.ds-message` with the roles `--assistant`, `--user`, `--system` and `--tool`, its parts
  (`__avatar`, `__main`, `__head`, `__author`, `__time`, `__content`, `__note`, `__footer`), the states streaming
  (a cursor, `aria-busy`), partial and error (a note), and `DS.message` (`data-ds-message`, `create`, `state`) with the
  footer actions copy, retry and edit. Hooks `--ds-message-avatar-size`, `--ds-message-gap`, `--ds-message-user-bg`,
  `--ds-message-user-color`, `--ds-message-user-max`, `--ds-message-radius`, `--ds-message-tool-bg`. Strings
  `messageStopped`, `messageFailed`.
