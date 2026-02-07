import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { router } from 'expo-router';

// URL from .env file (Expo automatically loads EXPO_PUBLIC_ variables)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

type AuthEventCallback = () => void;
const authListeners: AuthEventCallback[] = [];

export const onAuthError = (callback: AuthEventCallback) => {
    authListeners.push(callback);
    return () => {
        const index = authListeners.indexOf(callback);
        if (index > -1) authListeners.splice(index, 1);
    };
};

const notifyAuthError = () => {
    authListeners.forEach(cb => cb());
};

export const setAuthToken = async (token: string | null) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await SecureStore.setItemAsync('auth_token', token);
    } else {
        delete api.defaults.headers.common['Authorization'];
        await SecureStore.deleteItemAsync('auth_token');
    }
};

// Initialize token from storage
export const initAuth = async () => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized (logout)
            await setAuthToken(null);
            notifyAuthError();
        }
        return Promise.reject(error);
    }
);
