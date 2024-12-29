export const seedProducts = [
  {
    name: 'Classic Sneakers',
    sku: 'SHOE001',
    category: 'Shoes',
    stock: 50,
    min_stock: 10,
    max_stock: 100,
    reorder_point: 20,
    stock_unit: 'per_piece',
    price_units: [
      {
        unit_type: 'per_piece',
        quantity: 1,
        buying_price: '1500',
        selling_price: '2000',
        is_default: true
      },
      {
        unit_type: 'three_piece',
        quantity: 3,
        buying_price: '4200',
        selling_price: '5700',
        is_default: false
      },
      {
        unit_type: 'dozen',
        quantity: 12,
        buying_price: '16000',
        selling_price: '22000',
        is_default: false
      }
    ]
  },
  {
    name: 'Cotton Boxers',
    sku: 'BOX001',
    category: 'Boxers',
    stock: 100,
    min_stock: 20,
    max_stock: 200,
    reorder_point: 30,
    stock_unit: 'per_piece',
    price_units: [
      {
        unit_type: 'per_piece',
        quantity: 1,
        buying_price: '300',
        selling_price: '500',
        is_default: true
      },
      {
        unit_type: 'three_piece',
        quantity: 3,
        buying_price: '850',
        selling_price: '1400',
        is_default: false
      },
      {
        unit_type: 'dozen',
        quantity: 12,
        buying_price: '3200',
        selling_price: '5500',
        is_default: false
      }
    ]
  },
  {
    name: 'Lace Panties',
    sku: 'PAN001',
    category: 'Panties',
    stock: 150,
    min_stock: 30,
    max_stock: 300,
    reorder_point: 50,
    stock_unit: 'per_piece',
    price_units: [
      {
        unit_type: 'per_piece',
        quantity: 1,
        buying_price: '200',
        selling_price: '350',
        is_default: true
      },
      {
        unit_type: 'three_piece',
        quantity: 3,
        buying_price: '550',
        selling_price: '1000',
        is_default: false
      },
      {
        unit_type: 'dozen',
        quantity: 12,
        buying_price: '2100',
        selling_price: '3800',
        is_default: false
      }
    ]
  },
  {
    name: 'Push-up Bra',
    sku: 'BRA001',
    category: 'Bras',
    stock: 80,
    min_stock: 15,
    max_stock: 150,
    reorder_point: 25,
    stock_unit: 'per_piece',
    price_units: [
      {
        unit_type: 'per_piece',
        quantity: 1,
        buying_price: '800',
        selling_price: '1200',
        is_default: true
      },
      {
        unit_type: 'three_piece',
        quantity: 3,
        buying_price: '2300',
        selling_price: '3400',
        is_default: false
      },
      {
        unit_type: 'dozen',
        quantity: 12,
        buying_price: '8500',
        selling_price: '13000',
        is_default: false
      }
    ]
  },
  {
    name: 'Coconut Oil',
    sku: 'OIL001',
    category: 'Oil',
    stock: 60,
    min_stock: 12,
    max_stock: 120,
    reorder_point: 24,
    stock_unit: 'per_piece',
    price_units: [
      {
        unit_type: 'per_piece',
        quantity: 1,
        buying_price: '250',
        selling_price: '400',
        is_default: true
      },
      {
        unit_type: 'three_piece',
        quantity: 3,
        buying_price: '700',
        selling_price: '1150',
        is_default: false
      },
      {
        unit_type: 'dozen',
        quantity: 12,
        buying_price: '2700',
        selling_price: '4300',
        is_default: false
      }
    ]
  }
];

export const seedSuppliers = [
  {
    name: 'Fashion Footwear Ltd',
    email: 'sales@fashionfootwear.com',
    phone: '+254700000001',
    address: 'Industrial Area, Nairobi'
  },
  {
    name: 'Undergarments Wholesale Co',
    email: 'sales@ugwholesale.com',
    phone: '+254700000002',
    address: 'Eastleigh, Nairobi'
  },
  {
    name: 'Beauty Products Distributors',
    email: 'sales@beautydist.com',
    phone: '+254700000003',
    address: 'Westlands, Nairobi'
  }
];

export const seedProductSuppliers = [
  {
    product_sku: 'SHOE001',
    supplier_email: 'sales@fashionfootwear.com',
    cost_price: '1400',
    is_preferred: true
  },
  {
    product_sku: 'BOX001',
    supplier_email: 'sales@ugwholesale.com',
    cost_price: '280',
    is_preferred: true
  },
  {
    product_sku: 'PAN001',
    supplier_email: 'sales@ugwholesale.com',
    cost_price: '180',
    is_preferred: true
  },
  {
    product_sku: 'BRA001',
    supplier_email: 'sales@ugwholesale.com',
    cost_price: '750',
    is_preferred: true
  },
  {
    product_sku: 'OIL001',
    supplier_email: 'sales@beautydist.com',
    cost_price: '230',
    is_preferred: true
  }
]; 