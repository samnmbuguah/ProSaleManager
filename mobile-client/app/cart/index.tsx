import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Appbar, Button, Card, Text, IconButton, Divider, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';

export default function CartScreen() {
    const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const theme = useTheme();

    const styles = StyleSheet.create({
        container: {
            flex: 1,
        },
        list: {
            padding: 16,
            paddingBottom: 100,
        },
        card: {
            marginBottom: 12,
        },
        cardContent: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
        },
        itemInfo: {
            flex: 1,
        },
        totalInfo: {
            alignItems: 'flex-end',
        },
        price: {
            fontWeight: 'bold',
            color: theme.colors.primary,
        },
        actions: {
            justifyContent: 'space-between',
            paddingHorizontal: 0,
        },
        quantityControls: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        quantity: {
            marginHorizontal: 8,
            fontWeight: 'bold',
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        button: {
            marginTop: 20,
        },
        footer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.colors.elevation.level2,
            padding: 20,
            elevation: 8,
            borderTopWidth: 1,
            borderTopColor: theme.colors.outlineVariant,
        },
        totalRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
        },
        totalAmount: {
            fontWeight: 'bold',
            color: theme.colors.primary,
        },
        checkoutButton: {
            borderRadius: 8,
        }
    });

    const handleCheckout = async () => {
        if (!user) {
            router.push('/auth/login');
            return;
        }

        if (cart.items.length === 0) return;

        setLoading(true);
        try {
            const orderData = {
                items: cart.items.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    unit_type: item.unit_type,
                    unit_price: item.unit_price
                }))
            };

            await api.post('/orders', orderData);
            Alert.alert('Success', 'Order placed successfully!');
            clearCart();
            router.replace('/(tabs)/orders');
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    if (cart.items.length === 0) {
        return (
            <ThemedView style={styles.container}>
                <Appbar.Header>
                    <Appbar.BackAction onPress={() => router.back()} />
                    <Appbar.Content title="Shopping Cart" />
                </Appbar.Header>
                <View style={styles.emptyContainer}>
                    <Text variant="titleMedium">Your cart is empty</Text>
                    <Button mode="contained" onPress={() => router.back()} style={styles.button}>
                        Start Shopping
                    </Button>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Shopping Cart" />
                <Appbar.Action icon="delete" onPress={() => {
                    Alert.alert('Clear Cart', 'Are you sure?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Clear', style: 'destructive', onPress: clearCart }
                    ]);
                }} />
            </Appbar.Header>

            <FlatList
                data={cart.items}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <Card style={styles.card}>
                        <Card.Content style={styles.cardContent}>
                            <View style={styles.itemInfo}>
                                <Text variant="titleMedium">{item.product.name}</Text>
                                <Text variant="bodyMedium">${item.unit_price.toFixed(2)} / {item.unit_type}</Text>
                            </View>
                            <View style={styles.totalInfo}>
                                <Text variant="titleLarge" style={styles.price}>${item.total.toFixed(2)}</Text>
                            </View>
                        </Card.Content>
                        <Divider />
                        <Card.Actions style={styles.actions}>
                            <View style={styles.quantityControls}>
                                <IconButton icon="minus" size={20} onPress={() => updateQuantity(item.id, item.quantity - 1)} />
                                <Text variant="bodyLarge" style={styles.quantity}>{item.quantity}</Text>
                                <IconButton icon="plus" size={20} onPress={() => updateQuantity(item.id, item.quantity + 1)} />
                            </View>
                            <IconButton icon="delete-outline" iconColor="red" onPress={() => removeFromCart(item.id)} />
                        </Card.Actions>
                    </Card>
                )}
                contentContainerStyle={styles.list}
            />

            <View style={styles.footer}>
                <View style={styles.totalRow}>
                    <Text variant="titleLarge">Total:</Text>
                    <Text variant="headlineMedium" style={styles.totalAmount}>${cart.total.toFixed(2)}</Text>
                </View>
                <Button
                    mode="contained"
                    onPress={handleCheckout}
                    loading={loading}
                    disabled={loading}
                    style={styles.checkoutButton}
                    labelStyle={{ fontSize: 18, padding: 4 }}
                >
                    Checkout
                </Button>
            </View>
        </ThemedView>
    );
}


