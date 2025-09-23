
export const config = {
  api: {
    baseUrl: 'http://localhost:8000/api/v1',
  },
  oauth: {
    redirectUrl: 'http://localhost:8000/auth/google/redirect',
  },
} as const;

export function getAuthHeaders(token?: string | null): HeadersInit {
    const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

export async function handleApiResponse<T>(response: Response){
    const json = (await response.json());

    if (!response.ok || json.status === 'error') {
        throw new Error(json.message || 'Unexpected server error');
    }

    return json;
}