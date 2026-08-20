/**
 * Ambient augmentation closing a real gap in Firebase's own type
 * publishing (verified against node_modules, not guessed):
 * `getReactNativePersistence` genuinely exists at runtime —
 * `firebase/auth`'s JS build is a live re-export, `export * from
 * '@firebase/auth'`, and Metro's package-exports resolution (Expo enables
 * the "react-native" condition by default) correctly reaches
 * `@firebase/auth`'s RN build, which includes it
 * (@firebase/auth/dist/rn/index.rn.d.ts).
 *
 * But both `firebase` and `@firebase/auth` list an unconditional "types"
 * entry *ahead of* their platform-specific conditions in package.json
 * `exports`, so TypeScript's declaration resolution always lands on the
 * generic (non-RN) .d.ts and never sees this symbol, regardless of
 * `customConditions` in tsconfig.json. This one-function augmentation is
 * the minimal fix; safe to delete once Firebase publishes RN-aware types
 * for the top-level `firebase` package.
 *
 * The `import` below is required, not decorative: without a top-level
 * import/export, this file is a global *script*, and `declare module`
 * inside one defines a brand-new ambient module — silently shadowing
 * every real export of 'firebase/auth' instead of merging with them.
 */
import 'firebase/auth';

declare module 'firebase/auth' {
  interface ReactNativeAsyncStorage {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }

  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
