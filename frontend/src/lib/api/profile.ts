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

export interface AccountSettings {
  notifications: {
    email: {
      orderUpdates: boolean;
      specialOffers: boolean;
      newsletter: boolean;
    };
    sms: {
      orderUpdates: boolean;
      specialOffers: boolean;
    };
  };
  privacy: {
    profileVisibility: string;
    showOrders: boolean;
    showReviews: boolean;
  };
  preferences: {
    language: string;
    currency: string;
  };
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
   * Get account settings
   */
  static async getSettings(): Promise<{ settings: AccountSettings }> {
    const response = await apiClient.get<{ settings: AccountSettings }>(`${this.BASE_PATH}/me/settings`);
    return response.data;
  }

  /**
   * Update account settings
   */
  static async updateSettings(settings: Partial<AccountSettings>): Promise<{
    message: string;
    settings: AccountSettings;
  }> {
    const response = await apiClient.put<{
      message: string;
      settings: AccountSettings;
    }>(`${this.BASE_PATH}/me/settings`, settings);
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

  /**
   * Confirm account deletion
   */
  static async confirmAccountDeletion(token: string): Promise<{
    message: string;
  }> {
    const response = await apiClient.post<{
      message: string;
    }>(`${this.BASE_PATH}/me/delete/confirm`, { token });
    return response.data;
  }
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  orderUpdates: boolean;
  promotionalEmails: boolean;
  securityAlerts: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateNotificationPreferencesData {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  orderUpdates?: boolean;
  promotionalEmails?: boolean;
  securityAlerts?: boolean;
}

export class NotificationPreferencesAPI {
  private static readonly BASE_PATH = '/user';

  /**
   * Get user's notification preferences
   */
  static async getPreferences(): Promise<{ preferences: NotificationPreferences }> {
    const response = await apiClient.get<{ preferences: NotificationPreferences }>(
      `${this.BASE_PATH}/notification-preferences`
    );
    return response.data;
  }

  /**
   * Update user's notification preferences
   */
  static async updatePreferences(data: UpdateNotificationPreferencesData): Promise<{
    message: string;
    preferences: NotificationPreferences;
  }> {
    const response = await apiClient.put<{
      message: string;
      preferences: NotificationPreferences;
    }>(`${this.BASE_PATH}/notification-preferences`, data);
    return response.data;
  }
}

export interface CommunicationPreferences {
  id: string;
  userId: string;
  preferredLanguage: string;
  preferredTimezone: string;
  preferredContactMethod: 'email' | 'phone' | 'both';
  marketingConsent: boolean;
  dataSharingConsent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateCommunicationPreferencesData {
  preferredLanguage?: string;
  preferredTimezone?: string;
  preferredContactMethod?: 'email' | 'phone' | 'both';
  marketingConsent?: boolean;
  dataSharingConsent?: boolean;
}

export class CommunicationPreferencesAPI {
  private static readonly BASE_PATH = '/user';

  /**
   * Get user's communication preferences
   */
  static async getPreferences(): Promise<{ preferences: CommunicationPreferences }> {
    const response = await apiClient.get<{ preferences: CommunicationPreferences }>(
      `${this.BASE_PATH}/communication-preferences`
    );
    return response.data;
  }

  /**
   * Update user's communication preferences
   */
  static async updatePreferences(data: UpdateCommunicationPreferencesData): Promise<{
    message: string;
    preferences: CommunicationPreferences;
  }> {
    const response = await apiClient.put<{
      message: string;
      preferences: CommunicationPreferences;
    }>(`${this.BASE_PATH}/communication-preferences`, data);
    return response.data;
  }
}

export interface PrivacySettings {
  id: string;
  userId: string;
  profileVisibility: 'PUBLIC' | 'PRIVATE';
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
  allowSearchByEmail: boolean;
  allowSearchByPhone: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdatePrivacySettingsData {
  profileVisibility?: 'PUBLIC' | 'PRIVATE';
  showEmail?: boolean;
  showPhone?: boolean;
  showAddress?: boolean;
  allowSearchByEmail?: boolean;
  allowSearchByPhone?: boolean;
  twoFactorEnabled?: boolean;
}

export class PrivacySettingsAPI {
  private static readonly BASE_PATH = '/user';

  /**
   * Get user's privacy settings
   */
  static async getPreferences(): Promise<{ preferences: PrivacySettings }> {
    const response = await apiClient.get<{ preferences: PrivacySettings }>(
      `${this.BASE_PATH}/privacy-settings`
    );
    return response.data;
  }

  /**
   * Update user's privacy settings
   */
  static async updatePreferences(data: UpdatePrivacySettingsData): Promise<{
    message: string;
    preferences: PrivacySettings;
  }> {
    const response = await apiClient.put<{
      message: string;
      preferences: PrivacySettings;
    }>(`${this.BASE_PATH}/privacy-settings`, data);
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
    const response = await apiClient.get<{ addresses: Address[] }>(
      `${this.BASE_PATH}/${userId}/addresses`
    );
    return response.addresses;
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
    return response.address;
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
    return response.address;
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
    return response.address;
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
