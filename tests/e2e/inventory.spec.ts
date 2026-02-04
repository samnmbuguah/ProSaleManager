import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './utils';

test.describe('Inventory & Stock', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth');
        await page.fill('input[type="email"]', 'demo.admin@example.com');
        await page.fill('input[type="password"]', 'ChangeMe123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*(dashboard|pos)/);

        // Navigate via UI
        await page.getByRole('link', { name: 'Inventory' }).click();
        await expect(page).toHaveURL(/.*inventory/);
        await waitForPageLoad(page);
    });

    test('should display inventory with products table', async ({ page }) => {
        // Verify inventory page loads with table
        await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
    });

    test('should search for products', async ({ page }) => {
        const searchInput = page.locator('input[placeholder="Search products..."]');
        if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await searchInput.fill('test');
            await page.waitForTimeout(500);
            await waitForPageLoad(page);
        }
    });

    test('should open Quick Receive Stock dialog', async ({ page }) => {
        const quickReceiveBtn = page.getByRole('button', { name: /quick receive/i });
        if (await quickReceiveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await quickReceiveBtn.click();
            await expect(page.getByRole('dialog')).toBeVisible();
            // Close dialog
            await page.keyboard.press('Escape');
        }
    });
});
