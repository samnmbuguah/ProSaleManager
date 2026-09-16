import { userService } from '../userService';
import { api } from '../api';
import { ChangePassword, InsertUser, UpdateProfile, UpdateUser, User } from '../../types/user';

jest.mock('../api');

const mockUser: User = {
  id: 1,
  name: 'Jane Doe',
  email: 'jane@example.com',
  role: 'admin',
  is_active: true,
};

// The API wraps user payloads in { success, data }
const wrap = <T,>(data: T) => ({ data: { success: true, data } });

describe('User Service (Mobile Admin)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all users', async () => {
      (api.get as jest.Mock).mockResolvedValue(wrap([mockUser]));

      const users = await userService.getAll();

      expect(api.get).toHaveBeenCalledWith('/users');
      expect(users).toEqual([mockUser]);
    });

    it('should handle an empty user list', async () => {
      (api.get as jest.Mock).mockResolvedValue(wrap([]));

      const users = await userService.getAll();

      expect(users).toEqual([]);
    });

    it('should handle API errors', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(userService.getAll()).rejects.toThrow('Network error');
    });
  });

  describe('getById', () => {
    it('should fetch a user by id', async () => {
      (api.get as jest.Mock).mockResolvedValue(wrap(mockUser));

      const user = await userService.getById(1);

      expect(api.get).toHaveBeenCalledWith('/users/1');
      expect(user).toEqual(mockUser);
    });

    it('should handle user not found', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('User not found'));

      await expect(userService.getById(999)).rejects.toThrow('User not found');
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const newUser: InsertUser = {
        name: 'John Smith',
        email: 'john@example.com',
        password: 'secret123',
        role: 'sales',
      };
      (api.post as jest.Mock).mockResolvedValue(wrap({ ...newUser, id: 2, is_active: true }));

      const user = await userService.create(newUser);

      expect(api.post).toHaveBeenCalledWith('/users', newUser);
      expect(user).toEqual({ ...newUser, id: 2, is_active: true });
    });

    it('should handle validation errors', async () => {
      const invalidUser: InsertUser = { name: '', email: 'bad', password: '' };
      (api.post as jest.Mock).mockRejectedValue(new Error('Validation error'));

      await expect(userService.create(invalidUser)).rejects.toThrow('Validation error');
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updates: UpdateUser = { name: 'Jane Updated', is_active: false };
      (api.put as jest.Mock).mockResolvedValue(wrap({ ...mockUser, ...updates }));

      const user = await userService.update(1, updates);

      expect(api.put).toHaveBeenCalledWith('/users/1', updates);
      expect(user).toEqual({ ...mockUser, ...updates });
    });

    it('should handle API errors', async () => {
      (api.put as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await expect(userService.update(1, { name: 'X' })).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      (api.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

      await userService.delete(1);

      expect(api.delete).toHaveBeenCalledWith('/users/1');
    });

    it('should handle user not found on delete', async () => {
      (api.delete as jest.Mock).mockRejectedValue(new Error('User not found'));

      await expect(userService.delete(999)).rejects.toThrow('User not found');
    });
  });

  describe('getProfile', () => {
    it('should fetch the current profile', async () => {
      (api.get as jest.Mock).mockResolvedValue(wrap(mockUser));

      const user = await userService.getProfile();

      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(user).toEqual(mockUser);
    });

    it('should return null when unauthenticated', async () => {
      (api.get as jest.Mock).mockResolvedValue(wrap(null));

      const user = await userService.getProfile();

      expect(user).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update the current profile', async () => {
      const updates: UpdateProfile = { name: 'Jane New', email: 'jane.new@example.com' };
      (api.put as jest.Mock).mockResolvedValue(wrap({ ...mockUser, ...updates }));

      const user = await userService.updateProfile(updates);

      expect(api.put).toHaveBeenCalledWith('/users/profile', updates);
      expect(user).toEqual({ ...mockUser, ...updates });
    });

    it('should handle API errors', async () => {
      (api.put as jest.Mock).mockRejectedValue(new Error('Profile update failed'));

      await expect(userService.updateProfile({ name: 'X' })).rejects.toThrow(
        'Profile update failed'
      );
    });
  });

  describe('changePassword', () => {
    it('should change the current password', async () => {
      const data: ChangePassword = { currentPassword: 'oldpass', newPassword: 'newpass123' };
      (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });

      await userService.changePassword(data);

      expect(api.post).toHaveBeenCalledWith('/users/change-password', data);
    });

    it('should handle incorrect current password', async () => {
      (api.post as jest.Mock).mockRejectedValue(new Error('Invalid current password'));

      await expect(
        userService.changePassword({ currentPassword: 'wrong', newPassword: 'newpass123' })
      ).rejects.toThrow('Invalid current password');
    });
  });
});
