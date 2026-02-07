/**
 * Profile Picture Upload Fix Test Suite
 * 
 * This test suite verifies the fix for the profile picture upload bug where
 * API methods were incorrectly accessing response.data on already unwrapped responses.
 * 
 * The fix changed all four methods to return response directly instead of response.data:
 * - getProfile() - Line 42
 * - updateProfile() - Line 50
 * - uploadProfilePicture() - Line 66
 * - deleteProfilePicture() - Line 74
 * 
 * Original Error: "can't access property 'user', e is undefined"
 */

import { ProfileAPI } from '@/lib/api/profile';
import { apiClient } from '@/lib/api/client';

// Mock the apiClient module
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
  },
}));

describe('ProfileAPI - Response Structure Fix Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test data fixtures
  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    phone: '+8801234567890',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'MALE' as const,
    role: 'ADMIN',
    status: 'ACTIVE',
    image: 'https://example.com/admin-avatar.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-02-01'),
    lastLoginAt: new Date('2024-02-07'),
    emailVerified: true,
    phoneVerified: true,
    addresses: [],
    _count: {
      orders: 10,
      reviews: 5,
    },
  };

  const mockRegularUser = {
    id: 'user-456',
    email: 'user@example.com',
    firstName: 'Regular',
    lastName: 'User',
    phone: '+8801234567891',
    dateOfBirth: new Date('1995-01-01'),
    gender: 'FEMALE' as const,
    role: 'USER',
    status: 'ACTIVE',
    image: 'https://example.com/user-avatar.jpg',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-01'),
    lastLoginAt: new Date('2024-02-06'),
    emailVerified: true,
    phoneVerified: false,
    addresses: [],
    _count: {
      orders: 5,
      reviews: 2,
    },
  };

  const mockUserWithoutPicture = {
    ...mockRegularUser,
    image: undefined,
  };

  describe('getProfile() - Line 42 Fix', () => {
    it('should return response with user property for admin user', async () => {
      // Mock the API client to return unwrapped data (as it does after handleResponse)
      (apiClient.get as jest.Mock).mockResolvedValue({ user: mockAdminUser });

      const result = await ProfileAPI.getProfile();

      // Verify the response structure is correct
      expect(result).toBeDefined();
      expect(result).toHaveProperty('user');
      expect(result.user).toBeDefined();
      expect(result.user).toEqual(mockAdminUser);
      expect(result.user.id).toBe('admin-123');
      expect(result.user.role).toBe('ADMIN');
      expect(result.user.image).toBe('https://example.com/admin-avatar.jpg');

      // Verify API was called correctly
      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/profile/me');
    });

    it('should return response with user property for regular user', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ user: mockRegularUser });

      const result = await ProfileAPI.getProfile();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('user');
      expect(result.user).toBeDefined();
      expect(result.user).toEqual(mockRegularUser);
      expect(result.user.id).toBe('user-456');
      expect(result.user.role).toBe('USER');

      expect(apiClient.get).toHaveBeenCalledWith('/profile/me');
    });

    it('should handle user without profile picture', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ user: mockUserWithoutPicture });

      const result = await ProfileAPI.getProfile();

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.image).toBeUndefined();

      expect(apiClient.get).toHaveBeenCalledWith('/profile/me');
    });

    it('should not throw "can\'t access property \'user\', e is undefined" error', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ user: mockAdminUser });

      // This should not throw any error
      await expect(ProfileAPI.getProfile()).resolves.toBeDefined();
      await expect(ProfileAPI.getProfile()).resolves.toHaveProperty('user');
    });
  });

  describe('updateProfile() - Line 50 Fix', () => {
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name',
      phone: '+8801234567899',
    };

    it('should return response with user property for admin user', async () => {
      const updatedAdmin = { ...mockAdminUser, ...updateData };
      (apiClient.put as jest.Mock).mockResolvedValue({ user: updatedAdmin });

      const result = await ProfileAPI.updateProfile(updateData);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('user');
      expect(result.user).toBeDefined();
      expect(result.user.firstName).toBe('Updated');
      expect(result.user.lastName).toBe('Name');
      expect(result.user.phone).toBe('+8801234567899');

      expect(apiClient.put).toHaveBeenCalledTimes(1);
      expect(apiClient.put).toHaveBeenCalledWith('/profile/me', updateData);
    });

    it('should return response with user property for regular user', async () => {
      const updatedUser = { ...mockRegularUser, ...updateData };
      (apiClient.put as jest.Mock).mockResolvedValue({ user: updatedUser });

      const result = await ProfileAPI.updateProfile(updateData);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('user');
      expect(result.user).toBeDefined();
      expect(result.user.firstName).toBe('Updated');
      expect(result.user.lastName).toBe('Name');

      expect(apiClient.put).toHaveBeenCalledWith('/profile/me', updateData);
    });

    it('should not throw "can\'t access property \'user\', e is undefined" error', async () => {
      (apiClient.put as jest.Mock).mockResolvedValue({ user: mockAdminUser });

      await expect(ProfileAPI.updateProfile({ firstName: 'Test' })).resolves.toBeDefined();
      await expect(ProfileAPI.updateProfile({ firstName: 'Test' })).resolves.toHaveProperty('user');
    });
  });

  describe('uploadProfilePicture() - Line 66 Fix', () => {
    const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });

    it('should return response with user property for admin user', async () => {
      const adminWithPicture = {
        ...mockAdminUser,
        image: 'https://example.com/new-admin-avatar.jpg',
      };
      (apiClient.post as jest.Mock).mockResolvedValue({ user: adminWithPicture });

      const result = await ProfileAPI.uploadProfilePicture(mockFile);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('user');
      expect(result.user).toBeDefined();
      expect(result.user.image).toBe('https://example.com/new-admin-avatar.jpg');

      expect(apiClient.post).toHaveBeenCalledTimes(1);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/profile/me/picture',
        expect.any(FormData),
        { timeout: 60000 }
      );
    });

    it('should return response with user property for regular user', async () => {
      const userWithPicture = {
        ...mockRegularUser,
        image: 'https://example.com/new-user-avatar.jpg',
      };
      (apiClient.post as jest.Mock).mockResolvedValue({ user: userWithPicture });

      const result = await ProfileAPI.uploadProfilePicture(mockFile);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('user');
      expect(result.user).toBeDefined();
      expect(result.user.image).toBe('https://example.com/new-user-avatar.jpg');

      expect(apiClient.post).toHaveBeenCalledWith(
        '/profile/me/picture',
        expect.any(FormData),
        { timeout: 60000 }
      );
    });

    it('should handle upload for user without existing picture', async () => {
      const userWithNewPicture = {
        ...mockUserWithoutPicture,
        image: 'https://example.com/first-avatar.jpg',
      };
      (apiClient.post as jest.Mock).mockResolvedValue({ user: userWithNewPicture });

      const result = await ProfileAPI.uploadProfilePicture(mockFile);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.image).toBe('https://example.com/first-avatar.jpg');
      expect(result.user.image).not.toBeUndefined();

      expect(apiClient.post).toHaveBeenCalledWith(
        '/profile/me/picture',
        expect.any(FormData),
        { timeout: 60000 }
      );
    });

    it('should not throw "can\'t access property \'user\', e is undefined" error', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({ user: mockAdminUser });

      await expect(ProfileAPI.uploadProfilePicture(mockFile)).resolves.toBeDefined();
      await expect(ProfileAPI.uploadProfilePicture(mockFile)).resolves.toHaveProperty('user');
    });

    it('should create FormData with picture field', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({ user: mockAdminUser });

      await ProfileAPI.uploadProfilePicture(mockFile);

      const formData = (apiClient.post as jest.Mock).mock.calls[0][1];
      expect(formData).toBeInstanceOf(FormData);
      expect(formData.get('picture')).toBe(mockFile);
    });
  });

  describe('deleteProfilePicture() - Line 74 Fix', () => {
    it('should return response with user property for admin user', async () => {
      const adminWithoutPicture = { ...mockAdminUser, image: undefined };
      (apiClient.delete as jest.Mock).mockResolvedValue({ user: adminWithoutPicture });

      const result = await ProfileAPI.deleteProfilePicture();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('user');
      expect(result.user).toBeDefined();
      expect(result.user.image).toBeUndefined();

      expect(apiClient.delete).toHaveBeenCalledTimes(1);
      expect(apiClient.delete).toHaveBeenCalledWith('/profile/me/picture');
    });

    it('should return response with user property for regular user', async () => {
      const userWithoutPicture = { ...mockRegularUser, image: undefined };
      (apiClient.delete as jest.Mock).mockResolvedValue({ user: userWithoutPicture });

      const result = await ProfileAPI.deleteProfilePicture();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('user');
      expect(result.user).toBeDefined();
      expect(result.user.image).toBeUndefined();

      expect(apiClient.delete).toHaveBeenCalledWith('/profile/me/picture');
    });

    it('should not throw "can\'t access property \'user\', e is undefined" error', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({ user: mockUserWithoutPicture });

      await expect(ProfileAPI.deleteProfilePicture()).resolves.toBeDefined();
      await expect(ProfileAPI.deleteProfilePicture()).resolves.toHaveProperty('user');
    });
  });

  describe('Integration Tests - Complete Profile Picture Workflow', () => {
    it('should handle complete workflow for admin user: get -> upload -> get -> delete -> get', async () => {
      // Step 1: Get initial profile (no picture)
      (apiClient.get as jest.Mock).mockResolvedValue({ user: mockUserWithoutPicture });
      let profile = await ProfileAPI.getProfile();
      expect(profile.user.image).toBeUndefined();

      // Step 2: Upload picture
      const adminWithPicture = { ...mockAdminUser, image: 'https://example.com/avatar.jpg' };
      (apiClient.post as jest.Mock).mockResolvedValue({ user: adminWithPicture });
      profile = await ProfileAPI.uploadProfilePicture(new File(['test'], 'avatar.jpg', { type: 'image/jpeg' }));
      expect(profile.user.image).toBe('https://example.com/avatar.jpg');

      // Step 3: Get profile to verify picture is set
      (apiClient.get as jest.Mock).mockResolvedValue({ user: adminWithPicture });
      profile = await ProfileAPI.getProfile();
      expect(profile.user.image).toBe('https://example.com/avatar.jpg');

      // Step 4: Delete picture
      const adminWithoutPicture = { ...mockAdminUser, image: undefined };
      (apiClient.delete as jest.Mock).mockResolvedValue({ user: adminWithoutPicture });
      profile = await ProfileAPI.deleteProfilePicture();
      expect(profile.user.image).toBeUndefined();

      // Step 5: Get profile to verify picture is removed
      (apiClient.get as jest.Mock).mockResolvedValue({ user: adminWithoutPicture });
      profile = await ProfileAPI.getProfile();
      expect(profile.user.image).toBeUndefined();

      // Verify no errors were thrown
      expect(apiClient.get).toHaveBeenCalledTimes(3);
      expect(apiClient.post).toHaveBeenCalledTimes(1);
      expect(apiClient.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle complete workflow for regular user: get -> upload -> get -> delete -> get', async () => {
      // Step 1: Get initial profile (no picture)
      (apiClient.get as jest.Mock).mockResolvedValue({ user: mockUserWithoutPicture });
      let profile = await ProfileAPI.getProfile();
      expect(profile.user.image).toBeUndefined();

      // Step 2: Upload picture
      const userWithPicture = { ...mockRegularUser, image: 'https://example.com/user-avatar.jpg' };
      (apiClient.post as jest.Mock).mockResolvedValue({ user: userWithPicture });
      profile = await ProfileAPI.uploadProfilePicture(new File(['test'], 'avatar.jpg', { type: 'image/jpeg' }));
      expect(profile.user.image).toBe('https://example.com/user-avatar.jpg');

      // Step 3: Get profile to verify picture is set
      (apiClient.get as jest.Mock).mockResolvedValue({ user: userWithPicture });
      profile = await ProfileAPI.getProfile();
      expect(profile.user.image).toBe('https://example.com/user-avatar.jpg');

      // Step 4: Delete picture
      const userWithoutPicture = { ...mockRegularUser, image: undefined };
      (apiClient.delete as jest.Mock).mockResolvedValue({ user: userWithoutPicture });
      profile = await ProfileAPI.deleteProfilePicture();
      expect(profile.user.image).toBeUndefined();

      // Step 5: Get profile to verify picture is removed
      (apiClient.get as jest.Mock).mockResolvedValue({ user: userWithoutPicture });
      profile = await ProfileAPI.getProfile();
      expect(profile.user.image).toBeUndefined();

      // Verify no errors were thrown
      expect(apiClient.get).toHaveBeenCalledTimes(3);
      expect(apiClient.post).toHaveBeenCalledTimes(1);
      expect(apiClient.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle API errors gracefully for getProfile', async () => {
      const mockError = new Error('Network error');
      (apiClient.get as jest.Mock).mockRejectedValue(mockError);

      await expect(ProfileAPI.getProfile()).rejects.toThrow('Network error');
    });

    it('should handle API errors gracefully for updateProfile', async () => {
      const mockError = new Error('Update failed');
      (apiClient.put as jest.Mock).mockRejectedValue(mockError);

      await expect(ProfileAPI.updateProfile({ firstName: 'Test' })).rejects.toThrow('Update failed');
    });

    it('should handle API errors gracefully for uploadProfilePicture', async () => {
      const mockError = new Error('Upload failed');
      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      await expect(ProfileAPI.uploadProfilePicture(new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })))
        .rejects.toThrow('Upload failed');
    });

    it('should handle API errors gracefully for deleteProfilePicture', async () => {
      const mockError = new Error('Delete failed');
      (apiClient.delete as jest.Mock).mockRejectedValue(mockError);

      await expect(ProfileAPI.deleteProfilePicture()).rejects.toThrow('Delete failed');
    });
  });

  describe('Response Structure Validation Tests', () => {
    it('should validate getProfile response structure matches UserProfile interface', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ user: mockAdminUser });

      const result = await ProfileAPI.getProfile();

      // Verify all required properties exist
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('firstName');
      expect(result.user).toHaveProperty('lastName');
      expect(result.user).toHaveProperty('role');
      expect(result.user).toHaveProperty('status');
      expect(result.user).toHaveProperty('createdAt');
      expect(result.user).toHaveProperty('updatedAt');
      expect(result.user).toHaveProperty('emailVerified');
      expect(result.user).toHaveProperty('phoneVerified');
      expect(result.user).toHaveProperty('addresses');
      expect(result.user).toHaveProperty('_count');
    });

    it('should validate uploadProfilePicture response structure', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({ user: mockAdminUser });

      const result = await ProfileAPI.uploadProfilePicture(new File(['test'], 'avatar.jpg', { type: 'image/jpeg' }));

      // Verify the response has the correct structure
      expect(result).toHaveProperty('user');
      expect(typeof result.user).toBe('object');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('image');
    });

    it('should validate deleteProfilePicture response structure', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({ user: mockUserWithoutPicture });

      const result = await ProfileAPI.deleteProfilePicture();

      // Verify the response has the correct structure
      expect(result).toHaveProperty('user');
      expect(typeof result.user).toBe('object');
      expect(result.user).toHaveProperty('id');
      expect(result.user.image).toBeUndefined();
    });
  });

  describe('Regression Tests - Original Bug Fix Verification', () => {
    it('should NOT access response.data when response is already unwrapped', async () => {
      // This test verifies that the methods correctly return the response directly
      // without trying to access response.data (which would cause "can't access property 'user', e is undefined")

      const unwrappedResponse = { user: mockAdminUser };
      (apiClient.get as jest.Mock).mockResolvedValue(unwrappedResponse);
      (apiClient.put as jest.Mock).mockResolvedValue(unwrappedResponse);
      (apiClient.post as jest.Mock).mockResolvedValue(unwrappedResponse);
      (apiClient.delete as jest.Mock).mockResolvedValue(unwrappedResponse);

      // All these should work without errors
      await expect(ProfileAPI.getProfile()).resolves.toEqual(unwrappedResponse);
      await expect(ProfileAPI.updateProfile({ firstName: 'Test' })).resolves.toEqual(unwrappedResponse);
      await expect(ProfileAPI.uploadProfilePicture(new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })))
        .resolves.toEqual(unwrappedResponse);
      await expect(ProfileAPI.deleteProfilePicture()).resolves.toEqual(unwrappedResponse);
    });

    it('should handle the exact scenario from the original bug report', async () => {
      // Original error: "can't access property 'user', e is undefined"
      // This occurred when trying to upload a profile picture

      const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });
      const uploadResponse = { user: mockAdminUser };
      
      (apiClient.post as jest.Mock).mockResolvedValue(uploadResponse);

      // This should succeed without the original error
      const result = await ProfileAPI.uploadProfilePicture(mockFile);
      
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe('admin-123');
      
      // Verify we're not trying to access undefined properties
      expect(() => {
        const user = result.user;
        expect(user.id).toBeDefined();
      }).not.toThrow();
    });
  });
});
