/**
 * The React app of react.spec.js: scenarios of the adapter (dist/react/),
 * each mounted under StrictMode inside <DSProvider>, as a project mounts
 * them. Each adapter file is imported alone, as the docs recommend.
 *
 * window.harness:
 *   mount(name, props)  renders scenario `name` (flushSync: committed on return)
 *   update(props)       renders it again with new props
 *   unmount()           unmounts the root
 *   set                 the scenario's own state setters (a re-render from inside)
 *   log                 what the scenario's handlers saw
 * Then data-fixture-ready on <html>.
 */
import { StrictMode, createElement as h, useState } from 'react';
import { createRoot, flushSync } from 'react-dom/client';
import { DSProvider } from '/dist/react/provider.js';
import { Button } from '/dist/react/button.js';
import { Field } from '/dist/react/field.js';
import { Card } from '/dist/react/card.js';
import { Badge } from '/dist/react/badge.js';
import { Status } from '/dist/react/status.js';
import { Alert } from '/dist/react/alert.js';
import { Table } from '/dist/react/table.js';
import { Tabs } from '/dist/react/tabs.js';
import { Dialog } from '/dist/react/dialog.js';
import { useToast } from '/dist/react/toast.js';
import { MenuButton } from '/dist/react/menubutton.js';
import { Menu } from '/dist/react/menu.js';
import { ToggleGroup } from '/dist/react/toggle-group.js';
import { Icon } from '/dist/react/shared.js';
import { chevronDown, layoutGrid, list, pencil, plus } from '/dist/js/icons.js';

const harness = { log: [], set: {} };
window.harness = harness;
const log = (...entry) => harness.log.push(entry);

function Buttons({ variant = 'filled' }) {
  const [label, setLabel] = useState('Save');
  const [count, setCount] = useState(0);
  harness.set.label = setLabel;
  harness.set.count = setCount;
  return h('div', { className: 'ds-form-actions' },
    h(Button, { id: 'save', variant, onClick: () => log('click', 'save') }, label),
    h(Button, { id: 'edit', variant: 'quiet', icon: pencil, 'aria-label': 'Edit' }),
    h(Button, { id: 'add', icon: plus }, 'Add ', h(Badge, { id: 'badge', count, max: 9 })),
    h(Button, {
      id: 'publish',
      variant: 'tonal',
      faces: { busy: 'Publishing', done: 'Published', failed: 'Not published' },
      action: () => new Promise((resolve) => setTimeout(resolve, 50)),
    }, 'Publish'));
}

const ITEMS = [
  { key: 'details', label: 'Details', panel: h(Field, { label: 'Name', id: 'name-field', defaultValue: 'Printer on floor 2' }) },
  { key: 'history', label: 'History', count: 3, panel: h('p', { id: 'history-text' }, 'Three changes this week.') },
  { key: 'report', label: 'Report', closable: true, panel: h('p', null, 'The report of May.') },
  { key: 'archived', label: 'Archived', disabled: true, panel: h('p', null, 'Nothing archived.') },
];

function TabsScenario({ controlled = true, initial = 'details', variant }) {
  const [items, setItems] = useState(ITEMS);
  const [value, setValue] = useState(initial);
  const [tick, setTick] = useState(0);
  harness.set.value = setValue;
  harness.set.tick = () => setTick((n) => n + 1);
  return h('div', { 'data-tick': tick },
    h(Tabs, {
      id: 'tabs',
      label: 'Device',
      items,
      variant,
      ...(controlled ? { value } : { defaultValue: initial }),
      onChange: (key) => {
        log('change', key);
        if (controlled) setValue(key);
      },
      onClose: (key) => {
        log('close', key);
        setItems((before) => before.filter((item) => item.key !== key));
      },
    }));
}

function DialogScenario() {
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const toast = useToast();
  harness.set.open = setOpen;
  harness.set.tick = () => setTick((n) => n + 1);
  return h('div', { 'data-tick': tick },
    h(Button, { id: 'opener', 'aria-haspopup': 'dialog', onClick: () => setOpen(true) }, 'Delete devices'),
    h(Dialog, {
      id: 'confirm',
      open,
      role: 'alertdialog',
      title: 'Delete 3 devices?',
      description: 'They disappear from every list. This cannot be undone.',
      onClose: (reason) => {
        log('close', reason);
        setOpen(false);
      },
      actions: [
        h(Button, { key: 'cancel', id: 'cancel', variant: 'text', 'data-ds-close': '', autoFocus: true }, 'Cancel'),
        h(Button, {
          key: 'delete',
          id: 'delete',
          variant: 'filled',
          tone: 'error',
          onClick: () => {
            log('delete');
            setOpen(false);
            toast('3 devices deleted', { kind: 'success' });
          },
        }, 'Delete 3 devices'),
      ],
    }, h('p', { id: 'tick-text' }, `Rendered ${tick} times.`)));
}

