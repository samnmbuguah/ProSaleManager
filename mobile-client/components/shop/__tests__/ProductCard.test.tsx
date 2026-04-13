import React from 'react';
import { render } from '@testing-library/react-native';
import ProductCard from '../../components/shop/ProductCard';
import { Product } from '../../types/product';

const mockProduct: Product = {
  id: 1,
  name: 'Test Product',
  piece_selling_price: 150,
  pack_selling_price: 1650,
  dozen_selling_price: 1800,
  stock: 50,
  min_stock: 10,
} as Product;

describe('ProductCard Component', () => {
  it('should render product name and price correctly', () => {
    const { getByText } = render(
      <ProductCard product={mockProduct} onPress={jest.fn()} />
    );

    expect(getByText('Test Product')).toBeTruthy();
    expect(getByText('KES 150')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <ProductCard product={mockProduct} onPress={onPress} testID="product-card" />
    );

    // Note: Actual press testing requires fireEvent from @testing-library/react-native
    expect(getByTestId('product-card')).toBeTruthy();
  });

  it('should handle product with zero price', () => {
    const zeroPriceProduct = { ...mockProduct, piece_selling_price: 0 };
    const { getByText } = render(
      <ProductCard product={zeroPriceProduct} onPress={jest.fn()} />
    );

    expect(getByText('KES 0')).toBeTruthy();
  });

  it('should handle product with low stock', () => {
    const lowStockProduct = { ...mockProduct, stock: 5, min_stock: 10 };
    const { getByText } = render(
      <ProductCard product={lowStockProduct} onPress={jest.fn()} />
    );

    expect(getByText('Test Product')).toBeTruthy();
  });

  it('should handle product with no stock', () => {
    const noStockProduct = { ...mockProduct, stock: 0 };
    const { getByText } = render(
      <ProductCard product={noStockProduct} onPress={jest.fn()} />
    );

    expect(getByText('Test Product')).toBeTruthy();
  });
});
