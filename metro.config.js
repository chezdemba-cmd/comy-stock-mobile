const { getSentryExpoConfig } = require('@sentry/react-native/metro');

// getSentryExpoConfig() applique la config Metro par défaut d'Expo (getDefaultConfig)
// puis y ajoute ce qu'il faut pour que Sentry associe correctement les erreurs en
// production aux source maps (utile même sans upload configuré : évite une régression
// silencieuse le jour où l'upload sera activé).
const config = getSentryExpoConfig(__dirname);

module.exports = config;
