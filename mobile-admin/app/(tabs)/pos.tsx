import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, Alert } from 'react-native';
import { Appbar, Searchbar, List, FAB, Button, Text, Divider, IconButton, ActivityIndicator, useTheme } from 'react-native-paper';
import { ThemedView } from '@/components/themed-view';
import { productService } from '@/services/productService';
import { Product } from '@/types/product';
import { usePOSCart } from '@/context/POSContext';
import { api } from '@/services/api';

export default function POSScreen() {
    const theme = useTheme();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCart, setShowCart] = useState(false);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

    const { cart, addToCart, removeFromCart, updateQuantity, clearCart } = usePOSCart();
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await productService.getAll();
            setProducts(data);
            setFilteredProducts(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchQuery) {
            const filtered = products.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(products);
        }
    }, [searchQuery, products]);

    const handleCheckout = async () => {
        if (cart.items.length === 0) return;

        setCheckoutLoading(true);
        try {
            const orderData = {
                items: cart.items.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    unit_type: item.unit_type,
                    unit_price: item.unit_price
                })),
                status: 'completed', // Admin POS orders are immediately completed
                payment_method: 'cash' // Default for now
            };

            const response = await api.post('/sales', orderData);
            Alert.alert('Success', 'Sale completed successfully');
            clearCart();
            setShowCart(false);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to complete sale');
        } finally {
            setCheckoutLoading(false);
        }
    };

    if (loading) {
        return <ActivityIndicator style={styles.center} />;
    }

    if (showCart) {
        return (
            <ThemedView style={styles.container}>
                <Appbar.Header>
                    <Appbar.BackAction onPress={() => setShowCart(false)} />
                    <Appbar.Content title="Current Sale" />
                    <Appbar.Action icon="delete" onPress={clearCart} />
                </Appbar.Header>

                <FlatList
                    data={cart.items}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <List.Item
                            title={item.product.name}
                            description={`$${item.unit_price} x ${item.quantity} ${item.unit_type}`}
                            left={props => <List.Icon {...props} icon="package-variant" />}
                            right={() => (
                                <View style={styles.cartActions}>
                                    <IconButton icon="minus" size={20} onPress={() => updateQuantity(item.id, item.quantity - 1)} />
                                    <Text>{item.quantity}</Text>
                                    <IconButton icon="plus" size={20} onPress={() => updateQuantity(item.id, item.quantity + 1)} />
                                </View>
                            )}
                            style={{ backgroundColor: theme.colors.surface }}
                        />
                    )}
                    ItemSeparatorComponent={() => <Divider />}
                />

                <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
                    <View style={styles.totalRow}>
                        <Text variant="titleLarge">Total:</Text>
                        <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                            ${cart.total.toFixed(2)}
                        </Text>
                    </View>
                    <Button
                        mode="contained"
                        onPress={handleCheckout}
                        loading={checkoutLoading}
                        disabled={checkoutLoading || cart.items.length === 0}
                        style={styles.checkoutBtn}
                    >
                        Complete Sale
                    </Button>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Appbar.Header>
                <Appbar.Content title="Point of Sale" />
                <Appbar.Action icon="cart" onPress={() => setShowCart(true)} />
                {cart.items.length > 0 && <Appbar.Content title={`$${cart.total.toFixed(2)}`} style={styles.totalHeader} titleStyle={{ fontSize: 16, fontWeight: 'bold' }} />}
            </Appbar.Header>

            <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
                <Searchbar
                    placeholder="Search products..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
                />
            </View>

            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <List.Item
                        title={item.name}
                        description={`Stock: ${item.quantity} | $${item.piece_selling_price}`}
                        left={(props) => <List.Icon {...props} icon="tag" />}
                        right={(props) => <IconButton {...props} icon="plus-circle" onPress={() => addToCart(item)} />}
                        onPress={() => addToCart(item)}
                        style={{ backgroundColor: theme.colors.surface }}
                    />
                )}
                ItemSeparatorComponent={() => <Divider />}
            />

            {cart.items.length > 0 && (
                <FAB
                    label={`View Cart (${cart.items.length})`}
                    icon="cart"
                    style={styles.fab}
                    onPress={() => setShowCart(true)}
                    color={theme.colors.onPrimaryContainer}
                    theme={{ colors: { accent: theme.colors.primaryContainer } }}
                />
            )}
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
    searchContainer: {
        padding: 16,
    },
    searchBar: {
        elevation: 0,
    },
    cartActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    checkoutBtn: {
        padding: 4,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    totalHeader: {
        alignItems: 'flex-end',
        marginRight: 10,
    }
});
