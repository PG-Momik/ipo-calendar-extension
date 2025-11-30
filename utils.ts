export const config = {
    api: {
        baseUrl: 'https://ipocalendarnepal.com/api/v1',
    },
    oauth: {
        redirectUrl: 'https://ipocalendarnepal.com/auth/google/redirect',
        extensionCallbackUrl: 'https://fgkgpfpjhnmbdkmbebfkcgdfkgbbkmed.chromiumapp.org/',
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