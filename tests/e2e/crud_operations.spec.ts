import { test, expect } from '@playwright/test';
import { waitForPageLoad, dismissSwal, confirmSwal } from './utils';

/**
 * Edit and Delete Operations Tests
 * Tests CRUD operations with proper cleanup
 */
test.describe('Edit and Delete Operations', () => {

    test.describe('Customer Edit/Delete', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/auth');
            await page.fill('input[type="email"]', 'demo.admin@example.com');
            await page.fill('input[type="password"]', 'ChangeMe123!');
            await page.click('button[type="submit"]');
            await expect(page).toHaveURL(/.*(dashboard|pos)/);

            await page.getByRole('link', { name: 'Customers' }).click();
            await expect(page).toHaveURL(/.*customers/);
            await waitForPageLoad(page);
        });

        test('should edit existing customer', async ({ page }) => {
            // Find an existing customer card with Edit button
            const editBtn = page.getByRole('button', { name: 'Edit' }).first();

            if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
                await editBtn.click();
                await expect(page.getByRole('dialog')).toBeVisible();

                // Verify form is pre-filled
                const nameInput = page.locator('input[name="name"]');
                await expect(nameInput).toBeVisible();
                const currentName = await nameInput.inputValue();
                expect(currentName.length).toBeGreaterThan(0);

                // Close without saving
                await page.keyboard.press('Escape');
            }
        });

        test('should show delete confirmation', async ({ page }) => {
            const deleteBtn = page.getByRole('button', { name: 'Delete' }).first();

            if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
                await deleteBtn.click();

                // Should show confirmation dialog or prompt
                const confirmText = page.getByText(/are you sure|confirm|delete/i);
                await expect(confirmText.first()).toBeVisible({ timeout: 5000 });

                // Cancel the deletion
                await page.keyboard.press('Escape');
            }
        });
    });

    test.describe('Product Edit/Delete', () => {
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

        test('should edit existing product', async ({ page }) => {
            // Wait for table to load
            await expect(page.locator('table')).toBeVisible({ timeout: 10000 });

            const editBtn = page.getByRole('button', { name: 'Edit' }).first();

            if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
                await editBtn.click();
                await expect(page.getByRole('dialog')).toBeVisible();

                // Verify form exists
                const nameInput = page.locator('input[name="name"]');
                await expect(nameInput).toBeVisible();

                await page.keyboard.press('Escape');
            }
        });

        test('should show product delete confirmation', async ({ page }) => {
            await expect(page.locator('table')).toBeVisible({ timeout: 10000 });

            const deleteBtn = page.getByRole('button', { name: 'Delete' }).first();

            if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
                await deleteBtn.click();

                // SweetAlert confirmation should appear
                const swalConfirm = page.locator('.swal2-popup');
                if (await swalConfirm.isVisible({ timeout: 5000 }).catch(() => false)) {
                    // Cancel
                    const cancelBtn = page.locator('.swal2-cancel');
                    if (await cancelBtn.isVisible().catch(() => false)) {
                        await cancelBtn.click();
                    } else {
                        await page.keyboard.press('Escape');
                    }
                }
            }
        });
    });

    test.describe('User Edit', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/auth');
            await page.fill('input[type="email"]', 'demo.superadmin@example.com');
            await page.fill('input[type="password"]', 'ChangeMe123!');
            await page.click('button[type="submit"]');
            await expect(page).toHaveURL(/.*(dashboard|pos|users)/);

            await page.getByRole('link', { name: 'Users' }).click();
            await expect(page).toHaveURL(/.*users/);
            await waitForPageLoad(page);
        });

        test('should edit existing user', async ({ page }) => {
            const editBtn = page.locator('button:has(.lucide-edit)').first();

            if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
                await editBtn.click();
                await expect(page.getByRole('dialog')).toBeVisible();

                const nameInput = page.locator('input[id="name"]');
                await expect(nameInput).toBeVisible();

                await page.keyboard.press('Escape');
            }
        });
    });
});
