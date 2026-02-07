import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Alert } from 'react-native';
import { Appbar, TextInput, Button, HelperText, ActivityIndicator } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ThemedView } from '@/components/themed-view';
import { productService } from '@/services/productService';
import { ProductUpdate, STOCK_UNITS } from '@/types/product';

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

export default function EditProductScreen() {
    const { id } = useLocalSearchParams();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        loadProduct();
    }, [id]);

    const loadProduct = async () => {
        try {
            const product = await productService.getById(Number(id));
            reset({
                name: product.name,
                description: product.description || '',
                sku: product.sku,
                barcode: product.barcode || '',
                quantity: String(product.quantity),
                min_quantity: String(product.min_quantity),
                piece_buying_price: String(product.piece_buying_price),
                piece_selling_price: String(product.piece_selling_price),
                stock_unit: product.stock_unit,
            });
        } catch (e) {
            Alert.alert('Error', 'Failed to load product');
            router.back();
        } finally {
            setInitialLoading(false);
        }
    };

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setLoading(true);
        try {
            const payload: ProductUpdate = {
                name: data.name,
                sku: data.sku,
                stock_unit: data.stock_unit,
                description: data.description || '',
                barcode: data.barcode || '',
                quantity: Number(data.quantity) || 0,
                min_quantity: Number(data.min_quantity) || 0,
                piece_buying_price: Number(data.piece_buying_price) || 0,
                piece_selling_price: Number(data.piece_selling_price) || 0,
            };
            await productService.update(Number(id), payload);
            Alert.alert('Success', 'Product updated successfully');
            router.back();
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to update product');
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
                <Appbar.Content title="Edit Product" />
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
                    Update Product
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
