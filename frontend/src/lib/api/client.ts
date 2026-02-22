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
    unwrapResponse?: boolean; // Flag to control whether to unwrap the response data (default: true)
    skipDeduplication?: boolean; // Flag to skip request deduplication (used for retries after token refresh)
    forceToken?: string; // Force specific token to be used (bypasses getToken())
    retries?: number; // Number of retry attempts for timeout errors
    retryDelay?: number; // Base delay between retries in milliseconds
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
// Track of latest session token from NextAuth for race condition fix
let cachedSessionToken: string | null = null;

// Persistent guest session ID to maintain consistency across page reloads
let persistentGuestSessionId: string | null = null;

// Function to update cached token from NextAuth session (called by AuthContext)
export const updateCachedSessionToken = (token: string | null): void => {
    if (typeof window !== 'undefined') {
        if (token) {
            console.log('[API Client] Cached session token updated from NextAuth');
            cachedSessionToken = token;
        } else {
            console.log('[API Client] Cached session token cleared');
            cachedSessionToken = null;
        }
    }
};

// Fix 6: Add Token Validation
const validateToken = (token: string | null): { valid: boolean; reason?: string } => {
    if (!token) {
        return { valid: false, reason: 'Token is null or undefined' };
    }
    
    // Check token length (JWT tokens are typically > 100 chars)
    if (token.length < 50) {
        return { valid: false, reason: `Token too short: ${token.length} chars` };
    }
    
    // Basic JWT structure check (should have 3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
        return { valid: false, reason: `Invalid JWT structure: ${parts.length} parts instead of 3` };
    }
    
    // Try to decode and check expiration
    try {
        const payload = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        
        if (payload.exp && payload.exp < now) {
            return { valid: false, reason: `Token expired at ${new Date(payload.exp * 1000).toISOString()}` };
        }
        
        console.log('[API Client] Token validation passed:', {
            expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A',
            expiresIn: payload.exp ? `${payload.exp - now}s` : 'N/A',
            userId: payload.sub || payload.userId || 'N/A'
        });
        
        return { valid: true };
    } catch (e) {
        console.warn('[API Client] Could not decode token payload for validation:', e);
        // If we can't decode, still accept it (might be a different token format)
        return { valid: true };
    }
};

const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
        console.log('[API Client] getToken() called - DIAGNOSTIC');
        console.log('[API Client] - cachedSessionToken exists:', !!cachedSessionToken);
        console.log('[API Client] - localStorage auth_token exists:', !!localStorage.getItem('auth_token'));
        console.log('[API Client] - sessionStorage next-auth.session exists:', !!sessionStorage.getItem('next-auth.session'));
        
        // First check cached session token (most up-to-date from NextAuth)
        if (cachedSessionToken) {
            const validation = validateToken(cachedSessionToken);
            console.log('[API Client] Using cached session token:', validation);
            if (validation.valid) {
                return cachedSessionToken;
            } else {
                console.warn('[API Client] Cached token invalid, clearing:', validation.reason);
                cachedSessionToken = null;
            }
        }
        
        // Check localStorage 'auth_token'
        const token = localStorage.getItem('auth_token');
        // DIAGNOSTIC LOGGING - Token retrieval from localStorage
        console.log('[API Client] Token retrieved from localStorage - length:', token?.length);
        console.log('[API Client] Token preview:', token?.substring(0, 50) + '...');
        if (token) {
            const validation = validateToken(token);
            console.log('[API Client] Using localStorage token:', validation);
            if (validation.valid) {
                return token;
            } else {
                console.warn('[API Client] localStorage token invalid, clearing:', validation.reason);
                localStorage.removeItem('auth_token');
            }
        }
        
        // Try to get token from NextAuth session storage
        // NextAuth stores session in sessionStorage as 'next-auth.session'
        try {
            const sessionData = sessionStorage.getItem('next-auth.session');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                console.log('[API Client] NextAuth session data found:', {
                    hasBackendToken: !!session?.backendToken,
                    hasUser: !!session?.user,
                    keys: Object.keys(session || {})
                });
                if (session?.backendToken) {
                    const validation = validateToken(session.backendToken);
                    console.log('[API Client] Found token in NextAuth session storage:', validation);
                    if (validation.valid) {
                        cachedSessionToken = session.backendToken;
                        return session.backendToken;
                    } else {
                        console.warn('[API Client] NextAuth session token invalid:', validation.reason);
                    }
                }
            }
        } catch (e) {
            console.warn('[API Client] Error parsing NextAuth session:', e);
        }
        
        console.log('[API Client] No valid token found in any storage');
        return null;
    }
    return null;
};

