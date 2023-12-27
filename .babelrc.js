// .babelrc.js

/**
 * Config fragments to be used by all module
 * format environments
 */
const sharedPresets = ["@babel/preset-typescript"];
const sharedIgnoredFiles = ["*.test.ts"];
const sharedConfig = {
  ignore: sharedIgnoredFiles,
  presets: sharedPresets,
};

/**
 * Shared configs for bundles (ESM and UMD)
 */
const bundlePresets = [
  [
    "@babel/preset-env",
    {
      targets: "node 14",
      useBuiltIns: "usage",
      corejs: 3,
    },
  ],
  ...sharedPresets,
];

const bundleConfig = {
  ...sharedConfig,
  presets: bundlePresets,
};

/**
 * Babel Config
 */
module.exports = {
  env: {
    unBundled: sharedConfig,
    bundled: bundleConfig,
    test: {
      presets: ["@babel/preset-env", ...sharedPresets],
    },
  },
};
