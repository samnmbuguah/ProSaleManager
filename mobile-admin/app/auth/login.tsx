import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Title, HelperText } from 'react-native-paper';
import { useAuth } from '@/context/AuthContext';
import { ThemedView } from '@/components/themed-view';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, isLoading } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        try {
            setError('');
            setLoading(true);
            await login({ email, password });
        } catch (e: any) {
            setError(e.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <View style={styles.content}>
                <Title style={styles.title}>Admin Portal</Title>
                <Text style={styles.subtitle}>Staff Access Only</Text>

                <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.input}
                    mode="outlined"
                />

                <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    style={styles.input}
                    mode="outlined"
                />

                {error ? <HelperText type="error" visible={!!error}>{error}</HelperText> : null}

                <Button
                    mode="contained"
                    onPress={handleLogin}
                    loading={loading || isLoading}
                    disabled={loading || isLoading}
                    style={styles.button}
                >
                    Login
                </Button>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 32,
        textAlign: 'center',
        opacity: 0.7,
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginTop: 8,
        paddingVertical: 6,
    },
});
