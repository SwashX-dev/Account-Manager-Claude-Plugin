const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
test('content scripts can open manager but cannot read or mutate accounts', async () => {
  let listener; let invoked = 0;
  const browser = { runtime: { id: 'test', getURL: p => `moz-extension://test/${p}`, onMessage: { addListener: fn => listener = fn } }, tabs: { query: async () => [], create: async () => {} } };
  const manager = new Proxy({}, { get: () => async () => { invoked++; return []; } });
  vm.runInNewContext(fs.readFileSync('extension/background.js', 'utf8'), { browser, AccountCore: { createManager: () => manager } });
  const webpage = { id: 'test', url: 'https://claude.ai/new', tab: { id: 1 } };
  for (const type of ['list', 'add', 'remove', 'rename', 'switch']) assert.equal((await listener({ type }, webpage)).ok, false);
  assert.equal(invoked, 0); assert.equal((await listener({ type: 'open-manager' }, webpage)).ok, true);
  assert.equal((await listener({ type: 'list' }, { id: 'test', url: 'moz-extension://test/manager.html' })).ok, true);
  assert.equal(invoked, 1);
  assert.equal(await listener({ type: 'list' }, { id: 'attacker', url: 'moz-extension://test/manager.html' }), undefined);
});
