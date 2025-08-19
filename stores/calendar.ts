import { defineStore } from 'pinia';
import { useAuthStore } from './auth';
import type { Ipo } from './ipos'; // We can reuse the Ipo interface

const API_URL = 'http://localhost:8000';

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
                const response = await fetch(`${API_URL}/api/user/tracked-ipos`, {
                    headers: { 'Authorization': `Bearer ${authStore.token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch tracked IPOs.');

                const responseData = await response.json();
                this.trackedIpos = responseData.data;

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
                const response = await fetch(`${API_URL}/api/tracked-ipo/${ipoId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${authStore.token}` },
                });

                if (!response.ok) {
                    throw new Error('Failed to remove from calendar on the server.');
                }

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