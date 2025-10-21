(function(){
  async function openOptions() {
    try {
      if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
        await chrome.runtime.openOptionsPage();
      } else {
        chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
      }
    } catch (e) {
      try {
        chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
      } catch (_) {}
    } finally {
      // Close the popup regardless of outcome
      window.close();
    }
  }

  // Trigger immediately on load
  openOptions();
})();
