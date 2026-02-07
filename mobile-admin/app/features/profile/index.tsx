import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, Avatar, Text, Button, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <ThemedView style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => router.back()} />
                <Appbar.Content title="Profile" />
            </Appbar.Header>

            <View style={styles.content}>
                <View style={styles.header}>
                    <Avatar.Text size={80} label={user.name.substring(0, 2).toUpperCase()} />
                    <Text variant="headlineMedium" style={styles.name}>{user.name}</Text>
                    <Text variant="bodyLarge" style={styles.role}>{user.role}</Text>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.infoRow}>
                    <Text variant="labelLarge">Email</Text>
                    <Text variant="bodyLarge">{user.email}</Text>
                </View>

                <Button mode="contained" style={styles.button} onPress={() => { }}>
                    Edit Profile
                </Button>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    name: {
        marginTop: 16,
        fontWeight: 'bold',
    },
    role: {
        color: 'gray',
        textTransform: 'capitalize',
    },
    divider: {
        marginVertical: 16,
    },
    infoRow: {
        marginBottom: 16,
    },
    button: {
        marginTop: 24,
    }
});
