import React, { useCallback, useState } from 'react';
import { StyleSheet, FlatList, RefreshControl, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, MD3Theme, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { orderService } from '@/services/orderService';
import { Sale } from '@/types/sale';
import { useAuth } from '@/context/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatCurrency } from '@/utils/currency';

const getStatusColor = (status: string, theme: MD3Theme) => {
    switch (status?.toLowerCase()) {
        case 'completed':
        case 'fulfilled':
            return '#4CAF50';
        case 'pending':
        case 'unprocessed':
            return '#FF9800';
        case 'cancelled':
        case 'rejected':
            return theme.colors.error;
        default:
            return theme.colors.secondary;
    }
};

export default function OrdersScreen() {
    const [orders, setOrders] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const loadOrders = useCallback(async () => {
        if (!user) {
            setOrders([]);
            setLoading(false);
            setRefreshing(false);
            return;
        }
        try {
            const data = await orderService.getOrders();
            setOrders(data.orders || []);
        } catch (error) {
            console.error('Failed to load orders', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            loadOrders();
        }, [loadOrders])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadOrders();
    };

    if (!user) {
        return (
            <ThemedView style={styles.container}>
                <View style={styles.centerContainer}>
                    <IconSymbol name="list.bullet.rectangle.portrait" size={64} color={theme.colors.outline} />
                    <ThemedText type="title" style={{ marginTop: 16 }}>Orders</ThemedText>
                    <ThemedText style={styles.emptyText}>
                        Log in to track your orders.
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
                <ThemedText type="title" style={{ fontSize: 28 }}>Orders</ThemedText>
            </View>

            <FlatList
                data={orders}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <Card style={styles.card} onPress={() => router.push(`/order/${item.id}`)}>
                        <Card.Content>
                            <View style={styles.row}>
                                <Text variant="titleMedium">Order #{item.id}</Text>
                                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                                    {formatCurrency(item.total_amount)}
                                </Text>
                            </View>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                                {new Date(item.createdAt).toLocaleDateString()} · {item.items?.length ?? 0} item{(item.items?.length ?? 0) === 1 ? '' : 's'}
                            </Text>
                            <View style={styles.chipRow}>
                                <Chip
                                    textStyle={{ color: 'white', fontSize: 12 }}
                                    style={{ backgroundColor: getStatusColor(item.status, theme) }}
                                >
                                    {item.status}
                                </Chip>
                            </View>
                        </Card.Content>
                    </Card>
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <IconSymbol name="list.bullet.rectangle.portrait" size={64} color={theme.colors.outline} />
                        <ThemedText type="subtitle" style={{ marginTop: 16 }}>No orders yet</ThemedText>
                        <ThemedText style={styles.emptyText}>
                            Your past and current orders will appear here.
                        </ThemedText>
                        <Button mode="contained" onPress={() => router.push('/(tabs)')}>
                            Start Shopping
                        </Button>
                    </View>
                }
            />
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
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chipRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
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
