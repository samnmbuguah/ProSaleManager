import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Appbar, List, FAB, ActivityIndicator, Text, Divider, useTheme } from 'react-native-paper';
import { router, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { expenseService } from '@/services/expenseService';
import { Expense } from '@/types/expense';
import { formatCurrency } from '@/utils/currency';

const PAGE_SIZE = 20;

export default function ExpensesScreen() {
    const theme = useTheme();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const loadExpenses = async () => {
        try {
            const data = await expenseService.getAll(1, PAGE_SIZE);
            setExpenses(data.expenses);
            setPage(data.currentPage);
            setTotalPages(data.totalPages);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadMore = async () => {
        if (loadingMore || loading || refreshing || page >= totalPages) return;
        setLoadingMore(true);
        try {
            const data = await expenseService.getAll(page + 1, PAGE_SIZE);
            setExpenses((prev) => {
                const existing = new Set(prev.map((e) => e.id));
                return [...prev, ...data.expenses.filter((e) => !existing.has(e.id))];
            });
            setPage(data.currentPage);
            setTotalPages(data.totalPages);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMore(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadExpenses();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadExpenses();
    };

    if (loading && !refreshing) {
        return <ActivityIndicator style={styles.center} />;
    }

    return (
        <ThemedView style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Expenses" />
            </Appbar.Header>

            <FlatList
                data={expenses}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <List.Item
                        title={item.description}
                        description={`${item.category} • ${new Date(item.date).toLocaleDateString()}`}
                        right={() => <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>}
                    />
                )}
                ItemSeparatorComponent={() => <Divider />}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                onEndReached={loadMore}
                onEndReachedThreshold={0.4}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text variant="titleMedium">No expenses yet</Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>
                            Tap + to record your first expense.
                        </Text>
                    </View>
                }
                ListFooterComponent={
                    loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null
                }
            />

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => router.push('/features/expenses/add')}
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
    amount: {
        alignSelf: 'center',
        fontWeight: 'bold',
        marginRight: 16,
    },
    empty: {
        alignItems: 'center',
        paddingVertical: 64,
        gap: 4,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
});
