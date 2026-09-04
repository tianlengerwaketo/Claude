const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The Firebase JS SDK's package.json "exports" map isn't fully compatible
// with Metro's exports-aware resolution (a well-known issue as of Expo SDK
// 53+/Metro defaulting unstable_enablePackageExports to true) - it makes
// Metro resolve some Firebase submodules to browser-only builds that don't
// work in Hermes. Falling back to Metro's classic main-field resolution for
// everything, and treating .cjs as a source extension, fixes it.
config.resolver.unstable_enablePackageExports = false;
config.resolver.sourceExts.push('cjs');

module.exports = config;
