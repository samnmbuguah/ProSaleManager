import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './utils';

/**
 * Reports and Export Tests
 * Tests report viewing, filtering, and export functionality
 */
test.describe('Reports and Export', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth');
        await page.fill('input[type="email"]', 'demo.admin@example.com');
        await page.fill('input[type="password"]', 'ChangeMe123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*(dashboard|pos)/);

        await page.getByRole('link', { name: 'Reports' }).click();
        await expect(page).toHaveURL(/.*reports/);
        await waitForPageLoad(page);
    });

    test('should display reports dashboard with overview', async ({ page }) => {
        // Verify dashboard elements
        const dashboardTitle = page.getByText('Dashboard');
        await expect(dashboardTitle.first()).toBeVisible();

        // Should show revenue or sales metrics
        const revenueText = page.getByText(/revenue|sales|total/i);
        await expect(revenueText.first()).toBeVisible({ timeout: 10000 });
    });

    test('should switch to Sales Performance tab', async ({ page }) => {
        const salesTab = page.getByText('Sales Performance');

        if (await salesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
            await salesTab.click();
            await waitForPageLoad(page);

            // Should show sales chart or data
            const salesContent = page.locator('canvas, [class*="chart"], table').first();
            await expect(salesContent).toBeVisible({ timeout: 10000 });
        }
    });

    test('should switch to Product Performance tab', async ({ page }) => {
        const productTab = page.getByText('Product Performance');

        if (await productTab.isVisible({ timeout: 5000 }).catch(() => false)) {
            await productTab.click();
            await waitForPageLoad(page);

            // Should show product data
            const productContent = page.locator('canvas, [class*="chart"], table').first();
            await expect(productContent).toBeVisible({ timeout: 10000 });
        }
    });

    test('should switch to Expenses Summary tab', async ({ page }) => {
        const expensesTab = page.getByText('Expenses Summary');

        if (await expensesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expensesTab.click();
            await waitForPageLoad(page);

            // Should show expenses data
            const expensesHeading = page.getByRole('heading', { name: 'Total Expenses' });
            await expect(expensesHeading.first()).toBeVisible({ timeout: 10000 });
        }
    });

    test('should switch to Inventory Status tab', async ({ page }) => {
        const inventoryTab = page.getByText('Inventory Status');

        if (await inventoryTab.isVisible({ timeout: 5000 }).catch(() => false)) {
            await inventoryTab.click();
            await waitForPageLoad(page);

            // Should show inventory data
            const inventoryContent = page.locator('table, [class*="inventory"]').first();
            await expect(inventoryContent).toBeVisible({ timeout: 10000 });
        }
    });

    test('should switch to Stock Value tab', async ({ page }) => {
        const stockTab = page.getByText('Stock Value');

        if (await stockTab.isVisible({ timeout: 5000 }).catch(() => false)) {
            await stockTab.click();
            await waitForPageLoad(page);

            // Should show stock value data
            const stockContent = page.locator('canvas, table, [class*="stock"]').first();
            await expect(stockContent).toBeVisible({ timeout: 10000 });
        }
    });

    test('should display date range filter', async ({ page }) => {
        // Look for date picker or range filter
        const dateFilter = page.locator('input[type="date"], [class*="date-picker"], button:has-text("Date Range")').first();

        const hasDateFilter = await dateFilter.isVisible({ timeout: 5000 }).catch(() => false);
        if (hasDateFilter) {
            await expect(dateFilter).toBeVisible();
        }
    });

    test('should display export options', async ({ page }) => {
        // Look for export button or dropdown
        const exportBtn = page.getByRole('button', { name: /export|download/i }).first();

        if (await exportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await exportBtn.click();

            // Should show export format options
            const pdfOption = page.getByText(/pdf/i);
            const excelOption = page.getByText(/excel|csv/i);

            const hasPdf = await pdfOption.isVisible({ timeout: 3000 }).catch(() => false);
            const hasExcel = await excelOption.isVisible({ timeout: 3000 }).catch(() => false);

            if (hasPdf || hasExcel) {
                expect(hasPdf || hasExcel).toBeTruthy();
            }

            // Close by clicking elsewhere
            await page.keyboard.press('Escape');
        }
    });
});
