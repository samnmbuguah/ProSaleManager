# Test Strategy & Feature Documentation

This document outlines the testing strategy for ProSaleManager, covering all application features including the recently added stock management and expense automation.

## Testing Architecture

We will use a hybrid approach:

1. **Backend Integration Tests**: Testing API endpoints directly using `supertest` (or similar) to ensure logic correctness (calculations, database state, permissions).
2. **End-to-End (E2E) Tests**: Using **Playwright** to test critical user flows from the frontend.

## Feature Coverage

### 1. Authentication & Authorization

* **Login**: Successful login with Admin, Manager, Cashier roles.
* **Role Protection**: Verify restricted areas (e.g., Settings, Reports) are inaccessible to Cashiers.
* **Session Management**: Token invalidation and expiry.

### 2. Product Management

* **CRUD**: Create, Read, Update, Delete products.
* **Pricing**: Verify logic for piece, pack, and dozen pricing.
* **Stock Tracking**: Ensure sales reduce stock correctly.

### 3. Sales & POS

* **Cart Operations**: Add items (piece/pack/dozen), update quantities, remove items.
* **Checkout**:
  * **Cash Payment**: Standard flow.
  * **Split Payment**: Partial Cash + M-Pesa.
  * **"Paid to Byc"**: Verify this specific payment method works and is recorded correctly.
* **Receipts**: Verify receipt generation data.

### 4. Expenses (Overhauled)

* **CRUD**: Create, Edit, Delete expenses.
* **Auto-Delivery Expense**:
  * *Scenario*: Create a sale with a delivery fee.
  * *Expectation*: An expense record is automatically created with category "Delivery" and the correct amount.
* **Date Filtering**:
  * *Scenario*: User selects a custom date range in the UI.
  * *Expectation*: Expense list is filtered to show only records within that range.

### 5. Inventory & Stock Management (New)

* **Quick Receive Stock**:
  * *Scenario*: Use the "Quick Receive" dialog to add stock.
  * *Expectation*: Product quantity increases, prices interactively update (if changed), and a `StockLog` entry is created.
* **Stock Value Reporting**:
  * *Scenario*: Navigate to "Reports" -> "Stock Value".
  * *Expectation*: Correct total value and list of stock additions are displayed for the selected period.

### 6. Reports

* **Sales Summary**: Verify totals match actual sales.
* **Stock Value**: Verify the new stock value report data.

## Implementation Plan

1. **Setup**: Install Playwright and configure test runner.
2. **Backend Helpers**: Create utilities for seeding the DB (reusing existing seeders where possible).
3. **Test Suites**:
    * `auth.spec.ts`: Login flows.
    * `pos_checkout.spec.ts`: Full sale lifecycle (including "Paid to Byc").
    * `inventory.spec.ts`: Stock reception and verification.
    * `expenses.spec.ts`: Manual creation and auto-delivery logic.
