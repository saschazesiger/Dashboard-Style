## Transcript

The scrolling log of a conversation: it sticks to its end while the reader is there, offers a "Latest" jump with the
count of new messages once they scrolled up, separates the days and loads earlier messages without moving what is on
screen.

```html
<div class="ds-transcript" data-ds-transcript role="region" aria-label="Conversation" tabindex="0">
  <div class="ds-transcript__earlier">
    <button class="ds-btn ds-btn--text" type="button" data-ds-transcript-earlier>Load earlier messages</button>
  </div>
  <div class="ds-transcript__list" role="log" aria-label="Messages">
    <h3 class="ds-transcript__day">Yesterday</h3>
    <article class="ds-message ds-message--user" ...>...</article>
    <h3 class="ds-transcript__day">Today</h3>
    <article class="ds-message ds-message--assistant" data-ds-message ...>...</article>
  </div>
  <!-- optional: the module writes this pill when the markup has none -->
  <div class="ds-jump"><div class="ds-presence" hidden>
    <button class="ds-btn ds-btn--tonal ds-transcript__latest" type="button">[icon arrowDown 20]<span>Latest</span> <span class="ds-transcript__unread"></span></button>
  </div></div>
</div>
<form class="ds-composer" data-ds-composer>...</form>
```

The page gives the transcript its block size: a flex child (`flex: 1; min-height: 0`) of a column that ends in the
[composer](#composer), or a height. It scrolls on the block axis; a short conversation rests at the bottom, next to the
composer.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Density | `.ds-density-*` | any container | 4px less between messages per step (`--ds-transcript-gap`, 24px), 2px less of the list's padding |
| Size, shape, touch | `.ds-xs` ... `.ds-xl`, `.ds-shape-*`, `.ds-touch` | any container | reach the messages and buttons inside; the log has no height, radius or target of its own |
| Tone | | | none |

**Parts.** `.ds-transcript__list` holds the messages and days in a column at most `--ds-transcript-max-width` (768px)
wide, centred (`role="log"` and a name). `.ds-transcript__day` is a day separator, its text centred between two lines:
make it a heading of the right level, so a reader can jump from day to day, and write its text with
`DS.transcript.day(date)`. `.ds-transcript__earlier` is the row of the button that loads earlier messages. The "Latest"
pill is a `.ds-jump` ([scroller](#horizontal-scroller)) with a `.ds-transcript__latest` button (a raised tonal pill)
and its `.ds-transcript__unread` count ("3 new"), gone while empty.

**Behaviour.** `data-ds-transcript` attaches `DS.transcript` on `DS.init()`:

- **Sticks to the end** (`DS.dom.followEnd()`): it opens at the end, and while the reader is within 16px of it, new
  messages and a reply that grows keep it there. Scrolled up, it stays put and the pill shows; every message that
  arrives at the end meanwhile counts (not the user's own, `.ds-message--user`), as the string `unreadCount`. The pill,
  or `stick()`, goes back to the end, smoothly within one screen, else at once, and the count goes. A pill pressed
  from the keyboard hands the focus to the transcript before it hides. Call `stick()` after the user sends.
- **Load earlier**: a press on `[data-ds-transcript-earlier]` dispatches `ds:earlier` once and holds the button busy
  (`DS.motion.busy()`) until the page calls `loaded({ more })`; `data-ds-transcript-earlier="auto"` loads when the
  button comes into view, and again after `loaded({ more: true })` while it is still in view (what loaded was too
  short to push it out). The page puts the older messages at the top of the list; the message on screen stays exactly
  where it was in every engine (the transcript sets `overflow-anchor: none` and keeps it in place itself, since the
  engines' own anchoring stops at the very top). `loaded()` announces "Earlier messages loaded" (the string
  `earlierLoaded`); `more: false` hides `.ds-transcript__earlier` (focus on it moves to the transcript).
- **Announcements that do not spam**: the list gets `aria-live="off"` (unless the markup set `aria-live`), and the
  transcript announces politely (`DS.a11y.announce()`) each message that arrives at the end complete, and a streaming
  reply once it is complete or failed (`ds:change` of [DS.message](#message)), as its author and its text, never word
  by word, never the user's own and never what loads above. `data-ds-transcript-announce="live"` leaves it to the
  log's own politeness (a streaming message is `aria-busy`), `"off"` says nothing.

```js
const log = DS.transcript.create(el);   // or DS.core.get(el, 'transcript'): the same controller
el.addEventListener('ds:earlier', async () => {
  const older = await fetchOlder();
  el.querySelector('.ds-transcript__list').prepend(...render(older));
  log.loaded({ more: older.hasMore });
});
composer.on('send', ({ text }) => { appendUserMessage(text); log.stick(); });
log.get();                                // { atEnd: true, unread: 0 }
DS.transcript.day('2026-11-03T18:00');    // 'Yesterday' (the locale of DS.core.config())
```

`DS.transcript.create(el)` returns the controller: `get()` (`{ atEnd, unread }`), `set({ more })`, `stick()`,
`loaded({ more })`, `on('earlier', fn)` (the unsubscribe) and `destroy()`. `DS.transcript.day(value, { now, locale })`
labels a day: "Today" and "Yesterday" in `Intl`'s words, the weekday within the last week, else the date (with the year
when it is another).

**Accessibility.** The transcript is a named region and the tab stop that scrolls (`tabindex="0"`; its ring is inset);
the list a named `role="log"`; each message an `<article>`. Keyboard: Tab reaches the transcript, the arrow keys and
Page Up / Page Down scroll it, Tab goes on through the messages' buttons, "Load earlier" at the top and the "Latest"
pill when it shows.

**Forced colours.** The focused transcript shows the system ring, the day lines are `CanvasText`, the unread count keeps
an edge.

**Hooks**: `--ds-transcript-max-width` (768px), `--ds-transcript-gap` (24px), `--ds-transcript-pad` (`--ds-space-4`)
([theming.md](theming.md#component-hooks)).

**Motion.** The pill comes and goes as a `.ds-presence`; "Latest" scrolls smoothly within one screen. Loading earlier
messages moves nothing on screen. Print shows the whole log, without the pill and the load row.
