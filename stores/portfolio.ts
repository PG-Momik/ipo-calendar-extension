import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = 'http://localhost:8000';

// Define types for the data structures
interface PortfolioSummary { /* ... */ }
interface ChartData { /* ... */ }
interface Holding { /* ... */ }

export const usePortfolioStore = defineStore('portfolio', {
    state: () => ({
        summary: null as PortfolioSummary | null,
        chartData: null as ChartData | null,
        holdings: [] as Holding[],
        isLoading: false,
        error: null as string | null,
    }),
    actions: {
        async fetchPortfolio() {
            const authStore = useAuthStore();
            if (!authStore.isAuthenticated || !authStore.token) return;

            this.isLoading = true;
            this.error = null;
            try {
                const response = await fetch(`${API_URL}/api/user/portfolio-ipos`, {
                    headers: { 'Authorization': `Bearer ${authStore.token}` },
                });
                // ---------------------------------------------

                if (!response.ok) throw new Error('Failed to fetch portfolio data.');

                const responseData = await response.json();
                const portfolioData = responseData.data;

                this.summary = portfolioData.summary;
                this.chartData = portfolioData.chartData;
                this.holdings = portfolioData.holdings;

            } catch (err: any) {
                this.error = err.message;
            } finally {
                this.isLoading = false;
            }
        },

        async updateHolding(ipoId: number, data: { units_allotted: number, purchase_price: number }) {
            const authStore = useAuthStore();
            if (!authStore.isAuthenticated) return { success: false, message: 'Not authenticated.'};

            try {
                const response = await fetch(`${API_URL}/api/user/portfolio-ipos/${ipoId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${authStore.token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                if (!response.ok) throw new Error('Failed to update portfolio entry.');

                // After a successful update, refresh the data to get new calculations.
                await this.fetchPortfolio();

                return { success: true, message: 'Portfolio updated successfully.' };
            } catch (err: any) {
                console.error(err);
                return { success: false, message: err.message };
            }
        },
    },
});