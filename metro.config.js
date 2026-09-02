const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { getDefaultConfig } = require('expo/metro-config');

// getSentryExpoConfig() applique la config Metro par défaut d'Expo (getDefaultConfig)
// puis y ajoute ce qu'il faut pour que Sentry associe correctement les erreurs en
// production aux source maps (utile même sans upload configuré : évite une régression
// silencieuse le jour où l'upload sera activé).
// N'active l'intégration Metro Sentry que lorsque la configuration d'upload est
// réellement disponible. Le SDK continue de remonter les erreurs via son DSN ;
// ces variables servent uniquement à associer et envoyer les source maps.
const hasSentryBuildConfig = Boolean(process.env.SENTRY_ORG && process.env.SENTRY_PROJECT);
const config = hasSentryBuildConfig ? getSentryExpoConfig(__dirname) : getDefaultConfig(__dirname);

module.exports = config;
