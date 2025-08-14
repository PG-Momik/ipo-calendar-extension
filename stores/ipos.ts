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

const mockIpos: Ipo[] = [
    { id: 1, name: 'Stripe', ticker: 'STRP', valuation: '$60B', ipo_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), tags: ['FinTech'], priceRange: '$34-39', interest: 'High interest' },
    { id: 2, name: 'Discord', ticker: 'DSCD', valuation: '$15B', ipo_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), tags: ['AI', 'Social'], priceRange: '', interest: 'Growing buzz' },
    { id: 3, name: 'Canva', ticker: 'CVNA', valuation: '$35B', ipo_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), tags: ['E-commerce'], priceRange: '$28-31', interest: 'High interest' },
    { id: 4, name: 'Notion', ticker: 'NTN', valuation: '$10B', ipo_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), tags: ['Productivity'], priceRange: '', interest: 'Growing buzz' },
    { id: 5, name: 'Databricks', ticker: 'DBRK', valuation: '$43B', ipo_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), tags: ['Data', 'AI'], priceRange: '$70-80', interest: 'High interest' },
];


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

            this.isLoading = true;
            this.error = null;
            // Simulate API call with a delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // In a real app, you would fetch from your API. Here, we use the mock data.
            this.ipos = mockIpos;
            // const response = await fetch(...);
            // this.ipos = await response.json();

            this.isLoading = false;
        },

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