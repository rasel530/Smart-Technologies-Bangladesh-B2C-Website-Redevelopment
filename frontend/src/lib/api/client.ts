import { ApiResponse } from '@/types/auth';

// API base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Request options interface
interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
    skipAuthRefresh?: boolean; // Flag to skip token refresh for specific requests
}

// API error class
class ApiError extends Error {
    constructor(
        message: string,
        public status?: number,
        public data?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// Token management
const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('auth_token');
    }
    return null;
};

const setToken = (token: string): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token);
    }
};

const removeToken = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
    }
};

// Remember me token management
const getRememberToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('remember_token');
    }
    return null;
};

const setRememberToken = (token: string): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('remember_token', token);
    }
};

const removeRememberToken = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('remember_token');
    }
};

// Token refresh state
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Subscribe to token refresh
const subscribeTokenRefresh = (callback: (token: string) => void) => {
    refreshSubscribers.push(callback);
};

// Unsubscribe from token refresh
const unsubscribeTokenRefresh = (callback: (token: string) => void) => {
    refreshSubscribers = refreshSubscribers.filter(cb => cb !== callback);
};

// Notify all subscribers that token has been refreshed
const onTokenRefreshed = (token: string) => {
    refreshSubscribers.forEach(callback => callback(token));
    refreshSubscribers = [];
};

// Refresh access token
const refreshAccessToken = async (): Promise<string> => {
    try {
        const token = getToken();
        const rememberToken = getRememberToken();
        
        if (!token && !rememberToken) {
            throw new Error('No tokens available for refresh');
        }

        const url = `${API_BASE_URL}/auth/refresh`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (rememberToken) {
            headers['X-Remember-Token'] = rememberToken;
        } else if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
        });

        if (!response.ok) {
            // If refresh fails, clear tokens
            removeToken();
            removeRememberToken();
            throw new ApiError('Token refresh failed', response.status);
        }

        const data = await response.json();
        
        if (data.success && data.data?.token) {
            setToken(data.data.token);
            return data.data.token;
        } else {
            throw new ApiError('Invalid refresh response');
        }
    } catch (error) {
        // Clear tokens on refresh failure
        removeToken();
        removeRememberToken();
        throw error;
    }
};

// Request interceptor to add auth token
const addAuthHeader = (headers: Record<string, string> = {}): Record<string, string> => {
    const token = getToken();
    if (token) {
        return {
            ...headers,
            Authorization: `Bearer ${token}`,
        };
    }
    return headers;
};

// Response handler with automatic token refresh
const handleResponse = async (
    response: Response,
    originalRequest?: { endpoint: string; options: RequestOptions }
): Promise<ApiResponse> => {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data;
    try {
        data = isJson ? await response.json() : await response.text();
    } catch (error) {
        throw new ApiError('Failed to parse response', response.status);
    }

    // Handle 401 Unauthorized - attempt token refresh
    if (response.status === 401 && !originalRequest?.options?.skipAuthRefresh) {
        try {
            // If already refreshing, wait for the refresh to complete
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    subscribeTokenRefresh((token: string) => {
                        // Retry original request with new token
                        if (originalRequest) {
                            apiClient
                                .request(originalRequest.endpoint, originalRequest.options)
                                .then(resolve)
                                .catch(reject);
                        }
                    });
                });
            }

            // Start token refresh
            isRefreshing = true;
            const newToken = await refreshAccessToken();
            isRefreshing = false;

            // Notify all waiting requests
            onTokenRefreshed(newToken);

            // Retry original request with new token
            if (originalRequest) {
                return apiClient.request(originalRequest.endpoint, originalRequest.options);
            }
        } catch (refreshError) {
            isRefreshing = false;
            // Token refresh failed - throw original error
            const message = data?.message || data?.error || response.statusText || 'Request failed';
            throw new ApiError(message, response.status, data);
        }
    }

    if (!response.ok) {
        const message = data?.message || data?.error || response.statusText || 'Request failed';
        throw new ApiError(message, response.status, data);
    }

    // Handle token refresh from response headers
    const newToken = response.headers.get('x-new-token');
    if (newToken) {
        setToken(newToken);
    }

    return data;
};

// Request timeout helper
const withTimeout = (promise: Promise<Response>, timeoutMs: number = 10000): Promise<Response> => {
    return Promise.race([
        promise,
        new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new ApiError('Request timeout')), timeoutMs)
        )
    ]);
};

// Base API client
const apiClient = {
    // Generic request method
    request: async <T = any>(
        endpoint: string,
        options: RequestOptions = {}
    ): Promise<ApiResponse<T>> => {
        const {
            method = 'GET',
            headers = {},
            body,
            timeout = 10000,
        } = options;

        const url = `${API_BASE_URL}${endpoint}`;
        const config: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...addAuthHeader(headers),
            },
        };

        if (body && method !== 'GET') {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await withTimeout(fetch(url, config), timeout);
            return handleResponse(response, { endpoint, options });
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Network error occurred');
        }
    },

    // HTTP method shortcuts
    get: <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        apiClient.request<T>(endpoint, { ...options, method: 'GET' }),

    post: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        apiClient.request<T>(endpoint, { ...options, method: 'POST', body }),

    put: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        apiClient.request<T>(endpoint, { ...options, method: 'PUT', body }),

    patch: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        apiClient.request<T>(endpoint, { ...options, method: 'PATCH', body }),

    delete: <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        apiClient.request<T>(endpoint, { ...options, method: 'DELETE' }),
};

// Export token management functions
export { getToken, setToken, removeToken, getRememberToken, setRememberToken, removeRememberToken };

// Export API client and error class
export { apiClient, ApiError };
export default apiClient;