console.log('IPO Notifier: Background service worker loaded.');

chrome.runtime.onInstalled.addListener(() => {
  console.log('IPO Notifier: Extension installed/updated.');
});