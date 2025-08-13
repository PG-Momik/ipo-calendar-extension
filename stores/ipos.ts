import { defineStore } from 'pinia'
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
        async fetchIpos() {
            const authStore = useAuthStore()
            if (!authStore.isAuthenticated) return

            this.isLoading = true
            this.error = null
            try {
                const response = await fetch(`${API_URL}/api/ipos`, {
                    headers: {
                        'Authorization': `Bearer ${authStore.token}`,
                        'Accept': 'application/json',
                    },
                })

                if (!response.ok) {
                    throw new Error('Failed to fetch IPO data.')
                }

                this.ipos = await response.json()
            } catch (err: any) {
                this.error = err.message || 'An unknown error occurred.'
            } finally {
                this.isLoading = false
            }
        },

        async addToCalendar(ipoId: number) {
            const authStore = useAuthStore()
            if (!authStore.isAuthenticated) return

            this.addStatus[ipoId] = 'adding' // Set status to 'adding'

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

                this.addStatus[ipoId] = 'success' // Set status to 'success'
                // Reset status after a few seconds
                setTimeout(() => { delete this.addStatus[ipoId] }, 3000)

            } catch (err) {
                this.addStatus[ipoId] = 'error' // Set status to 'error'
                console.error('Failed to add to calendar:', err)
                // Reset status after a few seconds
                setTimeout(() => { delete this.addStatus[ipoId] }, 3000)
            }
        }
    },
})