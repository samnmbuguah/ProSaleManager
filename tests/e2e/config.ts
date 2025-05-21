import { Builder, Browser } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
export const TEST_USERNAME = process.env.TEST_USERNAME || 'test@example.com';
export const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';
export const HEADLESS = process.env.HEADLESS === 'true';

export const config = {
    baseUrl: FRONTEND_URL,
    testUser: {
        username: TEST_USERNAME,
        password: TEST_PASSWORD
    },
    headless: HEADLESS
};

export async function createDriver() {
    const options = new chrome.Options();
    
    if (config.headless) {
        options.addArguments('--headless');
    }
    
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1920,1080');
    
    const driver = await new Builder()
        .forBrowser(Browser.CHROME)
        .setChromeOptions(options)
        .build();
    
    await driver.manage().setTimeouts({ implicit: 10000 });
    
    return driver;
} 