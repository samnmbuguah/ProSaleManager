// Test product data following SOLID principles
// Single Responsibility: Each function creates one type of test data
// Open/Closed: Easy to extend with new product types
// Interface Segregation: Only exposes what tests need

export interface TestProduct {
    name: string;
    sku: string;
    category_id: number;
    piece_buying_price: number;
    piece_selling_price: number;
    pack_buying_price?: number;
    pack_selling_price?: number;
    dozen_buying_price?: number;
    dozen_selling_price?: number;
    quantity: number;
    min_quantity: number;
    is_active: boolean;
    store_id: number;
    stock_unit: string;
    description?: string;
    image_url?: string;
}

export interface TestProductWithId extends TestProduct {
    id: number;
}

export interface TestCategory {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
}

// Factory functions for creating test products
export const createTestProduct = (overrides: Partial<TestProduct> = {}): TestProduct => ({
    name: "Test Product",
    sku: `SKU${Date.now()}`,
    category_id: 1,
    piece_buying_price: 100,
    piece_selling_price: 150,
    pack_buying_price: 400,
    pack_selling_price: 600,
    dozen_buying_price: 1200,
    dozen_selling_price: 1800,
    quantity: 50,
    min_quantity: 10,
    is_active: true,
    store_id: 1,
    stock_unit: "piece",
    description: "A test product for testing purposes",
    ...overrides
});

export const createElectronicsProduct = (overrides: Partial<TestProduct> = {}): TestProduct => ({
    name: "Test Electronics",
    sku: `ELEC${Date.now()}`,
    category_id: 1,
    piece_buying_price: 200,
    piece_selling_price: 300,
    pack_buying_price: 800,
    pack_selling_price: 1200,
    dozen_buying_price: 2400,
    dozen_selling_price: 3600,
    quantity: 25,
    min_quantity: 5,
    is_active: true,
    store_id: 1,
    stock_unit: "piece",
    description: "Test electronics product",
    ...overrides
});

export const createFoodProduct = (overrides: Partial<TestProduct> = {}): TestProduct => ({
    name: "Test Food Item",
    sku: `FOOD${Date.now()}`,
    category_id: 2,
    piece_buying_price: 50,
    piece_selling_price: 75,
    pack_buying_price: 200,
    pack_selling_price: 300,
    dozen_buying_price: 600,
    dozen_selling_price: 900,
    quantity: 100,
    min_quantity: 20,
    is_active: true,
    store_id: 1,
    stock_unit: "piece",
    description: "Test food product",
    ...overrides
});

export const createLowStockProduct = (overrides: Partial<TestProduct> = {}): TestProduct => ({
    name: "Low Stock Product",
    sku: `LOW${Date.now()}`,
    category_id: 1,
    piece_buying_price: 100,
    piece_selling_price: 150,
    quantity: 5,
    min_quantity: 10,
    is_active: true,
    store_id: 1,
    stock_unit: "piece",
    description: "Product with low stock for testing alerts",
    ...overrides
});

export const createInactiveProduct = (overrides: Partial<TestProduct> = {}): TestProduct => ({
    name: "Inactive Product",
    sku: `INACT${Date.now()}`,
    category_id: 1,
    piece_buying_price: 100,
    piece_selling_price: 150,
    quantity: 0,
    min_quantity: 10,
    is_active: false,
    store_id: 1,
    stock_unit: "piece",
    description: "Inactive product for testing",
    ...overrides
});

// Test categories
export const createTestCategory = (overrides: Partial<TestCategory> = {}): TestCategory => ({
    id: Date.now(),
    name: "Test Category",
    description: "A test category for testing purposes",
    is_active: true,
    ...overrides
});

export const createElectronicsCategory = (overrides: Partial<TestCategory> = {}): TestCategory => ({
    id: 1,
    name: "Electronics",
    description: "Electronic devices and accessories",
    is_active: true,
    ...overrides
});

export const createFoodCategory = (overrides: Partial<TestCategory> = {}): TestCategory => ({
    id: 2,
    name: "Food & Beverages",
    description: "Food items and beverages",
    is_active: true,
    ...overrides
});

export const createClothingCategory = (overrides: Partial<TestCategory> = {}): TestCategory => ({
    id: 3,
    name: "Clothing",
    description: "Apparel and accessories",
    is_active: true,
    ...overrides
});

// Pre-defined categories for testing
export const TEST_CATEGORIES = [
    createElectronicsCategory(),
    createFoodCategory(),
    createClothingCategory()
];

// Product search test data
export const createSearchableProducts = (): TestProduct[] => [
    createTestProduct({ name: "iPhone 13", sku: "IPHONE13", category_id: 1 }),
    createTestProduct({ name: "Samsung Galaxy", sku: "SAMSUNG", category_id: 1 }),
    createTestProduct({ name: "Apple MacBook", sku: "MACBOOK", category_id: 1 }),
    createTestProduct({ name: "Pizza Margherita", sku: "PIZZA", category_id: 2 }),
    createTestProduct({ name: "Burger Deluxe", sku: "BURGER", category_id: 2 }),
    createTestProduct({ name: "T-Shirt Cotton", sku: "TSHIRT", category_id: 3 }),
    createTestProduct({ name: "Jeans Blue", sku: "JEANS", category_id: 3 })
];

// Stock management test data
export const createStockTestProducts = (): TestProduct[] => [
    createTestProduct({ name: "High Stock Item", quantity: 200, min_quantity: 50 }),
    createTestProduct({ name: "Medium Stock Item", quantity: 75, min_quantity: 50 }),
    createTestProduct({ name: "Low Stock Item", quantity: 15, min_quantity: 50 }),
    createTestProduct({ name: "Critical Stock Item", quantity: 3, min_quantity: 50 }),
    createTestProduct({ name: "Out of Stock Item", quantity: 0, min_quantity: 50 })
];

// Price test data
export const createPriceTestProducts = (): TestProduct[] => [
    createTestProduct({
        name: "Premium Product",
        piece_buying_price: 1000,
        piece_selling_price: 1500,
        pack_buying_price: 4000,
        pack_selling_price: 6000,
        dozen_buying_price: 12000,
        dozen_selling_price: 18000
    }),
    createTestProduct({
        name: "Budget Product",
        piece_buying_price: 10,
        piece_selling_price: 15,
        pack_buying_price: 40,
        pack_selling_price: 60,
        dozen_buying_price: 120,
        dozen_selling_price: 180
    }),
    createTestProduct({
        name: "Mid-Range Product",
        piece_buying_price: 100,
        piece_selling_price: 150,
        pack_buying_price: 400,
        pack_selling_price: 600,
        dozen_buying_price: 1200,
        dozen_selling_price: 1800
    })
];
