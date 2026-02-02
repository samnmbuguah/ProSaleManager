import { test, expect } from '@playwright/test';
import { waitForPageLoad, dismissSwal } from './utils';

test.describe('Customer Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth');
        await page.fill('input[type="email"]', 'demo.admin@example.com');
        await page.fill('input[type="password"]', 'ChangeMe123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*(dashboard|pos)/);

        // Navigate via UI to preserve store context
        await page.getByRole('link', { name: 'Customers' }).click();
        await expect(page).toHaveURL(/.*customers/);
        await waitForPageLoad(page);
    });

    test('should display customers list', async ({ page }) => {
        // Verify page loads with customer list or empty state
        const customerList = page.locator('div.border.rounded-lg, table');
        await expect(customerList.first()).toBeVisible({ timeout: 10000 });
    });

    test('should search for customers', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="Search"]');
        if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await searchInput.fill('test');
            await page.waitForTimeout(500);
            await waitForPageLoad(page);
        }
    });

    test('should create a customer', async ({ page }) => {
        const timestamp = Date.now();
        const customerName = `Test Customer ${timestamp}`;
        const customerEmail = `test${timestamp}@example.com`;
        const customerPhone = `0700${timestamp.toString().slice(-6)}`;

        await page.click('button:has-text("Add Customer")');
        await expect(page.getByRole('dialog')).toBeVisible();

        await page.fill('input[name="name"]', customerName);
        await page.fill('input[name="email"]', customerEmail);
        await page.fill('input[name="phone"]', customerPhone);

        const responsePromise = page.waitForResponse(response => response.url().includes('/api/customers') && response.request().method() === 'POST');
        await page.click('button[type="submit"]');

        const response = await responsePromise;
        expect(response.ok()).toBeTruthy();

        await dismissSwal(page);
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    });
});
