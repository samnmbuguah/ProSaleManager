import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { api, setAuthToken, initAuth, onAuthError } from '../services/api';
import { router, useSegments } from 'expo-router';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (data: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const segments = useSegments();

    // Load initial session
    useEffect(() => {
        const loadSession = async () => {
            // ... existing loadSession logic (initAuth, fetch me, etc.) ...
            try {
                await initAuth();
                const response = await api.get('/auth/me');
                setUser(response.data);
            } catch (error) {
                // No valid session
            } finally {
                setIsLoading(false);
            }
        };
        loadSession();

        // Listen for 401 errors from API
        const unsubscribe = onAuthError(() => {
            setUser(null);
            // Router redirect handled by Route Protection effect
        });

        return unsubscribe;
    }, []);

    // Route Protection
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === 'auth';

        if (!user && !inAuthGroup) {
            // Redirect to list of sign-in page if not signed in
            router.replace('/auth/login');
        } else if (user && inAuthGroup) {
            // Redirect away from sign-in page if signed in
            router.replace('/(tabs)');
        }
    }, [user, segments, isLoading]);


    const login = async (data: any) => {
        const response = await api.post('/auth/login', data);
        const { user, token } = response.data;
        setUser(user);
        if (token) await setAuthToken(token);
        router.replace('/(tabs)');
    };

    const register = async (data: any) => {
        const response = await api.post('/auth/register', data);
        const { user, token } = response.data;
        setUser(user);
        if (token) await setAuthToken(token);
        router.replace('/(tabs)');
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            // ignore
        } finally {
            setUser(null);
            await setAuthToken(null);
            router.replace('/auth/login');
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
