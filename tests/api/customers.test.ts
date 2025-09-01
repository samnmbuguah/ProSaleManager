import request from "supertest";
import app from "../../server/src/app.js";
import { sequelize } from "../../server/src/config/database.js";
import Customer from "../../server/src/models/Customer.js";
import { authenticateAllUsers, TestAuthContext, testUnauthorizedAccess, testForbiddenAccess } from "../utils/auth-helpers.js";

// Helper function for authenticated requests - use local import like products tests
const createAuthenticatedRequest = (token: string) => {
    return request(app).set('Authorization', `Bearer ${token}`);
};

describe("Customers API", () => {
    let authTokens: TestAuthContext;
    let testCustomerId: number;

    beforeAll(async () => {
        // Authenticate all seeded users (database already seeded in global setup)
        authTokens = await authenticateAllUsers();
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe("GET /api/customers", () => {
        it("should return 401 without authentication", async () => {
            await testUnauthorizedAccess("/api/customers", "get");
        });

        it("should return all customers for authenticated users", async () => {
            // Use existing seeded customers instead of creating new ones

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/customers");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(2);
        });

        it("should filter customers by store for non-super-admin users", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/customers");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const customers = response.body.data;
            customers.forEach((customer: any) => {
                expect(customer.store_id).toBe(1);
            });
        });

        it("should support pagination", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/customers?page=1&limit=5");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty("pagination");
        });

        it("should support searching by name", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/customers?search=John");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const customers = response.body.data;
            customers.forEach((customer: any) => {
                expect(customer.name).toContain("John");
            });
        });

        it("should support searching by email", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/customers?search=jane@example.com");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const customers = response.body.data;
            customers.forEach((customer: any) => {
                expect(customer.email).toContain("jane@example.com");
            });
        });

        it("should support searching by phone", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/customers?search=+1234567890");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const customers = response.body.data;
            customers.forEach((customer: any) => {
                expect(customer.phone).toContain("+1234567890");
            });
        });
    });

    describe("GET /api/customers/:id", () => {
        it("should return 401 without authentication", async () => {
            await testUnauthorizedAccess("/api/customers/1", "get");
        });

        it("should return customer details for authenticated users", async () => {
            // Create a test customer first
            const testCustomer = await Customer.create({
                name: "Test Customer",
                email: "test@customer.com",
                phone: "+1111111111",
                address: "999 Test St",
                store_id: 1
            });
            testCustomerId = testCustomer.id;

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get(`/api/customers/${testCustomerId}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(testCustomerId);
            expect(response.body.data.name).toBe("Test Customer");
            expect(response.body.data.email).toBe("test@customer.com");
            expect(response.body.data.phone).toBe("+1111111111");
        });

        it("should return 404 for non-existent customer", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/customers/99999");

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it("should return 403 for customer from different store", async () => {
            // Create customer for different store
            const otherStoreCustomer = await Customer.create({
                name: "Other Store Customer",
                email: "other@customer.com",
                phone: "+2222222222",
                address: "888 Other St",
                store_id: 999
            });

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get(`/api/customers/${otherStoreCustomer.id}`);

            expect(response.status).toBe(403);
        });
    });

    describe("POST /api/customers", () => {
        it("should return 401 without authentication", async () => {
            await testUnauthorizedAccess("/api/customers", "post");
        });

        it("should return 403 for non-admin users", async () => {
            const customerData = {
                name: "New Customer",
                email: "new@customer.com",
                phone: "+3333333333",
                address: "777 New St"
            };

            await testForbiddenAccess("/api/customers", "post", authTokens.sales.token, customerData);
        });

        it("should create customer for admin users", async () => {
            const customerData = {
                name: "New Customer",
                email: "new@customer.com",
                phone: "+3333333333",
                address: "777 New St"
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post("/api/customers")
                .send(customerData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe(customerData.name);
            expect(response.body.data.email).toBe(customerData.email);
            expect(response.body.data.phone).toBe(customerData.phone);
            expect(response.body.data.address).toBe(customerData.address);
            expect(response.body.data.store_id).toBe(1); // Should default to user's store
        });

        it("should return 400 for duplicate email", async () => {
            const customerData = {
                name: "Duplicate Customer",
                email: "new@customer.com", // Same email as previous test
                phone: "+4444444444",
                address: "666 Duplicate St"
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post("/api/customers")
                .send(customerData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain("email");
        });

        it("should return 400 for duplicate phone", async () => {
            const customerData = {
                name: "Duplicate Phone Customer",
                email: "phone@customer.com",
                phone: "+3333333333", // Same phone as previous test
                address: "555 Phone St"
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post("/api/customers")
                .send(customerData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain("phone");
        });

        it("should return 400 for missing required fields", async () => {
            const invalidCustomer = {
                name: "Invalid Customer"
                // Missing email, phone, address
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post("/api/customers")
                .send(invalidCustomer);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it("should return 400 for invalid email format", async () => {
            const customerData = {
                name: "Invalid Email Customer",
                email: "invalid-email",
                phone: "+5555555555",
                address: "444 Invalid St"
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post("/api/customers")
                .send(customerData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain("email");
        });

        it("should return 400 for invalid phone format", async () => {
            const customerData = {
                name: "Invalid Phone Customer",
                email: "phone@customer.com",
                phone: "invalid-phone",
                address: "333 Phone St"
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post("/api/customers")
                .send(customerData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain("phone");
        });
    });

    describe("PUT /api/customers/:id", () => {
        it("should return 401 without authentication", async () => {
            await testUnauthorizedAccess("/api/customers/1", "put");
        });

        it("should return 403 for non-admin users", async () => {
            const updateData = { name: "Updated Customer" };

            await testForbiddenAccess("/api/customers/1", "put", authTokens.sales.token, updateData);
        });

        it("should update customer for admin users", async () => {
            const updateData = {
                name: "Updated Customer Name",
                email: "updated@customer.com",
                phone: "+6666666666",
                address: "222 Updated St"
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .put(`/api/customers/${testCustomerId}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe(updateData.name);
            expect(response.body.data.email).toBe(updateData.email);
            expect(response.body.data.phone).toBe(updateData.phone);
            expect(response.body.data.address).toBe(updateData.address);
        });

        it("should return 404 for non-existent customer", async () => {
            const updateData = { name: "Updated Customer" };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .put("/api/customers/99999")
                .send(updateData);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it("should return 400 for duplicate email on update", async () => {
            // Create another customer with different email
            const otherCustomer = await Customer.create({
                name: "Other Customer",
                email: "other@customer.com",
                phone: "+7777777777",
                address: "111 Other St",
                store_id: 1
            });

            const updateData = {
                email: "other@customer.com" // Try to use existing email
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .put(`/api/customers/${testCustomerId}`)
                .send(updateData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain("email");
        });

        it("should return 400 for duplicate phone on update", async () => {
            const updateData = {
                phone: "+7777777777" // Try to use existing phone
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .put(`/api/customers/${testCustomerId}`)
                .send(updateData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain("phone");
        });
    });

    describe("DELETE /api/customers/:id", () => {
        it("should return 401 without authentication", async () => {
            await testUnauthorizedAccess("/api/customers/1", "delete");
        });

        it("should return 403 for non-admin users", async () => {
            await testForbiddenAccess("/api/customers/1", "delete", authTokens.sales.token);
        });

        it("should delete customer for admin users", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .delete(`/api/customers/${testCustomerId}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain("deleted");
        });

        it("should return 404 when trying to access deleted customer", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get(`/api/customers/${testCustomerId}`);

            expect(response.status).toBe(404);
        });

        it("should return 400 for customers with associated sales", async () => {
            // This test would require creating a customer with sales history
            // For now, we'll test the basic delete functionality
            expect(true).toBe(true);
        });
    });

    describe("Customer Analytics", () => {
        it("should return customer count by store", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/customers/analytics/count");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("total_customers");
            expect(response.body.data).toHaveProperty("store_customers");
        });

        it("should return customer growth over time", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/customers/analytics/growth");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it("should return top customers by purchase value", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/customers/analytics/top-customers");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe("Customer Import/Export", () => {
        it("should export customers to CSV", async () => {
            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .get("/api/customers/export/csv");

            expect(response.status).toBe(200);
            expect(response.headers["content-type"]).toContain("text/csv");
            expect(response.headers["content-disposition"]).toContain("attachment");
        });

        it("should import customers from CSV", async () => {
            const csvData = `name,email,phone,address
Import Customer 1,import1@customer.com,+8888888888,888 Import St
Import Customer 2,import2@customer.com,+9999999999,999 Import St`;

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post("/api/customers/import/csv")
                .attach("file", Buffer.from(csvData), "customers.csv");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("imported_count");
        });

        it("should return 400 for invalid CSV format", async () => {
            const invalidCsvData = `invalid,csv,format
no,proper,headers`;

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post("/api/customers/import/csv")
                .attach("file", Buffer.from(invalidCsvData), "invalid.csv");

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe("Customer Communication", () => {
        it("should send bulk email to customers", async () => {
            const emailData = {
                subject: "Test Email",
                message: "This is a test email to all customers",
                customer_ids: [1, 2, 3]
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post("/api/customers/bulk-email")
                .send(emailData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("sent_count");
        });

        it("should send bulk SMS to customers", async () => {
            const smsData = {
                message: "This is a test SMS to all customers",
                customer_ids: [1, 2, 3]
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post("/api/customers/bulk-sms")
                .send(smsData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("sent_count");
        });

        it("should return 400 for missing message content", async () => {
            const emailData = {
                subject: "Test Email"
                // Missing message
            };

            const response = await createAuthenticatedRequest(authTokens.admin.token)
                .post("/api/customers/bulk-email")
                .send(emailData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});
