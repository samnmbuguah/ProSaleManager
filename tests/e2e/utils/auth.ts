import { Page, expect } from '@playwright/test';

/**
 * Credentials for different user roles
 */
export const CREDENTIALS = {
    admin: {
        email: 'demo.admin@example.com',
        password: 'ChangeMe123!',
    },
    superAdmin: {
        email: 'demo.superadmin@example.com',
        password: 'ChangeMe123!',
    },
    sales: {
        email: 'demo.sales@example.com',
        password: 'ChangeMe123!',
    },
    manager: {
        email: 'demo.manager@example.com',
        password: 'ChangeMe123!',
    },
} as const;

export type UserRole = keyof typeof CREDENTIALS;

/**
 * Login as a specific user role
 */
export async function loginAs(page: Page, role: UserRole): Promise<void> {
    const creds = CREDENTIALS[role];

    await page.goto('/auth');
    await page.fill('input[type="email"]', creds.email);
    await page.fill('input[type="password"]', creds.password);
    await page.click('button[type="submit"]');

    // Wait for redirect (different roles redirect to different pages)
    await expect(page).toHaveURL(/.*(dashboard|pos|users)/, { timeout: 10000 });
}

/**
 * Logout current user
 */
export async function logout(page: Page): Promise<void> {
    // Click the logout button in the nav
    await page.locator('button:has(.lucide-log-out)').click();
    await expect(page).toHaveURL(/.*auth/);
}

/**
 * Quick login helper functions
 */
export const loginAsAdmin = (page: Page) => loginAs(page, 'admin');
export const loginAsSuperAdmin = (page: Page) => loginAs(page, 'superAdmin');
export const loginAsSales = (page: Page) => loginAs(page, 'sales');
export const loginAsManager = (page: Page) => loginAs(page, 'manager');
