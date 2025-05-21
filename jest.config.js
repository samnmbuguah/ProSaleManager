export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/e2e/**/*.test.ts'],
    setupFiles: ['<rootDir>/tests/e2e/setup.ts'],
    testTimeout: 30000,
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            useESM: true,
        }]
    },
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    }
}; 