/**
 * The 3.0 registry model (scripts/build.mjs): every meta.json against its
 * stylesheet, the generated files of the repository (src/index.css,
 * docs/components.md, styleguide/demos.js), dist/manifest.json, the
 * minified stylesheets (parsed again, layers, registrations and curves
 * kept), ds.min.js and its stripper, and the version banners.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import vm from 'node:vm';
import { transform } from 'lightningcss';
import {
  COMPONENT_FILES, CORE, CSS_TARGETS, LAYERS, META_KEYS, META_REQUIRED, META_SCHEMA, MODULES, build, componentNames, components, componentsMd, cssFacts,
  componentKeyframes, diffGenerated, generatedFiles, hooksTable, indexCss, labComponentsJs, motionCss, moduleRequires, ownedHooks, packageInfo, replaceBlock, stripJs, sublayerStatement, validateSchema,
  moduleFiles, verifyComponents, verifyModuleRequires, withBanner, cascadeFacts, withoutConditions,
} from '../scripts/build.mjs';
import { scan, selectorList } from '../scripts/tools/css-scan.mjs';
import { filesIn, read, rules, stripComments } from './helpers.js';

const list = components();
const out = build();
const text = (path) => out.get(path).toString('utf8');
const manifest = JSON.parse(text('manifest.json'));

describe('src/components/<name>/', () => {
  it('holds one folder per component, each with its stylesheet and meta.json', () => {
    const names = componentNames();
    assert.ok(names.length >= 39, `${names.length} components`);
    for (const name of names) {
      const files = filesIn(`src/components/${name}`).map((path) => path.slice(path.lastIndexOf('/') + 1));
      assert.ok(files.includes(`${name}.css`) && files.includes('meta.json'), name);
      const allowed = [`${name}.css`, 'meta.json', ...Object.values(COMPONENT_FILES).map((file) => file(name))];
      assert.deepEqual(files.filter((file) => !allowed.includes(file)), [], `${name}: nothing else`);
    }
    for (const name of CORE) assert.ok(read(`src/core/${name}.css`).includes(LAYERS), name);
  });

  it('keeps every meta.json in step with its stylesheet (verifyComponents)', () => {
    assert.deepEqual(verifyComponents(list), []);
    for (const { name, meta } of list) {
      assert.deepEqual(Object.keys(meta), META_KEYS.filter((key) => key in meta), `${name}: the keys in order`);
      for (const key of META_REQUIRED) assert.ok(key in meta, `${name}: ${key}`);
      assert.equal(meta.order % 10, 0, `${name}: order in steps of 10`);
    }
  });

  it('owns every class of ds.css exactly once: a component, or a core stylesheet', () => {
    const owners = new Map();
    for (const [name, entry] of [...Object.entries(manifest.components), ...Object.entries(manifest.pseudo)]) {
      for (const cls of entry.classes) {
        assert.ok(!owners.has(cls), `.${cls}: ${owners.get(cls)} and ${name}`);
        owners.set(cls, name);
      }
    }
    const used = new Set();
    for (const { selector } of rules(read('dist/ds.css'))) for (const match of selector.matchAll(/\.(ds-[\w-]+)/g)) used.add(match[1]);
    assert.deepEqual([...used].filter((cls) => !owners.has(cls)).sort(), []);
  });

  it('fails a meta.json that drifts from its stylesheet, with the reason', () => {
    // A key added in the schema's order, so only the change itself is wrong.
    const withKey = (meta, key, value) => Object.fromEntries(META_KEYS.filter((each) => each in meta || each === key).map((each) => [each, each === key ? value : meta[each]]));
    const tamper = (name, change) => list.map((component) => (component.name === name ? { ...component, meta: change(structuredClone(component.meta)) } : component));
    const cases = [
      [tamper('badge', (meta) => ({ ...meta, classes: meta.classes.filter((cls) => cls !== 'ds-badge--ok') })), /badge\.css styles \.ds-badge--ok, which no meta\.json lists/],
      [tamper('badge', (meta) => ({ ...meta, classes: [...meta.classes, 'ds-badge--new'].sort() })), /lists \.ds-badge--new, which src\/components\/badge\/badge\.css does not style/],
      [tamper('card', (meta) => ({ ...meta, hooks: Object.fromEntries(Object.entries(meta.hooks).filter(([hook]) => hook !== '--ds-btn-height')) })), /card\/meta\.json: "hooks" misses --ds-btn-height/],
      [tamper('card', (meta) => ({ ...meta, hooks: { ...meta.hooks, '--ds-btn-bg': { owner: 'button' } } })), /"hooks" lists --ds-btn-bg, which src\/components\/card\/card\.css does not use/],
      [tamper('card', (meta) => ({ ...meta, hooks: { ...meta.hooks, '--ds-btn-height': { owner: 'alert' } } })), /card\/meta\.json: "hooks" --ds-btn-height: alert does not describe it/],
      [tamper('card', (meta) => ({ ...meta, hooks: { ...meta.hooks, '--ds-btn-height': { default: '1px', description: 'twice' } } })), /--ds-btn-height is described by button and card/],
      [tamper('button', (meta) => ({ ...meta, hooks: { ...meta.hooks, '--ds-btn-height': 'button' } })), /hooks\.--ds-btn-height: matches none of its forms/],
      [tamper('badge', (meta) => withKey(meta, 'tier', 4)), /badge\/meta\.json: tier: 4 is not one of 1, 2, 3/],
      [tamper('empty', (meta) => withKey(meta, 'module', true)), /"module" without empty\.js/],
      [tamper('badge', (meta) => withKey(meta, 'rippleHosts', ['.ds-btn'])), /"rippleHosts" \.ds-btn: name one of its own classes/],
      [tamper('badge', (meta) => withKey(meta, 'exceptions', { physical: { '.ds-badge: left': '' } })), /exceptions\.physical\.\.ds-badge: left: shorter than 1/],
      [tamper('badge', (meta) => withKey(meta, 'exceptions', { hover: { '.ds-btn:hover': 'not its own' } })), /badge\/meta\.json: exceptions\.hover "\.ds-btn:hover" names none of its own classes/],
      [tamper('badge', (meta) => withKey(meta, 'motionExceptions', { keyframeShape: { 'ds-spin': 'not its own' } })), /keyframeShape names ds-spin, which badge\.keyframes\.css does not define/],
      [tamper('badge', (meta) => { const { name, group, ...rest } = meta; return { group, name, ...rest }; }), /badge\/meta\.json: keys in the order name, group/],
      [tamper('dialog', (meta) => ({ ...meta, keyframes: [...meta.keyframes, 'ds-spin'].sort() })), /"keyframes" lists ds-spin/],
      [tamper('chip', (meta) => ({ ...meta, ripple: false })), /chip\/meta\.json: "ripple" is false/],
      [tamper('badge', (meta) => ({ ...meta, context: [] })), /badge\.css styles \.ds-chip of chip: add "chip" to "context"/],
      [tamper('badge', (meta) => ({ ...meta, js: ['nothing'] })), /"js" names nothing/],
      [tamper('badge', (meta) => ({ ...meta, group: 'misc' })), /group: "misc" is not one of/],
      [tamper('badge', (meta) => ({ ...meta, order: 10 })), /"order" 10 is also/],
      [tamper('badge', (meta) => ({ ...meta, order: 99999 })), /badge\/meta\.json: "order" 99999 comes after ripple's \(\d+\), the last sublayer/],
      [tamper('badge', (meta) => ({ ...meta, extra: true })), /unknown key "extra"/],
      [tamper('dialog', (meta) => ({ ...meta, progressive: [] })), /"progressive" is \[\], the "Progressive:" note/],
      [tamper('table', (meta) => ({ ...meta, attributes: [] })), /table\/meta\.json: "attributes" misses data-/],
      // The cascade between sublayers: a rule that names a later component's class, a stale context, the state classes.
      [tamper('card', (meta) => ({ ...meta, order: 5 })), /card\.css: line \d+: .* names \.ds-switch of switch, whose sublayer comes later \(order \d+ > 5\)/],
      [tamper('badge', (meta) => ({ ...meta, context: [...meta.context, 'table'].sort() })), /badge\/meta\.json: "context" lists table, whose classes src\/components\/badge\/badge\.css does not name/],
      [tamper('ripple', (meta) => ({ ...meta, stateClasses: ['ds-pressed', 'ds-x'] })), /ripple\/meta\.json: "stateClasses" lists \.ds-x, which is not one of its "classes"/],
      [tamper('ripple', (meta) => { const { stateClasses, ...rest } = meta; return rest; }), /button\.css styles \.ds-pressed of ripple: add "ripple" to "context"/],
    ];
    for (const [changed, reason] of cases) {
      const problems = verifyComponents(changed);
      assert.ok(problems.some((problem) => reason.test(problem)), `${reason}: ${problems.join(' | ')}`);
    }
  });

  it('finds the rules outside a component\'s own sublayer and the classes a selector names outside :not() and :has()', () => {
    const css = `${LAYERS}\n@layer ds.components.a {\n  .ds-a:not(.ds-b) > .ds-c:has(.ds-d) { color: red; }\n}\n@layer ds.components {\n  .ds-a { color: blue; }\n}\n@media print {\n  .ds-a { color: green; }\n}\n@property --ds-a-x { syntax: '*'; inherits: false; }\n`;
    const { outside, names } = cascadeFacts(css, 'a');
    assert.deepEqual(outside, ['line 6: .ds-a', 'line 9: .ds-a']);
    assert.deepEqual(names[0].classes, ['ds-a', 'ds-c']);
    assert.equal(withoutConditions('.ds-a:not(.ds-b, :has(.ds-c)) .ds-d:has(> .ds-e:not(.ds-f)) .ds-g'), '.ds-a .ds-d .ds-g');
    assert.deepEqual(cascadeFacts(`${LAYERS}\n@layer ds.components;\n@layer ds.components.a { .ds-a { color: red; } }\n`, 'a').outside, ['line 2: @layer ds.components']);
  });

  it('reads classes, attributes, hooks and keyframes the way the meta.json fields mean them', () => {
    const facts = cssFacts('@layer ds.components {\n  .ds-a[data-x="1"] .ds-b::before { animation: ds-spin 1s; width: var(--ds-a-w, 1px); }\n}\n@keyframes ds-own { to { opacity: 0; } }\n',
      { hooks: ['--ds-a-w', '--ds-a-h'], keyframes: ['ds-spin', 'ds-fade-in'] });
    assert.deepEqual(facts, { classes: ['ds-a', 'ds-b'], attributes: ['data-x'], hooks: ['--ds-a-w'], keyframes: ['ds-spin'], defines: ['ds-own'] });
  });
});

describe('scripts/meta-schema.json', () => {
  it('describes every key of a meta.json, the required ones first and in the order the files write them', () => {
    assert.deepEqual(META_KEYS.filter((key) => META_REQUIRED.includes(key)), META_REQUIRED);
    for (const key of META_KEYS) assert.ok(META_SCHEMA.properties[key].description, `${key}: a description`);
    for (const key of ['need', 'tier', 'status', 'roles', 'module', 'labExempt', 'exceptions', 'motionExceptions', 'rippleHosts', 'keyframeDocs']) assert.ok(META_KEYS.includes(key), key);
    for (const { name, meta } of list) assert.deepEqual(validateSchema(meta, META_SCHEMA), [], name);
  });

  it('validates the subset of JSON Schema it uses', () => {
    const schema = {
      type: 'object', additionalProperties: false, required: ['a'],
      properties: { a: { type: 'integer', minimum: 1 }, b: { $ref: '#/$defs/list' }, c: { anyOf: [{ type: 'string', pattern: '^x' }, { const: true }] }, d: { enum: [1, 2] } },
      $defs: { list: { type: 'array', items: { type: 'string', minLength: 1 }, uniqueItems: true } },
    };
    assert.deepEqual(validateSchema({ a: 2, b: ['x'], c: 'xy', d: 2 }, schema), []);
    assert.deepEqual(validateSchema({ a: 2, c: true }, schema), []);
    const problems = validateSchema({ a: 0, b: ['', 'y', 'y'], c: 'y', d: 3, e: 1 }, schema).join(' | ');
    for (const reason of [/a: below 1/, /b\[0\]: shorter than 1/, /b: lists an item twice/, /c: matches none of its forms/, /d: 3 is not one of 1, 2/, /unknown key "e"/]) assert.match(problems, reason);
    assert.match(validateSchema({}, schema).join(), /missing key "a"/);
    assert.match(validateSchema({ a: 1.5 }, schema).join(), /a: is number, expected integer/);
  });
});

describe('<name>.keyframes.css', () => {
  const motion = `${LAYERS}\n\n@layer ds.motion {\n  @keyframes ds-a {\n    from { opacity: 0; }\n  }\n}\n\n@layer ds.utilities {\n  .ds-enter { animation-name: ds-a; }\n}\n`;
  const own = `/* Keyframes of x. */\n${LAYERS}\n\n@layer ds.motion {\n  @keyframes ds-x-in {\n    from { translate: 0 8px; }\n  }\n}\n`;
  const reader = (files) => (path) => files[path];
  const x = { name: 'x', keyframesCss: 'src/components/x/x.keyframes.css' };

  it('appends each component\'s keyframes to the ds.motion block of motion.css, in component order', () => {
    const read = reader({ 'src/core/motion.css': motion, 'src/components/x/x.keyframes.css': own });
    assert.deepEqual(componentKeyframes(x, read).names, ['ds-x-in']);
    const css = motionCss([{ name: 'w' }, x], read);
    const block = css.slice(css.indexOf('@layer ds.motion {'), css.indexOf('@layer ds.utilities'));
    assert.match(block, /@keyframes ds-a[\s\S]*\/\* ── components\/x\/x\.keyframes\.css ── \*\/\n {2}@keyframes ds-x-in/);
    assert.equal(motionCss([{ name: 'w' }], read), motion, 'no keyframes files: motion.css as it is');
  });

  it('takes only @keyframes inside one @layer ds.motion block', () => {
    const fails = (text, reason) => assert.throws(() => componentKeyframes(x, () => text), reason);
    fails(own.replace(LAYERS, ''), /no "@layer ds\.tokens/);
    fails(own.replace('@layer ds.motion', '@layer ds.components'), /one "@layer ds\.motion \{ \.\.\. \}" block/);
    fails(own.replace('  @keyframes', '  .ds-x { color: red; }\n  @keyframes'), /only @keyframes inside @layer ds\.motion/);
    fails(`${own}\n.ds-x { color: red; }\n`, /and nothing else/);
  });

  it('checks the names against meta.json "keyframes" and "keyframeDocs" (verifyComponents)', () => {
    const problems = verifyComponents(list.map((component) => (component.name === 'badge' ? { ...component, keyframesCss: 'src/components/button/button.css' } : component)));
    assert.ok(problems.some((problem) => /button\.css: no "@layer|one "@layer ds\.motion/.test(problem)), problems.join(' | '));
  });
});

describe('generated blocks of hand-written files', () => {
  it('replaces only what lies between the markers, and fails without them', () => {
    const md = 'a\n<!-- generated: x (scripts/build.mjs; do not edit) -->\nold\n<!-- /generated: x -->\nb\n';
    assert.equal(replaceBlock(md, 'f.md', 'x', 'new\n'), 'a\n<!-- generated: x (scripts/build.mjs; do not edit) -->\nnew\n<!-- /generated: x -->\nb\n');
    const js = 'const A = [\n  // generated: y (scripts/build.mjs; do not edit)\n  // /generated: y\n];\n';
    assert.equal(replaceBlock(js, 'f.js', 'y', "  'a',"), "const A = [\n  // generated: y (scripts/build.mjs; do not edit)\n  'a',\n  // /generated: y\n];\n");
    assert.equal(replaceBlock(replaceBlock(js, 'f.js', 'y', "  'a',"), 'f.js', 'y', ''), js);
    assert.throws(() => replaceBlock('nothing', 'f.md', 'x', ''), /markers .* are missing/);
  });

  it('writes the hooks table of docs/theming.md from meta.json "hooks": every described hook once, adjacent equal rows shared', () => {
    const table = hooksTable(list);
    const rows = table.split('\n').slice(2);
    const named = rows.flatMap((row) => [...row.split(' | ')[0].matchAll(/`(--ds-[\w-]+)`/g)].map((match) => match[1]));
    assert.equal(new Set(named).size, named.length, 'each hook in one row');
    assert.ok(rows.some((row) => row.startsWith('| `--ds-btn-bg`, `--ds-btn-color`, `--ds-btn-border` | per variant |')), 'a shared row');
    for (const { meta } of list) for (const [hook, entry] of Object.entries(meta.hooks)) assert.ok(named.includes(hook) || 'owner' in entry, hook);
    assert.ok(read('docs/theming.md').includes(table));
  });
});

describe('generated files of the repository', () => {
  it('are up to date (npm run build writes them, --check compares them)', () => {
    assert.deepEqual(diffGenerated(), []);
    assert.deepEqual([...generatedFiles().keys()], ['src/index.css', 'docs/components.md', 'styleguide/demos.js', 'styleguide/lab-components.js', 'docs/theming.md',
      'docs/motion.md', 'docs/install.md', 'src/types/ds.d.ts', 'src/js/ripple.js', 'README.md', 'themes/example.css', 'styleguide/registry.js', 'styleguide/theme-generator.js']);
  });

  it('src/index.css: the layer statement, the sublayers and the imports in meta.json "order"', () => {
    const index = read('src/index.css');
    assert.equal(index, indexCss(list));
    const code = stripComments(index).trim().split('\n').filter(Boolean);
    assert.equal(code[0], LAYERS);
    assert.equal(code[1], sublayerStatement(list));
    // global.css first (every component may override it), then one sublayer per component in cascade order.
    assert.deepEqual(code[1].slice('@layer '.length, -1).split(', '), ['ds.components.global', ...list.map(({ name }) => `ds.components.${name}`)]);
    assert.deepEqual(code.slice(2), [...CORE.map((name) => `@import './core/${name}.css';`), ...list.map(({ name }) => `@import './components/${name}/${name}.css';`)]);
    assert.deepEqual(list.map(({ meta }) => meta.order), [...list.map(({ meta }) => meta.order)].sort((a, b) => a - b));
  });

  it('docs/components.md: the partials around every <name>.md in "docsOrder", byte for byte', () => {
    const docs = read('docs/components.md');
    assert.equal(docs, componentsMd(list));
    assert.ok(docs.startsWith(read('src/components/_partials/intro.md')));
    assert.ok(docs.endsWith(read('src/components/_partials/motion-classes.md') + read('src/components/_partials/attributes.md')));
    let at = 0;
    for (const component of list.filter((entry) => entry.md).sort((a, b) => a.meta.docsOrder - b.meta.docsOrder)) {
      const part = read(component.md);
      assert.match(part, /^## /, `${component.md} starts with its section`);
      const found = docs.indexOf(part, at);
      assert.ok(found >= at, `${component.md} in its place`);
      at = found + part.length;
    }
  });

  it('themes/example.css: a hook documented as unset is written so, with no fallback of its stylesheet', () => {
    assert.match(read('themes/example.css'), /--ds-btn-height-exact: \(unset\);/);
  });

  it('styleguide/lab-components.js: every <name>.lab.js after SG_LAB.add(), loaded by the Motion Lab between lab.js and motion-lab.js', () => {
    assert.match(read('styleguide/motion.html'), /<script src="lab\.js"><\/script>\n<script src="lab-components\.js"><\/script>\n<script src="motion-lab\.js"><\/script>/);
    const lab = [{ id: 'core-demo' }];
    const entry = "SG_LAB.add({ id: 'sample-open', group: 'overlays', title: 'Sample', shows: ['ds-fade-in'], html: '<p></p>', play: function () { return Promise.resolve(); } });";
    const fake = [{ name: 'sample', lab: 'src/components/sample/sample.lab.js' }];
    const script = labComponentsJs(fake, () => entry);
    const context = { SG_LAB: lab };
    context.globalThis = context;
    vm.runInNewContext(script, context);
    assert.deepEqual(lab.map((item) => item.id), ['core-demo', 'sample-open']);
    assert.ok(!Object.keys(lab).includes('add'), 'add() is not enumerable');
    assert.throws(() => lab.add({ ...lab[1] }), /the id is taken/);
    assert.throws(() => lab.add({ id: 'x', group: 'g', title: 't', html: '', shows: ['a'], play() {} }), /html is a string/);
    assert.throws(() => labComponentsJs(fake, () => 'export const a = 1;'), /a classic script/);
    assert.throws(() => labComponentsJs(fake, () => 'window.SG_LAB.push({});'), /SG_LAB\.add/);
    // The repository's own file runs on an empty lab.
    const empty = { SG_LAB: [] };
    empty.globalThis = empty;
    vm.runInNewContext(read('styleguide/lab-components.js'), empty);
    assert.equal(typeof empty.SG_LAB.add, 'function');
  });

  it('styleguide/demos.js: every <name>.demo.js registers through SG.demo() of sg-core.js, which the styleguide loads first', () => {
    const run = (source, context) => vm.runInNewContext(source, context);
    const context = { DS: { icons: {}, overlay: {} } };
    context.globalThis = context;
    assert.throws(() => run(read('styleguide/demos.js'), { ...context, globalThis: {} }), /load styleguide\/sg-core\.js first/);
    run(read('styleguide/sg-core.js'), context);
    run(read('styleguide/demos.js'), context);
    assert.deepEqual([...context.SG.list().map((spec) => spec.name)].sort(), list.filter((entry) => entry.demo).map((entry) => entry.name).sort());
    for (const spec of context.SG.list()) {
      const meta = list.find((entry) => entry.name === spec.name).meta;
      assert.equal(spec.group, meta.group, `${spec.name}: the demo's group is meta.json's`);
      assert.ok(spec.title && typeof spec.render === 'function', `${spec.name}: title and render`);
      assert.equal(spec.need, meta.need, `${spec.name}: the demo's need is meta.json's`);
    }
    // A demo file is a classic script: its top-level names stay inside its own function.
    assert.equal(context.DAYS, undefined);
    assert.match(read('styleguide/index.html'), /<script src="sg-core\.js"><\/script>\n<script src="registry\.js"><\/script>\n<script src="demos\.js"><\/script>\n<script src="theme-generator\.js"><\/script>\n<script src="shell\.js"><\/script>/);
  });

  it('styleguide/theme-generator.js: tools/theme.mjs as a classic script, the same themes from the same options', async () => {
    const { generateTheme } = await import('../scripts/tools/theme.mjs');
    const context = {};
    context.globalThis = context;
    vm.runInNewContext(read('styleguide/theme-generator.js'), context);
    const generator = context.SG_THEME_GENERATOR;
    assert.equal(typeof generator.generateTheme, 'function');
    assert.doesNotMatch(read('styleguide/theme-generator.js'), /import\.meta|^export |^import /m);
    for (const options of [{ seed: '#0b57d0' }, { seed: '#2f6b3a', scheme: 'vibrant', contrast: 'high', name: 'probe' }]) {
      assert.equal(generator.generateTheme(options).css, generateTheme(options).css, options.seed);
    }
    assert.match(read('styleguide/shell.js'), /var generator = window\.SG_THEME_GENERATOR;/);
    assert.doesNotMatch(read('styleguide/shell.js'), /import\(|data-sg-generator/, 'no module import and no fallback from disk');
  });

  it('styleguide/registry.js: every component of meta.json, the tokens of tokens.css and the 2.x need rows', () => {
    const context = {};
    context.globalThis = context;
    vm.runInNewContext(read('styleguide/registry.js'), context);
    const registry = JSON.parse(JSON.stringify(context.SG_REGISTRY)); // out of the vm's realm
    assert.deepEqual(registry.components.map((c) => c.name), list.map((entry) => entry.name));
    for (const c of registry.components) {
      const { meta, demo } = list.find((entry) => entry.name === c.name);
      assert.deepEqual([c.group, c.classes, c.hooks, c.demo], [meta.group, meta.classes, ownedHooks(meta), Boolean(demo)], c.name);
    }
    const tokens = registry.tokens.map(([name]) => name);
    assert.ok(tokens.includes('--ds-primary') && tokens.includes('--ds-space-4'));
    assert.equal(new Set(tokens).size, tokens.length);
    assert.ok(registry.needs.length > 50 && registry.needs.every(([need, name]) => need && list.some((entry) => entry.name === name)));
  });
});

describe('src/core/global.css: the rules for every element of .ds-theme', () => {
  const flat = (css) => scan(css).rules.map((rule) => ({ layer: rule.context[0], key: `${rule.context.join(' ')} | ${rule.selector}`, rule }));

  it('holds every rule of a stylesheet that no class or data-ds-* attribute keys, so every bundle has it', () => {
    for (const { name, css } of list) {
      for (const rule of scan(read(css)).rules) {
        if (rule.context.some((at) => /^@keyframes\b/.test(at))) continue;
        for (const selector of selectorList(rule.selector)) {
          const keyed = [...selector.matchAll(/\.(ds-[\w-]+)/g)].some((match) => !['ds-theme', 'ds-base'].includes(match[1])) || /\[\s*data-ds-/.test(selector);
          assert.ok(keyed, `${css}: ${selector} styles every element of the theme: it belongs in src/core/global.css (${name})`);
        }
      }
    }
  });

  it('keeps the cascade of ds.css: its rules lead ds.components, and its !important declarations have no rival', () => {
    const own = flat(read('src/core/global.css'));
    const all = flat(text('ds.css'));
    // Its own sublayer, the first of ds.components: where the border-box rule stood in 2.x, at the top of
    // utilities.css, the first component. Every component's sublayer comes after it, so every component may override it.
    assert.deepEqual(own.map((entry) => entry.layer), own.map(() => '@layer ds.components.global'));
    assert.deepEqual(all.filter((entry) => entry.layer === '@layer ds.components.global').map((entry) => entry.key), own.map((entry) => entry.key));
    assert.ok(manifest.sublayers.startsWith('@layer ds.components.global, '), 'the first sublayer');
    assert.ok(!all.some((entry) => entry.layer === '@layer ds.components'), 'no rule directly in ds.components (it would beat every sublayer)');
    // An !important declaration beats every normal one in its layer, so only another !important one of the same
    // property could depend on its place: there is none.
    for (const { rule } of own) {
      for (const declaration of rule.declarations.filter((d) => d.important)) {
        const rivals = all.filter((entry) => !own.some((o) => o.key === entry.key) && entry.rule.declarations.some((d) => d.important && d.property === declaration.property));
        assert.deepEqual(rivals.map((entry) => entry.key), [], `${rule.selector} { ${declaration.property} !important }`);
      }
    }
  });
});

describe('dist/manifest.json', () => {
  it('follows the documented shape', () => {
    const info = packageInfo();
    assert.deepEqual(Object.keys(manifest), ['name', 'version', 'layers', 'sublayers', 'core', 'pseudo', 'order', 'components', 'js']);
    assert.equal(manifest.name, 'dashboard-style');
    assert.equal(manifest.version, info.version);
    assert.equal(manifest.layers, LAYERS);
    assert.equal(manifest.sublayers, sublayerStatement(list));
    assert.ok(text('ds.css').includes(`\n${manifest.sublayers}\n`), 'ds.css declares the same sublayers');
    assert.deepEqual(manifest.core.css, ['css/core/tokens.css', 'css/core/options.css', 'css/core/base.css', 'css/core/motion.css', 'css/core/global.css']);
    assert.equal(manifest.core.properties, 'css/properties.css');
    assert.deepEqual(manifest.order, list.map(({ name }) => name));
    assert.deepEqual(Object.keys(manifest.pseudo), CORE);
    assert.ok(manifest.pseudo.tokens.classes.includes('ds-theme') && manifest.pseudo.base.classes.includes('ds-base'));
    assert.ok(manifest.pseudo.motion.keyframes.includes('ds-fade-in'), 'motion defines the keyframes');
    const KEYS = ['css', 'min', 'layer', 'group', 'requires', 'context', 'classes', 'attributes', 'keyframes', 'js', 'hooks', 'ripple', 'progressive', 'bytes', 'gzip'];
    for (const { name, meta } of list) {
      const entry = manifest.components[name];
      assert.deepEqual(Object.keys(entry), KEYS, name);
      assert.equal(entry.css, `css/components/${name}.css`);
      assert.equal(entry.min, `css/components/${name}.min.css`);
      for (const field of ['group', 'requires', 'context', 'classes', 'keyframes', 'js', 'ripple', 'progressive']) assert.deepEqual(entry[field], meta[field], `${name}.${field}`);
      assert.equal(entry.layer, `ds.components.${name}`, `${name}: its own sublayer`);
      // The attributes the stylesheet selects, plus the data-ds-* attributes its module reads (a bundle finds a behaviour by them), but for those a core module claims.
      const claimed = Object.values(manifest.js).flatMap((module) => module.attributes);
      const behaviour = meta.module ? [...read(moduleFiles(name).source).matchAll(/['"`](data-ds-[\w-]+)['"`]/g)].map((match) => match[1]).filter((attribute) => !claimed.includes(attribute)) : [];
      assert.deepEqual(entry.attributes, [...new Set([...meta.attributes, ...behaviour])].sort(), `${name}.attributes`);
      assert.deepEqual(entry.hooks, Object.keys(meta.hooks).sort(), `${name}.hooks: the names, sorted`);
      assert.equal(entry.bytes, out.get(entry.min).length, `${name}: bytes of the .min.css`);
      assert.equal(entry.gzip, gzipSync(out.get(entry.min), { level: 9 }).length, `${name}: gzip -9 of the .min.css`);
      for (const path of [entry.css, entry.min]) assert.ok(out.has(path), path);
    }
    for (const path of [...manifest.core.css, ...manifest.core.min, manifest.core.properties]) assert.ok(out.has(path), path);
  });

  it('lists every module of MODULES with its imports and exports', () => {
    assert.deepEqual(Object.keys(manifest.js), MODULES);
    for (const name of MODULES) {
      const source = read(moduleFiles(name).source);
      const entry = manifest.js[name];
      assert.deepEqual(Object.keys(entry), ['file', 'types', 'imports', 'exports', 'requires', 'exportRequires', 'attributes']);
      assert.ok(out.has(entry.file) && out.has(entry.types), name);
      assert.deepEqual(entry.exports, [...source.matchAll(/^export (?:const|function) ([\w$]+)/gm)].map((match) => match[1]));
      for (const other of entry.imports) assert.ok(MODULES.indexOf(other) < MODULES.indexOf(name), `${name} imports ${other}, an earlier module`);
    }
    assert.deepEqual(manifest.js.dom.imports, ['motion']);
  });

  it('writes the CSS each module needs from data: its own component (meta.json "js" inverted) and src/js/<module>.requires.json', () => {
    assert.deepEqual(verifyModuleRequires(list), []);
    assert.deepEqual(moduleRequires(list), Object.fromEntries(MODULES.map((name) => [name, { requires: manifest.js[name].requires, exportRequires: manifest.js[name].exportRequires, attributes: manifest.js[name].attributes }])));
    for (const name of MODULES) {
      const entry = manifest.js[name];
      const own = list.find((component) => component.name === name);
      if (own?.meta.js.includes(name)) assert.ok(entry.requires.includes(name), `${name}: its own stylesheet`);
      for (const [key, needs] of Object.entries(entry.exportRequires)) {
        assert.ok(entry.exports.includes(key), `${name}.${key}: an export`);
        for (const other of needs) assert.ok(other in manifest.components, `${name}.${key} needs ${other}`);
      }
    }
    assert.deepEqual(manifest.js.ripple.requires, ['ripple']);
    assert.deepEqual(manifest.js.indicator.requires, ['indicator']);
    assert.deepEqual(manifest.js.overlay.exportRequires.confirm, ['button', 'dialog', 'spinner', 'toast', 'utilities']);
    // The same export of the same behaviour needs the same stylesheets under either name.
    for (const [module, names] of [['dialog', ['alert', 'confirm', 'prompt']], ['toast', ['announce', 'closeToasts', 'toast', 'toastRegion']]]) {
      for (const name of names) assert.deepEqual(manifest.js[module].exportRequires[name], manifest.js.overlay.exportRequires[name], `DS.${module}.${name}`);
    }
    // Every module that writes a .ds-sr live region names utilities for that export.
    assert.ok(manifest.js.overlay.exportRequires.announce.includes('utilities') && manifest.js.motion.exportRequires.sortable.includes('utilities'));
  });

  it('keeps the attributes a core module claims off every component, also one whose module quotes them', () => {
    assert.deepEqual(manifest.js.overlay.attributes, ['data-ds-busy', 'data-ds-close', 'data-ds-open']);
    // A core module's define() claims its own: a bundle finds the module by them, and only them (no data-ds-keep).
    assert.deepEqual(manifest.js.indicator.attributes, ['data-ds-indicator', 'data-ds-indicator-class', 'data-ds-indicator-name', 'data-ds-indicator-reveal']);
    assert.ok(manifest.js.hotkeys.attributes.includes('data-ds-hotkey'));
    assert.ok(manifest.js.format.attributes.includes('data-ds-time'));
    assert.deepEqual(manifest.js.dom.attributes, []);
    for (const [name, component] of Object.entries(manifest.components)) {
      for (const attribute of manifest.js.overlay.attributes) assert.ok(!component.attributes.includes(attribute), `${name} does not own ${attribute}`);
    }
    assert.ok(manifest.components.dialog.attributes.includes('data-ds-dialog-form'), 'what only the dialog reads stays the dialog\'s');
  });
});

