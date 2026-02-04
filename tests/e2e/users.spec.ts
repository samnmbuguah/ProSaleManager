import { test, expect } from '@playwright/test';
import { waitForPageLoad, dismissSwal } from './utils';

test.describe('User Management', () => {
    test.beforeEach(async ({ page }) => {
        // Login as Super Admin
        await page.goto('/auth');
        await page.fill('input[type="email"]', 'demo.superadmin@example.com');
        await page.fill('input[type="password"]', 'ChangeMe123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*(dashboard|pos|users)/);

        // Navigate to Users via UI
        await page.getByRole('link', { name: 'Users' }).click();
        await expect(page).toHaveURL(/.*users/);
        await waitForPageLoad(page);
    });

    test('should display users list', async ({ page }) => {
        // Verify users page loads
        await expect(page.locator('table, [class*="user"]').first()).toBeVisible({ timeout: 10000 });
    });

    test('should create a new user', async ({ page }) => {
        const timestamp = Date.now();
        const userName = `Test User ${timestamp}`;
        const userEmail = `user${timestamp}@example.com`;

        await page.click('button:has-text("Add User")');
        await expect(page.getByRole('dialog')).toBeVisible();

        await page.fill('input[id="name"]', userName);
        await page.fill('input[id="email"]', userEmail);
        await page.fill('input[id="password"]', 'Password123!');

        // Select Role
        await page.getByText('Select role').click();
        await page.getByRole('option', { name: 'Manager' }).click();

        // Select Store if visible
        const storeSelect = page.getByText('Select store');
        if (await storeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await storeSelect.click();
            await page.getByRole('option').first().click();
        }

        const responsePromise = page.waitForResponse(response => response.url().includes('/api/users') && response.request().method() === 'POST');
        await page.click('button:has-text("Create User")');

        const response = await responsePromise;
        expect(response.ok()).toBeTruthy();

        await dismissSwal(page);
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    });

    test('should search for users', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="Search"]');
        if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await searchInput.fill('admin');
            await page.waitForTimeout(500);
            await waitForPageLoad(page);
        }
    });
});
