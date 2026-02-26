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

    test('admin should see Receive Stock tab and use bulk interface', async ({ page }) => {
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
        // Check for the tab
        const receiveStockTab = page.getByRole('tab', { name: 'Receive Stock' });
        await expect(receiveStockTab).toBeVisible();
        await receiveStockTab.click();

        // Check for content
        await expect(page.getByRole('heading', { name: 'Receive Stock' })).toBeVisible();
        await expect(page.getByText('Add new inventory items in bulk')).toBeVisible();

        // Check for Search Input
        const searchInput = page.getByPlaceholder('Search product to add...');
        await expect(searchInput).toBeVisible();

        // Search and Select a Product (assuming 'Test Product' or similar exists from seed, or just search generic)
        // In demo store seed, we have some products. Let's try searching for a common letter 'a' to get results
        await searchInput.fill('a');
        const firstResult = page.locator('.absolute.top-full > div').first();
        await expect(firstResult).toBeVisible();

        const productName = await firstResult.locator('.font-medium').textContent();
        await firstResult.click();

        // Verify row added to table
        await expect(page.getByRole('cell', { name: productName! })).toBeVisible();

        // Fill input
        const quantityInput = page.locator('input[type="number"]').first();
        await quantityInput.fill('10'); // Quantity

        // Fill prices if empty (or just always fill to be safe)
        const buyPriceInput = page.getByPlaceholder('Buy Price');
        await buyPriceInput.fill('100');

        const sellPriceInput = page.getByPlaceholder('Sell Price');
        await sellPriceInput.fill('150');

        // Submit
        const processBtn = page.getByRole('button', { name: 'Process Receipt' });
        await expect(processBtn).toBeEnabled();
        await processBtn.click();

        // Verify success
        await expect(page.getByText(/Successfully received stock/)).toBeVisible();
    });
});

test.describe('Inventory - Receive Stock Permissions', () => {
    test('sales user should NOT see Receive Stock tab', async ({ page }) => {
        await loginAsSales(page);
        await page.goto('/inventory');
        await expect(page).toHaveURL(/.*inventory/);
        await waitForPageLoad(page);

        // Tab should not exist
        const receiveStockTab = page.getByRole('tab', { name: 'Receive Stock' });
        await expect(receiveStockTab).not.toBeVisible();
    });
});
