/**
 * DS.wizard: how the summary reads a field (fieldLabel, fieldValue), in
 * Node on small stand-ins for the form controls. Moving, checking, the
 * steps, the errors and the summary on a page are wizard.spec.js.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fieldLabel, fieldValue } from './wizard.js';

/** A stand-in for an element: attributes, text and the parts the wizard reads. */
function node(tag, { attrs = {}, text = '', props = {}, children = [] } = {}) {
  const el = {
    tagName: tag.toUpperCase(),
    textContent: text,
    getAttribute: (name) => (name in attrs ? attrs[name] : null),
    closest: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    cloneNode: () => ({ textContent: text, querySelectorAll: () => [] }),
    ...props,
  };
  for (const child of children) child.parent = el;
  return el;
}

const label = (text) => node('label', { text });
const doc = { getElementById: () => null };

describe('DS.wizard.fieldLabel', () => {
  it('takes data-ds-wizard-label first, then the label, then aria-label, then the name', () => {
    const input = (attrs, labels = []) => node('input', { attrs, props: { type: 'text', name: 'serial', labels, ownerDocument: doc } });
    assert.equal(fieldLabel(input({ 'data-ds-wizard-label': 'Serial' }, [label('Serial number')])), 'Serial');
    assert.equal(fieldLabel(input({}, [label('  Serial \n number ')])), 'Serial number');
    assert.equal(fieldLabel(input({ 'aria-label': 'Serial (aria)' })), 'Serial (aria)');
    assert.equal(fieldLabel(input({})), 'serial');
  });

  it('names a radio by its group', () => {
    const group = node('fieldset', { props: { querySelector: () => ({ cloneNode: () => ({ textContent: 'What happened', querySelectorAll: () => [] }) }) } });
    const radio = node('input', { props: { type: 'radio', name: 'kind', labels: [label('It is slow')], closest: () => group, ownerDocument: doc } });
    assert.equal(fieldLabel(radio), 'What happened');
  });
});

describe('DS.wizard.fieldValue', () => {
  it('reads text trimmed, and nothing as an empty string', () => {
    assert.equal(fieldValue(node('input', { props: { type: 'text', value: '  SN-3381-77 ' } }), {}), 'SN-3381-77');
    assert.equal(fieldValue(node('textarea', { props: { type: 'textarea', value: '' } }), {}), '');
  });

  it('reads the option text of a select, several joined', () => {
    const select = node('select', { props: { selectedOptions: [{ textContent: ' LAPTOP-0042 ' }, { textContent: 'PRINTER-0003' }] } });
    assert.equal(fieldValue(select, {}), 'LAPTOP-0042, PRINTER-0003');
    assert.equal(fieldValue(node('select', { props: { selectedOptions: [{ textContent: '' }] } }), {}), '');
  });

  it('reads a lone checkbox as Yes or No and a group by the labels of what is ticked', () => {
    const lone = node('input', { props: { type: 'checkbox', name: 'callback', checked: true } });
    const scope = (peers) => ({ querySelectorAll: () => peers });
    assert.equal(fieldValue(lone, scope([lone])), 'Yes');
    lone.checked = false;
    assert.equal(fieldValue(lone, scope([lone])), 'No');
    const a = node('input', { props: { type: 'checkbox', name: 'parts', checked: true, labels: [label('Screen')], value: 'screen' } });
    const b = node('input', { props: { type: 'checkbox', name: 'parts', checked: false, labels: [label('Battery')], value: 'battery' } });
    const c = node('input', { props: { type: 'checkbox', name: 'parts', checked: true, labels: [], value: 'keyboard' } });
    assert.equal(fieldValue(a, scope([a, b, c])), 'Screen, keyboard');
  });

  it('reads the chosen radio, file names and a password as dots', () => {
    const one = node('input', { props: { type: 'radio', name: 'kind', checked: false, labels: [label('It does not start')], value: 'power' } });
    const two = node('input', { props: { type: 'radio', name: 'kind', checked: true, labels: [label('It is slow')], value: 'slow' } });
    assert.equal(fieldValue(one, { querySelectorAll: () => [one, two] }), 'It is slow');
    const files = node('input', { props: { type: 'file', files: [{ name: 'front.jpg' }, { name: 'label.png' }] } });
    assert.equal(fieldValue(files, {}), 'front.jpg, label.png');
    assert.equal(fieldValue(node('input', { props: { type: 'password', value: 'hunter2' } }), {}), '••••••••');
    assert.equal(fieldValue(node('input', { props: { type: 'password', value: '' } }), {}), '');
  });
});
