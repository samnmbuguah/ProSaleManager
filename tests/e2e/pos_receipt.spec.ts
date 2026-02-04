import { test, expect } from '@playwright/test';
import { loginAsAdmin, waitForPageLoad } from './utils';

test.describe('POS - Receipt Delivery Fee', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto('/pos');
        await expect(page).toHaveURL(/.*pos/);
        await waitForPageLoad(page);
    });

    test('should display delivery fee on receipt', async ({ page }) => {
        // Wait for products to load
        const addButtons = page.locator('button:has-text("Add")');
        // Wait for at least one button to be visible
        await expect(addButtons.first()).toBeVisible({ timeout: 10000 });

        // Add first product to cart
        await addButtons.first().click();

        // Wait for cart to update
        await expect(page.getByText('Current Sale')).toBeVisible();

        // Wait for checkout button to be enabled
        const checkoutBtn = page.getByRole('button', { name: 'Proceed to Checkout' });
        await expect(checkoutBtn).toBeVisible();
        await expect(checkoutBtn).toBeEnabled();

        // Click Checkout
        await checkoutBtn.click();

        // Wait for Checkout Dialog
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('heading', { name: 'Complete Sale' })).toBeVisible();

        // Enter Delivery Fee
        // Enter Delivery Fee (Label is not associated with Input)
        const deliveryFeeInput = page.locator('div').filter({ hasText: /^Delivery Fee$/ }).locator('input');
        await expect(deliveryFeeInput).toBeVisible();
        await deliveryFeeInput.fill('50');

        // Select Payment Method (default is Cash)
        // Check Total Amount text which should include delivery fee
        // We need to calculate what the expected total is to fill amount tendered
        // However, we can just grab the text content of the total

        // Wait a bit for total to update
        await page.waitForTimeout(500);

        const totalElement = page.locator('text=Total Amount: >> xpath=..').locator('span:nth-child(2)');
        const totalText = await totalElement.textContent();
        // Extract number from "KSh 1,234.00"
        const totalAmount = parseFloat(totalText?.replace(/[^0-9.]/g, '') || '0');

        // Fill Amount Tendered
        await page.getByLabel('Amount Tendered').fill(totalAmount.toString());

        // Click Complete Sale
        await page.getByRole('button', { name: 'Complete Sale' }).click();

        // Wait for Receipt Dialog
        await expect(page.getByText('Sale Receipt #')).toBeVisible({ timeout: 15000 });

        // Verify Delivery Fee is displayed
        await expect(page.locator('.receipt-print').getByText('Delivery Fee')).toBeVisible();
        await expect(page.locator('.receipt-print').getByText('50.00')).toBeVisible();
    });
});
