// Define type for PriceUnit constant structure used in forms
export type PriceUnitConstant = {
  value: string;
  label: string;
  quantity: number;
};

// Define the PRICE_UNITS constant
export const PRICE_UNITS: PriceUnitConstant[] = [
  { value: "dozen", label: "Dozen", quantity: 12 },
  { value: "pack", label: "Pack", quantity: 3 },
  { value: "piece", label: "Piece", quantity: 1 },
];

// Define a type for UNIT_CONVERSIONS
export type UnitConversions = {
  [key: string]: { [key: string]: number };
};

// Define the UNIT_CONVERSIONS constant
export const UNIT_CONVERSIONS: UnitConversions = {
  dozen: { pack: 4, piece: 12 }, // 1 dozen = 4 packs, 12 pieces
  pack: { dozen: 1 / 4, piece: 3 }, // 1 pack = 3 pieces, 1 dozen = 4 packs
  piece: { dozen: 1 / 12, pack: 1 / 3 }, // 1 piece = 1/12 dozen, 1/3 pack
};
