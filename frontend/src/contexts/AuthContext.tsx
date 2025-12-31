'use client';

import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import { User, AuthContextType, LoginData, RegistrationData } from '@/types/auth';
import { apiClient, getToken, setToken, removeToken, getRememberToken, setRememberToken, removeRememberToken } from '@/lib/api/client';
import SessionTimeoutWarning from '@/components/auth/SessionTimeoutWarning';

// Action types for auth reducer
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
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
  | { type: 'SET_SESSION_TIMEOUT'; payload: number | null };

// State interface for auth reducer
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
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

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const userData = await apiClient.get('/auth/me');
        
        if (userData.success && userData.data) {
          dispatch({ type: 'LOGIN_SUCCESS', payload: userData.data });
        }
      } catch (error) {
        console.error('Failed to check existing session:', error);
        // Don't dispatch error on initial load
      }
    };

    checkExistingSession();
  }, []);

  // Login function
  const login = async (emailOrPhone: string, password: string, rememberMe: boolean = false) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const data = await apiClient.post('/auth/login', {
        identifier: emailOrPhone,
        password,
        rememberMe,
      });
      
      if (data.success) {
        // Store token if provided
        if (data.data?.token) {
          setToken(data.data.token);
        }
        
        // Store remember me token if provided
        if (rememberMe && data.data?.rememberToken) {
          setRememberToken(data.data.rememberToken);
        } else if (!rememberMe) {
          removeRememberToken();
        }
        
        // Set session timeout (24 hours = 86400 seconds, or 7 days = 604800 seconds for remember me)
        const sessionTimeout = rememberMe ? 604800 : 86400;
        dispatch({ type: 'SET_SESSION_TIMEOUT', payload: sessionTimeout });
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: data.data });
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: data.message || 'Login failed' });
      }
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message || 'Login failed' });
    }
  };

  // Register function
  const register = async (data: RegistrationData) => {
    dispatch({ type: 'REGISTER_START' });
    
    try {
      const result = await apiClient.post('/auth/register', data);
      
      if (result.success) {
        // Store token if provided
        if (result.data?.token) {
          setToken(result.data.token);
        }
        dispatch({ type: 'REGISTER_SUCCESS', payload: result.data });
      } else {
        dispatch({ type: 'REGISTER_FAILURE', payload: result.message || 'Registration failed' });
      }
    } catch (error: any) {
      dispatch({ type: 'REGISTER_FAILURE', payload: error.message || 'Registration failed' });
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
      removeToken();
      removeRememberToken();
      dispatch({ type: 'LOGOUT' });
      dispatch({ type: 'SET_SESSION_TIMEOUT', payload: null });
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout locally even if API fails
      removeToken();
      removeRememberToken();
      dispatch({ type: 'LOGOUT' });
      dispatch({ type: 'SET_SESSION_TIMEOUT', payload: null });
    }
  };

  // Extend session function
  const extendSession = async () => {
    try {
      const data = await apiClient.post('/auth/refresh');
      
      if (data.success && data.data?.token) {
        setToken(data.data.token);
        // Reset session timeout
        const rememberToken = getRememberToken();
        const sessionTimeout = rememberToken ? 604800 : 86400;
        dispatch({ type: 'SET_SESSION_TIMEOUT', payload: sessionTimeout });
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
      // If extension fails, logout user
      await logout();
    }
  };

  // Email verification functions
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

  // Phone verification functions
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

  // Forgot password function
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

  // Reset password function
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

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    user: state.user,
    isLoading: state.isLoading,
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