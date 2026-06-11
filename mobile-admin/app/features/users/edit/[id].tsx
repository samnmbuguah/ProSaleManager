import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { ActivityIndicator, Appbar, Button, HelperText, Menu, TextInput } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ThemedView } from '@/components/themed-view';
import { userService } from '@/services/userService';
import { ASSIGNABLE_ROLES, AssignableRole } from '@/types/user';

const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    role: z.enum(ASSIGNABLE_ROLES),
});

type FormData = z.infer<typeof formSchema>;

const roleLabel = (role: string) => role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ');

export default function EditUserScreen() {
    const { id } = useLocalSearchParams();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [roleMenuVisible, setRoleMenuVisible] = useState(false);
    const [storeId, setStoreId] = useState<number | null>(null);

    const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        loadUser();
    }, [id]);

    const loadUser = async () => {
        try {
            const user = await userService.getById(Number(id));
            setStoreId(user.store_id ?? null);
            reset({
                name: user.name,
                email: user.email,
                role: (ASSIGNABLE_ROLES as readonly string[]).includes(user.role)
                    ? (user.role as AssignableRole)
                    : 'sales',
            });
        } catch (e) {
            Alert.alert('Error', 'Failed to load user');
            router.back();
        } finally {
            setInitialLoading(false);
        }
    };

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setLoading(true);
        try {
            await userService.update(Number(id), {
                name: data.name,
                email: data.email,
                role: data.role,
                // The API requires the store to be re-sent when changing roles
                store_id: storeId ?? undefined,
            });
            Alert.alert('Success', 'User updated successfully');
            router.back();
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || e.message || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return <ActivityIndicator style={styles.center} />;
    }

    return (
        <ThemedView style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Edit User" />
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
                    name="role"
                    render={({ field: { onChange, value } }) => (
                        <Menu
                            visible={roleMenuVisible}
                            onDismiss={() => setRoleMenuVisible(false)}
                            anchor={
                                <TextInput
                                    label="Role"
                                    value={value ? roleLabel(value) : ''}
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
                    Update User
                </Button>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
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
