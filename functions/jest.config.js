/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  // @amiva/core isn't a declared dependency here (see package.json's
  // "build" script comment) — ts-jest's own tsconfig "paths" only affects
  // type-checking, not Jest's runtime module resolution, so it needs this
  // separate mapping too.
  moduleNameMapper: {
    '^@amiva/core$': '<rootDir>/../packages/core/src/index.ts',
  },
};