describe('minified stylesheets', () => {
  const stylesheets = [...out.keys()].filter((path) => /\.css$/.test(path) && !path.endsWith('.min.css') && /^(ds\.css|css\/)/.test(path) && path !== 'css/index.css');
  const code = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
  const count = (css, pattern) => (code(css).match(pattern) ?? []).length;

  it('sit next to every stylesheet of css/ and ds.css, each with its source map', () => {
    assert.ok(stylesheets.length >= 45, `${stylesheets.length} stylesheets`);
    for (const path of stylesheets) {
      const min = path.replace(/\.css$/, '.min.css');
      assert.ok(out.has(min) && out.has(`${min}.map`), min);
      const name = min.slice(min.lastIndexOf('/') + 1);
      assert.ok(text(min).endsWith(`\n/*# sourceMappingURL=${name}.map */\n`), `${min}: names its map`);
      const map = JSON.parse(text(`${min}.map`));
      assert.equal(map.version, 3);
      assert.equal(map.file, name);
      assert.deepEqual(map.sources, [path.slice(path.lastIndexOf('/') + 1)], `${min}: the unminified file next to it`);
      assert.ok(text(min).length < text(path).length, `${min} is smaller`);
    }
  });

  it('parse again without an error, and keep the layer statements, every layer, @property and linear()', () => {
    const info = packageInfo();
    for (const path of stylesheets) {
      const source = text(path);
      const min = text(path.replace(/\.css$/, '.min.css'));
      const result = transform({ filename: 'min.css', code: Buffer.from(min), minify: false, targets: CSS_TARGETS, errorRecovery: false });
      assert.deepEqual(result.warnings, [], path);
      assert.ok(min.startsWith(withBanner('x.css', '', info)), `${path}: the banner first`);
      const statements = source.split('\n').filter((line) => /^@layer [\w.,\- ]+;$/.test(line));
      assert.deepEqual(min.split('\n').slice(1, 1 + statements.length), [...new Set(statements)], `${path}: the layer statements right after the banner`);
      const layers = (css) => [...new Set(code(css).match(/@layer\s+[\w.-]+\s*\{/g)?.map((match) => match.replace(/\s+/g, '').slice(6, -1)) ?? [])].sort();
      assert.deepEqual(layers(min), layers(source), `${path}: the same layer blocks`);
      for (const pattern of [/@property\s+--[\w-]+/g, /linear\(/g, /@keyframes\s+[\w-]+/g, /@supports/g, /@container/g, /!important/g, /-webkit-[\w-]+/g]) {
        assert.equal(count(min, pattern), count(source, pattern), `${path}: ${pattern}`);
      }
      assert.doesNotMatch(code(min), /&/, `${path}: no nesting`);
    }
  });

  it('keep every @property of ds.css at the top level, with its syntax and inheritance', () => {
    // lightningcss writes the values its own way ('*' as "*", 0px as 0, transparent as #0000): the same registration.
    const blocks = (css) => (code(css).match(/@property\s+--[\w-]+\s*\{[^{}]*\}/g) ?? []).map((block) => {
      const flat = block.replace(/\s+/g, '').replace(/'/g, '"');
      return `${/--[\w-]+/.exec(flat)[0]} ${/syntax:("[^"]*")/.exec(flat)[1]} ${/inherits:(\w+)/.exec(flat)[1]} ${/initial-value:/.test(flat)}`;
    });
    assert.ok(blocks(text('ds.css')).length >= 29);
    assert.deepEqual(blocks(text('ds.min.css')).sort(), blocks(text('ds.css')).sort());
    // Outside every block: nothing precedes them but the statements, and no @property sits inside a layer.
    for (const match of code(text('ds.min.css')).matchAll(/@property/g)) {
      const before = code(text('ds.min.css')).slice(0, match.index);
      assert.equal((before.match(/\{/g) ?? []).length, (before.match(/\}/g) ?? []).length, 'at the top level');
    }
  });
});

describe('ds.min.js and stripJs()', () => {
  it('strips comments and indentation, never strings, template literals or regular expressions', () => {
    const source = [
      '/**',
      ' * A header.',
      ' */',
      'function a(x) {',
      '    // a comment',
      "    const s = 'not // a comment', t = \"nor /* this */\";",
      '    const u = `line one',
      '    // still the template ${x + `inner ${x}`} /* too */',
      '  end`;',
      '    const r = /\\/\\/ [/*] not a comment/g.test(s) ? x / 2 / 3 : 0; /* gone */',
      '    return /[a-z]+\\//i;',
      '}',
      '/*! kept */',
      'a(1) /* spans',
      'lines */ a(2)',
      '',
    ].join('\n');
    assert.equal(stripJs(source), [
      'function a(x) {',
      "const s = 'not // a comment', t = \"nor /* this */\";",
      'const u = `line one',
      '    // still the template ${x + `inner ${x}`} /* too */',
      '  end`;',
      'const r = /\\/\\/ [/*] not a comment/g.test(s) ? x / 2 / 3 : 0;',
      'return /[a-z]+\\//i;',
      '}',
      '/*! kept */',
      'a(1)',
      'a(2)',
      '',
    ].join('\n'));
    assert.throws(() => stripJs('const a = "open'), /unterminated string/);
    assert.throws(() => stripJs('const a = `open'), /unterminated template/);
  });

  it('runs as ds.js does: the same version, modules, exports and output', () => {
    const load = (path) => {
      const context = { console };
      context.globalThis = context;
      vm.runInNewContext(text(path), context);
      return context.DS;
    };
    const full = load('ds.js');
    const min = load('ds.min.js');
    assert.equal(min.version, full.version);
    assert.deepEqual(Object.keys(min), Object.keys(full));
    for (const name of MODULES) assert.deepEqual(Object.keys(min[name]), Object.keys(full[name]), name);
    for (const glyph of Object.keys(full.icons).filter((key) => typeof full.icons[key] === 'string')) assert.equal(min.icons[glyph], full.icons[glyph], glyph);
    assert.equal(min.icons.icon(min.icons.check, 16, 'x'), full.icons.icon(full.icons.check, 16, 'x'));
    assert.ok(text('ds.min.js').length < text('ds.js').length * 0.6, 'at most 60% of ds.js');
    assert.match(text('ds.min.js'), /^\/\*! Dashboard-Style [^\n]*\*\/\n\/\*! Icon shapes: Lucide \(ISC\) and Feather \(MIT\), see LICENSE \*\/\n/);
  });
});

describe('version banners', () => {
  it('head every CSS, JS, MJS, .d.ts and shell file of dist/ (after a #! line); JSON carries the version as data', () => {
    const info = packageInfo();
    const line = withBanner('x.css', '', info);
    for (const [path, content] of out) {
      if (/\.(css|js|mjs|ts)$/.test(path)) {
        const body = content.toString('utf8');
        assert.ok(body.replace(/^#![^\n]*\n/, '').startsWith(line), path);
      } else if (path.endsWith('.sh')) assert.match(content.toString('utf8'), new RegExp(`^#![^\\n]*\\n# Dashboard-Style ${info.version.replace(/[.-]/g, '\\$&')} `), path);
      else if (path.endsWith('.json') && !path.endsWith('.map')) assert.equal(JSON.parse(content.toString('utf8')).version, info.version, path);
    }
    assert.equal(withBanner('a.json', '{}', info), '{}');
    assert.equal(withBanner('a.mjs', '#!/usr/bin/env node\nx\n', info), `#!/usr/bin/env node\n${line}x\n`);
  });
});
