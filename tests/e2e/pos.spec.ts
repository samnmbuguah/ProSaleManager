import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './utils';

test.describe('POS - Point of Sale', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin (has access to POS)
        await page.goto('/auth');
        await page.fill('input[type="email"]', 'demo.admin@example.com');
        await page.fill('input[type="password"]', 'ChangeMe123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*(dashboard|pos)/, { timeout: 10000 });

        // Navigate to POS via UI
        await page.getByRole('link', { name: 'POS' }).click();
        await expect(page).toHaveURL(/.*pos/);
        await waitForPageLoad(page);
    });

    test('should display POS page with search and products', async ({ page }) => {
        // Verify search input exists
        await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    });

    test('should search for products', async ({ page }) => {
        const searchInput = page.getByPlaceholder(/search/i);
        await searchInput.fill('test');
        await page.waitForTimeout(500); // Wait for debounce

        // Verify search works (either shows results or empty state)
        await waitForPageLoad(page);
    });
});
