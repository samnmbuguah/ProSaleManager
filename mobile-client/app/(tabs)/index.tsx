import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, RefreshControl, View } from 'react-native';
import { Searchbar, ActivityIndicator, Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { productService } from '@/services/productService';
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

  useEffect(() => {
    loadProducts();
  }, []);

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
  };

  const onChangeSearch = (query: string) => setSearchQuery(query);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    setSnackbarVisible(true);
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
        action={{
          label: 'View Cart',
          onPress: () => {
            router.push('/cart');
          },
        }}>
        Item added to cart
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
