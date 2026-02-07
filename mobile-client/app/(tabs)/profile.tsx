import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Avatar, List, Divider, Button, Text, useTheme as usePaperTheme, Portal, Dialog, RadioButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { useTheme as useAppTheme } from '@/context/ThemeContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const paperTheme = usePaperTheme();
    const { themeMode, setThemeMode } = useAppTheme();
    const [themeDialogVisible, setThemeDialogVisible] = useState(false);

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await logout();
                            router.replace('/auth/login');
                        } catch (error) {
                            console.error("Logout failed", error);
                        }
                    }
                }
            ]
        );
    };

    if (!user) {
        return (
            <ThemedView style={styles.container}>
                <View style={styles.centerContent}>
                    <IconSymbol name="person.circle" size={80} color={paperTheme.colors.secondary} />
                    <ThemedText type="title" style={{ marginTop: 16 }}>Not Logged In</ThemedText>
                    <ThemedText style={{ textAlign: 'center', marginTop: 8, marginBottom: 24, paddingHorizontal: 32 }}>
                        Log in to view your profile, orders, and favorites.
                    </ThemedText>
                    <Button mode="contained" onPress={() => router.push('/auth/login')}>
                        Login / Register
                    </Button>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.header, { backgroundColor: paperTheme.colors.surface }]}>
                <Avatar.Text
                    size={80}
                    label={user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                    style={{ backgroundColor: paperTheme.colors.primary }}
                />
                <View style={styles.userInfo}>
                    <ThemedText type="title">{user.name}</ThemedText>
                    <Text variant="bodyMedium" style={{ color: paperTheme.colors.onSurfaceVariant }}>{user.email}</Text>
                    <View style={[styles.roleChip, { backgroundColor: paperTheme.colors.primary }]}>
                        <Text variant="labelSmall" style={{ color: paperTheme.colors.onPrimary }}>{user.role}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.content}>
                <List.Section>
                    <List.Subheader>Account Settings</List.Subheader>
                    <List.Item
                        title="Edit Profile & Password"
                        left={props => <List.Icon {...props} icon="account-edit" />}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => router.push('/features/profile/edit-profile')}
                    />
                </List.Section>

                <Divider />

                <List.Section>
                    <List.Subheader>App Settings</List.Subheader>
                    <List.Item
                        title="Theme"
                        description={themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
                        left={props => <List.Icon {...props} icon="theme-light-dark" />}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => setThemeDialogVisible(true)}
                    />
                    <List.Item
                        title="Notifications"
                        left={props => <List.Icon {...props} icon="bell-outline" />}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => { }}
                    />
                    <List.Item
                        title="Language"
                        description="English"
                        left={props => <List.Icon {...props} icon="translate" />}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => { }}
                    />
                </List.Section>

                <View style={styles.logoutContainer}>
                    <Button
                        mode="outlined"
                        icon="logout"
                        textColor={paperTheme.colors.error}
                        style={{ borderColor: paperTheme.colors.error }}
                        onPress={handleLogout}
                    >
                        Logout
                    </Button>
                </View>

                <Portal>
                    <Dialog visible={themeDialogVisible} onDismiss={() => setThemeDialogVisible(false)}>
                        <Dialog.Title>Choose Theme</Dialog.Title>
                        <Dialog.Content>
                            <RadioButton.Group onValueChange={value => setThemeMode(value as any)} value={themeMode}>
                                <RadioButton.Item label="System Default" value="system" />
                                <RadioButton.Item label="Light" value="light" />
                                <RadioButton.Item label="Dark" value="dark" />
                            </RadioButton.Group>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setThemeDialogVisible(false)}>Done</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        padding: 24,
        paddingTop: 60,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    userInfo: {
        marginLeft: 16,
        flex: 1,
    },
    roleChip: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginTop: 4,
    },
    content: {
        flex: 1,
    },
    logoutContainer: {
        padding: 24,
        marginTop: 'auto',
    }
});
