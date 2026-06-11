import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Appbar, Button, HelperText, Menu, TextInput } from 'react-native-paper';
import { router } from 'expo-router';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ThemedView } from '@/components/themed-view';
import { expenseService } from '@/services/expenseService';
import { EXPENSE_CATEGORIES, EXPENSE_PAYMENT_METHODS } from '@/types/expense';

// Keep numeric values as strings for input handling (same as product forms)
const formSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    amount: z
        .string()
        .min(1, 'Amount is required')
        .refine((value) => Number(value) > 0, 'Amount must be greater than 0'),
    category: z.enum(EXPENSE_CATEGORIES),
    payment_method: z.enum(EXPENSE_PAYMENT_METHODS),
});

type FormData = z.infer<typeof formSchema>;

export default function AddExpenseScreen() {
    const [loading, setLoading] = useState(false);
    const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
    const [paymentMenuVisible, setPaymentMenuVisible] = useState(false);

    const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: '',
            amount: '',
            category: 'Other',
            payment_method: 'Cash',
        }
    });

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setLoading(true);
        try {
            await expenseService.create({
                description: data.description,
                amount: Number(data.amount),
                category: data.category,
                payment_method: data.payment_method,
                date: new Date().toISOString(),
            });
            Alert.alert('Success', 'Expense recorded successfully');
            router.back();
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || e.message || 'Failed to record expense');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Add Expense" />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.content}>
                <Controller
                    control={control}
                    name="description"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            label="Description"
                            value={value}
                            onChangeText={onChange}
                            mode="outlined"
                            error={!!errors.description}
                            style={styles.input}
                        />
                    )}
                />
                <HelperText type="error" visible={!!errors.description}>
                    {errors.description?.message}
                </HelperText>

                <Controller
                    control={control}
                    name="amount"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            label="Amount"
                            value={value}
                            onChangeText={onChange}
                            keyboardType="numeric"
                            mode="outlined"
                            error={!!errors.amount}
                            style={styles.input}
                        />
                    )}
                />
                <HelperText type="error" visible={!!errors.amount}>
                    {errors.amount?.message}
                </HelperText>

                <Controller
                    control={control}
                    name="category"
                    render={({ field: { onChange, value } }) => (
                        <Menu
                            visible={categoryMenuVisible}
                            onDismiss={() => setCategoryMenuVisible(false)}
                            anchor={
                                <TextInput
                                    label="Category"
                                    value={value}
                                    mode="outlined"
                                    editable={false}
                                    error={!!errors.category}
                                    style={styles.input}
                                    right={<TextInput.Icon icon="menu-down" onPress={() => setCategoryMenuVisible(true)} />}
                                    onPressIn={() => setCategoryMenuVisible(true)}
                                />
                            }
                        >
                            {EXPENSE_CATEGORIES.map((category) => (
                                <Menu.Item
                                    key={category}
                                    title={category}
                                    onPress={() => {
                                        onChange(category);
                                        setCategoryMenuVisible(false);
                                    }}
                                />
                            ))}
                        </Menu>
                    )}
                />
                <HelperText type="error" visible={!!errors.category}>
                    {errors.category?.message}
                </HelperText>

                <Controller
                    control={control}
                    name="payment_method"
                    render={({ field: { onChange, value } }) => (
                        <Menu
                            visible={paymentMenuVisible}
                            onDismiss={() => setPaymentMenuVisible(false)}
                            anchor={
                                <TextInput
                                    label="Payment Method"
                                    value={value}
                                    mode="outlined"
                                    editable={false}
                                    error={!!errors.payment_method}
                                    style={styles.input}
                                    right={<TextInput.Icon icon="menu-down" onPress={() => setPaymentMenuVisible(true)} />}
                                    onPressIn={() => setPaymentMenuVisible(true)}
                                />
                            }
                        >
                            {EXPENSE_PAYMENT_METHODS.map((method) => (
                                <Menu.Item
                                    key={method}
                                    title={method}
                                    onPress={() => {
                                        onChange(method);
                                        setPaymentMenuVisible(false);
                                    }}
                                />
                            ))}
                        </Menu>
                    )}
                />
                <HelperText type="error" visible={!!errors.payment_method}>
                    {errors.payment_method?.message}
                </HelperText>

                <Button
                    mode="contained"
                    onPress={handleSubmit(onSubmit)}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                >
                    Save Expense
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
