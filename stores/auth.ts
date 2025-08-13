import { defineStore } from 'pinia'
import { storage } from 'webextension-polyfill'

// Define this at the top for easy configuration
const API_URL = 'http://localhost:8000'

export const useAuthStore = defineStore('auth', {
  // The state of our application
  state: () => ({
    token: null as string | null,
    user: null as any | null,
    isAuthenticated: false,
    isLoading: true,
  }),

  // Actions are methods that can mutate the state
  actions: {
    async initialize() {
      this.isLoading = true
      const { authToken } = await storage.local.get('authToken')
      if (authToken) {
        this.token = authToken
        await this.fetchUser()
      }
      this.isLoading = false
    },

    async fetchUser() {
      if (!this.token) return

      try {
        const response = await fetch(`${API_URL}/api/user`, {
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/json',
          },
        })

        if (!response.ok) throw new Error('Auth failed')

        this.user = await response.json()

        console.log('response.json()');
        console.log(this.user);

        this.isAuthenticated = true
        // Tell the background script to connect to WebSockets
        chrome.runtime.sendMessage({ type: 'webSocket:connect' });

      } catch (error) {
        console.error('Failed to fetch user, logging out.', error)
        await this.logout()
      }
    },

    async handleLogin() {
      this.isLoading = true;
      try {
        const authUrl = `${API_URL}/auth/google/redirect`;

        const finalRedirectUrl = await chrome.identity.launchWebAuthFlow({
          url: authUrl,
          interactive: true,
        });

        if (chrome.runtime.lastError || !finalRedirectUrl) {
          throw new Error(chrome.runtime.lastError?.message || 'Authentication flow failed.');
        }

        const url = new URL(finalRedirectUrl);
        const token = url.searchParams.get('token');

        if (!token) {
          throw new Error('Token not found in redirect URL.');
        }

        // We have the token! Now save it and fetch the user.
        await storage.local.set({ authToken: token });

        this.token = token;

        await this.fetchUser();
      } catch (error) {
        console.error('Login failed:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      this.isLoading = true
      if (this.token) {
        // Inform the backend to invalidate the token
        await fetch(`${API_URL}/api/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.token}` },
        })
      }
      // Tell the background script to disconnect
      chrome.runtime.sendMessage({ type: 'webSocket:disconnect' });

      await storage.local.remove('authToken')
      this.token = null
      this.user = null
      this.isAuthenticated = false
      this.isLoading = false
    },
  },
})