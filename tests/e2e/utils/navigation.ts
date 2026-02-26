import { Page, expect } from '@playwright/test';

/**
 * Route names that match the UI navigation labels
 */
export const ROUTES = {
    pos: 'POS',
    inventory: 'Inventory',
    customers: 'Customers',
    sales: 'Sales',
    reports: 'Reports',
    expenses: 'Expenses',
    favorites: 'Favorites',
    users: 'Users',
} as const;

export type RouteName = keyof typeof ROUTES;

/**
 * Navigate to a page via UI click (preserves store context)
 */
export async function navigateTo(page: Page, route: RouteName): Promise<void> {
    const linkName = ROUTES[route];
    await page.getByRole('link', { name: linkName }).click();
    await expect(page).toHaveURL(new RegExp(`.*${route}`));
    await waitForPageLoad(page);
}

/**
 * Wait for page loading to complete (spinner to disappear)
 */
export async function waitForPageLoad(page: Page): Promise<void> {
    // Wait for any loading spinners to disappear
    const spinner = page.locator('.animate-spin');
    if (await spinner.isVisible({ timeout: 500 }).catch(() => false)) {
        await expect(spinner).not.toBeVisible({ timeout: 10000 });
    }
}

/**
 * Wait for a specific text to be visible
 */
export async function waitForText(page: Page, text: string | RegExp): Promise<void> {
    await expect(page.getByText(text)).toBeVisible({ timeout: 10000 });
}

/**
 * Go to a specific tab within a page
 */
export async function selectTab(page: Page, tabName: string): Promise<void> {
    await page.getByText(tabName).click();
    await waitForPageLoad(page);
}
