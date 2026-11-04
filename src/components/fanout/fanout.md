## Fan-out probe

A throwaway component: one folder is enough.

```html
<div class="ds-fanout" data-ds-fanout>Probe</div>
```

`data-ds-fanout` counts clicks: `DS.fanout.create(el)` returns the same controller (`get()`, `set()`, `on()`,
`destroy()`), and every change sends `ds:fanout`.

Hooks: `--ds-fanout-radius`, `--ds-fanout-bg`.
