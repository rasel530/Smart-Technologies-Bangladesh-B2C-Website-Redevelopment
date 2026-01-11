'use client';

import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { User, AuthContextType, LoginErrorPayload, RegistrationData } from '@/types/auth';
import { apiClient, setToken, removeToken } from '@/lib/api/client';
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

  // Sync NextAuth session with local state
  useEffect(() => {
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
    
    // Only sync if authenticated and user data is available
    if (sessionStatus === 'authenticated' && session?.user) {
      // Convert NextAuth session to User type with type assertions
      const sessionUser = session.user as any;
      
      // Check if user has actually changed to prevent duplicate dispatches
      // Compare entire user object to prevent unnecessary re-renders
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
        
        // Store backend JWT token in localStorage for API client
        if (session.backendToken) {
          setToken(session.backendToken);
          console.log('[AuthContext] Backend token stored in localStorage');
        }
        
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
  }, [session, sessionStatus]);

  // Login function using NextAuth
  const login = async (emailOrPhone: string, password: string, rememberMe: boolean = false) => {
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

        dispatch({
          type: 'LOGIN_FAILURE',
          payload: {
            message: errorMessage,
            messageBn: errorMessageBn,
            requiresVerification,
            verificationType,
            code,
          }
        });
      } else if (result?.ok) {
        console.log('[AuthContext] NextAuth login successful');
        // User state will be updated by the session sync effect
      } else {
        dispatch({
          type: 'LOGIN_FAILURE',
          payload: {
            message: 'Login failed',
            messageBn: 'লগইন ব্যর্থ হয়েছে',
            requiresVerification: null,
            verificationType: null,
            code: null,
          }
        });
      }
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error);
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: {
          message: error.message || 'Login failed',
          messageBn: 'লগইন ব্যর্থ হয়েছে',
          requiresVerification: null,
          verificationType: null,
          code: null,
        }
      });
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
      // Use NextAuth signOut
      await nextAuthSignOut({ redirect: false });
      
      // Clear token from localStorage
      removeToken();
      
      // Clear local state
      dispatch({ type: 'LOGOUT' });
      dispatch({ type: 'SET_SESSION_TIMEOUT', payload: null });
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      // Still logout locally even if NextAuth fails
      dispatch({ type: 'LOGOUT' });
      dispatch({ type: 'SET_SESSION_TIMEOUT', payload: null });
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
