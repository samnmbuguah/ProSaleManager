import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Badge } from 'react-native-paper';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useCart } from '@/context/CartContext';

export const CartIcon = () => {
    const { cart } = useCart();
    const itemCount = cart.items.length;

    return (
        <TouchableOpacity onPress={() => router.push('/cart')} style={styles.container}>
            <IconSymbol size={28} name="cart" color="#000" />
            {itemCount > 0 && (
                <Badge style={styles.badge} size={18}>{itemCount}</Badge>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 8,
        marginRight: 8,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
    }
});
