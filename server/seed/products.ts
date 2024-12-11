import { UnitTypeValues, defaultUnitQuantities } from '../../db/schema';

export const seedProducts = [
  {
    name: "Classic White T-Shirt",
    sku: "TSH001",
    category: "clothing",
    stock: 100,
    min_stock: 20,
    max_stock: 200,
    reorder_point: 30,
    stock_unit: "per_piece" as UnitTypeValues,
    price_units: [
      {
        unit_type: "per_piece" as UnitTypeValues,
        quantity: defaultUnitQuantities.per_piece,
        buying_price: "250",
        selling_price: "350",
        is_default: true
      },
      {
        unit_type: "three_piece" as UnitTypeValues,
        quantity: defaultUnitQuantities.three_piece,
        buying_price: "700",
        selling_price: "900",
        is_default: false
      },
      {
        unit_type: "dozen" as UnitTypeValues,
        quantity: defaultUnitQuantities.dozen,
        buying_price: "2500",
        selling_price: "3500",
        is_default: false
      }
    ]
  },
  {
    name: "Premium Jeans",
    sku: "JNS001",
    category: "clothing",
    stock: 50,
    min_stock: 10,
    max_stock: 100,
    reorder_point: 15,
    stock_unit: "per_piece" as UnitTypeValues,
    price_units: [
      {
        unit_type: "per_piece" as UnitTypeValues,
        quantity: defaultUnitQuantities.per_piece,
        buying_price: "800",
        selling_price: "1200",
        is_default: true
      },
      {
        unit_type: "three_piece" as UnitTypeValues,
        quantity: defaultUnitQuantities.three_piece,
        buying_price: "2200",
        selling_price: "3300",
        is_default: false
      },
      {
        unit_type: "dozen" as UnitTypeValues,
        quantity: defaultUnitQuantities.dozen,
        buying_price: "8000",
        selling_price: "12000",
        is_default: false
      }
    ]
  }
];
