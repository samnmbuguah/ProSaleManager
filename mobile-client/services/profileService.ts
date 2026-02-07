import { api } from './api';

export interface UserProfile {
    name: string;
    email: string;
}

export interface UserPreferences {
    id: number;
    user_id: number;
    dark_mode: boolean;
    notifications: boolean;
    language: string;
    theme: string;
    timezone: string;
}

export const profileService = {
    getProfile: async () => {
        // Fetch auth/me to get current user details
        const response = await api.get('/auth/me');
        return response.data.data;
    },

    updateProfile: async (data: UserProfile) => {
        const response = await api.put('/users/profile', data);
        return response.data.data;
    },

    changePassword: async (data: any) => {
        const response = await api.post('/users/change-password', data);
        return response.data;
    },

    getPreferences: async (): Promise<UserPreferences> => {
        const response = await api.get('/users/preferences');
        return response.data.data;
    },

    updatePreferences: async (data: Partial<UserPreferences>) => {
        const response = await api.put('/users/preferences', data);
        return response.data.data;
    }
};
