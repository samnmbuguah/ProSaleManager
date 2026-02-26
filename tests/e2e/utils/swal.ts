import { Page } from '@playwright/test';

/**
 * Dismiss any visible SweetAlert popup by clicking the confirm/OK button
 */
export async function dismissSwal(page: Page): Promise<void> {
    const swalButton = page.locator('.swal2-confirm');
    if (await swalButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await swalButton.click();
        // Wait for Swal to animate out
        await page.waitForTimeout(500);
    }
}

/**
 * Click confirm on a SweetAlert confirmation dialog
 */
export async function confirmSwal(page: Page): Promise<void> {
    const swalConfirm = page.locator('.swal2-confirm');
    await swalConfirm.waitFor({ state: 'visible', timeout: 5000 });
    await swalConfirm.click();
    await page.waitForTimeout(500);
}

/**
 * Click cancel on a SweetAlert confirmation dialog
 */
export async function cancelSwal(page: Page): Promise<void> {
    const swalCancel = page.locator('.swal2-cancel');
    await swalCancel.waitFor({ state: 'visible', timeout: 5000 });
    await swalCancel.click();
    await page.waitForTimeout(500);
}

/**
 * Wait for any Swal to auto-close or be dismissed
 */
export async function waitForSwalClose(page: Page, timeout = 5000): Promise<void> {
    const swalContainer = page.locator('.swal2-container');
    if (await swalContainer.isVisible({ timeout: 1000 }).catch(() => false)) {
        await swalContainer.waitFor({ state: 'hidden', timeout });
    }
}
