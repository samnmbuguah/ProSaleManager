import {
  calculateWeightedAveragePrice,
  calculateWeightedAveragePricesForAllUnits,
} from "../../utils/priceCalculations.js";

describe("calculateWeightedAveragePrice", () => {
  it("uses the new price when there is no current stock", () => {
    expect(calculateWeightedAveragePrice(0, 0, 10, 250)).toBe(250);
  });

  it("computes a quantity-weighted average", () => {
    // (10 * 100 + 10 * 200) / 20 = 150
    expect(calculateWeightedAveragePrice(10, 100, 10, 200)).toBe(150);
  });

  it("weights toward the larger batch", () => {
    // (90 * 10 + 10 * 110) / 100 = 20
    expect(calculateWeightedAveragePrice(90, 10, 10, 110)).toBe(20);
  });

  it("rounds to two decimal places", () => {
    // (1 * 100 + 2 * 101) / 3 = 100.666... -> 100.67
    expect(calculateWeightedAveragePrice(1, 100, 2, 101)).toBe(100.67);
  });

  it("returns the new price when additive quantity is zero", () => {
    // currentQuantity > 0 but newQuantity is 0
    expect(calculateWeightedAveragePrice(5, 100, 0, 200)).toBe(100);
  });
});

describe("calculateWeightedAveragePricesForAllUnits", () => {
  it("treats a piece purchase as one piece", () => {
    const result = calculateWeightedAveragePricesForAllUnits(0, 0, 7, 15, "piece");
    expect(result).toEqual({
      piece_buying_price: 15,
      pack_buying_price: 45,
      dozen_buying_price: 180,
    });
  });

  it("converts a pack (3 pieces) purchase to a piece price", () => {
    // 1 pack @ 30 => 3 pieces @ 10
    const result = calculateWeightedAveragePricesForAllUnits(0, 0, 1, 30, "pack");
    expect(result).toEqual({
      piece_buying_price: 10,
      pack_buying_price: 30,
      dozen_buying_price: 120,
    });
  });

  it("converts a dozen (12 pieces) purchase to a piece price", () => {
    const result = calculateWeightedAveragePricesForAllUnits(0, 0, 1, 120, "dozen");
    expect(result).toEqual({
      piece_buying_price: 10,
      pack_buying_price: 30,
      dozen_buying_price: 120,
    });
  });

  it("blends existing piece stock with a new pack purchase", () => {
    // existing 10 pieces @ 10, add 1 pack @ 60 => 3 pieces @ 20
    // (100 + 60) / 13 = 12.307... -> 12.31
    const result = calculateWeightedAveragePricesForAllUnits(10, 10, 1, 60, "pack");
    expect(result.piece_buying_price).toBe(12.31);
    expect(result.pack_buying_price).toBe(36.93);
    expect(result.dozen_buying_price).toBe(147.72);
  });

  it("defaults current quantity and piece price to zero", () => {
    const result = calculateWeightedAveragePricesForAllUnits(undefined, undefined, 1, 12, "dozen");
    expect(result.piece_buying_price).toBe(1);
  });
});
