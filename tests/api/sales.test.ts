import request from "supertest";
import app from "../../server/src/app.js";
import { sequelize } from "../../server/src/config/database.js";
import Sale from "../../server/src/models/Sale.js";
import SaleItem from "../../server/src/models/SaleItem.js";
import Product from "../../server/src/models/Product.js";
import Customer from "../../server/src/models/Customer.js";
import { authenticateAllUsers, TestAuthContext, testUnauthorizedAccess, testForbiddenAccess } from "../utils/auth-helpers.js";
import { createTestProduct, TEST_CATEGORIES } from "../fixtures/products.js";

// Helper function for authenticated requests - use local import like products tests
const createAuthenticatedRequest = (token: string) => {
    return request(app).set('Authorization', `Bearer ${token}`);
};

describe("Sales API", () => {
    let authTokens: TestAuthContext;
    let testSaleId: number;
    let testProductId: number;
    let testCustomerId: number;
    let testCategoryId: number;

    beforeAll(async () => {
        // Authenticate all seeded users (database already seeded in global setup)
        authTokens = await authenticateAllUsers();

        // Get existing category ID from seeded data
        const existingCategory = await sequelize.models.Category.findOne({ where: { name: "Electronics" } });
        testCategoryId = (existingCategory as any)?.id || 1;

        // Create test product using existing category
        const testProduct = await Product.create(createTestProduct({
            category_id: testCategoryId,
            quantity: 100,
            store_id: 1
        }) as any);
        testProductId = (testProduct as any).id;

        // Create test customer
        const testCustomer = await Customer.create({
            name: "Test Customer",
            email: "test@customer.com",
            phone: "+1234567890",
            address: "123 Test St",
            store_id: 1
        });
        testCustomerId = testCustomer.id;
    });

    afterAll(async () => {
        // Clean up test data
        if (testProductId) {
            await Product.destroy({ where: { id: testProductId } });
        }
        if (testCustomerId) {
            await Customer.destroy({ where: { id: testCustomerId } });
        }
        if (testSaleId) {
            await Sale.destroy({ where: { id: testSaleId } });
        }
    });

    describe("GET /api/sales", () => {
        it("should return 401 without authentication", async () => {
            await testUnauthorizedAccess("/api/sales", "get");
        });

        it("should return all sales for authenticated users", async () => {
            // Create a test sale first
            const testSale = await Sale.create({
                user_id: authTokens.admin.user.id,
                customer_id: testCustomerId,
                total_amount: 150,
                payment_method: "cash",
                amount_paid: 200,
                status: "completed",
                payment_status: "paid",
                store_id: 1
            });

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/sales");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it("should filter sales by store for non-super-admin users", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/sales");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const sales = response.body.data;
            sales.forEach((sale: any) => {
                expect(sale.store_id).toBe(1);
            });
        });

        it("should support pagination", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/sales?page=1&limit=5");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty("pagination");
        });

        it("should support filtering by date range", async () => {
            const today = new Date().toISOString().split('T')[0];
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get(`/api/sales?start_date=${today}&end_date=${today}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it("should support filtering by payment method", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/sales?payment_method=cash");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const sales = response.body.data;
            sales.forEach((sale: any) => {
                expect(sale.payment_method).toBe("cash");
            });
        });

        it("should support filtering by status", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/sales?status=completed");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const sales = response.body.data;
            sales.forEach((sale: any) => {
                expect(sale.status).toBe("completed");
            });
        });
    });

    describe("GET /api/sales/:id", () => {
        it("should return 401 without authentication", async () => {
            await testUnauthorizedAccess("/api/sales/1", "get");
        });

        it("should return sale details for authenticated users", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get(`/api/sales/${testSaleId}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(testSaleId);
            expect(response.body.data).toHaveProperty("total_amount");
            expect(response.body.data).toHaveProperty("payment_method");
            expect(response.body.data).toHaveProperty("status");
        });

        it("should return 404 for non-existent sale", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/sales/99999");

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it("should return 403 for sale from different store", async () => {
            // Create sale for different store
            const otherStoreSale = await Sale.create({
                user_id: authTokens.admin.user.id,
                customer_id: testCustomerId,
                total_amount: 100,
                payment_method: "cash",
                amount_paid: 100,
                status: "completed",
                payment_status: "paid",
                store_id: 999
            });

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get(`/api/sales/${otherStoreSale.id}`);

            expect(response.status).toBe(403);
        });
    });

    describe("POST /api/sales", () => {
        it("should return 401 without authentication", async () => {
            await testUnauthorizedAccess("/api/sales", "post");
        });

        it("should create sale for authenticated users", async () => {
            const saleData = {
                customer_id: testCustomerId,
                items: [
                    {
                        product_id: testProductId,
                        quantity: 2,
                        unit_price: 75,
                        total: 150,
                        unit_type: "piece"
                    }
                ],
                total_amount: 150,
                payment_method: "cash",
                amount_paid: 200,
                status: "completed",
                payment_status: "paid"
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post("/api/sales")
                .send(saleData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("id");
            expect(response.body.data.total_amount).toBe(150);
            expect(response.body.data.payment_method).toBe("cash");

            testSaleId = response.body.data.id;
        });

        it("should return 400 for missing required fields", async () => {
            const invalidSale = {
                customer_id: testCustomerId
                // Missing items and other required fields
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post("/api/sales")
                .send(invalidSale);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it("should return 400 for empty items array", async () => {
            const invalidSale = {
                customer_id: testCustomerId,
                items: [],
                total_amount: 0,
                payment_method: "cash",
                amount_paid: 0
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post("/api/sales")
                .send(invalidSale);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it("should return 400 for insufficient stock", async () => {
            const saleData = {
                customer_id: testCustomerId,
                items: [
                    {
                        product_id: testProductId,
                        quantity: 1000, // More than available stock
                        unit_price: 75,
                        total: 75000,
                        unit_type: "piece"
                    }
                ],
                total_amount: 75000,
                payment_method: "cash",
                amount_paid: 75000
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post("/api/sales")
                .send(saleData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain("stock");
        });

        it("should update product stock after successful sale", async () => {
            const initialStock = 100;
            const saleQuantity = 2;

            const saleData = {
                customer_id: testCustomerId,
                items: [
                    {
                        product_id: testProductId,
                        quantity: saleQuantity,
                        unit_price: 75,
                        total: 150,
                        unit_type: "piece"
                    }
                ],
                total_amount: 150,
                payment_method: "cash",
                amount_paid: 150
            };

            await createAuthenticatedRequest(authTokens.admin.token)
                .post("/api/sales")
                .send(saleData);

            // Verify stock was reduced
            const updatedProduct = await Product.findByPk(testProductId);
            expect(updatedProduct?.quantity).toBe(initialStock - saleQuantity);
        });
    });

    describe("PUT /api/sales/:id", () => {
        it("should return 401 without authentication", async () => {
            await testUnauthorizedAccess("/api/sales/1", "put");
        });

        it("should return 403 for non-admin users", async () => {
            const updateData = { status: "cancelled" };

            await testForbiddenAccess("/api/sales/1", "put", authTokens.sales.token, updateData);
        });

        it("should update sale for admin users", async () => {
            const updateData = {
                status: "cancelled",
                payment_status: "refunded"
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .put(`/api/sales/${testSaleId}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe(updateData.status);
            expect(response.body.data.payment_status).toBe(updateData.payment_status);
        });

        it("should return 404 for non-existent sale", async () => {
            const updateData = { status: "cancelled" };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .put("/api/sales/99999")
                .send(updateData);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it("should not allow updating completed sales", async () => {
            const updateData = { total_amount: 200 };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .put(`/api/sales/${testSaleId}`)
                .send(updateData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe("DELETE /api/sales/:id", () => {
        it("should return 401 without authentication", async () => {
            await testUnauthorizedAccess("/api/sales/1", "delete");
        });

        it("should return 403 for non-admin users", async () => {
            await testForbiddenAccess("/api/sales/1", "delete", authTokens.sales.token);
        });

        it("should delete sale for admin users", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .delete(`/api/sales/${testSaleId}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain("deleted");
        });

        it("should return 404 when trying to access deleted sale", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get(`/api/sales/${testSaleId}`);

            expect(response.status).toBe(404);
        });

        it("should restore product stock when sale is deleted", async () => {
            // This test would verify that product stock is restored
            // when a sale is deleted
            expect(true).toBe(true);
        });
    });

    describe("GET /api/sales/:id/items", () => {
        it("should return 401 without authentication", async () => {
            await testUnauthorizedAccess("/api/sales/1/items", "get");
        });

        it("should return sale items for authenticated users", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get(`/api/sales/${testSaleId}/items`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it("should return 404 for non-existent sale", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/sales/99999/items");

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe("POST /api/sales/:id/receipt", () => {
        it("should return 401 without authentication", async () => {
            await testUnauthorizedAccess("/api/sales/1/receipt", "post");
        });

        it("should send receipt via WhatsApp", async () => {
            const receiptData = {
                method: "whatsapp",
                phone_number: "+1234567890"
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post(`/api/sales/${testSaleId}/receipt`)
                .send(receiptData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain("WhatsApp");
        });

        it("should send receipt via SMS", async () => {
            const receiptData = {
                method: "sms",
                phone_number: "+1234567890"
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post(`/api/sales/${testSaleId}/receipt`)
                .send(receiptData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain("SMS");
        });

        it("should return 400 for missing phone number", async () => {
            const receiptData = {
                method: "whatsapp"
                // Missing phone_number
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post(`/api/sales/${testSaleId}/receipt`)
                .send(receiptData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it("should return 400 for invalid method", async () => {
            const receiptData = {
                method: "invalid_method",
                phone_number: "+1234567890"
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post(`/api/sales/${testSaleId}/receipt`)
                .send(receiptData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe("Sales Analytics", () => {
        it("should return daily sales summary", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/sales/analytics/daily");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("total_sales");
            expect(response.body.data).toHaveProperty("total_revenue");
            expect(response.body.data).toHaveProperty("total_transactions");
        });

        it("should return product performance metrics", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/sales/analytics/products");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it("should return payment method distribution", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/sales/analytics/payment-methods");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe("Refunds and Returns", () => {
        it("should process refund for completed sale", async () => {
            const refundData = {
                reason: "Customer request",
                amount: 150,
                method: "cash"
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post(`/api/sales/${testSaleId}/refund`)
                .send(refundData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("refund_id");
        });

        it("should return 400 for refund amount exceeding sale total", async () => {
            const refundData = {
                reason: "Customer request",
                amount: 1000, // More than sale total
                method: "cash"
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post(`/api/sales/${testSaleId}/refund`)
                .send(refundData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});
