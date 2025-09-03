import {defineStore} from 'pinia';
import {useAuthStore} from './auth';
import {getAuthHeaders, config} from "../utils";

export interface UserPreferences {
    visible_ipo_types: string[];
    visible_sectors: string[];
    visible_share_types: string[];
}

export const usePreferenceStore = defineStore('preferences', {
    state: () => ({
        current: null as UserPreferences | null, options: {
            ipoTypes: ['IPO', 'FPO', 'Mutual Fund', 'Right Share', 'Auction', 'Bond'],
            sectors: ['Hydro', 'Com. Bank', 'Microfinance', 'Insurance', 'Manu & Prod', 'Investment', 'Finance', 'Tourism', 'Others'],
            shareTypes: ['ordinary', 'local', 'promoter', 'Migrant Workers'],
        }, isLoading: false, error: null as string | null,
    }), actions: {
        /**
         * Fetches preferences. Works for both guests and authenticated users.
         */
        async fetchPreferences() {
            const authStore = useAuthStore();
            this.isLoading = true;
            this.error = null;
            try {
                const response = await fetch(`${config.api.baseUrl}/api/preferences`, {
                    headers: getAuthHeaders(authStore.token)
                });

                if (!response.ok) throw new Error('Could not load preferences.');

                this.current = await response.json();

            } catch (err: any) {
                this.error = err.message;
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Saves the user's preferences to the backend. Requires authentication.
         */
        async savePreferences(newPreferences: UserPreferences) {
            const authStore = useAuthStore();
            if (!authStore.isAuthenticated || !authStore.token) {
                return {success: false, message: 'You must be logged in to save.'};
            }

            this.isLoading = true;
            this.error = null;
            try {
                const response = await fetch(`${config.api.baseUrl}/api/preferences`, {
                    method: 'POST',
                    headers: getAuthHeaders(authStore.token),
                    body: JSON.stringify(newPreferences),
                });

                if (!response.ok) throw new Error('Failed to save preferences.');

                const result = await response.json();
                this.current = result.preferences;
                return {success: true, message: result.message};

            } catch (err: any) {
                this.error = err.message;
                return {success: false, message: err.message};
            } finally {
                this.isLoading = false;
            }
        },
    },
});