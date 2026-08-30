/**
 * Dynamic Expo config so Firebase/Google Places credentials come from env
 * vars (not committed) rather than being hardcoded into app.json. Read at
 * runtime via `expo-constants`'s `expoConfig.extra` (see
 * src/lib/env.ts).
 */
module.exports = {
  expo: {
    name: 'Amiva',
    slug: 'amiva',
    version: '0.1.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    icon: './assets/icon.png',
    splash: {
      // Was relying on Expo Go's implicit "no splash.image -> fall back to
      // the app icon" behavior, which is why this used to be the old
      // placeholder teal-square icon.png full-bleed. Now explicit, using
      // the real icon (assets/icon.png), contained on the theme's
      // off-white background (theme/colors.ts's `background`) instead of
      // stretched to fill the screen.
      image: './assets/icon.png',
      resizeMode: 'contain',
      backgroundColor: '#FAF7F2',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.amiva.app',
    },
    android: {
      package: 'com.amiva.app',
      adaptiveIcon: {
        backgroundColor: '#FAF7F2',
      },
    },
    plugins: ['expo-image-picker', 'expo-asset'],
    extra: {
      firebaseApiKey: process.env.AMIVA_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.AMIVA_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.AMIVA_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.AMIVA_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.AMIVA_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.AMIVA_FIREBASE_APP_ID,
      googlePlacesApiKey: process.env.AMIVA_GOOGLE_PLACES_API_KEY,
      googleOAuthClientId: process.env.AMIVA_GOOGLE_OAUTH_CLIENT_ID,
      facebookAppId: process.env.AMIVA_FACEBOOK_APP_ID,
    },
  },
};
