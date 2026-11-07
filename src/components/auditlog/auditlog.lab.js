/* A new event arrives in an audit log: set() draws it through DS.motion.flip; the next press takes it away again. */
SG_LAB.add({
  id: 'auditlog-arrive',
  group: 'data',
  title: 'An audit log takes a new event',
  note: '<code>DS.auditlog.create()</code> on a <code>.ds-auditlog</code>; its <code>set()</code> re-renders through <code>DS.motion.flip</code>: the new entry fades in at the top (<code>--ds-dur-fast</code>) while the entries below glide down on <code>--ds-ease-spatial</code>; taken away, it fades out while the rest closes the gap. A live log holds the reorder while the pointer is over it.',
  shows: ['DS.auditlog.create', '.ds-auditlog', '.ds-auditlog__diff', 'DS.motion.flip', '--ds-dur-fast', '--ds-ease-spatial'],
  html: '<section class="ds-auditlog" aria-label="Audit log" style="max-width:560px"><ol class="ds-timeline ds-timeline--activity" role="list" aria-label="Events"></ol></section>',
  height: 340,
  setup: function (stage) {
    var base = [
      { id: 'b2', at: '2026-10-12T11:42:00', actor: 'Grace Hopper', action: 'signed in to', target: 'the console' },
      { id: 'b1', at: '2026-10-12T09:15:00', actor: 'Alan Turing', action: 'changed', target: 'PRINTER-0003', changes: [{ field: 'Location', before: 'Floor 1', after: 'Floor 2' }] },
    ];
    stage.base = base;
    stage.log = DS.auditlog.create(stage.querySelector('.ds-auditlog'), { entries: base, now: '2026-10-12T16:00:00', live: false });
  },
  state: function (stage) { return stage.log.get().length > stage.base.length; },
  toggle: function (stage, on) {
    var fresh = { id: 'n1', at: '2026-10-12T14:05:00', actor: 'Ada Lovelace', action: 'changed', target: 'LAPTOP-0042', changes: [{ field: 'Owner', before: 'Grace Hopper', after: 'Ada Lovelace' }] };
    return stage.log.set(on ? [fresh].concat(stage.base) : stage.base);
  },
  play: function (stage) {
    var on = stage.log.get().length === stage.base.length;
    var fresh = { id: 'n1', at: '2026-10-12T14:05:00', actor: 'Ada Lovelace', action: 'changed', target: 'LAPTOP-0042', changes: [{ field: 'Owner', before: 'Grace Hopper', after: 'Ada Lovelace' }] };
    return stage.log.set(on ? [fresh].concat(stage.base) : stage.base);
  },
});
