(function(){
  const textarea = document.getElementById('allowlist');
  const saveBtn = document.getElementById('saveBtn');
  const reloadBtn = document.getElementById('reloadBtn');
  const statusEl = document.getElementById('status');

  function normalize(lines) {
    const out = [];
    const seen = new Set();
    for (let raw of lines) {
      let s = String(raw).trim().toLowerCase();
      if (!s) continue;
      // remove protocol, path if pasted
      try {
        if (s.includes('://')) {
          const u = new URL(s);
          s = u.hostname.toLowerCase();
        } else if (s.includes('/') || s.includes('#') || s.includes('?')) {
          // crude strip of path/query/fragment
          s = s.split('/')[0].split('#')[0].split('?')[0];
        }
      } catch {}
      if (!s) continue;
      if (!/^[a-z0-9.-]+$/.test(s)) continue; // basic safety
      if (seen.has(s)) continue;
      seen.add(s);
      out.push(s);
    }
    return out;
  }

  function setStatus(msg, isError) {
    statusEl.textContent = msg || '';
    statusEl.classList.toggle('error', !!isError);
  }

  async function load() {
    setStatus('Loading...');
    try {
      const { allowlist } = await chrome.storage.sync.get({ allowlist: null });
      if (Array.isArray(allowlist) && allowlist.length) {
        textarea.value = allowlist.join('\n');
      } else {
        // Fallback to packaged default for first-time users
        try {
          const res = await fetch(chrome.runtime.getURL('allowlist.json'));
          if (res.ok) {
            const def = await res.json();
            if (Array.isArray(def)) textarea.value = def.join('\n');
          }
        } catch {}
      }
      setStatus('');
    } catch (e) {
      console.error('Failed to load allowlist:', e);
      setStatus('Failed to load allowlist', true);
    }
  }

  async function save() {
    const lines = textarea.value.split(/\r?\n/);
    const list = normalize(lines);
    setStatus('Saving...');
    try {
      await chrome.storage.sync.set({ allowlist: list });
      setStatus('Saved.');
    } catch (e) {
      console.error('Failed to save allowlist:', e);
      setStatus('Failed to save', true);
    }
  }

  saveBtn.addEventListener('click', save);
  reloadBtn.addEventListener('click', load);

  // Init
  load();
})();
