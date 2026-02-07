import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, Text, Card } from 'react-native-paper';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';

export default function ReportsScreen() {
    return (
        <ThemedView style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Reports" />
            </Appbar.Header>

            <View style={styles.content}>
                <Card style={styles.card}>
                    <Card.Title title="Sales Summary" subtitle="Today" />
                    <Card.Content>
                        <Text variant="displaySmall">$1,234.50</Text>
                    </Card.Content>
                </Card>

                <Card style={styles.card}>
                    <Card.Title title="Inventory Value" />
                    <Card.Content>
                        <Text variant="displaySmall">$45,678.00</Text>
                    </Card.Content>
                </Card>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    card: {
        marginBottom: 16,
    }
});
