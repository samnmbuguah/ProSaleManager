import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, Divider, Text, useTheme } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { saleService } from '@/services/saleService';
import { Sale } from '@/types/sale';
import { useAuth } from '@/context/AuthContext';

const PAGE_SIZE = 20;

const formatMoney = (value: number | string | null | undefined) =>
    `$${Number(value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (value: string) => {
    const date = new Date(value);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const formatLabel = (value: string) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ') : 'Unknown';

export default function SalesScreen() {
    const theme = useTheme();
    const { user } = useAuth();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const loadSales = async (isRefresh = false) => {
        if (!user) return;
        if (!isRefresh && sales.length === 0) setLoading(true);
        setError(null);

        try {
            const data = await saleService.getSales(1, PAGE_SIZE);
            setSales(data.sales);
            setPage(data.currentPage);
            setTotalPages(data.totalPages);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to load sales. Please check your connection.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadMore = async () => {
        if (loadingMore || loading || refreshing || page >= totalPages) return;
        setLoadingMore(true);
        try {
            const data = await saleService.getSales(page + 1, PAGE_SIZE);
            setSales((prev) => {
                const existing = new Set(prev.map((s) => s.id));
                return [...prev, ...data.sales.filter((s) => !existing.has(s.id))];
            });
            setPage(data.currentPage);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error('Failed to load more sales', err);
        } finally {
            setLoadingMore(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadSales();
        }, [user])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadSales(true);
    }, [user]);

    const statusColor = (status: string) => {
        switch (status) {
            case 'completed':
            case 'paid':
                return '#4CAF50';
            case 'pending':
                return '#FF9800';
            case 'cancelled':
                return theme.colors.error;
            default:
                return theme.colors.outline;
        }
    };

    if (loading && !refreshing && sales.length === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (error && sales.length === 0) {
        return (
            <View style={styles.center}>
                <IconSymbol name="exclamationmark.triangle.fill" size={48} color={theme.colors.error} />
                <Text variant="titleMedium" style={styles.errorText}>
                    {error}
                </Text>
                <Button mode="contained" onPress={() => loadSales()} style={{ marginTop: 16 }}>
                    Retry
                </Button>
            </View>
        );
    }

    const renderSale = ({ item }: { item: Sale }) => {
        const expanded = expandedId === item.id;
        return (
            <Card
                style={styles.card}
                onPress={() => setExpandedId(expanded ? null : item.id)}
            >
                <Card.Content>
                    <View style={styles.rowBetween}>
                        <View style={styles.saleInfo}>
                            <Text variant="titleMedium" style={styles.bold}>
                                Sale #{item.id}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                                {formatDate(item.createdAt)}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                                {item.Customer?.name ?? 'Walk-in customer'}
                            </Text>
                        </View>
                        <View style={styles.saleMeta}>
                            <Text variant="titleMedium" style={styles.bold}>
                                {formatMoney(item.total_amount)}
                            </Text>
                            <Chip
                                compact
                                textStyle={styles.chipText}
                                style={[styles.chip, { backgroundColor: statusColor(item.status) + '20' }]}
                            >
                                <Text style={{ color: statusColor(item.status), fontSize: 12 }}>
                                    {formatLabel(item.status)}
                                </Text>
                            </Chip>
                            <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                                {formatLabel(item.payment_method)}
                            </Text>
                        </View>
                    </View>

                    {expanded && (
                        <View style={styles.itemsContainer}>
                            <Divider style={{ marginBottom: 8 }} />
                            <Text variant="labelLarge" style={styles.itemsTitle}>
                                Items
                            </Text>
                            {(item.items ?? []).map((saleItem) => (
                                <View key={saleItem.id} style={styles.itemRow}>
                                    <View style={styles.itemInfo}>
                                        <Text variant="bodyMedium">
                                            {saleItem.Product?.name ?? `Product #${saleItem.product_id}`}
                                        </Text>
                                        <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                                            {saleItem.quantity} {saleItem.unit_type} x {formatMoney(saleItem.unit_price)}
                                        </Text>
                                    </View>
                                    <Text variant="bodyMedium" style={styles.bold}>
                                        {formatMoney(saleItem.total)}
                                    </Text>
                                </View>
                            ))}
                            {(item.items ?? []).length === 0 && (
                                <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                                    No items recorded for this sale.
                                </Text>
                            )}
                            {Number(item.delivery_fee) > 0 && (
                                <View style={styles.itemRow}>
                                    <Text variant="bodyMedium">Delivery fee</Text>
                                    <Text variant="bodyMedium" style={styles.bold}>
                                        {formatMoney(item.delivery_fee)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </Card.Content>
            </Card>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.bold}>Sales History</Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>
                    Tap a sale to view its items
                </Text>
            </View>

            <FlatList
                data={sales}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderSale}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                onEndReached={loadMore}
                onEndReachedThreshold={0.4}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <IconSymbol name="cart.fill" size={48} color={theme.colors.outline} />
                        <Text variant="titleMedium" style={{ marginTop: 12 }}>
                            No sales yet
                        </Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>
                            Completed sales will appear here.
                        </Text>
                    </View>
                }
                ListFooterComponent={
                    loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} /> : <View style={{ height: 20 }} />
                }
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        marginTop: 16,
        textAlign: 'center',
        marginHorizontal: 32,
    },
    header: {
        padding: 16,
        paddingTop: 60,
        backgroundColor: 'white',
        elevation: 2,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    content: {
        padding: 16,
        flexGrow: 1,
    },
    card: {
        marginBottom: 12,
        backgroundColor: 'white',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    saleInfo: {
        flex: 1,
        gap: 2,
    },
    saleMeta: {
        alignItems: 'flex-end',
        gap: 4,
    },
    bold: {
        fontWeight: 'bold',
    },
    chip: {
        height: 28,
    },
    chipText: {
        marginVertical: 0,
    },
    itemsContainer: {
        marginTop: 12,
    },
    itemsTitle: {
        marginBottom: 8,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemInfo: {
        flex: 1,
        marginRight: 12,
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    },
});
