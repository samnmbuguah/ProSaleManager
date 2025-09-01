// Fix supertest import for ESM compatibility - try different approach
import supertest from 'supertest';
import app from '../../server/src/app.js';
import { SEEDED_USERS } from '../fixtures/users.js';

// Authentication utilities following SOLID principles
// Single Responsibility: Each function handles one authentication concern
// Open/Closed: Easy to extend with new authentication methods
// Interface Segregation: Only exposes what tests need

export interface AuthToken {
    token: string;
    user: {
        id: number;
        email: string;
        role: string;
    };
}

export interface TestAuthContext {
    superAdmin: AuthToken;
    admin: AuthToken;
    sales: AuthToken;
}

// Authenticate a user and return their token
export const authenticateUser = async (email: string, password: string): Promise<AuthToken> => {
    const response = await supertest(app)
        .post('/api/auth/login')
        .send({ email, password });

    if (response.status !== 200) {
        throw new Error(`Authentication failed: ${response.status} - ${JSON.stringify(response.body)}`);
    }

    const token = response.body.token || '';

    if (!token) {
        throw new Error('No authentication token received');
    }

    return {
        token,
        user: {
            id: response.body.data.id,
            email: response.body.data.email,
            role: response.body.data.role
        }
    };
};

// Authenticate using seeded users
export const authenticateSeededUser = async (role: keyof typeof SEEDED_USERS): Promise<AuthToken> => {
    const user = SEEDED_USERS[role];
    return await authenticateUser(user.email, user.password);
};

// Authenticate all seeded users for comprehensive testing
export const authenticateAllUsers = async (): Promise<TestAuthContext> => {
    const [superAdmin, admin, sales] = await Promise.all([
        authenticateSeededUser('superAdmin'),
        authenticateSeededUser('admin'),
        authenticateSeededUser('sales')
    ]);

    return { superAdmin, admin, sales };
};

// Create authenticated request helper - fixed for ESM compatibility
export const createAuthenticatedRequest = (token: string) => {
    // Use the correct supertest import method
    return supertest(app).set('Authorization', `Bearer ${token}`);
};

// Test authorization for different roles
export const testRoleAuthorization = async (
    endpoint: string,
    method: 'get' | 'post' | 'put' | 'delete',
    authTokens: TestAuthContext,
    expectedResults: {
        superAdmin: number;
        admin: number;
        sales: number;
    }
) => {
    const testCases = [
        { role: 'superAdmin', token: authTokens.superAdmin.token, expected: expectedResults.superAdmin },
        { role: 'admin', token: authTokens.admin.token, expected: expectedResults.admin },
        { role: 'sales', token: authTokens.sales.token, expected: expectedResults.sales }
    ];

    for (const testCase of testCases) {
        const response = await createAuthenticatedRequest(testCase.token)[method](endpoint);

        expect(response.status).toBe(testCase.expected);

        if (testCase.expected === 200 || testCase.expected === 201) {
            expect(response.body.success).toBe(true);
        }
    }
};

// Test unauthorized access
export const testUnauthorizedAccess = async (
    endpoint: string,
    method: 'get' | 'post' | 'put' | 'delete',
    data?: any
) => {
    const response = await supertest(app)[method](endpoint).send(data);
    expect(response.status).toBe(401);
};

// Test forbidden access for specific roles
export const testForbiddenAccess = async (
    endpoint: string,
    method: 'get' | 'post' | 'put' | 'delete',
    token: string,
    data?: any
) => {
    const response = await createAuthenticatedRequest(token)[method](endpoint).send(data);
    expect(response.status).toBe(403);
};

// Helper to create test users with authentication
export const createAndAuthenticateUser = async (
    userData: any,
    role: 'super_admin' | 'admin' | 'manager' | 'sales'
): Promise<AuthToken> => {
    // First create the user
    const createResponse = await supertest(app)
        .post('/api/users')
        .set('Cookie', [userData.token])
        .send(userData);

    if (createResponse.status !== 201) {
        throw new Error(`Failed to create user: ${createResponse.status}`);
    }

    // Then authenticate the new user
    return await authenticateUser(userData.email, userData.password);
};

// Cleanup helper for test data
export const cleanupTestUsers = async (userIds: number[], adminToken: string) => {
    for (const userId of userIds) {
        await createAuthenticatedRequest(adminToken)
            .delete(`/api/users/${userId}`);
    }
};

// Test middleware authentication
export const testMiddlewareAuthentication = async (
    endpoint: string,
    method: 'get' | 'post' | 'put' | 'delete',
    expectedUnauthorizedStatus: number = 401
) => {
    // Test without authentication
    const unauthorizedResponse = await supertest(app)[method](endpoint);
    expect(unauthorizedResponse.status).toBe(expectedUnauthorizedStatus);

    // Test with invalid token
    const invalidTokenResponse = await supertest(app)[method](endpoint)
        .set('Cookie', ['token=invalid-token']);
    expect(invalidTokenResponse.status).toBe(expectedUnauthorizedStatus);
};

// Test role-based middleware
export const testRoleMiddleware = async (
    endpoint: string,
    method: 'get' | 'post' | 'put' | 'delete',
    requiredRoles: string[],
    authTokens: TestAuthContext
) => {
    const testCases = [
        { role: 'superAdmin', token: authTokens.superAdmin.token, shouldAllow: true },
        { role: 'admin', token: authTokens.admin.token, shouldAllow: requiredRoles.includes('admin') || requiredRoles.includes('super_admin') },
        { role: 'sales', token: authTokens.sales.token, shouldAllow: requiredRoles.includes('sales') || requiredRoles.includes('admin') || requiredRoles.includes('super_admin') }
    ];

    for (const testCase of testCases) {
        const response = await createAuthenticatedRequest(testCase.token)[method](endpoint);

        if (testCase.shouldAllow) {
            expect(response.status).not.toBe(403);
        } else {
            expect(response.status).toBe(403);
        }
    }
};