// Fix 2: Token update lock for atomicity
let tokenUpdateLock: Promise<void> | null = null;

// Fix 2: Make Token Updates Truly Atomic
const setToken = async (token: string): Promise<void> => {
    if (typeof window !== 'undefined') {
        // Wait for any ongoing token update to complete
        while (tokenUpdateLock) {
            console.log('[API Client] Waiting for token update lock to release...');
            await tokenUpdateLock;
        }
        
        // Acquire lock
        tokenUpdateLock = (async () => {
            console.log('[API Client] Acquiring token update lock...');
            console.log('[API Client] ATOMIC TOKEN UPDATE START:', {
                tokenLength: token.length,
                tokenPreview: token.substring(0, 20) + '...',
                currentCachedToken: cachedSessionToken ? cachedSessionToken.substring(0, 20) + '...' : 'null',
                currentLocalStorageToken: localStorage.getItem('auth_token')?.substring(0, 20) + '...' || 'null'
            });
             
            // DIAGNOSTIC LOGGING - Token to be stored
            console.log('[API Client] Token to be stored - length:', token?.length);
            console.log('[API Client] Token preview:', token?.substring(0, 50) + '...');
             
            // Add diagnostic logging:
            console.log('[API Client] Token generation details:', {
                tokenLength: token.length,
                tokenPreview: token.substring(0, 50) + '...',
                timestamp: new Date().toISOString(),
                payload: JSON.parse(atob(token.split('.')[1]))
            });
             
            // Update both localStorage and cache in a single logical operation
            localStorage.setItem('auth_token', token);
            cachedSessionToken = token;
             
            // DIAGNOSTIC LOGGING - After storage
            console.log('[API Client] Token stored to localStorage - length:', localStorage.getItem('auth_token')?.length);
            console.log('[API Client] Token preview after storage:', localStorage.getItem('auth_token')?.substring(0, 50) + '...');
             
            console.log('[API Client] ATOMIC TOKEN UPDATE COMPLETE:', {
                storedInLocalStorage: !!localStorage.getItem('auth_token'),
                cached: !!cachedSessionToken,
                tokenLength: token?.length,
                tokenPreview: token.substring(0, 20) + '...'
            });
        })();
        
        // Wait for the update to complete
        await tokenUpdateLock;
        
        // Release the lock
        tokenUpdateLock = null;
        console.log('[API Client] Token update lock released');
    }
};

const removeToken = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        cachedSessionToken = null;
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

// Fix 1: Atomic Token Refresh with Mutex
// Fix 1: Atomic Token Refresh with Mutex
// Replace isRefreshing flag with Promise-based mutex
let refreshPromise: Promise<string> | null = null;
let refreshSubscribers: Array<(token: string) => void> = [];

// Subscribe to token refresh
const subscribeTokenRefresh = (callback: (token: string) => void) => {
    refreshSubscribers.push(callback);
    console.log('[API Client] New subscriber added, total subscribers:', refreshSubscribers.length);
};

