import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

const API_URL = 'http://localhost:8000'

export const usePreferenceStore = defineStore('preferences', {
  state: () => ({
    isSaving: false,
    error: null as string | null,
    successMessage: '' as string,
  }),

  actions: {
    async savePreferences(prefs: { enable_browser_notifications: boolean; auto_add_to_calendar: boolean }) {
      const authStore = useAuthStore()
      if (!authStore.token) {
        this.error = 'You are not authenticated.'
        return
      }

      this.isSaving = true
      this.error = null
      this.successMessage = ''

      try {
        const response = await fetch(`${API_URL}/api/user/preferences`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authStore.token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(prefs),
        })

        if (!response.ok) {
          throw new Error('Failed to save preferences.')
        }

        // Update the user object in the authStore with the new preferences
        const data = await response.json()
        if (authStore.user) {
          authStore.user.preferences = data.preferences
        }
        
        this.successMessage = 'Settings saved successfully!'

      } catch (err: any) {
        this.error = err.message || 'An unknown error occurred.'
      } finally {
        this.isSaving = false
        // Clear success message after a few seconds
        setTimeout(() => { this.successMessage = '' }, 3000)
      }
    },
  },
})