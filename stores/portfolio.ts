import { defineStore } from 'pinia';
import { useAuthStore } from './auth';
import {getAuthHeaders, config} from "../utils";

/**
 * Defines the structure for the summary KPIs at the top of the portfolio view.
 * All values are numbers, ready for formatting in the component.
 */
export interface PortfolioSummary {
    totalInvestment: number;
    totalCurrentValue: number;
    totalGainLoss: number;
    totalGainLossPercentage: number;
}

/**
 * Defines the structure for the data needed by the ApexCharts components.
 */
export interface ChartData {
    labels: string[]; // e.g., ['Hydro', 'Com. Bank', 'Investment']
    values: number[]; // e.g., [15000, 25000, 8000]
}

/**
 * Defines the structure for a single IPO holding within the user's portfolio.
 * This is used for the detailed list at the bottom of the view.
 */
export interface Holding {
    id: number;
    name: string;
    ticker: string;
    sector: string;
    unitsAllotted: number;
    purchasePrice: number;
    purchaseDate: string;
    createdAt: string;
    investmentValue: number;
    currentValue: number;
}

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
                const response = await fetch(`${config.api.baseUrl}/user/portfolio-ipos`, {
                    headers: getAuthHeaders(authStore.token),
                });

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
                const response = await fetch(`${config.api.baseUrl}/user/portfolio-ipos/${ipoId}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(authStore.token),
                    body: JSON.stringify(data)
                });

                if (!response.ok) throw new Error('Failed to update portfolio entry.');

                await this.fetchPortfolio();

                return { success: true, message: 'Portfolio updated successfully.' };
            } catch (err: any) {
                console.error(err);

                return { success: false, message: err.message };
            }
        },

        async removeFromPortfolio(ipoId: number) {
            const authStore = useAuthStore();
            if (!authStore.isAuthenticated || !authStore.token) return;

            try {
                const response = await fetch(`${config.api.baseUrl}/user/portfolio-ipos/${ipoId}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders(authStore.token),
                });

                if (!response.ok) {
                    throw new Error('Failed to remove from calendar on the server.');
                }

                this.holdings = this.holdings.filter(ipo => ipo.id !== ipoId);

                return { success: true, message: 'Successfully removed.' };
            } catch (err: any) {
                console.error(err);
                return { success: false, message: err.message };
            }
        },
    },
});