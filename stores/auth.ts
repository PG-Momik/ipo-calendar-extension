import { defineStore } from 'pinia';
import { storage } from 'webextension-polyfill';
import {getAuthHeaders, config} from "../utils";

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null as string | null,
    user: null as any | null,
    isAuthenticated: false,
    isLoading: true,
  }),

  actions: {
    listenForAuthChanges() {
      storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.authToken) {
          const newToken = changes.authToken.newValue;
          if (newToken) {
            this.token = newToken;
            this.fetchUser();
          } else {
            this.token = null;
            this.user = null;
            this.isAuthenticated = false;
          }
        }
      });
    },

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
        const response = await fetch(`${config.api.baseUrl}/user`, {
          headers: getAuthHeaders(this.token)
        })

        if (response.ok) {
          const data = await response.json()
          this.user = data.user
          this.isAuthenticated = true
        } else {
          await storage.local.remove('authToken')
          this.token = null
          this.user = null
          this.isAuthenticated = false
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)

        await storage.local.remove('authToken')
        this.token = null
        this.user = null
        this.isAuthenticated = false
      }
    },

    async handleLogin() {
      this.isLoading = true;

      try {
        const authUrl = config.oauth.redirectUrl;

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
      this.isLoading = true;
      const tokenToRevoke = this.token;

      if (tokenToRevoke) {
        try {
          await fetch(`${config.api.baseUrl}/logout`, {
            method: 'POST',
            headers: getAuthHeaders(tokenToRevoke)
          });

          console.log('Successfully logged out on the backend.');
        } catch (error) {
          console.error('Network error during backend logout:', error);
        }
      }

      await storage.local.remove('authToken');
      this.isLoading = false;
    },
  }
})