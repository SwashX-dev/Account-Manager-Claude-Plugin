/* global browser */
(() => {
  'use strict';
  async function open(event) {
    event.preventDefault(); event.stopPropagation();
    const response = await browser.runtime.sendMessage({ type: 'open-manager' });
    if (!response?.ok) event.currentTarget.textContent = 'Use the Firefox Account Manager button';
  }
  // Stable fallback survives changes to Claude's private menu implementation.
  const host = document.createElement('div'); host.id = 'cam-launcher';
  const shadow = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = ':host{position:fixed;right:18px;bottom:18px;z-index:2147483000}button{font:12px system-ui;color:#56443b;background:#f7f5f0;border:1px solid #d8c9bd;border-radius:20px;padding:9px 14px;box-shadow:0 2px 10px #0001;cursor:pointer}button:focus-visible{outline:3px solid #b66c4e;outline-offset:3px}';
  const launch = document.createElement('button'); launch.textContent = '✳ Account Manager'; launch.addEventListener('click', event => { open(event).catch(() => { launch.textContent = 'Reload page to use Account Manager'; }); });
  shadow.append(style, launch); document.documentElement.append(host);
  let scheduled = false;
  function inspectMenus() {
    scheduled = false;
    for (const menu of document.querySelectorAll('[role="menu"]')) {
      // Only augment a visible account menu with an explicit logout item.
      if (!menu.getClientRects().length || menu.querySelector('[data-cam-entry]')) continue;
      const logout = [...menu.querySelectorAll('[role="menuitem"],button,a')].find(el => /^(log out|sign out)$/i.test(el.textContent.trim()));
      if (!logout) continue;
      const entry = document.createElement('button'); entry.type = 'button'; entry.setAttribute('role', 'menuitem'); entry.dataset.camEntry = 'true'; entry.textContent = 'Account Manager';
      entry.style.cssText = 'display:block;width:100%;text-align:start;padding:9px 12px;border:0;border-radius:6px;background:transparent;color:inherit;font:inherit;cursor:pointer';
      entry.addEventListener('click', event => { open(event).catch(() => { entry.textContent = 'Use the Firefox toolbar button'; }); });
      menu.append(entry);
    }
  }
  const observer = new MutationObserver(() => { if (!scheduled) { scheduled = true; requestAnimationFrame(inspectMenus); } });
  observer.observe(document.body, { childList: true, subtree: true }); inspectMenus();
})();
