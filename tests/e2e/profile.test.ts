import { Builder, By, until, WebDriver } from "selenium-webdriver";
import { Options as ChromeOptions } from "selenium-webdriver/chrome";
import { login, waitForElement } from "./helpers";
import { FRONTEND_URL } from "./config";

describe("Profile Page Tests", () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(new ChromeOptions())
      .build();

    // Login first
    await login(driver);

    // Navigate to profile page
    await driver.get(`${FRONTEND_URL}/profile`);
    // Wait for a unique element on the profile page
    await waitForElement(driver, "input#name");
  }, 60000);

  afterAll(async () => {
    await driver.quit();
  });

  it("should load profile page", async () => {
    const title = await waitForElement(driver, "h1");
    const titleText = await title.getText();
    expect(titleText).toContain("User Profile");
  });

  it("should update profile information", async () => {
    // Fill in profile form
    const nameInput = await waitForElement(driver, "input#name");
    await nameInput.clear();
    await nameInput.sendKeys("Test User");

    const emailInput = await waitForElement(driver, "input#email");
    await emailInput.clear();
    await emailInput.sendKeys("test@example.com");

    // Click save button
    const saveButton = await driver.findElement(
      By.xpath("//button[contains(text(), 'Save Changes')]"),
    );
    await saveButton.click();

    // Wait for success message
    const successMessage = await waitForElement(driver, ".text-green-600");
    const messageText = await successMessage.getText();
    expect(messageText).toContain("Profile updated successfully");
  });

  it("should change password", async () => {
    // Fill in password form
    const currentPasswordInput = await waitForElement(
      driver,
      'input[name="currentPassword"]',
    );
    await currentPasswordInput.sendKeys("admin123");

    const newPasswordInput = await waitForElement(
      driver,
      'input[name="newPassword"]',
    );
    await newPasswordInput.sendKeys("newpassword123");

    const confirmPasswordInput = await waitForElement(
      driver,
      'input[name="confirmPassword"]',
    );
    await confirmPasswordInput.sendKeys("newpassword123");

    // Click change password button
    const changePasswordButton = await driver.findElement(
      By.xpath("//button[contains(text(), 'Change Password')]"),
    );
    await changePasswordButton.click();

    // Wait for success message
    const successMessage = await waitForElement(driver, ".text-green-600");
    const messageText = await successMessage.getText();
    expect(messageText).toContain("Password changed successfully");
  });

  it("should update preferences", async () => {
    // Toggle dark mode
    const darkModeSwitch = await waitForElement(
      driver,
      'input[type="checkbox"][name="darkMode"]',
    );
    await darkModeSwitch.click();

    // Toggle notifications
    const notificationsSwitch = await waitForElement(
      driver,
      'input[type="checkbox"][name="notifications"]',
    );
    await notificationsSwitch.click();

    // Select language
    const languageSelect = await waitForElement(
      driver,
      'select[name="language"]',
    );
    await languageSelect.click();
    const englishOption = await driver.findElement(
      By.xpath("//option[contains(text(), 'English')]"),
    );
    await englishOption.click();

    // Click save preferences button
    const savePreferencesButton = await driver.findElement(
      By.xpath("//button[contains(text(), 'Save Preferences')]"),
    );
    await savePreferencesButton.click();

    // Wait for success message
    const successMessage = await waitForElement(driver, ".text-green-600");
    const messageText = await successMessage.getText();
    expect(messageText).toContain("Preferences updated successfully");
  });
});
