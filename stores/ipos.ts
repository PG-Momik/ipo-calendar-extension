import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

// Updated interface with subscriptionStatus and removed sector from the primary data
export interface Ipo {
    id: number
    name: string
    type: 'IPO' | 'FPO' | 'Mutual Fund'
    ticker: string
    ipo_date: string
    minUnits: number
    pricePerUnit: number
    subscriptionStatus: string // e.g., "1.5x Oversubscribed", "Undersubscribed"
}

// MOCK DATA - Updated with the new subscription status for a realistic example
const mockIpos: Ipo[] = [
    { id: 1, name: 'Sanima Middle Tamor Hydropower', type: 'IPO', ticker: 'TAMOR', ipo_date: new Date('2025-08-12').toISOString(), minUnits: 10, pricePerUnit: 100, subscriptionStatus: '2.1x Oversubscribed' },
    { id: 2, name: 'NABIL Balanced Fund III', type: 'Mutual Fund', ticker: 'NBF3', ipo_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), minUnits: 100, pricePerUnit: 10, subscriptionStatus: '1.2x Oversubscribed' },
    { id: 3, name: 'Himalayan Bank Ltd.', type: 'FPO', ticker: 'HBL', ipo_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), minUnits: 10, pricePerUnit: 250, subscriptionStatus: '3.5x Oversubscribed' },
    { id: 4, name: 'Reliance Spinning Mills', type: 'IPO', ticker: 'RELIANCE', ipo_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), minUnits: 10, pricePerUnit: 100, subscriptionStatus: 'Undersubscribed' },
    { id: 5, name: 'Chirkhwa Hydropower', type: 'IPO', ticker: 'CKHL', ipo_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), minUnits: 50, pricePerUnit: 100, subscriptionStatus: '1.8x Oversubscribed' },
];

export const useIpoStore = defineStore('ipos', {
    state: () => ({
        ipos: [] as Ipo[],
        isLoading: false,
        error: null as string | null,
        addStatus: {} as Record<number, 'adding' | 'success' | 'error'>
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

            this.isLoading = false;
        },

        async addToCalendar(ipoId: number) {
            const authStore = useAuthStore()
            if (!authStore.isAuthenticated) return

            this.addStatus[ipoId] = 'adding'
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock success for now
            this.addStatus[ipoId] = 'success'
            setTimeout(() => { delete this.addStatus[ipoId] }, 3000)
        }
    },
})