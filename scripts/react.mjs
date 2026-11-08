/**
 * The React adapter's part of the build (dist/react/, docs/react.md):
 * scripts/build.mjs calls these with its component list and readers.
 *
 * - src/react/*.js and *.d.ts are hand-written (the provider, the shared
 *   part, and the tier 1 components without a behaviour of their own or
 *   with a richer API: Button, Field, Card, Badge, Status, Alert, Table,
 *   Tabs, Dialog, useToast). They ship to dist/react/ with their imports
 *   of a component module rewritten ('../components/<n>/<n>.js' to
 *   '../js/<n>.js', where dist/ keeps every module flat).
 * - Every other behaviour that initialises elements (each define() with
 *   an attribute in a component module, and `time` of js/format.js) gets
 *   a generated module, react/<behaviour>.js, and its types: a component
 *   made by behaviour() of react/shared.js, which renders the root
 *   element of the documented markup (its tag, classes and role, read from
 *   the first element of the component's docs that carries the attribute;
 *   src/react/names.json may give them, and gives every export name) and
 *   runs the behaviour through DS.core.manage(). Its variants are the
 *   modifiers of its block in meta.json, its events the ds:<type> names
 *   the component's docs and module mention. A behaviour of a module that
 *   exports open() and close() on a <dialog> or sheet root is an overlay:
 *   its component takes `open` and `onClose`.
 * - react/index.js re-exports every component (one import line for an app
 *   that uses many; a project that imports one component imports its
 *   file, so it loads only that module).
 * - manifest.json "react": per file its exports, the component
 *   stylesheets it needs and the JS modules it loads, so a bundle can
 *   follow an import of the adapter.
 */

/** The behaviours of core modules that get a component (the others are page-wide attributes). */
const CORE_BEHAVIOURS = new Map([['time', 'format']]);

/** The hand-written files of src/react/ and what each needs besides its imports: component stylesheets. */
export const REACT_HAND = {
  shared: { components: [] },
  provider: { components: ['utilities', 'ripple', 'tooltip'] },
  button: { components: ['button', 'spinner'] },
  field: { components: ['form'] },
  card: { components: ['card'] },
  badge: { components: ['badge'] },
  status: { components: ['status', 'spinner'] },
  alert: { components: ['alert'] },
  table: { components: ['table'] },
  tabs: { components: ['tabs', 'button', 'menu', 'indicator'] },
  dialog: { components: ['dialog'] },
  toast: { components: ['toast'] },
};

/** The option classes and the system's state classes: never part of a component's base classes. */
const OPTION_CLASS = /^ds-(xs|sm|md|lg|xl|touch|density-[\w-]+|shape-[\w-]+)$/;

const pascal = (name) => name.split(/[-_]/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');

/** 'before-close' → 'onDsBeforeClose' (react/shared.js eventProp). */
export const eventProp = (type) => `onDs${pascal(type)}`;

/** Every define() of a module source: { name, attribute, init }. */
export function definesOf(source) {
  return [...source.matchAll(/^define\('([^']+)', \{([\s\S]*?)\n\}\);/gm)].map(([, name, body]) => ({
    name,
    attribute: /\battribute: '([^']+)'/.exec(body)?.[1] ?? null,
    init: /\binit\s*[(:]/.test(body),
  }));
}

/** The first element of the docs' html blocks that carries `attribute`: { tag, classes, role }, or null. */
export function rootOf(markdown, attribute) {
  const html = [...markdown.matchAll(/```html\n([\s\S]*?)```/g)].map((match) => match[1]).join('\n');
  const hit = new RegExp(`<([a-z][\\w-]*)\\b([^<>]*?)\\s${attribute}(?=[\\s=>/])([^<>]*)>`, 'i').exec(html);
  if (!hit) return null;
  const attributes = `${hit[2]} ${hit[3]}`;
  const classes = (/\bclass="([^"]*)"/.exec(attributes)?.[1] ?? '').split(/\s+/).filter(Boolean);
  return { tag: hit[1].toLowerCase(), classes, role: /\brole="([^"]*)"/.exec(attributes)?.[1] ?? null };
}

