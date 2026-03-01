// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  {
    extends: ["expo", "prettier"],
    plugins: ["prettier"],
    rules: {
      "prettier/prettier": "error",
    },
  },
  expoConfig,
  {
    ignores: ["dist/*"],
  }
]);
