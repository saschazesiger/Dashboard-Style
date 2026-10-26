/*
 * The fake backend of the reference app: an in-memory store behind
 * promises with a little latency, so the app goes through the same paths
 * as against a real API (a skeleton on the first load, .ds-stale and the
 * loading bar on a refresh, a busy button while a save runs). Replace
 * window.ExampleApi with fetch() calls in a real project; nothing in app.js
 * depends on the data being local.
 *
 * All names, places and figures are invented.
 */
(function () {
  'use strict';

  const OWNERS = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson', 'Edsger Dijkstra', 'Barbara Liskov',
    'Donald Knuth', 'Margaret Hamilton', 'Tim Berners-Lee', 'Radia Perlman', 'Ken Thompson', 'Frances Allen'];
  const PLACES = ['Building A, ground floor', 'Building A, 1st floor', 'Building A, 2nd floor', 'Building B, lab',
    'Building B, 2nd floor', 'Building C, 3rd floor', 'Remote'];
  const MODELS = {
    laptop: ['Notebook 13', 'Notebook 14', 'Notebook 15'],
    desktop: ['Desktop Mini', 'Workstation 7'],
    tablet: ['Tablet 11'],
    printer: ['Laser printer'],
  };
  const SYSTEMS = { laptop: 'Release 24.2', desktop: 'Release 24.2', tablet: 'Release 18.3', printer: 'Firmware 5.6' };

  /* A small deterministic generator, so every visit starts from the same fleet. */
  let seed = 42;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const pick = (list) => list[Math.floor(random() * list.length)];

  const now = Date.now();
  const MINUTE = 60000;

  const TYPES = ['laptop', 'laptop', 'laptop', 'desktop', 'desktop', 'tablet', 'printer'];
  const devices = [];
  for (let i = 0; i < 128; i += 1) {
    const type = TYPES[i % TYPES.length];
    const prefix = type.toUpperCase();
    const number = String(40 + i * 3).padStart(4, '0');
    const roll = random();
    devices.push({
      id: `${type}-${number}`,
      name: `${prefix}-${number}`,
      type,
      model: pick(MODELS[type]),
      owner: type === 'printer' ? 'Front desk' : OWNERS[i % OWNERS.length],
      location: pick(PLACES),
      status: roll < 0.68 ? 'ok' : roll < 0.84 ? 'warning' : roll < 0.93 ? 'error' : 'running',
      system: SYSTEMS[type],
      serial: `SN-${Math.floor(random() * 0xfffff).toString(16).toUpperCase().padStart(5, '0')}`,
      address: `10.0.${4 + TYPES.indexOf(type)}.${40 + i * 3}`,
      bought: new Date(now - Math.floor(random() * 4 * 365) * 24 * 60 * MINUTE).toISOString().slice(0, 10),
      lastSeen: now - Math.floor(random() * 240) * MINUTE,
    });
  }

  const tickets = [
    { id: 1042, subject: 'Battery drains overnight', device: devices[0].id, priority: 'high', status: 'open', opened: now - 3 * 60 * MINUTE, text: 'The battery is empty every morning although the lid was closed.' },
    { id: 1041, subject: 'Printer offline after the update', device: devices[6].id, priority: 'high', status: 'open', opened: now - 26 * 60 * MINUTE, text: 'Since the firmware update the printer no longer answers on the network.' },
    { id: 1039, subject: 'Second screen flickers', device: devices[3].id, priority: 'normal', status: 'waiting', opened: now - 50 * 60 * MINUTE, text: 'The external screen flickers when the window is moved quickly. A new cable is on its way.' },
    { id: 1036, subject: 'Keyboard: the E key sticks', device: devices[7].id, priority: 'low', status: 'open', opened: now - 4 * 24 * 60 * MINUTE, text: 'The E key needs a second press now and then.' },
    { id: 1031, subject: 'New starter needs a tablet', device: devices[5].id, priority: 'normal', status: 'closed', opened: now - 9 * 24 * 60 * MINUTE, text: 'Prepare the tablet with the standard profile before Monday.' },
  ];

  const activity = [
    { id: 'a5', glyph: 'sync', text: 'Nightly sync finished: 3 new, 1 updated', at: now - 7 * 60 * MINUTE },
    { id: 'a4', glyph: 'ticket', text: 'Ticket #1042 opened for ' + devices[0].name, at: now - 3 * 60 * MINUTE },
    { id: 'a3', glyph: 'download', text: 'Release 24.2 installed on 11 devices', at: now - 90 * MINUTE },
    { id: 'a2', glyph: 'userPlus', text: 'Margaret Hamilton was added', at: now - 40 * MINUTE },
    { id: 'a1', glyph: 'shield', text: 'Disk encryption confirmed on every laptop', at: now - 12 * MINUTE },
  ].reverse();

  /* Check-ins per weekday, for the chart on the overview. */
  const checkins = [['Mon', 21], ['Tue', 23], ['Wed', 22], ['Thu', 24], ['Fri', 19], ['Sat', 6], ['Sun', 4]];

  let settings = {
    organisation: 'Example Organisation',
    contact: 'it@example.org',
    timezone: 'UTC',
    nightlySync: true,
    notifyFailures: true,
    retention: '90',
  };

  let nextTicket = 1043;
  let nextActivity = 6;
  /* The connection: Settings can cut it (setOnline); polls then fail. */
  let online = true;

  const copy = (value) => JSON.parse(JSON.stringify(value));
  const later = (value, ms) => new Promise((resolve) => setTimeout(() => resolve(copy(value)), ms));
  /* Somewhere between a fast and a slow answer: the loaders' delays decide what shows. */
  const latency = () => 150 + Math.floor(Math.random() * 600);

  function log(glyph, text) {
    const entry = { id: `a${nextActivity++}`, glyph, text, at: Date.now() };
    activity.push(entry);
    return entry;
  }

  window.ExampleApi = {
    load() {
      return later({ devices, tickets, activity, checkins, settings }, 500 + Math.floor(Math.random() * 500));
    },

    devices() {
      return later(devices, latency());
    },

    /* Deletes devices by id; returns what it removed, so the page can undo. */
    removeDevices(ids) {
      const removed = devices.filter((device) => ids.includes(device.id));
      for (const device of removed) devices.splice(devices.indexOf(device), 1);
      if (removed.length) log('trash', `${removed.length === 1 ? removed[0].name : `${removed.length} devices`} deleted`);
      return later(removed, latency());
    },

    restoreDevices(list) {
      for (const device of list) if (!devices.some((other) => other.id === device.id)) devices.push(copy(device));
      log('undo', `${list.length === 1 ? list[0].name : `${list.length} devices`} restored`);
      return later(devices, latency());
    },

    restart(id) {
      const device = devices.find((other) => other.id === id);
      if (device) {
        device.status = 'running';
        log('sync', `${device.name} restarted`);
      }
      return later(device, 900 + Math.floor(Math.random() * 600));
    },

    createTicket(ticket) {
      const created = { ...ticket, id: nextTicket++, status: 'open', opened: Date.now() };
      tickets.unshift(created);
      log('ticket', `Ticket #${created.id} opened`);
      return later(created, latency());
    },

    closeTicket(id) {
      const ticket = tickets.find((other) => other.id === id);
      if (ticket) ticket.status = 'closed';
      return later(ticket, latency());
    },

    saveSettings(next) {
      settings = { ...settings, ...next };
      return later(settings, 600 + Math.floor(Math.random() * 600));
    },

    /* Starts a sync and reports its share as it runs (onProgress(done, total)). */
    sync(onProgress) {
      const total = devices.length;
      return new Promise((resolve) => {
        let done = 0;
        const step = () => {
          done = Math.min(total, done + 2 + Math.floor(Math.random() * 4));
          onProgress(done, total);
          if (done < total) setTimeout(step, 350);
          else resolve(copy(log('sync', `Sync finished: ${total} devices checked`)));
        };
        setTimeout(step, 400);
      });
    },

    setOnline(value) {
      online = Boolean(value);
    },

    /* What changed on the server since the last poll: a device that checks
       in, one that starts or ends a sync, now and then one that goes
       offline. Returns the new state of the fleet and any new activity. */
    poll() {
      if (!online) return new Promise((resolve, reject) => setTimeout(() => reject(new Error('No connection')), 120));
      const device = devices[Math.floor(Math.random() * devices.length)];
      const fresh = [];
      if (device) {
        const before = device.status;
        if (before === 'running') device.status = 'ok';
        else if (before === 'error') device.status = Math.random() < 0.5 ? 'running' : 'error';
        else {
          const roll = Math.random();
          device.status = roll < 0.15 ? 'error' : roll < 0.45 ? 'running' : roll < 0.6 ? 'warning' : 'ok';
        }
        device.lastSeen = Date.now();
        if (device.status === 'error' && before !== 'error') fresh.push(log('wifiOff', `${device.name} went offline`));
        if (device.status === 'ok' && before === 'error') fresh.push(log('wifi', `${device.name} is back online`));
      }
      return later({ devices, activity: fresh }, 120);
    },
  };
}());
