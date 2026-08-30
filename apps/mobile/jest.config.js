/**
 * Plain ts-jest, matching packages/core and functions — not the jest-expo
 * preset. None of our current tests render React Native components (no
 * @testing-library/react-native yet), only repository/logic tests, so we
 * don't need jest-expo's native-bridge simulation — and that simulation
 * broke outright under Expo SDK 54's jest-expo preset. If component
 * rendering tests get added later, jest-expo may be worth revisiting for
 * those specifically.
 */
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // No `roots` override (unlike packages/core and functions) — this
  // project's manual mock lives at <rootDir>/__mocks__/firebase/firestore.ts,
  // and Jest only auto-discovers manual mocks for node_modules packages
  // under whatever `roots` covers. Restricting roots to src/ (as the
  // other two workspaces do) silently breaks that discovery.
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
};
