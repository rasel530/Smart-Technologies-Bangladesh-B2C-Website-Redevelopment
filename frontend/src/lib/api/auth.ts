import { ApiResponse, User, LoginData, RegistrationData, VerificationData } from '@/types/auth';
import { apiClient } from './client';

// Authentication API endpoints
export const authApi = {
  // Login user
  login: async (data: LoginData): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  // Register new user
  register: async (data: RegistrationData): Promise<ApiResponse<{ user: User; requiresVerification?: 'email' | 'phone' | 'both' }>> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  // Logout user
  logout: async (): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Email verification
  verifyEmail: async (data: VerificationData): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/auth/verify-email', data);
    return response.data;
  },

  // Send email verification
  sendEmailVerification: async (email: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/auth/send-email-verification', { email });
    return response.data;
  },

  // Phone verification
  verifyPhone: async (data: VerificationData): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/auth/verify-phone', data);
    return response.data;
  },

  // Send phone verification
  sendPhoneVerification: async (phone: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/auth/send-phone-verification', { phone });
    return response.data;
  },

  // Forgot password
  forgotPassword: async (identifier: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/auth/forgot-password', { identifier });
    return response.data;
  },

  // Reset password
  resetPassword: async (token: string, password: string, confirmPassword: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      password,
      confirmPassword,
    });
    return response.data;
  },

  // Refresh token
  refreshToken: async (): Promise<ApiResponse<{ token: string }>> => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  // Update profile
  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await apiClient.put('/auth/profile', data);
    return response.data;
  },
};

export default authApi;