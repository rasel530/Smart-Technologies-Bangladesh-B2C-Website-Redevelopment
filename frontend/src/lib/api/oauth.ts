import { apiClient } from './client';

export interface OAuthProfile {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  image?: string;
}

export interface OAuthCallbackResponse {
  message: string;
  messageBn: string;
  user: {
    id: string;
    email?: string;
    firstName: string;
    lastName: string;
    image?: string;
    role: string;
    status: string;
  };
  token: string;
  sessionId: string;
  expiresAt: string;
  maxAge: number;
  provider: string;
  isNew: boolean;
  linked?: boolean;
}

export interface SocialAccount {
  id: string;
  provider: 'GOOGLE' | 'FACEBOOK';
  providerId: string;
  createdAt: string;
}

export interface OAuthProvidersResponse {
  providers: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
  message: string;
  messageBn: string;
}

/**
 * Get enabled OAuth providers
 */
export async function getOAuthProviders(): Promise<OAuthProvidersResponse> {
  const response = await apiClient.get('/api/v1/oauth/providers');
  return response.data;
}

/**
 * Handle OAuth callback
 */
export async function handleOAuthCallback(
  provider: string,
  profile: OAuthProfile
): Promise<OAuthCallbackResponse> {
  const response = await apiClient.post(`/api/v1/oauth/callback/${provider}`, {
    profile
  });
  return response.data;
}

/**
 * Link social account to authenticated user
 */
export async function linkSocialAccount(
  provider: string,
  profile: OAuthProfile
): Promise<{ message: string; messageBn: string; provider: string }> {
  const response = await apiClient.post(`/api/v1/oauth/link/${provider}`, {
    profile
  });
  return response.data;
}

/**
 * Unlink social account
 */
export async function unlinkSocialAccount(
  provider: string
): Promise<{ message: string; messageBn: string; provider: string }> {
  const response = await apiClient.delete(`/api/v1/oauth/unlink/${provider}`);
  return response.data;
}

/**
 * Get user's linked social accounts
 */
export async function getSocialAccounts(): Promise<{
  socialAccounts: SocialAccount[];
  message: string;
  messageBn: string;
}> {
  const response = await apiClient.get('/api/v1/oauth/accounts');
  return response.data;
}

/**
 * Validate OAuth token
 */
export async function validateOAuthToken(
  provider: string,
  accessToken: string
): Promise<{ valid: boolean; message: string; messageBn: string }> {
  const response = await apiClient.post(`/api/v1/oauth/validate/${provider}`, {
    accessToken
  });
  return response.data;
}
