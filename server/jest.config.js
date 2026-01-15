/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/config/database.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
      testPathIgnorePatterns: ['<rootDir>/src/__tests__/integration/'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/**/*.int.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/integration.setup.ts'],
    },
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  clearMocks: true,
  verbose: true,
}
