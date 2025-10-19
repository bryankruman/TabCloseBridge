(function () {
  try {
    if (window.__tabCloseBridgeInstalled) return;
    window.__tabCloseBridgeInstalled = true;

    // Preserve native window.close for diagnostics
    try {
      if (!window._nativeWindowClose) {
        window._nativeWindowClose = (typeof window.close === 'function') ? window.close.bind(window) : null;
      }
    } catch (_) { /* ignore */ }

    function bridgeClose() {
      try {
        window.postMessage({ source: 'allowlisted-tab-closer', action: 'close-tab' }, '*');
      } catch (_) {
        // no-op
      }
    }

    // Expose requestTabClose if not present
    if (typeof window.requestTabClose !== 'function') {
      window.requestTabClose = bridgeClose;
    }

    // Determine whether to override window.close based on our script src param
    var shouldBridgeClose = false;
    try {
      var cs = document.currentScript;
      if (cs && cs.src) {
        var url = new URL(cs.src, location.href);
        var p = url.searchParams.get('bridgeClose');
        shouldBridgeClose = p === '1' || p === 'true';
      }
    } catch (_) { /* ignore */ }

    if (shouldBridgeClose) {
      try {
        Object.defineProperty(window, 'close', {
          value: bridgeClose,
          writable: true,
          configurable: true
        });
      } catch (_) {
        try { window.close = bridgeClose; } catch (__){ /* ignore */ }
      }
    }
  } catch (_) { /* ignore */ }
})();
