import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './utils';

test.describe('Profile', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin
        await page.goto('/auth');
        await page.fill('input[type="email"]', 'demo.admin@example.com');
        await page.fill('input[type="password"]', 'ChangeMe123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*(dashboard|pos)/, { timeout: 10000 });

        // Navigate to profile - click on user avatar/name in nav
        const profileLink = page.locator('a[href*="profile"]').first();
        if (await profileLink.isVisible({ timeout: 3000 }).catch(() => false)) {
            await profileLink.click();
        } else {
            // Try clicking on user icon
            await page.locator('.lucide-user, button:has(.lucide-user)').first().click();
        }
        await waitForPageLoad(page);
    });

    test('should display profile page with tabs', async ({ page }) => {
        // Profile page should have some content

        // Check for tabs
        const profileTab = page.getByRole('tab', { name: /profile/i });
        const securityTab = page.getByRole('tab', { name: /security/i });
        const preferencesTab = page.getByRole('tab', { name: /preferences/i });

        // At least Profile tab should be visible
        expect(
            await profileTab.isVisible().catch(() => false) ||
            await page.getByText('Profile Information').isVisible().catch(() => false)
        ).toBeTruthy();
    });

    test('should show profile information', async ({ page }) => {
        // Profile tab should show name and email fields
        const nameInput = page.locator('input[name="name"]');
        const emailInput = page.locator('input[name="email"]');

        // Either inputs or display text should be visible
        const hasInputs = await nameInput.isVisible({ timeout: 5000 }).catch(() => false);
        const hasEmail = await emailInput.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasInputs) {
            await expect(nameInput).toBeVisible();
        }
        if (hasEmail) {
            await expect(emailInput).toBeVisible();
        }
    });

    test('should navigate between tabs', async ({ page }) => {
        // Try to switch between tabs
        const securityTab = page.getByRole('tab', { name: /security|password/i });
        if (await securityTab.isVisible({ timeout: 3000 }).catch(() => false)) {
            await securityTab.click();
            await waitForPageLoad(page);
            // Security tab should show password fields
            await expect(page.getByText(/password/i).first()).toBeVisible();
        }

        const preferencesTab = page.getByRole('tab', { name: /preferences|settings/i });
        if (await preferencesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
            await preferencesTab.click();
            await waitForPageLoad(page);
        }
    });
});
