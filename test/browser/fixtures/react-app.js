/**
 * The React app of react.spec.js: scenarios of the adapter (dist/react/),
 * each mounted under StrictMode inside <DSProvider>, as a project mounts
 * them. Each adapter file is imported alone, as the docs recommend.
 *
 * window.harness:
 *   mount(name, props, provider)  renders scenario `name` (flushSync: committed on return),
 *                       provider: props of <DSProvider>
 *   update(props)       renders it again with new props
 *   unmount()           unmounts the root
 *   set                 the scenario's own state setters (a re-render from inside)
 *   flush(fn)           runs a setter and commits at once (flushSync)
 *   probe(entries)      every generated component on its docs markup, with and without StrictMode
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
import { Sheet } from '/dist/react/sheet.js';
import { Markdown } from '/dist/react/markdown.js';
import { Highlight } from '/dist/react/highlight.js';
import { Formatted } from '/dist/react/formatted.js';
import { Truncate } from '/dist/react/truncate.js';
import { SearchHits } from '/dist/react/hits.js';
import { Time } from '/dist/react/time.js';
import { Kbd } from '/dist/react/kbd.js';
import { CopyButton } from '/dist/react/copy.js';
import { Icon } from '/dist/react/shared.js';
import { chevronDown, close, layoutGrid, list, pencil, plus } from '/dist/js/icons.js';

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
      action: () => new Promise((resolve) => { harness.release = resolve; }),
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
  const [sheet, setSheet] = useState(false);
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
    h('button', { className: 'ds-btn', type: 'button', 'aria-pressed': 'false', value: 'grid' }, h(Icon, { glyph: layoutGrid, size: 16 }), 'Grid')),
    h(Button, { id: 'details', 'aria-haspopup': 'dialog', onClick: () => setSheet(true) }, 'Details'),
    h(Sheet, {
      id: 'sheet',
      open: sheet,
      'aria-labelledby': 'sheet-title',
      onClose: (reason) => {
        log('sheet', reason);
        setSheet(false);
      },
    },
    h('div', { className: 'ds-sheet__backdrop', 'data-ds-close': '' }),
    h('section', { className: 'ds-sheet__panel' },
      h('div', { className: 'ds-sheet__head' },
        h('h2', { className: 'ds-sheet__title', id: 'sheet-title' }, 'Laptop 14'),
        h(Button, { variant: 'quiet', icon: close, 'aria-label': 'Close', 'data-ds-close': '' })),
      h('div', { className: 'ds-sheet__body', tabIndex: 0 }, h('p', null, 'Owner: Ada Lovelace')))));
}

/** The components whose behaviour writes their content: a new text from React reaches what shows. */
const MINUTE = 60_000;
function Texts() {
  const [n, setN] = useState(1);
  const [copyClass, setCopyClass] = useState('');
  harness.set.n = setN;
  harness.set.copyClass = setCopyClass;
  harness.copy = harness.copy ?? { current: null };
  const first = n === 1;
  return h('div', { className: 'ds-stack' },
    h(Markdown, { id: 'md', source: first ? '# Title 1\n\ntext' : '# Title 2\n\ntext', anchors: !first }),
    h('pre', null, h(Highlight, { id: 'hl', 'data-ds-highlight': 'js' }, first ? 'const a = 1;' : 'let b = 2;')),
    h(Formatted, { id: 'fmt', 'data-ds-format': 'number', value: first ? 1234.5 : 99000 }),
    h('div', { style: { width: '120px' } },
      h(Truncate, { id: 'tr', 'data-ds-truncate': 'middle', text: first ? 'inventory-export-2026-11-04-final.csv' : 'short.txt' })),
    h(SearchHits, { id: 'hits', 'data-ds-hits': first ? 'floor' : 'laptop' }, first ? 'Printer on floor 2' : 'Laptop on floor 3'),
    h(Time, { id: 'time', 'data-ds-time': new Date(harness.now - (first ? 5 : 120) * MINUTE).toISOString() }),
    h(Kbd, { id: 'kbd', 'data-ds-kbd': first ? 'shift+a' : 'shift+b', platform: 'other' }),
    h(CopyButton, { id: 'copy', className: copyClass || undefined, 'data-ds-copy-value': 'LAPTOP-0042', controllerRef: harness.copy },
      h('span', { className: 'ds-btn__faces' },
        h('span', { className: 'ds-btn__face' }, 'Copy'),
        h('span', { className: 'ds-btn__face ds-btn__face--done', 'aria-hidden': 'true' }, h('span', { className: 'ds-copy__done' })))));
}
harness.now = Date.now();

const SCENARIOS = { buttons: Buttons, tabs: TabsScenario, dialog: DialogScenario, content: Content, generic: Generic, texts: Texts };

let root = null;
let current = null;

let providerProps = {};

function render(props) {
  const scenario = SCENARIOS[current];
  flushSync(() => root.render(h(StrictMode, null, h(DSProvider, { id: 'provider', className: 'ds-page', style: { padding: '16px' }, ...providerProps }, h(scenario, props)))));
}

harness.mount = (name, props = {}, provider = {}) => {
  providerProps = provider;
  if (!SCENARIOS[name]) throw new Error(`no scenario ${name}`);
  harness.log.length = 0;
  harness.set = {};
  harness.copy = { current: null };
  root ??= createRoot(document.getElementById('root'));
  current = name;
  render(props);
};
harness.update = (props = {}) => render(props);
/** Runs `fn` (a state setter) and commits what it scheduled before returning. */
harness.flush = (fn) => flushSync(fn);

