
import app from "../../server/src/app.js";
import { sequelize } from "../../server/src/config/database.js";
import Product from "../../server/src/models/Product.js";
import StockLog from "../../server/src/models/StockLog.js";
import Expense from "../../server/src/models/Expense.js";
import Sale from "../../server/src/models/Sale.js";
import { authenticateAllUsers, TestAuthContext, createAuthenticatedRequest } from "../utils/auth-helpers.js";
import { createTestProduct } from "../fixtures/products.js";

describe("Stock Features API", () => {
    let authTokens: TestAuthContext;
    let testProductId: number;
    let testCategoryId: number;

    beforeAll(async () => {
        authTokens = await authenticateAllUsers();

        const existingCategory = await sequelize.models.Category.findOne({ where: { name: "Electronics" } });
        testCategoryId = (existingCategory as any)?.id || 1;

        const testProduct = await Product.create(createTestProduct({
            category_id: testCategoryId,
            quantity: 10,
            store_id: 1,
            name: "Stock Feature Test Product"
        }) as any);
        testProductId = (testProduct as any).id;
    });

    afterAll(async () => {
        // Clean up dependent records first
        if (testProductId) await StockLog.destroy({ where: { product_id: testProductId } });
        if (testProductId) await Product.destroy({ where: { id: testProductId } });
        // Clean up expenses
        await Expense.destroy({ where: { category: "Delivery" } });
    });

    describe("POST /api/stock/receive", () => {
        it("should receive stock and update product quantity", async () => {
            const initialProduct = await Product.findByPk(testProductId);
            const initialQuantity = initialProduct?.quantity || 0;
            const receiveQuantity = 5;

            const receiveData = {
                product_id: testProductId,
                quantity: receiveQuantity,
                unit_type: "piece",
                buying_price: 100,
                selling_price: 150,
                notes: "Test receive stock"
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post("/api/stock/receive")
                .send(receiveData);

            expect(response.status).toBe(200);
            expect(response.body.message).toContain("successfully");

            const updatedProduct = await Product.findByPk(testProductId);
            expect(updatedProduct?.quantity).toBe(initialQuantity + receiveQuantity);
            expect(updatedProduct?.piece_buying_price).toBe(100);
            expect(updatedProduct?.piece_selling_price).toBe(150);

            const log = await StockLog.findOne({
                where: { product_id: testProductId },
                order: [["createdAt", "DESC"]]
            });
            expect(log).toBeDefined();
            expect(log?.quantity_added).toBe(receiveQuantity);
            expect(log?.total_cost).toBe(receiveQuantity * 100);
        });

        it("should handle pack units correctly", async () => {
            const receiveQuantity = 2; // 2 packs = 6 pieces
            const buyingPrice = 300; // Pack price
            const sellingPrice = 450;

            const receiveData = {
                product_id: testProductId,
                quantity: receiveQuantity,
                unit_type: "pack",
                buying_price: buyingPrice,
                selling_price: sellingPrice
            };

            const prevProduct = await Product.findByPk(testProductId);
            const prevQuantity = prevProduct?.quantity || 0;

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post("/api/stock/receive")
                .send(receiveData);

            expect(response.status).toBe(200);

            const updatedProduct = await Product.findByPk(testProductId);
            // Should add 2 * 3 = 6 pieces
            expect(updatedProduct?.quantity).toBe(prevQuantity + 6);

            // Prices should update to pack prices
            expect(Number(updatedProduct?.pack_buying_price)).toBe(buyingPrice);
        });
    });

    describe("Auto-Expense Delivery Charges", () => {
        it("should create an expense when sale has delivery fee", async () => {
            const saleData = {
                items: [
                    {
                        product_id: testProductId,
                        quantity: 1,
                        unit_price: 100,
                        total: 100,
                        unit_type: "piece"
                    }
                ],
                total: 200, // 100 item + 100 delivery
                delivery_fee: 100,
                payment_method: "cash",
                customer_id: null
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post("/api/sales")
                .send(saleData);

            expect(response.status).toBe(201);
            const saleId = response.body.data.id;

            // Check if expense was created
            const expense = await Expense.findOne({
                where: {
                    description: `Delivery fee for Sale #${saleId}`,
                    category: "Delivery"
                }
            });

            expect(expense).toBeDefined();
            expect(Number(expense?.amount)).toBe(100);
        });
    });

    describe("GET /api/stock/value-report", () => {
        it("should return stock value report", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/stock/value-report");

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("total_value");
            expect(response.body).toHaveProperty("logs");
            expect(Array.isArray(response.body.logs)).toBe(true);
            expect(response.body.logs.length).toBeGreaterThan(0);
        });
    });

    describe("GET /api/expenses with date filter", () => {
        it("should filter expenses by date range", async () => {
            // Create an expense for today
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];

            await Expense.create({
                description: "Today Expense",
                amount: 50,
                date: today,
                category: "Test",
                payment_method: "cash",
                user_id: 1,
                store_id: 1
            });

            // Create an expense for last year
            const lastYear = new Date();
            lastYear.setFullYear(lastYear.getFullYear() - 1);

            await Expense.create({
                description: "Old Expense",
                amount: 50,
                date: lastYear,
                category: "Test",
                payment_method: "cash",
                user_id: 1,
                store_id: 1
            });

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get(`/api/expenses?start_date=${todayStr}&end_date=${todayStr}`);

            expect(response.status).toBe(200);
            const expenses = response.body.expenses;

            // Should find "Today Expense" but not "Old Expense"
            const todayExpense = expenses.find((e: any) => e.description === "Today Expense");
            const oldExpense = expenses.find((e: any) => e.description === "Old Expense");

            expect(todayExpense).toBeDefined();
            expect(oldExpense).toBeUndefined();
        });
    });
});
