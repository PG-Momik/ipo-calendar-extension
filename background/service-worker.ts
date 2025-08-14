// background/service-worker.ts (Raw WebSocket Implementation)

import { storage } from 'webextension-polyfill'

// --- Configuration ---
const PUSHER_CONFIG = {
    key: '70ed9bf910d9bf99ca8d',
    cluster: 'ap2',
}
const API_URL = 'http://localhost:8000'

// --- Main Logic ---
let ws: WebSocket | null = null
let userToken: string | null = null

console.log('IPO Notifier: Background service worker loaded.')

/**
 * Disconnects any existing WebSocket connection.
 */
function disconnect() {
    if (ws) {
        ws.close()
        ws = null
        console.log('IPO Notifier: Raw WebSocket disconnected.')
    }
}

/**
 * Establishes a raw WebSocket connection to the Pusher server.
 */
async function connectToWebSocket(token: string) {
    disconnect()
    userToken = token

    console.log('IPO Notifier: Attempting to connect with Raw WebSocket...')

    const wsUrl = `wss://ws-${PUSHER_CONFIG.cluster}.pusher.com:443/app/${PUSHER_CONFIG.key}?protocol=7&client=js&version=8.4.0&flash=false`

    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
        console.log('IPO Notifier: ✅ Raw WebSocket connection opened.')
    }

    ws.onmessage = async (event) => {
        const message = JSON.parse(event.data)
        console.log('IPO Notifier: <-- Received message', message)

        switch (message.event) {
            case 'pusher:connection_established':
                console.log('IPO Notifier: Raw message.data:', message.data)

                // Parse the stringified JSON data
                let connectionData
                try {
                    connectionData = typeof message.data === 'string'
                        ? JSON.parse(message.data)
                        : message.data
                } catch (e) {
                    console.error('IPO Notifier: Failed to parse connection data:', message.data)
                    return
                }

                console.log('IPO Notifier: Parsed connectionData:', connectionData)

                const socketId = connectionData.socket_id

                if (!socketId) {
                    console.error('IPO Notifier: No socket_id in connection established message:', connectionData)
                    return
                }

                console.log('IPO Notifier: Extracted socketId:', socketId)
                await subscribeToUserChannel(socketId)
                break

            case 'new.ipo':
                handleNewIpoEvent(message.data)
                break

            case 'pusher_internal:subscription_succeeded':
                console.log('IPO Notifier: ✅ Successfully subscribed to channel')
                break

            case 'pusher:subscription_error':
                console.error('IPO Notifier: ❌ Subscription error:', message.data)
                break
        }
    }

    ws.onclose = () => {
        console.log('IPO Notifier: ❌ Raw WebSocket connection closed.')
        ws = null
    }

    ws.onerror = (error) => {
        console.error('IPO Notifier: ❌ Raw WebSocket error:', error)
    }
}

/**
 * Subscribes to the user's private channel after the connection is established.
 */
async function subscribeToUserChannel(socketId: string) {
    if (!userToken) {
        console.error('IPO Notifier: No user token available for subscription');
        return;
    }

    if (!socketId || socketId === 'undefined') {
        console.error('IPO Notifier: Invalid socket ID:', socketId);
        return;
    }

    console.log('IPO Notifier: --> Attempting to subscribe to private channel...');
    console.log('IPO Notifier: Socket ID:', socketId);

    try {
        const userResponse = await fetch(`${API_URL}/api/user`, {
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Accept': 'application/json'
            },
        });

        if (!userResponse.ok) {
            throw new Error(`Failed to fetch user: ${userResponse.status}`);
        }

        const user = await userResponse.json();
        const channelName = `private-user.${user.id}`;

        console.log('IPO Notifier: Channel name:', channelName);

        // Create form data for authentication
        const formData = new URLSearchParams();
        formData.append('socket_id', socketId);
        formData.append('channel_name', channelName);

        // Debug log the form data
        console.log('IPO Notifier: Form data being sent:', {
            socket_id: socketId,
            channel_name: channelName,
            formDataString: formData.toString()
        });

        const authResponse = await fetch(`${API_URL}/api/broadcasting/auth-extension`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            body: formData.toString()
        });

        // Add debugging
        console.log('IPO Notifier: Auth response status:', authResponse.status);

        if (!authResponse.ok) {
            const errorBody = await authResponse.text();
            console.error('IPO Notifier: Auth response error:', {
                status: authResponse.status,
                statusText: authResponse.statusText,
                body: errorBody
            });
            throw new Error(`Channel auth failed: ${authResponse.status} - ${errorBody}`);
        }

        const authData = await authResponse.json();

        // Subscribe to channel
        const subscribeMessage = {
            event: 'pusher:subscribe',
            data: {
                auth: JSON.parse(authData).auth,
                channel: channelName,
            },
        };

        console.log('IPO Notifier: Sending subscribe message:', subscribeMessage);

        ws?.send(JSON.stringify(subscribeMessage));

        console.log(`IPO Notifier: ✅ Subscribed to channel '${channelName}'`);

    } catch (error) {
        console.error('IPO Notifier: ❌ Channel subscription failed:', error);
    }
}


/**
 * Handles the 'new.ipo' event payload.
 */
function handleNewIpoEvent(data: any) {
    // Pusher nests the payload inside a stringified JSON object. We need to parse it.
    const eventPayload = JSON.parse(data)
    const newIpo = eventPayload.ipo

    console.log('IPO Notifier: ✅ Parsed new IPO event!', newIpo)

    // Update storage logic
    storage.local.get('ipos').then(({ ipos: currentIpos = [] }) => {
        const updatedIpos = [newIpo, ...currentIpos]
        storage.local.set({ ipos: updatedIpos })
    })

    // Notification logic
    chrome.notifications.create(`ipo-${newIpo.id}`, {
        type: 'basic', title: `New IPO Alert: ${newIpo.name}`,
        message: `Company: ${newIpo.company}\nDate: ${new Date(newIpo.ipo_date).toLocaleDateString()}`,
        priority: 2,
    })
}


// --- Event Listeners to Control the Connection ---
// (These remain exactly the same as before)
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'webSocket:connect') {
        const { authToken } = await storage.local.get('authToken');
        if (authToken) await connectToWebSocket(authToken);
    } else if (message.type === 'webSocket:disconnect') {
        disconnect();
    }
});

storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.authToken) {
        const newToken = changes.authToken.newValue;
        if (newToken) connectToWebSocket(newToken);
        else disconnect();
    }
});

(async () => {
    const { authToken } = await storage.local.get('authToken');
    if (authToken) await connectToWebSocket(authToken);
})();

chrome.runtime.onInstalled.addListener(() => {
    console.log('IPO Notifier: Extension installed/updated.');
});