/* ── Every generated component on its docs markup ─────────────────────── */

/** HTML attribute names React spells otherwise. */
const PROP_NAMES = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly', colspan: 'colSpan', rowspan: 'rowSpan',
  maxlength: 'maxLength', minlength: 'minLength', autocomplete: 'autoComplete', contenteditable: 'contentEditable',
  inputmode: 'inputMode', enterkeyhint: 'enterKeyHint', srcset: 'srcSet', crossorigin: 'crossOrigin', novalidate: 'noValidate',
  autofocus: 'autoFocus', datetime: 'dateTime', spellcheck: 'spellCheck', 'accept-charset': 'acceptCharset', checked: 'defaultChecked',
  value: 'defaultValue', selected: 'defaultSelected', 'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin', 'fill-rule': 'fillRule', 'clip-rule': 'clipRule', popovertarget: 'popoverTarget',
};
const BOOLEAN = new Set(['hidden', 'disabled', 'required', 'multiple', 'open', 'readOnly', 'autoFocus', 'noValidate', 'defaultChecked', 'defaultSelected', 'inert']);

/** The attributes of an element as React props. */
function propsOf(node) {
  const props = {};
  for (const { name, value } of node.attributes) {
    const prop = PROP_NAMES[name] ?? name;
    if (prop === 'style') props.style = Object.fromEntries(value.split(';').filter((rule) => rule.includes(':')).map((rule) => {
      const [property, ...rest] = rule.split(':');
      const trimmed = property.trim();
      return [trimmed.startsWith('--') ? trimmed : trimmed.replace(/-([a-z])/g, (m, c) => c.toUpperCase()), rest.join(':').trim()];
    }));
    else if (prop === 'inert') props.inert = '';
    else props[prop] = BOOLEAN.has(prop) && value === '' ? true : value;
  }
  return props;
}

/** A DOM node as React elements (the probe's children): what a project writes as JSX. */
function reactOf(node, key) {
  if (node.nodeType === 3) return node.nodeValue;
  if (node.nodeType !== 1) return null;
  const props = { key, ...propsOf(node) };
  if (node.localName === 'select') {
    const chosen = [...node.options].find((option) => option.hasAttribute('selected'));
    if (chosen) props.defaultValue = chosen.value;
  }
  if (node.localName === 'option') delete props.defaultSelected;
  const source = node.localName === 'template' ? node.content : node;
  const children = [...source.childNodes].map((child, index) => reactOf(child, index)).filter((child) => child !== null);
  if (node.localName === 'textarea') return h('textarea', { ...props, defaultValue: node.textContent });
  if (node.localName === 'script' || node.localName === 'style') return h(node.localName, { ...props, dangerouslySetInnerHTML: { __html: node.textContent } });
  return h(node.localName, props, ...(children.length ? children : []));
}

/** What a reader gets: the tags, their classes (without the system's own states) and the text, in order. */
function signature(el) {
  const out = [];
  const walk = (node, depth) => {
    if (node.nodeType === 3) {
      const text = node.nodeValue.replace(/\s+/g, ' ').trim();
      if (text) out.push(`${'  '.repeat(depth)}"${text}"`);
      return;
    }
    if (node.nodeType !== 1) return;
    const classes = [...node.classList].filter((name) => !/^ds-(pressed|stale|leaving|entering)$/.test(name)).sort().join('.');
    out.push(`${'  '.repeat(depth)}<${node.localName}${classes ? `.${classes}` : ''}>`);
    for (const child of node.childNodes) walk(child, depth + 1);
  };
  walk(el, 0);
  return out.join('\n');
}

/**
 * Mounts each generated component on its docs markup, with and without
 * StrictMode, and returns the components whose result differs:
 * [{ display, plain, strict }]. `entries`: { file, display, attribute, html }.
 */
harness.probe = async (entries) => {
  const host = document.getElementById('probe');
  const differs = [];
  // Two frames after a short wait: what a behaviour measures or loads (an image that fails) has settled.
  const frames = () => new Promise((resolve) => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(resolve)), 100));
  for (const entry of entries) {
    const component = (await import(`/dist/react/${entry.file}`))[entry.display];
    const template = document.createElement('template');
    template.innerHTML = entry.html;
    const markup = template.content.querySelector(`[${CSS.escape(entry.attribute)}]`);
    if (!markup) {
      differs.push({ display: entry.display, missing: true });
      continue;
    }
    const props = propsOf(markup);
    const children = [...markup.childNodes].map((child, index) => reactOf(child, index)).filter((child) => child !== null);
    const run = async (strict) => {
      const container = document.createElement('div');
      host.append(container);
      const probeRoot = createRoot(container);
      const tree = h(DSProvider, { observe: false }, h(component, props, ...children));
      flushSync(() => probeRoot.render(strict ? h(StrictMode, null, tree) : tree));
      await frames();
      const shown = signature(container.querySelector(`[${CSS.escape(entry.attribute)}]`) ?? container);
      flushSync(() => probeRoot.unmount());
      container.remove();
      return shown;
    };
    const plain = await run(false);
    const strict = await run(true);
    if (plain !== strict) differs.push({ display: entry.display, plain, strict });
  }
  return differs;
};
harness.unmount = () => {
  flushSync(() => root?.unmount());
  root = null;
  current = null;
};

document.documentElement.setAttribute('data-fixture-ready', '');
