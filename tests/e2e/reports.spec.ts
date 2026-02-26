import { test, expect } from '@playwright/test';

test.describe('Reports Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // Login as Super Admin (Reports accessible to Admin/Super Admin/Manager)
        await page.goto('/auth');
        await page.fill('input[type="email"]', 'demo.superadmin@example.com');
        await page.fill('input[type="password"]', 'ChangeMe123!');
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/.*(dashboard|users|pos)/);

        // Navigate via UI to ensure Store Context is preserved
        await page.getByRole('link', { name: 'Reports' }).click();
        await expect(page).toHaveURL(/.*reports/);
        // Wait for loading to finish
        await expect(page.locator('.animate-spin')).not.toBeVisible();
    });

    test('should load reports dashboard and switch tabs', async ({ page }) => {
        // 1. Check Default Tab (Dashboard)
        await expect(page.getByText('Sales Trend')).toBeVisible();
        await expect(page.getByText('Top Sellers')).toBeVisible();

        // 2. Check Period Selector
        await page.getByText('This Month').click();
        // Should trigger fetch, verifying via response
        const periodResponse = await page.waitForResponse(response => response.url().includes('period=this_month') || response.url().includes('sales-summary'));
        expect(periodResponse.ok()).toBeTruthy();

        // 3. Switch to Inventory Tab
        await page.getByText('Inventory Status').click();
        // Expect inventory data/headers
        await expect(page.locator('table')).toBeVisible(); // Assuming table of products

        // 4. Switch to Product Performance
        await page.getByText('Product Performance').click();
        // Expect performance data
        await expect(page.getByText('Total Revenue:')).toBeVisible();

        // 5. Switch to Expenses Summary
        await page.getByText('Expenses Summary').click();
        // Expect expenses summary
        await expect(page.getByRole('heading', { name: 'Total Expenses' }).first()).toBeVisible();
    });
});
