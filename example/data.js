/*
 * The fake backend of the reference app: an in-memory store behind
 * promises with a little latency, so the app goes through the same paths
 * as against a real API (a skeleton on the first load, the grid's dimmed
 * rows on a refresh, a busy button while a save runs, a progress toast
 * while a sync runs). Replace window.ExampleApi with fetch() calls in a
 * real project; nothing in app.js depends on the data being local.
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
  const DAY = 24 * 60 * MINUTE;
  const isoDay = (time) => new Date(time).toISOString().slice(0, 10);

  const TYPES = ['laptop', 'laptop', 'laptop', 'desktop', 'desktop', 'tablet', 'printer'];
  const devices = [];
  for (let i = 0; i < 128; i += 1) {
    const type = TYPES[i % TYPES.length];
    const prefix = type.toUpperCase();
    const number = String(40 + i * 3).padStart(4, '0');
    const roll = random();
    const bought = now - Math.floor(random() * 4 * 365) * DAY;
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
      bought: isoDay(bought),
      warranty: isoDay(bought + 3 * 365 * DAY),
      load: Math.floor(random() * 90) + 5,
      lastSeen: now - Math.floor(random() * 240) * MINUTE,
    });
  }

  const tickets = [
    { id: 1042, subject: 'Battery drains overnight', device: devices[0].id, priority: 'high', status: 'open', opened: now - 3 * 60 * MINUTE, due: isoDay(now + 2 * DAY), text: 'The battery is empty every morning although the lid was closed.' },
    { id: 1041, subject: 'Printer offline after the update', device: devices[6].id, priority: 'high', status: 'open', opened: now - 26 * 60 * MINUTE, due: isoDay(now + DAY), text: 'Since the firmware update the printer no longer answers on the network.' },
    { id: 1040, subject: 'Fan loud under load', device: devices[4].id, priority: 'normal', status: 'open', opened: now - 30 * 60 * MINUTE, due: null, text: 'The fan runs at full speed as soon as a build starts.' },
    { id: 1039, subject: 'Second screen flickers', device: devices[3].id, priority: 'normal', status: 'waiting', opened: now - 50 * 60 * MINUTE, due: isoDay(now + 5 * DAY), text: 'The external screen flickers when the window is moved quickly. A new cable is on its way.' },
    { id: 1038, subject: 'Tablet does not charge', device: devices[12].id, priority: 'high', status: 'waiting', opened: now - 2 * DAY, due: isoDay(now + 3 * DAY), text: 'The charger works with another tablet; the port may be worn.' },
    { id: 1036, subject: 'Keyboard: the E key sticks', device: devices[7].id, priority: 'low', status: 'open', opened: now - 4 * DAY, due: null, text: 'The E key needs a second press now and then.' },
    { id: 1034, subject: 'Disk almost full', device: devices[9].id, priority: 'normal', status: 'open', opened: now - 6 * DAY, due: isoDay(now + 7 * DAY), text: 'Less than 5 GB left; old project files can go to the archive.' },
    { id: 1031, subject: 'New starter needs a tablet', device: devices[5].id, priority: 'normal', status: 'closed', opened: now - 9 * DAY, due: null, text: 'Prepare the tablet with the standard profile before Monday.' },
    { id: 1027, subject: 'Toner low', device: devices[13].id, priority: 'low', status: 'closed', opened: now - 12 * DAY, due: null, text: 'Order a new cartridge.' },
  ];

  const activity = [
    { id: 'a5', glyph: 'sync', text: 'Nightly sync finished: 3 new, 1 updated', at: now - 7 * 60 * MINUTE },
    { id: 'a4', glyph: 'ticket', text: `Ticket #1042 opened for ${devices[0].name}`, at: now - 3 * 60 * MINUTE },
    { id: 'a3', glyph: 'download', text: 'Release 24.2 installed on 11 devices', at: now - 90 * MINUTE },
    { id: 'a2', glyph: 'userPlus', text: 'Margaret Hamilton was added', at: now - 40 * MINUTE },
    { id: 'a1', glyph: 'shield', text: 'Disk encryption confirmed on every laptop', at: now - 12 * MINUTE },
  ].reverse();

  /* What happened for the signed-in person: the backlog of the notification centre. */
  const notifications = [
    { id: 'n4', title: `${devices[6].name} did not answer the last sync`, text: devices[6].location, time: now - 25 * MINUTE, tone: 'warning', icon: 'wifiOff', href: `#/devices/${devices[6].id}`, read: false },
    { id: 'n3', title: 'Ticket #1042 was assigned to you', text: 'Battery drains overnight', time: now - 3 * 60 * MINUTE, icon: 'ticket', href: '#/tickets?open=1042', read: false },
    { id: 'n2', title: 'Release 24.2 is out', text: 'Laptops and desktops update tonight.', time: now - DAY - 2 * 60 * MINUTE, icon: 'download', read: true },
    { id: 'n1', title: 'Disk encryption confirmed', text: 'Every laptop reports an encrypted disk.', time: now - 3 * DAY, tone: 'success', read: true },
  ];

  /* Check-ins per weekday, for the chart on the overview. */
  const checkins = [['Mon', 121], ['Tue', 123], ['Wed', 118], ['Thu', 124], ['Fri', 119], ['Sat', 36], ['Sun', 24]];

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
  let nextNotification = 5;
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

  /* A smooth, repeatable wave for the metrics: the same instant always gives the same value. */
  const wave = (time, period, phase) => Math.sin((time / period) * Math.PI * 2 + phase);

  window.ExampleApi = {
    load() {
      return later({ devices, tickets, activity, checkins, settings, notifications }, 500 + Math.floor(Math.random() * 500));
    },

    devices() {
      return later(devices, latency());
    },

    /*
     * The fleet over a time range: how many devices answered and the mean
     * load, in about 48 buckets between start and end (ISO instants).
     */
    metrics({ start, end }) {
      const from = new Date(start).getTime();
      const to = new Date(end).getTime();
      const count = 48;
      const step = Math.max(MINUTE, Math.floor((to - from) / (count - 1)));
      const labels = [];
      const answered = [];
      const load = [];
      for (let time = from; time <= to; time += step) {
        const bucket = Math.floor(time / step) * step;
        labels.push(new Date(bucket).toISOString());
        const day = wave(bucket, DAY, -Math.PI / 2);
        answered.push(Math.round(96 + day * 14 + wave(bucket, 97 * MINUTE, 1) * 4));
        load.push(Math.round(38 + day * 18 + wave(bucket, 53 * MINUTE, 2) * 6));
      }
      return later({ labels, answered, load }, latency());
    },

    /* One device's load over the last day, for its page. */
    deviceLoad(id) {
      const device = devices.find((other) => other.id === id);
      const base = device ? device.load : 40;
      const labels = [];
      const values = [];
      const end = Math.floor(Date.now() / (60 * MINUTE)) * 60 * MINUTE;
      for (let hour = 23; hour >= 0; hour -= 1) {
        const time = end - hour * 60 * MINUTE;
        labels.push(new Date(time).toISOString());
        values.push(Math.max(0, Math.min(100, Math.round(base + wave(time, DAY, base) * 20 + wave(time, 5 * 60 * MINUTE, 1) * 6))));
      }
      return later({ labels, values }, latency());
    },

    /* Changes a device's own fields (owner, location, warranty). */
    updateDevice(id, patch) {
      const device = devices.find((other) => other.id === id);
      if (device) {
        Object.assign(device, patch);
        log('pencil', `${device.name} edited`);
      }
      return later(device, 400 + Math.floor(Math.random() * 400));
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
        device.lastSeen = Date.now();
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

    /* Read state of notifications (ids, read). */
    markRead(ids, read) {
      for (const item of notifications) if (ids.includes(item.id)) item.read = read;
      return later(true, 120);
    },

    /* Starts a sync and reports its share as it runs (onProgress(done, total)). */
    sync(onProgress) {
      const total = devices.length;
      return new Promise((resolve) => {
        let done = 0;
        const step = () => {
          done = Math.min(total, done + 6 + Math.floor(Math.random() * 10));
          onProgress(done, total);
          if (done < total) setTimeout(step, 300);
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
       offline. Returns the new state of the fleet, any new activity and
       any new notification. */
    poll() {
      if (!online) return new Promise((resolve, reject) => setTimeout(() => reject(new Error('No connection')), 120));
      const device = devices[Math.floor(Math.random() * devices.length)];
      const fresh = [];
      const news = [];
      if (device) {
        const before = device.status;
        if (before === 'running') device.status = 'ok';
        else if (before === 'error') device.status = Math.random() < 0.5 ? 'running' : 'error';
        else {
          const roll = Math.random();
          device.status = roll < 0.15 ? 'error' : roll < 0.45 ? 'running' : roll < 0.6 ? 'warning' : 'ok';
        }
        device.lastSeen = Date.now();
        if (device.status === 'error' && before !== 'error') {
          fresh.push(log('wifiOff', `${device.name} went offline`));
          const item = { id: `n${nextNotification++}`, title: `${device.name} went offline`, text: device.location, time: Date.now(), tone: 'warning', icon: 'wifiOff', href: `#/devices/${device.id}`, read: false, device: device.id };
          notifications.unshift(item);
          news.push(item);
        }
        if (device.status === 'ok' && before === 'error') fresh.push(log('wifi', `${device.name} is back online`));
      }
      return later({ devices, activity: fresh, notifications: news }, 120);
    },
  };
}());
