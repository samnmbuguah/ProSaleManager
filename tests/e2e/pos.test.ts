import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
import { getDriver, login, waitForElement } from './helpers';
import { FRONTEND_URL } from './config';

describe('POS Page Tests', () => {
    let driver: WebDriver;

    beforeAll(async () => {
        driver = await getDriver();
        await login(driver);
        // Wait for a unique POS page element
        await waitForElement(driver, '[data-testid="product-search"]');
    });

    afterAll(async () => {
        await driver.quit();
    });

    beforeEach(async () => {
        await driver.get(`${FRONTEND_URL}/pos`);
        await waitForElement(driver, '[data-testid="product-search"]');
    });

    test('should load POS page', async () => {
        const searchInput = await waitForElement(driver, '[data-testid="product-search"]');
        expect(await searchInput.isDisplayed()).toBe(true);
    });

    test('should search for products', async () => {
        const searchInput = await waitForElement(driver, '[data-testid="product-search"]');
        await searchInput.sendKeys('Test Product');
        await driver.findElement(By.css('[data-testid="search-button"]')).click();
        // Wait for search results
        await waitForElement(driver, '[data-testid="product-grid"]');
    });

    test('should add product to cart', async () => {
        // Wait for products to load
        await waitForElement(driver, '[data-testid="product-grid"]');
        // Click first product
        const firstProduct = await driver.findElement(By.css('[data-testid="product-card"]'));
        await firstProduct.click();
        // Verify cart has items
        const cartItems = await driver.findElements(By.css('[data-testid="cart-item"]'));
        expect(cartItems.length).toBeGreaterThan(0);
    });

    test('should complete checkout process', async () => {
        // Add product to cart
        await waitForElement(driver, '[data-testid="product-grid"]');
        const firstProduct = await driver.findElement(By.css('[data-testid="product-card"]'));
        await firstProduct.click();
        // Click checkout button
        await driver.findElement(By.css('[data-testid="checkout-button"]')).click();
        // Fill payment details
        await waitForElement(driver, '[data-testid="payment-dialog"]');
        await driver.findElement(By.css('[data-testid="payment-method-cash"]')).click();
        // Complete checkout
        await driver.findElement(By.css('[data-testid="complete-checkout"]')).click();
        // Verify success
        await waitForElement(driver, '[data-testid="success-message"]');
    });

    test('should add delivery service', async () => {
        // Add a product first
        const productCard = await waitForElement(driver, '[data-testid="product-card"]');
        await productCard.click();
        // Click add delivery button
        const deliveryButton = await driver.findElement(By.xpath('//button[contains(text(), "Add Delivery")]'));
        await deliveryButton.click();
        // Check if delivery service appears in cart
        const deliveryItem = await driver.wait(
            until.elementLocated(By.xpath('//div[contains(text(), "Delivery Service")]')),
            5000
        );
        expect(await deliveryItem.isDisplayed()).toBe(true);
    });
}); 