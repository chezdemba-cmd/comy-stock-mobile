import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

// Sans DSN (poste de dev sans compte Sentry configuré), on n'initialise rien : l'app
// démarre normalement, simplement sans remontée d'erreurs — voir .env.example. En
// production/preview, l'absence de DSN est une configuration manquante à corriger côté
// EAS (eas env:create), pas un cas normal : d'où l'avertissement hors __DEV__.
if (dsn) {
  Sentry.init({
    dsn,
    // Pas de tracesSampleRate : on veut la remontée de crashs/erreurs, pas le tracing
    // de performance (quota Sentry distinct, non demandé ici).
    sendDefaultPii: false,
  });
} else if (!__DEV__) {
  console.warn(
    '[sentry] EXPO_PUBLIC_SENTRY_DSN manquant : les erreurs ne remonteront pas en production.'
  );
}

export { Sentry };
