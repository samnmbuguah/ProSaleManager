
import app from "../../server/src/app.js";
import { sequelize } from "../../server/src/config/database.js";
import Sale from "../../server/src/models/Sale.js";
import Product from "../../server/src/models/Product.js";
import Customer from "../../server/src/models/Customer.js";
import { authenticateAllUsers, TestAuthContext, createAuthenticatedRequest } from "../utils/auth-helpers.js";
import { createTestProduct } from "../fixtures/products.js";

describe("Sales API - Paid to Byc Payment Method", () => {
    let authTokens: TestAuthContext;
    let testProductId: number;
    let testCustomerId: number;
    let testCategoryId: number;

    beforeAll(async () => {
        authTokens = await authenticateAllUsers();

        const existingCategory = await sequelize.models.Category.findOne({ where: { name: "Electronics" } });
        testCategoryId = (existingCategory as any)?.id || 1;

        const testProduct = await Product.create(createTestProduct({
            category_id: testCategoryId,
            quantity: 100,
            store_id: 1,
            name: "Byc Test Product"
        }) as any);
        testProductId = (testProduct as any).id;

        const testCustomer = await Customer.create({
            name: "Byc Test Customer",
            email: "byc@test.com",
            phone: "+254700000000",
            address: "Byc Test Address",
            store_id: 1
        });
        testCustomerId = testCustomer.id;
    });

    afterAll(async () => {
        if (testProductId) await Product.destroy({ where: { id: testProductId } });
        if (testCustomerId) await Customer.destroy({ where: { id: testCustomerId } });
        await Sale.destroy({ where: { payment_method: "paid_to_byc" } });
    });

    it("should create a sale with 'paid_to_byc' payment method and details", async () => {
        const saleData = {
            customer_id: testCustomerId,
            items: [
                {
                    product_id: testProductId,
                    quantity: 1,
                    unit_price: 1000,
                    total: 1000,
                    unit_type: "piece"
                }
            ],
            total_amount: 1000,
            payment_method: "paid_to_byc",
            payment_details: {
                cash: 500,
                mpesa: 500
            },
            amount_paid: 1000,
            status: "completed",
            payment_status: "paid"
        };

        const response = await createAuthenticatedRequest(authTokens.admin.token)
            .post("/api/sales")
            .send(saleData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.payment_method).toBe("paid_to_byc");
        expect(response.body.data.payment_details).toEqual({
            cash: 500,
            mpesa: 500
        });
    });
});
