import { QueryClient } from '@tanstack/react-query';

// Clé AsyncStorage sous laquelle le cache React Query est persisté (voir
// OfflineSyncProvider). Exportée pour que la déconnexion (features/auth/signOut)
// puisse la purger sans dupliquer la chaîne.
export const QUERY_CACHE_PERSIST_KEY = 'comy-stock/query-cache';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Les données changent surtout via les mutations de l'app (qui invalident
      // déjà les clés concernées) : une courte fenêtre "fraîche" évite qu'un
      // simple retour d'écran ne relance un fetch sur une connexion lente.
      staleTime: 30_000,
      // Aligné sur le maxAge du persister (24 h) pour ne pas garder en mémoire
      // du cache que la couche de persistance considère déjà expiré.
      gcTime: 1000 * 60 * 60 * 24,
      retry: 2,
    },
  },
});
