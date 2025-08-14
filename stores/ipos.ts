import { defineStore } from 'pinia';

// The URL of your Laravel backend API
const API_URL = 'http://localhost:8000';

// The TypeScript interface for a single IPO object
export interface Ipo {
    id: number;
    name: string;
    type: 'IPO' | 'FPO' | 'Mutual Fund';
    ticker: string;
    startDate: string;
    endDate: string;
    minUnits: number;
    pricePerUnit: number;
    subscriptionStatus: string;
}

export const useIpoStore = defineStore('ipos', {
    state: () => ({
        ipos: [] as Ipo[],
        isLoading: false,
        error: null as string | null,
        addStatus: {} as Record<number, 'adding' | 'success' | 'error'>,
    }),

    actions: {
        /**
         * Fetches the list of IPOs from the public backend API.
         */
        async fetchIpos() {
            this.isLoading = true;
            this.error = null;

            try {
                // Make the API call without any authentication headers
                const response = await fetch(`${API_URL}/api/ipos`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch IPO data from the server.');
                }

                // Parse the full JSON response, which will be in the format { "data": [...] }.
                const responseData = await response.json();

                console.log(responseData)
                this.ipos = responseData.data;
            } catch (err: any) {
                console.error('Error fetching IPOs:', err);
                this.error = err.message || 'An unknown error occurred while fetching data.';
                this.ipos = []; // Clear data on error to avoid showing stale info
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Placeholder for adding an IPO to the calendar.
         * This will require authentication to be re-enabled later.
         */
        async addToCalendar(ipoId: number) {
            console.log(`'Add to Calendar' for IPO ${ipoId} clicked. Auth is currently disabled.`);
            // In the future, this will make an authenticated API call.
            // this.addStatus[ipoId] = 'adding';
            // await new Promise(resolve => setTimeout(resolve, 1000));
            // this.addStatus[ipoId] = 'success';
            // setTimeout(() => { delete this.addStatus[ipoId]; }, 3000);
        },
    },
});