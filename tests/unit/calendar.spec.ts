// root/tests/calendar.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { useCalendarStore } from '../../stores/calendar';
import { server } from '../../vitest.setup';
import { HttpResponse, http } from 'msw';
import { config } from '../../utils';
import type { Ipo } from '../../stores/ipos';

const mockTrackedIpos: Ipo[] = [
    { id: 301, name: 'Tracked IPO 1', type: 'IPO', ticker: 'TRK1', startDate: '2024-03-01', endDate: '2024-03-05', minUnits: 10, pricePerUnit: 100, subscriptionStatus: 'Open' },
    { id: 302, name: 'Tracked IPO 2', type: 'IPO', ticker: 'TRK2', startDate: '2024-04-01', endDate: '2024-04-05', minUnits: 10, pricePerUnit: 100, subscriptionStatus: 'Upcoming' },
];

describe('Calendar Store', () => {
    let store: ReturnType<typeof useCalendarStore>;

    beforeEach(() => {
        const pinia = createTestingPinia({
            initialState: {
                auth: { isAuthenticated: true, token: 'mock-auth-token' },
            },
            stubActions: false,
        });
        store = useCalendarStore(pinia);
    });

    describe('fetchTrackedIpos', () => {
        it('should populate trackedIpos on a successful fetch', async () => {
            // Arrange
            server.use(
                http.get(`${config.api.baseUrl}/user/tracked-ipos`, () => {
                    return HttpResponse.json({ status: 'success', data: mockTrackedIpos });
                })
            );

            // Act
            await store.fetchTrackedIpos();

            // Assert
            expect(store.isLoading).toBe(false);
            expect(store.trackedIpos).toEqual(mockTrackedIpos);
        });

        it('should set an error on a failed fetch', async () => {
            // Arrange
            server.use(
                http.get(`${config.api.baseUrl}/user/tracked-ipos`, () => {
                    return new HttpResponse(null, { status: 500 });
                })
            );

            // Act
            await store.fetchTrackedIpos();

            // Assert
            expect(store.isLoading).toBe(false);
            expect(store.error).toBe('Failed to fetch tracked IPOs.');
            expect(store.trackedIpos).toEqual([]);
        });
    });

    describe('removeFromCalendar', () => {
        it('should optimistically remove an IPO and return success', async () => {
            // Arrange
            const ipoIdToRemove = 301;
            store.trackedIpos = [...mockTrackedIpos];
            server.use(
                http.delete(`${config.api.baseUrl}/user/tracked-ipos/${ipoIdToRemove}`, () => {
                    return new HttpResponse(null, { status: 204 });
                })
            );

            // Act
            const result = await store.removeFromCalendar(ipoIdToRemove);

            // Assert
            expect(result.success).toBe(true);
            expect(store.trackedIpos.length).toBe(1);
            expect(store.trackedIpos[0].id).toBe(302);
        });
    });
});