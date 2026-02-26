import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Appbar, List, FAB, ActivityIndicator, Text } from 'react-native-paper';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { expenseService } from '@/services/expenseService';
import { Expense } from '@/types/expense';

export default function ExpensesScreen() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        try {
            const data = await expenseService.getAll();
            setExpenses(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
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
                        right={() => <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>}
                    />
                )}
            />

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => { }}
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
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
});
