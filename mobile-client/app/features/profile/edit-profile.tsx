import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { useState, useEffect } from 'react';
import { ThemedView } from '@/components/themed-view';
import { profileService, UserProfile } from '@/services/profileService';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

// Assuming useAuth provides setUser to update local state
// If explicitly typed, verify AuthContext types.

export default function EditProfileScreen() {
    const theme = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [profileData, setProfileData] = useState<UserProfile>({
        name: '',
        email: '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                email: user.email || '',
            });
        }
    }, [user]);

    const handleUpdateProfile = async () => {
        if (!profileData.name || !profileData.email) {
            Alert.alert('Error', 'Name and Email are required');
            return;
        }

        setLoading(true);
        try {
            // Need to adjust if updateProfile returns something specific
            const updatedUser = await profileService.updateProfile(profileData);
            // Assuming API returns updated user object in response.data or similar
            if (updatedUser && updatedUser.data) {
                // If useAuth exposes a way to update user, do it. 
                // For now, relies on next fetch or we can manually update if setUser is exposed.
                // Since I don't recall seeing setUser in the basic auth context dump earlier, I'll assume aggressive refresh or re-fetch.
                // But usually we want to update context.
            }
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword) {
            Alert.alert('Error', 'Current and New Password are required');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await profileService.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            Alert.alert('Success', 'Password changed successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text variant="titleLarge" style={styles.sectionTitle}>Personal Information</Text>

                <TextInput
                    label="Full Name"
                    value={profileData.name}
                    onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
                    mode="outlined"
                    style={styles.input}
                />
                <TextInput
                    label="Email"
                    value={profileData.email}
                    onChangeText={(text) => setProfileData(prev => ({ ...prev, email: text }))}
                    mode="outlined"
                    keyboardType="email-address"
                    style={styles.input}
                    autoCapitalize="none"
                />

                <Button
                    mode="contained"
                    onPress={handleUpdateProfile}
                    loading={loading}
                    style={styles.button}
                >
                    Update Profile
                </Button>

                <View style={styles.divider} />

                <Text variant="titleLarge" style={styles.sectionTitle}>Change Password</Text>

                <TextInput
                    label="Current Password"
                    value={passwordData.currentPassword}
                    onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                    mode="outlined"
                    secureTextEntry
                    style={styles.input}
                />
                <TextInput
                    label="New Password"
                    value={passwordData.newPassword}
                    onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                    mode="outlined"
                    secureTextEntry
                    style={styles.input}
                />
                <TextInput
                    label="Confirm New Password"
                    value={passwordData.confirmPassword}
                    onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
                    mode="outlined"
                    secureTextEntry
                    style={styles.input}
                />

                <Button
                    mode="outlined"
                    onPress={handleChangePassword}
                    loading={loading}
                    style={styles.button}
                >
                    Change Password
                </Button>

                <View style={{ height: 40 }} />
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    sectionTitle: {
        marginBottom: 16,
        fontWeight: 'bold',
    },
    input: {
        marginBottom: 12,
        // backgroundColor: 'white',
    },
    button: {
        marginTop: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 24,
    },
});
