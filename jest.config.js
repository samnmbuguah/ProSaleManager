/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            useESM: true,
        }],
    },
    setupFilesAfterEnv: ['<rootDir>/server/src/__tests__/setup.ts'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    moduleDirectories: ['node_modules', 'server/src'],
    rootDir: '.',
    testTimeout: 30000,
    globals: {
        'ts-jest': {
            useESM: true,
        },
    },
}; 