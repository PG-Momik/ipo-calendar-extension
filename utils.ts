export function getAuthHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
        'Accept': 'application/json',
    };

    console.log('token')
    console.log(token)

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}


export async function handleApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const json = (await response.json()) as ApiResponse<T>;

    if (!response.ok || json.status === 'error') {
        throw new Error(json.message || 'Unexpected server error');
    }

    return json;
}