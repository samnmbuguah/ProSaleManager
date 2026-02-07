import { StyleSheet, FlatList, View, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text, ActivityIndicator, useTheme, Card, Chip, SegmentedButtons } from 'react-native-paper';
import { useCallback, useState } from 'react';
import { ThemedView } from '@/components/themed-view';
import { useFocusEffect } from 'expo-router';
import { orderService } from '@/services/orderService';
import { Sale } from '@/types/sale';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

export default function OrdersScreen() {
    const theme = useTheme();
    const layout = useWindowDimensions();
    const [orders, setOrders] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'current', title: 'Current' },
        { key: 'past', title: 'Past' },
    ]);

    const loadOrders = async () => {
        try {
            const data = await orderService.getOrders();
            setOrders(data.orders || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadOrders();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadOrders();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'fulfilled':
                return '#4CAF50';
            case 'pending':
                return '#FF9800';
            case 'cancelled':
                return theme.colors.error;
            default:
                return theme.colors.secondary;
        }
    };

    const OrderList = ({ type }: { type: 'current' | 'past' }) => {
        const filteredOrders = orders.filter((order) => {
            const isPast = ['completed', 'fulfilled', 'cancelled'].includes(order.status.toLowerCase());
            return type === 'past' ? isPast : !isPast;
        });

        if (filteredOrders.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Text variant="bodyLarge" style={{ color: theme.colors.secondary }}>No {type} orders</Text>
                </View>
            )
        }

        return (
            <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <Card style={styles.card}>
                        <Card.Content>
                            <View style={styles.row}>
                                <Text variant="titleMedium">Order #{item.id}</Text>
                                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                                    KSh {item.total_amount.toLocaleString()}
                                </Text>
                            </View>
                            <Text variant="bodySmall" style={{ color: theme.colors.secondary }}>
                                {new Date(item.createdAt).toLocaleDateString()}
                            </Text>
                            <View style={styles.chipRow}>
                                <Chip
                                    textStyle={{ color: 'white', fontSize: 12 }}
                                    style={{ backgroundColor: getStatusColor(item.status), height: 28 }}
                                >
                                    {item.status}
                                </Chip>
                                <Chip
                                    mode="outlined"
                                    textStyle={{ fontSize: 12 }}
                                    style={{ height: 28 }}
                                >
                                    {item.payment_status}
                                </Chip>
                            </View>
                            <Text variant="bodyMedium" style={{ marginTop: 8 }}>
                                {item.items.length} Items
                            </Text>
                        </Card.Content>
                    </Card>
                )}
                contentContainerStyle={styles.list}
                refreshing={refreshing}
                onRefresh={onRefresh}
            />
        );
    };

    const renderScene = SceneMap({
        current: () => <OrderList type="current" />,
        past: () => <OrderList type="past" />,
    });

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width: layout.width }}
                renderTabBar={props => (
                    <TabBar
                        {...props}
                        style={{ backgroundColor: theme.colors.surface }}
                        indicatorStyle={{ backgroundColor: theme.colors.primary }}
                        activeColor={theme.colors.primary}
                        inactiveColor={theme.colors.onSurfaceVariant}
                    />
                )}
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
    list: {
        padding: 16,
    },
    card: {
        marginBottom: 12,
        // backgroundColor: 'white', // Let Card handle theme background
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
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
});
