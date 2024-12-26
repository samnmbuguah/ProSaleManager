export const seedProducts = [
  {
    name: "Rice",
    sku: "RIC-1001",
    category: "Grains",
    stock: 1000,
    min_stock: 100,
    max_stock: 2000,
    reorder_point: 200,
    stock_unit: "per_piece",
    buying_price: "120",
    selling_price: "150"
  },
  {
    name: "Sugar",
    sku: "SUG-1002",
    category: "Groceries",
    stock: 500,
    min_stock: 50,
    max_stock: 1000,
    reorder_point: 100,
    stock_unit: "per_piece",
    buying_price: "120",
    selling_price: "150"
  },
  {
    name: "Cooking Oil",
    sku: "OIL-1003",
    category: "Cooking",
    stock: 200,
    min_stock: 20,
    max_stock: 400,
    reorder_point: 40,
    stock_unit: "per_piece",
    buying_price: "200",
    selling_price: "250"
  },
  {
    name: "Wheat Flour",
    sku: "FLR-1004",
    category: "Baking",
    stock: 800,
    min_stock: 100,
    max_stock: 1500,
    reorder_point: 200,
    stock_unit: "per_piece",
    buying_price: "120",
    selling_price: "150"
  }
];

export const seedSuppliers = [
  {
    name: "Global Foods Ltd",
    email: "info@globalfoods.com",
    phone: "+254700000001",
    address: "Industrial Area, Nairobi"
  },
  {
    name: "Fresh Grocers",
    email: "orders@freshgrocers.com",
    phone: "+254700000002",
    address: "Mombasa Road, Nairobi"
  },
  {
    name: "Quality Suppliers Co",
    email: "sales@qualitysuppliers.com",
    phone: "+254700000003",
    address: "Karen, Nairobi"
  }
];

export const seedProductSuppliers = [
  {
    product_sku: "RIC-1001",
    supplier_email: "info@globalfoods.com",
    cost_price: "110",
    is_preferred: true
  },
  {
    product_sku: "RIC-1001",
    supplier_email: "orders@freshgrocers.com",
    cost_price: "115",
    is_preferred: false
  },
  {
    product_sku: "SUG-1002",
    supplier_email: "info@globalfoods.com",
    cost_price: "115",
    is_preferred: true
  },
  {
    product_sku: "OIL-1003",
    supplier_email: "sales@qualitysuppliers.com",
    cost_price: "190",
    is_preferred: true
  },
  {
    product_sku: "FLR-1004",
    supplier_email: "orders@freshgrocers.com",
    cost_price: "115",
    is_preferred: true
  }
];
