import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, FlatList, RefreshControl, View } from 'react-native';
import { Searchbar, ActivityIndicator, Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { productService } from '@/services/productService';
import { favoritesService } from '@/services/favoritesService';
import { Product } from '@/types/product';
import { ProductCard } from '@/components/shop/ProductCard';
import { CartIcon } from '@/components/shop/CartIcon';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function ShopScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  const insets = useSafeAreaInsets();

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

  const loadFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    try {
      const favorites = await favoritesService.getFavorites();
      setFavoriteIds(new Set((favorites || []).map(p => p.id)));
    } catch (error) {
      console.error('Failed to load favorites', error);
    }
  }, [user]);

  useEffect(() => {
    loadProducts();
  }, []);

  // Refresh favorite state when returning to this tab (e.g. after removing in Favorites)
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  useEffect(() => {
    if (searchQuery) {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
    loadFavorites();
  };

  const onChangeSearch = (query: string) => setSearchQuery(query);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    setSnackbarMessage('Item added to cart');
    setSnackbarVisible(true);
  };

  const handleToggleFavorite = async (product: Product) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    const wasFavorite = favoriteIds.has(product.id);
    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (wasFavorite) {
        next.delete(product.id);
      } else {
        next.add(product.id);
      }
      return next;
    });
    try {
      await favoritesService.toggleFavorite(product.id);
      setSnackbarMessage(wasFavorite ? 'Removed from favorites' : 'Added to favorites');
      setSnackbarVisible(true);
    } catch (error) {
      console.error('Failed to toggle favorite', error);
      // Revert on failure
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (wasFavorite) {
          next.add(product.id);
        } else {
          next.delete(product.id);
        }
        return next;
      });
    }
  };

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
        <View style={styles.headerRow}>
          <View>
            <ThemedText type="title" style={{ fontSize: 28 }}>Shop</ThemedText>
            {user && <ThemedText type="default" style={{ opacity: 0.7 }}>Welcome back, {user.name}</ThemedText>}
          </View>
          <CartIcon />
        </View>
        <Searchbar
          placeholder="Search products..."
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={{ minHeight: 0 }}
        />
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => (
          <View style={styles.column}>
            <ProductCard
              product={item}
              onAddToCart={() => handleAddToCart(item)}
              isFavorite={favoriteIds.has(item.id)}
              onToggleFavorite={() => handleToggleFavorite(item)}
            />
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText>No products found</ThemedText>
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
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    height: 48,
  },
  listContent: {
    padding: 8,
    paddingBottom: 20,
  },
  column: {
    flex: 1 / 2,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 40,
  }
});
