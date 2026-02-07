import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { colorScheme } = useTheme();

  // Create clean themes based on MD3
  const paperTheme = colorScheme === 'dark'
    ? { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, ...Colors.dark } }
    : { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, ...Colors.light } };

  return (
    <PaperProvider theme={paperTheme}>
      <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false }} />
          <Stack.Screen name="cart/index" options={{ presentation: 'modal', title: 'Cart' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="features/profile/edit-profile" options={{ presentation: 'card', title: 'Edit Profile' }} />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </NavThemeProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <ThemeProvider>
          <RootLayoutNav />
        </ThemeProvider>
      </CartProvider>
    </AuthProvider>
  );
}
