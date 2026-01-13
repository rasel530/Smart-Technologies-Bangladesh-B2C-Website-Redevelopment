import { apiClient } from './client';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  role: string;
  status: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  emailVerified: boolean;
  phoneVerified: boolean;
  addresses: any[];
  _count: {
    orders: number;
    reviews: number;
  };
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

export class ProfileAPI {
  private static readonly BASE_PATH = '/profile';

  /**
   * Get current user profile
   */
  static async getProfile(): Promise<{ user: UserProfile }> {
    const response = await apiClient.get<{ user: UserProfile }>(`${this.BASE_PATH}/me`);
    return response.data;
  }

  /**
   * Update user profile
   */
  static async updateProfile(data: ProfileUpdateData): Promise<{ user: UserProfile }> {
    const response = await apiClient.put<{ user: UserProfile }>(`${this.BASE_PATH}/me`, data);
    return response.data;
  }

  /**
   * Upload profile picture
   */
  static async uploadProfilePicture(file: File): Promise<{ user: UserProfile }> {
    const formData = new FormData();
    formData.append('picture', file);

    const response = await apiClient.post<{ user: UserProfile }>(`${this.BASE_PATH}/me/picture`, formData);

    return response.data;
  }

  /**
   * Delete profile picture
   */
  static async deleteProfilePicture(): Promise<{ user: UserProfile }> {
    const response = await apiClient.delete<{ user: UserProfile }>(`${this.BASE_PATH}/me/picture`);
    return response.data;
  }

  /**
   * Request email change
   */
  static async requestEmailChange(newEmail: string): Promise<{
    message: string;
    requiresVerification: boolean;
    verificationToken?: string;
  }> {
    const response = await apiClient.post<{
      message: string;
      requiresVerification: boolean;
      verificationToken?: string;
    }>(`${this.BASE_PATH}/me/email/change`, { newEmail });
    return response.data;
  }

  /**
   * Confirm email change
   */
  static async confirmEmailChange(newEmail: string, token: string): Promise<{
    message: string;
    user: UserProfile;
  }> {
    const response = await apiClient.post<{
      message: string;
      user: UserProfile;
    }>(`${this.BASE_PATH}/me/email/confirm`, {
      newEmail,
      token,
    });
    return response.data;
  }

  /**
   * Request phone change
   */
  static async requestPhoneChange(newPhone: string): Promise<{
    message: string;
    requiresVerification: boolean;
    otp?: string;
  }> {
    const response = await apiClient.post<{
      message: string;
      requiresVerification: boolean;
      otp?: string;
    }>(`${this.BASE_PATH}/me/phone/change`, { newPhone });
    return response.data;
  }

  /**
   * Confirm phone change
   */
  static async confirmPhoneChange(newPhone: string, otp: string): Promise<{
    message: string;
    user: UserProfile;
  }> {
    const response = await apiClient.post<{
      message: string;
      user: UserProfile;
    }>(`${this.BASE_PATH}/me/phone/confirm`, {
      newPhone,
      otp,
    });
    return response.data;
  }

  /**
   * Request account deletion
   */
  static async requestAccountDeletion(password: string): Promise<{
    message: string;
    requiresConfirmation: boolean;
    deletionToken?: string;
    expiresAt: Date;
  }> {
    const response = await apiClient.post<{
      message: string;
      requiresConfirmation: boolean;
      deletionToken?: string;
      expiresAt: Date;
    }>(`${this.BASE_PATH}/me/delete`, { password });
    return response.data;
  }
}

export interface Address {
  id: string;
  userId: string;
  type: 'SHIPPING' | 'BILLING';
  firstName: string;
  lastName: string;
  phone?: string;
  address: string;
  addressLine2?: string;
  city: string;
  district: string;
  division: string;
  upazila?: string;
  postalCode?: string;
  isDefault: boolean;
}

