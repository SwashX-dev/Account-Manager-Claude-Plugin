/* global browser, AccountCore */
'use strict';
const manager = AccountCore.createManager(browser);
const managerURL = browser.runtime.getURL('manager.html');
let opening;
async function openManager() {
  if (opening) return opening;
  opening = (async () => {
    const tabs = await browser.tabs.query({});
    const existing = tabs.find(t => t.url === managerURL);
    if (existing) {
      await browser.windows.update(existing.windowId, { focused: true });
      await browser.tabs.update(existing.id, { active: true });
    } else await browser.tabs.create({ url: managerURL });
  })();
  try { await opening; } finally { opening = undefined; }
}
browser.runtime.onMessage.addListener(async (message, sender) => {
  if (sender.id !== browser.runtime.id || !message || typeof message.type !== 'string') return;
  const fromUI = sender.url === managerURL;
  const fromClaude = sender.tab && sender.url?.startsWith('https://claude.ai/');
  try {
    // Content scripts can open the UI, but cannot enumerate or mutate accounts.
    if (message.type === 'open-manager' && (fromUI || fromClaude)) { await openManager(); return { ok: true }; }
    if (!fromUI) return { ok: false, error: 'Open Account Manager to perform this action.' };
    let data;
    switch (message.type) {
      case 'list': data = await manager.list(); break;
      case 'add': data = await manager.add(message.name); break;
      case 'switch': await manager.switch(message.id); break;
      case 'rename': await manager.rename(message.id, message.name); break;
      case 'remove': await manager.remove(message.id); break;
      default: throw new Error('Unknown action.');
    }
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message || 'Firefox could not complete this action. Try again.' };
  }
});
