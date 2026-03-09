'use client';

import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { User, AuthContextType, LoginErrorPayload, RegistrationData } from '@/types/auth';
import { apiClient, setToken, removeToken, updateCachedSessionToken } from '@/lib/api/client';
import SessionTimeoutWarning from '@/components/auth/SessionTimeoutWarning';

// Action types for auth reducer
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: LoginErrorPayload }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: User }
  | { type: 'REGISTER_FAILURE'; payload: string }
  | { type: 'VERIFY_EMAIL_START' }
  | { type: 'VERIFY_EMAIL_SUCCESS' }
  | { type: 'VERIFY_EMAIL_FAILURE'; payload: string }
  | { type: 'VERIFY_PHONE_START' }
  | { type: 'VERIFY_PHONE_SUCCESS' }
  | { type: 'VERIFY_PHONE_FAILURE'; payload: string }
  | { type: 'SEND_EMAIL_VERIFICATION_START' }
  | { type: 'SEND_EMAIL_VERIFICATION_SUCCESS' }
  | { type: 'SEND_EMAIL_VERIFICATION_FAILURE'; payload: string }
  | { type: 'SEND_PHONE_VERIFICATION_START' }
  | { type: 'SEND_PHONE_VERIFICATION_SUCCESS' }
  | { type: 'SEND_PHONE_VERIFICATION_FAILURE'; payload: string }
  | { type: 'FORGOT_PASSWORD_START' }
  | { type: 'FORGOT_PASSWORD_SUCCESS' }
  | { type: 'FORGOT_PASSWORD_FAILURE'; payload: string }
  | { type: 'RESET_PASSWORD_START' }
  | { type: 'RESET_PASSWORD_SUCCESS' }
  | { type: 'RESET_PASSWORD_FAILURE'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SESSION_TIMEOUT'; payload: number | null }
  | { type: 'UPDATE_USER'; payload: User };

// State interface for auth reducer
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: LoginErrorPayload | string | null;
  sessionTimeout: number | null; // Session timeout in seconds
}