export interface CreateAddressRequest {
  type?: 'SHIPPING' | 'BILLING';
  firstName: string;
  lastName: string;
  phone?: string;
  address: string;
  addressLine2?: string;
  city: string;
  district: string;
  division: string;
  upazila?: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest extends Partial<CreateAddressRequest> {}

export class AddressAPI {
  private static readonly BASE_PATH = '/users';

  /**
   * Get all addresses for a user
   */
  static async getAddresses(userId: string): Promise<Address[]> {
    console.log('[AddressAPI] Fetching addresses for userId:', userId);
    console.log('[AddressAPI] Endpoint:', `${this.BASE_PATH}/${userId}/addresses`);

    try {
      // apiClient.get() returns raw backend data directly
      // Backend returns { addresses: [...] } directly, so response.data contains the addresses array
      const apiResponse = await apiClient.get<{ addresses: Address[] }>(
        `${this.BASE_PATH}/${userId}/addresses`
      );
      console.log('[AddressAPI] Full API response:', apiResponse);
      console.log('[AddressAPI] API response type:', typeof apiResponse);
      console.log('[AddressAPI] API response.addresses:', (apiResponse as any)?.addresses);

      // Backend returns { addresses: [...] } directly
      // apiClient.get() returns data directly, so we access apiResponse.addresses
      if (!(apiResponse as any)?.addresses) {
        console.log('[AddressAPI] No addresses data found, returning empty array');
        return [];
      }

      return (apiResponse as any).addresses;
    } catch (error) {
      console.error('[AddressAPI] Error fetching addresses:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  /**
   * Create a new address
   */
  static async createAddress(
    userId: string,
    data: CreateAddressRequest
  ): Promise<Address> {
    const response = await apiClient.post<{ address: Address }>(
      `${this.BASE_PATH}/${userId}/addresses`,
      data
    );
    return (response as { address?: Address })?.address;
  }

  /**
   * Update an existing address
   */
  static async updateAddress(
    userId: string,
    addressId: string,
    data: UpdateAddressRequest
  ): Promise<Address> {
    const response = await apiClient.put<{ address: Address }>(
      `${this.BASE_PATH}/${userId}/addresses/${addressId}`,
      data
    );
    return (response as { address?: Address })?.address;
  }

  /**
   * Delete an address
   */
  static async deleteAddress(
    userId: string,
    addressId: string
  ): Promise<void> {
    await apiClient.delete<void>(
      `${this.BASE_PATH}/${userId}/addresses/${addressId}`
    );
  }

  /**
   * Set an address as default
   */
  static async setDefaultAddress(
    userId: string,
    addressId: string
  ): Promise<Address> {
    const response = await apiClient.put<{ address: Address }>(
      `${this.BASE_PATH}/${userId}/addresses/${addressId}/default`
    );
    return (response as { address?: Address })?.address;
  }
}

export interface ActiveOrder {
  id: string;
  orderNumber: string;
  status: string;
}

export interface AccountDeletionStatus {
  isDeleted: boolean;
  deletedAt?: Date;
  hasActiveOrders: boolean;
  activeOrdersCount: number;
  activeOrders: ActiveOrder[];
}

export class AccountDeletionAPI {
  private static readonly BASE_PATH = '/user';

  /**
   * Delete user account
   */
  static async deleteAccount(password: string): Promise<{
    success: boolean;
    message: string;
    data?: {
      deletedAt: Date;
    };
  }> {
    const response = await apiClient.request<{
      success: boolean;
      message: string;
      data?: {
        deletedAt: Date;
      };
    }>(`${this.BASE_PATH}/account`, { method: 'DELETE', body: { password } });
    return response.data;
  }

  /**
   * Get account deletion status
   */
  static async getDeletionStatus(): Promise<{
    success: boolean;
    data: AccountDeletionStatus;
  }> {
    const response = await apiClient.get<{
      success: boolean;
      data: AccountDeletionStatus;
    }>(`${this.BASE_PATH}/account/deletion-status`);
    return response.data;
  }
}

export default ProfileAPI;
