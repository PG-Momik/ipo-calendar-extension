import { defineStore } from 'pinia';
import { useAuthStore } from './auth';
import type { Ipo } from './ipos'; // We can reuse the Ipo interface

const API_URL = 'http://localhost:8000';

const now = new Date();
const DAY_MS = 24 * 60 * 60 * 1000;

const mockTrackedIpos: Ipo[] = [
    // Event 1: A normal IPO this week
    { id: 1, name: 'Sanima Middle Tamor Hydropower', type: 'IPO', ticker: 'TAMOR', startDate: new Date(now.getTime() - 2 * DAY_MS).toISOString(), endDate: new Date(now.getTime() + 2 * DAY_MS).toISOString(), minUnits: 10, pricePerUnit: 100, subscriptionStatus: '2.1x Oversubscribed', is_tracked: true },

    // Event 2: An IPO that starts today and overlaps with Event 1
    { id: 7, name: 'Apex Hydropower Ltd.', type: 'IPO', ticker: 'APEX', startDate: new Date(now.getTime() + 0 * DAY_MS).toISOString(), endDate: new Date(now.getTime() + 4 * DAY_MS).toISOString(), minUnits: 10, pricePerUnit: 100, subscriptionStatus: 'Awaited', is_tracked: true },

    // Event 3: A Mutual Fund that also overlaps with Event 1 and 2
    { id: 2, name: 'NABIL Balanced Fund III', type: 'Mutual Fund', ticker: 'NBF3', startDate: new Date(now.getTime() + 1 * DAY_MS).toISOString(), endDate: new Date(now.getTime() + 5 * DAY_MS).toISOString(), minUnits: 100, pricePerUnit: 10, subscriptionStatus: 'Awaited', is_tracked: true },

    // Event 4: An FPO next week
    { id: 3, name: 'Himalayan Bank Ltd.', type: 'FPO', ticker: 'HBL', startDate: new Date(now.getTime() + 8 * DAY_MS).toISOString(), endDate: new Date(now.getTime() + 12 * DAY_MS).toISOString(), minUnits: 10, pricePerUnit: 250, subscriptionStatus: 'Awaited', is_tracked: true },

    // Event 5: Another overlapping event next week
    { id: 8, name: 'Global IME Samunnat Fund', type: 'Mutual Fund', ticker: 'GIMESF', startDate: new Date(now.getTime() + 9 * DAY_MS).toISOString(), endDate: new Date(now.getTime() + 14 * DAY_MS).toISOString(), minUnits: 100, pricePerUnit: 10, subscriptionStatus: 'Awaited', is_tracked: true },
];

export const useCalendarStore = defineStore('calendar', {
    state: () => ({
        trackedIpos: [] as Ipo[],
        isLoading: false,
        error: null as string | null,
    }),
    actions: {
        async fetchTrackedIpos() {
            const authStore = useAuthStore();
            if (!authStore.isAuthenticated || !authStore.token) return;

            this.isLoading = true;
            this.error = null;
            try {
                console.log("CALENDAR STORE (DEBUG): Using mock data.");
                // Simulate a network delay
                await new Promise(resolve => setTimeout(resolve, 500));
                this.trackedIpos = mockTrackedIpos;
                // const response = await fetch(`${API_URL}/api/user/tracked-ipos`, {
                //     headers: { 'Authorization': `Bearer ${authStore.token}` }
                // });
                // if (!response.ok) throw new Error('Failed to fetch tracked IPOs.');
                //
                // const responseData = await response.json();
                // this.trackedIpos = responseData.data;

            } catch (err: any) {
                this.error = err.message;
            } finally {
                this.isLoading = false;
            }
        },

        async removeFromCalendar(ipoId: number) {
            const authStore = useAuthStore();
            if (!authStore.isAuthenticated || !authStore.token) return;

            // Optimistic UI: remove from the list immediately
            const originalIpos = [...this.trackedIpos];
            this.trackedIpos = this.trackedIpos.filter(ipo => ipo.id !== ipoId);

            try {
                console.log(`CALENDAR STORE (DEBUG): Simulating removal of IPO ID ${ipoId}.`);
                await new Promise(resolve => setTimeout(resolve, 500));

                // We can also trigger a toast from here if we emit an event
                return { success: true, message: 'Successfully removed.' };
            } catch (err: any) {
                // If the API call fails, revert the change
                this.trackedIpos = originalIpos;
                console.error(err);
                return { success: false, message: err.message };
            }
        },
    },
});