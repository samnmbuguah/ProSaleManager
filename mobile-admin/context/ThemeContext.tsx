import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    colorScheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType>({
    themeMode: 'light',
    setThemeMode: () => { },
    colorScheme: 'light',
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemColorScheme = useSystemColorScheme();
    const [themeMode, setThemeMode] = useState<ThemeMode>('light'); // Default to light

    useEffect(() => {
        // Load saved theme
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('themeMode');
                if (savedTheme) {
                    setThemeMode(savedTheme as ThemeMode);
                }
            } catch (error) {
                console.error('Failed to load theme', error);
            }
        };
        loadTheme();
    }, []);

    const saveThemeMode = async (mode: ThemeMode) => {
        try {
            setThemeMode(mode);
            await AsyncStorage.setItem('themeMode', mode);
        } catch (error) {
            console.error('Failed to save theme', error);
        }
    };

    const colorScheme = themeMode === 'system' ? (systemColorScheme ?? 'light') : themeMode;

    return (
        <ThemeContext.Provider value={{ themeMode, setThemeMode: saveThemeMode, colorScheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
