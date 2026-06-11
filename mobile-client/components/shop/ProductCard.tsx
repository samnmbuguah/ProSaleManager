import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Button, useTheme, Chip, IconButton } from 'react-native-paper';
import { Product } from '@/types/product';
import { ThemedText } from '../themed-text';
import { formatCurrency } from '@/utils/currency';

interface ProductCardProps {
    product: Product;
    onPress?: () => void;
    onAddToCart?: () => void;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
    testID?: string;
}

export const ProductCard = ({ product, onPress, onAddToCart, isFavorite, onToggleFavorite, testID }: ProductCardProps) => {
    const theme = useTheme();

    const price = Number(product.piece_selling_price) || 0;
    const imageUrl = product.image_url || 'https://via.placeholder.com/150';

    return (
        <Card style={styles.card} onPress={onPress} testID={testID}>
            <View>
                <Card.Cover source={{ uri: imageUrl }} style={styles.cover} />
                {onToggleFavorite && (
                    <IconButton
                        icon={isFavorite ? 'heart' : 'heart-outline'}
                        iconColor={isFavorite ? theme.colors.error : theme.colors.onSurfaceVariant}
                        size={20}
                        style={styles.favoriteButton}
                        onPress={onToggleFavorite}
                        accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    />
                )}
            </View>
            <Card.Content style={styles.content}>
                <ThemedText type="defaultSemiBold" numberOfLines={1}>{product.name}</ThemedText>
                <Text variant="bodySmall" numberOfLines={2} style={styles.description}>
                    {product.description}
                </Text>
                <View style={styles.footer}>
                    <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                        {formatCurrency(price)}
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
    favoriteButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        margin: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
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
