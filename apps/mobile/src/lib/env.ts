import Constants from 'expo-constants';

interface AmivaExtra {
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;
  googlePlacesApiKey?: string;
  googleOAuthClientId?: string;
  facebookAppId?: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as AmivaExtra;

/** Centralized, typed access to env-derived config (app.config.js `extra`).
 * Nothing else in the app should read `Constants.expoConfig.extra`
 * directly — keeps every consumer decoupled from *how* config is
 * injected. */
export const env = {
  firebase: {
    apiKey: extra.firebaseApiKey ?? '',
    authDomain: extra.firebaseAuthDomain ?? '',
    projectId: extra.firebaseProjectId ?? '',
    storageBucket: extra.firebaseStorageBucket ?? '',
    messagingSenderId: extra.firebaseMessagingSenderId ?? '',
    appId: extra.firebaseAppId ?? '',
  },
  googlePlacesApiKey: extra.googlePlacesApiKey ?? '',
  googleOAuthClientId: extra.googleOAuthClientId ?? '',
  facebookAppId: extra.facebookAppId ?? '',
};
