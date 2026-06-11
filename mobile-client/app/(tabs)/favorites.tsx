import React, { useCallback, useState } from 'react';
import { StyleSheet, FlatList, RefreshControl, View, Image } from 'react-native';
import { ActivityIndicator, Button, Card, IconButton, Snackbar, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { favoritesService } from '@/services/favoritesService';
import { Product } from '@/types/product';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function FavoritesScreen() {
    const [favorites, setFavorites] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const { user } = useAuth();
    const { addToCart } = useCart();
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const loadFavorites = useCallback(async () => {
        if (!user) {
            setFavorites([]);
            setLoading(false);
            setRefreshing(false);
            return;
        }
        try {
            const data = await favoritesService.getFavorites();
            setFavorites(data || []);
        } catch (error) {
            console.error('Failed to load favorites', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            loadFavorites();
        }, [loadFavorites])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadFavorites();
    };

    const handleRemove = async (product: Product) => {
        // Optimistic removal
        setFavorites(prev => prev.filter(p => p.id !== product.id));
        try {
            await favoritesService.removeFavorite(product.id);
            setSnackbarMessage('Removed from favorites');
            setSnackbarVisible(true);
        } catch (error) {
            console.error('Failed to remove favorite', error);
            // Revert on failure
            setFavorites(prev => [product, ...prev]);
        }
    };

    const handleAddToCart = (product: Product) => {
        addToCart(product, 1);
        setSnackbarMessage('Item added to cart');
        setSnackbarVisible(true);
    };

    if (!user) {
        return (
            <ThemedView style={styles.container}>
                <View style={styles.centerContainer}>
                    <IconSymbol name="heart.fill" size={64} color={theme.colors.outline} />
                    <ThemedText type="title" style={{ marginTop: 16 }}>Favorites</ThemedText>
                    <ThemedText style={styles.emptyText}>
                        Log in to see your favorite products.
                    </ThemedText>
                    <Button mode="contained" onPress={() => router.push('/auth/login')}>
                        Login / Register
                    </Button>
                </View>
            </ThemedView>
        );
    }

    if (loading) {
        return (
            <ThemedView style={styles.centerContainer}>
                <ActivityIndicator size="large" />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <ThemedText type="title" style={{ fontSize: 28 }}>Favorites</ThemedText>
            </View>

            <FlatList
                data={favorites}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <Card style={styles.card}>
                        <View style={styles.cardRow}>
                            <Image
                                source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
                                style={styles.image}
                            />
                            <View style={styles.itemInfo}>
                                <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.name}</ThemedText>
                                {!!item.description && (
                                    <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
                                        {item.description}
                                    </Text>
                                )}
                                <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold', marginTop: 4 }}>
                                    ${(Number(item.piece_selling_price) || 0).toFixed(2)}
                                </Text>
                            </View>
                            <View style={styles.itemActions}>
                                <IconButton
                                    icon="heart"
                                    iconColor={theme.colors.error}
                                    size={22}
                                    onPress={() => handleRemove(item)}
                                    accessibilityLabel="Remove from favorites"
                                />
                                <IconButton
                                    icon="cart-plus"
                                    iconColor={theme.colors.primary}
                                    size={22}
                                    disabled={item.quantity <= 0}
                                    onPress={() => handleAddToCart(item)}
                                    accessibilityLabel="Add to cart"
                                />
                            </View>
                        </View>
                    </Card>
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <IconSymbol name="heart.fill" size={64} color={theme.colors.outline} />
                        <ThemedText type="subtitle" style={{ marginTop: 16 }}>No favorites yet</ThemedText>
                        <ThemedText style={styles.emptyText}>
                            Tap the heart on a product to save it here.
                        </ThemedText>
                        <Button mode="contained" onPress={() => router.push('/(tabs)')}>
                            Browse Shop
                        </Button>
                    </View>
                }
            />
            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={2000}
                style={{ marginBottom: 20 }}
                action={snackbarMessage === 'Item added to cart' ? {
                    label: 'View Cart',
                    onPress: () => {
                        router.push('/cart');
                    },
                } : undefined}>
                {snackbarMessage}
            </Snackbar>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    listContent: {
        padding: 16,
        paddingTop: 0,
        paddingBottom: 20,
        flexGrow: 1,
    },
    card: {
        marginBottom: 12,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    image: {
        width: 64,
        height: 64,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    itemInfo: {
        flex: 1,
        marginLeft: 12,
    },
    itemActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
        opacity: 0.7,
    },
});
