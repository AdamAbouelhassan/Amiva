module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4's worklets Babel plugin. `babel-preset-expo` normally
    // auto-adds this, but in THIS npm-workspaces monorepo it can't:
    // babel-preset-expo is hoisted to the root node_modules and its
    // `require.resolve('react-native-worklets')` runs from there, while
    // the package installs into apps/mobile/node_modules — so the preset
    // skips it and the app throws "Failed to create a worklet" at startup.
    // Adding it here works because this file resolves from apps/mobile.
    // MUST stay last. (Keep react-native-worklets pinned to 0.5.1 and
    // react-native-reanimated to 4.1.1 — Expo Go SDK 54's native versions.)
    plugins: ['react-native-worklets/plugin'],
  };
};
