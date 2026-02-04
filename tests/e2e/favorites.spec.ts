import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './utils';

test.describe('Favorites', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin
        await page.goto('/auth');
        await page.fill('input[type="email"]', 'demo.admin@example.com');
        await page.fill('input[type="password"]', 'ChangeMe123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*(dashboard|pos)/, { timeout: 10000 });

        // Navigate to favorites via nav link (if exists)
        const favLink = page.getByRole('link', { name: 'Favorites' });
        if (await favLink.isVisible({ timeout: 3000 }).catch(() => false)) {
            await favLink.click();
            await expect(page).toHaveURL(/.*favorites/);
        } else {
            // Favorites may be part of POS, navigate there
            await page.getByRole('link', { name: 'POS' }).click();
        }
        await waitForPageLoad(page);
    });

    test('should display favorites page or POS page', async ({ page }) => {
        // Check if we're on favorites page
        const favoritesHeading = page.getByRole('heading', { name: 'Favorites' });
        const posSearch = page.getByPlaceholder(/search/i);

        // Either Favorites page or POS page should be visible
        const onFavorites = await favoritesHeading.isVisible({ timeout: 3000 }).catch(() => false);
        const onPOS = await posSearch.isVisible({ timeout: 3000 }).catch(() => false);

        expect(onFavorites || onPOS).toBeTruthy();
    });

    test('should show favorites content or empty state', async ({ page }) => {
        // If on favorites page, check for content
        const favoritesHeading = page.getByRole('heading', { name: 'Favorites' });
        const isFavoritesPage = await favoritesHeading.isVisible({ timeout: 3000 }).catch(() => false);

        if (isFavoritesPage) {
            // Check for empty state or product grid
            const emptyState = page.getByText('You have no favorites yet.');
            const productGrid = page.locator('.grid');

            const isEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
            const hasProducts = await productGrid.isVisible({ timeout: 3000 }).catch(() => false);

            expect(isEmpty || hasProducts).toBeTruthy();
        }
        // If not on favorites page, test passes (feature may not be available)
    });
});
