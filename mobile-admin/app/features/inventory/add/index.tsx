import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Alert } from 'react-native';
import { Appbar, TextInput, Button, HelperText, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ThemedView } from '@/components/themed-view';
import { productService } from '@/services/productService';
import { ProductInsert, STOCK_UNITS } from '@/types/product';

// Schema for form validation - keep as strings for input handling
const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    sku: z.string().min(1, 'SKU is required'),
    barcode: z.string().optional(),
    quantity: z.string().min(1, 'Required'),
    min_quantity: z.string().min(1, 'Required'),
    piece_buying_price: z.string().min(1, 'Required'),
    piece_selling_price: z.string().min(1, 'Required'),
    stock_unit: z.enum(STOCK_UNITS),
});

type FormData = z.infer<typeof formSchema>;

export default function AddProductScreen() {
    const [loading, setLoading] = useState(false);

    const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
            sku: '',
            barcode: '',
            quantity: '0',
            min_quantity: '0',
            piece_buying_price: '0',
            piece_selling_price: '0',
            stock_unit: 'piece',
        }
    });

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setLoading(true);
        try {
            // Construct payload with required number fields and defaults for others
            const payload: ProductInsert = {
                name: data.name,
                sku: data.sku,
                stock_unit: data.stock_unit,
                description: data.description || '',
                barcode: data.barcode || '',
                quantity: Number(data.quantity) || 0,
                min_quantity: Number(data.min_quantity) || 0,
                piece_buying_price: Number(data.piece_buying_price) || 0,
                piece_selling_price: Number(data.piece_selling_price) || 0,

                category_id: 1, // Default Category for now
                pack_buying_price: 0,
                pack_selling_price: 0,
                dozen_buying_price: 0,
                dozen_selling_price: 0,
                image_url: '',
                images: [],
                is_active: true,
            };

            await productService.create(payload);
            Alert.alert('Success', 'Product created successfully');
            router.back();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Add Product" />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.content}>
                <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            label="Product Name"
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
                    name="sku"
                    render={({ field: { onChange, value } }) => (
                        <TextInput
                            label="SKU"
                            value={value}
                            onChangeText={onChange}
                            mode="outlined"
                            error={!!errors.sku}
                            style={styles.input}
                        />
                    )}
                />
                <HelperText type="error" visible={!!errors.sku}>
                    {errors.sku?.message}
                </HelperText>

                <View style={styles.row}>
                    <View style={styles.col}>
                        <Controller
                            control={control}
                            name="piece_buying_price"
                            render={({ field: { onChange, value } }) => (
                                <TextInput
                                    label="Buy Price"
                                    value={String(value)}
                                    onChangeText={onChange}
                                    keyboardType="numeric"
                                    mode="outlined"
                                    style={styles.input}
                                />
                            )}
                        />
                    </View>
                    <View style={styles.col}>
                        <Controller
                            control={control}
                            name="piece_selling_price"
                            render={({ field: { onChange, value } }) => (
                                <TextInput
                                    label="Sell Price"
                                    value={String(value)}
                                    onChangeText={onChange}
                                    keyboardType="numeric"
                                    mode="outlined"
                                    style={styles.input}
                                />
                            )}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.col}>
                        <Controller
                            control={control}
                            name="quantity"
                            render={({ field: { onChange, value } }) => (
                                <TextInput
                                    label="Stock Qty"
                                    value={String(value)}
                                    onChangeText={onChange}
                                    keyboardType="numeric"
                                    mode="outlined"
                                    style={styles.input}
                                />
                            )}
                        />
                    </View>
                    <View style={styles.col}>
                        <Controller
                            control={control}
                            name="min_quantity"
                            render={({ field: { onChange, value } }) => (
                                <TextInput
                                    label="Min Qty"
                                    value={String(value)}
                                    onChangeText={onChange}
                                    keyboardType="numeric"
                                    mode="outlined"
                                    style={styles.input}
                                />
                            )}
                        />
                    </View>
                </View>

                <Button
                    mode="contained"
                    onPress={handleSubmit(onSubmit)}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                >
                    Create Product
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
    row: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    col: {
        flex: 1,
    },
    button: {
        marginTop: 24,
    }
});
