/** @type {import('expo/config').ConfigContext['config']} */
module.exports = ({ config }) => {
  const hasSentryBuildConfig = Boolean(process.env.SENTRY_ORG && process.env.SENTRY_PROJECT);

  if (hasSentryBuildConfig) {
    return config;
  }

  return {
    ...config,
    plugins: (config.plugins ?? []).filter((plugin) => {
      const name = Array.isArray(plugin) ? plugin[0] : plugin;
      return name !== '@sentry/react-native';
    }),
  };
};