// Unsubscribe from token refresh
const unsubscribeTokenRefresh = (callback: (token: string) => void) => {
    refreshSubscribers = refreshSubscribers.filter(cb => cb !== callback);
    console.log('[API Client] Subscriber removed, remaining subscribers:', refreshSubscribers.length);
};

// Fix 4: Notify all subscribers that token has been refreshed (only after storage is complete)
const onTokenRefreshed = (token: string) => {
    console.log('[API Client] Notifying', refreshSubscribers.length, 'subscribers with refreshed token');
    refreshSubscribers.forEach(callback => {
        try {
            callback(token);
        } catch (e) {
            console.error('[API Client] Error notifying subscriber:', e);
        }
    });
    refreshSubscribers = [];
    console.log('[API Client] All subscribers notified and cleared');
};

// Refresh access token
const refreshAccessToken = async (): Promise<string | null> => {
    console.log('[API Client] refreshAccessToken called');
    
    try {
        const token = getToken();
        const rememberToken = getRememberToken();
        
        console.log('[API Client] Token refresh attempt:', {
            hasToken: !!token,
            hasRememberToken: !!rememberToken,
            tokenLength: token?.length,
            rememberTokenLength: rememberToken?.length
        });
        
        if (!token && !rememberToken) {
            console.log('[API Client] No tokens available for refresh');
            return null;
        }
        
        // Add token integrity check
        if (token) {
            try {
                const parts = token.split('.');
                if (parts.length !== 3) {
                    console.error('[API Client] Invalid token structure, clearing token');
                    removeToken();
                    return null;
                }
                const payload = JSON.parse(atob(parts[1]));
                if (!payload.userId) {
                    console.error('[API Client] Token missing userId, clearing token');
                    removeToken();
                    return null;
                }
                console.log('[API Client] Token integrity check passed:', {
                    length: token.length,
                    hasUserId: !!payload.userId,
                    hasEmail: !!payload.email,
                    hasRole: !!payload.role
                });
            } catch (e) {
                console.error('[API Client] Token decode failed, clearing token:', e);
                removeToken();
                return null;
            }
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
        
        console.log('[API Client] Making refresh request to:', url);
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        
        console.log('[API Client] Refresh response status:', response.status);
        
        if (!response.ok) {
            console.error('[API Client] Token refresh failed:', {
                status: response.status,
                statusText: response.statusText,
                tokenProvided: !!token,
                tokenLength: token?.length,
                timestamp: new Date().toISOString()
            });
             
            // If refresh fails, clear tokens
            removeToken();
            removeRememberToken();
            console.log('[API Client] Token refresh failed:', response.status);
            return null;
        }
        
        const data = await response.json();
        
        let newToken: string;
        
        // Handle different response formats
        if (rememberToken) {
            // Remember me refresh returns data directly
            if (data.token) {
                newToken = data.token;
                console.log('[API Client] Remember me refresh successful, token length:', newToken.length);
            } else {
                console.error('[API Client] Invalid remember me refresh response:', data);
                removeToken();
                removeRememberToken();
                return null;
            }
        } else {
            // Regular refresh returns wrapped in ApiResponse format
            // Handle both response formats:
            // Format 1: { success: true, data: { token: "..." } }
            // Format 2: { success: true, data: { message: "...", user: {...}, token: "..." } }
            newToken = data.data?.token;
            console.log('[API Client] Token refresh response:', {
                success: data.success,
                hasToken: !!newToken,
                tokenLength: newToken?.length,
                tokenPreview: newToken ? newToken.substring(0, 20) + '...' : 'null',
                fullResponse: data
            });
            if (data.success && newToken) {
                console.log('[API Client] Regular refresh successful, token length:', newToken.length);
            } else {
                console.error('[API Client] Invalid refresh response:', data);
                removeToken();
                removeRememberToken();
                return null;
            }
        }
        
        // Fix 4: Store token atomically before notifying subscribers
        console.log('[API Client] Storing refreshed token atomically...');
        await setToken(newToken);
        console.log('[API Client] Token stored successfully, now ready to notify subscribers');
        
        return newToken;
    } catch (error) {
        // Clear tokens on refresh failure
        console.error('[API Client] Token refresh failed, clearing tokens:', error);
        removeToken();
        removeRememberToken();
        return null;
    }
};

// Request interceptor to add auth token
const addAuthHeader = (headers: Record<string, string> = {}, forceToken?: string): Record<string, string> => {
  const authHeaders: Record<string, string> = {
    ...headers,
  };
  
  // Only try to get token on client side
  if (typeof window !== 'undefined') {
    console.log('[API Client] addAuthHeader() called - DIAGNOSTIC');
    console.log('[API Client] - forceToken provided:', !!forceToken);
    console.log('[API Client] - guestSessionId exists:', !!localStorage.getItem('smart_tech_guest_session'));
    
    // Fix 3: Use forced token if provided (for retry with specific token)
    const token = forceToken || getToken();
    
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
      console.log('[API Client] Auth header added:', {
        isForcedToken: !!forceToken,
        tokenLength: token.length,
        tokenPreview: token.substring(0, 20) + '...'
      });
    } else {
      // Add session ID header for guest users
      let guestSessionId = persistentGuestSessionId;
      
      // Initialize guest session if not exists
      if (!guestSessionId) {
        guestSessionId = localStorage.getItem('smart_tech_guest_session');
        if (!guestSessionId) {
          guestSessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
          localStorage.setItem('smart_tech_guest_session', guestSessionId);
          console.log('[API Client] New guest session ID initialized:', guestSessionId);
        }
        persistentGuestSessionId = guestSessionId;
      }
      
      if (guestSessionId) {
        authHeaders['x-session-id'] = guestSessionId;
        console.log('[API Client] Guest session ID header added:', {
          sessionId: guestSessionId,
          sessionIdLength: guestSessionId.length
        });
      }
  }
}

return authHeaders;
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
            // Fix 1: If already refreshing, wait for refresh to complete using mutex
            if (refreshPromise) {
                console.log('[API Client] Refresh already in progress, waiting for existing promise...');
                return new Promise((resolve, reject) => {
                    subscribeTokenRefresh((token: string) => {
                        // Fix 3: Retry original request with specific new token
                        if (originalRequest) {
                            console.log('[API Client] Retrying request with refreshed token from subscriber:', {
                                endpoint: originalRequest.endpoint,
                                method: originalRequest.options?.method,
                                tokenLength: token.length,
                                tokenPreview: token.substring(0, 20) + '...'
                            });
                            apiClient
                                .request(originalRequest.endpoint, {
                                    ...originalRequest.options,
                                    skipDeduplication: true,
                                    forceToken: token // Fix 3: Use specific refreshed token
                                })
                                .then(resolve)
                                .catch(reject);
                        }
                    });
                });
            }
            
            // Fix 1: Start token refresh with mutex - only one refresh at a time
            console.log('[API Client] Starting new token refresh...');
            refreshPromise = refreshAccessToken();
            
            try {
                const newToken = await refreshPromise;
                
                // Handle null token (refresh failed)
                if (newToken === null) {
                    console.log('[API Client] Token refresh returned null - refresh failed');
                    // Token refresh failed - throw original error
                    const message = data?.message || data?.error || response.statusText || 'Session expired. Please log in again.';
                    throw new ApiError(message, response.status, data);
                }
                
                console.log('[API Client] Token refresh completed successfully:', {
                    tokenLength: newToken.length,
                    tokenPreview: newToken.substring(0, 20) + '...'
                });
                
                // Fix 4: Notify all waiting requests after token is stored
                onTokenRefreshed(newToken);
                
                // Fix 5: Clear deduplication cache before retry
                if (originalRequest?.options?.method === 'GET') {
                    const requestKey = `GET:${API_BASE_URL}${originalRequest.endpoint}`;
                    if (pendingRequests.has(requestKey)) {
                        console.log('[API Client] Clearing deduplication cache for retry:', requestKey);
                        pendingRequests.delete(requestKey);
                    }
                }
                
                // Fix 3: Retry original request with specific new token
                if (originalRequest) {
                    console.log('[API Client] Retrying original request with new token:', {
                        endpoint: originalRequest.endpoint,
                        method: originalRequest.options?.method,
                        tokenLength: newToken.length,
                        tokenPreview: newToken.substring(0, 20) + '...'
                    });
                    return apiClient.request(originalRequest.endpoint, {
                        ...originalRequest.options,
                        skipDeduplication: true,
                        forceToken: newToken // Fix 3: Use specific refreshed token
                    });
                }
            } finally {
                // Fix 1: Clear the refresh promise only after completion (success or failure)
                refreshPromise = null;
                console.log('[API Client] Refresh promise cleared');
            }
        } catch (refreshError) {
            // Fix 1: Clear the refresh promise on error
            refreshPromise = null;
            console.log('[API Client] Refresh promise cleared due to error');
            
            // Log detailed refresh error for debugging
            console.error('[API Client] Token refresh failed:', {
                refreshError: refreshError.message,
                responseData: data,
                responseStatus: response.status,
                originalUrl: originalRequest?.endpoint
            });
            // Token refresh failed - throw original error
            const message = data?.message || data?.error || response.statusText || 'Session expired. Please log in again.';
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
    
    // Unwrap data from ApiResponse format { success: true, data: {...} }
    // Check if unwrapResponse is explicitly set to false, otherwise default to true
    const shouldUnwrap = originalRequest?.options?.unwrapResponse !== false;
    
    console.log('[API Client] handleResponse - unwrapping decision:', {
        shouldUnwrap,
        hasData: !!data,
        dataSuccess: data?.success,
        dataSuccessType: typeof data?.success,
        hasDataData: typeof data?.data !== 'undefined',
        endpoint: originalRequest?.endpoint,
        dataType: typeof data,
        dataKeys: data ? Object.keys(data) : 'N/A'
    });
    
    // Check for truthy success value (handles both boolean true and object with success property)
    if (shouldUnwrap && data?.success && typeof data.data !== 'undefined') {
        console.log('[API Client] handleResponse - UNWRAPPING, returning data.data:', data.data);
        return data.data;
    }
    
    console.log('[API Client] handleResponse - NOT unwrapping, returning full data:', data);
    return data;
};

