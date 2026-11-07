/*
 * The Audit log demo: a workspace log with filters (search, who, what, a
 * day), a live count and a new event that glides in; the history of one
 * record whose changes come from two versions (DS.auditlog.changes); an
 * empty result. Registered through SG.demo() (styleguide/sg-core.js).
 * Size, density, shape and touch come from the options panel around it.
 * The records stand for what a project's API returns; a fixed "now" keeps
 * the day headings the same on every run.
 */
var AUDIT_NOW = '2026-10-12T16:00:00';

var ADA = { name: 'Ada Lovelace', id: 'ada' };
var GRACE = { name: 'Grace Hopper', id: 'grace' };
var ALAN = { name: 'Alan Turing', id: 'alan' };
var SYNC = { name: 'Directory sync', id: 'sync', icon: 'sync' };

var AUDIT_EVENTS = [
  { id: 'e9', at: '2026-10-12T14:05:00', actor: ADA, action: 'changed', target: { label: 'LAPTOP-0042', href: '#devices/42' }, source: 'Web · 10.20.4.17', facets: { kind: 'change' },
    changes: [{ field: 'Owner', before: 'Grace Hopper', after: 'Ada Lovelace' }, { field: 'Location', before: 'Building B, 2nd floor', after: 'Building A, lab' }] },
  { id: 'e8', at: '2026-10-12T11:42:00', actor: GRACE, action: 'signed in to', target: 'the console', source: 'Web · 10.20.4.31', facets: { kind: 'access' } },
  { id: 'e7', at: '2026-10-12T09:15:00', actor: ALAN, action: 'tried to delete', target: { label: 'PRINTER-0003', href: '#devices/3' }, source: 'API key "inventory"', facets: { kind: 'change' },
    status: { tone: 'error', text: 'Denied' }, note: 'Only an administrator can delete a device.' },
  { id: 'e6', at: '2026-10-12T02:00:00', actor: SYNC, action: 'checked', target: '1,204 people', source: 'Nightly job', facets: { kind: 'sync' }, muted: true, note: 'Nothing changed.' },
  { id: 'e5', at: '2026-10-11T17:30:00', actor: ADA, action: 'created', target: { label: 'Ticket #42', href: '#tickets/42' }, source: 'Web · 10.20.4.17', facets: { kind: 'change' },
    changes: [{ field: 'Title', after: 'Replace the fan' }, { field: 'Priority', after: 'High' }] },
  { id: 'e4', at: '2026-10-11T10:02:00', actor: SYNC, action: 'updated', target: 'Grace Hopper', source: 'Nightly job', facets: { kind: 'sync' },
    changes: [{ field: 'Department', before: 'Research', after: 'Service desk' }, { field: 'Phone', before: '+1 555 0100', after: null }] },
  { id: 'e3', at: '2026-10-08T15:20:00', actor: GRACE, action: 'changed the role of', target: 'Alan Turing', source: 'Web · 10.20.4.31', facets: { kind: 'access' },
    changes: [{ field: 'Role', before: 'Viewer', after: 'Editor' }] },
  { id: 'e2', at: '2026-10-08T08:55:00', actor: ALAN, action: 'signed in to', target: 'the console', source: 'Phone app', facets: { kind: 'access' }, status: { tone: 'warning', text: 'New device' } },
  { id: 'e1', at: '2026-10-05T13:10:00', actor: ADA, action: 'changed', target: { label: 'Ticket #41', href: '#tickets/41' }, source: 'Web · 10.20.4.17', facets: { kind: 'change' },
    changes: [{ field: 'Status', before: 'Open', after: 'Closed' }, { field: 'Resolution', before: null, after: 'Fan replaced, tested for an hour under load.' }] },
];

var RECORD_V1 = { name: 'LAPTOP-0042', model: 'Notebook 14', owner: { name: 'Grace Hopper', team: 'Service desk' }, location: { building: 'B', room: '2.14' }, tags: ['loan'], warranty: '2027-03-31' };
var RECORD_V2 = { name: 'LAPTOP-0042', model: 'Notebook 14', owner: { name: 'Ada Lovelace', team: 'Research' }, location: { building: 'A', room: 'Lab' }, tags: ['loan', 'lab'], warranty: '2027-03-31' };
var RECORD_V3 = { name: 'LAPTOP-0042', model: 'Notebook 14', owner: { name: 'Ada Lovelace', team: 'Research' }, location: { building: 'A', room: 'Lab' }, tags: ['lab'], warranty: '2028-03-31', retired: false };
var RECORD_FIELDS = { 'owner.name': 'Owner', 'owner.team': 'Team', 'location.building': 'Building', 'location.room': 'Room', tags: 'Tags', warranty: 'Warranty ends', retired: 'Retired' };

function chip(h, value, label) {
  return '<label class="ds-chip"><input class="ds-chip__input" type="checkbox" value="' + value + '" data-ds-auditlog-filter="kind"><span class="ds-chip__body">' + h.icon('check', 18, 'ds-chip__check') + '<span>' + label + '</span></span></label>';
}

