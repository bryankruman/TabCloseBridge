TabCloseBridge (Chromium Extension)

Overview
- This extension exposes a single global function a website can call: requestTabClose().
- When called from a page whose hostname is on the extension's allowlist, the current tab will be closed via the Chrome Tabs API.
- This bypasses the normal restriction where window.close() is blocked on tabs not opened by script.

How it works
- A content script injects a page-level function: window.requestTabClose().
- When invoked, it posts a message that the content script relays to the background service worker.
- The background checks the current tab's URL hostname against the allowlist stored in chrome.storage (user-manageable via the Options page). If allowed, it calls chrome.tabs.remove(tabId).

Files
- manifest.json: Extension manifest (MV3)
- background.js: Service worker that validates the allowlist and closes the tab
- content.js: Injects the page-level function and relays requests
- options.html / options.js: Options UI to edit the allowlist (open from the extension's Settings)
- allowlist.json: Packaged default allowlist (used only for first-run seeding)

Allowlist format
- Exact hostname: "example.com" allows only example.com
- Subdomains: ".example.com" allows example.com and any subdomain like foo.example.com
- Local development: include "localhost" and/or "127.0.0.1"

Usage (developer)
1. Open Chromium/Chrome and navigate to: chrome://extensions
2. Enable "Developer mode"
3. Click "Load unpacked" and select this project folder
4. Click the extension's "Details" then "Extension options" (or right-click the toolbar icon > Options) to open the Options page.
5. Enter your allowlisted hostnames (one per line) and Save.
6. On any allowlisted domain, open DevTools Console and run:
   requestTabClose()
   The tab should close.
7. On a non-allowlisted domain, the tab should NOT close, and a warning will appear in the background console.

Recommended calling code
- To safely invoke the extension when available and gracefully fall back when it isn't, call this from your page/app:
  typeof window.requestTabClose === 'function' ? window.requestTabClose() : window.close();
  This avoids errors on browsers where the extension isn't installed or not yet loaded, while still attempting a normal window.close().

Notes
- The function name is requestTabClose for a clean, single-line call.
- If you prefer a different name, it can be changed in content.js (both the injected function name and any references) while keeping the rest the same.
- This implementation keeps the allowlist static via allowlist.json for simplicity. An options page or storage-based editor can be added later if needed.
