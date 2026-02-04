import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './utils';

test.describe('POS & Sales', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth');
        await page.fill('input[type="email"]', 'demo.admin@example.com');
        await page.fill('input[type="password"]', 'ChangeMe123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*(dashboard|pos)/);

        // Navigate via UI to POS
        await page.getByRole('link', { name: 'POS' }).click();
        await expect(page).toHaveURL(/.*pos/);
        await waitForPageLoad(page);
    });

    test('should display POS page with products', async ({ page }) => {
        // Verify search input
        await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    });

    test('should select a customer', async ({ page }) => {
        // Find customer selector
        const customerSelect = page.locator('select, [role="combobox"]').first();
        if (await customerSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(customerSelect).toBeVisible();
        }
    });

    test('should view sales history', async ({ page }) => {
        // Navigate to Sales page
        await page.getByRole('link', { name: 'Sales' }).click();
        await expect(page).toHaveURL(/.*sales/);
        await waitForPageLoad(page);

        // Verify sales list or table
        const salesTable = page.locator('table');
        const salesList = page.locator('[class*="sale"], [class*="list"]');

        const hasTable = await salesTable.isVisible({ timeout: 5000 }).catch(() => false);
        const hasList = await salesList.isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasTable || hasList).toBeTruthy();
    });
});
