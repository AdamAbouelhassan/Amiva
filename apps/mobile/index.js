/**
 * Explicit entry point, rather than the default `"node_modules/expo/AppEntry.js"`.
 * In this npm-workspaces monorepo, `expo` hoists to the repo root's
 * node_modules (not apps/mobile/node_modules), and AppEntry.js's own
 * relative import ('../../App') assumes it lives exactly two directories
 * under the project root — that assumption breaks under hoisting. A local
 * entry file with its own relative import to ./App sidesteps it entirely.
 */
import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);
