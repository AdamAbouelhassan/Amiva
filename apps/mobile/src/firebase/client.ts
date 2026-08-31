/**
 * Single Firebase client SDK initialization. Everything else (repositories,
 * auth hooks) imports `auth` / `db` / `storage` / `functions` from here —
 * nothing else calls `initializeApp`.
 *
 * Uses the Firebase JS SDK (not @react-native-firebase) since this is an
 * Expo managed-workflow app (technical_specification.md §1) — the JS SDK
 * works in Expo Go / EAS builds with no native config beyond the env vars
 * in app.config.js.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { env } from '../lib/env';

const firstInit = getApps().length === 0;
const app = firstInit ? initializeApp(env.firebase) : getApp();

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
// `ignoreUndefinedProperties` so repositories can pass sparse patch objects
// (e.g. a trip with no city) to setDoc/updateDoc without each call having to
// strip `undefined` fields itself — the JS SDK otherwise throws on them.
export const db = firstInit
  ? initializeFirestore(app, { ignoreUndefinedProperties: true })
  : getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