// Request deduplication cache to prevent duplicate simultaneous requests
const pendingRequests = new Map<string, Promise<any>>();

// Request timeout helper with improved error handling
const withTimeout = (promise: Promise<Response>, timeoutMs: number = 10000, url: string = ''): Promise<Response> => {
    let timeoutId: NodeJS.Timeout;
    
    const timeoutPromise = new Promise<Response>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new ApiError(
                url
                    ? `Request timeout after ${timeoutMs}ms for ${url}. This may indicate that backend service is unresponsive or Redis is not running.`
                    : `Request timeout after ${timeoutMs}ms. This may indicate that backend service is unresponsive or Redis is not running.`
            ));
        }, timeoutMs);
    });
    
    return Promise.race([promise, timeoutPromise]).then(
        (response) => {
            // Clear timeout if promise resolves first
            if (timeoutId) clearTimeout(timeoutId);
            return response;
        },
        (error) => {
            // Clear timeout if promise rejects first
            if (timeoutId) clearTimeout(timeoutId);
            throw error;
        }
    );
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
            timeout = 30000,
            forceToken,
            retries = 0,
            retryDelay = 1000,
        } = options;
        
        const url = `${API_BASE_URL}${endpoint}`;
        
        // Increase timeout for admin endpoints to handle slower operations
        const effectiveTimeout = endpoint.startsWith('/admin/') ? Math.max(timeout, 60000) : timeout;
        
        // Create a unique request key for deduplication
        // Only deduplicate GET requests to avoid issues with POST/PUT/DELETE
        const requestKey = method === 'GET' ? `${method}:${url}` : null;
        
        // Check if there's already a pending request for this endpoint (GET only)
        if (requestKey && !options.skipDeduplication && pendingRequests.has(requestKey)) {
            console.log('[API Client] Request already in progress, returning existing promise:', requestKey);
            return pendingRequests.get(requestKey) as Promise<T>;
        }
        
        // Log API request details for debugging
        console.log('[API Client] Making request:', {
            method,
            url,
            isServer,
            API_BASE_URL,
            hasToken: !!getToken(),
            isForcedToken: !!forceToken,
        });
        
        const authHeaders = addAuthHeader(headers, forceToken);
        
        // Check if body is FormData (for file uploads)
        const isFormData = body instanceof FormData;
        
        // Build headers for request
        const requestHeaders: Record<string, string> = {
            // Add cache control headers to prevent caching
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            ...authHeaders,
        };
        
        // Only set Content-Type for non-FormData requests
        // FormData automatically sets the correct Content-Type with boundary
        if (!isFormData) {
            requestHeaders['Content-Type'] = 'application/json';
        }
        
        const config: RequestInit = {
            method,
            headers: requestHeaders,
        };

        if (body && method !== 'GET') {
            if (isFormData) {
                // Pass FormData directly without JSON.stringify
                config.body = body;
            } else {
                // JSON stringify regular objects
                config.body = JSON.stringify(body);
            }
        }
        
        // Create a request function with retry logic
        const requestPromise = async (attempt: number = 1): Promise<T> => {
            try {
                const response = await withTimeout(fetch(url, config), effectiveTimeout, url);
                
                // Log response for debugging
                console.log('[API Client] Response received:', {
                    url,
                    status: response.status,
                    ok: response.ok,
                    statusText: response.statusText,
                });
                
                const result = await handleResponse(response, { endpoint, options });
                return result;
            } catch (error: any) {
                console.error('[API Client] Request failed:', {
                    url,
                    attempt,
                    maxRetries: retries,
                    error,
                    message: error?.message,
                    status: error?.status,
                });
                
                // Retry logic for timeout errors
                if (error instanceof ApiError &&
                    error.message.includes('timeout') &&
                    attempt <= retries) {
                    const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                    console.log(`[API Client] Retrying request (attempt ${attempt + 1}/${retries + 1}) after ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return requestPromise(attempt + 1);
                }
                
                if (error instanceof ApiError) {
                    throw error;
                }
                throw new ApiError('Network error occurred');
            } finally {
                // Remove the pending request from cache when done
                if (requestKey) {
                    pendingRequests.delete(requestKey);
                }
            }
        };
        
        // Store promise in cache for GET requests
        if (requestKey) {
            pendingRequests.set(requestKey, requestPromise());
        }

        return requestPromise();
    },

    // HTTP method shortcuts
    get: <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        apiClient.request<T>(endpoint, { ...options, method: 'GET', retries: 2, retryDelay: 2000 }),

    post: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        apiClient.request<T>(endpoint, { ...options, method: 'POST', body, retries: 1, retryDelay: 1500 }),

    put: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        apiClient.request<T>(endpoint, { ...options, method: 'PUT', body, retries: 1, retryDelay: 1500 }),

    patch: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        apiClient.request<T>(endpoint, { ...options, method: 'PATCH', body, retries: 1, retryDelay: 1500 }),

    delete: <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
        apiClient.request<T>(endpoint, { ...options, method: 'DELETE', retries: 1, retryDelay: 1500 }),
};

// Export token management functions
export { getToken, setToken, removeToken, getRememberToken, setRememberToken, removeRememberToken };

// Export API client and error class
export { apiClient, ApiError };
export default apiClient;
