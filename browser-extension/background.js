// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'ozcuk-lookup',
    title: 'Özcük\'te ara: "%s"',
    contexts: ['selection']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'ozcuk-lookup' && info.selectionText) {
    // Store selected word and open popup
    chrome.storage.local.set({ selectedWord: info.selectionText.trim() }, () => {
      chrome.action.openPopup();
    });
  }
});

