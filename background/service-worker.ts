console.log('IPO Calendar: Background service worker loaded.');

chrome.runtime.onInstalled.addListener(() => {
    console.log('IPO Calendar: Extension installed/updated.');
});

