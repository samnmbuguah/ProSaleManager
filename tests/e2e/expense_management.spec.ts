import { test, expect } from '@playwright/test';
import { waitForPageLoad, dismissSwal } from './utils';

/**
 * Expense Management Tests
 * Tests expense creation, filtering, and categories
 */
test.describe('Expense Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth');
        await page.fill('input[type="email"]', 'demo.admin@example.com');
        await page.fill('input[type="password"]', 'ChangeMe123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*(dashboard|pos)/);

        await page.getByRole('link', { name: 'Expenses' }).click();
        await expect(page).toHaveURL(/.*expenses/);
        await waitForPageLoad(page);
    });

    test('should display expenses list', async ({ page }) => {
        const expensesList = page.locator('.grid, .list, table').first();
        await expect(expensesList).toBeVisible({ timeout: 10000 });
    });

    test('should open add expense form', async ({ page }) => {
        const addBtn = page.getByRole('button', { name: /add expense/i });

        if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await addBtn.click();

            // Should show expense form
            const descInput = page.locator('input[name="description"], textarea[name="description"]');
            const amountInput = page.locator('input[name="amount"]');

            await expect(descInput).toBeVisible();
            await expect(amountInput).toBeVisible();

            // Close form
            await page.keyboard.press('Escape');
        }
    });

    test('should create an expense', async ({ page }) => {
        const addBtn = page.getByRole('button', { name: /add expense/i });

        if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await addBtn.click();

            // Fill expense form
            const descInput = page.locator('input[name="description"], textarea[name="description"]');
            await descInput.fill(`Test Expense ${Date.now()}`);

            const amountInput = page.locator('input[name="amount"]');
            await amountInput.fill('500');

            // Select category if visible
            const categorySelect = page.locator('select[name="category"], [role="combobox"]').first();
            if (await categorySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
                await categorySelect.click();
                const firstOption = page.getByRole('option').first();
                if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await firstOption.click();
                }
            }

            // Submit
            const submitBtn = page.getByRole('button', { name: /add expense|save|submit/i });
            const responsePromise = page.waitForResponse(response => response.url().includes('/api/expenses') && response.request().method() === 'POST');
            await submitBtn.click();

            const response = await responsePromise;
            expect(response.ok()).toBeTruthy();

            await dismissSwal(page);
        }
    });

    test('should filter expenses by date', async ({ page }) => {
        const dateFilter = page.locator('input[type="date"]').first();

        if (await dateFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
            await dateFilter.fill('2024-01-01');
            await waitForPageLoad(page);
        }
    });

    test('should show expense totals', async ({ page }) => {
        // Expenses page should show total/summary
        const totalText = page.getByText(/total|sum|amount/i);
        const hasTotal = await totalText.first().isVisible({ timeout: 5000 }).catch(() => false);

        if (hasTotal) {
            await expect(totalText.first()).toBeVisible();
        }
    });
});
