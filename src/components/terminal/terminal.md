## Terminal frame

The chrome around a terminal emulator the page brings (xterm.js or its own): a head with the title, the connection
status and the page's actions, the screen the emulator mounts into, and a key bar with the keys a phone's keyboard
lacks (Esc, Tab, Ctrl, Alt, the arrows). The emulator, the connection and what the keys do stay the page's; the frame
says which bytes a key sends and gives the emulator the theme's colours.

```html
<div class="ds-terminal" data-ds-terminal data-ds-terminal-status="connecting" aria-label="Shell on device 42">
  <div class="ds-terminal__head">
    <span class="ds-terminal__title">ada@device-42: ~</span>
    <span class="ds-terminal__actions">
      <button class="ds-btn ds-btn--quiet ds-btn--icon" type="button" aria-label="Full screen">(fullscreen)</button>
    </span>
  </div>
  <div class="ds-terminal__screen"><!-- the emulator mounts here --></div>
</div>
```

```js
const el = document.querySelector('.ds-terminal');
const term = new Terminal({ theme: DS.terminal.theme(el), fontFamily: getComputedStyle(el).getPropertyValue('font-family') });
term.open(el.querySelector('.ds-terminal__screen'));
const frame = DS.terminal.create(el, { send: (data) => socket.send(data) });
term.onData((data) => socket.send(data));
socket.onopen = () => frame.set({ status: 'connected' });
socket.onclose = () => frame.set({ status: 'disconnected' });
```

**What it shows** (rendered by the script; the page writes none of it):

- The **status** (`.ds-terminal__status`, a [status chip](#status-chip) `.ds-status` before the actions, a polite
  live region): "Connecting" with the running spinner, "Connected" with a plug in the success tone, "Disconnected"
  with a broken link, neutral. Never the colour alone; the chip stays while the status changes, so its colour glides.
- The **key bar** (`.ds-terminal__keys`, a toolbar named "Terminal keys"): an outlined button per key
  (`.ds-terminal__key`; the arrows icon buttons with their names), Ctrl and Alt as toggle buttons (`aria-pressed`).
  It shows under a coarse pointer (a phone or a tablet) by default, always with `data-ds-terminal-bar="always"`, and
  never with `off`.

The page writes the head (`.ds-terminal__head` with `.ds-terminal__title` and `.ds-terminal__actions`, its own quiet
icon buttons: reconnect, copy, full screen) and the screen (`.ds-terminal__screen`). Without an emulator (a replay, a
read-only session) it writes a `<pre>` into the screen: spans with `data-fg` (`black`, `red`, `green`, `yellow`,
`blue`, `magenta`, `cyan`, `white`) take the ANSI colours and `data-sgr="bold"` or `"dim"` the weight.

| Attribute | Option | What |
|---|---|---|
| `data-ds-terminal` | | marks the frame |
| `data-ds-terminal-keys` | `keys` | the keys of the bar by name, separated by spaces: `esc`, `tab`, `ctrl`, `alt`, `up`, `down`, `left`, `right`, `home`, `end`, `pgup`, `pgdn`, or one character (`\|`, `~`, `/`) sent as it is; default `esc tab ctrl alt left up down right` |
| `data-ds-terminal-bar` | `bar` | `auto` (default: under a coarse pointer), `always`, `off` |
| `data-ds-terminal-status` | `status` | `connecting`, `connected`, `disconnected`; none: no chip |
| | `send` | `send(data)` gets the bytes of every key the frame sends |
| | `title` | the text of `.ds-terminal__title` |

The frame writes `data-bar` and `data-status` on itself, `role="group"` (unless it has a role) and, without an
`aria-label` or `aria-labelledby` of the page's, an `aria-label` that is the title's text, kept in step when the title
changes. It gives the title and the screen no id. All of it is owned state, and the key bar and the status chip carry
`data-ds-keep`: a page that re-renders around the frame with `DS.dom.morphHtml` keeps them. A change of
`data-ds-terminal-keys`, `-bar` or `-status` applies that option alone; the bar is rebuilt only when its keys change,
and the key that had the focus keeps it.

| Variant | Class | What |
|---|---|---|
| Default | `.ds-terminal` | the screen is `--ds-terminal-height` high (360px) |
| Fill | `.ds-terminal--fill` | the frame takes its container's height and the screen the rest (a terminal page) |

**Options** ([options.md](options.md)): classes on the frame or any ancestor.

| Option | Classes | Where it applies | Effect |
|---|---|---|---|
| Size | `.ds-xs` ... `.ds-xl` | the head; the keys by the button's rule | 8px of head height per step (48px at md); the screen keeps its type: the emulator sets its cells |
| Density | `.ds-density-*` | the head, the screen, the bar | 4px of head height per step, 2px of block padding off the screen and the bar |
| Shape | `.ds-shape-*` | the frame; the keys by the button's rule | the corners times 0, .5, 1, 1.5 |
| Touch | `.ds-touch` | the keys | they reach the touch target |
| Tone | | | not read: the status chip has its own, with its icon and word |

Under a width of 20rem (a container query) the status word hides (the chip keeps its icon and is still read), the
title ends with an ellipsis and the key bar scrolls sideways.

**Keys.** A key of the bar sends its bytes through `send(data)` and the bubbling `ds:key` `{ key, data, ctrl, alt }`;
the page passes them to its connection (or to the emulator's input). Ctrl and Alt are held for the next key (a second
press lets go): a key of the bar, or the next character typed into the screen on the soft keyboard, which the frame
takes before the emulator sees it and sends with the modifier (Ctrl, then `c`: `\x03`). The sequences are xterm's:
the arrows `ESC [ A` ... `ESC [ D`, with a modifier `ESC [ 1 ; 5 A`; Home and End `ESC [ H`, `ESC [ F`; Page Up and
Down `ESC [ 5 ~`, `ESC [ 6 ~`; Alt puts `ESC` before. A press on a key never takes the focus from the screen, so the
soft keyboard stays up.

```js
const frame = DS.terminal.create(el, { send, keys: ['esc', 'tab', 'ctrl', 'up', 'down', '|', '~'], bar: 'always' });
frame.set({ status: 'connected', title: 'ada@device-42: /var/log' });
frame.get();                       // { status, title, keys, bar, ctrl, alt }
frame.press('ctrl');               // as a tap: holds Ctrl
frame.on('key', ({ key, data, ctrl, alt }) => {});   // also ds:key on the frame
frame.on('change', ({ status, title }) => {});       // also ds:change
DS.terminal.sequence('left', { alt: true });        // '\x1b[1;3D'
DS.terminal.theme(el);             // { background, foreground, cursor, ..., red, ..., brightWhite }
```

`DS.terminal.create` returns the controller (`get`, `set`, `press`, `on`, `update`, `destroy`); the attribute path
makes the same one (`DS.core.get(el, 'terminal')`), and `create` on a frame it already runs passes the options to
that one. `DS.terminal.sequence(key, modifiers)` gives the bytes of a key (null for what cannot be sent).
`DS.terminal.theme(el)` reads the colours of the place the frame sits (its scheme, theme and hooks) in xterm.js's
`ITheme` shape: the background, foreground, cursor and selection, and the eight ANSI colours from roles (the bright
ones the same), through a `.ds-terminal__probe` it adds to the screen for the moment it reads; read it again after
the scheme changes and pass it to the emulator.

**Accessibility.** The frame is a group named by its `aria-label`, else its title's text. The status chip is a polite live
region. The key bar is a toolbar (APG toolbar): one tab stop, the arrow keys, Home and End move between the keys,
Enter and Space press one; the arrow keys have names ("Arrow up"), Ctrl and Alt are toggle buttons whose hold and
release are announced ("Ctrl held for the next key"). The screen shows the focus ring while the emulator inside has
the focus; the emulator's own accessibility (xterm.js's screen reader mode) is the page's choice.

