/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.int.test.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/index.ts',
        '!src/config/database.ts',
        '!src/**/*.d.ts',
    ],
    coverageDirectory: 'coverage-integration',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/integration.setup.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^uuid$': '<rootDir>/src/__tests__/__mocks__/uuid.ts',
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(uuid)/)',
    ],
    clearMocks: true,
    verbose: true,
    testTimeout: 30000,
    maxWorkers: 1,
}
