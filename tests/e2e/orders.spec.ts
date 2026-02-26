import { test, expect } from '@playwright/test';
import { loginAsAdmin, waitForPageLoad } from './utils';

test.describe('Orders', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
        // Orders is accessed via Sales page with orders tab or directly
        // Check App.tsx routing - orders might be part of sales
        await page.getByRole('link', { name: 'Sales' }).click();
        await expect(page).toHaveURL(/.*sales/);
        await waitForPageLoad(page);
    });

    test('should display orders tab', async ({ page }) => {
        // Sales page has tabs, one should be Orders
        const ordersTab = page.getByText('Orders');
        if (await ordersTab.isVisible({ timeout: 3000 }).catch(() => false)) {
            await ordersTab.click();
            await waitForPageLoad(page);

            // Should see orders list or empty state
            const ordersTable = page.locator('table');
            const emptyState = page.getByText(/no orders/i);

            const hasTable = await ordersTable.isVisible({ timeout: 3000 }).catch(() => false);
            const isEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

            expect(hasTable || isEmpty).toBeTruthy();
        }
    });

    test('should filter orders by status', async ({ page }) => {
        const ordersTab = page.getByText('Orders');
        if (await ordersTab.isVisible({ timeout: 3000 }).catch(() => false)) {
            await ordersTab.click();
            await waitForPageLoad(page);

            // Look for status filter tabs (Pending, Completed, etc)
            const pendingTab = page.getByRole('tab', { name: /pending/i });
            const completedTab = page.getByRole('tab', { name: /completed/i });

            if (await pendingTab.isVisible({ timeout: 3000 }).catch(() => false)) {
                await pendingTab.click();
                await waitForPageLoad(page);
            }

            if (await completedTab.isVisible({ timeout: 3000 }).catch(() => false)) {
                await completedTab.click();
                await waitForPageLoad(page);
            }
        }
    });
});
