import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ThemedView } from '@/components/themed-view';
import { profileService } from '@/services/profileService';
import { useAuth } from '@/context/AuthContext';

const profileSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(8, 'New password must be at least 8 characters'),
        confirmPassword: z.string().min(1, 'Please confirm the new password'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function EditProfileScreen() {
    const { user, refreshUser } = useAuth();

    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    const profileForm = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name ?? '',
            email: user?.email ?? '',
        },
    });

    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    useEffect(() => {
        if (user) {
            profileForm.reset({
                name: user.name || '',
                email: user.email || '',
            });
        }
    }, [user]);

    const handleUpdateProfile: SubmitHandler<ProfileFormData> = async (data) => {
        setSavingProfile(true);
        try {
            await profileService.updateProfile({ name: data.name, email: data.email });
            await refreshUser();
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword: SubmitHandler<PasswordFormData> = async (data) => {
        setSavingPassword(true);
        try {
            await profileService.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            Alert.alert('Success', 'Password changed successfully');
            passwordForm.reset();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text variant="titleLarge" style={styles.sectionTitle}>Personal Information</Text>

                <Controller
                    control={profileForm.control}
                    name="name"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            label="Full Name"
                            value={value}
                            onChangeText={onChange}
                            mode="outlined"
                            error={!!profileForm.formState.errors.name}
                            style={styles.input}
                        />
                    )}
                />
                <HelperText type="error" visible={!!profileForm.formState.errors.name}>
                    {profileForm.formState.errors.name?.message}
                </HelperText>

                <Controller
                    control={profileForm.control}
                    name="email"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            label="Email"
                            value={value}
                            onChangeText={onChange}
                            mode="outlined"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            error={!!profileForm.formState.errors.email}
                            style={styles.input}
                        />
                    )}
                />
                <HelperText type="error" visible={!!profileForm.formState.errors.email}>
                    {profileForm.formState.errors.email?.message}
                </HelperText>

                <Button
                    mode="contained"
                    onPress={profileForm.handleSubmit(handleUpdateProfile)}
                    loading={savingProfile}
                    disabled={savingProfile}
                    style={styles.button}
                >
                    Update Profile
                </Button>

                <View style={styles.divider} />

                <Text variant="titleLarge" style={styles.sectionTitle}>Change Password</Text>

                <Controller
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            label="Current Password"
                            value={value}
                            onChangeText={onChange}
                            mode="outlined"
                            secureTextEntry
                            autoCapitalize="none"
                            error={!!passwordForm.formState.errors.currentPassword}
                            style={styles.input}
                        />
                    )}
                />
                <HelperText type="error" visible={!!passwordForm.formState.errors.currentPassword}>
                    {passwordForm.formState.errors.currentPassword?.message}
                </HelperText>

                <Controller
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            label="New Password"
                            value={value}
                            onChangeText={onChange}
                            mode="outlined"
                            secureTextEntry
                            autoCapitalize="none"
                            error={!!passwordForm.formState.errors.newPassword}
                            style={styles.input}
                        />
                    )}
                />
                <HelperText type="error" visible={!!passwordForm.formState.errors.newPassword}>
                    {passwordForm.formState.errors.newPassword?.message}
                </HelperText>

                <Controller
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            label="Confirm New Password"
                            value={value}
                            onChangeText={onChange}
                            mode="outlined"
                            secureTextEntry
                            autoCapitalize="none"
                            error={!!passwordForm.formState.errors.confirmPassword}
                            style={styles.input}
                        />
                    )}
                />
                <HelperText type="error" visible={!!passwordForm.formState.errors.confirmPassword}>
                    {passwordForm.formState.errors.confirmPassword?.message}
                </HelperText>

                <Button
                    mode="outlined"
                    onPress={passwordForm.handleSubmit(handleChangePassword)}
                    loading={savingPassword}
                    disabled={savingPassword}
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
        marginBottom: 4,
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
