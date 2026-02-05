import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsSales, waitForPageLoad } from './utils';

test.describe('Inventory - Receive Stock', () => {
    test.beforeEach(async ({ page }) => {
        // Most tests start with admin login to inventory
        await loginAsAdmin(page);
        await page.goto('/inventory');
        await expect(page).toHaveURL(/.*inventory/);
        await waitForPageLoad(page);
    });

    test('admin should see Receive Stock tab and access it', async ({ page }) => {
        // Check for the tab
        const receiveStockTab = page.getByRole('tab', { name: 'Receive Stock' });
        await expect(receiveStockTab).toBeVisible();
        await receiveStockTab.click();

        // Check for content
        await expect(page.getByRole('heading', { name: 'Receive Stock' })).toBeVisible();
        await expect(page.getByText('Quickly add inventory')).toBeVisible();

        // Check for the button that opens the dialog
        const openDialogBtn = page.getByRole('button', { name: 'Quick Receive Stock' });
        await expect(openDialogBtn).toBeVisible();

        // Open Dialog
        await openDialogBtn.click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Receive New Stock' })).toBeVisible();

        // Check form fields
        await expect(page.locator('button[role="combobox"]', { hasText: 'Select a product' })).toBeVisible(); // Select trigger
        await expect(page.locator('input[name="quantity"]')).toBeVisible();
        await expect(page.locator('input[name="buying_price"]')).toBeVisible();
    });
});

test.describe('Inventory - Receive Stock Permissions', () => {
    test('sales user should see Access Denied', async ({ page }) => {
        await loginAsSales(page);
        await page.goto('/inventory');
        await expect(page).toHaveURL(/.*inventory/);
        await waitForPageLoad(page);

        // Click tab
        const receiveStockTab = page.getByRole('tab', { name: 'Receive Stock' });
        await expect(receiveStockTab).toBeVisible();
        await receiveStockTab.click();

        // Should see Access Denied message
        await expect(page.getByText('Access Denied')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Quick Receive Stock' })).not.toBeVisible();
    });
});
