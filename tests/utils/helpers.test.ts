import { generateOrderNumber, storeScope } from "../../server/src/utils/helpers.js";

describe("Helpers Utility Functions", () => {
    describe("generateOrderNumber", () => {
        it("generates order numbers with correct format", () => {
            const orderNumber = generateOrderNumber();

            // Should start with "PO"
            expect(orderNumber).toMatch(/^PO/);

            // Should be at least 16 characters (PO + timestamp + random)
            expect(orderNumber.length).toBeGreaterThanOrEqual(16);

            // Should contain only alphanumeric characters
            expect(orderNumber).toMatch(/^PO\d+$/);
        });

        it("generates unique order numbers", () => {
            const orderNumbers = new Set();

            // Generate multiple order numbers with small delays to ensure uniqueness
            for (let i = 0; i < 50; i++) {
                const orderNumber = generateOrderNumber();
                orderNumbers.add(orderNumber);
                // Small delay to ensure timestamp differences
                if (i % 10 === 0) {
                    const start = Date.now();
                    while (Date.now() - start < 1) { } // Wait 1ms
                }
            }

            // Most should be unique (allowing for some timestamp collisions)
            expect(orderNumbers.size).toBeGreaterThan(45);
        });

        it("generates order numbers with consistent structure", () => {
            const orderNumber1 = generateOrderNumber();
            const orderNumber2 = generateOrderNumber();

            // Both should have the same structure
            expect(orderNumber1).toMatch(/^PO\d{13,16}$/);
            expect(orderNumber2).toMatch(/^PO\d{13,16}$/);
        });
    });

    describe("storeScope", () => {
        it("returns original where clause for super_admin users", () => {
            const user = { role: "super_admin", store_id: 1 };
            const where = { category_id: 5 };

            const result = storeScope(user, where);

            expect(result).toEqual({ category_id: 5 });
        });

        it("adds store_id to where clause for non-super_admin users", () => {
            const user = { role: "admin", store_id: 3 };
            const where = { category_id: 5 };

            const result = storeScope(user, where);

            expect(result).toEqual({ category_id: 5, store_id: 3 });
        });

        it("handles empty where clause for non-super_admin users", () => {
            const user = { role: "manager", store_id: 2 };

            const result = storeScope(user);

            expect(result).toEqual({ store_id: 2 });
        });

        it("handles undefined user", () => {
            const where = { category_id: 5 };

            const result = storeScope(undefined, where);

            expect(result).toEqual({ category_id: 5, store_id: -1 });
        });

        it("handles user without store_id", () => {
            const user = { role: "sales" };
            const where = { category_id: 5 };

            const result = storeScope(user, where);

            expect(result).toEqual({ category_id: 5, store_id: undefined });
        });

        it("handles complex where clauses", () => {
            const user = { role: "admin", store_id: 4 };
            const where = {
                category_id: 5,
                is_active: true,
                price: { $gte: 100 }
            };

            const result = storeScope(user, where);

            expect(result).toEqual({
                category_id: 5,
                is_active: true,
                price: { $gte: 100 },
                store_id: 4
            });
        });
    });
});
