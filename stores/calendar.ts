import { defineStore } from 'pinia';
import { useAuthStore } from './auth';
import type { Ipo } from './ipos';
import {getAuthHeaders, config} from "../utils";
import {useIpoStore} from "./ipos"; 

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
                const response = await fetch(`${config.api.baseUrl}/api/user/tracked-ipos`, {
                  headers: getAuthHeaders(authStore.token)
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

            try {
                const response = await fetch(`${config.api.baseUrl}/api/user/tracked-ipos/${ipoId}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders(authStore.token),
                });

                if (!response.ok) {
                    throw new Error('Failed to remove from calendar on the server.');
                }

                this.trackedIpos = this.trackedIpos.filter(ipo => ipo.id !== ipoId);

                return { success: true, message: 'Successfully removed.' };
            } catch (err: any) {
                console.error(err);
                return { success: false, message: err.message };
            }
        },
    },
});