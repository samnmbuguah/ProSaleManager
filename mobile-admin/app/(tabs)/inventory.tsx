import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, View, RefreshControl } from 'react-native';
import { Appbar, List, FAB, Searchbar, ActivityIndicator, IconButton, Menu, Divider, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { productService } from '@/services/productService';
import { Product } from '@/types/product';
import { useAuth } from '@/context/AuthContext';

export default function InventoryScreen() {
    const theme = useTheme();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const { user } = useAuth();

    const loadProducts = async () => {
        try {
            const data = await productService.getAll();
            setProducts(data);
            setFilteredProducts(data);
        } catch (error) {
            console.error('Failed to load products', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const filtered = products.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(products);
        }
    }, [searchQuery, products]);

    const onRefresh = () => {
        setRefreshing(true);
        loadProducts();
    };

    const onChangeSearch = (query: string) => setSearchQuery(query);

    const handleDelete = async (id: number) => {
        try {
            await productService.delete(id);
            onRefresh();
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return <ActivityIndicator style={styles.center} />;
    }

    return (
        <ThemedView style={styles.container}>
            <Appbar.Header>
                <Appbar.Content title="Inventory" />
            </Appbar.Header>

            <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
                <Searchbar
                    placeholder="Search inventory..."
                    onChangeText={onChangeSearch}
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
                        description={`Stock: ${item.quantity} ${item.stock_unit} | SKU: ${item.sku}`}
                        left={(props) => <List.Icon {...props} icon="package-variant" />}
                        right={(props) => (
                            <View style={{ flexDirection: 'row' }}>
                                <IconButton {...props} icon="pencil" onPress={() => router.push({ pathname: '/features/inventory/edit/[id]', params: { id: item.id } })} />
                                <IconButton {...props} icon="delete" iconColor={theme.colors.error} onPress={() => handleDelete(item.id)} />
                            </View>
                        )}
                        onPress={() => router.push({ pathname: '/features/inventory/edit/[id]', params: { id: item.id } })}
                        style={{ backgroundColor: theme.colors.surface }}
                    />
                )}
                ItemSeparatorComponent={() => <Divider />}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => router.push('/features/inventory/add')}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center'
    },
    searchContainer: {
        padding: 16,
    },
    searchBar: {
        elevation: 0,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
});
