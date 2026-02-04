import { test, expect } from '@playwright/test';

test.describe('Expenses Management', () => {
    test.beforeEach(async ({ page }) => {
        // Login as Admin
        await page.goto('/auth');
        await page.fill('input[type="email"]', 'demo.admin@example.com');
        await page.fill('input[type="password"]', 'ChangeMe123!');
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/.*(dashboard|pos)/);

        // Navigate via UI to ensure Store Context is preserved
        await page.getByRole('link', { name: 'Expenses' }).click();
        await expect(page).toHaveURL(/.*expenses/);
    });

    test('should create and delete an expense', async ({ page }) => {
        const timestamp = Date.now();
        const description = `Office Supplies ${timestamp}`;
        const amount = '1500';

        // --- CREATE ---
        await test.step('Create Expense', async () => {
            // Fill form
            await page.fill('input[name="description"]', description);
            await page.fill('input[name="amount"]', amount);

            // Select Category
            const categoryTrigger = page.locator('button[role="combobox"]').nth(0); // Assuming first select is Category
            await categoryTrigger.click();
            await page.getByRole('option', { name: 'Marketing' }).click();

            // Select Payment Method
            const paymentTrigger = page.locator('button[role="combobox"]').nth(1); // Assuming second select is Payment Method
            await paymentTrigger.click();
            await page.getByRole('option', { name: 'Cash' }).click();
            // Note: Date is pre-filled

            // Submit
            // Wait for response to debug potential backend errors
            const responsePromise = page.waitForResponse(response => response.url().includes('/api/expenses') && response.request().method() === 'POST');
            await page.click('button:has-text("Add Expense")');

            const response = await responsePromise;
            expect(response.ok()).toBeTruthy();
        });

        // --- VERIFY ---
        await test.step('Verify Expense in List', async () => {
            // Reload to ensure list is updated if invalidation was missed/delayed
            await page.reload();
            await expect(page.locator('.animate-spin')).not.toBeVisible(); // Wait for load
            await expect(page.getByText(description)).toBeVisible();
            await expect(page.locator('td').filter({ hasText: '1,500' }).first()).toBeVisible();
        });

        // --- DELETE ---
        await test.step('Delete Expense', async () => {
            // Find row
            const row = page.locator('tr', { has: page.getByText(description) });

            // Click delete (Trash2 icon)
            // Wait for delete response
            const deletePromise = page.waitForResponse(response => response.url().includes('/api/expenses') && response.request().method() === 'DELETE');

            await row.locator('button:has(.lucide-trash-2)').click(); // Assuming standard icon class

            // Confirm dialog if any - ExpenseList usually asks for confirmation? 
            // Checking ExpenseList logic next, but assuming standard confirmation might be there or direct delete. 
            // ExpensesPage.tsx handleDeleteExpense triggers mutation directly. 
            // But let's check if the button itself has a confirmation or if it's immediate.
            // If it's immediate, the response promise will resolve.

            const deleteResponse = await deletePromise;
            expect(deleteResponse.ok()).toBeTruthy();

            // Verify removal
            await expect(page.getByText(description)).not.toBeVisible();
        });
    });
});
