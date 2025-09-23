// root/tests/ipo.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { useIpoStore } from '../../stores/ipos';
import { server } from '../../vitest.setup';
import { HttpResponse, http } from 'msw';
import { config } from '../../utils';

const mockIpos = [
    { id: 101, name: 'TechCorp IPO', type: 'IPO', ticker: 'TECH', startDate: '2024-01-01', endDate: '2024-01-05', minUnits: 10, pricePerUnit: 100, subscriptionStatus: 'Open' },
    { id: 102, name: 'BioGen FPO', type: 'FPO', ticker: 'BIO', startDate: '2024-02-01', endDate: '2024-02-05', minUnits: 20, pricePerUnit: 50, subscriptionStatus: 'Closed' },
];

describe('IPO Store', () => {
    let store: ReturnType<typeof useIpoStore>;

    beforeEach(() => {
        const pinia = createTestingPinia({ stubActions: false });
        store = useIpoStore(pinia);
    });

    describe('fetchIpos', () => {
        it('should populate ipos on a successful fetch', async () => {
            // Arrange
            server.use(
                http.get(`${config.api.baseUrl}/ipos`, () => {
                    return HttpResponse.json({ status: 'success', data: mockIpos });
                })
            );

            // Act
            await store.fetchIpos('mock-token');

            // Assert
            expect(store.isLoading).toBe(false);
            expect(store.error).toBe(null);
            expect(store.ipos).toEqual(mockIpos);
            expect(store.ipos.length).toBe(2);
        });

        it('should set an error message on a failed fetch', async () => {
            // Arrange
            server.use(
                http.get(`${config.api.baseUrl}/ipos`, () => {
                    return HttpResponse.json({ status: 'error', message: 'Server is down' }, { status: 500 });
                })
            );

            // Act
            await store.fetchIpos('mock-token');

            // Assert
            expect(store.isLoading).toBe(false);
            expect(store.error).toBe('Server is down');
            expect(store.ipos).toEqual([]);
        });
    });

    describe('addToCalendar', () => {
        it('should update status and refetch IPOs on success', async () => {
            const ipoId = 101;
            const token = 'mock-token';

            // Arrange
            // Mock the POST request
            server.use(
                http.post(`${config.api.baseUrl}/user/tracked-ipos/${ipoId}`, () => {
                    return HttpResponse.json({ status: 'success', message: 'Added!' });
                })
            );
            // Mock the subsequent GET request from fetchIpos
            server.use(
                http.get(`${config.api.baseUrl}/ipos`, () => {
                    return HttpResponse.json({ status: 'success', data: mockIpos });
                })
            );
            const fetchIposSpy = vi.spyOn(store, 'fetchIpos');

            // Act
            const result = await store.addToCalendar(ipoId, token, true);

            // Assert
            expect(store.addStatus[ipoId]).toBe('success');
            expect(result).toEqual({ status: 'success', message: 'Added!' });
            expect(fetchIposSpy).toHaveBeenCalledWith(token);
        });

        it('should set status to error on failure', async () => {
            const ipoId = 101;
            const token = 'mock-token';

            // Arrange
            server.use(
                http.post(`${config.api.baseUrl}/user/tracked-ipos/${ipoId}`, () => {
                    return HttpResponse.json({ status: 'error', message: 'Already exists' }, { status: 409 });
                })
            );
            const fetchIposSpy = vi.spyOn(store, 'fetchIpos');

            // Act
            const result = await store.addToCalendar(ipoId, token, true);

            // Assert
            expect(store.addStatus[ipoId]).toBe('error');
            expect(result).toEqual({ status: 'error', message: 'Already exists' });
            expect(fetchIposSpy).not.toHaveBeenCalled(); // Should not refetch on error
        });
    });
});