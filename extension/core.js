/* global browser */
// Shared core is dependency-free and exercised with an injected browser adapter.
(function (root) {
  'use strict';
  const HOME = 'https://claude.ai/new';
  function label(value) {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > 60 || /[\u0000-\u001f\u007f]/u.test(value)) throw new Error('Use a name between 1 and 60 characters.');
    return value.trim();
  }
  function createManager(api) {
    let queue = Promise.resolve();
    const serial = fn => { const result = queue.then(fn); queue = result.catch(() => {}); return result; };
    const read = async () => {
      const { accounts = [] } = await api.storage.local.get('accounts');
      if (!Array.isArray(accounts) || accounts.some(a => !a || typeof a.id !== 'string' || typeof a.name !== 'string')) throw new Error('Account metadata is invalid. Do not reset Firefox data; see troubleshooting.');
      return accounts;
    };
    const write = accounts => api.storage.local.set({ accounts });
    const owned = async id => {
      const accounts = await read();
      const account = accounts.find(a => a.id === id);
      if (!account) throw new Error('This container is not managed by this extension.');
      return { accounts, account };
    };
    const open = async account => {
      await api.contextualIdentities.get(account.id);
      const tabs = await api.tabs.query({ cookieStoreId: account.id, url: 'https://claude.ai/*' });
      if (tabs.length) {
        await api.windows.update(tabs[0].windowId, { focused: true });
        return api.tabs.update(tabs[0].id, { active: true });
      }
      return api.tabs.create({ url: HOME, cookieStoreId: account.id });
    };
    return {
      list: () => serial(async () => {
        const accounts = await read();
        const identities = await api.contextualIdentities.query({});
        const [active] = await api.tabs.query({ active: true, currentWindow: true });
        return accounts.map(a => ({ ...a, available: identities.some(i => i.cookieStoreId === a.id), active: active?.cookieStoreId === a.id }));
      }),
      add: name => serial(async () => {
        name = label(name);
        const accounts = await read();
        if (accounts.some(a => a.name.toLowerCase() === name.toLowerCase())) throw new Error('An account with that label already exists.');
        const identity = await api.contextualIdentities.create({ name: `Claude · ${name}`, color: 'orange', icon: 'fingerprint' });
        const account = { id: identity.cookieStoreId, name };
        try { await write([...accounts, account]); }
        catch (error) { await api.contextualIdentities.remove(account.id); throw error; }
        // Saving first lets the user retry opening if navigation fails.
        await open(account);
        return account;
      }),
      switch: id => serial(async () => open((await owned(id)).account)),
      rename: (id, name) => serial(async () => {
        name = label(name);
        const { accounts, account } = await owned(id);
        if (accounts.some(a => a.id !== id && a.name.toLowerCase() === name.toLowerCase())) throw new Error('An account with that label already exists.');
        await api.contextualIdentities.update(id, { name: `Claude · ${name}` });
        account.name = name;
        await write(accounts);
      }),
      remove: id => serial(async () => {
        const { accounts } = await owned(id);
        const identities = await api.contextualIdentities.query({});
        if (identities.some(i => i.cookieStoreId === id)) {
          const tabs = await api.tabs.query({ cookieStoreId: id });
          if (tabs.length) await api.tabs.remove(tabs.map(t => t.id));
          await api.contextualIdentities.remove(id);
        }
        await write(accounts.filter(a => a.id !== id));
      })
    };
  }
  const exported = { createManager, label };
  if (typeof module !== 'undefined') module.exports = exported;
  else root.AccountCore = exported;
})(globalThis);