function Content() {
  const [sort, setSort] = useState({ key: 'name', direction: 'ascending' });
  const rows = [
    { id: 'd1', name: 'Printer on floor 2', age: 3.2, owner: 'Ada Lovelace', tone: 'success', state: 'Synced' },
    { id: 'd2', name: 'Laptop 14', age: 1.1, owner: 'Ada Lovelace', tone: 'warning', state: 'Expires soon' },
    { id: 'd3', name: 'Desktop 7', age: 5.4, owner: 'Product', tone: 'error', state: 'Failed' },
  ].sort((a, b) => (sort.direction === 'ascending' ? 1 : -1) * (a[sort.key] > b[sort.key] ? 1 : a[sort.key] < b[sort.key] ? -1 : 0));
  return h('div', { className: 'ds-stack' },
    h(Alert, { id: 'alert', tone: 'warning', title: 'Certificate expires soon', actions: h(Button, { variant: 'text', size: 'sm' }, 'Renew') }, 'Renew it before 1 May.'),
    h(Card, { id: 'card', title: 'Devices', actions: h(Button, { size: 'sm' }, 'Run now') },
      h(Table, {
        id: 'table',
        caption: 'Devices',
        rows,
        sort,
        onSort: (key, direction) => {
          log('sort', key, direction);
          setSort({ key, direction });
        },
        columns: [
          { key: 'name', header: 'Device', sortable: true, text: true },
          { key: 'age', header: 'Age', numeric: true, sortable: true },
          { key: 'owner', header: 'Owner', secondary: true },
          { key: 'state', header: 'Status', render: (row) => h(Status, { tone: row.tone }, row.state) },
        ],
      })),
    h(Field, { id: 'serial', label: 'Serial', hint: 'As printed on the label.', error: 'Already in use.', defaultValue: 'SN-1' }));
}

function Generic() {
  const [tick, setTick] = useState(0);
  harness.set.tick = () => setTick((n) => n + 1);
  return h('div', { className: 'ds-form-actions', 'data-tick': tick },
    h(MenuButton, {
      id: 'export',
      'aria-haspopup': 'menu',
      'aria-expanded': 'false',
      'aria-controls': 'export-menu',
      'data-ds-menubutton': '#export-menu',
    }, 'Export', h(Icon, { glyph: chevronDown, size: 16, className: 'ds-chevron ds-menu-btn__chevron' })),
    h(Menu, { id: 'export-menu', 'aria-label': 'Export', hidden: true },
      h('button', { className: 'ds-menu__item', role: 'menuitem', type: 'button', onClick: () => log('menu', 'csv') }, h('span', { className: 'ds-menu__label' }, 'CSV')),
      h('button', { className: 'ds-menu__item', role: 'menuitem', type: 'button', onClick: () => log('menu', 'json') }, h('span', { className: 'ds-menu__label' }, 'JSON'))),
    h(ToggleGroup, {
      id: 'view',
      'aria-label': 'View',
      'data-ds-toggle-group': 'single',
      'data-ds-toggle-group-required': '',
      onDsChange: (event) => log('view', event.detail?.value ?? null),
    },
    h('button', { className: 'ds-btn', type: 'button', 'aria-pressed': 'true', value: 'list' }, h(Icon, { glyph: list, size: 16 }), 'List'),
    h('button', { className: 'ds-btn', type: 'button', 'aria-pressed': 'false', value: 'grid' }, h(Icon, { glyph: layoutGrid, size: 16 }), 'Grid')));
}

const SCENARIOS = { buttons: Buttons, tabs: TabsScenario, dialog: DialogScenario, content: Content, generic: Generic };

let root = null;
let current = null;

function render(props) {
  const scenario = SCENARIOS[current];
  flushSync(() => root.render(h(StrictMode, null, h(DSProvider, { id: 'provider', className: 'ds-page', style: { padding: '16px' } }, h(scenario, props)))));
}

harness.mount = (name, props = {}) => {
  if (!SCENARIOS[name]) throw new Error(`no scenario ${name}`);
  harness.log.length = 0;
  harness.set = {};
  root ??= createRoot(document.getElementById('root'));
  current = name;
  render(props);
};
harness.update = (props = {}) => render(props);
harness.unmount = () => {
  flushSync(() => root?.unmount());
  root = null;
  current = null;
};

document.documentElement.setAttribute('data-fixture-ready', '');
