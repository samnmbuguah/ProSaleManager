import { StyleSheet, FlatList, View, Image } from 'react-native';
import { Text, ActivityIndicator, useTheme, Button, Card, IconButton } from 'react-native-paper';
import { useCallback, useState } from 'react';
import { ThemedView } from '@/components/themed-view';
import { useFocusEffect } from 'expo-router';
import { favoritesService } from '@/services/favoritesService';
import { Product } from '@/types/product';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function FavoritesScreen() {
    const theme = useTheme();
    const [favorites, setFavorites] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadFavorites = async () => {
        try {
            const data = await favoritesService.getFavorites();
            setFavorites(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadFavorites();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadFavorites();
    }, []);

    const handleToggleFavorite = async (id: number) => {
        try {
            await favoritesService.toggleFavorite(id);
            loadFavorites(); // Reload list
        } catch (error) {
            console.error(error);
        }
    };

    const renderItem = ({ item }: { item: Product }) => (
        <Card style={styles.card} onPress={() => router.push(`/features/shop/product/${item.id}`)}>
            <Card.Cover source={{ uri: item.image_url || 'https://via.placeholder.com/150' }} />
            <Card.Content>
                <Text variant="titleMedium" numberOfLines={1}>{item.name}</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                    ${item.piece_selling_price?.toFixed(2) ?? '0.00'}
                </Text>
            </Card.Content>
            <Card.Actions style={styles.cardActions}>
                <IconButton
                    icon="heart"
                    iconColor={theme.colors.error}
                    onPress={() => handleToggleFavorite(item.id)}
                />
                <Button mode="contained" onPress={() => router.push(`/features/shop/product/${item.id}`)}>
                    View
                </Button>
            </Card.Actions>
        </Card>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <ThemedView style={styles.container}>
            {favorites.length === 0 ? (
                <View style={styles.emptyState}>
                    <IconSymbol name="heart.fill" size={64} color={theme.colors.secondary + '40'} />
                    <Text variant="headlineSmall" style={{ marginTop: 16 }}>No Favorites</Text>
                    <Text variant="bodyMedium" style={{ marginTop: 8, color: theme.colors.secondary }}>
                        Items you favorite will appear here.
                    </Text>
                    <Button mode="contained" style={{ marginTop: 24 }} onPress={() => router.push('/(tabs)/shop')}>
                        Browse Shop
                    </Button>
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
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
        alignItems: 'center',
    },
    list: {
        padding: 16,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        marginBottom: 16,
    },
    cardActions: {
        justifyContent: 'space-between',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
});
