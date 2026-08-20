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
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { env } from '../lib/env';

const app = getApps().length > 0 ? getApp() : initializeApp(env.firebase);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
