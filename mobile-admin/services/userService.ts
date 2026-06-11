import { api } from './api';
import { ChangePassword, InsertUser, UpdateProfile, UpdateUser, User } from '../types/user';

export const userService = {
    // The API wraps user payloads in { success, data }
    getAll: async () => {
        const response = await api.get<{ success: boolean; data: User[] }>('/users');
        return response.data.data;
    },

    getById: async (id: number) => {
        const response = await api.get<{ success: boolean; data: User }>(`/users/${id}`);
        return response.data.data;
    },

    create: async (data: InsertUser) => {
        const response = await api.post<{ success: boolean; data: User }>('/users', data);
        return response.data.data;
    },

    update: async (id: number, data: UpdateUser) => {
        const response = await api.put<{ success: boolean; data: User }>(`/users/${id}`, data);
        return response.data.data;
    },

    delete: async (id: number) => {
        await api.delete(`/users/${id}`);
    },

    getProfile: async () => {
        const response = await api.get<{ success: boolean; data: User | null }>('/auth/me');
        return response.data.data;
    },

    updateProfile: async (data: UpdateProfile) => {
        const response = await api.put<{ success: boolean; data: User }>('/users/profile', data);
        return response.data.data;
    },

    changePassword: async (data: ChangePassword) => {
        await api.post('/users/change-password', data);
    },
};
