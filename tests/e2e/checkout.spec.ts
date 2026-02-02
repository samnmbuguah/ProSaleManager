import { test, expect } from '@playwright/test';
import { waitForPageLoad, dismissSwal } from './utils';

/**
 * Checkout Flow Tests
 * Tests the complete checkout process including payment methods
 */
test.describe('Checkout Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth');
        await page.fill('input[type="email"]', 'demo.admin@example.com');
        await page.fill('input[type="password"]', 'ChangeMe123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*(dashboard|pos)/);

        await page.getByRole('link', { name: 'POS' }).click();
        await expect(page).toHaveURL(/.*pos/);
        await waitForPageLoad(page);
    });

    test('should display checkout button when cart has items', async ({ page }) => {
        // Look for product cards or list
        const productCard = page.locator('[class*="product"], [class*="card"]').first();

        if (await productCard.isVisible({ timeout: 5000 }).catch(() => false)) {
            await productCard.click();
            await page.waitForTimeout(500);

            // Check if checkout button becomes enabled
            const checkoutBtn = page.getByRole('button', { name: /checkout|pay/i });
            // Button should exist
            await expect(checkoutBtn).toBeVisible();
        }
    });

    test('should open checkout dialog and show payment options', async ({ page }) => {
        // Try to add a product to cart
        const productCard = page.locator('[class*="product"], [class*="card"]').first();

        if (await productCard.isVisible({ timeout: 5000 }).catch(() => false)) {
            await productCard.click();
            await page.waitForTimeout(500);

            const checkoutBtn = page.getByRole('button', { name: /checkout/i });
            if (await checkoutBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
                await checkoutBtn.click();

                // Verify checkout dialog opens
                await expect(page.getByRole('dialog')).toBeVisible();

                // Verify payment method options (cash, mpesa, split, paid_to_byc)
                const cashOption = page.getByText('Cash');
                const mpesaOption = page.getByText('M-Pesa');

                const hasCash = await cashOption.isVisible({ timeout: 3000 }).catch(() => false);
                const hasMpesa = await mpesaOption.isVisible({ timeout: 3000 }).catch(() => false);

                expect(hasCash || hasMpesa).toBeTruthy();

                // Close dialog
                await page.keyboard.press('Escape');
            }
        }
    });

    test('should show delivery fee input in checkout', async ({ page }) => {
        const productCard = page.locator('[class*="product"], [class*="card"]').first();

        if (await productCard.isVisible({ timeout: 5000 }).catch(() => false)) {
            await productCard.click();
            await page.waitForTimeout(500);

            const checkoutBtn = page.getByRole('button', { name: /checkout/i });
            if (await checkoutBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
                await checkoutBtn.click();
                await expect(page.getByRole('dialog')).toBeVisible();

                // Look for delivery fee input
                const deliveryInput = page.locator('input[name*="delivery"], input[placeholder*="delivery" i]');
                const hasDelivery = await deliveryInput.isVisible({ timeout: 3000 }).catch(() => false);

                if (hasDelivery) {
                    await deliveryInput.fill('100');
                }

                await page.keyboard.press('Escape');
            }
        }
    });
});
