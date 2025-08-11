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
        this.isAuthenticated = true
        // Tell the background script to connect to WebSockets
        chrome.runtime.sendMessage({ type: 'webSocket:connect' });

      } catch (error) {
        console.error('Failed to fetch user, logging out.', error)
        await this.logout()
      }
    },

    handleLogin() {
      // This URL must match the route in your Laravel backend
      const redirectUrl = `${API_URL}/auth/google/redirect`
      chrome.tabs.create({ url: redirectUrl })
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