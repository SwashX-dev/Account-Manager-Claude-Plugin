/* global browser */
'use strict';
const $ = id => document.getElementById(id);
async function send(type, args = {}) {
  const response = await browser.runtime.sendMessage({ type, ...args });
  if (!response?.ok) throw new Error(response?.error || 'The extension is unavailable. Reload it in Firefox.');
  return response.data;
}
function button(text, action, kind = '') {
  const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.className = kind;
  b.addEventListener('click', () => run(action)); return b;
}
async function run(action) {
  $('status').textContent = '';
  document.querySelectorAll('button').forEach(b => b.disabled = true);
  try { const result = await action(); if (result !== false) await render(); }
  catch (e) { $('status').textContent = e.message; }
  finally { document.querySelectorAll('button').forEach(b => b.disabled = false); }
}
async function render() {
  const accounts = await send('list');
  $('accounts').replaceChildren();
  if (!accounts.length) {
    const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = 'Your first space starts here. Add an account below.'; $('accounts').append(empty);
  }
  for (const account of accounts) {
    const card = document.createElement('article'); card.className = 'account';
    const top = document.createElement('div'); top.className = 'account-top';
    const title = document.createElement('span'); title.className = 'account-name'; title.textContent = account.name;
    const badge = document.createElement('span'); badge.className = 'badge'; badge.textContent = !account.available ? 'Container missing' : account.active ? '● Current space' : 'Separate session';
    top.append(title, badge); card.append(top);
    const actions = document.createElement('div'); actions.className = 'actions';
    if (account.available) {
      actions.append(button('Open / switch', () => send('switch', { id: account.id }), 'primary'));
      actions.append(button('Rename', async () => {
        const input = document.createElement('input'); input.value = account.name; input.maxLength = 60; input.setAttribute('aria-label', 'New account label');
        const save = button('Save name', async () => { await send('rename', { id: account.id, name: input.value }); });
        actions.replaceChildren(input, save, button('Cancel', render)); input.focus(); return false;
      }));
    }
    actions.append(button('Remove', async () => {
      $('dialog-text').textContent = `Remove “${account.name}”? All tabs in this container will close and its local sign-ins will be deleted. Your Claude account stays intact.`;
      // Re-enable dialog actions while the parent operation is awaiting a choice.
      $('confirm').querySelectorAll('button').forEach(b => b.disabled = false);
      $('confirm').returnValue = 'cancel';
      const choice = new Promise(resolve => $('confirm').addEventListener('close', () => resolve($('confirm').returnValue), { once: true }));
      $('confirm').showModal();
      if (await choice === 'remove') await send('remove', { id: account.id });
    }, 'quiet'));
    card.append(actions); $('accounts').append(card);
  }
}
$('add-form').addEventListener('submit', event => { event.preventDefault(); run(async () => { await send('add', { name: $('name').value }); $('name').value = ''; }); });
$('refresh').addEventListener('click', () => run(render));
run(render);
