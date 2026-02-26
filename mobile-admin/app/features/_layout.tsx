import { Stack } from 'expo-router';

export default function FeaturesLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="users/index" />
            <Stack.Screen name="expenses/index" />
            <Stack.Screen name="profile/index" />
            <Stack.Screen name="reports/index" />
        </Stack>
    );
}