/** The ds:<type> events the docs and the module name. */
function eventsOf(markdown, source) {
  const events = new Set();
  for (const match of markdown.matchAll(/`ds:([a-z][\w-]*)`/g)) events.add(match[1]);
  for (const match of source.matchAll(/\bemit\(\s*[\w.]+\s*,\s*'([a-z][\w-]*)'/g)) events.add(match[1]);
  for (const match of source.matchAll(/\b(?:ctx\.emit|tell|fire)\(\s*'([a-z][\w-]*)'/g)) events.add(match[1]);
  events.delete('config');
  return [...events].sort();
}

/**
 * Every behaviour that gets a generated component, in a stable order:
 * { behaviour, module, component, attribute, file, display, tag, classes,
 *   block, variants, role, events, overlay, create, components }.
 * @param {{ list: any[], read: (path: string) => string, has: (path: string) => boolean, moduleNames: string[] }} context
 */
export function reactBehaviours({ list, read, has, moduleNames }) {
  const names = JSON.parse(read('src/react/names.json')).names;
  // Deprecated classes are no variants of the adapter: it teaches the current names only.
  const deprecated = new Set(JSON.parse(read('src/deprecations.json')).names.filter((entry) => entry.kind === 'class').map((entry) => entry.name.replace(/^\./, '')));
  const owners = new Map();
  for (const component of list) for (const cls of component.meta.classes) owners.set(cls, component);
  const out = [];
  const sources = [
    ...list.filter((component) => component.meta.module && moduleNames.includes(component.name)).map((component) => ({ module: component.name, component, path: `src/components/${component.name}/${component.name}.js` })),
    ...[...new Set(CORE_BEHAVIOURS.values())].map((module) => ({ module, component: null, path: `src/js/${module}.js` })),
  ];
  for (const { module, component, path } of sources) {
    const source = read(path);
    const markdown = component?.md ? read(component.md) : '';
    for (const define of definesOf(source)) {
      if (!define.attribute || !define.init) continue;
      if (!component && CORE_BEHAVIOURS.get(define.name) !== module) continue;
      if (has(`src/react/${define.name}.js`)) continue; // hand-written
      const given = names[define.name];
      const override = given && typeof given === 'object' ? given : {};
      const found = override.tag ? null : rootOf(markdown, define.attribute);
      if (!override.tag && !found) throw new Error(`src/react/names.json: the docs of ${module} show no element with ${define.attribute}; give "${define.name}" a tag and classes`);
      const tag = override.tag ?? found.tag;
      const documented = override.classes ?? found.classes;
      const classes = documented.filter((name) => !name.includes('--') && !OPTION_CLASS.test(name));
      const blocks = classes.filter((name) => owners.get(name)?.meta.classes.some((other) => other.startsWith(`${name}--`)));
      const block = blocks.find((name) => owners.get(name) === component) ?? blocks[0] ?? null;
      const variants = block ? owners.get(block).meta.classes.filter((name) => name.startsWith(`${block}--`) && !deprecated.has(name)).map((name) => name.slice(block.length + 2)) : [];
      const exports = [...source.matchAll(/^export function (\w+)/gm)].map((match) => match[1]);
      const overlay = exports.includes('open') && exports.includes('close') && (tag === 'dialog' || classes.some((name) => /^ds-(dialog|sheet)$/.test(name)));
      const needed = new Set(component ? [component.name] : []);
      for (const name of classes) if (owners.has(name)) needed.add(owners.get(name).name);
      out.push({
        behaviour: define.name,
        module,
        component: component?.name ?? null,
        attribute: define.attribute,
        file: `react/${define.name}.js`,
        display: override.export ?? (typeof given === 'string' ? given : pascal(define.name)),
        tag,
        classes,
        block,
        variants,
        role: override.role ?? found?.role ?? null,
        events: eventsOf(markdown, source),
        overlay,
        create: define.name === module && exports.includes('create'),
        components: [...needed].sort(),
      });
    }
  }
  const seen = new Map();
  for (const entry of out) {
    if (seen.has(entry.display)) throw new Error(`src/react/names.json: ${entry.behaviour} and ${seen.get(entry.display)} both export ${entry.display}`);
    seen.set(entry.display, entry.behaviour);
  }
  return out.sort((a, b) => a.behaviour.localeCompare(b.behaviour));
}

const quote = (value) => JSON.stringify(value).replace(/"/g, "'");

/** A generated module of dist/react/ (without its banner). */
export function behaviourModule(entry) {
  const lines = [
    '/**',
    ` * <${entry.display}> (${entry.attribute}): generated by scripts/react.mjs from`,
    ` * ${entry.component ? `src/components/${entry.component}/` : `src/js/${entry.module}.js`}; docs/react.md describes its props.`,
    ' */',
    `import ${entry.overlay ? `{ open, close } from ` : ''}'../js/${entry.module}.js';`,
    "import { behaviour } from './shared.js';",
    '',
    `export const ${entry.display} = behaviour({`,
    `  name: ${quote(entry.behaviour)},`,
    `  display: ${quote(entry.display)},`,
    `  attribute: ${quote(entry.attribute)},`,
    `  tag: ${quote(entry.tag)},`,
    `  classes: ${quote(entry.classes)},`,
    `  block: ${entry.block ? quote(entry.block) : 'null'},`,
    `  role: ${entry.role ? quote(entry.role) : 'null'},`,
    `  overlay: ${entry.overlay ? '{ open, close }' : 'null'},`,
    '});',
    '',
  ];
  return lines.join('\n');
}

/** The types of a generated module (without its banner). */
export function behaviourTypes(entry) {
  const variant = entry.variants.length ? entry.variants.map((name) => `'${name}'`).join(' | ') : 'never';
  const events = entry.events.map((type) => `  /** ds:${type} on the root. */\n  ${eventProp(type)}?: (event: CustomEvent) => void;`);
  const controller = entry.create ? `ReturnType<typeof import('../js/${entry.module}.js').create>` : 'Controller';
  return [
    `/** Types of <${entry.display}> (react/${entry.behaviour}.js), generated from ${entry.component ? `src/components/${entry.component}/` : `src/js/${entry.module}.js`}. */`,
    `import type { BehaviourComponent${entry.create ? '' : ', Controller'}${entry.overlay ? ', OverlayProps' : ''} } from './shared.js';`,
    '',
    `export type ${entry.display}Variant = ${variant};`,
    '',
    `export interface ${entry.display}Events {`,
    ...events,
    '}',
    '',
    `export declare const ${entry.display}: BehaviourComponent<'${entry.tag}', ${entry.display}Variant, ${entry.display}Events${entry.overlay ? ' & OverlayProps' : ''}, ${controller}>;`,
    '',
  ].join('\n');
}

/**
 * Rewrites a hand-written source's imports for dist/react/, where every
 * module and its types sit flat in ../js/: a component module
 * ('../components/<n>/<n>.js') and core types ('../types/js/<n>.js').
 */
export function rewriteReactImports(source) {
  return source
    .replace(/(['"])\.\.\/components\/([\w-]+)\/\2\.js\1/g, (match, q, name) => `${q}../js/${name}.js${q}`)
    .replace(/(['"])\.\.\/types\/js\/([\w-]+)\.js\1/g, (match, q, name) => `${q}../js/${name}.js${q}`);
}

/** The exports of a hand-written module (export const / export function). */
function handExports(source) {
  return [...source.matchAll(/^export (?:const|function) (\w+)/gm)].map((match) => match[1]);
}

/** The modules of dist/js/ that a source imports (core and component). */
function importedModules(source) {
  return [...new Set([...source.matchAll(/^import\s[^;]*?['"]\.\.\/(?:js\/([\w-]+)|components\/([\w-]+)\/\2)\.js['"]/gm)].map((match) => match[1] ?? match[2]))].sort();
}

/**
 * The files of dist/react/ (without banners): Map of dist path -> text,
 * and the manifest's "react" object.
 * @param {{ list: any[], read: (path: string) => string, has: (path: string) => boolean, moduleNames: string[], handFiles: string[] }} context
 */
export function reactDist(context) {
  const { read, handFiles } = context;
  const behaviours = reactBehaviours(context);
  const files = new Map();
  const manifest = {};
  const index = [];
  const indexTypes = [];
  const hand = handFiles.filter((file) => file.endsWith('.js')).map((file) => file.slice(0, -3)).sort();
  for (const name of hand) {
    if (!(name in REACT_HAND)) throw new Error(`src/react/${name}.js: list it in REACT_HAND of scripts/react.mjs (the stylesheets it needs)`);
    if (!handFiles.includes(`${name}.d.ts`)) throw new Error(`src/react/${name}.d.ts is missing: every adapter module has its types`);
    const source = read(`src/react/${name}.js`);
    const exports = handExports(source);
    files.set(`react/${name}.js`, rewriteReactImports(source));
    files.set(`react/${name}.d.ts`, rewriteReactImports(read(`src/react/${name}.d.ts`)));
    manifest[`react/${name}.js`] = { exports, components: REACT_HAND[name].components, modules: importedModules(source), generated: false };
    // Of the shared part only Icon is a component; the rest are the helpers of the generated modules.
    const listed = name === 'shared' ? exports.filter((id) => id === 'Icon') : exports;
    if (listed.length) {
      index.push(`export { ${listed.join(', ')} } from './${name}.js';`);
      indexTypes.push(`export { ${listed.join(', ')} } from './${name}.js';`);
    }
  }
  for (const name of Object.keys(REACT_HAND)) if (!hand.includes(name)) throw new Error(`scripts/react.mjs: REACT_HAND names ${name}, but src/react/${name}.js is missing`);
  for (const entry of behaviours) {
    files.set(entry.file, behaviourModule(entry));
    files.set(entry.file.replace(/\.js$/, '.d.ts'), behaviourTypes(entry));
    manifest[entry.file] = { exports: [entry.display], components: entry.components, modules: [entry.module], generated: true };
    index.push(`export { ${entry.display} } from './${entry.behaviour}.js';`);
    indexTypes.push(`export { ${entry.display} } from './${entry.behaviour}.js';`);
  }
  const head = '/** Every component of the React adapter (each file alone loads only its own module: prefer those). */';
  files.set('react/index.js', `${head}\n${index.join('\n')}\n`);
  files.set('react/index.d.ts', `${head}\n${indexTypes.join('\n')}\n`);
  manifest['react/index.js'] = { exports: [...index.flatMap((line) => /\{ ([^}]+) \}/.exec(line)[1].split(', '))], components: [], modules: [], generated: true };
  return { files, manifest, behaviours };
}

/** The table of generated components for docs/react.md (its generated block). */
export function reactTable(behaviours, list, read) {
  const anchorOf = (heading) => heading.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s/g, '-');
  const rows = behaviours.map((entry) => {
    const component = list.find((each) => each.name === entry.component);
    const heading = component?.md ? /^## (.+)$/m.exec(read(component.md))?.[1] : null;
    const docs = heading ? `[${heading}](components.md#${anchorOf(heading)})` : '[core.md](core.md)';
    const root = `\`<${entry.tag}${entry.classes.length ? ` class="${entry.classes.join(' ')}"` : ''}${entry.role ? ` role="${entry.role}"` : ''} ${entry.attribute}>\``;
    const variants = entry.variants.length ? entry.variants.map((name) => `\`${name}\``).join(', ') : '-';
    const events = entry.events.length ? entry.events.map((type) => `\`${eventProp(type)}\``).join(', ') : '-';
    return `| \`${entry.display}\` | \`react/${entry.behaviour}.js\` | ${root}${entry.overlay ? ', `open`, `onClose`' : ''} | ${variants} | ${events} | ${docs} |`;
  });
  return ['| Component | File | Root element | `variant` | Events | Docs |', '|---|---|---|---|---|---|', ...rows].join('\n');
}
