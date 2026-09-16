/**
 * Root-level test runner.
 *
 * Each package owns its own test suite (server, client, mobile-admin,
 * mobile-client). This root config only runs the cross-cutting tests under
 * `tests/` (feature-parity checks). It is deliberately lean:
 *   - ts-jest in CommonJS mode with `isolatedModules` so it does not type-check
 *     the entire monorepo (which previously caused out-of-memory crashes).
 *   - no coverage collection here; each package reports its own coverage.
 *
 * Playwright specs live under tests/e2e and run via `npm run test:e2e`.
 */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      isolatedModules: true,
      diagnostics: false,
      tsconfig: {
        module: 'CommonJS',
        target: 'ES2020',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        jsx: 'react-jsx',
        skipLibCheck: true,
      },
    }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testTimeout: 30000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/build/',
    '<rootDir>/tests/e2e/' // Playwright specs — run via `npm run test:e2e`
  ],
  moduleDirectories: ['node_modules'],
  forceExit: true,
};
