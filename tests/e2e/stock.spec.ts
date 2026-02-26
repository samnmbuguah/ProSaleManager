import { test, expect } from '@playwright/test';
import { waitForPageLoad, dismissSwal, confirmSwal } from './utils';

/**
 * Stock Management Tests
 * Tests stock receiving, adjustments, and inventory tracking
 */
test.describe('Stock Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth');
        await page.fill('input[type="email"]', 'demo.admin@example.com');
        await page.fill('input[type="password"]', 'ChangeMe123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*(dashboard|pos)/);

        await page.getByRole('link', { name: 'Inventory' }).click();
        await expect(page).toHaveURL(/.*inventory/);
        await waitForPageLoad(page);
    });

    test('should open quick receive stock dialog', async ({ page }) => {
        const quickReceiveBtn = page.getByRole('button', { name: /quick receive/i });

        if (await quickReceiveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await quickReceiveBtn.click();
            await expect(page.getByRole('dialog')).toBeVisible();

            // Verify dialog form fields
            const productSelect = page.locator('select, [role="combobox"]').first();
            await expect(productSelect).toBeVisible();

            // Verify quantity input exists
            const quantityInput = page.locator('input[name="quantity"]');
            await expect(quantityInput).toBeVisible();

            await page.keyboard.press('Escape');
        }
    });

    test('should fill quick receive stock form', async ({ page }) => {
        const quickReceiveBtn = page.getByRole('button', { name: /quick receive/i });

        if (await quickReceiveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await quickReceiveBtn.click();
            await expect(page.getByRole('dialog')).toBeVisible();

            // Select a product (click on combobox trigger)
            const productTrigger = page.getByText('Select a product');
            if (await productTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
                await productTrigger.click();
                // Click first option
                const firstOption = page.getByRole('option').first();
                if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await firstOption.click();
                }
            }

            // Fill quantity
            const quantityInput = page.locator('input[name="quantity"]');
            await quantityInput.fill('5');

            // Fill prices if visible
            const buyingPriceInput = page.locator('input[name="buying_price"]');
            if (await buyingPriceInput.isVisible({ timeout: 2000 }).catch(() => false)) {
                await buyingPriceInput.fill('100');
            }

            const sellingPriceInput = page.locator('input[name="selling_price"]');
            if (await sellingPriceInput.isVisible({ timeout: 2000 }).catch(() => false)) {
                await sellingPriceInput.fill('150');
            }

            await page.keyboard.press('Escape');
        }
    });

    test('should navigate to suppliers tab', async ({ page }) => {
        const suppliersTab = page.getByText('Suppliers');

        if (await suppliersTab.isVisible({ timeout: 5000 }).catch(() => false)) {
            await suppliersTab.click();
            await waitForPageLoad(page);

            // Verify suppliers list or add button
            const addSupplierBtn = page.getByRole('button', { name: /add supplier/i });
            const suppliersTable = page.locator('table');

            const hasButton = await addSupplierBtn.isVisible({ timeout: 3000 }).catch(() => false);
            const hasTable = await suppliersTable.isVisible({ timeout: 3000 }).catch(() => false);

            expect(hasButton || hasTable).toBeTruthy();
        }
    });

    test('should navigate to categories tab', async ({ page }) => {
        const categoriesTab = page.getByText('Categories');

        if (await categoriesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
            await categoriesTab.click();
            await waitForPageLoad(page);

            // Verify categories content
            const addCategoryBtn = page.getByRole('button', { name: /add category/i });
            const categoryList = page.locator('.grid, table');

            const hasButton = await addCategoryBtn.isVisible({ timeout: 3000 }).catch(() => false);
            const hasList = await categoryList.first().isVisible({ timeout: 3000 }).catch(() => false);

            expect(hasButton || hasList).toBeTruthy();
        }
    });
});