function filtersHtml(h) {
  return '<form class="ds-auditlog__filters" role="group" aria-label="Filter the log" data-demo="filters">' +
    '<div class="ds-search">' + h.icon('search', 20) + '<input class="ds-input" type="search" aria-label="Search the log" placeholder="Search the log" data-ds-auditlog-filter="text"></div>' +
    '<select class="ds-input ds-input--filled" aria-label="Who" data-ds-auditlog-filter="actor"><option value="">Everyone</option><option value="ada">Ada Lovelace</option><option value="grace">Grace Hopper</option><option value="alan">Alan Turing</option><option value="sync">Directory sync</option></select>' +
    '<input class="ds-input ds-input--filled" type="date" aria-label="From" data-ds-auditlog-filter="from">' +
    '<fieldset class="ds-chips"><legend class="ds-sr">What</legend>' + chip(h, 'change', 'Changes') + chip(h, 'access', 'Sign-ins') + chip(h, 'sync', 'Syncs') + '</fieldset>' +
    '<button class="ds-btn ds-btn--text" type="reset">Clear</button>' +
    '<p class="ds-auditlog__count" data-demo="count"></p></form>';
}

SG.demo('auditlog', {
  title: 'Audit log',
  group: 'data',
  need: 'Show who changed what and when, with the old and new values, filtered and grouped by day',
  lead: 'Who did what and when, on the activity timeline grouped by day: each changed field old to new (struck through, underlined, and the words for a reader), where it came from, an outcome in words. The page\'s own controls filter it, and the count follows.',
  options: { sizes: true, density: true, shape: true, tones: false },

  render: function (h) {
    return h.section('A workspace log', '<section class="ds-auditlog" aria-label="Audit log" data-demo="workspace">' + filtersHtml(h) +
      '<ol class="ds-timeline ds-timeline--activity" role="list" aria-label="Events"></ol>' +
      '<div class="ds-empty ds-empty--no-results ds-empty--section" data-ds-auditlog-empty hidden><p class="ds-empty__title">No events match the filters</p><p class="ds-empty__text">Clear a filter to see more.</p></div>' +
      '</section>' +
      '<div class="sg-row"><button class="ds-btn ds-sm" type="button" data-demo="arrive">' + h.icon('plus', 16) + 'A new event</button></div>',
      'Search, who, a first day and the kinds narrow the log; the count follows and is announced, and a form reset clears it. A new event glides in at the top (DS.motion.flip).') +

      h.section('One record', '<div class="ds-card"><h3 class="ds-card__title">History of LAPTOP-0042</h3>' +
        '<section class="ds-auditlog" aria-label="History of LAPTOP-0042" data-demo="record"><ol class="ds-timeline ds-timeline--activity" role="list" aria-label="Changes"></ol></section></div>',
        'DS.auditlog.changes(before, after) finds the changed fields of two versions of a record: nested fields by their path, labelled by the page; a field that was not set says so in words.') +

      h.section('From the server', '<section class="ds-auditlog" aria-label="Sign-ins">' +
        '<ol class="ds-timeline ds-timeline--activity" role="list" aria-label="Sign-ins">' +
        '<li class="ds-timeline__group" role="presentation"><h3 class="ds-timeline__day">Monday, 5 October 2026</h3></li>' +
        '<li class="ds-timeline__item ds-timeline__item--icon" data-ds-key="s1"><span class="ds-timeline__marker" aria-hidden="true">KJ</span>' +
        '<div class="ds-timeline__head"><p class="ds-timeline__title"><strong>Katherine Johnson</strong> signed in to the console</p><time class="ds-timeline__time" datetime="2026-10-05T08:02">08:02</time></div>' +
        '<p class="ds-auditlog__source">' + h.icon('globe', 16) + 'Web · 10.20.4.52</p></li></ol></section>',
        'A page that renders on the server writes the same markup and needs no script.') +

      h.section('Keyboard', '<p class="ds-muted">Only the links and the filter controls take the focus, in reading order. A reader hears each change as "Owner, Before: Grace Hopper, After: Ada Lovelace"; the arrow is drawn and silent.</p>');
  },

  wire: function (root, h) {
    var workspace = h.$('[data-demo="workspace"]', root);
    var log = DS.auditlog.create(workspace, { entries: AUDIT_EVENTS, now: AUDIT_NOW });
    var arrivals = 0;
    h.$('[data-demo="arrive"]', root).addEventListener('click', function () {
      arrivals += 1;
      var at = new Date(new Date(AUDIT_NOW).getTime() + arrivals * 60000);
      log.set([{ id: 'n' + arrivals, at: at, actor: GRACE, action: 'changed', target: { label: 'MONITOR-0009', href: '#devices/9' }, source: 'Web · 10.20.4.31', facets: { kind: 'change' },
        changes: [{ field: 'Status', before: 'In storage', after: 'Issued' }] }].concat(log.get()));
    });

    var record = h.$('[data-demo="record"]', root);
    DS.auditlog.create(record, {
      now: AUDIT_NOW,
      entries: [
        { id: 'r3', at: '2026-10-12T10:30:00', actor: ADA, action: 'updated', target: 'the warranty', source: 'Web · 10.20.4.17', before: RECORD_V2, after: RECORD_V3, fields: RECORD_FIELDS },
        { id: 'r2', at: '2026-10-09T14:05:00', actor: GRACE, action: 'handed it over', source: 'Web · 10.20.4.31', before: RECORD_V1, after: RECORD_V2, fields: RECORD_FIELDS },
        { id: 'r1', at: '2026-09-30T09:00:00', actor: SYNC, action: 'imported it', source: 'Nightly job', before: null, after: { name: 'LAPTOP-0042', model: 'Notebook 14' }, fields: { name: 'Name', model: 'Model' } },
      ],
    });
  },
});
