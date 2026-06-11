import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Appbar, Button, HelperText, Menu, TextInput } from 'react-native-paper';
import { router } from 'expo-router';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ThemedView } from '@/components/themed-view';
import { userService } from '@/services/userService';
import { ASSIGNABLE_ROLES } from '@/types/user';
import { useAuth } from '@/context/AuthContext';

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(ASSIGNABLE_ROLES),
});

type FormData = z.infer<typeof formSchema>;

const roleLabel = (role: string) => role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ');

export default function AddUserScreen() {
    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [roleMenuVisible, setRoleMenuVisible] = useState(false);

    const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            role: 'sales',
        }
    });

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setLoading(true);
        try {
            await userService.create({
                name: data.name,
                email: data.email,
                password: data.password,
                role: data.role,
                // The API requires a store for non-super-admin users
                store_id: currentUser?.store_id ?? undefined,
            });
            Alert.alert('Success', 'User created successfully');
            router.back();
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || e.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Add User" />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.content}>
                <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            label="Full Name"
                            value={value}
                            onChangeText={onChange}
                            mode="outlined"
                            error={!!errors.name}
                            style={styles.input}
                        />
                    )}
                />
                <HelperText type="error" visible={!!errors.name}>
                    {errors.name?.message}
                </HelperText>

                <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            label="Email"
                            value={value}
                            onChangeText={onChange}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            mode="outlined"
                            error={!!errors.email}
                            style={styles.input}
                        />
                    )}
                />
                <HelperText type="error" visible={!!errors.email}>
                    {errors.email?.message}
                </HelperText>

                <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            label="Password"
                            value={value}
                            onChangeText={onChange}
                            secureTextEntry
                            autoCapitalize="none"
                            mode="outlined"
                            error={!!errors.password}
                            style={styles.input}
                        />
                    )}
                />
                <HelperText type="error" visible={!!errors.password}>
                    {errors.password?.message}
                </HelperText>

                <Controller
                    control={control}
                    name="role"
                    render={({ field: { onChange, value } }) => (
                        <Menu
                            visible={roleMenuVisible}
                            onDismiss={() => setRoleMenuVisible(false)}
                            anchor={
                                <TextInput
                                    label="Role"
                                    value={roleLabel(value)}
                                    mode="outlined"
                                    editable={false}
                                    error={!!errors.role}
                                    style={styles.input}
                                    right={<TextInput.Icon icon="menu-down" onPress={() => setRoleMenuVisible(true)} />}
                                    onPressIn={() => setRoleMenuVisible(true)}
                                />
                            }
                        >
                            {ASSIGNABLE_ROLES.map((role) => (
                                <Menu.Item
                                    key={role}
                                    title={roleLabel(role)}
                                    onPress={() => {
                                        onChange(role);
                                        setRoleMenuVisible(false);
                                    }}
                                />
                            ))}
                        </Menu>
                    )}
                />
                <HelperText type="error" visible={!!errors.role}>
                    {errors.role?.message}
                </HelperText>

                <Button
                    mode="contained"
                    onPress={handleSubmit(onSubmit)}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                >
                    Create User
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
    },
    input: {
        marginBottom: 4,
    },
    button: {
        marginTop: 24,
    }
});