// Initial state
const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
  sessionTimeout: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        error: null,
      };
    
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isLoading: false,
        error: action.payload,
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isLoading: false,
        error: null,
      };
    
    case 'REGISTER_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        error: null,
      };
    
    case 'REGISTER_FAILURE':
      return {
        ...state,
        user: null,
        isLoading: false,
        error: action.payload,
      };
    
    case 'VERIFY_EMAIL_START':
    case 'VERIFY_PHONE_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case 'VERIFY_EMAIL_SUCCESS':
    case 'VERIFY_PHONE_SUCCESS':
      return {
        ...state,
        isLoading: false,
        error: null,
      };
    
    case 'VERIFY_EMAIL_FAILURE':
    case 'VERIFY_PHONE_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    
    case 'SEND_EMAIL_VERIFICATION_START':
    case 'SEND_PHONE_VERIFICATION_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case 'SEND_EMAIL_VERIFICATION_SUCCESS':
    case 'SEND_PHONE_VERIFICATION_SUCCESS':
      return {
        ...state,
        isLoading: false,
        error: null,
      };
    
    case 'SEND_EMAIL_VERIFICATION_FAILURE':
    case 'SEND_PHONE_VERIFICATION_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    
    case 'FORGOT_PASSWORD_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case 'FORGOT_PASSWORD_SUCCESS':
      return {
        ...state,
        isLoading: false,
        error: null,
      };
    
    case 'FORGOT_PASSWORD_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    
    case 'RESET_PASSWORD_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case 'RESET_PASSWORD_SUCCESS':
      return {
        ...state,
        isLoading: false,
        error: null,
      };
    
    case 'RESET_PASSWORD_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'SET_SESSION_TIMEOUT':
      return {
        ...state,
        sessionTimeout: action.payload,
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        error: null,
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // NextAuth session hook
  const { data: session, status: sessionStatus } = useSession();

  // Track previous session status to prevent premature logout during loading
  const prevSessionStatusRef = React.useRef<string | null>(null);
  
  // Track previous user data to prevent duplicate dispatches
  const prevUserRef = React.useRef<any>(null);
  
  // Track mounted state to prevent hydration issues
  const [isMounted, setIsMounted] = React.useState(false);
  
  // Track redirect status to prevent showing old page content during transitions
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  
  // Set mounted state after first render
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync NextAuth session with local state (only after mount to prevent hydration issues)
  useEffect(() => {
    (async () => {
      if (!isMounted) return;

      console.log('[AuthContext] NextAuth session changed:', {
        status: sessionStatus,
        previousStatus: prevSessionStatusRef.current,
        userEmail: session?.user?.email,
        hasSession: !!session,
        hasToken: !!session?.backendToken,
      });
      
      // Only logout if we were previously authenticated and now we're not
      // This prevents logout during initial page load when session is being restored
      if (sessionStatus === 'unauthenticated' && prevSessionStatusRef.current === 'authenticated') {
        console.log('[AuthContext] NextAuth session unauthenticated - logging out');
        dispatch({ type: 'LOGOUT' });
        dispatch({ type: 'SET_SESSION_TIMEOUT', payload: null });
        prevUserRef.current = null;
      }
      
      // Update previous status ref
      prevSessionStatusRef.current = sessionStatus;
      
      // Always store token when authenticated (regardless of user change)
      if (sessionStatus === 'authenticated' && session?.backendToken) {
        console.log('[AuthContext] Storing token - DIAGNOSTIC');
        console.log('[AuthContext] - sessionStatus:', sessionStatus);
        console.log('[AuthContext] - session.backendToken exists:', !!session?.backendToken);
        console.log('[AuthContext] - session.backendToken length:', session?.backendToken?.length);
        console.log('[AuthContext] - localStorage auth_token before:', !!localStorage.getItem('auth_token'));
        
        // Before storing token - DIAGNOSTIC LOGGING
        console.log('[AuthContext] Token received from NextAuth - length:', session.backendToken?.length);
        console.log('[AuthContext] Token preview:', session.backendToken?.substring(0, 50) + '...');
        
        // Await token storage to ensure it completes before proceeding
        await setToken(session.backendToken);
        // Update cached token immediately for race condition fix
        updateCachedSessionToken(session.backendToken);
        
        // After storing token - DIAGNOSTIC LOGGING
        console.log('[AuthContext] Token stored to localStorage - length:', localStorage.getItem('auth_token')?.length);
        console.log('[AuthContext] Token preview after storage:', localStorage.getItem('auth_token')?.substring(0, 50) + '...');
        
        console.log('[AuthContext] - localStorage auth_token after:', !!localStorage.getItem('auth_token'));
        console.log('[AuthContext] Backend token stored in localStorage and cached');
      }
      
      // Clear cached token when session ends
      if (sessionStatus === 'unauthenticated') {
        updateCachedSessionToken(null);
      }
      
      // Only sync user state if user has actually changed
      if (sessionStatus === 'authenticated' && session?.user) {
        // Convert NextAuth session to User type with type assertions
        const sessionUser = session.user as any;
        
        // PRIORITY 5: Optimize session sync with simpler comparison
        // Use JSON.stringify for efficient deep comparison instead of field-by-field
        const userChanged = !prevUserRef.current ||
          JSON.stringify(prevUserRef.current) !== JSON.stringify(sessionUser);
        
        if (userChanged) {
          console.log('[AuthContext] User changed, syncing to state');
          
          const user: User = {
            id: sessionUser.id,
            email: sessionUser.email,
            phone: sessionUser.phone,
            firstName: sessionUser.firstName,
            lastName: sessionUser.lastName,
            role: sessionUser.role,
            isEmailVerified: !!sessionUser.email,
            isPhoneVerified: !!sessionUser.phone,
            preferredLanguage: sessionUser.preferredLanguage || 'en',
            image: sessionUser.image,
            createdAt: sessionUser.createdAt,
            updatedAt: sessionUser.updatedAt,
          };
          
          console.log('[AuthContext] Syncing NextAuth user to state:', user);
          dispatch({ type: 'LOGIN_SUCCESS', payload: user });
          
          // Set session timeout based on remember me
          const sessionTimeout = session.rememberMe ? 604800 : 86400;
          dispatch({ type: 'SET_SESSION_TIMEOUT', payload: sessionTimeout });
        } else {
          console.log('[AuthContext] User unchanged, skipping sync');
        }
        
        // Update previous user ref
        prevUserRef.current = sessionUser;
      }
    })();
  }, [session, sessionStatus, isMounted]);

  // Login function using NextAuth - returns result with success/error status
  const login = async (emailOrPhone: string, password: string, rememberMe: boolean = false): Promise<{ success: boolean; error: LoginErrorPayload | null }> => {
    console.log('[AuthContext] Login attempt for:', emailOrPhone);
    
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // Use NextAuth signIn with credentials provider
      const result = await nextAuthSignIn('credentials', {
        identifier: emailOrPhone,
        password,
        rememberMe,
        redirect: false,
      });

      console.log('[AuthContext] NextAuth signIn result:', result);

      if (result?.error) {
        console.error('[AuthContext] NextAuth signIn error:', result.error);
        
        // Parse error message
        let errorMessage = 'Login failed';
        let errorMessageBn = 'লগইন ব্যর্থ হয়েছে';
        let requiresVerification = false;
        let verificationType: 'email' | 'phone' | null = null;
        let code = null;

        if (typeof result.error === 'string') {
          if (result.error.includes('CredentialsSignin')) {
            errorMessage = 'Invalid email or password';
            errorMessageBn = 'অবৈধ ইমেল বা পাসওয়ার্ড';
          } else if (result.error.includes('verification')) {
            requiresVerification = true;
            verificationType = emailOrPhone.includes('@') ? 'email' : 'phone';
            errorMessage = verificationType === 'email' 
              ? 'Please verify your email before logging in'
              : 'Please verify your phone number before logging in';
            errorMessageBn = verificationType === 'email'
              ? 'লগিন করার আগে ইমেল যাচাই করুন'
              : 'লগিন করার আগে ফোন নম্বর যাচাই করুন';
          }
        }

        const errorPayload: LoginErrorPayload = {
          message: errorMessage,
          messageBn: errorMessageBn,
          requiresVerification,
          verificationType,
          code,
        };

        dispatch({
          type: 'LOGIN_FAILURE',
          payload: errorPayload
        });
        
        return { success: false, error: errorPayload };
      } else if (result?.ok) {
        console.log('[AuthContext] NextAuth login successful');
        // User state will be updated by the session sync effect
        return { success: true, error: null };
      } else {
        const errorPayload: LoginErrorPayload = {
          message: 'Login failed',
          messageBn: 'লগইন ব্যর্থ হয়েছে',
          requiresVerification: null,
          verificationType: null,
          code: null,
        };
        
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: errorPayload
        });
        
        return { success: false, error: errorPayload };
      }
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error);
      
      const errorPayload: LoginErrorPayload = {
        message: error.message || 'Login failed',
        messageBn: 'লগইন ব্যর্থ হয়েছে',
        requiresVerification: null,
        verificationType: null,
        code: null,
      };
      
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorPayload
      });
      
      return { success: false, error: errorPayload };
    }
  };

  // Register function (still uses backend API directly)
  const register = async (data: RegistrationData) => {
    console.log('[AuthContext] Registration attempt');
    dispatch({ type: 'REGISTER_START' });
    
    try {
      const result = await apiClient.post('/auth/register', data);
      
      if (result.success) {
        // Registration successful but user may need verification
        // Don't auto-login, let user verify first
        dispatch({ type: 'REGISTER_SUCCESS', payload: result.data });
      } else {
        dispatch({ type: 'REGISTER_FAILURE', payload: result.message || 'Registration failed' });
      }
    } catch (error: any) {
      dispatch({ type: 'REGISTER_FAILURE', payload: error.message || 'Registration failed' });
    }
  };

  // Logout function using NextAuth
  const logout = async () => {
    console.log('[AuthContext] Logout');
    
    try {
      // Set isRedirecting to false before logout to prevent showing old content
      setIsRedirecting(false);
      console.log('[AuthContext] Set isRedirecting to false before logout');
      
      // Set just_logged_out flag in sessionStorage before logout
      // This prevents immediate auto-redirect on login page
      sessionStorage.setItem('just_logged_out', 'true');
      console.log('[AuthContext] Set just_logged_out flag in sessionStorage');
      
      // Show loading overlay immediately to prevent flash of old content
      // Add null check to prevent errors if document.body is not available
      if (document.body) {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'logout-loading-overlay';
        loadingOverlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
        `;
        loadingOverlay.innerHTML = `
          <div class="flex flex-col items-center space-y-4">
            <div class="relative">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-blue-600"></div>
              <div class="animate-spin rounded-full h-12 w-12 border-r-2 border-blue-400 absolute top-0 left-0" style="animation-delay: 0.15s"></div>
            </div>
            <p class="text-gray-600 text-sm font-medium">Logging out...</p>
          </div>
        `;
        document.body.appendChild(loadingOverlay);
        console.log('[AuthContext] Loading overlay added');
      } else {
        console.warn('[AuthContext] document.body is not available, skipping loading overlay');
      }
      
      // Use NextAuth signOut
      await nextAuthSignOut({ redirect: false });
      console.log('[AuthContext] NextAuth signOut completed');
      
      // Clear token from localStorage (now also clears NextAuth session from sessionStorage)
      removeToken();
      console.log('[AuthContext] Tokens cleared');
      
      // Clear local state
      dispatch({ type: 'LOGOUT' });
      dispatch({ type: 'SET_SESSION_TIMEOUT', payload: null });
      console.log('[AuthContext] Local state cleared');
      
      // Clear page content to prevent flash during redirect
      // Add null checks to prevent errors if document.body or document.head are not available
      if (document.body) {
        document.body.innerHTML = '';
      }
      if (document.head) {
        document.head.innerHTML = '';
      }
      
      // Set isRedirecting to true after redirect completes to indicate transition is done
      setIsRedirecting(true);
      console.log('[AuthContext] Set isRedirecting to true after redirect preparation');
      
      // Use window.location.replace() instead of href to prevent back button issues
      // This ensures a clean page load without showing cached content
      window.location.replace('/login');
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      // Set isRedirecting to true even on error to prevent showing old content
      setIsRedirecting(true);
      
      // Still logout locally even if NextAuth fails
      removeToken();
      dispatch({ type: 'LOGOUT' });
      dispatch({ type: 'SET_SESSION_TIMEOUT', payload: null });
      
      // Clear page content even on error
      // Add null checks to prevent errors if document.body or document.head are not available
      if (document.body) {
        document.body.innerHTML = '';
      }
      if (document.head) {
        document.head.innerHTML = '';
      }
      
      // Still use replace even on error
      window.location.replace('/login');
    }
  };

  // Extend session function (refresh session)
  const extendSession = async () => {
    console.log('[AuthContext] Extending session');
    
    try {
      // NextAuth automatically refreshes sessions
      // We can trigger a session update if needed
      // For now, this is a placeholder
      console.log('[AuthContext] Session extension not implemented for NextAuth');
    } catch (error) {
      console.error('[AuthContext] Failed to extend session:', error);
      // If extension fails, logout user
      await logout();
    }
  };

  // Email verification functions (still use backend API)
  const verifyEmail = async (email: string, code: string) => {
    dispatch({ type: 'VERIFY_EMAIL_START' });
    
    try {
      const data = await apiClient.post('/auth/verify-email', {
        method: 'email',
        identifier: email,
        code,
      });
      
      if (data.success) {
        dispatch({ type: 'VERIFY_EMAIL_SUCCESS' });
      } else {
        dispatch({ type: 'VERIFY_EMAIL_FAILURE', payload: data.message || 'Email verification failed' });
      }
    } catch (error: any) {
      dispatch({ type: 'VERIFY_EMAIL_FAILURE', payload: error.message || 'Email verification failed' });
    }
  };

  const sendEmailVerification = async (email: string) => {
    dispatch({ type: 'SEND_EMAIL_VERIFICATION_START' });
    
    try {
      const data = await apiClient.post('/auth/send-email-verification', { email });
      
      if (data.success) {
        dispatch({ type: 'SEND_EMAIL_VERIFICATION_SUCCESS' });
      } else {
        dispatch({ type: 'SEND_EMAIL_VERIFICATION_FAILURE', payload: data.message || 'Failed to send email verification' });
      }
    } catch (error: any) {
      dispatch({ type: 'SEND_EMAIL_VERIFICATION_FAILURE', payload: error.message || 'Failed to send email verification' });
    }
  };

  // Phone verification functions (still use backend API)
  const verifyPhone = async (phone: string, code: string) => {
    dispatch({ type: 'VERIFY_PHONE_START' });
    
    try {
      const data = await apiClient.post('/auth/verify-phone', {
        method: 'phone',
        identifier: phone,
        code,
      });
      
      if (data.success) {
        dispatch({ type: 'VERIFY_PHONE_SUCCESS' });
      } else {
        dispatch({ type: 'VERIFY_PHONE_FAILURE', payload: data.message || 'Phone verification failed' });
      }
    } catch (error: any) {
      dispatch({ type: 'VERIFY_PHONE_FAILURE', payload: error.message || 'Phone verification failed' });
    }
  };

  const sendPhoneVerification = async (phone: string) => {
    dispatch({ type: 'SEND_PHONE_VERIFICATION_START' });
    
    try {
      const data = await apiClient.post('/auth/send-phone-verification', { phone });
      
      if (data.success) {
        dispatch({ type: 'SEND_PHONE_VERIFICATION_SUCCESS' });
      } else {
        dispatch({ type: 'SEND_PHONE_VERIFICATION_FAILURE', payload: data.message || 'Failed to send phone verification' });
      }
    } catch (error: any) {
      dispatch({ type: 'SEND_PHONE_VERIFICATION_FAILURE', payload: error.message || 'Failed to send phone verification' });
    }
  };

  // Forgot password function (still use backend API)
  const forgotPassword = async (identifier: string) => {
    dispatch({ type: 'FORGOT_PASSWORD_START' });
    
    try {
      const data = await apiClient.post('/auth/forgot-password', { identifier });
      
      if (data.success) {
        dispatch({ type: 'FORGOT_PASSWORD_SUCCESS' });
      } else {
        dispatch({ type: 'FORGOT_PASSWORD_FAILURE', payload: data.message || 'Failed to send reset link' });
      }
    } catch (error: any) {
      dispatch({ type: 'FORGOT_PASSWORD_FAILURE', payload: error.message || 'Failed to send reset link' });
    }
  };

  // Reset password function (still use backend API)
  const resetPassword = async (token: string, password: string, confirmPassword: string) => {
    dispatch({ type: 'RESET_PASSWORD_START' });
    
    try {
      const data = await apiClient.post('/auth/reset-password', {
        token,
        password,
        confirmPassword,
      });
      
      if (data.success) {
        dispatch({ type: 'RESET_PASSWORD_SUCCESS' });
      } else {
        dispatch({ type: 'RESET_PASSWORD_FAILURE', payload: data.message || 'Failed to reset password' });
      }
    } catch (error: any) {
      dispatch({ type: 'RESET_PASSWORD_FAILURE', payload: error.message || 'Failed to reset password' });
    }
  };

  // Update user function
  const updateUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    user: state.user,
    isLoading: state.isLoading || sessionStatus === 'loading',
    error: state.error,
    login,
    register,
    logout,
    verifyEmail,
    verifyPhone,
    sendEmailVerification,
    sendPhoneVerification,
    forgotPassword,
    resetPassword,
    clearError,
    extendSession,
    updateUser,
    sessionTimeout: state.sessionTimeout,
    isRedirecting,
  };

  // Get user's preferred language
  const language = state.user?.preferredLanguage || 'en';

  return (
    <AuthContext.Provider value={value}>
      {children}
      {state.user && state.sessionTimeout && (
        <SessionTimeoutWarning
          timeoutSeconds={state.sessionTimeout}
          warningThreshold={120}
          onExtendSession={extendSession}
          onSessionExpire={logout}
          language={language as 'en' | 'bn'}
        />
      )}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
