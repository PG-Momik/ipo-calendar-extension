// root/tests/preferences.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { usePreferenceStore } from '../../stores/preferences';
import type { UserPreferences } from '../../stores/preferences';
import { server } from '../../vitest.setup';
import { HttpResponse, http } from 'msw';
import { config } from '../../utils';

const mockPreferences: UserPreferences = {
    visible_ipo_types: ['IPO', 'FPO'],
    visible_sectors: ['Hydro', 'Com. Bank'],
    visible_share_types: ['ordinary'],
};

describe('Preference Store', () => {
    describe('fetchPreferences', () => {
        it('should fetch and set preferences for a guest user', async () => {
            // Arrange
            const pinia = createTestingPinia({
                initialState: { auth: { isAuthenticated: false, token: null } },
                stubActions: false,
            });
            const store = usePreferenceStore(pinia);
            server.use(
                http.get(`${config.api.baseUrl}/preferences`, () => {
                    return HttpResponse.json(mockPreferences); // Note: API returns preferences directly
                })
            );

            // Act
            await store.fetchPreferences();

            // Assert
            expect(store.isLoading).toBe(false);
            expect(store.current).toEqual(mockPreferences);
        });
    });

    describe('savePreferences', () => {
        it('should not save if the user is not authenticated', async () => {
            // Arrange
            const pinia = createTestingPinia({
                initialState: { auth: { isAuthenticated: false, token: null } },
                stubActions: false,
            });
            const store = usePreferenceStore(pinia);

            // Act
            const result = await store.savePreferences(mockPreferences);

            // Assert
            expect(result).toEqual({
                success: false,
                message: 'You must be logged in to save.',
            });
        });

        it('should save preferences for an authenticated user', async () => {
            // Arrange
            const pinia = createTestingPinia({
                initialState: { auth: { isAuthenticated: true, token: 'mock-auth-token' } },
                stubActions: false,
            });
            const store = usePreferenceStore(pinia);
            server.use(
                http.post(`${config.api.baseUrl}/preferences`, () => {
                    return HttpResponse.json({ success: true, message: 'Saved!', preferences: mockPreferences });
                })
            );

            // Act
            const result = await store.savePreferences(mockPreferences);

            // Assert
            expect(store.isLoading).toBe(false);
            expect(store.current).toEqual(mockPreferences);
            expect(result).toEqual({ success: true, message: 'Saved!' });
        });
    });
});