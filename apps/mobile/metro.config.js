// Metro config for an npm-workspaces monorepo — see
// https://docs.expo.dev/guides/monorepos/. Missing this is what caused
// the "PlatformConstants could not be found" / empty native-module-
// registry crash on real devices: without it, Metro can end up resolving
// two different copies of react-native (one hoisted to the repo root,
// one nested), and the JS ends up reading from a different module
// instance than the one Expo Go's native side actually populated.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the whole monorepo (so changes to packages/core are picked up).
config.watchFolders = [workspaceRoot];

// Resolve node_modules from this project first, then the workspace root.
// Deliberately NOT setting disableHierarchicalLookup: true — that blocks
// Metro from finding legitimately-nested transitive dependencies (several
// expo-* packages depend on siblings that aren't hoisted to either of
// these two paths) and turned into unrelated whack-a-mole failures.
// watchFolders + nodeModulesPaths alone is the lower-risk half of the fix.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
