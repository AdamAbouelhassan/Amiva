/**
 * Dynamic Expo config so Firebase/Google Places credentials come from env
 * vars (not committed) rather than being hardcoded into app.json. Read at
 * runtime via `expo-constants`'s `expoConfig.extra` (see
 * src/lib/env.ts).
 *
 * Brand imagery lives in ./assets/brand/ (see the UI overhaul plan). The
 * three source files are raw flattened rasters for now — the user swaps in
 * cleaned versions at the SAME paths later, so nothing here composites or
 * crops them:
 *   - amiva-icon-card.png     → splash / loading screen only
 *   - amiva-mobile-icon.png   → OS app icon only
 *   - amiva-mark-gradient.png → in-app branding (referenced from components)
 */
const CREAM = '#FBF8F0'; // theme token: --color-cream (light background)
const SURFACE_DARK = '#1B222C'; // theme token: --color-surface-dark

module.exports = {
  expo: {
    name: 'Amiva',
    slug: 'amiva',
    version: '0.1.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    icon: './assets/brand/amiva-mobile-icon.png',
    // TODO(brand): once a tightly-cropped, square, shadow-free icon master
    // exists, switch `icon` to the { light, dark, tinted } object form and
    // give dark/tinted a --color-surface-dark ground. Can't derive that
    // from a flat raster here.
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.amiva.app',
    },
    android: {
      package: 'com.amiva.app',
      adaptiveIcon: {
        foregroundImage: './assets/brand/amiva-mobile-icon.png',
        backgroundColor: CREAM,
      },
    },
    plugins: [
      'expo-image-picker',
      'expo-asset',
      'expo-font',
      [
        'expo-splash-screen',
        {
          image: './assets/brand/amiva-icon-card.png',
          imageWidth: 220,
          resizeMode: 'contain',
          backgroundColor: CREAM,
          dark: {
            image: './assets/brand/amiva-icon-card.png',
            backgroundColor: SURFACE_DARK,
          },
        },
      ],
    ],
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
