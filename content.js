// Inject a page-context function `requestTabClose()` that websites can call.
(function injectPageFunction() {
  try {
    const script = document.createElement('script');
    script.textContent = `
      (function(){
        if (typeof window.requestTabClose === 'function') return;
        window.requestTabClose = function(){
          try {
            window.postMessage({ source: 'allowlisted-tab-closer', action: 'close-tab' }, '*');
          } catch (e) {
            // no-op
          }
        };
      })();
    `;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  } catch (e) {
    // ignore
  }
})();

// Listen for page messages and forward to the extension background
window.addEventListener('message', (event) => {
  try {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== 'allowlisted-tab-closer' || data.action !== 'close-tab') return;
    chrome.runtime.sendMessage({ action: 'close-tab' });
  } catch (e) {
    // ignore
  }
});
