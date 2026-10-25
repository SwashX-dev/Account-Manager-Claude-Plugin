const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
// Minimal DOM adapter checks event/state behavior, not browser layout.
class Element {
  constructor(tag) { this.tagName = tag; this.children = []; this.listeners = {}; this.value = ''; this.textContent = ''; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  addEventListener(type, handler) { this.listeners[type] = handler; }
  setAttribute(name, value) { this[name] = value; }
  focus() { this.focused = true; }
  querySelectorAll(tag) { return this.children.flatMap(c => [...(c.tagName === tag ? [c] : []), ...c.querySelectorAll(tag)]); }
}
async function setup() {
  const ids = Object.fromEntries(['accounts', 'status', 'confirm', 'dialog-text', 'name', 'add-form', 'refresh'].map(id => [id, new Element('div')]));
  const accounts = [{ id: 'one', name: '<img src=x onerror=alert(1)>', available: true, active: true }]; const messages = [];
  const document = { getElementById: id => ids[id], createElement: tag => new Element(tag), querySelectorAll: tag => Object.values(ids).flatMap(e => e.querySelectorAll(tag)) };
  const browser = { runtime: { sendMessage: async message => {
    messages.push(message);
    if (message.type === 'list') return { ok: true, data: accounts };
    if (message.type === 'rename') accounts[0].name = message.name;
    if (message.type === 'add') return { ok: false, error: 'Container unavailable' };
    return { ok: true };
  } } };
  vm.runInNewContext(fs.readFileSync('extension/manager.js', 'utf8'), { document, browser });
  await new Promise(resolve => setImmediate(resolve)); return { ids, document, messages };
}
test('UI escapes labels and keeps rename editor until saved', async () => {
  const f = await setup(); const card = f.ids.accounts.children[0];
  assert.equal(card.children[0].children[0].textContent, '<img src=x onerror=alert(1)>');
  await card.querySelectorAll('button').find(b => b.textContent === 'Rename').listeners.click();
  const input = f.ids.accounts.querySelectorAll('input')[0]; assert.ok(input); assert.equal(input.focused, true);
  input.value = 'Home';
  await f.ids.accounts.querySelectorAll('button').find(b => b.textContent === 'Save name').listeners.click();
  assert.equal(f.ids.accounts.children[0].children[0].children[0].textContent, 'Home');
  assert.equal(f.messages.filter(m => m.type === 'rename').length, 1);
});
test('failed addition preserves label and displays error', async () => {
  const f = await setup(); f.ids.name.value = 'Work'; f.ids['add-form'].listeners.submit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.ids.status.textContent, 'Container unavailable'); assert.equal(f.ids.name.value, 'Work');
});
test('switch action sends correct container ID', async () => {
  const f = await setup(); await f.ids.accounts.querySelectorAll('button').find(b => b.textContent === 'Open / switch').listeners.click();
  assert.equal(f.messages.find(m => m.type === 'switch').id, 'one');
});
