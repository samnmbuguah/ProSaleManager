import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
import { FRONTEND_URL, TEST_USERNAME, TEST_PASSWORD } from './config';

export async function getDriver(): Promise<WebDriver> {
  const options = new ChromeOptions();
  if (process.env.HEADLESS === 'true') {
    options.addArguments('--headless');
  }
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  
  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
}

export async function login(driver: WebDriver): Promise<void> {
  await driver.get(`${FRONTEND_URL}/auth`);
  
  // Wait for and fill in email
  const emailInput = await driver.wait(until.elementLocated(By.id('email')), 10000);
  await emailInput.sendKeys('superadmin@prosale.com');
  
  // Wait for and fill in password
  const passwordInput = await driver.wait(until.elementLocated(By.id('password')), 10000);
  await passwordInput.sendKeys('superadmin123');
  
  // Find and click the login button
  const loginButton = await driver.findElement(By.xpath("//button[contains(text(), 'Login')]"));
  await loginButton.click();
  
  // Wait for navigation to complete
  await driver.wait(until.urlContains('/pos'), 10000);
}

export async function waitForElement(driver: WebDriver, selector: string, timeout = 10000) {
  return await driver.wait(until.elementLocated(By.css(selector)), timeout);
}

export async function waitForText(driver: WebDriver, text: string, timeout = 5000) {
    return await driver.wait(until.elementLocated(By.xpath(`//*[contains(text(), '${text}')]`)), timeout);
}

export async function clickElement(driver: WebDriver, selector: string) {
    const element = await waitForElement(driver, selector);
    await element.click();
}

export async function typeText(driver: WebDriver, selector: string, text: string) {
    const element = await waitForElement(driver, selector);
    await element.clear();
    await element.sendKeys(text);
}

export async function getText(driver: WebDriver, selector: string) {
    const element = await waitForElement(driver, selector);
    return await element.getText();
}

export async function isElementVisible(driver: WebDriver, selector: string) {
    try {
        const element = await waitForElement(driver, selector);
        return await element.isDisplayed();
    } catch {
        return false;
    }
} 