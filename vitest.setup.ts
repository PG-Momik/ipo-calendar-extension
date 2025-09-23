import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';
import { config } from './utils';

vi.mock('webextension-polyfill', () => {
  const mockStorage = {
    local: {
      get: vi.fn(async (key) => {
        if (key === 'authToken') return { authToken: null };
        return {};
      }),
      set: vi.fn(async () => {}),
      remove: vi.fn(async () => {}),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }
  };

  return {
    default: {
      storage: mockStorage,
      runtime: {
        lastError: undefined,
      }
    },
    storage: mockStorage,
    runtime: {
      lastError: undefined,
    }
  };
});


export const handlers = [
  // Example for a user fetch
  http.get(`${config.api.baseUrl}/user`, () => {
    return HttpResponse.json({ status: 'success', user: { id: 1, name: 'Test User' } });
  }),
  // Example for logout
  http.post(`${config.api.baseUrl}/logout`, () => {
    return new HttpResponse(null, { status: 200 });
  }),
  // Example for IPOs fetch
  http.get(`${config.api.baseUrl}/ipos`, () => {
    return HttpResponse.json({
      status: 'success',
      data: [
        { id: 1, name: 'IPO One', type: 'IPO', ticker: 'ONE', startDate: '2023-01-01', endDate: '2023-01-05', minUnits: 10, pricePerUnit: 100, subscriptionStatus: 'Open' },
        { id: 2, name: 'IPO Two', type: 'FPO', ticker: 'TWO', startDate: '2023-02-01', endDate: '2023-02-05', minUnits: 20, pricePerUnit: 50, subscriptionStatus: 'Closed' },
      ]
    });
  }),
];

export const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  
  global.chrome = {
    identity: {
      launchWebAuthFlow: vi.fn(async ({ url, interactive }) => {
        if (url === config.oauth.redirectUrl && interactive) {
          return `${config.oauth.redirectUrl}?token=mock-auth-token`;
        }
        return '';
      }),
    },
    runtime: {
      lastError: undefined,
    }
  } as any;
});

afterEach(() => {
  server.resetHandlers();
  
  if (global.chrome?.identity?.launchWebAuthFlow) {
    (global.chrome.identity.launchWebAuthFlow as any).mockClear();
  }

  if (global.chrome?.runtime) {
    global.chrome.runtime.lastError = undefined;
  }
});

afterAll(() => {
  server.close();
});