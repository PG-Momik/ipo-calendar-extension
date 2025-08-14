import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

// Interface remains the same
export interface Ipo {
    id: number
    name: string
    type: 'IPO' | 'FPO' | 'Mutual Fund'
    ticker: string
    startDate: string
    endDate: string
    minUnits: number
    pricePerUnit: number
    subscriptionStatus: string
}

// MOCK DATA - Expanded to cover all test cases
const now = new Date();
const DAY_MS = 24 * 60 * 60 * 1000; // Milliseconds in a day

const mockIpos: Ipo[] = [
    // --- "This Week" Tab Data ---
    { id: 3, name: 'Vision Energy & Power', type: 'IPO', ticker: 'VEP', startDate: new Date(now.getTime() - 4 * DAY_MS).toISOString(), endDate: new Date(now.getTime() + 0 * DAY_MS).toISOString(), minUnits: 10, pricePerUnit: 100, subscriptionStatus: '1.9x Oversubscribed' },
    // 4. Ongoing - Closes in 2 days
    { id: 4, name: 'Sanima Middle Tamor Hydropower', type: 'IPO', ticker: 'TAMOR', startDate: new Date(now.getTime() - 2 * DAY_MS).toISOString(), endDate: new Date(now.getTime() + 2 * DAY_MS).toISOString(), minUnits: 10, pricePerUnit: 100, subscriptionStatus: '1.5x Oversubscribed' },
    // 5. Opens Tomorrow
    { id: 5, name: 'Prime Life Insurance', type: 'FPO', ticker: 'PLIC', startDate: new Date(now.getTime() + 1 * DAY_MS).toISOString(), endDate: new Date(now.getTime() + 5 * DAY_MS).toISOString(), minUnits: 10, pricePerUnit: 280, subscriptionStatus: 'Awaited' },
    // 6. Opens in 3 days (later this week)
    { id: 6, name: 'NABIL Balanced Fund III', type: 'Mutual Fund', ticker: 'NBF3', startDate: new Date(now.getTime() + 3 * DAY_MS).toISOString(), endDate: new Date(now.getTime() + 7 * DAY_MS).toISOString(), minUnits: 100, pricePerUnit: 10, subscriptionStatus: 'Awaited' },

    // --- "Upcoming" Tab Data ---
    // 7. Opens next week
    { id: 7, name: 'Himalayan Bank Ltd.', type: 'FPO', ticker: 'HBL', startDate: new Date(now.getTime() + 8 * DAY_MS).toISOString(), endDate: new Date(now.getTime() + 12 * DAY_MS).toISOString(), minUnits: 10, pricePerUnit: 250, subscriptionStatus: 'Awaited' },
    // 9. Opens in 25 days
    { id: 9, name: 'Saral Jeevan Bima', type: 'IPO', ticker: 'SJBLIC', startDate: new Date(now.getTime() + 25 * DAY_MS).toISOString(), endDate: new Date(now.getTime() + 29 * DAY_MS).toISOString(), minUnits: 10, pricePerUnit: 100, subscriptionStatus: 'Awaited' },

    // --- "Pipeline" Tab Data ---
    // 10. Opens in 2 months
    { id: 10, name: 'Reliance Spinning Mills', type: 'IPO', ticker: 'RELIANCE', startDate: new Date(now.getTime() + 60 * DAY_MS).toISOString(), endDate: new Date(now.getTime() + 65 * DAY_MS).toISOString(), minUnits: 10, pricePerUnit: 100, subscriptionStatus: 'In Pipeline' },
    // 11. Opens in 3 months
    { id: 11, name: 'Chirkhwa Hydropower', type: 'IPO', ticker: 'CKHL', startDate: new Date(now.getTime() + 90 * DAY_MS).toISOString(), endDate: new Date(now.getTime() + 95 * DAY_MS).toISOString(), minUnits: 50, pricePerUnit: 100, subscriptionStatus: 'In Pipeline' },
    // 12. Opens in 4 months
    { id: 12, name: 'Sephora Investment Group', type: 'IPO', ticker: 'SIG', startDate: new Date(now.getTime() + 120 * DAY_MS).toISOString(), endDate: new Date(now.getTime() + 125 * DAY_MS).toISOString(), minUnits: 10, pricePerUnit: 500, subscriptionStatus: 'In Pipeline' },
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

            await new Promise(resolve => setTimeout(resolve, 500));

            // Use the new, expanded mock data set
            this.ipos = mockIpos;

            this.isLoading = false;
        },

        async addToCalendar(ipoId: number) {
            const authStore = useAuthStore()
            if (!authStore.isAuthenticated) return

            this.addStatus[ipoId] = 'adding'
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.addStatus[ipoId] = 'success'
            setTimeout(() => { delete this.addStatus[ipoId] }, 3000)
        }
    },
})