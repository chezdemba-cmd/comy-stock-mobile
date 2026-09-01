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
  useSyncQueueStore.persist.clearStorage();
  useSyncQueueStore.setState({ items: [] });
  useCartStore.getState().clear();
  useCompanyStore.getState().clear();

  try {
    await AsyncStorage.removeItem(QUERY_CACHE_PERSIST_KEY);
  } catch {
    // Purge best-effort : le queryClient.clear() en mémoire suffit à masquer les
    // données ; la copie disque restante sera de toute façon écrasée à la
    // prochaine connexion.
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  await clearLocalSession();
}
