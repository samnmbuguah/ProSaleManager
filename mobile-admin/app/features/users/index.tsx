import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Appbar, List, FAB, ActivityIndicator, IconButton, useTheme, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { userService } from '@/services/userService';
import { User } from '@/types/user';

export default function UsersScreen() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await userService.getAll();
            setUsers(data);
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
                <Appbar.Content title="User Management" />
            </Appbar.Header>

            <FlatList
                data={users}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <List.Item
                        title={item.name}
                        description={`${item.role} • ${item.email}`}
                        left={(props) => <List.Icon {...props} icon="account" />}
                        right={(props) => <IconButton {...props} icon="pencil" onPress={() => { }} />}
                        style={{ backgroundColor: theme.colors.surface }}
                    />
                )}
                ItemSeparatorComponent={() => <Divider />}
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
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
});
