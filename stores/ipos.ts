import {defineStore} from 'pinia';
import {getAuthHeaders, handleApiResponse} from "../utils";

const API_URL = 'http://localhost:8000';

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

interface ApiResponse<T = any> {
    status: 'success' | 'error' | 'warning';
    message?: string;
    data?: T;

    [key: string]: any;
}

export const useIpoStore = defineStore('ipos', {
    state: () => (
        {
            ipos: [] as Ipo[],
            isLoading: false,
            error: null as string | null,
            addStatus: {} as Record<number, 'adding' | 'success' | 'error'>,
        }
    ),

    actions: {
        async fetchIpos(token: null | string)
        {
            this.isLoading = true;
            this.error = null;

            try {
                const response = await fetch(`${API_URL}/api/ipos`, {method: 'GET', headers: getAuthHeaders(token)});

                const {data} = await handleApiResponse<Ipo[]>(response);

                this.ipos = data || [];
            } catch (err: any) {
                this.error = err.message || 'Failed to load IPOs';
                this.ipos = [];
            } finally {
                this.isLoading = false;
            }
        },

        async addToCalendar(ipoId: number, token: string): Promise<{ status: 'success' | 'error' | 'warning', message: string }>
        {
            this.addStatus[ipoId] = 'adding';

            try {
                const response = await fetch(`${API_URL}/api/user/tracked-ipos/${ipoId}`, {
                    method: 'POST', headers: getAuthHeaders(token)
                });

                const {status, message} = await handleApiResponse(response);

                this.addStatus[ipoId] = status;

                await this.fetchIpos(token);
                // on successful api call i need to refresh the store since one of the flags uould have changed
                return {status, message};
            } catch (error: any) {
                this.addStatus[ipoId] = 'error';

                if (Object.hasOwn(error, 'status') && Object.hasOwn(error, 'message')) {
                    return {
                        status: error.status, message: error.message
                    };
                }

                return {
                    status: 'error', message: error.message || 'Failed to add to calendar'
                };
            }
        },

        async addToPortfolio(ipoId: number, token: string, units: number): Promise<{ status: 'success' | 'error', message: string }>
        {
            try {
                const response = await fetch(`${API_URL}/api/user/portfolio-ipos/${ipoId}`, {
                    method: 'POST',
                    headers: getAuthHeaders(token)
                });

                const {status, message} = await handleApiResponse(response);

                await this.fetchIpos(token);

                return {status, message};
            } catch (error: any) {

                if (Object.hasOwn(error, 'status') && Object.hasOwn(error, 'message')) {
                    return {
                        status: error.status, message: error.message
                    };
                }

                return {
                    status: 'error', message: error.message || 'Failed to add to portfolio'
                };
            }
        }
    },
});