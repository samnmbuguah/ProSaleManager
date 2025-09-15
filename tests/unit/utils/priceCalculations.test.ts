import { calculateWeightedAveragePrice, calculateWeightedAveragePricesForAllUnits } from '../priceCalculations';

describe('Price Calculations', () => {
  describe('calculateWeightedAveragePrice', () => {
    it('should calculate weighted average correctly', () => {
      // Test case: 5 items at 100 each, 10 items at 95 each
      const result = calculateWeightedAveragePrice(5, 100, 10, 95);
      const expected = (5 * 100 + 10 * 95) / (5 + 10); // 1450 / 15 = 96.67
      expect(result).toBe(96.67);
    });

    it('should return new price when current quantity is 0', () => {
      const result = calculateWeightedAveragePrice(0, 100, 10, 95);
      expect(result).toBe(95);
    });

    it('should handle decimal prices correctly', () => {
      const result = calculateWeightedAveragePrice(3, 100.50, 7, 99.25);
      const expected = (3 * 100.50 + 7 * 99.25) / (3 + 7); // 995.25 / 10 = 99.525
      expect(result).toBe(99.53); // Rounded to 2 decimal places
    });
  });

  describe('calculateWeightedAveragePricesForAllUnits', () => {
    const mockProduct = {
      quantity: 5,
      piece_buying_price: 100,
      pack_buying_price: 300, // 100 * 3
      dozen_buying_price: 1200, // 100 * 12
    };

    it('should calculate weighted average for piece purchases', () => {
      const result = calculateWeightedAveragePricesForAllUnits(
        mockProduct,
        10, // 10 pieces
        95, // 95 per piece
        'piece'
      );

      // Expected: (5 * 100 + 10 * 95) / (5 + 10) = 96.67
      expect(result.piece_buying_price).toBe(96.67);
      expect(result.pack_buying_price).toBe(290.01); // 96.67 * 3
      expect(result.dozen_buying_price).toBe(1160.04); // 96.67 * 12
    });

    it('should calculate weighted average for pack purchases', () => {
      const result = calculateWeightedAveragePricesForAllUnits(
        mockProduct,
        2, // 2 packs = 6 pieces
        285, // 285 per pack = 95 per piece
        'pack'
      );

      // Expected: (5 * 100 + 6 * 95) / (5 + 6) = 1070 / 11 = 97.27
      expect(result.piece_buying_price).toBe(97.27);
      expect(result.pack_buying_price).toBe(291.81); // 97.27 * 3
      expect(result.dozen_buying_price).toBe(1167.24); // 97.27 * 12
    });

    it('should calculate weighted average for dozen purchases', () => {
      const result = calculateWeightedAveragePricesForAllUnits(
        mockProduct,
        1, // 1 dozen = 12 pieces
        1140, // 1140 per dozen = 95 per piece
        'dozen'
      );

      // Expected: (5 * 100 + 12 * 95) / (5 + 12) = 1640 / 17 = 96.47
      expect(result.piece_buying_price).toBe(96.47);
      expect(result.pack_buying_price).toBe(289.41); // 96.47 * 3
      expect(result.dozen_buying_price).toBe(1157.64); // 96.47 * 12
    });

    it('should handle zero current quantity', () => {
      const emptyProduct = {
        quantity: 0,
        piece_buying_price: 0,
        pack_buying_price: 0,
        dozen_buying_price: 0,
      };

      const result = calculateWeightedAveragePricesForAllUnits(
        emptyProduct,
        10,
        95,
        'piece'
      );

      expect(result.piece_buying_price).toBe(95);
      expect(result.pack_buying_price).toBe(285); // 95 * 3
      expect(result.dozen_buying_price).toBe(1140); // 95 * 12
    });
  });
});
