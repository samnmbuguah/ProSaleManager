import { sequelize } from "../../server/src/config/database.js";
import Sale from "../../server/src/models/Sale.js";
import SaleItem from "../../server/src/models/SaleItem.js";
import Product from "../../server/src/models/Product.js";
import Customer from "../../server/src/models/Customer.js";
import User from "../../server/src/models/User.js";
import Store from "../../server/src/models/Store.js";

describe("Sales Business Logic", () => {
    let testStore: any;
    let testUser: any;
    let testCustomer: any;
    let testProduct: any;
    let testSale: any;

    beforeAll(async () => {
        // Create test data
        testStore = await Store.create({
            name: "Test Store",
            address: "123 Test St",
            phone: "+1234567890",
            email: "test@store.com"
        });

        testUser = await User.create({
            name: "Test Sales User",
            email: "testsales@example.com",
            password: "password123",
            role: "sales",
            store_id: testStore.id
        });

        testCustomer = await Customer.create({
            name: "Test Customer",
            email: "test@customer.com",
            phone: "+1234567890",
            address: "123 Customer St",
            store_id: testStore.id
        });

        testProduct = await Product.create({
            name: "Test Product",
            sku: "TEST_SKU_001",
            category_id: 1,
            piece_buying_price: 50,
            piece_selling_price: 100,
            pack_buying_price: 200,
            pack_selling_price: 400,
            dozen_buying_price: 600,
            dozen_selling_price: 1200,
            quantity: 100,
            min_quantity: 10,
            store_id: testStore.id,
            stock_unit: "piece"
        });
    });

    afterAll(async () => {
        // Clean up test data
        if (testSale) await Sale.destroy({ where: { id: testSale.id } });
        if (testProduct) await Product.destroy({ where: { id: testProduct.id } });
        if (testCustomer) await Customer.destroy({ where: { id: testCustomer.id } });
        if (testUser) await User.destroy({ where: { id: testUser.id } });
        if (testStore) await Store.destroy({ where: { id: testStore.id } });
    });

    describe("Sale Model Validation", () => {
        it("should create a valid sale", async () => {
            testSale = await Sale.create({
                customer_id: testCustomer.id,
                user_id: testUser.id,
                total_amount: 200,
                payment_method: "cash",
                amount_paid: 200,
                status: "completed",
                payment_status: "paid",
                delivery_fee: 0,
                store_id: testStore.id
            });

            expect(testSale).toBeDefined();
            expect(testSale.id).toBeDefined();
            expect(testSale.total_amount).toBe(200);
            expect(testSale.status).toBe("completed");
            expect(testSale.payment_status).toBe("paid");
        });
    });
});
