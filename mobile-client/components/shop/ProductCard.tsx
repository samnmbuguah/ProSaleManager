import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Button, useTheme, Chip } from 'react-native-paper';
import { Product } from '@/types/product';
import { ThemedText } from '../themed-text';

interface ProductCardProps {
    product: Product;
    onPress?: () => void;
    onAddToCart?: () => void;
}

export const ProductCard = ({ product, onPress, onAddToCart }: ProductCardProps) => {
    const theme = useTheme();

    const price = product.piece_selling_price || 0;
    const imageUrl = product.image_url || 'https://via.placeholder.com/150';

    return (
        <Card style={styles.card} onPress={onPress}>
            <Card.Cover source={{ uri: imageUrl }} style={styles.cover} />
            <Card.Content style={styles.content}>
                <ThemedText type="defaultSemiBold" numberOfLines={1}>{product.name}</ThemedText>
                <Text variant="bodySmall" numberOfLines={2} style={styles.description}>
                    {product.description}
                </Text>
                <View style={styles.footer}>
                    <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                        ${price.toFixed(2)}
                    </Text>
                    {product.quantity <= 0 ? (
                        <Chip icon="alert-circle" style={styles.chip}>Out of Stock</Chip>
                    ) : (
                        <Button mode="contained-tonal" compact onPress={onAddToCart}>
                            Add
                        </Button>
                    )}
                </View>
            </Card.Content>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
        marginHorizontal: 8,
        flex: 1,
        borderRadius: 12,
        elevation: 4,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cover: {
        height: 160,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    content: {
        padding: 12,
    },
    description: {
        marginVertical: 4,
        color: '#666',
        fontSize: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    chip: {
        backgroundColor: '#ffebee',
        height: 24,
    }
});
