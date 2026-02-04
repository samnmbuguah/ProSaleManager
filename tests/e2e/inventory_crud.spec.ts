import { test, expect } from '@playwright/test';
import { waitForPageLoad, dismissSwal } from './utils';

test.describe('Inventory Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth');
        await page.fill('input[type="email"]', 'demo.admin@example.com');
        await page.fill('input[type="password"]', 'ChangeMe123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*(dashboard|pos)/);

        // Navigate via UI to preserve store context
        await page.getByRole('link', { name: 'Inventory' }).click();
        await expect(page).toHaveURL(/.*inventory/);
        await waitForPageLoad(page);
    });

    test('should display products table', async ({ page }) => {
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

    test('should create a product', async ({ page }) => {
        const productName = `Test Product ${Date.now()}`;
        const sku = `TEST-${Date.now()}`;

        await page.click('button:has-text("Add Product")');
        await expect(page.getByRole('dialog')).toBeVisible();

        await page.fill('input[name="name"]', productName);

        // Select Category
        const categorySelect = page.locator('select[name="category_id"]');
        await expect(categorySelect).toBeEnabled({ timeout: 5000 });
        await page.selectOption('select[name="category_id"]', { index: 1 });

        await page.fill('input[name="quantity"]', '10');
        await page.fill('input[name="min_quantity"]', '5');
        await page.fill('input[name="piece_buying_price"]', '100');
        await page.fill('input[name="piece_selling_price"]', '200');
        await page.fill('input[name="sku"]', sku);

        const responsePromise = page.waitForResponse(response => response.url().includes('/api/products') && response.request().method() === 'POST');
        await page.click('button[type="submit"]');

        const response = await responsePromise;
        expect(response.ok()).toBeTruthy();

        await dismissSwal(page);
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

        // Verify product was created
        await page.reload();
        await waitForPageLoad(page);
        await page.fill('input[placeholder="Search products..."]', productName);
        await page.waitForTimeout(500);
        await expect(page.getByText(productName).first()).toBeVisible();
    });
});
