export const PRICE_UNITS = [
  {
    label: 'Per Piece',
    value: 'per_piece',
    quantity: 1,
    discount: 0
  },
  {
    label: 'Three Piece',
    value: 'three_piece',
    quantity: 3,
    discount: 0.05 // 5% discount
  },
  {
    label: 'One Dozen',
    value: 'dozen',
    quantity: 12,
    discount: 0.1 // 10% discount
  }
] as const;

export type PriceUnitType = typeof PRICE_UNITS[number]['value']; 