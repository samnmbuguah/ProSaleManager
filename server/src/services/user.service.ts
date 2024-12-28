import User from '../models/User.js';
import type { ServiceResponse } from '../types/base';
import bcrypt from 'bcrypt';

interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'user';
}

interface UpdateUserDTO {
  email?: string;
  password?: string;
  name?: string;
  role?: 'admin' | 'user';
}

export class UserService {
  async create(data: CreateUserDTO): Promise<ServiceResponse<User>> {
    try {
      const user = await User.create({
        ...data,
        role: data.role || 'user',
      });

      return {
        success: true,
        data: user,
        message: 'User created successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to create user',
      };
    }
  }

  async findByEmail(email: string): Promise<ServiceResponse<User>> {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return {
          success: false,
          data: null,
          message: 'User not found',
        };
      }
      return {
        success: true,
        data: user,
        message: 'User found successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to find user',
      };
    }
  }

  async findById(id: number): Promise<ServiceResponse<User>> {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        return {
          success: false,
          data: null,
          message: 'User not found',
        };
      }
      return {
        success: true,
        data: user,
        message: 'User found successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to find user',
      };
    }
  }

  async validateCredentials(email: string, password: string): Promise<ServiceResponse<User>> {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return {
          success: false,
          data: null,
          message: 'Invalid credentials',
        };
      }

      const isValid = await user.comparePassword(password);
      if (!isValid) {
        return {
          success: false,
          data: null,
          message: 'Invalid credentials',
        };
      }

      return {
        success: true,
        data: user,
        message: 'Credentials validated successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to validate credentials',
      };
    }
  }

  async update(id: number, data: UpdateUserDTO): Promise<ServiceResponse<User>> {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        return {
          success: false,
          data: null,
          message: 'User not found',
        };
      }

      await user.update(data);

      return {
        success: true,
        data: user,
        message: 'User updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to update user',
      };
    }
  }
} 