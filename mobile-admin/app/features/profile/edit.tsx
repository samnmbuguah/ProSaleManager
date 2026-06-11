import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Appbar, Button, Divider, HelperText, Text, TextInput } from 'react-native-paper';
import { router } from 'expo-router';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ThemedView } from '@/components/themed-view';
import { userService } from '@/services/userService';
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
        }
    });

    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        }
    });

    const onSaveProfile: SubmitHandler<ProfileFormData> = async (data) => {
        setSavingProfile(true);
        try {
            await userService.updateProfile({ name: data.name, email: data.email });
            await refreshUser();
            Alert.alert('Success', 'Profile updated successfully');
            router.back();
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || e.message || 'Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const onChangePassword: SubmitHandler<PasswordFormData> = async (data) => {
        setSavingPassword(true);
        try {
            await userService.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            passwordForm.reset();
            Alert.alert('Success', 'Password changed successfully');
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || e.message || 'Failed to change password');
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Edit Profile" />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.content}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Profile Details</Text>

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
                            autoCapitalize="none"
                            keyboardType="email-address"
                            mode="outlined"
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
                    onPress={profileForm.handleSubmit(onSaveProfile)}
                    loading={savingProfile}
                    disabled={savingProfile}
                    style={styles.button}
                >
                    Save Profile
                </Button>

                <Divider style={styles.divider} />

                <Text variant="titleMedium" style={styles.sectionTitle}>Change Password</Text>

                <Controller
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            label="Current Password"
                            value={value}
                            onChangeText={onChange}
                            secureTextEntry
                            autoCapitalize="none"
                            mode="outlined"
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
                            secureTextEntry
                            autoCapitalize="none"
                            mode="outlined"
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
                            secureTextEntry
                            autoCapitalize="none"
                            mode="outlined"
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
                    onPress={passwordForm.handleSubmit(onChangePassword)}
                    loading={savingPassword}
                    disabled={savingPassword}
                    style={styles.button}
                >
                    Change Password
                </Button>
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
        paddingBottom: 48,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 12,
    },
    input: {
        marginBottom: 4,
    },
    button: {
        marginTop: 8,
    },
    divider: {
        marginVertical: 24,
    },
});
