import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, ScrollView, RefreshControl, View } from 'react-native';
import { ActivityIndicator, Appbar, Button, Card, Chip, Divider, MD3Theme, Text, useTheme } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { orderService } from '@/services/orderService';
import { Sale } from '@/types/sale';
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

export default function OrderDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [order, setOrder] = useState<Sale | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const theme = useTheme();

    const loadOrder = useCallback(async () => {
        try {
            const data = await orderService.getOrder(Number(id));
            setOrder(data);
            setError(null);
        } catch (e: any) {
            console.error('Failed to load order', e);
            setError(e.response?.data?.message || 'Failed to load order');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    const onRefresh = () => {
        setRefreshing(true);
        loadOrder();
    };

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <Appbar.Header>
                    <Appbar.BackAction onPress={() => router.back()} />
                    <Appbar.Content title={`Order #${id}`} />
                </Appbar.Header>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" />
                </View>
            </ThemedView>
        );
    }

    if (error || !order) {
        return (
            <ThemedView style={styles.container}>
                <Appbar.Header>
                    <Appbar.BackAction onPress={() => router.back()} />
                    <Appbar.Content title={`Order #${id}`} />
                </Appbar.Header>
                <View style={styles.centerContainer}>
                    <ThemedText type="subtitle">{error || 'Order not found'}</ThemedText>
                    <Button mode="contained" style={{ marginTop: 16 }} onPress={loadOrder}>
                        Retry
                    </Button>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title={`Order #${order.id}`} />
            </Appbar.Header>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <Card style={styles.card}>
                    <Card.Content>
                        <View style={styles.row}>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                Placed on
                            </Text>
                            <Text variant="bodyMedium">
                                {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                        <View style={[styles.row, { marginTop: 8 }]}>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                Status
                            </Text>
                            <Chip
                                textStyle={{ color: 'white', fontSize: 12 }}
                                style={{ backgroundColor: getStatusColor(order.status, theme) }}
                            >
                                {order.status}
                            </Chip>
                        </View>
                        <View style={[styles.row, { marginTop: 8 }]}>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                                Payment
                            </Text>
                            <Text variant="bodyMedium">{order.payment_status}</Text>
                        </View>
                    </Card.Content>
                </Card>

                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={{ marginBottom: 8 }}>
                            Items ({order.items?.length ?? 0})
                        </Text>
                        {(order.items || []).map((item, index) => (
                            <View key={item.id}>
                                {index > 0 && <Divider style={styles.itemDivider} />}
                                <View style={styles.itemRow}>
                                    <View style={styles.itemInfo}>
                                        <Text variant="bodyLarge" numberOfLines={1}>
                                            {item.Product?.name || `Product #${item.product_id}`}
                                        </Text>
                                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                            {item.quantity} x {formatCurrency(item.unit_price)} / {item.unit_type}
                                        </Text>
                                    </View>
                                    <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>
                                        {formatCurrency(item.total)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                        <Divider style={styles.totalDivider} />
                        {Number(order.delivery_fee) > 0 && (
                            <View style={styles.row}>
                                <Text variant="bodyMedium">Delivery fee</Text>
                                <Text variant="bodyMedium">{formatCurrency(order.delivery_fee)}</Text>
                            </View>
                        )}
                        <View style={styles.row}>
                            <Text variant="titleMedium">Total</Text>
                            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                                {formatCurrency(order.total_amount)}
                            </Text>
                        </View>
                    </Card.Content>
                </Card>
            </ScrollView>
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
    content: {
        padding: 16,
        paddingBottom: 32,
    },
    card: {
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    itemInfo: {
        flex: 1,
        marginRight: 12,
    },
    itemDivider: {
        marginVertical: 2,
    },
    totalDivider: {
        marginVertical: 12,
    },
});
