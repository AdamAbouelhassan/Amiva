/**
 * Test-only ambient augmentation for the manual Jest mock at
 * __mocks__/firebase/firestore.ts. Test files import its `__reset` /
 * `__seed` / `__getRaw` helpers via the *same* `firebase/firestore`
 * specifier that `jest.mock('firebase/firestore')` swaps at runtime —
 * importing them via a separate relative path instead would resolve to a
 * second, disconnected module instance (different `__store`), which is
 * exactly the bug this file avoids. Same augmentation trick as
 * firebase-auth-rn.d.ts, and same reason for the otherwise-unused import.
 */
import 'firebase/firestore';

declare module 'firebase/firestore' {
  export function __reset(): void;
  export function __seed(collectionName: string, id: string, data: Record<string, unknown>): void;
  export function __getRaw(collectionName: string, id: string): Record<string, unknown> | undefined;
}
