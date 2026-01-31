import { ApiResponse } from '@/types/auth';

// API base configuration
// Use BACKEND_API_URL for server-side requests, NEXT_PUBLIC_API_URL for client-side
const isServer = typeof window === 'undefined';
const API_BASE_URL = isServer
  ? process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001/api/v1'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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
        const token = localStorage.getItem('auth_token');
        return token;
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

        let url: string;
        let body: any;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (rememberToken) {
            // Use remember me token refresh endpoint
            url = `${API_BASE_URL}/auth/refresh-from-remember-me`;
            body = { token: rememberToken };
        } else {
            // Use regular token refresh endpoint
            url = `${API_BASE_URL}/auth/refresh`;
            body = { token: token };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            // If refresh fails, clear tokens
            removeToken();
            removeRememberToken();
            throw new ApiError('Token refresh failed', response.status);
        }

        const data = await response.json();
        
        // Handle different response formats
        if (rememberToken) {
            // Remember me refresh returns data directly
            if (data.token) {
                setToken(data.token);
                return data.token;
            } else {
                throw new ApiError('Invalid remember me refresh response');
            }
        } else {
            // Regular refresh returns wrapped in ApiResponse format
            if (data.success && data.data?.token) {
                setToken(data.data.token);
                return data.data.token;
            } else {
                throw new ApiError('Invalid refresh response');
            }
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
    // Only try to get token on client side
    if (typeof window !== 'undefined') {
        const token = getToken();
        
        if (token) {
            const authHeaders = {
                ...headers,
                Authorization: `Bearer ${token}`,
            };
            return authHeaders;
        }
    }
    
    return headers;
};

// Response handler with automatic token refresh
const handleResponse = async (
    response: Response,
    originalRequest?: { endpoint: string; options: RequestOptions }
): Promise<any> => {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data;
    try {
        // Handle 304 Not Modified - return empty object or cached data
        if (response.status === 304) {
            data = {};
        } else if (isJson) {
            data = await response.json();
        } else {
            data = await response.text();
        }
    } catch (error) {
        throw new ApiError('Failed to parse response', response.status);
    }

    // Handle 401 Unauthorized - attempt token refresh
    // Skip token refresh for login endpoints as 401 on login means invalid credentials, not expired token
    const isLoginEndpoint = originalRequest?.endpoint?.startsWith('/auth/login');
    const isRegisterEndpoint = originalRequest?.endpoint?.startsWith('/auth/register');
    const shouldSkipRefresh = originalRequest?.options?.skipAuthRefresh || isLoginEndpoint || isRegisterEndpoint;
    
    if (response.status === 401 && !shouldSkipRefresh) {
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
    ): Promise<T> => {
        const {
            method = 'GET',
            headers = {},
            body,
            timeout = 10000,
        } = options;

        const url = `${API_BASE_URL}${endpoint}`;
        
        // Log API request details for debugging
        console.log('[API Client] Making request:', {
            method,
            url,
            isServer,
            API_BASE_URL,
            hasToken: !!getToken(),
        });
        
        const authHeaders = addAuthHeader(headers);
        
        // Check if body is FormData (for file uploads)
        const isFormData = body instanceof FormData;
        
        const config: RequestInit = {
            method,
            headers: {
                ...authHeaders,
                // Add cache control headers to prevent caching
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
            },
        };

        // Only set Content-Type for non-FormData requests
        // FormData automatically sets the correct Content-Type with boundary
        if (!isFormData) {
            (config.headers as Record<string, string>)['Content-Type'] = 'application/json';
        }

        if (body && method !== 'GET') {
            if (isFormData) {
                // Pass FormData directly without JSON.stringify
                config.body = body;
            } else {
                // JSON stringify regular objects
                config.body = JSON.stringify(body);
            }
        }

        try {
            const response = await withTimeout(fetch(url, config), timeout);
            
            // Log response for debugging
            console.log('[API Client] Response received:', {
                url,
                status: response.status,
                ok: response.ok,
                statusText: response.statusText,
            });
            
            return handleResponse(response, { endpoint, options });
        } catch (error: any) {
            console.error('[API Client] Request failed:', {
                url,
                error,
                message: error?.message,
                status: error?.status,
            });
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