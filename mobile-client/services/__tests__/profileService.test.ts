import { profileService, UserPreferences, UserProfile } from '../profileService';
import { api } from '../api';

jest.mock('../api');

const mockProfile: UserProfile = {
  name: 'Test User',
  email: 'test@example.com',
};

const mockPreferences: UserPreferences = {
  id: 1,
  user_id: 1,
  dark_mode: false,
  notifications: true,
  language: 'en',
  theme: 'light',
  timezone: 'Africa/Nairobi',
};

// The API wraps payloads in { success, data }
const wrap = <T,>(data: T) => ({ data: { success: true, data } });

describe('Profile Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should fetch the current user profile', async () => {
      (api.get as jest.Mock).mockResolvedValue(wrap(mockProfile));

      const profile = await profileService.getProfile();

      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(profile).toEqual(mockProfile);
    });

    it('should handle API errors', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(profileService.getProfile()).rejects.toThrow('Network error');
    });
  });

  describe('updateProfile', () => {
    it('should update the profile', async () => {
      const updates: UserProfile = { name: 'Updated Name', email: 'updated@example.com' };
      (api.put as jest.Mock).mockResolvedValue(wrap(updates));

      const result = await profileService.updateProfile(updates);

      expect(api.put).toHaveBeenCalledWith('/users/profile', updates);
      expect(result).toEqual(updates);
    });

    it('should handle validation errors', async () => {
      (api.put as jest.Mock).mockRejectedValue(new Error('Validation error'));

      await expect(
        profileService.updateProfile({ name: '', email: 'bad' })
      ).rejects.toThrow('Validation error');
    });
  });

  describe('changePassword', () => {
    const data = { currentPassword: 'oldpass', newPassword: 'newpass123' };

    it('should change the password', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });

      const result = await profileService.changePassword(data);

      expect(api.post).toHaveBeenCalledWith('/users/change-password', data);
      expect(result).toEqual({ success: true });
    });

    it('should handle an incorrect current password', async () => {
      (api.post as jest.Mock).mockRejectedValue(new Error('Invalid current password'));

      await expect(profileService.changePassword(data)).rejects.toThrow(
        'Invalid current password'
      );
    });
  });

  describe('getPreferences', () => {
    it('should fetch user preferences', async () => {
      (api.get as jest.Mock).mockResolvedValue(wrap(mockPreferences));

      const preferences = await profileService.getPreferences();

      expect(api.get).toHaveBeenCalledWith('/users/preferences');
      expect(preferences).toEqual(mockPreferences);
    });

    it('should handle API errors', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Failed to load preferences'));

      await expect(profileService.getPreferences()).rejects.toThrow(
        'Failed to load preferences'
      );
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const updates: Partial<UserPreferences> = { dark_mode: true, theme: 'dark' };
      (api.put as jest.Mock).mockResolvedValue(wrap({ ...mockPreferences, ...updates }));

      const preferences = await profileService.updatePreferences(updates);

      expect(api.put).toHaveBeenCalledWith('/users/preferences', updates);
      expect(preferences).toEqual({ ...mockPreferences, ...updates });
    });

    it('should handle API errors', async () => {
      (api.put as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await expect(
        profileService.updatePreferences({ notifications: false })
      ).rejects.toThrow('Update failed');
    });
  });
});
