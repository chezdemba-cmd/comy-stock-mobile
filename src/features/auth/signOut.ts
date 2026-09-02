import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/services/supabase';
import { queryClient, QUERY_CACHE_PERSIST_KEY } from '@/services/queryClient';
import { useCartStore } from '@/stores/cartStore';
import { useCompanyStore } from '@/stores/companyStore';
import { useSyncQueueStore } from '@/stores/syncQueueStore';

/**
 * Efface toute trace locale du compte courant. Appelée après une déconnexion
 * explicite ET sur l'événement SIGNED_OUT (expiration / échec de refresh du
 * token), pour qu'un appareil partagé ne laisse jamais le compte suivant voir
 * les données du précédent :
 *  - cache React Query (en mémoire + copie persistée dans AsyncStorage) ;
 *  - file de synchro hors-ligne, sinon ses mutations partiraient sous la
 *    session du compte suivant ;
 *  - panier de caisse en cours ;
 *  - boutique / entreprise active.
 */
export async function clearLocalSession(): Promise<void> {
  queryClient.clear();
  useSyncQueueStore.setState({ items: [] });
  useCartStore.getState().clear();
  useCompanyStore.getState().clear();

  // Les deux suppressions disque sont indépendantes et best-effort. Une panne
  // d'AsyncStorage ne doit jamais empêcher la purge mémoire ci-dessus ni
  // bloquer l'autre suppression persistée.
  await Promise.allSettled([
    useSyncQueueStore.persist.clearStorage(),
    AsyncStorage.removeItem(QUERY_CACHE_PERSIST_KEY),
  ]);
}

export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } finally {
    await clearLocalSession();
  }
}
