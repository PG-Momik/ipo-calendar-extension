import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { storage } from 'webextension-polyfill';

// --- Our Custom Logic ---
      
(self as any).Pusher = Pusher;

let echo: Echo | null = null;

console.log('IPO Notifier: Background service worker loaded.');

async function connectToWebSocket(token: string) {
  if (echo) echo.disconnect();
  console.log('IPO Notifier: Attempting to connect to WebSocket...');
  
  // This is the same logic as in the Pinia store, but duplicated here for the background
  const userResponse = await fetch(`http://localhost:8000/api/user`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });

  if (!userResponse.ok) {
    console.error('IPO Notifier: WebSocket auth failed, could not fetch user.');
    return;
  }
  const user = await userResponse.json();

  echo = new Echo({
    broadcaster: 'pusher',
    key: 'your_pusher_key', // Replace with your key
    cluster: 'your_cluster', // Replace with your cluster
    forceTLS: true,
    authEndpoint: `http://localhost:8000/broadcasting/auth`,
    auth: {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    },
  });

  echo.private(`user.${user.id}`)
    .listen('.new.ipo', (event: any) => {
      console.log('IPO Notifier: New IPO event received!', event);
      const ipo = event.ipo;
      chrome.notifications.create(`ipo-${ipo.id}`, {
        type: 'basic',
        iconUrl: 'images/icon_128.png',
        title: `New IPO Alert: ${ipo.name}`,
        message: `Company: ${ipo.company}\nDate: ${new Date(ipo.ipo_date).toLocaleDateString()}`,
        priority: 2,
      });
    });

  console.log(`IPO Notifier: Successfully subscribed to private channel 'user.${user.id}'`);
}

// Listen for messages from the UI (Pinia store)
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'webSocket:connect') {
    const { authToken } = await storage.local.get('authToken');
    if (authToken) connectToWebSocket(authToken);
  } else if (message.type === 'webSocket:disconnect') {
    if (echo) echo.disconnect();
    console.log('IPO Notifier: WebSocket disconnected by UI request.');
  }
});

// Connect on browser startup if already logged in
(async () => {
  const { authToken } = await storage.local.get('authToken');
  if (authToken) {
    console.log('IPO Notifier: Found existing token on startup, connecting...');
    await connectToWebSocket(authToken);
  }
})();

chrome.runtime.onInstalled.addListener(() => {
  console.log('IPO Notifier: Extension installed/updated.');
});