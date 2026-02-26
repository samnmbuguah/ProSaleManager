import { StyleSheet, ScrollView, View, RefreshControl } from 'react-native';
import { Card, Text, ActivityIndicator, useTheme, Button } from 'react-native-paper';
import { useCallback, useState } from 'react';
import { ThemedView } from '@/components/themed-view';
import { dashboardService } from '@/services/dashboardService';
import { DashboardData } from '@/types/dashboard';
import { useFocusEffect } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return; // Don't fetch if not logged in

    // Only set loading false if we are not refreshing (so we don't hide the existing data while pulling)
    // But if we have no data, we want to show loading spinner.
    if (!data && !refreshing) setLoading(true);
    setError(null);

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const result = await dashboardService.getDashboardData(startDate, endDate);
      setData(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [user]);

  if (loading && !refreshing && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.center}>
        <IconSymbol name="exclamationmark.triangle.fill" size={48} color={theme.colors.error} />
        <Text variant="titleMedium" style={{ marginTop: 16, textAlign: 'center', marginHorizontal: 32 }}>
          {error}
        </Text>
        <Button mode="contained" onPress={loadData} style={{ marginTop: 16 }}>
          Retry
        </Button>
      </View>
    );
  }

  const StatCard = ({ title, value, icon, color, subtitle }: { title: string, value: string, icon: string, color: string, subtitle?: string }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <IconSymbol name={icon as any} size={24} color={color} />
          </View>
          <Text variant="titleMedium" style={{ color: theme.colors.outline }}>{title}</Text>
        </View>
        <Text variant="headlineMedium" style={styles.value}>{value}</Text>
        {subtitle && <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>{subtitle}</Text>}
      </Card.Content>
    </Card>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Dashboard</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>Last 30 Days Overview</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statsGrid}>
          <View style={styles.col}>
            <StatCard
              title="Revenue"
              value={`$${data?.metrics.totalRevenue.toLocaleString() ?? '0'}`}
              icon="circle.dollar"
              color="#4CAF50"
            />
          </View>
          <View style={styles.col}>
            <StatCard
              title="Profit"
              value={`$${data?.metrics.totalProfit.toLocaleString() ?? '0'}`}
              icon="chart.bar.fill"
              color="#2196F3"
            />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.col}>
            <StatCard
              title="Sales"
              value={data?.metrics.totalSales.toLocaleString() ?? '0'}
              icon="cart.fill"
              color="#FF9800"
            />
          </View>
          <View style={styles.col}>
            <StatCard
              title="Avg Order"
              value={`$${data?.metrics.averageOrderValue.toFixed(2) ?? '0'}`}
              icon="creditcard.fill"
              color="#9C27B0"
            />
          </View>
        </View>

        <Text variant="titleLarge" style={styles.sectionTitle}>Inventory Health</Text>
        <View style={styles.statsGrid}>
          <View style={styles.col}>
            <StatCard
              title="Low Stock"
              value={data?.metrics.lowStockProducts.toString() ?? '0'}
              icon="exclamationmark.triangle.fill"
              color="#FF5722"
              subtitle="Products needing restock"
            />
          </View>
          <View style={styles.col}>
            <StatCard
              title="Out of Stock"
              value={data?.metrics.outOfStockProducts.toString() ?? '0'}
              icon="xmark.circle.fill"
              color="#F44336"
              subtitle="Products unavailable"
            />
          </View>
        </View>

        <Text variant="titleLarge" style={styles.sectionTitle}>Top Selling Products</Text>
        {data?.topProducts.map((product, index) => (
          <Card key={product.productId} style={styles.listCard}>
            <Card.Content style={styles.listRow}>
              <View style={styles.rankContainer}>
                <Text style={styles.rank}>#{index + 1}</Text>
              </View>
              <View style={styles.productInfo}>
                <Text variant="titleMedium">{product.productName}</Text>
                <Text variant="bodySmall">{product.quantity} units sold</Text>
              </View>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                ${product.revenue.toLocaleString()}
              </Text>
            </Card.Content>
          </Card>
        ))}
        <View style={{ height: 20 }} />
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
    alignItems: 'center',
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: 'white',
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  col: {
    flex: 1,
  },
  card: {
    elevation: 2,
    backgroundColor: 'white',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 8,
  },
  value: {
    fontWeight: 'bold',
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  listCard: {
    marginBottom: 8,
    backgroundColor: 'white',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rank: {
    fontWeight: 'bold',
  },
  productInfo: {
    flex: 1,
  },
});