**Forced colours.** The frame, the head and the bar keep their lines (`CanvasText`); the output's colours go, the
status keeps its icon and word, a held modifier is `Highlight` (the button's toggle).

**Hooks**: `--ds-terminal-height`, `--ds-terminal-bg`, `--ds-terminal-fg`, `--ds-terminal-cursor`,
`--ds-terminal-selection`, `--ds-terminal-radius`, `--ds-terminal-font` and the ANSI colours `--ds-terminal-black`,
`--ds-terminal-red`, `--ds-terminal-green`, `--ds-terminal-yellow`, `--ds-terminal-blue`, `--ds-terminal-magenta`,
`--ds-terminal-cyan`, `--ds-terminal-white` ([theming.md](theming.md)); `DS.terminal.theme()` reads them too.

**Motion.** The status chip's colour glides (`.ds-status`); the keys press as buttons. Nothing else moves.

<!-- changelog -->
- Terminal frame (`.ds-terminal`, `DS.terminal`, tier 2): the chrome around a terminal emulator the page brings: a
  head with the title, a status chip (connecting, connected, disconnected) and the page's actions, the screen, and a
  key bar (Esc, Tab, Ctrl, Alt, the arrows; more by name or character) shown under a coarse pointer, with Ctrl and
  Alt held for the next key, also for a character typed on the soft keyboard. `DS.terminal.sequence` gives xterm's
  bytes of a key, `DS.terminal.theme` the theme's colours for an emulator (hooks `--ds-terminal-*`); `--fill` for a
  terminal page; plain output with `data-fg` spans. New strings `terminalKeys`, `terminalUp`, `terminalDown`,
  `terminalLeft`, `terminalRight`, `terminalConnecting`, `terminalConnected`, `terminalDisconnected`,
  `terminalHeld`, `terminalReleased`.
