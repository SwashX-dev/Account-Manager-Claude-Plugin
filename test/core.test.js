const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createManager } = require('../extension/core');
function fixture() {
  const db = {}; const identities = new Map(); const tabs = []; let n = 0;
  const calls = [];
  const api = {
    storage: { local: { get: async () => structuredClone(db), set: async value => Object.assign(db, structuredClone(value)) } },
    contextualIdentities: {
      create: async props => { const item = { ...props, cookieStoreId: `firefox-container-${++n}` }; identities.set(item.cookieStoreId, item); return item; },
      get: async id => { if (!identities.has(id)) throw new Error('Container missing'); return identities.get(id); },
      query: async () => [...identities.values()],
      update: async (id, props) => Object.assign(identities.get(id), props),
      remove: async id => { calls.push(['remove-container', id]); identities.delete(id); }
    },
    tabs: {
      query: async q => tabs.filter(t => (!q.cookieStoreId || t.cookieStoreId === q.cookieStoreId) && (!q.url || t.url.startsWith('https://claude.ai/')) && (!q.active || t.active)),
      create: async props => { tabs.forEach(t => t.active = false); const t = { ...props, id: tabs.length + 1, windowId: 1, active: true }; tabs.push(t); return t; },
      update: async (id, props) => { tabs.forEach(t => t.active = false); return Object.assign(tabs.find(t => t.id === id), props); },
      remove: async ids => { calls.push(['remove-tabs', ids]); ids.forEach(id => { const i = tabs.findIndex(t => t.id === id); if (i !== -1) tabs.splice(i, 1); }); }
    }, windows: { update: async () => {} }
  };
  return { api, db, identities, tabs, calls, manager: createManager(api) };
}
test('accounts use different stores, persist across manager restarts, and reuse tabs', async () => {
  const f = fixture(); const a = await f.manager.add('Personal'); const b = await f.manager.add('Work');
  assert.notEqual(a.id, b.id); assert.equal(f.tabs.length, 2);
  const restarted = createManager(f.api); await restarted.switch(a.id);
  assert.equal(f.tabs.length, 2); assert.equal((await restarted.list()).find(x => x.active).id, a.id);
  assert.deepEqual(Object.keys(f.db.accounts[0]).sort(), ['id', 'name']);
});
test('unmanaged containers cannot be switched, renamed, or deleted', async () => {
  const f = fixture();
  await assert.rejects(f.manager.switch('default'), /not managed/);
  await assert.rejects(f.manager.rename('default', 'x'), /not managed/);
  await assert.rejects(f.manager.remove('default'), /not managed/);
  assert.equal(f.calls.length, 0);
});
test('duplicate and invalid labels are rejected, including concurrent additions', async () => {
  const f = fixture(); const results = await Promise.allSettled([f.manager.add('Work'), f.manager.add(' work ')]);
  assert.equal(results.filter(x => x.status === 'fulfilled').length, 1);
  for (const value of ['', ' ', 'x'.repeat(61), null, '\nName']) await assert.rejects(f.manager.add(value));
});
test('removal closes only owned tabs before deleting container; other sessions survive', async () => {
  const f = fixture(); const a = await f.manager.add('A'); const b = await f.manager.add('B');
  await f.manager.remove(a.id);
  assert.deepEqual(f.calls.map(x => x[0]), ['remove-tabs', 'remove-container']);
  assert.equal(f.tabs.length, 1); assert.equal(f.tabs[0].cookieStoreId, b.id);
  assert.equal((await f.manager.list()).length, 1);
});
test('missing containers are reported and can be forgotten without deleting others', async () => {
  const f = fixture(); const a = await f.manager.add('A'); f.identities.delete(a.id);
  assert.equal((await f.manager.list())[0].available, false);
  await assert.rejects(f.manager.switch(a.id), /missing/);
  await f.manager.remove(a.id); assert.deepEqual(await f.manager.list(), []);
});
test('metadata failure rolls back newly created container', async () => {
  const f = fixture(); f.api.storage.local.set = async () => { throw new Error('Disk full'); };
  await assert.rejects(f.manager.add('A'), /Disk full/); assert.equal(f.identities.size, 0);
});
test('navigation failure preserves saved account for retry', async () => {
  const f = fixture(); f.api.tabs.create = async () => { throw new Error('Navigation failed'); };
  await assert.rejects(f.manager.add('A'), /Navigation failed/);
  assert.equal((await f.manager.list()).length, 1);
});
test('rename is persistent and duplicate labels cannot replace another account', async () => {
  const f = fixture(); const a = await f.manager.add('A'); await f.manager.add('B');
  await assert.rejects(f.manager.rename(a.id, 'B'), /already exists/);
  await f.manager.rename(a.id, 'Home'); assert.equal((await f.manager.list())[0].name, 'Home');
});
test('container deletion failure preserves metadata and does not touch other accounts', async () => {
  const f = fixture(); const a = await f.manager.add('A');
  f.api.contextualIdentities.remove = async () => { throw new Error('Denied'); };
  await assert.rejects(f.manager.remove(a.id), /Denied/); assert.equal(f.db.accounts.length, 1);
});
test('corrupt metadata fails closed', async () => {
  const f = fixture(); f.db.accounts = 'invalid'; await assert.rejects(f.manager.add('A'), /invalid/); assert.equal(f.identities.size, 0);
});
