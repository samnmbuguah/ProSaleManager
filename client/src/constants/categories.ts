export const PRODUCT_CATEGORIES = [
  'Shoes',
  'Boxers',
  'Panties',
  'Bras',
  'Oil'
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number]; 