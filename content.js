// Inject a page-context script without using inline code to satisfy strict CSPs.
(function init() {
  function inject(shouldBridgeClose) {
    try {
      const script = document.createElement('script');
      const url = chrome.runtime.getURL('page-bridge.js') + (shouldBridgeClose ? '?bridgeClose=1' : '?bridgeClose=0');
      script.src = url;
      script.async = false; // keep execution order predictable at document_start
      (document.head || document.documentElement).appendChild(script);
      // Do not remove immediately: page-bridge.js may read document.currentScript
    } catch (_) {
      // ignore
    }
  }

  try {
    // Ask background if current tab's URL is allowlisted to decide whether to bridge window.close
    chrome.runtime.sendMessage({ action: 'is-allowed', url: location.href }, (resp) => {
      const allowed = !!(resp && resp.allowed);
      inject(allowed);
    });
  } catch (_) {
    // Fallback: inject without bridging window.close
    inject(false);
  }
})();

// Listen for page messages and forward to the extension background
window.addEventListener('message', (event) => {
  try {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== 'allowlisted-tab-closer' || data.action !== 'close-tab') return;
    chrome.runtime.sendMessage({ action: 'close-tab' });
  } catch (_) {
    // ignore
  }
});
