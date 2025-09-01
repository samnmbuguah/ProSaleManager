import bcrypt from 'bcryptjs';

// Test user data following SOLID principles
// Single Responsibility: Each function creates one type of test data
// Open/Closed: Easy to extend with new user types
// Interface Segregation: Only exposes what tests need

export interface TestUser {
    name: string;
    email: string;
    password: string;
    role: 'super_admin' | 'admin' | 'manager' | 'sales';
    store_id?: number;
    is_active?: boolean;
}

export interface TestUserWithId extends TestUser {
    id: number;
}

export interface TestUserWithPreferences extends TestUserWithId {
    preferences: {
        dark_mode: boolean;
        notifications: boolean;
        language: string;
        theme: string;
        timezone: string;
    };
}

// Factory functions for creating test users
export const createTestUser = (overrides: Partial<TestUser> = {}): TestUser => ({
    name: "Test User",
    email: `test${Date.now()}@example.com`,
    password: "testpass123",
    role: "sales",
    store_id: 1,
    is_active: true,
    ...overrides
});

export const createSuperAdminUser = (overrides: Partial<TestUser> = {}): TestUser => ({
    name: "Test Super Admin",
    email: `superadmin${Date.now()}@example.com`,
    password: "testpass123",
    role: "super_admin",
    is_active: true,
    ...overrides
});

export const createAdminUser = (overrides: Partial<TestUser> = {}): TestUser => ({
    name: "Test Admin",
    email: `admin${Date.now()}@example.com`,
    password: "testpass123",
    role: "admin",
    store_id: 1,
    is_active: true,
    ...overrides
});

export const createManagerUser = (overrides: Partial<TestUser> = {}): TestUser => ({
    name: "Test Manager",
    email: `manager${Date.now()}@example.com`,
    password: "testpass123",
    role: "manager",
    store_id: 1,
    is_active: true,
    ...overrides
});

export const createSalesUser = (overrides: Partial<TestUser> = {}): TestUser => ({
    name: "Test Sales",
    email: `sales${Date.now()}@example.com`,
    password: "testpass123",
    role: "sales",
    store_id: 1,
    is_active: true,
    ...overrides
});

// Pre-existing seeded users for testing - matching development database
export const SEEDED_USERS = {
    superAdmin: {
        name: "Super Admin",
        email: "superadmin@prosale.com",
        password: "superadmin123",
        role: "super_admin" as const,
        is_active: true
    },
    admin: {
        name: "Eltee Admin",
        email: "eltee.admin@prosale.com",
        password: "elteeadmin123",
        role: "admin" as const,
        store_id: 1,
        is_active: true
    },
    sales: {
        name: "Eltee Cashier",
        email: "eltee.cashier@prosale.com",
        password: "eltee123",
        role: "sales" as const,
        store_id: 1,
        is_active: true
    }
};

// Helper function to hash passwords for testing
export const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 10);
};

// Helper function to create user with hashed password
export const createTestUserWithHash = async (overrides: Partial<TestUser> = {}): Promise<TestUser> => {
    const user = createTestUser(overrides);
    return {
        ...user,
        password: await hashPassword(user.password)
    };
};

// Test user preferences
export const createTestUserPreferences = (overrides = {}) => ({
    dark_mode: false,
    notifications: true,
    language: "english",
    theme: "default",
    timezone: "UTC",
    ...overrides
});

// Role-based test data
export const ROLE_TEST_DATA = {
    super_admin: {
        canManageUsers: true,
        canManageStores: true,
        canAccessAllData: true,
        canManageSystem: true
    },
    admin: {
        canManageUsers: true,
        canManageStores: false,
        canAccessAllData: false,
        canManageSystem: false
    },
    manager: {
        canManageUsers: false,
        canManageStores: false,
        canAccessAllData: false,
        canManageSystem: false
    },
    sales: {
        canManageUsers: false,
        canManageStores: false,
        canAccessAllData: false,
        canManageSystem: false
    }
};
