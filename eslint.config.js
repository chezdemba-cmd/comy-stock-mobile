// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // dist/* : build web. supabase/functions/* : code Deno (Edge Functions) avec
    // sa propre résolution de modules (specifiers `npm:`), à ne pas linter avec
    // la config de l'app Expo.
    ignores: ["dist/*", "supabase/functions/**"],
  }
]);
