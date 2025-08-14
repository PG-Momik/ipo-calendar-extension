import { defineStore } from 'pinia'
import { storage } from 'webextension-polyfill'
import { useAuthStore } from './auth'

const API_URL = 'http://localhost:8000'

// Define a type for a single IPO for better TypeScript support
export interface Ipo {
    id: number
    name: string
    company: string
    ipo_date: string // Dates will come as ISO strings
    description: string | null
}

export const useIpoStore = defineStore('ipos', {
    state: () => ({
        ipos: [] as Ipo[],
        isLoading: false,
        error: null as string | null,
        addStatus: {} as Record<number, 'adding' | 'success' | 'error'> // To track calendar add status per IPO
    }),

    actions: {
        // Listens for changes made by the background script to chrome.storage
        listenForUpdates() {
            storage.onChanged.addListener((changes, area) => {
                if (area === 'local' && changes.ipos) {
                    console.log('IPO Store: Detected a change in stored IPOs. Updating UI.')
                    // Reactively update the state with the new data
                    this.ipos = changes.ipos.newValue
                }
            })
        },

        // Fetches the initial list of IPOs from the API
        async fetchIpos() {
            this.isLoading = true
            // First, try to load from local storage for a fast UI update
            const { ipos: storedIpos } = await storage.local.get('ipos')
            if (storedIpos) {
                this.ipos = storedIpos
            }

            // Then, fetch from the API to ensure data is fresh
            const authStore = useAuthStore()
            if (!authStore.isAuthenticated) {
                this.isLoading = false
                return
            }

            this.error = null
            try {
                const response = await fetch(`${API_URL}/api/ipos`, {
                    headers: {
                        'Authorization': `Bearer ${authStore.token}`,
                        'Accept': 'application/json',
                    },
                })
                if (!response.ok) throw new Error('Failed to fetch IPO data.')

                const apiIpos = await response.json()
                this.ipos = apiIpos
                // IMPORTANT: Update local storage with the fresh data from the API
                await storage.local.set({ ipos: apiIpos })

            } catch (err: any) {
                this.error = err.message
            } finally {
                this.isLoading = false
            }
        },

        // Handles adding a single IPO to the Google Calendar via the backend
        async addToCalendar(ipoId: number) {
            const authStore = useAuthStore()
            if (!authStore.isAuthenticated) return

            this.addStatus[ipoId] = 'adding'

            try {
                const response = await fetch(`${API_URL}/api/ipo/${ipoId}/add-to-calendar`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authStore.token}`,
                        'Accept': 'application/json',
                    },
                })

                if (!response.ok) {
                    throw new Error('Could not add to calendar.')
                }

                this.addStatus[ipoId] = 'success'
                setTimeout(() => { delete this.addStatus[ipoId] }, 3000)

            } catch (err) {
                this.addStatus[ipoId] = 'error'
                console.error('Failed to add to calendar:', err)
                setTimeout(() => { delete this.addStatus[ipoId] }, 3000)
            }
        }
    },
})