import { storage } from 'webextension-polyfill';

const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');


if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (token) {
    storage.local.set({ authToken: token }).then(() => {
      console.log('Token saved. Closing tab.');
      window.close();
    });
  } else {
    console.error('Authentication failed: No token received.');
    document.body.innerText = 'Authentication failed. Please try again.';
  }

}