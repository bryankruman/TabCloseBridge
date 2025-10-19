let allowlist = [];

async function readAllowlistFromStorage() {
  const { allowlist: stored } = await chrome.storage.sync.get({ allowlist: null });
  if (Array.isArray(stored)) {
    return stored.map(h => String(h).toLowerCase());
  }
  return null;
}

async function readDefaultAllowlist() {
  try {
    const url = chrome.runtime.getURL('allowlist.json');
    const res = await fetch(url, { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map(h => String(h).toLowerCase());
      }
    }
  } catch (e) {
    console.warn('TabCloseBridge: failed to load allowlist.json:', e);
  }
  return [];
}

async function loadAllowlist() {
  // Prefer storage; fall back to packaged defaults; seed storage first time
  const fromStorage = await readAllowlistFromStorage();
  if (fromStorage && fromStorage.length) {
    allowlist = fromStorage;
    return;
  }
  const defaults = await readDefaultAllowlist();
  allowlist = defaults;
  try {
    await chrome.storage.sync.set({ allowlist: defaults });
  } catch {}
}

function isHostAllowed(urlStr) {
  try {
    const u = new URL(urlStr);
    const host = u.hostname.toLowerCase();
    // Exact match or leading dot rule: if allowlist entry starts with '.' allow subdomains
    return allowlist.some(entry => {
      entry = entry.toLowerCase().trim();
      if (!entry) return false;
      if (entry.startsWith('.')) {
        const bare = entry.slice(1);
        return host === bare || host.endsWith('.' + bare);
      }
      return host === entry;
    });
  } catch {
    return false;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.action === 'close-tab') {
    const tabId = sender?.tab?.id;
    const tabUrl = sender?.tab?.url;
    if (!tabId || !tabUrl) return;

    if (isHostAllowed(tabUrl)) {
      chrome.tabs.remove(tabId, () => {
        if (chrome.runtime.lastError) {
          console.warn('TabCloseBridge: FAILED to close tab:', chrome.runtime.lastError);
        }
      });
    } else {
      console.warn('TabCloseBridge: blocked close from non-allowlisted host:', tabUrl);
    }
  }
});

// Load allowlist on startup and on service worker wake
loadAllowlist();

// Refresh allowlist when storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.allowlist) {
    const newVal = changes.allowlist.newValue;
    if (Array.isArray(newVal)) {
      allowlist = newVal.map(h => String(h).toLowerCase());
    }
  }
});

chrome.runtime.onInstalled.addListener(() => {
  loadAllowlist();
});
