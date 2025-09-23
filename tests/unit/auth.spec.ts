import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import {useAuthStore} from '../../stores/auth.ts';
import { HttpResponse, http } from 'msw';
import { server } from '../../vitest.setup';
import { config } from '../../utils';
import { storage } from 'webextension-polyfill';

const mockStorageLocalGet = storage.local.get as vi.Mock;
const mockStorageLocalSet = storage.local.set as vi.Mock;
const mockStorageLocalRemove = storage.local.remove as vi.Mock;


describe('Auth Store', () => {
  beforeEach(() => {
    // Reset all mocks before each test to ensure isolation
    mockStorageLocalGet.mockClear();
    mockStorageLocalSet.mockClear();
    mockStorageLocalRemove.mockClear();
    vi.clearAllMocks();

    (global.chrome.identity.launchWebAuthFlow as any).mockClear();
    global.chrome.runtime.lastError = undefined;

    // Reset MSW handlers to their default state from the setup file
    server.resetHandlers();
  });

  describe('handleLogin', () => {
    it('should successfully log in a user and set state', async () => {
      // Arrange
      const pinia = createTestingPinia({ stubActions: false });
      const authStore = useAuthStore(pinia);

      (global.chrome.identity.launchWebAuthFlow as any).mockResolvedValueOnce(
        `${config.oauth.redirectUrl}?token=mock-new-auth-token`
      );
      mockStorageLocalSet.mockResolvedValueOnce(undefined);

      server.use(
        http.get(`${config.api.baseUrl}/user`, () => {
          return HttpResponse.json({ status: 'success', user: { id: 1, name: 'LoggedIn User' } }, { status: 200 });
        })
      );

      // Act
      await authStore.handleLogin();

      // Assert
      expect(authStore.isLoading).toBe(false);
      expect(global.chrome.identity.launchWebAuthFlow).toHaveBeenCalledWith({
        url: config.oauth.redirectUrl,
        interactive: true,
      });
      expect(mockStorageLocalSet).toHaveBeenCalledWith({ authToken: 'mock-new-auth-token' });
      expect(authStore.token).toBe('mock-new-auth-token');
      expect(authStore.user).toEqual({ id: 1, name: 'LoggedIn User' });
      expect(authStore.isAuthenticated).toBe(true);
    });

    it('should handle authentication flow failure (e.g., user closes window)', async () => {
      // Arrange
      const pinia = createTestingPinia({ stubActions: false });
      const authStore = useAuthStore(pinia);

      (global.chrome.identity.launchWebAuthFlow as any).mockResolvedValueOnce(undefined);
      global.chrome.runtime.lastError = { message: 'User cancelled authentication.' };

      // Act
      await authStore.handleLogin();

      // Assert
      expect(authStore.isLoading).toBe(false);
      expect(global.chrome.identity.launchWebAuthFlow).toHaveBeenCalled();
      expect(mockStorageLocalSet).not.toHaveBeenCalled();
      expect(authStore.token).toBe(null);
      expect(authStore.user).toBe(null);
      expect(authStore.isAuthenticated).toBe(false);
    });

    it('should handle missing token in redirect URL', async () => {
      // Arrange
      const pinia = createTestingPinia({ stubActions: false });
      const authStore = useAuthStore(pinia);

      (global.chrome.identity.launchWebAuthFlow as any).mockResolvedValueOnce(
        `${config.oauth.redirectUrl}?someotherparam=value`
      );

      // Act
      await authStore.handleLogin();

      // Assert
      expect(authStore.isLoading).toBe(false);
      expect(global.chrome.identity.launchWebAuthFlow).toHaveBeenCalled();
      expect(mockStorageLocalSet).not.toHaveBeenCalled();
      expect(authStore.token).toBe(null);
      expect(authStore.isAuthenticated).toBe(false);
    });

    it('should revert state if fetchUser fails after successful token acquisition', async () => {
      // Arrange
      const pinia = createTestingPinia({ stubActions: false });
      const authStore = useAuthStore(pinia);

      (global.chrome.identity.launchWebAuthFlow as any).mockResolvedValueOnce(
        `${config.oauth.redirectUrl}?token=mock-bad-token`
      );
      mockStorageLocalSet.mockResolvedValueOnce(undefined);
      mockStorageLocalRemove.mockResolvedValueOnce(undefined); // Mock for the error path

      server.use(
        http.get(`${config.api.baseUrl}/user`, () => {
          return HttpResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
        })
      );
      // Act
      await authStore.handleLogin();

      // Assert
      expect(authStore.isLoading).toBe(false);
      expect(mockStorageLocalSet).toHaveBeenCalledWith({ authToken: 'mock-bad-token' });
      expect(mockStorageLocalRemove).toHaveBeenCalledWith('authToken');
      expect(authStore.token).toBe(null);
      expect(authStore.user).toBe(null);
      expect(authStore.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('should call backend logout and clear storage when a token exists', async () => {
      // Arrange
      const pinia = createTestingPinia({
        initialState: {
          auth: { token: 'existing-token' },
        },
        stubActions: false,
      });
      const authStore = useAuthStore(pinia);
      mockStorageLocalRemove.mockResolvedValueOnce(undefined);

      // The default MSW handler in vitest.setup.ts will catch the /logout POST request.

      // Act
      await authStore.logout();

      // Assert
      expect(authStore.isLoading).toBe(false);
      // The logout action's only responsibility is to remove the token.
      // The state change (token -> null) happens via the `storage.onChanged` listener,
      // which is a separate process we don't need to test here.
      expect(mockStorageLocalRemove).toHaveBeenCalledWith('authToken');
    });

    it('should not attempt backend logout if no token exists, but still clear storage', async () => {
      // Arrange
      const pinia = createTestingPinia({
        initialState: {
          auth: { token: null },
        },
        stubActions: false,
      });
      const authStore = useAuthStore(pinia);
      mockStorageLocalRemove.mockResolvedValueOnce(undefined);

      const fetchSpy = vi.spyOn(global, 'fetch');

      // Act
      await authStore.logout();

      // Assert
      expect(authStore.isLoading).toBe(false);
      // Ensure the API call to logout was NOT made
      expect(fetchSpy).not.toHaveBeenCalledWith(`${config.api.baseUrl}/logout`, expect.anything());
      // But ensure we still attempt to clear the token from storage
      expect(mockStorageLocalRemove).toHaveBeenCalledWith('authToken');

      fetchSpy.mockRestore(); // Clean up spy
    });
  });
});